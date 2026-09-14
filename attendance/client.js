/* Email/name/feedback stay in memory and POST bodies; never URLs, storage or analytics. */
(() => {
  const root=document.querySelector('[data-attendance-event]'); if(!root)return;
  const form=root.querySelector('form'),submit=form.querySelector('[type=submit]'),status=root.querySelector('[data-attendance-status]'),retry=root.querySelector('[data-attendance-retry]');
  const endpoint=root.dataset.attendanceEndpoint,eventId=root.dataset.attendanceEvent;
  let available=false,busy=false,complete=false;
  const update=()=>{submit.disabled=!available||busy||complete||!form.instagram.checked||!form.youtube.checked;};
  const say=(text,focus=false)=>{status.textContent=text;if(focus)status.focus();};
  const dialog=document.querySelector('[data-social-dialog]'),opener=form.querySelector('[data-social-open]');
  opener.addEventListener('click',()=>dialog.showModal());
  dialog.querySelector('[data-social-close]').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  dialog.addEventListener('close',()=>opener.focus());
  root.querySelector('.attendance-share').open=matchMedia('(min-width:821px)').matches;
  root.querySelector('[data-attendance-copy]').addEventListener('click',async()=>{const message=root.querySelector('[data-copy-status]');const url=document.querySelector('link[rel=canonical]').href;try{await navigator.clipboard.writeText(url);message.textContent='Attendance link copied.'}catch{message.textContent='Copy this link: '+url}});
  form.addEventListener('change',update);
  const request = payload => new Promise((resolve,reject)=>{
    if(!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(endpoint)){reject(new Error('unconfigured'));return}
    const requestId=Array.from(crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,'0')).join('');
    const callback='baAttendance_'+requestId,common={event_id:eventId,request_id:requestId,origin:location.origin};
    let frame,post,script,pollTimer,finished=false,attempt=0;
    const cleanup=()=>{finished=true;clearTimeout(timer);clearTimeout(pollTimer);script?.remove();frame?.remove();post?.remove();delete window[callback]};
    const fail=()=>{cleanup();reject(new Error('timeout'))};
    const timer=setTimeout(fail,45000);
    const poll=()=>{if(finished)return;script?.remove();script=document.createElement('script');script.referrerPolicy='no-referrer';const url=new URL(endpoint);Object.entries({...common,callback,action:payload?'ack':'status',attempt:++attempt}).forEach(([k,v])=>url.searchParams.set(k,v));script.src=url.href;script.onerror=()=>{if(!finished)pollTimer=setTimeout(poll,2500)};document.head.append(script)};
    window[callback]=m=>{
      if(!m||m.type!=='ba-attendance'||m.request_id!==requestId||m.event_id!==eventId)return;
      if(m.status==='waiting'&&payload){pollTimer=setTimeout(poll,2000);return}
      if(!['open','closed','recorded','duplicate','invalid','retry'].includes(m.status))return;
      cleanup();resolve(m.status);
    };
    if(payload){frame=document.createElement('iframe');frame.name='attendance-'+requestId;frame.title='Secure attendance submission';frame.hidden=true;document.body.append(frame);post=document.createElement('form');post.method='POST';post.action=endpoint;post.target=frame.name;post.hidden=true;const input=document.createElement('input');input.type='hidden';input.name='payload';input.value=JSON.stringify({...common,...payload});post.append(input);document.body.append(post);post.submit();input.value='';pollTimer=setTimeout(poll,2000)}else poll();
  });
  const check=async()=>{busy=true;retry.hidden=true;update();say('Checking attendance availability…');try{const state=await request();available=state==='open';if(state==='open')say('Attendance is open. Complete the form below.');else if(state==='closed')say('Attendance is currently closed. Please follow the organizer’s instructions.');else throw new Error('retry');retry.hidden=state!=='closed'}catch{available=false;retry.hidden=false;say(endpoint?'Unable to confirm availability. Please try again.':'Attendance is not open yet. Please follow the organizer’s instructions.')}finally{busy=false;update()}};
  retry.addEventListener('click',check);
  form.addEventListener('submit',async e=>{e.preventDefault();if(busy||complete)return;if(!form.reportValidity()){say('Please check the required fields.',true);return}if(!available||!form.instagram.checked||!form.youtube.checked)return;
    if(!form.full_name.value.trim()){form.full_name.setCustomValidity('Please enter your full name.');form.full_name.reportValidity();return}
    busy=true;update();submit.textContent='Submitting…';retry.hidden=true;say('Submitting your attendance…');
    try{const result=await request({full_name:form.full_name.value,email:form.email.value,instagram:form.instagram.checked,youtube:form.youtube.checked,score:form.score.value,feedback:form.feedback.value,website:form.website.value});
      if(result==='recorded'||result==='duplicate'){complete=true;say(result==='recorded'?'Attendance recorded. Organizer review is still required before certificate delivery.':'Already submitted. No additional attendance record was created. Organizer review is still required.',true)}
      else if(result==='closed'){available=false;say('Attendance is currently closed. Your entries remain here.',true);retry.hidden=false}
      else if(result==='invalid')say('Please check your name, email, confirmations, and response lengths, then try again.',true);
      else throw new Error('retry');
    }catch{say('We could not confirm storage. Please submit again; retries will not create another attendance record.',true)}finally{busy=false;submit.textContent=complete?'Attendance received':'Submit attendance';update()}
  });
  form.full_name.addEventListener('input',()=>form.full_name.setCustomValidity(''));
  check();
})();
