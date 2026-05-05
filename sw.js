/**
 * sw.js — Service Worker (cache offline)
 * Stratégie : Cache First pour assets statiques, Network First pour poi.json
 */

const CACHE_NAME = 'visiter-sillans-v3';

/* --- Assets à précacher à l'installation --- */
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/html/carte.html',
  '/html/poi.html',
  '/html/qcm.html',
  '/html/regles.html',
  '/html/a-propos.html',
  '/css/style.css',
  '/js/app.js',
  '/js/progress.js',
  '/js/carte.js',
  '/js/poi.js',
  '/js/qcm.js',
  '/data/poi.json',
  /* Photos terrain — 14 POIs */
  '/img/poi/poi-01.jpg',
  '/img/poi/poi-02.jpg',
  '/img/poi/poi-03.jpg',
  '/img/poi/poi-04.jpg',
  '/img/poi/poi-05.jpg',
  '/img/poi/poi-06.jpg',
  '/img/poi/poi-07.jpg',
  '/img/poi/poi-08.jpg',
  '/img/poi/poi-09.jpg',
  '/img/poi/poi-10.jpg',
  '/img/poi/poi-11.jpg',
  '/img/poi/poi-12.jpg',
  '/img/poi/poi-13.jpg',
  '/img/poi/poi-14.jpg',
  /* Dépendances externes */
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;1,400&display=swap'
];

/* --- Installation : précache --- */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      /* skipWaiting AVANT addAll : évite de bloquer si une image manque encore */
      .then(cache => cache.addAll(PRECACHE_ASSETS.filter(u => !u.includes('/img/poi/'))))
      .then(() => {
        /* Cache les images séparément — erreurs non bloquantes */
        return caches.open(CACHE_NAME).then(cache =>
          Promise.allSettled(
            PRECACHE_ASSETS
              .filter(u => u.includes('/img/poi/'))
              .map(u => cache.add(u).catch(() => null))
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

/* --- Activation : supprime les anciens caches --- */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/* --- Fetch : Cache First (sauf poi.json → Network First) --- */
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // poi.json : toujours essayer le réseau d'abord (données fraîches)
  if (url.pathname.endsWith('poi.json')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Tuiles OSM : Network First avec mise en cache à la volée
  if (url.hostname.includes('tile.openstreetmap.org')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Tout le reste : Cache First
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
      )
  );
});
