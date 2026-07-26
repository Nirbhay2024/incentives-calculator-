import bcrypt from 'bcryptjs';

const PASS_KEY = 'incentives_admin_hash';
const LOCK_KEY = 'incentives_admin_lockout';
const SESSION_KEY = 'incentives_admin_session';
const DEFAULT_PASS = 'admin1234';

// Initialize default hash if not present
export function initAuth() {
  if (!localStorage.getItem(PASS_KEY)) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(DEFAULT_PASS, salt);
    localStorage.setItem(PASS_KEY, hash);
  }
}

export function isLockedOut() {
  const lockData = localStorage.getItem(LOCK_KEY);
  if (!lockData) return false;
  const { lockUntil, attempts } = JSON.parse(lockData);
  if (attempts >= 5) {
    if (Date.now() < lockUntil) {
      return Math.ceil((lockUntil - Date.now()) / 60000); // minutes remaining
    } else {
      localStorage.removeItem(LOCK_KEY);
      return false;
    }
  }
  return false;
}

export function recordFailedAttempt() {
  const lockData = localStorage.getItem(LOCK_KEY);
  let attempts = 0;
  if (lockData) {
    attempts = JSON.parse(lockData).attempts || 0;
  }
  attempts += 1;
  const lockUntil = Date.now() + 15 * 60 * 1000; // 15 min lockout
  localStorage.setItem(LOCK_KEY, JSON.stringify({ attempts, lockUntil }));
  return 5 - attempts; // remaining attempts
}

export function resetFailedAttempts() {
  localStorage.removeItem(LOCK_KEY);
}

export function verifyPassword(password) {
  const lockedMin = isLockedOut();
  if (lockedMin) {
    return { success: false, error: `Account locked due to too many failed attempts. Try again in ${lockedMin} minutes.` };
  }

  const hash = localStorage.getItem(PASS_KEY);
  if (!hash) {
    initAuth();
  }
  const currentHash = localStorage.getItem(PASS_KEY);
  const isMatch = bcrypt.compareSync(password, currentHash);

  if (isMatch) {
    resetFailedAttempts();
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem(SESSION_KEY, token);
    return { success: true };
  } else {
    const remaining = recordFailedAttempt();
    if (remaining <= 0) {
      return { success: false, error: 'Too many invalid attempts. Admin access locked for 15 minutes.' };
    }
    return { success: false, error: `Invalid password. ${remaining} attempt(s) remaining.` };
  }
}

export function updatePassword(oldPassword, newPassword) {
  const verify = verifyPassword(oldPassword);
  if (!verify.success) return verify;

  const salt = bcrypt.genSaltSync(10);
  const newHash = bcrypt.hashSync(newPassword, salt);
  localStorage.setItem(PASS_KEY, newHash);
  return { success: true };
}

export function isAuthenticated() {
  return !!sessionStorage.getItem(SESSION_KEY);
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY);
}
