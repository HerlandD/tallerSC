import React, { useState } from 'react';
import { Settings, Plus, Pencil, Trash2, X, Eye, EyeOff, Users, UserCheck, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp, PersonalTaller, Usuario, Rol, Catalogs } from '../context/AppContext';
import { toast } from 'sonner';

type Tab = 'personal' | 'usuarios' | 'catalogos';

const rolOptions: { value: Rol; label: string; color: string }[] = [
  { value: 'administrador', label: 'Administrador', color: 'bg-purple-100 text-purple-700' },
  { value: 'asesor', label: 'Asesor de Servicio', color: 'bg-blue-100 text-blue-700' },
  { value: 'mecanico', label: 'Mecánico', color: 'bg-orange-100 text-orange-700' },
  { value: 'jefe_taller', label: 'Jefe de Taller', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'cliente', label: 'Cliente', color: 'bg-gray-100 text-gray-700' },
];

const cargoOpts = ['Técnico Senior', 'Técnico', 'Jefe de Taller', 'Asesor de Servicio', 'Administrador', 'Recepcionista'];
const estadoPersonalConfig = {
  activo: { label: 'Activo', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  inactivo: { label: 'Inactivo', color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
  vacaciones: { label: 'Vacaciones', color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
};

const inputCls = (err?: string) =>
  `w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${err ? 'border-red-400 focus:ring-red-300' : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'}`;

export default function ConfigSecurity() {
  const [activeTab, setActiveTab] = useState<Tab>('personal');

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings size={22} className="text-blue-600" /> Configuración y Seguridad
        </h1>
        <p className="text-gray-500 text-sm">Gestión de personal, usuarios del sistema y catálogos maestros</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {[
          { key: 'personal' as Tab, label: 'Personal del Taller', icon: <UserCheck size={15} /> },
          { key: 'usuarios' as Tab, label: 'Usuarios y Roles', icon: <Users size={15} /> },
          { key: 'catalogos' as Tab, label: 'Catálogos Maestros', icon: <BookOpen size={15} /> },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === t.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'personal' && <PersonalTab />}
      {activeTab === 'usuarios' && <UsuariosTab />}
      {activeTab === 'catalogos' && <CatalogosTab />}
    </div>
  );
}

// ─── PERSONAL TAB ─────────────────────────────────────────────────────────────

type PersonalForm = Omit<PersonalTaller, 'id'>;
const emptyPersonal: PersonalForm = { nombre: '', cargo: '', especialidad: '', telefono: '', email: '', estado: 'activo', usuarioId: '' };

function PersonalTab() {
  const { personal, usuarios, addPersonal, updatePersonal, deletePersonal } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<PersonalForm>(emptyPersonal);
  const [errors, setErrors] = useState<Partial<Record<keyof PersonalForm, string>>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const openCreate = () => { setEditId(null); setForm(emptyPersonal); setErrors({}); setModalOpen(true); };
  const openEdit = (p: PersonalTaller) => { setEditId(p.id); setForm({ nombre: p.nombre, cargo: p.cargo, especialidad: p.especialidad, telefono: p.telefono, email: p.email, estado: p.estado, usuarioId: p.usuarioId || '' }); setErrors({}); setModalOpen(true); };

  const validate = () => {
    const e: Partial<Record<keyof PersonalForm, string>> = {};
    if (!form.nombre.trim()) e.nombre = 'El nombre es requerido';
    if (!form.cargo) e.cargo = 'El cargo es requerido';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (editId) { updatePersonal(editId, form); toast.success('Personal actualizado'); }
    else { addPersonal(form); toast.success('Personal registrado'); }
    setModalOpen(false);
  };

  const getUsuarioLinked = (usuarioId?: string) => usuarioId ? usuarios.find(u => u.id === usuarioId)?.nombre : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-gray-500 text-sm">{personal.length} miembros del personal</p>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Agregar Personal
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {personal.map(p => {
          const cfg = estadoPersonalConfig[p.estado];
          const linkedUser = getUsuarioLinked(p.usuarioId);
          return (
            <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-700 font-bold text-sm">{p.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{p.nombre}</p>
                    <p className="text-gray-500 text-xs">{p.cargo}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Pencil size={13} /></button>
                  <button onClick={() => setDeleteConfirm(p.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={13} /></button>
                </div>
              </div>
              <div className="space-y-1.5">
                {p.especialidad && <p className="text-xs text-gray-500"><span className="text-gray-400">Especialidad:</span> {p.especialidad}</p>}
                {p.telefono && <p className="text-xs text-gray-500"><span className="text-gray-400">Tel:</span> {p.telefono}</p>}
                {p.email && <p className="text-xs text-gray-500 truncate"><span className="text-gray-400">Email:</span> {p.email}</p>}
                {linkedUser && <p className="text-xs text-blue-600"><span className="text-gray-400">Usuario:</span> {linkedUser}</p>}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${cfg.color}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">{editId ? 'Editar Personal' : 'Agregar Personal'}</h3>
              <button onClick={() => setModalOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={16} className="text-gray-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">Nombre completo</label>
                <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Juan Pérez" className={inputCls(errors.nombre)} />
                {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">Cargo</label>
                  <select value={form.cargo} onChange={e => setForm({ ...form, cargo: e.target.value })} className={inputCls(errors.cargo)}>
                    <option value="">Seleccionar...</option>
                    {cargoOpts.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.cargo && <p className="text-xs text-red-500 mt-1">{errors.cargo}</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">Estado</label>
                  <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value as PersonalTaller['estado'] })} className={inputCls()}>
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                    <option value="vacaciones">Vacaciones</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">Especialidad</label>
                <input value={form.especialidad} onChange={e => setForm({ ...form, especialidad: e.target.value })} placeholder="Ej: Motor y Transmisión" className={inputCls()} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">Teléfono</label>
                  <input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="09XXXXXXXX" className={inputCls()} />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="correo@taller.com" className={inputCls()} />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">Vincular con cuenta de usuario (opcional)</label>
                <select value={form.usuarioId} onChange={e => setForm({ ...form, usuarioId: e.target.value })} className={inputCls()}>
                  <option value="">Sin cuenta vinculada</option>
                  {usuarios.filter(u => u.rol !== 'cliente').map(u => <option key={u.id} value={u.id}>{u.nombre} ({u.username})</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">{editId ? 'Actualizar' : 'Registrar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {deleteConfirm && <DeleteConfirm onConfirm={() => { deletePersonal(deleteConfirm); setDeleteConfirm(null); toast.success('Personal eliminado'); }} onCancel={() => setDeleteConfirm(null)} />}
    </div>
  );
}

// ─── USUARIOS TAB ──────────────────────────────────────────────────────────────

type UsuarioForm = Omit<Usuario, 'id'>;
const emptyUsuario: UsuarioForm = { nombre: '', username: '', password: '', rol: 'asesor', activo: true };

function UsuariosTab() {
  const { usuarios, addUsuario, updateUsuario, deleteUsuario, currentUser } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<UsuarioForm>(emptyUsuario);
  const [errors, setErrors] = useState<Partial<Record<keyof UsuarioForm, string>>>({});
  const [showPass, setShowPass] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const openCreate = () => { setEditId(null); setForm(emptyUsuario); setErrors({}); setShowPass(false); setModalOpen(true); };
  const openEdit = (u: Usuario) => { setEditId(u.id); setForm({ nombre: u.nombre, username: u.username, password: u.password, rol: u.rol, activo: u.activo }); setErrors({}); setShowPass(false); setModalOpen(true); };

  const validate = () => {
    const e: Partial<Record<keyof UsuarioForm, string>> = {};
    if (!form.nombre.trim()) e.nombre = 'Nombre requerido';
    if (!form.username.trim()) e.username = 'Usuario requerido';
    if (!form.password || form.password.length < 4) e.password = 'Mínimo 4 caracteres';
    const dup = usuarios.find(u => u.username === form.username && u.id !== editId);
    if (dup) e.username = 'Usuario ya existe';
    setErrors(e); return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (editId) { updateUsuario(editId, form); toast.success('Usuario actualizado'); }
    else { addUsuario(form); toast.success('Usuario creado'); }
    setModalOpen(false);
  };

  const rolCounts = rolOptions.reduce((acc, r) => {
    acc[r.value] = usuarios.filter(u => u.rol === r.value).length;
    return acc;
  }, {} as Record<Rol, number>);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2 flex-wrap">
          {rolOptions.map(r => (
            <div key={r.value} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${r.color}`}>
              {r.label} <span className="opacity-60">({rolCounts[r.value] || 0})</span>
            </div>
          ))}
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ml-3 flex-shrink-0">
          <Plus size={16} /> Nuevo Usuario
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['Nombre', 'Usuario', 'Rol', 'Estado', ''].map(h => <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {usuarios.map(u => {
                const rolCfg = rolOptions.find(r => r.value === u.rol)!;
                const isSelf = u.id === currentUser?.id;
                return (
                  <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${isSelf ? 'bg-blue-50/30' : ''}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-gray-600">
                          {u.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{u.nombre}</p>
                          {isSelf && <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">Tú</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500 font-mono">{u.username}</td>
                    <td className="px-5 py-3.5"><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${rolCfg.color}`}>{rolCfg.label}</span></td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${u.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.activo ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(u)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Pencil size={14} /></button>
                        {!isSelf && <button onClick={() => setDeleteConfirm(u.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">{editId ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
              <button onClick={() => setModalOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={16} className="text-gray-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">Nombre completo</label>
                <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: María García" className={inputCls(errors.nombre)} />
                {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">Usuario</label>
                  <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value.toLowerCase().trim() })} placeholder="usuario" className={inputCls(errors.username)} />
                  {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username}</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">Contraseña</label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min. 4 car." className={`${inputCls(errors.password)} pr-9`} />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPass ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                  </div>
                  {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">Rol</label>
                <select value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value as Rol })} className={inputCls()}>
                  {rolOptions.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })} className="w-4 h-4 accent-blue-600" />
                <span className="text-sm text-gray-700">Usuario activo</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">{editId ? 'Actualizar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {deleteConfirm && <DeleteConfirm onConfirm={() => { deleteUsuario(deleteConfirm); setDeleteConfirm(null); toast.success('Usuario eliminado'); }} onCancel={() => setDeleteConfirm(null)} />}
    </div>
  );
}

// ─── CATÁLOGOS TAB ────────────────────────────────────────────────────────────

function CatalogosTab() {
  const { catalogs, updateCatalogs } = useApp();
  const [openSection, setOpenSection] = useState<string | null>('marcas');
  const [selectedMarca, setSelectedMarca] = useState<number | null>(null);
  const [newMarca, setNewMarca] = useState('');
  const [newModelo, setNewModelo] = useState('');
  const [newItem, setNewItem] = useState<Record<string, string>>({});

  const addMarca = () => {
    if (!newMarca.trim()) return;
    const updated = [...catalogs.marcas, { nombre: newMarca.trim(), modelos: [] }];
    updateCatalogs({ marcas: updated });
    setNewMarca('');
    toast.success('Marca agregada');
  };

  const removeMarca = (i: number) => {
    const updated = catalogs.marcas.filter((_, idx) => idx !== i);
    updateCatalogs({ marcas: updated });
    if (selectedMarca === i) setSelectedMarca(null);
    toast.success('Marca eliminada');
  };

  const addModelo = (marcaIdx: number) => {
    if (!newModelo.trim()) return;
    const updated = catalogs.marcas.map((m, i) => i === marcaIdx ? { ...m, modelos: [...m.modelos, newModelo.trim()] } : m);
    updateCatalogs({ marcas: updated });
    setNewModelo('');
    toast.success('Modelo agregado');
  };

  const removeModelo = (marcaIdx: number, modeloIdx: number) => {
    const updated = catalogs.marcas.map((m, i) => i === marcaIdx ? { ...m, modelos: m.modelos.filter((_, j) => j !== modeloIdx) } : m);
    updateCatalogs({ marcas: updated });
  };

  const addListItem = (key: keyof Catalogs, item: string) => {
    if (!item.trim()) return;
    const list = catalogs[key] as string[];
    if (list.includes(item.trim())) { toast.error('Este elemento ya existe'); return; }
    updateCatalogs({ [key]: [...list, item.trim()] });
    setNewItem(p => ({ ...p, [key]: '' }));
    toast.success('Elemento agregado');
  };

  const removeListItem = (key: keyof Catalogs, item: string) => {
    const list = catalogs[key] as string[];
    updateCatalogs({ [key]: list.filter(i => i !== item) });
    toast.success('Elemento eliminado');
  };

  const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <button onClick={() => setOpenSection(openSection === id ? null : id)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
        <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
        {openSection === id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>
      {openSection === id && <div className="border-t border-gray-100 px-5 pb-5 pt-4">{children}</div>}
    </div>
  );

  const SimpleList = ({ label, catKey }: { label: string; catKey: 'tiposServicio' | 'motivosIngreso' | 'metodosPago' }) => (
    <Section id={catKey} title={label}>
      <div className="flex gap-2 mb-4">
        <input value={newItem[catKey] || ''} onChange={e => setNewItem(p => ({ ...p, [catKey]: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addListItem(catKey, newItem[catKey] || ''))}
          placeholder={`Nuevo ${label.toLowerCase()}...`} className="flex-1 px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button onClick={() => addListItem(catKey, newItem[catKey] || '')} className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">Agregar</button>
      </div>
      <div className="flex flex-wrap gap-2">
        {(catalogs[catKey] as string[]).map(item => (
          <div key={item} className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm">
            <span>{item}</span>
            <button onClick={() => removeListItem(catKey, item)} className="text-gray-400 hover:text-red-600 ml-1"><X size={12} /></button>
          </div>
        ))}
      </div>
    </Section>
  );

  return (
    <div className="space-y-4">
      {/* Marcas y Modelos */}
      <Section id="marcas" title={`Marcas y Modelos de Vehículos (${catalogs.marcas.length} marcas)`}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: marcas list */}
          <div>
            <div className="flex gap-2 mb-3">
              <input value={newMarca} onChange={e => setNewMarca(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addMarca())} placeholder="Nueva marca..." className="flex-1 px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={addMarca} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">Agregar</button>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {catalogs.marcas.map((m, i) => (
                <div key={i} onClick={() => setSelectedMarca(selectedMarca === i ? null : i)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all ${selectedMarca === i ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'}`}>
                  <span className="text-sm font-medium text-gray-700">{m.nombre} <span className="text-gray-400 text-xs">({m.modelos.length} modelos)</span></span>
                  <button onClick={e => { e.stopPropagation(); removeMarca(i); }} className="text-gray-400 hover:text-red-600"><X size={13} /></button>
                </div>
              ))}
            </div>
          </div>
          {/* Right: modelos */}
          <div>
            {selectedMarca !== null ? (
              <>
                <p className="text-sm font-semibold text-gray-700 mb-3">Modelos de {catalogs.marcas[selectedMarca]?.nombre}</p>
                <div className="flex gap-2 mb-3">
                  <input value={newModelo} onChange={e => setNewModelo(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addModelo(selectedMarca!))} placeholder="Nuevo modelo..." className="flex-1 px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button onClick={() => addModelo(selectedMarca!)} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors">Agregar</button>
                </div>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {catalogs.marcas[selectedMarca]?.modelos.map((mod, j) => (
                    <div key={j} className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-sm">
                      {mod} <button onClick={() => removeModelo(selectedMarca!, j)} className="text-blue-400 hover:text-red-600 ml-1"><X size={11} /></button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm py-8">
                Selecciona una marca para ver y editar sus modelos
              </div>
            )}
          </div>
        </div>
      </Section>

      <SimpleList label="Tipos de Servicio" catKey="tiposServicio" />
      <SimpleList label="Motivos de Ingreso" catKey="motivosIngreso" />
      <SimpleList label="Métodos de Pago" catKey="metodosPago" />
    </div>
  );
}

// ─── Shared ────────────────────────────────────────────────────────────────────

function DeleteConfirm({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h3 className="font-semibold text-gray-800 mb-2">Confirmar eliminación</h3>
        <p className="text-gray-600 text-sm mb-5">¿Estás seguro? Esta acción no se puede deshacer.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors">Cancelar</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors">Eliminar</button>
        </div>
      </div>
    </div>
  );
}