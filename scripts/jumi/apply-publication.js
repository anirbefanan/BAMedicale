const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ARTICLE_START = "    // JUMI_PUBLISHED_ARTICLES_START";
const ARTICLE_END = "    // JUMI_PUBLISHED_ARTICLES_END";
const EBOOK_START = "    // JUMI_PUBLISHED_EBOOKS_START";
const EBOOK_END = "    // JUMI_PUBLISHED_EBOOKS_END";
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CONTENT_ID = /^content_[a-f0-9]{16,64}$/;
const SHA256 = /^[a-f0-9]{64}$/;

function assert(condition,message){if(!condition)throw new Error(message);}
function hashFile(file){return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");}
function inside(root,target){const relative=path.relative(root,target);return relative&&!relative.startsWith("..")&&!path.isAbsolute(relative);}
function expectedPaths(manifest){const base=manifest.contentType==="Article"?`assets/articles/${manifest.slug}`:`assets/ebooks/${manifest.slug}`;return{source:`${base}/source.pdf`,artwork:`${base}/${manifest.contentType==="Article"?"artwork":"cover"}.${manifest.assets.artwork.extension}`,manifest:manifest.contentType==="eBook"?`${base}/pages.json`:""};}
function validateManifest(manifest,root,{requirePrepared=true}={}){
  assert(manifest&&manifest.schemaVersion===1,"Unsupported publication contract.");
  assert(CONTENT_ID.test(String(manifest.contentId||"")),"Invalid content ID.");
  assert(["Article","eBook"].includes(manifest.contentType),"Unsupported content type.");
  assert(SLUG.test(String(manifest.slug||""))&&manifest.slug.length<=80&&!manifest.slug.includes(".."),"Invalid publication slug.");
  assert(Number.isInteger(manifest.version)&&manifest.version>0,"Invalid publication version.");
  assert(/^[a-f0-9]{40}$/.test(String(manifest.baseSha||"")),"Invalid base commit.");
  assert(/^\d{4}-\d{2}-\d{2}T/.test(String(manifest.requestedAt||"")),"Invalid publication timestamp.");
  assert(manifest.assets&&manifest.assets.source&&manifest.assets.artwork,"Approved source and artwork are required.");
  assert(manifest.assets.source.mimeType==="application/pdf","Source must be a PDF.");
  assert(["jpg","png","webp"].includes(manifest.assets.artwork.extension),"Unsupported artwork type.");
  assert(["image/jpeg","image/png","image/webp"].includes(manifest.assets.artwork.mimeType),"Unsupported artwork type.");
  const expected=expectedPaths(manifest);
  assert(manifest.assets.source.path===expected.source&&manifest.assets.artwork.path===expected.artwork,"Publication asset path is not server-derived.");
  for(const asset of [manifest.assets.source,manifest.assets.artwork]){
    assert(SHA256.test(String(asset.sha256||"")),"Missing asset integrity hash.");
    const file=path.join(root,asset.path);assert(inside(root,file)&&fs.existsSync(file),`Missing publication asset ${asset.path}.`);
    assert(hashFile(file)===asset.sha256,`Asset integrity check failed for ${asset.path}.`);
  }
  const m=manifest.metadata||{};
  for(const field of ["title","author","publishedDate","quickSummary"])assert(String(m[field]||"").trim(),`Missing publication metadata: ${field}.`);
  assert(/^\d{4}-\d{2}-\d{2}$/.test(m.publishedDate),"Invalid published date.");
  assert(Array.isArray(m.tags)&&m.tags.length,"At least one source-supported tag is required.");
  const p=m.publication||{};
  for(const field of ["primaryAudience","primaryDiseaseGroup"])assert(String(p[field]||"").trim(),`Missing publication classification: ${field}.`);
  if(manifest.contentType==="Article"){
    assert(String(m.source||"").trim(),"Article source attribution is required.");
    assert(String(p.primaryTopic||"").trim(),"Article primary topic is required.");
    assert(Array.isArray(p.sections)&&p.sections.length&&p.sections.every(section=>section&&section.title&&Array.isArray(section.body)&&section.body.length),"Source-faithful article sections are required.");
    assert(Array.isArray(p.references)&&p.references.length,"Article references are required.");
    assert(p.promotion&&String(p.promotion.hook||"").trim()&&Array.isArray(p.promotion.teaser)&&p.promotion.teaser.length,"Source-grounded article promotion metadata is required.");
    assert(Array.isArray(p.promotion.hashtags)&&p.promotion.hashtags.length>=2&&p.promotion.hashtags.length<=3,"Use two or three source-grounded article promotion hashtags.");
  }else if(requirePrepared){
    assert(String(m.publisher||"").trim(),"eBook publisher is required.");
    const pageManifest=path.join(root,expected.manifest);assert(inside(root,pageManifest)&&fs.existsSync(pageManifest),"Prepared eBook page manifest is required.");
    const pages=JSON.parse(fs.readFileSync(pageManifest,"utf8"));assert(Array.isArray(pages.pages)&&pages.pages.length,"Prepared eBook pages are required.");
    assert(pages.sourceSha256===manifest.assets.source.sha256,"Prepared eBook source hash does not match the approved PDF.");
  }
  return expected;
}
function markerRecords(source,start,end,kind){const a=source.indexOf(start),b=source.indexOf(end);assert(a>=0&&b>a,`Missing ${kind} publication markers.`);const body=source.slice(a+start.length,b).trim().replace(/^,|,$/g,"").trim();if(!body)return kind==="articles"?{}:[];return Function(`"use strict";return ${kind==="articles"?`({${body}})`:`([${body}])`};`)();}
function replaceMarker(source,start,end,rendered){const a=source.indexOf(start),b=source.indexOf(end);assert(a>=0&&b>a,"Missing publication markers.");return source.slice(0,a+start.length)+"\n"+rendered+"\n"+source.slice(b);}
function articleRecord(manifest,paths){const m=manifest.metadata,p=m.publication;return{id:manifest.contentId,slug:manifest.slug,title:m.title,seoTitle:p.seoTitle||`${m.title} | BA Medicale`,dek:m.subtitle||m.quickSummary,excerpt:m.quickSummary,primaryAudience:p.primaryAudience,secondaryAudiences:Array.isArray(p.secondaryAudiences)?p.secondaryAudiences:[],publicCategories:Array.isArray(p.publicCategories)?p.publicCategories:[],author:{name:m.author,type:p.authorType==="Person"?"Person":"Organization"},primaryTopic:p.primaryTopic,tags:m.tags,primaryDiseaseGroup:p.primaryDiseaseGroup,secondaryDiseaseGroups:Array.isArray(p.secondaryDiseaseGroups)?p.secondaryDiseaseGroups:[],diseaseCondition:p.diseaseCondition||"",diseaseSite:p.diseaseSite||"",contentType:p.contentType||"Article",sourceAttribution:m.source,publishedDate:m.publishedDate,updatedDate:"",sortOrder:Number(p.sortOrder)||100,focalPosition:p.focalPosition||"50% 50%",sourcePdf:paths.source,cover:paths.artwork,label:p.label||"Article",intro:Array.isArray(p.intro)&&p.intro.length?p.intro:[m.quickSummary],sections:p.sections,referencesTitle:p.referencesTitle||"References and sources",references:p.references,referencesOrdered:Boolean(p.referencesOrdered),promotion:p.promotion};}
function ebookRecord(manifest,paths,root){const m=manifest.metadata,p=m.publication,pageData=JSON.parse(fs.readFileSync(path.join(root,paths.manifest),"utf8")),pages=pageData.pages.map((page,index)=>({image:page.image,title:`Source PDF page ${index+1}`}));return{id:manifest.contentId,slug:manifest.slug,title:m.title,subtitle:m.subtitle||"",publishedDate:m.publishedDate,publicationMonth:m.publishedDate.slice(0,7),publicationDateLabel:p.publicationDateLabel||new Date(`${m.publishedDate}T00:00:00Z`).toLocaleDateString("en-GB",{month:"long",year:"numeric",timeZone:"UTC"}),publicationStatus:"published",state:p.state||"Clinical Reference E-Book",demo:false,indexable:true,sortOrder:Number(p.sortOrder)||100,primaryAudience:p.primaryAudience,primaryDiseaseGroup:p.primaryDiseaseGroup,diseaseCondition:p.diseaseCondition||"",professionalCategory:p.professionalCategory||"",topics:Array.isArray(p.topics)?p.topics:m.tags,tags:m.tags,contentType:"eBook",cover:paths.artwork,coverAsPage:true,author:{name:m.author,type:p.authorType==="Person"?"Person":"Organization"},publisher:m.publisher,description:m.quickSummary,sourcePdf:paths.source,sourcePages:true,pageAspect:Number(pageData.pageAspect)||1.294,pageManifest:paths.manifest,pages,downloadable:Boolean(p.downloadable),access:p.access||"free",commerceStatus:p.commerceStatus||"not-for-sale"};}
function applyPublication(root,requestFile,{dryRun=false,contractOnly=false}={}){
  const requestPath=path.resolve(root,requestFile);assert(inside(root,requestPath)&&requestPath.includes(`${path.sep}data${path.sep}jumi-publication-requests${path.sep}`),"Publication request path is not allowed.");
  const manifest=JSON.parse(fs.readFileSync(requestPath,"utf8")),paths=validateManifest(manifest,root,{requirePrepared:!contractOnly});
  if(contractOnly)return{manifest,paths};
  const contentFile=path.join(root,"content.js"),source=fs.readFileSync(contentFile,"utf8");let next=source;
  if(manifest.contentType==="Article"){
    const records=markerRecords(source,ARTICLE_START,ARTICLE_END,"articles");records[manifest.contentId]=articleRecord(manifest,paths);const rendered=Object.entries(records).sort(([a],[b])=>a.localeCompare(b)).map(([id,record])=>`    ${JSON.stringify(id)}: ${JSON.stringify(record,null,2).replace(/\n/g,"\n    ")},`).join("\n");next=replaceMarker(source,ARTICLE_START,ARTICLE_END,rendered);
  }else{
    const records=markerRecords(source,EBOOK_START,EBOOK_END,"ebooks").filter(record=>record.id!==manifest.contentId);records.push(ebookRecord(manifest,paths,root));records.sort((a,b)=>String(a.id).localeCompare(String(b.id)));const rendered=records.map(record=>`    ${JSON.stringify(record,null,2).replace(/\n/g,"\n    ")},`).join("\n");next=replaceMarker(source,EBOOK_START,EBOOK_END,rendered);
  }
  const receipt={schemaVersion:1,contentId:manifest.contentId,contentType:manifest.contentType,slug:manifest.slug,version:manifest.version,baseSha:manifest.baseSha,sourceSha256:manifest.assets.source.sha256,artworkSha256:manifest.assets.artwork.sha256,publishedAt:manifest.requestedAt,publicUrl:`https://bamedicale.com/${manifest.contentType==="Article"?"articles":"ebooks"}/${manifest.slug}.html`};
  if(!dryRun){fs.writeFileSync(contentFile,next,"utf8");const receiptFile=path.join(root,"data","jumi-publications",`${manifest.contentId}.json`);fs.mkdirSync(path.dirname(receiptFile),{recursive:true});fs.writeFileSync(receiptFile,JSON.stringify(receipt,null,2)+"\n","utf8");fs.unlinkSync(requestPath);}
  return{manifest,paths,record:manifest.contentType==="Article"?articleRecord(manifest,paths):ebookRecord(manifest,paths,root),receipt,content:next};
}

if(require.main===module){const args=process.argv.slice(2),request=args[args.indexOf("--request")+1],dryRun=args.includes("--dry-run"),contractOnly=args.includes("--contract-only");assert(request&&!request.startsWith("--"),"Use --request <repository-relative manifest>.");const result=applyPublication(path.resolve(__dirname,"../.."),request,{dryRun,contractOnly});console.log(`${contractOnly?"contract validated":dryRun?"validated":"applied"} ${result.manifest.contentType} ${result.manifest.contentId} v${result.manifest.version}`);}
module.exports={applyPublication,validateManifest,expectedPaths,hashFile,inside,SLUG,CONTENT_ID};
