/**
 * /api/personal/summary.js
 * GET /api/personal/summary?account=personal-jorge&year=2025
 * Retorna resumen de gastos personales, categorías, uploads y comparación
 */

const { getPersonalSummary, getGlobalSummary } = require('../../../lib/db');
const { PERSONAL_ACCOUNTS } = require('../../../lib/companies');

export default function handler(req, res) {
  const { account, year = new Date().getFullYear() } = req.query;
  const accountId = account === 'all-personal' ? null : account || null;

  try {
    const summary = getPersonalSummary({ accountId, year: parseInt(year) });
    const global = getGlobalSummary(parseInt(year));

    // Per-account breakdown (if viewing all personal)
    let perAccount = null;
    if (!accountId) {
      perAccount = PERSONAL_ACCOUNTS.map(acc => {
        const accSummary = getPersonalSummary({ accountId: acc.id, year: parseInt(year) });
        return {
          id: acc.id,
          name: acc.shortName || acc.name,
          owner: acc.owner,
          color: acc.color,
          icon: acc.icon,
          ...accSummary,
        };
      });
    }

    res.json({
      ...summary,
      year: parseInt(year),
      accountId: accountId || 'all-personal',
      perAccount,
      global,
    });
  } catch (err) {
    console.error('Personal summary error:', err);
    res.status(500).json({ error: err.message });
  }
}
