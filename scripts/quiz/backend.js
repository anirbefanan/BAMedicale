/* Apps Script server module. Real answer keys live ONLY in private Script Properties. */
const QUIZ_HEADERS = ['Date Submitted','Time Submitted','Email','Correct Answers','Total Questions','Result %','Time Taken Seconds','Quiz Status','Session ID','Submitted At'];
const QUIZ_SESSION_HEADERS = ['Event ID','Email','Start Request','Session ID','Started At'];
const QUIZ_CONTROL_HEADERS = ['Event ID','State','Result Tab ID'];
const QUIZ_DURATION = 180000, QUIZ_GRACE = 5000;
function quizConfig_(id) {
  if(!/^[a-z0-9-]{1,100}$/.test(id||''))return null;
  const raw=props_().getProperty('QUIZ_KEY_'+id); if(!raw)return null;
  const key=JSON.parse(raw); if(!Array.isArray(key)||key.length!==5||key.some(x=>!Number.isInteger(x)||x<0||x>3))return null;
  const ss=SpreadsheetApp.openById(props_().getProperty('TRACKER_ID'));
  const control=ss.getSheetByName('Quiz Control'); if(!control||control.getLastRow()<2)return null;
  const row=control.getRange(2,1,control.getLastRow()-1,3).getValues().find(r=>r[0]===id);
  if(!row)return null;
  const sheet=ss.getSheetById(Number(row[2])),sessions=ss.getSheetByName('Quiz Sessions');
  if(!sheet||!sessions)return null;
  return {id,key,sheet,sessions,open:row[1]==='OPEN'};
}
/* Owner-only provisioning. Set QUIZ_KEY_<event-id> privately before running. */
function setupQuiz() {
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  assert_(ss&&ss.getId()===props_().getProperty('TRACKER_ID'),'Use the existing bound tracker.');
  assert_(Session.getEffectiveUser().getEmail()===props_().getProperty('OWNER'),'Owner only.');
  assert_(DriveApp.getFileById(ss.getId()).getSharingAccess()===DriveApp.Access.PRIVATE,'Keep tracker Restricted.');
  const lock=LockService.getScriptLock();lock.waitLock(10000);
  try {
    const id='management-thyroid-nodules-2026';
    const key=JSON.parse(props_().getProperty('QUIZ_KEY_'+id)||'null');
    assert_(Array.isArray(key)&&key.length===5&&key.every(n=>Number.isInteger(n)&&n>=0&&n<4),'Set the verified private answer key first.');
    const control=ss.getSheetByName('Quiz Control')||ss.insertSheet('Quiz Control');header_(control,QUIZ_CONTROL_HEADERS);
    const sessions=ss.getSheetByName('Quiz Sessions')||ss.insertSheet('Quiz Sessions');header_(sessions,QUIZ_SESSION_HEADERS);
    const sheet=ss.getSheetByName('Games19Sept')||ss.insertSheet('Games19Sept');header_(sheet,QUIZ_HEADERS);
    const rows=control.getLastRow()>1?control.getRange(2,1,control.getLastRow()-1,3).getValues():[];
    const existing=rows.find(r=>r[0]===id);
    assert_(!existing||Number(existing[2])===sheet.getSheetId(),'Preserve existing quiz mapping.');
    if(!existing)control.appendRow([id,'CLOSED',sheet.getSheetId()]);
    [control,sessions,sheet].forEach(tab=>{tab.setFrozenRows(1);tab.setColumnWidths(1,tab.getLastColumn(),170);tab.getRange(1,1,1,tab.getLastColumn()).setFontWeight('bold').setBackground('#981d36').setFontColor('#ffffff');if(!tab.getFilter())tab.getRange(1,1,tab.getMaxRows(),tab.getLastColumn()).createFilter();});
    control.setColumnWidth(1,330);sheet.setColumnWidth(3,280);sessions.setColumnWidth(2,280);
    control.getRange(2,2,control.getMaxRows()-1,1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['OPEN','CLOSED'],true).setAllowInvalid(false).build());
    SpreadsheetApp.flush();
  }finally{lock.releaseLock();}
}
function quizRows_(sheet,cols){return sheet.getLastRow()>1?sheet.getRange(2,1,sheet.getLastRow()-1,cols).getValues():[];}
function quizEmail_(value){return String(value).replace(/^'/,'').trim().toLowerCase();}
function quizMask_(email){const [local,domain]=quizEmail_(email).split('@');return local.slice(0,Math.min(2,Math.max(1,local.length-1)))+'***@'+domain;}
function quizResult_(row){return {status:'completed',correct:Number(row[3]),total:5,percentage:Number(row[5]),elapsed:Number(row[6])};}
function quizScore_(answers,key,elapsed){return elapsed>QUIZ_DURATION+QUIZ_GRACE?0:answers.reduce((n,a,i)=>n+(a===key[i]?1:0),0);}
function quizLeaderboard_(rows){return rows.filter(r=>r[7]==='Completed').sort((a,b)=>Number(b[5])-Number(a[5])||Number(a[6])-Number(b[6])||Number(a[9])-Number(b[9])).slice(0,5).map((r,i)=>({rank:i+1,email:quizMask_(r[2]),percentage:Number(r[5]),elapsed:Number(r[6])}));}
function quizValidate_(p){
  if(!p||typeof p!=='object'||Array.isArray(p)||p.origin!==SITE_ORIGIN||!/^quiz_(start|resume|submit)$/.test(p.action||'')||!/^[a-f0-9]{32}$/.test(p.request_id||'')||!/^[a-z0-9-]{1,100}$/.test(p.event_id||''))return false;
  const allowed=['action','origin','event_id','request_id',...(p.action==='quiz_start'?['email','start_id']:['token']),...(p.action==='quiz_submit'?['answers']:[])];
  if(Object.keys(p).some(k=>!allowed.includes(k)))return false;
  if(p.action==='quiz_start')return typeof p.email==='string'&&p.email.length<=254&&p.email.trim().split('@')[0].length<=64&&/^[^\s@<>\x00-\x1f]+@[^\s@<>.]+(?:\.[^\s@<>.]+)+$/.test(p.email.trim())&&/^[a-f0-9]{32}$/.test(p.start_id||'');
  if(!/^[a-f0-9]{64}$/.test(p.token||''))return false;
  return p.action!=='quiz_submit'||Array.isArray(p.answers)&&p.answers.length===5&&p.answers.every(n=>n===null||Number.isInteger(n)&&n>=0&&n<4);
}
function quizRecord_(p){
  if(!quizValidate_(p))return {status:'invalid'};
  const lock=LockService.getScriptLock();if(!lock.tryLock(10000))return {status:'retry'};
  try{
    const q=quizConfig_(p.event_id);if(!q)return {status:'closed'};
    const results=quizRows_(q.sheet,10),sessions=quizRows_(q.sessions,5);
    let session;
    if(p.action==='quiz_start'){
      const email=normalizedEmail_(p.email);
      if(results.some(r=>quizEmail_(r[2])===email))return {status:'already_completed'};
      session=sessions.find(r=>r[0]===q.id&&quizEmail_(r[1])===email);
      if(session&&session[2]!==p.start_id)return {status:'already_started'};
      if(!q.open)return {status:'closed'};
      if(!session){
        if(sessions.length>=20000)return {status:'retry'};
        session=[q.id,safeCell_(email),p.start_id,(Utilities.getUuid()+Utilities.getUuid()).replace(/-/g,''),Date.now()];
        q.sessions.appendRow(session);SpreadsheetApp.flush();
      }
    }else session=sessions.find(r=>r[0]===q.id&&r[3]===p.token);
    if(!session)return {status:'invalid'};
    const existing=results.find(r=>r[8]===session[3]);if(existing)return quizResult_(existing);
    const now=Date.now(),elapsed=now-Number(session[4]);
    if(p.action!=='quiz_submit'&&elapsed<=QUIZ_DURATION+QUIZ_GRACE)return {status:'active',token:session[3],startedAt:Number(session[4]),deadline:Number(session[4])+QUIZ_DURATION,serverNow:now};
    // Expired sessions cannot gain extra answering time; late retries return the stored result.
    const correct=quizScore_(p.action==='quiz_submit'?p.answers:[null,null,null,null,null],q.key,elapsed);
    const row=[Utilities.formatDate(new Date(now),'Asia/Jakarta','yyyy-MM-dd'),Utilities.formatDate(new Date(now),'Asia/Jakarta','HH:mm:ss'),session[1],correct,5,correct*20,Math.min(180,Math.max(0,elapsed/1000)), 'Completed',session[3],now];
    q.sheet.appendRow(row);SpreadsheetApp.flush();
    return quizResult_(row);
  }finally{lock.releaseLock();}
}
function quizPost_(p){
  const result=quizRecord_(p);
  if(quizValidate_(p))CacheService.getScriptCache().put('QUIZ_ACK_'+p.request_id,JSON.stringify(result),180);
  return ContentService.createTextOutput('Request processed.');
}
function quizGet_(p){
  if(!p||p.origin!==SITE_ORIGIN||!/^[a-f0-9]{32}$/.test(p.request_id||'')||p.callback!=='baQuiz_'+p.request_id||Object.keys(p).some(k=>!['action','origin','event_id','request_id','callback'].includes(k)))return ContentService.createTextOutput('Request unavailable.');
  let result={status:'retry'};
  try{
    if(p.action==='quiz_ack')result=JSON.parse(CacheService.getScriptCache().get('QUIZ_ACK_'+p.request_id)||'{"status":"waiting"}');
    else {const q=quizConfig_(p.event_id);if(p.action==='quiz_status')result={status:q&&q.open?'open':'closed'};else if(p.action==='quiz_top')result={status:'ok',players:q?quizLeaderboard_(quizRows_(q.sheet,10)):[]};}
  }catch(_){}
  if(result.status==='active')result.serverNow=Date.now();
  return ContentService.createTextOutput('typeof '+p.callback+'==="function"&&'+p.callback+'('+JSON.stringify(result)+');').setMimeType(ContentService.MimeType.JAVASCRIPT);
}
