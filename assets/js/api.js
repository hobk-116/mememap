/* Frontend-only showcase data layer. All state lives in this browser tab. */
(() => {
  class ApiError extends Error { constructor(code, status = 0, data = {}) { super(code); this.name = 'ApiError'; this.code = code; this.status = status; this.data = data; } }
  const KEY = 'mememap-showcase-state';
  const seedPins = [
    {id: 1, lat: 21.0285, lng: 105.8542, title: 'Trà đá cứu deadline', story: 'Một chiếc bàn quen thuộc cho những ngày chạy bài.', username: 'linh', aura: 8, viewer_vote: 0, is_owner: false, can_delete: false, created_at: Date.now() - 86400000},
    {id: 2, lat: 21.0169, lng: 105.8347, title: 'Hồ Tây chiều gió', story: 'Một góc đẹp cho những buổi chiều Hà Nội.', username: 'minh', aura: 5, viewer_vote: 0, is_owner: false, can_delete: false, created_at: Date.now() - 43200000},
    {id: 3, lat: 21.0041, lng: 105.8431, title: 'Bài hát trong ngõ', story: 'Một câu chuyện nhỏ quanh khu phố cũ.', username: 'an', aura: 3, viewer_vote: 0, is_owner: false, can_delete: false, created_at: Date.now() - 18000000}
  ];
  const initial = () => ({user: {id: 1, name: 'Showcase visitor', username: 'visitor', avatar: '/assets/default-profile-picture.webp', meme_count: 0, aura: 0, is_admin: false}, pins: seedPins, nextId: 4});
  let state; try { state = JSON.parse(sessionStorage.getItem(KEY)) || initial(); } catch { state = initial(); }
  const save = () => sessionStorage.setItem(KEY, JSON.stringify(state));
  const clone = value => JSON.parse(JSON.stringify(value));
  const profile = username => { const pins = state.pins.filter(pin => pin.username.toLowerCase() === username.toLowerCase()); return {name: username === state.user.username ? state.user.name : username, username, avatar: state.user.avatar, meme_count: pins.length, aura: pins.reduce((sum, pin) => sum + pin.aura, 0), is_self: username === state.user.username}; };
  async function request(path, options = {}) {
    const method = options.method || 'GET', body = options.json || {};
    if (path === '/api/me') return {authenticated: true, user: clone(state.user)};
    if (path === '/api/map-config') return {bounds: [[20.09, 104.83], [21.89, 106.76]], center: [20.9893, 105.7953], zoom: 18, min_zoom: 11, max_zoom: 19, style: 'https://tiles.openfreemap.org/styles/liberty', tiles: {url: '', attribution: ''}};
    if (path === '/api/register' || path === '/api/login') { const username = String(body.username || 'visitor').trim() || 'visitor'; state.user = {id: 1, name: String(body.name || username), username, avatar: '/assets/default-profile-picture.webp', meme_count: 0, aura: 0, is_admin: false}; save(); return {authenticated: true, user: clone(state.user)}; }
    if (path === '/api/logout') return {authenticated: false};
    if (path === '/api/pins' && method === 'GET') return {pins: clone(state.pins), can_delete_pins: false};
    if (path === '/api/pins' && method === 'POST') { const pin = {id: state.nextId++, lat: Number(body.lat), lng: Number(body.lng), title: String(body.title || '').trim(), story: String(body.story || '').trim(), image: body.image || null, username: state.user.username, aura: 0, viewer_vote: 0, is_owner: true, can_delete: false, created_at: Date.now()}; state.pins.unshift(pin); state.user.meme_count += 1; save(); return {pin: clone(pin)}; }
    const vote = path.match(/^\/api\/pins\/(\d+)\/vote$/); if (vote && method === 'POST') { const pin = state.pins.find(item => item.id === Number(vote[1])); if (!pin) throw new ApiError('pin_not_found', 404); const value = Number(body.value); pin.aura += pin.viewer_vote === value ? -value : (pin.viewer_vote ? -pin.viewer_vote + value : value); pin.viewer_vote = pin.viewer_vote === value ? 0 : value; save(); return {pin: clone(pin)}; }
    const profileMatch = path.match(/^\/api\/profiles\/([^/?]+)$/); if (profileMatch) return {user: profile(decodeURIComponent(profileMatch[1]))};
    if (path === '/api/profile/avatar' && method === 'POST') { state.user.avatar = body.image || state.user.avatar; save(); return {avatar: state.user.avatar}; }
    if (path.startsWith('/api/leaderboard')) { const grouped = new Map(); state.pins.forEach(pin => grouped.set(pin.username, (grouped.get(pin.username) || 0) + pin.aura)); return {city: 'hanoi', leaders: [...grouped].sort((a,b) => b[1] - a[1]).map(([username, aura], i) => ({rank: i + 1, username, name: username, pin_count: state.pins.filter(pin => pin.username === username).length, aura, is_you: username === state.user.username}))}; }
    if (path.includes('/reports')) return {report: {id: Date.now(), status: 'pending'}};
    throw new ApiError('not_found', 404);
  }
  Object.assign(MemeMap, {ApiError, createApiClient: () => ({request}), isSessionError: () => false});
})();
