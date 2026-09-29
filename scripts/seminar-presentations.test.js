const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const context={window:{}};vm.runInNewContext(fs.readFileSync('content.js','utf8'),context);
const data=context.window.BAMEDICALE_DATA,hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const ids=['ultrasound-imaging-and-tirads-classification-in-thyroid-nodules','bethesda-system-for-reporting-thyroid-cytopathology'];
for(const [i,id] of ids.entries())test(`${id}: original, infographic, slide integrity and shared output`,()=>{
 const p=data.presentations[id],m=JSON.parse(fs.readFileSync(p.sourceManifest)),html=fs.readFileSync(p.canonicalUrl,'utf8');
 assert.equal(m.pages.length,[25,29][i]);assert.equal(hash(p.sourceFile),m.sourceSha256);assert.equal(hash(p.cover),m.infographicSha256);
 assert.equal(p.coverWidth/p.coverHeight,16/9);assert.equal(p.sourceFormat,'PPTX');assert.equal(p.downloadFormat,'PDF');assert(fs.existsSync(p.downloadFile));assert.equal(fs.readFileSync(p.downloadFile).subarray(0,5).toString(),'%PDF-');
 let last=-1;for(const [index,page] of m.pages.entries()){assert.equal(page.page,index+1);assert.equal(hash(page.image),page.imageSha256);const pos=html.indexOf(`id="slide-${index+1}"`);assert(pos>last);last=pos;}
 assert(html.includes('Quick Read'));assert(html.includes('Full Read'));assert(!/Download Presentation|Download Original|data-download-material|sourcePdf|downloadFile|contentUrl|isBasedOn/.test(html));assert(html.includes('presentation.js'));assert(html.includes('data-article-reader'));assert(html.includes('bamedicale-approved-logo.jpg'));
 const registry=require('../content-registry').create(data);assert(registry.search(p.title).some(r=>r.id===id));assert(registry.related(p.eventId,20).some(r=>r.id===id));assert(fs.readFileSync('sitemap.xml','utf8').includes(p.canonicalUrl));
 assert(html.includes(`<h1>${p.title}</h1>`));assert(html.includes(p.author.name));assert(html.includes(p.summary));assert(html.includes(data.seminars[p.eventId].title));assert(html.includes(p.diseaseCondition));assert(html.includes('rel="canonical"'));assert(!/name="robots" content="noindex/i.test(html));
 const schemaText=html.match(/<script type="application\/ld\+json">(.*?)<\/script>/)?.[1],schema=JSON.parse(schemaText);
 assert.equal(schema['@type'],'PresentationDigitalDocument');assert.equal(schema.name,p.title);assert.equal(schema.author.name,p.author.name);assert.equal(schema.isPartOf.name,data.seminars[p.eventId].title);assert.equal(schema.isPartOf.url,`https://bamedicale.com/${data.seminars[p.eventId].detailUrl}`);assert.equal(schema.audience.audienceType,'Doctors');
 assert(!/drive\.google\.com|docs\.google\.com|AIza|ghp_/.test(html));
});
test('all three Program Focus entries use shared infographic and presentation actions',()=>{
 const event=fs.readFileSync('events/management-thyroid-nodules-2026.html','utf8');
 for(const p of Object.values(data.presentations)){assert(event.includes(`data-article-reader="${p.id}"`));assert(event.includes(`Full Read: ${p.title}`));assert(event.includes(`Quick Read: ${p.title}`));assert(event.includes(p.cover));}
 assert.equal((event.match(/Inspect infographic/g)||[]).length,3);
 const focusActions=[...event.matchAll(/<div class="presentation-preview__actions">([\s\S]*?)<\/div>/g)].map(match=>match[1]);
 assert.equal(focusActions.length,3);for(const actions of focusActions)assert.deepEqual([...actions.matchAll(/<a\b/g)].length,2);
 assert(!event.includes('Watch Presentation Video'));
 assert(!/Download Presentation|Download Original|data-download-material|email-gate/i.test(event));
});
test('public presentation download modal and event handler are removed',()=>{
 assert(!fs.existsSync('download-client.js'));
 const app=fs.readFileSync('app.js','utf8');
 assert(!app.includes('data-download-material'));
 assert(!app.includes('download-client.js'));
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
