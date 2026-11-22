(function () {
  'use strict';

  function SnakeGameFactory() {
    let canvas = null, ctx = null, view = { w: 0, h: 0 }, cbs = {};
    let active = false;            // có phiên chơi đang mở (giữa begin và stop)
    let running = false, rafId = null, last = 0;   // vòng lặp RAF
    let beginTimer = 0, beginToken = 0;
    let bound = [];                // danh sách listener đã đăng ký

    // Hệ toạ độ world — TỶ LỆ 4:5 (portrait) khớp CSS .snake-board.
    const W = 400, H = 500;
    const WALL = 13;               // biên va chạm
    const SEG_SPACING = 11;        // khoảng cách cố định giữa các đoạn thân
    const BASE_SEGS = 14;          // số đoạn thân ban đầu (kể cả đầu)
    const HEAD_R = 14, BODY_R = 11;
    const HEART_HIT = 28;          // bán kính thu thập tim

    let head = { x: W * 0.5, y: H * 0.5 };
    let dir = { x: 1, y: 0 }, nextDir = { x: 1, y: 0 };
    let trail = [];                // polyline vị trí đầu rắn (mới → cũ)
    let segments = [];             // thân rắn giãn cách đều theo cung
    let segCount = BASE_SEGS;
    let heart = null, collected = 0;
    const TARGET = 5;

    let paused = false;
    let crashShown = false, winShown = false;
    let swipeStart = null;
    let resumeBtn = null, retryBtn = null;
    // Điều khiển mặc định: cần vuốt nổi (xuất hiện ngay dưới ngón tay).
    // 'dpad' = dùng 4 nút mũi tên cố định. Vuốt trên sân luôn dùng được ở cả 2 chế độ.
    let controlMode = 'stick';
    try {
      if (window.localStorage) {
        const saved = window.localStorage.getItem('qt-snake-control');
        if (saved === 'stick' || saved === 'dpad') controlMode = saved;
      }
    } catch (e) { /* chế độ riêng tư: dùng mặc định */ }
    let snakeRoot = null, joystick = null, joyKnob = null, controlBtns = [];
    const JOY_RADIUS = 46;   // bán kính cần (px CSS)
    const JOY_DEAD = 8;      // vùng chết: chạm nhẹ không đổi hướng
    let joyPointerId = null;

    /* ---------- Kích thước canvas ---------- */
    function resize() {
      if (!canvas || !ctx) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;   // màn còn ẩn → giữ kích thước cũ
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      view.w = rect.width;
      view.h = rect.height;
    }

    /* ---------- Thân rắn: giãn cách đều theo quãng đường ---------- */
    function updateSegments() {
      segments = [];
      if (!trail.length) return;
      segments.push({ x: trail[0].x, y: trail[0].y });   // head
      let target = SEG_SPACING;
      let acc = 0;
      let prev = trail[0];
      for (let i = 1; i < trail.length && segments.length < segCount; i++) {
        const cur = trail[i];
        const d = Math.hypot(cur.x - prev.x, cur.y - prev.y);
        while (segments.length < segCount && d > 0 && acc + d >= target) {
          const t = (target - acc) / d;
          segments.push({
            x: prev.x + (cur.x - prev.x) * t,
            y: prev.y + (cur.y - prev.y) * t
          });
          target += SEG_SPACING;
        }
        acc += d;
        prev = cur;
      }
      // cắt bớt polyline cho khỏi phình vô hạn
      let keep = 1;
      acc = 0;
      prev = trail[0];
      for (let i = 1; i < trail.length; i++) {
        const cur = trail[i];
        acc += Math.hypot(cur.x - prev.x, cur.y - prev.y);
        prev = cur;
        keep = i + 1;
        if (acc >= (segCount + 1) * SEG_SPACING) break;
      }
      if (keep < trail.length) trail = trail.slice(0, keep);
    }

    /* ---------- Trái tim: spawn an toàn, không chồng thân ---------- */
    function freeSpot(x, y) {
      for (let i = 0; i < segments.length; i++) {
        if (Math.hypot(segments[i].x - x, segments[i].y - y) < 30) return false;
      }
      return true;
    }
    function spawnHeart() {
      const margin = 30;
      for (let tries = 0; tries < 300; tries++) {
        const x = margin + Math.random() * (W - margin * 2);
        const y = margin + Math.random() * (H - margin * 2);
        if (freeSpot(x, y)) { heart = { x: x, y: y, t: 0 }; return; }
      }
      // vòng quét lưới xác định (không lặp vô hạn)
      for (let gy = margin; gy <= H - margin; gy += 24) {
        for (let gx = margin; gx <= W - margin; gx += 24) {
          if (freeSpot(gx, gy)) { heart = { x: gx, y: gy, t: 0 }; return; }
        }
      }
      // board gần kín: chọn điểm còn thoáng nhất, an toàn để tiếp tục
      heart = { x: W / 2, y: H / 2, t: 0 };
    }

    /* ---------- HUD ---------- */
    function updateHUD() {
      const count = document.getElementById('snake-count');
      if (count) count.textContent = collected + '/' + TARGET;
      const hearts = document.querySelector('[data-snake-progress]');
      if (hearts) {
        hearts.querySelectorAll('.heart-slot').forEach(function (sl, i) {
          if (i < collected) sl.classList.add('is-filled');
          else sl.classList.remove('is-filled');
        });
      }
    }

    /* ---------- Overlay ---------- */
    function hideOverlays() {
      ['snake-ov-ready', 'snake-ov-paused', 'snake-ov-crashed', 'snake-ov-win'].forEach(function (id) {
        const el = document.getElementById(id);
        if (el) el.hidden = true;
      });
    }
    function showOverlay(cardId) {
      const ov = document.getElementById('snake-overlay');
      const card = document.getElementById(cardId);
      hideOverlays();
      if (ov) ov.hidden = false;
      if (card) card.hidden = false;
    }
    function hideOverlay() {
      const ov = document.getElementById('snake-overlay');
      if (ov) ov.hidden = true;
    }

    /* ---------- Điều hướng ---------- */
    function setDir(d) {
      if (d.x === -dir.x && d.y === -dir.y) return;   // cấm quay đầu 180°
      nextDir = d;
    }

    /* Vuốt lệch (đường chéo, tay run) → tự snap về hướng ngang/dọc gần nhất.
       So sánh |dx| và |dy| chính là phân vùng 45° quanh 4 trục. */
    function snapDir(dx, dy) {
      return Math.abs(dx) >= Math.abs(dy)
        ? { x: dx >= 0 ? 1 : -1, y: 0 }
        : { x: 0, y: dy >= 0 ? 1 : -1 };
    }

    /* ---------- Chọn chế độ điều khiển: cần vuốt nổi (mặc định) / 4 nút ---------- */
    function applyControlMode(mode) {
      controlMode = (mode === 'dpad') ? 'dpad' : 'stick';
      if (snakeRoot && snakeRoot.setAttribute) snakeRoot.setAttribute('data-control', controlMode);
      for (let i = 0; i < controlBtns.length; i++) {
        const b = controlBtns[i];
        const on = b.getAttribute && b.getAttribute('data-snake-control') === controlMode;
        if (b.setAttribute) b.setAttribute('aria-pressed', on ? 'true' : 'false');
      }
      if (controlMode !== 'stick') hideJoystick();
      try {
        if (window.localStorage) window.localStorage.setItem('qt-snake-control', controlMode);
      } catch (e) { /* chế độ riêng tư: vẫn dùng trong phiên hiện tại */ }
    }
    function onControlModeClick(e) {
      const btn = e.currentTarget;
      const mode = btn && btn.getAttribute ? btn.getAttribute('data-snake-control') : '';
      if (mode === 'stick' || mode === 'dpad') applyControlMode(mode);
    }

    /* ---------- Cần vuốt nổi: đặt đúng điểm chạm, kéo nút theo ngón tay ---------- */
    function showJoystick(clientX, clientY) {
      if (!joystick || !canvas) return;
      const rect = canvas.getBoundingClientRect();
      joyPointerId = null;
      joystick.hidden = false;
      if (joystick.style) {
        joystick.style.left = (clientX - rect.left) + 'px';
        joystick.style.top = (clientY - rect.top) + 'px';
      }
      moveJoystick(clientX, clientY);
    }
    function moveJoystick(clientX, clientY) {
      if (!joyKnob || !canvas || joystick.hidden) return;
      const rect = canvas.getBoundingClientRect();
      const dx = clientX - rect.left - parseFloat(joystick.style.left || '0');
      const dy = clientY - rect.top - parseFloat(joystick.style.top || '0');
      const len = Math.hypot(dx, dy);
      const k = len > JOY_RADIUS ? JOY_RADIUS / len : 1;
      if (joyKnob.style) joyKnob.style.transform = 'translate(' + (dx * k) + 'px,' + (dy * k) + 'px)';
      if (len >= JOY_DEAD) setDir(snapDir(dx, dy));
    }
    function hideJoystick() {
      joyPointerId = null;
      if (joystick) joystick.hidden = true;
      if (joyKnob && joyKnob.style) joyKnob.style.transform = 'translate(0px,0px)';
    }

    function isTypingTarget(el) {
      if (!el) return false;
      const tag = (el.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
      if (el.isContentEditable) return true;
      return false;
    }

    function keyToDir(e) {
      const code = e.code || '';
      const key = (e.key || '').toLowerCase();
      if (code === 'KeyW' || key === 'w') return { x: 0, y: -1 };
      if (code === 'KeyS' || key === 's') return { x: 0, y: 1 };
      if (code === 'KeyA' || key === 'a') return { x: -1, y: 0 };
      if (code === 'KeyD' || key === 'd') return { x: 1, y: 0 };
      if (code === 'ArrowUp' || key === 'arrowup') return { x: 0, y: -1 };
      if (code === 'ArrowDown' || key === 'arrowdown') return { x: 0, y: 1 };
      if (code === 'ArrowLeft' || key === 'arrowleft') return { x: -1, y: 0 };
      if (code === 'ArrowRight' || key === 'arrowright') return { x: 1, y: 0 };
      return null;
    }

    /* ---------- 4 nút mũi tên ảo (cảm ứng) — cùng cổng setDir với bàn phím ---------- */
    const DIR_BY_ATTR = {
      up: { x: 0, y: -1 }, down: { x: 0, y: 1 },
      left: { x: -1, y: 0 }, right: { x: 1, y: 0 }
    };
    function onDpad(e) {
      if (!active || paused || winShown || crashShown) return;
      const btn = e.currentTarget;
      const d = DIR_BY_ATTR[btn && btn.getAttribute ? btn.getAttribute('data-snake-dir') : ''];
      if (!d) return;
      if (e.type === 'pointerdown' && e.preventDefault) e.preventDefault();
      setDir(d);
    }

    function keyHandler(e) {
      if (!active) return;
      if (isTypingTarget(e.target)) return;
      const code = e.code || '';
      const key = (e.key || '').toLowerCase();
      if (code === 'Space' || key === ' ') {
        e.preventDefault();
        togglePause();
        return;
      }
      if (paused || winShown || crashShown) return;
      const d = keyToDir(e);
      if (d) { e.preventDefault(); setDir(d); }
    }

    /* ---------- Vuốt trên sân + cần vuốt nổi (cùng một cổng setDir) ---------- */
    function onPointerDown(e) {
      if (!active || paused || winShown || crashShown) return;
      swipeStart = { x: e.clientX, y: e.clientY };
      if (controlMode === 'stick') {
        showJoystick(e.clientX, e.clientY);
        joyPointerId = (e.pointerId != null) ? e.pointerId : 'mouse';
      }
      if (e.pointerId != null && canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { }
      }
    }
    function onPointerMove(e) {
      if (!active || paused || winShown || crashShown) return;
      if (controlMode !== 'stick' || joystick.hidden) return;
      if (joyPointerId != null && e.pointerId != null && e.pointerId !== joyPointerId) return;
      moveJoystick(e.clientX, e.clientY);
    }
    function onPointerUp(e) {
      if (!active || !swipeStart) { swipeStart = null; hideJoystick(); return; }
      const dx = e.clientX - swipeStart.x;
      const dy = e.clientY - swipeStart.y;
      swipeStart = null;
      if (controlMode === 'stick') hideJoystick();
      if (paused || winShown || crashShown) return;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;   // chạm nhẹ, không phải vuốt
      setDir(snapDir(dx, dy));   // lệch chéo vẫn tự snap về trục gần nhất
    }
    function onPointerCancel() { swipeStart = null; hideJoystick(); }

    /* ---------- Pause / resume ---------- */
    function togglePause() { setPaused(!paused); }
    function setPaused(p) {
      if (!active || winShown || crashShown) return;
      if (paused === p) return;
      paused = p;
      if (p) {
        hideJoystick();
        swipeStart = null;
        running = false;
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        showOverlay('snake-ov-paused');
      } else {
        hideOverlay();
        startLoop();
      }
    }
    function onResumeClick() {
      if (!active) return;
      setPaused(false);
    }
    function onRetryClick() {
      if (!active) return;
      hideOverlay();
      resetState();
      startLoop();
    }

    /* ---------- Kết thúc / thua ---------- */
    function crash() {
      if (crashShown || winShown) return;
      crashShown = true;
      running = false;
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      if (cbs.onCrash) cbs.onCrash();
      showOverlay('snake-ov-crashed');
    }
    function win() {
      if (winShown) return;
      winShown = true;
      running = false;
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      collected = TARGET;
      updateHUD();
      showOverlay('snake-ov-win');
      if (cbs.onWin) cbs.onWin();
    }

    /* ---------- Bước đi (khoảng cách thực, chia nhỏ để không xuyên) ---------- */
    function step(dt) {
      if (paused || winShown || crashShown) return;
      dir = nextDir;
      const dist = 150 * dt;                     // tốc độ không đổi theo thời gian
      const sub = Math.max(1, Math.ceil(dist / 4));
      const sl = dist / sub;
      for (let s = 0; s < sub; s++) {
        const nx = head.x + dir.x * sl;
        const ny = head.y + dir.y * sl;
        if (nx < WALL || nx > W - WALL || ny < WALL || ny > H - WALL) { crash(); return; }
        for (let i = 3; i < segments.length; i++) {
          if (Math.hypot(segments[i].x - nx, segments[i].y - ny) < BODY_R) { crash(); return; }
        }
        head.x = nx; head.y = ny;
        if (heart && Math.hypot(heart.x - nx, heart.y - ny) < HEART_HIT) {
          collected++;
          updateHUD();
          if (cbs.onCollect) cbs.onCollect(collected);
          if (collected >= TARGET) { win(); return; }
          segCount = BASE_SEGS + collected;
          spawnHeart();
        }
      }
      trail.unshift({ x: head.x, y: head.y });
      updateSegments();
    }

    /* ---------- Vẽ ---------- */
    function draw() {
      if (!ctx) return;
      const w = view.w, h = view.h;
      if (w < 2 || h < 2) return;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#FBF6EC';
      ctx.fillRect(0, 0, w, h);
      const scale = Math.min(w / W, h / H);
      const offX = (w - W * scale) / 2;
      const offY = (h - H * scale) / 2;
      ctx.save();
      ctx.translate(offX, offY);
      ctx.scale(scale, scale);

      if (heart) {
        heart.t += 0.04;
        const pulse = 1 + Math.sin(heart.t) * 0.08;
        ctx.save();
        ctx.translate(heart.x, heart.y);
        ctx.scale(pulse, pulse);
        const g = ctx.createRadialGradient(-4, -2, 2, 0, 4, 18);
        g.addColorStop(0, '#F7A9B6');
        g.addColorStop(0.5, '#E8738A');
        g.addColorStop(1, '#B84A60');
        ctx.fillStyle = g;
        ctx.shadowColor = 'rgba(184,74,96,0.35)';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(0, 4);
        ctx.bezierCurveTo(-2, -8, -14, -8, -14, 2);
        ctx.bezierCurveTo(-14, 10, -6, 16, 0, 20);
        ctx.bezierCurveTo(6, 16, 14, 10, 14, 2);
        ctx.bezierCurveTo(14, -8, 2, -8, 0, 4);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.ellipse(-5, -2, 4, 2.5, -0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      const n = segments.length;
      for (let i = n - 1; i >= 0; i--) {
        const seg = segments[i];
        const t = n > 1 ? i / n : 0;
        const r = i === 0 ? HEAD_R : BODY_R;
        const g = ctx.createRadialGradient(seg.x - 3, seg.y - 3, 2, seg.x, seg.y, r);
        if (i === 0) { g.addColorStop(0, '#C9DFC9'); g.addColorStop(1, '#7FA882'); }
        else { g.addColorStop(0, 'hsl(130, 24%, ' + (78 - t * 12) + '%)'); g.addColorStop(1, 'hsl(130, 24%, ' + (52 - t * 12) + '%)'); }
        ctx.fillStyle = g;
        ctx.shadowColor = 'rgba(0,0,0,0.12)';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(seg.x, seg.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      if (n > 0 && segments[0]) {
        const hh = segments[0];
        ctx.fillStyle = '#2a2a2a';
        ctx.beginPath(); ctx.arc(hh.x + dir.x * 5 - dir.y * 4, hh.y + dir.y * 5 + dir.x * 4, 2.4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(hh.x + dir.x * 5 + dir.y * 4, hh.y + dir.y * 5 - dir.x * 4, 2.4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }

    /* ---------- Vòng lặp ---------- */
    function loop(ts) {
      if (!running) return;
      if (!last) last = ts;
      const dt = Math.min((ts - last) / 1000, 0.05);
      last = ts;
      step(dt);
      draw();
      if (running) rafId = requestAnimationFrame(loop);
    }
    function startLoop() {
      if (running || paused || winShown || crashShown) return;
      running = true;
      last = 0;
      rafId = requestAnimationFrame(loop);
    }

    /* ---------- Trạng thái ban đầu ---------- */
    function resetState() {
      collected = 0;
      crashShown = false; winShown = false; paused = false;
      segCount = BASE_SEGS;
      dir = { x: 1, y: 0 }; nextDir = { x: 1, y: 0 };
      head = { x: W * 0.5, y: H * 0.5 };
      trail = [];
      for (let k = 0; k < segCount + 3; k++) {
        trail.push({ x: head.x - k * SEG_SPACING, y: head.y });
      }
      updateSegments();
      spawnHeart();
      updateHUD();
    }

    /* ---------- Vòng đời listener ---------- */
    function addListener(target, type, fn, opts) {
      if (!target) return;
      target.addEventListener(type, fn, opts);
      bound.push({ target: target, type: type, fn: fn, opts: opts });
    }
    function bindAll() {
      if (bound.length) return;
      canvas = document.getElementById('snake-canvas');
      resumeBtn = document.getElementById('snake-btn-resume');
      retryBtn = document.getElementById('snake-btn-retry');
      snakeRoot = document.getElementById('snake-root');
      joystick = document.getElementById('snake-joystick');
      joyKnob = document.getElementById('snake-joystick-knob');
      controlBtns = document.querySelectorAll ? document.querySelectorAll('[data-snake-control]') : [];
      applyControlMode(controlMode);   // đồng bộ class/attr UI với lựa chọn đã lưu
      addListener(canvas, 'pointerdown', onPointerDown, { passive: false });
      addListener(canvas, 'pointermove', onPointerMove, { passive: false });
      addListener(canvas, 'pointerup', onPointerUp, { passive: false });
      addListener(canvas, 'pointercancel', onPointerCancel);
      addListener(document, 'keydown', keyHandler);
      addListener(window, 'resize', resize);
      addListener(document, 'visibilitychange', function () {
        if (document.hidden && active) setPaused(true);
      });
      addListener(resumeBtn, 'click', onResumeClick);
      addListener(retryBtn, 'click', onRetryClick);
      // D-pad ảo: pointerdown để phản hồi ngay trên touch, click để hỗ trợ bàn phím/assistive tech.
      // Cùng một hàm setDir → chặn quay đầu 180° và chặn khi pause/thua/thắng như phím.
      const dpadBtns = document.querySelectorAll ? document.querySelectorAll('[data-snake-dir]') : [];
      for (let i = 0; i < dpadBtns.length; i++) {
        addListener(dpadBtns[i], 'pointerdown', onDpad, { passive: false });
        addListener(dpadBtns[i], 'click', onDpad);
      }
      for (let i = 0; i < controlBtns.length; i++) {
        addListener(controlBtns[i], 'click', onControlModeClick);
      }
      if (canvas) canvas.style.touchAction = 'none';
    }
    function unbindAll() {
      bound.forEach(function (b) {
        try { b.target.removeEventListener(b.type, b.fn, b.opts); } catch (e) { }
      });
      bound = [];
    }

    /* ---------- Điều khiển phiên ---------- */
    function begin() {
      stop();
      active = true;
      bindAll();
      resetState();
      resize();
      showOverlay('snake-ov-ready');
      const token = beginToken;
      beginTimer = setTimeout(function () {
        if (!active || token !== beginToken) return;   // callback cũ đã bị huỷ
        // Đang tạm dừng trong lúc đếm ngược (Space / chuyển tab): giữ overlay,
        // không tự chạy — chỉ resume() mới được phép khởi động lại vòng lặp.
        if (paused) return;
        hideOverlay();
        startLoop();
      }, 3200);
    }

    function stop() {
      active = false;
      beginToken++;
      if (beginTimer) { clearTimeout(beginTimer); beginTimer = 0; }
      running = false;
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      unbindAll();
      paused = false;
      swipeStart = null;
      hideJoystick();
    }

    function mount(rootNode, callbacks) {
      cbs = callbacks || {};
      canvas = document.getElementById('snake-canvas');
      ctx = canvas ? canvas.getContext('2d') : null;
      resize();
    }

    // Hook kiểm thử e2e (chỉ bật khi URL có ?e2e=1) — không ảnh hưởng luồng thật.
    if (typeof window !== 'undefined' && window.location &&
        /(?:\?|&|#)e2e=1/.test((window.location.search || '') + (window.location.hash || ''))) {
      window.__snakeTest = {
        segments: function () { return segments.map(function (s) { return { x: s.x, y: s.y }; }); },
        state: function () {
          return {
            active: active, running: running, paused: paused,
            collected: collected, crashShown: crashShown, winShown: winShown,
            segCount: segCount, head: { x: head.x, y: head.y },
            heart: heart ? { x: heart.x, y: heart.y } : null,
            bound: bound.length,
            controlMode: controlMode,
            joystickVisible: !!(joystick && !joystick.hidden)
          };
        },
        setHeart: function (x, y) { heart = { x: x, y: y, t: 0 }; },
        setControlMode: function (m) { applyControlMode(m); },
        step: function (dt) { step(dt); }
      };
    }

    return { mount: mount, begin: begin, stop: stop };
  }

  window.SnakeGame = SnakeGameFactory();
})();