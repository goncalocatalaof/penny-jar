const CACHE_NAME = 'pennyjar-cache-v1'; // bump version when updating files
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './images/continente.png',
  './images/pingo_doce.png',
  './images/fruit.png',
  // Add more icons/images if needed
];

// ============================
// INSTALL - Cache all essential assets
// ============================
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting(); // Activate SW immediately after install
});

// ============================
// ACTIVATE - Clear old caches
// ============================
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      )
    )
  );
  self.clients.claim(); // Take control of all pages immediately
});

// ============================
// FETCH - Serve from cache or network
// ============================
self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    // Network-first for navigation (HTML pages)
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => caches.match(event.request).then(resp => resp || caches.match('./index.html')))
    );
  } else {
    // Cache-first for CSS, JS, images
    event.respondWith(
      caches.match(event.request).then(resp => resp || fetch(event.request))
    );
  }
});
