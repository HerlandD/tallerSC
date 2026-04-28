import React, { useState, useEffect, useMemo } from 'react';
import { useApp, OrdenTrabajo, EstadoOrden } from '../context/AppContext';
import {
  ClipboardList, Search, FileText, CheckCircle, Clock, CheckSquare, AlertCircle, X, Eye
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Configuracion de Estados ────────────────────────────────────────────────
const estadoOrdenConfig: Record<string, { label: string; dot: string }> = {
  registrada:              { label: 'Registrada',       dot: 'bg-gray-400' },
  asignada:                { label: 'Asignada',         dot: 'bg-cyan-500' },
  en_diagnostico:          { label: 'En Diagnóstico',   dot: 'bg-cyan-400' },
  esperando_aprobacion:    { label: 'Esp. Aprobación',  dot: 'bg-orange-400' },
  en_reparacion:           { label: 'En Reparación',    dot: 'bg-blue-400' },
  liquidacion_diagnostico: { label: 'Liq. Diagnóstico', dot: 'bg-amber-400' },
  control_calidad:         { label: 'Control Calidad',  dot: 'bg-cyan-500' },
  liberada:                { label: 'Liberada',         dot: 'bg-cyan-400' },
  finalizada:              { label: 'Finalizada',       dot: 'bg-gray-400' },
  cancelada:               { label: 'Cancelada',        dot: 'bg-red-500' },
};

// ─── Modal de Detalle ───────────────────────────────────────────────────────
interface DetalleOrdenModalProps {
  isOpen: boolean;
  orden: OrdenTrabajo | null;
  onClose: () => void;
  onCerrar: () => void;
}

function DetalleOrdenModal({ isOpen, orden, onClose, onCerrar }: DetalleOrdenModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [showAsignarMecanico, setShowAsignarMecanico] = useState(false);
  const [mecanicoSeleccionado, setMecanicoSeleccionado] = useState('');
  const { personal, asignarMecanico, currentUser } = useApp();

  const isJefeTaller = currentUser?.rol === 'jefe_taller';
  const puedeAsignar = isJefeTaller && orden?.estado === 'registrada';

  const handleAsignarMecanico = async () => {
    if (!mecanicoSeleccionado || !orden) return;
    const r = await asignarMecanico(orden.id, mecanicoSeleccionado);
    if (r.ok) {
      toast.success('Mecánico asignado exitosamente');
      setShowAsignarMecanico(false);
      setMecanicoSeleccionado('');
    } else {
      toast.error(r.error ?? 'Error al asignar');
    }
  };

  if (!isOpen || !orden) return null;

  let pagoPendiente = true;
  let estadoTexto = 'Pago Pendiente';

  if (orden.estado === 'liberada') {
    pagoPendiente = orden.factura?.estado !== 'pagada';
    estadoTexto = !pagoPendiente ? 'Pagado' : 'Pago Pendiente (Factura)';
  } else if (orden.estado === 'liquidacion_diagnostico') {
    pagoPendiente = orden.cobroDiagnostico?.estado !== 'pagado';
    estadoTexto = !pagoPendiente ? 'Cobro Confirmado' : 'Cobro Pendiente (Diagnóstico)';
  } else {
    pagoPendiente = true;
    estadoTexto = 'No cerrable';
  }

  const handleCerrarOrden = async () => {
    setIsClosing(true);
    try {
      await onCerrar();
      onClose();
    } finally {
      setIsClosing(false);
    }
  };

  const cfg = estadoOrdenConfig[orden.estado] || estadoOrdenConfig.registrada;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-slate-50">
          <div>
            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              <FileText size={20} className="text-blue-600"/>
              Orden #{orden.numero}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Detalles y cierre</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Estado</p>
              <span className={`inline-flex items-center gap-1.5 text-sm px-2.5 py-1 rounded-full font-medium bg-white border border-gray-200 text-gray-700`}>
                <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
              </span>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Estado de Pago</p>
              <span className={`inline-flex items-center gap-1.5 text-sm px-2.5 py-1 rounded-full font-medium ${pagoPendiente ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                {pagoPendiente ? <Clock size={12}/> : <CheckCircle size={12}/>}
                {estadoTexto}
              </span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Vehículo</p>
              <p className="text-sm font-medium text-gray-800 mt-0.5">{orden.vehiculo?.placa} · {orden.vehiculo?.marca} {orden.vehiculo?.modelo}</p>
            </div>
            <div className="w-full h-px bg-gray-100"/>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Cliente</p>
              <p className="text-sm font-medium text-gray-800 mt-0.5">{orden.cliente?.nombre}</p>
            </div>
            <div className="w-full h-px bg-gray-100"/>
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold">Mecánico</p>
              <p className="text-sm font-medium text-gray-800 mt-0.5">{orden.mecanicoId || 'Sin asignar'}</p>
            </div>
          </div>

          {puedeAsignar && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
              <div>
                <p className="text-sm font-bold text-blue-800">Asignar Mecánico</p>
                <p className="text-xs text-blue-700 mt-0.5">Selecciona un mecánico disponible para esta orden</p>
              </div>
              {!showAsignarMecanico ? (
                <button
                  onClick={() => setShowAsignarMecanico(true)}
                  className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-semibold transition-colors"
                >
                  Asignar Mecánico
                </button>
              ) : (
                <div className="space-y-2">
                  <select
                    value={mecanicoSeleccionado}
                    onChange={(e) => setMecanicoSeleccionado(e.target.value)}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecciona un mecánico</option>
                    {personal?.filter(p => p.rol === 'mecanico' && p.activo)
                      .map(m => (
                        <option key={m.id} value={m.id}>{m.nombre}</option>
                      ))
                    }
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAsignarMecanico}
                      disabled={!mecanicoSeleccionado}
                      className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white text-sm rounded-lg font-semibold transition-colors"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => {
                        setShowAsignarMecanico(false);
                        setMecanicoSeleccionado('');
                      }}
                      className="flex-1 px-3 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 text-sm rounded-lg font-semibold transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {pagoPendiente && (
            <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-800">Atención</p>
                <p className="text-xs text-amber-700 mt-0.5">No se puede cerrar la orden mientras el pago esté pendiente.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-slate-50 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-sm hover:bg-gray-100 font-medium transition-colors">
            Cerrar
          </button>
          <button
            disabled={pagoPendiente || isClosing}
            onClick={handleCerrarOrden}
            className={`px-5 py-2 text-white rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center gap-2 ${
              pagoPendiente || isClosing ? 'bg-emerald-400 cursor-not-allowed opacity-60' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
            }`}
          >
            <CheckSquare size={16} />
            {isClosing ? 'Cerrando...' : 'Cerrar Orden'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente Principal ────────────────────────────────────────────────────
export default function WorkOrders() {
  const { ordenes, cargarOrdenesPorEstado, cerrarOrden, currentUser, personal } = useApp();
  const [filterEstado, setFilterEstado] = useState<string>('');
  const [search, setSearch] = useState('');
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenTrabajo | null>(null);

  useEffect(() => {
    if (filterEstado) {
      cargarOrdenesPorEstado(filterEstado);
    }
  }, [filterEstado, cargarOrdenesPorEstado]);

  const ordenesFiltradas = useMemo(() => {
    let filtradas = ordenes || [];
    if (filterEstado) {
      filtradas = filtradas.filter((o: OrdenTrabajo) => o.estado === filterEstado);
    }
    if (search) {
      const s = search.toLowerCase();
      filtradas = filtradas.filter((o: OrdenTrabajo) => 
        o.numero.toLowerCase().includes(s) || 
        (o.cliente?.nombre || '').toLowerCase().includes(s) || 
        (o.vehiculo?.placa || '').toLowerCase().includes(s)
      );
    }
    return filtradas;
  }, [ordenes, filterEstado, search]);

  const handleCerrarOrden = async () => {
    if (!ordenSeleccionada || currentUser?.rol !== 'asesor') {
      toast.error('No autorizado para cerrar órdenes');
      return;
    }
    try {
      await cerrarOrden(ordenSeleccionada.id);
      toast.success('Orden cerrada exitosamente');
      setOrdenSeleccionada(null);
      if (filterEstado) {
        await cargarOrdenesPorEstado(filterEstado);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al cerrar la orden');
    }
  };

  const getMecanicoNombre = (mecanicoId?: string) => {
    if (!mecanicoId) return 'Sin asignar';
    const m = personal?.find(p => p.id === mecanicoId);
    return m ? m.nombre : mecanicoId;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <ClipboardList size={22} className="text-blue-500" />
          Órdenes de Trabajo
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {ordenesFiltradas.length} de {ordenes.length} órdenes visibles
        </p>
      </div>

      {/* Filter Container */}
      <div className="bg-white border border-gray-200 rounded-2xl p-3 flex flex-wrap gap-2 mb-4 shadow-sm">
        <button onClick={() => setFilterEstado('')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${!filterEstado ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
          Todos ({ordenes.length})
        </button>
        {Object.entries(estadoOrdenConfig).map(([k, v]) => {
          const count = ordenes.filter(o => o.estado === k).length;
          if (count === 0 && filterEstado !== k) return null;
          return (
            <button key={k} onClick={() => setFilterEstado(filterEstado === k ? '' : k)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filterEstado === k ? `bg-slate-100 text-slate-800 border-gray-300` : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${v.dot}`} />
              {v.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center mb-6 shadow-sm">
        <Search className="w-5 h-5 text-gray-400 ml-1" />
        <input type="text" placeholder="Buscar por número, cliente o placa..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-transparent border-none focus:outline-none px-3 text-sm text-gray-700" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-200">
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-24">OT</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">CLIENTE</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">VEHÍCULO</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">MECÁNICO</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ESTADO</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-32">ACTUALIZADO</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ordenesFiltradas.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400 text-sm">No se encontraron órdenes de trabajo</td></tr>
              ) : ordenesFiltradas.map((orden: OrdenTrabajo) => {
                const cfg = estadoOrdenConfig[orden.estado] || estadoOrdenConfig.registrada;
                return (
                  <tr key={orden.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <p className="font-bold text-slate-800">{orden.numero.replace('OT-', '')}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-gray-600">{orden.cliente?.nombre || '—'}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-gray-600">{orden.vehiculo?.placa} · {orden.vehiculo?.marca} {orden.vehiculo?.modelo}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-gray-600">{getMecanicoNombre(orden.mecanicoId)}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center gap-1.5 bg-gray-50 text-gray-700 px-3 py-1 rounded-full text-xs font-medium border border-gray-200">
                        <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-gray-500 text-sm">{new Date(orden.fechaActualizacion || orden.fechaCreacion).toISOString().split('T')[0]}</p>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button onClick={() => setOrdenSeleccionada(orden)}
                        className="text-gray-400 hover:text-blue-600 transition-colors p-1" title="Ver Detalle">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <DetalleOrdenModal
        isOpen={!!ordenSeleccionada}
        orden={ordenSeleccionada}
        onClose={() => setOrdenSeleccionada(null)}
        onCerrar={handleCerrarOrden}
      />
    </div>
  );
}
