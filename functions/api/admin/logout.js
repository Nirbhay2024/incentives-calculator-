import { json, withErrorHandling } from '../../_lib/http.js';
import { extractBearerToken, destroySession } from '../../_lib/auth.js';

export const onRequestPost = withErrorHandling(async ({ request, env }) => {
  const token = extractBearerToken(request);
  await destroySession(env.DB, token);
  return json({ success: true });
});
