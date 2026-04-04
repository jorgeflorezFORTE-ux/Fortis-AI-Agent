const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY;

// ── Refresh lock para evitar race conditions ──────────────────────────────────
const refreshLocks = new Map();

export function acquireRefreshLock(companyId) {
  if (refreshLocks.has(companyId)) return refreshLocks.get(companyId);
  let resolve;
  const promise = new Promise(r => { resolve = r; });
  promise._resolve = resolve;
  refreshLocks.set(companyId, promise);
  return null; // null = lock acquired (caller should refresh)
}

export function releaseRefreshLock(companyId, token) {
  const lock = refreshLocks.get(companyId);
  refreshLocks.delete(companyId);
  if (lock?._resolve) lock._resolve(token);
}

// ── Supabase helpers ──────────────────────────────────────────────────────────
async function sbFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      ...(options.headers || {}),
    },
  });
  if (res.status === 204 || res.status === 404) return null;
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function saveToken(companyId, tokenData) {
  await sbFetch('/tokens', {
    method: 'POST',
    headers: { 'Prefer': 'resolution=merge-duplicates' },
    body: JSON.stringify({
      id: companyId,
      data: { ...tokenData, savedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + (tokenData.expires_in || 3600) * 1000).toISOString() },
      updated_at: new Date().toISOString(),
    }),
  });
}

export async function getToken(companyId) {
  const rows = await sbFetch(`/tokens?id=eq.${companyId}&select=*`);
  if (!rows || rows.length === 0) return null;
  return rows[0].data;
}

export async function getAllTokens() {
  const rows = await sbFetch('/tokens?select=*') || [];
  const result = {};
  rows.forEach(r => { result[r.id] = r.data; });
  return result;
}

export async function deleteToken(companyId) {
  await sbFetch(`/tokens?id=eq.${companyId}`, { method: 'DELETE' });
}

export function isTokenExpired(tokenData) {
  if (!tokenData?.expiresAt) return true;
  return new Date(tokenData.expiresAt) < new Date(Date.now() + 5 * 60 * 1000);
}

export async function getConnectionStatus() {
  const tokens = await getAllTokens();
  const status = {};
  Object.keys(tokens).forEach(id => {
    status[id] = { connected: true, expired: isTokenExpired(tokens[id]), savedAt: tokens[id].savedAt, realmId: tokens[id].realmId };
  });
  return status;
}
