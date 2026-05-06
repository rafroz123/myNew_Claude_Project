const CACHE = "ronova-v2";
const ASSETS = ["/", "/meditation", "/static/css/style.css", "/static/js/meditation.js", "/static/js/main.js"];

self.addEventListener("install", e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener("fetch", e => {
    e.respondWith(
        caches.match(e.request).then(cached => cached || fetch(e.request))
    );
});
