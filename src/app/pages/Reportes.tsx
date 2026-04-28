import React, { useState, useEffect } from 'react';
import {
  BarChart3, DollarSign, TrendingUp, Clock, Package, Users,
  ClipboardList, Download, Calendar, AlertTriangle, CheckCircle, ArrowUp, ArrowDown, Filter, Loader
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


export default function Reportes() {
  const { ordenes, clientes, vehiculos, repuestos, usuarios, kardex, auditoria, currentUser,
    generarReporteIngresos, generarReporteProductividad, generarReporteValorInventario } = useApp();

  const [activeTab, setActiveTab] = useState<ReportTab>('finanzas');
  const [periodo, setPeriodo] = useState<Periodo>('mes');
  const [periodoProductividad, setPeriodoProductividad] = useState<Periodo>('mes');

  // Date range filters for ingresos report (obligatory)
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [fechaInicio, setFechaInicio] = useState<string>(thirtyDaysAgo);
  const [fechaFin, setFechaFin] = useState<string>(today);

  // Report data from RPC
  const [reporteIngresos, setReporteIngresos] = useState<any>(null);
  const [reporteProductividad, setReporteProductividad] = useState<any>(null);
  const [reporteInventario, setReporteInventario] = useState<any>(null);
  const [loadingIngresos, setLoadingIngresos] = useState(false);
  const [loadingProductividad, setLoadingProductividad] = useState(false);
  const [loadingInventario, setLoadingInventario] = useState(false);

  const periodoLabel: Record<Periodo,string> = { hoy:'Hoy', semana:'Esta semana', mes:'Este mes', trimestre:'Trimestre', año:'Este año' };
  const periodos: Periodo[] = ['hoy','semana','mes','trimestre','año'];

  // Stock bajo (repuestos con cantidad por debajo del mínimo)
  const stockBajo = (reporteInventario?.inventario || []).filter((r: any) => r.cantidad <= (r.stockMinimo || 5));

  // Load reports from RPC functions
  const cargarReportes = async () => {
    if (!currentUser) return;

    setLoadingIngresos(true);
    const resIngresos = await generarReporteIngresos(fechaInicio, fechaFin);
    if (resIngresos.error) {
      toast.error(`Error al cargar ingresos: ${resIngresos.error}`);
    } else {
      setReporteIngresos(resIngresos);
    }
    setLoadingIngresos(false);

    setLoadingProductividad(true);
    const resProductividad = await generarReporteProductividad();
    if (resProductividad.error) {
      toast.error(`Error al cargar productividad: ${resProductividad.error}`);
    } else {
      setReporteProductividad(resProductividad);
    }
    setLoadingProductividad(false);

    setLoadingInventario(true);
    const resInventario = await generarReporteValorInventario();
    if (resInventario.error) {
      toast.error(`Error al cargar inventario: ${resInventario.error}`);
    } else {
      setReporteInventario(resInventario);
    }
    setLoadingInventario(false);
  };

  useEffect(() => {
    cargarReportes();
  }, [fechaInicio, fechaFin]);

  if (currentUser?.rol !== 'administrador') {
    return (
      <div className="p-6 max-w-md mx-auto mt-20 text-center">
        <AlertTriangle size={40} className="mx-auto mb-3 text-amber-400" />
        <h2 className="font-bold text-gray-800 mb-2">Acceso Restringido</h2>
        <p className="text-gray-500 text-sm">Solo el Administrador puede ver los reportes del sistema.</p>
      </div>
    );
  }

  // Auditoria
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
          {/* Date range selector - OBLIGATORY */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <Calendar size={16}/>
                <span className="text-sm">Rango de Fechas (Obligatorio)</span>
              </div>
              <div className="flex gap-3 flex-wrap items-center">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-500 font-medium">Desde</label>
                  <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-slate-600"/>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-500 font-medium">Hasta</label>
                  <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-slate-600"/>
                </div>
              </div>
              {loadingIngresos && <Loader size={16} className="animate-spin text-slate-600 ml-auto"/>}
            </div>
          </div>

          {/* KPIs from RPC */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {loadingIngresos ? (
              <div className="col-span-full text-center py-8">
                <Loader size={20} className="animate-spin mx-auto text-slate-600"/>
              </div>
            ) : reporteIngresos && !reporteIngresos.error ? (
              [
                { label:'Total Ingresos', val:`$${(reporteIngresos.totalIngresos || 0).toFixed(0)}`, icon:<DollarSign size={20}/>, color:'bg-slate-800 text-white', sub:`${reporteIngresos.cantidadFacturas || 0} facturas` },
                { label:'Promedio por Factura', val:`$${reporteIngresos.cantidadFacturas > 0 ? ((reporteIngresos.totalIngresos || 0) / reporteIngresos.cantidadFacturas).toFixed(0) : 0}`, icon:<TrendingUp size={20}/>, color:'bg-blue-600 text-white', sub:'Valor medio' },
                { label:'Cantidad de Ingresos', val:(reporteIngresos.cantidadFacturas || 0).toString(), icon:<Package size={20}/>, color:'bg-cyan-600 text-white', sub:'Facturas registradas' },
                { label:'IVA 12%', val:`$${((reporteIngresos.totalIngresos || 0) * 0.12).toFixed(0)}`, icon:<Clock size={20}/>, color:'bg-emerald-600 text-white', sub:'Impuesto generado' },
              ].map(k => (
                <div key={k.label} className={`${k.color} rounded-2xl p-5`}>
                  <div className="mb-3 opacity-80">{k.icon}</div>
                  <p className="text-2xl font-bold">{k.val}</p>
                  <p className="text-sm font-medium mt-1 opacity-90">{k.label}</p>
                  {k.sub && <div className="flex items-center gap-1 mt-2 text-xs opacity-80">{k.sub}</div>}
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-slate-500">
                {reporteIngresos?.error ? `Error: ${reporteIngresos.error}` : 'Sin datos disponibles'}
              </div>
            )}
          </div>

          {/* Revenue chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">Ingresos por Rango de Fechas</h3>
              <span className="text-xs text-slate-400">Total: ${(reporteIngresos?.totalIngresos || 0).toFixed(2)} (sin IVA)</span>
            </div>
            {loadingIngresos ? (
              <div className="flex justify-center py-12">
                <Loader size={20} className="animate-spin text-slate-600"/>
              </div>
            ) : reporteIngresos && reporteIngresos.ingresos && reporteIngresos.ingresos.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={reporteIngresos.ingresos.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                  <XAxis dataKey="numero" tick={{fontSize:11}}/>
                  <YAxis tick={{fontSize:11}}/>
                  <Tooltip formatter={(v) => [`$${Number(v).toFixed(2)}`]}/>
                  <Bar dataKey="total" name="Total ($)" fill="#0f172a" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex justify-center py-12 text-slate-500 text-sm">
                No hay datos disponibles para el rango de fechas seleccionado
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Cantidad de facturas */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-bold text-slate-800 mb-4">Cantidad de Facturas Generadas</h3>
              {loadingIngresos ? (
                <div className="flex justify-center py-8">
                  <Loader size={20} className="animate-spin text-slate-600"/>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-5xl font-bold text-slate-800">{reporteIngresos?.cantidadFacturas || 0}</p>
                  <p className="text-slate-500 text-sm mt-2">facturas en el período</p>
                </div>
              )}
            </div>

            {/* Desglose financiero */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-bold text-slate-800 mb-4">Resumen Financiero</h3>
              <div className="space-y-4 pt-2">
                {loadingIngresos ? (
                  <div className="flex justify-center py-8">
                    <Loader size={20} className="animate-spin text-slate-600"/>
                  </div>
                ) : reporteIngresos ? (
                  <>
                    <div className="border-t border-slate-100 pt-3 flex justify-between font-bold text-slate-800">
                      <span>Total (sin IVA)</span><span>${(reporteIngresos.totalIngresos || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-500">
                      <span>IVA 12%</span><span>${((reporteIngresos.totalIngresos || 0) * 0.12).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-emerald-700 text-lg border-t border-slate-100 pt-2">
                      <span>Total con IVA</span><span>${((reporteIngresos.totalIngresos || 0) * 1.12).toFixed(2)}</span>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PRODUCTIVIDAD ── */}
      {activeTab === 'operaciones' && (
        <div className="space-y-5">
          {/* Stats from RPC */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {loadingProductividad ? (
              <div className="col-span-full flex justify-center py-8">
                <Loader size={20} className="animate-spin text-slate-600"/>
              </div>
            ) : reporteProductividad && !reporteProductividad.error ? (
              [
                { label:'Órdenes Finalizadas', val: reporteProductividad.totalOrdenesFinalizadas || 0 },
                { label:'Clientes Totales', val: clientes.length },
                { label:'Vehículos', val: vehiculos.length },
                { label:'Mecánicos Activos', val: usuarios.filter(u => u.rol === 'mecanico' && u.activo).length },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-5 text-center">
                  <p className="text-4xl font-bold text-slate-800">{s.val}</p>
                  <p className="text-sm font-medium text-slate-500 mt-2">{s.label}</p>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-slate-500">
                {reporteProductividad?.error ? `Error: ${reporteProductividad.error}` : 'Sin datos disponibles'}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-bold text-slate-800 mb-4">Productividad por Mecánico</h3>
            {loadingProductividad ? (
              <div className="flex justify-center py-8">
                <Loader size={20} className="animate-spin text-slate-600"/>
              </div>
            ) : reporteProductividad && reporteProductividad.productividad && reporteProductividad.productividad.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={reporteProductividad.productividad} barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="mecanicoNombre" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="ordenesFinalizadas" name="Finalizadas" fill="#22c55e" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex justify-center py-8 text-slate-500 text-sm">
                No hay datos de productividad disponibles
              </div>
            )}
          </div>

          {/* Tabla productividad desde RPC */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Productividad de Mecánicos</h3>
            </div>
            {loadingProductividad ? (
              <div className="flex justify-center py-8">
                <Loader size={20} className="animate-spin text-slate-600"/>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {['Mecánico', 'Órdenes Finalizadas', 'Ingresos Generados'].map(h => (
                        <th key={h} className="text-left px-5 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {!reporteProductividad || reporteProductividad.error ? (
                      <tr><td colSpan={3} className="py-8 text-center text-slate-400 text-sm">{reporteProductividad?.error || 'Sin datos disponibles'}</td></tr>
                    ) : reporteProductividad.productividad && reporteProductividad.productividad.length > 0 ? (
                      reporteProductividad.productividad.map((m: any) => (
                        <tr key={m.mecanicoId} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-orange-700 text-xs font-bold">{(m.mecanicoNombre || 'M')[0]}</span>
                              </div>
                              <span className="text-sm font-semibold text-slate-800">{m.mecanicoNombre || 'Sin nombre'}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-emerald-700 font-bold">{m.ordenesFinalizadas || 0}</td>
                          <td className="px-5 py-4 text-sm font-bold text-slate-800">${(m.ingresoTotal || 0).toFixed(0)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={3} className="py-8 text-center text-slate-400 text-sm">Sin mecánicos registrados</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── INVENTARIO & KARDEX ── */}
      {activeTab === 'inventario' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {loadingInventario ? (
              <div className="col-span-full flex justify-center py-8">
                <Loader size={20} className="animate-spin text-slate-600"/>
              </div>
            ) : reporteInventario && !reporteInventario.error ? (
              <>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <p className="text-3xl font-bold text-black">{reporteInventario.totalRepuestos || 0}</p>
                  <p className="text-base font-medium text-gray-600 mt-1">Total Repuestos</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <p className="text-3xl font-bold text-black">${(reporteInventario.valorTotalInventario || 0).toFixed(0)}</p>
                  <p className="text-base font-medium text-gray-600 mt-1">Valor Total Inventario</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <p className="text-3xl font-bold text-black">{reporteInventario.cantidadTotalUnidades || 0}</p>
                  <p className="text-base font-medium text-gray-600 mt-1">Cantidad Total Unidades</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <p className="text-3xl font-bold text-black">${((reporteInventario.valorTotalInventario || 0) / (reporteInventario.totalRepuestos || 1)).toFixed(0)}</p>
                  <p className="text-base font-medium text-gray-600 mt-1">Valor Promedio</p>
                </div>
              </>
            ) : (
              <div className="col-span-full text-center py-8 text-slate-500">
                {reporteInventario?.error ? `Error: ${reporteInventario.error}` : 'Sin datos disponibles'}
              </div>
            )}
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

          {/* Top repuestos from RPC */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Repuestos en Inventario</h3>
            </div>
            {loadingInventario ? (
              <div className="flex justify-center py-8">
                <Loader size={20} className="animate-spin text-slate-600"/>
              </div>
            ) : reporteInventario && reporteInventario.inventario && reporteInventario.inventario.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {reporteInventario.inventario.slice(0, 5).map((r: any, i: number) => (
                  <div key={r.id || i} className="px-5 py-3.5 flex items-center gap-4">
                    <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{r.nombre}</p>
                      <p className="text-xs text-gray-400">Stock: {r.cantidad}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">${(r.cantidad * r.precio).toFixed(0)}</p>
                      <p className="text-xs text-gray-400">@${r.precio}/u</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">
                {reporteInventario?.error ? `Error: ${reporteInventario.error}` : 'Sin repuestos disponibles'}
              </div>
            )}
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
