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
//  USERNAMES (added 2026-11): guests log in with a username + the shared password. The script keeps
//     "Users"  — 用户名 | 名字 | 第一次 | 最近一次   (名字 is asked once, the first time a username is used;
//                edit it here and the page shows the new name from the next login)
//     "Hearts" — 用户名 | 名字 | 菜名 | 时间       (one row per ❤ dish)
//     "Wishes" — column G 用户名 is filled for new submissions. A guest's 点过几次 counts are counted from
//                Wishes: rows with their username, plus older rows (no username) whose 姓名 equals their 名字.
//     Both tabs are created automatically. After pasting a new version: Deploy → Manage deployments →
//     edit → Version: New version (the URL stays the same).
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
const USERS_SHEET    = 'Users';
const HEARTS_SHEET   = 'Hearts';
const WISH_USER_COL  = 7;   // Wishes column G: 用户名
// Notifications go to the account that runs the script (Execute as: Me) — no address is stored in this file.

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Usernames and names: trimmed, inner spaces collapsed, max 30 chars; usernames compare case-insensitively.
function clean_(s, max) { return String(s == null ? '' : s).normalize('NFKC').trim().replace(/\s+/g, ' ').slice(0, max || 30); }
function key_(s)        { return clean_(s).toLowerCase(); }

function tab_(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name, ss.getSheets().length);          // new tabs go after the existing ones
    sh.getRange(1, 1, 1, headers.length).setValues([headers])
      .setFontWeight('bold').setBackground('#c97b3a').setFontColor('#ffffff');
    sh.setFrozenRows(1);
  }
  return sh;
}
function rows_(sh) {   // data rows (no header) as a 2-D array
  const n = sh ? sh.getLastRow() : 0;
  return n < 2 ? [] : sh.getRange(2, 1, n - 1, Math.max(sh.getLastColumn(), 1)).getValues();
}
function findUser_(ss, key) {
  const users = ss.getSheetByName(USERS_SHEET), list = rows_(users);
  for (let i = 0; i < list.length; i++) if (key_(list[i][0]) === key) return { sheet: users, row: i + 2, user: String(list[i][0]), name: clean_(list[i][1]) || String(list[i][0]) };
  return null;
}

// 点过几次: Wishes rows with this username, plus older rows (no username yet) whose 姓名 equals the user's 名字
function counts_(ss, key, name) {
  const counts = {}, nameKey = key_(name);
  rows_(ss.getSheetByName(SHEET_NAME)).forEach(r => {
    const u = key_(r[WISH_USER_COL - 1]);
    if (u ? u !== key : key_(r[1]) !== nameKey) return;
    String(r[3] || '').split('、').map(d => d.trim()).filter(Boolean).forEach(d => { counts[d] = (counts[d] || 0) + 1; });
  });
  return counts;
}
function hearts_(ss, key) {
  return rows_(ss.getSheetByName(HEARTS_SHEET)).filter(r => key_(r[0]) === key).map(r => String(r[2]));
}

// {action:'check', v:2, pw, user, create?, name?}
//   → {result:'ok', v:2, user, name, hearts:[…], counts:{dish:n}}
//   → {result:'new', v:2}        username not seen before: the page asks for a 名字, then repeats with create:true + name
//   → {result:'needname', v:2}   create:true but no 名字
// (Sent as action 'check' on purpose: a not-yet-updated script just answers {result:'ok'} and writes nothing.)
function login_(ss, data) {
  const user = clean_(data.user), key = key_(user);
  if (!key) return { result: 'error', v: 2, message: 'no username' };
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const now = new Date();
    let u = findUser_(ss, key);
    if (u) {
      u.sheet.getRange(u.row, 4).setValue(now);                 // 最近一次
    } else {
      if (!data.create) return { result: 'new', v: 2 };
      const name = clean_(data.name);
      if (!name) return { result: 'needname', v: 2 };
      tab_(ss, USERS_SHEET, ['用户名', '名字', '第一次', '最近一次']).appendRow([user, name, now, now]);
      u = { user: user, name: name };
    }
    return { result: 'ok', v: 2, user: u.user, name: u.name, hearts: hearts_(ss, key), counts: counts_(ss, key, u.name) };
  } finally {
    lock.releaseLock();
  }
}

// {action:'hearts', pw, user, add:[dish…], remove:[dish…]} → {result:'ok'}
function setHearts_(ss, data) {
  const key = key_(data.user);
  const list = v => (Array.isArray(v) ? v : []).map(d => clean_(d, 80)).filter(Boolean).slice(0, 300);
  const add = list(data.add), remove = list(data.remove);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const u = key ? findUser_(ss, key) : null;
    if (!u) return { result: 'error', message: 'unknown user' };
    const sh = tab_(ss, HEARTS_SHEET, ['用户名', '名字', '菜名', '时间']);
    const rows = rows_(sh), have = {};
    for (let i = rows.length - 1; i >= 0; i--) {             // bottom-up so row numbers stay valid
      if (key_(rows[i][0]) !== key) continue;
      const dish = String(rows[i][2]);
      if (remove.indexOf(dish) >= 0 || have[dish]) sh.deleteRow(i + 2);   // removed, or a duplicate
      else have[dish] = true;
    }
    const now = new Date(), fresh = [];
    add.forEach(d => { if (!have[d] && remove.indexOf(d) < 0) { have[d] = true; fresh.push([u.user, u.name, d, now]); } });
    if (fresh.length) sh.getRange(sh.getLastRow() + 1, 1, fresh.length, 4).setValues(fresh);
    return { result: 'ok' };
  } finally {
    lock.releaseLock();
  }
}

// ── Main handler ──
// {action:'check', pw}            → {result:'ok'} | {result:'denied'}   (password gate, old page)
// {action:'check', v:2, pw, user…} → login, see login_()                (current page)
// {action:'hearts', pw, user, …}   → see setHearts_()
// {pw, name, user, dishes…}        → {result:'success'} | {result:'denied'} | {result:'error'}
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
    if (data.action === 'check' && data.v !== 2) return json_({ result: 'ok' });
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    if (data.action === 'check')  return json_(login_(ss, data));
    if (data.action === 'hearts') return json_(setHearts_(ss, data));
    if (data.action) return json_({ result: 'error', message: 'unknown action' });   // never turn an unknown action into a wish row

    const name        = data.name         || '(no name)';
    const user        = clean_(data.user);
    const occasion    = data.occasion     || '';
    const dishes      = Array.isArray(data.dishes) ? data.dishes.join('、') : '';
    const special     = data.special      || '';
    const lang        = data.lang         || '';
    const submittedAt = data.submitted_at || new Date().toLocaleString('zh-CN');

    const sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
    if (user && !sheet.getRange(1, WISH_USER_COL).getValue()) sheet.getRange(1, WISH_USER_COL).setValue('用户名');
    sheet.appendRow(user ? [submittedAt, name, occasion, dishes, special, lang, user] : [submittedAt, name, occasion, dishes, special, lang]);

    // The row is saved; a failed email must not turn this into an error (the guest would resubmit → duplicate row).
    try {
      notifyOwner_({ name, user, occasion, dishList: Array.isArray(data.dishes) ? data.dishes : [], special, lang, submittedAt }, ss.getUrl());
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
    `名字：${w.name}${w.user ? '（用户名 ' + w.user + '）' : ''}`,
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
  const headers = ['时间', '姓名', '场合', '菜单选择', '特别要求', '语言', '用户名'];
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
  sheet.setColumnWidth(7, 110); // 用户名

  // ── 6. Data rows: wrap text for 菜单选择 & 特别要求, clip others ──
  // Apply to rows 2–200 (covers future submissions)
  sheet.getRange(2, 1, 200, headers.length).setWrap(false);
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
        user: 'test',
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
