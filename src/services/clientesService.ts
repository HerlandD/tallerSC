import { supabase } from '../lib/supabase';
import type { Cliente, Vehiculo } from '../app/context/AppContext';

export const clientesService = {
  listar: () => supabase.rpc('listar_clientes'),

  crear: (c: Omit<Cliente, 'id' | 'fechaRegistro'>) =>
    supabase.rpc('crear_cliente', {
      p_nombre: c.nombre,
      p_ci: c.ci,
      p_nit: c.nit ?? null,
      p_telefono: c.telefono,
      p_email: c.email ?? null,
      p_direccion: c.direccion ?? null,
      p_usuario_id: c.usuarioId ?? null,
    }),

  actualizar: (id: string, c: Partial<Cliente>) =>
    supabase.rpc('actualizar_cliente', {
      p_id: id,
      p_nombre: c.nombre ?? null,
      p_ci: c.ci ?? null,
      p_nit: c.nit ?? null,
      p_telefono: c.telefono ?? null,
      p_email: c.email ?? null,
      p_direccion: c.direccion ?? null,
    }),

  eliminar: (id: string) =>
    supabase.rpc('eliminar_cliente', { p_id: id }),
};

export const vehiculosService = {
  listar: () => supabase.rpc('listar_vehiculos'),

  crear: (v: Omit<Vehiculo, 'id'>) =>
    supabase.rpc('crear_vehiculo', {
      p_cliente_id: v.clienteId,
      p_placa: v.placa,
      p_marca: v.marca,
      p_modelo: v.modelo,
      p_anio: v.año,
      p_color: v.color ?? null,
      p_chasis: v.chasis ?? null,
      p_kilometraje: v.kilometraje ?? 0,
    }),

  actualizar: (id: string, v: Partial<Vehiculo>) =>
    supabase.rpc('actualizar_vehiculo', {
      p_id: id,
      p_cliente_id: v.clienteId ?? null,
      p_placa: v.placa ?? null,
      p_marca: v.marca ?? null,
      p_modelo: v.modelo ?? null,
      p_anio: v.año ?? null,
      p_color: v.color ?? null,
      p_chasis: v.chasis ?? null,
      p_kilometraje: v.kilometraje ?? null,
    }),

  eliminar: (id: string) =>
    supabase.rpc('eliminar_vehiculo', { p_id: id }),
};
