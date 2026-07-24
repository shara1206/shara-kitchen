# Food Recipe Site — Project Rules

## File writes
Always write files via bash Python script (writing to `/sessions/.../mnt/Food/`).  
The Edit/Write tools update the Windows side only — bash reads the Linux mount and will see stale content unless the file is written through bash.

## index.html — always keep in sync
After **any** change to a file under `recipes/`, `topics/`, or the root folder:
- **New file** → add a card/link in the correct index section
- **Content changed** (new items, different scope, count changed) → update the card's count badge and description to match the actual page
- **Title or category changed** → update the card header

The index is the source of truth. Descriptions must reflect reality, not aspirations.

## CSS conventions

### Standard recipe/guide pages
```css
:root { --bg:#fdf6ec; --card:#fff; --ink:#2b2b2b; --muted:#6b6b6b;
        --accent:#c97b3a; --accent-soft:#f3d9b1; --border:#ead7b7; }
main { max-width: min(92vw, 900px); margin: 0 auto; padding: 36px 24px 60px; }
header { background: linear-gradient(135deg, var(--accent) 0%, #e0a060 100%); }
```

### Wide pages (e.g. biahua-cailiao.html)
```css
main { max-width: min(92vw, 1500px); }
/* CSS Grid multi-column layout */
```

### Header photo slot (all pages)
```html
<div class="header-title">
  <div class="header-text">
    <h1 data-en="English Title" data-zh="中文标题">English Title</h1>
    <div class="meta" data-en="Category EN" data-zh="分类中文">Category EN</div>
  </div>
  <div class="final-photo">
    <img src="images/{slug}/Final.png" alt="{slug}" onerror="this.parentElement.style.display='none'">
  </div>
</div>
```
```css
.header-title { max-width: min(92vw, 900px); margin: 0 auto; display: flex; align-items: center; gap: 16px; }
.header-text { flex: 1; }
.header-title h1 { max-width: none; margin: 0; font-size: 2rem; line-height: 1.3; }
.header-title .meta { max-width: none; margin: 6px 0 0; opacity: 0.88; font-size: 0.9rem; font-style: italic; font-family: 'Helvetica', sans-serif; }
.final-photo { width: 180px; height: 180px; border-radius: 10px; overflow: hidden; flex-shrink: 0; box-shadow: 0 2px 10px rgba(0,0,0,0.25); border: 2px solid rgba(255,255,255,0.35); }
.final-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
```
The `onerror` handler hides the photo slot when no image file exists yet.  
Image files go in `recipes/images/{slug}/Final.png`.

## Bilingual system
Every visible string uses `data-en` / `data-zh` attributes, driven by `../assets/lang.js` and `../assets/lang.css`.  
Always include `<link rel="stylesheet" href="../assets/lang.css" />` and `<script src="../assets/lang.js"></script>`.  
The lang toggle is:
```html
<div class="lang-toggle">
  <button type="button" data-lang="en" class="active">EN</button>
  <button type="button" data-lang="zh">中文</button>
</div>
```

## New recipe page checklist
1. Copy CSS + structure from an existing page (e.g. `niu-guide.html`)
2. Add header photo slot with `onerror` hide
3. Add bilingual `data-en` / `data-zh` on all visible text
4. Link `../assets/lang.css` and `../assets/lang.js`
5. Add link/card to `index.html` in the correct section
6. Write file via bash to ensure it lands on disk

## Backup
```bash
python backup.py save "描述改动"   # save snapshot
python backup.py list              # list snapshots
python backup.py restore <n>       # restore by number
```
- Keeps 10 versions
- Backs up everything except `.backups/` and `.git/`
- Run a backup before any batch operation or major edit

## Folder structure
```
Food/
  index.html          # main hub — must always be up to date
  menu.html
  backup.py
  assets/
    lang.css          # bilingual toggle styles
    lang.js           # bilingual toggle logic
  recipes/            # 90+ individual recipe & guide pages
    images/           # {slug}/Final.png for each dish
  topics/             # ingredient deep-dives (eggs, crab, flour, milk, pepper, seafood)
  notes/              # misc notes
  .backups/           # auto-managed snapshots
```

## User preferences
- Natural food coloring only (freeze-dried fruit powder, beet, matcha) — no synthetic dyes
- US-based: ingredient names and sources reference US stores
- 34-inch wide monitor — wide layouts are welcome
- Recipe notes written in Chinese; page UI is bilingual
