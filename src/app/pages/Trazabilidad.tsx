import React, { useState } from 'react';
import {
  Search, Car, User, CalendarDays, ClipboardList, Wrench,
  Package, CheckCircle, XCircle, Clock, DollarSign, FileText,
  ShieldCheck, ChevronDown, ChevronUp, AlertCircle, Receipt,
  History, Phone, Mail, Hash
} from 'lucide-react';
import {
  useApp, OrdenTrabajo, Cita, EstadoOrden, EstadoCita,
  PersonalTaller, Repuesto, Factura
} from '../context/AppContext';

// ─── Estado configs ───────────────────────────────────────────────────────────

const ORDEN_CFG: Record<EstadoOrden, { label: string; color: string; bg: string }> = {
  registrada:              { label: 'Registrada',           color: 'text-slate-700',  bg: 'bg-slate-100'  },
  en_diagnostico:          { label: 'En Diagnóstico',       color: 'text-blue-700',   bg: 'bg-blue-100'   },
  esperando_aprobacion:    { label: 'Esp. Aprobación',      color: 'text-amber-700',  bg: 'bg-amber-100'  },
  en_reparacion:           { label: 'En Reparación',        color: 'text-purple-700', bg: 'bg-purple-100' },
  liquidacion_diagnostico: { label: 'Liquidación',          color: 'text-orange-700', bg: 'bg-orange-100' },
  control_calidad:         { label: 'Control Calidad',      color: 'text-teal-700',   bg: 'bg-teal-100'   },
  liberada:                { label: 'Liberada',             color: 'text-emerald-700',bg: 'bg-emerald-100'},
  finalizada:              { label: 'Finalizada',           color: 'text-green-700',  bg: 'bg-green-100'  },
  cancelada:               { label: 'Cancelada',            color: 'text-red-700',    bg: 'bg-red-100'    },
};

const CITA_CFG: Record<EstadoCita, { label: string; color: string; bg: string }> = {
  pendiente:   { label: 'Pendiente',  color: 'text-amber-700', bg: 'bg-amber-100' },
  confirmada:  { label: 'Confirmada', color: 'text-green-700', bg: 'bg-green-100' },
  en_progreso: { label: 'En Proceso', color: 'text-blue-700',  bg: 'bg-blue-100'  },
  completada:  { label: 'Completada', color: 'text-gray-600',  bg: 'bg-gray-100'  },
  cancelada:   { label: 'Cancelada',  color: 'text-red-700',   bg: 'bg-red-100'   },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function parseDate(dateStr: string): { d: string; m: string; y: string } {
  const [y, m, d] = (dateStr || '').split('T')[0].split('-');
  return { d: d ?? '—', m: MONTHS[Number(m) - 1] ?? '—', y: y ?? '—' };
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Entry =
  | { kind: 'cita';  data: Cita;          sortKey: string }
  | { kind: 'orden'; data: OrdenTrabajo;  sortKey: string };

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="px-5 py-4">
      <div className="flex items-center gap-1.5 mb-3">
        {icon}
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{title}</p>
      </div>
      {children}
    </div>
  );
}

// ─── Cita row ─────────────────────────────────────────────────────────────────

function CitaEntry({ cita, ordenes }: { cita: Cita; ordenes: OrdenTrabajo[] }) {
  const cfg = CITA_CFG[cita.estado];
  const { d, m } = parseDate(cita.fecha);
  const otVinculada = ordenes.find(o => o.citaId === cita.id);

  return (
    <div className="relative pl-12">
      <div className="absolute left-[18px] top-[18px] w-2.5 h-2.5 rounded-full bg-white border-2 border-amber-400 z-10" />
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 bg-amber-50 border border-amber-100 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
            <p className="text-sm font-bold text-amber-700 leading-none">{d}</p>
            <p className="text-xs text-amber-500">{m}</p>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wide">Cita</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>
                {cfg.label}
              </span>
            </div>
            <p className="font-semibold text-gray-800 text-sm mt-0.5">{cita.tipoServicio || 'Por confirmar'}</p>
            <div className="flex items-center gap-3 text-xs text-gray-400 mt-1 flex-wrap">
              <span className="flex items-center gap-1"><Clock size={10} /> {cita.hora}</span>
              {cita.motivoIngreso && <span className="truncate">{cita.motivoIngreso}</span>}
            </div>
            {cita.notas && (
              <p className="text-xs text-gray-500 mt-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg leading-relaxed">
                {cita.notas}
              </p>
            )}
            {otVinculada && (
              <div className="mt-2 inline-flex items-center gap-1.5 text-xs bg-blue-50 border border-blue-100 text-blue-700 px-2.5 py-1 rounded-lg">
                <ClipboardList size={10} /> OT vinculada: <strong>{otVinculada.numero}</strong>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Orden row ────────────────────────────────────────────────────────────────

function OrdenEntry({
  orden, personal, repuestos, facturas, expanded, onToggle,
}: {
  orden: OrdenTrabajo;
  personal: PersonalTaller[];
  repuestos: Repuesto[];
  facturas: Factura[];
  expanded: boolean;
  onToggle: () => void;
}) {
  const cfg = ORDEN_CFG[orden.estado];
  const { d, m } = parseDate(orden.fechaCreacion);
  const mecanico = personal.find(p => p.id === orden.mecanicoId);
  const facturaOT = facturas.find(f => f.ordenId === orden.id);
  const repUsados = orden.repuestosUsados ?? [];
  const lineas = orden.cotizacion?.lineas ?? [];
  const totalRep = repUsados.reduce((s, r) => s + r.cantidad * r.precio, 0);
  const totalLineas = lineas.reduce((s, l) => s + l.cantidad * l.precioUnitario, 0);
  const totalOT = facturaOT?.total ?? totalLineas;
  const isTerminada = ['finalizada', 'liberada', 'cancelada'].includes(orden.estado);

  return (
    <div className="relative pl-12">
      <div className={`absolute left-[18px] top-[18px] w-2.5 h-2.5 rounded-full bg-white border-2 z-10 ${isTerminada ? 'border-green-500' : 'border-blue-500'}`} />
      <div className={`bg-white border rounded-xl overflow-hidden transition-shadow ${expanded ? 'border-slate-300 shadow-sm' : 'border-gray-200'}`}>

        {/* Header — always visible */}
        <button onClick={onToggle} className="w-full text-left px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 bg-slate-800 rounded-xl flex flex-col items-center justify-center flex-shrink-0 text-white">
                <p className="text-sm font-bold leading-none">{d}</p>
                <p className="text-xs text-slate-400">{m}</p>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    {orden.numero}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>
                    {cfg.label}
                  </span>
                </div>
                <p className="font-semibold text-gray-800 text-sm mt-0.5 line-clamp-1">
                  {orden.descripcionProblema}
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-400 mt-1 flex-wrap">
                  {mecanico && (
                    <span className="flex items-center gap-1"><Wrench size={10} /> {mecanico.nombre}</span>
                  )}
                  {repUsados.length > 0 && (
                    <span className="flex items-center gap-1"><Package size={10} /> {repUsados.length} repuesto{repUsados.length !== 1 ? 's' : ''}</span>
                  )}
                  {totalOT > 0 && (
                    <span className="flex items-center gap-1 font-semibold text-emerald-600">
                      <DollarSign size={10} /> {totalOT.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {expanded ? <ChevronUp size={15} className="text-gray-400 flex-shrink-0 mt-1" /> : <ChevronDown size={15} className="text-gray-400 flex-shrink-0 mt-1" />}
          </div>
        </button>

        {/* Expanded detail */}
        {expanded && (
          <div className="border-t border-gray-100 divide-y divide-gray-50">

            {/* Diagnóstico */}
            {orden.diagnostico && (
              <Section title="Diagnóstico" icon={<Wrench size={12} className="text-blue-500" />}>
                <p className="text-sm text-gray-700 leading-relaxed">{orden.diagnostico}</p>
                {orden.fallasAdicionales && (
                  <div className="mt-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-700">
                    <span className="font-semibold">Fallas adicionales: </span>{orden.fallasAdicionales}
                  </div>
                )}
              </Section>
            )}

            {/* Reparación */}
            {orden.reparacion && (
              <Section title="Reparación realizada" icon={<CheckCircle size={12} className="text-emerald-500" />}>
                <p className="text-sm text-gray-700 leading-relaxed">{orden.reparacion}</p>
              </Section>
            )}

            {/* Repuestos usados */}
            {repUsados.length > 0 && (
              <Section title="Repuestos utilizados" icon={<Package size={12} className="text-purple-500" />}>
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-3 py-2 font-semibold text-gray-500">Repuesto</th>
                        <th className="text-center px-3 py-2 font-semibold text-gray-500">Cant.</th>
                        <th className="text-right px-3 py-2 font-semibold text-gray-500">P. Unit.</th>
                        <th className="text-right px-3 py-2 font-semibold text-gray-500">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {repUsados.map((r, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium text-gray-700">{r.nombre}</td>
                          <td className="px-3 py-2 text-center text-gray-500">{r.cantidad}</td>
                          <td className="px-3 py-2 text-right text-gray-500">${r.precio.toFixed(2)}</td>
                          <td className="px-3 py-2 text-right font-semibold text-gray-700">
                            ${(r.cantidad * r.precio).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-200">
                      <tr>
                        <td colSpan={3} className="px-3 py-2 text-right font-semibold text-gray-600 text-xs">
                          Total repuestos
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-gray-800 text-xs">
                          ${totalRep.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </Section>
            )}

            {/* Cotización */}
            {lineas.length > 0 && (
              <Section title="Cotización / Presupuesto" icon={<FileText size={12} className="text-orange-500" />}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    orden.cotizacion?.estado === 'aprobada'  ? 'bg-green-100 text-green-700'  :
                    orden.cotizacion?.estado === 'rechazada' ? 'bg-red-100 text-red-700'      :
                    orden.cotizacion?.estado === 'enviada'   ? 'bg-blue-100 text-blue-700'    :
                                                               'bg-gray-100 text-gray-600'
                  }`}>
                    {(orden.cotizacion?.estado ?? 'pendiente').charAt(0).toUpperCase() +
                     (orden.cotizacion?.estado ?? 'pendiente').slice(1)}
                  </span>
                  {orden.cotizacion?.metodoPago && (
                    <span className="text-xs text-gray-400">{orden.cotizacion.metodoPago}</span>
                  )}
                </div>
                <div className="border border-gray-100 rounded-xl overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-3 py-2 font-semibold text-gray-500">Concepto</th>
                        <th className="text-center px-3 py-2 font-semibold text-gray-500">Tipo</th>
                        <th className="text-center px-3 py-2 font-semibold text-gray-500">Cant.</th>
                        <th className="text-right px-3 py-2 font-semibold text-gray-500">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {lineas.map((l, i) => (
                        <tr key={i} className={`hover:bg-gray-50 ${l.rechazado ? 'opacity-40 line-through' : ''}`}>
                          <td className="px-3 py-2 text-gray-700">{l.descripcion}</td>
                          <td className="px-3 py-2 text-center">
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                              l.tipo === 'repuesto'      ? 'bg-purple-100 text-purple-600' :
                              l.tipo === 'mano_de_obra'  ? 'bg-blue-100 text-blue-600'    :
                                                           'bg-gray-100 text-gray-500'
                            }`}>
                              {l.tipo === 'mano_de_obra' ? 'M.O.' : l.tipo === 'repuesto' ? 'Rep.' : 'Diag.'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center text-gray-500">{l.cantidad}</td>
                          <td className="px-3 py-2 text-right font-semibold text-gray-700">
                            ${(l.cantidad * l.precioUnitario).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-200">
                      <tr>
                        <td colSpan={3} className="px-3 py-2 text-right font-semibold text-gray-600 text-xs">
                          Total presupuesto
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-emerald-700 text-xs">
                          ${totalLineas.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </Section>
            )}

            {/* Control de calidad */}
            {orden.controlCalidad && (
              <Section title="Control de Calidad" icon={<ShieldCheck size={12} className="text-teal-500" />}>
                <div className={`flex items-start gap-3 p-3 rounded-xl ${orden.controlCalidad.aprobado ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
                  {orden.controlCalidad.aprobado
                    ? <CheckCircle size={15} className="text-green-500 flex-shrink-0 mt-0.5" />
                    : <XCircle    size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                  }
                  <div>
                    <p className={`text-sm font-semibold ${orden.controlCalidad.aprobado ? 'text-green-700' : 'text-red-700'}`}>
                      {orden.controlCalidad.aprobado ? 'Aprobado' : 'Rechazado'}
                      {orden.controlCalidad.pruebaRuta && ' — Prueba de ruta realizada'}
                    </p>
                    {orden.controlCalidad.observaciones && (
                      <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                        {orden.controlCalidad.observaciones}
                      </p>
                    )}
                    {(orden.controlCalidad.tareasPendientes ?? []).length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {orden.controlCalidad.tareasPendientes!.map((t, i) => (
                          <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                            <span className="mt-0.5 w-1 h-1 rounded-full bg-amber-400 flex-shrink-0" />
                            {t}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </Section>
            )}

            {/* Factura */}
            {facturaOT && (
              <Section title="Factura emitida" icon={<Receipt size={12} className="text-gray-500" />}>
                <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                  <div>
                    <p className="font-bold text-gray-800 font-mono">{facturaOT.numero}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {facturaOT.fecha} · {facturaOT.metodoPago}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-700 text-lg">${facturaOT.total.toFixed(2)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      facturaOT.estado === 'pagada' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {facturaOT.estado === 'pagada' ? 'Pagada' : 'Emitida'}
                    </span>
                  </div>
                </div>
              </Section>
            )}

            {/* Sin detalle */}
            {!orden.diagnostico && !orden.reparacion && repUsados.length === 0 && lineas.length === 0 && !orden.controlCalidad && !facturaOT && (
              <div className="px-5 py-6 text-center">
                <Wrench size={24} className="mx-auto mb-2 text-gray-200" />
                <p className="text-sm text-gray-400">OT en proceso — sin detalles registrados aún</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Trazabilidad() {
  const { vehiculos, clientes, citas, ordenes, personal, repuestos, facturas, currentUser } = useApp();

  const isCliente = currentUser?.rol === 'cliente';

  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState('');
  const [selectedVehId, setSelectedVehId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) =>
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // Clientes solo ven sus propios vehículos
  const clienteActual = isCliente
    ? clientes.find(c => c.usuarioId === currentUser?.id || c.nombre === currentUser?.nombre)
    : null;

  const searchableVehiculos = isCliente && clienteActual
    ? vehiculos.filter(v => v.clienteId === clienteActual.id)
    : vehiculos;

  const matches = searched.length >= 2
    ? searchableVehiculos.filter(v =>
        v.placa.toLowerCase().includes(searched.toLowerCase().trim())
      )
    : [];

  const vehiculo = selectedVehId
    ? vehiculos.find(v => v.id === selectedVehId)
    : matches.length === 1 ? matches[0] : null;

  const cliente = vehiculo ? clientes.find(c => c.id === vehiculo.clienteId) : null;

  const citasV  = vehiculo ? citas.filter(c => c.vehiculoId === vehiculo.id)   : [];
  const ordenesV = vehiculo ? ordenes.filter(o => o.vehiculoId === vehiculo.id) : [];

  const timeline: Entry[] = [
    ...citasV.map(c  => ({ kind: 'cita'  as const, data: c,  sortKey: `${c.fecha}T${c.hora}` })),
    ...ordenesV.map(o => ({ kind: 'orden' as const, data: o,  sortKey: o.fechaCreacion })),
  ].sort((a, b) => b.sortKey.localeCompare(a.sortKey));

  const totalGastado = ordenesV.reduce((sum, o) => {
    const lineas = o.cotizacion?.lineas ?? [];
    return sum + lineas.filter(l => !l.rechazado).reduce((s, l) => s + l.cantidad * l.precioUnitario, 0);
  }, 0);

  const ultimoCompleto = timeline.find(e =>
    e.kind === 'orden' && ['finalizada', 'liberada'].includes((e.data as OrdenTrabajo).estado)
  );
  const ultimoServicio = ultimoCompleto?.sortKey?.split('T')[0] ?? null;

  const handleBuscar = () => {
    const val = query.trim().toUpperCase();
    setSearched(val);
    setSelectedVehId(null);
    setExpandedIds(new Set());
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <History size={22} className="text-blue-600" />
          Trazabilidad de Servicios
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Historial completo de citas y órdenes de trabajo vinculado a la placa del vehículo
        </p>
      </div>

      {/* Search */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-sm">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Buscar vehículo por placa
        </label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleBuscar()}
              placeholder="Ej: ABC-1234, GDA-0095..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
            />
          </div>
          <button
            onClick={handleBuscar}
            disabled={query.trim().length < 2}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-colors"
          >
            Buscar
          </button>
        </div>
        {isCliente && clienteActual && (
          <p className="text-xs text-gray-400 mt-2">
            Solo puedes consultar vehículos registrados a tu nombre ({clienteActual.nombre})
          </p>
        )}
      </div>

      {/* Múltiples resultados */}
      {searched && matches.length > 1 && !selectedVehId && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-3">
            {matches.length} vehículos coinciden con "{searched}":
          </p>
          <div className="space-y-2">
            {matches.map(v => {
              const cli = clientes.find(c => c.id === v.clienteId);
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedVehId(v.id)}
                  className="w-full text-left flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Car size={16} className="text-slate-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 font-mono">{v.placa}</p>
                    <p className="text-xs text-gray-500">
                      {v.marca} {v.modelo} {v.año} · {cli?.nombre ?? '—'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Sin resultados */}
      {searched && matches.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl py-14 text-center shadow-sm">
          <AlertCircle size={36} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-600 font-medium">Vehículo no encontrado</p>
          <p className="text-sm text-gray-400 mt-1">
            No hay ningún vehículo con placa{' '}
            <span className="font-mono font-semibold">"{searched}"</span> registrado en el sistema
          </p>
        </div>
      )}

      {/* ── Vehículo encontrado ── */}
      {vehiculo && (
        <div className="space-y-5">

          {/* Tarjeta vehículo + cliente */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-slate-800 text-white px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">Historial de</p>
                  <h2 className="text-3xl font-bold font-mono">{vehiculo.placa}</h2>
                  <p className="text-slate-300 text-sm mt-0.5">
                    {vehiculo.marca} {vehiculo.modelo} · {vehiculo.año} · {vehiculo.color}
                  </p>
                </div>
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Car size={26} className="text-cyan-300" />
                </div>
              </div>
            </div>

            {/* Detalles técnicos */}
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100">
              <div className="px-5 py-3.5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Kilometraje</p>
                <p className="text-sm font-bold text-gray-800 mt-0.5">
                  {vehiculo.kilometraje ? `${vehiculo.kilometraje.toLocaleString()} km` : '—'}
                </p>
              </div>
              <div className="px-5 py-3.5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Chasis</p>
                <p className="text-sm font-bold text-gray-800 mt-0.5 font-mono">{vehiculo.chasis ?? '—'}</p>
              </div>
              <div className="px-5 py-3.5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Último servicio</p>
                <p className="text-sm font-bold text-gray-800 mt-0.5">
                  {ultimoServicio
                    ? new Date(ultimoServicio + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                    : 'Sin servicios'}
                </p>
              </div>
              <div className="px-5 py-3.5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total facturado</p>
                <p className="text-sm font-bold text-emerald-700 mt-0.5">${totalGastado.toFixed(2)}</p>
              </div>
            </div>

            {/* Cliente */}
            {cliente && (
              <div className="border-t border-gray-100 px-6 py-4 bg-gray-50/50">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Propietario</p>
                <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                    <User size={13} className="text-gray-400" /> {cliente.nombre}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Hash size={13} className="text-gray-400" /> CI: {cliente.ci}
                  </span>
                  {cliente.telefono && (
                    <span className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Phone size={13} className="text-gray-400" /> {cliente.telefono}
                    </span>
                  )}
                  {cliente.email && (
                    <span className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Mail size={13} className="text-gray-400" /> {cliente.email}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: 'Total registros',
                value: String(timeline.length),
                sub: 'citas + órdenes',
                color: 'bg-blue-50 border-blue-100 text-blue-700',
              },
              {
                label: 'Órdenes de trabajo',
                value: String(ordenesV.length),
                sub: `${citasV.length} citas`,
                color: 'bg-slate-50 border-slate-100 text-slate-700',
              },
              {
                label: 'Finalizadas',
                value: String(ordenesV.filter(o => ['finalizada', 'liberada'].includes(o.estado)).length),
                sub: 'servicios completados',
                color: 'bg-green-50 border-green-100 text-green-700',
              },
              {
                label: 'Total facturado',
                value: `$${totalGastado.toFixed(2)}`,
                sub: 'en cotizaciones aprobadas',
                color: 'bg-emerald-50 border-emerald-100 text-emerald-700',
              },
            ].map(s => (
              <div key={s.label} className={`rounded-xl border px-4 py-3.5 ${s.color}`}>
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs font-semibold mt-0.5">{s.label}</p>
                <p className="text-xs opacity-60">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Timeline */}
          {timeline.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl py-14 text-center shadow-sm">
              <History size={36} className="mx-auto mb-3 text-gray-200" />
              <p className="text-gray-500 font-medium">Sin historial de servicios</p>
              <p className="text-sm text-gray-400 mt-1">
                Este vehículo no tiene citas ni órdenes de trabajo registradas
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="font-bold text-gray-800">Historial cronológico</h3>
                <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-0.5 rounded-full font-medium">
                  {timeline.length} registro{timeline.length !== 1 ? 's' : ''} · más reciente primero
                </span>
              </div>

              {/* Leyenda */}
              <div className="flex gap-4 mb-4 text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> Cita
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" /> OT activa
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500" /> OT finalizada
                </span>
              </div>

              <div className="relative">
                {/* Línea vertical del timeline */}
                <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200 z-0" />
                <div className="space-y-3">
                  {timeline.map(entry =>
                    entry.kind === 'cita' ? (
                      <CitaEntry
                        key={`c-${entry.data.id}`}
                        cita={entry.data}
                        ordenes={ordenes}
                      />
                    ) : (
                      <OrdenEntry
                        key={`o-${entry.data.id}`}
                        orden={entry.data}
                        personal={personal}
                        repuestos={repuestos}
                        facturas={facturas}
                        expanded={expandedIds.has(entry.data.id)}
                        onToggle={() => toggleExpand(entry.data.id)}
                      />
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
