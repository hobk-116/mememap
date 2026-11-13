/* Shared mobile header geometry and continuous footer movement, using disposable data. */
const {chromium} = require('playwright');
const assert = require('node:assert/strict');

(async () => {
  const base = process.argv[2];
  if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(base || '')) throw new Error('Use a disposable fixture URL.');
  const browser = await chromium.launch({headless:true,
    ...(process.env.MEMEMAP_TEST_BROWSER ? {executablePath:process.env.MEMEMAP_TEST_BROWSER} : {})});
  try {
    for (const viewport of [{width:390,height:844},{width:360,height:740}]) {
      const context = await browser.newContext({viewport,isMobile:true,hasTouch:true});
      await context.route('https://tiles.openfreemap.org/**', route => route.fulfill({json:{
        version:8, sources:{fixture:{type:'geojson', data:{type:'FeatureCollection',features:[]},
          attribution:'OpenFreeMap © OpenMapTiles Data from OpenStreetMap'}},
        layers:[{id:'background',type:'background',paint:{'background-color':'#e7ebdf'}},
          {id:'fixture',type:'circle',source:'fixture'}],
      }}));
      assert.equal((await context.request.post(base+'/api/login',{data:{username:'browser_admin',password:'browser-test-123'}})).status(),200);
      const page = await context.newPage(), errors = [];
      page.on('pageerror',error=>errors.push(error.message));
      await page.goto(base+'/landing.html');
      await page.locator('#adminToggle:not([hidden])').waitFor();
      await page.locator('[data-open-pin="1"]').waitFor();
      if (viewport.width === 360) await page.locator('#lang').tap();
      const cdp = await context.newCDPSession(page), settle=()=>page.waitForTimeout(340);
      await settle();
      await page.evaluate(() => {
        window.sheetMetrics = id => {
          const panel=document.querySelector(id), box=panel.getBoundingClientRect(),
            title=panel.querySelector('h1').getBoundingClientRect(), eye=panel.querySelector('.eyebrow').getBoundingClientRect(),
            footer=panel.querySelector('.panel-switch,.admin-tabs'), foot=footer.getBoundingClientRect(), style=getComputedStyle(footer);
          const hint=document.querySelector('#hint').getBoundingClientRect(),
            attribution=document.querySelector('.maplibregl-ctrl-attrib').getBoundingClientRect();
          return {hintGap:box.top-hint.bottom, attributionHeight:attribution.height,
            attributionGap:box.top-attribution.bottom, height:box.height,title:title.top-box.top,eye:eye.top-box.top,
            footHeight:foot.height,translation:new DOMMatrixReadOnly(style.transform).m42,
            visibleFoot:Math.max(0,Math.min(box.bottom-1,foot.bottom)-Math.max(box.top+1,foot.top)),
            display:style.display,visibility:style.visibility,history:panel.querySelector('#adminHistory')?
              getComputedStyle(panel.querySelector('#adminHistory')).display:null};
        };
      });
      const metrics=id=>page.evaluate(id=>sheetMetrics(id),id);
      async function recordAction(id,action) {
        await page.evaluate(id=>{
          window.motionFrames=[];window.gapFrames=[];window.recordMotion=true;
          // Sample edge gaps after layout synchronization, before paint.
          window.motionObserver=new ResizeObserver(()=>gapFrames.push(sheetMetrics(id)));
          motionObserver.observe(document.querySelector(id));
          const frame=()=>{motionFrames.push(sheetMetrics(id));if(recordMotion)requestAnimationFrame(frame);};frame();
        },id);
        await action();await settle();
        const result=await page.evaluate(()=>{
          recordMotion=false;motionObserver.disconnect();return {frames:motionFrames,gaps:gapFrames};
        });
        assert(result.gaps.length>2, 'Samples cover the sheet motion');
        for(const m of result.gaps) {
          assert(Math.abs(m.hintGap-m.attributionHeight-16)<1.5, `Hint follows the visible sheet edge: ${JSON.stringify(m)}`);
          assert(Math.abs(m.attributionGap-4)<1.5, `Attribution follows the visible sheet edge: ${JSON.stringify(m)}`);
        }
        return result.frames;
      }
      function verify(frames,normal,peek) {
        for (const m of frames) {
          assert(Math.abs(m.title-normal.title)<.6,'Heading spacing remains stable throughout motion');
          assert(Math.abs(m.eye-normal.eye)<.6,'Eyebrow spacing remains stable throughout motion');
          assert(m.display!=='none','Footer remains laid out throughout motion');
          const progress=Math.max(0,Math.min(1,(230-m.height)/(230-peek.height)));
          assert(Math.abs(m.translation-progress*(m.footHeight+2))<1.5,'Footer follows sheet height continuously');
          if(m.visibleFoot>3) assert.equal(m.visibility,'visible','Footer does not vanish before leaving the sheet');
          if(m.history!==null) assert.notEqual(m.history,'none','History button stays in the header');
        }
      }
      let menuHeader;
      for (const [id,toggle] of [['#panel','#toggle'],['#adminPanel','#adminToggle']]) {
        if(id==='#adminPanel'){await page.locator(toggle).tap();await settle();}
        const normal=await metrics(id);
        if(id==='#panel') menuHeader=normal;
        else {
          assert(Math.abs(normal.title-menuHeader.title)<.6,'Menu and Admin use the same title spacing');
          assert(Math.abs(normal.eye-menuHeader.eye)<.6,'Menu and Admin use the same eyebrow spacing');
        }
        const closing=await recordAction(id,()=>page.locator(toggle).tap());
        const peek=await metrics(id);verify(closing,normal,peek);
        assert(peek.visibleFoot<1,'Footer exits the clipped sheet at peek');
        assert.equal(await page.locator(id+' .panel-switch,'+id+' .admin-tabs').evaluate(el=>el.inert),true);
        if(viewport.width===390) await page.screenshot({path:`/private/tmp/mememap-${id==='#panel'?'menu':'admin'}-aligned-peek.png`});
        const opening=await recordAction(id,()=>page.locator(toggle).tap());verify(opening,normal,peek);
        for(const [steps,delay,amount] of [[6,24,.5],[2,0,1.1]]) {
          const box=await page.locator(id).boundingBox(), x=box.x+box.width/2,y=box.y+12;
          const frames=await recordAction(id,async()=>{
            await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
            for(let n=1;n<=steps;n++){
              await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y+(230-peek.height)*amount*n/steps}]});
              if(delay) await page.waitForTimeout(delay);
              if(viewport.width===390&&n===Math.ceil(steps/2)&&delay)
                await page.screenshot({path:`/private/tmp/mememap-${id==='#panel'?'menu':'admin'}-footer-moving.png`});
            }
            await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
          });
          verify(frames,normal,peek);
          assert.equal(await page.locator(id).getAttribute('data-sheet-level'),'peek');
          await page.locator(toggle).tap();await settle();
        }
      }
      await page.locator('#toggle').tap();await settle();
      for (let n=0;n<2;n++) {
        await recordAction('#panel',()=>page.locator('#boardSwitchBtn').tap());
      }
      await page.locator('#adminToggle').tap();await settle();
      await page.locator('#adminHistory').tap();await settle();
      assert.equal(await page.locator('#adminPanel').getAttribute('data-sheet-level'),'expanded','History opens from peek');
      assert.equal(await page.locator('#adminHeading').textContent(),viewport.width===390?'Lịch sử quản trị':'Admin history');
      await page.locator('#adminHistory').tap();await settle();
      await page.setViewportSize({width:1280,height:850});await settle();
      await page.locator('#toggle').click();await settle();
      assert.equal(await page.locator('.panel:not(.closed)').count(),2,'Desktop drawers remain independent');
      assert.equal(await page.locator('#adminTabs').evaluate(el=>getComputedStyle(el).position),'static','Desktop tabs retain normal flow');
      if(viewport.width===390) await page.screenshot({path:'/private/tmp/mememap-sheet-desktop.png'});
      assert.deepEqual(errors,[]);
      await cdp.detach();await context.close();
    }
    console.log('Sheet motion passed: shared header spacing, slow/fast drags, continuous clipped footers, visible history, VI/EN and desktop layout.');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
