"""Colour-grades a bright, saturated photo so it sits with the site's cream and pink palette:
softer saturation (more so in the sky), gentler contrast with lifted blacks, highlights washed
toward cream, and a slightly warmer balance. Used for public/photos/fm306-drive-thru.webp.

Usage: python3 -I scripts/grade-photo.py in.jpg public/photos/out.webp   (needs numpy and Pillow)
"""
import sys
import numpy as np
from PIL import Image

SATURATION, SKY_SATURATION = 0.74, 0.58
CONTRAST, LIFT = 0.88, 0.05
CREAM, CREAM_AMOUNT = (251, 245, 236), 0.16  # the site's --cream
WARMTH = 0.03

src, out = sys.argv[1], sys.argv[2]
im = np.asarray(Image.open(src).convert('RGB')).astype(np.float32) / 255
r, g, b = im[..., 0], im[..., 1], im[..., 2]
luma = (0.2126 * r + 0.7152 * g + 0.0722 * b)[..., None]
blueness = np.clip((b - np.maximum(r, g)) * 4, 0, 1)[..., None]
im = luma + (im - luma) * (SATURATION - (SATURATION - SKY_SATURATION) * blueness)
im = 0.5 + (im - 0.5) * CONTRAST
im = LIFT + im * (1 - LIFT)
highlights = np.clip((luma - 0.45) / 0.55, 0, 1) ** 1.5 * CREAM_AMOUNT
im = im * (1 - highlights) + np.array(CREAM, np.float32) / 255 * highlights
im = im * np.array([1 + WARMTH, 1, 1 - WARMTH * 1.5], np.float32)
Image.fromarray((np.clip(im, 0, 1) * 255 + 0.5).astype(np.uint8)).save(out, quality=86, method=6)
