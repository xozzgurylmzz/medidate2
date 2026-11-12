/* MedipolDate servis çalışanı: web bildirimleri + uygulama olarak kurulabilme. */
const VERSION = 'md-v2';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// Bildirim geldiğinde göster
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { body: event.data && event.data.text() }; }
  const title = data.title || 'MedipolDate';
  event.waitUntil(self.registration.showNotification(title, {
    body: data.body || '',
    icon: '/icons/app-192.png',
    badge: '/icons/badge-96.png',
    tag: data.tag || 'medipoldate',
    renotify: !!data.tag,
    data: { url: data.url || '/' },
  }));
});

// Bildirime tıklanınca uygulamayı aç (açıksa öne getir)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || '/', self.location.origin).href;
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) {
      if (new URL(c.url).origin === self.location.origin) {
        await c.focus();
        c.postMessage({ type: 'open', url });
        return;
      }
    }
    await self.clients.openWindow(url);
  })());
});

// Ağ isteklerine dokunmuyoruz (her şey her zaman güncel gelsin); sadece kurulabilirlik için gerekli.
self.addEventListener('fetch', () => {});
void VERSION;
