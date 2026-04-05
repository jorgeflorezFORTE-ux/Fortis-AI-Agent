/**
 * lib/claude.js
 * Motor de análisis financiero con Claude AI
 */

const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Eres el asesor financiero AI personal de Jorge Florez y Paola Diaz.
Manejan un portfolio de empresas en Florida, USA:
- Real Legacy LLC (Real Estate, principal)
- JP Legacy Media (Marketing, referidos)
- Paola A. Diaz Lozada PA (Comisiones → Real Legacy)
- VAU Nutrition LLC (Por iniciar)
- Reborn Houses LLC (Lote comercial)
- Jorge Florez LLC (Personal, inactiva)

Tu trabajo es:
1. Categorizar transacciones según GAAP y mejores prácticas contables
2. Separar gastos personales vs negocio (importante para taxes)
3. Identificar gastos deducibles de impuestos en Florida/Federal
4. Detectar transacciones inusuales, duplicadas o errores
5. Dar recomendaciones concretas y accionables para reducir gastos
6. Identificar qué gastos recortar primero por mayor impacto
7. Verificar que transferencias entre empresas estén correctas

CATEGORÍAS DE GASTOS (usa estos nombres exactos):
Contract Labor, Contractor Payment, Nómina, Marketing y Publicidad,
Servicios Profesionales, Tecnología y Software, Seguros, Impuestos y Licencias,
Viajes y Transporte, Alimentación, Servicios Públicos, Gastos Bancarios,
QuickBooks Fees, Renta, Materiales, Otros

CATEGORÍAS DE INGRESOS:
Comisiones Real Estate, Referidos, Servicios, Rentas, Ventas de Propiedad, Otros

Siempre responde en español. Sé específico y accionable. Usa cifras exactas.
Cuando recomiendes recortar algo, di exactamente cuánto y cómo.`;

// ── Análisis mensual de gastos ────────────────────────────────────────────────

async function analyzeExpenses({ categories, transactions, totalIncome, totalExpenses, period }) {
  const prompt = `Analiza estos gastos del periodo ${period}:

RESUMEN:
- Ingresos totales: $${totalIncome.toLocaleString()}
- Gastos totales: $${totalExpenses.toLocaleString()}
- Resultado neto: $${(totalIncome - totalExpenses).toLocaleString()}

CATEGORÍAS DE GASTO (ordenadas por monto):
${categories.map(c => `- ${c.name}: $${c.amount.toLocaleString()} (${c.pct}% del total, ${c.count} transacciones)`).join('\n')}

TRANSACCIONES MÁS GRANDES:
${transactions.slice(0, 20).map(t => `- ${t.date} | ${t.description || t.category} | $${t.amount.toLocaleString()} | ${t.vendor || 'N/A'} | ${t.company_id}`).join('\n')}

Responde ÚNICAMENTE con JSON válido (sin markdown, sin backticks):
{
  "diagnostico": "Resumen ejecutivo de 2-3 oraciones",
  "estado": "critico|alerta|estable|bueno",
  "insights": [
    {
      "tipo": "critical|warning|info|success",
      "titulo": "...",
      "descripcion": "...",
      "accion": "Qué hacer específicamente",
      "ahorro_estimado": 0,
      "categoria_afectada": "..."
    }
  ],
  "recortes_prioritarios": [
    {
      "categoria": "...",
      "monto_actual": 0,
      "monto_sugerido": 0,
      "ahorro": 0,
      "como_recortar": "Explicación específica paso a paso",
      "impacto": "alto|medio|bajo",
      "urgencia": "inmediata|corto_plazo|mediano_plazo"
    }
  ],
  "proyeccion": {
    "neto_actual": 0,
    "ahorro_total_posible": 0,
    "neto_proyectado": 0,
    "mejora_anual": 0
  }
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].text.replace(/```json|```/g, '').trim();
  return JSON.parse(text);
}

// ── Chat financiero ───────────────────────────────────────────────────────────

async function chatWithAdvisor({ message, financialContext }) {
  const contextStr = financialContext
    ? `\nCONTEXTO FINANCIERO ACTUAL:\n${JSON.stringify(financialContext, null, 2)}\n`
    : '';

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    system: SYSTEM_PROMPT + '\nResponde de forma conversacional pero profesional. Sé directo y accionable.',
    messages: [{ role: 'user', content: contextStr + message }],
  });

  return response.content[0].text;
}

// ── Categorizar transacciones automáticamente ─────────────────────────────────

async function categorizeTransactions(transactions) {
  if (!transactions.length) return [];

  const batch = transactions.slice(0, 50).map(t => ({
    id: t.id || t.qb_id,
    desc: t.description || '',
    vendor: t.vendor || '',
    amount: t.amount,
    account: t.account || '',
  }));

  const prompt = `Categoriza estas transacciones. Responde SOLO con JSON:
${JSON.stringify(batch)}

Formato de respuesta (array):
[{ "id": "...", "category": "nombre exacto de categoría", "subcategory": "detalle opcional", "es_deducible": true/false, "es_personal": true/false }]`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].text.replace(/```json|```/g, '').trim();
  return JSON.parse(text);
}

module.exports = { analyzeExpenses, chatWithAdvisor, categorizeTransactions, categorizePersonalExpenses };

// ── Categorizar gastos personales con AI ──────────────────────────────────────

async function categorizePersonalExpenses({ transactions, sourceName, accountId, totalExpenses, totalIncome }) {
  if (!transactions.length) return null;

  const batch = transactions.slice(0, 50).map((t, i) => ({
    index: i,
    desc: t.description || '',
    amount: t.amount,
    type: t.type,
    date: t.date,
    originalCategory: t.category || '',
  }));

  const prompt = `Analiza y categoriza estas transacciones PERSONALES de ${sourceName} (${accountId}).

TRANSACCIONES:
${JSON.stringify(batch, null, 1)}

TOTAL GASTOS: $${totalExpenses}
TOTAL INGRESOS: $${totalIncome}

CATEGORÍAS PERSONALES (usa estos nombres exactos):
Vivienda, Alimentación, Restaurantes, Transporte, Gasolina,
Seguros, Salud/Médico, Entretenimiento, Suscripciones,
Ropa, Educación, Cuidado Personal, Mascotas, Viajes,
Transferencias, Pagos de Deuda, Ahorro/Inversión,
Servicios Públicos, Internet/Teléfono, Gastos Varios

También identifica si algún gasto PODRÍA ser deducible como gasto de negocio.

Responde ÚNICAMENTE con JSON:
{
  "categorized": [
    { "index": 0, "category": "...", "subcategory": "...", "es_negocio_potencial": false }
  ],
  "resumen": "Resumen ejecutivo de los gastos en 2-3 oraciones",
  "top_gastos": [
    { "categoria": "...", "total": 0, "pct": 0 }
  ],
  "alertas": [
    { "tipo": "excesivo|recurrente|deducible", "descripcion": "...", "monto": 0 }
  ],
  "posibles_deducibles": [
    { "descripcion": "...", "monto": 0, "empresa_sugerida": "..." }
  ]
}`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: SYSTEM_PROMPT + `\n\nEstás analizando gastos PERSONALES (no de empresa). 
Identifica patrones de gasto, suscripciones recurrentes, y gastos que podrían 
reclasificarse como gastos de negocio para optimizar impuestos.`,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].text.replace(/```json|```/g, '').trim();
    return JSON.parse(text);
  } catch (err) {
    console.error('Personal categorization error:', err.message);
    return null;
  }
}
