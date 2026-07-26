// Row <-> API-shape mappers. Keeps the wire format identical to what the
// frontend used to read straight out of localStorage, so the client-side
// rule engine / rule wizard / ruleToEnglish() need no changes.

export function mapScheme(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    channel: row.channel || '',
    startDate: row.start_date || '',
    endDate: row.end_date || '',
    status: row.status,
    version: row.version,
    isActive: !!row.is_active
  };
}

export function mapProduct(row) {
  return {
    id: row.id,
    baseModel: row.base_model || undefined,
    model: row.model,
    category: row.category,
    series: row.series || undefined,
    subCategory: row.sub_category || undefined,
    flagship: !!row.flagship || undefined,
    dpSlab: row.dp_slab || undefined,
    dp: row.dp ?? undefined,
    status: row.status
  };
}

// Fixed display order (matches the promoter calculator's category sections)
// rather than alphabetical, so Smartphones lead instead of Notebooks.
const CATEGORY_ORDER = ['Smartphone', 'Wearable', 'Tablet', 'Notebook'];

// Natural, numeric-aware comparator so "A7" sorts before "A17" (plain string
// comparison would put "A17" first), and a newly added model like
// "Galaxy Z Fold 8" lands right before "Galaxy Z Fold 8 Ultra" instead of
// wherever insertion order happened to put it.
const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

// Groups by category (in CATEGORY_ORDER), then by base model + full model
// name, so every variant of the same device sits together in a sane order.
export function sortProducts(products) {
  return [...products].sort((a, b) => {
    const catDiff = CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
    if (catDiff !== 0) return catDiff;
    const baseDiff = collator.compare(a.baseModel || a.model, b.baseModel || b.model);
    if (baseDiff !== 0) return baseDiff;
    return collator.compare(a.model, b.model);
  });
}

export function mapRule(row) {
  let data = {};
  try {
    data = JSON.parse(row.data || '{}');
  } catch {
    data = {};
  }
  return {
    id: row.id,
    schemeId: row.scheme_id,
    type: row.type,
    category: row.category || undefined,
    segment: row.segment || undefined,
    model: row.model || undefined,
    name: row.name,
    description: row.description || '',
    status: row.status,
    ...data
  };
}
