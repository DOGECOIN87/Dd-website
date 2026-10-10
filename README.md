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

## 3D cups

Every drink on the site is a live, slowly spinning 3D model rendered with three.js (`src/cups/`), not an image:

- `geometry.ts` builds the clear PET cup (push-up base, stacking foot, tapered wall, rolled rim), dome and flat lids, the drink volume, whipped cream and garnishes.
- `textures.ts` paints the drink colours (layers, swirls, drizzle, pearls), the condensation normal map and the printed cup logo at runtime.
- `engine.ts` uses one shared WebGL renderer for the whole page and copies each cup into its own canvas, so dozens of cups can spin at once. Only on-screen cups render, at up to 30 fps. Visitors with reduced motion enabled get a still cup.
- `src/data/drinks.ts` maps the hero lineup and each menu item to a cup. Menu flavours drive the colours automatically.

## Assets

Business-provided brand assets, photos and videos are in `public/brand`, `public/photos` and `public/video`. Videos were re-encoded for the web (H.264, faststart) with WebP poster frames. Replace these with full-resolution originals when they are available, retaining the same filenames or updating their references in the components and `index.html`.
