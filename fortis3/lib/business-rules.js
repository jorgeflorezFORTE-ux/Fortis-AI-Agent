const RULES = {
  'real-legacy': {
    name: 'Real Legacy LLC', activity: 'Compra/venta propiedades. Brazo operativo de Paola PA.',
    rules: ['Ingresos vienen de Paola PA o comisiones directas','Marketing referidos va a JP Media','Sin gastos personales','Paga proveedores, empleados, operación completa'],
    validExpense: ['Contract Labor','Contractor Payment','Nómina','Servicios Profesionales','Marketing','Tecnología','Seguros','Impuestos','Gastos Bancarios','QuickBooks Fees','Renta','Materiales','Viajes','MLS Fees','Title Company'],
    invalidExpense: ['Suplementos','Inventario Nutrición','Referidos de marketing'],
    transfersTo: [], transfersFrom: ['paola-pa'],
  },
  'paola-pa': {
    name: 'Paola Diaz PA', activity: 'Recaudadora comisiones real estate.',
    rules: ['Solo recibe comisiones y transfiere a Real Legacy','Sin gastos operativos significativos','Sin nómina ni contractors'],
    validExpense: ['Transferencias a Real Legacy','Gastos Bancarios','Licencias','Seguro E&O'],
    invalidExpense: ['Nómina','Contract Labor','Marketing','Materiales','Renta','Tecnología'],
    transfersTo: ['real-legacy'], transfersFrom: [],
  },
  'jp-media': {
    name: 'JP Legacy Media', activity: 'Referidos contratistas, property managers.',
    rules: ['Ingresos solo por referidos/consulting','Sin nómina ni contractors','Gastos mínimos: marketing digital, software'],
    validExpense: ['Marketing','Tecnología','Gastos Bancarios','Licencias'],
    invalidExpense: ['Nómina','Contract Labor','Renta','Materiales','Comisiones Real Estate','Suplementos'],
    transfersTo: [], transfersFrom: [],
  },
  'reborn': {
    name: 'Reborn Houses', activity: 'CDs. Inversiones futuras. Inactiva operativamente.',
    rules: ['Solo intereses de CDs','Sin gastos operativos','Cualquier gasto no bancario es sospechoso'],
    validExpense: ['Gastos Bancarios','Licencias'],
    invalidExpense: ['Nómina','Contract Labor','Marketing','Materiales','Renta'],
    transfersTo: [], transfersFrom: [],
  },
  'vau-nutrition': {
    name: 'VAU Nutrition', activity: 'E-commerce suplementos. Ventas desde junio 2025.',
    rules: ['Solo gastos hasta junio (inversión)','Ingresos desde junio son ventas online','Sin gastos de real estate'],
    validExpense: ['Inventario','Suplementos','Packaging','Marketing','Tecnología','Shopify','Amazon Fees','Envíos','Diseño','Gastos Bancarios'],
    invalidExpense: ['Comisiones Real Estate','Referidos','Contract Labor','Renta'],
    transfersTo: [], transfersFrom: [],
  },
  'jorge-llc': {
    name: 'Jorge Florez LLC', activity: 'INACTIVA.',
    rules: ['No debe tener movimientos','Todo es error de clasificación'],
    validExpense: ['Gastos Bancarios'], invalidExpense: ['*'],
    transfersTo: [], transfersFrom: [],
  },
};

const personalKW = ['uber eats','doordash','netflix','spotify','gym','starbucks','mcdonalds','amazon prime','apple.com','google storage','hulu','disney+','grubhub','instacart'];

function validateTransaction(companyId, t) {
  const r = RULES[companyId]; if (!r) return { valid: true, warnings: [] };
  const w = [], cat = (t.category || '').toLowerCase(), desc = (t.description || '').toLowerCase();
  for (const inv of r.invalidExpense) { if (inv === '*' || cat.includes(inv.toLowerCase())) w.push({ type: 'misclassified', severity: 'high', message: `"${t.category || t.description}" no va en ${r.name}`, suggestion: 'Mover a otra empresa' }); }
  for (const kw of personalKW) { if (desc.includes(kw)) { w.push({ type: 'personal', severity: 'high', message: `"${t.description}" parece gasto personal`, suggestion: 'Mover a personal-jorge o personal-paola' }); break; } }
  return { valid: w.length === 0, warnings: w };
}

function getRules(id) { return RULES[id] || null; }
module.exports = { RULES, getRules, validateTransaction };
