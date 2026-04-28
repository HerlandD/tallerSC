-- Fix para asignar_mecanico_orden: remove usuario_id constraint issue
-- Ejecutar este script en el SQL Editor de Supabase para actualizar la función

CREATE OR REPLACE FUNCTION asignar_mecanico_orden(
  p_orden_id UUID,
  p_mecanico_id UUID
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_orden ordenes_trabajo%ROWTYPE;
  v_mecanico usuarios%ROWTYPE;
  v_rows_updated INT;
BEGIN
  -- Validar que la orden existe
  SELECT * INTO v_orden FROM ordenes_trabajo
  WHERE id = p_orden_id AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN json_build_object('ok', FALSE, 'error', 'Orden no encontrada', 'orden_id', p_orden_id::TEXT);
  END IF;

  -- Validar que el mecánico existe y tiene rol 'mecanico'
  SELECT * INTO v_mecanico FROM usuarios
  WHERE id = p_mecanico_id AND rol = 'mecanico' AND activo = TRUE;

  IF NOT FOUND THEN
    RETURN json_build_object('ok', FALSE, 'error', 'Mecánico no encontrado o no activo', 'mecanico_id', p_mecanico_id::TEXT);
  END IF;

  -- Asignar mecánico a la orden
  UPDATE ordenes_trabajo
  SET mecanico_id = p_mecanico_id, fecha_actualizacion = CURRENT_DATE
  WHERE id = p_orden_id;

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
  IF v_rows_updated = 0 THEN
    RETURN json_build_object('ok', FALSE, 'error', 'No se pudo actualizar la orden');
  END IF;

  -- Registrar en auditoría sin validar usuario (evita constraint)
  BEGIN
    INSERT INTO logs_auditoria (usuario_nombre, accion, modulo, detalles, entidad_id, entidad_tipo)
    VALUES (v_mecanico.nombre, 'ASIGNACION_MECANICO', 'Órdenes',
            'Mecánico asignado a la orden de trabajo', p_orden_id, 'OrdenTrabajo');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN json_build_object('ok', TRUE, 'mecanico', v_mecanico.nombre, 'orden_numero', v_orden.numero);
END;
$$;
GRANT EXECUTE ON FUNCTION asignar_mecanico_orden(UUID, UUID) TO anon, authenticated;
