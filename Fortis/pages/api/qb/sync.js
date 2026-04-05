/**
 * /api/qb/sync.js
 * Sincroniza transacciones de QuickBooks para una o todas las empresas
 * POST /api/qb/sync { company?: 'real-legacy', year?: 2025 }
 */

const { fetchAllTransactions, getConnectionStatus } = require('../../../lib/quickbooks');
const { upsertMany, logSync, completeSync, getLastSync } = require('../../../lib/db');
const { getActiveCompanies } = require('../../../lib/companies');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { company: targetCompany, year = new Date().getFullYear() } = req.body || {};
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const connections = getConnectionStatus();
  const companies = targetCompany
    ? [{ id: targetCompany }]
    : getActiveCompanies();

  const results = [];

  for (const co of companies) {
    const conn = connections.find(c => c.companyId === co.id);
    if (!conn?.connected || conn.tokenExpired) {
      results.push({ company: co.id, status: 'skipped', reason: 'No conectado o token expirado' });
      continue;
    }

    const logId = logSync(co.id, 'full');

    try {
      const transactions = await fetchAllTransactions(co.id, startDate, endDate);
      const count = upsertMany(transactions);
      completeSync(logId, count);
      results.push({ company: co.id, status: 'success', transactions: count });
    } catch (err) {
      completeSync(logId, 0, err.message);
      results.push({ company: co.id, status: 'error', error: err.message });
    }
  }

  const totalSynced = results.reduce((s, r) => s + (r.transactions || 0), 0);

  res.json({
    success: true,
    totalSynced,
    results,
    syncedAt: new Date().toISOString(),
  });
}
