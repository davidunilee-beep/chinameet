const CACHE = 'chinameet-shell-v3-android-install';
const SHELL = ['./', './index.html', './app.css', './install-capture.js', './install.js', './manifest.webmanifest', './icons/app-192.png', './icons/app-512.png', './icons/apple-touch-icon.png', './icons/app-maskable.png'];
const urls = SHELL.map(path => new URL(path, self.registration.scope).href);
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(urls))); self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('chinameet-shell-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', event => {
  // External video and partial media requests must retain normal browser behavior.
  if (event.request.method !== 'GET' || event.request.headers.has('range') || new URL(event.request.url).origin !== self.location.origin) return;
  const asset = new URL(event.request.url); asset.search = ''; asset.hash = '';
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then(response => {
      if (response.ok) { const copy = response.clone(); event.waitUntil(caches.open(CACHE).then(cache => cache.put(new URL('./index.html', self.registration.scope).href, copy))); }
      return response;
    }).catch(() => caches.match(new URL('./index.html', self.registration.scope).href)));
  } else if (urls.includes(asset.href)) {
    event.respondWith(fetch(event.request).then(response => {
      if (response.ok) { const copy = response.clone(); event.waitUntil(caches.open(CACHE).then(cache => cache.put(asset.href, copy))); }
      return response;
    }).catch(() => caches.match(asset.href)));
  }
});
