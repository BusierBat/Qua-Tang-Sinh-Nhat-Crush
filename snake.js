/* ============================================================
   QUA-TANG-SINH-NHAT-CRUSH — SNAKE MINIGAME (bắt buộc, mục 2-6)
   Thử thách cuối hành trình: thu thập đúng 5 trái tim để mở khóa
   màn kết thúc. Chỉ Snake hoàn thành mới được chuyển cảnh.

   Kiến trúc:
   - Toạ độ THẾ GIỚI LIÊN TỤC 100×125 đơn vị (không lưới hiển thị).
     Canvas chỉ là bản chiếu — nội suy mọi chuyển động theo delta-time.
   - Rắn = đầu + chuỗi điểm mốc (trail theo cung dài); thân vẽ bằng
     polyline bo tròn, độ dày thon dần, màu gradient pastel đồng bộ site.
   - Va chạm: biên (đầu vượt khung) và thân (mẫu dọc trail, bỏ vùng
     sát đầu) — ổn định vì mẫu theo quãng đường, không theo frame.
   - Input: LÁI ANALOG theo đầu rắn (không gấp khóc kiểu Nokia):
       + Bàn phím: WASD/Mũi tên (e.code) đặt GÓC MỤC TIÊU — đầu rắn
         quẹo mượt theo cung tròn đến góc đó, quẹo được ở bất kỳ đâu.
       + Cảm ứng: CHẠM + GIỮ ở bất kỳ điểm nào trên sân — đầu rắn đuổi
         theo vị trí ngón tay (pursuit) với tốc độ quay giới hạn, nhả
         tay là đi thẳng. Dễ và tự nhiên trên điện thoại.
   - Hiệu năng: 1 vòng requestAnimationFrame, pool hạt cố định,
     mảng mẫu tái sử dụng, dừng RAF khi tab ẩn hoặc rời màn hình,
     listeners gỡ sạch khi destroy().
   Không emoji, không pixel art, không ký tự Unicode làm đồ họa.
   ============================================================ */
window.SnakeGame = (function () {
  'use strict';

  /* ---------- hằng số thiết kế ---------- */
  var WORLD_W = 100, WORLD_H = 125;      // đơn vị thế giới (liên tục)
  var MARGIN = 7;                        // biên nội tại cho tim spawn
  var HEAD_R = 4.0;                      // bán kính đầu
  var BODY_W = 3.5, TAIL_W = 1.1;        // độ dày thân -> đuôi
  var START_LEN = 26, GROW_PER = 14;     // chiều dài cung (đơn vị)
  var SPEED0 = 17.0, SPEED_STEP = 1.4, SPEED_MAX = 26.0;   // nhanh, sống động
  var HEART_R = 5.4, CAPTURE_R = 14.0;   // CHẠM LÀ ĂN: vùng ăn rộng hơn hẳn hình tim + quầng
  var BODY_CAPTURE_R = 9.0;              // thân (kể cả cổ) chạm tim cũng ăn
  var SPAWN_CLEAR = 14.0;                // tim spawn phải cách TOÀN BỘ đường rắn đã đi ≥14
  var MAGNET_R = 20.0, MAGNET_SPEED = 6.5; // NAM CHÂM: tim tự trượt về đầu khi lại gần — không thể lỡ
  var TURN_RATE = 3.8;                   // rad/s — quẹo mượt bằng bàn phím
  var PURSUE_TURN = 4.8;                 // rad/s — đuổi theo ngón tay (bám nhanh hơn)
  var PURSUE_DEAD = 5.0;                 // vùng chết quanh đầu: ngón quá gần thì giữ hướng
  var SELF_STEP = 1.0;                   // bước mẫu kiểm tra va chạm thân
  var SELF_SKIP = 7.0;                   // bỏ đoạn trail sát đầu
  var SELF_R = 3.1;                      // ngưỡng chạm thân
  var TOTAL_HEARTS = 5;
  var COLOR = {
    bodyA: '#EDBFAE', bodyB: '#DCA48F', belly: '#F6CDBF',
    head: '#E2AC97', cheek: '#F6CDBF', eyeWhite: '#FFFBF4', eye: '#55463F',
    tongue: '#D98A7E', heartA: '#EFA1AC', heartB: '#D97385',
    glow: 'rgba(233, 184, 169, 0.55)', ring: '#E4C083', dot: 'rgba(255, 251, 244, 0.55)'
  };

  /* ---------- trạng thái module ---------- */
  var el = {};                           // phần tử DOM đã mount
  var ctx2d = null;
  var dpr = 1, cssW = 0, cssH = 0, scale = 1;
  var raf = 0, lastT = 0, active = false, mounted = false;
  var handlers = {};                     // callbacks từ Journey
  var E2E = /(?:\?|&|#)e2e=1/.test(window.location.search + window.location.hash);

  var state = 'idle';                    // idle|ready|playing|paused|crashed|finishing|complete
  var px = 30, py = 62;
  var heading = 0;                       // góc hướng đầu (rad) — LÁI ANALOG
  var dirX = 1, dirY = 0;                // cos/sin của heading (dẫn xuất mỗi frame)
  var targetAng = null;                  // góc mục tiêu từ bàn phím (null = giữ nguyên hướng)
  var ptr = { on: false, x: 0, y: 0 };   // điểm ngón tay đang giữ (toạ độ thế giới)
  var trail = [];                        // [{x,y}] cũ -> mới (đầu nằm cuối)
  var segLen = [];                       // khoảng cách giữa các điểm trail
  var bodyLen = START_LEN;
  var speed = SPEED0;
  var collected = 0;
  var heart = null;                      // {x,y,born}
  var finishT = 0, winSent = false;
  var readyT = 0, tongueT = 0;
  var REDUCE = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;
  var READY_TIME = REDUCE ? 0.9 : 2.4;   // đếm ngược 3-2-1 (bỏ qua nếu giảm chuyển động)
  var twinkleT = 0;                      // lấp lánh thân rắn
  var motes = [];                        // cánh hoa trôi trong sân (trang trí)
  for (var mo = 0; mo < 11; mo++) motes.push({ x: 0, y: 0, vy: 0, ph: 0, amp: 0, rot: 0, vr: 0, c: 0 });
  var samples = [];                      // mảng mẫu tái sử dụng (không cấp phát mỗi frame)
  var bodyPts = [];                      // điểm thân tái sử dụng khi vẽ (đủ cho thân dài nhất ~1000 điểm)
  var bodyCols = [];                     // bảng màu thân dựng lại khi đổi kích thước
  for (var bp = 0; bp < 1024; bp++) bodyPts.push({ x: 0, y: 0 });
  var parts = [];                        // pool hạt cố định
  var rings = [];                        // hiệu ứng vòng sóng
  var PART_MAX = 72, RING_MAX = 6;
  var id = 0;

  /* ---------- tiện ích ---------- */
  function now() { return (window.performance && performance.now ? performance.now() : Date.now()) / 1000; }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  /* ============================================================
     MOUNT — dựng DOM nội bộ, bind input một lần duy nhất
     ============================================================ */
  function mount(root, opts) {
    if (mounted) return;
    handlers = opts || {};
    el.root = root;
    el.canvas = root.querySelector('#snake-canvas');
    el.hudFill = Array.prototype.slice.call(root.querySelectorAll('.heart-slot'));
    el.hudCount = root.querySelector('#snake-count');
    el.overlay = root.querySelector('#snake-overlay');
    el.ov = {
      ready: root.querySelector('#snake-ov-ready'),
      paused: root.querySelector('#snake-ov-paused'),
      crashed: root.querySelector('#snake-ov-crashed'),
      win: root.querySelector('#snake-ov-win')
    };
    if (!el.canvas || !el.overlay) return;
    ctx2d = el.canvas.getContext('2d');
    mounted = true;

    for (var i = 0; i < PART_MAX; i++) parts.push({ on: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, age: 0, size: 0, kind: 0, rot: 0, vr: 0 });
    for (var j = 0; j < RING_MAX; j++) rings.push({ on: false, x: 0, y: 0, r: 0, age: 0 });

    sizeCanvas();
    resetRun();
    draw(0);

    /* --- bàn phím: e.code (vị trí vật lý, đúng cho AZERTY/QWERTZ...)
           Phím hướng KHÔNG khoá trục: chỉ đặt GÓC MỤC TIÊU, đầu rắn
           quẹo mượt theo cung tròn đến góc đó (bấm lúc nào, quẹo lúc đó). --- */
    el.onKey = function (e) {
      if (!active || state === 'idle' || state === 'complete' || state === 'finishing') return;
      var tgt = null;
      var c = e.code || '';
      if (c === 'KeyW' || c === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') tgt = [0, -1];
      else if (c === 'KeyS' || c === 'ArrowDown' || e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') tgt = [0, 1];
      else if (c === 'KeyA' || c === 'ArrowLeft' || e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') tgt = [-1, 0];
      else if (c === 'KeyD' || c === 'ArrowRight' || e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') tgt = [1, 0];
      else if ((c === 'Space' || e.key === 'p' || e.key === 'P') && state === 'playing') { pause(true); e.preventDefault(); return; }
      else if ((c === 'Space' || e.key === 'p' || e.key === 'P') && state === 'paused') { resume(); e.preventDefault(); return; }
      if (!tgt) return;
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || c === 'Space') e.preventDefault();
      requestDir(tgt[0], tgt[1]);
    };
    window.addEventListener('keydown', el.onKey);

    /* --- cảm ứng: CHẠM + GIỮ để dẫn rắn — đầu rắn liên tục quẹo về
           phía ngón tay (pursuit), quẹo được góc nào cũng được, nhả là
           đi thẳng. Không cần vuốt chuẩn 4 hướng như trước. --- */
    el.onDown = function (e) {
      if (!active || state === 'idle' || state === 'complete' || state === 'finishing') return;
      try { el.canvas.setPointerCapture && el.canvas.setPointerCapture(e.pointerId); } catch (err) { }
      ptrWorld(e);
      ptr.on = true;
      targetAng = null;                       // ngón tay thắng phím
    };
    el.onMove = function (e) {
      if (!ptr.on || !active) return;
      ptrWorld(e);
    };
    el.onUp = function () { ptr.on = false; targetAng = null; };
    el.onCancel = function () { ptr.on = false; targetAng = null; };
    el.canvas.addEventListener('pointerdown', el.onDown);
    el.canvas.addEventListener('pointermove', el.onMove);
    el.canvas.addEventListener('pointerup', el.onUp);
    el.canvas.addEventListener('pointercancel', el.onCancel);
    el.blockTouch = function (e) { if (active) e.preventDefault(); };
    el.canvas.addEventListener('touchstart', el.blockTouch, { passive: false });
    el.canvas.addEventListener('touchmove', el.blockTouch, { passive: false });

    /* --- nút overlay --- */
    var resumeBtn = root.querySelector('#snake-btn-resume');
    var retryBtn = root.querySelector('#snake-btn-retry');
    if (resumeBtn) resumeBtn.addEventListener('click', function () { resume(); });
    if (retryBtn) retryBtn.addEventListener('click', function () { restart(); });

    /* --- tab ẩn: dừng vòng lặp, tạm dừng công bằng --- */
    el.onVis = function () {
      if (document.hidden) {
        if (state === 'playing' || state === 'ready') pause(false);
        if (raf) { cancelAnimationFrame(raf); raf = 0; lastT = 0; }
      } else if (active && !raf && (state === 'paused' || state === 'playing' || state === 'ready')) {
        lastT = 0; raf = requestAnimationFrame(step);
      }
    };
    document.addEventListener('visibilitychange', el.onVis);

    /* --- đổi cỡ cửa sổ: giữ toạ độ tương đối --- */
    el.onResize = function () { sizeCanvas(true); };
    window.addEventListener('resize', el.onResize);

    if (E2E) {
      window.__snakeTest = {
        info: function () {
          return { state: state, n: collected, head: { x: px, y: py }, dir: [dirX, dirY], heading: heading, speed: speed, heart: heart ? { x: heart.x, y: heart.y } : null };
        },
        steer: function (dx, dy) { requestDir(dx, dy); },
        setHeading: function (a) { heading = a; dirX = Math.cos(a); dirY = Math.sin(a); targetAng = null; },
        pursue: function (x, y) { ptr.on = true; ptr.x = x; ptr.y = y; targetAng = null; },
        pursueEnd: function () { ptr.on = false; targetAng = null; },
        nearestTrail: function (x, y) {          // kiểm chứng luật spawn (E2E)
          var m = 1e9;
          for (var i = trail.length - 1; i >= 0; i--) {
            var d = Math.hypot(x - trail[i].x, y - trail[i].y);
            if (d < m) m = d;
          }
          return Math.round(m * 10) / 10;
        }
      };
    }
  }

  /* ---------- kích thước canvas / DPR ---------- */
  function sizeCanvas() {
    if (!el.canvas) return;
    var rect = el.canvas.getBoundingClientRect();
    cssW = Math.max(120, rect.width); cssH = Math.max(150, rect.height);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    el.canvas.width = Math.round(cssW * dpr);
    el.canvas.height = Math.round(cssH * dpr);
    scale = cssW / WORLD_W;
    bodyCols.length = 0;  // dựng lại bảng màu thân theo kích thước mới
  }

  /* ============================================================
     TRẠNG THÁI CHUYỂN
     ============================================================ */
  function showOverlay(which) {
    var k;
    for (k in el.ov) { if (el.ov[k]) el.ov[k].hidden = true; }
    if (which && el.ov[which]) {
      el.ov[which].hidden = false;
      if (el.overlay) el.overlay.hidden = false;
    } else if (el.overlay) el.overlay.hidden = true;
  }
  function updateHud() {
    if (el.hudCount) el.hudCount.textContent = collected + '/' + TOTAL_HEARTS;
    el.hudFill.forEach(function (h, i) {
      if (i < collected) h.classList.add('is-filled');
      else h.classList.remove('is-filled');
    });
  }
  function resetRun() {
    px = 30; py = WORLD_H / 2; heading = 0; dirX = 1; dirY = 0;
    targetAng = null; ptr.on = false;
    trail = []; segLen = [];
    bodyLen = START_LEN; speed = SPEED0; collected = 0;
    heart = null; finishT = 0; winSent = false; twinkleT = 0;
    parts.forEach(function (p) { p.on = false; });
    rings.forEach(function (r) { r.on = false; });
    // cánh hoa trôi: phân bố lại toàn sân, rơi chậm + lượn ngang
    motes.forEach(function (m, i) {
      m.x = rnd(MARGIN, WORLD_W - MARGIN);
      m.y = rnd(MARGIN, WORLD_H - MARGIN);
      m.vy = rnd(1.6, 3.2); m.ph = rnd(0, 6.28); m.amp = rnd(1.2, 3.0);
      m.rot = rnd(0, 6.28); m.vr = rnd(-0.8, 0.8); m.c = i % 3;
    });
    // dựng trail ban đầu thẳng sang trái để thân nằm sau đầu
    // QUAN TRỌNG: trail là cũ -> mới (đẦU nằm CUỐI mảng) — mọi hàm đi ngược
    // từ cuối (sampleBodyPoints, drawSnake) đều coi trail[last] là điểm sát đầu
    var L = Math.ceil(START_LEN);
    for (var i = L; i >= 0; i--) {
      trail.push({ x: px - i * 1, y: py });
      if (i < L) segLen.push(1);
    }
    spawnHeart();
    updateHud();
  }
  function begin() {
    if (!mounted) return;
    active = true;
    resetRun();
    state = 'ready'; readyT = 0;
    showOverlay('ready');
    updateHud();
    if (!raf) { lastT = 0; raf = requestAnimationFrame(step); }
  }
  function restart() {
    if (!mounted) return;
    active = true;
    resetRun();
    state = 'ready'; readyT = 0;
    showOverlay('ready');
    if (!raf) { lastT = 0; raf = requestAnimationFrame(step); }
  }
  function stop() {
    active = false;
    state = 'idle';
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    showOverlay(null);
  }
  function pause(byUser) {
    if (state !== 'playing' && state !== 'ready') return;
    state = 'paused';
    showOverlay('paused');
    void byUser;
  }
  function resume() {
    if (state !== 'paused') return;
    state = 'ready'; readyT = 0;
    showOverlay('ready');
  }

  /* ============================================================
     INPUT — LÁI ANALOG: đặt góc mục tiêu, đầu rắn quẹo mượt đến đó
     (không khoá 4 trục, không gấp khóc — đường đi là cung tròn)
     ============================================================ */
  function requestDir(dx, dy) {
    if (state !== 'playing' && state !== 'ready') return;
    if (ptr.on) return;                       // ngón tay đang điều khiển thì thắng
    targetAng = Math.atan2(dy, dx);
  }
  /* toạ độ thế giới của con trỏ/điểm chạm (dùng cho pursuit) */
  function ptrWorld(e) {
    var r = el.canvas.getBoundingClientRect();
    ptr.x = (e.clientX - r.left) / scale;
    ptr.y = (e.clientY - r.top) / scale;
  }

  /* ============================================================
     TIM — spawn ở vị trí hợp lệ (trong bản đồ, không đè thân)
     ============================================================ */
  function sampleBodyPoints() {
    // đi ngược trail theo quãng đường, bước SELF_STEP — mảng tái sử dụng.
    // SELF_SKIP: bỏ đoạn trail sát đầu (đầu luôn áp sát phần thân ngay sau nó)
    samples.length = 0;
    var acc = 0, need = SELF_SKIP;
    for (var i = trail.length - 1; i > 0; i--) {
      var d = segLen[i - 1];
      acc += d;
      while (acc >= need) {
        var f = d === 0 ? 0 : (acc - need) / d;
        var a = trail[i], b = trail[i - 1];
        samples.push({ x: b.x + (a.x - b.x) * f, y: b.y + (a.y - b.y) * f });
        need += SELF_STEP;
        if (samples.length > 400) break;
      }
      if (samples.length > 400) break;
    }
    return samples;
  }
  function spawnHeart() {
    /* QUAN TRỌNG (sửa lỗi "xuyên qua tim" trong video người chơi): bản cũ quét
       sampleBodyPoints() — bỏ mặc 7 đơn vị cổ sát đầu, nên tim có thể spawn
       NGAY LÊN CỔ RẮN: thân đè lên tim mãi mà không điểm nào được tính chạm.
       Giờ quét TOÀN BỘ trail (gồm cổ) — tim luôn cách đường rắn đã đi ≥14. */
    var best = null, bestScore = -1, loose = null, looseBest = -1;
    for (var t = 0; t < 220; t++) {
      var x = rnd(MARGIN, WORLD_W - MARGIN), y = rnd(MARGIN, WORLD_H - MARGIN);
      var ok = true, minD = 1e9;
      if (Math.hypot(x - px, y - py) < CAPTURE_R + 4) continue;
      for (var i = trail.length - 1; i >= 0; i -= 2) {
        var d = Math.hypot(x - trail[i].x, y - trail[i].y);
        if (d < SPAWN_CLEAR) { ok = false; break; }   // đủ xa toàn bộ đường đã đi (gồm cổ)
        if (d < minD) minD = d;
      }
      if (minD > looseBest) { looseBest = minD; loose = { x: x, y: y, born: now() }; }
      if (!ok) continue;
      var score = Math.min(minD, 30) + (t > 40 ? 0 : 1);
      if (score > bestScore) { bestScore = score; best = { x: x, y: y, born: now() }; }
      if (t > 60 && best) break;
    }
    // hết chỗ thoải mái thì chọn điểm THÔNG THƯỞNG nhất (xa rắn nhất từng thử),
    // tuyệt đối không spawn đè lên rắn như fallback tâm bản đồ cũ
    heart = best || loose || { x: WORLD_W / 2, y: WORLD_H / 2, born: now() };
  }

  /* ============================================================
     VÒNG LẶP — delta-time, nội suy liên tục
     ============================================================ */
  function step(t) {
    raf = 0;
    if (!active || document.hidden) { lastT = 0; return; }
    var dt = lastT ? Math.min(0.05, Math.max(0.001, (t - lastT) / 1000)) : 0.016;
    lastT = t;
    if (state === 'ready') {
      readyT += dt;
      if (readyT >= READY_TIME) { state = 'playing'; showOverlay(null); }
    } else if (state === 'playing' || state === 'finishing') {
      physics(dt);
    }
    fx(dt);
    draw(t / 1000);
    raf = requestAnimationFrame(step);
  }

  function physics(dt) {
    // ---- LÁI MƯỢT ----
    // Cảm ứng đang giữ: đầu rắn đuổi theo ngón tay (pursuit) — quẹo góc nào cũng được
    if (ptr.on && state === 'playing') {
      var pdx = ptr.x - px, pdy = ptr.y - py;
      if (pdx * pdx + pdy * pdy > PURSUE_DEAD * PURSUE_DEAD) {
        targetAng = Math.atan2(pdy, pdx);
        steerToward(targetAng, PURSUE_TURN * dt);
      }
    } else if (targetAng !== null) {
      // Bàn phím: quẹo mượt về góc mục tiêu (cung tròn, không bước 90°)
      steerToward(targetAng, TURN_RATE * dt);
    }
    dirX = Math.cos(heading); dirY = Math.sin(heading);
    // NAM CHÂM (v8): khi đầu lại gần tim (<20u), tim TỰ TRƯỢT về phía đầu —
    // người chơi chỉ cần đi NGAY GẦN là được ăn, không còn cách nào lỡ mất tim.
    // Tim được kẹp trong biên bản đồ; REDUCE thì bỏ glide cho người ít chuyển động.
    if (heart && state === 'playing' && !REDUCE) {
      var mdx = heart.x - px, mdy = heart.y - py, md = Math.hypot(mdx, mdy);
      if (md > 0.5 && md < MAGNET_R) {
        var pull = Math.min(MAGNET_SPEED * dt, md);
        heart.x -= (mdx / md) * pull; heart.y -= (mdy / md) * pull;
        heart.x = Math.max(MARGIN, Math.min(WORLD_W - MARGIN, heart.x));
        heart.y = Math.max(MARGIN, Math.min(WORLD_H - MARGIN, heart.y));
      }
    }
    var stepLen = speed * dt;
    // chia bước nhỏ để va chạm không "nhảy qua" vật thể
    var sub = Math.ceil(stepLen / 0.8);
    var sl = stepLen / sub;
    for (var s = 0; s < sub; s++) {
      var nx = px + dirX * sl, ny = py + dirY * sl;
      // va chạm biên
      if (nx < HEAD_R || nx > WORLD_W - HEAD_R || ny < HEAD_R || ny > WORLD_H - HEAD_R) {
        if (state === 'playing') return crash('wall');
        if (state === 'finishing') { nx = px; ny = py; }
      }
      px = nx; py = ny;
      // ghi trail
      var lt = trail[trail.length - 1];
      var dd = Math.hypot(px - lt.x, py - lt.y);
      if (dd > 0.12) { trail.push({ x: px, y: py }); segLen.push(dd); }
      // ăn tim — CHẠM LÀ ĂN (4 lớp):
      // 1) quét cả ĐOẠN đường đầu vừa đi (kể cả frame lag/giật dài)
      // 2) bán kính ăn 14 — rộng hơn hình tim + quầng, mắt thấy chạm là ăn thật
      // 3) thân rắn chạm tim cũng ăn
      // 4) cả vùng CỔ sát đầu (không có trong mẫu thân) cũng được quét
      if (heart && state === 'playing') {
        var oxh = px - dirX * sl, oyh = py - dirY * sl;        // điểm đầu trước bước này
        var vx = px - oxh, vy = py - oyh, L2 = vx * vx + vy * vy;
        var tt = L2 > 0 ? ((heart.x - oxh) * vx + (heart.y - oyh) * vy) / L2 : 0;
        if (tt < 0) tt = 0; else if (tt > 1) tt = 1;
        var qx = oxh + vx * tt - heart.x, qy = oyh + vy * tt - heart.y;
        if (qx * qx + qy * qy < CAPTURE_R * CAPTURE_R) { collect(); }
        else {
          var ate = false;
          var bpts = sampleBodyPoints();
          for (var hb = 0; hb < bpts.length; hb++) {
            var bdx = heart.x - bpts[hb].x, bdy = heart.y - bpts[hb].y;
            if (bdx * bdx + bdy * bdy < BODY_CAPTURE_R * BODY_CAPTURE_R) { collect(); ate = true; break; }
          }
          if (!ate) {                                          // vùng cổ: 14 đơn vị sát đầu
            var hh = heart, walked = 0;
            for (var nt = trail.length - 1; nt > 0 && walked < SELF_SKIP + 7; nt--) {
              var ndx = hh.x - trail[nt].x, ndy = hh.y - trail[nt].y;
              if (ndx * ndx + ndy * ndy < BODY_CAPTURE_R * BODY_CAPTURE_R) { collect(); break; }
              walked += segLen[nt] || 0;
            }
          }
        }
      }
      // va chạm thân (chỉ khi đang chơi)
      if (state === 'playing' && checkSelf()) return crash('self');
    }
    // cắt trail thừa
    var total = 0;
    for (var i = segLen.length - 1; i >= 0; i--) {
      total += segLen[i];
      if (total > bodyLen + 12) { trail.splice(0, i); segLen.splice(0, i); break; }
    }
    if (state === 'finishing') {
      finishT += dt;
      if (finishT > 0.55 && !winSent) { winSent = true; bigBurst(); fireWin(); }
    }
  }
  /* quẹo heading về góc ang với tốc độ quay tối đa maxTurn (rad) trong frame này */
  function steerToward(ang, maxTurn) {
    var diff = ((ang - heading + Math.PI * 3) % (Math.PI * 2)) - Math.PI;   // [-π, π)
    if (diff > maxTurn) diff = maxTurn;
    else if (diff < -maxTurn) diff = -maxTurn;
    heading += diff;
  }

  function checkSelf() {
    var body = sampleBodyPoints();
    for (var i = 0; i < body.length; i++) {
      var dx = px - body[i].x, dy = py - body[i].y;
      if (dx * dx + dy * dy < SELF_R * SELF_R) return true;
    }
    return false;
  }

  function collect() {
    collected++;
    spawnBurst(heart.x, heart.y, 16);
    spawnRing(heart.x, heart.y);
    flyHeart(heart.x, heart.y, collected);   // tim bay lên ô tiến trình
    bodyLen += GROW_PER;
    speed = Math.min(SPEED_MAX, speed + SPEED_STEP);
    if (typeof handlers.onCollect === 'function') handlers.onCollect(collected);
    heart = null;
    // HUD đổ tim khi "viên tim" bay tới nơi (600ms) — cảm giác thật hơn
    setTimeout(function () { updateHud(); }, 600);
    if (collected >= TOTAL_HEARTS) {
      state = 'finishing'; finishT = 0;
      showOverlay(null);
    } else {
      spawnHeart();
    }
  }

  /* Viên tim bay từ vị trí ăn được tới ô HUD tương ứng (DOM 1 lần, ngoài vòng lặp) */
  function flyHeart(x, y, idx) {
    try {
      if (REDUCE || !el.canvas || !el.hudFill.length) { updateHud(); return; }
      var cr = el.canvas.getBoundingClientRect();
      var slot = el.hudFill[Math.min(idx - 1, el.hudFill.length - 1)];
      var tr = slot.getBoundingClientRect();
      var f = document.createElement('span');
      f.className = 'fly-heart';
      f.innerHTML = '<svg viewBox="0 0 24 24" focusable="false"><path d="M12 20.6s-6.2-4-8.6-7.5C1.7 10.5 2.8 7.2 5.8 6.8c1.8-.25 3.3.65 4.2 2 .9-1.35 2.4-2.25 4.2-2 3 .44 4.1 3.7 2.4 6.3C14.2 16.6 12 20.6 12 20.6Z" fill="currentColor"/></svg>';
      var sx = cr.left + x * scale, sy = cr.top + y * scale;
      f.style.left = sx + 'px';
      f.style.top = sy + 'px';
      document.body.appendChild(f);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          f.style.transform = 'translate(' + (tr.left + tr.width / 2 - sx) + 'px,' + (tr.top + tr.height / 2 - sy) + 'px) scale(0.5)';
          f.style.opacity = '0.1';
        });
      });
      setTimeout(function () {
        if (f.parentNode) f.parentNode.removeChild(f);
        // chỉ đổ tim nếu ván hiện tại thực sự đã ăn đủ số tim này
        // (tránh timed-out của ván cũ tô màu sau khi đã chơi lại)
        if (idx <= collected && (state === 'playing' || state === 'finishing' || state === 'complete')) {
          slot.classList.remove('is-filled');
          void slot.offsetWidth;                    // bật lại pop animation khi tim "hạ cánh"
          slot.classList.add('is-filled');
        }
      }, 640);
    } catch (e) { /* trang trí — lỗi thì bỏ qua */ }
  }

  function crash(reason) {
    if (E2E) {
      try {
        var near = 1e9;
        for (var i = 0; i < samples.length; i++) near = Math.min(near, Math.hypot(px - samples[i].x, py - samples[i].y));
        console.log('[snake-crash]', reason, 'head=', px.toFixed(2), py.toFixed(2), 'n=', samples.length, 'nearest=', near.toFixed(2), 'dir=', dirX + ',' + dirY, 'trailLen=', trail.length, 'lastTrail=', trail.length ? trail[trail.length - 1].x.toFixed(2) + ',' + trail[trail.length - 1].y.toFixed(2) : 'none');
      } catch (e) { }
    }
    state = 'crashed';
    showOverlay('crashed');
    if (typeof handlers.onCrash === 'function') handlers.onCrash(collected);
  }

  /* Chỉ bắn MỘT lần — chống kích hoạt chuyển cảnh trùng lặp */
  function fireWin() {
    if (typeof handlers.onWin !== 'function') return;
    state = 'complete';
    showOverlay('win');           // thông điệp chúc mừng 5/5
    handlers.onWin(collected);
  }

  /* ============================================================
     HIỆU ỨNG — pool cố định, không cấp phát trong vòng lặp
     ============================================================ */
  function spawnBurst(x, y, n) {
    var made = 0;
    for (var i = 0; i < PART_MAX && made < n; i++) {
      var p = parts[i];
      if (p.on) continue;
      var a = rnd(0, Math.PI * 2), v = rnd(6, 20);
      p.on = true; p.x = x; p.y = y;
      p.vx = Math.cos(a) * v; p.vy = Math.sin(a) * v - 4;
      p.life = rnd(0.5, 1.0); p.age = 0; p.size = rnd(0.7, 1.9);
      p.kind = (Math.random() * 3) | 0; p.rot = rnd(0, 6.28); p.vr = rnd(-4, 4);
      made++;
    }
  }
  function bigBurst() {
    spawnBurst(WORLD_W / 2, WORLD_H / 2 - 10, 26);
    spawnRing(WORLD_W / 2, WORLD_H / 2 - 10);
    spawnRing(WORLD_W / 2, WORLD_H / 2 + 14);
  }
  function spawnRing(x, y) {
    for (var i = 0; i < RING_MAX; i++) {
      var r = rings[i];
      if (r.on) continue;
      r.on = true; r.x = x; r.y = y; r.age = 0;
      return;
    }
  }
  function spawnTwinkle(x, y) {
    for (var i = 0; i < PART_MAX; i++) {
      var p = parts[i];
      if (p.on) continue;
      p.on = true; p.x = x; p.y = y;
      p.vx = 0; p.vy = 0;
      p.life = rnd(0.4, 0.7); p.age = 0; p.size = rnd(0.5, 1.0);
      p.kind = 0; p.rot = rnd(0, 6.28); p.vr = rnd(-2, 2);
      return;
    }
  }
  function fx(dt) {
    for (var i = 0; i < PART_MAX; i++) {
      var p = parts[i];
      if (!p.on) continue;
      p.age += dt;
      if (p.age >= p.life) { p.on = false; continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vy += 14 * dt; p.vx *= (1 - 1.6 * dt); p.rot += p.vr * dt;
    }
    for (var j = 0; j < RING_MAX; j++) {
      var r = rings[j];
      if (!r.on) continue;
      r.age += dt;
      if (r.age > 0.8) r.on = false;
    }
    // cánh hoa trôi: rơi chậm + lượn sin, vòng lại từ mép trên
    for (var k = 0; k < motes.length; k++) {
      var m = motes[k];
      m.y += m.vy * dt;
      m.ph += dt * 0.9;
      m.x += Math.sin(m.ph) * m.amp * dt;
      m.rot += m.vr * dt;
      if (m.y > WORLD_H - 3) { m.y = 3; m.x = rnd(MARGIN, WORLD_W - MARGIN); }
    }
    // lấp lánh thân rắn: chấm nhỏ nhấp nháy trên thân (đang chơi)
    if (state === 'playing' || state === 'finishing') {
      twinkleT += dt;
      if (twinkleT > 0.5) {
        twinkleT = 0;
        var body = sampleBodyPoints();
        if (body.length > 6) {
          var s = body[(Math.random() * Math.min(body.length, 40)) | 0];
          spawnTwinkle(s.x, s.y);
        }
      }
    }
    tongueT += dt;
  }

  /* ============================================================
     VẼ — vector thuần trên canvas, không lưới, không pixel
     ============================================================ */
  /* Trái tim "đúng điệu": hai thùy tròn đều, đáy nhọn mềm, rãnh giữa rõ —
     vẽ bằng 2 bezier đối xứng qua trục dọc. */
  function heartPath(c, x, y, s) {
    c.moveTo(x, y + s * 0.95);
    c.bezierCurveTo(x - s * 1.34, y + s * 0.40, x - s * 1.16, y - s * 1.10, x, y - s * 0.32);
    c.bezierCurveTo(x + s * 1.16, y - s * 1.10, x + s * 1.34, y + s * 0.40, x, y + s * 0.95);
  }
  function drawHeart(x, y, s, t) {
    var bob = Math.sin(t * 2.4 + x * 0.05) * 0.7;
    var pulse = 1 + Math.sin(t * 3.1) * 0.07;
    var born = heart ? Math.min(1, (t - (heart.born || 0)) * 3.4) : 1;
    var sc = pulse * (0.4 + 0.6 * born);
    var yy = y + bob;
    ctx2d.save();
    ctx2d.translate(x, yy);
    ctx2d.scale(sc * born * born, sc * born * born);
    ctx2d.shadowColor = COLOR.glow;
    ctx2d.shadowBlur = 10 * scale / 4;
    var g = ctx2d.createLinearGradient(0, -s, 0, s);
    g.addColorStop(0, COLOR.heartA); g.addColorStop(1, COLOR.heartB);
    ctx2d.beginPath();
    heartPath(ctx2d, 0, 0, s);
    ctx2d.fillStyle = g;
    ctx2d.fill();
    // viền mềm tạo độ nổi khối
    ctx2d.strokeStyle = 'rgba(217, 115, 133, 0.5)';
    ctx2d.lineWidth = Math.max(1.1, s * 0.09);
    ctx2d.stroke();
    ctx2d.shadowBlur = 0;
    // bóng sáng gloss NHỀN trong lòng tim (clip vào hình để không tràn mép)
    ctx2d.save();
    ctx2d.beginPath();
    heartPath(ctx2d, 0, 0, s);
    ctx2d.clip();
    ctx2d.fillStyle = 'rgba(255, 251, 244, 0.7)';
    ctx2d.beginPath();
    ctx2d.ellipse(-s * 0.44, -s * 0.30, s * 0.17, s * 0.30, -0.6, 0, 6.29);
    ctx2d.fill();
    ctx2d.fillStyle = 'rgba(255, 251, 244, 0.4)';
    ctx2d.beginPath();
    ctx2d.arc(-s * 0.10, -s * 0.58, s * 0.09, 0, 6.29);
    ctx2d.fill();
    ctx2d.restore();
    ctx2d.restore();
  }
  function drawSnake(t) {
    // dựng điểm thân theo cung dài vào mảng tái sử dụng (bodyPts) — không cấp phát mỗi frame
    var bodyN = 1;
    bodyPts[0].x = px; bodyPts[0].y = py;
    var acc = 0, i;
    for (i = trail.length - 1; i > 0 && acc < bodyLen && bodyN < 1023; i--) {
      var d = segLen[i - 1];
      if (acc + d >= bodyLen) {
        var f = (bodyLen - acc) / d;
        var a = trail[i], b = trail[i - 1];
        bodyPts[bodyN].x = b.x + (a.x - b.x) * f;
        bodyPts[bodyN].y = b.y + (a.y - b.y) * f;
        bodyN++; acc = bodyLen; break;
      }
      acc += d;
      bodyPts[bodyN].x = trail[i - 1].x;
      bodyPts[bodyN].y = trail[i - 1].y;
      bodyN++;
    }
    if (bodyN < 2) { bodyPts[1].x = px - dirX; bodyPts[1].y = py - dirY; bodyN = 2; }

    ctx2d.lineCap = 'round'; ctx2d.lineJoin = 'round';
    // bảng màu thân: dựng lại chỉ khi thiếu (đổi cỡ) — 16 nấc gradient
    if (bodyCols.length < 16) {
      for (var k = 0; k < 16; k++) bodyCols.push(mixColor(COLOR.bodyA, COLOR.bodyB, 0.25 + 0.75 * (k / 15)));
    }
    var N = bodyN - 1;
    // vẽ theo BĂNG độ dày (12 nấc): mỗi băng 1 path + 1 stroke thay vì mỗi điểm
    // -> giảm mạnh số lệnh stroke mỗi frame, mượt trên máy yếu
    var BANDS = 12;
    var bi = -1;
    for (i = 0; i < N; i++) {
      var f0 = i / Math.max(1, N - 1);
      var band = Math.min(BANDS - 1, (f0 * BANDS) | 0);
      if (band !== bi) {
        if (i > 0) { ctx2d.stroke(); }
        bi = band;
        ctx2d.strokeStyle = bodyCols[Math.min(15, ((bi + 0.5) / BANDS * 15) | 0)];
        ctx2d.lineWidth = Math.max(1.5, (BODY_W + (TAIL_W - BODY_W) * (bi / BANDS)) * scale);
        ctx2d.beginPath();
        ctx2d.moveTo(bodyPts[i].x * scale, bodyPts[i].y * scale);
      }
      ctx2d.lineTo(bodyPts[i + 1].x * scale, bodyPts[i + 1].y * scale);
      // đốm bụng nhẹ theo quãng đường
      if (i % 18 === 9) {
        var wm = (BODY_W + (TAIL_W - BODY_W) * f0) * scale;
        ctx2d.fillStyle = COLOR.dot;
        ctx2d.beginPath();
        ctx2d.arc(bodyPts[i].x * scale, bodyPts[i].y * scale, wm * 0.18, 0, 6.29);
        ctx2d.fill();
      }
    }
    if (N > 0) ctx2d.stroke();
    drawHead(t);
  }
  function drawHead(t) {
    var x = px * scale, y = py * scale, r = HEAD_R * scale;
    var ang = Math.atan2(dirY, dirX);
    ctx2d.save();
    ctx2d.translate(x, y);
    ctx2d.rotate(ang);
    // lưỡi flick nhẹ khi đang chơi
    if ((state === 'playing' || state === 'finishing') && (Math.sin(tongueT * 2.2) > 0.86)) {
      ctx2d.strokeStyle = COLOR.tongue;
      ctx2d.lineWidth = Math.max(1.4, r * 0.22);
      ctx2d.beginPath();
      ctx2d.moveTo(r * 0.9, 0);
      ctx2d.lineTo(r * 1.55, 0);
      ctx2d.stroke();
    }
    // đầu: ellipse mềm hơi nhọn về phía trước
    ctx2d.fillStyle = COLOR.head;
    ctx2d.beginPath();
    ctx2d.ellipse(0, 0, r * 1.12, r * 0.94, 0, 0, 6.29);
    ctx2d.fill();
    // má hồng
    ctx2d.fillStyle = COLOR.cheek;
    ctx2d.beginPath();
    ctx2d.arc(-r * 0.1, -r * 0.55, r * 0.3, 0, 6.29);
    ctx2d.arc(-r * 0.1, r * 0.55, r * 0.3, 0, 6.29);
    ctx2d.fill();
    // mắt
    ctx2d.fillStyle = COLOR.eyeWhite;
    ctx2d.beginPath();
    ctx2d.arc(r * 0.34, -r * 0.42, r * 0.30, 0, 6.29);
    ctx2d.arc(r * 0.34, r * 0.42, r * 0.30, 0, 6.29);
    ctx2d.fill();
    ctx2d.fillStyle = COLOR.eye;
    ctx2d.beginPath();
    ctx2d.arc(r * 0.44, -r * 0.42, r * 0.15, 0, 6.29);
    ctx2d.arc(r * 0.44, r * 0.42, r * 0.15, 0, 6.29);
    ctx2d.fill();
    ctx2d.restore();
  }
  function drawFx() {
    var i, p, r, a;
    // cánh hoa trôi — NỀN (vẽ trước, mờ nhạt, không vướng tim/rắn)
    var moteCols = ['#E9B8A9', '#F2D49B', '#D8B8D9'];
    for (i = 0; i < motes.length; i++) {
      var m = motes[i];
      ctx2d.save();
      ctx2d.translate(m.x * scale, m.y * scale);
      ctx2d.rotate(m.rot);
      ctx2d.globalAlpha = 0.30;
      ctx2d.fillStyle = moteCols[m.c];
      ctx2d.beginPath();
      ctx2d.ellipse(0, 0, 2.0 * scale, 1.05 * scale, 0, 0, 6.29);
      ctx2d.fill();
      ctx2d.restore();
    }
    ctx2d.globalAlpha = 1;
    for (i = 0; i < RING_MAX; i++) {
      r = rings[i];
      if (!r.on) continue;
      a = 1 - r.age / 0.8;
      ctx2d.strokeStyle = 'rgba(228, 192, 131, ' + (0.55 * a).toFixed(3) + ')';
      ctx2d.lineWidth = Math.max(1.5, 2.2 * scale * a);
      ctx2d.beginPath();
      ctx2d.arc(r.x * scale, r.y * scale, (2 + r.age * 26) * scale, 0, 6.29);
      ctx2d.stroke();
    }
    for (i = 0; i < PART_MAX; i++) {
      p = parts[i];
      if (!p.on) continue;
      a = 1 - p.age / p.life;
      ctx2d.save();
      ctx2d.translate(p.x * scale, p.y * scale);
      ctx2d.rotate(p.rot);
      ctx2d.globalAlpha = Math.max(0, a);
      var s = p.size * scale;
      if (p.kind === 0) {
        ctx2d.fillStyle = COLOR.heartA;
        ctx2d.beginPath(); ctx2d.arc(0, 0, s * 0.8, 0, 6.29); ctx2d.fill();
      } else if (p.kind === 1) {
        ctx2d.fillStyle = COLOR.ring;
        ctx2d.beginPath(); ctx2d.ellipse(0, 0, s * 1.05, s * 0.55, 0, 0, 6.29); ctx2d.fill();
      } else {
        ctx2d.fillStyle = COLOR.heartB;
        ctx2d.beginPath(); heartPath(ctx2d, 0, 0, s * 0.85); ctx2d.fill();
      }
      ctx2d.restore();
    }
    ctx2d.globalAlpha = 1;
  }
  function draw(t) {
    if (!ctx2d) return;
    ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx2d.clearRect(0, 0, cssW, cssH);
    if (heart) drawHeart(heart.x, heart.y, HEART_R * scale, t);
    drawSnake(t);
    drawFx();
  }
  function mixColor(a, b, f) {
    var pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    var r = Math.round(((pa >> 16) & 255) * (1 - f) + ((pb >> 16) & 255) * f);
    var g = Math.round(((pa >> 8) & 255) * (1 - f) + ((pb >> 8) & 255) * f);
    var bl = Math.round((pa & 255) * (1 - f) + (pb & 255) * f);
    return 'rgb(' + r + ',' + g + ',' + bl + ')';
  }

  /* ---------- dọn dẹp hoàn toàn ---------- */
  function destroy() {
    stop();
    if (!mounted) return;
    window.removeEventListener('keydown', el.onKey);
    document.removeEventListener('visibilitychange', el.onVis);
    window.removeEventListener('resize', el.onResize);
    el.canvas.removeEventListener('pointerdown', el.onDown);
    el.canvas.removeEventListener('pointermove', el.onMove);
    el.canvas.removeEventListener('pointerup', el.onUp);
    el.canvas.removeEventListener('pointercancel', el.onCancel);
    el.canvas.removeEventListener('touchstart', el.blockTouch);
    el.canvas.removeEventListener('touchmove', el.blockTouch);
    mounted = false;
    if (E2E && window.__snakeTest) { try { delete window.__snakeTest; } catch (e) { window.__snakeTest = undefined; } }
  }

  return {
    mount: mount,
    begin: begin,
    restart: restart,
    stop: stop,
    destroy: destroy,
    isActive: function () { return active; },
    score: function () { return collected; }
  };
})();
