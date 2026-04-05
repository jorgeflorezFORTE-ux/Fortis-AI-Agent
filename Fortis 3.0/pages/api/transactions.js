const { getCategoryTransactions, getTransactions } = require('../../lib/db');
export default function handler(req, res) {
  const { category, company, start, end, type, limit = 200 } = req.query;
  try {
    const txns = category
      ? getCategoryTransactions({ category, companyId: company === 'all' ? null : company, startDate: start, endDate: end })
      : getTransactions({ companyId: company === 'all' ? null : company, startDate: start, endDate: end, type, limit: parseInt(limit) });
    res.json({ transactions: txns, count: txns.length, total: txns.reduce((s, t) => s + t.amount, 0) });
  } catch (err) { res.status(500).json({ error: err.message }); }
}
