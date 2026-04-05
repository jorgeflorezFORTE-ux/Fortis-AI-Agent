const { reconcileMonth, reconcileAll } = require('../../../lib/reconciliation');
export default async function handler(req, res) {
  const p = req.method === 'POST' ? req.body : req.query;
  const { company, year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = p || {};
  try {
    const r = (!company || company === 'all') ? await reconcileAll({ year: parseInt(year), month: parseInt(month) }) : await reconcileMonth({ companyId: company, year: parseInt(year), month: parseInt(month) });
    res.json(r);
  } catch (err) { res.status(500).json({ error: err.message }); }
}
