// === cambia SOLO questa riga per forzare un refresh completo ===
const CACHE = 'backintime-30-05-2026_A';
// ==============================================================================

const ASSETS = [
  './',
  './index.html',
  
  './BackInTime-16.png',
  './BackInTime-32.png',
  './BackInTime-160.png',
  './BackInTime-180.png',
  './BackInTime-192.png',
  './BackInTime-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;

  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  if (url.searchParams.has('_refresh')) {
    event.respondWith(networkFirst(req));
    return;
  }

  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(networkFirst(req));
    return;
  }

  if (url.pathname.endsWith('/service-worker.js')) {
    event.respondWith(networkFirst(req));
    return;
  }

  event.respondWith(cacheFirst(req));
});

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const fresh = await fetch(req, { cache: 'no-store' });
    if (fresh.ok) cache.put(req, fresh.clone());
    return fresh;
  } catch {
    const cached = await cache.match(req);
    return cached || new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(req);
  if (cached) return cached;

  const fresh = await fetch(req);
  if (fresh.ok) cache.put(req, fresh.clone());
  return fresh;
}
