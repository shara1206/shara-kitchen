# Food site — maintainer rules

**This file is the single rulebook** for anyone editing this folder (any AI tool or a person).
`README.md` says what the site is; `kitchen-app/DEPLOY.md` says how to publish it. When a rule changes, change it here.
Last consolidated: 2026-11-04.

---

## 1. Every change — checklist
1. `python backup.py save "说明这次改动"`
2. Edit — put the page in the right place (§2) and follow the page conventions (§4); every new page needs the
   noindex meta (§4.1)
3. Sync navigation (§3): `index.html` always; `menu.html` only for dishes Shara has made
4. `cd kitchen-app && python build-index.py` — rebuilds the app data from index.html
5. `python check.py` → must end with **0 errors**
6. Check layout at **412 / 810 / 1080 / 1440 / 2560 / 3440 px, in EN and 中文** (§6)
7. Report what you verified. Don't ask Shara to check it for you.

---

## 2. Where a page goes (分类规则)
Decide by the **main question the page answers**. Some pages touch two; file them by the question they
mainly answer and accept that the edge is a bit fuzzy.
（按页面主要回答哪个问题来归；两边都沾的，按主要问题归，接受边界有点模糊。）

| Place | Answers | Typical content |
|---|---|---|
| `study-topics/` · Study Topics | 是什么、买哪个 — what it is, which one to buy | varieties, labels, brands, sourcing, nutrition |
| `cooking-tips/` · Cooking Tips | 怎么做 — how to do it | ratios, heat control, technique, substitutions |
| `recipes/` · My Recipes | 有材料和步骤的具体做法 — a specific recipe | ingredient list + steps for one dish or component |
| `menu.html` | 只放菜 — dishes only | only dishes Shara has made (§3.2) |

- A subject that outgrows one page becomes a **hub** in `study-topics/` with sub-notes (§3.3).
- A recipe for a component (frosting, dough, sauce, chili oil) is still a recipe: `recipes/` + `data-type="base"`.
- **File names** (lowercase, hyphenated):
  - Study-topic sub-notes: **`<hub>-<topic>.html`**, English hub name first — `chicken-label-guide.html`, `eggs-freshness.html`, `seafood-shrimp.html`.
  - A study topic without sub-notes (or a hub itself): just the topic in English — `potato.html`, `starch.html`, `chicken.html`.
  - Recipes and cooking tips: the dish or technique, usually pinyin — `zha-jichi.html`, `zhajiao-mianhu.html`. Well-known
    English names stay English (`tiramisu`, `mochi`, `hot-n-juicy`, `boiling-shrimp`, `lemon-blueberry-cake`).
  - Renaming or moving a page changes its URL — update every link to it, including links inside data-en/data-zh and
    single-quoted ones (check.py lists any it misses), point its photo slot at `images/<new-slug>/`, and rebuild the app data.

---

## 3. Navigation & sync
`index.html` is the **source of truth**. The kitchen app is generated from it; descriptions must match reality.

### 3.1 index.html
- **Recipes** — `<li><a href="recipes/x.html" data-en="…" data-zh="…">…</a></li>` in the right section.
  `href` must be the **first attribute** (build-index.py matches `<a href="recipes/…`).
- **Cooking Tips / Study Topics** — a `<a class="topic-card" href="…">` card (class first, then href) with icon,
  `h3`, `div.count`, `p`, all bilingual. Keep the count badge and description true to the page.
- New file → add its link/card. Content, scope or count changed → update badge + description. Title changed → update the text.

### 3.2 Tried vs. to-try, and menu.html
`menu.html` lists only dishes Shara has actually made (a `dish-item` is an `<a>` when a recipe page exists,
a `<div>` when it doesn't; section counts are computed by its script). Untried recipe pages are marked on their
index link:

| marker on the index `<a>` | meaning | menu.html |
|---|---|---|
| *(none)* | a dish she has made | must be listed |
| `data-status="todo"` | page exists, not tried yet (index shows a 待试 / To try tag) | must NOT be listed |
| `data-type="base"` | sauce / dough / frosting / prep (油辣子, 大酱, 万能面团, 烫面, 裱花材料…) | never required |
| `data-type="guide"` | a how-to note left in `recipes/` — better: move it to `cooking-tips/` (none at the moment) | not listed, no status |

- New untried recipe → link with `data-status="todo"` (plus `data-type="base"` for a component).
- After she tries a dish → remove `data-status="todo"` **and** add a `dish-item` to menu.html.
- Every `dish-item` carries its sticker, and the bilingual attributes sit on the inner span (lang.js replaces
  `innerHTML`, which would wipe the `<img>` if they were on the item itself):
  `<a class="dish-item" href="recipes/x.html"><img class="dish-pic" src="assets/stickers/sm/NNN.webp" alt="" width="160"
  height="120" loading="lazy" decoding="async"><span class="dish-name" data-en="…" data-zh="…">…</span></a>`.
  Below 1800px the sticker is a small icon in each pill; at 1800px+ (27"/34") the grid turns into picture cards.

### 3.3 Study-topic hubs and sub-notes
Hubs: eggs, milk, flour, seafood, beef, chicken. Each lists its sub-notes as `.note-card` links.
To add a sub-note:
1. New page in `study-topics/` (back-link, photo slot, bilingual).
2. Add a `.note-card` to the hub page (and its reading-order line, if it has one).
3. Bump the hub card's count on index.html ("3 notes" → "4 notes" / "4 篇笔记"). check.py compares the badge with
   the hub's note-cards. The count strings repeat across cards — edit inside that one card only.
4. Rebuild the app data. build-index.py reads the hub's note-cards, so the sub-note becomes **searchable** in the app
   (title, tags and card description) — it is not listed under a category and not precached; it is cached once opened.

**Each fact lives in one note** — don't restate it in a sibling:
- **Chicken** (read in order): `chicken-label-guide` = what each label legally guarantees · `chicken-sourcing-guide` = brands by
  organic/pasture/breed/Cornucopia/price · `chicken-sanhuang` = the gap to a Cantonese 三黄鸡 · `chicken-buying-guide` = shops and
  word of mouth only (names shops, links out; breed/certification facts stay in notes 2–3).
- **Milk**: `milk-types` = science (fat %, A1/A2, processing basics) · `milk-label-guide` = regulation (label
  definitions, grazing/heat-treatment numbers, raw-milk law) · `milk-brands` = verdicts (scorecard, tiers).

### 3.4 The kitchen app stays separate
Never add links, cards or banners for the app to index.html or any site page. The sync rules above are about
recipes and topics, not the app. Details in §5.

---

## 4. Page conventions

### 4.1 Start from an existing page of the same kind
Recipe: copy `recipes/yan-su-ji.html` (the shared template ~60 recipe pages use, with bilingual headings). Guide or study note: copy a
recent page in the same folder. Every page links `../assets/lang.css` and `../assets/lang.js`, has a
`← Home` link to `../index.html` (sub-notes may link to their hub), and a footer.
**No page is in search engines (project rule, 2026-11-08):** every HTML page — index, menu, wishlist, recipes,
cooking-tips, study-topics, kitchen-app — carries `<meta name="robots" content="noindex" />` right after
`<meta charset>`. Copying an existing page keeps it; check.py errors if any page lacks it. This only keeps the site
out of Google/Bing — anyone with a link can still open pages, and the repo is public. Don't add a robots.txt: on a
GitHub project site it would not be at the domain root, so crawlers ignore it.

### 4.2 CSS
```css
:root { --bg:#fdf6ec; --card:#fff; --ink:#2b2b2b; --muted:#6b6b6b;
        --accent:#c97b3a; --accent-soft:#f3d9b1; --border:#ead7b7; }
/* optional semantic tints: --good:#2f7d4f --good-soft:#e6f3ea --warn:#b3541e --warn-soft:#fdeee2 */
main { max-width: min(92vw, 900px); margin: 0 auto; padding: 36px 24px 60px; }
header { background: linear-gradient(135deg, var(--accent) 0%, #e0a060 100%); }
```
**Wide table pages** (biaohua-cailiao, chicken-label-guide, chicken-sourcing-guide, milk-label-guide): `--page: min(92vw, 1500px)`.
Below 1100px the table becomes stacked cards — `table{display:block} colgroup,thead{display:none}
tbody{display:grid;grid-template-columns:repeat(2,1fr)} tr{display:flex;flex-direction:column} tr td:last-child{flex:1}`,
one column ≤700px, with per-cell `.cell-label` spans hidden on desktop and shown in card mode. A small 2-column table
inside a wide page opts out by re-asserting `display:table / table-row / table-cell` (see `.gap-wrap`).

### 4.3 Header and photo slot
```html
<div class="header-title">
  <div class="header-text">
    <h1 data-en="English Title" data-zh="中文标题">English Title</h1>
    <div class="meta" data-en="Category EN" data-zh="分类中文">Category EN</div>
  </div>
  <div class="final-photo">
    <img src="images/{slug}/Final.jpg" alt="{slug}" onerror="this.parentElement.style.display='none'">
  </div>
</div>
```
`.final-photo` is 180×180, `object-fit: cover`; `onerror` hides the slot until a photo exists.
- Photos go in `images/{slug}/` next to the page: **JPEG, ~800px wide, ~100 KB**. Older placeholders say
  `Final.png` — change the extension when you add the photo. Keep full-size originals outside this folder
  (backups copy everything; the app precaches every photo). check.py warns on images > 500 KB.
- Step photos (北海道面包): `.step-photo` stays hidden until its image loads, so missing step photos are invisible.

**Dish stickers (插画贴纸)** — when there is no real photo, the slot shows the dish's sticker instead:
```html
<div class="final-photo sticker"><img src="../assets/stickers/lg/NNN.webp" alt="" width="640" height="480" onerror="this.parentElement.style.display='none'"></div>
<!-- a page that covers two menu dishes (chashao, mantou-huajuan): staggered pair -->
<div class="final-photo sticker duo"><img class="back" src="../assets/stickers/lg/078.webp" …><img class="front" src="../assets/stickers/lg/133.webp" …></div>
```
- Styles are shared in `assets/lang.css` (no frame, `contain`, tilted, drop shadow; 232×174 → 260×195 at ≥1400px,
  128×96 on phones, 104×78 ≤380px). A real `Final.jpg` keeps the plain photo frame and wins over the sticker (youtiao).
- Files: `assets/stickers/sm/NNN.webp` (160×120, every menu dish) and `lg/NNN.webp` (640×480, only dishes with a recipe
  page). `NNN` and the dish ↔ page mapping are in `assets/stickers/index.csv`. Never name a sticker `Final.*` — the app
  would take it as the dish photo.
- Source PNGs (1254², ~1.8 MB each — never copy them in): `G:\My Drive\Photo\手帐素材\menu-stickers\`.
  Web copies are made by `assets/stickers/make_stickers.py` (trim → 4:3 → WebP); a new recipe page for a menu dish
  needs its `lg/NNN.webp`: `python assets/stickers/make_stickers.py "<source folder>" --lg NNN`.

### 4.4 Bilingual (EN / 中文)
- Toggle markup: `<div class="lang-toggle"><button type="button" data-lang="en" class="active">EN</button><button type="button" data-lang="zh">中文</button></div>`
- Guides, study notes, index, menu: **every visible string** carries `data-en` + `data-zh` (headings, table cells,
  list items, tip boxes). Recipes: headings and labels bilingual; the recipe body may stay in Chinese.
- lang.js sets `innerHTML` from the attribute, so markup inside it works — escape it **once**:
  `data-en="See &lt;a href=&quot;x.html&quot;&gt;this&lt;/a&gt;"`. Never `&amp;quot;` (that broke a link).
  Links inside the attributes are relative to the page's folder.
- Labels can also come from CSS keyed on the page language (`html:lang(zh)`), as the 待试 tag does.
- A name deliberately shown in Chinese in **both** modes (the Chinese name under an English one — crab, shrimp,
  pepper cards) gets `lang="zh"` instead of a translation; check.py skips it.
- `wishlist.html` switches languages with its own `STR` table + `setLang()` — edit both languages there.

### 4.5 Shared scripts
- `assets/scale.js` — serving/batch scaler (21 flour recipes). Put `<div class="scaler" data-base="1" data-unit-zh="份"
  data-unit-en=" batch"></div>` where the control goes, `data-scale` on each ingredient block, and load
  `../assets/scale.js` **after** lang.js. Don't mark ratios or per-piece sizes (南瓜饼, 麻花 做法); protect one-offs
  with `<span class='noscale'>…</span>` (热干面 "490-500g").
- `assets/recipe-ui.js` — the milk-tea pages (anhua, boyajuexian, jasmine-zhenwang, matcha-bailan).
- `assets/phone-tables.js` — **no sideways scrolling on phones**: at ≤640px, tables with a `<thead>` and ≥3 columns turn
  into one card per row, each value labelled with its column header (labels follow the EN/中文 toggle). Add
  `<script src="../assets/phone-tables.js"></script>` after lang.js on any normal-width page with such a table; opt a
  table out with `data-no-cards`. Wide table pages keep their own ≤1100px card pattern (§4.2).
- `assets/lang.css` also lets long links (e.g. a pasted URL) wrap on phones.

---

## 5. Kitchen app (`kitchen-app/`)
- `build-index.py` parses `../index.html` → `data/recipes.json`, `data/recipes.js` (works on file://),
  `data/precache.js`. It copies `data-status` / `data-type` (待试 badge + 待试 category) and picks
  `Final.jpg` / `.webp` / `.png` as the card image. App search covers titles, count badges, card descriptions
  (index cards and hub note-cards) and the hub sub-notes (search only, `"sub": true`, not precached).
- `sw.js` must stay at the site root (a service worker's scope can't exceed its folder); the logic is in `kitchen-app/sw-core.js`.
- The service worker (installed when the app is opened on a phone/iPad) covers the **whole site**. Pages, CSS, JS and JSON
  are network-first (revalidated, so a pushed change shows on the next load; cache = offline fallback, or after 4 s);
  images are cache-first, refreshed in the background — a *replaced* image may show its old version once.
  After editing `sw-core.js`, bump the `?v=` in root `sw.js` so installed devices pick the new worker up on their next visit.
- App icons (`kitchen-app/icons/`) are copies of the site icons in `assets/icons/`, made from `assets/index-logo.png`.
  To change the icon, replace those files and re-run `build-index.py`: the cache version hashes the icon bytes, so
  installed phones pick up the new files. An icon already on a home screen may only change after remove + re-add.
- `kitchen-app/index.html` uses `<base href="../">`, so its links are root-relative.
- Favorites are stored by page path — moving a page drops it from favorites.
- Publishing (GitHub Pages) and installing on a phone: `kitchen-app/DEPLOY.md`.

---

## 6. Verification
- `python check.py` (standard library only, read-only). **Errors**: broken internal links (including links inside
  data-en/data-zh), truncated files (an unclosed `<script>`), double-escaped markup (a literal `&amp;`/`&quot;` on the page, or `&amp;quot;` breaking an attribute),
  recipe pages missing from index, the §3.2 menu rules, hub count badges. **Warnings**: untagged
  Chinese text, images > 500 KB, stale app data, orphan pages, too many backup snapshots.
- Layout: render at 412 (phone) / 810 & 1080 (iPad) / 1440 (laptop) / 2560 (27") / 3440 px (34" ultrawide), in both
  languages, plus 375 and 430 for phones. **No horizontal overflow — nothing should need a sideways swipe on a phone**;
  the header h1 clears the top-right controls; wide screens fill sensibly. A fixed-width element (180px icon slot,
  `white-space:nowrap` label column, side-by-side flex row) needs a ≤640px rule.
  Existing breakpoints sit around 640 / 860 / 1100 / 1300 / 1400 / 1800 px (phones also ≤380px).
- Working on a mounted copy of this folder (Cowork / remote session): write files through the shell so the mount
  sees them, then confirm (md5sum or re-read). Deleting may be blocked there — move files to `.trash/` instead
  (git-ignored and skipped by check.py, so retired pages are neither published nor checked; empty it in Explorer).

---

## 7. Backup
```bash
python backup.py save "描述改动"   # snapshot before any edit
python backup.py list              # list snapshots
python backup.py restore <n>       # restore by number
```
- Copies everything except `.backups/` and `.git/`, and keeps the **10 newest** snapshots (older ones are deleted).
- Where deleting is blocked (a mounted copy), it can't prune and snapshots pile up — check.py warns; delete the
  oldest in Explorer. When deleting is allowed, it prunes automatically, so save sparingly if older restore points matter.

---

## 8. Folder map
```
Food/
  index.html          # hub — source of truth (recipes, cooking tips, study topics)
  menu.html           # dishes Shara has made
  wishlist.html       # 心愿菜单 (Google Apps Script backend: wishlist-apps-script.js)
  check.py            # consistency check — run after every change
  backup.py           # snapshots → .backups/ (not published)
  assets/             # lang.css, lang.js, scale.js, recipe-ui.js, icons/, logos
    stickers/         # dish stickers: sm/ (menu), lg/ (recipe headers), index.csv, make_stickers.py
  recipes/            # 有材料和步骤的具体做法 (92 pages); images/{slug}/
  cooking-tips/       # 怎么做 (9 pages)
  study-topics/       # 是什么、买哪个: 6 hubs + sub-notes + single topics; images/
  kitchen-app/        # phone app (separate from the site); build-index.py, data/, DEPLOY.md
  sw.js               # service-worker stub — must stay at the root
  site.webmanifest    # home-screen install from index.html → opens index.html ("Study Notes")
  menu.webmanifest    # home-screen install from menu.html → opens menu.html ("Shara's Menu"); same icons
```

---

### Wish list backend
`wishlist.html` → Apps Script project **"Wish List"** (web app, runs as Shara, access: Anyone) → Google Sheet
**"Shara's Kitchen — 心愿菜单"**, tab `Wishes`. `SCRIPT_URL` in wishlist.html holds the `/exec` URL; the script's source is
`wishlist-apps-script.js`. After changing the script: paste it into the project, then **Deploy → Manage deployments →
edit → Version: New version** — saving alone does not update the live web app, and the URL stays the same.
The page shows "已收到" only when the script answers `{"result":"success"}`.
**Access password** lives only in the project's Script properties as `WISH_PASSWORD` (Project Settings → Script
properties) — never in wishlist.html, the repo, or notes. The gate asks the script (`{action:'check', pw}`) and every
submission carries `pw`; wrong or missing → `{"result":"denied"}`, nothing written. Changing the password needs no redeploy.
**Usernames, ❤ and 点过几次 (2026-11):** the gate asks for a username, then the shared password; the page remembers the
username on that device ("换人" clears it). The first time a username is used it also asks for a 名字. Sheet tabs (created
by the script): `Users` (用户名 | 名字 | 第一次 | 最近一次 — edit 名字 here), `Hearts` (用户名 | 名字 | 菜名 | 时间, one row per
❤), and `Wishes` column G 用户名. 点过几次 = Wishes rows with that username, plus older rows (no username) whose 姓名 equals
the 名字. Usernames compare case-insensitively. ❤ / counts / the filter chips show in 中文 mode only. Unsaved ❤ changes wait in
the browser and are retried on the next change or login. Login is sent as `{action:'check', v:2, …}` so a not-yet-updated
script answers a bare `ok` and writes nothing (the page then says the backend needs an update); any other unknown action
returns an error and never writes a wish row. **Deploy order: paste the script + New version first, then push the page.**
❤ and counts are keyed by the Chinese dish name — renaming a dish in menu.html drops its ❤ and restarts its count.
**New-wish email** goes to the account that runs the script (`Session.getEffectiveUser()`; no address stored in the repo),
plain text, sent after the row is saved and in its own try/catch — a failed email never turns a saved wish into an error.
`testNotify` (run in the editor) grants the send-mail permission and sends a sample without writing a row.

## 9. Shara's preferences
- Natural food coloring only (freeze-dried fruit powder, beet, matcha) — no synthetic dyes.
- US-based: ingredients and sources reference US stores; she shops around Bellevue / Seattle.
- Uses a 34-inch ultrawide monitor — wide layouts are welcome; also reads on phone and iPad.
- Writes recipe notes in Chinese; the site UI is bilingual.
