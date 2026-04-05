const { analyzeExpenses } = require('../../../lib/claude');
const { getDashboardData, getTransactions, saveAnalysis, getLatestAnalysis } = require('../../../lib/db');
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { company, year = new Date().getFullYear(), force } = req.body || {};
  const cid = company === 'all' ? null : company;
  const period = String(year);
  if (!force) { const c = await getLatestAnalysis(cid || 'all', period, 'financial'); if (c && Date.now() - new Date(c.created_at).getTime() < 86400000) return res.json({ ...c.result, cached: true }); }
  try {
    const d = await getDashboardData({ companyId: cid, year: parseInt(year) });
    const txns = await getTransactions({ companyId: cid, startDate: year + '-01-01', endDate: year + '-12-31', type: 'expense', limit: 100 });
    if (d.totalExpenses === 0) return res.json({ diagnostico: 'Sin gastos registrados.', estado: 'bueno', insights: [], recortes_prioritarios: [], proyeccion: { neto_actual: d.net, ahorro_total_posible: 0, neto_proyectado: d.net, mejora_anual: 0 } });
    const a = await analyzeExpenses({ categories: d.categories, transactions: txns, totalIncome: d.totalIncome, totalExpenses: d.totalExpenses, period: 'Ene-Dic ' + year });
    await saveAnalysis(cid || 'all', period, 'financial', a);
    res.json({ ...a, cached: false });
  } catch (err) { res.status(500).json({ error: err.message }); }
}
