const CACHE_NAME = "trip-wise-mobile-cache-v1";
const OFFLINE_URLS = ["/", "/index.html", "/favicon.ico", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(OFFLINE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || request.url.startsWith("chrome-extension")) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          return response;
        })
        .catch(() => caches.match("/index.html"));
    })
  );
});

self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? { title: "Trip Wise", body: "You have packing tasks waiting." };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/favicon.ico",
      vibrate: [100, 50, 100],
      tag: "trip-wise-reminder",
    })
  );
});
