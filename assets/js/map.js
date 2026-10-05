/* Compose the map features. Business rules and region definitions come from the API. */
(async () => {
  const words = MemeMap.mapCopy;
  let lang = localStorage.getItem('mememap-language') === 'en' ? 'en' : 'vi';
  const tr = key => words[lang][key] || words.vi[key];
  const authRedirect = () => { location.href = '/?login=required'; };
  const api = MemeMap.createApiClient({onUnauthorized: authRedirect});
  const config = await api.request('/api/map-config');
  const map = L.map('map', {zoomControl: false, minZoom: config.min_zoom, inertia: true,
    inertiaDeceleration: 5000, inertiaMaxSpeed: 1600, easeLinearity: 0.25,
    maxBounds: L.latLngBounds(config.bounds), maxBoundsViscosity: 1}).setView(config.center, config.zoom);
  const zoomControl = L.control.zoom({position: innerWidth <= 600 ? 'topright' : 'bottomright'}).addTo(map);
  L.tileLayer(config.tiles.url, {maxZoom: config.max_zoom, attribution: config.tiles.attribution}).addTo(map);
  const pinIcon = L.divIcon({className: '', html: '<span class="pin-emoji"><span>📍</span></span>', iconSize: [40, 40], iconAnchor: [20, 38]});
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
  pins = MemeMap.createMapPins({map, defaultZoom: config.zoom, pinIcon, api, tr, escapeHtml, restrictionMessage,
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
  composer = MemeMap.createMapComposer({map, layout, api, tr, restrictionMessage,
    onCreated: pin => pins.add(pin), onFocus: id => pins.marker(id)?.openPopup()});
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
      layout.focus(L.latLng(pin.lat, pin.lng), 18);
      const marker = pins.marker(pin.id);
      if (marker) marker.openPopup();
      else {
        const content = `<div class="pin-popup"><small>${escapeHtml(tr('hiddenPin'))}</small>${pin.image ? `<img class="popup-img" src="${escapeHtml(pin.image)}" alt="">` : ''}<strong>${escapeHtml(pin.title)}</strong><div class="popup-story">${escapeHtml(pin.story || '')}</div></div>`;
        adminPreview = L.marker([pin.lat, pin.lng], {icon: pinIcon}).bindPopup(content).addTo(map).openPopup();
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
  window.setInterval(() => {
    if (!document.hidden) { pins.load(); if (panel.classList.contains('board-open')) leaderboard.load(); }
  }, 10_000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) pins.load(); });
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
    console.error('Map initialization failed:', error);
  }
});
