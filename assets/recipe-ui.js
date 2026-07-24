/**
 * recipe-ui.js — shared interactive enhancements for drink recipe pages
 * Features: portions scaler + step timers. Bilingual-system-aware.
 */
(function () {
  'use strict';

  /* ── Injected styles ──────────────────────────────────────────────────── */
  const CSS = `
    .portions-widget {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      background: var(--accent-soft);
      border: 1px solid var(--border);
      border-radius: 8px;
      margin-bottom: 20px;
      font-family: 'Helvetica', 'PingFang SC', sans-serif;
    }
    .portions-label {
      color: var(--muted);
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .portions-controls {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .portions-btn {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--accent);
      font-size: 1.05rem;
      font-weight: 700;
      width: 28px;
      height: 28px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      padding: 0;
      transition: background 0.12s, color 0.12s;
    }
    .portions-btn:hover:not(:disabled) {
      background: var(--accent);
      color: white;
    }
    .portions-btn:disabled { opacity: 0.3; cursor: default; }
    .portions-display {
      min-width: 34px;
      text-align: center;
      font-weight: 700;
      font-size: 0.95rem;
      color: var(--accent);
    }
    .qty {
      font-weight: 700;
      color: var(--accent);
    }
    .timer-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-left: 8px;
      padding: 2px 10px 2px 8px;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 20px;
      color: var(--muted);
      font-size: 0.8rem;
      font-family: 'Helvetica Neue', 'Helvetica', 'PingFang SC', sans-serif;
      cursor: pointer;
      vertical-align: middle;
      transition: border-color 0.12s, color 0.12s, background 0.12s;
      white-space: nowrap;
    }
    .timer-btn:hover { border-color: var(--accent); color: var(--accent); }
    .timer-btn.running {
      background: #f0faf0;
      border-color: #5a9e5a;
      color: #2d6e2d;
      font-weight: 600;
      animation: timer-tick 1s ease-in-out infinite;
    }
    .timer-btn.done {
      background: #fff8f0;
      border-color: var(--accent);
      color: var(--accent);
      font-weight: 700;
      animation: none;
    }
    @keyframes timer-tick {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.65; }
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  /* ── State ────────────────────────────────────────────────────────────── */
  const MULTS = [0.5, 1, 2, 3];
  let multIdx = 1;
  const timerMap = new Map(); // btn → { interval, running }

  /* ── Boot ─────────────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    buildPortionsWidget();
    injectTimers();
    hookLang();
  });

  /* ── Portions ─────────────────────────────────────────────────────────── */
  function buildPortionsWidget() {
    if (!document.querySelector('li[data-base]')) return;

    var widget = document.createElement('div');
    widget.className = 'portions-widget';
    widget.innerHTML =
      '<span class="portions-label" data-en="Servings" data-zh="份量">份量</span>' +
      '<div class="portions-controls">' +
      '<button class="portions-btn" id="portions-down" aria-label="less">−</button>' +
      '<span class="portions-display" id="portions-display">1×</span>' +
      '<button class="portions-btn" id="portions-up" aria-label="more">+</button>' +
      '</div>';

    var anchor = document.querySelector('.recipe-notes h3');
    if (anchor) anchor.parentNode.insertBefore(widget, anchor);

    document.getElementById('portions-down').addEventListener('click', function () {
      if (multIdx > 0) { multIdx--; applyMult(); }
    });
    document.getElementById('portions-up').addEventListener('click', function () {
      if (multIdx < MULTS.length - 1) { multIdx++; applyMult(); }
    });
    applyMult();
  }

  function applyMult() {
    var m = MULTS[multIdx];
    var display = document.getElementById('portions-display');
    var down = document.getElementById('portions-down');
    var up = document.getElementById('portions-up');
    if (!display) return;
    display.textContent = m + '×';
    down.disabled = multIdx === 0;
    up.disabled = multIdx === MULTS.length - 1;
    refreshQty(m);
  }

  function refreshQty(m) {
    document.querySelectorAll('li[data-base]').forEach(function (li) {
      var base = parseFloat(li.dataset.base);
      var unit = li.dataset.unit || '';
      var val = base * m;
      var str = fmtN(val);
      var span = li.querySelector('.qty');
      if (!span) {
        span = document.createElement('span');
        span.className = 'qty';
        li.appendChild(span);
      }
      span.textContent = ' ' + str + unit;
    });
  }

  function fmtN(n) {
    if (n < 1) return parseFloat(n.toFixed(2)).toString();
    var r = Math.round(n * 10) / 10;
    return (r % 1 === 0) ? r.toFixed(0) : r.toString();
  }

  /* ── Timers ───────────────────────────────────────────────────────────── */
  function injectTimers() {
    document.querySelectorAll('li[data-timer]').forEach(function (li) {
      if (li.querySelector('.timer-btn')) return;
      var secs = parseInt(li.dataset.timer, 10);
      if (!secs) return;

      var btn = document.createElement('button');
      btn.className = 'timer-btn';
      btn.innerHTML = '<span>⏱</span><span class="tlabel">' + fmtT(secs) + '</span>';

      (function (totalSecs) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          runTimer(btn, totalSecs);
        });
      })(secs);

      li.appendChild(btn);
    });
  }

  function runTimer(btn, totalSecs) {
    var state = timerMap.get(btn);
    if (state && state.running) {
      clearInterval(state.interval);
      timerMap.delete(btn);
      btn.classList.remove('running', 'done');
      btn.querySelector('.tlabel').textContent = fmtT(totalSecs);
      return;
    }
    var rem = totalSecs;
    btn.classList.add('running');
    btn.classList.remove('done');
    btn.querySelector('.tlabel').textContent = fmtT(rem);

    var iv = setInterval(function () {
      rem--;
      if (rem <= 0) {
        clearInterval(iv);
        timerMap.delete(btn);
        btn.classList.remove('running');
        btn.classList.add('done');
        btn.querySelector('.tlabel').textContent = '✓';
        setTimeout(function () {
          btn.classList.remove('done');
          btn.querySelector('.tlabel').textContent = fmtT(totalSecs);
        }, 4000);
        return;
      }
      btn.querySelector('.tlabel').textContent = fmtT(rem);
    }, 1000);

    timerMap.set(btn, { running: true, interval: iv });
  }

  function fmtT(s) {
    var m = Math.floor(s / 60);
    var sec = s % 60;
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  /* ── Lang-switch hook ─────────────────────────────────────────────────── */
  function hookLang() {
    document.querySelectorAll('.lang-toggle button').forEach(function (b) {
      b.addEventListener('click', function () {
        setTimeout(function () {
          refreshQty(MULTS[multIdx]);
          injectTimers();
          // keep portions-label bilingual
          var lbl = document.querySelector('.portions-label');
          if (lbl) {
            var lang = document.documentElement.lang === 'zh-CN' ? 'zh' : 'en';
            lbl.textContent = lang === 'zh' ? '份量' : 'Servings';
          }
        }, 0);
      });
    });
  }

})();
