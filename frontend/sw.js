/**
 * HIMAYA - Service Worker
 * Enables offline functionality and caching
 */

const CACHE_NAME = 'himaya-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/app.js',
    '/js/api.js',
    '/js/voice.js',
    '/js/offline.js',
    '/manifest.json'
];

const API_CACHE_NAME = 'himaya-api-v1';
const API_ENDPOINTS = [
    '/api/schemes',
    '/api/schemes/categories'
];

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');

    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(name => name !== CACHE_NAME && name !== API_CACHE_NAME)
                        .map(name => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

/**
 * Fetch event - serve from cache, fallback to network
 */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests and unsupported schemes (like chrome-extension)
    if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
        return;
    }

    // Handle API requests
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(handleApiRequest(request));
        return;
    }

    // Handle static assets - cache first
    event.respondWith(handleStaticRequest(request));
});

/**
 * Handle static asset requests
 * Strategy: Cache first, fallback to network
 */
async function handleStaticRequest(request) {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
        // Return cached response and update cache in background
        updateCache(request);
        return cachedResponse;
    }

    // Not in cache, fetch from network
    try {
        const networkResponse = await fetch(request);

        // Cache the new response
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        // Network failed, return offline page if available
        const offlineResponse = await caches.match('/');
        return offlineResponse || new Response('Offline', { status: 503 });
    }
}

/**
 * Handle API requests
 * Strategy: Network first, fallback to cache
 */
async function handleApiRequest(request) {
    try {
        // Try network first
        const networkResponse = await fetch(request);

        // Cache successful GET responses
        if (networkResponse.ok) {
            const cache = await caches.open(API_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        // Network failed, try cache
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
            console.log('[SW] Serving API response from cache:', request.url);
            return cachedResponse;
        }

        // No cache, return error response
        return new Response(
            JSON.stringify({
                success: false,
                error: 'You are offline and this data is not cached.'
            }),
            {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

/**
 * Update cache in background
 */
async function updateCache(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse);
        }
    } catch (error) {
        // Silent fail for background update
    }
}

/**
 * Handle push notifications (for future use)
 */
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();

        const options = {
            body: data.body,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-72.png',
            vibrate: [100, 50, 100],
            data: data.data
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

/**
 * Handle notification clicks
 */
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
        clients.openWindow(event.notification.data?.url || '/')
    );
});

console.log('[SW] Service worker loaded');
