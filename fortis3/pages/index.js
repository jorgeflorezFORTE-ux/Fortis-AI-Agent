import React,{useState,useEffect,useCallback,useRef} from 'react';
import {BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,LineChart,Line,Area,AreaChart} from 'recharts';

const C={bg:'#0B0F14',surface:'#121820',hover:'#1A2230',border:'#1E2A3A',accent:'#C8A46E',accentDim:'rgba(200,164,110,0.12)',green:'#34D399',greenDim:'rgba(52,211,153,0.12)',red:'#F87171',redDim:'rgba(248,113,113,0.12)',amber:'#FBBF24',amberDim:'rgba(251,191,36,0.12)',blue:'#60A5FA',blueDim:'rgba(96,165,250,0.12)',purple:'#A78BFA',purpleDim:'rgba(167,139,250,0.12)',teal:'#2DD4BF',pink:'#EC4899',text:'#E8ECF1',muted:'#7A8BA3',dim:'#4A5568'};
const CATS=[C.red,C.amber,C.blue,C.purple,C.teal,'#F472B6',C.green,C.muted,'#F59E0B','#EC4899'];
const fmt=n=>(n<0?'-':'')+'$'+Math.abs(Math.round(n)).toLocaleString('en-US');
const fmtDec=n=>(n<0?'-':'')+'$'+Math.abs(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const api=async(p,o={})=>{const r=await fetch(p,{headers:{'Content-Type':'application/json'},...o,body:o.body?JSON.stringify(o.body):undefined});return r.json();};

// ── Components ──
function Metric({label,value,sub,color,delay=0}){return(<div className="fade-up" style={{background:C.surface,borderRadius:12,padding:'18px 20px',border:'0.5px solid '+C.border,animationDelay:delay+'ms'}}><div style={{fontSize:12,color:C.muted,marginBottom:6,letterSpacing:'0.03em',textTransform:'uppercase'}}>{label}</div><div style={{fontSize:26,fontWeight:600,color:color||C.text,fontFeatureSettings:"'tnum'"}}>{value}</div>{sub&&<div style={{fontSize:12,color:C.muted,marginTop:4}}>{sub}</div>}</div>);}

function CatRow({cat,idx,isOpen,onToggle,txns}){
  return(<div style={{marginBottom:isOpen?0:4}}><div onClick={onToggle} style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',borderRadius:isOpen?'10px 10px 0 0':'10px',background:isOpen?C.hover:C.surface,border:'0.5px solid '+(isOpen?C.border:'transparent'),cursor:'pointer'}}>
    <span style={{fontSize:10,color:C.muted,transform:isOpen?'rotate(90deg)':'none',width:14,textAlign:'center',transition:'transform 0.2s'}}>&#9654;</span>
    <span style={{width:8,height:8,borderRadius:2,background:CATS[idx%CATS.length]}} /><span style={{flex:1,fontSize:13}}>{cat.name}</span>
    <div style={{width:80,height:4,borderRadius:2,background:C.border,overflow:'hidden'}}><div style={{height:'100%',width:Math.min(cat.pct,100)+'%',background:CATS[idx%CATS.length],borderRadius:2}} /></div>
    <span style={{fontSize:13,fontWeight:600,color:C.red,minWidth:75,textAlign:'right',fontFeatureSettings:"'tnum'"}}>{fmt(cat.amount)}</span>
    <span style={{fontSize:11,color:C.muted,minWidth:40,textAlign:'right'}}>{cat.pct}%</span></div>
    {isOpen&&(<div style={{border:'0.5px solid '+C.border,borderTop:'none',borderRadius:'0 0 10px 10px',overflow:'hidden',animation:'fadeUp 0.2s both'}}>
      {txns?.length>0?(<><div style={{display:'grid',gridTemplateColumns:'80px 1fr 90px 80px',padding:'8px 14px',fontSize:11,color:C.dim,borderBottom:'0.5px solid '+C.border,background:C.surface,textTransform:'uppercase',letterSpacing:'0.04em'}}><span>Fecha</span><span>Descripción</span><span style={{textAlign:'right'}}>Monto</span><span style={{textAlign:'right'}}>Método</span></div>
      {txns.map((t,i)=>(<div key={i} style={{display:'grid',gridTemplateColumns:'80px 1fr 90px 80px',padding:'10px 14px',fontSize:12,borderBottom:i<txns.length-1?'0.5px solid '+C.border:'none'}}><span style={{color:C.muted}}>{t.date?.slice(5)||'—'}</span><span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.description||'—'}</span><span style={{textAlign:'right',fontWeight:600,color:C.red}}>-{fmtDec(t.amount)}</span><span style={{textAlign:'right',color:C.muted,fontSize:11}}>{t.payment_method||'—'}</span></div>))}
      <div style={{display:'flex',justifyContent:'space-between',padding:'10px 14px',background:C.surface,borderTop:'0.5px solid '+C.border,fontSize:12}}><span style={{color:C.muted}}>{txns.length} transacciones</span><span style={{fontWeight:600,color:C.red}}>{fmt(cat.amount)} total</span></div></>)
      :(<div style={{padding:'20px 14px',textAlign:'center',color:C.muted,fontSize:13}}>Sube CSVs para ver detalle</div>)}
    </div>)}</div>);
}

function Insight({ins,delay=0}){
  const s={critical:{b:C.red,bg:C.redDim,c:C.red},warning:{b:C.amber,bg:C.amberDim,c:C.amber},info:{b:C.blue,bg:C.blueDim,c:C.blue},success:{b:C.green,bg:C.greenDim,c:C.green}}[ins.tipo]||{b:C.blue,bg:C.blueDim,c:C.blue};
  return(<div className="fade-up" style={{display:'flex',gap:14,padding:'16px 18px',background:C.surface,borderRadius:12,border:'0.5px solid '+C.border,borderLeft:'3px solid '+s.b,animationDelay:delay+'ms',marginBottom:10}}>
    <div style={{width:28,height:28,borderRadius:'50%',background:s.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:s.c,flexShrink:0}}>{ins.tipo==='success'?'✓':'!'}</div>
    <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,marginBottom:4}}>{ins.titulo}</div><div style={{fontSize:12,color:C.muted,lineHeight:1.6}}>{ins.descripcion}</div>
    {ins.ahorro_estimado>0&&<div style={{marginTop:8}}><span style={{fontSize:12,padding:'4px 10px',borderRadius:6,background:s.bg,color:s.c,fontWeight:600}}>Ahorro: {fmt(ins.ahorro_estimado)}/mes</span></div>}</div></div>);
}

function ChartTip({active,payload,label}){if(!active||!payload?.length)return null;return(<div style={{background:C.surface,border:'0.5px solid '+C.border,borderRadius:8,padding:'10px 14px',fontSize:12}}><div style={{color:C.muted,marginBottom:6,fontWeight:500}}>{label}</div>{payload.map((p,i)=>(<div key={i} style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}><span style={{width:8,height:8,borderRadius:2,background:p.color}}/><span style={{color:C.muted}}>{p.name}:</span><span style={{fontWeight:600}}>{fmt(p.value)}</span></div>))}</div>);}

function SbItem({item,active,collapsed,onClick}){return(<div onClick={onClick} style={{display:'flex',alignItems:'center',gap:10,padding:collapsed?'10px 6px':'10px 10px',borderRadius:8,cursor:'pointer',background:active?C.hover:'transparent',marginBottom:2,border:active?'0.5px solid '+C.border:'0.5px solid transparent'}}><div style={{width:30,height:30,borderRadius:8,background:active?item.color+'22':C.hover,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:600,color:item.color,flexShrink:0}}>{item.icon}</div>{!collapsed&&(<div style={{minWidth:0}}><div style={{fontSize:13,fontWeight:active?600:400,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.name}</div>{item.sub&&<div style={{fontSize:11,color:C.muted}}>{item.sub}</div>}</div>)}</div>);}

// ── MAIN ──
export default function Dashboard(){
  const [module,setModule]=useState('financial'); // financial|accounting|freedom
  const [activeEntity,setActiveEntity]=useState('all');
  const [tab,setTab]=useState('dashboard');
  const [openCat,setOpenCat]=useState(null);
  const [sideOpen,setSideOpen]=useState(true);
  const [year,setYear]=useState(2026);
  const [data,setData]=useState(null);
  const [entities,setEntities]=useState([]);
  const [mappings,setMappings]=useState([]);
  const [analysis,setAnalysis]=useState(null);
  const [analyzing,setAnalyzing]=useState(false);
  const [catTxns,setCatTxns]=useState({});
  const [chatMsg,setChatMsg]=useState('');
  const [chatHistory,setChatHistory]=useState([]);
  const [chatLoading,setChatLoading]=useState(false);
  const [uploading,setUploading]=useState(false);
  const [uploadQueue,setUploadQueue]=useState([]);
  const [uploadTarget,setUploadTarget]=useState('auto');
  const [freedomData,setFreedomData]=useState(null);
  const [reconData,setReconData]=useState(null);
  const [reconAnalysis,setReconAnalysis]=useState(null);
  const [scorecard,setScorecard]=useState(null);
  const [showAddAsset,setShowAddAsset]=useState(false);
  const [showAddLiab,setShowAddLiab]=useState(false);
  const [newAsset,setNewAsset]=useState({name:'',type:'property',value:'',monthlyIncome:''});
  const [newLiab,setNewLiab]=useState({name:'',type:'mortgage',balance:'',monthlyPayment:''});
  const [showAddAccount,setShowAddAccount]=useState(false);
  const [newAcc,setNewAcc]=useState({digits:'',label:'',entity:'',bank:'Chase'});
  const fileRef=useRef(null);
  const isP=activeEntity?.startsWith('personal-');

  // Load
  const load=useCallback(async()=>{
    try{
      const d=await api('/api/dashboard?company='+activeEntity+'&year='+year);
      setData(d); if(d.entities)setEntities(d.entities);
    }catch(e){}
  },[activeEntity,year]);
  useEffect(()=>{load();},[load]);
  useEffect(()=>{api('/api/accounts/map').then(r=>{if(r.mappings)setMappings(r.mappings);}).catch(()=>{});},[]);

  const loadCatTxns=async n=>{if(catTxns[n])return;try{const r=await api('/api/transactions?category='+encodeURIComponent(n)+'&company='+activeEntity+'&start='+year+'-01-01&end='+year+'-12-31');setCatTxns(p=>({...p,[n]:r.transactions}));}catch(e){}};
  const runAnalysis=async()=>{setAnalyzing(true);try{const r=await api('/api/financial/analyze',{method:'POST',body:{company:activeEntity,year}});setAnalysis(r);}catch(e){}setAnalyzing(false);};
  const sendChat=async()=>{if(!chatMsg.trim())return;const m=chatMsg;setChatMsg('');setChatHistory(p=>[...p,{role:'user',text:m}]);setChatLoading(true);try{const r=await api('/api/financial/chat',{method:'POST',body:{message:m,company:activeEntity,year}});setChatHistory(p=>[...p,{role:'ai',text:r.response}]);}catch(e){setChatHistory(p=>[...p,{role:'ai',text:'Error.'}]);}setChatLoading(false);};
  const handleMultiUpload=async e=>{const files=Array.from(e.target.files||[]);if(!files.length)return;setUploading(true);const q=files.map(f=>({filename:f.name,status:'pending',file:f}));setUploadQueue(q);for(let i=0;i<files.length;i++){try{const t=await files[i].text();const body={csvContent:t,filename:files[i].name};if(uploadTarget!=='auto')body.accountId=uploadTarget;const r=await api('/api/personal/upload',{method:'POST',body});if(r.error)q[i]={...q[i],status:'error',error:r.error+(r.message?' - '+r.message:'')};else q[i]={...q[i],status:'done',targetName:r.sourceName||r.targetEntity,count:r.totalTransactions||0,expenses:r.totalExpenses||0,income:r.totalIncome||0,autoDetected:r.autoDetected};}catch(er){q[i]={...q[i],status:'error',error:'Error'};}setUploadQueue([...q]);}setUploading(false);await load();e.target.value='';};
  const loadFreedom=async()=>{try{const r=await api('/api/freedom');setFreedomData(r);}catch(e){}};
  const loadRecon=async()=>{try{const r=await api('/api/accounting/reconcile',{method:'POST',body:{company:activeEntity,year,month:new Date().getMonth()+1}});setReconData(r);}catch(e){}};
  const runReconAnalysis=async()=>{setAnalyzing(true);try{const r=await api('/api/accounting/analyze',{method:'POST',body:{company:activeEntity,year,month:new Date().getMonth()+1}});setReconAnalysis(r.analysis);}catch(e){}setAnalyzing(false);};
  const runScorecard=async()=>{try{const r=await api('/api/scorecard',{method:'POST',body:{year,month:new Date().getMonth()+1}});setScorecard(r);}catch(e){}};
  const addAssetHandler=async()=>{if(!newAsset.name)return;await api('/api/freedom',{method:'POST',body:{action:'addAsset',...newAsset,value:parseFloat(newAsset.value)||0,monthlyIncome:parseFloat(newAsset.monthlyIncome)||0}});setNewAsset({name:'',type:'property',value:'',monthlyIncome:''});setShowAddAsset(false);loadFreedom();};
  const addLiabHandler=async()=>{if(!newLiab.name)return;await api('/api/freedom',{method:'POST',body:{action:'addLiability',...newLiab,balance:parseFloat(newLiab.balance)||0,monthlyPayment:parseFloat(newLiab.monthlyPayment)||0}});setNewLiab({name:'',type:'mortgage',balance:'',monthlyPayment:''});setShowAddLiab(false);loadFreedom();};
  const addAccountHandler=async()=>{if(!newAcc.digits||newAcc.digits.length!==4||!newAcc.entity||!newAcc.label)return;await api('/api/accounts/map',{method:'POST',body:{digits:newAcc.digits,entity:newAcc.entity,label:newAcc.label,bank:newAcc.bank}});const r=await api('/api/accounts/map');if(r.mappings)setMappings(r.mappings);setNewAcc({digits:'',label:'',entity:'',bank:'Chase'});setShowAddAccount(false);};

  const sw=id=>{setActiveEntity(id);setTab('dashboard');setOpenCat(null);setAnalysis(null);setCatTxns({});};
  const bizEntities=entities.filter(e=>e.type==='business');
  const persEntities=entities.filter(e=>e.type==='personal');
  const vd=data;
  const cats=(vd?.categories||[]).map((c,i)=>({...c,transactions:catTxns[c.name]||null,color:CATS[i%CATS.length]}));
  const pieD=cats.map(c=>({name:c.name,value:c.amount,color:c.color}));

  const MODULE_TABS={financial:[{id:'dashboard',l:'Dashboard'},{id:'gastos',l:'Gastos'},{id:'upload',l:'Subir archivos'},{id:'advisor',l:'Asesor AI'},{id:'chat',l:'Chat'}],accounting:[{id:'reconcile',l:'Reconciliación'},{id:'accounting-ai',l:'Asesor contable'},{id:'config',l:'Configuración'}],freedom:[{id:'freedom-dash',l:'Mi progreso'},{id:'assets',l:'Activos'},{id:'liabilities',l:'Deudas'},{id:'scorecard',l:'Scorecard'}]};
  const tabs=MODULE_TABS[module]||[];

  return(
    <div style={{display:'flex',minHeight:'100vh',background:C.bg,color:C.text,fontFamily:"'DM Sans',system-ui,sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}.fade-up{animation:fadeUp .4s both}`}</style>

      {/* SIDEBAR */}
      <div style={{width:sideOpen?280:60,background:C.surface,borderRight:'0.5px solid '+C.border,display:'flex',flexDirection:'column',transition:'width 0.3s',overflow:'hidden',flexShrink:0}}>
        <div style={{padding:sideOpen?'20px 18px':'20px 12px',borderBottom:'0.5px solid '+C.border,display:'flex',alignItems:'center',gap:10,cursor:'pointer'}} onClick={()=>setSideOpen(!sideOpen)}>
          <div style={{width:34,height:34,borderRadius:8,background:'linear-gradient(135deg,#C8A46E,#E8D5B0)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:700,color:'#0B0F14',flexShrink:0}}>F</div>
          {sideOpen&&<div><div style={{fontSize:15,fontWeight:700,letterSpacing:'-0.02em'}}>Fortis 3.0</div><div style={{fontSize:11,color:C.muted}}>Asesor financiero AI</div></div>}
        </div>

        {/* Module selector */}
        {sideOpen&&(<div style={{display:'flex',gap:4,padding:'12px 10px 8px'}}>
          {[{id:'financial',l:'💰 Financiero',c:C.green},{id:'accounting',l:'📋 Contable',c:C.blue},{id:'freedom',l:'🎯 Libertad',c:C.amber}].map(m=>(
            <div key={m.id} onClick={()=>{setModule(m.id);setTab(MODULE_TABS[m.id][0].id);if(m.id==='freedom')loadFreedom();if(m.id==='accounting')loadRecon();}} style={{flex:1,padding:'8px 4px',borderRadius:8,fontSize:11,fontWeight:module===m.id?600:400,color:module===m.id?m.c:C.muted,background:module===m.id?m.c+'18':'transparent',textAlign:'center',cursor:'pointer',border:module===m.id?'0.5px solid '+m.c+'33':'0.5px solid transparent'}}>{m.l}</div>
          ))}
        </div>)}

        {module==='financial'&&(<div style={{flex:1,overflow:'auto',padding:'0 8px'}}>
          {sideOpen&&<div style={{padding:'8px 10px 4px',fontSize:10,textTransform:'uppercase',letterSpacing:'0.08em',color:C.dim,fontWeight:600}}>Empresas</div>}
          <SbItem item={{id:'all',name:'Consolidado',icon:'◆',color:C.accent}} active={activeEntity==='all'} collapsed={!sideOpen} onClick={()=>sw('all')}/>
          {bizEntities.map(e=><SbItem key={e.id} item={{...e,name:e.short_name||e.name,sub:e.category}} active={activeEntity===e.id} collapsed={!sideOpen} onClick={()=>sw(e.id)}/>)}
          {sideOpen&&<div style={{height:1,background:C.border,margin:'10px 10px'}}/>}
          {sideOpen&&<div style={{padding:'4px 10px 4px',fontSize:10,textTransform:'uppercase',letterSpacing:'0.08em',color:C.dim,fontWeight:600}}>Gastos personales</div>}
          {persEntities.map(e=><SbItem key={e.id} item={{...e,name:e.short_name||e.name,sub:e.category}} active={activeEntity===e.id} collapsed={!sideOpen} onClick={()=>sw(e.id)}/>)}
        </div>)}

        {module!=='financial'&&sideOpen&&(<div style={{flex:1,padding:'20px 18px',color:C.muted,fontSize:12,lineHeight:1.6}}>
          {module==='accounting'&&<div><div style={{fontWeight:600,color:C.text,marginBottom:8}}>Asesor Contable</div>Cruza banco vs QuickBooks. Detecta errores de clasificación. Optimiza taxes.</div>}
          {module==='freedom'&&<div><div style={{fontWeight:600,color:C.text,marginBottom:8}}>Libertad Financiera</div>Meta: $20,000/mes en ingreso pasivo. Trackea activos, deudas y net worth.</div>}
        </div>)}

        {sideOpen&&(<div style={{padding:14,borderTop:'0.5px solid '+C.border}}>
          <div style={{display:'flex',justifyContent:'center',gap:8}}>{[2024,2025,2026].map(y=><span key={y} onClick={()=>setYear(y)} style={{fontSize:12,padding:'3px 10px',borderRadius:6,cursor:'pointer',background:year===y?C.accentDim:'transparent',color:year===y?C.accent:C.dim,fontWeight:year===y?600:400}}>{y}</span>)}</div>
        </div>)}
      </div>

      {/* MAIN */}
      <div style={{flex:1,overflow:'auto',padding:'0 28px 40px'}}>
        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 0 20px',borderBottom:'0.5px solid '+C.border,marginBottom:20,position:'sticky',top:0,background:C.bg,zIndex:10}}>
          <div>
            <div style={{fontSize:18,fontWeight:600}}>{module==='financial'?(entities.find(e=>e.id===activeEntity)?.name||'Consolidado'):module==='accounting'?'Asesor Contable':'Libertad Financiera'}</div>
            <div style={{fontSize:12,color:C.muted}}>Fortis 3.0 · {year}</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:4,marginBottom:24,flexWrap:'wrap'}}>
          {tabs.map(t=><div key={t.id} onClick={()=>{setTab(t.id);if(t.id==='advisor'&&!analysis)runAnalysis();if(t.id==='reconcile'&&!reconData)loadRecon();if(t.id==='accounting-ai'&&!reconAnalysis){loadRecon();runReconAnalysis();}if(t.id==='freedom-dash'&&!freedomData)loadFreedom();if(t.id==='scorecard'&&!scorecard)runScorecard();}} style={{padding:'8px 18px',borderRadius:8,fontSize:13,fontWeight:tab===t.id?600:400,color:tab===t.id?C.accent:C.muted,background:tab===t.id?C.accentDim:'transparent',cursor:'pointer',border:tab===t.id?'0.5px solid '+C.accent+'33':'0.5px solid transparent'}}>{t.l}</div>)}
        </div>

        {/* ═══ FINANCIAL MODULE ═══ */}
        {module==='financial'&&tab==='dashboard'&&vd&&(<div className="fade-up">
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:12,marginBottom:28}}>
            <Metric label="Ingresos" value={fmt(vd.totalIncome)} color={C.green}/>
            <Metric label="Gastos" value={fmt(vd.totalExpenses)} color={C.red} sub={vd.totalExpenses>vd.totalIncome?'En pérdida':'Controlado'} delay={60}/>
            <Metric label="Neto" value={fmt(vd.net)} color={vd.net>=0?C.green:C.red} sub={vd.margin?'Margen: '+vd.margin+'%':''} delay={120}/>
            <Metric label="Categorías" value={vd.categories?.length||0} sub="de gasto" delay={180}/>
          </div>
          {vd.global&&(<div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:24}}>
            <div style={{background:C.surface,borderRadius:10,padding:'14px 16px',border:'0.5px solid '+C.border}}><div style={{fontSize:11,color:C.muted,textTransform:'uppercase',marginBottom:4}}>Empresas</div><div style={{fontSize:20,fontWeight:600,color:vd.global.business.net>=0?C.green:C.red}}>{fmt(vd.global.business.net)}</div></div>
            <div style={{background:C.surface,borderRadius:10,padding:'14px 16px',border:'0.5px solid '+C.border}}><div style={{fontSize:11,color:C.muted,textTransform:'uppercase',marginBottom:4}}>Personal</div><div style={{fontSize:20,fontWeight:600,color:vd.global.personal.net>=0?C.green:C.red}}>{fmt(vd.global.personal.net)}</div></div>
            <div style={{background:C.surface,borderRadius:10,padding:'14px 16px',border:'0.5px solid '+C.border}}><div style={{fontSize:11,color:C.muted,textTransform:'uppercase',marginBottom:4}}>Total</div><div style={{fontSize:20,fontWeight:600,color:vd.global.total.net>=0?C.green:C.red}}>{fmt(vd.global.total.net)}</div></div>
          </div>)}
          <div style={{display:'grid',gridTemplateColumns:'1.3fr 0.7fr',gap:20,marginBottom:24}}>
            <div style={{background:C.surface,borderRadius:12,border:'0.5px solid '+C.border,padding:'18px 20px'}}>
              <div style={{fontSize:13,fontWeight:600,marginBottom:16}}>Ingresos vs gastos — {year}</div>
              <div style={{height:260}}><ResponsiveContainer width="100%" height="100%"><BarChart data={vd.monthlyChart} barGap={2}><CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/><XAxis dataKey="month" tick={{fill:C.muted,fontSize:11}} axisLine={false} tickLine={false}/><YAxis tick={{fill:C.muted,fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>fmt(v)} width={60}/><Tooltip content={<ChartTip/>}/><Bar dataKey="income" name="Ingresos" fill={C.green} radius={[3,3,0,0]} maxBarSize={24}/><Bar dataKey="expenses" name="Gastos" fill={C.red} radius={[3,3,0,0]} maxBarSize={24}/></BarChart></ResponsiveContainer></div>
            </div>
            <div style={{background:C.surface,borderRadius:12,border:'0.5px solid '+C.border,padding:'18px 20px'}}>
              <div style={{fontSize:13,fontWeight:600,marginBottom:8}}>Distribución gastos</div>
              {pieD.length>0?(<><div style={{height:180}}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieD} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" stroke="none">{pieD.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie></PieChart></ResponsiveContainer></div>{pieD.slice(0,5).map((p,i)=>(<div key={i} style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:C.muted,marginBottom:2}}><span style={{width:8,height:8,borderRadius:2,background:p.color}}/>{p.name}: {fmt(p.value)}</div>))}</>):(<div style={{padding:40,textAlign:'center',color:C.dim}}>Sube CSVs</div>)}
            </div>
          </div>
          {vd.perCompany&&(<div><div style={{fontSize:14,fontWeight:600,marginBottom:12}}>Por empresa</div><div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:12}}>{vd.perCompany.filter(c=>c.totalIncome>0||c.totalExpenses>0).map(co=>(<div key={co.id} onClick={()=>sw(co.id)} style={{background:C.surface,borderRadius:12,border:'0.5px solid '+C.border,padding:'16px 18px',cursor:'pointer'}}><div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}><span style={{width:10,height:10,borderRadius:'50%',background:co.color}}/><span style={{fontSize:13,fontWeight:600}}>{co.name}</span></div><div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:2}}><span style={{color:C.muted}}>Ingresos</span><span style={{color:C.green}}>{fmt(co.totalIncome)}</span></div><div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:2}}><span style={{color:C.muted}}>Gastos</span><span style={{color:C.red}}>{fmt(co.totalExpenses)}</span></div><div style={{display:'flex',justifyContent:'space-between',fontSize:13,fontWeight:600,paddingTop:6,borderTop:'0.5px solid '+C.border}}><span>Neto</span><span style={{color:co.net>=0?C.green:C.red}}>{fmt(co.net)}</span></div></div>))}</div></div>)}
        </div>)}

        {module==='financial'&&tab==='gastos'&&vd&&(<div className="fade-up">
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:24}}>
            <Metric label="Total gastos" value={fmt(vd.totalExpenses)} color={C.red}/>
            <Metric label="Categorías" value={cats.length} delay={60}/>
            <Metric label="Transacciones" value={cats.reduce((s,c)=>s+(c.count||0),0)} delay={120}/>
          </div>
          {cats.map((c,i)=><CatRow key={c.name} cat={c} idx={i} isOpen={openCat===c.name} onToggle={()=>{setOpenCat(openCat===c.name?null:c.name);loadCatTxns(c.name);}} txns={catTxns[c.name]}/>)}
          {cats.length===0&&<div style={{textAlign:'center',padding:40,color:C.muted}}>Sube CSVs en "Subir archivos"</div>}
        </div>)}

        {module==='financial'&&tab==='upload'&&(<div className="fade-up">
          <div style={{fontSize:15,fontWeight:600,marginBottom:4}}>Centro de carga</div>
          <div style={{fontSize:12,color:C.muted,marginBottom:16}}>Sube CSVs de Chase o Amex. Fortis detecta la cuenta y clasifica automáticamente.</div>
          <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:16}}>
            <span style={{fontSize:12,color:C.muted}}>Destino:</span>
            <select value={uploadTarget} onChange={e=>setUploadTarget(e.target.value)} style={{padding:'8px 12px',borderRadius:8,border:'0.5px solid '+C.border,background:C.surface,color:C.text,fontSize:13,outline:'none'}}>
              <option value="auto">Automático (4 dígitos)</option>
              <optgroup label="Empresas">{bizEntities.map(e=><option key={e.id} value={e.id}>{e.short_name||e.name}</option>)}</optgroup>
              <optgroup label="Personal">{persEntities.map(e=><option key={e.id} value={e.id}>{e.short_name||e.name}</option>)}</optgroup>
            </select>
          </div>
          <div style={{background:C.surface,borderRadius:12,border:'1px dashed '+C.border,padding:'32px 24px',textAlign:'center',marginBottom:20}}>
            <div style={{fontSize:14,fontWeight:500,marginBottom:6}}>Arrastra o selecciona archivos</div>
            <div style={{fontSize:12,color:C.muted,marginBottom:16}}>Puedes subir varios a la vez</div>
            <input ref={fileRef} type="file" accept=".csv,.tsv,.txt" multiple onChange={handleMultiUpload} style={{display:'none'}}/>
            <div onClick={()=>fileRef.current?.click()} style={{display:'inline-flex',padding:'10px 24px',borderRadius:8,background:C.accentDim,color:C.accent,fontSize:13,fontWeight:600,cursor:'pointer',border:'0.5px solid '+C.accent+'33'}}>{uploading?'Procesando...':'📁 Seleccionar archivos'}</div>
          </div>
          {uploadQueue.length>0&&(<div style={{marginBottom:20}}>{uploadQueue.map((u,i)=>(<div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',background:C.surface,borderRadius:10,border:'0.5px solid '+C.border,marginBottom:4}}>
            <span>{u.status==='done'?'✅':u.status==='error'?'❌':'⏳'}</span>
            <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500}}>{u.filename}</div><div style={{fontSize:11,color:C.muted}}>{u.status==='done'?'→ '+u.targetName+' · '+u.count+' txns'+(u.autoDetected?' (auto)':' (manual)'):u.status==='error'?u.error:'...'}</div></div>
            {u.status==='done'&&<div style={{textAlign:'right'}}><div style={{fontSize:13,color:C.red,fontWeight:500}}>{fmt(u.expenses)}</div><div style={{fontSize:11,color:C.green}}>{fmt(u.income)}</div></div>}
          </div>))}</div>)}
          {/* Account map */}
          <div style={{background:C.surface,borderRadius:12,border:'0.5px solid '+C.border,padding:'16px 18px'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}><span style={{fontSize:13,fontWeight:600}}>Cuentas registradas</span><span onClick={()=>setShowAddAccount(!showAddAccount)} style={{fontSize:12,padding:'4px 12px',borderRadius:6,background:C.accentDim,color:C.accent,cursor:'pointer'}}>+ Agregar</span></div>
            {showAddAccount&&(<div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap',padding:12,background:C.bg,borderRadius:8}}>
              <input value={newAcc.digits} onChange={e=>setNewAcc({...newAcc,digits:e.target.value.replace(/\D/g,'').slice(0,4)})} placeholder="4 dígitos" style={{padding:'8px 10px',borderRadius:6,border:'0.5px solid '+C.border,background:C.surface,color:C.text,fontSize:13,width:80,outline:'none',fontFamily:'monospace'}}/>
              <input value={newAcc.label} onChange={e=>setNewAcc({...newAcc,label:e.target.value})} placeholder="Nombre" style={{padding:'8px 10px',borderRadius:6,border:'0.5px solid '+C.border,background:C.surface,color:C.text,fontSize:13,width:180,outline:'none'}}/>
              <select value={newAcc.entity} onChange={e=>setNewAcc({...newAcc,entity:e.target.value})} style={{padding:'8px 10px',borderRadius:6,border:'0.5px solid '+C.border,background:C.surface,color:C.text,fontSize:13,outline:'none'}}>
                <option value="">Destino...</option>
                <optgroup label="Empresas">{bizEntities.map(e=><option key={e.id} value={e.id}>{e.short_name||e.name}</option>)}</optgroup>
                <optgroup label="Personal">{persEntities.map(e=><option key={e.id} value={e.id}>{e.short_name||e.name}</option>)}</optgroup>
              </select>
              <select value={newAcc.bank} onChange={e=>setNewAcc({...newAcc,bank:e.target.value})} style={{padding:'8px 10px',borderRadius:6,border:'0.5px solid '+C.border,background:C.surface,color:C.text,fontSize:13,outline:'none'}}><option>Chase</option><option>Amex</option></select>
              <span onClick={addAccountHandler} style={{padding:'8px 14px',borderRadius:6,background:C.greenDim,color:C.green,cursor:'pointer',fontSize:12,fontWeight:600}}>Guardar</span>
            </div>)}
            <div style={{display:'grid',gridTemplateColumns:'60px 1fr 120px 60px 30px',gap:'4px 12px',fontSize:12}}>
              <span style={{color:C.dim,fontWeight:500}}>Cuenta</span><span style={{color:C.dim,fontWeight:500}}>Nombre</span><span style={{color:C.dim,fontWeight:500}}>Empresa</span><span style={{color:C.dim,fontWeight:500}}>Tipo</span><span></span>
              {mappings.map((m,i)=>(<React.Fragment key={i}><span style={{color:C.accent,fontFamily:'monospace',fontWeight:600}}>{m.digits}</span><span>{m.label}</span><span style={{color:m.entity_color||C.muted,fontSize:11}}>{m.short_name||m.entity_name||m.entity_id}</span><span style={{color:m.entity_type==='business'?C.blue:C.amber,fontSize:11}}>{m.entity_type==='business'?'Empresa':'Personal'}</span><span onClick={async()=>{await api('/api/accounts/map',{method:'DELETE',body:{digits:m.digits}});const r=await api('/api/accounts/map');if(r.mappings)setMappings(r.mappings);}} style={{color:C.red,cursor:'pointer',fontSize:11}}>×</span></React.Fragment>))}
            </div>
          </div>
        </div>)}

        {module==='financial'&&tab==='advisor'&&(<div className="fade-up">
          {analyzing&&<div style={{textAlign:'center',padding:40,color:C.muted}}>Analizando con Claude AI...</div>}
          {analysis&&!analyzing&&(<>
            {analysis.proyeccion&&(<div style={{background:C.surface,borderRadius:12,border:'0.5px solid '+C.border,padding:'20px 24px',marginBottom:20,display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:20}}>
              <div><div style={{fontSize:11,color:C.muted,textTransform:'uppercase',marginBottom:6}}>Actual</div><div style={{fontSize:28,fontWeight:700,color:analysis.proyeccion.neto_actual>=0?C.green:C.red}}>{fmt(analysis.proyeccion.neto_actual)}<span style={{fontSize:14,color:C.muted}}>/mes</span></div></div>
              <div><div style={{fontSize:11,color:C.muted,textTransform:'uppercase',marginBottom:6}}>Ahorro posible</div><div style={{fontSize:28,fontWeight:700,color:C.green}}>{fmt(analysis.proyeccion.ahorro_total_posible)}<span style={{fontSize:14,color:C.muted}}>/mes</span></div></div>
              <div><div style={{fontSize:11,color:C.muted,textTransform:'uppercase',marginBottom:6}}>Proyectado</div><div style={{fontSize:28,fontWeight:700,color:C.green}}>+{fmt(analysis.proyeccion.neto_proyectado)}<span style={{fontSize:14,color:C.muted}}>/mes</span></div></div>
            </div>)}
            {analysis.diagnostico&&<div style={{padding:'14px 18px',borderRadius:12,background:C.surface,border:'0.5px solid '+C.border,marginBottom:16,fontSize:13,color:C.muted,lineHeight:1.6}}>{analysis.diagnostico}</div>}
            {analysis.insights?.map((ins,i)=><Insight key={i} ins={ins} delay={i*80}/>)}
          </>)}
        </div>)}

        {module==='financial'&&tab==='chat'&&(<div className="fade-up" style={{display:'flex',flexDirection:'column',height:'calc(100vh - 180px)'}}>
          <div style={{flex:1,overflow:'auto',marginBottom:16}}>
            {chatHistory.length===0&&<div style={{textAlign:'center',padding:'60px 20px',color:C.muted}}><div style={{fontSize:14,fontWeight:500,marginBottom:8}}>Chat con Fortis</div><div style={{display:'flex',flexWrap:'wrap',gap:8,justifyContent:'center',marginTop:16}}>{['¿En qué gasto más?','¿Cómo reducir gastos?','¿Qué empresa es más rentable?','¿Debería evaluar S Corp?'].map(q=><div key={q} onClick={()=>setChatMsg(q)} style={{fontSize:12,padding:'6px 12px',borderRadius:8,background:C.surface,border:'0.5px solid '+C.border,cursor:'pointer',color:C.muted}}>{q}</div>)}</div></div>}
            {chatHistory.map((m,i)=>(<div key={i} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start',marginBottom:10}}><div style={{maxWidth:'80%',padding:'10px 14px',borderRadius:12,fontSize:13,lineHeight:1.6,background:m.role==='user'?C.accentDim:C.surface,border:m.role==='ai'?'0.5px solid '+C.border:'none',color:m.role==='user'?C.accent:C.text,whiteSpace:'pre-wrap'}}>{m.text}</div></div>))}
            {chatLoading&&<div style={{padding:10,color:C.muted,fontSize:13}}>Pensando...</div>}
          </div>
          <div style={{display:'flex',gap:8}}><input value={chatMsg} onChange={e=>setChatMsg(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendChat()} placeholder="Pregunta sobre tus finanzas..." style={{flex:1,padding:'12px 16px',borderRadius:10,border:'0.5px solid '+C.border,background:C.surface,color:C.text,fontSize:13,outline:'none'}}/><button onClick={sendChat} style={{padding:'12px 20px',borderRadius:10,background:C.accentDim,color:C.accent,border:'0.5px solid '+C.accent+'33',fontSize:13,fontWeight:600,cursor:'pointer'}}>Enviar</button></div>
        </div>)}

        {/* ═══ ACCOUNTING MODULE ═══ */}
        {module==='accounting'&&tab==='reconcile'&&(<div className="fade-up">
          <div style={{fontSize:15,fontWeight:600,marginBottom:16}}>Reconciliación banco vs QuickBooks</div>
          {reconData?(<>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:12,marginBottom:24}}>
              <Metric label="Transacciones" value={reconData.summary?.totalTransactions||reconData.globalSummary?.totalViolations!==undefined?Object.values(reconData.perCompany||{}).reduce((s,r)=>s+r.summary.totalTransactions,0):0}/>
              <Metric label="Violaciones" value={reconData.violationCount||reconData.globalSummary?.totalViolations||0} color={(reconData.violationCount||reconData.globalSummary?.totalViolations||0)>0?C.red:C.green}/>
              <Metric label="Duplicados" value={reconData.duplicateCount||reconData.globalSummary?.totalDuplicates||0} color={(reconData.duplicateCount||reconData.globalSummary?.totalDuplicates||0)>0?C.amber:C.green}/>
              <Metric label="Estado" value={reconData.reconciliation?.matchRate?reconData.reconciliation.matchRate+'%':reconData.globalSummary?.status||'—'} color={reconData.globalSummary?.status==='clean'?C.green:C.amber}/>
            </div>
            {reconData.violations?.slice(0,10).map((v,i)=>(<div key={i} style={{padding:'12px 16px',background:C.surface,borderRadius:10,border:'0.5px solid '+C.border,borderLeft:'3px solid '+C.red,marginBottom:6}}>
              <div style={{fontSize:13,fontWeight:500}}>{v.transaction.description} — {fmt(v.transaction.amount)}</div>
              {v.warnings.map((w,j)=>(<div key={j} style={{fontSize:12,color:C.muted,marginTop:4}}>{w.message} → <span style={{color:C.amber}}>{w.suggestion}</span></div>))}
            </div>))}
            {reconData.perCompany&&Object.entries(reconData.perCompany).map(([id,r])=>(<div key={id} style={{background:C.surface,borderRadius:10,border:'0.5px solid '+C.border,padding:'14px 16px',marginBottom:8}}>
              <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>{id} — {r.violationCount} violaciones, {r.duplicateCount} duplicados</div>
              <div style={{fontSize:12,color:C.muted}}>Ingresos: {fmt(r.summary.totalIncome)} · Gastos: {fmt(r.summary.totalExpenses)} · Neto: {fmt(r.summary.net)}</div>
            </div>))}
          </>):(<div style={{textAlign:'center',padding:40,color:C.muted}}>Cargando reconciliación...</div>)}
        </div>)}

        {module==='accounting'&&tab==='accounting-ai'&&(<div className="fade-up">
          <div style={{fontSize:15,fontWeight:600,marginBottom:16}}>Asesor Contable AI</div>
          {analyzing&&<div style={{textAlign:'center',padding:40,color:C.muted}}>Analizando contabilidad...</div>}
          {reconAnalysis&&!analyzing&&(<>
            <div style={{padding:'16px 20px',borderRadius:12,background:reconAnalysis.calificacion==='limpio'?C.greenDim:reconAnalysis.calificacion==='critico'?C.redDim:C.amberDim,border:'0.5px solid '+(reconAnalysis.calificacion==='limpio'?C.green:reconAnalysis.calificacion==='critico'?C.red:C.amber)+'33',marginBottom:16}}>
              <div style={{fontSize:20,fontWeight:700,color:reconAnalysis.calificacion==='limpio'?C.green:reconAnalysis.calificacion==='critico'?C.red:C.amber,textTransform:'uppercase'}}>{reconAnalysis.calificacion}</div>
              <div style={{fontSize:13,color:C.muted,marginTop:4}}>{reconAnalysis.resumen}</div>
            </div>
            {reconAnalysis.ajustes_requeridos?.map((a,i)=>(<div key={i} style={{padding:'14px 16px',background:C.surface,borderRadius:10,border:'0.5px solid '+C.border,borderLeft:'3px solid '+(a.prioridad==='alta'?C.red:a.prioridad==='media'?C.amber:C.blue),marginBottom:8}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{fontSize:13,fontWeight:600}}>{a.descripcion}</span><span style={{fontSize:13,fontWeight:600,color:C.red}}>{a.monto?fmt(a.monto):''}</span></div>
              <div style={{fontSize:12,color:C.muted}}>{a.tipo} {a.de_empresa?'· De: '+a.de_empresa:''} {a.a_empresa?'→ A: '+a.a_empresa:''}</div>
            </div>))}
            {reconAnalysis.alertas?.map((a,i)=>(<div key={i} style={{padding:'10px 14px',fontSize:12,color:a.severidad==='alta'?C.red:a.severidad==='media'?C.amber:C.muted,background:C.surface,borderRadius:8,marginBottom:4}}>{a.mensaje}</div>))}
          </>)}
          {!reconAnalysis&&!analyzing&&<div onClick={runReconAnalysis} style={{textAlign:'center',padding:40,color:C.accent,cursor:'pointer'}}>Clic para ejecutar análisis contable AI</div>}
        </div>)}

        {module==='accounting'&&tab==='config'&&(<div className="fade-up">
          <div style={{fontSize:15,fontWeight:600,marginBottom:16}}>Configuración de empresas</div>
          {entities.map(e=>(<div key={e.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',background:C.surface,borderRadius:10,border:'0.5px solid '+C.border,marginBottom:6}}>
            <div style={{width:30,height:30,borderRadius:8,background:e.color+'22',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:600,color:e.color}}>{e.icon}</div>
            <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500}}>{e.name}</div><div style={{fontSize:11,color:C.muted}}>{e.category} {e.ein?'· EIN: '+e.ein:''}</div></div>
            <span style={{fontSize:11,padding:'3px 8px',borderRadius:4,background:e.active?C.greenDim:C.redDim,color:e.active?C.green:C.red}}>{e.active?'Activa':'Inactiva'}</span>
            <span style={{fontSize:11,color:e.type==='business'?C.blue:C.amber}}>{e.type}</span>
          </div>))}
        </div>)}

        {/* ═══ FREEDOM MODULE ═══ */}
        {module==='freedom'&&tab==='freedom-dash'&&(<div className="fade-up">
          {freedomData?(<>
            {/* FIN Score */}
            <div style={{background:C.surface,borderRadius:12,border:'0.5px solid '+C.border,padding:'24px',marginBottom:24,textAlign:'center'}}>
              <div style={{fontSize:12,color:C.muted,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>FIN Score — Libertad Financiera</div>
              <div style={{fontSize:56,fontWeight:700,color:freedomData.finScore>=100?C.green:freedomData.finScore>=50?C.amber:C.red}}>{freedomData.finScore}%</div>
              <div style={{fontSize:14,color:C.muted,marginTop:4}}>Meta: {fmt(freedomData.finGoal)}/mes en ingreso pasivo</div>
              <div style={{width:'100%',height:8,background:C.border,borderRadius:4,marginTop:16,overflow:'hidden'}}><div style={{height:'100%',width:Math.min(freedomData.finScore,100)+'%',background:freedomData.finScore>=100?C.green:freedomData.finScore>=50?C.amber:C.red,borderRadius:4,transition:'width 1s'}}/></div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:C.dim,marginTop:4}}><span>$0</span><span>{fmt(freedomData.finGoal)}</span></div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:12,marginBottom:24}}>
              <Metric label="Ingreso pasivo" value={fmt(freedomData.passiveIncome)+'/mes'} color={C.green}/>
              <Metric label="Net worth" value={fmt(freedomData.netWorth)} color={freedomData.netWorth>=0?C.teal:C.red}/>
              <Metric label="Total activos" value={fmt(freedomData.totalAssets)} color={C.blue}/>
              <Metric label="Total deudas" value={fmt(freedomData.totalLiabilities)} color={C.red}/>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
              <div style={{background:C.surface,borderRadius:12,border:'0.5px solid '+C.border,padding:'18px 20px'}}>
                <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Fuentes de ingreso pasivo</div>
                {freedomData.assets?.filter(a=>a.monthly_income>0).map((a,i)=>(<div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',fontSize:12,borderBottom:'0.5px solid '+C.border}}><span>{a.name}</span><span style={{color:C.green,fontWeight:500}}>{fmt(a.monthly_income)}/mes</span></div>))}
                {freedomData.assets?.filter(a=>a.monthly_income>0).length===0&&<div style={{color:C.dim,fontSize:12,padding:12,textAlign:'center'}}>Agrega activos con ingreso pasivo</div>}
              </div>
              <div style={{background:C.surface,borderRadius:12,border:'0.5px solid '+C.border,padding:'18px 20px'}}>
                <div style={{fontSize:13,fontWeight:600,marginBottom:12}}>Falta para $20K/mes</div>
                <div style={{fontSize:36,fontWeight:700,color:C.amber,marginBottom:8}}>{fmt(Math.max(0,freedomData.finGoal-freedomData.passiveIncome))}</div>
                {freedomData.passiveIncome>0&&(<div style={{marginTop:12,padding:'12px 14px',background:C.bg,borderRadius:8}}><div style={{fontSize:11,color:C.dim,textTransform:'uppercase',marginBottom:4}}>Tiempo estimado</div><div style={{fontSize:24,fontWeight:700,color:C.accent}}>{freedomData.passiveIncome>=freedomData.finGoal?'Meta alcanzada':Math.ceil(Math.log(freedomData.finGoal/freedomData.passiveIncome)/Math.log(1+(freedomData.assets?.reduce((s,a)=>s+(a.annual_return_pct||0),0)/(freedomData.assets?.length||1))/100))+' años'}</div><div style={{fontSize:11,color:C.muted,marginTop:2}}>Si reinviertes intereses al mismo rendimiento</div></div>)}
                <div style={{fontSize:12,color:C.muted}}>Tienes {fmt(freedomData.passiveIncome)} de {fmt(freedomData.finGoal)} necesarios</div>
              </div>
            </div>
          </>):(<div style={{textAlign:'center',padding:40,color:C.muted}}>Cargando...</div>)}
        </div>)}

        {module==='freedom'&&tab==='assets'&&(<div className="fade-up">
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}><span style={{fontSize:15,fontWeight:600}}>Activos</span><span onClick={()=>setShowAddAsset(!showAddAsset)} style={{padding:'6px 14px',borderRadius:8,background:C.accentDim,color:C.accent,cursor:'pointer',fontSize:12,fontWeight:600}}>+ Agregar activo</span></div>
          {showAddAsset&&(<div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap',padding:14,background:C.surface,borderRadius:10,border:'0.5px solid '+C.border}}>
            <input value={newAsset.name} onChange={e=>setNewAsset({...newAsset,name:e.target.value})} placeholder="Nombre" style={{padding:'8px 10px',borderRadius:6,border:'0.5px solid '+C.border,background:C.bg,color:C.text,fontSize:13,width:180,outline:'none'}}/>
            <select value={newAsset.type} onChange={e=>setNewAsset({...newAsset,type:e.target.value})} style={{padding:'8px 10px',borderRadius:6,border:'0.5px solid '+C.border,background:C.bg,color:C.text,fontSize:13,outline:'none'}}><option value="property">Propiedad</option><option value="cd">CD</option><option value="investment">Inversión</option><option value="business">Negocio</option><option value="stock">Acciones</option><option value="other">Otro</option></select>
            <input value={newAsset.value} onChange={e=>setNewAsset({...newAsset,value:e.target.value})} placeholder="Valor $" type="number" style={{padding:'8px 10px',borderRadius:6,border:'0.5px solid '+C.border,background:C.bg,color:C.text,fontSize:13,width:120,outline:'none'}}/>
            <input value={newAsset.monthlyIncome} onChange={e=>setNewAsset({...newAsset,monthlyIncome:e.target.value})} placeholder="Ingreso/mes $" type="number" style={{padding:'8px 10px',borderRadius:6,border:'0.5px solid '+C.border,background:C.bg,color:C.text,fontSize:13,width:130,outline:'none'}}/>
            <span onClick={addAssetHandler} style={{padding:'8px 14px',borderRadius:6,background:C.greenDim,color:C.green,cursor:'pointer',fontSize:12,fontWeight:600}}>Guardar</span>
          </div>)}
          {freedomData?.assets?.map((a,i)=>(<div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',background:C.surface,borderRadius:10,border:'0.5px solid '+C.border,marginBottom:6}}>
            <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500}}>{a.name}</div><div style={{fontSize:11,color:C.muted}}>{a.type}</div></div>
            <div style={{textAlign:'right'}}><div style={{fontSize:13,fontWeight:500}}>{fmt(a.value)}</div>{a.monthly_income>0&&<div style={{fontSize:11,color:C.green}}>{fmt(a.monthly_income)}/mes</div>}</div>
            <span onClick={async()=>{await api('/api/freedom',{method:'POST',body:{action:'deleteAsset',id:a.id}});loadFreedom();}} style={{color:C.red,cursor:'pointer',fontSize:11}}>×</span>
          </div>))}
          {(!freedomData?.assets||freedomData.assets.length===0)&&<div style={{textAlign:'center',padding:40,color:C.muted}}>Agrega tus propiedades, CDs, inversiones...</div>}
        </div>)}

        {module==='freedom'&&tab==='liabilities'&&(<div className="fade-up">
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}><span style={{fontSize:15,fontWeight:600}}>Deudas</span><span onClick={()=>setShowAddLiab(!showAddLiab)} style={{padding:'6px 14px',borderRadius:8,background:C.accentDim,color:C.accent,cursor:'pointer',fontSize:12,fontWeight:600}}>+ Agregar deuda</span></div>
          {showAddLiab&&(<div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap',padding:14,background:C.surface,borderRadius:10,border:'0.5px solid '+C.border}}>
            <input value={newLiab.name} onChange={e=>setNewLiab({...newLiab,name:e.target.value})} placeholder="Nombre" style={{padding:'8px 10px',borderRadius:6,border:'0.5px solid '+C.border,background:C.bg,color:C.text,fontSize:13,width:180,outline:'none'}}/>
            <select value={newLiab.type} onChange={e=>setNewLiab({...newLiab,type:e.target.value})} style={{padding:'8px 10px',borderRadius:6,border:'0.5px solid '+C.border,background:C.bg,color:C.text,fontSize:13,outline:'none'}}><option value="mortgage">Hipoteca</option><option value="auto">Auto</option><option value="credit_card">Tarjeta</option><option value="loan">Préstamo</option><option value="other">Otro</option></select>
            <input value={newLiab.balance} onChange={e=>setNewLiab({...newLiab,balance:e.target.value})} placeholder="Balance $" type="number" style={{padding:'8px 10px',borderRadius:6,border:'0.5px solid '+C.border,background:C.bg,color:C.text,fontSize:13,width:120,outline:'none'}}/>
            <input value={newLiab.monthlyPayment} onChange={e=>setNewLiab({...newLiab,monthlyPayment:e.target.value})} placeholder="Pago/mes $" type="number" style={{padding:'8px 10px',borderRadius:6,border:'0.5px solid '+C.border,background:C.bg,color:C.text,fontSize:13,width:120,outline:'none'}}/>
            <span onClick={addLiabHandler} style={{padding:'8px 14px',borderRadius:6,background:C.greenDim,color:C.green,cursor:'pointer',fontSize:12,fontWeight:600}}>Guardar</span>
          </div>)}
          {freedomData?.liabilities?.map((l,i)=>(<div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',background:C.surface,borderRadius:10,border:'0.5px solid '+C.border,marginBottom:6}}>
            <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500}}>{l.name}</div><div style={{fontSize:11,color:C.muted}}>{l.type}</div></div>
            <div style={{textAlign:'right'}}><div style={{fontSize:13,fontWeight:500,color:C.red}}>{fmt(l.balance)}</div>{l.monthly_payment>0&&<div style={{fontSize:11,color:C.amber}}>{fmt(l.monthly_payment)}/mes</div>}</div>
            <span onClick={async()=>{await api('/api/freedom',{method:'POST',body:{action:'deleteLiability',id:l.id}});loadFreedom();}} style={{color:C.red,cursor:'pointer',fontSize:11}}>×</span>
          </div>))}
        </div>)}

        {module==='freedom'&&tab==='scorecard'&&(<div className="fade-up">
          <div style={{fontSize:15,fontWeight:600,marginBottom:16}}>Scorecard mensual</div>
          {scorecard?(<>
            <div style={{background:C.surface,borderRadius:12,border:'0.5px solid '+C.border,padding:'24px',marginBottom:20,textAlign:'center'}}>
              <div style={{fontSize:12,color:C.muted,textTransform:'uppercase',marginBottom:8}}>Calificación general</div>
              <div style={{fontSize:64,fontWeight:700,color:scorecard.overall_grade?.includes('A')?C.green:scorecard.overall_grade?.includes('B')?C.blue:scorecard.overall_grade?.includes('C')?C.amber:C.red}}>{scorecard.overall_grade}</div>
              <div style={{fontSize:13,color:C.muted,marginTop:8}}>{scorecard.summary}</div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:12,marginBottom:20}}>
              {[{l:'Empresas',g:scorecard.biz_grade},{l:'Personal',g:scorecard.personal_grade},{l:'Contable',g:scorecard.accounting_grade},{l:'Libertad',g:scorecard.freedom_grade}].map((s,i)=>(<div key={i} style={{background:C.surface,borderRadius:10,padding:'14px 16px',border:'0.5px solid '+C.border,textAlign:'center'}}><div style={{fontSize:11,color:C.muted,marginBottom:4}}>{s.l}</div><div style={{fontSize:28,fontWeight:700,color:s.g?.includes('A')?C.green:s.g?.includes('B')?C.blue:s.g?.includes('C')?C.amber:C.red}}>{s.g||'—'}</div></div>))}
            </div>
            {scorecard.action_items?.map((a,i)=>(<div key={i} style={{padding:'10px 14px',background:C.surface,borderRadius:8,border:'0.5px solid '+C.border,marginBottom:4,fontSize:12,color:C.muted}}>→ {a}</div>))}
          </>):(<div style={{textAlign:'center',padding:40,color:C.muted}}>Generando scorecard con AI...</div>)}
        </div>)}

        {!vd&&module==='financial'&&<div style={{textAlign:'center',padding:60,color:C.muted}}>Cargando...</div>}
      </div>
    </div>
  );
}
