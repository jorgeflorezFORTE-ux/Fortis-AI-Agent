/**
 * /api/dashboard.js
 * Retorna datos agregados del dashboard para una empresa o consolidado
 * GET /api/dashboard?company=real-legacy&year=2025
 */

const { getDashboardData, getLastSync } = require('../../lib/db');
const { getConnectionStatus } = require('../../lib/quickbooks');
const { COMPANIES } = require('../../lib/companies');

export default function handler(req, res) {
  const { company, year = new Date().getFullYear() } = req.query;

  // Si no se especifica empresa, retorna consolidado
  const companyId = company === 'all' ? null : company || null;

  try {
    const data = getDashboardData({ companyId, year: parseInt(year) });
    const connections = getConnectionStatus();
    const lastSync = companyId ? getLastSync(companyId) : null;

    // Para consolidado, incluir datos por empresa
    let perCompany = null;
    if (!companyId) {
      perCompany = COMPANIES.filter(c => c.active !== false).map(co => {
        const coData = getDashboardData({ companyId: co.id, year: parseInt(year) });
        const conn = connections.find(c => c.companyId === co.id);
        return {
          id: co.id,
          name: co.shortName || co.name,
          color: co.color,
          icon: co.icon,
          type: co.type,
          connected: conn?.connected || false,
          ...coData,
        };
      });
    }

    res.json({
      ...data,
      year: parseInt(year),
      companyId: companyId || 'all',
      perCompany,
      connections: connections.map(c => ({
        id: c.companyId,
        name: c.companyName,
        connected: c.connected,
        expired: c.tokenExpired,
      })),
      lastSync: lastSync?.completed_at || null,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: err.message });
  }
}
