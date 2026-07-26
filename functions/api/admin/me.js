import { json, withErrorHandling } from '../../_lib/http.js';
import { requireAuth } from '../../_lib/auth.js';

export const onRequestGet = withErrorHandling(async ({ request, env }) => {
  await requireAuth(request, env.DB);
  return json({ authenticated: true });
});
