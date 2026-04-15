import React, { useState } from 'react';
import {
  Receipt, Download, Search, CheckCircle, Clock, DollarSign,
  FileText, Building2, User, Car, Printer, X, ChevronDown, ChevronUp
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import logoImg from 'figma:asset/96fbce486018502ff8de5f9de0fab54c7c708ec9.png';

export default function Facturas() {
  const { facturas, ordenes, clientes, vehiculos, currentUser } = useApp();
  const [search, setSearch] = useState('');
  const [facturaDetalle, setFacturaDetalle] = useState<typeof facturas[0] | null>(null);

  const isCliente = currentUser?.rol === 'cliente';

  const clienteActual = isCliente
    ? clientes.find(c => c.nombre === currentUser?.nombre || c.usuarioId === currentUser?.id)
    : null;

  const misFacturas = isCliente && clienteActual
    ? facturas.filter(f => f.clienteId === clienteActual.id)
    : facturas;

  const filtradas = misFacturas.filter(f =>
    !search ||
    f.numero.toLowerCase().includes(search.toLowerCase()) ||
    f.ordenId.toLowerCase().includes(search.toLowerCase()) ||
    f.metodoPago.toLowerCase().includes(search.toLowerCase())
  );

  const totalPagado = filtradas.reduce((s, f) => s + f.total, 0);
  const getOrden = (ordenId: string) => ordenes.find(o => o.id === ordenId);
  const getVehiculo = (ordenId: string) => {
    const o = getOrden(ordenId);
    return o ? vehiculos.find(v => v.id === o.vehiculoId) : null;
  };
  const getCliente = (clienteId: string) => clientes.find(c => c.id === clienteId);

  const handlePrint = (f: typeof facturas[0]) => {
    const orden = getOrden(f.ordenId);
    const vehiculo = getVehiculo(f.ordenId);
    const cliente = getCliente(f.clienteId);
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html lang="es"><head>
      <meta charset="UTF-8"><title>Factura ${f.numero}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 30px; color: #1a1a2e; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 20px; }
        .logo-area h1 { color: #2563eb; font-size: 24px; font-weight: 900; }
        .logo-area p { color: #6b7280; font-size: 12px; margin-top: 2px; }
        .factura-num { text-align: right; }
        .factura-num .num { font-size: 22px; font-weight: 900; color: #2563eb; }
        .factura-num .date { font-size: 12px; color: #6b7280; margin-top: 4px; }
        .badge { display: inline-block; background: #dcfce7; color: #166534; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; margin-top: 6px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
        .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; }
        .info-box h3 { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; }
        .info-box p { font-size: 13px; color: #334155; margin-bottom: 3px; }
        .info-box .name { font-size: 15px; font-weight: 700; color: #1e293b; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        thead th { background: #1e3a8a; color: white; padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 600; }
        tbody tr:nth-child(even) { background: #f8fafc; }
        tbody td { padding: 10px 12px; font-size: 13px; color: #334155; border-bottom: 1px solid #e2e8f0; }
        .totals { max-width: 300px; margin-left: auto; }
        .totals .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #64748b; border-bottom: 1px dashed #e2e8f0; }
        .totals .total-row { display: flex; justify-content: space-between; padding: 12px 0; font-size: 18px; font-weight: 900; color: #1e293b; border-top: 2px solid #2563eb; margin-top: 4px; }
        .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; }
        .paid-stamp { position: fixed; top: 60px; right: 40px; border: 4px solid #16a34a; color: #16a34a; padding: 10px 20px; border-radius: 8px; font-size: 28px; font-weight: 900; transform: rotate(-15deg); opacity: 0.35; }
        @media print { body { padding: 15px; } .paid-stamp { position: absolute; } }
      </style>
    </head><body>
      <div class="paid-stamp">PAGADA</div>
      <div class="header">
        <div class="logo-area">
          <h1>TallerPro</h1>
          <p>Sistema de Gestión Automotriz</p>
          <p style="margin-top:8px; font-size:11px; color:#94a3b8;">NIT: 1790123456001</p>
          <p style="font-size:11px; color:#94a3b8;">Av. Principal 100, Quito — Tel: (02) 234-5678</p>
        </div>
        <div class="factura-num">
          <div class="num">${f.numero}</div>
          <div class="date">Fecha: ${f.fecha}</div>
          <div class="badge">✓ PAGADA</div>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-box">
          <h3>Facturar a</h3>
          <p class="name">${cliente?.nombre || '—'}</p>
          <p>CI/NIT: ${cliente?.ci || '—'}</p>
          <p>Tel: ${cliente?.telefono || '—'}</p>
          <p>Email: ${cliente?.email || '—'}</p>
          <p style="font-size:12px; color:#64748b; margin-top:4px;">${cliente?.direccion || '—'}</p>
        </div>
        <div class="info-box">
          <h3>Vehículo del servicio</h3>
          ${vehiculo ? `
            <p class="name">${vehiculo.placa}</p>
            <p>${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.año}</p>
            <p>Color: ${vehiculo.color}</p>
            <p>OT: ${orden?.numero || f.ordenId}</p>
          ` : '<p>—</p>'}
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
        <tbody>
          ${orden?.cotizacion?.lineas.map(l => `
            <tr>
              <td>${l.descripcion}</td>
              <td style="text-align:center; font-size:11px">${l.tipo === 'mano_de_obra' ? 'Mano de obra' : l.tipo === 'diagnostico' ? 'Diagnóstico' : 'Repuesto'}</td>
              <td style="text-align:center">${l.cantidad}</td>
              <td style="text-align:right">$${l.precioUnitario.toFixed(2)}</td>
              <td style="text-align:right; font-weight:600">$${(l.cantidad * l.precioUnitario).toFixed(2)}</td>
            </tr>
          `).join('') || `<tr><td colspan="5" style="text-align:center; color:#94a3b8">Sin detalle de servicios</td></tr>`}
        </tbody>
      </table>

      <div class="totals">
        <div class="row"><span>Subtotal</span><span>$${f.subtotal.toFixed(2)}</span></div>
        <div class="row"><span>IVA (12%)</span><span>$${f.impuesto.toFixed(2)}</span></div>
        <div class="row"><span>Método de pago</span><span>${f.metodoPago}</span></div>
        <div class="total-row"><span>TOTAL</span><span>$${f.total.toFixed(2)}</span></div>
      </div>

      <div class="footer">
        <p><strong>TallerPro — Factura Electrónica Autorizada</strong></p>
        <p>Gracias por su preferencia · Este documento es válido como comprobante de pago</p>
        <p style="margin-top:4px;">Generado el ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
      </div>
    </body></html>`);
    win.document.close();
    win.print();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-1">
          <Receipt size={22} className="text-blue-600" />
          {isCliente ? 'Mis Facturas' : 'Facturación'}
        </h1>
        <p className="text-gray-500 text-sm">
          {isCliente ? 'Historial completo de tus comprobantes de pago' : 'Registro de todas las facturas emitidas'}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-3"><FileText size={20} /></div>
          <p className="text-2xl font-bold text-gray-900">{filtradas.length}</p>
          <p className="text-sm text-gray-500 mt-0.5">Facturas emitidas</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-3"><DollarSign size={20} /></div>
          <p className="text-2xl font-bold text-gray-900">${totalPagado.toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-0.5">Total pagado</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-3"><CheckCircle size={20} /></div>
          <p className="text-2xl font-bold text-gray-900">{filtradas.filter(f => f.estado === 'pagada').length}</p>
          <p className="text-sm text-gray-500 mt-0.5">Pagadas</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Buscar por número, OT o método de pago..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {/* List */}
      {filtradas.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-20 text-center">
          <Receipt size={40} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-400 font-medium">No hay facturas</p>
          <p className="text-gray-400 text-sm mt-1">
            {isCliente ? 'Tus facturas aparecerán aquí al realizar pagos' : 'Las facturas se generan automáticamente al finalizar servicios'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map(f => {
            const orden = getOrden(f.ordenId);
            const vehiculo = getVehiculo(f.ordenId);
            const cliente = getCliente(f.clienteId);
            const isExpanded = facturaDetalle?.numero === f.numero;
            return (
              <div key={f.numero} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-5 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Icon */}
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Receipt size={22} className="text-blue-600" />
                    </div>
                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-gray-900">{f.numero}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${f.estado === 'pagada' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {f.estado === 'pagada' ? '✓ Pagada' : '⏳ Emitida'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600 flex-wrap">
                        {!isCliente && cliente && <span className="flex items-center gap-1"><User size={12} />{cliente.nombre}</span>}
                        {orden && <span className="flex items-center gap-1 text-blue-600 font-medium">{orden.numero}</span>}
                        {vehiculo && <span className="flex items-center gap-1"><Car size={12} />{vehiculo.placa} · {vehiculo.marca} {vehiculo.modelo}</span>}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Clock size={11} />{f.fecha}</span>
                        <span className="flex items-center gap-1"><DollarSign size={11} />{f.metodoPago}</span>
                      </div>
                    </div>
                  </div>

                  {/* Amount + actions */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400">Subtotal: ${f.subtotal.toFixed(2)}</p>
                    <p className="text-xs text-gray-400">IVA 12%: ${f.impuesto.toFixed(2)}</p>
                    <p className="text-xl font-bold text-gray-900 mt-0.5">${f.total.toFixed(2)}</p>
                    <div className="flex gap-2 mt-2 justify-end">
                      <button onClick={() => setFacturaDetalle(isExpanded ? null : f)}
                        className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50">
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />} Ver
                      </button>
                      <button onClick={() => handlePrint(f)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700">
                        <Printer size={12} /> Imprimir
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && orden?.cotizacion && (
                  <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
                    {/* Client + Vehicle info */}
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div className="bg-white border border-gray-200 rounded-xl p-3">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1"><User size={10} /> Cliente</p>
                        <p className="font-bold text-gray-800">{cliente?.nombre}</p>
                        <p className="text-gray-500 text-xs">CI: {cliente?.ci}</p>
                        <p className="text-gray-500 text-xs">Tel: {cliente?.telefono}</p>
                        <p className="text-gray-500 text-xs">{cliente?.email}</p>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-xl p-3">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-1"><Car size={10} /> Vehículo</p>
                        <p className="font-bold text-gray-800">{vehiculo?.placa}</p>
                        <p className="text-gray-500 text-xs">{vehiculo?.marca} {vehiculo?.modelo} {vehiculo?.año}</p>
                        <p className="text-gray-500 text-xs">OT: {orden.numero}</p>
                      </div>
                    </div>

                    {/* Line items */}
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Detalle de servicios</p>
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-3">
                      {orden.cotizacion.lineas.map(l => (
                        <div key={l.id} className="flex justify-between text-sm px-4 py-2.5 border-b border-gray-100 last:border-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${l.tipo === 'repuesto' ? 'bg-blue-100 text-blue-700' : l.tipo === 'diagnostico' ? 'bg-violet-100 text-violet-700' : 'bg-orange-100 text-orange-700'}`}>
                              {l.tipo === 'mano_de_obra' ? 'M.O.' : l.tipo === 'diagnostico' ? 'Diag.' : 'Rep.'}
                            </span>
                            <span className="text-gray-700">{l.descripcion}</span>
                            <span className="text-gray-400 text-xs">× {l.cantidad}</span>
                          </div>
                          <span className="font-semibold text-gray-800">${(l.cantidad * l.precioUnitario).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="px-4 py-3 bg-gray-50 space-y-1">
                        <div className="flex justify-between text-xs text-gray-500"><span>Subtotal</span><span>${f.subtotal.toFixed(2)}</span></div>
                        <div className="flex justify-between text-xs text-gray-500"><span>IVA (12%)</span><span>${f.impuesto.toFixed(2)}</span></div>
                        <div className="flex justify-between font-bold text-gray-900 text-base pt-1 border-t border-gray-200">
                          <span>TOTAL PAGADO</span><span>${f.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400 flex items-center gap-1"><CheckCircle size={11} className="text-green-500" /> Método: {f.metodoPago}</span>
                      <button onClick={() => handlePrint(f)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700">
                        <Printer size={13} /> Imprimir / Guardar PDF
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
