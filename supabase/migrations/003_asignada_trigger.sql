-- ─── Migration: estado 'asignada' + trigger de notificación al mecánico ───────
-- Run in Supabase SQL Editor (project uikpczaqoaxhwjybfvxw) AFTER 002_ot_sequence.sql

-- ── 1. Reemplazar el trigger de auditoría para incluir estado 'asignada' ──────
-- Cuando OT → 'asignada', notifica al mecánico asignado usando mecanico_id.
CREATE OR REPLACE FUNCTION fn_audit_orden_trabajo()
RETURNS TRIGGER AS $$
DECLARE
    detalles_txt TEXT;
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        IF (OLD.estado <> NEW.estado) THEN
            detalles_txt := 'Cambio de estado: ' || OLD.estado || ' -> ' || NEW.estado;

            INSERT INTO logs_auditoria (usuario_id, usuario_nombre, accion, modulo, detalles, entidad_id, entidad_tipo)
            VALUES (
                COALESCE(NEW.creado_por, '00000000-0000-0000-0000-000000000000'::UUID),
                'Sistema (Trigger)', 'CAMBIO_ESTADO_AUTO', 'Órdenes',
                detalles_txt, NEW.id, 'OrdenTrabajo'
            );

            -- Notificación al mecánico cuando la OT le es asignada
            IF (NEW.estado = 'asignada' AND NEW.mecanico_id IS NOT NULL) THEN
                INSERT INTO notificaciones (tipo, titulo, mensaje, para_rol, para_usuario_id, referencia_id, referencia_tipo)
                VALUES (
                    'nueva_asignacion',
                    'OT asignada a ti 🔧',
                    'Se te ha asignado la orden ' || NEW.numero || '. Ingresa al sistema para iniciar el diagnóstico.',
                    ARRAY['mecanico'],
                    NEW.mecanico_id,
                    NEW.id,
                    'OrdenTrabajo'
                );

            -- Notificación al cliente cuando la cotización está lista
            ELSIF (NEW.estado = 'esperando_aprobacion') THEN
                INSERT INTO notificaciones (tipo, titulo, mensaje, para_rol, para_usuario_id, referencia_id, referencia_tipo)
                SELECT 'cotizacion_pendiente', 'Presupuesto Listo 📝',
                    'Se ha generado la cotización para tu vehículo. Revisa y aprueba para iniciar la reparación.',
                    ARRAY['cliente'], c.usuario_id, NEW.id, 'OrdenTrabajo'
                FROM clientes c WHERE c.id = NEW.cliente_id;

            -- Notificación al cliente: reparación en curso
            ELSIF (NEW.estado = 'en_reparacion') THEN
                INSERT INTO notificaciones (tipo, titulo, mensaje, para_rol, para_usuario_id, referencia_id, referencia_tipo)
                SELECT 'pago_recibido', 'Reparación en Curso 🛠️',
                    'Hemos iniciado el trabajo en tu vehículo tras tu aprobación.',
                    ARRAY['cliente'], c.usuario_id, NEW.id, 'OrdenTrabajo'
                FROM clientes c WHERE c.id = NEW.cliente_id;

            -- Notificación al cliente: vehículo listo para retirar
            ELSIF (NEW.estado = 'liberada') THEN
                INSERT INTO notificaciones (tipo, titulo, mensaje, para_rol, para_usuario_id, referencia_id, referencia_tipo)
                SELECT 'orden_lista', '¡Vehículo Listo! 🚗✅',
                    'La reparación de tu vehículo ha finalizado. Puedes pasar a recogerlo.',
                    ARRAY['cliente'], c.usuario_id, NEW.id, 'OrdenTrabajo'
                FROM clientes c WHERE c.id = NEW.cliente_id;
            END IF;
        END IF;

        -- Auditoría cuando cambia el mecánico (columna dedicada)
        IF (OLD.mecanico_id IS DISTINCT FROM NEW.mecanico_id AND NEW.mecanico_id IS NOT NULL) THEN
            INSERT INTO logs_auditoria (usuario_id, usuario_nombre, accion, modulo, detalles, entidad_id, entidad_tipo)
            VALUES (
                COALESCE(NEW.creado_por, '00000000-0000-0000-0000-000000000000'::UUID),
                'Sistema (Trigger)', 'CAMBIO_MECANICO', 'Órdenes',
                'Nuevo mecánico asignado a la orden', NEW.id, 'OrdenTrabajo'
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recrear el trigger (dispara en estado Y mecanico_id para cubrir ambos casos)
DROP TRIGGER IF EXISTS trg_audit_orden_trabajo ON ordenes_trabajo;
CREATE TRIGGER trg_audit_orden_trabajo
  AFTER UPDATE OF estado, mecanico_id ON ordenes_trabajo
  FOR EACH ROW
  EXECUTE FUNCTION fn_audit_orden_trabajo();
