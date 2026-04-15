import React, { useState } from 'react';
import {
  ChevronDown, ChevronRight, Users, Car, ClipboardList,
  Package, Receipt, BarChart3, Settings, Layers, Target,
  BookOpen, CheckSquare, Wrench, CalendarDays, Shield,
  FileText, Bell, Database, Code, Monitor, TestTube,
  Globe, Zap, Copy, Check, Info, AlertTriangle, GitBranch,
  ArrowRight, Lock, TrendingUp, Clock, Kanban, UserCheck,
  RefreshCw, Star, Link, FlaskConical
} from 'lucide-react';

// ─── Tab type ─────────────────────────────────────────────────────────────────
type Tab = 'general' | 'epicas' | 'sprints' | 'reglas';

// ─── Subtask config ───────────────────────────────────────────────────────────
const SUBTASK_COLORS: Record<string, string> = {
  BD:        'bg-violet-100 text-violet-700 border-violet-200',
  Backend:   'bg-blue-100  text-blue-700  border-blue-200',
  Frontend:  'bg-cyan-100  text-cyan-700  border-cyan-200',
  Pruebas:   'bg-amber-100 text-amber-700 border-amber-200',
  APIs:      'bg-emerald-100 text-emerald-700 border-emerald-200',
  Registros: 'bg-pink-100  text-pink-700  border-pink-200',
};
const SUBTASK_ICONS: Record<string, React.ReactNode> = {
  BD: <Database size={10}/>, Backend: <Code size={10}/>,
  Frontend: <Monitor size={10}/>, Pruebas: <TestTube size={10}/>,
  APIs: <Globe size={10}/>, Registros: <FileText size={10}/>,
};
const PRIORITY_COLORS: Record<string, string> = {
  Alta: 'bg-red-100 text-red-700 border-red-200',
  Media: 'bg-amber-100 text-amber-700 border-amber-200',
  Baja: 'bg-slate-100 text-slate-600 border-slate-200',
};
const EPIC_STYLE = {
  E1: { bg:'bg-blue-600',    light:'bg-blue-50',    border:'border-blue-300',    text:'text-blue-700',    badge:'bg-blue-100 text-blue-800',    ring:'ring-blue-300'    },
  E2: { bg:'bg-emerald-600', light:'bg-emerald-50', border:'border-emerald-300', text:'text-emerald-700', badge:'bg-emerald-100 text-emerald-800', ring:'ring-emerald-300' },
  E3: { bg:'bg-orange-500',  light:'bg-orange-50',  border:'border-orange-300',  text:'text-orange-700',  badge:'bg-orange-100 text-orangeald-800',  ring:'ring-orange-300'  },
  E4: { bg:'bg-purple-600',  light:'bg-purple-50',  border:'border-purple-300',  text:'text-purple-700',  badge:'bg-purple-100 text-purple-800',  ring:'ring-purple-300'  },
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface Subtask    { id:string; label:string; type:keyof typeof SUBTASK_COLORS; }
interface Story {
  id:string; code:string; title:string; role:string;
  description:string; acceptanceCriteria:string[]; businessRules:string[];
  dependencies?:string[]; subtasks:Subtask[];
  priority:'Alta'|'Media'|'Baja'; points:number;
}
interface Objective  { id:string; code:string; title:string; desc:string; module:string; icon:React.ReactNode; stories:Story[]; }
interface Epic {
  id:'E1'|'E2'|'E3'|'E4'; code:string; title:string; subsystem:string;
  generalObjective:string; why:string; scope:string[]; tables:string[];
  processFlow:string[]; depends:string; icon:React.ReactNode;
  objectives:Objective[];
}

// ═══════════════════════════════════════════════════════════════════════════════
//  DATA
// ═══════════════════════════════════════════════════════════════════════════════
const EPICS: Epic[] = [

  // ── ÉPICA 1 ─────────────────────────────────────────────���───────────────────
  {
    id:'E1', code:'TPRO-E1',
    title:'Gestión de Clientes, Vehículos y Citas',
    subsystem:'Subsistema CRM (Customer Relationship Management)',
    generalObjective:'Registrar, mantener y consultar toda la información de clientes y sus vehículos, programar citas de servicio y ofrecer un portal de autoservicio que reduzca la carga operativa del asesor.',
    why:`Este subsistema fue elegido como la FUNDACIÓN del sistema porque todos los demás módulos dependen de él. Sin un cliente registrado no se puede crear una Orden de Trabajo, sin un vehículo vinculado no se puede hacer diagnóstico y sin citas no existe un punto de entrada controlado al flujo operativo. Adicionalmente, el Portal del Cliente es estratégico: permite que el cliente apruebe cotizaciones, haga seguimiento de su vehículo y descargue facturas SIN necesidad de llamar al taller, lo que reduce la carga del asesor hasta en un 40%. Se eligió agrupar Clientes + Vehículos + Citas + Portal en una sola épica porque comparten el mismo "sujeto": el cliente y su relación con el taller.`,
    scope:['Página /clientes', 'Página /vehiculos', 'Página /citas', 'Página /portal (Portal Cliente)', 'Login público portal cliente', 'Notificaciones al cliente'],
    tables:['clientes (CI, NIT, nombre, email, tel, dirección, usuarioId, deletedAt)', 'vehiculos (placa, marca, modelo, año, color, VIN, km, clienteId, deletedAt)', 'citas (fecha, hora, tipo, estado, clienteId, vehiculoId, convertidaOtId, deletedAt)', 'usuarios (username, password, rol=cliente, codigoEmpleado nullable)'],
    processFlow:['① Cliente llega al taller o llama', '② Asesor busca si el cliente ya existe (por CI o nombre)', '③ Si no existe → registra cliente con CI, NIT opcional, email, teléfono, dirección', '④ Registra el/los vehículo(s) del cliente y los vincula', '⑤ Agenda cita seleccionando fecha, hora, tipo de servicio y vehículo', '⑥ El sistema valida disponibilidad de horario (sin conflictos)', '⑦ Cuando llega el día: cita se convierte en OT con un click (datos pre-llenados)', '⑧ Cliente puede también auto-registrarse en el portal y hacer seguimiento en línea'],
    depends:'Ninguna — es la épica base del sistema',
    icon:<Users size={18}/>,
    objectives:[
      {
        id:'E1-O1', code:'OBJ-1.1',
        title:'Registro y administración de clientes',
        desc:'Permitir al Asesor de Servicio registrar, editar, buscar y desactivar (soft-delete) clientes con toda la información necesaria para facturación y comunicación.',
        module:'Módulo Clientes', icon:<Users size={14}/>,
        stories:[
          {
            id:'s001', code:'US-001', title:'Registrar nuevo cliente',
            role:'Asesor de Servicio', priority:'Alta', points:5,
            description:'Como Asesor de Servicio, quiero registrar un nuevo cliente con sus datos personales completos para poder vincularle vehículos y crear órdenes de trabajo.',
            acceptanceCriteria:[
              'El CI/cédula debe ser único entre clientes activos; el sistema rechaza duplicados con mensaje claro',
              'El NIT es opcional; si se ingresa debe tener formato alfanumérico válido (min 5 chars)',
              'El email debe pasar validación de formato (regex RFC 5322) y ser único',
              'El teléfono debe tener mínimo 7 dígitos numéricos',
              'Al guardar, el registro queda con deletedAt = null (activo)',
              'El cliente nuevo aparece inmediatamente en la lista sin recargar la página',
              'Se genera notificación interna "Nuevo cliente registrado: [nombre]"',
            ],
            businessRules:[
              'Un cliente inactivo (deletedAt ≠ null) NO puede recibir nuevas OTs ni citas',
              'El NIT se usa para facturación empresarial; si no tiene NIT, la factura va a nombre personal con CI',
              'No se puede eliminar físicamente un cliente que tenga vehículos o historial de OTs',
            ],
            subtasks:[
              {id:'st001',label:'Tabla clientes con todos los campos + índices CI y email',type:'BD'},
              {id:'st002',label:'Endpoint POST /clientes con validación CI único',type:'Backend'},
              {id:'st003',label:'Endpoint GET /clientes?search= con paginación',type:'Backend'},
              {id:'st004',label:'Modal formulario registro cliente con validaciones en tiempo real',type:'Frontend'},
              {id:'st005',label:'Tabla lista clientes con búsqueda y badges activo/inactivo',type:'Frontend'},
              {id:'st006',label:'Test: CI duplicado, email inválido, NIT formato',type:'Pruebas'},
            ],
          },
          {
            id:'s002', code:'US-002', title:'Editar datos de cliente',
            role:'Asesor de Servicio', priority:'Alta', points:3,
            description:'Como Asesor, quiero editar los datos de un cliente existente para mantener la información actualizada sin perder su historial.',
            acceptanceCriteria:[
              'El formulario de edición pre-carga todos los datos actuales del cliente',
              'Al cambiar el CI, se valida que el nuevo CI no pertenezca a otro cliente activo',
              'No se puede editar un cliente inactivo (botón deshabilitado)',
              'Los cambios quedan registrados con timestamp de última modificación',
              'El historial de OTs y vehículos no se ve afectado por la edición',
            ],
            businessRules:['Solo el Asesor y el Administrador pueden editar clientes','El CI histórico se conserva en OTs y facturas anteriores'],
            subtasks:[
              {id:'st007',label:'Endpoint PATCH /clientes/:id con validación rol',type:'Backend'},
              {id:'st008',label:'Campo updatedAt en tabla clientes',type:'BD'},
              {id:'st009',label:'Modal edición pre-llenado con diff de cambios',type:'Frontend'},
              {id:'st010',label:'Test: edición sin cambiar historial',type:'Pruebas'},
            ],
          },
          {
            id:'s003', code:'US-003', title:'Desactivar cliente (soft-delete)',
            role:'Asesor de Servicio', priority:'Alta', points:2,
            description:'Como Asesor, quiero desactivar un cliente que ya no opera con el taller para que no aparezca en búsquedas activas, pero conservando su historial completo.',
            acceptanceCriteria:[
              'El botón "Desactivar" solicita confirmación antes de ejecutar',
              'Al desactivar, deletedAt se establece con la fecha/hora actual',
              'El cliente desactivado NO aparece en el buscador de clientes para nuevas OTs',
              'El historial de OTs y facturas del cliente sigue visible para el Administrador en modo "ver inactivos"',
              'No se puede desactivar un cliente con OTs en estado activo (registrada, en_diagnostico, etc.)',
            ],
            businessRules:['NUNCA eliminar físicamente. Solo soft-delete con deletedAt','Un cliente reactivado vuelve a aparecer en búsquedas'],
            dependencies:['US-001 debe estar completada'],
            subtasks:[
              {id:'st011',label:'Endpoint DELETE lógico: PATCH deletedAt = NOW()',type:'Backend'},
              {id:'st012',label:'Validación: no desactivar si tiene OTs activas',type:'Backend'},
              {id:'st013',label:'Botón desactivar con modal de confirmación',type:'Frontend'},
              {id:'st014',label:'Toggle "Mostrar inactivos" en tabla',type:'Frontend'},
              {id:'st015',label:'Test: soft-delete no afecta historial OTs',type:'Pruebas'},
            ],
          },
        ],
      },
      {
        id:'E1-O2', code:'OBJ-1.2',
        title:'Registro y gestión de vehículos',
        desc:'Registrar todos los vehículos de cada cliente con información técnica completa y visualizar el historial de servicios por vehículo.',
        module:'Módulo Vehículos', icon:<Car size={14}/>,
        stories:[
          {
            id:'s004', code:'US-004', title:'Registrar vehículo y vincularlo a cliente',
            role:'Asesor de Servicio', priority:'Alta', points:5,
            description:'Como Asesor, quiero registrar un vehículo (placa, marca, modelo, año, color, VIN, km actuales) y vincularlo a un cliente para poder crear OTs sobre él.',
            acceptanceCriteria:[
              'La placa debe ser única entre vehículos activos (insensible a mayúsculas)',
              'El año debe estar entre 1950 y el año actual + 1',
              'El VIN es opcional pero si se ingresa debe tener 17 caracteres',
              'El km inicial debe ser >= 0',
              'Al registrar, el vehículo aparece en la ficha del cliente inmediatamente',
              'Se puede registrar más de un vehículo por cliente',
            ],
            businessRules:['Una placa desactivada puede reutilizarse (soft-delete libera la placa)','El km se actualiza en cada OT para llevar odómetro'],
            subtasks:[
              {id:'st016',label:'Tabla vehiculos FK clienteId, índice placa único',type:'BD'},
              {id:'st017',label:'Endpoint POST /vehiculos con validación placa',type:'Backend'},
              {id:'st018',label:'Formulario registro vehículo con selector de cliente',type:'Frontend'},
              {id:'st019',label:'Test: placa duplicada activa, año inválido',type:'Pruebas'},
            ],
          },
          {
            id:'s005', code:'US-005', title:'Ver historial de servicios de un vehículo',
            role:'Asesor de Servicio', priority:'Media', points:3,
            description:'Como Asesor, quiero ver el historial cronológico completo de OTs de un vehículo para informar al cliente sobre servicios anteriores y detectar problemas recurrentes.',
            acceptanceCriteria:[
              'El historial muestra: fecha OT, tipo servicio, mecánico asignado, estado final, costo total',
              'Se ordena de más reciente a más antiguo',
              'El km al momento de cada servicio es visible',
              'Se puede expandir cada OT para ver el detalle de trabajos y repuestos',
            ],
            businessRules:['El historial incluye OTs canceladas (distinguiéndolas visualmente)'],
            subtasks:[
              {id:'st020',label:'Query historial OTs ordenadas por fecha DESC',type:'BD'},
              {id:'st021',label:'Panel historial expandible en vista vehículo',type:'Frontend'},
            ],
          },
        ],
      },
      {
        id:'E1-O3', code:'OBJ-1.3',
        title:'Gestión de citas de servicio',
        desc:'Programar, gestionar y convertir citas en OTs, controlando la disponibilidad de la agenda del taller.',
        module:'Módulo Citas', icon:<CalendarDays size={14}/>,
        stories:[
          {
            id:'s006', code:'US-006', title:'Agendar cita para cliente y vehículo',
            role:'Asesor de Servicio', priority:'Alta', points:5,
            description:'Como Asesor, quiero agendar una cita seleccionando cliente, vehículo, fecha, hora y tipo de servicio para organizar la carga de trabajo diaria del taller.',
            acceptanceCriteria:[
              'No se pueden agendar dos citas en el mismo bloque horario (validación de solapamiento)',
              'La fecha no puede ser en el pasado',
              'El vehículo seleccionado debe pertenecer al cliente seleccionado',
              'El estado inicial de la cita es "programada"',
              'Al crear la cita, aparece badge de cantidad en el menú lateral del Asesor',
            ],
            businessRules:['Estados de cita: programada → confirmada → completada / cancelada / no_asistio','Una cita "no_asistio" se registra pero no bloquea futuras citas'],
            subtasks:[
              {id:'st022',label:'Tabla citas con validación solapamiento',type:'BD'},
              {id:'st023',label:'Endpoint validación conflicto horario',type:'Backend'},
              {id:'st024',label:'Selector fecha/hora con slots disponibles',type:'Frontend'},
              {id:'st025',label:'Notificación interna nueva cita al Jefe',type:'APIs'},
              {id:'st026',label:'Test: solapamiento de horarios, fecha pasada',type:'Pruebas'},
            ],
          },
          {
            id:'s007', code:'US-007', title:'Convertir cita en Orden de Trabajo',
            role:'Asesor de Servicio', priority:'Alta', points:3,
            description:'Como Asesor, quiero convertir una cita confirmada en una OT con un click, con los datos del cliente y vehículo ya pre-llenados, para agilizar el proceso de recepción.',
            acceptanceCriteria:[
              'Solo citas en estado "confirmada" o "programada" pueden convertirse en OT',
              'Al convertir: la OT se crea con estado "registrada" y la cita pasa a "completada"',
              'Los campos cliente, vehículo y descripción de servicio se pre-llenan desde la cita',
              'No se puede convertir la misma cita dos veces (botón se deshabilita)',
            ],
            businessRules:['La relación cita→OT queda guardada en ambos registros para trazabilidad'],
            subtasks:[
              {id:'st027',label:'Campo citaOrigenId en tabla ordenes_trabajo',type:'BD'},
              {id:'st028',label:'Endpoint POST /ordenes desde citaId',type:'Backend'},
              {id:'st029',label:'Botón "Convertir a OT" con confirmación',type:'Frontend'},
              {id:'st030',label:'Test: conversión, doble conversión bloqueada',type:'Pruebas'},
            ],
          },
        ],
      },
      {
        id:'E1-O4', code:'OBJ-1.4',
        title:'Portal de autoservicio del cliente',
        desc:'Ofrecer al cliente un acceso web propio para auto-registrarse, hacer seguimiento de sus vehículos y OTs, aprobar cotizaciones y descargar facturas.',
        module:'Portal Cliente', icon:<Globe size={14}/>,
        stories:[
          {
            id:'s008', code:'US-008', title:'Auto-registro del cliente en el portal',
            role:'Cliente', priority:'Alta', points:5,
            description:'Como Cliente, quiero crear mi propia cuenta en el portal con mis datos para acceder al seguimiento de mis servicios sin depender del asesor.',
            acceptanceCriteria:[
              'El formulario tiene secciones: datos personales y credenciales de acceso',
              'El username debe ser único (insensible a mayúsculas)',
              'La contraseña mínimo 6 caracteres; confirmar contraseña debe coincidir',
              'Al registrarse exitosamente, el usuario queda con rol=cliente y es redirigido al portal',
              'El asesor puede ver el nuevo cliente en el módulo /clientes',
            ],
            businessRules:['Los clientes auto-registrados usan username+password (sin código de empleado)','El NIT es opcional en el registro público'],
            subtasks:[
              {id:'st031',label:'Endpoint público POST /auth/register-cliente',type:'Backend'},
              {id:'st032',label:'Formulario multi-sección con validación progresiva',type:'Frontend'},
              {id:'st033',label:'Hash de contraseña (bcrypt)',type:'Backend'},
              {id:'st034',label:'Test: username duplicado, contraseñas no coinciden',type:'Pruebas'},
            ],
          },
          {
            id:'s009', code:'US-009', title:'Seguimiento visual del estado de mi OT',
            role:'Cliente', priority:'Alta', points:5,
            description:'Como Cliente, quiero ver el estado actual de mi vehículo en el taller con una barra de progreso visual para saber en qué etapa está sin tener que llamar.',
            acceptanceCriteria:[
              'La barra de progreso muestra: Recibido → Diagnóstico → Reparación → Control QC → Entregado',
              'El paso actual se resalta visualmente; los completados muestran checkmark',
              'Cuando el estado es "esperando_aprobacion", se muestra un banner de acción urgente',
              'La fecha estimada de entrega es visible si fue registrada en la OT',
            ],
            businessRules:['El cliente solo ve sus propias OTs (filtradas por clienteId)','Estados cancelada y liquidacion_diagnostico tienen vista especial'],
            subtasks:[
              {id:'st035',label:'Endpoint GET /portal/ordenes autenticado por cliente',type:'APIs'},
              {id:'st036',label:'Barra de progreso con 5 pasos y estados especiales',type:'Frontend'},
              {id:'st037',label:'Test: cliente no ve OTs de otro cliente',type:'Pruebas'},
            ],
          },
          {
            id:'s010', code:'US-010', title:'Aprobar o rechazar cotización desde portal',
            role:'Cliente', priority:'Alta', points:5,
            description:'Como Cliente, quiero revisar el desglose completo de la cotización (mano de obra, repuestos, IVA, total) y aprobar o rechazar desde mi portal sin ir al taller.',
            acceptanceCriteria:[
              'La cotización muestra cada línea: descripción, cantidad, precio unitario, subtotal',
              'El IVA 12% y total final son claramente visibles',
              'El cliente puede escribir un motivo de rechazo (opcional)',
              'Al aprobar: OT pasa a "en_reparacion", stock reservado queda confirmado',
              'Al rechazar: OT pasa a "liquidacion_diagnostico", stock reservado se libera automáticamente',
              'Botones de aprobar/rechazar se deshabilitan una vez tomada la decisión',
            ],
            businessRules:['La aprobación solo es posible si la OT está en estado "esperando_aprobacion"','Al rechazar, se genera cargo por diagnóstico si fue configurado así'],
            subtasks:[
              {id:'st038',label:'Vista detalle cotización con desglose IVA',type:'Frontend'},
              {id:'st039',label:'Endpoint POST /portal/cotizaciones/:id/aprobar',type:'APIs'},
              {id:'st040',label:'Endpoint POST /portal/cotizaciones/:id/rechazar',type:'APIs'},
              {id:'st041',label:'Liberación automática stock al rechazar',type:'Backend'},
              {id:'st042',label:'Notificación al asesor por decisión del cliente',type:'Backend'},
              {id:'st043',label:'Test: flujo aprobación y flujo rechazo completo',type:'Pruebas'},
            ],
          },
        ],
      },
    ],
  },

  // ── ÉPICA 2 ─────────────────────────────────────────────────────────────────
  {
    id:'E2', code:'TPRO-E2',
    title:'Gestión de Órdenes de Trabajo',
    subsystem:'Subsistema Operativo del Taller',
    generalObjective:'Controlar el ciclo de vida completo de cada Orden de Trabajo a través de 9 estados definidos, con validaciones de rol estrictas que garantizan que nadie pueda saltar etapas o actuar fuera de su competencia.',
    why:`Las Órdenes de Trabajo son el CORAZÓN del negocio automotriz. Todo en el taller gira alrededor de una OT: desde que el cliente deja el vehículo hasta que lo recoge con la factura en mano. Se decidió crear un subsistema separado (y no mezclar con CRM) porque la OT tiene su propia máquina de estados con 9 posibles valores y transiciones gobernadas por reglas de rol. Este nivel de complejidad justifica su propia épica. El Diagnóstico se agrupa aquí (y no en Inventario) porque es intrínsecamente parte del ciclo de vida de la OT — sin diagnóstico no hay cotización, sin cotización no hay reparación. La regla más crítica: cada transición de estado debe validar el ROL del usuario; un Mecánico NO puede crear OTs, un Asesor NO puede hacer QC.`,
    scope:['Página /ordenes', 'Página /diagnostico', 'Modal cotización con líneas', 'Vista kanban/tabla estados', 'Notificaciones por cambio de estado'],
    tables:['ordenes_trabajo (numero, estado[9], clienteId, vehiculoId, mecanicoId, asesorId, citaOrigenId, kmIngreso, descripcionProblema, fechaEntregaEstimada, deletedAt)','cotizaciones (otId, lineas[], subtotal, iva, total, aprobadaPor, fechaAprobacion)','lineas_cotizacion (cotizacionId, tipo[mano_obra/repuesto], descripcion, cantidad, precioUnit, itemId nullable)'],
    processFlow:['① Asesor crea OT → estado: registrada','② Jefe asigna mecánico → estado permanece: registrada','③ Mecánico inicia diagnóstico → estado: en_diagnostico','④ Mecánico registra hallazgos y repuestos necesarios','⑤ Asesor genera cotización (IVA 12%, reserva stock auto) → estado: esperando_aprobacion','⑥ Cliente aprueba desde portal o presencialmente → estado: en_reparacion','⑦ Mecánico ejecuta reparación, consume repuestos definitivamente','⑧ Mecánico marca trabajo terminado → estado: control_calidad','⑨ Jefe hace inspección QC → aprueba: estado: liberada / rechaza: vuelve a en_reparacion','⑩ Asesor registra entrega → estado: finalizada → se genera factura borrador'],
    depends:'Depende de E1 (necesita clientes y vehículos registrados)',
    icon:<ClipboardList size={18}/>,
    objectives:[
      {
        id:'E2-O1', code:'OBJ-2.1',
        title:'Creación y asignación de OTs',
        desc:'Crear órdenes de trabajo con número correlativo automático, vincularlas a clientes/vehículos y asignar mecánicos con validación de carga de trabajo.',
        module:'Módulo Órdenes de Trabajo', icon:<ClipboardList size={14}/>,
        stories:[
          {
            id:'s011', code:'US-011', title:'Crear Orden de Trabajo',
            role:'Asesor de Servicio', priority:'Alta', points:8,
            description:'Como Asesor, quiero crear una nueva OT seleccionando cliente, vehículo, registrando el problema reportado y el km de ingreso, para iniciar el flujo de servicio.',
            acceptanceCriteria:[
              'Solo el rol "Asesor" puede crear OTs (botón invisible para otros roles)',
              'El número OT se genera automáticamente con formato OT-YYYY-XXXX (ej: OT-2026-0001)',
              'El vehículo disponible en el selector filtra solo los del cliente seleccionado',
              'El estado inicial es siempre "registrada" sin excepción',
              'El km de ingreso debe ser >= km del último servicio del mismo vehículo',
              'Al crear la OT, el Jefe de Taller recibe notificación de "nueva OT sin asignar"',
            ],
            businessRules:['El número OT nunca puede repetirse ni puede editarse','Una OT cancelada no libera su número (se mantiene para trazabilidad)'],
            subtasks:[
              {id:'st044',label:'Tabla ordenes_trabajo con secuencia autonumérica',type:'BD'},
              {id:'st045',label:'Función generadora número OT-YYYY-XXXX',type:'Backend'},
              {id:'st046',label:'Endpoint POST /ordenes con validación rol=asesor',type:'Backend'},
              {id:'st047',label:'Formulario nueva OT con selector cliente→vehículo en cascada',type:'Frontend'},
              {id:'st048',label:'Notificación a Jefe de Taller al crear',type:'APIs'},
              {id:'st049',label:'Test: número único, rol incorrecto bloqueado, km inválido',type:'Pruebas'},
            ],
          },
          {
            id:'s012', code:'US-012', title:'Asignar mecánico a OT',
            role:'Jefe de Taller', priority:'Alta', points:3,
            description:'Como Jefe de Taller, quiero asignar un mecánico a una OT no asignada para distribuir el trabajo equitativamente y que el mecánico pueda iniciar el diagnóstico.',
            acceptanceCriteria:[
              'Solo el Jefe de Taller puede asignar mecánicos',
              'El selector muestra solo mecánicos activos con su carga actual (# de OTs asignadas)',
              'Al asignar, el mecánico recibe notificación inmediata',
              'Un mecánico puede reasignarse (el anterior pierde acceso a la OT)',
              'La OT permanece en estado "registrada" hasta que el mecánico inicia diagnóstico',
            ],
            businessRules:['No hay límite de OTs por mecánico, pero la carga es visible para decisión del Jefe'],
            subtasks:[
              {id:'st050',label:'Endpoint PATCH /ordenes/:id/asignar-mecanico',type:'Backend'},
              {id:'st051',label:'Selector mecánico con badge de carga actual',type:'Frontend'},
              {id:'st052',label:'Notificación push al mecánico asignado',type:'APIs'},
              {id:'st053',label:'Test: solo Jefe puede asignar',type:'Pruebas'},
            ],
          },
        ],
      },
      {
        id:'E2-O2', code:'OBJ-2.2',
        title:'Diagnóstico técnico y cotización',
        desc:'Registrar el diagnóstico del mecánico y generar la cotización con cálculo automático de IVA y reserva automática de stock al momento de cotizar.',
        module:'Módulo Diagnóstico', icon:<Wrench size={14}/>,
        stories:[
          {
            id:'s013', code:'US-013', title:'Registrar diagnóstico técnico',
            role:'Mecánico', priority:'Alta', points:5,
            description:'Como Mecánico, quiero registrar el diagnóstico técnico del vehículo describiendo los problemas encontrados para que el Asesor pueda generar la cotización.',
            acceptanceCriteria:[
              'Solo el mecánico asignado a la OT puede registrar el diagnóstico',
              'Al guardar el diagnóstico, el estado cambia automáticamente a "en_diagnostico"',
              'El campo de diagnóstico admite texto libre (mínimo 20 caracteres)',
              'Se puede adjuntar notas adicionales y lista preliminar de repuestos sugeridos',
              'El Asesor recibe notificación "Diagnóstico listo para cotizar"',
            ],
            businessRules:['El diagnóstico puede editarse mientras la OT esté en estado en_diagnostico','Una vez generada la cotización, el diagnóstico queda bloqueado'],
            subtasks:[
              {id:'st054',label:'Campo diagnostico y notas en tabla OTs',type:'BD'},
              {id:'st055',label:'Endpoint PATCH /ordenes/:id/diagnostico con validación mecánico',type:'Backend'},
              {id:'st056',label:'Formulario diagnóstico con textarea y sugerencia repuestos',type:'Frontend'},
              {id:'st057',label:'Notificación al asesor tras guardar diagnóstico',type:'APIs'},
              {id:'st058',label:'Test: mecánico no asignado bloqueado, estado correcto',type:'Pruebas'},
            ],
          },
          {
            id:'s014', code:'US-014', title:'Generar cotización con IVA y reserva de stock',
            role:'Asesor de Servicio', priority:'Alta', points:8,
            description:'Como Asesor, quiero generar una cotización con líneas de mano de obra y repuestos, donde el IVA se calcule automáticamente y el stock de repuestos se reserve al guardar.',
            acceptanceCriteria:[
              'La cotización tiene dos tipos de línea: "mano_de_obra" y "repuesto"',
              'Las líneas de repuesto están vinculadas al inventario (selector de ítem con stock disponible)',
              'IVA se calcula automáticamente al 12% sobre el subtotal en tiempo real',
              'Al GUARDAR la cotización: stock disponible de cada repuesto se decrementa en stock_reservado',
              'Si stock disponible < cantidad solicitada, la línea se marca en rojo y NO se puede guardar',
              'Al guardar, estado OT cambia a "esperando_aprobacion" automáticamente',
              'El cliente recibe notificación "Tiene una cotización pendiente de aprobación"',
            ],
            businessRules:['La cotización solo puede modificarse si está en estado esperando_aprobacion','Al modificar una cotización, se recalculan las reservas de stock (libera anteriores, reserva nuevas)','Si el cliente NO tiene email configurado, el asesor debe notificarlo manualmente'],
            subtasks:[
              {id:'st059',label:'Tablas cotizaciones y lineas_cotizacion',type:'BD'},
              {id:'st060',label:'Lógica cálculo IVA 12% automático en backend',type:'Backend'},
              {id:'st061',label:'Transacción atómica: guardar cotización + reservar stock',type:'Backend'},
              {id:'st062',label:'Modal cotización con líneas dinámicas add/remove',type:'Frontend'},
              {id:'st063',label:'Selector de repuesto con stock disponible en tiempo real',type:'Frontend'},
              {id:'st064',label:'Cálculo IVA y total en vivo (onChange)',type:'Frontend'},
              {id:'st065',label:'Notificación al cliente por cotización',type:'APIs'},
              {id:'st066',label:'Test: IVA correcto, reserva stock, stock insuficiente bloqueado',type:'Pruebas'},
            ],
          },
        ],
      },
      {
        id:'E2-O3', code:'OBJ-2.3',
        title:'Ejecución de reparaciones',
        desc:'Controlar la ejecución de la reparación por parte del mecánico, registrar el avance y confirmar el consumo definitivo de repuestos.',
        module:'Módulo Reparación', icon:<Wrench size={14}/>,
        stories:[
          {
            id:'s015', code:'US-015', title:'Iniciar y registrar avance de reparación',
            role:'Mecánico', priority:'Alta', points:5,
            description:'Como Mecánico, quiero cambiar el estado de la OT a "en_reparacion" y registrar notas de avance del trabajo para que el asesor y el cliente puedan hacer seguimiento.',
            acceptanceCriteria:[
              'El estado solo puede pasar a "en_reparacion" si previamente estaba en "en_diagnostico" (con cotización aprobada)',
              'Solo el mecánico asignado puede ejecutar este cambio',
              'Las notas de avance se pueden actualizar múltiples veces (con timestamp)',
              'El cliente ve el estado actualizado en el portal en tiempo real',
            ],
            businessRules:['Un mecánico no puede estar en "en_reparacion" en dos OTs simultáneamente del mismo vehículo'],
            subtasks:[
              {id:'st067',label:'Campo notas_reparacion como array JSON en OT',type:'BD'},
              {id:'st068',label:'Endpoint PATCH estado con validación de transición',type:'Backend'},
              {id:'st069',label:'Panel reparación con historial de notas',type:'Frontend'},
              {id:'st070',label:'Test: transición inválida bloqueada',type:'Pruebas'},
            ],
          },
          {
            id:'s016', code:'US-016', title:'Confirmar consumo definitivo de repuestos',
            role:'Mecánico', priority:'Alta', points:5,
            description:'Como Mecánico, quiero confirmar al finalizar la reparación los repuestos realmente utilizados para que el inventario se descuente definitivamente.',
            acceptanceCriteria:[
              'El mecánico puede ajustar cantidades de repuestos si usó más o menos de lo cotizado',
              'Al confirmar: stock_reservado disminuye y stock_actual disminuye por la cantidad real',
              'Si se usó más de lo cotizado, el sistema notifica al asesor para actualizar la cotización',
              'El movimiento queda registrado en historial de inventario con referencia a la OT',
            ],
            businessRules:['El ajuste de cantidades no puede exceder el stock disponible actual','El cargo al cliente se basa en la cotización aprobada; ajustes fuera de cotización requieren nuevo proceso'],
            subtasks:[
              {id:'st071',label:'Transacción: stock_reservado - X, stock_actual - X real',type:'BD'},
              {id:'st072',label:'Registro movimiento tipo=consumo en historial',type:'BD'},
              {id:'st073',label:'Endpoint POST /ordenes/:id/confirmar-consumo',type:'Backend'},
              {id:'st074',label:'Pantalla confirmación repuestos con cantidades ajustables',type:'Frontend'},
              {id:'st075',label:'Test: integridad stock post-consumo, exceso bloqueado',type:'Pruebas'},
            ],
          },
        ],
      },
      {
        id:'E2-O4', code:'OBJ-2.4',
        title:'Control de calidad y entrega del vehículo',
        desc:'Implementar el proceso de inspección QC por el Jefe de Taller y la entrega formal del vehículo al cliente por el Asesor.',
        module:'Módulo QC y Entrega', icon:<CheckSquare size={14}/>,
        stories:[
          {
            id:'s017', code:'US-017', title:'Realizar inspección de control de calidad',
            role:'Jefe de Taller', priority:'Alta', points:5,
            description:'Como Jefe de Taller, quiero inspeccionar una OT terminada y aprobarla (pasa a "liberada") o rechazarla (vuelve a "en_reparacion") con observaciones específicas.',
            acceptanceCriteria:[
              'Solo el Jefe de Taller puede hacer QC; otros roles no ven el botón',
              'La OT debe estar en estado "control_calidad" para habilitar la inspección',
              'Si se rechaza: estado vuelve a "en_reparacion" y el mecánico recibe las observaciones',
              'Si se aprueba: estado pasa a "liberada" y el Asesor recibe notificación de "vehículo listo para entrega"',
              'Las observaciones de QC quedan registradas en el historial de la OT',
            ],
            businessRules:['El QC puede rechazar una OT máximo 3 veces antes de escalar al Administrador'],
            subtasks:[
              {id:'st076',label:'Campo observaciones_qc y contador_rechazos en OT',type:'BD'},
              {id:'st077',label:'Endpoint PATCH /ordenes/:id/qc con validación rol',type:'Backend'},
              {id:'st078',label:'Formulario QC con checklist y campo observaciones',type:'Frontend'},
              {id:'st079',label:'Notificación resultado QC al mecánico y asesor',type:'APIs'},
              {id:'st080',label:'Test: rol incorrecto bloqueado, flujo aprobación/rechazo',type:'Pruebas'},
            ],
          },
          {
            id:'s018', code:'US-018', title:'Registrar entrega del vehículo al cliente',
            role:'Asesor de Servicio', priority:'Alta', points:3,
            description:'Como Asesor, quiero registrar la entrega del vehículo al cliente para finalizar la OT y desencadenar la generación de la factura.',
            acceptanceCriteria:[
              'Solo se puede entregar si la OT está en estado "liberada"',
              'Al entregar: estado pasa a "finalizada" con fecha y hora exacta de entrega',
              'Se genera automáticamente un borrador de factura para revisión del Asesor',
              'El cliente recibe notificación de que el vehículo ha sido entregado',
              'El km de salida (odómetro al entregar) se registra en la OT',
            ],
            businessRules:['Una OT finalizada NO puede volver a estados anteriores','El km de salida debe ser >= km de ingreso'],
            subtasks:[
              {id:'st081',label:'Campo fechaEntrega, kmSalida en OT',type:'BD'},
              {id:'st082',label:'Endpoint POST /ordenes/:id/entregar',type:'Backend'},
              {id:'st083',label:'Trigger creación factura borrador al finalizar',type:'Backend'},
              {id:'st084',label:'Modal confirmación entrega con campo km salida',type:'Frontend'},
              {id:'st085',label:'Test: flujo completo OT desde creación hasta entrega',type:'Pruebas'},
            ],
          },
        ],
      },
    ],
  },

  // ── ÉPICA 3 ─────────────────────────────────────────────────────────────────
  {
    id:'E3', code:'TPRO-E3',
    title:'Gestión de Inventario y Repuestos',
    subsystem:'Subsistema de Bodega y Control de Stock',
    generalObjective:'Mantener el control preciso y en tiempo real del inventario de repuestos y materiales, garantizando que ninguna cotización comprometa stock que no existe y que las alertas de stock mínimo permitan reabastecerse antes de quedarse sin existencias.',
    why:`El error más costoso en un taller automotriz sin sistema es comprometer una reparación a un cliente y descubrir que el repuesto no hay en stock. La REGLA CRÍTICA que diferencia este sistema de uno básico es la RESERVA AUTOMÁTICA al cotizar (no al reparar): el stock se reserva en el momento exacto en que el cliente recibe la cotización, no cuando el mecánico va a usarlo. Esto previene que dos cotizaciones simultáneas prometan el mismo repuesto a dos clientes distintos. Se decidió crear un subsistema separado porque el inventario tiene su propio ciclo de vida (entrada → reserva → consumo/liberación → alerta) independiente del ciclo de la OT, y porque en talleres grandes hay un rol específico de "bodeguero" que administra el stock. Las alertas de stock mínimo son proactivas: el sistema te dice cuándo vas a quedarte sin stock ANTES de que pase.`,
    scope:['Página /inventario', 'Modal detalle ítem con historial', 'Widget stock crítico en Dashboard', 'Integración automática con cotizaciones (E2)'],
    tables:['items (codigo, descripcion, categoria, tipo[repuesto/servicio], precioCompra, precioVenta, stockActual, stockMinimo, stockReservado, unidad, deletedAt)','movimientos_inventario (itemId, tipo[entrada/reserva/liberacion/consumo/ajuste], cantidad, stockAnterior, stockNuevo, otId nullable, motivo, usuarioId, fecha)'],
    processFlow:['① Admin/Mecánico registra ítem en catálogo con stock inicial y stock mínimo','② Al generar cotización: sistema reserva stock automáticamente (atomico)','③ Si cliente aprueba cotización: reserva queda confirmada para esa OT','④ Si cliente rechaza: reserva se libera inmediatamente (stock disponible sube)','⑤ Al confirmar reparación: stock_reservado y stock_actual se decrementan en cantidad real','⑥ Si stock_actual ≤ stock_minimo: se dispara alerta automática a mecánico y administrador','⑦ Cada movimiento queda registrado en historial para auditoría completa'],
    depends:'Depende de E2 (las reservas son generadas por cotizaciones de OTs)',
    icon:<Package size={18}/>,
    objectives:[
      {
        id:'E3-O1', code:'OBJ-3.1',
        title:'Catálogo de repuestos y servicios',
        desc:'Administrar el catálogo maestro de ítems (repuestos físicos y servicios de mano de obra) con precios de compra, venta y unidades de medida.',
        module:'Módulo Inventario — Catálogo', icon:<Package size={14}/>,
        stories:[
          {
            id:'s019', code:'US-019', title:'Registrar ítem en catálogo (repuesto o servicio)',
            role:'Mecánico / Administrador', priority:'Alta', points:5,
            description:'Como Mecánico, quiero registrar un nuevo ítem en el catálogo indicando su código, tipo, precios y stock inicial para que esté disponible en cotizaciones.',
            acceptanceCriteria:[
              'El código de ítem debe ser único (insensible a mayúsculas)',
              'El tipo debe ser "repuesto" o "servicio" (los servicios no tienen stock físico)',
              'El precio de venta debe ser >= precio de compra',
              'El stock mínimo debe ser >= 0; si es 0 significa "sin control de stock mínimo"',
              'Los ítems de tipo "servicio" no tienen campo de stock (deshabilitado)',
            ],
            businessRules:['Un ítem desactivado no aparece en el selector de cotizaciones','El precio de compra es interno; el cliente solo ve el precio de venta'],
            subtasks:[
              {id:'st086',label:'Tabla items con tipos y campos condicionales',type:'BD'},
              {id:'st087',label:'Endpoint POST /items con validación código único',type:'Backend'},
              {id:'st088',label:'Formulario ítem con campos condicionales según tipo',type:'Frontend'},
              {id:'st089',label:'Test: código duplicado, precio venta < compra',type:'Pruebas'},
            ],
          },
          {
            id:'s020', code:'US-020', title:'Ajustar stock manualmente con justificación',
            role:'Mecánico / Administrador', priority:'Alta', points:3,
            description:'Como Administrador, quiero realizar ajustes manuales de stock (entrada por compra, corrección por inventario físico) con un motivo registrado para mantener auditoría.',
            acceptanceCriteria:[
              'El ajuste puede ser positivo (entrada) o negativo (salida por merma/daño)',
              'El motivo es obligatorio (mínimo 10 caracteres)',
              'El movimiento queda registrado inmediatamente en el historial del ítem',
              'No se puede ajustar a un stock negativo',
            ],
            businessRules:['Los ajustes negativos que dejen stock < stock_reservado deben ser bloqueados o alertados'],
            subtasks:[
              {id:'st090',label:'Endpoint POST /items/:id/ajuste con motivo',type:'Backend'},
              {id:'st091',label:'Registro en movimientos_inventario tipo=ajuste',type:'BD'},
              {id:'st092',label:'Modal ajuste stock con campo motivo y preview resultado',type:'Frontend'},
              {id:'st093',label:'Test: stock negativo bloqueado, movimiento registrado',type:'Pruebas'},
            ],
          },
        ],
      },
      {
        id:'E3-O2', code:'OBJ-3.2',
        title:'Reserva automática y liberación de stock',
        desc:'Implementar el mecanismo de reserva atómica al cotizar y liberación automática al rechazar cotización o cancelar OT.',
        module:'Módulo Inventario — Reservas', icon:<Zap size={14}/>,
        stories:[
          {
            id:'s021', code:'US-021', title:'Reservar stock al generar cotización',
            role:'Sistema (automático)', priority:'Alta', points:8,
            description:'Como Sistema, al guardar una cotización debo reservar automáticamente el stock de todos los repuestos incluidos para evitar doble-asignación.',
            acceptanceCriteria:[
              'La reserva es una transacción atómica: o se reservan TODOS los ítems o ninguno',
              'Si algún ítem no tiene suficiente stock disponible, toda la cotización es rechazada con mensaje indicando qué ítem falla',
              'stock_reservado aumenta por la cantidad cotizada',
              'stock_disponible (= stock_actual - stock_reservado) disminuye correctamente',
              'El movimiento tipo=reserva queda registrado con referencia a la OT',
            ],
            businessRules:['La reserva es sobre stock DISPONIBLE (actual - ya reservado), no sobre stock total','Los ítems de tipo servicio (mano de obra) no tienen reserva de stock'],
            subtasks:[
              {id:'st094',label:'Stored procedure transacción reserva multi-ítem',type:'BD'},
              {id:'st095',label:'Validación stock disponible antes de cotizar',type:'Backend'},
              {id:'st096',label:'Rollback completo si algún ítem falla',type:'Backend'},
              {id:'st097',label:'Indicador "disponible para cotizar" en selector ítems',type:'Frontend'},
              {id:'st098',label:'Test concurrencia: dos cotizaciones simultáneas mismo ítem',type:'Pruebas'},
            ],
          },
          {
            id:'s022', code:'US-022', title:'Liberar reserva si OT es cancelada o rechazada',
            role:'Sistema (automático)', priority:'Alta', points:5,
            description:'Como Sistema, cuando una cotización es rechazada por el cliente o una OT es cancelada, debo liberar automáticamente el stock reservado.',
            acceptanceCriteria:[
              'Al rechazar cotización: stock_reservado decrece en las cantidades de cada ítem cotizado',
              'Al cancelar OT: si había reservas, se liberan todas en transacción atómica',
              'Movimiento tipo=liberacion queda registrado con motivo y referencia OT',
              'El stock disponible sube inmediatamente y está disponible para otras cotizaciones',
            ],
            businessRules:['Si la OT ya estaba en reparación (consumo confirmado), la liberación NO se aplica'],
            subtasks:[
              {id:'st099',label:'Trigger liberación en cambio de estado OT',type:'Backend'},
              {id:'st100',label:'Registro movimiento tipo=liberacion',type:'BD'},
              {id:'st101',label:'Test: cancelar OT en diferentes estados',type:'Pruebas'},
            ],
          },
        ],
      },
      {
        id:'E3-O3', code:'OBJ-3.3',
        title:'Alertas proactivas de stock mínimo',
        desc:'Notificar automáticamente al personal cuando el stock de un ítem alcanza o cae por debajo del nivel mínimo configurado.',
        module:'Módulo Inventario — Alertas', icon:<Bell size={14}/>,
        stories:[
          {
            id:'s023', code:'US-023', title:'Notificar cuando stock llega al mínimo',
            role:'Sistema (automático)', priority:'Media', points:5,
            description:'Como Sistema, debo detectar cuando el stock disponible de un repuesto cae ≤ stock_mínimo y enviar notificación al Mecánico y Administrador.',
            acceptanceCriteria:[
              'La verificación se ejecuta después de cada movimiento de salida (reserva o consumo)',
              'La notificación incluye: nombre del ítem, stock actual, stock mínimo, diferencia',
              'No se genera notificación duplicada si ya hay una activa para ese ítem',
              'La notificación se marca como resuelta cuando el stock sube por encima del mínimo',
            ],
            businessRules:['Si stock_minimo = 0, no se generan alertas para ese ítem (opt-out)'],
            subtasks:[
              {id:'st102',label:'Check post-movimiento: stock_actual ≤ stock_minimo',type:'Backend'},
              {id:'st103',label:'Tabla notificaciones con tipo=stock_bajo y itemId',type:'BD'},
              {id:'st104',label:'Badge stock crítico en sidebar y módulo inventario',type:'Frontend'},
              {id:'st105',label:'Test: alerta generada, no duplicada, resuelta al restock',type:'Pruebas'},
            ],
          },
        ],
      },
      {
        id:'E3-O4', code:'OBJ-3.4',
        title:'Trazabilidad completa de movimientos',
        desc:'Registrar y consultar cada movimiento de inventario con quién lo hizo, cuándo y por qué, para auditoría total.',
        module:'Módulo Inventario — Historial', icon:<FileText size={14}/>,
        stories:[
          {
            id:'s024', code:'US-024', title:'Ver historial de movimientos por ítem',
            role:'Administrador / Mecánico', priority:'Media', points:5,
            description:'Como Administrador, quiero ver el historial cronológico completo de movimientos de un ítem para auditar el inventario y detectar discrepancias.',
            acceptanceCriteria:[
              'El historial muestra: fecha, tipo de movimiento, cantidad, stock anterior, stock nuevo, usuario, referencia OT',
              'Se puede filtrar por tipo de movimiento y rango de fechas',
              'Los movimientos se ordenan de más reciente a más antiguo',
              'El saldo de stock es siempre verificable sumando los movimientos (auditabilidad)',
            ],
            businessRules:['Los movimientos son inmutables — no se pueden editar ni eliminar para garantizar integridad'],
            subtasks:[
              {id:'st106',label:'Tabla movimientos_inventario append-only',type:'BD'},
              {id:'st107',label:'Endpoint GET /items/:id/movimientos con filtros',type:'APIs'},
              {id:'st108',label:'Panel historial con tabla y filtros',type:'Frontend'},
              {id:'st109',label:'Test: suma movimientos = stock_actual',type:'Pruebas'},
            ],
          },
        ],
      },
    ],
  },

  // ── ÉPICA 4 ─────────────────────────────────────────────────────────────────
  {
    id:'E4', code:'TPRO-E4',
    title:'Facturación, Reportes y Administración',
    subsystem:'Subsistema Administrativo y Financiero',
    generalObjective:'Generar facturas PDF con NIT e IVA 12%, producir reportes de KPIs financieros y operativos, y administrar el sistema con 5 roles diferenciados que requieren código de empleado en el login.',
    why:`El aspecto administrativo y fiscal no es opcional: es un requisito legal y de negocio. La facturación con NIT (en lugar de RUC, por contexto del cliente) y el IVA 12% deben ser correctos desde el primer día — un error fiscal puede implicar sanciones. Se decidió agrupar Facturación + Reportes + Administración de Usuarios en una sola épica porque comparten el mismo "sujeto": el control del negocio desde el lado gerencial. El Administrador es el único rol que tiene acceso completo a esta épica. La exigencia de CÓDIGO DE EMPLEADO en el login (no solo usuario/contraseña) es una medida de seguridad extra para el personal del taller: garantiza que cada acción en el sistema sea trazable a un empleado específico, no solo a un usuario. El SOFT-DELETE obligatorio en todos los registros protege la integridad histórica para auditorías fiscales (los SAT/SRI pueden auditar años atrás). Los reportes de KPIs son fundamentales para que el administrador tome decisiones basadas en datos.`,
    scope:['Página /facturas', 'Página /reportes', 'Página /configuracion', 'PDF generation (jsPDF)', 'Dashboard KPIs (Recharts)', 'Módulo usuarios y roles en /configuracion'],
    tables:['facturas (numero, otId, clienteId, subtotal, iva, total, estado[borrador/emitida/anulada], nitCliente, deletedAt)','lineas_factura (facturaId, descripcion, cantidad, precioUnit, subtotal, tipo)','configuracion_sistema (nombreTaller, nit, direccion, telefono, email, logoUrl, ivaPct, moneda)','usuarios (codigoEmpleado UNIQUE NOT NULL para staff, deletedAt)'],
    processFlow:['① OT se finaliza (estado=finalizada) → sistema genera factura en estado=borrador','② Asesor revisa el borrador, ajusta si es necesario y emite la factura','③ Al emitir: número correlativo se asigna (FAC-YYYY-XXXX), no puede cambiarse','④ Se genera PDF con jsPDF: logo taller, NIT cliente, desglose, IVA 12%, total','⑤ Cliente descarga PDF desde su portal o lo recibe por email','⑥ Administrador puede anular facturas (estado=anulada, soft, nunca eliminar)','⑦ Dashboard consolida KPIs: ingresos/mes, OTs/semana, items críticos, top mecánicos','⑧ Reportes exportables por rango de fecha para gestión gerencial'],
    depends:'Depende de E1 (datos cliente/NIT), E2 (OT finalizada), E3 (consumo repuestos en cotización)',
    icon:<Receipt size={18}/>,
    objectives:[
      {
        id:'E4-O1', code:'OBJ-4.1',
        title:'Facturación con NIT y generación PDF',
        desc:'Generar facturas electrónicas con número correlativo, NIT del cliente, IVA 12% y exportación a PDF con marca del taller.',
        module:'Módulo Facturas', icon:<Receipt size={14}/>,
        stories:[
          {
            id:'s025', code:'US-025', title:'Generar y emitir factura desde OT finalizada',
            role:'Asesor de Servicio', priority:'Alta', points:8,
            description:'Como Asesor, quiero revisar el borrador de factura generado automáticamente al finalizar la OT, ajustar si es necesario y emitirla con número correlativo definitivo.',
            acceptanceCriteria:[
              'El borrador pre-carga todas las líneas de la cotización aprobada',
              'Si el cliente tiene NIT, la factura se emite a nombre del NIT; si no, a nombre del CI',
              'El IVA se calcula al 12% (configurable desde /configuracion)',
              'Al emitir: número FAC-YYYY-XXXX se asigna y queda bloqueado',
              'Una factura emitida NO puede editarse (solo anularse)',
              'El estado pasa de "borrador" a "emitida" con fecha y hora exacta',
            ],
            businessRules:['Número de factura es correlativo y nunca se salta ni reutiliza','Una factura anulada mantiene su número con estado=anulada para auditoria fiscal'],
            subtasks:[
              {id:'st110',label:'Tablas facturas y lineas_factura con secuencia FAC-YYYY',type:'BD'},
              {id:'st111',label:'Endpoint POST /facturas/emitir con cálculo IVA',type:'Backend'},
              {id:'st112',label:'Vista detalle factura borrador vs emitida',type:'Frontend'},
              {id:'st113',label:'Test: número correlativo, NIT correcto, IVA 12%',type:'Pruebas'},
            ],
          },
          {
            id:'s026', code:'US-026', title:'Generar PDF de factura con jsPDF',
            role:'Asesor de Servicio / Cliente', priority:'Alta', points:5,
            description:'Como Asesor y como Cliente, quiero descargar la factura en PDF con el logo del taller, datos fiscales, desglose de líneas, IVA y total para presentar como comprobante.',
            acceptanceCriteria:[
              'El PDF incluye: logo taller, nombre, NIT del taller, dirección, número factura, fecha',
              'Datos del cliente: nombre, CI/NIT según corresponda',
              'Tabla de líneas: descripción, cantidad, precio unitario, subtotal por línea',
              'Sección totales: subtotal, IVA 12%, TOTAL con formato de moneda',
              'Footer con leyenda "Gracias por su preferencia" y datos de contacto del taller',
              'El PDF se descarga con nombre "FAC-YYYY-XXXX_[cliente].pdf"',
            ],
            businessRules:['Solo facturas en estado "emitida" pueden descargarse como PDF','Las facturas "anuladas" generan PDF con marca de agua "ANULADA"'],
            subtasks:[
              {id:'st114',label:'Función generateInvoicePDF(factura) con jsPDF',type:'Frontend'},
              {id:'st115',label:'Layout PDF: logo, tabla, totales, footer',type:'Frontend'},
              {id:'st116',label:'Marca de agua en PDF para facturas anuladas',type:'Frontend'},
              {id:'st117',label:'Test: estructura PDF, cálculos correctos en PDF',type:'Pruebas'},
            ],
          },
          {
            id:'s027', code:'US-027', title:'Listar y filtrar facturas emitidas',
            role:'Administrador / Asesor', priority:'Alta', points:3,
            description:'Como Administrador, quiero ver todas las facturas emitidas con filtros por fecha, cliente, estado y rango de monto para control financiero.',
            acceptanceCriteria:[
              'Tabla muestra: número, fecha, cliente, NIT, total, estado (borrador/emitida/anulada)',
              'Filtros: rango de fechas, cliente (búsqueda), estado',
              'El total de ingresos del período filtrado aparece en el footer de la tabla',
              'Desde cada fila se puede ver el detalle y descargar el PDF',
            ],
            businessRules:['El Asesor solo ve facturas de sus propias OTs; el Admin ve todas'],
            subtasks:[
              {id:'st118',label:'Endpoint GET /facturas con filtros y suma total',type:'APIs'},
              {id:'st119',label:'Tabla facturas con filtros y total período',type:'Frontend'},
              {id:'st120',label:'Test: filtros correctos, totales exactos',type:'Pruebas'},
            ],
          },
        ],
      },
      {
        id:'E4-O2', code:'OBJ-4.2',
        title:'Dashboard de KPIs y reportes gerenciales',
        desc:'Proveer al Administrador y Jefe de Taller visibilidad en tiempo real de los indicadores clave del negocio mediante gráficos interactivos.',
        module:'Módulo Reportes / Dashboard', icon:<BarChart3 size={14}/>,
        stories:[
          {
            id:'s028', code:'US-028', title:'Dashboard KPIs diferenciado por rol',
            role:'Administrador / Jefe de Taller', priority:'Alta', points:8,
            description:'Como Administrador, quiero ver en el dashboard KPIs clave: OTs activas, ingresos del mes, ítems en stock crítico, eficiencia de mecánicos y citas del día.',
            acceptanceCriteria:[
              'Cards superiores: OTs activas, ingresos mes actual, ítems stock crítico, citas hoy',
              'Gráfico de barras: OTs completadas por semana (últimas 8 semanas)',
              'Gráfico de barras: ingresos por mes (últimos 6 meses)',
              'Lista top 5 mecánicos por OTs completadas en el mes',
              'Los KPIs se actualizan sin recargar la página (cada 60 segundos)',
              'El Jefe de Taller ve solo KPIs operativos (OTs, mecánicos); no ve financieros',
            ],
            businessRules:['Los datos del dashboard son de solo lectura','El ingreso se basa en facturas con estado=emitida (no borradores)'],
            subtasks:[
              {id:'st121',label:'Queries agregadas para cada KPI optimizadas',type:'BD'},
              {id:'st122',label:'Endpoints GET /dashboard/kpis?rol=',type:'APIs'},
              {id:'st123',label:'Cards KPI con tendencia vs mes anterior',type:'Frontend'},
              {id:'st124',label:'BarChart ingresos por mes (Recharts)',type:'Frontend'},
              {id:'st125',label:'BarChart OTs por semana (Recharts)',type:'Frontend'},
              {id:'st126',label:'Test: KPIs correctos por rol, acceso bloqueado',type:'Pruebas'},
            ],
          },
          {
            id:'s029', code:'US-029', title:'Reporte de ingresos y OTs por período',
            role:'Administrador', priority:'Media', points:5,
            description:'Como Administrador, quiero generar reportes de ingresos y número de OTs por período seleccionable (semanal/mensual) para análisis financiero y operativo.',
            acceptanceCriteria:[
              'Selector de período: semana actual, mes actual, trimestre, rango personalizado',
              'Tabla con desglose: fecha, número OTs, total facturado, promedio por OT',
              'Gráfico de línea comparando período actual vs período anterior',
              'Botón exportar datos a CSV',
            ],
            businessRules:['Los reportes de períodos cerrados son inmutables (no cambian retroactivamente)'],
            subtasks:[
              {id:'st127',label:'Query reportes agrupados por período con comparativa',type:'BD'},
              {id:'st128',label:'Selector período con rango personalizado',type:'Frontend'},
              {id:'st129',label:'LineChart comparativa períodos (Recharts)',type:'Frontend'},
              {id:'st130',label:'Exportador CSV de datos de reporte',type:'Frontend'},
            ],
          },
        ],
      },
      {
        id:'E4-O3', code:'OBJ-4.3',
        title:'Administración de usuarios con 5 roles',
        desc:'Gestionar los 5 roles del sistema con código de empleado obligatorio para staff, soft-delete en usuarios y control de acceso estricto por rol.',
        module:'Módulo Configuración / Seguridad', icon:<Shield size={14}/>,
        stories:[
          {
            id:'s030', code:'US-030', title:'Crear usuario de staff con código de empleado',
            role:'Administrador', priority:'Alta', points:5,
            description:'Como Administrador, quiero crear usuarios del personal (Asesor, Mecánico, Jefe de Taller) exigiendo un código de empleado único para garantizar trazabilidad de todas sus acciones.',
            acceptanceCriteria:[
              'Los roles Administrador, Asesor, Mecánico y Jefe de Taller DEBEN tener código de empleado',
              'El código de empleado es único en el sistema (no puede estar duplicado entre usuarios activos)',
              'El login de personal valida: usuario + contraseña + código de empleado (triple factor)',
              'El rol Cliente NO tiene código de empleado (campo vacío/null)',
              'Al crear usuario, se envía notificación al nuevo empleado con sus credenciales',
            ],
            businessRules:['Un usuario con código de empleado inactivo no puede iniciar sesión aunque proporcione credenciales correctas','El código de empleado no puede modificarse una vez asignado'],
            subtasks:[
              {id:'st131',label:'Campo codigoEmpleado UNIQUE nullable en tabla usuarios',type:'BD'},
              {id:'st132',label:'Validación triple factor en endpoint /auth/login',type:'Backend'},
              {id:'st133',label:'Formulario creación usuario con campo código empleado condicional',type:'Frontend'},
              {id:'st134',label:'Test: código duplicado, login sin código, código inactivo',type:'Pruebas'},
            ],
          },
          {
            id:'s031', code:'US-031', title:'Control de acceso por rol en toda la aplicación',
            role:'Sistema', priority:'Alta', points:8,
            description:'Como Sistema, debo garantizar que cada rol solo tenga acceso a las rutas, botones y endpoints que le corresponden, rechazando cualquier intento de acceso no autorizado.',
            acceptanceCriteria:[
              'Rutas React protegidas: redirect a login si no autenticado, 403 si rol incorrecto',
              'Los botones de acción (crear OT, asignar mecánico, hacer QC) son invisibles para roles sin permiso',
              'Los endpoints validan el token y el rol en cada request',
              'Un token expirado o inválido devuelve 401 y redirige al login',
              'La tabla de permisos es: Administrador(todo) > Asesor(CRM+OTs+Facturas) > Jefe(OTs+Asignación+QC) > Mecánico(OTs asignadas+Inventario) > Cliente(portal)',
            ],
            businessRules:['Los permisos son aditivos — el rol de mayor jerarquía puede hacer todo lo de los de menor jerarquía','No existe escalación de permisos en tiempo de ejecución'],
            subtasks:[
              {id:'st135',label:'Middleware validateRole en todos los endpoints sensibles',type:'Backend'},
              {id:'st136',label:'HOC/Guard de rutas en React Router por rol',type:'Frontend'},
              {id:'st137',label:'Ocultar botones/acciones según rol del currentUser',type:'Frontend'},
              {id:'st138',label:'Test: 10 escenarios de acceso no autorizado',type:'Pruebas'},
            ],
          },
          {
            id:'s032', code:'US-032', title:'Soft-delete universal en todos los módulos',
            role:'Administrador', priority:'Alta', points:5,
            description:'Como Administrador, quiero que NINGÚN registro del sistema se elimine físicamente — solo se desactive con deletedAt — para garantizar integridad histórica y cumplimiento fiscal.',
            acceptanceCriteria:[
              'Todas las tablas tienen campo deletedAt (timestamp, nullable)',
              'Todos los endpoints de "eliminar" hacen PATCH deletedAt = NOW()',
              'Todos los endpoints de "listar" filtran WHERE deletedAt IS NULL por defecto',
              'El Administrador puede ver registros inactivos con parámetro ?includeDeleted=true',
              'No existe ningún endpoint DELETE en toda la API',
            ],
            businessRules:['Los registros inactivos mantienen todas sus relaciones intactas','Un registro inactivo puede reactivarse estableciendo deletedAt = null'],
            subtasks:[
              {id:'st139',label:'Migración: agregar deletedAt a todas las tablas',type:'BD'},
              {id:'st140',label:'Global query filter: WHERE deletedAt IS NULL',type:'Backend'},
              {id:'st141',label:'Toggle "Ver inactivos" en todos los módulos',type:'Frontend'},
              {id:'st142',label:'Test: verificar que ningún endpoint hace DELETE físico',type:'Pruebas'},
            ],
          },
        ],
      },
      {
        id:'E4-O4', code:'OBJ-4.4',
        title:'Configuración general del sistema',
        desc:'Permitir al Administrador configurar los datos del taller, parámetros fiscales (IVA, moneda) y personalización que se aplican globalmente.',
        module:'Módulo Configuración', icon:<Settings size={14}/>,
        stories:[
          {
            id:'s033', code:'US-033', title:'Configurar datos del taller para facturas y PDFs',
            role:'Administrador', priority:'Media', points:3,
            description:'Como Administrador, quiero configurar el nombre, NIT, dirección, teléfono, email y logo del taller para que aparezcan automáticamente en todas las facturas PDF.',
            acceptanceCriteria:[
              'Los campos se pre-cargan con los valores actuales de configuracion_sistema',
              'El logo se puede subir como imagen (PNG/JPG, max 2MB) y se previsualiza',
              'Al guardar, todos los PDFs generados a partir de ese momento usan la nueva configuración',
              'El IVA % se configura aquí (default 12%) y afecta todos los cálculos nuevos',
            ],
            businessRules:['Cambiar el IVA NO recalcula facturas ya emitidas (solo afecta nuevas)','La configuración es única (una sola fila en la tabla, siempre UPDATE)'],
            subtasks:[
              {id:'st143',label:'Tabla configuracion_sistema (singleton)',type:'BD'},
              {id:'st144',label:'Endpoint GET /configuracion y PATCH /configuracion',type:'Backend'},
              {id:'st145',label:'Formulario configuración con upload de logo',type:'Frontend'},
              {id:'st146',label:'Test: cambio IVA no afecta facturas anteriores',type:'Pruebas'},
            ],
          },
        ],
      },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
//  SPRINT PLAN DATA
// ═══════════════════════════════════════════════════════════════════════════════
const SPRINTS = [
  {
    num:1, title:'Fundamentos CRM', weeks:'Semanas 1–2',
    epic:'E1', color:'bg-blue-600', light:'bg-blue-50', border:'border-blue-200', text:'text-blue-700',
    goal:'Tener el sistema de clientes, vehículos y citas completamente funcional, con autenticación de 5 roles y soft-delete implementado en la base.',
    team:[
      {rol:'Backend Dev',tareas:['Esquema BD completo: clientes, vehiculos, citas, usuarios','Autenticación JWT con validación código de empleado','CRUD clientes (CI único, soft-delete)','CRUD vehículos (placa única)','CRUD citas (validación solapamiento)']},
      {rol:'Frontend Dev',tareas:['Login dual (portal empresa + portal cliente)','Módulo /clientes con tabla, búsqueda, modal registro/edición','Módulo /vehiculos con vinculación a cliente','Módulo /citas con calendario y selector de horario']},
      {rol:'QA',tareas:['Test CI duplicado, email inválido','Test soft-delete no borra historial','Test solapamiento de horarios en citas','Test login con/sin código de empleado']},
    ],
    dod:['Tablas creadas con migraciones aplicadas','CRUD completo con soft-delete','Tests unitarios pasando (cobertura ≥ 80%)','Funcionalidad desplegada en staging','Documentación API actualizada (Swagger/Postman)'],
    risks:['El diseño de la tabla usuarios debe contemplar ambos tipos (staff+cliente) desde el inicio o habrá refactoring costoso en Sprint 4'],
  },
  {
    num:2, title:'Motor de Órdenes de Trabajo', weeks:'Semanas 3–4',
    epic:'E2', color:'bg-emerald-600', light:'bg-emerald-50', border:'border-emerald-200', text:'text-emerald-700',
    goal:'Implementar el flujo completo de la OT desde creación hasta QC, con la máquina de estados de 9 valores y validaciones estrictas de rol en cada transición.',
    team:[
      {rol:'Backend Dev',tareas:['Tabla ordenes_trabajo con 9 estados y secuencia OT-YYYY','Máquina de estados: validar transiciones y rol en cada cambio','Tabla cotizaciones + lineas_cotizacion con cálculo IVA 12%','Endpoint cotización con reserva atómica de stock (requiere E3-O2 parcial)','Notificaciones automáticas en cada cambio de estado']},
      {rol:'Frontend Dev',tareas:['Módulo /ordenes: tabla con filtros por estado y badges de urgencia','Modal creación OT con selector cliente → vehículo en cascada','Modal cotización con líneas dinámicas y cálculo IVA en vivo','Módulo /diagnostico para mecánicos','Vista kanban de estados OT para Jefe de Taller']},
      {rol:'QA',tareas:['Test: mecánico no puede crear OTs','Test: Asesor no puede hacer QC','Test: no se puede saltear estados','Test: reserva de stock al guardar cotización','Test flujo completo OT estado por estado']},
    ],
    dod:['9 estados implementados con transiciones validadas por rol','Cotización genera reserva de stock atómica','Tests de integración del flujo OT completo','Módulos /ordenes y /diagnostico en staging'],
    risks:['La reserva atómica de stock requiere que el módulo de inventario (Sprint 3) tenga al menos la tabla items creada — coordinación entre sprints necesaria'],
  },
  {
    num:3, title:'Inventario Inteligente', weeks:'Semanas 5–6',
    epic:'E3', color:'bg-orange-500', light:'bg-orange-50', border:'border-orange-200', text:'text-orange-700',
    goal:'Implementar el catálogo de repuestos con stock en tiempo real, reservas automáticas, liberaciones al cancelar y alertas proactivas de stock mínimo.',
    team:[
      {rol:'Backend Dev',tareas:['Tabla items con campos stock_actual, stock_minimo, stock_reservado','Tabla movimientos_inventario (append-only, nunca UPDATE/DELETE)','Transacción atómica reserva multi-ítem con rollback total','Trigger de alerta stock_bajo post-movimiento','Endpoint ajuste manual de stock con motivo obligatorio']},
      {rol:'Frontend Dev',tareas:['Módulo /inventario: tabla con indicadores visual de stock (verde/amarillo/rojo)','Formulario ítem con campos condicionales por tipo (repuesto/servicio)','Modal historial movimientos con filtros','Widget stock crítico en Dashboard','Integración selector de repuesto con stock en tiempo real en modal cotización (E2)']},
      {rol:'QA',tareas:['Test concurrencia: dos cotizaciones simultáneas mismo ítem','Test: cotización con stock insuficiente bloqueada','Test: liberación stock al cancelar OT en distintos estados','Test: alerta no duplicada, resuelta al restock','Test: suma movimientos = stock_actual siempre']},
    ],
    dod:['Reserva/liberación atómica sin race conditions','Historial de movimientos inmutable y completo','Alertas generadas correctamente','Tests de concurrencia pasando','Módulo /inventario en staging'],
    risks:['Los tests de concurrencia requieren un ambiente de prueba que soporte múltiples conexiones simultáneas','La integración con el selector de cotización (E2) puede revelar bugs de interfaz'],
  },
  {
    num:4, title:'Facturación PDF y Administración', weeks:'Semanas 7–8',
    epic:'E4', color:'bg-purple-600', light:'bg-purple-50', border:'border-purple-200', text:'text-purple-700',
    goal:'Implementar facturación con PDF (jsPDF), dashboard de KPIs con Recharts, reportes exportables, configuración del sistema y portal completo del cliente.',
    team:[
      {rol:'Backend Dev',tareas:['Tablas facturas y lineas_factura con secuencia FAC-YYYY','Endpoint generación factura borrador al finalizar OT','Endpoint emitir factura (bloquea edición, asigna número)','Tabla configuracion_sistema (singleton) con IVA%','Endpoints KPIs agregados por rol con cacheo de 60s']},
      {rol:'Frontend Dev',tareas:['Módulo /facturas: lista, filtros, detalle','Función generateInvoicePDF() con jsPDF (logo, NIT, tabla, IVA, footer)','Dashboard /: cards KPI + BarChart ingresos (Recharts) + BarChart OTs','Módulo /reportes con selector período y LineChart comparativa','Módulo /configuracion con upload logo y parámetros fiscales','Portal /portal: timeline OT, aprobación cotización, descarga facturas, notificaciones']},
      {rol:'QA',tareas:['Test: número FAC nunca se duplica ni salta','Test: IVA 12% correcto en PDF','Test: PDF con marca de agua en facturas anuladas','Test: KPIs correctos por rol','Test portal cliente: solo ve sus OTs y facturas','Test e2e: registro cliente → OT → cotización → aprobación → reparación → QC → entrega → factura PDF']},
    ],
    dod:['Factura PDF generada correctamente con todos los campos','KPIs validados matemáticamente','Portal cliente completo y funcional','Test e2e del flujo completo pasando','Todo el sistema en staging listo para UAT'],
    risks:['jsPDF puede tener comportamiento diferente en distintos navegadores — testear en Chrome, Firefox y Safari','Los KPIs con datos grandes pueden ser lentos — considerar materializar vistas en BD'],
  },
  {
    num:5, title:'Integración, QA Final y Deploy', weeks:'Semana 9',
    epic:'E1', color:'bg-slate-700', light:'bg-slate-50', border:'border-slate-200', text:'text-slate-700',
    goal:'Ejecutar pruebas de integración end-to-end completas, corregir bugs encontrados, revisar seguridad de roles y preparar el sistema para producción.',
    team:[
      {rol:'Backend Dev',tareas:['Revisión final de todos los middlewares de rol','Optimización de queries lentas (EXPLAIN ANALYZE)','Configuración CORS, rate limiting y headers de seguridad','Script de seed de datos de demo para producción']},
      {rol:'Frontend Dev',tareas:['Revisión responsive en móvil y tablet','Corrección de bugs de UI encontrados en UAT','Optimización de bundle (code splitting por ruta)','Revisión accesibilidad (aria-labels, contraste)']},
      {rol:'QA',tareas:['10 escenarios de acceso no autorizado por rol','Pruebas de carga: 50 usuarios simultáneos','Test de soft-delete: ningún registro eliminado físicamente','Flujo completo en dispositivo móvil','Checklist de seguridad: XSS, CSRF, SQL Injection']},
    ],
    dod:['0 bugs críticos abiertos','Cobertura de tests ≥ 80% global','Checklist de seguridad completado','Deploy en producción exitoso','Manual de usuario entregado'],
    risks:['Los bugs encontrados en UAT pueden requerir más de 1 semana — planificar buffer','El deploy en producción puede revelar diferencias de ambiente con staging'],
  },
];

// ═════════════════════════════════════════��═════════════════════════════════════
//  SYSTEM RULES DATA
// ═══════════════════════════════════════════════════════════════════════════════
const SYSTEM_RULES = [
  {
    category:'🔒 Seguridad y Roles',
    color:'bg-purple-50 border-purple-200',
    titleColor:'text-purple-700',
    rules:[
      'El staff (Admin, Asesor, Jefe, Mecánico) DEBE proporcionar código de empleado en el login — triple factor obligatorio',
      'El Cliente usa solo username + contraseña (sin código de empleado)',
      'Cada endpoint sensible valida el token JWT Y el rol en cada request — sin excepciones',
      'Los botones de acción son invisibles (no solo deshabilitados) para roles sin permiso',
      'Un token expirado devuelve HTTP 401 y redirige automáticamente al login',
      'No existe escalación de privilegios en tiempo de ejecución',
    ],
  },
  {
    category:'🗑️ Soft-Delete Universal',
    color:'bg-red-50 border-red-200',
    titleColor:'text-red-700',
    rules:[
      'NINGÚN registro se elimina físicamente en ningún módulo del sistema — sin excepción',
      'Todos los registros tienen campo deletedAt (timestamp, nullable). Inactivo = deletedAt ≠ null',
      'Todos los listados filtran WHERE deletedAt IS NULL por defecto',
      'No existe ningún endpoint HTTP DELETE en toda la API (solo PATCH para soft-delete)',
      'Los registros inactivos mantienen todas sus relaciones intactas para historial',
      'El Administrador puede ver inactivos con parámetro ?includeDeleted=true',
    ],
  },
  {
    category:'📋 Máquina de Estados OT (9 estados)',
    color:'bg-emerald-50 border-emerald-200',
    titleColor:'text-emerald-700',
    rules:[
      'registrada → en_diagnostico (Mecánico asignado inicia diagnóstico)',
      'en_diagnostico → esperando_aprobacion (Asesor genera cotización)',
      'esperando_aprobacion → en_reparacion (Cliente aprueba) | liquidacion_diagnostico (Cliente rechaza)',
      'en_reparacion → control_calidad (Mecánico termina trabajo)',
      'control_calidad → liberada (Jefe aprueba QC) | en_reparacion (Jefe rechaza QC)',
      'liberada → finalizada (Asesor entrega vehículo → genera factura borrador)',
      'Cualquier estado activo → cancelada (solo Asesor o Administrador)',
      'liquidacion_diagnostico → finalizada (Asesor cobra diagnóstico y cierra)',
      'NINGÚN estado puede saltarse — las transiciones inválidas retornan HTTP 422',
    ],
  },
  {
    category:'📦 Reglas de Inventario',
    color:'bg-orange-50 border-orange-200',
    titleColor:'text-orange-700',
    rules:[
      'El stock se reserva al GUARDAR LA COTIZACIÓN — no al aprobarla ni al reparar',
      'La reserva es atómica: si un ítem no tiene stock suficiente, toda la cotización falla',
      'stock_disponible = stock_actual - stock_reservado (nunca puede ser negativo)',
      'Al rechazar cotización: stock reservado se libera inmediatamente (transacción atómica)',
      'Al confirmar reparación: stock_actual y stock_reservado decrementan en cantidad real usada',
      'Los movimientos de inventario son inmutables (append-only) — nunca UPDATE ni DELETE',
      'Si stock_actual ≤ stock_minimo, se genera notificación automática (una sola, no duplicadas)',
    ],
  },
  {
    category:'🧾 Reglas de Facturación',
    color:'bg-blue-50 border-blue-200',
    titleColor:'text-blue-700',
    rules:[
      'El término correcto es NIT (no RUC) en todos los formularios y documentos del sistema',
      'IVA es 12% por defecto; configurable desde /configuracion (solo Admin)',
      'La factura se genera como "borrador" automáticamente al finalizar la OT',
      'Al emitir: número FAC-YYYY-XXXX se asigna y NUNCA puede modificarse',
      'Una factura emitida no puede editarse — solo anularse (con número que permanece)',
      'Las facturas anuladas generan PDF con marca de agua "ANULADA"',
      'Cambiar el IVA en configuración NO recalcula facturas ya emitidas',
    ],
  },
  {
    category:'👤 Convenciones Técnicas',
    color:'bg-slate-50 border-slate-200',
    titleColor:'text-slate-700',
    rules:[
      'Tipografía global: Inter (fallback Roboto/sans-serif) definida en /src/styles/fonts.css',
      'Paleta: fondo general bg-slate-100 | cards bg-white | cabeceras panel bg-slate-50 | cabeceras tabla bg-slate-100',
      'Sidebar: bg-[#2C3A4F] | nav activo: bg-cyan-500 | hover: bg-slate-800',
      'Números de OT: OT-YYYY-XXXX | Números de factura: FAC-YYYY-XXXX',
      'Fechas en formato dd/mm/yyyy en UI; ISO 8601 en API',
      'Todos los IDs son UUID v4 generados en backend',
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
//  SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function SubtaskBadge({ st }: { st: { type: string; label: string } }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-medium ${SUBTASK_COLORS[st.type] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      {SUBTASK_ICONS[st.type]} {st.type}: {st.label}
    </span>
  );
}

function StoryCard({ story, epicId }: { story: Story; epicId: string }) {
  const [open, setOpen] = useState(false);
  const s = EPIC_STYLE[epicId as keyof typeof EPIC_STYLE];
  return (
    <div className={`border rounded-xl bg-white overflow-hidden transition-shadow ${open ? 'shadow-md' : 'shadow-sm hover:shadow-md'}`}>
      <button onClick={() => setOpen(!open)} className="w-full text-left px-4 py-3 flex items-start gap-3">
        <div className={`w-6 h-6 rounded-lg ${s.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
          <BookOpen size={11} className="text-white"/>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
            <span className="font-mono text-xs text-slate-400">{story.code}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${PRIORITY_COLORS[story.priority]}`}>{story.priority}</span>
            <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">{story.points} pts</span>
            {story.dependencies && <span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-1.5 py-0.5 rounded">dep: {story.dependencies.join(', ')}</span>}
          </div>
          <p className="text-sm font-semibold text-slate-800 leading-tight">{story.title}</p>
          <p className="text-xs text-slate-500 mt-0.5">Rol: <span className="font-medium text-slate-700">{story.role}</span></p>
        </div>
        {open ? <ChevronDown size={14} className="text-slate-400 mt-1 flex-shrink-0"/> : <ChevronRight size={14} className="text-slate-400 mt-1 flex-shrink-0"/>}
      </button>

      {open && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-4">
          {/* Description */}
          <div className="bg-slate-50 rounded-lg px-3 py-2.5 text-xs text-slate-600 italic border border-slate-100">
            "{story.description}"
          </div>
          {/* Acceptance Criteria */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <CheckSquare size={12} className={`${s.text}`}/>
              <span className={`text-xs font-bold uppercase tracking-wide ${s.text}`}>Criterios de Aceptación ({story.acceptanceCriteria.length})</span>
            </div>
            <ul className="space-y-1">
              {story.acceptanceCriteria.map((ac, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                  <span className={`w-4 h-4 rounded-full ${s.light} ${s.text} flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-[9px]`}>{i+1}</span>
                  <span>{ac}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* Business Rules */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Lock size={12} className="text-amber-600"/>
              <span className="text-xs font-bold uppercase tracking-wide text-amber-700">Reglas de Negocio ({story.businessRules.length})</span>
            </div>
            <ul className="space-y-1">
              {story.businessRules.map((br, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 rounded px-2 py-1.5 border border-amber-100">
                  <AlertTriangle size={10} className="flex-shrink-0 mt-0.5 text-amber-500"/>
                  <span>{br}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* Subtasks */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <GitBranch size={12} className="text-slate-400"/>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">SubTareas ({story.subtasks.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {story.subtasks.map(st => <SubtaskBadge key={st.id} st={st}/>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ObjectiveCard({ obj, epicId, index }: { obj: Objective; epicId: string; index: number }) {
  const [open, setOpen] = useState(index === 0);
  const s = EPIC_STYLE[epicId as keyof typeof EPIC_STYLE];
  const totalPts = obj.stories.reduce((a, st) => a + st.points, 0);
  return (
    <div className={`border-l-4 ${s.border} rounded-r-xl bg-white shadow-sm overflow-hidden`}>
      <button onClick={() => setOpen(!open)} className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors">
        <div className={`w-7 h-7 rounded-lg ${s.light} ${s.text} flex items-center justify-center flex-shrink-0`}>{obj.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <span className="font-mono text-xs text-slate-400">{obj.code}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${s.badge}`}>{obj.module}</span>
          </div>
          <p className="text-sm font-bold text-slate-800">{obj.title}</p>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{obj.desc}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-2">
          <span className="text-xs text-slate-400 whitespace-nowrap">{obj.stories.length} HU · {totalPts} pts</span>
          {open ? <ChevronDown size={14} className="text-slate-400"/> : <ChevronRight size={14} className="text-slate-400"/>}
        </div>
      </button>
      {open && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-2">
          {obj.stories.map(s => <StoryCard key={s.id} story={s} epicId={epicId}/>)}
        </div>
      )}
    </div>
  );
}

function EpicSection({ epic }: { epic: Epic }) {
  const [open, setOpen] = useState(false);
  const [justOpen, setJustOpen] = useState(false);
  const s = EPIC_STYLE[epic.id];
  const totalStories = epic.objectives.reduce((a, o) => a + o.stories.length, 0);
  const totalPts = epic.objectives.reduce((a, o) => a + o.stories.reduce((b, st) => b + st.points, 0), 0);
  const totalSubtasks = epic.objectives.reduce((a, o) => a + o.stories.reduce((b, st) => b + st.subtasks.length, 0), 0);

  return (
    <div className={`border-2 ${s.border} rounded-2xl overflow-hidden shadow-md`}>
      {/* Header */}
      <button onClick={() => setOpen(!open)} className={`w-full text-left ${s.bg} px-5 py-4 flex items-start gap-4`}>
        <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 text-white">{epic.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-mono text-xs text-white/60">{epic.code}</span>
            <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-semibold">ÉPICA</span>
          </div>
          <h3 className="text-white font-bold text-base leading-tight">{epic.title}</h3>
          <p className="text-white/70 text-xs mt-0.5 font-medium">{epic.subsystem}</p>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0 text-white/80 text-xs">
          {[['Obj.', epic.objectives.length], ['Historias', totalStories], ['Pts', totalPts], ['SubTareas', totalSubtasks]].map(([l,v]) => (
            <div key={l as string} className="text-center hidden sm:block">
              <p className="font-bold text-white text-base leading-none">{v}</p>
              <p className="opacity-70 mt-0.5">{l}</p>
            </div>
          ))}
          {open ? <ChevronDown size={18} className="text-white"/> : <ChevronRight size={18} className="text-white"/>}
        </div>
      </button>

      {/* Obj. General */}
      <div className={`px-5 py-3 ${s.light} border-b border-slate-100`}>
        <div className="flex items-start gap-2 mb-2">
          <Target size={13} className={`${s.text} flex-shrink-0 mt-0.5`}/>
          <div>
            <span className={`text-xs font-bold ${s.text} uppercase tracking-wide`}>Objetivo General: </span>
            <span className="text-xs text-slate-700">{epic.generalObjective}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link size={11}/> <span><span className="font-semibold">Depende de:</span> {epic.depends}</span>
        </div>
      </div>

      {/* Justification + details */}
      {open && (
        <div className="bg-slate-50 px-5 py-4 space-y-4">
          {/* Why this subsystem */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <button onClick={() => setJustOpen(!justOpen)} className="w-full text-left px-4 py-3 flex items-center gap-2 hover:bg-slate-50">
              <Star size={14} className="text-amber-500 flex-shrink-0"/>
              <span className="text-sm font-bold text-slate-700">¿Por qué este subsistema? — Justificación de diseño</span>
              {justOpen ? <ChevronDown size={13} className="ml-auto text-slate-400"/> : <ChevronRight size={13} className="ml-auto text-slate-400"/>}
            </button>
            {justOpen && (
              <div className="px-4 pb-4 border-t border-slate-100 pt-3 space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">{epic.why}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1"><Monitor size={11}/> Alcance (páginas/módulos)</p>
                    <ul className="space-y-1">{epic.scope.map((sc,i) => <li key={i} className="text-xs text-slate-500 flex items-start gap-1.5"><ArrowRight size={10} className="flex-shrink-0 mt-0.5 text-slate-300"/>{sc}</li>)}</ul>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1"><Database size={11}/> Tablas en BD</p>
                    <ul className="space-y-1">{epic.tables.map((t,i) => <li key={i} className="text-xs text-slate-500 flex items-start gap-1.5 font-mono bg-slate-50 rounded px-1.5 py-0.5"><ArrowRight size={10} className="flex-shrink-0 mt-0.5 text-slate-300"/>{t}</li>)}</ul>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-600 mb-1.5 flex items-center gap-1"><RefreshCw size={11}/> Flujo de proceso</p>
                  <div className="flex flex-wrap gap-1.5">
                    {epic.processFlow.map((step, i) => (
                      <React.Fragment key={i}>
                        <span className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-600 shadow-sm">{step}</span>
                        {i < epic.processFlow.length-1 && <ArrowRight size={12} className="text-slate-300 flex-shrink-0 self-center"/>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Objectives */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Layers size={13} className="text-slate-400"/>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Objetivos Específicos → Historias de Usuario → Criterios + SubTareas</span>
            </div>
            <div className="space-y-2">
              {epic.objectives.map((obj, i) => <ObjectiveCard key={obj.id} obj={obj} epicId={epic.id} index={i}/>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SprintCard({ sprint }: { sprint: typeof SPRINTS[0] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border ${sprint.border} rounded-2xl overflow-hidden shadow-sm`}>
      <button onClick={() => setOpen(!open)} className={`w-full text-left ${sprint.color} px-5 py-3.5 flex items-center gap-3`}>
        <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-base">{sprint.num}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold leading-tight">{sprint.title}</p>
          <p className="text-white/70 text-xs">{sprint.weeks}</p>
        </div>
        <div className="text-white/80 text-xs text-right hidden sm:block mr-3">
          <p className="font-semibold">{sprint.team.length} roles</p>
          <p className="opacity-70">{sprint.team.reduce((a,t) => a + t.tareas.length, 0)} tareas</p>
        </div>
        {open ? <ChevronDown size={16} className="text-white flex-shrink-0"/> : <ChevronRight size={16} className="text-white flex-shrink-0"/>}
      </button>

      <div className={`px-5 py-3 ${sprint.light} border-b ${sprint.border}`}>
        <p className="text-xs text-slate-600"><span className={`font-bold ${sprint.text}`}>Meta del sprint: </span>{sprint.goal}</p>
      </div>

      {open && (
        <div className="px-5 py-4 bg-white space-y-5">
          {/* Team tasks */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1.5"><UserCheck size={12}/> Tareas por rol del equipo</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {sprint.team.map((member, i) => (
                <div key={i} className="border border-slate-100 rounded-xl p-3">
                  <p className={`text-xs font-bold ${sprint.text} mb-2`}>{member.rol}</p>
                  <ul className="space-y-1.5">
                    {member.tareas.map((t, j) => (
                      <li key={j} className="flex items-start gap-1.5 text-xs text-slate-600">
                        <CheckSquare size={11} className="flex-shrink-0 mt-0.5 text-slate-300"/>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* DoD */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5"><Check size={12}/> Definition of Done</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {sprint.dod.map((d, i) => (
                <div key={i} className="flex items-start gap-2 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-2 text-xs text-emerald-800">
                  <Check size={10} className="flex-shrink-0 mt-0.5 text-emerald-500"/>
                  <span>{d}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Risks */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5"><AlertTriangle size={12} className="text-amber-500"/> Riesgos identificados</p>
            <div className="space-y-1.5">
              {sprint.risks.map((r, i) => (
                <div key={i} className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-800">
                  <AlertTriangle size={10} className="flex-shrink-0 mt-0.5 text-amber-500"/>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function JiraPlanning() {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [copied, setCopied] = useState(false);

  const totalStories = EPICS.reduce((a, e) => a + e.objectives.reduce((b, o) => b + o.stories.length, 0), 0);
  const totalPts = EPICS.reduce((a, e) => a + e.objectives.reduce((b, o) => b + o.stories.reduce((c, s) => c + s.points, 0), 0), 0);
  const totalObj = EPICS.reduce((a, e) => a + e.objectives.length, 0);
  const totalSub = EPICS.reduce((a, e) => a + e.objectives.reduce((b, o) => b + o.stories.reduce((c, s) => c + s.subtasks.length, 0), 0), 0);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id:'general',  label:'Vista General',       icon:<Layers size={14}/> },
    { id:'epicas',   label:'Épicas Detalladas',   icon:<Kanban size={14}/> },
    { id:'sprints',  label:'Plan de Sprints',     icon:<Clock size={14}/> },
    { id:'reglas',   label:'Reglas del Sistema',  icon:<Shield size={14}/> },
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* Page header */}
        <div className="mb-4 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono bg-white border border-slate-200 text-slate-500 px-2 py-0.5 rounded">TPRO</span>
              <ArrowRight size={12} className="text-slate-300"/>
              <span className="text-xs text-slate-400">Planificación Jira — TallerPro DMS</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Estructura del Proyecto en Jira</h1>
            <p className="text-sm text-slate-500 mt-0.5">Sistema de Gestión de Taller Automotriz · 4 Épicas · {totalObj} Obj. Específicos · {totalStories} Historias · {totalSub} SubTareas · {totalPts} Story Points</p>
          </div>
          <button onClick={() => { navigator.clipboard.writeText('TPRO — TallerPro DMS\n4 Épicas | 16 Obj. Específicos | ' + totalStories + ' Historias | ' + totalPts + ' pts'); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition-all flex-shrink-0">
            {copied ? <><Check size={14}/> Copiado</> : <><Copy size={14}/> Copiar resumen</>}
          </button>
        </div>

        {/* Initiative Banner */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-5 mb-5 border border-slate-600">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0"><Layers size={22} className="text-white"/></div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs bg-white/10 text-white/70 px-2 py-0.5 rounded font-mono">INICIATIVA</span>
                <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-semibold">Obj. General → Producto</span>
              </div>
              <h2 className="text-white font-bold text-base mb-1">Sistema de Gestión de Taller Automotriz (TallerPro DMS)</h2>
              <p className="text-slate-300 text-xs leading-relaxed">
                <span className="font-semibold text-white">Objetivo General:</span> Desarrollar un sistema web modular y escalable para talleres automotrices con 5 roles (Administrador, Asesor de Servicio, Jefe de Taller, Mecánico, Cliente), flujo riguroso de 9 estados en Órdenes de Trabajo con validaciones de rol en cada transición, inventario con reserva automática de stock al cotizar, facturación PDF con NIT e IVA 12% y portal de autoservicio para clientes.
              </p>
              <p className="text-slate-400 text-xs mt-2 font-mono">Stack: React · TypeScript · Tailwind CSS v4 · React Router · jsPDF · Recharts · Supabase · JWT</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label:'Épicas',            val:EPICS.length,   sub:'subsistemas',        icon:<Zap size={20}/>,        color:'bg-slate-800 text-white' },
            { label:'Obj. Específicos',  val:totalObj,       sub:'módulos cubiertos',  icon:<Target size={20}/>,     color:'bg-blue-600 text-white' },
            { label:'Historias Usuario', val:totalStories,   sub:totalPts+' story pts',icon:<BookOpen size={20}/>,   color:'bg-cyan-600 text-white' },
            { label:'SubTareas Totales', val:totalSub,       sub:'BD+Back+Front+QA',   icon:<CheckSquare size={20}/>,color:'bg-emerald-600 text-white' },
          ].map(k => (
            <div key={k.label} className={`${k.color} rounded-2xl p-4`}>
              <div className="mb-2 opacity-80">{k.icon}</div>
              <p className="text-3xl font-bold">{k.val}</p>
              <p className="text-xs font-semibold mt-0.5 opacity-90">{k.label}</p>
              <p className="text-xs opacity-60 mt-0.5">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex bg-white border border-slate-200 rounded-2xl p-1 mb-5 gap-1 shadow-sm">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all ${activeTab === t.id ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
              {t.icon} <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── TAB: General ── */}
        {activeTab === 'general' && (
          <div className="space-y-4">
            {/* Hierarchy */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Info size={15} className="text-slate-400"/>
                <h3 className="font-bold text-slate-700 text-sm">Jerarquía del proyecto en Jira</h3>
              </div>
              <div className="flex flex-wrap items-start gap-2">
                {[
                  {l:'Sistema', d:'TallerPro DMS', icon:<Layers size={14}/>, c:'bg-slate-800 text-white'},
                  {l:'Iniciativa', d:'Obj. General + Producto', icon:<Target size={14}/>, c:'bg-slate-700 text-white'},
                  {l:'Épica ×4', d:'Subsistema + Módulo', icon:<Zap size={14}/>, c:'bg-blue-700 text-white'},
                  {l:'Historia de Usuario', d:'Quién / Qué / Para qué', icon:<BookOpen size={14}/>, c:'bg-cyan-600 text-white'},
                  {l:'SubTarea', d:'BD · Back · Front · QA · APIs', icon:<CheckSquare size={14}/>, c:'bg-emerald-600 text-white'},
                ].map((lv, i, arr) => (
                  <React.Fragment key={lv.l}>
                    <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold ${lv.c}`}>
                      {lv.icon}
                      <div><p className="font-bold">{lv.l}</p><p className="opacity-70">{lv.d}</p></div>
                    </div>
                    {i < arr.length-1 && <ChevronRight size={16} className="text-slate-300 flex-shrink-0 self-center"/>}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Summary per epic */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {EPICS.map(epic => {
                const s = EPIC_STYLE[epic.id];
                const stories = epic.objectives.reduce((a,o) => a + o.stories.length, 0);
                const pts = epic.objectives.reduce((a,o) => a + o.stories.reduce((b,st) => b + st.points, 0), 0);
                const subtasks = epic.objectives.reduce((a,o) => a + o.stories.reduce((b,st) => b + st.subtasks.length, 0), 0);
                return (
                  <div key={epic.id} className={`bg-white border-2 ${s.border} rounded-2xl overflow-hidden`}>
                    <div className={`${s.bg} px-4 py-3 flex items-center gap-3`}>
                      <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center text-white flex-shrink-0">{epic.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm leading-tight">{epic.title}</p>
                        <p className="text-white/70 text-xs">{epic.code} · {epic.subsystem}</p>
                      </div>
                    </div>
                    <div className="px-4 py-3 space-y-2">
                      <p className="text-xs text-slate-600 leading-relaxed">{epic.generalObjective}</p>
                      <div className="flex gap-3 pt-1">
                        {[['Obj.', epic.objectives.length], ['HU', stories], ['Pts', pts], ['SubTareas', subtasks]].map(([l,v]) => (
                          <div key={l as string} className="text-center">
                            <p className={`font-bold ${s.text}`}>{v}</p>
                            <p className="text-xs text-slate-400">{l}</p>
                          </div>
                        ))}
                      </div>
                      <div className="pt-1">
                        <p className="text-xs font-semibold text-slate-500 mb-1">Módulos cubiertos:</p>
                        <div className="flex flex-wrap gap-1">
                          {epic.objectives.map(o => <span key={o.id} className={`text-xs px-2 py-0.5 rounded-full ${s.badge} font-medium`}>{o.module}</span>)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Subtask legend */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Tipos de SubTareas en Jira</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(SUBTASK_COLORS).map(([type, cls]) => (
                  <span key={type} className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${cls}`}>
                    {SUBTASK_ICONS[type]} {type}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: Épicas ── */}
        {activeTab === 'epicas' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-2">
              <Info size={14} className="text-blue-500 flex-shrink-0"/>
              <p className="text-xs text-slate-600">Haz clic en una épica para expandirla. Dentro, haz clic en <span className="font-semibold">¿Por qué este subsistema?</span> para ver la justificación, luego expande cada objetivo para ver las historias de usuario con sus criterios de aceptación, reglas de negocio y subtareas.</p>
            </div>
            {EPICS.map(epic => <EpicSection key={epic.id} epic={epic}/>)}
          </div>
        )}

        {/* ── TAB: Sprints ── */}
        {activeTab === 'sprints' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl px-5 py-4">
              <h3 className="font-bold text-slate-700 text-sm mb-2 flex items-center gap-2"><Clock size={14}/> Estructura del plan — 9 semanas / 5 sprints</h3>
              <div className="grid grid-cols-5 gap-2 mb-3">
                {SPRINTS.map(sp => (
                  <div key={sp.num} className={`rounded-xl ${sp.light} border ${sp.border} px-2 py-2 text-center`}>
                    <p className={`font-bold text-base ${sp.text}`}>{sp.num}</p>
                    <p className="text-xs text-slate-600 font-semibold leading-tight">{sp.title}</p>
                    <p className="text-xs text-slate-400">{sp.weeks}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500">Cada sprint tiene: tareas por rol del equipo · Definition of Done · Riesgos identificados. Haz clic para expandir.</p>
            </div>
            {SPRINTS.map(sp => <SprintCard key={sp.num} sprint={sp}/>)}
          </div>
        )}

        {/* ── TAB: Reglas ── */}
        {activeTab === 'reglas' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
              <p className="text-xs text-slate-600 flex items-center gap-2"><Info size={13} className="text-slate-400"/> Estas reglas son invariables — aplican en todos los módulos y todos los sprints. Son la base de las validaciones de backend y los criterios de aceptación.</p>
            </div>
            {SYSTEM_RULES.map((cat, i) => (
              <div key={i} className={`border rounded-2xl overflow-hidden ${cat.color}`}>
                <div className={`px-5 py-3 border-b border-inherit`}>
                  <h3 className={`font-bold text-sm ${cat.titleColor}`}>{cat.category}</h3>
                </div>
                <div className="px-5 py-4">
                  <ul className="space-y-2">
                    {cat.rules.map((rule, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-xs text-slate-700">
                        <span className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-[10px] ${cat.color} ${cat.titleColor}`}>{j+1}</span>
                        <span className="leading-relaxed">{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}

            {/* 9 States visual */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <h3 className="font-bold text-slate-700 text-sm mb-3 flex items-center gap-2"><RefreshCw size={14}/> Diagrama de transición de estados — Orden de Trabajo</h3>
              <div className="flex flex-wrap gap-2 items-center">
                {[
                  {s:'registrada',c:'bg-slate-100 text-slate-700 border-slate-300'},
                  {s:'en_diagnostico',c:'bg-blue-100 text-blue-700 border-blue-300'},
                  {s:'esperando_aprobacion',c:'bg-violet-100 text-violet-700 border-violet-300'},
                  {s:'en_reparacion',c:'bg-amber-100 text-amber-700 border-amber-300'},
                  {s:'control_calidad',c:'bg-orange-100 text-orange-700 border-orange-300'},
                  {s:'liberada',c:'bg-emerald-100 text-emerald-700 border-emerald-300'},
                  {s:'finalizada',c:'bg-green-100 text-green-700 border-green-300'},
                ].map((st, i, arr) => (
                  <React.Fragment key={st.s}>
                    <span className={`text-xs px-2.5 py-1.5 rounded-lg border font-semibold ${st.c}`}>{st.s}</span>
                    {i < arr.length-1 && <ArrowRight size={12} className="text-slate-300 flex-shrink-0"/>}
                  </React.Fragment>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  {s:'cancelada', c:'bg-red-100 text-red-700 border-red-300', note:'Desde cualquier estado activo'},
                  {s:'liquidacion_diagnostico', c:'bg-pink-100 text-pink-700 border-pink-300', note:'Desde esperando_aprobacion (cliente rechaza)'},
                ].map(st => (
                  <div key={st.s} className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg border font-semibold ${st.c}`}>
                    <span>{st.s}</span>
                    <span className="opacity-60 font-normal">({st.note})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-5 bg-white border border-slate-200 rounded-xl px-5 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-500">
            <div><span className="font-semibold text-slate-700">Proyecto Jira:</span> TPRO · Tipo Scrum · 5 sprints</div>
            <div><span className="font-semibold text-slate-700">Estimación total:</span> {totalPts} story points · ~9 semanas</div>
            <div><span className="font-semibold text-slate-700">Equipo mínimo:</span> 1 Backend · 1 Frontend · 1 QA</div>
            <div><span className="font-semibold text-slate-700">Velocidad estimada:</span> ~{Math.round(totalPts/5)} pts/sprint</div>
            <div><span className="font-semibold text-slate-700">Entregable S1:</span> Clientes, Vehículos, Citas</div>
            <div><span className="font-semibold text-slate-700">Entregable S5:</span> Sistema completo en producción</div>
          </div>
        </div>
      </div>
    </div>
  );
}
