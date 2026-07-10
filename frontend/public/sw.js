// Service Worker mínimo — necessário para desbloquear instalação PWA no Chrome/Android
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {}); // No-op: não cacheia nada por enquanto
