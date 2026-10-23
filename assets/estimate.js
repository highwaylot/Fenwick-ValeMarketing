/* The build sheet. Adds up the size and the add-ons; the total ticks when it changes. */
(function () {
  var form = document.getElementById('build');
  if (!form) return;
  var once = document.getElementById('t-once');
  var month = document.getElementById('t-month');
  var chosen = document.getElementById('t-chosen');
  var book = document.getElementById('book');
  var gbp = document.getElementById('gbp');
  var gbpRow = document.getElementById('gbp-row');
  var gbpCost = document.getElementById('gbp-cost');
  var SKINS = { pool: 'pool service', charter: 'fishing charter', hvac: 'HVAC and plumbing', dental: 'dental office', auto: 'auto repair' };

  function money(n) { return '$' + n.toLocaleString('en-US'); }

  function setText(el, text) {
    if (el.textContent === text) return;
    el.classList.add('tick');
    setTimeout(function () { el.textContent = text; el.classList.remove('tick'); }, 180);
  }

  function update() {
    var size = form.querySelector('input[name="size"]:checked');
    var lo = size ? +size.getAttribute('data-once') : 0;
    var hi = size && size.getAttribute('data-max') ? +size.getAttribute('data-max') : lo;
    var included = !!size && size.value !== 'one';
    gbp.disabled = included;
    if (included) gbp.checked = false;
    gbpRow.classList.toggle('included', included);
    gbpCost.textContent = included ? 'Included' : '$350';

    var per = 0;
    var names = [];
    if (size) names.push(size.getAttribute('data-label'));
    var boxes = form.querySelectorAll('input[name="addon"]:checked');
    for (var i = 0; i < boxes.length; i++) {
      var o = boxes[i].getAttribute('data-once');
      var m = boxes[i].getAttribute('data-month');
      if (o) { lo += +o; hi += +o; }
      if (m) { per += +m; }
      names.push(boxes[i].getAttribute('data-label'));
    }
    var onceText = (lo === hi ? money(lo) : money(lo) + ' to ' + money(hi)) + ' once';
    var monthText = per ? money(per) + ' a month' : '$0 a month';
    if (per && size && size.value === 'shop') monthText += ', first 90 days included';
    setText(once, onceText);
    setText(month, monthText);

    var skin = document.documentElement.getAttribute('data-theme');
    var look = skin && SKINS[skin] ? 'Colors like the ' + SKINS[skin] + ' sample. ' : '';
    var list = names.length ? names.join(', ') + '.' : 'Pick a size.';
    chosen.textContent = look + list.charAt(0).toUpperCase() + list.slice(1);
    book.href = 'mailto:hello@fenwickvale.com?subject=' + encodeURIComponent(
      'Book a 20-minute call: ' + names.join(', ') + ' (' + onceText + ', ' + monthText + ')' + (look ? '. ' + look.trim() : '')
    );
  }

  form.addEventListener('change', update);
  document.addEventListener('fv-skin', update);
  update();
})();
