export const flavorColors = {
  Strawberry: '#E8434F',
  'Piña Colada': '#F3E9D2',
  Peach: '#F6A35C',
  Margarita: '#B9D86A',
  Mango: '#F7C443',
  Octane: '#F28A2E',
  Hypnotic: '#4BA3D9',
  Hurricane: '#D8366F',
} as const;

export type Flavor = keyof typeof flavorColors;
export type MenuCategory = 'signatures' | 'classics' | 'cocktails' | 'extras';

export interface MenuItem {
  name: string;
  flavors?: Flavor[];
  category: MenuCategory;
  price: string;
  itemPath: string;
  description?: string;
  alcoholic?: boolean;
}

const signature = (name: string, flavors: Flavor[], itemPath: string): MenuItem => ({
  name, flavors, itemPath, category: 'signatures', price: 'Daiquiri sizes', alcoholic: true,
});

const classic = (name: string, flavors: Flavor[], itemPath: string): MenuItem => ({
  name, flavors, itemPath, category: 'classics', price: 'Daiquiri sizes', alcoholic: true,
});

export const daiquiriSizes = [
  ['16 oz', '$8.50'], ['24 oz', '$10.50'], ['32 oz', '$13.50'], ['½ gallon', '$22'],
  ['Gallon', '$40'], ['River Jug', '$18'], ['Refill', '$12'],
] as const;

export const addons = [
  ['Extra shot', '$1.50'], ['Chamoy', '$1.50'], ['Tajín', '$1.00'], ['Sangria swirl', '$3.00'],
  ['Big Red', '$2.00'], ['Boba', '$2.00'],
] as const;

export const menuItems: MenuItem[] = [
  signature('All American', ['Strawberry', 'Piña Colada', 'Hypnotic'], 'item-all-american_f1ba0da1-3582-400c-bdd6-73f46f9d4571'),
  signature('Bahama Mama', ['Hypnotic', 'Margarita', 'Peach'], 'item-bahama-mama_88ac7beb-008e-45ec-9ee2-55f93dd6d1ec'),
  signature('Cactus Juice', ['Peach', 'Margarita'], 'item-cactus-juice_586151c0-03e3-4a36-86d8-b4c8b9848824'),
  signature('Cotton Candy', ['Hypnotic', 'Piña Colada', 'Peach'], 'item-cotton-candy-daiquiri_50182f61-92eb-425d-ba43-af549a1609a4'),
  signature('Cyclone', ['Hurricane', 'Octane'], 'item-cyclone_fe7cc34f-5945-426e-a465-f25111ad42ac'),
  signature('Dreamsicle', ['Octane', 'Piña Colada'], 'item-dreamsicle-daiquiri_b252ce70-0ba9-48f4-a4a4-03fcc308b608'),
  signature('Gruene Rapids', ['Hypnotic', 'Margarita'], 'item-gruene-rapids_e50e461f-a09d-481b-96a9-3a59c64a1f90'),
  signature('Key Lime Pie', ['Margarita', 'Piña Colada'], 'item-key-lime-pie-daiquiri_e3268331-2319-48f8-b281-16fef5d29d09'),
  signature('Lazy River', ['Piña Colada', 'Hypnotic'], 'item-lazy-river_d86c6e40-1099-46c0-b7b2-86ceb4710942'),
  signature('Miami Vice', ['Piña Colada', 'Strawberry'], 'item-miami-vice_1b7ce939-a99b-4d10-9db5-67039258067a'),
  signature('NB Delight', ['Strawberry', 'Peach', 'Piña Colada'], 'item-nb-delight_bc303365-2510-47e8-af61-2f4c67d5e9c1'),
  signature('New Braunfels Sunset', ['Strawberry', 'Octane', 'Peach'], 'item-new-braunfels-sunset_6b6d9247-1f21-4b00-bd52-288a5cdf84ed'),
  signature('Perfect Storm', ['Strawberry', 'Peach', 'Hurricane'], 'item-perfect-strom_780eda81-70e1-445d-8570-cd626d615327'),
  signature('River Road', ['Strawberry', 'Hypnotic', 'Peach'], 'item-river-road_b810b74d-d5be-4e40-ac6a-d3ccf29dba21'),
  signature('Skittles', ['Mango', 'Peach', 'Strawberry', 'Hypnotic'], 'item-skittles_e08bb1e8-e2ac-41d1-9e6a-e46450c557bd'),
  signature('Southern Classic', ['Margarita', 'Octane', 'Hurricane'], 'item-southern-classic-daiquiri_71abd63b-4518-418c-9a2a-97f22b07f903'),
  signature('Sunburst', ['Mango', 'Strawberry'], 'item-sunburst_c0ebe7e3-e3a3-4640-b12a-3e2d95a4e138'),
  signature('Superman', ['Hurricane', 'Hypnotic'], 'item-superman_93cbb4fd-b5aa-4798-b314-8d38beca87d6'),
  signature('Sweet Magnolia', ['Piña Colada', 'Peach'], 'item-sweet-magnolia_d32f1027-6f71-4ece-b61d-170c7515bb1d'),
  signature('Texas Twist', ['Strawberry', 'Margarita'], 'item-texas-twist_774ff0ef-b950-4c4d-80a4-9fab514146d9'),
  signature('The Titan', ['Hurricane', 'Octane', 'Hypnotic'], 'item-the-titan_be07f368-323b-4dcb-b06b-9ccdb9435399'),

  classic('Margarita', ['Margarita'], 'item-margarita_06489410-d743-41aa-a8e9-ae3dafe97305'),
  classic('Strawberry', ['Strawberry'], 'item-strawberry-daiquiri_6265c05d-af59-4666-9690-586d7f8bc977'),
  classic('Piña Colada', ['Piña Colada'], 'item-pina-colada-daiquiri_3d186b5e-d521-47fe-ba2f-8245530059ad'),
  classic('Peach', ['Peach'], 'item-peach-daiquiri_f25eab33-2739-49ab-8ca6-e17387bcde5d'),
  classic('Mango', ['Mango'], 'item-mango-daiquiri_cf157963-59b7-4e31-993d-a6bfac4e0b33'),
  classic('Octane', ['Octane'], 'item-octane_94b805fd-913b-4a7d-bafe-da13240c421f'),
  classic('Hypnotic', ['Hypnotic'], 'item-hypnotic_b00bcc59-9f67-4427-9277-b935689c5d17'),
  classic('Hurricane', ['Hurricane'], 'item-hurricane_48f10907-d0cf-4c12-bc73-a2cb61c15df5'),
  classic('Build Your Own', [], 'item-build-your-own_1f404335-9bea-4bde-bda3-eac7deee3d38'),

  { name: 'Sangria', price: '$7.50', category: 'cocktails', itemPath: 'item-sangria_90ece0ea-86eb-4d43-ab4a-cae9a9306496', alcoholic: true, description: 'Red wine with blueberries, strawberries and peach.' },
  { name: 'Mimosa', price: '$7.50', category: 'cocktails', itemPath: 'item-mimosa_9d05b9a2-d6b0-4478-bc3a-6984b6c3ce19', alcoholic: true, description: 'Bubbly champagne and fresh orange juice.' },
  { name: 'Bloody Mary', price: '$8.50', category: 'cocktails', itemPath: 'item-bloody-mary_f25bca8b-5769-403f-bcf3-7227c1ee2ae4', alcoholic: true, description: 'Tomato juice with a kick of spices.' },
  { name: 'Frozen Espresso Martini', price: '$9.00', category: 'cocktails', itemPath: 'item-frozen-espresso-martini_8a0b9a13-2fc4-413d-aed9-ec440ca60c0e', alcoholic: true },
  { name: 'Frozen Jack & Coke', price: '$11.99', category: 'cocktails', itemPath: 'item-frozen-jack-coke_74894563-db7e-4e3c-8c5c-1c95433d77b8', alcoholic: true },

  { name: 'Pickle Shot', price: '$2.00', category: 'extras', itemPath: 'item-pickle-shot_9c0c1a15-b6b4-433c-ac7a-c0dac5bf3f9c', alcoholic: true, description: 'Party favor' },
  { name: 'Jello Shot', price: '$2.00', category: 'extras', itemPath: 'item-jello-shot_3318bc83-a4d9-4f65-a453-38546ffbb628', alcoholic: true, description: 'Party favor' },
  { name: 'Tipsy Bears', price: '$2.00', category: 'extras', itemPath: 'item-tipsy-bears_9a8e1663-eab4-4209-b32d-ab0ee6d432a8', alcoholic: true, description: 'Party favor' },
  { name: 'Gummy Bears', price: '$1.00', category: 'extras', itemPath: 'item-gummy-bears_c109461f-e825-4c09-af19-8ef439df6fcf' },
  { name: 'Water', price: '$3.00', category: 'extras', itemPath: 'item-water_68953f24-31aa-4ef5-a002-020b4fddfaa2' },
  { name: 'Extra Cup', price: '$0.50', category: 'extras', itemPath: 'item-extra-cup_2fb9f6a2-8edf-400c-b4c8-e595838ea8e7' },
  { name: 'Extra 32 oz set up', price: '$1.50', category: 'extras', itemPath: 'item-extra-32oz-set-up_6605c739-084b-4472-bce1-984f08c1aa24' },
  { name: 'Extra ½ gallon set up', price: '$2.00', category: 'extras', itemPath: 'item-extra-12-gallon-set-up_88b28708-9d73-4177-ade5-efbca030a797' },
  { name: 'Extra gallon set up', price: '$3.00', category: 'extras', itemPath: 'item-extra-gallon-set-up_feb939f1-e53b-459c-a6d6-6037b8f2ee49' },
];
