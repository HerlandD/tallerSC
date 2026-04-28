import { supabase } from '../lib/supabase';
import type { Usuario } from '../app/context/AppContext';

type PersonalInput = {
  nombre: string;
  cargo: string;
  especialidad: string;
  telefono: string;
  email: string;
  estado: 'activo' | 'inactivo' | 'vacaciones';
  usuarioId?: string;
};

export const usuariosService = {
  listar: () => supabase.rpc('listar_usuarios'),

  crear: (u: Omit<Usuario, 'id' | 'password'> & { password: string }) =>
    supabase.rpc('crear_usuario', {
      p_nombre: u.nombre,
      p_username: u.username,
      p_password: u.password,
      p_rol: u.rol,
      p_email: u.email ?? null,
      p_telefono: u.telefono ?? null,
      p_ci: u.ci ?? null,
      p_activo: u.activo,
      p_direccion: u.direccion ?? null,
    }),

  actualizar: (id: string, u: Partial<Usuario> & { password?: string }) =>
    supabase.rpc('actualizar_usuario', {
      p_id: id,
      p_nombre: u.nombre ?? null,
      p_username: u.username ?? null,
      p_password: u.password ?? null,
      p_rol: u.rol ?? null,
      p_email: u.email ?? null,
      p_telefono: u.telefono ?? null,
      p_ci: u.ci ?? null,
      p_activo: u.activo ?? null,
      p_direccion: u.direccion ?? null,
    }),

  crearPersonal: (p: PersonalInput) =>
    supabase.rpc('crear_personal', {
      p_nombre: p.nombre,
      p_cargo: p.cargo,
      p_especialidad: p.especialidad,
      p_telefono: p.telefono,
      p_email: p.email,
      p_estado: p.estado,
      p_usuario_id: p.usuarioId || null,
    }),

  actualizarPersonal: (id: string, p: Partial<PersonalInput>) =>
    supabase.rpc('actualizar_personal', {
      p_id: id,
      p_nombre: p.nombre ?? null,
      p_cargo: p.cargo ?? null,
      p_especialidad: p.especialidad ?? null,
      p_telefono: p.telefono ?? null,
      p_email: p.email ?? null,
      p_estado: p.estado ?? null,
      p_usuario_id: p.usuarioId ?? null,
    }),

  eliminarPersonal: (id: string) =>
    supabase.rpc('eliminar_personal', { p_id: id }),

  listarPersonal: () => supabase.rpc('listar_personal'),
};
