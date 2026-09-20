const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const {applyPublication,validateManifest,hashFile} = require("./apply-publication.js");
const {validate:validateReleasePaths} = require("./validate-release-diff.js");

const workflow = fs.readFileSync(path.resolve(__dirname,"../../.github/workflows/publish-jumi-content.yml"),"utf8");
const backend = fs.readFileSync(path.join(__dirname,"backend.js"),"utf8");
const app = fs.readFileSync(path.resolve(__dirname,"../../jumi/app.js"),"utf8");
const sha = buffer=>crypto.createHash("sha256").update(buffer).digest("hex");

function fixture(type){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),"jumi-publisher-"));
  fs.writeFileSync(path.join(root,"content.js"),`window.BAMEDICALE_JUMI_PUBLICATIONS = {\n  articles: {\n    // JUMI_PUBLISHED_ARTICLES_START\n    // JUMI_PUBLISHED_ARTICLES_END\n  },\n  ebooks: [\n    // JUMI_PUBLISHED_EBOOKS_START\n    // JUMI_PUBLISHED_EBOOKS_END\n  ]\n};\n`);
  const id=type==="Article"?"content_aaaaaaaaaaaaaaaa":"content_bbbbbbbbbbbbbbbb",slug=type==="Article"?"qa-source-article":"qa-source-ebook",base=type==="Article"?`assets/articles/${slug}`:`assets/ebooks/${slug}`,source=Buffer.from("%PDF-1.4\nsource fixture\n%%EOF\n"),artwork=Buffer.from("approved artwork fixture");
  fs.mkdirSync(path.join(root,base),{recursive:true});
  fs.writeFileSync(path.join(root,base,"source.pdf"),source);
  fs.writeFileSync(path.join(root,base,type==="Article"?"artwork.jpg":"cover.jpg"),artwork);
  const publication=type==="Article"?{primaryAudience:"PUBLIC",primaryDiseaseGroup:"endocrine-metabolic",primaryTopic:"Diagnosis",sections:[{title:"Evidence",body:["Source-faithful fixture text."]}],references:["Fixture reference"],promotion:{hook:"Source-grounded fixture hook",teaser:["Source-grounded fixture teaser"],hashtags:["#Thyroid","#MedicalEducation"]}}:{primaryAudience:"DOCTOR",primaryDiseaseGroup:"endocrine-metabolic",topics:["Thyroid"],downloadable:false};
  const manifest={schemaVersion:1,contentId:id,contentType:type,slug,version:4,baseSha:"1".repeat(40),requestedAt:"2026-09-20T10:00:00+07:00",metadata:{title:type==="Article"?"QA source article":"QA source eBook",subtitle:"Non-public fixture",author:"Fixture author",publisher:type==="eBook"?"Fixture publisher":"",publishedDate:"2026-09-20",source:type==="Article"?"Fixture source":"",tags:["Thyroid"],quickSummary:"Source-grounded fixture summary.",publication},assets:{source:{path:`${base}/source.pdf`,mimeType:"application/pdf",sha256:sha(source)},artwork:{path:`${base}/${type==="Article"?"artwork":"cover"}.jpg`,mimeType:"image/jpeg",extension:"jpg",sha256:sha(artwork)}}};
  if(type==="eBook")fs.writeFileSync(path.join(root,base,"pages.json"),JSON.stringify({sourceSha256:sha(source),pageAspect:1.294,pages:[{image:`${base}/page-1.png`,text:"Source PDF page 1"}]},null,2));
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
  assert.doesNotMatch(app,/JUMI_GITHUB_TOKEN|api\.github\.com|github_pat_|ghp_/);
  assert.match(workflow,/workflow_dispatch:/);
  assert.match(workflow,/permissions:\s*\n\s*contents: write/);
  assert.match(workflow,/apply-publication\.js --request .* --contract-only/);
  assert.match(workflow,/validate-release-diff\.js/);
  assert.match(workflow,/git push origin HEAD:main/);
  assert.doesNotMatch(workflow,/pull_request_target|secrets\./);
});

test("release output allowlist accepts generated publication files and rejects arbitrary writes",()=>{
  const f=fixture("Article");
  const allowed=["content.js",`articles/${f.manifest.slug}.html`,f.manifest.assets.source.path,f.manifest.assets.artwork.path,`data/jumi-publications/${f.manifest.contentId}.json`,`data/jumi-publication-requests/${f.manifest.contentId}.json`,"sitemap.xml"];
  assert.equal(validateReleasePaths(f.manifest,allowed),true);
  assert.throws(()=>validateReleasePaths(f.manifest,[...allowed,"index.html"]),/disallowed paths/);
  assert.throws(()=>validateReleasePaths(f.manifest,[...allowed,"Material/private.pdf"]),/disallowed paths/);
  fs.rmSync(f.root,{recursive:true,force:true});
});
