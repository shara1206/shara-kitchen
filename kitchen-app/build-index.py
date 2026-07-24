#!/usr/bin/env python3
"""
build-index.py — generate assets/recipes.json from index.html.
The index is the source of truth (per project rules), so we parse it
rather than maintaining a separate list. Re-run after editing index.html.
"""
import json, os, re, html

APP_DIR = os.path.dirname(os.path.abspath(__file__))  # kitchen-app/
ROOT = os.path.dirname(APP_DIR)                        # site root
DATA_DIR = os.path.join(APP_DIR, "data")
INDEX = os.path.join(ROOT, "index.html")
OUT   = os.path.join(DATA_DIR, "recipes.json")

def clean(s):
    return html.unescape(re.sub(r"\s+", " ", s or "").strip())

def attrs(tag):
    en = re.search(r'data-en="([^"]*)"', tag)
    zh = re.search(r'data-zh="([^"]*)"', tag)
    return clean(en.group(1) if en else ""), clean(zh.group(1) if zh else "")

def slug_of(path):
    return os.path.splitext(os.path.basename(path))[0]

def folder_of(path):
    return path.split("/")[0] if "/" in path else ""

def image_for(path):
    s = slug_of(path)
    rel = f"recipes/images/{s}/Final.png"
    return rel if os.path.isfile(os.path.join(ROOT, rel)) else None

def page_zh_title(path):
    fp = os.path.join(ROOT, path)
    if not os.path.isfile(fp):
        return ""
    try:
        with open(fp, encoding="utf-8") as fh:
            head = fh.read(4000)
    except Exception:
        return ""
    m = re.search(r'data-zh-title="([^"]*)"', head)
    return clean(m.group(1)) if m else ""

with open(INDEX, encoding="utf-8") as f:
    src = f.read()

items = []
seen = set()

# --- Recipes: <h4 ...> sets the current group, then <li><a href...> links ---
current_group_en, current_group_zh = "Other", "其他"
token = re.compile(
    r'<h4\b[^>]*>.*?</h4>'                                # group header
    r'|<a\s+href="(recipes/[^"]+\.html)"[^>]*>(.*?)</a>', # recipe link + text
    re.DOTALL)
for m in token.finditer(src):
    chunk = m.group(0)
    if chunk.startswith("<h4"):
        current_group_en, current_group_zh = attrs(chunk)
    else:
        path = m.group(1)
        if path in seen:
            continue
        seen.add(path)
        en, zh = attrs(chunk)
        if not en:
            inner = re.sub(r"<[^>]+>", "", m.group(2) or "")
            en = clean(inner)
        if not zh:
            pz = page_zh_title(path)
            zh = pz if (pz and "学习笔记" not in pz and re.search(r"[\u4e00-\u9fff]", pz)) else en
        items.append({
            "title_en": en, "title_zh": zh, "path": path, "slug": slug_of(path),
            "type": "recipe", "category_en": current_group_en,
            "category_zh": current_group_zh, "image": image_for(path),
            "subtitle_en": "", "subtitle_zh": "",
        })

# --- Topic cards: study-topics + cooking-tips (+ a few recipe/ guides) ---
card = re.compile(r'<a\s+class="topic-card"\s+href="([^"]+)"[^>]*>(.*?)</a>', re.DOTALL)
CAT = {
    "study-topics": ("Study Topics", "学习专题", "study"),
    "cooking-tips": ("Cooking Tips", "烹饪技巧", "tip"),
    "recipes":      ("Ingredient Notes", "食材笔记", "recipe"),
}
for m in card.finditer(src):
    path, inner = m.group(1), m.group(2)
    if path in seen:
        continue
    seen.add(path)
    h3 = re.search(r'<h3\b[^>]*>.*?</h3>', inner, re.DOTALL)
    cnt = re.search(r'<div\s+class="count"[^>]*>.*?</div>', inner, re.DOTALL)
    en, zh = attrs(h3.group(0)) if h3 else ("", "")
    sub_en, sub_zh = attrs(cnt.group(0)) if cnt else ("", "")
    cat_en, cat_zh, typ = CAT.get(folder_of(path), ("Other", "其他", "study"))
    items.append({
        "title_en": en, "title_zh": zh, "path": path, "slug": slug_of(path),
        "type": typ, "category_en": cat_en, "category_zh": cat_zh,
        "image": image_for(path), "subtitle_en": sub_en, "subtitle_zh": sub_zh,
    })

# --- Standalone pages ---
for path, en, zh, sub_en, sub_zh in [
    ("menu.html", "My Menu", "我的菜单", "All dishes I make", "我做的所有菜"),
    ("wishlist.html", "Wishlist", "愿望清单", "Things to try", "想尝试的"),
]:
    if os.path.isfile(os.path.join(ROOT, path)) and path not in seen:
        items.append({
            "title_en": en, "title_zh": zh, "path": path, "slug": slug_of(path),
            "type": "page", "category_en": "Pages", "category_zh": "页面",
            "image": None, "subtitle_en": sub_en, "subtitle_zh": sub_zh,
        })

# --- Category summary (ordered, with counts) ---
cat_order, cats = [], {}
for it in items:
    key = (it["category_en"], it["category_zh"], it["type"])
    if key not in cats:
        cats[key] = 0
        cat_order.append(key)
    cats[key] += 1
categories = [{"name_en": e, "name_zh": z, "type": t, "count": cats[(e, z, t)]}
              for (e, z, t) in cat_order]

data = {"generated": True, "total": len(items),
        "categories": categories, "items": items}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

# Also emit a JS file so app.html works when opened via file:// (no fetch/CORS).
JS_OUT = os.path.join(DATA_DIR, "recipes.js")
with open(JS_OUT, "w", encoding="utf-8") as f:
    f.write("window.__RECIPES__ = ")
    json.dump(data, f, ensure_ascii=False, indent=2)
    f.write(";\n")

# Emit precache.js for the service worker: full list of pages/assets for offline use.
import hashlib
core = ["kitchen-app/index.html", "kitchen-app/manifest.webmanifest",
        "kitchen-app/data/recipes.js",
        "assets/lang.css", "assets/lang.js", "assets/recipe-ui.js",
        "kitchen-app/icons/icon-192.png", "kitchen-app/icons/icon-512.png",
        "kitchen-app/icons/icon-maskable-512.png", "kitchen-app/icons/apple-touch-icon.png"]
pages = [it["path"] for it in items]
imgs  = [it["image"] for it in items if it.get("image")]
precache = []
for u in core + pages + imgs:
    if u not in precache and (u in core or os.path.isfile(os.path.join(ROOT, u))):
        precache.append(u)
version = hashlib.md5(("|".join(precache)).encode("utf-8")).hexdigest()[:8]
PC_OUT = os.path.join(DATA_DIR, "precache.js")
with open(PC_OUT, "w", encoding="utf-8") as f:
    f.write("self.__CACHE_VERSION__ = %s;\n" % json.dumps("shara-kitchen-" + version))
    f.write("self.__PRECACHE__ = ")
    json.dump(precache, f, ensure_ascii=False, indent=2)
    f.write(";\n")
print("   precache: %d urls (version %s)" % (len(precache), version))

print(f"✅ {len(items)} items, {len(categories)} categories -> assets/recipes.json")
for c in categories:
    print(f"   {c['count']:>3}  {c['name_en']}  ({c['type']})")
