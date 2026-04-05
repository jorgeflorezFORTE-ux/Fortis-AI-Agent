const { chatWithAdvisor } = require('../../../lib/claude');
const { getDashboardData, getGlobalSummary } = require('../../../lib/db');
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { message, company, year = new Date().getFullYear() } = req.body || {};
  if (!message) return res.status(400).json({ error: 'Falta mensaje' });
  try {
    const cid = company === 'all' ? null : company;
    const d = getDashboardData({ companyId: cid, year: parseInt(year) });
    const g = getGlobalSummary(parseInt(year));
    const r = await chatWithAdvisor({ message, context: { ...d, global: g, empresa: cid || 'consolidado', year } });
    res.json({ response: r });
  } catch (err) { res.status(500).json({ error: err.message }); }
}
