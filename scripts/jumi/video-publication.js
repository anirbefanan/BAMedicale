/* Originals publication adapter. No external-video catalog writes. */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),cp=require('child_process');
const contract=require('../../jumi/video-contract');
const assert=(ok,message)=>{if(!ok)throw Error(message);};
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function keys(value,allowed){assert(value&&Object.keys(value).every(k=>allowed.includes(k)),'Unexpected field at the public Video boundary.');}
function validateManifest(x,root){
  keys(x,['schemaVersion','contentId','contentType','slug','version','baseSha','requestedAt','metadata','assets']);
  assert(x.schemaVersion===1&&x.contentType==='Video'&&/^content_[a-f0-9]{16,64}$/.test(x.contentId),'Invalid Video identity.');
  assert(Number.isInteger(x.version)&&x.version>0&&/^[a-f0-9]{40}$/.test(x.baseSha)&&Number.isFinite(Date.parse(x.requestedAt)),'Invalid Video revision.');
  keys(x.assets,['source','artwork']);keys(x.assets.source,['path','mimeType','public','size','sha256']);keys(x.assets.artwork,['path','mimeType','extension','size','sha256']);
  const p=contract.paths(x.slug,x.assets.artwork.extension),m=x.metadata;
  keys(m,['title','subtitle','quickSummary','source','sourcePublishedDate','tags','publication','publishedDate','durationSeconds']);
  keys(m.publication,['primaryAudience','secondaryAudiences','primaryDiseaseGroup','primaryTopic','contentType','audienceReviewed','promotion']);keys(m.publication.promotion,['hook','teaser','hashtags']);
  contract.metadata(m);assert(require("../../jumi/video-taxonomy").some(group=>group.id===m.publication.primaryDiseaseGroup),"Unknown Video disease taxonomy.");assert(/^\d{4}-\d{2}-\d{2}$/.test(m.publishedDate)&&Number.isFinite(Date.parse(m.publishedDate)),'Invalid BA Medicale publish date.');
  assert(x.assets.source.public===true&&x.assets.source.mimeType==='video/mp4','Public MP4 approval is required.');
  assert(x.assets.artwork.mimeType===(x.assets.artwork.extension==='png'?'image/png':'image/jpeg'),'Poster extension/type mismatch.');
  for(const kind of ['source','artwork']){const a=x.assets[kind];assert(a.path===p[kind]&&/^[a-f0-9]{64}$/.test(a.sha256),'Invalid derived Video asset path/hash.');const file=path.resolve(root,a.path);assert(fs.existsSync(file)&&!fs.lstatSync(file).isSymbolicLink(),'Missing or unsafe Video asset.');const bytes=fs.readFileSync(file);assert(bytes.length===a.size&&hash(bytes)===a.sha256,'Video asset integrity mismatch.');if(kind==='source'){const parsed=contract.mp4(bytes);assert(Math.abs(parsed.durationSeconds-m.durationSeconds)<.001,'Video duration does not match its source.');}else contract.poster(bytes,a.mimeType);}
  const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/original-videos.json'),'utf8'));
  assert(Array.isArray(catalog.videos),'Invalid Originals catalog.');
  const existing=catalog.videos.find(v=>v.publicationId===x.contentId),collision=catalog.videos.find(v=>v.id===x.slug||v.video_url===p.source||v.thumbnail===p.artwork);
  assert(!collision||collision.publicationId===x.contentId,'Duplicate Video identity/destination.');assert(!existing||existing.id===x.slug,'Published Video identity cannot change.');
  assert(!existing||x.version>Number(existing.publicationVersion||0),'Video version must advance.');
  assert(!existing||m.publishedDate===existing.publishedDate,'An update must preserve the original BA Medicale publication date.');
  return p;
}
function verifyMedia(root,x){
  const p=validateManifest(x,root),file=path.join(root,p.source),poster=path.join(root,p.artwork);
  const probe=JSON.parse(cp.execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',file],{encoding:'utf8',timeout:30000,maxBuffer:1024*1024}));
  const video=probe.streams.filter(s=>s.codec_type==='video'),audio=probe.streams.filter(s=>s.codec_type==='audio');
  assert(video.length===1&&video[0].codec_name==='h264'&&['yuv420p','yuvj420p'].includes(video[0].pix_fmt)&&audio.every(s=>s.codec_name==='aac'),'Use a browser-compatible H.264 MP4 with AAC audio (if present); automatic transcoding is disabled.');
  for(const input of[file,poster])cp.execFileSync('ffmpeg',['-v','error','-xerror','-i',input,'-f','null','-'],{stdio:'pipe',timeout:120000,maxBuffer:1024*1024});
  // Decoding verifies readability, but never rewrites the approved source files.
  validateManifest(x,root);return true;
}
function apply(root,x,requestPath,{dryRun=false}={}){
  const p=validateManifest(x,root),m=x.metadata,d=m.publication,file=path.join(root,'data/original-videos.json'),catalog=JSON.parse(fs.readFileSync(file,'utf8'));
  const primaryAudience=contract.AUDIENCE[d.primaryAudience],secondaryAudiences=d.primaryAudience==='All'?['DOCTOR','HEALTHCARE WORKER']:[...new Set((d.secondaryAudiences||[]).map(value=>contract.AUDIENCE[value]).filter(Boolean))].filter(value=>value!==primaryAudience),record={id:x.slug,publicationId:x.contentId,publicationVersion:x.version,title:m.title,subtitle:m.subtitle,short_description:m.quickSummary,source_label:'BA Medicale Original',source:'ba-medicale',sourceAttribution:m.source,sourcePublicationDate:m.sourcePublishedDate,topic:d.primaryTopic,audience:d.primaryAudience,primaryAudience,secondaryAudiences,primaryDiseaseGroup:d.primaryDiseaseGroup,topics:m.tags,tags:m.tags,contentType:'Video',publishedDate:m.publishedDate,updatedDate:x.requestedAt.slice(0,10),url:p.source,video_url:p.source,thumbnail:p.artwork,durationSeconds:m.durationSeconds,sourceSha256:x.assets.source.sha256,posterSha256:x.assets.artwork.sha256,verified_identity:true,promotion:d.promotion};
  const index=catalog.videos.findIndex(v=>v.publicationId===x.contentId);if(index<0)catalog.videos.push(record);else catalog.videos[index]=record;
  const receipt={schemaVersion:1,contentId:x.contentId,contentType:'Video',slug:x.slug,version:x.version,baseSha:x.baseSha,sourceSha256:x.assets.source.sha256,artworkSha256:x.assets.artwork.sha256,publishedAt:x.requestedAt,publicUrl:`https://bamedicale.com/${p.page}`};
  if(!dryRun){fs.writeFileSync(file,JSON.stringify(catalog,null,2)+'\n');const target=path.join(root,'data/jumi-publications',x.contentId+'.json');fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,JSON.stringify(receipt,null,2)+'\n');fs.unlinkSync(requestPath);}
  return{manifest:x,paths:p,record,receipt};
}
if(require.main===module){const root=path.resolve(__dirname,'../..'),x=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));if(x.contentType==='Video'){verifyMedia(root,x);console.log('Originals media decoded successfully; approved bytes unchanged.');}}
module.exports={validateManifest,verifyMedia,apply};
