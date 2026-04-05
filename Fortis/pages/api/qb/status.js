/**
 * /api/qb/status.js
 * Retorna el estado de conexión de cada empresa
 */

const { getConnectionStatus } = require('../../../lib/quickbooks');
const { getLastSync } = require('../../../lib/db');

export default function handler(req, res) {
  const connections = getConnectionStatus();
  const enriched = connections.map(c => ({
    ...c,
    lastSync: getLastSync(c.companyId),
  }));
  res.json({ connections: enriched });
}
