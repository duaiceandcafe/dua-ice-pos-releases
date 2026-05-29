// Dua Ice POS — Service Worker
// Cache-first strategy: app works fully offline once installed.
// When online, sync via Supabase happens through the main app code.

const CACHE_NAME = 'dua-ice-pos-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Install: pre-cache shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('[SW] Some assets failed to cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for same-origin assets, network-first for Supabase / API
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  // Always go to network for Supabase API calls (real-time data)
  if (url.host.includes('supabase.co') || url.host.includes('supabase.io')) {
    return; // let browser handle normally
  }
  // Cache-first for everything else (HTML, JS, CSS, images, CDNs we pre-cached)
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cache successful responses for next time
        if (response.ok && (url.origin === location.origin || url.host.includes('jsdelivr') || url.host.includes('googleapis') || url.host.includes('gstatic'))) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});

// Listen for manual cache update message from the app
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => event.ports[0]?.postMessage({ ok: true }));
  }
});
