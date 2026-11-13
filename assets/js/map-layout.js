/* Drawer state, pointer dragging, fixed pin/map alignment and temporary selection pin. */
(() => {
  function createMapLayout({map, zoomControl, drawers, group, hint, isComposing, getSelected, translate, onSwitch, onPlacePin}) {
    const breakpoint = 600;
    const sheetRules = Object.freeze({defaultHeight:230, expandedRatio:.76, maximumHeight:640,
      inset:8, peekInset:16, snapFraction:1/3, duration:250,
      actions:Object.freeze({open:'default', close:'peek', adminTab:'expanded', search:'expanded', filter:'expanded', pin:'default'})});
    const duration = sheetRules.duration;
    const openDrawers = new Set(['menu']);
    const rightButton = Object.values(drawers).find(drawer => drawer.side === 'right')?.button;
    let mobile = innerWidth <= breakpoint;
    let sheetSize = sheetRules.defaultHeight;
    let sheetLevel = 'default';
    let activeMobileDrawer = 'menu';
    let point;
    let anchor;
    let frame = 0;
    let resizeFrame = 0;
    let moving = false;
    let drag = null;
    let selectionKind = null;
    let interactivePin = null;
    let resolveAlignment = null;
    const subviews = new Map();
    const drawerLevels = new Map(Object.keys(drawers).map(id => [id, 'default']));
    let suppressClick = false;
    let keyboardSession = false;
    let viewportWidth = innerWidth;
    let layoutHeight = window.visualViewport?.height || innerHeight;
    const viewportHeight = () => layoutHeight;
    const syncViewportHeight = () => document.documentElement.style.setProperty('--app-viewport-height', `${viewportHeight()}px`);
    syncViewportHeight();
    const fixedPinAvailable = () => mobile || Boolean(openDrawers.size);
    // A screen overlay inside the map's stacking context, between markers and popups.
    const fixedPane = document.createElement('div');
    fixedPane.className = 'fixed-placement-layer';
    map.getContainer().append(fixedPane);
    const pin = document.createElement('button');
    pin.type = 'button';
    pin.className = 'fixed-pending-pin';
    pin.textContent = '＋';
    for (const type of ['mousedown', 'dblclick', 'touchstart']) {
      pin.addEventListener(type, event => event.stopPropagation());
    }
    pin.addEventListener('click', event => {
      event.stopPropagation();
      if (!fixedPinAvailable() || !point || isComposing()) return;
      onPlacePin?.(map.unproject(point));
    });
    fixedPane.append(pin);

    const maximum = () => Math.min(viewportHeight() * sheetRules.expandedRatio, sheetRules.maximumHeight);
    const defaultHeight = () => Math.min(sheetRules.defaultHeight, maximum());
    function minimum(id = activeMobileDrawer) {
      const head = drawers[id].panel.querySelector('.panel-head');
      const title = head.querySelector('h1');
      const headStyle = getComputedStyle(head), titleStyle = getComputedStyle(title);
      return Math.min(defaultHeight(), Math.ceil(parseFloat(headStyle.paddingTop) + parseFloat(headStyle.paddingBottom) +
        head.querySelector('.eyebrow').offsetHeight + title.offsetHeight +
        parseFloat(titleStyle.marginTop) + parseFloat(titleStyle.marginBottom) + 2));
    }
    const levelHeights = () => ({peek:minimum(), default:defaultHeight(), expanded:maximum()});
    const clampHeight = value => Math.max(minimum(), Math.min(maximum(), value));
    const sheetInset = () => sheetRules.inset + (sheetRules.peekInset - sheetRules.inset) *
      Math.max(0, Math.min(1, (defaultHeight() - sheetSize) / Math.max(1, defaultHeight() - minimum())));
    const copyAnchor = () => anchor && {lat: anchor.lat, lng: anchor.lng};

    function stopAlignment() {
      cancelAnimationFrame(frame);
      frame = 0;
      resolveAlignment?.(false);
      resolveAlignment = null;
    }

    function syncInteractivePin() {
      const selected = getSelected();
      if (fixedPinAvailable() || selectionKind !== 'interactive' || !selected) {
        interactivePin?.remove();
        return;
      }
      if (!interactivePin) {
        const element = document.createElement('div');
        element.className = 'interactive-pending-marker';
        element.innerHTML = '<span class="interactive-pending-pin" aria-hidden="true">＋</span>';
        interactivePin = new MemeMap.maplibregl.Marker({element, anchor: 'top-left', offset: [-21, -40],
          subpixelPositioning: true});
      }
      interactivePin.setLngLat(selected).addTo(map);
    }

    function selectLocation(latlng) {
      selectionKind = fixedPinAvailable() ? 'fixed' : 'interactive';
      syncInteractivePin();
      // Closed-drawer selection keeps the fixed pin and its layout anchor intact.
      if (selectionKind === 'interactive') return;
      stopAlignment();
      anchor = latlng;
      placePin(map.project(latlng), true);
    }

    function resetSelection() {
      const wasInteractive = selectionKind === 'interactive';
      selectionKind = null;
      interactivePin?.remove();
      if (wasInteractive) return;
      placePin(geometry().point, true);
      anchor = map.unproject(point);
    }

    function geometry() {
      const container = map.getContainer();
      const size = {x: container.clientWidth, y: container.clientHeight};
      const center = {x: size.x / 2, y: size.y / 2};
      const top = mobile ? 74 : 94;
      let left = mobile ? 8 : 14;
      let adminRight = mobile ? 8 : 14;
      let hintBottom = 20;
      let visibleLeft = 0;
      let visibleRight = size.x;
      if (mobile) {
        const visibleSheetSize = Math.min(sheetSize, maximum());
        hintBottom = sheetInset() + visibleSheetSize + 16 +
          (map.getContainer().querySelector('.maplibregl-ctrl-attrib')?.offsetHeight || 0);
        center.y = Math.max(0, (size.y - sheetInset() - visibleSheetSize) / 2);
      } else {
        for (const id of openDrawers) {
          const drawer = drawers[id];
          const occupied = Math.min(size.x, 14 + drawer.panel.offsetWidth);
          if (drawer.side === 'right') {
            visibleRight = Math.min(visibleRight, size.x - occupied);
            adminRight = occupied + 11;
          } else {
            visibleLeft = Math.max(visibleLeft, occupied);
            left = occupied + 11;
          }
        }
        center.x = (visibleLeft + visibleRight) / 2;
      }
      return {point: center, top, left, adminRight, hintBottom, hintLeft: center.x,
        hintWidth: Math.max(42, visibleRight - visibleLeft - 24)};
    }

    function placePin(next, animate = false) {
      point = {...next};
      pin.style.transition = animate ? 'left .25s ease, top .25s ease, opacity .25s ease' : 'opacity .25s ease';
      pin.style.left = `${point.x - 21}px`;
      pin.style.top = `${point.y - 40}px`;
    }

    function placeGroup(target) {
      group.style.top = `${target.top}px`;
      group.style.left = `${target.left}px`;
      group.style.right = 'auto';
      if (rightButton) {
        rightButton.style.top = `${target.top}px`;
        rightButton.style.right = `${target.adminRight}px`;
      }
      const attributionHeight = map.getContainer().querySelector('.maplibregl-ctrl-attrib')?.offsetHeight || 0;
      if (mobile) {
        // Follow the rendered edge, including CSS transitions and interrupted drags.
        const mapBox = map.getContainer().getBoundingClientRect();
        const sheetBox = drawers[activeMobileDrawer].panel.getBoundingClientRect();
        target = {...target, hintBottom: mapBox.bottom - sheetBox.top + 16 + attributionHeight};
      }
      map.getContainer().style.setProperty('--map-attribution-bottom', `${mobile ? Math.max(0, target.hintBottom-attributionHeight-12) : 0}px`);
      map.getContainer().style.setProperty('--map-attribution-right', `${mobile ? 8 : Math.max(0, target.adminRight-14)}px`);
      map.getContainer().style.setProperty('--map-attribution-width', `${target.hintWidth}px`);
      hint.style.bottom = `${target.hintBottom}px`;
      hint.style.left = `${target.hintLeft}px`;
      hint.style.maxWidth = `${target.hintWidth}px`;
    }

    function placeMap(next, fixedAnchor) {
      moving = true;
      placePin(next);
      if (fixedAnchor) {
        // Compute from an absolute anchor, never accumulated rounded pan deltas.
        const container = map.getContainer();
        map.easeTo({center: fixedAnchor, offset: [next.x - container.clientWidth / 2,
          next.y - container.clientHeight / 2], duration: 0});
      }
      moving = false;
    }

    function align(animate = true, fixedAnchor = copyAnchor(), animationDuration = duration) {
      stopAlignment();
      map.stop();
      const target = geometry();
      if (isComposing() && selectionKind !== 'interactive') {
        placeGroup(target);
        const selected = getSelected();
        if (selected) placePin(map.project(selected));
        return Promise.resolve(true);
      }
      if (!animate || !point) {
        placeGroup(target);
        placeMap(target.point, fixedAnchor);
        anchor = map.unproject(point);
        return Promise.resolve(true);
      }
      const start = {...point};
      const startTop = parseFloat(group.style.top) || target.top;
      const startLeft = parseFloat(group.style.left) || target.left;
      const startAdminRight = parseFloat(rightButton?.style.right) || target.adminRight;
      const startBottom = parseFloat(hint.style.bottom) || target.hintBottom;
      const startHintLeft = parseFloat(hint.style.left) || target.hintLeft;
      const startHintWidth = parseFloat(hint.style.maxWidth) || target.hintWidth;
      const started = performance.now();
      const tick = now => {
        const progress = Math.min(1, (now - started) / animationDuration);
        const eased = 1 - Math.pow(1 - progress, 3);
        placeGroup({top: startTop + (target.top - startTop) * eased,
          left: startLeft + (target.left - startLeft) * eased,
          adminRight: startAdminRight + (target.adminRight - startAdminRight) * eased,
          hintBottom: startBottom + (target.hintBottom - startBottom) * eased,
          hintLeft: startHintLeft + (target.hintLeft - startHintLeft) * eased,
          hintWidth: startHintWidth + (target.hintWidth - startHintWidth) * eased});
        placeMap({x: start.x + (target.point.x - start.x) * eased,
          y: start.y + (target.point.y - start.y) * eased}, fixedAnchor);
        if (progress < 1) frame = requestAnimationFrame(tick);
        else {
          frame = 0;
          anchor = map.unproject(point);
          resolveAlignment?.(true);
          resolveAlignment = null;
        }
      };
      const completion = new Promise(resolve => { resolveAlignment = resolve; });
      frame = requestAnimationFrame(tick);
      return completion;
    }

    function render() {
      const rightOpen = [...openDrawers].some(id => drawers[id].side === 'right');
      const leftOpen = [...openDrawers].some(id => drawers[id].side !== 'right');
      document.body.classList.toggle('drawer-open', Boolean(openDrawers.size));
      document.body.classList.toggle('drawer-right-open', rightOpen);
      document.body.classList.toggle('drawer-both-open', leftOpen && rightOpen);
      pin.disabled = !fixedPinAvailable();
      pin.tabIndex = fixedPinAvailable() ? 0 : -1;
      pin.setAttribute('aria-label', translate('addPin'));
      pin.title = translate('addPin');
      if (selectionKind && getSelected()) selectionKind = fixedPinAvailable() ? 'fixed' : 'interactive';
      syncInteractivePin();
      for (const [id, drawer] of Object.entries(drawers)) {
        const open = openDrawers.has(id);
        const side = drawer.side || 'left';
        drawer.panel.dataset.drawerSide = side;
        const visible = mobile ? id === activeMobileDrawer : open;
        const peek = mobile && visible && sheetLevel === 'peek' && !drag;
        const previousLevel = drawer.panel.dataset.sheetLevel;
        drawer.panel.classList.toggle('closed', !visible);
        drawer.panel.classList.toggle('mobile-peek', peek);
        drawer.panel.classList.toggle('mobile-short', mobile && sheetSize < defaultHeight() - 1);
        drawer.panel.classList.toggle('mobile-collapsed', mobile && sheetLevel === 'default');
        drawer.panel.classList.toggle('mobile-expanded', mobile && sheetLevel === 'expanded');
        drawer.panel.dataset.sheetLevel = mobile ? (drag ? 'dragging' : sheetLevel) : 'desktop';
        drawer.panel.style.height = mobile ? `${Math.min(sheetSize, maximum())}px` : '';
        drawer.panel.style.bottom = mobile ? `${sheetInset()}px` : '';
        drawer.panel.style.left = mobile ? `${sheetInset()}px` : '';
        drawer.panel.style.right = mobile ? `${sheetInset()}px` : '';
        drawer.panel.style.setProperty('--sheet-collapse', mobile ?
          String(Math.max(0, Math.min(1, (defaultHeight()-sheetSize) / Math.max(1, defaultHeight()-minimum())))) : '0');
        for (const content of drawer.panel.querySelectorAll('.tools,.list-head,.list,.admin-body,.admin-notice,.panel-switch,.admin-tabs')) {
          content.inert = mobile && (peek || !visible);
        }
        if (previousLevel !== drawer.panel.dataset.sheetLevel) drawer.panel.dispatchEvent(new CustomEvent('sheetlevelchange'));
        drawer.panel.style.setProperty('--drawer-bottom', '8px');
        drawer.button.classList.toggle('panel-open', open);
        drawer.button.setAttribute('aria-expanded', String(open));
        drawer.button.setAttribute('aria-label', translate(open ? drawer.closeLabel : drawer.openLabel));
        drawer.arrow.textContent = mobile ? (open ? '↓' : '↑')
          : side === 'right' ? (open ? '→' : '←') : (open ? '←' : '→');
        if (drawer.label) {
          drawer.label.textContent = translate('menu');
          drawer.label.style.display = 'inline';
        }
      }
    }

    function setOpen(id, open) {
      if (!drawers[id] || (open && drawers[id].button.hidden)) return;
      const hiddenActive = mobile && activeMobileDrawer === id && drawers[id].button.hidden;
      if (openDrawers.has(id) === open && !hiddenActive) return;
      finishDrag();
      const fixedAnchor = copyAnchor();
      if (mobile) {
        const previousDrawer = activeMobileDrawer;
        const next = hiddenActive ? 'menu' : id;
        const switching = next !== activeMobileDrawer;
        if (switching) drawerLevels.set(activeMobileDrawer, sheetLevel);
        activeMobileDrawer = next;
        sheetLevel = switching ? drawerLevels.get(next) : sheetRules.actions[open ? 'open' : 'close'];
        if (!switching && subviews.has(id)) subviews.get(id).returnLevel = 'default';
        openDrawers.clear();
        if (sheetLevel !== 'peek') openDrawers.add(next);
        sheetSize = levelHeights()[sheetLevel];
        drawers[activeMobileDrawer].panel.style.setProperty('--sheet-duration', `${duration}ms`);
        if (!open || switching) drawers[previousDrawer].panel.querySelector('input:focus,select:focus,textarea:focus')?.blur();
        if (openDrawers.has(next)) onSwitch?.(next);
        render();
        return align(true, fixedAnchor);
      }
      if (open) openDrawers.add(id);
      else openDrawers.delete(id);
      if (open) onSwitch?.(id);
      render();
      align(true, fixedAnchor);
    }

    function setLevel(id, level, {animate = true, animationDuration = duration} = {}) {
      if (!mobile || id !== activeMobileDrawer) return Promise.resolve(true);
      finishDrag();
      const height = levelHeights()[level];
      if (height === undefined) return Promise.resolve(false);
      const wasOpen = openDrawers.has(id);
      if (level === 'peek') openDrawers.clear();
      else { openDrawers.clear(); openDrawers.add(id); }
      if (!wasOpen && level !== 'peek') onSwitch?.(id);
      if (sheetLevel === level && Math.abs(sheetSize - height) < 1) return Promise.resolve(true);
      const fixedAnchor = copyAnchor();
      const panel = drawers[id].panel;
      // Focus must see the expanded input position before the browser opens its keyboard.
      if (!animate) panel.classList.add('instant-resize');
      panel.style.setProperty('--sheet-duration', `${animationDuration}ms`);
      sheetLevel = level;
      sheetSize = height;
      render();
      const completion = align(animate, fixedAnchor, animationDuration);
      if (!animate) {
        panel.getBoundingClientRect();
        requestAnimationFrame(() => panel.classList.remove('instant-resize'));
      }
      return completion;
    }

    function applyAction(id, action, options = {}) {
      if (!mobile || !sheetRules.actions[action]) return Promise.resolve(true);
      return setLevel(id, sheetRules.actions[action], options);
    }

    const setExpanded = (id, expanded, options) => applyAction(id, expanded ? 'search' : 'pin', options);

    function setSubview(id, view, {onReady, restore = true} = {}) {
      if (!drawers[id]) return;
      const previous = subviews.get(id);
      if (view) {
        if (previous?.view === view) return;
        subviews.set(id, {view, returnLevel:sheetLevel});
        const completion = setLevel(id, 'expanded');
        // Start the horizontal slide with the height transition; CSS keeps its original 280 ms speed.
        onReady?.();
        return completion;
      } else if (previous) {
        subviews.delete(id);
        return setLevel(id, restore ? previous.returnLevel : 'default');
      }
    }

    const inputSelector = '.tools input, .admin-filters input, .admin-filters select, .leaderboard-filter select';
    function prepareInput(id, event) {
      if (!mobile || !openDrawers.has(id) || !event.target.matches(inputSelector)) return;
      keyboardSession = true;
      applyAction(id, 'search', {animate: false});
    }

    function finishDrag(event) {
      if (!drag || (event && event.pointerId !== drag.pointerId)) return;
      if (event?.type === 'lostpointercapture' && event.target !== drag.panel) return;
      const finished = drag;
      drag = null;
      finished.panel.classList.remove('dragging');
      if (finished.panel.hasPointerCapture(finished.pointerId)) finished.panel.releasePointerCapture(finished.pointerId);
      if (!finished.moved) return;
      suppressClick = true;
      const levels = ['peek','default','expanded'], heights = levelHeights();
      let index = levels.indexOf(finished.startLevel);
      const direction = sheetSize >= finished.startHeight ? 1 : -1;
      for (let next = index + direction; next >= 0 && next < levels.length; next += direction) {
        const from = heights[levels[next - direction]], to = heights[levels[next]];
        const threshold = from + (to - from) * sheetRules.snapFraction;
        if (direction > 0 ? sheetSize < threshold : sheetSize > threshold) break;
        index = next;
      }
      sheetLevel = levels[index];
      sheetSize = heights[sheetLevel];
      if (sheetLevel === 'peek') openDrawers.clear();
      else openDrawers.add(activeMobileDrawer);
      if (sheetLevel !== 'peek' && finished.startLevel === 'peek') onSwitch?.(activeMobileDrawer);
      finished.panel.style.setProperty('--sheet-duration', `${duration}ms`);
      render();
      align(true, finished.anchor);
    }

    const sheetObserver = new ResizeObserver(() => {
      if (mobile) placeGroup(geometry());
    });
    for (const [id, drawer] of Object.entries(drawers)) {
      sheetObserver.observe(drawer.panel);
      const footer = drawer.panel.querySelector('.panel-switch,.admin-tabs');
      if (footer) {
        const observer = new ResizeObserver(() => {
          drawer.panel.style.setProperty('--sheet-footer-height', `${footer.offsetHeight}px`);
        });
        observer.observe(footer);
      }
      drawer.panel.addEventListener('focusin', event => prepareInput(id, event));
      drawer.panel.addEventListener('input', event => prepareInput(id, event), true);
      drawer.panel.addEventListener('change', event => {
        if (event.target.matches(inputSelector)) applyAction(id, 'filter');
      }, true);
      drawer.panel.addEventListener('click', event => {
        if (!suppressClick) return;
        suppressClick = false;
        event.preventDefault();
        event.stopPropagation();
      }, true);
      drawer.panel.addEventListener('pointerdown', event => {
        suppressClick = false;
        if (!mobile || drawer.panel.classList.contains('closed') || !event.isPrimary || event.button !== 0) return;
        const panelTop = drawer.panel.getBoundingClientRect().top;
        const handle = drawer.panel.querySelector(id === 'admin' ? '.admin-filters' :
          drawer.panel.classList.contains('board-open') ? '.leaderboard-filter' : '.panel-head');
        const headBottom = drawer.panel.querySelector('.panel-head')?.getBoundingClientRect().bottom || panelTop + 25;
        const handleBottom = Math.max(panelTop + 25, headBottom, handle?.getBoundingClientRect().bottom || 0);
        if (sheetLevel !== 'peek' && (event.clientY > handleBottom || event.target.closest('.panel-switch,.admin-tabs'))) return;
        stopAlignment();
        map.stop();
        drag = {panel: drawer.panel, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY,
          threshold: event.target.closest('button,input,select,summary,a') ? 8 : 4,
          startHeight: drawer.panel.getBoundingClientRect().height, startLevel:sheetLevel, anchor: copyAnchor(), moved: false};
      });
    }

    // Observe the first movement even when it leaves the narrow handle before capture.
    document.addEventListener('pointermove', event => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      const delta = drag.startY - event.clientY;
      if (!drag.moved && (Math.abs(delta) < drag.threshold || Math.abs(delta) < Math.abs(event.clientX - drag.startX))) return;
      event.preventDefault();
      if (!drag.moved) {
        drag.panel.setPointerCapture(event.pointerId);
        if (drag.startLevel === 'peek') openDrawers.add(activeMobileDrawer);
      }
      drag.moved = true;
      drag.panel.classList.add('dragging');
      sheetSize = clampHeight(drag.startHeight + delta);
      render();
      align(false, drag.anchor);
    }, {capture:true, passive:false});
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      document.addEventListener(event, finishDrag, true);
    }

    const onMapMove = () => {
      if (moving || frame) return;
      if (isComposing() && selectionKind !== 'interactive' && getSelected()) placePin(map.project(getSelected()));
      else if (point) anchor = map.unproject(point);
    };
    map.on('move', onMapMove);
    map.on('zoomend', onMapMove);
    function handleViewportResize() {
      const nextHeight = window.visualViewport?.height || innerHeight;
      const inputFocused = document.activeElement?.matches(inputSelector);
      // Keep the page and footer behind the keyboard, including its closing animation.
      // Width changes still update layout for rotation and the mobile breakpoint.
      if (mobile && keyboardSession && innerWidth === viewportWidth &&
        (inputFocused || nextHeight < layoutHeight - 120)) return;
      keyboardSession = false;
      if (innerWidth === viewportWidth && Math.abs(nextHeight-layoutHeight) < 1) return;
      viewportWidth = innerWidth;
      layoutHeight = nextHeight;
      syncViewportHeight();
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        finishDrag();
        const fixedAnchor = copyAnchor();
        const nextMobile = innerWidth <= breakpoint;
        if (nextMobile !== mobile) {
          mobile = nextMobile;
          if (mobile && openDrawers.size > 1) {
            const active = [...openDrawers].pop();
            openDrawers.clear();
            openDrawers.add(active);
            activeMobileDrawer = active;
          }
          if (mobile && openDrawers.size) activeMobileDrawer = [...openDrawers].pop();
          sheetLevel = openDrawers.size ? 'default' : 'peek';
          sheetSize = levelHeights()[sheetLevel];
          map.removeControl(zoomControl);
          map.addControl(zoomControl, mobile ? 'top-right' : 'bottom-right');
        } else if (mobile) sheetSize = levelHeights()[sheetLevel];
        moving = true;
        map.resize();
        moving = false;
        render();
        align(false, fixedAnchor);
      });
    }
    window.addEventListener('resize', handleViewportResize);
    window.visualViewport?.addEventListener('resize', handleViewportResize);
    document.addEventListener('focusout', () => requestAnimationFrame(handleViewportResize));
    render();
    align(false, null);
    return {
      setOpen,
      applyAction,
      setExpanded,
      setSubview,
      toggle: id => setOpen(id, !openDrawers.has(id)),
      refresh: () => { render(); placeGroup(geometry()); },
      center: () => map.unproject(geometry().point),
      focus: (latlng, zoom = map.getZoom()) => {
        stopAlignment();
        map.stop();
        const target = geometry().point;
        const container = map.getContainer();
        map.easeTo({center: latlng, zoom, offset: [target.x - container.clientWidth / 2,
          target.y - container.clientHeight / 2], duration: 0});
      },
      select: selectLocation,
      reset: resetSelection,
      isMobile: () => mobile,
      isOpen: id => openDrawers.has(id),
    };
  }
  window.MemeMap.createMapLayout = createMapLayout;
})();
