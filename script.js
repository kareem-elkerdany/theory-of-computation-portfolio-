(function () {
  var toggle = document.getElementById('theme-toggle');
  if (toggle) {
    var stored = null;
    try { stored = localStorage.getItem('theme'); } catch (e) {}
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = stored ? stored === 'dark' : prefersDark;

    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    toggle.checked = dark;

    toggle.addEventListener('change', function () {
      var theme = toggle.checked ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', theme);
      try { localStorage.setItem('theme', theme); } catch (e) {}
    });
  }
})();

(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var circles = Array.prototype.slice.call(document.querySelectorAll('.state-circle[data-state]'));
  var labels = Array.prototype.slice.call(document.querySelectorAll('.state-label'));
  var edges = Array.prototype.slice.call(document.querySelectorAll('.edge-path[data-edge]'));
  var buttons = Array.prototype.slice.call(document.querySelectorAll('.dfa-btn'));
  var readout = document.getElementById('state-readout');
  var stateNames = { 0: 'Locked', 1: 'Unlocked' };

  var current = 0;
  var autoplayId = null;
  var busy = false;

  function paint(step) {
    circles.forEach(function (c) {
      c.classList.toggle('active', step.state !== undefined && Number(c.dataset.state) === step.state);
    });
    labels.forEach(function (l) {
      l.classList.toggle('active-label', step.state !== undefined && Number(l.dataset.label) === step.state);
    });
    edges.forEach(function (e) {
      e.classList.toggle('active', step.edge !== undefined && e.dataset.edge === step.edge);
    });
  }

  // Autoplay: a gentle demo loop until the visitor takes the controls.
  var autoSteps = [{ state: 0 }, { edge: '0-1' }, { state: 1 }, { edge: '1-0' }];
  var autoIdx = 0;
  paint(autoSteps[0]);
  if (!reduceMotion) {
    autoplayId = setInterval(function () {
      autoIdx = (autoIdx + 1) % autoSteps.length;
      paint(autoSteps[autoIdx]);
    }, 1200);
  }

  function stopAutoplay() {
    if (autoplayId !== null) {
      clearInterval(autoplayId);
      autoplayId = null;
    }
  }

  function transition(state, symbol) {
    // Matches the transition table: Coin always unlocks, Push always locks.
    return symbol === 'coin' ? 1 : 0;
  }

  function press(symbol) {
    if (busy) return;
    stopAutoplay();
    busy = true;
    buttons.forEach(function (b) { b.disabled = true; });

    var next = transition(current, symbol);
    var edgeId = current + '-' + next;
    paint({ edge: edgeId });

    setTimeout(function () {
      current = next;
      paint({ state: current });
      readout.textContent = stateNames[current];
      buttons.forEach(function (b) { b.disabled = false; });
      busy = false;
    }, reduceMotion ? 0 : 500);
  }

  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      press(btn.dataset.symbol);
    });
  });
})();
