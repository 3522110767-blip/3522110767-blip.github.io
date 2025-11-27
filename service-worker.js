const CACHE_NAME = 'bytecraft-cache-v2';
const urlsToCache = [
  './',
  './dashboard.html',
  './login.html',
  './dashboard.js',
  './login.js',
  './dashboard.css',
  './login.css',
  './manifest.json',
  './images/icon-72x72.png', 
  './images/icon-96x96.png', 
  './images/icon-128x128.png', 
  './images/icon-192x192.png', 
  './images/icon-512x512.png',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css'
];

// 1. INSTALACIÓN (Guardar en caché)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache).catch(err => console.error('Error caché:', err));
      })
  );
  self.skipWaiting();
});

// 2. ACTIVACIÓN (Limpiar cachés viejos)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. FETCH (Servir offline)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) return response; // Hit del caché
                return fetch(event.request);   // Ir a internet
            })
    );
});

// ===============================================
// ✅ NOTIFICACIONES PUSH REALES
// ===============================================

self.addEventListener('push', (event) => {
  let data = { title: 'ByteCraft', body: 'Nueva notificación', url: 'dashboard.html' };
  
  if (event.data) {
      try {
          const json = event.data.json();
          data = { ...data, ...json };
      } catch (e) {
          data.body = event.data.text();
      }
  }

  const options = {
    body: data.body,
    icon: 'images/icon-192x192.png', 
    badge: 'images/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: { url: data.url }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || 'dashboard.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});