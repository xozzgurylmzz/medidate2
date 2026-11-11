import express from 'express';
import http from 'node:http';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { Server as SocketServer } from 'socket.io';

import { db, get, all, run, now } from './db.js';
import { meta, randomNickname, randomAvatar, randomColor, INTERESTS, PROMPTS, INTENTS, SOCIALS, AVATARS, AVATAR_COLORS } from './meta.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const COOKIE_NAME = 'md_session';
const SESSION_DAYS = 30;
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true';
const USERNAME_RE = /^[a-z0-9_.]{3,24}$/;
const HOST = process.env.HOST || '0.0.0.0';
const ADMIN_USERNAME = (process.env.ADMIN_USERNAME || 'admin').trim();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const ADMIN_COOKIE = 'md_admin';
const ADMIN_HOURS = 12;

const app = express();
const server = http.createServer(app);
const io = new SocketServer(server);

app.disable('x-powered-by');
// Nginx gibi bir ters vekil arkasında gerçek IP'yi görmek için (istek sınırlama buna bağlı)
if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
app.use(express.json({ limit: '64kb' }));
app.use(express.static(path.join(__dirname, '..', 'public'), { extensions: ['html'] }));

// ---------------------------------------------------------------- yardımcılar

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const bad = (msg) => new HttpError(400, msg);

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
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}

function createSession(res, userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const t = now();
  run('INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)',
    token, userId, t, t + SESSION_DAYS * 86400e3);
  res.setHeader('Set-Cookie',
    `${COOKIE_NAME}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}${COOKIE_SECURE ? '; Secure' : ''}`);
}
function clearSession(req, res) {
  const token = parseCookies(req.headers.cookie)[COOKIE_NAME];
  if (token) run('DELETE FROM sessions WHERE token = ?', token);
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`);
}
function userFromCookie(cookieHeader) {
  const token = parseCookies(cookieHeader)[COOKIE_NAME];
  if (!token) return null;
  const s = get('SELECT user_id, expires_at FROM sessions WHERE token = ?', token);
  if (!s || s.expires_at < now()) return null;
  const u = get('SELECT * FROM users WHERE id = ? AND banned = 0', s.user_id);
  return u || null;
}

const parseJSON = (s, fallback) => { try { return JSON.parse(s); } catch { return fallback; } };

/** Başkalarının görebileceği alanlar (kullanıcı adı ve sosyal medya asla yok). */
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
    online: onlineUsers.has(u.id),
  };
}
function ownProfile(u) {
  return {
    ...publicProfile(u),
    username: u.username,
    looking_for: u.looking_for,
    socials: parseJSON(u.socials, {}),
    profile_done: !!u.profile_done,
  };
}

// basit istek sınırlama (IP başına)
const buckets = new Map();
function rateLimit(limit, windowMs) {
  return (req, res, next) => {
    const key = `${req.ip}:${req.path}`;
    const t = now();
    let b = buckets.get(key);
    if (!b || b.reset < t) { b = { count: 0, reset: t + windowMs }; buckets.set(key, b); }
    b.count++;
    if (b.count > limit) return next(new HttpError(429, 'Çok fazla deneme yaptın, biraz sonra tekrar dene.'));
    next();
  };
}
setInterval(() => { const t = now(); for (const [k, b] of buckets) if (b.reset < t) buckets.delete(k); }, 60e3).unref();

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function requireAuth(req, res, next) {
  const u = userFromCookie(req.headers.cookie);
  if (!u) return next(new HttpError(401, 'Giriş yapman gerekiyor.'));
  req.user = u;
  run('UPDATE users SET last_seen = ? WHERE id = ?', now(), u.id);
  next();
}

// ---------------------------------------------------------------- meta

app.get('/api/meta', (req, res) => res.json(meta()));

// ---------------------------------------------------------------- kimlik

app.post('/api/auth/register', rateLimit(10, 15 * 60e3), wrap(async (req, res) => {
  const username = String(req.body.username || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!USERNAME_RE.test(username)) throw bad('Kullanıcı adı 3-24 karakter olmalı; sadece küçük harf, rakam, nokta ve alt çizgi.');
  if (password.length < 8) throw bad('Şifre en az 8 karakter olmalı.');
  if (get('SELECT 1 FROM users WHERE username = ?', username)) throw bad('Bu kullanıcı adı alınmış.');
  const r = run('INSERT INTO users (username, password_hash, created_at, nickname, avatar, avatar_color) VALUES (?, ?, ?, ?, ?, ?)',
    username, hashPassword(password), now(), randomNickname(), randomAvatar(), randomColor());
  const user = get('SELECT * FROM users WHERE id = ?', r.lastInsertRowid);
  createSession(res, user.id);
  res.json({ ok: true, user: ownProfile(user) });
}));

app.post('/api/auth/login', rateLimit(20, 15 * 60e3), wrap(async (req, res) => {
  const username = String(req.body.username || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const user = get('SELECT * FROM users WHERE username = ?', username);
  if (!user || !verifyPassword(password, user.password_hash)) throw new HttpError(401, 'Kullanıcı adı veya şifre hatalı.');
  if (user.banned) throw new HttpError(403, 'Bu hesap askıya alınmış.');
  createSession(res, user.id);
  res.json({ ok: true, user: ownProfile(user) });
}));

app.post('/api/auth/logout', (req, res) => { clearSession(req, res); res.json({ ok: true }); });

app.get('/api/me', requireAuth, (req, res) => res.json({ user: ownProfile(req.user) }));

app.delete('/api/me', requireAuth, (req, res) => {
  const id = req.user.id;
  const partners = all('SELECT id, user_a, user_b FROM matches WHERE active = 1 AND (user_a = ? OR user_b = ?)', id, id);
  run('DELETE FROM users WHERE id = ?', id);
  clearSession(req, res);
  for (const m of partners) {
    const other = m.user_a === id ? m.user_b : m.user_a;
    io.to(`user:${other}`).emit('unmatch', { matchId: m.id });
  }
  res.json({ ok: true });
});

// ---------------------------------------------------------------- profil

const cleanStr = (v, max) => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim().slice(0, max);
  return s.length ? s : null;
};

app.put('/api/profile', requireAuth, (req, res) => {
  const b = req.body || {};
  const nickname = cleanStr(b.nickname, 30) || req.user.nickname;
  const avatar = AVATARS.includes(b.avatar) ? b.avatar : req.user.avatar;
  const avatar_color = AVATAR_COLORS.includes(b.avatar_color) ? b.avatar_color : req.user.avatar_color;
  const first_name = cleanStr(b.first_name, 40);
  const last_name = cleanStr(b.last_name, 40);
  let age = b.age === '' || b.age === null || b.age === undefined ? null : Number(b.age);
  if (age !== null && (!Number.isInteger(age) || age < 17 || age > 80)) throw bad('Yaş 17 ile 80 arasında olmalı.');
  const department = cleanStr(b.department, 80);
  if (!['kadin', 'erkek'].includes(b.gender)) throw bad('Cinsiyet seçimi zorunlu.');
  const gender = b.gender;
  const looking_for = ['kadin', 'erkek', 'herkes'].includes(b.looking_for) ? b.looking_for : 'herkes';
  const intent = INTENTS.some((i) => i.id === b.intent) ? b.intent : null;
  const bio = cleanStr(b.bio, 400);

  const interests = Array.isArray(b.interests)
    ? [...new Set(b.interests.filter((i) => INTERESTS.includes(i)))].slice(0, 12) : [];

  const prompts = Array.isArray(b.prompts)
    ? b.prompts
      .filter((p) => p && PROMPTS.includes(p.q) && cleanStr(p.a, 200))
      .map((p) => ({ q: p.q, a: cleanStr(p.a, 200) }))
      .slice(0, 3) : [];

  const socials = {};
  if (b.socials && typeof b.socials === 'object') {
    for (const s of SOCIALS) {
      const v = cleanStr(b.socials[s.id], 60);
      if (v) socials[s.id] = v.replace(/^@/, '');
    }
  }

  run(`UPDATE users SET nickname=?, avatar=?, avatar_color=?, first_name=?, last_name=?, age=?, department=?,
       gender=?, looking_for=?, intent=?, bio=?, interests=?, prompts=?, socials=?, profile_done=1 WHERE id=?`,
    nickname, avatar, avatar_color, first_name, last_name, age, department, gender, looking_for, intent, bio,
    JSON.stringify(interests), JSON.stringify(prompts), JSON.stringify(socials), req.user.id);
  res.json({ user: ownProfile(get('SELECT * FROM users WHERE id = ?', req.user.id)) });
});

// ---------------------------------------------------------------- keşfet & kaydırma

function compatibilityScore(me, other) {
  const mine = new Set(parseJSON(me.interests, []));
  const theirs = parseJSON(other.interests, []);
  const shared = theirs.filter((i) => mine.has(i));
  let score = shared.length * 3;
  if (me.intent && me.intent === other.intent) score += 2;
  if (me.department && me.department === other.department) score += 1;
  if (other.bio) score += 0.5;
  score += Math.min(parseJSON(other.prompts, []).length, 3) * 0.5;
  return { score, shared };
}

app.get('/api/discover', requireAuth, (req, res) => {
  const me = req.user;
  if (!me.profile_done) return res.json({ candidates: [], needsProfile: true });
  const rows = all(`
    SELECT u.* FROM users u
    WHERE u.id != ? AND u.profile_done = 1 AND u.banned = 0
      AND NOT EXISTS (SELECT 1 FROM swipes s WHERE s.from_user = ? AND s.to_user = u.id)
      AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id = ? AND b.blocked_id = u.id) OR (b.blocker_id = u.id AND b.blocked_id = ?))
      AND NOT EXISTS (SELECT 1 FROM matches m WHERE (m.user_a = ? AND m.user_b = u.id) OR (m.user_a = u.id AND m.user_b = ?))
  `, me.id, me.id, me.id, me.id, me.id, me.id);

  const candidates = rows
    .filter((o) => me.looking_for === 'herkes' || o.gender === me.looking_for)
    .filter((o) => o.looking_for === 'herkes' || (me.gender && o.looking_for === me.gender))
    .map((o) => {
      const { score, shared } = compatibilityScore(me, o);
      return { profile: publicProfile(o), score: score + Math.random(), shared };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(({ profile, shared }) => ({ ...profile, sharedInterests: shared }));

  res.json({ candidates });
});

app.post('/api/swipe', requireAuth, (req, res) => {
  const me = req.user;
  const to = Number(req.body.to);
  const action = req.body.action === 'like' ? 'like' : 'pass';
  if (!Number.isInteger(to) || to === me.id) throw bad('Geçersiz kullanıcı.');
  const other = get('SELECT * FROM users WHERE id = ? AND banned = 0', to);
  if (!other) throw bad('Kullanıcı bulunamadı.');

  const r = run('INSERT OR IGNORE INTO swipes (from_user, to_user, action, created_at) VALUES (?, ?, ?, ?)',
    me.id, to, action, now());
  if (r.changes === 0) return res.json({ matched: false });
  if (action !== 'like') return res.json({ matched: false });

  const reverse = get('SELECT 1 FROM swipes WHERE from_user = ? AND to_user = ? AND action = ?', to, me.id, 'like');
  if (!reverse) return res.json({ matched: false });

  const [a, b] = me.id < to ? [me.id, to] : [to, me.id];
  const ins = run('INSERT OR IGNORE INTO matches (user_a, user_b, created_at, active) VALUES (?, ?, ?, 1)', a, b, now());
  if (ins.changes === 0) return res.json({ matched: false });
  const match = get('SELECT * FROM matches WHERE user_a = ? AND user_b = ?', a, b);
  run('INSERT INTO messages (match_id, sender_id, type, body, created_at) VALUES (?, ?, ?, ?, ?)',
    match.id, me.id, 'system', 'Eşleştiniz! İlk mesajı kim atacak?', now());

  const payloadForMe = { matchId: match.id, user: publicProfile(other) };
  const payloadForThem = { matchId: match.id, user: publicProfile(me) };
  io.to(`user:${other.id}`).emit('match', payloadForThem);
  res.json({ matched: true, match: payloadForMe });
});

// ---------------------------------------------------------------- eşleşmeler & sohbet

function matchForUser(matchId, userId) {
  const m = get('SELECT * FROM matches WHERE id = ? AND active = 1 AND (user_a = ? OR user_b = ?)', matchId, userId, userId);
  if (!m) throw new HttpError(404, 'Eşleşme bulunamadı.');
  m.otherId = m.user_a === userId ? m.user_b : m.user_a;
  return m;
}

app.get('/api/matches', requireAuth, (req, res) => {
  const me = req.user.id;
  const rows = all(`
    SELECT m.id AS match_id, m.created_at AS matched_at, u.*,
      (SELECT body FROM messages WHERE match_id = m.id ORDER BY id DESC LIMIT 1) AS last_body,
      (SELECT type FROM messages WHERE match_id = m.id ORDER BY id DESC LIMIT 1) AS last_type,
      (SELECT sender_id FROM messages WHERE match_id = m.id ORDER BY id DESC LIMIT 1) AS last_sender,
      (SELECT created_at FROM messages WHERE match_id = m.id ORDER BY id DESC LIMIT 1) AS last_at,
      (SELECT COUNT(*) FROM messages msg WHERE msg.match_id = m.id AND msg.sender_id != ?
         AND msg.id > COALESCE((SELECT last_read_id FROM match_reads WHERE match_id = m.id AND user_id = ?), 0)) AS unread
    FROM matches m
    JOIN users u ON u.id = CASE WHEN m.user_a = ? THEN m.user_b ELSE m.user_a END
    WHERE m.active = 1 AND u.banned = 0 AND (m.user_a = ? OR m.user_b = ?)
    ORDER BY COALESCE(last_at, m.created_at) DESC
  `, me, me, me, me, me).map((r) => ({
    matchId: r.match_id,
    matchedAt: r.matched_at,
    user: publicProfile(r),
    lastMessage: r.last_body ? { body: r.last_body, type: r.last_type, mine: r.last_sender === me, at: r.last_at } : null,
    unread: r.unread,
  }));
  res.json({ matches: rows });
});

function sharedSocials(matchId) {
  const out = {};
  for (const m of all("SELECT sender_id, body FROM messages WHERE match_id = ? AND type = 'social' ORDER BY id", matchId)) {
    const p = parseJSON(m.body, null);
    if (!p) continue;
    (out[m.sender_id] ||= {})[p.platform] = p.handle;
  }
  return out;
}

app.get('/api/matches/:id/messages', requireAuth, (req, res) => {
  const m = matchForUser(Number(req.params.id), req.user.id);
  const before = Number(req.query.before) || Number.MAX_SAFE_INTEGER;
  const messages = all('SELECT id, sender_id, type, body, created_at FROM messages WHERE match_id = ? AND id < ? ORDER BY id DESC LIMIT 50',
    m.id, before).reverse();
  const other = get('SELECT * FROM users WHERE id = ?', m.otherId);
  const last = messages.length ? messages[messages.length - 1].id : 0;
  if (last && before === Number.MAX_SAFE_INTEGER) {
    run('INSERT INTO match_reads (match_id, user_id, last_read_id) VALUES (?, ?, ?) ON CONFLICT(match_id, user_id) DO UPDATE SET last_read_id = MAX(last_read_id, excluded.last_read_id)',
      m.id, req.user.id, last);
  }
  res.json({
    matchId: m.id,
    other: other ? publicProfile(other) : null,
    messages,
    shared: sharedSocials(m.id),
    hasMore: messages.length === 50,
  });
});

function pushMessage(m, senderId, type, body) {
  const r = run('INSERT INTO messages (match_id, sender_id, type, body, created_at) VALUES (?, ?, ?, ?, ?)',
    m.id, senderId, type, body, now());
  const msg = get('SELECT id, sender_id, type, body, created_at FROM messages WHERE id = ?', r.lastInsertRowid);
  run('INSERT INTO match_reads (match_id, user_id, last_read_id) VALUES (?, ?, ?) ON CONFLICT(match_id, user_id) DO UPDATE SET last_read_id = MAX(last_read_id, excluded.last_read_id)',
    m.id, senderId, msg.id);
  const payload = { matchId: m.id, message: msg };
  io.to(`user:${m.user_a}`).emit('message', payload);
  io.to(`user:${m.user_b}`).emit('message', payload);
  return msg;
}

app.post('/api/matches/:id/messages', requireAuth, rateLimit(60, 60e3), (req, res) => {
  const m = matchForUser(Number(req.params.id), req.user.id);
  const body = cleanStr(req.body.body, 1000);
  if (!body) throw bad('Boş mesaj gönderilemez.');
  res.json({ message: pushMessage(m, req.user.id, 'text', body) });
});

/** Profilde kayıtlı bir sosyal medya hesabını bu sohbette açıkla. */
app.post('/api/matches/:id/share', requireAuth, (req, res) => {
  const m = matchForUser(Number(req.params.id), req.user.id);
  const platform = String(req.body.platform || '');
  const def = SOCIALS.find((s) => s.id === platform);
  if (!def) throw bad('Geçersiz platform.');
  const mine = parseJSON(req.user.socials, {});
  const handle = cleanStr(req.body.handle, 60)?.replace(/^@/, '') || mine[platform];
  if (!handle) throw bad(`Önce profiline ${def.label} hesabını ekle.`);
  if (!mine[platform]) {
    mine[platform] = handle;
    run('UPDATE users SET socials = ? WHERE id = ?', JSON.stringify(mine), req.user.id);
  }
  res.json({ message: pushMessage(m, req.user.id, 'social', JSON.stringify({ platform, handle })) });
});

app.post('/api/matches/:id/read', requireAuth, (req, res) => {
  const m = matchForUser(Number(req.params.id), req.user.id);
  const last = get('SELECT COALESCE(MAX(id), 0) AS id FROM messages WHERE match_id = ?', m.id).id;
  run('INSERT INTO match_reads (match_id, user_id, last_read_id) VALUES (?, ?, ?) ON CONFLICT(match_id, user_id) DO UPDATE SET last_read_id = MAX(last_read_id, excluded.last_read_id)',
    m.id, req.user.id, last);
  res.json({ ok: true });
});

app.delete('/api/matches/:id', requireAuth, (req, res) => {
  const m = matchForUser(Number(req.params.id), req.user.id);
  run('UPDATE matches SET active = 0 WHERE id = ?', m.id);
  io.to(`user:${m.otherId}`).emit('unmatch', { matchId: m.id });
  res.json({ ok: true });
});

app.post('/api/block', requireAuth, (req, res) => {
  const target = Number(req.body.userId);
  if (!Number.isInteger(target) || target === req.user.id) throw bad('Geçersiz kullanıcı.');
  run('INSERT OR IGNORE INTO blocks (blocker_id, blocked_id, created_at) VALUES (?, ?, ?)', req.user.id, target, now());
  run('INSERT OR IGNORE INTO swipes (from_user, to_user, action, created_at) VALUES (?, ?, ?, ?)', req.user.id, target, 'pass', now());
  const [a, b] = req.user.id < target ? [req.user.id, target] : [target, req.user.id];
  const m = get('SELECT id FROM matches WHERE user_a = ? AND user_b = ? AND active = 1', a, b);
  if (m) {
    run('UPDATE matches SET active = 0 WHERE id = ?', m.id);
    io.to(`user:${target}`).emit('unmatch', { matchId: m.id });
  }
  res.json({ ok: true });
});

app.post('/api/report', requireAuth, (req, res) => {
  const target = Number(req.body.userId);
  if (!Number.isInteger(target) || target === req.user.id) throw bad('Geçersiz kullanıcı.');
  run('INSERT INTO reports (reporter_id, reported_id, reason, created_at) VALUES (?, ?, ?, ?)',
    req.user.id, target, cleanStr(req.body.reason, 500), now());
  res.json({ ok: true });
});

// ---------------------------------------------------------------- admin

const sha = (s) => crypto.createHash('sha256').update(String(s)).digest();
const safeEqual = (a, b) => crypto.timingSafeEqual(sha(a), sha(b));

function isAdmin(req) {
  const token = parseCookies(req.headers.cookie)[ADMIN_COOKIE];
  if (!token) return false;
  const s = get('SELECT expires_at FROM admin_sessions WHERE token = ?', token);
  return !!s && s.expires_at > now();
}
const ADMIN_OFF = 'Admin paneli kapalı: .env dosyasında ADMIN_PASSWORD tanımlı değil.';
function requireAdmin(req, res, next) {
  if (!ADMIN_PASSWORD) return next(new HttpError(503, ADMIN_OFF));
  if (!isAdmin(req)) return next(new HttpError(401, 'Admin girişi gerekli.'));
  next();
}

function adminUser(u) {
  return {
    ...publicProfile(u),
    username: u.username,
    looking_for: u.looking_for,
    created_at: u.created_at,
    profile_done: !!u.profile_done,
    banned: !!u.banned,
    report_count: u.report_count ?? 0,
    open_reports: u.open_reports ?? 0,
    match_count: u.match_count ?? 0,
  };
}
const USER_COUNTS = `
  (SELECT COUNT(*) FROM reports r WHERE r.reported_id = u.id) AS report_count,
  (SELECT COUNT(*) FROM reports r WHERE r.reported_id = u.id AND r.resolved = 0) AS open_reports,
  (SELECT COUNT(*) FROM matches m WHERE m.active = 1 AND (m.user_a = u.id OR m.user_b = u.id)) AS match_count`;

/** Kullanıcının tüm aktif eşleşmelerini kapatır ve karşı taraflara haber verir. */
function closeMatchesOf(userId) {
  for (const m of all('SELECT id, user_a, user_b FROM matches WHERE active = 1 AND (user_a = ? OR user_b = ?)', userId, userId)) {
    run('UPDATE matches SET active = 0 WHERE id = ?', m.id);
    io.to(`user:${m.user_a === userId ? m.user_b : m.user_a}`).emit('unmatch', { matchId: m.id });
  }
}
/** Oturumlarını siler ve açık bağlantılarını keser. */
function kickUser(userId) {
  run('DELETE FROM sessions WHERE user_id = ?', userId);
  io.in(`user:${userId}`).disconnectSockets(true);
}

app.post('/api/admin/login', rateLimit(8, 15 * 60e3), (req, res) => {
  if (!ADMIN_PASSWORD) throw new HttpError(503, ADMIN_OFF);
  const userOk = safeEqual(String(req.body.username || '').trim(), ADMIN_USERNAME);
  const passOk = safeEqual(String(req.body.password || ''), ADMIN_PASSWORD);
  if (!(userOk && passOk)) throw new HttpError(401, 'Kullanıcı adı veya şifre hatalı.');
  const token = crypto.randomBytes(32).toString('hex');
  run('INSERT INTO admin_sessions (token, created_at, expires_at) VALUES (?, ?, ?)', token, now(), now() + ADMIN_HOURS * 3600e3);
  res.setHeader('Set-Cookie',
    `${ADMIN_COOKIE}=${token}; HttpOnly; Path=/api/admin; SameSite=Strict; Max-Age=${ADMIN_HOURS * 3600}${COOKIE_SECURE ? '; Secure' : ''}`);
  res.json({ ok: true });
});

app.post('/api/admin/logout', (req, res) => {
  const token = parseCookies(req.headers.cookie)[ADMIN_COOKIE];
  if (token) run('DELETE FROM admin_sessions WHERE token = ?', token);
  res.setHeader('Set-Cookie', `${ADMIN_COOKIE}=; HttpOnly; Path=/api/admin; SameSite=Strict; Max-Age=0`);
  res.json({ ok: true });
});

app.get('/api/admin/me', requireAdmin, (req, res) => res.json({ ok: true, username: ADMIN_USERNAME }));

app.get('/api/admin/stats', requireAdmin, (req, res) => {
  const n = (sql, ...p) => get(sql, ...p).n;
  const day = 86400e3;
  res.json({
    users: n('SELECT COUNT(*) AS n FROM users'),
    profiles: n('SELECT COUNT(*) AS n FROM users WHERE profile_done = 1'),
    newUsers7d: n('SELECT COUNT(*) AS n FROM users WHERE created_at > ?', now() - 7 * day),
    online: onlineUsers.size,
    banned: n('SELECT COUNT(*) AS n FROM users WHERE banned = 1'),
    matches: n('SELECT COUNT(*) AS n FROM matches WHERE active = 1'),
    messages24h: n("SELECT COUNT(*) AS n FROM messages WHERE type != 'system' AND created_at > ?", now() - day),
    openReports: n('SELECT COUNT(*) AS n FROM reports WHERE resolved = 0'),
    genders: Object.fromEntries(all('SELECT gender, COUNT(*) AS n FROM users WHERE profile_done = 1 GROUP BY gender').map((r) => [r.gender || 'yok', r.n])),
  });
});

app.get('/api/admin/users', requireAdmin, (req, res) => {
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
  const rows = all(`SELECT u.*, ${USER_COUNTS} FROM users u ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY u.created_at DESC LIMIT 31 OFFSET ?`, ...params, page * 30);
  res.json({ users: rows.slice(0, 30).map(adminUser), hasMore: rows.length > 30 });
});

app.get('/api/admin/users/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const u = get(`SELECT u.*, ${USER_COUNTS} FROM users u WHERE u.id = ?`, id);
  if (!u) throw new HttpError(404, 'Kullanıcı bulunamadı.');
  const reports = all(`SELECT r.id, r.reason, r.created_at, r.resolved, rep.username AS reporter_username, rep.nickname AS reporter_nickname
    FROM reports r JOIN users rep ON rep.id = r.reporter_id WHERE r.reported_id = ? ORDER BY r.created_at DESC`, id);
  const sent = get("SELECT COUNT(*) AS n FROM messages WHERE sender_id = ? AND type != 'system'", id).n;
  const reportsMade = get('SELECT COUNT(*) AS n FROM reports WHERE reporter_id = ?', id).n;
  res.json({ user: adminUser(u), reports, messagesSent: sent, reportsMade });
});

app.post('/api/admin/users/:id/ban', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!get('SELECT 1 FROM users WHERE id = ?', id)) throw new HttpError(404, 'Kullanıcı bulunamadı.');
  const banned = req.body.banned !== false;
  run('UPDATE users SET banned = ? WHERE id = ?', banned ? 1 : 0, id);
  if (banned) {
    run('UPDATE reports SET resolved = 1 WHERE reported_id = ?', id);
    closeMatchesOf(id);
    kickUser(id);
  }
  res.json({ ok: true, banned });
});

app.delete('/api/admin/users/:id', requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!get('SELECT 1 FROM users WHERE id = ?', id)) throw new HttpError(404, 'Kullanıcı bulunamadı.');
  closeMatchesOf(id);
  kickUser(id);
  run('DELETE FROM users WHERE id = ?', id);
  res.json({ ok: true });
});

app.get('/api/admin/reports', requireAdmin, (req, res) => {
  const status = String(req.query.status || 'open');
  const where = status === 'open' ? 'WHERE r.resolved = 0' : status === 'resolved' ? 'WHERE r.resolved = 1' : '';
  const reports = all(`
    SELECT r.id, r.reason, r.created_at, r.resolved,
      rep.id AS reporter_id, rep.username AS reporter_username, rep.nickname AS reporter_nickname,
      t.id AS target_id, t.username AS target_username, t.nickname AS target_nickname, t.first_name AS target_first_name,
      t.avatar AS target_avatar, t.avatar_color AS target_color, t.banned AS target_banned
    FROM reports r
    JOIN users rep ON rep.id = r.reporter_id
    JOIN users t ON t.id = r.reported_id
    ${where} ORDER BY r.created_at DESC LIMIT 200`);
  res.json({ reports });
});

app.post('/api/admin/reports/:id/resolve', requireAdmin, (req, res) => {
  const r = run('UPDATE reports SET resolved = ? WHERE id = ?', req.body.resolved === false ? 0 : 1, Number(req.params.id));
  if (!r.changes) throw new HttpError(404, 'Şikayet bulunamadı.');
  res.json({ ok: true });
});

// ---------------------------------------------------------------- hata yakalama

app.use('/api', (req, res) => res.status(404).json({ error: 'Bulunamadı.' }));
app.use((err, req, res, _next) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Geçersiz istek.' });
  console.error(err);
  res.status(500).json({ error: 'Sunucu hatası.' });
});

// ---------------------------------------------------------------- socket.io

const onlineUsers = new Map(); // userId -> bağlı soket sayısı

io.use((socket, next) => {
  const u = userFromCookie(socket.handshake.headers.cookie);
  if (!u) return next(new Error('unauthorized'));
  socket.data.userId = u.id;
  next();
});

io.on('connection', (socket) => {
  const id = socket.data.userId;
  socket.join(`user:${id}`);
  onlineUsers.set(id, (onlineUsers.get(id) || 0) + 1);
  if (onlineUsers.get(id) === 1) notifyPresence(id, true);

  socket.on('typing', (matchId) => {
    try {
      const m = matchForUser(Number(matchId), id);
      socket.to(`user:${m.otherId}`).emit('typing', { matchId: m.id, userId: id });
    } catch { /* yok say */ }
  });

  socket.on('disconnect', () => {
    const n = (onlineUsers.get(id) || 1) - 1;
    if (n <= 0) { onlineUsers.delete(id); notifyPresence(id, false); run('UPDATE users SET last_seen = ? WHERE id = ?', now(), id); }
    else onlineUsers.set(id, n);
  });
});

function notifyPresence(userId, online) {
  const partners = all('SELECT user_a, user_b FROM matches WHERE active = 1 AND (user_a = ? OR user_b = ?)', userId, userId);
  for (const m of partners) {
    const other = m.user_a === userId ? m.user_b : m.user_a;
    io.to(`user:${other}`).emit('presence', { userId, online });
  }
}

// süresi dolmuş oturumları temizle
setInterval(() => {
  run('DELETE FROM sessions WHERE expires_at < ?', now());
  run('DELETE FROM admin_sessions WHERE expires_at < ?', now());
}, 3600e3).unref();

server.listen(PORT, HOST, () => {
  console.log(`MedipolDate çalışıyor: http://localhost:${PORT}`);
  console.log(ADMIN_PASSWORD ? `Admin paneli: http://localhost:${PORT}/admin (kullanıcı: ${ADMIN_USERNAME})` : 'Admin paneli KAPALI: .env içine ADMIN_PASSWORD ekle.');
});
