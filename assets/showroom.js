/* The showroom. Pick a trade, the page reskins through CSS variables on :root[data-theme].
   Loaded in <head> so a remembered skin applies before first paint. */
(function () {
  var KEY = 'fv-skin';
  var SKINS = { pool: 'pool service', charter: 'fishing charter', hvac: 'HVAC and plumbing', dental: 'dental office', auto: 'auto repair' };
  var root = document.documentElement;

  function read() { try { return localStorage.getItem(KEY) || ''; } catch (e) { return ''; } }
  function save(v) { try { if (v) localStorage.setItem(KEY, v); else localStorage.removeItem(KEY); } catch (e) {} }

  function apply(v) {
    if (SKINS[v]) root.setAttribute('data-theme', v); else { v = ''; root.removeAttribute('data-theme'); }
    var buttons = document.querySelectorAll('[data-skin]');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute('aria-pressed', buttons[i].getAttribute('data-skin') === v ? 'true' : 'false');
    }
    try { document.dispatchEvent(new CustomEvent('fv-skin', { detail: v })); } catch (e) {}
    var note = document.getElementById('skin-note');
    if (note) {
      note.hidden = !v;
      if (v) {
        note.textContent = 'Showing the ' + SKINS[v] + ' sample. ';
        var back = document.createElement('button');
        back.type = 'button';
        back.setAttribute('data-skin', '');
        back.textContent = 'Back to the Fenwick and Vale look';
        note.appendChild(back);
      }
    }
  }

  function pick(v, x, y) {
    save(v);
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!document.startViewTransition || reduce) { apply(v); return; }
    root.style.setProperty('--vx', x + 'px');
    root.style.setProperty('--vy', y + 'px');
    root.classList.add('skinning');
    var t = document.startViewTransition(function () { apply(v); });
    t.finished.then(function () { root.classList.remove('skinning'); }, function () { root.classList.remove('skinning'); });
  }

  var saved = read();
  if (saved && SKINS[saved]) root.setAttribute('data-theme', saved);

  document.addEventListener('DOMContentLoaded', function () { apply(saved); });
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-skin]') : null;
    if (!b) return;
    var r = b.getBoundingClientRect();
    pick(b.getAttribute('data-skin'), r.left + r.width / 2, r.top + r.height / 2);
  });
})();
