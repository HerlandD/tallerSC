import React, { useState, useRef } from 'react';
import {
  Plus, Search, CalendarDays, X, Clock, CheckCircle, XCircle,
  Pencil, ArrowRight, Bell, Car, User, FileText,
  ClipboardList, Send, Camera, AlertCircle, Loader2,
  Fuel, Droplet, Disc, Package, ChevronLeft, CheckSquare
} from 'lucide-react';
import { useApp, Cita, EstadoCita, RecepcionVehiculo } from '../context/AppContext';
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

const estadoCitaConfig: Record<EstadoCita, { label: string; color: string; bg: string; dot: string }> = {
  pendiente:   { label: 'Pendiente',  color: 'text-amber-700', bg: 'bg-amber-100',  dot: 'bg-amber-400' },
  confirmada:  { label: 'Confirmada', color: 'text-green-700', bg: 'bg-green-100',  dot: 'bg-green-500' },
  en_progreso: { label: 'En Proceso', color: 'text-blue-700',  bg: 'bg-blue-100',   dot: 'bg-blue-500' },
  completada:  { label: 'Completada', color: 'text-gray-600',  bg: 'bg-gray-100',   dot: 'bg-gray-400' },
  cancelada:   { label: 'Cancelada',  color: 'text-red-700',   bg: 'bg-red-100',    dot: 'bg-red-400' },
  reprogramada: { label: 'Reprogramada', color: 'text-purple-700', bg: 'bg-purple-100', dot: 'bg-purple-500' },
};

const HORAS = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'];

// ─── Photo Grid ──────────────────────────────────────────────────────────────

function PhotoGrid({ photos, onRemove }: { photos: string[]; onRemove?: (i: number) => void }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {photos.map((p, i) => (
        <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
          <img src={p} className="w-full h-full object-cover" alt={`foto-${i}`} />
          {onRemove && (
            <button onClick={() => onRemove(i)}
              className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Reception Wizard Modal (Cita → OT) ──────────────────────────────────────

function ModalRecepcionCita({
  cita,
  onClose,
  onCrearOT,
}: {
  cita: Cita;
  onClose: () => void;
  onCrearOT: (recepcion: RecepcionVehiculo, descripcion: string, fotos: string[]) => void;
}) {
  const { clientes, vehiculos } = useApp();
  const cli = clientes.find(c => c.id === cita.clienteId);
  const veh = vehiculos.find(v => v.id === cita.vehiculoId);

  const [paso, setPaso] = useState<1 | 2 | 3 | 4>(1);

  // Recepcion form
  const [km, setKm] = useState(veh?.kilometraje ? String(veh.kilometraje) : '');
  const [combustible, setCombustible] = useState(3); // 0-5 scale
  const [aceite, setAceite] = useState<'bueno' | 'bajo' | 'malo'>('bueno');
  const [refrigerante, setRefrigerante] = useState<'bueno' | 'bajo' | 'malo'>('bueno');
  const [frenos, setFremos] = useState<'bueno' | 'bajo' | 'malo'>('bueno');
  const [daños, setDaños] = useState('');
  const [materiales, setMateriales] = useState(''); // items client brought
  const [materialItems, setMaterialItems] = useState<string[]>([]);
  const [nuevoMaterial, setNuevoMaterial] = useState('');
  const [descripcion, setDescripcion] = useState(
    [cita.tipoServicio, cita.motivoIngreso ? `Motivo: ${cita.motivoIngreso}` : '', cita.notas ? `Notas: ${cita.notas}` : ''].filter(Boolean).join(' — ')
  );
  const [fotos, setFotos] = useState<string[]>([]);
  const fotoRef = useRef<HTMLInputElement>(null);

  const condicionOpts: { val: 'bueno' | 'bajo' | 'malo'; label: string; color: string }[] = [
    { val: 'bueno', label: 'Bueno', color: 'bg-green-100 text-green-700 border-green-300' },
    { val: 'bajo',  label: 'Bajo',  color: 'bg-amber-100 text-amber-700 border-amber-300' },
    { val: 'malo',  label: 'Malo',  color: 'bg-red-100 text-red-700 border-red-300' },
  ];

  const combustiblePct = (combustible / 5) * 100;
  const combustibleColor = combustible <= 1 ? 'bg-red-500' : combustible <= 2 ? 'bg-amber-400' : 'bg-green-500';

  const addMaterial = () => {
    if (!nuevoMaterial.trim()) return;
    setMaterialItems(p => [...p, nuevoMaterial.trim()]);
    setNuevoMaterial('');
  };

  const handleCrear = () => {
    if (!descripcion.trim()) { toast.error('Agrega la descripción del problema'); return; }
    if (fotos.length === 0) { toast.error('Debes subir al menos 1 foto del vehículo'); return; }
    const recepcion: RecepcionVehiculo = {
      kilometraje: km,
      nivelCombustible: combustible,
      aceite, refrigerante, frenos,
      dañosPreexistentes: daños || 'Ninguno',
      inventario: materialItems.length > 0 ? materialItems.join(', ') : (materiales || 'Ninguno'),
      fotos,
    };
    onCrearOT(recepcion, descripcion, fotos);
  };

  const inCls = 'w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-6 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800 text-white">
          <div>
            <p className="text-slate-300 text-xs">Recepción de Vehículo → Crear OT</p>
            <h2 className="font-bold text-lg">{cli?.nombre} · {veh?.placa}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg"><X size={16}/></button>
        </div>

        {/* Progress */}
        <div className="flex items-center px-6 pt-4 pb-3 gap-0">
          {[
            { n: 1, label: 'Confirmar Llegada' },
            { n: 2, label: 'Inspección' },
            { n: 3, label: 'Materiales' },
            { n: 4, label: 'Fotos y Crear OT' },
          ].map((s, i) => (
            <React.Fragment key={s.n}>
              <div className="flex flex-col items-center flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${paso >= s.n ? 'bg-slate-800 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-400'}`}>
                  {paso > s.n ? <CheckCircle size={14}/> : s.n}
                </div>
                <p className={`text-xs mt-1 font-medium hidden sm:block ${paso >= s.n ? 'text-slate-800' : 'text-slate-400'}`}>{s.label}</p>
              </div>
              {i < 3 && <div className={`flex-1 h-0.5 mx-1 transition-all ${paso > s.n ? 'bg-slate-800' : 'bg-slate-200'}`}/>}
            </React.Fragment>
          ))}
        </div>

        <div className="px-6 pb-6">

          {/* ── PASO 1: Confirmar llegada ── */}
          {paso === 1 && (
            <div className="space-y-4 mt-2">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Datos de la cita</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"><User size={14} className="text-blue-600"/></div>
                    <div><p className="font-bold text-slate-800">{cli?.nombre}</p><p className="text-xs text-slate-500">CI: {cli?.ci} · {cli?.telefono}</p></div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center"><Car size={14} className="text-slate-600"/></div>
                    <div><p className="font-bold text-slate-800">{veh?.placa} — {veh?.marca} {veh?.modelo} {veh?.año}</p><p className="text-xs text-slate-500">Color: {veh?.color} · KM anterior: {veh?.kilometraje}</p></div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center"><CalendarDays size={14} className="text-green-600"/></div>
                    <div><p className="font-bold text-slate-800">{cita.fecha} a las {cita.hora}</p><p className="text-xs text-slate-500">{cita.tipoServicio} · {cita.motivoIngreso}</p></div>
                  </div>
                  {cita.notas && (
                    <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-700">
                      <span className="font-semibold">Notas del cliente: </span>{cita.notas}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Descripción del problema / problema reportado *</label>
                <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={4}
                  placeholder="Describe el problema tal como lo reporta el cliente: síntomas, ruidos, fallas, desde cuándo..."
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                <p className="text-xs text-slate-400 mt-1">Puedes editar y ampliar la descripción de la cita</p>
              </div>

              <button onClick={() => { if (!descripcion.trim()) { toast.error('Ingresa la descripción del problema'); return; } setPaso(2); }}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                Confirmar llegada → Inspección del vehículo <ArrowRight size={15}/>
              </button>
            </div>
          )}

          {/* ── PASO 2: Inspección ── */}
          {paso === 2 && (
            <div className="space-y-5 mt-2">
              <div className="grid grid-cols-2 gap-4">
                {/* Kilometraje */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1"><Car size={11}/> Kilometraje actual *</label>
                  <input value={km} onChange={e => setKm(e.target.value)} placeholder="Ej: 85,400 km"
                    className={inCls}/>
                </div>

                {/* Combustible */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1"><Fuel size={11}/> Nivel de combustible</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${combustibleColor}`} style={{ width: `${combustiblePct}%` }}/>
                    </div>
                    <span className="text-sm font-bold text-slate-700 w-5">{combustible}/5</span>
                  </div>
                  <input type="range" min={0} max={5} value={combustible} onChange={e => setCombustible(Number(e.target.value))} className="w-full mt-2 accent-slate-800"/>
                  <div className="flex justify-between text-xs text-slate-400 mt-0.5"><span>Vacío</span><span>Lleno</span></div>
                </div>
              </div>

              {/* Condición de fluidos y frenos */}
              <div className="space-y-3">
                {[
                  { label: 'Aceite de Motor', icon: <Droplet size={13}/>, val: aceite, set: setAceite },
                  { label: 'Refrigerante', icon: <Droplet size={13} className="text-blue-500"/>, val: refrigerante, set: setRefrigerante },
                  { label: 'Frenos', icon: <Disc size={13}/>, val: frenos, set: setFremos },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="w-32 flex items-center gap-1.5 text-xs font-semibold text-slate-600 flex-shrink-0">
                      {item.icon} {item.label}
                    </div>
                    <div className="flex gap-2 flex-1">
                      {condicionOpts.map(opt => (
                        <button key={opt.val} onClick={() => item.set(opt.val as any)}
                          className={`flex-1 py-1.5 px-2 rounded-lg border text-xs font-semibold transition-all ${item.val === opt.val ? opt.color + ' border-2' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Daños preexistentes */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Daños o condiciones preexistentes visibles</label>
                <textarea value={daños} onChange={e => setDaños(e.target.value)} rows={3}
                  placeholder="Rayones, abolladuras, roturas, manchas... Si no hay, escribe 'Ninguno'"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                <p className="text-xs text-slate-400 mt-0.5">Documenta todo daño preexistente para proteger al taller</p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setPaso(1)} className="flex items-center gap-1.5 px-5 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-sm hover:bg-slate-50">
                  <ChevronLeft size={14}/> Atrás
                </button>
                <button onClick={() => { if (!km.trim()) { toast.error('Ingresa el kilometraje'); return; } setPaso(3); }}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                  Continuar → Materiales <ArrowRight size={15}/>
                </button>
              </div>
            </div>
          )}

          {/* ── PASO 3: Materiales del cliente ── */}
          {paso === 3 && (
            <div className="space-y-5 mt-2">
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2 text-sm">
                <Package size={16} className="text-amber-600 flex-shrink-0 mt-0.5"/>
                <div>
                  <p className="font-bold text-amber-800">Inventario de materiales del cliente</p>
                  <p className="text-xs text-amber-700 mt-0.5">Registra TODOS los artículos que el cliente entrega junto con el vehículo: herramientas, llanta de repuesto, documentos, objetos personales, etc.</p>
                </div>
              </div>

              {/* Agregar ítems */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">Agregar ítem</label>
                <div className="flex gap-2">
                  <input value={nuevoMaterial} onChange={e => setNuevoMaterial(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addMaterial(); }}}
                    placeholder="Ej: Llanta de repuesto, gato hidráulico, documentos..." className={`flex-1 ${inCls}`}/>
                  <button onClick={addMaterial} className="px-4 py-2.5 bg-slate-800 text-white rounded-xl text-sm hover:bg-slate-700 font-medium flex-shrink-0">
                    + Agregar
                  </button>
                </div>
              </div>

              {/* Lista de ítems */}
              {materialItems.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">{materialItems.length} ítem{materialItems.length > 1 ? 's' : ''} registrado{materialItems.length > 1 ? 's' : ''}</p>
                  </div>
                  <ul className="divide-y divide-slate-100">
                    {materialItems.map((item, i) => (
                      <li key={i} className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-slate-50">
                        <div className="flex items-center gap-2.5">
                          <CheckSquare size={13} className="text-emerald-500"/>
                          <span className="text-slate-700">{item}</span>
                        </div>
                        <button onClick={() => setMaterialItems(p => p.filter((_, j) => j !== i))}
                          className="text-slate-300 hover:text-red-500 text-xs p-1"><X size={12}/></button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="border-2 border-dashed border-slate-200 rounded-xl py-8 text-center">
                  <Package size={28} className="mx-auto mb-2 text-slate-300"/>
                  <p className="text-sm text-slate-400 font-medium">Sin ítems registrados aún</p>
                  <p className="text-xs text-slate-300 mt-0.5">Agrega artículos o continúa si no hay materiales</p>
                </div>
              )}

              {/* Nota adicional */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Observaciones adicionales sobre el inventario</label>
                <textarea value={materiales} onChange={e => setMateriales(e.target.value)} rows={2}
                  placeholder="Cualquier observación sobre el estado o los materiales del vehículo..."
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setPaso(2)} className="flex items-center gap-1.5 px-5 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-sm hover:bg-slate-50">
                  <ChevronLeft size={14}/> Atrás
                </button>
                <button onClick={() => setPaso(4)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                  Continuar → Fotos del vehículo <ArrowRight size={15}/>
                </button>
              </div>
            </div>
          )}

          {/* ── PASO 4: Fotos y Crear OT ── */}
          {paso === 4 && (
            <div className="space-y-5 mt-2">
              {/* Fotos obligatorias */}
              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-5 space-y-3 bg-slate-50/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera size={16} className="text-slate-600"/>
                    <p className="font-bold text-slate-700 text-sm">Fotos del vehículo al ingreso <span className="text-red-500">*Obligatorio</span></p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${fotos.length >= 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {fotos.length} foto{fotos.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-xs text-slate-500">Fotografía: frente, lateral izquierdo, lateral derecho, parte trasera, interior y cualquier daño preexistente. Mínimo 1 foto, hasta 15.</p>

                <div className="grid grid-cols-3 gap-2 text-xs text-slate-500 font-medium">
                  {['📸 Frente', '📸 Lateral izq.', '📸 Lateral der.', '📸 Parte trasera', '📸 Interior', '📸 Tablero'].map(s => (
                    <div key={s} className="bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-center">{s}</div>
                  ))}
                </div>

                {fotos.length > 0 && (
                  <PhotoGrid photos={fotos} onRemove={i => setFotos(prev => prev.filter((_, j) => j !== i))}/>
                )}

                <input type="file" accept="image/*" multiple ref={fotoRef}
                  onChange={async e => {
                    const nuevas = await readFilesAsBase64(e.target.files);
                    setFotos(prev => [...prev, ...nuevas].slice(0, 15));
                    e.target.value = '';
                  }} className="hidden"/>

                <button onClick={() => fotoRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-400 text-slate-600 rounded-xl text-sm hover:bg-slate-100 hover:border-slate-500 transition-colors font-medium">
                  <Camera size={16}/> {fotos.length === 0 ? 'Tomar / Subir fotos del vehículo' : `Agregar más fotos (${fotos.length}/15)`}
                </button>
              </div>

              {/* Resumen de la recepción */}
              <div className="bg-slate-800 text-white rounded-2xl p-5 space-y-3">
                <p className="text-sm font-bold text-slate-200 uppercase tracking-wide flex items-center gap-2"><FileText size={13}/> Resumen de la recepción</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/10 rounded-lg px-3 py-2"><p className="text-slate-400">Kilometraje</p><p className="font-bold">{km || '—'}</p></div>
                  <div className="bg-white/10 rounded-lg px-3 py-2"><p className="text-slate-400">Combustible</p><p className="font-bold">{combustible}/5</p></div>
                  <div className="bg-white/10 rounded-lg px-3 py-2"><p className="text-slate-400">Aceite</p><p className={`font-bold capitalize ${aceite === 'bueno' ? 'text-green-400' : aceite === 'bajo' ? 'text-amber-400' : 'text-red-400'}`}>{aceite}</p></div>
                  <div className="bg-white/10 rounded-lg px-3 py-2"><p className="text-slate-400">Frenos</p><p className={`font-bold capitalize ${frenos === 'bueno' ? 'text-green-400' : frenos === 'bajo' ? 'text-amber-400' : 'text-red-400'}`}>{frenos}</p></div>
                </div>
                {materialItems.length > 0 && (
                  <div className="bg-white/10 rounded-lg px-3 py-2 text-xs">
                    <p className="text-slate-400 mb-1">Materiales del cliente ({materialItems.length})</p>
                    <p className="font-medium">{materialItems.join(' · ')}</p>
                  </div>
                )}
                <div className="bg-white/10 rounded-lg px-3 py-2 text-xs">
                  <p className="text-slate-400 mb-1">Problema reportado</p>
                  <p className="font-medium leading-relaxed">{descripcion}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setPaso(3)} className="flex items-center gap-1.5 px-5 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-sm hover:bg-slate-50">
                  <ChevronLeft size={14}/> Atrás
                </button>
                <button onClick={handleCrear}
                  disabled={fotos.length === 0}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${fotos.length > 0 ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                  <ClipboardList size={16}/>
                  {fotos.length > 0 ? `✓ Crear Orden de Trabajo (${fotos.length} foto${fotos.length !== 1 ? 's' : ''})` : 'Agrega al menos 1 foto para continuar'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Appointments() {
  const {
    citas, clientes, vehiculos, catalogs,
    addCita, updateCita, deleteCita,
    confirmarCita, reprogramarCita, cancelarCita,
    addOrden, addNotificacion, currentUser, ordenes
  } = useApp();

  const isAsesor = currentUser?.rol === 'asesor';
  const isCliente = currentUser?.rol === 'cliente';
  const isAdmin = currentUser?.rol === 'administrador';
  const canManage = isAdmin || isAsesor;

  const today = new Date().toISOString().split('T')[0];

  const clienteActual = isCliente
    ? clientes.find(c => c.nombre === currentUser?.nombre || c.usuarioId === currentUser?.id)
    : null;
  const misVehiculos = clienteActual ? vehiculos.filter(v => v.clienteId === clienteActual.id) : [];

  let visibleCitas = citas;
  if (isCliente && clienteActual) {
    visibleCitas = citas.filter(c => c.clienteId === clienteActual.id);
  }

  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState<string>('');
  const [filterFecha, setFilterFecha] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [recepcionCita, setRecepcionCita] = useState<Cita | null>(null);

  // ── Reprogramar modal ─────────────────────────────────────
  const [reprogramarModal, setReprogramarModal] = useState<{ id: string; fecha: string; hora: string } | null>(null);
  const [reprogramarLoading, setReprogramarLoading] = useState(false);
  const [reprogramarError, setReprogramarError] = useState('');

  // ── Cancelar con motivo modal ─────────────────────────────
  const [cancelModal, setCancelModal] = useState<string | null>(null); // citaId
  const [cancelMotivo, setCancelMotivo] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  type FormData = Omit<Cita, 'id' | 'ordenId'>;
  const emptyForm: FormData = {
    clienteId: clienteActual?.id || '',
    vehiculoId: '',
    tipoServicio: '',
    motivoIngreso: '',
    fecha: today,
    hora: '09:00',
    estado: 'pendiente',
    notas: '',
  };
  const [form, setForm] = useState<FormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const clienteVehiculos = vehiculos.filter(v => v.clienteId === form.clienteId);

  const filtered = visibleCitas.filter(c => {
    const cliente = clientes.find(cl => cl.id === c.clienteId);
    const veh = vehiculos.find(v => v.id === c.vehiculoId);
    const s = search.toLowerCase();
    return (!s || cliente?.nombre.toLowerCase().includes(s) || veh?.placa.toLowerCase().includes(s) || c.tipoServicio.toLowerCase().includes(s))
      && (!filterEstado || c.estado === filterEstado)
      && (!filterFecha || c.fecha === filterFecha);
  }).sort((a, b) => `${a.fecha}${a.hora}`.localeCompare(`${b.fecha}${b.hora}`));

  const todayCitas = visibleCitas.filter(c => c.fecha === today && c.estado !== 'cancelada');
  const pendientes = visibleCitas.filter(c => c.estado === 'pendiente').length;
  const confirmadas = visibleCitas.filter(c => c.estado === 'confirmada').length;
  const citasListasParaRecepcion = isAsesor ? citas.filter(c => c.fecha === today && ['pendiente','confirmada'].includes(c.estado) && !ordenes.find(o => o.citaId === c.id)) : [];

  const openCreate = () => {
    setEditId(null);
    setForm({ ...emptyForm, fecha: today });
    setErrors({});
    setServerError('');
    setModalOpen(true);
  };

  const openEdit = (c: Cita) => {
    setEditId(c.id);
    setForm({ clienteId: c.clienteId, vehiculoId: c.vehiculoId, tipoServicio: c.tipoServicio, motivoIngreso: c.motivoIngreso, fecha: c.fecha, hora: c.hora, estado: c.estado, notas: c.notas });
    setErrors({});
    setServerError('');
    setModalOpen(true);
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!isCliente) {
      if (!form.clienteId)    e.clienteId    = 'Selecciona un cliente';
      if (!form.vehiculoId)   e.vehiculoId   = 'Selecciona un vehículo';
      if (!form.tipoServicio) e.tipoServicio  = 'Selecciona el tipo de servicio';
      if (!form.motivoIngreso)e.motivoIngreso = 'Selecciona el motivo';
    }
    if (!form.fecha) e.fecha = 'Selecciona una fecha';
    if (!form.notas?.trim() && isCliente) e.notas = 'Describe el motivo o falla de tu vehículo';
    if (form.fecha && form.hora && !editId) {
      const overlap = citas.find(c => c.fecha === form.fecha && c.hora === form.hora && c.estado !== 'cancelada');
      if (overlap) e.hora = 'Esa franja horaria ya está ocupada';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitLoading(true);
    setServerError('');

    let result: { ok: boolean; error?: string };

    if (editId) {
      result = await updateCita(editId, form);
      if (result.ok) toast.success('Cita actualizada');
    } else {
      const citaData = isCliente
        ? {
            ...form,
            clienteId:     clienteActual?.id || form.clienteId,
            vehiculoId:    misVehiculos[0]?.id || '',
            tipoServicio:  'Por confirmar',
            motivoIngreso: form.notas || 'Por confirmar',
          }
        : form;

      result = await addCita(citaData);

      if (result.ok) {
        if (isCliente) {
          addNotificacion({
            tipo: 'nueva_cita',
            titulo: 'Nueva solicitud de cita',
            mensaje: `${currentUser?.nombre} solicita cita el ${form.fecha} a las ${form.hora}. Motivo: ${form.notas}`,
            paraRol: ['asesor', 'administrador'],
          });
          toast.success('✅ ¡Cita solicitada! El asesor la recibirá pronto.');
        } else {
          toast.success('Cita registrada correctamente');
        }
      }
    }

    setSubmitLoading(false);
    if (!result.ok) { setServerError(result.error ?? 'Error desconocido'); return; }
    setModalOpen(false);
  };

  // Full reception flow: open wizard
  const handleAbrirRecepcion = (c: Cita) => {
    setRecepcionCita(c);
  };

  // After wizard: create OT with reception data → directly to en_diagnostico
  const handleCrearOTDesdeRecepcion = async (recepcion: RecepcionVehiculo, descripcion: string, fotos: string[]) => {
    const cli = clientes.find(c => c.id === recepcionCita!.clienteId);
    const veh = vehiculos.find(v => v.id === recepcionCita!.vehiculoId);
    addOrden({
      clienteId: recepcionCita!.clienteId,
      vehiculoId: recepcionCita!.vehiculoId,
      descripcionProblema: descripcion,
      estado: 'en_diagnostico', // already past 'registrada' since reception is done
      citaId: recepcionCita!.id,
      creadoPor: currentUser?.id,
      recepcion: { ...recepcion, fotos },
      fotosRecepcion: fotos,
    });
    await updateCita(recepcionCita!.id, { estado: 'en_progreso' });
    addNotificacion({
      tipo: 'nueva_cita',
      titulo: 'Vehículo recibido — OT abierta y lista para diagnóstico',
      mensaje: `Se recibió el ${veh?.marca} ${veh?.modelo} (${veh?.placa}) de ${cli?.nombre}. La OT fue creada y está en espera de asignación de mecánico.`,
      paraRol: ['jefe_taller', 'administrador'],
    });
    addNotificacion({
      tipo: 'nueva_cita',
      titulo: 'Tu vehículo fue recibido en el taller',
      mensaje: `Tu ${veh?.marca} ${veh?.modelo} (${veh?.placa}) fue registrado en el taller. Recibirás una notificación cuando tengamos el diagnóstico listo.`,
      paraRol: ['cliente'],
      paraUsuarioId: cli?.usuarioId,
    });
    toast.success(`✅ OT creada para ${cli?.nombre} — ${veh?.placa}. El Jefe de Taller será notificado para asignar mecánico.`);
    setRecepcionCita(null);
  };

  const inCls = (err?: string) =>
    `w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors ${err ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-500'}`;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarDays size={22} className="text-blue-600" />
            {isCliente ? 'Mis Citas' : 'Gestión de Citas'}
          </h1>
          <p className="text-gray-500 text-sm">
            {isCliente ? 'Solicita y consulta el estado de tus citas en el taller' : `${visibleCitas.length} citas registradas`}
          </p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm">
          <Plus size={16} />
          {isCliente ? 'Solicitar Cita' : 'Nueva Cita'}
        </button>
      </div>

      {/* ── ASESOR: Alerta de citas del día listas para recibir ── */}
      {isAsesor && citasListasParaRecepcion.length > 0 && (
        <div className="mb-5 bg-gradient-to-r from-slate-800 to-slate-700 text-white rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
              <Car size={18} className="text-cyan-300"/>
            </div>
            <div className="flex-1">
              <p className="font-bold">🚗 {citasListasParaRecepcion.length} vehículo{citasListasParaRecepcion.length > 1 ? 's' : ''} por recibir hoy</p>
              <p className="text-slate-300 text-xs mt-0.5">Cuando llegue el cliente, haz clic en "Recibir vehículo" para iniciar el proceso de recepción y crear la Orden de Trabajo.</p>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {citasListasParaRecepcion.slice(0, 3).map(c => {
              const cli = clientes.find(cl => cl.id === c.clienteId);
              const veh = vehiculos.find(v => v.id === c.vehiculoId);
              return (
                <div key={c.id} className="bg-white/10 rounded-xl px-3 py-2.5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{cli?.nombre} — <span className="font-mono">{veh?.placa}</span></p>
                    <p className="text-xs text-slate-300">{c.hora} · {c.tipoServicio}</p>
                  </div>
                  <button onClick={() => handleAbrirRecepcion(c)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg text-xs font-bold transition-colors flex-shrink-0">
                    <ArrowRight size={12}/> Recibir vehículo
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Alert — asesor pending */}
      {canManage && pendientes > 0 && (
        <div className="mb-5 bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-center gap-3">
          <Bell size={18} className="text-amber-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800">{pendientes} cita{pendientes > 1 ? 's' : ''} pendiente{pendientes > 1 ? 's' : ''}</p>
            <p className="text-xs text-amber-600">Solicitudes de clientes — confirma o actualiza el estado</p>
          </div>
          <button onClick={() => setFilterEstado('pendiente')} className="text-xs bg-amber-500 text-white px-3 py-1.5 rounded-lg hover:bg-amber-600">
            Ver pendientes
          </button>
        </div>
      )}

      {/* Client pending alert */}
      {isCliente && visibleCitas.filter(c => c.estado === 'pendiente').length > 0 && (
        <div className="mb-5 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
          <Clock size={18} className="text-blue-500 flex-shrink-0" />
          <p className="text-sm text-blue-800">
            Tienes {visibleCitas.filter(c => c.estado === 'pendiente').length} solicitud{visibleCitas.filter(c => c.estado === 'pendiente').length > 1 ? 'es' : ''} pendiente{visibleCitas.filter(c => c.estado === 'pendiente').length > 1 ? 's' : ''} de confirmación.
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Hoy', value: todayCitas.length, color: 'bg-blue-50 text-blue-700 border-blue-100' },
          { label: 'Pendientes', value: pendientes, color: pendientes > 0 ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-gray-50 text-gray-600 border-gray-100' },
          { label: 'Confirmadas', value: confirmadas, color: 'bg-green-50 text-green-700 border-green-100' },
          { label: 'Total activas', value: visibleCitas.filter(c => !['cancelada','completada'].includes(c.estado)).length, color: 'bg-gray-50 text-gray-700 border-gray-100' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border px-4 py-3 ${s.color}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs opacity-70 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters — asesor/admin only */}
      {!isCliente && (
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Buscar cliente, placa, servicio..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <input type="date" value={filterFecha} onChange={e => setFilterFecha(e.target.value)}
            className="px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
          <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)}
            className="px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">Todos los estados</option>
            {Object.entries(estadoCitaConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          {(filterFecha || filterEstado || search) && (
            <button onClick={() => { setSearch(''); setFilterEstado(''); setFilterFecha(''); }}
              className="px-3 py-2.5 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-xl text-sm hover:bg-gray-50">
              Limpiar
            </button>
          )}
        </div>
      )}

      {/* State pills */}
      <div className="flex gap-2 flex-wrap mb-5">
        {Object.entries(estadoCitaConfig).map(([k, v]) => {
          const count = visibleCitas.filter(c => c.estado === k).length;
          if (count === 0 && filterEstado !== k) return null;
          return (
            <button key={k} onClick={() => setFilterEstado(filterEstado === k ? '' : k)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${filterEstado === k ? `${v.bg} ${v.color} border-current` : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${v.dot}`} />
              {v.label} ({count})
            </button>
          );
        })}
      </div>

      {/* ── VISTA CLIENTE ── */}
      {isCliente ? (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl py-16 text-center">
              <CalendarDays size={40} className="mx-auto mb-3 text-gray-200" />
              <p className="text-gray-500 font-medium">No tienes citas registradas</p>
              <button onClick={openCreate} className="mt-4 px-5 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-700">
                Solicitar mi primera cita
              </button>
            </div>
          ) : filtered.map(c => {
            const cfg = estadoCitaConfig[c.estado];
            const veh = vehiculos.find(v => v.id === c.vehiculoId);
            const isToday = c.fecha === today;
            const otAsociada = ordenes.find(o => o.citaId === c.id);
            return (
              <div key={c.id} className={`bg-white border-2 rounded-2xl p-5 transition-all ${c.estado === 'confirmada' ? 'border-green-200' : c.estado === 'pendiente' ? 'border-amber-200' : 'border-gray-200'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 ${isToday ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                      <p className="text-lg font-bold leading-none">{c.fecha.split('-')[2]}</p>
                      <p className="text-xs">{['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][Number(c.fecha.split('-')[1]) - 1]}</p>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-bold text-gray-800">{c.tipoServicio}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1"><Clock size={12} /> {c.hora}</span>
                        {veh && <span className="flex items-center gap-1"><Car size={12} /> {veh.placa} · {veh.marca} {veh.modelo}</span>}
                      </div>
                      {c.motivoIngreso && <p className="text-xs text-gray-400 mt-1">{c.motivoIngreso}</p>}
                      {c.notas && <p className="text-xs text-gray-500 mt-1 bg-gray-50 px-2 py-1 rounded-lg">{c.notas}</p>}
                      {otAsociada && (
                        <div className="mt-2 flex items-center gap-2 text-xs bg-blue-50 border border-blue-100 text-blue-700 px-3 py-1.5 rounded-lg">
                          <ClipboardList size={11} /> OT vinculada: <strong>{otAsociada.numero}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end flex-shrink-0">
                    {['pendiente', 'confirmada'].includes(c.estado) && (
                      <button onClick={() => { setCancelModal(c.id); setCancelMotivo(''); }}
                        className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded-lg border border-red-200">
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── VISTA ASESOR/ADMIN: Table ── */
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200">
                  {['Fecha y Hora', 'Cliente', 'Vehículo', 'Servicio / Motivo', 'OT', 'Estado', 'Acciones'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-gray-400 text-sm">No se encontraron citas</td></tr>
                ) : filtered.map(c => {
                  const cfg = estadoCitaConfig[c.estado];
                  const veh = vehiculos.find(v => v.id === c.vehiculoId);
                  const cli = clientes.find(cl => cl.id === c.clienteId);
                  const isToday = c.fecha === today;
                  const otAsociada = ordenes.find(o => o.citaId === c.id);
                  const isHoy = c.fecha === today;
                  const puedeRecibir = isAsesor && isHoy && ['pendiente','confirmada'].includes(c.estado) && !otAsociada;
                  return (
                    <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${isToday && c.estado !== 'cancelada' ? 'bg-blue-50/20' : ''} ${c.estado === 'pendiente' ? 'bg-amber-50/10' : ''}`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          {puedeRecibir && <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse flex-shrink-0" />}
                          {c.estado === 'pendiente' && !puedeRecibir && <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />}
                          <div>
                            <p className={`text-sm font-semibold ${isToday ? 'text-blue-800' : 'text-gray-800'}`}>{c.fecha}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1"><Clock size={10} /> {c.hora}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-gray-800">{cli?.nombre || '—'}</p>
                        <p className="text-xs text-gray-400">{cli?.telefono}</p>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">
                        {veh ? <><span className="font-medium">{veh.placa}</span> · {veh.marca} {veh.modelo}</> : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-gray-700">{c.tipoServicio}</p>
                        <p className="text-xs text-gray-400">{c.motivoIngreso}</p>
                        {c.notas && <p className="text-xs text-gray-400 italic mt-0.5">"{c.notas}"</p>}
                      </td>
                      <td className="px-5 py-3.5">
                        {otAsociada ? (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg font-medium flex items-center gap-1 w-fit">
                            <ClipboardList size={10} /> {otAsociada.numero}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">Sin OT</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 justify-end flex-wrap">
                          {/* Confirmar — solo para pendientes */}
                          {canManage && c.estado === 'pendiente' && (
                            <button onClick={async () => {
                              const r = await confirmarCita(c.id);
                              r.ok ? toast.success('Cita confirmada') : toast.error(r.error ?? 'Error al confirmar');
                            }}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold">
                              <CheckCircle size={12} /> Confirmar
                            </button>
                          )}
                          {/* Reprogramar — pendiente o confirmada */}
                          {canManage && ['pendiente', 'confirmada'].includes(c.estado) && (
                            <button onClick={() => { setReprogramarModal({ id: c.id, fecha: c.fecha, hora: c.hora }); setReprogramarError(''); }}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Reprogramar">
                              <CalendarDays size={14} />
                            </button>
                          )}
                          {/* Recibir vehículo → crea OT */}
                          {puedeRecibir && (
                            <button onClick={() => handleAbrirRecepcion(c)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 text-white hover:bg-slate-700 rounded-lg font-bold shadow-sm">
                              <Car size={12} /> Recibir
                            </button>
                          )}
                          {/* Editar */}
                          {canManage && !['completada', 'cancelada', 'en_progreso'].includes(c.estado) && (
                            <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg" title="Editar"><Pencil size={14} /></button>
                          )}
                          {/* Cancelar con motivo */}
                          {canManage && !['completada', 'cancelada', 'en_progreso'].includes(c.estado) && (
                            <button onClick={() => { setCancelModal(c.id); setCancelMotivo(''); }}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Cancelar"><XCircle size={14} /></button>
                          )}
                          {/* Eliminar */}
                          {canManage && (
                            <button onClick={() => setDeleteConfirm(c.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Eliminar">
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Modal crear/editar cita ── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-800">{editId ? 'Editar Cita' : isCliente ? 'Solicitar Nueva Cita' : 'Registrar Cita'}</h3>
                {isCliente && !editId && <p className="text-xs text-gray-400 mt-0.5">El asesor la recibirá cuando llegues al taller</p>}
              </div>
              <button onClick={() => setModalOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={16} className="text-gray-500" /></button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

              {/* ── Formulario simplificado para CLIENTE ── */}
              {isCliente ? (
                <>
                  {/* Info del cliente */}
                  {clienteActual && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 flex items-center gap-2">
                      <User size={14} className="text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">{clienteActual.nombre}</span>
                    </div>
                  )}

                  {/* Fecha + Hora */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Fecha *</label>
                      <input type="date" value={form.fecha}
                        onChange={e => setForm({ ...form, fecha: e.target.value })}
                        min={today} className={inCls(errors.fecha)} />
                      {errors.fecha && <p className="text-xs text-red-500 mt-1">{errors.fecha}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Hora *</label>
                      <select value={form.hora}
                        onChange={e => setForm({ ...form, hora: e.target.value })}
                        className={inCls(errors.hora)}>
                        {HORAS.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                      {errors.hora && <p className="text-xs text-red-500 mt-1">{errors.hora}</p>}
                    </div>
                  </div>

                  {/* Motivo / Falla reportada */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Motivo / Falla reportada *
                    </label>
                    <textarea value={form.notas}
                      onChange={e => setForm({ ...form, notas: e.target.value })}
                      rows={4}
                      placeholder="Describe el problema de tu vehículo: síntomas, ruidos, fallas, desde cuándo..."
                      className={`w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 resize-none transition-colors ${errors.notas ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-500'}`} />
                    {errors.notas && <p className="text-xs text-red-500 mt-1">{errors.notas}</p>}
                  </div>
                </>
              ) : (
                /* ── Formulario completo para ASESOR / ADMIN ── */
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Cliente *</label>
                    <select value={form.clienteId}
                      onChange={e => setForm({ ...form, clienteId: e.target.value, vehiculoId: '' })}
                      className={inCls(errors.clienteId)}>
                      <option value="">Seleccionar cliente...</option>
                      {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} — CI: {c.ci}</option>)}
                    </select>
                    {errors.clienteId && <p className="text-xs text-red-500 mt-1">{errors.clienteId}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Vehículo *</label>
                    <select value={form.vehiculoId}
                      onChange={e => setForm({ ...form, vehiculoId: e.target.value })}
                      disabled={!form.clienteId} className={inCls(errors.vehiculoId)}>
                      <option value="">{form.clienteId ? 'Seleccionar vehículo...' : 'Primero selecciona un cliente'}</option>
                      {clienteVehiculos.map(v => <option key={v.id} value={v.id}>{v.placa} — {v.marca} {v.modelo} ({v.año})</option>)}
                    </select>
                    {errors.vehiculoId && <p className="text-xs text-red-500 mt-1">{errors.vehiculoId}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tipo de Servicio *</label>
                      <select value={form.tipoServicio}
                        onChange={e => setForm({ ...form, tipoServicio: e.target.value })}
                        className={inCls(errors.tipoServicio)}>
                        <option value="">Seleccionar...</option>
                        {catalogs.tiposServicio.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      {errors.tipoServicio && <p className="text-xs text-red-500 mt-1">{errors.tipoServicio}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Motivo de Ingreso *</label>
                      <select value={form.motivoIngreso}
                        onChange={e => setForm({ ...form, motivoIngreso: e.target.value })}
                        className={inCls(errors.motivoIngreso)}>
                        <option value="">Seleccionar...</option>
                        {catalogs.motivosIngreso.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      {errors.motivoIngreso && <p className="text-xs text-red-500 mt-1">{errors.motivoIngreso}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Fecha *</label>
                      <input type="date" value={form.fecha}
                        onChange={e => setForm({ ...form, fecha: e.target.value })}
                        min={today} className={inCls(errors.fecha)} />
                      {errors.fecha && <p className="text-xs text-red-500 mt-1">{errors.fecha}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Hora *</label>
                      <select value={form.hora}
                        onChange={e => setForm({ ...form, hora: e.target.value })}
                        className={inCls(errors.hora)}>
                        {HORAS.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                      {errors.hora && <p className="text-xs text-red-500 mt-1">{errors.hora}</p>}
                    </div>
                  </div>

                  {editId && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Estado</label>
                      <select value={form.estado}
                        onChange={e => setForm({ ...form, estado: e.target.value as EstadoCita })}
                        className={inCls()}>
                        {Object.entries(estadoCitaConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Notas adicionales</label>
                    <textarea value={form.notas}
                      onChange={e => setForm({ ...form, notas: e.target.value })}
                      rows={3}
                      placeholder="Observaciones adicionales..."
                      className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                  </div>
                </>
              )}

              {serverError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2.5 text-sm">
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                  <span>{serverError}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={submitLoading}
                  className="flex-1 px-4 py-2.5 bg-slate-800 text-white rounded-xl text-sm hover:bg-slate-700 disabled:opacity-60 font-semibold flex items-center justify-center gap-2">
                  {submitLoading && <Loader2 size={14} className="animate-spin" />}
                  {isCliente && !editId ? <><Send size={14} /> Enviar Solicitud</> : editId ? 'Actualizar' : 'Registrar Cita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Reception Wizard Modal ── */}
      {recepcionCita && (
        <ModalRecepcionCita
          cita={recepcionCita}
          onClose={() => setRecepcionCita(null)}
          onCrearOT={handleCrearOTDesdeRecepcion}
        />
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-2">Eliminar cita</h3>
            <p className="text-gray-600 text-sm mb-5">¿Estás seguro de que deseas eliminar esta cita permanentemente?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-50">Cancelar</button>
              <button disabled={deleteLoading} onClick={async () => { setDeleteLoading(true); const r = await deleteCita(deleteConfirm!); setDeleteLoading(false); if (r.ok) { setDeleteConfirm(null); toast.success('Cita eliminada'); } else toast.error(r.error ?? 'Error al eliminar'); }}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2">
                {deleteLoading && <Loader2 size={14} className="animate-spin" />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reprogramar modal ── */}
      {reprogramarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Reprogramar Cita</h3>
              <button onClick={() => setReprogramarModal(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X size={15} className="text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nueva Fecha *</label>
                <input
                  type="date"
                  value={reprogramarModal.fecha}
                  min={today}
                  onChange={e => setReprogramarModal({ ...reprogramarModal, fecha: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nueva Hora *</label>
                <select
                  value={reprogramarModal.hora}
                  onChange={e => setReprogramarModal({ ...reprogramarModal, hora: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {HORAS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              {reprogramarError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2.5 text-sm">
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                  <span>{reprogramarError}</span>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setReprogramarModal(null)}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-50">
                Cancelar
              </button>
              <button
                disabled={reprogramarLoading}
                onClick={async () => {
                  setReprogramarLoading(true);
                  setReprogramarError('');
                  const r = await reprogramarCita(reprogramarModal.id, reprogramarModal.fecha, reprogramarModal.hora);
                  setReprogramarLoading(false);
                  if (r.ok) {
                    setReprogramarModal(null);
                    toast.success('Cita reprogramada');
                  } else {
                    setReprogramarError(r.error ?? 'Error al reprogramar');
                  }
                }}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2 font-semibold">
                {reprogramarLoading && <Loader2 size={14} className="animate-spin" />}
                <CalendarDays size={14} /> Reprogramar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancelar con motivo modal ── */}
      {cancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">Cancelar Cita</h3>
              <button onClick={() => setCancelModal(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X size={15} className="text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">¿Estás seguro de que deseas cancelar esta cita?</p>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Motivo de cancelación <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <textarea
                value={cancelMotivo}
                onChange={e => setCancelMotivo(e.target.value)}
                rows={3}
                placeholder="Indica el motivo de la cancelación..."
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setCancelModal(null)}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-50">
                Volver
              </button>
              <button
                disabled={cancelLoading}
                onClick={async () => {
                  setCancelLoading(true);
                  const r = await cancelarCita(cancelModal, cancelMotivo || undefined);
                  setCancelLoading(false);
                  if (r.ok) {
                    setCancelModal(null);
                    setCancelMotivo('');
                    toast.success('Cita cancelada');
                  } else {
                    toast.error(r.error ?? 'Error al cancelar');
                  }
                }}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700 disabled:opacity-60 flex items-center justify-center gap-2 font-semibold">
                {cancelLoading && <Loader2 size={14} className="animate-spin" />}
                <XCircle size={14} /> Cancelar cita
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
