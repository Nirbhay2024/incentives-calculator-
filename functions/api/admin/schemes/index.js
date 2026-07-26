import { json, withErrorHandling, readJsonBody } from '../../../_lib/http.js';
import { requireAuth } from '../../../_lib/auth.js';
import { mapScheme } from '../../../_lib/db.js';
import { validateSchemePayload } from '../../../_lib/validate.js';

export const onRequestGet = withErrorHandling(async ({ request, env }) => {
  await requireAuth(request, env.DB);
  const { results } = await env.DB.prepare('SELECT * FROM schemes ORDER BY updated_at DESC').all();
  return json((results || []).map(mapScheme));
});

export const onRequestPut = withErrorHandling(async ({ request, env }) => {
  await requireAuth(request, env.DB);
  const body = await readJsonBody(request);
  const s = validateSchemePayload(body);
  const now = Date.now();

  const existing = await env.DB.prepare('SELECT id, is_active FROM schemes WHERE id = ?').bind(s.id).first();

  await env.DB.prepare(
    `INSERT INTO schemes (id, name, description, channel, start_date, end_date, status, version, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET name = ?, description = ?, channel = ?, start_date = ?, end_date = ?, status = ?, version = ?, updated_at = ?`
  ).bind(
    s.id, s.name, s.description, s.channel, s.startDate, s.endDate, s.status, s.version, existing ? existing.is_active : 0, now, now,
    s.name, s.description, s.channel, s.startDate, s.endDate, s.status, s.version, now
  ).run();

  const row = await env.DB.prepare('SELECT * FROM schemes WHERE id = ?').bind(s.id).first();
  return json(mapScheme(row));
});
