const {mockMapStyle} = require('./map_fixture.cjs');
/* Foundation contracts: partial feeds, profile refresh races, shared API errors and logout entry points. */
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const base = process.argv[2];
  if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(base || '')) throw new Error('Use tests/serve_fixture.py only.');
  const browser = await chromium.launch({headless: true,
    ...(process.env.MEMEMAP_TEST_BROWSER ? {executablePath: process.env.MEMEMAP_TEST_BROWSER} : {})});
  try {
    const context = await browser.newContext({viewport: {width: 1280, height: 850}});
    await mockMapStyle(context);
    await context.request.post(base + '/api/login', {data: {username: 'browser_other', password: 'browser-test-123'}});
    for (const title of ['Additional profile pin', 'Another profile pin']) {
      assert.equal((await context.request.post(base + '/api/pins', {data: {title, lat: 20.9893, lng: 105.7953}})).status(), 201);
    }
    await context.request.post(base + '/api/logout', {data: {}});
    await context.request.post(base + '/api/login', {data: {username: 'browser_admin', password: 'browser-test-123'}});
    const ownPin = (await (await context.request.post(base + '/api/pins', {
      data: {title: 'Own profile entry point', lat: 20.9893, lng: 105.7953},
    })).json()).pin;
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/api/pins', async route => {
      if (route.request().method() !== 'GET') return route.continue();
      const response = await route.fetch();
      const data = await response.json();
      // Simulates a future community-filtered/paginated feed, without changing profile data.
      data.pins = data.pins.filter(pin => pin.id === 1 || pin.id === ownPin.id);
      await route.fulfill({response, json: data});
    });
    await page.goto(base + '/landing.html');
    await page.locator('[data-open-pin="1"]').click();
    await page.locator('.pin-popup [data-profile-username="browser_other"]').click();
    await page.waitForFunction(() => document.querySelector('#profileStats').textContent === '3 meme • 0 aura');
    await page.locator('#profileOverlay.open').waitFor({state:'visible'});
    assert.equal(await page.locator('#profileLogoutButton').isVisible(), false);
    // Exercise a language rerender while a modal is open; its overlay blocks real header clicks.
    await page.evaluate(() => document.querySelector('#lang').click());
    assert.equal(await page.locator('#profileStats').innerText(), '3 memes • 0 aura', 'Rendering never recomputes totals from the partial map feed');
    // A vote changes the authoritative totals; the visible profile refreshes on the next feed refresh.
    assert.equal((await context.request.post(base + '/api/pins/1/vote', {data: {value: 1}})).status(), 200);
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    await page.waitForFunction(() => document.querySelector('#profileStats').textContent === '3 memes • 1 aura');
    await page.locator('#profileClose').click();
    await page.waitForTimeout(300);
    await page.locator(`[data-open-pin="${ownPin.id}"]`).click();
    await page.locator('.pin-popup [data-profile-username="browser_admin"]').click();
    await page.waitForFunction(() => document.querySelector('#profileUsername').textContent === '@browser_admin');
    assert.equal(await page.locator('#profileLogoutButton').isVisible(), false, 'Own pin profile does not expose logout');
    await page.locator('#profileClose').click();
    await page.waitForTimeout(300);
    await page.locator('#boardSwitchBtn').click();
    await page.locator('#leaderboardList .leader-profile-name[data-profile-username="browser_admin"]').click();
    await page.waitForFunction(() => document.querySelector('#profileUsername').textContent === '@browser_admin');
    assert.equal(await page.locator('#profileLogoutButton').isVisible(), false, 'Own leaderboard profile does not expose logout');
    await page.locator('#profileClose').click();
    await page.waitForTimeout(300);
    await page.locator('#profileButton').click();
    await page.locator('#profileLogoutButton').waitFor({state: 'visible'});
    await page.route('**/api/logout', route => route.fulfill({status: 503, json: {error: 'storage_failed'}}));
    page.once('dialog', dialog => dialog.accept());
    const alert = page.waitForEvent('dialog', {predicate: dialog => dialog.type() === 'alert'});
    await Promise.all([
      page.locator('#profileLogoutButton').click(),
      alert.then(dialog => dialog.dismiss()),
    ]);
    await page.waitForFunction(() => !document.querySelector('#profileLogoutButton').disabled);
    assert.equal((await (await context.request.get(base + '/api/me')).json()).authenticated, true);
    assert.equal(await page.locator('#profileLogoutButton').isVisible(), true, 'Failed logout preserves the session and profile');
    await page.unroute('**/api/logout');
    assert.deepEqual(errors, []);
    await browser.close();
    console.log('Foundation UI passed: partial feeds, authoritative profile totals, logout entry points and failure recovery.');
  } finally { if (browser.isConnected()) await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
