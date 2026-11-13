/* Shared browser behavior for the home page and map. No framework required. */
(() => {
  const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
  const STATIC_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  // A second tap on the same UI element is one action, never browser page zoom.
  // Keep map gestures, editable text selection and multi-touch outside this guard.
  let lastTap = null, tapStart = null;
  const tapSurface = target => {
    if (innerWidth > 600 || !(target instanceof Element) ||
      target.closest('input,textarea,select,[contenteditable="true"]')) return null;
    if (target.closest('#map') && !target.closest('.maplibregl-popup,.fixed-pending-pin')) return null;
    return target.closest('button,a') || target;
  };
  document.addEventListener('touchstart', event => {
    if (event.touches.length !== 1) { tapStart = null; lastTap = null; return; }
    const touch = event.touches[0], target = tapSurface(event.target);
    tapStart = target ? {target,x:touch.clientX,y:touch.clientY} : null;
  }, {passive:true});
  document.addEventListener('touchend', event => {
    const start = tapStart;
    tapStart = null;
    if (!start || event.touches.length || event.changedTouches.length !== 1) return;
    const touch = event.changedTouches[0];
    if (Math.hypot(touch.clientX-start.x,touch.clientY-start.y) > 8) { lastTap = null; return; }
    const now = performance.now();
    if (lastTap?.target === start.target && now-lastTap.time < 300 &&
      Math.hypot(touch.clientX-lastTap.x,touch.clientY-lastTap.y) < 24 && event.cancelable) event.preventDefault();
    lastTap = {target:start.target,time:now,x:touch.clientX,y:touch.clientY};
  }, {passive:false});
  document.addEventListener('touchcancel', () => { tapStart = null; lastTap = null; }, {passive:true});

  function isSupportedStaticImage(file) {
    return STATIC_IMAGE_TYPES.includes(file.type) ||
      (!file.type && /\.(?:jpe?g|png|webp)$/i.test(file.name));
  }

  function readBlobAsDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('image_read_failed'));
      reader.readAsDataURL(blob);
    });
  }

  async function decodeImage(file) {
    if (typeof createImageBitmap === 'function') {
      try { return await createImageBitmap(file); } catch { /* Try Safari's image decoder. */ }
    }
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      return image;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function compressImage(file, maxEdge) {
    if (!isSupportedStaticImage(file)) throw new Error('invalid_image_type');
    if (file.size > MAX_IMAGE_BYTES) throw new Error('image_too_large');
    const bytes = new Uint8Array(await file.arrayBuffer());
    const tag = offset => String.fromCharCode(...bytes.slice(offset, offset + 4));
    const view = new DataView(bytes.buffer);
    if (tag(0) === 'RIFF' && tag(8) === 'WEBP') {
      for (let offset = 12; offset + 8 <= bytes.length;) {
        const kind = tag(offset);
        if (kind === 'ANIM' || kind === 'ANMF' || (kind === 'VP8X' && bytes[offset + 8] & 2)) {
          throw new Error('invalid_image_type');
        }
        const size = view.getUint32(offset + 4, true);
        offset += 8 + size + (size & 1);
      }
    } else if (bytes[0] === 137 && tag(1) === 'PNG\r') {
      for (let offset = 8; offset + 8 <= bytes.length;) {
        if (tag(offset + 4) === 'acTL') throw new Error('invalid_image_type');
        offset += 12 + view.getUint32(offset);
      }
    }
    const bitmap = await decodeImage(file);
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    try {
      const context = canvas.getContext('2d');
      if (!context) throw new Error('canvas_unavailable');
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    } finally {
      bitmap.close?.();
    }
    let blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', .82));
    // PNG fallback keeps transparency; the server converts it to WebP.
    if (!blob || blob.type !== 'image/webp') {
      blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    }
    if (!blob || !STATIC_IMAGE_TYPES.includes(blob.type) || blob.size > MAX_IMAGE_BYTES) {
      throw new Error('avatar_encode_failed');
    }
    return readBlobAsDataUrl(blob);
  }

  function createPopup(overlay, positionedClass = '') {
    let cleanupTimer;
    return {
      open(positioned = false) {
        clearTimeout(cleanupTimer);
        if (positionedClass) overlay.classList.toggle(positionedClass, positioned);
        overlay.classList.add('open');
      },
      close() {
        overlay.classList.remove('open');
        clearTimeout(cleanupTimer);
        // Retain the presentation throughout fade-out, including rapid reopen.
        cleanupTimer = setTimeout(() => {
          if (!overlay.classList.contains('open') && positionedClass) {
            overlay.classList.remove(positionedClass);
          }
        }, 260);
      },
    };
  }

  function imageErrorMessage(error, lang) {
    const messages = {
      invalid_avatar: ['Máy chủ từ chối ảnh. Hãy thử JPG hoặc PNG khác.', 'The server rejected the image. Try another JPG or PNG.'],
      invalid_image_type: ['Chỉ hỗ trợ ảnh JPG, JPEG, PNG hoặc WebP tĩnh.', 'Only static JPG, JPEG, PNG, or WebP images are supported.'],
      image_too_large: ['Ảnh đầu vào tối đa 10 MB.', 'Image file must be 10 MB or smaller.'],
      avatar_storage_failed: ['Máy chủ không lưu được ảnh. Hãy thử lại.', 'The server could not save the image. Please try again.'],
      avatar_encode_failed: ['Trình duyệt không xử lý được ảnh. Hãy thử ảnh khác.', 'This browser could not process the image. Try another one.'],
      webp_conversion_failed: ['Máy chủ chưa chuyển được ảnh sang WebP. Kiểm tra cwebp và khởi động lại máy chủ.', 'The server could not convert the image to WebP. Check cwebp and restart the server.'],
      image_read_failed: ['Không đọc được ảnh đã xử lý. Hãy thử ảnh khác.', 'Could not read the processed image. Try another one.'],
    };
    const fallback = error instanceof TypeError
      ? ['Không kết nối được tới máy chủ để lưu ảnh.', 'Could not connect to the server to save the image.']
      : ['Chưa đổi được ảnh đại diện. Hãy thử ảnh khác.', 'Could not update the profile picture. Please try another image.'];
    return (messages[error.message] || fallback)[lang === 'vi' ? 0 : 1];
  }

  function suggestUsername(name) {
    return Array.from(name.normalize('NFC')).map(char => {
      if (char === 'đ' || char === 'Đ') return 'd';
      if (/\s/.test(char)) return '_';
      if (/^[A-Za-z0-9._]$/.test(char)) return char.toLowerCase();
      const plain = char.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return /^[A-Za-z]$/.test(plain) && /[\u00C0-\u024F\u1E00-\u1EFF]/.test(char)
        ? plain.toLowerCase() : char;
    }).join('').replace(/[._]{2,}/g, '_').replace(/^[._]+|[._]+$/g, '')
      .slice(0, 24).replace(/[._]+$/g, '');
  }

  window.MemeMap = {
    MAX_IMAGE_BYTES, isSupportedStaticImage, compressImage, createPopup,
    imageErrorMessage, suggestUsername,
  };
})();
