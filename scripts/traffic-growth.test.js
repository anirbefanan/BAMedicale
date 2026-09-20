const test=require('node:test'),assert=require('node:assert/strict');
const M=require('../traffic-model');
const {catalog,publicFilter,summarize,safeSource}=require('./fetch-growth-analytics');
test('completed-day comparison boundaries are property-timezone based',()=>{
 const now=new Date('2026-09-19T18:00:00Z');
 assert.deepEqual(M.range('daily',now),{startDate:'2026-09-19',endDate:'2026-09-19',previousStartDate:'2026-09-18',previousEndDate:'2026-09-18'});
 assert.deepEqual(M.range('7d',now),{startDate:'2026-09-13',endDate:'2026-09-19',previousStartDate:'2026-09-06',previousEndDate:'2026-09-12'});
 assert.deepEqual(M.range('28d',now),{startDate:'2026-08-23',endDate:'2026-09-19',previousStartDate:'2026-07-26',previousEndDate:'2026-08-22'});
 assert.deepEqual(M.range('mtd',now),{startDate:'2026-09-01',endDate:'2026-09-19',previousStartDate:'2026-08-01',previousEndDate:'2026-08-19'});
 assert.deepEqual(M.range('monthly',now),{startDate:'2026-08-01',endDate:'2026-08-31',previousStartDate:'2026-07-01',previousEndDate:'2026-07-31'});
 assert.equal(M.range('daily',now,'UTC').endDate,'2026-09-18');
});
test('month starts, leap years, short previous months and custom ranges',()=>{
 assert.equal(M.range('mtd',new Date('2026-09-01T03:00Z')),null);
 assert.equal(M.range('mtd',new Date('2024-03-31T03:00Z')).previousEndDate,'2024-02-29');
 assert.equal(M.range('mtd',new Date('2024-03-31T03:00Z')).endDate,'2024-03-29');
 assert.deepEqual(M.range('custom',new Date('2026-09-20T03:00Z'),'Asia/Jakarta',{startDate:'2026-09-03',endDate:'2026-09-10'}),{startDate:'2026-09-03',endDate:'2026-09-10',previousStartDate:'2026-08-26',previousEndDate:'2026-09-02'});
 assert.throws(()=>M.range('custom',new Date(),'Asia/Jakarta',{startDate:'2026-02-30',endDate:'2026-03-04'}));
 assert.throws(()=>M.range('custom',new Date('2026-09-20'),'Asia/Jakarta',{startDate:'2026-09-20',endDate:'2026-09-20'}));
});
test('missing denominators never produce fake zero percent or infinite growth',()=>{
 assert.equal(M.ratio(0,0),null);assert.equal(M.change(5,0),null);assert.equal(M.change(null,5),null);
 assert.equal(M.change(125,100),.25);assert.equal(M.change(75,100),-.25);
 assert.equal(summarize({activeUsers:4,userEngagementDuration:100,sessions:10,engagedSessions:3}).engagementRate,.3);
 assert.equal(summarize({activeUsers:4,userEngagementDuration:100}).averageEngagementTimeSeconds,25);
});
test('public path and source policy rejects private app paths and arbitrary labels',()=>{
 const pages=catalog();assert.ok(pages.has('/'));assert.ok(![...pages.keys()].some(p=>/jumi|admin|login/.test(p)));
 assert.ok(publicFilter(pages).andGroup);
 assert.equal(safeSource('person@example.com'),'Other');assert.equal(safeSource('token=secret'),'Other');
 assert.equal(safeSource('google / organic'),'google / organic');
});
test('insights are derived only from selected measured aggregates',()=>{
 assert.deepEqual(M.insights(null),[]);
 const p={summary:{activeUsers:125,sessions:100},previous:{activeUsers:100},devices:{rows:[{label:'mobile',sessions:70},{label:'desktop',sessions:30}]}};
 assert.match(M.insights(p)[0],/25.0%/);assert.match(M.insights(p)[1],/70.0%/);
});

test('independent module failures do not fabricate metrics or erase other modules',async()=>{
 const {collect}=require('./fetch-growth-analytics');
 const request=async(url,options)=>{
  const body=JSON.parse(options.body);
  if(body.dimensions?.some(d=>d.name==='country'))throw new Error('simulated unavailable');
  return {metadata:{timeZone:'Asia/Jakarta'},dimensionHeaders:(body.dimensions||[]),metricHeaders:body.metrics,rows:[]};
 };
 const result=await collect({propertyId:'test',token:'test',now:new Date('2026-09-20T03:00Z'),request});
 assert.equal(result.periods['28d'].summary.activeUsers,0);
 assert.equal(result.periods['28d'].summary.averageEngagementTimeSeconds,null);
 assert.equal(result.periods['28d'].countries.status,'unavailable');
 assert.equal(result.periods['28d'].devices.status,'ok');
 assert.equal(result.periods['28d'].reconciliation.status,'passed');
});

test('unreconciled totals retain the last valid complete period',async()=>{
 const {collect}=require('./fetch-growth-analytics');
 const baseline=JSON.parse(require('node:fs').readFileSync(require('node:path').join(__dirname,'../data/growth-analytics.json'),'utf8'));
 const request=async(url,options)=>{
  const body=JSON.parse(options.body);
  if(body.metrics.length===9&&!body.dimensions?.length)throw new Error('simulated totals failure');
  return {metadata:{timeZone:'Asia/Jakarta'},dimensionHeaders:(body.dimensions||[]),metricHeaders:body.metrics,rows:[]};
 };
 const result=await collect({propertyId:'test',token:'test',old:baseline,now:new Date('2026-09-20T03:00Z'),request});
 assert.deepEqual(result.periods['28d'],baseline.periods['28d']);
});
