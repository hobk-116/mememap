const {mockMapStyle} = require('./map_fixture.cjs');
/* Use only tests/serve_fixture.py: all accounts and mutations are disposable. */
const {chromium} = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const base = process.argv[2];
  if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(base || '')) throw new Error('Pass a disposable fixture URL.');
  const browser = await chromium.launch({headless:true,
    ...(process.env.MEMEMAP_TEST_BROWSER ? {executablePath:process.env.MEMEMAP_TEST_BROWSER} : {})});
  const errors = [];
  try {
    async function account(username) {
      const context = await browser.newContext({viewport:{width:1280,height:850}});
      await mockMapStyle(context);
      const response = await context.request.post(base + '/api/login', {data:{username,password:'browser-test-123'}});
      assert.equal(response.status(),200);
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(base + '/landing.html');
      await page.locator('.fixed-pending-pin').waitFor();
      return {context,page};
    }
    const {context:member,page:memberPage} = await account('browser_other');
    const {context:admin,page} = await account('browser_admin');
    const pin = (await (await member.request.get(base + '/api/pins')).json()).pins[0];
    const dialog = page.locator('#adminActionOverlay');
    const settle = () => page.waitForTimeout(300);
    const tab = name => page.locator(`[data-admin-tab="${name}"]`).click();
    const ready = () => page.locator('#adminBody[aria-busy="false"]').waitFor();
    async function confirm(reason) {
      await dialog.locator('[name="reason"]').fill(reason);
      await dialog.locator('[type="submit"]').click();
      await page.locator('#adminActionOverlay.open').waitFor({state:'hidden'});
      await ready();
    }
    assert.equal(await memberPage.locator('#adminToggle').isVisible(),false);
    await memberPage.locator(`[data-open-pin="${pin.id}"]`).click();
    await memberPage.locator(`[data-report-pin="${pin.id}"]`).click();
    await memberPage.locator('#adminActionFields [name="detail"]').fill('Please review this fixture meme.');
    await memberPage.locator('#adminActionSubmit').click();
    await memberPage.getByText('Đã gửi báo cáo. Quản trị viên sẽ xem xét.',{exact:true}).waitFor();
    await memberPage.locator('#adminActionCancel').click();

    await page.locator('#adminToggle:not([hidden])').click();
    await ready();
    assert.equal(await page.locator('#panel.closed').count(),0,'Admin does not close Menu');
    assert.equal(await page.locator('[data-admin-tab]').count(),4);
    await tab('reports'); await ready();
    await page.locator(`[data-entry="report:${pin.id}"] > summary`).click();
    await page.locator('[data-admin-action="review-report"]').click();
    await confirm('Reviewing fixture report');
    await page.locator('#adminBody select[name="status"]').selectOption('reviewing'); await ready();
    await page.locator(`[data-entry="report:${pin.id}"] > summary`).click();
    await page.locator('[data-admin-action="hide-report"]').click();
    await confirm('Hide fixture after report');
    assert.equal((await (await member.request.get(base + '/api/pins')).json()).pins.some(item=>item.id===pin.id),false);
    await page.locator('#adminHistory').click(); await ready();
    await page.locator('#adminBody select[name="action"]').selectOption('hide_pin'); await ready();
    assert.match(await page.locator('#adminBody').innerText(),/Hide fixture after report/);
    await page.locator('#adminHistory').click(); await ready();
    await tab('pins'); await ready();
    await page.locator(`[data-entry="pin:${pin.id}"] > summary`).click();
    await page.locator('[data-admin-action="restore-pin"]').click();
    await confirm('Restore fixture');
    assert.equal((await (await member.request.get(base + '/api/pins')).json()).pins.some(item=>item.id===pin.id),true);

    await tab('users'); await ready();
    await page.locator('#adminBody input[name="q"]').fill('browser_other');
    await page.locator('#adminBody form button[type="submit"]').click(); await ready();
    await page.locator('[data-entry^="user:"] > summary').click();
    await page.locator('[data-admin-action="restrict-user"]').click();
    await dialog.locator('[name="scope"]').selectOption('both');
    await dialog.locator('[name="duration_hours"]').selectOption('1');
    await confirm('Fixture restriction');
    const denied = await member.request.post(base + '/api/pins',{data:{title:'Denied',lat:20.9893,lng:105.7953}});
    assert.equal(denied.status(),403);
    assert.equal((await denied.json()).error,'post_restricted');
    await page.locator('[data-admin-action="lift-user"]').click();
    await confirm('Lift fixture restriction');
    const created = await member.request.post(base + '/api/pins',{data:{title:'Disposable admin deletion',lat:20.9893,lng:105.7953}});
    assert.equal(created.status(),201);
    const disposable = (await created.json()).pin;
    await tab('pins'); await ready();
    await page.locator(`[data-entry="pin:${disposable.id}"] > summary`).click();
    await page.locator(`[data-entry="pin:${disposable.id}"] .admin-overflow > summary`).click();
    await page.locator(`[data-admin-action="delete-pin"][data-id="${disposable.id}"]`).click();
    await confirm('Delete test meme');
    const audit = await (await admin.request.get(base + `/api/admin/audit?target_type=pin&target_id=${disposable.id}`)).json();
    assert.equal(audit.entries[0].reason,'Delete test meme');

    await page.locator('#lang').click();
    assert.equal(await page.locator('#admin-tab-overview').innerText(),'Overview');
    for (const viewport of [{width:601,height:850},{width:390,height:844}]) {
      await page.setViewportSize(viewport); await settle();
      const boxes = await page.evaluate(() => {
        const rect = id => {const b=document.getElementById(id).getBoundingClientRect();return {x:b.x,y:b.y,right:b.right,bottom:b.bottom};};
        return {menu:rect('panel'),admin:rect('adminPanel'),menuButton:rect('toggle'),adminButton:rect('adminToggle'),
          body:document.getElementById('adminBody').scrollWidth,bodyWidth:document.getElementById('adminBody').clientWidth};
      });
      assert(Math.abs(boxes.menuButton.y-boxes.adminButton.y)<1,'Toggle buttons align');
      assert(boxes.body<=boxes.bodyWidth+1,'No horizontal overflow in Admin content');
      if(viewport.width>600) assert(boxes.menu.right<boxes.admin.x,'Desktop drawers do not overlap');
      else {
        assert.equal(await page.locator('#panel.closed').count(),1,'Mobile Admin replaces Menu in the shared sheet');
        assert.equal(await page.locator('#adminPanel.closed').count(),0);
        assert(Math.abs(boxes.admin.bottom-(viewport.height-8))<1,'Mobile Admin uses the bottom sheet position');
      }
      await tab('overview'); await ready();
    }
    await page.screenshot({path:'/tmp/mememap-admin-mobile.png'});
    const touchContext = await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,storageState:await admin.storageState()});
    await mockMapStyle(touchContext);
    const touchPage = await touchContext.newPage();
    touchPage.on('pageerror',error=>errors.push(error.message));
    await touchPage.goto(base + '/landing.html');
    await touchPage.locator('#adminToggle:not([hidden])').click();
    await touchPage.locator('#adminBody[aria-busy="false"]').waitFor();
    await touchPage.waitForTimeout(300);
    const cdp = await touchContext.newCDPSession(touchPage);
    // The filter area now drags the sheet. Scroll it away before testing native list scrolling.
    const scrollBefore = await touchPage.locator('#adminBody').evaluate(el => {
      el.scrollTop = el.querySelector('.admin-filters').offsetHeight + 12;
      return el.scrollTop;
    });
    const bodyBox = await touchPage.locator('#adminBody').boundingBox();
    const x = bodyBox.x+bodyBox.width/2, y = bodyBox.y+bodyBox.height-12;
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
    for(let i=1;i<=6;i++){
      await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-i*10}]});
      await touchPage.waitForTimeout(20);
    }
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await touchPage.waitForTimeout(150);
    const scrollAfter = await touchPage.locator('#adminBody').evaluate(el=>el.scrollTop);
    assert(scrollAfter > scrollBefore, `Touch can scroll Admin results: ${scrollBefore} -> ${scrollAfter}`);
    const before = await touchPage.locator('#adminPanel').boundingBox();
    const title = await touchPage.locator('#adminHeading').boundingBox();
    const dragX=title.x+50, dragY=title.y+title.height/2;
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:dragX,y:dragY}]});
    for(let i=1;i<=6;i++){
      await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:dragX,y:dragY-i*10}]});
      await touchPage.waitForTimeout(20);
    }
    const during = await touchPage.locator('#adminPanel').boundingBox();
    assert(Math.abs(before.y-during.y-60)<3,'The shared sheet follows the finger without jumping or doubling movement');
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await touchContext.close();
    assert.deepEqual(errors,[],'No page errors');
    console.log('Admin UI passed: report/review/hide/restore, audit filtering, restrictions/lift, permanent deletion, English, independent drawers and responsive layout.');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exit(1);});
