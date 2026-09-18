const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const crypto=require('node:crypto');
const context={window:{}};
vm.runInNewContext(fs.readFileSync('content.js','utf8'),context);
const data=context.window.BAMEDICALE_DATA;
const p=Object.values(data.presentations)[0];
const manifest=JSON.parse(fs.readFileSync(p.sourceManifest,'utf8'));
const html=fs.readFileSync(p.canonicalUrl,'utf8');
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
test('presentation retains every source page, extracted text and original asset',()=>{
 assert.equal(hash(p.sourcePdf),manifest.sourceSha256);
 assert.equal(hash(p.video),manifest.videoSha256);
 assert.equal(manifest.pages.length,20);
 let previous=-1;
 for(const s of manifest.pages){
  const position=html.indexOf(`id="slide-${s.page}"`);
  assert(position>previous);previous=position;
  assert(html.includes(escape(s.text).replace(/[ \t]+(?=\n)/g, whitespace => [...whitespace].map(c => c === " " ? "&#32;" : "&#9;").join(""))));
  assert.equal(hash(s.image),s.imageSha256);
  for(const figure of s.figures)assert.equal(hash(figure.src),figure.assetSha256);
 }
 assert(html.indexOf('<video')>html.indexOf('id="slide-3"'));
 assert(html.indexOf('<video')<html.indexOf('id="slide-4"'));
 assert(!/<video[^>]*(?:autoplay|muted)/.test(html));
 assert(html.includes('controls playsinline'));
});
test('presentation discovery and canonical authorship remain professional and source-backed',()=>{
 const registry=require('../content-registry').create(data);
 assert.equal(p.author.name,data.profile.name);
 assert(registry.query({audience:'DOCTOR'}).some(r=>r.id===p.id));
 assert(!registry.query({audience:'PUBLIC'}).some(r=>r.id===p.id));
 assert(registry.search('therapy selection').some(r=>r.id===p.id));
 assert(registry.related(p.eventId).some(r=>r.id===p.id));
 const event=fs.readFileSync(`events/${p.eventId}.html`,'utf8');
 assert(event.includes(`data-article-reader="${p.id}"`));
 assert(event.includes('BA Medicale Seminar Attendance'));
 assert(event.includes('https://lms.kemkes.go.id/courses/d467f2bf-9e8d-42ca-8572-c46a6d0581b3'));
 assert(html.includes(escape(data.profile.name)));
 assert(fs.readFileSync('sitemap.xml','utf8').includes(p.canonicalUrl));
});
