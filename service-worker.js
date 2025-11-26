// service-worker.js

const CACHE_NAME = 'bytecraft-cache-v1';
const urlsToCache = [
  './',
  './dashboard.html',
  './login.html',
  './dashboard.js',
  './login.js',
  './dashboard.css',
  './login.css',
  './manifest.json',
  // Rutas de iconos corregidas/ajustadas a la raíz
  './72x72.png', 
  './96x96.png', 
  './128x128.png', 
  './192x192.png', 
  './512x512.png',
  // Recursos externos (URLs absolutas)
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css'
];

// Instalar Service Worker y guardar recursos en caché
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // Usar .catch para manejar errores si una URL falla
        return cache.addAll(urlsToCache).catch(err => {
            console.error('Fallo al agregar algunos recursos al caché:', err);
        });
      })
  );
});

// Interceptar peticiones y servir desde caché o red
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Devuelve el recurso de caché si lo encuentra
        if (response) {
          return response;
        }

        // Si no está en caché, va a la red
        return fetch(event.request).catch(() => {
            // Manejo de offline. Puedes servir una página offline aquí si tuvieras una.
            return new Response("No hay conexión a internet y el recurso no está disponible offline.", {
                status: 503,
                statusText: "Service Unavailable"
            });
        });
      })
  );
});

// Activar (Limpieza de cachés viejas)
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName); // Elimina cachés viejas
          }
        })
      );
    }).then(() => self.clients.claim()) // Toma control inmediatamente
  );
});


// ===============================================
// ✅ LÓGICA DE NOTIFICACIONES PUSH (Servidor)
// ===============================================

/**
 * Manejador del evento 'push'
 * Se activa cuando el servidor envía una notificación PUSH al Service Worker.
 */
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'Nueva Alerta', body: 'Un evento ha ocurrido.' };
  
  const title = data.title;
  const options = {
    body: data.body,
    icon: './192x192.png', 
    badge: './72x72.png',  
    vibrate: [200, 100, 200],
    data: {
        url: data.url || '/dashboard.html#tareas' // URL a abrir al hacer clic
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

/**
 * Maneja el clic en la notificación (Ya sea cliente-side o servidor-side).
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/dashboard.html';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus(); // Enfoca la pestaña si ya está abierta
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl); // Abre una nueva pestaña
      }
    })
  );
});