import React, { useState } from 'react';
import { Plus, Search, Pencil, Trash2, Car, X, AlertCircle, Loader2, Printer, FileText } from 'lucide-react';
import { useApp, Vehiculo, OrdenTrabajo } from '../context/AppContext';
import DocumentoPDF from '../components/DocumentoPDF';

type FormData = {
  clienteId: string; placa: string; marca: string; modelo: string;
  año: number; color: string; chasis: string; kilometraje: string;
};
type FormErrors = Partial<Record<keyof FormData, string>>;

const emptyForm: FormData = {
  clienteId: '', placa: '', marca: '', modelo: '',
  año: new Date().getFullYear(), color: '', chasis: '', kilometraje: '0',
};

const MARCAS = [
  'Toyota', 'Chevrolet', 'Hyundai', 'Ford', 'Kia', 'Volkswagen',
  'Nissan', 'Honda', 'Mazda', 'Mitsubishi', 'Suzuki', 'Renault', 'Otro',
];

export default function Vehicles() {
  const { vehiculos, clientes, ordenes, addVehiculo, updateVehiculo, deleteVehiculo, currentUser } = useApp();
  const [showHistorial, setShowHistorial] = useState<Vehiculo | null>(null);
  const [search, setSearch]           = useState('');
  const [modalOpen, setModalOpen]     = useState(false);
  const [editId, setEditId]           = useState<string | null>(null);
  const [form, setForm]               = useState<FormData>(emptyForm);
  const [errors, setErrors]           = useState<FormErrors>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading]         = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filtered = vehiculos.filter(v => {
    const s = search.toLowerCase();
    const cliente = clientes.find(c => c.id === v.clienteId);
    return (
      v.placa.toLowerCase().includes(s) ||
      v.marca.toLowerCase().includes(s) ||
      v.modelo.toLowerCase().includes(s) ||
      (cliente?.nombre.toLowerCase().includes(s) ?? false)
    );
  });

  const canEdit = currentUser?.rol === 'administrador' || currentUser?.rol === 'asesor';

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setErrors({});
    setServerError('');
    setModalOpen(true);
  };

  const openEdit = (v: Vehiculo) => {
    setEditId(v.id);
    setForm({
      clienteId:   v.clienteId,
      placa:       v.placa,
      marca:       v.marca,
      modelo:      v.modelo,
      año:         v.año,
      color:       v.color ?? '',
      chasis:      v.chasis ?? '',
      kilometraje: String(v.kilometraje ?? 0),
    });
    setErrors({});
    setServerError('');
    setModalOpen(true);
  };

  // ── Validación cliente-side ───────────────────────────────────────────────
  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.clienteId)       e.clienteId   = 'Selecciona un cliente';
    if (!form.placa.trim())    e.placa       = 'La placa es requerida';
    if (form.placa.trim() && !/^[A-Z0-9\-]{3,10}$/i.test(form.placa.trim()))
                               e.placa       = 'Formato de placa inválido';
    if (!form.marca.trim())    e.marca       = 'La marca es requerida';
    if (!form.modelo.trim())   e.modelo      = 'El modelo es requerido';
    const anioActual = new Date().getFullYear();
    if (!form.año || form.año < 1950 || form.año > anioActual + 1)
                               e.año         = `Año inválido (1950 – ${anioActual + 1})`;
    if (form.chasis.trim() && form.chasis.trim().length !== 17)
                               e.chasis      = 'El VIN debe tener exactamente 17 caracteres';
    const km = Number(form.kilometraje);
    if (isNaN(km) || km < 0)  e.kilometraje = 'Kilometraje inválido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setServerError('');

    const payload: Omit<Vehiculo, 'id'> = {
      clienteId:   form.clienteId,
      placa:       form.placa.trim().toUpperCase(),
      marca:       form.marca.trim(),
      modelo:      form.modelo.trim(),
      año:         form.año,
      color:       form.color.trim()  || '',
      chasis:      form.chasis.trim() || undefined,
      kilometraje: Number(form.kilometraje) || 0,
    };

    const result = editId
      ? await updateVehiculo(editId, payload)
      : await addVehiculo(payload);

    setLoading(false);
    if (!result.ok) { setServerError(result.error ?? 'Error desconocido'); return; }
    setModalOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    setDeleteError('');
    const result = await deleteVehiculo(deleteConfirm);
    setDeleteLoading(false);
    if (!result.ok) { setDeleteError(result.error ?? 'Error al eliminar'); return; }
    setDeleteConfirm(null);
  };

  const getClienteNombre = (id: string) => clientes.find(c => c.id === id)?.nombre ?? '—';

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Car size={22} className="text-blue-600" /> Vehículos
          </h1>
          <p className="text-gray-500 text-sm">{vehiculos.length} vehículos registrados</p>
        </div>
        {canEdit && (
          <button onClick={openCreate}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} /> Nuevo Vehículo
          </button>
        )}
      </div>

      {/* Búsqueda */}
      <div className="relative mb-5">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Buscar por placa, marca, modelo o propietario..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Placa</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vehículo</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Año</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Color</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">KM</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Propietario</th>
                {canEdit && <th className="px-5 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400 text-sm">No se encontraron vehículos</td></tr>
              ) : filtered.map(v => (
                <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded text-sm font-mono font-medium">
                      <Car size={13} /> {v.placa}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm font-medium text-gray-800">{v.marca} {v.modelo}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600 hidden sm:table-cell">{v.año}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600 hidden md:table-cell">{v.color || '—'}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600 hidden md:table-cell">
                    {v.kilometraje != null ? v.kilometraje.toLocaleString() + ' km' : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{getClienteNombre(v.clienteId)}</td>
                  {canEdit && (
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => setShowHistorial(v)}
                          title="Ver Historial" className="p-1.5 text-gray-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                          <FileText size={15} />
                        </button>
                        <button onClick={() => openEdit(v)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => { setDeleteConfirm(v.id); setDeleteError(''); }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear / Editar */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">{editId ? 'Editar Vehículo' : 'Nuevo Vehículo'}</h3>
              <button onClick={() => setModalOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={16} className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

              {/* Cliente */}
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">Cliente *</label>
                <select value={form.clienteId}
                  onChange={e => setForm({ ...form, clienteId: e.target.value })}
                  className={inputCls(!!errors.clienteId)}>
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre} — CI: {c.ci}</option>
                  ))}
                </select>
                {errors.clienteId && <p className="text-xs text-red-500 mt-1">{errors.clienteId}</p>}
              </div>

              {/* Placa + Año */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">Placa *</label>
                  <input value={form.placa}
                    onChange={e => setForm({ ...form, placa: e.target.value.toUpperCase() })}
                    placeholder="ABC-1234" className={inputCls(!!errors.placa)} />
                  {errors.placa && <p className="text-xs text-red-500 mt-1">{errors.placa}</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">Año *</label>
                  <input type="number" value={form.año}
                    onChange={e => setForm({ ...form, año: Number(e.target.value) })}
                    min={1950} max={new Date().getFullYear() + 1}
                    className={inputCls(!!errors.año)} />
                  {errors.año && <p className="text-xs text-red-500 mt-1">{errors.año}</p>}
                </div>
              </div>

              {/* Marca */}
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">Marca *</label>
                <select value={form.marca}
                  onChange={e => setForm({ ...form, marca: e.target.value })}
                  className={inputCls(!!errors.marca)}>
                  <option value="">Seleccionar marca...</option>
                  {MARCAS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                {errors.marca && <p className="text-xs text-red-500 mt-1">{errors.marca}</p>}
              </div>

              {/* Modelo + Color */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">Modelo *</label>
                  <input value={form.modelo}
                    onChange={e => setForm({ ...form, modelo: e.target.value })}
                    placeholder="Ej: Corolla" className={inputCls(!!errors.modelo)} />
                  {errors.modelo && <p className="text-xs text-red-500 mt-1">{errors.modelo}</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">Color</label>
                  <input value={form.color}
                    onChange={e => setForm({ ...form, color: e.target.value })}
                    placeholder="Ej: Blanco" className={inputCls()} />
                </div>
              </div>

              {/* VIN/Chasis + Kilometraje */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">VIN / Chasis</label>
                  <input value={form.chasis}
                    onChange={e => setForm({ ...form, chasis: e.target.value.toUpperCase() })}
                    placeholder="17 caracteres" maxLength={17}
                    className={inputCls(!!errors.chasis)} />
                  {errors.chasis && <p className="text-xs text-red-500 mt-1">{errors.chasis}</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">Kilometraje</label>
                  <input type="number" value={form.kilometraje}
                    onChange={e => setForm({ ...form, kilometraje: e.target.value })}
                    min={0} placeholder="0"
                    className={inputCls(!!errors.kilometraje)} />
                  {errors.kilometraje && <p className="text-xs text-red-500 mt-1">{errors.kilometraje}</p>}
                </div>
              </div>

              {serverError && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2.5 text-sm">
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                  <span>{serverError}</span>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {editId ? 'Actualizar' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-2">Confirmar eliminación</h3>
            <p className="text-gray-600 text-sm mb-4">¿Deseas eliminar este vehículo? Esta acción no se puede deshacer.</p>
            {deleteError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2.5 text-sm mb-4">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                <span>{deleteError}</span>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={deleteLoading}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                {deleteLoading && <Loader2 size={14} className="animate-spin" />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Historial */}
      {showHistorial && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-8 py-4 border-b border-gray-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 text-slate-600 rounded-xl">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Historial del Vehículo</h3>
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Placa: {showHistorial.placa}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg"
                >
                  <Printer size={16} /> Imprimir / PDF
                </button>
                <button
                  onClick={() => setShowHistorial(null)}
                  className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-white border border-transparent hover:border-slate-100 rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto bg-slate-100/30 p-8 flex justify-center scrollbar-hide">
              <DocumentoPDF 
                tipo="historial" 
                vehiculo={showHistorial}
                cliente={clientes.find(c => c.id === showHistorial.clienteId)}
                ordenes={ordenes.filter(o => o.vehiculoId === showHistorial.id)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls = (hasError = false) =>
  `w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors
   ${hasError ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'}`;