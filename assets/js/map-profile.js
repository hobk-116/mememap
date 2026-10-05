/* Feature controller; composed by map.js. */
(() => {
  function createMapProfile({api, tr, getLanguage, onAccess, authRedirect}) {
    const profileButton = document.getElementById('profileButton');
    const profileOverlay = document.getElementById('profileOverlay');
    const {compressImage, isSupportedStaticImage, createPopup, imageErrorMessage} = MemeMap;
    const profilePopup = createPopup(profileOverlay, 'own-profile-view');
    let profileRequest = 0, refreshRequest = 0, accountRequest = 0;
    let ownProfile = null, viewedProfile = null;
    let avatarUploading = false;
    let profileMemeCount = 0, profileAura = 0;
    function renderProfileStats() {
      const memeCount = Number(profileMemeCount) || 0;
      const aura = Number(profileAura) || 0;
      document.getElementById('profileStats').textContent = `${memeCount} ${tr('profileMemeUnit')} • ${aura} ${tr('profileAuraUnit')}`;
    }
    function updateProfileAvatar(avatar, updateHeader = true) {
      const src = avatar || '/assets/default-profile-picture.webp';
      document.querySelectorAll(updateHeader ? '.profile-trigger img, .profile-avatar' : '.profile-avatar').forEach(image => { if (image.getAttribute('src') !== src) image.src = src; });
    }

    function showProfileValues(user) {
      const avatarButton = document.getElementById('profileAvatarButton');
      avatarButton.disabled = !user.is_self || avatarUploading;
      const label = user.is_self ? (getLanguage() === 'vi' ? 'Đổi ảnh đại diện' : 'Change profile picture')
        : (getLanguage() === 'vi' ? 'Ảnh đại diện' : 'Profile picture');
      avatarButton.setAttribute('aria-label', label);
      avatarButton.title = label;
      document.getElementById('profileName').textContent = user.name;
      document.getElementById('profileUsername').textContent = `@${user.username}`;
      updateProfileAvatar(user.avatar, false);
      profileMemeCount = Number(user.meme_count) || 0;
      profileAura = Number(user.aura) || 0;
      renderProfileStats();
    }

    async function openUserProfile(username) {
      const revision = ++profileRequest;
      viewedProfile = null;
      profilePopup.open(false);
      showProfileValues({name: '…', username, meme_count: 0, aura: 0, is_self: false});
      try {
        const data = await api.request(`/api/profiles/${encodeURIComponent(username)}`);
        if (revision !== profileRequest) return;
        viewedProfile = data.user;
        showProfileValues(viewedProfile);
      } catch (error) {
        if (MemeMap.isSessionError(error) || revision !== profileRequest) return;
        closeProfileView();
        window.alert(tr('profileLoadError'));
      }
    }

    async function loadProfile() {
      const revision = ++accountRequest;
      try {
        const data = await api.request('/api/me');
        if (revision !== accountRequest) return ownProfile;
        if (!data.authenticated || !data.user) { authRedirect(); return null; }
        ownProfile = {...data.user, is_self: true};
        onAccess(Boolean(data.user.is_admin));
        const headerImage = profileButton.querySelector('img');
        if (headerImage.getAttribute('src') !== ownProfile.avatar) headerImage.src = ownProfile.avatar;
        return ownProfile;
      } catch { return ownProfile; }
    }

    async function showOwnProfile() {
      const revision = ++profileRequest;
      const user = await loadProfile();
      if (revision !== profileRequest || !user) return;
      viewedProfile = user;
      showProfileValues(user);
      profilePopup.open(true);
    }

    document.getElementById('profileAvatarButton').onclick = () => document.getElementById('profileAvatarInput').click();
    document.getElementById('profileAvatarInput').onchange = async event => {
      const file = event.target.files && event.target.files[0]; event.target.value = '';
      if (!file || avatarUploading || !viewedProfile?.is_self) return;
      if (!isSupportedStaticImage(file)) { window.alert(getLanguage() === 'vi' ? 'Chỉ hỗ trợ ảnh JPG, JPEG, PNG hoặc WebP tĩnh.' : 'Only static JPG, JPEG, PNG, or WebP images are supported.'); return; }
      if (file.size > 10 * 1024 * 1024) { window.alert(getLanguage() === 'vi' ? 'Ảnh đầu vào tối đa 10 MB.' : 'Image file must be 10 MB or smaller.'); return; }
      avatarUploading = true;
      document.getElementById('profileAvatarButton').disabled = true;
      try {
        const image = await compressAvatar(file);
        const data = await api.request('/api/profile/avatar', {method: 'POST', json: {image}});
        accountRequest++;
        refreshRequest++;
        if (ownProfile) ownProfile.avatar = data.avatar;
        profileButton.querySelector('img').src = data.avatar;
        if (viewedProfile?.is_self) { viewedProfile.avatar = data.avatar; showProfileValues(viewedProfile); }
      } catch (error) {
        if (MemeMap.isSessionError(error)) return;
        window.alert(imageErrorMessage(error, getLanguage()));
      } finally {
        avatarUploading = false;
        if (viewedProfile) showProfileValues(viewedProfile);
      }
    };
    const compressAvatar = file => compressImage(file, 512);
    function closeProfileView() { profileRequest++; profilePopup.close(); }
    profileButton.onclick = () => showOwnProfile();
    document.getElementById('profileLogoutButton').onclick = async event => {
      const button = event.currentTarget;
      if (button.disabled || !profileOverlay.classList.contains('own-profile-view') || !viewedProfile?.is_self) return;
      if (!window.confirm(tr('logoutConfirm'))) return;
      button.disabled = true;
      try {
        await api.request('/api/logout', {method: 'POST', json: {}});
        accountRequest++;
        ownProfile = null;
        closeProfileView();
        location.href = '/';
      } catch { window.alert(tr('logoutError')); }
      finally { button.disabled = false; }
    };
    document.getElementById('profileClose').onclick = closeProfileView;
    profileOverlay.onclick = event => { if (event.target === profileOverlay) closeProfileView(); };

    async function refreshVisible() {
      if (!viewedProfile || !profileOverlay.classList.contains('open')) return;
      const revision = profileRequest, refresh = ++refreshRequest, username = viewedProfile.username;
      try {
        const data = await api.request(`/api/profiles/${encodeURIComponent(username)}`);
        if (revision !== profileRequest || refresh !== refreshRequest || !profileOverlay.classList.contains('open')) return;
        viewedProfile = data.user;
        if (viewedProfile.is_self && ownProfile) ownProfile = {...ownProfile, ...viewedProfile};
        showProfileValues(viewedProfile);
      } catch { /* Keep the last confirmed totals on a transient refresh failure. */ }
    }
    function render() {
      renderProfileStats();
      if (viewedProfile) showProfileValues(viewedProfile);
    }

    return {open: openUserProfile, load: loadProfile, close: closeProfileView, refreshVisible, render};
  }
  MemeMap.createMapProfile = createMapProfile;
})();
