const {mockMapStyle} = require('./map_fixture.cjs');
/* Mobile sheet flows, real touch gestures, and simulated keyboard viewport changes. */
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const base = process.argv[2];
  if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(base || '')) throw new Error('Use a disposable fixture URL.');
  const browser = await chromium.launch({headless:true,
    ...(process.env.MEMEMAP_TEST_BROWSER ? {executablePath:process.env.MEMEMAP_TEST_BROWSER} : {})});
  try {
    for (const viewport of [{width:390,height:844},{width:360,height:740}]) {
      const context = await browser.newContext({viewport,hasTouch:true,isMobile:true});
      await mockMapStyle(context);
      await context.route('**/assets/js/map-layout.js', route => route.fulfill({contentType:'text/javascript',body:
        fs.readFileSync(path.join(__dirname,'../assets/js/map-layout.js'),'utf8') +
        '\nconst originalLayout=MemeMap.createMapLayout;MemeMap.createMapLayout=options=>{window.testMap=options.map;return originalLayout(options);};'}));
      // Exercise long results without adding production/test database records.
      await context.route('**/api/leaderboard?*', route => route.fulfill({json:{city:'hanoi',leaders:
        Array.from({length:40},(_,i)=>({rank:i+1,name:`Member ${i+1}`,username:'browser_other',pin_count:1,aura:40-i,is_you:false}))}}));
      await context.addInitScript(() => {
        const nativeHeight = Object.getOwnPropertyDescriptor(VisualViewport.prototype,'height').get;
        Object.defineProperty(visualViewport,'height',{get:() => window.keyboardHeight ?? nativeHeight.call(visualViewport)});
        window.simulateKeyboard = height => {
          window.keyboardHeight = height;
          visualViewport.dispatchEvent(new Event('resize'));
        };
      });
      assert.equal((await context.request.post(base+'/api/login',{data:{username:'browser_admin',password:'browser-test-123'}})).status(),200);
      const page = await context.newPage(), errors = [], assetFailures = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('requestfailed', request => {
        if (!request.url().includes('tiles.openfreemap.org')) assetFailures.push({url:request.url(),error:request.failure()?.errorText});
      });
      await page.goto(base+'/landing.html');
      await page.locator('#adminToggle:not([hidden])').waitFor().catch(error => {
        console.error({errors,assetFailures});
        throw error;
      });
      await page.locator('[data-open-pin="1"]').waitFor();
      const settle = () => page.waitForTimeout(460);
      const height = id => page.locator(id).evaluate(el => el.getBoundingClientRect().height);
      const collapsed = id => height(id).then(value => assert(Math.abs(value-230)<1,`Sheet collapses: got ${value}px at ${viewport.width}px`));
      const expanded = id => height(id).then(value => assert(Math.abs(value-Math.min(viewport.height*.76,640))<1,`Sheet expands: got ${value}px at ${viewport.width}px`));
      const cdp = await context.newCDPSession(page);
      async function drag(x,y,delta) {
        await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
        for(let step=1;step<=6;step++) {
          await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y+delta*step/6}]});
          await page.waitForTimeout(20);
        }
        await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
        await settle();
      }
      async function handleDrag(id,delta) {
        const box = await page.locator(id).boundingBox();
        await drag(box.x+box.width/2,box.y+12,delta);
      }
      await settle(); await collapsed('#panel');
      const hint = await page.locator('#hint').boundingBox();
      assert(hint.width<viewport.width-30,'Hint hugs its text rather than stretching across the screen');
      assert(Math.abs(hint.x+hint.width/2-viewport.width/2)<1,'Hint is centered');
      const tools = await page.locator('.tools').boundingBox();
      await drag(tools.x+tools.width-44,tools.y+tools.height/2,-300);
      await expanded('#panel');
      assert.equal(await page.locator('#modal').evaluate(el=>el.classList.contains('open')),false,'Dragging near controls does not activate a button');
      await handleDrag('#panel',300); await collapsed('#panel');
      await page.locator('#search').tap(); await expanded('#panel');
      assert.equal(await page.locator('#search').evaluate(el=>document.activeElement===el),true,'Search tap still focuses');
      await page.locator('#search').fill('Fixture');
      const geometry = () => page.evaluate(() => {
        const rect = id => {const b=document.querySelector(id).getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height};};
        return {body:rect('body'),sheet:rect('.panel:not(.closed)'),
          footer:document.querySelector('#panel').classList.contains('closed') ? null : rect('#boardSwitchBtn'),map:rect('#map'),
          pin:rect('.fixed-pending-pin'),scrollX,scrollY,center:testMap.getCenter()};
      });
      const beforeKeyboard = await geometry();
      await page.evaluate(h=>simulateKeyboard(h-300),viewport.height); await settle();
      assert.deepEqual(await geometry(),beforeKeyboard,'Keyboard resize leaves page, map, sheet and footer in place');
      await page.locator('#search').blur(); await settle();
      assert.deepEqual(await geometry(),beforeKeyboard,'Blur during keyboard closing does not move the footer');
      await page.evaluate(h=>simulateKeyboard(h),viewport.height); await settle();
      await page.evaluate(h=>simulateKeyboard(h-40),viewport.height); await settle();
      assert.equal(await page.locator('body').evaluate(el=>el.getBoundingClientRect().height),viewport.height-40,'Browser chrome resize works after keyboard closes');
      await page.evaluate(()=>simulateKeyboard(undefined)); await settle();

      await handleDrag('#panel',300); await collapsed('#panel');
      await page.locator('#boardSwitchBtn').tap(); await settle(); await expanded('#panel');
      await page.locator('.leader-row').first().waitFor();
      const city = await page.locator('#cityFilter').boundingBox();
      const title = await page.locator('#leaderboardTitle').boundingBox();
      const list = await page.locator('#leaderboardList').boundingBox();
      await drag(list.x+list.width-4,list.y+list.height-12,-150);
      assert(await page.locator('#leaderboardList').evaluate(el=>el.scrollTop)>0,'Only leaderboard results scroll');
      assert.deepEqual(await page.locator('#cityFilter').boundingBox(),city,'City selector stays fixed');
      assert.deepEqual(await page.locator('#leaderboardTitle').boundingBox(),title,'Leaderboard heading stays fixed');
      const filter = await page.locator('.leaderboard-filter').boundingBox();
      await drag(filter.x+filter.width-4,filter.y+10,300); await collapsed('#panel');
      await page.locator('#boardSwitchBtn').tap(); await settle(); await collapsed('#panel');
      await handleDrag('#panel',-300); await expanded('#panel');
      await page.locator('#boardSwitchBtn').tap(); await settle(); await expanded('#panel');
      await handleDrag('#panel',300); await collapsed('#panel');
      await page.locator('#boardSwitchBtn').tap(); await settle(); await expanded('#panel');
      await page.locator('[data-vote="1"][data-value="1"]').tap();
      await page.locator('[data-vote="1"][data-value="1"].selected').waitFor();
      await expanded('#panel');
      await page.locator('[data-open-pin="1"]').tap(); await settle(); await collapsed('#panel');
      assert.equal(await page.locator('.maplibregl-popup .pin-popup strong').textContent(),'Fixture pin');
      await page.evaluate(()=>document.querySelector('.maplibregl-popup-close-button')?.click());

      await page.locator('#adminToggle').tap(); await settle(); await collapsed('#adminPanel');
      await page.locator('#adminBody[aria-busy="false"]').waitFor();
      await page.locator('.admin-filters select[name="days"]').selectOption('30');
      await settle(); await expanded('#adminPanel');
      await page.locator('#adminBody[aria-busy="false"]').waitFor();
      assert.equal(await page.locator('select[name="days"]').inputValue(),'30');
      await handleDrag('#adminPanel',300); await collapsed('#adminPanel');
      await page.locator('[data-admin-tab="pins"]').tap();
      await page.locator('#adminBody[aria-busy="false"]').waitFor();
      const adminFilters = await page.locator('.admin-filters').boundingBox();
      await drag(adminFilters.x+2,adminFilters.y+15,-300); await expanded('#adminPanel');
      await handleDrag('#adminPanel',300); await collapsed('#adminPanel');
      await page.locator('.admin-filters input[name="q"]').tap(); await expanded('#adminPanel');
      await page.locator('.admin-filters input[name="q"]').fill('Fixture');
      await settle();
      const adminBeforeKeyboard = await geometry();
      await page.evaluate(h=>simulateKeyboard(h-300),viewport.height); await settle();
      assert.deepEqual(await geometry(),adminBeforeKeyboard,'Admin search keeps page and map geometry stable with keyboard');
      await page.evaluate(()=>simulateKeyboard(undefined)); await settle();
      await page.locator('.admin-filters button[type="submit"]').tap();
      await page.locator('#adminBody[aria-busy="false"]').waitFor();
      assert.equal(await page.locator('.admin-card-title').first().textContent(),'Fixture pin','Search still submits correctly');
      if (!await page.locator('.admin-filter-options').evaluate(el=>el.open)) {
        await page.locator('.admin-filter-options > summary').tap();
      }
      await page.locator('.admin-filters select[name="status"]').selectOption('visible');
      await page.locator('#adminBody[aria-busy="false"]').waitFor();
      await expanded('#adminPanel');
      assert.equal(await page.locator('select[name="status"]').inputValue(),'visible');
      await handleDrag('#adminPanel',300); await collapsed('#adminPanel');
      await page.locator('#adminBody').evaluate(el=>el.scrollTop=el.scrollHeight);
      const adminHeading = await page.locator('#adminHeading').boundingBox();
      await drag(adminHeading.x+30,adminHeading.y+adminHeading.height/2,-300);
      await expanded('#adminPanel');
      await page.locator('#toggle').tap(); await settle();
      await page.locator('#boardSwitchBtn').tap(); await settle();
      if (viewport.width === 390) await page.screenshot({path:'/private/tmp/mememap-mobile-sheet-ux.png'});
      await page.setViewportSize({width:1280,height:850}); await settle();
      await page.locator('#boardSwitchBtn').click(); await settle();
      const desktopHeight = await height('#panel');
      await page.locator('#search').fill('Fixture'); await settle();
      assert.equal(await height('#panel'),desktopHeight,'Search does not resize desktop drawers');
      await page.locator('[data-open-pin="1"]').click(); await settle();
      assert.equal(await height('#panel'),desktopHeight,'Pin selection does not collapse a desktop drawer');
      assert.deepEqual(errors,[]);
      await cdp.detach(); await context.close();
    }
    console.log('Mobile sheet UX passed: search/filter expansion, control-area touch drag, keyboard viewport stability, subview state, fixed leaderboard header, pin collapse and desktop behavior.');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exit(1);});
