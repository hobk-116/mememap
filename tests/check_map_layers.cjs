const {mockMapStyle} = require('./map_fixture.cjs');
/* Actual hit-testing across MapLibre panes and app controls, using disposable data. */
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
    for (const viewport of [{width:1280,height:850},{width:390,height:844}]) {
      const mobile = viewport.width <= 600;
      const context = await browser.newContext({viewport,hasTouch:mobile,isMobile:mobile});
      await mockMapStyle(context);
      await context.route('**/assets/js/map-layout.js', route => route.fulfill({contentType:'text/javascript',body:
        fs.readFileSync(path.join(__dirname,'../assets/js/map-layout.js'),'utf8') +
        '\nconst originalLayout=MemeMap.createMapLayout;MemeMap.createMapLayout=options=>{window.testMap=options.map;return originalLayout(options);};'}));
      assert.equal((await context.request.post(base+'/api/login',{data:{username:'browser_admin',password:'browser-test-123'}})).status(),200);
      const page = await context.newPage(), errors=[];
      page.on('pageerror', error=>errors.push(error.message));
      await page.goto(base+'/landing.html');
      await page.locator('#adminToggle:not([hidden])').waitFor();
      await page.locator('.meme-map-marker').first().waitFor();
      await page.waitForTimeout(340);
      const box = () => page.locator('.fixed-pending-pin').boundingBox();
      const initial = await box();
      await page.evaluate(()=>testMap.panBy([65,35],{duration:0}));
      assert.deepEqual(await box(),initial,'Map panning keeps the fixed pin at its screen position');
      await page.evaluate(()=>testMap.setZoom(16,{duration:0}));
      assert.deepEqual(await box(),initial,'Zoom reset keeps the fixed pin at its screen position');
      const animationDrift = await page.evaluate(async () => {
        const pin=document.querySelector('.fixed-pending-pin'),start=pin.getBoundingClientRect();
        let drift=0,recording=true;
        const record=()=>{const rect=pin.getBoundingClientRect();drift=Math.max(drift,Math.abs(rect.x-start.x),Math.abs(rect.y-start.y));
          if(recording)requestAnimationFrame(record);};requestAnimationFrame(record);
        testMap.panBy([35,-20],{duration:180});
        await new Promise(resolve=>setTimeout(resolve,300));
        testMap.zoomTo(17,{duration:250});
        await new Promise(resolve=>setTimeout(resolve,350));
        recording=false;return drift;
      });
      assert(animationDrift<1,'The fixed pin stays still throughout animated pan and zoom');

      const overlap = await page.evaluate(() => {
        const pin=document.querySelector('.fixed-pending-pin'), marker=document.querySelector('.meme-map-marker');
        const rect=marker.getBoundingClientRect(), old={left:pin.style.left,top:pin.style.top};
        pin.style.left=`${rect.x+rect.width/2-21}px`;pin.style.top=`${rect.y+rect.height/2-21}px`;
        const hit=document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2);
        const wins=hit?.closest('.fixed-pending-pin')===pin;Object.assign(pin.style,old);return wins;
      });
      assert(overlap,'The fixed placement pin is above an existing map marker');
      await page.locator('.meme-map-marker').first().click();
      await page.locator('.maplibregl-popup').waitFor();
      await page.waitForFunction(()=>Number(getComputedStyle(document.querySelector('.maplibregl-popup')).opacity)>.99);
      // Measure and probe in one frame: MapLibre can reposition a popup between separate browser calls.
      const popupWins = await page.evaluate(() => {
        const rect = document.querySelector('.maplibregl-popup-content').getBoundingClientRect();
        const pin = document.querySelector('.fixed-pending-pin');
        pin.style.left=`${rect.x+rect.width/2-21}px`;pin.style.top=`${rect.y+rect.height/2-21}px`;
        return Boolean(document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2)?.closest('.maplibregl-popup'));
      });
      assert(popupWins, 'A meme popup stays above the fixed pin where their content overlaps');
      await page.screenshot({path:`/private/tmp/mememap-popup-over-fixed-${viewport.width}.png`});
      await page.evaluate(()=>document.querySelector('.maplibregl-popup-close-button')?.click());
      for (const id of ['#profileButton','#topGuide','#toggle','#adminToggle']) {
        assert(await page.locator(id).evaluate(el=>{
          const pin=document.querySelector('.fixed-pending-pin'),rect=el.getBoundingClientRect();
          pin.style.left=`${rect.x+rect.width/2-21}px`;pin.style.top=`${rect.y+rect.height/2-21}px`;
          return el.contains(document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2));
        }),'App control '+id+' stays above the fixed pin');
      }
      // A real drawer action restores geometry after the overlap probes.
      await page.locator('#toggle').click();await page.waitForTimeout(340);
      if (mobile) {
        assert.equal(await page.locator('#panel').getAttribute('data-sheet-level'),'peek');
        assert.equal(await page.locator('.fixed-pending-pin').evaluate(el=>getComputedStyle(el).opacity),'1');
        assert(await page.locator('.fixed-pending-pin').isEnabled());
        await page.locator('.fixed-pending-pin').tap();
        await page.locator('#modal.open').waitFor();
        assert.equal(await page.locator('.interactive-pending-marker').count(),0,'Preview placement uses a single fixed pin');
        await page.locator('#cancel').tap();
      } else {
        assert.equal(await page.locator('.fixed-pending-pin').evaluate(el=>getComputedStyle(el).opacity),'0');
        assert.equal(await page.locator('.fixed-pending-pin').isEnabled(),false,'Desktop all-closed behavior is retained');
      }
      assert.deepEqual(errors,[]);
      await context.close();
    }
    console.log('Map layers passed: fixed screen position on pan/zoom, markers < fixed pin < meme popup, app controls above, mobile preview placement and desktop closed behavior.');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exit(1);});
