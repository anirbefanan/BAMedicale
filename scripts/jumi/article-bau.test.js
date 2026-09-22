const test=require("node:test"),assert=require("node:assert/strict"),fs=require("fs"),path=require("path"),vm=require("vm");

const root=path.resolve(__dirname,"../..");
const backend=fs.readFileSync(path.join(__dirname,"backend.js"),"utf8");
const client=fs.readFileSync(path.join(root,"jumi/app.js"),"utf8");
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,"appsscript.json"),"utf8"));
const articleBuilder=fs.readFileSync(path.join(root,"scripts/build-articles.js"),"utf8");
const registry=fs.readFileSync(path.join(root,"content-registry.js"),"utf8");
const start=backend.indexOf("function jumiNormalizeTags_");
const end=backend.indexOf("function jumiContentIssues_");
const context={JUMI_ARTICLE_TAG_ALIASES:{"thyroid nodule":"Thyroid Nodules","thyroid nodules":"Thyroid Nodules",ultrasound:"Ultrasonography",ultrasonography:"Ultrasonography",oncology:"Oncology"},jumiSlug_:value=>String(value||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""),Utilities:{formatDate:date=>date.toISOString().slice(0,10)}};
vm.createContext(context);
vm.runInContext(backend.slice(start,end),context);

const pdf=(text="source")=>({getContentType:()=>"application/pdf",getBytes:()=>Array.from(Buffer.from(`%PDF-1.4\n${text}\n%%EOF`))});

test("Article source validation checks the actual PDF signature",()=>{
  assert.equal(context.jumiPdfBlobValid_(pdf()),true);
  assert.equal(context.jumiPdfBlobValid_({getContentType:()=>"application/pdf",getBytes:()=>Array.from(Buffer.from("not a pdf"))}),false);
});

test("source analysis preserves evidence and keeps source date separate",()=>{
  const text=`Title: Evidence-Based Thyroid Nodule Diagnosis\nAuthor: Dr Example\nSource: Clinical Journal\nPublication date: 2025-04-12\nAbstract\nThis clinical guide explains diagnosis and ultrasound assessment for physicians using source-supported evidence.\nMethods\nThe diagnostic approach follows the supplied publication.\nReferences\nClinical Journal. 2025;1:1-8.`;
  const result=context.jumiAnalyzeArticleEvidence_(text,{slug:"evidence-based-thyroid-nodule-diagnosis",tags:[]});
  assert.equal(result.title,"Evidence-Based Thyroid Nodule Diagnosis");
  assert.equal(result.author,"Dr Example");
  assert.equal(result.source,"Clinical Journal");
  assert.equal(result.sourcePublishedDate,"2025-04-12");
  assert.equal(result.recommendation.primaryAudience,"Doctors");
  assert.equal(result.recommendation.status,"Recommended");
  assert.equal(result.recommendation.contentType,"Educational Guide");
  assert.deepEqual(Array.from(result.recommendation.tags),["Thyroid Nodules","Thyroid","Ultrasonography"]);
  assert.ok(result.sections.length);
  assert.ok(result.references.length);
  assert.match(result.recommendation.socialKit.longCaption,/https:\/\/bamedicale\.com\/articles\/evidence-based-thyroid-nodule-diagnosis\.html/);
});

test("ambiguous evidence remains review-gated and taxonomy normalizes duplicates",()=>{
  const result=context.jumiAnalyzeArticleEvidence_("Title: General Overview\nAbstract\nA concise overview without a stated audience or clinical classification.\nReferences\nSource record.",{slug:"general-overview",tags:["thyroid nodule","Thyroid Nodules","ULTRASOUND"]});
  assert.equal(result.recommendation.status,"Needs Review");
  assert.equal(result.recommendation.primaryAudience,"");
  assert.deepEqual(Array.from(context.jumiNormalizeTags_(["thyroid nodule","Thyroid Nodules","ULTRASOUND"])),["Thyroid Nodules","Ultrasonography"]);
});

test("Article UI enforces upload-analyze-validate-preview-publish without public draft leakage",()=>{
  assert.match(client,/data\.type==="Article"\?"analyze_article_source":"analyze_ebook_source"/);
  assert.match(client,/Source publication date \(if stated\)/);
  assert.match(client,/BA Medicale publish date is assigned only after the controlled publish succeeds/);
  assert.match(client,/Private preview · noindex/);
  assert.match(client,/Private source only/);
  assert.match(client,/Approved for public download/);
  assert.match(client,/References and sources/);
  assert.match(client,/Social Kit/);
  assert.doesNotMatch(client,/api\.github\.com|JUMI_GITHUB_TOKEN|Drive File ID/);
});

test("Apps Script uses private server-side Drive conversion without broadening source visibility",()=>{
  const drive=manifest.dependencies.enabledAdvancedServices.find(service=>service.userSymbol==="Drive");
  assert.deepEqual(drive,{userSymbol:"Drive",serviceId:"drive",version:"v3"});
  assert.match(backend,/Drive\.Files\.create/);
  assert.doesNotMatch(backend,/Drive\.Files\.export/);
  assert.match(backend,/alt=media/);
  assert.match(backend,/Drive\.Files\.remove/);
  assert.match(backend,/getSharingAccess\(\)===DriveApp\.Access\.PRIVATE/);
  assert.doesNotMatch(backend,/setSharing\(|ANYONE|ANYONE_WITH_LINK/);
});

test("Article publication contract assigns BA publication date at dispatch and preserves source provenance",()=>{
  assert.match(backend,/publishedDate:\['Article','eBook'\]\.includes\(type\)\?requestedAt\.slice\(0,10\)/);
  assert.match(backend,/sourcePublishedDate:String\(data\.sourcePublishedDate\|\|''\)/);
  assert.match(backend,/Approved source PDF integrity check failed/);
  assert.match(backend,/publishSource\?base\+'\/source\.pdf':'',mimeType:'application\/pdf'/);
  assert.match(backend,/Article Audience requires review or an explicit override/);
});

test("locked public renderer owns SEO, sharing, discovery, related content, and source-date presentation",()=>{
  assert.match(articleBuilder,/bamedicale-approved-logo\.jpg/);
  assert.match(articleBuilder,/contentRegistry\.related\(article\.id\)/);
  assert.match(articleBuilder,/data-share-toggle/);
  assert.match(articleBuilder,/sourcePublicationDate \? formatPublishedDate/);
  assert.match(articleBuilder,/application\/ld\+json/);
  assert.match(articleBuilder,/rel="canonical"/);
  assert.match(registry,/record\.sourcePublicationDate \|\| record\.originalPublicationDate/);
  assert.doesNotMatch(client,/textarea[^>]+(?:html|css)|name="(?:html|css|layout)"/i);
});
