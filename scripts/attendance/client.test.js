const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');

// Exercise the actual client with a simulated Google status reply, without sending attendee data.
function page(){
  const element=()=>({listeners:{},hidden:false,textContent:'',value:'',checked:false,
    addEventListener(type,fn){this.listeners[type]=fn},setAttribute(){},focus(){this.focused=true},
    append(){},remove(){},setCustomValidity(){}});
  const submit=element(),status=element(),actionStatus=element(),retry=element(),form=element();
  for(const name of ['full_name','email','instagram','youtube','score','feedback','website'])form[name]=element();
  form.querySelector=s=>s==='[type=submit]'?submit:element();
  form.reportValidity=()=>{form.validated=true;return false};
  const root=element();root.dataset={attendanceEndpoint:'https://script.google.com/macros/s/test/exec',attendanceEvent:'test-event'};
  root.querySelector=s=>({'form':form,'[data-attendance-status]':status,'[data-attendance-action-status]':actionStatus,'[data-attendance-retry]':retry}[s]||element());
  const dialog=element();dialog.querySelector=()=>element();
  const scripts=[],timers=new Map();let timerId=0,posts=0;
  const window={};
  const document={addEventListener(){},querySelector:s=>s==='[data-attendance-event]'?root:dialog,
    head:{append:s=>scripts.push(s)},body:{append(){}},createElement:()=>({...element(),submit(){posts++}})};
  vm.runInNewContext(fs.readFileSync('attendance/client.js','utf8'),{document,window,location:{origin:'https://bamedicale.com'},URL,Uint8Array,crypto:require('node:crypto').webcrypto,matchMedia:()=>({matches:false}),setInterval(){},setTimeout(fn){timers.set(++timerId,fn);return timerId},clearTimeout:id=>timers.delete(id)});
  return {submit,status,actionStatus,retry,form,get posts(){return posts},
    async respond(state,opensAt){const q=new URL(scripts.at(-1).src).searchParams;window[q.get('callback')]({type:'ba-attendance',event_id:'test-event',request_id:q.get('request_id'),status:state,opens_at:opensAt});await Promise.resolve();},
    async timeout(){timers.values().next().value();await Promise.resolve();},
    click(){return form.listeners.submit({preventDefault(){}})}};
}

test('closed event explains the disabled action beside the button and can recheck without losing entries',async()=>{
  const p=page();await p.respond('closed');
  assert.equal(p.submit.disabled,true);assert.equal(p.submit.textContent,'Attendance closed');
  assert.match(p.actionStatus.textContent,/currently closed/);assert.equal(p.status.textContent,p.actionStatus.textContent);
  assert.equal(p.retry.hidden,false);assert.equal(p.retry.textContent,'Check attendance status');
  p.form.full_name.value='Retained input';const pending=p.retry.listeners.click();await p.respond('open');await pending;
  assert.equal(p.submit.disabled,false);assert.equal(p.submit.textContent,'Submit attendance');assert.equal(p.form.full_name.value,'Retained input');assert.equal(p.posts,0);
});

test('open event leaves submit clickable so missing required fields get accessible validation',async()=>{
  const p=page();await p.respond('open');assert.equal(p.submit.disabled,false);
  await p.click();assert.equal(p.form.validated,true);assert.equal(p.actionStatus.focused,true);assert.match(p.actionStatus.textContent,/required fields/);assert.equal(p.posts,0);
});

test('availability timeout offers a working check action and never submits before open status',async()=>{
  const p=page();await p.timeout();assert.equal(p.submit.disabled,false);assert.equal(p.submit.textContent,'Check availability');
  const pending=p.click();assert.equal(p.submit.disabled,true);assert.equal(p.submit.textContent,'Checking availability…');
  await p.respond('closed');await pending;assert.equal(p.submit.textContent,'Attendance closed');assert.equal(p.posts,0);
});

test('scheduled and override states show only public messages and enable the appropriate action',async()=>{
 for(const [state,message,disabled] of [['CLOSED_BEFORE','Attendance opens on 19 Sep 2026 at 08:45 WIB.',true],['CLOSED_AFTER','Attendance for this seminar is closed.',true],['FORCED_CLOSED','Attendance is temporarily closed.',true],['OPEN','Attendance is open.',false],['FORCED_OPEN','Attendance is open.',false],['CLOSED_INVALID','Attendance is currently closed.',true]]){
 const p=page();await p.respond(state,'19 Sep 2026 at 08:45 WIB');assert(p.actionStatus.textContent.startsWith(message));assert.equal(p.submit.disabled,disabled);
 }
});
