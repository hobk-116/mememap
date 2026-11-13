/* Compose the map features. Business rules and region definitions come from the API. */
(async () => {
  const words = MemeMap.mapCopy;
  let lang = localStorage.getItem('mememap-language') === 'en' ? 'en' : 'vi';
  const tr = key => words[lang][key] || words.vi[key];
  const authRedirect = () => { location.href = '/?login=required'; };
  const api = MemeMap.createApiClient({onUnauthorized: authRedirect});
  const config = await api.request('/api/map-config');
  const maplibregl = await import('https://unpkg.com/maplibre-gl@6.13.0/dist/maplibre-gl.mjs');
  const stylesheet = document.querySelector('link[href$="/maplibre-gl.css"]');
  // Failed CORS stylesheet requests can leave an empty sheet object in Chromium.
  if (!stylesheet.sheet?.cssRules.length) await new Promise((resolve, reject) => {
    const finish = error => {
      clearTimeout(timeout);
      stylesheet.removeEventListener('load', loaded);
      stylesheet.removeEventListener('error', failed);
      error ? reject(error) : resolve();
    };
    const loaded = () => finish();
    const failed = () => finish(new Error('Map stylesheet unavailable'));
    const timeout = setTimeout(failed, 10000);
    stylesheet.addEventListener('load', loaded);
    stylesheet.addEventListener('error', failed);
  });
  MemeMap.maplibregl = maplibregl;
  // MapLibre's 512 px world tiles are twice Leaflet's 256 px tiles: z - 1 keeps the same scale.
  const defaultZoom = config.zoom - 1;
  const map = new maplibregl.Map({container: 'map', style: config.style,
    center: [config.center[1], config.center[0]], zoom: defaultZoom,
    minZoom: config.min_zoom - 1, maxZoom: config.max_zoom - 1,
    maxBounds: config.bounds.map(([lat, lng]) => [lng, lat]),
    renderWorldCopies: false, dragRotate: false, pitchWithRotate: false,
    touchPitch: false, attributionControl: false});
  map.touchZoomRotate.disableRotation();
  map.addControl(new maplibregl.AttributionControl({compact: false}), 'bottom-right');
  const zoomControl = new maplibregl.NavigationControl({showCompass: false});
  map.addControl(zoomControl, innerWidth <= 600 ? 'top-right' : 'bottom-right');
  const mapStatus = document.getElementById('mapStatus');
  let mapFailed = false;
  const showMapFailure = () => { mapFailed = true; mapStatus.hidden = false; mapStatus.textContent = tr('mapUnavailable'); };
  map.on('error', showMapFailure);
  map.getCanvas().addEventListener('webglcontextlost', showMapFailure);
  map.getCanvas().addEventListener('webglcontextrestored', () => {
    mapFailed = false; mapStatus.hidden = true;
  });
  map.on('load', () => { mapFailed = false; mapStatus.hidden = true; });
  let activePopup = null;
  MemeMap.createPinMarker = (location, content) => {
    const element = document.createElement('div');
    element.className = 'meme-map-marker';
    element.tabIndex = 0; element.setAttribute('role', 'button');
    element.innerHTML = '<span class="pin-emoji"><span>📍</span></span>';
    const popup = new maplibregl.Popup({maxWidth: '300px', offset: [0, -38], focusAfterOpen: false}).setHTML(content);
    element.setAttribute('aria-label', popup.getElement()?.querySelector('strong')?.textContent || tr('title'));
    popup.on('open', () => { if (activePopup !== popup) activePopup?.remove(); activePopup = popup; });
    popup.on('close', () => { if (activePopup === popup) activePopup = null; });
    const marker = new maplibregl.Marker({element, anchor: 'top-left', offset: [-20, -38], subpixelPositioning: true})
      .setLngLat(location).setPopup(popup).addTo(map);
    element.addEventListener('click', event => { event.stopPropagation(); marker.togglePopup(); });
    element.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); marker.togglePopup(); }
    });
    return marker;
  };
  const openPopup = marker => { if (marker && !marker.getPopup().isOpen()) marker.togglePopup(); };
  const panel = document.getElementById('panel');
  const adminPanel = document.getElementById('adminPanel');
  const adminToggle = document.getElementById('adminToggle');
  const profileButton = document.getElementById('profileButton');
  const modal = document.getElementById('modal');
  const quickGuide = document.getElementById('quickGuide');
  const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  let composer, adminDashboard, pins, profile, leaderboard;
  let adminPreview = null;
  const layout = MemeMap.createMapLayout({
    map, zoomControl,
    group: document.getElementById('drawerToggleGroup'),
    hint: document.getElementById('hint'),
    drawers: {
      menu: {panel, button: document.getElementById('toggle'), arrow: document.getElementById('toggleArrow'),
        label: document.getElementById('toggleLabel'), openLabel: 'showMenu', closeLabel: 'hideMenu'},
      admin: {panel: adminPanel, side: 'right', button: adminToggle, arrow: document.getElementById('adminToggleArrow'),
        openLabel: 'adminPanelOpen', closeLabel: 'adminPanelClose'},
    },
    isComposing: () => modal.classList.contains('open'),
    getSelected: () => composer?.selected,
    translate: tr,
    onPlacePin: latlng => composer.place(latlng),
    onSwitch: id => {
      if (id === 'admin') {
        quickGuide.classList.remove('open');
        adminDashboard.refresh();
      }
    },
  });
  const refreshDependents = () => {
    profile.refreshVisible();
    if (panel.classList.contains('board-open')) leaderboard.load();
  };
  profile = MemeMap.createMapProfile({api, tr, getLanguage: () => lang, onAccess: updateAdminAccess, authRedirect});
  leaderboard = MemeMap.createMapLeaderboard({api, tr, escapeHtml, onProfile: username => profile.open(username)});
  pins = MemeMap.createMapPins({map, defaultZoom, api, tr, escapeHtml, restrictionMessage,
    onSelected: () => {
      if (!layout.isMobile()) return;
      document.getElementById('search').blur();
      layout.applyAction('menu', 'pin', {animate: false});
    },
    onAccess: updateAdminAccess,
    onRefreshed: () => { layout.refresh(); profile.refreshVisible(); },
    onChanged: refreshDependents,
    onManage: pin => { layout.setOpen('admin', true); adminDashboard.openPin(pin); },
    onReport: id => adminDashboard.reportPin(id), onProfile: username => profile.open(username)});
  composer = MemeMap.createMapComposer({map, defaultZoom, layout, api, tr, restrictionMessage,
    onCreated: pin => pins.add(pin), onFocus: id => openPopup(pins.marker(id))});
  adminDashboard = MemeMap.createAdminDashboard({
    panel: adminPanel, apiClient: api,
    getLanguage: () => lang,
    onNavigate: action => {
      const mobile = layout.isMobile();
      if (mobile) layout.applyAction('admin', action);
      return mobile;
    },
    onChanged: async () => {
      adminPreview?.remove();
      adminPreview = null;
      await Promise.all([pins.refresh(), profile.load()]);
      profile.refreshVisible();
      if (panel.classList.contains('board-open')) await leaderboard.load();
    },
    onViewPin: pin => {
      adminPreview?.remove();
      adminPreview = null;
      layout.focus({lat: pin.lat, lng: pin.lng}, defaultZoom);
      const marker = pins.marker(pin.id);
      if (marker) openPopup(marker);
      else {
        const content = `<div class="pin-popup"><small>${escapeHtml(tr('hiddenPin'))}</small>${pin.image ? `<img class="popup-img" src="${escapeHtml(pin.image)}" alt="">` : ''}<strong>${escapeHtml(pin.title)}</strong><div class="popup-story">${escapeHtml(pin.story || '')}</div></div>`;
        adminPreview = MemeMap.createPinMarker([pin.lng, pin.lat], content);
        openPopup(adminPreview);
      }
    },
    onViewProfile: username => profile.open(username),
  });

  function updateAdminAccess(enabled) {
    adminToggle.hidden = !enabled;
    if (!enabled) {
      layout.setOpen('admin', false);
      adminPreview?.remove();
      adminPreview = null;
    }
    adminDashboard.setEnabled(enabled);
  }

  function restrictionMessage(data) {
    const message = tr(data.error === 'post_restricted' ? 'postRestricted' : 'voteRestricted');
    const until = Number(data.until);
    const date = until ? ` ${tr('restrictionUntil')} ${new Date(until * 1000).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')}` : '';
    return `${message}${date}.${data.reason ? ` ${tr('restrictionReason')}: ${data.reason}` : ''}`;
  }

  function applyLanguage() {
    document.documentElement.lang = lang;
    if (mapFailed) mapStatus.textContent = tr('mapUnavailable');
    document.querySelectorAll('[data-t]').forEach(el => { el.textContent = tr(el.dataset.t); });
    profile.render();
    adminDashboard.setLanguage();
    layout.refresh();
    updateBoardSwitchLabel();
    const languageButton = document.getElementById('lang');
    languageButton.textContent = lang === 'vi' ? '🇺🇸' : '🇻🇳';
    languageButton.setAttribute('aria-label', lang === 'vi' ? 'Switch to English' : 'Chuyển sang tiếng Việt');
    languageButton.title = languageButton.getAttribute('aria-label');
    profileButton.setAttribute('aria-label', lang === 'vi' ? 'Hồ sơ người dùng' : 'User profile');
    const avatarLabel = lang === 'vi' ? 'Đổi ảnh đại diện' : 'Change profile picture';
    document.getElementById('profileAvatarButton').setAttribute('aria-label', avatarLabel);
    document.getElementById('profileAvatarButton').title = avatarLabel;
    document.getElementById('search').placeholder = tr('search');
    document.getElementById('search').setAttribute('aria-label', tr('search'));
    document.getElementById('locate').title = tr('loc');
    document.getElementById('locate').setAttribute('aria-label', tr('loc'));
    document.getElementById('story').placeholder = tr('storyPlaceholder');
    pins.render();
    leaderboard.render();

  }

  function returnToMainMenu(restore = false) {
    panel.classList.remove('board-open');
    layout.setSubview('menu', null, {restore});
    updateBoardSwitchLabel();
  }
  function updateBoardSwitchLabel() {
    document.getElementById('boardSwitchBtn').textContent = panel.classList.contains('board-open')
      ? tr('boardBack') : tr('memerboard');
  }

  applyLanguage();
  pins.load(true);
  profile.load();
  if (sessionStorage.getItem('mememap-show-quick-guide') === '1') {
    sessionStorage.removeItem('mememap-show-quick-guide');
    requestAnimationFrame(() => quickGuide.classList.add('open'));
  }
  const refreshTimer = window.setInterval(() => {
    if (!document.hidden) { pins.load(); if (panel.classList.contains('board-open')) leaderboard.load(); }
  }, 10_000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) pins.load(); });
  window.addEventListener('pagehide', event => {
    if (!event.persisted) { clearInterval(refreshTimer); map.remove(); }
  });
  document.getElementById('lang').onclick = () => {
    lang = lang === 'vi' ? 'en' : 'vi';
    localStorage.setItem('mememap-language', lang);
    applyLanguage();
  };
  document.getElementById('toggle').onclick = () => layout.toggle('menu');
  adminToggle.onclick = () => layout.toggle('admin');
  document.getElementById('topGuide').onclick = () => { returnToMainMenu(); quickGuide.classList.add('open'); };
  document.getElementById('closeGuide').onclick = () => quickGuide.classList.remove('open');
  quickGuide.onclick = event => { if (event.target === quickGuide) quickGuide.classList.remove('open'); };
  document.getElementById('boardSwitchBtn').onclick = () => {
    if (panel.classList.contains('board-open')) returnToMainMenu(true);
    else {
      quickGuide.classList.remove('open');
      layout.setSubview('menu', 'leaderboard', {onReady: () => {
        panel.classList.add('board-open');
        updateBoardSwitchLabel();
        leaderboard.load();
      }});
    }
  };
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') { composer.close(); quickGuide.classList.remove('open'); profile.close(); returnToMainMenu(); }
  });
})().catch(error => {
  if (!MemeMap.isSessionError(error)) {
    const language = localStorage.getItem('mememap-language') === 'en' ? 'en' : 'vi';
    document.getElementById('error').textContent = MemeMap.mapCopy[language].pinError;
    document.getElementById('list').textContent = MemeMap.mapCopy[language].pinError;
    const status = document.getElementById('mapStatus');
    status.hidden = false; status.textContent = MemeMap.mapCopy[language].mapUnavailable;
    console.error('Map initialization failed:', error);
  }
});
