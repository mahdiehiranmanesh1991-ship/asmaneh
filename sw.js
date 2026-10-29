// «آسمانه» service worker — offline app shell. Only touches caches named asmaneh-* (origin shared with /harf/ and /kat/).
const VERSION = 'asmaneh-v1.0.1';
const ASSETS = ['./', 'index.html', 'css/app.css', 'manifest.webmanifest', 'fonts/Vazirmatn-Variable.woff2', 'vendor/astronomy.browser.min.js', 'data/sky.js',
  'js/astro-core.js', 'js/readings.js', 'js/store.js', 'js/sky.js', 'js/wheel.js', 'js/app.js', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'icons/maskable-512.png'];
self.addEventListener('install', (e) => e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener('activate', (e) => e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('asmaneh-') && k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url), scope = new URL(self.registration.scope);
  if (e.request.method !== 'GET' || u.origin !== location.origin || !u.pathname.startsWith(scope.pathname)) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request).then((r) => {
    if (r.ok) { const cp = r.clone(); caches.open(VERSION).then((c) => c.put(e.request, cp)); } return r;
  }).catch(() => (e.request.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
});
