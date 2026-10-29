// «آسمانه» astronomy + astrology core. Works in browser (window.Astronomy) and node (require).
(function (root, factory) {
  if (typeof module !== 'undefined') module.exports = factory(require('../vendor/astronomy.js'));
  else root.AstroCore = factory(root.Astronomy);
})(this, function (A) {
  const D2R = Math.PI / 180, R2D = 180 / Math.PI;
  const norm = (x) => ((x % 360) + 360) % 360;
  const BODIES = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
  const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  const ASPECTS = [
    { key: 'conj', angle: 0, orb: 8 }, { key: 'sext', angle: 60, orb: 4.5 }, { key: 'sq', angle: 90, orb: 6.5 },
    { key: 'tri', angle: 120, orb: 6.5 }, { key: 'opp', angle: 180, orb: 8 }];

  function eclLon(body, date) {
    const t = A.MakeTime(date);
    if (body === 'Sun') return A.SunPosition(t).elon;
    if (body === 'Moon') return A.EclipticGeoMoon(t).lon;
    return A.Ecliptic(A.GeoVector(body, t, true)).elon;
  }
  function eclLat(body, date) {
    const t = A.MakeTime(date);
    if (body === 'Sun') return 0;
    if (body === 'Moon') return A.EclipticGeoMoon(t).lat;
    return A.Ecliptic(A.GeoVector(body, t, true)).elat;
  }
  function isRetro(body, date) {
    if (body === 'Sun' || body === 'Moon') return false;
    const a = eclLon(body, new Date(date.getTime() - 43200000)), b = eclLon(body, new Date(date.getTime() + 43200000));
    let d = b - a; if (d > 180) d -= 360; if (d < -180) d += 360; return d < 0;
  }
  const signOf = (lon) => Math.floor(norm(lon) / 30);
  const degIn = (lon) => norm(lon) % 30;

  function obliquity(date) { const T = (A.MakeTime(date).tt) / 36525; return 23.439291 - 0.0130042 * T - 1.64e-7 * T * T; }
  function ramc(date, lonE) { return norm(A.SiderealTime(A.MakeTime(date)) * 15 + lonE); }
  function ascMc(date, lat, lonE) {
    const e = obliquity(date) * D2R, r = ramc(date, lonE) * D2R, f = lat * D2R;
    const mc = norm(Math.atan2(Math.sin(r), Math.cos(r) * Math.cos(e)) * R2D);
    let asc = norm(Math.atan2(Math.cos(r), -(Math.sin(r) * Math.cos(e) + Math.tan(f) * Math.sin(e))) * R2D);
    return { asc, mc };
  }
  // Placidus cusps by semi-arc iteration; falls back to whole sign beyond polar circles.
  function houses(date, lat, lonE, system) {
    const { asc, mc } = ascMc(date, lat, lonE);
    if (system === 'whole' || Math.abs(lat) > 66) { const s = signOf(asc) * 30; return { asc, mc, system: 'whole', cusps: Array.from({ length: 12 }, (_, i) => norm(s + 30 * i)) }; }
    const e = obliquity(date) * D2R, R = ramc(date, lonE), f = lat * D2R;
    const lonFromRA = (ra) => norm(Math.atan2(Math.sin(ra * D2R), Math.cos(ra * D2R) * Math.cos(e)) * R2D);
    const dsa = (lon) => { const d = Math.asin(Math.sin(e) * Math.sin(lon * D2R)); const x = -Math.tan(f) * Math.tan(d); return Math.acos(Math.max(-1, Math.min(1, x))) * R2D; };
    function cusp(fr, below) {
      let ra = R + (below ? 90 + 90 * fr : 90 * fr), lon;
      for (let i = 0; i < 50; i++) { lon = lonFromRA(ra); const D = dsa(lon); ra = below ? R + D + fr * (180 - D) : R + fr * D; }
      return lonFromRA(ra);
    }
    const c11 = cusp(1 / 3, false), c12 = cusp(2 / 3, false), c2 = cusp(1 / 3, true), c3 = cusp(2 / 3, true);
    const cusps = [asc, c2, c3, norm(mc + 180), norm(c11 + 180), norm(c12 + 180), norm(asc + 180), norm(c2 + 180), norm(c3 + 180), mc, c11, c12];
    return { asc, mc, system: 'placidus', cusps };
  }
  function houseOf(lon, cusps) {
    for (let i = 0; i < 12; i++) { const a = cusps[i], b = cusps[(i + 1) % 12]; const span = norm(b - a), d = norm(lon - a); if (d < span) return i + 1; }
    return 1;
  }
  function chart(date, lat, lonE, system) {
    const h = houses(date, lat, lonE, system || 'placidus');
    const planets = {};
    for (const b of BODIES) { const lon = eclLon(b, date); planets[b] = { lon, sign: signOf(lon), deg: degIn(lon), house: houseOf(lon, h.cusps), retro: isRetro(b, date) }; }
    return { date, planets, ...h, aspects: aspectsBetween(planets, planets, true) };
  }
  function aspectsBetween(pa, pb, same, orbScale) {
    const out = [], ka = Object.keys(pa), kb = Object.keys(pb);
    ka.forEach((a, i) => kb.forEach((b, j) => {
      if (same && j <= i) return;
      let d = Math.abs(norm(pa[a].lon - pb[b].lon)); if (d > 180) d = 360 - d;
      for (const as of ASPECTS) { const orb = Math.abs(d - as.angle), lim = as.orb * (orbScale || 1); if (orb <= lim) out.push({ a, b, aspect: as.key, orb, strength: 1 - orb / lim }); }
    }));
    return out.sort((x, y) => x.orb - y.orb);
  }
  function transits(date, natal) {
    const now = {}; for (const b of BODIES) now[b] = { lon: eclLon(b, date), retro: isRetro(b, date) };
    for (const b of BODIES) { now[b].sign = signOf(now[b].lon); now[b].house = houseOf(now[b].lon, natal.cusps); }
    const pts = { ...natal.planets, Asc: { lon: natal.asc }, MC: { lon: natal.mc } };
    // tighter orbs for transits; Moon transits count only within 3°
    const asp = aspectsBetween(now, pts, false, 0.35).filter((x) => x.a !== 'Moon' || x.orb < 3);
    return { now, aspects: asp };
  }
  function moonInfo(date) {
    const t = A.MakeTime(date), phase = A.MoonPhase(t), ill = A.Illumination('Moon', t);
    const next = []; let q = A.SearchMoonQuarter(t);
    for (let i = 0; i < 8; i++) { next.push({ q: q.quarter, date: q.time.date }); q = A.NextMoonQuarter(q); }
    let prevNew = A.SearchMoonPhase(0, t, -30);
    return { phase, frac: ill.phase_fraction, next, prevNew: prevNew && prevNew.date, age: prevNew ? (date - prevNew.date) / 864e5 : 0 };
  }
  // Void-of-course: from last major Ptolemaic aspect of Moon (to Sun..Pluto) until Moon leaves its sign.
  function voidOfCourse(date) {
    const step = 600000; let t = date.getTime(); const s0 = signOf(eclLon('Moon', date));
    let ingress = null; for (let i = 0; i < 400; i++) { t += step; if (signOf(eclLon('Moon', new Date(t))) !== s0) { ingress = new Date(t); break; } }
    if (!ingress) return null;
    const others = BODIES.filter((b) => b !== 'Moon');
    let last = null; const prev = {};
    for (let tt = ingress.getTime() - 3 * 864e5; tt <= ingress.getTime(); tt += step) {
      const m = eclLon('Moon', new Date(tt));
      for (const b of others) {
        const p = eclLon(b, new Date(tt)); let d = norm(m - p);
        for (const ang of [0, 60, 90, 120, 180, 240, 270, 300]) {
          const k = b + ang, diff = ((d - ang + 540) % 360) - 180;
          if (prev[k] !== undefined && prev[k] < 0 && diff >= 0 && signOf(m) === s0) last = { time: new Date(tt), body: b, ang };
          prev[k] = diff;
        }
      }
    }
    return { start: last ? last.time : null, end: ingress, lastAspect: last, sign: s0 };
  }
  function riseSet(body, date, lat, lonE) {
    const obs = new A.Observer(lat, lonE, 1750), d0 = new Date(date.getTime() - 12 * 3600e3);
    const r = A.SearchRiseSet(body, obs, +1, d0, 1.2), s = A.SearchRiseSet(body, obs, -1, d0, 1.2);
    return { rise: r && r.date, set: s && s.date };
  }
  const CHALDEAN = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon'];
  const DAY_RULER = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  function planetaryHours(date, lat, lonE) {
    const obs = new A.Observer(lat, lonE, 1750);
    let rise = A.SearchRiseSet('Sun', obs, +1, new Date(date.getTime() - 26 * 3600e3), 1).date;
    const r2 = A.SearchRiseSet('Sun', obs, +1, new Date(rise.getTime() + 3600e3), 1).date; if (r2 <= date) rise = r2;
    const set = A.SearchRiseSet('Sun', obs, -1, rise, 1).date;
    const rise2 = A.SearchRiseSet('Sun', obs, +1, set, 1).date;
    const dl = (set - rise) / 12, nl = (rise2 - set) / 12;
    const wd = new Date(rise.getTime() + lonE / 15 * 3600e3).getUTCDay(); let idx = CHALDEAN.indexOf(DAY_RULER[wd]); const out = [];
    for (let i = 0; i < 24; i++) {
      const start = i < 12 ? new Date(+rise + i * dl) : new Date(+set + (i - 12) * nl), end = new Date(+start + (i < 12 ? dl : nl));
      out.push({ ruler: CHALDEAN[(idx + i) % 7], start, end, day: i < 12 });
    }
    return { rise, set, hours: out, dayRuler: DAY_RULER[wd] };
  }
  // Horizontal coords for a body (refraction-corrected)
  function horizon(body, date, lat, lonE) {
    const obs = new A.Observer(lat, lonE, 1750), t = A.MakeTime(date);
    const eq = A.Equator(body, t, obs, true, true), h = A.Horizon(t, obs, eq.ra, eq.dec, 'normal');
    return { az: h.azimuth, alt: h.altitude, ra: eq.ra, dec: eq.dec, dist: eq.dist };
  }
  function eqjToHorMatrix(date, lat, lonE) { return A.Rotation_EQJ_HOR(A.MakeTime(date), new A.Observer(lat, lonE, 1750)); }
  function magnitude(body, date) { try { return A.Illumination(body, A.MakeTime(date)).mag; } catch (e) { return null; } }
  return { A, BODIES, SIGNS, ASPECTS, norm, eclLon, eclLat, isRetro, signOf, degIn, houses, houseOf, chart, aspectsBetween, transits, moonInfo, voidOfCourse, riseSet, planetaryHours, horizon, eqjToHorMatrix, magnitude, obliquity };
});
