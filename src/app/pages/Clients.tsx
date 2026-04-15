import React, { useState } from 'react';
import { Plus, Search, Pencil, Trash2, Users, X } from 'lucide-react';
import { useApp, Cliente } from '../context/AppContext';

type FormData = Omit<Cliente, 'id' | 'fechaRegistro'>;
const emptyForm: FormData = { nombre: '', ci: '', telefono: '', email: '', direccion: '' };

export default function Clients() {
  const { clientes, vehiculos, addCliente, updateCliente, deleteCliente, currentUser } = useApp();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const filtered = clientes.filter(c =>
    c.nombre.toLowerCase().includes(search.toLowerCase()) ||
    c.ci.includes(search) ||
    c.telefono.includes(search)
  );

  const canEdit = currentUser?.rol === 'administrador' || currentUser?.rol === 'asesor';

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (c: Cliente) => {
    setEditId(c.id);
    setForm({ nombre: c.nombre, ci: c.ci, telefono: c.telefono, email: c.email, direccion: c.direccion });
    setErrors({});
    setModalOpen(true);
  };

  const validate = (): boolean => {
    const e: Partial<FormData> = {};
    if (!form.nombre.trim()) e.nombre = 'El nombre es requerido';
    if (!form.ci.trim()) e.ci = 'La cédula es requerida';
    if (!form.telefono.trim()) e.telefono = 'El teléfono es requerido';
    if (!form.direccion.trim()) e.direccion = 'La dirección es requerida';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (editId) {
      updateCliente(editId, form);
    } else {
      addCliente(form);
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteCliente(id);
    setDeleteConfirm(null);
  };

  const getVehiculoCount = (clienteId: string) => vehiculos.filter(v => v.clienteId === clienteId).length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users size={22} className="text-blue-600" /> Clientes
          </h1>
          <p className="text-gray-500 text-sm">{clientes.length} clientes registrados</p>
        </div>
        {canEdit && (
          <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} /> Nuevo Cliente
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, cédula o teléfono..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cédula</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Teléfono</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Dirección</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Vehículos</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Registro</th>
                {canEdit && <th className="px-5 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-gray-400 text-sm">No se encontraron clientes</td></tr>
              ) : filtered.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold">
                        {c.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-gray-800">{c.nombre}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{c.ci}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600 hidden sm:table-cell">{c.telefono}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600 hidden md:table-cell">{c.direccion}</td>
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    <span className="text-sm font-medium text-blue-600">{getVehiculoCount(c.id)}</span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500 hidden lg:table-cell">{c.fechaRegistro}</td>
                  {canEdit && (
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => setDeleteConfirm(c.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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

      {/* Create/Edit Modal */}
      {modalOpen && (
        <Modal title={editId ? 'Editar Cliente' : 'Nuevo Cliente'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Nombre completo" error={errors.nombre}>
              <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej: Juan Pérez" className={inputClass(!!errors.nombre)} />
            </Field>
            <Field label="Cédula de identidad" error={errors.ci}>
              <input value={form.ci} onChange={e => setForm({ ...form, ci: e.target.value })}
                placeholder="Ej: 1234567" className={inputClass(!!errors.ci)} />
            </Field>
            <Field label="Teléfono" error={errors.telefono}>
              <input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })}
                placeholder="Ej: 0987654321" className={inputClass(!!errors.telefono)} />
            </Field>
            <Field label="Email">
              <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                type="email" placeholder="correo@mail.com" className={inputClass()} />
            </Field>
            <Field label="Dirección" error={errors.direccion}>
              <input value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })}
                placeholder="Ej: Av. Principal 123" className={inputClass(!!errors.direccion)} />
            </Field>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors">Cancelar</button>
              <button type="submit" className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                {editId ? 'Actualizar' : 'Registrar'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <Modal title="Confirmar eliminación" onClose={() => setDeleteConfirm(null)}>
          <p className="text-gray-600 text-sm mb-5">¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors">Cancelar</button>
            <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors">Eliminar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

const inputClass = (hasError = false) =>
  `w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${hasError ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'}`;

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-gray-700 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={16} className="text-gray-500" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}