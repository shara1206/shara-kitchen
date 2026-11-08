#!/usr/bin/env python3
"""
make_stickers.py — turn the menu-sticker PNGs into the web copies used by the site.

    python assets/stickers/make_stickers.py "G:/My Drive/Photo/手帐素材/menu-stickers"            # all sm/ + the lg/ already present
    python assets/stickers/make_stickers.py "G:/My Drive/Photo/手帐素材/menu-stickers" --lg 25 179  # also make lg/025, lg/179

Source PNGs: 1254x1254 transparent, named NNN-菜名.png in category subfolders
(mapping: 菜名与文件对照表.csv there, copied here as index.csv).
Each sticker is trimmed to its visible pixels, centred in a 4:3 transparent canvas, saved as WebP:
    sm/NNN.webp  160x120  q80  (~8 KB)   menu.html icon / picture card — every menu dish
    lg/NNN.webp  640x480  q82  (~80 KB)  recipe-page header — only dishes that have a recipe page
Needs Pillow (pip install pillow).
"""
import glob, os, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))

def fit(im, w, h, margin):
    alpha = im.getchannel("A").point(lambda p: 255 if p > 12 else 0)
    c = im.crop(alpha.getbbox())
    s = min(w * (1 - 2 * margin) / c.width, h * (1 - 2 * margin) / c.height)
    c = c.resize((max(1, round(c.width * s)), max(1, round(c.height * s))), Image.LANCZOS)
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    out.paste(c, ((w - c.width) // 2, (h - c.height) // 2), c)
    return out

def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    src = sys.argv[1]
    extra_lg = {int(x) for x in sys.argv[sys.argv.index("--lg") + 1:]} if "--lg" in sys.argv else set()
    os.makedirs(os.path.join(HERE, "sm"), exist_ok=True)
    os.makedirs(os.path.join(HERE, "lg"), exist_ok=True)
    have_lg = {int(f[:3]) for f in os.listdir(os.path.join(HERE, "lg")) if f.endswith(".webp")}
    pngs = sorted(glob.glob(os.path.join(src, "*", "[0-9][0-9][0-9]-*.png")))
    for p in pngs:
        n = int(os.path.basename(p)[:3])
        im = Image.open(p).convert("RGBA")
        fit(im, 160, 120, 0.03).save(os.path.join(HERE, "sm", f"{n:03d}.webp"), "WEBP", quality=80, method=6)
        if n in have_lg or n in extra_lg:
            fit(im, 640, 480, 0.02).save(os.path.join(HERE, "lg", f"{n:03d}.webp"), "WEBP", quality=82, method=6)
        print(f"{n:03d}", "sm" + (" + lg" if n in have_lg or n in extra_lg else ""))
    print(f"done: {len(pngs)} stickers")

if __name__ == "__main__":
    main()
