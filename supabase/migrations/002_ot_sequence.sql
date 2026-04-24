-- ─── Migration: OT sequence, columnas km_entrada/tipo_servicio ───────────────
-- Run this in the Supabase SQL Editor (project uikpczaqoaxhwjybfvxw)

-- ── 1. Sequence ───────────────────────────────────────────────────────────────
-- Global counter; never resets, guarantees uniqueness under concurrent inserts
CREATE SEQUENCE IF NOT EXISTS ot_anual_seq START 1;

-- ── 2. Columnas dedicadas en ordenes_trabajo ──────────────────────────────────
ALTER TABLE ordenes_trabajo
  ADD COLUMN IF NOT EXISTS km_entrada   INTEGER,
  ADD COLUMN IF NOT EXISTS tipo_servicio VARCHAR(100);

-- ── 3. RPC crear_orden_v2 ─────────────────────────────────────────────────────
-- Genera el número OT server-side; extrae km_entrada y tipo_servicio del JSONB
-- para guardarlos en sus columnas dedicadas.
CREATE OR REPLACE FUNCTION crear_orden_v2(
  p_cliente_id   UUID,
  p_vehiculo_id  UUID,
  p_creado_por   UUID,
  p_datos        JSONB
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_numero TEXT;
  v_nueva  ordenes_trabajo%ROWTYPE;
BEGIN
  v_numero := 'OT-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('ot_anual_seq')::TEXT, 4, '0');

  INSERT INTO ordenes_trabajo (
    numero, cliente_id, vehiculo_id, creado_por, datos_json,
    km_entrada, tipo_servicio
  )
  VALUES (
    v_numero, p_cliente_id, p_vehiculo_id, p_creado_por, p_datos,
    NULLIF(p_datos->>'kmEntrada',    '')::INTEGER,
    NULLIF(p_datos->>'tipoServicio', '')
  )
  RETURNING * INTO v_nueva;

  RETURN json_build_object('success', TRUE, 'id', v_nueva.id, 'numero', v_numero);
END;
$$;
GRANT EXECUTE ON FUNCTION crear_orden_v2(UUID, UUID, UUID, JSONB) TO anon, authenticated;

-- ── 4. listar_ordenes: incluir km_entrada y tipo_servicio como campos explícitos
-- Las columnas dedicadas sobreescriben lo que pueda venir en datos_json.
CREATE OR REPLACE FUNCTION listar_ordenes(
  p_usuario_id UUID DEFAULT NULL,
  p_rol        TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF p_rol = 'cliente' AND p_usuario_id IS NOT NULL THEN
    RETURN COALESCE((
      SELECT json_agg(
        (datos_json || jsonb_build_object(
          'id',                 id,
          'numero',             numero,
          'clienteId',          cliente_id,
          'vehiculoId',         vehiculo_id,
          'mecanicoId',         mecanico_id,
          'estado',             estado,
          'facturaId',          factura_id,
          'kmEntrada',          km_entrada,
          'tipoServicio',       tipo_servicio,
          'fechaCreacion',      fecha_creacion::TEXT,
          'fechaActualizacion', fecha_actualizacion::TEXT
        )) ORDER BY fecha_creacion DESC
      )
      FROM ordenes_trabajo
      WHERE (cliente_id IN (SELECT id FROM clientes WHERE usuario_id = p_usuario_id))
        AND deleted_at IS NULL
    ), '[]'::json);
  ELSE
    RETURN COALESCE((
      SELECT json_agg(
        (datos_json || jsonb_build_object(
          'id',                 id,
          'numero',             numero,
          'clienteId',          cliente_id,
          'vehiculoId',         vehiculo_id,
          'mecanicoId',         mecanico_id,
          'estado',             estado,
          'facturaId',          factura_id,
          'kmEntrada',          km_entrada,
          'tipoServicio',       tipo_servicio,
          'fechaCreacion',      fecha_creacion::TEXT,
          'fechaActualizacion', fecha_actualizacion::TEXT
        )) ORDER BY fecha_creacion DESC
      )
      FROM ordenes_trabajo WHERE deleted_at IS NULL
    ), '[]'::json);
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION listar_ordenes(UUID, TEXT) TO anon, authenticated;
