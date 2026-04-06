const { reconcileMonth, reconcileAll } = require('../../../lib/reconciliation');
const { getRules } = require('../../../lib/business-rules');
const { analyzeReconciliation } = require('../../../lib/claude');
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { company, year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.body || {};
  try {
    const recon = (!company || company === 'all') ? await reconcileAll({ year: parseInt(year), month: parseInt(month) }) : await reconcileMonth({ companyId: company, year: parseInt(year), month: parseInt(month) });
    const rules = company && company !== 'all' ? getRules(company) : null;
    const analysis = await analyzeReconciliation({ reconData: recon, rules });
    res.json({ reconciliation: recon, analysis, period: `${year}-${String(month).padStart(2, '0')}`, company: company || 'all' });
  } catch (err) { res.status(500).json({ error: err.message }); }
}
