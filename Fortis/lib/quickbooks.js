/**
 * lib/quickbooks.js
 * Cliente de QuickBooks: OAuth 2.0 + lectura de transacciones
 */

const OAuthClient = require('intuit-oauth');
const { saveToken, getToken } = require('./db');
const { COMPANIES } = require('./companies');

// ── OAuth Client ──────────────────────────────────────────────────────────────

function createOAuthClient() {
  return new OAuthClient({
    clientId: process.env.QB_CLIENT_ID,
    clientSecret: process.env.QB_CLIENT_SECRET,
    environment: process.env.QB_ENVIRONMENT || 'sandbox',
    redirectUri: process.env.QB_REDIRECT_URI || `${process.env.APP_URL}/api/qb/callback`,
  });
}

function getAuthUri(companyId) {
  const oauthClient = createOAuthClient();
  return oauthClient.authorizeUri({
    scope: [OAuthClient.scopes.Accounting, OAuthClient.scopes.OpenId],
    state: companyId, // Para saber qué empresa se está conectando
  });
}

async function handleCallback(url) {
  const oauthClient = createOAuthClient();
  const authResponse = await oauthClient.createToken(url);
  return authResponse.getJson();
}

async function getValidToken(companyId) {
  const stored = getToken(companyId);
  if (!stored) return null;

  const oauthClient = createOAuthClient();
  oauthClient.setToken({
    access_token: stored.access_token,
    refresh_token: stored.refresh_token,
    token_type: stored.token_type,
    expires_in: Math.max(0, (stored.expires_at - Date.now()) / 1000),
  });

  // Refresh si está por expirar (menos de 5 min)
  if (stored.expires_at < Date.now() + 300000) {
    try {
      const refreshResponse = await oauthClient.refresh();
      const newToken = refreshResponse.getJson();
      saveToken(companyId, {
        realmId: stored.realm_id,
        access_token: newToken.access_token,
        refresh_token: newToken.refresh_token,
        token_type: newToken.token_type,
        expires_at: Date.now() + (newToken.expires_in * 1000),
        x_refresh_token_expires_in: newToken.x_refresh_token_expires_in,
      });
      return { accessToken: newToken.access_token, realmId: stored.realm_id };
    } catch (err) {
      console.error(`Token refresh failed for ${companyId}:`, err.message);
      return null;
    }
  }

  return { accessToken: stored.access_token, realmId: stored.realm_id };
}

// ── API Calls ─────────────────────────────────────────────────────────────────

const QB_BASE = {
  sandbox: 'https://sandbox-quickbooks.api.intuit.com',
  production: 'https://quickbooks.api.intuit.com',
};

async function qbApiCall(companyId, endpoint) {
  const token = await getValidToken(companyId);
  if (!token) throw new Error(`No valid token for ${companyId}`);

  const baseUrl = QB_BASE[process.env.QB_ENVIRONMENT || 'sandbox'];
  const url = `${baseUrl}/v3/company/${token.realmId}/${endpoint}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token.accessToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`QB API error ${response.status}: ${body}`);
  }

  return response.json();
}

async function queryQB(companyId, query) {
  const encoded = encodeURIComponent(query);
  return qbApiCall(companyId, `query?query=${encoded}`);
}

// ── Fetch Transactions ────────────────────────────────────────────────────────

async function fetchPurchases(companyId, startDate, endDate) {
  const query = `SELECT * FROM Purchase WHERE TxnDate >= '${startDate}' AND TxnDate <= '${endDate}' ORDERBY TxnDate DESC MAXRESULTS 500`;
  const result = await queryQB(companyId, query);
  return (result.QueryResponse?.Purchase || []).map(p => ({
    company_id: companyId,
    qb_id: `purchase-${p.Id}`,
    type: 'expense',
    amount: Math.abs(p.TotalAmt || 0),
    date: p.TxnDate,
    category: p.Line?.[0]?.AccountBasedExpenseLineDetail?.AccountRef?.name || p.AccountRef?.name || 'Sin categoría',
    description: p.PrivateNote || p.Line?.[0]?.Description || '',
    vendor: p.EntityRef?.name || '',
    account: p.AccountRef?.name || '',
    payment_method: p.PaymentType || 'Otro',
    reference: `QBP-${p.Id}`,
    memo: p.PrivateNote || '',
    raw_data: p,
  }));
}

async function fetchBills(companyId, startDate, endDate) {
  const query = `SELECT * FROM Bill WHERE TxnDate >= '${startDate}' AND TxnDate <= '${endDate}' ORDERBY TxnDate DESC MAXRESULTS 500`;
  const result = await queryQB(companyId, query);
  return (result.QueryResponse?.Bill || []).map(b => ({
    company_id: companyId,
    qb_id: `bill-${b.Id}`,
    type: 'expense',
    amount: Math.abs(b.TotalAmt || 0),
    date: b.TxnDate,
    category: b.Line?.[0]?.AccountBasedExpenseLineDetail?.AccountRef?.name || 'Sin categoría',
    description: b.Line?.[0]?.Description || '',
    vendor: b.VendorRef?.name || '',
    account: b.APAccountRef?.name || '',
    payment_method: 'Bill',
    reference: `QBB-${b.Id}`,
    memo: b.PrivateNote || '',
    raw_data: b,
  }));
}

async function fetchInvoices(companyId, startDate, endDate) {
  const query = `SELECT * FROM Invoice WHERE TxnDate >= '${startDate}' AND TxnDate <= '${endDate}' ORDERBY TxnDate DESC MAXRESULTS 500`;
  const result = await queryQB(companyId, query);
  return (result.QueryResponse?.Invoice || []).map(inv => ({
    company_id: companyId,
    qb_id: `invoice-${inv.Id}`,
    type: 'income',
    amount: Math.abs(inv.TotalAmt || 0),
    date: inv.TxnDate,
    category: inv.Line?.[0]?.SalesItemLineDetail?.ItemRef?.name || 'Servicios',
    description: inv.Line?.[0]?.Description || '',
    vendor: inv.CustomerRef?.name || '',
    account: '',
    payment_method: 'Invoice',
    reference: `QBI-${inv.Id}`,
    memo: inv.PrivateNote || '',
    raw_data: inv,
  }));
}

async function fetchPayments(companyId, startDate, endDate) {
  const query = `SELECT * FROM Payment WHERE TxnDate >= '${startDate}' AND TxnDate <= '${endDate}' ORDERBY TxnDate DESC MAXRESULTS 500`;
  const result = await queryQB(companyId, query);
  return (result.QueryResponse?.Payment || []).map(p => ({
    company_id: companyId,
    qb_id: `payment-${p.Id}`,
    type: 'income',
    amount: Math.abs(p.TotalAmt || 0),
    date: p.TxnDate,
    category: 'Cobros recibidos',
    description: `Pago de ${p.CustomerRef?.name || 'cliente'}`,
    vendor: p.CustomerRef?.name || '',
    account: p.DepositToAccountRef?.name || '',
    payment_method: p.PaymentMethodRef?.name || 'Otro',
    reference: `QBR-${p.Id}`,
    raw_data: p,
  }));
}

async function fetchProfitAndLoss(companyId, startDate, endDate) {
  return qbApiCall(companyId, `reports/ProfitAndLoss?start_date=${startDate}&end_date=${endDate}&summarize_column_by=Month`);
}

async function fetchAllTransactions(companyId, startDate, endDate) {
  const [purchases, bills, invoices, payments] = await Promise.allSettled([
    fetchPurchases(companyId, startDate, endDate),
    fetchBills(companyId, startDate, endDate),
    fetchInvoices(companyId, startDate, endDate),
    fetchPayments(companyId, startDate, endDate),
  ]);

  const all = [];
  if (purchases.status === 'fulfilled') all.push(...purchases.value);
  if (bills.status === 'fulfilled') all.push(...bills.value);
  if (invoices.status === 'fulfilled') all.push(...invoices.value);
  if (payments.status === 'fulfilled') all.push(...payments.value);

  return all;
}

// ── Connection Status ─────────────────────────────────────────────────────────

function getConnectionStatus() {
  return COMPANIES.map(co => {
    const token = getToken(co.id);
    return {
      companyId: co.id,
      companyName: co.shortName || co.name,
      connected: !!token,
      realmId: token?.realm_id || null,
      tokenExpired: token ? token.expires_at < Date.now() : true,
      lastUpdated: token?.updated_at || null,
    };
  });
}

module.exports = {
  createOAuthClient, getAuthUri, handleCallback, getValidToken,
  fetchAllTransactions, fetchProfitAndLoss, getConnectionStatus,
};
