"""Stitches webtoon blocks into one vertical strip, then slices it.

Usage: python3 tools/stitch_webtoon.py manifest.json out_dir
Writes out_dir/NNN.jpg (800x1280 slices, WEBTOON's upload size) and out_dir/webtoon.html, a
self-contained page that scrolls the whole episode.
"""
import base64
import io
import json
import os
import sys

from PIL import Image

SLICE_H = 1280


def main():
    manifest_path, out_dir = sys.argv[1], sys.argv[2]
    with open(manifest_path) as f:
        manifest = json.load(f)
    blocks = [Image.open(m["file"]).convert("RGB") for m in manifest]
    width = blocks[0].width
    height = sum(b.height + m["gap"] for b, m in zip(blocks, manifest)) + 120
    strip = Image.new("RGB", (width, height), "white")
    y = 60
    for b, m in zip(blocks, manifest):
        strip.paste(b, (0, y))
        y += b.height + m["gap"]

    os.makedirs(out_dir, exist_ok=True)
    for name in os.listdir(out_dir):
        if name.endswith(".jpg"):
            os.remove(os.path.join(out_dir, name))
    slices = []
    for i, top in enumerate(range(0, height, SLICE_H), 1):
        part = strip.crop((0, top, width, min(height, top + SLICE_H)))
        part.save(os.path.join(out_dir, f"{i:03d}.jpg"), quality=86)
        buf = io.BytesIO()
        part.save(buf, "JPEG", quality=80)
        slices.append(base64.b64encode(buf.getvalue()).decode())

    imgs = "\n".join(f'<img src="data:image/jpeg;base64,{s}" alt="">' for s in slices)
    html = f"""<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Summit Edition Webtoon</title>
<style>
  :root {{ --bg: #e8e8ea; }}
  @media (prefers-color-scheme: dark) {{ :root {{ --bg: #141416; }} }}
  body {{ margin: 0; background: var(--bg); }}
  main {{ max-width: {width}px; margin: 0 auto; background: #fff; }}
  img {{ display: block; width: 100%; height: auto; }}
</style></head>
<body><main>
{imgs}
</main></body></html>
"""
    with open(os.path.join(out_dir, "webtoon.html"), "w") as f:
        f.write(html)
    print(f"{len(slices)} slices, strip {width}x{height} -> {out_dir}")


if __name__ == "__main__":
    main()
