/* Shara's Kitchen — service worker core logic.
   Loaded by the root /sw.js stub (which must sit at root for whole-site scope).
   self.__PRECACHE__ and self.__CACHE_VERSION__ come from kitchen-app/data/precache.js. */
const CACHE = self.__CACHE_VERSION__ || 'shara-kitchen';
const PRECACHE = self.__PRECACHE__ || ['kitchen-app/index.html'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.allSettled(PRECACHE.map(u => c.add(new Request(u, { cache: 'reload' }))));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // Pages, styles, scripts and data: network first, so a published change shows on the very next load;
  // the cache is only the offline fallback (or used if the network takes > 4 s).
  // Images: cache first (they rarely change), refreshed in the background.
  const fresh = req.mode === 'navigate' || url.pathname.endsWith('/') ||
                /\.(html|css|js|json|webmanifest)$/i.test(url.pathname);
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req, { ignoreSearch: true });
    // no-cache = revalidate with the server (cheap 304) instead of trusting the browser's 10-minute HTTP cache
    const network = fetch(fresh ? new Request(req, { cache: 'no-cache' }) : req)
      .then(res => {
        if (res && res.status === 200 && res.type === 'basic') cache.put(req, res.clone());
        return res;
      }).catch(() => null);
    if (fresh) {
      const res = cached ? await Promise.race([network, new Promise(r => setTimeout(r, 4000, null))]) : await network;
      return res || cached || (await cache.match('kitchen-app/index.html'));
    }
    return cached || (await network) || (await cache.match('kitchen-app/index.html'));
  })());
});
