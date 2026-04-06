const Anthropic = require('@anthropic-ai/sdk');
const client = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYS = `Eres el asesor financiero y contable AI de Jorge Florez y Paola Diaz en Florida.
Portfolio: Real Legacy LLC (Real Estate), JP Legacy Media (Referidos), Paola Diaz PA (Comisiones→Real Legacy),
VAU Nutrition (E-commerce suplementos), Reborn Houses (CDs/Inversiones), Jorge Florez LLC (Inactiva).
Florida no tiene state income tax. Optimizar taxes federales es prioridad.
Siempre en español. Sé específico con cifras. Da acciones concretas.`;

async function analyzeExpenses({categories,transactions,totalIncome,totalExpenses,period}){
  const prompt=`Analiza gastos ${period}:
Ingresos: $${totalIncome}, Gastos: $${totalExpenses}, Neto: $${totalIncome-totalExpenses}
Categorías: ${categories.map(c=>c.name+': $'+c.amount+' ('+c.pct+'%)').join(', ')}
Top transacciones: ${transactions.slice(0,15).map(t=>t.date+' '+t.description+' $'+t.amount).join('; ')}

JSON only:
{"diagnostico":"...","estado":"critico|alerta|estable|bueno","insights":[{"tipo":"critical|warning|info|success","titulo":"...","descripcion":"...","accion":"...","ahorro_estimado":0}],
"recortes_prioritarios":[{"categoria":"...","monto_actual":0,"ahorro":0,"como_recortar":"...","impacto":"alto|medio|bajo"}],
"proyeccion":{"neto_actual":0,"ahorro_total_posible":0,"neto_proyectado":0,"mejora_anual":0}}`;
  const r=await client.messages.create({model:'claude-sonnet-4-20250514',max_tokens:2000,system:SYS,messages:[{role:'user',content:prompt}]});
  return JSON.parse(r.content[0].text.replace(/```json|```/g,'').trim());
}

async function chatWithAdvisor({message,context}){
  const ctx=context?'\nCONTEXTO:\n'+JSON.stringify(context,null,2)+'\n':'';
  const r=await client.messages.create({model:'claude-sonnet-4-20250514',max_tokens:1500,system:SYS+'\nConversacional pero profesional.',messages:[{role:'user',content:ctx+message}]});
  return r.content[0].text;
}

async function analyzeReconciliation({reconData,rules}){
  const prompt=`Analiza reconciliación contable:
${rules?'Reglas: '+rules.activity+'. '+rules.rules?.join('; '):''}
Datos: ${JSON.stringify(reconData).slice(0,5000)}
JSON only:
{"calificacion":"limpio|revision|critico","resumen":"...","ajustes_requeridos":[{"prioridad":"alta|media|baja","tipo":"reclasificar|duplicado|faltante|transferencia","descripcion":"...","monto":0,"de_empresa":"...","a_empresa":"..."}],
"alertas":[{"severidad":"alta|media|info","mensaje":"..."}],"metricas":{"transacciones_correctas_pct":0,"gastos_mal_clasificados":0,"monto_mal_clasificado":0}}`;
  const r=await client.messages.create({model:'claude-sonnet-4-20250514',max_tokens:2000,system:SYS+'\nEres contador público. GAAP. Débitos y créditos específicos.',messages:[{role:'user',content:prompt}]});
  return JSON.parse(r.content[0].text.replace(/```json|```/g,'').trim());
}

async function generateScorecard({bizData,personalData,reconData,freedomData,period}){
  const prompt=`Genera scorecard mensual ${period}:
Empresas: ${JSON.stringify(bizData).slice(0,1500)}
Personal: ${JSON.stringify(personalData).slice(0,800)}
Contable: ${JSON.stringify(reconData).slice(0,800)}
Libertad: ${JSON.stringify(freedomData).slice(0,500)}
JSON only:
{"biz_grade":"A|B|C|D|F","personal_grade":"A|B|C|D|F","accounting_grade":"A|B|C|D|F","freedom_grade":"A|B|C|D|F",
"overall_grade":"A+|A|B+|B|C|D|F","summary":"2-3 oraciones","highlights":["..."],"action_items":["..."]}`;
  const r=await client.messages.create({model:'claude-sonnet-4-20250514',max_tokens:1500,system:SYS,messages:[{role:'user',content:prompt}]});
  return JSON.parse(r.content[0].text.replace(/```json|```/g,'').trim());
}

module.exports={analyzeExpenses,chatWithAdvisor,analyzeReconciliation,generateScorecard};
