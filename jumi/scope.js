(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports)module.exports=api;
  if(root)root.JUMI_SCOPE=api;
})(typeof window!=="undefined"?window:null,function(){
  "use strict";
  const TZ_OFFSET="+07:00";
  const excludedStates=new Set(["cancelled","canceled","draft","unpublished"]);
  const email=value=>String(value||"").trim().toLowerCase();
  const timestamp=value=>{
    const text=String(value||"").trim();
    if(!text)return NaN;
    const normalized=/^\d{4}-\d{2}-\d{2}$/.test(text)?`${text}T00:00:00${TZ_OFFSET}`:/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(text)?`${text}${TZ_OFFSET}`:text;
    return Date.parse(normalized);
  };
  const endOfJakartaDay=start=>{const local=new Date(start+7*3600000);return Date.UTC(local.getUTCFullYear(),local.getUTCMonth(),local.getUTCDate(),16,59,59,999);};
  function classifyEvent(event,now=Date.now()){
    const state=String(event?.lifecycle||"").trim().toLowerCase();
    if(!event?.id||!event?.title||excludedStates.has(state))return"excluded";
    const start=timestamp(event.startAt);if(!Number.isFinite(start))return"excluded";
    if(state==="completed")return"completed";
    const parsedEnd=timestamp(event.endAt),end=Number.isFinite(parsedEnd)&&parsedEnd>start?parsedEnd:endOfJakartaDay(start);
    if(now<start)return"upcoming";
    if(now>=end)return"completed";
    return"live";
  }
  const validEvents=(data,now)=>((data&&data.events)||[]).filter(event=>classifyEvent(event,now)!=="excluded");
  const draftEvents=data=>((data&&data.events)||[]).filter(event=>classifyEvent(event,Date.now())==="excluded");
  const selectedEvents=(data,scope,now)=>validEvents(data,now).filter(event=>scope==="all"||classifyEvent(event,now)===scope);
  const countStatus=(rows,key,value)=>rows.filter(row=>String(row[key]||"")===value).length;
  const uniqueEmails=rows=>new Set(rows.map(row=>email(row.email)).filter(Boolean));
  const certificateProgress=new Set(["Eligible","Generated","Approved","Sent","Failed"]);
  const conversion=(current,previous)=>previous>0?Math.round(current/previous*100):null;
  function journeyStages(rows,commercial){
    const active=rows.filter(row=>row.registrationStatus!=="Cancelled"),stage=(key,label,records)=>({key,label,count:records.length});
    let stages;
    if(commercial==="Paid"){
      const submitted=active.filter(row=>["Submitted","Registered"].includes(row.registrationStatus)),paid=submitted.filter(row=>row.paymentStatus==="Paid"),registered=paid.filter(row=>row.registrationStatus==="Registered"),attended=registered.filter(row=>row.attendanceStatus==="Attended"),eligible=attended.filter(row=>certificateProgress.has(row.certificateStatus)),sent=eligible.filter(row=>row.certificateStatus==="Sent");
      stages=[stage("submitted","Submitted",submitted),stage("paid","Paid",paid),stage("registered","Registered",registered),stage("attended","Attended",attended),stage("eligible","Certificate Eligible",eligible),stage("sent","Certificate Sent",sent)];
    }else{
      const registered=active.filter(row=>row.registrationStatus==="Registered"),attended=registered.filter(row=>row.attendanceStatus==="Attended"),eligible=attended.filter(row=>certificateProgress.has(row.certificateStatus)),sent=eligible.filter(row=>row.certificateStatus==="Sent");
      stages=[stage("registered","Registered",registered),stage("attended","Attended",attended),stage("eligible","Certificate Eligible",eligible),stage("sent","Certificate Sent",sent)];
    }
    return stages.map((item,index)=>{const previous=index?stages[index-1].count:null;return{...item,conversion:index?conversion(item.count,previous):null,dropOff:index&&previous>item.count?previous-item.count:0};});
  }
  function participantJourneys(events,registrants){
    return["Free","Paid"].flatMap(commercial=>{const eventIds=new Set(events.filter(event=>event.commercial===commercial).map(event=>event.id));if(!eventIds.size)return[];const rows=registrants.filter(row=>eventIds.has(row.eventId));return[{commercial,label:`${commercial} seminar${eventIds.size===1?"":"s"}`,eventCount:eventIds.size,participantCount:rows.filter(row=>row.registrationStatus!=="Cancelled").length,stages:journeyStages(rows,commercial)}];});
  }
  function operationalSignals(data,events,registrants,quizResults,metrics,now){
    const signals=[],eventMap=new Map(events.map(event=>[event.id,event])),classification=row=>{const event=eventMap.get(row.eventId);return event?classifyEvent(event,now):"excluded";};
    const confirmationOutstanding=registrants.filter(row=>row.registrationStatus==="Registered"&&classification(row)!=="completed"&&(!row.confirmationStatus||row.confirmationStatus==="Not Sent")).length;
    if(confirmationOutstanding)signals.push({kind:"attention",label:"Confirmations need attention",value:confirmationOutstanding,detail:integrationUnavailable(data,"email")?"Registered participants are waiting; the email provider is not connected.":"Registered participants still have Not Sent confirmation status."});
    const pendingPayments=registrants.filter(row=>row.paymentStatus==="Pending").length;
    if(pendingPayments)signals.push({kind:"attention",label:"Payments awaiting review",value:pendingPayments,detail:"Payment status remains Pending."});
    const freeSubmitted=registrants.filter(row=>eventMap.get(row.eventId)?.commercial==="Free"&&row.registrationStatus==="Submitted").length;
    if(freeSubmitted)signals.push({kind:"warning",label:"Free registrations need review",value:freeSubmitted,detail:"Free seminar records should normally progress directly to Registered."});
    const attendanceReview=registrants.filter(row=>row.registrationStatus==="Registered"&&classification(row)==="completed"&&["Not Checked","Pending Validation"].includes(row.attendanceStatus)).length;
    if(attendanceReview)signals.push({kind:"attention",label:"Attendance needs validation",value:attendanceReview,detail:"Completed-event registrations still need an attendance decision."});
    const eligibilityGap=registrants.filter(row=>row.attendanceStatus==="Attended"&&row.certificateStatus==="Not Eligible").length;
    if(eligibilityGap)signals.push({kind:"warning",label:"Eligibility review needed",value:eligibilityGap,detail:"Attended participants remain marked Not Eligible."});
    const certificatesOutstanding=registrants.filter(row=>["Eligible","Generated","Approved","Failed"].includes(row.certificateStatus)).length;
    if(certificatesOutstanding)signals.push({kind:"attention",label:"Certificates not yet sent",value:certificatesOutstanding,detail:"Eligible or prepared certificate records have not reached Sent."});
    if(metrics.quizParticipants&&metrics.totalDoctors){const rate=Math.round(metrics.quizParticipants/metrics.totalDoctors*100);signals.push({kind:"info",label:"Quiz engagement",value:`${rate}%`,detail:`${metrics.quizParticipants} of ${metrics.totalDoctors} scoped doctors participated.`});}
    return signals.slice(0,6);
  }
  function integrationUnavailable(data,name){return String(data?.integrations?.[name]||"Not Connected")!=="Connected";}
  function resolveDownloads(data,eventIds){return((data&&data.downloads)||[]).filter(row=>row.eventId&&eventIds.has(row.eventId));}
  function communityFor(registrants,quizzes,downloads){
    const identities=new Map();
    const ensure=(mail,row={})=>{if(mail&&!identities.has(mail))identities.set(mail,{name:row.name||"Not available",email:mail});return identities.get(mail);};
    registrants.forEach(row=>ensure(email(row.email),row));quizzes.forEach(row=>ensure(email(row.email)));downloads.forEach(row=>ensure(email(row.email)));
    return[...identities.values()].map(identity=>{
      const records=registrants.filter(row=>email(row.email)===identity.email),quizRows=quizzes.filter(row=>email(row.email)===identity.email),downloadRows=downloads.filter(row=>email(row.email)===identity.email),eventCount=new Set(records.map(row=>row.eventId).filter(Boolean)).size;
      const engagement=records.map(row=>row.registeredAt).concat(quizRows.map(row=>row.completedAt),downloadRows.map(row=>row.downloadedAt)).filter(Boolean).map(String).sort();
      return{...identity,eventsRegistered:eventCount,eventsAttended:new Set(records.filter(row=>row.attendanceStatus==="Attended").map(row=>row.eventId)).size,paidEvents:new Set(records.filter(row=>row.paymentStatus==="Paid").map(row=>row.eventId)).size,certificates:records.filter(row=>row.certificateStatus&&row.certificateStatus!=="Not Eligible").length,quizParticipation:quizRows.length,downloads:downloadRows.length,firstSeen:engagement[0]||"",lastEngagement:engagement.at(-1)||"",returning:eventCount>1};
    }).sort((a,b)=>String(a.name).localeCompare(String(b.name)));
  }
  function monthOverMonth(registrants){
    const months=new Map();registrants.forEach(row=>{const time=timestamp(row.registeredAt);if(!Number.isFinite(time))return;const date=new Date(time+7*3600000),key=`${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,"0")}`;months.set(key,(months.get(key)||0)+1);});
    const ordered=[...months].sort(([a],[b])=>a.localeCompare(b));if(ordered.length<2)return null;const previous=ordered.at(-2)[1],current=ordered.at(-1)[1];return previous?Math.round((current-previous)/previous*100):null;
  }
  function buildSnapshot(data,scope="all",now=Date.now()){
    const events=selectedEvents(data,scope,now),eventIds=new Set(events.map(event=>event.id)),registrants=((data&&data.registrants)||[]).filter(row=>eventIds.has(row.eventId)),quizResults=((data&&data.quizResults)||[]).filter(row=>eventIds.has(row.eventId)),downloads=resolveDownloads(data,eventIds),community=communityFor(registrants,quizResults,downloads),people=uniqueEmails(registrants.concat(quizResults,downloads));
    const metrics={totalEvents:events.length,upcomingEvents:events.filter(event=>classifyEvent(event,now)==="upcoming").length,totalDoctors:people.size,activeDoctors:people.size,totalRegistrations:registrants.length,submitted:countStatus(registrants,"registrationStatus","Submitted"),registered:countStatus(registrants,"registrationStatus","Registered"),paid:countStatus(registrants,"paymentStatus","Paid"),pendingPayment:countStatus(registrants,"paymentStatus","Pending"),confirmationsSent:registrants.filter(row=>["Sent","Delivered"].includes(row.confirmationStatus)).length,attended:countStatus(registrants,"attendanceStatus","Attended"),attendanceChecked:registrants.filter(row=>row.attendanceStatus&&row.attendanceStatus!=="Not Checked").length,notAttended:countStatus(registrants,"attendanceStatus","Not Attended"),attendancePending:countStatus(registrants,"attendanceStatus","Pending Validation"),certificateEligible:countStatus(registrants,"certificateStatus","Eligible"),certificatesSent:countStatus(registrants,"certificateStatus","Sent"),certificateNotEligible:countStatus(registrants,"certificateStatus","Not Eligible"),certificateGenerated:countStatus(registrants,"certificateStatus","Generated"),certificateApproved:countStatus(registrants,"certificateStatus","Approved"),certificateFailed:countStatus(registrants,"certificateStatus","Failed"),quizParticipants:uniqueEmails(quizResults).size,materialDownloads:downloads.length};
    const journeys=participantJourneys(events,registrants);
    const perEvent=events.map(event=>({label:event.title,value:registrants.filter(row=>row.eventId===event.id).length})),max=Math.max(0,...perEvent.map(row=>row.value)),eventComparison=perEvent.length>1?perEvent.map(row=>({...row,percent:max?Math.round(row.value/max*100):0})):[];
    const paidDenominator=metrics.paid+metrics.pendingPayment,reports={registrationAttendancePercent:metrics.registered?Math.round(metrics.attended/metrics.registered*100):null,paidConversionPercent:paidDenominator?Math.round(metrics.paid/paidDenominator*100):null,freeEvents:events.filter(event=>event.commercial==="Free").length,paidEvents:events.filter(event=>event.commercial==="Paid").length,newDoctors:community.filter(row=>!row.returning).length,returningDoctors:community.filter(row=>row.returning).length,repeatAttendees:community.filter(row=>row.eventsAttended>1).length,quizParticipation:metrics.quizParticipants,materialDownloads:metrics.materialDownloads,certificateEligible:metrics.certificateEligible,certificatesSent:metrics.certificatesSent,eventComparison,monthOverMonth:monthOverMonth(registrants)};
    const signals=operationalSignals(data,events,registrants,quizResults,metrics,now);
    const toolsByEvent=Object.fromEntries(events.map(event=>{const eventQuiz=quizResults.filter(row=>row.eventId===event.id);return[event.id,{registrants:registrants.filter(row=>row.eventId===event.id).length,attendance:registrants.filter(row=>row.eventId===event.id&&row.attendanceStatus==="Attended").length,baQuiz:eventQuiz.filter(row=>row.channel==="BA Medicale").length,lmsQuiz:eventQuiz.filter(row=>row.channel==="LMS").length,materials:downloads.filter(row=>row.eventId===event.id).length,certificates:registrants.filter(row=>row.eventId===event.id&&row.certificateStatus!=="Not Eligible").length}];}));
    return{scope,events,registrants,quizResults,downloads,community,metrics,journeys,reports,signals,toolsByEvent};
  }
  return{timestamp,classifyEvent,validEvents,draftEvents,selectedEvents,buildSnapshot};
});
