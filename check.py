#!/usr/bin/env python3
"""
check.py — read-only consistency check for the Food site (standard library only).

    python check.py          # run all checks; exit code 1 if any ERROR

ERROR  broken internal links (incl. links inside data-en / data-zh), double-escaped markup
       (a literal &amp; / &quot; shows on the page, or &amp;quot; breaks an attribute), recipe pages missing
       from index.html, tried/untried vs menu.html rules, hub note-count badges that don't
       match the hub page, bad data-status / data-type values, any page without
       <meta name="robots" content="noindex"> (the whole site stays out of search engines)
WARN   untagged Chinese text (guides/topics; recipe pages: headings only), images > 500 KB,
       kitchen-app data older than index.html, orphan pages, backup snapshots over the limit

Recipe markers on index.html links (<ul class="recipe-list">):
    (none)                              a dish Shara has made   -> must be in menu.html
    data-status="todo"                  page exists, not tried  -> must NOT be in menu.html
    data-type="base"                    sauce / dough / prep    -> never required in menu.html
    data-type="guide"                   reference page          -> no status, not in menu.html
    after trying a dish: remove data-status="todo" from index.html AND add a dish-item to menu.html
"""
import os, re, sys, json
from html.parser import HTMLParser
from urllib.parse import unquote

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT = os.path.dirname(os.path.abspath(__file__))
SKIP_DIRS = {".backups", ".git", "__pycache__", "Claude outputs", "_to_delete", ".trash"}
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta",
        "source", "track", "wbr"}
CJK = re.compile(r"[一-鿿]")
BIG_IMAGE = 500 * 1024
KEEP_SNAPSHOTS = 10

errors, warns = [], []
def err(msg):
    if msg not in errors: errors.append(msg)
def warn(msg):
    if msg not in warns: warns.append(msg)

# ---------------------------------------------------------------- file inventory
all_files, html_files = set(), []
for dp, dns, fns in os.walk(ROOT):
    dns[:] = [d for d in dns if d not in SKIP_DIRS]
    for f in fns:
        rel = os.path.relpath(os.path.join(dp, f), ROOT).replace("\\", "/")
        all_files.add(rel)
        if f.endswith(".html"):
            html_files.append(rel)
html_files.sort()


class LinkGrab(HTMLParser):
    """Collect hrefs of <a> inside an HTML fragment (a data-en / data-zh value)."""
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.links = []
    def handle_starttag(self, tag, attrs):
        if tag == "a":
            href = dict(attrs).get("href")
            if href:
                self.links.append(href)


ENTITY = re.compile(r"&(#\d+|#x[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]{1,7});")


class FragScan(HTMLParser):
    """Parse a data-en / data-zh value the way lang.js does (innerHTML) and look for double escaping."""
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.literal, self.badattr = [], []
    def handle_starttag(self, tag, attrs):
        for k, v in attrs:
            if v and (v[:1] in "\"'" or v[-1:] in "\"'"):
                self.badattr.append(f'{tag} {k}={v}')
    def handle_data(self, data):
        if ENTITY.search(data):
            self.literal.append(data.strip()[:40])


class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []          # (tag, attrs)
        self.base = ""
        self.refs = []           # (tag, url, tolerated)
        self.frag_links = []     # links found inside data-en / data-zh
        self.untagged = []       # (text, heading?)
        self.recipe_links = []   # index: (href, attrs) inside ul.recipe-list
        self.dish_links = []     # menu: hrefs of a.dish-item
        self.cards = {}          # index: topic-card href -> count data-en
        self.note_cards = 0
        self._card = None
        self.double_escaped = []  # (where, sample)

    def _cls(self, attrs):
        return (attrs.get("class") or "").split()

    def _inside(self, pred):
        return any(pred(t, a) for t, a in self.stack)

    def handle_starttag(self, tag, attrs_list):
        a = dict(attrs_list)
        if tag in ("li", "p") and self.stack and self.stack[-1][0] == tag:
            self.stack.pop()                                   # implicit close
        cls = self._cls(a)
        if tag == "base" and a.get("href"):
            self.base = a["href"]
        for key in ("data-en", "data-zh"):
            if a.get(key) and "<a" in a[key]:
                g = LinkGrab(); g.feed(a[key]); self.frag_links += g.links
            if a.get(key) and "&" in a[key] or (a.get(key) and "<" in a[key]):
                fs = FragScan(); fs.feed(a[key]); fs.close()
                self.double_escaped += [(key, x) for x in fs.literal + fs.badattr]
        for t, attr in (("a", "href"), ("img", "src"), ("script", "src"),
                        ("link", "href"), ("iframe", "src"), ("source", "src")):
            if tag == t and a.get(attr):
                self.refs.append((tag, a[attr], tag == "img" and "onerror" in a))
        if tag == "a" and a.get("href", "").startswith("recipes/") and \
                self._inside(lambda t, x: t == "ul" and "recipe-list" in self._cls(x)):
            self.recipe_links.append((a["href"], a))
        if tag == "a" and "dish-item" in cls and a.get("href"):
            self.dish_links.append(a["href"])
        if tag == "a" and "topic-card" in cls:
            self._card = a.get("href")
        if tag == "div" and "count" in cls and self._card:
            self.cards[self._card] = a.get("data-en", "")
        if "note-card" in cls:
            self.note_cards += 1
        if tag not in VOID:
            self.stack.append((tag, a))

    def handle_startendtag(self, tag, attrs_list):
        self.handle_starttag(tag, attrs_list)
        if tag not in VOID and self.stack and self.stack[-1][0] == tag:
            self.stack.pop()

    def handle_endtag(self, tag):
        if tag == "a":
            self._card = None
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                del self.stack[i:]
                break

    def handle_data(self, data):
        txt = data.strip()
        if not txt:
            return
        tags = [t for t, _ in self.stack]
        if any(t in ("script", "style", "svg", "noscript", "title", "head") for t in tags):
            return
        if ENTITY.search(txt):
            self.double_escaped.append(("text", txt[:40]))
        if not CJK.search(txt):
            return
        if self._inside(lambda t, x: "lang-toggle" in self._cls(x)):
            return
        if self._inside(lambda t, x: "data-en" in x or (t != "html" and "lang" in x)):
            return                              # bilingual, or deliberately shown in one language (lang="zh")
        self.untagged.append((txt[:30], any(t in ("h1", "h2", "h3", "h4") for t in tags)))


def resolve(page, base, url):
    if re.match(r"^[a-z][a-z0-9+.-]*:", url, re.I) or url.startswith(("#", "//")):
        return None
    path = unquote(url.split("#")[0].split("?")[0])
    if not path:
        return None
    d = os.path.dirname(page)
    if base:
        d = os.path.normpath(os.path.join(d, base))
    return os.path.normpath(os.path.join(d, path)).replace("\\", "/")


pages, inbound = {}, {}
for rel in html_files:
    p = Page()
    with open(os.path.join(ROOT, rel), encoding="utf-8", errors="replace") as fh:
        raw = fh.read()
    raw_tail = raw[-200:]
    p.feed(raw)
    p.close()
    pages[rel] = p
    if any(t in ("script", "style") for t, _ in p.stack):
        err(f"truncated file  {rel}: a <script>/<style> is never closed (the file may have been cut off)")
    elif rel.endswith(".html") and not raw_tail.rstrip().lower().endswith("</html>"):
        warn(f"truncated file?  {rel} does not end with </html>")
    if rel.endswith(".html") and not re.search(r'<meta\s+name="robots"\s+content="[^"]*noindex', raw, re.I):
        err(f"missing noindex  {rel}: add <meta name=\"robots\" content=\"noindex\" /> after <meta charset>")
    for tag, url, tolerated in p.refs + [("a", u, False) for u in p.frag_links]:
        target = resolve(rel, p.base, url)
        if target is None:
            continue
        if target not in all_files:
            if not tolerated:
                err(f"broken link  {rel}: <{tag}> {url}")
        elif target.endswith(".html") and target != rel:
            inbound.setdefault(target, set()).add(rel)

for rel, p in pages.items():
    for where, sample in p.double_escaped:
        err(f"double-escaped  {rel} ({where}): “{sample}”")

# ---------------------------------------------------------------- index / menu rules
idx, menu = pages.get("index.html"), pages.get("menu.html")
recipe_pages = {f for f in all_files if f.startswith("recipes/") and f.endswith(".html")}
linked_from_index = {resolve("index.html", "", u) for _, u, _ in idx.refs if u.startswith("recipes/")}
for f in sorted(recipe_pages - linked_from_index):
    err(f"not in index  {f}")

menu_set = set(menu.dish_links)
counts = {"dish": 0, "todo-dish": 0, "base": 0, "todo-base": 0, "guide": 0}
for href, a in idx.recipe_links:
    status, kind = a.get("data-status", ""), a.get("data-type", "")
    name = a.get("data-zh") or href
    if status not in ("", "todo"):
        err(f"bad data-status=\"{status}\"  {href}")
    if kind not in ("", "base", "guide"):
        err(f"bad data-type=\"{kind}\"  {href}")
    in_menu = href in menu_set
    if kind == "guide":
        counts["guide"] += 1
        if status:
            err(f"guide page should not carry data-status  {href} ({name})")
        if in_menu:
            err(f"guide page is in menu.html  {href} ({name})")
    elif status == "todo":
        counts["todo-base" if kind == "base" else "todo-dish"] += 1
        if in_menu:
            err(f"marked 待试 but already in menu.html — remove data-status=\"todo\" in index.html  {href} ({name})")
    else:
        counts["base" if kind == "base" else "dish"] += 1
        if kind != "base" and not in_menu:
            err(f"tried dish missing from menu.html (or mark it data-status=\"todo\")  {href} ({name})")
for href in sorted(menu_set):
    if href.startswith("recipes/") and href not in linked_from_index:
        err(f"menu.html links a recipe that index.html does not list  {href}")

# hub count badges ("4 notes") vs note-cards on the hub page
for href, label in idx.cards.items():
    m = re.match(r"\s*(\d+)\s+notes?\b", label)
    hub = pages.get(href)
    if m and hub is not None and hub.note_cards != int(m.group(1)):
        err(f"count badge  index says \"{label}\" but {href} has {hub.note_cards} note-cards")

# ---------------------------------------------------------------- warnings
OWN_I18N = {"wishlist.html"}   # switches EN/中文 with its own STR table + setLang(), not data-en/data-zh
recipe_heads = []
for rel, p in pages.items():
    if rel.startswith("kitchen-app/") or rel in OWN_I18N:
        continue
    if rel.startswith("recipes/"):                      # recipe body stays Chinese by design; headings must be bilingual
        heads = [t for t, h in p.untagged if h]
        if heads:
            recipe_heads.append((rel[8:-5], len(heads)))
        continue
    bad = [t for t, _ in p.untagged]
    if bad:
        warn(f"bilingual  {rel}: {len(bad)} Chinese text node(s) without data-en/data-zh, e.g. “{bad[0]}”")
if recipe_heads:
    warn(f"bilingual  recipe headings without data-en/data-zh: {sum(n for _, n in recipe_heads)} in "
         f"{len(recipe_heads)} pages — " + ", ".join(s for s, _ in recipe_heads))

for f in sorted(all_files):
    if f.lower().endswith((".png", ".jpg", ".jpeg", ".webp", ".gif")) and not f.startswith("kitchen-app/icons/") \
            and not f.startswith("assets/icons/"):
        size = os.path.getsize(os.path.join(ROOT, f))
        if size > BIG_IMAGE:
            warn(f"large image  {f}: {size/1024/1024:.1f} MB")

rj = os.path.join(ROOT, "kitchen-app", "data", "recipes.json")
if os.path.exists(rj) and os.path.getmtime(rj) < os.path.getmtime(os.path.join(ROOT, "index.html")):
    warn("kitchen-app data is older than index.html — run: cd kitchen-app && python build-index.py")

for rel in html_files:
    if rel not in ("index.html", "kitchen-app/index.html") and rel not in inbound:
        warn(f"orphan page (nothing links to it)  {rel}")

bdir = os.path.join(ROOT, ".backups")
if os.path.isdir(bdir):
    snaps = [d for d in os.listdir(bdir) if os.path.isdir(os.path.join(bdir, d))]
    if len(snaps) > KEEP_SNAPSHOTS:
        total = sum(os.path.getsize(os.path.join(dp, f)) for dp, _, fs in os.walk(bdir) for f in fs)
        warn(f"backups  {len(snaps)} snapshots / {total/1024/1024:.0f} MB (backup.py keeps {KEEP_SNAPSHOTS}; it can only "
             f"prune where deleting is allowed — otherwise delete the oldest in Explorer)")

# ---------------------------------------------------------------- report
print(f"Food site check — {len(html_files)} pages, {len(recipe_pages)} recipe pages")
print(f"  recipes: {counts['dish']} tried dishes · {counts['todo-dish']} dishes to try · "
      f"{counts['base']} tried bases · {counts['todo-base']} bases to try · {counts['guide']} guides")
for title, rows in (("ERROR", errors), ("WARN", warns)):
    print(f"\n{title} ({len(rows)})")
    for r in rows:
        print("  " + r)
print("\n" + ("❌ fix the errors above" if errors else "✅ no errors"))
sys.exit(1 if errors else 0)
