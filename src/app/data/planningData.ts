// ─── Types ───────────────────────────────────────────────────────────────────

export type TaskType = 'BD' | 'Backend' | 'Frontend' | 'UX' | 'Tests' | 'DevOps' | 'APIs';
export type Priority = 'Alta' | 'Media' | 'Baja';
export type RelationType = 'composition' | 'association' | 'aggregation' | 'dependency';
export type FlowNodeType = 'start' | 'end' | 'process' | 'decision' | 'subprocess' | 'io';
export type EpicColor = 'blue' | 'emerald' | 'orange' | 'purple';

export interface Task {
  id: string;
  code: string;
  title: string;
  type: TaskType;
  priority: Priority;
  points: number;
  desc: string;
}

export interface Sprint {
  n: number;
  title: string;
  weeks: string;
  goal: string;
  tasks: Task[];
}

export interface FlowNode {
  type: FlowNodeType;
  label: string;
  note?: string;
  branches?: { yes: string; no: string };
}

export interface ClassAttr {
  vis: '+' | '-' | '#';
  type: string;
  name: string;
}

export interface ClassMethod {
  vis: '+' | '-' | '#';
  ret: string;
  name: string;
  params: string;
}

export interface UMLClass {
  name: string;
  stereotype?: string;
  attrs: ClassAttr[];
  methods: ClassMethod[];
}

export interface Relation {
  from: string;
  to: string;
  type: RelationType;
  label: string;
  fromMult?: string;
  toMult?: string;
}

export interface DBColumn {
  name: string;
  type: string;
  pk?: boolean;
  fk?: boolean;
  notnull?: boolean;
  unique?: boolean;
  note?: string;
}

export interface DBTable {
  name: string;
  columns: DBColumn[];
}

export interface EpicData {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  icon: string;
  colorKey: EpicColor;
  objective: string;
  rationale: string;
  sprints: Sprint[];
  flowNodes: FlowNode[];
  classes: UMLClass[];
  relations: Relation[];
  tables: DBTable[];
}

// ─── EPIC 1: Gestión de Clientes y Vehículos ─────────────────────────────────

const EPIC_1: EpicData = {
  id: 'E1', code: 'TPRO-E1',
  title: 'Gestión de Clientes y Vehículos',
  subtitle: 'Subsistema CRM — Fundación del Sistema',
  icon: '👥',
  colorKey: 'blue',
  objective: 'Registrar, mantener y consultar toda la información de clientes y sus vehículos, ofreciendo historial completo de servicios y portal de autoservicio que reduce la carga operativa del asesor.',
  rationale: 'Base del sistema. Sin clientes ni vehículos registrados, ningún otro módulo funciona. El portal del cliente reduce llamadas al taller hasta un 40%.',
  sprints: [
    {
      n: 1, title: 'Sprint 1 — Fundación y CRUD Clientes',
      weeks: 'Semanas 1–2',
      goal: 'Tener el entorno configurado y el módulo de clientes completamente funcional.',
      tasks: [
        { id: 'E1-T01', code: 'T-101', title: 'Configuración del proyecto (React+TS+Tailwind+Router)', type: 'DevOps', priority: 'Alta', points: 3, desc: 'Setup inicial, ESLint, Prettier, estructura de carpetas, CI/CD básico' },
        { id: 'E1-T02', code: 'T-102', title: 'Diseño y migración tabla clientes con índices', type: 'BD', priority: 'Alta', points: 2, desc: 'Campos: CI, NIT, nombre, email, teléfono, dirección, deletedAt. Índices CI+email' },
        { id: 'E1-T03', code: 'T-103', title: 'Endpoints CRUD clientes con validación CI único', type: 'Backend', priority: 'Alta', points: 3, desc: 'POST, GET (búsqueda paginada), PATCH, DELETE lógico (soft-delete)' },
        { id: 'E1-T04', code: 'T-104', title: 'Modal formulario registro/edición de cliente', type: 'Frontend', priority: 'Alta', points: 5, desc: 'Validaciones en tiempo real: CI único, email RFC5322, teléfono ≥7 dígitos' },
        { id: 'E1-T05', code: 'T-105', title: 'Tabla lista clientes con filtros y búsqueda', type: 'Frontend', priority: 'Alta', points: 3, desc: 'Columnas: nombre, CI, teléfono, email, estado; badge activo/inactivo' },
        { id: 'E1-T06', code: 'T-106', title: 'Soft-delete con confirmación y toggle activos', type: 'Backend', priority: 'Media', points: 2, desc: 'No eliminar si tiene OTs activas; toggle "Mostrar inactivos"' },
        { id: 'E1-T07', code: 'T-107', title: 'Tests unitarios: CI duplicado, email inválido, soft-delete', type: 'Tests', priority: 'Media', points: 2, desc: 'Cobertura ≥80% módulo clientes' },
      ],
    },
    {
      n: 2, title: 'Sprint 2 — Gestión de Vehículos e Historial',
      weeks: 'Semanas 3–4',
      goal: 'Módulo de vehículos completo con vinculación a clientes e historial consultable por vehículo.',
      tasks: [
        { id: 'E1-T08', code: 'T-108', title: 'Tabla vehiculos con FK clienteId e índice placa único', type: 'BD', priority: 'Alta', points: 2, desc: 'Campos: placa, marca, modelo, año (1950–hoy+1), color, VIN(17), km ≥0' },
        { id: 'E1-T09', code: 'T-109', title: 'CRUD completo vehículos con validación placa única', type: 'Backend', priority: 'Alta', points: 3, desc: 'Validar placa insensible a mayúsculas; una placa deleted puede reutilizarse' },
        { id: 'E1-T10', code: 'T-110', title: 'Formulario vehículo con selector cliente en cascada', type: 'Frontend', priority: 'Alta', points: 4, desc: 'Autocomplete cliente → carga sus vehículos; validación año y VIN' },
        { id: 'E1-T11', code: 'T-111', title: 'Ficha cliente con lista de sus vehículos', type: 'Frontend', priority: 'Alta', points: 3, desc: 'Vista de vehículos por cliente con estado, último servicio, km actual' },
        { id: 'E1-T12', code: 'T-112', title: 'Panel historial de servicios por vehículo (timeline)', type: 'Frontend', priority: 'Media', points: 4, desc: 'Línea de tiempo expandible: fecha, tipo servicio, mecánico, km, costo' },
        { id: 'E1-T13', code: 'T-113', title: 'Query historial OTs por vehiculoId ordenada DESC', type: 'BD', priority: 'Media', points: 2, desc: 'JOIN con ordenes_trabajo, incluye canceladas (distinción visual)' },
        { id: 'E1-T14', code: 'T-114', title: 'Tests: placa duplicada, año inválido, historial', type: 'Tests', priority: 'Baja', points: 2, desc: 'Pruebas unitarias e integración módulo vehículos' },
      ],
    },
    {
      n: 3, title: 'Sprint 3 — Portal del Cliente',
      weeks: 'Semanas 5–6',
      goal: 'Portal de autoservicio donde el cliente consulta OTs, aprueba cotizaciones y descarga facturas.',
      tasks: [
        { id: 'E1-T15', code: 'T-115', title: 'Auth pública portal: login y auto-registro cliente', type: 'Backend', priority: 'Alta', points: 4, desc: 'JWT rol=cliente, hash bcrypt, endpoint /auth/register-cliente público' },
        { id: 'E1-T16', code: 'T-116', title: 'Página portal: mis vehículos y OTs activas', type: 'Frontend', priority: 'Alta', points: 5, desc: 'Dashboard cliente con estado de vehículos y OTs activas filtradas por clienteId' },
        { id: 'E1-T17', code: 'T-117', title: 'Barra de progreso visual 5 pasos estado OT', type: 'Frontend', priority: 'Alta', points: 4, desc: 'Recibido→Diagnóstico→Reparación→Control QC→Entregado; checkmark en completados' },
        { id: 'E1-T18', code: 'T-118', title: 'Vista cotización con desglose IVA y botones aprobar/rechazar', type: 'Frontend', priority: 'Alta', points: 5, desc: 'Líneas: descripción, qty, precio, subtotal. IVA 12%, total. Campo motivo rechazo' },
        { id: 'E1-T19', code: 'T-119', title: 'Endpoints portal: aprobar/rechazar cotización', type: 'APIs', priority: 'Alta', points: 3, desc: 'Transiciones de estado, liberación stock al rechazar, notificación al asesor' },
        { id: 'E1-T20', code: 'T-120', title: 'Tests E2E: flujo aprobación y rechazo cotización', type: 'Tests', priority: 'Media', points: 3, desc: 'Cliente no ve OTs de otros; botones se deshabilitan tras decisión' },
      ],
    },
  ],
  flowNodes: [
    { type: 'start', label: 'Inicio: Asesor o Cliente' },
    { type: 'decision', label: '¿Cliente registrado en el sistema?', branches: { yes: 'Buscar y cargar ficha del cliente', no: 'Registrar nuevo cliente' } },
    { type: 'subprocess', label: 'Registrar cliente', note: 'CI, NIT opcional, nombre, email, tel, dirección' },
    { type: 'process', label: 'Validar datos del cliente', note: 'CI único, email válido RFC5322, tel ≥7 dígitos' },
    { type: 'decision', label: '¿Datos son válidos?', branches: { yes: 'Guardar cliente en BD', no: 'Mostrar errores y corregir' } },
    { type: 'process', label: 'Guardar cliente en BD (deletedAt = null)' },
    { type: 'decision', label: '¿Vehículo del cliente registrado?', branches: { yes: 'Seleccionar vehículo', no: 'Registrar nuevo vehículo' } },
    { type: 'subprocess', label: 'Registrar vehículo', note: 'Placa única, marca, modelo, año, VIN, km' },
    { type: 'process', label: 'Asociar vehículo al cliente (FK clienteId)' },
    { type: 'process', label: 'Ver historial de servicios del vehículo' },
    { type: 'io', label: 'Datos listos para agendar cita o crear OT' },
    { type: 'end', label: 'Fin — Cliente y Vehículo disponibles' },
  ],
  classes: [
    {
      name: 'Cliente', stereotype: 'entity',
      attrs: [
        { vis: '+', type: 'String', name: 'id' }, { vis: '+', type: 'String', name: 'nombre' },
        { vis: '+', type: 'String', name: 'apellido' }, { vis: '+', type: 'String', name: 'ci' },
        { vis: '+', type: 'String?', name: 'nit' }, { vis: '+', type: 'String', name: 'email' },
        { vis: '+', type: 'String', name: 'telefono' }, { vis: '+', type: 'String', name: 'direccion' },
        { vis: '-', type: 'Date', name: 'fechaRegistro' }, { vis: '-', type: 'Date?', name: 'deletedAt' },
      ],
      methods: [
        { vis: '+', ret: 'void', name: 'registrar', params: '' },
        { vis: '+', ret: 'void', name: 'actualizar', params: 'Cliente c' },
        { vis: '+', ret: 'void', name: 'desactivar', params: '' },
        { vis: '+', ret: 'List<Vehiculo>', name: 'obtenerVehiculos', params: '' },
      ],
    },
    {
      name: 'Vehiculo', stereotype: 'entity',
      attrs: [
        { vis: '+', type: 'String', name: 'id' }, { vis: '+', type: 'String', name: 'placa' },
        { vis: '+', type: 'String', name: 'marca' }, { vis: '+', type: 'String', name: 'modelo' },
        { vis: '+', type: 'int', name: 'año' }, { vis: '+', type: 'String', name: 'color' },
        { vis: '+', type: 'String?', name: 'vin' }, { vis: '+', type: 'int', name: 'kilometraje' },
        { vis: '-', type: 'Date?', name: 'deletedAt' },
      ],
      methods: [
        { vis: '+', ret: 'void', name: 'registrar', params: '' },
        { vis: '+', ret: 'void', name: 'actualizar', params: 'Vehiculo v' },
        { vis: '+', ret: 'List<HistorialServicio>', name: 'obtenerHistorial', params: '' },
        { vis: '+', ret: 'void', name: 'actualizarKilometraje', params: 'int km' },
      ],
    },
    {
      name: 'HistorialServicio', stereotype: 'entity',
      attrs: [
        { vis: '+', type: 'String', name: 'id' }, { vis: '+', type: 'Date', name: 'fecha' },
        { vis: '+', type: 'String', name: 'tipoServicio' }, { vis: '+', type: 'String', name: 'descripcion' },
        { vis: '+', type: 'float', name: 'costoTotal' }, { vis: '+', type: 'int', name: 'kilometraje' },
      ],
      methods: [
        { vis: '+', ret: 'void', name: 'registrar', params: '' },
        { vis: '+', ret: 'List<HistorialServicio>', name: 'consultar', params: 'Vehiculo v' },
      ],
    },
  ],
  relations: [
    { from: 'Cliente', to: 'Vehiculo', type: 'association', label: 'posee', fromMult: '1', toMult: '0..*' },
    { from: 'Vehiculo', to: 'HistorialServicio', type: 'composition', label: 'contiene', fromMult: '1', toMult: '0..*' },
  ],
  tables: [
    {
      name: 'clientes',
      columns: [
        { name: 'id', type: 'UUID', pk: true },
        { name: 'nombre', type: 'VARCHAR(100)', notnull: true },
        { name: 'apellido', type: 'VARCHAR(100)', notnull: true },
        { name: 'ci', type: 'VARCHAR(20)', unique: true, notnull: true },
        { name: 'nit', type: 'VARCHAR(20)', unique: true },
        { name: 'email', type: 'VARCHAR(150)', unique: true, notnull: true },
        { name: 'telefono', type: 'VARCHAR(20)', notnull: true },
        { name: 'direccion', type: 'TEXT' },
        { name: 'usuario_id', type: 'UUID', fk: true, note: '→ usuarios.id' },
        { name: 'fecha_registro', type: 'TIMESTAMP', notnull: true },
        { name: 'updated_at', type: 'TIMESTAMP' },
        { name: 'deleted_at', type: 'TIMESTAMP', note: 'Soft delete' },
      ],
    },
    {
      name: 'vehiculos',
      columns: [
        { name: 'id', type: 'UUID', pk: true },
        { name: 'cliente_id', type: 'UUID', fk: true, notnull: true, note: '→ clientes.id' },
        { name: 'placa', type: 'VARCHAR(20)', unique: true, notnull: true },
        { name: 'marca', type: 'VARCHAR(50)', notnull: true },
        { name: 'modelo', type: 'VARCHAR(50)', notnull: true },
        { name: 'anio', type: 'SMALLINT', notnull: true, note: '1950 – año+1' },
        { name: 'color', type: 'VARCHAR(30)' },
        { name: 'vin', type: 'CHAR(17)', unique: true, note: 'Opcional, 17 chars' },
        { name: 'kilometraje', type: 'INT', notnull: true },
        { name: 'deleted_at', type: 'TIMESTAMP', note: 'Soft delete' },
      ],
    },
    {
      name: 'historial_servicios',
      columns: [
        { name: 'id', type: 'UUID', pk: true },
        { name: 'vehiculo_id', type: 'UUID', fk: true, notnull: true, note: '→ vehiculos.id' },
        { name: 'orden_trabajo_id', type: 'UUID', fk: true, note: '→ ordenes_trabajo.id' },
        { name: 'fecha', type: 'DATE', notnull: true },
        { name: 'tipo_servicio', type: 'VARCHAR(100)', notnull: true },
        { name: 'descripcion', type: 'TEXT' },
        { name: 'costo_total', type: 'DECIMAL(10,2)' },
        { name: 'kilometraje', type: 'INT' },
      ],
    },
  ],
};

// ─── EPIC 2: Agendamiento de Citas e Historial ───────────────────────────────

const EPIC_2: EpicData = {
  id: 'E2', code: 'TPRO-E2',
  title: 'Agendamiento de Citas e Historial',
  subtitle: 'Subsistema de Agenda — Slots de 30 Minutos',
  icon: '📅',
  colorKey: 'emerald',
  objective: 'Programar citas con panel visual de disponibilidad usando slots de 30 minutos, gestionar confirmaciones y cancelaciones, y mantener historial completo de citas por cliente y vehículo.',
  rationale: 'El agendamiento es el punto de entrada controlado al flujo operativo. Cada consulta = 30 min. El panel visual de slots elimina errores de solapamiento y reduce el tiempo de agendar de 5 min a menos de 1 min.',
  sprints: [
    {
      n: 1, title: 'Sprint 1 — Panel de Horarios con Slots',
      weeks: 'Semanas 7–8',
      goal: 'Panel de disponibilidad semanal funcional con slots de 30 minutos, navegación por semanas y marcado de disponibilidad.',
      tasks: [
        { id: 'E2-T01', code: 'T-201', title: 'Tabla slots_horarios (fecha, hora_inicio, disponible)', type: 'BD', priority: 'Alta', points: 3, desc: 'Slots de 30 min 08:00–17:30, índice compuesto (fecha, hora_inicio, asesor_id)' },
        { id: 'E2-T02', code: 'T-202', title: 'Generador automático de slots semanales', type: 'Backend', priority: 'Alta', points: 3, desc: 'Cron/trigger que genera 20 slots/día × 6 días por semana adelantada' },
        { id: 'E2-T03', code: 'T-203', title: 'Componente PanelHorarios: grid semana×slots', type: 'Frontend', priority: 'Alta', points: 8, desc: 'Vista semanal Lun–Sáb, 08:00–17:30, colores: disponible/ocupado/pasado/hoy' },
        { id: 'E2-T04', code: 'T-204', title: 'Navegación prev/next semana con indicador "Hoy"', type: 'Frontend', priority: 'Alta', points: 3, desc: 'Resaltar día actual, columna especial, botón saltar a semana actual' },
        { id: 'E2-T05', code: 'T-205', title: 'Click en slot disponible → pre-llenar formulario cita', type: 'Frontend', priority: 'Alta', points: 3, desc: 'Fecha y hora pre-completadas al hacer click en slot; validar no es pasado' },
        { id: 'E2-T06', code: 'T-206', title: 'Tooltip en slot ocupado: datos de la cita', type: 'Frontend', priority: 'Media', points: 2, desc: 'Mostrar: cliente, vehículo, tipo servicio, estado al hover' },
        { id: 'E2-T07', code: 'T-207', title: 'Tests: solapamiento, slots pasados no clickables', type: 'Tests', priority: 'Media', points: 2, desc: 'Validación de reglas de negocio del panel de horarios' },
      ],
    },
    {
      n: 2, title: 'Sprint 2 — Flujo de Agendamiento',
      weeks: 'Semanas 9–10',
      goal: 'Flujo completo de creación, edición y cancelación de citas con notificaciones.',
      tasks: [
        { id: 'E2-T08', code: 'T-208', title: 'Endpoint POST /citas con validación solapamiento', type: 'Backend', priority: 'Alta', points: 4, desc: 'Validar: fecha no pasada, slot disponible, vehículo pertenece al cliente' },
        { id: 'E2-T09', code: 'T-209', title: 'Formulario modal agendar cita (todos los campos)', type: 'Frontend', priority: 'Alta', points: 5, desc: 'Cliente, vehículo (filtrado), tipo servicio, fecha, hora (30min slots), notas' },
        { id: 'E2-T10', code: 'T-210', title: 'Actualización de hora a intervalos de 30 min en form', type: 'Frontend', priority: 'Alta', points: 2, desc: 'Selector de hora con 20 opciones: 08:00, 08:30, ..., 17:30' },
        { id: 'E2-T11', code: 'T-211', title: 'Edición de cita: solo campos no críticos', type: 'Backend', priority: 'Media', points: 3, desc: 'Permitir cambiar notas, estado. Para cambiar hora → cancelar y reagendar' },
        { id: 'E2-T12', code: 'T-212', title: 'Cancelación con motivo y liberación de slot', type: 'Backend', priority: 'Media', points: 2, desc: 'Estado pasa a cancelada; slot se libera automáticamente' },
        { id: 'E2-T13', code: 'T-213', title: 'Notificación nueva cita al asesor y jefe de taller', type: 'APIs', priority: 'Media', points: 2, desc: 'Notificación interna + badge en menú; email opcional configurado en settings' },
        { id: 'E2-T14', code: 'T-214', title: 'Tests flujo completo: crear, editar, cancelar cita', type: 'Tests', priority: 'Media', points: 3, desc: 'E2E: flujo de agendamiento desde panel de slots hasta confirmación' },
      ],
    },
    {
      n: 3, title: 'Sprint 3 — Conversión a OT e Historial',
      weeks: 'Semanas 11–12',
      goal: 'Convertir citas en OTs con wizard de recepción y consultar historial de citas por cliente.',
      tasks: [
        { id: 'E2-T15', code: 'T-215', title: 'Wizard de recepción: inspección física del vehículo', type: 'Frontend', priority: 'Alta', points: 8, desc: '4 pasos: confirmar llegada → inspección → materiales → fotos + crear OT' },
        { id: 'E2-T16', code: 'T-216', title: 'Endpoint POST /ordenes desde citaId (pre-llenado)', type: 'Backend', priority: 'Alta', points: 3, desc: 'Datos cliente, vehículo, descripción pre-llenados; cita pasa a completada' },
        { id: 'E2-T17', code: 'T-217', title: 'Historial de citas por cliente (tabla con filtros)', type: 'Frontend', priority: 'Media', points: 3, desc: 'Filtrar por fecha, estado, tipo servicio. Ver si fue convertida a OT' },
        { id: 'E2-T18', code: 'T-218', title: 'Vista historial de citas por vehículo', type: 'Frontend', priority: 'Media', points: 3, desc: 'Timeline de citas del vehículo con links a OTs generadas' },
        { id: 'E2-T19', code: 'T-219', title: 'Métricas de ocupación: % slots usados por semana', type: 'Frontend', priority: 'Baja', points: 3, desc: 'Gráfico de ocupación semanal, horas pico, tipo servicio más común' },
        { id: 'E2-T20', code: 'T-220', title: 'Tests: wizard recepción, conversión, historial', type: 'Tests', priority: 'Media', points: 2, desc: 'Cita no se convierte dos veces; botón se deshabilita tras conversión' },
      ],
    },
  ],
  flowNodes: [
    { type: 'start', label: 'Cliente o Asesor solicita cita' },
    { type: 'process', label: 'Abrir Panel de Disponibilidad Semanal', note: 'Vista Lun–Sáb, slots 08:00–17:30 (30 min c/u)' },
    { type: 'process', label: 'Navegar a la semana deseada (prev / next)' },
    { type: 'decision', label: '¿Hay slot disponible en esa semana?', branches: { yes: 'Hacer click en slot disponible', no: 'Navegar a otra semana' } },
    { type: 'process', label: 'Click en slot → fecha y hora pre-llenados en formulario' },
    { type: 'subprocess', label: 'Completar formulario de cita', note: 'Cliente, vehículo, tipo servicio, notas' },
    { type: 'decision', label: '¿Datos completos y válidos?', branches: { yes: 'Guardar cita y bloquear slot', no: 'Mostrar errores en formulario' } },
    { type: 'process', label: 'Guardar cita en BD (estado: pendiente)' },
    { type: 'process', label: 'Slot marcado como ocupado en el panel' },
    { type: 'io', label: 'Notificación al asesor y jefe de taller' },
    { type: 'decision', label: '¿El cliente llega el día de la cita?', branches: { yes: 'Iniciar wizard de recepción', no: 'Marcar como no_asistió' } },
    { type: 'subprocess', label: 'Wizard recepción (4 pasos)', note: 'Llegada → Inspección → Materiales → Fotos' },
    { type: 'process', label: 'Crear Orden de Trabajo desde la cita' },
    { type: 'end', label: 'Fin — OT creada, cita completada' },
  ],
  classes: [
    {
      name: 'Cita', stereotype: 'entity',
      attrs: [
        { vis: '+', type: 'String', name: 'id' }, { vis: '+', type: 'Date', name: 'fecha' },
        { vis: '+', type: 'Time', name: 'horaInicio' }, { vis: '+', type: 'Time', name: 'horaFin' },
        { vis: '+', type: 'EstadoCita', name: 'estado' }, { vis: '+', type: 'String', name: 'tipoServicio' },
        { vis: '+', type: 'String', name: 'motivoIngreso' }, { vis: '+', type: 'String?', name: 'notas' },
        { vis: '+', type: 'String?', name: 'ordenId' },
      ],
      methods: [
        { vis: '+', ret: 'void', name: 'agendar', params: 'Cliente c, Vehiculo v, SlotHorario s' },
        { vis: '+', ret: 'void', name: 'confirmar', params: '' },
        { vis: '+', ret: 'void', name: 'cancelar', params: 'String motivo' },
        { vis: '+', ret: 'OrdenTrabajo', name: 'convertirAOrden', params: 'Asesor a' },
      ],
    },
    {
      name: 'SlotHorario', stereotype: 'value',
      attrs: [
        { vis: '+', type: 'String', name: 'id' }, { vis: '+', type: 'Date', name: 'fecha' },
        { vis: '+', type: 'Time', name: 'horaInicio' }, { vis: '+', type: 'Time', name: 'horaFin' },
        { vis: '+', type: 'int', name: 'duracionMin' }, { vis: '+', type: 'boolean', name: 'disponible' },
        { vis: '+', type: 'boolean', name: 'bloqueado' },
      ],
      methods: [
        { vis: '+', ret: 'void', name: 'reservar', params: '' },
        { vis: '+', ret: 'void', name: 'liberar', params: '' },
        { vis: '+', ret: 'boolean', name: 'estaDisponible', params: '' },
      ],
    },
    {
      name: 'Asesor', stereotype: 'entity',
      attrs: [
        { vis: '+', type: 'String', name: 'id' }, { vis: '+', type: 'String', name: 'nombre' },
        { vis: '+', type: 'String', name: 'email' }, { vis: '+', type: 'String', name: 'telefono' },
      ],
      methods: [
        { vis: '+', ret: 'List<Cita>', name: 'obtenerCitasDelDia', params: 'Date fecha' },
        { vis: '+', ret: 'void', name: 'bloquearSlot', params: 'SlotHorario s' },
        { vis: '+', ret: 'List<SlotHorario>', name: 'obtenerDisponibilidad', params: 'Date fecha' },
      ],
    },
  ],
  relations: [
    { from: 'Cita', to: 'SlotHorario', type: 'composition', label: 'ocupa', fromMult: '1', toMult: '1' },
    { from: 'Asesor', to: 'SlotHorario', type: 'association', label: 'gestiona', fromMult: '1', toMult: '0..*' },
    { from: 'Asesor', to: 'Cita', type: 'association', label: 'atiende', fromMult: '1', toMult: '0..*' },
  ],
  tables: [
    {
      name: 'slots_horarios',
      columns: [
        { name: 'id', type: 'UUID', pk: true },
        { name: 'asesor_id', type: 'UUID', fk: true, notnull: true, note: '→ usuarios.id' },
        { name: 'fecha', type: 'DATE', notnull: true },
        { name: 'hora_inicio', type: 'TIME', notnull: true, note: 'HH:MM (30min intervals)' },
        { name: 'hora_fin', type: 'TIME', notnull: true, note: 'hora_inicio + 30min' },
        { name: 'disponible', type: 'BOOLEAN', notnull: true, note: 'DEFAULT true' },
        { name: 'bloqueado', type: 'BOOLEAN', notnull: true, note: 'DEFAULT false' },
        { name: 'UNIQUE', type: '(asesor_id, fecha, hora_inicio)', note: 'Composite index' },
      ],
    },
    {
      name: 'citas',
      columns: [
        { name: 'id', type: 'UUID', pk: true },
        { name: 'cliente_id', type: 'UUID', fk: true, notnull: true, note: '→ clientes.id' },
        { name: 'vehiculo_id', type: 'UUID', fk: true, notnull: true, note: '→ vehiculos.id' },
        { name: 'asesor_id', type: 'UUID', fk: true, note: '→ usuarios.id' },
        { name: 'slot_id', type: 'UUID', fk: true, note: '→ slots_horarios.id' },
        { name: 'fecha', type: 'DATE', notnull: true },
        { name: 'hora_inicio', type: 'TIME', notnull: true },
        { name: 'hora_fin', type: 'TIME', notnull: true },
        { name: 'tipo_servicio', type: 'VARCHAR(100)', notnull: true },
        { name: 'motivo_ingreso', type: 'VARCHAR(100)' },
        { name: 'estado', type: 'ENUM', notnull: true, note: 'pendiente|confirmada|en_progreso|completada|cancelada' },
        { name: 'notas', type: 'TEXT' },
        { name: 'orden_id', type: 'UUID', fk: true, note: '→ ordenes_trabajo.id (nullable)' },
        { name: 'created_at', type: 'TIMESTAMP', notnull: true },
      ],
    },
    {
      name: 'tipos_servicio',
      columns: [
        { name: 'id', type: 'UUID', pk: true },
        { name: 'nombre', type: 'VARCHAR(100)', unique: true, notnull: true },
        { name: 'duracion_min', type: 'SMALLINT', notnull: true, note: 'Múltiplo de 30' },
        { name: 'descripcion', type: 'TEXT' },
        { name: 'activo', type: 'BOOLEAN', notnull: true },
      ],
    },
  ],
};

// ─── EPIC 3: Órdenes de Trabajo y Flujo Operativo ────────────────────────────

const EPIC_3: EpicData = {
  id: 'E3', code: 'TPRO-E3',
  title: 'Órdenes de Trabajo y Flujo Operativo',
  subtitle: 'Subsistema Operativo — 9 Estados de OT',
  icon: '🔧',
  colorKey: 'orange',
  objective: 'Controlar el ciclo de vida completo de cada Orden de Trabajo a través de 9 estados definidos, con validaciones de rol estrictas que garantizan que nadie pueda saltar etapas o actuar fuera de su competencia.',
  rationale: 'Las OTs son el corazón del negocio. Cada transición de estado debe validar el rol del usuario. El panel Kanban da visibilidad en tiempo real al jefe de taller sobre carga de trabajo y cuellos de botella.',
  sprints: [
    {
      n: 1, title: 'Sprint 1 — Creación y Asignación de OTs',
      weeks: 'Semanas 13–14',
      goal: 'Módulo de creación de OTs con número correlativo, asignación de mecánico y vista Kanban.',
      tasks: [
        { id: 'E3-T01', code: 'T-301', title: 'Tabla ordenes_trabajo con secuencia OT-YYYY-XXXX', type: 'BD', priority: 'Alta', points: 3, desc: 'Número OT nunca se repite ni se edita. Registro de 9 estados posibles' },
        { id: 'E3-T02', code: 'T-302', title: 'Endpoint POST /ordenes (solo rol=asesor)', type: 'Backend', priority: 'Alta', points: 4, desc: 'Validar km ingreso ≥ km último servicio; estado inicial = registrada' },
        { id: 'E3-T03', code: 'T-303', title: 'Formulario nueva OT con selector cliente→vehículo', type: 'Frontend', priority: 'Alta', points: 5, desc: 'Selector en cascada; descripción problema; km ingreso; fecha entrega estimada' },
        { id: 'E3-T04', code: 'T-304', title: 'Endpoint PATCH /ordenes/:id/asignar-mecanico', type: 'Backend', priority: 'Alta', points: 2, desc: 'Solo rol=jefe_taller; selector muestra carga actual del mecánico' },
        { id: 'E3-T05', code: 'T-305', title: 'Vista Kanban OTs por estado (columnas)', type: 'Frontend', priority: 'Alta', points: 6, desc: '9 columnas de estado, drag-and-drop con validación de transiciones permitidas' },
        { id: 'E3-T06', code: 'T-306', title: 'Notificación nueva OT sin asignar al jefe de taller', type: 'APIs', priority: 'Media', points: 2, desc: 'Badge en menú lateral + notificación interna' },
        { id: 'E3-T07', code: 'T-307', title: 'Tests: roles inválidos bloqueados, número único', type: 'Tests', priority: 'Media', points: 2, desc: 'Validar que mecánico no puede crear OTs, asesor no puede asignar mecánico' },
      ],
    },
    {
      n: 2, title: 'Sprint 2 — Diagnóstico y Cotización',
      weeks: 'Semanas 15–16',
      goal: 'Registro de diagnóstico por mecánico, generación de cotización con IVA y reserva automática de stock.',
      tasks: [
        { id: 'E3-T08', code: 'T-308', title: 'Tabla diagnosticos con FK orden_id', type: 'BD', priority: 'Alta', points: 2, desc: 'hallazgos (text), fotos (json array), repuestos_sugeridos; bloqueable' },
        { id: 'E3-T09', code: 'T-309', title: 'Formulario diagnóstico (solo mecánico asignado)', type: 'Frontend', priority: 'Alta', points: 5, desc: 'Texto mínimo 20 chars, adjuntar fotos, lista repuestos sugeridos; OT → en_diagnostico' },
        { id: 'E3-T10', code: 'T-310', title: 'Endpoint generación cotización con IVA 12%', type: 'Backend', priority: 'Alta', points: 5, desc: 'Líneas: mano_obra, repuesto, diagnóstico. Reserva stock auto al cotizar' },
        { id: 'E3-T11', code: 'T-311', title: 'Modal cotización: agregar/editar líneas', type: 'Frontend', priority: 'Alta', points: 5, desc: 'Agregar líneas, calcular subtotal+IVA+total en tiempo real; enviar al cliente' },
        { id: 'E3-T12', code: 'T-312', title: 'Tabla cotizaciones + lineas_cotizacion', type: 'BD', priority: 'Alta', points: 2, desc: 'FK orden_id, estado (pendiente|enviada|aprobada|rechazada), timestamps' },
        { id: 'E3-T13', code: 'T-313', title: 'Liberación automática de stock al rechazar', type: 'Backend', priority: 'Media', points: 2, desc: 'Trigger: si cotización rechazada → devolver stock reservado' },
        { id: 'E3-T14', code: 'T-314', title: 'Tests: cotización, aprobación, rechazo con stock', type: 'Tests', priority: 'Media', points: 3, desc: 'Flujo completo cotización → aprobación → stock confirmado' },
      ],
    },
    {
      n: 3, title: 'Sprint 3 — Control de Calidad y Entrega',
      weeks: 'Semanas 17–18',
      goal: 'Proceso completo de control de calidad por jefe de taller y entrega formal del vehículo al cliente.',
      tasks: [
        { id: 'E3-T15', code: 'T-315', title: 'Panel QC para jefe de taller', type: 'Frontend', priority: 'Alta', points: 5, desc: 'Lista OTs en control_calidad; aprobar (→ liberada) o rechazar (→ en_reparacion + motivo)' },
        { id: 'E3-T16', code: 'T-316', title: 'Endpoint transición estado QC con validación rol', type: 'Backend', priority: 'Alta', points: 3, desc: 'Solo jefe_taller puede hacer QC; guardar resultado con comentario y timestamp' },
        { id: 'E3-T17', code: 'T-317', title: 'Flujo entrega: registro firma + fotos salida', type: 'Frontend', priority: 'Alta', points: 4, desc: 'Asesor registra entrega con km salida, condición vehículo, firma digital cliente' },
        { id: 'E3-T18', code: 'T-318', title: 'Endpoint registro entrega → OT finalizada + factura borrador', type: 'Backend', priority: 'Alta', points: 3, desc: 'Estado pasa a finalizada; se genera factura borrador automáticamente' },
        { id: 'E3-T19', code: 'T-319', title: 'Historial de cambios de estado por OT (audit log)', type: 'BD', priority: 'Media', points: 2, desc: 'Tabla estados_ot_historial: quien cambió, a qué estado, cuándo, comentario' },
        { id: 'E3-T20', code: 'T-320', title: 'Notificaciones push: QC rechazado, vehículo listo', type: 'APIs', priority: 'Media', points: 2, desc: 'Mecánico recibe QC rechazado; cliente recibe vehículo listo' },
        { id: 'E3-T21', code: 'T-321', title: 'Tests E2E: ciclo completo OT desde cita hasta entrega', type: 'Tests', priority: 'Media', points: 3, desc: 'Ciclo completo: cita → OT → diagnóstico → cotización → reparación → QC → entrega' },
      ],
    },
  ],
  flowNodes: [
    { type: 'start', label: 'Cita confirmada / Solicitud directa' },
    { type: 'subprocess', label: 'Asesor crea OT', note: 'Estado: REGISTRADA · Nº OT-YYYY-XXXX auto' },
    { type: 'process', label: 'Jefe de Taller asigna mecánico disponible' },
    { type: 'subprocess', label: 'Mecánico inicia diagnóstico', note: 'Estado: EN_DIAGNÓSTICO' },
    { type: 'process', label: 'Mecánico registra hallazgos + repuestos necesarios' },
    { type: 'subprocess', label: 'Asesor genera cotización', note: 'IVA 12% · Estado: ESPERANDO_APROBACIÓN' },
    { type: 'decision', label: '¿Cliente aprueba la cotización?', branches: { yes: 'Iniciar reparación (EN_REPARACIÓN)', no: 'Liquidar diagnóstico' } },
    { type: 'process', label: 'Mecánico ejecuta reparación y consume repuestos' },
    { type: 'subprocess', label: 'Mecánico marca trabajo terminado', note: 'Estado: CONTROL_CALIDAD' },
    { type: 'decision', label: '¿Jefe de Taller aprueba el QC?', branches: { yes: 'Liberar vehículo (LIBERADA)', no: 'Regresar a reparación + motivo' } },
    { type: 'subprocess', label: 'Asesor registra entrega al cliente', note: 'Estado: FINALIZADA' },
    { type: 'process', label: 'Generar factura borrador automáticamente' },
    { type: 'end', label: 'Fin — Vehículo entregado, OT cerrada' },
  ],
  classes: [
    {
      name: 'OrdenTrabajo', stereotype: 'aggregate',
      attrs: [
        { vis: '+', type: 'String', name: 'id' }, { vis: '+', type: 'String', name: 'numero' },
        { vis: '+', type: 'EstadoOT', name: 'estado' }, { vis: '+', type: 'String', name: 'descripcionProblema' },
        { vis: '+', type: 'int', name: 'kmIngreso' }, { vis: '+', type: 'Date?', name: 'fechaEntregaEst' },
        { vis: '+', type: 'Date?', name: 'fechaInicio' }, { vis: '+', type: 'Date?', name: 'fechaCierre' },
      ],
      methods: [
        { vis: '+', ret: 'void', name: 'crear', params: 'Asesor a, Cliente c, Vehiculo v' },
        { vis: '+', ret: 'void', name: 'asignarMecanico', params: 'Mecanico m' },
        { vis: '+', ret: 'void', name: 'cambiarEstado', params: 'EstadoOT nuevo, String motivo' },
        { vis: '+', ret: 'Cotizacion', name: 'generarCotizacion', params: 'Asesor a' },
      ],
    },
    {
      name: 'Diagnostico', stereotype: 'entity',
      attrs: [
        { vis: '+', type: 'String', name: 'id' }, { vis: '+', type: 'String', name: 'hallazgos' },
        { vis: '+', type: 'List<String>', name: 'fotos' }, { vis: '+', type: 'Date', name: 'fecha' },
        { vis: '+', type: 'boolean', name: 'bloqueado' },
      ],
      methods: [
        { vis: '+', ret: 'void', name: 'registrar', params: 'Mecanico m' },
        { vis: '+', ret: 'void', name: 'actualizar', params: 'Diagnostico d' },
        { vis: '+', ret: 'void', name: 'bloquear', params: '' },
      ],
    },
    {
      name: 'DetalleRepuesto', stereotype: 'entity',
      attrs: [
        { vis: '+', type: 'String', name: 'id' }, { vis: '+', type: 'int', name: 'cantidad' },
        { vis: '+', type: 'float', name: 'precioUnitario' }, { vis: '+', type: 'float', name: 'subtotal' },
        { vis: '+', type: 'boolean', name: 'consumido' },
      ],
      methods: [
        { vis: '+', ret: 'void', name: 'agregar', params: 'Repuesto r, int cantidad' },
        { vis: '+', ret: 'void', name: 'confirmarConsumo', params: '' },
        { vis: '+', ret: 'float', name: 'calcularSubtotal', params: '' },
      ],
    },
    {
      name: 'Mecanico', stereotype: 'entity',
      attrs: [
        { vis: '+', type: 'String', name: 'id' }, { vis: '+', type: 'String', name: 'nombre' },
        { vis: '+', type: 'String', name: 'especialidad' }, { vis: '+', type: 'boolean', name: 'disponible' },
      ],
      methods: [
        { vis: '+', ret: 'List<OrdenTrabajo>', name: 'obtenerOTsAsignadas', params: '' },
        { vis: '+', ret: 'int', name: 'getCargaTrabajo', params: '' },
      ],
    },
  ],
  relations: [
    { from: 'OrdenTrabajo', to: 'Diagnostico', type: 'composition', label: 'contiene', fromMult: '1', toMult: '1' },
    { from: 'OrdenTrabajo', to: 'DetalleRepuesto', type: 'composition', label: 'incluye', fromMult: '1', toMult: '0..*' },
    { from: 'OrdenTrabajo', to: 'Mecanico', type: 'association', label: 'asignada_a', fromMult: '0..*', toMult: '1' },
  ],
  tables: [
    {
      name: 'ordenes_trabajo',
      columns: [
        { name: 'id', type: 'UUID', pk: true },
        { name: 'numero', type: 'VARCHAR(15)', unique: true, notnull: true, note: 'OT-YYYY-XXXX (secuencia)' },
        { name: 'cliente_id', type: 'UUID', fk: true, notnull: true },
        { name: 'vehiculo_id', type: 'UUID', fk: true, notnull: true },
        { name: 'asesor_id', type: 'UUID', fk: true, notnull: true },
        { name: 'mecanico_id', type: 'UUID', fk: true, note: 'Asignado por jefe' },
        { name: 'cita_origen_id', type: 'UUID', fk: true, note: '→ citas.id (nullable)' },
        { name: 'estado', type: 'ENUM', notnull: true, note: '9 estados' },
        { name: 'descripcion_problema', type: 'TEXT', notnull: true },
        { name: 'km_ingreso', type: 'INT', notnull: true },
        { name: 'km_salida', type: 'INT' },
        { name: 'fecha_entrega_estimada', type: 'DATE' },
        { name: 'fecha_inicio', type: 'TIMESTAMP' },
        { name: 'fecha_cierre', type: 'TIMESTAMP' },
      ],
    },
    {
      name: 'diagnosticos',
      columns: [
        { name: 'id', type: 'UUID', pk: true },
        { name: 'orden_id', type: 'UUID', fk: true, notnull: true, unique: true },
        { name: 'mecanico_id', type: 'UUID', fk: true, notnull: true },
        { name: 'hallazgos', type: 'TEXT', notnull: true, note: 'min 20 chars' },
        { name: 'fotos', type: 'JSON', note: 'Array de URLs/base64' },
        { name: 'bloqueado', type: 'BOOLEAN', notnull: true },
        { name: 'created_at', type: 'TIMESTAMP', notnull: true },
      ],
    },
    {
      name: 'detalle_repuestos',
      columns: [
        { name: 'id', type: 'UUID', pk: true },
        { name: 'orden_id', type: 'UUID', fk: true, notnull: true, note: '→ ordenes_trabajo.id' },
        { name: 'repuesto_id', type: 'UUID', fk: true, notnull: true, note: '→ repuestos.id' },
        { name: 'cantidad', type: 'INT', notnull: true },
        { name: 'precio_unitario', type: 'DECIMAL(10,2)', notnull: true },
        { name: 'subtotal', type: 'DECIMAL(10,2)', notnull: true },
        { name: 'consumido', type: 'BOOLEAN', notnull: true },
      ],
    },
    {
      name: 'estados_ot_historial',
      columns: [
        { name: 'id', type: 'UUID', pk: true },
        { name: 'orden_id', type: 'UUID', fk: true, notnull: true },
        { name: 'estado_anterior', type: 'VARCHAR(50)' },
        { name: 'estado_nuevo', type: 'VARCHAR(50)', notnull: true },
        { name: 'usuario_id', type: 'UUID', fk: true, notnull: true },
        { name: 'comentario', type: 'TEXT' },
        { name: 'timestamp', type: 'TIMESTAMP', notnull: true },
      ],
    },
  ],
};

// ─── EPIC 4: Diagnóstico, Repuestos, Inventario y Facturación ─────────────────

const EPIC_4: EpicData = {
  id: 'E4', code: 'TPRO-E4',
  title: 'Repuestos, Inventario y Facturación',
  subtitle: 'Subsistema Financiero — Inventario + IVA + Pagos',
  icon: '💰',
  colorKey: 'purple',
  objective: 'Gestionar el catálogo de repuestos con control de stock, integrar repuestos a las órdenes de trabajo, generar facturas con IVA 12% y procesar pagos con trazabilidad financiera completa.',
  rationale: 'Sin control de inventario se pierden repuestos y margen. La facturación automática desde la OT elimina errores manuales. Los reportes financieros permiten al administrador tomar decisiones basadas en datos.',
  sprints: [
    {
      n: 1, title: 'Sprint 1 — Catálogo e Inventario',
      weeks: 'Semanas 19–20',
      goal: 'Catálogo de repuestos funcional con control de stock, alertas de mínimos y movimientos de inventario.',
      tasks: [
        { id: 'E4-T01', code: 'T-401', title: 'Tablas repuestos + inventario_movimientos', type: 'BD', priority: 'Alta', points: 3, desc: 'código único, nombre, descripción, precio_costo, precio_venta, stock, stock_minimo, categoría' },
        { id: 'E4-T02', code: 'T-402', title: 'CRUD repuestos (admin+mecánico)', type: 'Backend', priority: 'Alta', points: 3, desc: 'POST, GET (búsqueda por código/nombre), PATCH, soft-delete' },
        { id: 'E4-T03', code: 'T-403', title: 'Tabla lista repuestos con buscador y filtros', type: 'Frontend', priority: 'Alta', points: 4, desc: 'Columnas: código, nombre, categoría, stock, precio_venta, badge stock bajo' },
        { id: 'E4-T04', code: 'T-404', title: 'Registro de movimientos de inventario (entrada/salida)', type: 'Backend', priority: 'Alta', points: 3, desc: 'Cada compra/consumo registra movimiento con usuario y timestamp' },
        { id: 'E4-T05', code: 'T-405', title: 'Alerta automática cuando stock ≤ stock_minimo', type: 'APIs', priority: 'Media', points: 2, desc: 'Notificación interna al administrador y al mecánico' },
        { id: 'E4-T06', code: 'T-406', title: 'Ajuste manual de inventario con justificación', type: 'Frontend', priority: 'Media', points: 3, desc: 'Modal: tipo (ajuste/devolución/pérdida), cantidad, motivo obligatorio' },
        { id: 'E4-T07', code: 'T-407', title: 'Tests: stock negativo bloqueado, alertas disparadas', type: 'Tests', priority: 'Media', points: 2, desc: 'Validar que no se puede consumir más stock del disponible' },
      ],
    },
    {
      n: 2, title: 'Sprint 2 — Repuestos en OT e Inventario',
      weeks: 'Semanas 21–22',
      goal: 'Integración completa de repuestos en OTs: reserva, consumo definitivo y actualización automática de stock.',
      tasks: [
        { id: 'E4-T08', code: 'T-408', title: 'Búsqueda y selección de repuestos desde OT', type: 'Frontend', priority: 'Alta', points: 4, desc: 'Buscar por código/nombre, ver stock disponible, agregar con cantidad' },
        { id: 'E4-T09', code: 'T-409', title: 'Reserva de stock al generar cotización', type: 'Backend', priority: 'Alta', points: 4, desc: 'Stock disponible decrece al cotizar; liberación si cotización rechazada' },
        { id: 'E4-T10', code: 'T-410', title: 'Consumo definitivo de stock al aprobar OT', type: 'Backend', priority: 'Alta', points: 3, desc: 'Tras aprobación de cotización: stock_reservado → stock_consumido' },
        { id: 'E4-T11', code: 'T-411', title: 'Agregado de repuestos adicionales durante reparación', type: 'Frontend', priority: 'Media', points: 3, desc: 'Mecánico puede agregar más repuestos con nueva reserva de stock' },
        { id: 'E4-T12', code: 'T-412', title: 'Vista de repuestos usados por OT con costos', type: 'Frontend', priority: 'Media', points: 2, desc: 'Lista de repuestos: código, nombre, cantidad, precio_unit, subtotal' },
        { id: 'E4-T13', code: 'T-413', title: 'Tests: reserva, consumo, liberación de stock', type: 'Tests', priority: 'Media', points: 3, desc: 'Flujo: agregar repuesto → reservar → aprobar → consumir' },
      ],
    },
    {
      n: 3, title: 'Sprint 3 — Facturación y Reportes',
      weeks: 'Semanas 23–24',
      goal: 'Generación de facturas con IVA, proceso de pago y reportes financieros para el administrador.',
      tasks: [
        { id: 'E4-T14', code: 'T-414', title: 'Tabla facturas + lineas_factura + pagos', type: 'BD', priority: 'Alta', points: 3, desc: 'FK orden_id, subtotal, iva(12%), total, estado (borrador|emitida|pagada|anulada)' },
        { id: 'E4-T15', code: 'T-415', title: 'Generación automática factura borrador al finalizar OT', type: 'Backend', priority: 'Alta', points: 4, desc: 'Líneas copiadas de cotización aprobada; calcular subtotal+IVA+total' },
        { id: 'E4-T16', code: 'T-416', title: 'Vista factura con layout profesional para imprimir/PDF', type: 'Frontend', priority: 'Alta', points: 5, desc: 'Logo taller, datos cliente/vehículo, tabla líneas, totales, QR opcional' },
        { id: 'E4-T17', code: 'T-417', title: 'Proceso de pago (efectivo/tarjeta/transferencia)', type: 'Frontend', priority: 'Alta', points: 4, desc: 'Seleccionar método, ingresar referencia, registrar pago; factura → pagada' },
        { id: 'E4-T18', code: 'T-418', title: 'Dashboard financiero: ingresos, OTs, repuestos más usados', type: 'Frontend', priority: 'Media', points: 5, desc: 'Gráficos: ingresos por mes, OTs por estado, top 10 repuestos, ganancia neta' },
        { id: 'E4-T19', code: 'T-419', title: 'Exportar reportes a CSV/Excel', type: 'Backend', priority: 'Baja', points: 3, desc: 'Reportes: facturación mensual, inventario actual, movimientos de stock' },
        { id: 'E4-T20', code: 'T-420', title: 'Tests: factura auto-generada, pago registrado, saldo correcto', type: 'Tests', priority: 'Media', points: 2, desc: 'Validar IVA 12% correcto, totales cuadran, pago múltiple bloqueado' },
      ],
    },
  ],
  flowNodes: [
    { type: 'start', label: 'OT en estado EN_REPARACIÓN' },
    { type: 'decision', label: '¿Requiere repuestos para la reparación?', branches: { yes: 'Buscar repuesto en catálogo', no: 'Registrar solo mano de obra' } },
    { type: 'process', label: 'Buscar repuesto por código o nombre' },
    { type: 'decision', label: '¿Stock disponible suficiente?', branches: { yes: 'Reservar stock (cantidad − reserva)', no: 'Solicitar compra urgente a proveedor' } },
    { type: 'process', label: 'Reservar stock y agregar a la OT' },
    { type: 'process', label: 'Registrar mano de obra y tiempo invertido' },
    { type: 'process', label: 'Mecánico completa trabajo → estado CONTROL_CALIDAD' },
    { type: 'subprocess', label: 'Jefe aprueba QC → estado LIBERADA' },
    { type: 'subprocess', label: 'Asesor registra entrega → estado FINALIZADA' },
    { type: 'process', label: 'Sistema genera factura borrador (cotización aprobada)' },
    { type: 'process', label: 'Calcular subtotal + IVA 12% + total final' },
    { type: 'subprocess', label: 'Registrar pago del cliente', note: 'Efectivo / Tarjeta / Transferencia' },
    { type: 'decision', label: '¿Pago cubre el total?', branches: { yes: 'Factura → PAGADA, stock consumido definitivo', no: 'Registrar pago parcial, saldo pendiente' } },
    { type: 'io', label: 'Generar comprobante / PDF de factura' },
    { type: 'end', label: 'Fin — OT cerrada, factura pagada' },
  ],
  classes: [
    {
      name: 'Factura', stereotype: 'aggregate',
      attrs: [
        { vis: '+', type: 'String', name: 'id' }, { vis: '+', type: 'String', name: 'numero' },
        { vis: '+', type: 'float', name: 'subtotal' }, { vis: '+', type: 'float', name: 'iva' },
        { vis: '+', type: 'float', name: 'total' }, { vis: '+', type: 'EstadoFactura', name: 'estado' },
        { vis: '+', type: 'Date', name: 'fechaEmision' },
      ],
      methods: [
        { vis: '+', ret: 'void', name: 'generarDesdeOT', params: 'OrdenTrabajo ot' },
        { vis: '+', ret: 'void', name: 'emitir', params: '' },
        { vis: '+', ret: 'void', name: 'anular', params: 'String motivo' },
        { vis: '+', ret: 'float', name: 'calcularTotal', params: '' },
      ],
    },
    {
      name: 'LineaFactura', stereotype: 'entity',
      attrs: [
        { vis: '+', type: 'String', name: 'id' }, { vis: '+', type: 'TipoLinea', name: 'tipo' },
        { vis: '+', type: 'String', name: 'descripcion' }, { vis: '+', type: 'int', name: 'cantidad' },
        { vis: '+', type: 'float', name: 'precioUnitario' }, { vis: '+', type: 'float', name: 'subtotal' },
      ],
      methods: [
        { vis: '+', ret: 'void', name: 'agregar', params: '' },
        { vis: '+', ret: 'float', name: 'calcularSubtotal', params: '' },
      ],
    },
    {
      name: 'Repuesto', stereotype: 'entity',
      attrs: [
        { vis: '+', type: 'String', name: 'id' }, { vis: '+', type: 'String', name: 'codigo' },
        { vis: '+', type: 'String', name: 'nombre' }, { vis: '+', type: 'String', name: 'categoria' },
        { vis: '+', type: 'float', name: 'precioCosto' }, { vis: '+', type: 'float', name: 'precioVenta' },
        { vis: '+', type: 'int', name: 'stock' }, { vis: '+', type: 'int', name: 'stockMinimo' },
      ],
      methods: [
        { vis: '+', ret: 'boolean', name: 'hayStock', params: 'int cantidad' },
        { vis: '+', ret: 'void', name: 'reservar', params: 'int cantidad' },
        { vis: '+', ret: 'void', name: 'consumir', params: 'int cantidad' },
        { vis: '+', ret: 'void', name: 'reponer', params: 'int cantidad' },
      ],
    },
    {
      name: 'Pago', stereotype: 'entity',
      attrs: [
        { vis: '+', type: 'String', name: 'id' }, { vis: '+', type: 'float', name: 'monto' },
        { vis: '+', type: 'MetodoPago', name: 'metodoPago' }, { vis: '+', type: 'Date', name: 'fecha' },
        { vis: '+', type: 'String?', name: 'referencia' },
      ],
      methods: [
        { vis: '+', ret: 'void', name: 'registrar', params: 'Factura f' },
        { vis: '+', ret: 'boolean', name: 'esCompleto', params: '' },
      ],
    },
  ],
  relations: [
    { from: 'Factura', to: 'LineaFactura', type: 'composition', label: 'detalla', fromMult: '1', toMult: '1..*' },
    { from: 'Factura', to: 'Pago', type: 'association', label: 'pagada_con', fromMult: '1', toMult: '1..*' },
    { from: 'LineaFactura', to: 'Repuesto', type: 'dependency', label: 'referencia', fromMult: '0..*', toMult: '1' },
  ],
  tables: [
    {
      name: 'repuestos',
      columns: [
        { name: 'id', type: 'UUID', pk: true },
        { name: 'codigo', type: 'VARCHAR(30)', unique: true, notnull: true },
        { name: 'nombre', type: 'VARCHAR(150)', notnull: true },
        { name: 'descripcion', type: 'TEXT' },
        { name: 'categoria', type: 'VARCHAR(80)' },
        { name: 'precio_costo', type: 'DECIMAL(10,2)', notnull: true },
        { name: 'precio_venta', type: 'DECIMAL(10,2)', notnull: true },
        { name: 'stock', type: 'INT', notnull: true },
        { name: 'stock_reservado', type: 'INT', notnull: true, note: 'DEFAULT 0' },
        { name: 'stock_minimo', type: 'INT', notnull: true },
        { name: 'proveedor_id', type: 'UUID', fk: true, note: '→ proveedores.id' },
        { name: 'deleted_at', type: 'TIMESTAMP' },
      ],
    },
    {
      name: 'facturas',
      columns: [
        { name: 'id', type: 'UUID', pk: true },
        { name: 'numero', type: 'VARCHAR(20)', unique: true, notnull: true, note: 'FAC-YYYY-XXXX' },
        { name: 'orden_id', type: 'UUID', fk: true, notnull: true, unique: true },
        { name: 'cliente_id', type: 'UUID', fk: true, notnull: true },
        { name: 'subtotal', type: 'DECIMAL(10,2)', notnull: true },
        { name: 'iva', type: 'DECIMAL(10,2)', notnull: true, note: '12%' },
        { name: 'total', type: 'DECIMAL(10,2)', notnull: true },
        { name: 'estado', type: 'ENUM', notnull: true, note: 'borrador|emitida|pagada|anulada' },
        { name: 'fecha_emision', type: 'TIMESTAMP' },
        { name: 'created_at', type: 'TIMESTAMP', notnull: true },
      ],
    },
    {
      name: 'lineas_factura',
      columns: [
        { name: 'id', type: 'UUID', pk: true },
        { name: 'factura_id', type: 'UUID', fk: true, notnull: true },
        { name: 'tipo', type: 'ENUM', notnull: true, note: 'repuesto|mano_obra|diagnostico' },
        { name: 'descripcion', type: 'VARCHAR(255)', notnull: true },
        { name: 'cantidad', type: 'INT', notnull: true },
        { name: 'precio_unitario', type: 'DECIMAL(10,2)', notnull: true },
        { name: 'subtotal', type: 'DECIMAL(10,2)', notnull: true },
        { name: 'repuesto_id', type: 'UUID', fk: true, note: 'Si tipo=repuesto' },
      ],
    },
    {
      name: 'pagos',
      columns: [
        { name: 'id', type: 'UUID', pk: true },
        { name: 'factura_id', type: 'UUID', fk: true, notnull: true },
        { name: 'monto', type: 'DECIMAL(10,2)', notnull: true },
        { name: 'metodo_pago', type: 'ENUM', notnull: true, note: 'efectivo|tarjeta|transferencia' },
        { name: 'referencia', type: 'VARCHAR(100)', note: 'Nº operación' },
        { name: 'fecha', type: 'TIMESTAMP', notnull: true },
        { name: 'registrado_por', type: 'UUID', fk: true, note: '→ usuarios.id' },
      ],
    },
  ],
};

// ─── Exported array ───────────────────────────────────────────────────────────

export const EPICS: EpicData[] = [EPIC_1, EPIC_2, EPIC_3, EPIC_4];
