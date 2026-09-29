const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const context={window:{}};
vm.runInNewContext(fs.readFileSync('content.js','utf8'),context);
const data=context.window.BAMEDICALE_DATA;
const videos=JSON.parse(fs.readFileSync('data/videos.json','utf8')).videos;
const originals=JSON.parse(fs.readFileSync('data/original-videos.json','utf8')).videos;
const registry=require('../content-registry').create(data,{videos,originalVideos:originals});
const sitemap=fs.readFileSync('sitemap.xml','utf8');
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

test('published article, eBook, seminar and presentation details remain crawlable and canonical',()=>{
 for(const family of ['article','ebook','seminar','presentation'])for(const record of registry.query({family})){
  const file=record.route.split('?')[0],html=fs.readFileSync(file,'utf8'),canonical=`https://bamedicale.com/${record.route.replace(/^\//,'')}`;
  assert.match(html,/<title>[^<]+<\/title>/,record.id);
  assert.match(html,/<meta name="description" content="[^"]+"/,record.id);
  assert(html.includes(`<link rel="canonical" href="${canonical}">`),record.id);
  assert(!/<meta name="robots" content="[^"]*noindex/i.test(html),record.id);
  assert(html.includes(`<h1>${escape(record.title)}</h1>`),record.id);
  assert(sitemap.includes(`<loc>${canonical}</loc>`),record.id);
 }
});

test('VideoObject metadata covers verified Originals and external source records from their canonical catalogs',()=>{
 const html=fs.readFileSync('videos.html','utf8');
 const raw=html.match(/<script type="application\/ld\+json" id="originals-schema">([\s\S]*?)<\/script>/)?.[1];
 const graph=JSON.parse(raw)['@graph'];
 const objects=graph.filter(item=>item['@type']==='VideoObject');
 const expectedExternal=videos.filter(item=>item.verified_identity===true&&item.title&&item.url&&item.thumbnail);
 assert.equal(objects.length,originals.length+expectedExternal.length);
 for(const source of [...originals,...expectedExternal]){
  const url=`https://bamedicale.com/videos.html?video=${encodeURIComponent(source.id)}`;
  const item=objects.find(record=>record.url===url);
  assert(item,source.id);assert.equal(item.name,source.title);assert(item.description);assert(item.thumbnailUrl);
  if(expectedExternal.includes(source)){
   assert.equal(item.embedUrl,source.embed_url||undefined);
   assert(!item.contentUrl,`${source.id}: external video must not be represented as BA Medicale-hosted media`);
  }
 }
 assert(sitemap.includes('<loc>https://bamedicale.com/videos.html</loc>'));
});
