const {mockMapStyle} = require('./map_fixture.cjs');
/* Run against tests/serve_fixture.py, with Playwright available to Node. */
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const base = process.argv[2];
  if (!base?.startsWith('http://127.0.0.1:')) throw new Error('Use the disposable fixture URL.');
  const browser = await chromium.launch({headless: true,
    ...(process.env.MEMEMAP_TEST_BROWSER ? {executablePath: process.env.MEMEMAP_TEST_BROWSER} : {})});
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await mockMapStyle(page);
    await page.route('**/assets/js/map-layout.js', route => route.fulfill({contentType: 'text/javascript', body:
      fs.readFileSync(path.join(__dirname, '../assets/js/map-layout.js'), 'utf8') +
      '\nconst originalLayout=MemeMap.createMapLayout; MemeMap.createMapLayout=options=>{window.testMap=options.map; return originalLayout(options);};'}));
    const settle = () => page.waitForTimeout(320);
    const fixedState = () => page.locator('.fixed-pending-pin').evaluate(el => ({
      x: parseFloat(el.style.left), y: parseFloat(el.style.top), opacity: getComputedStyle(el).opacity,
    }));
    const markerLocation = () => page.locator('.interactive-pending-marker').evaluate(el => {
      const rect = el.getBoundingClientRect();
      const geo = testMap.unproject([rect.left + 21, rect.top + 40]);
      return {lat: geo.lat, lng: geo.lng};
    });
    const fixedLocation = () => page.evaluate(() => {
      const el = document.querySelector('.fixed-pending-pin');
      const geo = testMap.unproject([parseFloat(el.style.left) + 21, parseFloat(el.style.top) + 40]);
      return {lat: geo.lat, lng: geo.lng};
    });
    const closeComposer = async () => { await page.locator('#cancel').click(); await settle(); };
    const closeEnough = (a, b, label) => {
      assert(Math.abs(a.lat - b.lat) < 1e-7 && Math.abs(a.lng - b.lng) < 1e-7,
        `${label}: ${JSON.stringify(a)} vs ${JSON.stringify(b)}`);
    };
    await page.goto(base);
    await page.locator('#accountUsername').fill('browser_admin');
    await page.locator('#accountPassword').fill('browser-test-123');
    await page.locator('#authSubmit').click();
    await page.locator('#authSignedIn').waitFor({state: 'visible'});

    for (const viewport of [{width: 1280, height: 850}, {width: 390, height: 844}]) {
      await page.setViewportSize(viewport);
      await page.goto(base + '/landing.html');
      await page.waitForFunction(() => window.testMap && document.querySelector('.fixed-pending-pin'));
      await page.locator('#adminToggle:not([hidden])').waitFor();
      await settle();
      const click = {x: Math.round(viewport.width * .5), y: Math.round(viewport.height * .30)};
      await page.locator('#adminToggle').click();
      await settle();
      const open = await fixedState();
      await page.locator('#map').click({position: click});
      await page.locator('#modal.open').waitFor();
      await settle();
      assert.equal(await page.locator('.interactive-pending-marker').count(), 0, 'An open drawer uses only the old pin');
      const selectedFixed = await fixedState();
      assert(Math.abs(selectedFixed.x - (click.x - 21)) < 1 && Math.abs(selectedFixed.y - (click.y - 40)) < 1,
        'The old pin still moves to a selection while a drawer is open');
      await closeComposer();
      assert.deepEqual(await fixedState(), open, 'The old pin returns to its original position');
      await page.locator('#adminToggle').click();
      if (viewport.width > 600) await page.locator('#toggle').click();
      await settle();
      const closed = await fixedState();
      const mobile = viewport.width <= 600;
      assert.equal(closed.opacity, mobile ? '1' : '0', 'Only mobile keeps the fixed pin visible at preview height');
      await page.locator('#map').click({position: click});
      await page.locator('#modal.open').waitFor();
      await settle();
      assert.equal(await page.locator('.interactive-pending-marker').count(), mobile ? 0 : 1,
        'Preview selection uses the fixed pin on mobile and a separate marker on desktop');
      if (!mobile) {
        assert.equal(await page.locator('.interactive-pending-pin').evaluate(el => getComputedStyle(el).animationName),
          'interactive-pin-appear', 'Only the desktop temporary pin has its appearance animation');
        assert.deepEqual(await fixedState(), closed, 'Desktop closed selection leaves the fixed pin untouched');
      }
      const selected = await (mobile ? fixedLocation() : markerLocation());
      await page.evaluate(() => testMap.panBy([35, 20], {duration: 0}));
      closeEnough(await (mobile ? fixedLocation() : markerLocation()), selected, 'Selection stays at its geographic coordinates');
      if (mobile) {
        await page.setViewportSize({width:1280,height:850});await settle();
        assert.equal(await page.locator('.interactive-pending-marker').count(),1,'Resizing preview selection to desktop uses its temporary marker');
        closeEnough(await markerLocation(), selected, 'Desktop resize retains selected coordinates');
        await page.setViewportSize(viewport);await settle();
        assert.equal(await page.locator('.interactive-pending-marker').count(),0,'Returning to mobile removes the separate marker');
        closeEnough(await fixedLocation(), selected, 'Mobile resize retains selected coordinates');
      }
      await closeComposer();
      assert.equal(await page.locator('.interactive-pending-marker').count(), 0, 'Cancel removes the interactive pin');
      const anchor = await fixedLocation();
      await page.locator('#toggle').click();
      await settle();
      const reopened = await fixedLocation();
      const anchorDistance = await page.evaluate(({anchor, reopened}) =>
        (() => { const a = testMap.project(anchor), b = testMap.project(reopened); return Math.hypot(a.x-b.x, a.y-b.y); })(), {anchor, reopened});
      assert(anchorDistance <= 1, 'Reopening preserves the old layout anchor within MapLibre pixel rounding');
      assert.equal((await fixedState()).opacity, '1', 'The old pin is visible again');
      assert.equal(await page.locator('.interactive-pending-marker').count(), 0, 'Reopening does not revive the new pin');
      await page.locator('#toggle').click();
      await settle();
      assert.equal(await page.locator('.interactive-pending-marker').count(), 0, 'Closing alone never activates the new pin');
      await page.locator('#hint').click();
      await page.locator('#modal.open').waitFor();
      await settle();
      const centered = await (mobile ? fixedLocation() : markerLocation());
      await page.locator('#title').fill('Closed-drawer pin ' + viewport.width);
      const [response] = await Promise.all([
        page.waitForResponse(response => response.url().endsWith('/api/pins') && response.request().method() === 'POST'),
        page.locator('#form button.save').click(),
      ]);
      assert.equal(response.status(), 201);
      closeEnough((await response.json()).pin, centered, 'Saving uses the coordinates of the new pin');
      await page.locator('#modal.open').waitFor({state: 'hidden'});
      assert.equal(await page.locator('.interactive-pending-marker').count(), 0, 'Saving removes the temporary pin');
    }
    assert.deepEqual(errors, [], 'No browser runtime errors');
    console.log('Interactive pin checks passed: desktop closed selection and animation; mobile preview fixed pin; selected coordinates, pan, cancel, reopen and save.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
