-- =========================================================
-- TallerPro — Database Setup & Migration
-- Ejecutar en Supabase SQL Editor (orden secuencial)
-- =========================================================

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

-- ─── 4. RPC: login_usuario ────────────────────────────────
-- Verifica credenciales y devuelve el usuario con rol mapeado al formato del app.
-- SECURITY DEFINER: se ejecuta como owner, bypasea RLS.
CREATE OR REPLACE FUNCTION login_usuario(p_username TEXT, p_password TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user   usuarios%ROWTYPE;
  v_rol    TEXT;
BEGIN
  -- Buscar usuario activo con las credenciales dadas
  SELECT * INTO v_user
  FROM usuarios
  WHERE username = p_username
    AND password = p_password
    AND activo   = TRUE;

  IF NOT FOUND THEN
    -- Distinguir "no existe" de "contraseña incorrecta"
    IF EXISTS (SELECT 1 FROM usuarios WHERE username = p_username) THEN
      RETURN json_build_object('success', FALSE, 'error', 'Contraseña incorrecta');
    END IF;
    RETURN json_build_object('success', FALSE, 'error', 'Usuario no encontrado');
  END IF;

  -- Mapear roles cortos de la DB → roles del app
  v_rol := CASE v_user.rol
    WHEN 'admin' THEN 'administrador'
    WHEN 'jefe'  THEN 'jefe_taller'
    ELSE v_user.rol   -- 'asesor' | 'mecanico' | 'cliente' no cambian
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
-- Valida unicidad, inserta y devuelve el nuevo usuario.
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
  -- Validar username único
  IF EXISTS (SELECT 1 FROM usuarios WHERE username = p_username) THEN
    RETURN json_build_object('success', FALSE, 'error', 'El nombre de usuario ya está en uso');
  END IF;

  -- Validar CI única
  IF p_ci IS NOT NULL AND EXISTS (SELECT 1 FROM usuarios WHERE ci = p_ci) THEN
    RETURN json_build_object('success', FALSE, 'error', 'Ya existe un usuario con esa cédula/CI');
  END IF;

  -- Insertar
  INSERT INTO usuarios (username, password, nombre, rol, ci, nit, telefono, email, direccion, activo)
  VALUES (p_username, p_password, p_nombre, 'cliente', p_ci, p_nit, p_telefono, p_email, p_direccion, TRUE)
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
    RETURN json_build_object('success', FALSE, 'error', 'El usuario o cédula ya existe');
  WHEN OTHERS THEN
    RETURN json_build_object('success', FALSE, 'error', 'Error interno al registrar');
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
