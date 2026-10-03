/* Public shell only. Auth, API responses, attachments and private records never enter this cache. */
const SHELL_CACHE = 'abangcolek-public-shell-v1';
self.addEventListener('install', event => {
  event.waitUntil(caches.open(SHELL_CACHE).then(cache => cache.addAll(['/', '/manifest.webmanifest'])));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('abangcolek-public-shell-') && key !== SHELL_CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/') || url.pathname.includes('/attachments/')) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/').then(response => response || Response.error())));
  } else if (url.pathname.startsWith('/assets/') || url.pathname === '/manifest.webmanifest') {
    event.respondWith(caches.open(SHELL_CACHE).then(async cache => {
      const cached = await cache.match(request); if (cached) return cached;
      const response = await fetch(request);
      if (response.ok && !response.headers.has('set-cookie')) await cache.put(request, response.clone());
      return response;
    }));
  }
});
