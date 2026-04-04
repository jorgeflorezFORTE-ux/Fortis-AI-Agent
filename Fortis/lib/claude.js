/**
 * lib/claude.js
 * Toda la lógica de análisis financiero con Claude AI
 */

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Eres el asesor financiero, contador y bookkeeper de JP Legacy Group — un portfolio de empresas de real estate, marketing y nutrition en Florida, USA, propiedad de Jorge Florez y Paola Diaz.

EMPRESAS DEL PORTFOLIO:
- Real Legacy LLC (también conocida como JP Legacy Group): Real Estate principal, EIN 88-3202623
- JP Legacy Media and Consulting LLC: Ingresos por referidos de contratistas y property managers, marketing
- VAU Nutrition LLC: Empresa de nutrición (en etapa de inicio)
- Paola Alexandra Diaz Lozada PA: Recibe comisiones y las transfiere a Real Legacy LLC, EIN 92-2296944
- Reborn Houses LLC: Lote comercial
- JP Legacy Homes LLC: Homes
- Jorge Manuel Florez Gutierrez LLC: Entidad personal de Jorge

CONTEXTO CLAVE:
- Todas las empresas están registradas en Florida
- El dueño principal es Jorge Manuel Florez Gutierrez
- Paola Alexandra Diaz Lozada es su esposa/socia
- El negocio principal es real estate (compra, venta, referidos)
- JP Legacy Media recibe pagos por referidos de contratistas y property managers
- Hay gastos personales mezclados con gastos de negocio que hay que separar
- Se quiere eliminar al bookkeeper ($200/mes) usando este sistema

TUS RESPONSABILIDADES:
1. Categorizar transacciones según GAAP y las mejores prácticas contables
2. Separar gastos personales vs gastos de negocio (muy importante para taxes)
3. Crear entradas de diario (journal entries) para ajustes contables
4. Identificar gastos deducibles de impuestos en Florida/Federal
5. Detectar transacciones inusuales, duplicadas o posibles errores
6. Generar reportes ejecutivos semanales y mensuales
7. Dar recomendaciones para optimizar la estructura financiera
8. Verificar que las transferencias entre empresas estén correctamente registradas

CATEGORÍAS CONTABLES PRINCIPALES (usa estos nombres exactos):
Ingresos: Comisiones de Real Estate, Ingresos por Referidos, Rentas, Ventas de Propiedad, Ingresos por Consultoría
Gastos: Nómina y Beneficios, Marketing y Publicidad, Servicios Profesionales, Renta de Oficina, Tecnología y Software, Seguros, Impuestos y Licencias, Viajes y Transporte, Alimentación (negocio), Entretenimiento de Clientes, Servicios Públicos, Materiales y Suministros, Gastos Bancarios

Siempre responde en español. Sé específico, accionable y usa terminología contable correcta.`;

// ─── Análisis de transacciones de empresa ────────────────────────────────────

export async function analyzeCompanyTransactions({ company, transactions, period, plData }) {
  const txSummary = transactions.slice(0, 100).map(t => ({
    fecha: t.TxnDate,
    monto: t.TotalAmt,
    descripcion: t.PrivateNote || t.Memo || '',
    proveedor: t.EntityRef?.name || t.VendorRef?.name || 'Sin proveedor',
    cuenta: t.AccountRef?.name || 'Sin categoría',
    tipo: t.PaymentType || t.TransactionType || 'Gasto',
  }));

  const prompt = `Analiza las transacciones de ${company} para ${period}.

P&L RESUMEN:
Ingresos: $${plData?.income || 0}
Gastos: $${plData?.expenses || 0}
Neto: $${plData?.net || 0}

TRANSACCIONES (${transactions.length} total, mostrando primeras 100):
${JSON.stringify(txSummary, null, 2)}

Responde ÚNICAMENTE con JSON válido, sin texto adicional, con esta estructura:
{
  "resumenEjecutivo": "2-3 oraciones sobre el estado financiero",
  "score": 75,
  "transaccionesACategorizar": [
    {"descripcion": "...", "monto": 0, "categoriaActual": "...", "categoriaSugerida": "...", "esPersonal": false, "razon": "..."}
  ],
  "gastosDeducibles": [
    {"descripcion": "...", "monto": 0, "categoria": "...", "deduccion": "100%|50%|parcial"}
  ],
  "transaccionesInusuales": [
    {"descripcion": "...", "monto": 0, "alerta": "...", "accion": "..."}
  ],
  "entradasContables": [
    {
      "fecha": "YYYY-MM-DD",
      "descripcion": "...",
      "lineas": [
        {"cuenta": "...", "debe": 0, "haber": 0}
      ]
    }
  ],
  "gastoPersonalDetectado": [
    {"descripcion": "...", "monto": 0, "recomendacion": "..."}
  ],
  "recomendaciones": ["...", "..."],
  "accionesPrioritarias": ["...", "..."]
}`;

  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 3000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].text.replace(/```json|```/g, '').trim();
  return JSON.parse(text);
}

// ─── Reporte semanal ──────────────────────────────────────────────────────────

export async function generateWeeklyReport(companiesData) {
  const summary = companiesData.map(c => ({
    empresa: c.name,
    ingresos: c.income,
    gastos: c.expenses,
    neto: c.net,
    txCount: c.transactionCount,
    alertas: c.alerts,
  }));

  const prompt = `Genera el reporte semanal de JP Legacy Group.

DATOS DE LA SEMANA:
${JSON.stringify(summary, null, 2)}

Responde ÚNICAMENTE con JSON:
{
  "semana": "dd/mm/yyyy - dd/mm/yyyy",
  "tituloReporte": "...",
  "resumenGeneral": "...",
  "kpis": {
    "ingresosTotal": 0,
    "gastosTotal": 0,
    "netoTotal": 0,
    "empresaMejorDesempeno": "...",
    "empresaNecesitaAtencion": "..."
  },
  "logros": ["...", "..."],
  "alertas": [
    {"empresa": "...", "tipo": "critico|advertencia|info", "mensaje": "..."}
  ],
  "checklistSemana": [
    {"tarea": "...", "empresa": "...", "prioridad": "alta|media|baja"}
  ],
  "proyeccionMes": {
    "ingresosEstimados": 0,
    "gastosEstimados": 0,
    "netoEstimado": 0
  },
  "paraContador": ["notas importantes para el contador/bookkeeper"],
  "preguntasParaJorge": ["preguntas que necesitan respuesta esta semana"]
}`;

  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].text.replace(/```json|```/g, '').trim();
  return JSON.parse(text);
}

// ─── Cierre mensual ───────────────────────────────────────────────────────────

export async function generateMonthlyClose(companiesData, month) {
  const prompt = `Realiza el cierre contable mensual de ${month} para JP Legacy Group.

DATOS DEL MES:
${JSON.stringify(companiesData, null, 2)}

Responde ÚNICAMENTE con JSON:
{
  "mes": "...",
  "estadoContable": "limpio|requiere_ajustes|critico",
  "resumenEjecutivo": "...",
  "pl": {
    "ingresosTotal": 0,
    "gastosTotal": 0,
    "netTotal": 0,
    "margenNeto": 0
  },
  "porEmpresa": [
    {
      "nombre": "...",
      "ingresos": 0,
      "gastos": 0,
      "neto": 0,
      "estado": "...",
      "notasContables": "..."
    }
  ],
  "ajustesNecesarios": [
    {
      "tipo": "depreciación|accrual|prepago|corrección",
      "descripcion": "...",
      "entrada": {
        "fecha": "...",
        "lineas": [{"cuenta": "...", "debe": 0, "haber": 0}]
      }
    }
  ],
  "documentosNecesarios": ["documentos que se necesitan para cerrar el mes"],
  "tributario": {
    "estimadoImpuestos": 0,
    "gastosDeducibles": 0,
    "recordatorios": ["fechas y obligaciones fiscales"]
  },
  "checklistCierre": [
    {"item": "...", "completado": false, "responsable": "Jorge|Paola|Contador"}
  ],
  "comparacionMesAnterior": {
    "variacionIngresos": 0,
    "variacionGastos": 0,
    "tendencia": "mejorando|estable|deteriorando",
    "comentario": "..."
  }
}`;

  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 3000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].text.replace(/```json|```/g, '').trim();
  return JSON.parse(text);
}

// ─── Gastos personales ────────────────────────────────────────────────────────

export async function analyzePersonalExpenses({ person, transactions, month }) {
  const prompt = `Analiza los gastos personales de ${person} para ${month}.

TRANSACCIONES:
${JSON.stringify(transactions.slice(0, 150), null, 2)}

Responde ÚNICAMENTE con JSON:
{
  "resumen": "...",
  "totalGastos": 0,
  "porCategoria": [
    {"categoria": "...", "monto": 0, "porcentaje": 0, "transacciones": 0}
  ],
  "gastosMayores": [
    {"descripcion": "...", "monto": 0, "fecha": "...", "esDeducible": false}
  ],
  "posiblementeNegocio": [
    {"descripcion": "...", "monto": 0, "empresa": "...", "recomendacion": "..."}
  ],
  "patrones": ["patrones detectados en los gastos"],
  "recomendaciones": [
    {"titulo": "...", "ahorroPotencial": 0, "descripcion": "..."}
  ],
  "presupuestoSugerido": [
    {"categoria": "...", "actualPromedio": 0, "sugerido": 0}
  ]
}`;

  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].text.replace(/```json|```/g, '').trim();
  return JSON.parse(text);
}

// ─── Chat con el asesor ───────────────────────────────────────────────────────

export async function chatWithAdvisor(messages, financialContext) {
  const contextMsg = financialContext
    ? `CONTEXTO FINANCIERO ACTUAL:\n${JSON.stringify(financialContext, null, 2)}\n\n`
    : '';

  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1500,
    system: SYSTEM_PROMPT + '\n\nResponde de forma conversacional pero profesional. Sé directo y accionable.',
    messages: [
      {
        role: 'user',
        content: contextMsg + messages[messages.length - 1].content,
      },
    ],
  });

  return response.content[0].text;
}

// ─── Análisis de CSV bancario ─────────────────────────────────────────────────

export async function analyzeBankCSV({ csvContent, source, person, month }) {
  const prompt = `Analiza este estado de cuenta bancario/tarjeta de ${source} de ${person} para ${month}.

CONTENIDO CSV:
${csvContent.slice(0, 4000)}

Responde ÚNICAMENTE con JSON:
{
  "fuente": "${source}",
  "persona": "${person}",
  "periodo": "${month}",
  "totalCargos": 0,
  "totalAbonos": 0,
  "transaccionesDetectadas": 0,
  "categorias": [
    {"nombre": "...", "monto": 0, "count": 0}
  ],
  "posiblementeNegocio": [
    {"descripcion": "...", "monto": 0, "empresa": "...", "deducible": true}
  ],
  "gastosRecurrentes": [
    {"descripcion": "...", "monto": 0, "frecuencia": "mensual|anual"}
  ],
  "alertas": [
    {"tipo": "inusual|duplicado|excesivo", "descripcion": "...", "monto": 0}
  ],
  "resumen": "...",
  "recomendaciones": ["..."]
}`;

  const response = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].text.replace(/```json|```/g, '').trim();
  return JSON.parse(text);
}
