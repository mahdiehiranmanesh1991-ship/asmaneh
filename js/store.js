// Local-only storage (localStorage). Nothing leaves the phone.
(function (root, f) { if (typeof module !== 'undefined') module.exports = f(); else root.Store = f(); })(this, function () {
  const KEY = 'asmaneh.v1';
  const DEFAULTS = { profile: { name: 'مهدیه', birthLocal: '1991-10-19T17:14', tzOffset: 3.5, birthLat: 30.28, birthLon: 57.08, birthPlace: 'کرمان' },
    loc: { lat: 30.28, lon: 57.08, name: 'کرمان' }, tz: 'Asia/Tehran', houseSystem: 'placidus', red: false, notes: [], readings: [] };
  const mem = {}; const ls = typeof localStorage !== 'undefined' ? localStorage : { getItem: (k) => mem[k] ?? null, setItem: (k, v) => { mem[k] = v; } };
  function load() { try { const s = JSON.parse(ls.getItem(KEY)); return s ? { ...structuredClone(DEFAULTS), ...s, profile: { ...DEFAULTS.profile, ...(s.profile || {}) } } : structuredClone(DEFAULTS); } catch (e) { return structuredClone(DEFAULTS); } }
  function save(s) { ls.setItem(KEY, JSON.stringify(s)); }
  function birthUTC(p) { const [d, t] = p.birthLocal.split('T'); const ms = Date.parse(d + 'T' + t + ':00Z') - p.tzOffset * 3600e3; return new Date(ms); }
  function addReading(s, r) { const k = r.day + '|' + r.target; s.readings = [r, ...s.readings.filter((x) => x.day + '|' + x.target !== k)].slice(0, 300); }
  function exportJSON(s) { return JSON.stringify({ app: 'asmaneh', version: 1, exported: new Date().toISOString(), data: s }, null, 2); }
  function importJSON(txt) { const o = JSON.parse(txt); if (!o || o.app !== 'asmaneh' || !o.data) throw new Error('فایل معتبر نیست'); return { ...structuredClone(DEFAULTS), ...o.data }; }
  return { DEFAULTS, load, save, birthUTC, addReading, exportJSON, importJSON };
});
