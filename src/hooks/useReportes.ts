import { reportesService } from '../services/reportesService';

export function useReportes(adminOnly = false) {
  const generarReporteIngresos = async (fechaInicio: string, fechaFin: string): Promise<{ periodo?: { desde: string; hasta: string }; ingresos?: any[]; totalIngresos?: number; cantidadFacturas?: number; error?: string }> => {
    if (adminOnly) return { error: 'Acceso denegado. Solo administrador puede generar reportes' };
    const { data, error } = await reportesService.reporteIngresos(fechaInicio, fechaFin);
    if (error) return { error: error.message };
    return data || { error: 'Error al generar reporte' };
  };

  const generarReporteProductividad = async (): Promise<{ productividad?: any[]; totalOrdenesFinalizadas?: number; totalIngresoGenerado?: number; error?: string }> => {
    if (adminOnly) return { error: 'Acceso denegado. Solo administrador puede generar reportes' };
    const { data, error } = await reportesService.reporteProductividad();
    if (error) return { error: error.message };
    return data || { error: 'Error al generar reporte' };
  };

  const generarReporteValorInventario = async (): Promise<{ inventario?: any[]; totalRepuestos?: number; valorTotalInventario?: number; cantidadTotalUnidades?: number; error?: string }> => {
    if (adminOnly) return { error: 'Acceso denegado. Solo administrador puede generar reportes' };
    const { data, error } = await reportesService.reporteValorInventario();
    if (error) return { error: error.message };
    return data || { error: 'Error al generar reporte' };
  };

  return {
    generarReporteIngresos,
    generarReporteProductividad,
    generarReporteValorInventario,
  };
}
