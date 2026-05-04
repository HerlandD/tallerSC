-- RPC: listar_auditoria
-- Retorna los últimos logs de auditoría registrados en el sistema.

CREATE OR REPLACE FUNCTION listar_auditoria(p_limit INT DEFAULT 100)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN COALESCE((
    SELECT json_agg(t)
    FROM (
      SELECT 
        id,
        fecha,
        usuario_id as "usuarioId",
        usuario_nombre as "usuarioNombre",
        accion,
        modulo,
        detalles,
        entidad_id as "entidadId",
        entidad_tipo as "entidadTipo"
      FROM logs_auditoria
      ORDER BY fecha DESC
      LIMIT p_limit
    ) t
  ), '[]'::json);
END;
$$;

GRANT EXECUTE ON FUNCTION listar_auditoria(INT) TO authenticated;
