(function () {
  'use strict';

  function SnakeGameFactory() {
    let canvas, ctx, cbs = {};
    let running = false, rafId = null, last = 0;
    let snake = [], dir = { x: 1, y: 0 }, nextDir = { x: 1, y: 0 };
    let heart = null, collected = 0, TARGET = 5;
    let speed = 150;
    let crashShown = false, winShown = false;
    let paused = false;
    let swipeStart = null;
    const W = 480, H = 320;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function resetState() {
      snake = [];
      for (let i = 0; i < 14; i++) snake.push({ x: W * 0.3 - i * 18, y: H * 0.5 });
      dir = { x: 1, y: 0 }; nextDir = { x: 1, y: 0 };
      collected = 0; speed = 150; crashShown = false; winShown = false; paused = false;
      spawnHeart();
      updateHUD();
    }

    function spawnHeart() {
      let tries = 0;
      while (tries < 500) {
        tries++;
        const x = 30 + Math.random() * (W - 60);
        const y = 30 + Math.random() * (H - 60);
        let ok = true;
        for (let i = 0; i < snake.length; i++) {
          if (Math.hypot(snake[i].x - x, snake[i].y - y) < 30) { ok = false; break; }
        }
        if (ok) { heart = { x, y, t: 0 }; return; }
      }
      heart = { x: W / 2, y: H / 2, t: 0 };
    }

    function updateHUD() {
      const count = document.getElementById('snake-count');
      if (count) count.textContent = collected + '/' + TARGET;
      const hearts = document.querySelector('[data-snake-progress]');
      if (hearts) {
        hearts.querySelectorAll('.heart-slot').forEach((sl, i) => {
          if (i < collected) sl.classList.add('is-filled');
          else sl.classList.remove('is-filled');
        });
      }
    }

    function setDir(d) {
      if (d.x === -dir.x && d.y === -dir.y) return;
      nextDir = d;
    }

    function keyHandler(e) {
      if (!running) return;
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'arrowup') { e.preventDefault(); setDir({ x: 0, y: -1 }); }
      else if (k === 's' || k === 'arrowdown') { e.preventDefault(); setDir({ x: 0, y: 1 }); }
      else if (k === 'a' || k === 'arrowleft') { e.preventDefault(); setDir({ x: -1, y: 0 }); }
      else if (k === 'd' || k === 'arrowright') { e.preventDefault(); setDir({ x: 1, y: 0 }); }
      else if (k === ' ') { e.preventDefault(); paused = !paused; togglePause(); }
    }

    function togglePause() {
      const ov = document.getElementById('snake-overlay');
      const pc = document.getElementById('snake-ov-paused');
      if (paused) { if (ov) ov.hidden = false; if (pc) pc.hidden = false; }
      else { if (ov) ov.hidden = true; if (pc) pc.hidden = true; }
    }

    function onPointerDown(e) { swipeStart = { x: e.clientX, y: e.clientY }; }
    function onPointerUp(e) {
      if (!swipeStart) return;
      const dx = e.clientX - swipeStart.x;
      const dy = e.clientY - swipeStart.y;
      const adx = Math.abs(dx), ady = Math.abs(dy);
      if (Math.max(adx, ady) < 24) { swipeStart = null; return; }
      if (adx > ady) setDir(dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 });
      else setDir(dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 });
      swipeStart = null;
    }
    function onPointerCancel() { swipeStart = null; }

    function crash() {
      if (crashShown || winShown) return;
      crashShown = true;
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      if (cbs.onCrash) cbs.onCrash();
      const ov = document.getElementById('snake-overlay');
      const cc = document.getElementById('snake-ov-crashed');
      if (ov) ov.hidden = false;
      if (cc) cc.hidden = false;
      const btn = document.getElementById('snake-btn-retry');
      if (btn) btn.onclick = function () {
        if (ov) ov.hidden = true;
        if (cc) cc.hidden = true;
        resetState();
        startLoop();
      };
    }

    function win() {
      if (winShown) return;
      winShown = true;
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      collected = TARGET;
      updateHUD();
      const ov = document.getElementById('snake-overlay');
      const wc = document.getElementById('snake-ov-win');
      if (ov) ov.hidden = false;
      if (wc) wc.hidden = false;
      if (cbs.onWin) cbs.onWin();
    }

    function step(dt) {
      if (paused) return;
      dir = nextDir;
      const head = snake[0];
      const nx = head.x + dir.x * speed * dt;
      const ny = head.y + dir.y * speed * dt;
      if (nx < 13 || nx > W - 13 || ny < 13 || ny > H - 13) { crash(); return; }
      for (let i = 8; i < snake.length; i++) {
        if (Math.hypot(snake[i].x - nx, snake[i].y - ny) < 10) { crash(); return; }
      }
      snake.unshift({ x: nx, y: ny });
      if (heart) {
        const px = head.x, py = head.y;
        const vx = nx - px, vy = ny - py;
        const t = ((heart.x - px) * vx + (heart.y - py) * vy) / (vx * vx + vy * vy + 1e-6);
        const tc = Math.max(0, Math.min(1, t));
        const cx = px + vx * tc, cy = py + vy * tc;
        const dist = Math.hypot(heart.x - cx, heart.y - cy);
        if (dist < 30) {
          collected++;
          updateHUD();
          if (cbs.onCollect) cbs.onCollect(collected);
          if (collected >= TARGET) { snake.pop(); win(); return; }
          spawnHeart();
        } else {
          snake.pop();
        }
      } else {
        snake.pop();
      }
    }

    function draw() {
      if (!ctx) return;
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.fillStyle = '#FBF6EC';
      ctx.fillRect(0, 0, rect.width, rect.height);
      const scale = Math.min(rect.width / W, rect.height / H);
      const offX = (rect.width - W * scale) / 2;
      const offY = (rect.height - H * scale) / 2;
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

      for (let i = snake.length - 1; i >= 0; i--) {
        const s = snake[i];
        const t = i / snake.length;
        const r = i === 0 ? 14 : 11;
        const g = ctx.createRadialGradient(s.x - 3, s.y - 3, 2, s.x, s.y, r);
        if (i === 0) { g.addColorStop(0, '#C9DFC9'); g.addColorStop(1, '#7FA882'); }
        else { g.addColorStop(0, 'hsl(130, 24%, ' + (78 - t * 12) + '%)'); g.addColorStop(1, 'hsl(130, 24%, ' + (52 - t * 12) + '%)'); }
        ctx.fillStyle = g;
        ctx.shadowColor = 'rgba(0,0,0,0.12)';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      const h = snake[0];
      if (h) {
        ctx.fillStyle = '#2a2a2a';
        ctx.beginPath(); ctx.arc(h.x + dir.x * 5 - dir.y * 4, h.y + dir.y * 5 + dir.x * 4, 2.4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(h.x + dir.x * 5 + dir.y * 4, h.y + dir.y * 5 - dir.x * 4, 2.4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }

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
      running = true; last = 0;
      rafId = requestAnimationFrame(loop);
    }

    function begin() {
      resetState();
      const ov = document.getElementById('snake-overlay');
      const rc = document.getElementById('snake-ov-ready');
      if (ov) ov.hidden = false;
      if (rc) rc.hidden = false;
      setTimeout(function () {
        if (rc) rc.hidden = true;
        if (ov) ov.hidden = true;
        startLoop();
      }, 3200);
    }

    function mount(rootNode, callbacks) {
      cbs = callbacks || {};
      canvas = document.getElementById('snake-canvas');
      ctx = canvas.getContext('2d');
      resize();
      window.addEventListener('resize', resize);
      document.addEventListener('keydown', keyHandler);
      canvas.addEventListener('pointerdown', onPointerDown);
      canvas.addEventListener('pointerup', onPointerUp);
      canvas.addEventListener('pointercancel', onPointerCancel);
      canvas.style.touchAction = 'none';
      document.addEventListener('visibilitychange', function () {
        if (document.hidden && running) { paused = true; togglePause(); }
      });
    }

    function stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    }

    return { mount, begin, stop };
  }

  window.SnakeGame = SnakeGameFactory();
})();
