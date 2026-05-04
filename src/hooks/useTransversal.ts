import { useState, useEffect } from 'react';
import { notificacionesService, auditoriaService, catalogosService } from '../services/transversalService';
import type { Notificacion, LogAuditoria, Catalogs } from '../app/context/AppContext';

export function useNotificaciones(autoLoad = true) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);

  useEffect(() => {
    if (!autoLoad) return;
    cargarNotificaciones();
  }, [autoLoad]);

  const cargarNotificaciones = async () => {
    const { data } = await notificacionesService.listar();
    if (Array.isArray(data)) setNotificaciones(data as Notificacion[]);
  };

  const addNotificacion = async (n: Omit<Notificacion, 'id' | 'fecha' | 'leida'>) => {
    const { error } = await notificacionesService.crear(n);
    if (!error) {
      const { data } = await notificacionesService.listar();
      if (Array.isArray(data)) setNotificaciones(data as Notificacion[]);
    }
  };

  const marcarNotificacionLeida = async (id: string) => {
    const { error } = await notificacionesService.marcarLeida(id);
    if (!error) {
      setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
    }
  };

  const marcarTodasLeidas = async (usuarioId: string) => {
    const { error } = await notificacionesService.marcarTodasLeidas(usuarioId);
    if (!error) {
      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
    }
  };

  return {
    notificaciones,
    cargarNotificaciones,
    addNotificacion,
    marcarNotificacionLeida,
    marcarTodasLeidas,
  };
}

export function useAuditoria(autoLoad = true) {
  const [auditoria, setAuditoria] = useState<LogAuditoria[]>([]);

  useEffect(() => {
    if (autoLoad) cargarAuditoria();
  }, [autoLoad]);

  const cargarAuditoria = async () => {
    const { data } = await auditoriaService.listar();
    if (Array.isArray(data)) setAuditoria(data as LogAuditoria[]);
  };

  const addAuditoria = async (log: Omit<LogAuditoria, 'id'>) => {
    await auditoriaService.insertar(log);
    // Recargar para tener el ID real de la base de datos
    cargarAuditoria();
  };

  return {
    auditoria,
    addAuditoria,
    cargarAuditoria,
  };
}

export function useCatalogs(initialCatalogs: Catalogs) {
  const [catalogs, setCatalogs] = useState<Catalogs>(initialCatalogs);

  useEffect(() => {
    cargarCatalogs();
  }, []);

  const cargarCatalogs = async () => {
    const { data, error } = await catalogosService.obtener();
    if (error) {
      console.warn('Error cargando catálogos:', error);
    } else if (data) {
      try {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        if (parsed && parsed.all_catalogs) {
          setCatalogs(parsed.all_catalogs as Catalogs);
        }
      } catch (e) {
        console.warn('Error parseando catálogos:', e);
      }
    }
  };

  const updateCatalogs = async (c: Partial<Catalogs>) => {
    const updated = { ...catalogs, ...c };
    setCatalogs(updated);
    try {
      await catalogosService.guardar('all_catalogs', updated);
    } catch (err: any) {
      console.error('Error al guardar catálogos:', err);
    }
  };

  return {
    catalogs,
    cargarCatalogs,
    updateCatalogs,
  };
}
