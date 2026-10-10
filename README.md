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

## Assets

Business-provided brand assets and photos are in `public/brand` and `public/photos`. Replace these with full-resolution originals when they are available, retaining the same filenames or updating their references in the components and `index.html`.
