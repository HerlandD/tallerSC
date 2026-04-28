import { useState, useEffect } from 'react';
import { ordenesService } from '../services/ordenesService';
import type { OrdenTrabajo } from '../app/context/AppContext';
import type { WorkOrderNote, WorkOrderAttachment, WorkOrderQC, Pago } from '../lib/supabase';

export function useOrdenes(autoLoad = true, usuarioId?: string, rol?: string) {
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([]);
  const [notasOT, setNotasOT] = useState<Record<string, WorkOrderNote[]>>({});
  const [adjuntosOT, setAdjuntosOT] = useState<Record<string, WorkOrderAttachment[]>>({});
  const [qcOT, setQCOT] = useState<Record<string, WorkOrderQC | null>>({});
  const [pagosOT, setPagosOT] = useState<Record<string, Pago[]>>({});

  useEffect(() => {
    if (!autoLoad) return;
    cargarOrdenes();
  }, [autoLoad, usuarioId, rol]);

  const cargarOrdenes = async () => {
    const { data } = await ordenesService.listar(usuarioId, rol);
    if (Array.isArray(data)) setOrdenes(data as OrdenTrabajo[]);
  };

  const addOrden = async (o: Omit<OrdenTrabajo, 'id' | 'numero' | 'fechaCreacion' | 'fechaActualizacion' | 'repuestosUsados' | 'entregaFirmada'>, creadoPor?: string) => {
    const { data, error } = await ordenesService.crear(o, creadoPor);
    if (error) throw error;
    if (data?.success && data.orden) {
      const orden = data.orden as OrdenTrabajo;
      setOrdenes(prev => [orden, ...prev]);
    }
  };

  const updateOrden = async (id: string, o: Partial<OrdenTrabajo>) => {
    const { error } = await ordenesService.actualizar(id, o);
    if (error) throw error;
    setOrdenes(p => p.map(x => x.id === id ? { ...x, ...o, fechaActualizacion: new Date().toISOString().split('T')[0] } : x));
  };

  const deleteOrden = (id: string) => setOrdenes(p => p.filter(x => x.id !== id));

  const cargarOrdenesPorEstado = async (estado: string) => {
    const { data } = await ordenesService.cargarPorEstado(estado);
    if (Array.isArray(data)) setOrdenes(data as OrdenTrabajo[]);
  };

  const cerrarOrden = async (ordenId: string, asesorId?: string): Promise<{ ok: boolean; error?: string }> => {
    const { data, error } = await ordenesService.cerrar(ordenId, asesorId);
    if (error) return { ok: false, error: error.message };
    if (data?.ok) {
      await cargarOrdenes();
      return { ok: true };
    }
    return { ok: false, error: data?.error };
  };

  const cargarNotasOT = async (ordenId: string) => {
    const { data } = await ordenesService.listarNotas(ordenId);
    if (Array.isArray(data)) setNotasOT(prev => ({ ...prev, [ordenId]: data }));
  };

  const registrarNotaOT = async (ordenId: string, nota: string, autorId?: string): Promise<{ ok: boolean; error?: string }> => {
    const { data, error } = await ordenesService.registrarNota(ordenId, nota, autorId);
    if (error) return { ok: false, error: error.message };
    return data?.ok ? { ok: true } : { ok: false, error: data?.error };
  };

  const cargarAdjuntosOT = async (ordenId: string) => {
    const { data } = await ordenesService.listarAdjuntos(ordenId);
    if (Array.isArray(data)) setAdjuntosOT(prev => ({ ...prev, [ordenId]: data }));
  };

  const adjuntarArchivoOT = async (ordenId: string, urlArchivo: string, usuarioId?: string): Promise<{ ok: boolean; error?: string }> => {
    const { data, error } = await ordenesService.adjuntarArchivo(ordenId, urlArchivo, usuarioId);
    if (error) return { ok: false, error: error.message };
    return data?.ok ? { ok: true } : { ok: false, error: data?.error };
  };

  const iniciarReparacion = async (ordenId: string, mecanicoId?: string): Promise<{ ok: boolean; error?: string }> => {
    const { data, error } = await ordenesService.iniciarReparacion(ordenId, mecanicoId);
    if (error) return { ok: false, error: error.message };
    if (!data?.ok) return { ok: false, error: data?.error };
    setOrdenes(p => p.map(o => o.id === ordenId ? { ...o, estado: 'en_reparacion' as const, fechaActualizacion: new Date().toISOString().split('T')[0] } : o));
    return { ok: true };
  };

  const finalizarReparacion = async (ordenId: string, mecanicoId?: string): Promise<{ ok: boolean; error?: string }> => {
    const { data, error } = await ordenesService.finalizarReparacion(ordenId, mecanicoId);
    if (error) return { ok: false, error: error.message };
    if (!data?.ok) return { ok: false, error: data?.error };
    setOrdenes(p => p.map(o => o.id === ordenId ? { ...o, estado: 'control_calidad' as const, fechaActualizacion: new Date().toISOString().split('T')[0] } : o));
    return { ok: true };
  };

  const cargarQCOT = async (ordenId: string) => {
    const { data } = await ordenesService.listarQC(ordenId);
    if (Array.isArray(data) && data.length > 0) {
      setQCOT(prev => ({ ...prev, [ordenId]: data[0] }));
    }
  };

  const registrarQC = async (ordenId: string, aprobado: boolean, inspectorId?: string, observaciones?: string): Promise<{ ok: boolean; nuevoEstado?: string; error?: string }> => {
    const { data, error } = await ordenesService.registrarQC(ordenId, aprobado, inspectorId, observaciones);
    if (error) return { ok: false, error: error.message };
    if (!data?.ok) return { ok: false, error: data?.error };
    const nuevoEstado = data.nuevoEstado;
    setOrdenes(p => p.map(o => o.id === ordenId ? { ...o, estado: nuevoEstado === 'liberada' ? 'liberada' : 'en_reparacion', fechaActualizacion: new Date().toISOString().split('T')[0] } : o));
    await cargarQCOT(ordenId);
    return { ok: true, nuevoEstado };
  };

  const cargarPagosOT = async (ordenId: string) => {
    const { data } = await ordenesService.listarPagos(ordenId);
    if (Array.isArray(data)) setPagosOT(prev => ({ ...prev, [ordenId]: data }));
  };

  const rechazarCotizacion = async (ordenId: string, clienteId?: string, montoDiagnostico?: number) => {
    const { data } = await ordenesService.rechazarCotizacion(ordenId, clienteId, montoDiagnostico);
    if (data?.ok) {
      await cargarOrdenes();
    }
  };

  const aprobarCotizacion = async (ordenId: string, clienteId?: string) => {
    const { data } = await ordenesService.aprobarCotizacion(ordenId, clienteId);
    if (data?.ok) {
      await cargarOrdenes();
    }
  };

  const asignarMecanico = async (ordenId: string, mecanicoId: string): Promise<{ ok: boolean; error?: string }> => {
    const { error } = await ordenesService.asignarMecanico(ordenId, mecanicoId);
    if (error) return { ok: false, error: error.message };

    await cargarOrdenes();
    return { ok: true };
  };

  return {
    ordenes,
    notasOT,
    adjuntosOT,
    qcOT,
    pagosOT,
    cargarOrdenes,
    addOrden,
    updateOrden,
    deleteOrden,
    cargarOrdenesPorEstado,
    cerrarOrden,
    cargarNotasOT,
    registrarNotaOT,
    cargarAdjuntosOT,
    adjuntarArchivoOT,
    iniciarReparacion,
    finalizarReparacion,
    cargarQCOT,
    registrarQC,
    cargarPagosOT,
    rechazarCotizacion,
    aprobarCotizacion,
    asignarMecanico,
  };
}
