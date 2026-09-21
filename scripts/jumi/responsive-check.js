// Bounded local-only browser QA. Uses an available Playwright runtime; no production data or writes.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..');
(async()=>{
  const server=http.createServer((req,res)=>{
    const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
    if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
    const target=fs.existsSync(file)&&fs.statSync(file).isDirectory()?path.join(file,'index.html'):file;
    if(!fs.existsSync(target)){res.writeHead(404).end();return}
    res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.jpg':'image/jpeg'})[path.extname(target)]||'application/octet-stream');res.end(fs.readFileSync(target));
  });
  let browser,checks=0;
  try{
    await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=await chromium.launch({headless:true,...(process.env.JUMI_QA_BROWSER?{channel:process.env.JUMI_QA_BROWSER}:{})});
    const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(5000);
    await page.goto(`http://127.0.0.1:${server.address().port}/jumi/?qa`,{waitUntil:'load'});
    await page.evaluate(()=>{const t=window.__JUMI_TEST__;t.state.data.content=[{id:'article-qa',type:'Article',title:'Current Diagnostic Approach and Therapy Selection for Thyroid Nodules',status:'Published',publishedAt:'2026-09-19T10:00:00+07:00',typeData:{}},{id:'ebook-qa',type:'eBook',title:'Advanced Diagnostics and Management of Thyroid Nodules',status:'Draft',updatedAt:'2026-09-20T10:00:00+07:00',typeData:{}}];t.state.data.content.push({id:'video-qa',type:'Video',slug:'local-video-fixture',title:'BA Medicale Original Clinical Education with a Long Source-Supported Title',status:'Draft',updatedAt:'2026-09-22T10:00:00+07:00',typeData:{}});t.state.data.registrants=[{id:'qa-person',eventId:'past',name:'Local QA participant',email:'qa@example.invalid',registrationStatus:'Registered',paymentStatus:'Pending',attendanceStatus:'Not Checked',certificateStatus:'Not Eligible',confirmationStatus:'Not Sent'}];t.render()});
    async function check(label,width){
      const result=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,shortTitles:[...document.querySelectorAll('.calendar-list strong,.event-row h3,.content-row h3')].filter(e=>e.getBoundingClientRect().width<180).map(e=>e.textContent),badButtons:[...document.querySelectorAll('.button,.workspace-tabs button')].filter(e=>e.getBoundingClientRect().height>0&&e.getBoundingClientRect().height<43).map(e=>e.textContent)}));
      assert.ok(result.scroll<=result.width+1,`${width} ${label}: overflow ${JSON.stringify(result)}`);assert.deepEqual(result.shortTitles,[],`${width} ${label}: narrow titles`);assert.deepEqual(result.badButtons,[],`${width} ${label}: touch targets`);checks++;
    }
    for(const width of [1440,1280,1024,820,430,390,375,360]){
      await page.setViewportSize({width,height:1000});
      await page.evaluate(()=>window.__JUMI_TEST__.navigate('Dashboard'));await check('Dashboard',width);await page.locator('[data-dashboard-type="Videos"]').click();await check('Video Dashboard',width);await page.locator('[data-dashboard-type="All"]').click();
      await page.locator('[data-open-content="article-qa"]').click();assert.match(await page.locator('#dialog-content').innerText(),/Edit Article/);await page.keyboard.press('Escape');
      await page.evaluate(()=>window.__JUMI_TEST__.navigate('Dashboard'));
      await page.locator('[data-open-content="past"]').click();assert.equal(await page.locator('#dialog input[name="title"]').inputValue(),'Management of Thyroid Nodules — How to Make a Good Diagnosis?');await page.keyboard.press('Escape');
      await page.evaluate(()=>window.__JUMI_TEST__.navigate('Dashboard'));
      if(process.env.JUMI_QA_SCREENSHOTS&&[1440,390].includes(width))await page.screenshot({path:path.join(process.env.JUMI_QA_SCREENSHOTS,`jumi-${width}.png`),fullPage:true});
      if(width<=820){await page.locator('.calendar-list').scrollIntoViewIfNeeded();await page.locator('#nav-toggle').click();await check('navigation',width);const nav=await page.locator('#primary-nav').boundingBox();assert.ok(nav.y>=58&&nav.y+nav.height<=1000,'Menu must be visible when opened from a scrolled Dashboard');await page.keyboard.press('Escape');assert.equal(await page.locator('#nav-toggle').getAttribute('aria-expanded'),'false')}
      for(const name of ['Content','Community','Settings']){await page.evaluate(name=>window.__JUMI_TEST__.navigate(name),name);await check(name,width)}
      await page.evaluate(()=>{const t=window.__JUMI_TEST__;t.state.contentSection='Seminars';t.navigate('Content')});
      for(const tab of ['Overview','Event Details','Registration','Payments','Attendance','Notifications','Certificates','Event Tools','Preview','Publish']){await page.locator(`[data-seminar-tab="${tab}"]`).click();await check(tab,width)}
      for(const scope of ['all','upcoming','live','completed']){await page.locator('#event-scope').selectOption(scope);await check('Scope '+scope,width)}
      for(const type of ['Article','eBook','Seminar','Video']){
        await page.locator('.workspace-header [data-action="new-content"]').click();await page.locator(`[data-create-type="${type}"]`).click();await check('Create '+type,width);
        const overflow=await page.locator('.dialog-card').evaluate(e=>e.scrollWidth>e.clientWidth+1);assert.equal(overflow,false,`${width} ${type} dialog overflow`);await page.keyboard.press('Escape');
      }
    }
    assert.deepEqual(errors,[]);console.log(`PASS: ${checks} responsive surface checks across 8 widths; no runtime errors.`);
  }finally{if(browser)await browser.close();await new Promise(r=>server.close(r))}
})().catch(error=>{console.error(error);process.exitCode=1});
