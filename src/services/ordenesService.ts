import { supabase } from '../lib/supabase';
import type { OrdenTrabajo } from '../app/context/AppContext';

export const ordenesService = {
  listar: (usuarioId?: string, rol?: string) =>
    supabase.rpc('listar_ordenes', {
      p_usuario_id: usuarioId ?? null,
      p_rol: rol ?? null,
    }),

  crear: (o: Omit<OrdenTrabajo, 'id' | 'numero' | 'fechaCreacion' | 'fechaActualizacion' | 'repuestosUsados' | 'entregaFirmada'>, creadoPor?: string) => {
    const numero = `OT-${Date.now().toString().slice(-6)}`;
    return supabase.rpc('crear_orden', {
      p_numero: numero,
      p_cliente_id: o.clienteId,
      p_vehiculo_id: o.vehiculoId,
      p_creado_por: creadoPor ?? o.creadoPor ?? null,
      p_datos: { ...o, numero, repuestosUsados: [], entregaFirmada: false },
    });
  },

  actualizar: (id: string, o: Partial<OrdenTrabajo>) =>
    supabase.rpc('actualizar_orden', {
      p_id: id,
      p_estado: o.estado ?? null,
      p_mecanico_id: o.mecanicoId ?? null,
      p_factura_id: o.facturaId ?? null,
      p_datos: o,
    }),

  cargarPorEstado: (estado: string) =>
    supabase.rpc('listar_ordenes_por_estado', { p_estado: estado }),

  cerrar: (ordenId: string, asesorId?: string) =>
    supabase.rpc('cerrar_orden', {
      p_orden_id: ordenId,
      p_asesor_id: asesorId ?? null,
    }),

  iniciarReparacion: (ordenId: string, mecanicoId?: string) =>
    supabase.rpc('iniciar_reparacion', {
      p_orden_id: ordenId,
      p_mecanico_id: mecanicoId ?? null,
    }),

  finalizarReparacion: (ordenId: string, mecanicoId?: string) =>
    supabase.rpc('finalizar_reparacion', {
      p_orden_id: ordenId,
      p_mecanico_id: mecanicoId ?? null,
    }),

  registrarQC: (ordenId: string, aprobado: boolean, inspectorId?: string, observaciones?: string) =>
    supabase.rpc('registrar_qc', {
      p_orden_id: ordenId,
      p_inspector_id: inspectorId ?? null,
      p_aprobado: aprobado,
      p_observaciones: observaciones ?? null,
    }),

  listarQC: (ordenId: string) =>
    supabase.rpc('listar_qc_ot', { p_orden_id: ordenId }),

  registrarNota: (ordenId: string, nota: string, autorId?: string) =>
    supabase.rpc('registrar_nota_ot', {
      p_orden_id: ordenId,
      p_autor_id: autorId ?? null,
      p_nota: nota,
    }),

  listarNotas: (ordenId: string) =>
    supabase.rpc('listar_notas_ot', { p_orden_id: ordenId }),

  adjuntarArchivo: (ordenId: string, urlArchivo: string, usuarioId?: string) =>
    supabase.rpc('adjuntar_archivo_ot', {
      p_orden_id: ordenId,
      p_usuario_id: usuarioId ?? null,
      p_url_archivo: urlArchivo,
    }),

  listarAdjuntos: (ordenId: string) =>
    supabase.rpc('listar_adjuntos_ot', { p_orden_id: ordenId }),

  rechazarCotizacion: (ordenId: string, clienteId?: string, montoDiagnostico?: number) =>
    supabase.rpc('rechazar_cotizacion', {
      p_orden_id: ordenId,
      p_cliente_id: clienteId ?? null,
      p_monto_diagnostico: montoDiagnostico ?? 0,
    }),

  aprobarCotizacion: (ordenId: string, clienteId?: string) =>
    supabase.rpc('aprobar_cotizacion', {
      p_orden_id: ordenId,
      p_cliente_id: clienteId ?? null,
    }),

  asignarMecanico: (ordenId: string, mecanicoId: string) =>
    supabase.rpc('asignar_mecanico_orden', {
      p_orden_id: ordenId,
      p_mecanico_id: mecanicoId,
    }),

  listarPagos: (ordenId: string) =>
    supabase.rpc('listar_pagos_ot', { p_orden_id: ordenId }),
};
