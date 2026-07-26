import { json, withErrorHandling, HttpError } from '../_lib/http.js';
import { mapScheme, mapProduct, mapRule, sortProducts } from '../_lib/db.js';

// Public, read-only. Returns everything the promoter calculator needs in one
// round trip: the active scheme, active products, and active rules.
export const onRequestGet = withErrorHandling(async ({ env }) => {
  const db = env.DB;

  const schemeRow = await db.prepare('SELECT * FROM schemes WHERE is_active = 1 ORDER BY updated_at DESC LIMIT 1').first();
  if (!schemeRow) throw new HttpError('No active scheme configured.', 503);

  const { results: productRows } = await db
    .prepare("SELECT * FROM products WHERE status != 'Archived'")
    .all();

  const { results: ruleRows } = await db
    .prepare("SELECT * FROM rules WHERE scheme_id = ? AND status != 'Archived'")
    .bind(schemeRow.id)
    .all();

  return json({
    scheme: mapScheme(schemeRow),
    products: sortProducts((productRows || []).map(mapProduct)),
    rules: (ruleRows || []).map(mapRule)
  });
});
