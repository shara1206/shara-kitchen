// ════════════════════════════════════════════════════════════════
//  Shara's Kitchen — Wish List Google Apps Script
//  Paste this entire file into Google Apps Script, then deploy.
//
//  SETUP (takes ~5 minutes):
//
//  1. Go to https://docs.google.com/spreadsheets/
//     Create a new spreadsheet. Name it "心愿菜单" or anything you like.
//     Note the spreadsheet ID from the URL:
//       https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit
//
//  2. Go to https://script.google.com/
//     Click "New project". Paste this entire file (replacing the default code).
//
//  3. In the Apps Script editor, select the "setup" function from the dropdown
//     and click ▶ Run. This creates the "Wishes" tab with headers automatically.
//     (You only need to do this once.)
//
//  4. The spreadsheet ID is already filled in below
//     (sheet "Shara's Kitchen — 心愿菜单"; this code lives in the Apps Script project "Wish List").
//
//  5. Click Deploy → New deployment → Web app
//       Execute as: Me (your Google account)
//       Who has access: Anyone
//     Click Deploy. Copy the Web app URL.
//
//  6. Open wishlist.html in a text editor.
//     Find the line:  const SCRIPT_URL = 'YOUR_APPS_SCRIPT_URL_HERE';
//     Replace YOUR_APPS_SCRIPT_URL_HERE with the URL you just copied.
//     Save the file.
//
//  7. Done! Every wish list submission will appear as a new row in your Sheet,
//     and an email goes to the Google account that runs this script (see notifyOwner_).
//     Run "testNotify" once from the editor: it grants the send-email permission and
//     sends you a sample email. Then Deploy → Manage deployments → edit → New version.
// ════════════════════════════════════════════════════════════════

// The access password is NOT in this file. Set it in the Apps Script editor:
//   Project Settings (gear) → Script properties → Add: WISH_PASSWORD = <password>
// No property set → every request is refused (fails closed).
const SPREADSHEET_ID = '1UZtf1vOAFRP5f5WyqGtnyz3jHLlbs2OWb3TZsrLMRu8';
const SHEET_NAME     = 'Wishes';
// Notifications go to the account that runs the script (Execute as: Me) — no address is stored in this file.

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ── Main handler ──
// {action:'check', pw}  → {result:'ok'} | {result:'denied'}   (password gate)
// {pw, name, dishes…}   → {result:'success'} | {result:'denied'} | {result:'error'}
function doPost(e) {
  try {
    let data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (_) {
      data = {};
    }

    const expected = PropertiesService.getScriptProperties().getProperty('WISH_PASSWORD') || '';
    if (!expected || String(data.pw || '') !== expected) return json_({ result: 'denied' });
    if (data.action === 'check') return json_({ result: 'ok' });

    const name        = data.name         || '(no name)';
    const occasion    = data.occasion     || '';
    const dishes      = Array.isArray(data.dishes) ? data.dishes.join('、') : '';
    const special     = data.special      || '';
    const lang        = data.lang         || '';
    const submittedAt = data.submitted_at || new Date().toLocaleString('zh-CN');

    const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
    sheet.appendRow([submittedAt, name, occasion, dishes, special, lang]);

    // The row is saved; a failed email must not turn this into an error (the guest would resubmit → duplicate row).
    try {
      notifyOwner_({ name, occasion, dishList: Array.isArray(data.dishes) ? data.dishes : [], special, lang, submittedAt }, ss.getUrl());
    } catch (mailErr) {
      console.error('notify failed: ' + mailErr);
    }

    return json_({ result: 'success' });

  } catch (err) {
    return json_({ result: 'error', message: err.toString() });
  }
}

// ── Email to the script owner for each new wish (plain text, so guest input can't inject markup) ──
function notifyOwner_(w, sheetUrl) {
  const to = Session.getEffectiveUser().getEmail();
  if (!to) return;
  const oneLine = t => String(t).replace(/[\r\n]+/g, ' ').trim();
  const shortName = oneLine(w.name).slice(0, 40);
  const n = w.dishList.length;
  const subject = `🍜 新心愿：${shortName}（${n} 道菜）`;
  const body = [
    `名字：${w.name}`,
    `场合：${w.occasion || '（未填）'}`,
    `想吃的菜（${n} 道）：`,
    n ? w.dishList.map(d => `  · ${d}`).join('\n') : '  （没有勾选菜单上的菜）',
    `特别要求：${w.special || '（无）'}`,
    `提交时间：${w.submittedAt}　语言：${w.lang || '-'}`,
    '',
    `打开表格：${sheetUrl}`,
  ].join('\n');
  MailApp.sendEmail(to, subject, body, { name: "Shara's Kitchen 心愿单" });
}

// Run once from the editor: grants the send-email permission and sends a sample (writes no row).
function testNotify() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  notifyOwner_({
    name: '测试用户', occasion: '周末聚餐', dishList: ['白斩鸡', '醋溜土豆丝'],
    special: '不吃香菜', lang: 'zh', submittedAt: new Date().toLocaleString('zh-CN')
  }, ss.getUrl());
  Logger.log('✅ sample email sent to ' + Session.getEffectiveUser().getEmail());
}

// ── One-time setup + full formatting ──
// Select "setup" from the dropdown and click ▶ Run.
// Grant permissions when Google asks, then check your spreadsheet.
function setup() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // ── 1. Create or get the Wishes sheet ──
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    // Insert at position 1 (front)
    sheet = ss.insertSheet(SHEET_NAME, 0);
  }

  // ── 2. Headers ──
  const headers = ['时间', '姓名', '场合', '菜单选择', '特别要求', '语言'];
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);

  // ── 3. Header styling ──
  headerRange.setBackground('#c97b3a');          // warm orange
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  headerRange.setFontSize(11);
  headerRange.setHorizontalAlignment('center');
  headerRange.setVerticalAlignment('middle');
  sheet.setRowHeight(1, 36);

  // ── 4. Freeze header & enable filter ──
  sheet.setFrozenRows(1);
  if (!sheet.getFilter()) sheet.getRange(1, 1, 1, headers.length).createFilter();  // safe to re-run

  // ── 5. Column widths ──
  sheet.setColumnWidth(1, 165); // 时间
  sheet.setColumnWidth(2, 110); // 姓名
  sheet.setColumnWidth(3, 150); // 场合
  sheet.setColumnWidth(4, 420); // 菜单选择  ← widest
  sheet.setColumnWidth(5, 260); // 特别要求
  sheet.setColumnWidth(6,  70); // 语言

  // ── 6. Data rows: wrap text for 菜单选择 & 特别要求, clip others ──
  // Apply to rows 2–200 (covers future submissions)
  sheet.getRange(2, 1, 200, 6).setWrap(false);
  sheet.getRange(2, 4, 200, 1).setWrap(true);   // 菜单选择 wraps
  sheet.getRange(2, 5, 200, 1).setWrap(true);   // 特别要求 wraps

  // ── 7. Alternating row colors (banded range) ──
  // Remove any existing banding first
  sheet.getBandedRanges().forEach(b => b.remove());
  const dataRange = sheet.getRange(1, 1, 200, headers.length);
  const banding = dataRange.applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY);
  banding.setHeaderRowColor('#c97b3a');
  banding.setFirstRowColor('#ffffff');
  banding.setSecondRowColor('#fdf6ec');  // soft cream — matches your site

  // ── 8. Center-align 时间 and 语言 columns ──
  sheet.getRange(2, 1, 200, 1).setHorizontalAlignment('center'); // 时间
  sheet.getRange(2, 6, 200, 1).setHorizontalAlignment('center'); // 语言

  // ── 9. Tab color ──
  sheet.setTabColor('#c97b3a');

  // ── 10. Rename the spreadsheet (cosmetic) ──
  ss.rename('Shara\'s Kitchen — 心愿菜单');

  Logger.log('✅ Sheet formatted and ready!');
}

// ── Test function (run manually in Apps Script editor to verify) ──
function testDoPost() {
  const fake = {
    postData: {
      contents: JSON.stringify({
        pw: PropertiesService.getScriptProperties().getProperty('WISH_PASSWORD'),
        name: '测试用户',
        occasion: '周末聚餐',
        dishes: ['白斩鸡', '醋溜土豆丝', '番茄牛腩'],
        special: '不吃香菜',
        lang: 'zh',
        submitted_at: new Date().toLocaleString('zh-CN')
      })
    }
  };
  const result = doPost(fake);
  Logger.log(result.getContent());
}
