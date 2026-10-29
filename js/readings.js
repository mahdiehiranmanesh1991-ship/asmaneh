// «آسمانه» — hand-written Persian astrology message library + deterministic generator (offline, no API).
(function (root, f) { if (typeof module !== 'undefined') module.exports = f(); else root.Readings = f(); })(this, function () {
  const P = {
    Sun: { fa: 'خورشید', g: '☉', core: 'هویت، اعتمادبه‌نفس و نور درونت' }, Moon: { fa: 'ماه', g: '☽', core: 'احساسات، خانه و نیاز به آرامش' },
    Mercury: { fa: 'عطارد', g: '☿', core: 'فکر، کلام، نوشتن و قرارها' }, Venus: { fa: 'زهره', g: '♀', core: 'زیبایی، رابطه، سلیقه و پول' },
    Mars: { fa: 'مریخ', g: '♂', core: 'جرئت، انرژی و دفاع' }, Jupiter: { fa: 'مشتری', g: '♃', core: 'رشد، اقبال، قانون و عدالت' },
    Saturn: { fa: 'زحل', g: '♄', core: 'نظم، مسئولیت، زمان و ساختار' }, Uranus: { fa: 'اورانوس', g: '♅', core: 'تغییر ناگهانی، نوآوری و آزادی' },
    Neptune: { fa: 'نپتون', g: '♆', core: 'رؤیا، شهود و هنر' }, Pluto: { fa: 'پلوتو', g: '♇', core: 'قدرت پنهان، تحول و عمق' },
    Asc: { fa: 'طالع', g: 'AC', core: 'شیوه‌ی حضورت و اولین برداشت دیگران' }, MC: { fa: 'میانه‌ی آسمان', g: 'MC', core: 'شغل، اعتبار و مسیر حرفه‌ای' } };
  const S = [
    ['حمل', '♈', 'آتش', 'شجاع و پیشگام'], ['ثور', '♉', 'خاک', 'آرام و پایدار'], ['جوزا', '♊', 'باد', 'کنجکاو و حرّاف'], ['سرطان', '♋', 'آب', 'مهربان و خانه‌دوست'],
    ['اسد', '♌', 'آتش', 'درخشان و سخاوتمند'], ['سنبله', '♍', 'خاک', 'دقیق و کاربلد'], ['میزان', '♎', 'باد', 'منصف و زیبادوست'], ['عقرب', '♏', 'آب', 'عمیق و نافذ'],
    ['قوس', '♐', 'آتش', 'خوش‌بین و آزاده'], ['جدی', '♑', 'خاک', 'جدی و هدفمند'], ['دلو', '♒', 'باد', 'نوآور و مستقل'], ['حوت', '♓', 'آب', 'شهودی و رؤیایی']];
  const HOUSE = ['', 'خودت، ظاهر و شروع‌ها', 'پول، درآمد و ارزش‌هایت', 'گفت‌وگو، نوشتن و رفت‌وآمدهای کوتاه (مثل رانندگی تا دادگاه)', 'خانه، خانواده و گربه‌ات',
    'خلاقیت، تفریح و دل‌خوشی‌ها', 'کار روزمره، پرونده‌ها و سلامت', 'موکل‌ها، شریک‌ها و طرف دعوا', 'منابع مشترک، اسرار و تحول عمیق',
    'قانون، دانش، کتاب و سفر', 'شغل، اعتبار و دیده‌شدن', 'دوستان، شبکه‌ی همکاران و آرزوها', 'استراحت، خلوت و دنیای درون'];
  const ASP = { conj: { fa: 'مقارنه', g: '☌', tone: 'mix' }, sext: { fa: 'تسدیس', g: '⚹', tone: 'flow' }, tri: { fa: 'تثلیث', g: '△', tone: 'flow' }, sq: { fa: 'تربیع', g: '□', tone: 'tense' }, opp: { fa: 'مقابله', g: '☍', tone: 'tense' } };
  // What each transiting planet "brings", by tone
  const ENERGY = {
    Sun: { flow: ['نور تازه‌ای روی', 'وضوح و اعتمادبه‌نفس به'], tense: ['فشار دیده‌شدن روی', 'کشمکش غرور با'], mix: ['تمرکز همه‌ی نورت روی'] },
    Moon: { flow: ['حس امنیت به', 'نرمی احساس به'], tense: ['نوسان حال روی', 'حساسیت زیاد به'], mix: ['موج احساس روی'] },
    Mercury: { flow: ['ذهن تیز و کلام روان به', 'ایده‌های دقیق برای'], tense: ['سوءتفاهم احتمالی در', 'شلوغی ذهن درباره‌ی'], mix: ['فکر و گفت‌وگوی پررنگ درباره‌ی'] },
    Venus: { flow: ['لطف و جذابیت به', 'هماهنگی شیرین در'], tense: ['وسوسه‌ی زیاده‌روی در', 'توقع بیش از اندازه از'], mix: ['زیبایی و محبت به'] },
    Mars: { flow: ['جرئت و انرژی عمل به', 'قدرت پیش‌بردن در'], tense: ['تندی و عجله در', 'اصطکاک و بحث در'], mix: ['آتش و انگیزه‌ی تازه در'] },
    Jupiter: { flow: ['اقبال و گشایش در', 'دست‌ودلبازی آسمان با'], tense: ['خوش‌بینی بیش از حد درباره‌ی', 'وعده‌دادن زیاد در'], mix: ['رشد بزرگی در'] },
    Saturn: { flow: ['پایداری و نظم به', 'نتیجه‌ی صبر در'], tense: ['سنگینی مسئولیت در', 'مانع و تأخیر در'], mix: ['جدیت و آزمون در'] },
    Uranus: { flow: ['ایده‌ی نو و آزادی در', 'غافلگیری خوشایند در'], tense: ['تغییر ناگهانی در', 'بی‌قراری درباره‌ی'], mix: ['بیداری تازه در'] },
    Neptune: { flow: ['شهود و الهام در', 'لطافت هنری در'], tense: ['ابهام و مه در', 'خیال‌پردازی درباره‌ی'], mix: ['رؤیایی‌شدن'] },
    Pluto: { flow: ['قدرت عمیق در', 'نفوذ و اثرگذاری در'], tense: ['فشار تحول در', 'کشمکش قدرت در'], mix: ['دگرگونی ریشه‌ای در'] } };
  // Natal point → life area (her life)
  const AREA = {
    Sun: 'هویت و جایگاهت', Moon: 'حال دل و خانه‌ات', Mercury: 'لایحه‌ها و حرف‌زدنت', Venus: 'رابطه‌ها و سلیقه‌ات', Mars: 'قدرت دفاعت',
    Jupiter: 'ایمانت به عدالت', Saturn: 'نظم کاری‌ات', Uranus: 'استقلالت', Neptune: 'شهودت', Pluto: 'قدرت درونی‌ات', Asc: 'حضور و ظاهرت', MC: 'اعتبار حرفه‌ای‌ات' };
  // Do / don't actions per transiting planet and tone (hand-written)
  const DO = {
    Sun: { flow: ['در جلسه حرف اول را خودت بزن؛ صدایت امروز شنیده می‌شود', 'یک کار نیمه‌تمام را با افتخار تمام کن و به خودت جایزه بده', 'لباس روشن و درخشان بپوش و آگاهانه دیده شو'], tense: ['قبل از جواب‌دادن، سه نفس عمیق بکش', 'به‌جای اثبات خودت، روی نتیجه‌ی پرونده تمرکز کن'], mix: ['یک هدف شخصی را روی کاغذ بنویس و امروز اولین قدمش را بردار'] },
    Moon: { flow: ['به خانه و گوشه‌ی دنج خودت رسیدگی کن', 'با گربه‌ات وقت آرام بگذران؛ حس امنیتت شارژ می‌شود', 'به حس اولت درباره‌ی موکل جدید اعتماد کن'], tense: ['حال لحظه‌ای را با واقعیت اشتباه نگیر', 'یک چای گرم و ده دقیقه سکوت به خودت هدیه بده'], mix: ['احساست را در دفترچه‌ی ماه بنویس'] },
    Mercury: { flow: ['لایحه یا دفاعیه‌ی مهم را امروز بنویس؛ کلمه‌ها روان می‌آیند', 'با موکل‌ها تماس بگیر و پیگیری‌های عقب‌افتاده را انجام بده', 'چند صفحه کتاب حقوقی یا رمان بخوان'], tense: ['متن مهم را قبل از ارسال دوباره بخوان', 'شماره‌ی پرونده و تاریخ جلسه را دوباره چک کن', 'مسیر رانندگی را از قبل ببین و زودتر راه بیفت'], mix: ['ایده‌هایت را سریع یادداشت کن؛ ذهنت پر از جرقه است'] },
    Venus: { flow: ['با یک ست شیک و رنگ ملایم به جلسه برو', 'برای مذاکره و صلح میان طرفین وقت بگذار', 'یک چیز زیبای کوچک برای خانه بخر یا گل بگذار'], tense: ['خرید احساسی را به فردا موکول کن', 'به خاطر رودربایستی چیزی را قبول نکن'], mix: ['از کسی که کمکت کرده با محبت تشکر کن'] },
    Mars: { flow: ['پرونده‌ی سخت را امروز با جسارت جلو ببر', 'ورزش کن یا پیاده‌روی تند برو', 'از حق موکلت محکم و بی‌تردید دفاع کن'], tense: ['آرام رانندگی کن و فاصله را حفظ کن', 'بحث بی‌نتیجه را رها کن و انرژی‌ات را برای دادگاه نگه دار', 'تصمیم عصبانی نگیر؛ یک ساعت صبر کن'], mix: ['یک کار عقب‌افتاده را همین امروز شروع کن'] },
    Jupiter: { flow: ['درخواست بزرگ را مطرح کن؛ احتمال «بله» بیشتر است', 'یک دوره یا کتاب تازه شروع کن', 'به همکار یا کارآموز جوان کمک کن؛ خیرش برمی‌گردد'], tense: ['قول بیش از توانت نده', 'جزئیات قرارداد را با دقت بخوان، نه فقط کلیاتش'], mix: ['افق بلندمدت کارت را ببین و یک قدم بلند بردار'] },
    Saturn: { flow: ['برنامه‌ی هفته را منظم بچین؛ امروز نظم پاداش می‌دهد', 'پرونده‌های قدیمی را مرتب و بایگانی کن', 'روی مهارتی کار کن که سال‌ها به کارت می‌آید'], tense: ['از خودت بیش از حد انتظار نداشته باش', 'کار را تکه‌تکه کن و یکی‌یکی جلو برو', 'اگر کاری عقب افتاد، به جای سرزنش، مسیر را اصلاح کن'], mix: ['مسئولیتی را که مدت‌ها عقب انداختی بپذیر'] },
    Uranus: { flow: ['یک روش تازه برای کارت امتحان کن؛ یک اپ، یک قالب جدید', 'مسیر همیشگی را عوض کن و از تازگی لذت ببر'], tense: ['برای تغییر برنامه‌ی ناگهانی، یک برنامه‌ی جایگزین داشته باش', 'از کارهای پرخطر و تصمیم‌های لحظه‌ای دوری کن'], mix: ['به ایده‌ی عجیبی که به ذهنت رسید فرصت بده'] },
    Neptune: { flow: ['به شهودت درباره‌ی آدم‌ها گوش بده', 'موسیقی، شعر یا نقاشی را وارد روزت کن', 'مراقبه یا قدم‌زدن آرام زیر آسمان شب'], tense: ['هر توافقی را مکتوب کن', 'حرف‌های مبهم را با سؤال روشن کن'], mix: ['کمی خیال‌پردازی کن، اما پایت روی زمین باشد'] },
    Pluto: { flow: ['به عمق پرونده برو؛ امروز نکته‌ی پنهان را پیدا می‌کنی', 'عادتی را که دیگر به کارت نمی‌آید رها کن'], tense: ['وارد بازی قدرت نشو', 'رازی را که به تو سپرده‌اند محکم نگه دار'], mix: ['اجازه بده چیزی قدیمی تمام شود تا چیزی تازه شروع شود'] } };
  const DONT = {
    Sun: ['خودت را با دیگران مقایسه کنی', 'برای دیده‌شدن تند حرف بزنی'], Moon: ['با گرسنگی و خستگی تصمیم بگیری', 'دلخوری کوچک را بزرگ کنی'],
    Mercury: ['قرارداد مهم را بدون بازخوانی امضا کنی', 'پیام مهم را با عجله بفرستی', 'وسط رانندگی با تلفن کار کاری انجام بدهی'],
    Venus: ['خرید گران احساسی کنی', 'برای راضی‌کردن همه از حق خودت بگذری'], Mars: ['در ترافیک عصبانی شوی', 'در جلسه با تندی جواب بدهی', 'چند کار سنگین را با هم شروع کنی'],
    Jupiter: ['وعده‌ی بزرگ و بی‌پشتوانه بدهی', 'در خرج‌کردن زیاده‌روی کنی'], Saturn: ['خودت را سرزنش کنی', 'از استراحت بزنی تا کار بیشتری کنی'],
    Uranus: ['ناگهانی چیزی را به‌هم بزنی', 'برنامه را بدون اطلاع به بقیه عوض کنی'], Neptune: ['به حرف شفاهی بی‌سند تکیه کنی', 'از واقعیت فرار کنی'],
    Pluto: ['کسی را کنترل کنی یا بگذاری کنترلت کنند', 'کینه‌ی قدیمی را زنده کنی'] };
  const MOON_SIGN = [
    'روز شروع‌های سریع؛ کار را زود آغاز کن', 'روز آرامش و لذت‌های ساده؛ غذای خوب و کار بی‌عجله', 'روز تماس‌ها و پیام‌ها؛ ذهن کنجکاو است', 'روز خانه و مهربانی؛ دل نازک‌تر است',
    'روز درخشیدن و خلاقیت؛ کمی نمایش اشکالی ندارد', 'روز جزئیات و نظم؛ پرونده‌ها را مرتب کن', 'روز تعادل و مذاکره؛ زیبایی و انصاف مهم است', 'روز عمق و تمرکز؛ حقیقت پنهان رو می‌شود',
    'روز افق‌های باز؛ یادگیری و خوش‌بینی', 'روز کار جدی و نتیجه؛ قدم‌های محکم', 'روز ایده‌های نو و دوستان؛ کمی متفاوت فکر کن', 'روز شهود و لطافت؛ به رؤیاها گوش بده'];
  const MOON_PHASE = [
    ['ماه نو', 'وقت کاشتن نیت است. یک خواسته‌ی روشن بنویس.'], ['هلال رو به رشد', 'نیتت جوانه زده؛ یک قدم کوچک برایش بردار.'], ['تربیع اول', 'اولین مانع پیدا می‌شود؛ محکم ادامه بده.'],
    ['تحدب رو به رشد', 'وقت صیقل‌دادن و اصلاح جزئیات است.'], ['ماه کامل', 'همه‌چیز روشن می‌شود؛ نتیجه‌ها را جشن بگیر و رها کن.'], ['تحدب رو به کاهش', 'آموخته‌هایت را با دیگران تقسیم کن.'],
    ['تربیع آخر', 'چیزی را که دیگر لازم نیست کنار بگذار.'], ['هلال پایانی', 'استراحت کن و برای چرخه‌ی تازه آماده شو.']];
  const COLORS = { Sun: ['طلایی و کرم', '#e8c26a'], Moon: ['نقره‌ای و سفید صدفی', '#dfe3ee'], Mars: ['زرشکی و قرمز آجری', '#a3313c'], Mercury: ['زرد لیمویی و خاکستری روشن', '#d9cf6a'],
    Jupiter: ['سرمه‌ای و بنفش سلطنتی', '#3f3a8c'], Venus: ['صورتی پودری و سبز نعنایی', '#e9b6c4'], Saturn: ['مشکی، ذغالی و قهوه‌ای تیره', '#3a3330'] };
  const PURPOSE = { Jupiter: 'جلسه‌ی دادگاه، درخواست و مذاکره‌ی بزرگ', Venus: 'دیدار با موکل، صلح و خرید', Sun: 'ارائه، دیده‌شدن و جلسه‌ی مهم', Mercury: 'نوشتن لایحه، تماس و قرارداد',
    Moon: 'کارهای خانه، گربه و استراحت', Mars: 'ورزش و کارهای سخت', Saturn: 'نظم‌دادن، بایگانی و کار تمرکزی' };
  const OPENERS = ['امروز آسمان می‌گوید', 'پیام ستاره‌ها برای تو', 'نجوای امروز آسمان', 'حال‌وهوای امروز', 'آسمان امروز آرام زمزمه می‌کند'];

  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let a = hash(seed); return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function pick(r, arr, used) { const pool = arr.filter((x) => !used.has(x)); const src = pool.length ? pool : arr; const x = src[Math.floor(r() * src.length)]; used.add(x); return x; }
  const dayKey = (d) => new Date(d.getTime() + 3.5 * 3600e3).toISOString().slice(0, 10);
  const fmtDeg = (lon) => { const s = Math.floor(lon / 30), d = lon % 30; return `${Math.floor(d)}°${String(Math.floor((d % 1) * 60)).padStart(2, '0')}′ ${S[s][0]}`; };

  // Reading for a tapped body
  function bodyReading(body, ctx) {
    const { natal, tr, date } = ctx, used = new Set(), r = rng(dayKey(date) + body);
    const np = natal.planets[body], tp = tr.now[body], house = tp.house;
    const asps = tr.aspects.filter((a) => a.a === body).slice(0, 3);
    const dos = [], donts = [], lines = [];
    lines.push(`${P[body].fa} امروز در ${fmtDeg(tp.lon)} است و از خانه‌ی ${house} چارت تو می‌گذرد: ${HOUSE[house]}.`);
    if (asps.length) {
      for (const a of asps) {
        const t = ASP[a.aspect].tone; lines.push(`${pick(r, OPENERS, used)}: ${P[body].fa} با ${ASP[a.aspect].fa} به ${P[a.b].fa} تولدت، ${pick(r, ENERGY[body][t], used)} ${AREA[a.b]} می‌آورد.`);
        dos.push(pick(r, DO[body][t], used));
        if (t !== 'flow') donts.push(pick(r, DONT[body], used));
      }
    } else { lines.push(`${pick(r, OPENERS, used)}: انرژی ${P[body].fa} (${P[body].core}) امروز در پس‌زمینه است و آرام کار می‌کند.`); dos.push(pick(r, DO[body].flow, used)); }
    while (dos.length < 2) dos.push(pick(r, [...DO[body].flow, ...DO[body].mix], used));
    if (!donts.length) donts.push(pick(r, DONT[body], used));
    if (tp.retro) lines.push(`${P[body].fa} برگشتی است: وقت بازنگری است، نه شروع تازه در موضوع «${P[body].core}».`);
    lines.push(`در تولدت ${P[body].fa} در ${fmtDeg(np.lon)} و خانه‌ی ${np.house} بود؛ یعنی ${P[body].core} برای تو با «${HOUSE[np.house]}» گره خورده است.`);
    return { title: `${P[body].g} ${P[body].fa}`, lines, dos: dos.slice(0, 3).slice(), donts: donts.slice(0, 2).slice() };
  }
  function signReading(si, ctx) {
    const { natal, tr, date } = ctx, used = new Set(), r = rng(dayKey(date) + 'sign' + si);
    const natalIn = Object.keys(natal.planets).filter((b) => natal.planets[b].sign === si), nowIn = Object.keys(tr.now).filter((b) => tr.now[b].sign === si);
    const h = [natal.asc, ...natal.cusps.slice(1)].findIndex((c, i) => Math.floor(c / 30) === si) + 1;
    const lines = [`برج ${S[si][0]} ${S[si][1]} — عنصر ${S[si][2]}، ${S[si][3]}.`];
    if (natalIn.length) lines.push(`در تولدت ${natalIn.map((b) => P[b].fa).join('، ')} در این برج بود؛ این بخشی از امضای شخصیت توست.`);
    if (h > 0) lines.push(`این برج روی خانه‌ی ${h} چارتت است: ${HOUSE[h]}.`);
    const dos = [], donts = [];
    if (nowIn.length) { lines.push(`الان ${nowIn.map((b) => P[b].fa).join('، ')} از این برج عبور می‌کند.`); nowIn.slice(0, 2).forEach((b) => { dos.push(pick(r, DO[b].flow.concat(DO[b].mix), used)); donts.push(pick(r, DONT[b], used)); }); }
    else { lines.push('امروز هیچ سیاره‌ای در این برج نیست؛ آرام و در پس‌زمینه است.'); dos.push('به ویژگی «' + S[si][3] + '» در خودت فرصت بروز بده'); donts.push('این بخش از زندگی‌ات را فراموش کنی'); }
    return { title: `${S[si][1]} ${S[si][0]}`, lines, dos: dos.slice(), donts: donts.slice() };
  }
  function phaseIndex(phase) { return Math.floor(((phase + 22.5) % 360) / 45); }
  function daily(ctx) {
    const { natal, tr, date, hours, voc, moon } = ctx, used = new Set(), r = rng(dayKey(date) + 'daily');
    const ms = tr.now.Moon.sign, top = tr.aspects.filter((a) => a.a !== 'Moon').slice(0, 4);
    const flow = top.filter((a) => ASP[a.aspect].tone === 'flow').length, tense = top.filter((a) => ASP[a.aspect].tone === 'tense').length;
    const mood = flow > tense ? ['روان و امیدبخش', '✨'] : tense > flow ? ['پرچالش ولی رشددهنده', '🔥'] : ['متعادل و آرام', '🌙'];
    const dos = [], donts = [];
    for (const a of top.slice(0, 3)) { const t = ASP[a.aspect].tone; dos.push(pick(r, DO[a.a][t], used)); if (t === 'tense') donts.push(pick(r, DONT[a.a], used)); }
    if (!dos.length) dos.push(pick(r, DO.Moon.flow, used));
    if (donts.length < 2) donts.push(pick(r, DONT[ms % 2 ? 'Mercury' : 'Mars'], used));
    const good = hours.hours.filter((h) => ['Jupiter', 'Venus', 'Sun', 'Mercury'].includes(h.ruler) && h.day).map((h) => ({ ...h, purpose: PURPOSE[h.ruler] }));
    const col = COLORS[hours.dayRuler];
    const pi = phaseIndex(moon.phase);
    return { mood, moonSign: ms, moonText: MOON_SIGN[ms], phase: MOON_PHASE[pi], phaseIndex: pi, dos: dos.slice(0, 3).slice(), donts: donts.slice(0, 2).slice(),
      good, color: { name: col[0], hex: col[1], why: `امروز روز ${P[hours.dayRuler].fa} است` }, voc, mercuryRetro: tr.now.Mercury.retro, retros: Object.keys(tr.now).filter((b) => tr.now[b].retro), top };
  }
  return { P, S, HOUSE, ASP, ENERGY, DO, DONT, MOON_PHASE, MOON_SIGN, COLORS, bodyReading, signReading, daily, fmtDeg, rng, dayKey, phaseIndex };
});
