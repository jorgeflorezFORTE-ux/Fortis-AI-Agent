/**
 * /api/qb/callback.js
 * Recibe el callback de QuickBooks OAuth y guarda los tokens
 */

const { handleCallback } = require('../../../lib/quickbooks');
const { saveToken } = require('../../../lib/db');

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const companyId = req.query.state;
  const realmId = req.query.realmId;

  if (!companyId || !realmId) {
    return res.status(400).json({ error: 'Faltan parámetros de callback' });
  }

  try {
    const fullUrl = `${process.env.APP_URL}${req.url}`;
    const tokenData = await handleCallback(fullUrl);

    saveToken(companyId, {
      realmId,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_type: tokenData.token_type,
      expires_at: Date.now() + (tokenData.expires_in * 1000),
      x_refresh_token_expires_in: tokenData.x_refresh_token_expires_in,
    });

    // Redirigir al dashboard con mensaje de éxito
    res.redirect(`/?connected=${companyId}`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.redirect(`/?error=oauth_failed&company=${companyId}`);
  }
}
