  /* ============================================================
     QUA-TANG-SINH-NHAT-CRUSH — LOGIC
     Gồm: nạp cấu hình, hệ thống tự đánh giá & điều chỉnh hiệu năng
     (mục VIII), âm thanh SFX (mục X), hạt lấp lánh + pháo giấy,
     tilt 3D theo con trỏ, và hành trình quà tặng (mục IV).
     Toàn bộ chạy cục bộ, không gửi dữ liệu đi đâu.
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
    // Nội dung thư (+ --i/--pn cho hiệu ứng từng đoạn hiện lần lượt)
    const body = $('#letter-body');
    if (body) {
      body.textContent = '';
      const paras = CFG.letter.paragraphs || [];
      paras.forEach(function (p, i) {
        const node = document.createElement('p');
        node.textContent = interpolate(p, CTX);
        node.style.setProperty('--i', i);
        body.appendChild(node);
      });
      body.style.setProperty('--pn', paras.length);
      const letterArt = $('#letter-article');
      if (letterArt) letterArt.style.setProperty('--pn', paras.length);
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
     ÂM THANH — SFX + NHẠC NỀN HỘP NHẠC (mục X)
     - Chỉ phát sau tương tác hợp lệ (unlock khi bấm nút đầu tiên).
     - File mp3 nằm ở assets/audio/ (tự tổng hợp, bản quyền sạch).
     - Nếu file lỗi/bị chặn (vd mở bằng file://): fallback tổng hợp
       bằng WebAudio — trang web vẫn hoạt động đầy đủ.
     - Giới hạn số hiệu ứng đồng thời, chống phát lặp vô ý.
     - BGM: hộp nhạc waltz 3/4 tự sáng tác, loop seamless (wrap-tail),
       âm lượng nền rất êm (-24 dBFS), fade-in sau unlock, fade-out
       khi tắt âm thanh hoặc bấm "Kết thúc". Tab ẩn -> dừng toàn bộ
       AudioContext (tiết kiệm pin), quay lại -> chạy tiếp.
     ============================================================ */
  const AudioMan = (function () {
    const FILES = {
      'gift-shake': 'assets/audio/gift-shake.mp3',
      'gift-open': 'assets/audio/gift-open.mp3',
      'sparkle': 'assets/audio/sparkle.mp3',
      'envelope-open': 'assets/audio/envelope-open.mp3',
      'paper': 'assets/audio/paper.mp3',
      'ending-chime': 'assets/audio/ending-chime.mp3',
      'heart-collect': 'assets/audio/heart-collect.mp3',
      'snake-complete': 'assets/audio/snake-complete.mp3'
    };
    const GAIN = { 'gift-shake': 0.5, 'gift-open': 0.5, 'sparkle': 0.38, 'envelope-open': 0.5, 'paper': 0.45, 'ending-chime': 0.5, 'heart-collect': 0.5, 'snake-complete': 0.55 };
    const MIN_GAP = { 'gift-shake': 250, 'gift-open': 300, 'sparkle': 150, 'envelope-open': 250, 'paper': 250, 'ending-chime': 500, 'heart-collect': 120, 'snake-complete': 900 };
    const MAX_ACTIVE = 4;

    /* --- Nhạc nền hộp nhạc (loop seamless) --- */
    const BGM_FILE = 'assets/audio/bgm-loop.mp3';
    const BGM_LEVEL = 0.3;                 // nhân thêm trên master (0.75) — nền lullaby rất êm
    let ctx = null, master = null, unlocked = false;
    let muted = (store.get('qt-sound') === '0');
    const buffers = {}, failed = {}, lastPlay = {};
    let activeCount = 0;
    let noiseBuf = null;
    let bgmBuf = null, bgmSrc = null, bgmGain = null, bgmOn = false, bgmWanted = false;

    function supported() { return !!(window.AudioContext || window.webkitAudioContext); }

    function ensureCtx() {
      if (!supported()) return null;
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        try {
          ctx = new AC();
          master = ctx.createGain();
          master.gain.value = muted ? 0 : 0.75;
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
      // nhạc nền khởi động cùng trải nghiệm (sau cử chỉ đầu tiên)
      if (!muted) bgmStart();
    }

    /* --- BGM: decode một lần, loop bằng AudioBufferSource (chính xác tới mẫu) --- */
    function bgmStart() {
      bgmWanted = true;
      const c = ctx;
      if (!c || bgmSrc) return;
      if (muted) return;
      if (!bgmBuf) {
        fetch(BGM_FILE)
          .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); })
          .then(function (ab) { return c.decodeAudioData(ab); })
          .then(function (buf) { bgmBuf = buf; bgmStart(); })
          .catch(function () { /* không có nhạc nền vẫn chơi được */ });
        return;
      }
      try {
        bgmSrc = c.createBufferSource();
        bgmSrc.buffer = bgmBuf;
        bgmSrc.loop = true;
        bgmGain = c.createGain();
        bgmGain.gain.value = 0.0001;
        bgmGain.gain.setTargetAtTime(BGM_LEVEL, c.currentTime, 0.8);   // fade-in ~2s
        bgmSrc.connect(bgmGain);
        bgmGain.connect(master);
        bgmSrc.onended = function () { if (bgmSrc === null) return; };
        bgmSrc.start(0);
        bgmOn = true;
      } catch (e) { bgmSrc = null; bgmOn = false; }
    }
    function bgmStop(fadeSec) {
      bgmWanted = false;
      if (!bgmSrc || !ctx) { bgmOn = false; return; }
      const t = ctx.currentTime;
      try {
        bgmGain.gain.cancelScheduledValues(t);
        bgmGain.gain.setTargetAtTime(0.0001, t, Math.max(0.05, (fadeSec || 1) / 3));
        const s = bgmSrc;
        s.stop(t + (fadeSec || 1) + 0.15);
        s.onended = function () {
          try { s.disconnect(); } catch (e) { }
        };
      } catch (e) { }
      bgmSrc = null; bgmGain = null; bgmOn = false;
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
    /* Cùng "tính cách" với bản mp3 v2: mode không hài hòa (gõ gỗ),
       chuông beating, sột giấy stick-slip. Chỉ chạy khi mp3 lỗi/bị chặn. */
    function getNoise() {
      if (noiseBuf) return noiseBuf;
      const len = Math.floor(ctx.sampleRate * 1.2);
      noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      return noiseBuf;
    }
    function outNode(pan) {
      if (ctx.createStereoPanner) {
        const p = ctx.createStereoPanner();
        p.pan.value = Math.max(-1, Math.min(1, pan));
        p.connect(master);
        return p;
      }
      return master;
    }
    /* Cú gõ modal: các mode tần số lệch (không phải bội số), decay riêng, pitch drop lúc va chạm */
    function hitModal(when, freqs, amp, tau, pan, drop) {
      freqs.forEach(function (f0, i) {
        const o = ctx.createOscillator(), og = ctx.createGain();
        const dur = Math.min(0.5, tau * 4 / (1 + 1.1 * i));
        o.type = 'sine';
        o.frequency.setValueAtTime(f0 * (1 + (drop ? 0.06 : 0.015)), when);
        o.frequency.exponentialRampToValueAtTime(f0, when + 0.05);
        og.gain.setValueAtTime(0.0001, when);
        og.gain.linearRampToValueAtTime(amp / (1 + 1.35 * i), when + 0.004);
        og.gain.exponentialRampToValueAtTime(0.0008, when + dur);
        o.connect(og); og.connect(outNode(pan));
        track(o);
        o.start(when); o.stop(when + dur + 0.05);
      });
    }
    /* Nốt chuông: partial không hài hòa kiểu chuông thật, lệch tần khẽ (beating) */
    function bellTone(when, f0, amp, tau, pan) {
      [[1.0, 1], [2.0, 0.4], [2.74, 0.22], [3.76, 0.12]].forEach(function (pr, i) {
        const o = ctx.createOscillator(), og = ctx.createGain();
        const dur = Math.min(3.2, tau * 3.2 / (1 + 1.1 * i));
        o.type = 'sine';
        o.frequency.value = f0 * pr[0] * (1 + (i % 2 ? 0.0016 : -0.0016));
        og.gain.setValueAtTime(0.0001, when);
        og.gain.linearRampToValueAtTime(amp * pr[1], when + 0.008);
        og.gain.exponentialRampToValueAtTime(0.0008, when + dur);
        o.connect(og); og.connect(outNode(pan));
        track(o);
        o.start(when); o.stop(when + dur + 0.05);
      });
    }
    /* Sột giấy stick-slip: nhiễu bandpass với nhiều bump ngẫu nhiên kế tiếp */
    function rustle(when, dur, fLo, fHi, amp, pan, bumps) {
      const src = ctx.createBufferSource();
      src.buffer = getNoise();
      src.loop = true;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime((fLo + fHi) / 2, when);
      bp.Q.value = 1.1;
      const gn = ctx.createGain();
      gn.gain.setValueAtTime(0.0001, when);
      const nb = bumps || 4;
      for (let i = 1; i <= nb; i++) {
        const t = when + (dur * i) / (nb + 1);
        gn.gain.linearRampToValueAtTime(amp * (0.5 + Math.random() * 0.5), t);
        gn.gain.exponentialRampToValueAtTime(Math.max(0.0009, amp * 0.12), t + dur / (nb + 1) * 0.7);
      }
      gn.gain.linearRampToValueAtTime(0.0001, when + dur);
      src.connect(bp); bp.connect(gn); gn.connect(outNode(pan));
      track(src);
      src.start(when); src.stop(when + dur + 0.05);
    }
    /* Đếm node đang phát cho MAX_ACTIVE (đồng bộ với nhánh phát mp3) */
    function track(node) {
      activeCount++;
      node.onended = function () { activeCount = Math.max(0, activeCount - 1); };
    }
    function synth(name, when, g) {
      if (!ctx) return;
      try {
        if (name === 'gift-shake') {
          [0, 0.3, 0.58].forEach(function (off, i) {
            hitModal(when + off, [96, 187, 312, 470], g * 0.6, 0.05, i % 2 ? 0.25 : -0.25, true);
            rustle(when + off + 0.004, 0.15, 500, 3400, g * 0.8, i % 2 ? 0.5 : -0.4, 5);
          });
        } else if (name === 'gift-open') {
          rustle(when, 0.42, 320, 1500, g * 0.7, 0.05, 3);
          hitModal(when + 0.43, [520, 810, 1240], g * 0.5, 0.012, 0.1, false);
          hitModal(when + 0.455, [82, 132, 198], g * 0.8, 0.11, 0, true);
          rustle(when + 0.55, 0.4, 2400, 6200, g * 0.22, 0.3, 2);
        } else if (name === 'envelope-open') {
          rustle(when, 0.16, 900, 3800, g * 0.7, -0.05, 3);
          rustle(when + 0.16, 0.15, 1000, 3600, g * 0.8, 0.08, 4);
          rustle(when + 0.31, 0.09, 300, 1000, g * 0.5, 0.2, 2);
          hitModal(when + 0.315, [148, 262, 410], g * 0.4, 0.05, 0, true);
          rustle(when + 0.52, 0.2, 1400, 3200, g * 0.2, 0.1, 2);
        } else if (name === 'paper') {
          [[0.0, 0.16, 1350, -0.2], [0.15, 0.13, 1850, 0.45], [0.27, 0.17, 1650, -0.4], [0.43, 0.12, 2300, 0.25], [0.56, 0.22, 1450, 0.0]]
            .forEach(function (s) { rustle(when + s[0], s[1], s[2] * 0.5, s[2] * 1.6, g * 0.75, s[3], 5); });
        } else if (name === 'sparkle') {
          [[1567.98, 0.0, -0.15], [2093.0, 0.095, 0.15], [2349.32, 0.175, 0.0], [2793.83, 0.27, 0.3], [3135.96, 0.38, 0.5]]
            .forEach(function (nt) { bellTone(when + nt[1], nt[0], g * 0.4, 0.3, nt[2]); });
        } else if (name === 'heart-collect') {
          hitModal(when, [210, 330, 520], g * 0.5, 0.035, 0, true);
          bellTone(when + 0.025, 1318.51, g * 0.5, 0.3, 0.05);
          bellTone(when + 0.11, 1567.98, g * 0.3, 0.22, -0.05);
        } else if (name === 'snake-complete') {
          [[1046.5, 0.0, -0.2], [1318.51, 0.13, 0.25], [1567.98, 0.26, 0.1]]
            .forEach(function (nt) { bellTone(when + nt[1], nt[0], g * 0.4, 0.8, nt[2]); });
          bellTone(when + 0.44, 2093.0, g * 0.42, 1.3, 0);
          bellTone(when + 0.44, 523.25, g * 0.3, 1.0, 0);
        } else if (name === 'ending-chime') {
          [[523.25, 0.0, -0.2], [659.26, 0.17, 0.25], [783.99, 0.34, -0.1], [1046.5, 0.62, 0.15]]
            .forEach(function (nt) { bellTone(when + nt[1], nt[0], g * 0.42, 1.5, nt[2]); });
          bellTone(when + 0.95, 1318.51, g * 0.1, 0.9, 0);
        } else {
          rustle(when, 0.5, 800, 2000, g * 0.6, 0, 3);
        }
      } catch (e) { /* âm thanh lỗi không được làm hỏng trang */ }
    }

    function setMuted(m) {
      muted = m;
      store.set('qt-sound', m ? '0' : '1');
      if (master && ctx) master.gain.setTargetAtTime(m ? 0 : 0.9, ctx.currentTime, 0.02);
      if (m) { bgmStop(0.4); bgmWanted = true; }   // tắt tiếng nhưng vẫn "muốn" nhạc khi bật lại
      else bgmStart();
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
        if (!ctx) return;
        if (document.hidden) {
          if (ctx.state === 'running') ctx.suspend().catch(function () { });  // tab ẩn: dừng toàn bộ âm thanh
        } else if (ctx.state === 'suspended') ctx.resume().catch(function () { });
      });
    }

    if (/(?:\?|&|#)e2e=1/.test(window.location.search + window.location.hash)) {
      window.__audioTest = {
        bgmOn: function () { return bgmOn; },
        muted: function () { return muted; },
        ctxState: function () { return ctx ? ctx.state : 'none'; }
      };
    }

    return { init: init, unlock: unlock, play: play, isSupported: supported,
      bgmEnd: function () { bgmStop(1.6); },
      bgmReplay: function () { bgmWanted = true; if (!muted) bgmStart(); } };
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
    function makeRibbonSprite(w) {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = Math.max(6, Math.round(w * 0.4));
      const g = c.getContext('2d');
      const cw = c.width, ch = c.height, r = Math.min(4, ch / 2);
      const grd = g.createLinearGradient(0, 0, 0, ch);
      grd.addColorStop(0, '#F8E2BC');
      grd.addColorStop(0.5, '#F2D49B');
      grd.addColorStop(1, '#DFB97E');
      g.fillStyle = grd;
      g.beginPath();
      g.moveTo(r, 0); g.lineTo(cw - r, 0); g.quadraticCurveTo(cw, 0, cw, r);
      g.lineTo(cw, ch - r); g.quadraticCurveTo(cw, ch, cw - r, ch);
      g.lineTo(r, ch); g.quadraticCurveTo(0, ch, 0, ch - r);
      g.lineTo(0, r); g.quadraticCurveTo(0, 0, r, 0);
      g.closePath(); g.fill();
      g.strokeStyle = 'rgba(122, 92, 58, 0.20)';
      g.lineWidth = 1;
      g.stroke();
      return c;
    }
    function buildSprites() {
      sprites.star = makeStarSprite(48);
      sprites.dotA = makeGlowSprite(26, 'rgba(233,184,169,0.95)', 'rgba(233,184,169,0.35)');
      sprites.dotB = makeGlowSprite(22, 'rgba(255,250,238,0.95)', 'rgba(255,250,238,0.30)');
      sprites.petalA = makePetalSprite(30, '233,184,169');
      sprites.petalB = makePetalSprite(26, '216,184,217');
      sprites.ribbon = makeRibbonSprite(30);
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
      // Đồng bộ hệ số giảm tải runtime (máy đột ngột quá tải → ít hạt hơn)
      const rt = document.documentElement.dataset.rt;
      rateMul = rt === 'mid' ? 0.7 : rt === 'low' ? 0.5 : 1;
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
        size: (kind === 'star' ? 15 : kind === 'petal' ? 13 : kind === 'ribbon' ? 12 : 10) + Math.random() * 10,
        rot: Math.random() * Math.PI,
        vr: kind === 'petal' ? (Math.random() - 0.5) * 1.2
          : kind === 'ribbon' ? (Math.random() - 0.5) * 1.8
          : (Math.random() - 0.5) * 2.4,
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
    /* Mảnh ruy băng văng ra đúng khoảnh khắc ruy băng tuột khỏi hộp */
    function debris(x, y) {
      const count = Math.round((14 + Math.random() * 6) * rateMul);
      for (let i = 0; i < count; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
        const sp = 120 + Math.random() * 220;
        spawn(x + (Math.random() - 0.5) * 60, y,
          Math.cos(a) * sp, Math.sin(a) * sp, 'ribbon',
          { ttl: 1.2 + Math.random() * 0.9, grav: 110, sway: 8 });
      }
    }
    /* Pháo giấy mừng màn kết — hỗn hợp cánh hoa, ruy băng, sao, bụi sáng */
    function confetti(x, y) {
      const count = Math.round(prof.burst * 0.95 * rateMul);
      for (let i = 0; i < count; i++) {
        const r = Math.random();
        const kind = r < 0.34 ? 'petal' : r < 0.58 ? 'ribbon' : r < 0.8 ? 'star' : 'dot';
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.0;
        const sp = 130 + Math.random() * 300;
        spawn(x + (Math.random() - 0.5) * 90, y + (Math.random() - 0.5) * 40,
          Math.cos(a) * sp, Math.sin(a) * sp, kind,
          { ttl: 2.1 + Math.random() * 1.7, grav: kind === 'ribbon' ? 60 : 34, sway: kind === 'petal' ? 20 : 8 });
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
          const base = p.kind === 'petal' ? 0.75
            : p.kind === 'ribbon' ? 0.85
            : (0.55 + 0.45 * Math.sin(p.tw + t * 0.004 * p.twf));
          const alpha = Math.sin(Math.PI * Math.min(k, 1)) * base * p.alphaMul;
          const sp = p.kind === 'star' ? sprites.star
            : p.kind === 'petal' ? (i % 2 ? sprites.petalA : sprites.petalB)
            : p.kind === 'ribbon' ? sprites.ribbon
            : (i % 2 ? sprites.dotA : sprites.dotB);
          const s = p.size * (p.kind === 'petal' ? 1 : (1 - k * 0.25));
          ctx2d.globalAlpha = clamp(alpha, 0, 1);
          ctx2d.save();
          ctx2d.translate(p.x, p.y);
          ctx2d.rotate(p.rot);
          if (p.kind === 'ribbon') {
            const sw = s * 1.7, sh = s * 0.62;
            ctx2d.drawImage(sp, -sw / 2, -sh / 2, sw, sh);
          } else {
            ctx2d.drawImage(sp, -s / 2, -s / 2, s, s);
          }
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
    return { burst: burst, debris: debris, confetti: confetti, startAmbient: startAmbient, stopAmbient: stopAmbient, stopAll: stopAll, applyProfile: applyProfile };
  })();

  /* ============================================================
     TILT 3D THEO CON TRỎ — hộp quà & thẻ lời nhắn nghiêng theo chuột.
     Chỉ bật cho pointer fine (chuột/bút), tắt khi reduced-motion.
     Ghi biến CSS qua rAF (không gây reflow) — chi phí gần bằng 0.
     ============================================================ */
  const Tilt = (function () {
    const fine = window.matchMedia ? window.matchMedia('(pointer: fine)').matches : false;
    function bindGift() {
      if (!fine || reduceMotionMQ.matches) return;
      const stage = $('.gift-stage'), scene = $('.gift-scene');
      if (!stage || !scene) return;
      let raf = 0, tx = 0, ty = 0, sx = 0;
      function paint() {
        raf = 0;
        scene.style.setProperty('--tiltX', tx.toFixed(2) + 'deg');
        scene.style.setProperty('--tiltY', ty.toFixed(2) + 'deg');
        stage.style.setProperty('--shiftX', sx.toFixed(1) + 'px');
      }
      stage.addEventListener('pointermove', function (e) {
        const r = stage.getBoundingClientRect();
        if (!r.width || !r.height) return;
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        tx = clamp(px, -0.5, 0.5) * 16;
        ty = clamp(py, -0.5, 0.5) * -11;
        sx = tx * -0.9;
        if (!raf) raf = requestAnimationFrame(paint);
      });
      stage.addEventListener('pointerleave', function () {
        tx = 0; ty = 0; sx = 0;
        if (!raf) raf = requestAnimationFrame(paint);
      });
    }
    function bindNotes() {
      if (!fine || reduceMotionMQ.matches) return;
      $$('.note-card').forEach(function (card) {
        let raf = 0, nx = 0, ny = 0;
        function paint() {
          raf = 0;
          card.style.setProperty('--nx', nx.toFixed(2) + 'deg');
          card.style.setProperty('--ny', ny.toFixed(2) + 'deg');
        }
        card.addEventListener('pointermove', function (e) {
          const r = card.getBoundingClientRect();
          if (!r.width || !r.height) return;
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          ny = clamp(px, -0.5, 0.5) * 14;
          nx = clamp(py, -0.5, 0.5) * -12;
          if (!raf) raf = requestAnimationFrame(paint);
        });
        card.addEventListener('pointerleave', function () {
          nx = 0; ny = 0;
          if (!raf) raf = requestAnimationFrame(paint);
        });
      });
    }
    return { init: function () { bindGift(); bindNotes(); } };
  })();

  /* ============================================================
     HÀNH TRÌNH QUÀ TẶNG (mục IV) — máy trạng thái tuyến tính:
     landing → opening → card → letter (+notes) → ending → farewell
     (v9: thử thách snake đã NGẮT KHỎI LUỒNG theo yêu cầu — màn kết thúc mở
     cho mọi người. Code snake vẫn còn nhưng không màn nào dẫn tới nữa; muốn
     bật lại chỉ cần trỏ btn-finish về goto('snake-intro') và khôi phục gate.)
     ============================================================ */
  const Journey = (function () {
    const SnakeGame = window.SnakeGame || null;
    const screens = {};
    $$('.screen').forEach(function (s) { screens[s.dataset.screen] = s; });
    const stage = $('.gift-stage');
    const envStage = $('#env-stage');
    let current = 'landing';
    let phase = 'landing';
    let snakeDone = false;   // chỉ Snake hoàn thành mới đặt được
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
      // bỏ focus khỏi phần tử sắp bị ẩn — tránh cảnh báo aria-hidden mất focus
      if (prev.contains(document.activeElement)) {
        try { document.activeElement.blur(); } catch (e) { }
      }
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

    function goto(name) {
      // rời màn snake: dừng vòng lặp game (không tốn tài nguyên)
      if (current === 'snake' && SnakeGame) SnakeGame.stop();
      phase = name; show(name);
    }

    /* --- VÀO MÀN KẾT THÚC (v9): mở cho mọi người, kèm ăn mừng pháo giấy --- */
    function enterEnding() {
      goto('ending');
      Particles.startAmbient('ending');
      AudioMan.play('ending-chime', { delay: 0.25 });
      after(320, function () {
        Particles.confetti(window.innerWidth / 2, window.innerHeight * 0.58);
      });
      after(950, function () {
        Particles.confetti(window.innerWidth * 0.24, window.innerHeight * 0.42);
      });
      after(1650, function () {
        Particles.confetti(window.innerWidth * 0.76, window.innerHeight * 0.44);
      });
    }

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
      after(1600, function () {
        stage.classList.add('ribbon-off');
        const r0 = stage.getBoundingClientRect();
        Particles.debris(r0.left + r0.width / 2, r0.top + r0.height * 0.42);
      });
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
          const art = $('#letter-article');
          art.hidden = false;
          requestAnimationFrame(function () { art.classList.add('is-in'); });
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
      const letterArt = $('#letter-article');
      if (letterArt) letterArt.classList.remove('is-in');
      const scene = $('.gift-scene');
      if (scene) { scene.style.removeProperty('--tiltX'); scene.style.removeProperty('--tiltY'); }
      stage.style.removeProperty('--shiftX');
      envStage.classList.remove('is-opening', 'is-open', 'is-fading');
      envStage.hidden = false;
      $('#letter-article').hidden = true;
      $('#notes-block').hidden = true;
      $('#btn-open-gift').disabled = false;
      // đặt lại minigame: thu hồi khóa ending, dừng vòng lặp game
      snakeDone = false;
      if (SnakeGame) SnakeGame.stop();
      // hộp nhạc quay lại cùng hành trình khi xem lại từ đầu
      try { AudioMan.bgmReplay(); } catch (e) { }
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
      /* Nút "đi tiếp" dẫn THẲNG tới màn kết thúc (v9: bỏ thử thách snake) */
      $('#btn-finish').addEventListener('click', function () {
        AudioMan.play('paper');
        enterEnding();
      });
      $('#btn-snake-start').addEventListener('click', function () {
        if (!SnakeGame) return;
        AudioMan.unlock();
        buzz(10);
        goto('snake');
        SnakeGame.begin();
      });
      /* Mount minigame một lần — hoàn thành 5/5 mới mở khóa màn kết thúc */
      const snakeRoot = $('#snake-root');
      if (snakeRoot && SnakeGame) {
        SnakeGame.mount(snakeRoot, {
          onCollect: function (n) {
            AudioMan.play('heart-collect');
            buzz(12);
            void n;
          },
          onCrash: function () { buzz(26); },
          onWin: function () {
            if (snakeDone) return;          // chống kích hoạt trùng lặp
            snakeDone = true;
            AudioMan.play('snake-complete', { delay: 0.05 });
            // để hiệu ứng 5/5 + thông điệp chúc mừng chạy xong tự nhiên rồi chuyển cảnh
            after(1500, enterEnding);
          }
        });
      }
      $('#btn-replay').addEventListener('click', reset);
      $('#btn-replay-2').addEventListener('click', reset);
      $('#btn-end').addEventListener('click', function () {
        AudioMan.bgmEnd();               // hộp nhạc khép lại cùng màn cuối
        Particles.stopAll();
        goto('farewell');
        after(850, function () { Particles.startAmbient('landing'); });
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
  try { Tilt.init(); } catch (e) { try { console.error('[Tilt]', e); } catch (e2) { } }

  /* Ánh sáng champagne mềm theo con trỏ — chỉ máy tính có chuột chính xác,
     tắt khi người dùng chọn giảm chuyển động. Thuần trang trí, không chặn tương tác. */
  (function () {
    try {
      if (!window.matchMedia || !window.matchMedia('(pointer: fine) and (hover: hover)').matches) return;
      if (reduceMotionMQ.matches) return;
      const el = document.createElement('div');
      el.className = 'cursor-glow';
      el.setAttribute('aria-hidden', 'true');
      document.body.appendChild(el);
      let gx = window.innerWidth / 2, gy = window.innerHeight / 3, tx = gx, ty = gy, raf = 0;
      const tick = function () {
        raf = 0;
        gx += (tx - gx) * 0.14; gy += (ty - gy) * 0.14;
        el.style.transform = 'translate(' + Math.round(gx - 240) + 'px,' + Math.round(gy - 240) + 'px)';
        if (Math.abs(tx - gx) + Math.abs(ty - gy) > 0.8) raf = requestAnimationFrame(tick);
      };
      window.addEventListener('pointermove', function (e) {
        tx = e.clientX; ty = e.clientY;
        if (!raf) raf = requestAnimationFrame(tick);
      }, { passive: true });
    } catch (e) { /* trang trí — lỗi thì bỏ qua */ }
  })();
})();