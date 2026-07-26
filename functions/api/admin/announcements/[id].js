import { json, withErrorHandling } from '../../../_lib/http.js';
import { requireAuth } from '../../../_lib/auth.js';

export const onRequestDelete = withErrorHandling(async ({ request, env, params }) => {
  await requireAuth(request, env.DB);
  await env.DB.prepare('DELETE FROM announcements WHERE id = ?').bind(params.id).run();
  return json({ success: true });
});
