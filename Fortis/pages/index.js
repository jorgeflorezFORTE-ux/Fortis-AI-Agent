import { useState, useEffect, useCallback, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

const C = {
  bg: '#0B0F14', surface: '#121820', surfaceHover: '#1A2230', border: '#1E2A3A',
  accent: '#C8A46E', accentDim: 'rgba(200,164,110,0.12)',
  green: '#34D399', greenDim: 'rgba(52,211,153,0.12)',
  red: '#F87171', redDim: 'rgba(248,113,113,0.12)',
  amber: '#FBBF24', amberDim: 'rgba(251,191,36,0.12)',
  blue: '#60A5FA', blueDim: 'rgba(96,165,250,0.12)',
  purple: '#A78BFA', purpleDim: 'rgba(167,139,250,0.12)',
  teal: '#2DD4BF', pink: '#EC4899',
  text: '#E8ECF1', muted: '#7A8BA3', dim: '#4A5568',
};

const COMPANIES = [
  { id: 'all', name: 'Consolidado', icon: '◆', color: C.accent },
  { id: 'real-legacy', name: 'Real Legacy LLC', sub: 'Real Estate', icon: 'R', color: '#C8A46E' },
  { id: 'jp-media', name: 'JP Legacy Media', sub: 'Marketing · Referidos', icon: 'J', color: '#60A5FA' },
  { id: 'paola-pa', name: 'Paola Diaz PA', sub: 'Comisiones', icon: 'P', color: '#A78BFA' },
  { id: 'vau-nutrition', name: 'VAU Nutrition', sub: 'Nutrition', icon: 'V', color: '#2DD4BF' },
  { id: 'reborn', name: 'Reborn Houses', sub: 'Lote Comercial', icon: 'H', color: '#F472B6' },
  { id: 'jorge-llc', name: 'Jorge Florez LLC', sub: 'Personal', icon: 'G', color: '#7A8BA3' },
];

const PERSONAL = [
  { id: 'personal-jorge', name: 'Jorge — Personal', sub: 'Tarjetas · Bancos', icon: 'J', color: '#F59E0B' },
  { id: 'personal-paola', name: 'Paola — Personal', sub: 'Tarjetas · Bancos', icon: 'P', color: '#EC4899' },
  { id: 'personal-hogar', name: 'Gastos del Hogar', sub: 'Compartidos', icon: 'H', color: '#8B5CF6' },
];

const CAT_COLORS = [C.red, C.amber, C.blue, C.purple, C.teal, '#F472B6', C.green, C.muted, '#F59E0B', '#EC4899'];
const isPers = (id) => id?.startsWith('personal-');
const fmt = (n) => (n < 0 ? '-' : '') + '$' + Math.abs(Math.round(n)).toLocaleString('en-US');
const fmtDec = (n) => (n < 0 ? '-' : '') + '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
async function api(path, opts = {}) { const res = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...opts, body: opts.body ? JSON.stringify(opts.body) : undefined }); return res.json(); }

function MetricCard({ label, value, sub, color, delay = 0 }) {
  return (<div className="fade-up" style={{ background: C.surface, borderRadius: 12, padding: '18px 20px', border: '0.5px solid '+C.border, animationDelay: delay+'ms' }}><div style={{ fontSize: 12, color: C.muted, marginBottom: 6, letterSpacing: '0.03em', textTransform: 'uppercase' }}>{label}</div><div style={{ fontSize: 26, fontWeight: 600, color: color || C.text, fontFeatureSettings: "'tnum'" }}>{value}</div>{sub && <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{sub}</div>}</div>);
}
function SyncBadge({ connected, syncing, onClick, label }) {
  return (<div onClick={onClick} style={{ display:'flex',alignItems:'center',gap:8,padding:'6px 12px',borderRadius:8,background:syncing?C.amberDim:connected?C.greenDim:C.redDim,fontSize:12,fontWeight:500,cursor:'pointer',color:syncing?C.amber:connected?C.green:C.red }}><span style={{ width:6,height:6,borderRadius:'50%',background:syncing?C.amber:connected?C.green:C.red,animation:syncing?'pulse 1.2s infinite':'none' }} />{syncing?'Sincronizando...':label||(connected?'QB Conectado':'Conectar QB')}</div>);
}
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (<div style={{ background:C.surface,border:'0.5px solid '+C.border,borderRadius:8,padding:'10px 14px',fontSize:12 }}><div style={{ color:C.muted,marginBottom:6,fontWeight:500 }}>{label}</div>{payload.map((p,i)=>(<div key={i} style={{ display:'flex',alignItems:'center',gap:6,marginBottom:2 }}><span style={{ width:8,height:8,borderRadius:2,background:p.color }} /><span style={{ color:C.muted }}>{p.name}:</span><span style={{ fontWeight:600 }}>{fmt(p.value)}</span></div>))}</div>);
}
function CategoryRow({ cat, index, isOpen, onToggle }) {
  return (<div style={{ marginBottom: isOpen?0:4 }}><div onClick={onToggle} style={{ display:'flex',alignItems:'center',gap:10,padding:'12px 14px',borderRadius:isOpen?'10px 10px 0 0':'10px',background:isOpen?C.surfaceHover:C.surface,border:'0.5px solid '+(isOpen?C.border:'transparent'),cursor:'pointer' }}><span style={{ fontSize:10,color:C.muted,transform:isOpen?'rotate(90deg)':'none',width:14,textAlign:'center',transition:'transform 0.2s' }}>&#9654;</span><span style={{ width:8,height:8,borderRadius:2,background:CAT_COLORS[index%CAT_COLORS.length],flexShrink:0 }} /><span style={{ flex:1,fontSize:13 }}>{cat.name}</span><div style={{ width:80,height:4,borderRadius:2,background:C.border,overflow:'hidden' }}><div style={{ height:'100%',width:Math.min(cat.pct,100)+'%',background:CAT_COLORS[index%CAT_COLORS.length],borderRadius:2 }} /></div><span style={{ fontSize:13,fontWeight:600,color:C.red,minWidth:75,textAlign:'right',fontFeatureSettings:"'tnum'" }}>{fmt(cat.amount)}</span><span style={{ fontSize:11,color:C.muted,minWidth:40,textAlign:'right' }}>{cat.pct}%</span></div>{isOpen && (<div style={{ border:'0.5px solid '+C.border,borderTop:'none',borderRadius:'0 0 10px 10px',overflow:'hidden',animation:'fadeUp 0.2s both' }}>{cat.transactions?.length > 0 ? (<><div style={{ display:'grid',gridTemplateColumns:'80px 1fr 90px 80px',padding:'8px 14px',fontSize:11,color:C.dim,borderBottom:'0.5px solid '+C.border,background:C.surface,textTransform:'uppercase',letterSpacing:'0.04em' }}><span>Fecha</span><span>Descripción</span><span style={{ textAlign:'right' }}>Monto</span><span style={{ textAlign:'right' }}>Método</span></div>{cat.transactions.map((t,i)=>(<div key={i} style={{ display:'grid',gridTemplateColumns:'80px 1fr 90px 80px',padding:'10px 14px',fontSize:12,borderBottom:i<cat.transactions.length-1?'0.5px solid '+C.border:'none' }}><span style={{ color:C.muted }}>{t.date?.slice(5)||'—'}</span><span style={{ overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{t.description||t.vendor||'—'}</span><span style={{ textAlign:'right',fontWeight:600,color:C.red }}>-{fmtDec(t.amount)}</span><span style={{ textAlign:'right',color:C.muted,fontSize:11 }}>{t.payment_method||'—'}</span></div>))}<div style={{ display:'flex',justifyContent:'space-between',padding:'10px 14px',background:C.surface,borderTop:'0.5px solid '+C.border,fontSize:12 }}><span style={{ color:C.muted }}>{cat.transactions.length} transacciones</span><span style={{ fontWeight:600,color:C.red }}>{fmt(cat.amount)} total</span></div></>):(<div style={{ padding:'20px 14px',textAlign:'center',color:C.muted,fontSize:13 }}>{cat.count||0} transacciones — sincroniza para ver detalle</div>)}</div>)}</div>);
}
function InsightCard({ insight, delay = 0 }) {
  const s = {critical:{b:C.red,bg:C.redDim,c:C.red},warning:{b:C.amber,bg:C.amberDim,c:C.amber},info:{b:C.blue,bg:C.blueDim,c:C.blue},success:{b:C.green,bg:C.greenDim,c:C.green}}[insight.tipo]||{b:C.blue,bg:C.blueDim,c:C.blue};
  return (<div className="fade-up" style={{ display:'flex',gap:14,padding:'16px 18px',background:C.surface,borderRadius:12,border:'0.5px solid '+C.border,borderLeft:'3px solid '+s.b,animationDelay:delay+'ms',marginBottom:10 }}><div style={{ width:28,height:28,borderRadius:'50%',background:s.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:s.c,flexShrink:0 }}>{insight.tipo==='success'?'✓':'!'}</div><div style={{ flex:1,minWidth:0 }}><div style={{ fontSize:13,fontWeight:600,marginBottom:4 }}>{insight.titulo}</div><div style={{ fontSize:12,color:C.muted,lineHeight:1.6,marginBottom:insight.ahorro_estimado?10:0 }}>{insight.descripcion}</div>{insight.ahorro_estimado>0&&(<div style={{ display:'flex',alignItems:'center',gap:10,flexWrap:'wrap' }}><span style={{ fontSize:12,padding:'4px 10px',borderRadius:6,background:s.bg,color:s.c,fontWeight:600 }}>Ahorro: {fmt(insight.ahorro_estimado)}/mes</span>{insight.accion&&<span style={{ fontSize:12,padding:'4px 10px',borderRadius:6,background:C.surfaceHover,color:C.accent,fontWeight:500 }}>{insight.accion} →</span>}</div>)}</div></div>);
}
function SidebarItem({ item, active, collapsed, onClick }) {
  return (<div onClick={onClick} style={{ display:'flex',alignItems:'center',gap:10,padding:collapsed?'10px 6px':'10px 10px',borderRadius:8,cursor:'pointer',background:active?C.surfaceHover:'transparent',marginBottom:2,border:active?'0.5px solid '+C.border:'0.5px solid transparent' }}><div style={{ width:30,height:30,borderRadius:8,background:active?item.color+'22':C.surfaceHover,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:600,color:item.color,flexShrink:0 }}>{item.icon}</div>{!collapsed&&(<div style={{ minWidth:0 }}><div style={{ fontSize:13,fontWeight:active?600:400,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{item.name}</div>{item.sub&&<div style={{ fontSize:11,color:C.muted }}>{item.sub}</div>}</div>)}</div>);
}

export default function Dashboard() {
  const [activeCompany, setActiveCompany] = useState('all');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [openCat, setOpenCat] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [year, setYear] = useState(2025);
  const [data, setData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [catTransactions, setCatTransactions] = useState({});
  const [chatMsg, setChatMsg] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [connections, setConnections] = useState([]);
  const [personalData, setPersonalData] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadSource, setUploadSource] = useState('');
  const fileRef = useRef(null);
  const isP = isPers(activeCompany);

  const loadData = useCallback(async () => {
    try {
      if (isPers(activeCompany)) { const r = await api('/api/personal/summary?account='+activeCompany+'&year='+year); setPersonalData(r); setData(null); }
      else { const r = await api('/api/dashboard?company='+activeCompany+'&year='+year); setData(r); setPersonalData(null); if(r.connections) setConnections(r.connections); }
    } catch(e){ console.error(e); }
  }, [activeCompany, year]);
  useEffect(() => { loadData(); }, [loadData]);

  const loadCatTxns = async (n) => { if(catTransactions[n]) return; try { const r = await api('/api/transactions?category='+encodeURIComponent(n)+'&company='+activeCompany+'&start='+year+'-01-01&end='+year+'-12-31'); setCatTransactions(p=>({...p,[n]:r.transactions})); } catch(e){} };
  const handleSync = async () => { setSyncing(true); try { await api('/api/qb/sync',{method:'POST',body:{company:activeCompany==='all'?null:activeCompany,year}}); await loadData(); } catch(e){} setSyncing(false); };
  const runAnalysis = async () => { setAnalyzing(true); try { const r = await api('/api/ai/analyze',{method:'POST',body:{company:activeCompany,year}}); setAnalysis(r); } catch(e){} setAnalyzing(false); };
  const sendChat = async () => { if(!chatMsg.trim()) return; const m=chatMsg; setChatMsg(''); setChatHistory(p=>[...p,{role:'user',text:m}]); setChatLoading(true); try { const r = await api('/api/ai/chat',{method:'POST',body:{message:m,company:activeCompany,year}}); setChatHistory(p=>[...p,{role:'ai',text:r.response}]); } catch(e){ setChatHistory(p=>[...p,{role:'ai',text:'Error al conectar.'}]); } setChatLoading(false); };
  const handleUpload = async (e) => { const f=e.target.files?.[0]; if(!f) return; setUploading(true); setUploadResult(null); try { const t=await f.text(); const r=await api('/api/personal/upload',{method:'POST',body:{accountId:activeCompany,sourceName:uploadSource||f.name.replace(/\.[^.]+$/,''),csvContent:t,filename:f.name}}); setUploadResult(r); await loadData(); } catch(e){ setUploadResult({error:e.message}); } setUploading(false); e.target.value=''; };
  const sw = (id) => { setActiveCompany(id); setActiveTab('dashboard'); setOpenCat(null); setAnalysis(null); setUploadResult(null); setCatTransactions({}); };

  const entity = COMPANIES.find(c=>c.id===activeCompany) || PERSONAL.find(a=>a.id===activeCompany);
  const isConn = connections.some(c=>c.connected);
  const vd = isP ? personalData : data;
  const cats = (vd?.categories||[]).map((c,i)=>({...c,transactions:catTransactions[c.name]||null,color:CAT_COLORS[i%CAT_COLORS.length]}));
  const pieD = cats.map(c=>({name:c.name,value:c.amount,color:c.color}));
  const tabs = isP ? [{id:'dashboard',l:'Resumen'},{id:'gastos',l:'Gastos detallados'},{id:'upload',l:'Subir archivo'},{id:'chat',l:'Chat'}] : [{id:'dashboard',l:'Dashboard'},{id:'gastos',l:'Gastos detallados'},{id:'asesor',l:'Asesor AI'},{id:'chat',l:'Chat financiero'}];

  return (
    <div style={{ display:'flex',minHeight:'100vh',background:C.bg,color:C.text,fontFamily:"'DM Sans',system-ui,sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}.fade-up{animation:fadeUp .4s both}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:${C.border};border-radius:4px}`}</style>

      {/* SIDEBAR */}
      <div style={{ width:sidebarOpen?270:60,background:C.surface,borderRight:'0.5px solid '+C.border,display:'flex',flexDirection:'column',transition:'width 0.3s',overflow:'hidden',flexShrink:0 }}>
        <div style={{ padding:sidebarOpen?'20px 18px':'20px 12px',borderBottom:'0.5px solid '+C.border,display:'flex',alignItems:'center',gap:10,cursor:'pointer' }} onClick={()=>setSidebarOpen(!sidebarOpen)}>
          <div style={{ width:34,height:34,borderRadius:8,background:'linear-gradient(135deg,#C8A46E,#E8D5B0)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:700,color:'#0B0F14',flexShrink:0 }}>F</div>
          {sidebarOpen&&<div><div style={{ fontSize:15,fontWeight:700,letterSpacing:'-0.02em' }}>Fortis 2.0</div><div style={{ fontSize:11,color:C.muted }}>Asesor financiero AI</div></div>}
        </div>
        <div style={{ flex:1,overflow:'auto',padding:'0 8px' }}>
          {sidebarOpen&&<div style={{ padding:'14px 10px 6px',fontSize:10,textTransform:'uppercase',letterSpacing:'0.08em',color:C.dim,fontWeight:600 }}>Empresas</div>}
          {COMPANIES.map(co=><SidebarItem key={co.id} item={co} active={activeCompany===co.id} collapsed={!sidebarOpen} onClick={()=>sw(co.id)} />)}
          {sidebarOpen&&<div style={{ height:1,background:C.border,margin:'12px 10px' }} />}
          {sidebarOpen&&<div style={{ padding:'4px 10px 6px',fontSize:10,textTransform:'uppercase',letterSpacing:'0.08em',color:C.dim,fontWeight:600 }}>Gastos personales</div>}
          {!sidebarOpen&&<div style={{ height:1,background:C.border,margin:'8px 6px' }} />}
          {PERSONAL.map(a=><SidebarItem key={a.id} item={a} active={activeCompany===a.id} collapsed={!sidebarOpen} onClick={()=>sw(a.id)} />)}
        </div>
        {sidebarOpen&&(<div style={{ padding:14,borderTop:'0.5px solid '+C.border }}>
          {!isP&&<div onClick={handleSync} style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'10px 16px',borderRadius:8,background:C.accentDim,color:C.accent,fontSize:13,fontWeight:600,cursor:'pointer',border:'0.5px solid '+C.accent+'33',marginBottom:10 }}>{syncing?'⟳ Sincronizando...':'⟳ Sync QuickBooks'}</div>}
          <div style={{ display:'flex',justifyContent:'center',gap:8 }}>{[2024,2025,2026].map(y=><span key={y} onClick={()=>setYear(y)} style={{ fontSize:12,padding:'3px 10px',borderRadius:6,cursor:'pointer',background:year===y?C.accentDim:'transparent',color:year===y?C.accent:C.dim,fontWeight:year===y?600:400 }}>{y}</span>)}</div>
        </div>)}
      </div>

      {/* MAIN */}
      <div style={{ flex:1,overflow:'auto',padding:'0 28px 40px' }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 0 24px',borderBottom:'0.5px solid '+C.border,marginBottom:24,position:'sticky',top:0,background:C.bg,zIndex:10 }}>
          <div>
            <div style={{ fontSize:20,fontWeight:600,display:'flex',alignItems:'center',gap:10 }}><span style={{ color:entity?.color }}>●</span> {entity?.name}{isP&&<span style={{ fontSize:11,padding:'3px 10px',borderRadius:6,background:C.purpleDim,color:C.purple,fontWeight:500 }}>No contabilizado en empresas</span>}</div>
            <div style={{ fontSize:12,color:C.muted,marginTop:2 }}>Enero — Diciembre {year}</div>
          </div>
          {!isP&&<SyncBadge connected={isConn} syncing={syncing} onClick={handleSync} />}
          {isP&&personalData?.uploadCount>0&&<SyncBadge connected={true} syncing={false} label={personalData.uploadCount+' archivo(s)'} onClick={()=>setActiveTab('upload')} />}
        </div>

        <div style={{ display:'flex',gap:4,marginBottom:24,flexWrap:'wrap' }}>
          {tabs.map(t=><div key={t.id} onClick={()=>{setActiveTab(t.id);if(t.id==='asesor'&&!analysis)runAnalysis();}} style={{ padding:'8px 18px',borderRadius:8,fontSize:13,fontWeight:activeTab===t.id?600:400,color:activeTab===t.id?C.accent:C.muted,background:activeTab===t.id?C.accentDim:'transparent',cursor:'pointer',border:activeTab===t.id?'0.5px solid '+C.accent+'33':'0.5px solid transparent' }}>{t.l}</div>)}
        </div>

        {/* DASHBOARD */}
        {activeTab==='dashboard'&&vd&&(<div className="fade-up">
          <div style={{ display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:12,marginBottom:28 }}>
            <MetricCard label="Ingresos" value={fmt(vd.totalIncome)} color={C.green} />
            <MetricCard label="Gastos" value={fmt(vd.totalExpenses)} color={C.red} sub={vd.totalExpenses>vd.totalIncome?'En pérdida':'Controlado'} delay={60} />
            <MetricCard label="Resultado neto" value={fmt(vd.net)} color={vd.net>=0?C.green:C.red} sub={vd.totalIncome>0?'Margen: '+(vd.margin||Math.round((vd.net/vd.totalIncome)*100))+'%':''} delay={120} />
            <MetricCard label={isP?'Archivos':'Categorías'} value={isP?(personalData?.uploadCount||0):(vd.categories?.length||0)} sub={isP?'estados de cuenta':'de gasto'} delay={180} />
          </div>
          {isP&&personalData?.global&&(<div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:24 }}>
            <div style={{ background:C.surface,borderRadius:10,padding:'14px 16px',border:'0.5px solid '+C.border }}><div style={{ fontSize:11,color:C.muted,textTransform:'uppercase',letterSpacing:'0.04em',marginBottom:4 }}>Empresas (neto)</div><div style={{ fontSize:20,fontWeight:600,color:personalData.global.business.net>=0?C.green:C.red }}>{fmt(personalData.global.business.net)}</div></div>
            <div style={{ background:C.surface,borderRadius:10,padding:'14px 16px',border:'0.5px solid '+C.border }}><div style={{ fontSize:11,color:C.muted,textTransform:'uppercase',letterSpacing:'0.04em',marginBottom:4 }}>Personal (neto)</div><div style={{ fontSize:20,fontWeight:600,color:personalData.global.personal.net>=0?C.green:C.red }}>{fmt(personalData.global.personal.net)}</div></div>
            <div style={{ background:C.surface,borderRadius:10,padding:'14px 16px',border:'0.5px solid '+C.border }}><div style={{ fontSize:11,color:C.muted,textTransform:'uppercase',letterSpacing:'0.04em',marginBottom:4 }}>Total global</div><div style={{ fontSize:20,fontWeight:600,color:personalData.global.total.net>=0?C.green:C.red }}>{fmt(personalData.global.total.net)}</div></div>
          </div>)}
          <div style={{ display:'grid',gridTemplateColumns:'1.3fr 0.7fr',gap:20,marginBottom:28 }}>
            <div style={{ background:C.surface,borderRadius:12,border:'0.5px solid '+C.border,padding:'18px 20px' }}>
              <div style={{ fontSize:13,fontWeight:600,marginBottom:4 }}>{isP?'Ingresos vs gastos personales':'Ingresos vs gastos'}</div>
              <div style={{ fontSize:11,color:C.muted,marginBottom:16 }}>Evolución mensual {year}</div>
              <div style={{ height:260 }}><ResponsiveContainer width="100%" height="100%"><BarChart data={vd.monthlyChart} barGap={2}><CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} /><XAxis dataKey="month" tick={{fill:C.muted,fontSize:11}} axisLine={false} tickLine={false} /><YAxis tick={{fill:C.muted,fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>fmt(v)} width={60} /><Tooltip content={<ChartTooltip />} /><Bar dataKey="income" name="Ingresos" fill={C.green} radius={[3,3,0,0]} maxBarSize={24} /><Bar dataKey="expenses" name="Gastos" fill={C.red} radius={[3,3,0,0]} maxBarSize={24} /></BarChart></ResponsiveContainer></div>
              <div style={{ display:'flex',gap:20,marginTop:10,justifyContent:'center' }}><span style={{ display:'flex',alignItems:'center',gap:6,fontSize:12,color:C.muted }}><span style={{ width:10,height:10,borderRadius:2,background:C.green }} />Ingresos</span><span style={{ display:'flex',alignItems:'center',gap:6,fontSize:12,color:C.muted }}><span style={{ width:10,height:10,borderRadius:2,background:C.red }} />Gastos</span></div>
            </div>
            <div style={{ background:C.surface,borderRadius:12,border:'0.5px solid '+C.border,padding:'18px 20px' }}>
              <div style={{ fontSize:13,fontWeight:600,marginBottom:4 }}>Distribución de gastos</div>
              <div style={{ fontSize:11,color:C.muted,marginBottom:8 }}>Por categoría</div>
              {pieD.length>0?(<><div style={{ height:180 }}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieD} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" stroke="none">{pieD.map((e,i)=><Cell key={i} fill={e.color} />)}</Pie></PieChart></ResponsiveContainer></div><div style={{ display:'flex',flexDirection:'column',gap:4 }}>{pieD.slice(0,5).map((p,i)=><div key={i} style={{ display:'flex',alignItems:'center',gap:6,fontSize:11,color:C.muted }}><span style={{ width:8,height:8,borderRadius:2,background:p.color }} />{p.name}: {fmt(p.value)}</div>)}</div></>):(<div style={{ padding:40,textAlign:'center',color:C.dim }}>{isP?'Sube un CSV para ver datos':'Sin datos'}</div>)}
            </div>
          </div>
          {vd.net<0&&(<div style={{ padding:'14px 18px',borderRadius:12,background:C.redDim,border:'0.5px solid '+C.red+'33',display:'flex',alignItems:'center',gap:12 }}><span style={{ fontSize:18 }}>!</span><div><div style={{ fontSize:13,fontWeight:600,color:C.red }}>{isP?'Gastos personales superan ingresos':'Operando en pérdida'}: {fmt(vd.net)}</div></div></div>)}
          {data?.perCompany&&(<div style={{ marginTop:28 }}><div style={{ fontSize:14,fontWeight:600,marginBottom:12 }}>Rendimiento por empresa</div><div style={{ display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:12 }}>{data.perCompany.filter(c=>c.totalIncome>0||c.totalExpenses>0).map(co=>(<div key={co.id} onClick={()=>sw(co.id)} style={{ background:C.surface,borderRadius:12,border:'0.5px solid '+C.border,padding:'16px 18px',cursor:'pointer' }}><div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:10 }}><span style={{ width:10,height:10,borderRadius:'50%',background:co.color }} /><span style={{ fontSize:13,fontWeight:600 }}>{co.name}</span></div><div style={{ display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:4 }}><span style={{ color:C.muted }}>Ingresos</span><span style={{ color:C.green,fontWeight:500 }}>{fmt(co.totalIncome)}</span></div><div style={{ display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:4 }}><span style={{ color:C.muted }}>Gastos</span><span style={{ color:C.red,fontWeight:500 }}>{fmt(co.totalExpenses)}</span></div><div style={{ display:'flex',justifyContent:'space-between',fontSize:13,fontWeight:600,paddingTop:6,borderTop:'0.5px solid '+C.border }}><span>Neto</span><span style={{ color:co.net>=0?C.green:C.red }}>{fmt(co.net)}</span></div></div>))}</div></div>)}
        </div>)}

        {/* GASTOS */}
        {activeTab==='gastos'&&vd&&(<div className="fade-up">
          <div style={{ display:'flex',alignItems:'baseline',gap:10,marginBottom:16 }}><span style={{ fontSize:15,fontWeight:600 }}>Categorías de gasto {isP&&'(personal)'}</span><span style={{ fontSize:11,color:C.dim }}>Clic para ver cada transacción</span></div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:24 }}>
            <MetricCard label="Total gastos" value={fmt(vd.totalExpenses)} color={C.red} />
            <MetricCard label="Categorías" value={cats.length} sub="con transacciones" delay={60} />
            <MetricCard label="Transacciones" value={cats.reduce((s,c)=>s+(c.count||0),0)} sub="en el periodo" delay={120} />
          </div>
          {cats.map((cat,i)=><CategoryRow key={cat.name} cat={cat} index={i} isOpen={openCat===cat.name} onToggle={()=>{setOpenCat(openCat===cat.name?null:cat.name);loadCatTxns(cat.name);}} />)}
          {cats.length===0&&<div style={{ textAlign:'center',padding:40,color:C.muted }}>{isP?'Sube un CSV en "Subir archivo".':'Sincroniza QuickBooks.'}</div>}
        </div>)}

        {/* UPLOAD (Personal) */}
        {activeTab==='upload'&&isP&&(<div className="fade-up">
          <div style={{ fontSize:15,fontWeight:600,marginBottom:4 }}>Subir estado de cuenta</div>
          <div style={{ fontSize:12,color:C.muted,marginBottom:20,lineHeight:1.6 }}>Sube el CSV de tu banco o tarjeta. Soporta Chase, BofA, Amex, Wells Fargo y genérico. Claude AI categoriza automáticamente.</div>
          <div style={{ background:C.surface,borderRadius:12,border:'1px dashed '+C.border,padding:'32px 24px',textAlign:'center',marginBottom:20 }}>
            <div style={{ fontSize:36,marginBottom:8,opacity:0.5 }}>📄</div>
            <div style={{ fontSize:14,fontWeight:500,marginBottom:12 }}>Arrastra o selecciona tu archivo</div>
            <div style={{ fontSize:12,color:C.muted,marginBottom:16 }}>CSV, TSV — estados de cuenta bancarios</div>
            <div style={{ display:'flex',alignItems:'center',gap:10,justifyContent:'center',marginBottom:14 }}>
              <input value={uploadSource} onChange={e=>setUploadSource(e.target.value)} placeholder="Nombre fuente (ej: Chase Sapphire)" style={{ padding:'10px 14px',borderRadius:8,border:'0.5px solid '+C.border,background:C.bg,color:C.text,fontSize:13,width:300,outline:'none' }} />
            </div>
            <input ref={fileRef} type="file" accept=".csv,.tsv,.txt" onChange={handleUpload} style={{ display:'none' }} />
            <div onClick={()=>fileRef.current?.click()} style={{ display:'inline-flex',alignItems:'center',gap:8,padding:'10px 24px',borderRadius:8,background:C.accentDim,color:C.accent,fontSize:13,fontWeight:600,cursor:'pointer',border:'0.5px solid '+C.accent+'33' }}>{uploading?'⟳ Procesando...':'📁 Seleccionar archivo'}</div>
          </div>
          {uploadResult&&!uploadResult.error&&(<div style={{ background:C.surface,borderRadius:12,border:'0.5px solid '+C.green+'33',padding:'18px 20px',marginBottom:20 }}>
            <div style={{ fontSize:14,fontWeight:600,color:C.green,marginBottom:10 }}>✓ Procesado</div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:12 }}>
              <div><div style={{ fontSize:11,color:C.muted }}>Formato</div><div style={{ fontSize:13,fontWeight:500,textTransform:'capitalize' }}>{uploadResult.format}</div></div>
              <div><div style={{ fontSize:11,color:C.muted }}>Transacciones</div><div style={{ fontSize:13,fontWeight:500 }}>{uploadResult.totalTransactions}</div></div>
              <div><div style={{ fontSize:11,color:C.muted }}>Gastos</div><div style={{ fontSize:13,fontWeight:500,color:C.red }}>{fmt(uploadResult.totalExpenses)}</div></div>
              <div><div style={{ fontSize:11,color:C.muted }}>Ingresos</div><div style={{ fontSize:13,fontWeight:500,color:C.green }}>{fmt(uploadResult.totalIncome)}</div></div>
            </div>
            {uploadResult.categories?.slice(0,5).map((cat,i)=>(<div key={i} style={{ display:'flex',alignItems:'center',gap:8,padding:'4px 0',fontSize:12,marginTop:i===0?8:0 }}><span style={{ width:8,height:8,borderRadius:2,background:CAT_COLORS[i] }} /><span style={{ flex:1 }}>{cat.name}</span><span style={{ fontWeight:500,color:C.red }}>{fmt(cat.total)}</span><span style={{ color:C.muted }}>{cat.pct}%</span></div>))}
            {uploadResult.aiCategorized&&<div style={{ marginTop:10,fontSize:12,color:C.green }}>✓ Claude AI categorizó las transacciones</div>}
          </div>)}
          {uploadResult?.error&&<div style={{ padding:'14px 18px',borderRadius:12,background:C.redDim,border:'0.5px solid '+C.red+'33',fontSize:13,color:C.red }}>Error: {uploadResult.error}</div>}
          {personalData?.uploads?.length>0&&(<div><div style={{ fontSize:14,fontWeight:600,marginBottom:10 }}>Archivos cargados</div>{personalData.uploads.map((up,i)=>(<div key={i} style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 14px',background:C.surface,borderRadius:10,border:'0.5px solid '+C.border,marginBottom:6 }}><span style={{ fontSize:20,opacity:0.5 }}>📄</span><div style={{ flex:1 }}><div style={{ fontSize:13,fontWeight:500 }}>{up.source_name||up.filename}</div><div style={{ fontSize:11,color:C.muted }}>{up.total_transactions} txns · {up.period||''}</div></div><div style={{ textAlign:'right' }}><div style={{ fontSize:13,fontWeight:500,color:C.red }}>{fmt(up.total_expenses)}</div><div style={{ fontSize:11,color:C.muted }}>{new Date(up.uploaded_at).toLocaleDateString('es-ES')}</div></div><span style={{ fontSize:11,padding:'3px 8px',borderRadius:4,background:up.status==='processed'?C.greenDim:C.amberDim,color:up.status==='processed'?C.green:C.amber }}>{up.status==='processed'?'OK':'...'}</span></div>))}</div>)}
          <div style={{ marginTop:20,padding:'14px 18px',borderRadius:12,background:C.surface,border:'0.5px solid '+C.border,fontSize:12,color:C.muted,lineHeight:1.6 }}><strong style={{ color:C.text }}>¿Cómo exportar tu CSV?</strong><br /><strong>Chase:</strong> Actividad → Descargar → CSV<br /><strong>BofA:</strong> Cuentas → Descargar → CSV<br /><strong>Amex:</strong> Statements → Download → CSV<br /><strong>Wells Fargo:</strong> Account Activity → Download → Comma Delimited</div>
        </div>)}

        {/* AI ADVISOR */}
        {activeTab==='asesor'&&!isP&&(<div className="fade-up">
          <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:20 }}>
            <div style={{ width:36,height:36,borderRadius:'50%',background:C.accentDim,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,color:C.accent }}>AI</div>
            <div><div style={{ fontSize:15,fontWeight:600 }}>Asesor financiero — Fortis</div><div style={{ fontSize:12,color:C.muted }}>Análisis de QuickBooks</div></div>
            {!analyzing&&<div onClick={runAnalysis} style={{ marginLeft:'auto',fontSize:12,padding:'6px 14px',borderRadius:8,background:C.accentDim,color:C.accent,cursor:'pointer',fontWeight:500,border:'0.5px solid '+C.accent+'33' }}>Actualizar</div>}
          </div>
          {analyzing&&<div style={{ textAlign:'center',padding:40,color:C.muted }}>Analizando con Claude AI...</div>}
          {analysis&&!analyzing&&(<>
            {analysis.proyeccion&&(<div style={{ background:C.surface,borderRadius:12,border:'0.5px solid '+C.border,padding:'20px 24px',marginBottom:20,display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:20 }}>
              <div><div style={{ fontSize:11,color:C.muted,textTransform:'uppercase',letterSpacing:'0.04em',marginBottom:6 }}>Actual</div><div style={{ fontSize:28,fontWeight:700,color:analysis.proyeccion.neto_actual>=0?C.green:C.red }}>{fmt(analysis.proyeccion.neto_actual)}<span style={{ fontSize:14,fontWeight:400,color:C.muted }}>/mes</span></div></div>
              <div><div style={{ fontSize:11,color:C.muted,textTransform:'uppercase',letterSpacing:'0.04em',marginBottom:6 }}>Ahorro posible</div><div style={{ fontSize:28,fontWeight:700,color:C.green }}>{fmt(analysis.proyeccion.ahorro_total_posible)}<span style={{ fontSize:14,fontWeight:400,color:C.muted }}>/mes</span></div></div>
              <div><div style={{ fontSize:11,color:C.muted,textTransform:'uppercase',letterSpacing:'0.04em',marginBottom:6 }}>Proyectado</div><div style={{ fontSize:28,fontWeight:700,color:C.green }}>+{fmt(analysis.proyeccion.neto_proyectado)}<span style={{ fontSize:14,fontWeight:400,color:C.muted }}>/mes</span></div></div>
            </div>)}
            {analysis.diagnostico&&<div style={{ padding:'14px 18px',borderRadius:12,background:C.surface,border:'0.5px solid '+C.border,marginBottom:16,fontSize:13,color:C.muted,lineHeight:1.6 }}>{analysis.diagnostico}</div>}
            {analysis.insights?.map((ins,i)=><InsightCard key={i} insight={ins} delay={i*80} />)}
            {analysis.proyeccion?.mejora_anual>0&&(<div style={{ marginTop:20,padding:'16px 20px',borderRadius:12,background:C.accentDim,border:'0.5px solid '+C.accent+'33' }}><div style={{ fontSize:13,fontWeight:600,color:C.accent,marginBottom:4 }}>Impacto anual</div><div style={{ fontSize:24,fontWeight:700,color:C.accent }}>{fmt(analysis.proyeccion.mejora_anual)}<span style={{ fontSize:13,fontWeight:400,color:C.muted }}> mejora anual</span></div></div>)}
          </>)}
        </div>)}

        {/* CHAT */}
        {activeTab==='chat'&&(<div className="fade-up" style={{ display:'flex',flexDirection:'column',height:'calc(100vh - 180px)' }}>
          <div style={{ flex:1,overflow:'auto',marginBottom:16 }}>
            {chatHistory.length===0&&(<div style={{ textAlign:'center',padding:'60px 20px',color:C.muted }}><div style={{ fontSize:28,marginBottom:8 }}>💬</div><div style={{ fontSize:14,fontWeight:500,marginBottom:4 }}>Chat con Fortis</div><div style={{ fontSize:12 }}>Pregunta sobre tus finanzas{isP?' personales':''}.</div><div style={{ display:'flex',flexWrap:'wrap',gap:8,justifyContent:'center',marginTop:20 }}>{(isP?['¿En qué gasto más?','¿Qué suscripciones cancelar?','¿Algún gasto deducible?','¿Cómo reducir gastos?']:['¿En qué me gasto más?','¿Cómo reducir gastos?','¿Qué empresa es más rentable?','¿Los contractors se justifican?']).map(q=><div key={q} onClick={()=>setChatMsg(q)} style={{ fontSize:12,padding:'6px 12px',borderRadius:8,background:C.surface,border:'0.5px solid '+C.border,cursor:'pointer',color:C.muted }}>{q}</div>)}</div></div>)}
            {chatHistory.map((m,i)=>(<div key={i} style={{ display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start',marginBottom:10 }}><div style={{ maxWidth:'80%',padding:'10px 14px',borderRadius:12,fontSize:13,lineHeight:1.6,background:m.role==='user'?C.accentDim:C.surface,border:m.role==='ai'?'0.5px solid '+C.border:'none',color:m.role==='user'?C.accent:C.text,whiteSpace:'pre-wrap' }}>{m.text}</div></div>))}
            {chatLoading&&<div style={{ padding:10,color:C.muted,fontSize:13 }}>Fortis está pensando...</div>}
          </div>
          <div style={{ display:'flex',gap:8 }}>
            <input value={chatMsg} onChange={e=>setChatMsg(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendChat()} placeholder="Pregunta sobre tus finanzas..." style={{ flex:1,padding:'12px 16px',borderRadius:10,border:'0.5px solid '+C.border,background:C.surface,color:C.text,fontSize:13,outline:'none' }} />
            <button onClick={sendChat} disabled={chatLoading||!chatMsg.trim()} style={{ padding:'12px 20px',borderRadius:10,background:C.accentDim,color:C.accent,border:'0.5px solid '+C.accent+'33',fontSize:13,fontWeight:600,cursor:'pointer' }}>Enviar</button>
          </div>
        </div>)}

        {!vd&&<div style={{ textAlign:'center',padding:60,color:C.muted }}>Cargando...</div>}
      </div>
    </div>
  );
}
