import React, { useState } from 'react';
import {
  BarChart3, DollarSign, TrendingUp, Clock, Package, Users,
  ClipboardList, Download, Calendar, AlertTriangle, CheckCircle, ArrowUp, ArrowDown, Filter
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, LineChart, Line
} from 'recharts';
import { useApp } from '../context/AppContext';
import { ESTADO_CONFIG } from './Dashboard';
import { toast } from 'sonner';

const PIE_COLORS = ['#6366f1', '#f59e0b', '#f97316', '#ef4444', '#8b5cf6', '#22c55e', '#94a3b8', '#3b82f6'];

type ReportTab = 'finanzas' | 'operaciones' | 'inventario' | 'auditoria';
type Periodo = 'hoy' | 'semana' | 'mes' | 'trimestre' | 'año';

// Helper: filter ordenes by period
function filtrarPorPeriodo(ordenes: ReturnType<typeof useApp>['ordenes'], periodo: Periodo) {
  const now = new Date();
  const start = new Date();
  if (periodo === 'hoy') { start.setHours(0,0,0,0); }
  else if (periodo === 'semana') { start.setDate(now.getDate() - 7); }
  else if (periodo === 'mes') { start.setDate(1); start.setHours(0,0,0,0); }
  else if (periodo === 'trimestre') { start.setMonth(now.getMonth() - 3); start.setDate(1); }
  else if (periodo === 'año') { start.setMonth(0); start.setDate(1); start.setHours(0,0,0,0); }
  const startStr = start.toISOString().split('T')[0];
  return ordenes.filter(o => o.fechaCreacion >= startStr || o.fechaActualizacion >= startStr);
}

function buildTimeSeriesData(ordenes: ReturnType<typeof useApp>['ordenes'], periodo: Periodo) {
  const finalizadas = ordenes.filter(o => o.estado === 'finalizada');
  if (periodo === 'hoy') {
    // by hour
    const hours: Record<string, {label:string; ingresos:number; ordenes:number}> = {};
    ['08','09','10','11','12','13','14','15','16','17','18'].forEach(h => { hours[h] = {label:`${h}:00`, ingresos:0, ordenes:0}; });
    finalizadas.forEach(o => {
      const h = (o.fechaActualizacion || '').substring(11,13) || '09';
      if (hours[h]) { hours[h].ingresos += (o.cotizacion?.lineas||[]).reduce((s,l)=>s+l.cantidad*l.precioUnitario,0); hours[h].ordenes++; }
    });
    return Object.values(hours);
  } else if (periodo === 'semana') {
    const days = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
    const data = days.map(d => ({label:d, ingresos:0, ordenes:0}));
    const now = new Date();
    finalizadas.forEach(o => {
      const d = new Date(o.fechaActualizacion);
      const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
      if (diff < 7) { const idx = 6-diff; if (idx>=0&&idx<7) { data[idx].ingresos += (o.cotizacion?.lineas||[]).reduce((s,l)=>s+l.cantidad*l.precioUnitario,0); data[idx].ordenes++; } }
    });
    return data;
  } else if (periodo === 'mes') {
    const data: Record<number,{label:string;ingresos:number;ordenes:number}> = {};
    for(let i=1;i<=31;i++) data[i] = {label:`${i}`,ingresos:0,ordenes:0};
    finalizadas.forEach(o => {
      const day = parseInt(o.fechaActualizacion.split('-')[2]||'1');
      if(data[day]) { data[day].ingresos += (o.cotizacion?.lineas||[]).reduce((s,l)=>s+l.cantidad*l.precioUnitario,0); data[day].ordenes++; }
    });
    return Object.values(data).filter(d=>parseInt(d.label)<=28);
  } else if (periodo === 'trimestre') {
    const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const now = new Date();
    const data = [0,1,2].map(i => {
      const m = (now.getMonth()-2+i+12)%12;
      return {label:months[m],ingresos:0,ordenes:0};
    });
    finalizadas.forEach(o => {
      const m = parseInt(o.fechaActualizacion.split('-')[1]||'1')-1;
      const now2 = new Date();
      const relM = (m - (now2.getMonth()-2) + 12)%12;
      if(relM<3 && data[relM]) { data[relM].ingresos += (o.cotizacion?.lineas||[]).reduce((s,l)=>s+l.cantidad*l.precioUnitario,0); data[relM].ordenes++; }
    });
    return data;
  } else {
    // año
    const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const data = months.map(m => ({label:m, ingresos:0, ordenes:0}));
    finalizadas.forEach(o => {
      const m = parseInt(o.fechaActualizacion.split('-')[1]||'1')-1;
      if(data[m]) { data[m].ingresos += (o.cotizacion?.lineas||[]).reduce((s,l)=>s+l.cantidad*l.precioUnitario,0); data[m].ordenes++; }
    });
    return data;
  }
}

export default function Reportes() {
  const { ordenes, clientes, vehiculos, repuestos, usuarios, kardex, auditoria, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<ReportTab>('finanzas');
  const [periodo, setPeriodo] = useState<Periodo>('mes');
  const [periodoProductividad, setPeriodoProductividad] = useState<Periodo>('mes');

  const periodoLabel: Record<Periodo,string> = { hoy:'Hoy', semana:'Esta semana', mes:'Este mes', trimestre:'Trimestre', año:'Este año' };
  const periodos: Periodo[] = ['hoy','semana','mes','trimestre','año'];

  if (currentUser?.rol !== 'administrador') {
    return (
      <div className="p-6 max-w-md mx-auto mt-20 text-center">
        <AlertTriangle size={40} className="mx-auto mb-3 text-amber-400" />
        <h2 className="font-bold text-gray-800 mb-2">Acceso Restringido</h2>
        <p className="text-gray-500 text-sm">Solo el Administrador puede ver los reportes del sistema.</p>
      </div>
    );
  }

  // Finanzas — filtradas por período seleccionado
  const ordenesFiltradas = filtrarPorPeriodo(ordenes, periodo);
  const ordenesFinalizadas = ordenes.filter(o => o.estado === 'finalizada');
  const ordenesPeriodo = ordenesFiltradas.filter(o => o.estado === 'finalizada');
  const revenueTotal = ordenesPeriodo.reduce((s, o) => s + (o.cotizacion?.lineas.reduce((ls, l) => ls + l.cantidad * l.precioUnitario, 0) || 0), 0);
  const revenueTotalGeneral = ordenesFinalizadas.reduce((s, o) => s + (o.cotizacion?.lineas.reduce((ls, l) => ls + l.cantidad * l.precioUnitario, 0) || 0), 0);
  const revenueRepuestos = ordenesPeriodo.reduce((s, o) => s + (o.repuestosUsados.reduce((rs, r) => rs + r.cantidad * r.precio, 0)), 0);
  const revenueMO = revenueTotal - revenueRepuestos;
  const ticketPromedio = ordenesPeriodo.length > 0 ? revenueTotal / ordenesPeriodo.length : 0;

  // Previous period comparison (simplified)
  const prevOrdenes = ordenes.filter(o => {
    const d = new Date(o.fechaActualizacion);
    const now = new Date();
    if (periodo === 'hoy') { const prev = new Date(); prev.setDate(prev.getDate()-1); return d.toDateString() === prev.toDateString(); }
    if (periodo === 'semana') { const s = new Date(); s.setDate(s.getDate()-14); const e = new Date(); e.setDate(e.getDate()-7); return d>=s && d<e; }
    if (periodo === 'mes') { const m = new Date(now.getFullYear(), now.getMonth()-1, 1); const m2 = new Date(now.getFullYear(), now.getMonth(), 1); return d>=m && d<m2; }
    return false;
  }).filter(o => o.estado === 'finalizada');
  const prevRevenue = prevOrdenes.reduce((s, o) => s + (o.cotizacion?.lineas.reduce((ls, l) => ls + l.cantidad * l.precioUnitario, 0) || 0), 0);
  const revenueChange = prevRevenue > 0 ? ((revenueTotal - prevRevenue) / prevRevenue) * 100 : 0;

  const timeSeriesData = buildTimeSeriesData(ordenesFiltradas, periodo);

  // Productividad filtrada
  const ordenesProdFiltradas = filtrarPorPeriodo(ordenes, periodoProductividad);

  // Operaciones
  const estadoDistribucion = Object.entries(
    ordenes.reduce((acc, o) => {
      acc[o.estado] = (acc[o.estado] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([estado, count]) => ({
    name: ESTADO_CONFIG[estado as keyof typeof ESTADO_CONFIG]?.label || estado,
    value: count,
  }));

  const productividadMecanicos = usuarios
    .filter(u => u.rol === 'mecanico')
    .map(u => ({
      nombre: u.nombre.split(' ')[0],
      completadas: ordenesProdFiltradas.filter(o => o.mecanicoId === u.id && o.estado === 'finalizada').length,
      activas: ordenesProdFiltradas.filter(o => o.mecanicoId === u.id && !['finalizada', 'cancelada'].includes(o.estado)).length,
      total: ordenesProdFiltradas.filter(o => o.mecanicoId === u.id).length,
      ingresos: ordenesProdFiltradas.filter(o => o.mecanicoId === u.id && o.estado==='finalizada').reduce((s,o) => s+(o.cotizacion?.lineas||[]).reduce((ls,l)=>ls+l.cantidad*l.precioUnitario,0),0),
    }));

  // Inventario
  const stockBajo = repuestos.filter(r => r.cantidad <= r.stockMinimo);
  const valorInventario = repuestos.reduce((s, r) => s + r.cantidad * r.precio, 0);
  const valorCosto = repuestos.reduce((s, r) => s + r.cantidad * r.costo, 0);
  const margenBruto = valorInventario - valorCosto;

  const topRepuestos = [...repuestos]
    .sort((a, b) => b.cantidad * b.precio - a.cantidad * a.precio)
    .slice(0, 5);

  const kardexReciente = [...kardex]
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 10);

  // Auditoria
  const auditoriaReciente = [...auditoria]
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 20);

  const tabs: { key: ReportTab; label: string; icon: React.ReactNode }[] = [
    { key: 'finanzas', label: 'Ganancias', icon: <DollarSign size={15} /> },
    { key: 'operaciones', label: 'Productividad', icon: <BarChart3 size={15} /> },
    { key: 'inventario', label: 'Inventario', icon: <Package size={15} /> },
    { key: 'auditoria', label: 'Auditoría', icon: <ClipboardList size={15} /> },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 size={22} className="text-blue-600" /> Reportes y Análisis
          </h1>
          <p className="text-gray-500 text-sm">Panel de reportes financieros, operativos y de inventario</p>
        </div>
        <button onClick={() => toast.info('Función de exportación PDF próximamente')} className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors">
          <Download size={15} /> Exportar PDF
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── GANANCIAS ── */}
      {activeTab === 'finanzas' && (
        <div className="space-y-5">
          {/* Period selector */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-slate-500">
              <Filter size={15}/>
              <span className="text-sm font-semibold">Período:</span>
            </div>
            <div className="flex gap-1 flex-wrap">
              {periodos.map(p => (
                <button key={p} onClick={() => setPeriodo(p)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${periodo === p ? 'bg-slate-800 text-white shadow' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                  {periodoLabel[p]}
                </button>
              ))}
            </div>
            <span className="ml-auto text-xs text-slate-400 hidden sm:block">Mostrando datos de: <span className="font-semibold text-slate-600">{periodoLabel[periodo]}</span></span>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label:`Ingresos ${periodoLabel[periodo]}`, val:`$${revenueTotal.toFixed(0)}`, icon:<DollarSign size={20}/>, color:'bg-slate-800 text-white',
                sub: prevRevenue > 0 ? `${revenueChange >= 0 ? '+' : ''}${revenueChange.toFixed(1)}% vs período ant.` : `${ordenesPeriodo.length} ots finalizadas`,
                up: revenueChange >= 0 },
              { label:'Repuestos', val:`$${revenueRepuestos.toFixed(0)}`, icon:<Package size={20}/>, color:'bg-blue-600 text-white', sub:`${revenueTotal>0?((revenueRepuestos/revenueTotal)*100).toFixed(0):0}% del total` },
              { label:'Mano de Obra', val:`$${revenueMO.toFixed(0)}`, icon:<TrendingUp size={20}/>, color:'bg-cyan-600 text-white', sub:`${revenueTotal>0?((revenueMO/revenueTotal)*100).toFixed(0):0}% del total` },
              { label:'Ticket Promedio', val:`$${ticketPromedio.toFixed(0)}`, icon:<Clock size={20}/>, color:'bg-emerald-600 text-white', sub:`${ordenesPeriodo.length} órdenes` },
            ].map(k => (
              <div key={k.label} className={`${k.color} rounded-2xl p-5`}>
                <div className="mb-3 opacity-80">{k.icon}</div>
                <p className="text-2xl font-bold">{k.val}</p>
                <p className="text-sm font-medium mt-1 opacity-90">{k.label}</p>
                {k.sub && (
                  <div className="flex items-center gap-1 mt-2 text-xs opacity-80">
                    {k.up !== undefined && (k.up ? <ArrowUp size={10}/> : <ArrowDown size={10}/>)}
                    {k.sub}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Time series chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">Ingresos — {periodoLabel[periodo]}</h3>
              <span className="text-xs text-slate-400">Total: ${revenueTotal.toFixed(2)} (sin IVA)</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={timeSeriesData}>
                <defs>
                  <linearGradient id="colorIng" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f172a" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                <XAxis dataKey="label" tick={{fontSize:11}}/>
                <YAxis tick={{fontSize:11}}/>
                <Tooltip formatter={(v) => [`$${Number(v).toFixed(2)}`]}/>
                <Area type="monotone" dataKey="ingresos" stroke="#0f172a" fill="url(#colorIng)" strokeWidth={2} name="Ingresos ($)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Órdenes por período */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-bold text-slate-800 mb-4">Órdenes Finalizadas — {periodoLabel[periodo]}</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={timeSeriesData} barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                  <XAxis dataKey="label" tick={{fontSize:11}}/>
                  <YAxis tick={{fontSize:11}} allowDecimals={false}/>
                  <Tooltip/>
                  <Bar dataKey="ordenes" name="Órdenes" fill="#6366f1" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Desglose */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-bold text-slate-800 mb-4">Desglose de Ingresos</h3>
              <div className="space-y-4 pt-2">
                {[
                  { label:'Mano de Obra', valor:revenueMO, color:'bg-slate-800', pct: revenueTotal>0 ? (revenueMO/revenueTotal)*100 : 50 },
                  { label:'Repuestos y Materiales', valor:revenueRepuestos, color:'bg-cyan-500', pct: revenueTotal>0 ? (revenueRepuestos/revenueTotal)*100 : 50 },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-slate-700 font-medium">{item.label}</span>
                      <div>
                        <span className="font-bold text-slate-900">${item.valor.toFixed(0)}</span>
                        <span className="text-slate-400 ml-1 text-xs">({item.pct.toFixed(1)}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5">
                      <div className={`${item.color} h-2.5 rounded-full transition-all`} style={{width:`${item.pct}%`}}/>
                    </div>
                  </div>
                ))}
                <div className="border-t border-slate-100 pt-3 flex justify-between font-bold text-slate-800">
                  <span>Total (sin IVA)</span><span>${revenueTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500">
                  <span>IVA 12%</span><span>${(revenueTotal * 0.12).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-700 text-lg border-t border-slate-100 pt-2">
                  <span>Total con IVA</span><span>${(revenueTotal * 1.12).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PRODUCTIVIDAD ── */}
      {activeTab === 'operaciones' && (
        <div className="space-y-5">
          {/* Period selector */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-slate-500"><Filter size={15}/><span className="text-sm font-semibold">Período:</span></div>
            <div className="flex gap-1 flex-wrap">
              {periodos.map(p => (
                <button key={p} onClick={() => setPeriodoProductividad(p)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${periodoProductividad === p ? 'bg-slate-800 text-white shadow' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                  {periodoLabel[p]}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label:`OTs ${periodoLabel[periodoProductividad]}`, val: ordenesProdFiltradas.length },
              { label:'Clientes Totales', val: clientes.length },
              { label:'Vehículos', val: vehiculos.length },
              { label:'Mecánicos Activos', val: usuarios.filter(u => u.rol === 'mecanico' && u.activo).length },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-5 text-center">
                <p className="text-4xl font-bold text-slate-800">{s.val}</p>
                <p className="text-sm font-medium text-slate-500 mt-2">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Estado distribución */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-bold text-slate-800 mb-4">Distribución de OTs por Estado (Total)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={estadoDistribucion} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {estadoDistribucion.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v} OTs`]} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Productividad mecánicos */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-bold text-slate-800 mb-4">Productividad por Mecánico — {periodoLabel[periodoProductividad]}</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={productividadMecanicos} barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="completadas" name="Finalizadas" fill="#22c55e" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="activas" name="Activas" fill="#f97316" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabla productividad mejorada */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Productividad de Mecánicos — {periodoLabel[periodoProductividad]}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Mecánico', 'OTs en Período', 'Finalizadas', 'En Proceso', 'Ingresos Generados', 'Eficiencia'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {productividadMecanicos.length === 0 ? (
                    <tr><td colSpan={6} className="py-8 text-center text-slate-400 text-sm">Sin mecánicos registrados</td></tr>
                  ) : productividadMecanicos.map(m => (
                    <tr key={m.nombre} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-orange-700 text-xs font-bold">{m.nombre[0]}</span>
                          </div>
                          <span className="text-sm font-semibold text-slate-800">{m.nombre}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600 font-medium">{m.total}</td>
                      <td className="px-5 py-4 text-sm text-emerald-700 font-bold">{m.completadas}</td>
                      <td className="px-5 py-4 text-sm text-orange-600 font-medium">{m.activas}</td>
                      <td className="px-5 py-4 text-sm font-bold text-slate-800">${m.ingresos.toFixed(0)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 rounded-full h-2 w-20">
                            <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{width:`${m.total>0?(m.completadas/m.total)*100:0}%`}}/>
                          </div>
                          <span className="text-xs font-bold text-slate-600">{m.total>0?Math.round((m.completadas/m.total)*100):0}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── INVENTARIO & KARDEX ── */}
      {activeTab === 'inventario' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-3xl font-bold text-black">{repuestos.length}</p>
              <p className="text-base font-medium text-gray-600 mt-1">Total Repuestos</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-3xl font-bold text-black">${valorInventario.toFixed(0)}</p>
              <p className="text-base font-medium text-gray-600 mt-1">Valor Inventario (PVP)</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-3xl font-bold text-black">${valorCosto.toFixed(0)}</p>
              <p className="text-base font-medium text-gray-600 mt-1">Valor Costo</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-3xl font-bold text-black">${margenBruto.toFixed(0)}</p>
              <p className="text-base font-medium text-gray-600 mt-1">Margen Bruto</p>
            </div>
          </div>

          {/* Stock bajo */}
          {stockBajo.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-amber-600" />
                <p className="font-semibold text-amber-800">Repuestos con Stock Bajo ({stockBajo.length})</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {stockBajo.map(r => (
                  <div key={r.id} className="bg-white border border-amber-200 rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{r.nombre}</p>
                      <p className="text-xs text-gray-500">{r.categoria}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-600">{r.cantidad} uds</p>
                      <p className="text-xs text-gray-400">Mín: {r.stockMinimo}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top repuestos */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Top 5 Repuestos por Valor</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {topRepuestos.map((r, i) => (
                <div key={r.id} className="px-5 py-3.5 flex items-center gap-4">
                  <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{r.nombre}</p>
                    <p className="text-xs text-gray-400">{r.categoria} · Stock: {r.cantidad}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">${(r.cantidad * r.precio).toFixed(0)}</p>
                    <p className="text-xs text-gray-400">@${r.precio}/u</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Kardex */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Kardex de Movimientos Recientes</h3>
              <p className="text-xs text-gray-400 mt-0.5">Últimos {kardexReciente.length} movimientos</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Fecha', 'Repuesto', 'Tipo', 'Cantidad', 'Stock Result.', 'Usuario', 'OT'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {kardexReciente.length === 0 ? (
                    <tr><td colSpan={7} className="py-8 text-center text-gray-400 text-sm">Sin movimientos registrados</td></tr>
                  ) : kardexReciente.map(k => (
                    <tr key={k.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{new Date(k.fecha).toLocaleDateString('es-ES')}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{k.repuestoNombre}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          k.tipo === 'entrada' ? 'bg-green-100 text-green-700' :
                          k.tipo === 'salida' ? 'bg-red-100 text-red-700' :
                          k.tipo === 'reserva' ? 'bg-amber-100 text-amber-700' :
                          k.tipo === 'liberacion' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {k.tipo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{k.cantidad}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{k.stockResultante}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{k.usuarioNombre}</td>
                      <td className="px-4 py-3 text-xs text-blue-600">{k.ordenId || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── AUDITORÍA ── */}
      {activeTab === 'auditoria' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-800">Log de Auditoría del Sistema</h3>
                <p className="text-xs text-gray-400 mt-0.5">{auditoria.length} acciones registradas</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Fecha/Hora', 'Usuario', 'Acción', 'Módulo', 'Detalles'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {auditoriaReciente.length === 0 ? (
                    <tr><td colSpan={5} className="py-8 text-center text-gray-400 text-sm">Sin registros de auditoría</td></tr>
                  ) : auditoriaReciente.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(log.fecha).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-700">{log.usuarioNombre}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium font-mono ${
                          log.accion.includes('CREAR') || log.accion.includes('ENTRADA') ? 'bg-green-100 text-green-700' :
                          log.accion.includes('ELIMINAR') || log.accion.includes('RECHAZAR') ? 'bg-red-100 text-red-700' :
                          log.accion.includes('LOGIN') || log.accion.includes('LOGOUT') ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {log.accion}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-500">{log.modulo}</td>
                      <td className="px-5 py-3.5 text-xs text-gray-600 max-w-xs truncate">{log.detalles}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
