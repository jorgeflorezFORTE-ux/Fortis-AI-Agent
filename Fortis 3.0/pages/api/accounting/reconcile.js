const { reconcileMonth, reconcileAll } = require('../../../lib/reconciliation');
export default function handler(req, res) {
  const p = req.method === 'POST' ? req.body : req.query;
  const { company, year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = p || {};
  try {
    const r = (!company || company === 'all') ? reconcileAll({ year: parseInt(year), month: parseInt(month) }) : reconcileMonth({ companyId: company, year: parseInt(year), month: parseInt(month) });
    res.json(r);
  } catch (err) { res.status(500).json({ error: err.message }); }
}
