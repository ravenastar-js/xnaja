const CACHE = 'xnaja-v6.6';
const PAGE = './';
const ASSETS = [
  PAGE,
  'manifest.webmanifest',
  'source/assets/icon.svg',
  'source/assets/icon-192.png',
  'source/assets/icon-512.png',
  'source/assets/apple-touch-icon.png',
  'source/css/style.css',
  'source/js/config.js',
  'source/js/app.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => Promise.allSettled(ASSETS.map((asset) => cache.add(asset))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(PAGE, response.clone());
    return response;
  } catch {
    return (await cache.match(PAGE)) ?? Response.error();
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request, { ignoreSearch: true });
  const refresh = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => undefined);
  return cached ?? (await refresh) ?? Response.error();
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.endsWith('/sw.js')) return;
  event.respondWith(request.mode === 'navigate' ? networkFirst(request) : staleWhileRevalidate(request));
});