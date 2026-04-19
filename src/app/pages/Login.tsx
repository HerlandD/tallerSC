import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Eye, EyeOff, AlertCircle, User, Building2, CheckCircle,
  ChevronRight, Phone, Mail, MapPin, CreditCard, Lock, UserPlus
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import logoImg from 'figma:asset/705ae0af64042a0b0fa15a9246b41db08254ad91.png';
import clienteAvatarImg from 'figma:asset/7fef9965c0f7d500348453229f33b07ab2f187c3.png';

function InputField({
  label, type = 'text', value, onChange, placeholder, required, icon, hint
}: {
  label: string; type?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; icon?: React.ReactNode; hint?: string;
}) {
  const [show, setShow] = useState(false);
  const isPass = type === 'password';
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>}
        <input
          type={isPass && show ? 'text' : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full ${icon ? 'pl-9' : 'px-3.5'} ${isPass ? 'pr-10' : 'pr-3.5'} py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white`}
        />
        {isPass && (
          <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

export default function Login() {
  const { login, registerCliente, currentUser } = useApp();
  const navigate = useNavigate();
  const [portal, setPortal] = useState<'cliente' | 'empresa'>('empresa');
  const [clienteTab, setClienteTab] = useState<'login' | 'registro'>('login');

  // Empresa login state
  const [empUser, setEmpUser] = useState('');
  const [empPass, setEmpPass] = useState('');
  const [empError, setEmpError] = useState('');
  const [empLoading, setEmpLoading] = useState(false);

  // Cliente login state
  const [cliUser, setCliUser] = useState('');
  const [cliPass, setCliPass] = useState('');
  const [cliError, setCliError] = useState('');
  const [cliLoading, setCliLoading] = useState(false);

  // Registro state
  const [reg, setReg] = useState({
    nombre: '', ci: '', nit: '', telefono: '', email: '',
    direccion: '', username: '', password: '', confirmPassword: ''
  });
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.rol === 'cliente') {
        navigate('/portal', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [currentUser, navigate]);

  const handleEmpresaLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmpError('');
    setEmpLoading(true);
    const result = await login(empUser.trim(), empPass);
    if (!result.ok) setEmpError(result.error ?? 'Credenciales incorrectas. Verifica usuario y contraseña.');
    setEmpLoading(false);
  };

  const handleClienteLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCliError('');
    setCliLoading(true);
    const result = await login(cliUser.trim(), cliPass);
    if (!result.ok) setCliError(result.error ?? 'Usuario o contraseña incorrectos.');
    setCliLoading(false);
  };

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    if (!reg.nombre || !reg.ci || !reg.telefono || !reg.email || !reg.direccion || !reg.username || !reg.password) {
      setRegError('Todos los campos marcados con * son obligatorios'); return;
    }
    if (reg.password !== reg.confirmPassword) {
      setRegError('Las contraseñas no coinciden'); return;
    }
    if (reg.password.length < 6) {
      setRegError('La contraseña debe tener al menos 6 caracteres'); return;
    }
    if (!/^\S+@\S+\.\S+$/.test(reg.email)) {
      setRegError('Ingresa un correo electrónico válido'); return;
    }
    setRegLoading(true);
    try {
      const result = await registerCliente({
        nombre: reg.nombre, ci: reg.ci, nit: reg.nit || undefined,
        telefono: reg.telefono, email: reg.email, direccion: reg.direccion,
        username: reg.username, password: reg.password,
      });
      if (result.ok) {
        setRegSuccess(true);
        // currentUser will be set, navigate will trigger
      } else {
        setRegError(result.error || 'Error al registrar');
      }
    } catch (error) {
      setRegError('Error de conexión. Intente nuevamente.');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-center p-4">

      {/* Logo + Brand */}
      <div className="mb-6 flex justify-center">
        <div className="bg-white rounded-2xl shadow-lg px-5 py-3">
          <img src={logoImg} alt="TallerPro — Sistema de Gestión Automotriz" className="h-20 w-auto object-contain" />
        </div>
      </div>

      {/* Portal Selector */}
      <div className="flex bg-white/10 backdrop-blur-sm rounded-2xl p-1 mb-5 border border-white/20">
        <button
          onClick={() => setPortal('cliente')}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${portal === 'cliente' ? 'bg-white text-slate-800 shadow-lg' : 'text-white/70 hover:text-white'}`}>
          <User size={15} /> Portal Cliente
        </button>
        <button
          onClick={() => setPortal('empresa')}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${portal === 'empresa' ? 'bg-white text-slate-800 shadow-lg' : 'text-white/70 hover:text-white'}`}>
          <Building2 size={15} /> Acceso Empresa
        </button>
      </div>

      {/* ─── PORTAL EMPRESA ─── */}
      {portal === 'empresa' && (
        <div className="w-full max-w-sm">

          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-4">
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4">
              <div className="flex items-center gap-2 mb-0.5">
                <Building2 size={16} className="text-blue-400" />
                <h2 className="text-white font-bold text-sm">Acceso Personal de Taller</h2>
              </div>
              <p className="text-slate-400 text-xs">Ingresa con tus credenciales corporativas</p>
            </div>

            <form onSubmit={handleEmpresaLogin} className="px-6 py-5 space-y-3.5">
              <InputField label="Usuario corporativo" value={empUser} onChange={setEmpUser}
                placeholder="tu.usuario" required icon={<User size={14} />} />
              <InputField label="Contraseña" type="password" value={empPass} onChange={setEmpPass}
                placeholder="••••••••" required icon={<Lock size={14} />} />

              {empError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2.5 text-xs">
                  <AlertCircle size={13} /><span>{empError}</span>
                </div>
              )}

              <button type="submit" disabled={empLoading || !empUser || !empPass}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2">
                {empLoading ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verificando...</>
                ) : (
                  <>Ingresar al Sistema <ChevronRight size={14} /></>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── PORTAL CLIENTE ─── */}
      {portal === 'cliente' && (
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

            {/* Tab header */}
            <div className="flex bg-gray-50 p-1.5 m-2.5 rounded-xl gap-1">
              <button onClick={() => setClienteTab('login')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${clienteTab === 'login' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                <User size={13} /> Ingresar
              </button>
              <button onClick={() => setClienteTab('registro')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${clienteTab === 'registro' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                <UserPlus size={13} /> Crear cuenta
              </button>
            </div>

            {/* ── Login Tab ── */}
            {clienteTab === 'login' && (
              <div className="px-5 pb-5">
                {/* Hero */}
                <div className="text-center mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2 shadow overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800">
                    <img src={clienteAvatarImg} alt="Cliente" className="w-full h-full object-contain" />
                  </div>
                  <h3 className="font-bold text-gray-900">Bienvenido</h3>
                  <p className="text-gray-400 text-xs mt-0.5">Accede a tu portal TallerPro</p>
                </div>

                <form onSubmit={handleClienteLogin} className="space-y-3">
                  <InputField label="Usuario" value={cliUser} onChange={setCliUser}
                    placeholder="tu.usuario" required icon={<User size={14} />} />
                  <InputField label="Contraseña" type="password" value={cliPass} onChange={setCliPass}
                    placeholder="••••••••" required icon={<Lock size={14} />} />

                  {cliError && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2 text-xs">
                      <AlertCircle size={13} /><span>{cliError}</span>
                    </div>
                  )}

                  <button type="submit" disabled={cliLoading || !cliUser || !cliPass}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2">
                    {cliLoading ? (
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verificando...</>
                    ) : (
                      <>Acceder a mi cuenta <ChevronRight size={14} /></>
                    )}
                  </button>
                </form>

                <button type="button" onClick={() => setClienteTab('registro')}
                  className="w-full mt-2.5 text-xs text-slate-600 hover:text-slate-800 text-center font-medium">
                  ¿Primera vez? Crea tu cuenta gratis →
                </button>
              </div>
            )}

            {/* ── Registro Tab ── */}
            {clienteTab === 'registro' && (
              <div className="px-5 py-4">
                {regSuccess ? (
                  <div className="text-center py-6">
                    <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle size={28} className="text-green-600" />
                    </div>
                    <h3 className="font-bold text-gray-800 mb-1">¡Registro exitoso!</h3>
                    <p className="text-sm text-gray-500">Bienvenido a TallerPro. Redirigiendo...</p>
                  </div>
                ) : (
                  <form onSubmit={handleRegistro} className="space-y-3">
                    <div className="text-center mb-1">
                      <p className="text-xs text-gray-500">Crea tu cuenta para gestionar tus servicios vehiculares</p>
                    </div>

                    {/* Personal data */}
                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3.5 space-y-3">
                      <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Datos personales</p>
                      <InputField label="Nombre completo" value={reg.nombre} onChange={v => setReg({ ...reg, nombre: v })}
                        placeholder="Ej: Juan Carlos Torres" required icon={<User size={13} />} />
                      <div className="grid grid-cols-2 gap-2.5">
                        <InputField label="Cédula / CI" value={reg.ci} onChange={v => setReg({ ...reg, ci: v })}
                          placeholder="1234567890" required icon={<CreditCard size={13} />} />
                        <InputField label="NIT (opcional)" value={reg.nit} onChange={v => setReg({ ...reg, nit: v })}
                          placeholder="Factura empresa" icon={<CreditCard size={13} />} />
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        <InputField label="Teléfono" value={reg.telefono} onChange={v => setReg({ ...reg, telefono: v })}
                          placeholder="09XXXXXXXX" required icon={<Phone size={13} />} />
                        <InputField label="Correo electrónico" value={reg.email} onChange={v => setReg({ ...reg, email: v })}
                          placeholder="tu@email.com" required type="email" icon={<Mail size={13} />} />
                      </div>
                      <InputField label="Dirección" value={reg.direccion} onChange={v => setReg({ ...reg, direccion: v })}
                        placeholder="Calle, número, ciudad" required icon={<MapPin size={13} />} />
                    </div>

                    {/* Account data */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5 space-y-3">
                      <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Credenciales de acceso</p>
                      <InputField label="Nombre de usuario" value={reg.username} onChange={v => setReg({ ...reg, username: v.toLowerCase().replace(/\s/g, '') })}
                        placeholder="usuario.unico" required icon={<User size={13} />}
                        hint="Solo letras minúsculas, números y puntos." />
                      <div className="grid grid-cols-2 gap-2.5">
                        <InputField label="Contraseña" type="password" value={reg.password} onChange={v => setReg({ ...reg, password: v })}
                          placeholder="Mín. 6 caracteres" required icon={<Lock size={13} />} />
                        <InputField label="Confirmar" type="password" value={reg.confirmPassword} onChange={v => setReg({ ...reg, confirmPassword: v })}
                          placeholder="Repite" required icon={<Lock size={13} />} />
                      </div>
                    </div>

                    {regError && (
                      <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-3 py-2.5 text-xs">
                        <AlertCircle size={13} className="flex-shrink-0 mt-0.5" /><span>{regError}</span>
                      </div>
                    )}

                    <button type="submit" disabled={regLoading}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2">
                      {regLoading ? (
                        <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Registrando...</>
                      ) : (
                        <><UserPlus size={14} /> Crear mi cuenta</>
                      )}
                    </button>

                    <p className="text-xs text-gray-400 text-center">
                      Al registrarte aceptas los términos del servicio.
                    </p>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <p className="text-white/30 text-xs mt-5">© 2026 TallerPro — Sistema de Gestión Automotriz</p>
    </div>
  );
}