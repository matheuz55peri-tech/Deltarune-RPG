/* DELTA RPG — chuva pixelart do Jardim Azul.
   Camada transparente sobre menus e fichas; não interfere nos cliques. */
(() => {
  'use strict';

  function mountGardenRain() {
    if (document.getElementById('delta-garden-rain')) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'delta-garden-rain';
    canvas.className = 'delta-garden-rain';
    canvas.setAttribute('aria-hidden', 'true');
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const style = document.createElement('style');
    style.id = 'delta-garden-rain-style';
    style.textContent =
      '.delta-garden-rain{' +
      'position:fixed;inset:0;width:100%;height:100%;display:none;' +
      'pointer-events:none!important;user-select:none;' +
      'image-rendering:pixelated;opacity:.83;' +
      'z-index:2147483646;contain:strict;' +
      '}' +
      'html[data-theme="garden"] .delta-garden-rain{display:block}';
    document.head.appendChild(style);
    document.body.appendChild(canvas);
    ctx.imageSmoothingEnabled = false;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const rand = (min, max) => min + Math.random() * (max - min);
    const drops = [];
    const splashes = [];
    let width = 0;
    let height = 0;
    let running = false;
    let frameId = 0;
    let previousTime = 0;

    function makeDrop(initial) {
      const front = Math.random() < 0.31;
      return {
        x: rand(-8, width + 8),
        y: initial ? rand(0, height) : rand(-height * 0.2 - 15, -5),
        length: front ? Math.floor(rand(4, 8)) : Math.floor(rand(2, 5)),
        speed: front ? rand(62, 104) : rand(32, 66),
        drift: rand(-5, -1.1),
        alpha: front ? rand(.37, .66) : rand(.14, .36),
        front
      };
    }

    function resize() {
      // Renderização em baixa resolução para manter pixels nítidos.
      width = Math.max(1, Math.ceil(window.innerWidth / 3));
      height = Math.max(1, Math.ceil(window.innerHeight / 3));
      canvas.width = width;
      canvas.height = height;
      ctx.imageSmoothingEnabled = false;
      const amount = Math.max(24, Math.min(170, Math.round(width * height / 1550)));
      drops.length = 0;
      splashes.length = 0;
      for (let i = 0; i < amount; i++) drops.push(makeDrop(true));
      paint(0);
    }

    function paint(dt) {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < drops.length; i++) {
        let d = drops[i];
        if (dt) {
          d.x += d.drift * dt;
          d.y += d.speed * dt;
          if (d.y > height + d.length || d.x < -12) {
            if (d.y > height && d.front && Math.random() < .48 &&
                splashes.length < 25) {
              splashes.push({ x: d.x, y: height - 2, age: 0, duration: rand(.15, .30) });
            }
            d = drops[i] = makeDrop(false);
          }
        }

        const x = Math.round(d.x);
        const y = Math.round(d.y);
        // Rastro fino, ponta luminosa e fragmento lateral: gota de pixelart.
        ctx.globalAlpha = d.alpha;
        ctx.fillStyle = d.front ? '#a3f7ff' : '#68c8db';
        ctx.fillRect(x, y, 1, d.length);
        ctx.globalAlpha = d.alpha * .68;
        ctx.fillStyle = '#e3feff';
        ctx.fillRect(x, y + d.length - 1, d.front ? 2 : 1, 1);
        if (d.front && d.length > 5) {
          ctx.globalAlpha = d.alpha * .23;
          ctx.fillStyle = '#73dce5';
          ctx.fillRect(x - 1, y + 1, 1, 2);
        }
      }

      // Pequenos respingos pixelados na base da tela.
      for (let i = splashes.length - 1; i >= 0; i--) {
        const s = splashes[i];
        if (dt) s.age += dt;
        if (s.age >= s.duration) {
          splashes.splice(i, 1);
          continue;
        }
        const progress = s.age / s.duration;
        const spread = Math.round(1 + progress * 3);
        const x = Math.round(s.x);
        ctx.globalAlpha = .42 * (1 - progress);
        ctx.fillStyle = '#a7f9ff';
        ctx.fillRect(x - spread - 1, s.y - 1, 2, 1);
        ctx.fillRect(x + spread, s.y - 1, 2, 1);
        ctx.fillRect(x, s.y - 2 - Math.round(progress * 2), 1, 1);
      }
      ctx.globalAlpha = 1;
    }

    function loop(time) {
      if (!running) return;
      frameId = requestAnimationFrame(loop);
      // Aproximadamente 30 FPS deixam o movimento levemente retrô.
      if (previousTime && time - previousTime < 30) return;
      const dt = previousTime ? Math.min((time - previousTime) / 1000, .06) : 0;
      previousTime = time;
      paint(dt);
    }

    function sync() {
      const enabled = document.documentElement.dataset.theme === 'garden';
      const animate = enabled && !document.hidden && !reducedMotion.matches;
      if (animate && !running) {
        running = true;
        previousTime = 0;
        frameId = requestAnimationFrame(loop);
      } else if (!animate && running) {
        running = false;
        cancelAnimationFrame(frameId);
        previousTime = 0;
      }
      if (enabled && !animate) paint(0);
    }

    resize();
    new MutationObserver(sync).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', sync);
    if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', sync);
    else if (reducedMotion.addListener) reducedMotion.addListener(sync);
    sync();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountGardenRain, { once: true });
  } else {
    mountGardenRain();
  }
})();