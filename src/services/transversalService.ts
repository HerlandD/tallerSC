import { supabase } from '../lib/supabase';
import type { Notificacion, LogAuditoria, Catalogs } from '../app/context/AppContext';

export const notificacionesService = {
  listar: () =>
    supabase.rpc('listar_notificaciones'),

  crear: (n: Omit<Notificacion, 'id' | 'fecha' | 'leida'>) =>
    supabase.rpc('crear_notificacion', {
      p_tipo: n.tipo,
      p_titulo: n.titulo,
      p_mensaje: n.mensaje,
      p_para_rol: n.paraRol,
      p_para_usuario_id: n.paraUsuarioId || null,
      p_referencia_id: n.referenciaId || null,
      p_referencia_tipo: n.referenciaTipo || null,
    }),

  marcarLeida: (id: string) =>
    supabase.rpc('marcar_notificacion_leida', { p_id: id }),

  marcarTodasLeidas: (usuarioId: string) =>
    supabase.rpc('marcar_todas_leidas', { p_usuario_id: usuarioId }),
};

export const auditoriaService = {
  insertar: (log: Omit<LogAuditoria, 'id'>) =>
    supabase.rpc('insertar_log_auditoria', {
      p_usuario_id: log.usuarioId,
      p_usuario_nombre: log.usuarioNombre,
      p_accion: log.accion,
      p_modulo: log.modulo,
      p_detalles: log.detalles,
      p_entidad_id: log.entidadId ?? null,
      p_entidad_tipo: log.entidadTipo ?? null,
    }),
};

export const catalogosService = {
  obtener: () =>
    supabase.rpc('obtener_catalogs'),

  guardar: (clave: string, valor: Partial<Catalogs>) =>
    supabase.rpc('guardar_catalogs', {
      p_clave: clave,
      p_valor: valor as any,
    }),
};
