const { getClient } = require('./db');
let _seeded = false;

async function initSeeds() {
  if (_seeded) return;
  const c = await getClient();
  const r = await c.execute({ sql: 'SELECT COUNT(*) as c FROM entities', args: [] });
  if (r.rows[0].c > 0) { _seeded = true; return; }
  const entities = [
    ['real-legacy','Real Legacy LLC','Real Legacy','business','Real Estate','#C8A46E','R','88-3202623','L22000282262','Operación compra/venta propiedades. Brazo operativo de Paola PA.',1,1],
    ['jp-media','JP Legacy Media and Consulting LLC','JP Legacy Media','business','Marketing','#60A5FA','J','','L23000500491','Ingresos por referidos.',1,2],
    ['paola-pa','Paola Alexandra Diaz Lozada PA','Paola Diaz PA','business','Comisiones','#A78BFA','P','92-2296944','P23000010864','Recaudadora de comisiones. Transfiere a Real Legacy.',1,3],
    ['vau-nutrition','VAU Nutrition LLC','VAU Nutrition','business','E-commerce','#2DD4BF','V','','','Venta online de suplementos.',1,4],
    ['reborn','Reborn Houses LLC','Reborn Houses','business','Inversiones','#F472B6','H','','L23000530638','CDs. Futuras inversiones bienes raíces.',1,5],
    ['jorge-llc','Jorge Manuel Florez Gutierrez LLC','Jorge Florez LLC','business','Inactiva','#7A8BA3','G','','P23000008508','Inactiva.',0,6],
    ['personal-jorge','Jorge — Personal','Jorge Personal','personal','Tarjetas · Bancos','#F59E0B','J','','','Gastos personales Jorge.',1,10],
    ['personal-paola','Paola — Personal','Paola Personal','personal','Tarjetas · Bancos','#EC4899','P','','','Gastos personales Paola.',1,11],
    ['personal-hogar','Gastos del Hogar','Hogar','personal','Compartidos','#8B5CF6','H','','','Gastos compartidos.',1,12],
  ];
  const accounts = [
    ['2211','real-legacy','Chase Checking 2211','checking','Chase'],['3007','real-legacy','Chase Checking 3007','checking','Chase'],
    ['1774','real-legacy','Chase Credit Card 1774','credit','Chase'],['3005','real-legacy','Amex Credit Card 3005','credit','Amex'],
    ['6678','jp-media','Chase Checking 6678','checking','Chase'],['7207','jp-media','Chase Checking 7207','checking','Chase'],
    ['2797','paola-pa','Chase Checking 2797','checking','Chase'],['1887','reborn','Chase Checking 1887','checking','Chase'],
    ['6152','reborn','Chase CD 6152','cd','Chase'],['3083','reborn','Chase CD 3083','cd','Chase'],
    ['8896','vau-nutrition','Chase Checking 8896','checking','Chase'],['9710','vau-nutrition','Chase Credit Card 9710','credit','Chase'],['9728','vau-nutrition','Chase Credit Card 9728','credit','Chase'],
    ['5659','personal-jorge','Chase Checking 5659','checking','Chase'],['7448','personal-jorge','Chase Credit Card 7448','credit','Chase'],
  ];
  const stmts = [];
  for (const e of entities) {
    stmts.push({ sql: 'INSERT OR IGNORE INTO entities (id,name,short_name,type,category,color,icon,ein,reg_number,description,active,sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)', args: e });
  }
  for (const a of accounts) {
    stmts.push({ sql: 'INSERT OR IGNORE INTO account_mappings (digits,entity_id,label,account_type,bank) VALUES (?,?,?,?,?)', args: a });
  }
  await c.batch(stmts, 'write');
  _seeded = true;
}

async function getAllEntities() { const c = await getClient(); await initSeeds(); const r = await c.execute({ sql: 'SELECT * FROM entities ORDER BY sort_order,name', args: [] }); return r.rows; }
async function getEntity(id) { const c = await getClient(); await initSeeds(); const r = await c.execute({ sql: 'SELECT * FROM entities WHERE id=?', args: [id] }); return r.rows[0]; }

async function createEntity(d) {
  const c = await getClient(); await initSeeds();
  const id = d.id || d.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const mx = await c.execute({ sql: 'SELECT MAX(sort_order) as m FROM entities WHERE type=?', args: [d.type || 'business'] });
  await c.execute({
    sql: 'INSERT INTO entities (id,name,short_name,type,category,color,icon,ein,reg_number,description,active,sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
    args: [id, d.name, d.shortName || d.name, d.type || 'business', d.category || '', d.color || '#7A8BA3', d.icon || d.name[0].toUpperCase(), d.ein || '', d.regNumber || '', d.description || '', d.active !== false ? 1 : 0, (mx.rows[0]?.m || 0) + 1]
  });
  return id;
}

async function updateEntity(id, f) {
  const ok = ['name', 'short_name', 'type', 'category', 'color', 'icon', 'ein', 'reg_number', 'description', 'active', 'sort_order'];
  const s = [], v = [];
  Object.entries(f).forEach(([k, val]) => { const dk = k.replace(/([A-Z])/g, '_$1').toLowerCase(); if (ok.includes(dk)) { s.push(dk + '=?'); v.push(val); } });
  if (!s.length) return;
  v.push(id);
  const c = await getClient();
  await c.execute({ sql: 'UPDATE entities SET ' + s.join(',') + ' WHERE id=?', args: v });
}

async function deleteEntity(id) {
  const c = await getClient();
  await c.execute({ sql: 'DELETE FROM account_mappings WHERE entity_id=?', args: [id] });
  await c.execute({ sql: 'DELETE FROM entities WHERE id=?', args: [id] });
}

async function getAllMappings() {
  const c = await getClient(); await initSeeds();
  const r = await c.execute({ sql: 'SELECT m.*,e.name as entity_name,e.short_name,e.color as entity_color,e.type as entity_type FROM account_mappings m LEFT JOIN entities e ON m.entity_id=e.id ORDER BY m.entity_id,m.digits', args: [] });
  return r.rows;
}

async function addMapping(d) {
  const c = await getClient();
  await c.execute({ sql: 'INSERT OR REPLACE INTO account_mappings (digits,entity_id,label,account_type,bank) VALUES (?,?,?,?,?)', args: [d.digits, d.entityId, d.label, d.accountType || 'checking', d.bank || 'Chase'] });
}

async function deleteMapping(d) {
  const c = await getClient();
  await c.execute({ sql: 'DELETE FROM account_mappings WHERE digits=?', args: [d] });
}

async function lookupAccount(digits) {
  if (!digits) return null;
  const c = await getClient(); await initSeeds();
  const r = await c.execute({ sql: 'SELECT m.*,e.name as entity_name,e.short_name,e.color as entity_color,e.type as entity_type FROM account_mappings m LEFT JOIN entities e ON m.entity_id=e.id WHERE m.digits=?', args: [digits.slice(-4)] });
  return r.rows[0] || null;
}

async function autoRouteFile(filename) {
  if (!filename) return null;
  const clean = filename.replace(/\.[^.]+$/, '');
  const matches = clean.match(/(\d{4,})/g);
  if (!matches) return null;
  let digits = null;
  for (const m of matches) { if (m.length === 8 && /^20\d{6}$/.test(m)) continue; if (m.length >= 4 && m.length <= 6) { digits = m.slice(-4); break; } }
  if (!digits) return null;
  const acc = await lookupAccount(digits);
  if (!acc) return { digits, entity: null, message: 'Cuenta ' + digits + ' no registrada' };
  return { digits, entity: acc.entity_id, label: acc.label, type: acc.entity_type, entityName: acc.entity_name || acc.short_name };
}

async function autoRouteByContent(csvContent) {
  if (!csvContent) return null;
  const lines = csvContent.slice(0, 2000);
  const amexMatch = lines.match(/[-,]0?(\d{4})[,\n\r]/);
  if (amexMatch) {
    const digits = amexMatch[1];
    const account = await lookupAccount(digits);
    if (account) return { digits, entity: account.entity_id, label: account.label, type: account.entity_type, entityName: account.entity_name || account.short_name };
  }
  const dataLines = csvContent.split('\n').slice(1, 3);
  for (const line of dataLines) {
    const matches = line.match(/\b(\d{4})\b/g);
    if (matches) {
      for (const m of matches) {
        const account = await lookupAccount(m);
        if (account) return { digits: m, entity: account.entity_id, label: account.label, type: account.entity_type, entityName: account.entity_name || account.short_name };
      }
    }
  }
  return null;
}

module.exports = { initSeeds, getAllEntities, getEntity, createEntity, updateEntity, deleteEntity, getAllMappings, addMapping, deleteMapping, lookupAccount, autoRouteFile, autoRouteByContent };
