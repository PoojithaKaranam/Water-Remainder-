// Service Worker for Hydro Tracker App

// Cache name
const CACHE_NAME = 'hydro-tracker-v1';

// Files to cache
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json'
];

// Install event - cache assets
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

// Fetch event - serve from cache if available
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached response if found
        if (response) {
          return response;
        }
        
        // Otherwise fetch from network
        return fetch(event.request);
      })
  );
});

// Push notification event
self.addEventListener('push', event => {
  let notification = {
    title: 'Hydro Tracker',
    body: 'Time to drink water!',
    icon: './water-icon.png',
    badge: './water-icon.png',
    vibrate: [200, 100, 200]
  };
  
  // Check if there's data in the push
  if (event.data) {
    try {
      notification = { ...notification, ...event.data.json() };
    } catch (e) {
      console.error('Error parsing push data:', e);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notification.title, {
      body: notification.body,
      icon: notification.icon,
      badge: notification.badge,
      vibrate: notification.vibrate,
      tag: 'water-reminder',
      renotify: true,
      requireInteraction: true
    })
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  // Open the app when notification is clicked
  event.waitUntil(
    clients.matchAll({type: 'window'})
      .then(windowClients => {
        // Check if there is already a window open
        for (let client of windowClients) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow('./');
        }
      })
  );
});
