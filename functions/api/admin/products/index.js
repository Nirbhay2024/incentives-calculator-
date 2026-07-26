import { json, withErrorHandling, readJsonBody } from '../../../_lib/http.js';
import { requireAuth } from '../../../_lib/auth.js';
import { mapProduct } from '../../../_lib/db.js';
import { validateProductPayload } from '../../../_lib/validate.js';

export const onRequestGet = withErrorHandling(async ({ request, env }) => {
  await requireAuth(request, env.DB);
  const { results } = await env.DB.prepare('SELECT * FROM products ORDER BY category, model').all();
  return json((results || []).map(mapProduct));
});

export const onRequestPut = withErrorHandling(async ({ request, env }) => {
  await requireAuth(request, env.DB);
  const body = await readJsonBody(request);
  const p = validateProductPayload(body);
  const now = Date.now();

  const existing = await env.DB.prepare('SELECT created_at FROM products WHERE id = ?').bind(p.id).first();

  await env.DB.prepare(
    `INSERT INTO products (id, base_model, model, category, series, sub_category, flagship, dp_slab, dp, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET base_model = ?, model = ?, category = ?, series = ?, sub_category = ?, flagship = ?, dp_slab = ?, dp = ?, status = ?, updated_at = ?`
  ).bind(
    p.id, p.baseModel, p.model, p.category, p.series, p.subCategory, p.flagship ? 1 : 0, p.dpSlab, p.dp, p.status, existing ? existing.created_at : now, now,
    p.baseModel, p.model, p.category, p.series, p.subCategory, p.flagship ? 1 : 0, p.dpSlab, p.dp, p.status, now
  ).run();

  const row = await env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(p.id).first();
  return json(mapProduct(row));
});
