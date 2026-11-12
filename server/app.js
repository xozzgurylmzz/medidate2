// MedipolDate API – Express uygulaması.
// Vercel'de api/index.js bunu sunucusuz fonksiyon olarak çalıştırır,
// yerelde server/local.js normal bir sunucu olarak başlatır.
import express from 'express';
import crypto from 'node:crypto';

import { ensureDb, get, all, run, batch, now, DbConfigError } from './db.js';
import {
  meta, randomNickname, randomAvatar, randomColor, INTERESTS, PROMPTS, INTENTS, SOCIALS, AVATARS, AVATAR_COLORS,
  LIMITS, DAILY_QUESTIONS, CHAT_QUESTIONS,
} from './meta.js';
import { isOffensive } from './filter.js';
import { notify, pushEnabled, pushPublicKey, saveSubscription, removeSubscription } from './push.js';

const COOKIE_NAME = 'md_session';
const SESSION_DAYS = 30;
const COOKIE_SECURE = process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : !!process.env.VERCEL;
const USERNAME_RE = /^[a-z0-9_.]{3,24}$/;
const ADMIN_USERNAME = (process.env.ADMIN_USERNAME || 'admin').trim();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const ADMIN_COOKIE = 'md_admin';
const ADMIN_HOURS = 12;
const ONLINE_MS = 60e3;   // son 60 sn içinde istek atan "çevrimiçi" sayılır
const TYPING_MS = 5e3;
const DAY_MS = 86400e3;
const TR_OFFSET = 3 * 3600e3; // Türkiye saati (UTC+3)
const EXPIRE_MS = LIMITS.matchHours * 3600e3;
// "Konuşma" sayılan mesaj türleri (süreli eşleşme ve "sıra sende" için)
const TALK_TYPES = "('text','social','game','comment','reveal')";

const app = express();
export default app;

app.disable('x-powered-by');
if (process.env.TRUST_PROXY === 'true' || process.env.VERCEL) app.set('trust proxy', true);

// Vercel gövdeyi kendisi ayrıştırabilir; ayrıştırmadıysa express.json devreye girer.
const jsonParser = express.json({ limit: '64kb' });
app.use((req, res, next) => {
  let parsed;
  try { parsed = req.body; } catch { parsed = undefined; }
  if (parsed && typeof parsed === 'object' && !Buffer.isBuffer(parsed)) return next();
  jsonParser(req, res, next);
});
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (req.path.startsWith('/api/')) res.setHeader('Cache-Control', 'no-store');
  next();
});

// ---------------------------------------------------------------- yardımcılar

class HttpError extends Error {
  constructor(status, message, extra = {}) { super(message); this.status = status; this.extra = extra; }
}
const bad = (msg) => new HttpError(400, msg);
/** Kırıcı ifade içeren metin: istemci "Emin misin?" sorar, onaylanırsa confirmed:true ile tekrar gönderir. */
const needsConfirm = () => new HttpError(409, 'Bu ifade karşı tarafı kırabilir. Yine de göndermek istiyor musun?', { needsConfirm: true });
const guardText = (req, ...texts) => {
  const flagged = texts.some((t) => t && isOffensive(t));
  if (flagged && req.body.confirmed !== true) throw needsConfirm();
  return flagged;
};
/** async route sarmalayıcı (Express 4 async hataları kendisi yakalamaz) */
const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Her API isteğinden önce veritabanı şemasının hazır olmasını bekle
app.use('/api', h(async (req, res, next) => { await ensureDb(); next(); }));

function parseCookies(header = '') {
  const out = {};
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return `${salt}:${crypto.scryptSync(password, salt, 64).toString('hex')}`;
}
function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}
const cookie = (name, value, maxAge) =>
  `${name}=${value}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}${COOKIE_SECURE ? '; Secure' : ''}`;

async function createSession(res, userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const t = now();
  await run('INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)', token, userId, t, t + SESSION_DAYS * DAY_MS);
  res.setHeader('Set-Cookie', cookie(COOKIE_NAME, token, SESSION_DAYS * 86400));
  if (Math.random() < 0.05) await run('DELETE FROM sessions WHERE expires_at < ?', t);
}
async function userFromCookie(cookieHeader) {
  const token = parseCookies(cookieHeader)[COOKIE_NAME];
  if (!token) return null;
  return (await get(`SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token = ? AND s.expires_at > ? AND u.banned = 0`, token, now())) || null;
}

const parseJSON = (s, fallback) => { try { return JSON.parse(s); } catch { return fallback; } };
const isOnline = (lastSeen) => !!lastSeen && now() - lastSeen < ONLINE_MS;
const displayName = (u) => (u.first_name ? `${u.first_name}${u.last_name ? ' ' + u.last_name : ''}` : u.nickname);
const modeOf = (v) => (v === 'friend' ? 'friend' : 'date');

/** Türkiye saatine göre bugünün tarihi (YYYY-AA-GG) ve günün başlangıcı. */
const turkeyDay = (t = now()) => new Date(t + TR_OFFSET).toISOString().slice(0, 10);
const dayStart = (t = now()) => Date.parse(turkeyDay(t) + 'T00:00:00Z') - TR_OFFSET;
const dailyQuestion = (day = turkeyDay()) => DAILY_QUESTIONS[Math.floor(Date.parse(day) / DAY_MS) % DAILY_QUESTIONS.length];

/** Başkalarının görebileceği alanlar (kullanıcı adı, sosyal medya ve açılış sorusu asla yok). */
function publicProfile(u) {
  return {
    id: u.id,
    nickname: u.nickname,
    avatar: u.avatar,
    avatar_color: u.avatar_color,
    first_name: u.first_name,
    last_name: u.last_name,
    age: u.age,
    department: u.department,
    gender: u.gender,
    intent: u.intent,
    bio: u.bio,
    interests: parseJSON(u.interests, []),
    prompts: parseJSON(u.prompts, []),
    last_seen: u.last_seen,
    online: isOnline(u.last_seen),
  };
}
function ownProfile(u) {
  return {
    ...publicProfile(u),
    username: u.username,
    looking_for: u.looking_for,
    socials: parseJSON(u.socials, {}),
    profile_done: !!u.profile_done,
    friend_mode: !!u.friend_mode,
    opening_question: u.opening_question || '',
  };
}

// basit istek sınırlama (IP başına, sunucu örneği içinde)
const buckets = new Map();
function rateLimit(limit, windowMs) {
  return (req, res, next) => {
    const key = `${req.ip}:${req.path}`;
    const t = now();
    if (buckets.size > 5000) for (const [k, b] of buckets) if (b.reset < t) buckets.delete(k);
    let b = buckets.get(key);
    if (!b || b.reset < t) { b = { count: 0, reset: t + windowMs }; buckets.set(key, b); }
    b.count++;
    if (b.count > limit) return next(new HttpError(429, 'Çok fazla deneme yaptın, biraz sonra tekrar dene.'));
    next();
  };
}

const requireAuth = h(async (req, res, next) => {
  const u = await userFromCookie(req.headers.cookie);
  if (!u) throw new HttpError(401, 'Giriş yapman gerekiyor.');
  if (!u.last_seen || now() - u.last_seen > 20e3) {
    u.last_seen = now();
    await run('UPDATE users SET last_seen = ? WHERE id = ?', u.last_seen, u.id);
  }
  req.user = u;
  next();
});

const cleanStr = (v, max) => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim().slice(0, max);
  return s.length ? s : null;
};

/** Kullanıcıyı ve ona ait her şeyi siler. */
async function deleteUserCompletely(id) {
  const sub = 'SELECT id FROM matches WHERE user_a = ? OR user_b = ?';
  await batch([
    [`DELETE FROM messages WHERE sender_id = ? OR match_id IN (${sub})`, id, id, id],
    [`DELETE FROM match_reads WHERE user_id = ? OR match_id IN (${sub})`, id, id, id],
    [`DELETE FROM reveals WHERE user_id = ? OR match_id IN (${sub})`, id, id, id],
    ['DELETE FROM typing WHERE user_id = ?', id],
    ['DELETE FROM matches WHERE user_a = ? OR user_b = ?', id, id],
    ['DELETE FROM swipes WHERE from_user = ? OR to_user = ?', id, id],
    ['DELETE FROM blocks WHERE blocker_id = ? OR blocked_id = ?', id, id],
    ['DELETE FROM reports WHERE reporter_id = ? OR reported_id = ?', id, id],
    ['DELETE FROM daily_answers WHERE user_id = ?', id],
    ['DELETE FROM daily_picks WHERE user_id = ? OR pick_id = ?', id, id],
    ['DELETE FROM push_subs WHERE user_id = ?', id],
    ['DELETE FROM sessions WHERE user_id = ?', id],
    ['DELETE FROM users WHERE id = ?', id],
  ]);
}

// ---------------------------------------------------------------- meta & kimlik

app.get('/api/meta', (req, res) => res.json({ ...meta(), push: { enabled: pushEnabled, key: pushPublicKey } }));

app.get('/api/health', h(async (req, res) => {
  await get('SELECT 1 AS ok');
  res.json({ ok: true, db: 'bağlı', push: pushEnabled ? 'açık' : 'kapalı' });
}));

app.post('/api/auth/register', rateLimit(10, 15 * 60e3), h(async (req, res) => {
  const username = String(req.body.username || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!USERNAME_RE.test(username)) throw bad('Kullanıcı adı 3-24 karakter olmalı; sadece küçük harf, rakam, nokta ve alt çizgi.');
  if (password.length < 8) throw bad('Şifre en az 8 karakter olmalı.');
  if (await get('SELECT 1 AS x FROM users WHERE username = ?', username)) throw bad('Bu kullanıcı adı alınmış.');
  const r = await run('INSERT INTO users (username, password_hash, created_at, last_seen, nickname, avatar, avatar_color) VALUES (?, ?, ?, ?, ?, ?, ?)',
    username, hashPassword(password), now(), now(), randomNickname(), randomAvatar(), randomColor());
  const user = await get('SELECT * FROM users WHERE id = ?', r.lastInsertRowid);
  await createSession(res, user.id);
  res.json({ ok: true, user: ownProfile(user) });
}));

app.post('/api/auth/login', rateLimit(20, 15 * 60e3), h(async (req, res) => {
  const username = String(req.body.username || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const user = await get('SELECT * FROM users WHERE username = ?', username);
  if (!user || !verifyPassword(password, user.password_hash)) throw new HttpError(401, 'Kullanıcı adı veya şifre hatalı.');
  if (user.banned) throw new HttpError(403, 'Bu hesap askıya alınmış.');
  await createSession(res, user.id);
  res.json({ ok: true, user: ownProfile(user) });
}));

app.post('/api/auth/logout', h(async (req, res) => {
  const token = parseCookies(req.headers.cookie)[COOKIE_NAME];
  if (token) await run('DELETE FROM sessions WHERE token = ?', token);
  res.setHeader('Set-Cookie', cookie(COOKIE_NAME, '', 0));
  res.json({ ok: true });
}));

app.get('/api/me', requireAuth, (req, res) => res.json({ user: ownProfile(req.user) }));

app.delete('/api/me', requireAuth, h(async (req, res) => {
  await deleteUserCompletely(req.user.id);
  res.setHeader('Set-Cookie', cookie(COOKIE_NAME, '', 0));
  res.json({ ok: true });
}));

// ---------------------------------------------------------------- profil

app.put('/api/profile', requireAuth, h(async (req, res) => {
  const b = req.body || {};
  const nickname = cleanStr(b.nickname, 30) || req.user.nickname;
  const avatar = AVATARS.includes(b.avatar) ? b.avatar : req.user.avatar;
  const avatar_color = AVATAR_COLORS.includes(b.avatar_color) ? b.avatar_color : req.user.avatar_color;
  const first_name = cleanStr(b.first_name, 40);
  const last_name = cleanStr(b.last_name, 40);
  const age = b.age === '' || b.age === null || b.age === undefined ? null : Number(b.age);
  if (age !== null && (!Number.isInteger(age) || age < 17 || age > 80)) throw bad('Yaş 17 ile 80 arasında olmalı.');
  const department = cleanStr(b.department, 80);
  if (!['kadin', 'erkek'].includes(b.gender)) throw bad('Cinsiyet seçimi zorunlu.');
  const gender = b.gender;
  const looking_for = ['kadin', 'erkek', 'herkes'].includes(b.looking_for) ? b.looking_for : 'herkes';
  const intent = INTENTS.some((i) => i.id === b.intent) ? b.intent : null;
  const bio = cleanStr(b.bio, 400);
  const interests = Array.isArray(b.interests) ? [...new Set(b.interests.filter((i) => INTERESTS.includes(i)))].slice(0, 12) : [];
  const prompts = Array.isArray(b.prompts)
    ? b.prompts.filter((p) => p && PROMPTS.includes(p.q) && cleanStr(p.a, 200)).map((p) => ({ q: p.q, a: cleanStr(p.a, 200) })).slice(0, 3)
    : [];
  const socials = {};
  if (b.socials && typeof b.socials === 'object') {
    for (const s of SOCIALS) {
      const v = cleanStr(b.socials[s.id], 60);
      if (v) socials[s.id] = v.replace(/^@/, '');
    }
  }
  const friend_mode = b.friend_mode ? 1 : 0;
  const opening_question = cleanStr(b.opening_question, LIMITS.openerMax);
  if ([bio, opening_question, ...prompts.map((p) => p.a)].some((t) => t && isOffensive(t))) {
    throw bad('Profilinde kırıcı olabilecek bir ifade var. Lütfen düzenle.');
  }
  await run(`UPDATE users SET nickname=?, avatar=?, avatar_color=?, first_name=?, last_name=?, age=?, department=?,
       gender=?, looking_for=?, intent=?, bio=?, interests=?, prompts=?, socials=?, friend_mode=?, opening_question=?, profile_done=1 WHERE id=?`,
    nickname, avatar, avatar_color, first_name, last_name, age, department, gender, looking_for, intent, bio,
    JSON.stringify(interests), JSON.stringify(prompts), JSON.stringify(socials), friend_mode, opening_question, req.user.id);
  res.json({ user: ownProfile(await get('SELECT * FROM users WHERE id = ?', req.user.id)) });
}));

// ---------------------------------------------------------------- günün sorusu

app.get('/api/daily', requireAuth, h(async (req, res) => {
  const day = turkeyDay();
  const mine = await get('SELECT answer FROM daily_answers WHERE user_id = ? AND day = ?', req.user.id, day);
  res.json({ day, question: dailyQuestion(day), answer: mine?.answer || null });
}));

app.post('/api/daily', requireAuth, h(async (req, res) => {
  const day = turkeyDay();
  const answer = cleanStr(req.body.answer, LIMITS.dailyAnswerMax);
  if (!answer) throw bad('Bir cevap yaz.');
  if (isOffensive(answer)) throw bad('Cevabın kırıcı olabilecek bir ifade içeriyor. Lütfen düzenle.');
  await run(`INSERT INTO daily_answers (user_id, day, answer, created_at) VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, day) DO UPDATE SET answer = excluded.answer`, req.user.id, day, answer, now());
  res.json({ day, question: dailyQuestion(day), answer });
}));

// ---------------------------------------------------------------- keşfet & kaydırma

function compatibilityScore(me, other) {
  const mine = new Set(parseJSON(me.interests, []));
  const shared = parseJSON(other.interests, []).filter((i) => mine.has(i));
  let score = shared.length * 3;
  if (me.intent && me.intent === other.intent) score += 2;
  if (me.department && me.department === other.department) score += 1;
  if (other.bio) score += 0.5;
  score += Math.min(parseJSON(other.prompts, []).length, 3) * 0.5;
  return { score, shared };
}

async function likeUsage(userId) {
  const start = dayStart();
  const r = await get(`SELECT COUNT(*) AS n, COALESCE(SUM(super), 0) AS s FROM swipes
    WHERE from_user = ? AND action = 'like' AND created_at >= ?`, userId, start);
  return {
    likesLeft: Math.max(0, LIMITS.likesPerDay - r.n),
    superLeft: Math.max(0, LIMITS.superPerDay - r.s),
    likesPerDay: LIMITS.likesPerDay,
    superPerDay: LIMITS.superPerDay,
    resetsAt: start + DAY_MS,
  };
}

const inList = (ids) => ids.map(() => '?').join(',');

/** Aday kartlarını zenginleştirir: ortak ilgi, seni beğendi mi (süper/yorum), günün sorusu, günün en uyumlusu. */
async function enrichCandidates(me, mode, users, { pickId = null } = {}) {
  if (!users.length) return [];
  const ids = users.map((u) => u.id);
  const day = turkeyDay();
  const likes = new Map((await all(`SELECT from_user, super, comment, target FROM swipes
    WHERE to_user = ? AND mode = ? AND action = 'like' AND from_user IN (${inList(ids)})`, me.id, mode, ...ids)).map((r) => [r.from_user, r]));
  const answers = new Map((await all(`SELECT user_id, answer FROM daily_answers WHERE day = ? AND user_id IN (${inList(ids)})`, day, ...ids)).map((r) => [r.user_id, r.answer]));
  const iAnswered = !!(await get('SELECT 1 AS x FROM daily_answers WHERE user_id = ? AND day = ?', me.id, day));
  return users.map((o) => {
    const { shared } = compatibilityScore(me, o);
    const lm = likes.get(o.id);
    return {
      ...publicProfile(o),
      sharedInterests: shared,
      likedMe: lm && (lm.super || lm.comment) ? { super: !!lm.super, comment: lm.comment || null, target: lm.target || null } : null,
      topPick: o.id === pickId,
      daily: answers.has(o.id) ? (iAnswered ? { answer: answers.get(o.id) } : { locked: true }) : null,
    };
  });
}

app.get('/api/discover', requireAuth, h(async (req, res) => {
  const me = req.user;
  const mode = modeOf(req.query.mode);
  const day = turkeyDay();
  const daily = { question: dailyQuestion(day), answered: !!(await get('SELECT 1 AS x FROM daily_answers WHERE user_id = ? AND day = ?', me.id, day)) };
  const limits = await likeUsage(me.id);
  if (!me.profile_done) return res.json({ candidates: [], needsProfile: true, limits, daily });
  if (mode === 'friend' && !me.friend_mode) return res.json({ candidates: [], needsFriendMode: true, limits, daily });

  const rows = await all(`
    SELECT u.* FROM users u
    WHERE u.id != ? AND u.profile_done = 1 AND u.banned = 0 ${mode === 'friend' ? 'AND u.friend_mode = 1' : ''}
      AND NOT EXISTS (SELECT 1 FROM swipes s WHERE s.from_user = ? AND s.to_user = u.id AND s.mode = ?)
      AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id = ? AND b.blocked_id = u.id) OR (b.blocker_id = u.id AND b.blocked_id = ?))
      AND NOT EXISTS (SELECT 1 FROM matches m WHERE (m.user_a = ? AND m.user_b = u.id) OR (m.user_a = u.id AND m.user_b = ?))
    ORDER BY u.last_seen DESC LIMIT 400
  `, me.id, me.id, mode, me.id, me.id, me.id, me.id);

  const pool = mode === 'date'
    ? rows.filter((o) => (me.looking_for === 'herkes' || o.gender === me.looking_for) && (o.looking_for === 'herkes' || o.looking_for === me.gender))
    : rows;

  // Günün en uyumlusu (flört modu): gün içinde sabit kalır
  let pickId = null;
  if (mode === 'date' && pool.length) {
    const saved = await get('SELECT pick_id FROM daily_picks WHERE user_id = ? AND day = ?', me.id, day);
    if (saved) pickId = saved.pick_id;
    else {
      const best = pool.map((o) => ({ id: o.id, s: compatibilityScore(me, o).score })).sort((a, b) => b.s - a.s)[0];
      pickId = best.id;
      await run('INSERT OR IGNORE INTO daily_picks (user_id, day, pick_id) VALUES (?, ?, ?)', me.id, day, pickId);
    }
    if (!pool.some((o) => o.id === pickId)) pickId = null;
  }

  // Sıralama: uyum + seni süper beğenen / yorum yapan öne + günün en uyumlusu en başta
  const likedMe = new Map((pool.length ? await all(`SELECT from_user, super, comment FROM swipes WHERE to_user = ? AND mode = ? AND action = 'like'
    AND from_user IN (${inList(pool.map((o) => o.id))})`, me.id, mode, ...pool.map((o) => o.id)) : []).map((r) => [r.from_user, r]));
  const top = pool
    .map((o) => {
      const lm = likedMe.get(o.id);
      const bonus = (lm?.super ? 6 : 0) + (lm?.comment ? 3 : 0) + (o.id === pickId ? 1000 : 0);
      return { o, s: compatibilityScore(me, o).score + bonus + Math.random() };
    })
    .sort((a, b) => b.s - a.s)
    .slice(0, 10)
    .map((x) => x.o);

  res.json({ candidates: await enrichCandidates(me, mode, top, { pickId }), limits, daily });
}));

async function createMatch(me, other, mode) {
  const [a, b] = me.id < other.id ? [me.id, other.id] : [other.id, me.id];
  const ins = await run('INSERT OR IGNORE INTO matches (user_a, user_b, created_at, active, mode) VALUES (?, ?, ?, 1, ?)', a, b, now(), mode);
  if (ins.changes === 0) return null;
  const match = await get('SELECT * FROM matches WHERE user_a = ? AND user_b = ?', a, b);
  const t = now();
  const stmts = [['INSERT INTO messages (match_id, sender_id, type, body, created_at) VALUES (?, ?, ?, ?, ?)',
    match.id, me.id, 'system', mode === 'friend' ? 'Arkadaş olarak eşleştiniz! İlk mesajı kim atacak?' : 'Eşleştiniz! İlk mesajı kim atacak?', t]];
  // Yorumlu beğeniler sohbetin ilk mesajı olur (Hinge)
  const likes = await all(`SELECT from_user, comment, target FROM swipes WHERE mode = ? AND action = 'like' AND comment IS NOT NULL
    AND ((from_user = ? AND to_user = ?) OR (from_user = ? AND to_user = ?)) ORDER BY id`, mode, other.id, me.id, me.id, other.id);
  for (const l of likes) {
    stmts.push(['INSERT INTO messages (match_id, sender_id, type, body, created_at) VALUES (?, ?, ?, ?, ?)',
      match.id, l.from_user, 'comment', JSON.stringify({ target: l.target, comment: l.comment }), t]);
  }
  // Açılış soruları (Bumble Opening Moves)
  for (const u of [other, me]) {
    if (u.opening_question) {
      stmts.push(['INSERT INTO messages (match_id, sender_id, type, body, created_at) VALUES (?, ?, ?, ?, ?)',
        match.id, u.id, 'opener', JSON.stringify({ q: u.opening_question }), t]);
    }
  }
  await batch(stmts);
  return match;
}

app.post('/api/swipe', requireAuth, h(async (req, res) => {
  const me = req.user;
  const to = Number(req.body.to);
  const mode = modeOf(req.body.mode);
  const action = req.body.action === 'like' ? 'like' : 'pass';
  const isSuper = action === 'like' && req.body.super === true;
  const comment = action === 'like' ? cleanStr(req.body.comment, LIMITS.commentMax) : null;
  const target = comment ? cleanStr(req.body.target, 120) : null;
  if (!Number.isInteger(to) || to === me.id) throw bad('Geçersiz kullanıcı.');
  const other = await get('SELECT * FROM users WHERE id = ? AND banned = 0', to);
  if (!other) throw bad('Kullanıcı bulunamadı.');
  if (mode === 'friend' && (!me.friend_mode || !other.friend_mode)) throw bad('Arkadaş modu kapalı.');
  if (comment) guardText(req, comment);

  if (action === 'like') {
    const u = await likeUsage(me.id);
    if (u.likesLeft <= 0) throw new HttpError(429, 'Bugünkü beğeni hakkın bitti. Gece yarısı yenilenir.', { limits: u });
    if (isSuper && u.superLeft <= 0) throw new HttpError(429, 'Bugünkü süper beğenini kullandın. Yarın yenilenir.', { limits: u });
  }

  const r = await run(`INSERT OR IGNORE INTO swipes (from_user, to_user, mode, action, super, target, comment, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, me.id, to, mode, action, isSuper ? 1 : 0, target, comment, now());
  const limits = await likeUsage(me.id);
  if (r.changes === 0 || action !== 'like') return res.json({ matched: false, limits });

  const reverse = await get('SELECT 1 AS x FROM swipes WHERE from_user = ? AND to_user = ? AND mode = ? AND action = ?', to, me.id, mode, 'like');
  if (!reverse) {
    if (isSuper || comment) {
      await notify(to, {
        title: isSuper ? 'Biri seni süper beğendi ⭐' : 'Biri profiline yorum yaptı 💬',
        body: 'Keşfet\'e göz at, belki sen de beğenirsin.', url: '/', tag: 'like',
      });
    }
    return res.json({ matched: false, limits });
  }
  const match = await createMatch(me, other, mode);
  if (!match) return res.json({ matched: false, limits });
  await notify(to, { title: 'Yeni eşleşme! 🎉', body: `${displayName(me)} ile eşleştin. İlk mesajı sen at!`, url: `/?match=${match.id}`, tag: `match-${match.id}` });
  res.json({ matched: true, match: { matchId: match.id, user: publicProfile(other), mode }, limits });
}));

/** Son kaydırmayı geri al (Tinder Rewind). Eşleşmeye dönüşmüş beğeni geri alınamaz. */
app.post('/api/swipe/undo', requireAuth, h(async (req, res) => {
  const me = req.user;
  const mode = modeOf(req.body.mode);
  const to = Number(req.body.to);
  const last = await get('SELECT * FROM swipes WHERE from_user = ? AND mode = ? ORDER BY id DESC LIMIT 1', me.id, mode);
  if (!last || last.to_user !== to) throw bad('Sadece son kaydırma geri alınabilir.');
  const [a, b] = me.id < to ? [me.id, to] : [to, me.id];
  if (await get('SELECT 1 AS x FROM matches WHERE user_a = ? AND user_b = ?', a, b)) throw bad('Eşleşmeye dönüşen beğeni geri alınamaz.');
  await run('DELETE FROM swipes WHERE id = ?', last.id);
  const o = await get('SELECT * FROM users WHERE id = ? AND banned = 0', to);
  const pick = await get('SELECT pick_id FROM daily_picks WHERE user_id = ? AND day = ?', me.id, turkeyDay());
  const [candidate] = o ? await enrichCandidates(me, mode, [o], { pickId: pick?.pick_id }) : [];
  res.json({ ok: true, candidate: candidate || null, limits: await likeUsage(me.id) });
}));

// ---------------------------------------------------------------- eşleşmeler & sohbet

let lastSweep = 0;
/** 48 saat içinde kimsenin yazmadığı eşleşmeleri kapatır (Bumble). Yoklamada en fazla 15 sn'de bir çalışır. */
async function sweepExpired({ force = false } = {}) {
  if (!force && now() - lastSweep < 15e3) return;
  lastSweep = now();
  await run(`UPDATE matches SET active = 0, ended_reason = 'expired' WHERE active = 1 AND created_at < ?
    AND NOT EXISTS (SELECT 1 FROM messages x WHERE x.match_id = matches.id AND x.type IN ${TALK_TYPES})`, now() - EXPIRE_MS);
}

async function matchForUser(matchId, userId) {
  const m = await get('SELECT * FROM matches WHERE id = ? AND active = 1 AND (user_a = ? OR user_b = ?)', matchId, userId, userId);
  if (!m) throw new HttpError(404, 'Eşleşme bulunamadı ya da sona erdi.');
  if (now() - m.created_at > EXPIRE_MS && !(await get(`SELECT 1 AS x FROM messages WHERE match_id = ? AND type IN ${TALK_TYPES}`, m.id))) {
    await run("UPDATE matches SET active = 0, ended_reason = 'expired' WHERE id = ?", m.id);
    throw new HttpError(410, 'Bu eşleşmenin süresi doldu: 48 saat içinde kimse yazmadı.');
  }
  m.otherId = m.user_a === userId ? m.user_b : m.user_a;
  return m;
}

/** Oyunlarda karşı tarafın henüz görmemesi gereken bilgiyi (yalanın hangisi olduğu vb.) gizler. */
function viewMessage(m, me) {
  if (m.type !== 'game' || m.sender_id === me) return m;
  const b = parseJSON(m.body, {});
  if (b.kind === 'ttl' && !b.answered) { delete b.lie; return { ...m, body: JSON.stringify(b) }; }
  if (b.kind === 'tot' && b.answer == null) { delete b.senderPick; return { ...m, body: JSON.stringify(b) }; }
  return m;
}

app.get('/api/matches', requireAuth, h(async (req, res) => {
  await sweepExpired({ force: true });
  const me = req.user.id;
  const rows = await all(`
    SELECT m.id AS match_id, m.created_at AS matched_at, m.mode AS match_mode, u.*,
      lm.body AS last_body, lm.type AS last_type, lm.sender_id AS last_sender, lm.created_at AS last_at,
      lt.sender_id AS talk_sender, lt.created_at AS talk_at,
      (SELECT COUNT(*) FROM messages x WHERE x.match_id = m.id AND x.type IN ${TALK_TYPES}) AS talk_count,
      (SELECT COUNT(*) FROM messages msg WHERE msg.match_id = m.id AND msg.sender_id != ?
         AND msg.id > COALESCE((SELECT last_read_id FROM match_reads WHERE match_id = m.id AND user_id = ?), 0)) AS unread
    FROM matches m
    JOIN users u ON u.id = CASE WHEN m.user_a = ? THEN m.user_b ELSE m.user_a END
    LEFT JOIN messages lm ON lm.id = (SELECT MAX(id) FROM messages WHERE match_id = m.id)
    LEFT JOIN messages lt ON lt.id = (SELECT MAX(id) FROM messages WHERE match_id = m.id AND type != 'system')
    WHERE m.active = 1 AND u.banned = 0 AND (m.user_a = ? OR m.user_b = ?)
    ORDER BY COALESCE(lm.created_at, m.created_at) DESC
  `, me, me, me, me, me);
  res.json({
    matches: rows.map((r) => ({
      matchId: r.match_id,
      matchedAt: r.matched_at,
      mode: r.match_mode || 'date',
      user: publicProfile(r),
      lastMessage: r.last_body ? { body: r.last_body, type: r.last_type, mine: r.last_sender === me, at: r.last_at } : null,
      unread: r.unread,
      // Hinge "Sıra sende": son konuşma mesajı karşı taraftan geldiyse
      yourTurn: !!r.talk_sender && r.talk_sender !== me,
      waitingSince: r.talk_sender && r.talk_sender !== me ? r.talk_at : null,
      // Bumble: kimse yazmadıysa 48 saat sonra düşer
      expiresAt: r.talk_count === 0 ? r.matched_at + EXPIRE_MS : null,
    })),
  });
}));

async function sharedSocials(matchId) {
  const out = {};
  for (const m of await all("SELECT sender_id, type, body FROM messages WHERE match_id = ? AND type IN ('social','reveal') ORDER BY id", matchId)) {
    const p = parseJSON(m.body, null);
    if (!p) continue;
    if (m.type === 'social') (out[m.sender_id] ||= {})[p.platform] = p.handle;
    else if (p.kind === 'done') {
      for (const [uid, info] of Object.entries(p.people || {})) Object.assign((out[uid] ||= {}), info.socials || {});
    }
  }
  return out;
}

async function chatInfo(m, me) {
  const day = turkeyDay();
  const rv = await all('SELECT user_id FROM reveals WHERE match_id = ?', m.id);
  const mine = rv.some((r) => r.user_id === me);
  const theirs = rv.some((r) => r.user_id === m.otherId);
  const answers = new Map((await all('SELECT user_id, answer FROM daily_answers WHERE day = ? AND user_id IN (?, ?)', day, me, m.otherId)).map((r) => [r.user_id, r.answer]));
  const talked = await get(`SELECT 1 AS x FROM messages WHERE match_id = ? AND type IN ${TALK_TYPES}`, m.id);
  return {
    mode: m.mode || 'date',
    expiresAt: talked ? null : m.created_at + EXPIRE_MS,
    reveal: { mine, theirs, done: mine && theirs },
    daily: {
      question: dailyQuestion(day),
      mine: answers.get(me) || null,
      theirs: answers.has(m.otherId) ? (answers.has(me) ? answers.get(m.otherId) : null) : null,
      theirsLocked: answers.has(m.otherId) && !answers.has(me),
    },
  };
}

const markRead = (matchId, userId, lastId) => run(
  'INSERT INTO match_reads (match_id, user_id, last_read_id) VALUES (?, ?, ?) ON CONFLICT(match_id, user_id) DO UPDATE SET last_read_id = MAX(last_read_id, excluded.last_read_id)',
  matchId, userId, lastId);

app.get('/api/matches/:id/messages', requireAuth, h(async (req, res) => {
  const me = req.user.id;
  const m = await matchForUser(Number(req.params.id), me);
  const before = Number(req.query.before) || Number.MAX_SAFE_INTEGER;
  const messages = (await all('SELECT id, match_id, sender_id, type, body, created_at FROM messages WHERE match_id = ? AND id < ? ORDER BY id DESC LIMIT 50', m.id, before))
    .reverse().map((x) => viewMessage(x, me));
  const other = await get('SELECT * FROM users WHERE id = ?', m.otherId);
  if (messages.length && before === Number.MAX_SAFE_INTEGER) await markRead(m.id, me, messages[messages.length - 1].id);
  res.json({
    matchId: m.id,
    other: other ? publicProfile(other) : null,
    messages,
    shared: await sharedSocials(m.id),
    hasMore: messages.length === 50,
    info: await chatInfo(m, me),
  });
}));

async function pushMessage(m, senderId, type, body, { flagged = false } = {}) {
  const r = await run('INSERT INTO messages (match_id, sender_id, type, body, flagged, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    m.id, senderId, type, body, flagged ? 1 : 0, now());
  const msg = await get('SELECT id, match_id, sender_id, type, body, created_at FROM messages WHERE id = ?', r.lastInsertRowid);
  await markRead(m.id, senderId, msg.id);
  await run('DELETE FROM typing WHERE match_id = ? AND user_id = ?', m.id, senderId);
  return msg;
}
const chatPush = (m, sender, body) => notify(m.otherId, { title: displayName(sender), body, url: `/?match=${m.id}`, tag: `match-${m.id}` });

app.post('/api/matches/:id/messages', requireAuth, rateLimit(60, 60e3), h(async (req, res) => {
  const m = await matchForUser(Number(req.params.id), req.user.id);
  const body = cleanStr(req.body.body, 1000);
  if (!body) throw bad('Boş mesaj gönderilemez.');
  const flagged = guardText(req, body);
  const message = await pushMessage(m, req.user.id, 'text', body, { flagged });
  await chatPush(m, req.user, body.length > 100 ? body.slice(0, 97) + '…' : body);
  res.json({ message });
}));

/** Profilde kayıtlı (ya da yeni girilen) bir sosyal medya hesabını bu sohbette paylaş. */
app.post('/api/matches/:id/share', requireAuth, h(async (req, res) => {
  const m = await matchForUser(Number(req.params.id), req.user.id);
  const platform = String(req.body.platform || '');
  const def = SOCIALS.find((s) => s.id === platform);
  if (!def) throw bad('Geçersiz platform.');
  const mine = parseJSON(req.user.socials, {});
  const handle = cleanStr(req.body.handle, 60)?.replace(/^@/, '') || mine[platform];
  if (!handle) throw bad(`Önce profiline ${def.label} hesabını ekle.`);
  if (!mine[platform]) {
    mine[platform] = handle;
    await run('UPDATE users SET socials = ? WHERE id = ?', JSON.stringify(mine), req.user.id);
  }
  const message = await pushMessage(m, req.user.id, 'social', JSON.stringify({ platform, handle }));
  await chatPush(m, req.user, `${def.label} hesabını seninle paylaştı 🔗`);
  res.json({ message });
}));

/** Karşılıklı kimlik açma: iki taraf da hazır olduğunda seçilen bilgiler aynı anda açılır. */
app.post('/api/matches/:id/reveal', requireAuth, h(async (req, res) => {
  const me = req.user.id;
  const m = await matchForUser(Number(req.params.id), me);
  const mySocials = parseJSON(req.user.socials, {});
  const name = cleanStr(req.body.name, 60);
  const socials = {};
  for (const p of Array.isArray(req.body.socials) ? req.body.socials : []) {
    if (mySocials[p] && SOCIALS.some((s) => s.id === p)) socials[p] = mySocials[p];
  }
  if (!name && !Object.keys(socials).length) throw bad('Açmak için en az bir bilgi seç: isim ya da bir sosyal medya hesabı.');
  const had = await get('SELECT 1 AS x FROM reveals WHERE match_id = ? AND user_id = ?', m.id, me);
  const otherRow = await get('SELECT payload FROM reveals WHERE match_id = ? AND user_id = ?', m.id, m.otherId);
  if (had && otherRow) throw bad('Kimlikler zaten açıldı.');
  const payload = { name, socials };
  await run(`INSERT INTO reveals (match_id, user_id, payload, created_at) VALUES (?, ?, ?, ?)
    ON CONFLICT(match_id, user_id) DO UPDATE SET payload = excluded.payload`, m.id, me, JSON.stringify(payload), now());

  let message = null;
  if (otherRow) {
    message = await pushMessage(m, me, 'reveal', JSON.stringify({ kind: 'done', people: { [me]: payload, [m.otherId]: parseJSON(otherRow.payload, {}) } }));
    await notify(m.otherId, { title: 'Kimlikler açıldı! 🎉', body: `${displayName(req.user)} ile artık birbirinizi tanıyorsunuz.`, url: `/?match=${m.id}`, tag: `match-${m.id}` });
  } else if (!had) {
    message = await pushMessage(m, me, 'reveal', JSON.stringify({ kind: 'request' }));
    await chatPush(m, req.user, 'Kimliğini açmaya hazır. Sen de hazır mısın? 👀');
  }
  res.json({ message, reveal: { mine: true, theirs: !!otherRow, done: !!otherRow } });
}));

/** Sohbet oyunları: 2 doğru 1 yalan (ttl), Bu mu o mu (tot), Rastgele soru (question). */
app.post('/api/matches/:id/games', requireAuth, rateLimit(30, 60e3), h(async (req, res) => {
  const m = await matchForUser(Number(req.params.id), req.user.id);
  const kind = req.body.kind;
  let body;
  let flagged = false;
  if (kind === 'ttl') {
    const statements = (Array.isArray(req.body.statements) ? req.body.statements : []).slice(0, 3).map((s) => cleanStr(s, 100));
    const lie = Number(req.body.lie);
    if (statements.length !== 3 || statements.some((s) => !s)) throw bad('Üç cümlenin hepsini yaz.');
    if (![0, 1, 2].includes(lie)) throw bad('Hangisinin yalan olduğunu seç.');
    flagged = guardText(req, ...statements);
    body = { kind, statements, lie, answered: false };
  } else if (kind === 'tot') {
    const options = (Array.isArray(req.body.options) ? req.body.options : []).slice(0, 2).map((s) => cleanStr(s, 40));
    const senderPick = Number(req.body.pick);
    if (options.length !== 2 || options.some((s) => !s)) throw bad('İki seçeneği de yaz.');
    if (![0, 1].includes(senderPick)) throw bad('Kendi seçimini yap.');
    flagged = guardText(req, ...options);
    body = { kind, options, senderPick, answer: null };
  } else if (kind === 'question') {
    body = { kind, q: CHAT_QUESTIONS[Math.floor(Math.random() * CHAT_QUESTIONS.length)] };
  } else throw bad('Bilinmeyen oyun.');
  const message = await pushMessage(m, req.user.id, 'game', JSON.stringify(body), { flagged });
  await chatPush(m, req.user, kind === 'question' ? `Soru: ${body.q}` : 'Seni bir oyuna davet etti 🎲');
  res.json({ message });
}));

app.post('/api/matches/:id/games/:msgId/answer', requireAuth, h(async (req, res) => {
  const me = req.user.id;
  const m = await matchForUser(Number(req.params.id), me);
  const g = await get("SELECT * FROM messages WHERE id = ? AND match_id = ? AND type = 'game'", Number(req.params.msgId), m.id);
  if (!g || g.sender_id === me) throw bad('Bu oyunu cevaplayamazsın.');
  const b = parseJSON(g.body, {});
  const choice = Number(req.body.choice);
  let result;
  if (b.kind === 'ttl') {
    if (b.answered) throw bad('Bu oyun zaten cevaplandı.');
    if (![0, 1, 2].includes(choice)) throw bad('Bir seçim yap.');
    Object.assign(b, { answered: true, choice, correct: choice === b.lie });
    result = { kind: 'ttl_answer', ref: g.id, choice, correct: b.correct, lie: b.lie };
  } else if (b.kind === 'tot') {
    if (b.answer != null) throw bad('Bu oyun zaten cevaplandı.');
    if (![0, 1].includes(choice)) throw bad('Bir seçim yap.');
    b.answer = choice;
    result = { kind: 'tot_answer', ref: g.id, choice, same: choice === b.senderPick, senderPick: b.senderPick, options: b.options };
  } else throw bad('Bu oyun cevaplanamaz.');
  await run('UPDATE messages SET body = ? WHERE id = ?', JSON.stringify(b), g.id);
  const message = await pushMessage(m, me, 'game', JSON.stringify(result));
  await chatPush(m, req.user, 'Oyununa cevap verdi 🎲');
  res.json({ message, game: { ...g, body: JSON.stringify(b) } });
}));

app.post('/api/matches/:id/read', requireAuth, h(async (req, res) => {
  const m = await matchForUser(Number(req.params.id), req.user.id);
  const last = (await get('SELECT COALESCE(MAX(id), 0) AS id FROM messages WHERE match_id = ?', m.id)).id;
  await markRead(m.id, req.user.id, last);
  res.json({ ok: true });
}));

app.post('/api/matches/:id/typing', requireAuth, h(async (req, res) => {
  const m = await matchForUser(Number(req.params.id), req.user.id);
  await run('INSERT INTO typing (match_id, user_id, at) VALUES (?, ?, ?) ON CONFLICT(match_id, user_id) DO UPDATE SET at = excluded.at', m.id, req.user.id, now());
  res.json({ ok: true });
}));

app.delete('/api/matches/:id', requireAuth, h(async (req, res) => {
  const m = await matchForUser(Number(req.params.id), req.user.id);
  await run("UPDATE matches SET active = 0, ended_reason = 'unmatch' WHERE id = ?", m.id);
  res.json({ ok: true });
}));

app.post('/api/block', requireAuth, h(async (req, res) => {
  const target = Number(req.body.userId);
  if (!Number.isInteger(target) || target === req.user.id) throw bad('Geçersiz kullanıcı.');
  const [a, b] = req.user.id < target ? [req.user.id, target] : [target, req.user.id];
  await batch([
    ['INSERT OR IGNORE INTO blocks (blocker_id, blocked_id, created_at) VALUES (?, ?, ?)', req.user.id, target, now()],
    ["INSERT OR IGNORE INTO swipes (from_user, to_user, mode, action, created_at) VALUES (?, ?, 'date', 'pass', ?)", req.user.id, target, now()],
    ["INSERT OR IGNORE INTO swipes (from_user, to_user, mode, action, created_at) VALUES (?, ?, 'friend', 'pass', ?)", req.user.id, target, now()],
    ["UPDATE matches SET active = 0, ended_reason = 'block' WHERE user_a = ? AND user_b = ?", a, b],
  ]);
  res.json({ ok: true });
}));

app.post('/api/report', requireAuth, h(async (req, res) => {
  const target = Number(req.body.userId);
  if (!Number.isInteger(target) || target === req.user.id) throw bad('Geçersiz kullanıcı.');
  await run('INSERT INTO reports (reporter_id, reported_id, reason, created_at) VALUES (?, ?, ?, ?)', req.user.id, target, cleanStr(req.body.reason, 500), now());
  res.json({ ok: true });
}));

/**
 * Canlı güncellemeler (WebSocket yerine yoklama).
 * after: istemcinin gördüğü son mesaj id'si. Yoksa sadece başlangıç noktası döner.
 * chat:  açık sohbetin eşleşme id'si (karşı tarafın çevrimiçi / yazıyor durumu için).
 */
app.get('/api/updates', requireAuth, h(async (req, res) => {
  await sweepExpired();
  const me = req.user.id;
  const latestId = (await get('SELECT COALESCE(MAX(id), 0) AS id FROM messages')).id;
  const matchIds = (await all(`SELECT m.id FROM matches m
      JOIN users u ON u.id = CASE WHEN m.user_a = ? THEN m.user_b ELSE m.user_a END
      WHERE m.active = 1 AND u.banned = 0 AND (m.user_a = ? OR m.user_b = ?)`, me, me, me)).map((r) => r.id);

  let messages = [];
  let cursor = latestId;
  const after = req.query.after !== undefined && req.query.after !== '' ? Number(req.query.after) : null;
  if (after !== null && Number.isFinite(after) && matchIds.length && after < latestId) {
    messages = (await all(`SELECT id, match_id, sender_id, type, body, created_at FROM messages
      WHERE id > ? AND id <= ? AND match_id IN (${inList(matchIds)}) ORDER BY id LIMIT 200`, after, latestId, ...matchIds))
      .map((x) => viewMessage(x, me));
    if (messages.length === 200) cursor = messages[199].id;
  }

  let chat = null;
  const chatId = Number(req.query.chat);
  if (chatId && matchIds.includes(chatId)) {
    const m = await get('SELECT user_a, user_b FROM matches WHERE id = ?', chatId);
    const otherId = m.user_a === me ? m.user_b : m.user_a;
    const o = await get('SELECT last_seen FROM users WHERE id = ?', otherId);
    const t = await get('SELECT at FROM typing WHERE match_id = ? AND user_id = ?', chatId, otherId);
    chat = { matchId: chatId, online: isOnline(o?.last_seen), last_seen: o?.last_seen ?? null, typing: !!t && now() - t.at < TYPING_MS };
  }
  res.json({ cursor, matchIds, messages, chat });
}));

// ---------------------------------------------------------------- bildirimler

app.get('/api/push/key', (req, res) => res.json({ enabled: pushEnabled, key: pushPublicKey }));

app.post('/api/push/subscribe', requireAuth, h(async (req, res) => {
  if (!pushEnabled) throw new HttpError(503, 'Bildirimler sunucuda henüz ayarlanmadı.');
  try { await saveSubscription(req.user.id, req.body.subscription); } catch (e) { throw bad(e.message); }
  res.json({ ok: true });
}));

app.post('/api/push/unsubscribe', requireAuth, h(async (req, res) => {
  await removeSubscription(req.body.endpoint);
  res.json({ ok: true });
}));

app.post('/api/push/test', requireAuth, rateLimit(5, 60e3), h(async (req, res) => {
  if (!pushEnabled) throw new HttpError(503, 'Bildirimler sunucuda henüz ayarlanmadı.');
  await notify(req.user.id, { title: 'MedipolDate', body: 'Bildirimler çalışıyor 🎉', url: '/', tag: 'test' }, { evenIfActive: true });
  res.json({ ok: true });
}));

// ---------------------------------------------------------------- admin

const sha = (s) => crypto.createHash('sha256').update(String(s)).digest();
const safeEqual = (a, b) => crypto.timingSafeEqual(sha(a), sha(b));
const ADMIN_OFF = 'Admin paneli kapalı: ortam değişkenlerinde ADMIN_PASSWORD tanımlı değil.';

const requireAdmin = h(async (req, res, next) => {
  if (!ADMIN_PASSWORD) throw new HttpError(503, ADMIN_OFF);
  const token = parseCookies(req.headers.cookie)[ADMIN_COOKIE];
  const s = token && await get('SELECT expires_at FROM admin_sessions WHERE token = ?', token);
  if (!s || s.expires_at <= now()) throw new HttpError(401, 'Admin girişi gerekli.');
  next();
});

function adminUser(u) {
  return {
    ...publicProfile(u),
    username: u.username,
    looking_for: u.looking_for,
    created_at: u.created_at,
    profile_done: !!u.profile_done,
    banned: !!u.banned,
    friend_mode: !!u.friend_mode,
    report_count: u.report_count ?? 0,
    open_reports: u.open_reports ?? 0,
    match_count: u.match_count ?? 0,
  };
}
const USER_COUNTS = `
  (SELECT COUNT(*) FROM reports r WHERE r.reported_id = u.id) AS report_count,
  (SELECT COUNT(*) FROM reports r WHERE r.reported_id = u.id AND r.resolved = 0) AS open_reports,
  (SELECT COUNT(*) FROM matches m WHERE m.active = 1 AND (m.user_a = u.id OR m.user_b = u.id)) AS match_count`;

app.post('/api/admin/login', rateLimit(8, 15 * 60e3), h(async (req, res) => {
  if (!ADMIN_PASSWORD) throw new HttpError(503, ADMIN_OFF);
  const userOk = safeEqual(String(req.body.username || '').trim(), ADMIN_USERNAME);
  const passOk = safeEqual(String(req.body.password || ''), ADMIN_PASSWORD);
  if (!(userOk && passOk)) throw new HttpError(401, 'Kullanıcı adı veya şifre hatalı.');
  const token = crypto.randomBytes(32).toString('hex');
  await run('INSERT INTO admin_sessions (token, created_at, expires_at) VALUES (?, ?, ?)', token, now(), now() + ADMIN_HOURS * 3600e3);
  await run('DELETE FROM admin_sessions WHERE expires_at < ?', now());
  res.setHeader('Set-Cookie', `${ADMIN_COOKIE}=${token}; HttpOnly; Path=/api/admin; SameSite=Strict; Max-Age=${ADMIN_HOURS * 3600}${COOKIE_SECURE ? '; Secure' : ''}`);
  res.json({ ok: true });
}));

app.post('/api/admin/logout', h(async (req, res) => {
  const token = parseCookies(req.headers.cookie)[ADMIN_COOKIE];
  if (token) await run('DELETE FROM admin_sessions WHERE token = ?', token);
  res.setHeader('Set-Cookie', `${ADMIN_COOKIE}=; HttpOnly; Path=/api/admin; SameSite=Strict; Max-Age=0`);
  res.json({ ok: true });
}));

app.get('/api/admin/me', requireAdmin, (req, res) => res.json({ ok: true, username: ADMIN_USERNAME }));

app.get('/api/admin/stats', requireAdmin, h(async (req, res) => {
  const t = now();
  const s = await get(`SELECT
      (SELECT COUNT(*) FROM users) AS users,
      (SELECT COUNT(*) FROM users WHERE profile_done = 1) AS profiles,
      (SELECT COUNT(*) FROM users WHERE created_at > ?) AS newUsers7d,
      (SELECT COUNT(*) FROM users WHERE last_seen > ?) AS online,
      (SELECT COUNT(*) FROM users WHERE banned = 1) AS banned,
      (SELECT COUNT(*) FROM matches WHERE active = 1) AS matches,
      (SELECT COUNT(*) FROM messages WHERE type != 'system' AND created_at > ?) AS messages24h,
      (SELECT COUNT(*) FROM reports WHERE resolved = 0) AS openReports`,
  t - 7 * DAY_MS, t - ONLINE_MS, t - DAY_MS);
  const genders = Object.fromEntries((await all('SELECT gender, COUNT(*) AS n FROM users WHERE profile_done = 1 GROUP BY gender')).map((r) => [r.gender || 'yok', r.n]));
  res.json({ ...s, genders });
}));

app.get('/api/admin/users', requireAdmin, h(async (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 60);
  const filter = String(req.query.filter || 'all');
  const page = Math.max(0, Number(req.query.page) || 0);
  const where = [];
  const params = [];
  if (q) {
    where.push(`(u.username LIKE ? OR u.nickname LIKE ? OR COALESCE(u.first_name,'') LIKE ? OR COALESCE(u.last_name,'') LIKE ? OR COALESCE(u.department,'') LIKE ?)`);
    const like = `%${q}%`;
    params.push(like, like, like, like, like);
  }
  if (filter === 'banned') where.push('u.banned = 1');
  if (filter === 'reported') where.push('EXISTS (SELECT 1 FROM reports r WHERE r.reported_id = u.id AND r.resolved = 0)');
  const rows = await all(`SELECT u.*, ${USER_COUNTS} FROM users u ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY u.created_at DESC LIMIT 31 OFFSET ?`, ...params, page * 30);
  res.json({ users: rows.slice(0, 30).map(adminUser), hasMore: rows.length > 30 });
}));

app.get('/api/admin/users/:id', requireAdmin, h(async (req, res) => {
  const id = Number(req.params.id);
  const u = await get(`SELECT u.*, ${USER_COUNTS} FROM users u WHERE u.id = ?`, id);
  if (!u) throw new HttpError(404, 'Kullanıcı bulunamadı.');
  const reports = await all(`SELECT r.id, r.reason, r.created_at, r.resolved, rep.username AS reporter_username, rep.nickname AS reporter_nickname
    FROM reports r JOIN users rep ON rep.id = r.reporter_id WHERE r.reported_id = ? ORDER BY r.created_at DESC`, id);
  const sent = (await get("SELECT COUNT(*) AS n FROM messages WHERE sender_id = ? AND type != 'system'", id)).n;
  const flagged = (await get('SELECT COUNT(*) AS n FROM messages WHERE sender_id = ? AND flagged = 1', id)).n;
  const reportsMade = (await get('SELECT COUNT(*) AS n FROM reports WHERE reporter_id = ?', id)).n;
  res.json({ user: adminUser(u), reports, messagesSent: sent, flaggedMessages: flagged, reportsMade });
}));

app.post('/api/admin/users/:id/ban', requireAdmin, h(async (req, res) => {
  const id = Number(req.params.id);
  if (!await get('SELECT 1 AS x FROM users WHERE id = ?', id)) throw new HttpError(404, 'Kullanıcı bulunamadı.');
  const banned = req.body.banned !== false;
  if (banned) {
    await batch([
      ['UPDATE users SET banned = 1 WHERE id = ?', id],
      ['UPDATE reports SET resolved = 1 WHERE reported_id = ?', id],
      ["UPDATE matches SET active = 0, ended_reason = 'ban' WHERE active = 1 AND (user_a = ? OR user_b = ?)", id, id],
      ['DELETE FROM sessions WHERE user_id = ?', id],
      ['DELETE FROM push_subs WHERE user_id = ?', id],
    ]);
  } else {
    await run('UPDATE users SET banned = 0 WHERE id = ?', id);
  }
  res.json({ ok: true, banned });
}));

app.delete('/api/admin/users/:id', requireAdmin, h(async (req, res) => {
  const id = Number(req.params.id);
  if (!await get('SELECT 1 AS x FROM users WHERE id = ?', id)) throw new HttpError(404, 'Kullanıcı bulunamadı.');
  await deleteUserCompletely(id);
  res.json({ ok: true });
}));

app.get('/api/admin/reports', requireAdmin, h(async (req, res) => {
  const status = String(req.query.status || 'open');
  const where = status === 'open' ? 'WHERE r.resolved = 0' : status === 'resolved' ? 'WHERE r.resolved = 1' : '';
  const reports = await all(`
    SELECT r.id, r.reason, r.created_at, r.resolved,
      rep.id AS reporter_id, rep.username AS reporter_username, rep.nickname AS reporter_nickname,
      t.id AS target_id, t.username AS target_username, t.nickname AS target_nickname, t.first_name AS target_first_name,
      t.avatar AS target_avatar, t.avatar_color AS target_color, t.banned AS target_banned
    FROM reports r
    JOIN users rep ON rep.id = r.reporter_id
    JOIN users t ON t.id = r.reported_id
    ${where} ORDER BY r.created_at DESC LIMIT 200`);
  res.json({ reports });
}));

app.post('/api/admin/reports/:id/resolve', requireAdmin, h(async (req, res) => {
  const r = await run('UPDATE reports SET resolved = ? WHERE id = ?', req.body.resolved === false ? 0 : 1, Number(req.params.id));
  if (!r.changes) throw new HttpError(404, 'Şikayet bulunamadı.');
  res.json({ ok: true });
}));

// ---------------------------------------------------------------- hata yakalama

app.use('/api', (req, res) => res.status(404).json({ error: 'Bulunamadı.' }));
app.use((err, req, res, _next) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message, ...err.extra });
  if (err instanceof DbConfigError) return res.status(500).json({ error: err.message });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Geçersiz istek.' });
  console.error(err);
  const dbHint = /SQLITE|LIBSQL|HRANA|fetch failed|ECONNREFUSED|401|unauthorized/i.test(`${err.code} ${err.message}`)
    ? ' Veritabanı bağlantısını kontrol et (TURSO_DATABASE_URL / TURSO_AUTH_TOKEN).' : '';
  res.status(500).json({ error: 'Sunucu hatası.' + dbHint });
});
