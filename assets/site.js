/* Fenwick & Vale · the site's one script. Every part checks for its element first and does nothing if it isn't on the page. */
(function () {
  var root = document.documentElement;
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Theme: Nigredo (dark, default) or Albedo (light), remembered per browser */
  var themeBtn = document.getElementById('theme');
  function paintTheme() {
    var light = root.getAttribute('data-theme') === 'light';
    if (themeBtn) {
      themeBtn.setAttribute('aria-pressed', String(light));
      themeBtn.setAttribute('aria-label', light ? 'Switch to the dark look' : 'Switch to the light look');
    }
  }
  function setTheme(t) {
    if (t === 'light') root.setAttribute('data-theme', 'light'); else root.removeAttribute('data-theme');
    try { localStorage.setItem('fv-theme', t); } catch (e) {}
    paintTheme();
  }
  function toggleTheme() { setTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light'); }
  paintTheme();
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
  document.querySelectorAll('[data-do="theme"]').forEach(function (b) { b.addEventListener('click', toggleTheme); });

  /* Header tightens once the page scrolls */
  var top = document.querySelector('.top');
  if (top) {
    var onScroll = function () { top.classList.toggle('scrolled', window.scrollY > 12); };
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* Mobile menu */
  var nav = document.querySelector('.nav'), menuBtn = document.getElementById('menu');
  if (nav && menuBtn) {
    var closeBtn = nav.querySelector('.close');
    var setMenu = function (open) {
      nav.classList.toggle('open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
      if (open && closeBtn) closeBtn.focus(); else if (!open) menuBtn.focus();
    };
    menuBtn.addEventListener('click', function () { setMenu(true); });
    if (closeBtn) closeBtn.addEventListener('click', function () { setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('open')) setMenu(false); });
  }

  /* The eye: every pupil follows the pointer a little; the big one blinks now and then */
  var pupils = Array.prototype.slice.call(document.querySelectorAll('[data-pupil]'));
  var stage = document.querySelector('.stage');
  if (pupils.length && !still) {
    var px = window.innerWidth / 2, py = window.innerHeight / 3, queued = false;
    var aim = function () {
      queued = false;
      pupils.forEach(function (p) {
        var svg = p.ownerSVGElement; if (!svg) return;
        var r = svg.getBoundingClientRect(); if (!r.width) return;
        var cx = r.left + r.width * parseFloat(p.getAttribute('data-cx') || 0.5);
        var cy = r.top + r.height * parseFloat(p.getAttribute('data-cy') || 0.55);
        var dx = px - cx, dy = py - cy, d = Math.sqrt(dx * dx + dy * dy) || 1;
        var max = parseFloat(p.getAttribute('data-pupil')) || 6;
        var k = Math.min(1, d / 400) * max;
        p.setAttribute('transform', 'translate(' + (dx / d * k).toFixed(2) + ' ' + (dy / d * k).toFixed(2) + ')');
      });
    };
    var queue = function () { if (!queued) { queued = true; requestAnimationFrame(aim); } };
    window.addEventListener('pointermove', function (e) { px = e.clientX; py = e.clientY; queue(); }, { passive: true });
    window.addEventListener('scroll', queue, { passive: true });
    if (window.matchMedia('(hover: none)').matches) {
      var t0 = Date.now();
      setInterval(function () { var t = (Date.now() - t0) / 1000; px = window.innerWidth / 2 + Math.cos(t / 2.2) * 300; py = window.innerHeight / 3 + Math.sin(t / 3.1) * 160; queue(); }, 120);
    }
    queue();
  }
  function blink() {
    if (!stage || still) return;
    stage.classList.add('blink');
    setTimeout(function () { stage.classList.remove('blink'); }, 150);
  }
  if (stage && !still) {
    (function loop() { setTimeout(function () { blink(); loop(); }, 4500 + Math.random() * 5000); })();
    stage.addEventListener('click', blink);
  }
  document.querySelectorAll('[data-do="blink"]').forEach(function (b) { b.addEventListener('click', function () { blink(); setTimeout(blink, 260); }); });

  /* Gold dust drifting up through the hero */
  var cv = document.getElementById('dust');
  if (cv && !still && cv.getContext) {
    var ctx = cv.getContext('2d'), parts = [], W = 0, H = 0, on = true, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var size = function () { var r = cv.getBoundingClientRect(); W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size(); window.addEventListener('resize', size);
    var n = Math.round(Math.min(70, W / 16));
    for (var i = 0; i < n; i++) parts.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.6 + 0.4, v: Math.random() * 0.25 + 0.06, p: Math.random() * 6.28 });
    var gold = function () { return getComputedStyle(root).getPropertyValue('--gold-hi').trim() || '#E2C77E'; };
    var col = gold(); var mo = new MutationObserver(function () { col = gold(); }); mo.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    var io = new IntersectionObserver(function (es) { on = es[0].isIntersecting; if (on) requestAnimationFrame(tick); });
    io.observe(cv);
    var tick = function () {
      if (!on || document.hidden) return;
      ctx.clearRect(0, 0, W, H); ctx.fillStyle = col;
      for (var j = 0; j < parts.length; j++) {
        var q = parts[j]; q.y -= q.v; q.p += 0.02; q.x += Math.sin(q.p) * 0.15;
        if (q.y < -4) { q.y = H + 4; q.x = Math.random() * W; }
        ctx.globalAlpha = 0.25 + 0.45 * (0.5 + 0.5 * Math.sin(q.p * 1.7));
        ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 6.283); ctx.fill();
      }
      requestAnimationFrame(tick);
    };
    document.addEventListener('visibilitychange', function () { if (!document.hidden && on) requestAnimationFrame(tick); });
  }

  /* Reveal: only things below the first screen wait, and they start visible */
  var rv = document.querySelectorAll('[data-rv]');
  if (rv.length && !still && 'IntersectionObserver' in window) {
    var vh = window.innerHeight;
    var ob = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); ob.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
    rv.forEach(function (el) { if (el.getBoundingClientRect().top > vh) { el.classList.add('rv-wait'); ob.observe(el); } });
  }

  /* Live readouts: real numbers from this visit */
  var g = function (k) { return document.querySelector('[data-gauge="' + k + '"]'); };
  var measure = function () {
    try {
      var nav0 = performance.getEntriesByType('navigation')[0];
      var res = performance.getEntriesByType('resource');
      var bytes = 0, count = 1;
      if (nav0) bytes += nav0.transferSize || nav0.encodedBodySize || 0;
      res.forEach(function (r) { bytes += r.transferSize || r.encodedBodySize || 0; count++; });
      if (g('weight')) g('weight').textContent = bytes ? Math.round(bytes / 1024) + ' KB' : 'cached';
      if (g('requests')) g('requests').textContent = String(count);
      if (g('load') && nav0) { var ms = nav0.domContentLoadedEventEnd || nav0.duration; g('load').textContent = ms ? (ms / 1000).toFixed(2) + ' s' : '—'; }
    } catch (e) {}
    if (g('screen')) g('screen').textContent = window.innerWidth + ' × ' + window.innerHeight;
  };
  if (g('weight') || g('screen')) {
    if (document.readyState === 'complete') setTimeout(measure, 60); else window.addEventListener('load', function () { setTimeout(measure, 60); });
    window.addEventListener('resize', function () { if (g('screen')) g('screen').textContent = window.innerWidth + ' × ' + window.innerHeight; });
    document.querySelectorAll('[data-do="measure"]').forEach(function (b) { b.addEventListener('click', measure); });
  }

  /* Work reel: buttons, arrow keys, and a counter in Roman numerals */
  var reel = document.querySelector('.reel');
  if (reel) {
    var slides = reel.querySelectorAll('.slide'), count = document.querySelector('.reel-ctl .count');
    var roman = function (n) { return ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][n] || String(n); };
    var current = function () {
      var best = 0, bd = Infinity, left = reel.getBoundingClientRect().left;
      slides.forEach(function (s, i) { var d = Math.abs(s.getBoundingClientRect().left - left - parseFloat(getComputedStyle(reel).scrollPaddingLeft || 0)); if (d < bd) { bd = d; best = i; } });
      return best;
    };
    var paint = function () { if (count) count.textContent = roman(current() + 1) + ' / ' + roman(slides.length); };
    var go = function (dir) { var i = Math.max(0, Math.min(slides.length - 1, current() + dir)); slides[i].scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'nearest', inline: 'start' }); };
    var prev = document.querySelector('[data-reel="prev"]'), next = document.querySelector('[data-reel="next"]');
    if (prev) prev.addEventListener('click', function () { go(-1); });
    if (next) next.addEventListener('click', function () { go(1); });
    reel.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { e.preventDefault(); go(1); } if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); } });
    var st; reel.addEventListener('scroll', function () { clearTimeout(st); st = setTimeout(paint, 60); }, { passive: true });
    paint();
  }
})();
