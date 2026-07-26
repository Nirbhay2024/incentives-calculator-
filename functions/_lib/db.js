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
