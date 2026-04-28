import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useUsuarios } from '../../hooks/useUsuarios';
import { useClientes } from '../../hooks/useClientes';
import { useCitas } from '../../hooks/useCitas';
import { useOrdenes } from '../../hooks/useOrdenes';
import { useInventario } from '../../hooks/useInventario';
import { usePagos } from '../../hooks/usePagos';
import { useReportes } from '../../hooks/useReportes';
import { useNotificaciones, useAuditoria, useCatalogs } from '../../hooks/useTransversal';
import { supabase } from '../../lib/supabase';

// ─── Types ──────────────────────────────────────────────────────────────────
export type { WorkOrderNote, WorkOrderAttachment, WorkOrderQC, Pago } from '../../lib/supabase';

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
  rol: Rol; activo: boolean; email?: string; telefono?: string; fechaCreacion?: string; direccion?: string;
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
const initialCatalogs = {
  marcas: [
    { nombre: 'Toyota', modelos: ['Corolla', 'Hilux', 'RAV4', 'Yaris', 'Land Cruiser', 'Fortuner'] },
    { nombre: 'Chevrolet', modelos: ['Aveo', 'Sail', 'Tracker', 'D-Max', 'Spark', 'Captiva'] },
    { nombre: 'Hyundai', modelos: ['Tucson', 'Elantra', 'Santa Fe', 'Accent', 'Creta', 'i10'] },
    { nombre: 'Ford', modelos: ['Focus', 'Fiesta', 'Explorer', 'Ranger', 'Ecosport', 'Territory'] },
    { nombre: 'Kia', modelos: ['Sportage', 'Rio', 'Sorento', 'Picanto', 'Seltos', 'Cerato'] },
    { nombre: 'Volkswagen', modelos: ['Golf', 'Jetta', 'Tiguan', 'Polo', 'Passat', 'T-Cross'] },
    { nombre: 'Nissan', modelos: ['Sentra', 'Frontier', 'Kicks', 'Murano', 'Note', 'Versa'] },
    { nombre: 'Honda', modelos: ['Civic', 'CR-V', 'HR-V', 'Pilot', 'Accord', 'Fit'] },
    { nombre: 'Mazda', modelos: ['CX-5', 'CX-3', 'Mazda3', 'Mazda6', 'BT-50'] },
    { nombre: 'Mitsubishi', modelos: ['Outlander', 'Eclipse Cross', 'L200', 'ASX', 'Montero'] },
    { nombre: 'Suzuki', modelos: ['Swift', 'Vitara', 'Jimny', 'Grand Vitara', 'Baleno'] },
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

interface AppContextType {
  // Auth
  currentUser: any;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  registerCliente: (datos: any) => Promise<{ ok: boolean; error?: string }>;

  // Usuarios
  usuarios: any[];
  personal: any[];
  addUsuario: (u: any) => Promise<{ ok: boolean; error?: string }>;
  updateUsuario: (id: string, u: any) => Promise<{ ok: boolean; error?: string }>;
  deleteUsuario: (id: string) => void;
  addPersonal: (p: any) => Promise<void>;
  updatePersonal: (id: string, p: any) => Promise<void>;
  deletePersonal: (id: string) => Promise<void>;

  // Clientes
  clientes: any[];
  vehiculos: any[];
  addCliente: (c: any) => Promise<{ ok: boolean; error?: string }>;
  updateCliente: (id: string, c: any) => Promise<{ ok: boolean; error?: string }>;
  deleteCliente: (id: string) => Promise<{ ok: boolean; error?: string }>;
  addVehiculo: (v: any) => Promise<{ ok: boolean; error?: string }>;
  updateVehiculo: (id: string, v: any) => Promise<{ ok: boolean; error?: string }>;
  deleteVehiculo: (id: string) => Promise<{ ok: boolean; error?: string }>;

  // Citas
  citas: any[];
  addCita: (c: any, creadoPor?: string) => Promise<{ ok: boolean; error?: string }>;
  updateCita: (id: string, c: any) => Promise<{ ok: boolean; error?: string }>;
  deleteCita: (id: string) => Promise<{ ok: boolean; error?: string }>;
  confirmarCita: (id: string) => Promise<{ ok: boolean; error?: string }>;
  reprogramarCita: (id: string, fecha: string, hora: string) => Promise<{ ok: boolean; error?: string }>;
  cancelarCita: (id: string, motivo?: string) => Promise<{ ok: boolean; error?: string }>;
  updateCitaEstado: (id: string, nuevoEstado: any, motivo?: string) => Promise<{ ok: boolean; error?: string }>;

  // Órdenes
  ordenes: any[];
  notasOT: Record<string, any[]>;
  adjuntosOT: Record<string, any[]>;
  qcOT: Record<string, any>;
  pagosOT: Record<string, any[]>;
  addOrden: (o: any) => Promise<void>;
  updateOrden: (id: string, o: any) => Promise<void>;
  deleteOrden: (id: string) => void;
  cargarOrdenesPorEstado: (estado: string) => Promise<void>;
  cerrarOrden: (ordenId: string) => Promise<{ ok: boolean; error?: string }>;
  cargarNotasOT: (ordenId: string) => Promise<void>;
  registrarNotaOT: (ordenId: string, nota: string) => Promise<{ ok: boolean; error?: string }>;
  cargarAdjuntosOT: (ordenId: string) => Promise<void>;
  adjuntarArchivoOT: (ordenId: string, urlArchivo: string) => Promise<{ ok: boolean; error?: string }>;
  iniciarReparacion: (ordenId: string) => Promise<{ ok: boolean; error?: string }>;
  finalizarReparacion: (ordenId: string) => Promise<{ ok: boolean; error?: string }>;
  cargarQCOT: (ordenId: string) => Promise<void>;
  registrarQC: (ordenId: string, aprobado: boolean, observaciones?: string) => Promise<{ ok: boolean; nuevoEstado?: string; error?: string }>;
  rechazarCotizacion: (ordenId: string, clienteId?: string, montoDiagnostico?: number) => Promise<void>;
  aprobarCotizacion: (ordenId: string) => Promise<void>;
  asignarMecanico: (ordenId: string, mecanicoId: string) => Promise<{ ok: boolean; error?: string }>;

  // Inventario
  repuestos: any[];
  kardex: any[];
  proveedores: any[];
  addRepuesto: (r: any) => Promise<{ ok: boolean; error?: string }>;
  updateRepuesto: (id: string, r: any) => void;
  deleteRepuesto: (id: string) => void;
  registrarSalidaRepuesto: (repuestoId: string, cantidad: number, ordenId?: string) => Promise<boolean>;
  reservarRepuestos: (repuestosReservados: any[], ordenId: string) => Promise<boolean>;
  liberarReservas: (repuestosReservados: any[], ordenId: string) => Promise<void>;
  addStockRepuesto: (repuestoId: string, cantidad: number, costo?: number, proveedorId?: string) => void;
  obtenerAlertasInventario: () => Promise<any[]>;
  addKardex: (m: any) => void;
  addProveedor: (p: any) => Promise<{ ok: boolean; error?: string }>;
  updateProveedor: (id: string, p: any) => Promise<{ ok: boolean; error?: string }>;
  deleteProveedor: (id: string) => Promise<{ ok: boolean; error?: string }>;

  // Pagos
  facturas: any[];
  facturasOT: Record<string, any[]>;
  addFactura: (f: any) => Promise<void>;
  updateFactura: (numero: string, f: any) => Promise<void>;
  registrarPago: (ordenId: string, metodo: any, monto: number, referencia?: string) => Promise<{ ok: boolean; confirmado?: boolean; error?: string }>;
  confirmarPago: (pagoId: string) => Promise<{ ok: boolean; error?: string }>;
  cargarPagosOT: (ordenId: string) => Promise<void>;
  cargarFacturasOT: (ordenId: string) => Promise<void>;
  generarFactura: (pagoId: string) => Promise<{ ok: boolean; numero?: string; subtotal?: number; iva?: number; total?: number; error?: string }>;
  generarHtmlFactura: (facturaId: string) => Promise<{ ok: boolean; html?: string; error?: string }>;
  guardarUrlPdfFactura: (facturaId: string, urlPdf: string) => Promise<{ ok: boolean; error?: string }>;
  obtenerFacturaPorOrden: (ordenId: string) => Promise<{ ok?: boolean; id?: string; numero?: string; urlPdf?: string; subtotal?: number; iva?: number; total?: number; error?: string }>;

  // Notificaciones
  notificaciones: any[];
  addNotificacion: (n: any) => Promise<void>;
  marcarNotificacionLeida: (id: string) => Promise<void>;
  marcarTodasLeidas: () => Promise<void>;

  // Auditoría
  auditoria: any[];
  addAuditoria: (log: any) => Promise<void>;

  // Catálogos
  catalogs: any;
  updateCatalogs: (c: any) => void;

  // Reportes
  generarReporteIngresos: (fechaInicio: string, fechaFin: string) => Promise<any>;
  generarReporteProductividad: () => Promise<any>;
  generarReporteValorInventario: () => Promise<any>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const usuarios = useUsuarios(auth.currentUser ? true : false);
  const clientes = useClientes(auth.currentUser ? true : false);
  const citas = useCitas(auth.currentUser ? true : false, auth.currentUser?.id, auth.currentUser?.rol);
  const ordenes = useOrdenes(auth.currentUser ? true : false, auth.currentUser?.id, auth.currentUser?.rol);
  const inventario = useInventario(auth.currentUser ? true : false);
  const pagos = usePagos(auth.currentUser ? true : false);
  const reportes = useReportes(auth.currentUser?.rol !== 'administrador');
  const notificaciones = useNotificaciones(auth.currentUser ? true : false);
  const auditoria = useAuditoria();
  const catalogs = useCatalogs(initialCatalogs);

  const logout = () => {
    auth.logout();
    window.location.href = '/login';
  };

  const marcarTodasLeidas = async () => {
    if (!auth.currentUser) return;
    await notificaciones.marcarTodasLeidas(auth.currentUser.id);
  };

  const addKardex = (m: any) => {
    // Kardex se maneja desde inventario, aquí es solo para compatibilidad
    console.log('Kardex registrado:', m);
  };

  const value: AppContextType = {
    // Auth
    currentUser: auth.currentUser,
    login: auth.login,
    logout,
    registerCliente: auth.registerCliente,

    // Usuarios
    usuarios: usuarios.usuarios,
    personal: usuarios.personal,
    addUsuario: usuarios.addUsuario,
    updateUsuario: usuarios.updateUsuario,
    deleteUsuario: usuarios.deleteUsuario,
    addPersonal: usuarios.addPersonal,
    updatePersonal: usuarios.updatePersonal,
    deletePersonal: usuarios.deletePersonal,

    // Clientes
    clientes: clientes.clientes,
    vehiculos: clientes.vehiculos,
    addCliente: clientes.addCliente,
    updateCliente: clientes.updateCliente,
    deleteCliente: clientes.deleteCliente,
    addVehiculo: clientes.addVehiculo,
    updateVehiculo: clientes.updateVehiculo,
    deleteVehiculo: clientes.deleteVehiculo,

    // Citas
    citas: citas.citas,
    addCita: citas.addCita,
    updateCita: citas.updateCita,
    deleteCita: citas.deleteCita,
    confirmarCita: citas.confirmarCita,
    reprogramarCita: citas.reprogramarCita,
    cancelarCita: citas.cancelarCita,
    updateCitaEstado: citas.updateCitaEstado,

    // Órdenes
    ordenes: ordenes.ordenes,
    notasOT: ordenes.notasOT,
    adjuntosOT: ordenes.adjuntosOT,
    qcOT: ordenes.qcOT,
    pagosOT: ordenes.pagosOT,
    addOrden: ordenes.addOrden,
    updateOrden: ordenes.updateOrden,
    deleteOrden: ordenes.deleteOrden,
    cargarOrdenesPorEstado: ordenes.cargarOrdenesPorEstado,
    cerrarOrden: ordenes.cerrarOrden,
    cargarNotasOT: ordenes.cargarNotasOT,
    registrarNotaOT: ordenes.registrarNotaOT,
    cargarAdjuntosOT: ordenes.cargarAdjuntosOT,
    adjuntarArchivoOT: ordenes.adjuntarArchivoOT,
    iniciarReparacion: ordenes.iniciarReparacion,
    finalizarReparacion: ordenes.finalizarReparacion,
    cargarQCOT: ordenes.cargarQCOT,
    registrarQC: ordenes.registrarQC,
    rechazarCotizacion: ordenes.rechazarCotizacion,
    aprobarCotizacion: ordenes.aprobarCotizacion,
    asignarMecanico: ordenes.asignarMecanico,

    // Inventario
    repuestos: inventario.repuestos,
    kardex: inventario.kardex,
    proveedores: inventario.proveedores,
    addRepuesto: inventario.addRepuesto,
    updateRepuesto: inventario.updateRepuesto,
    deleteRepuesto: inventario.deleteRepuesto,
    registrarSalidaRepuesto: inventario.registrarSalidaRepuesto,
    reservarRepuestos: inventario.reservarRepuestos,
    liberarReservas: inventario.liberarReservas,
    addStockRepuesto: inventario.addStockRepuesto,
    obtenerAlertasInventario: inventario.obtenerAlertasInventario,
    addKardex,
    addProveedor: inventario.addProveedor,
    updateProveedor: inventario.updateProveedor,
    deleteProveedor: inventario.deleteProveedor,

    // Pagos
    facturas: pagos.facturas,
    facturasOT: pagos.facturasOT,
    addFactura: pagos.addFactura,
    updateFactura: pagos.updateFactura,
    registrarPago: pagos.registrarPago,
    confirmarPago: pagos.confirmarPago,
    cargarPagosOT: pagos.cargarPagosOT,
    cargarFacturasOT: pagos.cargarFacturasOT,
    generarFactura: pagos.generarFactura,
    generarHtmlFactura: pagos.generarHtmlFactura,
    guardarUrlPdfFactura: pagos.guardarUrlPdfFactura,
    obtenerFacturaPorOrden: pagos.obtenerFacturaPorOrden,

    // Notificaciones
    notificaciones: notificaciones.notificaciones,
    addNotificacion: notificaciones.addNotificacion,
    marcarNotificacionLeida: notificaciones.marcarNotificacionLeida,
    marcarTodasLeidas,

    // Auditoría
    auditoria: auditoria.auditoria,
    addAuditoria: auditoria.addAuditoria,

    // Catálogos
    catalogs: catalogs.catalogs,
    updateCatalogs: catalogs.updateCatalogs,

    // Reportes
    generarReporteIngresos: reportes.generarReporteIngresos,
    generarReporteProductividad: reportes.generarReporteProductividad,
    generarReporteValorInventario: reportes.generarReporteValorInventario,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
