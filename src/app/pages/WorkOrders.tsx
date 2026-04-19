import React, { useState, useRef } from 'react';
import {
  Search, ClipboardList, X, Eye, CheckCircle, ThumbsUp, ThumbsDown,
  UserCheck, ShieldCheck, Wrench, Package, ChevronRight, AlertTriangle,
  Clock, Camera, Upload, ZoomIn, DollarSign, CreditCard, Plus,
  User, Car, FileText, Lock, CheckSquare, AlertCircle, ArrowRight, Trash2, Info, Bell
} from 'lucide-react';
import {
  useApp, OrdenTrabajo, EstadoOrden, LineaCotizacion,
  Cotizacion, ControlCalidad, RepuestoUsado, Factura, Cliente, Vehiculo
} from '../context/AppContext';
import { ESTADO_CONFIG } from './Dashboard';
import { toast } from 'sonner';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function readFilesAsBase64(files: FileList | null): Promise<string[]> {
  if (!files || files.length === 0) return Promise.resolve([]);
  return Promise.all(Array.from(files).map(f =>
    new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload = e => res(e.target?.result as string);
      r.onerror = rej;
      r.readAsDataURL(f);
    })
  ));
}

function PhotoGrid({ photos, onRemove, emptyMsg = 'Sin fotos' }: {
  photos: string[]; onRemove?: (i: number) => void; emptyMsg?: string;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  if (photos.length === 0) return (
    <div className="border border-dashed border-gray-200 rounded-lg p-4 text-center">
      <Camera size={18} className="mx-auto mb-1 text-gray-300" />
      <p className="text-xs text-gray-400">{emptyMsg}</p>
    </div>
  );
  return (
    <>
      <div className="grid grid-cols-4 gap-2">
        {photos.map((src, i) => (
          <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
            <img src={src} alt={`foto-${i}`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1">
              <button onClick={() => setPreview(src)} className="p-1 bg-white/80 rounded"><ZoomIn size={12} /></button>
              {onRemove && <button onClick={() => onRemove(i)} className="p-1 bg-red-500 rounded"><X size={12} className="text-white" /></button>}
            </div>
          </div>
        ))}
      </div>
      {preview && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <img src={preview} alt="preview" className="max-w-full max-h-full rounded-xl object-contain" />
        </div>
      )}
    </>
  );
}

function UploadBtn({ label, inputRef, onChange, count }: {
  label: string; inputRef: React.RefObject<HTMLInputElement>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; count: number;
}) {
  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={onChange} />
      <button type="button" onClick={() => inputRef.current?.click()}
        className="w-full py-2.5 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg text-sm hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
        <Upload size={14} /> {count > 0 ? `${label} — ${count} cargada${count > 1 ? 's' : ''} ✓` : label}
      </button>
    </>
  );
}

function InfoField({ label, value }: { label: string; value?: string | React.ReactNode }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value}</p>
    </div>
  );
}

// ─── Steps Progress ───────────────────────────────────────────────────────────

const PASOS = [
  { estado: 'registrada' as EstadoOrden, label: 'Recepción' },
  { estado: 'en_diagnostico' as EstadoOrden, label: 'Diagnóstico' },
  { estado: 'esperando_aprobacion' as EstadoOrden, label: 'Aprobación' },
  { estado: 'en_reparacion' as EstadoOrden, label: 'Reparación' },
  { estado: 'control_calidad' as EstadoOrden, label: 'QC' },
  { estado: 'liberada' as EstadoOrden, label: 'Entrega' },
  { estado: 'finalizada' as EstadoOrden, label: 'Finalizada' },
];

function StepProgress({ estadoActual }: { estadoActual: EstadoOrden }) {
  const stepActual = ESTADO_CONFIG[estadoActual]?.step || 0;
  const esLiquidacion = estadoActual === 'liquidacion_diagnostico';
  return (
    <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 overflow-x-auto">
      {esLiquidacion ? (
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <span className="text-xs font-medium text-red-600">Liquidación de Diagnóstico — cliente rechazó la cotización</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 min-w-max">
          {PASOS.map((p, i) => {
            const cfg = ESTADO_CONFIG[p.estado];
            const stepP = cfg?.step || 0;
            const isActive = estadoActual === p.estado;
            const isDone = stepActual > stepP && stepP > 0;
            return (
              <React.Fragment key={p.estado}>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all ${
                  isActive ? `${cfg.bg} ${cfg.color} font-semibold` :
                  isDone ? 'text-green-600 bg-green-50' : 'text-gray-300'
                }`}>
                  {isDone ? <CheckCircle size={10} /> : isActive ? <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} /> : <span className="w-1.5 h-1.5 rounded-full bg-gray-200" />}
                  <span>{p.label}</span>
                </div>
                {i < PASOS.length - 1 && <ChevronRight size={11} className={`flex-shrink-0 ${isDone ? 'text-green-400' : 'text-gray-200'}`} />}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Wizard: Nueva OT (3 pasos) ──────────────────────────────────────────────

function WizardNuevaOT({ onClose }: { onClose: () => void }) {
  const { clientes, vehiculos, catalogs, addCliente, addVehiculo, addOrden, addAuditoria, currentUser } = useApp();

  const [paso, setPaso] = useState(1);

  // Paso 1: Cliente
  const [clienteSearch, setClienteSearch] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [showRegistrarCliente, setShowRegistrarCliente] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: '', ci: '', telefono: '', email: '', direccion: '' });

  // Paso 2: Vehículo
  const [vehiculoId, setVehiculoId] = useState('');
  const [showRegistrarVehiculo, setShowRegistrarVehiculo] = useState(false);
  const [nuevoVehiculo, setNuevoVehiculo] = useState({ placa: '', marca: '', modelo: '', año: 2020, color: '', kilometraje: '' });

  // Paso 3: Problema
  const [tipoServicio, setTipoServicio] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [citaId, setCitaId] = useState('');

  const clienteFiltrado = clientes.filter(c =>
    !clienteSearch || c.nombre.toLowerCase().includes(clienteSearch.toLowerCase()) ||
    c.ci.includes(clienteSearch) || c.telefono?.includes(clienteSearch)
  ).slice(0, 8);

  const clienteSeleccionado = clientes.find(c => c.id === clienteId);
  const vehiculosCliente = vehiculos.filter(v => v.clienteId === clienteId);
  const vehiculoSeleccionado = vehiculos.find(v => v.id === vehiculoId);

  const handleRegistrarCliente = async () => {
    if (!nuevoCliente.nombre || !nuevoCliente.ci || !nuevoCliente.telefono) {
      toast.error('Nombre, CI y teléfono son requeridos'); return;
    }
    const result = await addCliente({ ...nuevoCliente, creadoPor: currentUser?.id });
    if (!result.ok) { toast.error(result.error ?? 'Error al registrar cliente'); return; }
    setShowRegistrarCliente(false);
    setClienteSearch(nuevoCliente.nombre);
    setClienteId('');
    toast.success(`Cliente ${nuevoCliente.nombre} registrado — selecciónalo de la lista`);
  };

  const handleRegistrarVehiculo = async () => {
    if (!nuevoVehiculo.placa || !nuevoVehiculo.marca || !nuevoVehiculo.modelo) {
      toast.error('Placa, marca y modelo son requeridos'); return;
    }
    const result = await addVehiculo({
      clienteId,
      placa:        nuevoVehiculo.placa,
      marca:        nuevoVehiculo.marca,
      modelo:       nuevoVehiculo.modelo,
      año:          nuevoVehiculo.año,
      color:        nuevoVehiculo.color,
      kilometraje:  Number(nuevoVehiculo.kilometraje) || 0,
      creadoPor:    currentUser?.id,
      fechaCreacion: new Date().toISOString().split('T')[0],
    });
    if (!result.ok) { toast.error(result.error ?? 'Error al registrar vehículo'); return; }
    setShowRegistrarVehiculo(false);
    setVehiculoId('');
    setNuevoVehiculo({ placa: '', marca: '', modelo: '', año: 2020, color: '', kilometraje: '' });
    toast.success('Vehículo registrado — selecciónalo de la lista que aparece');
  };

  const handleCrearOT = () => {
    if (!vehiculoId || !descripcion.trim()) { toast.error('Vehículo y descripción requeridos'); return; }
    addOrden({
      clienteId, vehiculoId,
      descripcionProblema: descripcion,
      estado: 'registrada',
      creadoPor: currentUser?.id,
    });
    const cli = clientes.find(c => c.id === clienteId);
    const veh = vehiculos.find(v => v.id === vehiculoId);
    addAuditoria({
      fecha: new Date().toISOString(), usuarioId: currentUser!.id, usuarioNombre: currentUser!.nombre,
      accion: 'CREAR_OT', modulo: 'Órdenes',
      detalles: `Nueva OT para ${cli?.nombre} — ${veh?.placa} (${tipoServicio || 'Sin tipo'})`,
    });
    toast.success('✅ Orden de trabajo creada correctamente');
    onClose();
  };

  const inCls = 'w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h3 className="font-bold text-gray-800">Nueva Orden de Trabajo</h3>
            <div className="flex items-center gap-2 mt-1">
              {[1, 2, 3].map(s => (
                <div key={s} className={`flex items-center gap-1 text-xs ${paso >= s ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${paso > s ? 'bg-green-500 text-white' : paso === s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {paso > s ? '✓' : s}
                  </div>
                  {s === 1 ? 'Cliente' : s === 2 ? 'Vehículo' : 'Problema'}
                  {s < 3 && <ChevronRight size={12} />}
                </div>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={16} className="text-gray-500" /></button>
        </div>

        <div className="px-6 py-5 space-y-4">

          {/* ── PASO 1: Cliente ── */}
          {paso === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <User size={16} className="text-blue-600" />
                <h4 className="font-semibold text-gray-800">Seleccionar Cliente</h4>
              </div>

              {/* Search */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text" placeholder="Buscar por nombre, CI o teléfono..."
                  value={clienteSearch} onChange={e => { setClienteSearch(e.target.value); setClienteId(''); }}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Results */}
              {!clienteId && (
                <div className="border border-gray-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                  {clienteFiltrado.length === 0 ? (
                    <div className="py-4 text-center text-gray-400 text-sm">No se encontraron clientes</div>
                  ) : clienteFiltrado.map(c => (
                    <button key={c.id} onClick={() => { setClienteId(c.id); setClienteSearch(c.nombre); setVehiculoId(''); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-left border-b border-gray-100 last:border-0 transition-colors">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-700 text-xs font-bold">{c.nombre.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{c.nombre}</p>
                        <p className="text-xs text-gray-500">CI: {c.ci} · {c.telefono}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected client confirmation */}
              {clienteId && clienteSeleccionado && (
                <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">{clienteSeleccionado.nombre.charAt(0)}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-blue-800">{clienteSeleccionado.nombre}</p>
                    <p className="text-xs text-blue-600">CI: {clienteSeleccionado.ci} · {clienteSeleccionado.telefono}</p>
                  </div>
                  <button onClick={() => { setClienteId(''); setClienteSearch(''); }} className="text-blue-400 hover:text-blue-600">
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Register new client */}
              <button onClick={() => setShowRegistrarCliente(!showRegistrarCliente)}
                className="w-full py-2 text-sm text-blue-600 border border-dashed border-blue-300 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
                <Plus size={14} /> {showRegistrarCliente ? 'Cancelar registro' : 'Registrar nuevo cliente'}
              </button>

              {showRegistrarCliente && (
                <div className="border border-blue-200 rounded-xl p-4 bg-blue-50/30 space-y-3">
                  <p className="text-xs font-semibold text-blue-700 uppercase">Registro rápido de cliente</p>
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="Nombre completo *" value={nuevoCliente.nombre} onChange={e => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })} className={inCls} />
                    <input placeholder="CI / Cédula *" value={nuevoCliente.ci} onChange={e => setNuevoCliente({ ...nuevoCliente, ci: e.target.value })} className={inCls} />
                    <input placeholder="Teléfono *" value={nuevoCliente.telefono} onChange={e => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })} className={inCls} />
                    <input placeholder="Email" value={nuevoCliente.email} onChange={e => setNuevoCliente({ ...nuevoCliente, email: e.target.value })} className={inCls} />
                    <input placeholder="Dirección" value={nuevoCliente.direccion} onChange={e => setNuevoCliente({ ...nuevoCliente, direccion: e.target.value })} className="col-span-2 px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <button onClick={handleRegistrarCliente} className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                    Registrar Cliente
                  </button>
                </div>
              )}

              <button onClick={() => { if (!clienteId) { toast.error('Selecciona un cliente'); return; } setPaso(2); }}
                disabled={!clienteId}
                className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${clienteId ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                Continuar — Paso 2: Vehículo <ArrowRight size={14} className="inline ml-1" />
              </button>
            </div>
          )}

          {/* ── PASO 2: Vehículo ── */}
          {paso === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Car size={16} className="text-blue-600" />
                <h4 className="font-semibold text-gray-800">Vehículo de {clienteSeleccionado?.nombre}</h4>
              </div>

              {/* Vehicles list */}
              {vehiculosCliente.length > 0 ? (
                <div className="space-y-2">
                  {vehiculosCliente.map(v => (
                    <button key={v.id} onClick={() => setVehiculoId(v.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${vehiculoId === v.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${vehiculoId === v.id ? 'bg-blue-600' : 'bg-gray-100'}`}>
                        <Car size={16} className={vehiculoId === v.id ? 'text-white' : 'text-gray-500'} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{v.placa} — {v.marca} {v.modelo} ({v.año})</p>
                        <p className="text-xs text-gray-500">Color: {v.color} · KM: {v.kilometraje || 'N/A'}</p>
                      </div>
                      {vehiculoId === v.id && <CheckCircle size={18} className="text-blue-600 flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                  <AlertTriangle size={14} className="inline mr-1" /> Este cliente no tiene vehículos registrados
                </div>
              )}

              {/* Register vehicle */}
              <button onClick={() => setShowRegistrarVehiculo(!showRegistrarVehiculo)}
                className="w-full py-2 text-sm text-blue-600 border border-dashed border-blue-300 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
                <Plus size={14} /> {showRegistrarVehiculo ? 'Cancelar' : 'Registrar nuevo vehículo'}
              </button>

              {showRegistrarVehiculo && (
                <div className="border border-blue-200 rounded-xl p-4 bg-blue-50/30 space-y-3">
                  <p className="text-xs font-semibold text-blue-700 uppercase">Datos del vehículo</p>
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="Placa *" value={nuevoVehiculo.placa} onChange={e => setNuevoVehiculo({ ...nuevoVehiculo, placa: e.target.value.toUpperCase() })} className={inCls} />
                    <input placeholder="Marca *" value={nuevoVehiculo.marca} onChange={e => setNuevoVehiculo({ ...nuevoVehiculo, marca: e.target.value })} className={inCls} />
                    <input placeholder="Modelo *" value={nuevoVehiculo.modelo} onChange={e => setNuevoVehiculo({ ...nuevoVehiculo, modelo: e.target.value })} className={inCls} />
                    <input type="number" placeholder="Año" value={nuevoVehiculo.año} onChange={e => setNuevoVehiculo({ ...nuevoVehiculo, año: Number(e.target.value) })} className={inCls} />
                    <input placeholder="Color" value={nuevoVehiculo.color} onChange={e => setNuevoVehiculo({ ...nuevoVehiculo, color: e.target.value })} className={inCls} />
                    <input placeholder="Kilometraje" value={nuevoVehiculo.kilometraje} onChange={e => setNuevoVehiculo({ ...nuevoVehiculo, kilometraje: e.target.value })} className={inCls} />
                  </div>
                  <button onClick={handleRegistrarVehiculo} className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                    Registrar Vehículo
                  </button>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setPaso(1)} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-50">← Atrás</button>
                <button onClick={() => { if (!vehiculoId) { toast.error('Selecciona o registra un vehículo'); return; } setPaso(3); }}
                  disabled={!vehiculoId}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${vehiculoId ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                  Continuar — Paso 3 <ArrowRight size={14} className="inline ml-1" />
                </button>
              </div>
            </div>
          )}

          {/* ── PASO 3: Problema ── */}
          {paso === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <FileText size={16} className="text-blue-600" />
                <h4 className="font-semibold text-gray-800">Descripción del Servicio</h4>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Cliente</p>
                  <p className="font-semibold text-gray-800">{clienteSeleccionado?.nombre}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Vehículo</p>
                  <p className="font-semibold text-gray-800">{vehiculoSeleccionado?.placa} — {vehiculoSeleccionado?.marca} {vehiculoSeleccionado?.modelo}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1.5">Tipo de servicio</label>
                <select value={tipoServicio} onChange={e => setTipoServicio(e.target.value)} className={inCls}>
                  <option value="">Seleccionar...</option>
                  {catalogs.tiposServicio.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1.5">Descripción del problema reportado por el cliente *</label>
                <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)}
                  rows={4} placeholder="Detalla el problema que reporta el cliente: síntomas, ruidos, fallas, etc..."
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                <p className="text-xs text-gray-400 mt-1">Las fotos de recepción se registrarán en el siguiente paso (dentro de la OT)</p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setPaso(2)} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-50">← Atrás</button>
                <button onClick={handleCrearOT} disabled={!descripcion.trim()}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${descripcion.trim() ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                  ✓ Crear Orden de Trabajo
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main WorkOrders Page ─────────────────────────────────────────────────────

export default function WorkOrders() {
  const { ordenes, clientes, vehiculos, usuarios, currentUser } = useApp();
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('');
  const [showWizard, setShowWizard] = useState(false);
  const [detailOrden, setDetailOrden] = useState<OrdenTrabajo | null>(null);

  const isAsesor = currentUser?.rol === 'asesor';
  const isCliente = currentUser?.rol === 'cliente';
  const isMecanico = currentUser?.rol === 'mecanico';
  const isJefe = currentUser?.rol === 'jefe_taller';

  let visibleOrdenes = ordenes;
  if (isMecanico) visibleOrdenes = ordenes.filter(o => o.mecanicoId === currentUser?.id || o.mecanicosIds?.includes(currentUser?.id || ''));
  if (isCliente) {
    const clienteActual = clientes.find(c => c.nombre === currentUser?.nombre || c.usuarioId === currentUser?.id);
    const misVehiculos = vehiculos.filter(v => clienteActual ? v.clienteId === clienteActual.id : false);
    visibleOrdenes = ordenes.filter(o => misVehiculos.some(v => v.id === o.vehiculoId));
  }

  // Mechanic: render dedicated panel with diagnostics / repairs separated
  if (isMecanico) {
    return (
      <>
        <MecanicoWorkPanel
          ordenes={visibleOrdenes}
          allOrdenes={ordenes}
          clientes={clientes}
          vehiculos={vehiculos}
          currentUser={currentUser}
          onOpenDetail={(o) => setDetailOrden(o)}
        />
        {detailOrden && (
          <ModalDetalle
            orden={detailOrden}
            onClose={() => setDetailOrden(null)}
            currentUser={currentUser}
          />
        )}
      </>
    );
  }

  const filtered = visibleOrdenes.filter(o => {
    const cli = clientes.find(c => c.id === o.clienteId);
    const veh = vehiculos.find(v => v.id === o.vehiculoId);
    const s = search.toLowerCase();
    return (!s || o.numero.toLowerCase().includes(s) || cli?.nombre.toLowerCase().includes(s) || veh?.placa.toLowerCase().includes(s))
      && (!filterEstado || o.estado === filterEstado);
  });

  const contadores: Record<string, number> = {};
  (['registrada', 'en_diagnostico', 'esperando_aprobacion', 'en_reparacion', 'liquidacion_diagnostico', 'control_calidad', 'liberada', 'finalizada'] as EstadoOrden[]).forEach(e => {
    contadores[e] = visibleOrdenes.filter(o => o.estado === e).length;
  });

  // Jefe: highlight unassigned OTs
  const jefeAlerts = isJefe ? ordenes.filter(o => !o.mecanicoId && o.estado !== 'finalizada' && o.estado !== 'cancelada').length : 0;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ClipboardList size={22} className="text-cyan-600" /> Órdenes de Trabajo
          </h1>
          <p className="text-slate-500 text-sm">{filtered.length} de {visibleOrdenes.length} órdenes visibles</p>
        </div>
        <div className="flex gap-2">
          {jefeAlerts > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 px-3 py-2 rounded-lg text-amber-700 text-sm">
              <AlertTriangle size={14} /> {jefeAlerts} OT{jefeAlerts > 1 ? 's' : ''} sin mecánico asignado
            </div>
          )}
          {isAsesor && (
            <button onClick={() => setShowWizard(true)}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm">
              <Plus size={16} /> Nueva OT
            </button>
          )}
        </div>
      </div>

      {/* Client alert: pending approvals */}
      {isCliente && (() => {
        const pendientes = visibleOrdenes.filter(o => o.estado === 'esperando_aprobacion');
        if (pendientes.length === 0) return null;
        return (
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-xl p-4 mb-5 flex items-center gap-4-200">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Bell size={20} className="text-cyan-300" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-base">¡{pendientes.length} cotización{pendientes.length > 1 ? 'es' : ''} esperando tu respuesta!</p>
              <p className="text-slate-300 text-sm">Tienes {pendientes.length > 1 ? 'presupuestos pendientes' : 'un presupuesto pendiente'} de aprobación. Haz clic en la orden para revisarlo.</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {pendientes.slice(0, 2).map(o => (
                <button key={o.id} onClick={() => setDetailOrden(o)}
                  className="px-3 py-1.5 bg-white text-slate-800 rounded-lg text-xs font-bold hover:bg-slate-100">
                  Ver {o.numero}
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Estado pills */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 mb-5 overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max flex-wrap">
          <button onClick={() => setFilterEstado('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${!filterEstado ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'}`}>
            Todos ({visibleOrdenes.length})
          </button>
          {(['registrada', 'en_diagnostico', 'esperando_aprobacion', 'en_reparacion', 'liquidacion_diagnostico', 'control_calidad', 'liberada', 'finalizada'] as EstadoOrden[]).map(e => {
            const cfg = ESTADO_CONFIG[e];
            const c = contadores[e];
            if (c === 0 && filterEstado !== e) return null;
            return (
              <button key={e} onClick={() => setFilterEstado(filterEstado === e ? '' : e)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${filterEstado === e ? `${cfg.bg} ${cfg.color} border-current` : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label} {c > 0 && <span className="font-bold">({c})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" placeholder="Buscar por número, cliente o placa..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white" />
      </div>

      {/* Desktop Table / Mobile Cards */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Mobile card list */}
        <div className="sm:hidden divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="py-14 text-center text-slate-400 text-sm">
              <ClipboardList size={32} className="mx-auto mb-2 opacity-20" />
              No se encontraron órdenes
            </div>
          ) : filtered.map(o => {
            const cfg = ESTADO_CONFIG[o.estado];
            const veh = vehiculos.find(v => v.id === o.vehiculoId);
            const cli = clientes.find(c => c.id === o.clienteId);
            const mec = usuarios.find(u => u.id === o.mecanicoId);
            const sinAsignar = !o.mecanicoId && o.estado !== 'finalizada' && o.estado !== 'cancelada';
            return (
              <button key={o.id} onClick={() => setDetailOrden(o)}
                className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${sinAsignar ? 'border-l-4 border-amber-400' : ''}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-700 text-sm">{o.numero}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                </div>
                <p className="text-sm text-slate-600">{cli?.nombre}</p>
                <p className="text-xs text-slate-400">{veh?.placa} · {veh?.marca} {veh?.modelo} {veh?.año}</p>
                {mec && <p className="text-xs text-cyan-600 mt-0.5">Mec: {mec.nombre.split(' ')[0]}</p>}
                {sinAsignar && <p className="text-xs text-amber-600 font-semibold mt-0.5">⚠ Sin mecánico asignado</p>}
              </button>
            );
          })}
        </div>
        {/* Desktop table */}
        <table className="hidden sm:table w-full">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200">
              {['OT', 'Cliente', 'Vehículo', 'Mecánico', 'Estado', 'Actualizado', ''].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="py-14 text-center text-slate-400 text-sm">
                <ClipboardList size={32} className="mx-auto mb-2 opacity-20" />
                No se encontraron órdenes de trabajo
              </td></tr>
            ) : filtered.map(o => {
              const cfg = ESTADO_CONFIG[o.estado];
              const veh = vehiculos.find(v => v.id === o.vehiculoId);
              const cli = clientes.find(c => c.id === o.clienteId);
              const mec = usuarios.find(u => u.id === o.mecanicoId);
              const sinAsignar = !o.mecanicoId && o.estado !== 'finalizada' && o.estado !== 'cancelada';
              const needsAction = o.estado === 'esperando_aprobacion' || o.estado === 'liquidacion_diagnostico';
              const pagar = isCliente && (o.estado === 'liberada' || o.estado === 'liquidacion_diagnostico');
              return (
                <tr key={o.id} onClick={() => setDetailOrden(o)}
                  className={`hover:bg-slate-50 cursor-pointer transition-colors ${needsAction ? 'bg-amber-50/30' : sinAsignar ? 'bg-red-50/20' : pagar ? 'bg-emerald-50/20' : ''}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      {sinAsignar && isJefe && <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />}
                      {needsAction && <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
                      {pagar && <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                      <span className="text-sm font-bold text-slate-700">{o.numero}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-700">{cli?.nombre || '—'}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">{veh ? `${veh.placa} · ${veh.marca} ${veh.modelo}` : '—'}</td>
                  <td className="px-5 py-3.5 text-sm">
                    {mec ? <span className="text-slate-700">{mec.nombre}</span> : <span className="italic text-red-400 text-xs">Sin asignar</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-400">{o.fechaActualizacion}</td>
                  <td className="px-5 py-3.5">
                    <button className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg">
                      <Eye size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showWizard && <WizardNuevaOT onClose={() => setShowWizard(false)} />}
      {detailOrden && (
        <ModalDetalle
          orden={detailOrden}
          onClose={() => setDetailOrden(null)}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}

// ─── Mechanic Work Panel ────────────────────────────────────────────────────────

function MecanicoWorkPanel({ ordenes, allOrdenes, clientes, vehiculos, currentUser, onOpenDetail }: {
  ordenes: OrdenTrabajo[];
  allOrdenes: OrdenTrabajo[];
  clientes: ReturnType<typeof useApp>['clientes'];
  vehiculos: ReturnType<typeof useApp>['vehiculos'];
  currentUser: ReturnType<typeof useApp>['currentUser'];
  onOpenDetail: (o: OrdenTrabajo) => void;
}) {
  const { notificaciones, marcarNotificacionLeida } = useApp();
  const diagnosticos = ordenes.filter(o => o.estado === 'en_diagnostico');
  const reparaciones = ordenes.filter(o => o.estado === 'en_reparacion');
  const controlCalidad = ordenes.filter(o => o.estado === 'control_calidad');
  const esperandoAprobacion = ordenes.filter(o => o.estado === 'esperando_aprobacion');
  const finalizadas = ordenes.filter(o => ['finalizada', 'liberada'].includes(o.estado));

  const getCliente = (id: string) => clientes.find(c => c.id === id);
  const getVehiculo = (id: string) => vehiculos.find(v => v.id === id);

  function OTCard({ orden, urgente }: { orden: OrdenTrabajo; urgente?: boolean }) {
    const cli = getCliente(orden.clienteId);
    const veh = getVehiculo(orden.vehiculoId);
    const cfg = ESTADO_CONFIG[orden.estado];
    return (
      <button onClick={() => onOpenDetail(orden)}
        className={`w-full text-left bg-white border-2 rounded-xl p-4 hover:shadow-md transition-all group ${urgente ? 'border-violet-300 hover:border-violet-400' : 'border-slate-200 hover:border-cyan-300'}`}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-700 text-sm">{orden.numero}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
            {urgente && <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-semibold animate-pulse">⚡ Nuevo</span>}
          </div>
          <ChevronRight size={14} className="text-slate-400 group-hover:text-cyan-500 flex-shrink-0 mt-0.5" />
        </div>
        <p className="text-sm font-semibold text-slate-800">{cli?.nombre}</p>
        <p className="text-xs text-slate-500">{veh?.placa} · {veh?.marca} {veh?.modelo} {veh?.año}</p>
        <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">{orden.descripcionProblema}</p>
        <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
          <Clock size={10} /> {orden.fechaCreacion}
        </div>
      </button>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2 mb-1">
          <Wrench size={22} className="text-cyan-600" /> Mi Panel de Trabajo
        </h1>
        <p className="text-slate-500 text-sm">Mecánico: <strong>{currentUser?.nombre}</strong> — Solo tus órdenes asignadas</p>
      </div>

      {/* New assignment notifications */}
      {(() => {
        const nuevasNotifs = notificaciones.filter(n =>
          !n.leida && n.paraUsuarioId === currentUser?.id && n.titulo.includes('diagnóstico')
        );
        if (nuevasNotifs.length === 0) return null;
        return (
          <div className="mb-5 space-y-2">
            {nuevasNotifs.map(n => (
              <div key={n.id} className="bg-gradient-to-r from-violet-600 to-violet-700 text-white rounded-2xl p-4 flex items-center gap-3 shadow-lg shadow-violet-200">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Bell size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{n.titulo}</p>
                  <p className="text-violet-200 text-xs mt-0.5 line-clamp-2">{n.mensaje}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {n.referenciaId && (() => {
                    const orden = ordenes.find(o => o.id === n.referenciaId);
                    return orden ? (
                      <button onClick={() => { marcarNotificacionLeida(n.id); onOpenDetail(orden); }}
                        className="px-3 py-1.5 bg-white text-violet-700 rounded-lg text-xs font-bold hover:bg-violet-50">
                        Ver OT →
                      </button>
                    ) : null;
                  })()}
                  <button onClick={() => marcarNotificacionLeida(n.id)}
                    className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg">
                    <X size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Por diagnosticar', val: diagnosticos.length, color: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
          { label: 'En reparación', val: reparaciones.length, color: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
          { label: 'En espera cliente', val: esperandoAprobacion.length, color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400' },
          { label: 'Completadas', val: finalizadas.length, color: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
        ].map(k => (
          <div key={k.label} className={`rounded-xl border px-4 py-3 ${k.color}`}>
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${k.dot}`} />
              <p className="text-xs opacity-70 font-medium">{k.label}</p>
            </div>
            <p className="text-3xl font-bold">{k.val}</p>
          </div>
        ))}
      </div>

      {/* ── Diagnósticos pendientes ── */}
      <div className="mb-7">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-violet-100 rounded-xl flex items-center justify-center">
            <Wrench size={16} className="text-violet-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-800">Diagnósticos Pendientes</h2>
            <p className="text-xs text-gray-400">Órdenes que requieren tu informe técnico y cotización</p>
          </div>
          {diagnosticos.length > 0 && (
            <span className="ml-auto bg-violet-600 text-white text-xs px-2.5 py-1 rounded-full font-bold">{diagnosticos.length}</span>
          )}
        </div>

        {diagnosticos.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl py-10 text-center">
            <CheckCircle size={32} className="mx-auto mb-2 text-green-300" />
            <p className="text-gray-400 text-sm font-medium">Sin diagnósticos pendientes</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {diagnosticos.map(o => <OTCard key={o.id} orden={o} urgente={!o.diagnostico} />)}
          </div>
        )}
      </div>

      {/* ── Reparaciones en curso ── */}
      <div className="mb-7">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center">
            <ShieldCheck size={16} className="text-orange-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-800">Reparaciones en Curso</h2>
            <p className="text-xs text-gray-400">Cotizaciones aprobadas — ejecuta los trabajos</p>
          </div>
          {reparaciones.length > 0 && (
            <span className="ml-auto bg-orange-500 text-white text-xs px-2.5 py-1 rounded-full font-bold">{reparaciones.length}</span>
          )}
        </div>

        {reparaciones.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl py-8 text-center">
            <p className="text-gray-400 text-sm">Sin reparaciones activas</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {reparaciones.map(o => <OTCard key={o.id} orden={o} />)}
          </div>
        )}
      </div>

      {/* ── Esperando aprobación cliente ── */}
      {esperandoAprobacion.length > 0 && (
        <div className="mb-7">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock size={16} className="text-amber-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-800">Esperando Aprobación del Cliente</h2>
              <p className="text-xs text-gray-400">Cotizaciones enviadas — en espera de respuesta</p>
            </div>
            <span className="ml-auto bg-amber-500 text-white text-xs px-2.5 py-1 rounded-full font-bold">{esperandoAprobacion.length}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {esperandoAprobacion.map(o => <OTCard key={o.id} orden={o} />)}
          </div>
        </div>
      )}

      {/* ── Control de calidad ── */}
      {controlCalidad.length > 0 && (
        <div className="mb-7">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center">
              <CheckCircle size={16} className="text-purple-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-800">En Control de Calidad</h2>
              <p className="text-xs text-gray-400">El Jefe de Taller está revisando tu trabajo</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {controlCalidad.map(o => <OTCard key={o.id} orden={o} />)}
          </div>
        </div>
      )}

      {/* ── Historial reciente ── */}
      {finalizadas.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckSquare size={16} className="text-green-600" />
            </div>
            <h2 className="font-bold text-gray-800">Completadas Recientemente</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {finalizadas.slice(0, 6).map(o => <OTCard key={o.id} orden={o} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Admin Read-Only Panel ──────────────────────────────────────────────────────
function AdminReadOnlyPanel({ orden, totalCot, mecAsignado }: {
  orden: OrdenTrabajo;
  totalCot: number;
  mecAsignado: ReturnType<typeof useApp>['usuarios'][0] | undefined;
}) {
  return (
    <div className="space-y-3">
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <Info size={12}/> Información de la orden — Vista de administrador (solo lectura)
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            ['Mecánico asignado', mecAsignado?.nombre || 'Sin asignar'],
            ['Fecha creación', orden.fechaCreacion],
            ['Última actualización', orden.fechaActualizacion],
            ['Creado por', orden.creadoPor || '—'],
          ].map(([k, v]) => (
            <div key={k} className="bg-white border border-slate-100 rounded-lg px-3 py-2">
              <p className="text-slate-400">{k}</p>
              <p className="font-semibold text-slate-700">{v}</p>
            </div>
          ))}
        </div>
      </div>

      {orden.diagnostico && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-bold text-slate-500 mb-1">Diagnóstico técnico</p>
          <p className="text-xs text-slate-700">{orden.diagnostico}</p>
          {orden.fallasAdicionales && <p className="text-xs text-slate-500 mt-1"><strong>Fallas adicionales:</strong> {orden.fallasAdicionales}</p>}
        </div>
      )}

      {orden.cotizacion && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50">
            <p className="text-xs font-bold text-slate-600">Cotización — Estado: <span className="capitalize">{orden.cotizacion.estado}</span></p>
          </div>
          <div className="px-4 py-3 space-y-1">
            {orden.cotizacion.lineas.map(l => (
              <div key={l.id} className="flex justify-between text-xs text-slate-600">
                <span>{l.descripcion} ×{l.cantidad}</span>
                <span>${(l.cantidad * l.precioUnitario).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-slate-100 pt-2 space-y-0.5">
              <div className="flex justify-between text-xs text-slate-500"><span>Subtotal</span><span>${totalCot.toFixed(2)}</span></div>
              <div className="flex justify-between text-xs text-slate-500"><span>IVA 12%</span><span>${(totalCot * 0.12).toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-slate-800 text-sm"><span>Total</span><span>${(totalCot * 1.12).toFixed(2)}</span></div>
            </div>
          </div>
        </div>
      )}

      {orden.reparacion && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-bold text-slate-500 mb-1">Notas de reparación</p>
          <p className="text-xs text-slate-700">{orden.reparacion}</p>
        </div>
      )}

      {orden.controlCalidad && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-bold text-slate-500 mb-1">Control de Calidad — {orden.controlCalidad.aprobado ? '✅ Aprobado' : '❌ Rechazado'}</p>
          {orden.controlCalidad.observaciones && <p className="text-xs text-slate-700">{orden.controlCalidad.observaciones}</p>}
        </div>
      )}

      {orden.facturaId && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2">
          <CheckCircle size={14} className="text-emerald-600"/>
          <p className="text-xs text-emerald-700 font-semibold">Factura emitida: {orden.facturaId}</p>
        </div>
      )}
    </div>
  );
}

// ─── Modal Detalle ─────────────────────────────────────────────────────────────

function ModalDetalle({ orden, onClose, currentUser }: {
  orden: OrdenTrabajo; onClose: () => void;
  currentUser: ReturnType<typeof useApp>['currentUser'];
}) {
  const { clientes, vehiculos, usuarios, repuestos, catalogs, updateOrden, deleteOrden,
    registrarSalidaRepuesto, reservarRepuestos, liberarReservas, addAuditoria, addFactura, addNotificacion } = useApp();

  const [localOrden, setLocalOrden] = useState<OrdenTrabajo>(orden);

  const update = (data: Partial<OrdenTrabajo>) => {
    const updated = { ...localOrden, ...data, fechaActualizacion: new Date().toISOString().split('T')[0] };
    setLocalOrden(updated);
    updateOrden(localOrden.id, data);
  };

  const log = (accion: string, detalles: string) => {
    if (currentUser) addAuditoria({ fecha: new Date().toISOString(), usuarioId: currentUser.id, usuarioNombre: currentUser.nombre, accion, modulo: 'Órdenes', detalles, entidadId: localOrden.id, entidadTipo: 'OrdenTrabajo' });
  };

  const cliente = clientes.find(c => c.id === localOrden.clienteId);
  const veh = vehiculos.find(v => v.id === localOrden.vehiculoId);
  const cfg = ESTADO_CONFIG[localOrden.estado];
  const mecanicos = usuarios.filter(u => u.rol === 'mecanico' && u.activo);
  const mecAsignado = usuarios.find(u => u.id === localOrden.mecanicoId);

  const isAdmin = currentUser?.rol === 'administrador';
  const isAsesor = currentUser?.rol === 'asesor';
  const isMecanico = currentUser?.rol === 'mecanico';
  const isJefe = currentUser?.rol === 'jefe_taller';
  const isCliente = currentUser?.rol === 'cliente';

  // Guard: mechanic can only interact with orders assigned to them
  const isMecanicoAsignado = isMecanico && (
    localOrden.mecanicoId === currentUser?.id ||
    localOrden.mecanicosIds?.includes(currentUser?.id || '')
  );

  const mecFijo = !!localOrden.mecanicoId; // once assigned, locked forever

  const totalCot = (localOrden.cotizacion?.lineas || []).reduce((s, l) => s + l.cantidad * l.precioUnitario, 0);

  const generarFactura = (subtotal: number, metodoPago: string): Factura => ({
    numero: `FAC-${Date.now()}`,
    fecha: new Date().toISOString().split('T')[0],
    ordenId: localOrden.id,
    clienteId: localOrden.clienteId,
    subtotal,
    impuesto: subtotal * 0.12,
    total: subtotal * 1.12,
    metodoPago,
    estado: 'pagada',
  });

  return (
    <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-6 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-100">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="font-bold text-gray-800 text-lg">{localOrden.numero}</h2>
            <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <span className="text-xs bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Lock size={10}/> Solo lectura
              </span>
            )}
            <button onClick={onClose} className="p-1.5 hover:bg-gray-200 rounded-lg"><X size={16} className="text-gray-500" /></button>
          </div>
        </div>

        {/* Client + Vehicle */}
        <div className="px-6 py-2.5 bg-blue-50/50 border-b border-blue-100 flex flex-wrap gap-4 text-sm">
          <span className="text-gray-500">👤 <strong className="text-gray-700">{cliente?.nombre}</strong> · {cliente?.telefono}</span>
          <span className="text-gray-500">🚗 <strong className="text-gray-700">{veh?.placa}</strong> · {veh?.marca} {veh?.modelo} {veh?.año}</span>
        </div>

        {/* Progress stepper */}
        <StepProgress estadoActual={localOrden.estado} />

        {/* Problema */}
        <div className="px-6 pt-4 pb-2">
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-sm text-amber-800">
            <span className="font-semibold">Problema reportado: </span>{localOrden.descripcionProblema}
          </div>
        </div>

        {/* ─── Mechanic Assignment — SOLO Jefe de Taller ─── */}
        {isJefe && (
          <div className="px-6 py-3">
            <PanelAsignacionMecanico
              orden={localOrden} mecanicos={mecanicos} mecFijo={mecFijo}
              mecAsignado={mecAsignado} currentUser={currentUser}
              onAsignar={(mecId) => {
                const m = mecanicos.find(m => m.id === mecId);
                const veh = vehiculos.find(v => v.id === localOrden.vehiculoId);
                update({ mecanicoId: mecId, mecanicosIds: [mecId], jefeAsignadoId: currentUser?.id, asignadoPor: currentUser?.id });
                log('ASIGNAR_MECANICO', `${m?.nombre} asignado a ${localOrden.numero}`);
                // Notify mechanic
                addNotificacion({
                  tipo: 'nueva_cita',
                  titulo: `Nuevo diagnóstico asignado — ${localOrden.numero}`,
                  mensaje: `El Jefe de Taller te asignó el diagnóstico de ${localOrden.numero}. Vehículo: ${veh?.placa} ${veh?.marca} ${veh?.modelo}. Problema: ${localOrden.descripcionProblema}`,
                  paraRol: ['mecanico'],
                  paraUsuarioId: mecId,
                  referenciaId: localOrden.id,
                });
                toast.success(`✅ ${m?.nombre} asignado — se le notificó del diagnóstico`);
              }}
            />
          </div>
        )}

        {/* ─── PANEL PRINCIPAL basado en estado ─── */}
        <div className="px-6 pb-6 space-y-4 max-h-[52vh] overflow-y-auto">

          {/* ADMIN: panel informativo único — sin ninguna acción disponible */}
          {isAdmin && (
            <AdminReadOnlyPanel orden={localOrden} totalCot={totalCot} mecAsignado={mecAsignado} />
          )}

          {/* MECÁNICO no asignado a esta orden: solo info */}
          {isMecanico && !isMecanicoAsignado && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
              <AlertTriangle size={16} className="text-amber-500 flex-shrink-0"/>
              <div>
                <p className="text-sm font-semibold text-amber-800">No estás asignado a esta orden</p>
                <p className="text-xs text-amber-600 mt-0.5">Solo el mecánico asignado puede realizar acciones en esta OT.</p>
              </div>
            </div>
          )}

          {/* REGISTRADA → Solo Asesor puede hacer recepción */}
          {localOrden.estado === 'registrada' && isAsesor && (
            <PanelRecepcion orden={localOrden} onSave={(rec, fotos) => {
              update({ recepcion: { ...rec, fotos }, fotosRecepcion: fotos, estado: 'en_diagnostico' });
              log('GUARDAR_RECEPCION', `Recepción guardada con ${fotos.length} foto(s). OT → EN_DIAGNOSTICO`);
              toast.success('Recepción guardada. La OT avanzó a Diagnóstico.');
            }} />
          )}

          {/* EN_DIAGNOSTICO → Solo el mecánico ASIGNADO puede diagnosticar */}
          {localOrden.estado === 'en_diagnostico' && isMecanicoAsignado && (
            <PanelDiagnostico
              orden={localOrden} repuestos={repuestos}
              onEnviar={(diagnostico, fallasAdicionales, cotizacion, repuestosReservadosNew) => {
                reservarRepuestos(repuestosReservadosNew, localOrden.id);
                update({ diagnostico, fallasAdicionales, cotizacion, repuestosReservados: repuestosReservadosNew, estado: 'esperando_aprobacion' });
                const total = cotizacion.lineas.reduce((s, l) => s + l.cantidad * l.precioUnitario, 0);
                // Notify client
                const clienteRecord = clientes.find(c => c.id === localOrden.clienteId);
                addNotificacion({
                  tipo: 'cotizacion_pendiente',
                  titulo: '¡Tu cotización está lista!',
                  mensaje: `La cotización de ${localOrden.numero} está lista para tu revisión. Total: $${(total * 1.12).toFixed(2)} con IVA. Ingresa a tu portal para aprobar o rechazar.`,
                  paraRol: ['cliente'],
                  paraUsuarioId: clienteRecord?.usuarioId,
                  referenciaId: localOrden.id,
                });
                log('ENVIAR_COTIZACION', `Cotización por $${total.toFixed(2)} enviada. OT → ESPERANDO_APROBACION`);
                toast.success('✅ Cotización enviada al cliente para aprobación.');
              }}
            />
          )}

          {/* ESPERANDO APROBACION → SOLO CLIENTE puede aprobar o rechazar */}
          {localOrden.estado === 'esperando_aprobacion' && isCliente && (
            <PanelAprobacion
              orden={localOrden} totalCot={totalCot}
              onAprobar={() => {
                if (localOrden.repuestosReservados?.length) {
                  localOrden.repuestosReservados.forEach(r => registrarSalidaRepuesto(r.repuestoId, r.cantidad, localOrden.id));
                  liberarReservas(localOrden.repuestosReservados, localOrden.id);
                }
                update({ cotizacion: { ...localOrden.cotizacion!, estado: 'aprobada', fechaRespuesta: new Date().toISOString().split('T')[0] }, estado: 'en_reparacion' });
                log('APROBAR_COTIZACION', `Cliente aprobó cotización. OT → EN_REPARACION`);
                toast.success('✅ Aprobado. El taller iniciará la reparación de tu vehículo.');
              }}
              onRechazar={() => {
                if (localOrden.repuestosReservados?.length) liberarReservas(localOrden.repuestosReservados, localOrden.id);
                update({ cotizacion: { ...localOrden.cotizacion!, estado: 'rechazada', fechaRespuesta: new Date().toISOString().split('T')[0] }, estado: 'liquidacion_diagnostico' });
                log('RECHAZAR_COTIZACION', `Cliente rechazó cotización. OT → LIQUIDACION_DIAGNOSTICO`);
                toast.info('Cotización rechazada. Se cobrará solo el diagnóstico.');
              }}
            />
          )}
          {/* Personal del taller VE la cotización pero NO puede aprobar en nombre del cliente */}
          {localOrden.estado === 'esperando_aprobacion' && (isAsesor || isAdmin || isJefe) && (
            <div className="border-2 border-amber-300 bg-amber-50 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-amber-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-amber-800">Pendiente: Aprobación del Cliente</h3>
                  <p className="text-xs text-amber-600">Solo el titular del vehículo puede aprobar o rechazar esta cotización</p>
                </div>
              </div>
              <div className="bg-white border border-amber-200 rounded-xl overflow-hidden">
                {localOrden.cotizacion?.lineas.map(l => (
                  <div key={l.id} className="flex justify-between text-sm px-4 py-2.5 border-b border-gray-100 last:border-0">
                    <span className="text-gray-700 flex items-center gap-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${l.tipo === 'repuesto' ? 'bg-blue-100 text-blue-700' : l.tipo === 'diagnostico' ? 'bg-violet-100 text-violet-700' : 'bg-orange-100 text-orange-700'}`}>
                        {l.tipo === 'mano_de_obra' ? 'M.O.' : l.tipo === 'diagnostico' ? 'Diag.' : 'Rep.'}
                      </span>
                      {l.descripcion} × {l.cantidad}
                    </span>
                    <span className="font-semibold">${(l.cantidad * l.precioUnitario).toFixed(2)}</span>
                  </div>
                ))}
                <div className="px-4 py-3 bg-amber-50 space-y-1">
                  <div className="flex justify-between text-xs text-gray-500"><span>Subtotal</span><span>${totalCot.toFixed(2)}</span></div>
                  <div className="flex justify-between text-xs text-gray-500"><span>IVA 12%</span><span>${(totalCot * 0.12).toFixed(2)}</span></div>
                  <div className="flex justify-between font-bold text-amber-800 text-base"><span>TOTAL</span><span>${(totalCot * 1.12).toFixed(2)}</span></div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-amber-100 border border-amber-300 rounded-lg px-3 py-2.5 text-xs text-amber-700">
                <AlertTriangle size={13} className="flex-shrink-0" />
                <span><strong>El cliente debe acceder a su portal</strong> para aprobar o rechazar. Enviada: {localOrden.cotizacion?.fechaEnvio || '—'}. Diagnóstico si rechaza: <strong>${localOrden.cotizacion?.costoDiagnostico?.toFixed(2)}</strong></span>
              </div>
            </div>
          )}

          {/* LIQUIDACION DIAGNOSTICO → Asesor/Cliente: Pagar diagnóstico */}
          {localOrden.estado === 'liquidacion_diagnostico' && (isAsesor || isCliente || isAdmin) && (
            <PanelLiquidacion
              orden={localOrden} catalogs={catalogs}
              onPagar={(metodoPago) => {
                const costoDx = localOrden.cotizacion?.costoDiagnostico || 30;
                const factura = generarFactura(costoDx, metodoPago);
                addFactura(factura);
                update({ estado: 'finalizada', entregaFirmada: true, facturaId: factura.numero });
                log('LIQUIDACION_PAGADA', `Diagnóstico cobrado $${costoDx}. Factura ${factura.numero}. OT FINALIZADA.`);
                toast.success(`Pago de diagnóstico registrado. Factura ${factura.numero} generada.`);
                onClose();
              }}
            />
          )}

          {/* EN_REPARACION → Solo mecánico asignado */}
          {localOrden.estado === 'en_reparacion' && isMecanicoAsignado && (
            <PanelReparacion
              orden={localOrden} repuestos={repuestos}
              registrarSalidaRepuesto={registrarSalidaRepuesto}
              onGuardar={(reparacion, repuestosUsados, fotosReparacion) => {
                update({ reparacion, repuestosUsados, fotosReparacion });
                log('GUARDAR_REPARACION', 'Reparación actualizada');
                toast.success('Reparación guardada');
              }}
              onEnviarQC={(reparacion, repuestosUsados, fotosReparacion) => {
                update({ reparacion, repuestosUsados, fotosReparacion, estado: 'control_calidad' });
                log('ENVIAR_CONTROL_CALIDAD', `OT enviada a Control de Calidad por ${currentUser?.nombre}`);
                toast.success('OT enviada a Control de Calidad');
              }}
            />
          )}

          {/* CONTROL CALIDAD → Solo Jefe de Taller */}
          {localOrden.estado === 'control_calidad' && isJefe && (
            <PanelControlCalidad
              orden={localOrden}
              onAprobar={(qc) => {
                update({ controlCalidad: { ...qc, aprobado: true, responsableId: currentUser?.id, fechaRevision: new Date().toISOString().split('T')[0] }, estado: 'liberada' });
                // Notify client: vehicle is ready
                const clienteRecord = clientes.find(c => c.id === localOrden.clienteId);
                addNotificacion({
                  tipo: 'orden_lista',
                  titulo: '🎉 ¡Tu vehículo está listo para recoger!',
                  mensaje: `Tu vehículo de la orden ${localOrden.numero} pasó el control de calidad y ya puede ser recogido. Puedes pagar en línea desde tu portal o en la recepción del taller. Código de recojo: ${localOrden.numero}`,
                  paraRol: ['cliente'],
                  paraUsuarioId: clienteRecord?.usuarioId,
                  referenciaId: localOrden.id,
                });
                // Notify asesor
                addNotificacion({
                  tipo: 'orden_lista',
                  titulo: `Vehículo listo para entrega — ${localOrden.numero}`,
                  mensaje: `El Control de Calidad aprobó la OT ${localOrden.numero}. El vehículo puede ser entregado al cliente.`,
                  paraRol: ['asesor'],
                  referenciaId: localOrden.id,
                });
                log('APROBAR_QC', 'Control de Calidad aprobado. OT → LIBERADA');
                toast.success('✅ Vehículo liberado para entrega — cliente y asesor notificados');
              }}
              onRechazar={(qc) => {
                update({ controlCalidad: { ...qc, aprobado: false, responsableId: currentUser?.id, fechaRevision: new Date().toISOString().split('T')[0] }, estado: 'en_reparacion' });
                log('RECHAZAR_QC', `QC rechazado. Observaciones: ${qc.observaciones}. OT → EN_REPARACION`);
                toast.warning('QC rechazado. El mecánico debe corregir las observaciones.');
              }}
            />
          )}

          {/* LIBERADA → Solo Asesor puede entregar. Detecta si el cliente ya pagó online. */}
          {localOrden.estado === 'liberada' && isAsesor && (
            <PanelEntrega
              orden={localOrden} totalCot={totalCot}
              onEntregar={(metodoPago, notas) => {
                let facturaId = localOrden.facturaId;
                // Only generate new invoice if client didn't pay online
                if (!localOrden.pagadoEnLinea) {
                  const factura = generarFactura(totalCot, metodoPago);
                  addFactura(factura);
                  facturaId = factura.numero;
                }
                update({
                  estado: 'finalizada',
                  entregaFirmada: true,
                  notasEntrega: notas,
                  facturaId,
                  metodoPagoFinal: metodoPago,
                  cotizacion: { ...localOrden.cotizacion!, metodoPago },
                });
                // Update vehicle km from recepcion (latest known km)
                const veh = vehiculos.find(v => v.id === localOrden.vehiculoId);
                if (veh && localOrden.recepcion?.kilometraje) {
                  // km is already stored in recepcion, just a log note
                }
                // Notify client: vehicle ready for pickup
                const clienteRecord = clientes.find(c => c.id === localOrden.clienteId);
                if (!localOrden.pagadoEnLinea) {
                  addNotificacion({
                    tipo: 'orden_lista',
                    titulo: `Vehículo entregado — ${localOrden.numero}`,
                    mensaje: `Tu ${veh?.marca} ${veh?.modelo} (${veh?.placa}) fue entregado. Factura ${facturaId}. ¡Gracias por confiar en TallerPro!`,
                    paraRol: ['cliente'],
                    paraUsuarioId: clienteRecord?.usuarioId,
                    referenciaId: localOrden.id,
                  });
                }
                log('FINALIZAR_OT', `Vehículo entregado a ${clienteRecord?.nombre}. Factura ${facturaId}. Pago: ${metodoPago}${localOrden.pagadoEnLinea ? ' (pagado previamente en línea)' : ''}`);
                toast.success(`✅ OT ${localOrden.numero} finalizada. Vehículo entregado. Factura ${facturaId} emitida.`);
                onClose();
              }}
            />
          )}
          {localOrden.estado === 'liberada' && isCliente && !localOrden.pagadoEnLinea && (
            <PanelPagoCliente
              totalCot={totalCot} catalogs={catalogs}
              onPagar={(metodoPago) => {
                const factura = generarFactura(totalCot, metodoPago);
                addFactura(factura);
                // OT stays in 'liberada' — asesor must confirm physical delivery
                update({ pagadoEnLinea: true, facturaId: factura.numero, metodoPagoFinal: metodoPago, cotizacion: { ...localOrden.cotizacion!, metodoPago } });
                // Notify asesor: client already paid
                const clienteRecord = clientes.find(c => c.id === localOrden.clienteId);
                addNotificacion({
                  tipo: 'pago_recibido',
                  titulo: `💳 Pago recibido en línea — ${localOrden.numero}`,
                  mensaje: `${clienteRecord?.nombre} pagó $${(totalCot * 1.12).toFixed(2)} vía ${metodoPago}. Factura ${factura.numero}. El cliente vendrá a recoger el vehículo.`,
                  paraRol: ['asesor'],
                  referenciaId: localOrden.id,
                });
                log('PAGO_CLIENTE_ONLINE', `Cliente pagó $${(totalCot * 1.12).toFixed(2)} vía ${metodoPago}. Factura ${factura.numero}. Pendiente entrega física.`);
                toast.success(`✅ ¡Pago confirmado! Factura ${factura.numero}. Presenta el código "${localOrden.numero}" al recoger tu vehículo.`);
                onClose();
              }}
            />
          )}
          {localOrden.estado === 'liberada' && isCliente && localOrden.pagadoEnLinea && (
            <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-4 flex items-start gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle size={20} className="text-white"/>
              </div>
              <div>
                <p className="font-bold text-emerald-800">✅ Pago registrado exitosamente</p>
                <p className="text-sm text-emerald-700 mt-0.5">Tu pago fue confirmado. Presenta el código <strong className="font-mono bg-emerald-100 px-1.5 py-0.5 rounded">{localOrden.numero}</strong> al recoger tu vehículo.</p>
                <p className="text-xs text-emerald-600 mt-1">Factura: {localOrden.facturaId} · Método: {localOrden.metodoPagoFinal}</p>
              </div>
            </div>
          )}

          {/* FINALIZADA → Resumen */}
          {localOrden.estado === 'finalizada' && (
            <PanelResumen orden={localOrden} totalCot={totalCot} />
          )}

          {/* INFO GENERAL — visible para todos excepto admin (admin ya tiene AdminReadOnlyPanel) */}
          {!isAdmin && <InfoGeneral orden={localOrden} usuarios={usuarios} />}

        </div>
      </div>
    </div>
  );
}

// ─── Panel: Asignación de Mecánico (Jefe) ────────────────────────────────────

function PanelAsignacionMecanico({ orden, mecanicos, mecFijo, mecAsignado, currentUser, onAsignar }: {
  orden: OrdenTrabajo; mecanicos: ReturnType<typeof useApp>['usuarios'];
  mecFijo: boolean; mecAsignado: ReturnType<typeof useApp>['usuarios'][0] | undefined;
  currentUser: ReturnType<typeof useApp>['currentUser'];
  onAsignar: (mecId: string) => void;
}) {
  const { ordenes } = useApp();
  const [mecId, setMecId] = useState('');

  const getCarga = (id: string) =>
    ordenes.filter(o => o.mecanicoId === id && !['finalizada', 'cancelada', 'liberada'].includes(o.estado)).length;

  if (mecFijo && mecAsignado) {
    const carga = getCarga(mecAsignado.id);
    return (
      <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-green-700 uppercase tracking-wide flex items-center gap-1">
            <UserCheck size={12} /> Mecánico Asignado
          </p>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
            <Lock size={9} /> Asignación confirmada
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-base shadow-md">
            {mecAsignado.nombre.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-green-800">{mecAsignado.nombre}</p>
            <p className="text-xs text-green-600">{carga} OT{carga !== 1 ? 's' : ''} activa{carga !== 1 ? 's' : ''}</p>
          </div>
          <CheckCircle size={22} className="text-green-500 ml-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-orange-200 rounded-xl p-4 bg-orange-50/30">
      <div className="flex items-center gap-2 mb-1">
        <AlertTriangle size={14} className="text-orange-500" />
        <p className="text-sm font-bold text-orange-800">Asignar Mecánico para Diagnóstico</p>
      </div>
      <p className="text-xs text-orange-600 mb-3">El mecánico seleccionado recibirá una notificación automática con los detalles del diagnóstico.</p>

      <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
        {mecanicos.map(m => {
          const carga = getCarga(m.id);
          const isSelected = mecId === m.id;
          return (
            <button key={m.id} type="button" onClick={() => setMecId(isSelected ? '' : m.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${isSelected ? 'border-orange-500 bg-orange-50 shadow-sm' : 'border-gray-200 bg-white hover:border-orange-300'}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm ${isSelected ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {m.nombre.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${isSelected ? 'text-orange-800' : 'text-gray-800'}`}>{m.nombre}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full max-w-20">
                    <div className={`h-full rounded-full ${carga === 0 ? 'bg-green-500' : carga <= 2 ? 'bg-amber-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(100, carga * 30)}%` }} />
                  </div>
                  <span className={`text-xs font-medium ${carga === 0 ? 'text-green-600' : carga <= 2 ? 'text-amber-600' : 'text-red-600'}`}>
                    {carga === 0 ? 'Disponible' : `${carga} OT${carga > 1 ? 's' : ''} activa${carga > 1 ? 's' : ''}`}
                  </span>
                </div>
              </div>
              {isSelected && <CheckCircle size={18} className="text-orange-500 flex-shrink-0" />}
            </button>
          );
        })}
      </div>

      <button onClick={() => { if (!mecId) { toast.error('Selecciona un mecánico'); return; } onAsignar(mecId); }}
        disabled={!mecId}
        className={`w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${mecId ? 'bg-orange-600 text-white hover:bg-orange-700 shadow-md shadow-orange-200' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
        <Bell size={14} /> Asignar y Notificar al Mecánico
      </button>
    </div>
  );
}

// ─── Panel: Recepción del Vehículo (Asesor) ──────────────────────────────────

function PanelRecepcion({ orden, onSave }: {
  orden: OrdenTrabajo;
  onSave: (rec: NonNullable<OrdenTrabajo['recepcion']>, fotos: string[]) => void;
}) {
  const [km, setKm] = useState(orden.recepcion?.kilometraje || '');
  const [combustible, setCombustible] = useState(orden.recepcion?.nivelCombustible || 2);
  const [aceite, setAceite] = useState<'bueno'|'bajo'|'malo'>(orden.recepcion?.aceite || 'bueno');
  const [refrigerante, setRefrigerante] = useState<'bueno'|'bajo'|'malo'>(orden.recepcion?.refrigerante || 'bueno');
  const [frenos, setFrenosState] = useState<'bueno'|'bajo'|'malo'>(orden.recepcion?.frenos || 'bueno');
  const [danos, setDanos] = useState(orden.recepcion?.dañosPreexistentes || '');
  const [inventario, setInventario] = useState(orden.recepcion?.inventario || '');
  const [fotos, setFotos] = useState<string[]>(orden.fotosRecepcion || orden.recepcion?.fotos || []);
  const fotoRef = useRef<HTMLInputElement>(null);

  const fluidoColors = { bueno: 'bg-green-100 text-green-700 border-green-300', bajo: 'bg-yellow-100 text-yellow-700 border-yellow-300', malo: 'bg-red-100 text-red-700 border-red-300' };

  if (orden.recepcion && orden.estado !== 'registrada') {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase">Recepción Registrada</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <InfoField label="Kilometraje" value={orden.recepcion.kilometraje} />
          <InfoField label="Combustible" value={['E','¼','½','¾','F'][orden.recepcion.nivelCombustible]} />
          <InfoField label="Daños preexistentes" value={orden.recepcion.dañosPreexistentes || 'Ninguno'} />
          <InfoField label="Inventario" value={orden.recepcion.inventario || 'Ninguno'} />
        </div>
        {fotos.length > 0 && <><p className="text-xs font-medium text-gray-600">Fotos de ingreso ({fotos.length})</p><PhotoGrid photos={fotos} /></>}
      </div>
    );
  }

  return (
    <div className="border border-blue-200 rounded-xl p-5 bg-blue-50/20 space-y-4">
      <div className="flex items-center gap-2">
        <Camera size={16} className="text-blue-600" />
        <h3 className="font-semibold text-blue-800">Paso 1: Recepción del Vehículo</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Kilometraje</label>
          <input value={km} onChange={e => setKm(e.target.value)} placeholder="Ej: 85,400"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Nivel combustible</label>
          <div className="flex gap-1 h-9">
            {[0,1,2,3,4].map(n => (
              <button key={n} onClick={() => setCombustible(n)}
                className={`flex-1 rounded text-xs font-medium border transition-all ${combustible >= n ? 'bg-blue-500 border-blue-500 text-white' : 'bg-gray-100 border-gray-200 text-gray-400'}`}>
                {['E','¼','½','¾','F'][n]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs text-gray-600 mb-2">Estado de fluidos</p>
        <div className="grid grid-cols-3 gap-2">
          {([['aceite', aceite, setAceite], ['refrigerante', refrigerante, setRefrigerante], ['frenos', frenos, setFrenosState]] as const).map(([campo, val, setter]) => (
            <div key={campo}>
              <p className="text-xs text-gray-500 capitalize mb-1">{campo}</p>
              <div className="flex gap-1">
                {(['bueno','bajo','malo'] as const).map(opt => (
                  <button key={opt} onClick={() => (setter as any)(opt)}
                    className={`flex-1 py-1 text-xs rounded border capitalize transition-all ${val === opt ? `${fluidoColors[opt]} font-medium` : 'bg-white border-gray-200 text-gray-500'}`}>
                    {opt[0].toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-600 mb-1">Daños preexistentes</label>
        <textarea value={danos} onChange={e => setDanos(e.target.value)} rows={2}
          placeholder="Golpes, rayones, abolladuras..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">Inventario del vehículo</label>
        <textarea value={inventario} onChange={e => setInventario(e.target.value)} rows={2}
          placeholder="Llanta de repuesto, herramientas, documentos..." className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {/* Fotos OBLIGATORIAS */}
      <div className="border-2 border-dashed border-red-300 rounded-xl p-4 bg-red-50/30">
        <div className="flex items-center gap-2 mb-2">
          <Camera size={15} className="text-red-600" />
          <p className="text-sm font-semibold text-red-700">📸 Fotos del vehículo al ingreso <span className="text-red-500 font-bold">*OBLIGATORIO</span></p>
        </div>
        <p className="text-xs text-red-600 mb-3">Fotografía todos los costados, daños preexistentes y estado general del vehículo.</p>
        {fotos.length > 0 && <div className="mb-3"><PhotoGrid photos={fotos} onRemove={i => setFotos(prev => prev.filter((_, j) => j !== i))} /></div>}
        <UploadBtn label="Agregar fotos de ingreso" inputRef={fotoRef}
          onChange={async (e) => { const nuevas = await readFilesAsBase64(e.target.files); setFotos(prev => [...prev, ...nuevas]); }}
          count={fotos.length} />
      </div>

      <button
        onClick={() => {
          if (fotos.length === 0) { toast.error('Las fotos de ingreso son OBLIGATORIAS'); return; }
          onSave({ kilometraje: km, nivelCombustible: combustible, aceite, refrigerante, frenos, dañosPreexistentes: danos, inventario }, fotos);
        }}
        className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${fotos.length > 0 ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
        Guardar Recepción y Avanzar a Diagnóstico →
      </button>
    </div>
  );
}

// ─── Panel: Diagnóstico + Cotización (Mecánico) ───────────────────────────────

function PanelDiagnostico({ orden, repuestos, onEnviar }: {
  orden: OrdenTrabajo;
  repuestos: ReturnType<typeof useApp>['repuestos'];
  onEnviar: (diagnostico: string, fallasAdicionales: string, cotizacion: Cotizacion, repuestosReservados: RepuestoUsado[]) => void;
}) {
  const [diagnostico, setDiagnostico] = useState(orden.diagnostico || '');
  const [fallasAdicionales, setFallasAdicionales] = useState(orden.fallasAdicionales || '');
  const [recomendaciones, setRecomendaciones] = useState('');
  const [costoDiagnostico, setCostoDiagnostico] = useState(orden.cotizacion?.costoDiagnostico || 30);
  const [lineas, setLineas] = useState<LineaCotizacion[]>(orden.cotizacion?.lineas || []);

  // Add part
  const [tipoLinea, setTipoLinea] = useState<'repuesto' | 'mano_de_obra' | 'diagnostico'>('mano_de_obra');
  const [repuestoId, setRepuestoId] = useState('');
  const [descLinea, setDescLinea] = useState('');
  const [cantLinea, setCantLinea] = useState(1);
  const [precioLinea, setPrecioLinea] = useState(0);

  const total = lineas.reduce((s, l) => s + l.cantidad * l.precioUnitario, 0);
  const totalConIVA = total * 1.12;

  const addLinea = () => {
    if (!descLinea.trim()) { toast.error('Agrega una descripción'); return; }
    if (precioLinea <= 0) { toast.error('El precio debe ser mayor a 0'); return; }
    setLineas(prev => [...prev, { id: `lc${Date.now()}`, tipo: tipoLinea, descripcion: descLinea, cantidad: cantLinea, precioUnitario: precioLinea, ...(repuestoId ? { repuestoId } : {}) }]);
    setDescLinea(''); setCantLinea(1); setPrecioLinea(0); setRepuestoId('');
    toast.success('Línea agregada a la cotización');
  };

  const handleEnviar = () => {
    if (!diagnostico.trim()) { toast.error('El diagnóstico técnico es obligatorio'); return; }
    if (lineas.length === 0) { toast.error('Agrega al menos una línea a la cotización'); return; }

    const cotizacion: Cotizacion = {
      lineas, estado: 'enviada', costoDiagnostico,
      fechaEnvio: new Date().toISOString().split('T')[0],
    };

    const repuestosReservados: RepuestoUsado[] = lineas
      .filter(l => l.tipo === 'repuesto')
      .map(l => {
        const rep = repuestos.find(r => r.id === (l as any).repuestoId || r.nombre === l.descripcion);
        return rep ? { repuestoId: rep.id, nombre: rep.nombre, cantidad: l.cantidad, precio: rep.precio } : null;
      }).filter(Boolean) as RepuestoUsado[];

    const diagnosticoCompleto = recomendaciones.trim()
      ? `${diagnostico}\n\n📋 RECOMENDACIONES TÉCNICAS:\n${recomendaciones}`
      : diagnostico;
    onEnviar(diagnosticoCompleto, fallasAdicionales, cotizacion, repuestosReservados);
  };

  const mecOrden = !orden.mecanicoId;

  return (
    <div className="space-y-4">
      {mecOrden && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700 flex items-center gap-2">
          <AlertTriangle size={14} /> Espera la asignación del Jefe de Taller antes de comenzar
        </div>
      )}

      <div className="border border-violet-200 rounded-xl p-5 bg-violet-50/20 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench size={16} className="text-violet-600" />
            <h3 className="font-semibold text-violet-800">Informe de Diagnóstico + Cotización</h3>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Costo diagnóstico</p>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">$</span>
              <input type="number" value={costoDiagnostico} onChange={e => setCostoDiagnostico(Number(e.target.value))} min={0}
                className="w-20 px-2 py-1 border border-violet-200 bg-violet-50 rounded-lg text-sm text-center font-bold text-violet-800 focus:outline-none focus:ring-2 focus:ring-violet-400" />
            </div>
            <p className="text-xs text-violet-500 mt-0.5">cobrado si rechazan</p>
          </div>
        </div>

        {/* Vehicle photos from reception */}
        {(orden.fotosRecepcion?.length || orden.recepcion?.fotos?.length) ? (
          <div className="bg-white border border-gray-200 rounded-xl p-3">
            <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1"><Camera size={11} /> Fotos de ingreso del vehículo</p>
            <PhotoGrid photos={orden.fotosRecepcion || orden.recepcion?.fotos || []} />
          </div>
        ) : null}

        {/* Vehicle info from reception */}
        {orden.recepcion && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 grid grid-cols-3 gap-2 text-xs text-gray-600">
            <div><span className="font-medium text-gray-500">KM:</span> {orden.recepcion.kilometraje}</div>
            <div><span className="font-medium text-gray-500">Combustible:</span> {['E','¼','½','¾','F'][orden.recepcion.nivelCombustible]}</div>
            <div><span className="font-medium text-gray-500">Aceite:</span> <span className={orden.recepcion.aceite === 'bueno' ? 'text-green-600' : 'text-red-600'}>{orden.recepcion.aceite}</span></div>
            <div className="col-span-3"><span className="font-medium text-gray-500">Daños preexistentes:</span> {orden.recepcion.dañosPreexistentes || 'Ninguno'}</div>
          </div>
        )}

        {/* Section 1: Diagnosis */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-violet-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</div>
            <p className="text-sm font-semibold text-gray-800">Diagnóstico técnico *</p>
          </div>
          <textarea value={diagnostico} onChange={e => setDiagnostico(e.target.value)} rows={4}
            placeholder="Describe detalladamente los hallazgos técnicos:&#10;• Qué se encontró al revisar el vehículo&#10;• Estado de los componentes principales&#10;• Causa raíz del problema reportado por el cliente"
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500" />
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</div>
            <p className="text-sm font-semibold text-gray-800">Fallas adicionales encontradas</p>
          </div>
          <textarea value={fallasAdicionales} onChange={e => setFallasAdicionales(e.target.value)} rows={2}
            placeholder="Otros problemas detectados además del motivo de ingreso..."
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400" />
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</div>
            <p className="text-sm font-semibold text-gray-800">Recomendaciones técnicas</p>
          </div>
          <textarea value={recomendaciones} onChange={e => setRecomendaciones(e.target.value)} rows={2}
            placeholder="Trabajos recomendados, mantenimientos futuros, observaciones importantes para el cliente..."
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        {/* Section 4: Auto-quote */}
        <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
              <p className="text-sm font-semibold text-gray-800">Cotización automática</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Total c/IVA</p>
              <p className="text-lg font-bold text-gray-900">${totalConIVA.toFixed(2)}</p>
            </div>
          </div>

          {lineas.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-4">Sin ítems aún — agrega repuestos o servicios</p>
          ) : (
            <>
              {lineas.map(l => (
                <div key={l.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${l.tipo === 'repuesto' ? 'bg-blue-100 text-blue-700' : l.tipo === 'diagnostico' ? 'bg-violet-100 text-violet-700' : 'bg-orange-100 text-orange-700'}`}>
                    {l.tipo === 'mano_de_obra' ? 'M.O.' : l.tipo === 'diagnostico' ? 'Diag.' : 'Rep.'}
                  </span>
                  <span className="flex-1 text-sm text-gray-700">{l.descripcion}</span>
                  <span className="text-xs text-gray-400">×{l.cantidad} @ ${l.precioUnitario}</span>
                  <span className="text-sm font-semibold text-gray-800">${(l.cantidad * l.precioUnitario).toFixed(2)}</span>
                  <button onClick={() => setLineas(prev => prev.filter(x => x.id !== l.id))} className="text-gray-300 hover:text-red-500"><X size={13} /></button>
                </div>
              ))}
              <div className="px-4 py-2.5 bg-gray-50 space-y-1">
                <div className="flex justify-between text-xs text-gray-500"><span>Subtotal</span><span>${total.toFixed(2)}</span></div>
                <div className="flex justify-between text-xs text-gray-500"><span>IVA 12%</span><span>${(total * 0.12).toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-gray-800"><span>TOTAL</span><span>${totalConIVA.toFixed(2)}</span></div>
              </div>
            </>
          )}
        </div>

        {/* Agregar línea */}
        <div className="border border-dashed border-gray-300 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-600">+ Agregar ítem a la cotización</p>
          <select value={tipoLinea} onChange={e => { setTipoLinea(e.target.value as any); setRepuestoId(''); setDescLinea(''); setPrecioLinea(0); }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="repuesto">🔩 Repuesto del inventario</option>
            <option value="mano_de_obra">🔧 Mano de Obra</option>
            <option value="diagnostico">🔍 Diagnóstico / Revisión</option>
          </select>

          {tipoLinea === 'repuesto' ? (
            <select value={repuestoId} onChange={e => {
              const rep = repuestos.find(r => r.id === e.target.value);
              if (rep) { setRepuestoId(rep.id); setDescLinea(rep.nombre); setPrecioLinea(rep.precio); }
              else { setRepuestoId(''); setDescLinea(''); setPrecioLinea(0); }
            }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Seleccionar del inventario...</option>
              {repuestos.filter(r => (r.cantidad - r.cantidadReservada) > 0).map(r => (
                <option key={r.id} value={r.id}>{r.nombre} — Disp: {r.cantidad - r.cantidadReservada} — ${r.precio.toFixed(2)}/u</option>
              ))}
            </select>
          ) : (
            <input value={descLinea} onChange={e => setDescLinea(e.target.value)} placeholder="Descripción del servicio"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Cantidad</label>
              <input type="number" value={cantLinea} onChange={e => setCantLinea(Number(e.target.value))} min={0.5} step={0.5}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Precio unitario ($)</label>
              <input type="number" value={precioLinea} onChange={e => setPrecioLinea(Number(e.target.value))}
                min={0} step={0.01} readOnly={tipoLinea === 'repuesto' && !!repuestoId}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${tipoLinea === 'repuesto' && repuestoId ? 'bg-gray-50' : ''}`} />
            </div>
          </div>

          {descLinea && precioLinea > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex justify-between text-sm">
              <span className="text-blue-700">{descLinea} × {cantLinea}</span>
              <span className="font-bold text-blue-800">${(cantLinea * precioLinea).toFixed(2)}</span>
            </div>
          )}
          <button onClick={addLinea} className="w-full py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-700 flex items-center justify-center gap-1">
            <Plus size={13} /> Agregar a cotización
          </button>
        </div>

        <button onClick={handleEnviar}
          className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${diagnostico.trim() && lineas.length > 0 ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
          Enviar Cotización al Cliente — ${totalConIVA.toFixed(2)} c/IVA →
        </button>
      </div>
    </div>
  );
}

// ─── Panel: Aprobación de Cotización (SOLO CLIENTE) ──────────────────────────

function PanelAprobacion({ orden, totalCot, onAprobar, onRechazar }: {
  orden: OrdenTrabajo; totalCot: number;
  onAprobar: () => void; onRechazar: () => void;
}) {
  const cot = orden.cotizacion!;
  const [decision, setDecision] = useState<'aprobar' | 'rechazar' | null>(null);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="space-y-4">
      {/* Hero alert */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <FileText size={22} className="text-white" />
          </div>
          <div>
            <p className="text-blue-200 text-xs font-medium uppercase tracking-wider mb-0.5">Acción requerida</p>
            <h3 className="font-bold text-xl leading-tight">¡Tu cotización está lista!</h3>
            <p className="text-blue-100 text-sm mt-1">
              Revisa el presupuesto y decide si continuar con la reparación de tu vehículo.
            </p>
          </div>
        </div>
      </div>

      {/* Mechanic diagnosis */}
      {orden.diagnostico && (
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
          <p className="text-xs font-bold text-violet-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Wrench size={12} /> Diagnóstico del Técnico
          </p>
          <p className="text-sm text-gray-800">{orden.diagnostico}</p>
          {orden.fallasAdicionales && (
            <div className="mt-2 pt-2 border-t border-violet-200">
              <p className="text-xs font-semibold text-violet-600">Fallas adicionales:</p>
              <p className="text-xs text-gray-600 mt-0.5">{orden.fallasAdicionales}</p>
            </div>
          )}
        </div>
      )}

      {/* Quote */}
      <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <p className="text-sm font-bold text-gray-800">Presupuesto de Reparación</p>
          <p className="text-xs text-gray-400">Enviado: {cot.fechaEnvio || '—'}</p>
        </div>
        {cot.lineas.map(l => (
          <div key={l.id} className="flex justify-between items-start text-sm px-4 py-3 border-b border-gray-100 last:border-0">
            <div className="flex items-start gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 mt-0.5 ${l.tipo === 'repuesto' ? 'bg-blue-100 text-blue-700' : l.tipo === 'diagnostico' ? 'bg-violet-100 text-violet-700' : 'bg-orange-100 text-orange-700'}`}>
                {l.tipo === 'mano_de_obra' ? 'Mano de obra' : l.tipo === 'diagnostico' ? 'Diagnóstico' : 'Repuesto'}
              </span>
              <span className="text-gray-700">{l.descripcion}{l.cantidad > 1 ? ` (×${l.cantidad})` : ''}</span>
            </div>
            <span className="font-semibold text-gray-900 flex-shrink-0 ml-4">${(l.cantidad * l.precioUnitario).toFixed(2)}</span>
          </div>
        ))}
        <div className="px-4 py-3 bg-blue-50 space-y-1.5">
          <div className="flex justify-between text-xs text-gray-500"><span>Subtotal</span><span>${totalCot.toFixed(2)}</span></div>
          <div className="flex justify-between text-xs text-gray-500"><span>IVA (12%)</span><span>${(totalCot * 0.12).toFixed(2)}</span></div>
          <div className="flex justify-between font-bold text-blue-800 text-lg pt-1 border-t border-blue-200">
            <span>TOTAL</span><span>${(totalCot * 1.12).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Info rejection cost */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 flex items-start gap-2">
        <Info size={14} className="flex-shrink-0 mt-0.5" />
        <span>Si decides <strong>no aprobar</strong>, únicamente pagarás el servicio de diagnóstico: <strong>${cot.costoDiagnostico?.toFixed(2)}</strong>. Tu vehículo será devuelto sin reparar.</span>
      </div>

      {/* Decision */}
      {!decision && (
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setDecision('rechazar')}
            className="flex items-center justify-center gap-2 py-4 bg-white border-2 border-red-300 text-red-700 rounded-xl text-sm font-bold hover:bg-red-50 transition-all">
            <ThumbsDown size={16} /> No aprobar
          </button>
          <button onClick={() => setDecision('aprobar')}
            className="flex items-center justify-center gap-2 py-4 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-200">
            <ThumbsUp size={16} /> Aprobar reparación
          </button>
        </div>
      )}

      {/* Approval confirmation */}
      {decision === 'aprobar' && (
        <div className="border-2 border-green-400 bg-green-50 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle size={20} className="text-green-600" />
            <h4 className="font-bold text-green-800">Confirmar autorización</h4>
          </div>
          <p className="text-sm text-green-800">
            Autorizas al taller a realizar los trabajos de reparación por un total de <strong>${(totalCot * 1.12).toFixed(2)}</strong>.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setDecision(null)} className="flex-1 py-2.5 border border-gray-300 text-gray-600 rounded-xl text-sm hover:bg-gray-50">← Revisar</button>
            <button onClick={() => { setConfirming(true); onAprobar(); }} disabled={confirming}
              className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-1.5">
              {confirming ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <CheckCircle size={15} />}
              Sí, autorizo la reparación
            </button>
          </div>
        </div>
      )}

      {/* Reject confirmation */}
      {decision === 'rechazar' && (
        <div className="border-2 border-red-300 bg-red-50 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <ThumbsDown size={20} className="text-red-600" />
            <h4 className="font-bold text-red-800">Confirmar rechazo</h4>
          </div>
          <p className="text-sm text-red-800">
            Se cancelará la reparación. Pagarás únicamente el diagnóstico: <strong>${cot.costoDiagnostico?.toFixed(2)}</strong>. El taller procederá con la entrega de tu vehículo.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setDecision(null)} className="flex-1 py-2.5 border border-gray-300 text-gray-600 rounded-xl text-sm hover:bg-gray-50">← Volver</button>
            <button onClick={() => { setConfirming(true); onRechazar(); }} disabled={confirming}
              className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 disabled:opacity-60">
              Confirmar rechazo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Panel: Liquidación de Diagnóstico ───────────────────────────────────────

function PanelLiquidacion({ orden, catalogs, onPagar }: {
  orden: OrdenTrabajo; catalogs: ReturnType<typeof useApp>['catalogs'];
  onPagar: (metodoPago: string) => void;
}) {
  const [metodo, setMetodo] = useState('');
  const costo = orden.cotizacion?.costoDiagnostico || 30;

  return (
    <div className="border border-red-200 rounded-xl p-5 bg-red-50/20 space-y-4">
      <div className="flex items-center gap-2">
        <DollarSign size={16} className="text-red-600" />
        <h3 className="font-semibold text-red-800">Liquidación de Diagnóstico</h3>
      </div>
      <p className="text-sm text-red-700">El cliente rechazó la cotización de reparación. Se cobra únicamente el diagnóstico técnico realizado.</p>
      <div className="bg-white border border-red-200 rounded-xl p-4 flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-600">Servicio de Diagnóstico Técnico</p>
          <p className="text-xs text-gray-400">Inspección del vehículo</p>
        </div>
        <p className="text-2xl font-bold text-red-700">${costo.toFixed(2)}</p>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">Método de pago</label>
        <div className="grid grid-cols-2 gap-2">
          {catalogs.metodosPago.map(m => (
            <button key={m} onClick={() => setMetodo(m)}
              className={`py-2 px-3 rounded-lg border text-sm transition-all ${metodo === m ? 'bg-red-600 border-red-600 text-white' : 'border-gray-300 text-gray-700 hover:border-red-300'}`}>
              {m}
            </button>
          ))}
        </div>
      </div>
      {metodo && (
        <div className="bg-red-100 border border-red-300 rounded-lg p-3 flex justify-between text-sm">
          <span className="text-red-800 font-medium">Total a cobrar</span>
          <span className="font-bold text-red-800">${(costo * 1.12).toFixed(2)} (c/IVA)</span>
        </div>
      )}
      <button onClick={() => { if (!metodo) { toast.error('Selecciona método de pago'); return; } onPagar(metodo); }}
        disabled={!metodo}
        className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${metodo ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
        Registrar Pago y Cerrar OT →
      </button>
    </div>
  );
}

// ─── Panel: Reparación (Mecánico) ─────────────────────────────────────────────

function PanelReparacion({ orden, repuestos, registrarSalidaRepuesto, onGuardar, onEnviarQC }: {
  orden: OrdenTrabajo;
  repuestos: ReturnType<typeof useApp>['repuestos'];
  registrarSalidaRepuesto: ReturnType<typeof useApp>['registrarSalidaRepuesto'];
  onGuardar: (r: string, ru: RepuestoUsado[], fotos: string[]) => void;
  onEnviarQC: (r: string, ru: RepuestoUsado[], fotos: string[]) => void;
}) {
  const [reparacion, setReparacion] = useState(orden.reparacion || '');
  const [repuestosUsados, setRepuestosUsados] = useState<RepuestoUsado[]>(orden.repuestosUsados || []);
  const [fotos, setFotos] = useState<string[]>(orden.fotosReparacion || []);
  const [addRepId, setAddRepId] = useState('');
  const [addRepCant, setAddRepCant] = useState(1);
  const fotoRef = useRef<HTMLInputElement>(null);

  // QC rejection observations visible to mechanic
  const qcRechazado = orden.controlCalidad && !orden.controlCalidad.aprobado && orden.controlCalidad.observaciones;

  const handleAddRep = () => {
    const rep = repuestos.find(r => r.id === addRepId);
    if (!rep) return;
    if (addRepCant > rep.cantidad) { toast.error(`Stock insuficiente: ${rep.cantidad} disponibles`); return; }
    const ok = registrarSalidaRepuesto(addRepId, addRepCant, orden.id);
    if (!ok) { toast.error('Error al registrar salida'); return; }
    setRepuestosUsados(prev => {
      const ex = prev.find(r => r.repuestoId === addRepId);
      return ex ? prev.map(r => r.repuestoId === addRepId ? { ...r, cantidad: r.cantidad + addRepCant } : r)
        : [...prev, { repuestoId: addRepId, nombre: rep.nombre, cantidad: addRepCant, precio: rep.precio }];
    });
    setAddRepId(''); setAddRepCant(1);
    toast.success(`${rep.nombre} registrado`);
  };

  return (
    <div className="space-y-4">
      {qcRechazado && (
        <div className="border border-red-300 rounded-xl p-4 bg-red-50">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={15} className="text-red-600" />
            <p className="text-sm font-bold text-red-800">Observaciones del Jefe de Taller (QC Rechazado)</p>
          </div>
          <p className="text-sm text-red-700">{orden.controlCalidad?.observaciones}</p>
          <p className="text-xs text-red-500 mt-1">Corrige estas observaciones y vuelve a enviar a Control de Calidad</p>
        </div>
      )}

      <div className="border border-orange-200 rounded-xl p-5 bg-orange-50/20 space-y-4">
        <div className="flex items-center gap-2">
          <Wrench size={16} className="text-orange-600" />
          <h3 className="font-semibold text-orange-800">Paso 4: Reparación del Vehículo</h3>
        </div>

        {/* Parts from approved quote */}
        {orden.cotizacion?.lineas.filter(l => l.tipo === 'repuesto').length ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-blue-700 mb-2">Repuestos aprobados en cotización:</p>
            {orden.cotizacion.lineas.filter(l => l.tipo === 'repuesto').map(l => (
              <div key={l.id} className="flex justify-between text-xs text-blue-700">
                <span>{l.descripcion}</span><span>× {l.cantidad}</span>
              </div>
            ))}
          </div>
        ) : null}

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Descripción de trabajos realizados *</label>
          <textarea value={reparacion} onChange={e => setReparacion(e.target.value)} rows={4}
            placeholder="Describe detalladamente cada trabajo realizado, piezas cambiadas, procedimientos..."
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400" />
        </div>

        {/* Register used parts */}
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-2">Registrar repuestos utilizados</p>
          {repuestosUsados.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden mb-2">
              {repuestosUsados.map(r => (
                <div key={r.repuestoId} className="flex justify-between text-sm px-4 py-2.5 border-b border-gray-100 last:border-0">
                  <span className="text-gray-700">{r.nombre}</span>
                  <span className="text-gray-500">× {r.cantidad} — ${(r.cantidad * r.precio).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <select value={addRepId} onChange={e => setAddRepId(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
              <option value="">Seleccionar repuesto...</option>
              {repuestos.map(r => <option key={r.id} value={r.id}>{r.nombre} (Stock: {r.cantidad}) — ${r.precio}</option>)}
            </select>
            <input type="number" value={addRepCant} onChange={e => setAddRepCant(Number(e.target.value))} min={1}
              className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-orange-400" />
            <button onClick={handleAddRep} className="px-3 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-800">+</button>
          </div>
        </div>

        {/* Fotos OBLIGATORIAS */}
        <div className="border-2 border-dashed border-orange-300 rounded-xl p-4 bg-orange-50/30">
          <div className="flex items-center gap-2 mb-2">
            <Camera size={15} className="text-orange-600" />
            <p className="text-sm font-semibold text-orange-700">📸 Fotos de la reparación <span className="font-bold text-orange-500">*Obligatorio</span></p>
          </div>
          <p className="text-xs text-orange-600 mb-3">Fotografía: piezas antes de cambiar, proceso de reparación y resultado final.</p>
          {fotos.length > 0 && <div className="mb-3"><PhotoGrid photos={fotos} onRemove={i => setFotos(prev => prev.filter((_, j) => j !== i))} /></div>}
          <UploadBtn label="Agregar fotos de la reparación" inputRef={fotoRef}
            onChange={async e => { const nuevas = await readFilesAsBase64(e.target.files); setFotos(prev => [...prev, ...nuevas]); }}
            count={fotos.length} />
        </div>

        <div className="flex gap-3">
          <button onClick={() => onGuardar(reparacion, repuestosUsados, fotos)}
            className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm hover:bg-gray-50 font-medium">
            Guardar Progreso
          </button>
          <button onClick={() => {
            if (!reparacion.trim()) { toast.error('Describe los trabajos realizados'); return; }
            if (fotos.length === 0) { toast.error('Las fotos de reparación son obligatorias'); return; }
            onEnviarQC(reparacion, repuestosUsados, fotos);
          }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${reparacion.trim() && fotos.length > 0 ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
            Enviar a Control Calidad →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Panel: Control de Calidad (Jefe) ────────────────────────────────────────

function PanelControlCalidad({ orden, onAprobar, onRechazar }: {
  orden: OrdenTrabajo;
  onAprobar: (qc: ControlCalidad) => void;
  onRechazar: (qc: ControlCalidad) => void;
}) {
  const [pruebaRuta, setPruebaRuta] = useState(false);
  const [observaciones, setObservaciones] = useState('');

  return (
    <div className="border border-purple-200 rounded-xl p-5 bg-purple-50/20 space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck size={16} className="text-purple-600" />
        <h3 className="font-semibold text-purple-800">Paso 5: Control de Calidad</h3>
      </div>

      {/* Mechanic's photos */}
      {orden.fotosReparacion?.length ? (
        <div>
          <p className="text-xs font-medium text-gray-600 mb-1.5">📸 Fotos del mecánico ({orden.fotosReparacion.length})</p>
          <PhotoGrid photos={orden.fotosReparacion} />
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
          ⚠️ El mecánico no subió fotos de la reparación
        </div>
      )}

      {/* Mechanic's report */}
      {orden.reparacion && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-gray-600 mb-1">Informe del Mecánico:</p>
          <p className="text-sm text-gray-700">{orden.reparacion}</p>
        </div>
      )}

      {/* Parts used */}
      {orden.repuestosUsados?.length ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-blue-700 mb-1">Repuestos utilizados:</p>
          {orden.repuestosUsados.map(r => (
            <div key={r.repuestoId} className="flex justify-between text-xs text-blue-700">
              <span>{r.nombre}</span><span>× {r.cantidad} — ${(r.cantidad * r.precio).toFixed(2)}</span>
            </div>
          ))}
        </div>
      ) : null}

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={pruebaRuta} onChange={e => setPruebaRuta(e.target.checked)} className="w-4 h-4 rounded" />
        <span className="text-sm text-gray-700">Prueba de ruta realizada satisfactoriamente</span>
      </label>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">Observaciones del Inspector</label>
        <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} rows={3}
          placeholder="Documenta observaciones, correcciones, estado general del vehículo..."
          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => onAprobar({ aprobado: true, observaciones, pruebaRuta })}
          className="flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700">
          <ShieldCheck size={15} /> Aprobar — Liberar
        </button>
        <button onClick={() => {
          if (!observaciones.trim()) { toast.error('Escribe las observaciones para que el mecánico las corrija'); return; }
          onRechazar({ aprobado: false, observaciones, pruebaRuta });
        }}
          className="flex items-center justify-center gap-2 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700">
          <X size={15} /> Rechazar — Con obs.
        </button>
      </div>
    </div>
  );
}

// ─── Panel: Entrega y Cobro (Asesor) ─────────────────────────────────────────
// Detecta si el cliente ya pagó en línea y adapta el flujo:
//   - Pagado online → solo confirmar entrega física
//   - Sin pago → proceso completo con Efectivo / Transferencia / QR

function PanelEntrega({ orden, totalCot, onEntregar }: {
  orden: OrdenTrabajo;
  totalCot: number;
  onEntregar: (metodo: string, notas: string) => void;
}) {
  const totalConIVA = totalCot * 1.12;
  const pagadoOnline = !!orden.pagadoEnLinea;

  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'transferencia' | 'qr' | 'tarjeta' | ''>(
    pagadoOnline ? 'transferencia' : ''
  );
  const [montoRecibido, setMontoRecibido] = useState('');
  const [referencia, setReferencia] = useState('');
  const [notas, setNotas] = useState('');
  const [confirmado, setConfirmado] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [pagoQRConfirmado, setPagoQRConfirmado] = useState(false);

  const cambio = metodoPago === 'efectivo' && montoRecibido
    ? Math.max(0, parseFloat(montoRecibido) - totalConIVA)
    : 0;
  const montoInsuficiente = metodoPago === 'efectivo' && montoRecibido && parseFloat(montoRecibido) < totalConIVA;

  const puedeConfirmar = confirmado && (
    pagadoOnline ||
    metodoPago === 'efectivo' && montoRecibido && !montoInsuficiente ||
    metodoPago === 'transferencia' && referencia.trim() ||
    metodoPago === 'qr' && pagoQRConfirmado ||
    metodoPago === 'tarjeta' && referencia.trim()
  );

  const metodoFinal = pagadoOnline ? (orden.metodoPagoFinal || 'Pago en línea') : (
    metodoPago === 'efectivo' ? 'Efectivo' :
    metodoPago === 'transferencia' ? 'Transferencia bancaria' :
    metodoPago === 'qr' ? 'QR / Pago digital' :
    metodoPago === 'tarjeta' ? 'Tarjeta' : ''
  );

  return (
    <div className="space-y-4">

      {/* Resumen de factura */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Detalle del servicio</p>
        </div>
        {orden.cotizacion?.lineas.map(l => (
          <div key={l.id} className="flex justify-between text-sm px-4 py-2 border-b border-slate-50 last:border-0">
            <span className="text-slate-600">{l.descripcion} × {l.cantidad}</span>
            <span className="font-medium">${(l.cantidad * l.precioUnitario).toFixed(2)}</span>
          </div>
        ))}
        <div className="px-4 py-3 bg-slate-50 space-y-1">
          <div className="flex justify-between text-xs text-slate-500"><span>Subtotal</span><span>${totalCot.toFixed(2)}</span></div>
          <div className="flex justify-between text-xs text-slate-500"><span>IVA 12%</span><span>${(totalCot * 0.12).toFixed(2)}</span></div>
          <div className="flex justify-between font-bold text-lg text-slate-800"><span>TOTAL</span><span>${totalConIVA.toFixed(2)}</span></div>
        </div>
      </div>

      {/* ── FLUJO A: Cliente ya pagó en línea ── */}
      {pagadoOnline ? (
        <div className="space-y-3">
          <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <CheckCircle size={20} className="text-white"/>
            </div>
            <div>
              <p className="font-bold text-emerald-800">✅ Pago ya confirmado en línea</p>
              <p className="text-sm text-emerald-700 mt-0.5">El cliente pagó ${totalConIVA.toFixed(2)} a través de su portal. Factura ya generada: <strong>{orden.facturaId}</strong></p>
              <p className="text-xs text-emerald-600 mt-1">Método: {orden.metodoPagoFinal || 'Portal del cliente'}</p>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700 flex items-center gap-2">
            <Info size={12} className="flex-shrink-0"/>
            Solo necesitas confirmar la entrega física del vehículo al cliente.
          </div>
        </div>
      ) : (
        /* ── FLUJO B: Registrar pago físico ── */
        <div className="space-y-4">
          <div>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">Método de pago *</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: 'efectivo', label: '💵 Efectivo', desc: 'Cobro en caja' },
                { val: 'transferencia', label: '🏦 Transferencia', desc: 'Cta. bancaria' },
                { val: 'qr', label: '📱 QR / Digital', desc: 'Escanea el código' },
                { val: 'tarjeta', label: '💳 Tarjeta', desc: 'Crédito / Débito' },
              ].map(m => (
                <button key={m.val} onClick={() => { setMetodoPago(m.val as any); setShowQR(m.val === 'qr'); }}
                  className={`flex flex-col items-start px-3.5 py-3 rounded-xl border-2 text-left transition-all ${metodoPago === m.val ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-200 text-slate-700 hover:border-slate-400 bg-white'}`}>
                  <span className="font-bold text-sm">{m.label}</span>
                  <span className={`text-xs mt-0.5 ${metodoPago === m.val ? 'text-slate-300' : 'text-slate-400'}`}>{m.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Efectivo: monto y cambio */}
          {metodoPago === 'efectivo' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
              <p className="text-xs font-bold text-amber-700">Total a cobrar: <span className="text-2xl font-bold text-amber-800">${totalConIVA.toFixed(2)}</span></p>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Monto recibido del cliente</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                  <input type="number" value={montoRecibido} onChange={e => setMontoRecibido(e.target.value)}
                    placeholder="0.00" step="0.01" min="0"
                    className={`w-full pl-8 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 font-mono text-lg ${montoInsuficiente ? 'border-red-400 focus:ring-red-300 bg-red-50' : 'border-slate-300 focus:ring-slate-500'}`}/>
                </div>
                {montoInsuficiente && <p className="text-xs text-red-600 mt-1 font-medium">⚠️ Monto insuficiente — faltan ${(totalConIVA - parseFloat(montoRecibido)).toFixed(2)}</p>}
              </div>
              {montoRecibido && !montoInsuficiente && (
                <div className={`rounded-xl p-3 flex justify-between items-center ${cambio > 0 ? 'bg-green-100 border border-green-300' : 'bg-slate-100 border border-slate-200'}`}>
                  <span className={`text-sm font-bold ${cambio > 0 ? 'text-green-800' : 'text-slate-600'}`}>Cambio a entregar</span>
                  <span className={`text-2xl font-bold ${cambio > 0 ? 'text-green-700' : 'text-slate-500'}`}>${cambio.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {/* Transferencia bancaria */}
          {metodoPago === 'transferencia' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
              <div className="bg-white border border-blue-100 rounded-lg p-3 text-sm space-y-1.5">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">Datos bancarios del taller</p>
                <div className="flex justify-between"><span className="text-slate-500">Banco:</span><span className="font-bold text-slate-800">Banco Pichincha</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Cuenta:</span><span className="font-mono font-bold text-slate-800">2200987654</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Tipo:</span><span className="font-bold text-slate-800">Ahorros</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Titular:</span><span className="font-bold text-slate-800">TallerPro S.A.</span></div>
                <div className="flex justify-between"><span className="text-slate-500">RUC:</span><span className="font-mono font-bold text-slate-800">1791234560001</span></div>
                <div className="flex justify-between border-t border-blue-100 pt-2"><span className="text-slate-500">Monto exacto:</span><span className="font-bold text-blue-700 text-base">${totalConIVA.toFixed(2)}</span></div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Número de comprobante / referencia *</label>
                <input value={referencia} onChange={e => setReferencia(e.target.value)} placeholder="Ej: COMP-20260401-001"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"/>
              </div>
            </div>
          )}

          {/* QR */}
          {metodoPago === 'qr' && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex flex-col items-center py-2">
                {/* QR code mockup */}
                <div className="w-48 h-48 bg-white border-4 border-slate-800 rounded-2xl p-3 mb-3">
                  <div className="w-full h-full grid grid-cols-7 gap-0.5">
                    {Array.from({ length: 49 }, (_, i) => {
                      const pattern = [0,1,1,0,1,0,0, 1,0,1,1,0,1,0, 1,1,0,0,1,1,1, 0,1,0,1,0,1,0, 1,0,1,1,0,0,1, 0,1,0,1,1,0,1, 1,0,0,0,1,1,0];
                      return <div key={i} className={`rounded-sm ${pattern[i] ? 'bg-slate-800' : 'bg-white'}`}/>;
                    })}
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-800">Escanea para pagar</p>
                  <p className="text-2xl font-bold text-slate-800 mt-0.5">${totalConIVA.toFixed(2)}</p>
                  <p className="text-xs text-slate-500 mt-0.5">TallerPro · OT: {orden.numero}</p>
                </div>
              </div>
              {!pagoQRConfirmado ? (
                <button onClick={() => setPagoQRConfirmado(true)}
                  className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-700">
                  ✅ Confirmar que el cliente escaneó y pagó
                </button>
              ) : (
                <div className="bg-green-100 border border-green-300 rounded-xl px-4 py-3 flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600"/>
                  <p className="font-bold text-green-700 text-sm">Pago QR confirmado — ${totalConIVA.toFixed(2)}</p>
                </div>
              )}
            </div>
          )}

          {/* Tarjeta */}
          {metodoPago === 'tarjeta' && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
              <p className="text-sm text-purple-700">Procesa el pago en el terminal POS y luego ingresa la referencia.</p>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Número de autorización / referencia *</label>
                <input value={referencia} onChange={e => setReferencia(e.target.value)} placeholder="Ej: AUTH-789456"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"/>
              </div>
              <div className="bg-white border border-purple-100 rounded-lg px-3 py-2 flex justify-between text-sm">
                <span className="text-slate-500">Total cobrado</span>
                <span className="font-bold text-purple-700">${totalConIVA.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notas de entrega */}
      <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2}
        placeholder="Notas de entrega: condición del vehículo al salir, recomendaciones al cliente..."
        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500" />

      {/* Confirmación de recepción */}
      <label className="flex items-center gap-3 cursor-pointer p-3.5 rounded-xl border-2 border-dashed border-green-300 hover:bg-green-50 transition-colors">
        <input type="checkbox" checked={confirmado} onChange={e => setConfirmado(e.target.checked)} className="w-4 h-4 rounded accent-emerald-600 flex-shrink-0"/>
        <div>
          <p className="text-sm font-semibold text-slate-800">Cliente confirma recepción del vehículo en conformidad</p>
          <p className="text-xs text-slate-400">Equivale a firma digital de entrega — {pagadoOnline ? 'pago ya procesado' : `$${totalConIVA.toFixed(2)} cobrado`}</p>
        </div>
      </label>

      <button onClick={() => {
        if (!pagadoOnline) {
          if (!metodoPago) { toast.error('Selecciona el método de pago'); return; }
          if (metodoPago === 'efectivo' && !montoRecibido) { toast.error('Ingresa el monto recibido'); return; }
          if (montoInsuficiente) { toast.error('El monto recibido no cubre el total'); return; }
          if ((metodoPago === 'transferencia' || metodoPago === 'tarjeta') && !referencia.trim()) { toast.error('Ingresa el número de referencia/comprobante'); return; }
          if (metodoPago === 'qr' && !pagoQRConfirmado) { toast.error('Confirma que el cliente realizó el pago por QR'); return; }
        }
        if (!confirmado) { toast.error('El cliente debe confirmar la recepción del vehículo'); return; }
        onEntregar(metodoFinal, notas);
      }}
        disabled={!puedeConfirmar}
        className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${puedeConfirmar ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-100' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
        <CheckCircle size={16}/>
        {pagadoOnline ? '✅ Confirmar entrega del vehículo' : `✅ Registrar pago ${metodoFinal ? `(${metodoFinal})` : ''} y entregar vehículo`}
      </button>
    </div>
  );
}

// ─── Panel: Pago Online del Cliente ──────────────────────────────────────────

function PanelPagoCliente({ totalCot, catalogs, onPagar }: {
  totalCot: number; catalogs: ReturnType<typeof useApp>['catalogs'];
  onPagar: (metodo: string) => void;
}) {
  const [metodo, setMetodo] = useState('');
  return (
    <div className="border border-green-200 rounded-xl p-5 bg-green-50/20 space-y-4">
      <div className="flex items-center gap-2">
        <CreditCard size={16} className="text-green-600" />
        <h3 className="font-semibold text-green-800">💳 Tu vehículo está listo — Realiza el pago</h3>
      </div>
      <div className="bg-white border border-green-200 rounded-xl p-4 flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-600">Servicio de reparación completo</p>
          <p className="text-xs text-gray-400">Subtotal ${totalCot.toFixed(2)} + IVA 12%</p>
        </div>
        <p className="text-2xl font-bold text-green-700">${(totalCot * 1.12).toFixed(2)}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {catalogs.metodosPago.map(m => (
          <button key={m} onClick={() => setMetodo(m)}
            className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-all ${metodo === m ? 'bg-green-600 border-green-600 text-white' : 'border-gray-300 text-gray-700 hover:border-green-400'}`}>
            {m === 'Efectivo' ? '💵' : m.includes('crédito') ? '💳' : m.includes('débito') ? '🏧' : m.includes('banco') ? '🏦' : '🧾'} {m}
          </button>
        ))}
      </div>
      <button onClick={() => { if (!metodo) { toast.error('Selecciona método de pago'); return; } onPagar(metodo); }}
        disabled={!metodo}
        className={`w-full py-3.5 rounded-xl text-base font-bold transition-all ${metodo ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
        Confirmar Pago — ${(totalCot * 1.12).toFixed(2)}
      </button>
      <p className="text-xs text-center text-gray-500">Al confirmar, el asesor recibirá notificación para coordinarte la entrega.</p>
    </div>
  );
}

// ─── Panel: Resumen Final ─────────────────────────────────────────────────────

function PanelResumen({ orden, totalCot }: { orden: OrdenTrabajo; totalCot: number }) {
  return (
    <div className="border border-gray-200 rounded-xl p-5 bg-gray-50 space-y-3">
      <div className="flex items-center gap-2">
        <CheckCircle size={18} className="text-green-500" />
        <h3 className="font-semibold text-green-700">OT Finalizada</h3>
        {orden.facturaId && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">{orden.facturaId}</span>}
      </div>
      {orden.reparacion && (
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <p className="text-xs font-medium text-gray-500 mb-1">Trabajo realizado:</p>
          <p className="text-sm text-gray-700">{orden.reparacion}</p>
        </div>
      )}
      {totalCot > 0 && (
        <div className="flex justify-between text-sm font-bold text-gray-800 bg-white border border-gray-200 rounded-lg p-3">
          <span>Total cobrado</span><span>${(totalCot * 1.12).toFixed(2)}</span>
        </div>
      )}
      {orden.notasEntrega && <p className="text-xs text-gray-500">Notas: {orden.notasEntrega}</p>}
    </div>
  );
}

// ─── Info General (siempre visible) ──────────────────────────────────────────

function InfoGeneral({ orden, usuarios }: { orden: OrdenTrabajo; usuarios: ReturnType<typeof useApp>['usuarios'] }) {
  const mec = usuarios.find(u => u.id === orden.mecanicoId);
  const jefe = usuarios.find(u => u.id === orden.jefeAsignadoId);
  const fotosRec = orden.fotosRecepcion || orden.recepcion?.fotos;

  return (
    <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/60 space-y-3 mt-2">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Información de la OT</p>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <InfoField label="Creada" value={orden.fechaCreacion} />
        <InfoField label="Actualizada" value={orden.fechaActualizacion} />
        <InfoField label="Mecánico" value={mec?.nombre || <span className="text-red-400 italic text-xs">Sin asignar</span>} />
        <InfoField label="Jefe de Taller" value={jefe?.nombre || '—'} />
      </div>
      {orden.recepcion && (
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 bg-white border border-gray-200 rounded-lg p-3">
          <span>KM ingreso: <strong className="text-gray-700">{orden.recepcion.kilometraje}</strong></span>
          <span>Combustible: <strong className="text-gray-700">{['E','¼','½','¾','F'][orden.recepcion.nivelCombustible]}</strong></span>
          <span className="col-span-2">Daños: <strong className="text-gray-700">{orden.recepcion.dañosPreexistentes || 'Ninguno'}</strong></span>
        </div>
      )}
      {fotosRec?.length ? (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1.5">Fotos de ingreso</p>
          <PhotoGrid photos={fotosRec} />
        </div>
      ) : null}
      {orden.fotosReparacion?.length ? (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1.5">Fotos de reparación</p>
          <PhotoGrid photos={orden.fotosReparacion} />
        </div>
      ) : null}
    </div>
  );
}
