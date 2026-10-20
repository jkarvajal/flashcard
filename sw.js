/* Service Worker de FlashCard — cache offline.
 * Estrategia: precache del núcleo + cache-first con actualización en segundo plano.
 * Sube el número de versión cuando cambies archivos para forzar la actualización.
 */
var CACHE = "flashcard-v15";
var CORE = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/app.js",
  "./data/vision-artificial.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./img/espectro-visible.svg",
  "./img/muestreo.svg",
  "./img/mascara-bordes.svg",
  "./img/morfologia.svg"
];

self.addEventListener("install", function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return Promise.all(CORE.map(function (u) {
      return c.add(u).catch(function () {}); // no falla si algún recurso opcional no está
    }));
  }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.map(function (k) { if (k !== CACHE) return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(function (cached) {
      var network = fetch(e.request).then(function (res) {
        if (res && res.status === 200 && res.type === "basic") {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return res;
      }).catch(function () { return cached; });
      return cached || network;
    })
  );
});
