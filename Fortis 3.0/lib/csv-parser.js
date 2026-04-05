function parseCSV(text) {
  const lines = text.replace(/\r\n/g,'\n').replace(/\r/g,'\n').trim().split('\n');
  if (lines.length < 2) return { headers: [], rows: [] };
  function parseLine(line) {
    const r = []; let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === ',' && !inQ) { r.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    r.push(cur.trim());
    return r;
  }
  const headers = parseLine(lines[0]).map(h => h.toLowerCase().trim().replace(/[^a-z0-9]/g,'_').replace(/_+/g,'_').replace(/^_|_$/g,''));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const vals = parseLine(line);
    if (vals.length < 2) continue;
    const row = {};
    headers.forEach((h, j) => { row[h] = (vals[j] || '').trim(); });
    rows.push(row);
  }
  return { headers, rows };
}

function detectFormat(headers) {
  const h = headers.join(' ');
  if (h.includes('card') && h.includes('transaction_date') && h.includes('category')) return 'chase_credit_card';
  if (h.includes('transaction_date') && h.includes('post_date') && h.includes('category')) return 'chase_credit';
  if (h.includes('details') && h.includes('posting_date')) return 'chase_checking';
  if (h.includes('card_member') && h.includes('account')) return 'amex';
  if (h.includes('appears_on_your_statement')) return 'amex';
  if (h.includes('reference_number') && h.includes('payee')) return 'bofa';
  return 'generic';
}

function isTransfer(desc, chaseType) {
  const d = (desc || '').toLowerCase();
  const ct = (chaseType || '').toUpperCase();
  if (ct === 'ACCT_XFER') return true;
  if (d.includes('payment thank you')) return true;
  if (d.includes('automatic payment - thank')) return true;
  if (d.includes('american express') && (ct === 'ACH_DEBIT' || ct === 'ACH_PAYMENT')) return true;
  if (d.includes('online transfer to chk') || d.includes('online transfer from chk')) return true;
  if (d.includes('online transfer to sav') || d.includes('online transfer from sav')) return true;
  if (d.includes('transfer to cds') || d.includes('transfer from cds')) return true;
  if (d.includes('transfer to chk') || d.includes('transfer from chk')) return true;
  if (d.includes('book transfer')) return true;
  if (d.includes('real time payment credit recd') && d.includes('real legacy')) return true;
  if (d.includes('real time payment credit recd') && d.includes('jp legacy')) return true;
  if (d.includes('real time payment credit recd') && d.includes('paola')) return true;
  if (d.includes('real time payment credit recd') && d.includes('reborn')) return true;
  if (d.includes('real time payment credit recd') && d.includes('vau')) return true;
  if (d.includes('orig co name:real legacy') || d.includes('orig co name:jp legacy')) return true;
  if (d.includes('orig co name:paola') || d.includes('orig co name:reborn houses')) return true;
  if (d.includes('orig co name:vau nutri') || d.includes('orig co name:jorge')) return true;
  if (d.match(/^withdrawal \d{2}\/\d{2}$/) || d.match(/^withdrawal$/)) return true;
  return false;
}

const MERCHANTS = [
  { p: ['walmart','wal-mart','target','costco','sam\'s club'], c: 'Compras' },
  { p: ['publix','whole foods','trader joe','aldi','winn dixie','sedano','grocery','groceries'], c: 'Alimentacion' },
  { p: ['mcdonald','burger king','wendy','chick-fil','subway','chipotle','starbucks','dunkin','restaurant','grubhub','doordash','uber eats','food & drink','acai','pizza'], c: 'Restaurantes' },
  { p: ['shell','chevron','exxon','racetrac','wawa','gas station','fuel','sunoco','bp '], c: 'Gasolina' },
  { p: ['uber trip','lyft','taxi'], c: 'Transporte' },
  { p: ['netflix','hulu','disney','spotify','apple music','youtube premium','hbo','paramount'], c: 'Entretenimiento' },
  { p: ['amazon','amzn'], c: 'Amazon' },
  { p: ['att','at&t','t-mobile','verizon','xfinity','comcast','spectrum'], c: 'Internet/Telefono' },
  { p: ['fpl','florida power','duke energy','electric','water util','sewer','orlando util'], c: 'Servicios Publicos' },
  { p: ['state farm','geico','progressive','allstate','insurance','oscar health','oscarhealth'], c: 'Seguros' },
  { p: ['cvs','walgreen','pharmacy','doctor','hospital','medical','dental'], c: 'Salud' },
  { p: ['rent ','mortgage','hoa '], c: 'Vivienda' },
  { p: ['gym','fitness','planet fitness','la fitness'], c: 'Gym' },
  { p: ['apple.com','google ','microsoft','adobe'], c: 'Tecnologia' },
  { p: ['home depot','lowe','ace hardware'], c: 'Materiales' },
  { p: ['quickbooks','intuit'], c: 'QuickBooks Fees' },
  { p: ['fee transaction','service charge','monthly service','maintenance fee'], c: 'Gastos Bancarios' },
  { p: ['late fee','returned payment','nsf fee'], c: 'Fees y Ajustes' },
  { p: ['payroll','gusto ','adp '], c: 'Nomina' },
  { p: ['wire transfer','domestic wire','international wire'], c: 'Transferencias Wire' },
  { p: ['remitly'], c: 'Remesas' },
  { p: ['bmw bank','bmw financial','car payment','auto loan'], c: 'Auto/Prestamo' },
  { p: ['zelle'], c: 'Zelle' },
];

function categorize(desc, chaseCategory) {
  if (chaseCategory && chaseCategory !== '') {
    const cc = chaseCategory.toLowerCase();
    if (cc.includes('food') || cc.includes('drink')) return 'Restaurantes';
    if (cc.includes('grocer')) return 'Alimentacion';
    if (cc.includes('gas') || cc.includes('automotive')) return 'Gasolina';
    if (cc.includes('travel')) return 'Viajes';
    if (cc.includes('entertainment')) return 'Entretenimiento';
    if (cc.includes('shopping')) return 'Compras';
    if (cc.includes('health')) return 'Salud';
    if (cc.includes('home')) return 'Vivienda';
    if (cc.includes('professional')) return 'Servicios Profesionales';
    if (cc.includes('fee') && cc.includes('adjust')) return 'Fees y Ajustes';
    if (cc.includes('education')) return 'Educacion';
    if (cc.includes('personal')) return 'Cuidado Personal';
    if (cc.includes('merchandise') || cc.includes('merch')) return 'Compras';
    return chaseCategory;
  }
  const d = (desc || '').toLowerCase();
  for (const m of MERCHANTS) { for (const p of m.p) { if (d.includes(p)) return m.c; } }
  return 'Sin categoria';
}

function normalizeDate(ds) {
  if (!ds) return null;
  const mdy = ds.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (mdy) return mdy[3]+'-'+mdy[1].padStart(2,'0')+'-'+mdy[2].padStart(2,'0');
  const ymd = ds.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymd) return ymd[1]+'-'+ymd[2].padStart(2,'0')+'-'+ymd[3].padStart(2,'0');
  return null;
}

function normTxn(row, format) {
  let date, desc, amount, category, type, isXfer, chaseType;
  switch (format) {
    case 'chase_checking':
      date = row.posting_date || '';
      desc = row.description || '';
      amount = parseFloat(row.amount || '0');
      chaseType = row.type || '';
      type = amount < 0 ? 'expense' : 'income';
      amount = Math.abs(amount);
      isXfer = isTransfer(desc, chaseType);
      category = categorize(desc, '');
      break;
    case 'chase_credit':
    case 'chase_credit_card':
      date = row.transaction_date || row.post_date || '';
      desc = row.description || '';
      amount = parseFloat(row.amount || '0');
      chaseType = row.type || '';
      type = amount < 0 ? 'expense' : 'income';
      amount = Math.abs(amount);
      isXfer = isTransfer(desc, chaseType) || chaseType.toLowerCase() === 'payment';
      category = categorize(desc, row.category || '');
      break;

    case 'amex':
      date = row.date || '';
      desc = row.description || '';
      amount = parseFloat(row.amount || '0');
      type = amount > 0 ? 'expense' : 'income';
      amount = Math.abs(amount);
      isXfer = isTransfer(desc, '');
      category = categorize(desc, row.category || '');
      break;

    default:
      date = row.date || Object.values(row)[0] || '';
      desc = row.description || Object.values(row)[1] || '';
      amount = parseFloat(row.amount || Object.values(row)[2] || '0');
      type = amount < 0 ? 'expense' : 'income';
      amount = Math.abs(amount);
      isXfer = isTransfer(desc, '');
      category = categorize(desc, row.category || '');
  }
  date = normalizeDate(date);
  if (!date || amount === 0) return null;
  return { date, description: desc, amount, category, type, isTransfer: isXfer };
}

function parseBankStatement(csvText, options) {
  options = options || {};
  const parsed = parseCSV(csvText);
  if (parsed.rows.length === 0) return { transactions: [], format: 'unknown' };
  const format = options.format || detectFormat(parsed.headers);
  const all = parsed.rows.map(function(r) { return normTxn(r, format); }).filter(function(t) { return t && t.amount > 0 && t.date; });
  var transactions = all.filter(function(t) { return !t.isTransfer; });
  var transfers = all.filter(function(t) { return t.isTransfer; });
  var totalIncome = 0, totalExpenses = 0;
  transactions.forEach(function(t) { if (t.type === 'income') totalIncome += t.amount; else totalExpenses += t.amount; });
  var catMap = {};
  transactions.forEach(function(t) { if (t.type === 'expense') { var c = t.category; if (!catMap[c]) catMap[c] = { total: 0, count: 0 }; catMap[c].total += t.amount; catMap[c].count++; } });
  var categories = Object.entries(catMap).map(function(e) { return { name: e[0], total: Math.round(e[1].total * 100) / 100, count: e[1].count, pct: totalExpenses > 0 ? Math.round((e[1].total / totalExpenses) * 1000) / 10 : 0 }; }).sort(function(a, b) { return b.total - a.total; });
  var tferTotal = 0; transfers.forEach(function(t) { tferTotal += t.amount; });
  return {
    format: format, totalTransactions: transactions.length,
    totalIncome: Math.round(totalIncome * 100) / 100, totalExpenses: Math.round(totalExpenses * 100) / 100,
    net: Math.round((totalIncome - totalExpenses) * 100) / 100,
    transfersExcluded: transfers.length, transferTotal: Math.round(tferTotal * 100) / 100,
    categories: categories, transactions: transactions,
    dateRange: { from: transactions.length ? transactions.reduce(function(min, t) { return t.date < min ? t.date : min; }, transactions[0].date) : null, to: transactions.length ? transactions.reduce(function(max, t) { return t.date > max ? t.date : max; }, transactions[0].date) : null },
  };
}

module.exports = { parseCSV: parseCSV, parseBankStatement: parseBankStatement, detectFormat: detectFormat };
