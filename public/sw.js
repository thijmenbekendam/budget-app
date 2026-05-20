const CACHE = 'budget-app-v1';

self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(CACHE).then(c => c.add('/budget-app/')).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', evt => {
  if (evt.request.method !== 'GET') return;
  evt.respondWith(
    caches.open(CACHE).then(async cache => {
      const cached = await cache.match(evt.request);
      const network = fetch(evt.request)
        .then(res => { if (res.ok) cache.put(evt.request, res.clone()); return res; })
        .catch(() => cached);
      return cached ?? network;
    })
  );
});
