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
  año: number; color: string; chasis?: string; kilometraje?: string;
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
  login: (username: string, password: string) => Promise<boolean>;
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

  addUsuario: (u: Omit<Usuario, 'id'>) => void;
  updateUsuario: (id: string, u: Partial<Usuario>) => void;
  deleteUsuario: (id: string) => void;

  addPersonal: (p: Omit<PersonalTaller, 'id'>) => void;
  updatePersonal: (id: string, p: Partial<PersonalTaller>) => void;
  deletePersonal: (id: string) => void;

  addCliente: (c: Omit<Cliente, 'id' | 'fechaRegistro'>) => void;
  updateCliente: (id: string, c: Partial<Cliente>) => void;
  deleteCliente: (id: string) => void;

  addVehiculo: (v: Omit<Vehiculo, 'id'>) => void;
  updateVehiculo: (id: string, v: Partial<Vehiculo>) => void;
  deleteVehiculo: (id: string) => void;

  addCita: (c: Omit<Cita, 'id'>) => void;
  updateCita: (id: string, c: Partial<Cita>) => void;
  deleteCita: (id: string) => void;

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

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Llamada al RPC server-side (SECURITY DEFINER — bypasea RLS, mapea roles)
      const { data, error } = await supabase.rpc('login_usuario', {
        p_username: username,
        p_password: password,
      });

      if (!error && data?.success && data?.user) {
        const user = rpcUserToUsuario(data.user as RpcUser);
        setCurrentUser(user);
        addAuditoria({ fecha: new Date().toISOString(), usuarioId: user.id, usuarioNombre: user.nombre, accion: 'LOGIN', modulo: 'Sistema', detalles: `Inicio de sesión — Rol: ${user.rol}` });
        return true;
      }

      // Si el RPC existe pero las credenciales son incorrectas, no hacer fallback
      if (!error && data && !data.success) return false;

      // Fallback a datos locales solo cuando el RPC falla (no está creado aún en Supabase)
      console.warn('RPC login_usuario no disponible, usando datos locales:', error?.message);
      const localUser = usuarios.find(u => u.username === username && u.password === password && u.activo);
      if (localUser) {
        setCurrentUser(localUser);
        addAuditoria({ fecha: new Date().toISOString(), usuarioId: localUser.id, usuarioNombre: localUser.nombre, accion: 'LOGIN', modulo: 'Sistema', detalles: `Inicio de sesión (local) — Rol: ${localUser.rol}` });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error en login:', err);
      return false;
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
    setCurrentUser(null);
  };

  const addUsuario = (u: Omit<Usuario, 'id'>) => setUsuarios(p => [...p, { ...u, id: `u${Date.now()}` }]);
  const updateUsuario = (id: string, u: Partial<Usuario>) => setUsuarios(p => p.map(x => x.id === id ? { ...x, ...u } : x));
  const deleteUsuario = (id: string) => setUsuarios(p => p.filter(x => x.id !== id));

  const addPersonal = (p: Omit<PersonalTaller, 'id'>) => setPersonal(prev => [...prev, { ...p, id: `p${Date.now()}` }]);
  const updatePersonal = (id: string, p: Partial<PersonalTaller>) => setPersonal(prev => prev.map(x => x.id === id ? { ...x, ...p } : x));
  const deletePersonal = (id: string) => setPersonal(prev => prev.filter(x => x.id !== id));

  const addCliente = (c: Omit<Cliente, 'id' | 'fechaRegistro'>) =>
    setClientes(p => [...p, { ...c, id: `c${Date.now()}`, fechaRegistro: new Date().toISOString().split('T')[0] }]);
  const updateCliente = (id: string, c: Partial<Cliente>) => setClientes(p => p.map(x => x.id === id ? { ...x, ...c } : x));
  const deleteCliente = (id: string) => setClientes(p => p.filter(x => x.id !== id));

  const addVehiculo = (v: Omit<Vehiculo, 'id'>) => setVehiculos(p => [...p, { ...v, id: `v${Date.now()}` }]);
  const updateVehiculo = (id: string, v: Partial<Vehiculo>) => setVehiculos(p => p.map(x => x.id === id ? { ...x, ...v } : x));
  const deleteVehiculo = (id: string) => setVehiculos(p => p.filter(x => x.id !== id));

  const addCita = (c: Omit<Cita, 'id'>) => setCitas(p => [...p, { ...c, id: `ct${Date.now()}` }]);
  const updateCita = (id: string, c: Partial<Cita>) => setCitas(p => p.map(x => x.id === id ? { ...x, ...c } : x));
  const deleteCita = (id: string) => setCitas(p => p.filter(x => x.id !== id));

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
      addCita, updateCita, deleteCita,
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
