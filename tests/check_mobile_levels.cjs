const {mockMapStyle} = require('./map_fixture.cjs');
/* Three sheet levels, sibling memory, simultaneous transitions and mobile tap safety. */
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
    const context = await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
    await mockMapStyle(context);
    await context.route('**/assets/js/map-layout.js', route => route.fulfill({contentType:'text/javascript',body:
      fs.readFileSync(path.join(__dirname,'../assets/js/map-layout.js'),'utf8') +
      '\nconst originalLayout=MemeMap.createMapLayout;MemeMap.createMapLayout=options=>{window.testMap=options.map;window.testLayout=originalLayout(options);return testLayout;};'}));
    assert.equal((await context.request.post(base+'/api/login',{data:{username:'browser_admin',password:'browser-test-123'}})).status(),200);
    const page = await context.newPage(), errors = [];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(base+'/landing.html');
    await page.locator('#adminToggle:not([hidden])').waitFor();
    await page.locator('[data-open-pin="1"]').waitFor();
    const settle = () => page.waitForTimeout(340);
    const level = id => page.locator(id).getAttribute('data-sheet-level');
    const height = id => page.locator(id).evaluate(el=>el.getBoundingClientRect().height);
    const cdp = await context.newCDPSession(page);
    async function drag(id,delta,yOffset=12) {
      const box = await page.locator(id).boundingBox(), x = box.x+box.width/2, y = box.y+yOffset;
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
      for(let step=1;step<=6;step++) {
        await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y+delta*step/6}]});
        await page.waitForTimeout(18);
      }
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      await settle();
    }
    async function tapAt(x,y) {
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    }
    await settle();
    assert.equal(await level('#panel'),'default');
    const expandedHeight = Math.min(844*.76,640), upperGap=expandedHeight-230;
    await drag('#panel',-upperGap*.28); assert.equal(await level('#panel'),'default','Below 1/3 stays at default');
    await drag('#panel',-upperGap*.38); assert.equal(await level('#panel'),'expanded','Above 1/3 expands');
    await drag('#panel',upperGap*.28); assert.equal(await level('#panel'),'expanded','Small downward pull stays expanded');
    await drag('#panel',upperGap*.38); assert.equal(await level('#panel'),'default');
    await page.locator('#toggle').tap(); await settle();
    assert.equal(await level('#panel'),'peek');
    const peekBox = await page.locator('#panel').boundingBox(), peekHeight = peekBox.height;
    assert.equal(peekBox.x,16); assert.equal(390-peekBox.x-peekBox.width,16); assert.equal(844-peekBox.y-peekBox.height,16);
    assert(await page.locator('#panel h1').isVisible());
    assert.equal(await page.locator('#search').isVisible(),false);
    assert.equal(await page.locator('#boardSwitchBtn').isVisible(),false);
    await page.screenshot({path:'/private/tmp/mememap-mobile-menu-peek.png'});
    const lowerGap=230-peekHeight;
    await drag('#panel',-lowerGap*.28,peekHeight-8); assert.equal(await level('#panel'),'peek','Whole preview is a drag handle');
    await drag('#panel',-lowerGap*.38,peekHeight-8); assert.equal(await level('#panel'),'default');
    await drag('#panel',lowerGap*.28); assert.equal(await level('#panel'),'default');
    await drag('#panel',lowerGap*.38); assert.equal(await level('#panel'),'peek');
    await drag('#panel',-(230-peekHeight+upperGap*.38)); assert.equal(await level('#panel'),'expanded','One drag can skip default');
    await drag('#panel',expandedHeight-230+lowerGap*.38); assert.equal(await level('#panel'),'peek','One downward drag can skip default');
    await page.locator('#toggle').tap(); await settle(); assert.equal(await level('#panel'),'default');

    // CSS is the first line of protection; real consecutive touches exercise the fallback.
    assert.equal(await page.locator('#adminToggle').evaluate(el=>getComputedStyle(el).touchAction),'manipulation');
    const adminButton = await page.locator('#adminToggle').boundingBox();
    await tapAt(adminButton.x+adminButton.width/2,adminButton.y+adminButton.height/2);
    await page.waitForTimeout(90);
    await tapAt(adminButton.x+adminButton.width/2,adminButton.y+adminButton.height/2);
    await settle();
    assert.equal(await page.evaluate(()=>visualViewport.scale),1,'Double-tapping Admin does not zoom the page');
    assert.equal(await level('#adminPanel'),'default','Second accidental tap does not toggle twice');
    const tabs = await page.locator('#adminTabs').boundingBox(), admin = await page.locator('#adminPanel').boundingBox();
    assert(Math.abs(tabs.y+tabs.height-(admin.y+admin.height-1))<1,'Admin tabs occupy the footer');
    for(const tab of ['overview','pins','reports','users']) {
      await page.locator(`[data-admin-tab="${tab}"]`).tap(); await settle();
      assert.equal(await level('#adminPanel'),'expanded',tab+' expands the sheet');
      await drag('#adminPanel',upperGap*.38); assert.equal(await level('#adminPanel'),'default');
      await page.locator(`[data-admin-tab="${tab}"]`).tap(); await settle();
      assert.equal(await level('#adminPanel'),'expanded','The active black tab also expands');
      await drag('#adminPanel',upperGap*.38);
    }
    await page.locator('#adminToggle').tap(); await settle(); assert.equal(await level('#adminPanel'),'peek');
    assert.equal(await page.locator('#adminHeading').textContent(),'Quản trị');
    assert.equal(await page.locator('#adminTabs').isVisible(),false);
    await page.screenshot({path:'/private/tmp/mememap-mobile-admin-peek.png'});
    await page.locator('#adminToggle').tap(); await settle(); assert.equal(await level('#adminPanel'),'default');
    await page.locator('[data-admin-tab="overview"]').tap(); await settle();
    await page.locator('#toggle').tap(); await settle(); assert.equal(await level('#panel'),'default','Menu restores its own default level');
    await page.locator('#adminToggle').tap(); await settle(); assert.equal(await level('#adminPanel'),'expanded','Admin independently restores its expanded level');
    await page.locator('#toggle').tap(); await settle();

    // Probe stacking at a position a selected fixed pin can occupy.
    const front = await page.evaluate(() => {
      const button=document.querySelector('#adminToggle'), pin=document.querySelector('.fixed-pending-pin');
      const old={left:pin.style.left,top:pin.style.top}, rect=button.getBoundingClientRect();
      pin.style.left=`${rect.x+rect.width/2-21}px`;pin.style.top=`${rect.y}px`;
      const hit=document.elementFromPoint(rect.x+rect.width/2,rect.y+20)?.closest('#adminToggle')?.id;
      Object.assign(pin.style,old);return hit;
    });
    assert.equal(front,'adminToggle','Screen button stays above fixed pin');
    for(const id of ['#profileButton','#topGuide','#toggle']) assert(await page.locator(id).evaluate(el=>{
      const pin=document.querySelector('.fixed-pending-pin'),old={left:pin.style.left,top:pin.style.top},box=el.getBoundingClientRect();
      pin.style.left=`${box.x+box.width/2-21}px`;pin.style.top=`${box.y+box.height/2-21}px`;
      const hit=el.contains(document.elementFromPoint(box.x+box.width/2,box.y+box.height/2));
      Object.assign(pin.style,old);return hit;
    }),'Screen controls win hit-testing over the fixed pin');

    await page.evaluate(() => {
      window.boardFrames=[];window.recordBoard=true;
      document.querySelector('#boardSwitchBtn').addEventListener('click',()=>window.boardStarted=performance.now(),{once:true});
      const record=()=>{const panel=document.querySelector('#panel'), board=document.querySelector('#leaderboard');
        boardFrames.push({time:performance.now(),height:panel.getBoundingClientRect().height,open:panel.classList.contains('board-open'),x:new DOMMatrixReadOnly(getComputedStyle(board).transform).m41});
        if(recordBoard)requestAnimationFrame(record);};requestAnimationFrame(record);
    });
    await page.locator('#boardSwitchBtn').tap(); await page.waitForTimeout(550);
    const timing = await page.evaluate(()=>{recordBoard=false;return {frames:boardFrames,started:boardStarted};});
    const first = timing.frames.find(frame=>frame.open), done = timing.frames.find(frame=>frame.open&&Math.abs(frame.x)<.5);
    assert(first&&done); assert(first.height<expandedHeight-20,'Subview starts while the sheet is still expanding');
    assert(first.time-timing.started<100,'Height and horizontal transitions start together');
    assert(done.time-timing.started>=240&&done.time-timing.started<400,'Opening restores the original approximately 280ms slide');
    await page.locator('#boardSwitchBtn').tap(); await settle(); assert.equal(await level('#panel'),'default','Board return remembers the main level');
    await drag('#panel',-upperGap*.38);
    await page.locator('#boardSwitchBtn').tap(); await page.waitForTimeout(280);
    await drag('#panel',upperGap*.38);
    await page.locator('#boardSwitchBtn').tap(); await settle(); assert.equal(await level('#panel'),'expanded','Board return restores its separate parent state');
    await drag('#panel',upperGap*.38);
    await page.locator('#boardSwitchBtn').tap(); await page.waitForTimeout(70);
    await page.locator('#adminToggle').tap(); await page.waitForTimeout(550);
    assert.equal(await page.locator('#panel').evaluate(el=>el.classList.contains('board-open')),true,'Immediate subview opening is retained while switching to a sibling');
    assert.equal(await level('#adminPanel'),'expanded','Admin retains its own height while a Menu subview opens');
    await page.locator('#toggle').tap(); await settle();
    assert.equal(await level('#panel'),'expanded','Menu restores its subview height');
    await page.locator('#boardSwitchBtn').tap(); await settle();
    assert.equal(await level('#panel'),'default','Sibling switching does not overwrite the subview parent memory');
    await page.locator('#toggle').tap(); await settle();
    await page.locator('#adminToggle').tap(); await settle();
    assert.equal(await level('#adminPanel'),'expanded','Closing Menu does not overwrite Admin memory');
    await page.locator('#toggle').tap(); await settle();
    assert.equal(await level('#panel'),'peek','Sibling memory includes the smallest drag level');
    await page.locator('#toggle').tap(); await settle();
    assert.equal(await level('#panel'),'default','Reopening the same closed view uses default');
    await page.locator('#adminToggle').tap(); await settle();

    await page.locator('#profileButton').tap(); await page.locator('#profileOverlay.open').waitFor();
    assert.equal(await page.locator('.profile-card').evaluate(el=>getComputedStyle(el).touchAction),'manipulation');
    const profile = await page.locator('#profileName').boundingBox();
    await tapAt(profile.x+profile.width/2,profile.y+profile.height/2); await page.waitForTimeout(90);
    await tapAt(profile.x+profile.width/2,profile.y+profile.height/2); await settle();
    assert.equal(await page.evaluate(()=>visualViewport.scale),1,'Popup double-tap keeps page scale');
    await page.locator('#profileClose').tap(); await settle();
    await drag('#adminPanel',upperGap*.38);
    assert.equal(await level('#adminPanel'),'default','Expose the map before testing its pinch gesture');
    await page.evaluate(()=>testMap.setZoom(16,{duration:0}));
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:140,y:350,id:0},{x:240,y:350,id:1}]});
    for(let step=1;step<=6;step++) {
      await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:140-step*10,y:350,id:0},{x:240+step*10,y:350,id:1}]});
      await page.waitForTimeout(20);
    }
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await settle();
    assert(await page.evaluate(()=>testMap.getZoom()>16.5),'Map pinch zoom still works');
    assert.equal(await page.evaluate(()=>visualViewport.scale),1,'Map pinch does not zoom the website');
    await page.setViewportSize({width:1280,height:850}); await settle();
    await page.locator('#toggle').click(); await settle();
    if (await page.locator('#adminPanel.closed').count()) { await page.locator('#adminToggle').click(); await settle(); }
    assert.equal(await page.locator('.panel:not(.closed)').count(),2,'Desktop drawers remain independent');
    assert.deepEqual(errors,[]);
    await cdp.detach();await context.close();
    console.log('Mobile levels passed: directional 1/3 thresholds, skip/default/peek, insets, footer tabs, sibling/subview memory, tap safety, stacking and simultaneous opening.');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exit(1);});
