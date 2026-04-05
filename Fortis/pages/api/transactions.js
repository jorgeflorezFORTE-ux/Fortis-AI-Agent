/**
 * /api/transactions.js
 * Retorna transacciones filtradas por categoría, empresa, fecha
 * GET /api/transactions?category=Contract+Labor&company=real-legacy&start=2025-01-01&end=2025-12-31
 */

const { getCategoryTransactions, getTransactions } = require('../../lib/db');

export default function handler(req, res) {
  const { category, company, start, end, type, limit = 200 } = req.query;

  try {
    let transactions;

    if (category) {
      transactions = getCategoryTransactions({
        category,
        companyId: company === 'all' ? null : company,
        startDate: start || null,
        endDate: end || null,
      });
    } else {
      transactions = getTransactions({
        companyId: company === 'all' ? null : company,
        startDate: start || null,
        endDate: end || null,
        type: type || null,
        limit: parseInt(limit),
      });
    }

    res.json({
      transactions,
      count: transactions.length,
      total: transactions.reduce((s, t) => s + t.amount, 0),
    });
  } catch (err) {
    console.error('Transactions error:', err);
    res.status(500).json({ error: err.message });
  }
}
