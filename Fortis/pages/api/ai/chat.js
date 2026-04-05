/**
 * /api/ai/chat.js
 * Chat con el asesor financiero AI
 * POST /api/ai/chat { message: "...", company?: "real-legacy", year?: 2025 }
 */

const { chatWithAdvisor } = require('../../../lib/claude');
const { getDashboardData } = require('../../../lib/db');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, company, year = new Date().getFullYear() } = req.body || {};

  if (!message) return res.status(400).json({ error: 'Falta el mensaje' });

  try {
    const companyId = company === 'all' ? null : company || null;
    const dashData = getDashboardData({ companyId, year: parseInt(year) });

    const response = await chatWithAdvisor({
      message,
      financialContext: {
        totalIncome: dashData.totalIncome,
        totalExpenses: dashData.totalExpenses,
        net: dashData.net,
        margin: dashData.margin,
        topCategories: dashData.categories.slice(0, 5),
        period: `${year}`,
        empresa: companyId || 'consolidado',
      },
    });

    res.json({ response });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Error en chat', details: err.message });
  }
}
