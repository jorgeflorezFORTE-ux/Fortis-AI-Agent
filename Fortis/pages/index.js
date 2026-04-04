/**
 * pages/index.js
 * Dashboard principal — JP Legacy Finance AI
 */

import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

const fmt = n =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);

const fmtShort = n => {
  const a = Math.abs(n || 0);
  if (a >= 1000000) return (n < 0 ? '-' : '') + '$' + (a / 1000000).toFixed(1) + 'M';
  if (a >= 1000) return (n < 0 ? '-' : '') + '$' + (a / 1000).toFixed(0) + 'k';
  return fmt(n);
};

// ─── Componentes pequeños ─────────────────────────────────────────────────────

function Badge({ children, type = 'info' }) {
  const styles = {
    info: { bg: '#e8f0fe', color: '#1a56db' },
    success: { bg: '#e3fcef', color: '#057a55' },
    warning: { bg: '#fff3cd', color: '#92400e' },
    danger: { bg: '#fde8e8', color: '#c81e1e' },
    gray: { bg: '#f3f4f6', color: '#6b7280' },
  };
  const s = styles[type] || styles.info;
  return (
    <span style={{ background: s.bg, color: s.color, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, ...style }}>
      {children}
    </div>
  );
}

function Spinner() {
  return (
    <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #e5e7eb', borderTopColor: '#374151', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
  );
}

function KpiCard({ label, value, sub, color = '#374151' }) {
  return (
    <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: 14 }}>
      <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600, color }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ─── Panel: Estado de conexiones ──────────────────────────────────────────────

function ConnectionPanel({ companies, onConnect }) {
  return (
    <Card>
      <h3 style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 16 }}>
        Empresas — Estado QuickBooks
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {companies.map(c => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>{c.alias}</div>
            </div>
            {c.connected && !c.tokenExpired ? (
              <Badge type="success">Conectado</Badge>
            ) : c.realmId && !c.connected ? (
              <Badge type="warning">Sin token</Badge>
            ) : (
              <Badge type="gray">No configurado</Badge>
            )}
            {c.active && (
              <button
                onClick={() => onConnect(c.id)}
                style={{ fontSize: 11, padding: '3px 8px', border: '1px solid #d1d5db', borderRadius: 6, background: '#fff', cursor: 'pointer', color: '#374151', flexShrink: 0 }}
              >
                {c.connected ? 'Reconectar' : 'Conectar'}
              </button>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Panel: Resultados del análisis ──────────────────────────────────────────

function AnalysisResult({ result, type }) {
  if (!result) return null;

  if (type === 'chat') {
    return (
      <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: 16, fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
        {result}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Resumen ejecutivo */}
      {result.resumenEjecutivo && (
        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderLeft: '3px solid #3b82f6', borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#1e40af', marginBottom: 4 }}>RESUMEN DEL ASESOR</div>
          <div style={{ fontSize: 14, color: '#1e3a5f', lineHeight: 1.6 }}>{result.resumenEjecutivo}</div>
          {result.score && <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>Score financiero: <strong>{result.score}/100</strong></div>}
        </div>
      )}

      {/* Alertas */}
      {result.transaccionesInusuales?.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Alertas</div>
          {result.transaccionesInusuales.map((t, i) => (
            <div key={i} style={{ background: '#fffbeb', border: '1px solid #fde68a', borderLeft: '3px solid #f59e0b', borderRadius: 8, padding: 12, marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{t.descripcion} — {fmt(t.monto)}</div>
              <div style={{ fontSize: 12, color: '#92400e', marginTop: 2 }}>{t.alerta}</div>
              {t.accion && <div style={{ fontSize: 12, color: '#065f46', marginTop: 4, fontWeight: 500 }}>→ {t.accion}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Categorización sugerida */}
      {result.transaccionesACategorizar?.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
            Transacciones a reclasificar ({result.transaccionesACategorizar.length})
          </div>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
            {result.transaccionesACategorizar.slice(0, 8).map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: 10, borderBottom: '1px solid #f3f4f6', fontSize: 13 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{t.descripcion}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{t.categoriaActual} → <strong style={{ color: '#059669' }}>{t.categoriaSugerida}</strong></div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 600 }}>{fmt(t.monto)}</div>
                  {t.esPersonal && <Badge type="warning">Personal</Badge>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Entradas contables */}
      {result.entradasContables?.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
            Entradas contables sugeridas
          </div>
          {result.entradasContables.map((je, i) => (
            <div key={i} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{je.fecha} — {je.descripcion}</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ color: '#9ca3af' }}>
                    <td style={{ padding: '3px 0' }}>Cuenta</td>
                    <td style={{ padding: '3px 0', textAlign: 'right' }}>Debe</td>
                    <td style={{ padding: '3px 0', textAlign: 'right' }}>Haber</td>
                  </tr>
                </thead>
                <tbody>
                  {je.lineas?.map((l, j) => (
                    <tr key={j} style={{ borderTop: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '4px 0', fontWeight: 500 }}>{l.cuenta}</td>
                      <td style={{ padding: '4px 0', textAlign: 'right', color: '#dc2626', fontFamily: 'monospace' }}>{l.debe > 0 ? fmt(l.debe) : ''}</td>
                      <td style={{ padding: '4px 0', textAlign: 'right', color: '#059669', fontFamily: 'monospace' }}>{l.haber > 0 ? fmt(l.haber) : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Recomendaciones */}
      {result.recomendaciones?.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Recomendaciones</div>
          {result.recomendaciones.map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: 13, alignItems: 'flex-start' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#e0f2fe', color: '#0369a1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
              <div style={{ color: '#374151', lineHeight: 1.5 }}>{r}</div>
            </div>
          ))}
        </div>
      )}

      {/* Acciones */}
      {result.accionesPrioritarias?.length > 0 && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#166534', marginBottom: 8 }}>ACCIONES ESTA SEMANA</div>
          {result.accionesPrioritarias.map((a, i) => (
            <div key={i} style={{ fontSize: 13, color: '#14532d', marginBottom: 4 }}>✓ {a}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Panel: Chat ──────────────────────────────────────────────────────────────

function ChatPanel({ onSend, loading }) {
  const [input, setInput] = useState('');
  const suggestions = [
    '¿En qué empresa estamos perdiendo más dinero?',
    '¿Cuánto puedo retirarme este mes sin afectar el flujo?',
    '¿Qué gastos son deducibles de impuestos?',
    '¿Están bien registradas las transferencias entre empresas?',
    'Genera el cierre mensual completo',
    'Dame el reporte semanal',
  ];

  return (
    <Card>
      <h3 style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>
        Pregunta al asesor
      </h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {suggestions.map(s => (
          <button
            key={s}
            onClick={() => setInput(s)}
            style={{ fontSize: 12, padding: '4px 10px', border: '1px solid #e5e7eb', borderRadius: 16, background: '#f9fafb', cursor: 'pointer', color: '#374151' }}
          >
            {s}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !loading && input.trim() && (onSend(input), setInput(''))}
          placeholder="Pregunta lo que necesites sobre tus finanzas..."
          style={{ flex: 1, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
        />
        <button
          onClick={() => { if (input.trim() && !loading) { onSend(input); setInput(''); } }}
          disabled={loading || !input.trim()}
          style={{ padding: '8px 16px', background: loading ? '#9ca3af' : '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 500 }}
        >
          {loading ? <Spinner /> : 'Enviar'}
        </button>
      </div>
    </Card>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Home() {
  const [view, setView] = useState('dashboard');
  const [companies, setCompanies] = useState([]);
  const [syncData, setSyncData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [analysisType, setAnalysisType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => format(subMonths(new Date(), 1), 'yyyy-MM'));
  const [csvContent, setCsvContent] = useState('');
  const [csvSource, setCsvSource] = useState('Chase');
  const [csvPerson, setCsvPerson] = useState('Jorge');
  const [notification, setNotification] = useState(null);

  // ── Cargar estado de conexiones ──────────────────────────────────────────────
  const loadStatus = useCallback(async () => {
    try {
      const r = await fetch('/api/qb/status');
      const data = await r.json();
      setCompanies(data.companies || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadStatus();
    // Verificar si hay redirect de QB OAuth
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected')) {
      setNotification({ type: 'success', msg: `✅ ${params.get('connected')} conectado a QuickBooks` });
      window.history.replaceState({}, '', '/');
      loadStatus();
    }
    if (params.get('error')) {
      setNotification({ type: 'error', msg: `❌ Error: ${params.get('error')} — ${params.get('msg') || ''}` });
      window.history.replaceState({}, '', '/');
    }
  }, [loadStatus]);

  // ── Sincronizar QB ───────────────────────────────────────────────────────────
  const syncAll = async () => {
    setSyncing(true);
    try {
      const [year, month] = selectedMonth.split('-');
      const startDate = format(startOfMonth(new Date(parseInt(year), parseInt(month) - 1)), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(new Date(parseInt(year), parseInt(month) - 1)), 'yyyy-MM-dd');

      const r = await fetch('/api/qb/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: 'all', startDate, endDate }),
      });
      const data = await r.json();
      setSyncData(data);
      setNotification({ type: 'success', msg: `✅ Sincronizado: ${data.summary?.totalTransactions} transacciones` });
    } catch (e) {
      setNotification({ type: 'error', msg: `❌ Error al sincronizar: ${e.message}` });
    }
    setSyncing(false);
  };

  // ── Analizar ──────────────────────────────────────────────────────────────────
  const runAnalysis = async (type, extra = {}) => {
    setLoading(true);
    setAnalysis(null);
    setAnalysisType(type);

    try {
      let body = { type, ...extra };

      if (type === 'weekly' || type === 'monthly') {
        const companiesData = (syncData?.companies || []).map(c => ({
          name: c.companyName,
          income: c.pl?.income || 0,
          expenses: c.pl?.expenses || 0,
          net: c.pl?.net || 0,
          transactionCount: c.transactionCount || 0,
          alerts: [],
        }));
        body = { ...body, companiesData, month: selectedMonth };
      }

      const r = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (data.success) setAnalysis(data.result);
      else setNotification({ type: 'error', msg: data.error });
    } catch (e) {
      setNotification({ type: 'error', msg: e.message });
    }
    setLoading(false);
  };

  const handleChat = msg => runAnalysis('chat', { messages: [{ role: 'user', content: msg }], financialContext: syncData?.summary });

  const handleCSV = async () => {
    if (!csvContent.trim()) return;
    runAnalysis('csv', { csvContent, source: csvSource, person: csvPerson, month: selectedMonth });
  };

  // ── KPIs de resumen ──────────────────────────────────────────────────────────
  const totalIncome = syncData?.summary?.totalIncome || 0;
  const totalExpenses = syncData?.summary?.totalExpenses || 0;
  const totalNet = syncData?.summary?.totalNet || 0;
  const connectedCount = companies.filter(c => c.connected).length;

  const [selMonth, selYear] = selectedMonth.split('-');
  const monthLabel = format(new Date(parseInt(selYear), parseInt(selMonth) - 1, 1), 'MMMM yyyy', { locale: es });

  return (
    <>
      <Head>
        <title>Fortis — Asesor Financiero AI</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f3f4f6; color: #111827; }
          @keyframes spin { to { transform: rotate(360deg); } }
          input, select, textarea, button { font-family: inherit; }
          ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
        `}</style>
      </Head>

      {/* Header */}
      <div style={{ background: '#111827', color: '#fff', padding: '0 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', height: 56, gap: 24, flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>Fortis</span>
            <span style={{ color: '#9ca3af', fontSize: 13, marginLeft: 8 }}>Asesor Financiero AI</span>
          </div>
          <div style={{ display: 'flex', gap: 2, flex: 1, flexWrap: 'wrap' }}>
            {['dashboard', 'empresas', 'personal', 'reportes', 'asesor'].map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{ padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, background: view === v ? '#374151' : 'transparent', color: view === v ? '#fff' : '#9ca3af', textTransform: 'capitalize' }}
              >
                {v}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #374151', background: '#1f2937', color: '#fff', fontSize: 13, cursor: 'pointer' }}
            >
              {Array.from({ length: 12 }).map((_, i) => {
                const d = subMonths(new Date(), i);
                const val = format(d, 'yyyy-MM');
                const label = format(d, 'MMM yyyy', { locale: es });
                return <option key={val} value={val}>{label}</option>;
              })}
            </select>
            <button
              onClick={syncAll}
              disabled={syncing}
              style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: syncing ? '#374151' : '#1d4ed8', color: '#fff', cursor: syncing ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {syncing ? <><Spinner /> Sincronizando…</> : '⟳ Sincronizar QB'}
            </button>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div style={{ background: notification.type === 'success' ? '#d1fae5' : '#fee2e2', padding: '10px 24px', borderBottom: '1px solid', borderColor: notification.type === 'success' ? '#6ee7b7' : '#fca5a5', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {notification.msg}
          <button onClick={() => setNotification(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* Main content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>

        {/* ── Dashboard ─────────────────────────────────────────────────── */}
        {view === 'dashboard' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700 }}>Dashboard — <span style={{ textTransform: 'capitalize', color: '#6b7280' }}>{monthLabel}</span></h1>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={() => runAnalysis('weekly')} disabled={loading} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 13 }}>
                  {loading && analysisType === 'weekly' ? <Spinner /> : '📊 Reporte semanal'}
                </button>
                <button onClick={() => runAnalysis('monthly')} disabled={loading} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #1d4ed8', background: '#1d4ed8', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                  {loading && analysisType === 'monthly' ? <Spinner /> : '📋 Cierre mensual'}
                </button>
              </div>
            </div>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
              <KpiCard label="Ingresos" value={fmtShort(totalIncome)} color="#059669" />
              <KpiCard label="Gastos" value={fmtShort(totalExpenses)} color="#dc2626" />
              <KpiCard label="Neto" value={fmtShort(totalNet)} color={totalNet >= 0 ? '#059669' : '#dc2626'} />
              <KpiCard label="Empresas" value={`${connectedCount}/${companies.filter(c => c.active).length}`} sub="conectadas a QB" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Empresas */}
              <div>
                <ConnectionPanel companies={companies} onConnect={id => window.open(`/api/qb/connect?company=${id}`, '_blank')} />
              </div>
              {/* P&L por empresa */}
              <Card>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 16 }}>
                  P&L por empresa — {monthLabel}
                </h3>
                {syncData?.companies?.length > 0 ? (
                  syncData.companies.map(c => {
                    const co = companies.find(x => x.id === c.companyId);
                    const maxVal = Math.max(...syncData.companies.map(x => Math.max(x.pl?.income || 0, x.pl?.expenses || 0)), 1);
                    return (
                      <div key={c.companyId} style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: co?.color || '#6b7280' }} />
                            <span style={{ fontWeight: 500 }}>{c.companyName?.replace(' LLC', '').replace(' PA', '')}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 12 }}>
                            <span style={{ color: '#059669' }}>{fmt(c.pl?.income || 0)}</span>
                            <span style={{ color: '#dc2626' }}>{fmt(c.pl?.expenses || 0)}</span>
                          </div>
                        </div>
                        <div style={{ height: 4, background: '#f3f4f6', borderRadius: 2, overflow: 'hidden', display: 'flex' }}>
                          <div style={{ width: `${((c.pl?.income || 0) / maxVal) * 100}%`, background: '#059669', borderRadius: 2 }} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: 'center', padding: 24, color: '#9ca3af', fontSize: 13 }}>
                    Haz clic en "Sincronizar QB" para cargar datos
                  </div>
                )}
              </Card>
            </div>

            {/* Resultado del análisis */}
            {(loading && (analysisType === 'weekly' || analysisType === 'monthly')) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 20, color: '#6b7280', fontSize: 14 }}>
                <Spinner /> Claude está analizando tus finanzas…
              </div>
            )}
            {analysis && (analysisType === 'weekly' || analysisType === 'monthly') && (
              <div style={{ marginTop: 20 }}>
                <Card><AnalysisResult result={analysis} type={analysisType} /></Card>
              </div>
            )}
          </div>
        )}

        {/* ── Empresas ──────────────────────────────────────────────────── */}
        {view === 'empresas' && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Análisis por empresa</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
              {companies.filter(c => c.active).map(c => {
                const syncResult = syncData?.companies?.find(s => s.companyId === c.id);
                return (
                  <Card key={c.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>{c.alias}</div>
                      </div>
                      {c.connected ? <Badge type="success">QB ✓</Badge> : <Badge type="gray">Sin conectar</Badge>}
                    </div>
                    {syncResult ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                        <div style={{ background: '#f0fdf4', padding: 8, borderRadius: 8, textAlign: 'center' }}>
                          <div style={{ fontSize: 10, color: '#9ca3af' }}>INGRESOS</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#059669' }}>{fmtShort(syncResult.pl?.income)}</div>
                        </div>
                        <div style={{ background: '#fef2f2', padding: 8, borderRadius: 8, textAlign: 'center' }}>
                          <div style={{ fontSize: 10, color: '#9ca3af' }}>GASTOS</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#dc2626' }}>{fmtShort(syncResult.pl?.expenses)}</div>
                        </div>
                        <div style={{ background: '#f0f9ff', padding: 8, borderRadius: 8, textAlign: 'center' }}>
                          <div style={{ fontSize: 10, color: '#9ca3af' }}>NETO</div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: (syncResult.pl?.net || 0) >= 0 ? '#059669' : '#dc2626' }}>{fmtShort(syncResult.pl?.net)}</div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12, textAlign: 'center', padding: 8 }}>Sin datos — sincroniza QB</div>
                    )}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => window.open(`/api/qb/connect?company=${c.id}`, '_blank')}
                        style={{ flex: 1, padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 7, background: '#fff', cursor: 'pointer', fontSize: 12 }}
                      >
                        {c.connected ? '🔄 Reconectar' : '🔗 Conectar QB'}
                      </button>
                      {syncResult && (
                        <button
                          onClick={() => { setAnalysisType('company'); runAnalysis('company', { company: c.name, transactions: syncResult.transactions, period: selectedMonth, plData: syncResult.pl }); setView('dashboard'); }}
                          disabled={loading}
                          style={{ flex: 1, padding: '7px 10px', border: '1px solid #1d4ed8', borderRadius: 7, background: '#eff6ff', color: '#1d4ed8', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}
                        >
                          {loading ? <Spinner /> : '🤖 Analizar con AI'}
                        </button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Personal ──────────────────────────────────────────────────── */}
        {view === 'personal' && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Gastos personales — Jorge & Paola</h1>
            <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>Sube el estado de cuenta de tus tarjetas/banco para que Claude analice en qué se va el dinero personal y qué puede ser gasto de negocio.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <Card>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14 }}>Cómo exportar de tu banco</h3>
                {[
                  { bank: 'Chase', steps: 'Account → Download Account Activity → CSV, últimos 30 días' },
                  { bank: 'American Express', steps: 'Account Services → Download Statement → CSV' },
                  { bank: 'Bank of America', steps: 'Accounts → Download → Date Range → CSV' },
                  { bank: 'Wells Fargo', steps: 'Accounts → Download Account Activity → CSV' },
                  { bank: 'Capital One', steps: 'Account → Download Transactions → CSV' },
                ].map(b => (
                  <div key={b.bank} style={{ padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: 13 }}>
                    <span style={{ fontWeight: 600 }}>{b.bank}: </span>
                    <span style={{ color: '#6b7280' }}>{b.steps}</span>
                  </div>
                ))}
              </Card>

              <Card>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14 }}>Subir datos</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 4 }}>PERSONA</label>
                    <select value={csvPerson} onChange={e => setCsvPerson(e.target.value)} style={{ width: '100%', padding: '7px 8px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: 13 }}>
                      <option>Jorge</option>
                      <option>Paola</option>
                      <option>Ambos</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 4 }}>BANCO / TARJETA</label>
                    <select value={csvSource} onChange={e => setCsvSource(e.target.value)} style={{ width: '100%', padding: '7px 8px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: 13 }}>
                      {['Chase', 'Amex', 'Bank of America', 'Wells Fargo', 'Capital One', 'Citibank', 'Otro'].map(b => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                </div>
                <textarea
                  value={csvContent}
                  onChange={e => setCsvContent(e.target.value)}
                  placeholder={'Pega aquí el contenido CSV o los datos del estado de cuenta...\n\nEjemplo:\nDate,Description,Amount\n01/15/2025,AMAZON PRIME,-14.99\n01/16/2025,PUBLIX,-189.50\n...'}
                  style={{ width: '100%', minHeight: 160, padding: 10, border: '1px solid #d1d5db', borderRadius: 8, fontSize: 13, fontFamily: 'monospace', resize: 'vertical' }}
                />
                <button
                  onClick={handleCSV}
                  disabled={loading || !csvContent.trim()}
                  style={{ marginTop: 10, width: '100%', padding: '10px', background: csvContent.trim() ? '#1d4ed8' : '#9ca3af', color: '#fff', border: 'none', borderRadius: 8, cursor: csvContent.trim() ? 'pointer' : 'not-allowed', fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  {loading && analysisType === 'csv' ? <><Spinner /> Analizando con Claude…</> : '🤖 Analizar con AI'}
                </button>
              </Card>
            </div>

            {loading && analysisType === 'csv' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 20, color: '#6b7280', fontSize: 14 }}>
                <Spinner /> Claude está analizando los movimientos de {csvPerson}…
              </div>
            )}
            {analysis && analysisType === 'csv' && (
              <Card><AnalysisResult result={analysis} type="csv" /></Card>
            )}
          </div>
        )}

        {/* ── Reportes ──────────────────────────────────────────────────── */}
        {view === 'reportes' && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Reportes automáticos</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {[
                { id: 'weekly', icon: '📊', title: 'Reporte semanal', desc: 'Resumen de transacciones, alertas y checklist de la semana. Reemplaza el trabajo del bookkeeper.' },
                { id: 'monthly', icon: '📋', title: 'Cierre mensual', desc: 'P&L completo, entradas de ajuste, checklist de cierre y documentos necesarios para el contador.' },
                { id: 'tax', icon: '🧾', title: 'Revisión fiscal', desc: 'Lista de gastos deducibles, gastos personales vs negocio y recordatorios de obligaciones fiscales.' },
              ].map(r => (
                <Card key={r.id} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ fontSize: 28 }}>{r.icon}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{r.title}</div>
                    <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>{r.desc}</div>
                  </div>
                  <button
                    onClick={() => runAnalysis(r.id === 'tax' ? 'monthly' : r.id)}
                    disabled={loading}
                    style={{ padding: '9px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 500, marginTop: 'auto' }}
                  >
                    {loading && analysisType === r.id ? <Spinner /> : 'Generar con Claude'}
                  </button>
                </Card>
              ))}
            </div>
            {loading && <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: 24, color: '#6b7280', fontSize: 14 }}><Spinner /> Generando reporte…</div>}
            {analysis && <div style={{ marginTop: 20 }}><Card><AnalysisResult result={analysis} type={analysisType} /></Card></div>}
          </div>
        )}

        {/* ── Asesor ────────────────────────────────────────────────────── */}
        {view === 'asesor' && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Asesor financiero AI</h1>
            <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 20 }}>Tu CFO y bookkeeper personal. Pregunta lo que necesites sobre tus finanzas.</p>
            <ChatPanel onSend={handleChat} loading={loading && analysisType === 'chat'} />
            {loading && analysisType === 'chat' && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: 20, color: '#6b7280', fontSize: 14 }}>
                <Spinner /> Claude está pensando…
              </div>
            )}
            {analysis && analysisType === 'chat' && (
              <div style={{ marginTop: 16 }}>
                <Card><AnalysisResult result={analysis} type="chat" /></Card>
              </div>
            )}
          </div>
        )}

      </div>
    </>
  );
}
