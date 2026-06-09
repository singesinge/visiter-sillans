/**
 * sw.js — Service Worker (cache offline)
 * Stratégie : Cache First pour assets statiques, Network First pour poi.json
 */

const CACHE_NAME = 'visiter-sillans-v26';
// Cache média (photos + audio des POI), conservé entre les versions :
// rempli par l'écran de chargement, jamais purgé à l'activation.
const MEDIA_CACHE = 'visiter-sillans-media';

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './404.html',
  './manifest.json',
  './html/carte.html',
  './html/poi.html',
  './html/qcm.html',
  './html/regles.html',
  './html/a-propos.html',
  './css/style.css',
  './js/app.js',
  './js/progress.js',
  './js/transitions.js',
  './js/carte.js',
  './js/proximity.js',
  './data/poi.json',
  './img/Map.svg',
  './img/logo.png',
  './img/logo-03.png',
  './img/mascotte-06.svg',
  './img/mascotte-07.svg',
  './img/mascotte-08.svg',
  './img/mascotte-09.svg',
  './img/logodeptvar.svg',
  './img/vuecomplete.jpg',
  './img/bassinbas.jpeg',
  './img/sentierombre.jpeg',
  './img/cascadebas.jpeg',
];

self.addEventListener('install', event => {
  // Lance le cache des assets critiques (sans les images POI — gérées par lancerVisite)
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.allSettled(PRECACHE_ASSETS.map(u => cache.add(u).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME && k !== MEDIA_CACHE)
            .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Navigations + pages HTML → Network First : on récupère toujours la dernière
  // version quand le réseau est disponible, et on retombe sur le cache hors-ligne.
  // Évite de rester bloqué sur une page (ex. carte.html) servie depuis un cache périmé.
  if (event.request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request).then(c => c || caches.match('./index.html')))
    );
    return;
  }

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

  // Reste (CSS, JS, images, audio…) → Cache First.
  // ignoreSearch : un fichier demandé avec ?v=N correspond à l'entrée pré-cachée sans query.
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true })
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
