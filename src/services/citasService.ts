import { supabase } from '../lib/supabase';
import type { Cita, EstadoCita } from '../app/context/AppContext';

export const citasService = {
  listar: (usuarioId?: string, rol?: string) =>
    supabase.rpc('listar_citas', {
      p_usuario_id: usuarioId ?? null,
      p_rol: rol ?? null,
    }),

  crear: (c: Omit<Cita, 'id'>, creadoPor?: string) =>
    supabase.rpc('crear_cita', {
      p_fecha: c.fecha,
      p_hora: c.hora,
      p_cliente_id: c.clienteId || null,
      p_vehiculo_id: c.vehiculoId || null,
      p_tipo_servicio: c.tipoServicio || 'Por confirmar',
      p_motivo_ingreso: c.motivoIngreso || null,
      p_notas: c.notas || null,
      p_estado: c.estado || 'pendiente',
      p_creado_por: creadoPor || null,
    }),

  actualizar: (id: string, c: Partial<Cita>) =>
    supabase.rpc('actualizar_cita', {
      p_id: id,
      p_tipo_servicio: c.tipoServicio ?? null,
      p_motivo_ingreso: c.motivoIngreso ?? null,
      p_fecha: c.fecha ?? null,
      p_hora: c.hora ?? null,
      p_estado: c.estado ?? null,
      p_notas: c.notas ?? null,
      p_vehiculo_id: c.vehiculoId ?? null,
      p_orden_id: c.ordenId ?? null,
    }),

  eliminar: (id: string) =>
    supabase.rpc('eliminar_cita', { p_id: id }),

  confirmar: (id: string, asesorId?: string) =>
    supabase.rpc('confirmar_cita', {
      p_id: id,
      p_asesor_id: asesorId ?? null,
    }),

  reprogramar: (id: string, fecha: string, hora: string) =>
    supabase.rpc('reprogramar_cita', {
      p_id: id,
      p_nueva_fecha: fecha,
      p_nueva_hora: hora,
    }),

  cancelar: (id: string, motivo?: string) =>
    supabase.rpc('cancelar_cita', {
      p_id: id,
      p_motivo: motivo ?? null,
    }),

  updateEstado: (id: string, nuevoEstado: EstadoCita, usuarioId?: string, motivo?: string) =>
    supabase.rpc('actualizar_cita_estado', {
      p_cita_id: id,
      p_nuevo_estado: nuevoEstado,
      p_usuario_id: usuarioId ?? null,
      p_motivo: motivo ?? null,
    }),
};
