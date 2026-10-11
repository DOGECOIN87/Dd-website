/**
 * Describes one drink for the 3D cup renderer. Every drink is shown in the same clear
 * 24 oz cup; only what is inside changes. Every field is optional except `kind` and
 * `colors`; sensible defaults come from the kind.
 */
export type CupKind =
  | 'frozen' // slushy daiquiri / smoothie heaped above the rim
  | 'latte' // iced coffee
  | 'boba' // milk tea with tapioca pearls
  | 'soda' // dirty soda / still drinks over ice, pickle and jello shots
  | 'empty'; // just the cup (or a cup of gummy bears)

export interface DrinkSpec {
  kind: CupKind;
  /** Drink colors, top to bottom. */
  colors: string[];
  /** Spiral the colors around the cup instead of stacking them in layers. */
  swirl?: boolean;
  whip?: boolean;
  ice?: boolean;
  pearls?: boolean;
  gummies?: boolean;
  /** Syrup or cream drizzled down the inside of the wall. */
  drizzle?: string;
  /** Surface detail painted into the drink. */
  inclusions?: 'bubbles' | 'specks' | 'seeds';
  /** A clear drink you can see through (water). */
  clear?: boolean;
  /** Glossy set gelatin instead of a liquid (jello shots). */
  jello?: boolean;
  /** Print the Sip Society + Daiquiri depot logo on the cup. Defaults to true. */
  logo?: boolean;
}

export const specKey = (spec: DrinkSpec) => JSON.stringify(spec);
