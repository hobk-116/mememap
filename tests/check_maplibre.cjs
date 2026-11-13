/* Engine/coordinate/scale and resource-failure regressions with disposable data. */
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const {mockMapStyle} = require('./map_fixture.cjs');
const fs = require('node:fs');
const path = require('node:path');
(async () => {
  const base = process.argv[2];
  if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(base || '')) throw new Error('Use a disposable fixture URL.');
  const browser = await chromium.launch({headless:true,
    ...(process.env.MEMEMAP_TEST_BROWSER ? {executablePath:process.env.MEMEMAP_TEST_BROWSER} : {})});
  try {
    for (const lang of ['vi','en']) {
      for (const failure of [null,'module','css','style','worker']) {
        console.log('MapLibre case:', lang, failure || 'normal');
        const context = await browser.newContext({viewport:{width:1280,height:850}});
        await context.addInitScript(lang => localStorage.setItem('mememap-language',lang),lang);
        assert.equal((await context.request.post(base+'/api/login',{data:{username:'browser_admin',password:'browser-test-123'}})).status(),200);
        await context.route('**/assets/js/map-layout.js', route => route.fulfill({contentType:'text/javascript',body:
          fs.readFileSync(path.join(__dirname,'../assets/js/map-layout.js'),'utf8') +
          '\nconst originalLayout=MemeMap.createMapLayout;MemeMap.createMapLayout=options=>{window.testMap=options.map;return originalLayout(options);};'}));
        if (failure==='css') await context.route('**/maplibre-gl.css',route=>route.abort());
        if (failure==='module') await context.route('**/maplibre-gl.mjs',route=>route.abort());
        if (failure==='style') await context.route('https://tiles.openfreemap.org/**',route=>route.fulfill({status:503,body:'Unavailable'}));
        else if (failure==='worker') {
          await context.route('**/maplibre-gl-worker.mjs?*',route=>route.fulfill({status:503,body:'Unavailable'}));
          await context.route('https://tiles.openfreemap.org/**',route=>route.fulfill({json:{version:8,sources:{points:{type:'geojson',data:{type:'FeatureCollection',features:[]}}},layers:[{id:'points',type:'circle',source:'points'}]}}));
        } else await mockMapStyle(context);
        const page = await context.newPage();
        await page.goto(base+'/landing.html');
        if (failure) {
          await page.locator('#mapStatus:not([hidden])').waitFor();
          assert.match(await page.locator('#mapStatus').textContent(),lang==='vi'?/Không tải được bản đồ/:/Map unavailable/);
        } else {
          await page.waitForFunction(()=>window.testMap?.isStyleLoaded());
          const result = await page.evaluate(() => {
            const map=testMap, center=map.getCenter();
            const p=map.project([105.7953,20.9893]), q=map.project([105.7963,20.9893]);
            return {lat:center.lat,lng:center.lng,zoom:map.getZoom(),width:q.x-p.x,
              rotated:map.getBearing(),pitch:map.getPitch(),leaflet:typeof window.L};
          });
          assert(Math.abs(result.lat-20.9893)<1e-7 && Math.abs(result.lng-105.7953)<1e-7,'Initial API center retains latitude/longitude');
          assert.equal(result.zoom,17);
          assert(Math.abs(result.width-256*2**18*.001/360)<.001,'MapLibre z17 matches Leaflet z18 in projected pixel scale');
          assert.equal(result.leaflet,'undefined');
          assert.equal(result.rotated,0);assert.equal(result.pitch,0);
          await page.locator('.meme-map-marker').first().focus();
          await page.keyboard.press('Enter');
          await page.locator('.maplibregl-popup').waitFor();
          assert.equal(await page.locator('#modal.open').count(),0,'Keyboard marker activation never opens composer');
          await page.evaluate(()=>testMap.getCanvas().dispatchEvent(new Event('webglcontextlost')));
          await page.locator('#mapStatus:not([hidden])').waitFor();
        }
        await context.close();
      }
    }
    console.log('MapLibre passed: real engine, center/scale preservation, keyboard marker, bilingual module/CSS/style/worker/WebGL failure feedback.');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
