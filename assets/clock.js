/* The header clock. Cocoa Beach time, minutes only, updated on the minute. */
(function () {
  var el = document.getElementById('clock');
  if (!el || !window.Intl) return;
  var fmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' });
  function tick() {
    var now = new Date();
    el.textContent = 'Cocoa Beach, FL — ' + fmt.format(now);
    el.setAttribute('datetime', now.toISOString().slice(0, 16));
    setTimeout(tick, (60 - now.getSeconds()) * 1000 + 50);
  }
  tick();
})();
