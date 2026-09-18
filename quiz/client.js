import {request,randomId} from './api.js';
const root=document.querySelector('[data-quiz-event]'),eventId=root.dataset.quizEvent,$=s=>root.querySelector(s);
const entry=$('[data-quiz-entry]'),game=$('[data-quiz-game]'),resultPanel=$('[data-quiz-result]'),form=$('[data-quiz-start]'),entryStatus=$('[data-quiz-entry-status]'),gameStatus=$('[data-quiz-game-status]');
const storageKey='ba-quiz:'+eventId;
let saved={},questions,answers=Array(5).fill(null),index=0,busy=false,ticking,deadline=0,locked=false,startId;
try{saved=JSON.parse(sessionStorage.getItem(storageKey)||'{}');}catch{}
startId=/^[a-f0-9]{32}$/.test(saved.startId||'')?saved.startId:randomId();
function persist(extra={}){saved={...saved,startId,...extra};try{sessionStorage.setItem(storageKey,JSON.stringify(saved));}catch{}}
function announce(text){entryStatus.textContent=text;gameStatus.textContent=text;}
function showResult(r){clearInterval(ticking);locked=true;entry.hidden=true;game.hidden=true;resultPanel.hidden=false;$('[data-quiz-score]').textContent=r.percentage+'%';$('[data-quiz-correct]').textContent=r.correct+' / 5 correct';$('[data-quiz-time]').textContent='Completion time: '+Number(r.elapsed).toFixed(1)+' seconds';$('[data-quiz-message]').textContent=r.correct===5?'Excellent work. Keep your seminar learning in practice.':'Thank you for taking part. Continue exploring the seminar presentation to build on your learning.';persist({answers:undefined,submission:undefined,completed:true});resultPanel.focus();}
function navigate(n){index=n;root.querySelectorAll('.quiz-question').forEach((el,i)=>el.hidden=i!==n);root.querySelectorAll('.quiz-step').forEach((el,i)=>{el.setAttribute('aria-current',i===n?'step':'false');el.classList.toggle('is-answered',answers[i]!==null);el.setAttribute('aria-label','Question '+(i+1)+(answers[i]!==null?', answered':', unanswered'));});$('[data-quiz-progress]').textContent='Question '+(n+1)+' of 5';$('[data-quiz-prev]').disabled=n===0;$('[data-quiz-next]').hidden=n===4;$('[data-quiz-submit]').hidden=n!==4;}
function buildQuestions(){
 const container=$('[data-quiz-questions]'),nav=$('.quiz-steps');container.replaceChildren();nav.replaceChildren();
 questions.forEach((q,i)=>{const step=document.createElement('button');step.type='button';step.className='quiz-step';step.textContent=String(i+1);step.onclick=()=>navigate(i);nav.append(step);
 const field=document.createElement('fieldset');field.className='quiz-question quiz-glass';field.lang='id';const legend=document.createElement('legend');legend.textContent=(i+1)+'. '+q.question;field.append(legend);
 q.choices.forEach((text,j)=>{const label=document.createElement('label');label.className='quiz-choice';const radio=document.createElement('input');radio.type='radio';radio.name='q'+i;radio.value=String(j);radio.checked=answers[i]===j;radio.onchange=()=>{if(locked)return;answers[i]=j;persist({answers});navigate(index);};const letter=document.createElement('span');letter.className='quiz-choice__letter';letter.textContent='ABCD'[j];const content=document.createElement('span');content.textContent=text;label.append(radio,letter,content);field.append(label);});container.append(field);
 });navigate(0);
}
function clock(){const remaining=Math.max(0,Math.ceil((deadline-performance.now())/1000));$('[data-quiz-clock]').textContent=String(Math.floor(remaining/60)).padStart(2,'0')+':'+String(remaining%60).padStart(2,'0');$('[data-quiz-clock]').parentElement.dataset.urgency=remaining<15?'urgent':remaining<60?'soon':'normal';if(!remaining&&!locked)submit(true);}
async function activate(r){
 if(r.status==='completed'){showResult(r);return;}
 if(r.status!=='active')throw Error(r.status);
 saved.token=r.token;persist({token:r.token});
 answers=Array.isArray(saved.answers)&&saved.answers.length===5?saved.answers:Array(5).fill(null);
 deadline=performance.now()+Math.max(0,r.deadline-r.serverNow);
 if(!questions){const response=await fetch('/quiz/questions.json');if(!response.ok)throw Error('load');questions=(await response.json())[eventId];}
 // Fetching question content never extends the authoritative remaining duration.
 entry.hidden=true;game.hidden=false;buildQuestions();form.elements.email.value='';clearInterval(ticking);
 if(saved.submission){locked=false;await submit(true);return;}
 locked=false;clock();ticking=setInterval(clock,250);$('[data-quiz-next]').focus();
}
async function submit(timeout=false){
 if(busy||locked)return;
 if(!timeout&&answers.some(a=>a===null)){gameStatus.textContent='Answer all five questions before submitting. Any unanswered questions at timeout will count as incorrect.';navigate(answers.findIndex(a=>a===null));return;}
 locked=true;busy=true;clearInterval(ticking);game.querySelectorAll('input,button').forEach(el=>el.disabled=true);$('[data-quiz-retry]').hidden=true;gameStatus.textContent=timeout?'Time is up. Submitting your current answers…':'Submitting your answers…';
 const submission=saved.submission||[...answers];persist({submission});
 try{const r=await request('quiz_submit',eventId,{token:saved.token,answers:submission});if(r.status!=='completed')throw Error(r.status);showResult(r);}catch{gameStatus.textContent='Your result could not be confirmed. Your answers are locked; retry to safely retrieve or submit the same attempt.';$('[data-quiz-retry]').hidden=false;$('[data-quiz-retry]').disabled=false;}finally{busy=false;}
}
function message(status){return ({closed:'The BA Medicale Live Quiz is closed.',already_completed:'You have already completed this quiz.',already_started:'A quiz session already exists for this email. Return to the browser tab where you started it.',invalid:'The quiz request could not be verified. Please try again.'})[status]||'The quiz service is temporarily unavailable. Please try again.';}
async function availability(){form.querySelector('button').disabled=true;entryStatus.textContent='Checking quiz availability…';try{const r=await request('quiz_status',eventId);form.hidden=r.status!=='open';form.querySelector('button').disabled=r.status!=='open';entryStatus.textContent=r.status==='open'?'Ready when you are. Your timer has not started.':(r.message||message(r.status));}catch{entryStatus.textContent='Unable to check quiz availability. Please try again.';}}
form.addEventListener('submit',async e=>{e.preventDefault();if(busy||!form.reportValidity())return;busy=true;form.querySelector('button').disabled=true;persist();entryStatus.textContent='Creating your game session…';try{const r=await request('quiz_start',eventId,{email:form.elements.email.value.trim().toLowerCase(),start_id:startId});if(r.status==='active'||r.status==='completed')await activate(r);else entryStatus.textContent=r.message||message(r.status);}catch{entryStatus.textContent='Could not confirm your session. Retry with the same email; your timer will not be reset.';}finally{busy=false;form.querySelector('button').disabled=false;}});
$('[data-quiz-prev]').onclick=()=>navigate(Math.max(0,index-1));$('[data-quiz-next]').onclick=()=>navigate(Math.min(4,index+1));$('[data-quiz-answers]').onsubmit=e=>{e.preventDefault();submit();};$('[data-quiz-retry]').onclick=()=>{locked=false;submit(true);};$('[data-quiz-availability]').onclick=()=>saved.token?resume():availability();
async function resume(){announce('Restoring your existing quiz session…');try{const r=await request('quiz_resume',eventId,{token:saved.token});if(r.status==='invalid'){saved={};startId=randomId();try{sessionStorage.removeItem(storageKey);}catch{}await availability();return;}await activate(r);}catch{announce('Unable to restore your session. Choose Check availability to retry; your original timer is preserved.');}}
if(/^[a-f0-9]{64}$/.test(saved.token||''))resume();else availability();

// Refresh only the entry screen; every state decision still comes from the server.
setInterval(()=>{if(!entry.hidden&&!busy&&!saved.token&&!document.hidden)availability();},60000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!entry.hidden&&!busy&&!saved.token)availability();});
