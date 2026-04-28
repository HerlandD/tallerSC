import { supabase } from '../lib/supabase';

export const reportesService = {
  reporteIngresos: (fechaInicio: string, fechaFin: string) =>
    supabase.rpc('reporte_ingresos', {
      p_fecha_inicio: fechaInicio,
      p_fecha_fin: fechaFin,
    }),

  reporteProductividad: () =>
    supabase.rpc('reporte_productividad'),

  reporteValorInventario: () =>
    supabase.rpc('reporte_valor_inventario'),
};
