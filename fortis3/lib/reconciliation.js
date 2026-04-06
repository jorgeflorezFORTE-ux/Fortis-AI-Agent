const { getTransactions } = require('./db');
const { validateTransaction, RULES } = require('./business-rules');

async function reconcileMonth({ companyId, year, month }) {
  const sd = `${year}-${String(month).padStart(2, '0')}-01`;
  const em = month === 12 ? 1 : month + 1, ey = month === 12 ? year + 1 : year;
  const ed = `${ey}-${String(em).padStart(2, '0')}-01`;
  const txns = await getTransactions({ companyId: companyId === 'all' ? null : companyId, startDate: sd, endDate: ed, limit: 1000 });
  const bank = txns.filter(t => t.reference?.startsWith('UP-'));
  const qb = txns.filter(t => t.source === 'quickbooks' || (!t.reference?.startsWith('UP-') && t.source !== 'bank'));
  const violations = [], matched = [];

  txns.forEach(t => {
    const r = validateTransaction(companyId || t.company_id, t);
    if (!r.valid) violations.push({ transaction: { id: t.id, date: t.date, description: t.description, amount: t.amount, category: t.category, type: t.type, company: t.company_id }, warnings: r.warnings });
  });

  bank.forEach(bt => {
    const m = qb.find(qt => Math.abs(qt.amount - bt.amount) < 0.02 && qt.date === bt.date && !matched.includes(qt.id));
    if (m) matched.push(m.id);
  });

  const dupes = [], seen = {};
  txns.forEach(t => { const k = `${t.date}-${t.amount}-${t.type}`; if (seen[k]) dupes.push({ original: seen[k], duplicate: t }); else seen[k] = t; });

  const catTotals = {};
  txns.filter(t => t.type === 'expense').forEach(t => { const c = t.category || 'Sin categoría'; if (!catTotals[c]) catTotals[c] = { total: 0, count: 0 }; catTotals[c].total += t.amount; catTotals[c].count++; });

  const totI = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totE = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return {
    period: `${year}-${String(month).padStart(2, '0')}`, companyId: companyId || 'all',
    summary: { totalTransactions: txns.length, bankTransactions: bank.length, qbTransactions: qb.length, totalIncome: Math.round(totI), totalExpenses: Math.round(totE), net: Math.round(totI - totE) },
    reconciliation: { matched: matched.length, unmatchedBank: bank.length - matched.length, unmatchedQB: qb.filter(q => !matched.includes(q.id)).length, matchRate: bank.length > 0 ? Math.round((matched.length / bank.length) * 100) : 0 },
    violations: violations.slice(0, 50), violationCount: violations.length,
    duplicates: dupes.slice(0, 20), duplicateCount: dupes.length,
    categories: Object.entries(catTotals).map(([n, d]) => ({ name: n, total: Math.round(d.total), count: d.count })).sort((a, b) => b.total - a.total),
  };
}

async function reconcileAll({ year, month }) {
  const results = {};
  for (const id of Object.keys(RULES)) {
    results[id] = await reconcileMonth({ companyId: id, year, month });
  }
  const tv = Object.values(results).reduce((s, r) => s + r.violationCount, 0);
  const td = Object.values(results).reduce((s, r) => s + r.duplicateCount, 0);
  return { period: `${year}-${String(month).padStart(2, '0')}`, globalSummary: { totalViolations: tv, totalDuplicates: td, status: tv === 0 && td === 0 ? 'clean' : tv > 10 ? 'critical' : 'review' }, perCompany: results };
}

module.exports = { reconcileMonth, reconcileAll };
