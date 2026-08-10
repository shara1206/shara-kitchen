/* scale.js — shared serving scaler for Shara's recipe notes
   Usage on a page:
     <div class="scaler" data-base="1" data-max="8"></div>   <- control mounts here
     <p data-scale>…</p>  /  <ul data-scale>…</ul>           <- blocks whose numbers scale
     <span class="noscale">0.2g</span>                        <- opt out of scaling
     <script src="../assets/scale.js"></script>               <- AFTER lang.js
*/
(function () {
  'use strict';

  // ── styles ───────────────────────────────────────────────────────────────
  var CSS = ''
    + '.scaler{display:flex;align-items:center;flex-wrap:wrap;gap:10px 14px;background:var(--accent-soft,#f3d9b1);'
    + 'border:1px solid var(--border,#ead7b7);border-radius:10px;padding:12px 16px;margin:0 0 18px;'
    + "font-family:'Helvetica','PingFang SC',sans-serif;}"
    + '.scaler .scaler-label{font-size:.85rem;text-transform:uppercase;letter-spacing:.5px;color:var(--accent,#c97b3a);font-weight:bold;}'
    + ".scaler .scaler-value{font-size:1.35rem;font-weight:bold;color:var(--ink,#2b2b2b);font-family:'Georgia',serif;}"
    + '.scaler .scaler-btns{display:flex;gap:8px;margin-left:auto;flex-wrap:wrap;}'
    + '.scaler button{font:inherit;font-size:.95rem;font-weight:bold;padding:7px 14px;border-radius:8px;'
    + 'border:1px solid var(--accent,#c97b3a);background:#fff;color:var(--accent,#c97b3a);cursor:pointer;'
    + 'min-width:56px;transition:background .15s,color .15s;}'
    + '.scaler button:hover{background:var(--accent,#c97b3a);color:#fff;}'
    + '.scaler button:active{transform:translateY(1px);}'
    + '.scaler button:disabled{opacity:.35;cursor:default;}'
    + '.scaler button:disabled:hover{background:#fff;color:var(--accent,#c97b3a);}'
    + '.scaler button.reset{border-style:dashed;font-weight:normal;color:var(--muted,#6b6b6b);border-color:var(--muted,#6b6b6b);min-width:0;}'
    + '.scaler button.reset:hover{background:var(--muted,#6b6b6b);color:#fff;}'
    + '.qty{font-weight:bold;color:var(--accent,#c97b3a);}'
    + '.qty.qty-changed{background:rgba(201,123,58,.13);border-radius:3px;padding:0 2px;}'
    + '@media(max-width:560px){.scaler{justify-content:space-between}.scaler .scaler-btns{margin-left:0;width:100%}.scaler button{flex:1}}';

  // ── number parsing ───────────────────────────────────────────────────────
  var CN = {'一':1,'两':2,'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'十':10,'半':0.5};

  // units that legitimately scale with batch size
  var UNIT = '(?:g\\b|G\\b|克|kg\\b|公斤|ml\\b|mL\\b|ML\\b|毫升|L\\b|升|'
           + 'cups?\\b|杯|tablespoons?\\b|tbsp\\b|teaspoons?\\b|tsp\\b|'
           + '大勺|小勺|汤勺|茶勺|大匙|小匙|汤匙|茶匙|勺|匙|撮|'
           + '个(?!小时|月|星期|礼拜|钟头)|根|棵|条|块|袋|只|片|张|瓣|颗|把|支|盒|罐|斤|两(?![年成])|sticks?\\b|cloves?\\b|pieces?\\b)';

  // numeric forms: 1+3/4 | 3/4 | 1.5 | 200 | 三 | 两
  var VULGAR = { '\u00bd': [1,2], '\u00bc': [1,4], '\u00be': [3,4], '\u2153': [1,3], '\u2154': [2,3], '\u215b': [1,8] };
  var NUM = '(?:\\d+\\s*\\+\\s*\\d+\\s*/\\s*\\d+|\\d+\\s*/\\s*\\d+|\\d+(?:\\.\\d+)?'
          + '|[\u00bd\u00bc\u00be\u2153\u2154\u215b]|[一两二三四五六七八九十半])';
  var RE  = new RegExp('(' + NUM + ')(\\s*)(' + UNIT + ')', 'g');

  // phrases that mean "this number is a tolerance / limit / ratio", never a quantity
  var GUARD = /(?:误差|不超过|不能超过|超过|上下|左右|比例|至多|最多|每次|大约不超)[^，。；,;]{0,6}$/;

  function parseNum(raw) {
    var t = raw.replace(/\s+/g, '');
    if (VULGAR[t]) return { v: VULGAR[t][0] / VULGAR[t][1], kind: 'frac', den: VULGAR[t][1] };
    if (CN[t] !== undefined) return { v: CN[t], kind: 'cn' };
    var m = t.match(/^(\d+)\+(\d+)\/(\d+)$/);
    if (m) return { v: +m[1] + m[2] / m[3], kind: 'frac', den: +m[3] };
    m = t.match(/^(\d+)\/(\d+)$/);
    if (m) return { v: m[1] / m[2], kind: 'frac', den: +m[2] };
    var dec = (t.split('.')[1] || '').length;
    return { v: parseFloat(t), kind: 'dec', dec: dec };
  }

  function gcd(a, b) { return b ? gcd(b, a % b) : a; }

  function fmtFrac(v, den) {
    // keep the original fraction family (thirds stay thirds, else eighths)
    var base = (den % 3 === 0) ? 3 : 8;
    var n = Math.round(v * base);
    if (n === 0) return '0';
    var whole = Math.floor(n / base), rem = n % base;
    if (rem === 0) return String(whole);
    var g = gcd(rem, base);
    var f = (rem / g) + '/' + (base / g);
    return whole ? whole + '+' + f : f;
  }

  function fmtNum(p, f) {
    var v = p.v * f;
    if (p.kind === 'frac') return fmtFrac(v, p.den);
    if (Math.abs(v - Math.round(v)) < 1e-9) return String(Math.round(v));
    var dec = (p.kind === 'dec' && p.dec > 0) ? Math.max(p.dec, 1) : (v < 2 ? 2 : 1);
    return v.toFixed(dec).replace(/\.?0+$/, '');
  }

  // English units take an -s once the amount passes 1
  var PLURAL = /^(cup|tablespoon|teaspoon|stick|clove)s?$/i;
  function plural(unit, v) {
    var m = unit.match(PLURAL);
    if (!m) return unit;
    var stem = m[1];
    return v > 1 ? stem + 's' : stem;
  }

  function scaleText(text, f) {
    return text.replace(RE, function (whole, num, sp, unit, offset, full) {
      if (GUARD.test(full.slice(Math.max(0, offset - 12), offset))) return whole;
      var p = parseNum(num);
      if (!isFinite(p.v) || p.v === 0) return whole;
      // at base batch, show the number exactly as written (keeps 三个 / 两杯 intact)
      var out = f === 1 ? num : fmtNum(p, f);
      var u   = f === 1 ? unit : plural(unit, p.v * f);
      var cls = 'qty' + (f !== 1 ? ' qty-changed' : '');
      return '<span class="' + cls + '">' + out + '</span>' + sp + u;
    });
  }

  function scaleHTML(html, f) {
    var tpl = document.createElement('div');
    tpl.innerHTML = html;
    (function walk(node) {
      for (var i = 0; i < node.childNodes.length; i++) {
        var c = node.childNodes[i];
        if (c.nodeType === 3) {
          if (!c.nodeValue.trim()) continue;
          var html2 = scaleText(c.nodeValue.replace(/&/g, '&amp;').replace(/</g, '&lt;'), f);
          if (html2 !== c.nodeValue) {
            var span = document.createElement('span');
            span.innerHTML = html2;
            node.replaceChild(span, c);
            i += 0; // span replaces one node
          }
        } else if (c.nodeType === 1 && !/(^|\s)noscale(\s|$)/.test(c.className || '')) {
          // <span class="scale-num">2</span> — scale this number even with no unit next to it
          if (/(^|\s)scale-num(\s|$)/.test(c.className || '')) {
            var p = parseNum(c.textContent);
            if (isFinite(p.v) && p.v !== 0) {
              c.textContent = f === 1 ? c.textContent : fmtNum(p, f);
              c.className = 'qty' + (f !== 1 ? ' qty-changed' : '');
            }
          } else {
            walk(c);
          }
        }
      }
    })(tpl);
    return tpl.innerHTML;
  }

  // ── boot ─────────────────────────────────────────────────────────────────
  var mount = document.querySelector('.scaler');
  var blocks = [].slice.call(document.querySelectorAll('[data-scale]'));
  if (!mount || !blocks.length) return;

  var st = document.createElement('style'); st.textContent = CSS;
  document.head.appendChild(st);

  var BASE = parseFloat(mount.dataset.base) || 1;
  var MAX  = parseFloat(mount.dataset.max) || BASE * 6;
  var UNIT_ZH = mount.dataset.unitZh || '份';
  var UNIT_EN = mount.dataset.unitEn || (UNIT_ZH === '份' ? ' batch' : ' ' + UNIT_ZH);
  var servings = BASE;

  // pristine, load-time structure for every scalable block
  blocks.forEach(function (el) { el._src = el.innerHTML; });

  mount.innerHTML =
      '<span class="scaler-label"></span>'
    + '<span class="scaler-value"></span>'
    + '<span class="scaler-btns">'
    +   '<button type="button" data-step="0.5">+0.5</button>'
    +   '<button type="button" data-step="1">+1</button>'
    +   '<button type="button" class="reset" data-step="reset"></button>'
    + '</span>';

  var elLabel = mount.querySelector('.scaler-label');
  var elValue = mount.querySelector('.scaler-value');
  var elReset = mount.querySelector('.reset');

  function lang() {
    return document.documentElement.lang === 'zh-CN' ? 'zh' : 'en';
  }

  // lang.js paints [data-en][data-zh] elements; re-do that inside a restored block
  function applyLang(root, L) {
    var els = [].slice.call(root.querySelectorAll('[data-en][data-zh]'));
    if (root.hasAttribute('data-en') && root.hasAttribute('data-zh')) els.unshift(root);
    els.forEach(function (el) {
      var t = el.getAttribute('data-' + L);
      if (t !== null) el.innerHTML = t;
    });
  }

  function render() {
    var L = lang(), f = servings / BASE;
    elLabel.textContent = L === 'zh' ? '份数' : 'Batch';
    elValue.textContent = (servings % 1 === 0 ? servings : servings.toFixed(1))
                        + (L === 'zh' ? UNIT_ZH : UNIT_EN);
    elReset.textContent = L === 'zh' ? '重置' : 'Reset';
    mount.querySelector('[data-step="0.5"]').disabled = servings + 0.5 > MAX;
    mount.querySelector('[data-step="1"]').disabled = servings + 1 > MAX;
    elReset.disabled = servings === BASE;
    blocks.forEach(function (el) {
      el.innerHTML = el._src;                 // 1. pristine numbers back
      applyLang(el, L);                       // 2. right language (lang.js owns the text)
      el.innerHTML = scaleHTML(el.innerHTML, f);  // 3. scale
    });
  }

  mount.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-step]');
    if (!b || b.disabled) return;
    servings = b.dataset.step === 'reset'
      ? BASE
      : Math.min(MAX, Math.round((servings + parseFloat(b.dataset.step)) * 2) / 2);
    render();
  });

  // lang.js repaints [data-en][data-zh] on toggle — re-scale right after it
  document.querySelectorAll('.lang-toggle button').forEach(function (b) {
    b.addEventListener('click', function () { setTimeout(render, 0); });
  });

  render();
})();
