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
  ('ezedu',    '123456',  'María García',    'cliente',   'mgarcia@tallerpro.com',         '0991234567','1234561', TRUE),
  ('juanquis',      '123456',    'Ana Supervisora', 'mecanico',     'asupervisora@tallerpro.com',    '0955678901','1234565', TRUE),
  ('dybala',  '123456',     'Juan Pérez',      'asesor', 'jperez@tallerpro.com',          '0982345678','1234562', TRUE),
  ('cr7', '123456',     'Carlos Ramos',    'jefe', 'cramos@tallerpro.com',          '0973456789','1234563', TRUE),
  ('arteta', '123456',     'Roberto Ayala',   'cliente', 'rayala@tallerpro.com',          '0964567890','1234564', TRUE)
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

-- ─── 7a. Table: proveedores ────────────────────────────────
CREATE TABLE IF NOT EXISTS proveedores (
  id        UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre    VARCHAR(100) NOT NULL,
  contacto  VARCHAR(100),
  telefono  VARCHAR(20)  NOT NULL,
  email     VARCHAR(100) NOT NULL,
  productos TEXT,
  activo    BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_clientes_ci    ON clientes(ci)    WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email) WHERE deleted_at IS NULL AND email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_usuario_id_unique ON clientes(usuario_id);

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

  -- Sincronizar usuario_id si existe
  IF v_upd.usuario_id IS NOT NULL THEN
     UPDATE usuarios SET 
       direccion = NULLIF(trim(COALESCE(p_direccion, '')), ''),
       telefono = COALESCE(NULLIF(trim(p_telefono), ''), telefono),
       email = NULLIF(lower(trim(COALESCE(p_email, ''))), ''),
       ci = trim(p_ci)
     WHERE id = v_upd.usuario_id;
  END IF;

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
-- MÓDULO: PROVEEDORES
-- =========================================================

-- ─── 11a. RPC: listar_proveedores ──────────────────────────
CREATE OR REPLACE FUNCTION listar_proveedores()
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN COALESCE((
    SELECT json_agg(
      json_build_object(
        'id', id,
        'nombre', nombre,
        'contacto', contacto,
        'telefono', telefono,
        'email', email,
        'productos', productos,
        'activo', activo
      ) ORDER BY nombre
    )
    FROM proveedores
  ), '[]'::json);
END;
$$;
GRANT EXECUTE ON FUNCTION listar_proveedores() TO anon, authenticated;

-- ─── 11b. RPC: crear_proveedor ────────────────────────────
CREATE OR REPLACE FUNCTION crear_proveedor(
  p_nombre TEXT,
  p_telefono TEXT,
  p_email TEXT,
  p_contacto TEXT DEFAULT NULL,
  p_productos TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Validaciones
  IF trim(p_nombre) = '' OR p_nombre IS NULL THEN
    RETURN json_build_object('ok', FALSE, 'error', 'Nombre es obligatorio');
  END IF;
  IF trim(p_telefono) = '' OR p_telefono IS NULL THEN
    RETURN json_build_object('ok', FALSE, 'error', 'Teléfono es obligatorio');
  END IF;
  IF trim(p_email) = '' OR p_email IS NULL THEN
    RETURN json_build_object('ok', FALSE, 'error', 'Email es obligatorio');
  END IF;

  -- Insertar
  INSERT INTO proveedores (nombre, contacto, telefono, email, productos, activo)
  VALUES (trim(p_nombre), NULLIF(trim(p_contacto), ''), trim(p_telefono), trim(p_email), p_productos, TRUE)
  RETURNING id INTO v_id;

  RETURN json_build_object(
    'ok', TRUE,
    'proveedor', json_build_object(
      'id', v_id,
      'nombre', p_nombre,
      'contacto', p_contacto,
      'telefono', p_telefono,
      'email', p_email,
      'productos', p_productos,
      'activo', TRUE
    )
  );
END;
$$;
GRANT EXECUTE ON FUNCTION crear_proveedor(TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

-- ─── 11c. RPC: actualizar_proveedor ───────────────────────
CREATE OR REPLACE FUNCTION actualizar_proveedor(
  p_id UUID,
  p_nombre TEXT DEFAULT NULL,
  p_contacto TEXT DEFAULT NULL,
  p_telefono TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_productos TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM proveedores WHERE id = p_id) THEN
    RETURN json_build_object('ok', FALSE, 'error', 'Proveedor no encontrado');
  END IF;

  UPDATE proveedores SET
    nombre = COALESCE(NULLIF(trim(p_nombre), ''), nombre),
    contacto = COALESCE(NULLIF(trim(p_contacto), ''), contacto),
    telefono = COALESCE(NULLIF(trim(p_telefono), ''), telefono),
    email = COALESCE(NULLIF(trim(p_email), ''), email),
    productos = COALESCE(p_productos, productos)
  WHERE id = p_id;

  RETURN json_build_object('ok', TRUE);
END;
$$;
GRANT EXECUTE ON FUNCTION actualizar_proveedor(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

-- ─── 11d. RPC: toggle_estado_proveedor ────────────────────
CREATE OR REPLACE FUNCTION toggle_estado_proveedor(p_id UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_nuevo_estado BOOLEAN;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM proveedores WHERE id = p_id) THEN
    RETURN json_build_object('ok', FALSE, 'error', 'Proveedor no encontrado');
  END IF;

  UPDATE proveedores SET activo = NOT activo WHERE id = p_id
  RETURNING activo INTO v_nuevo_estado;

  RETURN json_build_object('ok', TRUE, 'activo', v_nuevo_estado);
END;
$$;
GRANT EXECUTE ON FUNCTION toggle_estado_proveedor(UUID) TO anon, authenticated;

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
  p_activo    BOOLEAN DEFAULT TRUE,
  p_direccion TEXT    DEFAULT NULL
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

  INSERT INTO usuarios (username, password, nombre, rol, email, telefono, ci, activo, direccion)
  VALUES (p_username, v_hash, p_nombre, v_db_rol, p_email, p_telefono, p_ci, p_activo, p_direccion)
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
      'direccion',     v_new.direccion,
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
  p_activo    BOOLEAN DEFAULT NULL,
  p_direccion TEXT    DEFAULT NULL
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
    activo    = COALESCE(p_activo,    activo),
    direccion = COALESCE(p_direccion, direccion)
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

-- ─── 28. TABLA: repuestos ────────────────────────────────
CREATE TABLE IF NOT EXISTS repuestos (
  id                 UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre             VARCHAR(100)  NOT NULL,
  categoria          VARCHAR(50),
  cantidad           INT           NOT NULL DEFAULT 0,
  cantidad_reservada INT           NOT NULL DEFAULT 0,
  costo              DECIMAL(10,2) NOT NULL DEFAULT 0,
  margen_ganancia    DECIMAL(10,2) NOT NULL DEFAULT 0,
  precio             DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock_minimo       INT           NOT NULL DEFAULT 1,
  proveedor_id       UUID,
  imagen             TEXT,
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  deleted_at         TIMESTAMPTZ
);
ALTER TABLE repuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE repuestos DROP CONSTRAINT IF EXISTS fk_repuesto_proveedor;
ALTER TABLE repuestos ADD CONSTRAINT fk_repuesto_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL;

-- ─── 29. TABLA: ordenes_trabajo ──────────────────────────
CREATE TABLE IF NOT EXISTS ordenes_trabajo (
  id                 UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  numero             VARCHAR(20)   NOT NULL UNIQUE,
  cliente_id         UUID          NOT NULL REFERENCES clientes(id),
  vehiculo_id        UUID          NOT NULL REFERENCES vehiculos(id),
  mecanico_id        UUID          REFERENCES usuarios(id),
  estado             VARCHAR(30)   NOT NULL DEFAULT 'registrada',
  factura_id         VARCHAR(50),
  fecha_creacion     DATE          NOT NULL DEFAULT CURRENT_DATE,
  fecha_actualizacion DATE         NOT NULL DEFAULT CURRENT_DATE,
  creado_por         UUID          REFERENCES usuarios(id),
  -- Datos estructurados (JSONB) para flexibilidad con la lógica actual
  datos_json         JSONB         NOT NULL DEFAULT '{}'::jsonb,
  deleted_at         TIMESTAMPTZ
);
ALTER TABLE ordenes_trabajo ENABLE ROW LEVEL SECURITY;

-- ─── 30. TABLA: facturas ─────────────────────────────────
CREATE TABLE IF NOT EXISTS facturas (
  id                 UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  numero             VARCHAR(50)   NOT NULL UNIQUE,
  orden_id           UUID          NOT NULL,
  cliente_id         UUID          NOT NULL REFERENCES clientes(id),
  subtotal           DECIMAL(10,2) NOT NULL,
  impuesto           DECIMAL(10,2) NOT NULL,
  total              DECIMAL(10,2) NOT NULL,
  metodo_pago        VARCHAR(50),
  estado             VARCHAR(20)   NOT NULL DEFAULT 'emitida'
                       CHECK (estado IN ('emitida', 'pagada')),
  datos_json         JSONB         NOT NULL DEFAULT '{}'::jsonb,
  fecha              DATE          NOT NULL DEFAULT CURRENT_DATE
);
ALTER TABLE facturas ENABLE ROW LEVEL SECURITY;

-- ─── 31. TABLA: logs_auditoria ───────────────────────────
CREATE TABLE IF NOT EXISTS logs_auditoria (
  id                 UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  usuario_id         UUID          REFERENCES usuarios(id),
  usuario_nombre     VARCHAR(100),
  accion             VARCHAR(100)  NOT NULL,
  modulo             VARCHAR(100),
  detalles           TEXT,
  entidad_id         UUID,
  entidad_tipo       VARCHAR(50)
);
ALTER TABLE logs_auditoria ENABLE ROW LEVEL SECURITY;

-- ─── 31.1 TABLA: notificaciones ─────────────────────────
CREATE TABLE IF NOT EXISTS notificaciones (
  id                 UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  tipo               VARCHAR(50)   NOT NULL,
  titulo             VARCHAR(100)  NOT NULL,
  mensaje            TEXT          NOT NULL,
  leida              BOOLEAN       DEFAULT FALSE,
  para_rol           TEXT[],
  para_usuario_id    UUID          REFERENCES usuarios(id),
  referencia_id      UUID,
  referencia_tipo    VARCHAR(50)
);
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

-- ─── 32. TABLA: kardex ───────────────────────────────────
CREATE TABLE IF NOT EXISTS kardex (
  id                 UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  repuesto_id        UUID          REFERENCES repuestos(id),
  repuesto_nombre    VARCHAR(100),
  tipo               VARCHAR(50)   NOT NULL, -- 'entrada'|'salida'|'reserva'|'liberacion'|'ajuste'
  cantidad           INT           NOT NULL,
  stock_resultante   INT           NOT NULL,
  fecha              TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  usuario_id         UUID          REFERENCES usuarios(id),
  usuario_nombre     VARCHAR(100),
  orden_id           UUID,
  observaciones      TEXT
);
ALTER TABLE kardex ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- RPC: SINCRONIZACIÓN DE DATOS (Órdenes, Facturas, Stock)
-- =========================================================

-- ─── 33. RPC: listar_ordenes ─────────────────────────────
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
          'id', id, 'numero', numero, 'clienteId', cliente_id,
          'vehiculoId', vehiculo_id, 'mecanicoId', mecanico_id,
          'estado', estado, 'facturaId', factura_id,
          'fechaCreacion', fecha_creacion::TEXT,
          'fechaActualizacion', fecha_actualizacion::TEXT
        )) ORDER BY fecha_creacion DESC
      )
      FROM ordenes_trabajo
      WHERE (cliente_id IN (SELECT id FROM clientes WHERE usuario_id = p_usuario_id))
        AND deleted_at IS NULL
    ), '[]'::json);
  ELSIF p_rol = 'mecanico' AND p_usuario_id IS NOT NULL THEN
    RETURN COALESCE((
      SELECT json_agg(
        (datos_json || jsonb_build_object(
          'id', id, 'numero', numero, 'clienteId', cliente_id,
          'vehiculoId', vehiculo_id, 'mecanicoId', mecanico_id,
          'estado', estado, 'facturaId', factura_id,
          'fechaCreacion', fecha_creacion::TEXT,
          'fechaActualizacion', fecha_actualizacion::TEXT
        )) ORDER BY fecha_creacion DESC
      )
      FROM ordenes_trabajo
      WHERE mecanico_id = p_usuario_id AND deleted_at IS NULL
    ), '[]'::json);
  ELSE
    RETURN COALESCE((
      SELECT json_agg(
        (datos_json || jsonb_build_object(
          'id', id, 'numero', numero, 'clienteId', cliente_id,
          'vehiculoId', vehiculo_id, 'mecanicoId', mecanico_id,
          'estado', estado, 'facturaId', factura_id,
          'fechaCreacion', fecha_creacion::TEXT,
          'fechaActualizacion', fecha_actualizacion::TEXT
        )) ORDER BY fecha_creacion DESC
      )
      FROM ordenes_trabajo WHERE deleted_at IS NULL
    ), '[]'::json);
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION listar_ordenes(UUID, TEXT) TO anon, authenticated;

-- ─── 34. RPC: crear_orden ────────────────────────────────
CREATE OR REPLACE FUNCTION crear_orden(
  p_numero           TEXT,
  p_cliente_id       UUID,
  p_vehiculo_id       UUID,
  p_creado_por       UUID,
  p_datos            JSONB
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_nueva ordenes_trabajo%ROWTYPE;
BEGIN
  INSERT INTO ordenes_trabajo (numero, cliente_id, vehiculo_id, creado_por, datos_json)
  VALUES (p_numero, p_cliente_id, p_vehiculo_id, p_creado_por, p_datos)
  RETURNING * INTO v_nueva;

  RETURN json_build_object(
    'success', TRUE, 
    'orden', (v_nueva.datos_json || jsonb_build_object(
      'id', v_nueva.id, 
      'numero', v_nueva.numero, 
      'clienteId', v_nueva.cliente_id,
      'vehiculoId', v_nueva.vehiculo_id, 
      'mecanicoId', v_nueva.mecanico_id,
      'estado', v_nueva.estado, 
      'facturaId', v_nueva.factura_id,
      'fechaCreacion', v_nueva.fecha_creacion::TEXT,
      'fechaActualizacion', v_nueva.fecha_actualizacion::TEXT
    ))
  );
END;
$$;
GRANT EXECUTE ON FUNCTION crear_orden(TEXT, UUID, UUID, UUID, JSONB) TO anon, authenticated;

-- ─── 35. RPC: actualizar_orden ───────────────────────────
CREATE OR REPLACE FUNCTION actualizar_orden(
  p_id               UUID,
  p_estado           TEXT    DEFAULT NULL,
  p_mecanico_id      UUID    DEFAULT NULL,
  p_factura_id       TEXT    DEFAULT NULL,
  p_datos            JSONB   DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  -- Actualizar solo los campos no-JSON
  UPDATE ordenes_trabajo SET
    estado             = COALESCE(p_estado, estado),
    mecanico_id        = COALESCE(p_mecanico_id, mecanico_id),
    factura_id         = COALESCE(p_factura_id, factura_id),
    fecha_actualizacion = CURRENT_DATE
  WHERE id = p_id;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count = 0 THEN
    RETURN json_build_object('success', FALSE, 'error', 'Orden no encontrada');
  END IF;

  -- Guardar datos adicionales en JSON si se proporciona
  IF p_datos IS NOT NULL THEN
    UPDATE ordenes_trabajo SET
      datos_json = datos_json || p_datos
    WHERE id = p_id;
  END IF;

  RETURN json_build_object('success', TRUE);
END;
$$;
GRANT EXECUTE ON FUNCTION actualizar_orden(UUID, TEXT, UUID, TEXT, JSONB) TO anon, authenticated;

-- ─── 36. RPC: listar_facturas ─────────────────────────────
CREATE OR REPLACE FUNCTION listar_facturas()
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN COALESCE((
    SELECT json_agg(
      (datos_json || jsonb_build_object(
        'numero', numero, 'ordenId', orden_id, 'clienteId', cliente_id,
        'total', total, 'subtotal', subtotal, 'impuesto', impuesto,
        'estado', estado, 'metodoPago', metodo_pago, 'fecha', fecha::TEXT
      )) ORDER BY fecha DESC
    ) FROM facturas
  ), '[]'::json);
END;
$$;
GRANT EXECUTE ON FUNCTION listar_facturas() TO anon, authenticated;

-- ─── 37. RPC: crear_factura ──────────────────────────────
CREATE OR REPLACE FUNCTION crear_factura(
  p_numero           TEXT,
  p_orden_id         UUID,
  p_cliente_id       UUID,
  p_subtotal         DECIMAL,
  p_impuesto         DECIMAL,
  p_total            DECIMAL,
  p_metodo_pago      TEXT,
  p_estado           TEXT,
  p_datos            JSONB
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO facturas (numero, orden_id, cliente_id, subtotal, impuesto, total, metodo_pago, estado, datos_json)
  VALUES (p_numero, p_orden_id, p_cliente_id, p_subtotal, p_impuesto, p_total, p_metodo_pago, p_estado, p_datos);
  RETURN json_build_object('success', TRUE);
END;
$$;
GRANT EXECUTE ON FUNCTION crear_factura(TEXT, UUID, UUID, DECIMAL, DECIMAL, DECIMAL, TEXT, TEXT, JSONB) TO anon, authenticated;

-- ─── 38. RPC: actualizar_factura ─────────────────────────
CREATE OR REPLACE FUNCTION actualizar_factura(
  p_numero           TEXT,
  p_estado           TEXT,
  p_metodo_pago      TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE facturas SET
    estado      = p_estado,
    metodo_pago = COALESCE(p_metodo_pago, metodo_pago)
  WHERE numero = p_numero;
  RETURN json_build_object('success', TRUE);
END;
$$;
GRANT EXECUTE ON FUNCTION actualizar_factura(TEXT, TEXT, TEXT) TO anon, authenticated;

-- ─── 39. RPC: listar_repuestos ────────────────────────────
CREATE OR REPLACE FUNCTION listar_repuestos()
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN COALESCE((
    SELECT json_agg(json_build_object(
      'id', id, 'nombre', nombre, 'categoria', categoria,
      'cantidad', cantidad, 'cantidadReservada', cantidad_reservada,
      'costo', costo, 'margenGanancia', margen_ganancia, 'precio', precio,
      'stockMinimo', stock_minimo, 'proveedorId', proveedor_id, 'imagen', imagen
    ) ORDER BY nombre ASC)
    FROM repuestos WHERE deleted_at IS NULL
  ), '[]'::json);
END;
$$;
GRANT EXECUTE ON FUNCTION listar_repuestos() TO anon, authenticated;

-- ─── 40. RPC: insertar_log_auditoria ──────────────────────
CREATE OR REPLACE FUNCTION insertar_log_auditoria(
  p_usuario_id     UUID,
  p_usuario_nombre TEXT,
  p_accion         TEXT,
  p_modulo         TEXT,
  p_detalles       TEXT,
  p_entidad_id     UUID DEFAULT NULL,
  p_entidad_tipo   TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO logs_auditoria (usuario_id, usuario_nombre, accion, modulo, detalles, entidad_id, entidad_tipo)
  VALUES (p_usuario_id, p_usuario_nombre, p_accion, p_modulo, p_detalles, p_entidad_id, p_entidad_tipo);
  RETURN json_build_object('success', TRUE);
END;
$$;
GRANT EXECUTE ON FUNCTION insertar_log_auditoria(UUID, TEXT, TEXT, TEXT, TEXT, UUID, TEXT) TO anon, authenticated;

-- ─── 41. RPC: actualizar_repuesto ────────────────────────
CREATE OR REPLACE FUNCTION actualizar_repuesto(
  p_id               UUID,
  p_nombre           VARCHAR DEFAULT NULL,
  p_categoria        VARCHAR DEFAULT NULL,
  p_costo            DECIMAL DEFAULT NULL,
  p_margen_ganancia  DECIMAL DEFAULT NULL,
  p_precio           DECIMAL DEFAULT NULL,
  p_stock_minimo     INT     DEFAULT NULL,
  p_cantidad         INT     DEFAULT NULL,
  p_cantidad_reservada INT   DEFAULT NULL,
  p_proveedor_id     UUID    DEFAULT NULL,
  p_imagen           TEXT    DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE repuestos SET
    nombre             = COALESCE(p_nombre, nombre),
    categoria          = COALESCE(p_categoria, categoria),
    costo              = COALESCE(p_costo, costo),
    margen_ganancia    = COALESCE(p_margen_ganancia, margen_ganancia),
    precio             = COALESCE(p_precio, precio),
    stock_minimo       = COALESCE(p_stock_minimo, stock_minimo),
    cantidad           = COALESCE(p_cantidad, cantidad),
    cantidad_reservada = COALESCE(p_cantidad_reservada, cantidad_reservada),
    proveedor_id       = COALESCE(p_proveedor_id, proveedor_id),
    imagen             = COALESCE(p_imagen, imagen)
  WHERE id = p_id;

  IF NOT FOUND THEN
    RETURN json_build_object('ok', FALSE, 'error', 'Repuesto no encontrado');
  END IF;

  RETURN json_build_object('ok', TRUE);
END;
$$;
GRANT EXECUTE ON FUNCTION actualizar_repuesto(UUID, VARCHAR, VARCHAR, DECIMAL, DECIMAL, DECIMAL, INT, INT, INT, UUID, TEXT) TO anon, authenticated;

-- ─── 41a. RPC: crear_repuesto ────────────────────────────
CREATE OR REPLACE FUNCTION crear_repuesto(
  p_nombre VARCHAR,
  p_categoria VARCHAR,
  p_costo DECIMAL,
  p_margen_ganancia DECIMAL,
  p_cantidad INT DEFAULT 0,
  p_stock_minimo INT DEFAULT 1,
  p_proveedor_id UUID DEFAULT NULL,
  p_imagen TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_repuesto_id UUID;
  v_precio DECIMAL;
  v_categoria_valida BOOLEAN;
BEGIN
  -- Validar categoría
  v_categoria_valida := p_categoria IN (
    'Filtros', 'Frenos', 'Motor', 'Lubricantes', 'Suspensión',
    'Eléctrico', 'Transmisión', 'Carrocería', 'Otro'
  );
  IF NOT v_categoria_valida THEN
    RETURN json_build_object('ok', FALSE, 'error', 'Categoría inválida');
  END IF;

  -- Validar costo y margen
  IF p_costo <= 0 THEN
    RETURN json_build_object('ok', FALSE, 'error', 'Costo debe ser mayor a 0');
  END IF;
  IF p_margen_ganancia < 0 THEN
    RETURN json_build_object('ok', FALSE, 'error', 'Margen no puede ser negativo');
  END IF;

  -- Calcular precio
  v_precio := p_costo * (1 + p_margen_ganancia);

  -- Insertar repuesto
  INSERT INTO repuestos (nombre, categoria, cantidad, costo, margen_ganancia, precio, stock_minimo, proveedor_id, imagen)
  VALUES (p_nombre, p_categoria, p_cantidad, p_costo, p_margen_ganancia, v_precio, p_stock_minimo, p_proveedor_id, p_imagen)
  RETURNING id INTO v_repuesto_id;

  -- Si hay cantidad inicial, registrar entrada en kardex
  IF p_cantidad > 0 THEN
    INSERT INTO kardex (repuesto_id, repuesto_nombre, tipo, cantidad, stock_resultante, usuario_id, usuario_nombre)
    VALUES (v_repuesto_id, p_nombre, 'entrada', p_cantidad, p_cantidad, NULL, 'Sistema');
  END IF;

  -- Retornar repuesto creado
  RETURN json_build_object(
    'ok', TRUE,
    'repuesto', json_build_object(
      'id', v_repuesto_id,
      'nombre', p_nombre,
      'categoria', p_categoria,
      'cantidad', p_cantidad,
      'cantidadReservada', 0,
      'costo', p_costo,
      'margenGanancia', p_margen_ganancia,
      'precio', v_precio,
      'stockMinimo', p_stock_minimo,
      'proveedorId', p_proveedor_id,
      'imagen', p_imagen
    )
  );
END;
$$;
GRANT EXECUTE ON FUNCTION crear_repuesto(VARCHAR, VARCHAR, DECIMAL, DECIMAL, INT, INT, UUID, TEXT) TO anon, authenticated;

-- ─── 41b. RPC: listar_repuestos_por_categoria ───────────
CREATE OR REPLACE FUNCTION listar_repuestos_por_categoria(p_categoria TEXT DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF p_categoria IS NOT NULL THEN
    RETURN COALESCE((
      SELECT json_agg(
        json_build_object(
          'id', id, 'nombre', nombre, 'categoria', categoria,
          'cantidad', cantidad, 'cantidadReservada', cantidad_reservada,
          'costo', costo, 'margenGanancia', margen_ganancia,
          'precio', precio, 'stockMinimo', stock_minimo,
          'proveedorId', proveedor_id, 'imagen', imagen
        )
        ORDER BY nombre
      )
      FROM repuestos
      WHERE categoria = p_categoria AND deleted_at IS NULL
    ), '[]'::json);
  ELSE
    RETURN COALESCE((
      SELECT json_agg(
        json_build_object(
          'id', id, 'nombre', nombre, 'categoria', categoria,
          'cantidad', cantidad, 'cantidadReservada', cantidad_reservada,
          'costo', costo, 'margenGanancia', margen_ganancia,
          'precio', precio, 'stockMinimo', stock_minimo,
          'proveedorId', proveedor_id, 'imagen', imagen
        )
        ORDER BY nombre
      )
      FROM repuestos
      WHERE deleted_at IS NULL
    ), '[]'::json);
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION listar_repuestos_por_categoria(TEXT) TO anon, authenticated;

-- ─── 42. RPC: registrar_movimiento_kardex ────────────────
CREATE OR REPLACE FUNCTION registrar_movimiento_kardex(
  p_repuesto_id      UUID,
  p_repuesto_nombre  TEXT,
  p_tipo             TEXT,
  p_cantidad         INT,
  p_stock_resultante INT,
  p_usuario_id       UUID,
  p_usuario_nombre   TEXT,
  p_orden_id         UUID   DEFAULT NULL,
  p_observaciones    TEXT   DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO kardex (repuesto_id, repuesto_nombre, tipo, cantidad, stock_resultante, usuario_id, usuario_nombre, orden_id, observaciones)
  VALUES (p_repuesto_id, p_repuesto_nombre, p_tipo, p_cantidad, p_stock_resultante, p_usuario_id, p_usuario_nombre, p_orden_id, p_observaciones);
  RETURN json_build_object('success', TRUE);
END;
$$;
GRANT EXECUTE ON FUNCTION registrar_movimiento_kardex(UUID, TEXT, TEXT, INT, INT, UUID, TEXT, UUID, TEXT) TO anon, authenticated;

-- ─── 43. TRIGGER: Auditoría Automática de Órdenes ───────
CREATE OR REPLACE FUNCTION fn_audit_orden_trabajo()
RETURNS TRIGGER AS $$
DECLARE
    detalles_txt TEXT;
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        IF (OLD.estado <> NEW.estado) THEN
            detalles_txt := 'Cambio de estado: ' || OLD.estado || ' -> ' || NEW.estado;
            
            INSERT INTO logs_auditoria (usuario_id, usuario_nombre, accion, modulo, detalles, entidad_id, entidad_tipo)
            VALUES (COALESCE(NEW.creado_por, '00000000-0000-0000-0000-000000000000'::UUID), 'Sistema (Trigger)', 'CAMBIO_ESTADO_AUTO', 'Órdenes', detalles_txt, NEW.id, 'OrdenTrabajo');

            -- Notificaciones Automáticas según el Estado
            IF (NEW.estado = 'esperando_aprobacion') THEN
                INSERT INTO notificaciones (tipo, titulo, mensaje, para_rol, para_usuario_id, referencia_id, referencia_tipo)
                SELECT 'cotizacion_pendiente', 'Presupuesto Listo 📝', 'Se ha generado la cotización para tu vehículo. Revisa y aprueba para iniciar la reparación.', ARRAY['cliente'], c.usuario_id, NEW.id, 'OrdenTrabajo'
                FROM clientes c WHERE c.id = NEW.cliente_id;
            ELSIF (NEW.estado = 'liberada') THEN
                INSERT INTO notificaciones (tipo, titulo, mensaje, para_rol, para_usuario_id, referencia_id, referencia_tipo)
                SELECT 'orden_lista', '¡Vehículo Listo! 🚗✅', 'La reparación de tu vehículo ha finalizado. Puedes pasar a recogerlo.', ARRAY['cliente'], c.usuario_id, NEW.id, 'OrdenTrabajo'
                FROM clientes c WHERE c.id = NEW.cliente_id;
            ELSIF (NEW.estado = 'en_reparacion') THEN
                INSERT INTO notificaciones (tipo, titulo, mensaje, para_rol, para_usuario_id, referencia_id, referencia_tipo)
                SELECT 'pago_recibido', 'Reparación en Curso 🛠️', 'Hemos iniciado el trabajo en tu vehículo tras tu aprobación.', ARRAY['cliente'], c.usuario_id, NEW.id, 'OrdenTrabajo'
                FROM clientes c WHERE c.id = NEW.cliente_id;
            END IF;
        END IF;

        -- Verificar cambio en mecanico_id (ahora es columna en vez de datos_json)
        IF (OLD.mecanico_id IS DISTINCT FROM NEW.mecanico_id) THEN
            BEGIN
                INSERT INTO logs_auditoria (usuario_nombre, accion, modulo, detalles, entidad_id, entidad_tipo)
                VALUES ('Sistema (Trigger)', 'CAMBIO_MECANICO', 'Órdenes', 'Nuevo mecánico asignado a la orden', NEW.id, 'OrdenTrabajo');
            EXCEPTION WHEN OTHERS THEN
                NULL;
            END;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_orden_trabajo ON ordenes_trabajo;
CREATE TRIGGER trg_audit_orden_trabajo
  AFTER UPDATE OF estado ON ordenes_trabajo
  FOR EACH ROW
  EXECUTE FUNCTION fn_audit_orden_trabajo();

-- ─── 44. RPC: listar_notificaciones ──────────────────────
CREATE OR REPLACE FUNCTION listar_notificaciones()
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN COALESCE((
    SELECT json_agg(
      json_build_object(
        'id', id, 'fecha', fecha::TEXT, 'tipo', tipo, 'titulo', titulo,
        'mensaje', mensaje, 'leida', leida, 'paraRol', para_rol,
        'paraUsuarioId', para_usuario_id, 'referenciaId', referencia_id,
        'referenciaTipo', referencia_tipo
      ) ORDER BY fecha DESC
    ) FROM notificaciones
  ), '[]'::json);
END;
$$;
GRANT EXECUTE ON FUNCTION listar_notificaciones() TO anon, authenticated;

-- ─── 45. RPC: crear_notificacion ────────────────────────
CREATE OR REPLACE FUNCTION crear_notificacion(
  p_tipo             TEXT,
  p_titulo           TEXT,
  p_mensaje          TEXT,
  p_para_rol         TEXT[],
  p_para_usuario_id  UUID DEFAULT NULL,
  p_referencia_id    UUID DEFAULT NULL,
  p_referencia_tipo  TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO notificaciones (tipo, titulo, mensaje, para_rol, para_usuario_id, referencia_id, referencia_tipo)
  VALUES (p_tipo, p_titulo, p_mensaje, p_para_rol, p_para_usuario_id, p_referencia_id, p_referencia_tipo);
  RETURN json_build_object('success', TRUE);
END;
$$;
GRANT EXECUTE ON FUNCTION crear_notificacion(TEXT, TEXT, TEXT, TEXT[], UUID, UUID, TEXT) TO anon, authenticated;

-- ─── 46. RPC: marcar_notificacion_leida ─────────────────
CREATE OR REPLACE FUNCTION marcar_notificacion_leida(p_id UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE notificaciones SET leida = TRUE WHERE id = p_id;
  RETURN json_build_object('success', TRUE);
END;
$$;
GRANT EXECUTE ON FUNCTION marcar_notificacion_leida(UUID) TO anon, authenticated;

-- ─── 47. RPC: marcar_todas_leidas ───────────────────────
CREATE OR REPLACE FUNCTION marcar_todas_leidas(p_usuario_id UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE notificaciones SET leida = TRUE WHERE para_usuario_id = p_usuario_id;
  RETURN json_build_object('success', TRUE);
END;
$$;
GRANT EXECUTE ON FUNCTION marcar_todas_leidas(UUID) TO anon, authenticated;
-- ─── 32. AUTO-RESERVACIÓN DE CLIENTE AL REGISTRAR USUARIO ────────
-- Cada vez que se crea un usuario con rol 'cliente', se genera su perfil en la tabla clientes.

CREATE OR REPLACE FUNCTION fn_auto_crear_cliente()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.rol = 'cliente' THEN
    -- Insertamos el cliente. Proporcionamos '' en apellido para evitar error de NOT NULL
    INSERT INTO clientes (nombre, apellido, email, telefono, ci, direccion, usuario_id)
    VALUES (NEW.nombre, '', NEW.email, NEW.telefono, NEW.ci, NEW.direccion, NEW.id)
    ON CONFLICT (usuario_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_auto_crear_cliente ON usuarios;
CREATE TRIGGER tr_auto_crear_cliente
AFTER INSERT ON usuarios
FOR EACH ROW
EXECUTE FUNCTION fn_auto_crear_cliente();

-- =========================================================
-- HU-2.4: Notas y adjuntos de progreso en OT
-- =========================================================

-- ─── TABLA: work_order_notes ──────────────────────────────
CREATE TABLE IF NOT EXISTS work_order_notes (
  id        UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id  UUID         NOT NULL REFERENCES ordenes_trabajo(id),
  autor_id  UUID         NOT NULL REFERENCES usuarios(id),
  nota      TEXT         NOT NULL,
  fecha     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
ALTER TABLE work_order_notes ENABLE ROW LEVEL SECURITY;

-- ─── TABLA: work_order_attachments ───────────────────────
CREATE TABLE IF NOT EXISTS work_order_attachments (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id    UUID        NOT NULL REFERENCES ordenes_trabajo(id),
  url_archivo TEXT        NOT NULL,
  fecha       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE work_order_attachments ENABLE ROW LEVEL SECURITY;

-- ─── RPC: registrar_nota_ot ───────────────────────────────
CREATE OR REPLACE FUNCTION registrar_nota_ot(
  p_orden_id UUID,
  p_autor_id UUID,
  p_nota     TEXT
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_mecanico_id UUID;
  v_estado      TEXT;
BEGIN
  SELECT mecanico_id, estado INTO v_mecanico_id, v_estado
  FROM ordenes_trabajo WHERE id = p_orden_id AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN json_build_object('ok', FALSE, 'error', 'Orden no encontrada');
  END IF;

  IF v_estado NOT IN ('en_reparacion', 'en_diagnostico') THEN
    RETURN json_build_object('ok', FALSE, 'error', 'La orden no está en un estado activo');
  END IF;

  IF v_mecanico_id IS DISTINCT FROM p_autor_id THEN
    RETURN json_build_object('ok', FALSE, 'error', 'Solo el mecánico asignado puede registrar notas');
  END IF;

  INSERT INTO work_order_notes (order_id, autor_id, nota)
  VALUES (p_orden_id, p_autor_id, p_nota);

  RETURN json_build_object('ok', TRUE);
END;
$$;
GRANT EXECUTE ON FUNCTION registrar_nota_ot(UUID, UUID, TEXT) TO anon, authenticated;

-- ─── RPC: adjuntar_archivo_ot ─────────────────────────────
CREATE OR REPLACE FUNCTION adjuntar_archivo_ot(
  p_orden_id    UUID,
  p_usuario_id  UUID,
  p_url_archivo TEXT
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_mecanico_id UUID;
  v_estado      TEXT;
BEGIN
  SELECT mecanico_id, estado INTO v_mecanico_id, v_estado
  FROM ordenes_trabajo WHERE id = p_orden_id AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN json_build_object('ok', FALSE, 'error', 'Orden no encontrada');
  END IF;

  IF v_estado NOT IN ('en_reparacion', 'en_diagnostico') THEN
    RETURN json_build_object('ok', FALSE, 'error', 'La orden no está en un estado activo');
  END IF;

  IF v_mecanico_id IS DISTINCT FROM p_usuario_id THEN
    RETURN json_build_object('ok', FALSE, 'error', 'Solo el mecánico asignado puede adjuntar archivos');
  END IF;

  INSERT INTO work_order_attachments (order_id, url_archivo)
  VALUES (p_orden_id, p_url_archivo);

  RETURN json_build_object('ok', TRUE);
END;
$$;
GRANT EXECUTE ON FUNCTION adjuntar_archivo_ot(UUID, UUID, TEXT) TO anon, authenticated;

-- ─── RPC: iniciar_reparacion ──────────────────────────────
CREATE OR REPLACE FUNCTION iniciar_reparacion(
  p_orden_id    UUID,
  p_mecanico_id UUID
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_mecanico_id UUID;
  v_estado      TEXT;
BEGIN
  SELECT mecanico_id, estado INTO v_mecanico_id, v_estado
  FROM ordenes_trabajo WHERE id = p_orden_id AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN json_build_object('ok', FALSE, 'error', 'Orden no encontrada');
  END IF;

  IF v_estado != 'esperando_aprobacion' THEN
    RETURN json_build_object('ok', FALSE, 'error', 'La orden debe estar en esperando_aprobacion');
  END IF;

  IF v_mecanico_id IS DISTINCT FROM p_mecanico_id THEN
    RETURN json_build_object('ok', FALSE, 'error', 'Solo el mecánico asignado puede iniciar la reparación');
  END IF;

  UPDATE ordenes_trabajo
  SET estado = 'en_reparacion', fecha_actualizacion = CURRENT_DATE
  WHERE id = p_orden_id;

  RETURN json_build_object('ok', TRUE);
END;
$$;
GRANT EXECUTE ON FUNCTION iniciar_reparacion(UUID, UUID) TO anon, authenticated;

-- ─── RPC: finalizar_reparacion ────────────────────────────
CREATE OR REPLACE FUNCTION finalizar_reparacion(
  p_orden_id    UUID,
  p_mecanico_id UUID
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_mecanico_id UUID;
  v_estado      TEXT;
  v_deduccion   JSON;
BEGIN
  SELECT mecanico_id, estado INTO v_mecanico_id, v_estado
  FROM ordenes_trabajo WHERE id = p_orden_id AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN json_build_object('ok', FALSE, 'error', 'Orden no encontrada');
  END IF;

  IF v_estado != 'en_reparacion' THEN
    RETURN json_build_object('ok', FALSE, 'error', 'La orden debe estar en en_reparacion');
  END IF;

  IF v_mecanico_id IS DISTINCT FROM p_mecanico_id THEN
    RETURN json_build_object('ok', FALSE, 'error', 'Solo el mecánico asignado puede finalizar la reparación');
  END IF;

  -- Deducir repuestos reservados
  SELECT deducir_repuestos_orden(p_orden_id) INTO v_deduccion;
  IF (v_deduccion->>'ok')::BOOLEAN = FALSE THEN
    RETURN v_deduccion;
  END IF;

  UPDATE ordenes_trabajo
  SET estado = 'control_calidad', fecha_actualizacion = CURRENT_DATE
  WHERE id = p_orden_id;

  RETURN json_build_object('ok', TRUE);
END;
$$;
GRANT EXECUTE ON FUNCTION finalizar_reparacion(UUID, UUID) TO anon, authenticated;

-- ─── RPC: listar_notas_ot ────────────────────────────────
CREATE OR REPLACE FUNCTION listar_notas_ot(p_orden_id UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN COALESCE((
    SELECT json_agg(json_build_object(
      'id', n.id, 'ordenId', n.order_id, 'autorId', n.autor_id,
      'autorNombre', u.nombre, 'nota', n.nota, 'fecha', n.fecha
    ) ORDER BY n.fecha ASC)
    FROM work_order_notes n
    JOIN usuarios u ON u.id = n.autor_id
    WHERE n.order_id = p_orden_id
  ), '[]'::json);
END;
$$;
GRANT EXECUTE ON FUNCTION listar_notas_ot(UUID) TO anon, authenticated;

-- ─── RPC: listar_adjuntos_ot ──────────────────────────────
CREATE OR REPLACE FUNCTION listar_adjuntos_ot(p_orden_id UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN COALESCE((
    SELECT json_agg(json_build_object(
      'id', id, 'ordenId', order_id, 'urlArchivo', url_archivo, 'fecha', fecha
    ) ORDER BY fecha ASC)
    FROM work_order_attachments
    WHERE order_id = p_orden_id
  ), '[]'::json);
END;
$$;
GRANT EXECUTE ON FUNCTION listar_adjuntos_ot(UUID) TO anon, authenticated;

-- =========================================================
-- HU-4.1: Registro de pagos en órdenes de trabajo
-- =========================================================

-- ─── TABLA: payments ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id    UUID        NOT NULL REFERENCES ordenes_trabajo(id),
  metodo      VARCHAR(50) NOT NULL CHECK (metodo IN ('Efectivo', 'Tarjeta', 'QR', 'Transferencia')),
  monto       DECIMAL(10,2) NOT NULL,
  referencia  TEXT,
  fecha       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmado  BOOLEAN     NOT NULL DEFAULT FALSE
);
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- ─── RPC: registrar_pago ──────────────────────────────────
CREATE OR REPLACE FUNCTION registrar_pago(
  p_orden_id UUID,
  p_metodo   TEXT,
  p_monto    DECIMAL,
  p_referencia TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_metodos_validos TEXT[] := ARRAY['Efectivo', 'Tarjeta', 'QR', 'Transferencia'];
  v_metodos_digitales TEXT[] := ARRAY['Tarjeta', 'QR', 'Transferencia'];
  v_confirmado BOOLEAN;
BEGIN
  IF NOT (p_metodo = ANY(v_metodos_validos)) THEN
    RETURN json_build_object('ok', FALSE, 'error', 'Método de pago no válido');
  END IF;

  IF (p_metodo = ANY(v_metodos_digitales)) AND (p_referencia IS NULL OR p_referencia = '') THEN
    RETURN json_build_object('ok', FALSE, 'error', 'La referencia es obligatoria para pagos digitales');
  END IF;

  IF p_monto <= 0 THEN
    RETURN json_build_object('ok', FALSE, 'error', 'El monto debe ser mayor a 0');
  END IF;

  v_confirmado := p_metodo = ANY(v_metodos_digitales);

  INSERT INTO payments (order_id, metodo, monto, referencia, confirmado)
  VALUES (p_orden_id, p_metodo, p_monto, p_referencia, v_confirmado);

  UPDATE ordenes_trabajo SET pagadoEnLinea = v_confirmado WHERE id = p_orden_id;

  RETURN json_build_object('ok', TRUE, 'confirmado', v_confirmado);
END;
$$;
GRANT EXECUTE ON FUNCTION registrar_pago(UUID, TEXT, DECIMAL, TEXT) TO anon, authenticated;

-- ─── RPC: listar_pagos_ot ────────────────────────────────
CREATE OR REPLACE FUNCTION listar_pagos_ot(p_orden_id UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN COALESCE((
    SELECT json_agg(json_build_object(
      'id', id, 'ordenId', order_id, 'metodo', metodo,
      'monto', monto, 'referencia', referencia, 'fecha', fecha, 'confirmado', confirmado
    ) ORDER BY fecha DESC)
    FROM payments
    WHERE order_id = p_orden_id
  ), '[]'::json);
END;
$$;
GRANT EXECUTE ON FUNCTION listar_pagos_ot(UUID) TO anon, authenticated;

-- ─── RPC: confirmar_pago ──────────────────────────────────
CREATE OR REPLACE FUNCTION confirmar_pago(p_pago_id UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE payments SET confirmado = TRUE WHERE id = p_pago_id;

  IF NOT FOUND THEN
    RETURN json_build_object('ok', FALSE, 'error', 'Pago no encontrado');
  END IF;

  RETURN json_build_object('ok', TRUE);
END;
$$;
GRANT EXECUTE ON FUNCTION confirmar_pago(UUID) TO anon, authenticated;

-- =========================================================
-- HU-4.2: Generación automática de facturas
-- =========================================================

-- ─── TABLA: invoices ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id        UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id  UUID        NOT NULL REFERENCES ordenes_trabajo(id),
  payment_id UUID       REFERENCES payments(id),
  numero    VARCHAR(50) NOT NULL UNIQUE,
  subtotal  DECIMAL(10,2) NOT NULL,
  iva       DECIMAL(10,2) NOT NULL,
  total     DECIMAL(10,2) NOT NULL,
  url_pdf   TEXT,
  fecha     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- ─── Secuencia para numeración de facturas ────────────────
CREATE SEQUENCE IF NOT EXISTS invoice_seq START 1;

-- ─── RPC: generar_factura ────────────────────────────────
CREATE OR REPLACE FUNCTION generar_factura(p_pago_id UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_orden_id UUID;
  v_cotizacion JSONB;
  v_subtotal DECIMAL;
  v_iva DECIMAL;
  v_total DECIMAL;
  v_numero VARCHAR;
  v_pago_confirmado BOOLEAN;
BEGIN
  SELECT order_id, confirmado INTO v_orden_id, v_pago_confirmado
  FROM payments WHERE id = p_pago_id;

  IF NOT FOUND THEN
    RETURN json_build_object('ok', FALSE, 'error', 'Pago no encontrado');
  END IF;

  IF NOT v_pago_confirmado THEN
    RETURN json_build_object('ok', FALSE, 'error', 'El pago debe estar confirmado');
  END IF;

  SELECT (datos_json -> 'cotizacion')::JSONB INTO v_cotizacion
  FROM ordenes_trabajo WHERE id = v_orden_id;

  IF v_cotizacion IS NULL THEN
    RETURN json_build_object('ok', FALSE, 'error', 'No hay cotización en la orden');
  END IF;

  v_subtotal := (
    SELECT COALESCE(SUM((linea->>'cantidad')::INT * (linea->>'precioUnitario')::DECIMAL), 0)
    FROM jsonb_array_elements(v_cotizacion -> 'lineas') AS linea
  );

  v_iva := v_subtotal * 0.12;
  v_total := v_subtotal + v_iva;
  v_numero := 'FAC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('invoice_seq')::TEXT, 5, '0');

  INSERT INTO invoices (order_id, payment_id, numero, subtotal, iva, total)
  VALUES (v_orden_id, p_pago_id, v_numero, v_subtotal, v_iva, v_total)
  RETURNING numero INTO v_numero;

  UPDATE ordenes_trabajo SET pagadoEnLinea = TRUE WHERE id = v_orden_id;

  RETURN json_build_object('ok', TRUE, 'numero', v_numero, 'subtotal', v_subtotal, 'iva', v_iva, 'total', v_total);
END;
$$;
GRANT EXECUTE ON FUNCTION generar_factura(UUID) TO anon, authenticated;

-- ─── RPC: listar_facturas_ot ─────────────────────────────
CREATE OR REPLACE FUNCTION listar_facturas_ot(p_orden_id UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN COALESCE((
    SELECT json_agg(json_build_object(
      'id', id, 'ordenId', order_id, 'pagoId', payment_id,
      'numero', numero, 'subtotal', subtotal, 'iva', iva, 'total', total, 'fecha', fecha
    ) ORDER BY fecha DESC)
    FROM invoices
    WHERE order_id = p_orden_id
  ), '[]'::json);
END;
$$;
GRANT EXECUTE ON FUNCTION listar_facturas_ot(UUID) TO anon, authenticated;

-- ─── RPC: generar_html_factura ───────────────────────────
CREATE OR REPLACE FUNCTION generar_html_factura(p_factura_id UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_factura RECORD;
  v_orden RECORD;
  v_cotizacion JSONB;
  v_html TEXT;
BEGIN
  SELECT * INTO v_factura FROM invoices WHERE id = p_factura_id;
  IF NOT FOUND THEN
    RETURN json_build_object('ok', FALSE, 'error', 'Factura no encontrada');
  END IF;

  SELECT ot.*, c.nombre as cliente_nombre, c.ci, c.email, c.telefono, c.direccion,
    v.placa, v.marca, v.modelo, v.año,
    (ot.datos_json -> 'cotizacion')::JSONB as cotizacion
  INTO v_orden
  FROM ordenes_trabajo ot
  JOIN clientes c ON ot.cliente_id = c.id
  JOIN vehiculos v ON ot.vehiculo_id = v.id
  WHERE ot.id = v_factura.order_id;

  v_cotizacion := v_orden.cotizacion;

  v_html := '<!DOCTYPE html><html lang="es"><head>
    <meta charset="UTF-8"><title>Factura ' || v_factura.numero || '</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: Arial, sans-serif; padding: 30px; color: #1a1a2e; }
      .header { display: flex; justify-content: space-between; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 20px; }
      .logo-area h1 { color: #2563eb; font-size: 24px; font-weight: 900; }
      .factura-num { text-align: right; }
      .factura-num .num { font-size: 22px; font-weight: 900; color: #2563eb; }
      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
      .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; }
      .info-box h3 { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 8px; }
      .info-box p { font-size: 13px; color: #334155; margin-bottom: 3px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
      thead th { background: #1e3a8a; color: white; padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 600; }
      tbody tr:nth-child(even) { background: #f8fafc; }
      tbody td { padding: 10px 12px; font-size: 13px; color: #334155; border-bottom: 1px solid #e2e8f0; }
      .totals { max-width: 300px; margin-left: auto; }
      .totals .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; border-bottom: 1px dashed #e2e8f0; }
      .totals .total-row { display: flex; justify-content: space-between; padding: 12px 0; font-size: 18px; font-weight: 900; border-top: 2px solid #2563eb; }
      .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; }
    </style>
  </head><body>
    <div class="header">
      <div class="logo-area">
        <h1>TallerPro</h1>
        <p style="color:#6b7280; font-size:12px;">Sistema de Gestión Automotriz</p>
      </div>
      <div class="factura-num">
        <div class="num">' || v_factura.numero || '</div>
        <div style="font-size:12px; color:#6b7280;">Fecha: ' || TO_CHAR(v_factura.fecha, 'DD/MM/YYYY') || '</div>
      </div>
    </div>
    <div class="info-grid">
      <div class="info-box">
        <h3>Cliente</h3>
        <p style="font-size:15px; font-weight:700;">' || v_orden.cliente_nombre || '</p>
        <p>CI: ' || COALESCE(v_orden.ci, '—') || '</p>
        <p>Tel: ' || COALESCE(v_orden.telefono, '—') || '</p>
        <p>Email: ' || COALESCE(v_orden.email, '—') || '</p>
      </div>
      <div class="info-box">
        <h3>Vehículo</h3>
        <p style="font-size:15px; font-weight:700;">' || v_orden.placa || '</p>
        <p>' || v_orden.marca || ' ' || v_orden.modelo || ' ' || v_orden.año || '</p>
        <p>OT: ' || v_orden.numero || '</p>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Descripción</th>
          <th style="text-align:center">Tipo</th>
          <th style="text-align:center">Cant.</th>
          <th style="text-align:right">P. Unitario</th>
          <th style="text-align:right">Total</th>
        </tr>
      </thead>
      <tbody>';

  IF v_cotizacion IS NOT NULL THEN
    v_html := v_html || (
      SELECT STRING_AGG('<tr><td>' || (linea->>'descripcion') || '</td><td style="text-align:center; font-size:11px">' ||
        CASE WHEN (linea->>'tipo') = 'mano_de_obra' THEN 'Mano de obra' WHEN (linea->>'tipo') = 'diagnostico' THEN 'Diagnóstico' ELSE 'Repuesto' END ||
        '</td><td style="text-align:center">' || (linea->>'cantidad') || '</td><td style="text-align:right">$' || (linea->>'precioUnitario') || '</td><td style="text-align:right; font-weight:600">$' ||
        TO_CHAR(((linea->>'cantidad')::INT * (linea->>'precioUnitario')::DECIMAL), '999999.99') || '</td></tr>', '')
      FROM jsonb_array_elements(v_cotizacion -> 'lineas') AS linea
    );
  END IF;

  v_html := v_html || '</tbody></table>
    <div class="totals">
      <div class="row"><span>Subtotal</span><span>$' || TO_CHAR(v_factura.subtotal, '999999.99') || '</span></div>
      <div class="row"><span>IVA (12%)</span><span>$' || TO_CHAR(v_factura.iva, '999999.99') || '</span></div>
      <div class="total-row"><span>TOTAL</span><span>$' || TO_CHAR(v_factura.total, '999999.99') || '</span></div>
    </div>
    <div class="footer">
      <p><strong>TallerPro — Factura Electrónica</strong></p>
      <p>Gracias por su preferencia — Este documento es válido como comprobante de pago</p>
    </div>
  </body></html>';

  RETURN json_build_object('ok', TRUE, 'html', v_html);
END;
$$;
GRANT EXECUTE ON FUNCTION generar_html_factura(UUID) TO anon, authenticated;

-- ─── RPC: guardar_url_pdf_factura ───────────────────────
CREATE OR REPLACE FUNCTION guardar_url_pdf_factura(p_factura_id UUID, p_url_pdf TEXT)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE invoices SET url_pdf = p_url_pdf WHERE id = p_factura_id;

  IF NOT FOUND THEN
    RETURN json_build_object('ok', FALSE, 'error', 'Factura no encontrada');
  END IF;

  RETURN json_build_object('ok', TRUE);
END;
$$;
GRANT EXECUTE ON FUNCTION guardar_url_pdf_factura(UUID, TEXT) TO anon, authenticated;

-- ─── RPC: obtener_factura_por_orden ─────────────────────
CREATE OR REPLACE FUNCTION obtener_factura_por_orden(p_orden_id UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN COALESCE((
    SELECT json_build_object(
      'id', id, 'ordenId', order_id, 'pagoId', payment_id,
      'numero', numero, 'subtotal', subtotal, 'iva', iva, 'total', total,
      'urlPdf', url_pdf, 'fecha', fecha
    )
    FROM invoices
    WHERE order_id = p_orden_id
    ORDER BY fecha DESC
    LIMIT 1
  ), json_build_object('ok', FALSE, 'error', 'Factura no encontrada'));
END;
$$;
GRANT EXECUTE ON FUNCTION obtener_factura_por_orden(UUID) TO anon, authenticated;

-- =========================================================
-- HU-4.3: Reportes de ingresos y productividad
-- =========================================================

-- ─── RPC: reporte_ingresos ───────────────────────────────
CREATE OR REPLACE FUNCTION reporte_ingresos(p_fecha_inicio DATE, p_fecha_fin DATE)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN json_build_object(
    'periodo', json_build_object('desde', p_fecha_inicio, 'hasta', p_fecha_fin),
    'ingresos', COALESCE((
      SELECT json_agg(json_build_object(
        'id', i.id, 'numero', i.numero, 'fecha', i.fecha,
        'subtotal', i.subtotal, 'iva', i.iva, 'total', i.total
      ) ORDER BY i.fecha DESC)
      FROM invoices i
      WHERE i.fecha::DATE BETWEEN p_fecha_inicio AND p_fecha_fin
    ), '[]'::json),
    'totalIngresos', COALESCE((
      SELECT SUM(total)::DECIMAL FROM invoices
      WHERE fecha::DATE BETWEEN p_fecha_inicio AND p_fecha_fin
    ), 0),
    'cantidadFacturas', COALESCE((
      SELECT COUNT(*) FROM invoices
      WHERE fecha::DATE BETWEEN p_fecha_inicio AND p_fecha_fin
    ), 0)
  );
END;
$$;
GRANT EXECUTE ON FUNCTION reporte_ingresos(DATE, DATE) TO authenticated;

-- ─── RPC: reporte_productividad ──────────────────────────
CREATE OR REPLACE FUNCTION reporte_productividad()
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_productividad JSON;
  v_total_ordenes BIGINT;
  v_total_ingreso DECIMAL;
BEGIN
  WITH productividad_mecanicos AS (
    SELECT
      u.id as mecanicoId,
      u.nombre as mecanicoNombre,
      COUNT(DISTINCT ot.id) as ordenesFinalizadas,
      COALESCE(SUM(i.total), 0) as ingresoTotal
    FROM usuarios u
    LEFT JOIN ordenes_trabajo ot ON u.id = ot.mecanico_id AND ot.estado = 'finalizada' AND ot.deleted_at IS NULL
    LEFT JOIN invoices i ON ot.id = i.order_id
    WHERE u.rol = 'mecanico' AND u.activo = TRUE
    GROUP BY u.id, u.nombre
  )
  SELECT json_agg(json_build_object(
    'mecanicoId', mecanicoId,
    'mecanicoNombre', mecanicoNombre,
    'ordenesFinalizadas', ordenesFinalizadas,
    'ingresoTotal', ingresoTotal
  ) ORDER BY ordenesFinalizadas DESC)
  INTO v_productividad
  FROM productividad_mecanicos;

  SELECT COUNT(*) INTO v_total_ordenes
  FROM ordenes_trabajo
  WHERE estado = 'finalizada' AND deleted_at IS NULL;

  SELECT COALESCE(SUM(total), 0) INTO v_total_ingreso
  FROM invoices;

  RETURN json_build_object(
    'productividad', COALESCE(v_productividad, '[]'::json),
    'totalOrdenesFinalizadas', v_total_ordenes,
    'totalIngresoGenerado', v_total_ingreso
  );
END;
$$;
GRANT EXECUTE ON FUNCTION reporte_productividad() TO authenticated;

-- ─── RPC: reporte_valor_inventario ───────────────────────
CREATE OR REPLACE FUNCTION reporte_valor_inventario()
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN json_build_object(
    'inventario', COALESCE((
      SELECT json_agg(json_build_object(
        'id', r.id, 'nombre', r.nombre, 'categoria', r.categoria,
        'cantidad', r.cantidad, 'costo', r.costo, 'margenGanancia', r.margen_ganancia,
        'precio', r.precio, 'valor_total', (r.cantidad * r.costo)::DECIMAL, 'stockMinimo', r.stock_minimo
      ) ORDER BY (r.cantidad * r.costo) DESC)
      FROM repuestos r
      WHERE r.deleted_at IS NULL
    ), '[]'::json),
    'totalRepuestos', (
      SELECT COUNT(*) FROM repuestos WHERE deleted_at IS NULL
    ),
    'valorTotalInventario', COALESCE((
      SELECT SUM((cantidad * costo)::DECIMAL) FROM repuestos
      WHERE deleted_at IS NULL
    ), 0),
    'cantidadTotalUnidades', COALESCE((
      SELECT SUM(cantidad) FROM repuestos
      WHERE deleted_at IS NULL
    ), 0)
  );
END;
$$;
GRANT EXECUTE ON FUNCTION reporte_valor_inventario() TO authenticated;

-- =========================================================
-- HU-2.5: Control de Calidad (QC)
-- =========================================================

-- ─── TABLA: work_order_qc ────────────────────────────────
CREATE TABLE IF NOT EXISTS work_order_qc (
  id             UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id       UUID         NOT NULL REFERENCES ordenes_trabajo(id),
  inspector_id   UUID         NOT NULL REFERENCES usuarios(id),
  aprobado       BOOLEAN      NOT NULL,
  observaciones  TEXT,
  fecha          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
ALTER TABLE work_order_qc ENABLE ROW LEVEL SECURITY;

-- ─── RPC: registrar_qc ───────────────────────────────────
CREATE OR REPLACE FUNCTION registrar_qc(
  p_orden_id      UUID,
  p_inspector_id  UUID,
  p_aprobado      BOOLEAN,
  p_observaciones TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_rol           TEXT;
  v_estado        TEXT;
  v_nuevo_estado  TEXT;
BEGIN
  SELECT rol INTO v_rol FROM usuarios WHERE id = p_inspector_id;
  IF v_rol != 'jefe' THEN
    RETURN json_build_object('ok', FALSE, 'error', 'Solo el Jefe de Taller puede aprobar/rechazar QC');
  END IF;

  SELECT estado INTO v_estado FROM ordenes_trabajo WHERE id = p_orden_id AND deleted_at IS NULL;
  IF NOT FOUND THEN
    RETURN json_build_object('ok', FALSE, 'error', 'Orden no encontrada');
  END IF;

  IF v_estado != 'control_calidad' THEN
    RETURN json_build_object('ok', FALSE, 'error', 'La orden no está en control_calidad');
  END IF;

  IF NOT p_aprobado AND (p_observaciones IS NULL OR p_observaciones = '') THEN
    RETURN json_build_object('ok', FALSE, 'error', 'Las observaciones son obligatorias si se rechaza');
  END IF;

  v_nuevo_estado := CASE WHEN p_aprobado THEN 'liberada' ELSE 'en_reparacion' END;

  INSERT INTO work_order_qc (order_id, inspector_id, aprobado, observaciones)
  VALUES (p_orden_id, p_inspector_id, p_aprobado, p_observaciones);

  UPDATE ordenes_trabajo
  SET estado = v_nuevo_estado, fecha_actualizacion = CURRENT_DATE,
      datos_json = CASE WHEN p_aprobado
        THEN (datos_json || jsonb_build_object('controlCalidad', jsonb_build_object(
          'aprobado', TRUE, 'observaciones', COALESCE(p_observaciones, ''), 'responsableId', p_inspector_id::TEXT)))
        ELSE (datos_json || jsonb_build_object('controlCalidad', jsonb_build_object(
          'aprobado', FALSE, 'observaciones', COALESCE(p_observaciones, ''), 'responsableId', p_inspector_id::TEXT)))
        END
  WHERE id = p_orden_id;

  RETURN json_build_object('ok', TRUE, 'nuevoEstado', v_nuevo_estado);
END;
$$;
GRANT EXECUTE ON FUNCTION registrar_qc(UUID, UUID, BOOLEAN, TEXT) TO anon, authenticated;

-- ─── RPC: listar_qc_ot ───────────────────────────────────
CREATE OR REPLACE FUNCTION listar_qc_ot(p_orden_id UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN COALESCE((
    SELECT json_agg(json_build_object(
      'id', q.id, 'ordenId', q.order_id, 'inspectorId', q.inspector_id,
      'inspectorNombre', q.nombre, 'aprobado', q.aprobado, 'observaciones', q.observaciones,
      'fecha', q.fecha
    ))
    FROM (
      SELECT q.*, u.nombre
      FROM work_order_qc q
      JOIN usuarios u ON u.id = q.inspector_id
      WHERE q.order_id = p_orden_id
      ORDER BY q.fecha DESC LIMIT 1
    ) q
  ), '[]'::json);
END;
$$;
GRANT EXECUTE ON FUNCTION listar_qc_ot(UUID) TO anon, authenticated;

-- =========================================================
-- HU-2.6: Aprobación o Rechazo de Cotización
-- =========================================================

-- ─── ALTER TABLE: agregar estado_cotizacion a ordenes_trabajo ─
ALTER TABLE ordenes_trabajo ADD COLUMN IF NOT EXISTS estado_cotizacion VARCHAR(20) DEFAULT 'pendiente'
  CHECK (estado_cotizacion IN ('pendiente', 'aprobada', 'rechazada'));

-- ─── TABLA: cobros_diagnostico ───────────────────────────────
CREATE TABLE IF NOT EXISTS cobros_diagnostico (
  id              UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  orden_id        UUID         NOT NULL REFERENCES ordenes_trabajo(id),
  cliente_id      UUID         NOT NULL REFERENCES clientes(id),
  monto           DECIMAL(10,2) NOT NULL,
  descripcion     TEXT         NOT NULL DEFAULT 'Cobro por diagnóstico',
  estado          VARCHAR(20)  NOT NULL DEFAULT 'pendiente'
                                CHECK (estado IN ('pendiente', 'pagado')),
  fecha           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
ALTER TABLE cobros_diagnostico ENABLE ROW LEVEL SECURITY;

-- ─── RPC: aprobar_cotizacion ─────────────────────────────────
CREATE OR REPLACE FUNCTION aprobar_cotizacion(
  p_orden_id UUID,
  p_cliente_id UUID
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_estado TEXT;
  v_veh_cliente UUID;
BEGIN
  -- Obtener orden y validar existencia
  SELECT estado INTO v_estado FROM ordenes_trabajo WHERE id = p_orden_id AND deleted_at IS NULL;
  IF NOT FOUND THEN
    RETURN json_build_object('ok', FALSE, 'error', 'Orden no encontrada');
  END IF;

  -- Validar que el cliente es propietario del vehículo
  SELECT cliente_id INTO v_veh_cliente FROM ordenes_trabajo WHERE id = p_orden_id;
  IF v_veh_cliente != p_cliente_id THEN
    RETURN json_build_object('ok', FALSE, 'error', 'No tienes permiso para aprobar esta cotización');
  END IF;

  -- Validar que la cotización está en estado pendiente
  IF EXISTS (SELECT 1 FROM ordenes_trabajo WHERE id = p_orden_id AND estado_cotizacion != 'pendiente') THEN
    RETURN json_build_object('ok', FALSE, 'error', 'Esta cotización ya fue procesada');
  END IF;

  -- Actualizar cotización como aprobada
  UPDATE ordenes_trabajo
  SET estado_cotizacion = 'aprobada',
      estado = 'en_reparacion',
      fecha_actualizacion = CURRENT_DATE
  WHERE id = p_orden_id;

  RETURN json_build_object('ok', TRUE);
END;
$$;
GRANT EXECUTE ON FUNCTION aprobar_cotizacion(UUID, UUID) TO anon, authenticated;

-- ─── RPC: liberar_repuestos_orden ────────────────────────
-- Libera repuestos reservados al rechazar cotización
CREATE OR REPLACE FUNCTION liberar_repuestos_orden(p_orden_id UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_repuesto_id UUID;
  v_cantidad_reservada INT;
  v_repuesto_nombre VARCHAR(100);
BEGIN
  FOR v_repuesto_id, v_cantidad_reservada, v_repuesto_nombre IN
    SELECT DISTINCT k.repuesto_id, k.cantidad, k.repuesto_nombre
    FROM kardex k
    WHERE k.orden_id = p_orden_id AND k.tipo = 'reserva' AND k.repuesto_id IS NOT NULL
  LOOP
    UPDATE repuestos
    SET cantidad_reservada = GREATEST(cantidad_reservada - v_cantidad_reservada, 0)
    WHERE id = v_repuesto_id;

    INSERT INTO kardex (repuesto_id, repuesto_nombre, tipo, cantidad, stock_resultante, orden_id, observaciones)
    VALUES (v_repuesto_id, v_repuesto_nombre, 'liberacion', v_cantidad_reservada,
            (SELECT cantidad_reservada FROM repuestos WHERE id = v_repuesto_id), p_orden_id, 'Liberación por rechazo de cotización');
  END LOOP;

  RETURN json_build_object('ok', TRUE);
END;
$$;
GRANT EXECUTE ON FUNCTION liberar_repuestos_orden(UUID) TO anon, authenticated;

-- ─── RPC: rechazar_cotizacion ────────────────────────────────
CREATE OR REPLACE FUNCTION rechazar_cotizacion(
  p_orden_id UUID,
  p_cliente_id UUID,
  p_monto_diagnostico DECIMAL
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_veh_cliente UUID;
  v_liberacion JSON;
BEGIN
  -- Validar que el cliente es propietario del vehículo
  SELECT cliente_id INTO v_veh_cliente FROM ordenes_trabajo WHERE id = p_orden_id;
  IF NOT FOUND THEN
    RETURN json_build_object('ok', FALSE, 'error', 'Orden no encontrada');
  END IF;

  IF v_veh_cliente != p_cliente_id THEN
    RETURN json_build_object('ok', FALSE, 'error', 'No tienes permiso para rechazar esta cotización');
  END IF;

  -- Validar que la cotización está en estado pendiente
  IF EXISTS (SELECT 1 FROM ordenes_trabajo WHERE id = p_orden_id AND estado_cotizacion != 'pendiente') THEN
    RETURN json_build_object('ok', FALSE, 'error', 'Esta cotización ya fue procesada');
  END IF;

  -- Liberar repuestos reservados
  SELECT liberar_repuestos_orden(p_orden_id) INTO v_liberacion;
  IF (v_liberacion->>'ok')::BOOLEAN = FALSE THEN
    RETURN v_liberacion;
  END IF;

  -- Actualizar cotización como rechazada
  UPDATE ordenes_trabajo
  SET estado_cotizacion = 'rechazada',
      fecha_actualizacion = CURRENT_DATE
  WHERE id = p_orden_id;

  -- Generar cobro por diagnóstico
  INSERT INTO cobros_diagnostico (orden_id, cliente_id, monto, descripcion, estado)
  VALUES (p_orden_id, p_cliente_id, p_monto_diagnostico, 'Cobro por diagnóstico', 'pendiente');

  RETURN json_build_object('ok', TRUE);
END;
$$;
GRANT EXECUTE ON FUNCTION rechazar_cotizacion(UUID, UUID, DECIMAL) TO anon, authenticated;

-- =========================================================
-- HU-2.7: Seguimiento y Cierre de Orden
-- =========================================================

-- ─── ALTER TABLE: agregar fecha_cierre a ordenes_trabajo ───
ALTER TABLE ordenes_trabajo ADD COLUMN IF NOT EXISTS fecha_cierre TIMESTAMPTZ;

-- ─── RPC: listar_ordenes_por_estado ──────────────────────
CREATE OR REPLACE FUNCTION listar_ordenes_por_estado(p_estado TEXT DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF p_estado IS NOT NULL THEN
    RETURN COALESCE((
      SELECT json_agg(
        (datos_json || jsonb_build_object(
          'id', id, 'numero', numero, 'clienteId', cliente_id,
          'vehiculoId', vehiculo_id, 'mecanicoId', mecanico_id,
          'estado', estado, 'facturaId', factura_id,
          'fechaCreacion', fecha_creacion::TEXT,
          'fechaActualizacion', fecha_actualizacion::TEXT,
          'estadoCotizacion', estado_cotizacion,
          'fechaCierre', fecha_cierre::TEXT
        )) ORDER BY fecha_creacion DESC
      )
      FROM ordenes_trabajo
      WHERE estado = p_estado AND deleted_at IS NULL
    ), '[]'::json);
  ELSE
    RETURN COALESCE((
      SELECT json_agg(
        (datos_json || jsonb_build_object(
          'id', id, 'numero', numero, 'clienteId', cliente_id,
          'vehiculoId', vehiculo_id, 'mecanicoId', mecanico_id,
          'estado', estado, 'facturaId', factura_id,
          'fechaCreacion', fecha_creacion::TEXT,
          'fechaActualizacion', fecha_actualizacion::TEXT,
          'estadoCotizacion', estado_cotizacion,
          'fechaCierre', fecha_cierre::TEXT
        )) ORDER BY fecha_creacion DESC
      )
      FROM ordenes_trabajo WHERE deleted_at IS NULL
    ), '[]'::json);
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION listar_ordenes_por_estado(TEXT) TO anon, authenticated;

-- ─── RPC: cerrar_orden ───────────────────────────────────
CREATE OR REPLACE FUNCTION cerrar_orden(
  p_orden_id UUID,
  p_asesor_id UUID
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_rol TEXT;
  v_estado TEXT;
  v_estado_cotizacion TEXT;
  v_pago_confirmado BOOLEAN;
  v_diagnostico_confirmado BOOLEAN;
  v_factura_id VARCHAR(50);
BEGIN
  -- Validar que el usuario es asesor
  SELECT rol INTO v_rol FROM usuarios WHERE id = p_asesor_id;
  IF v_rol != 'asesor' THEN
    RETURN json_build_object('ok', FALSE, 'error', 'Solo el Asesor puede cerrar órdenes');
  END IF;

  -- Obtener estado de la orden
  SELECT estado, estado_cotizacion, factura_id INTO v_estado, v_estado_cotizacion, v_factura_id
  FROM ordenes_trabajo WHERE id = p_orden_id AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN json_build_object('ok', FALSE, 'error', 'Orden no encontrada');
  END IF;

  -- Validar estado: debe ser liberada o liquidacion_diagnostico
  IF v_estado NOT IN ('liberada', 'liquidacion_diagnostico') THEN
    RETURN json_build_object('ok', FALSE, 'error', 'La orden no puede cerrarse en estado ' || v_estado);
  END IF;

  -- Escenario 1: QC aprobado + pago confirmado
  IF v_estado = 'liberada' THEN
    IF v_factura_id IS NULL THEN
      RETURN json_build_object('ok', FALSE, 'error', 'No hay factura asociada a la orden');
    END IF;

    SELECT (estado = 'pagada') INTO v_pago_confirmado
    FROM facturas WHERE numero = v_factura_id;

    IF NOT v_pago_confirmado THEN
      RETURN json_build_object('ok', FALSE, 'error', 'El pago no ha sido confirmado');
    END IF;
  END IF;

  -- Escenario 2: Cotización rechazada + cobro diagnóstico confirmado
  IF v_estado = 'liquidacion_diagnostico' THEN
    SELECT (estado = 'pagado') INTO v_diagnostico_confirmado
    FROM cobros_diagnostico WHERE orden_id = p_orden_id
    ORDER BY fecha DESC LIMIT 1;

    IF NOT v_diagnostico_confirmado THEN
      RETURN json_build_object('ok', FALSE, 'error', 'El cobro por diagnóstico no ha sido confirmado');
    END IF;
  END IF;

  -- Actualizar orden como finalizada
  UPDATE ordenes_trabajo
  SET estado = 'finalizada',
      fecha_cierre = NOW(),
      fecha_actualizacion = CURRENT_DATE
  WHERE id = p_orden_id;

  RETURN json_build_object('ok', TRUE, 'mensaje', 'Orden cerrada exitosamente');
END;
$$;
GRANT EXECUTE ON FUNCTION cerrar_orden(UUID, UUID) TO anon, authenticated;

-- ─── RPC: deducir_repuestos_orden ─────────────────────────
-- Descuento definitivo de repuestos reservados al finalizar reparación
CREATE OR REPLACE FUNCTION deducir_repuestos_orden(
  p_orden_id UUID
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_repuesto_id UUID;
  v_cantidad_reservada INT;
  v_stock_resultante INT;
  v_repuesto_nombre VARCHAR(100);
BEGIN
  -- Iterar sobre todas las reservas de la orden
  FOR v_repuesto_id, v_cantidad_reservada, v_repuesto_nombre IN
    SELECT DISTINCT k.repuesto_id, k.cantidad, k.repuesto_nombre
    FROM kardex k
    WHERE k.orden_id = p_orden_id
      AND k.tipo = 'reserva'
      AND k.repuesto_id IS NOT NULL
  LOOP
    -- Actualizar stock en repuestos
    UPDATE repuestos
    SET cantidad = GREATEST(cantidad - v_cantidad_reservada, 0),
        cantidad_reservada = GREATEST(cantidad_reservada - v_cantidad_reservada, 0)
    WHERE id = v_repuesto_id;

    -- Obtener stock resultante para kardex
    SELECT GREATEST(cantidad - v_cantidad_reservada, 0) INTO v_stock_resultante
    FROM repuestos WHERE id = v_repuesto_id;

    -- Crear entrada en kardex de tipo 'salida'
    INSERT INTO kardex (repuesto_id, repuesto_nombre, tipo, cantidad, stock_resultante, orden_id, observaciones)
    VALUES (v_repuesto_id, v_repuesto_nombre, 'salida', v_cantidad_reservada, v_stock_resultante, p_orden_id, 'Descuento por finalización de reparación');
  END LOOP;

  RETURN json_build_object('ok', TRUE);
END;
$$;
GRANT EXECUTE ON FUNCTION deducir_repuestos_orden(UUID) TO anon, authenticated;

-- ─── RPC: obtener_alertas_inventario ──────────────────────
-- Alertas críticas de inventario: stock_disponible <= stock_minimo
CREATE OR REPLACE FUNCTION obtener_alertas_inventario()
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN COALESCE((
    SELECT json_agg(json_build_object(
      'id', r.id,
      'nombre', r.nombre,
      'categoria', r.categoria,
      'stock_actual', r.cantidad,
      'stock_reservado', r.cantidad_reservada,
      'stock_disponible', r.cantidad - r.cantidad_reservada,
      'stock_minimo', r.stock_minimo,
      'proveedor_id', r.proveedor_id
    ) ORDER BY (r.cantidad - r.cantidad_reservada) ASC)
    FROM repuestos r
    WHERE r.deleted_at IS NULL
      AND (r.cantidad - r.cantidad_reservada) <= r.stock_minimo
  ), '[]'::json);
END;
$$;
GRANT EXECUTE ON FUNCTION obtener_alertas_inventario() TO anon, authenticated;

-- =========================================================
-- HU-5: Configuración y Gestión de Personal
-- =========================================================

-- ─── TABLA: personal_taller ──────────────────────────────
CREATE TABLE IF NOT EXISTS personal_taller (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre         VARCHAR(100) NOT NULL,
  cargo          VARCHAR(50) NOT NULL,
  especialidad   VARCHAR(100),
  telefono       VARCHAR(20),
  email          VARCHAR(100),
  estado         VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'vacaciones')),
  usuario_id     UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ
);
ALTER TABLE personal_taller ENABLE ROW LEVEL SECURITY;

-- ─── TABLA: catalogs ────────────────────────────────────
CREATE TABLE IF NOT EXISTS catalogs (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  clave          VARCHAR(100) NOT NULL UNIQUE,
  valor          JSONB NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE catalogs ENABLE ROW LEVEL SECURITY;

-- ─── RPC: listar_personal ───────────────────────────────
CREATE OR REPLACE FUNCTION listar_personal()
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN COALESCE((
    SELECT json_agg(json_build_object(
      'id', id, 'nombre', nombre, 'cargo', cargo, 'especialidad', especialidad,
      'telefono', telefono, 'email', email, 'estado', estado, 'usuarioId', usuario_id
    ) ORDER BY nombre)
    FROM personal_taller
    WHERE deleted_at IS NULL
  ), '[]'::json);
END;
$$;
GRANT EXECUTE ON FUNCTION listar_personal() TO anon, authenticated;

-- ─── RPC: crear_personal ────────────────────────────────
CREATE OR REPLACE FUNCTION crear_personal(
  p_nombre VARCHAR, p_cargo VARCHAR, p_especialidad VARCHAR,
  p_telefono VARCHAR, p_email VARCHAR, p_estado VARCHAR, p_usuario_id UUID
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO personal_taller (nombre, cargo, especialidad, telefono, email, estado, usuario_id)
  VALUES (p_nombre, p_cargo, p_especialidad, p_telefono, p_email, p_estado, p_usuario_id)
  RETURNING id INTO v_id;

  RETURN json_build_object('ok', TRUE, 'id', v_id);
END;
$$;
GRANT EXECUTE ON FUNCTION crear_personal(VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, UUID) TO anon, authenticated;

-- ─── RPC: actualizar_personal ───────────────────────────
CREATE OR REPLACE FUNCTION actualizar_personal(
  p_id UUID, p_nombre VARCHAR, p_cargo VARCHAR, p_especialidad VARCHAR,
  p_telefono VARCHAR, p_email VARCHAR, p_estado VARCHAR, p_usuario_id UUID
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE personal_taller
  SET nombre = p_nombre, cargo = p_cargo, especialidad = p_especialidad,
      telefono = p_telefono, email = p_email, estado = p_estado, usuario_id = p_usuario_id
  WHERE id = p_id AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN json_build_object('ok', FALSE, 'error', 'Personal no encontrado');
  END IF;

  RETURN json_build_object('ok', TRUE);
END;
$$;
GRANT EXECUTE ON FUNCTION actualizar_personal(UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, UUID) TO anon, authenticated;

-- ─── RPC: eliminar_personal ─────────────────────────────
CREATE OR REPLACE FUNCTION eliminar_personal(p_id UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE personal_taller SET deleted_at = NOW() WHERE id = p_id;

  IF NOT FOUND THEN
    RETURN json_build_object('ok', FALSE, 'error', 'Personal no encontrado');
  END IF;

  RETURN json_build_object('ok', TRUE);
END;
$$;
GRANT EXECUTE ON FUNCTION eliminar_personal(UUID) TO anon, authenticated;

-- ─── RPC: guardar_catalogs ──────────────────────────────
CREATE OR REPLACE FUNCTION guardar_catalogs(
  p_clave VARCHAR, p_valor JSONB
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO catalogs (clave, valor, updated_at)
  VALUES (p_clave, p_valor, NOW())
  ON CONFLICT (clave)
  DO UPDATE SET valor = p_valor, updated_at = NOW();

  RETURN json_build_object('ok', TRUE);
END;
$$;
GRANT EXECUTE ON FUNCTION guardar_catalogs(VARCHAR, JSONB) TO anon, authenticated;

-- ─── RPC: obtener_catalogs ──────────────────────────────
CREATE OR REPLACE FUNCTION obtener_catalogs()
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_object_agg(clave, valor)
  INTO v_result
  FROM catalogs;

  RETURN COALESCE(v_result, '{}'::json);
END;
$$;
GRANT EXECUTE ON FUNCTION obtener_catalogs() TO anon, authenticated;

-- ─── RPC: asignar_mecanico_orden ────────────────────────
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
