const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'content.js'),'utf8'),context);
const brand=context.window.BAMEDICALE_DATA.brand;

test('canonical brand record drives the shared public shell',()=>{
  assert.deepEqual({...brand},{name:'BA Medicale',domainDisplay:'BAMedicale.com',logo:'assets/brand/bamedicale-approved-logo.jpg'});
  const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
  assert.match(app,/const BRAND = Object\.freeze/);
  assert.match(app,/navigationHref\(BRAND\.logo\)/);
  assert.equal((app.match(/navigationHref\(BRAND\.logo\)/g)||[]).length,2);
  assert.match(app,/<b>\$\{BRAND\.name\}<\/b>/);
});

test('quiz pages reuse the canonical logo and lockup',()=>{
  for(const name of ['management-thyroid-nodules-2026','lms-management-thyroid-nodules-2026']){
    const html=fs.readFileSync(path.join(root,'quiz',name+'.html'),'utf8');
    assert.match(html,/class="brand"/);
    assert.match(html,/assets\/brand\/bamedicale-approved-logo\.jpg/);
    assert.match(html,/<b>BA Medicale<\/b>/);
    assert.doesNotMatch(html,/bamedicale-logo\.png/);
  }
});

test('published eBook social metadata uses the approved cover',()=>{
  const html=fs.readFileSync(path.join(root,'ebooks','advanced-diagnostics-and-management-of-thyroid-nodules.html'),'utf8');
  const cover='https://bamedicale.com/assets/ebooks/advanced-diagnostics-and-management-of-thyroid-nodules/cover.jpg';
  assert.match(html,/<meta property="og:site_name" content="BA Medicale">/);
  assert.match(html,new RegExp('<meta property="og:image" content="'+cover.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'">'));
  assert.match(html,new RegExp('<meta name="twitter:image" content="'+cover.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'">'));
  assert.match(html,/model\.js\?v=reader-integrity-20260920/);
  assert.match(html,/reader\.js\?v=reader-integrity-20260920/);
});

test('public pages load the current shared shell asset version',()=>{
  const walk=directory=>fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>['.git','Material','node_modules','jumi'].includes(entry.name)?[]:entry.isDirectory()?walk(path.join(directory,entry.name)):[path.join(directory,entry.name)]);
  for(const file of walk(root).filter(file=>file.endsWith('.html'))){
    const html=fs.readFileSync(file,'utf8');
    if(!html.includes('app.js?v='))continue;
    assert.match(html,/app\.js\?v=brand-integrity-20260920/,path.relative(root,file));
    assert.doesNotMatch(html,/app\.js\?v=design-system-20260920/,path.relative(root,file));
  }
});
