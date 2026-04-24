import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase, RpcUser } from '../../lib/supabase';
export type { WorkOrderNote, WorkOrderAttachment, WorkOrderQC } from '../../lib/supabase';

// ─── Types ──────────────────────────────────────────────────────────────────

export type Rol = 'administrador' | 'asesor' | 'mecanico' | 'jefe_taller' | 'cliente';

export type EstadoOrden =
  | 'registrada'
  | 'asignada'
  | 'en_diagnostico'
  | 'esperando_aprobacion'
  | 'en_reparacion'
  | 'liquidacion_diagnostico'
  | 'control_calidad'
  | 'liberada'
  | 'finalizada'
  | 'cancelada';

export type EstadoCita = 'pendiente' | 'confirmada' | 'en_progreso' | 'completada' | 'cancelada' | 'reprogramada';

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
  descripcionProblema: string; tipoServicio?: string; kmEntrada?: number;
  mecanicoId?: string; mecanicosIds?: string[];
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
  cliente?: Cliente;
  vehiculo?: Vehiculo;
  factura?: Factura;
  cobroDiagnostico?: { estado: string };
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
  updateCitaEstado: (id: string, nuevoEstado: EstadoCita, motivo?: string) => Promise<{ ok: boolean; error?: string }>;

  addProveedor: (p: Omit<Proveedor, 'id'>) => void;
  updateProveedor: (id: string, p: Partial<Proveedor>) => void;
  deleteProveedor: (id: string) => void;

  addOrden: (o: Omit<OrdenTrabajo, 'id' | 'numero' | 'fechaCreacion' | 'fechaActualizacion' | 'repuestosUsados' | 'entregaFirmada'>) => void;
  updateOrden: (id: string, o: Partial<OrdenTrabajo>) => void;
  deleteOrden: (id: string) => void;
  cargarOrdenesPorEstado: (estado: string) => Promise<void>;
  cerrarOrden: (ordenId: string) => Promise<{ ok: boolean; error?: string }>;

  addRepuesto: (r: Omit<Repuesto, 'id'>) => Promise<{ ok: boolean; error?: string }>;
  updateRepuesto: (id: string, r: Partial<Repuesto>) => void;
  deleteRepuesto: (id: string) => void;
  registrarSalidaRepuesto: (repuestoId: string, cantidad: number, ordenId?: string) => Promise<boolean>;
  reservarRepuestos: (repuestosReservados: RepuestoUsado[], ordenId: string) => Promise<boolean>;
  liberarReservas: (repuestosReservados: RepuestoUsado[], ordenId: string) => void;
  addStockRepuesto: (repuestoId: string, cantidad: number, costo?: number, proveedorId?: string) => void;

  addKardex: (m: Omit<MovimientoKardex, 'id'>) => void;
  addAuditoria: (log: Omit<LogAuditoria, 'id'>) => void;
  addFactura: (f: Factura) => void;
  updateFactura: (numero: string, f: Partial<Factura>) => void;
  rechazarCotizacion: (ordenId: string, montoDiagnostico?: number) => Promise<void>;
  aprobarCotizacion: (ordenId: string) => Promise<void>;

  notificaciones: Notificacion[];
  addNotificacion: (n: Omit<Notificacion, 'id' | 'fecha' | 'leida'>) => Promise<void>;
  marcarNotificacionLeida: (id: string) => Promise<void>;
  marcarTodasLeidas: () => Promise<void>;

  updateCatalogs: (c: Partial<Catalogs>) => void;

  notasOT: Record<string, import('../../lib/supabase').WorkOrderNote[]>;
  adjuntosOT: Record<string, import('../../lib/supabase').WorkOrderAttachment[]>;
  cargarNotasOT: (ordenId: string) => Promise<void>;
  cargarAdjuntosOT: (ordenId: string) => Promise<void>;
  registrarNotaOT: (ordenId: string, nota: string) => Promise<{ ok: boolean; error?: string }>;
  adjuntarArchivoOT: (ordenId: string, urlArchivo: string) => Promise<{ ok: boolean; error?: string }>;
  iniciarReparacion: (ordenId: string) => Promise<{ ok: boolean; error?: string }>;
  finalizarReparacion: (ordenId: string) => Promise<{ ok: boolean; error?: string }>;

  qcOT: Record<string, import('../../lib/supabase').WorkOrderQC | null>;
  cargarQCOT: (ordenId: string) => Promise<void>;
  registrarQC: (ordenId: string, aprobado: boolean, observaciones?: string) => Promise<{ ok: boolean; nuevoEstado?: string; error?: string }>;
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
  const [notasOT, setNotasOT] = useState<Record<string, import('../../lib/supabase').WorkOrderNote[]>>({});
  const [adjuntosOT, setAdjuntosOT] = useState<Record<string, import('../../lib/supabase').WorkOrderAttachment[]>>({});
  const [qcOT, setQCOT] = useState<Record<string, import('../../lib/supabase').WorkOrderQC | null>>({});

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

    supabase.rpc('listar_ordenes', {
      p_usuario_id: currentUser.id,
      p_rol:        currentUser.rol
    }).then(({ data }) => {
      if (Array.isArray(data)) setOrdenes(data as OrdenTrabajo[]);
    });

    supabase.rpc('listar_facturas').then(({ data }) => {
      if (Array.isArray(data)) setFacturas(data as Factura[]);
    });

    supabase.rpc('listar_repuestos').then(({ data }) => {
      if (Array.isArray(data)) setRepuestos(data as Repuesto[]);
    });
    supabase.rpc('listar_notificaciones').then(({ data }) => {
      if (Array.isArray(data)) setNotificaciones(data as Notificacion[]);
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

  const updateCitaEstado = async (id: string, nuevoEstado: EstadoCita, motivo?: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      // Intentamos usar el RPC específico para cambio de estado (que maneja auditoría)
      const { data, error } = await supabase.rpc('actualizar_cita_estado', {
        p_cita_id: id,
        p_nuevo_estado: nuevoEstado,
        p_usuario_id: currentUser?.id,
        p_motivo: motivo ?? null
      });

      if (error) {
        // Fallback al update genérico si el RPC específico no existe todavía
        console.warn('RPC actualizar_cita_estado no disponible, usando update genérico:', error.message);
        return await updateCita(id, { estado: nuevoEstado, notas: motivo });
      }

      if (!data?.success) return { ok: false, error: data?.error ?? 'Error al cambiar estado' };

      // Actualizar localmente
      setCitas(prev => prev.map(c => c.id === id ? { ...c, estado: nuevoEstado, notas: motivo ?? c.notas } : c));
      
      // Registrar auditoría localmente también
      addAuditoria({
        fecha: new Date().toISOString(),
        usuarioId: currentUser?.id ?? 'sistema',
        usuarioNombre: currentUser?.nombre ?? 'Sistema',
        accion: 'ACTUALIZAR_ESTADO_CITA',
        modulo: 'Citas',
        detalles: `Cita ${id} cambió a ${nuevoEstado}. Motivo: ${motivo ?? 'N/A'}`
      });

      return { ok: true };
    } catch (err: any) {
      console.error('Error en updateCitaEstado:', err);
      return { ok: false, error: 'Error de conexión' };
    }
  };

  const addProveedor = (p: Omit<Proveedor, 'id'>) => setProveedores(prev => [...prev, { ...p, id: `pv${Date.now()}` }]);
  const updateProveedor = (id: string, p: Partial<Proveedor>) => setProveedores(prev => prev.map(x => x.id === id ? { ...x, ...p } : x));
  const deleteProveedor = (id: string) => setProveedores(prev => prev.filter(x => x.id !== id));

  const addOrden = async (o: Omit<OrdenTrabajo, 'id' | 'numero' | 'fechaCreacion' | 'fechaActualizacion' | 'repuestosUsados' | 'entregaFirmada'>) => {
    if (!currentUser) return;
    const { data, error } = await supabase.rpc('crear_orden', {
      p_tipo_servicio: o.tipoServicio,
      p_cliente_id: o.clienteId,
      p_vehiculo_id: o.vehiculoId,
      p_creado_por: currentUser.id,
      p_datos: { ...o, repuestosUsados: [], entregaFirmada: false }
    });
    if (error) return;
    if (data?.ok && data.orden) {
      const orden = data.orden as OrdenTrabajo;
      setOrdenes(prev => [...prev, orden]);
    }
  };

  const updateOrden = async (id: string, o: Partial<OrdenTrabajo>) => {
    const { error } = await supabase.rpc('actualizar_orden', {
      p_id: id,
      p_estado: o.estado,
      p_mecanico_id: o.mecanicoId,
      p_factura_id: o.facturaId,
      p_datos: o
    });
    if (!error) {
      setOrdenes(p => p.map(x => x.id === id ? { ...x, ...o, fechaActualizacion: new Date().toISOString().split('T')[0] } : x));
    }
  };

  const deleteOrden = (id: string) => setOrdenes(p => p.filter(x => x.id !== id));

  const cargarOrdenesPorEstado = async (estado: string) => {
    const { data } = await supabase.rpc('listar_ordenes_por_estado', { p_estado: estado });
    if (Array.isArray(data)) setOrdenes(data as OrdenTrabajo[]);
  };

  const cerrarOrden = async (ordenId: string): Promise<{ ok: boolean; error?: string }> => {
    if (!currentUser) return { ok: false, error: 'No hay usuario autenticado' };
    const { data, error } = await supabase.rpc('cerrar_orden', {
      p_orden_id: ordenId,
      p_asesor_id: currentUser.id
    });
    if (error) return { ok: false, error: error.message };
    if (data?.ok) {
      await supabase.rpc('listar_ordenes', { p_usuario_id: currentUser.id, p_rol: currentUser.rol })
        .then(({ data }) => { if (Array.isArray(data)) setOrdenes(data as OrdenTrabajo[]); });
      return { ok: true };
    }
    return { ok: false, error: data?.error };
  };

  const addRepuesto = async (r: Omit<Repuesto, 'id'>): Promise<{ ok: boolean; error?: string }> => {
    const { data, error } = await supabase.rpc('crear_repuesto', {
      p_nombre: r.nombre,
      p_categoria: r.categoria,
      p_costo: r.costo,
      p_margen_ganancia: r.margenGanancia,
      p_cantidad: r.cantidad || 0,
      p_stock_minimo: r.stockMinimo || 1,
      p_proveedor_id: r.proveedorId ?? null,
      p_imagen: r.imagen ?? null
    });
    if (error) return { ok: false, error: error.message };
    if (data?.ok) setRepuestos(p => [...p, data.repuesto as Repuesto]);
    return data?.ok ? { ok: true } : { ok: false, error: data?.error };
  };
  const updateRepuesto = (id: string, r: Partial<Repuesto>) => setRepuestos(p => p.map(x => x.id === id ? { ...x, ...r } : x));
  const deleteRepuesto = (id: string) => setRepuestos(p => p.filter(x => x.id !== id));

  const registrarSalidaRepuesto = async (repuestoId: string, cantidad: number, ordenId?: string): Promise<boolean> => {
    const rep = repuestos.find(r => r.id === repuestoId);
    if (!rep || rep.cantidad < cantidad) return false;
    const newCantidad = rep.cantidad - cantidad;
    
    await supabase.rpc('actualizar_repuesto', { p_id: repuestoId, p_cantidad: newCantidad });
    if (currentUser) {
      await supabase.rpc('registrar_movimiento_kardex', {
        p_repuesto_id: repuestoId, p_repuesto_nombre: rep.nombre, p_tipo: 'salida',
        p_cantidad: cantidad, p_stock_resultante: newCantidad,
        p_usuario_id: currentUser.id, p_usuario_nombre: currentUser.nombre,
        p_orden_id: ordenId, p_observaciones: ordenId ? `Salida por ${ordenId}` : 'Salida manual'
      });
    }
    setRepuestos(p => p.map(r => r.id === repuestoId ? { ...r, cantidad: newCantidad } : r));
    return true;
  };

  const reservarRepuestos = async (repuestosReservados: RepuestoUsado[], ordenId: string): Promise<boolean> => {
    for (const rep of repuestosReservados) {
      const stock = repuestos.find(r => r.id === rep.repuestoId);
      if (!stock || (stock.cantidad - (stock.cantidadReservada || 0)) < rep.cantidad) return false;
    }

    for (const res of repuestosReservados) {
      const r = repuestos.find(x => x.id === res.repuestoId)!;
      const newReservada = (r.cantidadReservada || 0) + res.cantidad;
      await supabase.rpc('actualizar_repuesto', { p_id: r.id, p_cantidad_reservada: newReservada });
      if (currentUser) {
        await supabase.rpc('registrar_movimiento_kardex', {
          p_repuesto_id: r.id, p_repuesto_nombre: r.nombre, p_tipo: 'reserva',
          p_cantidad: res.cantidad, p_stock_resultante: r.cantidad,
          p_usuario_id: currentUser.id, p_usuario_nombre: currentUser.nombre,
          p_orden_id: ordenId, p_observaciones: `Reserva para ${ordenId}`
        });
      }
    }
    setRepuestos(prev => prev.map(r => {
      const res = repuestosReservados.find(rv => rv.repuestoId === r.id);
      return res ? { ...r, cantidadReservada: (r.cantidadReservada || 0) + res.cantidad } : r;
    }));
    return true;
  };

  const liberarReservas = async (repuestosReservados: RepuestoUsado[], ordenId: string) => {
    for (const res of repuestosReservados) {
      const r = repuestos.find(x => x.id === res.repuestoId);
      if (!r) continue;
      const newReservada = Math.max(0, (r.cantidadReservada || 0) - res.cantidad);
      await supabase.rpc('actualizar_repuesto', { p_id: r.id, p_cantidad_reservada: newReservada });
      if (currentUser) {
        await supabase.rpc('registrar_movimiento_kardex', {
          p_repuesto_id: r.id, p_repuesto_nombre: r.nombre, p_tipo: 'liberacion',
          p_cantidad: res.cantidad, p_stock_resultante: r.cantidad,
          p_usuario_id: currentUser.id, p_usuario_nombre: currentUser.nombre,
          p_orden_id: ordenId, p_observaciones: `Liberación por ${ordenId}`
        });
      }
    }
    setRepuestos(prev => prev.map(r => {
      const res = repuestosReservados.find(rv => rv.repuestoId === r.id);
      return res ? { ...r, cantidadReservada: Math.max(0, (r.cantidadReservada || 0) - res.cantidad) } : r;
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

  const addAuditoria = async (log: Omit<LogAuditoria, 'id'>) => {
    await supabase.rpc('insertar_log_auditoria', {
      p_usuario_id: log.usuarioId,
      p_usuario_nombre: log.usuarioNombre,
      p_accion: log.accion,
      p_modulo: log.modulo,
      p_detalles: log.detalles,
      p_entidad_id: log.entidadId,
      p_entidad_tipo: log.entidadTipo
    });
    setAuditoria(prev => [...prev, { ...log, id: `a${Date.now()}` }]);
  };

  const addFactura = async (f: Factura) => {
    const { error } = await supabase.rpc('crear_factura', {
      p_numero: f.numero,
      p_orden_id: f.ordenId,
      p_cliente_id: f.clienteId,
      p_subtotal: f.subtotal,
      p_impuesto: f.impuesto,
      p_total: f.total,
      p_metodo_pago: f.metodoPago,
      p_estado: f.estado,
      p_datos: f
    });
    if (!error) setFacturas(prev => [...prev, f]);
  };

  const updateFactura = async (numero: string, data: Partial<Factura>) => {
    const { error } = await supabase.rpc('actualizar_factura', {
      p_numero: numero,
      p_estado: data.estado,
      p_metodo_pago: data.metodoPago
    });
    if (!error) setFacturas(prev => prev.map(f => f.numero === numero ? { ...f, ...data } : f));
  };

  const rechazarCotizacion = async (ordenId: string, montoDiagnostico?: number) => {
    if (!currentUser) return;
    const costoDx = montoDiagnostico || 0;
    const { data } = await supabase.rpc('rechazar_cotizacion', {
      p_orden_id: ordenId,
      p_cliente_id: currentUser.id,
      p_monto_diagnostico: costoDx
    });
    if (data?.ok) {
      const { data: updated } = await supabase.rpc('listar_ordenes', {
        p_usuario_id: currentUser.id,
        p_rol: currentUser.rol
      });
      if (Array.isArray(updated)) setOrdenes(updated as OrdenTrabajo[]);
    }
  };

  const aprobarCotizacion = async (ordenId: string) => {
    if (!currentUser) return;
    const { data } = await supabase.rpc('aprobar_cotizacion', {
      p_orden_id: ordenId,
      p_cliente_id: currentUser.id
    });
    if (data?.ok) {
      const { data: updated } = await supabase.rpc('listar_ordenes', {
        p_usuario_id: currentUser.id,
        p_rol: currentUser.rol
      });
      if (Array.isArray(updated)) setOrdenes(updated as OrdenTrabajo[]);
    }
  };

  const addNotificacion = async (n: Omit<Notificacion, 'id' | 'fecha' | 'leida'>) => {
    const { error } = await supabase.rpc('crear_notificacion', {
      p_tipo: n.tipo,
      p_titulo: n.titulo,
      p_mensaje: n.mensaje,
      p_para_rol: n.paraRol,
      p_para_usuario_id: n.paraUsuarioId || null,
      p_referencia_id: n.referenciaId || null,
      p_referencia_tipo: n.referenciaTipo || null
    });
    if (!error) {
      const { data } = await supabase.rpc('listar_notificaciones');
      if (Array.isArray(data)) setNotificaciones(data as Notificacion[]);
    }
  };

  const marcarNotificacionLeida = async (id: string) => {
    const { error } = await supabase.rpc('marcar_notificacion_leida', { p_id: id });
    if (!error) {
      setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
    }
  };

  const marcarTodasLeidas = async () => {
    if (!currentUser) return;
    const { error } = await supabase.rpc('marcar_todas_leidas', { p_usuario_id: currentUser.id });
    if (!error) {
      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
    }
  };

  const cargarNotasOT = async (ordenId: string) => {
    const { data } = await supabase.rpc('listar_notas_ot', { p_orden_id: ordenId });
    if (Array.isArray(data)) setNotasOT(prev => ({ ...prev, [ordenId]: data }));
  };

  const cargarAdjuntosOT = async (ordenId: string) => {
    const { data } = await supabase.rpc('listar_adjuntos_ot', { p_orden_id: ordenId });
    if (Array.isArray(data)) setAdjuntosOT(prev => ({ ...prev, [ordenId]: data }));
  };

  const registrarNotaOT = async (ordenId: string, nota: string): Promise<{ ok: boolean; error?: string }> => {
    if (!currentUser) return { ok: false, error: 'Sin sesión' };
    const { data, error } = await supabase.rpc('registrar_nota_ot', {
      p_orden_id: ordenId, p_autor_id: currentUser.id, p_nota: nota,
    });
    if (error) return { ok: false, error: error.message };
    return data?.ok ? { ok: true } : { ok: false, error: data?.error };
  };

  const adjuntarArchivoOT = async (ordenId: string, urlArchivo: string): Promise<{ ok: boolean; error?: string }> => {
    if (!currentUser) return { ok: false, error: 'Sin sesión' };
    const { data, error } = await supabase.rpc('adjuntar_archivo_ot', {
      p_orden_id: ordenId, p_usuario_id: currentUser.id, p_url_archivo: urlArchivo,
    });
    if (error) return { ok: false, error: error.message };
    return data?.ok ? { ok: true } : { ok: false, error: data?.error };
  };

  const iniciarReparacion = async (ordenId: string): Promise<{ ok: boolean; error?: string }> => {
    if (!currentUser) return { ok: false, error: 'Sin sesión' };
    const { data, error } = await supabase.rpc('iniciar_reparacion', {
      p_orden_id: ordenId, p_mecanico_id: currentUser.id,
    });
    if (error) return { ok: false, error: error.message };
    if (!data?.ok) return { ok: false, error: data?.error };
    setOrdenes(p => p.map(o => o.id === ordenId ? { ...o, estado: 'en_reparacion' as const, fechaActualizacion: new Date().toISOString().split('T')[0] } : o));
    return { ok: true };
  };

  const finalizarReparacion = async (ordenId: string): Promise<{ ok: boolean; error?: string }> => {
    if (!currentUser) return { ok: false, error: 'Sin sesión' };
    const { data, error } = await supabase.rpc('finalizar_reparacion', {
      p_orden_id: ordenId, p_mecanico_id: currentUser.id,
    });
    if (error) return { ok: false, error: error.message };
    if (!data?.ok) return { ok: false, error: data?.error };
    setOrdenes(p => p.map(o => o.id === ordenId ? { ...o, estado: 'control_calidad' as const, fechaActualizacion: new Date().toISOString().split('T')[0] } : o));
    return { ok: true };
  };

  const cargarQCOT = async (ordenId: string) => {
    const { data } = await supabase.rpc('listar_qc_ot', { p_orden_id: ordenId });
    if (Array.isArray(data) && data.length > 0) {
      setQCOT(prev => ({ ...prev, [ordenId]: data[0] }));
    }
  };

  const registrarQC = async (ordenId: string, aprobado: boolean, observaciones?: string): Promise<{ ok: boolean; nuevoEstado?: string; error?: string }> => {
    if (!currentUser) return { ok: false, error: 'Sin sesión' };
    const { data, error } = await supabase.rpc('registrar_qc', {
      p_orden_id: ordenId, p_inspector_id: currentUser.id, p_aprobado: aprobado, p_observaciones: observaciones || null,
    });
    if (error) return { ok: false, error: error.message };
    if (!data?.ok) return { ok: false, error: data?.error };
    const nuevoEstado = data.nuevoEstado;
    setOrdenes(p => p.map(o => o.id === ordenId ? { ...o, estado: nuevoEstado === 'liberada' ? 'liberada' : 'en_reparacion', fechaActualizacion: new Date().toISOString().split('T')[0] } : o));
    await cargarQCOT(ordenId);
    return { ok: true, nuevoEstado };
  };

  const updateCatalogs = (c: Partial<Catalogs>) => setCatalogs(p => ({ ...p, ...c }));

  return (
    <AppContext.Provider value={{
      currentUser, login, logout, registerCliente,
      usuarios, personal, clientes, vehiculos, citas, proveedores, ordenes, repuestos, kardex, auditoria, catalogs, facturas,
      addUsuario, updateUsuario, deleteUsuario,
      addPersonal, updatePersonal, deletePersonal,
      addCliente, updateCliente, deleteCliente,
      addVehiculo, updateVehiculo, deleteVehiculo,
      addCita, updateCita, deleteCita, confirmarCita, reprogramarCita, cancelarCita, updateCitaEstado,
      addProveedor, updateProveedor, deleteProveedor,
      addOrden, updateOrden, deleteOrden, cargarOrdenesPorEstado, cerrarOrden,
      addRepuesto, updateRepuesto, deleteRepuesto,
      registrarSalidaRepuesto, reservarRepuestos, liberarReservas, addStockRepuesto,
      addKardex, addAuditoria, addFactura, updateFactura, rechazarCotizacion, aprobarCotizacion,
      notificaciones, addNotificacion, marcarNotificacionLeida, marcarTodasLeidas,
      updateCatalogs,
      notasOT, adjuntosOT, cargarNotasOT, cargarAdjuntosOT,
      registrarNotaOT, adjuntarArchivoOT, iniciarReparacion, finalizarReparacion,
      qcOT, cargarQCOT, registrarQC,
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
