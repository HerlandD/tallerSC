import React, { useState, useRef, useEffect } from 'react';
import {
  Plus, Search, Pencil, Trash2, Package, AlertTriangle, X,
  ArrowDown, Truck, Mail, Phone, Tag, Bell, ImagePlus
} from 'lucide-react';
import { useApp, Repuesto, Proveedor } from '../context/AppContext';
import { toast } from 'sonner';

type RepuestoForm = Omit<Repuesto, 'id'>;
const emptyRepuesto: RepuestoForm = {
  nombre: '', categoria: '', cantidad: 0, cantidadReservada: 0,
  costo: 0, margenGanancia: 0.40, precio: 0, stockMinimo: 5, proveedorId: '', imagen: ''
};

type ProveedorForm = Omit<Proveedor, 'id'>;
const emptyProveedor: ProveedorForm = {
  nombre: '', contacto: '', telefono: '', email: '', productos: '', activo: true
};

const categorias = ['Filtros', 'Frenos', 'Motor', 'Lubricantes', 'Suspensión', 'Eléctrico', 'Transmisión', 'Carrocería', 'Otro'];
type Tab = 'repuestos' | 'proveedores' | 'alertas';

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Inventory() {
  const [activeTab, setActiveTab] = useState<Tab>('repuestos');
  const [alertas, setAlertas] = useState<Repuesto[]>([]);
  const {
    repuestos, proveedores,
    addRepuesto, updateRepuesto, deleteRepuesto,
    registrarSalidaRepuesto, addStockRepuesto,
    addProveedor, updateProveedor, deleteProveedor,
    currentUser, kardex, addNotificacion, obtenerAlertasInventario
  } = useApp();

  const isAdmin = currentUser?.rol === 'administrador';
  const isMecanico = currentUser?.rol === 'mecanico';

  const valorTotal = repuestos.reduce((s, r) => s + r.cantidad * r.precio, 0);
  const stockBajo = repuestos.filter(r => r.cantidad <= r.stockMinimo);

  useEffect(() => {
    const cargarAlertas = async () => {
      const data = await obtenerAlertasInventario();
      setAlertas(data);
    };
    cargarAlertas();
  }, [obtenerAlertasInventario]);

  if (isMecanico) {
    return <MecanicoInventarioView repuestos={repuestos} addNotificacion={addNotificacion} currentUser={currentUser} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">

        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Package size={22} className="text-cyan-600" /> Inventario de Repuestos
            </h1>
            <p className="text-slate-500 text-sm">{repuestos.length} repuestos · Valor total: ${valorTotal.toFixed(2)}</p>
          </div>
        </div>

        {/* Stock bajo alerta */}
        {isAdmin && stockBajo.length > 0 && (
          <div className="mb-5 bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-800">{stockBajo.length} ítem{stockBajo.length > 1 ? 's' : ''} con stock bajo o agotado</p>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {stockBajo.map(r => (
                  <span key={r.id} className="text-xs bg-amber-100 border border-amber-200 text-amber-700 px-2 py-1 rounded-lg font-medium">
                    {r.nombre}: {r.cantidad} (mín. {r.stockMinimo})
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Total repuestos', value: repuestos.length, color: 'text-cyan-700 bg-cyan-50 border-cyan-200' },
            { label: 'Valor inventario', value: `$${valorTotal.toFixed(0)}`, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
            { label: 'Stock bajo', value: stockBajo.length, color: stockBajo.length > 0 ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-slate-500 bg-slate-100 border-slate-200' },
            { label: 'Categorías', value: [...new Set(repuestos.map(r => r.categoria))].length, color: 'text-slate-700 bg-slate-100 border-slate-200' },
          ].map(k => (
            <div key={k.label} className={`rounded-xl border p-4 ${k.color}`}>
              <p className="text-2xl font-bold">{k.value}</p>
              <p className="text-xs mt-0.5 opacity-70">{k.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-200 rounded-xl p-1 mb-5 w-fit">
          <button onClick={() => setActiveTab('repuestos')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'repuestos' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
            <Package size={15} /> Repuestos ({repuestos.length})
          </button>
          {isAdmin && (
            <button onClick={() => setActiveTab('alertas')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'alertas' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
              <AlertTriangle size={15} /> Alertas ({alertas.length})
            </button>
          )}
          {isAdmin && (
            <button onClick={() => setActiveTab('proveedores')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'proveedores' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
              <Truck size={15} /> Proveedores ({proveedores.length})
            </button>
          )}
        </div>

        {activeTab === 'repuestos' && (
          <RepuestosPanel
            repuestos={repuestos} proveedores={proveedores} stockBajo={stockBajo}
            canEdit={isAdmin} addRepuesto={addRepuesto} updateRepuesto={updateRepuesto}
            deleteRepuesto={deleteRepuesto} registrarSalidaRepuesto={registrarSalidaRepuesto}
            addStockRepuesto={addStockRepuesto} showProveedorInfo={isAdmin}
          />
        )}
        {activeTab === 'alertas' && isAdmin && (
          <AlertasPanel alertas={alertas} repuestos={repuestos} setActiveTab={setActiveTab} />
        )}
        {activeTab === 'proveedores' && isAdmin && (
          <ProveedoresPanel
            proveedores={proveedores} canEdit={isAdmin}
            addProveedor={addProveedor} updateProveedor={updateProveedor} deleteProveedor={deleteProveedor}
          />
        )}
      </div>
    </div>
  );
}

// ─── Mechanic View: Read-only catalog ─────────────────────────────────────────
function MecanicoInventarioView({ repuestos, addNotificacion, currentUser }: {
  repuestos: ReturnType<typeof useApp>['repuestos'];
  addNotificacion: ReturnType<typeof useApp>['addNotificacion'];
  currentUser: ReturnType<typeof useApp>['currentUser'];
}) {
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');

  const disponibles = repuestos.filter(r => {
    const s = search.toLowerCase();
    return (!s || r.nombre.toLowerCase().includes(s) || r.categoria.toLowerCase().includes(s))
      && (!filterCat || r.categoria === filterCat);
  });

  const cats = [...new Set(repuestos.map(r => r.categoria))].sort();

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mb-1">
            <Package size={22} className="text-cyan-600" /> Catálogo de Repuestos
          </h1>
          <p className="text-slate-500 text-sm">Consulta disponibilidad de repuestos para diagnóstico y reparación</p>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Buscar repuesto..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white" />
          </div>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
            className="px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white">
            <option value="">Todas las categorías</option>
            {cats.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {disponibles.map(r => {
            const disp = r.cantidad - r.cantidadReservada;
            const sinStock = disp <= 0;
            const bajo = disp <= r.stockMinimo && disp > 0;
            return (
              <div key={r.id} className={`bg-white border rounded-xl overflow-hidden ${sinStock ? 'border-red-200' : bajo ? 'border-amber-200' : 'border-slate-200'}`}>
                {r.imagen ? (
                  <div className="h-36 overflow-hidden bg-slate-100">
                    <img src={r.imagen} alt={r.nombre} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="h-28 bg-slate-100 flex items-center justify-center">
                    <Package size={32} className="text-slate-300" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 mr-2">
                      <p className="font-semibold text-slate-800 text-sm leading-tight">{r.nombre}</p>
                      <span className="inline-block text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full mt-1">{r.categoria}</span>
                    </div>
                    {sinStock ? (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-lg font-medium flex-shrink-0">AGOTADO</span>
                    ) : bajo ? (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-lg font-medium flex-shrink-0">POCO STOCK</span>
                    ) : (
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg font-medium flex-shrink-0">DISPONIBLE</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <p className="text-xs text-slate-400">Disponible</p>
                      <p className={`font-bold text-lg ${sinStock ? 'text-red-600' : bajo ? 'text-amber-600' : 'text-emerald-600'}`}>{disp}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Precio</p>
                      <p className="font-bold text-slate-800">${r.precio.toFixed(2)}</p>
                    </div>
                  </div>

                  {sinStock && (
                    <button
                      onClick={() => {
                        addNotificacion({
                          tipo: 'repuesto_agotado',
                          titulo: 'Solicitud de reposición de stock',
                          mensaje: `El mecánico ${currentUser?.nombre} solicita reposición de "${r.nombre}" — Stock actual: ${r.cantidad} uds. (Agotado)`,
                          paraRol: ['administrador'],
                          referenciaId: r.id,
                        });
                        toast.success(`✅ Solicitud de "${r.nombre}" enviada al Administrador`);
                      }}
                      className="w-full mt-3 py-2 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center justify-center gap-1.5">
                      <Bell size={12} /> Notificar al Admin — Solicitar stock
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {disponibles.length === 0 && (
            <div className="col-span-3 text-center py-12 text-slate-400">
              <Package size={32} className="mx-auto mb-2 opacity-20" />
              <p>No se encontraron repuestos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── RepuestosPanel (Admin/Asesor) ────────────────────────────────────────────
function RepuestosPanel({
  repuestos, proveedores, stockBajo, canEdit, showProveedorInfo,
  addRepuesto, updateRepuesto, deleteRepuesto, registrarSalidaRepuesto, addStockRepuesto
}: {
  repuestos: Repuesto[]; proveedores: Proveedor[]; stockBajo: Repuesto[];
  canEdit: boolean; showProveedorInfo: boolean;
  addRepuesto: (r: Omit<Repuesto, 'id'>) => Promise<{ ok: boolean; error?: string }>;
  updateRepuesto: (id: string, r: Partial<Repuesto>) => Promise<{ ok: boolean; error?: string }>;
  deleteRepuesto: (id: string) => void;
  registrarSalidaRepuesto: (id: string, cant: number, ordenId?: string) => boolean;
  addStockRepuesto: (id: string, cant: number, costo?: number, proveedorId?: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [entradaModal, setEntradaModal] = useState<Repuesto | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<RepuestoForm>({ ...emptyRepuesto });
  const [entradaCant, setEntradaCant] = useState(1);
  const [entradaCosto, setEntradaCosto] = useState(0);
  const [entradaProveedor, setEntradaProveedor] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);

  const filtered = repuestos.filter(r => {
    const s = search.toLowerCase();
    return (!s || r.nombre.toLowerCase().includes(s) || r.categoria.toLowerCase().includes(s))
      && (!filterCat || r.categoria === filterCat);
  });

  const openCreate = () => { setEditId(null); setForm({ ...emptyRepuesto }); setModalOpen(true); };
  const openEdit = (r: Repuesto) => { setEditId(r.id); setForm({ ...r }); setModalOpen(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      const result = await updateRepuesto(editId, form);
      if (result.ok) { toast.success('Repuesto actualizado'); }
      else { toast.error(result.error || 'Error al actualizar repuesto'); return; }
    } else {
      const result = await addRepuesto({ ...form, cantidadReservada: 0 });
      if (result.ok) { toast.success('Repuesto agregado'); }
      else { toast.error(result.error || 'Error al agregar repuesto'); return; }
    }
    setModalOpen(false);
  };

  const handleEntrada = () => {
    if (!entradaModal) return;
    addStockRepuesto(entradaModal.id, entradaCant, entradaCosto || undefined, entradaProveedor || undefined);
    toast.success(`+${entradaCant} unidades agregadas a ${entradaModal.nombre}`);
    setEntradaModal(null); setEntradaCant(1); setEntradaCosto(0); setEntradaProveedor('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('La imagen no debe superar 2 MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setForm(prev => ({ ...prev, imagen: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const inCls = 'w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white';

  return (
    <>
      <div className="flex gap-3 mb-4 flex-wrap items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Buscar repuesto o categoría..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white" />
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white">
          <option value="">Todas las categorías</option>
          {categorias.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {canEdit && (
          <button onClick={openCreate}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <Plus size={15} /> Nuevo Repuesto
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200">
              {(canEdit
                ? ['', 'Repuesto', 'Categoría', 'Stock Disponible', 'P.Costo', 'P.Venta', 'Acciones']
                : ['', 'Repuesto', 'Categoría', 'Stock Disponible', 'P.Venta']
              ).map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="py-12 text-center text-slate-400 text-sm">No se encontraron repuestos</td></tr>
            ) : filtered.map(r => {
              const disp = r.cantidad - r.cantidadReservada;
              const bajo = r.cantidad <= r.stockMinimo;
              const agotado = r.cantidad === 0;
              return (
                <tr key={r.id} className={`hover:bg-slate-50 transition-colors ${agotado ? 'bg-red-50/30' : bajo ? 'bg-amber-50/20' : ''}`}>
                  <td className="px-4 py-3 w-12">
                    {r.imagen ? (
                      <img src={r.imagen} alt={r.nombre} className="w-10 h-10 rounded-lg object-cover border border-slate-200" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Package size={16} className="text-slate-300" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-semibold text-slate-800">{r.nombre}</p>
                    {agotado && <span className="text-xs text-red-600 font-medium">SIN STOCK</span>}
                    {!agotado && bajo && <span className="text-xs text-amber-600 font-medium">Stock bajo</span>}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{r.categoria}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${agotado ? 'text-red-600' : bajo ? 'text-amber-600' : 'text-emerald-600'}`}>{disp}</span>
                      <span className="text-xs text-slate-400">/ {r.cantidad} total</span>
                      {r.cantidadReservada > 0 && <span className="text-xs text-cyan-500">{r.cantidadReservada} reserv.</span>}
                    </div>
                    <p className="text-xs text-slate-400">Mín: {r.stockMinimo}</p>
                  </td>
                  {canEdit && <td className="px-4 py-3.5 text-sm text-slate-600">${r.costo.toFixed(2)}</td>}
                  <td className="px-4 py-3.5 text-sm font-semibold text-slate-800">${r.precio.toFixed(2)}</td>
                  {canEdit && (
                    <td className="px-4 py-3.5">
                      <div className="flex gap-1.5">
                        <button onClick={() => setEntradaModal(r)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Entrada de stock">
                          <ArrowDown size={14} />
                        </button>
                        <button onClick={() => openEdit(r)}
                          className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteId(r.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
              <h3 className="font-semibold text-slate-800">{editId ? 'Editar Repuesto' : 'Nuevo Repuesto'}</h3>
              <button onClick={() => setModalOpen(false)} className="p-1.5 hover:bg-slate-200 rounded-lg"><X size={16} /></button>
            </div>
            <form onSubmit={handleSave} className="px-6 py-5 space-y-4">

              {/* Image upload — admin only */}
              {canEdit && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-2 flex items-center gap-1.5">
                    <ImagePlus size={13} className="text-cyan-600" /> Imagen del repuesto
                    <span className="text-slate-400 font-normal">(opcional, máx. 2 MB)</span>
                  </label>
                  <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  {form.imagen ? (
                    <div className="relative group cursor-pointer rounded-xl overflow-hidden border border-slate-200 h-40">
                      <img src={form.imagen} alt="preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                        <button type="button" onClick={() => imgInputRef.current?.click()}
                          className="bg-white text-slate-800 text-xs px-3 py-1.5 rounded-lg font-medium">Cambiar</button>
                        <button type="button" onClick={() => setForm(p => ({ ...p, imagen: '' }))}
                          className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium">Quitar</button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => imgInputRef.current?.click()}
                      className="w-full h-28 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-cyan-400 hover:text-cyan-600 transition-colors bg-slate-50">
                      <ImagePlus size={22} />
                      <span className="text-xs">Clic para subir imagen</span>
                    </button>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Nombre *</label>
                  <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className={inCls} required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Categoría</label>
                  <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} className={inCls}>
                    <option value="">Seleccionar...</option>
                    {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Stock mínimo</label>
                  <input type="number" value={form.stockMinimo} onChange={e => setForm({ ...form, stockMinimo: Number(e.target.value) })} className={inCls} min={0} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Costo ($)</label>
                  <input type="number" value={form.costo} onChange={e => {
                    const costo = Number(e.target.value);
                    const precio = Number((costo * (1 + form.margenGanancia)).toFixed(2));
                    setForm({ ...form, costo, precio });
                  }} className={inCls} min={0} step={0.01} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Margen (%)</label>
                  <input type="number" value={Math.round(form.margenGanancia * 100)} onChange={e => {
                    const mg = Number(e.target.value) / 100;
                    const precio = Number((form.costo * (1 + mg)).toFixed(2));
                    setForm({ ...form, margenGanancia: mg, precio });
                  }} className={inCls} min={0} step={1} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Precio de venta ($)</label>
                  <input type="number" value={form.precio} onChange={e => setForm({ ...form, precio: Number(e.target.value) })} className={`${inCls} bg-cyan-50 font-semibold`} min={0} step={0.01} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Cantidad inicial</label>
                  <input type="number" value={form.cantidad} onChange={e => setForm({ ...form, cantidad: Number(e.target.value) })} className={inCls} min={0} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Proveedor</label>
                  <select 
                    value={form.proveedorId || ''} 
                    onChange={e => setForm({ ...form, proveedorId: e.target.value })} 
                    className={inCls}
                  >
                    <option value="">Sin proveedor</option>
                    {proveedores.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm hover:bg-slate-50">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Entrada stock modal */}
      {entradaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">Entrada de Stock</h3>
              <button onClick={() => setEntradaModal(null)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={15} /></button>
            </div>
            <div className="bg-slate-100 rounded-xl p-3 mb-4 flex items-center gap-3">
              {entradaModal.imagen ? (
                <img src={entradaModal.imagen} alt={entradaModal.nombre} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0">
                  <Package size={18} className="text-slate-400" />
                </div>
              )}
              <div>
                <p className="font-semibold text-slate-800">{entradaModal.nombre}</p>
                <p className="text-xs text-slate-500">Stock actual: {entradaModal.cantidad} unidades</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Cantidad a ingresar *</label>
                <input type="number" value={entradaCant} onChange={e => setEntradaCant(Number(e.target.value))} min={1} className={inCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Costo unitario ($)</label>
                <input type="number" value={entradaCosto} onChange={e => setEntradaCosto(Number(e.target.value))} min={0} step={0.01} className={inCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Proveedor</label>
                <select 
                  value={entradaProveedor} 
                  onChange={e => setEntradaProveedor(e.target.value)} 
                  className={inCls}
                >
                  <option value="">Sin proveedor</option>
                  {proveedores.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEntradaModal(null)} className="flex-1 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50">Cancelar</button>
              <button onClick={handleEntrada} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 font-medium">Registrar entrada</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-slate-800 mb-2">Eliminar repuesto</h3>
            <p className="text-slate-600 text-sm mb-5">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50">Cancelar</button>
              <button onClick={() => { deleteRepuesto(deleteId); setDeleteId(null); toast.success('Repuesto eliminado'); }} className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── ProveedoresPanel (Admin only) ────────────────────────────────────────────
function ProveedoresPanel({ proveedores, canEdit, addProveedor, updateProveedor, deleteProveedor }: {
  proveedores: Proveedor[]; canEdit: boolean;
  addProveedor: (p: Omit<Proveedor, 'id'>) => Promise<{ ok: boolean; error?: string }>;
  updateProveedor: (id: string, p: Partial<Proveedor>) => Promise<{ ok: boolean; error?: string }>;
  deleteProveedor: (id: string) => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ProveedorForm>({ ...emptyProveedor });

  const openCreate = () => { setEditId(null); setForm({ ...emptyProveedor }); setModalOpen(true); };
  const openEdit = (p: Proveedor) => { setEditId(p.id); setForm({ ...p }); setModalOpen(true); };
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      const result = await updateProveedor(editId, form);
      if (result.ok) { toast.success('Proveedor actualizado'); }
      else { toast.error(result.error || 'Error al actualizar proveedor'); return; }
    } else {
      const result = await addProveedor(form);
      if (result.ok) { toast.success('Proveedor registrado'); }
      else { toast.error(result.error || 'Error al registrar proveedor'); return; }
    }
    setModalOpen(false);
  };

  const inCls = 'w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white';

  const handleToggleActivo = async (id: string, currentState: boolean) => {
    const result = await updateProveedor(id, { activo: !currentState });
    if (!result.ok) {
      toast.error(result.error || 'Error al cambiar estado del proveedor');
    }
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        {canEdit && (
          <button onClick={openCreate} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium">
            <Plus size={15} /> Nuevo Proveedor
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {proveedores.map(p => (
          <div key={p.id} className={`bg-white border rounded-xl p-5 ${!p.activo ? 'opacity-60 border-slate-200' : 'border-slate-200'}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-bold text-slate-800">{p.nombre}</p>
                <p className="text-xs text-slate-500">{p.contacto}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {p.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-2"><Phone size={11} className="text-slate-400" /> {p.telefono}</div>
              <div className="flex items-center gap-2"><Mail size={11} className="text-slate-400" /> {p.email}</div>
              <div className="flex items-start gap-2"><Tag size={11} className="text-slate-400 mt-0.5 flex-shrink-0" /> {p.productos}</div>
            </div>
            {canEdit && (
              <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                <button onClick={() => openEdit(p)} className="flex items-center gap-1 text-xs text-cyan-600 hover:bg-cyan-50 px-2 py-1 rounded-lg">
                  <Pencil size={11} /> Editar
                </button>
                <button onClick={() => handleToggleActivo(p.id, p.activo)} className="flex items-center gap-1 text-xs text-slate-500 hover:bg-slate-100 px-2 py-1 rounded-lg">
                  {p.activo ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">{editId ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3>
              <button onClick={() => setModalOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={15} /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre empresa *" className={inCls} required />
              <input value={form.contacto} onChange={e => setForm({ ...form, contacto: e.target.value })} placeholder="Persona de contacto" className={inCls} />
              <div className="grid grid-cols-2 gap-3">
                <input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="Teléfono" className={inCls} />
                <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" className={inCls} type="email" />
              </div>
              <textarea value={form.productos} onChange={e => setForm({ ...form, productos: e.target.value })} placeholder="Productos que provee..." rows={2} className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none bg-white" />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-700">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ─── AlertasPanel (Admin only) ────────────────────────────────────────────
function AlertasPanel({ alertas, repuestos, setActiveTab }: {
  alertas: Repuesto[]; repuestos: Repuesto[];
  setActiveTab: (tab: Tab) => void;
}) {
  const stockCritico = alertas.length;
  const totalRepuestos = repuestos.length;
  const porcentajeAlerta = totalRepuestos > 0 ? Math.round((stockCritico / totalRepuestos) * 100) : 0;

  return (
    <>
      {stockCritico > 0 && (
        <div className="mb-5 bg-red-50 border-l-4 border-red-500 rounded-lg p-5 flex items-start gap-3">
          <AlertTriangle size={24} className="text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-bold text-red-800 mb-1">Stock Crítico Detectado</h3>
            <p className="text-sm text-red-700">{stockCritico} ítem{stockCritico > 1 ? 's' : ''} con stock disponible por debajo del mínimo requerido</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <div className="bg-white border border-red-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-red-600 uppercase mb-1">Stock Crítico</p>
          <p className="text-2xl font-bold text-red-700">{stockCritico}</p>
          <p className="text-xs text-slate-500 mt-1">{porcentajeAlerta}% del inventario</p>
        </div>
        <div className="bg-white border border-amber-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-amber-600 uppercase mb-1">Total en Alerta</p>
          <p className="text-2xl font-bold text-amber-700">{totalRepuestos}</p>
          <p className="text-xs text-slate-500 mt-1">Repuestos totales</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Monitoreo</p>
          <p className="text-2xl font-bold text-slate-700">✓</p>
          <p className="text-xs text-slate-500 mt-1">Sistema activo</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Repuesto</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Categoría</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Stock Disponible</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Stock Total</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Mínimo</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {alertas.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-slate-400 text-sm">Sin alertas de stock crítico</td></tr>
            ) : alertas.map(alerta => {
              const disponible = alerta.cantidad - alerta.cantidadReservada;
              return (
                <tr key={alerta.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3.5">
                    <p className="text-sm font-semibold text-slate-800">{alerta.nombre}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{alerta.categoria}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`font-bold text-sm ${disponible <= 0 ? 'text-red-600' : 'text-amber-600'}`}>
                      {disponible}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-slate-600">
                    {alerta.cantidad} un.
                  </td>
                  <td className="px-4 py-3.5 text-sm text-slate-600">
                    {alerta.stockMinimo} un.
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => setActiveTab('repuestos')}
                      className="text-xs text-cyan-600 hover:bg-cyan-50 px-2 py-1 rounded-lg font-medium"
                    >
                      Ver Repuesto
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
