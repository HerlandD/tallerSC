import { useState, useEffect } from 'react';
import { citasService } from '../services/citasService';
import type { Cita, EstadoCita } from '../app/context/AppContext';

export function useCitas(autoLoad = true, usuarioId?: string, rol?: string) {
  const [citas, setCitas] = useState<Cita[]>([]);

  useEffect(() => {
    if (!autoLoad) return;
    cargarCitas();
  }, [autoLoad, usuarioId, rol]);

  const cargarCitas = async () => {
    const { data } = await citasService.listar(usuarioId, rol);
    if (Array.isArray(data)) setCitas(data as Cita[]);
  };

  const addCita = async (c: Omit<Cita, 'id'>, creadoPor?: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const { data, error } = await citasService.crear(c, creadoPor);
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
      const { data, error } = await citasService.actualizar(id, c);
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
      const { data, error } = await citasService.eliminar(id);
      if (error) throw error;
      if (!data?.success) return { ok: false, error: data?.error ?? 'Error al eliminar' };
      setCitas(prev => prev.filter(x => x.id !== id));
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message ?? 'Error de conexión' };
    }
  };

  const confirmarCita = async (id: string, asesorId?: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const { data, error } = await citasService.confirmar(id, asesorId);
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
      const { data, error } = await citasService.reprogramar(id, fecha, hora);
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
      const { data, error } = await citasService.cancelar(id, motivo);
      if (error) throw error;
      if (!data?.success) return { ok: false, error: data?.error ?? 'Error al cancelar' };
      setCitas(prev => prev.map(x => x.id === id ? { ...x, ...(data.cita as Cita) } : x));
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message ?? 'Error de conexión' };
    }
  };

  const updateCitaEstado = async (id: string, nuevoEstado: EstadoCita, usuarioId?: string, motivo?: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const { data, error } = await citasService.updateEstado(id, nuevoEstado, usuarioId, motivo);
      if (error) {
        console.warn('RPC actualizar_cita_estado no disponible, usando update genérico:', error.message);
        return await updateCita(id, { estado: nuevoEstado, notas: motivo });
      }
      if (!data?.success) return { ok: false, error: data?.error ?? 'Error al cambiar estado' };
      setCitas(prev => prev.map(c => c.id === id ? { ...c, estado: nuevoEstado, notas: motivo ?? c.notas } : c));
      return { ok: true };
    } catch (err: any) {
      console.error('Error en updateCitaEstado:', err);
      return { ok: false, error: 'Error de conexión' };
    }
  };

  return {
    citas,
    cargarCitas,
    addCita,
    updateCita,
    deleteCita,
    confirmarCita,
    reprogramarCita,
    cancelarCita,
    updateCitaEstado,
  };
}
