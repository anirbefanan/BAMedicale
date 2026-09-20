/* Public aggregate UI. One selected period powers every historical module. */
(() => {
  'use strict';
  const M = window.BATraffic, root = document.querySelector('[data-growth-content]');
  if (!root) return;
  const state = { data:null, key:'28d', custom:null };
  const e = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number = v => Number.isFinite(v) ? new Intl.NumberFormat('en-US',{maximumFractionDigits:0}).format(v) : '—';
  const percent = v => Number.isFinite(v) ? (v*100).toFixed(1)+'%' : '—';
  const duration = v => Number.isFinite(v) ? `${Math.floor(Math.round(v)/60)}m ${Math.round(v)%60}s` : '—';
  const labels = {daily:'Yesterday', '7d':'Last 7 completed days','28d':'Last 28 completed days',mtd:'Month to date',monthly:'Last completed month',custom:'Custom range'};
  const colors = ['#ad1634','#d54d67','#eaa0af','#f4d5db','#8a8d90','#cabcb3'];
  const empty = (message='No data yet for this period.') => `<p class="growth-empty">${e(message)}</p>`;
  const icon = (type) => `<span class="growth-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">${({users:'<circle cx="9" cy="7" r="3"/><path d="M3 20v-3a6 6 0 0 1 12 0v3ZM16 4a3 3 0 0 1 0 6M18 13a5 5 0 0 1 3 5v2"/>',views:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 3"/>',rate:'<path d="m5 19 14-14"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="18" r="3"/>',target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',live:'<path d="M8 6a9 9 0 0 0 0 12M16 6a9 9 0 0 1 0 12M5 3a13 13 0 0 0 0 18M19 3a13 13 0 0 1 0 18"/><circle cx="12" cy="12" r="2"/>'})[type] || ''}</svg></span>`;
  function spark(rows,key) {
    if (!rows?.length || !rows.some(r=>Number.isFinite(r[key]))) return '';
    const values=rows.map(r=>r[key]), max=Math.max(1,...values.filter(Number.isFinite));
    const segments=[];let points=[];
    values.forEach((v,i)=>{if(Number.isFinite(v))points.push(`${i*100/Math.max(1,values.length-1)},${35-v/max*30}`);else if(points.length){segments.push(points);points=[];}});if(points.length)segments.push(points);
    return `<svg class="growth-spark" viewBox="0 0 100 40" role="img" aria-label="Daily ${e(key)} trend for selected period; gaps mean no denominator">${segments.map(ps=>`<polyline points="${ps.join(' ')}" fill="none" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke"/>`).join('')}</svg>`;
  }
  function card(label,key,type,p,format=number,semantic=true) {
    const current=p?.summary?.[key], delta=M.change(current,p?.previous?.[key]);
    const tone=semantic&&delta!==null?(delta>0?'positive':delta<0?'negative':'neutral'):'neutral';
    return `<article class="growth-kpi"><h2>${icon(type)}${label}</h2><strong>${format(current)}</strong><div class="growth-kpi-bottom"><div><b class="growth-delta ${tone}">${delta===null?'— No comparison':`${delta>0?'↑':delta<0?'↓':'→'} ${percent(Math.abs(delta))}`}</b><span>vs previous comparable period</span></div>${spark(p?.trend?.current,key)}</div></article>`;
  }
  function panel(id,title,body,cls='') {return `<section class="growth-panel ${cls}" id="${id}" aria-labelledby="${id}-title"><header><h2 id="${id}-title">${title}</h2></header>${body}</section>`;}
  function trend(p) {
    if(p?.trend?.status!=='ok')return empty('Trend data temporarily unavailable.');
    const current=p.trend.current, previous=p.trend.previous, W=660,H=210,left=42,top=16,bottom=180;
    const max=Math.max(4,...current.map(x=>x.activeUsers),...previous.map(x=>x.activeUsers));
    const x=(i,n)=>left+i*(W-left-12)/Math.max(1,n-1),y=v=>bottom-v/max*(bottom-top);
    const line=rows=>rows.map((r,i)=>`${x(i,rows.length)},${y(r.activeUsers)}`).join(' ');
    const ticks=[0,.25,.5,.75,1].map(t=>`<line x1="${left}" y1="${y(max*t)}" x2="${W-12}" y2="${y(max*t)}" stroke="#e9e1e2"/><text x="${left-8}" y="${y(max*t)+4}" text-anchor="end">${number(max*t)}</text>`).join('');
    const points=current.map((r,i)=>`<circle tabindex="0" style="opacity:${current.length===1?1:.15}" cx="${x(i,current.length)}" cy="${y(r.activeUsers)}" r="4" fill="#ad1634" aria-label="${e(r.date)}: ${number(r.activeUsers)} active users"><title>${e(r.date)}: ${number(r.activeUsers)} active users${previous[i]?`; ${e(previous[i].date)}: ${number(previous[i].activeUsers)} previously`:''}</title></circle>`).join('');
    const dates=[0,Math.floor((current.length-1)/2),current.length-1].filter((v,i,a)=>a.indexOf(v)===i).map(i=>`<text x="${x(i,current.length)}" y="202" text-anchor="${i===0?'start':i===current.length-1?'end':'middle'}">${e(current[i].date.slice(5))}</text>`).join('');
    return `<svg class="growth-trend" viewBox="0 0 ${W} ${H}" role="img" aria-label="Daily active users, current and previous period"><title>Daily active users. Period totals are deduplicated separately.</title>${ticks}<polyline points="${line(previous)}" fill="none" stroke="#d78699" stroke-width="2" stroke-dasharray="5 5"/><polyline points="${line(current)}" fill="none" stroke="#ad1634" stroke-width="2.5"/>${points}${dates}</svg><div class="growth-legend"><span>━ Active users</span><span>┄ Previous period</span></div><details><summary>View daily values</summary>${table(['Date','Active users','Previous date','Active users'],current.map((r,i)=>[r.date,number(r.activeUsers),previous[i]?.date||'—',number(previous[i]?.activeUsers)]),100)}</details>`;
  }
  function table(headers,rows,preview=5) {
    if(!rows?.length)return empty();
    const build=rs=>`<div class="growth-table-scroll"><table><thead><tr>${headers.map(h=>`<th scope="col">${e(h)}</th>`).join('')}</tr></thead><tbody>${rs.map(row=>`<tr>${row.map((cell,i)=>`<${i?'td':'th scope="row"'}>${e(cell)}</${i?'td':'th'}>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    return build(rows.slice(0,preview))+(rows.length>preview?`<details><summary>View all ${rows.length}</summary>${build(rows.slice(preview))}</details>`:'');
  }
  function composition(mod,total,unit='sessions') {
    if(mod?.status!=='ok')return empty('Breakdown temporarily unavailable.');
    if(!mod.rows.length||!total)return empty();
    const all=mod.rows.filter(r=>r.sessions>0), rows=all.slice(0,5).map(r=>({...r}));
    const remainder=all.slice(5).reduce((s,r)=>s+r.sessions,0);
    if(remainder)rows.push({label:'Other',sessions:remainder});
    const sum=rows.reduce((s,r)=>s+r.sessions,0);
    if(!sum)return empty();
    let offset=0;
    const stops=rows.map((r,i)=>{const a=offset;offset+=r.sessions/sum*100;return `${colors[i%colors.length]} ${a}% ${offset}%`;}).join(',');
    return `<div class="growth-composition"><div class="growth-donut" style="background:conic-gradient(${stops})" role="img" aria-label="${e(unit)} distribution"><div><strong>${number(sum)}</strong><span>${e(unit)}</span></div></div><ul>${rows.map((r,i)=>`<li><i style="background:${colors[i%colors.length]}" aria-hidden="true"></i><span>${e(r.label)}</span><b>${percent(r.sessions/sum)}</b><small>${number(r.sessions)}</small></li>`).join('')}</ul></div>`;
  }
  function country(p) {
    if(p?.countries?.status!=='ok')return empty('Country data temporarily unavailable.');
    const rows=p.countries.rows;
    if(!rows.length)return empty('No countries meet the publication threshold.');
    const draw=rs=>`<ol class="growth-ranked">${rs.map(r=>`<li><span>${e(r.label)}</span><i aria-hidden="true"><b style="width:${Math.min(100,(M.ratio(r.activeUsers,p.summary?.activeUsers)||0)*100)}%"></b></i><strong>${number(r.activeUsers)}</strong></li>`).join('')}</ol>`;
    return draw(rows.slice(0,5))+(rows.length>5?`<details><summary>View all ${rows.length}</summary>${draw(rows.slice(5))}</details>`:'')+'<p class="growth-note">Active users · Countries with fewer than 5 users are omitted.</p>';
  }
  function period() {
    if(state.key!=='custom')return state.data?.periods[state.key]||null;
    return state.data?.periods.custom || null;
  }
  function realtimeCard() {
    const r=state.data?.realtime, ok=M.recentlyActive(r,state.data?.generatedAt);
    return `<article class="growth-kpi" id="realtime"><h2>${icon('live')}Recently Active</h2><strong>${ok?number(r.activeUsers):'—'}</strong><p class="growth-note">${ok?'Active users in the 30 minutes before the latest refresh':'Temporarily unavailable'}</p></article>`;
  }
  function render() {
    const p=period(), summary=p?.summary;
    const custom=state.data?.periods.custom;
    document.querySelector('[data-growth-period] option[value=custom]').disabled=!custom;
    document.querySelector('[data-custom-range]').innerHTML=custom?`<option>${e(custom.range.startDate)} – ${e(custom.range.endDate)}</option>`:'';
    root.setAttribute('aria-busy','false');
    const range=p?.range;
    document.querySelector('[data-growth-range]').textContent=range?`${labels[state.key]} · ${range.startDate} – ${range.endDate} · compared with ${range.previousStartDate} – ${range.previousEndDate} · ${state.data.timeZone}`:state.key==='custom'?'Choose a custom range. Only exact published ranges can be displayed.':'No completed data available for this period.';
    const stamp=state.data?.generatedAt;
    const age=stamp?Date.now()-Date.parse(stamp):Infinity;
    const live=document.querySelector('[data-growth-status]');
    live.textContent='Updated every 6 hours';
    live.classList.toggle('is-stale',age>8*3600000);
    document.querySelector('[data-growth-updated]').textContent=stamp?`Last updated: ${new Date(stamp).toLocaleString('en-GB',{timeZone:state.data.timeZone,timeZoneName:'short'})}${age>8*3600000?' · refresh delayed':''}`:'Last updated: unavailable';
    const grid=[['Active Users','activeUsers','users'],['New Users','newUsers','users'],['Website Views','screenPageViews','views'],['Avg. Engagement','averageEngagementTimeSeconds','clock',duration],['Engagement Rate','engagementRate','rate',percent],['Event Count','eventCount','target',number,false],['Returning Users','returningUsers','users']].map(args=>card(args[0],args[1],args[2],p,args[3],args[4])).join('');
    const pages=p?.pages?.rows||[], events=pages.filter(r=>r.type==='Seminars / Events');
    const pageRows=pages.map((r,i)=>[`${i+1}. ${r.title}`,number(r.views),percent(M.ratio(r.views,summary?.screenPageViews))]);
    const contentRows=(p?.content?.rows||[]).map(r=>[r.title,number(r.activeUsers),duration(r.engagement)]);
    const eventRows=events.map(r=>[r.title,number(r.views),percent(M.ratio(r.views,summary?.screenPageViews))]);
    const controls=`<div class="growth-chart-periods" role="group" aria-label="Trend reporting period">${['7d','28d','mtd','monthly','custom'].map(k=>`<button type="button" data-period="${k}" aria-pressed="${state.key===k}" ${k==='custom'&&!custom?'disabled title="No custom range has been published"':''}>${({ '7d':'7D','28d':'28D',mtd:'MTD',monthly:'Monthly',custom:'Custom'})[k]}</button>`).join('')}</div>`;
    root.innerHTML=`<section id="overview" class="growth-kpis" aria-label="Website key metrics">${grid}${realtimeCard()}</section>
      <div class="growth-main-row">${panel('users-over-time','Users Over Time',controls+trend(p),'growth-chart-panel')}${panel('traffic-source','Traffic Source / Medium',composition(p?.channels,summary?.sessions)+'<p class="growth-note">GA4 session channel groups. Source / medium detail below.</p>')}</div>
      <div class="growth-three" id="audience">${panel('new-returning','New vs Returning Users',composition(p?.audience,summary?.sessions,'sessions')+'<p class="growth-note">Session share by GA4 user type. A visitor can be new and returning in the same period; user totals are not additive.</p>')}${panel('devices','Device Distribution',composition(p?.devices,summary?.sessions))}${panel('countries','Users by Country',country(p))}</div>
      <div class="growth-three growth-details-row">${panel('top-pages','Top Pages',p?.pages?.status==='ok'?table(['Page','Views','Share¹'],pageRows):empty('Page report temporarily unavailable.'))}${panel('content-performance','Content Performance',p?.content?.status==='ok'?table(['Content type','Users','Engagement'],contentRows):empty('Content report temporarily unavailable.'))}${panel('event-performance','Recent Seminars / Events',p?.pages?.status==='ok'?table(['Event','Views','Share¹'],eventRows):empty('Event traffic temporarily unavailable.'))}</div>
      <div class="growth-insight-row">${panel('insights','Quick Insights',M.insights(p).length?`<ul class="growth-insights">${M.insights(p).map(x=>`<li><span aria-hidden="true">✓</span>${e(x)}</li>`).join('')}</ul>`:empty('Insufficient data for a measured comparison.'))}${panel('education-impact','Medical education, in use','<p>BA Medicale publishes aggregated usage data to show how its medical-education content is accessed and used.</p><a href="library.html">Explore the medical library <span aria-hidden="true">→</span></a>','growth-context')}</div>
      ${panel('detailed-report',`${labels[state.key]} — detailed report`,summary?`<div class="growth-detail-metrics"><p><span>Sessions</span><strong>${number(summary.sessions)}</strong></p><p><span>Key events</span><strong>${number(summary.keyEvents)}</strong></p><p><span>Engaged sessions</span><strong>${number(summary.engagedSessions)}</strong></p></div><details><summary>Landing pages</summary>${p.landing?.status!=='ok'?empty('Data temporarily unavailable.'):table(['Landing page','Sessions','Engagement rate'],(p.landing?.rows||[]).map(r=>[r.title,number(r.sessions),percent(r.engagementRate)]),100)}</details><details><summary>Source / medium</summary><h3>Session acquisition</h3>${p.sessionSources?.status!=='ok'?empty('Data temporarily unavailable.'):table(['Source / medium','Sessions'],(p.sessionSources?.rows||[]).map(r=>[r.label,number(r.sessions)]),100)}<h3>First-user acquisition</h3>${p.firstSources?.status!=='ok'?empty('Data temporarily unavailable.'):table(['Source / medium','Active users'],(p.firstSources?.rows||[]).map(r=>[r.label,number(r.activeUsers)]),100)}</details><details><summary>Page engagement and interactions</summary>${table(['Page','Active users','Avg. engagement','Events'],pages.map(r=>[r.title,number(r.activeUsers),duration(r.engagement),number(r.eventCount)]),100)}</details><details><summary>Metric definitions and reporting scope</summary><p>Source: Google Analytics 4 Data API. Completed days in ${e(state.data.timeZone)}. Active users are deduplicated for each full period; they are not summed across days or pages. Average engagement = engagement seconds ÷ active users. Engagement rate = engaged sessions ÷ sessions. Event Count measures all collected interactions; Key events includes only GA4-designated key events. ¹Share = page views ÷ all public page views. User counts across content groups may overlap.</p><p>Private app routes are excluded. Countries require at least five active users. Chart percentages use the sum within their reported breakdown; GA4 breakdown counts can differ from deduplicated summary totals. Historical aggregates refresh every six hours. GA4 can revise recent completed days as processing finishes. Realtime snapshots refresh on a five-minute GitHub Actions schedule, which can be delayed. Snapshots older than ten minutes are unavailable. Custom dates require an exact cached report; daily users are never summed to approximate a custom total.</p><p>MTD aligns elapsed days and caps both periods to the shorter month. Monthly compares complete calendar months; months can have different lengths. Zero previous totals produce no percentage comparison.</p><p><a href="https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema" target="_blank" rel="noopener noreferrer">GA4 metric definitions</a></p></details>`:empty('The selected report is not available.'))}`;
    root.querySelectorAll('[data-period]').forEach(button=>button.addEventListener('click',()=>select(button.dataset.period,true)));
  }
  function select(key,fromChart=false){state.key=key;document.querySelector('[data-growth-period]').value=key;document.querySelector('[data-growth-custom]').hidden=key!=='custom';render();if(key==='custom')document.querySelector('[data-custom-range]').focus();else if(fromChart)root.querySelector(`[data-period="${key}"]`)?.focus();}
  document.querySelector('[data-growth-period]').addEventListener('change',event=>select(event.target.value));
  document.querySelectorAll('.growth-nav a').forEach(a=>a.addEventListener('click',()=>{document.querySelectorAll('.growth-nav a').forEach(link=>link.removeAttribute('aria-current'));a.setAttribute('aria-current','location');}));
  async function load(){
    try {
      // GitHub Actions writes this public cache independently of the Pages deployment cycle.
      // Local preview reads the checked-out cache for reproducible QA.
      const urls=location.hostname==='127.0.0.1'||location.hostname==='localhost'?['data/growth-analytics.json']:['https://raw.githubusercontent.com/anirbefanan/BAMedicale/main/data/growth-analytics.json','data/growth-analytics.json'];
      let data;
      for(const url of urls){try{const response=await fetch(url,{cache:'no-cache',referrerPolicy:'no-referrer'});if(!response.ok)continue;const candidate=await response.json();if(candidate.schemaVersion===1&&candidate.periods&&Number.isFinite(Date.parse(candidate.generatedAt))){data=candidate;break;}}catch{ /* Try the same-origin last valid snapshot. */ }}
      if(!data)throw new Error();state.data=data;render();
    }
    catch {if(state.data){document.querySelector('[data-growth-status]').textContent='Cached data · refresh unavailable';}else{render();}}
  }
  load();
})();
