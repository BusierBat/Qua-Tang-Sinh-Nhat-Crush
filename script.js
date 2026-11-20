/* ============================================================
   QUA-TANG-SINH-NHAT-CRUSH — LOGIC
   Gồm: nạp cấu hình, hệ thống tự đánh giá & điều chỉnh hiệu năng
   (mục VIII), âm thanh SFX (mục X), hạt lấp lánh, và hành trình
   quà tặng (mục IV). Toàn bộ chạy cục bộ, không gửi dữ liệu đi đâu.
   ============================================================ */
(function () {
  'use strict';

  /* ================= TIỆN ÍCH ================= */
  const $ = function (sel, root) { return (root || document).querySelector(sel); };
  const $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  const clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  const reduceMotionMQ = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };

  const store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* chế độ riêng tư */ } }
  };

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function interpolate(str, ctx) {
    ctx = ctx || {};
    const val = function (k) { return ctx[k] != null ? String(ctx[k]) : ''; };
    return String(str == null ? '' : str)
      .replace(/\{name\}/g, val('name'))
      .replace(/\{sender\}/g, val('sender'))
      .replace(/\{profile\}/g, val('profile'))
      .replace(/\{mode\}/g, val('mode'));
  }
  function getPath(obj, path) {
    return path.split('.').reduce(function (a, k) { return a == null ? undefined : a[k]; }, obj);
  }
  function median(arr) {
    if (!arr.length) return 0;
    const s = arr.slice().sort(function (a, b) { return a - b; });
    return s[Math.floor(s.length / 2)];
  }
  /* Rung nhẹ trên di động (Android) — giữ rất khẽ, có guard */
  function buzz(ms) {
    try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { }
  }

  /* ================= CẤU HÌNH ================= */
  // Dự phòng nếu config.js thiếu — trang vẫn chạy với placeholder.
  const DEFAULTS = {
    recipientName: '[Tên người nhận]', senderName: '[Tên người gửi]', birthDateLabel: '[Ngày sinh nhật]', birthDateISO: '',
    landing: { kicker: '', greeting: 'Có một món quà nhỏ dành cho {name}.', sub: 'Một điều nho nhỏ đã được chuẩn bị từ trước — dành riêng cho bạn.', chipOnBirthday: '', chipOtherwise: '', openButton: 'Mở quà nhé!' },
    card: { eyebrow: 'Thiệp chúc mừng', title: 'Chúc mừng sinh nhật, {name}!', message: '…', toLetterButton: 'Có một lá thư dành cho bạn' },
    letter: { envelopeHint: 'Chạm vào phong bì để mở', title: 'Gửi {name},', paragraphs: ['…'], closing: 'Chúc mừng sinh nhật.', signatureLabel: 'Thân mến,', postscript: '' },
    notes: { sectionTitle: 'Vài lời nhắn nhỏ', sectionHint: '', openLabel: 'Lời nhắn', items: [], skipLabel: 'Tiếp tục' },
    ending: { title: 'Và một điều cuối cùng…', message: '', invite: '', signature: '— {sender}', replayButton: 'Xem lại từ đầu', endButton: 'Kết thúc' },
    farewell: { title: 'Hẹn một ngày thật đẹp nhé.', sub: '', replayHint: 'mở lại từ đầu' },
    ui: {
      soundOn: 'Bật âm thanh hiệu ứng', soundOff: 'Tắt âm thanh hiệu ứng',
      perfTitle: 'Hiệu năng hiển thị', perfHint: '', perfAuto: 'Tự động (khuyến nghị)',
      perfEfficient: 'Tiết kiệm tài nguyên', perfBalanced: 'Cân bằng', perfHigh: 'Chất lượng cao',
      perfNow: 'Đang dùng: {profile} ({mode})', modeAuto: 'tự động', modeManual: 'thủ công',
      profileNames: { efficient: 'Tiết kiệm', balanced: 'Cân bằng', high: 'Chất lượng cao' },
      toastPerf: 'Hiệu năng: {profile}', toastRt: 'Đã giảm tạm chất lượng hiệu ứng để chạy mượt hơn'
    }
  };
  function isPlainObj(x) { return x && typeof x === 'object' && !Array.isArray(x); }
  function deepMerge(base, over) {
    if (!isPlainObj(over)) return base;
    const out = Object.assign({}, base);
    Object.keys(over).forEach(function (k) {
      out[k] = isPlainObj(base[k]) && isPlainObj(over[k]) ? deepMerge(base[k], over[k]) : over[k];
    });
    return out;
  }
  const CFG = deepMerge(deepMerge(DEFAULTS, window.GIFT_CONFIG || {}), window.GIFT_CONFIG_PERSONAL || {});
  const CTX = { name: CFG.recipientName || '', sender: CFG.senderName || '' };

  function applyConfig() {
    document.title = 'Một món quà nhỏ — ' + (CFG.recipientName || '');
    $$('[data-cfg]').forEach(function (el) {
      const raw = getPath(CFG, el.getAttribute('data-cfg'));
      if (raw == null) return;
      const val = interpolate(raw, CTX);
      if (el.getAttribute('data-cfg') === 'landing.greeting' && CFG.recipientName) {
        // tô nhẹ tên người nhận (nội dung từ config của chủ dự án — đã escape)
        const esc = escapeHtml(val);
        const escName = escapeHtml(CTX.name);
        if (escName && esc.indexOf(escName) !== -1) {
          el.innerHTML = esc.split(escName).join('<span class="name-em">' + escName + '</span>');
        } else { el.textContent = val; }
      } else { el.textContent = val; }
    });
    // Nội dung thư
    const body = $('#letter-body');
    if (body) {
      body.textContent = '';
      (CFG.letter.paragraphs || []).forEach(function (p) {
        const node = document.createElement('p');
        node.textContent = interpolate(p, CTX);
        body.appendChild(node);
      });
    }
    // Lời nhắn nhỏ
    const row = $('#notes-row');
    if (row) {
      row.textContent = '';
      (CFG.notes.items || []).forEach(function (item, i) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'note-card';
        btn.setAttribute('role', 'listitem');
        btn.innerHTML =
          '<svg class="nc-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 3l2 6.2L20.4 11l-6.4 1.8L12 19l-2-6.2L3.6 11 10 9.2 12 3Z" fill="currentColor"/></svg>' +
          '<span class="nc-label"></span><span class="nc-index"></span>';
        const idx = i + 1;
        $('.nc-label', btn).textContent = (CFG.notes.openLabel || 'Lời nhắn') + ' ' + idx;
        $('.nc-index', btn).textContent = '0' + idx + ' / 0' + (CFG.notes.items || []).length;
        btn.setAttribute('aria-label', (CFG.notes.openLabel || 'Lời nhắn') + ' ' + idx);
        btn.addEventListener('click', function () { Journey.openNote(i); });
        row.appendChild(btn);
      });
    }
    // Chip màn đầu — đặc biệt ấm hơn khi đúng ngày sinh nhật (birthDateISO "MM-DD")
    const chip = $('#landing-chip');
    if (chip) {
      const iso = String(CFG.birthDateISO || '').trim();
      let chipText = CFG.landing.chipOtherwise;
      const m = iso.match(/^(\d{1,2})-(\d{1,2})$/);
      if (m) {
        const now = new Date();
        const mm = ('0' + (now.getMonth() + 1)).slice(-2);
        const dd = ('0' + now.getDate()).slice(-2);
        if (mm === ('0' + m[1]).slice(-2) && dd === ('0' + m[2]).slice(-2)) chipText = CFG.landing.chipOnBirthday;
      }
      if (chipText) { chip.textContent = interpolate(chipText, CTX); chip.hidden = false; }
    }
    // P/S cuối lá thư (tự bỏ tiền tố "P/S:" trong nội dung để không lặp)
    const ps = $('#letter-ps');
    if (ps) {
      const psText = interpolate(CFG.letter.postscript || '', CTX).replace(/^\s*P\s*\/\s*S\s*[:：]?\s*/i, '');
      if (psText.trim()) { const psT = $('#letter-ps-text'); if (psT) psT.textContent = psText; ps.hidden = false; }
    }
    // Lời mời cuối — để trống trong config để ẩn hoàn toàn
    const inv = $('#ending-invite');
    if (inv) {
      const invText = interpolate(CFG.ending.invite || '', CTX);
      if (invText.trim()) { inv.textContent = invText; inv.hidden = false; }
    }
    // Dòng cảm ơn ở màn tĩnh lặng
    const fsub = $('#farewell-sub');
    if (fsub) {
      const fText = interpolate(CFG.farewell.sub || '', CTX);
      if (fText.trim()) { fsub.textContent = fText; fsub.hidden = false; }
    }
  }

  /* ================= TOAST ================= */
  const Toast = (function () {
    const el = $('#toast');
    let showTimer = 0, hideTimer = 0, delayTimer = 0;
    function show(msg, ms, delay) {
      if (!el) return;
      clearTimeout(delayTimer);
      clearTimeout(hideTimer);
      delayTimer = setTimeout(function () {
        el.textContent = msg;
        el.hidden = false;
        requestAnimationFrame(function () { el.classList.add('is-show'); });
        clearTimeout(showTimer);
        showTimer = setTimeout(hide, ms || 2800);
      }, delay || 0);
    }
    function hide() {
      el.classList.remove('is-show');
      hideTimer = setTimeout(function () { el.hidden = true; }, 360);
    }
    return { show: show };
  })();

  /* ============================================================
     HỆ THỐNG TỰ ĐÁNH GIÁ CẤU HÌNH & ĐIỀU CHỈNH HIỆU NĂNG (mục VIII)
     - Thu thập tín hiệu thiết bị (không gửi đi đâu).
     - Benchmark nhẹ 42 frame, không chặn thao tác.
     - 3 profile: efficient / balanced / high — KHÔNG cắt tính năng,
       chỉ đổi chất lượng kỹ thuật (hạt, DPR, blur, bóng).
     - Giám sát runtime có hysteresis, chỉ đổi giữa các màn hình.
     ============================================================ */
  const Perf = (function () {
    const signals = {
      cores: 0, memory: 0, gpu: '', webgl: false, dpr: 1,
      screen: { w: 0, h: 0 }, css: { blur: true, dvh: false },
      saveData: false, battery: null, bench: null, decode: null
    };
    let profile = 'balanced';      // mức đang áp dụng
    let decided = 'balanced';      // mức hệ thống tự chấm điểm
    let manual = 'auto';           // lựa chọn người dùng
    let rtLevel = 0;               // 0 = nền; -1/-2 = giảm tạm khi quá tải
    let lastAdjust = 0;
    let announceDone = false;
    let monitorOn = false;
    let monitorTimer = 0;
    let frozenUntil = 0;
    let frames = [];
    let lastT = 0;
    let lowStreak = 0, highStreak = 0;

    /* --- 1) Tín hiệu thiết bị --- */
    function detectSignals() {
      try { signals.cores = navigator.hardwareConcurrency || 0; } catch (e) { }
      try { signals.memory = navigator.deviceMemory || 0; } catch (e) { }
      signals.dpr = window.devicePixelRatio || 1;
      try { signals.screen = { w: window.screen.width, h: window.screen.height }; } catch (e) { }
      try {
        if (navigator.connection && 'saveData' in navigator.connection) signals.saveData = !!navigator.connection.saveData;
      } catch (e) { }
      try {
        if (navigator.getBattery) {
          navigator.getBattery().then(function (b) {
            signals.battery = { level: b.level, charging: b.charging };
          }).catch(function () { });
        }
      } catch (e) { }
      try {
        signals.css.blur = window.CSS && CSS.supports &&
          (CSS.supports('backdrop-filter', 'blur(2px)') || CSS.supports('-webkit-backdrop-filter', 'blur(2px)'));
        signals.css.dvh = window.CSS && CSS.supports && CSS.supports('height', '1dvh');
      } catch (e) { }
      try {
        const c = document.createElement('canvas');
        const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
        if (gl) {
          signals.webgl = true;
          const ext = gl.getExtension('WEBGL_debug_renderer_info');
          if (ext) signals.gpu = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '');
        }
      } catch (e) { /* không có WebGL — không sao, trang không phụ thuộc WebGL */ }
    }

    function gpuTier() {
      const g = (signals.gpu || '').toLowerCase();
      if (!g) return 1;
      if (/(nvidia|geforce|rtx|gtx|radeon|apple gpu|apple m1|apple m2|apple m3)/.test(g)) return 2;
      if (/iris/.test(g)) return 2;
      if (/(uhd|hd graphics|hd family|mali|powervr)/.test(g)) return 0;
      return 1;
    }

    /* --- 2) Benchmark rất nhẹ: 42 frame transform, ~0.8s, không chặn --- */
    function microBenchmark() {
      return new Promise(function (resolve) {
        if (reduceMotionMQ.matches || document.hidden) { resolve(null); return; }
        let finished = false;
        const el = document.createElement('div');
        el.style.cssText = 'position:fixed;left:-120px;top:-120px;width:36px;height:36px;will-change:transform;pointer-events:none;opacity:.01;';
        document.body.appendChild(el);
        const framesB = [];
        let i = 0, prev = 0;
        const N = 42;
        function step(t) {
          if (finished) return;
          if (prev) framesB.push(t - prev);
          prev = t;
          i++;
          el.style.transform = 'translate3d(' + (i % 7) + 'px,' + ((i * 3) % 11) + 'px,0) rotate(' + (i % 5) + 'deg)';
          if (i < N) requestAnimationFrame(step);
          else {
            finished = true;
            if (el.parentNode) el.parentNode.removeChild(el);
            const data = framesB.slice(2);
            resolve({ med: median(data), count: data.length });
          }
        }
        requestAnimationFrame(step);
        setTimeout(function () {
          if (finished) return;
          finished = true;
          if (el.parentNode) el.parentNode.removeChild(el);
          resolve(null);
        }, 3000);
      });
    }

    /* Probe "giải mã tài nguyên": giải mã 1 WAV nhỏ tự tạo, đo thời gian */
    function probeDecode() {
      return new Promise(function (resolve) {
        try {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) { resolve(null); return; }
          const sr = 8000, n = Math.floor(sr * 0.08);
          const buf = new ArrayBuffer(44 + n * 2);
          const dv = new DataView(buf);
          const wstr = function (o, s) { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
          wstr(0, 'RIFF'); dv.setUint32(4, 36 + n * 2, true); wstr(8, 'WAVE');
          wstr(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
          dv.setUint32(24, sr, true); dv.setUint32(28, sr * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true);
          wstr(36, 'data'); dv.setUint32(40, n * 2, true);
          for (let i = 0; i < n; i++) dv.setInt16(44 + i * 2, Math.round(Math.sin(i * 0.25) * 12000), true);
          const t0 = performance.now();
          const c = new AC();
          c.decodeAudioData(buf).then(function () {
            resolve(performance.now() - t0);
            if (c.close) c.close().catch(function () { });
          }).catch(function () { resolve(null); if (c.close) c.close().catch(function () { }); });
        } catch (e) { resolve(null); }
      });
    }

    /* --- 3) Chấm điểm & chọn profile --- */
    function decide() {
      if (signals.saveData) return 'efficient';
      if (signals.battery && !signals.battery.charging && signals.battery.level < 0.2) return 'efficient';
      let score = 0;
      score += signals.cores >= 8 ? 2 : (signals.cores >= 4 ? 1 : 0);
      score += signals.memory >= 8 ? 2 : (signals.memory >= 4 ? 1 : 0);
      score += gpuTier();
      const b = signals.bench;
      if (b && b.count >= 20) score += b.med <= 13 ? 2 : (b.med <= 21 ? 1 : 0);
      if (signals.decode != null) score += signals.decode < 60 ? 1 : 0;
      if (signals.css.blur === false) score -= 1;
      if (score >= 8) return 'high';
      if (score >= 5) return 'balanced';
      return 'efficient';
    }

    /* --- 4) Áp dụng profile --- */
    function apply(opts) {
      const html = document.documentElement;
      html.dataset.perf = profile;
      html.dataset.rt = rtLevel === 0 ? 'ok' : (rtLevel === -1 ? 'mid' : 'low');
      if (window.__qtParticles) window.__qtParticles.applyProfile(profile);
      updateStatusUI();
      const name = CFG.ui.profileNames[profile] || profile;
      const mode = manual === 'auto' ? CFG.ui.modeAuto : CFG.ui.modeManual;
      if (opts && opts.announce) {
        // Thông báo ban đầu trễ 5s để không đè tiêu đề màn đầu; đổi thủ công thì hiện ngay
        Toast.show(interpolate(CFG.ui.toastPerf, { profile: name }), 2600, opts.announceDelay || 0);
      }
      if (opts && opts.rtToast) Toast.show(CFG.ui.toastRt);
    }

    function updateStatusUI() {
      const status = $('#perf-status');
      if (status) {
        const name = CFG.ui.profileNames[profile] || profile;
        const mode = manual === 'auto' ? CFG.ui.modeAuto : CFG.ui.modeManual;
        status.textContent = interpolate(CFG.ui.perfNow, { profile: name, mode: mode });
      }
      $$('input[name="perf-mode"]').forEach(function (r) { r.checked = (r.value === manual); });
    }

    function setManual(v) {
      if (['auto', 'efficient', 'balanced', 'high'].indexOf(v) === -1) return;
      manual = v;
      store.set('qt-perf', v);
      rtLevel = 0;
      profile = (v === 'auto') ? decided : v;
      apply({ announce: true });
    }

    /* --- 5) Bảng cài đặt --- */
    function initSettings() {
      const panel = $('#perf-panel'), btn = $('#btn-perf');
      if (!panel || !btn) return;
      const radios = $$('input[name="perf-mode"]');
      function open() {
        panel.hidden = false;
        btn.setAttribute('aria-expanded', 'true');
        const checked = radios.filter(function (r) { return r.checked; })[0] || radios[0];
        if (checked) checked.focus();
      }
      function close() {
        panel.hidden = true;
        btn.setAttribute('aria-expanded', 'false');
      }
      btn.addEventListener('click', function () { panel.hidden ? open() : close(); });
      panel.addEventListener('change', function (e) {
        if (e.target && e.target.name === 'perf-mode') setManual(e.target.value);
      });
      document.addEventListener('pointerdown', function (e) {
        if (panel.hidden) return;
        if (!panel.contains(e.target) && !btn.contains(e.target)) close();
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !panel.hidden) { close(); btn.focus(); }
      });
      Perf.closePanel = close;
    }

    /* --- 6) Giám sát runtime (có ngưỡng + hysteresis) --- */
    function startMonitor() {
      if (monitorOn) return;
      monitorOn = true;
      const loop = function (t) {
        if (lastT) frames.push(t - lastT);
        if (frames.length > 130) frames.shift();
        lastT = t;
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
      monitorTimer = setInterval(evaluate, 2000);
    }
    function stopMonitor() {
      monitorOn = false;
      clearInterval(monitorTimer);
    }
    function freeze(ms) { frozenUntil = performance.now() + (ms || 1600); }
    function evaluate() {
      if (!monitorOn || document.hidden) return;
      if (performance.now() < frozenUntil) return;
      const f = frames.slice(-60);
      if (f.length < 30) return;
      const med = median(f);
      const fps = 1000 / Math.max(med, 1);
      if (fps < 22) { lowStreak++; highStreak = 0; }
      else if (fps > 50) { highStreak++; lowStreak = 0; }
      else { lowStreak = 0; highStreak = 0; }
      const now = performance.now();
      if (lowStreak >= 3 && rtLevel > -2 && now - lastAdjust > 8000) {
        rtLevel--; lowStreak = 0; lastAdjust = now;
        apply({ rtToast: true });
        try { console.info('[Perf] fps=' + fps.toFixed(0) + ' → giảm tạm chất lượng hiệu ứng (rt=' + rtLevel + ')'); } catch (e) { }
      } else if (highStreak >= 4 && rtLevel < 0 && now - lastAdjust > 8000) {
        rtLevel++; highStreak = 0; lastAdjust = now;
        apply({ });
      }
    }

    function rateMul() { return rtLevel === 0 ? 1 : (rtLevel === -1 ? 0.7 : 0.5); }

    function init() {
      detectSignals();
      const saved = store.get('qt-perf');
      manual = (saved === 'efficient' || saved === 'balanced' || saved === 'high') ? saved : 'auto';
      decided = decide();           // chấm điểm tĩnh trước
      profile = (manual === 'auto') ? decided : manual;
      initSettings();
      apply({ announce: true, announceDelay: 5000 }); // thông báo ngắn theo mục VIII.6
      // benchmark khi trình duyệt rảnh — không chặn, không lặp lại
      const idle = window.requestIdleCallback || function (fn) { return setTimeout(fn, 350); };
      idle(function () {
        microBenchmark().then(function (b) {
          signals.bench = b;
          return probeDecode();
        }).then(function (dec) {
          signals.decode = dec;
          const d2 = decide();
          if (d2 !== decided) {
            decided = d2;
            if (manual === 'auto') { profile = decided; apply({ announce: true }); }
            else updateStatusUI();
          }
        }).catch(function () { });
      });
    }

    return {
      init: init, startMonitor: startMonitor, stopMonitor: stopMonitor,
      freeze: freeze, rateMul: rateMul, closePanel: function () { },
      getProfile: function () { return profile; },
      getManual: function () { return manual; }
    };
  })();

  /* ============================================================
     ÂM THANH — CHỈ SOUND EFFECTS, KHÔNG NHẠC NỀN (mục X)
     - Chỉ phát sau tương tác hợp lệ (unlock khi bấm nút đầu tiên).
     - File mp3 nằm ở assets/audio/ (tự tổng hợp, bản quyền sạch).
     - Nếu file lỗi/bị chặn (vd mở bằng file://): fallback tổng hợp
       bằng WebAudio — trang web vẫn hoạt động đầy đủ.
     - Giới hạn số hiệu ứng đồng thời, chống phát lặp vô ý.
     ============================================================ */
  const AudioMan = (function () {
    const FILES = {
      'gift-shake': 'assets/audio/gift-shake.mp3',
      'gift-open': 'assets/audio/gift-open.mp3',
      'sparkle': 'assets/audio/sparkle.mp3',
      'envelope-open': 'assets/audio/envelope-open.mp3',
      'paper': 'assets/audio/paper.mp3',
      'ending-chime': 'assets/audio/ending-chime.mp3'
    };
    const GAIN = { 'gift-shake': 0.8, 'gift-open': 0.85, 'sparkle': 0.6, 'envelope-open': 0.8, 'paper': 0.65, 'ending-chime': 0.8 };
    const MIN_GAP = { 'gift-shake': 250, 'gift-open': 300, 'sparkle': 150, 'envelope-open': 250, 'paper': 250, 'ending-chime': 500 };
    const MAX_ACTIVE = 4;

    let ctx = null, master = null, unlocked = false;
    let muted = (store.get('qt-sound') === '0');
    const buffers = {}, failed = {}, lastPlay = {};
    let activeCount = 0;
    let noiseBuf = null;

    function supported() { return !!(window.AudioContext || window.webkitAudioContext); }

    function ensureCtx() {
      if (!supported()) return null;
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        try {
          ctx = new AC();
          master = ctx.createGain();
          master.gain.value = muted ? 0 : 0.9;
          master.connect(ctx.destination);
        } catch (e) { ctx = null; return null; }
      }
      if (ctx.state === 'suspended') { ctx.resume().catch(function () { }); }
      return ctx;
    }

    function unlock() {
      if (unlocked) { ensureCtx(); return; }
      unlocked = true;
      ensureCtx();
      preload();
    }

    function preload() {
      if (!ctx) return;
      Object.keys(FILES).forEach(function (name) {
        if (buffers[name] || failed[name]) return;
        fetch(FILES[name])
          .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); })
          .then(function (ab) { return ctx.decodeAudioData(ab); })
          .then(function (buf) { buffers[name] = buf; })
          .catch(function () { failed[name] = true; /* dùng fallback synth */ });
      });
    }

    function play(name, opt) {
      if (muted) return;
      const c = ensureCtx();
      if (!c) return;
      const now = performance.now();
      if (lastPlay[name] && now - lastPlay[name] < (MIN_GAP[name] || 150)) return;
      if (activeCount >= MAX_ACTIVE) return;
      lastPlay[name] = now;
      const when = c.currentTime + ((opt && opt.delay) || 0);
      const g = GAIN[name] || 0.8;
      if (buffers[name]) playBuffer(buffers[name], when, g);
      else synth(name, when, g);
    }

    function playBuffer(buf, when, g) {
      try {
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const gain = ctx.createGain();
        gain.gain.value = g;
        src.connect(gain);
        gain.connect(master);
        activeCount++;
        src.onended = function () { activeCount = Math.max(0, activeCount - 1); };
        src.start(when);
      } catch (e) { }
    }

    /* --- Fallback tổng hợp bằng WebAudio (không cần file) --- */
    function getNoise() {
      if (noiseBuf) return noiseBuf;
      const len = Math.floor(ctx.sampleRate * 1.2);
      noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      return noiseBuf;
    }
    function synth(name, when, g) {
      if (!ctx) return;
      try {
        if (name === 'sparkle') return synthSparkle(when, g);
        if (name === 'ending-chime') return synthChime(when, g);
        synthNoise(name, when, g);
      } catch (e) { /* âm thanh lỗi không được làm hỏng trang */ }
    }
    function synthNoise(name, when, g) {
      const src = ctx.createBufferSource();
      src.buffer = getNoise();
      src.loop = true;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.Q.value = 0.9;
      const gn = ctx.createGain();
      gn.gain.value = 0;
      src.connect(bp); bp.connect(gn); gn.connect(master);
      let dur = 0.5, f0 = 800, f1 = 0, triple = false;
      if (name === 'gift-shake') { dur = 0.9; f0 = 500; triple = true; }
      if (name === 'gift-open') { dur = 0.6; f0 = 400; f1 = 1500; }
      if (name === 'envelope-open') { dur = 0.4; f0 = 1600; }
      if (name === 'paper') { dur = 0.6; f0 = 1100; }
      bp.frequency.setValueAtTime(f0, when);
      if (f1) bp.frequency.linearRampToValueAtTime(f1, when + dur * 0.6);
      const beats = triple ? [0, 0.3, 0.58] : [0];
      beats.forEach(function (off) {
        const t = when + off;
        gn.gain.setValueAtTime(0, t);
        gn.gain.linearRampToValueAtTime(g * 0.55, t + 0.015);
        gn.gain.exponentialRampToValueAtTime(0.001, t + Math.min(0.3, dur - off));
      });
      if (name === 'gift-open') {
        const o = ctx.createOscillator(), og = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(200, when + 0.42);
        o.frequency.exponentialRampToValueAtTime(90, when + 0.6);
        og.gain.setValueAtTime(0.0001, when + 0.42);
        og.gain.linearRampToValueAtTime(g * 0.5, when + 0.46);
        og.gain.exponentialRampToValueAtTime(0.001, when + 0.64);
        o.connect(og); og.connect(master);
        o.start(when + 0.42); o.stop(when + 0.68);
      }
      activeCount++;
      src.onended = function () { activeCount = Math.max(0, activeCount - 1); };
      src.start(when);
      src.stop(when + dur + 0.05);
    }
    function synthSparkle(when, g) {
      [1567.98, 1975.53, 2349.32, 3135.96].forEach(function (f, i) {
        const t = when + i * 0.09;
        const o = ctx.createOscillator(), og = ctx.createGain();
        o.type = 'sine'; o.frequency.value = f;
        og.gain.setValueAtTime(0.0001, t);
        og.gain.linearRampToValueAtTime(g * 0.38 / (1 + i * 0.25), t + 0.012);
        og.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
        o.connect(og); og.connect(master);
        o.start(t); o.stop(t + 0.46);
      });
    }
    function synthChime(when, g) {
      [[523.25, 0], [659.26, 0.13], [783.99, 0.26], [1046.5, 0.48]].forEach(function (nt, i) {
        const t = when + nt[1], f = nt[0];
        const o = ctx.createOscillator(), og = ctx.createGain();
        const o2 = ctx.createOscillator(), og2 = ctx.createGain();
        o.type = 'sine'; o.frequency.value = f;
        o2.type = 'sine'; o2.frequency.value = f * 2;
        og.gain.setValueAtTime(0.0001, t);
        og.gain.linearRampToValueAtTime(g * 0.34 / (1 + i * 0.2), t + 0.02);
        og.gain.exponentialRampToValueAtTime(0.001, t + 1.9);
        og2.gain.setValueAtTime(0.0001, t);
        og2.gain.linearRampToValueAtTime(g * 0.09 / (1 + i * 0.2), t + 0.02);
        og2.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
        o.connect(og); og.connect(master);
        o2.connect(og2); og2.connect(master);
        o.start(t); o.stop(t + 2.1);
        o2.start(t); o2.stop(t + 1.2);
      });
    }

    function setMuted(m) {
      muted = m;
      store.set('qt-sound', m ? '0' : '1');
      if (master && ctx) master.gain.setTargetAtTime(m ? 0 : 0.9, ctx.currentTime, 0.02);
    }

    function init() {
      const btn = $('#btn-sound');
      if (!btn) return;
      const sync = function () {
        btn.setAttribute('aria-pressed', String(!muted));
        btn.setAttribute('aria-label', muted ? (CFG.ui.soundOn || 'Bật âm thanh') : (CFG.ui.soundOff || 'Tắt âm thanh'));
      };
      sync();
      btn.addEventListener('click', function () {
        unlock();
        setMuted(!muted);
        sync();
        if (!muted) play('sparkle', { delay: 0.02 }); // phản hồi ngắn khi bật
      });
      document.addEventListener('visibilitychange', function () {
        if (!document.hidden && ctx && ctx.state === 'suspended') ctx.resume().catch(function () { });
      });
    }

    return { init: init, unlock: unlock, play: play, isSupported: supported };
  })();

  /* ============================================================
     HẠT LẤP LÁNH — canvas 1 lớp, sprite dựng sẵn, pool tái sử dụng.
     Số lượng/taị sinh do profile hiệu năng điều khiển (mục VIII).
     ============================================================ */
  const Particles = (function () {
    const canvas = $('#fx-canvas');
    let ctx2d = null;
    if (canvas) { try { ctx2d = canvas.getContext('2d'); } catch (e) { } }
    let dpr = 1, W = 0, H = 0;
    let parts = [];
    let ambient = false, running = false, lastT = 0, lastSpawn = 0, raf = 0;
    let capDpr = 1.5, rateMul = 1;
    let mode = 'off'; // 'off' | 'landing' | 'ending'
    let prof = { burst: 84, ambient: 4.5, landing: 1.4, max: 120 };
    const sprites = {};

    function makeGlowSprite(size, inner, outer) {
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const g = c.getContext('2d');
      const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      grd.addColorStop(0, inner);
      grd.addColorStop(0.55, outer);
      grd.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = grd;
      g.fillRect(0, 0, size, size);
      return c;
    }
    function makeStarSprite(size) {
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const g = c.getContext('2d');
      const r = size / 2;
      const grd = g.createRadialGradient(r, r, 0, r, r, r);
      grd.addColorStop(0, 'rgba(255,244,214,0.85)');
      grd.addColorStop(1, 'rgba(255,244,214,0)');
      g.fillStyle = grd;
      g.beginPath(); g.arc(r, r, r, 0, 6.29); g.fill();
      g.strokeStyle = 'rgba(242,212,155,0.95)';
      g.lineCap = 'round';
      g.lineWidth = Math.max(1.5, size * 0.06);
      g.beginPath();
      g.moveTo(r, r * 0.14); g.lineTo(r, r * 1.86);
      g.moveTo(r * 0.14, r); g.lineTo(r * 1.86, r);
      g.stroke();
      return c;
    }
    function makePetalSprite(size, rgb) {
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const g = c.getContext('2d');
      g.translate(size / 2, size / 2);
      g.rotate(-0.6);
      const grd = g.createLinearGradient(-size / 2, 0, size / 2, 0);
      grd.addColorStop(0, 'rgba(' + rgb + ',0.92)');
      grd.addColorStop(1, 'rgba(' + rgb + ',0.45)');
      g.fillStyle = grd;
      g.beginPath();
      g.ellipse(0, 0, size * 0.32, size * 0.44, 0, 0, 6.29);
      g.fill();
      return c;
    }
    function buildSprites() {
      sprites.star = makeStarSprite(48);
      sprites.dotA = makeGlowSprite(26, 'rgba(233,184,169,0.95)', 'rgba(233,184,169,0.35)');
      sprites.dotB = makeGlowSprite(22, 'rgba(255,250,238,0.95)', 'rgba(255,250,238,0.30)');
      sprites.petalA = makePetalSprite(30, '233,184,169');
      sprites.petalB = makePetalSprite(26, '216,184,217');
    }
    function resize() {
      if (!ctx2d) return;
      dpr = Math.min(window.devicePixelRatio || 1, capDpr);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = Math.max(1, Math.round(W * dpr));
      canvas.height = Math.max(1, Math.round(H * dpr));
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function applyProfile(p) {
      const map = {
        efficient: { burst: 42, ambient: 2.2, landing: 0, max: 60, dpr: 1 },
        balanced: { burst: 84, ambient: 4.5, landing: 1.4, max: 120, dpr: 1.5 },
        high: { burst: 150, ambient: 7.5, landing: 2.4, max: 200, dpr: 2 }
      };
      prof = map[p] || map.balanced;
      capDpr = prof.dpr;
      resize();
      // nếu đang ở chế độ bụi màn đầu mà máy yếu → dừng hẳn vòng lặp hạt
      if (mode === 'landing' && !(prof.landing > 0)) ambient = false;
    }
    function start() {
      if (running || !ctx2d) return;
      running = true;
      lastT = performance.now();
      raf = requestAnimationFrame(loop);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(raf);
      if (ctx2d) ctx2d.clearRect(0, 0, W, H);
    }
    function spawn(x, y, vx, vy, kind, opts) {
      if (parts.length >= prof.max) return;
      opts = opts || {};
      parts.push({
        x: x, y: y, vx: vx, vy: vy,
        life: 0, ttl: opts.ttl || (1.3 + Math.random() * 1.2),
        size: (kind === 'star' ? 15 : kind === 'petal' ? 13 : 10) + Math.random() * 10,
        rot: Math.random() * Math.PI,
        vr: kind === 'petal' ? (Math.random() - 0.5) * 1.2 : (Math.random() - 0.5) * 2.4,
        kind: kind, tw: Math.random() * 6.28, twf: 2 + Math.random() * 3,
        grav: opts.grav != null ? opts.grav : 26,
        sway: opts.sway || 0,
        alphaMul: opts.alphaMul != null ? opts.alphaMul : 1
      });
      if (!running) start();
    }
    function burst(x, y) {
      const count = Math.round(prof.burst * rateMul);
      for (let i = 0; i < count; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.6;
        const sp = 60 + Math.random() * 250;
        spawn(x, y, Math.cos(a) * sp, Math.sin(a) * sp, Math.random() < 0.5 ? 'star' : 'dot');
      }
    }
    function startAmbient(m) {
      mode = m || 'ending';
      if (mode === 'off') { ambient = false; return; }
      if (mode === 'landing' && !(prof.landing > 0)) { ambient = false; return; }
      ambient = true;
      if (!running) start();
    }
    function stopAmbient() { ambient = false; }
    function stopAll() { mode = 'off'; ambient = false; parts.length = 0; stop(); }

    function loop(t) {
      if (!running) return;
      const dt = Math.min((t - lastT) / 1000, 0.05);
      lastT = t;
      if (!document.hidden && ctx2d) {
        if (ambient && !reduceMotionMQ.matches && mode !== 'off') {
          const isLanding = (mode === 'landing');
          const rateBase = isLanding ? prof.landing : prof.ambient;
          if (rateBase > 0) {
            const perSec = Math.max(rateBase * rateMul, 0.1);
            if (t - lastSpawn > 1000 / perSec) {
              lastSpawn = t;
              if (isLanding) {
                // bụi lấp lánh rất khẽ, trôi chậm — chiều sâu không gian
                spawn(Math.random() * W, H * (0.55 + Math.random() * 0.4),
                  (Math.random() - 0.5) * 8, -8 - Math.random() * 12,
                  'dot', { ttl: 3.5 + Math.random() * 2.5, grav: 2, alphaMul: 0.55 });
              } else if (Math.random() < 0.55) {
                // cánh hoa rơi nhẹ từ trên xuống (chỉ màn kết thúc)
                spawn(Math.random() * W, -30,
                  (Math.random() - 0.5) * 16, 26 + Math.random() * 26,
                  'petal', { ttl: 9 + Math.random() * 3, grav: 7, sway: 26, alphaMul: 0.9 });
              } else {
                spawn(Math.random() * W, H * (0.72 + Math.random() * 0.22),
                  (Math.random() - 0.5) * 12, -16 - Math.random() * 24,
                  Math.random() < 0.6 ? 'star' : 'dot');
              }
            }
          }
        }
        ctx2d.clearRect(0, 0, W, H);
        for (let i = parts.length - 1; i >= 0; i--) {
          const p = parts[i];
          p.life += dt;
          if (p.life >= p.ttl || p.y > H + 90) { parts.splice(i, 1); continue; }
          p.vy += (p.grav || 26) * dt;
          p.vx *= (1 - 0.55 * dt);
          const swayV = p.sway ? Math.sin(p.life * 2.2 + p.tw) * p.sway : 0;
          p.x += (p.vx + swayV) * dt; p.y += p.vy * dt;
          p.rot += p.vr * dt;
          const k = p.life / p.ttl;
          const base = p.kind === 'petal' ? 0.75 : (0.55 + 0.45 * Math.sin(p.tw + t * 0.004 * p.twf));
          const alpha = Math.sin(Math.PI * Math.min(k, 1)) * base * p.alphaMul;
          const sp = p.kind === 'star' ? sprites.star
            : p.kind === 'petal' ? (i % 2 ? sprites.petalA : sprites.petalB)
            : (i % 2 ? sprites.dotA : sprites.dotB);
          const s = p.size * (p.kind === 'petal' ? 1 : (1 - k * 0.25));
          ctx2d.globalAlpha = clamp(alpha, 0, 1);
          ctx2d.save();
          ctx2d.translate(p.x, p.y);
          ctx2d.rotate(p.rot);
          ctx2d.drawImage(sp, -s / 2, -s / 2, s, s);
          ctx2d.restore();
        }
        ctx2d.globalAlpha = 1;
      }
      if (!parts.length && !ambient) { stop(); return; }
      raf = requestAnimationFrame(loop);
    }

    window.addEventListener('resize', function () { resize(); });
    buildSprites();
    resize();
    window.__qtParticles = { applyProfile: applyProfile };
    return { burst: burst, startAmbient: startAmbient, stopAmbient: stopAmbient, stopAll: stopAll, applyProfile: applyProfile };
  })();

  /* ============================================================
     HÀNH TRÌNH QUÀ TẶNG (mục IV) — máy trạng thái tuyến tính:
     landing → opening → card → letter (+notes) → ending → farewell
     ============================================================ */
  const Journey = (function () {
    const screens = {};
    $$('.screen').forEach(function (s) { screens[s.dataset.screen] = s; });
    const stage = $('.gift-stage');
    const envStage = $('#env-stage');
    let current = 'landing';
    let phase = 'landing';
    const timers = new Set();

    function after(ms, fn) {
      const id = setTimeout(function () { timers.delete(id); fn(); }, ms);
      timers.add(id);
      return id;
    }
    function clearTimers() { timers.forEach(function (id) { clearTimeout(id); }); timers.clear(); }
    function setInert(el, v) { try { if ('inert' in el) el.inert = v; } catch (e) { } }

    function show(name) {
      const prev = screens[current], next = screens[name];
      if (!next || prev === next) return;
      prev.classList.remove('is-active');
      prev.setAttribute('aria-hidden', 'true');
      setInert(prev, true);
      next.classList.add('is-active');
      next.setAttribute('aria-hidden', 'false');
      setInert(next, false);
      next.scrollTop = 0;
      Perf.freeze(1700);
      current = name;
      const focusEl = next.querySelector('[tabindex="-1"]');
      if (focusEl) setTimeout(function () { try { focusEl.focus({ preventScroll: true }); } catch (e) { } }, 640);
    }

    function goto(name) { phase = name; show(name); }

    /* --- 2. Trình tự mở quà: rung → tháo nơ → ruy băng → nắp mở →
       ánh sáng → thiệp nhỏ trồi ra → hạt lấp lánh → chuyển cảnh --- */
    function openGift() {
      if (phase !== 'landing') return;
      phase = 'opening';
      AudioMan.unlock();
      buzz(12);
      Perf.freeze(4800);
      const btn = $('#btn-open-gift');
      btn.disabled = true;
      stage.classList.add('is-shaking');
      AudioMan.play('gift-shake');
      after(1000, function () { stage.classList.add('bow-off'); });
      after(1600, function () { stage.classList.add('ribbon-off'); });
      after(1850, function () {
        stage.classList.remove('is-shaking');
        stage.classList.add('lid-open');
        AudioMan.play('gift-open');
      });
      after(2550, function () { stage.classList.add('is-lit'); });
      after(2750, function () {
        stage.classList.add('card-peek');
        AudioMan.play('sparkle');
      });
      after(3450, function () {
        const r = stage.getBoundingClientRect();
        Particles.burst(r.left + r.width / 2, r.top + r.height * 0.35);
      });
      after(4300, function () {
        Particles.stopAmbient();
        goto('card');
      });
    }
    function finishOpeningNow() {
      clearTimers();
      stage.classList.remove('is-shaking');
      stage.classList.add('bow-off', 'ribbon-off', 'lid-open', 'is-lit', 'card-peek');
      phase = 'card';
      show('card');
    }

    /* --- 4. Phong bì --- */
    function openLetter() {
      if (envStage.classList.contains('is-opening') || envStage.classList.contains('is-open')) return;
      AudioMan.unlock();
      buzz(10);
      envStage.classList.add('is-opening');
      AudioMan.play('envelope-open');
      after(320, function () {
        envStage.classList.add('is-open');
        AudioMan.play('paper');
      });
      after(1250, function () {
        envStage.classList.add('is-fading');
        after(430, function () {
          envStage.hidden = true;
          $('#letter-article').hidden = false;
          $('#notes-block').hidden = false;
          Perf.freeze(800);
        });
      });
    }

    /* --- 5. Lời nhắn nhỏ (modal mở/đóng/bỏ qua được) --- */
    let modal = null, lastFocus = null;
    function buildModal() {
      modal = document.createElement('div');
      modal.className = 'note-modal';
      modal.id = 'note-modal';
      modal.hidden = true;
      modal.innerHTML =
        '<div class="note-overlay" data-close="1"></div>' +
        '<div class="note-dialog" role="dialog" aria-modal="true" aria-labelledby="note-modal-title">' +
        '<button type="button" class="icon-btn note-close" aria-label="Đóng lời nhắn">' +
        '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>' +
        '</button>' +
        '<h3 id="note-modal-title"></h3>' +
        '<p class="note-body"></p>' +
        '<div class="note-dialog-actions"><button type="button" class="btn btn-soft" data-close="1">Đóng</button></div>' +
        '</div>';
      document.body.appendChild(modal);
      modal.addEventListener('click', function (e) {
        if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-close')) closeNote();
      });
      modal.addEventListener('keydown', function (e) {
        if (e.key !== 'Tab') return;
        const focusables = $$('button, [href], input, select, textarea', modal).filter(function (el) { return !el.disabled; });
        if (!focusables.length) return;
        const first = focusables[0], last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      });
    }
    function openNote(i) {
      const item = (CFG.notes.items || [])[i];
      if (!item || !modal) return;
      lastFocus = document.activeElement;
      $('#note-modal-title').textContent = item.title || '';
      $('.note-body', modal).textContent = interpolate(item.body || '', CTX);
      modal.hidden = false;
      const cl = $('.note-close', modal);
      if (cl) cl.focus();
    }
    function closeNote() {
      if (!modal || modal.hidden) return;
      modal.hidden = true;
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    /* --- Đặt lại toàn bộ hành trình ("Xem lại từ đầu") --- */
    function reset() {
      clearTimers();
      Particles.stopAll();
      closeNote();
      if (Perf.closePanel) Perf.closePanel();
      document.documentElement.classList.add('is-resetting');
      stage.classList.remove('is-shaking', 'bow-off', 'ribbon-off', 'lid-open', 'is-lit', 'card-peek');
      envStage.classList.remove('is-opening', 'is-open', 'is-fading');
      envStage.hidden = false;
      $('#letter-article').hidden = true;
      $('#notes-block').hidden = true;
      $('#btn-open-gift').disabled = false;
      phase = 'landing';
      show('landing');
      setTimeout(function () { Particles.startAmbient('landing'); }, 700);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          document.documentElement.classList.remove('is-resetting');
        });
      });
    }

    function bindEvents() {
      $('#btn-open-gift').addEventListener('click', openGift);
      $('#btn-to-letter').addEventListener('click', function () {
        AudioMan.play('paper');
        goto('letter');
      });
      if (envStage) envStage.addEventListener('click', function (e) {
        if (e.target.closest('.envelope')) openLetter();
      });
      $('#btn-finish').addEventListener('click', function () {
        goto('ending');
        Particles.startAmbient('ending');
        AudioMan.play('ending-chime', { delay: 0.25 });
      });
      $('#btn-replay').addEventListener('click', reset);
      $('#btn-replay-2').addEventListener('click', reset);
      $('#btn-end').addEventListener('click', function () {
        Particles.stopAll();
        goto('farewell');
        Perf.stopMonitor();
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeNote();
      });
      document.addEventListener('visibilitychange', function () {
        // Tab bị ẩn giữa lúc mở quà → khi quay lại, kết thúc luôn trình tự
        if (!document.hidden && phase === 'opening') finishOpeningNow();
      });
    }

    function init() {
      // trạng thái a11y ban đầu: chỉ landing hiển thị
      Object.keys(screens).forEach(function (name) {
        const s = screens[name];
        const active = (name === current);
        s.setAttribute('aria-hidden', String(!active));
        setInert(s, !active);
      });
      buildModal();
      bindEvents();
      setTimeout(function () { Perf.startMonitor(); }, 2200);
      // bụi lấp lánh khẽ ở màn đầu — tự tắt theo profile (efficient = 0)
      setTimeout(function () { Particles.startAmbient('landing'); }, 900);
    }

    return { init: init, openNote: openNote };
  })();

  /* ================= KHỞI TẠO ================= */
  try {
    applyConfig();
  } catch (e) { try { console.error('[Config]', e); } catch (e2) { } }
  try { Perf.init(); } catch (e) { try { console.error('[Perf]', e); } catch (e2) { } }
  try { AudioMan.init(); } catch (e) { try { console.error('[Audio]', e); } catch (e2) { } }
  try { Journey.init(); } catch (e) { try { console.error('[Journey]', e); } catch (e2) { } }
})();