import React from 'react';
import { Package, Truck, User, FileText, Calendar, Hash, Wrench, DollarSign } from 'lucide-react';
import { OrdenTrabajo, Cliente, Vehiculo, Factura } from '../context/AppContext';

interface Props {
  tipo: 'cotizacion' | 'factura' | 'recepcion' | 'historial';
  orden?: OrdenTrabajo;
  ordenes?: OrdenTrabajo[]; // Para el historial
  cliente?: Cliente;
  vehiculo?: Vehiculo;
  factura?: Factura;
}

export default function DocumentoPDF({ tipo, orden, ordenes, cliente, vehiculo, factura }: Props) {
  const lineas = orden?.cotizacion?.lineas || [];
  const total = lineas.reduce((s, l) => s + (l.cantidad * l.precioUnitario), 0);
  const iva = total * 0.12;
  const grandTotal = total + iva;

  // Filtrar y ordenar órdenes para el historial
  const historialOrdenes = (ordenes || [])
    .filter(o => o.vehiculoId === vehiculo?.id)
    .sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());

  return (
    <div className="bg-white p-10 max-w-[800px] mx-auto shadow-2xl border border-gray-100 font-sans text-slate-800" id="print-area">
      {/* Script para título dinámico al imprimir */}
      <title>{tipo === 'historial' ? `Historial_${vehiculo?.placa || 'Vehiculo'}` : (tipo === 'factura' ? `Factura_${factura?.numero || 'Doc'}` : `Documento_${orden?.numero || 'Doc'}`)}</title>
      
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 italic flex items-center gap-2">
            <Wrench className="text-blue-600" size={32} /> TALLERPRO
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Reporte de Servicio Automotriz</p>
          <div className="mt-4 text-sm space-y-1 text-slate-600">
            <p>Av. Principal #123 — Ciudad de México</p>
            <p>Tel: +52 55 1234 5678</p>
          </div>
        </div>
        <div className="text-right">
          <div className="bg-slate-900 text-white px-6 py-3 rounded-xl inline-block mb-4">
            <h2 className="text-xs uppercase tracking-[0.2em] font-bold opacity-70">
              {tipo === 'cotizacion' ? 'Cotización' : tipo === 'factura' ? 'Factura' : tipo === 'historial' ? 'Historial de Mantenimientos' : 'Orden De Ingreso'}
            </h2>
            <p className="text-xl font-bold font-mono">
              {tipo === 'historial' ? vehiculo?.placa : (tipo === 'factura' ? (factura?.numero || 'N/A') : orden?.numero)}
            </p>
          </div>
          <p className="text-sm text-slate-500 flex items-center justify-end gap-1.5 font-medium">
            <Calendar size={13} /> Generado: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Info Boxes */}
      <div className="grid grid-cols-2 gap-8 mb-10">
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
          <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-4 flex items-center gap-2">
            <User size={14} /> Propietario
          </h3>
          <div className="space-y-1.5">
            <p className="text-lg font-bold text-slate-900">{cliente?.nombre || 'Consumidor Final'}</p>
            <p className="text-sm text-slate-600">CI/RUC: {cliente?.ci || '—'}</p>
            <p className="text-sm text-slate-600">Tel: {cliente?.telefono || '—'}</p>
          </div>
        </div>
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
          <h3 className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-4 flex items-center gap-2">
            <Truck size={14} /> Especificaciones del Vehículo
          </h3>
          <div className="space-y-1.5">
            <p className="text-lg font-bold text-slate-900">{vehiculo?.marca} {vehiculo?.modelo}</p>
            <p className="text-sm text-slate-700 font-bold bg-white border border-slate-200 inline-block px-2 py-0.5 rounded-md">Placa: {vehiculo?.placa}</p>
            <p className="text-sm text-slate-600 ml-2 inline-block">Año: {vehiculo?.año}</p>
            <p className="text-[10px] text-slate-400 uppercase font-bold mt-2 font-mono">VIN: {vehiculo?.id?.slice(0,12).toUpperCase() || '—'}</p>
          </div>
        </div>
      </div>

      {tipo === 'historial' ? (
        <>
          <h3 className="text-xs uppercase tracking-widest font-black text-slate-900 mb-4 pb-2 border-b-2 border-slate-100 flex items-center gap-2">
            <FileText size={14} className="text-blue-500" /> Línea de Tiempo de Servicios
          </h3>
          <table className="w-full mb-10 overflow-hidden rounded-xl">
            <thead>
              <tr className="bg-slate-900 text-white text-[10px] uppercase tracking-widest font-bold">
                <th className="px-4 py-4 text-left">Fecha</th>
                <th className="px-4 py-4 text-left">Referencia</th>
                <th className="px-4 py-4 text-center">KM</th>
                <th className="px-4 py-4 text-left">Trabajo Realizado / Diagnóstico</th>
              </tr>
            </thead>
            <tbody className="text-xs border border-t-0 border-slate-100">
              {historialOrdenes.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">No hay servicios registrados para este vehículo.</td></tr>
              ) : historialOrdenes.map((o, i) => (
                <tr key={o.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="px-4 py-4 border-b border-slate-100 font-bold">{o.fechaCreacion}</td>
                  <td className="px-4 py-4 border-b border-slate-100 font-mono text-blue-600">{o.numero}</td>
                  <td className="px-4 py-4 border-b border-slate-100 text-center font-medium">{o.recepcion?.kilometraje || '—'}</td>
                  <td className="px-4 py-4 border-b border-slate-100">
                    <p className="font-bold text-slate-800 line-clamp-1">{o.descripcionProblema}</p>
                    <p className="text-[10px] text-slate-500 mt-1 max-w-[300px]">{o.diagnostico || 'Matenimiento preventivo general.'}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <>
          <h3 className="text-xs uppercase tracking-widest font-black text-slate-900 mb-4 pb-2 border-b-2 border-slate-100 flex items-center gap-2">
            <FileText size={14} className="text-blue-500" /> Detalle del Servicio
          </h3>
          
          <table className="w-full mb-10 overflow-hidden rounded-xl">
            <thead>
              <tr className="bg-slate-900 text-white text-xs uppercase tracking-widest font-bold">
                <th className="px-6 py-4 text-left">Descripción / Concepto</th>
                <th className="px-6 py-4 text-center">Cant.</th>
                <th className="px-6 py-4 text-right">Unitario</th>
                <th className="px-6 py-4 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="text-sm border border-t-0 border-slate-100">
              {lineas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic font-medium">Diagnóstico en proceso — Sin líneas de costo aún</td>
                </tr>
              ) : lineas.map((l, i) => (
                <tr key={l.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="px-6 py-4 border-b border-slate-100">
                    <p className="font-bold text-slate-800">{l.descripcion}</p>
                    <p className="text-[10px] uppercase font-bold text-slate-400">{l.tipo}</p>
                  </td>
                  <td className="px-6 py-4 text-center border-b border-slate-100 font-medium text-slate-600">{l.cantidad}</td>
                  <td className="px-6 py-4 text-right border-b border-slate-100 text-slate-600">${l.precioUnitario.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right border-b border-slate-100 font-black text-slate-900">${(l.cantidad * l.precioUnitario).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-between items-start">
            <div className="w-1/2 pr-8">
              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                <h4 className="text-[10px] font-black uppercase text-blue-800 tracking-tighter mb-2">Observaciones / TyC</h4>
                <ul className="text-[10px] text-blue-700/70 space-y-1.5 list-disc pl-3">
                  <li>{tipo === 'cotizacion' ? 'Presupuesto válido por 5 días hábiles.' : 'Garantía de 3 meses en mano de obra.'}</li>
                  <li>Repuestos originales con garantía de fábrica según marca.</li>
                </ul>
              </div>
            </div>
            
            <div className="w-1/3 space-y-3">
              <div className="flex justify-between items-center px-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Subtotal</span>
                <span className="text-sm font-bold text-slate-600">${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center px-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">I.V.A (12%)</span>
                <span className="text-sm font-bold text-slate-600">${iva.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-900 text-white p-5 rounded-2xl shadow-xl shadow-slate-100">
                <span className="text-sm font-black uppercase tracking-tight">Total</span>
                <span className="text-2xl font-black italic tabular-nums">${grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Footer / Signatures */}
      <div className="mt-20 pt-10 border-t border-slate-100 grid grid-cols-2 gap-20">
        <div className="text-center">
          <div className="border-b border-slate-300 w-full mb-2 h-12"></div>
          <p className="text-xs font-bold text-slate-400 uppercase italic">Responsable de Servicio</p>
        </div>
        <div className="text-center">
          <div className="border-b border-slate-300 w-full mb-2 h-12"></div>
          <p className="text-xs font-bold text-slate-400 uppercase italic">Recibido por Cliente</p>
        </div>
      </div>
      
      <p className="text-center text-[10px] text-slate-300 mt-12 font-mono">
        TallerPro Cloud Service — {new Date().toISOString()} — ID: {vehiculo?.id?.slice(0,8)}
      </p>

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; border: none; box-shadow: none; }
        }
      `}</style>
    </div>
  );
}
