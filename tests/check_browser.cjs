const {mockMapStyle} = require('./map_fixture.cjs');
/* Run with Playwright available to Node, against tests/serve_fixture.py only. */
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
  const context = await browser.newContext({viewport: {width: 1280, height: 850}});
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  // Test real MapLibre UI without issuing requests to the public tile service.
  await mockMapStyle(page);
  await page.route('**/assets/js/map-layout.js', route => route.fulfill({contentType: 'text/javascript', body:
    fs.readFileSync(path.join(__dirname, '../assets/js/map-layout.js'), 'utf8') + `\nconst originalLayout=MemeMap.createMapLayout; MemeMap.createMapLayout=options=>{window.testMap=options.map; return originalLayout(options);};`}));
  const wait = () => page.waitForTimeout(320);
  const state = () => page.evaluate(() => {
    const pin = document.querySelector('.fixed-pending-pin');
    const group = document.querySelector('#drawerToggleGroup').getBoundingClientRect();
    return {x: parseFloat(pin.style.left), y: parseFloat(pin.style.top), left: group.left, top: group.top,
      ...(() => { const point = testMap.unproject([parseFloat(pin.style.left) + 21, parseFloat(pin.style.top) + 40]);
        return {lat: point.lat, lng: point.lng}; })()};
  });
  await page.goto(base);
  await page.waitForFunction(() => typeof MemeMap === 'object');
  assert.equal(await page.title(), 'MemeMap — Trang chính');
  assert.equal(await page.evaluate(() => MemeMap.suggestUsername('Đặng Thị ạ ầ ẳ')), 'dang_thi_a_a_a');
  await page.locator('#accountUsername').fill('browser_admin');
  await page.locator('#accountPassword').fill('browser-test-123');
  await page.locator('#authSubmit').click();
  await page.locator('#authSignedIn').waitFor({state: 'visible'});
  assert.equal(await page.title(), 'MemeMap — Trang chính');
  await page.locator('#profileButton').click();
  await page.locator('#profileOverlay.open').waitFor();
  const homeRight = await page.locator('.profile-card').boundingBox();
  assert(homeRight.x > 800, 'Own desktop profile aligns to the right');
  await page.locator('#profileClose').click();
  assert(await page.locator('#profileOverlay').evaluate(el => el.classList.contains('own-profile-view')),
    'Own profile presentation is retained throughout fade-out');
  await wait();
  await page.goto(base + '/landing.html');
  await page.waitForFunction(() => window.testMap && document.querySelector('.fixed-pending-pin'));
  await page.locator('#adminToggle:not([hidden])').waitFor();
  await wait();
  let before = await state();
  await page.locator('#adminToggle').click();
  await wait();
  let after = await state();
  assert.equal(after.left, before.left, 'Desktop toggle group stays anchored');
  assert(after.x < before.x, 'Opening the right drawer moves the pin into the remaining map space');
  const drift = await page.evaluate(({before, after}) => (() => { const a = testMap.project([before.lng, before.lat]), b = testMap.project([after.lng, after.lat]);
      return Math.hypot(a.x-b.x, a.y-b.y); })(), {before, after});
  assert(drift <= 1, 'Opening a desktop drawer preserves the anchor within MapLibre pixel rounding');
  assert(!(await page.locator('#panel').evaluate(el => el.classList.contains('closed'))), 'Desktop menu remains open');
  await page.locator('#adminToggle').click();
  await wait();
  before = await state();
  assert(before.x > 600, 'Pin centers in the visible desktop map area');
  await page.evaluate(() => {
    window.savedMarker = document.querySelector('.meme-map-marker'); window.popupUpdates = 0;
    const original = MemeMap.maplibregl.Popup.prototype.setHTML;
    MemeMap.maplibregl.Popup.prototype.setHTML = function(html) { popupUpdates++; return original.call(this, html); };
  });
  await page.waitForTimeout(10_200);
  assert(await page.evaluate(() => savedMarker === document.querySelector('.meme-map-marker')),
    'Periodic refresh reuses the existing marker');
  assert.equal(await page.evaluate(() => popupUpdates), 0, 'Unchanged periodic refresh does not rebuild a closed popup');
  await page.evaluate(() => testMap.panBy([60, 30], {duration: 0}));
  after = await state();
  assert.equal(after.x, before.x, 'Pin is screen-fixed during normal map pan');
  assert.equal(after.y, before.y, 'Pin does not follow mouse or normal pan');
  await page.locator('#profileButton').click();
  await page.locator('#profileOverlay.open').waitFor();
  await page.locator('#profileClose').click();
  await wait();
  await page.locator('[data-open-pin="1"]').click();
  await page.locator('.pin-author-link').waitFor();
  const voted = page.waitForResponse(response => response.url().endsWith('/vote'));
  await page.locator('.pin-popup [data-value="1"]').click();
  assert.equal((await voted).status(), 200, 'Popup vote is sent successfully');
  await page.waitForFunction(() => document.querySelector('.pin-popup .aura-score b')?.textContent === '1');
  assert(await page.evaluate(() => popupUpdates > 0), 'A changed vote updates the active popup');
  await page.locator('.pin-author-link').waitFor();
  assert(!(await page.locator('#modal').evaluate(el => el.classList.contains('open'))), 'Popup control click does not open the pin composer');
  await page.route('**/api/profiles/browser_other', async route => {
    await new Promise(resolve => setTimeout(resolve, 500));
    await route.continue();
  });
  await page.locator('.pin-author-link').click();
  await page.evaluate(() => document.getElementById('profileButton').click());
  await page.waitForTimeout(650);
  assert.equal(await page.locator('#profileUsername').textContent(), '@browser_admin', 'Late other-profile response cannot overwrite own profile');
  assert(await page.locator('#profileOverlay').evaluate(el => el.classList.contains('own-profile-view')));
  await page.locator('#profileClose').click();
  await wait();
  await page.unroute('**/api/profiles/browser_other');
  await page.locator('.pin-author-link').click();
  await page.waitForFunction(() => document.querySelector('#profileName').textContent === 'browser_other');
  assert(!(await page.locator('#profileOverlay').evaluate(el => el.classList.contains('own-profile-view'))), 'Pin profile stays centered');
  await page.locator('#profileClose').click();
  await wait();
  await page.locator('#topGuide').click();
  await page.locator('#quickGuide.open').waitFor();
  assert.equal(await page.locator('#quickGuide').evaluate(el => getComputedStyle(el).display), 'flex');
  await page.locator('#closeGuide').click();
  await wait();
  await page.locator('#hint').click();
  await page.locator('#modal.open').waitFor();
  await page.locator('#cancel').click();
  await wait();
  await page.setViewportSize({width: 390, height: 844});
  await wait();
  assert.equal(await page.locator('#toggleArrow').textContent(), '↓');
  before = await state();
  for (let i = 0; i < 4; i++) {
    const box = await page.locator('#panel').boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + 12);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2, box.y - 270, {steps: 12});
    await page.mouse.up();
    await wait();
    assert.equal(await page.locator('#panel').getAttribute('data-sheet-level'), 'expanded', `Cycle ${i}: expanded sheet`);
    const expanded = await page.locator('#panel').boundingBox();
    await page.mouse.move(expanded.x + expanded.width / 2, expanded.y + 12);
    await page.mouse.down();
    await page.mouse.move(expanded.x + expanded.width / 2, expanded.y + 270, {steps: 12});
    await page.mouse.up();
    await wait();
    assert.equal(await page.locator('#panel').getAttribute('data-sheet-level'), 'default', `Cycle ${i}: default sheet`);
  }
  after = await state();
  assert(Math.abs(after.lng - before.lng) < 1e-7, `No eastward drift: ${after.lng - before.lng}`);
  assert(Math.abs(after.y - before.y) < 1, `Pin returns to default-sheet center: ${JSON.stringify({before,after})}`);
  const adminBefore = await page.locator('#adminToggle').boundingBox();
  await page.locator('#adminToggle').click();
  await wait();
  const adminState = await state();
  assert.equal(adminState.top, after.top, 'Shared sheet height preserves toggle position');
  const menuBox = await page.locator('#toggle').boundingBox();
  const adminBox = await page.locator('#adminToggle').boundingBox();
  assert(Math.abs(menuBox.y - adminBox.y) < 1, 'Mobile buttons remain side by side');
  assert(Math.abs(adminBox.x - adminBefore.x) < 1, 'Mobile admin button does not move sideways during drawer switch');
  const hintBox = await page.locator('#hint').boundingBox();
  const sheetBox = await page.locator('#adminPanel').boundingBox();
  assert(hintBox.y + hintBox.height < sheetBox.y, 'Pin action remains visible above the mobile sheet');
  await page.locator('#toggle').click();
  await wait();
  // Test fallback used when Safari canvas cannot encode WebP.
  const fallback = await page.evaluate(async () => {
    const original = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function(callback, type, quality) {
      return original.call(this, callback, type === 'image/webp' ? 'image/png' : type, quality);
    };
    try {
      const blob = await (await fetch('/assets/icon-128x.png')).blob();
      const output = await MemeMap.compressImage(new File([blob], 'avatar.png', {type: 'image/png'}), 512);
      return output.startsWith('data:image/png;base64,');
    } finally { HTMLCanvasElement.prototype.toBlob = original; }
  });
  assert(fallback, 'WebP-unsupported browser uses PNG fallback');
  await page.locator('#hint').click();
  await page.locator('#title').fill('Image race regression');
  await page.locator('#photo').setInputFiles(path.join(__dirname, '../assets/icon-128x.png'));
  const created = page.waitForResponse(response => response.url().endsWith('/api/pins') && response.request().method() === 'POST');
  await page.locator('#form button.save').click();
  const pin = (await (await created).json()).pin;
  assert(pin.image?.endsWith('.webp'), 'Submitting immediately after image selection waits for compression');
  await page.screenshot({path: '/private/tmp/mememap-mobile-refactor.png'});
  assert.deepEqual(errors, [], 'No browser runtime errors');
  await browser.close();
  console.log('Browser regressions passed: home/login, profiles/fade, drawers, fixed pin, resize, mobile drag, image fallback.');
})().catch(error => { console.error(error); process.exit(1); });
