const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');
const model=require('../../ebooks/model');

const root=path.resolve(__dirname,'../..');
const backend=fs.readFileSync(path.join(__dirname,'backend.js'),'utf8');
const client=fs.readFileSync(path.join(root,'jumi/app.js'),'utf8');
const template=fs.readFileSync(path.join(root,'scripts/ebook-template.js'),'utf8');
const publisher=fs.readFileSync(path.join(__dirname,'apply-publication.js'),'utf8');
const start=backend.indexOf('function jumiNormalizeTags_');
const end=backend.indexOf('function jumiExtractArticleText_');
const context={JUMI_ARTICLE_TAG_ALIASES:{'thyroid nodule':'Thyroid Nodules','thyroid nodules':'Thyroid Nodules',ultrasound:'Ultrasonography',ultrasonography:'Ultrasonography',oncology:'Oncology'},jumiSlug_:value=>String(value||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''),Utilities:{formatDate:date=>date.toISOString().slice(0,10)}};
vm.createContext(context);
vm.runInContext(backend.slice(start,end),context);

test('eBook source analysis extracts only evidenced publication metadata',()=>{
  const source=`Title: Evidence-Based Thyroid Reference\nSubtitle: Diagnosis and management\nAuthor: Dr Example\nPublisher: Example Medical Press\nSource: Supplied clinical reference\nPublication date: 2025-04-12\nOverview\nA clinical guide to thyroid nodule diagnosis and ultrasound assessment for physicians.\nReferences\nExample Medical Press. 2025.`;
  const result=context.jumiAnalyzeEbookEvidence_(source,{slug:'evidence-based-thyroid-reference',tags:[]});
  assert.equal(result.title,'Evidence-Based Thyroid Reference');
  assert.equal(result.author,'Dr Example');
  assert.equal(result.publisher,'Example Medical Press');
  assert.equal(result.sourcePublishedDate,'2025-04-12');
  assert.equal(result.recommendation.primaryAudience,'Doctors');
  assert.equal(result.recommendation.primaryDiseaseGroup,'endocrine-metabolic');
  assert.ok(result.references.length);
});

test('eBook analysis leaves unsupported facts empty for review',()=>{
  const result=context.jumiAnalyzeEbookEvidence_('Title: General Reference\nA brief source document without attribution.',{slug:'general-reference',tags:[]});
  assert.equal(result.author,'');
  assert.equal(result.publisher,'');
  assert.equal(result.sourcePublishedDate,'');
  assert.equal(result.analysisStatus,'Extracted — Review Required');
});

test('eBook UI enforces analyze, classification, explicit source approval, preview, and publish gates',()=>{
  assert.match(client,/request\(data\.type==="Article"\?"analyze_article_source":"analyze_ebook_source"/);
  assert.match(client,/Reader\/source publication approval/);
  assert.match(client,/Source publication date \(if stated\)/);
  assert.match(client,/Primary Disease Group/);
  assert.match(client,/BA Medicale publish date is assigned only after the controlled publish succeeds/);
  assert.match(client,/Private preview · noindex/);
  assert.doesNotMatch(client,/api\.github\.com|JUMI_GITHUB_TOKEN|Drive File ID/);
});

test('publication contract preserves source hash and separates source date from BA publish date',()=>{
  assert.match(backend,/Approved source PDF integrity check failed/);
  assert.match(backend,/publishedDate:\['Article','eBook'\]\.includes\(type\)\?requestedAt\.slice\(0,10\)/);
  assert.match(backend,/sourcePublishedDate:String\(data\.sourcePublishedDate\|\|''\)/);
  assert.match(publisher,/eBook source requires explicit approval for the public reader and download/);
  assert.match(publisher,/sourcePublicationDate:m\.sourcePublishedDate\|\|""/);
});

test('reader mapping keeps cover separate from original PDF numbering and search',()=>{
  const book={title:'Fixture',cover:'cover.jpg',coverAsPage:true,sourcePages:true,pages:[{title:'Source PDF page 1',text:'First source page'},{title:'Source PDF page 2',text:'Second searchable page'}]};
  const pages=model.pages(book);
  assert.equal(model.pageLabel(pages,0),'01 Cover');
  assert.equal(model.pageLabel(pages,1),'02 Source PDF page 1');
  assert.equal(model.search(book,'searchable')[0].index,2);
  assert.equal(model.pageLabel(pages,model.search(book,'searchable')[0].index),'03 Source PDF page 2');
});

test('locked renderer owns SEO, social logo, source-date display, discovery, and canonical sharing',()=>{
  assert.match(template,/bamedicale-approved-logo\.jpg|imageBlock\(\)/);
  assert.match(template,/Source publication date/);
  assert.match(template,/registry\.related\(book\.id\)/);
  assert.match(template,/rel="canonical"/);
  assert.match(template,/application\/ld\+json/);
  assert.match(template,/button\('favorite','Favorite'\)/);
  assert.doesNotMatch(client,/textarea[^>]+(?:html|css)|name="(?:html|css|layout)"/i);
});

test('canonical thyroid eBook keeps approved source and cover byte hashes',()=>{
  const base=path.join(root,'assets/ebooks/advanced-diagnostics-and-management-of-thyroid-nodules');
  const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(path.join(base,file))).digest('hex');
  assert.equal(hash('source.pdf'),'f4f343127249471198573576b0b2a73b9a4a070001ff0c0a8c0d32e9eff98c7e');
  assert.equal(hash('cover.jpg'),'318214abe46c3b7cbcef795dafb3bff2815d8879303ceee1cf4b79b441035249');
  const manifest=JSON.parse(fs.readFileSync(path.join(base,'pages.json'),'utf8'));
  assert.equal(manifest.pages.length,9);
});

test('shelf batching remains bounded and lossless at catalog scale',()=>{
  const books=Array.from({length:103},(_,id)=>({id}));
  const seen=[];
  for(let page=0;page<Math.ceil(books.length/18);page++)seen.push(...model.batch(books,page).items.map(item=>item.id));
  assert.deepEqual(seen,books.map(item=>item.id));
  assert.ok(model.batch(books,0).items.length<=18);
});
