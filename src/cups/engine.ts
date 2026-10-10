import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {
  LIQUID_VMAX, SHOT, TALL, cupGeometry, decalGeometry, domeCrown, domeLidGeometry, drizzleOverWhipGeometry,
  flatLidGeometry, flatLidTop, liquidGeometry, mulberry, sideR, strawberryGeometry, whipGeometry,
  type CupDims, type LiquidShape,
} from './geometry';
import {
  condensationNormalMap, liquidTexture, logoTexture, luminance, shadowTexture, slushNormalMap, strawberryTexture,
} from './textures';
import { specKey, type DrinkSpec } from './types';

/**
 * One WebGL renderer draws every cup on the page. Each visible <canvas> gets
 * its cup rendered into a corner of the shared GL canvas, then copied across
 * with drawImage. This sidesteps the browser's cap on WebGL contexts, so the
 * menu can show dozens of live 3D cups.
 */

const TURN_SECONDS = 12; // one slow revolution every 12 s
const FRAME_MS = 1000 / 30;

interface Handle {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  key: string;
  spec: DrinkSpec;
  phase: number;
  visible: boolean;
  w: number;
  h: number;
  dirty: boolean;
}

/**
 * Makes MeshPhysicalMaterial behave like thin clear PET on a transparent canvas:
 * where nothing is behind the wall the plastic fades to a faint haze, while its
 * specular reflections (window streaks, droplet glints) stay fully bright.
 */
function clearPlastic(material: THREE.MeshPhysicalMaterial, haze: number) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uHaze = { value: haze };
    shader.fragmentShader = `uniform float uHaze;\n${shader.fragmentShader}`
      .replace('#include <transmission_fragment>', THREE.ShaderChunk.transmission_fragment.replace(
        'material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );',
        `float cover = clamp( ( transmitted.a - 0.5 ) * 2.0, 0.0, 1.0 );
        vec3 behind = clamp( ( transmitted.rgb - vec3( 1.0 - cover ) * 0.97 ) / max( cover, 1e-3 ), 0.0, 8.0 );
        transmitted.rgb = mix( vec3( 0.93, 0.96, 0.97 ), behind, smoothstep( 0.0, 0.25, cover ) );
        material.transmissionAlpha = mix( material.transmissionAlpha, max( cover, uHaze ), material.transmission );`,
      ))
      .replace('#include <opaque_fragment>', `
        #ifdef USE_TRANSMISSION
        diffuseColor.a *= material.transmissionAlpha;
        #endif
        float glint = clamp( dot( totalSpecular, vec3( 0.2126, 0.7152, 0.0722 ) ) * 2.2, 0.0, 1.0 );
        gl_FragColor = vec4( outgoingLight, max( diffuseColor.a, glint ) );`);
  };
  material.customProgramCacheKey = () => `clear-plastic-${haze}`;
  return material;
}

/** Product-photo studio: tall softboxes either side, a top light, and a pink accent card. */
function studioEnvironment(renderer: THREE.WebGLRenderer) {
  const env = new THREE.Scene();
  const basic = (color: THREE.ColorRepresentation, intensity: number) => {
    const m = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
    m.color.multiplyScalar(intensity);
    return m;
  };
  const room = new THREE.Mesh(new THREE.BoxGeometry(24, 14, 24), basic('#6d6870', 0.42));
  room.material.side = THREE.BackSide;
  env.add(room);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), basic('#d8cfc6', 0.55));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -6.9;
  env.add(floor);
  const panel = (w: number, h: number, color: THREE.ColorRepresentation, intensity: number, pos: [number, number, number]) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), basic(color, intensity));
    mesh.position.set(...pos);
    mesh.lookAt(0, 0, 0);
    env.add(mesh);
  };
  panel(2.6, 10, '#ffffff', 9, [-7.5, 1, 3.5]); // key softbox, front left
  panel(1.1, 10, '#ffffff', 6, [7.5, 1, 1.5]); // strip light, right
  panel(9, 6, '#ffffff', 2.4, [0, 6.9, 0]); // overhead
  panel(10, 7, '#fff6ee', 1.1, [0, 0, 11.5]); // soft fill behind camera
  panel(3, 8, '#ff7fb3', 2.2, [5, 0, -9]); // brand-pink accent behind the cup
  const pmrem = new THREE.PMREMGenerator(renderer);
  const target = pmrem.fromScene(env, 0.035);
  pmrem.dispose();
  return target.texture;
}

const hashString = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

class CupEngine {
  readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly cameras = new Map<string, THREE.PerspectiveCamera>();
  private readonly groups = new Map<string, THREE.Group>();
  private readonly queue: string[] = [];
  private building = false;
  private readonly handles = new Set<Handle>();
  private readonly byCanvas = new Map<Element, Handle>();
  private glW = 1;
  private glH = 1;
  private last = 0;
  /** Smoothed cost of drawing one frame of cups, used to back off on slow devices. */
  private cost = 0;
  private raf = 0;
  private reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  private readonly io: IntersectionObserver;
  private readonly ro: ResizeObserver;

  // Shared resources
  private readonly cupGeo = new Map<CupDims, THREE.BufferGeometry>();
  private readonly cupMat = new Map<string, THREE.MeshPhysicalMaterial>();
  private readonly lidMat: THREE.MeshPhysicalMaterial;
  private readonly slush = slushNormalMap();
  private readonly shadow: THREE.Mesh;
  private readonly logos = new Map<string, Promise<THREE.Texture>>();
  private strawberry?: THREE.Group;

  constructor() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(1);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.scene.environment = studioEnvironment(this.renderer);
    const key = new THREE.DirectionalLight('#ffffff', 1.7);
    key.position.set(-5, 7, 6);
    const rim = new THREE.DirectionalLight('#ffd9ea', 0.7);
    rim.position.set(4, 3, -6);
    this.scene.add(key, rim, new THREE.HemisphereLight('#ffffff', '#c9b9ad', 0.35));

    this.lidMat = clearPlastic(new THREE.MeshPhysicalMaterial({
      color: '#ffffff', roughness: 0.04, metalness: 0, transmission: 1, thickness: 0.12, ior: 1.57,
      envMapIntensity: 2.1, transparent: true, depthWrite: false,
    }), 0.1);

    const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false });
    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 2.5), shadowMat);
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.002;
    this.shadow.renderOrder = -1;

    this.io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const handle = this.byCanvas.get(entry.target);
        if (!handle) continue;
        handle.visible = entry.isIntersecting;
        handle.dirty = true;
        if (handle.visible) this.request(handle.key, handle.spec);
      }
      this.kick();
    }, { rootMargin: '120px' });
    this.ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const handle = this.byCanvas.get(entry.target);
        if (!handle) continue;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        handle.w = Math.max(1, Math.round(entry.contentRect.width * dpr));
        handle.h = Math.max(1, Math.round(entry.contentRect.height * dpr));
        handle.canvas.width = handle.w;
        handle.canvas.height = handle.h;
        handle.dirty = true;
      }
      this.kick();
    });
    this.reduced.addEventListener?.('change', () => this.markAllDirty());
  }

  mount(canvas: HTMLCanvasElement, spec: DrinkSpec) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return () => undefined;
    const key = specKey(spec);
    const handle: Handle = {
      canvas, ctx, key, spec, phase: Math.random() * Math.PI * 2, visible: false, w: 0, h: 0, dirty: true,
    };
    this.handles.add(handle);
    this.byCanvas.set(canvas, handle);
    this.io.observe(canvas);
    this.ro.observe(canvas);
    return () => {
      this.io.unobserve(canvas);
      this.ro.unobserve(canvas);
      this.byCanvas.delete(canvas);
      this.handles.delete(handle);
    };
  }

  private markAllDirty() {
    this.handles.forEach((h) => { h.dirty = true; });
    this.kick();
  }

  private request(key: string, spec: DrinkSpec) {
    if (this.groups.has(key) || this.queue.includes(key)) return;
    this.queue.push(key);
    this.pump(spec);
  }

  /** Builds queued drinks one at a time so texture painting never stalls a frame for long. */
  private pump(firstSpec?: DrinkSpec) {
    if (this.building || !this.queue.length) return;
    const key = this.queue[0];
    const spec = firstSpec && specKey(firstSpec) === key ? firstSpec : [...this.handles].find((h) => h.key === key)?.spec;
    if (!spec) {
      this.queue.shift();
      this.pump();
      return;
    }
    this.building = true;
    const run = () => this.build(spec).then((group) => {
      this.groups.set(key, group);
    }).catch((error) => {
      console.warn('Cup build failed', error);
    }).finally(() => {
      this.queue.shift();
      this.building = false;
      this.handles.forEach((h) => { if (h.key === key) h.dirty = true; });
      this.kick();
      this.pump();
    });
    if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 200 });
    else setTimeout(run, 16);
  }

  private kick() {
    if (!this.raf) this.raf = requestAnimationFrame(this.frame);
  }

  private frame = (now: number) => {
    this.raf = 0;
    const animate = !this.reduced.matches;
    // Never spend more than about a third of the main thread on cups: slow GPUs get fewer frames, not jank.
    const due = now - this.last >= Math.max(FRAME_MS - 2, this.cost * 3);
    let anyVisible = false;
    if (due || !animate) {
      if (due) this.last = now;
      const t = now / 1000;
      const start = performance.now();
      for (const handle of this.handles) {
        if (!handle.visible || !handle.w) continue;
        anyVisible = true;
        if (!animate && !handle.dirty) continue;
        if (this.draw(handle, animate ? t : 0)) handle.dirty = false;
      }
      this.cost = this.cost * 0.8 + (performance.now() - start) * 0.2;
    } else {
      anyVisible = [...this.handles].some((h) => h.visible);
    }
    if (animate && anyVisible) this.kick();
  };

  private camera(w: number, h: number) {
    const id = `${w}x${h}`;
    let cam = this.cameras.get(id);
    if (!cam) {
      cam = new THREE.PerspectiveCamera(20, w / h, 1, 60);
      cam.position.set(0, 3.55, 15);
      cam.lookAt(0, 2.2, 0);
      this.cameras.set(id, cam);
    }
    return cam;
  }

  private draw(handle: Handle, t: number) {
    const group = this.groups.get(handle.key);
    if (!group) return false;
    const { w, h } = handle;
    if (w > this.glW || h > this.glH) {
      this.glW = Math.max(this.glW, w);
      this.glH = Math.max(this.glH, h);
      this.renderer.setSize(this.glW, this.glH, false);
    }
    // Logo faces the viewer at rest; spinning starts from a random phase per cup.
    const spin = t ? handle.phase + (t / TURN_SECONDS) * Math.PI * 2 : -0.35;
    group.rotation.y = Math.PI + spin;
    this.scene.add(group);
    this.renderer.setViewport(0, 0, w, h);
    this.renderer.setScissor(0, 0, w, h);
    this.renderer.setScissorTest(true);
    this.renderer.render(this.scene, this.camera(w, h));
    this.scene.remove(group);
    handle.ctx.clearRect(0, 0, w, h);
    handle.ctx.drawImage(this.renderer.domElement, 0, this.glH - h, w, h, 0, 0, w, h);
    handle.canvas.dataset.ready = 'true';
    return true;
  }

  // ---------------------------------------------------------------- building

  /** `coldTop` is the drink line; condensation only forms below it. 0 = a dry, empty cup. */
  private cupMaterial(d: CupDims, coldTop: number) {
    const id = `${d.h}:${coldTop.toFixed(2)}`;
    let m = this.cupMat.get(id);
    if (!m) {
      const dry = coldTop <= 0;
      m = clearPlastic(new THREE.MeshPhysicalMaterial({
        color: '#ffffff', roughness: 0.07, metalness: 0, transmission: 1, thickness: 0.22, ior: 1.57,
        envMapIntensity: dry ? 1.9 : 1.3, normalMap: dry ? null : condensationNormalMap(d.h, coldTop),
        normalScale: new THREE.Vector2(1.1, 1.1), transparent: true, depthWrite: false,
      }), dry ? 0.12 : 0.06);
      this.cupMat.set(id, m);
    }
    return m;
  }

  private logo(ink: 'dark' | 'light') {
    let p = this.logos.get(ink);
    if (!p) {
      p = logoTexture(ink);
      this.logos.set(ink, p);
    }
    return p;
  }

  private strawberryMesh() {
    if (!this.strawberry) {
      const { body, leaves } = strawberryGeometry();
      const g = new THREE.Group();
      g.add(new THREE.Mesh(body, new THREE.MeshPhysicalMaterial({ map: strawberryTexture(), roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.25 })));
      const leafMat = new THREE.MeshStandardMaterial({ color: '#3f8a3a', roughness: 0.6 });
      leaves.forEach((leaf) => g.add(new THREE.Mesh(leaf, leafMat)));
      this.strawberry = g;
    }
    return this.strawberry.clone();
  }

  private async build(spec: DrinkSpec) {
    const shot = spec.kind === 'shot';
    const d = shot ? SHOT : TALL;
    const seed = hashString(specKey(spec));
    const rand = mulberry(seed);
    const group = new THREE.Group();
    const lid = spec.lid ?? (spec.kind === 'frozen' || spec.whip ? 'dome' : spec.kind === 'empty' ? 'none' : 'flat');

    let geo = this.cupGeo.get(d);
    if (!geo) {
      geo = cupGeometry(d);
      this.cupGeo.set(d, geo);
    }
    const shadow = this.shadow.clone();
    shadow.scale.setScalar(d.rTop / TALL.rTop);
    group.add(shadow);

    // The drink
    const shape: LiquidShape = (() => {
      switch (spec.kind) {
        case 'frozen': return { top: d.h - 0.08, mound: 0.42 };
        case 'latte': return { top: d.h - 0.12 };
        case 'boba': return { top: d.h - 0.18, pearlZone: 0.85 };
        case 'shot': return { top: d.h * 0.7 };
        default: return { top: d.h - 0.32 };
      }
    })();
    const vMax = shot ? d.h * 1.2 : LIQUID_VMAX;
    if (spec.kind !== 'empty' && !spec.gummies) {
      const finish = spec.kind === 'frozen'
        ? { roughness: 0.4, clearcoat: 0.45, clearcoatRoughness: 0.35, sheen: 0.5, sheenRoughness: 0.6, sheenColor: new THREE.Color('#ffffff'), normalMap: this.slush, normalScale: new THREE.Vector2(0.3, 0.3) }
        : spec.jello
          ? { roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.05 }
          : spec.kind === 'soda' || spec.kind === 'shot'
            ? { roughness: 0.14, clearcoat: 0.7, clearcoatRoughness: 0.1 }
            : { roughness: 0.32, clearcoat: 0.35, clearcoatRoughness: 0.3 };
      const material = new THREE.MeshPhysicalMaterial({ map: liquidTexture(spec, shape.top, seed, vMax), ...finish });
      group.add(new THREE.Mesh(liquidGeometry(d, shape, vMax), material));
    }

    if (spec.pearls) {
      const pearlGeo = new THREE.SphereGeometry(0.082, 18, 12);
      const pearlMat = new THREE.MeshPhysicalMaterial({ color: '#24140d', roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.08, sheen: 0.3, sheenColor: new THREE.Color('#7a5134') });
      const spots: THREE.Matrix4[] = [];
      for (let y = 0.19; y <= 0.86; y += 0.152) {
        const r = sideR(d, y) - d.wall - 0.012 - 0.088;
        const count = Math.floor((Math.PI * 2 * r) / 0.172);
        const offset = rand() * 6.28;
        for (let i = 0; i < count; i += 1) {
          const a = offset + (i / count) * Math.PI * 2 + (rand() - 0.5) * 0.08;
          const s = 0.92 + rand() * 0.14;
          spots.push(new THREE.Matrix4().compose(
            new THREE.Vector3(Math.cos(a) * r, y + (rand() - 0.5) * 0.03, Math.sin(a) * r),
            new THREE.Quaternion(), new THREE.Vector3(s, s, s),
          ));
        }
      }
      const pearls = new THREE.InstancedMesh(pearlGeo, pearlMat, spots.length);
      spots.forEach((m, i) => pearls.setMatrixAt(i, m));
      group.add(pearls);
    }

    if (spec.gummies) {
      const colors = ['#e8434f', '#f7c443', '#5fbf4a', '#f28a2e', '#f6f0e4', '#d8366f'];
      const geoG = new THREE.SphereGeometry(1, 16, 12);
      const matG = new THREE.MeshPhysicalMaterial({ roughness: 0.22, clearcoat: 0.8, clearcoatRoughness: 0.15, sheen: 0.4 });
      const n = 26;
      const gummies = new THREE.InstancedMesh(geoG, matG, n);
      for (let i = 0; i < n; i += 1) {
        const y = 0.12 + (i / n) * 0.42 + rand() * 0.05;
        const r = (sideR(d, y) - 0.15) * Math.sqrt(rand());
        const a = rand() * Math.PI * 2;
        const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rand() * 3, rand() * 3, rand() * 3));
        gummies.setMatrixAt(i, new THREE.Matrix4().compose(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r), q, new THREE.Vector3(0.1, 0.14, 0.08)));
        gummies.setColorAt(i, new THREE.Color(colors[i % colors.length]));
      }
      group.add(gummies);
    }

    if (spec.whip) {
      const cream = new THREE.MeshPhysicalMaterial({ color: '#fbf5ea', roughness: 0.62, sheen: 0.6, sheenRoughness: 0.5, sheenColor: new THREE.Color('#ffffff') });
      group.add(new THREE.Mesh(whipGeometry(shape.top), cream));
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.62, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), cream);
      core.scale.y = 0.55;
      core.position.y = shape.top + 0.02;
      group.add(core);
      const choc = new THREE.MeshPhysicalMaterial({ color: '#3a1a0d', roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.1 });
      drizzleOverWhipGeometry(shape.top, seed).forEach((g) => group.add(new THREE.Mesh(g, choc)));
    }

    if (spec.ice) {
      const iceGeo = new RoundedBoxGeometry(0.34, 0.34, 0.34, 3, 0.07);
      const iceMat = new THREE.MeshPhysicalMaterial({ color: '#e4f1f6', roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.4, normalMap: this.slush, normalScale: new THREE.Vector2(0.25, 0.25) });
      for (let i = 0; i < 6; i += 1) {
        const cube = new THREE.Mesh(iceGeo, iceMat);
        const a = (i / 6) * Math.PI * 2 + rand() * 0.5;
        const r = i === 5 ? 0.05 : 0.38 + rand() * 0.14;
        cube.position.set(Math.cos(a) * r, shape.top + 0.05 + rand() * 0.07, Math.sin(a) * r);
        cube.rotation.set(rand() * 0.6, rand() * 3, rand() * 0.6);
        group.add(cube);
      }
    }

    if (spec.strawberry) {
      const berry = this.strawberryMesh();
      const mound = shape.mound ?? 0;
      berry.position.set(-0.2, shape.top + mound * 0.8 + 0.1, 0.27);
      berry.rotation.set(0.35, 0.4, 1.05);
      berry.scale.setScalar(0.85);
      group.add(berry);
    }

    // The cup itself, with condensation below the drink line.
    const cold = spec.kind === 'empty' ? 0 : Math.min(shape.top, d.h - 0.2);
    group.add(new THREE.Mesh(geo, this.cupMaterial(d, cold)));

    if (lid !== 'none') {
      const lidGeo = lid === 'dome' ? domeLidGeometry(d) : flatLidGeometry(d, shot ? 0 : spec.pearls ? 0.14 : 0.09);
      group.add(new THREE.Mesh(lidGeo, this.lidMat));
    }

    if (spec.straw && !shot) {
      const radius = spec.pearls ? 0.12 : 0.07;
      const bottom = new THREE.Vector3(0.42, 0.24, 0);
      const apex = new THREE.Vector3(0, lid === 'dome' ? domeCrown(d) : lid === 'flat' ? flatLidTop(d) : d.h + 0.2, 0);
      if (lid === 'none') apex.x = -0.1;
      const dir = apex.clone().sub(bottom);
      const length = dir.length() + 0.95;
      dir.normalize();
      const strawGeo = new THREE.CylinderGeometry(radius, radius, length, 24, 1, true);
      const strawMat = new THREE.MeshPhysicalMaterial({ color: spec.straw, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.2, side: THREE.DoubleSide });
      const straw = new THREE.Mesh(strawGeo, strawMat);
      straw.position.copy(bottom).addScaledVector(dir, length / 2);
      straw.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      group.add(straw);
    }

    if ((spec.logo ?? !shot) && !shot) {
      const mid = spec.colors[Math.floor(spec.colors.length / 2)] ?? '#ffffff';
      const ink = spec.kind !== 'empty' && luminance(mid) < 0.3 ? 'light' : 'dark';
      const map = await this.logo(ink);
      const decal = new THREE.Mesh(
        decalGeometry(d, 1.12, 2.24, 1.27 / sideR(d, 1.68)),
        new THREE.MeshStandardMaterial({ map, transparent: true, roughness: 0.42, depthWrite: false }),
      );
      group.add(decal);
    }

    if (shot) {
      group.scale.setScalar(2.2);
      group.position.y = 1.05;
    }
    return group;
  }
}

let engine: CupEngine | null | undefined;

function getEngine() {
  if (engine === undefined) {
    try {
      engine = new CupEngine();
    } catch (error) {
      console.warn('3D cups unavailable', error);
      engine = null;
    }
  }
  return engine;
}

/** Starts rendering `spec` into `canvas`. Returns a cleanup function, or null if WebGL is unavailable. */
export function mountCup(canvas: HTMLCanvasElement, spec: DrinkSpec) {
  const e = getEngine();
  return e ? e.mount(canvas, spec) : null;
}
