// Dev-only page for looking at cups large: /tools/cup-lab.html?set=hero
// Query: set=hero|ice|shot (which drinks), only=<index> (one of them), w, h (CSS px per cup).
import { mountCup } from '../src/cups/engine';
import { lineup } from '../src/data/drinks';
import type { DrinkSpec } from '../src/cups/types';

const q = new URLSearchParams(location.search);
const sets: Record<string, DrinkSpec[]> = {
  hero: lineup.map((d) => d.spec),
  ice: [
    { kind: 'soda', colors: ['#e6f3f8'], ice: true, clear: true },
    { kind: 'soda', colors: ['#4a2614', '#331a0d', '#26130a'], drizzle: '#e8d2b4', ice: true },
    { kind: 'soda', colors: ['#7d1631', '#5e0f26'], ice: true },
    { kind: 'empty', colors: [] },
  ],
  shot: [
    { kind: 'soda', colors: ['#c3cc63', '#aeb84f'], container: 'shot' },
    { kind: 'soda', colors: ['#e8434f', '#d32f3f'], jello: true, container: 'shot' },
  ],
};
let specs = sets[q.get('set') ?? 'hero'] ?? sets.hero;
if (q.has('only')) specs = [specs[Number(q.get('only'))]];
const w = Number(q.get('w') ?? 300);
const h = Number(q.get('h') ?? 484);
const grid = document.getElementById('grid')!;
const controls = specs.map((spec) => {
  const c = document.createElement('canvas');
  c.style.width = `${w}px`;
  c.style.height = `${h}px`;
  grid.append(c);
  return mountCup(c, spec);
});
(window as unknown as { spin: (on: boolean) => void }).spin = (on) => controls.forEach((k) => k?.setActive(on));
