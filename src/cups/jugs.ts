import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Half-gallon and gallon jugs. The gallon is "Milk 1 gallon jug from USA" by boost5u
 * (CC BY 4.0, credited in the site footer), slimmed by scripts/slim-gallon-glb.py into
 * public/models/gallon-jug.glb: metres, y up, origin at the centre of the base, handle at
 * the +x/+z corner. The half-gallon is derived from it: the same dairy-jug design with a
 * narrower body and a standard-size cap. Both get a modelled ribbed screw cap in place of
 * the scan's smooth one.
 */

/** Scene units per metre: a gallon jug stands about as tall as a cup with its topping. */
export const JUG_SCALE = 14.6;

export type JugSize = 'half-gallon' | 'gallon';

export interface Jug {
  /** The bottle up to the cap line. Its material clips at `capY`, so the neck ends in a clean ring. */
  body: THREE.BufferGeometry;
  /** Height of the cap's lower edge, in metres. */
  capY: number;
  /** The screw cap. */
  cap: THREE.BufferGeometry;
  /** The logo print, conformed to the side panel that faces -z (away from the handle). */
  print: THREE.BufferGeometry;
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Height where the gallon's cap begins (the neck ring sits just below it). */
const GALLON_CAP_Y = 0.2355;

/** Half-gallon from the gallon: the body narrows to 76.5 %, easing back to full width at the neck. */
const HALF = { width: 0.765, height: 0.97, neckFrom: 0.205, neckTo: 0.232 };

function halfGallon(gallon: THREE.BufferGeometry) {
  const geo = gallon.clone();
  const pos = geo.attributes.position;
  const nrm = geo.attributes.normal;
  const n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i += 1) {
    const y = pos.getY(i);
    const k = HALF.width + (1 - HALF.width) * smooth(HALF.neckFrom, HALF.neckTo, y);
    pos.setXYZ(i, pos.getX(i) * k, y * HALF.height, pos.getZ(i) * k);
    // Normals transform by the inverse scale.
    n.set(nrm.getX(i) / k, nrm.getY(i) / HALF.height, nrm.getZ(i) / k).normalize();
    nrm.setXYZ(i, n.x, n.y, n.z);
  }
  return geo;
}

/** Keeps the triangles that reach below the cap line (the scan's own cap is replaced). */
function belowCap(geo: THREE.BufferGeometry, capY: number) {
  const index = geo.index!;
  const pos = geo.attributes.position;
  const keep: number[] = [];
  for (let t = 0; t < index.count; t += 3) {
    const a = index.getX(t);
    const b = index.getX(t + 1);
    const c = index.getX(t + 2);
    if (Math.min(pos.getY(a), pos.getY(b), pos.getY(c)) < capY) keep.push(a, b, c);
  }
  const out = geo.clone();
  out.setIndex(keep);
  return out;
}

/**
 * A dairy-jug screw cap: a plain tamper band at the bottom, a groove, a knurled grip of 72
 * fine ribs, and a rounded edge onto a flat top. Built from just under `capY` (to hide the
 * seam) up to `top`, in metres.
 */
function capGeometry(capY: number, top: number) {
  const R = 0.0218;
  const y0 = capY - 0.0004;
  const h = top - y0;
  // [radius, fraction of the cap's height], bottom to top.
  const profile: [number, number][] = [
    [0.0196, 0], [R, 0.025], [R, 0.21], [R - 0.0008, 0.23], [R - 0.0008, 0.27], [R + 0.0001, 0.29], [R + 0.0001, 0.33],
    [R + 0.0001, 0.83], [R + 0.0001, 0.87], [R - 0.0003, 0.93], [R - 0.0012, 0.975], [R - 0.0026, 1], [0, 1],
  ];
  const geo = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y0 + y * h)), 432);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const y = (pos.getY(i) - y0) / h;
    const grip = smooth(0.3, 0.33, y) * (1 - smooth(0.83, 0.86, y));
    if (grip <= 0) continue;
    const k = 1 - 0.034 * grip * (0.5 + 0.5 * Math.cos(Math.atan2(pos.getX(i), pos.getZ(i)) * 72)) ** 1.5;
    pos.setXYZ(i, pos.getX(i) * k, pos.getY(i), pos.getZ(i) * k);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * A grid for the logo, laid on the outermost surface of the -z side panel: each vertex is
 * dropped onto the jug along z, so the print follows the panel's slight curve.
 */
function printOn(geo: THREE.BufferGeometry, width: number, midY: number, aspect: number) {
  const height = width / aspect;
  const grid = new THREE.PlaneGeometry(width, height, 40, 20);
  grid.rotateY(Math.PI); // face -z; u still runs left to right for someone looking at that side
  grid.translate(0, midY, 0);

  // Candidate triangles: on the -z side and facing it.
  const pos = geo.attributes.position;
  const index = geo.index!;
  const tris: number[][] = [];
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let t = 0; t < index.count; t += 3) {
    a.fromBufferAttribute(pos, index.getX(t));
    b.fromBufferAttribute(pos, index.getX(t + 1));
    c.fromBufferAttribute(pos, index.getX(t + 2));
    if ((a.z + b.z + c.z) / 3 > -0.02) continue;
    n.subVectors(b, a).cross(c.clone().sub(a)).normalize();
    if (Math.abs(n.z) < 0.3) continue;
    tris.push([a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z]);
  }
  const g = grid.attributes.position;
  for (let i = 0; i < g.count; i += 1) {
    const x = g.getX(i);
    const y = g.getY(i);
    let surface = 0;
    for (const [ax, ay, az, bx, by, bz, cx, cy, cz] of tris) {
      const d = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
      if (Math.abs(d) < 1e-12) continue;
      const w1 = ((by - cy) * (x - cx) + (cx - bx) * (y - cy)) / d;
      const w2 = ((cy - ay) * (x - cx) + (ax - cx) * (y - cy)) / d;
      const w3 = 1 - w1 - w2;
      if (w1 < -1e-6 || w2 < -1e-6 || w3 < -1e-6) continue;
      surface = Math.min(surface, w1 * az + w2 * bz + w3 * cz); // outermost = most negative z
    }
    g.setZ(i, surface - 0.0005);
  }
  grid.computeVertexNormals();
  return grid;
}

async function load(aspect: number) {
  const gltf = await new GLTFLoader().loadAsync('/models/gallon-jug.glb');
  let gallon: THREE.BufferGeometry | undefined;
  gltf.scene.traverse((o) => {
    if (!gallon && (o as THREE.Mesh).isMesh) gallon = (o as THREE.Mesh).geometry;
  });
  if (!gallon) throw new Error('gallon-jug.glb has no mesh');
  const half = halfGallon(gallon);
  gallon.computeBoundingBox();
  const top = gallon.boundingBox!.max.y;
  const halfCapY = GALLON_CAP_Y * HALF.height;
  const jugs: Record<JugSize, Jug> = {
    gallon: {
      body: belowCap(gallon, GALLON_CAP_Y), capY: GALLON_CAP_Y, cap: capGeometry(GALLON_CAP_Y, top),
      print: printOn(gallon, 0.1, 0.098, aspect),
    },
    'half-gallon': {
      body: belowCap(half, halfCapY), capY: halfCapY, cap: capGeometry(halfCapY, top * HALF.height),
      print: printOn(half, 0.078, 0.098 * HALF.height, aspect),
    },
  };
  return jugs;
}

let jugs: Promise<Record<JugSize, Jug>> | undefined;

/** Loads the jug model once (only when a jug is first shown) and returns both sizes. */
export function loadJugs(printAspect: number) {
  jugs ??= load(printAspect);
  return jugs;
}
