// Service worker : précache tous les fichiers nécessaires pour que
// l'application (roue + administration) fonctionne entièrement hors-ligne
// une fois installée sur un poste.
//
// Incrémenter CACHE_NAME force la mise à jour complète du cache lors du
// prochain déploiement (ex: passer à 'kuhn-wheel-v2').
const CACHE_NAME = 'kuhn-wheel-v3';

const urlsToCache = [
    './',
    './index.html',
    './wheel.html',
    './admin.html',
    './manifest.json',
    './config.json',
    './css/style.css',
    './css/admin.css',
    './css/landing.css',
    './js/config-store.js',
    './js/icon-library.js',
    './js/theme-library.js',
    './js/wheel.js',
    './js/admin.js',
    './js/background.js',
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

// Stratégie "cache d'abord, réseau en secours" : répond instantanément
// depuis le cache (donc hors-ligne), puis met le cache à jour en tâche de
// fond si le réseau est disponible, pour la prochaine ouverture.
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const networkFetch = fetch(event.request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.ok) {
                        const clone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                    }
                    return networkResponse;
                })
                .catch(() => cachedResponse);

            return cachedResponse || networkFetch;
        })
    );
});
