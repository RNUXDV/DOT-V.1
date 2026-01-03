(() => {
  const orbital = document.getElementById('orbital');
  if (!orbital) return;

  const nodes = {
    a: orbital.querySelector('.node--a'),
    b: orbital.querySelector('.node--b'),
    c: orbital.querySelector('.node--c'),
    d: orbital.querySelector('.node--d'),
    e: orbital.querySelector('.node--e'),
    f: orbital.querySelector('.node--f'),
    g: orbital.querySelector('.node--g'),
    h: orbital.querySelector('.node--h'),
  };

  const halos = orbital.querySelectorAll('.approach__halo');

  // Line + tooltip
  const linkLine = orbital.querySelector('.linkLine');
  const microTip = orbital.querySelector('.microTip');

  // Ring radii (match CSS rings roughly)
  const R = [105, 145, 185]; // half of 210/290/370

  function rectInfo(){
    const r = orbital.getBoundingClientRect();
    return { w: r.width, h: r.height, cx: r.width/2, cy: r.height/2 };
  }

  // Node setup: ring assignment + initial angles
  const config = [
    { el: nodes.a, ring: 0, ang: 0.30, spd:  0.00035 }, // approach pair A
    { el: nodes.b, ring: 0, ang: 2.60, spd: -0.00028 }, // approach pair B
    { el: nodes.c, ring: 1, ang: 1.15, spd:  0.00022 },
    { el: nodes.d, ring: 1, ang: 3.65, spd: -0.00018 },
    { el: nodes.e, ring: 1, ang: 5.05, spd:  0.00016 },
    { el: nodes.f, ring: 2, ang: 0.95, spd: -0.00012 },
    { el: nodes.g, ring: 2, ang: 2.20, spd:  0.00014 },
    { el: nodes.h, ring: 2, ang: 4.25, spd: -0.00010 },
  ].filter(x => x.el);

  // Calm idle mode
  let lastInteract = performance.now();
  const WAKE_MS = 1400;
  const isAwake = (t) => (t - lastInteract) < WAKE_MS;
  const wake = () => { lastInteract = performance.now(); };

  orbital.addEventListener('pointermove', wake, { passive: true });
  orbital.addEventListener('pointerdown', wake, { passive: true });
  orbital.addEventListener('touchstart', wake, { passive: true });
  orbital.addEventListener('focusin', wake);

  // Track pointer for subtle parallax (very light)
  let lastPX = 0, lastPY = 0;
  orbital.addEventListener('pointermove', (e) => {
    const r = orbital.getBoundingClientRect();
    lastPX = ((e.clientX - r.left) / r.width) - 0.5;
    lastPY = ((e.clientY - r.top) / r.height) - 0.5;
  }, { passive: true });

  function place(el, x, y){
    el.style.left = `${x}px`;
    el.style.top  = `${y}px`;
  }

  function positionHalo(haloEl, x, y){
    haloEl.style.left = `${x}px`;
    haloEl.style.top  = `${y}px`;
  }

  function setLine(x1, y1, x2, y2, w, h){
    // SVG viewBox is 0..100; convert px -> percent
    const x1p = (x1 / w) * 100;
    const y1p = (y1 / h) * 100;
    const x2p = (x2 / w) * 100;
    const y2p = (y2 / h) * 100;

    linkLine.setAttribute('x1', x1p.toFixed(3));
    linkLine.setAttribute('y1', y1p.toFixed(3));
    linkLine.setAttribute('x2', x2p.toFixed(3));
    linkLine.setAttribute('y2', y2p.toFixed(3));
  }

  let last = performance.now();

  function tick(now){
    const dt = Math.min(40, Math.max(8, now - last));
    last = now;

    const info = rectInfo();
    const awake = isAwake(now);
    orbital.classList.toggle('is-awake', awake);

    // Motion scale: 0 idle, 1 awake
    const motion = awake ? 1 : 0;

    // Subtle background parallax while awake (tiny)
    if (awake){
      const px = lastPX * 2;
      const py = lastPY * 2;
      orbital.style.backgroundPosition = `${50 + px}% ${50 + py}%`;
    } else {
      orbital.style.backgroundPosition = `50% 50%`;
    }

    // Compute positions
    const pos = new Map();
    for (const n of config){
      n.ang += n.spd * dt * motion;

      const r = R[n.ring];
      const x = info.cx + Math.cos(n.ang) * r;
      const y = info.cy + Math.sin(n.ang) * r;

      pos.set(n.el, { x, y });
      place(n.el, x, y);
    }

    // Approach pair logic: A & B drift slightly toward each other when awake
    const A = config[0], B = config[1];
    if (A && B){
      const pA = pos.get(A.el);
      const pB = pos.get(B.el);

      if (pA && pB){
        let xA = pA.x, yA = pA.y, xB = pB.x, yB = pB.y;

        // slight pull-in for “approach” feel
        if (awake){
          const midX = (xA + xB) / 2;
          const midY = (yA + yB) / 2;
          const pull = 0.040;
          xA = xA + (midX - xA) * pull;
          yA = yA + (midY - yA) * pull;
          xB = xB + (midX - xB) * pull;
          yB = yB + (midY - yB) * pull;
          place(A.el, xA, yA);
          place(B.el, xB, yB);
        }

        // halos track them
        if (halos[0]) positionHalo(halos[0], xA, yA);
        if (halos[1]) positionHalo(halos[1], xB, yB);

        // line endpoints
        setLine(xA, yA, xB, yB, info.w, info.h);

        // tooltip at midpoint
        const midX = (xA + xB) / 2;
        const midY = (yA + yB) / 2;
        microTip.style.left = `${midX}px`;
        microTip.style.top  = `${midY}px`;
      }
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();