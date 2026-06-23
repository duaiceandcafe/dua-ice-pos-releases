// Dua Ice POS — Service Worker
// Cache-first strategy: app works fully offline once installed.
// When online, sync via Supabase happens through the main app code.

const CACHE_NAME = 'dua-ice-pos-v12';
const STATIC_ASSETS = [
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// iOS/Safari refuses a redirected response for a navigation. Rebuild a clean copy.
async function cleanResponse(response) {
  if (!response || !response.redirected) return response;
  const body = await response.blob();
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
}

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

// Fetch
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Always go to network for Supabase API calls (real-time data)
  if (url.host.includes('supabase.co') || url.host.includes('supabase.io')) {
    return; // let browser handle normally
  }

  // Page navigations → always serve a clean index.html (fixes the
  // "Response served by service worker has redirections" error on iOS).
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const net = await fetch('./index.html', { redirect: 'follow' });
        const clean = await cleanResponse(net);
        if (net.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put('./index.html', clean.clone());
        }
        return clean;
      } catch (e) {
        const cached = await caches.match('./index.html');
        return cached ? cleanResponse(cached) : Response.error();
      }
    })());
    return;
  }

  // Everything else → cache-first
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(response => {
        if (response.ok && !response.redirected && (url.origin === location.origin || url.host.includes('jsdelivr') || url.host.includes('googleapis') || url.host.includes('gstatic'))) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
        }
        return response;
      }).catch(() => caches.match('./index.html').then(c => c ? cleanResponse(c) : Response.error()));
    })
  );
});

// Push: show notification even when app is closed / phone locked
self.addEventListener('push', event => {
  let data = { title: 'Dua Ice & Cafe', body: '', tag: 'dua-' + Date.now(), url: '/' };
  try {
    if (event.data) {
      const parsed = event.data.json();
      data = Object.assign(data, parsed);
    }
  } catch (e) {
    if (event.data) data.body = event.data.text();
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      tag: data.tag,
      renotify: true,
      icon: './icons/icon-192.png',
      badge: './icons/icon-192.png',
      data: { url: data.url || '/' },
      vibrate: [120, 60, 120]
    })
  );
});

// Notification click: focus existing window or open the app
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || './';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
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
