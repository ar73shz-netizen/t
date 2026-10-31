// کش پوسته برنامه برای باز شدن سریع و کار در حالت آفلاین
const CACHE = 'pm-shell-v10';
const SHELL = ['./', 'index.html', 'style.css', 'app.js', 'store.js', 'scanner.js', 'config.js', 'manifest.json'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL))); self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // اول شبکه، اگر نبود کش (تا بعد از آپدیت همیشه نسخه جدید بیاید)
  e.respondWith(fetch(e.request).then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request)));
});
