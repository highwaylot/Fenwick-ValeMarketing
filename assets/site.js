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

/* Your list: things a visitor wants to ask about, saved in their own browser, sent with the request form. Not a cart. */
(function () {
  var KEY = 'fv-list', SEND = 'fv-list-send';
  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pill = document.getElementById('list-open'), dlg = document.getElementById('list');
  if (!pill || !dlg) return;
  var ul = document.getElementById('list-items'), empty = document.getElementById('list-empty'), n = document.getElementById('list-n');
  var send = document.getElementById('list-send'), clear = document.getElementById('list-clear');
  function load() { try { var v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
  function save(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} }
  var items = load();
  function has(name) { return items.some(function (i) { return i.name === name; }); }
  function paint() {
    n.textContent = String(items.length);
    pill.hidden = items.length === 0;
    ul.textContent = '';
    items.forEach(function (it) {
      var li = document.createElement('li');
      var t = document.createElement('span'); t.className = 'li-t'; t.textContent = it.name;
      var p = document.createElement('span'); p.className = 'li-p'; p.textContent = it.price;
      var x = document.createElement('button'); x.type = 'button'; x.className = 'li-x'; x.setAttribute('aria-label', 'Remove ' + it.name); x.textContent = '×';
      x.addEventListener('click', function () { items = items.filter(function (i) { return i.name !== it.name; }); save(items); paint(); });
      li.appendChild(t); li.appendChild(p); li.appendChild(x); ul.appendChild(li);
    });
    empty.hidden = items.length > 0;
    send.setAttribute('aria-disabled', String(items.length === 0));
    document.querySelectorAll('[data-add]').forEach(function (b) {
      var on = has(b.getAttribute('data-add'));
      b.setAttribute('aria-pressed', String(on));
      var t = b.querySelector('.add-t'); if (t) t.textContent = on ? 'On your list' : 'Add to your list';
    });
  }
  function fly(from) {
    pill.classList.remove('bump'); void pill.offsetWidth; pill.classList.add('bump');
    if (still || !from.animate) return;
    var a = from.getBoundingClientRect(), b = pill.getBoundingClientRect();
    var dot = document.createElement('span'); dot.className = 'fly-dot'; document.body.appendChild(dot);
    var x0 = a.left + a.width / 2, y0 = a.top + a.height / 2, x1 = b.left + 26, y1 = b.top + b.height / 2;
    dot.animate([
      { transform: 'translate(' + x0 + 'px,' + y0 + 'px) scale(1)', opacity: 1 },
      { transform: 'translate(' + ((x0 + x1) / 2) + 'px,' + (Math.min(y0, y1) - 120) + 'px) scale(1.4)', opacity: 1, offset: 0.5 },
      { transform: 'translate(' + x1 + 'px,' + y1 + 'px) scale(0.5)', opacity: 0.2 }
    ], { duration: 700, easing: 'cubic-bezier(.3,.6,.2,1)' }).onfinish = function () { dot.remove(); };
  }
  document.querySelectorAll('[data-add]').forEach(function (b) {
    b.addEventListener('click', function () {
      var name = b.getAttribute('data-add'), price = b.getAttribute('data-price') || '';
      if (has(name)) { items = items.filter(function (i) { return i.name !== name; }); save(items); paint(); return; }
      items.push({ name: name, price: price }); save(items);
      pill.hidden = false; paint(); fly(b);
    });
  });
  pill.addEventListener('click', function () { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); });
  dlg.querySelectorAll('[data-list-close]').forEach(function (b) { b.addEventListener('click', function () { dlg.close ? dlg.close() : dlg.removeAttribute('open'); }); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg && dlg.close) dlg.close(); });
  clear.addEventListener('click', function () { items = []; save(items); paint(); });
  function listText() { return 'My list:\n' + items.map(function (i) { return '- ' + i.name + (i.price ? ' (' + i.price + ')' : ''); }).join('\n'); }
  function fill() {
    var note = document.getElementById('ask-note'); if (!note || !items.length) return false;
    var cur = note.value.replace(/^My list:[\s\S]*?(\n\n|$)/, '').trim();
    note.value = listText() + (cur ? '\n\n' + cur : '');
    var nm = document.getElementById('ask-name'); if (nm) setTimeout(function () { nm.focus({ preventScroll: true }); }, 400);
    return true;
  }
  send.addEventListener('click', function (e) {
    if (!items.length) { e.preventDefault(); return; }
    try { sessionStorage.setItem(SEND, '1'); } catch (er) {}
    if (document.getElementById('ask-note')) {
      e.preventDefault(); if (dlg.close) dlg.close(); fill();
      var h = document.getElementById('ask-h'); if (h) h.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' });
    }
  });
  try { if (sessionStorage.getItem(SEND) === '1' && document.getElementById('ask-note')) { fill(); sessionStorage.removeItem(SEND); } } catch (e) {}
  window.addEventListener('storage', function (e) { if (e.key === KEY) { items = load(); paint(); } });
  window.addEventListener('fv-list-sent', function () { items = []; save(items); paint(); });
  paint();
})();

/* First-three spots: the number lives in data-spots on the page; this draws the dots and the wording */
(function () {
  document.querySelectorAll('.spots[data-spots]').forEach(function (el) {
    var n = Math.max(0, Math.min(3, parseInt(el.getAttribute('data-spots'), 10) || 0));
    el.querySelectorAll('.dots i').forEach(function (d, i) { d.classList.toggle('taken', i >= n); });
    var t = el.querySelector('.spots-t'); if (t) t.textContent = n === 0 ? 'All three spots are taken' : (n === 1 ? '1 spot left' : n + ' spots left');
    if (n === 0) { var f = el.closest('.founding'); if (f) f.classList.add('gone'); }
  });
})();
