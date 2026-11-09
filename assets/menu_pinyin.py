"""Rebuild the pinyin index that menu.html's search uses (so "hsr" or "hongshao" finds 红烧肉).

Run it after adding or renaming a dish in menu.html:
    python assets/menu_pinyin.py
Needs pypinyin once:  pip install pypinyin
Dishes missing from the index are still found by their Chinese and English names, just not by pinyin.
"""
import html, json, re
from pathlib import Path
from pypinyin import lazy_pinyin, Style

page = Path(__file__).resolve().parent.parent / 'menu.html'
text = page.read_text(encoding='utf-8')
names = [html.unescape(n) for n in re.findall(r'<span class="dish-name"[^>]*?data-zh="([^"]*)"', text)]
index = {}
for name in names:
    full = ''.join(p for p in lazy_pinyin(name, errors='ignore') if p.isalpha()).lower()
    initials = ''.join(p[0] for p in lazy_pinyin(name, style=Style.NORMAL, errors='ignore') if p and p[0].isalpha()).lower()
    index[name] = (full + ' ' + initials).strip()
new = 'const PINYIN = ' + json.dumps(index, ensure_ascii=False) + ';'
text, n = re.subn(r'const PINYIN = \{.*?\};', lambda m: new, text, count=1, flags=re.S)
if n != 1:
    raise SystemExit('menu.html: could not find the PINYIN map in the search script')
with open(page, 'w', encoding='utf-8', newline='') as f:
    f.write(text)
print(f'menu.html: pinyin index rebuilt for {len(index)} dishes')
