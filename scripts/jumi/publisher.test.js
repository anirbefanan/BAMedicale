const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const {applyPublication,validateManifest,hashFile} = require("./apply-publication.js");
const {validate:validateReleasePaths} = require("./validate-release-diff.js");
const {prepareSeminar} = require("./prepare-seminar.js");
const renderEvent = require("../event-template.js");
const renderPresentation = require("../presentation-template.js");

const workflow = fs.readFileSync(path.resolve(__dirname,"../../.github/workflows/publish-jumi-content.yml"),"utf8");
const backend = fs.readFileSync(path.join(__dirname,"backend.js"),"utf8");
const app = fs.readFileSync(path.resolve(__dirname,"../../jumi/app.js"),"utf8");
const sha = buffer=>crypto.createHash("sha256").update(buffer).digest("hex");

function fixture(type){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),"jumi-publisher-"));
  fs.writeFileSync(path.join(root,"content.js"),`window.BAMEDICALE_JUMI_PUBLICATIONS = {\n  articles: {\n    // JUMI_PUBLISHED_ARTICLES_START\n    // JUMI_PUBLISHED_ARTICLES_END\n  },\n  ebooks: [\n    // JUMI_PUBLISHED_EBOOKS_START\n    // JUMI_PUBLISHED_EBOOKS_END\n  ],\n  seminars: {\n    // JUMI_PUBLISHED_SEMINARS_START\n    // JUMI_PUBLISHED_SEMINARS_END\n  }\n};\nwindow.BAMEDICALE_DATA={seminars:{"qa-source-seminar":{id:"qa-source-seminar",title:"QA Seminar",sessions:[["Fixture topic","Fixture author","fixture-doctor"]]}},presentations:{\n  // JUMI_PUBLISHED_PRESENTATIONS_START\n  // JUMI_PUBLISHED_PRESENTATIONS_END\n}};\n`);
  const ids={Article:"content_aaaaaaaaaaaaaaaa",eBook:"content_bbbbbbbbbbbbbbbb",Seminar:"content_cccccccccccccccc",Presentation:"content_dddddddddddddddd"},slugs={Article:"qa-source-article",eBook:"qa-source-ebook",Seminar:"qa-source-seminar",Presentation:"qa-source-presentation"},folders={Article:"articles",eBook:"ebooks",Seminar:"events",Presentation:"presentations"},id=ids[type],slug=slugs[type],base=`assets/${folders[type]}/${slug}`,source=Buffer.from("%PDF-1.4\nsource fixture\n%%EOF\n"),artwork=Buffer.from("approved artwork fixture");
  fs.mkdirSync(path.join(root,base),{recursive:true});
  if(type!=="Seminar")fs.writeFileSync(path.join(root,base,"source.pdf"),source);
  if(type!=="Presentation")fs.writeFileSync(path.join(root,base,type==="Article"?"artwork.jpg":type==="eBook"?"cover.jpg":"poster.jpg"),artwork);
  const publication=type==="Article"?{primaryAudience:"PUBLIC",sourceDownloadApproved:true,primaryDiseaseGroup:"endocrine-metabolic",primaryTopic:"Diagnosis",sections:[{title:"Evidence",body:["Source-faithful fixture text."]}],references:["Fixture reference"],promotion:{hook:"Source-grounded fixture hook",teaser:["Source-grounded fixture teaser"],hashtags:["#Thyroid","#MedicalEducation"]}}:type==="Seminar"?{eventId:slug,primaryAudience:"DOCTOR",primaryDiseaseGroup:"endocrine-metabolic",format:"Live webinar",startDate:"2026-10-20T09:00:00+07:00",endDate:"2026-10-20T11:00:00+07:00",registrationOpen:"2026-09-20T09:00:00+07:00",registrationClose:"2026-10-20T08:00:00+07:00",date:"20 October 2026",time:"09.00–11.00 WIB",location:"Zoom",attendanceMode:"Online",platform:"Zoom",venue:"",address:"",commercial:"Free",price:0,currency:"IDR",isAccessibleForFree:true,registration:"registration.example.test/qa-seminar",faculty:[["Speaker","Fixture doctor"]],sessions:[["Fixture topic","Fixture doctor","fixture-doctor"]]}:type==="Presentation"?{eventId:"qa-source-seminar",speakerId:"fixture-doctor",sourceAttribution:"Original fixture presentation",sourceDownloadApproved:true,primaryAudience:"DOCTOR",primaryDiseaseGroup:"endocrine-metabolic",topics:["Thyroid"],quickRead:[{title:"Fixture point",body:"Source-grounded fixture summary.",pages:[1]}]}:{primaryAudience:"DOCTOR",primaryDiseaseGroup:"endocrine-metabolic",topics:["Thyroid"],downloadable:false,sourceDownloadApproved:true,authorType:"Organization"};
  const assets={source:type==="Seminar"?null:{path:`${base}/source.pdf`,mimeType:"application/pdf",sha256:sha(source),public:true},artwork:type==="Presentation"?null:{path:`${base}/${type==="Article"?"artwork":type==="eBook"?"cover":"poster"}.jpg`,mimeType:"image/jpeg",extension:"jpg",sha256:sha(artwork)}};
  const manifest={schemaVersion:1,contentId:id,contentType:type,slug,version:4,baseSha:"1".repeat(40),requestedAt:"2026-09-20T10:00:00+07:00",metadata:{title:`QA source ${type}`,subtitle:"Non-public fixture",author:type==="Seminar"?"":"Fixture author",publisher:type==="eBook"?"Fixture publisher":"",publishedDate:type==="Seminar"?"":"2026-09-20",source:type==="Article"||type==="Presentation"?"Fixture source":"",tags:["Thyroid"],quickSummary:"Source-grounded fixture summary.",publication},assets};
  if(["eBook","Presentation"].includes(type)){const slide=Buffer.from("source-faithful slide fixture");fs.writeFileSync(path.join(root,base,"page-1.png"),slide);fs.writeFileSync(path.join(root,base,"pages.json"),JSON.stringify({sourceSha256:sha(source),pageAspect:1.294,pages:[{page:1,image:`${base}/page-1.png`,imageSha256:sha(slide),text:"Source PDF page 1",textAvailable:true,width:1600,height:900,figures:[]}]},null,2));}
  const request=`data/jumi-publication-requests/${id}.json`;
  fs.mkdirSync(path.join(root,"data/jumi-publication-requests"),{recursive:true});
  fs.writeFileSync(path.join(root,request),JSON.stringify(manifest,null,2));
  return{root,manifest,request,source};
}

test("Article release contract produces only canonical public record and receipt",t=>{
  const f=fixture("Article");t.after(()=>fs.rmSync(f.root,{recursive:true,force:true}));
  const result=applyPublication(f.root,f.request);
  assert.equal(result.record.slug,f.manifest.slug);
  assert.equal(result.record.sourcePdf,f.manifest.assets.source.path);
  assert.equal(result.record.cover,f.manifest.assets.artwork.path);
  assert.match(fs.readFileSync(path.join(f.root,"content.js"),"utf8"),/qa-source-article/);
  const receipt=JSON.parse(fs.readFileSync(path.join(f.root,"data/jumi-publications",`${f.manifest.contentId}.json`),"utf8"));
  assert.equal(receipt.publicUrl,"https://bamedicale.com/articles/qa-source-article.html");
  assert.doesNotMatch(JSON.stringify(receipt),/Drive|admin|token|audit/i);
  assert.equal(fs.existsSync(path.join(f.root,f.request)),false);
});

test("Article release maps reviewed JUMI audience labels and keeps source and BA dates distinct",t=>{
  const f=fixture("Article");t.after(()=>fs.rmSync(f.root,{recursive:true,force:true}));
  f.manifest.metadata.publication.primaryAudience="Doctors";
  f.manifest.metadata.sourcePublishedDate="2025-04-12";
  fs.writeFileSync(path.join(f.root,f.request),JSON.stringify(f.manifest,null,2));
  const result=applyPublication(f.root,f.request,{dryRun:true});
  assert.equal(result.record.primaryAudience,"DOCTOR");
  assert.equal(result.record.sourcePublicationDate,"2025-04-12");
  assert.equal(result.record.publishedDate,"2026-09-20");
  const invalid=structuredClone(f.manifest);invalid.metadata.publication.primaryAudience="Needs Review";
  fs.writeFileSync(path.join(f.root,f.request),JSON.stringify(invalid,null,2));
  assert.throws(()=>validateManifest(invalid,f.root,{requirePrepared:false}),/Unsupported Article audience classification/);
});

test("private Article source provenance crosses the contract as a hash, not a public file",t=>{
  const f=fixture("Article");t.after(()=>fs.rmSync(f.root,{recursive:true,force:true}));
  f.manifest.metadata.publication.sourceDownloadApproved=false;
  f.manifest.assets.source.path="";
  f.manifest.assets.source.public=false;
  fs.writeFileSync(path.join(f.root,f.request),JSON.stringify(f.manifest,null,2));
  fs.unlinkSync(path.join(f.root,`assets/articles/${f.manifest.slug}/source.pdf`));
  const result=applyPublication(f.root,f.request,{dryRun:true});
  assert.equal(result.record.sourcePdf,"");
  assert.equal(result.receipt.sourceSha256,f.manifest.assets.source.sha256);
  assert.doesNotMatch(JSON.stringify(result.record),/Drive|folder|admin|private/i);
  assert.throws(()=>validateReleasePaths(f.manifest,[`assets/articles/${f.manifest.slug}/source.pdf`]),/disallowed paths/);
});

test("eBook release preserves source bytes and maps cover before original pages",t=>{
  const f=fixture("eBook");t.after(()=>fs.rmSync(f.root,{recursive:true,force:true}));
  const before=hashFile(path.join(f.root,f.manifest.assets.source.path));
  const result=applyPublication(f.root,f.request,{dryRun:true});
  assert.equal(hashFile(path.join(f.root,f.manifest.assets.source.path)),before);
  assert.equal(result.record.coverAsPage,true);
  assert.equal(result.record.sourcePages,true);
  assert.equal(result.record.pages[0].title,"Source PDF page 1");
  assert.equal(result.record.pageManifest,`assets/ebooks/${f.manifest.slug}/pages.json`);
  assert.equal(fs.existsSync(path.join(f.root,f.request)),true);
});

test("eBook release requires explicit public-reader source approval",t=>{
  const f=fixture("eBook");t.after(()=>fs.rmSync(f.root,{recursive:true,force:true}));
  f.manifest.metadata.publication.sourceDownloadApproved=false;
  f.manifest.assets.source.public=false;
  f.manifest.assets.source.path="";
  assert.throws(()=>validateManifest(f.manifest,f.root,{requirePrepared:false}),/explicit approval/);
});

test("Seminar release produces the canonical event record without private operational data",t=>{const f=fixture("Seminar");t.after(()=>fs.rmSync(f.root,{recursive:true,force:true}));const result=applyPublication(f.root,f.request,{dryRun:true}),html=renderEvent({event:result.record,index:0,seminars:[result.record],diseaseGroup:{name:"Endocrine & Metabolic Diseases"},domain:"https://bamedicale.com"});assert.equal(result.record.id,f.manifest.slug);assert.equal(result.record.artwork,f.manifest.assets.artwork.path);assert.equal(result.receipt.publicUrl,`https://bamedicale.com/events/${f.manifest.slug}.html`);assert.match(html,/Registration tools/);assert.match(html,/Google Calendar/);assert.match(html,/Add to Calendar \(\.ics\)/);assert.doesNotMatch(JSON.stringify(result.record)+html,/registrant|payment status|attendance status|Drive|folder id|admin identity/i);});

test("Seminar preparation creates verified permanent-registration QR and calendar assets",async t=>{const f=fixture("Seminar");t.after(()=>fs.rmSync(f.root,{recursive:true,force:true}));await prepareSeminar(f.root,f.request,`assets/events/${f.manifest.slug}`);const folder=path.join(f.root,"assets/events",f.manifest.slug);for(const name of["registration-qr.svg","registration-qr.png",`${f.manifest.slug}.ics`])assert.equal(fs.existsSync(path.join(folder,name)),true);const calendar=fs.readFileSync(path.join(folder,`${f.manifest.slug}.ics`),"utf8");assert.match(calendar,/BEGIN:VEVENT/);assert.match(calendar,/DTSTART:20261020T020000Z/);assert.match(calendar,/DTEND:20261020T040000Z/);assert.match(calendar,/LOCATION:Zoom/);assert.match(calendar,/URL:https:\/\/bamedicale\.com\/events\/qa-source-seminar\.html/);assert.doesNotMatch(calendar,/Drive|token|admin|registrant/i);});

test("Presentation release preserves source hash and speaker/event association",t=>{const f=fixture("Presentation");t.after(()=>fs.rmSync(f.root,{recursive:true,force:true}));const before=hashFile(path.join(f.root,f.manifest.assets.source.path)),image=path.join(f.root,`assets/presentations/${f.manifest.slug}/page-1.png`);fs.writeFileSync(image,"source-faithful slide fixture");const result=applyPublication(f.root,f.request,{dryRun:true}),event={id:"qa-source-seminar",title:"QA Seminar",startDate:"2026-10-20T09:00:00+07:00",date:"20 October 2026",detailUrl:"events/qa-source-seminar.html"},html=renderPresentation({presentation:result.record,event,diseaseGroup:{name:"Endocrine & Metabolic Diseases"},root:f.root,domain:"https://bamedicale.com"});assert.equal(hashFile(path.join(f.root,f.manifest.assets.source.path)),before);assert.equal(result.record.id,f.manifest.slug);assert.equal(result.record.eventId,event.id);assert.equal(result.record.speakerId,"fixture-doctor");assert.equal(result.record.cover,`assets/presentations/${f.manifest.slug}/page-1.png`);assert.match(html,/Quick Read/);assert.match(html,/Original PDF · page 1 of 1/);assert.match(html,/Return to seminar/);});

test("Presentation contract keeps download approval, association, Quick Read, media and infographic explicit",t=>{
  const f=fixture("Presentation");t.after(()=>fs.rmSync(f.root,{recursive:true,force:true}));
  const base=`assets/presentations/${f.manifest.slug}`,video=Buffer.from("approved source video"),infographic=Buffer.from("approved infographic");
  fs.writeFileSync(path.join(f.root,base,"video.mp4"),video);fs.writeFileSync(path.join(f.root,base,"infographic.png"),infographic);
  f.manifest.assets.media={path:`${base}/video.mp4`,mimeType:"video/mp4",extension:"mp4",sha256:sha(video)};
  f.manifest.assets.infographic={path:`${base}/infographic.png`,mimeType:"image/png",extension:"png",sha256:sha(infographic)};
  f.manifest.metadata.publication.mediaPage=1;
  const pages=JSON.parse(fs.readFileSync(path.join(f.root,base,"pages.json"),"utf8"));pages.videoSha256=sha(video);fs.writeFileSync(path.join(f.root,base,"pages.json"),JSON.stringify(pages,null,2));
  fs.writeFileSync(path.join(f.root,f.request),JSON.stringify(f.manifest,null,2));
  const result=applyPublication(f.root,f.request,{dryRun:true});
  assert.equal(result.record.video,`${base}/video.mp4`);assert.equal(result.record.videoPage,1);assert.equal(result.record.cover,`${base}/infographic.png`);assert.equal(result.record.downloadable,true);
  const privateSource=structuredClone(f.manifest);privateSource.assets.source.public=false;privateSource.assets.source.path="";privateSource.metadata.publication.sourceDownloadApproved=false;
  assert.throws(()=>validateManifest(privateSource,f.root,{requirePrepared:false}),/explicit approval/);
  const wrongSpeaker=structuredClone(f.manifest);wrongSpeaker.metadata.publication.speakerId="unknown-speaker";
  assert.throws(()=>validateManifest(wrongSpeaker,f.root,{requirePrepared:false}),/existing canonical Seminar speaker/);
});

test("publication contract fails closed on traversal, asset tampering, and missing prepared pages",t=>{
  const f=fixture("eBook");t.after(()=>fs.rmSync(f.root,{recursive:true,force:true}));
  assert.doesNotThrow(()=>validateManifest(f.manifest,f.root,{requirePrepared:false}));
  const traversal=structuredClone(f.manifest);traversal.slug="../escape";
  assert.throws(()=>validateManifest(traversal,f.root,{requirePrepared:false}),/Invalid publication slug/);
  fs.appendFileSync(path.join(f.root,f.manifest.assets.source.path),"tampered");
  assert.throws(()=>validateManifest(f.manifest,f.root,{requirePrepared:false}),/integrity check failed/);
  fs.writeFileSync(path.join(f.root,f.manifest.assets.source.path),f.source);
  fs.unlinkSync(path.join(f.root,`assets/ebooks/${f.manifest.slug}/pages.json`));
  assert.throws(()=>validateManifest(f.manifest,f.root),/page manifest is required/);
});

test("publisher stays server-only and dispatches one validated workflow",()=>{
  assert.match(backend,/Session\.getActiveUser\(\)\.getEmail\(\)/);
  assert.match(backend,/JUMI_GITHUB_TOKEN/);
  assert.match(backend,/PUBLISH_DISPATCHED/);
  assert.match(backend,/PUBLISH_FAILED/);
  assert.match(backend,/PUBLISH_CONFIRMED/);
  assert.match(backend,/\/pages\/builds/);
  assert.match(backend,/\/pages\/builds\/latest/);
  assert.match(backend,/assets\/articles\//);
  assert.match(backend,/assets\/ebooks\//);
  assert.match(backend,/assets\/events\//);
  assert.match(backend,/assets\/presentations\//);
  assert.doesNotMatch(app,/JUMI_GITHUB_TOKEN|api\.github\.com|github_pat_|ghp_/);
  assert.match(workflow,/workflow_dispatch:/);
  assert.match(workflow,/permissions:\s*\n\s*contents: write/);
  assert.match(workflow,/apply-publication\.js --request .* --contract-only/);
  assert.match(workflow,/validate-release-diff\.js/);
  assert.match(workflow,/git push origin HEAD:main/);
  assert.doesNotMatch(workflow,/pull_request_target|secrets\./);
});

test("workflow prepares Seminar and Presentation outputs with the same guarded publisher",()=>{assert.match(workflow,/npm ci --ignore-scripts/);assert.match(workflow,/TYPE.*Presentation/s);assert.match(workflow,/prepare-presentation\.js/);assert.match(workflow,/TYPE.*Seminar/s);assert.match(workflow,/prepare-seminar\.js/);assert.match(workflow,/git push origin HEAD:main/);});

test("release output allowlist accepts generated publication files and rejects arbitrary writes",()=>{
  const f=fixture("Article");
  const allowed=["content.js",`articles/${f.manifest.slug}.html`,f.manifest.assets.source.path,f.manifest.assets.artwork.path,`data/jumi-publications/${f.manifest.contentId}.json`,`data/jumi-publication-requests/${f.manifest.contentId}.json`,"sitemap.xml"];
  assert.equal(validateReleasePaths(f.manifest,allowed),true);
  assert.throws(()=>validateReleasePaths(f.manifest,[...allowed,"index.html"]),/disallowed paths/);
  assert.throws(()=>validateReleasePaths(f.manifest,[...allowed,"Material/private.pdf"]),/disallowed paths/);
  fs.rmSync(f.root,{recursive:true,force:true});
});

test("Presentation release may update only its associated Seminar page",()=>{const f=fixture("Presentation"),base=["content.js",`presentations/${f.manifest.slug}.html`,`events/${f.manifest.metadata.publication.eventId}.html`,f.manifest.assets.source.path,`assets/presentations/${f.manifest.slug}/pages.json`,`assets/presentations/${f.manifest.slug}/page-1.png`,`data/jumi-publications/${f.manifest.contentId}.json`,`data/jumi-publication-requests/${f.manifest.contentId}.json`,`sitemap.xml`,`data/jumi-public-catalog.json`];assert.equal(validateReleasePaths(f.manifest,base),true);assert.throws(()=>validateReleasePaths(f.manifest,[...base,"events/unrelated-event.html"]),/disallowed paths/);fs.rmSync(f.root,{recursive:true,force:true});});
