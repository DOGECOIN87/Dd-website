/**
 * Describes one drink for the 3D cup renderer. Every drink is shown in the same clear
 * 24 oz cup (or, for the jug set-ups, a half-gallon or gallon jug); only what is inside changes. Every field is optional except `kind` and
 * `colors`; sensible defaults come from the kind.
 */
export type CupKind =
  | 'frozen' // every drink: frozen, filled to the rim and heaped above it
  | 'empty'; // just the cup (or a cup of gummy bears, or an empty jug)

export interface DrinkSpec {
  kind: CupKind;
  /** The container: the standard cup unless this is a jug. A jug with no colours is shown empty. */
  container?: 'cup' | 'half-gallon' | 'gallon';
  /** Drink colors, top to bottom. */
  colors: string[];
  /** Spiral the colors around the cup instead of stacking them in layers. */
  swirl?: boolean;
  gummies?: boolean;
  /** Surface detail painted into the drink. */
  inclusions?: 'specks' | 'seeds';
  /** Print the Sip Society + Daiquiri depot logo on the cup. Defaults to true. */
  logo?: boolean;
}

export const specKey = (spec: DrinkSpec) => JSON.stringify(spec);
