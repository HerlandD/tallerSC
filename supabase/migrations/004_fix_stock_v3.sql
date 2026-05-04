-- Fix: registrar_salida_repuesto_v3
-- Esta función descuenta stock de forma atómica y registra el movimiento en el kardex.

CREATE OR REPLACE FUNCTION registrar_salida_repuesto_v3(
  p_repuesto_id UUID,
  p_cantidad INT,
  p_orden_id UUID,
  p_usuario_id UUID,
  p_usuario_nombre TEXT
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_stock_actual INT;
  v_nuevo_stock INT;
  v_nombre TEXT;
BEGIN
  -- 1. Verificar stock y bloquear fila para evitar concurrencia
  SELECT cantidad, nombre INTO v_stock_actual, v_nombre
  FROM repuestos WHERE id = p_repuesto_id FOR UPDATE;
  
  IF v_stock_actual IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'Repuesto no encontrado');
  END IF;

  IF v_stock_actual < p_cantidad THEN
    RETURN json_build_object('ok', false, 'error', 'Stock insuficiente: disponible ' || v_stock_actual);
  END IF;

  v_nuevo_stock := v_stock_actual - p_cantidad;

  -- 2. Actualizar stock
  UPDATE repuestos SET cantidad = v_nuevo_stock WHERE id = p_repuesto_id;

  -- 3. Registrar en Kardex
  INSERT INTO kardex (repuesto_id, repuesto_nombre, tipo, cantidad, stock_resultante, usuario_id, usuario_nombre, orden_id, observaciones)
  VALUES (p_repuesto_id, v_nombre, 'salida', p_cantidad, v_nuevo_stock, p_usuario_id, p_usuario_nombre, p_orden_id, 'Salida por Orden de Trabajo');

  RETURN json_build_object('ok', true, 'nuevoStock', v_nuevo_stock);
END;
$$;

GRANT EXECUTE ON FUNCTION registrar_salida_repuesto_v3(UUID, INT, UUID, UUID, TEXT) TO anon, authenticated;
