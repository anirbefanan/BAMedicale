/* Video-specific operations; called only through the existing authorized JUMI API. */
function jumiVideoValue_(data,admin,found){
  const old=jumiJson_(found&&found['Type Data JSON'],{}),now=jumiNow_(),title=JUMI_VIDEO.clean(data.title),slug=jumiSlug_(data.slug||title),id=String(found&&found['Content ID']||jumiId_('content'));
  jumiAssert_(!found||found['Content Type']==='Video','Content type cannot be changed.');
  jumiAssert_(!found||!found['Public URL']||found.Slug===slug,'Published Video slug is permanent. Update its metadata or approved assets instead.');
  const tags=jumiNormalizeTags_(data.tags),pub={primaryAudience:String(data.primaryAudience||'Needs Review'),audienceReviewed:data.audienceReviewed==='Reviewed',primaryDiseaseGroup:JUMI_VIDEO.clean(data.primaryDiseaseGroup),primaryTopic:JUMI_VIDEO.clean(data.primaryTopic),contentType:'Video',promotion:{hook:JUMI_VIDEO.clean(data.socialShort||title),teaser:String(data.socialLong||data.quickSummary||'').split('\n').filter(Boolean).map(JUMI_VIDEO.clean),hashtags:String(data.hashtags||[...new Set(tags.slice(0,2).map(tag=>'#'+tag.replace(/[^a-zA-Z0-9]/g,'')).concat('#BAMedicale'))].join(' ')).split(/\s+/).filter(Boolean)}};
  const typeData={...old,quickSummary:JUMI_VIDEO.clean(data.quickSummary),source:JUMI_VIDEO.clean(data.source),sourcePublishedDate:JUMI_VIDEO.clean(data.sourcePublishedDate),tags,publication:pub,generated:false};
  return{'Content ID':id,'Content Type':'Video',Title:title,Subtitle:JUMI_VIDEO.clean(data.subtitle),Slug:slug,Status:'Draft','Source File ID':String(found&&found['Source File ID']||''),'Artwork File ID':String(found&&found['Artwork File ID']||''),'Type Data JSON':JSON.stringify(typeData),'Validation State':'Not Validated','Validation Issues JSON':'[]','Preview State':'Not Previewed','Public URL':String(found&&found['Public URL']||''),'Created At':String(found&&found['Created At']||now),'Created By':String(found&&found['Created By']||admin.email),'Updated At':now,'Updated By':admin.email,'Published At':String(found&&found['Published At']||''),Version:Number(found&&found.Version||0)+1,'Media File ID':'','Infographic File ID':''};
}
function jumiVideoIssues_(record){
  const issues=[],d=record.typeData||{};
  try{JUMI_VIDEO.metadata({...d,title:record.title,subtitle:record.subtitle});}catch(error){issues.push(error.message);}
  if(!JUMI_VIDEO_TAXONOMY.some(group=>group.id===d.publication?.primaryDiseaseGroup))issues.push('Select a source-supported disease group from the canonical taxonomy.');
  if(!JUMI_VIDEO.slug(record.slug||''))issues.push('Use a valid Video slug.');
  if(!record.sourceStored||!d.sourceAsset?.valid||!/^[a-f0-9]{64}$/.test(d.sourceAsset?.sha256||''))issues.push('Upload a valid approved MP4.');
  if(!record.artworkStored||!d.artwork?.valid||!/^[a-f0-9]{64}$/.test(d.artwork?.sha256||''))issues.push('Upload a valid approved 9:16 JPG/PNG poster.');
  if(!d.generated)issues.push('Generate the validated Video draft before preview.');
  return issues;
}
function jumiUploadVideoAsset_(data,admin){
  const ss=jumiSs_(),sheet=jumiTab_(ss,'content'),row=jumiContentRows_(ss).find(r=>r['Content ID']===data.contentId);
  jumiAssert_(row&&row['Content Type']==='Video','Video draft not found.');
  const kind=String(data.kind),mime=String(data.mimeType),max=kind==='source'?JUMI_VIDEO.MAX_VIDEO:JUMI_VIDEO.MAX_POSTER;
  jumiAssert_(['source','artwork'].includes(kind)&&String(data.base64||'').length<=Math.ceil(max/3)*4,'Video asset exceeds its upload limit.');
  const bytes=Utilities.base64Decode(String(data.base64||'')),blob=Utilities.newBlob(bytes,mime),info=kind==='source'?(jumiAssert_(mime==='video/mp4','Originals require MP4.'),JUMI_VIDEO.mp4(bytes)):JUMI_VIDEO.poster(bytes,mime),sha256=jumiSha256_(blob),d=jumiJson_(row['Type Data JSON'],{}),key=kind==='source'?'sourceAsset':'artwork',ext=kind==='source'?'mp4':mime==='image/png'?'png':'jpg';
  const file=jumiContentFolder_('Video',row['Content ID']).createFile(blob.setName(kind+'-'+sha256+'.'+ext));
  jumiAssert_(file.getSharingAccess()===DriveApp.Access.PRIVATE,'Video master storage must remain private.');
  d.assetHistory=(d.assetHistory||[]).concat(d[key]?.sha256?[{kind,sha256:d[key].sha256,replacedAt:jumiNow_()}]:[]).slice(-50);
  d[key]={...info,mimeType:mime,sha256,size:bytes.length,extension:ext,originalName:JUMI_VIDEO.clean(data.fileName||'')};d.generated=false;delete d.previewVersion;
  const next={...row,[kind==='source'?'Source File ID':'Artwork File ID']:file.getId(),'Type Data JSON':JSON.stringify(d),Status:'Draft','Validation State':'Not Validated','Validation Issues JSON':'[]','Preview State':'Not Previewed','Updated At':jumiNow_(),'Updated By':admin.email,Version:Number(row.Version)+1};delete next._row;
  jumiUpdateRow_(sheet,row._row,JUMI_CONTENT_HEADERS,next);jumiAudit_(ss,admin,'UPLOAD_VIDEO_'+kind.toUpperCase(),'content',row['Content ID'],{}, {sha256,size:bytes.length});
  return{saved:true,reference:'stored',warning:bytes.length>JUMI_VIDEO.WARN_VIDEO?'Approaching the 20 MiB Video limit. Plan dedicated media delivery before larger uploads.':''};
}
function jumiVideoAssets_(row){
  const d=jumiJson_(row['Type Data JSON'],{});jumiAssert_(row['Source File ID']&&row['Artwork File ID'],'Upload the approved MP4 so JUMI can generate and store its poster.');const sourceFile=DriveApp.getFileById(String(row['Source File ID'])),artworkFile=DriveApp.getFileById(String(row['Artwork File ID']));
  jumiAssert_(sourceFile.getSharingAccess()===DriveApp.Access.PRIVATE&&artworkFile.getSharingAccess()===DriveApp.Access.PRIVATE,'Video masters must remain private.');
  const sourceBlob=sourceFile.getBlob(),artworkBlob=artworkFile.getBlob(),source=JUMI_VIDEO.mp4(sourceBlob.getBytes()),artwork=JUMI_VIDEO.poster(artworkBlob.getBytes(),artworkBlob.getContentType());
  jumiAssert_(jumiSha256_(sourceBlob)===d.sourceAsset?.sha256&&jumiSha256_(artworkBlob)===d.artwork?.sha256,'Approved Video/poster integrity changed. Upload and review the replacement.');
  return{sourceBlob,artworkBlob,source,artwork};
}
function jumiGenerateVideo_(data,admin){
  const ss=jumiSs_(),sheet=jumiTab_(ss,'content'),row=jumiContentRows_(ss).find(r=>r['Content ID']===data.contentId);jumiAssert_(row&&row['Content Type']==='Video','Video draft not found.');
  const assets=jumiVideoAssets_(row),d=jumiJson_(row['Type Data JSON'],{}),fileTitle=String(d.sourceAsset?.originalName||'').replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim(),title=String(row.Title||fileTitle).trim(),slug=String(row.Slug||jumiSlug_(title)),tags=d.tags&&d.tags.length?d.tags:['BA Medicale Originals'],publication={...(d.publication||{}),contentType:'Video',primaryAudience:String(d.publication?.primaryAudience||'Needs Review'),audienceReviewed:d.publication?.audienceReviewed===true,primaryTopic:String(d.publication?.primaryTopic||'Medical Education'),topics:tags};jumiAssert_(title&&jumiVideoIssues_({...jumiContentPublic_(row),title,slug,artworkStored:true,sourceStored:true,typeData:{...d,sourceAsset:{...d.sourceAsset,valid:true},artwork:{...d.artwork,valid:true},generated:true,quickSummary:d.quickSummary||'BA Medicale Original video: '+title+'.',source:d.source||'BA Medicale Original',tags,publication}}).filter(issue=>!/Audience|disease group|Generate/.test(issue)).length===0,'Video source or generated poster is incomplete.');const generated={...d,quickSummary:d.quickSummary||'BA Medicale Original video: '+title+'.',source:d.source||'BA Medicale Original',tags,publication,generated:true,analysis:{status:'Source metadata extracted — Review Required',analyzedAt:jumiNow_(),sourceSha256:d.sourceAsset.sha256,durationSeconds:assets.source.durationSeconds,posterPolicy:'Source-faithful frame in the locked BA Medicale Originals 9:16 treatment.'}};
  const next={...row,Title:title,Slug:slug,Status:'Generated','Type Data JSON':JSON.stringify(generated),'Validation State':'Not Validated','Preview State':'Not Previewed','Updated At':jumiNow_(),'Updated By':admin.email,Version:Number(row.Version)+1};delete next._row;jumiUpdateRow_(sheet,row._row,JUMI_CONTENT_HEADERS,next);jumiAudit_(ss,admin,'ANALYZE_GENERATE_VIDEO','content',row['Content ID'],{}, {status:'Generated',sourceSha256:d.sourceAsset.sha256});return{saved:true,status:'Generated',analysisStatus:generated.analysis.status};
}
function jumiPreviewVideo_(data,admin){
  const ss=jumiSs_(),sheet=jumiTab_(ss,'content'),row=jumiContentRows_(ss).find(r=>r['Content ID']===data.contentId);jumiAssert_(row&&row['Content Type']==='Video'&&row['Validation State']==='Passed','Validate the Video before preview.');
  const assets=jumiVideoAssets_(row),d=jumiJson_(row['Type Data JSON'],{});d.previewVersion=Number(row.Version);const next={...row,'Type Data JSON':JSON.stringify(d)};delete next._row;jumiUpdateRow_(sheet,row._row,JUMI_CONTENT_HEADERS,next);
  return{version:Number(row.Version),videoBase64:Utilities.base64Encode(assets.sourceBlob.getBytes()),posterBase64:Utilities.base64Encode(assets.artworkBlob.getBytes()),posterMime:assets.artworkBlob.getContentType(),durationSeconds:assets.source.durationSeconds};
}
function jumiVideoManifest_(row,baseSha){
  const d=jumiJson_(row['Type Data JSON'],{}),issues=jumiVideoIssues_(jumiContentPublic_(row));jumiAssert_(!issues.length,issues.join(' '));
  const assets=jumiVideoAssets_(row),p=JUMI_VIDEO.paths(row.Slug,d.artwork.extension),requestedAt=jumiNow_(),metadata=JUMI_VIDEO.metadata({...d,title:row.Title,subtitle:row.Subtitle});metadata.publishedDate=String(row['Published At']||requestedAt).slice(0,10);metadata.durationSeconds=assets.source.durationSeconds;
  return{manifest:{schemaVersion:1,contentId:row['Content ID'],contentType:'Video',slug:row.Slug,version:Number(row.Version),baseSha,requestedAt,metadata,assets:{source:{path:p.source,mimeType:'video/mp4',public:true,size:d.sourceAsset.size,sha256:d.sourceAsset.sha256},artwork:{path:p.artwork,mimeType:d.artwork.mimeType,extension:d.artwork.extension,size:d.artwork.size,sha256:d.artwork.sha256}}},sourceBlob:assets.sourceBlob,artworkBlob:assets.artworkBlob};
}
function jumiVideoRepositoryGuard_(row,release){
  const tree=jumiGithub_('get','/git/trees/'+release.manifest.baseSha+'?recursive=1',undefined,[200]);jumiAssert_(!tree.truncated&&Array.isArray(tree.tree),'Repository size could not be verified safely.');
  const assets=Object.values(release.manifest.assets),paths=assets.map(a=>a.path),bytes=tree.tree.filter(e=>e.type==='blob'&&!paths.includes(e.path)).reduce((sum,e)=>sum+Number(e.size||0),0)+assets.reduce((sum,a)=>sum+a.size,0);
  jumiAssert_(bytes<=JUMI_VIDEO.MAX_TREE,'Repository delivery budget reached (800 MiB). A media-storage migration is required before publishing more video.');
  const repo=jumiGithub_('get','',undefined,[200]);jumiAssert_(Number(repo.size)*1024+release.manifest.assets.source.size<=1024*1024*1024,'Git history is approaching 1 GiB. Review media delivery before further video releases.');
  const catalog=jumiGithub_('get','/contents/data/original-videos.json?ref='+release.manifest.baseSha,undefined,[200]),records=jumiJson_(Utilities.newBlob(Utilities.base64Decode(String(catalog.content||'').replace(/\s/g,''))).getDataAsString(),{}).videos||[];
  const collision=records.find(v=>v.id===row.Slug||v.video_url===release.manifest.assets.source.path),existing=records.find(v=>v.publicationId===row['Content ID']);
  jumiAssert_(!collision||collision.publicationId===row['Content ID'],'Video slug already exists. Existing historical Originals cannot be overwritten by a new draft.');jumiAssert_(!existing||existing.id===row.Slug,'Published Video identity cannot change.');
  if(!collision)jumiAssert_(!tree.tree.some(e=>paths.includes(e.path)),'Video asset destination already exists. Choose a unique slug.');
}
