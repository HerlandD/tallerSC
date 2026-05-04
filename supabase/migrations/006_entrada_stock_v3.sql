-- RPC: registrar_entrada_repuesto_v3
-- Esta función aumenta el stock de forma atómica y registra el movimiento en el kardex.

CREATE OR REPLACE FUNCTION registrar_entrada_repuesto_v3(
  p_repuesto_id UUID,
  p_cantidad INT,
  p_usuario_id UUID DEFAULT NULL,
  p_usuario_nombre TEXT DEFAULT 'Sistema',
  p_costo DECIMAL DEFAULT NULL,
  p_proveedor_id UUID DEFAULT NULL,
  p_observaciones TEXT DEFAULT 'Entrada de stock'
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_stock_actual INT;
  v_nuevo_stock INT;
  v_nombre TEXT;
BEGIN
  -- 1. Verificar existencia y bloquear fila
  SELECT cantidad, nombre INTO v_stock_actual, v_nombre
  FROM repuestos WHERE id = p_repuesto_id FOR UPDATE;
  
  IF v_stock_actual IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'Repuesto no encontrado');
  END IF;

  v_nuevo_stock := v_stock_actual + p_cantidad;

  -- 2. Actualizar stock y opcionalmente el costo si se proporciona
  UPDATE repuestos 
  SET cantidad = v_nuevo_stock,
      costo = COALESCE(p_costo, costo),
      proveedor_id = COALESCE(p_proveedor_id, proveedor_id)
  WHERE id = p_repuesto_id;

  -- 3. Registrar en Kardex
  INSERT INTO kardex (
    repuesto_id, 
    repuesto_nombre, 
    tipo, 
    cantidad, 
    stock_resultante, 
    usuario_id, 
    usuario_nombre, 
    observaciones
  )
  VALUES (
    p_repuesto_id, 
    v_nombre, 
    'entrada', 
    p_cantidad, 
    v_nuevo_stock, 
    p_usuario_id, 
    p_usuario_nombre, 
    p_observaciones
  );

  RETURN json_build_object('ok', true, 'nuevoStock', v_nuevo_stock);
END;
$$;

GRANT EXECUTE ON FUNCTION registrar_entrada_repuesto_v3(UUID, INT, UUID, TEXT, DECIMAL, UUID, TEXT) TO anon, authenticated;
