import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router';
import {
  LayoutDashboard, Users, Car, ClipboardList, Wrench,
  Package, Settings, LogOut, Menu, X, CalendarDays,
  Building2, ShieldCheck, BarChart3, UserCog, Bell, Receipt, History, Layers
} from 'lucide-react';
import { useApp, Rol } from '../context/AppContext';
import logoImg from 'figma:asset/705ae0af64042a0b0fa15a9246b41db08254ad91.png';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles: Rol[];
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Principal',
    items: [
      { label: 'Dashboard', path: '/', icon: <LayoutDashboard size={16} />, roles: ['administrador', 'asesor', 'mecanico', 'jefe_taller'] },
    ],
  },
  {
    title: 'Gestión de Servicio',
    items: [
      { label: 'Citas', path: '/citas', icon: <CalendarDays size={16} />, roles: ['asesor'] },
      { label: 'Clientes', path: '/clientes', icon: <Users size={16} />, roles: ['asesor'] },
      { label: 'Vehículos', path: '/vehiculos', icon: <Car size={16} />, roles: ['asesor'] },
      { label: 'Órdenes de Trabajo', path: '/ordenes', icon: <ClipboardList size={16} />, roles: ['asesor', 'jefe_taller'] },
      { label: 'Trazabilidad', path: '/trazabilidad', icon: <History size={16} />, roles: ['asesor', 'administrador', 'jefe_taller'] },
    ],
  },
  {
    title: 'Taller',
    items: [
      { label: 'Mis Órdenes', path: '/ordenes', icon: <ClipboardList size={16} />, roles: ['mecanico'] },
      { label: 'Diagnóstico', path: '/diagnostico', icon: <Wrench size={16} />, roles: ['mecanico'] },
      { label: 'Control de Calidad', path: '/control-calidad', icon: <ShieldCheck size={16} />, roles: ['jefe_taller'] },
      { label: 'Inventario', path: '/inventario', icon: <Package size={16} />, roles: ['mecanico', 'jefe_taller'] },
    ],
  },
  {
    title: 'Portal del Cliente',
    items: [
      { label: 'Inicio', path: '/portal', icon: <Car size={16} />, roles: ['cliente'] },
      { label: 'Mis Citas', path: '/citas', icon: <CalendarDays size={16} />, roles: ['cliente'] },
      { label: 'Historial del Vehículo', path: '/trazabilidad', icon: <History size={16} />, roles: ['cliente'] },
      { label: 'Mis Facturas', path: '/facturas', icon: <Receipt size={16} />, roles: ['cliente'] },
    ],
  },
  {
    title: 'Administración',
    items: [
      { label: 'Todas las OTs', path: '/ordenes', icon: <ClipboardList size={16} />, roles: ['administrador'] },
      { label: 'Inventario', path: '/inventario', icon: <Package size={16} />, roles: ['administrador'] },
      { label: 'Facturas', path: '/facturas', icon: <Receipt size={16} />, roles: ['administrador'] },
      { label: 'Reportes', path: '/reportes', icon: <BarChart3 size={16} />, roles: ['administrador'] },
      { label: 'Configuración', path: '/configuracion', icon: <Settings size={16} />, roles: ['administrador'] },
      { label: 'Arquitectura', path: '/arquitectura', icon: <Layers size={16} />, roles: ['administrador'] },
    ],
  },
  {
    title: 'Facturación',
    items: [
      { label: 'Facturas', path: '/facturas', icon: <Receipt size={16} />, roles: ['asesor'] },
    ],
  },
];

export const rolLabels: Record<Rol, string> = {
  administrador: 'Administrador',
  asesor: 'Asesor de Servicio',
  mecanico: 'Mecánico',
  jefe_taller: 'Jefe de Taller',
  cliente: 'Cliente',
};

export const rolColors: Record<Rol, string> = {
  administrador: 'bg-purple-500/20 text-purple-300',
  asesor: 'bg-blue-500/20 text-blue-300',
  mecanico: 'bg-orange-500/20 text-orange-300',
  jefe_taller: 'bg-emerald-500/20 text-emerald-300',
  cliente: 'bg-gray-500/20 text-gray-300',
};

export const rolBadgeColors: Record<Rol, string> = {
  administrador: 'bg-purple-100 text-purple-700 border-purple-200',
  asesor: 'bg-blue-100 text-blue-700 border-blue-200',
  mecanico: 'bg-orange-100 text-orange-700 border-orange-200',
  jefe_taller: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cliente: 'bg-gray-100 text-gray-700 border-gray-200',
};

export function Layout() {
  const { currentUser, logout, citas, ordenes, notificaciones, marcarTodasLeidas } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { replace: true });
    } else if (currentUser.rol === 'cliente' && location.pathname === '/') {
      // Redirect clients away from staff dashboard to client portal
      navigate('/portal', { replace: true });
    }
  }, [currentUser, navigate, location.pathname]);

  if (!currentUser) return null;

  const handleLogout = () => { logout(); navigate('/login'); };

  const today = new Date().toISOString().split('T')[0];
  const todayCitas = citas.filter(c => c.fecha === today && c.estado !== 'cancelada' && c.estado !== 'completada').length;
  const pendingApproval = ordenes.filter(o => o.estado === 'esperando_aprobacion').length;
  const sinAsignar = ordenes.filter(o => o.estado === 'registrada' && !o.mecanicoId).length;
  const qcPendiente = ordenes.filter(o => o.estado === 'control_calidad').length;

  const getBadge = (path: string): number => {
    if (path === '/citas') return todayCitas;
    if (path === '/ordenes') {
      if (currentUser.rol === 'asesor' || currentUser.rol === 'administrador') return pendingApproval;
      if (currentUser.rol === 'jefe_taller') return sinAsignar + qcPendiente;
    }
    return 0;
  };

  const unreadCount = notificaciones.filter(n => {
    if (!currentUser) return false;
    if (n.paraUsuarioId && n.paraUsuarioId !== currentUser.id) return false;
    return n.paraRol.includes(currentUser.rol) && !n.leida;
  }).length;

  const myNotifs = notificaciones.filter(n => {
    if (!currentUser) return false;
    if (n.paraUsuarioId && n.paraUsuarioId !== currentUser.id) return false;
    return n.paraRol.includes(currentUser.rol);
  }).slice().reverse().slice(0, 20);

  const notiColors: Record<string, string> = {
    stock_bajo: 'bg-amber-100 text-amber-700',
    nueva_cita: 'bg-blue-100 text-blue-700',
    cita_confirmada: 'bg-green-100 text-green-700',
    cotizacion_pendiente: 'bg-violet-100 text-violet-700',
    qc_rechazado: 'bg-red-100 text-red-700',
    pago_recibido: 'bg-green-100 text-green-700',
    orden_lista: 'bg-green-100 text-green-700',
    repuesto_agotado: 'bg-red-100 text-red-700',
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo + close on mobile */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-700/60 flex items-center gap-3">
        <div className="bg-white rounded-xl p-2 flex items-center justify-center flex-1">
          <img src={logoImg} alt="TallerPro" className="w-full max-w-[120px] h-auto object-contain" />
        </div>
        <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg flex-shrink-0">
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-4">
        {navSections.map(section => {
          const visibleItems = section.items.filter(item => item.roles.includes(currentUser.rol));
          if (visibleItems.length === 0) return null;
          return (
            <div key={section.title}>
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-3 mb-1.5">{section.title}</p>
              <div className="space-y-0.5">
                {visibleItems.map(item => {
                  const badge = getBadge(item.path);
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === '/'}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 group ${
                          isActive
                            ? 'bg-cyan-500 text-white'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`
                      }
                    >
                      <span className="flex-shrink-0">{item.icon}</span>
                      <span className="flex-1 text-sm">{item.label}</span>
                      {badge > 0 && (
                        <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold min-w-5 text-center leading-none">
                          {badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Rol info strip */}
      <div className="px-3 mx-3 mb-2 py-2 bg-slate-800/60 rounded-lg border border-slate-700/40">
        <div className="flex items-center gap-2">
          <ShieldCheck size={13} className="text-slate-400 flex-shrink-0" />
          <span className={`text-xs px-1.5 py-0.5 rounded-md border font-medium ${rolBadgeColors[currentUser.rol]}`}>
            {rolLabels[currentUser.rol]}
          </span>
        </div>
      </div>

      {/* User info */}
      <div className="px-3 py-3 border-t border-slate-700/60">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-800/50 mb-2">
          <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {currentUser.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{currentUser.nombre}</p>
            <p className="text-slate-500 text-xs truncate">@{currentUser.username}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-sm transition-colors"
        >
          <LogOut size={14} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-56 bg-[#2C3A4F] flex-col flex-shrink-0">
        <SidebarContent />
      </aside>
      {/* Mobile drawer sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-[#2C3A4F] flex flex-col z-30 transform transition-transform duration-200 ease-in-out lg:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </aside>
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-slate-100 flex-shrink-0">
            <Menu size={20} className="text-slate-600" />
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <img src={logoImg} alt="TallerPro" className="h-8 w-auto object-contain" />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-700 truncate max-w-24">{currentUser.nombre.split(' ')[0]}</p>
              <span className={`text-xs px-1.5 py-0.5 rounded-md border font-medium ${rolBadgeColors[currentUser.rol]}`}>
                {rolLabels[currentUser.rol]}
              </span>
            </div>
            <button onClick={() => setNotifOpen(!notifOpen)} className="relative p-2 rounded-lg hover:bg-slate-100 flex-shrink-0">
              <Bell size={20} className="text-slate-600" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold leading-none">{unreadCount}</span>
              )}
            </button>
          </div>
        </header>

        {/* Desktop notification bar */}
        <div className="hidden lg:flex items-center justify-between px-6 py-2 bg-white border-b border-slate-200 shadow-sm flex-shrink-0">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="font-medium text-slate-700">{currentUser.nombre}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-md border font-medium ${rolBadgeColors[currentUser.rol]}`}>
              {rolLabels[currentUser.rol]}
            </span>
          </div>
          <div className="relative">
            <button onClick={() => setNotifOpen(!notifOpen)} className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 text-slate-600">
              <Bell size={16} />
              <span className="text-xs font-medium hidden sm:inline">Notificaciones</span>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">{unreadCount}</span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-1 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                  <p className="font-bold text-slate-800 text-sm">Notificaciones</p>
                  <div className="flex gap-2">
                    {unreadCount > 0 && (
                      <button onClick={() => marcarTodasLeidas()} className="text-xs text-blue-600 hover:underline">Marcar todas</button>
                    )}
                    <button onClick={() => setNotifOpen(false)} className="p-1 hover:bg-slate-100 rounded"><X size={14} /></button>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {myNotifs.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-sm">Sin notificaciones</div>
                  ) : myNotifs.map(n => (
                    <div key={n.id} className={`px-4 py-3 ${!n.leida ? 'bg-blue-50/50' : ''}`}>
                      <div className="flex items-start gap-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 mt-0.5 ${notiColors[n.tipo] || 'bg-slate-100 text-slate-600'}`}>
                          {n.tipo.replace(/_/g, ' ')}
                        </span>
                        {!n.leida && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />}
                      </div>
                      <p className="text-xs font-semibold text-slate-800 mt-1">{n.titulo}</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.mensaje}</p>
                      <p className="text-xs text-slate-300 mt-1">{new Date(n.fecha).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile notification panel (full-screen overlay) */}
        {notifOpen && (
          <div className="lg:hidden fixed inset-0 bg-black/50 z-40 flex items-end" onClick={() => setNotifOpen(false)}>
            <div className="w-full bg-white rounded-t-3xl max-h-[80vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <p className="font-bold text-slate-800">Notificaciones</p>
                <div className="flex gap-3 items-center">
                  {unreadCount > 0 && (
                    <button onClick={() => marcarTodasLeidas()} className="text-sm text-blue-600 font-medium">Marcar todas</button>
                  )}
                  <button onClick={() => setNotifOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={16} /></button>
                </div>
              </div>
              <div className="overflow-y-auto divide-y divide-slate-100">
                {myNotifs.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">Sin notificaciones</div>
                ) : myNotifs.map(n => (
                  <div key={n.id} className={`px-5 py-4 ${!n.leida ? 'bg-blue-50/40' : ''}`}>
                    <div className="flex items-start gap-2 mb-1">
                      {!n.leida && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />}
                      <p className="text-sm font-semibold text-slate-800">{n.titulo}</p>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed">{n.mensaje}</p>
                    <p className="text-xs text-slate-300 mt-1">{new Date(n.fecha).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}