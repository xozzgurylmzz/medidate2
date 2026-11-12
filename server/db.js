// Veritabanı katmanı: libSQL (Turso).
// - Vercel / bulut: TURSO_DATABASE_URL + TURSO_AUTH_TOKEN ortam değişkenleri.
// - Yerel geliştirme: değişken yoksa data/medipoldate.sqlite dosyası kullanılır.
import { createClient } from '@libsql/client';
import fs from 'node:fs';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  last_seen INTEGER,
  banned INTEGER NOT NULL DEFAULT 0,
  nickname TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT 'a01',
  avatar_color TEXT NOT NULL DEFAULT '#f43f5e',
  first_name TEXT,
  last_name TEXT,
  age INTEGER,
  department TEXT,
  gender TEXT,
  looking_for TEXT NOT NULL DEFAULT 'herkes',
  intent TEXT,
  bio TEXT,
  interests TEXT NOT NULL DEFAULT '[]',
  prompts TEXT NOT NULL DEFAULT '[]',
  socials TEXT NOT NULL DEFAULT '{}',
  profile_done INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE TABLE IF NOT EXISTS swipes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_user INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('like','pass')),
  created_at INTEGER NOT NULL,
  UNIQUE(from_user, to_user)
);
CREATE INDEX IF NOT EXISTS idx_swipes_to ON swipes(to_user);
CREATE TABLE IF NOT EXISTS matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_a INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  UNIQUE(user_a, user_b)
);
CREATE INDEX IF NOT EXISTS idx_matches_b ON matches(user_b);
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text','social','system')),
  body TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_match ON messages(match_id, id);
CREATE TABLE IF NOT EXISTS match_reads (
  match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_read_id INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (match_id, user_id)
);
CREATE TABLE IF NOT EXISTS typing (
  match_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  at INTEGER NOT NULL,
  PRIMARY KEY (match_id, user_id)
);
CREATE TABLE IF NOT EXISTS blocks (
  blocker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (blocker_id, blocked_id)
);
CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  created_at INTEGER NOT NULL,
  resolved INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS admin_sessions (
  token TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
`;

export class DbConfigError extends Error {}

const remoteUrl = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL || '';
export const isRemote = !!remoteUrl;

let client = null;
let ready = null;

function getClient() {
  if (client) return client;
  if (!remoteUrl && process.env.VERCEL) {
    throw new DbConfigError('Veritabanı ayarlanmamış: Vercel ortam değişkenlerine TURSO_DATABASE_URL ve TURSO_AUTH_TOKEN ekleyip yeniden deploy et.');
  }
  if (remoteUrl) {
    client = createClient({ url: remoteUrl, authToken: process.env.TURSO_AUTH_TOKEN });
  } else {
    fs.mkdirSync('data', { recursive: true });
    client = createClient({ url: 'file:data/medipoldate.sqlite' });
  }
  return client;
}

/** Şemayı (bir kez) oluşturur. Her istekten önce beklenir; ikinci seferden sonra anında döner. */
export function ensureDb() {
  if (!ready) {
    ready = (async () => {
      const c = getClient();
      if (!remoteUrl) await c.execute('PRAGMA journal_mode = WAL');
      await c.executeMultiple(SCHEMA);
      // eski yerel veritabanları için sütun ekleme
      const cols = (await c.execute('PRAGMA table_info(reports)')).rows.map((r) => r.name);
      if (!cols.includes('resolved')) await c.execute('ALTER TABLE reports ADD COLUMN resolved INTEGER NOT NULL DEFAULT 0');
      await c.execute('CREATE INDEX IF NOT EXISTS idx_reports_reported ON reports(reported_id, resolved)');
    })().catch((e) => { ready = null; throw e; });
  }
  return ready;
}

function toObjects(rs) {
  return rs.rows.map((row) => {
    const o = {};
    rs.columns.forEach((c, i) => { o[c] = typeof row[i] === 'bigint' ? Number(row[i]) : row[i]; });
    return o;
  });
}

const exec = (sql, args) => getClient().execute({ sql, args });

export async function all(sql, ...args) { return toObjects(await exec(sql, args)); }
export async function get(sql, ...args) { return (await all(sql, ...args))[0]; }
export async function run(sql, ...args) {
  const r = await exec(sql, args);
  return { changes: r.rowsAffected, lastInsertRowid: r.lastInsertRowid !== undefined ? Number(r.lastInsertRowid) : undefined };
}
/** Birden fazla yazma işlemini tek işlem (transaction) olarak çalıştırır. */
export async function batch(statements) {
  return getClient().batch(statements.map(([sql, ...args]) => ({ sql, args })), 'write');
}
export const now = () => Date.now();
