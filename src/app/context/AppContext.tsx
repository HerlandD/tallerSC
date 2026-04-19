import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase, RpcUser } from '../../lib/supabase';

// ─── Types ──────────────────────────────────────────────────────────────────

export type Rol = 'administrador' | 'asesor' | 'mecanico' | 'jefe_taller' | 'cliente';

export type EstadoOrden =
  | 'registrada'
  | 'en_diagnostico'
  | 'esperando_aprobacion'
  | 'en_reparacion'
  | 'liquidacion_diagnostico'
  | 'control_calidad'
  | 'liberada'
  | 'finalizada'
  | 'cancelada';

export type EstadoCita = 'pendiente' | 'confirmada' | 'en_progreso' | 'completada' | 'cancelada';

export interface Notificacion {
  id: string; fecha: string;
  tipo: 'stock_bajo' | 'nueva_cita' | 'cotizacion_pendiente' | 'qc_rechazado' | 'pago_recibido' | 'orden_lista' | 'repuesto_agotado';
  titulo: string; mensaje: string; leida: boolean;
  paraRol: ('administrador' | 'asesor' | 'mecanico' | 'jefe_taller' | 'cliente')[];
  paraUsuarioId?: string; referenciaId?: string; referenciaTipo?: string;
}

export interface Usuario {
  id: string; nombre: string; ci?: string; username: string; password: string;
  rol: Rol; activo: boolean; email?: string; telefono?: string; fechaCreacion?: string;
}

export interface PersonalTaller {
  id: string; nombre: string; cargo: string; especialidad: string;
  telefono: string; email: string; estado: 'activo' | 'inactivo' | 'vacaciones'; usuarioId?: string;
}

export interface Cliente {
  id: string; nombre: string; ci: string; nit?: string; telefono: string;
  email: string; direccion: string; fechaRegistro: string; creadoPor?: string; usuarioId?: string;
}

export interface Vehiculo {
  id: string; clienteId: string; placa: string; marca: string; modelo: string;
  año: number; color: string; chasis?: string; kilometraje?: number;
  creadoPor?: string; fechaCreacion?: string;
}

export interface Cita {
  id: string; clienteId: string; vehiculoId: string; tipoServicio: string;
  motivoIngreso: string; fecha: string; hora: string; estado: EstadoCita;
  notas: string; ordenId?: string;
}

export interface Proveedor {
  id: string; nombre: string; contacto: string; telefono: string;
  email: string; productos: string; activo: boolean;
}

export interface RepuestoUsado {
  repuestoId: string; nombre: string; cantidad: number; precio: number;
}

export interface LineaCotizacion {
  id: string; tipo: 'repuesto' | 'mano_de_obra' | 'diagnostico';
  descripcion: string; cantidad: number; precioUnitario: number;
  aprobado?: boolean; rechazado?: boolean; motivoRechazo?: string;
}

export interface Cotizacion {
  lineas: LineaCotizacion[];
  estado: 'pendiente' | 'enviada' | 'aprobada' | 'rechazada';
  motivoRechazo?: string; metodoPago?: string; costoDiagnostico: number;
  fechaEnvio?: string; fechaRespuesta?: string; firmaClienteUrl?: string;
}

export interface RecepcionVehiculo {
  kilometraje: string; nivelCombustible: number;
  aceite: 'bueno' | 'bajo' | 'malo'; refrigerante: 'bueno' | 'bajo' | 'malo';
  frenos: 'bueno' | 'bajo' | 'malo'; dañosPreexistentes: string;
  inventario: string; fotos?: string[];
}

export interface ControlCalidad {
  aprobado: boolean; observaciones: string; pruebaRuta: boolean;
  responsableId?: string; tareasPendientes?: string[]; fechaRevision?: string;
}

export interface TareaSubdividida {
  id: string; descripcion: string; mecanicoAsignadoId?: string;
  estado: 'pendiente' | 'en_progreso' | 'completada'; orden: number;
  notas?: string; estimadoHoras?: number; fechaInicio?: string; fechaFin?: string;
}

export interface Firma {
  dataUrl: string; fecha: string;
  tipo: 'aprobacion_presupuesto' | 'entrega_vehiculo'; usuarioId?: string;
}

export interface Factura {
  numero: string; fecha: string; ordenId: string; clienteId: string;
  subtotal: number; impuesto: number; total: number; metodoPago: string;
  estado: 'emitida' | 'pagada'; pdfUrl?: string;
}

export interface LogAuditoria {
  id: string; fecha: string; usuarioId: string; usuarioNombre: string;
  accion: string; modulo: string; detalles: string;
  entidadId?: string; entidadTipo?: string;
}

export interface MovimientoKardex {
  id: string; repuestoId: string; repuestoNombre: string;
  tipo: 'entrada' | 'salida' | 'reserva' | 'liberacion' | 'ajuste';
  cantidad: number; stockResultante: number; fecha: string;
  usuarioId: string; usuarioNombre: string; ordenId?: string;
  proveedorId?: string; costo?: number; precioVenta?: number; observaciones?: string;
}

export interface OrdenTrabajo {
  id: string; numero: string; clienteId: string; vehiculoId: string;
  descripcionProblema: string; mecanicoId?: string; mecanicosIds?: string[];
  jefeAsignadoId?: string; estado: EstadoOrden; diagnostico?: string;
  fallasAdicionales?: string; fotosDiagnostico?: string[]; fotosReparacion?: string[];
  fotosRecepcion?: string[]; reparacion?: string;
  repuestosUsados: RepuestoUsado[]; repuestosReservados?: RepuestoUsado[];
  recepcion?: RecepcionVehiculo; cotizacion?: Cotizacion;
  controlCalidad?: ControlCalidad; tareas?: TareaSubdividida[];
  firmas?: Firma[]; facturas?: Factura[]; entregaFirmada: boolean;
  notasEntrega?: string; citaId?: string; facturaId?: string;
  pagadoEnLinea?: boolean; metodoPagoFinal?: string;
  fechaCreacion: string; fechaActualizacion: string;
  creadoPor?: string; modificadoPor?: string; asignadoPor?: string;
}

export interface Repuesto {
  id: string; nombre: string; categoria: string; cantidad: number;
  cantidadReservada: number; costo: number; margenGanancia: number;
  precio: number; stockMinimo: number; proveedorId?: string; imagen?: string;
}

export interface Catalogs {
  marcas: { nombre: string; modelos: string[] }[];
  tiposServicio: string[]; motivosIngreso: string[]; metodosPago: string[];
}

// ─── Supabase Auth (via RPC) ─────────────────────────────────────────────────
// Toda la autenticación pasa por funciones SECURITY DEFINER en la DB.
// El cliente nunca lee contraseñas directamente de la tabla usuarios.

function rpcUserToUsuario(u: RpcUser): Usuario {
  return {
    id:       u.id,
    nombre:   u.nombre,
    username: u.username,
    password: '',          // nunca se almacena la contraseña en el estado del app
    rol:      u.rol as Rol,
    activo:   u.activo,
    email:    u.email ?? undefined,
    telefono: u.telefono ?? undefined,
    ci:       u.ci ?? undefined,
  };
}

// ─── Helper shortcuts ────────────────────────────────────────────────────────
const cotAprobada = (lineas: LineaCotizacion[], metodoPago: string, costo = 30): Cotizacion =>
  ({ lineas, estado: 'aprobada', metodoPago, costoDiagnostico: costo });

const qcOk = (obs: string, responsableId = 'u7', fecha = '2026-01-01'): ControlCalidad =>
  ({ aprobado: true, observaciones: obs, pruebaRuta: true, responsableId, fechaRevision: fecha });

const initialOrdenes: OrdenTrabajo[] = [];

const initialFacturas: Factura[] = [];

const initialKardex: MovimientoKardex[] = [];

const initialAuditoria: LogAuditoria[] = [];

const initialNotificaciones: Notificacion[] = [];

const initialCatalogs: Catalogs = {
  marcas: [
    { nombre: 'Toyota',      modelos: ['Corolla', 'Hilux', 'RAV4', 'Yaris', 'Land Cruiser', 'Fortuner'] },
    { nombre: 'Chevrolet',   modelos: ['Aveo', 'Sail', 'Tracker', 'D-Max', 'Spark', 'Captiva'] },
    { nombre: 'Hyundai',     modelos: ['Tucson', 'Elantra', 'Santa Fe', 'Accent', 'Creta', 'i10'] },
    { nombre: 'Ford',        modelos: ['Focus', 'Fiesta', 'Explorer', 'Ranger', 'Ecosport', 'Territory'] },
    { nombre: 'Kia',         modelos: ['Sportage', 'Rio', 'Sorento', 'Picanto', 'Seltos', 'Cerato'] },
    { nombre: 'Volkswagen',  modelos: ['Golf', 'Jetta', 'Tiguan', 'Polo', 'Passat', 'T-Cross'] },
    { nombre: 'Nissan',      modelos: ['Sentra', 'Frontier', 'Kicks', 'Murano', 'Note', 'Versa'] },
    { nombre: 'Honda',       modelos: ['Civic', 'CR-V', 'HR-V', 'Pilot', 'Accord', 'Fit'] },
    { nombre: 'Mazda',       modelos: ['CX-5', 'CX-3', 'Mazda3', 'Mazda6', 'BT-50'] },
    { nombre: 'Mitsubishi',  modelos: ['Outlander', 'Eclipse Cross', 'L200', 'ASX', 'Montero'] },
    { nombre: 'Suzuki',      modelos: ['Swift', 'Vitara', 'Jimny', 'Grand Vitara', 'Baleno'] },
  ],
  tiposServicio: [
    'Mantenimiento Preventivo', 'Reparación Mecánica', 'Diagnóstico', 'Revisión General',
    'Cambio de Aceite', 'Alineación y Balanceo', 'Cambio de Frenos', 'Reparación Eléctrica',
    'Pintura y Carrocería', 'Revisión Técnica Vehicular', 'Otro',
  ],
  motivosIngreso: [
    'Falla mecánica', 'Mantenimiento programado', 'Revisión rutinaria', 'Ruido extraño',
    'Sobrecalentamiento', 'Falla eléctrica', 'Accidente', 'Vibración anormal',
    'Problemas de frenos', 'Consumo excesivo de combustible', 'Humo o fugas', 'Otro',
  ],
  metodosPago: [
    'Efectivo', 'Tarjeta de crédito', 'Tarjeta de débito', 'Transferencia bancaria', 'Cheque',
  ],
};

// ─── Context ─────────────────────────────────────────────────────────────────

interface AppContextType {
  currentUser: Usuario | null;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  registerCliente: (datos: {
    nombre: string; ci: string; nit?: string; telefono: string; email: string;
    direccion: string; username: string; password: string;
  }) => Promise<{ ok: boolean; error?: string }>;

  usuarios: Usuario[];
  personal: PersonalTaller[];
  clientes: Cliente[];
  vehiculos: Vehiculo[];
  citas: Cita[];
  proveedores: Proveedor[];
  ordenes: OrdenTrabajo[];
  repuestos: Repuesto[];
  kardex: MovimientoKardex[];
  auditoria: LogAuditoria[];
  catalogs: Catalogs;
  facturas: Factura[];

  addUsuario: (u: Omit<Usuario, 'id'>) => Promise<{ ok: boolean; error?: string }>;
  updateUsuario: (id: string, u: Partial<Usuario>) => Promise<{ ok: boolean; error?: string }>;
  deleteUsuario: (id: string) => void;

  addPersonal: (p: Omit<PersonalTaller, 'id'>) => void;
  updatePersonal: (id: string, p: Partial<PersonalTaller>) => void;
  deletePersonal: (id: string) => void;

  addCliente: (c: Omit<Cliente, 'id' | 'fechaRegistro'>) => Promise<{ ok: boolean; error?: string }>;
  updateCliente: (id: string, c: Partial<Cliente>) => Promise<{ ok: boolean; error?: string }>;
  deleteCliente: (id: string) => Promise<{ ok: boolean; error?: string }>;

  addVehiculo: (v: Omit<Vehiculo, 'id'>) => Promise<{ ok: boolean; error?: string }>;
  updateVehiculo: (id: string, v: Partial<Vehiculo>) => Promise<{ ok: boolean; error?: string }>;
  deleteVehiculo: (id: string) => Promise<{ ok: boolean; error?: string }>;

  addCita:       (c: Omit<Cita, 'id'>) => Promise<{ ok: boolean; error?: string }>;
  updateCita:    (id: string, c: Partial<Cita>) => Promise<{ ok: boolean; error?: string }>;
  deleteCita:    (id: string) => Promise<{ ok: boolean; error?: string }>;
  confirmarCita: (id: string) => Promise<{ ok: boolean; error?: string }>;
  reprogramarCita: (id: string, fecha: string, hora: string) => Promise<{ ok: boolean; error?: string }>;
  cancelarCita:  (id: string, motivo?: string) => Promise<{ ok: boolean; error?: string }>;

  addProveedor: (p: Omit<Proveedor, 'id'>) => void;
  updateProveedor: (id: string, p: Partial<Proveedor>) => void;
  deleteProveedor: (id: string) => void;

  addOrden: (o: Omit<OrdenTrabajo, 'id' | 'numero' | 'fechaCreacion' | 'fechaActualizacion' | 'repuestosUsados' | 'entregaFirmada'>) => void;
  updateOrden: (id: string, o: Partial<OrdenTrabajo>) => void;
  deleteOrden: (id: string) => void;

  addRepuesto: (r: Omit<Repuesto, 'id'>) => void;
  updateRepuesto: (id: string, r: Partial<Repuesto>) => void;
  deleteRepuesto: (id: string) => void;
  registrarSalidaRepuesto: (repuestoId: string, cantidad: number, ordenId?: string) => boolean;
  reservarRepuestos: (repuestosReservados: RepuestoUsado[], ordenId: string) => boolean;
  liberarReservas: (repuestosReservados: RepuestoUsado[], ordenId: string) => void;
  addStockRepuesto: (repuestoId: string, cantidad: number, costo?: number, proveedorId?: string) => void;

  addKardex: (m: Omit<MovimientoKardex, 'id'>) => void;
  addAuditoria: (log: Omit<LogAuditoria, 'id'>) => void;
  addFactura: (f: Factura) => void;

  notificaciones: Notificacion[];
  addNotificacion: (n: Omit<Notificacion, 'id' | 'fecha' | 'leida'>) => void;
  marcarNotificacionLeida: (id: string) => void;
  marcarTodasLeidas: () => void;

  updateCatalogs: (c: Partial<Catalogs>) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const SESSION_KEY = 'tallerpro_session';

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [personal, setPersonal] = useState<PersonalTaller[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([]);
  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
  const [kardex, setKardex] = useState<MovimientoKardex[]>([]);
  const [auditoria, setAuditoria] = useState<LogAuditoria[]>([]);
  const [catalogs, setCatalogs] = useState<Catalogs>(initialCatalogs);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);

  // Restaurar sesión guardada al montar la app
  useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as Usuario;
      if (parsed?.id && parsed?.rol) setCurrentUser(parsed);
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
  }, []);

  const login = async (username: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.rpc('login_usuario', {
        p_username: username,
        p_password: password,
      });

      if (!error && data?.success && data?.user) {
        const user = rpcUserToUsuario(data.user as RpcUser);
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
        setCurrentUser(user);
        addAuditoria({ fecha: new Date().toISOString(), usuarioId: user.id, usuarioNombre: user.nombre, accion: 'LOGIN', modulo: 'Sistema', detalles: `Inicio de sesión — Rol: ${user.rol}` });
        return { ok: true };
      }

      // RPC respondió pero con error de credenciales — devolver mensaje exacto del servidor
      if (!error && data && !data.success) {
        return { ok: false, error: data.error ?? 'Credenciales incorrectas' };
      }

      // Fallback local (solo si el RPC aún no está en Supabase)
      console.warn('RPC login_usuario no disponible, usando datos locales:', error?.message);
      const localUser = usuarios.find(u => u.username === username && u.password === password && u.activo);
      if (localUser) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(localUser));
        setCurrentUser(localUser);
        addAuditoria({ fecha: new Date().toISOString(), usuarioId: localUser.id, usuarioNombre: localUser.nombre, accion: 'LOGIN', modulo: 'Sistema', detalles: `Inicio de sesión (local) — Rol: ${localUser.rol}` });
        return { ok: true };
      }
      return { ok: false, error: 'Credenciales incorrectas' };
    } catch (err) {
      console.error('Error en login:', err);
      return { ok: false, error: 'Error de conexión. Intenta nuevamente.' };
    }
  };

  const registerCliente = async (datos: {
    nombre: string; ci: string; nit?: string; telefono: string; email: string;
    direccion: string; username: string; password: string;
  }): Promise<{ ok: boolean; error?: string }> => {
    try {
      // Una sola llamada RPC — validación + inserción en transacción atómica
      const { data, error } = await supabase.rpc('registrar_cliente', {
        p_username:  datos.username,
        p_password:  datos.password,
        p_nombre:    datos.nombre,
        p_ci:        datos.ci,
        p_nit:       datos.nit    ?? null,
        p_telefono:  datos.telefono,
        p_email:     datos.email,
        p_direccion: datos.direccion,
      });

      if (error) {
        console.error('Error en RPC registrar_cliente:', error);
        return { ok: false, error: 'Error al registrar en la base de datos' };
      }

      if (!data?.success) {
        return { ok: false, error: data?.error ?? 'Error al registrar' };
      }

      const user = rpcUserToUsuario(data.user as RpcUser);
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      setUsuarios(prev => [...prev, user]);
      setCurrentUser(user);
      addAuditoria({
        fecha: new Date().toISOString(),
        usuarioId: user.id, usuarioNombre: user.nombre,
        accion: 'REGISTRO_CLIENTE', modulo: 'Sistema',
        detalles: `Nuevo cliente: ${user.nombre} — CI: ${user.ci}`,
      });

      return { ok: true };
    } catch (err) {
      console.error('Error en registerCliente:', err);
      return { ok: false, error: 'Error inesperado al registrar cliente' };
    }
  };

  const logout = () => {
    if (currentUser) {
      addAuditoria({ fecha: new Date().toISOString(), usuarioId: currentUser.id, usuarioNombre: currentUser.nombre, accion: 'LOGOUT', modulo: 'Sistema', detalles: 'Cierre de sesión' });
    }
    localStorage.removeItem('tallerpro_session');
    setCurrentUser(null);
  };

  // Cargar datos desde Supabase cada vez que haya un usuario activo
  useEffect(() => {
    if (!currentUser) { setClientes([]); setVehiculos([]); setCitas([]); setUsuarios([]); return; }

    // Administradores y jefes de taller cargan la lista de usuarios
    if (currentUser.rol === 'administrador' || currentUser.rol === 'jefe_taller') {
      supabase.rpc('listar_usuarios').then(({ data }) => {
        if (Array.isArray(data)) setUsuarios(data as Usuario[]);
      });
    }

    supabase.rpc('listar_clientes').then(({ data }) => {
      if (Array.isArray(data)) setClientes(data as Cliente[]);
    });
    supabase.rpc('listar_vehiculos').then(({ data }) => {
      if (Array.isArray(data)) {
        setVehiculos((data as any[]).map(v => ({ ...v, año: v.anio })));
      }
    });
    supabase.rpc('listar_citas', {
      p_usuario_id: currentUser.id,
      p_rol:        currentUser.rol,
    }).then(({ data }) => {
      if (Array.isArray(data)) setCitas(data as Cita[]);
    });
  }, [currentUser?.id]);

  // ── Usuarios (Supabase RPC) ───────────────────────────────────────────────
  const addUsuario = async (u: Omit<Usuario, 'id'>): Promise<{ ok: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.rpc('crear_usuario', {
        p_nombre:   u.nombre,
        p_username: u.username,
        p_password: u.password,
        p_rol:      u.rol,
        p_email:    u.email    ?? null,
        p_telefono: u.telefono ?? null,
        p_ci:       u.ci       ?? null,
        p_activo:   u.activo,
      });
      if (error) throw error;
      if (!data?.success) return { ok: false, error: data?.error ?? 'Error al crear usuario' };
      setUsuarios(prev => [...prev, data.usuario as Usuario]);
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message ?? 'Error de conexión' };
    }
  };

  const updateUsuario = async (id: string, u: Partial<Usuario>): Promise<{ ok: boolean; error?: string }> => {
    try {
      const prev = usuarios.find(x => x.id === id);
      if (!prev) return { ok: false, error: 'Usuario no encontrado' };
      const merged = { ...prev, ...u };
      const { data, error } = await supabase.rpc('actualizar_usuario', {
        p_id:       id,
        p_nombre:   merged.nombre,
        p_username: merged.username,
        p_password: u.password && u.password !== prev.password ? u.password : null,
        p_rol:      merged.rol      ?? null,
        p_email:    merged.email    ?? null,
        p_telefono: merged.telefono ?? null,
        p_ci:       merged.ci       ?? null,
        p_activo:   merged.activo   ?? null,
      });
      if (error) throw error;
      if (!data?.success) return { ok: false, error: data?.error ?? 'Error al actualizar' };
      setUsuarios(prev => prev.map(x => x.id === id ? { ...x, ...u } : x));
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message ?? 'Error de conexión' };
    }
  };

  const deleteUsuario = (id: string) => setUsuarios(p => p.filter(x => x.id !== id));

  const addPersonal = (p: Omit<PersonalTaller, 'id'>) => setPersonal(prev => [...prev, { ...p, id: `p${Date.now()}` }]);
  const updatePersonal = (id: string, p: Partial<PersonalTaller>) => setPersonal(prev => prev.map(x => x.id === id ? { ...x, ...p } : x));
  const deletePersonal = (id: string) => setPersonal(prev => prev.filter(x => x.id !== id));

  // ── Clientes (Supabase RPC) ───────────────────────────────────────────────
  const addCliente = async (c: Omit<Cliente, 'id' | 'fechaRegistro'>): Promise<{ ok: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.rpc('crear_cliente', {
        p_nombre:     c.nombre,
        p_ci:         c.ci,
        p_nit:        c.nit        ?? null,
        p_telefono:   c.telefono,
        p_email:      c.email      ?? null,
        p_direccion:  c.direccion  ?? null,
        p_usuario_id: c.usuarioId  ?? null,
      });
      if (error) throw error;
      if (!data?.success) return { ok: false, error: data?.error ?? 'Error al guardar' };
      setClientes(prev => [...prev, data.cliente as Cliente]);
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message ?? 'Error de conexión' };
    }
  };

  const updateCliente = async (id: string, c: Partial<Cliente>): Promise<{ ok: boolean; error?: string }> => {
    try {
      const prev = clientes.find(x => x.id === id);
      if (!prev) return { ok: false, error: 'Cliente no encontrado localmente' };
      const merged = { ...prev, ...c };
      const { data, error } = await supabase.rpc('actualizar_cliente', {
        p_id:        id,
        p_nombre:    merged.nombre,
        p_ci:        merged.ci,
        p_nit:       merged.nit       ?? null,
        p_telefono:  merged.telefono,
        p_email:     merged.email     ?? null,
        p_direccion: merged.direccion ?? null,
      });
      if (error) throw error;
      if (!data?.success) return { ok: false, error: data?.error ?? 'Error al actualizar' };
      setClientes(p => p.map(x => x.id === id ? { ...x, ...(data.cliente as Cliente) } : x));
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message ?? 'Error de conexión' };
    }
  };

  const deleteCliente = async (id: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.rpc('eliminar_cliente', { p_id: id });
      if (error) throw error;
      if (!data?.success) return { ok: false, error: data?.error ?? 'Error al eliminar' };
      setClientes(p => p.filter(x => x.id !== id));
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message ?? 'Error de conexión' };
    }
  };

  // ── Vehículos (Supabase RPC) ──────────────────────────────────────────────
  const addVehiculo = async (v: Omit<Vehiculo, 'id'>): Promise<{ ok: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.rpc('crear_vehiculo', {
        p_cliente_id:  v.clienteId,
        p_placa:       v.placa,
        p_marca:       v.marca,
        p_modelo:      v.modelo,
        p_anio:        v.año,
        p_color:       v.color       ?? null,
        p_chasis:      v.chasis      ?? null,
        p_kilometraje: v.kilometraje ?? 0,
      });
      if (error) throw error;
      if (!data?.success) return { ok: false, error: data?.error ?? 'Error al guardar' };
      const veh: Vehiculo = { ...data.vehiculo, año: data.vehiculo.anio };
      setVehiculos(prev => [...prev, veh]);
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message ?? 'Error de conexión' };
    }
  };

  const updateVehiculo = async (id: string, v: Partial<Vehiculo>): Promise<{ ok: boolean; error?: string }> => {
    try {
      const prev = vehiculos.find(x => x.id === id);
      if (!prev) return { ok: false, error: 'Vehículo no encontrado localmente' };
      const merged = { ...prev, ...v };
      const { data, error } = await supabase.rpc('actualizar_vehiculo', {
        p_id:          id,
        p_cliente_id:  merged.clienteId,
        p_placa:       merged.placa,
        p_marca:       merged.marca,
        p_modelo:      merged.modelo,
        p_anio:        merged.año,
        p_color:       merged.color    ?? null,
        p_chasis:      merged.chasis   ?? null,
        p_kilometraje: merged.kilometraje ?? null,
      });
      if (error) throw error;
      if (!data?.success) return { ok: false, error: data?.error ?? 'Error al actualizar' };
      const veh: Vehiculo = { ...data.vehiculo, año: data.vehiculo.anio };
      setVehiculos(p => p.map(x => x.id === id ? veh : x));
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message ?? 'Error de conexión' };
    }
  };

  const deleteVehiculo = async (id: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.rpc('eliminar_vehiculo', { p_id: id });
      if (error) throw error;
      if (!data?.success) return { ok: false, error: data?.error ?? 'Error al eliminar' };
      setVehiculos(p => p.filter(x => x.id !== id));
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message ?? 'Error de conexión' };
    }
  };

  // ── Citas (Supabase RPC) ──────────────────────────────────
  const addCita = async (c: Omit<Cita, 'id'>): Promise<{ ok: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.rpc('crear_cita', {
        p_fecha:          c.fecha,
        p_hora:           c.hora,
        p_cliente_id:     c.clienteId  || null,
        p_vehiculo_id:    c.vehiculoId || null,
        p_tipo_servicio:  c.tipoServicio  || 'Por confirmar',
        p_motivo_ingreso: c.motivoIngreso || null,
        p_notas:          c.notas        || null,
        p_estado:         c.estado       || 'pendiente',
        p_creado_por:     currentUser?.id || null,
      });
      if (error) throw error;
      if (!data?.success) return { ok: false, error: data?.error ?? 'Error al guardar' };
      setCitas(prev => [...prev, data.cita as Cita]);
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message ?? 'Error de conexión' };
    }
  };

  const updateCita = async (id: string, c: Partial<Cita>): Promise<{ ok: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.rpc('actualizar_cita', {
        p_id:             id,
        p_tipo_servicio:  c.tipoServicio  ?? null,
        p_motivo_ingreso: c.motivoIngreso ?? null,
        p_fecha:          c.fecha         ?? null,
        p_hora:           c.hora          ?? null,
        p_estado:         c.estado        ?? null,
        p_notas:          c.notas         ?? null,
        p_vehiculo_id:    c.vehiculoId    ?? null,
        p_orden_id:       c.ordenId       ?? null,
      });
      if (error) throw error;
      if (!data?.success) return { ok: false, error: data?.error ?? 'Error al actualizar' };
      setCitas(prev => prev.map(x => x.id === id ? { ...x, ...(data.cita as Cita) } : x));
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message ?? 'Error de conexión' };
    }
  };

  const deleteCita = async (id: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.rpc('eliminar_cita', { p_id: id });
      if (error) throw error;
      if (!data?.success) return { ok: false, error: data?.error ?? 'Error al eliminar' };
      setCitas(prev => prev.filter(x => x.id !== id));
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message ?? 'Error de conexión' };
    }
  };

  const confirmarCita = async (id: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.rpc('confirmar_cita', {
        p_id:        id,
        p_asesor_id: currentUser?.id ?? null,
      });
      if (error) throw error;
      if (!data?.success) return { ok: false, error: data?.error ?? 'Error al confirmar' };
      setCitas(prev => prev.map(x => x.id === id ? { ...x, ...(data.cita as Cita) } : x));
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message ?? 'Error de conexión' };
    }
  };

  const reprogramarCita = async (id: string, fecha: string, hora: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.rpc('reprogramar_cita', {
        p_id:          id,
        p_nueva_fecha: fecha,
        p_nueva_hora:  hora,
      });
      if (error) throw error;
      if (!data?.success) return { ok: false, error: data?.error ?? 'Error al reprogramar' };
      setCitas(prev => prev.map(x => x.id === id ? { ...x, ...(data.cita as Cita) } : x));
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message ?? 'Error de conexión' };
    }
  };

  const cancelarCita = async (id: string, motivo?: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.rpc('cancelar_cita', {
        p_id:     id,
        p_motivo: motivo ?? null,
      });
      if (error) throw error;
      if (!data?.success) return { ok: false, error: data?.error ?? 'Error al cancelar' };
      setCitas(prev => prev.map(x => x.id === id ? { ...x, ...(data.cita as Cita) } : x));
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message ?? 'Error de conexión' };
    }
  };

  const addProveedor = (p: Omit<Proveedor, 'id'>) => setProveedores(prev => [...prev, { ...p, id: `pv${Date.now()}` }]);
  const updateProveedor = (id: string, p: Partial<Proveedor>) => setProveedores(prev => prev.map(x => x.id === id ? { ...x, ...p } : x));
  const deleteProveedor = (id: string) => setProveedores(prev => prev.filter(x => x.id !== id));

  const addOrden = (o: Omit<OrdenTrabajo, 'id' | 'numero' | 'fechaCreacion' | 'fechaActualizacion' | 'repuestosUsados' | 'entregaFirmada'>) => {
    setOrdenes(prev => {
      const num = `OT-${String(prev.length + 1).padStart(3, '0')}`;
      const now = new Date().toISOString().split('T')[0];
      return [...prev, { ...o, id: `o${Date.now()}`, numero: num, fechaCreacion: now, fechaActualizacion: now, repuestosUsados: [], entregaFirmada: false }];
    });
  };

  const updateOrden = (id: string, o: Partial<OrdenTrabajo>) =>
    setOrdenes(p => p.map(x => x.id === id ? { ...x, ...o, fechaActualizacion: new Date().toISOString().split('T')[0] } : x));

  const deleteOrden = (id: string) => setOrdenes(p => p.filter(x => x.id !== id));

  const addRepuesto = (r: Omit<Repuesto, 'id'>) => setRepuestos(p => [...p, { ...r, id: `r${Date.now()}` }]);
  const updateRepuesto = (id: string, r: Partial<Repuesto>) => setRepuestos(p => p.map(x => x.id === id ? { ...x, ...r } : x));
  const deleteRepuesto = (id: string) => setRepuestos(p => p.filter(x => x.id !== id));

  const registrarSalidaRepuesto = (repuestoId: string, cantidad: number, ordenId?: string): boolean => {
    const rep = repuestos.find(r => r.id === repuestoId);
    if (!rep || rep.cantidad < cantidad) return false;
    const newCantidad = rep.cantidad - cantidad;
    setRepuestos(p => p.map(r => r.id === repuestoId ? { ...r, cantidad: newCantidad } : r));
    if (currentUser) {
      setKardex(prev => [...prev, {
        id: `k${Date.now()}`, repuestoId, repuestoNombre: rep.nombre, tipo: 'salida',
        cantidad, stockResultante: newCantidad, fecha: new Date().toISOString(),
        usuarioId: currentUser.id, usuarioNombre: currentUser.nombre, ordenId,
        observaciones: ordenId ? `Salida por ${ordenId}` : 'Salida manual',
      }]);
    }
    return true;
  };

  const reservarRepuestos = (repuestosReservados: RepuestoUsado[], ordenId: string): boolean => {
    for (const rep of repuestosReservados) {
      const stock = repuestos.find(r => r.id === rep.repuestoId);
      if (!stock || (stock.cantidad - stock.cantidadReservada) < rep.cantidad) return false;
    }
    setRepuestos(prev => prev.map(r => {
      const res = repuestosReservados.find(rv => rv.repuestoId === r.id);
      if (!res) return r;
      const newReservada = (r.cantidadReservada || 0) + res.cantidad;
      if (currentUser) {
        setKardex(k => [...k, {
          id: `k${Date.now()}_${r.id}`, repuestoId: r.id, repuestoNombre: r.nombre, tipo: 'reserva',
          cantidad: res.cantidad, stockResultante: r.cantidad, fecha: new Date().toISOString(),
          usuarioId: currentUser.id, usuarioNombre: currentUser.nombre, ordenId,
          observaciones: `Reserva para ${ordenId}`,
        }]);
      }
      return { ...r, cantidadReservada: newReservada };
    }));
    return true;
  };

  const liberarReservas = (repuestosReservados: RepuestoUsado[], ordenId: string) => {
    setRepuestos(prev => prev.map(r => {
      const res = repuestosReservados.find(rv => rv.repuestoId === r.id);
      if (!res) return r;
      const newReservada = Math.max(0, (r.cantidadReservada || 0) - res.cantidad);
      if (currentUser) {
        setKardex(k => [...k, {
          id: `k${Date.now()}_lib_${r.id}`, repuestoId: r.id, repuestoNombre: r.nombre, tipo: 'liberacion',
          cantidad: res.cantidad, stockResultante: r.cantidad, fecha: new Date().toISOString(),
          usuarioId: currentUser.id, usuarioNombre: currentUser.nombre, ordenId,
          observaciones: `Liberación por ${ordenId}`,
        }]);
      }
      return { ...r, cantidadReservada: newReservada };
    }));
  };

  const addStockRepuesto = (repuestoId: string, cantidad: number, costo?: number, proveedorId?: string) => {
    const rep = repuestos.find(r => r.id === repuestoId);
    if (!rep) return;
    const newCantidad = rep.cantidad + cantidad;
    setRepuestos(p => p.map(r => r.id === repuestoId ? { ...r, cantidad: newCantidad } : r));
    if (currentUser) {
      const prov = proveedores.find(p => p.id === proveedorId);
      setKardex(prev => [...prev, {
        id: `k${Date.now()}`, repuestoId, repuestoNombre: rep.nombre, tipo: 'entrada',
        cantidad, stockResultante: newCantidad, fecha: new Date().toISOString(),
        usuarioId: currentUser.id, usuarioNombre: currentUser.nombre,
        proveedorId, costo,
        observaciones: prov ? `Entrada de ${prov.nombre}` : 'Entrada de stock',
      }]);
    }
  };

  const addKardex = (m: Omit<MovimientoKardex, 'id'>) =>
    setKardex(prev => [...prev, { ...m, id: `k${Date.now()}` }]);

  const addAuditoria = (log: Omit<LogAuditoria, 'id'>) =>
    setAuditoria(prev => [...prev, { ...log, id: `a${Date.now()}` }]);

  const addFactura = (f: Factura) => setFacturas(prev => [...prev, f]);

  const addNotificacion = (n: Omit<Notificacion, 'id' | 'fecha' | 'leida'>) =>
    setNotificaciones(prev => [...prev, { ...n, id: `n${Date.now()}`, fecha: new Date().toISOString(), leida: false }]);

  const marcarNotificacionLeida = (id: string) =>
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));

  const marcarTodasLeidas = () =>
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));

  const updateCatalogs = (c: Partial<Catalogs>) => setCatalogs(p => ({ ...p, ...c }));

  return (
    <AppContext.Provider value={{
      currentUser, login, logout, registerCliente,
      usuarios, personal, clientes, vehiculos, citas, proveedores, ordenes, repuestos, kardex, auditoria, catalogs, facturas,
      addUsuario, updateUsuario, deleteUsuario,
      addPersonal, updatePersonal, deletePersonal,
      addCliente, updateCliente, deleteCliente,
      addVehiculo, updateVehiculo, deleteVehiculo,
      addCita, updateCita, deleteCita, confirmarCita, reprogramarCita, cancelarCita,
      addProveedor, updateProveedor, deleteProveedor,
      addOrden, updateOrden, deleteOrden,
      addRepuesto, updateRepuesto, deleteRepuesto,
      registrarSalidaRepuesto, reservarRepuestos, liberarReservas, addStockRepuesto,
      addKardex, addAuditoria, addFactura,
      notificaciones, addNotificacion, marcarNotificacionLeida, marcarTodasLeidas,
      updateCatalogs,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
