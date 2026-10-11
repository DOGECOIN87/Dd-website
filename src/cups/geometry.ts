import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Cup geometry, in "cup units" where the tall cup is 3 units high
 * (≈ 50 mm per unit, so a 24 oz PET cup: 98 mm mouth, 64 mm base, 150 mm tall).
 */
export interface CupDims {
  h: number;
  rTop: number;
  rBot: number;
  wall: number;
}

export const TALL: CupDims = { h: 3, rTop: 0.98, rBot: 0.64, wall: 0.014 };

const V = (x: number, y: number) => new THREE.Vector2(x, y);
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Top of the straight tapered side wall (the rolled rim bead sits above it). */
export const sideTop = (d: CupDims) => d.h - 0.1;

/** Outer wall radius at height y, including the stacking shoulder near the base. */
export function sideR(d: CupDims, y: number) {
  const t = (y - 0.06) / (sideTop(d) - 0.06);
  const shoulder = d.h > 2 ? 0.01 * smooth(0.36, 0.44, y) : 0;
  return d.rBot + (d.rTop - d.rBot) * t + shoulder;
}

/** Offsets an open profile polyline by `t` along its inward normal and returns the closed thin shell. */
function shell(outer: THREE.Vector2[], t: number) {
  const inner: THREE.Vector2[] = [];
  for (let i = 0; i < outer.length; i += 1) {
    const a = outer[Math.max(0, i - 1)];
    const b = outer[Math.min(outer.length - 1, i + 1)];
    const tx = b.x - a.x;
    const ty = b.y - a.y;
    const len = Math.hypot(tx, ty) || 1;
    // Outward normal of a profile walked bottom → top is the tangent rotated by -90°.
    const nx = ty / len;
    const ny = -tx / len;
    inner.push(V(Math.max(0, outer[i].x - nx * t), outer[i].y - ny * t));
  }
  return [...outer, ...inner.reverse()];
}

/** Lathe with UV.y remapped to world height so textures map to real heights, not profile indices. */
function lathe(points: THREE.Vector2[], segments: number, vMin: number, vMax: number, phiStart?: number, phiLength?: number) {
  const geo = new THREE.LatheGeometry(points, segments, phiStart, phiLength);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i += 1) uv.setY(i, (pos.getY(i) - vMin) / (vMax - vMin));
  uv.needsUpdate = true;
  return geo;
}

/** Clear PET cup: push-up base, stacking foot, tapered wall, stacking shoulder and rolled rim bead. */
export function cupGeometry(d: CupDims) {
  const { h, rBot } = d;
  const top = sideTop(d);
  const outer = [
    V(0, 0.072), V(rBot * 0.45, 0.066), V(rBot * 0.78, 0.045), V(rBot * 0.9, 0.012),
    V(rBot * 0.95, 0), V(rBot * 0.99, 0.008), V(rBot, 0.035),
  ];
  const steps = d.h > 2 ? 120 : 30;
  for (let i = 0; i <= steps; i += 1) {
    const y = 0.06 + ((top - 0.06) * i) / steps;
    outer.push(V(sideR(d, y), y));
  }
  const R = sideR(d, top);
  outer.push(
    V(R + 0.006, top + 0.022), V(R + 0.03, top + 0.046), V(R + 0.044, top + 0.07),
    V(R + 0.036, top + 0.093), V(R + 0.014, h), V(R - 0.006, top + 0.09),
  );
  return lathe(shell(outer, d.wall), 128, 0, h);
}

/** Tall-cup texture height range; liquid textures map v = y / LIQUID_VMAX. */
export const LIQUID_VMAX = 3.6;

export interface LiquidShape {
  /** Height of the drink surface where it meets the wall. */
  top: number;
  /** Height of the heaped slush above `top` (frozen drinks). */
  mound?: number;
  /** Narrow the drink below this height so tapioca pearls can sit against the wall. */
  pearlZone?: number;
}

/** Drink volume following the inside of the wall, with a meniscus or a heaped frozen top. */
export function liquidGeometry(d: CupDims, shape: LiquidShape, vMax = LIQUID_VMAX, seed = 1) {
  const inset = d.wall + 0.012;
  const rAt = (y: number) => {
    let r = sideR(d, y) - inset;
    if (shape.pearlZone) r -= 0.17 * (1 - smooth(shape.pearlZone - 0.08, shape.pearlZone + 0.06, y));
    return r;
  };
  const base = 0.095;
  const points = [V(0, base), V(rAt(base) - 0.03, base), V(rAt(base + 0.02) - 0.005, base + 0.012)];
  const steps = 60;
  for (let i = 1; i <= steps; i += 1) {
    const y = base + 0.02 + ((shape.top - base - 0.02) * i) / steps;
    points.push(V(rAt(y), y));
  }
  const rTop = rAt(shape.top);
  if (shape.mound) {
    // Slush heaps up from the rim in a soft shoulder to a rounded crown.
    const r0 = rTop - 0.03;
    for (let i = 1; i <= 40; i += 1) {
      const th = (i / 40) * (Math.PI / 2);
      points.push(V(Math.max(0, r0 * Math.cos(th) ** 0.8), shape.top + 0.01 + shape.mound * Math.sin(th) ** 1.25));
    }
  } else {
    points.push(V(rTop - 0.012, shape.top + 0.012), V(rTop - 0.05, shape.top + 0.016), V(rTop * 0.5, shape.top + 0.016), V(0, shape.top + 0.016));
  }
  const geo = lathe(points, 128, 0, vMax);
  if (shape.mound) {
    // Over the heap, run the texture by distance along the surface rather than height, which hardly
    // changes across the crown: slush grain stays even instead of smearing into streaks. The heap
    // takes the texture rows above the drink line (see liquidTexture).
    const first = points.length - 40;
    const arc = [0];
    for (let j = first + 1; j < points.length; j += 1) arc.push(arc[arc.length - 1] + points[j].distanceTo(points[j - 1]));
    const v0 = shape.top / vMax;
    const k = (0.995 - v0) / arc[arc.length - 1];
    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i += 1) {
      const j = i % points.length;
      if (j > first) uv.setY(i, v0 + arc[j - first] * k);
    }
    uv.needsUpdate = true;
    // Poured slush settles in uneven folds that coil loosely toward an off-centre crown, with soft lumps everywhere.
    const rand = mulberry(seed);
    const lean = new THREE.Vector2(rand() - 0.5, rand() - 0.5).multiplyScalar(0.16);
    const twist = rand() * Math.PI * 2;
    const pos = geo.attributes.position;
    const p = new THREE.Vector3();
    const dir = new THREE.Vector3();
    for (let i = 0; i < pos.count; i += 1) {
      p.fromBufferAttribute(pos, i);
      const k = smooth(shape.top, shape.top + 0.14, p.y);
      if (k <= 0) continue;
      const rad = Math.hypot(p.x, p.z);
      const ang = Math.atan2(p.z, p.x);
      const fold = Math.sin(ang + twist + (Math.PI * 2 * rad) / 0.27) * (0.6 + 0.4 * Math.sin(ang * 2 + twist));
      const lumps = Math.sin(3.1 * p.x + 1.7 * p.z + 6.3 * p.y) * 0.5
        + Math.sin(5.3 * p.z - 4.1 * p.x + 3.1 * p.y) * 0.32
        + Math.sin(11.7 * p.y + 9.1 * p.x - 8.9 * p.z) * 0.18;
      dir.set(p.x, (p.y - shape.top) * 0.9, p.z).normalize();
      p.addScaledVector(dir, (fold * 0.02 + lumps * 0.026) * k);
      const crown = k * k * (1 - rad / (rTop + 0.1));
      p.x += lean.x * crown;
      p.z += lean.y * crown;
      pos.setXYZ(i, p.x, p.y, p.z);
    }
    geo.computeVertexNormals();
  }
  return geo;
}

/** A slightly irregular ice cube: rounded edges, faces not quite flat. */
export function iceGeometry(seed: number) {
  const geo = new RoundedBoxGeometry(1, 1, 1, 3, 0.18);
  const rand = mulberry(seed);
  const pos = geo.attributes.position;
  const bumps = Array.from({ length: 3 }, () => [rand() * 6, rand() * 6, rand() * 6, 2 + rand() * 3] as const);
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    let n = 0;
    for (const [a, b, c, f] of bumps) n += Math.sin(f * x + a) * Math.sin(f * y + b) * Math.sin(f * z + c);
    const k = 1 + n * 0.03;
    pos.setXYZ(i, x * k, y * k, z * k);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Curved band just outside the wall that carries the printed logo, centred on phi = π.
 * A second UV set (uv1) is in cup space, so the wall's condensation maps line up on the print.
 */
export function decalGeometry(d: CupDims, y0: number, y1: number, arc: number) {
  const points: THREE.Vector2[] = [];
  for (let i = 0; i <= 32; i += 1) {
    const y = y0 + ((y1 - y0) * i) / 32;
    points.push(V(sideR(d, y) + 0.003, y));
  }
  const geo = lathe(points, 64, y0, y1, Math.PI - arc / 2, arc);
  const pos = geo.attributes.position;
  const uv1 = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i += 1) {
    const phi = Math.atan2(pos.getX(i), pos.getZ(i));
    uv1[i * 2] = (phi < 0 ? phi + Math.PI * 2 : phi) / (Math.PI * 2);
    uv1[i * 2 + 1] = pos.getY(i) / d.h;
  }
  geo.setAttribute('uv1', new THREE.BufferAttribute(uv1, 2));
  return geo;
}

/**
 * A dollop of whipped cream: a thick, soft rope wound about two and a half times, each fat
 * coil slumping onto the one below, rising to a pointed tip that leans over. Only gentle
 * folds run along it (no sharp nozzle ridges). Vertex colours carry the warm, peachy shading
 * cream has where it folds under, since light scatters inside it rather than going grey.
 */
export function whipGeometry(base: number, seed: number) {
  const rand = mulberry(seed);
  const turns = 2.35 + rand() * 0.25;
  const start = rand() * Math.PI * 2;
  const lean = rand() * Math.PI * 2;
  const R0 = 0.52;
  const N = 360;
  const pts: THREE.Vector3[] = [];
  const thick: number[] = [];
  const ph = [rand() * 6.3, rand() * 6.3, rand() * 6.3];
  let climb = 0;
  for (let i = 0; i <= N; i += 1) {
    const t = i / N;
    const turn = t * turns;
    const ang = start + turn * Math.PI * 2;
    const wobble = 1 + 0.06 * Math.sin(ang * 2 + ph[0]) + 0.03 * Math.sin(ang * 3 + ph[1]);
    const rad = R0 * (1 - t) ** 1.1 * wobble;
    // The first ring is laid nearly flat on the drink; every later turn rises about one rope
    // thickness, so each coil sits on the one below. The last stretch climbs into the tip,
    // which leans to one side.
    if (i) climb += (turns / N) * (0.1 + 0.25 * smooth(0.75, 1.1, turn));
    const tip = smooth(0.74, 1, t);
    const y = base + 0.05 + climb + 0.3 * tip ** 1.4 + 0.02 * Math.sin(ang * 1.3 + ph[2]);
    const bend = 0.16 * tip ** 2;
    pts.push(new THREE.Vector3(Math.cos(ang) * rad + Math.cos(lean) * bend, y, Math.sin(ang) * rad + Math.sin(lean) * bend));
    thick.push(0.27 * (1 - 0.4 * t) * (0.6 + 0.4 * smooth(0, 0.05, t)) * (1 - smooth(0.8, 1.02, t)) ** 0.55
      * (1 + 0.07 * Math.sin(ang * 3 + ph[1])));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const segs = 480;
  const radial = 48;
  const geo = new THREE.TubeGeometry(curve, segs, 1, radial, false);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Vector3();
  const v = new THREE.Vector3();
  for (let i = 0; i <= segs; i += 1) {
    const t = i / segs;
    curve.getPointAt(t, c);
    const k = Math.min(N, t * N);
    const k0 = Math.floor(k);
    const r = thick[k0] + (thick[Math.min(N, k0 + 1)] - thick[k0]) * (k - k0);
    for (let j = 0; j <= radial; j += 1) {
      const idx = i * (radial + 1) + j;
      v.fromBufferAttribute(pos, idx).sub(c);
      const a = (j / radial) * Math.PI * 2;
      // Soft folds where the cream creased leaving the nozzle, drifting round as it was piped.
      const fold = Math.cos(a * 5 + t * 7 + ph[0]);
      const crease = 1 - 0.05 * Math.max(0, fold) ** 6 + 0.025 * fold + 0.015 * Math.sin(a * 11 + i * 0.13);
      const down = Math.max(0, -v.y);
      v.multiplyScalar(r * crease);
      v.y *= v.y < 0 ? 0.6 : 0.9; // slumped onto the coil below
      pos.setXYZ(idx, c.x + v.x, c.y + v.y, c.z + v.z);
      const shade = 1 - 0.5 * down ** 1.1 - 0.1 * Math.max(0, fold) ** 6;
      colors[idx * 3] = 0.9 + 0.1 * shade;
      colors[idx * 3 + 1] = 0.78 + 0.22 * shade;
      colors[idx * 3 + 2] = 0.7 + 0.3 * shade;
    }
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

/** A gummy bear about one unit tall: belly, head, ears, arms and legs. */
export function gummyBearGeometry() {
  const part = (sx: number, sy: number, sz: number, x: number, y: number, z = 0) => {
    const g = new THREE.SphereGeometry(1, 14, 10);
    g.scale(sx, sy, sz);
    g.translate(x, y, z);
    return g;
  };
  const bear = mergeGeometries([
    part(0.3, 0.34, 0.22, 0, -0.08), part(0.25, 0.22, 0.2, 0, 0.3), part(0.08, 0.08, 0.07, -0.17, 0.47), part(0.08, 0.08, 0.07, 0.17, 0.47),
    part(0.1, 0.16, 0.1, -0.29, 0.02), part(0.1, 0.16, 0.1, 0.29, 0.02), part(0.13, 0.12, 0.12, -0.16, -0.38, 0.04), part(0.13, 0.12, 0.12, 0.16, -0.38, 0.04),
  ])!;
  bear.computeVertexNormals();
  return bear;
}

export function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
