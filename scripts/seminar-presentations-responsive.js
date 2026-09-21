// Bounded local-only presentation checks; no participant submissions or external writes.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),ids=['current-diagnostic-approach-and-therapy-selection-for-thyroid-nodules','ultrasound-imaging-and-tirads-classification-in-thyroid-nodules','bethesda-system-for-reporting-thyroid-cytopathology'];
(async()=>{
 const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));});
 let browser,checks=0;
 try{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=await chromium.launch({headless:true,channel:'chrome'});
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(5000);
  const origin=`http://127.0.0.1:${server.address().port}`;
  await page.route('**/*',r=>r.request().url().startsWith(origin)?r.continue():r.abort());
  for(const width of [1440,820,430,390,375,360]){
   await page.setViewportSize({width,height:900});
   await page.goto(origin+'/events/management-thyroid-nodules-2026.html');
   assert.equal(await page.locator('.presentation-preview').count(),3);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   for(const id of ids)assert(await page.locator(`[data-article-reader="${id}"]`).isVisible());
   checks++;
   for(const [index,id] of ids.entries()){
    await page.goto(origin+'/presentations/'+id+'.html');
    assert.equal(await page.locator('.presentation-slide').count(),[20,25,29][index]);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await page.locator('.presentation-index [data-slide-open="1"]').click();
    await page.locator('[data-slide-next]').click();assert.equal(await page.locator('.slide-viewer__counter').innerText(),`2 / ${[20,25,29][index]}`);
    await page.keyboard.press('ArrowLeft');assert.equal(await page.locator('.slide-viewer__counter').innerText(),`1 / ${[20,25,29][index]}`);
    await page.keyboard.press('Escape');assert(!(await page.locator('.slide-viewer').isVisible()));
    assert(await page.locator('.presentation-index [data-slide-open="1"]').evaluate(el=>el===document.activeElement));
    await page.locator('[data-download-material]').first().click();await page.locator('.download-dialog').waitFor({state:'visible'});
    assert((await page.locator('.download-dialog').innerText()).includes(index?'PPTX':'PDF'));
    await page.locator('[data-download-cancel]').click();
    await page.locator('[data-article-reader]').first().click();assert(await page.getByText('Quick Read · Presentation summary').isVisible());
    checks++;
   }
  }
  assert.deepEqual(errors,[]);console.log(`${checks} responsive presentation checks passed at six widths; no runtime errors.`);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
