// Renders the cup lab to a PNG with headless Chromium (software WebGL) for close inspection.
// With the dev server on :3000 (npm run dev):
//   PLAYWRIGHT_MODULE="$(npm root -g)/playwright/index.mjs" node tools/render-cups.mjs out.png "set=hero&w=300&h=484" [spinMs]
// Software rendering is slow and its frame timing is unreliable: judge looks here, not animation speed.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const [out = 'cups.png', query = 'set=hero', spinMs] = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1500, height: 960 }, deviceScaleFactor: 2 });
const logs = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`${m.type()}: ${m.text()}`); });
page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`));
page.on('response', (r) => { if (r.status() >= 400) logs.push(`http ${r.status()}: ${r.url()}`); });
await page.goto(`http://127.0.0.1:3000/tools/cup-lab.html?${query}`, { waitUntil: 'networkidle' });
const n = await page.locator('canvas').count();
await page.waitForFunction((k) => document.querySelectorAll('canvas[data-ready]').length >= k, n, { timeout: 180000 });
await page.waitForTimeout(600);
if (spinMs) {
  await page.evaluate(() => window.spin(true));
  await page.waitForTimeout(Number(spinMs));
}
await page.locator('#grid').screenshot({ path: out });
if (logs.length) console.log(logs.join('\n'));
await browser.close();
