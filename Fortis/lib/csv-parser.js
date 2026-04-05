/**
 * lib/csv-parser.js
 * Parsea estados de cuenta bancarios en formato CSV.
 * Soporta: Chase, Bank of America, Amex, Wells Fargo, y genérico.
 */

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return { headers: [], rows: [] };

  // Detect delimiter
  const firstLine = lines[0];
  const delimiter = firstLine.includes('\t') ? '\t' : ',';

  // Parse with quote handling
  function parseLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === delimiter && !inQuotes) { result.push(current.trim()); current = ''; continue; }
      current += ch;
    }
    result.push(current.trim());
    return result;
  }

  const headers = parseLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, '_'));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseLine(line);
    if (values.length < 2) continue;
    const row = {};
    headers.forEach((h, j) => { row[h] = values[j] || ''; });
    rows.push(row);
  }

  return { headers, rows };
}

// ── Detect bank format ────────────────────────────────────────────────────────

function detectFormat(headers) {
  const h = headers.join(' ').toLowerCase();

  if (h.includes('transaction_date') && h.includes('post_date') && h.includes('category'))
    return 'chase';
  if (h.includes('reference_number') && h.includes('payee'))
    return 'bofa';
  if (h.includes('date') && h.includes('reference') && h.includes('amount') && h.includes('category'))
    return 'amex';
  if (h.includes('date') && h.includes('amount') && h.includes('description'))
    return 'wells_fargo';
  return 'generic';
}

// ── Normalize to standard transaction format ──────────────────────────────────

function normalizeTransaction(row, format) {
  let date, description, amount, category, type;

  switch (format) {
    case 'chase':
      date = row.transaction_date || row.posting_date || row.date || '';
      description = row.description || row.original_description || '';
      amount = parseFloat(row.amount || '0');
      category = row.category || '';
      // Chase: negative = expense, positive = income/payment
      type = amount < 0 ? 'expense' : 'income';
      amount = Math.abs(amount);
      break;

    case 'bofa':
      date = row.date || row.posted_date || '';
      description = row.payee || row.description || '';
      amount = parseFloat(row.amount || '0');
      category = row.category || '';
      type = amount < 0 ? 'expense' : 'income';
      amount = Math.abs(amount);
      break;

    case 'amex':
      date = row.date || '';
      description = row.description || row.reference || '';
      amount = parseFloat(row.amount || '0');
      category = row.category || '';
      // Amex: positive = expense (charge), negative = income (credit/payment)
      type = amount > 0 ? 'expense' : 'income';
      amount = Math.abs(amount);
      break;

    case 'wells_fargo':
      date = row.date || '';
      description = row.description || '';
      amount = parseFloat(row.amount || '0');
      category = '';
      type = amount < 0 ? 'expense' : 'income';
      amount = Math.abs(amount);
      break;

    default: // generic
      date = row.date || row.fecha || row.transaction_date || Object.values(row)[0] || '';
      description = row.description || row.descripcion || row.memo || row.payee || Object.values(row)[1] || '';
      amount = parseFloat(row.amount || row.monto || row.debit || row.credit || Object.values(row)[2] || '0');
      category = row.category || row.categoria || '';
      if (row.debit && row.credit) {
        const debit = parseFloat(row.debit || '0');
        const credit = parseFloat(row.credit || '0');
        amount = debit > 0 ? debit : credit;
        type = debit > 0 ? 'expense' : 'income';
      } else {
        type = amount < 0 ? 'expense' : 'income';
        amount = Math.abs(amount);
      }
  }

  // Normalize date to YYYY-MM-DD
  date = normalizeDate(date);

  return { date, description, amount, category, type };
}

function normalizeDate(dateStr) {
  if (!dateStr) return new Date().toISOString().split('T')[0];

  // Try MM/DD/YYYY or MM-DD-YYYY
  const mdy = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (mdy) return `${mdy[3]}-${mdy[1].padStart(2, '0')}-${mdy[2].padStart(2, '0')}`;

  // Try YYYY-MM-DD
  const ymd = dateStr.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymd) return `${ymd[1]}-${ymd[2].padStart(2, '0')}-${ymd[3].padStart(2, '0')}`;

  // Try DD/MM/YYYY
  const dmy = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/);
  if (dmy) return `20${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;

  return dateStr;
}

// ── Main parse function ───────────────────────────────────────────────────────

function parseBankStatement(csvText, options = {}) {
  const { headers, rows } = parseCSV(csvText);
  if (rows.length === 0) return { transactions: [], format: 'unknown', error: 'No transactions found' };

  const format = options.format || detectFormat(headers);

  const transactions = rows
    .map(row => normalizeTransaction(row, format))
    .filter(t => t.amount > 0 && t.date);

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  // Group by category
  const categoryMap = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    const cat = t.category || 'Sin categoría';
    if (!categoryMap[cat]) categoryMap[cat] = { total: 0, count: 0, transactions: [] };
    categoryMap[cat].total += t.amount;
    categoryMap[cat].count++;
    categoryMap[cat].transactions.push(t);
  });

  const categories = Object.entries(categoryMap)
    .map(([name, data]) => ({
      name,
      total: Math.round(data.total * 100) / 100,
      count: data.count,
      pct: totalExpenses > 0 ? Math.round((data.total / totalExpenses) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // Detect recurring
  const descCounts = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    const key = t.description.toLowerCase().slice(0, 30);
    if (!descCounts[key]) descCounts[key] = { desc: t.description, count: 0, total: 0 };
    descCounts[key].count++;
    descCounts[key].total += t.amount;
  });
  const recurring = Object.values(descCounts)
    .filter(d => d.count >= 2)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)
    .map(d => ({ description: d.desc, count: d.count, total: Math.round(d.total * 100) / 100, avgAmount: Math.round((d.total / d.count) * 100) / 100 }));

  return {
    format,
    totalTransactions: transactions.length,
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    net: Math.round((totalIncome - totalExpenses) * 100) / 100,
    categories,
    recurring,
    transactions,
    dateRange: {
      from: transactions.length > 0 ? transactions.reduce((min, t) => t.date < min ? t.date : min, transactions[0].date) : null,
      to: transactions.length > 0 ? transactions.reduce((max, t) => t.date > max ? t.date : max, transactions[0].date) : null,
    },
  };
}

module.exports = { parseCSV, parseBankStatement, detectFormat };
