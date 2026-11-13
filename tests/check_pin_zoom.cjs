const {mockMapStyle} = require('./map_fixture.cjs');
/* Pin-list navigation with real MapLibre, using disposable fixture data only. */
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const base = process.argv[2];
  if (!base?.startsWith('http://127.0.0.1:')) throw new Error('Use the disposable fixture URL.');
  const options = {headless: true};
  if (process.env.MEMEMAP_TEST_BROWSER) options.executablePath = process.env.MEMEMAP_TEST_BROWSER;
  const browser = await chromium.launch(options);
  try {
    for (const viewport of [{width: 1280, height: 850}, {width: 390, height: 844}]) {
      const context = await browser.newContext({viewport, hasTouch: viewport.width <= 600, isMobile: viewport.width <= 600});
      try {
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await mockMapStyle(page);
        await page.route('**/assets/js/map-layout.js', route => route.fulfill({contentType: 'text/javascript', body:
          fs.readFileSync(path.join(__dirname, '../assets/js/map-layout.js'), 'utf8') +
          '\nconst originalLayout = MemeMap.createMapLayout; MemeMap.createMapLayout = options => { window.testMap = options.map; return originalLayout(options); };'}));
        await page.goto(base);
        await page.locator('#accountUsername').fill('browser_admin');
        await page.locator('#accountPassword').fill('browser-test-123');
        await page.locator('#authSubmit').click();
        await page.locator('#authSignedIn').waitFor({state: 'visible'});

        const configResponse = await page.request.get(base + '/api/map-config');
        assert.equal(configResponse.status(), 200);
        const originalConfig = await configResponse.json();
        for (const defaultZoom of [originalConfig.zoom, originalConfig.zoom - 2]) {
          // A different configured default detects any remaining hard-coded navigation zoom.
          await page.route('**/api/map-config', route => route.fulfill({json: {...originalConfig, zoom: defaultZoom}}));
          await page.goto(base + '/landing.html');
          await page.waitForFunction(zoom => window.testMap?.getZoom() === zoom, defaultZoom - 1);
          await page.locator('[data-open-pin="1"]').waitFor({state: 'visible'});
          await page.waitForTimeout(350);
          for (const startZoom of [defaultZoom, defaultZoom - 1, defaultZoom - 2, originalConfig.min_zoom - 1]) {
            await page.evaluate(zoom => {
              document.querySelector('.maplibregl-popup-close-button')?.click();
              testMap.jumpTo({center: [105.7973, 20.9913], zoom});
            }, startZoom);
            if (viewport.width <= 600) {
              const sheet = await page.locator('#panel').boundingBox();
              const cdp = await context.newCDPSession(page);
              const x = sheet.x + sheet.width / 2, y = sheet.y + 12;
              await cdp.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x, y}]});
              for (let step = 1; step <= 5; step++) {
                await cdp.send('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: [{x, y: y - step * 50}]});
                await page.waitForTimeout(20);
              }
              await cdp.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
              await cdp.detach();
              await page.waitForTimeout(350);
            }
            await page.locator('[data-open-pin="1"]').click();
            await page.locator('.maplibregl-popup .pin-popup').waitFor({state: 'visible'});
            const expectedZoom = Math.max(startZoom, defaultZoom - 1);
            await page.waitForFunction(zoom => testMap.getZoom() === zoom && !testMap.isZooming(), expectedZoom);
            assert.equal(await page.evaluate(() => testMap.getZoom()), expectedZoom,
              `Pin-list zoom at ${viewport.width}px: configured ${defaultZoom}, starting ${startZoom}`);
            assert.equal(await page.locator('.pin-popup strong').textContent(), 'Fixture pin');
          }
          await page.unroute('**/api/map-config');
        }
        assert.deepEqual(errors, []);
      } finally {
        await context.close();
      }
    }
    console.log('Pin-list zoom checks passed at desktop/mobile sizes with real and alternate configured defaults.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
