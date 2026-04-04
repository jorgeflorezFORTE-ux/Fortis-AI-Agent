/**
 * lib/companies.js
 * Configuración central de todas las empresas del portfolio
 */

export const COMPANIES = [
  {
    id: 'real-legacy',
    name: 'Real Legacy LLC',
    alias: 'JP Legacy Group',
    type: 'Real Estate',
    color: '#d4913a',
    ein: '88-3202623',
    regNumber: 'L22000282262',
    envKey: 'QB_REALM_REAL_LEGACY',
    description: 'Empresa principal de real estate. Recibe comisiones, maneja pagos personales y transacciones de propiedades.',
    active: true,
    priority: 1,
  },
  {
    id: 'jp-media',
    name: 'JP Legacy Media and Consulting LLC',
    alias: 'JP Legacy Media',
    type: 'Marketing',
    color: '#3a7ad4',
    regNumber: 'L23000500491',
    envKey: 'QB_REALM_JP_MEDIA',
    description: 'Ingresos por referidos de contratistas, property managers y marketing.',
    active: true,
    priority: 2,
  },
  {
    id: 'vau-nutrition',
    name: 'VAU Nutrition LLC',
    alias: 'VAU Nutrition',
    type: 'Nutrition',
    color: '#3ab87a',
    envKey: 'QB_REALM_VAU_NUTRITION',
    description: 'Empresa de nutrición en etapa de inicio.',
    active: false,
    priority: 5,
  },
  {
    id: 'paola-pa',
    name: 'Paola Alexandra Diaz Lozada PA',
    alias: 'Paola PA',
    type: 'Professional Account',
    color: '#c03ab8',
    ein: '92-2296944',
    regNumber: 'P23000010864',
    envKey: 'QB_REALM_PAOLA_PA',
    description: 'Recibe comisiones y las transfiere a Real Legacy LLC.',
    active: true,
    priority: 3,
    note: 'Las comisiones recibidas aquí deben mostrarse como transferencia a Real Legacy LLC',
  },
  {
    id: 'reborn-houses',
    name: 'Reborn Houses LLC',
    alias: 'Reborn Houses',
    type: 'Commercial',
    color: '#3ab8b8',
    regNumber: 'L23000530638',
    envKey: 'QB_REALM_REBORN_HOUSES',
    description: 'Lote comercial.',
    active: true,
    priority: 4,
  },
  {
    id: 'jp-homes',
    name: 'JP Legacy Homes LLC',
    alias: 'JP Homes',
    type: 'Real Estate',
    color: '#7a3ad4',
    envKey: 'QB_REALM_JP_HOMES',
    description: 'Homes.',
    active: true,
    priority: 4,
  },
  {
    id: 'jorge-llc',
    name: 'Jorge Manuel Florez Gutierrez LLC',
    alias: 'Jorge LLC',
    type: 'Personal Entity',
    color: '#8a9ab0',
    regNumber: 'P23000008508',
    envKey: 'QB_REALM_JORGE_LLC',
    description: 'Entidad personal de Jorge. Actualmente no activa.',
    active: false,
    priority: 6,
  },
];

export const PERSONAL_ACCOUNTS = [
  { id: 'jorge-personal', name: 'Jorge Florez - Personal', color: '#e04444', person: 'Jorge' },
  { id: 'paola-personal', name: 'Paola Diaz - Personal', color: '#e87ab0', person: 'Paola' },
];

export function getCompanyById(id) {
  return COMPANIES.find(c => c.id === id);
}

export function getActiveCompanies() {
  return COMPANIES.filter(c => c.active).sort((a, b) => a.priority - b.priority);
}

export function getRealmId(companyId) {
  const company = getCompanyById(companyId);
  if (!company) return null;
  return process.env[company.envKey] || null;
}
