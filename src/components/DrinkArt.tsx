import type { CSSProperties } from 'react';
import { flavorColors, type Flavor } from '../data/menu';
import './drink-art.css';

/** Fallback liquid color when a drink has no flavors (matches the old LayeredCup fallback). */
const FALLBACK = '#CF6F56';

type CupVars = { '--c1': string; '--c2': string; '--c3': string };

function toVars(flavors: Flavor[] = []): CupVars {
  const colors = flavors.length ? flavors.map((flavor) => flavorColors[flavor]) : [FALLBACK, FALLBACK, FALLBACK];
  // 1 flavor -> all three vars that color; 2 flavors -> c1=first, c2=second, c3=first; 3+ -> first three.
  return { '--c1': colors[0], '--c2': colors[1] ?? colors[0], '--c3': colors[2] ?? colors[0] };
}

/**
 * Spinning PET-cup artwork. Pure-CSS 3D-style cup (flat snap lid, faceted
 * transparent walls, liquid with meniscus, condensation, bendy straw) with
 * turntable spin animations. Liquid colors come from --c1/--c2/--c3, mapped
 * from the drink's flavors via flavorColors.
 */
export function DrinkArt({ flavors = [] }: { flavors?: Flavor[] }) {
  return (
    <div
      className="dd-drink-art cup-flat"
      data-drink-art
      style={toVars(flavors) as CSSProperties}
      role="img"
      aria-label={flavors.length ? `${flavors.join(', ')} frozen drink` : 'Frozen drink'}
    >
      <span className="straw" />
      <span className="dome" />
      <span className="lid" />
      <span className="cup-body">
        <span className="frozen" />
        <span className="liquid-top" />
        <span className="ice" />
        <span className="facets" />
        <span className="condensation" />
        <span className="wall" />
      </span>
      <span className="rim" />
      <span className="base" />
    </div>
  );
}
