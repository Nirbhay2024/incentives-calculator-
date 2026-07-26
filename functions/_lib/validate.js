import { HttpError } from './http.js';

export function requireString(value, field, { max = 200, allowEmpty = false } = {}) {
  if (typeof value !== 'string' || (!allowEmpty && value.trim() === '')) {
    throw new HttpError(`"${field}" is required.`, 400);
  }
  if (value.length > max) {
    throw new HttpError(`"${field}" must be ${max} characters or fewer.`, 400);
  }
  return value;
}

export function optionalString(value, field, { max = 200 } = {}) {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') throw new HttpError(`"${field}" must be a string.`, 400);
  if (value.length > max) throw new HttpError(`"${field}" must be ${max} characters or fewer.`, 400);
  return value;
}

export function requireOneOf(value, field, options) {
  if (!options.includes(value)) {
    throw new HttpError(`"${field}" must be one of: ${options.join(', ')}.`, 400);
  }
  return value;
}

const RULE_TYPES = [
  'focus_model_volume', 'kicker_bonus', 'dp_slab_base', 'series_multiplier',
  'target_gate', 'flagship_achievement_grid', 'wearable_flat', 'volume_incremental',
  'dp_range_slab', 'volume_bonus_gate', 'category_payout_cap'
];

const CATEGORIES = ['Smartphone', 'Wearable', 'Tablet', 'Notebook'];

export function validateRulePayload(body) {
  const id = requireString(body.id, 'id', { max: 100 });
  const schemeId = requireString(body.schemeId, 'schemeId', { max: 100 });
  const type = requireOneOf(body.type, 'type', RULE_TYPES);
  const name = requireString(body.name, 'name', { max: 200 });
  const category = body.category ? requireOneOf(body.category, 'category', CATEGORIES) : null;
  const segment = body.segment ? requireOneOf(body.segment, 'segment', ['Innovative', 'Flagship']) : null;
  const model = optionalString(body.model, 'model', { max: 100 });
  const description = optionalString(body.description, 'description', { max: 2000 }) || '';
  const status = body.status ? requireOneOf(body.status, 'status', ['Active', 'Archived']) : 'Active';

  // Everything else is the type-specific reward configuration, stored as-is (JSON).
  const {
    id: _id, schemeId: _s, type: _t, name: _n, category: _c, segment: _sg,
    model: _m, description: _d, status: _st, ...data
  } = body;

  let serialized;
  try {
    serialized = JSON.stringify(data);
  } catch {
    throw new HttpError('Rule data is not serializable.', 400);
  }
  if (serialized.length > 100_000) {
    throw new HttpError('Rule data payload is too large.', 400);
  }

  return { id, schemeId, type, category, segment, model, name, description, status, data };
}

export function validateProductPayload(body) {
  const id = requireString(body.id, 'id', { max: 100 });
  const model = requireString(body.model, 'model', { max: 200 });
  const category = requireOneOf(body.category, 'category', CATEGORIES);
  const baseModel = optionalString(body.baseModel, 'baseModel', { max: 100 });
  const series = optionalString(body.series, 'series', { max: 50 });
  const subCategory = optionalString(body.subCategory, 'subCategory', { max: 50 });
  const dpSlab = optionalString(body.dpSlab, 'dpSlab', { max: 50 });
  const dp = body.dp === undefined || body.dp === null || body.dp === '' ? null : Number(body.dp);
  if (dp !== null && (!Number.isFinite(dp) || dp < 0)) {
    throw new HttpError('"dp" must be a non-negative number.', 400);
  }
  const flagship = !!body.flagship;
  const status = body.status ? requireOneOf(body.status, 'status', ['Active', 'Archived']) : 'Active';

  return { id, model, category, baseModel, series, subCategory, dpSlab, dp, flagship, status };
}

export function validateSchemePayload(body) {
  const id = requireString(body.id, 'id', { max: 100 });
  const name = requireString(body.name, 'name', { max: 200 });
  const description = optionalString(body.description, 'description', { max: 2000 }) || '';
  const channel = optionalString(body.channel, 'channel', { max: 100 }) || '';
  const startDate = optionalString(body.startDate, 'startDate', { max: 20 }) || '';
  const endDate = optionalString(body.endDate, 'endDate', { max: 20 }) || '';
  const status = body.status ? requireOneOf(body.status, 'status', ['Active', 'Draft', 'Archived']) : 'Active';
  const version = optionalString(body.version, 'version', { max: 20 }) || '1.0';

  return { id, name, description, channel, startDate, endDate, status, version };
}
