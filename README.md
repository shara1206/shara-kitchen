# Shara's Study Notes & Kitchen App

A personal, bilingual (English / 中文) collection of Chinese, Japanese and baking
recipes, plus ingredient study notes and cooking-technique guides.

## Two ways to use it

- **The website** — `index.html`: the full desktop hub (recipes, study topics, cooking tips, menu, wishlist).
- **The Kitchen App** — `kitchen-app/index.html`: a phone-first app with search, category browsing,
  favorites, an in-app recipe reader (big-text + keep-screen-awake), installable to your home screen and usable offline.

## Project layout

```
index.html            # website hub (source of truth for recipe listing)
menu.html, wishlist.html
assets/               # shared: lang.css, lang.js, recipe-ui.js
recipes/              # individual recipe & guide pages (+ images/)
study-topics/         # ingredient deep-dives
cooking-tips/         # technique guides
sw.js                 # service-worker stub (must stay at root for offline scope)
kitchen-app/          # the app: index.html, manifest, sw-core.js, build-index.py, data/, icons/
```

## Regenerate the app index

After adding or editing recipes in `index.html`:

```bash
cd kitchen-app
python build-index.py     # rebuilds data/recipes.json, recipes.js, precache.js
```

## Bilingual

Every visible string carries `data-en` / `data-zh`, toggled by `assets/lang.js`.
