/**
 * /api/ai/analyze.js
 * Ejecuta análisis AI de gastos y genera recomendaciones
 * POST /api/ai/analyze { company?: 'real-legacy', year?: 2025 }
 */

const { analyzeExpenses } = require('../../../lib/claude');
const { getDashboardData, getTransactions, saveAnalysis, getLatestAnalysis } = require('../../../lib/db');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { company, year = new Date().getFullYear(), force = false } = req.body || {};
  const companyId = company === 'all' ? null : company || null;
  const period = `${year}`;

  // Check cache (análisis de menos de 24 horas)
  if (!force) {
    const cached = getLatestAnalysis(companyId || 'all', period, 'expense_analysis');
    if (cached) {
      const age = Date.now() - new Date(cached.created_at).getTime();
      if (age < 86400000) { // 24 horas
        return res.json({ ...cached.result, cached: true });
      }
    }
  }

  try {
    const dashData = getDashboardData({ companyId, year: parseInt(year) });
    const transactions = getTransactions({
      companyId,
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
      type: 'expense',
      limit: 100,
    });

    if (dashData.totalExpenses === 0) {
      return res.json({
        diagnostico: 'No hay gastos registrados en este periodo.',
        estado: 'bueno',
        insights: [],
        recortes_prioritarios: [],
        proyeccion: { neto_actual: dashData.net, ahorro_total_posible: 0, neto_proyectado: dashData.net, mejora_anual: 0 },
      });
    }

    const analysis = await analyzeExpenses({
      categories: dashData.categories,
      transactions,
      totalIncome: dashData.totalIncome,
      totalExpenses: dashData.totalExpenses,
      period: `Enero-Diciembre ${year}`,
    });

    // Guardar en cache
    saveAnalysis(companyId || 'all', period, 'expense_analysis', analysis);

    res.json({ ...analysis, cached: false });
  } catch (err) {
    console.error('AI Analysis error:', err);
    res.status(500).json({ error: 'Error en análisis AI', details: err.message });
  }
}
