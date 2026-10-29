const test = require('node:test'), assert = require('node:assert');
const C = require('../js/astro-core.js'), R = require('../js/readings.js'), St = require('../js/store.js');
const ref = require('./swe-reference.json'), natalRef = require('./natal-reference.json');
const diff = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
const birth = St.birthUTC(St.DEFAULTS.profile);
test('birth time converts to UTC 13:44 (Iran was +3:30 on 19 Oct 1991; DST ended 22 Sep)', () => assert.equal(birth.toISOString(), '1991-10-19T13:44:00.000Z'));
test('natal planets match Swiss Ephemeris within 0.02°', () => {
  const ch = C.chart(birth, 30.28, 57.08);
  for (const [b, v] of Object.entries(natalRef.planets)) if (ch.planets[b]) { assert.ok(diff(ch.planets[b].lon, v.lon) < 0.02, b); assert.equal(ch.planets[b].house, v.house, b + ' house'); }
  assert.ok(diff(ch.asc, natalRef.Asc.lon) < 0.05); assert.ok(diff(ch.mc, natalRef.MC.lon) < 0.05);
  natalRef.cusps.forEach((c, i) => assert.ok(diff(ch.cusps[i], c.lon) < 0.1, 'cusp ' + (i + 1)));
  assert.equal(C.SIGNS[ch.planets.Sun.sign], 'Libra'); assert.ok(Math.abs(ch.planets.Sun.deg - 25.68) < 0.05);
});
test('transit positions match Swiss Ephemeris at 3 dates', () => {
  for (const [iso, bodies] of Object.entries(ref.dates)) for (const [b, [lon, retro]] of Object.entries(bodies)) {
    const d = new Date(iso); assert.ok(diff(C.eclLon(b, d), lon) < 0.03, iso + ' ' + b + ' ' + C.eclLon(b, d)); assert.equal(C.isRetro(b, d), retro, iso + ' retro ' + b);
  }
});
test('whole-sign houses start at Asc sign', () => { const h = C.houses(birth, 30.28, 57.08, 'whole'); assert.equal(h.cusps[0], 0); assert.equal(h.cusps[6], 180); });
test('planetary hours: Thursday 29 Oct 2026 Kerman starts with Jupiter, 24 hours', () => {
  const h = C.planetaryHours(new Date('2026-10-29T09:00:00Z'), 30.28, 57.08); assert.equal(h.dayRuler, 'Jupiter'); assert.equal(h.hours.length, 24); assert.equal(h.hours[0].ruler, 'Jupiter'); assert.equal(h.hours[1].ruler, 'Mars');
});
test('void-of-course ends at a Moon sign ingress', () => { const v = C.voidOfCourse(new Date('2026-10-29T12:00:00Z')); assert.ok(v.end > new Date('2026-10-29T12:00:00Z')); assert.notEqual(C.signOf(C.eclLon('Moon', new Date(+v.end + 60000))), v.sign); });
function ctx(d) { const n = C.chart(birth, 30.28, 57.08); return { natal: n, tr: C.transits(d, n), date: d, hours: C.planetaryHours(d, 30.28, 57.08), voc: C.voidOfCourse(d), moon: C.moonInfo(d) }; }
test('readings are deterministic per day and have no repeated lines', () => {
  const d = new Date('2026-10-29T08:00:00Z'), c = ctx(d);
  for (const b of C.BODIES) { const a = R.bodyReading(b, c), a2 = R.bodyReading(b, c); assert.deepEqual(a, a2);
    const all = [...a.dos, ...a.donts]; assert.equal(new Set(all).size, all.length, b); assert.ok(a.dos.length >= 2 && a.donts.length >= 1); }
  for (let s = 0; s < 12; s++) { const r = R.signReading(s, c); assert.ok(r.lines.length >= 2); }
  const dl = R.daily(c); assert.ok(dl.dos.length && dl.donts.length && dl.color.hex && dl.good.length);
});
test('daily message changes across days', () => { const a = new Set(); for (let i = 0; i < 7; i++) a.add(JSON.stringify(R.daily(ctx(new Date(Date.UTC(2026, 10, 1 + i, 8)))).dos)); assert.ok(a.size >= 5); });
test('store export/import roundtrip', () => { const s = St.load(); s.notes.push({ text: 'x' }); const t = St.importJSON(St.exportJSON(s)); assert.equal(t.notes[0].text, 'x'); assert.throws(() => St.importJSON('{"app":"other"}')); });
test('sky data: >2000 stars, 88 constellations incl. zodiac Persian names', () => { const D = require('../data/sky.js'); assert.ok(D.stars.length > 2000); assert.equal(Object.keys(D.lines).length, 88); assert.ok(D.cons.Leo[1].length > 0); });
test('service worker only deletes its own caches and lists existing files', () => { const fs = require('fs'), sw = fs.readFileSync(__dirname + '/../sw.js', 'utf8'); assert.match(sw, /startsWith\('asmaneh-'\)/);
  const list = sw.match(/ASSETS = \[([\s\S]*?)\]/)[1].match(/'([^']+)'/g).map((x) => x.slice(1, -1)); for (const f of list) if (f !== './') assert.ok(fs.existsSync(__dirname + '/../' + f), f); });
