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
export const luminance = (value: string) => {
  const [r, g, b] = hex(value);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
};

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

function texture(c: HTMLCanvasElement, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

/**
 * Paints the drink's colour map in cup space: u wraps around the cup, v is height.
 * Layers get wavy hand-poured boundaries, swirls spiral around the cup, and frozen
 * drinks get ice-crystal grain, so the drink reads clearly as it spins.
 */
export function liquidTexture(spec: DrinkSpec, wallTop: number, seed: number, vMax = LIQUID_VMAX) {
  const W = 768;
  const H = 384;
  const c = canvas(W, H);
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(W, H);
  const colors = (spec.colors.length ? spec.colors : ['#cf6f56']).map(hex);
  const vBottom = 0.1 / vMax;
  const vTop = wallTop / vMax;
  const n = colors.length;
  const rand = mulberry(seed);
  const waves = Array.from({ length: n }, () => [1 + Math.floor(rand() * 2), rand() * 6.28, 2 + Math.floor(rand() * 3), rand() * 6.28]);
  const frozen = spec.kind === 'frozen';
  const syrup: RGB = [52, 30, 18];

  for (let y = 0; y < H; y += 1) {
    const v = 1 - (y + 0.5) / H;
    const t = Math.min(1, Math.max(0, (vTop - v) / (vTop - vBottom))); // 0 at the surface, 1 at the bottom
    for (let x = 0; x < W; x += 1) {
      const u = (x + 0.5) / W;
      let col: RGB;
      if (spec.swirl && n > 1) {
        const phase = 2 * u + 1.7 * t * 2 + 0.07 * Math.sin(2 * Math.PI * (3 * t + u));
        const f = ((phase % 1) + 1) % 1 * n;
        const i = Math.floor(f);
        const edge = smooth(0.82, 1, f - i);
        col = mix(colors[i % n], colors[(i + 1) % n], edge);
      } else {
        col = colors[0];
        for (let k = 1; k < n; k += 1) {
          const [f1, p1, f2, p2] = waves[k];
          const wobble = 0.03 * Math.sin(2 * Math.PI * f1 * u + p1) + 0.014 * Math.sin(2 * Math.PI * f2 * u + p2);
          col = mix(col, colors[k], smooth(-0.035, 0.035, t + wobble - k / n));
        }
      }
      if (spec.pearls) col = mix(col, syrup, 1 - smooth(0.8 / LIQUID_VMAX, 1.05 / LIQUID_VMAX, v));
      let shade = 0.9 + 0.12 * (1 - t);
      if (frozen) {
        // Soft scooped lumps plus a faint crystal grain: smooth like a fresh pour, not sandy.
        const lumps = vnoise(u, v, 36, 14, seed) * 0.6 + vnoise(u, v, 90, 36, seed + 1) * 0.4;
        const grain = vnoise(u, v, 300, 130, seed + 2);
        shade *= 0.9 + 0.16 * lumps + 0.05 * grain;
        if (hash(x, y, seed + 7) > 0.9975) col = mix(col, [255, 255, 255], 0.35);
      } else {
        shade *= 0.96 + 0.08 * vnoise(u, v, 24, 10, seed);
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

  if (spec.drizzle) {
    // Syrup run down the inside of the wall from the rim: the coffee / dirty soda look.
    ctx.strokeStyle = spec.drizzle;
    ctx.fillStyle = spec.drizzle;
    ctx.lineCap = 'round';
    for (let i = 0; i < 11; i += 1) {
      const x0 = rand() * W;
      const len = (0.25 + rand() * 0.55) * (bottomY - surfaceY);
      const width = 5 + rand() * 9;
      const sway = (rand() - 0.5) * 30;
      wrap((dx) => {
        ctx.globalAlpha = 0.75 + rand() * 0.25;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(x0 + dx, surfaceY - 4);
        ctx.bezierCurveTo(x0 + dx + sway, surfaceY + len * 0.35, x0 + dx - sway, surfaceY + len * 0.7, x0 + dx + sway * 0.4, surfaceY + len);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x0 + dx + sway * 0.4, surfaceY + len, width * 0.75, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    ctx.globalAlpha = 0.9;
    ctx.fillRect(0, surfaceY - 8, W, 16);
    ctx.globalAlpha = 1;
  }

  if (spec.inclusions) {
    const count = { bubbles: 260, fruit: 34, specks: 520, seeds: 420 }[spec.inclusions];
    for (let i = 0; i < count; i += 1) {
      const x = rand() * W;
      const y = surfaceY + rand() * (bottomY - surfaceY);
      wrap((dx) => {
        ctx.beginPath();
        if (spec.inclusions === 'bubbles') {
          ctx.strokeStyle = 'rgba(255,255,255,.55)';
          ctx.lineWidth = 1.2;
          ctx.arc(x + dx, y, 1.2 + rand() * 3, 0, Math.PI * 2);
          ctx.stroke();
        } else if (spec.inclusions === 'fruit') {
          const blueberry = i % 2 === 0;
          ctx.fillStyle = blueberry ? '#2a2246' : '#f29a4a';
          if (blueberry) ctx.arc(x + dx, y, 9 + rand() * 5, 0, Math.PI * 2);
          else ctx.ellipse(x + dx, y, 22, 9, rand() * 3, 0, Math.PI);
          ctx.fill();
        } else {
          ctx.fillStyle = spec.inclusions === 'seeds' ? 'rgba(60,20,20,.55)' : 'rgba(70,25,10,.6)';
          ctx.ellipse(x + dx, y, 1.6, 1, rand() * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }
  }
  return texture(c);
}

/**
 * Condensation for the outside of the cup as a normal map: hundreds of beads,
 * a few heavy drops with run trails, and the two moulded fill-line rings.
 */
export function condensationNormalMap(cupHeight: number, coldTop: number, seed = 11) {
  const W = 1024;
  const H = 576;
  const height = new Float32Array(W * H);
  const rand = mulberry(seed);
  const coldRow = (1 - coldTop / cupHeight) * H;
  const bead = (cx: number, cy: number, rx: number, ry: number, amp: number) => {
    const x0 = Math.floor(cx - rx);
    const x1 = Math.ceil(cx + rx);
    for (let y = Math.max(0, Math.floor(cy - ry)); y <= Math.min(H - 1, Math.ceil(cy + ry)); y += 1) {
      for (let x = x0; x <= x1; x += 1) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        const d = dx * dx + dy * dy;
        if (d >= 1) continue;
        const idx = y * W + (((x % W) + W) % W);
        height[idx] = Math.max(height[idx], Math.sqrt(1 - d) * amp);
      }
    }
  };
  const spot = () => [rand() * W, coldRow + 8 + rand() * (H - coldRow - 30)] as const;
  for (let i = 0; i < 1500; i += 1) {
    const [x, y] = spot();
    const r = 1.2 + rand() * 2.2;
    bead(x, y, r, r * 0.95, r * 0.9);
  }
  for (let i = 0; i < 480; i += 1) {
    const [x, y] = spot();
    const r = 3 + rand() * 4.5;
    bead(x, y, r, r * (0.9 + rand() * 0.2), r * 0.8);
  }
  for (let i = 0; i < 26; i += 1) {
    const [x, y] = spot();
    const r = 7 + rand() * 5;
    bead(x, y, r * 0.85, r, r * 0.75);
    // Run trail: a thin, clear track below a heavy drop.
    const trail = 25 + rand() * 90;
    for (let k = 0; k < trail; k += 2) bead(x + Math.sin(k * 0.05) * 2, y + r + k, r * 0.32, 2.2, 1.2);
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
  const c = canvas(W, H);
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(W, H);
  const at = (x: number, y: number) => height[Math.min(H - 1, Math.max(0, y)) * W + (((x % W) + W) % W)];
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      let nx = (at(x - 1, y) - at(x + 1, y)) * 0.5;
      let ny = (at(x, y + 1) - at(x, y - 1)) * 0.5;
      let nz = 1;
      const len = Math.hypot(nx, ny, nz);
      nx /= len;
      ny /= len;
      nz /= len;
      const o = (y * W + x) * 4;
      img.data[o] = (nx * 0.5 + 0.5) * 255;
      img.data[o + 1] = (ny * 0.5 + 0.5) * 255;
      img.data[o + 2] = (nz * 0.5 + 0.5) * 255;
      img.data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return texture(c, false);
}

/** Fine ice-crystal relief for frozen drinks, tiled. */
export function slushNormalMap() {
  const S = 256;
  const c = canvas(S, S);
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(S, S);
  const hgt = (x: number, y: number) => vnoise(x / S, y / S, 32, 32, 3) * 0.6 + vnoise(x / S, y / S, 64, 64, 4) * 0.4;
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

/** Soft contact shadow under the cup. */
export function shadowTexture() {
  const S = 256;
  const c = canvas(S, S);
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(20,12,18,.55)');
  g.addColorStop(0.45, 'rgba(20,12,18,.3)');
  g.addColorStop(1, 'rgba(20,12,18,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Red strawberry skin with seeds. */
export function strawberryTexture() {
  const W = 256;
  const H = 128;
  const c = canvas(W, H);
  const ctx = c.getContext('2d')!;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#c21f33');
  g.addColorStop(0.75, '#d93043');
  g.addColorStop(1, '#e35a4d');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const rand = mulberry(5);
  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 14; col += 1) {
      const x = (col + (row % 2) * 0.5) * (W / 14) + rand() * 3;
      const y = 8 + row * (H / 9.5);
      ctx.fillStyle = 'rgba(120,10,25,.6)';
      ctx.beginPath();
      ctx.ellipse(x, y, 4, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f2d27a';
      ctx.beginPath();
      ctx.ellipse(x, y, 1.6, 2.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  return texture(c);
}

/**
 * The Sip Society + Daiquiri Depot cup print: cup-and-S mark, serif wordmark,
 * pink rule and script. `ink` switches between dark ink and white ink for dark drinks.
 */
export async function logoTexture(ink: 'dark' | 'light') {
  try {
    await Promise.race([
      Promise.all([document.fonts.load('800 80px "Fraunces"'), document.fonts.load('700 80px "Dancing Script"')]),
      new Promise((resolve) => setTimeout(resolve, 2500)),
    ]);
  } catch {
    // Fall back to whatever serif / cursive the browser has.
  }
  const W = 1024;
  const H = 900;
  const c = canvas(W, H);
  const ctx = c.getContext('2d')!;
  const main = ink === 'dark' ? '#16121a' : 'rgba(255,255,255,.94)';
  const pink = ink === 'dark' ? '#e2357f' : '#ff8fbe';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // Cup-and-S mark with its arc, like the shop sign.
  ctx.strokeStyle = main;
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.arc(W / 2, 205, 118, Math.PI * 1.05, Math.PI * 1.95);
  ctx.stroke();
  ctx.strokeStyle = pink;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(W / 2, 205, 140, Math.PI * 1.12, Math.PI * 1.88);
  ctx.stroke();
  ctx.fillStyle = main;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 70, 110);
  ctx.lineTo(W / 2 + 70, 110);
  ctx.lineTo(W / 2 + 54, 285);
  ctx.lineTo(W / 2 - 54, 285);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = pink;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(W / 2 + 18, 112);
  ctx.lineTo(W / 2 + 46, 34);
  ctx.stroke();
  ctx.fillStyle = ink === 'dark' ? pink : '#2a1020';
  ctx.font = '700 150px "Dancing Script", "Brush Script MT", cursive';
  ctx.fillText('S', W / 2, 255);

  ctx.fillStyle = main;
  ctx.font = '800 152px "Fraunces", Georgia, serif';
  ctx.fillText('SIP SOCIETY', W / 2, 470, W - 40);
  ctx.fillStyle = pink;
  ctx.fillRect(110, 528, 300, 8);
  ctx.fillRect(W - 410, 528, 300, 8);
  ctx.fillRect(W / 2 - 4, 498, 8, 68);
  ctx.fillRect(W / 2 - 34, 528, 68, 8);
  ctx.font = '700 170px "Dancing Script", "Brush Script MT", cursive';
  ctx.fillText('Daiquiri Depot', W / 2, 720, W - 30);
  const t = texture(c);
  t.wrapS = THREE.ClampToEdgeWrapping;
  return t;
}
