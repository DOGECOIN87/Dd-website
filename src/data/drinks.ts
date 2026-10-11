import type { DrinkSpec } from '../cups/types';
import { flavorColors, type MenuItem } from './menu';

/** The hero lineup, left to right: one cup for each thing we pour. */
export const lineup: { name: string; detail: string; spec: DrinkSpec }[] = [
  {
    name: 'Frozen Daiquiris',
    detail: 'Layered, swirled or straight up. 16 oz to a full gallon.',
    spec: { kind: 'frozen', colors: ['#e8434f', '#f7c443', '#3f9fdc'] },
  },
  {
    name: 'Gourmet Coffee',
    detail: 'Texas Artisan Roasters espresso, iced, with all the drizzle.',
    spec: { kind: 'frozen', colors: ['#dcbc96', '#c39466', '#8f6140'] },
  },
  {
    name: 'Boba',
    detail: 'Milk teas with chewy tapioca pearls, or add boba to any daiquiri.',
    spec: { kind: 'frozen', colors: ['#d4b8e6', '#bc9bd4', '#a886c6'] },
  },
  {
    name: 'Dirty Sodas',
    detail: 'Your soda plus cream, syrups and a squeeze of something good.',
    spec: { kind: 'frozen', colors: ['#e3c9a8', '#5a2f18', '#3a1d0e'] },
  },
  {
    name: 'Smoothies',
    detail: 'Frozen fruit, no alcohol, made for the whole crew.',
    spec: { kind: 'frozen', colors: ['#f592a8', '#ef7d97'], inclusions: 'seeds' },
  },
];

const cocktails: Record<string, DrinkSpec> = {
  Sangria: { kind: 'frozen', colors: ['#8a1c38', '#5e0f26'] },
  Mimosa: { kind: 'frozen', colors: ['#f8bf47', '#f6a93a'] },
  'Bloody Mary': { kind: 'frozen', colors: ['#b72a20', '#9c2219'], inclusions: 'specks' },
  'Frozen Espresso Martini': { kind: 'frozen', colors: ['#d9bc98', '#8a5a36', '#5a3520'] },
  'Frozen Jack & Coke': { kind: 'frozen', colors: ['#6b3a20', '#4a2614'] },
};

const extras: Record<string, DrinkSpec> = {
  'Pickle Shot': { kind: 'frozen', colors: ['#c3cc63', '#aeb84f'] },
  'Jello Shot': { kind: 'frozen', colors: ['#e8434f', '#d32f3f'] },
  'Tipsy Bears': { kind: 'empty', colors: [], gummies: true },
  'Gummy Bears': { kind: 'empty', colors: [], gummies: true },
  Water: { kind: 'frozen', colors: ['#f1f7fa', '#e2eef4'] }, // a cup heaped with crushed ice
  'Extra Cup': { kind: 'empty', colors: [] },
  'Extra ½ gallon set up': { kind: 'empty', colors: [], container: 'half-gallon' },
  'Extra gallon set up': { kind: 'empty', colors: [], container: 'gallon' },
};

/** The take-home jugs, filled: the half-gallon like the shop's own (strawberry over piña colada). */
const jugs: Record<string, DrinkSpec> = {
  '½ Gallon Jug': { kind: 'frozen', colors: [flavorColors.Strawberry, flavorColors['Piña Colada']], container: 'half-gallon' },
  'Gallon Jug': { kind: 'frozen', colors: ['#e8434f', '#f7c443', '#3f9fdc'], container: 'gallon' },
};

/** Picks the cup, colours and toppings that represent a menu item. */
export function specForItem(item: MenuItem): DrinkSpec {
  if (jugs[item.name]) return jugs[item.name];
  if (cocktails[item.name]) return cocktails[item.name];
  if (extras[item.name]) return extras[item.name];
  if (item.category === 'extras') return { kind: 'empty', colors: [] };
  const colors = item.flavors?.length
    ? item.flavors.map((flavor) => flavorColors[flavor])
    : [flavorColors.Strawberry, flavorColors.Mango, flavorColors.Margarita, flavorColors.Hypnotic];
  return { kind: 'frozen', colors, swirl: colors.length === 2 };
}
