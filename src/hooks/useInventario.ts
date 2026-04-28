import { useState, useEffect } from 'react';
import { inventarioService } from '../services/inventarioService';
import type { Repuesto, MovimientoKardex, Proveedor, RepuestoUsado } from '../app/context/AppContext';

export function useInventario(autoLoad = true) {
  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
  const [kardex, setKardex] = useState<MovimientoKardex[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);

  useEffect(() => {
    if (!autoLoad) return;
    cargarRepuestos();
    cargarProveedores();
  }, [autoLoad]);

  const cargarRepuestos = async () => {
    const { data } = await inventarioService.listarRepuestos();
    if (Array.isArray(data)) setRepuestos(data as Repuesto[]);
  };

  const cargarProveedores = async () => {
    const { data } = await inventarioService.listarProveedores();
    if (Array.isArray(data)) setProveedores(data as Proveedor[]);
  };

  const addRepuesto = async (r: Omit<Repuesto, 'id'>): Promise<{ ok: boolean; error?: string }> => {
    const { data, error } = await inventarioService.crearRepuesto(r);
    if (error) return { ok: false, error: error.message };
    if (data?.ok) setRepuestos(p => [...p, data.repuesto as Repuesto]);
    return data?.ok ? { ok: true } : { ok: false, error: data?.error };
  };

  const updateRepuesto = async (id: string, r: Partial<Repuesto>): Promise<{ ok: boolean; error?: string }> => {
    const { data, error } = await inventarioService.actualizarRepuesto(id, r);
    if (error) return { ok: false, error: error.message };
    if (data?.ok) {
      setRepuestos(p => p.map(x => x.id === id ? { ...x, ...r } : x));
      return { ok: true };
    }
    return { ok: false, error: data?.error };
  };

  const deleteRepuesto = (id: string) => setRepuestos(p => p.filter(x => x.id !== id));

  const registrarSalidaRepuesto = async (repuestoId: string, cantidad: number, ordenId?: string, usuarioId?: string, usuarioNombre?: string): Promise<boolean> => {
    const rep = repuestos.find(r => r.id === repuestoId);
    if (!rep || rep.cantidad < cantidad) return false;
    const newCantidad = rep.cantidad - cantidad;

    await inventarioService.actualizarRepuesto(repuestoId, { cantidad: newCantidad });
    if (usuarioId) {
      await inventarioService.registrarSalida(repuestoId, cantidad, ordenId, usuarioId, usuarioNombre);
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
      await inventarioService.actualizarRepuesto(r.id, { cantidad_reservada: newReservada });
      await inventarioService.registrarReserva(r.id, r.nombre, res.cantidad, ordenId);
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
      await inventarioService.actualizarRepuesto(r.id, { cantidad_reservada: newReservada });
      await inventarioService.registrarLiberacion(r.id, r.nombre, res.cantidad, ordenId);
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
    const prov = proveedores.find(p => p.id === proveedorId);
    setKardex(prev => [...prev, {
      id: `k${Date.now()}`,
      repuestoId,
      repuestoNombre: rep.nombre,
      tipo: 'entrada',
      cantidad,
      stockResultante: newCantidad,
      fecha: new Date().toISOString(),
      usuarioId: 'sistema',
      usuarioNombre: 'Sistema',
      proveedorId,
      costo,
      observaciones: prov ? `Entrada de ${prov.nombre}` : 'Entrada de stock',
    }]);
  };

  const obtenerAlertasInventario = async (): Promise<Repuesto[]> => {
    const { data, error } = await inventarioService.obtenerAlertas();
    if (error) return [];
    if (!Array.isArray(data)) return [];
    return data.map((a: any) => ({
      id: a.id,
      nombre: a.nombre,
      categoria: a.categoria,
      cantidad: a.stock_actual,
      cantidadReservada: a.stock_reservado,
      costo: 0,
      margenGanancia: 0,
      precio: 0,
      stockMinimo: a.stock_minimo,
      proveedorId: a.proveedor_id,
      imagen: '',
    }));
  };

  const addProveedor = async (p: Omit<Proveedor, 'id'>): Promise<{ ok: boolean; error?: string }> => {
    const { data, error } = await inventarioService.crearProveedor(p);
    if (error) return { ok: false, error: error.message };
    if (data?.ok) setProveedores(prev => [...prev, data.proveedor as Proveedor]);
    return data?.ok ? { ok: true } : { ok: false, error: data?.error };
  };

  const updateProveedor = async (id: string, p: Partial<Proveedor>): Promise<{ ok: boolean; error?: string }> => {
    const { data, error } = await inventarioService.actualizarProveedor(id, p);
    if (error) return { ok: false, error: error.message };
    if (data?.ok) setProveedores(prev => prev.map(x => x.id === id ? { ...x, ...p } : x));
    return data?.ok ? { ok: true } : { ok: false, error: data?.error };
  };

  const deleteProveedor = async (id: string): Promise<{ ok: boolean; error?: string }> => {
    const { data, error } = await inventarioService.toggleProveedor(id);
    if (error) return { ok: false, error: error.message };
    if (data?.ok) setProveedores(prev => prev.map(x => x.id === id ? { ...x, activo: data.activo } : x));
    return data?.ok ? { ok: true } : { ok: false, error: data?.error };
  };

  return {
    repuestos,
    kardex,
    proveedores,
    cargarRepuestos,
    cargarProveedores,
    addRepuesto,
    updateRepuesto,
    deleteRepuesto,
    registrarSalidaRepuesto,
    reservarRepuestos,
    liberarReservas,
    addStockRepuesto,
    obtenerAlertasInventario,
    addProveedor,
    updateProveedor,
    deleteProveedor,
  };
}
