import { json, withErrorHandling, readJsonBody } from '../../../_lib/http.js';
import { requireAuth } from '../../../_lib/auth.js';
import { mapRule } from '../../../_lib/db.js';
import { validateRulePayload } from '../../../_lib/validate.js';

export const onRequestGet = withErrorHandling(async ({ request, env }) => {
  await requireAuth(request, env.DB);
  const url = new URL(request.url);
  const schemeId = url.searchParams.get('schemeId');

  const stmt = schemeId
    ? env.DB.prepare('SELECT * FROM rules WHERE scheme_id = ? ORDER BY created_at').bind(schemeId)
    : env.DB.prepare('SELECT * FROM rules ORDER BY created_at');

  const { results } = await stmt.all();
  return json((results || []).map(mapRule));
});

// Upsert by id. The client (Rule Wizard) is responsible for detecting
// conflicts and, on override, first PUTting the old rule with
// status: 'Archived' before PUTting the new one — same two-step flow it
// used against localStorage, just over the network now.
export const onRequestPut = withErrorHandling(async ({ request, env }) => {
  await requireAuth(request, env.DB);
  const body = await readJsonBody(request);
  const r = validateRulePayload(body);
  const now = Date.now();

  const existing = await env.DB.prepare('SELECT created_at FROM rules WHERE id = ?').bind(r.id).first();

  await env.DB.prepare(
    `INSERT INTO rules (id, scheme_id, type, category, segment, model, name, description, status, data, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET scheme_id = ?, type = ?, category = ?, segment = ?, model = ?, name = ?, description = ?, status = ?, data = ?, updated_at = ?`
  ).bind(
    r.id, r.schemeId, r.type, r.category, r.segment, r.model, r.name, r.description, r.status, JSON.stringify(r.data), existing ? existing.created_at : now, now,
    r.schemeId, r.type, r.category, r.segment, r.model, r.name, r.description, r.status, JSON.stringify(r.data), now
  ).run();

  const row = await env.DB.prepare('SELECT * FROM rules WHERE id = ?').bind(r.id).first();
  return json(mapRule(row));
});
