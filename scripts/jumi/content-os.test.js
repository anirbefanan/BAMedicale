const test=require("node:test"),assert=require("node:assert/strict"),os=require("../../jumi/content-os.js");
const now=Date.parse("2026-09-21T12:00:00+07:00");
test("Content OS artwork locks accept only the required ratios",()=>{assert.equal(os.artwork("Article",1600,900).valid,true);assert.equal(os.artwork("Article",900,1600).valid,false);assert.equal(os.artwork("eBook",900,1200).valid,true);assert.equal(os.artwork("Seminar",707,1000).valid,true);});
test("Article intelligence separates audience, content type, tags, and hashtags",()=>{const result=os.recommendArticle({title:"Clinical diagnosis and treatment guide",quickSummary:"A practical clinician guide.",tags:["Thyroid","Oncology"]});assert.equal(result.primaryAudience,"Doctors");assert.equal(result.contentType,"Educational Guide");assert.deepEqual(result.tags,["Thyroid","Oncology"]);assert.deepEqual(result.socialKit.hashtags,["#Thyroid","#Oncology"]);});
test("ambiguous Article evidence remains Needs Review",()=>{const result=os.recommendArticle({title:"An overview"});assert.equal(result.status,"Needs Review");assert.equal(result.primaryAudience,"");});
test("period selector uses Jakarta calendar boundaries and equivalent previous periods",()=>{
  const data={content:[{id:"a",type:"Article",status:"Published",publishedAt:"2026-09-21T08:00:00+07:00"},{id:"b",type:"eBook",status:"Published",publishedAt:"2026-09-14T08:00:00+07:00"},{id:"c",type:"Article",status:"Published",publishedAt:"2026-09-13T08:00:00+07:00"},{id:"d",type:"Article",status:"Published",publishedAt:"2026-08-20T08:00:00+07:00"}],events:[]};
  const seven=os.dashboard(data,now,"All","7D");assert.equal(seven.range.start,"2026-09-15");assert.equal(seven.range.previousStart,"2026-09-08");assert.equal(seven.summary.published,1);assert.equal(seven.comparison.previous,2);assert.equal(seven.comparison.delta,-50);
  const all=os.dashboard(data,now,"All","All Time");assert.equal(all.summary.published,4);assert.equal(all.comparison.previous,null);assert.equal(all.comparison.delta,null);
  const ytd=os.dashboard(data,now,"All","YTD");assert.equal(ytd.range.start,"2026-01-01");assert.equal(ytd.range.previousStart,"2025-01-01");
});
test("dashboard counts unique published records and source-backed classifications",()=>{
  const url="https://bamedicale.com/presentations/example.html",data={content:[{id:"p",type:"Presentation",title:"Example",status:"Published",publicUrl:url,publishedAt:"2026-09-18",typeData:{publication:{primaryAudience:"Doctors",secondaryAudiences:["Other HCP"],topics:["Diagnosis"]}}},{id:"f",type:"eBook",title:"Failed",status:"Failed",updatedAt:"2026-09-20"},{id:"r",type:"Article",status:"Validation Required",updatedAt:"2026-09-20"}],publicCatalog:[{id:"duplicate",type:"Presentation",publicUrl:url,publishedAt:"2026-09-18"},{id:"a",type:"Article",status:"Published",publicUrl:"https://bamedicale.com/articles/a.html",publishedAt:"2026-09-19",primaryAudience:"PUBLIC",primaryTopic:"Prevention"}],events:[]};
  const result=os.dashboard(data,now,"All","7D");assert.equal(result.summary.published,2);assert.equal(result.summary.failed,1);assert.equal(result.summary.needsReview,1);assert.equal(result.mix.find(x=>x.label==="Presentation").count,1);assert.equal(result.audience.find(x=>x.label==="Healthcare Professionals").count,1);assert.equal(result.audience.find(x=>x.label==="Public").count,1);assert.equal(result.inventory.total,2);assert.equal(result.topTopics.find(x=>x.label==="Diagnosis").count,1);
});
test("updates affect activity and coverage recency but do not change publication-period counts",()=>{
  const data={content:[{id:"a",type:"Article",title:"Older",status:"Published",publishedAt:"2026-08-01",updatedAt:"2026-09-21T09:00:00+07:00",typeData:{publication:{primaryAudience:"Public"}}}],events:[]},result=os.dashboard(data,now,"All","7D");assert.equal(result.summary.published,0);assert.equal(result.recent[0].activityKind,"Updated");assert.equal(result.coverage.find(x=>x.label==="Public").lastActivity,"2026-09-21T09:00:00+07:00");
});
test("empty records have zero-safe metrics and explicit current queues",()=>{
  const result=os.dashboard({content:[{id:"d",type:"Article",status:"Draft",createdAt:"2026-09-20"}],events:[]},now,"All","30D");assert.equal(result.summary.published,0);assert.equal(result.summary.drafts,1);assert.equal(result.summary.velocity,0);assert.equal(result.comparison.delta,null);assert.ok(result.trend.rows.length>0);
});
test("All Time includes published records without dates while trend and velocity use dated records",()=>{
  const data={content:[{id:"dated",type:"Article",status:"Published",publishedAt:"2026-09-20"},{id:"undated",type:"eBook",status:"Published"}],events:[]},result=os.dashboard(data,now,"All","All Time");
  assert.equal(result.summary.published,2);assert.equal(result.inventory.total,2);assert.equal(result.trend.rows.reduce((sum,row)=>sum+row.count,0),1);
});
test("Upcoming Seminars excludes unpublished drafts",()=>{
  const data={content:[],events:[{id:"draft",lifecycle:"Draft",publicUrl:"",startAt:"2026-10-01T09:00:00+07:00"},{id:"published",lifecycle:"Published",publicUrl:"https://bamedicale.com/events/published.html",startAt:"2026-10-02T09:00:00+07:00"}]};
  assert.equal(os.dashboard(data,now).summary.upcoming,1);
});
test("3M and 1Y selections use equal-length previous windows",()=>{
  for(const selection of ["3M","1Y"]){const range=os.periodRange(selection,now);const days=(a,b)=>Math.round((Date.parse(b+"T00:00:00+07:00")-Date.parse(a+"T00:00:00+07:00"))/86400000)+1;assert.equal(days(range.start,range.end),days(range.previousStart,range.previousEnd));}
});
