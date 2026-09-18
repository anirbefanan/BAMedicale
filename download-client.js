/* Email lives only in this dialog and a POST body. No storage, URL or analytics use. */
let dialog,opener,material,attempt,busy=false,endpoint;
const randomId=()=>Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join('');
function request(payload){return new Promise((resolve,reject)=>{
 const callback='baDownload_'+payload.request_id;
 let script,frame,post,pollTimer,finished=false;
 const cleanup=()=>{finished=true;clearTimeout(timer);clearTimeout(pollTimer);script?.remove();frame?.remove();post?.remove();delete window[callback]};
 const timer=setTimeout(()=>{cleanup();reject(Error('timeout'))},45000);
 const poll=()=>{if(finished)return;script?.remove();script=document.createElement('script');script.referrerPolicy='no-referrer';const url=new URL(endpoint);Object.entries({action:'download_ack',material_id:payload.material_id,request_id:payload.request_id,origin:location.origin,callback}).forEach(([k,v])=>url.searchParams.set(k,v));script.src=url.href;script.onerror=()=>{if(!finished)pollTimer=setTimeout(poll,2500)};document.head.append(script)};
 window[callback]=message=>{if(!message||message.type!=='ba-download'||message.request_id!==payload.request_id)return;if(message.status==='waiting'){pollTimer=setTimeout(poll,1500);return}if(!['recorded','retry','invalid'].includes(message.status))return;cleanup();resolve(message.status)};
 frame=document.createElement('iframe');frame.name='download-'+payload.request_id;frame.title='Material download submission';frame.hidden=true;document.body.append(frame);
 post=document.createElement('form');post.method='POST';post.action=endpoint;post.target=frame.name;post.hidden=true;const input=document.createElement('input');input.type='hidden';input.name='payload';input.value=JSON.stringify(payload);post.append(input);document.body.append(post);post.submit();input.value='';pollTimer=setTimeout(poll,1500);
})}
function createDialog(){
 dialog=document.createElement('dialog');dialog.className='download-dialog';dialog.setAttribute('aria-labelledby','download-title');dialog.innerHTML='<form><h2 id="download-title">Download Presentation</h2><p>Enter your email to download the original presentation PDF.</p><label for="download-email">Email</label><input id="download-email" name="email" type="email" autocomplete="email" inputmode="email" maxlength="254" required><p class="download-privacy">Your email is recorded by BA Medicale for material-download tracking. <a href="/privacy-policy.html" target="_blank" rel="noopener noreferrer">Privacy Policy</a></p><p role="status" aria-live="polite" data-download-status></p><div class="download-actions"><button class="button button-dark" type="submit">Continue to Download</button><button class="button button-outline" type="button" data-download-cancel>Cancel</button></div></form>';
 document.body.append(dialog);dialog.querySelector('[data-download-cancel]').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>opener?.focus());
 const form=dialog.querySelector('form'),email=form.elements.email,submit=form.querySelector('[type=submit]'),status=form.querySelector('[data-download-status]');
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(busy||!form.reportValidity())return;
  const value=email.value.trim();if(!/^[^\s@<>]+@[^\s@<>.]+(?:\.[^\s@<>.]+)+$/.test(value)||value.split('@')[0].length>64){email.setCustomValidity('Enter a valid email address.');email.reportValidity();return}
  if(!attempt||attempt.email!==value||attempt.material_id!==material.id)attempt={action:'download',request_id:randomId(),material_id:material.id,origin:location.origin,email:value};
  busy=true;submit.disabled=true;email.readOnly=true;form.setAttribute('aria-busy','true');submit.textContent='Saving…';status.textContent='Recording your download request…';
  try{
   if(!endpoint){const response=await fetch('/attendance/config.json',{cache:'no-store'});if(!response.ok)throw Error('configuration');endpoint=(await response.json()).endpoint;if(!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(endpoint))throw Error('configuration')}
   const result=await request(attempt);if(result!=='recorded')throw Error(result);
   if(dialog.open){const link=document.createElement('a');link.href='/'+material.sourcePdf;link.download='';link.hidden=true;document.body.append(link);link.click();link.remove();attempt=null;email.value='';dialog.close()}
  }catch{status.textContent='We could not confirm your request was saved. Please try again. Your PDF has not been downloaded.'}
  finally{busy=false;submit.disabled=false;email.readOnly=false;form.setAttribute('aria-busy','false');submit.textContent='Continue to Download'}
 });
 email.addEventListener('input',()=>email.setCustomValidity(''));
}
export function openDownload(presentation,trigger){
 if(!dialog)createDialog();if(busy||dialog.open)return;opener=trigger;material=presentation;dialog.querySelector('[data-download-status]').textContent='';dialog.querySelector('input').value=attempt?.material_id===presentation.id?attempt.email:'';dialog.showModal();dialog.querySelector('input').focus();
}
