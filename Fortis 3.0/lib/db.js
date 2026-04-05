const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const DB_PATH = path.join(process.cwd(), 'data', 'finance.db');
let _db = null;

function getDb() {
  if (_db) return _db;
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  _db.exec(`
    CREATE TABLE IF NOT EXISTS entities (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, short_name TEXT, type TEXT DEFAULT 'business',
      category TEXT, color TEXT DEFAULT '#7A8BA3', icon TEXT DEFAULT '?', ein TEXT,
      reg_number TEXT, description TEXT, active INTEGER DEFAULT 1, sort_order INTEGER DEFAULT 99,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS account_mappings (
      digits TEXT PRIMARY KEY, entity_id TEXT NOT NULL, label TEXT NOT NULL,
      account_type TEXT DEFAULT 'checking', bank TEXT DEFAULT 'Chase',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY, company_id TEXT NOT NULL, qb_id TEXT, source TEXT DEFAULT 'bank',
      type TEXT NOT NULL CHECK(type IN ('income','expense')),
      amount REAL NOT NULL, date TEXT NOT NULL, category TEXT, subcategory TEXT,
      description TEXT, vendor TEXT, account TEXT, payment_method TEXT,
      reference TEXT, memo TEXT, raw_data TEXT,
      synced_at TEXT DEFAULT (datetime('now')), UNIQUE(company_id, qb_id)
    );
    CREATE TABLE IF NOT EXISTS personal_uploads (
      id INTEGER PRIMARY KEY AUTOINCREMENT, account_id TEXT NOT NULL,
      filename TEXT NOT NULL, source_name TEXT, file_type TEXT DEFAULT 'csv',
      period TEXT, total_transactions INTEGER DEFAULT 0,
      total_income REAL DEFAULT 0, total_expenses REAL DEFAULT 0,
      status TEXT DEFAULT 'pending', ai_analysis TEXT,
      uploaded_at TEXT DEFAULT (datetime('now')), processed_at TEXT
    );
    CREATE TABLE IF NOT EXISTS ai_analyses (
      id INTEGER PRIMARY KEY AUTOINCREMENT, company_id TEXT, period TEXT NOT NULL,
      analysis_type TEXT NOT NULL, result TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS freedom_assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, type TEXT NOT NULL,
      entity_id TEXT, value REAL DEFAULT 0, monthly_income REAL DEFAULT 0,
      annual_return_pct REAL DEFAULT 0, notes TEXT, active INTEGER DEFAULT 1,
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS freedom_liabilities (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, type TEXT NOT NULL,
      balance REAL DEFAULT 0, monthly_payment REAL DEFAULT 0,
      interest_rate REAL DEFAULT 0, notes TEXT, active INTEGER DEFAULT 1,
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS freedom_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL,
      total_assets REAL, total_liabilities REAL, net_worth REAL,
      passive_income REAL, monthly_expenses REAL, fin_score REAL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS scorecard (
      id INTEGER PRIMARY KEY AUTOINCREMENT, period TEXT NOT NULL,
      biz_grade TEXT, personal_grade TEXT, accounting_grade TEXT, freedom_grade TEXT,
      overall_grade TEXT, summary TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_txn_company ON transactions(company_id);
    CREATE INDEX IF NOT EXISTS idx_txn_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_txn_type ON transactions(type);
  `);
  return _db;
}

// ── Transactions ──
function upsertTransaction(t) {
  const db = getDb();
  const id = t.id || t.company_id+'-'+( t.qb_id||Date.now());
  db.prepare(`INSERT INTO transactions (id,company_id,qb_id,source,type,amount,date,category,subcategory,description,vendor,account,payment_method,reference,memo,raw_data,synced_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'))
    ON CONFLICT(company_id,qb_id) DO UPDATE SET amount=excluded.amount,category=excluded.category,description=excluded.description,synced_at=datetime('now')`)
    .run(id,t.company_id,t.qb_id,t.source||'bank',t.type,t.amount,t.date,t.category||null,t.subcategory||null,t.description||null,t.vendor||null,t.account||null,t.payment_method||null,t.reference||null,t.memo||null,t.raw_data?JSON.stringify(t.raw_data):null);
  return id;
}
function upsertMany(txns) { const db=getDb(); const fn=db.transaction(ts=>{for(const t of ts)upsertTransaction(t)}); fn(txns); return txns.length; }

function getTransactions({companyId,startDate,endDate,type,category,source,limit=500}){
  const db=getDb(); let sql='SELECT * FROM transactions WHERE 1=1'; const p=[];
  if(companyId){sql+=' AND company_id=?';p.push(companyId);}
  if(type){sql+=' AND type=?';p.push(type);}
  if(category){sql+=' AND category=?';p.push(category);}
  if(source){sql+=' AND source=?';p.push(source);}
  if(startDate){sql+=' AND date>=?';p.push(startDate);}
  if(endDate){sql+=' AND date<=?';p.push(endDate);}
  sql+=' ORDER BY date DESC LIMIT ?'; p.push(limit);
  return db.prepare(sql).all(...p);
}

function getMonthlyTotals({companyId,year}){
  const db=getDb(); let sql=`SELECT strftime('%m',date) as month,type,SUM(amount) as total,COUNT(*) as count FROM transactions WHERE strftime('%Y',date)=?`;
  const p=[String(year)]; if(companyId){sql+=' AND company_id=?';p.push(companyId);} sql+=' GROUP BY month,type ORDER BY month';
  return db.prepare(sql).all(...p);
}

function getCategoryBreakdown({companyId,startDate,endDate}){
  const db=getDb(); let sql=`SELECT category,SUM(amount) as total,COUNT(*) as count,company_id FROM transactions WHERE type='expense'`;
  const p=[]; if(companyId){sql+=' AND company_id=?';p.push(companyId);} if(startDate){sql+=' AND date>=?';p.push(startDate);} if(endDate){sql+=' AND date<=?';p.push(endDate);}
  sql+=' GROUP BY category ORDER BY total DESC'; return db.prepare(sql).all(...p);
}

function getCategoryTransactions({category,companyId,startDate,endDate}){
  const db=getDb(); let sql="SELECT * FROM transactions WHERE type='expense' AND category=?"; const p=[category];
  if(companyId){sql+=' AND company_id=?';p.push(companyId);} if(startDate){sql+=' AND date>=?';p.push(startDate);} if(endDate){sql+=' AND date<=?';p.push(endDate);}
  sql+=' ORDER BY date DESC'; return db.prepare(sql).all(...p);
}

// ── Dashboard ──
function getDashboardData({companyId,year}){
  const monthly=getMonthlyTotals({companyId,year});
  const sd=year+'-01-01', ed=year+'-12-31';
  const categories=getCategoryBreakdown({companyId,startDate:sd,endDate:ed});
  const totI=monthly.filter(m=>m.type==='income').reduce((s,m)=>s+m.total,0);
  const totE=monthly.filter(m=>m.type==='expense').reduce((s,m)=>s+m.total,0);
  const mm={}; monthly.forEach(m=>{if(!mm[m.month])mm[m.month]={income:0,expenses:0};if(m.type==='income')mm[m.month].income=Math.round(m.total);else mm[m.month].expenses=Math.round(m.total);});
  const names=['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const chart=names.map((n,i)=>{const k=String(i+1).padStart(2,'0');return{month:n,income:mm[k]?.income||0,expenses:mm[k]?.expenses||0};});
  return {totalIncome:Math.round(totI),totalExpenses:Math.round(totE),net:Math.round(totI-totE),margin:totI>0?Math.round(((totI-totE)/totI)*100):0,monthlyChart:chart,
    categories:categories.map(c=>({name:c.category||'Sin categoría',amount:Math.round(c.total),count:c.count,pct:totE>0?Math.round((c.total/totE)*1000)/10:0}))};
}

// ── Uploads ──
function savePersonalUpload({accountId,filename,sourceName,fileType,period}){
  const db=getDb(); const r=db.prepare('INSERT INTO personal_uploads (account_id,filename,source_name,file_type,period) VALUES (?,?,?,?,?)').run(accountId,filename,sourceName||filename,fileType||'csv',period||null); return r.lastInsertRowid;
}
function updatePersonalUpload(id,{totalTransactions,totalIncome,totalExpenses,status,aiAnalysis}){
  const db=getDb(); db.prepare('UPDATE personal_uploads SET total_transactions=COALESCE(?,total_transactions),total_income=COALESCE(?,total_income),total_expenses=COALESCE(?,total_expenses),status=COALESCE(?,status),ai_analysis=COALESCE(?,ai_analysis),processed_at=datetime(\'now\') WHERE id=?')
    .run(totalTransactions,totalIncome,totalExpenses,status,aiAnalysis?JSON.stringify(aiAnalysis):null,id);
}
function getPersonalUploads(accountId){const db=getDb();let sql='SELECT * FROM personal_uploads';const p=[];if(accountId){sql+=' WHERE account_id=?';p.push(accountId);}sql+=' ORDER BY uploaded_at DESC';return db.prepare(sql).all(...p);}
function renameUpload(id,n){getDb().prepare('UPDATE personal_uploads SET source_name=? WHERE id=?').run(n,id);}
function deleteUpload(id){const db=getDb();const u=db.prepare('SELECT * FROM personal_uploads WHERE id=?').get(id);if(u){db.prepare("DELETE FROM transactions WHERE company_id=? AND reference LIKE ?").run(u.account_id,'UP-'+id+'-%');db.prepare('DELETE FROM personal_uploads WHERE id=?').run(id);}return u;}

// ── AI Cache ──
function saveAnalysis(cid,period,type,result){getDb().prepare('INSERT INTO ai_analyses (company_id,period,analysis_type,result) VALUES (?,?,?,?)').run(cid,period,type,JSON.stringify(result));}
function getLatestAnalysis(cid,period,type){const r=getDb().prepare('SELECT * FROM ai_analyses WHERE company_id=? AND period=? AND analysis_type=? ORDER BY created_at DESC LIMIT 1').get(cid,period,type);return r?{...r,result:JSON.parse(r.result)}:null;}

// ── Freedom Tracker ──
function getAssets(){return getDb().prepare('SELECT * FROM freedom_assets WHERE active=1 ORDER BY type,name').all();}
function addAsset(a){return getDb().prepare('INSERT INTO freedom_assets (name,type,entity_id,value,monthly_income,annual_return_pct,notes) VALUES (?,?,?,?,?,?,?)').run(a.name,a.type,a.entityId||null,a.value||0,a.monthlyIncome||0,a.annualReturn||0,a.notes||'').lastInsertRowid;}
function updateAsset(id,f){const sets=[],vals=[];Object.entries(f).forEach(([k,v])=>{const dk=k.replace(/([A-Z])/g,'_$1').toLowerCase();sets.push(dk+'=?');vals.push(v);});if(!sets.length)return;vals.push(id);getDb().prepare('UPDATE freedom_assets SET '+sets.join(',')+',updated_at=datetime(\'now\') WHERE id=?').run(...vals);}
function deleteAsset(id){getDb().prepare('DELETE FROM freedom_assets WHERE id=?').run(id);}

function getLiabilities(){return getDb().prepare('SELECT * FROM freedom_liabilities WHERE active=1 ORDER BY type,name').all();}
function addLiability(l){return getDb().prepare('INSERT INTO freedom_liabilities (name,type,balance,monthly_payment,interest_rate,notes) VALUES (?,?,?,?,?,?)').run(l.name,l.type,l.balance||0,l.monthlyPayment||0,l.interestRate||0,l.notes||'').lastInsertRowid;}
function updateLiability(id,f){const sets=[],vals=[];Object.entries(f).forEach(([k,v])=>{const dk=k.replace(/([A-Z])/g,'_$1').toLowerCase();sets.push(dk+'=?');vals.push(v);});if(!sets.length)return;vals.push(id);getDb().prepare('UPDATE freedom_liabilities SET '+sets.join(',')+',updated_at=datetime(\'now\') WHERE id=?').run(...vals);}
function deleteLiability(id){getDb().prepare('DELETE FROM freedom_liabilities WHERE id=?').run(id);}

function getFreedomSummary(){
  const assets=getAssets(), liabs=getLiabilities();
  const totalAssets=assets.reduce((s,a)=>s+a.value,0);
  const totalLiabs=liabs.reduce((s,l)=>s+l.balance,0);
  const passiveIncome=assets.reduce((s,a)=>s+a.monthly_income,0);
  const monthlyDebt=liabs.reduce((s,l)=>s+l.monthly_payment,0);
  return {assets,liabilities:liabs,totalAssets:Math.round(totalAssets),totalLiabilities:Math.round(totalLiabs),
    netWorth:Math.round(totalAssets-totalLiabs),passiveIncome:Math.round(passiveIncome),monthlyDebt:Math.round(monthlyDebt),
    finGoal:20000,finScore:20000>0?Math.round((passiveIncome/20000)*100):0,
    yearsFreedom:passiveIncome>0?0:null};
}

function saveSnapshot(){
  const s=getFreedomSummary();
  getDb().prepare('INSERT INTO freedom_snapshots (date,total_assets,total_liabilities,net_worth,passive_income,monthly_expenses,fin_score) VALUES (date(\'now\'),?,?,?,?,?,?)')
    .run(s.totalAssets,s.totalLiabilities,s.netWorth,s.passiveIncome,s.monthlyDebt,s.finScore);
}
function getSnapshots(limit=12){return getDb().prepare('SELECT * FROM freedom_snapshots ORDER BY date DESC LIMIT ?').all(limit);}

// ── Global Summary ──
function getGlobalSummary(year){
  const db=getDb(),sd=year+'-01-01',ed=year+'-12-31';
  const biz=db.prepare("SELECT type,SUM(amount) as total FROM transactions WHERE company_id NOT LIKE 'personal-%' AND date>=? AND date<=? GROUP BY type").all(sd,ed);
  const pers=db.prepare("SELECT type,SUM(amount) as total FROM transactions WHERE company_id LIKE 'personal-%' AND date>=? AND date<=? GROUP BY type").all(sd,ed);
  const bi=biz.find(t=>t.type==='income')?.total||0,be=biz.find(t=>t.type==='expense')?.total||0;
  const pi=pers.find(t=>t.type==='income')?.total||0,pe=pers.find(t=>t.type==='expense')?.total||0;
  return {business:{income:Math.round(bi),expenses:Math.round(be),net:Math.round(bi-be)},personal:{income:Math.round(pi),expenses:Math.round(pe),net:Math.round(pi-pe)},total:{income:Math.round(bi+pi),expenses:Math.round(be+pe),net:Math.round((bi+pi)-(be+pe))}};
}

module.exports = {getDb,upsertTransaction,upsertMany,getTransactions,getMonthlyTotals,getCategoryBreakdown,getCategoryTransactions,getDashboardData,
  savePersonalUpload,updatePersonalUpload,getPersonalUploads,renameUpload,deleteUpload,saveAnalysis,getLatestAnalysis,
  getAssets,addAsset,updateAsset,deleteAsset,getLiabilities,addLiability,updateLiability,deleteLiability,
  getFreedomSummary,saveSnapshot,getSnapshots,getGlobalSummary};
