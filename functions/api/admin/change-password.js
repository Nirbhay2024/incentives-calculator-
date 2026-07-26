import { json, withErrorHandling, readJsonBody, HttpError } from '../../_lib/http.js';
import { requireAuth, getPasswordHash, verifyPassword, hashPassword, setPasswordHash, destroyAllSessions, createSession } from '../../_lib/auth.js';

export const onRequestPost = withErrorHandling(async ({ request, env }) => {
  const db = env.DB;
  await requireAuth(request, db);

  const body = await readJsonBody(request);
  const oldPassword = typeof body.oldPassword === 'string' ? body.oldPassword : '';
  const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

  if (newPassword.length < 8) {
    throw new HttpError('New password must be at least 8 characters long.', 400);
  }

  const hash = await getPasswordHash(db);
  const isMatch = hash && (await verifyPassword(oldPassword, hash));
  if (!isMatch) {
    throw new HttpError('Current password is incorrect.', 401);
  }

  const newHash = await hashPassword(newPassword);
  await setPasswordHash(db, newHash);

  // Changing the password invalidates every existing session (including this
  // one) — force a clean re-login on a fresh token.
  await destroyAllSessions(db);
  const { token, expiresAt } = await createSession(db);

  return json({ success: true, token, expiresAt });
});
