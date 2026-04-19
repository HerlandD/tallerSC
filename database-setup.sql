-- =========================================================
-- TallerPro — Database Setup & Migration
-- Ejecutar en Supabase SQL Editor (orden secuencial)
-- =========================================================

-- ─── 0. HASH DE CONTRASEÑAS ─────────────────────────────
-- Se usa SHA-256 nativo (encode + sha256 + pepper), disponible en
-- PostgreSQL 14+ sin ninguna extensión.
-- Formato almacenado: encode(sha256((pwd || pepper)::bytea), 'hex')  → 64 hex chars
-- No se requiere CREATE EXTENSION pgcrypto.

-- ─── 1. TABLA USUARIOS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id         UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  username   VARCHAR(50)  UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,
  nombre     VARCHAR(100) NOT NULL,
  -- Roles cortos en DB: 'admin' | 'asesor' | 'jefe' | 'mecanico' | 'cliente'
  -- El RPC los mapea a los roles del app al devolver el usuario
  rol        VARCHAR(20)  NOT NULL
               CHECK (rol IN ('admin', 'asesor', 'jefe', 'mecanico', 'cliente')),
  email      VARCHAR(100),
  telefono   VARCHAR(20),
  direccion  TEXT,
  ci         VARCHAR(20),
  nit        VARCHAR(20),
  activo     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Agregar columna activo si ya existe la tabla sin ella
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE;

-- ─── 2. ÍNDICES ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(username);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol      ON usuarios(rol);
CREATE INDEX IF NOT EXISTS idx_usuarios_email    ON usuarios(email);

-- ─── 3. ROW LEVEL SECURITY ───────────────────────────────
-- Habilitar RLS — el acceso directo queda bloqueado.
-- TODA la autenticación pasa por las funciones RPC (SECURITY DEFINER)
-- que se ejecutan con permisos de superusuario, no del cliente.
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas viejas si existen
DROP POLICY IF EXISTS "Users can view own profile"   ON usuarios;
DROP POLICY IF EXISTS "Users can insert own profile" ON usuarios;
DROP POLICY IF EXISTS "Users can update own profile" ON usuarios;
DROP POLICY IF EXISTS "Allow anon read for login"    ON usuarios;
DROP POLICY IF EXISTS "Allow insert for registration" ON usuarios;

-- Sin políticas de acceso directo: solo las funciones RPC pueden leer/escribir.

-- ─── 4. Índice UNIQUE en email de usuarios (email opcional pero único si se provee)
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_email_unique
  ON usuarios(lower(email))
  WHERE email IS NOT NULL AND trim(email) <> '';

-- ─── 4. RPC: login_usuario ────────────────────────────────
-- Verifica credenciales con SHA-256 nativo (sin extensiones).
-- Migración automática: contraseña en texto plano → se verifica directo
-- y se re-hashea al vuelo en el mismo login.
-- Detección hash: sha256 hex = exactamente 64 chars hex lowercase.
-- Orden de validación: existencia → activo → contraseña → éxito
CREATE OR REPLACE FUNCTION login_usuario(p_username TEXT, p_password TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user   usuarios%ROWTYPE;
  v_rol    TEXT;
  v_ok     BOOLEAN;
  v_pepper CONSTANT TEXT := '$TlrPro2026$';
  v_hash   TEXT;
BEGIN
  -- 1. Verificar si el usuario existe
  SELECT * INTO v_user FROM usuarios WHERE username = p_username;
  IF NOT FOUND THEN
    RETURN json_build_object('success', FALSE, 'error', 'Usuario no encontrado');
  END IF;

  -- 2. Verificar cuenta activa
  IF v_user.activo = FALSE THEN
    RETURN json_build_object('success', FALSE, 'error', 'Tu cuenta está desactivada. Contacta al administrador.');
  END IF;

  -- 3. Verificar contraseña
  --    Si ya está hasheada (64 hex chars) → comparar con SHA-256.
  --    Si es texto plano (legacy) → comparar directo y re-hashear al vuelo.
  v_hash := encode(sha256((p_password || v_pepper)::bytea), 'hex');

  IF length(v_user.password) = 64 AND v_user.password ~ '^[0-9a-f]{64}$' THEN
    v_ok := (v_user.password = v_hash);
  ELSE
    v_ok := (v_user.password = p_password);
    IF v_ok THEN
      -- Migración automática al vuelo
      UPDATE usuarios SET password = v_hash WHERE id = v_user.id;
    END IF;
  END IF;

  IF NOT v_ok THEN
    RETURN json_build_object('success', FALSE, 'error', 'Contraseña incorrecta');
  END IF;

  -- 4. Mapear roles cortos → roles del app
  v_rol := CASE v_user.rol
    WHEN 'admin' THEN 'administrador'
    WHEN 'jefe'  THEN 'jefe_taller'
    ELSE v_user.rol
  END;

  RETURN json_build_object(
    'success', TRUE,
    'user', json_build_object(
      'id',        v_user.id,
      'nombre',    v_user.nombre,
      'username',  v_user.username,
      'rol',       v_rol,
      'email',     v_user.email,
      'telefono',  v_user.telefono,
      'ci',        v_user.ci,
      'activo',    v_user.activo
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION login_usuario(TEXT, TEXT) TO anon, authenticated;

-- ─── 5. RPC: registrar_cliente ────────────────────────────
-- Valida unicidad de username, CI y email antes de insertar.
-- Toda la validación en una sola transacción atómica.
CREATE OR REPLACE FUNCTION registrar_cliente(
  p_username  TEXT,
  p_password  TEXT,
  p_nombre    TEXT,
  p_ci        TEXT,
  p_nit       TEXT    DEFAULT NULL,
  p_telefono  TEXT    DEFAULT NULL,
  p_email     TEXT    DEFAULT NULL,
  p_direccion TEXT    DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nuevo usuarios%ROWTYPE;
BEGIN
  -- 1. Validar username único
  IF EXISTS (SELECT 1 FROM usuarios WHERE username = p_username) THEN
    RETURN json_build_object('success', FALSE, 'error', 'El nombre de usuario ya está en uso');
  END IF;

  -- 2. Validar CI única
  IF p_ci IS NOT NULL AND trim(p_ci) <> '' THEN
    IF EXISTS (SELECT 1 FROM usuarios WHERE ci = trim(p_ci)) THEN
      RETURN json_build_object('success', FALSE, 'error', 'Ya existe un usuario con esa cédula/CI');
    END IF;
  END IF;

  -- 3. Validar email único (solo si se proporcionó)
  IF p_email IS NOT NULL AND trim(p_email) <> '' THEN
    IF EXISTS (SELECT 1 FROM usuarios WHERE lower(email) = lower(trim(p_email))) THEN
      RETURN json_build_object('success', FALSE, 'error', 'Ya existe una cuenta con ese correo electrónico');
    END IF;
  END IF;

  -- 4. Insertar con contraseña hasheada (SHA-256 + pepper)
  INSERT INTO usuarios (username, password, nombre, rol, ci, nit, telefono, email, direccion, activo)
  VALUES (
    p_username,
    encode(sha256((p_password || '$TlrPro2026$')::bytea), 'hex'),
    p_nombre, 'cliente',
    NULLIF(trim(p_ci), ''),
    NULLIF(trim(COALESCE(p_nit, '')), ''),
    p_telefono,
    NULLIF(lower(trim(COALESCE(p_email, ''))), ''),
    NULLIF(trim(COALESCE(p_direccion, '')), ''),
    TRUE
  )
  RETURNING * INTO v_nuevo;

  RETURN json_build_object(
    'success', TRUE,
    'user', json_build_object(
      'id',        v_nuevo.id,
      'nombre',    v_nuevo.nombre,
      'username',  v_nuevo.username,
      'rol',       'cliente',
      'email',     v_nuevo.email,
      'telefono',  v_nuevo.telefono,
      'ci',        v_nuevo.ci,
      'activo',    v_nuevo.activo
    )
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object('success', FALSE, 'error', 'El usuario, cédula o correo ya está registrado');
  WHEN OTHERS THEN
    RETURN json_build_object('success', FALSE, 'error', 'Error interno al registrar: ' || SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION registrar_cliente(TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT) TO anon, authenticated;

-- ─── 6. DATOS INICIALES ──────────────────────────────────
-- ON CONFLICT DO NOTHING: seguro de correr múltiples veces
INSERT INTO usuarios (username, password, nombre, rol, email, telefono, ci, activo) VALUES
  ('admin',     'admin123',   'Admin Sistema',   'admin',    'admin@tallerpro.com',           '0000001',   '0000001', TRUE),
  ('asesor',    'asesor123',  'María García',    'asesor',   'mgarcia@tallerpro.com',         '0991234567','1234561', TRUE),
  ('jefe',      'jefe123',    'Ana Supervisora', 'jefe',     'asupervisora@tallerpro.com',    '0955678901','1234565', TRUE),
  ('mecanico',  'mec123',     'Juan Pérez',      'mecanico', 'jperez@tallerpro.com',          '0982345678','1234562', TRUE),
  ('mecanico2', 'mec456',     'Carlos Ramos',    'mecanico', 'cramos@tallerpro.com',          '0973456789','1234563', TRUE),
  ('mecanico3', 'mec789',     'Roberto Ayala',   'mecanico', 'rayala@tallerpro.com',          '0964567890','1234564', TRUE),
  ('mecanico4', 'mec101',     'Pedro Naranjo',   'mecanico', 'pnaranjo@tallerpro.com',        '0946789012','1234566', TRUE),
  ('mecanico5', 'mec202',     'Sofía Mendoza',   'mecanico', 'smendoza@tallerpro.com',        '0937890123','1234568', TRUE),
  ('cliente',   'cliente123', 'Luis Torres',     'cliente',  'ltorres@mail.com',              '0987654321','1234567', TRUE)
ON CONFLICT (username) DO NOTHING;

-- =========================================================
-- MÓDULO: CLIENTES
-- =========================================================

-- ─── 7. TABLA CLIENTES ───────────────────────────────────
CREATE TABLE IF NOT EXISTS clientes (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre         VARCHAR(100) NOT NULL,
  apellido       VARCHAR(100) NOT NULL DEFAULT '',
  ci             VARCHAR(20)  NOT NULL UNIQUE,
  nit            VARCHAR(20)  UNIQUE,
  telefono       VARCHAR(20)  NOT NULL,
  email          VARCHAR(150) UNIQUE,
  direccion      TEXT,
  usuario_id     UUID         REFERENCES usuarios(id),
  fecha_registro TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP,
  deleted_at     TIMESTAMP
);

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_clientes_ci    ON clientes(ci)    WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email) WHERE deleted_at IS NULL AND email IS NOT NULL;

-- ─── 8. RPC: listar_clientes ─────────────────────────────
CREATE OR REPLACE FUNCTION listar_clientes()
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN COALESCE((
    SELECT json_agg(
      json_build_object(
        'id',            id,
        'nombre',        CASE WHEN apellido = '' THEN nombre ELSE nombre || ' ' || apellido END,
        'ci',            ci,
        'nit',           nit,
        'telefono',      telefono,
        'email',         email,
        'direccion',     direccion,
        'usuarioId',     usuario_id,
        'fechaRegistro', TO_CHAR(fecha_registro, 'YYYY-MM-DD')
      ) ORDER BY fecha_registro DESC
    )
    FROM clientes WHERE deleted_at IS NULL
  ), '[]'::json);
END;
$$;
GRANT EXECUTE ON FUNCTION listar_clientes() TO anon, authenticated;

-- ─── 9. RPC: crear_cliente ───────────────────────────────
CREATE OR REPLACE FUNCTION crear_cliente(
  p_nombre    TEXT,
  p_ci        TEXT,
  p_nit       TEXT    DEFAULT NULL,
  p_telefono  TEXT    DEFAULT NULL,
  p_email     TEXT    DEFAULT NULL,
  p_direccion TEXT    DEFAULT NULL,
  p_usuario_id UUID   DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_nombre   TEXT;
  v_apellido TEXT;
  v_nuevo    clientes%ROWTYPE;
BEGIN
  -- Validaciones de campos obligatorios
  IF trim(p_nombre) = '' OR p_nombre IS NULL THEN
    RETURN json_build_object('success', FALSE, 'error', 'El nombre es requerido');
  END IF;
  IF trim(p_ci) = '' OR p_ci IS NULL THEN
    RETURN json_build_object('success', FALSE, 'error', 'La cédula/CI es requerida');
  END IF;
  IF trim(p_telefono) = '' OR p_telefono IS NULL THEN
    RETURN json_build_object('success', FALSE, 'error', 'El teléfono es requerido');
  END IF;

  -- Validaciones de unicidad
  IF EXISTS (SELECT 1 FROM clientes WHERE ci = trim(p_ci) AND deleted_at IS NULL) THEN
    RETURN json_build_object('success', FALSE, 'error', 'Ya existe un cliente con esa cédula/CI');
  END IF;
  IF p_nit IS NOT NULL AND trim(p_nit) <> '' THEN
    IF EXISTS (SELECT 1 FROM clientes WHERE nit = trim(p_nit) AND deleted_at IS NULL) THEN
      RETURN json_build_object('success', FALSE, 'error', 'Ya existe un cliente con ese NIT');
    END IF;
  END IF;
  IF p_email IS NOT NULL AND trim(p_email) <> '' THEN
    IF EXISTS (SELECT 1 FROM clientes WHERE email = lower(trim(p_email)) AND deleted_at IS NULL) THEN
      RETURN json_build_object('success', FALSE, 'error', 'Ya existe un cliente con ese correo electrónico');
    END IF;
  END IF;

  -- Separar nombre y apellido (primer token = nombre, resto = apellido)
  p_nombre   := trim(p_nombre);
  v_nombre   := split_part(p_nombre, ' ', 1);
  v_apellido := trim(substring(p_nombre FROM length(v_nombre) + 2));

  INSERT INTO clientes (nombre, apellido, ci, nit, telefono, email, direccion, usuario_id)
  VALUES (
    v_nombre,
    COALESCE(NULLIF(v_apellido, ''), ''),
    trim(p_ci),
    NULLIF(trim(COALESCE(p_nit, '')), ''),
    trim(p_telefono),
    NULLIF(lower(trim(COALESCE(p_email, ''))), ''),
    NULLIF(trim(COALESCE(p_direccion, '')), ''),
    p_usuario_id
  )
  RETURNING * INTO v_nuevo;

  RETURN json_build_object('success', TRUE, 'cliente', json_build_object(
    'id',            v_nuevo.id,
    'nombre',        CASE WHEN v_nuevo.apellido = '' THEN v_nuevo.nombre ELSE v_nuevo.nombre || ' ' || v_nuevo.apellido END,
    'ci',            v_nuevo.ci,
    'nit',           v_nuevo.nit,
    'telefono',      v_nuevo.telefono,
    'email',         v_nuevo.email,
    'direccion',     v_nuevo.direccion,
    'usuarioId',     v_nuevo.usuario_id,
    'fechaRegistro', TO_CHAR(v_nuevo.fecha_registro, 'YYYY-MM-DD')
  ));
EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object('success', FALSE, 'error', 'CI, NIT o email ya registrado por otro cliente');
  WHEN OTHERS THEN
    RETURN json_build_object('success', FALSE, 'error', 'Error interno: ' || SQLERRM);
END;
$$;
GRANT EXECUTE ON FUNCTION crear_cliente(TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,UUID) TO anon, authenticated;

-- ─── 10. RPC: actualizar_cliente ──────────────────────────
CREATE OR REPLACE FUNCTION actualizar_cliente(
  p_id        UUID,
  p_nombre    TEXT,
  p_ci        TEXT,
  p_nit       TEXT    DEFAULT NULL,
  p_telefono  TEXT    DEFAULT NULL,
  p_email     TEXT    DEFAULT NULL,
  p_direccion TEXT    DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_nombre   TEXT;
  v_apellido TEXT;
  v_upd      clientes%ROWTYPE;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM clientes WHERE id = p_id AND deleted_at IS NULL) THEN
    RETURN json_build_object('success', FALSE, 'error', 'Cliente no encontrado');
  END IF;
  IF EXISTS (SELECT 1 FROM clientes WHERE ci = trim(p_ci) AND id <> p_id AND deleted_at IS NULL) THEN
    RETURN json_build_object('success', FALSE, 'error', 'Ya existe otro cliente con esa cédula/CI');
  END IF;
  IF p_nit IS NOT NULL AND trim(p_nit) <> '' THEN
    IF EXISTS (SELECT 1 FROM clientes WHERE nit = trim(p_nit) AND id <> p_id AND deleted_at IS NULL) THEN
      RETURN json_build_object('success', FALSE, 'error', 'Ya existe otro cliente con ese NIT');
    END IF;
  END IF;
  IF p_email IS NOT NULL AND trim(p_email) <> '' THEN
    IF EXISTS (SELECT 1 FROM clientes WHERE email = lower(trim(p_email)) AND id <> p_id AND deleted_at IS NULL) THEN
      RETURN json_build_object('success', FALSE, 'error', 'Ya existe otro cliente con ese correo electrónico');
    END IF;
  END IF;

  p_nombre   := trim(p_nombre);
  v_nombre   := split_part(p_nombre, ' ', 1);
  v_apellido := trim(substring(p_nombre FROM length(v_nombre) + 2));

  UPDATE clientes SET
    nombre     = v_nombre,
    apellido   = COALESCE(NULLIF(v_apellido, ''), ''),
    ci         = trim(p_ci),
    nit        = NULLIF(trim(COALESCE(p_nit, '')), ''),
    telefono   = COALESCE(NULLIF(trim(p_telefono), ''), telefono),
    email      = NULLIF(lower(trim(COALESCE(p_email, ''))), ''),
    direccion  = NULLIF(trim(COALESCE(p_direccion, '')), ''),
    updated_at = NOW()
  WHERE id = p_id AND deleted_at IS NULL
  RETURNING * INTO v_upd;

  RETURN json_build_object('success', TRUE, 'cliente', json_build_object(
    'id',            v_upd.id,
    'nombre',        CASE WHEN v_upd.apellido = '' THEN v_upd.nombre ELSE v_upd.nombre || ' ' || v_upd.apellido END,
    'ci',            v_upd.ci,
    'nit',           v_upd.nit,
    'telefono',      v_upd.telefono,
    'email',         v_upd.email,
    'direccion',     v_upd.direccion,
    'fechaRegistro', TO_CHAR(v_upd.fecha_registro, 'YYYY-MM-DD')
  ));
EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object('success', FALSE, 'error', 'CI, NIT o email ya registrado por otro cliente');
  WHEN OTHERS THEN
    RETURN json_build_object('success', FALSE, 'error', 'Error interno: ' || SQLERRM);
END;
$$;
GRANT EXECUTE ON FUNCTION actualizar_cliente(UUID,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT) TO anon, authenticated;

-- ─── 11. RPC: eliminar_cliente (soft delete) ─────────────
CREATE OR REPLACE FUNCTION eliminar_cliente(p_id UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM clientes WHERE id = p_id AND deleted_at IS NULL) THEN
    RETURN json_build_object('success', FALSE, 'error', 'Cliente no encontrado');
  END IF;
  IF EXISTS (SELECT 1 FROM vehiculos WHERE cliente_id = p_id AND deleted_at IS NULL) THEN
    RETURN json_build_object('success', FALSE, 'error', 'No se puede eliminar: tiene vehículos registrados');
  END IF;
  UPDATE clientes SET deleted_at = NOW() WHERE id = p_id;
  RETURN json_build_object('success', TRUE);
END;
$$;
GRANT EXECUTE ON FUNCTION eliminar_cliente(UUID) TO anon, authenticated;

-- =========================================================
-- MÓDULO: VEHÍCULOS
-- =========================================================

-- ─── 12. TABLA VEHICULOS ─────────────────────────────────
CREATE TABLE IF NOT EXISTS vehiculos (
  id          UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id  UUID      NOT NULL REFERENCES clientes(id),
  placa       VARCHAR(20)  NOT NULL UNIQUE,
  marca       VARCHAR(50)  NOT NULL,
  modelo      VARCHAR(50)  NOT NULL,
  anio        SMALLINT     NOT NULL CHECK (anio >= 1950),
  color       VARCHAR(30),
  vin         CHAR(17)     UNIQUE,
  kilometraje INT          NOT NULL DEFAULT 0 CHECK (kilometraje >= 0),
  deleted_at  TIMESTAMP
);

ALTER TABLE vehiculos ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_vehiculos_placa   ON vehiculos(placa)      WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_vehiculos_cliente ON vehiculos(cliente_id) WHERE deleted_at IS NULL;

-- ─── 13. RPC: listar_vehiculos ───────────────────────────
CREATE OR REPLACE FUNCTION listar_vehiculos()
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN COALESCE((
    SELECT json_agg(
      json_build_object(
        'id',          id,
        'clienteId',   cliente_id,
        'placa',       placa,
        'marca',       marca,
        'modelo',      modelo,
        'anio',        anio,
        'color',       color,
        'chasis',      vin,
        'kilometraje', kilometraje
      ) ORDER BY placa
    )
    FROM vehiculos WHERE deleted_at IS NULL
  ), '[]'::json);
END;
$$;
GRANT EXECUTE ON FUNCTION listar_vehiculos() TO anon, authenticated;

-- ─── 14. RPC: crear_vehiculo ─────────────────────────────
CREATE OR REPLACE FUNCTION crear_vehiculo(
  p_cliente_id  UUID,
  p_placa       TEXT,
  p_marca       TEXT,
  p_modelo      TEXT,
  p_anio        INT,
  p_color       TEXT    DEFAULT NULL,
  p_chasis      TEXT    DEFAULT NULL,
  p_kilometraje INT     DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_nuevo vehiculos%ROWTYPE;
BEGIN
  -- Campo obligatorio: cliente existe
  IF NOT EXISTS (SELECT 1 FROM clientes WHERE id = p_cliente_id AND deleted_at IS NULL) THEN
    RETURN json_build_object('success', FALSE, 'error', 'El cliente no existe');
  END IF;
  -- Campos obligatorios
  IF trim(p_placa) = '' OR p_placa IS NULL THEN
    RETURN json_build_object('success', FALSE, 'error', 'La placa es requerida');
  END IF;
  IF trim(p_marca) = '' OR p_marca IS NULL THEN
    RETURN json_build_object('success', FALSE, 'error', 'La marca es requerida');
  END IF;
  IF trim(p_modelo) = '' OR p_modelo IS NULL THEN
    RETURN json_build_object('success', FALSE, 'error', 'El modelo es requerido');
  END IF;
  -- Validar año
  IF p_anio IS NULL OR p_anio < 1950 OR p_anio > EXTRACT(YEAR FROM NOW())::INT + 1 THEN
    RETURN json_build_object('success', FALSE, 'error', 'El año del vehículo no es válido (mínimo 1950)');
  END IF;
  -- Unicidad placa
  IF EXISTS (SELECT 1 FROM vehiculos WHERE placa = upper(trim(p_placa)) AND deleted_at IS NULL) THEN
    RETURN json_build_object('success', FALSE, 'error', 'Ya existe un vehículo con esa placa');
  END IF;
  -- Unicidad VIN/chasis
  IF p_chasis IS NOT NULL AND trim(p_chasis) <> '' THEN
    IF EXISTS (SELECT 1 FROM vehiculos WHERE vin = upper(trim(p_chasis)) AND deleted_at IS NULL) THEN
      RETURN json_build_object('success', FALSE, 'error', 'Ya existe un vehículo con ese VIN/chasis');
    END IF;
  END IF;

  INSERT INTO vehiculos (cliente_id, placa, marca, modelo, anio, color, vin, kilometraje)
  VALUES (
    p_cliente_id,
    upper(trim(p_placa)),
    trim(p_marca),
    trim(p_modelo),
    p_anio,
    NULLIF(trim(COALESCE(p_color, '')), ''),
    NULLIF(upper(trim(COALESCE(p_chasis, ''))), ''),
    COALESCE(p_kilometraje, 0)
  )
  RETURNING * INTO v_nuevo;

  RETURN json_build_object('success', TRUE, 'vehiculo', json_build_object(
    'id',          v_nuevo.id,
    'clienteId',   v_nuevo.cliente_id,
    'placa',       v_nuevo.placa,
    'marca',       v_nuevo.marca,
    'modelo',      v_nuevo.modelo,
    'anio',        v_nuevo.anio,
    'color',       v_nuevo.color,
    'chasis',      v_nuevo.vin,
    'kilometraje', v_nuevo.kilometraje
  ));
EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object('success', FALSE, 'error', 'Placa o VIN ya registrado por otro vehículo');
  WHEN check_violation THEN
    RETURN json_build_object('success', FALSE, 'error', 'Año o kilometraje inválido');
  WHEN OTHERS THEN
    RETURN json_build_object('success', FALSE, 'error', 'Error interno: ' || SQLERRM);
END;
$$;
GRANT EXECUTE ON FUNCTION crear_vehiculo(UUID,TEXT,TEXT,TEXT,INT,TEXT,TEXT,INT) TO anon, authenticated;

-- ─── 15. RPC: actualizar_vehiculo ────────────────────────
CREATE OR REPLACE FUNCTION actualizar_vehiculo(
  p_id          UUID,
  p_cliente_id  UUID,
  p_placa       TEXT,
  p_marca       TEXT,
  p_modelo      TEXT,
  p_anio        INT,
  p_color       TEXT    DEFAULT NULL,
  p_chasis      TEXT    DEFAULT NULL,
  p_kilometraje INT     DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_upd vehiculos%ROWTYPE;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vehiculos WHERE id = p_id AND deleted_at IS NULL) THEN
    RETURN json_build_object('success', FALSE, 'error', 'Vehículo no encontrado');
  END IF;
  IF EXISTS (SELECT 1 FROM vehiculos WHERE placa = upper(trim(p_placa)) AND id <> p_id AND deleted_at IS NULL) THEN
    RETURN json_build_object('success', FALSE, 'error', 'Ya existe otro vehículo con esa placa');
  END IF;
  IF p_chasis IS NOT NULL AND trim(p_chasis) <> '' THEN
    IF EXISTS (SELECT 1 FROM vehiculos WHERE vin = upper(trim(p_chasis)) AND id <> p_id AND deleted_at IS NULL) THEN
      RETURN json_build_object('success', FALSE, 'error', 'Ya existe otro vehículo con ese VIN/chasis');
    END IF;
  END IF;
  IF p_anio < 1950 OR p_anio > EXTRACT(YEAR FROM NOW())::INT + 1 THEN
    RETURN json_build_object('success', FALSE, 'error', 'Año inválido');
  END IF;

  UPDATE vehiculos SET
    cliente_id  = p_cliente_id,
    placa       = upper(trim(p_placa)),
    marca       = trim(p_marca),
    modelo      = trim(p_modelo),
    anio        = p_anio,
    color       = NULLIF(trim(COALESCE(p_color, '')), ''),
    vin         = NULLIF(upper(trim(COALESCE(p_chasis, ''))), ''),
    kilometraje = COALESCE(p_kilometraje, kilometraje)
  WHERE id = p_id AND deleted_at IS NULL
  RETURNING * INTO v_upd;

  RETURN json_build_object('success', TRUE, 'vehiculo', json_build_object(
    'id',          v_upd.id,
    'clienteId',   v_upd.cliente_id,
    'placa',       v_upd.placa,
    'marca',       v_upd.marca,
    'modelo',      v_upd.modelo,
    'anio',        v_upd.anio,
    'color',       v_upd.color,
    'chasis',      v_upd.vin,
    'kilometraje', v_upd.kilometraje
  ));
EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object('success', FALSE, 'error', 'Placa o VIN ya registrado');
  WHEN OTHERS THEN
    RETURN json_build_object('success', FALSE, 'error', 'Error interno: ' || SQLERRM);
END;
$$;
GRANT EXECUTE ON FUNCTION actualizar_vehiculo(UUID,UUID,TEXT,TEXT,TEXT,INT,TEXT,TEXT,INT) TO anon, authenticated;

-- ─── 16. RPC: eliminar_vehiculo (soft delete) ────────────
CREATE OR REPLACE FUNCTION eliminar_vehiculo(p_id UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vehiculos WHERE id = p_id AND deleted_at IS NULL) THEN
    RETURN json_build_object('success', FALSE, 'error', 'Vehículo no encontrado');
  END IF;
  UPDATE vehiculos SET deleted_at = NOW() WHERE id = p_id;
  RETURN json_build_object('success', TRUE);
END;
$$;
GRANT EXECUTE ON FUNCTION eliminar_vehiculo(UUID) TO anon, authenticated;

-- =========================================================
-- MÓDULO: CITAS
-- =========================================================

-- ─── 17. TABLA CITAS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS citas (
  id             UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id     UUID         REFERENCES clientes(id),
  vehiculo_id    UUID         REFERENCES vehiculos(id),
  tipo_servicio  VARCHAR(100) NOT NULL DEFAULT 'Por confirmar',
  motivo_ingreso TEXT,
  fecha          DATE         NOT NULL,
  hora           VARCHAR(5)   NOT NULL,
  estado         VARCHAR(20)  NOT NULL DEFAULT 'pendiente'
                   CHECK (estado IN ('pendiente','confirmada','en_progreso','completada','cancelada')),
  notas          TEXT,
  orden_id       UUID,
  asesor_id      UUID         REFERENCES usuarios(id),
  creado_por     UUID         REFERENCES usuarios(id),
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ
);

ALTER TABLE citas ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_citas_fecha      ON citas(fecha)      WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_citas_cliente    ON citas(cliente_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_citas_estado     ON citas(estado)     WHERE deleted_at IS NULL;

-- ─── 18. RPC: listar_citas ────────────────────────────────
-- Clientes ven solo sus propias citas; staff ve todas.
CREATE OR REPLACE FUNCTION listar_citas(
  p_usuario_id UUID DEFAULT NULL,
  p_rol        TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF p_rol = 'cliente' AND p_usuario_id IS NOT NULL THEN
    RETURN COALESCE((
      SELECT json_agg(row_to_json(t) ORDER BY t.fecha, t.hora)
      FROM (
        SELECT
          c.id,
          c.cliente_id     AS "clienteId",
          c.vehiculo_id    AS "vehiculoId",
          c.tipo_servicio  AS "tipoServicio",
          c.motivo_ingreso AS "motivoIngreso",
          c.fecha::TEXT,
          c.hora,
          c.estado,
          c.notas,
          c.orden_id       AS "ordenId"
        FROM citas c
        JOIN clientes cl ON cl.id = c.cliente_id
        WHERE cl.usuario_id = p_usuario_id
          AND c.deleted_at IS NULL
      ) t
    ), '[]'::json);
  ELSE
    RETURN COALESCE((
      SELECT json_agg(row_to_json(t) ORDER BY t.fecha, t.hora)
      FROM (
        SELECT
          c.id,
          c.cliente_id     AS "clienteId",
          c.vehiculo_id    AS "vehiculoId",
          c.tipo_servicio  AS "tipoServicio",
          c.motivo_ingreso AS "motivoIngreso",
          c.fecha::TEXT,
          c.hora,
          c.estado,
          c.notas,
          c.orden_id       AS "ordenId"
        FROM citas c
        WHERE c.deleted_at IS NULL
      ) t
    ), '[]'::json);
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION listar_citas(UUID, TEXT) TO anon, authenticated;

-- ─── 19. RPC: crear_cita ─────────────────────────────────
-- Valida slot libre (no doble reserva en misma fecha+hora).
CREATE OR REPLACE FUNCTION crear_cita(
  p_fecha          DATE,
  p_hora           TEXT,
  p_cliente_id     UUID    DEFAULT NULL,
  p_vehiculo_id    UUID    DEFAULT NULL,
  p_tipo_servicio  TEXT    DEFAULT 'Por confirmar',
  p_motivo_ingreso TEXT    DEFAULT NULL,
  p_notas          TEXT    DEFAULT NULL,
  p_estado         TEXT    DEFAULT 'pendiente',
  p_creado_por     UUID    DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_nueva citas%ROWTYPE;
BEGIN
  -- Campos obligatorios
  IF p_fecha IS NULL THEN
    RETURN json_build_object('success', FALSE, 'error', 'La fecha es requerida');
  END IF;
  IF p_hora IS NULL OR trim(p_hora) = '' THEN
    RETURN json_build_object('success', FALSE, 'error', 'La hora es requerida');
  END IF;

  -- Validar slot libre (misma fecha + hora, estado activo)
  IF EXISTS (
    SELECT 1 FROM citas
    WHERE fecha = p_fecha
      AND hora  = p_hora
      AND estado NOT IN ('cancelada')
      AND deleted_at IS NULL
  ) THEN
    RETURN json_build_object('success', FALSE, 'error', 'Esa franja horaria ya está reservada');
  END IF;

  INSERT INTO citas (
    cliente_id, vehiculo_id, tipo_servicio, motivo_ingreso,
    fecha, hora, notas, estado, creado_por
  ) VALUES (
    p_cliente_id, p_vehiculo_id,
    COALESCE(NULLIF(trim(p_tipo_servicio), ''), 'Por confirmar'),
    NULLIF(trim(COALESCE(p_motivo_ingreso, '')), ''),
    p_fecha, p_hora,
    NULLIF(trim(COALESCE(p_notas, '')), ''),
    COALESCE(NULLIF(trim(p_estado), ''), 'pendiente'),
    p_creado_por
  )
  RETURNING * INTO v_nueva;

  RETURN json_build_object('success', TRUE, 'cita', json_build_object(
    'id',             v_nueva.id,
    'clienteId',      v_nueva.cliente_id,
    'vehiculoId',     v_nueva.vehiculo_id,
    'tipoServicio',   v_nueva.tipo_servicio,
    'motivoIngreso',  v_nueva.motivo_ingreso,
    'fecha',          v_nueva.fecha::TEXT,
    'hora',           v_nueva.hora,
    'estado',         v_nueva.estado,
    'notas',          v_nueva.notas,
    'ordenId',        v_nueva.orden_id
  ));
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', FALSE, 'error', 'Error interno: ' || SQLERRM);
END;
$$;
GRANT EXECUTE ON FUNCTION crear_cita(DATE,TEXT,UUID,UUID,TEXT,TEXT,TEXT,TEXT,UUID) TO anon, authenticated;

-- ─── 20. RPC: actualizar_cita ────────────────────────────
-- Actualiza solo los campos provistos (NULL = no cambia).
-- Revalida slot si cambia fecha u hora.
CREATE OR REPLACE FUNCTION actualizar_cita(
  p_id             UUID,
  p_tipo_servicio  TEXT    DEFAULT NULL,
  p_motivo_ingreso TEXT    DEFAULT NULL,
  p_fecha          DATE    DEFAULT NULL,
  p_hora           TEXT    DEFAULT NULL,
  p_estado         TEXT    DEFAULT NULL,
  p_notas          TEXT    DEFAULT NULL,
  p_vehiculo_id    UUID    DEFAULT NULL,
  p_asesor_id      UUID    DEFAULT NULL,
  p_orden_id       UUID    DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_cita citas%ROWTYPE;
  v_nueva_fecha DATE;
  v_nueva_hora  TEXT;
BEGIN
  SELECT * INTO v_cita FROM citas WHERE id = p_id AND deleted_at IS NULL;
  IF NOT FOUND THEN
    RETURN json_build_object('success', FALSE, 'error', 'Cita no encontrada');
  END IF;

  -- Calcular fecha/hora resultantes para validar slot
  v_nueva_fecha := COALESCE(p_fecha, v_cita.fecha);
  v_nueva_hora  := COALESCE(p_hora,  v_cita.hora);

  -- Solo revalidar slot si cambiaron fecha u hora
  IF (p_fecha IS NOT NULL AND p_fecha <> v_cita.fecha)
     OR (p_hora IS NOT NULL AND p_hora <> v_cita.hora) THEN
    IF EXISTS (
      SELECT 1 FROM citas
      WHERE fecha = v_nueva_fecha
        AND hora  = v_nueva_hora
        AND id   <> p_id
        AND estado NOT IN ('cancelada')
        AND deleted_at IS NULL
    ) THEN
      RETURN json_build_object('success', FALSE, 'error', 'Esa franja horaria ya está reservada');
    END IF;
  END IF;

  UPDATE citas SET
    tipo_servicio  = COALESCE(p_tipo_servicio,  tipo_servicio),
    motivo_ingreso = COALESCE(p_motivo_ingreso, motivo_ingreso),
    fecha          = v_nueva_fecha,
    hora           = v_nueva_hora,
    estado         = COALESCE(p_estado,         estado),
    notas          = COALESCE(p_notas,          notas),
    vehiculo_id    = COALESCE(p_vehiculo_id,    vehiculo_id),
    asesor_id      = COALESCE(p_asesor_id,      asesor_id),
    orden_id       = COALESCE(p_orden_id,       orden_id)
  WHERE id = p_id
  RETURNING * INTO v_cita;

  RETURN json_build_object('success', TRUE, 'cita', json_build_object(
    'id',             v_cita.id,
    'clienteId',      v_cita.cliente_id,
    'vehiculoId',     v_cita.vehiculo_id,
    'tipoServicio',   v_cita.tipo_servicio,
    'motivoIngreso',  v_cita.motivo_ingreso,
    'fecha',          v_cita.fecha::TEXT,
    'hora',           v_cita.hora,
    'estado',         v_cita.estado,
    'notas',          v_cita.notas,
    'ordenId',        v_cita.orden_id
  ));
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', FALSE, 'error', 'Error interno: ' || SQLERRM);
END;
$$;
GRANT EXECUTE ON FUNCTION actualizar_cita(UUID,TEXT,TEXT,DATE,TEXT,TEXT,TEXT,UUID,UUID,UUID) TO anon, authenticated;

-- ─── 21. RPC: eliminar_cita (soft delete) ────────────────
CREATE OR REPLACE FUNCTION eliminar_cita(p_id UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE citas SET deleted_at = NOW() WHERE id = p_id AND deleted_at IS NULL;
  IF NOT FOUND THEN
    RETURN json_build_object('success', FALSE, 'error', 'Cita no encontrada');
  END IF;
  RETURN json_build_object('success', TRUE);
END;
$$;
GRANT EXECUTE ON FUNCTION eliminar_cita(UUID) TO anon, authenticated;

-- ─── 22. RPC: confirmar_cita ─────────────────────────────
-- Solo aplica a citas en estado 'pendiente'. Registra el asesor que confirmó.
CREATE OR REPLACE FUNCTION confirmar_cita(
  p_id        UUID,
  p_asesor_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_cita citas%ROWTYPE;
BEGIN
  SELECT * INTO v_cita FROM citas WHERE id = p_id AND deleted_at IS NULL;
  IF NOT FOUND THEN
    RETURN json_build_object('success', FALSE, 'error', 'Cita no encontrada');
  END IF;
  IF v_cita.estado <> 'pendiente' THEN
    RETURN json_build_object('success', FALSE, 'error',
      'Solo se pueden confirmar citas pendientes (estado actual: ' || v_cita.estado || ')');
  END IF;

  UPDATE citas
  SET estado    = 'confirmada',
      asesor_id = COALESCE(p_asesor_id, asesor_id)
  WHERE id = p_id
  RETURNING * INTO v_cita;

  RETURN json_build_object('success', TRUE, 'cita', json_build_object(
    'id',             v_cita.id,
    'clienteId',      v_cita.cliente_id,
    'vehiculoId',     v_cita.vehiculo_id,
    'tipoServicio',   v_cita.tipo_servicio,
    'motivoIngreso',  v_cita.motivo_ingreso,
    'fecha',          v_cita.fecha::TEXT,
    'hora',           v_cita.hora,
    'estado',         v_cita.estado,
    'notas',          v_cita.notas,
    'ordenId',        v_cita.orden_id
  ));
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', FALSE, 'error', 'Error interno: ' || SQLERRM);
END;
$$;
GRANT EXECUTE ON FUNCTION confirmar_cita(UUID, UUID) TO anon, authenticated;

-- ─── 23. RPC: reprogramar_cita ───────────────────────────
-- Valida: estado activo, fecha no pasada, slot disponible. Actualiza fecha+hora.
CREATE OR REPLACE FUNCTION reprogramar_cita(
  p_id          UUID,
  p_nueva_fecha DATE,
  p_nueva_hora  TEXT
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_cita citas%ROWTYPE;
BEGIN
  SELECT * INTO v_cita FROM citas WHERE id = p_id AND deleted_at IS NULL;
  IF NOT FOUND THEN
    RETURN json_build_object('success', FALSE, 'error', 'Cita no encontrada');
  END IF;

  -- Solo se pueden reprogramar citas activas
  IF v_cita.estado IN ('completada', 'cancelada', 'en_progreso') THEN
    RETURN json_build_object('success', FALSE, 'error',
      'No se puede reprogramar una cita en estado ' || v_cita.estado);
  END IF;

  -- No permitir fechas pasadas
  IF p_nueva_fecha < CURRENT_DATE THEN
    RETURN json_build_object('success', FALSE, 'error', 'No se puede reprogramar a una fecha pasada');
  END IF;

  -- Validar disponibilidad del nuevo slot
  IF EXISTS (
    SELECT 1 FROM citas
    WHERE fecha      = p_nueva_fecha
      AND hora       = p_nueva_hora
      AND id        <> p_id
      AND estado NOT IN ('cancelada')
      AND deleted_at IS NULL
  ) THEN
    RETURN json_build_object('success', FALSE, 'error', 'Esa franja horaria ya está ocupada');
  END IF;

  UPDATE citas
  SET fecha = p_nueva_fecha,
      hora  = p_nueva_hora
  WHERE id = p_id
  RETURNING * INTO v_cita;

  RETURN json_build_object('success', TRUE, 'cita', json_build_object(
    'id',             v_cita.id,
    'clienteId',      v_cita.cliente_id,
    'vehiculoId',     v_cita.vehiculo_id,
    'tipoServicio',   v_cita.tipo_servicio,
    'motivoIngreso',  v_cita.motivo_ingreso,
    'fecha',          v_cita.fecha::TEXT,
    'hora',           v_cita.hora,
    'estado',         v_cita.estado,
    'notas',          v_cita.notas,
    'ordenId',        v_cita.orden_id
  ));
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', FALSE, 'error', 'Error interno: ' || SQLERRM);
END;
$$;
GRANT EXECUTE ON FUNCTION reprogramar_cita(UUID, DATE, TEXT) TO anon, authenticated;

-- ─── 24. RPC: cancelar_cita ──────────────────────────────
-- No cancela citas completadas/en_progreso. Registra motivo en notas.
CREATE OR REPLACE FUNCTION cancelar_cita(
  p_id     UUID,
  p_motivo TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_cita citas%ROWTYPE;
BEGIN
  SELECT * INTO v_cita FROM citas WHERE id = p_id AND deleted_at IS NULL;
  IF NOT FOUND THEN
    RETURN json_build_object('success', FALSE, 'error', 'Cita no encontrada');
  END IF;

  IF v_cita.estado IN ('completada', 'cancelada', 'en_progreso') THEN
    RETURN json_build_object('success', FALSE, 'error',
      'No se puede cancelar una cita en estado ' || v_cita.estado);
  END IF;

  UPDATE citas
  SET estado = 'cancelada',
      notas  = CASE
                 WHEN p_motivo IS NOT NULL AND trim(p_motivo) <> ''
                 THEN COALESCE(notas || ' | ', '') || 'Cancelación: ' || trim(p_motivo)
                 ELSE notas
               END
  WHERE id = p_id
  RETURNING * INTO v_cita;

  RETURN json_build_object('success', TRUE, 'cita', json_build_object(
    'id',             v_cita.id,
    'clienteId',      v_cita.cliente_id,
    'vehiculoId',     v_cita.vehiculo_id,
    'tipoServicio',   v_cita.tipo_servicio,
    'motivoIngreso',  v_cita.motivo_ingreso,
    'fecha',          v_cita.fecha::TEXT,
    'hora',           v_cita.hora,
    'estado',         v_cita.estado,
    'notas',          v_cita.notas,
    'ordenId',        v_cita.orden_id
  ));
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', FALSE, 'error', 'Error interno: ' || SQLERRM);
END;
$$;
GRANT EXECUTE ON FUNCTION cancelar_cita(UUID, TEXT) TO anon, authenticated;

-- ─── 25. RPC: trazabilidad_vehiculo ──────────────────────
-- Historial completo de servicios vinculado a la placa.
-- Devuelve: vehículo, cliente propietario, todas las citas
-- y un resumen estadístico. Las OTs se complementan desde
-- el frontend hasta que sean migradas a Supabase.
CREATE OR REPLACE FUNCTION trazabilidad_vehiculo(p_placa TEXT)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_veh vehiculos%ROWTYPE;
  v_cli clientes%ROWTYPE;
BEGIN
  -- Buscar vehículo (case-insensitive, ignora espacios)
  SELECT * INTO v_veh
  FROM vehiculos
  WHERE lower(trim(placa)) = lower(trim(p_placa))
    AND deleted_at IS NULL
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', FALSE,
      'error',   'No se encontró ningún vehículo con la placa indicada'
    );
  END IF;

  -- Buscar cliente propietario
  SELECT * INTO v_cli
  FROM clientes
  WHERE id = v_veh.cliente_id AND deleted_at IS NULL;

  RETURN json_build_object(
    'success', TRUE,

    -- Datos del vehículo
    'vehiculo', json_build_object(
      'id',          v_veh.id,
      'placa',       v_veh.placa,
      'marca',       v_veh.marca,
      'modelo',      v_veh.modelo,
      'anio',        v_veh.anio,
      'color',       v_veh.color,
      'chasis',      v_veh.chasis,
      'kilometraje', v_veh.kilometraje
    ),

    -- Datos del propietario
    'cliente', CASE WHEN v_cli.id IS NOT NULL THEN json_build_object(
      'id',        v_cli.id,
      'nombre',    v_cli.nombre,
      'ci',        v_cli.ci,
      'telefono',  v_cli.telefono,
      'email',     v_cli.email,
      'direccion', v_cli.direccion
    ) ELSE NULL END,

    -- Todas las citas del vehículo (ordenadas por fecha desc)
    'citas', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id',            c.id,
          'fecha',         c.fecha::TEXT,
          'hora',          c.hora,
          'estado',        c.estado,
          'tipoServicio',  c.tipo_servicio,
          'motivoIngreso', c.motivo_ingreso,
          'notas',         c.notas,
          'ordenId',       c.orden_id
        ) ORDER BY c.fecha DESC, c.hora DESC
      ), '[]'::json)
      FROM citas c
      WHERE c.vehiculo_id = v_veh.id
        AND c.deleted_at IS NULL
    ),

    -- Resumen estadístico
    'resumen', json_build_object(
      'totalCitas', (
        SELECT COUNT(*) FROM citas
        WHERE vehiculo_id = v_veh.id AND deleted_at IS NULL
      ),
      'citasActivas', (
        SELECT COUNT(*) FROM citas
        WHERE vehiculo_id = v_veh.id
          AND estado NOT IN ('cancelada', 'completada')
          AND deleted_at IS NULL
      ),
      'ultimaCita', (
        SELECT fecha::TEXT FROM citas
        WHERE vehiculo_id = v_veh.id AND deleted_at IS NULL
        ORDER BY fecha DESC, hora DESC LIMIT 1
      )
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', FALSE, 'error', 'Error interno: ' || SQLERRM);
END;
$$;
GRANT EXECUTE ON FUNCTION trazabilidad_vehiculo(TEXT) TO anon, authenticated;

-- ─── 26. Migración masiva de contraseñas a SHA-256 ───────
-- Ejecutar UNA SOLA VEZ después de aplicar este script.
-- Hashea todas las contraseñas que aún están en texto plano.
-- login_usuario ya migra individualmente en cada login,
-- pero este bloque adelanta la migración de todos los usuarios de golpe.
-- No requiere ninguna extensión (sha256 es built-in en PostgreSQL 14+).
DO $$
DECLARE
  r       RECORD;
  v_pepper CONSTANT TEXT := '$TlrPro2026$';
BEGIN
  FOR r IN
    SELECT id, password FROM usuarios
    WHERE NOT (length(password) = 64 AND password ~ '^[0-9a-f]{64}$')
  LOOP
    UPDATE usuarios
    SET password = encode(sha256((r.password || v_pepper)::bytea), 'hex')
    WHERE id = r.id;
  END LOOP;
END;
$$;

-- ─── 27. CRUD de Usuarios (admin panel) ──────────────────
-- listar_usuarios: devuelve todos los usuarios con roles mapeados al app.
-- crear_usuario: inserta con contraseña hasheada.
-- actualizar_usuario: edita datos; si p_password no está vacío, re-hashea.
-- toggle_activo_usuario: activa / desactiva un usuario (deactivación lógica).

CREATE OR REPLACE FUNCTION listar_usuarios()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT json_agg(
      json_build_object(
        'id',             id,
        'username',       username,
        'nombre',         nombre,
        'rol',            CASE rol
                            WHEN 'admin' THEN 'administrador'
                            WHEN 'jefe'  THEN 'jefe_taller'
                            ELSE rol
                          END,
        'email',          email,
        'telefono',       telefono,
        'ci',             ci,
        'activo',         activo,
        'password',       password,
        'fechaCreacion',  created_at
      ) ORDER BY created_at ASC
    )
    FROM usuarios
  );
END;
$$;
GRANT EXECUTE ON FUNCTION listar_usuarios() TO anon, authenticated;

-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION crear_usuario(
  p_nombre    TEXT,
  p_username  TEXT,
  p_password  TEXT,
  p_rol       TEXT,   -- app role: 'administrador'|'asesor'|'mecanico'|'jefe_taller'|'cliente'
  p_email     TEXT    DEFAULT NULL,
  p_telefono  TEXT    DEFAULT NULL,
  p_ci        TEXT    DEFAULT NULL,
  p_activo    BOOLEAN DEFAULT TRUE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_db_rol  TEXT;
  v_pepper  CONSTANT TEXT := '$TlrPro2026$';
  v_hash    TEXT;
  v_new     usuarios%ROWTYPE;
BEGIN
  -- Validar unicidad de username
  IF EXISTS (SELECT 1 FROM usuarios WHERE lower(username) = lower(p_username)) THEN
    RETURN json_build_object('success', FALSE, 'error', 'El nombre de usuario ya existe');
  END IF;

  -- Mapear rol app → rol DB
  v_db_rol := CASE p_rol
    WHEN 'administrador' THEN 'admin'
    WHEN 'jefe_taller'   THEN 'jefe'
    ELSE p_rol
  END;

  -- Hash de contraseña
  v_hash := encode(sha256((p_password || v_pepper)::bytea), 'hex');

  INSERT INTO usuarios (username, password, nombre, rol, email, telefono, ci, activo)
  VALUES (p_username, v_hash, p_nombre, v_db_rol, p_email, p_telefono, p_ci, p_activo)
  RETURNING * INTO v_new;

  RETURN json_build_object(
    'success', TRUE,
    'usuario', json_build_object(
      'id',            v_new.id,
      'username',      v_new.username,
      'nombre',        v_new.nombre,
      'rol',           p_rol,
      'email',         v_new.email,
      'telefono',      v_new.telefono,
      'ci',            v_new.ci,
      'activo',        v_new.activo,
      'password',      v_new.password,
      'fechaCreacion', v_new.created_at
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', FALSE, 'error', SQLERRM);
END;
$$;
GRANT EXECUTE ON FUNCTION crear_usuario(TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,BOOLEAN) TO anon, authenticated;

-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION actualizar_usuario(
  p_id        UUID,
  p_nombre    TEXT,
  p_username  TEXT,
  p_password  TEXT    DEFAULT NULL,  -- NULL o vacío = sin cambiar contraseña
  p_rol       TEXT    DEFAULT NULL,
  p_email     TEXT    DEFAULT NULL,
  p_telefono  TEXT    DEFAULT NULL,
  p_ci        TEXT    DEFAULT NULL,
  p_activo    BOOLEAN DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_db_rol TEXT;
  v_pepper CONSTANT TEXT := '$TlrPro2026$';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM usuarios WHERE id = p_id) THEN
    RETURN json_build_object('success', FALSE, 'error', 'Usuario no encontrado');
  END IF;

  -- Validar username único (excluyendo el propio registro)
  IF EXISTS (SELECT 1 FROM usuarios WHERE lower(username) = lower(p_username) AND id <> p_id) THEN
    RETURN json_build_object('success', FALSE, 'error', 'El nombre de usuario ya existe');
  END IF;

  -- Mapear rol si se envía
  IF p_rol IS NOT NULL THEN
    v_db_rol := CASE p_rol
      WHEN 'administrador' THEN 'admin'
      WHEN 'jefe_taller'   THEN 'jefe'
      ELSE p_rol
    END;
  END IF;

  UPDATE usuarios SET
    nombre    = p_nombre,
    username  = p_username,
    password  = CASE
                  WHEN p_password IS NOT NULL AND trim(p_password) <> ''
                  THEN encode(sha256((p_password || v_pepper)::bytea), 'hex')
                  ELSE password
                END,
    rol       = COALESCE(v_db_rol, rol),
    email     = COALESCE(p_email,     email),
    telefono  = COALESCE(p_telefono,  telefono),
    ci        = COALESCE(p_ci,        ci),
    activo    = COALESCE(p_activo,    activo)
  WHERE id = p_id;

  RETURN json_build_object('success', TRUE);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', FALSE, 'error', SQLERRM);
END;
$$;
GRANT EXECUTE ON FUNCTION actualizar_usuario(UUID,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,BOOLEAN) TO anon, authenticated;

-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION toggle_activo_usuario(p_id UUID, p_activo BOOLEAN)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE usuarios SET activo = p_activo WHERE id = p_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', FALSE, 'error', 'Usuario no encontrado');
  END IF;
  RETURN json_build_object('success', TRUE);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', FALSE, 'error', SQLERRM);
END;
$$;
GRANT EXECUTE ON FUNCTION toggle_activo_usuario(UUID, BOOLEAN) TO anon, authenticated;
