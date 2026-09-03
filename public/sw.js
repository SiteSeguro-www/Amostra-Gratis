const CACHE_NAME = 'packzinhu-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/site.webmanifest',
  '/favicon.ico',
  '/favicon.png',
  '/banner-principal.jpeg'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip API calls and non-GET requests
  if (request.method !== 'GET' || url.pathname.startsWith('/api') || url.hostname.includes('firebase') || url.hostname.includes('supabase')) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((networkResponse) => {
        // Cache images and static assets from our own domain
        if (
          request.destination === 'image' || 
          request.destination === 'font' ||
          url.origin === self.location.origin
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch((error) => {
        console.error('Fetch failed:', error);
        // If it's a navigation request and we're offline, we could return a fallback page here
        // but for now just throw the error
        throw error;
      });
    })
  );
});

// Web Push receiver
self.addEventListener('push', function(event) {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Nova Notificação!', message: event.data.text() };
    }
  }

  const title = data.title || 'Novidade do PackZinhu!';
  const options = {
    body: data.message || 'Venha conferir o que há de novo.',
    icon: '/icon-neon.png',
    badge: '/favicon.png',
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const urlToOpen = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
