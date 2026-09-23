const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const model=require('../ebooks/model'),render=require('./ebook-full-read').render;
const root=path.resolve(__dirname,'..'),context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'content.js'),'utf8'),context);
const books=model.published(context.window.BAMEDICALE_DATA.ebooks);
test('published shelf excludes all drafts and previews without deleting their canonical records',()=>{
  assert.equal(books.length,3);assert.equal(context.window.BAMEDICALE_DATA.ebooks.length,7);
  const shelf=fs.readFileSync(path.join(root,'ebooks.html'),'utf8');
  for(const book of books)assert(shelf.includes(`data-content-id="${book.id}"`));
  assert(!shelf.includes('data-content-id="ebook-foundations'));
  const many=Array.from({length:55},(_,i)=>({id:String(i),publicationStatus:'published',publishedDate:'2026-09-22'}));
  assert.deepEqual([0,1,2,3].flatMap(i=>model.batch(many,i).items),many);
  assert.equal(model.batch(many,0).items.length,18);
});
for(const book of books)test(`${book.slug}: complete source layout, image integrity, TOC and safe semantic output`,()=>{
  const base=path.dirname(book.pageManifest),data=JSON.parse(fs.readFileSync(path.join(root,base,'full-read.json'))),html=render(root,book);
  assert.equal(data.pages.length,book.pages.length);
  assert.equal(data.sourceSha256,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,book.sourcePdf))).digest('hex'));
  assert.deepEqual(data.pages.map(p=>p.number),Array.from({length:book.pages.length},(_,i)=>i+1));
  for(const p of data.pages){assert(p.coveredCharacters>0);assert(html.includes(`data-reader-page="${p.number}"`));for(const s of p.segments){if(s.image){assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,base,s.image))).digest('hex'),s.sha256);assert(s.width>0&&s.height>0);}else assert(s.text);}}
  for(const anchor of html.matchAll(/href="#(chapter-[^"]+)"/g))assert(html.includes(`id="${anchor[1]}"`));
  assert(html.includes('<table>'));assert(html.includes('loading="lazy"'));assert(!html.includes('<h2>Source PDF page'));
  assert(!/drive\.google|script\.google|<script/i.test(html));
  assert(render(root,{...book,title:'<script>unsafe</script>'}).includes('Table of Contents'));
  assert.throws(()=>render(root,{...book,pages:[]}),/integrity mismatch/);
});
test('Full Read and Magazine share existing reader, search and source-page mapping',()=>{
  const script=fs.readFileSync(path.join(root,'ebooks/reader.js'),'utf8');
  assert(script.includes("history.pushState"));assert(script.includes("'popstate'"));assert(script.includes('model.search(book,searchInput.value)'));
  for(const b of books){const html=fs.readFileSync(path.join(root,'ebooks',b.slug+'.html'),'utf8');assert(html.includes('data-read-mode="magazine"'));assert(html.includes('data-read-mode="accessible"'));assert.equal((html.match(/id="chapter-1-2"/g)||[]).length,1);assert(html.includes('https://bamedicale.com/ebooks/'+b.slug+'.html'));}
});
