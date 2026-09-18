/* Native POST + correlated JSONP acknowledgement: no email/answers in URLs. */
export const randomId=()=>Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join('');
let endpoint;
export async function request(action,eventId,data={}){
  if(!endpoint){const r=await fetch('/attendance/config.json',{cache:'no-store'});if(!r.ok)throw Error('configuration');endpoint=(await r.json()).endpoint;if(!/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(endpoint))throw Error('configuration');}
  const id=randomId(),callback='baQuiz_'+id,postAction=['quiz_start','quiz_resume','quiz_submit'].includes(action);
  return new Promise((resolve,reject)=>{
    let script,frame,form,poll,done=false;
    const cleanup=()=>{done=true;clearTimeout(timeout);clearTimeout(poll);script?.remove();frame?.remove();form?.remove();delete window[callback];};
    const timeout=setTimeout(()=>{cleanup();reject(Error('timeout'));},45000);
    const read=()=>{if(done)return;script?.remove();script=document.createElement('script');script.referrerPolicy='no-referrer';const url=new URL(endpoint);Object.entries({action:postAction?'quiz_ack':action,event_id:eventId,request_id:id,origin:'https://bamedicale.com',callback}).forEach(([k,v])=>url.searchParams.set(k,v));script.src=url.href;script.onerror=()=>{poll=setTimeout(read,2500);};document.head.append(script);};
    window[callback]=result=>{if(!result||typeof result.status!=='string')return;if(result.status==='waiting'){poll=setTimeout(read,1800);return;}cleanup();resolve(result);};
    if(postAction){frame=document.createElement('iframe');frame.name='quiz-'+id;frame.title='Quiz submission';frame.hidden=true;document.body.append(frame);form=document.createElement('form');form.method='POST';form.action=endpoint;form.target=frame.name;form.hidden=true;const input=document.createElement('input');input.type='hidden';input.name='payload';input.value=JSON.stringify({action,event_id:eventId,request_id:id,origin:'https://bamedicale.com',...data});form.append(input);document.body.append(form);form.submit();input.value='';poll=setTimeout(read,1500);}else read();
  });
}
