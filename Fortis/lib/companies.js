/**
 * lib/companies.js
 * Configuración central de todas las empresas del portfolio JP Legacy
 */

const COMPANIES = [
  {
    id: 'real-legacy',
    name: 'Real Legacy LLC',
    alias: 'JP Legacy Group',
    type: 'Real Estate',
    color: '#C8A46E',
    icon: 'R',
    ein: '88-3202623',
    regNumber: 'L22000282262',
    realmEnvKey: 'QB_REALM_REAL_LEGACY',
    description: 'Empresa principal de real estate. Recibe comisiones, maneja pagos y transacciones.',
    active: true,
  },
  {
    id: 'jp-media',
    name: 'JP Legacy Media and Consulting LLC',
    shortName: 'JP Legacy Media',
    type: 'Marketing',
    color: '#60A5FA',
    icon: 'J',
    regNumber: 'L23000500491',
    realmEnvKey: 'QB_REALM_JP_MEDIA',
    description: 'Ingresos por referidos de contratistas, property managers y marketing.',
    active: true,
  },
  {
    id: 'paola-pa',
    name: 'Paola Alexandra Diaz Lozada PA',
    shortName: 'Paola Diaz PA',
    type: 'Comisiones',
    color: '#A78BFA',
    icon: 'P',
    ein: '92-2296944',
    regNumber: 'P23000010864',
    realmEnvKey: 'QB_REALM_PAOLA_PA',
    description: 'Recibe comisiones y las pasa a Real Legacy LLC.',
    active: true,
  },
  {
    id: 'vau-nutrition',
    name: 'VAU Nutrition LLC',
    type: 'Nutrition',
    color: '#2DD4BF',
    icon: 'V',
    realmEnvKey: 'QB_REALM_VAU_NUTRITION',
    description: 'Empresa de nutrición — próxima a iniciar.',
    active: false,
  },
  {
    id: 'reborn',
    name: 'Reborn Houses LLC',
    type: 'Lote Comercial',
    color: '#F472B6',
    icon: 'H',
    regNumber: 'L23000530638',
    realmEnvKey: 'QB_REALM_REBORN',
    description: 'Lote comercial.',
    active: false,
  },
  {
    id: 'jorge-llc',
    name: 'Jorge Manuel Florez Gutierrez LLC',
    shortName: 'Jorge Florez LLC',
    type: 'Personal',
    color: '#7A8BA3',
    icon: 'G',
    regNumber: 'P23000008508',
    realmEnvKey: 'QB_REALM_JORGE_LLC',
    description: 'Entidad personal — actualmente inactiva.',
    active: false,
  },
];

// ── Cuentas personales (no contabilizadas en empresas) ────────────────────────

const PERSONAL_ACCOUNTS = [
  {
    id: 'personal-jorge',
    name: 'Jorge — Personal',
    shortName: 'Jorge Personal',
    owner: 'Jorge Florez',
    color: '#F59E0B',
    icon: 'J',
    description: 'Tarjetas de crédito, cuentas bancarias y gastos personales de Jorge.',
    sources: [], // Se llenan al subir archivos: ['Chase Sapphire', 'BofA Checking', etc.]
  },
  {
    id: 'personal-paola',
    name: 'Paola — Personal',
    shortName: 'Paola Personal',
    owner: 'Paola Diaz',
    color: '#EC4899',
    icon: 'P',
    description: 'Tarjetas de crédito, cuentas bancarias y gastos personales de Paola.',
    sources: [],
  },
  {
    id: 'personal-hogar',
    name: 'Gastos del Hogar',
    shortName: 'Hogar',
    owner: 'Compartido',
    color: '#8B5CF6',
    icon: 'H',
    description: 'Gastos compartidos del hogar: renta/mortgage, utilities, seguros, etc.',
    sources: [],
  },
];

// ── Sidebar sections (para el frontend) ──────────────────────────────────────

const SIDEBAR_SECTIONS = [
  {
    title: 'Empresas',
    items: [{ id: 'all', name: 'Consolidado', icon: '◆', color: '#C8A46E' }, ...COMPANIES],
  },
  {
    title: 'Gastos personales',
    items: PERSONAL_ACCOUNTS,
  },
];

function getCompany(id) {
  return COMPANIES.find(c => c.id === id);
}

function getPersonalAccount(id) {
  return PERSONAL_ACCOUNTS.find(a => a.id === id);
}

function getEntity(id) {
  return getCompany(id) || getPersonalAccount(id);
}

function isPersonalAccount(id) {
  return id?.startsWith('personal-');
}

function getActiveCompanies() {
  return COMPANIES.filter(c => c.active);
}

function getDisplayName(entity) {
  return entity.shortName || entity.name;
}

module.exports = {
  COMPANIES, PERSONAL_ACCOUNTS, SIDEBAR_SECTIONS,
  getCompany, getPersonalAccount, getEntity, isPersonalAccount,
  getActiveCompanies, getDisplayName,
};
