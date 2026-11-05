# Shara's Study Notes & Kitchen App

A personal, bilingual (English / 中文) collection of Chinese, Japanese and baking recipes,
ingredient study notes and cooking-technique guides — plus a phone app built from the same pages.

## Two ways to use it
- **The website** — `index.html`: recipes, cooking tips, study topics; `menu.html` (dishes I've made); `wishlist.html`.
- **The Kitchen App** — `kitchen-app/index.html`: phone-first search, categories, favorites, a 待试 list,
  big-text reader with keep-screen-awake; installable and usable offline (see `kitchen-app/DEPLOY.md`).

## What goes where
| Folder | Holds |
|---|---|
| `recipes/` | 有材料和步骤的具体做法 — recipes (untried ones are tagged 待试 on the index) |
| `cooking-tips/` | 怎么做 — technique, ratios, heat |
| `study-topics/` | 是什么、买哪个 — ingredients, labels, brands, where to buy |

## Everyday commands
```bash
python backup.py save "说明"                 # snapshot before editing
python check.py                              # links, index/menu rules, bilingual, image sizes
cd kitchen-app && python build-index.py      # refresh the app after index.html changes
```

**Editing rules** (page placement, index/menu sync, bilingual markup, photos, verification) live in **`CLAUDE.md`**.
