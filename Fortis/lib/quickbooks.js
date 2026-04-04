/**
 * lib/quickbooks.js
 * Maneja toda la comunicación con la API de QuickBooks Online
 */

import axios from 'axios';

const QB_BASE_URL = 'https://quickbooks.api.intuit.com/v3/company';
const QB_TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
const QB_AUTH_URL = 'https://appcenter.intuit.com/connect/oauth2';
const MINOR_VERSION = '70';

// ─── OAuth ────────────────────────────────────────────────────────────────────

export function buildAuthUrl(state = 'jp-legacy') {
  const params = new URLSearchParams({
    client_id: process.env.QB_CLIENT_ID,
    scope: 'com.intuit.quickbooks.accounting',
    redirect_uri: process.env.QB_REDIRECT_URI,
    response_type: 'code',
    state,
  });
  return `${QB_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForToken(code) {
  const credentials = Buffer.from(
    `${process.env.QB_CLIENT_ID}:${process.env.QB_CLIENT_SECRET}`
  ).toString('base64');

  const { data } = await axios.post(
    QB_TOKEN_URL,
    new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.QB_REDIRECT_URI,
    }).toString(),
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
    }
  );

  return data; // { access_token, refresh_token, expires_in, token_type, x_refresh_token_expires_in }
}

export async function refreshAccessToken(refreshToken) {
  const credentials = Buffer.from(
    `${process.env.QB_CLIENT_ID}:${process.env.QB_CLIENT_SECRET}`
  ).toString('base64');

  const { data } = await axios.post(
    QB_TOKEN_URL,
    new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }).toString(),
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
    }
  );

  return data;
}

// ─── QuickBooks API helper ────────────────────────────────────────────────────

function qbClient(accessToken) {
  return axios.create({
    baseURL: QB_BASE_URL,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });
}

async function runQuery(accessToken, realmId, query) {
  const client = qbClient(accessToken);
  const { data } = await client.get(
    `/${realmId}/query?query=${encodeURIComponent(query)}&minorversion=${MINOR_VERSION}`
  );
  return data.QueryResponse || {};
}

// ─── Transacciones ───────────────────────────────────────────────────────────

export async function getPurchases(accessToken, realmId, startDate, endDate) {
  const q = `SELECT * FROM Purchase WHERE TxnDate >= '${startDate}' AND TxnDate <= '${endDate}' ORDERBY TxnDate DESC MAXRESULTS 500`;
  const res = await runQuery(accessToken, realmId, q);
  return res.Purchase || [];
}

export async function getInvoices(accessToken, realmId, startDate, endDate) {
  const q = `SELECT * FROM Invoice WHERE TxnDate >= '${startDate}' AND TxnDate <= '${endDate}' ORDERBY TxnDate DESC MAXRESULTS 500`;
  const res = await runQuery(accessToken, realmId, q);
  return res.Invoice || [];
}

export async function getSalesReceipts(accessToken, realmId, startDate, endDate) {
  const q = `SELECT * FROM SalesReceipt WHERE TxnDate >= '${startDate}' AND TxnDate <= '${endDate}' ORDERBY TxnDate DESC MAXRESULTS 200`;
  const res = await runQuery(accessToken, realmId, q);
  return res.SalesReceipt || [];
}

export async function getDeposits(accessToken, realmId, startDate, endDate) {
  const q = `SELECT * FROM Deposit WHERE TxnDate >= '${startDate}' AND TxnDate <= '${endDate}' ORDERBY TxnDate DESC MAXRESULTS 200`;
  const res = await runQuery(accessToken, realmId, q);
  return res.Deposit || [];
}

export async function getUncategorizedTransactions(accessToken, realmId) {
  const q = `SELECT * FROM Purchase WHERE AccountRef = '1' MAXRESULTS 200`;
  const res = await runQuery(accessToken, realmId, q);
  return res.Purchase || [];
}

// ─── Reportes ────────────────────────────────────────────────────────────────

export async function getProfitAndLoss(accessToken, realmId, startDate, endDate) {
  const client = qbClient(accessToken);
  const { data } = await client.get(
    `/${realmId}/reports/ProfitAndLoss?start_date=${startDate}&end_date=${endDate}&minorversion=${MINOR_VERSION}`
  );
  return data;
}

export async function getBalanceSheet(accessToken, realmId, asOfDate) {
  const client = qbClient(accessToken);
  const { data } = await client.get(
    `/${realmId}/reports/BalanceSheet?date=${asOfDate}&minorversion=${MINOR_VERSION}`
  );
  return data;
}

export async function getCashFlow(accessToken, realmId, startDate, endDate) {
  const client = qbClient(accessToken);
  const { data } = await client.get(
    `/${realmId}/reports/CashFlow?start_date=${startDate}&end_date=${endDate}&minorversion=${MINOR_VERSION}`
  );
  return data;
}

// ─── Cuentas y clientes ───────────────────────────────────────────────────────

export async function getChartOfAccounts(accessToken, realmId) {
  const q = `SELECT * FROM Account WHERE Active = true MAXRESULTS 200`;
  const res = await runQuery(accessToken, realmId, q);
  return res.Account || [];
}

export async function getVendors(accessToken, realmId) {
  const q = `SELECT * FROM Vendor WHERE Active = true MAXRESULTS 200`;
  const res = await runQuery(accessToken, realmId, q);
  return res.Vendor || [];
}

export async function getCustomers(accessToken, realmId) {
  const q = `SELECT * FROM Customer WHERE Active = true MAXRESULTS 200`;
  const res = await runQuery(accessToken, realmId, q);
  return res.Customer || [];
}

// ─── Journal Entries ──────────────────────────────────────────────────────────

export async function createJournalEntry(accessToken, realmId, { date, memo, lines }) {
  const client = qbClient(accessToken);

  const journalEntry = {
    TxnDate: date,
    PrivateNote: memo,
    Line: lines.map(line => ({
      Description: line.description,
      Amount: Math.abs(line.amount),
      DetailType: 'JournalEntryLineDetail',
      JournalEntryLineDetail: {
        PostingType: line.type === 'debit' ? 'Debit' : 'Credit',
        AccountRef: { name: line.account },
      },
    })),
  };

  const { data } = await client.post(
    `/${realmId}/journalentry?minorversion=${MINOR_VERSION}`,
    journalEntry
  );

  return data.JournalEntry;
}

// ─── Utilidades ───────────────────────────────────────────────────────────────

export function extractPLData(plReport) {
  if (!plReport?.Rows?.Row) return { income: 0, expenses: 0, net: 0 };

  let income = 0;
  let expenses = 0;

  const extractAmount = (rows) => {
    let total = 0;
    rows?.forEach(row => {
      if (row.type === 'Data' && row.ColData) {
        const amt = parseFloat(row.ColData[1]?.value || 0);
        if (!isNaN(amt)) total += amt;
      }
      if (row.Rows?.Row) total += extractAmount(row.Rows.Row);
    });
    return total;
  };

  plReport.Rows.Row.forEach(section => {
    const name = section.Summary?.ColData?.[0]?.value?.toLowerCase() || '';
    const total = parseFloat(section.Summary?.ColData?.[1]?.value || 0);
    if (name.includes('income') || name.includes('revenue')) income = total;
    if (name.includes('expense') || name.includes('cost')) expenses = Math.abs(total);
  });

  return { income, expenses, net: income - expenses };
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}
