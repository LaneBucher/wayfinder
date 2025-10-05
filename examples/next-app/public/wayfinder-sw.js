// Runtime-caching focused SW
const VERSION = 'wf-v6';

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// Broadcast helper: tell all clients to process the queue
async function broadcast(type) {
  const all = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  for (const c of all) {
    try { c.postMessage({ type }); } catch {}
  }
}

// Background Sync when the browser regains connectivity.
self.addEventListener('sync', (event) => {
  if (event.tag === 'wayfinder-sync') {
    event.waitUntil((async () => {
      await broadcast('wayfinder-sync');
    })());
  }
});

// Periodic Background Sync (where supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'wayfinder-periodic-sync') {
    event.waitUntil((async () => {
      await broadcast('wayfinder-sync');
    })());
  }
});

// helper: safe cache put
async function putSafe(cache, req, res) { try { await cache.put(req, res); } catch {} }

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // 1) Navigations: network-first, fallback to cached '/', or inline offline page
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(VERSION);
      try {
        const net = await fetch(req);
        // keep cached shell up-to-date
        fetch('/').then(r => r.ok && putSafe(cache, '/', r.clone())).catch(()=>{});
        return net;
      } catch {
        const shell = await cache.match('/');
        if (shell) return shell;
        return new Response(
          `<!doctype html><meta charset="utf-8"><title>Offline</title><body style="font-family:system-ui;padding:24px"><h1>Offline</h1><p>Visit online once to cache the app shell.</p>`,
          { status: 503, headers: { 'content-type': 'text/html' } }
        );
      }
    })());
    return;
  }

  // 2) Static assets: cache-first w/ background revalidate
  const url = new URL(req.url);
  const isStatic = url.pathname.startsWith('/_next/static/')
                || url.pathname.startsWith('/static/')
                || /\.(?:js|css|png|jpg|jpeg|svg|woff2)$/.test(url.pathname);

  if (req.method === 'GET' && isStatic) {
    event.respondWith((async () => {
      const cache = await caches.open(VERSION);
      const hit = await cache.match(req);
      if (hit) {
        event.waitUntil(fetch(req).then(r => r.ok && putSafe(cache, req, r.clone())).catch(()=>{}));
        return hit;
      }
      try {
        const net = await fetch(req);
        if (net.ok) await putSafe(cache, req, net.clone());
        return net;
      } catch {
        return hit || new Response('Offline asset missing', { status: 503 });
      }
    })());
    return;
  }

  // 3) Everything else (GET): network-first with cache fallback
  if (req.method === 'GET') {
    event.respondWith((async () => {
      const cache = await caches.open(VERSION);
      const hit = await cache.match(req);
      try {
        const net = await fetch(req);
        if (net.ok) await putSafe(cache, req, net.clone());
        return net;
      } catch {
        return hit || new Response('Offline and not cached', { status: 503 });
      }
    })());
  }
});
