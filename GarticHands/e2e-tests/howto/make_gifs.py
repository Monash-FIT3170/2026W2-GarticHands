"""Turn the frames recorded by record-howto.ts into the How to Play GIFs.

    python e2e-tests/howto/make_gifs.py            # every clip
    python e2e-tests/howto/make_gifs.py classic    # just one

Needs Pillow (`pip install pillow`). Writes client/public/howto/<clip>.gif and
<clip>.png (the last frame, shown to viewers who prefer reduced motion).
Identical consecutive frames are merged so still moments cost no space.
"""

import json
import sys
from pathlib import Path

from PIL import Image, ImageChops

HERE = Path(__file__).resolve().parent
FRAMES = HERE / "frames"
OUT = HERE.parent.parent / "client" / "public" / "howto"
WIDTH = 640
# Keep each GIF light enough for a phone connection.
MAX_BYTES = 2_500_000
MIN_FRAME_MS = 60
END_HOLD_MS = 1800
# Recording is slower than real play (every frame is a full screenshot), so
# long clips are sped up to play in about this long.
TARGET_SECONDS = 20


def load_clip(clip_dir: Path):
    frames = json.loads((clip_dir / "frames.json").read_text())
    images, durations = [], []
    for i, frame in enumerate(frames):
        image = Image.open(clip_dir / frame["file"]).convert("RGB")
        height = round(image.height * WIDTH / image.width)
        image = image.resize((WIDTH, height), Image.LANCZOS)
        nxt = frames[i + 1]["at"] if i + 1 < len(frames) else frame["at"] + END_HOLD_MS
        duration = max(MIN_FRAME_MS, nxt - frame["at"])
        if images and ImageChops.difference(images[-1], image).getbbox() is None:
            durations[-1] += duration
            continue
        images.append(image)
        durations.append(duration)
    return images, durations


def save_gif(images, durations, target: Path, colours: int):
    palette_source = images[len(images) // 2]
    palette = palette_source.quantize(colors=colours, method=Image.Quantize.MEDIANCUT)
    frames = [im.quantize(palette=palette, dither=Image.Dither.NONE) for im in images]
    frames[0].save(
        target,
        save_all=True,
        append_images=frames[1:],
        duration=durations,
        loop=0,
        optimize=True,
        disposal=1,
    )


def build(clip: str):
    clip_dir = FRAMES / clip
    images, durations = load_clip(clip_dir)
    speedup = max(1.0, sum(durations) / 1000 / TARGET_SECONDS)
    durations = [max(MIN_FRAME_MS, round(d / speedup)) for d in durations]
    durations[-1] = max(durations[-1], END_HOLD_MS)
    OUT.mkdir(parents=True, exist_ok=True)
    gif = OUT / f"{clip}.gif"

    # Step the palette down until the GIF fits the budget.
    for colours in (128, 64, 32):
        save_gif(images, durations, gif, colours)
        if gif.stat().st_size <= MAX_BYTES:
            break

    images[-1].save(OUT / f"{clip}.png", optimize=True)
    seconds = sum(durations) / 1000
    print(f"{clip}: {len(images)} frames, {seconds:.1f}s, {gif.stat().st_size / 1e6:.2f} MB")


if __name__ == "__main__":
    clips = sys.argv[1:] or sorted(p.name for p in FRAMES.iterdir() if (p / "frames.json").exists())
    for name in clips:
        build(name)
