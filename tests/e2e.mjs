// Headless-Chrome E2E at iPhone size. Usage: python3 -m http.server 8844 -d . & PW_DIR=/tmp/pw node tests/e2e.mjs http://127.0.0.1:8844/
import { createRequire } from 'node:module'; import assert from 'node:assert/strict'; import { mkdirSync, rmSync } from 'node:fs';
const require = createRequire((process.env.PW_DIR || '/tmp/pw') + '/'); const { chromium } = require('playwright-core');
const URL_ = process.argv[2] || 'http://127.0.0.1:8844/'; const ORIGIN = new URL(URL_).origin;
const SHOTS = new URL('../screenshots/', import.meta.url).pathname; rmSync(SHOTS, { recursive: true, force: true }); mkdirSync(SHOTS, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'fa-IR', timezoneId: 'Asia/Tehran' });
const page = await ctx.newPage(); const external = [], errors = [];
page.on('request', (r) => { const u = r.url(); if (!u.startsWith(ORIGIN) && !/^(data|blob):/.test(u)) external.push(u); });
page.on('pageerror', (e) => errors.push(String(e))); page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
let n = 0; const shot = async (name, settle = 900) => { await sleep(settle); const f = `${SHOTS}${String(++n).padStart(2, '0')}-${name}.png`; await page.screenshot({ path: f }); console.log('•', f); };
const tab = async (v) => { await page.click(`#tabs button[data-v="${v}"]`); await sleep(500); };
await page.goto(URL_); await page.waitForFunction(() => window.__app); await shot('today', 1500);
await page.evaluate(() => document.querySelector('#v-today').scrollTo(0, 520)); await shot('today-hours');
await page.evaluate(() => document.querySelector('#v-today').scrollTo(0, 2000)); await shot('today-bottom');
await tab('sky'); await shot('sky-now', 1500);
// look toward the ecliptic / a planet and tap it
async function tapBody(id) {
  await page.evaluate((id) => { const s = window.__app.sky, d = s.date(), h = window.AstroCore.horizon(id, d, s.lat, s.lon); s.lookAt(h.az, h.alt); s.fov = 80; }, id); await sleep(400);
  const h = await page.evaluate((id) => window.__app.sky.hits().find((x) => x.type === 'body' && x.id === id), id); assert.ok(h, 'hit ' + id);
  await page.mouse.click(h.x, h.y); await page.waitForSelector('#card.up'); }
const up = await page.evaluate(() => { const s = window.__app.sky, d = s.date(); return window.AstroCore.BODIES.map((b) => [b, window.AstroCore.horizon(b, d, s.lat, s.lon).alt]); }); console.log(up);
const vis = up.filter(([b, a]) => a > 8).map(([b]) => b);
for (const b of vis.slice(0, 3)) { await tapBody(b); await shot('card-' + b); await page.click('#card .x'); await sleep(400); }
// tap a zodiac constellation (ecliptic area)
await page.evaluate(() => { const s = window.__app.sky; s.fov = 90; }); await sleep(300);
const z = await page.evaluate(() => window.__app.sky.hits().find((x) => x.type === 'sign' && x.id >= 0 && x.x > 40 && x.x < 350 && x.y > 120 && x.y < 640));
if (z) { await page.mouse.click(z.x, z.y); await page.waitForSelector('#card.up'); await shot('card-zodiac'); await page.click('#card .x'); await sleep(400); }
// drag + pinch-ish (wheel) + time slider
await page.mouse.move(200, 400); await page.mouse.down(); await page.mouse.move(80, 360, { steps: 8 }); await page.mouse.up();
await page.evaluate(() => { const s = window.__app.sky; s.lookAt(90, 25); s.fov = 120; }); await shot('sky-wide-east');
await page.evaluate(() => { const sl = document.querySelector('#t-slider'); sl.value = 20; sl.dispatchEvent(new Event('input')); window.__app.sky.lookAt(250, 15); }); await shot('sky-sunset-time');
await page.evaluate(() => { const sl = document.querySelector('#t-slider'); sl.value = 0; sl.dispatchEvent(new Event('input')); const s = window.__app.sky; s.lookAt(0, 30); s.fov = 70; }); await shot('sky-north-zoom');
await page.click('#b-red'); await shot('sky-red'); await page.click('#b-red');
await page.click('#b-compass'); await sleep(300);
await tab('chart'); await shot('chart-wheel', 1200);
await page.evaluate(() => document.querySelector('#v-chart').scrollTo(0, 560)); await shot('chart-table');
await page.click('#v-chart tr[data-b="Venus"]'); await page.waitForSelector('#card.up'); await shot('chart-card-venus'); await page.click('#card .x');
await tab('moon'); await shot('moon', 1200);
await page.fill('#note', 'نیت این ماه: هر روز ده صفحه کتاب و یک لایحه‌ی تمیز ✦'); await page.click('#b-save'); await sleep(400);
await page.evaluate(() => document.querySelector('#v-moon').scrollTo(0, 600)); await shot('moon-notes');
const st = await page.evaluate(() => JSON.parse(localStorage.getItem('asmaneh.v1'))); assert.equal(st.notes.length, 1); assert.ok(st.readings.length >= 1);
await tab('set'); await shot('settings');
const fps = await page.evaluate(() => new Promise((r) => { let c = 0; const t0 = performance.now(); const f = () => { c++; performance.now() - t0 < 2000 ? requestAnimationFrame(f) : r(c / 2); }; requestAnimationFrame(f); }));
console.log('fps (headless swiftshader):', fps);
await tab('today'); await page.reload(); await sleep(800);
assert.deepEqual(external, [], 'no external requests'); assert.deepEqual(errors, [], 'no errors: ' + errors.join('|'));
console.log('E2E OK'); await browser.close();
