import React, { useState } from 'react';
import { Plus, Search, Pencil, Trash2, Users, X, AlertCircle, Loader2 } from 'lucide-react';
import { useApp, Cliente } from '../context/AppContext';

type FormData = {
  nombre: string; ci: string; nit: string;
  telefono: string; email: string; direccion: string;
};
type FormErrors = Partial<Record<keyof FormData, string>>;

const emptyForm: FormData = { nombre: '', ci: '', nit: '', telefono: '', email: '', direccion: '' };

export default function Clients() {
  const { clientes, vehiculos, addCliente, updateCliente, deleteCliente, currentUser } = useApp();
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

  const filtered = clientes.filter(c =>
    c.nombre.toLowerCase().includes(search.toLowerCase()) ||
    c.ci.includes(search) ||
    (c.telefono ?? '').includes(search) ||
    (c.email ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const canEdit = currentUser?.rol === 'administrador' || currentUser?.rol === 'asesor';

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setErrors({});
    setServerError('');
    setModalOpen(true);
  };

  const openEdit = (c: Cliente) => {
    setEditId(c.id);
    setForm({
      nombre: c.nombre, ci: c.ci, nit: c.nit ?? '',
      telefono: c.telefono, email: c.email ?? '', direccion: c.direccion ?? '',
    });
    setErrors({});
    setServerError('');
    setModalOpen(true);
  };

  // ── Validación cliente-side ───────────────────────────────────────────────
  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.nombre.trim())    e.nombre   = 'El nombre completo es requerido';
    if (!form.ci.trim())        e.ci       = 'La cédula/CI es requerida';
    if (form.ci.trim() && !/^\d{7,13}$/.test(form.ci.replace(/\D/g, '')))
                                e.ci       = 'Cédula inválida (7–13 dígitos)';
    if (!form.telefono.trim())  e.telefono = 'El teléfono es requerido';
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email))
                                e.email    = 'Correo electrónico inválido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setServerError('');

    const payload = {
      nombre:    form.nombre.trim(),
      ci:        form.ci.trim(),
      nit:       form.nit.trim()       || undefined,
      telefono:  form.telefono.trim(),
      email:     form.email.trim()     || undefined,
      direccion: form.direccion.trim() || undefined,
    };

    const result = editId
      ? await updateCliente(editId, payload)
      : await addCliente(payload);

    setLoading(false);
    if (!result.ok) { setServerError(result.error ?? 'Error desconocido'); return; }
    setModalOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    setDeleteError('');
    const result = await deleteCliente(deleteConfirm);
    setDeleteLoading(false);
    if (!result.ok) { setDeleteError(result.error ?? 'Error al eliminar'); return; }
    setDeleteConfirm(null);
  };

  const getVehiculoCount = (id: string) => vehiculos.filter(v => v.clienteId === id).length;

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
          <button onClick={openCreate}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} /> Nuevo Cliente
          </button>
        )}
      </div>

      {/* Búsqueda */}
      <div className="relative mb-5">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Buscar por nombre, CI, teléfono o email..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cédula</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Teléfono</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Email</th>
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
                  <td className="px-5 py-3.5 text-sm text-gray-600 hidden md:table-cell">{c.email || '—'}</td>
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    <span className="text-sm font-medium text-blue-600">{getVehiculoCount(c.id)}</span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500 hidden lg:table-cell">{c.fechaRegistro}</td>
                  {canEdit && (
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(c)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => { setDeleteConfirm(c.id); setDeleteError(''); }}
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
        <Modal title={editId ? 'Editar Cliente' : 'Nuevo Cliente'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nombre completo *" error={errors.nombre} className="col-span-2">
                <input value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: Juan Carlos Pérez"
                  className={inputClass(!!errors.nombre)} />
              </Field>
              <Field label="Cédula / CI *" error={errors.ci}>
                <input value={form.ci}
                  onChange={e => setForm({ ...form, ci: e.target.value.replace(/\D/g, '') })}
                  placeholder="0987654321"
                  className={inputClass(!!errors.ci)} />
              </Field>
              <Field label="NIT (opcional)">
                <input value={form.nit}
                  onChange={e => setForm({ ...form, nit: e.target.value })}
                  placeholder="Para factura empresa"
                  className={inputClass()} />
              </Field>
              <Field label="Teléfono *" error={errors.telefono}>
                <input value={form.telefono}
                  onChange={e => setForm({ ...form, telefono: e.target.value })}
                  placeholder="0987654321"
                  className={inputClass(!!errors.telefono)} />
              </Field>
              <Field label="Correo electrónico" error={errors.email}>
                <input value={form.email} type="email"
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="correo@mail.com"
                  className={inputClass(!!errors.email)} />
              </Field>
              <Field label="Dirección" className="col-span-2">
                <input value={form.direccion}
                  onChange={e => setForm({ ...form, direccion: e.target.value })}
                  placeholder="Av. Principal 123, Ciudad"
                  className={inputClass()} />
              </Field>
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
        </Modal>
      )}

      {/* Modal Confirmar Eliminación */}
      {deleteConfirm && (
        <Modal title="Confirmar eliminación" onClose={() => setDeleteConfirm(null)}>
          <p className="text-gray-600 text-sm mb-4">
            ¿Seguro que deseas eliminar este cliente? Si tiene vehículos asociados, no podrá eliminarse.
          </p>
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
        </Modal>
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const inputClass = (hasError = false) =>
  `w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors
   ${hasError ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'}`;

function Field({
  label, error, className = '', children,
}: { label: string; error?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
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