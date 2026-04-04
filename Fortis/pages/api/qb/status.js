/**
 * pages/api/qb/status.js
 * Retorna el estado de conexión de todas las empresas
 */

import { getConnectionStatus } from '../../../lib/tokenStore';
import { COMPANIES } from '../../../lib/companies';

export default function handler(req, res) {
  const tokenStatus = getConnectionStatus();

  const companies = COMPANIES.map(c => ({
    id: c.id,
    name: c.name,
    alias: c.alias,
    color: c.color,
    active: c.active,
    connected: !!tokenStatus[c.id],
    tokenExpired: tokenStatus[c.id]?.expired || false,
    realmId: tokenStatus[c.id]?.realmId || process.env[c.envKey] || null,
    lastSync: tokenStatus[c.id]?.savedAt || null,
  }));

  const summary = {
    total: companies.filter(c => c.active).length,
    connected: companies.filter(c => c.connected).length,
    ready: companies.filter(c => c.connected && !c.tokenExpired).length,
  };

  res.status(200).json({ companies, summary });
}
