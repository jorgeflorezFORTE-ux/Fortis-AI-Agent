/**
 * lib/db.js
 * Base de datos SQLite para almacenar transacciones, tokens OAuth y análisis.
 * Se crea automáticamente al primer uso.
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(process.cwd(), 'data', 'finance.db');

let _db = null;

function getDb() {
  if (_db) return _db;

  // Crear directorio si no existe
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');

  // Crear tablas
  _db.exec(`
    CREATE TABLE IF NOT EXISTS oauth_tokens (
      company_id TEXT PRIMARY KEY,
      realm_id TEXT NOT NULL,
      access_token TEXT NOT NULL,
      refresh_token TEXT NOT NULL,
      token_type TEXT DEFAULT 'Bearer',
      expires_at INTEGER NOT NULL,
      refresh_expires_at INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      company_id TEXT NOT NULL,
      qb_id TEXT,
      type TEXT NOT NULL CHECK(type IN ('income','expense')),
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      category TEXT,
      subcategory TEXT,
      description TEXT,
      vendor TEXT,
      account TEXT,
      payment_method TEXT,
      reference TEXT,
      memo TEXT,
      raw_data TEXT,
      synced_at TEXT DEFAULT (datetime('now')),
      UNIQUE(company_id, qb_id)
    );

    CREATE TABLE IF NOT EXISTS sync_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id TEXT NOT NULL,
      sync_type TEXT DEFAULT 'full',
      status TEXT DEFAULT 'started',
      transactions_synced INTEGER DEFAULT 0,
      error_message TEXT,
      started_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS personal_uploads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      source_name TEXT,
      file_type TEXT DEFAULT 'csv',
      period TEXT,
      total_transactions INTEGER DEFAULT 0,
      total_income REAL DEFAULT 0,
      total_expenses REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      ai_analysis TEXT,
      uploaded_at TEXT DEFAULT (datetime('now')),
      processed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS ai_analyses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id TEXT,
      period TEXT NOT NULL,
      analysis_type TEXT NOT NULL,
      result TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_txn_company ON transactions(company_id);
    CREATE INDEX IF NOT EXISTS idx_txn_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_txn_type ON transactions(type);
    CREATE INDEX IF NOT EXISTS idx_txn_category ON transactions(category);
  `);

  return _db;
}

// ── OAuth Tokens ──────────────────────────────────────────────────────────────

function saveToken(companyId, tokenData) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO oauth_tokens (company_id, realm_id, access_token, refresh_token, token_type, expires_at, refresh_expires_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(company_id) DO UPDATE SET
      access_token = excluded.access_token,
      refresh_token = excluded.refresh_token,
      expires_at = excluded.expires_at,
      refresh_expires_at = excluded.refresh_expires_at,
      updated_at = datetime('now')
  `);
  stmt.run(
    companyId,
    tokenData.realmId,
    tokenData.access_token,
    tokenData.refresh_token,
    tokenData.token_type || 'Bearer',
    tokenData.expires_at || (Date.now() + 3600000),
    tokenData.x_refresh_token_expires_in ? Date.now() + tokenData.x_refresh_token_expires_in * 1000 : null
  );
}

function getToken(companyId) {
  const db = getDb();
  return db.prepare('SELECT * FROM oauth_tokens WHERE company_id = ?').get(companyId);
}

function getAllTokens() {
  const db = getDb();
  return db.prepare('SELECT * FROM oauth_tokens').all();
}

// ── Transactions ──────────────────────────────────────────────────────────────

function upsertTransaction(txn) {
  const db = getDb();
  const id = txn.id || `${txn.company_id}-${txn.qb_id || Date.now()}`;
  const stmt = db.prepare(`
    INSERT INTO transactions (id, company_id, qb_id, type, amount, date, category, subcategory, description, vendor, account, payment_method, reference, memo, raw_data, synced_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(company_id, qb_id) DO UPDATE SET
      amount = excluded.amount, category = excluded.category, description = excluded.description,
      vendor = excluded.vendor, account = excluded.account, raw_data = excluded.raw_data,
      synced_at = datetime('now')
  `);
  stmt.run(id, txn.company_id, txn.qb_id, txn.type, txn.amount, txn.date, txn.category || null,
    txn.subcategory || null, txn.description || null, txn.vendor || null, txn.account || null,
    txn.payment_method || null, txn.reference || null, txn.memo || null, txn.raw_data ? JSON.stringify(txn.raw_data) : null);
  return id;
}

function upsertMany(transactions) {
  const db = getDb();
  const insertMany = db.transaction((txns) => {
    for (const txn of txns) upsertTransaction(txn);
  });
  insertMany(transactions);
  return transactions.length;
}

function getTransactions({ companyId, startDate, endDate, type, category, limit = 500 }) {
  const db = getDb();
  let sql = 'SELECT * FROM transactions WHERE 1=1';
  const params = [];

  if (companyId) { sql += ' AND company_id = ?'; params.push(companyId); }
  if (type) { sql += ' AND type = ?'; params.push(type); }
  if (category) { sql += ' AND category = ?'; params.push(category); }
  if (startDate) { sql += ' AND date >= ?'; params.push(startDate); }
  if (endDate) { sql += ' AND date <= ?'; params.push(endDate); }

  sql += ' ORDER BY date DESC LIMIT ?';
  params.push(limit);

  return db.prepare(sql).all(...params);
}

function getMonthlyTotals({ companyId, year }) {
  const db = getDb();
  let sql = `
    SELECT
      strftime('%m', date) as month,
      type,
      SUM(amount) as total,
      COUNT(*) as count
    FROM transactions
    WHERE strftime('%Y', date) = ?
  `;
  const params = [String(year)];
  if (companyId) { sql += ' AND company_id = ?'; params.push(companyId); }
  sql += ' GROUP BY month, type ORDER BY month';
  return db.prepare(sql).all(...params);
}

function getCategoryBreakdown({ companyId, startDate, endDate }) {
  const db = getDb();
  let sql = `
    SELECT
      category,
      SUM(amount) as total,
      COUNT(*) as count,
      company_id
    FROM transactions
    WHERE type = 'expense'
  `;
  const params = [];
  if (companyId) { sql += ' AND company_id = ?'; params.push(companyId); }
  if (startDate) { sql += ' AND date >= ?'; params.push(startDate); }
  if (endDate) { sql += ' AND date <= ?'; params.push(endDate); }
  sql += ' GROUP BY category ORDER BY total DESC';
  return db.prepare(sql).all(...params);
}

function getCategoryTransactions({ category, companyId, startDate, endDate }) {
  const db = getDb();
  let sql = 'SELECT * FROM transactions WHERE type = \'expense\' AND category = ?';
  const params = [category];
  if (companyId) { sql += ' AND company_id = ?'; params.push(companyId); }
  if (startDate) { sql += ' AND date >= ?'; params.push(startDate); }
  if (endDate) { sql += ' AND date <= ?'; params.push(endDate); }
  sql += ' ORDER BY date DESC';
  return db.prepare(sql).all(...params);
}

// ── Sync Log ──────────────────────────────────────────────────────────────────

function logSync(companyId, type = 'full') {
  const db = getDb();
  const r = db.prepare('INSERT INTO sync_log (company_id, sync_type) VALUES (?, ?)').run(companyId, type);
  return r.lastInsertRowid;
}

function completeSync(logId, count, error = null) {
  const db = getDb();
  db.prepare(`UPDATE sync_log SET status = ?, transactions_synced = ?, error_message = ?, completed_at = datetime('now') WHERE id = ?`)
    .run(error ? 'error' : 'completed', count, error, logId);
}

function getLastSync(companyId) {
  const db = getDb();
  return db.prepare('SELECT * FROM sync_log WHERE company_id = ? AND status = \'completed\' ORDER BY completed_at DESC LIMIT 1').get(companyId);
}

// ── AI Analyses ───────────────────────────────────────────────────────────────

function saveAnalysis(companyId, period, type, result) {
  const db = getDb();
  db.prepare('INSERT INTO ai_analyses (company_id, period, analysis_type, result) VALUES (?, ?, ?, ?)')
    .run(companyId, period, type, JSON.stringify(result));
}

function getLatestAnalysis(companyId, period, type) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM ai_analyses WHERE company_id = ? AND period = ? AND analysis_type = ? ORDER BY created_at DESC LIMIT 1')
    .get(companyId, period, type);
  return row ? { ...row, result: JSON.parse(row.result) } : null;
}

// ── Dashboard Aggregates ──────────────────────────────────────────────────────

function getDashboardData({ companyId, year }) {
  const monthly = getMonthlyTotals({ companyId, year });
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;
  const categories = getCategoryBreakdown({ companyId, startDate, endDate });
  const totalIncome = monthly.filter(m => m.type === 'income').reduce((s, m) => s + m.total, 0);
  const totalExpenses = monthly.filter(m => m.type === 'expense').reduce((s, m) => s + m.total, 0);

  // Build monthly array
  const monthMap = {};
  monthly.forEach(m => {
    if (!monthMap[m.month]) monthMap[m.month] = { income: 0, expenses: 0 };
    if (m.type === 'income') monthMap[m.month].income = Math.round(m.total);
    else monthMap[m.month].expenses = Math.round(m.total);
  });

  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const monthlyChart = monthNames.map((name, i) => {
    const key = String(i + 1).padStart(2, '0');
    return { month: name, income: monthMap[key]?.income || 0, expenses: monthMap[key]?.expenses || 0 };
  });

  return {
    totalIncome: Math.round(totalIncome),
    totalExpenses: Math.round(totalExpenses),
    net: Math.round(totalIncome - totalExpenses),
    margin: totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0,
    monthlyChart,
    categories: categories.map(c => ({
      name: c.category || 'Sin categoría',
      amount: Math.round(c.total),
      count: c.count,
      pct: totalExpenses > 0 ? Math.round((c.total / totalExpenses) * 1000) / 10 : 0,
      companyId: c.company_id,
    })),
  };
}

module.exports = {
  getDb, saveToken, getToken, getAllTokens,
  upsertTransaction, upsertMany, getTransactions,
  getMonthlyTotals, getCategoryBreakdown, getCategoryTransactions,
  logSync, completeSync, getLastSync,
  saveAnalysis, getLatestAnalysis, getDashboardData,
  savePersonalUpload, getPersonalUploads, updatePersonalUpload,
  getPersonalSummary, getGlobalSummary,
};

// ── Personal Uploads ──────────────────────────────────────────────────────────

function savePersonalUpload({ accountId, filename, sourceName, fileType, period }) {
  const db = getDb();
  const r = db.prepare(`
    INSERT INTO personal_uploads (account_id, filename, source_name, file_type, period)
    VALUES (?, ?, ?, ?, ?)
  `).run(accountId, filename, sourceName || filename, fileType || 'csv', period || null);
  return r.lastInsertRowid;
}

function updatePersonalUpload(id, { totalTransactions, totalIncome, totalExpenses, status, aiAnalysis }) {
  const db = getDb();
  db.prepare(`
    UPDATE personal_uploads SET
      total_transactions = COALESCE(?, total_transactions),
      total_income = COALESCE(?, total_income),
      total_expenses = COALESCE(?, total_expenses),
      status = COALESCE(?, status),
      ai_analysis = COALESCE(?, ai_analysis),
      processed_at = datetime('now')
    WHERE id = ?
  `).run(totalTransactions, totalIncome, totalExpenses, status, aiAnalysis ? JSON.stringify(aiAnalysis) : null, id);
}

function getPersonalUploads(accountId) {
  const db = getDb();
  let sql = 'SELECT * FROM personal_uploads';
  const params = [];
  if (accountId) { sql += ' WHERE account_id = ?'; params.push(accountId); }
  sql += ' ORDER BY uploaded_at DESC';
  return db.prepare(sql).all(...params).map(row => ({
    ...row,
    ai_analysis: row.ai_analysis ? JSON.parse(row.ai_analysis) : null,
  }));
}

function getPersonalSummary({ accountId, year }) {
  const db = getDb();
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  // Get personal transactions (company_id starts with 'personal-')
  let txnSql = `
    SELECT type, SUM(amount) as total, COUNT(*) as count
    FROM transactions WHERE company_id LIKE 'personal-%'
    AND date >= ? AND date <= ?
  `;
  const params = [startDate, endDate];
  if (accountId) { txnSql += ' AND company_id = ?'; params.push(accountId); }
  txnSql += ' GROUP BY type';
  const totals = db.prepare(txnSql).all(...params);

  const income = totals.find(t => t.type === 'income')?.total || 0;
  const expenses = totals.find(t => t.type === 'expense')?.total || 0;

  // Categories
  let catSql = `
    SELECT category, SUM(amount) as total, COUNT(*) as count
    FROM transactions WHERE company_id LIKE 'personal-%' AND type = 'expense'
    AND date >= ? AND date <= ?
  `;
  const catParams = [startDate, endDate];
  if (accountId) { catSql += ' AND company_id = ?'; catParams.push(accountId); }
  catSql += ' GROUP BY category ORDER BY total DESC';
  const categories = db.prepare(catSql).all(...catParams);

  // Monthly
  let mSql = `
    SELECT strftime('%m', date) as month, type, SUM(amount) as total
    FROM transactions WHERE company_id LIKE 'personal-%'
    AND date >= ? AND date <= ?
  `;
  const mParams = [startDate, endDate];
  if (accountId) { mSql += ' AND company_id = ?'; mParams.push(accountId); }
  mSql += ' GROUP BY month, type ORDER BY month';
  const monthly = db.prepare(mSql).all(...mParams);

  const monthMap = {};
  monthly.forEach(m => {
    if (!monthMap[m.month]) monthMap[m.month] = { income: 0, expenses: 0 };
    if (m.type === 'income') monthMap[m.month].income = Math.round(m.total);
    else monthMap[m.month].expenses = Math.round(m.total);
  });

  const monthNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const monthlyChart = monthNames.map((name, i) => {
    const key = String(i + 1).padStart(2, '0');
    return { month: name, income: monthMap[key]?.income || 0, expenses: monthMap[key]?.expenses || 0 };
  });

  // Uploads
  const uploads = getPersonalUploads(accountId);

  return {
    totalIncome: Math.round(income),
    totalExpenses: Math.round(expenses),
    net: Math.round(income - expenses),
    monthlyChart,
    categories: categories.map(c => ({
      name: c.category || 'Sin categoría',
      amount: Math.round(c.total),
      count: c.count,
      pct: expenses > 0 ? Math.round((c.total / expenses) * 1000) / 10 : 0,
    })),
    uploads,
    uploadCount: uploads.length,
  };
}

function getGlobalSummary(year) {
  const db = getDb();
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  // Business totals
  const bizTotals = db.prepare(`
    SELECT type, SUM(amount) as total FROM transactions
    WHERE company_id NOT LIKE 'personal-%' AND date >= ? AND date <= ?
    GROUP BY type
  `).all(startDate, endDate);

  // Personal totals
  const persTotals = db.prepare(`
    SELECT type, SUM(amount) as total FROM transactions
    WHERE company_id LIKE 'personal-%' AND date >= ? AND date <= ?
    GROUP BY type
  `).all(startDate, endDate);

  const bizIncome = bizTotals.find(t => t.type === 'income')?.total || 0;
  const bizExpenses = bizTotals.find(t => t.type === 'expense')?.total || 0;
  const persIncome = persTotals.find(t => t.type === 'income')?.total || 0;
  const persExpenses = persTotals.find(t => t.type === 'expense')?.total || 0;

  return {
    business: { income: Math.round(bizIncome), expenses: Math.round(bizExpenses), net: Math.round(bizIncome - bizExpenses) },
    personal: { income: Math.round(persIncome), expenses: Math.round(persExpenses), net: Math.round(persIncome - persExpenses) },
    total: {
      income: Math.round(bizIncome + persIncome),
      expenses: Math.round(bizExpenses + persExpenses),
      net: Math.round((bizIncome + persIncome) - (bizExpenses + persExpenses)),
    },
  };
}
