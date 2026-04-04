/**
 * pages/api/analyze.js
 * Endpoint principal para todo el análisis con Claude AI
 * 
 * POST /api/analyze
 * Body: { type: 'company'|'weekly'|'monthly'|'personal'|'chat'|'csv', ...params }
 */

import {
  analyzeCompanyTransactions,
  generateWeeklyReport,
  generateMonthlyClose,
  analyzePersonalExpenses,
  chatWithAdvisor,
  analyzeBankCSV,
} from '../../lib/claude';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY no está configurada' });
  }

  const { type } = req.body;

  try {
    let result;

    switch (type) {
      case 'company': {
        const { company, transactions, period, plData } = req.body;
        result = await analyzeCompanyTransactions({ company, transactions, period, plData });
        break;
      }

      case 'weekly': {
        const { companiesData } = req.body;
        result = await generateWeeklyReport(companiesData);
        break;
      }

      case 'monthly': {
        const { companiesData, month } = req.body;
        result = await generateMonthlyClose(companiesData, month);
        break;
      }

      case 'personal': {
        const { person, transactions, month } = req.body;
        result = await analyzePersonalExpenses({ person, transactions, month });
        break;
      }

      case 'chat': {
        const { messages, financialContext } = req.body;
        result = await chatWithAdvisor(messages, financialContext);
        break;
      }

      case 'csv': {
        const { csvContent, source, person, month } = req.body;
        result = await analyzeBankCSV({ csvContent, source, person, month });
        break;
      }

      default:
        return res.status(400).json({ error: `Tipo de análisis desconocido: ${type}` });
    }

    return res.status(200).json({ success: true, result });
  } catch (err) {
    console.error(`Error en análisis (${type}):`, err.message);
    return res.status(500).json({ error: err.message });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};
