# Notes for assistants working on this site

Sip Society + Daiquiri Depot marketing site: React, Vite, TypeScript, Tailwind. `npm run dev` (port 3000),
`npm run lint` (TypeScript check), `npm run build`. README.md covers content upkeep, live Toast prices and an
overview of the 3D cups. Vercel deploys `main`. The owner reviews changes on an Android tablet in Chrome, so
check tablet and phone widths and touch behaviour, not just desktop hover.

## Owner's decisions (keep these unless the owner says otherwise)

- One cup design everywhere: the open, lidless clear 24 oz cup of the hero's first drink. Every item, empty
  cups included, uses it (except the shot cup below); only the contents change. No straws, no fruit garnishes.
  Every drink fills the cup to the brim, as the frozen daiquiris do. The owner rejected cups with an empty
  band of plastic under the rim. The frozen drinks' cups mist below `COLD_TOP` (`engine.ts`) with beads of
  condensation; every other drink's cup looks like the water cup, as the owner asked: an even, smooth mist
  up to the rim with no beads, so no speckles and no thick ring show at the top. Keep
  each drink's own contents (whipped cream, pearls, ice, drizzle): the owner said not to change them.
  Empty cups stay dry, since misted plastic makes them nearly invisible. Ice never rises above the rim: coloured iced
  drinks (dirty soda, sangria, Bloody Mary) fill to the brim like the rest, their ice showing against
  the wall; only the water sits a little lower, with three cubes floating under the rim.
- The one exception: Pickle Shot, Jello Shot, Tipsy Bears and Gummy Bears come in the small, wide shot cup
  (`container: 'shot'` in `drinks.ts`, `SHOT` in `geometry.ts`), with no print and the shots filled about two
  thirds. This is the older design the owner had; moving the shots into the tall cup was never their
  instruction, so don't change it without asking.
- The jugs (`src/cups/jugs.ts`): half-gallon and gallon, the same clear plastic as the cups (the owner chose
  clear over milky), a blue ribbed screw cap from the owner's reference, and the black print. Filled to the
  neck for the "½ Gallon Jug" and "Gallon Jug" menu cards, empty for the set-up extras. The gallon model is
  CC BY 4.0 (boost5u): keep the footer credit.
- The cup print is the Sip Society + Daiquiri depot logo in black, one colour
  (`public/brand/cup-print.webp`, built by `scripts/build-cup-print.py`). The navbar and footer keep the
  full-colour logo.
- Realism is the bar. Past feedback: "the cups look fake", "the swirl patterns are too perfect", "fix the
  whipped topping". The whipped cream reference the owner chose is the Sketchfab model "Whipped Cream" by
  Suphanee: a soft dollop of fat, stacked coils rising to a leaning tip, no sharp nozzle ridges.
- Highest render quality (owner's request): cups draw at the screen's full pixel density (up to 3x) and
  2x supersampled, scaled down smoothly (`SUPERSAMPLE`, `MAX_RENDER_PIXELS` in `engine.ts`). Spinning cups
  drop to plain resolution only while frames run over budget, and are redrawn sharp when they stop. Empty
  cups and jugs get a soft grey edge (`outline` in `clearPlastic`) so they show on the cream menu cards.
- Hover spin: a cup spins while its card is hovered or focused (on touch screens, while it is on screen),
  then finishes its turn and settles with the print facing front.
- Images: only ones the owner has approved; avoid AI-generated imagery. The FM 306 drive-thru photo was
  supplied by the owner and colour-graded with `scripts/grade-photo.py` to fit the palette.

## Looking at the cups

- `npm run dev`, then open `/tools/cup-lab.html?set=hero` (query options are documented in
  `tools/cup-lab.ts`) to see cups large.
- Headless render from the cloud container:
  `PLAYWRIGHT_MODULE="$(npm root -g)/playwright/index.mjs" node tools/render-cups.mjs out.png "set=hero&only=0&w=620&h=1000"`.
  `tools/spin-check.mjs` captures the hover spin on the real page.
- The container renders WebGL in software: 10 to 60 seconds per render, and animation timing in headless
  runs is not real. Judge appearance from renders and motion on a real device.
- Start the dev server with a long background timeout, or it is stopped after 30 minutes.

## Where to continue on the drink designs (most visible first)

1. **Frozen tops** (`liquidGeometry` mound in `geometry.ts`; the heap rows, `t < 0`, in `liquidTexture`):
   still a little smooth and rubbery at hero size. Try stronger granular relief only on the heap (a
   separate detail normal map), wet glints, and a less regular fold silhouette. Compare with
   `public/photos/layered-daiquiris.webp`, a real photo of their daiquiris.
2. **Coffee** (hero item 2): the syrup streaks inside the wall (`spec.drizzle` in `liquidTexture`) read as
   even vertical stripes. Make them organic: varying width, thinning, branching, pooling at the bottom.
   The whipped cream shape matches the reference; it could use warmer, peachy shading in the creases.
3. **Dirty soda** (hero item 4): the cream shows only as a beige line at the top. Real dirty sodas show
   clouds of cream folding into the cola; paint those plumes for soda drinks with a light drizzle.
4. **Boba** (hero item 3): the taro tea is a flat lavender. Add a milky gradient and brown-sugar streaks
   down the wall; the pearls (material in `engine.ts`) could be slightly more translucent.
5. **Condensation** (`condensationMaps` in `textures.ts`, `uFrost` in `clearPlastic` in `engine.ts`):
   balanced on light drinks; on dark drinks the beads can read as speckles. Try fewer tiny beads and
   brighter glints there.
6. **Menu size** (cups are 82 x 132 CSS px in menu cards): check layers and swirls still read at that
   size. The print becomes a dark smudge there; the owner wants the same cup everywhere, so ask before
   changing the print for small sizes.
7. **Print on dark drinks** (dirty soda, Frozen Jack & Coke): black ink is low contrast, as on a real
   cup. Ask the owner before adding an outline or a white underprint.
8. **Performance**: every spinning cup re-renders with a transmission pass (2x supersampled while the
   device keeps up), and each drink paints a 1024 x 512 texture the first time it is seen. Each render
   size keeps its own transmission target, so keep the motion levels to two. Profile on a mid-range
   Android before adding cost; larger liquid textures would sharpen the hero cups further.

## Code map

- `src/cups/geometry.ts`: the cup (`cupGeometry`), drink volume and frozen heap (`liquidGeometry`), print
  band with a cup-space second UV set (`decalGeometry`), whipped cream (`whipGeometry`), ice, gummy bear.
- `src/cups/textures.ts`: `liquidTexture` (layers, swirls, slush, ice against the wall, drizzle,
  inclusions), `condensationMaps` (normal and roughness), slush and ice normal maps, `printTexture`.
- `src/cups/engine.ts`: the shared renderer, studio lighting, materials (`clearPlastic`, `drinkShading`),
  the spin (`advance`) and `build(spec)`, which assembles each drink.
- `src/data/drinks.ts`: which drink each hero item and menu item shows.
