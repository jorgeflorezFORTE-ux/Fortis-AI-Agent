const { generateScorecard } = require('../../lib/claude');
const { getDashboardData, getGlobalSummary, getFreedomSummary } = require('../../lib/db');
const { reconcileAll } = require('../../lib/reconciliation');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { year = new Date().getFullYear(), month = new Date().getMonth() + 1 } = req.body || {};
  try {
    const biz = getDashboardData({ companyId: null, year: parseInt(year) });
    const global = getGlobalSummary(parseInt(year));
    const recon = reconcileAll({ year: parseInt(year), month: parseInt(month) });
    const freedom = getFreedomSummary();
    const card = await generateScorecard({ bizData: { ...biz, global }, personalData: global.personal, reconData: recon.globalSummary, freedomData: { passiveIncome: freedom.passiveIncome, finScore: freedom.finScore, netWorth: freedom.netWorth }, period: `${month}/${year}` });
    res.json(card);
  } catch (err) { res.status(500).json({ error: err.message }); }
}
