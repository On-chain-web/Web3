const CACHE_NAME = 'binance-exchange-cache-v2';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css', // Assuming you have a CSS file
    '/script.js', // Assuming you have a JS file
    '/manifest.json',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
];

// URLs that should not be cached.
const urlsToExclude = [
    // Add any specific API endpoints or third-party scripts you do not want to cache.
    // For example:
    // 'https://api.binance.com'
    'https://cdn.tailwindcss.com', // Tailwind CDN can change, so it's better to fetch always
    'https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js'
];

self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching essential assets...');
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.error('Service Worker: Failed to cache essential assets:', error);
            })
    );
});

---

self.addEventListener('fetch', event => {
    // Check if the requested URL should be excluded from caching
    if (urlsToExclude.some(url => event.request.url.includes(url))) {
        return; // Skip caching this request
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // If a cached response is found, return it
                if (response) {
                    console.log('Service Worker: Found in cache:', event.request.url);
                    return response;
                }

                // If no cached response is found, fetch from the network
                console.log('Service Worker: Fetching from network:', event.request.url);
                return fetch(event.request).then(networkResponse => {
                    // Check if the response is valid
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                        return networkResponse;
                    }

                    // Clone the response to cache it and still return it to the browser
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                        console.log('Service Worker: Dynamic caching new resource:', event.request.url);
                    });

                    return networkResponse;
                }).catch(error => {
                    console.error('Service Worker: Fetch failed:', error);
                });
            })
    );
});

---

self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    // Delete any old caches to free up space
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
