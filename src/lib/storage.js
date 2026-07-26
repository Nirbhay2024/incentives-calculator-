import { apiRequest } from './api';

// Public — used by the promoter calculator, no auth required.
export async function getBootstrap() {
  return apiRequest('/api/bootstrap');
}

// ── Schemes (admin) ─────────────────────────────────────────────────────────
export async function getSchemes() {
  return apiRequest('/api/admin/schemes');
}

export async function getActiveScheme() {
  const schemes = await getSchemes();
  return schemes.find((s) => s.isActive) || schemes[0];
}

export async function saveScheme(scheme) {
  return apiRequest('/api/admin/schemes', { method: 'PUT', body: JSON.stringify(scheme) });
}

export async function activateScheme(id) {
  return apiRequest('/api/admin/schemes/activate', { method: 'POST', body: JSON.stringify({ id }) });
}

// ── Products (admin) ─────────────────────────────────────────────────────────
export async function getProducts() {
  return apiRequest('/api/admin/products');
}

export async function saveProduct(product) {
  return apiRequest('/api/admin/products', { method: 'PUT', body: JSON.stringify(product) });
}

export async function archiveProduct(product) {
  return saveProduct({ ...product, status: 'Archived' });
}

// ── Rules (admin) ─────────────────────────────────────────────────────────────
export async function getRules(schemeId) {
  const q = schemeId ? `?schemeId=${encodeURIComponent(schemeId)}` : '';
  return apiRequest(`/api/admin/rules${q}`);
}

export async function saveRule(rule) {
  return apiRequest('/api/admin/rules', { method: 'PUT', body: JSON.stringify(rule) });
}

export async function deleteRule(id) {
  return apiRequest(`/api/admin/rules/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
