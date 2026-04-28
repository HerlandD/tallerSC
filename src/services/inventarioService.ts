import { supabase } from '../lib/supabase';
import type { Repuesto, RepuestoUsado, MovimientoKardex, Proveedor } from '../app/context/AppContext';

export const inventarioService = {
  listarRepuestos: () => supabase.rpc('listar_repuestos'),

  crearRepuesto: (r: Omit<Repuesto, 'id'>) =>
    supabase.rpc('crear_repuesto', {
      p_nombre: r.nombre,
      p_categoria: r.categoria,
      p_costo: r.costo,
      p_margen_ganancia: r.margenGanancia,
      p_cantidad: r.cantidad || 0,
      p_stock_minimo: r.stockMinimo || 1,
      p_proveedor_id: r.proveedorId || null,
      p_imagen: r.imagen ?? null,
    }),

  actualizarRepuesto: (id: string, cambios: Partial<Repuesto>) =>
    supabase.rpc('actualizar_repuesto', {
      p_id: id,
      p_nombre: cambios.nombre ?? null,
      p_categoria: cambios.categoria ?? null,
      p_costo: cambios.costo ?? null,
      p_margen_ganancia: cambios.margenGanancia ?? null,
      p_precio: cambios.precio ?? null,
      p_stock_minimo: cambios.stockMinimo ?? null,
      p_cantidad: cambios.cantidad ?? null,
      p_cantidad_reservada: cambios.cantidadReservada ?? null,
      p_proveedor_id: cambios.proveedorId || null,
      p_imagen: cambios.imagen ?? null,
    }),

  registrarSalida: (repuestoId: string, cantidad: number, ordenId?: string, usuarioId?: string, usuarioNombre?: string) =>
    supabase.rpc('registrar_movimiento_kardex', {
      p_repuesto_id: repuestoId,
      p_repuesto_nombre: null,
      p_tipo: 'salida',
      p_cantidad: cantidad,
      p_stock_resultante: null,
      p_usuario_id: usuarioId ?? null,
      p_usuario_nombre: usuarioNombre ?? null,
      p_orden_id: ordenId ?? null,
      p_observaciones: ordenId ? `Salida por ${ordenId}` : 'Salida manual',
    }),

  registrarReserva: (repuestoId: string, repuestoNombre: string, cantidad: number, ordenId: string, usuarioId?: string, usuarioNombre?: string) =>
    supabase.rpc('registrar_movimiento_kardex', {
      p_repuesto_id: repuestoId,
      p_repuesto_nombre: repuestoNombre,
      p_tipo: 'reserva',
      p_cantidad: cantidad,
      p_stock_resultante: null,
      p_usuario_id: usuarioId ?? null,
      p_usuario_nombre: usuarioNombre ?? null,
      p_orden_id: ordenId,
      p_observaciones: `Reserva para ${ordenId}`,
    }),

  registrarLiberacion: (repuestoId: string, repuestoNombre: string, cantidad: number, ordenId: string, usuarioId?: string, usuarioNombre?: string) =>
    supabase.rpc('registrar_movimiento_kardex', {
      p_repuesto_id: repuestoId,
      p_repuesto_nombre: repuestoNombre,
      p_tipo: 'liberacion',
      p_cantidad: cantidad,
      p_stock_resultante: null,
      p_usuario_id: usuarioId ?? null,
      p_usuario_nombre: usuarioNombre ?? null,
      p_orden_id: ordenId,
      p_observaciones: `Liberación por ${ordenId}`,
    }),

  registrarEntrada: (repuestoId: string, repuestoNombre: string, cantidad: number, usuarioId?: string, usuarioNombre?: string, costo?: number, proveedorId?: string) =>
    supabase.rpc('registrar_movimiento_kardex', {
      p_repuesto_id: repuestoId,
      p_repuesto_nombre: repuestoNombre,
      p_tipo: 'entrada',
      p_cantidad: cantidad,
      p_stock_resultante: null,
      p_usuario_id: usuarioId ?? null,
      p_usuario_nombre: usuarioNombre ?? null,
      p_costo: costo ?? null,
      p_proveedor_id: proveedorId || null,
      p_observaciones: 'Entrada de stock',
    }),

  obtenerAlertas: () =>
    supabase.rpc('obtener_alertas_inventario'),

  listarProveedores: () =>
    supabase.rpc('listar_proveedores'),

  crearProveedor: (p: Omit<Proveedor, 'id'>) =>
    supabase.rpc('crear_proveedor', {
      p_nombre: p.nombre,
      p_telefono: p.telefono,
      p_email: p.email,
      p_contacto: p.contacto || null,
      p_productos: p.productos || null,
    }),

  actualizarProveedor: (id: string, p: Partial<Proveedor>) =>
    supabase.rpc('actualizar_proveedor', {
      p_id: id,
      p_nombre: p.nombre ?? null,
      p_contacto: p.contacto ?? null,
      p_telefono: p.telefono ?? null,
      p_email: p.email ?? null,
      p_productos: p.productos ?? null,
    }),

  toggleProveedor: (id: string) =>
    supabase.rpc('toggle_estado_proveedor', { p_id: id }),
};
