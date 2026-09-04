const CACHE = 'tetu-v2';

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',

  './assets/tetu-logo-horizontal-transparent.png',

  './assets/tetu-icon-32.png',
  './assets/tetu-icon-48.png',
  './assets/tetu-icon-180.png',
  './assets/tetu-icon-192.png',
  './assets/tetu-icon-512.png',
  './assets/tetu-maskable-512.png',

  './assets/tetu-og-1200x630.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );

  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE)
          .map(key => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') return;

  // HTML / navegación: primero internet, luego caché.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();

          caches.open(CACHE).then(cache => {
            cache.put('./index.html', copy);
          });

          return response;
        })
        .catch(() => caches.match('./index.html'))
    );

    return;
  }

  // Assets: primero caché, luego internet.
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request)
        .then(response => {
          if (
            !response ||
            response.status !== 200 ||
            response.type === 'opaque'
          ) {
            return response;
          }

          const copy = response.clone();

          caches.open(CACHE).then(cache => {
            cache.put(request, copy);
          });

          return response;
        })
        .catch(() => undefined);
    })
  );
});
