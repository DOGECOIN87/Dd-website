import * as THREE from 'three';

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
export const SHOT: CupDims = { h: 0.74, rTop: 0.62, rBot: 0.47, wall: 0.012 };

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
  return lathe(shell(outer, d.wall), 96, 0, h);
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

/** Drink volume following the inside of the wall, with a meniscus or a lumpy frozen mound. */
export function liquidGeometry(d: CupDims, shape: LiquidShape, vMax = LIQUID_VMAX) {
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
    const r0 = rTop - 0.035;
    for (let i = 1; i <= 24; i += 1) {
      const th = (i / 24) * (Math.PI / 2);
      points.push(V(Math.max(0, r0 * Math.cos(th)), shape.top + 0.01 + shape.mound * Math.sin(th)));
    }
  } else {
    points.push(V(rTop - 0.012, shape.top + 0.012), V(rTop - 0.05, shape.top + 0.016), V(rTop * 0.5, shape.top + 0.016), V(0, shape.top + 0.016));
  }
  const geo = lathe(points, 96, 0, vMax);
  if (shape.mound) {
    // Lumpy, scooped slush: displace the mound with a seamless 3D sum-of-sines field.
    const pos = geo.attributes.position;
    const p = new THREE.Vector3();
    for (let i = 0; i < pos.count; i += 1) {
      p.fromBufferAttribute(pos, i);
      const k = smooth(shape.top, shape.top + 0.12, p.y);
      if (k <= 0) continue;
      const n = Math.sin(3.1 * p.x + 1.7 * p.z + 6.3 * p.y) * 0.5
        + Math.sin(5.3 * p.z - 4.1 * p.x + 3.1 * p.y) * 0.32
        + Math.sin(9.7 * p.y + 7.1 * p.x - 6.9 * p.z) * 0.18;
      const dir = new THREE.Vector3(p.x, (p.y - shape.top) * 0.8, p.z).normalize();
      p.addScaledVector(dir, n * 0.045 * k);
      pos.setXYZ(i, p.x, p.y, p.z);
    }
    geo.computeVertexNormals();
  }
  return geo;
}

/** Curved band just outside the wall that carries the printed logo, centred on phi = π. */
export function decalGeometry(d: CupDims, y0: number, y1: number, arc: number) {
  const points: THREE.Vector2[] = [];
  for (let i = 0; i <= 24; i += 1) {
    const y = y0 + ((y1 - y0) * i) / 24;
    points.push(V(sideR(d, y) + 0.0035, y));
  }
  return lathe(points, 48, y0, y1, Math.PI - arc / 2, arc);
}

/** Piped whipped cream: a tapering conical helix with star-tip ridges, plus a filled core. */
export function whipGeometry(base: number) {
  const pts: THREE.Vector3[] = [];
  const N = 220;
  for (let i = 0; i <= N; i += 1) {
    const t = i / N;
    const ang = t * Math.PI * 2 * 3.1;
    const rad = 0.72 * (1 - t * 0.86);
    pts.push(new THREE.Vector3(Math.cos(ang) * rad, base + 0.13 + t * 0.5, Math.sin(ang) * rad));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const segs = 320;
  const radial = 24;
  const geo = new THREE.TubeGeometry(curve, segs, 0.16, radial, false);
  const pos = geo.attributes.position;
  const c = new THREE.Vector3();
  const v = new THREE.Vector3();
  for (let i = 0; i <= segs; i += 1) {
    const t = i / segs;
    curve.getPointAt(t, c);
    const taper = 1 - 0.55 * t;
    for (let j = 0; j <= radial; j += 1) {
      const idx = i * (radial + 1) + j;
      v.fromBufferAttribute(pos, idx).sub(c);
      const ridge = 1 + 0.16 * Math.cos((j / radial) * Math.PI * 2 * 8 + t * 18);
      v.multiplyScalar(taper * ridge);
      pos.setXYZ(idx, c.x + v.x, c.y + v.y, c.z + v.z);
    }
  }
  geo.computeVertexNormals();
  return geo;
}

/** Chocolate drizzle laid over the whipped cream. */
export function drizzleOverWhipGeometry(base: number, seed: number) {
  const rand = mulberry(seed);
  const surfaceY = (r: number) => base + 0.2 + 0.4 * Math.max(0, 1 - r / 0.76);
  const curves: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 4; k += 1) {
    const pts: THREE.Vector3[] = [];
    let ang = rand() * Math.PI * 2;
    for (let i = 0; i < 9; i += 1) {
      const r = i % 2 ? 0.08 + rand() * 0.15 : 0.5 + rand() * 0.22;
      ang += 0.5 + rand() * 0.5;
      pts.push(new THREE.Vector3(Math.cos(ang) * r, surfaceY(r), Math.sin(ang) * r));
    }
    curves.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 90, 0.024, 8, false));
  }
  return curves;
}

/** A strawberry: lathed heart profile with a calyx of flattened leaves. */
export function strawberryGeometry() {
  const profile = [V(0, -0.3), V(0.08, -0.28), V(0.17, -0.18), V(0.23, -0.04), V(0.25, 0.08), V(0.21, 0.18), V(0.11, 0.23), V(0, 0.22)];
  const body = new THREE.LatheGeometry(new THREE.SplineCurve(profile).getPoints(24), 32);
  const leaves: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 6; i += 1) {
    const leaf = new THREE.ConeGeometry(0.06, 0.2, 6);
    leaf.scale(1, 1, 0.25);
    leaf.rotateZ(-Math.PI / 2 + 0.35);
    leaf.translate(0.1, 0.23, 0);
    leaf.rotateY((i / 6) * Math.PI * 2);
    leaves.push(leaf);
  }
  return { body, leaves };
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
