// Hover-spin check on the real page: the first hero cup at rest, while hovered, and after the pointer
// leaves (it should finish its turn and settle with the print facing front).
// With the dev server on :3000 (npm run dev):
//   PLAYWRIGHT_MODULE="$(npm root -g)/playwright/index.mjs" node tools/spin-check.mjs out-prefix
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const out = process.argv[2] || 'spin';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
const logs = [];
page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`${m.type()}: ${m.text()}`); });
await page.goto('http://127.0.0.1:3000/', { waitUntil: 'networkidle' });
await page.waitForFunction(() => document.querySelectorAll('.lineup canvas[data-ready]').length >= 5, null, { timeout: 120000 });
await page.waitForTimeout(500);
const item = page.locator('.lineup-item').nth(0);
const cup = item.locator('.real-cup');
const snap = (label) => cup.screenshot({ path: `${out}-${label}.png` });
await snap('rest');
await item.hover();
for (let i = 1; i <= 5; i += 1) { await page.waitForTimeout(600); await snap(`hover-${i}`); }
await page.mouse.move(5, 5);
for (let i = 1; i <= 5; i += 1) { await page.waitForTimeout(1000); await snap(`left-${i}`); }
if (logs.length) console.log(logs.join('\n'));
await browser.close();
