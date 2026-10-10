/**
 * Describes one drink for the 3D cup renderer. Every field is optional except
 * `kind` and `colors`; sensible defaults come from the kind.
 */
export type CupKind =
  | 'frozen' // slushy daiquiri / smoothie heaped above the rim
  | 'latte' // iced coffee
  | 'boba' // milk tea with tapioca pearls
  | 'soda' // dirty soda / still drinks over ice
  | 'shot' // 2 oz souffle cup (jello shots, pickle shots, gummies)
  | 'empty'; // just the cup

export interface DrinkSpec {
  kind: CupKind;
  /** Drink colors, top to bottom. */
  colors: string[];
  /** Spiral the colors around the cup instead of stacking them in layers. */
  swirl?: boolean;
  /** Straw color. Omit for no straw. */
  straw?: string;
  whip?: boolean;
  ice?: boolean;
  strawberry?: boolean;
  /** Lime wheel on the rim. */
  lime?: boolean;
  pearls?: boolean;
  gummies?: boolean;
  /** Syrup or cream drizzled down the inside of the wall. */
  drizzle?: string;
  /** Surface detail painted into the drink. */
  inclusions?: 'bubbles' | 'fruit' | 'specks' | 'seeds';
  /** Glossy set gelatin instead of a liquid (jello shots). */
  jello?: boolean;
  /** Print the Sip Society + Daiquiri depot logo on the cup. Defaults to true for tall cups. */
  logo?: boolean;
}

export const specKey = (spec: DrinkSpec) => JSON.stringify(spec);
