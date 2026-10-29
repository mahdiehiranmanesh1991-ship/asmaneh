// «آسمانه» live sky renderer — stereographic alt-az projection on a 2D canvas, 60fps.
(function () {
  const D2R = Math.PI / 180, R2D = 180 / Math.PI;
  const ZOD = ['Ari', 'Tau', 'Gem', 'Cnc', 'Leo', 'Vir', 'Lib', 'Sco', 'Sgr', 'Cap', 'Aqr', 'Psc'];
  const STAR_FA = { Sirius: 'شباهنگ', Canopus: 'سهیل', Arcturus: 'سماک رامح', Vega: 'نسر واقع', Capella: 'عیوق', Rigel: 'رجل‌الجبار', Procyon: 'شعرای شامی', Betelgeuse: 'ابط‌الجوزا',
    Achernar: 'آخرالنهر', Altair: 'نسر طائر', Aldebaran: 'دبران', Antares: 'قلب‌العقرب', Spica: 'سماک اعزل', Pollux: 'رأس‌التوأم مؤخر', Fomalhaut: 'فم‌الحوت', Deneb: 'ذنب', Regulus: 'قلب‌الاسد',
    Castor: 'رأس‌التوأم مقدم', Polaris: 'ستاره‌ی قطبی', Bellatrix: 'ناجذ', Alnilam: 'نظام', Alnitak: 'نطاق', Mintaka: 'منطقه', Dubhe: 'دب اکبر', Alioth: 'جون', Alkaid: 'قائد', Mirfak: 'مرفق', Hamal: 'حمل', Algol: 'رأس‌الغول', Shaula: 'شوله', Nunki: 'نعایم' };
  const BODY_COL = { Sun: '#ffd77a', Moon: '#f1eee4', Mercury: '#c9c3b8', Venus: '#fff3c9', Mars: '#ff7a59', Jupiter: '#f2d3a3', Saturn: '#e8cf8a', Uranus: '#9fe6e8', Neptune: '#7fa6ff', Pluto: '#c7a6a0' };
  function vec(raDeg, dec) { const r = raDeg * D2R, d = dec * D2R; return [Math.cos(d) * Math.cos(r), Math.cos(d) * Math.sin(r), Math.sin(d)]; }
  function bvColor(bv) { // simple B-V → RGB
    const t = Math.max(-0.4, Math.min(2, bv));
    if (t < 0) return [170, 195, 255]; if (t < 0.4) return [215, 225, 255]; if (t < 0.8) return [255, 246, 225]; if (t < 1.3) return [255, 214, 160]; return [255, 180, 130];
  }
  function Sky(canvas, opts) {
    const ctx = canvas.getContext('2d'), self = this, D = window.SKYDATA, AC = window.AstroCore;
    this.az = 180; this.alt = 35; this.fov = 95; this.lat = opts.lat; this.lon = opts.lon; this.offsetH = 0; this.red = false; this.interactive = true; this.labels = true; this.auto = 0;
    this.onTap = () => {}; this.compass = false; this.dim = 0;
    const stars = D.stars.map((s, i) => ({ v: vec(s[0], s[1]), m: s[2], c: bvColor(s[3]), ph: (i * 2.399) % 6.283, name: D.starNames[i] ? (STAR_FA[D.starNames[i][0]] || '') : '' }));
    const lines = Object.entries(D.lines).map(([id, segs]) => ({ id, zod: ZOD.indexOf(id), segs: segs.map((sg) => sg.map((p) => vec(p[0], p[1]))) }));
    const cons = Object.entries(D.cons).map(([id, c]) => ({ id, fa: c[1], en: c[0], zod: ZOD.indexOf(id), v: vec(c[2][0], c[2][1]) }));
    // ecliptic & galactic plane in EQJ
    const eps = 23.4393 * D2R, ecl = [], gal = [];
    for (let l = 0; l <= 360; l += 3) { const L = l * D2R; ecl.push([Math.cos(L), Math.sin(L) * Math.cos(eps), Math.sin(L) * Math.sin(eps)]); }
    const gc = vec(266.405, -28.936), gp = vec(192.859, 27.128), gx = [gp[1] * gc[2] - gp[2] * gc[1], gp[2] * gc[0] - gp[0] * gc[2], gp[0] * gc[1] - gp[1] * gc[0]];
    for (let l = 0; l < 360; l += 4) { const L = l * D2R, w = 1 + 0.9 * Math.cos(L) ** 8; gal.push({ v: [0, 1, 2].map((k) => gc[k] * Math.cos(L) + gx[k] * Math.sin(L)), w, j: (l * 7.3) % 1 }); }
    // sprites
    function glow(col, r) { const c = document.createElement('canvas'); c.width = c.height = r * 2; const g = c.getContext('2d'), gr = g.createRadialGradient(r, r, 0, r, r, r);
      gr.addColorStop(0, `rgba(255,255,255,1)`); gr.addColorStop(0.18, `rgba(${col},0.9)`); gr.addColorStop(0.45, `rgba(${col},0.22)`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(0, 0, r * 2, r * 2); return c; }
    const spriteCache = {}; const sprite = (c) => spriteCache[c] || (spriteCache[c] = glow(c, 32));
    const neb = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, 'rgba(170,150,255,0.16)'); gr.addColorStop(0.5, 'rgba(120,100,220,0.06)'); gr.addColorStop(1, 'rgba(80,60,180,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return c; })();
    let W = 0, H = 0, dpr = 1, M = null, mT = 0, bodies = [], hits = [], meteors = [], nextMeteor = performance.now() + 3000;
    function resize() { dpr = Math.min(window.devicePixelRatio || 1, 2); W = canvas.clientWidth; H = canvas.clientHeight; canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    window.addEventListener('resize', resize); resize();
    this.date = () => new Date(Date.now() + self.offsetH * 3600e3);
    function update(force) {
      const d = self.date();
      if (!force && M && Math.abs(d - mT) < 20000) return;
      mT = d; M = AC.eqjToHorMatrix(d, self.lat, self.lon).rot;
      bodies = AC.BODIES.map((b) => { const h = AC.horizon(b, d, self.lat, self.lon); return { b, alt: h.alt, az: h.az, mag: b === 'Sun' ? -26.7 : AC.magnitude(b, d) }; });
      self.sunAlt = bodies[0].alt; self.moonFrac = AC.A.Illumination('Moon', AC.A.MakeTime(d)).phase_fraction;
    }
    this.refresh = () => update(true);
    const toHor = (v) => [M[0][0] * v[0] + M[1][0] * v[1] + M[2][0] * v[2], M[0][1] * v[0] + M[1][1] * v[1] + M[2][1] * v[2], M[0][2] * v[0] + M[1][2] * v[1] + M[2][2] * v[2]];
    // HOR: x north, y west, z zenith; az from north toward east
    const horVec = (az, alt) => { const a = az * D2R, e = alt * D2R; return [Math.cos(e) * Math.cos(a), -Math.cos(e) * Math.sin(a), Math.sin(e)]; };
    let F, Rt, U, scale, cx, cy;
    function camera() { F = horVec(self.az, self.alt); Rt = horVec(self.az + 90, 0); U = [Rt[1] * F[2] - Rt[2] * F[1], Rt[2] * F[0] - Rt[0] * F[2], Rt[0] * F[1] - Rt[1] * F[0]];
      scale = (Math.min(W, H * 1.2) / 2) / (2 * Math.tan(self.fov * D2R / 4)); cx = W / 2; cy = H / 2; }
    function proj(h) { const x = h[0] * Rt[0] + h[1] * Rt[1] + h[2] * Rt[2], y = h[0] * U[0] + h[1] * U[1] + h[2] * U[2], z = h[0] * F[0] + h[1] * F[1] + h[2] * F[2];
      const k = 2 / (1 + Math.max(z, -0.995)); return [cx + k * x * scale, cy - k * y * scale, z]; }
    const onScr = (p, m) => p[2] > -0.3 && p[0] > -m && p[0] < W + m && p[1] > -m && p[1] < H + m;
    this.project = (az, alt) => { camera(); return proj(horVec(az, alt)); };
    function skyGradient() {
      const s = self.sunAlt, g = ctx.createLinearGradient(0, 0, 0, H);
      if (self.red) { g.addColorStop(0, '#0c0000'); g.addColorStop(1, '#1a0202'); }
      else if (s > 0) { g.addColorStop(0, '#1b2a6b'); g.addColorStop(0.6, '#33408f'); g.addColorStop(1, '#5a5aa8'); }
      else if (s > -12) { g.addColorStop(0, '#0d0a33'); g.addColorStop(0.65, '#2a1b5e'); g.addColorStop(1, '#6b3f74'); }
      else { g.addColorStop(0, '#05041a'); g.addColorStop(0.55, '#110b38'); g.addColorStop(1, '#22134d'); }
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    const gold = (a) => self.red ? `rgba(255,60,40,${a})` : `rgba(232,194,106,${a})`;
    function frame(now) {
      if (!W) resize(); update(false); if (self.auto) self.az = (self.az + self.auto) % 360; camera();
      const day = Math.max(0, Math.min(1, (self.sunAlt + 6) / 10)), starA = (1 - 0.55 * day) * (1 - self.dim * 0.35), tsec = now / 1000;
      skyGradient();
      ctx.globalCompositeOperation = 'lighter';
      if (!self.red) for (const g of gal) { const p = proj(toHor(g.v)); if (!onScr(p, 200)) continue; const r = (160 + 90 * g.j) * g.w * scale / 300; ctx.globalAlpha = 0.8 * starA; ctx.drawImage(neb, p[0] - r, p[1] - r, r * 2, r * 2); }
      ctx.globalAlpha = 1;
      // constellation lines
      ctx.lineWidth = 1; ctx.globalCompositeOperation = 'source-over';
      for (const L of lines) {
        ctx.strokeStyle = L.zod >= 0 ? gold(0.55 * starA + 0.1) : (self.red ? 'rgba(200,40,30,0.25)' : `rgba(170,170,255,${0.22 * starA})`); ctx.lineWidth = L.zod >= 0 ? 1.3 : 0.8;
        ctx.beginPath(); for (const sg of L.segs) { let pen = false; for (const v of sg) { const p = proj(toHor(v)); if (p[2] < -0.2) { pen = false; continue; } pen ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); pen = true; } } ctx.stroke();
      }
      // ecliptic
      ctx.setLineDash([6, 6]); ctx.strokeStyle = gold(0.45); ctx.lineWidth = 1.2; ctx.beginPath(); let pen = false;
      for (const v of ecl) { const p = proj(toHor(v)); if (p[2] < -0.2) { pen = false; continue; } pen ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); pen = true; } ctx.stroke(); ctx.setLineDash([]);
      // stars
      ctx.globalCompositeOperation = 'lighter'; const magLim = 3.2 + 2.2 * Math.min(1, 90 / self.fov) - 1.5 * day; const zoomBoost = Math.max(1, 70 / self.fov) ** 0.4;
      for (const s of stars) {
        if (s.m > magLim) continue; const h = toHor(s.v), p = proj(h); if (!onScr(p, 10)) continue;
        const tw = 0.75 + 0.25 * Math.sin(tsec * (2.2 + (s.ph % 1.7)) + s.ph) * (h[2] < 0.35 ? 1.3 : 0.6);
        const a = Math.max(0, Math.min(1, (magLim + 0.6 - s.m) / 3.4)) * starA * tw;
        const r = Math.max(0.6, (4.6 - s.m) * 0.75) * zoomBoost; const col = self.red ? [255, 70, 50] : s.c;
        if (s.m < 2.6) { ctx.globalAlpha = a; const R = r * 3.4; ctx.drawImage(sprite(col.join(',')), p[0] - R, p[1] - R, R * 2, R * 2); }
        else { ctx.globalAlpha = a; ctx.fillStyle = `rgb(${col})`; ctx.beginPath(); ctx.arc(p[0], p[1], r * 0.7, 0, 6.283); ctx.fill(); }
        if (s.m < 1.0 && self.labels && s.name) { ctx.globalAlpha = 0.65 * starA; ctx.fillStyle = self.red ? '#f55' : '#cfd3ff'; ctx.font = '11px Vazirmatn'; ctx.fillText(s.name, p[0] + 7, p[1] - 6); }
      }
      ctx.globalAlpha = 1;
      // meteors
      if (now > nextMeteor && self.sunAlt < -6) { nextMeteor = now + 5000 + Math.random() * 9000; meteors.push({ x: Math.random() * W, y: Math.random() * H * 0.5, vx: -(3 + Math.random() * 4), vy: 2 + Math.random() * 2, life: 1 }); }
      for (const m of meteors) { const g = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * 14, m.y - m.vy * 14); g.addColorStop(0, `rgba(255,255,255,${m.life})`); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = g; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(m.x - m.vx * 14, m.y - m.vy * 14); ctx.stroke(); m.x += m.vx; m.y += m.vy; m.life -= 0.018; }
      meteors = meteors.filter((m) => m.life > 0);
      ctx.globalCompositeOperation = 'source-over';
      // constellation labels
      hits = [];
      ctx.textAlign = 'center';
      for (const c of cons) { const p = proj(toHor(c.v)); if (!onScr(p, 0)) continue; hits.push({ type: 'sign', id: c.zod, cons: c, x: p[0], y: p[1], r: c.zod >= 0 ? 60 : 40 });
        if (!self.labels) continue; if (c.zod < 0 && self.fov > 100) continue;
        ctx.font = c.zod >= 0 ? '600 13px Vazirmatn' : '11px Vazirmatn'; ctx.fillStyle = c.zod >= 0 ? gold(0.95) : (self.red ? 'rgba(255,80,60,.6)' : `rgba(190,190,255,${0.55 * starA + 0.1})`);
        ctx.fillText(c.zod >= 0 ? window.Readings.S[c.zod][1] + ' ' + window.Readings.S[c.zod][0] : c.fa, p[0], p[1]); }
      // bodies
      for (const o of bodies) {
        const p = proj(horVec(o.az, o.alt)); if (!onScr(p, 30)) continue;
        const col = self.red ? '#ff5040' : BODY_COL[o.b]; const big = o.b === 'Sun' ? 15 : o.b === 'Moon' ? 14 : Math.max(3.2, 6 - (o.mag || 6) * 0.5);
        const R = (o.b === 'Sun' || o.b === 'Moon' ? big * Math.max(1, 60 / self.fov) : big);
        ctx.globalCompositeOperation = 'lighter'; const gr = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], R * 4); gr.addColorStop(0, col + (o.b === 'Moon' || o.b === 'Sun' ? '55' : 'aa')); gr.addColorStop(1, col + '00'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(p[0], p[1], R * 4, 0, 6.283); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        if (o.b === 'Moon') drawMoon(p, R); else { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(p[0], p[1], R, 0, 6.283); ctx.fill(); if (o.b === 'Saturn') { ctx.strokeStyle = col; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(p[0], p[1], R * 2.1, R * 0.7, -0.4, 0, 6.283); ctx.stroke(); } }
        ctx.font = '600 12px Vazirmatn'; ctx.fillStyle = self.red ? '#ff7060' : '#fff6dc'; ctx.fillText(window.Readings.P[o.b].fa, p[0], p[1] + R + 15);
        hits.push({ type: 'body', id: o.b, x: p[0], y: p[1], r: Math.max(26, R + 10), alt: o.alt, az: o.az });
      }
      // ground
      drawGround(starA);
      ctx.textAlign = 'start';
      if (self.running) requestAnimationFrame(frame);
    }
    function drawMoon(p, R) {
      const sun = bodies[0], moon = bodies[1]; const ps = proj(horVec(sun.az, sun.alt)); const ang = Math.atan2(ps[1] - p[1], ps[0] - p[0]);
      const f = self.moonFrac; ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(ang);
      ctx.fillStyle = self.red ? '#3a0808' : '#2a2840'; ctx.beginPath(); ctx.arc(0, 0, R, 0, 6.283); ctx.fill();
      ctx.fillStyle = self.red ? '#ff6050' : '#f6f1e0'; ctx.beginPath(); ctx.arc(0, 0, R, -Math.PI / 2, Math.PI / 2); // lit half toward sun (+x)
      const k = 1 - 2 * f; ctx.ellipse(0, 0, Math.abs(k) * R, R, 0, Math.PI / 2, -Math.PI / 2, k > 0); ctx.fill(); ctx.restore();
    }
    function drawGround(starA) {
      ctx.beginPath(); let first = true;
      for (let a = 0; a <= 360; a += 3) { const p = proj(horVec(a, 0)); first ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]); first = false; }
      ctx.closePath(); ctx.rect(-10, -10, W + 20, H + 20); // ground = screen minus the horizon circle (zenith lies inside it)
      const g = ctx.createLinearGradient(0, cy, 0, H); g.addColorStop(0, self.red ? 'rgba(25,0,0,.92)' : 'rgba(18,10,40,.94)'); g.addColorStop(1, self.red ? 'rgba(10,0,0,.98)' : 'rgba(6,4,18,.98)');
      ctx.fillStyle = g; ctx.fill('evenodd');
      // horizon glow line
      ctx.beginPath(); first = true; for (let a = 0; a <= 360; a += 3) { const p = proj(horVec(a, 0)); if (p[2] < -0.2) { first = true; continue; } first ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]); first = false; }
      ctx.strokeStyle = gold(0.8); ctx.lineWidth = 1.5; ctx.shadowColor = gold(0.9); ctx.shadowBlur = 10; ctx.stroke(); ctx.shadowBlur = 0;
      // mountains silhouette (Kerman feel)
      ctx.beginPath(); first = true; for (let a = 0; a <= 360; a += 2) { const hgt = 1.2 + 1.6 * Math.abs(Math.sin(a * 0.11 * D2R * 9) * Math.sin(a * D2R * 2.3)) + (Math.sin(a * D2R * 17) * 0.4); const p = proj(horVec(a, hgt)); if (p[2] < -0.2) { first = true; continue; } first ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]); first = false; }
      ctx.strokeStyle = self.red ? 'rgba(120,10,10,.6)' : 'rgba(120,90,190,.45)'; ctx.lineWidth = 1; ctx.stroke();
      const card = [['شمال', 0], ['شمال‌شرق', 45], ['شرق', 90], ['جنوب‌شرق', 135], ['جنوب', 180], ['جنوب‌غرب', 225], ['غرب', 270], ['شمال‌غرب', 315]];
      ctx.textAlign = 'center';
      for (const [n, a] of card) { const p = proj(horVec(a, -3.5)); if (!onScr(p, 0)) continue; ctx.font = a % 90 ? '500 11px Vazirmatn' : '700 15px Vazirmatn'; ctx.fillStyle = a === 0 ? (self.red ? '#ff4030' : '#ff8a7a') : gold(a % 90 ? 0.6 : 0.95); ctx.fillText(n, p[0], p[1]); }
    }
    // interaction
    const pts = new Map(); let lastPinch = 0, moved = 0, vel = [0, 0], lastT = 0;
    canvas.addEventListener('pointerdown', (e) => { if (!self.interactive) return; canvas.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); moved = 0; vel = [0, 0]; });
    canvas.addEventListener('pointermove', (e) => {
      if (!pts.has(e.pointerId)) return; const prev = pts.get(e.pointerId), cur = [e.clientX, e.clientY]; pts.set(e.pointerId, cur);
      if (pts.size === 2) { const [a, b] = [...pts.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (lastPinch) self.fov = Math.max(18, Math.min(140, self.fov * lastPinch / d)); lastPinch = d; moved += 10; return; }
      const dx = cur[0] - prev[0], dy = cur[1] - prev[1]; moved += Math.abs(dx) + Math.abs(dy); if (self.compass) return;
      const k = self.fov / Math.min(W, H * 1.2) * 1.15; self.az = (self.az - dx * k + 360) % 360; self.alt = Math.max(-20, Math.min(89, self.alt + dy * k)); vel = [dx * k, dy * k];
    });
    const up = (e) => { pts.delete(e.pointerId); if (pts.size < 2) lastPinch = 0; if (moved < 8 && pts.size === 0) tap(e.clientX - canvas.getBoundingClientRect().left, e.clientY - canvas.getBoundingClientRect().top); else coast(); };
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('wheel', (e) => { e.preventDefault(); self.fov = Math.max(18, Math.min(140, self.fov * (1 + e.deltaY * 0.001))); }, { passive: false });
    function coast() { let n = 0; const step = () => { if (pts.size || self.compass || n++ > 40) return; vel = vel.map((v) => v * 0.9); self.az = (self.az - vel[0] + 360) % 360; self.alt = Math.max(-20, Math.min(89, self.alt + vel[1])); requestAnimationFrame(step); }; step(); }
    function tap(x, y) { let best = null, bd = 1e9; for (const h of hits) { const d = Math.hypot(h.x - x, h.y - y) - (h.type === 'body' ? 40 : 0); if (Math.hypot(h.x - x, h.y - y) < h.r && d < bd) { bd = d; best = h; } } if (best) self.onTap(best); }
    // compass (DeviceOrientation)
    let sm = null;
    this.onOrient = (e) => { if (!self.compass) return; const head = e.webkitCompassHeading != null ? e.webkitCompassHeading : (e.alpha != null ? (360 - e.alpha) : null); if (head == null) return;
      const alt = Math.max(-30, Math.min(89, (e.beta || 0) - 90)); const tAz = head;
      if (!sm) sm = [tAz, alt]; let d = ((tAz - sm[0] + 540) % 360) - 180; sm[0] = (sm[0] + d * 0.15 + 360) % 360; sm[1] += (alt - sm[1]) * 0.15; self.az = sm[0]; self.alt = sm[1]; };
    window.addEventListener('deviceorientation', this.onOrient);
    this.lookAt = (az, alt) => { self.az = az; self.alt = Math.max(5, Math.min(80, alt)); };
    this.start = () => { if (self.running) return; self.running = true; requestAnimationFrame(frame); };
    this.stop = () => { self.running = false; };
    this.resize = resize;
    this.hits = () => hits;
  }
  window.Sky = Sky;
})();
