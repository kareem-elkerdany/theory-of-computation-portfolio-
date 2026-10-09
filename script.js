(function () {
  var toggle = document.getElementById('theme-toggle');
  if (toggle) {
    var stored = null;
    try { stored = localStorage.getItem('theme'); } catch (e) {}
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = stored ? stored === 'dark' : prefersDark;

    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    toggle.checked = dark;

    function applyTheme() {
      var theme = toggle.checked ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', theme);
      try { localStorage.setItem('theme', theme); } catch (e) {}
    }

    toggle.addEventListener('change', applyTheme);
    toggle.addEventListener('click', applyTheme);
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

// Two-button lock activity: the same input read by an NFA and a DFA (Σ = {A, B}).
(function () {
  var keys = Array.prototype.slice.call(document.querySelectorAll('.lock-btn[data-key]'));
  if (!keys.length) return;
  var resetBtn = document.getElementById('lock-reset');
  var inputEl = document.getElementById('lock-input');
  var nfaEl = document.getElementById('lock-nfa-set');
  var dfaEl = document.getElementById('lock-dfa-state');
  var verdictEl = document.getElementById('lock-verdict');
  var traceEl = document.getElementById('lock-trace');

  var dfaTable = {
    0: { A: 1, B: 0 },
    1: { A: 1, B: 2 },
    2: { A: 2, B: 2 }
  };

  var typed, nfa, dfa;

  function nfaStep(set, k) {
    var next = {};
    if (set[0]) { next[0] = true; if (k === 'A') next[1] = true; }
    if (set[1] && k === 'B') next[2] = true;
    if (set[2]) next[2] = true;
    return next;
  }

  function fmt(set) {
    var names = [];
    for (var i = 0; i < 3; i++) if (set[i]) names.push('n' + i);
    return '{' + names.join(', ') + '}';
  }

  function paint() {
    Array.prototype.forEach.call(document.querySelectorAll('#lock-nfa .lock-circle[data-n]'), function (c) {
      c.classList.toggle('active', !!nfa[c.dataset.n]);
    });
    Array.prototype.forEach.call(document.querySelectorAll('#lock-nfa .lock-label'), function (l) {
      l.classList.toggle('on', !!nfa[l.dataset.nl]);
    });
    Array.prototype.forEach.call(document.querySelectorAll('#lock-dfa .lock-circle[data-d]'), function (c) {
      c.classList.toggle('active', Number(c.dataset.d) === dfa);
    });
    Array.prototype.forEach.call(document.querySelectorAll('#lock-dfa .lock-label'), function (l) {
      l.classList.toggle('on', Number(l.dataset.dl) === dfa);
    });
    inputEl.textContent = typed.length ? typed.join(' ') : '\u03b5 (empty)';
    nfaEl.textContent = fmt(nfa);
    dfaEl.textContent = 'S' + dfa;
    var open = dfa === 2;
    verdictEl.textContent = open ? 'Unlocked (accepted)' : 'Locked';
    verdictEl.classList.toggle('open', open);
  }

  function addRow(step, key) {
    var tr = document.createElement('tr');
    [String(step), key, fmt(nfa), 'S' + dfa].forEach(function (t) {
      var td = document.createElement('td');
      td.textContent = t;
      tr.appendChild(td);
    });
    traceEl.appendChild(tr);
    var box = traceEl.parentNode.parentNode;
    box.scrollTop = box.scrollHeight;
  }

  function reset() {
    typed = [];
    nfa = { 0: true };
    dfa = 0;
    traceEl.innerHTML = '';
    addRow(0, 'start');
    paint();
  }

  keys.forEach(function (b) {
    b.addEventListener('click', function () {
      var k = b.dataset.key;
      typed.push(k);
      nfa = nfaStep(nfa, k);
      dfa = dfaTable[dfa][k];
      addRow(typed.length, k);
      paint();
    });
  });
  resetBtn.addEventListener('click', reset);
  reset();
})();
