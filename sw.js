// Service worker : précache tous les fichiers nécessaires pour que
// l'application (roue + administration) fonctionne entièrement hors-ligne
// une fois installée sur un poste.
//
// Incrémenter CACHE_NAME force la mise à jour complète du cache lors du
// prochain déploiement (ex: passer à 'kuhn-wheel-v2').
const CACHE_NAME = 'kuhn-wheel-v7';

const urlsToCache = [
    './',
    './index.html',
    './wheel.html',
    './admin.html',
    './guide.html',
    './manifest.json',
    './config.json',
    './css/style.css',
    './css/admin.css',
    './css/landing.css',
    './css/guide.css',
    './js/config-store.js',
    './js/icon-library.js',
    './js/theme-library.js',
    './js/sound.js',
    './js/admin-lock.js',
    './js/admin-tabs.js',
    './js/wheel.js',
    './js/admin.js',
    './js/install-prompt.js',
    './assets/icon-192.png',
    './assets/icon-512.png',
    './assets/icon-maskable-512.png',
    './assets/favicon.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

// Stratégie "réseau d'abord, cache en secours" : va chercher la dernière
// version sur le réseau (en forçant le contournement du cache HTTP du
// navigateur avec cache:'no-store', sinon les modifications récentes
// pouvaient rester invisibles jusqu'à un Ctrl+F5). Le cache n'est utilisé
// que si le réseau est indisponible (mode hors-ligne), et reste à jour à
// chaque requête réussie.
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request, { cache: 'no-store' })
            .then((networkResponse) => {
                if (networkResponse && networkResponse.ok) {
                    const clone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return networkResponse;
            })
            .catch(() => caches.match(event.request))
    );
});
