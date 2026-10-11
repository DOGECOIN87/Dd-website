import * as THREE from 'three';
import {
  LIQUID_VMAX, SHOT, TALL, cupGeometry, decalGeometry, gummyBearGeometry, iceGeometry, liquidGeometry,
  mulberry, sideR, sideTop, whipGeometry,
  type CupDims, type LiquidShape,
} from './geometry';
import { JUG_SCALE, loadJugs, type JugSize } from './jugs';
import { condensationMaps, iceNormalMap, liquidTexture, printTexture, shadowTexture, slushNormalMap } from './textures';
import { specKey, type DrinkSpec } from './types';

/**
 * One WebGL renderer draws every cup on the page. Each visible <canvas> gets
 * its cup rendered into a corner of the shared GL canvas, then copied across
 * with drawImage. This sidesteps the browser's cap on WebGL contexts, so the
 * menu can show dozens of live 3D cups.
 */

const TAU = Math.PI * 2;
const TURN_SECONDS = 5; // one revolution every 5 s while hovered or selected
const SPIN_SPEED = TAU / TURN_SECONDS;
const SPIN_UP = SPIN_SPEED / 0.5; // reaches full speed in half a second
const GLIDE = 0.9; // radians: the last stretch of a turn eases out to the front
const MIN_GLIDE = 0.2; // closer than this to the front and the cup goes round once more rather than braking hard
const REST_ANGLE = -0.18; // the print faces the viewer, turned just enough to read as round
const FRAME_FAST = 1000 / 60; // one or two cups spinning
const FRAME_SLOW = 1000 / 30; // a phone with a screenful of spinning cups

/** Camera: a product shot from slightly above the rim, framed to the cup now that drinks have no straws. */
const CAMERA_FOV = 17.5;
const CAMERA_TARGET_Y = 1.78;
const CAMERA_ELEVATION = THREE.MathUtils.degToRad(8);
const CAMERA_DISTANCE = 15;

/** The print: about 100° of the wall, centred a little above half height. */
const PRINT_WIDTH = 1.42;
const PRINT_MID_Y = 1.5;

/** Condensation mists every drink's cup up to here, just under the rim, as on the frozen daiquiri's cup. */
const COLD_TOP = TALL.h - 0.2;

interface Glide {
  from: number;
  dist: number;
  t: number;
  duration: number;
}

interface Handle {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  key: string;
  spec: DrinkSpec;
  /** Hovered, focused or on screen on a phone: the cup spins while true. */
  active: boolean;
  /** 0 = at rest with the print facing front. */
  angle: number;
  velocity: number;
  /** Set once the cup has been let go and is easing into the front. */
  glide: Glide | null;
  visible: boolean;
  w: number;
  h: number;
  dirty: boolean;
}

/**
 * Makes MeshPhysicalMaterial behave like clear plastic (or ice, or water) on a
 * transparent canvas: where nothing is behind it the material fades to a faint
 * haze, while its reflections (softbox streaks, droplet glints) stay bright.
 * Rough areas of the surface (condensation mist) also fog what is behind them.
 */
function clearPlastic(material: THREE.MeshPhysicalMaterial, haze: number, frost = 0, edge = 0) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uHaze = { value: haze };
    shader.uniforms.uFrost = { value: frost };
    shader.uniforms.uEdge = { value: edge };
    shader.fragmentShader = `uniform float uHaze;\nuniform float uFrost;\nuniform float uEdge;\n${shader.fragmentShader}`
      .replace('#include <transmission_fragment>', THREE.ShaderChunk.transmission_fragment.replace(
        'material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );',
        `float cover = clamp( ( transmitted.a - 0.5 ) * 2.0, 0.0, 1.0 );
        vec3 behind = clamp( ( transmitted.rgb - vec3( 1.0 - cover ) * 0.97 ) / max( cover, 1e-3 ), 0.0, 8.0 );
        transmitted.rgb = mix( vec3( 0.93, 0.96, 0.97 ), behind, smoothstep( 0.0, 0.25, cover ) );
        float mist = uFrost * smoothstep( 0.06, 0.1, material.roughness );
        transmitted.rgb = mix( transmitted.rgb, vec3( 0.95, 0.965, 0.975 ), mist );
        transmitted.rgb *= 1.0 - uEdge * pow( 1.0 - clamp( dot( normal, normalize( vViewPosition ) ), 0.0, 1.0 ), 2.0 );
        material.transmissionAlpha = mix( material.transmissionAlpha, max( cover, uHaze + mist * 0.35 ), material.transmission );`,
      ))
      .replace('#include <opaque_fragment>', `
        #ifdef USE_TRANSMISSION
        diffuseColor.a *= material.transmissionAlpha;
        #endif
        float glint = clamp( dot( totalSpecular, vec3( 0.2126, 0.7152, 0.0722 ) ) * 2.2, 0.0, 1.0 );
        gl_FragColor = vec4( outgoingLight, max( diffuseColor.a, glint ) );`);
  };
  material.customProgramCacheKey = () => 'clear-plastic';
  return material;
}

/**
 * Drinks seen through a wall look deeper and richer toward the cup's edges,
 * where the light travels through more of them, rather than evenly painted.
 */
function drinkShading(material: THREE.MeshPhysicalMaterial, depth: number) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uDepth = { value: depth };
    shader.fragmentShader = `uniform float uDepth;\n${shader.fragmentShader}`.replace('#include <opaque_fragment>', `
      float facing = clamp( dot( geometryNormal, geometryViewDir ), 0.0, 1.0 );
      outgoingLight = mix( outgoingLight, outgoingLight * diffuseColor.rgb * 1.2, pow( 1.0 - facing, 1.5 ) * uDepth );
      #include <opaque_fragment>`);
  };
  material.customProgramCacheKey = () => 'drink';
  return material;
}

/**
 * Product-photo studio: a tall softbox front left and a strip light right give the
 * long highlights you see on a real plastic cup, two narrow back strips outline
 * the clear wall against the background, and a top light catches the rim.
 */
function studioEnvironment(renderer: THREE.WebGLRenderer) {
  const env = new THREE.Scene();
  const basic = (color: THREE.ColorRepresentation, intensity: number) => {
    const m = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
    m.color.multiplyScalar(intensity);
    return m;
  };
  const room = new THREE.Mesh(new THREE.BoxGeometry(24, 14, 24), basic('#7c767c', 0.5));
  room.material.side = THREE.BackSide;
  env.add(room);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), basic('#e2d9d2', 0.6));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -6.9;
  env.add(floor);
  const panel = (w: number, h: number, color: THREE.ColorRepresentation, intensity: number, pos: [number, number, number]) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), basic(color, intensity));
    mesh.position.set(...pos);
    mesh.lookAt(0, 0, 0);
    env.add(mesh);
  };
  panel(3, 10, '#ffffff', 8, [-7.5, 1, 4]); // key softbox, front left
  panel(0.9, 10, '#ffffff', 6.5, [7.5, 1, 2]); // strip light, right
  panel(0.7, 10, '#ffffff', 4, [-6, 1, -6]); // back strips: edge definition on both sides
  panel(0.7, 10, '#ffffff', 4, [6, 1, -6]);
  panel(9, 6, '#ffffff', 2.2, [0, 6.9, 0]); // overhead
  panel(10, 7, '#fff6f2', 1, [0, 0, 11.5]); // soft fill behind camera
  panel(4, 8, '#ffe9f1', 0.9, [0, 0, -9]); // warm card behind the cup
  const pmrem = new THREE.PMREMGenerator(renderer);
  const target = pmrem.fromScene(env, 0.03);
  pmrem.dispose();
  return target.texture;
}

const hashString = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

interface Condensation {
  normal: THREE.Texture;
  roughness: THREE.Texture;
}

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
  /** Cups that turned last frame. */
  private spinning = 0;
  private raf = 0;
  private reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  private readonly io: IntersectionObserver;
  private readonly ro: ResizeObserver;

  // Shared resources
  private readonly cupGeo = new Map<CupDims, THREE.BufferGeometry>();
  private readonly cupMat = new Map<string, THREE.MeshPhysicalMaterial>();
  private readonly condensation = new Map<string, Condensation>();
  private readonly printMat = new Map<string, THREE.MeshPhysicalMaterial>();
  private readonly slush = slushNormalMap();
  /** The same fine relief, run along the piped whipped cream. */
  private readonly creamGrain = (() => {
    const t = this.slush.clone();
    t.repeat.set(48, 6);
    return t;
  })();
  private readonly shadow: THREE.Mesh;
  private print?: Promise<{ map: THREE.Texture; aspect: number }>;
  private ice?: { geos: THREE.BufferGeometry[]; mat: THREE.MeshPhysicalMaterial };
  private readonly jugMats = new Map<string, THREE.Material[]>();

  constructor() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(1);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.localClippingEnabled = true; // jug necks end at the cap line via a clipping plane
    this.scene.environment = studioEnvironment(this.renderer);
    const key = new THREE.DirectionalLight('#ffffff', 1.6);
    key.position.set(-5, 7, 6);
    const rim = new THREE.DirectionalLight('#fff0f4', 0.6);
    rim.position.set(4, 3, -6);
    this.scene.add(key, rim, new THREE.HemisphereLight('#ffffff', '#c9b9ad', 0.4));

    const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false });
    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), shadowMat);
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

  mount(canvas: HTMLCanvasElement, spec: DrinkSpec): CupControls {
    const ctx = canvas.getContext('2d');
    if (!ctx) return { dispose: () => undefined, setActive: () => undefined };
    const key = specKey(spec);
    const handle: Handle = {
      canvas, ctx, key, spec, active: false, angle: 0, velocity: 0, glide: null, visible: false, w: 0, h: 0, dirty: true,
    };
    this.handles.add(handle);
    this.byCanvas.set(canvas, handle);
    this.io.observe(canvas);
    this.ro.observe(canvas);
    return {
      dispose: () => {
        this.io.unobserve(canvas);
        this.ro.unobserve(canvas);
        this.byCanvas.delete(canvas);
        this.handles.delete(handle);
      },
      setActive: (active: boolean) => {
        if (handle.active === active) return;
        handle.active = active;
        this.kick();
      },
    };
  }

  /**
   * Turns a cup by `dt` seconds. While active it spins up to speed and keeps turning.
   * Let go, it finishes its turn: it carries on round and, over the last stretch,
   * eases out to rest with the print facing front. Returns true if it moved.
   */
  private advance(h: Handle, dt: number): boolean {
    if (this.reduced.matches) {
      const moved = h.angle !== 0;
      h.angle = 0;
      h.velocity = 0;
      h.glide = null;
      return moved;
    }
    if (h.active) {
      h.glide = null;
      h.velocity = Math.min(SPIN_SPEED, h.velocity + SPIN_UP * dt);
      h.angle = (h.angle + h.velocity * dt) % TAU;
      return h.velocity > 0;
    }
    if (h.glide) {
      const g = h.glide;
      g.t = Math.min(g.duration, g.t + dt);
      const s = g.t / g.duration;
      // Cubic ease-out: starts at the cup's own speed, lands with no jolt.
      h.angle = g.from + g.dist * (1 - (1 - s) ** 3);
      h.velocity = (3 * g.dist * (1 - s) ** 2) / g.duration;
      if (s >= 1) {
        h.angle = 0;
        h.velocity = 0;
        h.glide = null;
      }
      return true;
    }
    if (h.angle === 0) {
      h.velocity = 0;
      return false;
    }
    let remaining = TAU - h.angle;
    if (remaining < MIN_GLIDE) remaining += TAU;
    if (remaining <= GLIDE) {
      const speed = Math.max(h.velocity, SPIN_SPEED * 0.5);
      h.glide = { from: h.angle, dist: remaining, t: 0, duration: (3 * remaining) / speed };
      return this.advance(h, dt);
    }
    h.velocity = Math.min(SPIN_SPEED, h.velocity + SPIN_UP * dt);
    h.angle = (h.angle + h.velocity * dt) % TAU;
    return true;
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
    // Never spend more than about a third of the main thread on cups: slow GPUs get fewer frames, not jank.
    const interval = Math.max(this.spinning > 2 ? FRAME_SLOW : FRAME_FAST, this.cost * 3);
    if (now - this.last < interval - 2) {
      this.kick();
      return;
    }
    // Advance by the real time elapsed, so a throttled cup still turns at the right speed.
    const dt = this.last ? Math.min(0.5, (now - this.last) / 1000) : 0;
    this.last = now;
    const start = performance.now();
    let busy = false;
    let spinning = 0;
    for (const handle of this.handles) {
      const turned = this.advance(handle, dt);
      if (turned || handle.active) busy = true;
      if (!handle.visible || !handle.w) continue;
      if (turned) spinning += 1;
      if ((turned || handle.dirty) && this.draw(handle)) handle.dirty = false;
      if (handle.dirty) busy = true; // still waiting for its drink to finish building
    }
    this.spinning = spinning;
    this.cost = this.cost * 0.8 + (performance.now() - start) * 0.2;
    // Idle when nothing is spinning: still cups cost nothing after their first frame.
    if (busy) this.kick();
    else this.last = 0;
  };

  private camera(w: number, h: number) {
    const id = `${w}x${h}`;
    let cam = this.cameras.get(id);
    if (!cam) {
      cam = new THREE.PerspectiveCamera(CAMERA_FOV, w / h, 1, 60);
      cam.position.set(0, CAMERA_TARGET_Y + Math.tan(CAMERA_ELEVATION) * CAMERA_DISTANCE, CAMERA_DISTANCE);
      cam.lookAt(0, CAMERA_TARGET_Y, 0);
      this.cameras.set(id, cam);
    }
    return cam;
  }

  private draw(handle: Handle) {
    const group = this.groups.get(handle.key);
    if (!group) return false;
    const { w, h } = handle;
    if (w > this.glW || h > this.glH) {
      this.glW = Math.max(this.glW, w);
      this.glH = Math.max(this.glH, h);
      this.renderer.setSize(this.glW, this.glH, false);
    }
    group.rotation.y = Math.PI + REST_ANGLE + handle.angle;
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

  /** Condensation maps for a cup whose drink line (cold area) ends at `coldTop`; `beads` off is an even mist. */
  private condensationFor(d: CupDims, coldTop: number, beads: boolean) {
    const id = `${d.h}:${coldTop.toFixed(2)}:${beads}`;
    let c = this.condensation.get(id);
    if (!c) {
      c = condensationMaps(d.h, coldTop, undefined, beads);
      this.condensation.set(id, c);
    }
    return c;
  }

  /** `coldTop` is the drink line; condensation only forms below it. 0 = a dry, empty cup. */
  private cupMaterial(d: CupDims, coldTop: number, beads = true) {
    const id = `${d.h}:${coldTop.toFixed(2)}:${beads}`;
    let m = this.cupMat.get(id);
    if (!m) {
      const wet = coldTop > 0 ? this.condensationFor(d, coldTop, beads) : null;
      m = clearPlastic(new THREE.MeshPhysicalMaterial({
        color: '#ffffff', metalness: 0, transmission: 1, thickness: 0.2, ior: 1.57,
        roughness: wet ? 1 : 0.05, roughnessMap: wet?.roughness ?? null,
        normalMap: wet?.normal ?? null, normalScale: new THREE.Vector2(0.9, 0.9),
        envMapIntensity: wet ? 1.15 : 1.7, transparent: true, depthWrite: false,
      }), wet ? 0.06 : 0.12, wet ? 0.06 : 0, wet ? 0 : 0.35);
      this.cupMat.set(id, m);
    }
    return m;
  }

  /**
   * Black one-colour print, on the outside of the wall: under the same condensation
   * as the plastic around it. On a see-through cup it shows, reversed, through the back.
   */
  private async printMaterial(d: CupDims, coldTop: number, seeThrough: boolean, beads = true) {
    const id = `${d.h}:${coldTop.toFixed(2)}:${seeThrough}:${beads}`;
    this.print ??= printTexture();
    const { map, aspect } = await this.print;
    let m = this.printMat.get(id);
    if (!m) {
      const wet = coldTop > 0 ? this.condensationFor(d, coldTop, beads) : null;
      const onPrint = (t: THREE.Texture) => {
        const c = t.clone();
        c.channel = 1;
        return c;
      };
      m = new THREE.MeshPhysicalMaterial({
        map, transparent: true, depthWrite: false, metalness: 0,
        roughness: wet ? 1.4 : 0.4, roughnessMap: wet ? onPrint(wet.roughness) : null,
        normalMap: wet ? onPrint(wet.normal) : null, normalScale: new THREE.Vector2(0.9, 0.9),
        side: seeThrough ? THREE.DoubleSide : THREE.FrontSide,
      });
      this.printMat.set(id, m);
    }
    return { material: m, aspect };
  }

  private iceKit() {
    if (!this.ice) {
      const mat = clearPlastic(new THREE.MeshPhysicalMaterial({
        color: '#ffffff', roughness: 0.14, transmission: 1, thickness: 0.35, ior: 1.31, envMapIntensity: 1.8,
        normalMap: iceNormalMap(), normalScale: new THREE.Vector2(0.6, 0.6), transparent: true, depthWrite: false,
      }), 0.45, 0.3, 0.6);
      this.ice = { geos: [1, 2, 3, 4].map(iceGeometry), mat };
    }
    return this.ice;
  }

  /**
   * Jug plastic (the clear plastic of an empty cup, with the thinner wall of a jug, so it
   * hardly bends what is behind it), clipped at the cap line `capY` (scene units) so the neck
   * ends cleanly under the cap; and the blue screw cap.
   */
  private jugMaterials(capY: number) {
    const id = capY.toFixed(4);
    let mats = this.jugMats.get(id);
    if (!mats) {
      mats = [
        clearPlastic(new THREE.MeshPhysicalMaterial({
          // three.js scales refraction thickness by the object's scale; the jug is scaled from metres.
          color: '#ffffff', metalness: 0, transmission: 1, thickness: 0.03 / JUG_SCALE, ior: 1.57, roughness: 0.05, envMapIntensity: 1.7,
          transparent: true, depthWrite: false, clippingPlanes: [new THREE.Plane(new THREE.Vector3(0, -1, 0), capY)],
        }), 0.12, 0, 0.35),
        new THREE.MeshPhysicalMaterial({ color: '#3a7fd2', roughness: 0.36, clearcoat: 0.35, clearcoatRoughness: 0.3 }),
      ];
      this.jugMats.set(id, mats);
    }
    return mats;
  }

  /** An empty, capped half-gallon or gallon jug with the print on the panel facing the viewer. */
  /** The drink's surface finish: wet, crystalline slush for frozen drinks, glossy for the rest. */
  private drinkMaterial(spec: DrinkSpec, map: THREE.Texture, clip?: THREE.Plane) {
    const finish = spec.kind === 'frozen'
      ? { roughness: 0.48, clearcoat: 0.55, clearcoatRoughness: 0.22, sheen: 0.5, sheenRoughness: 0.55, sheenColor: new THREE.Color('#ffffff'), normalMap: this.slush, normalScale: new THREE.Vector2(0.2, 0.2) }
      : spec.jello
        ? { roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.05 }
        : spec.kind === 'soda'
          ? { roughness: 0.14, clearcoat: 0.7, clearcoatRoughness: 0.1 }
          : { roughness: 0.32, clearcoat: 0.35, clearcoatRoughness: 0.3 };
    return drinkShading(
      new THREE.MeshPhysicalMaterial({ map, ...finish, clippingPlanes: clip ? [clip] : null }),
      spec.kind === 'frozen' ? 0.5 : 0.35,
    );
  }

  /**
   * A capped half-gallon or gallon jug with the print on the panel facing the viewer: empty
   * for the set-up items, or filled to the neck with the drink.
   */
  private async buildJug(spec: DrinkSpec, size: JugSize) {
    this.print ??= printTexture();
    const { aspect } = await this.print;
    const jug = (await loadJugs(aspect))[size];
    const filled = spec.kind !== 'empty' && spec.colors.length > 0;
    const group = new THREE.Group();
    const shadow = this.shadow.clone();
    shadow.scale.setScalar(size === 'gallon' ? 1.2 : 0.95);
    if (!filled) {
      shadow.material = (shadow.material as THREE.MeshBasicMaterial).clone();
      (shadow.material as THREE.MeshBasicMaterial).opacity = 0.45; // light passes through an empty clear jug
    }
    group.add(shadow);
    const jugGroup = new THREE.Group();
    jugGroup.scale.setScalar(JUG_SCALE);
    const [plastic, capMaterial] = this.jugMaterials(jug.capY * JUG_SCALE);
    jugGroup.add(new THREE.Mesh(jug.body, plastic), new THREE.Mesh(jug.cap, capMaterial));
    if (filled) {
      const fill = jug.fillY * JUG_SCALE;
      const map = liquidTexture(spec, fill, hashString(specKey(spec)), LIQUID_VMAX);
      const drink = this.drinkMaterial(spec, map, new THREE.Plane(new THREE.Vector3(0, -1, 0), fill));
      jugGroup.add(new THREE.Mesh(jug.drink, drink), new THREE.Mesh(jug.drinkTop, drink));
    }
    const { material } = await this.printMaterial(TALL, 0, !filled);
    jugGroup.add(new THREE.Mesh(jug.print, material));
    group.add(jugGroup);
    return group;
  }

  private async build(spec: DrinkSpec) {
    if (spec.container === 'half-gallon' || spec.container === 'gallon') return this.buildJug(spec, spec.container);
    // Every drink comes in the same cup; only what is inside changes. Gummy bears come in the small
    // shot cup the owner had before (no print).
    const shot = !!spec.gummies;
    const d = shot ? SHOT : TALL;
    const seed = hashString(specKey(spec));
    const rand = mulberry(seed);
    const group = new THREE.Group();

    let geo = this.cupGeo.get(d);
    if (!geo) {
      geo = cupGeometry(d);
      this.cupGeo.set(d, geo);
    }
    const shadow = this.shadow.clone();
    if ((spec.kind === 'empty' && !shot) || spec.clear) {
      // Light passes through a clear cup: its shadow is faint.
      shadow.material = (shadow.material as THREE.MeshBasicMaterial).clone();
      (shadow.material as THREE.MeshBasicMaterial).opacity = 0.45;
    }
    group.add(shadow);

    // The drink. Every cup is filled to the brim, like the frozen daiquiris, so no empty band of cup
    // shows under the rim; only what is inside differs.
    const shape: LiquidShape = (() => {
      switch (spec.kind) {
        case 'frozen': return { top: d.h - 0.08, mound: 0.38 };
        case 'boba': return { top: d.h - 0.05, pearlZone: 0.85 };
        // Iced drinks sit a little lower, so the floating cubes show without rising above the rim.
        default: return spec.ice ? { top: d.h - 0.09, dome: 0.016 } : { top: d.h - 0.05 };
      }
    })();
    const vMax = LIQUID_VMAX;
    if (spec.clear) {
      const water = clearPlastic(new THREE.MeshPhysicalMaterial({
        color: spec.colors[0] ?? '#eef7fb', roughness: 0.03, transmission: 1, thickness: 1.4, ior: 1.33,
        attenuationColor: new THREE.Color('#cfe9f2'), attenuationDistance: 4, transparent: true, depthWrite: false,
      }), 0.015);
      group.add(new THREE.Mesh(liquidGeometry(d, shape, vMax, seed), water));
    } else if (spec.kind !== 'empty' && !spec.gummies) {
      const material = this.drinkMaterial(spec, liquidTexture(spec, shape.top, seed, vMax));
      group.add(new THREE.Mesh(liquidGeometry(d, shape, vMax, seed), material));
    }

    if (spec.pearls) {
      const pearlGeo = new THREE.SphereGeometry(0.082, 18, 12);
      // Tapioca: dark brown, softly glossy and a little translucent (a warm sheen at the edges), not mirror-black.
      const pearlMat = new THREE.MeshPhysicalMaterial({
        color: '#2e1609', roughness: 0.38, clearcoat: 0.45, clearcoatRoughness: 0.25, envMapIntensity: 0.55,
        sheen: 0.6, sheenRoughness: 0.5, sheenColor: new THREE.Color('#5a2f17'),
      });
      const spots: THREE.Matrix4[] = [];
      for (let y = 0.19; y <= 0.86; y += 0.152) {
        const r = sideR(d, y) - d.wall - 0.012 - 0.088;
        const count = Math.floor((Math.PI * 2 * r) / 0.172);
        const offset = rand() * 6.28;
        for (let i = 0; i < count; i += 1) {
          const a = offset + (i / count) * Math.PI * 2 + (rand() - 0.5) * 0.1;
          const s = 0.86 + rand() * 0.22;
          spots.push(new THREE.Matrix4().compose(
            new THREE.Vector3(Math.cos(a) * r, y + (rand() - 0.5) * 0.04, Math.sin(a) * r),
            new THREE.Quaternion().setFromEuler(new THREE.Euler(rand() * 3, rand() * 3, 0)), new THREE.Vector3(s, s * (0.92 + rand() * 0.1), s),
          ));
        }
      }
      const pearls = new THREE.InstancedMesh(pearlGeo, pearlMat, spots.length);
      spots.forEach((m, i) => pearls.setMatrixAt(i, m));
      group.add(pearls);
    }

    if (spec.gummies) {
      const colors = ['#e8434f', '#f7c443', '#5fbf4a', '#f28a2e', '#f6f0e4', '#d8366f'];
      const matG = new THREE.MeshPhysicalMaterial({ roughness: 0.22, clearcoat: 0.8, clearcoatRoughness: 0.15, sheen: 0.4, sheenRoughness: 0.4 });
      const n = 22;
      const gummies = new THREE.InstancedMesh(gummyBearGeometry(), matG, n);
      for (let i = 0; i < n; i += 1) {
        const y = 0.12 + (i / n) * 0.42 + rand() * 0.05;
        const r = (sideR(d, y) - 0.15) * Math.sqrt(rand());
        const a = rand() * Math.PI * 2;
        const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rand() * 3, rand() * 3, rand() * 3));
        gummies.setMatrixAt(i, new THREE.Matrix4().compose(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r), q, new THREE.Vector3(0.24, 0.24, 0.24)));
        gummies.setColorAt(i, new THREE.Color(colors[i % colors.length]));
      }
      group.add(gummies);
    }

    if (spec.whip) {
      const whipMat = new THREE.MeshPhysicalMaterial({
        color: '#fffaf2', vertexColors: true, roughness: 0.5, sheen: 0.45, sheenRoughness: 0.5, sheenColor: new THREE.Color('#fff4ea'),
        normalMap: this.creamGrain, normalScale: new THREE.Vector2(0.06, 0.06),
      });
      group.add(new THREE.Mesh(whipGeometry(shape.top, seed), whipMat));
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshPhysicalMaterial({ color: '#f3e6d6', roughness: 0.6 }),
      );
      core.scale.y = 1.6;
      core.position.y = shape.top - 0.06;
      group.add(core);
    }

    if (spec.ice) {
      // A few cubes floating at the surface, loosely spread, each with its highest corner just under
      // the rim: never above it.
      const { geos, mat } = this.iceKit();
      const box = new THREE.Box3();
      for (let i = 0; i < 3; i += 1) {
        const a = (i / 3) * Math.PI * 2 + (rand() - 0.5) * 0.6;
        const r = 0.42 + rand() * 0.16;
        const cube = new THREE.Mesh(geos[i % geos.length], mat);
        cube.scale.set(0.3 + rand() * 0.07, 0.27 + rand() * 0.07, 0.3 + rand() * 0.07);
        cube.rotation.set((rand() - 0.5) * 0.5, rand() * 3, (rand() - 0.5) * 0.5);
        cube.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
        box.setFromObject(cube);
        cube.position.y = d.h - 0.005 - rand() * 0.02 - box.max.y;
        group.add(cube);
      }
      // In a clear drink you can see the rest of the ice packed below the surface.
      for (let i = 0; spec.clear && i < 14; i += 1) {
        const y = 0.35 + (i / 14) * (shape.top - 0.6) + rand() * 0.1;
        const a = rand() * Math.PI * 2;
        const r = (sideR(d, y) - 0.3) * Math.sqrt(rand());
        const cube = new THREE.Mesh(geos[i % geos.length], mat);
        cube.scale.set(0.3 + rand() * 0.06, 0.27 + rand() * 0.06, 0.3 + rand() * 0.06);
        cube.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
        cube.rotation.set(rand() * 3, rand() * 3, rand() * 3);
        group.add(cube);
      }
    }

    // The cup itself. The frozen drinks' cups mist below `COLD_TOP` with beads of condensation. The other
    // drinks' cups look like the water's: an even, smooth mist right up to the rim, no beads, so no clear
    // band or speckles show at the top. An empty cup stays dry; the shot cup keeps the light mist it had before.
    const beverage = !shot && spec.kind !== 'frozen' && spec.kind !== 'empty';
    const cold = shot ? d.h * 0.7 : spec.kind === 'empty' ? 0 : beverage ? sideTop(d) : COLD_TOP;
    group.add(new THREE.Mesh(geo, this.cupMaterial(d, cold, !beverage)));

    if (spec.logo ?? !shot) {
      const { material, aspect } = await this.printMaterial(d, cold, spec.kind === 'empty' || !!spec.clear, !beverage);
      const height = PRINT_WIDTH / aspect;
      const decal = new THREE.Mesh(
        decalGeometry(d, PRINT_MID_Y - height / 2, PRINT_MID_Y + height / 2, PRINT_WIDTH / sideR(d, PRINT_MID_Y)),
        material,
      );
      group.add(decal);
    }

    if (shot) {
      group.scale.setScalar(1.65);
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

export interface CupControls {
  dispose: () => void;
  setActive: (active: boolean) => void;
}

/** Starts rendering `spec` into `canvas`. Returns its controls, or null if WebGL is unavailable. */
export function mountCup(canvas: HTMLCanvasElement, spec: DrinkSpec): CupControls | null {
  const e = getEngine();
  return e ? e.mount(canvas, spec) : null;
}
