/**
 * pages/api/qb/year.js
 * Jala todos los meses del año para el resumen anual
 */

import {
  getProfitAndLoss,
  refreshAccessToken,
  extractPLData,
} from '../../../lib/quickbooks';
import { getToken, saveToken, isTokenExpired } from '../../../lib/tokenStore';
import { COMPANIES } from '../../../lib/companies';
import { format, startOfMonth, endOfMonth } from 'date-fns';

async function getValidToken(companyId) {
  let token = await getToken(companyId);
  if (!token) return null;
  if (isTokenExpired(token)) {
    try {
      const newToken = await refreshAccessToken(token.refresh_token);
      await saveToken(companyId, { ...newToken, realmId: token.realmId });
      token = await getToken(companyId);
    } catch {
      return null;
    }
  }
  return token;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { year = new Date().getFullYear() } = req.body;

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(year, i, 1);
    return {
      index: i,
      label: format(d, 'MMM', { locale: { localize: { month: n => ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][n] } } }),
      startDate: format(startOfMonth(d), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(d), 'yyyy-MM-dd'),
    };
  });

  const activeCompanies = COMPANIES.filter(c => c.active);

  // Para cada mes, obtenemos el P&L de todas las empresas
  const monthlyResults = await Promise.all(
    months.map(async (month) => {
      let totalIncome = 0;
      let totalExpenses = 0;

      await Promise.all(
        activeCompanies.map(async (company) => {
          const token = await getValidToken(company.id);
          if (!token) return;
          const { access_token, realmId } = token;
          if (!realmId) return;
          try {
            const pl = await getProfitAndLoss(access_token, realmId, month.startDate, month.endDate);
            const data = extractPLData(pl);
            totalIncome += data.income || 0;
            totalExpenses += data.expenses || 0;
          } catch {}
        })
      );

      return {
        month: month.label,
        monthIndex: month.index,
        startDate: month.startDate,
        income: Math.round(totalIncome),
        expenses: Math.round(totalExpenses),
        net: Math.round(totalIncome - totalExpenses),
      };
    })
  );

  const yearTotal = {
    income: monthlyResults.reduce((s, m) => s + m.income, 0),
    expenses: monthlyResults.reduce((s, m) => s + m.expenses, 0),
    net: monthlyResults.reduce((s, m) => s + m.net, 0),
    profitableMonths: monthlyResults.filter(m => m.net > 0).length,
    lossMonths: monthlyResults.filter(m => m.net < 0).length,
  };

  return res.status(200).json({ success: true, year, months: monthlyResults, total: yearTotal });
}
