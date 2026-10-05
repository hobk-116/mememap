/* Feature controller; composed by map.js. */
(() => {
  function createMapLeaderboard({api, tr, escapeHtml, onProfile}) {
    let leaderboardRows = null, leaderboardRequest = 0;
    function renderLeaderboard(rows) {
      const list = document.getElementById('leaderboardList');
      if (rows === null) { list.innerHTML = `<div class="empty">${escapeHtml(tr('boardLoading'))}</div>`; return; }
      if (!rows.length) { list.innerHTML = `<div class="empty">${escapeHtml(tr('boardEmpty'))}</div>`; return; }
      list.innerHTML = rows.map(row => `<article class="leader-row ${row.is_you ? 'you' : ''}"><span class="leader-rank" data-rank="${row.rank}">${row.rank}</span><span class="leader-name"><button class="leader-profile-link leader-profile-name" type="button" data-profile-username="${escapeHtml(row.username)}">${escapeHtml(row.name)}${row.is_you ? ` · ${escapeHtml(tr('boardYou'))}` : ''}</button><small><button class="leader-profile-link leader-profile-handle" type="button" data-profile-username="${escapeHtml(row.username)}">@${escapeHtml(row.username)}</button><span> · ${row.pin_count} ${escapeHtml(tr('boardPins'))}</span></small></span><span class="leader-score"><strong>${row.aura} ✨</strong><small>${escapeHtml(tr('boardAura'))}</small></span></article>`).join('');
    }

    async function loadLeaderboard() {
      const revision = ++leaderboardRequest;
      if (!leaderboardRows) renderLeaderboard(null);
      try {
        const city = document.getElementById('cityFilter').value;
        const data = await api.request(`/api/leaderboard?city=${encodeURIComponent(city)}`);
        if (revision !== leaderboardRequest) return;
        leaderboardRows = data.leaders || [];
        renderLeaderboard(leaderboardRows);
      } catch (error) {
        if (MemeMap.isSessionError(error) || revision !== leaderboardRequest) return;
        document.getElementById('leaderboardList').innerHTML = `<div class="empty">${escapeHtml(tr('boardError'))}</div>`;
      }
    }


    document.getElementById('leaderboardList').addEventListener('click', event => {
      const link = event.target.closest('[data-profile-username]');
      if (link) { event.preventDefault(); event.stopPropagation(); onProfile(link.dataset.profileUsername); }
    });
    document.getElementById('cityFilter').onchange = loadLeaderboard;

    return {load: loadLeaderboard, render: () => { if (leaderboardRows) renderLeaderboard(leaderboardRows); }};
  }
  MemeMap.createMapLeaderboard = createMapLeaderboard;
})();
