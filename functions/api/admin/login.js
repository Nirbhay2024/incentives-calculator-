import { json, errorResponse, withErrorHandling, readJsonBody, getClientIp, HttpError } from '../../_lib/http.js';
import { checkRateLimit, recordLoginResult, getPasswordHash, verifyPassword, createSession, pruneExpired } from '../../_lib/auth.js';

export const onRequestPost = withErrorHandling(async ({ request, env }) => {
  const db = env.DB;
  const ip = getClientIp(request);

  const rateLimit = await checkRateLimit(db, ip);
  if (rateLimit.locked) {
    return errorResponse(`Too many failed attempts. Try again in ${rateLimit.minutesRemaining} minute(s).`, 429);
  }

  const body = await readJsonBody(request);
  const password = typeof body.password === 'string' ? body.password : '';
  if (!password) throw new HttpError('Password is required.', 400);

  const hash = await getPasswordHash(db);
  if (!hash) throw new HttpError('Admin account is not configured. Run the database seed first.', 503);

  const isMatch = await verifyPassword(password, hash);

  if (!isMatch) {
    const remaining = await recordLoginResult(db, ip, false);
    if (remaining <= 0) {
      return errorResponse('Too many invalid attempts. Admin access locked for 15 minutes.', 429);
    }
    return errorResponse(`Invalid password. ${remaining} attempt(s) remaining.`, 401);
  }

  await recordLoginResult(db, ip, true);
  await pruneExpired(db);
  const { token, expiresAt } = await createSession(db);
  return json({ token, expiresAt });
});
