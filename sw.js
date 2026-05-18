// Raksha-Kavach Service Worker
// Enables full offline functionality

const CACHE_NAME = 'raksha-kavach-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&family=Teko:wght@400;500;600;700&display=swap'
];

// Install: cache all core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching core assets');
      return cache.addAll(ASSETS.filter(a => !a.startsWith('https://fonts')));
    }).then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first strategy (works offline)
self.addEventListener('fetch', event => {
  // Skip non-GET and chrome-extension requests
  if (event.request.method !== 'GET') return;
  if (event.request.url.startsWith('chrome-extension')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // Cache successful responses
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // If offline and not cached, return offline page for navigation
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

// Push notifications for safety reminders
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || '🦺 Raksha-Kavach Safety Reminder';
  const options = {
    body: data.body || 'Start your day with a safety gear check! Stay protected.',
    icon: './icons/icon-192.png',
    badge: './icons/icon-72.png',
    tag: 'safety-reminder',
    renotify: true,
    requireInteraction: false,
    data: { url: './index.html' },
    actions: [
      { action: 'check', title: '✅ Start Gear Check' },
      { action: 'dismiss', title: 'Later' }
    ]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'check' || !event.action) {
    event.waitUntil(clients.openWindow('./index.html'));
  }
});
