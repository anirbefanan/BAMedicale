const test = require("node:test");
const assert = require("node:assert/strict");
const scope = require("../../jumi/scope.js");

const now = Date.parse("2026-09-19T11:00:00+07:00");
const data = {
  events: [
    {id:"completed",title:"Completed",startAt:"2026-09-18T09:00:00+07:00",endAt:"2026-09-18T11:00:00+07:00",commercial:"Free",lifecycle:"Completed"},
    {id:"live",title:"Live",startAt:"2026-09-19T10:00:00+07:00",endAt:"2026-09-19T13:00:00+07:00",commercial:"Paid",lifecycle:"Published"},
    {id:"upcoming",title:"Upcoming",startAt:"2026-09-20T10:00:00+07:00",endAt:"2026-09-20T13:00:00+07:00",commercial:"Free",lifecycle:"Published"},
    {id:"draft",title:"Draft",startAt:"2026-09-21T10:00:00+07:00",endAt:"2026-09-21T11:00:00+07:00",lifecycle:"Draft"},
    {id:"cancelled",title:"Cancelled",startAt:"2026-09-19T10:00:00+07:00",endAt:"2026-09-19T13:00:00+07:00",lifecycle:"Cancelled"},
    {id:"missing-date",title:"Missing date",lifecycle:"Published"}
  ],
  registrants: [
    {id:"r1",eventId:"completed",email:"a@example.test",registrationStatus:"Registered",paymentStatus:"Not Required",confirmationStatus:"Delivered",attendanceStatus:"Attended",certificateStatus:"Sent",registeredAt:"2026-09-01T10:00:00+07:00"},
    {id:"r2",eventId:"live",email:"a@example.test",registrationStatus:"Registered",paymentStatus:"Paid",confirmationStatus:"Sent",attendanceStatus:"Not Checked",certificateStatus:"Eligible",registeredAt:"2026-09-02T10:00:00+07:00"},
    {id:"r3",eventId:"upcoming",email:"b@example.test",registrationStatus:"Submitted",paymentStatus:"Pending",confirmationStatus:"Not Sent",attendanceStatus:"Not Checked",certificateStatus:"Not Eligible",registeredAt:"2026-09-03T10:00:00+07:00"},
    {id:"r4",eventId:"draft",email:"draft@example.test",registrationStatus:"Registered",paymentStatus:"Paid",attendanceStatus:"Attended",certificateStatus:"Sent"}
  ],
  quizResults:[{eventId:"completed",email:"a@example.test",channel:"BA Medicale"},{eventId:"upcoming",email:"b@example.test",channel:"LMS"}],
  downloads:[{eventId:"completed",email:"a@example.test",status:"Downloaded"}],
  integrations:{sheets:"Connected",drive:"Connected",email:"Not Connected",whatsapp:"Not Connected",publisher:"Not Connected"}
};

test("event classification uses Jakarta boundaries and excludes unsafe records",()=>{
  assert.equal(scope.classifyEvent({id:"start",title:"Start",startAt:"2026-09-19T10:00:00+07:00",endAt:"2026-09-19T13:00:00+07:00",lifecycle:"Published"},Date.parse("2026-09-19T10:00:00+07:00")),"live");
  assert.equal(scope.classifyEvent({id:"end",title:"End",startAt:"2026-09-19T10:00:00+07:00",endAt:"2026-09-19T13:00:00+07:00",lifecycle:"Published"},Date.parse("2026-09-19T13:00:00+07:00")),"completed");
  assert.equal(scope.classifyEvent({id:"day",title:"Day",startAt:"2026-09-19",lifecycle:"Published"},Date.parse("2026-09-19T23:59:00+07:00")),"live");
  assert.equal(scope.classifyEvent({id:"multi",title:"Multi",startAt:"2026-09-18T09:00:00+07:00",endAt:"2026-09-20T09:00:00+07:00",lifecycle:"Published"},now),"live");
  assert.equal(scope.classifyEvent(data.events[3],now),"excluded");
  assert.equal(scope.classifyEvent(data.events[4],now),"excluded");
  assert.equal(scope.classifyEvent(data.events[5],now),"excluded");
});

test("scope transitions rebuild every dependent value without stale data",()=>{
  const all=scope.buildSnapshot(data,"all",now),upcoming=scope.buildSnapshot(data,"upcoming",now),live=scope.buildSnapshot(data,"live",now),completed=scope.buildSnapshot(data,"completed",now),restored=scope.buildSnapshot(data,"all",now);
  assert.deepEqual(all.events.map(e=>e.id),["completed","live","upcoming"]);
  assert.deepEqual(upcoming.events.map(e=>e.id),["upcoming"]);
  assert.equal(upcoming.metrics.totalRegistrations,1);
  assert.equal(upcoming.funnel.submitted,1);
  assert.equal(upcoming.reports.registrationAttendancePercent,null);
  assert.deepEqual(live.events.map(e=>e.id),["live"]);
  assert.equal(live.metrics.paid,1);
  assert.equal(live.metrics.pendingPayment,0);
  assert.deepEqual(completed.events.map(e=>e.id),["completed"]);
  assert.equal(completed.metrics.attended,1);
  assert.equal(completed.metrics.certificatesSent,1);
  assert.deepEqual(restored.metrics,all.metrics);
  assert.equal(all.metrics.totalRegistrations,3);
  assert.equal(all.community.length,2);
  assert.equal(all.reports.registrationAttendancePercent,50);
  assert.equal(all.reports.returningDoctors,1);
  assert.equal(all.reports.repeatAttendees,0);
  assert.equal(all.metrics.quizParticipants,2);
});
