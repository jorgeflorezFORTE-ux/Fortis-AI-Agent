import React from 'react';
/**
 * pages/index.js — Fortis AI · Dashboard profesional
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

const fmt = n => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n||0);
const fmtS = n => { const a=Math.abs(n||0); if(a>=1000000) return (n<0?'-':'')+'$'+(a/1000000).toFixed(2)+'M'; if(a>=1000) return (n<0?'-':'')+'$'+(a/1000).toFixed(0)+'k'; return fmt(n); };

function Sparkline({ data=[], color='#22d3a5', height=36, width=80 }) {
  if(!data.length) return null;
  const max=Math.max(...data,1), min=Math.min(...data,0), range=max-min||1;
  const pts=data.map((v,i)=>`${(i/(data.length-1))*width},${height-((v-min)/range)*height*0.8-height*0.1}`).join(' ');
  return <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{overflow:'visible'}}><polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={pts}/></svg>;
}

function KpiCard({ label, value, sub, delta, sparkData, color='#22d3a5' }) {
  const isPos = delta >= 0;
  return (
    <div style={{background:'#16213e',border:'1px solid #1e2d4a',borderRadius:16,padding:'20px 24px',position:'relative',overflow:'hidden'}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12}}>
        <div style={{fontSize:11,color:'#7c8db5',fontWeight:500,textTransform:'uppercase',letterSpacing:'.06em'}}>{label}</div>
        {sparkData&&<Sparkline data={sparkData} color={color}/>}
      </div>
      <div style={{fontSize:28,fontWeight:700,color:'#f0f4ff',letterSpacing:'-1px',marginBottom:6}}>{value}</div>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        {delta!==undefined&&<span style={{fontSize:11,fontWeight:600,color:isPos?'#22d3a5':'#f87171',background:isPos?'rgba(34,211,165,.12)':'rgba(248,113,113,.12)',padding:'2px 8px',borderRadius:20}}>{isPos?'▲':'▼'} {Math.abs(delta)}%</span>}
        {sub&&<span style={{fontSize:12,color:'#7c8db5'}}>{sub}</span>}
      </div>
      <div style={{position:'absolute',bottom:0,left:0,right:0,height:3,background:`linear-gradient(90deg, ${color}50, transparent)`}}/>
    </div>
  );
}

function Spin({ size=14, color='#22d3a5' }) {
  return <span style={{display:'inline-block',width:size,height:size,border:`2px solid rgba(255,255,255,.1)`,borderTopColor:color,borderRadius:'50%',animation:'spin .7s linear infinite'}}/>;
}

function AnalysisResult({ result, type }) {
  if(!result) return null;
  if(type==='chat') return <div style={{fontSize:13,lineHeight:1.7,color:'#c8d4f0',whiteSpace:'pre-wrap'}}>{result}</div>;
  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      {result.resumenEjecutivo&&<div style={{background:'rgba(59,130,246,.1)',borderLeft:'3px solid #3b82f6',borderRadius:'0 12px 12px 0',padding:'12px 14px'}}>
        <div style={{fontSize:11,fontWeight:700,color:'#818cf8',marginBottom:4,textTransform:'uppercase',letterSpacing:'.06em'}}>Resumen del asesor</div>
        <div style={{color:'#c8d4f0',fontSize:13,lineHeight:1.6}}>{result.resumenEjecutivo}</div>
        {result.score&&<div style={{marginTop:6,fontSize:12,color:'#7c8db5'}}>Score financiero: <strong style={{color:'#22d3a5'}}>{result.score}/100</strong></div>}
      </div>}
      {result.transaccionesInusuales?.map((t,i)=>(
        <div key={i} style={{background:'rgba(251,191,36,.08)',borderLeft:'3px solid #fbbf24',borderRadius:'0 12px 12px 0',padding:'12px 14px'}}>
          <div style={{fontWeight:600,color:'#fbbf24',fontSize:13}}>{t.descripcion} — {fmt(t.monto)}</div>
          <div style={{color:'#c8d4f0',fontSize:12,marginTop:2}}>{t.alerta}</div>
          {t.accion&&<div style={{color:'#22d3a5',fontSize:12,marginTop:4,fontWeight:500}}>→ {t.accion}</div>}
        </div>
      ))}
      {result.entradasContables?.length>0&&<div>
        <div style={{fontSize:11,fontWeight:600,color:'#3d5070',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:8}}>Entradas contables</div>
        {result.entradasContables.map((je,i)=>(
          <div key={i} style={{background:'#0d1526',borderRadius:10,padding:'12px 14px',marginBottom:8,border:'1px solid #1e2d4a'}}>
            <div style={{fontSize:13,fontWeight:600,color:'#e8edf8',marginBottom:8}}>{je.fecha} — {je.descripcion}</div>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead><tr style={{color:'#3d5070'}}><td style={{padding:'4px 0'}}>Cuenta</td><td style={{textAlign:'right',padding:'4px 0'}}>Debe</td><td style={{textAlign:'right',padding:'4px 0'}}>Haber</td></tr></thead>
              <tbody>{je.lineas?.map((l,j)=>(<tr key={j} style={{borderTop:'1px solid #1a2840'}}><td style={{padding:'4px 0',fontWeight:500,color:'#c8d4f0'}}>{l.cuenta}</td><td style={{textAlign:'right',color:'#f87171',fontFamily:'monospace',padding:'4px 0'}}>{l.debe>0?fmt(l.debe):''}</td><td style={{textAlign:'right',color:'#22d3a5',fontFamily:'monospace',padding:'4px 0'}}>{l.haber>0?fmt(l.haber):''}</td></tr>))}</tbody>
            </table>
          </div>
        ))}
      </div>}
      {result.recomendaciones?.length>0&&<div>
        <div style={{fontSize:11,fontWeight:600,color:'#3d5070',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:8}}>Recomendaciones</div>
        {result.recomendaciones.map((r,i)=>(
          <div key={i} style={{display:'flex',gap:10,marginBottom:8,fontSize:13,alignItems:'flex-start'}}>
            <div style={{width:22,height:22,borderRadius:'50%',background:'rgba(34,211,165,.15)',color:'#22d3a5',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,flexShrink:0,marginTop:1}}>{i+1}</div>
            <div style={{color:'#c8d4f0',lineHeight:1.5}}>{r}</div>
          </div>
        ))}
      </div>}
      {result.accionesPrioritarias?.length>0&&<div style={{background:'rgba(34,211,165,.08)',borderLeft:'3px solid #22d3a5',borderRadius:'0 12px 12px 0',padding:'12px 14px'}}>
        <div style={{fontSize:11,fontWeight:700,color:'#22d3a5',marginBottom:6,textTransform:'uppercase',letterSpacing:'.06em'}}>Acciones esta semana</div>
        {result.accionesPrioritarias.map((a,i)=><div key={i} style={{fontSize:13,color:'#c8d4f0',marginBottom:3}}>✓ {a}</div>)}
      </div>}
    </div>
  );
}

function YearOverview({ currentYear, connectedCount }) {
  const prevYear = currentYear - 1;
  const [curr, setCurr] = React.useState(null);
  const [prev, setPrev] = React.useState(null);
  const [loadingCurr, setLoadingCurr] = React.useState(false);
  const [loadingPrev, setLoadingPrev] = React.useState(false);
  const [prevFrozen, setPrevFrozen] = React.useState(false);
  const f = n => { const a=Math.abs(n||0); if(a>=1000000) return (n<0?'-':'')+'$'+(a/1000000).toFixed(2)+'M'; if(a>=1000) return (n<0?'-':'')+'$'+(a/1000).toFixed(0)+'k'; return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n||0); };

  React.useEffect(() => {
    loadFrozenPrev();
  }, []);

  const loadFrozenPrev = async () => {
    try {
      const r = await window.storage.get('fortis-year-' + prevYear);
      if (r) { setPrev(JSON.parse(r.value)); setPrevFrozen(true); }
    } catch(e) {}
  };

  const fetchYear = async (year, setData, setLoading, freeze) => {
    if(connectedCount===0) return;
    setLoading(true);
    try {
      const r = await fetch('/api/qb/year', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({year})});
      const d = await r.json();
      if(d.success) {
        setData(d);
        if(freeze) {
          await window.storage.set('fortis-year-'+year, JSON.stringify(d));
          setPrevFrozen(true);
        }
      }
    } catch(e) {}
    setLoading(false);
  };

  const maxIncome = Math.max(curr?.total?.income||0, prev?.total?.income||0, 1);
  const maxExpenses = Math.max(curr?.total?.expenses||0, prev?.total?.expenses||0, 1);

  const MonthRow = ({ m, pc, label, year }) => {
    const hasData = m.income > 0 || m.expenses > 0;
    const pcData = pc?.months?.find(x => x.monthIndex === m.monthIndex);
    const yoy = pcData && pcData.net !== 0 ? Math.round(((m.net - pcData.net) / Math.abs(pcData.net)) * 100) : null;
    return (
      <tr style={{borderTop:'1px solid #1a2840'}}>
        <td style={{padding:'8px',color:'#e8edf8',fontWeight:500,fontSize:12}}>{m.month}</td>
        <td style={{textAlign:'right',padding:'8px',color:'#22d3a5',fontFamily:'monospace',fontSize:12}}>{hasData?f(m.income):'-'}</td>
        <td style={{textAlign:'right',padding:'8px',color:'#f87171',fontFamily:'monospace',fontSize:12}}>{hasData?f(m.expenses):'-'}</td>
        <td style={{textAlign:'right',padding:'8px',fontWeight:700,fontFamily:'monospace',fontSize:12,color:m.net>=0?'#22d3a5':'#f87171'}}>{hasData?f(m.net):'-'}</td>
        {pc && <td style={{textAlign:'right',padding:'8px',fontSize:11,color:yoy===null?'#3d5070':yoy>=0?'#22d3a5':'#f87171'}}>
          {yoy!==null?(yoy>=0?'▲':'▼')+Math.abs(yoy)+'%':'-'}
        </td>}
        <td style={{textAlign:'center',padding:'8px'}}>
          {hasData&&<span style={{background:m.net>=0?'rgba(34,211,165,.15)':'rgba(248,113,113,.15)',color:m.net>=0?'#22d3a5':'#f87171',padding:'2px 8px',borderRadius:20,fontSize:10,fontWeight:600}}>{m.net>=0?'Ganancia':'Perdida'}</span>}
        </td>
      </tr>
    );
  };

  const SummaryCard = ({ data, year, isCurrentYear, loading, onLoad, onFreeze, frozen }) => {
    if (!data && !loading) return (
      <div style={{background:'#0d1526',borderRadius:12,padding:20,textAlign:'center',border:'1px dashed #1e2d4a',flex:1,minWidth:280}}>
        <div style={{fontSize:13,color:'#3d5070',marginBottom:12}}>{isCurrentYear ? 'Año actual ' + year : 'Año anterior ' + year + (frozen?' (guardado)':'')}
        </div>
        <button onClick={onLoad} style={{background:'rgba(34,211,165,.15)',color:'#22d3a5',border:'1px solid rgba(34,211,165,.3)',borderRadius:8,padding:'8px 16px',fontSize:13,fontWeight:600,cursor:'pointer'}}>
          {isCurrentYear ? 'Cargar ' + year : frozen ? 'Ya guardado' : 'Cargar y congelar ' + year}
        </button>
        {!isCurrentYear && <div style={{fontSize:11,color:'#3d5070',marginTop:8}}>Se guarda una sola vez — no se vuelve a jalar de QB</div>}
      </div>
    );

    if (loading) return (
      <div style={{background:'#0d1526',borderRadius:12,padding:20,textAlign:'center',flex:1,minWidth:280}}>
        <div style={{fontSize:13,color:'#7c8db5'}}>Jalando {year} de QuickBooks...</div>
      </div>
    );

    return (
      <div style={{background:'#0d1526',borderRadius:12,padding:16,flex:1,minWidth:280,border:isCurrentYear?'1px solid rgba(34,211,165,.2)':'1px solid rgba(255,255,255,.05)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
          <div style={{fontSize:12,fontWeight:600,color:isCurrentYear?'#22d3a5':'#7c8db5'}}>{year} {isCurrentYear?'(en curso)':'📸 (foto fija)'}</div>
          <div style={{display:'flex',gap:6}}>
            {isCurrentYear && <button onClick={onLoad} style={{background:'transparent',border:'1px solid #1e2d4a',borderRadius:6,padding:'3px 8px',fontSize:11,color:'#7c8db5',cursor:'pointer'}}>Refrescar</button>}
            {!isCurrentYear && !frozen && <button onClick={onFreeze} style={{background:'transparent',border:'1px solid rgba(34,211,165,.3)',borderRadius:6,padding:'3px 8px',fontSize:11,color:'#22d3a5',cursor:'pointer'}}>Guardar foto</button>}
            {!isCurrentYear && frozen && <span style={{fontSize:10,color:'#3d5070',padding:'3px 8px'}}>Guardado ✓</span>}
          </div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:8}}>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:9,color:'#3d5070',marginBottom:2,textTransform:'uppercase',letterSpacing:'.05em'}}>Ingresos</div>
            <div style={{fontSize:16,fontWeight:800,color:'#22d3a5'}}>{f(data.total.income)}</div>
            <div style={{fontSize:9,color:'#3d5070',marginTop:2}}>Suma de ingresos de todas las empresas en el ano</div>
          </div>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:9,color:'#3d5070',marginBottom:2,textTransform:'uppercase',letterSpacing:'.05em'}}>Gastos</div>
            <div style={{fontSize:16,fontWeight:800,color:'#f87171'}}>{f(data.total.expenses)}</div>
            <div style={{fontSize:9,color:'#3d5070',marginTop:2}}>Total de egresos operativos registrados en QB</div>
          </div>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:9,color:'#3d5070',marginBottom:2,textTransform:'uppercase',letterSpacing:'.05em'}}>Neto</div>
            <div style={{fontSize:16,fontWeight:800,color:data.total.net>=0?'#22d3a5':'#f87171'}}>{f(data.total.net)}</div>
            <div style={{fontSize:9,color:'#3d5070',marginTop:2}}>Ingresos minus gastos del periodo</div>
          </div>
        </div>
        <div style={{display:'flex',gap:4,height:60,alignItems:'flex-end'}}>
          {data.months.map((m,i)=>{
            const maxM=Math.max(...data.months.map(x=>Math.max(x.income,x.expenses)),1);
            const iH=Math.round((m.income/maxM)*52);
            const eH=Math.round((m.expenses/maxM)*52);
            const has=m.income>0||m.expenses>0;
            return <div key={i} style={{flex:1,display:'flex',alignItems:'flex-end',gap:1}}>
              <div style={{width:'50%',height:Math.max(iH,1),background:has?'#22d3a5':'#1e2d4a',borderRadius:'2px 2px 0 0'}}/>
              <div style={{width:'50%',height:Math.max(eH,1),background:has?'#f87171':'#1e2d4a',borderRadius:'2px 2px 0 0'}}/>
            </div>;
          })}
        </div>
        <div style={{display:'flex',gap:16,marginTop:6}}>
          {[{label:'Ene',i:0},{label:'Mar',i:2},{label:'Jun',i:5},{label:'Sep',i:8},{label:'Dic',i:11}].map(m=>(
            <div key={m.i} style={{fontSize:9,color:'#3d5070'}}>{m.label}</div>
          ))}
        </div>
        <div style={{marginTop:10,padding:'8px',background:'rgba(255,255,255,.03)',borderRadius:8}}>
          <div style={{fontSize:9,color:'#3d5070',marginBottom:4}}>COMO SE CALCULA:</div>
          <div style={{fontSize:10,color:'#7c8db5',lineHeight:1.6}}>
            Se jala el P&L de QuickBooks de cada empresa (Real Legacy, JP Media, Paola PA, Reborn Houses) y se suman los totales del ano. Ingresos = Commission Income + todas las cuentas de Revenue. Gastos = suma de todas las cuentas de Expense del P&L. Neto = Ingresos - Gastos. Los meses sin datos en QB aparecen vacios.
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{background:'#16213e',border:'1px solid #1e2d4a',borderRadius:16,padding:20,marginTop:4}}>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:11,fontWeight:600,color:'#3d5070',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:2}}>Vision anual</div>
        <div style={{fontSize:13,color:'#7c8db5'}}>Compara {currentYear} vs {prevYear} — mes a mes</div>
      </div>

      <div style={{display:'flex',gap:14,flexWrap:'wrap',marginBottom:20}}>
        <SummaryCard data={curr} year={currentYear} isCurrentYear={true} loading={loadingCurr}
          onLoad={()=>fetchYear(currentYear,setCurr,setLoadingCurr,false)}/>
        <SummaryCard data={prev} year={prevYear} isCurrentYear={false} loading={loadingPrev} frozen={prevFrozen}
          onLoad={()=>fetchYear(prevYear,setPrev,setLoadingPrev,true)}
          onFreeze={()=>fetchYear(prevYear,setPrev,setLoadingPrev,true)}/>
      </div>

      {(curr || prev) && (
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12,minWidth:600}}>
            <thead>
              <tr style={{color:'#3d5070',fontSize:11,textTransform:'uppercase',letterSpacing:'.06em'}}>
                <td style={{padding:'8px'}}>Mes</td>
                <td style={{textAlign:'right',padding:'8px',color:'#22d3a5'}}>Ingresos {currentYear}</td>
                <td style={{textAlign:'right',padding:'8px',color:'#f87171'}}>Gastos {currentYear}</td>
                <td style={{textAlign:'right',padding:'8px'}}>Neto {currentYear}</td>
                {prev&&<td style={{textAlign:'right',padding:'8px',color:'#818cf8'}}>vs {prevYear}</td>}
                <td style={{textAlign:'center',padding:'8px'}}>Estado</td>
              </tr>
            </thead>
            <tbody>
              {(curr||prev).months.map((m,i)=>(
                <MonthRow key={i} m={curr?curr.months[i]:m} pc={prev} label={m.month} year={currentYear}/>
              ))}
              {curr&&<tr style={{borderTop:'2px solid #22d3a5',background:'rgba(34,211,165,.05)'}}>
                <td style={{padding:'10px 8px',color:'#e8edf8',fontWeight:700,fontSize:13}}>TOTAL {currentYear}</td>
                <td style={{textAlign:'right',padding:'10px 8px',color:'#22d3a5',fontWeight:700,fontFamily:'monospace'}}>{f(curr.total.income)}</td>
                <td style={{textAlign:'right',padding:'10px 8px',color:'#f87171',fontWeight:700,fontFamily:'monospace'}}>{f(curr.total.expenses)}</td>
                <td style={{textAlign:'right',padding:'10px 8px',color:curr.total.net>=0?'#22d3a5':'#f87171',fontWeight:800,fontSize:14,fontFamily:'monospace'}}>{f(curr.total.net)}</td>
                {prev&&<td style={{textAlign:'right',padding:'10px 8px',fontSize:11,color:curr.total.net>prev.total.net?'#22d3a5':'#f87171'}}>
                  {prev.total.net!==0?(curr.total.net>prev.total.net?'▲':'▼')+Math.abs(Math.round(((curr.total.net-prev.total.net)/Math.abs(prev.total.net))*100))+'%':'-'}
                </td>}
                <td style={{textAlign:'center',padding:'10px 8px'}}>
                  <span style={{background:curr.total.profitableMonths>6?'rgba(34,211,165,.15)':'rgba(248,113,113,.15)',color:curr.total.profitableMonths>6?'#22d3a5':'#f87171',padding:'3px 12px',borderRadius:20,fontSize:11,fontWeight:700}}>
                    {curr.total.profitableMonths} meses rentables
                  </span>
                </td>
              </tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [view,setView]=useState('dashboard');
  const [companies,setCompanies]=useState([]);
  const [syncData,setSyncData]=useState(null);
  const [analysis,setAnalysis]=useState(null);
  const [analysisType,setAnalysisType]=useState(null);
  const [loading,setLoading]=useState(false);
  const [syncing,setSyncing]=useState(false);
  const [selectedMonth,setSelectedMonth]=useState(()=>format(subMonths(new Date(),1),'yyyy-MM'));
  const [csvContent,setCsvContent]=useState('');
  const [csvSource,setCsvSource]=useState('Chase');
  const [csvPerson,setCsvPerson]=useState('Jorge');
  const [notification,setNotification]=useState(null);
  const [sidebarOpen,setSidebarOpen]=useState(true);
  const [chatInput,setChatInput]=useState('');
  const [chatHistory,setChatHistory]=useState([]);
  const [chatLoading,setChatLoading]=useState(false);
  const chatEndRef=useRef(null);

  const loadStatus=useCallback(async()=>{ try{ const r=await fetch('/api/qb/status'); const d=await r.json(); setCompanies(d.companies||[]); }catch(e){} },[]);

  useEffect(()=>{
    loadStatus();
    const p=new URLSearchParams(window.location.search);
    if(p.get('connected')){ setNotification({type:'success',msg:`✓ ${p.get('connected')} conectado`}); window.history.replaceState({},'','/'); loadStatus(); }
    if(p.get('error')){ setNotification({type:'error',msg:`Error: ${p.get('error')}`}); window.history.replaceState({},'','/'); }
  },[loadStatus]);

  useEffect(()=>{ chatEndRef.current?.scrollIntoView({behavior:'smooth'}); },[chatHistory]);

  const syncAll=async()=>{
    setSyncing(true);
    try{
      const[year,month]=selectedMonth.split('-');
      const startDate=format(startOfMonth(new Date(parseInt(year),parseInt(month)-1)),'yyyy-MM-dd');
      const endDate=format(endOfMonth(new Date(parseInt(year),parseInt(month)-1)),'yyyy-MM-dd');
      const r=await fetch('/api/qb/sync',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({company:'all',startDate,endDate})});
      const d=await r.json(); setSyncData(d);
      setNotification({type:'success',msg:`✓ Sincronizado: ${d.summary?.totalTransactions} transacciones`});
    }catch(e){ setNotification({type:'error',msg:e.message}); }
    setSyncing(false);
  };

  const runAnalysis=async(type,extra={})=>{
    setLoading(true); setAnalysis(null); setAnalysisType(type);
    try{
      let body={type,...extra};
      if(type==='weekly'||type==='monthly'){
        const companiesData=(syncData?.companies||[]).map(c=>({name:c.companyName,income:c.pl?.income||0,expenses:c.pl?.expenses||0,net:c.pl?.net||0,transactionCount:c.transactionCount||0,alerts:[]}));
        body={...body,companiesData,month:selectedMonth};
      }
      const r=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      const d=await r.json();
      if(d.success) setAnalysis(d.result); else setNotification({type:'error',msg:d.error});
    }catch(e){ setNotification({type:'error',msg:e.message}); }
    setLoading(false);
  };

  const sendChat=async()=>{
    if(!chatInput.trim()||chatLoading) return;
    const msg=chatInput.trim(); setChatInput('');
    setChatHistory(h=>[...h,{role:'user',content:msg}]); setChatLoading(true);
    try{
      const r=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'chat',messages:[{role:'user',content:msg}],financialContext:syncData?.summary})});
      const d=await r.json();
      if(d.success) setChatHistory(h=>[...h,{role:'assistant',content:d.result}]);
    }catch(e){ setChatHistory(h=>[...h,{role:'assistant',content:'Error al conectar.'}]); }
    setChatLoading(false);
  };

  const totalIncome=syncData?.summary?.totalIncome||0;
  const totalExpenses=syncData?.summary?.totalExpenses||0;
  const totalNet=syncData?.summary?.totalNet||0;
  const connectedCount=companies.filter(c=>c.connected).length;
  const [selY,selM]=selectedMonth.split('-');
  const monthLabel=format(new Date(parseInt(selY),parseInt(selM)-1,1),'MMMM yyyy',{locale:es});
  const margin=totalIncome>0?Math.round((totalNet/totalIncome)*100):0;

  const navItems=[{id:'dashboard',label:'Dashboard',icon:'◈'},{id:'empresas',label:'Empresas',icon:'◉'},{id:'personal',label:'Personal',icon:'◫'},{id:'reportes',label:'Reportes',icon:'▦'},{id:'asesor',label:'Asesor AI',icon:'◎'}];
  const months=Array.from({length:24}).map((_,i)=>{ const d=subMonths(new Date(),i); return{val:format(d,'yyyy-MM'),label:format(d,'MMM yyyy',{locale:es})}; });

  return (<>
    <Head>
      <title>Fortis — Asesor Financiero AI</title>
      <meta name="viewport" content="width=device-width, initial-scale=1"/>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',sans-serif;background:#0d1526;color:#e8edf8}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .fade-in{animation:fadeIn .25s ease}
        input,select,textarea,button{font-family:inherit}
        ::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-thumb{background:#1e2d4a;border-radius:2px}
        ::placeholder{color:#2d4060}
        .nav-btn{display:flex;align-items:center;gap:10px;padding:10px 16px;border-radius:10px;cursor:pointer;font-size:14px;color:#7c8db5;transition:all .15s;border:none;background:transparent;width:100%;text-align:left}
        .nav-btn:hover{background:rgba(255,255,255,.05);color:#c8d4f0}
        .nav-btn.on{background:rgba(34,211,165,.1);color:#22d3a5;font-weight:500}
        .card{background:#16213e;border:1px solid #1e2d4a;border-radius:16px;padding:20px;margin-bottom:14px}
        .inp{background:#0d1526;border:1px solid #1e2d4a;border-radius:10px;padding:9px 14px;font-size:13px;color:#e8edf8;width:100%;transition:border-color .15s}
        .inp:focus{outline:none;border-color:#22d3a5}
        .btn-p{background:#22d3a5;color:#0d1526;border:none;border-radius:10px;padding:9px 18px;font-size:13px;font-weight:700;cursor:pointer;transition:opacity .15s;display:inline-flex;align-items:center;gap:6px}
        .btn-p:hover{opacity:.9}
        .btn-p:disabled{opacity:.5;cursor:not-allowed}
        .btn-g{background:rgba(255,255,255,.05);color:#c8d4f0;border:1px solid #1e2d4a;border-radius:10px;padding:8px 14px;font-size:13px;cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:6px}
        .btn-g:hover{background:rgba(255,255,255,.1)}
        .bs{background:rgba(34,211,165,.15);color:#22d3a5;font-size:11px;padding:3px 10px;border-radius:20px;font-weight:600}
        .bw{background:rgba(251,191,36,.15);color:#fbbf24;font-size:11px;padding:3px 10px;border-radius:20px;font-weight:600}
        .be{background:rgba(248,113,113,.15);color:#f87171;font-size:11px;padding:3px 10px;border-radius:20px;font-weight:600}
        .bm{background:rgba(255,255,255,.06);color:#7c8db5;font-size:11px;padding:3px 10px;border-radius:20px}
        .tr{display:flex;align-items:center;padding:10px 0;border-bottom:1px solid #1a2840;gap:10px}
        .tr:last-child{border-bottom:none}
        .prog{height:4px;background:#1a2840;border-radius:2px;overflow:hidden}
        .chat-u{background:rgba(34,211,165,.1);border-radius:12px 12px 4px 12px;padding:10px 14px;font-size:13px;line-height:1.6;max-width:80%;align-self:flex-end;margin-left:auto}
        .chat-a{background:#16213e;border:1px solid #1e2d4a;border-radius:12px 12px 12px 4px;padding:12px 14px;font-size:13px;line-height:1.7;max-width:92%;white-space:pre-wrap;color:#c8d4f0}
        .slabel{font-size:11px;font-weight:600;color:#3d5070;text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px}
      `}</style>
    </Head>
    <div style={{display:'flex',minHeight:'100vh'}}>

      {/* Sidebar */}
      <aside style={{width:sidebarOpen?220:64,background:'#111d35',borderRight:'1px solid #1a2840',display:'flex',flexDirection:'column',transition:'width .25s',flexShrink:0,position:'sticky',top:0,height:'100vh',overflowY:'auto',overflowX:'hidden'}}>
        <div style={{padding:'20px 16px 16px',borderBottom:'1px solid #1a2840',display:'flex',alignItems:'center',gap:10,justifyContent:sidebarOpen?'space-between':'center'}}>
          {sidebarOpen&&<div><div style={{fontSize:20,fontWeight:800,color:'#22d3a5',letterSpacing:'-0.5px'}}>FORTIS</div><div style={{fontSize:10,color:'#3d5070',letterSpacing:'.1em'}}>ASESOR FINANCIERO AI</div></div>}
          <button onClick={()=>setSidebarOpen(o=>!o)} style={{background:'none',border:'none',color:'#3d5070',cursor:'pointer',fontSize:14,padding:4,flexShrink:0}}>{sidebarOpen?'◁':'▷'}</button>
        </div>
        <nav style={{flex:1,padding:'12px 8px'}}>
          {navItems.map(item=>(
            <button key={item.id} className={`nav-btn ${view===item.id?'on':''}`} onClick={()=>setView(item.id)}>
              <span style={{fontSize:16,width:20,textAlign:'center',flexShrink:0}}>{item.icon}</span>
              {sidebarOpen&&<span>{item.label}</span>}
              {sidebarOpen&&item.id==='asesor'&&<span style={{marginLeft:'auto',background:'#22d3a5',color:'#0d1526',fontSize:10,fontWeight:700,padding:'1px 6px',borderRadius:10}}>AI</span>}
            </button>
          ))}
        </nav>
        <div style={{padding:'12px 8px',borderTop:'1px solid #1a2840'}}>
          {sidebarOpen&&<div style={{padding:'10px 12px',borderRadius:10,background:'#0d1526'}}>
            <div style={{fontSize:10,color:'#3d5070',marginBottom:2,textTransform:'uppercase',letterSpacing:'.06em'}}>QB Conectadas</div>
            <div style={{fontSize:22,fontWeight:800,color:'#22d3a5'}}>{connectedCount}<span style={{fontSize:13,color:'#3d5070',fontWeight:400}}>/{companies.filter(c=>c.active).length}</span></div>
          </div>}
        </div>
      </aside>

      {/* Main */}
      <main style={{flex:1,overflow:'auto',minWidth:0}}>

        {/* Topbar */}
        <div style={{background:'#111d35',borderBottom:'1px solid #1a2840',padding:'12px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap',position:'sticky',top:0,zIndex:10}}>
          <div>
            <div style={{fontSize:15,fontWeight:600,color:'#e8edf8',textTransform:'capitalize'}}>{view==='dashboard'?`Dashboard — ${monthLabel}`:navItems.find(n=>n.id===view)?.label}</div>
            <div style={{fontSize:11,color:'#3d5070',marginTop:1}}>Jorge Florez & Paola Diaz · Florida, USA</div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <select value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)} className="inp" style={{width:'auto',padding:'7px 12px',fontSize:13}}>
              {months.map(m=><option key={m.val} value={m.val}>{m.label}</option>)}
            </select>
            <button onClick={syncAll} disabled={syncing} className="btn-p">
              {syncing?<Spin size={12} color="#0d1526"/>:'⟳'} {syncing?'Sincronizando…':'Sincronizar QB'}
            </button>
          </div>
        </div>

        {/* Notification */}
        {notification&&<div style={{background:notification.type==='success'?'rgba(34,211,165,.1)':'rgba(248,113,113,.1)',borderBottom:`1px solid ${notification.type==='success'?'rgba(34,211,165,.2)':'rgba(248,113,113,.2)'}`,padding:'10px 24px',fontSize:13,color:notification.type==='success'?'#22d3a5':'#f87171',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          {notification.msg}<button onClick={()=>setNotification(null)} style={{background:'none',border:'none',cursor:'pointer',color:'inherit',fontSize:18,lineHeight:1}}>×</button>
        </div>}

        <div style={{padding:24}}>

          {/* DASHBOARD */}
          {view==='dashboard'&&<div className="fade-in">
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12,marginBottom:18}}>
              <KpiCard label="Ingresos" value={fmtS(totalIncome)} sub={monthLabel} delta={syncData?undefined:undefined} sparkData={[40,55,35,70,60,80,totalIncome/1000||0]} color="#22d3a5"/>
              <KpiCard label="Gastos" value={fmtS(totalExpenses)} sub={monthLabel} sparkData={[50,45,60,40,55,48,totalExpenses/1000||0]} color="#f87171"/>
              <KpiCard label="Neto" value={fmtS(totalNet)} sub="ingreso - gastos" sparkData={[20,30,15,40,25,45,totalNet/1000||0]} color={totalNet>=0?'#22d3a5':'#f87171'}/>
              <KpiCard label="Margen neto" value={`${margin}%`} sub="rentabilidad" sparkData={[18,22,15,28,20,32,margin||0]} color="#818cf8"/>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:16,alignItems:'start'}}>
              <div>
                <div className="card">
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                    <div className="slabel" style={{marginBottom:0}}>P&L por empresa — {monthLabel}</div>
                    <div style={{display:'flex',gap:14,fontSize:11,color:'#3d5070'}}>
                      <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:8,height:8,borderRadius:2,background:'#22d3a5',display:'inline-block'}}/>Ingresos</span>
                      <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:8,height:8,borderRadius:2,background:'#f87171',display:'inline-block'}}/>Gastos</span>
                    </div>
                  </div>
                  {companies.filter(c=>c.active).map(c=>{
                    const s=syncData?.companies?.find(x=>x.companyId===c.id);
                    const inc=s?.pl?.income||0, exp=s?.pl?.expenses||0;
                    const maxV=Math.max(...(syncData?.companies||[]).flatMap(x=>[x.pl?.income||0,x.pl?.expenses||0]),1);
                    return <div key={c.id} className="tr">
                      <div style={{width:8,height:8,borderRadius:'50%',background:c.color,flexShrink:0}}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:500,color:'#e8edf8',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.name.replace(' LLC','').replace(' PA','').replace(' and Consulting','')}</div>
                        <div style={{display:'flex',gap:6,marginTop:4}}>
                          <div style={{flex:1,height:4,background:'#1a2840',borderRadius:2,overflow:'hidden'}}><div style={{height:'100%',borderRadius:2,background:'#22d3a5',width:`${(inc/maxV)*100}%`,transition:'width .5s'}}/></div>
                          <div style={{flex:1,height:4,background:'#1a2840',borderRadius:2,overflow:'hidden'}}><div style={{height:'100%',borderRadius:2,background:'#f87171',width:`${(exp/maxV)*100}%`,transition:'width .5s'}}/></div>
                        </div>
                      </div>
                      <div style={{textAlign:'right',flexShrink:0}}>
                        <div style={{fontSize:13,fontWeight:600,color:'#22d3a5'}}>{fmtS(inc)}</div>
                        <div style={{fontSize:11,color:'#f87171'}}>-{fmtS(exp)}</div>
                      </div>
                      {c.connected?<span className="bs">QB ✓</span>:<button onClick={()=>window.open(`/api/qb/connect?company=${c.id}`,'_blank')} className="btn-g" style={{fontSize:11,padding:'3px 8px'}}>Conectar</button>}
                    </div>;
                  })}
                </div>

                <div className="card">
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                    <div className="slabel" style={{marginBottom:0}}>Análisis Claude AI</div>
                    <div style={{display:'flex',gap:6}}>
                      <button onClick={()=>runAnalysis('weekly')} disabled={loading} className="btn-g" style={{fontSize:12,padding:'6px 12px'}}>{loading&&analysisType==='weekly'?<Spin size={11}/>:'📊'} Semanal</button>
                      <button onClick={()=>runAnalysis('monthly')} disabled={loading} className="btn-p" style={{fontSize:12,padding:'6px 12px'}}>{loading&&analysisType==='monthly'?<Spin size={11} color="#0d1526"/>:'📋'} Cierre</button>
                    </div>
                  </div>
                  {loading&&(analysisType==='weekly'||analysisType==='monthly')&&<div style={{display:'flex',gap:10,alignItems:'center',padding:'20px 0',color:'#7c8db5',fontSize:13}}><Spin/> Claude analizando…</div>}
                  {analysis&&!loading&&<AnalysisResult result={analysis} type={analysisType}/>}
                  {!analysis&&!loading&&<div style={{textAlign:'center',padding:'20px 0',color:'#3d5070',fontSize:13}}>Sincroniza QB y genera un reporte para ver el análisis</div>}
                </div>
              </div>

              <div>
                <div className="card" style={{borderTop:'3px solid #22d3a5'}}>
                  <div className="slabel">Meta: $20k ingreso pasivo</div>
                  <div style={{textAlign:'center',padding:'8px 0 14px'}}>
                    <div style={{fontSize:40,fontWeight:800,color:'#22d3a5',letterSpacing:'-2px'}}>$0</div>
                    <div style={{fontSize:11,color:'#3d5070',marginTop:2}}>de $20,000 / mes</div>
                    <div style={{margin:'12px 0',height:8,background:'#0d1526',borderRadius:4,overflow:'hidden'}}>
                      <div style={{height:'100%',borderRadius:4,background:'linear-gradient(90deg,#22d3a5,#818cf8)',width:'0%'}}/>
                    </div>
                    <div style={{fontSize:11,color:'#3d5070'}}>0% — agrega propiedades en Personal</div>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
                    <div style={{background:'#0d1526',borderRadius:8,padding:'10px',textAlign:'center'}}>
                      <div style={{fontSize:10,color:'#3d5070',marginBottom:2}}>Propiedades</div>
                      <div style={{fontSize:15,fontWeight:700,color:'#22d3a5'}}>$0/mes</div>
                    </div>
                    <div style={{background:'#0d1526',borderRadius:8,padding:'10px',textAlign:'center'}}>
                      <div style={{fontSize:10,color:'#3d5070',marginBottom:2}}>Empresas</div>
                      <div style={{fontSize:15,fontWeight:700,color:'#818cf8'}}>$0/mes</div>
                    </div>
                  </div>
                  <button onClick={()=>setView('personal')} className="btn-g" style={{width:'100%',justifyContent:'center',fontSize:12}}>Gestionar propiedades →</button>
                </div>

                <div className="card">
                  <div className="slabel">Estado QuickBooks</div>
                  {companies.filter(c=>c.active).map(c=>(
                    <div key={c.id} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 0',borderBottom:'1px solid #1a2840'}}>
                      <div style={{width:7,height:7,borderRadius:'50%',background:c.color,flexShrink:0}}/>
                      <div style={{flex:1,fontSize:12,color:'#c8d4f0',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.name.replace(' LLC','').replace(' PA','').replace(' and Consulting','')}</div>
                      {c.connected?<span className="bs">✓</span>:<button onClick={()=>window.open(`/api/qb/connect?company=${c.id}`,'_blank')} className="btn-g" style={{fontSize:11,padding:'3px 8px'}}>Conectar</button>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>}

          {view==='dashboard'&&<YearOverview currentYear={parseInt(selY)} connectedCount={connectedCount}/>}

          {/* EMPRESAS */}
          {view==='empresas'&&<div className="fade-in">
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:14}}>
              {companies.filter(c=>c.active).map(c=>{
                const s=syncData?.companies?.find(x=>x.companyId===c.id);
                return <div key={c.id} className="card" style={{borderTop:`3px solid ${c.color}`,marginBottom:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
                    <div style={{width:10,height:10,borderRadius:'50%',background:c.color,flexShrink:0}}/>
                    <div style={{flex:1}}><div style={{fontWeight:600,fontSize:14,color:'#e8edf8'}}>{c.name}</div><div style={{fontSize:11,color:'#3d5070'}}>{c.alias}</div></div>
                    {c.connected?<span className="bs">QB ✓</span>:<span className="bm">Sin conectar</span>}
                  </div>
                  {s?<div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:12}}>
                    <div style={{background:'#0d1526',borderRadius:8,padding:'10px',textAlign:'center'}}><div style={{fontSize:10,color:'#3d5070'}}>Ingresos</div><div style={{fontSize:14,fontWeight:700,color:'#22d3a5'}}>{fmtS(s.pl?.income)}</div></div>
                    <div style={{background:'#0d1526',borderRadius:8,padding:'10px',textAlign:'center'}}><div style={{fontSize:10,color:'#3d5070'}}>Gastos</div><div style={{fontSize:14,fontWeight:700,color:'#f87171'}}>{fmtS(s.pl?.expenses)}</div></div>
                    <div style={{background:'#0d1526',borderRadius:8,padding:'10px',textAlign:'center'}}><div style={{fontSize:10,color:'#3d5070'}}>Neto</div><div style={{fontSize:14,fontWeight:700,color:(s.pl?.net||0)>=0?'#22d3a5':'#f87171'}}>{fmtS(s.pl?.net)}</div></div>
                  </div>:<div style={{fontSize:12,color:'#3d5070',textAlign:'center',padding:'14px 0',marginBottom:12}}>Sin datos — sincroniza QB</div>}
                  <div style={{display:'flex',gap:6}}>
                    <button onClick={()=>window.open(`/api/qb/connect?company=${c.id}`,'_blank')} className="btn-g" style={{flex:1,justifyContent:'center',fontSize:12}}>{c.connected?'🔄 Reconectar':'🔗 Conectar QB'}</button>
                    {s&&<button onClick={()=>{setAnalysisType('company');runAnalysis('company',{company:c.name,transactions:s.transactions,period:selectedMonth,plData:s.pl});setView('dashboard');}} disabled={loading} className="btn-p" style={{flex:1,justifyContent:'center',fontSize:12}}>Analizar IA</button>}
                  </div>
                </div>;
              })}
            </div>
          </div>}

          {/* PERSONAL */}
          {view==='personal'&&<div className="fade-in">
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
              <div className="card">
                <div className="slabel">Exportar de tu banco</div>
                {[{bank:'Chase',steps:'Account → Download Activity → CSV'},{bank:'American Express',steps:'Account Services → Download → CSV'},{bank:'Bank of America',steps:'Accounts → Download → Date Range → CSV'},{bank:'Wells Fargo',steps:'Accounts → Download Activity → CSV'},{bank:'Capital One',steps:'Transactions → Download → CSV'}].map(b=>(
                  <div key={b.bank} className="tr" style={{fontSize:12}}>
                    <div style={{fontWeight:600,color:'#e8edf8',width:130,flexShrink:0}}>{b.bank}</div>
                    <div style={{color:'#7c8db5'}}>{b.steps}</div>
                  </div>
                ))}
              </div>
              <div className="card">
                <div className="slabel">Analizar movimientos</div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
                  <div><label style={{fontSize:11,color:'#3d5070',display:'block',marginBottom:3}}>PERSONA</label><select value={csvPerson} onChange={e=>setCsvPerson(e.target.value)} className="inp"><option>Jorge</option><option>Paola</option><option>Ambos</option></select></div>
                  <div><label style={{fontSize:11,color:'#3d5070',display:'block',marginBottom:3}}>BANCO</label><select value={csvSource} onChange={e=>setCsvSource(e.target.value)} className="inp">{['Chase','Amex','BofA','Wells Fargo','Capital One','Otro'].map(b=><option key={b}>{b}</option>)}</select></div>
                </div>
                <textarea value={csvContent} onChange={e=>setCsvContent(e.target.value)} placeholder="Pega aquí el contenido CSV del estado de cuenta..." className="inp" style={{minHeight:130,resize:'vertical',marginBottom:10}}/>
                <button onClick={()=>runAnalysis('csv',{csvContent,source:csvSource,person:csvPerson,month:selectedMonth})} disabled={loading||!csvContent.trim()} className="btn-p" style={{width:'100%',justifyContent:'center'}}>
                  {loading&&analysisType==='csv'?<><Spin size={12} color="#0d1526"/> Analizando…</>:'🤖 Analizar con Claude'}
                </button>
              </div>
            </div>
            {analysis&&analysisType==='csv'&&<div className="card"><AnalysisResult result={analysis} type="csv"/></div>}
          </div>}

          {/* REPORTES */}
          {view==='reportes'&&<div className="fade-in">
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:14,marginBottom:18}}>
              {[{id:'weekly',icon:'📊',title:'Reporte semanal',desc:'Resumen de transacciones, alertas y checklist. Reemplaza el bookkeeper de $200/mes.'},{id:'monthly',icon:'📋',title:'Cierre mensual',desc:'P&L completo, entradas de ajuste, documentos para el contador.'},{id:'personal',icon:'💳',title:'Gastos personales',desc:'Análisis de tarjetas de Jorge y Paola. Qué es deducible.'}].map(r=>(
                <div key={r.id} className="card" style={{display:'flex',flexDirection:'column',gap:12,marginBottom:0}}>
                  <div style={{fontSize:30}}>{r.icon}</div>
                  <div><div style={{fontWeight:600,fontSize:14,color:'#e8edf8',marginBottom:4}}>{r.title}</div><div style={{fontSize:13,color:'#7c8db5',lineHeight:1.5}}>{r.desc}</div></div>
                  <button onClick={()=>runAnalysis(r.id)} disabled={loading} className="btn-p" style={{marginTop:'auto',justifyContent:'center'}}>{loading&&analysisType===r.id?<Spin size={12} color="#0d1526"/>:'Generar con Claude'}</button>
                </div>
              ))}
            </div>
            {loading&&<div style={{display:'flex',gap:10,alignItems:'center',padding:'16px 0',color:'#7c8db5',fontSize:13}}><Spin/> Generando reporte…</div>}
            {analysis&&<div className="card"><AnalysisResult result={analysis} type={analysisType}/></div>}
          </div>}

          {/* ASESOR */}
          {view==='asesor'&&<div className="fade-in" style={{maxWidth:760}}>
            <div className="card" style={{marginBottom:10}}>
              <div className="slabel">Preguntas frecuentes</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {['¿Cuándo llego a $20k de ingreso pasivo?','¿Cuánto me pago de las empresas este mes?','¿Qué propiedad compro primero?','Dame el reporte semanal completo','Cierre mensual con entradas contables','¿Cómo optimizo mis impuestos en Florida?'].map(s=>(
                  <button key={s} onClick={()=>setChatInput(s)} className="btn-g" style={{fontSize:12,padding:'5px 12px'}}>{s}</button>
                ))}
              </div>
            </div>
            <div className="card">
              <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:14,maxHeight:420,overflowY:'auto',padding:'2px 0'}}>
                {chatHistory.length===0&&<div style={{textAlign:'center',padding:'32px 0',color:'#3d5070',fontSize:13}}>
                  <div style={{fontSize:32,marginBottom:8}}>◎</div>
                  Tu asesor financiero AI está listo.<br/>Meta: $20,000/mes de ingreso pasivo.
                </div>}
                {chatHistory.map((m,i)=><div key={i} className={m.role==='user'?'chat-u':'chat-a'}>{m.content}</div>)}
                {chatLoading&&<div style={{display:'flex',gap:8,alignItems:'center',color:'#7c8db5',fontSize:13,padding:'4px 0'}}><Spin size={12}/> El asesor está pensando…</div>}
                <div ref={chatEndRef}/>
              </div>
              <div style={{display:'flex',gap:8}}>
                <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendChat()} placeholder="Pregunta sobre tus finanzas, propiedades, impuestos..." className="inp" style={{flex:1}}/>
                <button onClick={sendChat} disabled={chatLoading||!chatInput.trim()} className="btn-p">
                  {chatLoading?<Spin size={12} color="#0d1526"/>:'Enviar →'}
                </button>
              </div>
            </div>
          </div>}

        </div>
      </main>
    </div>
  </>);
}

