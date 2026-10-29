// «آسمانه» app shell
(function () {
  const AC = window.AstroCore, R = window.Readings, St = window.Store;
  let S = St.load(), natal, view = 'today';
  const $ = (q) => document.querySelector(q);
  const fa = (x) => String(x).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
  const tf = (d, o) => d ? new Intl.DateTimeFormat('fa-IR-u-ca-persian', { timeZone: S.tz, ...o }).format(d) : '—';
  const hm = (d) => tf(d, { hour: '2-digit', minute: '2-digit', hour12: false });
  const dayName = (d) => tf(d, { weekday: 'long', day: 'numeric', month: 'long' });
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const deg = (lon) => fa(R.fmtDeg(lon));
  function computeNatal() { natal = AC.chart(St.birthUTC(S.profile), S.profile.birthLat, S.profile.birthLon, S.houseSystem); }
  function ctxAt(d) { const tr = AC.transits(d, natal); return { natal, tr, date: d, hours: AC.planetaryHours(d, S.loc.lat, S.loc.lon), voc: AC.voidOfCourse(d), moon: AC.moonInfo(d) }; }
  computeNatal();

  // background sky
  const sky = new Sky($('#sky'), { lat: S.loc.lat, lon: S.loc.lon }); sky.red = S.red; document.body.classList.toggle('red', S.red);
  sky.start();
  function setView(v) {
    view = v; document.querySelectorAll('.view').forEach((e) => e.classList.toggle('on', e.id === 'v-' + v));
    document.querySelectorAll('#tabs button').forEach((b) => b.classList.toggle('on', b.dataset.v === v));
    const live = v === 'sky'; sky.interactive = live; sky.auto = live ? 0 : 0.015; sky.dim = live ? 0 : 1; document.body.classList.toggle('live', live);
    if (!live) { sky.alt = 40; sky.fov = 100; } closeCard(); render(v);
  }
  document.querySelectorAll('#tabs button').forEach((b) => b.onclick = () => setView(b.dataset.v));

  // ---------- Today ----------
  function moonSVG(frac, waxing, r) { const k = 1 - 2 * frac, rx = Math.abs(k) * r; const sw = waxing ? 1 : 0;
    return `<svg viewBox="0 0 ${2 * r + 8} ${2 * r + 8}" class="moonsvg"><defs><radialGradient id="mg" cx="40%" cy="38%"><stop offset="0" stop-color="#fffbea"/><stop offset="1" stop-color="#d9cfae"/></radialGradient><filter id="mgl"><feGaussianBlur stdDeviation="3"/></filter></defs>
    <circle cx="${r + 4}" cy="${r + 4}" r="${r}" fill="#f6efd2" opacity=".25" filter="url(#mgl)"/><circle cx="${r + 4}" cy="${r + 4}" r="${r}" fill="#25213f"/>
    <path d="M${r + 4},4 A${r},${r} 0 0 ${sw} ${r + 4},${2 * r + 4} A${rx},${r} 0 0 ${k > 0 ? (sw ? 0 : 1) : sw} ${r + 4},4Z" fill="url(#mg)"/></svg>`; }
  function renderToday() {
    const d = new Date(), c = ctxAt(d), dl = R.daily(c), cur = c.hours.hours.find((h) => d >= h.start && d < h.end);
    const waxing = c.moon.phase < 180;
    const top = dl.top.slice(0, 4).map((a) => `<li><b>${R.P[a.a].g}</b> ${R.P[a.a].fa} <i>${R.ASP[a.aspect].g} ${R.ASP[a.aspect].fa}</i> ${R.P[a.b].fa} تولدت <small>${fa(a.orb.toFixed(1))}°</small></li>`).join('');
    const vocTxt = dl.voc && dl.voc.start ? (dl.voc.start <= new Date(d.getTime() + 36 * 3600e3) ? `${dayName(dl.voc.start)} ساعت ${hm(dl.voc.start)} تا ${hm(dl.voc.end)}` : null) : null;
    $('#v-today').innerHTML = `
      <header class="hello"><div class="date">${dayName(d)}</div><h1>سلام ${esc(S.profile.name)} <span class="spark">✦</span></h1><p class="sub">${R.MOON_SIGN[dl.moonSign]}</p></header>
      <article class="glass card hero" id="mood">
        <div class="moonbox">${moonSVG(c.moon.frac, waxing, 46)}</div>
        <div><div class="k">حال‌وهوای امروز</div><div class="big">${dl.mood[1]} ${dl.mood[0]}</div>
        <div class="muted">ماه در ${R.S[dl.moonSign][1]} ${R.S[dl.moonSign][0]} · ${dl.phase[0]} · ${fa(Math.round(c.moon.frac * 100))}٪ روشن</div></div>
      </article>
      ${dl.mercuryRetro ? `<article class="glass card warn"><b>☿ عطارد برگشتی است</b><p>قراردادها و متن‌های مهم را دوبار بخوان، از وسایل الکترونیکی پشتیبان بگیر و برای رفت‌وآمد زمان اضافه بگذار.</p></article>` : ''}
      <article class="glass card"><h3>امروز بهتره…</h3><ul class="do">${dl.dos.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
        <h3 class="no">امروز بهتره نه…</h3><ul class="dont">${dl.donts.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></article>
      <article class="glass card"><h3>ساعت‌های خوب امروز <small>(ساعات سیاره‌ای ${esc(S.loc.name)})</small></h3>
        ${cur ? `<div class="nowhour">الان ساعت ${R.P[cur.ruler].fa} ${R.P[cur.ruler].g} تا ${hm(cur.end)}</div>` : ''}
        <div class="hours">${dl.good.map((h) => `<div class="hr ${cur && cur.start - h.start === 0 ? 'cur' : ''}"><b>${R.P[h.ruler].g} ${hm(h.start)}–${hm(h.end)}</b><span>${h.purpose}</span></div>`).join('')}</div>
        <div class="muted">طلوع ${hm(c.hours.rise)} · غروب ${hm(c.hours.set)}</div></article>
      <div class="row2">
        <article class="glass card color"><div class="sw" style="background:${dl.color.hex}"></div><div class="k">رنگ لباس امروز</div><b>${dl.color.name}</b><div class="muted">${dl.color.why}</div></article>
        <article class="glass card hold"><div class="k">⏳ تصمیم بزرگ نگیر</div>${vocTxt ? `<b>${fa(vocTxt)}</b><div class="muted">ماه «بی‌جهت» است (Void of Course)</div>` : `<b>امروز پنجره‌ی خالی ماه نداریم</b><div class="muted">برای تصمیم‌ها آزادتری</div>`}</article>
      </div>
      <article class="glass card"><h3>ترانزیت‌های مهم امروز</h3><ul class="tr">${top || '<li>امروز آسمان آرام است.</li>'}</ul></article>
      <p class="disc">آسمانه برای الهام و سرگرمی است، نه پیش‌بینی قطعی. تصمیم نهایی همیشه با خودت. 🤍</p>`;
  }

  // ---------- Card ----------
  const card = $('#card');
  function closeCard() { card.hidden = true; card.classList.remove('up'); }
  function openCard(hit) {
    const d = sky.date(), c = ctxAt(d); let rd, facts = '';
    if (hit.type === 'body') {
      rd = R.bodyReading(hit.id, c); const rs = AC.riseSet(hit.id, d, S.loc.lat, S.loc.lon), h = AC.horizon(hit.id, d, S.loc.lat, S.loc.lon), mag = hit.id === 'Sun' ? -26.7 : AC.magnitude(hit.id, d);
      const dist = hit.id === 'Moon' ? fa(Math.round(h.dist * 149597870.7).toLocaleString('en')) + ' کیلومتر' : fa(h.dist.toFixed(2)) + ' واحد نجومی';
      facts = `<div class="facts"><span>فاصله<b>${dist}</b></span><span>قدر<b>${mag != null ? fa(mag.toFixed(1)) : '—'}</b></span><span>ارتفاع<b>${fa(h.alt.toFixed(0))}°</b></span><span>طلوع<b>${hm(rs.rise)}</b></span><span>غروب<b>${hm(rs.set)}</b></span></div>`;
    } else if (hit.id >= 0) { rd = R.signReading(hit.id, c); facts = `<div class="facts"><span>صورت فلکی<b>${esc(hit.cons.fa)}</b></span><span>لاتین<b>${esc(hit.cons.en)}</b></span></div>`; }
    else { rd = { title: hit.cons.fa, lines: [`صورت فلکی ${hit.cons.fa} (${hit.cons.en}). این صورت فلکی جزو دوازده برج منطقة‌البروج نیست؛ روی یکی از برج‌های طلایی یا یک سیاره بزن تا پیام امروزت را بگیری.`], dos: [], donts: [] }; }
    card.innerHTML = `<div class="grab"></div><button class="x" aria-label="بستن">✕</button><h2>${esc(rd.title)}</h2>${facts}
      <div class="lines">${rd.lines.map((l) => `<p>${esc(fa(l))}</p>`).join('')}</div>
      ${rd.dos.length ? `<h3>امروز بهتره…</h3><ul class="do">${rd.dos.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      ${rd.donts.length ? `<h3 class="no">امروز بهتره نه…</h3><ul class="dont">${rd.donts.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      <p class="disc">برای الهام و سرگرمی ✦</p>`;
    card.hidden = false; requestAnimationFrame(() => card.classList.add('up')); card.querySelector('.x').onclick = closeCard;
    if (rd.dos.length) { St.addReading(S, { day: R.dayKey(d), target: hit.type + ':' + hit.id, title: rd.title, dos: rd.dos, donts: rd.donts, at: d.toISOString() }); St.save(S); }
  }
  sky.onTap = (h) => { if (view === 'sky') openCard(h); };
  // swipe down to close
  let sy = null; card.addEventListener('touchstart', (e) => { if (card.scrollTop <= 0) sy = e.touches[0].clientY; }, { passive: true });
  card.addEventListener('touchend', (e) => { if (sy != null && e.changedTouches[0].clientY - sy > 80) closeCard(); sy = null; });

  // ---------- Sky controls ----------
  const slider = $('#t-slider');
  function tLabel() { const d = sky.date(); $('#t-label').textContent = `${dayName(d)} · ${hm(d)}${sky.offsetH ? '' : ' (اکنون)'}`; }
  slider.oninput = () => { sky.offsetH = +slider.value; sky.refresh(); tLabel(); };
  $('#b-now').onclick = () => { slider.value = 0; sky.offsetH = 0; sky.refresh(); tLabel(); };
  setInterval(() => view === 'sky' && tLabel(), 15000);
  $('#b-red').onclick = () => { S.red = !S.red; sky.red = S.red; document.body.classList.toggle('red', S.red); $('#b-red').classList.toggle('on', S.red); St.save(S); };
  $('#b-labels').onclick = () => { sky.labels = !sky.labels; $('#b-labels').classList.toggle('on', sky.labels); };
  $('#b-compass').onclick = async () => {
    if (sky.compass) { sky.compass = false; $('#b-compass').classList.remove('on'); return; }
    try { if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) { const p = await DeviceOrientationEvent.requestPermission(); if (p !== 'granted') throw new Error('denied'); }
      sky.compass = true; $('#b-compass').classList.add('on'); toast('گوشی را رو به آسمان بگیر ✦'); }
    catch (e) { toast('اجازه‌ی قطب‌نما داده نشد؛ با کشیدن انگشت بچرخ'); }
  };
  function toast(t) { const el = document.createElement('div'); el.className = 'toast glass'; el.textContent = t; document.body.appendChild(el); setTimeout(() => el.remove(), 2600); }

  // ---------- Chart ----------
  function renderChart() {
    const p = natal.planets, b = St.birthUTC(S.profile);
    const rows = Object.keys(p).map((k) => `<tr data-b="${k}"><td>${R.P[k].g} ${R.P[k].fa}</td><td>${deg(p[k].lon)}${p[k].retro ? ' ℞' : ''}</td><td>${fa(p[k].house)}</td></tr>`).join('');
    const asp = natal.aspects.slice(0, 10).map((a) => `<li>${R.P[a.a].fa} ${R.ASP[a.aspect].g} ${R.P[a.b].fa} <small>${fa(a.orb.toFixed(1))}°</small></li>`).join('');
    $('#v-chart').innerHTML = `<header class="hello"><h1>چارت تولد</h1><p class="sub">${esc(S.profile.name)} · ${tf(b, { dateStyle: 'long' })} · ${fa(S.profile.birthLocal.slice(11))} · ${esc(S.profile.birthPlace)}</p></header>
      <div class="glass card wheelbox">${wheelSVG(natal)}</div>
      <div class="big3"><div class="glass card"><div class="k">خورشید</div><b>${R.S[p.Sun.sign][1]} ${R.S[p.Sun.sign][0]}</b></div><div class="glass card"><div class="k">ماه</div><b>${R.S[p.Moon.sign][1]} ${R.S[p.Moon.sign][0]}</b></div><div class="glass card"><div class="k">طالع</div><b>${R.S[AC.signOf(natal.asc)][1]} ${R.S[AC.signOf(natal.asc)][0]}</b></div></div>
      <article class="glass card"><table class="pt"><tr><th>سیاره</th><th>موقعیت</th><th>خانه</th></tr>${rows}<tr><td>AC طالع</td><td>${deg(natal.asc)}</td><td>۱</td></tr><tr><td>MC میانه‌ی آسمان</td><td>${deg(natal.mc)}</td><td>۱۰</td></tr></table>
      <div class="muted">سیستم خانه: ${natal.system === 'placidus' ? 'پلاسیدوس' : 'برج کامل'} · زودیاک گرمسیری</div></article>
      <article class="glass card"><h3>زاویه‌های تولد</h3><ul class="tr">${asp}</ul></article>`;
    document.querySelectorAll('#v-chart .wp, #v-chart tr[data-b]').forEach((el) => el.onclick = () => openCard({ type: 'body', id: el.dataset.b }));
  }

  // ---------- Moon ----------
  const PROMPTS = ['امسال در این چرخه چه چیزی را می‌خواهی در زندگی‌ات بکاری؟', 'یک قدم کوچک برای نیتت چیست؟', 'چه مانعی پیش آمده و چطور از آن عبور می‌کنی؟', 'چه چیزی را باید صیقل بدهی؟',
    'امروز چه چیزی روشن شد؟ از چه چیزی ممنونی؟', 'چه آموخته‌ای را می‌خواهی با کسی تقسیم کنی؟', 'چه چیزی را باید رها کنی؟', 'برای شروع تازه، به چه استراحتی نیاز داری؟'];
  function renderMoon() {
    const d = new Date(), m = AC.moonInfo(d), pi = R.phaseIndex(m.phase), qn = ['ماه نو', 'تربیع اول', 'ماه کامل', 'تربیع آخر'];
    const nexts = m.next.filter((q) => q.q === 0 || q.q === 2).slice(0, 4).map((q) => `<li><b>${q.q ? '🌕' : '🌑'} ${qn[q.q]}</b> ${dayName(q.date)} · ${hm(q.date)}</li>`).join('');
    const notes = S.notes.slice(0, 30).map((n) => `<li><div class="muted">${dayName(new Date(n.at))} · ${esc(n.phase)}</div>${esc(n.text)}</li>`).join('') || '<li class="muted">هنوز یادداشتی نداری.</li>';
    const hist = S.readings.slice(0, 15).map((r) => `<li><div class="muted">${dayName(new Date(r.at))}</div><b>${esc(r.title)}</b> — ${esc(r.dos[0] || '')}</li>`).join('') || '<li class="muted">روی سیاره‌ها و برج‌ها در آسمان بزن تا پیام‌ها اینجا جمع شوند.</li>';
    $('#v-moon').innerHTML = `<header class="hello"><h1>دفترچه‌ی ماه</h1><p class="sub">${R.MOON_PHASE[pi][0]} · ${fa(Math.round(m.frac * 100))}٪ روشن · ${fa(m.age.toFixed(1))} روزه</p></header>
      <div class="bigmoon">${moonSVG(m.frac, m.phase < 180, 90)}</div>
      <article class="glass card"><p class="lead">${R.MOON_PHASE[pi][1]}</p><label class="k" for="note">${PROMPTS[pi]}</label><textarea id="note" rows="3" placeholder="بنویس…"></textarea><button id="b-save" class="btn">ذخیره در دفترچه ✦</button></article>
      <article class="glass card"><h3>ماه نو و کامل پیش رو</h3><ul class="tr">${nexts}</ul></article>
      <article class="glass card"><h3>یادداشت‌های من</h3><ul class="notes">${notes}</ul></article>
      <article class="glass card"><h3>تاریخچه‌ی پیام‌ها</h3><ul class="notes">${hist}</ul></article>`;
    $('#b-save').onclick = () => { const t = $('#note').value.trim(); if (!t) return; S.notes.unshift({ at: new Date().toISOString(), phase: R.MOON_PHASE[pi][0], text: t }); St.save(S); toast('ذخیره شد 🌙'); renderMoon(); };
  }

  // ---------- Settings ----------
  function renderSet() {
    const p = S.profile;
    $('#v-set').innerHTML = `<header class="hello"><h1>تنظیمات</h1><p class="sub">همه‌چیز فقط روی گوشی خودت ذخیره می‌شود.</p></header>
      <article class="glass card form"><h3>پروفایل تولد</h3>
        <label>نام<input id="f-name" value="${esc(p.name)}"></label>
        <label>تاریخ و ساعت تولد (میلادی، به وقت محلی تولد)<input id="f-bt" type="datetime-local" value="${esc(p.birthLocal)}"></label>
        <label>اختلاف ساعت با UTC در زمان تولد<input id="f-tz" type="number" step="0.5" value="${p.tzOffset}"></label>
        <div class="two"><label>عرض جغرافیایی<input id="f-blat" type="number" step="0.01" value="${p.birthLat}"></label><label>طول جغرافیایی<input id="f-blon" type="number" step="0.01" value="${p.birthLon}"></label></div>
        <label>محل تولد<input id="f-bp" value="${esc(p.birthPlace)}"></label>
        <label>سیستم خانه<select id="f-hs"><option value="placidus" ${S.houseSystem === 'placidus' ? 'selected' : ''}>پلاسیدوس</option><option value="whole" ${S.houseSystem === 'whole' ? 'selected' : ''}>برج کامل (Whole Sign)</option></select></label>
      </article>
      <article class="glass card form"><h3>مکان فعلی</h3>
        <div class="two"><label>عرض<input id="f-lat" type="number" step="0.01" value="${S.loc.lat}"></label><label>طول<input id="f-lon" type="number" step="0.01" value="${S.loc.lon}"></label></div>
        <label>نام مکان<input id="f-ln" value="${esc(S.loc.name)}"></label>
        <button id="b-geo" class="btn ghost">📍 استفاده از موقعیت فعلی</button></article>
      <button id="b-apply" class="btn">ذخیره ✦</button>
      <article class="glass card form"><h3>پشتیبان</h3><div class="two"><button id="b-exp" class="btn ghost">خروجی JSON</button><button id="b-imp" class="btn ghost">ورود JSON</button></div><input id="f-file" type="file" accept="application/json,.json" hidden></article>
      <p class="disc">آسمانه — موقعیت سیارات با کتابخانه‌ی Astronomy Engine محاسبه می‌شود و ستاره‌ها از کاتالوگ Yale BSC هستند. تفسیرها برای الهام و سرگرمی است.</p>`;
    $('#b-apply').onclick = () => {
      S.profile = { name: $('#f-name').value.trim() || 'دوست', birthLocal: $('#f-bt').value || p.birthLocal, tzOffset: +$('#f-tz').value, birthLat: +$('#f-blat').value, birthLon: +$('#f-blon').value, birthPlace: $('#f-bp').value };
      S.houseSystem = $('#f-hs').value; S.loc = { lat: +$('#f-lat').value, lon: +$('#f-lon').value, name: $('#f-ln').value || '—' };
      St.save(S); computeNatal(); sky.lat = S.loc.lat; sky.lon = S.loc.lon; sky.refresh(); toast('ذخیره شد ✦');
    };
    $('#b-geo').onclick = () => navigator.geolocation ? navigator.geolocation.getCurrentPosition((pos) => { $('#f-lat').value = pos.coords.latitude.toFixed(3); $('#f-lon').value = pos.coords.longitude.toFixed(3); $('#f-ln').value = 'موقعیت من'; toast('موقعیت گرفته شد؛ ذخیره را بزن'); }, () => toast('دسترسی به موقعیت داده نشد')) : toast('در دسترس نیست');
    $('#b-exp').onclick = () => { const blob = new Blob([St.exportJSON(S)], { type: 'application/json' }), a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'asmaneh-backup.json'; a.click(); };
    $('#b-imp').onclick = () => $('#f-file').click();
    $('#f-file').onchange = async (e) => { try { S = St.importJSON(await e.target.files[0].text()); St.save(S); computeNatal(); toast('بازیابی شد'); renderSet(); } catch (err) { toast(err.message); } };
  }
  function render(v) { if (v === 'today') renderToday(); if (v === 'chart') renderChart(); if (v === 'moon') renderMoon(); if (v === 'set') renderSet(); if (v === 'sky') tLabel(); }
  $('#b-red').classList.toggle('on', S.red);
  // deep link for tests: #sky, #chart ...
  const h = location.hash.slice(1); setView(['today', 'sky', 'chart', 'moon', 'set'].includes(h) ? h : 'today');
  window.__app = { sky, openCard, setView, ctxAt, natal: () => natal };
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js');
})();
