/**
 * pages/api/qb/callback.js
 * Maneja el redirect de QuickBooks después del login OAuth
 * Intercambia el código por tokens y los guarda
 */

import { exchangeCodeForToken } from '../../../lib/quickbooks';
import { saveToken } from '../../../lib/tokenStore';

export default async function handler(req, res) {
  const { code, realmId, state, error } = req.query;

  if (error) {
    console.error('QB OAuth error:', error);
    return res.redirect(`/?error=${error}`);
  }

  if (!code || !realmId) {
    return res.redirect('/?error=missing_params');
  }

  try {
    // Decodificamos el state para saber qué empresa es
    let companyId = 'unknown';
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
      companyId = decoded.company || 'unknown';
    } catch {
      // state mal formado, usamos realmId como fallback
    }

    // Intercambiamos el código por tokens
    const tokenData = await exchangeCodeForToken(code);

    // Guardamos con el realmId incluido
    saveToken(companyId, { ...tokenData, realmId });

    console.log(`✅ QB conectado: ${companyId} (realmId: ${realmId})`);

    // Redirigimos al dashboard con éxito
    res.redirect(`/?connected=${companyId}&realmId=${realmId}`);
  } catch (err) {
    console.error('Error en QB callback:', err.response?.data || err.message);
    res.redirect(`/?error=token_exchange_failed&msg=${encodeURIComponent(err.message)}`);
  }
}
