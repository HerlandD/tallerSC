import React from 'react';
import {
  Users, Car, ClipboardList, Package, CheckCircle, AlertTriangle,
  TrendingUp, Clock, CalendarDays, Wrench, DollarSign, Star,
  UserCheck, ShieldCheck, ArrowRight, Activity, BarChart3,
  ThumbsUp, ThumbsDown, AlertCircle, PlayCircle, CheckSquare
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, Area, AreaChart
} from 'recharts';
import { useApp, EstadoOrden } from '../context/AppContext';
import { NavLink } from 'react-router';
import { rolLabels, rolBadgeColors } from '../components/Layout';

// ─── Estado Config (exported so other pages can use it) ─────────────────────

export const ESTADO_CONFIG: Record<EstadoOrden, { label: string; color: string; bg: string; dot: string; step: number }> = {
  registrada:              { label: 'Registrada',          color: 'text-gray-600',   bg: 'bg-gray-100',   dot: 'bg-gray-400',   step: 1 },
  asignada:                { label: 'Asignada',            color: 'text-blue-700',   bg: 'bg-blue-50',    dot: 'bg-blue-500',   step: 2 },
  en_diagnostico:          { label: 'En Diagnóstico',      color: 'text-cyan-700',  bg: 'bg-cyan-50',  dot: 'bg-cyan-500',  step: 3 },
  esperando_aprobacion:    { label: 'Esp. Aprobación',     color: 'text-orange-600', bg: 'bg-orange-50', dot: 'bg-orange-500',   step: 3 },
  en_reparacion:           { label: 'En Reparación',       color: 'text-cyan-700',  bg: 'bg-cyan-50',  dot: 'bg-cyan-500',  step: 4 },
  liquidacion_diagnostico: { label: 'Liq. Diagnóstico',   color: 'text-orange-600', bg: 'bg-orange-50', dot: 'bg-orange-500',     step: 0 },
  control_calidad:         { label: 'Control Calidad',     color: 'text-cyan-700',  bg: 'bg-cyan-50',  dot: 'bg-cyan-500',  step: 5 },
  liberada:                { label: 'Liberada',            color: 'text-cyan-700',   bg: 'bg-cyan-50',   dot: 'bg-cyan-500',   step: 6 },
  finalizada:              { label: 'Finalizada',          color: 'text-gray-600',    bg: 'bg-gray-100',    dot: 'bg-gray-400',    step: 7 },
  cancelada:               { label: 'Cancelada',           color: 'text-gray-500',     bg: 'bg-gray-50',      dot: 'bg-gray-300',     step: 0 },
};

const PIE_COLORS = ['#6366f1', '#f59e0b', '#f97316', '#ef4444', '#8b5cf6', '#22c55e', '#94a3b8', '#3b82f6'];

// ─── Shared Components ───────────────────────────────────────────────────────

function KpiCard({ icon, label, value, color, sub, alert, trend }: {
  icon: React.ReactNode; label: string; value: number | string; color: string;
  sub?: string; alert?: boolean; trend?: { val: string; up: boolean };
}) {
  return (
    <div className={`bg-white rounded-xl border p-5 relative overflow-hidden ${alert ? 'border-orange-200' : 'border-slate-200'}`}>
      <div className="absolute top-0 left-0 w-1 h-full rounded-l-xl bg-cyan-500 opacity-60" />
      <div className="w-10 h-10 flex items-center justify-center mb-3 bg-slate-100 text-cyan-600 rounded-lg">
        {icon}
      </div>
      <p className={`text-3xl font-bold ${alert ? 'text-orange-500' : 'text-slate-800'}`}>{value}</p>
      <p className="text-base font-medium text-slate-600 mt-1">{label}</p>
      {sub && <p className="text-sm font-normal text-slate-400 mt-1">{sub}</p>}
      {trend && (
        <div className={`flex items-center gap-1 mt-3 text-sm font-medium ${trend.up ? 'text-cyan-600' : 'text-slate-500'}`}>
          <TrendingUp size={14} className={!trend.up ? 'rotate-180' : ''} />
          {trend.val}
        </div>
      )}
    </div>
  );
}

function OTStatusBadge({ estado }: { estado: EstadoOrden }) {
  const cfg = ESTADO_CONFIG[estado];
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function SectionHeader({ title, sub, linkTo, linkLabel }: { title: string; sub?: string; linkTo?: string; linkLabel?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="font-semibold text-slate-800">{title}</h3>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      {linkTo && (
        <NavLink to={linkTo} className="flex items-center gap-1 text-blue-600 text-xs hover:underline">
          {linkLabel || 'Ver todo'} <ArrowRight size={12} />
        </NavLink>
      )}
    </div>
  );
}

// ─── ADMINISTRADOR Dashboard ─────────────────────────────────────────────────

function AdminDashboard() {
  const { clientes, vehiculos, ordenes, repuestos, usuarios, citas, kardex } = useApp();
  const today = new Date().toISOString().split('T')[0];

  const openOrdenes = ordenes.filter(o => !['finalizada', 'cancelada', 'liquidacion_diagnostico'].includes(o.estado));
  const todayCitas = citas.filter(c => c.fecha === today && c.estado !== 'cancelada');
  const pendingApproval = ordenes.filter(o => o.estado === 'esperando_aprobacion');
  const stockBajo = repuestos.filter(r => r.cantidad <= r.stockMinimo);

  const revenue = ordenes
    .filter(o => o.estado === 'finalizada')
    .reduce((s, o) => s + (o.cotizacion?.lineas.reduce((ls, l) => ls + l.cantidad * l.precioUnitario, 0) || 0), 0);

  const revenueThisMonth = ordenes
    .filter(o => o.estado === 'finalizada' && o.fechaActualizacion.startsWith('2026-03'))
    .reduce((s, o) => s + (o.cotizacion?.lineas.reduce((ls, l) => ls + l.cantidad * l.precioUnitario, 0) || 0), 0);

  const pieData = Object.entries(
    ordenes.reduce((acc, o) => {
      if (o.estado !== 'cancelada') acc[o.estado] = (acc[o.estado] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([estado, count]) => ({
    name: ESTADO_CONFIG[estado as EstadoOrden]?.label || estado,
    value: count,
  }));

  const productividadData = usuarios
    .filter(u => u.rol === 'mecanico')
    .map(u => ({
      name: u.nombre.split(' ').slice(0, 2).join(' '), // use first+last to avoid duplicate first-names
      id: u.id,
      completadas: ordenes.filter(o => o.mecanicoId === u.id && o.estado === 'finalizada').length,
      enProceso: ordenes.filter(o => o.mecanicoId === u.id && o.estado === 'en_reparacion').length,
      diagnostico: ordenes.filter(o => o.mecanicoId === u.id && o.estado === 'en_diagnostico').length,
    }));

  const monthlyRevenue = [
    { mes: 'Nov', valor: 2800 }, { mes: 'Dic', valor: 3400 }, { mes: 'Ene', valor: 2200 },
    { mes: 'Feb', valor: 3100 }, { mes: 'Mar', valor: revenueThisMonth || 1850 },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Administrador</h1>
          <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${rolBadgeColors['administrador']}`}>
            {rolLabels['administrador']}
          </span>
        </div>
        <p className="text-slate-500 text-sm">{new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard icon={<DollarSign size={20} />} label="Facturación Total" value={`$${revenue.toFixed(0)}`} color="green" sub="órdenes finalizadas" trend={{ val: '+12% vs mes anterior', up: true }} />
        <KpiCard icon={<ClipboardList size={20} />} label="OTs Activas" value={openOrdenes.length} color="blue" sub="en proceso" />
        <KpiCard icon={<AlertTriangle size={20} />} label="Aprob. Pendientes" value={pendingApproval.length} color="yellow" sub="esperando cliente" alert={pendingApproval.length > 0} />
        <KpiCard icon={<Package size={20} />} label="Stock Bajo" value={stockBajo.length} color="red" sub="por reponer" alert={stockBajo.length > 0} />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {([
          ['Clientes', clientes.length],
          ['Vehículos', vehiculos.length],
          ['Citas Hoy', todayCitas.length],
          ['Mecánicos Activos', usuarios.filter(u => u.rol === 'mecanico' && u.activo).length],
        ] as [string, number][]).map(([label, val]) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between">
            <span className="text-base font-medium text-slate-600">{label}</span>
            <span className="font-bold text-xl text-slate-800">{val}</span>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        {/* Revenue trend */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <SectionHeader title="Tendencia de Ingresos" sub="Últimos 5 meses (USD)" />
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={monthlyRevenue}>
              <defs>
                <linearGradient id="colorValAdmin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`$${v}`]} />
              <Area type="monotone" dataKey="valor" stroke="#3b82f6" fill="url(#colorValAdmin)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* OT Status Pie */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <SectionHeader title="OTs por Estado" />
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                {pieData.map((entry, i) => <Cell key={`pie-cell-${i}-${entry.name}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(val) => [`${val} OTs`]} />
              <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: '10px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Productivity Bar */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <SectionHeader title="Productividad de Mecánicos" />
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={productividadData} barSize={12}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="completadas" name="Finalizadas" fill="#22c55e" radius={[3, 3, 0, 0]} />
              <Bar dataKey="enProceso" name="En Proceso" fill="#f97316" radius={[3, 3, 0, 0]} />
              <Bar dataKey="diagnostico" name="Diagnóstico" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent OTs + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <RecentOTsTable ordenes={[...ordenes].sort((a, b) => b.fechaActualizacion.localeCompare(a.fechaActualizacion)).slice(0, 6)} />
        </div>
        <div className="space-y-4">
          {/* Stock bajo */}
          {stockBajo.length > 0 && (
            <NavLink to="/inventario" className="block bg-red-50 border border-red-200 rounded-xl p-4 hover:bg-red-100 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={15} className="text-red-600" />
                <p className="font-semibold text-red-800 text-sm">{stockBajo.length} repuesto{stockBajo.length > 1 ? 's' : ''} con stock bajo</p>
              </div>
              {stockBajo.slice(0, 3).map(r => (
                <div key={r.id} className="flex justify-between text-xs text-red-700 py-0.5">
                  <span>{r.nombre}</span>
                  <span className="font-bold">{r.cantidad}/{r.stockMinimo}</span>
                </div>
              ))}
              {stockBajo.length > 3 && <p className="text-xs text-red-500 mt-1">+{stockBajo.length - 3} más...</p>}
            </NavLink>
          )}
          {/* Pending approval */}
          {pendingApproval.length > 0 && (
            <NavLink to="/ordenes" className="block bg-amber-50 border border-amber-200 rounded-xl p-4 hover:bg-amber-100 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={15} className="text-amber-600" />
                <p className="font-semibold text-amber-800 text-sm">{pendingApproval.length} cotización{pendingApproval.length > 1 ? 'es' : ''} pendiente{pendingApproval.length > 1 ? 's' : ''}</p>
              </div>
              {pendingApproval.slice(0, 3).map(o => (
                <div key={o.id} className="text-xs text-amber-700 py-0.5">{o.numero}</div>
              ))}
            </NavLink>
          )}
          {/* Citas hoy */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <CalendarDays size={15} className="text-blue-600" />
              <p className="font-semibold text-slate-800 text-sm">Citas de hoy ({todayCitas.length})</p>
            </div>
            <div className="p-4">
              {todayCitas.length === 0 ? (
                <p className="text-xs text-slate-400">Sin citas programadas para hoy</p>
              ) : todayCitas.slice(0, 4).map(c => (
                <div key={c.id} className="text-xs text-slate-600 py-1 border-b border-slate-100 last:border-0">
                  <span className="font-medium text-blue-600">{c.hora}</span> — {c.tipoServicio}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ASESOR Dashboard ────────────────────────────────────────────────────────

function AsesorDashboard() {
  const { clientes, vehiculos, ordenes, citas, currentUser, notificaciones } = useApp();
  const today = new Date().toISOString().split('T')[0];

  const todayCitas = citas.filter(c => c.fecha === today && c.estado !== 'cancelada' && c.estado !== 'completada');
  const citasSinOT = citas.filter(c => c.estado === 'confirmada' && !c.ordenId);
  const misOTs = ordenes.filter(o => o.creadoPor === currentUser?.id || true); // asesor ve todas
  const esperandoAprobacion = ordenes.filter(o => o.estado === 'esperando_aprobacion');
  const liberadas = ordenes.filter(o => o.estado === 'liberada');
  const otsCreadasHoy = ordenes.filter(o => o.fechaCreacion === today);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-gray-900">Panel de Asesor</h1>
          <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${rolBadgeColors['asesor']}`}>
            {rolLabels['asesor']}
          </span>
        </div>
        <p className="text-slate-500 text-sm">Bienvenida, {currentUser?.nombre} · {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard icon={<CalendarDays size={20} />} label="Citas Hoy" value={todayCitas.length} color="blue" sub="programadas" />
        <KpiCard icon={<ClipboardList size={20} />} label="OTs Creadas Hoy" value={otsCreadasHoy.length} color="purple" />
        <KpiCard icon={<AlertTriangle size={20} />} label="Esp. Aprobación" value={esperandoAprobacion.length} color="yellow" alert={esperandoAprobacion.length > 0} sub="requieren seguimiento" />
        <KpiCard icon={<CheckCircle size={20} />} label="Vehículos Listos" value={liberadas.length} color="green" sub="para entregar" alert={liberadas.length > 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Today's appointments */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-800">Agenda de Hoy</h3>
              <p className="text-xs text-slate-400">{todayCitas.length} cita{todayCitas.length !== 1 ? 's' : ''} programada{todayCitas.length !== 1 ? 's' : ''}</p>
            </div>
            <NavLink to="/citas" className="flex items-center gap-1 text-blue-600 text-xs hover:underline">Ver todas <ArrowRight size={11} /></NavLink>
          </div>
          <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {todayCitas.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm">Sin citas para hoy</div>
            ) : todayCitas.map(c => {
              const estCfg: Record<string, string> = {
                pendiente: 'bg-yellow-100 text-yellow-700',
                confirmada: 'bg-green-100 text-green-700',
                en_progreso: 'bg-blue-100 text-blue-700',
              };
              return (
                <div key={c.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="w-14 text-center flex-shrink-0">
                    <p className="text-sm font-bold text-blue-600">{c.hora}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${estCfg[c.estado] || 'bg-gray-100 text-gray-600'}`}>
                      {c.estado === 'en_progreso' ? 'En curso' : c.estado.charAt(0).toUpperCase() + c.estado.slice(1)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{c.tipoServicio}</p>
                    <p className="text-xs text-gray-500 truncate">{c.motivoIngreso}</p>
                  </div>
                  {!c.ordenId && c.estado === 'confirmada' && (
                    <NavLink to="/ordenes" className="text-xs bg-blue-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap flex-shrink-0">
                      Abrir OT
                    </NavLink>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Acciones requeridas */}
        <div className="space-y-3">
          {/* Vehículos listos para entrega — resaltado prominente */}
          {liberadas.length > 0 && (
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl p-4 shadow-lg shadow-emerald-100">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={18} className="text-white" />
                <p className="font-bold text-white">{liberadas.length} vehículo{liberadas.length > 1 ? 's' : ''} listo{liberadas.length > 1 ? 's' : ''} para entrega 🎉</p>
              </div>
              {liberadas.map(o => {
                const cli = clientes.find(c => c.id === o.clienteId);
                const veh = vehiculos.find(v => v.id === o.vehiculoId);
                const total = (o.cotizacion?.lineas || []).reduce((s,l) => s + l.cantidad * l.precioUnitario, 0);
                return (
                  <div key={o.id} className="mb-2 bg-white/15 rounded-lg px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-white font-bold text-sm">{o.numero}</p>
                        <p className="text-emerald-100 text-xs">{cli?.nombre} · {veh?.placa}</p>
                        <p className="text-emerald-200 text-xs">
                          {o.pagadoEnLinea
                            ? <span className="font-semibold text-cyan-200">✅ Pagado en línea — solo entregar</span>
                            : <>Código recojo: <span className="font-mono">{o.numero}</span></>
                          }
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold">${(total * 1.12).toFixed(2)}</p>
                        {o.pagadoEnLinea && <p className="text-xs text-cyan-200 font-medium">Pago: {o.metodoPagoFinal}</p>}
                        <NavLink to="/ordenes" className="text-xs bg-white text-emerald-700 px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 font-bold mt-1 inline-block">
                          {o.pagadoEnLinea ? 'Confirmar entrega →' : 'Cobrar y Entregar →'}
                        </NavLink>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Cotizaciones esperando aprobación */}
          {esperandoAprobacion.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={16} className="text-amber-600" />
                <p className="font-semibold text-amber-800 text-sm">Cotizaciones en espera</p>
              </div>
              {esperandoAprobacion.slice(0, 3).map(o => (
                <div key={o.id} className="flex items-center justify-between py-1.5 border-b border-amber-100 last:border-0">
                  <span className="text-sm text-amber-800">{o.numero}</span>
                  <NavLink to="/ordenes" className="text-xs text-amber-700 hover:underline flex items-center gap-1">
                    Revisar <ArrowRight size={10} />
                  </NavLink>
                </div>
              ))}
            </div>
          )}

          {/* Stats rápidos */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-slate-800">{clientes.length}</p>
              <p className="text-xs text-slate-500 mt-0.5">Clientes Registrados</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-slate-800">{vehiculos.length}</p>
              <p className="text-xs text-slate-500 mt-0.5">Vehículos en Sistema</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent OTs */}
      <RecentOTsTable ordenes={[...ordenes].sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion)).slice(0, 6)} title="Órdenes Recientes" />
    </div>
  );
}

// ─── JEFE DE TALLER Dashboard ────────────────────────────────────────────────

function JefeTallerDashboard() {
  const { ordenes, usuarios, currentUser, repuestos } = useApp();

  const mecanicos = usuarios.filter(u => u.rol === 'mecanico' && u.activo);
  const sinAsignar = ordenes.filter(o => o.estado === 'registrada' && !o.mecanicoId);
  const enDiagnostico = ordenes.filter(o => o.estado === 'en_diagnostico');
  const enReparacion = ordenes.filter(o => o.estado === 'en_reparacion');
  const enQC = ordenes.filter(o => o.estado === 'control_calidad');
  const liberadas = ordenes.filter(o => o.estado === 'liberada');

  const productividadMecanicos = mecanicos.map(m => {
    const misOTs = ordenes.filter(o => o.mecanicoId === m.id || o.mecanicosIds?.includes(m.id));
    const completadas = misOTs.filter(o => ['finalizada', 'liberada'].includes(o.estado)).length;
    const activas = misOTs.filter(o => ['en_diagnostico', 'en_reparacion', 'control_calidad'].includes(o.estado)).length;
    const pendientes = misOTs.filter(o => o.estado === 'esperando_aprobacion').length;
    return { name: m.nombre.split(' ')[0], completadas, activas, pendientes, totalOTs: misOTs.length };
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-gray-900">Panel Jefe de Taller</h1>
          <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${rolBadgeColors['jefe_taller']}`}>
            {rolLabels['jefe_taller']}
          </span>
        </div>
        <p className="text-slate-500 text-sm">Bienvenido/a, {currentUser?.nombre} · Control operativo del taller</p>
      </div>

      {/* KPIs críticos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard icon={<AlertCircle size={20} />} label="Sin Asignar" value={sinAsignar.length} color="red" sub="requieren mecánico" alert={sinAsignar.length > 0} />
        <KpiCard icon={<Wrench size={20} />} label="En Reparación" value={enReparacion.length} color="orange" sub="en progreso" />
        <KpiCard icon={<ShieldCheck size={20} />} label="Control Calidad" value={enQC.length} color="purple" sub="pendientes de revisar" alert={enQC.length > 0} />
        <KpiCard icon={<CheckCircle size={20} />} label="Liberadas" value={liberadas.length} color="green" sub="listas p/ entrega" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* OTs que necesitan asignación */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-red-50/80">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-red-500" />
              <h3 className="font-semibold text-gray-800">OTs Sin Mecánico Asignado</h3>
            </div>
            <NavLink to="/ordenes" className="text-xs text-blue-600 hover:underline flex items-center gap-1">Ver en OTs <ArrowRight size={10} /></NavLink>
          </div>
          <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {sinAsignar.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle size={24} className="text-green-400 mx-auto mb-1" />
                <p className="text-slate-400 text-sm">Todas las OTs están asignadas</p>
              </div>
            ) : sinAsignar.map(o => (
              <div key={o.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-blue-600">{o.numero}</p>
                  <p className="text-xs text-gray-500 truncate max-w-48">{o.descripcionProblema}</p>
                  <p className="text-xs text-gray-400">Creada: {o.fechaCreacion}</p>
                </div>
                <NavLink to="/ordenes" className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 whitespace-nowrap flex-shrink-0">
                  Asignar
                </NavLink>
              </div>
            ))}
          </div>
        </div>

        {/* Control de Calidad pendiente */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-purple-50/80">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-purple-600" />
              <h3 className="font-semibold text-gray-800">Pendientes de Control Calidad</h3>
            </div>
          </div>
          <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {enQC.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle size={24} className="text-green-400 mx-auto mb-1" />
                <p className="text-slate-400 text-sm">Sin órdenes en control de calidad</p>
              </div>
            ) : enQC.map(o => {
              const mec = usuarios.find(u => u.id === o.mecanicoId);
              return (
                <div key={o.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-blue-600">{o.numero}</p>
                    <p className="text-xs text-gray-500">{mec ? `Mecánico: ${mec.nombre}` : 'Sin mecánico'}</p>
                    <p className="text-xs text-gray-400">Actualizado: {o.fechaActualizacion}</p>
                  </div>
                  <NavLink to="/ordenes" className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 whitespace-nowrap">
                    Revisar QC
                  </NavLink>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Productividad por mecánico */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5">
        <SectionHeader title="Carga de Trabajo por Mecánico" sub="Distribución actual de órdenes" />
        {productividadMecanicos.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-4">No hay mecánicos registrados</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {productividadMecanicos.map(m => {
              const pct = m.totalOTs > 0 ? Math.round((m.activas / Math.max(m.totalOTs, 1)) * 100) : 0;
              return (
                <div key={m.name} className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-700 text-xs font-bold">{m.name[0]}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{m.name}</p>
                      <p className="text-xs text-gray-400">{m.totalOTs} OTs totales</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-orange-600">Activas: {m.activas}</span>
                      <span className="text-green-600">Completadas: {m.completadas}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-orange-500 h-2 rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Barra de estado de taller */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <SectionHeader title="Estado General del Taller" />
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: 'Registradas', count: ordenes.filter(o => o.estado === 'registrada').length, color: 'bg-slate-100 text-slate-700', icon: <ClipboardList size={16} /> },
            { label: 'Diagnóstico', count: enDiagnostico.length, color: 'bg-violet-100 text-violet-700', icon: <Activity size={16} /> },
            { label: 'Reparación', count: enReparacion.length, color: 'bg-orange-100 text-orange-700', icon: <Wrench size={16} /> },
            { label: 'Control QC', count: enQC.length, color: 'bg-purple-100 text-purple-700', icon: <ShieldCheck size={16} /> },
            { label: 'Liberadas', count: liberadas.length, color: 'bg-green-100 text-green-700', icon: <CheckCircle size={16} /> },
          ].map(s => (
            <div key={s.label} className={`rounded-lg p-3 text-center ${s.color}`}>
              <div className="flex justify-center mb-1">{s.icon}</div>
              <p className="text-2xl font-bold">{s.count}</p>
              <p className="text-xs font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MECÁNICO Dashboard ──────────────────────────────────────────────────────

function MecanicoDashboard() {
  const { ordenes, clientes, vehiculos, currentUser, repuestos } = useApp();

  const misOrdenes = ordenes.filter(o =>
    o.mecanicoId === currentUser?.id || o.mecanicosIds?.includes(currentUser?.id || '')
  );

  const urgentes = misOrdenes.filter(o => o.estado === 'en_diagnostico');
  const enReparacion = misOrdenes.filter(o => o.estado === 'en_reparacion');
  const finalizadas = misOrdenes.filter(o => o.estado === 'finalizada');
  const esperando = misOrdenes.filter(o => o.estado === 'esperando_aprobacion');
  const stockBajo = repuestos.filter(r => r.cantidad <= r.stockMinimo);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-gray-900">Mi Panel de Trabajo</h1>
          <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${rolBadgeColors['mecanico']}`}>
            {rolLabels['mecanico']}
          </span>
        </div>
        <p className="text-slate-500 text-sm">Bienvenido, {currentUser?.nombre} · {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard icon={<Activity size={20} />} label="En Diagnóstico" value={urgentes.length} color="purple" sub="pendientes de diagnóstico" alert={urgentes.length > 0} />
        <KpiCard icon={<Wrench size={20} />} label="En Reparación" value={enReparacion.length} color="orange" sub="trabajos activos" />
        <KpiCard icon={<Clock size={20} />} label="Esp. Aprobación" value={esperando.length} color="yellow" sub="cotizaciones enviadas" />
        <KpiCard icon={<CheckCircle size={20} />} label="Finalizadas" value={finalizadas.length} color="green" sub="completadas" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Mis OTs activas */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-semibold text-slate-800">Mis Órdenes Activas</h3>
            <p className="text-xs text-slate-400">{misOrdenes.filter(o => !['finalizada', 'cancelada'].includes(o.estado)).length} en proceso</p>
          </div>
          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {misOrdenes.filter(o => !['finalizada', 'cancelada', 'liberada'].includes(o.estado)).length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-sm">
                <Wrench size={24} className="mx-auto mb-2 opacity-30" />
                No tienes órdenes activas
              </div>
            ) : misOrdenes.filter(o => !['finalizada', 'cancelada', 'liberada'].includes(o.estado)).map(o => {
              const veh = vehiculos.find(v => v.id === o.vehiculoId);
              const cli = clientes.find(c => c.id === o.clienteId);
              const cfg = ESTADO_CONFIG[o.estado as EstadoOrden];
              const tareasTotal = o.tareas?.length || 0;
              const tareasListas = o.tareas?.filter(t => t.estado === 'completada').length || 0;
              return (
                <div key={o.id} className="px-5 py-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-bold text-blue-600">{o.numero}</p>
                      <p className="text-xs text-gray-500">{veh?.placa} · {veh?.marca} {veh?.modelo}</p>
                      <p className="text-xs text-gray-400">{cli?.nombre}</p>
                    </div>
                    <OTStatusBadge estado={o.estado} />
                  </div>
                  {tareasTotal > 0 && (
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progreso de tareas</span>
                        <span>{tareasListas}/{tareasTotal}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${tareasTotal > 0 ? (tareasListas / tareasTotal) * 100 : 0}%` }} />
                      </div>
                    </div>
                  )}
                  <NavLink to="/ordenes" className="inline-flex items-center gap-1 text-xs text-blue-600 mt-2 hover:underline">
                    Abrir OT <ArrowRight size={10} />
                  </NavLink>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tareas pendientes + Stock bajo */}
        <div className="space-y-4">
          {/* Tareas pendientes */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
              <CheckSquare size={16} className="text-orange-600" />
              <h3 className="font-semibold text-slate-800 text-sm">Mis Tareas Pendientes</h3>
            </div>
            <div className="p-4">
            {(() => {
              const allTareas = misOrdenes.flatMap(o =>
                (o.tareas || [])
                  .filter(t => t.estado !== 'completada')
                  .map(t => ({ ...t, ordenNumero: o.numero, ordenId: o.id }))
              );
              return allTareas.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-3">Sin tareas pendientes</p>
              ) : allTareas.slice(0, 4).map(t => (
                <div key={t.id} className="flex items-center gap-2 py-2 border-b border-slate-100 last:border-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${t.estado === 'en_progreso' ? 'bg-orange-500' : 'bg-slate-300'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 truncate">{t.descripcion}</p>
                    <p className="text-xs text-slate-400">{t.ordenNumero}</p>
                  </div>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${t.estado === 'en_progreso' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}`}>
                    {t.estado === 'en_progreso' ? 'En curso' : 'Pendiente'}
                  </span>
                </div>
              ));
            })()}
            </div>
          </div>

          {/* Stock bajo */}
          {stockBajo.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={14} className="text-amber-600" />
                <p className="text-sm font-semibold text-amber-800">Repuestos con stock bajo</p>
              </div>
              {stockBajo.slice(0, 3).map(r => (
                <div key={r.id} className="flex justify-between text-xs text-amber-700 py-1 border-b border-amber-100 last:border-0">
                  <span>{r.nombre}</span>
                  <span className="font-bold">{r.cantidad} uds</span>
                </div>
              ))}
              <NavLink to="/inventario" className="text-xs text-amber-700 mt-2 hover:underline flex items-center gap-1">
                Ver inventario <ArrowRight size={10} />
              </NavLink>
            </div>
          )}

          {/* Resumen personal */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
              <h4 className="text-sm font-semibold text-slate-800">Mi Resumen</h4>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div>
                  <p className="text-xl font-bold text-slate-800">{misOrdenes.length}</p>
                  <p className="text-xs text-slate-500">Total OTs asignadas</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-green-600">{finalizadas.length}</p>
                  <p className="text-xs text-slate-500">Completadas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Historial reciente */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-semibold text-slate-800">Historial de Mis Órdenes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200">
                {['Orden', 'Vehículo', 'Problema', 'Estado', 'Actualizado'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {misOrdenes.length === 0 ? (
                <tr><td colSpan={5} className="py-10 text-center text-slate-400 text-sm">Sin órdenes asignadas</td></tr>
              ) : misOrdenes.slice(0, 6).map(o => {
                const veh = vehiculos.find(v => v.id === o.vehiculoId);
                return (
                  <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-sm font-bold text-blue-600">{o.numero}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">{veh ? `${veh.placa} · ${veh.marca}` : '—'}</td>
                    <td className="px-5 py-3 text-xs text-slate-500 max-w-48 truncate">{o.descripcionProblema}</td>
                    <td className="px-5 py-3"><OTStatusBadge estado={o.estado} /></td>
                    <td className="px-5 py-3 text-xs text-slate-400">{o.fechaActualizacion}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── CLIENTE Dashboard ───────────────────────────────────────────────────────

function ClienteDashboard() {
  const { clientes, vehiculos, ordenes, currentUser } = useApp();

  const clienteActual = clientes.find(c => c.usuarioId === currentUser?.id || c.nombre === currentUser?.nombre);
  const misVehiculos = vehiculos.filter(v => clienteActual ? v.clienteId === clienteActual.id : false);
  const misOrdenes = ordenes.filter(o => misVehiculos.some(v => v.id === o.vehiculoId));

  const esperandoMiAprobacion = misOrdenes.filter(o => o.estado === 'esperando_aprobacion');
  const vehiculosListos = misOrdenes.filter(o => o.estado === 'liberada');
  const activas = misOrdenes.filter(o => !['finalizada', 'cancelada', 'liquidacion_diagnostico'].includes(o.estado));

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-gray-900">Mi Portal</h1>
          <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${rolBadgeColors['cliente']}`}>
            {rolLabels['cliente']}
          </span>
        </div>
        <p className="text-gray-500 text-sm">Bienvenido/a, {currentUser?.nombre}</p>
      </div>

      {/* Alertas urgentes */}
      {esperandoMiAprobacion.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 mb-5 flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900">¡Tienes cotizaciones pendientes de aprobación!</p>
            <p className="text-amber-700 text-sm mt-0.5">Revisa las cotizaciones a continuación para autorizar o rechazar la reparación de tu vehículo.</p>
          </div>
        </div>
      )}

      {vehiculosListos.length > 0 && (
        <div className="bg-green-50 border border-green-300 rounded-xl p-4 mb-5 flex items-start gap-3">
          <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-900">¡Tu vehículo está listo para retiro!</p>
            <p className="text-green-700 text-sm mt-0.5">{vehiculosListos.map(o => o.numero).join(', ')} — Comunícate con el taller para coordinar la entrega.</p>
          </div>
        </div>
      )}

      {/* KPIs del cliente */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <KpiCard icon={<Car size={20} />} label="Mis Vehículos" value={misVehiculos.length} color="blue" />
        <KpiCard icon={<ClipboardList size={20} />} label="Órdenes Activas" value={activas.length} color="orange" />
        <KpiCard icon={<CheckCircle size={20} />} label="Historial Total" value={misOrdenes.length} color="green" />
      </div>

      {/* Mis Vehículos */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-5">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Mis Vehículos</h3>
        </div>
        {misVehiculos.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-sm">No tienes vehículos registrados aún. El taller los añadirá al abrir tu primera orden de servicio.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
            {misVehiculos.map(v => {
              const vOrdenes = misOrdenes.filter(o => o.vehiculoId === v.id);
              const ultimaOT = vOrdenes[vOrdenes.length - 1];
              return (
                <div key={v.id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-gray-800">{v.placa}</p>
                      <p className="text-sm text-gray-600">{v.marca} {v.modelo} {v.año}</p>
                      <p className="text-xs text-gray-400">{v.color} · {v.kilometraje} km</p>
                    </div>
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                      <Car size={18} className="text-blue-600" />
                    </div>
                  </div>
                  <div className="border-t border-gray-100 pt-2 mt-2">
                    <p className="text-xs text-gray-500">{vOrdenes.length} servicio{vOrdenes.length !== 1 ? 's' : ''} registrado{vOrdenes.length !== 1 ? 's' : ''}</p>
                    {ultimaOT && <OTStatusBadge estado={ultimaOT.estado} />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Mis Órdenes */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Estado de Mis Servicios</h3>
          <p className="text-xs text-gray-400">{misOrdenes.length} servicio{misOrdenes.length !== 1 ? 's' : ''} en total</p>
        </div>
        {misOrdenes.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">No tienes órdenes de servicio registradas</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {[...misOrdenes].reverse().map(o => {
              const cfg = ESTADO_CONFIG[o.estado as EstadoOrden];
              const veh = vehiculos.find(v => v.id === o.vehiculoId);
              const total = o.cotizacion?.lineas.reduce((s: any, l: any) => s + l.cantidad * l.precioUnitario, 0) || 0;
              const needsApproval = o.estado === 'esperando_aprobacion';
              return (
                <div key={o.id} className={`px-5 py-4 ${needsApproval ? 'bg-amber-50/50' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-blue-600 text-sm">{o.numero}</p>
                        {needsApproval && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">¡Acción requerida!</span>}
                      </div>
                      <p className="text-gray-500 text-xs">{veh?.placa} · {veh?.marca} {veh?.modelo}</p>
                      <p className="text-gray-600 text-xs mt-1 line-clamp-2">{o.descripcionProblema}</p>
                      {o.diagnostico && (
                        <p className="text-xs text-gray-500 mt-1"><span className="font-medium">Diagnóstico:</span> {o.diagnostico}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <OTStatusBadge estado={o.estado} />
                      {total > 0 && <p className="text-sm font-bold text-gray-800 mt-2">${total.toFixed(2)}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">{o.fechaCreacion}</p>
                    </div>
                  </div>

                  {/* Cotización para aprobación */}
                  {needsApproval && o.cotizacion && (
                    <div className="mt-3 bg-white border border-amber-200 rounded-lg p-3">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Detalle de cotización:</p>
                      {o.cotizacion.lineas.map(l => (
                        <div key={l.id} className="flex justify-between text-xs text-gray-600 py-0.5">
                          <span>{l.descripcion} (x{l.cantidad})</span>
                          <span className="font-medium">${(l.cantidad * l.precioUnitario).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between">
                        <span className="text-sm font-bold text-gray-800">Total</span>
                        <span className="text-sm font-bold text-gray-800">${total.toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-blue-700 mt-2 font-medium">👆 Haz clic en "Ver OT" para aprobar o rechazar esta cotización directamente.</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shared: Recent OTs Table ────────────────────────────────────────────────

function RecentOTsTable({ ordenes, title = 'Órdenes Recientes' }: {
  ordenes: ReturnType<typeof useApp>['ordenes']; title?: string;
}) {
  const { clientes, vehiculos, usuarios } = useApp();
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <NavLink to="/ordenes" className="flex items-center gap-1 text-blue-600 text-xs hover:underline">Ver todas <ArrowRight size={11} /></NavLink>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {['Nro.', 'Cliente', 'Vehículo', 'Mecánico', 'Estado', 'Actualizado'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {ordenes.length === 0 ? (
              <tr><td colSpan={6} className="py-10 text-center text-gray-400 text-sm">Sin órdenes</td></tr>
            ) : ordenes.map(o => {
              const cfg = ESTADO_CONFIG[o.estado as EstadoOrden];
              const veh = vehiculos.find(v => v.id === o.vehiculoId);
              const mec = usuarios.find(u => u.id === o.mecanicoId);
              const cli = clientes.find(c => c.id === o.clienteId);
              return (
                <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-bold text-blue-600">{o.numero}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-700">{cli?.nombre || '—'}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{veh ? `${veh.placa} · ${veh.marca}` : '—'}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">{mec?.nombre || <span className="italic text-gray-300 text-xs">Sin asignar</span>}</td>
                  <td className="px-5 py-3.5"><OTStatusBadge estado={o.estado} /></td>
                  <td className="px-5 py-3.5 text-xs text-gray-400">{o.fechaActualizacion}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Export ─────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { currentUser } = useApp();

  if (!currentUser) return null;

  switch (currentUser.rol) {
    case 'administrador': return <AdminDashboard />;
    case 'asesor':        return <AsesorDashboard />;
    case 'jefe_taller':   return <JefeTallerDashboard />;
    case 'mecanico':      return <MecanicoDashboard />;
    case 'cliente':       return <ClienteDashboard />;
    default:              return <AdminDashboard />;
  }
}