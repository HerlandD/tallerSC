import { supabase, RpcUser } from '../lib/supabase';

export const authService = {
  login: async (username: string, password: string) => {
    return supabase.rpc('login_usuario', {
      p_username: username,
      p_password: password,
    });
  },

  registerCliente: async (datos: {
    nombre: string;
    ci: string;
    nit?: string;
    telefono: string;
    email: string;
    direccion: string;
    username: string;
    password: string;
  }) => {
    return supabase.rpc('registrar_cliente', {
      p_username: datos.username,
      p_password: datos.password,
      p_nombre: datos.nombre,
      p_ci: datos.ci,
      p_nit: datos.nit ?? null,
      p_telefono: datos.telefono,
      p_email: datos.email,
      p_direccion: datos.direccion,
    });
  },
};
