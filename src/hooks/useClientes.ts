import { useState, useEffect } from 'react';
import { clientesService, vehiculosService } from '../services/clientesService';
import type { Cliente, Vehiculo } from '../app/context/AppContext';

export function useClientes(autoLoad = true) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);

  useEffect(() => {
    if (!autoLoad) return;
    cargarClientes();
    cargarVehiculos();
  }, [autoLoad]);

  const cargarClientes = async () => {
    const { data } = await clientesService.listar();
    if (Array.isArray(data)) setClientes(data as Cliente[]);
  };

  const cargarVehiculos = async () => {
    const { data } = await vehiculosService.listar();
    if (Array.isArray(data)) {
      setVehiculos((data as any[]).map(v => ({ ...v, año: v.anio })));
    }
  };

  const addCliente = async (c: Omit<Cliente, 'id' | 'fechaRegistro'>): Promise<{ ok: boolean; error?: string }> => {
    try {
      const { data, error } = await clientesService.crear(c);
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
      const { data, error } = await clientesService.actualizar(id, merged);
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
      const { data, error } = await clientesService.eliminar(id);
      if (error) throw error;
      if (!data?.success) return { ok: false, error: data?.error ?? 'Error al eliminar' };
      setClientes(p => p.filter(x => x.id !== id));
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message ?? 'Error de conexión' };
    }
  };

  const addVehiculo = async (v: Omit<Vehiculo, 'id'>): Promise<{ ok: boolean; error?: string }> => {
    try {
      const { data, error } = await vehiculosService.crear(v);
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
      const { data, error } = await vehiculosService.actualizar(id, merged);
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
      const { data, error } = await vehiculosService.eliminar(id);
      if (error) throw error;
      if (!data?.success) return { ok: false, error: data?.error ?? 'Error al eliminar' };
      setVehiculos(p => p.filter(x => x.id !== id));
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message ?? 'Error de conexión' };
    }
  };

  return {
    clientes,
    vehiculos,
    cargarClientes,
    cargarVehiculos,
    addCliente,
    updateCliente,
    deleteCliente,
    addVehiculo,
    updateVehiculo,
    deleteVehiculo,
  };
}
