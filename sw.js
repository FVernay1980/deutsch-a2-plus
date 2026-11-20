
const CACHE = 'deutsch-a2-v013';

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.png',
  './icon-512.png'
];

// Installation du nouveau Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Suppression des anciens caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key.startsWith('deutsch-a2-') && key !== CACHE)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Gestion des fichiers
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET' ||
      url.origin !== self.location.origin) {
    return;
  }

  // HTML : Internet en priorité, cache en secours
  if (request.mode === 'navigate' ||
      url.pathname.endsWith('/index.html')) {

    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            event.waitUntil(
              caches.open(CACHE)
                .then(cache => cache.put(request, copy))
            );
          }
          return response;
        })
        .catch(async () => {
          return (await caches.match(request)) ||
                 (await caches.match('./index.html')) ||
                 Response.error();
        })
    );

    return;
  }

  // Autres fichiers : cache en priorité
  event.respondWith(
    caches.match(request)
      .then(cached => cached || fetch(request))
  );
});
