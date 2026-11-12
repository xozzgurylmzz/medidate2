// Web bildirimleri (Web Push). VAPID anahtarları yoksa sessizce kapalı kalır.
import webpush from 'web-push';
import { all, get, run, now } from './db.js';

const PUBLIC = process.env.VAPID_PUBLIC_KEY || '';
const PRIVATE = process.env.VAPID_PRIVATE_KEY || '';
const SUBJECT = process.env.VAPID_SUBJECT
  || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'mailto:admin@medipoldate.local');

export const pushEnabled = !!(PUBLIC && PRIVATE);
export const pushPublicKey = pushEnabled ? PUBLIC : null;
if (pushEnabled) webpush.setVapidDetails(SUBJECT, PUBLIC, PRIVATE);

const ACTIVE_MS = 25e3; // kullanıcı şu an uygulamadaysa bildirim gönderme

export async function saveSubscription(userId, sub) {
  if (!sub || typeof sub.endpoint !== 'string' || !sub.keys?.p256dh || !sub.keys?.auth) throw new Error('Geçersiz abonelik.');
  if (!/^https:\/\//.test(sub.endpoint) || sub.endpoint.length > 1000) throw new Error('Geçersiz abonelik.');
  await run(`INSERT INTO push_subs (endpoint, user_id, p256dh, auth, created_at) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(endpoint) DO UPDATE SET user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth`,
  sub.endpoint, userId, String(sub.keys.p256dh), String(sub.keys.auth), now());
}

export async function removeSubscription(endpoint) {
  await run('DELETE FROM push_subs WHERE endpoint = ?', String(endpoint || ''));
}

/**
 * Kullanıcının tüm cihazlarına bildirim gönderir. Hata olursa isteği bozmaz.
 * payload: { title, body, url, tag }
 */
export async function notify(userId, payload, { evenIfActive = false } = {}) {
  if (!pushEnabled) return;
  try {
    if (!evenIfActive) {
      const u = await get('SELECT last_seen FROM users WHERE id = ?', userId);
      if (u?.last_seen && now() - u.last_seen < ACTIVE_MS) return;
    }
    const subs = await all('SELECT endpoint, p256dh, auth FROM push_subs WHERE user_id = ?', userId);
    const data = JSON.stringify(payload);
    await Promise.all(subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, data, { TTL: 3600, timeout: 4000 });
      } catch (e) {
        if (e.statusCode === 404 || e.statusCode === 410) await removeSubscription(s.endpoint); // abonelik artık geçersiz
      }
    }));
  } catch (e) {
    console.error('Bildirim gönderilemedi:', e.message);
  }
}
