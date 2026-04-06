const { getClient } = require('./db');
const crypto = require('crypto');

function hashContent(text) { return crypto.createHash('md5').update(text.trim()).digest('hex'); }

async function checkDuplicateUpload(accountId, filename, csvContent) {
  const c = await getClient();
  const r = await c.execute({ sql: 'SELECT id, source_name, total_transactions, uploaded_at FROM personal_uploads WHERE account_id = ? AND filename = ?', args: [accountId, filename] });
  const byName = r.rows[0];
  if (byName) return { isDuplicate: true, type: 'exact_file', existing: byName, message: '"' + filename + '" ya fue subido el ' + new Date(byName.uploaded_at).toLocaleDateString('es-ES') + ' con ' + byName.total_transactions + ' transacciones' };
  return { isDuplicate: false };
}

async function deduplicateTransactions(newTxns, companyId) {
  const c = await getClient();
  if (!newTxns.length) return { unique: [], duplicates: [], duplicateCount: 0 };
  const dates = newTxns.map(function(t) { return t.date; }).filter(Boolean);
  if (!dates.length) return { unique: newTxns, duplicates: [], duplicateCount: 0 };
  const minDate = dates.sort()[0], maxDate = dates.sort().reverse()[0];
  const r = await c.execute({ sql: 'SELECT date, amount, description FROM transactions WHERE company_id = ? AND date >= ? AND date <= ?', args: [companyId, minDate, maxDate] });
  const existing = r.rows;
  const set = new Set();
  existing.forEach(function(e) { set.add(e.date + '|' + Math.round(e.amount * 100) + '|' + (e.description || '').slice(0, 20).toLowerCase()); });
  const unique = [], duplicates = [];
  newTxns.forEach(function(t) { var k = t.date + '|' + Math.round(t.amount * 100) + '|' + (t.description || '').slice(0, 20).toLowerCase(); if (set.has(k)) duplicates.push(t); else { unique.push(t); set.add(k); } });
  return { unique: unique, duplicates: duplicates, duplicateCount: duplicates.length };
}

module.exports = { checkDuplicateUpload, deduplicateTransactions, hashContent };
