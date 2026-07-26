import bcrypt from 'bcryptjs';
import { HttpError } from './http.js';

const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function checkRateLimit(db, ip) {
  const row = await db.prepare('SELECT attempts, lock_until FROM login_attempts WHERE ip = ?').bind(ip).first();
  if (!row) return { locked: false };
  if (row.attempts >= MAX_ATTEMPTS && Date.now() < row.lock_until) {
    return { locked: true, minutesRemaining: Math.ceil((row.lock_until - Date.now()) / 60000) };
  }
  return { locked: false };
}

export async function recordLoginResult(db, ip, success) {
  if (success) {
    await db.prepare('DELETE FROM login_attempts WHERE ip = ?').bind(ip).run();
    return;
  }
  const row = await db.prepare('SELECT attempts FROM login_attempts WHERE ip = ?').bind(ip).first();
  const attempts = (row?.attempts || 0) + 1;
  const lockUntil = attempts >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MS : 0;
  await db
    .prepare('INSERT INTO login_attempts (ip, attempts, lock_until, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(ip) DO UPDATE SET attempts = ?, lock_until = ?, updated_at = ?')
    .bind(ip, attempts, lockUntil, Date.now(), attempts, lockUntil, Date.now())
    .run();
  return MAX_ATTEMPTS - attempts;
}

export async function getPasswordHash(db) {
  const row = await db.prepare('SELECT password_hash FROM admin_config WHERE id = 1').first();
  return row?.password_hash || null;
}

export async function setPasswordHash(db, hash) {
  await db
    .prepare('INSERT INTO admin_config (id, password_hash, updated_at) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET password_hash = ?, updated_at = ?')
    .bind(hash, Date.now(), hash, Date.now())
    .run();
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

export async function createSession(db) {
  const token = randomToken();
  const expiresAt = Date.now() + SESSION_TTL_MS;
  await db.prepare('INSERT INTO sessions (token, expires_at, created_at) VALUES (?, ?, ?)').bind(token, expiresAt, Date.now()).run();
  return { token, expiresAt };
}

export async function destroySession(db, token) {
  if (!token) return;
  await db.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
}

export async function destroyAllSessions(db) {
  await db.prepare('DELETE FROM sessions').run();
}

// Opportunistic cleanup of expired sessions/lockouts — cheap, avoids needing a cron.
export async function pruneExpired(db) {
  const now = Date.now();
  await db.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(now).run();
}

export function extractBearerToken(request) {
  const header = request.headers.get('Authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

// Throws HttpError(401) if not authenticated. Returns the valid session row otherwise.
export async function requireAuth(request, db) {
  const token = extractBearerToken(request);
  if (!token) throw new HttpError('Not authenticated.', 401);

  const row = await db.prepare('SELECT token, expires_at FROM sessions WHERE token = ?').bind(token).first();
  if (!row || Date.now() > row.expires_at) {
    if (row) await db.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
    throw new HttpError('Session expired or invalid. Please log in again.', 401);
  }
  return row;
}
