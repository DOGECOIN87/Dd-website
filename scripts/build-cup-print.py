"""Builds the one-colour (black) cup print from the brand logo raster.

Usage: python3 -I scripts/build-cup-print.py public/brand/sip-society-daiquiri-depot.webp out.png
(then save out.png as public/brand/cup-print.webp, lossless). Needs numpy, Pillow and scipy.

The logo is two-tone with drop shadows ("Sip Society" navy on a coral shadow,
"Daiquiri depot" coral on a navy shadow). A one-colour print keeps the letter
fills only, at 3x the source resolution with smooth edges, and continues the
'D' and 't' strokes that the source raster crops at its edges.
"""
import sys
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

src, out = sys.argv[1], sys.argv[2]
im = np.array(Image.open(src).convert('RGBA')).astype(np.float32)
PAD = 30
im = np.pad(im, ((PAD, PAD), (PAD, PAD), (0, 0)))
H, W = im.shape[:2]
rgb, alpha = im[..., :3], im[..., 3] / 255.0

inks = {'navy': (37, 53, 66), 'coral': (200, 116, 99), 'gold': (208, 182, 127), 'teal': (90, 142, 150), 'cream': (245, 232, 214)}
names = list(inks)
d = ((rgb[:, :, None, :] - np.array([inks[n] for n in names], np.float32)[None, None]) ** 2).sum(-1)
w = np.exp(-(d - d.min(-1, keepdims=True)) / 900.0)
w /= w.sum(-1, keepdims=True)
ink = {n: w[..., i] * alpha for i, n in enumerate(names)}

ys = np.arange(H)[:, None] - PAD
xs = np.arange(W)[None, :] - PAD


def box(x0, y0, x1, y1):
    return ((xs >= x0) & (xs <= x1) & (ys >= y0) & (ys <= y1)).astype(np.float32)


top = (ys < 270).astype(np.float32)  # "NB Sip Society TX"; "+ Daiquiri depot" below
nb_tx = box(180, 45, 280, 120) + box(435, 45, 535, 120)
underlines = box(180, 100, 280, 120) + box(435, 100, 535, 120)
fill = (ink['navy'] * top + ink['coral'] * (1 - top) * (1 - nb_tx)
        + (ink['gold'] + ink['coral'] * underlines) * nb_tx + ink['teal'] * box(320, 230, 410, 300))
fill = np.clip(fill, 0, 1)

# Dark antialiasing on the shadows' outer edges reads as ink in thin broken slivers: drop small pieces.
lab, n = ndimage.label(fill > 0.5)
sizes = ndimage.sum(np.ones_like(fill), lab, index=np.arange(1, n + 1))
keep = np.zeros(n + 1, bool)
keep[1:] = sizes >= 40
fill *= ndimage.binary_dilation(keep[lab], iterations=2)

# The source crops the 'D' and the 't': continue those strokes with round ends.
for col, step in ((PAD, -1), (W - PAD - 1, 1)):
    on = fill[:, col] > 0.5
    r = 0
    while r < H:
        if not on[r]:
            r += 1
            continue
        r1 = r
        while r1 + 1 < H and on[r1 + 1]:
            r1 += 1
        half, mid = (r1 - r + 1) / 2, (r + r1) / 2
        for y in range(max(0, r - 2), min(H, r1 + 3)):
            k = 1 - ((y - mid) / (half + 1)) ** 2
            for i in range(1, int(round(min(12, half) * np.sqrt(max(0.0, k)))) + 1):
                fill[y, col + step * i] = max(fill[y, col + step * i], fill[y, col])
        r = r1 + 1

S = 3
img = Image.fromarray(np.clip(fill * 255, 0, 255).astype(np.uint8), 'L').resize((W * S, H * S), Image.BICUBIC)
a = np.asarray(img.filter(ImageFilter.GaussianBlur(2.0))).astype(np.float32) / 255
a = np.clip((a - 0.4) / 0.2, 0, 1)
a = a * a * (3 - 2 * a)

ys_, xs_ = np.where(a > 0.02)
a = a[max(0, ys_.min() - 12):ys_.max() + 13, max(0, xs_.min() - 12):xs_.max() + 13]
rgba = np.zeros(a.shape + (4,), np.uint8)
rgba[..., :3] = 18  # printing black rather than pure #000
rgba[..., 3] = (a * 255).round().astype(np.uint8)
Image.fromarray(rgba, 'RGBA').save(out, optimize=True)
print(out, rgba.shape)
