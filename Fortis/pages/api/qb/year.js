/**
 * pages/api/qb/year.js
 * Retorna P&L mensual de todo el año para una o todas las empresas
 *
 * POST /api/qb/year
 * Body: { company: 'real-legacy' | 'all', year: 2026 }
 */

import { getProfitAndLoss, refreshAccessToken, extractPLData } from '../../../lib/quickbooks';
import { getToken, saveToken, isTokenExpired, acquireRefreshLock, releaseRefreshLock } from '../../../lib/tokenStore';
import { COMPANIES } from '../../../lib/companies';
import { format, startOfMonth, endOfMonth } from 'date-fns';

async function getValidToken(companyId) {
  let token = await getToken(companyId);
  if (!token) return null;

  if (isTokenExpired(token)) {
    const existing = acquireRefreshLock(companyId);
    if (existing) {
      token = await existing;
      if (token) return token;
      return await getToken(companyId);
    }

    try {
      const newToken = await refreshAccessToken(token.refresh_token);
      await saveToken(companyId, { ...newToken, realmId: token.realmId });
      token = await getToken(companyId);
      releaseRefreshLock(companyId, token);
    } catch (err) {
      releaseRefreshLock(companyId, null);
      console.error(`Error refreshing token for ${companyId}:`, err.message);
      return null;
    }
  }

  return token;
}

async function fetchYearData(companyId, year) {
  const token = await getValidToken(companyId);
  if (!token) {
    return { companyId, error: 'No conectado a QuickBooks', connected: false, months: [] };
  }

  const { access_token: accessToken, realmId } = token;
  const company = COMPANIES.find(c => c.id === companyId);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // Determine how many months to fetch (up to current month if same year)
  const maxMonth = year < currentYear ? 12 : Math.min(currentMonth + 1, 12);

  try {
    const monthPromises = [];
    for (let m = 0; m < maxMonth; m++) {
      const monthDate = new Date(year, m, 1);
      const startDate = format(startOfMonth(monthDate), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(monthDate), 'yyyy-MM-dd');
      monthPromises.push(
        getProfitAndLoss(accessToken, realmId, startDate, endDate)
          .then(pl => ({ month: m + 1, ...extractPLData(pl) }))
          .catch(() => ({ month: m + 1, income: 0, expenses: 0, net: 0 }))
      );
    }

    const months = await Promise.all(monthPromises);
    const totals = months.reduce(
      (acc, m) => ({
        income: acc.income + m.income,
        expenses: acc.expenses + m.expenses,
        net: acc.net + m.net,
      }),
      { income: 0, expenses: 0, net: 0 }
    );

    return {
      companyId,
      companyName: company?.name || companyId,
      connected: true,
      realmId,
      year,
      months,
      totals,
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error(`Error fetching year data for ${companyId}:`, err.message);
    return {
      companyId,
      companyName: company?.name || companyId,
      connected: true,
      error: err.message,
      months: [],
      totals: { income: 0, expenses: 0, net: 0 },
    };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { company = 'all', year = new Date().getFullYear() } = req.body;

  try {
    let results;

    if (company === 'all') {
      const activeCompanies = COMPANIES.filter(c => c.active).map(c => c.id);
      results = await Promise.all(
        activeCompanies.map(id => fetchYearData(id, parseInt(year)))
      );
    } else {
      results = [await fetchYearData(company, parseInt(year))];
    }

    const summary = {
      year: parseInt(year),
      totalIncome: results.reduce((s, r) => s + (r.totals?.income || 0), 0),
      totalExpenses: results.reduce((s, r) => s + (r.totals?.expenses || 0), 0),
      companiesConnected: results.filter(r => r.connected && !r.error).length,
    };
    summary.totalNet = summary.totalIncome - summary.totalExpenses;

    return res.status(200).json({ success: true, summary, companies: results });
  } catch (err) {
    console.error('Year sync error:', err);
    return res.status(500).json({ error: err.message });
  }
}
