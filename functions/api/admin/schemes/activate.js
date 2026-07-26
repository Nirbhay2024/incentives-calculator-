import { json, withErrorHandling, readJsonBody, HttpError } from '../../../_lib/http.js';
import { requireAuth } from '../../../_lib/auth.js';
import { requireString } from '../../../_lib/validate.js';

export const onRequestPost = withErrorHandling(async ({ request, env }) => {
  await requireAuth(request, env.DB);
  const body = await readJsonBody(request);
  const id = requireString(body.id, 'id', { max: 100 });

  const existing = await env.DB.prepare('SELECT id FROM schemes WHERE id = ?').bind(id).first();
  if (!existing) throw new HttpError('Scheme not found.', 404);

  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare('UPDATE schemes SET is_active = 0, updated_at = ? WHERE is_active = 1').bind(now),
    env.DB.prepare('UPDATE schemes SET is_active = 1, updated_at = ? WHERE id = ?').bind(now, id)
  ]);

  return json({ success: true });
});
