import * as THREE from 'three';
import { LIQUID_VMAX, mulberry } from './geometry';
import type { DrinkSpec } from './types';

type RGB = [number, number, number];

const hex = (value: string): RGB => {
  const n = parseInt(value.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const frac = (x: number) => x - Math.floor(x);

function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function hash(x: number, y: number, seed: number) {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 982451653);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

/** Value noise that tiles horizontally (period gx cells) so it wraps seamlessly around the cup. */
function vnoise(u: number, v: number, gx: number, gy: number, seed: number) {
  const x = u * gx;
  const y = v * gy;
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const x0 = ((ix % gx) + gx) % gx;
  const x1 = (x0 + 1) % gx;
  const a = hash(x0, iy, seed);
  const b = hash(x1, iy, seed);
  const c = hash(x0, iy + 1, seed);
  const d = hash(x1, iy + 1, seed);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

/** Fractal value noise, 0..1, still tiling around the cup. */
function fbm(u: number, v: number, gx: number, gy: number, seed: number, octaves = 3) {
  let sum = 0;
  let amp = 1;
  let norm = 0;
  for (let o = 0; o < octaves; o += 1) {
    sum += amp * vnoise(u, v, gx << o, gy << o, seed + o * 31);
    norm += amp;
    amp *= 0.5;
  }
  return sum / norm;
}

/**
 * Evaluates a smooth (and horizontally tiling) field on a coarse grid once and
 * interpolates it, so low-frequency structure costs almost nothing per pixel.
 */
function coarse(gw: number, gh: number, f: (u: number, v: number) => number) {
  const row = gw + 1;
  const data = new Float32Array(row * (gh + 1));
  for (let j = 0; j <= gh; j += 1) for (let i = 0; i <= gw; i += 1) data[j * row + i] = f(i / gw, j / gh);
  return (u: number, v: number) => {
    const x = frac(u) * gw;
    const y = Math.min(gh - 1e-6, Math.max(0, v * gh));
    const i = Math.min(gw - 1, Math.floor(x));
    const j = Math.floor(y);
    const fx = x - i;
    const fy = y - j;
    const a = data[j * row + i];
    const b = data[j * row + i + 1];
    const c = data[(j + 1) * row + i];
    const d = data[(j + 1) * row + i + 1];
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  };
}

function texture(c: HTMLCanvasElement, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.anisotropy = 16; // three clamps this to what the GPU supports
  return t;
}

/**
 * Paints the drink as it looks pressed against the inside of the wall: u wraps
 * around the cup, v is height. Nothing here is regular. Layers meet along soft,
 * wandering edges that feather into each other; swirls are hand-poured bands
 * whose pitch, width and edges drift; frozen drinks get creamy slush with the
 * small air pockets and ice glints you see through a real cup.
 */
export function liquidTexture(spec: DrinkSpec, wallTop: number, seed: number, vMax = LIQUID_VMAX) {
  const W = 1024;
  const H = 512;
  const c = canvas(W, H);
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(W, H);
  const colors = (spec.colors.length ? spec.colors : ['#cf6f56']).map(hex);
  const n = colors.length;
  const vBottom = 0.1 / vMax;
  const vTop = wallTop / vMax;
  const rand = mulberry(seed);
  const s = seed % 99991;
  const frozen = spec.kind === 'frozen';
  const latte = spec.kind === 'latte';
  const syrup: RGB = [52, 30, 18];

  // Layer boundaries wander around the cup, each in its own way, and blur by different amounts.
  const offsets = Array.from({ length: n }, (_, k) => coarse(128, 1, (u) => (fbm(u, k * 0.31, 2, 1, s + k * 17) - 0.5) * (latte ? 0.2 : 0.13)
    + (vnoise(u, k * 0.53, 7, 1, s + k * 23) - 0.5) * 0.035));
  const widths = Array.from({ length: n }, (_, k) => coarse(128, 1, (u) => (latte ? 0.05 : 0.014) + (latte ? 0.06 : 0.04) * fbm(u, k * 0.7, 3, 1, s + k * 29)));

  // Swirls: bands spiral up the cup, but the pitch drifts with height, the bands bend and thin out, and the edges smear.
  const turns = rand() < 0.5 ? 1 : -1;
  const pitch = 0.75 + rand() * 0.2;
  const p1 = rand() * 6.28;
  const p2 = rand() * 6.28;
  const warp = coarse(96, 48, (u, v) => (fbm(u, v * 1.6, 2, 3, s + 3) - 0.5) * 0.55 + (fbm(u, v * 1.6, 5, 7, s + 4) - 0.5) * 0.16);
  const duty = coarse(64, 32, (u, v) => 0.5 + (fbm(u, v, 2, 3, s + 9) - 0.5) * 0.5);
  const edge = coarse(64, 32, (u, v) => 0.025 + 0.09 * fbm(u, v, 3, 4, s + 13) ** 2);
  const marble = coarse(128, 64, (u, v) => fbm(u, v * 2, 3, 6, s + 15, 2));
  const tone = coarse(64, 32, (u, v) => fbm(u, v, 4, 3, s + 19, 2));

  for (let y = 0; y < H; y += 1) {
    const v = 1 - (y + 0.5) / H;
    const t = (vTop - v) / (vTop - vBottom); // 0 at the surface, 1 at the bottom; negative in a frozen mound
    const tc = Math.min(1, Math.max(0, t));
    const height = v * vMax;
    const along = pitch * height + 0.12 * Math.sin(1.7 * height + p1) + 0.06 * Math.sin(4.1 * height + p2);
    for (let x = 0; x < W; x += 1) {
      const u = (x + 0.5) / W;
      // Fine streaks running around the cup: slush and syrup smear sideways along the wall as the cup is filled.
      const streak = vnoise(u, v, 28, 260, s + 5) - 0.5;
      let col: RGB;
      if (spec.swirl && n > 1) {
        const phase = turns * u + along + warp(u, v) + streak * 0.025;
        if (n === 2) {
          const f = frac(phase);
          const d = duty(u, v);
          const inside = f < d ? Math.min(f, d - f) : -Math.min(f - d, 1 - f); // signed distance to the nearest band edge
          const w = edge(u, v);
          col = mix(colors[1], colors[0], smooth(-w, w, inside + streak * 0.025));
        } else {
          const f = frac(phase) * n;
          const i = Math.floor(f);
          col = mix(colors[i % n], colors[(i + 1) % n], smooth(1 - edge(u, v) * n * 2.4, 1, f - i + streak * 0.08));
        }
      } else {
        col = colors[0];
        for (let k = 1; k < n; k += 1) {
          const at = k / n + offsets[k](u, 0) + streak * (latte ? 0.06 : 0.03);
          const w = widths[k](u, 0);
          col = mix(col, colors[k], smooth(at - w, at + w, tc));
        }
        if (latte && n > 1) {
          // Milk ribbons folding through the coffee.
          const m = smooth(0.58, 0.72, marble(u, v) + streak * 0.1) * (1 - smooth(0.85, 1, tc));
          col = mix(col, colors[0], m * 0.55);
        }
      }
      if (spec.pearls) col = mix(col, syrup, 1 - smooth(0.8 / LIQUID_VMAX, 1.05 / LIQUID_VMAX, v));

      let shade = (0.92 + 0.1 * (1 - tc)) * (0.95 + 0.1 * tone(u, v));
      if (frozen) {
        // Wall contact: mostly smooth, creamy slush with small air pockets (darker, richer) ringed by frost,
        // a fine crystal grain and the odd ice glint.
        const g = vnoise(u, v, 70, 30, s + 21) * 0.62 + vnoise(u, v, 170, 75, s + 22) * 0.38;
        const pocket = smooth(0.7, 0.78, g);
        const rim = smooth(0.62, 0.7, g) * (1 - pocket);
        shade *= 1 - 0.08 * pocket + 0.035 * rim + (hash(x, y, s) - 0.5) * 0.04;
        if (pocket > 0) col = mix(col, [col[0] * col[0] / 255, col[1] * col[1] / 255, col[2] * col[2] / 255], pocket * 0.18);
        if (t < 0) {
          // The exposed heap: open to the air it is frostier and coarser, scattered with ice granules.
          const air = smooth(0, -0.08, t);
          const granule = vnoise(u, v, 260, 160, s + 23);
          col = mix(col, [255, 255, 255], air * (0.06 + 0.14 * smooth(0.55, 0.85, granule)));
          shade *= 1 - air * 0.1 * smooth(0.45, 0.2, granule);
        }
        if (hash(x, y, s + 7) > (t < 0 ? 0.994 : 0.9982)) col = mix(col, [255, 255, 255], 0.45);
      } else {
        shade *= 1 + (hash(x, y, s) - 0.5) * 0.015;
      }
      const o = (y * W + x) * 4;
      img.data[o] = Math.min(255, col[0] * shade);
      img.data[o + 1] = Math.min(255, col[1] * shade);
      img.data[o + 2] = Math.min(255, col[2] * shade);
      img.data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  const surfaceY = (1 - vTop) * H;
  const bottomY = (1 - vBottom) * H;
  const wrap = (draw: (dx: number) => void) => [-W, 0, W].forEach(draw);

  if (spec.ice && !frozen) {
    // Cubes pressed against the wall show as paler, glassy blocks in the drink.
    for (let i = 0; i < 18; i += 1) {
      const x = rand() * W;
      const y = surfaceY + 10 + Math.pow(rand(), 1.4) * (bottomY - surfaceY) * 0.7;
      const size = 46 + rand() * 30;
      const angle = (rand() - 0.5) * 0.9;
      const alpha = 0.1 + rand() * 0.1;
      wrap((dx) => {
        ctx.save();
        ctx.translate(x + dx, y);
        ctx.rotate(angle);
        ctx.scale(1, 0.8 + rand() * 0.3);
        const g = ctx.createLinearGradient(-size / 2, -size / 2, size / 2, size / 2);
        g.addColorStop(0, `rgba(255,255,255,${alpha * 2.2})`);
        g.addColorStop(0.5, `rgba(255,255,255,${alpha})`);
        g.addColorStop(1, `rgba(255,255,255,${alpha * 0.4})`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.roundRect(-size / 2, -size / 2, size, size, size * 0.22);
        ctx.fill();
        ctx.strokeStyle = `rgba(255,255,255,${alpha * 2.4})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      });
    }
  }

  if (spec.drizzle) {
    // Syrup run down the inside of the wall from the rim: the coffee / dirty soda look.
    ctx.strokeStyle = spec.drizzle;
    ctx.fillStyle = spec.drizzle;
    ctx.lineCap = 'round';
    for (let i = 0; i < 13; i += 1) {
      const x0 = rand() * W;
      const len = (0.2 + rand() * 0.6) * (bottomY - surfaceY);
      const width = 3 + rand() * 9;
      const sway = (rand() - 0.5) * 36;
      const alpha = 0.55 + rand() * 0.4;
      wrap((dx) => {
        ctx.globalAlpha = alpha;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(x0 + dx, surfaceY - 4);
        ctx.bezierCurveTo(x0 + dx + sway, surfaceY + len * 0.35, x0 + dx - sway, surfaceY + len * 0.7, x0 + dx + sway * 0.4, surfaceY + len);
        ctx.stroke();
        ctx.lineWidth = width * 0.45;
        ctx.globalAlpha = alpha * 0.5;
        ctx.beginPath();
        ctx.moveTo(x0 + dx + sway * 0.4, surfaceY + len);
        ctx.lineTo(x0 + dx + sway * 0.4, surfaceY + len * (1.08 + rand() * 0.1));
        ctx.stroke();
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(x0 + dx + sway * 0.4, surfaceY + len, width * 0.62, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    ctx.globalAlpha = 0.85;
    ctx.fillRect(0, surfaceY - 8, W, 14);
    ctx.globalAlpha = 1;
  }

  if (spec.inclusions) {
    const count = { bubbles: 320, specks: 620, seeds: 520 }[spec.inclusions];
    for (let i = 0; i < count; i += 1) {
      const x = rand() * W;
      const y = surfaceY + rand() * (bottomY - surfaceY);
      wrap((dx) => {
        ctx.beginPath();
        if (spec.inclusions === 'bubbles') {
          ctx.strokeStyle = 'rgba(255,255,255,.5)';
          ctx.lineWidth = 1;
          ctx.arc(x + dx, y, 1 + rand() * 2.6, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.fillStyle = spec.inclusions === 'seeds' ? 'rgba(60,20,20,.5)' : 'rgba(70,25,10,.55)';
          ctx.ellipse(x + dx, y, 1.4 + rand(), 0.9, rand() * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }
  }
  return texture(c);
}

/**
 * Condensation on the outside of a cold cup, as a normal map and a roughness map.
 * Below the drink line the plastic fogs with a fine mist; beads of every size sit
 * on it, densest in drifts, and the heavy ones have slid down leaving clear tracks.
 * Each bead and track wipes the mist away (low roughness), so the drink shows
 * through them crisply while the fogged wall softens it, as on a real iced cup.
 * With `beads` off the wall is an even, smooth mist, as the water cup looks.
 */
export function condensationMaps(cupHeight: number, coldTop: number, seed = 11, beads = true) {
  const W = 1024;
  const H = 576;
  const height = new Float32Array(W * H);
  const wiped = new Float32Array(W * H);
  const rand = mulberry(seed);
  const coldRow = (1 - coldTop / cupHeight) * H;
  const bottomRow = H - (0.07 / cupHeight) * H;
  const idx = (x: number, y: number) => y * W + (((x % W) + W) % W);
  const bead = (cx: number, cy: number, rx: number, ry: number, amp: number) => {
    for (let y = Math.max(0, Math.floor(cy - ry)); y <= Math.min(H - 1, Math.ceil(cy + ry)); y += 1) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x += 1) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        const d = dx * dx + dy * dy;
        if (d >= 1) continue;
        const i = idx(x, y);
        // Spherical cap with a slightly flattened crown: crisp edge, bright glint.
        height[i] = Math.max(height[i], Math.pow(1 - d, 0.6) * amp);
        wiped[i] = Math.max(wiped[i], smooth(1, 0.55, d));
      }
    }
  };
  const drift = (x: number, y: number) => fbm(x / W, y / H, 5, 3, seed, 2);
  const spot = (minDensity: number) => {
    for (;;) {
      const x = rand() * W;
      const y = coldRow + 5 + rand() * (bottomRow - coldRow - 10);
      if (rand() < minDensity + (1 - minDensity) * drift(x, y) ** 2 * 2.2) return [x, y] as const;
    }
  };
  for (let i = 0; beads && i < 9000; i += 1) {
    const [x, y] = spot(0.15);
    const r = 0.7 + rand() * 0.9;
    bead(x, y, r, r, r * 0.55);
  }
  for (let i = 0; beads && i < 1500; i += 1) {
    const [x, y] = spot(0.1);
    const r = 1.6 + rand() * 1.8;
    bead(x, y, r, r * (0.95 + rand() * 0.15), r * 0.7);
  }
  for (let i = 0; beads && i < 230; i += 1) {
    const [x, y] = spot(0.05);
    const r = 3.4 + rand() * 3;
    bead(x, y, r, r * (1.05 + rand() * 0.2), r * 0.7);
  }
  for (let i = 0; beads && i < 16; i += 1) {
    // A heavy drop that has slid: a clear track behind it, a few droplets stranded along it.
    const x = rand() * W;
    const y = coldRow + 20 + rand() * (bottomRow - coldRow) * 0.55;
    const r = 5.5 + rand() * 3.5;
    const run = 30 + rand() * 120;
    const sway = (rand() - 0.5) * 3;
    for (let k = 0; k < run; k += 1.5) {
      const tx = x + Math.sin(k * 0.04 + i) * sway;
      const ty = y - run + k;
      const w = r * (0.35 + 0.35 * (k / run));
      for (let dx = -Math.ceil(w); dx <= Math.ceil(w); dx += 1) {
        const yy = Math.round(ty);
        if (yy < 0 || yy >= H) continue;
        const ii = idx(Math.round(tx) + dx, yy);
        const e = 1 - Math.abs(dx) / (w + 0.5);
        height[ii] = Math.max(height[ii] * (1 - e), e * 0.5);
        wiped[ii] = Math.max(wiped[ii], smooth(0, 0.4, e));
      }
      if (rand() < 0.05) bead(tx + (rand() - 0.5) * w, ty, 1.2, 1.2, 0.8);
    }
    bead(x, y, r * 0.9, r * 1.15, r * 0.75);
  }
  // Moulded fill-line rings near the top of a tall cup.
  if (cupHeight > 2) {
    for (const ringY of [2.42, 2.52]) {
      const row = (1 - ringY / cupHeight) * H;
      for (let y = Math.floor(row - 3); y <= Math.ceil(row + 3); y += 1) {
        const k = Math.exp(-(((y - row) / 1.6) ** 2)) * 2.2;
        for (let x = 0; x < W; x += 1) height[y * W + x] = Math.max(height[y * W + x], k);
      }
    }
  }

  const normal = canvas(W, H);
  const rough = canvas(W, H);
  const nctx = normal.getContext('2d')!;
  const rctx = rough.getContext('2d')!;
  const nimg = nctx.createImageData(W, H);
  const rimg = rctx.createImageData(W, H);
  const at = (x: number, y: number) => height[Math.min(H - 1, Math.max(0, y)) * W + (((x % W) + W) % W)];
  for (let y = 0; y < H; y += 1) {
    const fog = smooth(coldRow - 2, coldRow + 10, y) * (1 - smooth(bottomRow - 6, bottomRow + 4, y));
    for (let x = 0; x < W; x += 1) {
      let nx = (at(x - 1, y) - at(x + 1, y)) * 0.5;
      let ny = (at(x, y + 1) - at(x, y - 1)) * 0.5;
      let nz = 1;
      const len = Math.hypot(nx, ny, nz);
      nx /= len;
      ny /= len;
      nz /= len;
      const o = (y * W + x) * 4;
      nimg.data[o] = (nx * 0.5 + 0.5) * 255;
      nimg.data[o + 1] = (ny * 0.5 + 0.5) * 255;
      nimg.data[o + 2] = (nz * 0.5 + 0.5) * 255;
      nimg.data[o + 3] = 255;
      // Mist is rough, clean plastic and wiped beads are smooth.
      const r = 0.045 + fog * (0.055 + 0.02 * (hash(x, y, seed) - 0.5)) * (1 - wiped[y * W + x]);
      const g = Math.round(r * 255);
      rimg.data[o] = g;
      rimg.data[o + 1] = g;
      rimg.data[o + 2] = g;
      rimg.data[o + 3] = 255;
    }
  }
  nctx.putImageData(nimg, 0, 0);
  rctx.putImageData(rimg, 0, 0);
  return { normal: texture(normal, false), roughness: texture(rough, false) };
}

/** Fine ice-crystal relief for frozen drinks, tiled. */
export function slushNormalMap() {
  const S = 256;
  const c = canvas(S, S);
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(S, S);
  const hgt = (x: number, y: number) => vnoise(x / S, y / S, 32, 32, 3) * 0.55 + vnoise(x / S, y / S, 64, 64, 4) * 0.3
    + vnoise(x / S, y / S, 128, 128, 5) * 0.15;
  for (let y = 0; y < S; y += 1) {
    for (let x = 0; x < S; x += 1) {
      const nx = (hgt(x - 1, y) - hgt(x + 1, y)) * 9;
      const ny = (hgt(x, y + 1) - hgt(x, y - 1)) * 9;
      const len = Math.hypot(nx, ny, 1);
      const o = (y * S + x) * 4;
      img.data[o] = (nx / len * 0.5 + 0.5) * 255;
      img.data[o + 1] = (ny / len * 0.5 + 0.5) * 255;
      img.data[o + 2] = (1 / len * 0.5 + 0.5) * 255;
      img.data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = texture(c, false);
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(7, 4);
  return t;
}

/** Ice: faint internal fractures and a frosted skin, tiled. */
export function iceNormalMap() {
  const S = 256;
  const height = new Float32Array(S * S);
  const rand = mulberry(41);
  for (let y = 0; y < S; y += 1) {
    for (let x = 0; x < S; x += 1) height[y * S + x] = vnoise(x / S, y / S, 16, 16, 8) * 0.8 + vnoise(x / S, y / S, 64, 64, 9) * 0.2;
  }
  for (let k = 0; k < 7; k += 1) {
    let x = rand() * S;
    let y = rand() * S;
    let a = rand() * Math.PI * 2;
    for (let i = 0; i < 90; i += 1) {
      a += (rand() - 0.5) * 0.5;
      x += Math.cos(a);
      y += Math.sin(a);
      const ix = ((Math.round(x) % S) + S) % S;
      const iy = ((Math.round(y) % S) + S) % S;
      height[iy * S + ix] += 1.2;
    }
  }
  const c = canvas(S, S);
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(S, S);
  const at = (x: number, y: number) => height[(((y % S) + S) % S) * S + (((x % S) + S) % S)];
  for (let y = 0; y < S; y += 1) {
    for (let x = 0; x < S; x += 1) {
      const nx = (at(x - 1, y) - at(x + 1, y)) * 2.5;
      const ny = (at(x, y + 1) - at(x, y - 1)) * 2.5;
      const len = Math.hypot(nx, ny, 1);
      const o = (y * S + x) * 4;
      img.data[o] = (nx / len * 0.5 + 0.5) * 255;
      img.data[o + 1] = (ny / len * 0.5 + 0.5) * 255;
      img.data[o + 2] = (1 / len * 0.5 + 0.5) * 255;
      img.data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = texture(c, false);
  t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** Soft contact shadow under the cup. */
export function shadowTexture() {
  const S = 256;
  const c = canvas(S, S);
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(20,12,18,.5)');
  g.addColorStop(0.38, 'rgba(20,12,18,.3)');
  g.addColorStop(0.7, 'rgba(20,12,18,.08)');
  g.addColorStop(1, 'rgba(20,12,18,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * The cup print: the Sip Society + Daiquiri depot logo as a one-colour black
 * print (built from the brand logo by scripts/build-cup-print.py).
 */
export async function printTexture() {
  const img = await loadImage('/brand/cup-print.webp');
  const t = new THREE.Texture(img);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 16; // three clamps this to what the GPU supports
  t.needsUpdate = true;
  return { map: t, aspect: img.naturalWidth / img.naturalHeight };
}
