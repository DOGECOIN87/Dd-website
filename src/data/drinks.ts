import type { DrinkSpec } from '../cups/types';
import { flavorColors, type MenuItem } from './menu';

export const STRAW_PINK = '#ec4f93';
const STRAW_BLACK = '#1d1a1c';

/** The "Everything Sip" lineup from the shop's poster, left to right. */
export const lineup: { name: string; detail: string; spec: DrinkSpec }[] = [
  {
    name: 'Frozen Daiquiris',
    detail: 'Layered, swirled or straight up. 16 oz to a full gallon.',
    spec: { kind: 'frozen', colors: ['#e8434f', '#f7c443', '#3f9fdc'], straw: STRAW_PINK, strawberry: true },
  },
  {
    name: 'Gourmet Coffee',
    detail: 'Texas Artisan Roasters espresso, iced, with all the drizzle.',
    spec: { kind: 'latte', colors: ['#d8b48c', '#c39466', '#a9784c'], drizzle: '#3b1d10', whip: true, straw: STRAW_PINK },
  },
  {
    name: 'Boba',
    detail: 'Milk teas with chewy tapioca pearls, or add boba to any daiquiri.',
    spec: { kind: 'boba', colors: ['#cdb0e0', '#bc9bd4', '#b18ccc'], pearls: true, straw: STRAW_PINK },
  },
  {
    name: 'Dirty Sodas',
    detail: 'Your soda plus cream, syrups and a squeeze of something good.',
    spec: { kind: 'soda', colors: ['#4a2614', '#331a0d', '#26130a'], drizzle: '#e8d2b4', ice: true, straw: STRAW_BLACK },
  },
  {
    name: 'Smoothies',
    detail: 'Frozen fruit, no alcohol, made for the whole crew.',
    spec: { kind: 'frozen', colors: ['#f592a8', '#ef7d97'], inclusions: 'seeds', straw: STRAW_PINK, strawberry: true },
  },
];

const cocktails: Record<string, DrinkSpec> = {
  Sangria: { kind: 'soda', colors: ['#7d1631', '#5e0f26'], inclusions: 'fruit', ice: true, straw: STRAW_PINK },
  Mimosa: { kind: 'soda', colors: ['#f8bf47', '#f6a93a'], inclusions: 'bubbles', straw: STRAW_PINK },
  'Bloody Mary': { kind: 'soda', colors: ['#b72a20', '#9c2219'], inclusions: 'specks', ice: true, straw: STRAW_BLACK },
  'Frozen Espresso Martini': { kind: 'frozen', colors: ['#d9bc98', '#8a5a36', '#5a3520'], straw: STRAW_BLACK },
  'Frozen Jack & Coke': { kind: 'frozen', colors: ['#6b3a20', '#4a2614'], straw: STRAW_BLACK },
};

const extras: Record<string, DrinkSpec> = {
  'Pickle Shot': { kind: 'shot', colors: ['#c3cc63', '#aeb84f'] },
  'Jello Shot': { kind: 'shot', colors: ['#e8434f', '#d32f3f'], jello: true },
  'Tipsy Bears': { kind: 'shot', colors: [], gummies: true },
  'Gummy Bears': { kind: 'shot', colors: [], gummies: true },
  Water: { kind: 'soda', colors: ['#dcebf2', '#cfe3ec'], ice: true, straw: STRAW_PINK, logo: true },
  'Extra Cup': { kind: 'empty', colors: [], lid: 'none' },
};

/** Picks the cup, lid, colours and toppings that represent a menu item. */
export function specForItem(item: MenuItem): DrinkSpec {
  if (cocktails[item.name]) return cocktails[item.name];
  if (extras[item.name]) return extras[item.name];
  if (item.category === 'extras') return { kind: 'empty', colors: [], lid: 'dome', straw: STRAW_PINK };
  const colors = item.flavors?.length
    ? item.flavors.map((flavor) => flavorColors[flavor])
    : [flavorColors.Strawberry, flavorColors.Mango, flavorColors.Margarita, flavorColors.Hypnotic];
  return { kind: 'frozen', colors, swirl: colors.length === 2, straw: STRAW_PINK };
}
