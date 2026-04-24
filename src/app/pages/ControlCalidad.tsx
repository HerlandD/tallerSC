import React, { useState, useEffect } from 'react';
import {
  CheckCircle, AlertCircle, Search, X, ZoomIn, Car, User, Check, AlertTriangle, Eye
} from 'lucide-react';
import { useApp, OrdenTrabajo } from '../context/AppContext';
import { ESTADO_CONFIG } from './Dashboard';
import { toast } from 'sonner';

function PhotoGrid({ photos }: { photos: string[] }) {
  const [preview, setPreview] = useState<string | null>(null);
  if (photos.length === 0) return null;
  return (
    <>
      <div className="grid grid-cols-4 gap-2 mt-2">
        {photos.map((src, i) => (
          <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
            <img src={src} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center">
              <button onClick={() => setPreview(src)} className="p-1 bg-white/80 rounded"><ZoomIn size={11} /></button>
            </div>
          </div>
        ))}
      </div>
      {preview && (
        <div className="fixed inset-0 bg-black/80 z-[300] flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <img src={preview} alt="" className="max-w-full max-h-full rounded-xl" />
        </div>
      )}
    </>
  );
}

export default function ControlCalidad() {
  const {
    ordenes, clientes, vehiculos, usuarios, currentUser,
    registrarQC, cargarQCOT, qcOT, addAuditoria
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedOrden, setSelectedOrden] = useState<OrdenTrabajo | null>(null);

  const isJefe = currentUser?.rol === 'jefe_taller';
  const isAdmin = currentUser?.rol === 'administrador';

  const visibleOrdenes = ordenes.filter(o => o.estado === 'control_calidad');
  const filtered = visibleOrdenes.filter(o => {
    const s = search.toLowerCase();
    const cli = clientes.find(c => c.id === o.clienteId);
    const veh = vehiculos.find(v => v.id === o.vehiculoId);
    return o.numero.toLowerCase().includes(s)
      || cli?.nombre.toLowerCase().includes(s)
      || veh?.placa.toLowerCase().includes(s);
  });

  useEffect(() => {
    if (selectedOrden) {
      cargarQCOT(selectedOrden.id);
    }
  }, [selectedOrden?.id]);

  const log = (accion: string, detalles: string) => {
    if (currentUser) addAuditoria({
      fecha: new Date().toISOString(), usuarioId: currentUser.id, usuarioNombre: currentUser.nombre,
      accion, modulo: 'QC', detalles, entidadId: selectedOrden?.id,
    });
  };

  if (!isJefe && !isAdmin) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800">
          <p className="font-semibold">Solo el Jefe de Taller puede acceder a esta sección</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CheckCircle size={22} className="text-green-600" />
          Control de Calidad
        </h1>
        <p className="text-gray-500 text-sm mt-1">Revisar y aprobar reparaciones completadas</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* LEFT: Order list */}
        <div className="w-full lg:w-72 lg:flex-shrink-0 flex flex-col">
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Buscar OT, cliente, placa..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 lg:max-h-none max-h-72">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <CheckCircle size={30} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm font-medium">No hay órdenes pendientes de QC</p>
              </div>
            ) : filtered.map(o => {
              const qc = qcOT[o.id];
              const isSelected = selectedOrden?.id === o.id;
              return (
                <button key={o.id} onClick={() => setSelectedOrden(o)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white hover:border-green-300'}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-bold text-green-600">{o.numero}</span>
                    {qc && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${qc.aprobado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {qc.aprobado ? <Check size={12} /> : <X size={12} />}
                        {qc.aprobado ? 'Aprobado' : 'Rechazado'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-gray-700 truncate">{clientes.find(c => c.id === o.clienteId)?.nombre}</p>
                  <p className="text-xs text-gray-500">{vehiculos.find(v => v.id === o.vehiculoId)?.placa}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT: QC Panel */}
        <div className="flex-1 overflow-y-auto">
          {!selectedOrden ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-400 max-w-sm">
                <CheckCircle size={36} className="mx-auto mb-4 text-green-300" />
                <p className="font-semibold text-gray-600 text-lg">Selecciona una Orden</p>
                <p className="text-sm mt-1.5">Elige una OT para revisar y aprobar o rechazar</p>
              </div>
            </div>
          ) : (
            <QCPanel orden={selectedOrden} isJefe={isJefe} currentUser={currentUser} clientes={clientes}
              vehiculos={vehiculos} usuarios={usuarios} registrarQC={registrarQC} qcOT={qcOT} log={log} />
          )}
        </div>
      </div>
    </div>
  );
}

function QCPanel({ orden, isJefe, currentUser, clientes, vehiculos, usuarios, registrarQC, qcOT, log }: {
  orden: OrdenTrabajo; isJefe: boolean; currentUser: any; clientes: any[]; vehiculos: any[];
  usuarios: any[]; registrarQC: any; qcOT: any; log: (a: string, d: string) => void;
}) {
  const cli = clientes.find(c => c.id === orden.clienteId);
  const veh = vehiculos.find(v => v.id === orden.vehiculoId);
  const mec = usuarios.find(u => u.id === orden.mecanicoId);
  const qc = qcOT[orden.id];

  const [observaciones, setObservaciones] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [checklist, setChecklist] = useState({
    antes_despues: false,
    prueba_ruta: false,
    limpieza: false,
    ajustes: false,
    documentacion: false
  });

  const items = [
    { key: 'antes_despues', label: 'Fotos antes y después', icon: '📸' },
    { key: 'prueba_ruta', label: 'Prueba de ruta realizada', icon: '🚗' },
    { key: 'limpieza', label: 'Vehículo limpio', icon: '✨' },
    { key: 'ajustes', label: 'Todos los ajustes completados', icon: '🔧' },
    { key: 'documentacion', label: 'Documentación completa', icon: '📋' }
  ];

  const handleAprobar = async () => {
    setProcesando(true);
    const obs = Object.entries(checklist).filter(([_, v]) => v).map(([k]) => k.replace(/_/g, ' ')).join('; ');
    const res = await registrarQC(orden.id, true, obs);
    if (res.ok) {
      log('APROBAR_QC', `OT aprobada. Estado → ${res.nuevoEstado}`);
      toast.success('✅ Reparación aprobada — OT LIBERADA');
    } else {
      toast.error(res.error ?? 'Error');
    }
    setProcesando(false);
  };

  const handleRechazar = async () => {
    if (!observaciones.trim()) { toast.error('Las observaciones son obligatorias'); return; }
    setProcesando(true);
    const res = await registrarQC(orden.id, false, observaciones);
    if (res.ok) {
      log('RECHAZAR_QC', `OT rechazada. Estado → ${res.nuevoEstado}. Defectos: ${observaciones}`);
      toast.success('⚠️ Reparación rechazada — OT vuelve a EN_REPARACION');
    } else {
      toast.error(res.error ?? 'Error');
    }
    setProcesando(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-bold text-xl">{orden.numero}</h2>
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-white/20">Control de Calidad</span>
            </div>
            <div className="flex items-center gap-3 text-green-200 text-sm flex-wrap">
              <span className="flex items-center gap-1"><User size={13} /> {cli?.nombre}</span>
              <span className="flex items-center gap-1"><Car size={13} /> {veh?.placa} · {veh?.marca} {veh?.modelo}</span>
            </div>
            {mec && <p className="text-xs text-green-200 mt-0.5">Mecánico: {mec.nombre}</p>}
          </div>
        </div>
      </div>

      {/* Problema */}
      <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
        <p className="text-xs font-bold text-blue-700 uppercase mb-1">Problema reportado</p>
        <p className="text-sm text-blue-900">{orden.descripcionProblema}</p>
      </div>

      {/* Observaciones si fue rechazado */}
      {qc && !qc.aprobado && qc.observaciones && (
        <div className="px-6 py-4 bg-red-50 border-b border-red-200">
          <div className="flex gap-3">
            <AlertTriangle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-red-700 uppercase mb-1">Defectos encontrados (revisar)</p>
              <p className="text-sm text-red-800">{qc.observaciones}</p>
            </div>
          </div>
        </div>
      )}

      <div className="px-6 py-5 space-y-5">
        {/* Trabajos realizados */}
        {orden.reparacion && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-bold text-gray-700 uppercase mb-2">Trabajos realizados</p>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{orden.reparacion}</p>
          </div>
        )}

        {/* Fotos */}
        {orden.fotosReparacion && orden.fotosReparacion.length > 0 && (
          <div>
            <p className="text-xs font-bold text-gray-700 uppercase mb-2">Fotos de la reparación</p>
            <PhotoGrid photos={orden.fotosReparacion} />
          </div>
        )}

        {/* Repuestos */}
        {orden.repuestosUsados && orden.repuestosUsados.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-gray-100 border-b border-gray-200">
              <p className="text-xs font-bold text-gray-700 uppercase">Repuestos utilizados</p>
            </div>
            {orden.repuestosUsados.map(r => (
              <div key={r.repuestoId} className="flex justify-between text-sm px-4 py-2.5 border-b border-gray-100 last:border-0">
                <span className="text-gray-700">{r.nombre}</span>
                <span className="text-gray-500">× {r.cantidad} — <strong>${(r.cantidad * r.precio).toFixed(2)}</strong></span>
              </div>
            ))}
          </div>
        )}

        {/* QC Decision */}
        {isJefe && (
          <>
            {/* Checklist */}
            <div className="border-t border-gray-100 pt-5">
              <p className="text-sm font-bold text-gray-800 mb-3">Checklist de revisión</p>
              <div className="space-y-2">
                {items.map(item => (
                  <label key={item.key} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100">
                    <input type="checkbox" checked={checklist[item.key as keyof typeof checklist]}
                      onChange={e => setChecklist(p => ({ ...p, [item.key]: e.target.checked }))}
                      className="w-4 h-4 accent-green-600" />
                    <span className="text-2xl">{item.icon}</span>
                    <span className="flex-1 text-sm text-gray-700">{item.label}</span>
                    {checklist[item.key as keyof typeof checklist] && <Check size={16} className="text-green-600" />}
                  </label>
                ))}
              </div>
            </div>

            {/* Observaciones */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Defectos encontrados (obligatorio si rechazas)
              </label>
              <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Detalla los defectos encontrados, trabajos incompletos, daños, etc..." />
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button onClick={handleRechazar} disabled={procesando}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                <AlertTriangle size={16} /> Rechazar
              </button>
              <button onClick={handleAprobar} disabled={procesando}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                <CheckCircle size={16} /> Aprobar
              </button>
            </div>
          </>
        )}

        {/* Si ya fue revisado, mostrar resultado */}
        {qc && !isJefe && (
          <div className={`rounded-xl p-4 flex items-start gap-3 ${qc.aprobado ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            {qc.aprobado ? (
              <>
                <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-green-800">✅ Aprobado por QC</p>
                  <p className="text-sm text-green-700">Tu vehículo está listo para recoger</p>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-red-800">⚠️ Defectos encontrados</p>
                  {qc.observaciones && <p className="text-sm text-red-700 mt-1">{qc.observaciones}</p>}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
