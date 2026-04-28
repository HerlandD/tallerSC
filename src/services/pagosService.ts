import { supabase } from '../lib/supabase';
import type { Factura } from '../app/context/AppContext';

export const pagosService = {
  registrarPago: (ordenId: string, metodo: 'Efectivo' | 'Tarjeta' | 'QR' | 'Transferencia', monto: number, referencia?: string) =>
    supabase.rpc('registrar_pago', {
      p_orden_id: ordenId,
      p_metodo: metodo,
      p_monto: monto,
      p_referencia: referencia ?? null,
    }),

  confirmarPago: (pagoId: string) =>
    supabase.rpc('confirmar_pago', { p_pago_id: pagoId }),

  listarPagos: (ordenId: string) =>
    supabase.rpc('listar_pagos_ot', { p_orden_id: ordenId }),

  crearFactura: (f: Factura) =>
    supabase.rpc('crear_factura', {
      p_numero: f.numero,
      p_orden_id: f.ordenId,
      p_cliente_id: f.clienteId,
      p_subtotal: f.subtotal,
      p_impuesto: f.impuesto,
      p_total: f.total,
      p_metodo_pago: f.metodoPago,
      p_estado: f.estado,
      p_datos: f,
    }),

  actualizarFactura: (numero: string, cambios: { estado?: string; metodoPago?: string }) =>
    supabase.rpc('actualizar_factura', {
      p_numero: numero,
      p_estado: cambios.estado ?? null,
      p_metodo_pago: cambios.metodoPago ?? null,
    }),

  listarFacturas: () =>
    supabase.rpc('listar_facturas'),

  listarFacturasOT: (ordenId: string) =>
    supabase.rpc('listar_facturas_ot', { p_orden_id: ordenId }),

  generarFactura: (pagoId: string) =>
    supabase.rpc('generar_factura', { p_pago_id: pagoId }),

  generarHtmlFactura: (facturaId: string) =>
    supabase.rpc('generar_html_factura', { p_factura_id: facturaId }),

  guardarUrlPdf: (facturaId: string, urlPdf: string) =>
    supabase.rpc('guardar_url_pdf_factura', {
      p_factura_id: facturaId,
      p_url_pdf: urlPdf,
    }),

  obtenerFacturaPorOrden: (ordenId: string) =>
    supabase.rpc('obtener_factura_por_orden', { p_orden_id: ordenId }),
};
