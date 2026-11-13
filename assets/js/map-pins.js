/* Feature controller; composed by map.js. */
(() => {
  function createMapPins({map, defaultZoom, api, tr, escapeHtml, restrictionMessage, onAccess, onRefreshed, onChanged, onManage, onReport, onProfile, onSelected}) {
    let pins = [], pinsRevision = 0, pinsLoading = false, pinsReloadRequested = false;
    const pendingVotes = new Set();
    const pinMarkers = new Map();
    const popupContents = new WeakMap();
    function voteControls(pin) {
      const disabled = pin.is_owner ? `disabled title="${escapeHtml(tr('ownPin'))}"` : '';
      return `<div class="aura-controls"><span class="aura-score">${escapeHtml(tr('aura'))}: <b>${pin.aura}</b></span><button class="vote-button ${pin.viewer_vote === 1 ? 'selected' : ''}" type="button" data-vote="${pin.id}" data-value="1" ${disabled}>+aura</button><button class="vote-button ${pin.viewer_vote === -1 ? 'selected' : ''}" type="button" data-vote="${pin.id}" data-value="-1" ${disabled}>−aura</button></div>`;
    }

    function pinPopup(pin) {
      return `<div class="pin-popup">${pin.image ? `<img class="popup-img" src="${pin.image}" alt="">` : ''}<strong>${escapeHtml(pin.title)}</strong><div class="pin-author">${escapeHtml(tr('author'))} <button class="pin-author-link" type="button" data-profile-username="${escapeHtml(pin.username)}">@${escapeHtml(pin.username)}</button></div>${pin.story ? `<div class="popup-story">${escapeHtml(pin.story)}</div>` : ''}${voteControls(pin)}<button class="pin-report-button" type="button" data-report-pin="${pin.id}">${escapeHtml(tr('reportPin'))}</button></div>`;
    }

    function renderPins(preservePopupId = null) {
      const activePopupId = preservePopupId ?? [...pinMarkers].find(([, marker]) => marker.getPopup().isOpen())?.[0] ?? null;
      const query = document.getElementById('search').value.trim().toLocaleLowerCase();
      const filtered = pins.filter(pin => `${pin.title} ${pin.story} ${pin.username}`.toLocaleLowerCase().includes(query));
      document.getElementById('count').textContent = String(pins.length).padStart(2, '0');
      document.getElementById('list').innerHTML = filtered.length ? filtered.map(pin => `<article class="pin-row"><button class="pin-summary" type="button" data-open-pin="${pin.id}"><span class="pin-emoji"><span>📍</span></span><span><strong>${escapeHtml(pin.title)}</strong><small>@${escapeHtml(pin.username)}</small></span></button>${pin.can_delete ? `<button class="delete-pin" type="button" data-manage-pin="${pin.id}" title="${escapeHtml(tr('managePin'))}" aria-label="${escapeHtml(tr('managePin'))}">⋯</button>` : ''}${voteControls(pin)}</article>`).join('') : `<div class="empty">${escapeHtml(pins.length ? tr('noResults') : tr('empty'))}</div>`;
      const currentIds = new Set(pins.map(pin => pin.id));
      for (const [id, marker] of pinMarkers) {
        if (!currentIds.has(id)) { marker.remove(); pinMarkers.delete(id); }
      }
      pins.forEach(pin => {
        let marker = pinMarkers.get(pin.id);
        const content = pinPopup(pin);
        if (!marker) {
          marker = MemeMap.createPinMarker([pin.lng, pin.lat], content);
          pinMarkers.set(pin.id, marker);
        } else if (popupContents.get(marker) !== content) {
          marker.getPopup().setHTML(content);
        }
        popupContents.set(marker, content);
        marker.getElement().setAttribute('aria-label', pin.title);
        pin.marker = marker;
        if (pin.id === activePopupId && !marker.getPopup().isOpen()) marker.togglePopup();
      });
    }

    async function loadPins(showLoading = false) {
      if (pinsLoading || pendingVotes.size) { pinsReloadRequested = true; return; }
      pinsLoading = true;
      const revisionAtStart = pinsRevision;
      const list = document.getElementById('list');
      if (showLoading) list.innerHTML = `<div class="empty">${escapeHtml(tr('loading'))}</div>`;
      try {
        const data = await api.request('/api/pins');
        if (revisionAtStart === pinsRevision) {
          const activePopupId = [...pinMarkers].find(([, marker]) => marker.getPopup().isOpen())?.[0] ?? null;
          pins = data.pins || [];
          onAccess(Boolean(data.can_delete_pins));
          renderPins(activePopupId);
          onRefreshed();
        }
      } catch {
        if (showLoading) list.innerHTML = `<div class="empty">${escapeHtml(tr('pinError'))}</div>`;
      } finally {
        pinsLoading = false;
        if (pinsReloadRequested) { pinsReloadRequested = false; loadPins(); }
      }
    }

    async function sendVote(pinId, value) {
      if (pendingVotes.has(pinId)) return;
      pendingVotes.add(pinId);
      pinsRevision++;
      try {
        const data = await api.request(`/api/pins/${pinId}/vote`, {method: 'POST', json: {value}});
        pinsRevision += 1;
        const index = pins.findIndex(pin => pin.id === data.pin.id);
        if (index !== -1) pins[index] = data.pin;
        renderPins();
        onChanged();
      } catch (error) {
        if (MemeMap.isSessionError(error)) return;
        window.alert(error.code === 'vote_restricted' ? restrictionMessage(error.data)
          : error.code === 'cannot_vote_own_pin' ? tr('ownPin') : tr('voteError'));
        if (error.status === 404) pinsReloadRequested = true;
      } finally {
        pendingVotes.delete(pinId);
        pinsRevision++;
        if (pinsReloadRequested && !pendingVotes.size) { pinsReloadRequested = false; loadPins(); }
      }
    }

    document.getElementById('search').oninput = () => renderPins();
    document.getElementById('list').addEventListener('click', event => {
      const manageButton = event.target.closest('[data-manage-pin]');
      if (manageButton) {
        event.preventDefault(); event.stopPropagation();
        const pin = pins.find(item => item.id === Number(manageButton.dataset.managePin));
        if (pin) onManage({...pin, is_hidden: false});
        return;
      }
      const voteButton = event.target.closest('[data-vote]');
      if (voteButton) { event.preventDefault(); event.stopPropagation(); sendVote(Number(voteButton.dataset.vote), Number(voteButton.dataset.value)); return; }
      const pinButton = event.target.closest('[data-open-pin]');
      if (pinButton) {
        const pin = pins.find(item => item.id === Number(pinButton.dataset.openPin));
        if (pin) {
          onSelected?.(pin);
          map.jumpTo({center: [pin.lng, pin.lat], zoom: Math.max(map.getZoom(), defaultZoom)});
          if (!pin.marker.getPopup().isOpen()) pin.marker.togglePopup();
        }
      }
    });
    map.getContainer().addEventListener('click', event => {
      const button = event.target.closest('.pin-popup [data-vote], .pin-popup [data-profile-username], .pin-popup [data-report-pin]');
      if (!button) return;
      event.preventDefault();
      event.stopPropagation();
      if (button.dataset.reportPin) onReport(Number(button.dataset.reportPin));
      else if (button.dataset.profileUsername) onProfile(button.dataset.profileUsername);
      else if (!button.disabled) sendVote(Number(button.dataset.vote), Number(button.dataset.value));
    }, true);

    function add(pin) {
      pinsRevision++;
      pins.unshift(pin);
      renderPins();
      onChanged();
    }
    function refresh() { pinsRevision++; return loadPins(); }

    return {load: loadPins, refresh, render: renderPins, add, marker: id => pinMarkers.get(id)};
  }
  MemeMap.createMapPins = createMapPins;
})();
