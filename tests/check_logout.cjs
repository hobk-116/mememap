const {mockMapStyle} = require('./map_fixture.cjs');
/* Confirmation and session invalidation across pages, languages and viewport sizes. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const base=process.argv[2];
 if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(base||'')) throw new Error('Use tests/serve_fixture.py only.');
 const browser=await chromium.launch({headless:true,...(process.env.MEMEMAP_TEST_BROWSER?{executablePath:process.env.MEMEMAP_TEST_BROWSER}:{})});
 try {
  for(const width of [1280,390]) for(const lang of ['vi','en']) for(const pathname of ['/','/landing.html']) {
   const context=await browser.newContext({viewport:{width,height:850}});
   await context.addInitScript(language=>localStorage.setItem('mememap-language',language),lang);
   await mockMapStyle(context);
   assert.equal((await context.request.post(base+'/api/login',{data:{username:'browser_admin',password:'browser-test-123'}})).status(),200);
   const page=await context.newPage(); let logoutRequests=0;
   page.on('request',request=>{if(request.url().endsWith('/api/logout')) logoutRequests++;});
   await page.goto(base+pathname);
   await page.locator('#profileButton:not([hidden])').waitFor();
   await page.waitForFunction(()=>Boolean(document.querySelector('#profileButton').onclick));
   await page.locator('#profileButton').click();
   await page.locator('#profileOverlay.open').waitFor();
   async function choose(accept) {
    const dialogPromise=page.waitForEvent('dialog');
    const clicking=page.locator('#profileLogoutButton').click();
    const dialog=await dialogPromise;
    assert.equal(dialog.type(),'confirm');
    assert.equal(dialog.message(),lang==='vi'?'Bạn có chắc muốn đăng xuất?':'Are you sure you want to sign out?');
    await (accept?dialog.accept():dialog.dismiss());
    await clicking;
   }
   await choose(false);
   assert.equal(logoutRequests,0,'Cancel sends no logout request');
   assert.equal((await (await context.request.get(base+'/api/me')).json()).authenticated,true);
   assert.equal(await page.locator('#profileLogoutButton').isVisible(),true);
   await choose(true);
   if(pathname==='/') await page.locator('#authFormState:not(.auth-hidden)').waitFor();
   else await page.waitForURL(base+'/');
   assert.equal(logoutRequests,1);
   assert.equal((await (await context.request.get(base+'/api/me')).json()).authenticated,false);
   console.log(`Passed ${width}px ${lang} ${pathname}: cancel preserves session, confirm signs out.`);
   await context.close();
  }
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
