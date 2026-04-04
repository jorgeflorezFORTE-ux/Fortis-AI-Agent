/**
 * pages/api/qb/sync.js
 * Sincroniza transacciones de QuickBooks para una o todas las empresas
 * 
 * POST /api/qb/sync
 * Body: { company: 'real-legacy' | 'all', startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD' }
 */

import {
  getPurchases,
  getInvoices,
  getSalesReceipts,
  getDeposits,
  getProfitAndLoss,
  refreshAccessToken,
  extractPLData,
} from '../../../lib/quickbooks';
import { getToken, saveToken, isTokenExpired } from '../../../lib/tokenStore';
import { COMPANIES } from '../../../lib/companies';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

async function getValidToken(companyId) {
  let token = getToken(companyId);
  if (!token) return null;

  if (isTokenExpired(token)) {
    try {
      const newToken = await refreshAccessToken(token.refresh_token);
      saveToken(companyId, { ...newToken, realmId: token.realmId });
      token = getToken(companyId);
    } catch (err) {
      console.error(`Error refreshing token for ${companyId}:`, err.message);
      return null;
    }
  }

  return token;
}

async function syncCompany(companyId, startDate, endDate) {
  const token = await getValidToken(companyId);
  if (!token) {
    return { companyId, error: 'No conectado a QuickBooks', connected: false };
  }

  const { access_token: accessToken, realmId } = token;
  const company = COMPANIES.find(c => c.id === companyId);

  try {
    // Ejecutamos todas las queries en paralelo
    const [purchases, invoices, salesReceipts, deposits, pl] = await Promise.allSettled([
      getPurchases(accessToken, realmId, startDate, endDate),
      getInvoices(accessToken, realmId, startDate, endDate),
      getSalesReceipts(accessToken, realmId, startDate, endDate),
      getDeposits(accessToken, realmId, startDate, endDate),
      getProfitAndLoss(accessToken, realmId, startDate, endDate),
    ]);

    const plData = extractPLData(pl.status === 'fulfilled' ? pl.value : null);

    // Unificamos todas las transacciones
    const allTransactions = [
      ...(purchases.status === 'fulfilled' ? purchases.value : []).map(t => ({ ...t, _type: 'purchase' })),
      ...(invoices.status === 'fulfilled' ? invoices.value : []).map(t => ({ ...t, _type: 'invoice' })),
      ...(salesReceipts.status === 'fulfilled' ? salesReceipts.value : []).map(t => ({ ...t, _type: 'sale' })),
      ...(deposits.status === 'fulfilled' ? deposits.value : []).map(t => ({ ...t, _type: 'deposit' })),
    ].sort((a, b) => new Date(b.TxnDate) - new Date(a.TxnDate));

    return {
      companyId,
      companyName: company?.name || companyId,
      connected: true,
      realmId,
      period: { startDate, endDate },
      transactions: allTransactions,
      transactionCount: allTransactions.length,
      pl: plData,
      syncedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error(`Error syncing ${companyId}:`, err.response?.data || err.message);
    return {
      companyId,
      companyName: company?.name || companyId,
      connected: true,
      error: err.message,
      transactions: [],
      pl: { income: 0, expenses: 0, net: 0 },
    };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const now = new Date();
  const {
    company = 'all',
    startDate = format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd'),
    endDate = format(endOfMonth(subMonths(now, 1)), 'yyyy-MM-dd'),
  } = req.body;

  try {
    let results;

    if (company === 'all') {
      // Sincronizamos todas las empresas activas en paralelo
      const activeCompanies = COMPANIES.filter(c => c.active).map(c => c.id);
      results = await Promise.all(
        activeCompanies.map(id => syncCompany(id, startDate, endDate))
      );
    } else {
      results = [await syncCompany(company, startDate, endDate)];
    }

    const summary = {
      totalTransactions: results.reduce((s, r) => s + (r.transactionCount || 0), 0),
      totalIncome: results.reduce((s, r) => s + (r.pl?.income || 0), 0),
      totalExpenses: results.reduce((s, r) => s + (r.pl?.expenses || 0), 0),
      companiesConnected: results.filter(r => r.connected && !r.error).length,
      companiesWithErrors: results.filter(r => r.error).length,
    };
    summary.totalNet = summary.totalIncome - summary.totalExpenses;

    return res.status(200).json({ success: true, summary, companies: results });
  } catch (err) {
    console.error('Sync error:', err);
    return res.status(500).json({ error: err.message });
  }
}
