// Natal chart wheel (SVG). Asc on the left, zodiac counter-clockwise.
(function () {
  const ELEM = ['#ff8a5c', '#9bd17a', '#ffe08a', '#7fc8ff']; // fire earth air water
  function wheelSVG(chart, R) {
    const Rd = window.Readings, size = 360, c = size / 2, ns = 'http://www.w3.org/2000/svg';
    const ang = (lon) => (180 - (lon - chart.asc)) * Math.PI / 180;
    const pt = (lon, r) => [c + r * Math.cos(ang(lon)), c - r * Math.sin(ang(lon))];
    let s = `<svg xmlns="${ns}" viewBox="0 0 ${size} ${size}" class="wheel"><defs>
      <radialGradient id="wg" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#2a1f66"/><stop offset=".7" stop-color="#140f3a"/><stop offset="1" stop-color="#0a0824"/></radialGradient>
      <linearGradient id="gd" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#f7dc8e"/><stop offset="1" stop-color="#b8892f"/></linearGradient>
      <filter id="gl"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <circle cx="${c}" cy="${c}" r="176" fill="url(#wg)" stroke="url(#gd)" stroke-width="1.6"/>
      <circle cx="${c}" cy="${c}" r="146" fill="none" stroke="url(#gd)" stroke-width="1"/>
      <circle cx="${c}" cy="${c}" r="96" fill="rgba(10,8,36,.55)" stroke="rgba(232,194,106,.5)" stroke-width=".8"/>`;
    for (let i = 0; i < 12; i++) {
      const a0 = i * 30, [x1, y1] = pt(a0, 146), [x2, y2] = pt(a0, 176); s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="rgba(232,194,106,.7)" stroke-width=".8"/>`;
      const [gx, gy] = pt(a0 + 15, 161); s += `<text x="${gx}" y="${gy}" fill="${ELEM[i % 4]}" font-size="17" text-anchor="middle" dominant-baseline="central" filter="url(#gl)">${Rd.S[i][1]}\uFE0E</text>`;
      for (let d = 0; d < 30; d += 5) { const [a, b] = pt(a0 + d, 146), [e, f] = pt(a0 + d, d % 10 ? 142 : 139); s += `<line x1="${a}" y1="${b}" x2="${e}" y2="${f}" stroke="rgba(232,194,106,.45)" stroke-width=".6"/>`; }
    }
    chart.cusps.forEach((cu, i) => { const ax = i === 0 || i === 3 || i === 6 || i === 9; const [x1, y1] = pt(cu, 96), [x2, y2] = pt(cu, 146);
      s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${ax ? '#f7dc8e' : 'rgba(200,190,255,.35)'}" stroke-width="${ax ? 1.6 : .7}"/>`;
      const nx = chart.cusps[(i + 1) % 12]; const mid = cu + (((nx - cu) + 360) % 360) / 2; const [hx, hy] = pt(mid, 104); s += `<text x="${hx}" y="${hy}" fill="rgba(200,190,255,.55)" font-size="8.5" text-anchor="middle" dominant-baseline="central">${(i + 1).toLocaleString('fa-IR')}</text>`; });
    const [ax, ay] = pt(chart.asc, 186); s += `<text x="${ax - 2}" y="${ay}" fill="#f7dc8e" font-size="9" text-anchor="middle" dominant-baseline="central">AC</text>`;
    const [mx, my] = pt(chart.mc, 186); s += `<text x="${mx}" y="${my - 3}" fill="#f7dc8e" font-size="9" text-anchor="middle" dominant-baseline="central">MC</text>`;
    // aspects
    const col = { conj: '#f7dc8e', sext: '#7fc8ff', tri: '#8de0b0', sq: '#ff7a8a', opp: '#ff9a5c' };
    for (const a of chart.aspects) { if (a.aspect === 'conj') continue; const [x1, y1] = pt(chart.planets[a.a].lon, 92), [x2, y2] = pt(chart.planets[a.b].lon, 92);
      s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col[a.aspect]}" stroke-opacity="${0.25 + 0.55 * a.strength}" stroke-width="${0.6 + a.strength}"/>`; }
    // planets with collision spreading
    const ps = Object.entries(chart.planets).map(([b, p]) => ({ b, lon: p.lon, d: p.lon, retro: p.retro })).sort((x, y) => x.lon - y.lon);
    for (let it = 0; it < 30; it++) for (let i = 0; i < ps.length; i++) { const a = ps[i], b = ps[(i + 1) % ps.length]; let gap = ((b.d - a.d) + 360) % 360; if (gap < 9) { a.d -= (9 - gap) / 2; b.d += (9 - gap) / 2; } }
    for (const p of ps) { const [x, y] = pt(p.d, 124), [tx, ty] = pt(p.lon, 146), [tx2, ty2] = pt(p.lon, 138);
      s += `<line x1="${tx}" y1="${ty}" x2="${tx2}" y2="${ty2}" stroke="#fff" stroke-width="1.2"/>`;
      s += `<g class="wp" data-b="${p.b}"><circle cx="${x}" cy="${y}" r="10.5" fill="rgba(20,14,60,.85)" stroke="url(#gd)" stroke-width=".8"/><text x="${x}" y="${y + 0.5}" fill="#fff3cf" font-size="13" text-anchor="middle" dominant-baseline="central" filter="url(#gl)">${Rd.P[p.b].g}\uFE0E</text></g>`;
      const [dx, dy] = pt(p.d, 108); s += `<text x="${dx}" y="${dy}" fill="rgba(255,243,207,.75)" font-size="7" text-anchor="middle" dominant-baseline="central">${Math.floor(p.lon % 30)}°${p.retro ? 'R' : ''}</text>`; }
    s += `<circle cx="${c}" cy="${c}" r="3" fill="#f7dc8e"/></svg>`;
    return s;
  }
  window.wheelSVG = wheelSVG;
})();
