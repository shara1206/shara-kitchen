import io, sys
p = sys.argv[1] if len(sys.argv) > 1 else 'index.html'
s = io.open(p, encoding='utf-8').read()
start = s.index('<a class="topic-card" href="study-topics/chicken.html">')
end = s.index('</a>', start) + len('</a>')
block = s[start:end]
reps = [
 ('<div class="count" data-en="1 note" data-zh="1 篇笔记">1 note</div>',
  '<div class="count" data-en="2 notes" data-zh="2 篇笔记">2 notes</div>'),
 ('<p data-en="Where to buy free-range chicken around Seattle &mdash; 8 channels from T&amp;T and PCC to group-buy sellers, with community feedback." data-zh="西雅图哪里买走地鸡——从大统华、PCC 到团购共 8 个渠道，附网友评价。">Where to buy free-range chicken around Seattle &mdash; 8 channels from T&amp;T and PCC to group-buy sellers, with community feedback.</p>',
  '<p data-en="What each label really guarantees (Organic, Pasture-Raised, Free-Range, Air-Chilled&hellip;), plus where to buy free-range chicken around Seattle &mdash; 8 channels with community feedback." data-zh="各种标签到底保证了什么（有机、牧场散养、走地、风冷……），以及西雅图哪里买走地鸡——8 个渠道附网友评价。">What each label really guarantees (Organic, Pasture-Raised, Free-Range, Air-Chilled&hellip;), plus where to buy free-range chicken around Seattle &mdash; 8 channels with community feedback.</p>'),
]
for old, new in reps:
    n = block.count(old)
    assert n == 1, ('expected exactly 1 match inside the Chicken card, got', n, old[:60])
    block = block.replace(old, new)
s = s[:start] + block + s[end:]
io.open(p, 'w', encoding='utf-8', newline='').write(s)
print('index.html patched OK')
