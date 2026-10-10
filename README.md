# Sip Society + Daiquiri Depot

Marketing site for Sip Society + Daiquiri Depot and The Backyard in Gruene, built with React, Vite, TypeScript, and Tailwind CSS.

## Run locally

```bash
npm install
npm run dev
```

The local site runs at `http://localhost:3000`. Use `npm run lint` for a TypeScript check and `npm run build` for a production build.

## Content maintenance

- Update online-ordering URLs, contact details, social profiles, loyalty rewards, and ratings in `src/data/site.ts`.
- Update both locations' addresses, published hours, features, and map coordinates in `src/data/locations.ts`. Hours are stored in Central time, with Sunday at index 0.
- Update menu items, prices, flavors, and Toast item deep-link paths in `src/data/menu.ts`. Every menu order button uses that item's Toast link.

Toast ordering deliberately opens on Toast rather than inside the site: Toast blocks framing with `X-Frame-Options`. It currently supports FM 306 only.

## Live Toast prices

Menu cards show live prices from Toast when the site is deployed on Vercel with Toast API credentials, and fall back to the prices in `src/data/menu.ts` otherwise.

- `api/menu-prices.ts` is a Vercel function. It logs in to Toast with read-only Standard API access, reads the menu (`/menus/v2/menus`) and returns only item names and prices, keyed by the Toast item GUID at the end of each item's order link. Responses are cached at the edge for 15 minutes.
- Set `TOAST_CLIENT_ID`, `TOAST_CLIENT_SECRET` and `TOAST_RESTAURANT_GUID` in the Vercel project's environment variables (see `.env.example`). The secrets stay on the server.
- Size-priced items (daiquiris) show "From" their lowest size price, with every size in the tooltip.

## 3D cups

Every drink on the site is a live 3D model rendered with three.js (`src/cups/`), not an image. Cups sit still and spin in place while their card is hovered or focused. On touch screens, which have no hover, each cup spins while it is mostly on screen:

- `geometry.ts` builds the open clear PET cup (push-up base, stacking foot, tapered wall, rolled rim), the drink volume, whipped cream and garnishes. Cups never have lids.
- `textures.ts` paints the drink colours (layers, swirls, drizzle, pearls) and the condensation normal map at runtime, and prints the real logo from `public/brand/sip-society-daiquiri-depot.svg` (falling back to the `.webp`) on each cup, in cream ink on dark drinks.
- `engine.ts` uses one shared WebGL renderer for the whole page and copies each cup into its own canvas. A still cup costs nothing after its first frame; only spinning cups render, at up to 30 fps. Visitors with reduced motion enabled always get a still cup.
- `src/components/RealCup.tsx` wires the spin to the nearest ancestor marked `data-cup-trigger` (a whole menu card or lineup item).
- `src/data/drinks.ts` maps the hero lineup and each menu item to a cup. Menu flavours drive the colours automatically.

## Assets

Business-provided brand assets and photos are in `public/brand` and `public/photos`. Videos are kept in `media/video` for later use and are not deployed or shown on the site yet. Replace these with full-resolution originals when they are available, retaining the same filenames or updating their references in the components and `index.html`.
