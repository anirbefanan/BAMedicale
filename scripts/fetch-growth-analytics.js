// Server-only GA4 aggregation. No raw API responses or credentials are published.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const { accessToken, readConfiguration, requestJson, parseReport } = require('./fetch-ga4-traffic');
const M = require('../traffic-model');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'data/growth-analytics.json');
const METRICS = ['activeUsers','newUsers','screenPageViews','sessions','engagedSessions','userEngagementDuration','eventCount','keyEvents','totalUsers'];
const THRESHOLD = 5;
const round = x => Number.isFinite(x) ? Math.round(x * 10000) / 10000 : null;
const safeSource = value => /^[\w .()/+-]{1,100}$/.test(value || '') && !/@|\d{7,}|token|email|password/i.test(value) ? value : 'Other';
function catalog() {
  const context = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'content.js'), 'utf8'), context);
  const data = context.window.BAMEDICALE_DATA;
  const registry = require('../content-registry').create(data);
  const records = new Map(registry.records.filter(r => r.route && r.publicationStatus === 'published').map(r => ['/' + r.route.replace(/^\//, '').split('?')[0], r]));
  const pages = new Map();
  for (const directory of ['', 'articles', 'events', 'presentations', 'ebooks', 'quiz', 'attendance']) {
    for (const file of fs.readdirSync(path.join(ROOT, directory)).filter(f => f.endsWith('.html'))) {
      const route = '/' + [directory, file].filter(Boolean).join('/');
      if (/login|ebook-detail|doctor-papers/.test(route)) continue;
      const html = fs.readFileSync(path.join(ROOT, directory, file), 'utf8');
      const title = (html.match(/<title>([^<]+)<\/title>/)?.[1] || '').replace(/&amp;/g, '&').replace(/\s*\|\s*BA Medicale.*$/, '');
      if (!title) continue;
      const r = records.get(route);
      const type = r?.scientificWork ? (r.contentType === 'Case report' ? 'Case Reports' : 'Scientific Publications') : ({ 'educational guide': 'Articles', 'seminar presentation': 'Presentations', article: 'Articles', presentation: 'Presentations', ebook: 'eBooks', seminar: 'Seminars / Events', event: 'Seminars / Events', video: 'Videos', 'case-report': 'Case Reports' }[r?.contentType?.toLowerCase()] || (directory === 'events' ? 'Seminars / Events' : directory === 'presentations' ? 'Presentations' : directory === 'ebooks' ? 'eBooks' : route === '/videos.html' ? 'Videos' : 'Other public pages'));
      pages.set(route, { title: r?.title || title, type });
    }
  }
  pages.set('/', pages.get('/index.html'));
  return pages;
}
const inList = (fieldName, values) => ({ filter: { fieldName, inListFilter: { values, caseSensitive: true } } });
function publicFilter(pages) {
  return { andGroup: { expressions: [inList('hostName', ['bamedicale.com', 'www.bamedicale.com']), inList('pagePath', [...pages.keys()])] } };
}
function summarize(row = {}) { return Object.fromEntries(Object.entries(M.metrics(Object.fromEntries(METRICS.map(k => [k, Number(row[k] || 0)])))).map(([k,v]) => [k,round(v)])); }
function validate(payload) {
  if (payload?.schemaVersion !== 1 || !payload.generatedAt || !payload.timeZone || !payload.periods) throw new Error('Invalid dashboard contract.');
  for (const p of Object.values(payload.periods)) {
    if (!p) continue;
    if (!p.range || !M.validDate(p.range.startDate) || !M.validDate(p.range.endDate)) throw new Error('Invalid period.');
    for (const metric of [p.summary, p.previous]) if (metric) {
      for (const v of Object.values(metric)) if (v !== null && (!Number.isFinite(v) || v < 0)) throw new Error('Invalid metric.');
      if (metric.engagementRate > 1) throw new Error('Invalid rate.');
    }
    if (p.countries?.rows?.some(r => r.activeUsers < THRESHOLD)) throw new Error('Country suppression failed.');
  }
  const serialized = JSON.stringify(payload);
  if (/@|private_key|client_email|clientId|userId|GA4_PROPERTY|[?]email=/.test(serialized)) throw new Error('Private data detected.');
  return payload;
}
async function collect({propertyId, token, now = new Date(), old, custom, realtimeOnly = false, request = requestJson}) {
  const pages = catalog(), filter = publicFilter(pages);
  const endpoint = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}`;
  async function query(body, realtime = false) {
    const result=await request(endpoint + (realtime ? ':runRealtimeReport' : ':runReport'), {
      method: 'POST', headers: {authorization: `Bearer ${token}`, 'content-type': 'application/json'}, body: JSON.stringify(body)
    });
    if(!body.metrics.every(m=>result.metricHeaders?.some(h=>h.name===m.name)))throw new Error('Missing metric headers.');
    for(const row of result.rows||[])if(row.metricValues?.length!==body.metrics.length||row.metricValues.some(v=>v.value==null||!Number.isFinite(Number(v.value))||Number(v.value)<0))throw new Error('Invalid metric values.');
    return result;
  }
  let timeZone = old?.timeZone;
  if (!realtimeOnly || !timeZone) {
    const probe = await query({ dateRanges:[{startDate:'yesterday',endDate:'yesterday'}], metrics:[{name:'activeUsers'}], dimensionFilter:filter });
    timeZone = probe.metadata?.timeZone;
    if (!timeZone) throw new Error('GA4 property timezone was not returned; refusing ambiguous periods.');
  }
  const payload = old ? JSON.parse(JSON.stringify(old)) : {schemaVersion:1, source:'Google Analytics 4 Data API', periods:{}};
  payload.timeZone = timeZone;
  payload.privacy = {countryMinimumActiveUsers:THRESHOLD, scope:'Published public routes only; no private app or participant records.'};
  if (!realtimeOnly) {
    for (const key of ['daily','7d','28d','mtd','monthly', ...(custom ? ['custom'] : [])]) {
      const range = M.range(key, now, timeZone, custom);
      if (!range) { payload.periods[key] = null; continue; }
      const current = {startDate:range.startDate,endDate:range.endDate,name:'current'};
      const previous = {startDate:range.previousStartDate,endDate:range.previousEndDate,name:'previous'};
      const p = {range, generatedAt:now.toISOString(), summary:null, previous:null};
      const request = (metrics, dimensions = [], dateRanges = [current], extra = {}) => ({
        dateRanges, metrics:metrics.map(name=>({name})), dimensions:dimensions.map(name=>({name})), dimensionFilter:filter, limit:'10000', ...extra
      });
      async function module(name, task) {
        try { p[name] = await task(); }
        catch { p[name] = {status:'unavailable', rows:[]}; console.warn(`${key}/${name}: unavailable; no substitute values published.`); }
      }
      // Full-period distinct counts are queried directly; never sum daily or page-level users.
      await module('totals', async () => {
        const response = await query(request(METRICS, [], [current,previous]));
        const rows = parseReport(response);
        p.summary = summarize(rows.find(r=>r.dateRange==='current'));
        p.previous = summarize(rows.find(r=>r.dateRange==='previous'));
        return {status:'ok', thresholded:Boolean(response.metadata?.subjectToThresholding), sampled:Boolean(response.metadata?.samplingMetadatas?.length)};
      });
      await module('trend', async () => {
        const response = await query(request(METRICS,['date'],[current,previous]));
        const rows=parseReport(response);
        function days(start,end,group){const values=[];for(let date=start;date<=end;date=M.shift(date,1)){const row=rows.find(r=>r.dateRange===group&&r.date===date.replaceAll('-',''));values.push({date,...summarize(row)});}return values;}
        return {status:'ok', current:days(current.startDate,current.endDate,'current'),previous:days(previous.startDate,previous.endDate,'previous')};
      });
      await module('audience', async () => {
        const rows=parseReport(await query(request(['activeUsers','sessions'],['newVsReturning'],[current,previous])));
        p.summary && (p.summary.returningUsers=rows.find(r=>r.dateRange==='current'&&r.newVsReturning==='returning')?.activeUsers ?? 0);
        p.previous && (p.previous.returningUsers=rows.find(r=>r.dateRange==='previous'&&r.newVsReturning==='returning')?.activeUsers ?? 0);
        return {status:'ok', rows:rows.filter(r=>r.dateRange==='current').map(r=>({label:r.newVsReturning==='new'?'New':r.newVsReturning==='returning'?'Returning':'Unclassified',activeUsers:r.activeUsers,sessions:r.sessions}))};
      });
      await module('returningTrend', async () => {
        const rows=parseReport(await query(request(['activeUsers'],['date'],[current],{dimensionFilter:{andGroup:{expressions:[filter,inList('newVsReturning',['returning'])]}}})));
        if(p.trend?.status==='ok')for(const day of p.trend.current)day.returningUsers=rows.find(r=>r.date===day.date.replaceAll('-',''))?.activeUsers??0;
        return {status:'ok'};
      });
      for (const [name,dimension] of [['channels','sessionDefaultChannelGroup'],['devices','deviceCategory'],['countries','country'],['firstSources','firstUserSourceMedium'],['sessionSources','sessionSourceMedium']]) {
        await module(name, async () => {
          const rows=parseReport(await query(request(['activeUsers','sessions'],[dimension], [current],{orderBys:[{metric:{metricName:'activeUsers'},desc:true}]})));
          return {status:'ok', rows:rows.filter(r=>name!=='countries'||r.activeUsers>=THRESHOLD).map(r=>({label:safeSource(r[dimension]) || 'Unclassified',activeUsers:r.activeUsers,sessions:r.sessions})).slice(0,50)};
        });
      }
      await module('pages', async () => {
        const rows=parseReport(await query(request(['activeUsers','screenPageViews','userEngagementDuration','eventCount'],['pagePath'],[current],{orderBys:[{metric:{metricName:'screenPageViews'},desc:true}]})));
        // Root and index.html are the same page; deduplicate its users with a combined GA4 query.
        const home=parseReport(await query(request(['activeUsers','screenPageViews','userEngagementDuration','eventCount'],[],[current],{dimensionFilter:{andGroup:{expressions:[filter,inList('pagePath',['/','/index.html'])]}}})))[0];
        const combined=rows.filter(r=>r.pagePath!=='/'&&r.pagePath!=='/index.html');
        if(home)combined.push({...home,pagePath:'/'});
        return {status:'ok',rows:combined.filter(r=>pages.has(r.pagePath)).map(r=>({path:r.pagePath,...pages.get(r.pagePath),...(r.pagePath==='/'?{title:'BA Medicale — Home'}:{}),activeUsers:r.activeUsers,views:r.screenPageViews,eventCount:r.eventCount,engagement:round(M.ratio(r.userEngagementDuration,r.activeUsers))})).sort((a,b)=>b.views-a.views)};
      });
      await module('landing', async () => {
        const rows=parseReport(await query(request(['sessions','engagedSessions'],['landingPage'],[current],{orderBys:[{metric:{metricName:'sessions'},desc:true}]})));
        return {status:'ok',rows:rows.filter(r=>pages.has(r.landingPage)).map(r=>({path:r.landingPage,title:pages.get(r.landingPage).title,sessions:r.sessions,engagementRate:round(M.ratio(r.engagedSessions,r.sessions))}))};
      });
      await module('content', async () => {
        const rows=[];
        for(const type of [...new Set([...pages.values()].map(p=>p.type))].filter(t=>t!=='Other public pages')) {
          const routes=[...pages].filter(([,p])=>p.type===type).map(([r])=>r);
          const response=await query(request(['activeUsers','screenPageViews','userEngagementDuration'],[],[current],{dimensionFilter:{andGroup:{expressions:[filter,inList('pagePath',routes)]}}}));
          const row=parseReport(response)[0]||{activeUsers:0,screenPageViews:0,userEngagementDuration:0};
          rows.push({title:type,activeUsers:row.activeUsers,views:row.screenPageViews,engagement:round(M.ratio(row.userEngagementDuration,row.activeUsers))});
        }
        return {status:'ok',rows:rows.sort((a,b)=>b.views-a.views)};
      });
      // Independent totals query checks the combined request before publishing this period.
      await module('reconciliation', async () => {
        for(const [label,r] of [['summary',current],['previous',previous]]) {
          if(!p[label])throw new Error('No totals');
          const check=summarize(parseReport(await query(request(METRICS,[],[r])))[0]);
          for(const k of METRICS)if(check[k]!==p[label][k])throw new Error('Totals differ');
        }
        return {status:'passed'};
      });
      if(p.reconciliation.status!=='passed') { console.warn(`${key}: reconciliation failed; retaining the prior complete period if available.`); continue; }
      payload.periods[key]=p;
    }
    if(!payload.periods['28d'])throw new Error('No reconciled 28-day data; keeping existing cache.');
    payload.generatedAt=now.toISOString();
  }
  try {
    // Realtime only supports screen titles, not pagePath. Use an explicit published-title allowlist.
    const titles=[...new Set([...pages.keys()].filter(r=>r!=='/').map(r=>fs.readFileSync(path.join(ROOT,r),'utf8').match(/<title>([^<]+)<\/title>/)?.[1]).filter(Boolean))];
    const rt=await query({metrics:[{name:'activeUsers'}],dimensionFilter:inList('unifiedScreenName',titles)},true);
    payload.realtime={status:'ok',generatedAt:now.toISOString(),activeUsers:parseReport(rt)[0]?.activeUsers??0,windowMinutes:30};
  } catch { payload.realtime={...payload.realtime,status:'unavailable'}; }
  return validate(payload);
}
async function main(){
  if(process.argv.includes('--validate')) {validate(JSON.parse(fs.readFileSync(OUT,'utf8')));console.log('Growth analytics contract valid.');return;}
  const {propertyId,credentials}=readConfiguration();
  const token=await accessToken(credentials);
  const old=fs.existsSync(OUT)?JSON.parse(fs.readFileSync(OUT,'utf8')):null;
  const custom=process.env.TRAFFIC_START&&process.env.TRAFFIC_END?{startDate:process.env.TRAFFIC_START,endDate:process.env.TRAFFIC_END}:null;
  const payload=await collect({propertyId,token,old,custom,realtimeOnly:process.argv.includes('--realtime')});
  if(!process.argv.includes('--realtime'))fs.writeFileSync(OUT,JSON.stringify(payload,null,2)+'\n');
  fs.writeFileSync(path.join(ROOT,'data/traffic-realtime.json'),JSON.stringify({schemaVersion:1,...payload.realtime},null,2)+'\n');
  console.log('Published validated public aggregates; credentials and raw responses were not written.');
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={collect,catalog,publicFilter,validate,summarize,safeSource};
