/// <reference lib="webworker" />

const CACHE_NAME = "arquade-static-v1";

// Static assets to pre-cache (fonts, icons, etc.)
const PRECACHE_URLS = [
    "/",
];

// Install: pre-cache essential assets
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_URLS);
        })
    );
    // Activate immediately
    self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    // Take control immediately
    self.clients.claim();
});

// Fetch: Cache-First for static assets, Network-First for API/pages
self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET requests
    if (event.request.method !== "GET") return;

    // Skip Supabase API calls — always go to network
    if (url.hostname.includes("supabase")) return;

    // Skip Next.js HMR/dev endpoints
    if (url.pathname.startsWith("/_next/webpack-hmr")) return;
    if (url.pathname.startsWith("/__nextjs")) return;

    // Cache-First for static assets (JS, CSS, fonts, images)
    if (
        url.pathname.startsWith("/_next/static/") ||
        url.pathname.match(/\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|webp|ico)$/)
    ) {
        event.respondWith(
            caches.match(event.request).then((cached) => {
                if (cached) return cached;
                return fetch(event.request).then((response) => {
                    // Only cache successful responses
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, clone);
                        });
                    }
                    return response;
                });
            })
        );
        return;
    }

    // Network-First for HTML pages (always get fresh content)
    // Falls back to cache if offline
    if (event.request.headers.get("accept")?.includes("text/html")) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, clone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    return caches.match(event.request).then((cached) => {
                        return cached || new Response("Offline", { status: 503 });
                    });
                })
        );
        return;
    }
});
