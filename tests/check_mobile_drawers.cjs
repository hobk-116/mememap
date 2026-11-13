const {mockMapStyle} = require('./map_fixture.cjs');
/* Use tests/serve_fixture.py only. Verify the shared mobile sheet and desktop drawers. */
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const base = process.argv[2];
  if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(base || '')) throw new Error('Pass a disposable fixture URL.');
  const browser = await chromium.launch({headless:true,
    ...(process.env.MEMEMAP_TEST_BROWSER ? {executablePath:process.env.MEMEMAP_TEST_BROWSER} : {})});
  try {
    const context = await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
    await mockMapStyle(context);
    await context.route('**/assets/js/map-layout.js', route => route.fulfill({contentType:'text/javascript',body:
      fs.readFileSync(path.join(__dirname,'../assets/js/map-layout.js'),'utf8') +
      '\nconst originalLayout=MemeMap.createMapLayout;MemeMap.createMapLayout=options=>{window.testMap=options.map;return originalLayout(options);};'}));
    assert.equal((await context.request.post(base+'/api/login',{data:{username:'browser_admin',password:'browser-test-123'}})).status(),200);
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base+'/landing.html');
    await page.locator('#adminToggle:not([hidden])').waitFor();
    const settle = () => page.waitForTimeout(320);
    const state = () => page.evaluate(() => {
      const active = [...document.querySelectorAll('.panel:not(.closed)')];
      const pin = document.querySelector('.fixed-pending-pin');
      const geo = testMap.unproject([parseFloat(pin.style.left)+21,parseFloat(pin.style.top)+40]);
      const box = active[0]?.getBoundingClientRect();
      return {active:active.map(panel=>panel.id),height:box?.height,top:box?.top,
        pinX:parseFloat(pin.style.left),pinY:parseFloat(pin.style.top),lat:geo.lat,lng:geo.lng};
    });
    function sameAnchor(before,after) {
      assert(Math.abs(before.lat-after.lat)<1e-7 && Math.abs(before.lng-after.lng)<1e-7,'Switching preserves the geographic anchor');
    }
    await settle();
    assert.deepEqual((await state()).active,['panel']);
    const panel = await page.locator('#panel').boundingBox();
    const cdp = await context.newCDPSession(page);
    const x = panel.x+panel.width/2, y = panel.y+12;
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
    for(let step=1;step<=6;step++) {
      await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-step*45}]});
      await page.waitForTimeout(20);
    }
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await settle();
    const expanded = await state();
    assert(expanded.height>panel.height+200,'Mobile sheet expands by touch dragging');
    await page.locator('#search').fill('Fixture');
    await page.locator('#adminToggle').click(); await settle();
    assert.deepEqual((await state()).active,['adminPanel']);
    assert.equal((await state()).height,230,'First opening of Admin uses its own default height');
    sameAnchor(expanded,await state());
    await page.locator('#adminBody[aria-busy="false"]').waitFor();
    await page.locator('[data-admin-tab="users"]').click();
    await page.locator('#adminBody[aria-busy="false"]').waitFor();
    await page.locator('#adminBody input[name="q"]').fill('browser_other');
    for(let count=0;count<3;count++) {
      await page.locator('#toggle').click(); await settle();
      assert.deepEqual((await state()).active,['panel']);
      assert.equal(await page.locator('#search').inputValue(),'Fixture','Menu search survives switching');
      assert.equal((await state()).height,expanded.height,'Sibling switching restores Menu height');
      sameAnchor(expanded,await state());
      await page.locator('#adminToggle').click(); await settle();
      assert.deepEqual((await state()).active,['adminPanel']);
      await page.locator('#adminBody[aria-busy="false"]').waitFor();
      assert.equal(await page.locator('#admin-tab-users').getAttribute('aria-selected'),'true');
      assert.equal(await page.locator('#adminBody input[name="q"]').inputValue(),'browser_other','Admin filters survive switching');
      assert.equal((await state()).height,expanded.height,'Sibling switching restores Admin height and filters');
      sameAnchor(expanded,await state());
    }
    await page.screenshot({path:'/private/tmp/mememap-shared-mobile-admin.png'});
    await page.locator('#adminToggle').click(); await settle();
    assert.deepEqual((await state()).active,['adminPanel'],'Closing keeps a header-only preview');
    assert.equal(await page.locator('#adminPanel').getAttribute('data-sheet-level'),'peek');
    await page.locator('#toggle').click(); await settle();
    assert.equal((await state()).height,expanded.height,'Switching from closed Admin restores Menu height');
    sameAnchor(expanded,await state());
    await page.setViewportSize({width:1280,height:850}); await settle();
    await page.locator('#adminToggle').click(); await settle();
    assert.deepEqual((await state()).active,['panel','adminPanel'],'Desktop drawers remain independent');
    await page.setViewportSize({width:390,height:844}); await settle();
    assert.deepEqual((await state()).active,['adminPanel'],'Entering mobile keeps the last opened drawer');
    await page.setViewportSize({width:1280,height:850}); await settle();
    await page.locator('#toggle').click(); await settle();
    assert.deepEqual((await state()).active,['panel','adminPanel']);
    await page.setViewportSize({width:390,height:844}); await settle();
    assert.deepEqual((await state()).active,['panel'],'Entering mobile also respects Menu as the last opened drawer');
    assert.deepEqual(errors,[]);
    console.log('Shared mobile sheet passed: touch expansion, sibling height memory, preserved anchor/filters, header-only close, desktop independence and resize.');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exit(1);});
