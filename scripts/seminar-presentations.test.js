const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const context={window:{}};vm.runInNewContext(fs.readFileSync('content.js','utf8'),context);
const data=context.window.BAMEDICALE_DATA,hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const ids=['ultrasound-imaging-and-tirads-classification-in-thyroid-nodules','bethesda-system-for-reporting-thyroid-cytopathology'];
for(const [i,id] of ids.entries())test(`${id}: original, infographic, slide integrity and shared output`,()=>{
 const p=data.presentations[id],m=JSON.parse(fs.readFileSync(p.sourceManifest)),html=fs.readFileSync(p.canonicalUrl,'utf8');
 assert.equal(m.pages.length,[25,29][i]);assert.equal(hash(p.sourceFile),m.sourceSha256);assert.equal(hash(p.cover),m.infographicSha256);
 assert.equal(p.coverWidth/p.coverHeight,16/9);assert.equal(p.sourceFormat,'PPTX');
 let last=-1;for(const [index,page] of m.pages.entries()){assert.equal(page.page,index+1);assert.equal(hash(page.image),page.imageSha256);const pos=html.indexOf(`id="slide-${index+1}"`);assert(pos>last);last=pos;}
 assert(html.includes('Download Original PPTX'));assert(html.includes('presentation.js'));assert(html.includes('data-article-reader'));assert(html.includes('bamedicale-approved-logo.jpg'));assert(html.includes(p.sourceFile));
 const registry=require('../content-registry').create(data);assert(registry.search(p.title).some(r=>r.id===id));assert(registry.related(p.eventId,20).some(r=>r.id===id));assert(fs.readFileSync('sitemap.xml','utf8').includes(p.canonicalUrl));
 assert(!/drive\.google\.com|docs\.google\.com|AIza|ghp_/.test(html));
});
test('all three Program Focus entries use shared infographic and presentation actions',()=>{
 const event=fs.readFileSync('events/management-thyroid-nodules-2026.html','utf8');
 for(const p of Object.values(data.presentations)){assert(event.includes(`data-article-reader="${p.id}"`));assert(event.includes(p.cover));}
 assert.equal((event.match(/Inspect infographic/g)||[]).length,3);
});
test('JUMI public presentation associations preserve private speaker identities and do not duplicate',()=>{
 const c={};vm.createContext(c);vm.runInContext(fs.readFileSync('scripts/jumi/backend.js','utf8'),c);
 const catalog=JSON.parse(fs.readFileSync('data/jumi-public-catalog.json')).items;
 const event={id:'management-thyroid-nodules-2026',speakerRecords:[{id:'existing-achmad',name:'dr. Achmad Fachri',credentials:'Sp.Rad(K)'}],presentations:[]};
 c.jumiCatalogPresentations_(event,catalog);c.jumiCatalogPresentations_(event,catalog);
 assert.equal(event.speakerRecords.length,3);assert.equal(event.presentations.length,3);
 assert.equal(event.presentations.find(p=>p.id===ids[0]).typeData.publication.speakerId,'existing-achmad');
 assert(event.presentations.every(p=>p.status==='Published'&&p.catalogOnly));
});
