// Regenerates the link-preview image (og:image), public/share-preview.jpg, 1600 x 840 (the 1.91:1 shape link
// previews use): the homepage hero as seen in a 1440p desktop window (2560 x 1344), cropped from just above the
// headline to just below the five drinks, centred, so the headline and cups fill the preview.
// Build and serve the site first (npm run build && npx vite preview --port 4173), then:
//   PLAYWRIGHT_MODULE="$(npm root -g)/playwright/index.mjs" node tools/share-shot.mjs [url] [out]
// Software WebGL takes a while to draw the hero cups; the script waits for them.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const [url = 'http://127.0.0.1:4173/', out = 'public/share-preview.jpg'] = process.argv.slice(2);
const OUT_W = 1600;
const OUT_H = 840;
const viewport = { width: 2560, height: 1344 };
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });

const load = async (scale) => {
  const page = await browser.newPage({ viewport, deviceScaleFactor: scale });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1000); // let the intro fade-in settle
  return page;
};

// Pass 1: measure the crop in CSS pixels.
const probe = await load(1);
const { top, bottom } = await probe.evaluate(() => ({
  top: document.querySelector('.hero-section .eyebrow').getBoundingClientRect().top - 52,
  bottom: document.querySelector('.hero-section .lineup').getBoundingClientRect().bottom + 20,
}));
await probe.close();
const height = bottom - top;
const width = (height * OUT_W) / OUT_H;
const clip = { x: (viewport.width - width) / 2, y: top, width, height };

// Pass 2: render at the scale that makes the crop exactly OUT_W wide, wait for the cups, capture.
const page = await load(OUT_W / width);
await page.waitForFunction(() => {
  const cups = [...document.querySelectorAll('.hero-section canvas')];
  return cups.length > 0 && cups.every((c) => c.dataset.ready);
}, null, { timeout: 300000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: out, type: 'jpeg', quality: 90, clip });
await browser.close();
console.log(`${out}: crop ${clip.width.toFixed(0)} x ${clip.height.toFixed(0)} at (${clip.x.toFixed(0)}, ${clip.y.toFixed(0)})`);
