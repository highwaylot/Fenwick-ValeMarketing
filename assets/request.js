/* The request form. Posts to /api/request without a reload; one script for every form on the site. */
(function () {
  var forms = document.querySelectorAll('form.ask');
  if (!forms.length) return;
  var FALLBACK = "The form isn't taking requests yet. Please try again in a few days.";
  var DONE = "Got it. I'll call or write back within one business day.";

  function status(form, text) {
    var el = form.querySelector('.ask-status');
    if (el) el.textContent = text;
  }

  var SEAL = '<svg viewBox="40 40 160 160" aria-hidden="true"><circle cx="120" cy="134" r="40" fill="none" stroke="currentColor" stroke-width="5"/><circle cx="120" cy="134" r="10" fill="currentColor"/><path d="M117 82 L120 54 L123 82 Z M101.5 85.4 L96.2 58.7 L107.3 83.6 Z M132.8 83.6 L143.8 58.7 L138.5 85.4 Z M87.8 93.2 L76.4 71.7 L92.7 89.8 Z M147.3 89.8 L163.6 71.7 L152.2 93.2 Z M77 104.8 L62.9 90.2 L80.6 100 Z M159.4 100 L177.1 90.2 L163 104.8 Z M70.2 119.1 L57 111.1 L72.2 113.4 Z M167.8 113.4 L183 111.1 L169.8 119.1 Z" fill="currentColor"/><path d="M55.2 152 Q120 216 184.8 152 Q120 208 55.2 152 Z" fill="currentColor"/></svg>';

  function done(form) {
    var box = document.createElement('div');
    box.className = 'ask-done';
    box.setAttribute('role', 'status');
    box.innerHTML = SEAL;
    var p = document.createElement('p');
    p.textContent = DONE;
    box.appendChild(p);
    form.replaceWith(box);
    try { window.dispatchEvent(new Event('fv-list-sent')); } catch (e) {}
  }

  function submit(e) {
    e.preventDefault();
    var form = e.currentTarget;
    var name = form.elements.name.value.trim();
    var contact = form.elements.contact.value.trim();
    if (name.length < 2) { status(form, 'Enter your name.'); form.elements.name.focus(); return; }
    if (contact.length < 5) { status(form, 'Enter a phone number or an email address.'); form.elements.contact.focus(); return; }
    var body = {
      name: name,
      contact: contact,
      business: form.elements.business ? form.elements.business.value.trim() : '',
      note: form.elements.note ? form.elements.note.value.trim() : '',
      botcheck: form.elements.botcheck ? form.elements.botcheck.value : ''
    };
    var button = form.querySelector('button[type="submit"]');
    if (button) button.disabled = true;
    status(form, 'Sending…');
    fetch(form.getAttribute('action') || '/api/request', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (data) {
        if (r.ok && data.ok) { done(form); return; }
        if (r.status === 503 || r.status >= 500) { status(form, FALLBACK); return; }
        status(form, data.error || FALLBACK);
      });
    }).catch(function () {
      status(form, FALLBACK);
    }).then(function () {
      if (button && document.body.contains(button)) button.disabled = false;
    });
  }

  for (var i = 0; i < forms.length; i++) forms[i].addEventListener('submit', submit);
})();
