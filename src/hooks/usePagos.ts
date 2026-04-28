import { useState, useEffect } from 'react';
import { pagosService } from '../services/pagosService';
import type { Pago } from '../lib/supabase';
import type { Factura } from '../app/context/AppContext';

export function usePagos(autoLoad = true) {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [pagosOT, setPagosOT] = useState<Record<string, Pago[]>>({});
  const [facturasOT, setFacturasOT] = useState<Record<string, Factura[]>>({});

  useEffect(() => {
    if (!autoLoad) return;
    cargarFacturas();
  }, [autoLoad]);

  const cargarFacturas = async () => {
    const { data } = await pagosService.listarFacturas();
    if (Array.isArray(data)) setFacturas(data as Factura[]);
  };

  const cargarPagosOT = async (ordenId: string) => {
    const { data } = await pagosService.listarPagos(ordenId);
    if (Array.isArray(data)) setPagosOT(prev => ({ ...prev, [ordenId]: data }));
  };

  const registrarPago = async (
    ordenId: string,
    metodo: 'Efectivo' | 'Tarjeta' | 'QR' | 'Transferencia',
    monto: number,
    referencia?: string
  ): Promise<{ ok: boolean; confirmado?: boolean; error?: string }> => {
    const { data, error } = await pagosService.registrarPago(ordenId, metodo, monto, referencia);
    if (error) return { ok: false, error: error.message };
    if (!data?.ok) return { ok: false, error: data?.error };
    await cargarPagosOT(ordenId);
    return { ok: true, confirmado: data?.confirmado };
  };

  const confirmarPago = async (pagoId: string): Promise<{ ok: boolean; error?: string }> => {
    const { data, error } = await pagosService.confirmarPago(pagoId);
    if (error) return { ok: false, error: error.message };
    return data?.ok ? { ok: true } : { ok: false, error: data?.error };
  };

  const cargarFacturasOT = async (ordenId: string) => {
    const { data } = await pagosService.listarFacturasOT(ordenId);
    if (Array.isArray(data)) setFacturasOT(prev => ({ ...prev, [ordenId]: data }));
  };

  const addFactura = async (f: Factura) => {
    const { error } = await pagosService.crearFactura(f);
    if (!error) setFacturas(prev => [...prev, f]);
  };

  const updateFactura = async (numero: string, f: Partial<Factura>) => {
    const { error } = await pagosService.actualizarFactura(numero, {
      estado: f.estado,
      metodoPago: f.metodoPago,
    });
    if (!error) setFacturas(prev => prev.map(x => x.numero === numero ? { ...x, ...f } : x));
  };

  const generarFactura = async (pagoId: string): Promise<{ ok: boolean; numero?: string; subtotal?: number; iva?: number; total?: number; error?: string }> => {
    const { data, error } = await pagosService.generarFactura(pagoId);
    if (error) return { ok: false, error: error.message };
    if (!data?.ok) return { ok: false, error: data?.error };
    return {
      ok: true,
      numero: data?.numero,
      subtotal: data?.subtotal,
      iva: data?.iva,
      total: data?.total,
    };
  };

  const generarHtmlFactura = async (facturaId: string): Promise<{ ok: boolean; html?: string; error?: string }> => {
    const { data, error } = await pagosService.generarHtmlFactura(facturaId);
    if (error) return { ok: false, error: error.message };
    if (!data?.ok) return { ok: false, error: data?.error };
    return { ok: true, html: data?.html };
  };

  const guardarUrlPdfFactura = async (facturaId: string, urlPdf: string): Promise<{ ok: boolean; error?: string }> => {
    const { data, error } = await pagosService.guardarUrlPdf(facturaId, urlPdf);
    if (error) return { ok: false, error: error.message };
    return data?.ok ? { ok: true } : { ok: false, error: data?.error };
  };

  const obtenerFacturaPorOrden = async (ordenId: string): Promise<{ ok?: boolean; id?: string; numero?: string; urlPdf?: string; subtotal?: number; iva?: number; total?: number; error?: string }> => {
    const { data, error } = await pagosService.obtenerFacturaPorOrden(ordenId);
    if (error) return { error: error.message };
    return data || { error: 'Factura no encontrada' };
  };

  return {
    facturas,
    pagosOT,
    facturasOT,
    cargarFacturas,
    cargarPagosOT,
    registrarPago,
    confirmarPago,
    cargarFacturasOT,
    addFactura,
    updateFactura,
    generarFactura,
    generarHtmlFactura,
    guardarUrlPdfFactura,
    obtenerFacturaPorOrden,
  };
}
