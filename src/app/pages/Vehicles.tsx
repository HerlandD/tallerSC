import React, { useState } from 'react';
import { Plus, Search, Pencil, Trash2, Car, X } from 'lucide-react';
import { useApp, Vehiculo } from '../context/AppContext';

type FormData = Omit<Vehiculo, 'id'>;
const emptyForm: FormData = { clienteId: '', placa: '', marca: '', modelo: '', año: new Date().getFullYear(), color: '' };

const marcas = ['Toyota', 'Chevrolet', 'Hyundai', 'Ford', 'Kia', 'Volkswagen', 'Nissan', 'Honda', 'Mazda', 'Mitsubishi', 'Renault', 'Otro'];

export default function Vehicles() {
  const { vehiculos, clientes, addVehiculo, updateVehiculo, deleteVehiculo, currentUser } = useApp();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const filtered = vehiculos.filter(v => {
    const s = search.toLowerCase();
    const cliente = clientes.find(c => c.id === v.clienteId);
    return v.placa.toLowerCase().includes(s) || v.marca.toLowerCase().includes(s) ||
      v.modelo.toLowerCase().includes(s) || (cliente?.nombre.toLowerCase().includes(s));
  });

  const canEdit = currentUser?.rol === 'administrador' || currentUser?.rol === 'asesor';

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (v: Vehiculo) => {
    setEditId(v.id);
    setForm({ clienteId: v.clienteId, placa: v.placa, marca: v.marca, modelo: v.modelo, año: v.año, color: v.color });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.clienteId) e.clienteId = 'Selecciona un cliente';
    if (!form.placa.trim()) e.placa = 'La placa es requerida';
    if (!form.marca.trim()) e.marca = 'La marca es requerida';
    if (!form.modelo.trim()) e.modelo = 'El modelo es requerido';
    if (!form.año || form.año < 1900 || form.año > new Date().getFullYear() + 1) e.año = 'Año inválido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (editId) updateVehiculo(editId, form);
    else addVehiculo(form);
    setModalOpen(false);
  };

  const getClienteNombre = (id: string) => clientes.find(c => c.id === id)?.nombre || '—';

  const inputCls = (err?: string) =>
    `w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${err ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'}`;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Car size={22} className="text-blue-600" /> Vehículos
          </h1>
          <p className="text-gray-500 text-sm">{vehiculos.length} vehículos registrados</p>
        </div>
        {canEdit && (
          <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} /> Nuevo Vehículo
          </button>
        )}
      </div>

      <div className="relative mb-5">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text" placeholder="Buscar por placa, marca, modelo o cliente..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Placa</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vehículo</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Año</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Color</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Propietario</th>
                {canEdit && <th className="px-5 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-gray-400 text-sm">No se encontraron vehículos</td></tr>
              ) : filtered.map(v => (
                <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded text-sm font-medium">
                      <Car size={13} /> {v.placa}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm font-medium text-gray-800">{v.marca} {v.modelo}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600 hidden sm:table-cell">{v.año}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600 hidden md:table-cell">{v.color}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{getClienteNombre(v.clienteId)}</td>
                  {canEdit && (
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(v)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Pencil size={15} /></button>
                        <button onClick={() => setDeleteConfirm(v.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">{editId ? 'Editar Vehículo' : 'Nuevo Vehículo'}</h3>
              <button onClick={() => setModalOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={16} className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">Cliente</label>
                <select value={form.clienteId} onChange={e => setForm({ ...form, clienteId: e.target.value })} className={inputCls(errors.clienteId)}>
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre} - CI: {c.ci}</option>)}
                </select>
                {errors.clienteId && <p className="text-xs text-red-500 mt-1">{errors.clienteId}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">Placa</label>
                  <input value={form.placa} onChange={e => setForm({ ...form, placa: e.target.value.toUpperCase() })} placeholder="ABC-123" className={inputCls(errors.placa)} />
                  {errors.placa && <p className="text-xs text-red-500 mt-1">{errors.placa}</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">Año</label>
                  <input type="number" value={form.año} onChange={e => setForm({ ...form, año: Number(e.target.value) })} min={1900} max={new Date().getFullYear() + 1} className={inputCls(errors.año)} />
                  {errors.año && <p className="text-xs text-red-500 mt-1">{errors.año}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">Marca</label>
                <select value={form.marca} onChange={e => setForm({ ...form, marca: e.target.value })} className={inputCls(errors.marca)}>
                  <option value="">Seleccionar marca...</option>
                  {marcas.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                {errors.marca && <p className="text-xs text-red-500 mt-1">{errors.marca}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">Modelo</label>
                  <input value={form.modelo} onChange={e => setForm({ ...form, modelo: e.target.value })} placeholder="Ej: Corolla" className={inputCls(errors.modelo)} />
                  {errors.modelo && <p className="text-xs text-red-500 mt-1">{errors.modelo}</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">Color</label>
                  <input value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} placeholder="Ej: Blanco" className={inputCls()} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">{editId ? 'Actualizar' : 'Registrar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-2">Confirmar eliminación</h3>
            <p className="text-gray-600 text-sm mb-5">¿Estás seguro de que deseas eliminar este vehículo?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors">Cancelar</button>
              <button onClick={() => { deleteVehiculo(deleteConfirm); setDeleteConfirm(null); }} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
