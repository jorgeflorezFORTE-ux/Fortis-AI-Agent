/**
 * /api/qb/auth.js
 * Inicia el flujo OAuth de QuickBooks para conectar una empresa
 * Uso: GET /api/qb/auth?company=real-legacy
 */

const { getAuthUri } = require('../../../lib/quickbooks');
const { getCompany } = require('../../../lib/companies');

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const companyId = req.query.company;
  if (!companyId) return res.status(400).json({ error: 'Falta el parámetro company' });

  const company = getCompany(companyId);
  if (!company) return res.status(404).json({ error: `Empresa "${companyId}" no encontrada` });

  try {
    const authUri = getAuthUri(companyId);
    res.redirect(authUri);
  } catch (err) {
    console.error('OAuth error:', err);
    res.status(500).json({ error: 'Error al iniciar OAuth', details: err.message });
  }
}
