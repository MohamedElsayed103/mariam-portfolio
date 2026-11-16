// Renders src/pages/og.astro (served by the dev server) into public/og.png.
import { chromium } from 'playwright-core';

const base = process.env.SHOT_BASE ?? 'http://localhost:4321';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto(`${base}/og`, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.locator('.og').screenshot({ path: 'public/og.png' });
await browser.close();
console.log('saved public/og.png');
