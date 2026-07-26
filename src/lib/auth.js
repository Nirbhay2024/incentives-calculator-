import { apiRequest, getToken, setToken } from './api';

export async function login(password) {
  try {
    const { token } = await apiRequest('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password })
    });
    setToken(token);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function changePassword(oldPassword, newPassword) {
  try {
    const { token } = await apiRequest('/api/admin/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword })
    });
    setToken(token);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function isAuthenticated() {
  if (!getToken()) return false;
  try {
    await apiRequest('/api/admin/me');
    return true;
  } catch {
    setToken(null);
    return false;
  }
}

export async function logout() {
  try {
    await apiRequest('/api/admin/logout', { method: 'POST' });
  } catch {
    // Best-effort server-side revocation; clear the local token regardless.
  }
  setToken(null);
}
