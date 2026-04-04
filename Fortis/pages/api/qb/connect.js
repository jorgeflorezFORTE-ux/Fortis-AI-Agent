/**
 * pages/api/qb/connect.js
 * Inicia el flujo OAuth de QuickBooks para una empresa específica
 * 
 * Uso: GET /api/qb/connect?company=real-legacy
 */

import { buildAuthUrl } from '../../../lib/quickbooks';

export default function handler(req, res) {
  const { company = 'real-legacy' } = req.query;

  if (!process.env.QB_CLIENT_ID || !process.env.QB_CLIENT_SECRET) {
    return res.status(500).json({
      error: 'QB_CLIENT_ID y QB_CLIENT_SECRET no están configurados en .env',
    });
  }

  // Guardamos el company ID en el state para recuperarlo en el callback
  const state = Buffer.from(JSON.stringify({ company, ts: Date.now() })).toString('base64');
  const authUrl = buildAuthUrl(state);

  res.redirect(authUrl);
}
