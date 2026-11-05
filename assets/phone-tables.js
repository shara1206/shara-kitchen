/* phone-tables.js — on phones (≤640px) data tables (with a <thead> and ≥3 columns) become stacked cards:
   one card per row, the first cell as the card title, every other value labelled with its column header.
   Labels are read from the header cells, so they follow the EN / 中文 toggle.
   Use: <script src="../assets/phone-tables.js"></script> after lang.js. Opt a table out with data-no-cards.
   Desktop and tablet layouts are untouched (everything sits inside the 640px media query). */
(function () {
  var css = '@media (max-width: 640px){' +
    'table.pt-cards,table.pt-cards tbody,table.pt-cards tr,table.pt-cards td,table.pt-cards tbody th{display:block!important;width:auto!important;min-width:0!important;max-width:none!important;white-space:normal!important;box-sizing:border-box}' +
    'table.pt-cards thead{display:none!important}' +
    'table.pt-cards{background:transparent;box-shadow:none;border:0;border-radius:0;overflow:visible!important;margin-left:0;margin-right:0}' +
    'table.pt-cards tr{background:var(--card,#fff);border:1px solid var(--border,#ead7b7);border-radius:10px;padding:10px 14px;margin:0 0 12px;box-shadow:0 1px 4px rgba(0,0,0,.04)}' +
    'table.pt-cards td,table.pt-cards tbody th{border-top:0;border-right:0;border-bottom:0;padding:4px 0;text-align:left;background:transparent}' +
    'table.pt-cards tr>:first-child{font-weight:600;color:var(--accent,#c97b3a);padding-bottom:6px}' +
    'table.pt-cards [data-pt-label]:not(:first-child)::before{content:attr(data-pt-label);display:block;font-size:.72em;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--muted,#6b6b6b);margin-bottom:1px;font-family:Helvetica,"PingFang SC","Microsoft YaHei",sans-serif}' +
    '}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function label() {
    var tables = document.querySelectorAll('table');
    for (var i = 0; i < tables.length; i++) {
      var t = tables[i];
      if (t.hasAttribute('data-no-cards') || !t.tHead || !t.tHead.rows.length) continue;
      var hr = t.tHead.rows[t.tHead.rows.length - 1], heads = [];
      for (var c = 0; c < hr.cells.length; c++) {
        var txt = hr.cells[c].textContent.replace(/\s+/g, ' ').trim();
        for (var k = 0; k < (hr.cells[c].colSpan || 1); k++) heads.push(txt);
      }
      if (heads.length < 3) continue;
      t.classList.add('pt-cards');
      for (var b = 0; b < t.tBodies.length; b++) {
        var rows = t.tBodies[b].rows;
        for (var r = 0; r < rows.length; r++) {
          var idx = 0;
          for (var j = 0; j < rows[r].cells.length; j++) {
            var cell = rows[r].cells[j];
            if (heads[idx]) cell.setAttribute('data-pt-label', heads[idx]);
            idx += cell.colSpan || 1;
          }
        }
      }
    }
  }
  label();
  var btns = document.querySelectorAll('.lang-toggle button');
  for (var x = 0; x < btns.length; x++) btns[x].addEventListener('click', function () { setTimeout(label, 0); });
})();
