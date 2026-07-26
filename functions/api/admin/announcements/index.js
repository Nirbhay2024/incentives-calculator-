import { json, withErrorHandling, readJsonBody } from '../../../_lib/http.js';
import { requireAuth } from '../../../_lib/auth.js';
import { mapAnnouncement } from '../../../_lib/db.js';
import { validateAnnouncementPayload } from '../../../_lib/validate.js';

export const onRequestGet = withErrorHandling(async ({ request, env }) => {
  await requireAuth(request, env.DB);
  const { results } = await env.DB.prepare('SELECT * FROM announcements ORDER BY created_at DESC').all();
  return json((results || []).map(mapAnnouncement));
});

// Upsert by id.
export const onRequestPut = withErrorHandling(async ({ request, env }) => {
  await requireAuth(request, env.DB);
  const body = await readJsonBody(request);
  const a = validateAnnouncementPayload(body);
  const now = Date.now();

  const existing = await env.DB.prepare('SELECT created_at FROM announcements WHERE id = ?').bind(a.id).first();

  await env.DB.prepare(
    `INSERT INTO announcements (id, title, message, type, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET title = ?, message = ?, type = ?, status = ?, updated_at = ?`
  ).bind(
    a.id, a.title, a.message, a.type, a.status, existing ? existing.created_at : now, now,
    a.title, a.message, a.type, a.status, now
  ).run();

  const row = await env.DB.prepare('SELECT * FROM announcements WHERE id = ?').bind(a.id).first();
  return json(mapAnnouncement(row));
});
