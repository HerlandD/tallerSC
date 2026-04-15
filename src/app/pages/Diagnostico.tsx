import React, { useState, useRef } from 'react';
import {
  Wrench, Search, Save, Package, AlertCircle, CheckCircle, ArrowRight,
  Camera, Upload, ZoomIn, X, Plus, ChevronDown, ChevronUp,
  AlertTriangle, FileText, DollarSign, Send, Clock, Car, User, Bell
} from 'lucide-react';
import {
  useApp, OrdenTrabajo, EstadoOrden, RepuestoUsado, Cotizacion, LineaCotizacion
} from '../context/AppContext';
import { ESTADO_CONFIG } from './Dashboard';
import { toast } from 'sonner';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function PhotoGrid({ photos, onRemove }: { photos: string[]; onRemove?: (i: number) => void }) {
  const [preview, setPreview] = useState<string | null>(null);
  if (photos.length === 0) return null;
  return (
    <>
      <div className="grid grid-cols-4 gap-2 mt-2">
        {photos.map((src, i) => (
          <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
            <img src={src} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1">
              <button onClick={() => setPreview(src)} className="p-1 bg-white/80 rounded"><ZoomIn size={11} /></button>
              {onRemove && <button onClick={() => onRemove(i)} className="p-1 bg-red-500 rounded"><X size={11} className="text-white" /></button>}
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

function Section({ num, title, color = 'blue', children }: {
  num: number; title: string; color?: string; children: React.ReactNode;
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-600', violet: 'bg-violet-600', orange: 'bg-orange-500',
    green: 'bg-green-600', amber: 'bg-amber-500',
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className={`w-7 h-7 ${colors[color] || colors.blue} text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0`}>
          {num}
        </div>
        <h4 className="text-sm font-bold text-gray-800">{title}</h4>
      </div>
      {children}
    </div>
  );
}

const taCls = 'w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500';
const inCls = 'w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Diagnostico() {
  const {
    ordenes, clientes, vehiculos, usuarios, repuestos,
    updateOrden, reservarRepuestos, liberarReservas,
    registrarSalidaRepuesto, currentUser, addAuditoria,
    addNotificacion
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedOrden, setSelectedOrden] = useState<OrdenTrabajo | null>(null);

  const isMecanico = currentUser?.rol === 'mecanico';
  const isAdmin = currentUser?.rol === 'administrador';
  const isJefe = currentUser?.rol === 'jefe_taller';

  // Iron-tight filter: mechanic sees ONLY their own assigned OTs in active states.
  // Jefe and Admin see all active OTs (supervision mode).
  const visibleOrdenes = ordenes.filter(o => {
    const validState = ['en_diagnostico', 'en_reparacion'].includes(o.estado);
    if (!validState) return false;
    if (isMecanico) {
      // Strict: only orders explicitly assigned to THIS mechanic
      return o.mecanicoId === currentUser?.id ||
        (o.mecanicosIds ?? []).includes(currentUser?.id ?? '');
    }
    // Jefe / Admin: see all active orders for supervision
    return true;
  });

  const filtered = visibleOrdenes.filter(o => {
    const s = search.toLowerCase();
    const cli = clientes.find(c => c.id === o.clienteId);
    const veh = vehiculos.find(v => v.id === o.vehiculoId);
    return o.numero.toLowerCase().includes(s)
      || cli?.nombre.toLowerCase().includes(s)
      || veh?.placa.toLowerCase().includes(s);
  });

  const selectOrden = (o: OrdenTrabajo) => setSelectedOrden(o);

  const log = (accion: string, detalles: string, entidadId?: string) => {
    if (currentUser) addAuditoria({
      fecha: new Date().toISOString(), usuarioId: currentUser.id, usuarioNombre: currentUser.nombre,
      accion, modulo: 'Diagnóstico', detalles, entidadId,
    });
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Wrench size={22} className="text-violet-600" />
          {isMecanico ? 'Mis Órdenes — Diagnóstico y Reparación' : 'Supervisión: Diagnóstico y Reparación'}
        </h1>
        {isMecanico ? (
          <p className="text-gray-500 text-sm mt-1">
            Solo se muestran las órdenes asignadas a <strong>{currentUser?.nombre}</strong>
          </p>
        ) : (
          <p className="text-gray-500 text-sm mt-1">
            Vista de supervisión — todas las órdenes activas en diagnóstico y reparación
          </p>
        )}
      </div>

      {/* Mobile: stacked layout — list on top, detail below */}
      <div className="flex flex-col lg:flex-row gap-5" style={{ height: undefined }}>
        {/* ── LEFT PANEL: Order list ── */}
        <div className="w-full lg:w-72 lg:flex-shrink-0 flex flex-col" style={{ maxHeight: selectedOrden ? '40vh' : undefined }}>
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Buscar OT, cliente, placa..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 lg:max-h-none max-h-72">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Wrench size={30} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm font-medium">
                  {isMecanico ? 'No tienes órdenes asignadas' : 'Sin órdenes activas en diagnóstico'}
                </p>
                <p className="text-xs mt-0.5 opacity-60">
                  {isMecanico ? 'El jefe de taller te asignará nuevas órdenes' : 'Las OTs en diagnóstico y reparación aparecerán aquí'}
                </p>
              </div>
            ) : filtered.map(o => {
              const est = ESTADO_CONFIG[o.estado];
              const veh = vehiculos.find(v => v.id === o.vehiculoId);
              const cli = clientes.find(c => c.id === o.clienteId);
              const isSelected = selectedOrden?.id === o.id;
              return (
                <button key={o.id} onClick={() => selectOrden(o)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${isSelected ? 'border-violet-500 bg-violet-50' : 'border-gray-200 bg-white hover:border-violet-300 hover:bg-violet-50/30'}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-bold text-violet-600">{o.numero}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${est.bg} ${est.color}`}>{est.label}</span>
                  </div>
                  <p className="text-xs font-semibold text-gray-700 truncate">{cli?.nombre}</p>
                  <p className="text-xs text-gray-500">{veh?.placa} · {veh?.marca} {veh?.modelo}</p>
                  {!isMecanico && o.mecanicoId && (
                    <p className="text-xs text-violet-600 mt-1 font-medium">
                      Mec: {usuarios.find(u => u.id === o.mecanicoId)?.nombre?.split(' ')[0]}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT PANEL: Diagnostic form ── */}
        <div className="flex-1 overflow-y-auto">
          {!selectedOrden ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-400 max-w-sm">
                <div className="w-20 h-20 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Wrench size={36} className="text-violet-300" />
                </div>
                <p className="font-semibold text-gray-600 text-lg">Selecciona una Orden</p>
                <p className="text-sm mt-1.5">Elige una OT de la lista para registrar el diagnóstico técnico y generar la cotización</p>
              </div>
            </div>
          ) : (
            <DiagnosticoPanel
              orden={selectedOrden}
              repuestos={repuestos}
              clientes={clientes}
              vehiculos={vehiculos}
              usuarios={usuarios}
              currentUser={currentUser}
              isMecanico={isMecanico}
              isAdmin={isAdmin}
              updateOrden={(id, data) => {
                updateOrden(id, data);
                setSelectedOrden(prev => prev ? { ...prev, ...data } : null);
              }}
              reservarRepuestos={reservarRepuestos}
              liberarReservas={liberarReservas}
              registrarSalidaRepuesto={registrarSalidaRepuesto}
              addNotificacion={addNotificacion}
              log={log}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── DiagnosticoPanel ─────────────────────────────────────────────────────────

function DiagnosticoPanel({
  orden, repuestos, clientes, vehiculos, usuarios, currentUser,
  isMecanico, isAdmin, updateOrden, reservarRepuestos, liberarReservas,
  registrarSalidaRepuesto, addNotificacion, log
}: {
  orden: OrdenTrabajo;
  repuestos: ReturnType<typeof useApp>['repuestos'];
  clientes: ReturnType<typeof useApp>['clientes'];
  vehiculos: ReturnType<typeof useApp>['vehiculos'];
  usuarios: ReturnType<typeof useApp>['usuarios'];
  currentUser: ReturnType<typeof useApp>['currentUser'];
  isMecanico: boolean; isAdmin: boolean;
  updateOrden: (id: string, data: Partial<OrdenTrabajo>) => void;
  reservarRepuestos: ReturnType<typeof useApp>['reservarRepuestos'];
  liberarReservas: ReturnType<typeof useApp>['liberarReservas'];
  registrarSalidaRepuesto: ReturnType<typeof useApp>['registrarSalidaRepuesto'];
  addNotificacion: ReturnType<typeof useApp>['addNotificacion'];
  log: (a: string, d: string, id?: string) => void;
}) {
  const cli = clientes.find(c => c.id === orden.clienteId);
  const veh = vehiculos.find(v => v.id === orden.vehiculoId);
  const mec = usuarios.find(u => u.id === orden.mecanicoId);
  const cfg = ESTADO_CONFIG[orden.estado];

  // ── Diagnóstico state ──
  const [diagnostico, setDiagnostico] = useState(orden.diagnostico || '');
  const [fallasAdicionales, setFallasAdicionales] = useState(orden.fallasAdicionales || '');
  const [recomendaciones, setRecomendaciones] = useState('');
  const [severidad, setSeveridad] = useState<'leve' | 'moderada' | 'grave'>('moderada');
  const [costoDiagnostico, setCostoDiagnostico] = useState(orden.cotizacion?.costoDiagnostico ?? 30);

  // ── Parts for quotation ──
  const [lineas, setLineas] = useState<LineaCotizacion[]>(orden.cotizacion?.lineas || []);
  const [addRepId, setAddRepId] = useState('');
  const [addRepCant, setAddRepCant] = useState(1);
  const [addTipo, setAddTipo] = useState<'repuesto' | 'mano_de_obra' | 'diagnostico'>('mano_de_obra');
  const [addDesc, setAddDesc] = useState('');
  const [addPrecio, setAddPrecio] = useState(0);

  // ── Photos ──
  const [fotosDx, setFotosDx] = useState<string[]>(orden.fotosDiagnostico || []);
  const fotoRef = useRef<HTMLInputElement>(null);

  const totalRep = lineas.filter(l => l.tipo === 'repuesto').reduce((s, l) => s + l.cantidad * l.precioUnitario, 0);
  const totalMO = lineas.filter(l => l.tipo === 'mano_de_obra').reduce((s, l) => s + l.cantidad * l.precioUnitario, 0);
  const totalDx = lineas.filter(l => l.tipo === 'diagnostico').reduce((s, l) => s + l.cantidad * l.precioUnitario, 0);
  const totalCot = lineas.reduce((s, l) => s + l.cantidad * l.precioUnitario, 0);
  const totalConIVA = totalCot * 1.12;

  const canEdit = (isMecanico || isAdmin) && orden.estado === 'en_diagnostico';

  // ── Add item to quotation ──
  const handleAddLinea = () => {
    let desc = addDesc;
    let precio = addPrecio;
    let repId: string | undefined;

    if (addTipo === 'repuesto') {
      const rep = repuestos.find(r => r.id === addRepId);
      if (!rep) { toast.error('Selecciona un repuesto'); return; }

      const disponible = rep.cantidad - rep.cantidadReservada;
      if (disponible < addRepCant) {
        // No stock — alert admin
        if (disponible === 0) {
          addNotificacion({
            tipo: 'repuesto_agotado',
            titulo: `Stock agotado — ${rep.nombre}`,
            mensaje: `El mecánico ${currentUser?.nombre} requiere ${addRepCant}× "${rep.nombre}" para ${orden.numero}, pero no hay stock disponible (actual: ${rep.cantidad}).`,
            paraRol: ['administrador'],
            referenciaId: rep.id,
          });
          toast.warning(`Sin stock de "${rep.nombre}". Se notificó al Administrador para reposición.`);
        } else {
          toast.error(`Solo ${disponible} unidades disponibles de ${rep.nombre} (reservadas: ${rep.cantidadReservada})`);
        }
        // Still add to quotation as "required" for the admin to supply
      }

      desc = rep.nombre;
      precio = rep.precio;
      repId = rep.id;
    } else {
      if (!desc.trim()) { toast.error('Ingresa la descripción'); return; }
      if (precio <= 0) { toast.error('Ingresa un precio mayor a 0'); return; }
    }

    setLineas(prev => {
      const existing = prev.find(l => l.tipo === 'repuesto' && (l as any).repuestoId === repId);
      if (existing && repId) {
        return prev.map(l => (l as any).repuestoId === repId
          ? { ...l, cantidad: l.cantidad + addRepCant }
          : l);
      }
      return [...prev, {
        id: `lc${Date.now()}`, tipo: addTipo,
        descripcion: desc, cantidad: addTipo === 'repuesto' ? addRepCant : addRepCant,
        precioUnitario: precio,
        ...(repId ? { repuestoId: repId } : {}),
      } as LineaCotizacion];
    });

    setAddRepId(''); setAddDesc(''); setAddPrecio(0); setAddRepCant(1);
    toast.success('Ítem agregado a la cotización');
  };

  // ── Save progress ──
  const handleGuardar = () => {
    if (!diagnostico.trim()) { toast.error('El diagnóstico técnico es obligatorio'); return; }
    const diag = recomendaciones.trim()
      ? `${diagnostico}\n\n📋 Recomendaciones: ${recomendaciones}`
      : diagnostico;
    updateOrden(orden.id, { diagnostico: diag, fallasAdicionales, fotosDiagnostico: fotosDx });
    log('GUARDAR_DIAGNOSTICO', `Diagnóstico guardado para ${orden.numero}`, orden.id);
    toast.success('Diagnóstico guardado');
  };

  // ── Send quotation to client ──
  const handleEnviarCotizacion = () => {
    if (!diagnostico.trim()) { toast.error('El diagnóstico técnico es obligatorio'); return; }
    if (lineas.length === 0) { toast.error('Agrega al menos una línea a la cotización'); return; }

    const diag = recomendaciones.trim()
      ? `${diagnostico}\n\n📋 Recomendaciones: ${recomendaciones}`
      : diagnostico;

    // Reserve stock for parts in quotation
    const repuestosReq: RepuestoUsado[] = lineas
      .filter(l => l.tipo === 'repuesto' && (l as any).repuestoId)
      .map(l => {
        const rep = repuestos.find(r => r.id === (l as any).repuestoId);
        return rep ? { repuestoId: rep.id, nombre: rep.nombre, cantidad: l.cantidad, precio: rep.precio } : null;
      }).filter(Boolean) as RepuestoUsado[];

    if (repuestosReq.length > 0) {
      reservarRepuestos(repuestosReq, orden.id);
    }

    const cotizacion: Cotizacion = {
      lineas,
      estado: 'enviada',
      costoDiagnostico,
      fechaEnvio: new Date().toISOString().split('T')[0],
    };

    updateOrden(orden.id, {
      diagnostico: diag,
      fallasAdicionales,
      fotosDiagnostico: fotosDx,
      cotizacion,
      repuestosReservados: repuestosReq,
      estado: 'esperando_aprobacion',
    });

    // Notify client
    addNotificacion({
      tipo: 'cotizacion_pendiente',
      titulo: '¡Cotización lista para tu aprobación!',
      mensaje: `La cotización de ${orden.numero} está lista. Total: $${totalConIVA.toFixed(2)}. Ingresa a tu portal para aprobar o rechazar.`,
      paraRol: ['cliente'],
      paraUsuarioId: cli?.usuarioId,
      referenciaId: orden.id,
    });

    log('ENVIAR_COTIZACION', `Cotización $${totalConIVA.toFixed(2)} enviada para ${orden.numero}. OT → ESPERANDO_APROBACION`, orden.id);
    toast.success('✅ Cotización enviada al cliente. OT en espera de aprobación.');
  };

  // ── Reparación (en_reparacion) ──
  const [reparacion, setReparacion] = useState(orden.reparacion || '');
  const [fotosRep, setFotosRep] = useState<string[]>(orden.fotosReparacion || []);
  const fotoRepRef = useRef<HTMLInputElement>(null);
  const [repUsados, setRepUsados] = useState<RepuestoUsado[]>(orden.repuestosUsados || []);
  const [addRepUsId, setAddRepUsId] = useState('');
  const [addRepUsCant, setAddRepUsCant] = useState(1);

  const handleAddRepUsado = () => {
    const rep = repuestos.find(r => r.id === addRepUsId);
    if (!rep) { toast.error('Selecciona un repuesto'); return; }
    if (addRepUsCant > rep.cantidad) { toast.error(`Solo hay ${rep.cantidad} unidades disponibles`); return; }
    const ok = registrarSalidaRepuesto(addRepUsId, addRepUsCant, orden.id);
    if (!ok) { toast.error('No se pudo registrar la salida'); return; }
    setRepUsados(prev => {
      const ex = prev.find(r => r.repuestoId === addRepUsId);
      return ex ? prev.map(r => r.repuestoId === addRepUsId ? { ...r, cantidad: r.cantidad + addRepUsCant } : r)
        : [...prev, { repuestoId: addRepUsId, nombre: rep.nombre, cantidad: addRepUsCant, precio: rep.precio }];
    });
    setAddRepUsId(''); setAddRepUsCant(1);
    toast.success(`${rep.nombre} registrado`);
  };

  const handleEnviarQC = () => {
    if (!reparacion.trim()) { toast.error('Describe los trabajos realizados'); return; }
    if (fotosRep.length === 0) { toast.error('Las fotos de la reparación son obligatorias'); return; }
    updateOrden(orden.id, { reparacion, repuestosUsados: repUsados, fotosReparacion: fotosRep, estado: 'control_calidad' });
    log('ENVIAR_QC', `Reparación completada en ${orden.numero}. OT → CONTROL_CALIDAD`, orden.id);
    toast.success('✅ Reparación enviada a Control de Calidad');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-violet-600 to-violet-700 text-white">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-bold text-xl">{orden.numero}</h2>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold bg-white/20`}>{cfg.label}</span>
            </div>
            <div className="flex items-center gap-3 text-violet-200 text-sm flex-wrap">
              <span className="flex items-center gap-1"><User size={13} /> {cli?.nombre}</span>
              <span className="flex items-center gap-1"><Car size={13} /> {veh?.placa} · {veh?.marca} {veh?.modelo} {veh?.año}</span>
            </div>
            {mec && <p className="text-xs text-violet-200 mt-0.5">Mecánico: {mec.nombre}</p>}
          </div>
          <div className="text-right">
            <p className="text-xs text-violet-300">Creada</p>
            <p className="text-sm font-medium">{orden.fechaCreacion}</p>
          </div>
        </div>
      </div>

      {/* Problem */}
      <div className="px-6 py-3 bg-amber-50 border-b border-amber-100">
        <p className="text-xs font-bold text-amber-700 uppercase mb-1">Problema reportado por el cliente</p>
        <p className="text-sm text-amber-900">{orden.descripcionProblema}</p>
      </div>

      {/* Reception info */}
      {orden.recepcion && (
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-xs font-bold text-gray-500 uppercase mb-2">Datos de Recepción</p>
          <div className="grid grid-cols-4 gap-3 text-xs text-gray-600">
            <div><span className="font-medium">KM:</span> {orden.recepcion.kilometraje}</div>
            <div><span className="font-medium">Combustible:</span> {['E','¼','½','¾','F'][orden.recepcion.nivelCombustible]}</div>
            <div><span className="font-medium">Aceite:</span> <span className={orden.recepcion.aceite === 'bueno' ? 'text-green-600' : 'text-red-600'}>{orden.recepcion.aceite}</span></div>
            <div><span className="font-medium">Frenos:</span> <span className={orden.recepcion.frenos === 'bueno' ? 'text-green-600' : 'text-red-600'}>{orden.recepcion.frenos}</span></div>
            {orden.recepcion.dañosPreexistentes && (
              <div className="col-span-4"><span className="font-medium">Daños preexistentes:</span> {orden.recepcion.dañosPreexistentes}</div>
            )}
          </div>
          {(orden.fotosRecepcion?.length || orden.recepcion.fotos?.length) ? (
            <PhotoGrid photos={orden.fotosRecepcion || orden.recepcion.fotos || []} />
          ) : null}
        </div>
      )}

      <div className="px-6 py-5 space-y-7">

        {/* ═══════════════ DIAGNÓSTICO (en_diagnostico) ═══════════════ */}
        {orden.estado === 'en_diagnostico' && (
          <>
            {!canEdit && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2 text-sm text-amber-700">
                <AlertTriangle size={14} /> Solo el mecánico asignado puede completar el diagnóstico
              </div>
            )}

            <Section num={1} title="Diagnóstico Técnico *" color="violet">
              <textarea value={diagnostico} onChange={e => setDiagnostico(e.target.value)}
                disabled={!canEdit} rows={5} className={taCls + (!canEdit ? ' bg-gray-50 cursor-not-allowed' : '')}
                placeholder="Describe detalladamente los hallazgos técnicos:&#10;• Estado de componentes revisados&#10;• Causa raíz del problema reportado&#10;• Sistema(s) afectados" />
            </Section>

            <Section num={2} title="Fallas Adicionales Encontradas" color="orange">
              <textarea value={fallasAdicionales} onChange={e => setFallasAdicionales(e.target.value)}
                disabled={!canEdit} rows={3} className={taCls + (!canEdit ? ' bg-gray-50 cursor-not-allowed' : '')}
                placeholder="Otros problemas detectados durante la inspección que no fueron el motivo de ingreso..." />
            </Section>

            <Section num={3} title="Recomendaciones para el Cliente" color="blue">
              <textarea value={recomendaciones} onChange={e => setRecomendaciones(e.target.value)}
                disabled={!canEdit} rows={2} className={`${taCls} focus:ring-blue-500` + (!canEdit ? ' bg-gray-50 cursor-not-allowed' : '')}
                placeholder="Mantenimientos futuros recomendados, cuidados del vehículo, próximas revisiones sugeridas..." />
            </Section>

            <Section num={4} title="Severidad del Diagnóstico" color="amber">
              <div className="flex gap-3">
                {(['leve', 'moderada', 'grave'] as const).map(s => (
                  <button key={s} onClick={() => canEdit && setSeveridad(s)} type="button"
                    disabled={!canEdit}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 capitalize transition-all ${severidad === s
                      ? s === 'leve' ? 'bg-green-100 border-green-500 text-green-800'
                        : s === 'moderada' ? 'bg-amber-100 border-amber-500 text-amber-800'
                        : 'bg-red-100 border-red-500 text-red-800'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    } ${!canEdit ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                    {s === 'leve' ? '🟢' : s === 'moderada' ? '🟡' : '🔴'} {s}
                  </button>
                ))}
              </div>
            </Section>

            {/* Fotos del diagnóstico */}
            <Section num={5} title="Fotos del Diagnóstico" color="blue">
              <p className="text-xs text-gray-400">Fotografía las partes inspeccionadas, fallas encontradas, componentes dañados</p>
              {fotosDx.length > 0 && <PhotoGrid photos={fotosDx} onRemove={i => setFotosDx(prev => prev.filter((_, j) => j !== i))} />}
              {canEdit && (
                <>
                  <input ref={fotoRef} type="file" accept="image/*" multiple className="hidden"
                    onChange={async e => { const n = await readFilesAsBase64(e.target.files); setFotosDx(prev => [...prev, ...n]); }} />
                  <button onClick={() => fotoRef.current?.click()}
                    className="w-full mt-2 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-violet-400 hover:text-violet-600 flex items-center justify-center gap-2">
                    <Camera size={14} /> {fotosDx.length > 0 ? `${fotosDx.length} foto(s) · Agregar más` : 'Agregar fotos del diagnóstico'}
                  </button>
                </>
              )}
            </Section>

            {/* Costo diagnóstico */}
            <Section num={6} title="Costo del Diagnóstico" color="green">
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1">Monto a cobrar si el cliente rechaza la reparación</p>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-sm">$</span>
                    <input type="number" value={costoDiagnostico} onChange={e => setCostoDiagnostico(Number(e.target.value))}
                      disabled={!canEdit} min={0} step={0.01}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-xl text-base font-bold text-center focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100" />
                    <span className="text-xs text-gray-400">+ IVA = ${(costoDiagnostico * 1.12).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </Section>

            {/* Cotización de repuestos y trabajos */}
            <Section num={7} title="Cotización de Repuestos y Trabajos" color="green">
              {/* Existing lines */}
              <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <p className="text-sm font-bold text-gray-700">Presupuesto</p>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Total con IVA 12%</p>
                    <p className="text-xl font-bold text-gray-900">${totalConIVA.toFixed(2)}</p>
                  </div>
                </div>

                {lineas.length === 0 ? (
                  <p className="py-6 text-center text-sm text-gray-400">Agrega repuestos y trabajos a la cotización</p>
                ) : (
                  <>
                    {/* Summary by type */}
                    <div className="grid grid-cols-3 gap-0 border-b border-gray-100">
                      {[
                        { label: 'Repuestos', val: totalRep, color: 'text-blue-700 bg-blue-50' },
                        { label: 'Mano de obra', val: totalMO, color: 'text-orange-700 bg-orange-50' },
                        { label: 'Diagnóstico', val: totalDx, color: 'text-violet-700 bg-violet-50' },
                      ].map(s => (
                        <div key={s.label} className={`px-3 py-2 ${s.color} text-center`}>
                          <p className="text-xs opacity-70">{s.label}</p>
                          <p className="font-bold text-sm">${s.val.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>

                    {lineas.map(l => (
                      <div key={l.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${l.tipo === 'repuesto' ? 'bg-blue-100 text-blue-700' : l.tipo === 'diagnostico' ? 'bg-violet-100 text-violet-700' : 'bg-orange-100 text-orange-700'}`}>
                          {l.tipo === 'mano_de_obra' ? 'M.O.' : l.tipo === 'diagnostico' ? 'Diag.' : '🔩 Rep.'}
                        </span>
                        <span className="flex-1 text-sm text-gray-800">{l.descripcion}</span>
                        <span className="text-xs text-gray-400">× {l.cantidad} @ ${l.precioUnitario.toFixed(2)}</span>
                        <span className="text-sm font-bold text-gray-900">${(l.cantidad * l.precioUnitario).toFixed(2)}</span>
                        {canEdit && (
                          <button onClick={() => setLineas(prev => prev.filter(x => x.id !== l.id))}
                            className="text-gray-300 hover:text-red-500 flex-shrink-0"><X size={13} /></button>
                        )}
                      </div>
                    ))}
                    <div className="px-4 py-3 bg-gray-50 space-y-1">
                      <div className="flex justify-between text-xs text-gray-500"><span>Subtotal</span><span>${totalCot.toFixed(2)}</span></div>
                      <div className="flex justify-between text-xs text-gray-500"><span>IVA 12%</span><span>${(totalCot * 0.12).toFixed(2)}</span></div>
                      <div className="flex justify-between font-bold text-gray-800 text-base"><span>TOTAL</span><span>${totalConIVA.toFixed(2)}</span></div>
                    </div>
                  </>
                )}
              </div>

              {/* Add line form */}
              {canEdit && (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 space-y-3 mt-3">
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">+ Añadir ítem</p>
                  <div className="flex gap-2">
                    {(['repuesto', 'mano_de_obra', 'diagnostico'] as const).map(t => (
                      <button key={t} type="button" onClick={() => { setAddTipo(t); setAddRepId(''); setAddDesc(''); setAddPrecio(0); }}
                        className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all ${addTipo === t ? (t === 'repuesto' ? 'bg-blue-600 border-blue-600 text-white' : t === 'mano_de_obra' ? 'bg-orange-500 border-orange-500 text-white' : 'bg-violet-600 border-violet-600 text-white') : 'border-gray-300 text-gray-600 hover:border-gray-400'}`}>
                        {t === 'repuesto' ? '🔩 Repuesto' : t === 'mano_de_obra' ? '🔧 Mano de Obra' : '🔍 Diagnóstico'}
                      </button>
                    ))}
                  </div>

                  {addTipo === 'repuesto' ? (
                    <select value={addRepId} onChange={e => {
                      const rep = repuestos.find(r => r.id === e.target.value);
                      setAddRepId(e.target.value);
                      if (rep) setAddPrecio(rep.precio);
                    }} className={inCls}>
                      <option value="">Seleccionar del inventario...</option>
                      {repuestos.map(r => {
                        const disp = r.cantidad - r.cantidadReservada;
                        return (
                          <option key={r.id} value={r.id}>
                            {r.nombre} — Disp: {disp} — ${r.precio.toFixed(2)}/u {disp === 0 ? '⚠️ AGOTADO' : ''}
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <input value={addDesc} onChange={e => setAddDesc(e.target.value)}
                      placeholder={addTipo === 'mano_de_obra' ? 'Ej: Revisión sistema de frenos' : 'Ej: Diagnóstico computarizado'}
                      className={inCls} />
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Cantidad / Horas</label>
                      <input type="number" value={addRepCant} onChange={e => setAddRepCant(Number(e.target.value))}
                        min={0.5} step={0.5} className={inCls} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Precio unitario ($)</label>
                      <input type="number" value={addPrecio} onChange={e => setAddPrecio(Number(e.target.value))}
                        min={0} step={0.01} readOnly={addTipo === 'repuesto' && !!addRepId}
                        className={`${inCls} ${addTipo === 'repuesto' && addRepId ? 'bg-gray-50' : ''}`} />
                    </div>
                  </div>

                  {(addDesc || addRepId) && addPrecio > 0 && (
                    <div className="flex justify-between text-sm bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                      <span className="text-blue-700">{addTipo === 'repuesto' ? repuestos.find(r => r.id === addRepId)?.nombre : addDesc} × {addRepCant}</span>
                      <span className="font-bold text-blue-800">${(addRepCant * addPrecio).toFixed(2)}</span>
                    </div>
                  )}

                  <button onClick={handleAddLinea}
                    className="w-full py-2.5 bg-gray-800 text-white rounded-xl text-sm font-semibold hover:bg-gray-700 flex items-center justify-center gap-2">
                    <Plus size={14} /> Agregar a cotización
                  </button>
                </div>
              )}
            </Section>

            {/* Action buttons */}
            {canEdit && (
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button onClick={handleGuardar}
                  className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm hover:bg-gray-50">
                  <Save size={14} /> Guardar borrador
                </button>
                <button onClick={handleEnviarCotizacion}
                  disabled={!diagnostico.trim() || lineas.length === 0}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${diagnostico.trim() && lineas.length > 0 ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-md' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                  <Send size={15} />
                  Enviar Cotización al Cliente — ${totalConIVA.toFixed(2)}
                </button>
              </div>
            )}

            {/* Already sent — show read-only summary */}
            {!canEdit && orden.cotizacion?.estado === 'enviada' && (
              <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
                <p className="text-xs font-bold text-violet-700 uppercase mb-2">Cotización enviada al cliente</p>
                <p className="text-sm text-violet-800">Esperando respuesta del cliente. Total: <strong>${(totalConIVA).toFixed(2)}</strong></p>
                <p className="text-xs text-violet-500 mt-1">Enviada: {orden.cotizacion.fechaEnvio}</p>
              </div>
            )}
          </>
        )}

        {/* ═══════════════ REPARACIÓN (en_reparacion) ═══════════════ */}
        {orden.estado === 'en_reparacion' && (
          <>
            {/* QC rejection feedback */}
            {orden.controlCalidad && !orden.controlCalidad.aprobado && (
              <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle size={16} className="text-red-600" />
                  <p className="font-bold text-red-800">Revisión requerida — QC Rechazado</p>
                </div>
                <p className="text-sm text-red-700">{orden.controlCalidad.observaciones}</p>
                <p className="text-xs text-red-500 mt-1">Corrige las observaciones y vuelve a enviar a Control de Calidad</p>
              </div>
            )}

            {/* Approved quote summary */}
            {orden.cotizacion && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-xs font-bold text-green-700 uppercase mb-2 flex items-center gap-1">
                  <CheckCircle size={11} /> Trabajos aprobados por el cliente
                </p>
                <div className="space-y-1">
                  {orden.cotizacion.lineas.map(l => (
                    <div key={l.id} className="flex justify-between text-sm text-green-800">
                      <span>{l.descripcion} × {l.cantidad}</span>
                      <span className="font-medium">${(l.cantidad * l.precioUnitario).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Section num={1} title="Descripción de trabajos realizados *" color="orange">
              <textarea value={reparacion} onChange={e => setReparacion(e.target.value)} rows={5}
                className={`${taCls} focus:ring-orange-400`}
                placeholder="Describe cada trabajo realizado:&#10;• Piezas cambiadas / reparadas&#10;• Procedimientos ejecutados&#10;• Resultado de cada intervención" />
            </Section>

            <Section num={2} title="Repuestos utilizados" color="blue">
              {repUsados.length > 0 && (
                <div className="border border-gray-200 rounded-xl overflow-hidden mb-2">
                  {repUsados.map(r => (
                    <div key={r.repuestoId} className="flex justify-between text-sm px-4 py-2.5 border-b border-gray-100 last:border-0">
                      <span className="text-gray-700">{r.nombre}</span>
                      <span className="text-gray-500">× {r.cantidad} — <strong>${(r.cantidad * r.precio).toFixed(2)}</strong></span>
                    </div>
                  ))}
                  <div className="px-4 py-2 bg-gray-50 flex justify-between text-sm font-bold text-gray-800">
                    <span>Total repuestos</span>
                    <span>${repUsados.reduce((s, r) => s + r.cantidad * r.precio, 0).toFixed(2)}</span>
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <select value={addRepUsId} onChange={e => setAddRepUsId(e.target.value)} className="flex-1 px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Seleccionar repuesto...</option>
                  {repuestos.map(r => <option key={r.id} value={r.id}>{r.nombre} (Stock: {r.cantidad}) — ${r.precio}/u</option>)}
                </select>
                <input type="number" value={addRepUsCant} onChange={e => setAddRepUsCant(Number(e.target.value))} min={1}
                  className="w-16 px-2 py-2.5 border border-gray-300 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button onClick={handleAddRepUsado} className="px-3 py-2.5 bg-gray-800 text-white rounded-xl text-sm hover:bg-gray-700 font-medium">+</button>
              </div>
            </Section>

            <Section num={3} title="📸 Fotos de la reparación (OBLIGATORIO)" color="orange">
              <p className="text-xs text-gray-400">Fotografía el antes y después: piezas retiradas, proceso y resultado final</p>
              {fotosRep.length > 0 && <PhotoGrid photos={fotosRep} onRemove={i => setFotosRep(prev => prev.filter((_, j) => j !== i))} />}
              <input ref={fotoRepRef} type="file" accept="image/*" multiple className="hidden"
                onChange={async e => { const n = await readFilesAsBase64(e.target.files); setFotosRep(prev => [...prev, ...n]); }} />
              <button onClick={() => fotoRepRef.current?.click()}
                className={`w-full mt-2 py-2.5 border-2 border-dashed rounded-xl text-sm flex items-center justify-center gap-2 ${fotosRep.length > 0 ? 'border-green-400 text-green-600 hover:bg-green-50' : 'border-orange-300 text-orange-600 hover:border-orange-400 bg-orange-50/30'}`}>
                <Camera size={14} /> {fotosRep.length > 0 ? `${fotosRep.length} foto(s) · Agregar más` : 'Agregar fotos de la reparación'}
              </button>
            </Section>

            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button onClick={() => { updateOrden(orden.id, { reparacion, repuestosUsados: repUsados, fotosReparacion: fotosRep }); toast.success('Guardado'); }}
                className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm hover:bg-gray-50">
                <Save size={14} /> Guardar
              </button>
              <button onClick={handleEnviarQC}
                disabled={!reparacion.trim() || fotosRep.length === 0}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold ${reparacion.trim() && fotosRep.length > 0 ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                <ArrowRight size={15} /> Enviar a Control de Calidad
              </button>
            </div>
          </>
        )}

        {/* Other states: info only */}
        {!['en_diagnostico', 'en_reparacion'].includes(orden.estado) && (
          <div className="text-center py-12 text-gray-400">
            <CheckCircle size={40} className="mx-auto mb-3 text-green-400 opacity-60" />
            <p className="font-medium text-gray-600">OT en estado: <strong>{cfg.label}</strong></p>
            <p className="text-sm mt-1">Esta orden ya no está en diagnóstico o reparación activa</p>
          </div>
        )}

      </div>
    </div>
  );
}