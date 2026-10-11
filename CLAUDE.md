# Notes for assistants working on this site

Sip Society + Daiquiri Depot marketing site: React, Vite, TypeScript, Tailwind. `npm run dev` (port 3000),
`npm run lint` (TypeScript check), `npm run build`. README.md covers content upkeep, live Toast prices and an
overview of the 3D cups. Vercel deploys `main`. The owner reviews changes on an Android tablet in Chrome, so
check tablet and phone widths and touch behaviour, not just desktop hover.

## Owner's decisions (keep these unless the owner says otherwise)

- One cup design everywhere: the open, lidless clear 24 oz cup of the hero's first drink. Every item, party
  favors and empty cups included, uses it; only the contents change. No straws, no fruit garnishes.
- The cup print is the Sip Society + Daiquiri depot logo in black, one colour
  (`public/brand/cup-print.webp`, built by `scripts/build-cup-print.py`). The navbar and footer keep the
  full-colour logo.
- Realism is the bar. Past feedback: "the cups look fake", "the swirl patterns are too perfect", "fix the
  whipped topping". The whipped cream reference the owner chose is the Sketchfab model "Whipped Cream" by
  Suphanee: a soft dollop of fat, stacked coils rising to a leaning tip, no sharp nozzle ridges.
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
8. **Performance**: every spinning cup re-renders with a transmission pass, and each drink paints a
   1024 x 512 texture the first time it is seen. Profile on a mid-range Android before adding cost.

## Code map

- `src/cups/geometry.ts`: the cup (`cupGeometry`), drink volume and frozen heap (`liquidGeometry`), print
  band with a cup-space second UV set (`decalGeometry`), whipped cream (`whipGeometry`), ice, gummy bear.
- `src/cups/textures.ts`: `liquidTexture` (layers, swirls, slush, ice against the wall, drizzle,
  inclusions), `condensationMaps` (normal and roughness), slush and ice normal maps, `printTexture`.
- `src/cups/engine.ts`: the shared renderer, studio lighting, materials (`clearPlastic`, `drinkShading`),
  the spin (`advance`) and `build(spec)`, which assembles each drink.
- `src/data/drinks.ts`: which drink each hero item and menu item shows.
