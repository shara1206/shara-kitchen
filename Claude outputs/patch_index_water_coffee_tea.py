"""Add the "Water for Coffee & Tea" card to index.html, right after the Drinking Water card.
Run from the site root:  python patch_index_water_coffee_tea.py [index.html]"""
import io, sys

p = sys.argv[1] if len(sys.argv) > 1 else 'index.html'
s = io.open(p, encoding='utf-8', newline='').read()

new_href = 'href="study-topics/water-coffee-tea.html"'
assert new_href not in s, 'card already present - nothing to do'

anchor = '<a class="topic-card" href="study-topics/water.html">'
assert s.count(anchor) == 1, ('expected exactly 1 Drinking Water card, got', s.count(anchor))
start = s.index(anchor)
end = s.index('</a>', start) + len('</a>')

nl = '\r\n' if '\r\n' in s[start:end] else '\n'
card = nl.join([
    '',
    '          <a class="topic-card" href="study-topics/water-coffee-tea.html">',
    '            <span class="topic-icon">&#127861;</span>',
    '            <div class="topic-info">',
    '              <h3 data-en="Water for Coffee &amp; Tea" data-zh="咖啡与茶用水">Water for Coffee &amp; Tea</h3>',
    '              <div class="count" data-en="Seattle vs Delaware" data-zh="西雅图与 Delaware 对比">Seattle vs Delaware</div>',
    '              <p data-en="Why coffee wants a little bicarbonate and tea almost none, which tap or bottled water to brew with in each home, two-water blends with nothing added, and a KH test for Deer Park." data-zh="为什么咖啡要一点碳酸氢根、茶几乎不要；两处住所各用哪种自来水或瓶装水；不加任何东西的两种水兑法；以及 Deer Park 的 KH 测试。">Why coffee wants a little bicarbonate and tea almost none, which tap or bottled water to brew with in each home, two-water blends with nothing added, and a KH test for Deer Park.</p>',
    '            </div>',
    '          </a>',
])
s = s[:end] + card + s[end:]
io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('index.html patched OK - Water for Coffee & Tea card added after Drinking Water')
