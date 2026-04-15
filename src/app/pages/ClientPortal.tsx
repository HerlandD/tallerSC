import React, { useState } from 'react';
import {
  Car, ClipboardList, CheckCircle, Clock, Wrench, Bell,
  FileText, Phone, Mail, MapPin, CreditCard, ChevronRight,
  Receipt, Calendar, AlertTriangle, ThumbsUp, Info, Plus,
  History, Star, Package, CreditCard as PayIcon,
  Smartphone, Banknote, X, CheckSquare, ArrowRight, User, Shield,
  Fuel, Settings, Droplet, ChevronDown, ChevronUp
} from 'lucide-react';
import { useApp, OrdenTrabajo, EstadoOrden, Vehiculo } from '../context/AppContext';
import { ESTADO_CONFIG } from './Dashboard';
import { useNavigate } from 'react-router';
import logoImg from 'figma:asset/705ae0af64042a0b0fa15a9246b41db08254ad91.png';
import clienteAvatarImg from 'figma:asset/7fef9965c0f7d500348453229f33b07ab2f187c3.png';
import { toast } from 'sonner';

// ─── Progress Steps ───────────────────────────────────────────────────────────
const clientSteps = [
  { label: 'Recibido',    estados: ['registrada'] },
  { label: 'Diagnóstico', estados: ['en_diagnostico','esperando_aprobacion'] },
  { label: 'Reparación',  estados: ['en_reparacion'] },
  { label: 'Control QC',  estados: ['control_calidad','liberada'] },
  { label: 'Entregado',   estados: ['finalizada'] },
];

function getStepIndex(estado: EstadoOrden) {
  if (estado === 'cancelada') return -1;
  if (estado === 'liquidacion_diagnostico') return 1;
  for (let i = 0; i < clientSteps.length; i++) {
    if (clientSteps[i].estados.includes(estado)) return i;
  }
  return 0;
}

// ─── Payment Modal ─────────────────────────────────────────────────────────────
function ModalPago({ orden, total, onClose, onPagar }: {
  orden: OrdenTrabajo; total: number; onClose: () => void;
  onPagar: (metodo: string) => void;
}) {
  const [metodo, setMetodo] = useState('');
  const metodos = [
    { id:'transferencia',   label:'Transferencia Bancaria',   icon:<Smartphone size={18}/>, desc:'Pago inmediato en línea' },
    { id:'tarjeta_credito', label:'Tarjeta de Crédito/Débito', icon:<PayIcon size={18}/>,    desc:'Visa, Mastercard' },
    { id:'efectivo',        label:'Efectivo en Taller',        icon:<Banknote size={18}/>,    desc:'Al recoger el vehículo' },
  ];
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-700 to-emerald-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-200 text-xs font-semibold uppercase tracking-wide">Tu vehículo está listo</p>
              <h3 className="text-white font-bold text-lg">{orden.numero}</h3>
            </div>
            <button onClick={onClose} className="p-1.5 bg-white/20 rounded-lg hover:bg-white/30"><X size={16} className="text-white"/></button>
          </div>
        </div>
        <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100">
          <div className="flex justify-between text-sm text-emerald-800 mb-1"><span>Subtotal</span><span>${total.toFixed(2)}</span></div>
          <div className="flex justify-between text-sm text-emerald-800 mb-2"><span>IVA 12%</span><span>${(total * 0.12).toFixed(2)}</span></div>
          <div className="flex justify-between font-bold text-emerald-900 text-lg border-t border-emerald-200 pt-2"><span>TOTAL A PAGAR</span><span>${(total * 1.12).toFixed(2)}</span></div>
        </div>
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
          <Shield size={14} className="text-slate-500"/>
          <p className="text-xs text-slate-600">
            <span className="font-bold">Código de recojo: </span>
            <span className="font-mono bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-800">{orden.numero}</span>
            <span className="ml-1 text-slate-400">— Muéstralo al asesor</span>
          </p>
        </div>
        <div className="px-6 py-4 space-y-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Selecciona tu método de pago</p>
          {metodos.map(m => (
            <button key={m.id} onClick={() => setMetodo(m.id)}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${metodo === m.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${metodo === m.id ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {m.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">{m.label}</p>
                <p className="text-xs text-slate-400">{m.desc}</p>
              </div>
              {metodo === m.id && <CheckCircle size={16} className="text-emerald-500 flex-shrink-0"/>}
            </button>
          ))}
        </div>
        <div className="px-6 pb-6">
          <button onClick={() => { if (metodo) onPagar(metodo); }} disabled={!metodo}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2">
            <CheckSquare size={16}/> Confirmar Pago · ${(total * 1.12).toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Vehicle History Modal ─────────────────────────────────────────────────────
function ModalHistorialVehiculo({ vehiculo, ordenes, onClose }: {
  vehiculo: Vehiculo; ordenes: OrdenTrabajo[]; onClose: () => void;
}) {
  const historial = ordenes.filter(o => o.vehiculoId === vehiculo.id)
    .sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion));

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        <div className="bg-slate-800 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <Car size={18} className="text-white"/>
            </div>
            <div>
              <h3 className="text-white font-bold">{vehiculo.placa}</h3>
              <p className="text-slate-300 text-xs">{vehiculo.marca} {vehiculo.modelo} {vehiculo.año}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20"><X size={16} className="text-white"/></button>
        </div>
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex gap-4 text-xs text-slate-500">
          {vehiculo.color && <span>Color: <strong className="text-slate-700">{vehiculo.color}</strong></span>}
          {vehiculo.kilometraje && <span>KM: <strong className="text-slate-700">{vehiculo.kilometraje}</strong></span>}
          {vehiculo.chasis && <span>VIN: <strong className="text-slate-700 font-mono">{vehiculo.chasis}</strong></span>}
        </div>
        <div className="flex-1 overflow-y-auto">
          {historial.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <History size={32} className="mx-auto mb-2 opacity-20"/>
              <p className="text-sm">Sin historial de servicios</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {historial.map(o => {
                const cfg = ESTADO_CONFIG[o.estado];
                const total = (o.cotizacion?.lineas || []).reduce((s,l) => s + l.cantidad * l.precioUnitario, 0);
                return (
                  <div key={o.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-bold text-slate-700 text-sm">{o.numero}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                        </div>
                        <p className="text-xs text-slate-500">{o.fechaCreacion}</p>
                      </div>
                      {total > 0 && (
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-slate-800">${(total * 1.12).toFixed(2)}</p>
                          <p className="text-xs text-slate-400">con IVA</p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{o.descripcionProblema}</p>
                    {o.diagnostico && (
                      <div className="bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-600 mt-2">
                        <span className="font-semibold">Diagnóstico: </span>{o.diagnostico}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Appointment Request Modal ─────────────────────────────────────────────────
function ModalAgendarCita({ vehiculos, clienteId, onClose }: {
  vehiculos: Vehiculo[]; clienteId: string; onClose: () => void;
}) {
  const { addCita } = useApp();
  const [form, setForm] = useState({ vehiculoId:'', tipoServicio:'', fecha:'', hora:'09:00', motivoIngreso:'', notas:'' });
  const tiposServicio = ['Mantenimiento General','Cambio de Aceite','Frenos','Electricidad','Suspensión','Motor','Carrocería','Diagnóstico','Revisión Técnica'];
  const horarios = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30','16:00','16:30'];
  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = () => {
    if (!form.vehiculoId || !form.tipoServicio || !form.fecha || !form.motivoIngreso) {
      toast.error('Completa todos los campos requeridos'); return;
    }
    addCita({ clienteId, vehiculoId:form.vehiculoId, tipoServicio:form.tipoServicio, motivoIngreso:form.motivoIngreso, fecha:form.fecha, hora:form.hora, estado:'pendiente', notas:form.notas });
    toast.success('✅ Solicitud de cita enviada. El taller la confirmará pronto.');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="bg-slate-800 px-6 py-4 flex items-center justify-between sticky top-0">
          <div>
            <h3 className="text-white font-bold">Solicitar Cita</h3>
            <p className="text-slate-400 text-xs">El taller confirmará tu cita pronto</p>
          </div>
          <button onClick={onClose} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20"><X size={16} className="text-white"/></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Vehículo *</label>
            <select value={form.vehiculoId} onChange={e => setForm({...form, vehiculoId:e.target.value})}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 bg-white">
              <option value="">Selecciona tu vehículo</option>
              {vehiculos.map(v => <option key={v.id} value={v.id}>{v.placa} · {v.marca} {v.modelo} {v.año}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Tipo de servicio *</label>
            <select value={form.tipoServicio} onChange={e => setForm({...form, tipoServicio:e.target.value})}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 bg-white">
              <option value="">Selecciona el tipo</option>
              {tiposServicio.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Fecha *</label>
              <input type="date" min={today} value={form.fecha} onChange={e => setForm({...form, fecha:e.target.value})}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Hora preferida</label>
              <select value={form.hora} onChange={e => setForm({...form, hora:e.target.value})}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 bg-white">
                {horarios.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Motivo / Problema *</label>
            <textarea value={form.motivoIngreso} onChange={e => setForm({...form, motivoIngreso:e.target.value})}
              rows={3} placeholder="Describe el problema o servicio que necesitas..."
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 resize-none"/>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Notas adicionales</label>
            <input type="text" value={form.notas} onChange={e => setForm({...form, notas:e.target.value})}
              placeholder="Ej: prefiero turno de mañana..."
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"/>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-3 border border-slate-300 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50">Cancelar</button>
            <button onClick={handleSubmit} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-all">Solicitar Cita</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Service Card (OT) ────────────────────────────────────────────────────────
function ServicioCard({ orden, vehiculo, onPagar }: {
  orden: OrdenTrabajo; vehiculo: Vehiculo | undefined; onPagar: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = ESTADO_CONFIG[orden.estado];
  const stepIdx = getStepIndex(orden.estado);
  const total = (orden.cotizacion?.lineas || []).reduce((s,l) => s + l.cantidad * l.precioUnitario, 0);
  const isLista = orden.estado === 'liberada';
  const isPendAprobacion = orden.estado === 'esperando_aprobacion';

  return (
    <div className={`bg-white border-2 rounded-2xl overflow-hidden transition-all ${isLista ? 'border-emerald-400 shadow-emerald-100 shadow-md' : isPendAprobacion ? 'border-amber-300' : 'border-slate-200'}`}>
      {/* Header */}
      <div className={`px-5 py-4 flex items-start gap-3 ${isLista ? 'bg-emerald-50' : isPendAprobacion ? 'bg-amber-50' : 'bg-slate-50'} border-b border-inherit`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-bold text-slate-700">{orden.numero}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
            {isLista && <span className="text-xs bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-bold animate-pulse">✅ Listo</span>}
            {isPendAprobacion && <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-bold">⚡ Tu aprobación</span>}
          </div>
          <p className="text-sm text-slate-600">{vehiculo?.placa} · {vehiculo?.marca} {vehiculo?.modelo} {vehiculo?.año}</p>
          <p className="text-xs text-slate-400">{orden.fechaCreacion}</p>
        </div>
        {total > 0 && (
          <div className="text-right flex-shrink-0">
            <p className="font-bold text-slate-800">${(total * 1.12).toFixed(2)}</p>
            <p className="text-xs text-slate-400">con IVA</p>
          </div>
        )}
      </div>

      <div className="px-5 py-4 space-y-3">
        {/* Progress */}
        {!['liquidacion_diagnostico','cancelada'].includes(orden.estado) && (
          <div className="flex items-center gap-0">
            {clientSteps.map((s, i) => {
              const done = i < stepIdx;
              const active = i === stepIdx;
              return (
                <React.Fragment key={i}>
                  <div className={`flex flex-col items-center flex-shrink-0 ${active ? '' : ''}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${done ? 'bg-emerald-500 border-emerald-500' : active ? 'bg-cyan-500 border-cyan-500' : 'bg-white border-slate-200'}`}>
                      {done ? <CheckCircle size={12} className="text-white"/> : active ? <div className="w-2 h-2 bg-white rounded-full"/> : <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"/>}
                    </div>
                    <p className={`text-xs mt-1 text-center leading-tight hidden sm:block ${active ? 'text-cyan-700 font-bold' : done ? 'text-emerald-600' : 'text-slate-300'}`}>{s.label}</p>
                  </div>
                  {i < clientSteps.length - 1 && <div className={`flex-1 h-0.5 ${done ? 'bg-emerald-400' : 'bg-slate-100'}`}/>}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Problema */}
        <p className="text-sm text-slate-600 leading-relaxed">{orden.descripcionProblema}</p>

        {/* Diagnóstico (collapsed toggle) */}
        {orden.diagnostico && (
          <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-left hover:bg-slate-100 transition-colors">
            <div className="flex items-center gap-2">
              <Wrench size={12} className="text-slate-500"/>
              <span className="text-xs font-semibold text-slate-600">Diagnóstico del técnico</span>
            </div>
            {expanded ? <ChevronUp size={13} className="text-slate-400"/> : <ChevronDown size={13} className="text-slate-400"/>}
          </button>
        )}
        {expanded && orden.diagnostico && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
            <p className="text-xs text-slate-700 leading-relaxed">{orden.diagnostico}</p>
          </div>
        )}

        {/* Cotización para aprobar */}
        {isPendAprobacion && orden.cotizacion && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
            <p className="text-xs font-bold text-amber-800 mb-2">Detalle de la cotización</p>
            {orden.cotizacion.lineas.map(l => (
              <div key={l.id} className="flex justify-between text-xs text-slate-700">
                <span className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${l.tipo==='repuesto'?'bg-blue-400':'bg-orange-400'}`}/>
                  {l.descripcion} ×{l.cantidad}
                </span>
                <span className="font-medium">${(l.cantidad * l.precioUnitario).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-amber-200 pt-2 space-y-0.5">
              <div className="flex justify-between text-xs text-slate-500"><span>Subtotal</span><span>${total.toFixed(2)}</span></div>
              <div className="flex justify-between text-xs text-slate-500"><span>IVA 12%</span><span>${(total*0.12).toFixed(2)}</span></div>
              <div className="flex justify-between font-bold text-amber-800 text-sm"><span>Total</span><span>${(total*1.12).toFixed(2)}</span></div>
            </div>
            <p className="text-xs text-amber-600 flex items-center gap-1"><Info size={10}/> Para aprobar o rechazar, visita la recepción del taller</p>
          </div>
        )}

        {/* Pago y recojo */}
        {isLista && (
          <>
            <button onClick={onPagar}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2">
              <PayIcon size={16}/> Realizar Pago en Línea — ${(total * 1.12).toFixed(2)}
            </button>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <Shield size={13} className="text-slate-400 flex-shrink-0"/>
              <p className="text-xs text-slate-600">
                <span className="font-semibold">Código de recojo: </span>
                <span className="font-mono bg-white border border-slate-200 px-2 py-0.5 rounded mx-1">{orden.numero}</span>
                Muéstralo al asesor
              </p>
            </div>
          </>
        )}

        {/* Factura */}
        {orden.estado === 'finalizada' && orden.facturaId && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
            <Receipt size={13} className="text-emerald-600 flex-shrink-0"/>
            <p className="text-xs text-emerald-700">
              <span className="font-semibold">Factura: </span>{orden.facturaId} · ✅ Pagada
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ClientPortal() {
  const {
    ordenes, clientes, vehiculos, currentUser, notificaciones, marcarNotificacionLeida,
    citas, updateOrden, addFactura, addNotificacion
  } = useApp();

  const [historialVehiculo, setHistorialVehiculo] = useState<Vehiculo | null>(null);
  const [pagoOrden, setPagoOrden] = useState<OrdenTrabajo | null>(null);
  const [showAgendarModal, setShowAgendarModal] = useState(false);

  const clienteActual = clientes.find(c => c.usuarioId === currentUser?.id || c.nombre === currentUser?.nombre);
  const misVehiculos = clienteActual ? vehiculos.filter(v => v.clienteId === clienteActual.id) : [];
  const misOrdenes = clienteActual ? ordenes.filter(o => misVehiculos.some(v => v.id === o.vehiculoId)) : [];
  const misCitas = clienteActual ? citas.filter(c => c.clienteId === clienteActual.id).sort((a,b) => b.fecha.localeCompare(a.fecha)) : [];

  const misNotifs = notificaciones.filter(n =>
    n.paraRol.includes('cliente') && (!n.paraUsuarioId || n.paraUsuarioId === currentUser?.id)
  ).slice().reverse().slice(0, 8);
  const unreadCount = misNotifs.filter(n => !n.leida).length;

  const activas = misOrdenes.filter(o => !['finalizada','cancelada','liquidacion_diagnostico'].includes(o.estado));
  const pendAprobacion = misOrdenes.filter(o => o.estado === 'esperando_aprobacion');
  const listasEntrega = misOrdenes.filter(o => o.estado === 'liberada');
  const finalizadas = misOrdenes.filter(o => o.estado === 'finalizada');

  const handlePagar = (orden: OrdenTrabajo, metodoPago: string) => {
    const total = (orden.cotizacion?.lineas || []).reduce((s,l) => s + l.cantidad * l.precioUnitario, 0);
    const factura = {
      numero: `FAC-${Date.now()}`,
      fecha: new Date().toISOString().split('T')[0],
      ordenId: orden.id, clienteId: orden.clienteId,
      subtotal: total, impuesto: total * 0.12, total: total * 1.12,
      metodoPago, estado: 'pagada' as const,
    };
    addFactura(factura);
    updateOrden(orden.id, {
      pagadoEnLinea: true,
      facturaId: factura.numero,
      metodoPagoFinal: metodoPago,
      cotizacion: { ...orden.cotizacion!, metodoPago },
    });
    addNotificacion({
      tipo: 'pago_recibido',
      titulo: `💳 Pago recibido en línea — ${orden.numero}`,
      mensaje: `El cliente realizó el pago de $${(total * 1.12).toFixed(2)} vía ${metodoPago}. El asesor debe confirmar la entrega física.`,
      paraRol: ['asesor','administrador'],
    });
    toast.success(`✅ Pago confirmado. Factura ${factura.numero}. Presenta el código "${orden.numero}" al recoger tu vehículo.`);
    setPagoOrden(null);
  };

  return (
    <div className="min-h-screen bg-slate-100">

      {/* ── Hero Header ── */}
      <div className="bg-slate-800 px-6 pt-6 pb-0">
        <div className="max-w-3xl mx-auto">
          {/* Top row: logo + notif */}
          <div className="flex items-center justify-between mb-5">
            <div className="bg-white rounded-xl px-3 py-1.5">
              <img src={logoImg} alt="TallerPro" className="h-7 w-auto object-contain"/>
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <div className="flex items-center gap-1.5 bg-red-500 text-white text-xs px-2.5 py-1 rounded-full font-bold">
                  <Bell size={11}/> {unreadCount} nueva{unreadCount > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>

          {/* Greeting */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white/10 flex items-center justify-center flex-shrink-0 border-2 border-white/20">
              <img src={clienteAvatarImg} alt="Avatar" className="w-full h-full object-contain"/>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Bienvenido/a de vuelta</p>
              <h1 className="text-white font-bold text-2xl leading-tight">{currentUser?.nombre?.split(' ')[0]} {currentUser?.nombre?.split(' ')[1] || ''} 👋</h1>
              {clienteActual && <p className="text-slate-400 text-xs mt-0.5">CI: {clienteActual.ci} · {clienteActual.email}</p>}
            </div>
          </div>

          {/* Quick stats row */}
          <div className="flex gap-3 pb-0">
            {[
              { icon: <Car size={17}/>,         label: 'Vehículos',   val: misVehiculos.length, accent: 'text-cyan-400' },
              { icon: <Wrench size={17}/>,       label: 'En servicio', val: activas.length,      accent: activas.length > 0 ? 'text-amber-400' : 'text-slate-400' },
              { icon: <CheckCircle size={17}/>,  label: 'Completados', val: finalizadas.length,  accent: 'text-emerald-400' },
              { icon: <Calendar size={17}/>,     label: 'Citas',       val: misCitas.filter(c=>c.estado==='pendiente'||c.estado==='confirmada').length, accent: 'text-violet-400' },
            ].map(s => (
              <div key={s.label} className="flex-1 bg-white/8 border border-white/10 rounded-t-2xl px-3 pt-3 pb-3 text-center">
                <div className={`flex justify-center mb-1.5 ${s.accent}`}>{s.icon}</div>
                <p className="text-white font-bold text-xl leading-none">{s.val}</p>
                <p className="text-slate-400 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Actions Bar ── */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: <Calendar size={19}/>, label: 'Agendar cita', color: 'bg-slate-800 text-white', action: () => setShowAgendarModal(true) },
              { icon: <ClipboardList size={19}/>, label: 'Mis servicios', color: 'bg-cyan-50 text-cyan-700 border border-cyan-200', action: () => document.getElementById('sec-servicios')?.scrollIntoView({behavior:'smooth'}) },
              { icon: <Car size={19}/>, label: 'Mis vehículos', color: 'bg-slate-50 text-slate-700 border border-slate-200', action: () => document.getElementById('sec-vehiculos')?.scrollIntoView({behavior:'smooth'}) },
              { icon: <Receipt size={19}/>, label: 'Mis facturas', color: 'bg-emerald-50 text-emerald-700 border border-emerald-200', action: () => document.getElementById('sec-citas')?.scrollIntoView({behavior:'smooth'}) },
            ].map(a => (
              <button key={a.label} onClick={a.action}
                className={`${a.color} rounded-xl py-3 px-2 flex flex-col items-center gap-1.5 text-xs font-semibold hover:opacity-80 transition-all`}>
                {a.icon}
                <span className="leading-tight text-center">{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Alert Banners ── */}
      <div className="max-w-3xl mx-auto px-4 pt-4 space-y-3">
        {listasEntrega.map(o => {
          const veh = misVehiculos.find(v => v.id === o.vehiculoId);
          const total = (o.cotizacion?.lineas || []).reduce((s,l) => s + l.cantidad * l.precioUnitario, 0);
          return (
            <div key={o.id} className="bg-gradient-to-r from-emerald-700 to-emerald-600 rounded-2xl p-5 shadow-lg shadow-emerald-200">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={20} className="text-white"/>
                </div>
                <div className="flex-1">
                  <p className="text-emerald-200 text-xs font-bold uppercase tracking-wide mb-0.5">🎉 ¡Tu vehículo está listo!</p>
                  <p className="text-white font-bold">{veh?.placa} — {veh?.marca} {veh?.modelo}</p>
                  <p className="text-emerald-200 text-sm mt-0.5">{o.numero} · <strong className="text-white">${(total * 1.12).toFixed(2)}</strong> con IVA</p>
                  {o.pagadoEnLinea
                    ? <p className="text-cyan-200 text-xs mt-1 font-semibold">✅ Ya pagaste en línea · Muestra el código: <span className="font-mono bg-white/15 px-1.5 rounded">{o.numero}</span></p>
                    : <p className="text-emerald-300 text-xs mt-1">Código de recojo: <span className="font-mono bg-white/15 px-1.5 rounded">{o.numero}</span></p>
                  }
                </div>
                {!o.pagadoEnLinea && (
                  <button onClick={() => setPagoOrden(o)}
                    className="flex-shrink-0 px-4 py-2.5 bg-white text-emerald-700 rounded-xl text-sm font-bold hover:bg-emerald-50 transition-colors">
                    Pagar →
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {pendAprobacion.map(o => {
          const veh = misVehiculos.find(v => v.id === o.vehiculoId);
          const total = (o.cotizacion?.lineas || []).reduce((s,l) => s + l.cantidad * l.precioUnitario, 0);
          return (
            <div key={o.id} className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5"/>
                <div className="flex-1">
                  <p className="font-bold text-amber-800 text-sm">⚡ Cotización pendiente de aprobación</p>
                  <p className="text-amber-700 text-xs mt-0.5">{o.numero} · {veh?.placa} · <strong>${(total * 1.12).toFixed(2)}</strong> con IVA</p>
                  <p className="text-amber-600 text-xs mt-1">Visita el taller o contacta a tu asesor para aprobar o rechazar</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-3xl mx-auto px-4 py-4 space-y-8">

        {/* ═══ MIS VEHÍCULOS ═══ */}
        <section id="sec-vehiculos">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-slate-800 rounded-lg flex items-center justify-center">
                <Car size={14} className="text-white"/>
              </div>
              <h2 className="font-bold text-slate-800">Mis Vehículos</h2>
              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{misVehiculos.length}</span>
            </div>
          </div>

          {misVehiculos.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl py-10 text-center">
              <Car size={32} className="mx-auto mb-2 text-slate-300"/>
              <p className="font-semibold text-slate-500">Sin vehículos registrados</p>
              <p className="text-sm text-slate-400 mt-1">El taller los añadirá al abrir tu primera orden de servicio</p>
            </div>
          ) : (
            <div className="space-y-3">
              {misVehiculos.map(v => {
                const vehOrdenes = misOrdenes.filter(o => o.vehiculoId === v.id);
                const activa = vehOrdenes.find(o => !['finalizada','cancelada'].includes(o.estado));
                const totalServicios = vehOrdenes.filter(o => o.estado === 'finalizada').length;
                const ultimaFinalizada = vehOrdenes.filter(o => o.estado === 'finalizada').sort((a,b) => b.fechaCreacion.localeCompare(a.fechaCreacion))[0];

                return (
                  <div key={v.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    {/* Main card body */}
                    <div className="px-5 py-5 flex items-center gap-4">
                      {/* Car icon */}
                      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center flex-shrink-0 relative">
                        <Car size={26} className="text-slate-400"/>
                        {activa && <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-cyan-500 rounded-full border-2 border-white animate-pulse"/>}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-bold text-slate-800 text-base font-mono">{v.placa}</span>
                          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{v.color}</span>
                          {activa && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${ESTADO_CONFIG[activa.estado].bg} ${ESTADO_CONFIG[activa.estado].color}`}>
                              {ESTADO_CONFIG[activa.estado].label}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-600 text-sm font-medium">{v.marca} {v.modelo} · {v.año}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                          {v.kilometraje && <span className="flex items-center gap-1"><Fuel size={10}/>{v.kilometraje} km</span>}
                          <span>{totalServicios} servicio{totalServicios !== 1 ? 's' : ''} completado{totalServicios !== 1 ? 's' : ''}</span>
                          {ultimaFinalizada && <span>Último: {ultimaFinalizada.fechaCreacion}</span>}
                        </div>
                      </div>

                      {/* Servicios count */}
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-slate-700 text-2xl">{vehOrdenes.length}</p>
                        <p className="text-xs text-slate-400">órdenes</p>
                      </div>
                    </div>

                    {/* Action row */}
                    <div className="border-t border-slate-100 px-5 py-3 bg-slate-50 flex items-center justify-between gap-2">
                      <div className="text-xs text-slate-400">
                        {v.chasis && <span className="font-mono">VIN: {v.chasis}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        {activa && (
                          <button
                            onClick={() => document.getElementById('sec-servicios')?.scrollIntoView({behavior:'smooth'})}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-semibold transition-all">
                            <ClipboardList size={11}/> Ver servicio activo
                          </button>
                        )}
                        <button onClick={() => setHistorialVehiculo(v)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-all">
                          <History size={12}/> Historial
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ═══ MIS SERVICIOS ═══ */}
        <section id="sec-servicios">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-cyan-600 rounded-lg flex items-center justify-center">
                <Wrench size={14} className="text-white"/>
              </div>
              <h2 className="font-bold text-slate-800">Mis Servicios</h2>
              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{misOrdenes.length}</span>
            </div>
            {activas.length > 0 && (
              <span className="flex items-center gap-1 text-xs bg-cyan-100 text-cyan-700 px-2.5 py-1 rounded-full font-semibold">
                <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse"/>
                {activas.length} activo{activas.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {misOrdenes.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl py-10 text-center">
              <ClipboardList size={32} className="mx-auto mb-2 text-slate-300"/>
              <p className="font-semibold text-slate-500">Sin órdenes de servicio</p>
              <p className="text-sm text-slate-400 mt-1">Agenda una cita para comenzar</p>
              <button onClick={() => setShowAgendarModal(true)}
                className="mt-4 px-5 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-700">
                + Solicitar Cita
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Activas primero */}
              {[...misOrdenes].sort((a,b) => {
                const prioridad = { 'liberada':0,'esperando_aprobacion':1,'control_calidad':2,'en_reparacion':3,'en_diagnostico':4,'registrada':5,'liquidacion_diagnostico':6,'finalizada':7,'cancelada':8 };
                return (prioridad[a.estado]??9) - (prioridad[b.estado]??9);
              }).map(o => (
                <ServicioCard
                  key={o.id}
                  orden={o}
                  vehiculo={misVehiculos.find(v => v.id === o.vehiculoId)}
                  onPagar={() => setPagoOrden(o)}
                />
              ))}
            </div>
          )}
        </section>

        {/* ═══ MIS CITAS ═══ */}
        <section id="sec-citas">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
                <Calendar size={14} className="text-white"/>
              </div>
              <h2 className="font-bold text-slate-800">Mis Citas</h2>
              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{misCitas.length}</span>
            </div>
            <button onClick={() => setShowAgendarModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-all">
              <Plus size={12}/> Agendar
            </button>
          </div>

          {misCitas.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl py-10 text-center">
              <Calendar size={32} className="mx-auto mb-2 text-slate-300"/>
              <p className="font-semibold text-slate-500">Sin citas programadas</p>
              <button onClick={() => setShowAgendarModal(true)}
                className="mt-4 px-5 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-700">
                + Solicitar Cita
              </button>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              {misCitas.slice(0, 6).map((c, idx) => {
                const veh = misVehiculos.find(v => v.id === c.vehiculoId);
                const estadoConfig: Record<string, {label:string; dot:string; bg:string; text:string}> = {
                  pendiente:   { label:'Pendiente',   dot:'bg-amber-400', bg:'bg-amber-50', text:'text-amber-700' },
                  confirmada:  { label:'Confirmada',  dot:'bg-emerald-500', bg:'bg-emerald-50', text:'text-emerald-700' },
                  en_progreso: { label:'En Progreso', dot:'bg-blue-500', bg:'bg-blue-50', text:'text-blue-700' },
                  completada:  { label:'Completada',  dot:'bg-slate-400', bg:'bg-slate-50', text:'text-slate-500' },
                  cancelada:   { label:'Cancelada',   dot:'bg-red-400', bg:'bg-red-50', text:'text-red-500' },
                };
                const cfg = estadoConfig[c.estado] || estadoConfig.pendiente;
                const isToday = c.fecha === new Date().toISOString().split('T')[0];
                const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
                const [y, m, d] = c.fecha.split('-');
                return (
                  <div key={c.id} className={`flex items-center gap-4 px-5 py-4 ${idx < misCitas.length - 1 ? 'border-b border-slate-100' : ''} ${c.estado==='cancelada' ? 'opacity-50' : ''} hover:bg-slate-50 transition-colors`}>
                    {/* Date block */}
                    <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${isToday ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <p className="text-base font-bold leading-none">{d}</p>
                      <p className="text-xs">{meses[parseInt(m)-1]}</p>
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-slate-800 text-sm">{c.tipoServicio}</span>
                        <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}/>
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Clock size={10}/>{c.hora}</span>
                        {veh && <span className="flex items-center gap-1"><Car size={10}/>{veh.placa} · {veh.marca} {veh.modelo}</span>}
                      </div>
                      {c.motivoIngreso && <p className="text-xs text-slate-400 mt-0.5">{c.motivoIngreso}</p>}
                    </div>
                    {isToday && c.estado !== 'cancelada' && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg font-bold flex-shrink-0">Hoy</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ═══ NOTIFICACIONES ═══ */}
        {misNotifs.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-red-500 rounded-lg flex items-center justify-center">
                <Bell size={14} className="text-white"/>
              </div>
              <h2 className="font-bold text-slate-800">Notificaciones</h2>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">{unreadCount} nueva{unreadCount > 1 ? 's' : ''}</span>
              )}
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
              {misNotifs.map(n => (
                <div key={n.id} onClick={() => marcarNotificacionLeida(n.id)}
                  className={`px-5 py-3.5 cursor-pointer transition-colors ${!n.leida ? 'bg-cyan-50/50 hover:bg-cyan-50' : 'hover:bg-slate-50'}`}>
                  <div className="flex items-start gap-2.5">
                    {!n.leida && <div className="w-2 h-2 bg-cyan-500 rounded-full flex-shrink-0 mt-1.5"/>}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800">{n.titulo}</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.mensaje}</p>
                      <p className="text-xs text-slate-300 mt-1">{new Date(n.fecha).toLocaleString('es-ES',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ═══ MI PERFIL ═══ */}
        {clienteActual && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-slate-600 rounded-lg flex items-center justify-center">
                <User size={14} className="text-white"/>
              </div>
              <h2 className="font-bold text-slate-800">Mi Perfil</h2>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold">{clienteActual.nombre.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{clienteActual.nombre}</h3>
                  <p className="text-xs text-slate-400">Cliente desde {clienteActual.fechaRegistro}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { icon:<CreditCard size={12}/>, label:'CI',     val:clienteActual.ci },
                  { icon:<FileText size={12}/>,   label:'NIT',    val:clienteActual.nit },
                  { icon:<Phone size={12}/>,      label:'Télef.', val:clienteActual.telefono },
                  { icon:<Mail size={12}/>,       label:'Email',  val:clienteActual.email },
                  { icon:<MapPin size={12}/>,     label:'Dir.',   val:clienteActual.direccion },
                ].filter(f => f.val).map(f => (
                  <div key={f.label} className="flex items-center gap-2.5 bg-slate-50 rounded-xl px-3 py-2.5">
                    <span className="text-slate-400 flex-shrink-0">{f.icon}</span>
                    <span className="text-xs text-slate-400 w-8 flex-shrink-0 font-medium">{f.label}</span>
                    <span className="text-xs font-semibold text-slate-700 truncate">{f.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Bottom padding */}
        <div className="h-6"/>
      </div>

      {/* ── Modals ── */}
      {historialVehiculo && (
        <ModalHistorialVehiculo vehiculo={historialVehiculo} ordenes={misOrdenes} onClose={() => setHistorialVehiculo(null)}/>
      )}
      {pagoOrden && (
        <ModalPago
          orden={pagoOrden}
          total={(pagoOrden.cotizacion?.lineas || []).reduce((s,l) => s + l.cantidad * l.precioUnitario, 0)}
          onClose={() => setPagoOrden(null)}
          onPagar={(metodo) => handlePagar(pagoOrden, metodo)}
        />
      )}
      {showAgendarModal && clienteActual && (
        <ModalAgendarCita vehiculos={misVehiculos} clienteId={clienteActual.id} onClose={() => setShowAgendarModal(false)}/>
      )}
    </div>
  );
}
