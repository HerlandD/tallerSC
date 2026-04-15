import React, { useState } from 'react';
import {
  Layers, Monitor, Database, Code2, GitBranch, Globe, Cpu,
  Users, Car, ClipboardList, Package, BarChart3, Settings,
  CalendarDays, Receipt, Wrench, Shield, BookOpen, Kanban,
  ChevronRight, CheckCircle, Circle, Lock, Eye, Edit3,
  Zap, Server, Layout, FileCode, Terminal, ArrowRight,
  Box, Link, Cloud, Key, RefreshCw, LayoutDashboard
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'screens' | 'roles' | 'stack' | 'supabase' | 'flujo';

type Rol = 'administrador' | 'asesor' | 'mecanico' | 'jefe_taller' | 'cliente';

interface Screen {
  id: string;
  nombre: string;
  ruta: string;
  descripcion: string;
  icon: React.ReactNode;
  roles: Rol[];
  modulo: string;
  componentes: string[];
  color: string;
}

// ─── Datos ────────────────────────────────────────────────────────────────────
const ROL_CFG: Record<Rol, { label: string; color: string; bg: string; dot: string }> = {
  administrador: { label: 'Admin',        color: 'text-purple-700', bg: 'bg-purple-100', dot: 'bg-purple-500' },
  asesor:        { label: 'Asesor',        color: 'text-blue-700',   bg: 'bg-blue-100',   dot: 'bg-blue-500' },
  mecanico:      { label: 'Mecánico',      color: 'text-orange-700', bg: 'bg-orange-100', dot: 'bg-orange-500' },
  jefe_taller:   { label: 'Jefe Taller',   color: 'text-emerald-700',bg: 'bg-emerald-100',dot: 'bg-emerald-500' },
  cliente:       { label: 'Cliente',       color: 'text-slate-700',  bg: 'bg-slate-100',  dot: 'bg-slate-500' },
};

const TODOS_ROLES: Rol[] = ['administrador', 'asesor', 'mecanico', 'jefe_taller', 'cliente'];

const SCREENS: Screen[] = [
  {
    id: 'login',
    nombre: 'Login',
    ruta: '/login',
    descripcion: 'Autenticación de usuarios. Selección de rol, ingreso con credenciales. También permite autoregistro para clientes nuevos.',
    icon: <Lock size={18} />,
    roles: TODOS_ROLES,
    modulo: 'Auth',
    componentes: ['Formulario login', 'Selector de rol rápido', 'Modal auto-registro cliente'],
    color: 'border-slate-300 bg-slate-50',
  },
  {
    id: 'dashboard',
    nombre: 'Dashboard',
    ruta: '/',
    descripcion: 'Panel principal adaptado por rol. Cada rol ve KPIs, gráficos y acciones relevantes a su función.',
    icon: <LayoutDashboard size={18} />,
    roles: ['administrador', 'asesor', 'mecanico', 'jefe_taller'],
    modulo: 'Principal',
    componentes: ['KpiCard', 'AreaChart (ingresos)', 'PieChart (estados OT)', 'BarChart (productividad)', 'Tabla OTs recientes', 'Alertas stock bajo'],
    color: 'border-blue-300 bg-blue-50',
  },
  {
    id: 'citas',
    nombre: 'Citas',
    ruta: '/citas',
    descripcion: 'Gestión del calendario de citas. Vista mensual con filtros por estado. Creación, edición y confirmación de citas.',
    icon: <CalendarDays size={18} />,
    roles: ['asesor'],
    modulo: 'Servicio',
    componentes: ['Calendario mensual', 'Formulario nueva cita', 'Filtros por estado', 'Indicadores de color por estado'],
    color: 'border-cyan-300 bg-cyan-50',
  },
  {
    id: 'clientes',
    nombre: 'Clientes',
    ruta: '/clientes',
    descripcion: 'CRUD completo de clientes. Búsqueda por nombre/CI. Vista detalle con historial de vehículos y órdenes.',
    icon: <Users size={18} />,
    roles: ['asesor'],
    modulo: 'Servicio',
    componentes: ['Tabla de clientes', 'Buscador', 'Modal crear/editar', 'Panel detalle', 'Historial de OTs por cliente'],
    color: 'border-green-300 bg-green-50',
  },
  {
    id: 'vehiculos',
    nombre: 'Vehículos',
    ruta: '/vehiculos',
    descripcion: 'CRUD de vehículos asociados a clientes. Búsqueda por placa. Vista detalle con historial de servicios.',
    icon: <Car size={18} />,
    roles: ['asesor'],
    modulo: 'Servicio',
    componentes: ['Tarjetas de vehículos', 'Buscador por placa', 'Modal registrar vehículo', 'Historial de servicios'],
    color: 'border-teal-300 bg-teal-50',
  },
  {
    id: 'ordenes',
    nombre: 'Órdenes de Trabajo',
    ruta: '/ordenes',
    descripcion: 'Módulo central del sistema. Wizard de 3 pasos para crear OTs. Flujo completo de estados. Vista diferenciada por rol.',
    icon: <ClipboardList size={18} />,
    roles: ['administrador', 'asesor', 'mecanico', 'jefe_taller', 'cliente'],
    modulo: 'Taller',
    componentes: ['Wizard nueva OT (3 pasos)', 'Tabla filtrable', 'Modal detalle completo', 'Barra progreso estados', 'Panel cotización', 'Control calidad', 'Firma digital', 'Gestión tareas', 'Fotos recepción/diagnóstico'],
    color: 'border-indigo-300 bg-indigo-50',
  },
  {
    id: 'diagnostico',
    nombre: 'Diagnóstico',
    ruta: '/diagnostico',
    descripcion: 'Panel exclusivo del mecánico. Lista sus OTs activas, puede registrar diagnóstico, subir fotos y generar cotización.',
    icon: <Wrench size={18} />,
    roles: ['mecanico'],
    modulo: 'Taller',
    componentes: ['Lista OTs del mecánico', 'Editor de diagnóstico', 'Upload de fotos', 'Generador de cotización', 'Selector de repuestos', 'Mano de obra'],
    color: 'border-orange-300 bg-orange-50',
  },
  {
    id: 'inventario',
    nombre: 'Inventario',
    ruta: '/inventario',
    descripcion: 'Gestión de repuestos y proveedores. Stock en tiempo real, alertas de stock bajo, movimientos de kardex.',
    icon: <Package size={18} />,
    roles: ['administrador', 'mecanico'],
    modulo: 'Inventario',
    componentes: ['Tabla repuestos', 'Alertas stock bajo', 'Modal crear/editar repuesto', 'Gestión de proveedores', 'KPIs inventario', 'Historial kardex'],
    color: 'border-amber-300 bg-amber-50',
  },
  {
    id: 'portal',
    nombre: 'Portal del Cliente',
    ruta: '/portal',
    descripcion: 'Vista del cliente autenticado. Ve sus vehículos, estado de sus órdenes, cotizaciones pendientes y puede aprobar/rechazar.',
    icon: <Globe size={18} />,
    roles: ['cliente'],
    modulo: 'Portal',
    componentes: ['Tarjetas de vehículos', 'Estado en tiempo real de OTs', 'Panel de cotización', 'Botones aprobar/rechazar', 'Pago en línea simulado', 'Firma digital'],
    color: 'border-rose-300 bg-rose-50',
  },
  {
    id: 'facturas',
    nombre: 'Facturas',
    ruta: '/facturas',
    descripcion: 'Gestión de facturas. Los clientes ven sus facturas propias. Admin/Asesor ven todas. Impresión en PDF.',
    icon: <Receipt size={18} />,
    roles: ['administrador', 'asesor', 'cliente'],
    modulo: 'Facturación',
    componentes: ['Tabla de facturas', 'Vista detalle factura', 'Generador PDF (print)', 'KPIs totales'],
    color: 'border-emerald-300 bg-emerald-50',
  },
  {
    id: 'reportes',
    nombre: 'Reportes',
    ruta: '/reportes',
    descripcion: 'Reportes gerenciales y operativos. Múltiples gráficos de ingresos, productividad, inventario y auditoría.',
    icon: <BarChart3 size={18} />,
    roles: ['administrador'],
    modulo: 'Admin',
    componentes: ['AreaChart ingresos', 'BarChart mecánicos', 'PieChart estados', 'Tabla log auditoría', 'Filtros por período'],
    color: 'border-violet-300 bg-violet-50',
  },
  {
    id: 'configuracion',
    nombre: 'Configuración',
    ruta: '/configuracion',
    descripcion: 'Gestión de usuarios, personal del taller, catálogos y seguridad del sistema.',
    icon: <Settings size={18} />,
    roles: ['administrador'],
    modulo: 'Admin',
    componentes: ['CRUD usuarios', 'CRUD personal', 'Editor catálogos (marcas, servicios)', 'Cambio de contraseña', 'Log de sesiones'],
    color: 'border-slate-300 bg-slate-50',
  },
  {
    id: 'historias',
    nombre: 'Historias de Usuario',
    ruta: '/historias-usuario',
    descripcion: 'Tablero Kanban drag & drop para gestión de user stories del proyecto. Vista por épicas y lista completa.',
    icon: <Kanban size={18} />,
    roles: ['administrador'],
    modulo: 'Planning',
    componentes: ['Tablero Kanban (DnD)', 'Vista por Épicas', 'Vista Lista', 'Modal crear/editar historia', 'Estadísticas de puntos'],
    color: 'border-pink-300 bg-pink-50',
  },
  {
    id: 'jira',
    nombre: 'Planificación Épicas',
    ruta: '/jira-planning',
    descripcion: 'Vista de planificación del proyecto con épicas, sprints y objetivos del roadmap universitario.',
    icon: <BookOpen size={18} />,
    roles: ['administrador'],
    modulo: 'Planning',
    componentes: ['Lista de épicas', 'Timeline de sprints', 'Progreso por épica', 'Objetivos del proyecto'],
    color: 'border-fuchsia-300 bg-fuchsia-50',
  },
  {
    id: 'documentacion',
    nombre: 'Documentación',
    ruta: '/documentacion',
    descripcion: 'Documentación del sistema: workflow, requisitos, roles, credenciales y diseño de interfaz.',
    icon: <BookOpen size={18} />,
    roles: ['administrador'],
    modulo: 'Docs',
    componentes: ['Workflow de OT', 'Requisitos funcionales', 'Credenciales de prueba', 'Guía de roles'],
    color: 'border-gray-300 bg-gray-50',
  },
  {
    id: 'arquitectura',
    nombre: 'Arquitectura del Sistema',
    ruta: '/arquitectura',
    descripcion: 'Esta página — mapa completo del frontend, stack tecnológico, pantallas y conexión con Supabase.',
    icon: <Layers size={18} />,
    roles: ['administrador'],
    modulo: 'Docs',
    componentes: ['Overview arquitectura', 'Mapa de pantallas', 'Matriz de roles', 'Stack técnico', 'Config Supabase'],
    color: 'border-cyan-300 bg-cyan-50',
  },
];

const STACK = [
  {
    capa: 'UI / Presentación',
    color: 'bg-blue-600',
    icon: <Monitor size={18} />,
    tecnologias: [
      { nombre: 'React 18', desc: 'Librería de UI, componentes funcionales + hooks', version: '18.x' },
      { nombre: 'TypeScript', desc: 'Tipado estático estricto, interfaces y tipos', version: '5.x' },
      { nombre: 'Tailwind CSS v4', desc: 'Utility-first CSS, diseño responsivo', version: '4.x' },
      { nombre: 'Lucide React', desc: 'Librería de iconos SVG', version: 'latest' },
    ],
  },
  {
    capa: 'Estado & Routing',
    color: 'bg-purple-600',
    icon: <GitBranch size={18} />,
    tecnologias: [
      { nombre: 'React Context API', desc: 'Estado global de la aplicación (AppContext)', version: 'built-in' },
      { nombre: 'React Router v7', desc: 'Enrutamiento SPA con Data Mode', version: '7.x' },
      { nombre: 'useState / useReducer', desc: 'Estado local por componente', version: 'built-in' },
      { nombre: 'react-dnd', desc: 'Drag & drop para el tablero Kanban', version: 'latest' },
    ],
  },
  {
    capa: 'Visualización & Charts',
    color: 'bg-cyan-600',
    icon: <BarChart3 size={18} />,
    tecnologias: [
      { nombre: 'Recharts', desc: 'Gráficos: AreaChart, BarChart, PieChart, LineChart', version: '2.x' },
      { nombre: 'Sonner', desc: 'Notificaciones toast', version: 'latest' },
      { nombre: 'shadcn/ui', desc: 'Componentes base: Dialog, Select, Tabs, Badge', version: 'latest' },
    ],
  },
  {
    capa: 'Backend & Persistencia',
    color: 'bg-emerald-600',
    icon: <Database size={18} />,
    tecnologias: [
      { nombre: 'Supabase', desc: 'BaaS: PostgreSQL + Auth + Storage + Realtime', version: 'cloud' },
      { nombre: 'Hono (Deno)', desc: 'Servidor edge para rutas API custom', version: '4.x' },
      { nombre: 'KV Store', desc: 'Tabla clave-valor para persistencia inicial', version: 'custom' },
      { nombre: 'Supabase Auth', desc: 'Autenticación JWT con roles personalizados', version: 'cloud' },
    ],
  },
  {
    capa: 'Entorno & Build',
    color: 'bg-slate-600',
    icon: <Terminal size={18} />,
    tecnologias: [
      { nombre: 'Vite', desc: 'Bundler y dev server ultra-rápido', version: '5.x' },
      { nombre: 'Figma Make', desc: 'Plataforma de construcción visual con AI', version: 'cloud' },
      { nombre: 'pnpm', desc: 'Gestor de paquetes eficiente', version: '8.x' },
      { nombre: 'Deno', desc: 'Runtime para edge functions en Supabase', version: '1.x' },
    ],
  },
];

const MODULOS_SUPABASE = [
  {
    modulo: 'Base de Datos (PostgreSQL)',
    icon: <Database size={16} />,
    color: 'bg-emerald-100 border-emerald-300',
    items: [
      'Tabla kv_store_7f295475 (KV genérico)',
      'Tablas a crear: usuario, cliente, vehiculo, cita, orden_trabajo, etc.',
      'Row Level Security (RLS) por rol',
      'Triggers para fechas automáticas',
      'Patrón "Tabla por Subclase" para herencia',
    ],
  },
  {
    modulo: 'Autenticación',
    icon: <Key size={16} />,
    color: 'bg-blue-100 border-blue-300',
    items: [
      'Supabase Auth con JWT',
      'Creación de usuario con email_confirm: true',
      'Session persistence entre recargas',
      'Roles mapeados a user_metadata',
      '5 roles: administrador, asesor, mecanico, jefe_taller, cliente',
    ],
  },
  {
    modulo: 'Edge Functions (Hono)',
    icon: <Server size={16} />,
    color: 'bg-purple-100 border-purple-300',
    items: [
      'Servidor: /supabase/functions/server/index.tsx',
      'CORS habilitado para todos los orígenes',
      'Ruta health: GET /make-server-7f295475/health',
      'Listo para agregar rutas CRUD de cada entidad',
      'Protección con Bearer token en rutas privadas',
    ],
  },
  {
    modulo: 'Storage',
    icon: <Cloud size={16} />,
    color: 'bg-cyan-100 border-cyan-300',
    items: [
      'Buckets privados prefijados: make-7f295475',
      'Para fotos de recepción, diagnóstico, reparación',
      'Firmas digitales en base64',
      'PDF de facturas',
      'Signed URLs para acceso temporal',
    ],
  },
];

// ─── Components ───────────────────────────────────────────────────────────────

function RolBadge({ rol }: { rol: Rol }) {
  const c = ROL_CFG[rol];
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${c.bg} ${c.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function TabBtn({ id, label, icon, active, onClick }: {
  id: Tab; label: string; icon: React.ReactNode; active: boolean; onClick: (id: Tab) => void;
}) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
        active
          ? 'bg-slate-800 text-white shadow-sm'
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ─── Tab: Overview ────────────────────────────────────────────────────────────
function TabOverview() {
  return (
    <div className="space-y-6">
      {/* Arquitectura 3 capas */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2">
          <Layers size={18} className="text-cyan-600" />
          Arquitectura de 3 Capas
        </h3>
        <div className="space-y-3">
          {[
            {
              num: 1, label: 'Capa de Presentación', color: 'bg-blue-600', detail: 'React 18 + TypeScript + Tailwind CSS v4',
              sub: 'Componentes funcionales, Context API, React Router v7. Toda la lógica de UI, formularios y visualización.',
              icon: <Monitor size={16} />,
            },
            {
              num: 2, label: 'Capa de Lógica (API / Edge)', color: 'bg-purple-600', detail: 'Hono Framework sobre Deno (Supabase Edge Functions)',
              sub: 'Rutas REST con validación, autenticación JWT, lógica de negocio, acceso controlado a la base de datos.',
              icon: <Server size={16} />,
            },
            {
              num: 3, label: 'Capa de Datos', color: 'bg-emerald-600', detail: 'PostgreSQL (Supabase) + Storage',
              sub: 'Base de datos relacional, RLS por rol, Storage para archivos binarios, Auth integrado con JWT.',
              icon: <Database size={16} />,
            },
          ].map(item => (
            <div key={item.num} className="flex gap-4 items-start p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
              <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center text-white font-bold flex-shrink-0`}>
                {item.num}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {item.icon}
                  <p className="font-semibold text-slate-800">{item.label}</p>
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-mono">{item.detail}</span>
                </div>
                <p className="text-sm text-slate-500">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
        {/* Arrow entre capas */}
        <div className="flex items-center gap-2 mt-4 px-4">
          <div className="text-xs text-slate-400">Frontend</div>
          <ArrowRight size={14} className="text-slate-300" />
          <div className="text-xs text-slate-400">https://[projectId].supabase.co/functions/v1/make-server-7f295475/[ruta]</div>
          <ArrowRight size={14} className="text-slate-300" />
          <div className="text-xs text-slate-400">Supabase DB</div>
        </div>
      </div>

      {/* Stats del sistema */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Pantallas / Páginas', value: '16', icon: <Monitor size={18} />, color: 'text-blue-600 bg-blue-50' },
          { label: 'Roles de Usuario', value: '5', icon: <Users size={18} />, color: 'text-purple-600 bg-purple-50' },
          { label: 'Entidades del Modelo', value: '19', icon: <Box size={18} />, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Módulos Funcionales', value: '8', icon: <Layers size={18} />, color: 'text-orange-600 bg-orange-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5 text-center">
            <div className={`w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center ${s.color}`}>{s.icon}</div>
            <p className="text-3xl font-bold text-slate-800">{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Módulos funcionales */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Layout size={18} className="text-cyan-600" />
          Módulos Funcionales del Sistema
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { nombre: 'Auth & Seguridad', icon: <Lock size={16} />, screens: ['Login'], color: 'bg-slate-100 text-slate-700' },
            { nombre: 'Gestión de Servicio', icon: <Users size={16} />, screens: ['Citas', 'Clientes', 'Vehículos'], color: 'bg-blue-100 text-blue-700' },
            { nombre: 'Órdenes de Trabajo', icon: <ClipboardList size={16} />, screens: ['OTs', 'Diagnóstico'], color: 'bg-indigo-100 text-indigo-700' },
            { nombre: 'Inventario', icon: <Package size={16} />, screens: ['Repuestos', 'Proveedores', 'Kardex'], color: 'bg-amber-100 text-amber-700' },
            { nombre: 'Facturación', icon: <Receipt size={16} />, screens: ['Facturas'], color: 'bg-emerald-100 text-emerald-700' },
            { nombre: 'Portal Cliente', icon: <Globe size={16} />, screens: ['Portal', 'Mis Facturas'], color: 'bg-rose-100 text-rose-700' },
            { nombre: 'Administración', icon: <Settings size={16} />, screens: ['Config', 'Reportes'], color: 'bg-purple-100 text-purple-700' },
            { nombre: 'Planning & Docs', icon: <BookOpen size={16} />, screens: ['Kanban', 'Épicas', 'Docs'], color: 'bg-pink-100 text-pink-700' },
          ].map(m => (
            <div key={m.nombre} className={`rounded-xl p-4 ${m.color}`}>
              <div className="flex items-center gap-2 mb-2">
                {m.icon}
                <p className="text-sm font-semibold">{m.nombre}</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {m.screens.map(s => (
                  <span key={s} className="text-xs bg-white/60 px-1.5 py-0.5 rounded-md">{s}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cómo fue creado */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-6 text-white">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <Cpu size={18} className="text-cyan-400" />
          ¿Cómo fue creado este frontend?
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              paso: '1', titulo: 'Figma Make (AI Builder)',
              desc: 'La plataforma de Figma Make genera código React/TypeScript directamente desde prompts en lenguaje natural y/o diseños de Figma importados.',
              icon: <Zap size={16} className="text-yellow-400" />,
            },
            {
              paso: '2', titulo: 'Código React generado',
              desc: 'Todo el frontend existe como archivos .tsx reales en /src/app/. Son componentes React estándar que puedes editar, exportar o integrar en cualquier proyecto.',
              icon: <FileCode size={16} className="text-blue-400" />,
            },
            {
              paso: '3', titulo: 'Conexión a Supabase',
              desc: 'Supabase está conectado mediante /utils/supabase/info.tsx (projectId + publicAnonKey) y el servidor edge en /supabase/functions/server/index.tsx.',
              icon: <Link size={16} className="text-emerald-400" />,
            },
          ].map(p => (
            <div key={p.paso} className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                {p.icon}
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-mono">Paso {p.paso}</span>
              </div>
              <p className="font-semibold mb-1">{p.titulo}</p>
              <p className="text-sm text-slate-300">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Pantallas ───────────────────────────────────────────────────────────
function TabScreens() {
  const [selected, setSelected] = useState<string | null>(null);
  const selectedScreen = SCREENS.find(s => s.id === selected);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Lista de pantallas */}
      <div className="lg:col-span-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SCREENS.map(screen => (
            <button
              key={screen.id}
              onClick={() => setSelected(selected === screen.id ? null : screen.id)}
              className={`text-left p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                selected === screen.id
                  ? 'border-slate-700 shadow-md ring-2 ring-slate-700/20'
                  : `${screen.color} hover:border-slate-300`
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-slate-700">{screen.icon}</span>
                  <p className="font-semibold text-slate-800 text-sm">{screen.nombre}</p>
                </div>
                <span className="text-xs font-mono text-slate-500 bg-white/60 px-1.5 py-0.5 rounded">
                  {screen.ruta}
                </span>
              </div>
              <p className="text-xs text-slate-600 mb-2 line-clamp-2">{screen.descripcion}</p>
              <div className="flex flex-wrap gap-1">
                {screen.roles.map(r => <RolBadge key={r} rol={r} />)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Panel detalle */}
      <div className="lg:col-span-1">
        {selectedScreen ? (
          <div className="bg-white rounded-xl border border-slate-200 p-5 sticky top-4">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-slate-700 ${selectedScreen.color}`}>
                {selectedScreen.icon}
              </div>
              <div>
                <p className="font-bold text-slate-800">{selectedScreen.nombre}</p>
                <p className="text-xs font-mono text-slate-500">{selectedScreen.ruta}</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-4">{selectedScreen.descripcion}</p>

            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Módulo</p>
              <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-medium">
                {selectedScreen.modulo}
              </span>
            </div>

            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Acceso por Rol</p>
              <div className="flex flex-wrap gap-1">
                {selectedScreen.roles.map(r => <RolBadge key={r} rol={r} />)}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Componentes Principales</p>
              <div className="space-y-1">
                {selectedScreen.componentes.map(c => (
                  <div key={c} className="flex items-center gap-2 text-xs text-slate-600">
                    <CheckCircle size={11} className="text-emerald-500 flex-shrink-0" />
                    {c}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-8 text-center sticky top-4">
            <Eye size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Selecciona una pantalla para ver su detalle</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Matriz de Roles ─────────────────────────────────────────────────────
function TabRoles() {
  const roles: Rol[] = ['administrador', 'asesor', 'jefe_taller', 'mecanico', 'cliente'];
  const screens = SCREENS.filter(s => s.id !== 'login');

  return (
    <div className="space-y-5">
      {/* Descripción de roles */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {roles.map(rol => {
          const c = ROL_CFG[rol];
          const screenCount = screens.filter(s => s.roles.includes(rol)).length;
          return (
            <div key={rol} className={`rounded-xl border p-4 ${c.bg} border-current`}>
              <div className={`flex items-center gap-2 mb-2 ${c.color}`}>
                <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
                <p className="font-bold text-sm">{c.label}</p>
              </div>
              <p className={`text-2xl font-bold ${c.color}`}>{screenCount}</p>
              <p className={`text-xs ${c.color} opacity-70`}>pantallas accesibles</p>
            </div>
          );
        })}
      </div>

      {/* Matriz */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="text-left px-4 py-3 font-semibold">Pantalla</th>
                <th className="text-left px-3 py-3 font-semibold text-xs">Módulo</th>
                {roles.map(r => (
                  <th key={r} className="px-3 py-3 text-center font-semibold text-xs whitespace-nowrap">
                    {ROL_CFG[r].label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {screens.map((screen, i) => (
                <tr key={screen.id} className={`border-b border-slate-100 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">{screen.icon}</span>
                      <span className="font-medium text-slate-800">{screen.nombre}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{screen.modulo}</span>
                  </td>
                  {roles.map(rol => {
                    const tiene = screen.roles.includes(rol);
                    return (
                      <td key={rol} className="px-3 py-2.5 text-center">
                        {tiene
                          ? <CheckCircle size={16} className="text-emerald-500 mx-auto" />
                          : <Circle size={14} className="text-slate-200 mx-auto" />
                        }
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Credenciales de acceso rápido */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Key size={16} className="text-amber-500" />
          Credenciales de Prueba
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { rol: 'administrador' as Rol, user: 'admin',     pass: 'admin123',   nombre: 'Admin Sistema' },
            { rol: 'asesor' as Rol,        user: 'asesor',    pass: 'asesor123',  nombre: 'María García' },
            { rol: 'jefe_taller' as Rol,   user: 'jefe',      pass: 'jefe123',    nombre: 'Ana Supervisora' },
            { rol: 'mecanico' as Rol,      user: 'mecanico',  pass: 'mec123',     nombre: 'Juan Pérez' },
            { rol: 'cliente' as Rol,       user: 'cliente',   pass: 'cliente123', nombre: 'Luis Torres' },
          ].map(c => {
            const rc = ROL_CFG[c.rol];
            return (
              <div key={c.rol} className={`rounded-xl p-3.5 ${rc.bg}`}>
                <p className={`text-xs font-bold mb-2 ${rc.color}`}>{rc.label}</p>
                <p className="text-xs text-slate-700 font-medium">{c.nombre}</p>
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    <span className="text-xs text-slate-500 w-8">user:</span>
                    <span className="text-xs font-mono bg-white/60 px-1 rounded">{c.user}</span>
                  </div>
                  <div className="flex gap-1">
                    <span className="text-xs text-slate-500 w-8">pass:</span>
                    <span className="text-xs font-mono bg-white/60 px-1 rounded">{c.pass}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Stack Técnico ───────────────────────────────────────────────────────
function TabStack() {
  return (
    <div className="space-y-5">
      {STACK.map(capa => (
        <div key={capa.capa} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className={`${capa.color} px-5 py-3 flex items-center gap-3`}>
            <span className="text-white">{capa.icon}</span>
            <h3 className="font-bold text-white">{capa.capa}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 divide-x-0 divide-y sm:divide-y-0">
            {capa.tecnologias.map(t => (
              <div key={t.nombre} className="p-4 border-b sm:border-b-0 sm:border-r border-slate-100 last:border-0">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="font-semibold text-slate-800">{t.nombre}</p>
                  <span className="text-xs font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{t.version}</span>
                </div>
                <p className="text-xs text-slate-500">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Estructura de carpetas */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Code2 size={16} className="text-cyan-600" />
          Estructura de Archivos del Proyecto
        </h3>
        <div className="font-mono text-xs bg-slate-900 text-slate-200 rounded-xl p-5 overflow-x-auto">
          <pre>{`/
├── src/
│   ├── app/
│   │   ├── App.tsx                   # Entry point + RouterProvider
│   │   ├── routes.ts                 # Definición de rutas
│   │   ├── context/
│   │   │   └── AppContext.tsx        # Estado global (19 entidades)
│   │   ├── components/
│   │   │   ├── Layout.tsx            # Shell + navegación lateral
│   │   │   └── ui/                   # shadcn/ui components
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx         # Dashboard multi-rol
│   │   │   ├── Appointments.tsx      # Citas
│   │   │   ├── Clients.tsx           # Clientes
│   │   │   ├── Vehicles.tsx          # Vehículos
│   │   │   ├── WorkOrders.tsx        # Órdenes de Trabajo
│   │   │   ├── Diagnostico.tsx       # Panel Mecánico
│   │   │   ├── Inventory.tsx         # Inventario + Proveedores
│   │   │   ├── ClientPortal.tsx      # Portal del Cliente
│   │   │   ├── Facturas.tsx          # Facturas + PDF
│   │   │   ├── Reportes.tsx          # Reportes gerenciales
│   │   │   ├── ConfigSecurity.tsx    # Configuración + Users
│   │   │   ├── SystemDocs.tsx        # Documentación del sistema
│   │   │   ├── JiraPlanning.tsx      # Planificación épicas
│   │   │   ├── UserStoryBoard.tsx    # Kanban user stories
│   │   │   └── ArquitecturaDocs.tsx  # 👈 Esta página
│   │   └── data/
│   │       └── planningData.ts
│   └── styles/
│       ├── theme.css                 # Tokens de diseño
│       └── fonts.css                 # Google Fonts (Inter)
├── supabase/
│   └── functions/
│       └── server/
│           ├── index.tsx             # Servidor Hono (Edge Function)
│           └── kv_store.tsx          # Utilidades KV Store
└── utils/
    └── supabase/
        └── info.tsx                  # projectId + publicAnonKey`}</pre>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Supabase ────────────────────────────────────────────────────────────
function TabSupabase() {
  return (
    <div className="space-y-5">
      {/* Estado actual */}
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-3 h-3 rounded-full bg-emerald-300 animate-pulse" />
          <h3 className="font-bold">Supabase Conectado</h3>
        </div>
        <p className="text-sm text-emerald-100 mb-4">
          El proyecto TallerPro está conectado a Supabase. Los archivos de configuración fueron editados manualmente por el usuario.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { archivo: '/utils/supabase/info.tsx', desc: 'projectId + publicAnonKey', status: '✅ Configurado' },
            { archivo: '/supabase/functions/server/index.tsx', desc: 'Servidor Hono Edge', status: '✅ Activo' },
            { archivo: '/supabase/functions/server/kv_store.tsx', desc: 'Utilidades KV', status: '✅ Listo' },
          ].map(f => (
            <div key={f.archivo} className="bg-white/15 rounded-xl p-3">
              <p className="font-mono text-xs text-emerald-200">{f.archivo}</p>
              <p className="text-xs text-white mt-1">{f.desc}</p>
              <p className="text-xs text-emerald-300 mt-1">{f.status}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Módulos de Supabase */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {MODULOS_SUPABASE.map(m => (
          <div key={m.modulo} className={`rounded-xl border p-5 ${m.color}`}>
            <div className="flex items-center gap-2 mb-3">
              {m.icon}
              <h3 className="font-bold text-slate-800">{m.modulo}</h3>
            </div>
            <div className="space-y-1.5">
              {m.items.map(item => (
                <div key={item} className="flex items-start gap-2 text-xs text-slate-700">
                  <ChevronRight size={11} className="text-slate-400 flex-shrink-0 mt-0.5" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Próximos pasos para migrar al backend real */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <RefreshCw size={16} className="text-blue-600" />
          Ruta de Migración: Mock Data → Supabase Real
        </h3>
        <div className="space-y-3">
          {[
            { paso: 1, titulo: 'Crear tablas en Supabase', desc: 'Ejecutar el script SQL con el patrón Tabla por Subclase desde el SQL Editor de Supabase Dashboard.', estado: 'pendiente' },
            { paso: 2, titulo: 'Habilitar RLS por rol', desc: 'Configurar Row Level Security para que cada rol solo acceda a sus datos. Usar user_metadata.rol del JWT.', estado: 'pendiente' },
            { paso: 3, titulo: 'Crear rutas API en index.tsx', desc: 'Agregar endpoints CRUD en el servidor Hono para cada entidad: GET/POST/PUT/DELETE.', estado: 'en_progreso' },
            { paso: 4, titulo: 'Reemplazar AppContext mock data', desc: 'Cambiar los useStates con initialData por llamadas fetch a las rutas del servidor.', estado: 'pendiente' },
            { paso: 5, titulo: 'Migrar Auth a Supabase Auth', desc: 'Reemplazar la función login() de AppContext por supabase.auth.signInWithPassword().', estado: 'pendiente' },
            { paso: 6, titulo: 'Subir archivos a Storage', desc: 'Cambiar fotos base64 por uploads a Supabase Storage. Usar signed URLs para mostrarlas.', estado: 'pendiente' },
          ].map(p => (
            <div key={p.paso} className="flex gap-4 items-start">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                p.estado === 'en_progreso' ? 'bg-amber-100 text-amber-700 border border-amber-300' :
                p.estado === 'hecho' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {p.estado === 'hecho' ? '✓' : p.paso}
              </div>
              <div className="flex-1 pt-0.5">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-800 text-sm">{p.titulo}</p>
                  {p.estado === 'en_progreso' && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">En progreso</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Flujo de Navegación ─────────────────────────────────────────────────
function TabFlujo() {
  const flujosPorRol: {
    rol: Rol; pasos: { label: string; icon: React.ReactNode; desc: string }[];
  }[] = [
    {
      rol: 'asesor',
      pasos: [
        { label: 'Login', icon: <Lock size={14} />, desc: 'Ingresa con credenciales de asesor' },
        { label: 'Dashboard', icon: <LayoutDashboard size={14} />, desc: 'Ve agenda del día, alertas y OTs pendientes' },
        { label: 'Nueva Cita', icon: <CalendarDays size={14} />, desc: 'Agenda al cliente con fecha y hora' },
        { label: 'Nueva OT', icon: <ClipboardList size={14} />, desc: 'Wizard: Cliente → Vehículo → Problema' },
        { label: 'Cotización', icon: <Receipt size={14} />, desc: 'Envía cotización, espera aprobación' },
        { label: 'Entrega', icon: <CheckCircle size={14} />, desc: 'Cobra, firma y entrega el vehículo' },
      ],
    },
    {
      rol: 'mecanico',
      pasos: [
        { label: 'Login', icon: <Lock size={14} />, desc: 'Ingresa con credenciales de mecánico' },
        { label: 'Dashboard', icon: <LayoutDashboard size={14} />, desc: 'Ve sus OTs asignadas y en proceso' },
        { label: 'Mis OTs', icon: <ClipboardList size={14} />, desc: 'Lista de órdenes asignadas' },
        { label: 'Diagnóstico', icon: <Wrench size={14} />, desc: 'Registra diagnóstico, sube fotos' },
        { label: 'Cotización', icon: <Receipt size={14} />, desc: 'Agrega repuestos y mano de obra' },
        { label: 'Reparación', icon: <CheckCircle size={14} />, desc: 'Ejecuta y registra la reparación' },
      ],
    },
    {
      rol: 'jefe_taller',
      pasos: [
        { label: 'Login', icon: <Lock size={14} />, desc: 'Ingresa con credenciales de jefe de taller' },
        { label: 'Dashboard', icon: <LayoutDashboard size={14} />, desc: 'Ve OTs sin asignar y control calidad pendiente' },
        { label: 'OTs Sin Asignar', icon: <ClipboardList size={14} />, desc: 'Asigna mecánico a cada OT' },
        { label: 'Control Calidad', icon: <Shield size={14} />, desc: 'Aprueba o rechaza la reparación' },
        { label: 'Liberar OT', icon: <CheckCircle size={14} />, desc: 'Marca el vehículo listo para entregar' },
      ],
    },
    {
      rol: 'cliente',
      pasos: [
        { label: 'Login/Registro', icon: <Lock size={14} />, desc: 'Ingresa o se registra desde el portal' },
        { label: 'Portal', icon: <Globe size={14} />, desc: 'Ve sus vehículos y estado de servicios' },
        { label: 'Ver Cotización', icon: <Eye size={14} />, desc: 'Revisa el desglose de costos' },
        { label: 'Aprobar/Rechazar', icon: <Edit3 size={14} />, desc: 'Decide si autoriza la reparación' },
        { label: 'Pago en Línea', icon: <Receipt size={14} />, desc: 'Paga desde el portal (simulado)' },
        { label: 'Mis Facturas', icon: <Receipt size={14} />, desc: 'Descarga o imprime sus facturas' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {flujosPorRol.map(f => {
        const rc = ROL_CFG[f.rol];
        return (
          <div key={f.rol} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-5">
              <span className={`w-3 h-3 rounded-full ${rc.dot}`} />
              <h3 className={`font-bold ${rc.color}`}>Flujo: {rc.label}</h3>
            </div>
            <div className="flex items-start gap-2 overflow-x-auto pb-2">
              {f.pasos.map((paso, i) => (
                <React.Fragment key={paso.label}>
                  <div className="flex flex-col items-center flex-shrink-0 w-24">
                    <div className={`w-10 h-10 rounded-xl ${rc.bg} ${rc.color} flex items-center justify-center mb-2`}>
                      {paso.icon}
                    </div>
                    <p className="text-xs font-semibold text-slate-700 text-center">{paso.label}</p>
                    <p className="text-xs text-slate-400 text-center mt-0.5 leading-snug">{paso.desc}</p>
                  </div>
                  {i < f.pasos.length - 1 && (
                    <div className="flex items-start pt-4 flex-shrink-0">
                      <ArrowRight size={16} className="text-slate-300" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ArquitecturaDocs() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview',  label: 'Overview',         icon: <Layers size={15} />       },
    { id: 'screens',   label: 'Pantallas',         icon: <Monitor size={15} />      },
    { id: 'roles',     label: 'Roles & Acceso',    icon: <Users size={15} />        },
    { id: 'stack',     label: 'Stack Técnico',     icon: <Code2 size={15} />        },
    { id: 'supabase',  label: 'Supabase',          icon: <Database size={15} />     },
    { id: 'flujo',     label: 'Flujos de Uso',     icon: <GitBranch size={15} />    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center">
              <Layers size={20} className="text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Arquitectura del Sistema</h1>
              <p className="text-sm text-slate-500">TallerPro DMS — Frontend + Backend + Supabase</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Supabase Conectado
              </span>
              <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full font-semibold">
                React 18 + TypeScript
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-6">
        <div className="max-w-7xl mx-auto flex gap-1 overflow-x-auto py-2">
          {tabs.map(tab => (
            <TabBtn
              key={tab.id}
              id={tab.id}
              label={tab.label}
              icon={tab.icon}
              active={activeTab === tab.id}
              onClick={setActiveTab}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === 'overview'  && <TabOverview />}
        {activeTab === 'screens'   && <TabScreens />}
        {activeTab === 'roles'     && <TabRoles />}
        {activeTab === 'stack'     && <TabStack />}
        {activeTab === 'supabase'  && <TabSupabase />}
        {activeTab === 'flujo'     && <TabFlujo />}
      </div>
    </div>
  );
}
