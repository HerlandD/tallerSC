import React, { useState } from 'react';
import {
  BookOpen, GitBranch, Layers, CheckCircle, ArrowRight,
  User, Users, Wrench, ShieldCheck, BarChart3, Package, Calendar,
  ClipboardList, DollarSign, FileText, Bell, Car, Lock, Settings,
  AlertTriangle, ThumbsUp, ThumbsDown, CreditCard, Receipt, Eye,
  ChevronRight, Info, Zap, Circle, Hash, Star, Shield, Monitor,
  Smartphone, Palette, Ruler, MousePointer, Database, ChevronDown
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type DocTab = 'workflow' | 'requisitos' | 'interfaz' | 'roles' | 'credenciales' | 'pantallas' | 'rfd';

// ─── Constants ────────────────────────────────────────────────────────────────
const ROLE_CFG = {
  administrador: { label: 'Administrador',  color: 'bg-purple-100 text-purple-800 border-purple-300', dot: 'bg-purple-500' },
  asesor:        { label: 'Asesor',         color: 'bg-blue-100 text-blue-800 border-blue-300',       dot: 'bg-blue-500' },
  mecanico:      { label: 'Mecánico',       color: 'bg-orange-100 text-orange-800 border-orange-300', dot: 'bg-orange-500' },
  jefe_taller:   { label: 'Jefe de Taller', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', dot: 'bg-emerald-500' },
  cliente:       { label: 'Cliente',        color: 'bg-slate-100 text-slate-700 border-slate-300',    dot: 'bg-slate-500' },
};

const ESTADO_CFG: Record<string, { label: string; bg: string; color: string; border: string; hex: string }> = {
  registrada:              { label: 'Registrada',       bg: 'bg-gray-100',    color: 'text-gray-700',   border: 'border-gray-300',   hex: '#f3f4f6 / #374151' },
  en_diagnostico:          { label: 'En Diagnóstico',   bg: 'bg-violet-100',  color: 'text-violet-700', border: 'border-violet-300', hex: '#ede9fe / #6d28d9' },
  esperando_aprobacion:    { label: 'Esp. Aprobación',  bg: 'bg-amber-100',   color: 'text-amber-700',  border: 'border-amber-300',  hex: '#fef3c7 / #b45309' },
  en_reparacion:           { label: 'En Reparación',    bg: 'bg-cyan-100',    color: 'text-cyan-700',   border: 'border-cyan-300',   hex: '#cffafe / #0e7490' },
  liquidacion_diagnostico: { label: 'Liq. Diagnóstico', bg: 'bg-red-100',     color: 'text-red-700',    border: 'border-red-300',    hex: '#fee2e2 / #b91c1c' },
  control_calidad:         { label: 'Control Calidad',  bg: 'bg-purple-100',  color: 'text-purple-700', border: 'border-purple-300', hex: '#f3e8ff / #7c3aed' },
  liberada:                { label: 'Liberada',         bg: 'bg-emerald-100', color: 'text-emerald-700',border: 'border-emerald-300',hex: '#d1fae5 / #047857' },
  finalizada:              { label: 'Finalizada',       bg: 'bg-slate-100',   color: 'text-slate-600',  border: 'border-slate-200',  hex: '#f1f5f9 / #475569' },
  cancelada:               { label: 'Cancelada',        bg: 'bg-red-50',      color: 'text-red-500',    border: 'border-red-200',    hex: '#fef2f2 / #ef4444' },
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function RolBadge({ rol }: { rol: keyof typeof ROLE_CFG }) {
  const cfg = ROLE_CFG[rol];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-semibold ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}/>{cfg.label}
    </span>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  const cfg = ESTADO_CFG[estado] || { label: estado, bg: 'bg-gray-100', color: 'text-gray-700', border: 'border-gray-200', hex: '' };
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-semibold ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      {cfg.label}
    </span>
  );
}

function SectionTitle({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      {icon && <div className="w-9 h-9 bg-slate-800 text-white rounded-xl flex items-center justify-center flex-shrink-0">{icon}</div>}
      <h2 className="text-xl font-bold text-slate-800">{children}</h2>
    </div>
  );
}

function InfoBox({ type, children }: { type: 'warning' | 'info' | 'success'; children: React.ReactNode }) {
  const styles = {
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  };
  const icons = { warning: <AlertTriangle size={13}/>, info: <Info size={13}/>, success: <CheckCircle size={13}/> };
  return (
    <div className={`flex items-start gap-2 border rounded-lg px-3 py-2.5 text-xs ${styles[type]}`}>
      <span className="flex-shrink-0 mt-0.5">{icons[type]}</span>
      <span>{children}</span>
    </div>
  );
}

// ─── TAB 1: WORKFLOW ─────────────────────────────────────────────────────────

function WorkflowStep({
  number, title, actor, description, estados = [], actions = [], next = [], warning, ruta
}: {
  number: number; title: string; actor: keyof typeof ROLE_CFG;
  description: string; estados?: string[]; actions?: string[];
  next?: string[]; warning?: string; ruta?: string;
}) {
  return (
    <div className="relative">
      <div className="absolute left-5 top-14 bottom-0 w-0.5 bg-slate-200 z-0"/>
      <div className="relative z-10 flex gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-sm shadow-md">
          {number}
        </div>
        <div className="flex-1 pb-8">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-slate-800">{title}</h3>
                {ruta && <span className="text-xs font-mono bg-slate-800 text-cyan-300 px-2 py-0.5 rounded-lg">{ruta}</span>}
              </div>
              <RolBadge rol={actor}/>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-sm text-slate-600">{description}</p>
              {estados.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Estados:</span>
                  {estados.map(e => <EstadoBadge key={e} estado={e}/>)}
                </div>
              )}
              {actions.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Acciones y elementos en el sistema:</p>
                  <ul className="space-y-1">
                    {actions.map(a => (
                      <li key={a} className="flex items-start gap-2 text-xs text-slate-600">
                        <CheckCircle size={11} className="text-emerald-500 flex-shrink-0 mt-0.5"/>{a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {warning && <InfoBox type="warning">{warning}</InfoBox>}
              {next.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Continúa en:</span>
                  {next.map(n => (
                    <span key={n} className="text-xs bg-slate-800 text-white px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                      <ArrowRight size={9}/>{n}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkflowTab() {
  const steps = [
    {
      number: 1, title: 'Login y Autenticación', actor: 'administrador' as const, ruta: '/login',
      description: 'Página de doble portal: "Portal Empresa" (staff) y "Portal Cliente". El staff ingresa usuario + contraseña y es redirigido a su dashboard específico. El cliente es redirigido automáticamente a /portal (nunca al Dashboard de staff). El sistema bloquea rutas con protección por rol.',
      actions: [
        'Tab "Portal Empresa": formulario con usuario y contraseña + grid de credenciales demo',
        'Tab "Portal Cliente": login propio + formulario de registro como nuevo cliente',
        'Redirección post-login: Admin/Asesor/Mecánico/Jefe → /  | Cliente → /portal',
        'Validación de campo vacío con toast.error() antes de enviar',
        'Credenciales incorrectas: mensaje de error inline (no toast)',
        'Botón "Cerrar sesión" en sidebar para todos los roles → /login',
        'Protección de rutas: cliente no puede acceder a /ordenes, /clientes, etc.',
      ],
      next: ['Dashboard del rol asignado'],
      warning: 'v37 FIX: el cliente siempre aterriza en /portal. Si intenta acceder a / directamente, Layout.tsx lo redirige a /portal automáticamente.',
    },
    {
      number: 2, title: 'Portal del Cliente — Navegación', actor: 'cliente' as const, ruta: '/portal',
      description: 'El cliente ve una página única con scroll vertical. El sidebar muestra solo 2 ítems: "Inicio" (/portal) y "Mis Facturas" (/facturas). El portal integra todas las secciones en una sola pantalla con acceso rápido.',
      actions: [
        'Header con nombre del cliente, badge "Cliente" y botón de notificaciones',
        'Sección "Inicio": 4 KPIs (Mis vehículos, Servicios activos, Próxima cita, Sin leer)',
        'Banner automático de alerta si hay cotizaciones pendientes de aprobación',
        'Banner verde si hay un vehículo listo para recoger',
        'Sección "Mis Vehículos" con cards clickeables para historial de servicio',
        'Sección "Mis Servicios" con OTs activas en timeline de pasos simplificado',
        'Sección "Mis Citas" con botón "+ Agendar Cita"',
        'Sección "Notificaciones" filtradas solo para el cliente logueado',
        'Sección "Mi Perfil" con datos personales editables',
      ],
      next: ['Solicitar Cita', 'Aprobar/Rechazar Cotización', 'Pagar y Recoger'],
    },
    {
      number: 3, title: 'Solicitud y Gestión de Citas', actor: 'asesor' as const, ruta: '/citas',
      description: 'El cliente solicita una cita desde su Portal. El Asesor la gestiona en /citas. Al confirmar y llegar el vehículo, convierte la cita en OT.',
      estados: [],
      actions: [
        'CLIENTE: Botón "+ Agendar Cita" en portal → modal con selector de vehículo, tipo de servicio, fecha, hora, motivo',
        'Cita creada en estado PENDIENTE visible inmediatamente para el Asesor',
        'ASESOR: Vista de agenda con citas agrupadas por día',
        'Botón "Confirmar" → estado CONFIRMADA (color verde)',
        'Botón "Abrir OT" en citas confirmadas → wizard de nueva OT prellenado con datos de cita',
        'Botón "Cancelar" con confirmación → estado CANCELADA (soft-delete)',
        'Filtros: Pendientes / Confirmadas / En progreso / Completadas / Canceladas',
      ],
      next: ['Apertura de Orden de Trabajo'],
    },
    {
      number: 4, title: 'Apertura de Orden de Trabajo (Wizard 3 pasos)', actor: 'asesor' as const, ruta: '/ordenes',
      description: 'El Asesor presiona "+ Nueva OT" y completa un wizard de 3 pasos. Al finalizar se crea la OT en estado REGISTRADA con número correlativo OT-001, OT-002, etc.',
      estados: ['registrada'],
      actions: [
        'Botón "+ Nueva OT" — bg-slate-800 text-white, esquina superior derecha — visible SOLO para Asesor',
        'PASO 1 (Cliente): Buscador por nombre, CI o teléfono. Botón "Registrar nuevo cliente" en formulario inline',
        'PASO 2 (Vehículo): Lista de vehículos del cliente. Botón "Registrar vehículo" con campos: placa, marca, modelo, año, color, KM',
        'PASO 3 (Problema): Selector de tipo de servicio (catálogo) + textarea de descripción',
        'Indicadores de progreso: círculos numerados 1-2-3 con check verde al completar',
        'OT creada con: número auto-generado, clienteId, vehiculoId, estado=registrada, fechaCreacion, creadoPor',
        'Registro de auditoría automático: CREAR_OT con todos los detalles',
        'Toast verde "✅ Orden de trabajo creada correctamente"',
      ],
      next: ['Recepción del Vehículo', 'Asignación de Mecánico'],
      warning: 'Solo el ASESOR tiene el botón "+ Nueva OT". Admin, Jefe y Mecánico no pueden crear OTs.',
    },
    {
      number: 5, title: 'Recepción del Vehículo', actor: 'asesor' as const, ruta: '/ordenes → modal OT',
      description: 'El Asesor abre la OT en estado REGISTRADA y completa el formulario de recepción formal. Al guardar, la OT avanza automáticamente a EN_DIAGNOSTICO.',
      estados: ['registrada', 'en_diagnostico'],
      actions: [
        'Panel "Recepción del Vehículo" — visible SOLO para Asesor en estado REGISTRADA',
        'Campo de kilometraje actual (text input)',
        'Slider de nivel de combustible: 0→Vacío / 1→¼ / 2→½ / 3→¾ / 4→Lleno',
        'Selectores radio: aceite (Bueno/Bajo/Malo), refrigerante, frenos',
        'Textarea "Daños preexistentes" y textarea "Inventario del habitáculo"',
        'Botón "📷 Subir fotos de recepción" — abre file picker múltiple (hasta 10 fotos)',
        'Grid de fotos 4 columnas con preview y botón de eliminar por foto',
        'Botón "💾 Guardar Recepción → DIAGNÓSTICO" — bg-cyan-600 text-white',
      ],
      warning: 'El Administrador ve este panel en modo SOLO LECTURA con badge "🔒 Solo lectura" en el header del modal.',
    },
    {
      number: 6, title: 'Asignación de Mecánico', actor: 'jefe_taller' as const, ruta: '/ordenes → modal OT',
      description: 'El Jefe de Taller ve las OTs sin mecánico resaltadas con punto rojo. En el modal de la OT aparece el panel de asignación exclusivo.',
      estados: ['registrada', 'en_diagnostico'],
      actions: [
        'KPI "Sin Asignar" en Dashboard del Jefe — borde rojo pulsante cuando > 0',
        'Indicador rojo pulsante (animate-pulse) en filas de OT sin mecánico en la lista',
        'Panel "Asignar Mecánico" — visible SOLO para Jefe de Taller',
        'Dropdown de mecánicos activos: nombre + carga actual de OTs entre paréntesis',
        'Botón "✓ Asignar Mecánico" — bg-slate-800 text-white',
        'Una vez asignado: campo bloqueado, muestra nombre del mecánico con badge naranja',
        'Notificación push automática al mecánico: tipo "nueva_asignacion" con detalles de OT',
        'Registro de auditoría: ASIGNAR_MECANICO con nombre del mecánico y número de OT',
      ],
      next: ['Diagnóstico Técnico'],
      warning: 'Solo el JEFE puede asignar mecánicos. El Admin NO tiene este panel disponible.',
    },
    {
      number: 7, title: 'Diagnóstico Técnico del Mecánico', actor: 'mecanico' as const, ruta: '/diagnostico y /ordenes',
      description: 'El Mecánico tiene DOS páginas exclusivas: /ordenes (su panel de trabajo separado por estado) y /diagnostico (interfaz de diagnóstico en dos columnas). En ambas, SOLO ve sus propias OTs asignadas — nunca las de otros mecánicos.',
      estados: ['en_diagnostico', 'esperando_aprobacion'],
      actions: [
        'Sidebar del mecánico: "Mis Órdenes" (/ordenes) + "Diagnóstico" (/diagnostico) + "Inventario"',
        '/ordenes: Panel MecanicoWorkPanel con OTs separadas por sección (Diagnóstico / Reparación / Esperando / Completadas)',
        '/diagnostico: Layout dos columnas — lista de OTs a la izquierda, detalle a la derecha',
        'Filtro estricto: solo OTs donde mecanicoId === currentUser.id O mecanicosIds includes currentUser.id',
        'Lista vacía muestra: "No tienes órdenes asignadas — El jefe de taller te asignará nuevas órdenes"',
        'Panel de diagnóstico: textarea de diagnóstico principal + textarea de fallas adicionales',
        'Subida de fotos de diagnóstico (múltiples, preview en grid 4col)',
        'Constructor de cotización: búsqueda de repuesto por nombre + tipo (Repuesto/MO/Diagnóstico) + cantidad + precio unitario',
        'Cálculo automático de subtotal por línea y total general',
        'Campo "Costo de diagnóstico" (monto fijo cobrado si el cliente rechaza)',
        'Botón "✈ Enviar cotización al cliente" → OT a ESPERANDO_APROBACION + reserva de stock',
      ],
      next: ['Aprobación del Cliente'],
      warning: 'v37 FIX CRÍTICO: El filtro de mecánico es estricto. Un mecánico NO PUEDE ver OTs de compañeros en ninguna vista del sistema.',
    },
    {
      number: 8, title: 'Aprobación o Rechazo de Cotización', actor: 'cliente' as const, ruta: '/portal → sección Mis Servicios',
      description: 'El cliente recibe notificación y ve el banner de alerta en su portal. Puede revisar la cotización completa y tomar la decisión de aprobar o rechazar.',
      estados: ['esperando_aprobacion'],
      actions: [
        'Notificación push al cliente: tipo cotizacion_pendiente visible en bell del header',
        'Banner de alerta amarillo automático sobre la sección Mis Servicios del portal',
        'Card de OT expandida con badge "⚡ Requiere tu aprobación"',
        'Tabla de cotización: tipo (Repuesto/MO/Diagnóstico), descripción, cantidad, precio unitario, subtotal',
        'Resumen: subtotal + IVA 12% + TOTAL con IVA',
        'Monto de diagnóstico mostrado claramente: "Si rechazas, pagarás: $XX.XX"',
        'Botón "👍 Aprobar" — bg-emerald-600 text-white, tamaño prominente',
        'Botón "👎 Rechazar" — bg-red-600 text-white',
        'Personal del taller: ve cotización en panel informativo con badge "Pendiente cliente" (no puede actuar)',
      ],
      next: ['En Reparación (aprueba)', 'Liquidación de Diagnóstico (rechaza)'],
    },
    {
      number: 9, title: 'Liquidación por Rechazo del Cliente', actor: 'asesor' as const, ruta: '/ordenes → modal OT',
      description: 'Si el cliente rechazó la cotización, la OT entra en LIQUIDACION_DIAGNOSTICO. Se cobra solo el costo de diagnóstico acordado.',
      estados: ['liquidacion_diagnostico', 'finalizada'],
      actions: [
        'OT cambia a LIQUIDACION_DIAGNOSTICO automáticamente al rechazar',
        'Stock reservado se LIBERA automáticamente (cantidadReservada -= n)',
        'Panel "Liquidación de Diagnóstico" con el monto del diagnóstico fijo',
        'Selector de método de pago: Efectivo / Tarjeta / Transferencia / etc.',
        'Botón "Registrar Pago de Diagnóstico" → genera Factura + OT → FINALIZADA',
        'Factura con número único FAC-XXXXXXXXXX emitida y disponible en /facturas',
      ],
      warning: 'RF-11: El rechazo NO elimina la OT. Queda en FINALIZADA con factura de solo diagnóstico.',
    },
    {
      number: 10, title: 'Ejecución de la Reparación', actor: 'mecanico' as const, ruta: '/ordenes → modal OT',
      description: 'Con cotización aprobada, la OT pasa a EN_REPARACION. El mecánico registra el trabajo realizado y los repuestos usados reales.',
      estados: ['en_reparacion', 'control_calidad'],
      actions: [
        'Panel "Reparación" — visible SOLO para el mecánico asignado en EN_REPARACION',
        'Textarea de descripción del trabajo realizado (guardar parcial permitido)',
        'Sección de repuestos usados: buscador del inventario + agregar por nombre',
        'Descuento automático de stock al registrar repuesto usado (registrarSalidaRepuesto)',
        'Botón "📷 Subir fotos reparación antes/después"',
        'Barra de tareas si la OT tiene subtareas (TareaSubdividida[]): porcentaje completado',
        'Botón "💾 Guardar Reparación" — sin cambiar estado (avance parcial)',
        'Botón "✓ Enviar a Control de Calidad" — bg-slate-800 text-white → estado CONTROL_CALIDAD',
      ],
      next: ['Control de Calidad'],
    },
    {
      number: 11, title: 'Control de Calidad', actor: 'jefe_taller' as const, ruta: '/ordenes → modal OT',
      description: 'El Jefe de Taller revisa la OT completa: diagnóstico, reparación, fotos, repuestos. Decide si el trabajo cumple los estándares.',
      estados: ['control_calidad', 'liberada', 'en_reparacion'],
      actions: [
        'KPI "Control Calidad" en Dashboard del Jefe — pulsante naranja cuando hay OTs pendientes',
        'Panel QC: acceso a TODA la información de la OT (diagnóstico + fotos + reparación)',
        'Checkbox "Prueba de ruta realizada"',
        'Textarea de observaciones (obligatorio si rechaza)',
        'Botón "✅ Aprobar QC y Liberar Vehículo" → OT a LIBERADA + 2 notificaciones automáticas',
        'Notificación al CLIENTE: "¡Tu vehículo está listo para recoger!"',
        'Notificación al ASESOR: "Vehículo listo para entrega — OT-XXX"',
        'Botón "❌ Rechazar — Devolver a Reparación" → OT vuelve a EN_REPARACION',
        'Al rechazar: notificación al mecánico con las observaciones del Jefe',
        'Registro de auditoría: APROBAR_QC o RECHAZAR_QC con observaciones',
      ],
      next: ['Entrega y Cobro'],
      warning: 'Solo el JEFE puede hacer el QC. Admin ve en modo solo lectura.',
    },
    {
      number: 12, title: 'Pago y Entrega del Vehículo', actor: 'asesor' as const, ruta: '/portal (cliente) / /ordenes (asesor)',
      description: 'Con la OT en LIBERADA, existen dos flujos paralelos: el cliente puede pagar en línea desde su portal, o el Asesor registra el pago presencial. Ambos generan factura y finalizan la OT.',
      estados: ['liberada', 'finalizada'],
      actions: [
        'FLUJO CLIENTE: Banner verde prominente en portal "🎉 ¡Tu vehículo está listo!"',
        'FLUJO CLIENTE: Botón "Pagar y Recoger" → modal de pago con 3 métodos',
        'FLUJO CLIENTE: Código de recojo = número de OT (ej. "OT-015")',
        'OT con pagadoEnLinea=true queda en LIBERADA hasta entrega física por el Asesor',
        'FLUJO ASESOR: Panel "Entrega y Cobro" con selector de método de pago y notas de entrega',
        'FLUJO ASESOR: Botón "Registrar Pago y Entregar" → Factura + OT=FINALIZADA + entregaFirmada=true',
        'Factura: número único, fecha, subtotal, IVA 12%, total, método de pago, estado=pagada',
        'Notificación automática al asesor cuando el cliente paga en línea',
      ],
      next: ['OT Finalizada — Ciclo completo'],
    },
    {
      number: 13, title: 'Reportes y Cierre Administrativo', actor: 'administrador' as const, ruta: '/reportes',
      description: 'El Administrador accede a reportes para analizar el rendimiento del taller. Modo solo lectura — no puede operar el flujo de servicio.',
      actions: [
        'Selector de período: Hoy / Esta semana / Este mes / Trimestre / Este año',
        'Tab "Ganancias": ingresos totales, gráfico de área, desglose MO vs Repuestos, % vs mes anterior',
        'Tab "Productividad": tabla de mecánicos con OTs completadas, activas, ingresos y eficiencia %',
        'Tab "Inventario": valor PVP, valor costo, margen bruto, top 5 repuestos, kardex de movimientos',
        'Tab "Auditoría": log completo de acciones del sistema (usuario, acción, módulo, detalles, fecha)',
        'Botón "Exportar PDF" con jsPDF disponible',
        'Gráficos recharts: AreaChart, BarChart, PieChart, LineChart con responsivecontainer',
      ],
    },
  ];

  return (
    <div className="space-y-0">
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-6 mb-8 text-white">
        <h2 className="text-xl font-bold mb-1">Flujo Completo del Sistema TallerPro v38</h2>
        <p className="text-slate-300 text-sm mb-4">
          El flujo oficial de una OT pasa por 9 estados posibles (7 en la ruta principal). Cada estado habilita exactamente a UN rol para actuar.
          v38: nueva pestaña RFD — Diseño con 20 requerimientos funcionales de diseño detallados.
        </p>
        <div className="flex items-center gap-1.5 flex-wrap">
          {['Registrada','En Diagnóstico','Esp. Aprobación','En Reparación','Control Calidad','Liberada','Finalizada'].map((s,i,arr) => (
            <React.Fragment key={s}>
              <span className="text-xs bg-white/15 text-white px-2.5 py-1 rounded-full border border-white/20 font-medium">{s}</span>
              {i < arr.length-1 && <ArrowRight size={11} className="text-slate-400 flex-shrink-0"/>}
            </React.Fragment>
          ))}
        </div>
        <p className="text-slate-400 text-xs mt-3">Rama alternativa: Esp. Aprobación → <span className="text-red-300 font-medium">Liquidación de Diagnóstico</span> → Finalizada (si el cliente rechaza)</p>
      </div>

      {steps.map(step => <WorkflowStep key={step.number} {...step}/>)}

      <div className="flex gap-4 ml-0">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md">
          <CheckCircle size={18}/>
        </div>
        <div className="flex-1 pb-4">
          <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl px-5 py-4">
            <p className="font-bold text-emerald-800">OT FINALIZADA — Ciclo completado ✓</p>
            <p className="text-sm text-emerald-700 mt-1">La OT queda inmutable en estado FINALIZADA con factura generada, historial completo de reparaciones, kardex de movimientos de inventario y registro de auditoría de todas las acciones.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TAB 2: REQUISITOS FUNCIONALES ──────────────────────────────────────────

const RF_DATA = [
  {
    codigo: 'RF-01', titulo: 'Autenticación y Control de Acceso',
    descripcion: 'Login dual (empresa/cliente). Rol asignado automáticamente. Rutas protegidas por rol. Clientes redirigen a /portal.',
    implementacion: 'Login.tsx — dual portal. AppContext.login(). Layout.tsx con useLocation para redirección inteligente. 5 roles con sidebars y dashboards independientes.',
    roles: ['administrador','asesor','mecanico','jefe_taller','cliente'] as const,
    modulo: 'Login.tsx + Layout.tsx + AppContext.tsx',
    detalles: [
      'Doble portal de acceso: "Portal Empresa" y "Portal Cliente" con tabs separados',
      'Grid de credenciales demo para personal (Admin, Asesor, Jefe, Mecánico)',
      'Formulario de registro de cliente en tab "Portal Cliente"',
      'Redirección post-login: cliente → /portal | staff → /',
      'Layout.tsx redirige al cliente de / a /portal automáticamente (useLocation)',
      'Sidebar dinámico: cada rol ve solo sus módulos permitidos',
      'Botón "Cerrar sesión" en sidebar genera log de auditoría LOGOUT',
    ],
  },
  {
    codigo: 'RF-02', titulo: 'Gestión de Usuarios y Personal',
    descripcion: 'Administrador gestiona usuarios del sistema y personal del taller.',
    implementacion: 'ConfigSecurity.tsx con tabs: Personal del Taller, Usuarios y Roles, Catálogos Maestros.',
    roles: ['administrador'] as const,
    modulo: 'ConfigSecurity.tsx',
    detalles: [
      'Tab "Personal": lista de mecánicos y staff con cargo, especialidad y estado (Activo/Inactivo/Vacaciones)',
      'Modal de creación/edición de usuario con rol, contraseña y datos de contacto',
      'Toggle de activación/desactivación (activo=true/false — soft delete)',
      'Tabla de usuarios con badges de rol coloreados y fecha de creación',
      'Tab "Catálogos": marcas de vehículos con modelos, tipos de servicio, métodos de pago',
      '5 mecánicos demo: Juan Pérez (Motor), Carlos Ramos (Frenos), Roberto Ayala (Electricidad), Pedro Naranjo (Carrocería), Sofía Mendoza (Diagnóstico)',
    ],
  },
  {
    codigo: 'RF-03', titulo: 'Registro de Clientes',
    descripcion: 'Asesor registra clientes con CI/NIT único. Disponible también inline en el wizard de OT.',
    implementacion: 'Clients.tsx (módulo completo) + WizardNuevaOT paso 1 (registro rápido). 10 clientes demo en el sistema.',
    roles: ['asesor'] as const,
    modulo: 'Clients.tsx + WizardNuevaOT (paso 1)',
    detalles: [
      'Campos: Nombre, CI, NIT, Teléfono, Email, Dirección',
      'Validación de duplicados por CI y email',
      'Búsqueda en tiempo real por nombre, CI o teléfono',
      'Edición modal con todos los campos editables',
      'Registro inline desde el paso 1 del wizard de nueva OT',
      '10 clientes en datos demo con datos completos (6 con cuenta de portal)',
    ],
  },
  {
    codigo: 'RF-04', titulo: 'Registro de Vehículos',
    descripcion: 'Vehículos vinculados a un cliente. Catálogo de marcas/modelos configurable.',
    implementacion: 'Vehicles.tsx + WizardNuevaOT paso 2. 15 vehículos demo. Selector de marca/modelo desde catálogo.',
    roles: ['asesor'] as const,
    modulo: 'Vehicles.tsx + WizardNuevaOT (paso 2)',
    detalles: [
      'Campos: Placa, Marca, Modelo, Año, Color, Kilometraje, VIN/Chasis',
      'Selector de marca: 11 marcas disponibles. Selector de modelo dependiente de la marca',
      '15 vehículos demo de distintas marcas y clientes',
      'Portal Cliente muestra vehículos propios con historial de servicios clickeable',
      'Vista de vehículos de un cliente en Clients.tsx (expandible)',
    ],
  },
  {
    codigo: 'RF-05', titulo: 'Gestión de Citas',
    descripcion: 'Cliente solicita cita desde su portal. Asesor confirma y convierte a OT.',
    implementacion: 'Appointments.tsx + ClientPortal.tsx sección Mis Citas. 22 citas demo distribuidas en 4 meses.',
    roles: ['cliente','asesor'] as const,
    modulo: 'Appointments.tsx + ClientPortal.tsx',
    detalles: [
      'Estados de cita: Pendiente → Confirmada → En Progreso → Completada | Cancelada',
      '22 citas demo: 12 completadas (ene-mar 2026), 6 en progreso (activas), 4 futuras',
      'Modal de agendamiento: vehículo, tipo servicio, fecha (mín=hoy), hora, motivo',
      'Botón "Abrir OT" en citas confirmadas → wizard prellenado con datos de cita',
      'Dashboard Asesor: agenda del día con contador de citas',
      'Filtro por estado en el listado de citas',
    ],
  },
  {
    codigo: 'RF-06', titulo: 'Apertura de Orden de Trabajo',
    descripcion: 'Asesor crea OT con wizard de 3 pasos. Número auto-generado correlativo.',
    implementacion: 'WizardNuevaOT en WorkOrders.tsx. Solo visible para Asesor. 20 OTs demo (OT-001 a OT-020) en el sistema.',
    roles: ['asesor'] as const,
    modulo: 'WorkOrders.tsx → WizardNuevaOT',
    detalles: [
      'Wizard con indicador de pasos 1-2-3 con check verde al completar',
      'Paso 1: búsqueda de cliente + registro inline de cliente nuevo',
      'Paso 2: selección de vehículo del cliente + registro inline de vehículo nuevo',
      'Paso 3: selector de tipo de servicio + textarea de descripción del problema',
      'Número auto-generado: OT-001, OT-002... (correlativo con padding 3 dígitos)',
      'OT creada con estado REGISTRADA + fechaCreacion + creadoPor = currentUser.id',
      'Registro automático en log de auditoría (CREAR_OT)',
    ],
  },
  {
    codigo: 'RF-07', titulo: 'Asignación de Órdenes a Mecánico',
    descripcion: 'Jefe de Taller asigna mecánico. Notificación automática al mecánico asignado.',
    implementacion: 'PanelAsignacionMecanico en WorkOrders.tsx. SOLO visible para Jefe.',
    roles: ['jefe_taller'] as const,
    modulo: 'WorkOrders.tsx → PanelAsignacionMecanico',
    detalles: [
      'Indicador rojo pulsante (animate-pulse) en OTs sin mecánico en lista y dashboard',
      'Dropdown de mecánicos activos con carga actual entre paréntesis',
      'Una vez asignado: campo bloqueado, muestra nombre del mecánico asignado',
      'Notificación automática al mecánico (tipo nueva_asignacion)',
      'KPI "Sin Asignar" en Dashboard del Jefe con contador en tiempo real',
      '5 mecánicos disponibles para asignación en el sistema demo',
    ],
  },
  {
    codigo: 'RF-08', titulo: 'Diagnóstico Técnico (Mecánico)',
    descripcion: 'Mecánico ve SOLO sus OTs. Registra diagnóstico, fotos y cotización. Doble entrada: /ordenes y /diagnostico.',
    implementacion: 'PanelDiagnostico en WorkOrders.tsx. Diagnostico.tsx (vista dedicada). Filtro estricto por mecanicoId.',
    roles: ['mecanico'] as const,
    modulo: 'WorkOrders.tsx → PanelDiagnostico | Diagnostico.tsx',
    detalles: [
      'Filtro estricto: mecanicoId === currentUser.id || mecanicosIds.includes(currentUser.id)',
      '/ordenes muestra MecanicoWorkPanel con OTs propias separadas por estado',
      '/diagnostico: layout dos columnas — lista a la izquierda, detalle a la derecha',
      'Lista vacía: "No tienes órdenes asignadas — El jefe de taller te asignará nuevas"',
      'Textarea diagnóstico + textarea fallas adicionales + upload de fotos',
      'Constructor cotización: búsqueda de repuesto, tipo, cantidad, precio unitario',
      'Botón "Enviar cotización" → ESPERANDO_APROBACION + reserva automática de stock',
    ],
  },
  {
    codigo: 'RF-09', titulo: 'Generación Automática de Cotización',
    descripcion: 'Constructor línea a línea. 3 tipos: Repuesto (del inventario), Mano de Obra, Diagnóstico.',
    implementacion: 'Constructor de cotización en PanelDiagnostico. Búsqueda en tiempo real. Cálculo automático con IVA 12%.',
    roles: ['mecanico'] as const,
    modulo: 'WorkOrders.tsx → PanelDiagnostico (sección cotización)',
    detalles: [
      'Tipo "Repuesto": buscador del inventario por nombre + precio actual del sistema',
      'Tipo "Mano de Obra": descripción libre + cantidad de horas + precio por hora',
      'Tipo "Diagnóstico": cargo fijo del diagnóstico (cobrado si rechaza)',
      'Cálculo automático: cantidad × precio unitario → subtotal por línea → total',
      'IVA 12% calculado al mostrar al cliente (no en el constructor)',
      'Campo separado "Costo de diagnóstico" (independiente de las líneas)',
      'Reserva automática de stock al enviar: reservarRepuestos() + movimiento en Kardex',
    ],
  },
  {
    codigo: 'RF-10', titulo: 'Aprobación o Rechazo de Cotización',
    descripcion: 'Solo el cliente puede aprobar o rechazar desde su portal. Personal solo puede ver.',
    implementacion: 'PanelAprobacion visible solo para rol CLIENTE. Personal ve panel informativo sin botones de acción.',
    roles: ['cliente'] as const,
    modulo: 'WorkOrders.tsx → PanelAprobacion',
    detalles: [
      'Banner de alerta amarillo automático en Portal Cliente',
      'Tabla completa: tipo, descripción, cantidad, precio unitario, subtotal por línea',
      'Resumen con subtotal + IVA 12% + TOTAL',
      'Costo de diagnóstico mostrado: "Si rechazas pagarás: $XX.XX"',
      'Botón "👍 Aprobar" (bg-emerald-600) + Botón "👎 Rechazar" (bg-red-600)',
      'Al aprobar: OT → EN_REPARACION, stock reservado se confirma',
      'Al rechazar: OT → LIQUIDACION_DIAGNOSTICO, stock reservado se libera',
      'Personal ve panel informativo con advertencia "Solo el cliente puede aprobar"',
    ],
  },
  {
    codigo: 'RF-11', titulo: 'Gestión de Rechazo de Cotización',
    descripcion: 'Liquidación del diagnóstico. Stock liberado. Factura de solo diagnóstico. OT finalizada.',
    implementacion: 'Estado LIQUIDACION_DIAGNOSTICO. liberarReservas() automático. PanelLiquidacion para asesor.',
    roles: ['asesor','cliente'] as const,
    modulo: 'WorkOrders.tsx → PanelLiquidacion',
    detalles: [
      'Stock reservado liberado automáticamente al rechazar (liberarReservas())',
      'Kardex registra movimiento tipo "liberacion" con detalles',
      'Panel Liquidación: monto del diagnóstico + selector de método de pago',
      'Botón "Registrar Pago de Diagnóstico" → Factura con número único + OT FINALIZADA',
      'OT queda como FINALIZADA inmutable (no puede reabrirse)',
      'Factura disponible en /facturas con estado "pagada"',
    ],
  },
  {
    codigo: 'RF-12', titulo: 'Ejecución de la Reparación',
    descripcion: 'Mecánico registra el trabajo realizado. Puede guardar parcialmente antes de enviar a QC.',
    implementacion: 'PanelReparacion visible solo para mecánico asignado en EN_REPARACION.',
    roles: ['mecanico'] as const,
    modulo: 'WorkOrders.tsx → PanelReparacion',
    detalles: [
      'Textarea de notas de reparación (guardado parcial sin cambio de estado)',
      'Sección de repuestos usados: buscador del inventario + agregar al registro',
      'registrarSalidaRepuesto() al agregar: descuento de stock + movimiento Kardex',
      'Upload de fotos antes/después de la reparación (grid 4 columnas)',
      'Barra de progreso si la OT tiene TareaSubdividida[] definidas',
      'Botón "💾 Guardar Reparación" (sin cambiar estado)',
      'Botón "✓ Enviar a Control de Calidad" → CONTROL_CALIDAD',
    ],
  },
  {
    codigo: 'RF-13', titulo: 'Control de Calidad',
    descripcion: 'Jefe de Taller valida el trabajo. Aprueba (LIBERADA) o rechaza (EN_REPARACION).',
    implementacion: 'PanelControlCalidad visible SOLO para Jefe de Taller en CONTROL_CALIDAD.',
    roles: ['jefe_taller'] as const,
    modulo: 'WorkOrders.tsx → PanelControlCalidad',
    detalles: [
      'KPI "Control Calidad" en Dashboard del Jefe — pulsante cuando hay OTs',
      'Acceso a toda la información: diagnóstico + fotos + reparación + repuestos',
      'Checkbox "Prueba de ruta realizada" + textarea de observaciones',
      'Botón "✅ Aprobar QC" → OT LIBERADA + notificación al CLIENTE + notificación al ASESOR',
      'Botón "❌ Rechazar" → OT vuelve a EN_REPARACION + notificación al mecánico con obs.',
      'fechaRevision guardada en controlCalidad.fechaRevision',
      'Registro de auditoría: APROBAR_QC o RECHAZAR_QC',
    ],
  },
  {
    codigo: 'RF-14', titulo: 'Gestión de Pagos',
    descripcion: 'Dos flujos: cliente paga en línea (portal) o asesor cobra presencialmente.',
    implementacion: 'PanelEntrega (Asesor) + ModalPago en ClientPortal.tsx. Ambos generan factura y finalizan OT.',
    roles: ['asesor','cliente'] as const,
    modulo: 'WorkOrders.tsx + ClientPortal.tsx',
    detalles: [
      'FLUJO CLIENTE: Banner verde "🎉 ¡Tu vehículo está listo!" en portal',
      'Modal de pago con 3 métodos: Transferencia / Tarjeta / Efectivo en taller',
      'Al pagar: OT queda en LIBERADA con pagadoEnLinea=true (asesor confirma entrega)',
      'Código de recojo = número de OT (ej. "OT-015")',
      'FLUJO ASESOR: Panel entrega con selector de método + notas + botón "Registrar Pago"',
      'Notificación automática al asesor cuando el cliente paga en línea',
    ],
  },
  {
    codigo: 'RF-15', titulo: 'Generación de Factura',
    descripcion: 'Factura automática con número único al confirmar pago. Visible en /facturas.',
    implementacion: 'addFactura() en AppContext. 13 facturas demo (FAC-001 a FAC-013). Módulo /facturas.',
    roles: ['asesor','cliente','administrador'] as const,
    modulo: 'WorkOrders.tsx + Facturas.tsx',
    detalles: [
      '13 facturas demo: FAC-001 (ene-2026) a FAC-013 (mar-2026)',
      'Campos: número, fecha, ordenId, clienteId, subtotal, IVA 12%, total, metodoPago, estado',
      'Estados: emitida → pagada',
      'Disponible en /facturas con filtros por estado y fecha',
      'Toast de confirmación con número de factura al generar',
      'Botón "Generar PDF" con jsPDF disponible',
    ],
  },
  {
    codigo: 'RF-16', titulo: 'Cierre de Orden de Trabajo',
    descripcion: 'Asesor cierra la OT tras el pago y entrega física. OT queda inmutable.',
    implementacion: 'PanelEntrega: botón "Registrar Pago y Entregar" → entregaFirmada=true, estado=finalizada.',
    roles: ['asesor'] as const,
    modulo: 'WorkOrders.tsx → PanelEntrega',
    detalles: [
      'OT en LIBERADA activa el panel de entrega para el Asesor',
      'Campo notas de entrega (condición del vehículo al momento de entrega)',
      'Al confirmar: OT=FINALIZADA, entregaFirmada=true, facturaId asignado, metodoPagoFinal',
      'OT finalizada: inmutable (ningún rol puede editarla)',
      'Cliente puede ver el historial en portal → Mis Vehículos → historial de servicios',
    ],
  },
  {
    codigo: 'RF-17', titulo: 'Gestión de Inventario',
    descripcion: 'Administrador gestiona repuestos, precios, stock y proveedores.',
    implementacion: 'Inventory.tsx. 16 repuestos demo en 6 categorías. 6 proveedores. Alertas de stock bajo.',
    roles: ['administrador','mecanico'] as const,
    modulo: 'Inventory.tsx',
    detalles: [
      '16 repuestos demo: Filtros, Frenos, Motor, Lubricantes, Suspensión, Eléctrico, Transmisión',
      'Modal de repuesto: nombre, categoría, cantidad, costo, margen %, precio PVP calculado',
      'Fórmula: precio = costo × (1 + margenGanancia)',
      'Alerta visual roja cuando cantidad ≤ stockMinimo',
      '6 proveedores con contacto, teléfono y productos (1 inactivo)',
      'Botón "Entrada de stock" → addStockRepuesto() + Kardex automático',
      'El mecánico puede VER el inventario (solo lectura, no puede modificar)',
    ],
  },
  {
    codigo: 'RF-18', titulo: 'Control Automático de Stock (Kardex)',
    descripcion: 'Reserva automática al cotizar, descuento al reparar, liberación al rechazar. Kardex completo.',
    implementacion: 'reservarRepuestos(), registrarSalidaRepuesto(), liberarReservas() en AppContext. 24 movimientos demo.',
    roles: ['mecanico','jefe_taller'] as const,
    modulo: 'AppContext.tsx → funciones de stock + kardex',
    detalles: [
      'Al enviar cotización: RESERVA (cantidadReservada += n, tipo="reserva" en Kardex)',
      'Al rechazar: LIBERACIÓN automática (cantidadReservada -= n, tipo="liberacion")',
      'Al registrar reparación: SALIDA REAL (cantidad -= n, tipo="salida")',
      'Al agregar stock: ENTRADA (cantidad += n, tipo="entrada" con proveedor y costo)',
      'Cada movimiento Kardex: repuestoId, tipo, cantidad, stockResultante, fecha, usuarioId, ordenId',
      '24 movimientos Kardex demo desde dic-2025 a abr-2026',
    ],
  },
  {
    codigo: 'RF-19', titulo: 'Consulta de Órdenes por Rol',
    descripcion: 'Cada rol ve su subconjunto de OTs con filtros específicos.',
    implementacion: 'WorkOrders.tsx con filtros por rol. 20 OTs demo en todos los estados del flujo.',
    roles: ['asesor','jefe_taller','administrador','mecanico','cliente'] as const,
    modulo: 'WorkOrders.tsx',
    detalles: [
      'ASESOR: todas las OTs — tabla completa con filtros por estado y buscador',
      'JEFE: todas las OTs — enfoque en sin-asignar (rojo) y en-QC (naranja)',
      'ADMIN: todas las OTs en modo solo lectura (badge "🔒 Solo lectura")',
      'MECÁNICO: SOLO sus OTs asignadas — panel separado por estado (MecanicoWorkPanel)',
      'CLIENTE: SOLO las OTs de sus propios vehículos',
      '20 OTs demo: 12 finalizadas (OT-001..012), 2 activas complejas (OT-013..014), 6 en flujo activo (OT-015..020)',
      'Filtros de estado en pills horizontales con contadores en tiempo real',
      'Tabla en desktop / cards en móvil (responsive)',
    ],
  },
  {
    codigo: 'RF-20', titulo: 'Reportes del Sistema',
    descripcion: 'Administrador analiza rendimiento con gráficos interactivos. 4 pestañas con selector de período.',
    implementacion: 'Reportes.tsx con recharts. Selector de período con 5 opciones.',
    roles: ['administrador'] as const,
    modulo: 'Reportes.tsx',
    detalles: [
      'Selector de período: Hoy / Esta semana / Este mes / Trimestre / Este año',
      'Tab Ganancias: KPIs de ingresos, gráfico AreaChart, desglose MO vs Repuestos, comparativa mensual',
      'Tab Productividad: tabla de mecánicos con OTs completadas, activas, ingresos generados, eficiencia %',
      'Tab Inventario: valor total PVP, costo, margen bruto, top 5 repuestos, movimientos Kardex',
      'Tab Auditoría: log completo de acciones (usuario, acción, módulo, detalles, entidadId, fecha)',
      'Botón Exportar PDF (jsPDF integrado)',
    ],
  },
];

function RequisitosTab() {
  const [expandedRF, setExpandedRF] = useState<string | null>(null);
  return (
    <div className="space-y-3">
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6">
        <p className="text-sm text-slate-600">
          <span className="font-bold text-slate-800">20 Requerimientos Funcionales</span> implementados en TallerPro v37.
          Haz clic en cualquier RF para ver detalles de implementación, módulos y funcionalidades específicas.
        </p>
      </div>
      {RF_DATA.map(rf => {
        const isOpen = expandedRF === rf.codigo;
        return (
          <div key={rf.codigo} className={`bg-white border rounded-2xl overflow-hidden transition-all ${isOpen ? 'border-slate-400 shadow-md' : 'border-slate-200'}`}>
            <button onClick={() => setExpandedRF(isOpen ? null : rf.codigo)}
              className="w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-slate-50 transition-colors">
              <div className="flex-shrink-0 w-16 h-9 bg-slate-800 text-white rounded-lg flex items-center justify-center text-xs font-bold font-mono">{rf.codigo}</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 text-sm">{rf.titulo}</p>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{rf.descripcion}</p>
              </div>
              <div className="hidden sm:flex gap-1 flex-wrap flex-shrink-0">
                {rf.roles.map(r => <RolBadge key={r} rol={r}/>)}
              </div>
              <ChevronRight size={16} className={`text-slate-400 flex-shrink-0 transition-transform mt-0.5 ${isOpen ? 'rotate-90' : ''}`}/>
            </button>
            {isOpen && (
              <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Descripción</p>
                  <p className="text-sm text-slate-700">{rf.descripcion}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Implementación en TallerPro</p>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                    <p className="text-sm text-slate-700">{rf.implementacion}</p>
                    <p className="text-xs text-cyan-600 mt-1.5 font-mono flex items-center gap-1"><Hash size={10}/> {rf.modulo}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Funcionalidades implementadas</p>
                  <ul className="space-y-1.5">
                    {rf.detalles.map((d, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <CheckCircle size={13} className="text-emerald-500 flex-shrink-0 mt-0.5"/>{d}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Roles:</span>
                  {rf.roles.map(r => <RolBadge key={r} rol={r}/>)}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── TAB 3: GUÍA DE INTERFAZ ─────────────────────────────────────────────────

function InterfazTab() {
  return (
    <div className="space-y-8">

      {/* Paleta de Colores */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
          <Palette size={16} className="text-slate-600"/>
          <h3 className="font-bold text-slate-800">Paleta de Colores del Sistema</h3>
        </div>
        <div className="p-5 space-y-5">
          {/* Fondos base */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Fondos Base (Sistema de Capas)</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { name: 'Fondo General', class: 'bg-slate-100', hex: '#f1f5f9', label: 'bg-slate-100', uso: 'Fondo de toda la app' },
                { name: 'Cards / Paneles', class: 'bg-white border border-slate-200', hex: '#ffffff', label: 'bg-white', uso: 'Tarjetas y contenedores' },
                { name: 'Cabecera Panel', class: 'bg-slate-50', hex: '#f8fafc', label: 'bg-slate-50', uso: 'Headers de secciones' },
                { name: 'Cabecera Tabla', class: 'bg-slate-100', hex: '#f1f5f9', label: 'bg-slate-100', uso: 'thead de tablas' },
              ].map(c => (
                <div key={c.name} className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className={`h-10 ${c.class}`}/>
                  <div className="p-2.5">
                    <p className="text-xs font-bold text-slate-700">{c.name}</p>
                    <p className="text-xs font-mono text-cyan-600 mt-0.5">{c.hex}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{c.label}</p>
                    <p className="text-xs text-slate-500 mt-1">{c.uso}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Colores de rol */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Badges de Roles (Sidebar, Modales, Dashboard)</p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { rol: 'Administrador', bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300', dot: 'bg-purple-500', hex: '#f3e8ff / #6b21a8' },
                { rol: 'Asesor',        bg: 'bg-blue-100',   text: 'text-blue-800',   border: 'border-blue-300',   dot: 'bg-blue-500',   hex: '#dbeafe / #1e40af' },
                { rol: 'Mecánico',      bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300', dot: 'bg-orange-500', hex: '#ffedd5 / #9a3412' },
                { rol: 'Jefe de Taller',bg: 'bg-emerald-100',text: 'text-emerald-800',border: 'border-emerald-300',dot: 'bg-emerald-500',hex: '#d1fae5 / #065f46' },
                { rol: 'Cliente',       bg: 'bg-slate-100',  text: 'text-slate-700',  border: 'border-slate-300',  dot: 'bg-slate-500',  hex: '#f1f5f9 / #374151' },
              ].map(r => (
                <div key={r.rol} className={`border ${r.border} ${r.bg} rounded-xl p-3`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className={`w-2 h-2 rounded-full ${r.dot}`}/>
                    <span className={`text-xs font-semibold ${r.text}`}>{r.rol}</span>
                  </div>
                  <p className="text-xs font-mono text-slate-500 mt-1">{r.hex}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Estados de OT */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Estados de Orden de Trabajo</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {Object.entries(ESTADO_CFG).map(([key, cfg]) => (
                <div key={key} className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${cfg.bg} ${cfg.border}`}>
                  <div>
                    <span className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</span>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{cfg.hex}</p>
                  </div>
                  <EstadoBadge estado={key}/>
                </div>
              ))}
            </div>
          </div>

          {/* Colores de acción */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Botones de Acción</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { name: 'Primario / Nueva OT', class: 'bg-slate-800 text-white', hex: '#1e293b', tailwind: 'bg-slate-800 hover:bg-slate-700', uso: '"+ Nueva OT", "Guardar", botones principales' },
                { name: 'Éxito / Aprobar',     class: 'bg-emerald-600 text-white', hex: '#059669', tailwind: 'bg-emerald-600 hover:bg-emerald-700', uso: '"Aprobar", "Pagar", "Confirmar entrega"' },
                { name: 'Peligro / Rechazar',  class: 'bg-red-600 text-white', hex: '#dc2626', tailwind: 'bg-red-600 hover:bg-red-700', uso: '"Rechazar QC", "Cancelar", acciones destructivas' },
                { name: 'Acento / Acción',     class: 'bg-cyan-600 text-white', hex: '#0891b2', tailwind: 'bg-cyan-600 hover:bg-cyan-700', uso: 'Acciones de navegación, "Ver servicio activo"' },
              ].map(b => (
                <div key={b.name} className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className={`h-10 flex items-center justify-center text-sm font-medium ${b.class}`}>
                    {b.name.split('/')[0].trim()}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-bold text-slate-700">{b.name}</p>
                    <p className="text-xs font-mono text-cyan-600">{b.hex}</p>
                    <p className="text-xs font-mono text-slate-400 mt-0.5 text-[10px]">{b.tailwind}</p>
                    <p className="text-xs text-slate-500 mt-1">{b.uso}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Medidas y Espaciado */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
          <Ruler size={16} className="text-slate-600"/>
          <h3 className="font-bold text-slate-800">Medidas y Espaciado del Sistema</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200">
                {['Elemento','Medida CSS','Valor px aprox.','Tailwind class','Uso y contexto'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {[
                // Layout
                ['Sidebar escritorio',           '14rem',   '224px',  'w-56',           'Sidebar lateral del Layout en desktop'],
                ['Sidebar móvil (drawer)',        '16rem',   '256px',  'w-64',           'Drawer lateral que se desliza en mobile'],
                ['Header móvil (altura)',         '3.25rem', '52px',   'py-3',           'Barra superior en mobile con logo y menú'],
                ['Barra de notificaciones desk.', '2.5rem',  '40px',   'py-2',           'Top bar de escritorio con nombre + notif.'],
                // Botones
                ['Botón primario grande',   'h≈40px',  '40px',   'px-4 py-2.5',    'Botones "Nueva OT", "Guardar Recepción"'],
                ['Botón primario mediano',  'h≈34px',  '34px',   'px-3.5 py-2',    'Botones de acción en paneles internos'],
                ['Botón pequeño / ghost',   'h≈28px',  '28px',   'p-1.5',          'Iconos de acción (cerrar modal, eliminar)'],
                ['Botón de tab',            'h≈40px',  '40px',   'py-2.5 px-4',    'Tabs de DocumentSystemDocs, Reportes'],
                // Inputs
                ['Input de texto',           'h≈42px',  '42px',   'py-2.5 px-3.5', 'Inputs estándar de formularios'],
                ['Textarea pequeño',         'h≈80px',  '80px',   'min-h-20',       'Textareas de notas y observaciones'],
                ['Textarea grande',          'h≈120px', '120px',  'min-h-32',       'Textarea de diagnóstico y reparación'],
                // Cards
                ['Card / Modal large',       '90vh max','—',       'max-w-4xl',      'Modales de detalle de OT'],
                ['Card secundaria',          '—',       '—',       'rounded-2xl p-5','Cards de dashboard y reportes'],
                ['Badge de rol',             'h≈22px',  '22px',   'px-2.5 py-1',    'Badges de rol en tablas y modales'],
                ['Badge de estado OT',       'h≈22px',  '22px',   'px-2.5 py-1',    'Pills de estado en lista de OTs'],
                // Íconos
                ['Ícono grande',             '22px',    '22px',   'size={22}',      'Iconos de títulos de página'],
                ['Ícono mediano',            '16px',    '16px',   'size={16}',      'Iconos en sidebar y botones'],
                ['Ícono pequeño',            '12-14px', '12-14px','size={13}',      'Iconos de confirmación y alertas'],
                // Tipografía
                ['Título de página',         '1.5rem',  '24px',   'text-2xl font-bold','h1 de cada módulo'],
                ['Título de sección',        '1rem',    '16px',   'font-semibold',  'Subtítulos de secciones'],
                ['Texto de tabla',           '0.875rem','14px',   'text-sm',        'Contenido de filas en tablas'],
                ['Texto de caption',         '0.75rem', '12px',   'text-xs',        'Labels, placeholders, metadatos'],
                ['Texto de badge/pill',      '0.75rem', '12px',   'text-xs font-semibold','Badges de rol y estado'],
              ].map(([elem, medida, px, cls, uso]) => (
                <tr key={elem} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-semibold text-slate-800">{elem}</td>
                  <td className="px-4 py-2.5 font-mono text-amber-600">{medida}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-500">{px}</td>
                  <td className="px-4 py-2.5 font-mono text-cyan-600 text-[11px]">{cls}</td>
                  <td className="px-4 py-2.5 text-slate-500 max-w-xs">{uso}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Áreas clicables por sección */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
          <MousePointer size={16} className="text-slate-600"/>
          <h3 className="font-bold text-slate-800">Elementos Interactivos — Áreas de Clic por Módulo</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200">
                {['Módulo / Página','Elemento clickeable','Rol que lo ve','Acción resultante','Tamaño área de clic'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {[
                // Login
                ['Login.tsx','Tab "Portal Empresa / Cliente"','Todos','Cambiar formulario de login','Full width, h=40px'],
                ['Login.tsx','Grid de credenciales demo','Staff','Auto-rellenar usuario + contraseña','Card completa'],
                ['Login.tsx','Botón "Ingresar al sistema"','Staff','Login + redirección al dashboard','Full width, h=44px'],
                ['Login.tsx','Botón "Acceder al portal"','Cliente','Login + redirección a /portal','Full width, h=44px'],
                ['Login.tsx','Link "¿Eres nuevo? Regístrate"','Cliente','Switch a tab de registro','Texto inline'],
                // Layout
                ['Layout.tsx','Items del sidebar','Todos','Navegar a la ruta del ítem','Full width sidebar, h=40px'],
                ['Layout.tsx','Bell de notificaciones','Todos','Abrir panel de notificaciones (mobile: bottom sheet)','40×40px'],
                ['Layout.tsx','Overlay del sidebar (móvil)','Todos','Cerrar el drawer del sidebar','Full screen overlay'],
                // Dashboard
                ['Dashboard.tsx','Cards KPI (Admin)','Admin','No clickeable (solo info)','Card completa'],
                ['Dashboard.tsx','Filas de OT reciente','Admin/Asesor','Abrir modal de detalle de OT','Full row'],
                ['Dashboard.tsx','Botón "Ver todas →"','Admin/Asesor','Navegar a /ordenes','Texto inline'],
                ['Dashboard.tsx','KPI "Control Calidad" (Jefe)','Jefe','No clickeable — indicador visual','Card completa'],
                // Órdenes
                ['WorkOrders.tsx','Botón "+ Nueva OT"','Asesor','Abrir WizardNuevaOT','160×40px aprox.'],
                ['WorkOrders.tsx','Pills de estado (filtros)','Todos excepto Mec./Cliente','Filtrar lista por estado','Auto, h=32px'],
                ['WorkOrders.tsx','Input de búsqueda','Todos','Filtrar OTs por número/cliente/placa','Full width, h=42px'],
                ['WorkOrders.tsx','Fila de OT (tabla desktop)','Todos','Abrir ModalDetalle de la OT','Full row'],
                ['WorkOrders.tsx','Card de OT (móvil)','Todos','Abrir ModalDetalle de la OT','Full width card'],
                ['WorkOrders.tsx','Botón "👁 Ver" (columna)','Admin/Asesor/Jefe','Abrir ModalDetalle','32×32px'],
                // Modal OT
                ['ModalDetalle → StepProgress','Pills de pasos en header','Todos','No clickeable — solo visual','Auto, h=36px'],
                ['ModalDetalle → Recepción','Slider de combustible','Asesor','Cambiar valor 0-4','Full width slider'],
                ['ModalDetalle → Recepción','Radio Bueno/Bajo/Malo','Asesor','Seleccionar estado de fluido','16px radio button'],
                ['ModalDetalle → Recepción','Botón "Subir fotos recepción"','Asesor','Abrir file picker','Full width, h=44px'],
                ['ModalDetalle → Recepción','Botón "Guardar Recepción"','Asesor','Guardar + OT→EN_DIAGNOSTICO','Full width, h=44px'],
                ['ModalDetalle → Asignación','Dropdown de mecánicos','Jefe','Seleccionar mecánico','Full width select'],
                ['ModalDetalle → Asignación','Botón "✓ Asignar"','Jefe','Asignar mecánico + notificar','Full width, h=44px'],
                ['ModalDetalle → Diagnóstico','Buscador de repuestos','Mecánico','Filtrar inventario','Full width, h=42px'],
                ['ModalDetalle → Diagnóstico','Botón "+ Agregar línea"','Mecánico','Agregar línea a cotización','Auto, h=36px'],
                ['ModalDetalle → Diagnóstico','Botón "✈ Enviar cotización"','Mecánico','OT→ESPERANDO_APROBACION','Full width, h=44px'],
                ['ModalDetalle → Aprobación','Botón "👍 Aprobar"','Cliente','Aprobar cotización + OT→EN_REPARACION','50% ancho, h=48px'],
                ['ModalDetalle → Aprobación','Botón "👎 Rechazar"','Cliente','Rechazar + OT→LIQUIDACION','50% ancho, h=48px'],
                ['ModalDetalle → Reparación','Botón "💾 Guardar"','Mecánico','Guardar sin cambiar estado','50% ancho, h=44px'],
                ['ModalDetalle → Reparación','Botón "✓ Enviar a QC"','Mecánico','OT→CONTROL_CALIDAD','50% ancho, h=44px'],
                ['ModalDetalle → QC','Checkbox prueba de ruta','Jefe','Activar/desactivar checkbox','20×20px'],
                ['ModalDetalle → QC','Botón "✅ Aprobar QC"','Jefe','OT→LIBERADA + 2 notificaciones','50% ancho, h=44px'],
                ['ModalDetalle → QC','Botón "❌ Rechazar QC"','Jefe','OT→EN_REPARACION + notif. mecánico','50% ancho, h=44px'],
                ['ModalDetalle → Entrega','Selector método de pago','Asesor','Seleccionar método','Full width select'],
                ['ModalDetalle → Entrega','Botón "Registrar Pago y Entregar"','Asesor','Factura + OT=FINALIZADA','Full width, h=44px'],
                // Portal Cliente
                ['ClientPortal.tsx','Botón "+ Agendar Cita"','Cliente','Abrir modal de nueva cita','Auto, h=40px'],
                ['ClientPortal.tsx','Card de vehículo','Cliente','Expandir historial del vehículo','Full width card'],
                ['ClientPortal.tsx','Card de servicio activo','Cliente','Ver detalle de OT activa','Full width card'],
                ['ClientPortal.tsx','Botón "Pagar y Recoger"','Cliente','Abrir modal de pago en línea','Auto, h=44px'],
                ['ClientPortal.tsx','Botón "👍 Aprobar" / "👎 Rechazar"','Cliente','Aprobar/Rechazar cotización','~50% ancho'],
              ].map(([modulo, elem, rol, accion, tamano]) => (
                <tr key={`${modulo}-${elem}`} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-mono text-xs text-violet-600">{modulo}</td>
                  <td className="px-4 py-2.5 font-semibold text-slate-800">{elem}</td>
                  <td className="px-4 py-2.5 text-slate-500">{rol}</td>
                  <td className="px-4 py-2.5 text-slate-600">{accion}</td>
                  <td className="px-4 py-2.5 font-mono text-amber-600">{tamano}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Componentes del Modal */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">Paneles del Modal de Detalle de OT — Visibilidad por Rol y Estado</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200">
                {['Panel','Rol que lo ve','Estado OT requerido','Acción disponible'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {[
                ['StepProgress (barra de pasos)','Todos','Todos (excepto cancelada)','Solo visual — no clickeable'],
                ['PanelAsignacionMecanico','Jefe de Taller ÚNICAMENTE','Registrada / En Diagnóstico','Seleccionar mecánico + confirmar'],
                ['PanelRecepcion','Asesor ÚNICAMENTE','Registrada','Completar formulario + subir fotos → EN_DIAGNOSTICO'],
                ['PanelDiagnostico','Mecánico ASIGNADO únicamente','En Diagnóstico','Diagnóstico + cotización → ESPERANDO_APROBACION'],
                ['PanelAprobacion','Cliente ÚNICAMENTE','Esperando Aprobación','Aprobar o Rechazar cotización'],
                ['PanelLiquidacion','Asesor / Cliente','Liquidación Diagnóstico','Registrar pago diagnóstico → FINALIZADA'],
                ['PanelReparacion','Mecánico ASIGNADO únicamente','En Reparación','Registrar reparación → CONTROL_CALIDAD'],
                ['PanelControlCalidad','Jefe de Taller ÚNICAMENTE','Control Calidad','Aprobar QC → LIBERADA | Rechazar → EN_REPARACION'],
                ['PanelEntrega','Asesor ÚNICAMENTE','Liberada','Registrar pago presencial → FINALIZADA'],
                ['PanelPagoCliente','Cliente ÚNICAMENTE','Liberada','Pagar en línea → OT.pagadoEnLinea=true'],
                ['AdminReadOnlyPanel','Administrador ÚNICAMENTE','Todos los estados','Solo lectura — badge "🔒 Solo lectura"'],
                ['InfoGeneral','Asesor, Mecánico, Jefe','Todos','Solo lectura — metadatos de la OT'],
                ['PanelResumen (finalizada)','Todos','Finalizada','Solo lectura — resumen completo del servicio'],
                ['Cotización (informativo)','Asesor, Jefe (modo info)','Esperando Aprobación','Solo visualización — no pueden actuar por el cliente'],
              ].map(([panel, rol, estado, accion]) => (
                <tr key={panel} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-semibold text-slate-800">{panel}</td>
                  <td className="px-4 py-2.5 text-slate-600">{rol}</td>
                  <td className="px-4 py-2.5"><span className="font-mono text-violet-600">{estado}</span></td>
                  <td className="px-4 py-2.5 text-slate-500">{accion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Diseño Responsivo */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
          <Smartphone size={16} className="text-slate-600"/>
          <h3 className="font-bold text-slate-800">Diseño Responsivo — Comportamiento por Breakpoint</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200">
                {['Breakpoint','Valor','Sidebar','Notificaciones','Tablas/Grids','Modales'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {[
                ['Mobile', '< 640px (sm)', 'Oculto — botón hamburguesa abre drawer w-64', 'Bottom sheet desde abajo (80vh máx)', 'Cards apiladas verticalmente', 'Pantalla completa'],
                ['Tablet', '640px–1023px (sm–lg)', 'Oculto — drawer disponible', 'Bottom sheet desde abajo', 'Grid 2 columnas, tablas con scroll horizontal', 'Modal centrado 90vw'],
                ['Desktop', '≥ 1024px (lg)', 'Visible permanente w-56 bg-[#2C3A4F]', 'Dropdown 384px (w-96) desde el bell', 'Tabla completa con todas las columnas', 'Modal max-w-4xl centrado'],
              ].map(([bp, valor, sidebar, notif, tablas, modales]) => (
                <tr key={bp} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold text-slate-800">{bp}</td>
                  <td className="px-4 py-3 font-mono text-cyan-600">{valor}</td>
                  <td className="px-4 py-3 text-slate-600">{sidebar}</td>
                  <td className="px-4 py-3 text-slate-600">{notif}</td>
                  <td className="px-4 py-3 text-slate-600">{tablas}</td>
                  <td className="px-4 py-3 text-slate-600">{modales}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── TAB 4: ROLES Y PERMISOS ─────────────────────────────────────────────────

const ROLES_DATA = [
  {
    rol: 'administrador' as const, titulo: 'Administrador',
    descripcion: 'Gestión administrativa y reportes. Acceso de SOLO LECTURA a OTs. NO puede operar el flujo de servicio.',
    puede: [
      'Ver TODAS las OTs en modo solo lectura (badge "🔒 Solo lectura")',
      'Gestionar usuarios del sistema y personal del taller',
      'Gestionar inventario de repuestos y proveedores',
      'Ver y gestionar facturas emitidas',
      'Generar reportes financieros y de productividad',
      'Configurar catálogos maestros (marcas, tipos de servicio, métodos de pago)',
      'Ver log de auditoría completo de todas las acciones',
      'Acceder a planificación del proyecto (Jira Planning)',
      'Ver documentación del sistema',
    ],
    noPuede: [
      'Crear Órdenes de Trabajo (no tiene el botón "+ Nueva OT")',
      'Asignar mecánicos a OTs',
      'Registrar recepción de vehículos',
      'Modificar diagnósticos o cotizaciones',
      'Aprobar o rechazar cotizaciones',
      'Realizar Control de Calidad',
      'Registrar pagos o entregas',
      'Eliminar OTs del sistema',
    ],
    logins: [{ user: 'admin', pass: 'admin123', nombre: 'Admin Sistema' }],
    dashboard: 'KPIs financieros (facturación total, OTs activas, aprobaciones pendientes, stock bajo), tendencia de ingresos (AreaChart), OTs por estado (PieChart), productividad de mecánicos (BarChart), tabla de OTs recientes',
    ruta: '/ (Dashboard Admin)',
  },
  {
    rol: 'asesor' as const, titulo: 'Asesor de Servicio',
    descripcion: 'Punto de contacto con el cliente. Crea y cierra OTs. Gestiona citas y cobra.',
    puede: [
      'Gestionar citas (confirmar, reprogramar, cancelar, convertir a OT)',
      'Registrar clientes y vehículos nuevos',
      'Crear Órdenes de Trabajo (wizard de 3 pasos)',
      'Registrar recepción del vehículo con fotos (panel exclusivo)',
      'Ver el estado de TODAS las OTs del sistema',
      'Registrar el pago presencial y entrega del vehículo',
      'Cerrar la OT (estado FINALIZADA)',
      'Ver y gestionar facturas del sistema',
    ],
    noPuede: [
      'Asignar mecánicos a OTs (solo el Jefe puede)',
      'Registrar diagnósticos (solo el mecánico asignado)',
      'Aprobar cotizaciones por el cliente (solo el cliente)',
      'Realizar Control de Calidad (solo el Jefe)',
      'Modificar inventario o precios',
      'Ver reportes del sistema',
    ],
    logins: [{ user: 'asesor', pass: 'asesor123', nombre: 'María García' }],
    dashboard: 'Agenda del día, citas de hoy, OTs en aprobación, banner verde prominente de vehículos listos para entrega, KPIs de estado operativo',
    ruta: '/ (Dashboard Asesor)',
  },
  {
    rol: 'jefe_taller' as const, titulo: 'Jefe de Taller',
    descripcion: 'Supervisión operativa. Asigna mecánicos y valida la calidad del trabajo.',
    puede: [
      'Ver TODAS las OTs del sistema (supervisión completa)',
      'Asignar mecánicos a OTs (único rol que puede hacerlo)',
      'Realizar Control de Calidad (único rol que puede hacerlo)',
      'Aprobar o rechazar el trabajo del mecánico con observaciones',
      'Ver carga de trabajo actual por mecánico en el dropdown de asignación',
      'Recibir notificaciones de OTs en Control de Calidad',
      'Ver la productividad de mecánicos en su dashboard',
    ],
    noPuede: [
      'Crear OTs (no tiene el botón "+ Nueva OT")',
      'Registrar recepción de vehículos',
      'Registrar o modificar diagnósticos',
      'Aprobar cotizaciones por el cliente',
      'Registrar pagos o cobros',
      'Modificar inventario o configurar catálogos',
      'Ver reportes financieros',
    ],
    logins: [{ user: 'jefe', pass: 'jefe123', nombre: 'Ana Supervisora' }],
    dashboard: 'KPIs operativos (sin asignar, en QC, en reparación, liberadas), alerta roja pulsante de OTs sin mecánico, tabla de productividad por mecánico, OTs en Control de Calidad destacadas',
    ruta: '/ (Dashboard Jefe)',
  },
  {
    rol: 'mecanico' as const, titulo: 'Mecánico',
    descripcion: 'Ejecución técnica. SOLO ve y actúa en sus propias OTs asignadas. Nunca ve OTs de compañeros.',
    puede: [
      'Ver SOLO sus propias OTs asignadas (filtro estricto mecanicoId)',
      'Registrar diagnóstico técnico en sus OTs (estado EN_DIAGNOSTICO)',
      'Construir la cotización línea a línea con repuestos del inventario',
      'Registrar avance de la reparación con fotos (estado EN_REPARACION)',
      'Enviar OT a Control de Calidad',
      'Ver inventario de repuestos (solo lectura)',
      'Recibir notificaciones de nuevas asignaciones del Jefe',
    ],
    noPuede: [
      'Ver OTs de otros mecánicos (filtro estricto por mecanicoId)',
      'Crear OTs nuevas',
      'Asignar mecánicos a OTs',
      'Aprobar cotizaciones por el cliente',
      'Realizar Control de Calidad',
      'Registrar pagos o entregas',
      'Modificar stock del inventario',
    ],
    logins: [
      { user: 'mecanico',  pass: 'mec123', nombre: 'Juan Pérez — Motor y Transmisión' },
      { user: 'mecanico2', pass: 'mec456', nombre: 'Carlos Ramos — Frenos y Suspensión' },
      { user: 'mecanico3', pass: 'mec789', nombre: 'Roberto Ayala — Electricidad' },
      { user: 'mecanico4', pass: 'mec101', nombre: 'Pedro Naranjo — Carrocería y Pintura' },
      { user: 'mecanico5', pass: 'mec202', nombre: 'Sofía Mendoza — Diagnóstico Computarizado' },
    ],
    dashboard: 'Panel propio (MecanicoWorkPanel): OTs separadas por sección (Diagnóstico / Reparación / Esperando Aprobación / Completadas), KPIs propios, notificaciones de nuevas asignaciones',
    ruta: '/ordenes (panel propio) + /diagnostico',
  },
  {
    rol: 'cliente' as const, titulo: 'Cliente',
    descripcion: 'Portal propio en /portal. Ve sus vehículos, servicios activos, citas y puede pagar.',
    puede: [
      'Ver sus propios vehículos e historial de reparaciones',
      'Ver el estado de sus órdenes de servicio en tiempo real con barra de pasos',
      'Recibir notificaciones de cotizaciones pendientes y vehículo listo',
      'Aprobar o rechazar cotizaciones de SUS OTs (acción exclusiva del cliente)',
      'Pagar en línea cuando el vehículo está en estado LIBERADA',
      'Ver código de recojo del vehículo (= número de OT)',
      'Solicitar citas y ver historial de citas',
      'Ver y descargar sus facturas en /facturas',
    ],
    noPuede: [
      'Ver OTs de otros clientes',
      'Acceder al Dashboard de staff (/ redirige a /portal automáticamente)',
      'Crear OTs directamente (debe pasar por cita)',
      'Aprobar cotizaciones de otros clientes',
      'Modificar datos de la OT',
      'Ver inventario, reportes o configuración del sistema',
      'Ver OTs de otros clientes',
    ],
    logins: [
      { user: 'cliente',   pass: 'cliente123', nombre: 'Luis Torres — Toyota Corolla + Chevrolet Aveo' },
      { user: 'msuarez',  pass: 'marco123',    nombre: 'Marco Suárez — Toyota Hilux + VW Jetta' },
      { user: 'gleon',    pass: 'gaby123',     nombre: 'Gabriela León — Honda CR-V (OT-015 liberada, pagó en línea)' },
      { user: 'pmora',    pass: 'pati123',     nombre: 'Patricia Mora — Chevrolet Tracker (OT-016 esperando aprobación)' },
      { user: 'despinoza',pass: 'diego123',    nombre: 'Diego Espinoza — Mazda CX-5' },
      { user: 'frios',    pass: 'fer123',      nombre: 'Fernando Ríos — Toyota Yaris + Ford Ranger' },
    ],
    dashboard: 'Portal página única: KPIs (Mis vehículos, servicios activos, próxima cita), banners de alerta automáticos, Mis Servicios (timeline de pasos), Mis Vehículos, Mis Citas, Notificaciones, Mi Perfil',
    ruta: '/portal (siempre)',
  },
];

function RolesTab() {
  return (
    <div className="space-y-5">
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-2">
        <p className="text-sm text-slate-600">
          <strong>Sistema de roles estrictos con 5 niveles.</strong> Cada rol solo puede ver y actuar en los módulos y acciones de su responsabilidad.
          El sistema bloquea en 3 niveles: rutas (React Router), componentes (condicionales JSX) y botones individuales.
        </p>
      </div>
      {ROLES_DATA.map(r => (
        <div key={r.rol} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-start gap-3 flex-wrap">
            <RolBadge rol={r.rol}/>
            <div className="flex-1 min-w-48">
              <h3 className="font-bold text-slate-800">{r.titulo}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{r.descripcion}</p>
              <p className="text-xs font-mono text-violet-600 mt-1">Ruta: {r.ruta}</p>
            </div>
          </div>
          <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-2 flex items-center gap-1"><CheckCircle size={11}/> Puede hacer</p>
              <ul className="space-y-1">
                {r.puede.map(p => (
                  <li key={p} className="flex items-start gap-1.5 text-xs text-slate-600">
                    <CheckCircle size={10} className="text-emerald-500 flex-shrink-0 mt-0.5"/>{p}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold text-red-500 uppercase tracking-wide mb-2 flex items-center gap-1"><Lock size={11}/> No puede hacer</p>
              <ul className="space-y-1">
                {r.noPuede.map(n => (
                  <li key={n} className="flex items-start gap-1.5 text-xs text-slate-500">
                    <div className="w-2.5 h-2.5 rounded-full border-2 border-red-300 flex-shrink-0 mt-0.5"/>{n}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="px-5 pb-4">
            <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Dashboard: </span>
              <span className="text-xs text-slate-600">{r.dashboard}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── TAB 5: CREDENCIALES DE PRUEBA ───────────────────────────────────────────

function CredencialesTab() {
  const [copied, setCopied] = useState('');
  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(''), 1500);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
        <p className="text-sm text-slate-600">
          Todas las credenciales de acceso del sistema demo. Úsalas para probar cada rol desde la pantalla de login.
          <strong className="text-slate-800"> Portal Empresa</strong> para staff y <strong className="text-slate-800">Portal Cliente</strong> para clientes.
        </p>
      </div>

      {ROLES_DATA.map(r => (
        <div key={r.rol} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
            <RolBadge rol={r.rol}/>
            <span className="text-sm font-bold text-slate-700">{r.titulo}</span>
            <span className="text-xs text-slate-400 ml-auto">
              {r.rol === 'cliente' ? 'Portal Cliente' : 'Portal Empresa'}
            </span>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {r.logins.map(login => {
              const key = `${login.user}`;
              return (
                <div key={login.user} className="border border-slate-200 rounded-xl p-3.5 hover:border-cyan-300 transition-colors">
                  <p className="text-xs text-slate-500 mb-2">{login.nombre}</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-xs text-slate-400">Usuario</p>
                        <p className="font-mono text-sm font-bold text-slate-800">{login.user}</p>
                      </div>
                      <button onClick={() => copy(login.user, `${key}-user`)}
                        className="text-xs bg-slate-100 hover:bg-cyan-50 text-slate-500 hover:text-cyan-600 px-2 py-1 rounded-lg transition-colors">
                        {copied === `${key}-user` ? '✓' : 'Copiar'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-xs text-slate-400">Contraseña</p>
                        <p className="font-mono text-sm font-bold text-slate-800">{login.pass}</p>
                      </div>
                      <button onClick={() => copy(login.pass, `${key}-pass`)}
                        className="text-xs bg-slate-100 hover:bg-cyan-50 text-slate-500 hover:text-cyan-600 px-2 py-1 rounded-lg transition-colors">
                        {copied === `${key}-pass` ? '✓' : 'Copiar'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* OTs destacadas para probar */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">OTs del Sistema Demo — Estado Actual para Pruebas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200">
                {['OT','Cliente','Vehículo','Estado','Quién puede actuar ahora','Credencial para probar'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {[
                ['OT-013','Ana Martínez','Hyundai Tucson DEF-7890','en_reparacion','Juan Pérez (Mecánico)','mecanico / mec123'],
                ['OT-014','Roberto Silva','Ford Focus GHI-0123','control_calidad','Ana Supervisora (Jefe) — QC RECHAZADO, volver a revisar','jefe / jefe123'],
                ['OT-015','Gabriela León','Honda CR-V STU-2345','liberada','María García (Asesor) — confirmar entrega física (ya pagó en línea)','asesor / asesor123'],
                ['OT-016','Patricia Mora','Chevrolet Tracker YZA-8901','esperando_aprobacion','Patricia Mora (Cliente) — aprobar o rechazar cotización','pmora / pati123'],
                ['OT-017','Diego Espinoza','Mazda CX-5 BCD-1234','en_diagnostico','Juan Pérez (Mecánico) — completar diagnóstico','mecanico / mec123'],
                ['OT-018','Fernando Ríos','Ford Ranger HIJ-7890','en_diagnostico','Sofía Mendoza (Mecánico)','mecanico5 / mec202'],
                ['OT-019','Carmen Vega','Kia Sportage JKL-3456','registrada','Jefe: asignar mecánico | Asesor: registrar recepción','jefe / jefe123'],
                ['OT-020','Isabel Castillo','Nissan Frontier NOP-3456','registrada','Sin mecánico asignado — visible en dashboard del Jefe','jefe / jefe123'],
              ].map(([ot, cliente, vehiculo, estado, actor, cred]) => (
                <tr key={ot} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-bold text-violet-600">{ot}</td>
                  <td className="px-4 py-2.5 text-slate-700">{cliente}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-500">{vehiculo}</td>
                  <td className="px-4 py-2.5"><EstadoBadge estado={estado}/></td>
                  <td className="px-4 py-2.5 text-slate-600">{actor}</td>
                  <td className="px-4 py-2.5 font-mono text-cyan-600">{cred}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── TAB 7: REQUERIMIENTOS FUNCIONALES DE DISEÑO ─────────────────────────────

const RFD_DATA = [
  {
    codigo: 'RFD-01', rfBase: 'RF-01',
    titulo: 'Autenticación Dual: Portal Empresa + Portal Cliente',
    modulo: 'Login.tsx', ruta: '/login',
    justificacion: 'Se diseñó un sistema de doble portal para separar visualmente los dos tipos de usuario. El personal necesita acceso rápido via credenciales demo corporativas; el cliente necesita un flujo más amigable con auto-registro. La separación evita que clientes accedan accidentalmente al sistema interno y reduce la carga cognitiva de cada usuario.',
    decisiones: [
      'Fondo degradado slate-900→blue-950: ambiente profesional y tecnológico automotriz',
      '2 portales como tabs toggle (no 2 páginas): una sola URL /login con comportamiento adaptado',
      'Grid de credenciales demo SOLO en Portal Empresa: clientes no necesitan ni ven credenciales de staff',
      'Formulario de registro SOLO en Portal Cliente: el staff no puede auto-registrarse (lo gestiona el Admin)',
      'Logo en card blanca sobre fondo oscuro: contraste máximo para identidad de marca',
      'Credenciales demo abajo en grid 2x2 compacto: evita scroll horizontal y mantiene foco en el formulario',
    ],
    componentes: [
      { nombre: 'Tab "Portal Empresa"', tipo: 'Button toggle', clase: 'px-5 py-2 rounded-xl h≈36px. Activo: bg-white shadow text-slate-800. Inactivo: text-white/70', accion: 'setPortal("empresa")', destino: 'Muestra formulario de login corporativo con credenciales demo abajo' },
      { nombre: 'Tab "Portal Cliente"', tipo: 'Button toggle', clase: 'px-5 py-2 rounded-xl h≈36px. Activo: bg-white shadow text-slate-800', accion: 'setPortal("cliente")', destino: 'Muestra login de cliente + tab "Crear cuenta"' },
      { nombre: 'Input "Usuario corporativo"', tipo: 'Input text', clase: 'pl-9 py-2.5 border rounded-xl h=42px. Ícono User size=14 left-3', accion: 'setEmpUser(value)', destino: 'Actualiza estado del formulario de login empresa' },
      { nombre: 'Input "Contraseña" (empresa)', tipo: 'Input password', clase: 'pl-9 pr-10 py-2.5 h=42px. Toggle Eye/EyeOff size=15 right-3', accion: 'setEmpPass(value) + toggle show/hide', destino: 'Actualiza contraseña + muestra/oculta texto' },
      { nombre: 'Botón "Ingresar al Sistema"', tipo: 'Submit button', clase: 'bg-slate-800 hover:bg-slate-700 text-white w-full py-2.5 rounded-xl text-sm. Spinner loading', accion: 'handleEmpresaLogin() → login(user,pass)', destino: 'Éxito: Admin/Asesor/Jefe/Mecánico → / | Fallo: error inline rojo' },
      { nombre: 'Cards credenciales demo (2x2)', tipo: 'Button card grid', clase: 'grid grid-cols-2 gap-2. Card: flex border rounded-xl px-3 py-2.5. Color por rol', accion: 'setEmpUser(c.user) + setEmpPass(c.pass)', destino: 'Auto-completa formulario — NO hace login inmediato — el usuario debe clicar "Ingresar"' },
      { nombre: 'Error de login inline', tipo: 'Alert div', clase: 'bg-red-50 border-red-200 text-red-700 rounded-xl px-3 py-2.5 text-xs', accion: 'N/A — visible si login() → false', destino: 'No redirige — mensaje de error bajo los campos' },
      { nombre: 'Tab "Ingresar" (cliente)', tipo: 'Button toggle', clase: 'flex-1 py-2 rounded-lg text-xs. Activo: bg-white text-blue-700 shadow-sm', accion: 'setClienteTab("login")', destino: 'Muestra formulario login con avatar, campos y cuenta demo' },
      { nombre: 'Tab "Crear cuenta" (cliente)', tipo: 'Button toggle', clase: 'flex-1 py-2 rounded-lg text-xs. Activo: bg-white text-blue-700 shadow-sm', accion: 'setClienteTab("registro")', destino: 'Muestra formulario de registro de 9 campos en 2 secciones' },
      { nombre: 'Botón "Acceder a mi cuenta"', tipo: 'Submit button', clase: 'bg-slate-800 text-white w-full py-2.5 rounded-xl text-sm font-bold', accion: 'handleClienteLogin() → login()', destino: 'Éxito: cliente → /portal (useEffect detecta rol==="cliente")' },
      { nombre: 'Cuenta demo Luis Torres', tipo: 'Button card', clase: 'flex bg-slate-50 border rounded-xl px-3 py-2.5 text-xs hover:bg-slate-100', accion: 'setCliUser("cliente") + setCliPass("cliente123")', destino: 'Auto-completa formulario cliente — no hace login inmediato' },
      { nombre: 'Botón "Crear mi cuenta"', tipo: 'Submit button', clase: 'bg-blue-600 hover:bg-blue-700 text-white w-full py-2.5 rounded-xl text-sm font-bold', accion: 'handleRegistro() → registerCliente()', destino: 'Éxito: setRegSuccess(true) → currentUser seteado → useEffect → /portal' },
    ],
    flujo: [
      '1. Usuario abre /login → vista Portal Empresa por defecto (tab activo)',
      '2A. STAFF: Clic en card demo → auto-rellena campos → clic "Ingresar al Sistema" → login() → / (dashboard según rol)',
      '2B. STAFF manual: Escribe usuario + contraseña → "Ingresar al Sistema" → / o error inline',
      '3A. CLIENTE existente: Tab "Portal Cliente" → tab "Ingresar" → escribe credenciales → "Acceder a mi cuenta" → /portal',
      '3B. CLIENTE nuevo: Tab "Portal Cliente" → tab "Crear cuenta" → completa 9 campos → "Crear mi cuenta" → /portal',
    ],
  },
  {
    codigo: 'RFD-02', rfBase: 'RF-02',
    titulo: 'Gestión de Usuarios y Personal del Taller',
    modulo: 'ConfigSecurity.tsx', ruta: '/configuracion',
    justificacion: 'La configuración se dividió en 3 tabs conceptualmente distintos (Personal, Usuarios, Catálogos) dentro de un único módulo. Los modales para crear/editar mantienen el contexto de la lista activa. El toggle de activación evita eliminaciones permanentes de usuarios con historial de auditoría.',
    decisiones: [
      'Tabs en lugar de páginas separadas: los 3 conceptos están relacionados y son gestionados por el mismo rol (Admin)',
      'Toggle activo/inactivo vs eliminar: preserva historial de acciones del usuario en el log de auditoría',
      'Badges de rol con color en tabla: identificación visual inmediata sin leer texto del rol',
      'Modal de edición: el Admin no navega fuera del módulo para crear/editar un usuario',
    ],
    componentes: [
      { nombre: 'Tab "Personal del Taller"', tipo: 'Button tab', clase: 'py-2.5 px-4 rounded-xl. Activo: bg-slate-800 text-white', accion: 'setActiveTab("personal")', destino: 'Lista de mecánicos y staff con cargo, especialidad, estado y toggle' },
      { nombre: 'Tab "Usuarios y Roles"', tipo: 'Button tab', clase: 'py-2.5 px-4 rounded-xl. Activo: bg-slate-800 text-white', accion: 'setActiveTab("usuarios")', destino: 'Tabla: usuario, nombre, rol (badge coloreado), fecha creación, estado, acciones' },
      { nombre: 'Tab "Catálogos Maestros"', tipo: 'Button tab', clase: 'py-2.5 px-4 rounded-xl. Activo: bg-slate-800 text-white', accion: 'setActiveTab("catalogos")', destino: 'Gestión de marcas/modelos de vehículos, tipos de servicio, métodos de pago' },
      { nombre: 'Botón "+ Nuevo Usuario"', tipo: 'Button primario', clase: 'bg-slate-800 text-white px-4 py-2.5 rounded-lg text-sm', accion: 'setModalOpen(true) + setEditando(null)', destino: 'Abre modal vacío para crear nuevo usuario del sistema' },
      { nombre: 'Toggle activo/inactivo', tipo: 'Toggle switch', clase: 'w-10 h-5 rounded-full. Activo: bg-emerald-500. Inactivo: bg-gray-300', accion: 'toggleUserStatus(userId)', destino: 'activo=false: usuario no puede hacer login — permanece en historial' },
      { nombre: 'Badge de rol (tabla)', tipo: 'Badge span', clase: 'px-2.5 py-1 rounded-full text-xs font-semibold. Color por rol', accion: 'Ninguna — solo visual', destino: 'No navega — indicador visual del nivel de acceso del usuario' },
      { nombre: 'Ícono "Editar" (fila)', tipo: 'Button icono', clase: 'p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg', accion: 'setEditando(usuario) + setModalOpen(true)', destino: 'Abre modal pre-cargado con datos del usuario para edición' },
      { nombre: 'Botón "Guardar" (modal)', tipo: 'Submit button', clase: 'bg-slate-800 text-white px-4 py-2.5 rounded-xl', accion: 'addUser() o updateUser()', destino: 'Cierra modal + lista actualizada + toast "Usuario creado/actualizado"' },
    ],
    flujo: [
      '1. Admin accede a /configuracion → Tab "Personal del Taller" por defecto',
      '2. Clic "+ Nuevo Usuario" → Modal vacío → completa nombre, rol, usuario, contraseña → "Guardar"',
      '3. Clic toggle de usuario activo → desactivado (badge gris) → ya no puede iniciar sesión',
      '4. Tab "Catálogos" → agrega marcas, tipos de servicio disponibles para el resto del sistema',
    ],
  },
  {
    codigo: 'RFD-03', rfBase: 'RF-03',
    titulo: 'Registro y Gestión de Clientes',
    modulo: 'Clients.tsx + WizardNuevaOT (paso 1)', ruta: '/clientes',
    justificacion: 'El módulo de clientes usa el patrón lista + modal. La búsqueda en tiempo real sin botón Submit agiliza el trabajo del Asesor que maneja muchos clientes diariamente. El registro inline en el wizard de OT evita interrumpir el flujo principal para registrar un cliente nuevo.',
    decisiones: [
      'Búsqueda en tiempo real (sin Enter): el Asesor ve resultados mientras escribe — más ágil',
      'CI y NIT como campos de identificación: NIT opcional para personas naturales sin empresa',
      'Modal de edición sin navegar: el Asesor no abandona /clientes para editar un registro',
      'Vehículos expandibles por cliente: acceso rápido al historial sin ir a /vehiculos',
      'Registro inline en wizard OT paso 1: el flujo de OT no se interrumpe para registrar el cliente',
    ],
    componentes: [
      { nombre: 'Input de búsqueda', tipo: 'Input text', clase: 'w-full pl-10 pr-4 py-2.5 border rounded-lg h=42px. Ícono Search left-3', accion: 'setSearch(value)', destino: 'Filtra lista en tiempo real por nombre, CI o teléfono' },
      { nombre: 'Botón "+ Nuevo Cliente"', tipo: 'Button primario', clase: 'bg-slate-800 text-white px-4 py-2.5 rounded-lg text-sm', accion: 'setModalOpen(true) + setEditando(null)', destino: 'Abre modal vacío para registrar nuevo cliente' },
      { nombre: 'Fila de cliente (tabla desktop)', tipo: 'TR', clase: 'hover:bg-slate-50. 6 columnas: Nombre, CI, NIT, Teléfono, Email, Vehículos, Acciones', accion: 'Clic en fila → expandir vehículos', destino: 'Muestra sub-fila con cards de vehículos del cliente' },
      { nombre: 'Sub-fila de vehículos', tipo: 'Expanded row', clase: 'bg-blue-50/30 px-6 py-3. Cards de placa + marca/modelo', accion: 'Toggle al clic en fila principal', destino: 'Muestra/oculta vehículos — no navega a otra página' },
      { nombre: 'Ícono "Editar" (columna acciones)', tipo: 'Button icono', clase: 'p-1.5 text-slate-400 hover:text-blue-600 rounded-lg', accion: 'setEditando(cliente) + setModalOpen(true)', destino: 'Abre modal pre-cargado con datos del cliente para edición' },
      { nombre: 'Botón "Guardar" (modal cliente)', tipo: 'Submit button', clase: 'bg-slate-800 text-white px-4 py-2.5 rounded-xl w-full', accion: 'addCliente() o updateCliente()', destino: 'Cierra modal + lista actualizada + toast de confirmación' },
      { nombre: '"Registrar nuevo cliente" (wizard OT)', tipo: 'Button inline', clase: 'text-cyan-600 border border-cyan-200 px-3 py-2 rounded-lg text-sm', accion: 'setModoRegistroCliente(true)', destino: 'Formulario inline SIN cerrar el wizard de OT' },
    ],
    flujo: [
      '1. Asesor en /clientes → lista de 10 clientes demo',
      '2. Escribe en buscador → lista filtra en tiempo real por nombre/CI/teléfono',
      '3. Clic fila → sub-fila con vehículos expandida',
      '4. "+ Nuevo Cliente" → Modal → completa 6 campos → "Guardar" → toast + lista actualizada',
      '5. Wizard OT paso 1: cliente no existe → "Registrar nuevo cliente" → formulario inline → guarda → continúa wizard',
    ],
  },
  {
    codigo: 'RFD-04', rfBase: 'RF-04',
    titulo: 'Registro y Gestión de Vehículos',
    modulo: 'Vehicles.tsx + WizardNuevaOT (paso 2)', ruta: '/vehiculos',
    justificacion: 'Los vehículos se gestionan en /vehiculos o inline en el wizard de OT. El selector de marca + modelo dependiente garantiza consistencia de datos del catálogo. La placa es el identificador primario porque es el dato más reconocido en el contexto automotriz boliviano.',
    decisiones: [
      'Marca → Modelo en selectores dependientes: el modelo se carga dinámicamente según la marca elegida',
      'Placa transformada a mayúsculas automáticamente: consistencia de datos sin depender del usuario',
      'Kilometraje obligatorio: dato crítico para el historial de mantenimientos del vehículo',
      'Registro inline en wizard OT paso 2: el Asesor no abandona el flujo para agregar un vehículo',
    ],
    componentes: [
      { nombre: 'Filtro por cliente (header)', tipo: 'Select / search', clase: 'w-full py-2.5 border rounded-lg h=42px', accion: 'setFilterCliente(id)', destino: 'Filtra lista de vehículos por el cliente seleccionado' },
      { nombre: 'Botón "+ Nuevo Vehículo"', tipo: 'Button primario', clase: 'bg-slate-800 text-white px-4 py-2.5 rounded-lg text-sm', accion: 'setModalOpen(true)', destino: 'Abre modal con formulario completo de registro de vehículo' },
      { nombre: 'Selector "Marca"', tipo: 'Select', clase: 'w-full py-2.5 border rounded-xl h=42px. 11 marcas disponibles', accion: 'setMarca(value) + resetModelo()', destino: 'Carga modelos correspondientes en selector dependiente' },
      { nombre: 'Selector "Modelo" (dependiente)', tipo: 'Select', clase: 'w-full py-2.5 border rounded-xl h=42px. disabled hasta elegir marca', accion: 'setModelo(value)', destino: 'Establece el modelo del vehículo según la marca seleccionada' },
      { nombre: 'Input "Placa"', tipo: 'Input text', clase: 'border rounded-xl py-2.5 px-3.5 h=42px. Transformación: toUpperCase()', accion: 'setPlaca(v.toUpperCase())', destino: 'Placa guardada siempre en mayúsculas' },
      { nombre: 'Card de vehículo (lista)', tipo: 'Card div', clase: 'bg-white border rounded-xl p-4 hover:shadow-md. Placa prominente + marca/modelo/año', accion: 'setSelected(vehiculo)', destino: 'Selecciona vehículo o expande historial de servicio' },
    ],
    flujo: [
      '1. Asesor en /vehiculos → lista de 15 vehículos demo con filtro por cliente',
      '2. "+ Nuevo Vehículo" → Modal → selecciona cliente → marca → modelo (dependiente) → placa + año + KM → "Guardar"',
      '3. Wizard OT paso 2: ve vehículos del cliente → elige el vehículo, o "+ Registrar vehículo" inline',
    ],
  },
  {
    codigo: 'RFD-05', rfBase: 'RF-05',
    titulo: 'Gestión de Citas: Solicitud y Conversión a OT',
    modulo: 'Appointments.tsx + ClientPortal.tsx → Mis Citas', ruta: '/citas',
    justificacion: 'Las citas tienen dos interfaces: el cliente las crea con un modal simple en su portal (sin campos técnicos), y el Asesor las gestiona con filtros en /citas. El botón "Abrir OT" solo aparece en citas CONFIRMADAS, siendo el puente formal entre el portal del cliente y el sistema operativo del taller.',
    decisiones: [
      'Modal simple para el cliente: vehículo + tipo + fecha + motivo, sin tecnicismos internos',
      'Botón "Abrir OT" solo en CONFIRMADAS: crea orden solo con compromiso real de asistencia',
      'Estados con colores: Pendiente=amber, Confirmada=emerald, Cancelada=red — consistencia visual con OTs',
      'Filtros por estado en pills: el Asesor ve solo las pendientes que requieren atención',
    ],
    componentes: [
      { nombre: 'Botón "+ Agendar Cita" (portal cliente)', tipo: 'Button primario', clase: 'bg-cyan-600 text-white px-4 py-2 rounded-lg h=40px. Ícono Calendar', accion: 'setModalCita(true)', destino: 'Abre modal con selector de vehículo, tipo, fecha mín=hoy, hora, motivo' },
      { nombre: 'Modal de nueva cita (cliente)', tipo: 'Modal', clase: 'max-w-md bg-white rounded-2xl p-6', accion: 'Selecciona vehículo + tipo + fecha + hora + motivo → "Confirmar"', destino: 'addCita() → estado PENDIENTE → visible para el Asesor en /citas' },
      { nombre: 'Botón "Confirmar" (asesor)', tipo: 'Button éxito', clase: 'bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs', accion: 'updateCita(id, {estado:"confirmada"})', destino: 'Cita → CONFIRMADA → badge verde → habilita botón "Abrir OT"' },
      { nombre: 'Botón "Abrir OT" (asesor)', tipo: 'Button primario', clase: 'bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs. SOLO en citas CONFIRMADAS', accion: 'openWizardOT(citaData)', destino: 'Abre WizardNuevaOT pre-llenado con datos de la cita' },
      { nombre: 'Botón "Cancelar" (asesor)', tipo: 'Button texto peligro', clase: 'text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs', accion: 'confirm() → updateCita(id, {estado:"cancelada"})', destino: 'Cita → CANCELADA — con confirmación previa' },
      { nombre: 'Pills filtro de estado', tipo: 'Button pills', clase: 'px-3 py-1.5 rounded-lg text-xs. Activo: bg coloreado por estado', accion: 'setFilter(estado)', destino: 'Filtra lista de citas por estado seleccionado' },
    ],
    flujo: [
      '1. CLIENTE: Portal → Mis Citas → "+ Agendar Cita" → Modal → elige vehículo + tipo + fecha + hora → "Confirmar" → cita PENDIENTE',
      '2. ASESOR: /citas → filtra "Pendientes" → ve nueva cita → "Confirmar" → cita CONFIRMADA',
      '3. ASESOR: Cita CONFIRMADA → cliente llega → "Abrir OT" → WizardNuevaOT pre-llenado → OT en REGISTRADA',
    ],
  },
  {
    codigo: 'RFD-06', rfBase: 'RF-06',
    titulo: 'Wizard de Apertura de Orden de Trabajo (3 Pasos)',
    modulo: 'WorkOrders.tsx → WizardNuevaOT', ruta: '/ordenes → modal wizard',
    justificacion: 'El wizard de 3 pasos divide el proceso complejo de apertura de OT en etapas manejables y secuenciales. La dependencia lógica cliente → vehículo → problema hace el orden intuitivo. Los registros inline evitan que el Asesor abandone el flujo para crear datos auxiliares.',
    decisiones: [
      'Wizard vs formulario único: divide la carga cognitiva — cada paso tiene un objetivo claro',
      'Botón "Siguiente" bloqueado hasta completar el paso: evita OTs con datos incompletos',
      'Indicadores 1-2-3 con check verde al completar: orientación clara + retroalimentación del progreso',
      'Botón "+ Nueva OT" solo para Asesor: Admin/Jefe/Mecánico no pueden crear OTs',
      'Número correlativo auto-generado OT-001...: evita duplicados y facilita referencia',
    ],
    componentes: [
      { nombre: 'Botón "+ Nueva OT"', tipo: 'Button primario', clase: 'bg-slate-800 text-white px-4 py-2.5 rounded-lg text-sm. SOLO visible para Asesor', accion: 'setWizardOpen(true)', destino: 'Abre modal wizard con paso 1 limpio' },
      { nombre: 'Indicadores de paso (1-2-3)', tipo: 'Progress steps', clase: 'Círculos. Completado: bg-emerald-600 + check. Activo: bg-slate-800. Pendiente: bg-gray-200', accion: 'No clickeables — solo visual', destino: 'Orientación del progreso — no permiten retroceder ni avanzar manualmente' },
      { nombre: 'Buscador de cliente (paso 1)', tipo: 'Input search', clase: 'pl-10 py-2.5 border rounded-xl h=42px', accion: 'setSearchCliente(value)', destino: 'Filtra lista de clientes en tiempo real por nombre/CI/teléfono' },
      { nombre: 'Card de cliente (paso 1)', tipo: 'Button card', clase: 'border rounded-xl p-3. Seleccionado: border-cyan-500 bg-cyan-50', accion: 'setClienteSeleccionado(cliente)', destino: 'Selecciona cliente + carga sus vehículos para paso 2 — habilita "Siguiente"' },
      { nombre: '"+ Registrar nuevo cliente"', tipo: 'Button inline', clase: 'text-cyan-600 border border-cyan-200 px-3 py-2 rounded-lg text-sm', accion: 'setModoRegistroCliente(true)', destino: 'Formulario inline de registro SIN cerrar el wizard' },
      { nombre: 'Card de vehículo (paso 2)', tipo: 'Button card', clase: 'border rounded-xl p-3. Seleccionado: border-blue-500 bg-blue-50', accion: 'setVehiculoSeleccionado(vehiculo)', destino: 'Selecciona vehículo + habilita "Siguiente" al paso 3' },
      { nombre: '"+ Registrar vehículo" (paso 2)', tipo: 'Button inline', clase: 'text-blue-600 border border-blue-200 px-3 py-2 rounded-lg text-sm', accion: 'setModoRegistroVehiculo(true)', destino: 'Formulario inline de vehículo nuevo SIN cerrar el wizard' },
      { nombre: 'Selector "Tipo de servicio" (paso 3)', tipo: 'Select', clase: 'w-full py-2.5 border rounded-xl h=42px. Desde catálogo maestro', accion: 'setTipoServicio(value)', destino: 'Establece el tipo de servicio de la OT' },
      { nombre: 'Textarea "Descripción del problema"', tipo: 'Textarea', clase: 'w-full border rounded-xl min-h-32 p-3 resize-none', accion: 'setDescripcion(value)', destino: 'Documenta el problema reportado por el cliente' },
      { nombre: 'Botón "Crear Orden de Trabajo"', tipo: 'Submit final', clase: 'bg-slate-800 text-white w-full py-3 rounded-xl h=48px. Solo en paso 3', accion: 'addOrdenTrabajo() → log auditoría CREAR_OT', destino: 'OT-XXX creada en REGISTRADA + número correlativo + toast verde + cierra wizard' },
    ],
    flujo: [
      '1. Asesor clic "+ Nueva OT" → Wizard abre en paso 1',
      '2. Paso 1: busca/selecciona cliente (o registra nuevo inline) → "Siguiente" habilitado',
      '3. Paso 2: ve vehículos del cliente → selecciona (o registra nuevo inline) → "Siguiente"',
      '4. Paso 3: elige tipo de servicio + describe problema → "Crear Orden de Trabajo"',
      '5. OT-XXX creada en REGISTRADA → toast verde → wizard cierra → OT aparece en lista',
    ],
  },
  {
    codigo: 'RFD-07', rfBase: 'RF-07',
    titulo: 'Panel de Asignación de Mecánico (Exclusivo Jefe de Taller)',
    modulo: 'WorkOrders.tsx → PanelAsignacionMecanico', ruta: '/ordenes → modal OT',
    justificacion: 'La asignación de mecánico es responsabilidad exclusiva del Jefe. El panel es invisible para otros roles. Los indicadores de urgencia (punto rojo pulsante) guían al Jefe hacia las OTs sin asignar. El dropdown muestra la carga actual de cada mecánico para una distribución equitativa del trabajo.',
    decisiones: [
      'Panel SOLO para Jefe: el Admin ve solo lectura, el Asesor no ve el panel — evita conflictos',
      'Dropdown con carga actual "(n OTs activas)": el Jefe toma decisiones informadas sobre balanceo',
      'Punto rojo pulsante (animate-pulse) en OTs sin mecánico: urgencia visual inmediata en la lista',
      'KPI "Sin Asignar" pulsante en Dashboard: el Jefe lo ve apenas accede al sistema',
      'Notificación automática al mecánico: no requiere acción manual del Jefe',
      'Campo bloqueado post-asignación: evita cambios accidentales de mecánico asignado',
    ],
    componentes: [
      { nombre: 'KPI "Sin Asignar" (Dashboard Jefe)', tipo: 'KPI card', clase: 'border-red-300 bg-red-50 text-red-700. Punto rojo animate-pulse si > 0', accion: 'Clic → /ordenes con filtro sin-asignar', destino: 'Lista filtrada de OTs sin mecánico asignado' },
      { nombre: 'Punto rojo pulsante (lista OTs)', tipo: 'Animated dot', clase: 'w-2 h-2 rounded-full bg-red-500 animate-pulse. En fila de tabla desktop', accion: 'Solo visual', destino: 'No navega — señala visualmente la OT sin mecánico' },
      { nombre: 'Panel "Asignar Mecánico"', tipo: 'Panel div', clase: 'bg-amber-50/30 border border-amber-200 rounded-xl p-4. SOLO para Jefe de Taller', accion: 'Contenedor', destino: 'Visible solo para Jefe — contiene dropdown + botón' },
      { nombre: 'Dropdown de mecánicos', tipo: 'Select', clase: 'w-full py-2.5 border rounded-xl h=42px. Opciones: "Nombre (n OTs activas)"', accion: 'setMecanicoSeleccionado(id)', destino: 'Muestra carga actual de cada mecánico para decisión informada' },
      { nombre: 'Botón "✓ Asignar Mecánico"', tipo: 'Button primario', clase: 'bg-slate-800 text-white w-full py-2.5 rounded-xl', accion: 'asignarMecanico(otId, mecanicoId)', destino: 'Asigna + notificación automática al mecánico + log ASIGNAR_MECANICO' },
      { nombre: 'Badge mecánico asignado', tipo: 'Badge span', clase: 'bg-orange-100 text-orange-800 border-orange-300 px-2.5 py-1 rounded-full text-xs', accion: 'Ninguna', destino: 'Campo bloqueado — muestra nombre del mecánico asignado' },
    ],
    flujo: [
      '1. Jefe en Dashboard → KPI "Sin Asignar" con número pulsante → clic → /ordenes filtrado',
      '2. Lista muestra OTs con punto rojo → clic en OT → ModalDetalle',
      '3. En modal: Panel "Asignar Mecánico" visible → dropdown con mecánicos + su carga actual',
      '4. Selecciona mecánico → "✓ Asignar" → mecánico notificado automáticamente → campo bloqueado',
    ],
  },
  {
    codigo: 'RFD-08', rfBase: 'RF-08',
    titulo: 'Panel de Diagnóstico Técnico (Mecánico)',
    modulo: 'Diagnostico.tsx + WorkOrders.tsx → PanelDiagnostico', ruta: '/diagnostico y /ordenes',
    justificacion: 'El mecánico tiene dos accesos: /diagnostico con layout dedicado de dos columnas para trabajo enfocado, y dentro del modal en /ordenes. El filtro estricto garantiza que el mecánico SOLO vea sus propias OTs — esta separación es crítica para la privacidad y seguridad del flujo operativo.',
    decisiones: [
      'Layout dos columnas en /diagnostico: lista OTs izquierda (navegación) + detalle derecha (trabajo) sin perder contexto',
      'Título adaptado al rol: "Mis Órdenes" para mecánico vs "Supervisión" para Jefe/Admin',
      'Estado vacío con mensaje descriptivo: el mecánico sin OTs sabe exactamente qué esperar del sistema',
      'Constructor de cotización inline: el mecánico cotiza mientras diagnostica sin cambiar de pantalla',
      'Upload de múltiples fotos: evidencia visual obligatoria del diagnóstico técnico',
    ],
    componentes: [
      { nombre: 'Buscador OTs (columna izquierda)', tipo: 'Input search', clase: 'w-full pl-9 py-2.5 border rounded-xl h=42px. Ícono Search 14px', accion: 'setSearch(value)', destino: 'Filtra lista de OTs propias por número o placa' },
      { nombre: 'Card de OT (lista izquierda)', tipo: 'Button card', clase: 'border-2 rounded-xl p-4. Seleccionada: border-violet-500 bg-violet-50. No sel: border-gray-200 hover:border-violet-300', accion: 'setOTSeleccionada(ot)', destino: 'Carga detalle y panel de diagnóstico en columna derecha' },
      { nombre: 'Estado vacío (sin OTs)', tipo: 'Empty state', clase: 'text-center py-8. Ícono Wrench 30px opacity-20. Texto descriptivo', accion: 'Ninguna', destino: 'Informa al mecánico que no tiene OTs asignadas aún' },
      { nombre: 'Textarea "Diagnóstico principal"', tipo: 'Textarea', clase: 'w-full border rounded-xl min-h-32 p-3', accion: 'setDiagnostico(value)', destino: 'Documenta el hallazgo técnico principal de la OT' },
      { nombre: 'Textarea "Fallas adicionales"', tipo: 'Textarea', clase: 'w-full border rounded-xl min-h-20 p-3', accion: 'setFallasAdicionales(value)', destino: 'Detalles adicionales encontrados durante el diagnóstico' },
      { nombre: 'Botón "📷 Subir fotos diagnóstico"', tipo: 'File input', clase: 'border-2 border-dashed rounded-xl py-4 w-full text-sm. Hover: bg-slate-50', accion: 'fileInput.click() → múltiple', destino: 'Abre file picker — imágenes — grid 4 columnas preview' },
      { nombre: 'Botón "✈ Enviar cotización al cliente"', tipo: 'Button primario', clase: 'bg-slate-800 text-white w-full py-3 rounded-xl', accion: 'enviarCotizacion() → reservarRepuestos()', destino: 'OT → ESPERANDO_APROBACION + reserva de stock + notificación al cliente' },
    ],
    flujo: [
      '1. Mecánico abre /diagnostico → columna izquierda con sus OTs asignadas (filtro estricto por mecanicoId)',
      '2. Sin OTs: estado vacío con mensaje "El jefe te asignará nuevas órdenes"',
      '3. Clic en OT → columna derecha: detalle de la OT + panel de diagnóstico',
      '4. Escribe diagnóstico + fallas + sube fotos + construye cotización',
      '5. "✈ Enviar cotización al cliente" → OT=ESPERANDO_APROBACION + stock reservado + notif. cliente',
    ],
  },
  {
    codigo: 'RFD-09', rfBase: 'RF-09',
    titulo: 'Constructor de Cotización Línea a Línea',
    modulo: 'WorkOrders.tsx → PanelDiagnostico (sección cotización)', ruta: '/ordenes y /diagnostico',
    justificacion: 'La cotización se construye línea a línea con 3 tipos diferenciados. El cálculo automático por línea y total garantiza transparencia. El campo "Costo diagnóstico" separado cubre el escenario de rechazo del cliente sin afectar las líneas de la cotización principal.',
    decisiones: [
      'Búsqueda integrada con inventario: precio PVP automático — garantiza precios correctos del catálogo',
      '3 tipos de línea: Repuesto (del inventario), MO (horas + precio/hora), Diagnóstico (cargo fijo)',
      'Subtotal automático por línea: el mecánico ve el impacto de cada ítem inmediatamente',
      'IVA solo al mostrar al cliente: los precios internos son sin IVA para facilitar el cálculo',
      '"Costo diagnóstico" como campo separado: cobro condicional si rechazan, no una línea de la cotización',
    ],
    componentes: [
      { nombre: 'Selector "Tipo de línea"', tipo: 'Select', clase: 'border rounded-lg py-2 px-3 h=38px', accion: 'setTipoLinea(value)', destino: 'Repuesto=buscador inventario, MO=texto libre, Diagnóstico=texto fijo' },
      { nombre: 'Buscador de repuesto (tipo Repuesto)', tipo: 'Input search', clase: 'pl-9 py-2 border rounded-lg h=38px', accion: 'setSearchRepuesto(value)', destino: 'Filtra inventario — al seleccionar auto-carga nombre + precio PVP' },
      { nombre: 'Input "Cantidad"', tipo: 'Input number', clase: 'w-20 border rounded-lg py-2 px-3 h=38px min=1', accion: 'setCantidad(n) → recalcularSubtotal()', destino: 'Actualiza subtotal automáticamente al cambiar' },
      { nombre: 'Input "Precio unitario"', tipo: 'Input number', clase: 'w-28 border rounded-lg py-2 px-3 h=38px', accion: 'setPrecioUnitario(n) → recalcularSubtotal()', destino: 'Actualiza subtotal automáticamente al cambiar' },
      { nombre: 'Subtotal por línea (display)', tipo: 'Text readonly', clase: 'text-right font-bold text-slate-800 min-w-24', accion: 'Calculado: cantidad × precioUnitario', destino: 'Se actualiza en tiempo real — solo lectura' },
      { nombre: 'Botón "+ Agregar línea"', tipo: 'Button secundario', clase: 'border border-cyan-200 text-cyan-600 px-3 py-2 rounded-lg text-sm', accion: 'agregarLineaCotizacion()', destino: 'Agrega línea a tabla + limpia formulario de línea nueva' },
      { nombre: 'Tabla de cotización', tipo: 'Table', clase: 'w-full border rounded-xl overflow-hidden. Ícono Trash por línea → eliminarLinea(index)', accion: 'Trash → elimina línea', destino: 'Elimina la línea seleccionada y recalcula total' },
      { nombre: 'Resumen con IVA (display)', tipo: 'Summary div', clase: 'bg-slate-50 border-t px-4 py-3. Subtotal + IVA 12% + TOTAL en bold', accion: 'Solo lectura — calculado automáticamente', destino: 'Total a presentar al cliente con IVA incluido' },
      { nombre: 'Input "Costo de diagnóstico"', tipo: 'Input number', clase: 'w-32 border rounded-xl py-2 px-3', accion: 'setCostoDiagnostico(n)', destino: 'Monto cobrado al cliente si rechaza la cotización — independiente de las líneas' },
    ],
    flujo: [
      '1. Mecánico en panel diagnóstico → sección Cotización',
      '2. Tipo "Repuesto" → busca repuesto → precio auto-cargado → cantidad → "+ Agregar línea"',
      '3. Tipo "Mano de Obra" → descripción libre + horas + precio/hora → "+ Agregar línea"',
      '4. Define "Costo de diagnóstico" (cobrado si rechazan la reparación)',
      '5. Tabla muestra todas las líneas + total con IVA → "✈ Enviar cotización al cliente"',
    ],
  },
  {
    codigo: 'RFD-10', rfBase: 'RF-10',
    titulo: 'Aprobación / Rechazo de Cotización (Exclusivo Cliente)',
    modulo: 'ClientPortal.tsx + WorkOrders.tsx → PanelAprobacion', ruta: '/portal → Mis Servicios',
    justificacion: 'La decisión de aprobar o rechazar es EXCLUSIVA del cliente. Banners de alerta prominentes garantizan que sea lo primero visible al entrar al portal. Los botones de acción son grandes y diferenciados. El personal solo puede ver la cotización, no actuar — separación de roles estricta.',
    decisiones: [
      'Banner amarillo de alerta automático: la cotización pendiente debe ser lo primero que vea el cliente',
      'Tabla completa de cotización visible: el cliente necesita entender exactamente qué se le cobra antes de decidir',
      '"Si rechazas pagarás: $XX" explícito: transparencia de consecuencias económicas',
      'Botones Aprobar/Rechazar prominentes (~50% ancho, h=48px): acción de alto impacto debe ser obvia',
      'Panel informativo sin botones para staff: evita que el staff actúe por el cliente accidentalmente',
    ],
    componentes: [
      { nombre: 'Banner alerta amarillo (portal)', tipo: 'Alert banner', clase: 'bg-amber-50 border border-amber-300 rounded-xl p-4 mb-4 text-amber-800', accion: 'Scroll a sección Mis Servicios', destino: 'Guía visualmente al cliente hacia la cotización pendiente' },
      { nombre: 'Badge "⚡ Requiere tu aprobación"', tipo: 'Badge animated', clase: 'bg-amber-100 text-amber-800 border-amber-300 px-2.5 py-1 rounded-full text-xs', accion: 'Ninguna — visual', destino: 'Identificador de OTs con cotización esperando decisión del cliente' },
      { nombre: 'Tabla cotización (vista cliente)', tipo: 'Table readonly', clase: 'w-full border rounded-xl. Tipo, Descripción, Cant., P.Unit., Subtotal', accion: 'Solo lectura', destino: 'Muestra todas las líneas de la cotización del mecánico' },
      { nombre: 'Aviso "Si rechazas pagarás: $XX"', tipo: 'Alert info', clase: 'bg-red-50 border-red-200 text-red-700 rounded-xl p-3 text-sm', accion: 'Ninguna — informativo', destino: 'Informa el costo mínimo de diagnóstico si el cliente rechaza' },
      { nombre: 'Botón "👍 Aprobar cotización"', tipo: 'Button éxito', clase: 'bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-6 rounded-xl font-bold. ~50% ancho', accion: 'aprobarCotizacion(otId)', destino: 'OT → EN_REPARACION + stock reservado confirmado + notif. mecánico' },
      { nombre: 'Botón "👎 Rechazar"', tipo: 'Button peligro', clase: 'bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-xl font-bold. ~50% ancho', accion: 'rechazarCotizacion(otId)', destino: 'OT → LIQUIDACION_DIAGNOSTICO + stock liberado + notif. asesor' },
      { nombre: 'Panel informativo (para staff)', tipo: 'Info panel', clase: 'bg-amber-50 border rounded-xl p-4. Badge "Pendiente cliente". SIN botones de acción', accion: 'Solo lectura para Asesor/Jefe/Admin', destino: 'Staff ve cotización pero NO puede actuar por el cliente' },
    ],
    flujo: [
      '1. Mecánico envía cotización → cliente recibe notificación bell + banner amarillo en portal',
      '2. Cliente ve banner → desplaza a Mis Servicios → card con badge "⚡ Requiere tu aprobación"',
      '3. Expande card → tabla cotización completa + totales + aviso costo diagnóstico',
      '4. APRUEBA: "👍 Aprobar" → OT → EN_REPARACION → mecánico y asesor notificados',
      '5. RECHAZA: "👎 Rechazar" → OT → LIQUIDACION_DIAGNOSTICO → asesor notificado → stock liberado',
    ],
  },
  {
    codigo: 'RFD-11', rfBase: 'RF-11',
    titulo: 'Liquidación por Rechazo de Cotización',
    modulo: 'WorkOrders.tsx → PanelLiquidacion', ruta: '/ordenes → modal OT (LIQUIDACION_DIAGNOSTICO)',
    justificacion: 'El rechazo genera un estado especial de liquidación donde solo se cobra el diagnóstico. El stock se libera automáticamente. La OT nunca se elimina — queda en FINALIZADA con su factura de diagnóstico para trazabilidad completa del historial del vehículo.',
    decisiones: [
      'Estado LIQUIDACION_DIAGNOSTICO propio: visibilidad clara de que este flujo es diferente al normal',
      'Liberación de stock automática: evita que el mecánico o asesor olviden liberar el inventario reservado',
      'Panel simple con el monto fijo del diagnóstico: no hay negociación — el monto se definió al inicio',
      'OT queda en FINALIZADA (no eliminada): el historial permanece para trazabilidad y auditoría',
    ],
    componentes: [
      { nombre: 'Badge LIQUIDACION_DIAGNOSTICO', tipo: 'EstadoBadge', clase: 'bg-red-100 text-red-700 border-red-300. En header del modal', accion: 'Ninguna', destino: 'Indica el estado especial de liquidación por rechazo' },
      { nombre: 'Aviso "Stock liberado automáticamente"', tipo: 'Info box', clase: 'bg-emerald-50 border-emerald-200 text-emerald-700 rounded-xl p-3 text-xs', accion: 'Ninguna — automático', destino: 'Informa que cantidadReservada -= n fue ejecutado' },
      { nombre: 'Panel "Liquidación de Diagnóstico"', tipo: 'Panel div', clase: 'bg-red-50 border border-red-200 rounded-xl p-4', accion: 'Contenedor', destino: 'Agrupa monto + selector método + botón de pago' },
      { nombre: 'Monto diagnóstico (display)', tipo: 'Text display', clase: 'text-2xl font-bold text-red-700', accion: 'Solo lectura', destino: 'Muestra el costo de diagnóstico acordado — no editable' },
      { nombre: 'Selector "Método de pago"', tipo: 'Select', clase: 'w-full py-2.5 border rounded-xl h=42px', accion: 'setMetodoPago(value)', destino: 'Efectivo / Tarjeta / Transferencia / Depósito / etc.' },
      { nombre: 'Botón "Registrar Pago de Diagnóstico"', tipo: 'Button primario', clase: 'bg-slate-800 text-white w-full py-3 rounded-xl font-semibold', accion: 'registrarPagoDiagnostico()', destino: 'Genera Factura FAC-XXXX + OT → FINALIZADA + toast con número de factura' },
    ],
    flujo: [
      '1. Cliente rechaza cotización → OT automáticamente en LIQUIDACION_DIAGNOSTICO + stock liberado',
      '2. Asesor abre modal de la OT → Panel de Liquidación visible con monto fijo',
      '3. Selecciona método de pago → "Registrar Pago de Diagnóstico"',
      '4. Factura FAC-XXXX emitida → OT → FINALIZADA → inmutable',
    ],
  },
  {
    codigo: 'RFD-12', rfBase: 'RF-12',
    titulo: 'Ejecución de la Reparación (Panel del Mecánico)',
    modulo: 'WorkOrders.tsx → PanelReparacion', ruta: '/ordenes → modal OT (EN_REPARACION)',
    justificacion: 'El panel de reparación permite documentar el trabajo en tiempo real con guardado parcial. El descuento de stock al registrar repuestos mantiene el inventario siempre sincronizado. Las fotos antes/después son evidencia para el QC y para el cliente.',
    decisiones: [
      'Guardado parcial sin cambiar estado: el mecánico puede guardar avances y volver más tarde',
      'Descuento inmediato de stock al agregar repuesto usado: inventario siempre actualizado en tiempo real',
      'Fotos antes/después en grid 4 columnas: evidencia visual clara para el QC y transparente para el cliente',
      '2 botones claramente diferenciados (Guardar / Enviar a QC): guardar no finaliza, enviar a QC sí',
    ],
    componentes: [
      { nombre: 'Panel "Reparación en Proceso"', tipo: 'Panel div', clase: 'bg-cyan-50/30 border border-cyan-200 rounded-xl p-4. SOLO para mecánico asignado en EN_REPARACION', accion: 'Contenedor', destino: 'Solo visible para el mecánico asignado a esta OT específica' },
      { nombre: 'Textarea "Notas de reparación"', tipo: 'Textarea', clase: 'w-full border rounded-xl min-h-28 p-3 resize-none', accion: 'setNotasReparacion(value)', destino: 'Documenta el trabajo realizado — guardable parcialmente' },
      { nombre: 'Buscador "Repuesto usado"', tipo: 'Input search', clase: 'pl-9 py-2.5 border rounded-xl h=42px', accion: 'setSearchRepuesto(value)', destino: 'Filtra inventario disponible (sin reservas activas de otras OTs)' },
      { nombre: 'Botón "+ Registrar repuesto usado"', tipo: 'Button secundario', clase: 'border text-cyan-600 px-3 py-2 rounded-lg text-sm', accion: 'registrarSalidaRepuesto(repuestoId, cantidad)', destino: 'cantidad -= n en inventario + movimiento Kardex tipo "salida"' },
      { nombre: 'Botón "📷 Subir fotos antes/después"', tipo: 'File input', clase: 'border-2 border-dashed rounded-xl py-4 w-full text-sm', accion: 'fileInput.click() múltiple', destino: 'Grid 4 columnas de preview + botón X por foto para eliminar' },
      { nombre: 'Barra de progreso (subtareas)', tipo: 'Progress bar', clase: 'bg-gray-200 rounded-full h-2. Completado: bg-cyan-500. % basado en checkboxes', accion: 'Checkboxes de subtareas → actualiza %', destino: 'Muestra visualmente el avance de la reparación' },
      { nombre: 'Botón "💾 Guardar Reparación"', tipo: 'Button secundario', clase: 'border border-slate-300 text-slate-600 py-2.5 px-4 rounded-xl. 50% ancho', accion: 'guardarReparacionParcial()', destino: 'Guarda notas + repuestos SIN cambiar el estado de la OT' },
      { nombre: 'Botón "✓ Enviar a Control de Calidad"', tipo: 'Button primario', clase: 'bg-slate-800 text-white py-2.5 px-4 rounded-xl. 50% ancho', accion: 'enviarAQC()', destino: 'OT → CONTROL_CALIDAD + notificación automática al Jefe de Taller' },
    ],
    flujo: [
      '1. OT aprobada por el cliente → mecánico accede al Panel de Reparación en su OT',
      '2. Escribe notas + registra repuestos usados (stock se descuenta en tiempo real)',
      '3. Sube fotos antes/después + marca subtareas completadas',
      '4. "💾 Guardar Reparación" → guarda avance SIN cambiar estado (puede continuar después)',
      '5. Al terminar → "✓ Enviar a Control de Calidad" → OT = CONTROL_CALIDAD → Jefe notificado',
    ],
  },
  {
    codigo: 'RFD-13', rfBase: 'RF-13',
    titulo: 'Control de Calidad (Exclusivo Jefe de Taller)',
    modulo: 'WorkOrders.tsx → PanelControlCalidad', ruta: '/ordenes → modal OT (CONTROL_CALIDAD)',
    justificacion: 'El Control de Calidad es el último filtro técnico antes de entregar el vehículo. El Jefe accede a TODA la información de la OT. Las observaciones al rechazar son obligatorias para garantizar retroalimentación útil al mecánico. Dos notificaciones automáticas al aprobar sincronizan al equipo.',
    decisiones: [
      'Acceso completo a toda la OT en modo lectura: el Jefe necesita todos los datos para decidir con certeza',
      'Checkbox "Prueba de ruta" obligatorio: formaliza el paso más crítico del QC automotriz',
      'Textarea observaciones obligatorio al rechazar: retroalimentación clara al mecánico — no puede rechazar sin explicar',
      'KPI pulsante en Dashboard: el Jefe no puede olvidar OTs esperando QC',
      '2 notificaciones al aprobar (cliente + asesor): sincronización inmediata del equipo',
    ],
    componentes: [
      { nombre: 'KPI "Control Calidad" (Dashboard Jefe)', tipo: 'KPI card', clase: 'bg-purple-50 border-purple-200. Número pulsante en naranja si > 0', accion: 'Clic → /ordenes filtrado por CONTROL_CALIDAD', destino: 'Lista de OTs esperando aprobación del Jefe de Taller' },
      { nombre: 'Panel QC (header modal)', tipo: 'Panel div', clase: 'bg-purple-50/30 border border-purple-200 rounded-xl p-4. SOLO para Jefe en CONTROL_CALIDAD', accion: 'Contenedor', destino: 'Agrupa toda la información de revisión + botones de acción' },
      { nombre: 'Grid de fotos (solo lectura)', tipo: 'Image grid', clase: 'grid grid-cols-4 gap-2. Imágenes con cursor pointer para ampliar', accion: 'Clic → amplía imagen a pantalla completa', destino: 'Revisión visual del diagnóstico y la reparación' },
      { nombre: 'Checkbox "Prueba de ruta realizada"', tipo: 'Checkbox', clase: 'w-5 h-5 rounded accent-slate-800 cursor-pointer', accion: 'setPruebaRuta(checked)', destino: 'Registra formalmente que se realizó la prueba de ruta' },
      { nombre: 'Textarea "Observaciones QC"', tipo: 'Textarea', clase: 'w-full border rounded-xl min-h-20 p-3. Obligatorio si rechaza', accion: 'setObservacionesQC(value)', destino: 'Retroalimentación para el mecánico — enviada en notificación al rechazar' },
      { nombre: 'Botón "✅ Aprobar QC y Liberar Vehículo"', tipo: 'Button éxito', clase: 'bg-emerald-600 text-white py-3 px-6 rounded-xl font-bold. 50% ancho', accion: 'aprobarQC()', destino: 'OT → LIBERADA + notif. CLIENTE + notif. ASESOR + log APROBAR_QC' },
      { nombre: 'Botón "❌ Rechazar → Devolver a Reparación"', tipo: 'Button peligro', clase: 'bg-red-600 text-white py-3 px-6 rounded-xl font-bold. 50% ancho', accion: 'rechazarQC(observaciones)', destino: 'OT → EN_REPARACION + notif. MECÁNICO con observaciones + log RECHAZAR_QC' },
    ],
    flujo: [
      '1. Mecánico envía a QC → Jefe ve KPI pulsante "Control Calidad" en Dashboard',
      '2. Jefe abre OT en CONTROL_CALIDAD → Panel QC con todo el historial completo',
      '3. Revisa diagnóstico + fotos + notas de reparación + repuestos usados + lista de repuestos',
      '4. Marca "Prueba de ruta" + escribe observaciones (si rechaza: obligatorio)',
      '5. APRUEBA: "✅ Aprobar QC" → OT LIBERADA → cliente y asesor notificados automáticamente',
      '6. RECHAZA: "❌ Rechazar" → OT vuelve a EN_REPARACION → mecánico notificado con observaciones',
    ],
  },
  {
    codigo: 'RFD-14', rfBase: 'RF-14',
    titulo: 'Sistema de Pagos Dual (Online + Presencial)',
    modulo: 'ClientPortal.tsx → ModalPago + WorkOrders.tsx → PanelEntrega', ruta: '/portal + /ordenes',
    justificacion: 'Dos flujos de pago paralelos para comodidad del cliente y flexibilidad operativa. El cliente puede pagar online desde su portal; el asesor puede cobrar presencialmente. Ambos generan factura. El online mantiene la OT en LIBERADA hasta la entrega física confirmada por el Asesor.',
    decisiones: [
      'Banner verde prominente "🎉 ¡Tu vehículo está listo!": el evento más importante del portal debe ser inmediatamente visible',
      'Código de recojo = número OT: sencillo de comunicar y verificar en taller',
      'OT permanece en LIBERADA hasta entrega física: el pago online no finaliza la OT — el asesor confirma',
      'Indicador "Pagado en Línea" visible para el asesor: sabe que no debe cobrar de nuevo al cliente',
    ],
    componentes: [
      { nombre: 'Banner "🎉 ¡Tu vehículo está listo!" (portal)', tipo: 'Alert banner', clase: 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl p-4. Prominente', accion: 'Scroll a la OT lista', destino: 'Muestra OT + código de recojo + botón "Pagar y Recoger"' },
      { nombre: 'Botón "Pagar y Recoger"', tipo: 'Button', clase: 'bg-white text-emerald-700 border-2 border-emerald-400 hover:bg-emerald-50 py-3 px-6 rounded-xl font-bold', accion: 'setModalPago(true)', destino: 'Abre modal con 3 métodos de pago online' },
      { nombre: 'Código de recojo (display)', tipo: 'Text display', clase: 'font-mono text-2xl font-bold text-emerald-700 bg-white rounded-xl p-3', accion: 'Clic → copiar al portapapeles', destino: 'Muestra número de OT como código para presentar en taller' },
      { nombre: 'Botón "Confirmar Pago" (modal online)', tipo: 'Submit button', clase: 'bg-emerald-600 text-white w-full py-3 rounded-xl font-bold', accion: 'pagarEnLinea(otId, metodo)', destino: 'OT.pagadoEnLinea=true + notificación al Asesor + modal cierra' },
      { nombre: 'Badge "✅ Pagado en Línea" (para asesor)', tipo: 'Badge', clase: 'bg-emerald-100 text-emerald-700 border-emerald-300 px-2.5 py-1 rounded-full', accion: 'Ninguna — informativo', destino: 'El Asesor sabe que el cliente ya pagó online — no cobrar de nuevo' },
      { nombre: 'Panel "Entrega y Cobro" (Asesor)', tipo: 'Panel div', clase: 'bg-emerald-50 border border-emerald-200 rounded-xl p-4. SOLO para Asesor en LIBERADA', accion: 'Contenedor', destino: 'Asesor confirma la entrega física del vehículo' },
      { nombre: 'Botón "Registrar Pago y Entregar"', tipo: 'Button primario', clase: 'bg-slate-800 text-white w-full py-3 rounded-xl font-semibold', accion: 'registrarPagoYEntregar()', destino: 'Factura generada + OT → FINALIZADA + entregaFirmada=true' },
    ],
    flujo: [
      '1. FLUJO CLIENTE: OT LIBERADA → banner verde en portal → "Pagar y Recoger" → modal → confirma método → OT.pagadoEnLinea=true → asesor notificado',
      '2. FLUJO ASESOR: Ve badge "Pagado en Línea" en panel → confirma entrega física → "Registrar Pago y Entregar" → OT FINALIZADA',
      '3. FLUJO PRESENCIAL: Cliente llega sin pagar online → Asesor cobra → "Registrar Pago y Entregar" → Factura → OT FINALIZADA',
    ],
  },
  {
    codigo: 'RFD-15', rfBase: 'RF-15',
    titulo: 'Generación Automática de Factura',
    modulo: 'Facturas.tsx + addFactura() en AppContext', ruta: '/facturas',
    justificacion: 'Las facturas se generan automáticamente al registrar pago — nunca manualmente. El módulo /facturas es accesible para Asesor, Admin y Cliente (cada rol ve su subconjunto). El PDF con jsPDF permite entrega digital inmediata.',
    decisiones: [
      'Generación automática al pagar: elimina el riesgo de olvidar emitir la factura',
      'Número único FAC-XXXXXXXXXX: trazabilidad completa, no editable una vez emitida',
      'Campo NIT en factura: permite factura a nombre de empresa según requerimiento del negocio',
      'IVA 12% calculado automáticamente: sin intervención manual del Asesor',
    ],
    componentes: [
      { nombre: 'Lista de facturas (tabla desktop)', tipo: 'Table', clase: 'Columnas: FAC#, Fecha, Cliente, OT, Total, Método, Estado. hover:bg-slate-50', accion: 'Clic fila → expandir desglose completo', destino: 'Muestra líneas + subtotal + IVA + total + método de pago' },
      { nombre: 'Pills de filtro estado', tipo: 'Pills', clase: 'px-3 py-1.5 rounded-lg text-xs. Todos/Emitida/Pagada', accion: 'setFilterEstado(value)', destino: 'Filtra lista de facturas por estado de pago' },
      { nombre: 'Badge estado factura', tipo: 'Badge', clase: 'emitida: bg-amber-100 text-amber-700. pagada: bg-emerald-100 text-emerald-700', accion: 'Ninguna', destino: 'Indica visualmente si la factura ha sido pagada' },
      { nombre: 'Botón "🖨 Generar PDF"', tipo: 'Button', clase: 'bg-slate-800 text-white px-4 py-2 rounded-lg text-sm. Ícono FileText', accion: 'generarPDF(factura)', destino: 'Genera y descarga PDF con: número, fecha, cliente, NIT, líneas, subtotal, IVA, total, método' },
    ],
    flujo: [
      '1. Pago registrado → addFactura() ejecutado automáticamente → FAC-XXXX disponible en /facturas',
      '2. Asesor/Admin/Cliente filtra por estado/fecha → encuentra factura → clic → expande desglose',
      '3. "🖨 Generar PDF" → jsPDF genera documento → descarga automática en el navegador',
    ],
  },
  {
    codigo: 'RFD-16', rfBase: 'RF-16',
    titulo: 'Cierre Formal de Orden de Trabajo',
    modulo: 'WorkOrders.tsx → PanelEntrega', ruta: '/ordenes → modal OT (LIBERADA)',
    justificacion: 'El cierre formal registra la entrega física del vehículo con notas de condición. Una vez FINALIZADA, la OT es completamente inmutable. Esta inmutabilidad protege la integridad del historial y garantiza la trazabilidad ante cualquier reclamo posterior.',
    decisiones: [
      'Campo de notas de entrega: documenta la condición del vehículo al entregarlo — protege al taller',
      'OT inmutable tras finalizar: evita modificaciones accidentales al historial de servicio',
      'Badge "🔒 Solo lectura": claridad visual inmediata de que la OT ya no se puede editar',
    ],
    componentes: [
      { nombre: 'Textarea "Notas de entrega"', tipo: 'Textarea', clase: 'w-full border rounded-xl py-2.5 px-3 min-h-20 resize-none', accion: 'setNotasEntrega(value)', destino: 'Documenta la condición del vehículo al momento de entrega física' },
      { nombre: 'Selector "Método de pago final"', tipo: 'Select', clase: 'w-full py-2.5 border rounded-xl h=42px', accion: 'setMetodoPagoFinal(value)', destino: 'Registra el método de pago real usado en la entrega' },
      { nombre: 'Botón "Registrar Pago y Entregar"', tipo: 'Button primario', clase: 'bg-slate-800 text-white w-full py-3 rounded-xl font-bold h=48px', accion: 'cerrarOT() → addFactura() → OT=FINALIZADA', destino: 'OT FINALIZADA + entregaFirmada=true + Factura — acción irreversible' },
      { nombre: 'Badge "🔒 Solo lectura" (post-finalización)', tipo: 'Badge', clase: 'bg-slate-100 text-slate-500 border rounded-full px-2.5 py-1 text-xs', accion: 'Ninguna', destino: 'Indica que la OT es inmutable — visible en header del modal tras finalizar' },
    ],
    flujo: [
      '1. Asesor en modal de OT LIBERADA → Panel "Entrega y Cobro" visible',
      '2. Escribe notas de entrega + selecciona método de pago',
      '3. "Registrar Pago y Entregar" → OT = FINALIZADA + entregaFirmada=true + Factura emitida',
      '4. Modal muestra OT en modo solo lectura con badge "🔒 Solo lectura" en header',
    ],
  },
  {
    codigo: 'RFD-17', rfBase: 'RF-17',
    titulo: 'Módulo de Inventario: Repuestos, Proveedores y Kardex',
    modulo: 'Inventory.tsx', ruta: '/inventario',
    justificacion: 'El inventario tiene 3 tabs que cubren los tres aspectos del control de repuestos: ítems (Repuestos), fuentes de abastecimiento (Proveedores) y historial (Kardex). El precio PVP se calcula automáticamente. La diferenciación de roles (Admin=CRUD, Mecánico=solo lectura) aplica permisos sin navegación separada.',
    decisiones: [
      'Tabs Repuestos / Proveedores / Kardex: 3 conceptos del mismo dominio en un módulo cohesivo',
      'Precio PVP = costo × (1 + margen) calculado automáticamente: consistencia de precios en todo el sistema',
      'Alerta visual roja cuando stock ≤ stockMinimo: urgencia inmediata sin necesidad de buscar',
      'Mecánico solo lectura: necesita ver disponibilidad para cotizar, pero no puede modificar precios',
    ],
    componentes: [
      { nombre: 'Tab "Repuestos"', tipo: 'Button tab', clase: 'py-2.5 px-4 rounded-xl. Activo: bg-slate-800 text-white', accion: 'setTab("repuestos")', destino: '16 repuestos con filtros de categoría + botón entrada de stock (Admin)' },
      { nombre: 'Tab "Proveedores"', tipo: 'Button tab', clase: 'py-2.5 px-4 rounded-xl. Activo: bg-slate-800 text-white', accion: 'setTab("proveedores")', destino: '6 proveedores: nombre, contacto, teléfono, productos que suministra' },
      { nombre: 'Tab "Kardex"', tipo: 'Button tab', clase: 'py-2.5 px-4 rounded-xl. Activo: bg-slate-800 text-white', accion: 'setTab("kardex")', destino: '24 movimientos: fecha, repuesto, tipo (badge), cantidad, stock resultante, OT, usuario' },
      { nombre: 'Pills de categoría (filtro)', tipo: 'Pills overflow-x-auto', clase: 'bg-white border rounded-xl p-2. Activo: bg-slate-800 text-white. 6 categorías', accion: 'setCategoria(cat)', destino: 'Filtra tabla de repuestos por la categoría seleccionada' },
      { nombre: 'Botón "+ Entrada de stock"', tipo: 'Button primario', clase: 'bg-slate-800 text-white px-4 py-2.5 rounded-lg text-sm. SOLO para Admin', accion: 'setModalEntrada(repuesto)', destino: 'Modal: cantidad + proveedor + costo de entrada → Kardex tipo "entrada"' },
      { nombre: 'Badge "Stock bajo"', tipo: 'Badge', clase: 'bg-red-100 text-red-700 border-red-200 px-2 py-0.5 rounded text-xs. Ícono AlertTriangle', accion: 'Ninguna', destino: 'Alerta visual cuando cantidad ≤ stockMinimo — fila con bg-red-50/30' },
      { nombre: 'Input "Margen de ganancia" (modal)', tipo: 'Input number', clase: 'border rounded-xl py-2.5 px-3 h=42px', accion: 'setMargen(n) → recalcularPVP()', destino: 'PVP se recalcula en tiempo real: costo × (1 + margen/100)' },
    ],
    flujo: [
      '1. Admin/Mecánico en /inventario → Tab "Repuestos" por defecto con 16 repuestos',
      '2. Admin: "+ Entrada de stock" → modal → cantidad + proveedor → "Guardar" → Kardex tipo "entrada"',
      '3. Admin: edita repuesto → cambia margen → PVP se recalcula automáticamente',
      '4. Mecánico: solo lectura — ve stock disponible para cotizar en sus diagnósticos',
    ],
  },
  {
    codigo: 'RFD-18', rfBase: 'RF-18',
    titulo: 'Control Automático de Stock: Kardex y Reservas',
    modulo: 'AppContext.tsx → reservarRepuestos(), registrarSalidaRepuesto(), liberarReservas()', ruta: 'Lógica en AppContext — visible en Inventory.tsx → Tab Kardex',
    justificacion: 'El Kardex automatiza los cuatro movimientos de inventario vinculados al ciclo de vida de una OT. La automatización es crítica para evitar descuadres y garantizar que el inventario refleje siempre la realidad operativa del taller en tiempo real.',
    decisiones: [
      'RESERVA al cotizar (no al aprobar): el stock se aparta inmediatamente para la OT aunque el cliente aún no confirme',
      'LIBERACIÓN automática al rechazar: si no hay reparación, el stock vuelve disponible sin acción manual',
      'SALIDA REAL al registrar reparación: el descuento definitivo del inventario cuando se usó realmente',
      'cantidadReservada separada de cantidad: un repuesto puede tener stock pero todo reservado para OTs activas',
    ],
    componentes: [
      { nombre: 'Tab "Kardex" en Inventory.tsx', tipo: 'Button tab', clase: 'py-2.5 px-4 rounded-xl. Activo: bg-slate-800 text-white', accion: 'setTab("kardex")', destino: 'Historial completo de 24 movimientos desde dic-2025' },
      { nombre: 'Tabla de movimientos Kardex', tipo: 'Table readonly', clase: 'Columnas: Fecha, Repuesto, Tipo, Cantidad, Stock Resultante, OT, Usuario', accion: 'Solo lectura', destino: 'Trazabilidad completa de cada movimiento de inventario' },
      { nombre: 'Badge tipo movimiento', tipo: 'Badge', clase: 'entrada: bg-emerald-100. salida: bg-red-100. reserva: bg-amber-100. liberacion: bg-blue-100', accion: 'Ninguna', destino: 'Identificación visual inmediata del tipo de movimiento de inventario' },
      { nombre: 'Columna "Disponible" (tabla repuestos)', tipo: 'Text cell calculado', clase: 'font-mono text-sm. Rojo si ≤ stockMinimo', accion: 'Solo lectura', destino: 'cantidad - cantidadReservada = stock libre para nuevas OTs' },
    ],
    flujo: [
      '1. Mecánico envía cotización → reservarRepuestos() → cantidadReservada += n → Kardex tipo "reserva"',
      '2. Cliente APRUEBA → stock reservado se confirma (el descuento ocurre al registrar reparación)',
      '3. Cliente RECHAZA → liberarReservas() automático → cantidadReservada -= n → Kardex tipo "liberacion"',
      '4. Mecánico registra reparación → registrarSalidaRepuesto() → cantidad -= n → Kardex tipo "salida"',
      '5. Admin ingresa stock → addStockRepuesto() → cantidad += n → Kardex tipo "entrada"',
    ],
  },
  {
    codigo: 'RFD-19', rfBase: 'RF-19',
    titulo: 'Vista de Órdenes de Trabajo por Rol',
    modulo: 'WorkOrders.tsx', ruta: '/ordenes',
    justificacion: 'La misma ruta /ordenes presenta contenido diferente según el rol activo. Esto mantiene la simplicidad de navegación (una sola URL) mientras ofrece la experiencia óptima para cada rol. El Mecánico ve su panel exclusivo, el Asesor ve tabla completa con wizard, el Jefe ve énfasis en pendientes críticos, el Admin en solo lectura.',
    decisiones: [
      'Una sola ruta /ordenes con vistas adaptadas: menor número de rutas, menor confusión de navegación',
      'MecanicoWorkPanel (no tabla): el mecánico trabaja por etapas de su flujo, no necesita tabla global',
      'Pills de estado con contadores: visión inmediata de cuántas OTs hay en cada estado',
      'Tabla desktop / cards móvil: responsividad completa sin perder funcionalidad',
      'Badge "🔒 Solo lectura" para Admin: claridad de permisos — evita que el Admin intente editar',
    ],
    componentes: [
      { nombre: 'Pills de estado (filtros)', tipo: 'Button pills overflow-x-auto', clase: 'bg-white border rounded-xl p-3. Activo: bg coloreado por estado. Contador en badge', accion: 'setFiltroEstado(estado)', destino: 'Filtra lista de OTs mostrando solo el estado seleccionado' },
      { nombre: 'Input búsqueda global', tipo: 'Input search', clase: 'pl-10 py-2.5 border rounded-lg bg-white h=42px', accion: 'setSearch(value)', destino: 'Filtra OTs por número OT, nombre cliente o placa de vehículo' },
      { nombre: 'Tabla de OTs (desktop sm+)', tipo: 'Table', clase: 'hidden sm:table. 7 columnas. thead bg-slate-100. hover:bg-slate-50', accion: 'Clic fila → ModalDetalle', destino: 'Abre modal de detalle de la OT seleccionada' },
      { nombre: 'Cards de OT (móvil <sm)', tipo: 'Cards list', clase: 'sm:hidden. divide-y. Cada card: px-4 py-3 cursor-pointer', accion: 'Clic card → ModalDetalle', destino: 'Abre ModalDetalle en pantalla completa' },
      { nombre: 'MecanicoWorkPanel (Mecánico)', tipo: 'Panel exclusivo', clase: 'Reemplaza tabla. Secciones por estado. OTCard: border-2 rounded-xl p-4', accion: 'Clic en OTCard → ModalDetalle', destino: 'Abre panel de diagnóstico/reparación de la OT del mecánico' },
      { nombre: 'Badge "🔒 Solo lectura" (Admin)', tipo: 'Badge', clase: 'bg-slate-100 text-slate-500 border rounded-full px-2.5 py-1 text-xs. En header del módulo', accion: 'Ninguna', destino: 'Indica al Admin que puede ver pero no puede modificar OTs' },
      { nombre: 'Botón "👁 Ver" (columna acciones)', tipo: 'Button icono', clase: 'p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg. 32×32px', accion: 'abrirModal(ot)', destino: 'Abre ModalDetalle de la OT — alternativa al clic en fila' },
    ],
    flujo: [
      '1. ASESOR: tabla completa + "+ Nueva OT" → wizard → OT creada → aparece en lista',
      '2. JEFE: tabla con badge rojo en sin-asignar + alerta → clic OT → asigna mecánico',
      '3. MECÁNICO: MecanicoWorkPanel con SUS OTs → clic OT → diagnóstico o reparación',
      '4. ADMIN: tabla completa en solo lectura → puede ver detalles pero no actuar',
    ],
  },
  {
    codigo: 'RFD-20', rfBase: 'RF-20',
    titulo: 'Panel de Reportes y Analítica (Exclusivo Administrador)',
    modulo: 'Reportes.tsx', ruta: '/reportes',
    justificacion: 'El módulo de reportes es exclusivo del Administrador y ofrece visibilidad completa en 4 dimensiones del negocio. El selector de período independiente por tab permite comparar métricas de distintos períodos simultáneamente. El export PDF genera documentación formal para reuniones y contabilidad.',
    decisiones: [
      'Recharts para gráficos: librería probada, responsive, tipos múltiples (Area, Bar, Pie, Line)',
      'Selector de período independiente por tab: el Admin puede analizar ganancias de "este mes" con productividad de "este año"',
      '4 tabs especializadas: Financiero, Operativo, Logístico y Auditoría — sin mezclar datos',
      'Tab Auditoría: trazabilidad legal y de seguridad — quién hizo qué y cuándo en el sistema',
    ],
    componentes: [
      { nombre: 'Tab "Ganancias"', tipo: 'Button tab', clase: 'py-2.5 px-4 rounded-xl. Activo: bg-slate-800 text-white. Ícono DollarSign', accion: 'setTab("ganancias")', destino: 'KPIs ingresos + AreaChart tendencia + BarChart MO vs Repuestos + tabla OTs finalizadas' },
      { nombre: 'Tab "Productividad"', tipo: 'Button tab', clase: 'py-2.5 px-4 rounded-xl. Activo: bg-slate-800 text-white. Ícono BarChart3', accion: 'setTab("productividad")', destino: 'Tabla: mecánico, OTs completadas, activas, diagnóstico, ingresos generados, eficiencia %' },
      { nombre: 'Tab "Inventario"', tipo: 'Button tab', clase: 'py-2.5 px-4 rounded-xl. Activo: bg-slate-800 text-white. Ícono Package', accion: 'setTab("inventario")', destino: 'Valor PVP total, costo, margen bruto, top 5 repuestos más usados, últimos Kardex' },
      { nombre: 'Tab "Auditoría"', tipo: 'Button tab', clase: 'py-2.5 px-4 rounded-xl. Activo: bg-slate-800 text-white. Ícono Database', accion: 'setTab("auditoria")', destino: 'Log: fecha exacta, usuario, código acción (mono), módulo, detalles, entidadId' },
      { nombre: 'Selector de período', tipo: 'Pills / Select', clase: 'Pills: Hoy|Semana|Mes|Trimestre|Año. Estado independiente por tab', accion: 'setPeriodo(value)', destino: 'Filtra los datos del tab activo sin afectar otros tabs' },
      { nombre: 'AreaChart "Tendencia ingresos"', tipo: 'Recharts AreaChart', clase: 'ResponsiveContainer height=160px. fill="#0ea5e9". Área + línea', accion: 'Hover → Tooltip con datos exactos', destino: 'Visualización de tendencia financiera en el período seleccionado' },
      { nombre: 'BarChart "MO vs Repuestos"', tipo: 'Recharts BarChart', clase: 'ResponsiveContainer height=160px. Barras cyan (MO) + slate (Repuestos)', accion: 'Hover → Tooltip comparativo', destino: 'Desglose del ingreso por tipo: mano de obra vs venta de repuestos' },
      { nombre: 'Tabla de productividad de mecánicos', tipo: 'Table', clase: 'Columnas: Mecánico, Completadas, Activas, Diagnóstico, Ingresos, Eficiencia%', accion: 'Solo lectura', destino: 'Análisis del rendimiento individual de cada mecánico del equipo' },
      { nombre: 'Botón "Exportar PDF"', tipo: 'Button', clase: 'bg-slate-800 text-white px-4 py-2.5 rounded-lg text-sm. Ícono FileText', accion: 'exportarPDF()', destino: 'Genera y descarga PDF del tab activo con el período seleccionado usando jsPDF' },
    ],
    flujo: [
      '1. Admin accede a /reportes → Tab "Ganancias" por defecto',
      '2. Selecciona período (ej. "Este mes") → KPIs y gráficos se actualizan',
      '3. Cambia a tab "Productividad" → puede seleccionar período independiente',
      '4. Tab "Auditoría" → busca acción específica en el log completo',
      '5. "Exportar PDF" → descarga PDF del tab activo y período activo',
    ],
  },
];

function RFDTab() {
  const [expandedRFD, setExpandedRFD] = useState<string | null>('RFD-01');

  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-5 mb-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Layers size={18} className="text-white"/>
          </div>
          <div>
            <h2 className="font-bold">Requerimientos Funcionales de Diseño (RFD)</h2>
            <p className="text-slate-300 text-xs">20 RFD correspondientes a los RF-01..RF-20 del sistema TallerPro</p>
          </div>
        </div>
        <p className="text-slate-300 text-xs leading-relaxed mt-2">
          Cada RFD especifica: <strong className="text-white">justificación de decisiones de diseño</strong>, componentes con tipo/clase/tamaño, la <strong className="text-white">acción exacta al interactuar</strong> con cada elemento, el <strong className="text-white">destino o resultado</strong>, y el <strong className="text-white">flujo de navegación del usuario</strong> paso a paso.
        </p>
        <div className="flex gap-2 mt-3 flex-wrap">
          {[
            { label: 'Componentes por pantalla', icon: <Monitor size={11}/> },
            { label: 'Acción de cada botón', icon: <MousePointer size={11}/> },
            { label: 'Destino de navegación', icon: <ArrowRight size={11}/> },
            { label: 'Justificación de diseño', icon: <Zap size={11}/> },
          ].map(t => (
            <div key={t.label} className="flex items-center gap-1.5 text-xs text-slate-300 bg-white/10 px-2.5 py-1.5 rounded-full">
              {t.icon} {t.label}
            </div>
          ))}
        </div>
      </div>

      {RFD_DATA.map(rfd => {
        const isOpen = expandedRFD === rfd.codigo;
        return (
          <div key={rfd.codigo} className={`bg-white border rounded-2xl overflow-hidden transition-all ${isOpen ? 'border-slate-400 shadow-md' : 'border-slate-200'}`}>
            <button onClick={() => setExpandedRFD(isOpen ? null : rfd.codigo)}
              className="w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-slate-50 transition-colors">
              <div className="flex-shrink-0 w-16 bg-slate-800 text-white rounded-lg py-1.5 text-center">
                <p className="text-[10px] font-mono text-slate-400">{rfd.rfBase}</p>
                <p className="text-xs font-bold">{rfd.codigo}</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 text-sm">{rfd.titulo}</p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{rfd.modulo}</span>
                  <span className="text-xs font-mono bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded">{rfd.ruta}</span>
                </div>
              </div>
              <ChevronRight size={16} className={`text-slate-400 flex-shrink-0 mt-1 transition-transform ${isOpen ? 'rotate-90' : ''}`}/>
            </button>

            {isOpen && (
              <div className="border-t border-slate-100 divide-y divide-slate-100">
                {/* Justificación */}
                <div className="px-5 py-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Zap size={11}/> Justificación de Diseño
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed">{rfd.justificacion}</p>
                </div>

                {/* Decisiones de diseño */}
                <div className="px-5 py-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Star size={11}/> Decisiones de Diseño Tomadas
                  </p>
                  <ul className="space-y-1.5">
                    {rfd.decisiones.map((d, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                        <div className="w-4 h-4 rounded-full bg-slate-800 text-white flex items-center justify-center flex-shrink-0 mt-0.5 text-[9px] font-bold">{i+1}</div>
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Componentes */}
                <div>
                  <div className="px-5 py-3 bg-slate-50 flex items-center gap-2">
                    <Monitor size={13} className="text-slate-500"/>
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Componentes, Clases CSS, Acciones y Destinos</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200">
                          {['Componente / Elemento','Tipo','Clase / Tamaño','Acción al interactuar','Destino / Resultado'].map(h => (
                            <th key={h} className="text-left px-3 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rfd.componentes.map((c, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-3 py-2.5 font-semibold text-slate-800 text-xs min-w-40">{c.nombre}</td>
                            <td className="px-3 py-2.5">
                              <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded font-medium whitespace-nowrap">{c.tipo}</span>
                            </td>
                            <td className="px-3 py-2.5 text-[10px] font-mono text-amber-700 max-w-48">{c.clase}</td>
                            <td className="px-3 py-2.5 text-xs text-violet-700 font-mono min-w-36">{c.accion}</td>
                            <td className="px-3 py-2.5 text-xs text-slate-600 min-w-48">{c.destino}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Flujo de navegación */}
                <div className="px-5 py-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <GitBranch size={11}/> Flujo de Navegación del Usuario
                  </p>
                  <div className="space-y-2">
                    {rfd.flujo.map((f, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold mt-0.5">
                          {i+1}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed flex-1">{f}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── TAB 6: ESPECIFICACIONES POR PANTALLA ────────────────────────────────────

function PantallasTab() {
  const [expandedScreen, setExpandedScreen] = useState<string | null>('Login');

  const screens = [
    {
      name: 'Login.tsx — Página de Acceso', ruta: '/login',
      roles: 'Todos (no logueados)',
      descripcion: 'Página de entrada al sistema con diseño de dos portales. Fondo degradado slate-800/slate-900.',
      layout: 'Centrado vertical y horizontal. Ancho máximo 480px (formulario) en tablet+, full-screen en móvil.',
      elementos: [
        { elem: 'Logo TallerPro', specs: 'Imagen PNG, ancho aprox. 160px. Centrada en card blanca redondeada. Sin filtros CSS.' },
        { elem: 'Tabs Empresa / Cliente', specs: '2 pestañas. Activa: bg-white shadow text-slate-800. Inactiva: text-slate-500. h=40px, rounded-xl.' },
        { elem: 'Grid de credenciales demo', specs: '4 cards de staff en grid 2x2. Card: border, bg-color-50, texto xs, cursor-pointer. h≈60px cada una.' },
        { elem: 'Input usuario', specs: 'pl-9 (ícono User), py-2.5 px-3.5, border rounded-xl. h=42px.' },
        { elem: 'Input contraseña', specs: 'pl-9 (ícono Lock), toggle visibilidad en la derecha (Eye/EyeOff 15px). h=42px.' },
        { elem: 'Botón submit', specs: 'bg-slate-800 hover:bg-slate-700 text-white, full width, py-3, rounded-xl. h=52px. Loading: opacidad reducida.' },
        { elem: 'Error inline', specs: 'flex gap-2, bg-red-50 border-red-200, text-red-700 text-xs, rounded-xl px-4 py-3. Solo si login falla.' },
        { elem: 'Formulario de registro', specs: 'Grid 2 columnas en sm+. 9 campos: nombre, CI, NIT, teléfono, email, dirección, usuario, contraseña, confirmar.' },
      ],
    },
    {
      name: 'Layout.tsx — Estructura Principal', ruta: 'Envuelve todo el sistema',
      roles: 'Todos (logueados)',
      descripcion: 'Shell principal: sidebar izquierdo + header responsivo + área de contenido. Se adapta a móvil con drawer.',
      layout: 'Flex horizontal. Sidebar: w-56 desktop / w-64 drawer móvil. Contenido: flex-1 overflow-y-auto.',
      elementos: [
        { elem: 'Sidebar desktop', specs: 'w-56 (224px), bg-[#2C3A4F] (pizarra azulado), h=100vh, flex flex-col. Fijo en pantalla.' },
        { elem: 'Sidebar móvil (drawer)', specs: 'w-64 (256px) fixed, translate-x-0/-full, transition 200ms, z-30. Botón X en header del drawer.' },
        { elem: 'Logo en sidebar', specs: 'Imagen PNG en card bg-white rounded-xl p-2. max-w=[120px]. Con botón X (lg:hidden) para cerrar drawer.' },
        { elem: 'NavLinks del sidebar', specs: 'py-2.5 px-3 rounded-lg. Activo: bg-cyan-500 text-white. Inactivo: text-slate-400 hover:bg-slate-800 hover:text-white.' },
        { elem: 'Badge de rol (sidebar)', specs: 'bg-slate-800/60 rounded-lg border-slate-700. Badge del rol con colores propios. mx-3 mb-2.' },
        { elem: 'Card de usuario (sidebar)', specs: 'bg-slate-800/50, avatar circular bg-blue-600 w-7 h-7, nombre truncado, @username truncado.' },
        { elem: 'Botón "Cerrar sesión"', specs: 'text-slate-400 hover:text-red-400 hover:bg-red-500/10. Ícono LogOut 14px + texto.' },
        { elem: 'Header móvil', specs: 'flex, px-4 py-3, bg-white border-b border-slate-200. Botón hamburguesa + Logo + Badge rol + Bell. h≈52px.' },
        { elem: 'Barra desktop', specs: 'hidden lg:flex, px-6 py-2, bg-white border-b shadow-sm. Nombre + badge rol a la izquierda. Bell a la derecha. h≈40px.' },
        { elem: 'Panel notificaciones desktop', specs: 'Dropdown absolute right-0, w-96 (384px), rounded-2xl, shadow-2xl, z-50. Max-h: 320px. Divide-y.' },
        { elem: 'Panel notificaciones móvil', specs: 'Bottom sheet: fixed inset-0 bg-black/50 z-40. Panel: rounded-t-3xl max-h-[80vh] bg-white desde abajo.' },
      ],
    },
    {
      name: 'Dashboard.tsx — Dashboards por Rol', ruta: '/',
      roles: 'Admin, Asesor, Jefe, Mecánico (según rol)',
      descripcion: 'Cada rol recibe un dashboard diferente. El cliente nunca llega aquí (redirigido a /portal).',
      layout: 'p-6 max-w-7xl mx-auto. Grid de KPIs + gráficos + tablas. Scroll vertical.',
      elementos: [
        { elem: 'Header del dashboard', specs: 'flex items-center gap-3. H1 text-2xl font-bold + badge del rol. Fecha en text-sm text-slate-500.' },
        { elem: 'KPI Cards (Admin)', specs: 'grid grid-cols-2 lg:grid-cols-4 gap-4. Card: bg-white border rounded-xl p-5. Barra izquierda w-1 bg-cyan-500. h≈120px.' },
        { elem: 'KPI secundarios', specs: 'grid grid-cols-2 lg:grid-cols-4 gap-4. Card simple: flex justify-between items-center px-5 py-5. h≈68px.' },
        { elem: 'Gráficos recharts', specs: 'bg-white border rounded-xl p-5. ResponsiveContainer height=160px. Fuente de ejes: 10-11px.' },
        { elem: 'Tabla de OTs recientes', specs: 'bg-white border rounded-xl overflow-hidden. thead: bg-slate-100. td: px-5 py-3.5. hover:bg-slate-50.' },
        { elem: 'Banner OTs liberadas (Asesor)', specs: 'bg-gradient-to-r from-emerald-600 to-emerald-500, text-white, rounded-xl p-4. Botones "Cobrar → OT-XXX" por cada OT liberada.' },
        { elem: 'KPI "Sin Asignar" (Jefe)', specs: 'border-red-300 bg-red-50 text-red-700. Punto rojo pulsante cuando > 0.' },
        { elem: 'Panel de Mecánico (MecanicoWorkPanel)', specs: 'Secciones por estado. Grid 1/2/3 columnas según breakpoint. OTCard: bg-white border-2 rounded-xl p-4 hover:shadow-md.' },
      ],
    },
    {
      name: 'WorkOrders.tsx — Órdenes de Trabajo', ruta: '/ordenes',
      roles: 'Asesor (crear+ver), Jefe (ver+supervisar), Admin (solo lectura), Mecánico (panel propio)',
      descripcion: 'Módulo central del sistema. Vista diferente según rol. Mecánico ve MecanicoWorkPanel, resto ve tabla filtrable.',
      layout: 'p-4 sm:p-6 max-w-7xl mx-auto. Header + filtros + tabla (desktop) / cards (móvil) + modal de detalle.',
      elementos: [
        { elem: 'Botón "+ Nueva OT"', specs: 'bg-slate-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium. SOLO para Asesor. Esquina superior derecha.' },
        { elem: 'Alerta de OTs sin asignar', specs: 'bg-amber-50 border-amber-300 px-3 py-2 rounded-lg text-amber-700 text-sm. Solo visible para Jefe.' },
        { elem: 'Pills de estado (filtros)', specs: 'bg-white border rounded-xl p-3 overflow-x-auto. Cada pill: px-3 py-1.5 rounded-lg text-xs. Activo: bg del color del estado.' },
        { elem: 'Input de búsqueda', specs: 'w-full pl-10 pr-4 py-2.5 border rounded-lg bg-white focus:ring-2 ring-cyan-500. h=42px.' },
        { elem: 'Tabla desktop (sm+)', specs: 'hidden sm:table. 7 columnas: OT, Cliente, Vehículo, Mecánico, Estado, Actualizado, Acción. Fila hover:bg-slate-50.' },
        { elem: 'Cards móvil (<sm)', specs: 'sm:hidden. Cards apiladas en divide-y. Cada card: px-4 py-3. Muestra OT, estado, cliente, placa, mecánico.' },
        { elem: 'Indicador sin mecánico', specs: 'border-l-4 border-amber-400 en card móvil. Punto rojo animate-pulse en fila de tabla desktop.' },
        { elem: 'Botón "👁 Ver"', specs: 'p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg. Visible en última columna de tabla.' },
        { elem: 'Modal ModalDetalle', specs: 'fixed inset-0 bg-black/50 z-50. Panel: bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto.' },
        { elem: 'StepProgress (header modal)', specs: 'px-6 py-3 bg-gray-50 border-b overflow-x-auto. Pasos como pills: color del estado activo. Checks verdes en completados.' },
      ],
    },
    {
      name: 'Diagnostico.tsx — Panel de Diagnóstico', ruta: '/diagnostico',
      roles: 'Mecánico (sus OTs), Jefe/Admin (supervisión — todas las OTs activas)',
      descripcion: 'Layout de dos columnas: lista a la izquierda, detalle a la derecha. Mecánico ve SOLO sus OTs. Jefe/Admin ven todas para supervisar.',
      layout: 'p-4 sm:p-6 max-w-7xl mx-auto. Título + subtítulo adaptado al rol. Flex column en móvil, flex row en lg+.',
      elementos: [
        { elem: 'Título de página', specs: 'Mecánico: "Mis Órdenes — Diagnóstico y Reparación". Jefe/Admin: "Supervisión: Diagnóstico y Reparación".' },
        { elem: 'Subtítulo de contexto', specs: 'Mecánico: "Solo se muestran las órdenes asignadas a [nombre]". Jefe: "Vista de supervisión — todas las órdenes activas".' },
        { elem: 'Buscador (columna izq)', specs: 'relative. Ícono Search 14px left-3. w-full pl-9 py-2.5 border rounded-xl focus:ring-violet-500. h=42px.' },
        { elem: 'Lista de OTs (columna izq)', specs: 'lg:w-72 flex-shrink-0. max-h-72 en móvil (scroll). Ilimitado en desktop. Botones de OT: border-2 rounded-xl p-4.' },
        { elem: 'OT seleccionada', specs: 'border-violet-500 bg-violet-50. No seleccionada: border-gray-200 hover:border-violet-300.' },
        { elem: 'Estado vacío (mecánico sin OTs)', specs: 'Ícono Wrench 30px opacity-20 + "No tienes órdenes asignadas" + "El jefe de taller te asignará nuevas órdenes".' },
        { elem: 'Panel de detalle (columna der)', specs: 'flex-1. bg-white border rounded-2xl overflow-hidden. Scroll vertical independiente.' },
        { elem: 'Nombre del mecánico en cards (Jefe)', specs: 'Solo visible cuando !isMecanico. "Mec: [nombre]" en violet-600 text-xs.' },
      ],
    },
    {
      name: 'ClientPortal.tsx — Portal del Cliente', ruta: '/portal',
      roles: 'Cliente ÚNICAMENTE',
      descripcion: 'Portal de página única con scroll. Integra todas las secciones. Sidebar muestra solo "Inicio" y "Mis Facturas".',
      layout: 'Scroll vertical. max-w-4xl mx-auto. Secciones apiladas: KPIs → Banners → Mis Servicios → Mis Vehículos → Mis Citas → Notificaciones → Mi Perfil.',
      elementos: [
        { elem: 'Header del portal', specs: 'Avatar circular con inicial, saludo "Hola, [nombre]", badge "Cliente". Botón Bell para notificaciones.' },
        { elem: 'Sección KPIs (inicio)', specs: 'grid grid-cols-2 gap-4. Cards: bg-white border rounded-xl p-4. Ícono + número grande + label.' },
        { elem: 'Banner cotización pendiente', specs: 'bg-gradient amber o slate según tipo. Texto de alerta + botón de acción. rounded-xl mb-4.' },
        { elem: 'Banner vehículo listo (LIBERADA)', specs: 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white. Botón "Pagar y Recoger".' },
        { elem: 'Cards de servicios activos', specs: 'bg-white border rounded-xl p-4. OT número + estado + vehículo + barra de pasos simplificada.' },
        { elem: 'Barra de pasos cliente', specs: 'Versión simplificada de StepProgress: solo 5 pasos (Recepción/Diagnóstico/Reparación/Lista/Entregada).' },
        { elem: 'Botón "👍 Aprobar" / "👎 Rechazar"', specs: 'bg-emerald-600/bg-red-600 text-white. py-3 px-6 rounded-xl. Presentes cuando OT en ESPERANDO_APROBACION.' },
        { elem: 'Botón "Pagar y Recoger"', specs: 'bg-white text-emerald-700 border-2 border-emerald-400 hover:bg-emerald-50. Visible cuando OT en LIBERADA.' },
        { elem: 'Cards de vehículos', specs: 'bg-white border rounded-xl p-4. Placa grande + marca/modelo + año + color. Expandible para historial.' },
        { elem: 'Botón "+ Agendar Cita"', specs: 'bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm. En sección Mis Citas.' },
      ],
    },
    {
      name: 'Inventory.tsx — Inventario', ruta: '/inventario',
      roles: 'Administrador (CRUD completo), Mecánico (solo lectura)',
      descripcion: 'Gestión de repuestos y proveedores. 16 repuestos en 6 categorías. 6 proveedores.',
      layout: 'p-4 sm:p-6. Tabs: Repuestos / Proveedores / Kardex. Tabla de repuestos con filtros de categoría.',
      elementos: [
        { elem: 'Filtros de categoría', specs: 'Pills horizontales scroll. bg-white border rounded-xl p-2. Activo: bg-slate-800 text-white.' },
        { elem: 'Tabla de repuestos', specs: 'Columnas: Código, Nombre, Cat., Stock, Reservado, Disponible, Costo, Precio, Margen, Proveedor, Acciones.' },
        { elem: 'Alerta stock bajo', specs: 'Fila con bg-red-50/30. Badge rojo "Stock bajo" + ícono AlertTriangle.' },
        { elem: 'Botón "Entrada de stock"', specs: 'Ícono Plus + texto. bg-slate-800 text-white. Visible solo para Admin.' },
        { elem: 'Modal de repuesto', specs: 'Campos: nombre, categoría, cantidad, cantidadReservada, costo, margenGanancia, precio (auto), stockMinimo, proveedor.' },
        { elem: 'Precio PVP (auto-calc)', specs: 'Calculado: costo × (1 + margenGanancia). Se actualiza en tiempo real al editar costo o margen.' },
      ],
    },
    {
      name: 'Reportes.tsx — Panel de Reportes', ruta: '/reportes',
      roles: 'Administrador ÚNICAMENTE',
      descripcion: '4 pestañas de análisis con gráficos recharts. Selector de período independiente por tab.',
      layout: 'p-4 sm:p-6 max-w-7xl mx-auto. Header + selector de período + tabs + contenido.',
      elementos: [
        { elem: 'Selector de período', specs: 'Dropdown o pills: Hoy / Esta semana / Este mes / Trimestre / Este año. Estado independiente por tab.' },
        { elem: 'Tab Ganancias', specs: 'KPIs de ingresos + AreaChart (tendencia) + BarChart (MO vs Repuestos) + tabla de OTs finalizadas.' },
        { elem: 'Tab Productividad', specs: 'Tabla de mecánicos: nombre, OTs completadas, activas, en diagnóstico, ingresos generados, eficiencia %.' },
        { elem: 'Tab Inventario', specs: 'KPIs: valor PVP, costo total, margen bruto. Top 5 repuestos más usados. Últimos movimientos Kardex.' },
        { elem: 'Tab Auditoría', specs: 'Log completo: fecha (datetime), usuario, acción (código), módulo, detalles, entidadId. Paginado o scroll.' },
        { elem: 'Botón Exportar PDF', specs: 'Ícono FileText + "Exportar PDF". bg-slate-800 text-white. Usa jsPDF.' },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
        <p className="text-sm text-slate-600">
          Especificaciones detalladas de cada pantalla del sistema: layout, elementos, medidas y comportamiento.
          Haz clic en una pantalla para ver sus especificaciones. Puedes tomar una foto de cualquier pantalla del sistema
          y buscar la especificación correspondiente aquí para referencia cruzada.
        </p>
      </div>

      {screens.map(screen => {
        const isOpen = expandedScreen === screen.name;
        return (
          <div key={screen.name} className={`bg-white border rounded-2xl overflow-hidden transition-all ${isOpen ? 'border-slate-400 shadow-md' : 'border-slate-200'}`}>
            <button onClick={() => setExpandedScreen(isOpen ? null : screen.name)}
              className="w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-slate-50 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-slate-800 text-sm">{screen.name}</p>
                  <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">{screen.ruta}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{screen.roles}</p>
              </div>
              <ChevronRight size={16} className={`text-slate-400 flex-shrink-0 transition-transform mt-0.5 ${isOpen ? 'rotate-90' : ''}`}/>
            </button>
            {isOpen && (
              <div className="border-t border-slate-100">
                <div className="px-5 py-4 bg-slate-50 border-b border-slate-100">
                  <p className="text-sm text-slate-700 mb-2">{screen.descripcion}</p>
                  <p className="text-xs text-slate-500"><span className="font-semibold">Layout:</span> {screen.layout}</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200">
                        {['Elemento / Componente', 'Especificaciones (clase, tamaño, comportamiento)'].map(h => (
                          <th key={h} className="text-left px-4 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {screen.elementos.map(e => (
                        <tr key={e.elem} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-semibold text-slate-800 text-xs min-w-48">{e.elem}</td>
                          <td className="px-4 py-3 text-xs text-slate-600 leading-relaxed">{e.specs}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SystemDocs() {
  const [activeTab, setActiveTab] = useState<DocTab>('workflow');

  const tabs = [
    { id: 'workflow'     as DocTab, label: 'Flujo del Sistema',          icon: <GitBranch size={14}/> },
    { id: 'requisitos'   as DocTab, label: 'RF (20)',                    icon: <BookOpen size={14}/> },
    { id: 'interfaz'     as DocTab, label: 'Guía de Interfaz',           icon: <Palette size={14}/> },
    { id: 'roles'        as DocTab, label: 'Roles y Permisos',           icon: <Shield size={14}/> },
    { id: 'credenciales' as DocTab, label: 'Credenciales',               icon: <Lock size={14}/> },
    { id: 'pantallas'    as DocTab, label: 'Especif. de Pantallas',      icon: <Monitor size={14}/> },
    { id: 'rfd'          as DocTab, label: 'RFD — Diseño',               icon: <Layers size={14}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Page Header */}
      <div className="bg-slate-800 text-white px-4 sm:px-6 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <BookOpen size={20} className="text-white"/>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Documentación del Sistema · TallerPro v38</h1>
              <p className="text-slate-400 text-xs sm:text-sm">Workflow · RF · Interfaz · Roles · Credenciales · Pantallas · RFD Diseño</p>
            </div>
          </div>
          <div className="flex gap-2 mt-4 flex-wrap">
            {[
              { label: '20 RF', icon: <CheckCircle size={12}/> },
              { label: '5 Roles', icon: <Users size={12}/> },
              { label: '9 Estados OT', icon: <GitBranch size={12}/> },
              { label: '20 OTs demo', icon: <ClipboardList size={12}/> },
              { label: '10 Clientes', icon: <User size={12}/> },
              { label: '5 Mecánicos', icon: <Wrench size={12}/> },
              { label: '16 Repuestos', icon: <Package size={12}/> },
              { label: '13 Facturas', icon: <Receipt size={12}/> },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-1.5 text-xs text-slate-300 bg-white/10 px-2.5 py-1.5 rounded-full">
                {s.icon} {s.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-2xl p-1 mb-6 shadow-sm overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex-shrink-0 flex items-center justify-center gap-1.5 py-2.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${activeTab === t.id ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'workflow'     && <WorkflowTab/>}
        {activeTab === 'requisitos'   && <RequisitosTab/>}
        {activeTab === 'interfaz'     && <InterfazTab/>}
        {activeTab === 'roles'        && <RolesTab/>}
        {activeTab === 'credenciales' && <CredencialesTab/>}
        {activeTab === 'pantallas'    && <PantallasTab/>}
        {activeTab === 'rfd'          && <RFDTab/>}
      </div>
    </div>
  );
}
