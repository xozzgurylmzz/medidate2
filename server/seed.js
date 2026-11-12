// Geliştirme için örnek kullanıcılar oluşturur.
// Kullanım: npm run seed   (tüm hesapların şifresi: test1234)
// Güvenlik: uzak (Turso) veritabanına yalnızca --allow-remote ile yazar.
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

process.chdir(path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
const { ensureDb, get, all, run, now, isRemote } = await import('./db.js');
const { INTERESTS, PROMPTS, DEPARTMENTS, randomNickname, randomAvatar, randomColor } = await import('./meta.js');

if (isRemote && !process.argv.includes('--allow-remote')) {
  console.error('Durduruldu: TURSO_DATABASE_URL tanımlı. Canlı veritabanına şifresi bilinen test hesapları eklemek tehlikeli.');
  console.error('Gerçekten istiyorsan: npm run seed -- --allow-remote');
  process.exit(1);
}
await ensureDb();

const PASSWORD = 'test1234';
const hashPassword = (p) => { const salt = crypto.randomBytes(16).toString('hex'); return `${salt}:${crypto.scryptSync(p, salt, 64).toString('hex')}`; };
const pick = (arr, n) => [...arr].sort(() => Math.random() - 0.5).slice(0, n);
const one = (arr) => arr[Math.floor(Math.random() * arr.length)];

const bios = [
  'Kütüphane 3. katta beni bulabilirsin. Kahve ısmarlayana bedava ders notu.',
  'Vize haftası hariç her zaman gülen biriyim.',
  'Kampüs kedilerinin resmi olmayan bakıcısı.',
  'Sabah 8 dersine giden tek insan muhtemelen benim.',
  'Film gecesi için ortak arıyorum, patlamış mısır benden.',
  'Yüzme takımındayım, su gibi akıp gidiyoruz.',
  'Anonim olmak güzel, ama sohbet daha güzel.',
  '',
];
const names = {
  kadin: ['Elif', 'Zeynep', 'Defne', 'Ecrin', 'Nehir', 'Ayşe', 'Ceren', 'Selin', 'Beyza', 'İrem'],
  erkek: ['Yusuf', 'Emir', 'Kerem', 'Arda', 'Mert', 'Eren', 'Kaan', 'Burak', 'Ali', 'Efe'],
};

const total = Number(process.argv.find((a) => /^\d+$/.test(a)) || 24);
let created = 0;
for (let i = 1; i <= total; i++) {
  const username = `test${i}`;
  if (await get('SELECT 1 AS x FROM users WHERE username = ?', username)) continue;
  const gender = i % 2 === 0 ? 'kadin' : 'erkek';
  const showName = Math.random() < 0.6;
  const prompts = pick(PROMPTS, Math.floor(Math.random() * 3)).map((q) => ({
    q, a: one(['Kesinlikle kahve', 'Uzun hikaye, sohbette anlatırım', 'Kampüs çimleri', 'Gece yarısı pizza', 'Bunu tahmin edebilirsin']),
  }));
  const socials = {};
  if (Math.random() < 0.8) socials.instagram = `${username}_insta`;
  if (Math.random() < 0.4) socials.x = `${username}_x`;
  await run(`INSERT INTO users (username, password_hash, created_at, last_seen, nickname, avatar, avatar_color,
        first_name, last_name, age, department, gender, looking_for, intent, bio, interests, prompts, socials, profile_done)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    username, hashPassword(PASSWORD), now(), now(), randomNickname(), randomAvatar(), randomColor(),
    showName ? one(names[gender]) : null, showName && Math.random() < 0.3 ? 'Y.' : null,
    Math.random() < 0.8 ? 18 + Math.floor(Math.random() * 8) : null,
    Math.random() < 0.85 ? one(DEPARTMENTS) : null,
    gender, one(['kadin', 'erkek', 'herkes', 'herkes']), one(['ciddi', 'flort', 'arkadas', 'bilmiyorum']),
    one(bios) || null, JSON.stringify(pick(INTERESTS, 3 + Math.floor(Math.random() * 7))), JSON.stringify(prompts), JSON.stringify(socials));
  created++;
}

// test1'i birkaç kişi önceden beğensin ki eşleşme hemen denenebilsin
const u1 = await get('SELECT id FROM users WHERE username = ?', 'test1');
if (u1) {
  for (const o of await all('SELECT id FROM users WHERE id != ? AND profile_done = 1 LIMIT 8', u1.id)) {
    await run('INSERT OR IGNORE INTO swipes (from_user, to_user, action, created_at) VALUES (?, ?, ?, ?)', o.id, u1.id, 'like', now());
  }
}
console.log(`${created} test kullanıcısı eklendi. Giriş: test1 … test${total} / şifre: ${PASSWORD}`);
