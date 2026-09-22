// Bounded, read-only public-site QA. Reuses the existing Playwright runtime.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
let origin=process.env.QA_ORIGIN||'https://bamedicale.com';
const label=process.env.QA_LABEL||'live';
const output=path.resolve('admin-drafts/tmp/design-qa',label);
const widths=[360,375,390,430,820,1024,1280,1440];
const routes=['/','/library.html','/library.html?type=article','/articles/tumor-vs-cancer-understanding-the-difference.html','/ebooks.html','/ebooks/the-silent-elevation-understanding-high-blood-pressure.html','/ebooks/advanced-diagnostics-and-management-of-thyroid-nodules.html','/seminar.html','/events/management-thyroid-nodules-2026.html','/presentations/current-diagnostic-approach-and-therapy-selection-for-thyroid-nodules.html','/videos.html','/videos.html?video=ba-medicale-neoplasia-definition-early-detection','/search.html'];
(async()=>{let browser,server;const results=[];fs.mkdirSync(output,{recursive:true});
 if(origin==='local'){const http=require('node:http'),root=path.resolve('.');server=http.createServer((req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname;const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.pdf':'application/pdf','.mp4':'video/mp4'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);});await new Promise(r=>server.listen(0,'127.0.0.1',r));origin=`http://127.0.0.1:${server.address().port}`;}
 try{browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage();page.setDefaultTimeout(7000);page.setDefaultNavigationTimeout(20000);let errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of process.env.QA_INTERACTIONS_ONLY?[]:widths){await page.setViewportSize({width,height:900});
  for(const route of routes){errors=[];const start=Date.now();const response=await page.goto(origin+route,{waitUntil:'load'});await page.locator('main').waitFor();
   if(route.startsWith('/library'))await page.locator('.article-list-item').first().waitFor();
   const state=await page.evaluate(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth+1,mainText:document.querySelector('main').innerText.length,hiddenSections:[...document.querySelectorAll('main .reveal')].filter(e=>getComputedStyle(e).opacity==='0').length,broken:[...document.images].filter(i=>i.getAttribute('src')&&i.complete&&!i.naturalWidth&&i.getClientRects().length).map(i=>i.getAttribute('src'))}));
   const record={route,width,http:response.status(),...state,errors:[...errors],loadMs:Date.now()-start};results.push(record);
   if(['/','/library.html','/ebooks/the-silent-elevation-understanding-high-blood-pressure.html'].includes(route)&&[390,820,1440].includes(width)){await page.screenshot({path:path.join(output,`${route==='/'?'home':route.includes('library')?'library':'ebook'}-${width}.png`)});if(route==='/library.html'){await page.locator('.article-list-item').first().scrollIntoViewIfNeeded();await page.screenshot({path:path.join(output,`library-cards-${width}.png`)});}}
  }console.log(`${label}: ${width}px complete`);
 }
 fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(results,null,2));
 const failures=results.filter(r=>r.http!==200||r.overflow||r.mainText<50||r.errors.length||r.broken.length||(label!=='before'&&r.hiddenSections));
 console.log(JSON.stringify({checks:results.length,failures},null,2));assert.equal(failures.length,0);
 // Real retained interactions, using only public reads; never submit participant data.
 await page.setViewportSize({width:390,height:900});await page.goto(origin+'/library.html?type=seminar-presentation');
 await page.locator('button[type="reset"]').click();assert.match(await page.locator('[data-library-latest-summary]').innerText(),/^33 matching/);
 const ids=new Set(await page.locator('.article-list-item').evaluateAll(es=>es.map(e=>e.dataset.contentId)));
 for(let i=0;i<2;i++){await page.locator('[data-article-audience="PUBLIC"] [data-page="next"]').click();for(const id of await page.locator('.article-list-item').evaluateAll(es=>es.map(e=>e.dataset.contentId)))ids.add(id);}assert.equal(ids.size,33);
 await page.locator('select[name="type"]').selectOption('seminar-presentation');await page.locator('[data-article-reader]').first().click();assert(await page.locator('dialog[open]').isVisible());await page.keyboard.press('Escape');assert.equal(await page.locator('dialog[open]').count(),0);
 await page.locator('.menu-button').click();assert(await page.locator('.nav-mobile').isVisible());await page.keyboard.press('Escape');assert.equal(await page.locator('.menu-button').getAttribute('aria-expanded'),'false');
 await page.goto(origin+'/presentations/current-diagnostic-approach-and-therapy-selection-for-thyroid-nodules.html');await page.locator('.presentation-index [data-slide-open="1"]').click();await page.locator('[data-slide-next]').click();assert.match(await page.locator('.slide-viewer__counter').innerText(),/^2 \/ 20$/);await page.keyboard.press('Escape');assert(await page.locator('.presentation-index [data-slide-open="1"]').evaluate(el=>el===document.activeElement));
 await page.goto(origin+'/videos.html?video=ba-medicale-neoplasia-definition-early-detection');assert(await page.locator('video').count()>0);
 for(const slug of ['the-silent-elevation-understanding-high-blood-pressure','advanced-diagnostics-and-management-of-thyroid-nodules']){await page.goto(origin+'/ebooks/'+slug+'.html');await page.getByRole('link',{name:'Full Read',exact:true}).click();assert(await page.getByRole('navigation',{name:'Table of Contents'}).isVisible());await page.getByRole('link',{name:'Magazine',exact:true}).click();assert(await page.getByRole('button',{name:'Switch to Full Read',exact:true}).isVisible());}
 await page.emulateMedia({reducedMotion:'reduce'});await page.addInitScript(()=>{delete window.IntersectionObserver;});
 for(const route of ['/','/library.html']){await page.goto(origin+route);assert.equal(await page.locator('main .reveal').evaluateAll(es=>es.filter(e=>getComputedStyle(e).opacity==='0').length),0);}
 console.log('Public interactions, 33-record preservation, both reading modes and observer-free reduced motion passed.');
 }finally{await browser?.close();if(server)await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e.message);process.exitCode=1});
