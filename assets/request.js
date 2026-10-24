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

  function done(form) {
    var p = document.createElement('p');
    p.className = 'ask-done';
    p.setAttribute('role', 'status');
    p.textContent = DONE;
    form.replaceWith(p);
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
