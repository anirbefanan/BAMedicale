const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync(__dirname+'/backend.js','utf8');
function fixture(){
 const properties=new Map(),tabs=new Map(),acks=new Map();let locked=false,writes=0;
 const c={CacheService:{getScriptCache:()=>({get:k=>acks.get(k)||null,put:(k,v)=>acks.set(k,v)})},ContentService:{createTextOutput:text=>({text,setMimeType(){return this}}),MimeType:{JAVASCRIPT:'js'}},PropertiesService:{getScriptProperties:()=>({getProperty:k=>properties.get(k)??null,setProperty:(k,v)=>properties.set(k,v)})},LockService:{getScriptLock:()=>({tryLock:()=>{if(locked)return false;locked=true;return true},releaseLock:()=>{locked=false}})},Utilities:{formatDate:(_d,tz,fmt)=>{assert.equal(tz,'Asia/Jakarta');return fmt==='yyyy-MM-dd'?'2026-09-19':'09:00:00'}},SpreadsheetApp:{openById:()=>({getSheetById:id=>tabs.get(id)}),flush:()=>{}},HtmlService:{createHtmlOutput:text=>({text,setXFrameOptionsMode(){return this}}),XFrameOptionsMode:{ALLOWALL:'ALLOWALL'}}};
 vm.createContext(c);vm.runInContext(source,c);c.safeCell_=vm.runInContext('safeCell_',c);
 const headers=vm.runInContext('ATTENDANCE_HEADERS',c);
 function tab(id,rows){const t={rows,getLastRow:()=>rows.length,getMaxRows:()=>1000,getRange:(r,col,n=1,w=1)=>({getValues:()=>Array.from({length:n},(_,i)=>Array.from({length:w},(_,j)=>rows[r-1+i]?.[col-1+j]??'')),setNumberFormat(){return this},setValues(values){assert(locked,'writes must be locked');writes++;values.forEach((row,i)=>{rows[r-1+i]??=[];row.forEach((v,j)=>{rows[r-1+i][col-1+j]=typeof v==='string'&&v.startsWith("'")?v.slice(1):v})});return this}})};tabs.set(id,t);return t}
 properties.set('TRACKER_ID','fixture');properties.set('EVENTS_TAB_ID','99');
 const events=tab(99,[[],['first','First','2026-09-19','2026-09-19',1,'','OPEN'],['second','Second','2026-09-19','2026-09-19 Other',2,'','OPEN']]);
 const first=tab(1,[Array.from(headers)]),second=tab(2,[Array.from(headers)]);properties.set('EVENT_first','1');properties.set('EVENT_second','2');
 const payload={event_id:'first',request_id:'a'.repeat(32),origin:'https://bamedicale.com',full_name:'Test Participant',email:' Test.Name+alias@example.invalid ',instagram:true,youtube:true,score:'4',feedback:'',website:''};
 return{c,payload,first,second,events,lock:()=>{locked=true},writes:()=>writes};
}
test('server validates required values, true confirmations, bounds and allowed fields',()=>{const{c,payload:p}=fixture();assert(c.validate_(p));for(const patch of [{full_name:' '},{email:'invalid'},{instagram:'true'},{youtube:false},{score:'6'},{score:''},{feedback:'x'.repeat(301)},{website:'bot'},{tab:'arbitrary'},{event_id:'../../arbitrary'}])assert.equal(c.validate_({...p,...patch}),false);});
test('duplicate acknowledgement preserves manual certificate fields and aliases',()=>{const{c,payload:p,first}=fixture();assert.equal(c.record_(p),'recorded');first.rows[1][8]='Sent';first.rows[1][11]='Keep';assert.equal(c.record_({...p,email:p.email.trim().toLowerCase()}),'duplicate');assert.equal(first.rows.length,2);assert.equal(first.rows[1][8],'Sent');assert.equal(first.rows[1][11],'Keep');assert.equal(c.record_({...p,email:'TestName+alias@example.invalid'}),'recorded');assert.equal(c.record_({...p,email:'Test.Name+other@example.invalid'}),'recorded');});
test('same email and same-date events stay in separately mapped numeric tabs',()=>{const{c,payload:p,first,second,events}=fixture();assert.equal(c.record_(p),'recorded');assert.equal(c.record_({...p,event_id:'second'}),'recorded');assert.equal(first.rows.length,2);assert.equal(second.rows.length,2);events.rows[1][3]='Renamed tab';assert.equal(c.record_(p),'duplicate');events.rows[1][4]=2;assert.equal(c.record_(p),'CLOSED_INVALID');});
test('closed events and lock contention never write',()=>{const f=fixture();f.events.rows[1][6]='CLOSED';assert.equal(f.c.record_(f.payload),'FORCED_CLOSED');f.lock();assert.equal(f.c.record_({...f.payload,event_id:'second'}),'retry');assert.equal(f.writes(),0);});
test('formula strings are escaped and retries preserve the existing row',()=>{const{c,payload:p,first}=fixture();assert.equal(c.record_({...p,full_name:'=IMPORTXML("x")',feedback:' +123'}),'recorded');assert.equal(c.safeCell_('=1'),"'=1");assert.equal(first.rows[1][3],'=IMPORTXML("x")');assert.equal(c.record_(p),'duplicate');});
test('read-only acknowledgement returns only correlated status after persistence',()=>{const{c,payload:p,first}=fixture();const q={...p,callback:'baAttendance_'+p.request_id,action:'ack'};assert(c.doGet({parameter:q}).text.includes('waiting'));const raw=JSON.stringify(p);c.doPost({postData:{length:raw.length},parameters:{payload:[raw]},parameter:{payload:raw}});assert.equal(first.rows.length,2);const reply=c.doGet({parameter:q}).text;assert(reply.includes('recorded'));assert(!reply.includes(p.email));assert(!reply.includes(p.full_name));assert.equal(c.reply_({...q,callback:'alert'},'recorded').text,'Request unavailable.');assert.equal(c.reply_({...q,origin:'https://evil.invalid'},'recorded').text,'Request unavailable.');assert.equal(c.doPost({postData:{length:17000},parameters:{}}).text,'Request unavailable.');assert.equal(first.rows.length,2);});

 test('WIB AUTO boundaries, overrides and invalid configurations fail safely',()=>{
 const {c}=fixture(),start='2026-09-19 08:45',end='2026-09-19 23:59';
 const resolve=(at,override='AUTO',a=start,b=end)=>c.resolveSchedule_(override,a,b,Date.parse(at));
 for(const [at,state] of [['2026-09-19T01:44:59Z','CLOSED_BEFORE'],['2026-09-19T01:45:00Z','OPEN'],['2026-09-19T08:00:00Z','OPEN'],['2026-09-19T16:58:59Z','OPEN'],['2026-09-19T16:59:00Z','CLOSED_AFTER'],['2026-09-20T00:00:00Z','CLOSED_AFTER']])assert.equal(resolve(at).state,state);
 assert.equal(resolve('2026-09-01T00:00:00Z','OPEN').state,'FORCED_OPEN');
 assert.equal(resolve('2026-09-19T02:00:00Z','CLOSED').state,'FORCED_CLOSED');
 assert.equal(resolve('2026-09-19T02:00:00Z').state,'OPEN');
 for(const [a,b] of [['',end],[start,''],['2026-02-30 08:45',end],[end,start],[start,start],['19/09/2026',end]])assert.equal(resolve('2026-09-19T02:00:00Z','AUTO',a,b).state,'CLOSED_INVALID');
 assert.equal(resolve('2026-09-19T02:00:00Z','invalid').open,false);
 assert.equal(c.scheduleTime_(new Date('2026-09-19T01:45:00Z')),Date.parse('2026-09-19T01:45:00Z'));
 });
 test('editing private configuration takes effect on status and writes without deployment',()=>{
 const {c,events,payload:p,first}=fixture();events.rows[1][6]='AUTO';events.rows[1][7]='2099-09-19 08:45';events.rows[1][8]='2099-09-19 23:59';
 assert.equal(c.record_(p),'CLOSED_BEFORE');assert.equal(first.rows.length,1);
 const q={...p,callback:'baAttendance_'+p.request_id,action:'status'};
 const before=c.doGet({parameter:q}).text;assert(before.includes('CLOSED_BEFORE'));assert(before.includes('opens_at'));assert(!before.includes('tab'));
 events.rows[1][6]='OPEN';assert(c.doGet({parameter:q}).text.includes('FORCED_OPEN'));assert.equal(c.record_(p),'recorded');assert.equal(c.record_(p),'duplicate');
 events.rows[1][6]='CLOSED';assert.equal(c.record_(p),'FORCED_CLOSED');events.rows[1][6]='AUTO';assert.equal(c.record_(p),'CLOSED_BEFORE');assert.equal(first.rows.length,2);
 });

test('late JSONP response is harmless after the browser callback has been removed',()=>{
 const {c,payload:p}=fixture(),q={...p,callback:'baAttendance_'+p.request_id};
 const response=c.reply_(q,'FORCED_CLOSED').text;
 assert.doesNotThrow(()=>vm.runInNewContext(response,{}));
 let received;vm.runInNewContext(response,{[q.callback]:m=>{received=m}});assert.equal(received.status,'FORCED_CLOSED');
});
