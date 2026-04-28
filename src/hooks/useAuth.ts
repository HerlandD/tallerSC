import { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import type { Usuario, Rol } from '../app/context/AppContext';
import type { RpcUser } from '../lib/supabase';

const SESSION_KEY = 'tallerpro_session';

function rpcUserToUsuario(u: RpcUser): Usuario {
  return {
    id: u.id,
    nombre: u.nombre,
    username: u.username,
    password: '',
    rol: u.rol as Rol,
    activo: u.activo,
    email: u.email ?? undefined,
    telefono: u.telefono ?? undefined,
    ci: u.ci ?? undefined,
  };
}

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as Usuario;
      if (parsed?.id && parsed?.rol) setCurrentUser(parsed);
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
  }, []);

  const login = async (username: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const { data, error } = await authService.login(username, password);

      if (!error && data?.success && data?.user) {
        const user = rpcUserToUsuario(data.user as RpcUser);
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
        setCurrentUser(user);
        return { ok: true };
      }

      if (!error && data && !data.success) {
        return { ok: false, error: data.error ?? 'Credenciales incorrectas' };
      }

      console.warn('RPC login_usuario no disponible:', error?.message);
      return { ok: false, error: 'Error de conexión. Intenta nuevamente.' };
    } catch (err) {
      console.error('Error en login:', err);
      return { ok: false, error: 'Error de conexión. Intenta nuevamente.' };
    }
  };

  const registerCliente = async (datos: {
    nombre: string;
    ci: string;
    nit?: string;
    telefono: string;
    email: string;
    direccion: string;
    username: string;
    password: string;
  }): Promise<{ ok: boolean; error?: string }> => {
    try {
      const { data, error } = await authService.registerCliente(datos);

      if (error) {
        console.error('Error en RPC registrar_cliente:', error);
        return { ok: false, error: 'Error al registrar en la base de datos' };
      }

      if (!data?.success) {
        return { ok: false, error: data?.error ?? 'Error al registrar' };
      }

      const user = rpcUserToUsuario(data.user as RpcUser);
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      setCurrentUser(user);

      return { ok: true };
    } catch (err) {
      console.error('Error en registerCliente:', err);
      return { ok: false, error: 'Error inesperado al registrar cliente' };
    }
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setCurrentUser(null);
  };

  return {
    currentUser,
    login,
    logout,
    registerCliente,
  };
}
