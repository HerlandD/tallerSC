import { useState, useEffect } from 'react';
import { usuariosService } from '../services/usuariosService';
import type { Usuario, PersonalTaller } from '../app/context/AppContext';

export function useUsuarios(autoLoad = true) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [personal, setPersonal] = useState<PersonalTaller[]>([]);

  useEffect(() => {
    if (!autoLoad) return;
    cargarUsuarios();
    cargarPersonal();
  }, [autoLoad]);

  const cargarUsuarios = async () => {
    const { data } = await usuariosService.listar();
    if (Array.isArray(data)) setUsuarios(data as Usuario[]);
  };

  const cargarPersonal = async () => {
    const { data, error } = await usuariosService.listarPersonal();
    if (error) {
      console.warn('Error cargando personal:', error);
    } else if (data) {
      try {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPersonal(parsed as PersonalTaller[]);
        }
      } catch (e) {
        console.warn('Error parseando personal:', e);
      }
    }
  };

  const addUsuario = async (u: Omit<Usuario, 'id'>): Promise<{ ok: boolean; error?: string }> => {
    try {
      const { data, error } = await usuariosService.crear(u);
      if (error) throw error;
      if (!data?.success) return { ok: false, error: data?.error ?? 'Error al crear usuario' };

      const newUser = data.usuario as Usuario;
      setUsuarios(prev => [...prev, newUser]);

      if (u.rol !== 'cliente' && newUser.id) {
        try {
          await usuariosService.crearPersonal({
            nombre: u.nombre,
            cargo: u.rol === 'administrador' ? 'Administrador' :
                  u.rol === 'jefe_taller' ? 'Jefe de Taller' :
                  u.rol === 'mecanico' ? 'Técnico' : 'Asesor de Servicio',
            especialidad: '',
            telefono: u.telefono ?? '',
            email: u.email ?? '',
            estado: 'activo',
            usuarioId: newUser.id,
          });
        } catch (err: any) {
          console.warn('No se pudo crear personal automáticamente:', err);
        }
      }

      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message ?? 'Error de conexión' };
    }
  };

  const updateUsuario = async (id: string, u: Partial<Usuario>): Promise<{ ok: boolean; error?: string }> => {
    try {
      const prev = usuarios.find(x => x.id === id);
      if (!prev) return { ok: false, error: 'Usuario no encontrado' };
      const merged = { ...prev, ...u };
      const { data, error } = await usuariosService.actualizar(id, merged);
      if (error) throw error;
      if (!data?.success) return { ok: false, error: data?.error ?? 'Error al actualizar' };
      setUsuarios(prev => prev.map(x => x.id === id ? { ...x, ...u } : x));
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message ?? 'Error de conexión' };
    }
  };

  const deleteUsuario = (id: string) => {
    setUsuarios(p => p.filter(x => x.id !== id));
  };

  const addPersonal = async (p: Omit<PersonalTaller, 'id'>): Promise<void> => {
    try {
      const { data, error } = await usuariosService.crearPersonal(p);
      if (error) throw error;
      if (data?.ok) {
        setPersonal(prev => [...prev, { ...p, id: data.id }]);
      }
    } catch (err: any) {
      console.error('Error al crear personal:', err);
    }
  };

  const updatePersonal = async (id: string, p: Partial<PersonalTaller>): Promise<void> => {
    try {
      const prev = personal.find(x => x.id === id);
      if (!prev) return;
      const merged = { ...prev, ...p };
      const { data, error } = await usuariosService.actualizarPersonal(id, merged);
      if (error) throw error;
      if (data?.ok) {
        setPersonal(prev => prev.map(x => x.id === id ? { ...x, ...p } : x));
      }
    } catch (err: any) {
      console.error('Error al actualizar personal:', err);
    }
  };

  const deletePersonal = async (id: string): Promise<void> => {
    try {
      const { data, error } = await usuariosService.eliminarPersonal(id);
      if (error) throw error;
      if (data?.ok) {
        setPersonal(prev => prev.filter(x => x.id !== id));
      }
    } catch (err: any) {
      console.error('Error al eliminar personal:', err);
    }
  };

  return {
    usuarios,
    personal,
    cargarUsuarios,
    cargarPersonal,
    addUsuario,
    updateUsuario,
    deleteUsuario,
    addPersonal,
    updatePersonal,
    deletePersonal,
  };
}
