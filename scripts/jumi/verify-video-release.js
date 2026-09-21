// Verify prepared release inputs before generators run; no Git mutation.
const fs=require('fs'),path=require('path'),cp=require('child_process'),C=require('../../jumi/video-contract');
function verify(root,x){if(x.contentType!=='Video')return;
  const run=args=>cp.execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024}).trim();
  const p=C.paths(x.slug,x.assets.artwork.extension),allowed=new Set([p.source,p.artwork,`data/jumi-publication-requests/${x.contentId}.json`]);
  const changed=run(['diff','--name-only',x.baseSha,'HEAD']).split(/\r?\n/).filter(Boolean);
  if(changed.some(f=>!allowed.has(f)))throw Error('Video release modified an unrelated input.');
  const tree=run(['ls-tree','-r','-l','HEAD']).split(/\r?\n/),bytes=tree.reduce((sum,line)=>sum+Number(line.match(/^\d+ blob [a-f0-9]+\s+(\d+)\t/)?.[1]||0),0);
  if(bytes>C.MAX_TREE)throw Error('Video repository delivery budget exceeded (800 MiB).');
  if(bytes>C.WARN_TREE)console.warn('Repository exceeds 650 MiB; plan dedicated video delivery before further growth.');
}
if(require.main===module){const root=path.resolve(__dirname,'../..');verify(root,JSON.parse(fs.readFileSync(process.argv[2],'utf8')));}
module.exports={verify};
