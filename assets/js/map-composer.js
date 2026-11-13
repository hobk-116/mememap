/* Feature controller; composed by map.js. */
(() => {
  function createMapComposer({map, defaultZoom, layout, api, tr, restrictionMessage, onCreated, onFocus}) {
    let selected = null, image = '', imageTask = null, imageRevision = 0;
    const modal = document.getElementById('modal');
    const form = document.getElementById('form');
    const {compressImage, isSupportedStaticImage} = MemeMap;
    function closeModal() {
      modal.classList.remove('open');
      selected = null;
      layout.reset();
    }
    function requestPin() {
      if (!selected) {
        document.getElementById('error').textContent = tr('choose');
        if (layout.isMobile()) layout.setOpen('menu', true);
        return;
      }
      document.getElementById('error').textContent = '';
      modal.classList.add('open');
      document.getElementById('title').focus();
    }

    function setPendingLocation(latlng) {
      selected = {lat: latlng.lat, lng: latlng.lng};
      document.getElementById('coords').textContent = `${selected.lat.toFixed(5)}, ${selected.lng.toFixed(5)}`;
      document.getElementById('error').textContent = '';
      layout.select(selected);
    }
    function startPinAtVisibleCenter() {
      setPendingLocation(layout.center());
      requestPin();
    }

    map.on('click', event => { setPendingLocation(event.lngLat); requestPin(); });
    document.getElementById('hint').onclick = startPinAtVisibleCenter;
    document.getElementById('close').onclick = closeModal;
    document.getElementById('cancel').onclick = closeModal;
    modal.onclick = event => { if (event.target === modal) closeModal(); };
    document.getElementById('locate').onclick = () => {
      if (!navigator.geolocation) { document.getElementById('error').textContent = tr('badLoc'); return; }
      navigator.geolocation.getCurrentPosition(position => {
        const point = [position.coords.latitude, position.coords.longitude];
        map.jumpTo({center: [point[1], point[0]], zoom: defaultZoom}); setPendingLocation({lat: point[0], lng: point[1]});
        document.getElementById('coords').textContent = tr('loc'); requestPin();
      }, () => { document.getElementById('error').textContent = tr('needLoc'); }, {enableHighAccuracy:true,timeout:12000});
    };
    const compressMemeImage = file => compressImage(file, 1600);
    document.getElementById('photo').onchange = event => {
      const file = event.target.files[0];
      const revision = ++imageRevision;
      const preview = document.getElementById('preview');
      image = '';
      imageTask = null;
      preview.removeAttribute('src');
      preview.style.display = 'none';
      document.getElementById('error').textContent = '';
      if (!file) return;
      if (!isSupportedStaticImage(file) || file.size > MemeMap.MAX_IMAGE_BYTES) {
        event.target.value = '';
        document.getElementById('error').textContent = tr(file.size > MemeMap.MAX_IMAGE_BYTES ? 'large' : 'invalidImageType');
        return;
      }
      imageTask = compressMemeImage(file).then(result => {
        if (revision !== imageRevision) return;
        image = result;
        preview.src = result;
        preview.style.display = 'block';
      }).catch(() => {
        if (revision !== imageRevision) return;
        event.target.value = '';
        document.getElementById('error').textContent = tr('imageProcessError');
      });
    };
    form.onsubmit = async event => {
      event.preventDefault();
      if (!selected) { document.getElementById('error').textContent = tr('required'); return; }
      const title = document.getElementById('title').value.trim();
      if (!title) { document.getElementById('error').textContent = tr('needTitle'); return; }
      const save = form.querySelector('[type="submit"]'); save.disabled = true;
      const location = {...selected};
      const revision = imageRevision;
      try {
        if (imageTask) await imageTask;
        if (revision !== imageRevision || !modal.classList.contains('open')) return;
        if (document.getElementById('error').textContent) return;
        const data = await api.request('/api/pins', {method: 'POST', json: {
          lat: location.lat, lng: location.lng, title,
          story: document.getElementById('story').value.trim(), image,
        }});
        onCreated(data.pin);
        closeModal(); form.reset(); image = ''; imageTask = null; imageRevision++;
        document.getElementById('preview').style.display = 'none';
        map.jumpTo({center: [data.pin.lng, data.pin.lat], zoom: defaultZoom});
        onFocus(data.pin.id);
      } catch (error) {
        if (MemeMap.isSessionError(error)) return;
        document.getElementById('error').textContent = error.code === 'post_restricted' ? restrictionMessage(error.data)
          : error.code === 'outside_map_bounds' ? tr('outside') : tr('pinError');
      }
      finally { save.disabled = false; }
    };

    return {get selected() { return selected; }, close: closeModal, place: point => { setPendingLocation(point); requestPin(); }};
  }
  MemeMap.createMapComposer = createMapComposer;
})();
