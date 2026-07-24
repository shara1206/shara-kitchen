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
//  4. The spreadsheet ID is already filled in below.
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
//  7. Done! Every wish list submission will appear as a new row in your Sheet.
//     You'll also get an email notification (optional — see NOTIFY_EMAIL below).
// ════════════════════════════════════════════════════════════════

const SPREADSHEET_ID = '1UZtf1vOAFRP5f5WyqGtnyz3jHLlbs2OWb3TZsrLMRu8';
const SHEET_NAME     = 'Wishes';
const NOTIFY_EMAIL   = '';  // ← optional: your email for notifications, e.g. 'you@gmail.com'
                            //   Leave empty '' to skip email notifications.

// ── Main handler ──
function doPost(e) {
  try {
    let data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (_) {
      data = {};
    }

    const name        = data.name         || '(no name)';
    const occasion    = data.occasion     || '';
    const dishes      = Array.isArray(data.dishes) ? data.dishes.join('、') : '';
    const special     = data.special      || '';
    const lang        = data.lang         || '';
    const submittedAt = data.submitted_at || new Date().toLocaleString('zh-CN');

    const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    sheet.appendRow([submittedAt, name, occasion, dishes, special, lang]);

    // Optional email notification
    if (NOTIFY_EMAIL) {
      const subject = `🍜 新心愿单：${name}`;
      const body = [
        `姓名：${name}`,
        `场合：${occasion || '未填写'}`,
        `选择菜肴：${dishes || '（未选）'}`,
        `特别要求：${special || '（无）'}`,
        `提交时间：${submittedAt}`,
      ].join('\n');
      MailApp.sendEmail(NOTIFY_EMAIL, subject, body);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
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
  sheet.getRange(1, 1, 1, headers.length).createFilter();

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
