import React, { useState } from 'react';
import {
  Database, Copy, CheckCircle, AlertCircle, Info, BookOpen,
  Layers, Code2, Zap, GitBranch, Package, ClipboardList,
  DollarSign, CalendarDays, ChevronRight, ChevronDown,
  FileJson, Cpu, ExternalLink, ArrowRight, Shield,
  Users, Car, Wrench, Receipt, BarChart3, Bell
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function useCopy(text: string) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return { copy, copied };
}

function CopyBtn({ text }: { text: string }) {
  const { copy, copied } = useCopy(text);
  return (
    <button onClick={copy}
      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all ${
        copied ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
      }`}>
      {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
      {copied ? 'Copiado' : 'Copiar'}
    </button>
  );
}

function CodeBlock({ code, lang = 'json' }: { code: string; lang?: string }) {
  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-700">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800">
        <span className="text-xs font-mono text-slate-400">{lang}</span>
        <CopyBtn text={code} />
      </div>
      <pre className="bg-slate-900 text-slate-200 p-4 overflow-x-auto text-xs font-mono leading-relaxed max-h-[500px] overflow-y-auto">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function Section({ title, icon, color = 'bg-slate-700', children }: {
  title: string; icon: React.ReactNode; color?: string; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center text-white`}>{icon}</div>
          <h3 className="font-bold text-slate-800">{title}</h3>
        </div>
        {open ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
      </button>
      {open && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

type Tab = 'firma' | 'json' | 'oe' | 'sql' | 'herramientas';

// ─── JSON Schema completo ─────────────────────────────────────────────────────
const SCHEMA_JSON = `{
  "sistema": "TallerPro DMS",
  "version": "1.0.0",
  "descripcion": "Sistema de Gestión de Taller Automotriz",
  "patron_bd": "Tabla por Subclase (Table Per Subclass)",
  "arquitectura": "React 18 + TypeScript + Tailwind CSS + Supabase (PostgreSQL) + Hono",

  "enumeraciones": {
    "Rol": ["administrador", "asesor", "mecanico", "jefe_taller", "cliente"],
    "EstadoOrden": [
      "registrada", "en_diagnostico", "esperando_aprobacion",
      "en_reparacion", "liquidacion_diagnostico",
      "control_calidad", "liberada", "finalizada", "cancelada"
    ],
    "EstadoCita": ["pendiente", "confirmada", "en_progreso", "completada", "cancelada"],
    "TipoMovimientoKardex": ["entrada", "salida", "reserva", "liberacion", "ajuste"],
    "TipoFirma": ["aprobacion_presupuesto", "entrega_vehiculo"],
    "TipoLineaCotizacion": ["repuesto", "mano_de_obra", "diagnostico"],
    "EstadoCotizacion": ["pendiente", "enviada", "aprobada", "rechazada"],
    "EstadoFactura": ["emitida", "pagada"],
    "EstadoPersonal": ["activo", "inactivo", "vacaciones"],
    "NivelFluido": ["bueno", "bajo", "malo"],
    "EstadoTarea": ["pendiente", "en_progreso", "completada"],
    "TipoNotificacion": [
      "stock_bajo", "nueva_cita", "cotizacion_pendiente",
      "qc_rechazado", "pago_recibido", "orden_lista", "repuesto_agotado"
    ]
  },

  "entidades": {
    "usuario": {
      "objetivo": "Transversal",
      "descripcion": "Superclase abstracta. Todos los roles del sistema heredan de esta entidad.",
      "tabla_bd": "usuario",
      "columnas": {
        "id":             { "tipo": "UUID",      "pk": true,  "default": "gen_random_uuid()" },
        "nombre":         { "tipo": "VARCHAR(150)","null": false },
        "ci":             { "tipo": "VARCHAR(20)", "unique": true, "null": true },
        "username":       { "tipo": "VARCHAR(50)", "null": false, "unique": true },
        "password_hash":  { "tipo": "TEXT",       "null": false, "nota": "bcrypt hash, no texto plano" },
        "rol":            { "tipo": "ENUM(Rol)",   "null": false },
        "activo":         { "tipo": "BOOLEAN",    "default": true },
        "email":          { "tipo": "VARCHAR(120)","unique": true, "null": true },
        "telefono":       { "tipo": "VARCHAR(20)", "null": true },
        "fecha_creacion": { "tipo": "TIMESTAMPTZ","default": "NOW()" }
      },
      "subclases": {
        "usuario_asesor":      { "tabla": "usuario_asesor",       "fk": "usuario_id" },
        "usuario_mecanico":    { "tabla": "usuario_mecanico",     "fk": "usuario_id" },
        "usuario_jefe_taller": { "tabla": "usuario_jefe_taller",  "fk": "usuario_id" },
        "usuario_administrador":{ "tabla": "usuario_administrador","fk": "usuario_id" },
        "usuario_cliente":     { "tabla": "usuario_cliente",      "fk": "usuario_id" }
      },
      "metodos": [
        "login(username, password) → JWT",
        "logout() → void",
        "cambiarPassword(oldPass, newPass) → boolean",
        "activar() → void",
        "desactivar() → void"
      ]
    },

    "personal_taller": {
      "objetivo": "Transversal",
      "descripcion": "Perfil profesional del personal del taller. Complementa a usuario para mecánicos, jefes y asesores.",
      "tabla_bd": "personal_taller",
      "columnas": {
        "id":           { "tipo": "UUID",         "pk": true },
        "usuario_id":   { "tipo": "UUID",         "fk": "usuario.id", "null": true },
        "nombre":       { "tipo": "VARCHAR(150)", "null": false },
        "cargo":        { "tipo": "VARCHAR(80)",  "null": false },
        "especialidad": { "tipo": "VARCHAR(120)", "null": false },
        "telefono":     { "tipo": "VARCHAR(20)",  "null": true },
        "email":        { "tipo": "VARCHAR(120)", "null": true },
        "estado":       { "tipo": "ENUM(EstadoPersonal)", "default": "activo" }
      },
      "metodos": [
        "crear(datos) → PersonalTaller",
        "actualizar(id, datos) → PersonalTaller",
        "eliminar(id) → void",
        "listar(filtros?) → PersonalTaller[]"
      ]
    },

    "cliente": {
      "objetivo": "OE1 + OE4",
      "descripcion": "Persona natural o jurídica propietaria de uno o más vehículos. Puede tener cuenta de usuario o ser solo un registro.",
      "tabla_bd": "cliente",
      "columnas": {
        "id":              { "tipo": "UUID",         "pk": true },
        "usuario_id":      { "tipo": "UUID",         "fk": "usuario.id", "null": true, "nota": "NULL si no tiene cuenta digital" },
        "nombre":          { "tipo": "VARCHAR(150)", "null": false },
        "ci":              { "tipo": "VARCHAR(20)",  "null": false, "unique": true },
        "nit":             { "tipo": "VARCHAR(20)",  "null": true, "nota": "Para facturación empresarial" },
        "telefono":        { "tipo": "VARCHAR(20)",  "null": false },
        "email":           { "tipo": "VARCHAR(120)", "null": false },
        "direccion":       { "tipo": "TEXT",         "null": false },
        "activo":          { "tipo": "BOOLEAN",      "default": true, "nota": "Soft-delete" },
        "fecha_registro":  { "tipo": "TIMESTAMPTZ",  "default": "NOW()" },
        "creado_por":      { "tipo": "UUID",         "fk": "usuario.id", "null": true }
      },
      "relaciones": [
        { "tipo": "1:N", "con": "vehiculo",     "via": "vehiculo.cliente_id" },
        { "tipo": "1:N", "con": "cita",         "via": "cita.cliente_id" },
        { "tipo": "1:N", "con": "orden_trabajo","via": "orden_trabajo.cliente_id" },
        { "tipo": "1:N", "con": "factura",      "via": "factura.cliente_id" }
      ],
      "metodos": [
        "registrar(datos) → Cliente",
        "editar(id, datos) → Cliente",
        "desactivar(id) → void  [soft-delete]",
        "buscar(query) → Cliente[]  [por nombre, CI, teléfono]",
        "obtenerHistorialCompleto(clienteId) → { citas[], ordenes[], vehiculos[] }"
      ]
    },

    "vehiculo": {
      "objetivo": "OE1 + OE2",
      "descripcion": "Automóvil registrado a nombre de un cliente. Puede tener múltiples citas y órdenes de trabajo.",
      "tabla_bd": "vehiculo",
      "columnas": {
        "id":             { "tipo": "UUID",         "pk": true },
        "cliente_id":     { "tipo": "UUID",         "fk": "cliente.id", "null": false },
        "placa":          { "tipo": "VARCHAR(15)",  "null": false, "unique": true },
        "marca":          { "tipo": "VARCHAR(50)",  "null": false },
        "modelo":         { "tipo": "VARCHAR(80)",  "null": false },
        "anio":           { "tipo": "SMALLINT",     "null": false },
        "color":          { "tipo": "VARCHAR(40)",  "null": false },
        "chasis":         { "tipo": "VARCHAR(20)",  "null": true, "nota": "VIN (Vehicle Identification Number)" },
        "kilometraje":    { "tipo": "VARCHAR(20)",  "null": true, "nota": "Formato texto (ej: 92,800)" },
        "activo":         { "tipo": "BOOLEAN",      "default": true },
        "creado_por":     { "tipo": "UUID",         "fk": "usuario.id", "null": true },
        "fecha_creacion": { "tipo": "TIMESTAMPTZ",  "default": "NOW()" }
      },
      "relaciones": [
        { "tipo": "N:1", "con": "cliente",           "via": "cliente_id" },
        { "tipo": "1:N", "con": "cita",              "via": "cita.vehiculo_id" },
        { "tipo": "1:N", "con": "orden_trabajo",     "via": "orden_trabajo.vehiculo_id" },
        { "tipo": "1:N", "con": "historial_vehiculo","via": "historial_vehiculo.vehiculo_id" }
      ],
      "metodos": [
        "registrar(datos, clienteId) → Vehiculo",
        "editar(id, datos) → Vehiculo",
        "obtenerHistorial(vehiculoId) → HistorialVehiculoEntry[]",
        "obtenerOrdenesActivas(vehiculoId) → OrdenTrabajo[]"
      ]
    },

    "historial_vehiculo": {
      "objetivo": "OE1",
      "descripcion": "ENTIDAD NUEVA requerida para OE1. Registro trazable de todos los eventos del vehículo: ingreso, diagnóstico, reparación, entrega. Se actualiza automáticamente en cada cambio de estado de la OT.",
      "tabla_bd": "historial_vehiculo",
      "es_nueva": true,
      "columnas": {
        "id":            { "tipo": "UUID",         "pk": true },
        "vehiculo_id":   { "tipo": "UUID",         "fk": "vehiculo.id", "null": false },
        "orden_id":      { "tipo": "UUID",         "fk": "orden_trabajo.id", "null": true },
        "cita_id":       { "tipo": "UUID",         "fk": "cita.id", "null": true },
        "tipo_evento":   { "tipo": "VARCHAR(50)",  "null": false,
                           "ejemplos": ["ingreso_cita","ingreso_taller","inicio_diagnostico","diagnostico_completado","inicio_reparacion","reparacion_completada","control_calidad","entrega","cancelacion"] },
        "descripcion":   { "tipo": "TEXT",         "null": false },
        "km_vehiculo":   { "tipo": "VARCHAR(20)",  "null": true },
        "tecnico_id":    { "tipo": "UUID",         "fk": "usuario.id", "null": true },
        "fecha_evento":  { "tipo": "TIMESTAMPTZ",  "null": false, "default": "NOW()" },
        "metadatos":     { "tipo": "JSONB",        "null": true, "nota": "Datos extra del evento (ej: repuestos usados, notas QC)" }
      ],
      "trigger": "Se inserta automáticamente via trigger PostgreSQL o via API cuando cambia el estado de una OT o cita",
      "metodos": [
        "registrarEvento(vehiculoId, tipoEvento, descripcion, datos?) → HistorialVehiculoEntry",
        "obtenerTimeline(vehiculoId) → HistorialVehiculoEntry[]  [ordenado por fecha_evento ASC]",
        "obtenerUltimoServicio(vehiculoId) → HistorialVehiculoEntry"
      ]
    },

    "cita": {
      "objetivo": "OE1",
      "descripcion": "Reserva de turno del cliente para un servicio. Puede derivar en una Orden de Trabajo.",
      "tabla_bd": "cita",
      "columnas": {
        "id":              { "tipo": "UUID",         "pk": true },
        "cliente_id":      { "tipo": "UUID",         "fk": "cliente.id", "null": false },
        "vehiculo_id":     { "tipo": "UUID",         "fk": "vehiculo.id", "null": false },
        "creado_por":      { "tipo": "UUID",         "fk": "usuario.id", "null": true, "nota": "Puede ser el propio cliente o el asesor" },
        "tipo_servicio":   { "tipo": "VARCHAR(80)",  "null": false },
        "motivo_ingreso":  { "tipo": "VARCHAR(120)", "null": false },
        "fecha":           { "tipo": "DATE",         "null": false },
        "hora":            { "tipo": "TIME",         "null": false },
        "estado":          { "tipo": "ENUM(EstadoCita)", "default": "pendiente" },
        "notas":           { "tipo": "TEXT",         "null": true },
        "orden_id":        { "tipo": "UUID",         "fk": "orden_trabajo.id", "null": true, "nota": "Se llena cuando el asesor abre la OT" },
        "fecha_creacion":  { "tipo": "TIMESTAMPTZ",  "default": "NOW()" },
        "fecha_reprogramacion": { "tipo": "TIMESTAMPTZ", "null": true }
      },
      "reglas_negocio": [
        "El cliente solo puede reprogramar con >= 24 horas de anticipación",
        "El asesor puede confirmar, rechazar o reprogramar en cualquier momento",
        "Solo una cita activa por vehículo a la vez",
        "Al confirmar, se envía notificación al cliente",
        "Al crear la OT desde la cita, estado pasa a en_progreso y se registra en historial_vehiculo"
      ],
      "metodos": [
        "crear(datos, actorId) → Cita",
        "confirmar(citaId, asesorId) → Cita",
        "cancelar(citaId, actorId) → Cita",
        "reprogramar(citaId, nuevaFecha, nuevaHora, actorId) → Cita  [valida regla 24h si actor es cliente]",
        "convertirAOrden(citaId, asesorId) → OrdenTrabajo  [abre la OT y registra historial]",
        "listarPorFecha(fecha) → Cita[]",
        "listarPorCliente(clienteId) → Cita[]"
      ]
    },

    "orden_trabajo": {
      "objetivo": "OE2",
      "descripcion": "Entidad central del sistema. Representa el ciclo de vida completo de un servicio: desde la recepción hasta la entrega del vehículo.",
      "tabla_bd": "orden_trabajo",
      "columnas": {
        "id":                   { "tipo": "UUID",         "pk": true },
        "numero":               { "tipo": "VARCHAR(20)",  "null": false, "unique": true, "default": "OT-YYYY-XXXX (secuencial)" },
        "cliente_id":           { "tipo": "UUID",         "fk": "cliente.id", "null": false },
        "vehiculo_id":          { "tipo": "UUID",         "fk": "vehiculo.id", "null": false },
        "cita_id":              { "tipo": "UUID",         "fk": "cita.id", "null": true },
        "descripcion_problema": { "tipo": "TEXT",         "null": false },
        "mecanico_id":          { "tipo": "UUID",         "fk": "usuario.id", "null": true, "nota": "Mecánico principal" },
        "jefe_asignado_id":     { "tipo": "UUID",         "fk": "usuario.id", "null": true },
        "asignado_por":         { "tipo": "UUID",         "fk": "usuario.id", "null": true },
        "estado":               { "tipo": "ENUM(EstadoOrden)", "null": false, "default": "registrada" },
        "diagnostico":          { "tipo": "TEXT",         "null": true },
        "fallas_adicionales":   { "tipo": "TEXT",         "null": true },
        "reparacion":           { "tipo": "TEXT",         "null": true, "nota": "Resumen de trabajos realizados" },
        "notas_entrega":        { "tipo": "TEXT",         "null": true },
        "entrega_firmada":      { "tipo": "BOOLEAN",      "default": false },
        "pagado_en_linea":      { "tipo": "BOOLEAN",      "default": false },
        "metodo_pago_final":    { "tipo": "VARCHAR(50)",  "null": true },
        "factura_id":           { "tipo": "VARCHAR(20)",  "fk": "factura.numero", "null": true },
        "creado_por":           { "tipo": "UUID",         "fk": "usuario.id", "null": true },
        "modificado_por":       { "tipo": "UUID",         "fk": "usuario.id", "null": true },
        "fecha_creacion":       { "tipo": "TIMESTAMPTZ",  "default": "NOW()" },
        "fecha_actualizacion":  { "tipo": "TIMESTAMPTZ",  "default": "NOW()", "nota": "Trigger ON UPDATE" }
      },
      "tablas_hijas": [
        "orden_mecanicos (N:M → usuario)",
        "orden_foto (fotos de recepción, diagnóstico, reparación)",
        "recepcion_vehiculo (datos al ingreso)",
        "cotizacion + linea_cotizacion",
        "repuesto_usado",
        "repuesto_reservado",
        "control_calidad + qc_tarea_pendiente",
        "tarea_subdividida",
        "firma"
      ],
      "flujo_estados": [
        "registrada → en_diagnostico (jefe asigna mecánico)",
        "en_diagnostico → esperando_aprobacion (mecánico envía cotización)",
        "esperando_aprobacion → en_reparacion (cliente aprueba)",
        "esperando_aprobacion → liquidacion_diagnostico (cliente rechaza)",
        "en_reparacion → control_calidad (mecánico termina)",
        "control_calidad → liberada (jefe aprueba QC)",
        "control_calidad → en_reparacion (jefe rechaza QC)",
        "liberada → finalizada (asesor cobra y entrega)"
      ],
      "metodos": [
        "abrir(clienteId, vehiculoId, descripcion, asesorId) → OrdenTrabajo",
        "asignarMecanico(ordenId, mecanicoId, jefeId) → OrdenTrabajo",
        "iniciarDiagnostico(ordenId, mecanicoId) → OrdenTrabajo",
        "completarDiagnostico(ordenId, diagnostico, fotos[]) → OrdenTrabajo",
        "enviarCotizacion(ordenId) → OrdenTrabajo",
        "aprobarCotizacion(ordenId, clienteId, firma) → OrdenTrabajo",
        "rechazarCotizacion(ordenId, clienteId, motivo, firma) → OrdenTrabajo",
        "completarReparacion(ordenId, detalle, fotos[]) → OrdenTrabajo",
        "realizarControlCalidad(ordenId, resultado, observaciones, jefeId) → OrdenTrabajo",
        "liberarVehiculo(ordenId, jefeId) → OrdenTrabajo",
        "finalizarYEntregar(ordenId, metodoPago, asesorId, firma) → { OrdenTrabajo, Factura }",
        "cancelar(ordenId, motivo, actorId) → OrdenTrabajo"
      ]
    },

    "recepcion_vehiculo": {
      "objetivo": "OE2 + OE1",
      "descripcion": "Checklist de estado del vehículo al momento del ingreso al taller. Relación 1:1 con orden_trabajo.",
      "tabla_bd": "recepcion_vehiculo",
      "columnas": {
        "id":                   { "tipo": "UUID",       "pk": true },
        "orden_id":             { "tipo": "UUID",       "fk": "orden_trabajo.id", "null": false, "unique": true },
        "kilometraje":          { "tipo": "VARCHAR(20)","null": false },
        "nivel_combustible":    { "tipo": "SMALLINT",   "null": false, "rango": "0-4" },
        "aceite":               { "tipo": "ENUM(NivelFluido)", "null": false },
        "refrigerante":         { "tipo": "ENUM(NivelFluido)", "null": false },
        "frenos":               { "tipo": "ENUM(NivelFluido)", "null": false },
        "daños_preexistentes":  { "tipo": "TEXT",       "null": true },
        "inventario":           { "tipo": "TEXT",       "null": true, "nota": "Objetos dentro del vehículo" }
      },
      "tabla_relacionada": "orden_foto WHERE tipo = 'recepcion'"
    },

    "firma": {
      "objetivo": "OE2 + OE4",
      "descripcion": "Firma digital capturada en pantalla táctil o mouse. Prueba de aprobación de presupuesto o de entrega del vehículo. EN EL CÓDIGO ES UN ARRAY DENTRO DE OrdenTrabajo (firmas[]). EN LA BD ES UNA TABLA SEPARADA con FK a orden_trabajo.",
      "tabla_bd": "firma",
      "columnas": {
        "id":         { "tipo": "UUID",         "pk": true },
        "orden_id":   { "tipo": "UUID",         "fk": "orden_trabajo.id", "null": false },
        "tipo":       { "tipo": "ENUM(TipoFirma)", "null": false },
        "data_url":   { "tipo": "TEXT",         "null": false, "nota": "Base64 PNG o URL a Supabase Storage" },
        "fecha":      { "tipo": "TIMESTAMPTZ",  "default": "NOW()" },
        "usuario_id": { "tipo": "UUID",         "fk": "usuario.id", "null": true }
      },
      "nota_importante": "En TypeScript el campo es firmas?: Firma[] DENTRO de OrdenTrabajo. Esto se llama 'embebido' porque en el modelo de datos mock vive DENTRO del objeto orden. En PostgreSQL/Supabase esto se convierte en una tabla separada firma con FK orden_id.",
      "metodos": [
        "capturar(ordenId, tipo, dataUrl, usuarioId) → Firma",
        "obtenerPorOrden(ordenId) → Firma[]",
        "obtenerAprobacionPresupuesto(ordenId) → Firma | null",
        "obtenerFirmaEntrega(ordenId) → Firma | null"
      ]
    },

    "cotizacion": {
      "objetivo": "OE2 + OE4",
      "descripcion": "Presupuesto generado por el mecánico. Contiene las líneas de repuestos y mano de obra. El cliente la aprueba o rechaza. Relación 1:1 con orden_trabajo.",
      "tabla_bd": "cotizacion",
      "columnas": {
        "id":               { "tipo": "UUID",        "pk": true },
        "orden_id":         { "tipo": "UUID",        "fk": "orden_trabajo.id", "null": false, "unique": true },
        "estado":           { "tipo": "ENUM(EstadoCotizacion)", "default": "pendiente" },
        "motivo_rechazo":   { "tipo": "TEXT",        "null": true },
        "metodo_pago":      { "tipo": "VARCHAR(50)", "null": true },
        "costo_diagnostico":{ "tipo": "NUMERIC(10,2)", "default": 0 },
        "fecha_envio":      { "tipo": "TIMESTAMPTZ", "null": true },
        "fecha_respuesta":  { "tipo": "TIMESTAMPTZ", "null": true },
        "firma_cliente_url":{ "tipo": "TEXT",        "null": true }
      },
      "metodos": [
        "crear(ordenId, lineas[], costoDiagnostico) → Cotizacion",
        "enviarAlCliente(cotizacionId) → Cotizacion",
        "aprobar(cotizacionId, clienteId, firma) → Cotizacion",
        "rechazar(cotizacionId, clienteId, motivo, firma) → Cotizacion",
        "calcularTotal() → { subtotal, iva, total }"
      ]
    },

    "linea_cotizacion": {
      "objetivo": "OE2 + OE3",
      "descripcion": "Ítem individual de una cotización: puede ser un repuesto, mano de obra o costo de diagnóstico.",
      "tabla_bd": "linea_cotizacion",
      "columnas": {
        "id":              { "tipo": "UUID",         "pk": true },
        "cotizacion_id":   { "tipo": "UUID",         "fk": "cotizacion.id", "null": false },
        "tipo":            { "tipo": "ENUM(TipoLineaCotizacion)", "null": false },
        "descripcion":     { "tipo": "VARCHAR(200)", "null": false },
        "cantidad":        { "tipo": "NUMERIC(10,2)", "null": false },
        "precio_unitario": { "tipo": "NUMERIC(10,2)", "null": false },
        "aprobado":        { "tipo": "BOOLEAN",      "null": true },
        "rechazado":       { "tipo": "BOOLEAN",      "null": true },
        "motivo_rechazo":  { "tipo": "TEXT",         "null": true }
      }
    },

    "repuesto": {
      "objetivo": "OE3",
      "descripcion": "Pieza o insumo del inventario. Tiene control de stock disponible y reservado.",
      "tabla_bd": "repuesto",
      "columnas": {
        "id":                  { "tipo": "UUID",         "pk": true },
        "nombre":              { "tipo": "VARCHAR(150)", "null": false },
        "categoria":           { "tipo": "VARCHAR(50)",  "null": false },
        "cantidad":            { "tipo": "INTEGER",      "null": false, "default": 0, "check": ">= 0" },
        "cantidad_reservada":  { "tipo": "INTEGER",      "null": false, "default": 0, "check": ">= 0" },
        "costo":               { "tipo": "NUMERIC(10,2)", "null": false },
        "margen_ganancia":     { "tipo": "NUMERIC(5,4)", "null": false, "nota": "Ej: 0.40 = 40%" },
        "precio":              { "tipo": "NUMERIC(10,2)", "null": false },
        "stock_minimo":        { "tipo": "INTEGER",      "null": false, "default": 5 },
        "proveedor_id":        { "tipo": "UUID",         "fk": "proveedor.id", "null": true },
        "imagen_url":          { "tipo": "TEXT",         "null": true }
      },
      "propiedad_calculada": "cantidad_disponible = cantidad - cantidad_reservada",
      "reglas_negocio": [
        "Si cantidad <= stock_minimo: disparar notificacion tipo stock_bajo",
        "No se puede reservar más de cantidad_disponible",
        "Al finalizar OT: mover de reservado a descontado del inventario"
      ],
      "metodos": [
        "crear(datos) → Repuesto",
        "actualizar(id, datos) → Repuesto",
        "agregarStock(id, cantidad, costo?, proveedorId?) → Repuesto  [registra entrada en kardex]",
        "reservar(id, cantidad, ordenId) → boolean  [cantidad_reservada += cantidad]",
        "liberarReserva(id, cantidad, ordenId) → void  [cantidad_reservada -= cantidad]",
        "descontarStock(id, cantidad, ordenId) → boolean  [cantidad -= cantidad, registra salida en kardex]",
        "verificarStockBajo() → Repuesto[]",
        "listarPorCategoria(categoria) → Repuesto[]"
      ]
    },

    "proveedor": {
      "objetivo": "OE3",
      "tabla_bd": "proveedor",
      "columnas": {
        "id":       { "tipo": "UUID",         "pk": true },
        "nombre":   { "tipo": "VARCHAR(150)", "null": false },
        "contacto": { "tipo": "VARCHAR(100)", "null": true },
        "telefono": { "tipo": "VARCHAR(20)",  "null": false },
        "email":    { "tipo": "VARCHAR(120)", "null": false },
        "productos":{ "tipo": "TEXT",         "null": true },
        "activo":   { "tipo": "BOOLEAN",      "default": true }
      }
    },

    "movimiento_kardex": {
      "objetivo": "OE3",
      "descripcion": "Registro histórico de todos los movimientos de inventario. Proporciona trazabilidad completa del stock.",
      "tabla_bd": "movimiento_kardex",
      "columnas": {
        "id":               { "tipo": "UUID",         "pk": true },
        "repuesto_id":      { "tipo": "UUID",         "fk": "repuesto.id", "null": false },
        "repuesto_nombre":  { "tipo": "VARCHAR(150)", "null": false, "nota": "Desnormalizado para histórico inmutable" },
        "tipo":             { "tipo": "ENUM(TipoMovimientoKardex)", "null": false },
        "cantidad":         { "tipo": "INTEGER",      "null": false },
        "stock_resultante": { "tipo": "INTEGER",      "null": false },
        "fecha":            { "tipo": "TIMESTAMPTZ",  "default": "NOW()" },
        "usuario_id":       { "tipo": "UUID",         "fk": "usuario.id", "null": false },
        "usuario_nombre":   { "tipo": "VARCHAR(150)", "null": false, "nota": "Desnormalizado" },
        "orden_id":         { "tipo": "UUID",         "fk": "orden_trabajo.id", "null": true },
        "proveedor_id":     { "tipo": "UUID",         "fk": "proveedor.id", "null": true },
        "costo":            { "tipo": "NUMERIC(10,2)", "null": true },
        "precio_venta":     { "tipo": "NUMERIC(10,2)", "null": true },
        "observaciones":    { "tipo": "TEXT",         "null": true }
      }
    },

    "factura": {
      "objetivo": "OE4",
      "descripcion": "Documento fiscal generado al finalizar la OT. Incluye IVA del 12%. Puede ser impresa en PDF.",
      "tabla_bd": "factura",
      "columnas": {
        "numero":       { "tipo": "VARCHAR(20)",  "pk": true, "formato": "FAC-YYYY-XXXX" },
        "fecha":        { "tipo": "TIMESTAMPTZ",  "default": "NOW()" },
        "orden_id":     { "tipo": "UUID",         "fk": "orden_trabajo.id", "null": false },
        "cliente_id":   { "tipo": "UUID",         "fk": "cliente.id", "null": false },
        "subtotal":     { "tipo": "NUMERIC(10,2)", "null": false },
        "impuesto":     { "tipo": "NUMERIC(10,2)", "null": false, "nota": "IVA 12%" },
        "total":        { "tipo": "NUMERIC(10,2)", "null": false },
        "metodo_pago":  { "tipo": "VARCHAR(50)",  "null": false },
        "estado":       { "tipo": "ENUM(EstadoFactura)", "default": "emitida" },
        "pdf_url":      { "tipo": "TEXT",         "null": true }
      },
      "metodos": [
        "generar(ordenId, metodoPago) → Factura",
        "marcarPagada(numero) → Factura",
        "generarPDF(numero) → string (URL)",
        "listarPorCliente(clienteId) → Factura[]",
        "calcularIngresosMes(anio, mes) → number"
      ]
    },

    "log_auditoria": {
      "objetivo": "OE4 (seguridad y trazabilidad)",
      "tabla_bd": "log_auditoria",
      "columnas": {
        "id":              { "tipo": "UUID",         "pk": true },
        "fecha":           { "tipo": "TIMESTAMPTZ",  "default": "NOW()" },
        "usuario_id":      { "tipo": "UUID",         "fk": "usuario.id", "null": false },
        "usuario_nombre":  { "tipo": "VARCHAR(150)", "null": false },
        "accion":          { "tipo": "VARCHAR(80)",  "null": false, "ejemplos": ["LOGIN","LOGOUT","CREAR_OT","CREAR_CITA","APROBAR_COTIZACION","GENERAR_FACTURA"] },
        "modulo":          { "tipo": "VARCHAR(50)",  "null": false },
        "detalles":        { "tipo": "TEXT",         "null": false },
        "entidad_id":      { "tipo": "VARCHAR(50)",  "null": true },
        "entidad_tipo":    { "tipo": "VARCHAR(50)",  "null": true }
      }
    },

    "notificacion": {
      "objetivo": "Transversal",
      "tabla_bd": "notificacion + notificacion_rol",
      "columnas": {
        "id":               { "tipo": "UUID",        "pk": true },
        "fecha":            { "tipo": "TIMESTAMPTZ", "default": "NOW()" },
        "tipo":             { "tipo": "ENUM(TipoNotificacion)", "null": false },
        "titulo":           { "tipo": "VARCHAR(150)","null": false },
        "mensaje":          { "tipo": "TEXT",        "null": false },
        "leida":            { "tipo": "BOOLEAN",     "default": false },
        "para_usuario_id":  { "tipo": "UUID",        "fk": "usuario.id", "null": true },
        "referencia_id":    { "tipo": "VARCHAR(50)", "null": true },
        "referencia_tipo":  { "tipo": "VARCHAR(50)", "null": true }
      },
      "tabla_roles": {
        "nombre": "notificacion_rol",
        "columnas": {
          "notificacion_id": { "fk": "notificacion.id" },
          "rol":             { "tipo": "ENUM(Rol)" }
        }
      }
    },

    "control_calidad": {
      "objetivo": "OE2",
      "tabla_bd": "control_calidad",
      "columnas": {
        "id":            { "tipo": "UUID",    "pk": true },
        "orden_id":      { "tipo": "UUID",    "fk": "orden_trabajo.id", "unique": true },
        "aprobado":      { "tipo": "BOOLEAN", "null": false },
        "observaciones": { "tipo": "TEXT",    "null": false },
        "prueba_ruta":   { "tipo": "BOOLEAN", "null": false },
        "responsable_id":{ "tipo": "UUID",    "fk": "usuario.id" },
        "fecha_revision":{ "tipo": "TIMESTAMPTZ" }
      },
      "tabla_relacionada": "qc_tarea_pendiente (id, control_calidad_id FK, descripcion)"
    },

    "tarea_subdividida": {
      "objetivo": "OE2",
      "tabla_bd": "tarea_subdividida",
      "columnas": {
        "id":                  { "tipo": "UUID",       "pk": true },
        "orden_id":            { "tipo": "UUID",       "fk": "orden_trabajo.id" },
        "descripcion":         { "tipo": "TEXT",       "null": false },
        "mecanico_asignado_id":{ "tipo": "UUID",       "fk": "usuario.id", "null": true },
        "estado":              { "tipo": "ENUM(EstadoTarea)", "default": "pendiente" },
        "orden_num":           { "tipo": "SMALLINT",  "null": false },
        "notas":               { "tipo": "TEXT",       "null": true },
        "estimado_horas":      { "tipo": "NUMERIC(5,2)", "null": true },
        "fecha_inicio":        { "tipo": "TIMESTAMPTZ", "null": true },
        "fecha_fin":           { "tipo": "TIMESTAMPTZ", "null": true }
      }
    }
  },

  "tablas_intermedias": [
    {
      "tabla": "orden_mecanico",
      "descripcion": "Relación N:M entre orden_trabajo y usuario (mecánicos)",
      "columnas": {
        "orden_id":    { "fk": "orden_trabajo.id" },
        "mecanico_id": { "fk": "usuario.id" }
      }
    },
    {
      "tabla": "orden_foto",
      "descripcion": "Fotos del vehículo en diferentes etapas",
      "columnas": {
        "id":       { "tipo": "UUID", "pk": true },
        "orden_id": { "fk": "orden_trabajo.id" },
        "tipo":     { "tipo": "ENUM", "valores": ["recepcion","diagnostico","reparacion"] },
        "url":      { "tipo": "TEXT", "nota": "URL en Supabase Storage" },
        "fecha":    { "tipo": "TIMESTAMPTZ" }
      }
    },
    {
      "tabla": "repuesto_usado",
      "descripcion": "Repuestos efectivamente usados en la reparación (post-aprobación)",
      "columnas": {
        "id":          { "tipo": "UUID", "pk": true },
        "orden_id":    { "fk": "orden_trabajo.id" },
        "repuesto_id": { "fk": "repuesto.id" },
        "nombre":      { "tipo": "VARCHAR(150)", "nota": "Desnormalizado" },
        "cantidad":    { "tipo": "INTEGER" },
        "precio":      { "tipo": "NUMERIC(10,2)" }
      }
    },
    {
      "tabla": "repuesto_reservado",
      "descripcion": "Repuestos reservados durante la cotización (pre-aprobación)",
      "columnas": {
        "id":          { "tipo": "UUID", "pk": true },
        "orden_id":    { "fk": "orden_trabajo.id" },
        "repuesto_id": { "fk": "repuesto.id" },
        "nombre":      { "tipo": "VARCHAR(150)" },
        "cantidad":    { "tipo": "INTEGER" },
        "precio":      { "tipo": "NUMERIC(10,2)" }
      }
    }
  ],

  "conexion_supabase": {
    "estado_actual": "Conectado — solo KV Store genérico",
    "archivos_configurados": {
      "/utils/supabase/info.tsx": "projectId + publicAnonKey del proyecto",
      "/supabase/functions/server/index.tsx": "Servidor Hono con CORS habilitado",
      "/supabase/functions/server/kv_store.tsx": "Funciones genéricas de tabla clave-valor"
    },
    "que_usa_ahora": "Una sola tabla kv_store_7f295475 con columnas (key, value TEXT). El frontend React con datos mock NO usa Supabase — trabaja 100% en memoria.",
    "que_falta_para_funcional": [
      "1. Ejecutar DDL SQL para crear las 20+ tablas en Supabase",
      "2. Agregar rutas API en index.tsx para cada entidad (GET, POST, PUT, DELETE)",
      "3. Configurar RLS (Row Level Security) con policies por rol",
      "4. Reemplazar useState mock en AppContext.tsx por fetch() a las rutas API",
      "5. Migrar auth a supabase.auth.signInWithPassword()",
      "6. Subir fotos a Supabase Storage en vez de base64"
    ]
  }
}`;

// ─── SQL Schema ────────────────────────────────────────────────────────────────
const SQL_DDL = `-- ════════════════════════════════════════════════════════════════
-- TallerPro DMS — Script DDL PostgreSQL (Supabase)
-- Patrón: Tabla por Subclase
-- ════════════════════════════════════════════════════════════════

-- ENUMERACIONES
CREATE TYPE rol_enum AS ENUM ('administrador','asesor','mecanico','jefe_taller','cliente');
CREATE TYPE estado_orden_enum AS ENUM ('registrada','en_diagnostico','esperando_aprobacion','en_reparacion','liquidacion_diagnostico','control_calidad','liberada','finalizada','cancelada');
CREATE TYPE estado_cita_enum AS ENUM ('pendiente','confirmada','en_progreso','completada','cancelada');
CREATE TYPE tipo_firma_enum AS ENUM ('aprobacion_presupuesto','entrega_vehiculo');
CREATE TYPE tipo_linea_enum AS ENUM ('repuesto','mano_de_obra','diagnostico');
CREATE TYPE estado_cotizacion_enum AS ENUM ('pendiente','enviada','aprobada','rechazada');
CREATE TYPE estado_factura_enum AS ENUM ('emitida','pagada');
CREATE TYPE nivel_fluido_enum AS ENUM ('bueno','bajo','malo');
CREATE TYPE tipo_kardex_enum AS ENUM ('entrada','salida','reserva','liberacion','ajuste');
CREATE TYPE estado_personal_enum AS ENUM ('activo','inactivo','vacaciones');
CREATE TYPE estado_tarea_enum AS ENUM ('pendiente','en_progreso','completada');
CREATE TYPE tipo_notificacion_enum AS ENUM ('stock_bajo','nueva_cita','cotizacion_pendiente','qc_rechazado','pago_recibido','orden_lista','repuesto_agotado');
CREATE TYPE tipo_foto_enum AS ENUM ('recepcion','diagnostico','reparacion');

-- ── SUPERCLASE ──────────────────────────────────────────────────
CREATE TABLE usuario (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre         VARCHAR(150) NOT NULL,
  ci             VARCHAR(20) UNIQUE,
  username       VARCHAR(50) NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  rol            rol_enum NOT NULL,
  activo         BOOLEAN NOT NULL DEFAULT TRUE,
  email          VARCHAR(120) UNIQUE,
  telefono       VARCHAR(20),
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subclases (herencia — solo atributos extra)
CREATE TABLE usuario_mecanico (
  usuario_id    UUID PRIMARY KEY REFERENCES usuario(id) ON DELETE CASCADE,
  especialidad  VARCHAR(120),
  nivel         VARCHAR(50) -- Junior, Senior, Especialista
);

-- ── PERSONAL DEL TALLER ─────────────────────────────────────────
CREATE TABLE personal_taller (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id   UUID REFERENCES usuario(id),
  nombre       VARCHAR(150) NOT NULL,
  cargo        VARCHAR(80) NOT NULL,
  especialidad VARCHAR(120) NOT NULL,
  telefono     VARCHAR(20),
  email        VARCHAR(120),
  estado       estado_personal_enum NOT NULL DEFAULT 'activo'
);

-- ── OE1: CLIENTES, VEHÍCULOS, CITAS ─────────────────────────────
CREATE TABLE cliente (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id     UUID REFERENCES usuario(id),
  nombre         VARCHAR(150) NOT NULL,
  ci             VARCHAR(20) NOT NULL UNIQUE,
  nit            VARCHAR(20),
  telefono       VARCHAR(20) NOT NULL,
  email          VARCHAR(120) NOT NULL,
  direccion      TEXT NOT NULL,
  activo         BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  creado_por     UUID REFERENCES usuario(id)
);

CREATE TABLE vehiculo (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id     UUID NOT NULL REFERENCES cliente(id),
  placa          VARCHAR(15) NOT NULL UNIQUE,
  marca          VARCHAR(50) NOT NULL,
  modelo         VARCHAR(80) NOT NULL,
  anio           SMALLINT NOT NULL,
  color          VARCHAR(40) NOT NULL,
  chasis         VARCHAR(20),
  kilometraje    VARCHAR(20),
  activo         BOOLEAN NOT NULL DEFAULT TRUE,
  creado_por     UUID REFERENCES usuario(id),
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE cita (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id           UUID NOT NULL REFERENCES cliente(id),
  vehiculo_id          UUID NOT NULL REFERENCES vehiculo(id),
  creado_por           UUID REFERENCES usuario(id),
  tipo_servicio        VARCHAR(80) NOT NULL,
  motivo_ingreso       VARCHAR(120) NOT NULL,
  fecha                DATE NOT NULL,
  hora                 TIME NOT NULL,
  estado               estado_cita_enum NOT NULL DEFAULT 'pendiente',
  notas                TEXT,
  orden_id             UUID, -- FK circular, se añade después
  fecha_creacion       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_reprogramacion TIMESTAMPTZ
);

-- HISTORIAL DEL VEHÍCULO (NUEVA ENTIDAD para OE1)
CREATE TABLE historial_vehiculo (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehiculo_id   UUID NOT NULL REFERENCES vehiculo(id),
  orden_id      UUID, -- FK circular
  cita_id       UUID REFERENCES cita(id),
  tipo_evento   VARCHAR(50) NOT NULL,
  descripcion   TEXT NOT NULL,
  km_vehiculo   VARCHAR(20),
  tecnico_id    UUID REFERENCES usuario(id),
  fecha_evento  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadatos     JSONB
);

-- ── OE2: ÓRDENES DE TRABAJO ──────────────────────────────────────
CREATE TABLE orden_trabajo (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero                VARCHAR(20) NOT NULL UNIQUE,
  cliente_id            UUID NOT NULL REFERENCES cliente(id),
  vehiculo_id           UUID NOT NULL REFERENCES vehiculo(id),
  cita_id               UUID REFERENCES cita(id),
  descripcion_problema  TEXT NOT NULL,
  mecanico_id           UUID REFERENCES usuario(id),
  jefe_asignado_id      UUID REFERENCES usuario(id),
  asignado_por          UUID REFERENCES usuario(id),
  estado                estado_orden_enum NOT NULL DEFAULT 'registrada',
  diagnostico           TEXT,
  fallas_adicionales    TEXT,
  reparacion            TEXT,
  notas_entrega         TEXT,
  entrega_firmada       BOOLEAN NOT NULL DEFAULT FALSE,
  pagado_en_linea       BOOLEAN NOT NULL DEFAULT FALSE,
  metodo_pago_final     VARCHAR(50),
  factura_id            VARCHAR(20),
  creado_por            UUID REFERENCES usuario(id),
  modificado_por        UUID REFERENCES usuario(id),
  fecha_creacion        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_actualizacion   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger para actualizar fecha_actualizacion automáticamente
CREATE OR REPLACE FUNCTION update_fecha_actualizacion()
RETURNS TRIGGER AS $$ BEGIN NEW.fecha_actualizacion = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_orden_update BEFORE UPDATE ON orden_trabajo
  FOR EACH ROW EXECUTE FUNCTION update_fecha_actualizacion();

-- FK circular ahora que orden_trabajo existe
ALTER TABLE cita ADD CONSTRAINT fk_cita_orden FOREIGN KEY (orden_id) REFERENCES orden_trabajo(id);
ALTER TABLE historial_vehiculo ADD CONSTRAINT fk_historial_orden FOREIGN KEY (orden_id) REFERENCES orden_trabajo(id);

CREATE TABLE orden_mecanico (
  orden_id    UUID NOT NULL REFERENCES orden_trabajo(id) ON DELETE CASCADE,
  mecanico_id UUID NOT NULL REFERENCES usuario(id),
  PRIMARY KEY (orden_id, mecanico_id)
);

CREATE TABLE orden_foto (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id  UUID NOT NULL REFERENCES orden_trabajo(id) ON DELETE CASCADE,
  tipo      tipo_foto_enum NOT NULL,
  url       TEXT NOT NULL,
  fecha     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE recepcion_vehiculo (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id            UUID NOT NULL REFERENCES orden_trabajo(id) UNIQUE,
  kilometraje         VARCHAR(20) NOT NULL,
  nivel_combustible   SMALLINT NOT NULL CHECK (nivel_combustible BETWEEN 0 AND 4),
  aceite              nivel_fluido_enum NOT NULL,
  refrigerante        nivel_fluido_enum NOT NULL,
  frenos              nivel_fluido_enum NOT NULL,
  daños_preexistentes TEXT,
  inventario          TEXT
);

CREATE TABLE cotizacion (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id          UUID NOT NULL REFERENCES orden_trabajo(id) UNIQUE,
  estado            estado_cotizacion_enum NOT NULL DEFAULT 'pendiente',
  motivo_rechazo    TEXT,
  metodo_pago       VARCHAR(50),
  costo_diagnostico NUMERIC(10,2) NOT NULL DEFAULT 0,
  fecha_envio       TIMESTAMPTZ,
  fecha_respuesta   TIMESTAMPTZ,
  firma_cliente_url TEXT
);

CREATE TABLE linea_cotizacion (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cotizacion_id   UUID NOT NULL REFERENCES cotizacion(id) ON DELETE CASCADE,
  tipo            tipo_linea_enum NOT NULL,
  descripcion     VARCHAR(200) NOT NULL,
  cantidad        NUMERIC(10,2) NOT NULL,
  precio_unitario NUMERIC(10,2) NOT NULL,
  aprobado        BOOLEAN,
  rechazado       BOOLEAN,
  motivo_rechazo  TEXT
);

CREATE TABLE repuesto_usado (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id     UUID NOT NULL REFERENCES orden_trabajo(id) ON DELETE CASCADE,
  repuesto_id  UUID NOT NULL REFERENCES repuesto(id),
  nombre       VARCHAR(150) NOT NULL,
  cantidad     INTEGER NOT NULL,
  precio       NUMERIC(10,2) NOT NULL
);

CREATE TABLE repuesto_reservado (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id     UUID NOT NULL REFERENCES orden_trabajo(id) ON DELETE CASCADE,
  repuesto_id  UUID NOT NULL REFERENCES repuesto(id),
  nombre       VARCHAR(150) NOT NULL,
  cantidad     INTEGER NOT NULL,
  precio       NUMERIC(10,2) NOT NULL
);

CREATE TABLE control_calidad (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id       UUID NOT NULL REFERENCES orden_trabajo(id) UNIQUE,
  aprobado       BOOLEAN NOT NULL,
  observaciones  TEXT NOT NULL,
  prueba_ruta    BOOLEAN NOT NULL,
  responsable_id UUID REFERENCES usuario(id),
  fecha_revision TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE qc_tarea_pendiente (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  control_calidad_id UUID NOT NULL REFERENCES control_calidad(id) ON DELETE CASCADE,
  descripcion       TEXT NOT NULL
);

CREATE TABLE tarea_subdividida (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id             UUID NOT NULL REFERENCES orden_trabajo(id) ON DELETE CASCADE,
  descripcion          TEXT NOT NULL,
  mecanico_asignado_id UUID REFERENCES usuario(id),
  estado               estado_tarea_enum NOT NULL DEFAULT 'pendiente',
  orden_num            SMALLINT NOT NULL,
  notas                TEXT,
  estimado_horas       NUMERIC(5,2),
  fecha_inicio         TIMESTAMPTZ,
  fecha_fin            TIMESTAMPTZ
);

-- ★ FIRMA — tabla separada (no embebida) en la BD
CREATE TABLE firma (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id   UUID NOT NULL REFERENCES orden_trabajo(id) ON DELETE CASCADE,
  tipo       tipo_firma_enum NOT NULL,
  data_url   TEXT NOT NULL,  -- base64 o URL a Supabase Storage
  fecha      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  usuario_id UUID REFERENCES usuario(id)
);

-- ── OE3: INVENTARIO ──────────────────────────────────────────────
CREATE TABLE proveedor (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre   VARCHAR(150) NOT NULL,
  contacto VARCHAR(100),
  telefono VARCHAR(20) NOT NULL,
  email    VARCHAR(120) NOT NULL,
  productos TEXT,
  activo   BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE repuesto (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre             VARCHAR(150) NOT NULL,
  categoria          VARCHAR(50) NOT NULL,
  cantidad           INTEGER NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
  cantidad_reservada INTEGER NOT NULL DEFAULT 0 CHECK (cantidad_reservada >= 0),
  costo              NUMERIC(10,2) NOT NULL,
  margen_ganancia    NUMERIC(5,4) NOT NULL,
  precio             NUMERIC(10,2) NOT NULL,
  stock_minimo       INTEGER NOT NULL DEFAULT 5,
  proveedor_id       UUID REFERENCES proveedor(id),
  imagen_url         TEXT,
  CONSTRAINT chk_reserva CHECK (cantidad_reservada <= cantidad)
);

CREATE TABLE movimiento_kardex (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repuesto_id      UUID NOT NULL REFERENCES repuesto(id),
  repuesto_nombre  VARCHAR(150) NOT NULL,
  tipo             tipo_kardex_enum NOT NULL,
  cantidad         INTEGER NOT NULL,
  stock_resultante INTEGER NOT NULL,
  fecha            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  usuario_id       UUID NOT NULL REFERENCES usuario(id),
  usuario_nombre   VARCHAR(150) NOT NULL,
  orden_id         UUID REFERENCES orden_trabajo(id),
  proveedor_id     UUID REFERENCES proveedor(id),
  costo            NUMERIC(10,2),
  precio_venta     NUMERIC(10,2),
  observaciones    TEXT
);

-- ── OE4: PAGOS Y REPORTES ────────────────────────────────────────
CREATE TABLE factura (
  numero      VARCHAR(20) PRIMARY KEY,
  fecha       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  orden_id    UUID NOT NULL REFERENCES orden_trabajo(id),
  cliente_id  UUID NOT NULL REFERENCES cliente(id),
  subtotal    NUMERIC(10,2) NOT NULL,
  impuesto    NUMERIC(10,2) NOT NULL,
  total       NUMERIC(10,2) NOT NULL,
  metodo_pago VARCHAR(50) NOT NULL,
  estado      estado_factura_enum NOT NULL DEFAULT 'emitida',
  pdf_url     TEXT
);

CREATE TABLE log_auditoria (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  usuario_id     UUID NOT NULL REFERENCES usuario(id),
  usuario_nombre VARCHAR(150) NOT NULL,
  accion         VARCHAR(80) NOT NULL,
  modulo         VARCHAR(50) NOT NULL,
  detalles       TEXT NOT NULL,
  entidad_id     VARCHAR(50),
  entidad_tipo   VARCHAR(50)
);

CREATE TABLE notificacion (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  tipo             tipo_notificacion_enum NOT NULL,
  titulo           VARCHAR(150) NOT NULL,
  mensaje          TEXT NOT NULL,
  leida            BOOLEAN NOT NULL DEFAULT FALSE,
  para_usuario_id  UUID REFERENCES usuario(id),
  referencia_id    VARCHAR(50),
  referencia_tipo  VARCHAR(50)
);

CREATE TABLE notificacion_rol (
  notificacion_id UUID NOT NULL REFERENCES notificacion(id) ON DELETE CASCADE,
  rol             rol_enum NOT NULL,
  PRIMARY KEY (notificacion_id, rol)
);

-- ── ÍNDICES DE RENDIMIENTO ───────────────────────────────────────
CREATE INDEX idx_orden_cliente   ON orden_trabajo(cliente_id);
CREATE INDEX idx_orden_vehiculo  ON orden_trabajo(vehiculo_id);
CREATE INDEX idx_orden_estado    ON orden_trabajo(estado);
CREATE INDEX idx_orden_mecanico  ON orden_trabajo(mecanico_id);
CREATE INDEX idx_cita_fecha      ON cita(fecha);
CREATE INDEX idx_cita_cliente    ON cita(cliente_id);
CREATE INDEX idx_historial_veh   ON historial_vehiculo(vehiculo_id, fecha_evento DESC);
CREATE INDEX idx_kardex_repuesto ON movimiento_kardex(repuesto_id, fecha DESC);
CREATE INDEX idx_factura_cliente ON factura(cliente_id);`;

// ─── OE Mapping data ──────────────────────────────────────────────────────────
const OE_DATA = [
  {
    id: 'OE1',
    titulo: 'Reserva de Citas e Historial Automotriz',
    color: 'bg-blue-600',
    borderColor: 'border-blue-300',
    bgColor: 'bg-blue-50',
    icon: <CalendarDays size={18} />,
    entidades: ['cliente', 'vehiculo', 'cita', 'historial_vehiculo ★NUEVA'],
    actores: ['Cliente', 'Asesor'],
    funciones: [
      { actor: 'Cliente',  fn: 'Crear cita desde portal (fecha, hora, tipo servicio, motivo)' },
      { actor: 'Asesor',   fn: 'Confirmar, rechazar o reprogramar cita' },
      { actor: 'Cliente',  fn: 'Reprogramar cita con >= 24h de anticipación' },
      { actor: 'Cliente',  fn: 'Cancelar cita' },
      { actor: 'Asesor',   fn: 'Hacer diagnóstico preliminar al recibir el vehículo' },
      { actor: 'Asesor',   fn: 'Abrir Orden de Trabajo desde la cita (convierte cita en OT)' },
      { actor: 'Sistema',  fn: 'Registrar evento en historial_vehiculo al cambiar estado' },
      { actor: 'Sistema',  fn: 'Notificar al cliente en cada cambio de estado' },
      { actor: 'Cliente',  fn: 'Ver timeline/historial completo de su vehículo' },
    ],
    entidadNueva: {
      nombre: 'historial_vehiculo',
      motivo: 'El sistema actual NO tiene una tabla de historial independiente. El historial se infiere de ordenes/citas. Para cumplir OE1 correctamente se debe crear esta tabla que registre cada evento con fecha, tipo, descripción y técnico responsable.',
    }
  },
  {
    id: 'OE2',
    titulo: 'Flujo Completo de Órdenes de Trabajo',
    color: 'bg-indigo-600',
    borderColor: 'border-indigo-300',
    bgColor: 'bg-indigo-50',
    icon: <ClipboardList size={18} />,
    actores: ['Asesor', 'Mecánico', 'Jefe Taller', 'Cliente'],
    entidades: ['orden_trabajo', 'recepcion_vehiculo', 'cotizacion', 'linea_cotizacion', 'repuesto_usado', 'repuesto_reservado', 'tarea_subdividida', 'control_calidad', 'firma'],
    funciones: [
      { actor: 'Asesor',      fn: 'Abrir OT (wizard 3 pasos: cliente → vehículo → problema)' },
      { actor: 'Asesor',      fn: 'Registrar recepción del vehículo (checklist + fotos)' },
      { actor: 'Jefe Taller', fn: 'Asignar mecánico principal y mecánicos auxiliares' },
      { actor: 'Mecánico',    fn: 'Registrar diagnóstico técnico con fotos' },
      { actor: 'Mecánico',    fn: 'Generar cotización (repuestos + mano de obra + diagnóstico)' },
      { actor: 'Sistema',     fn: 'Reservar repuestos en inventario al crear cotización' },
      { actor: 'Cliente',     fn: 'Aprobar o rechazar cotización con firma digital' },
      { actor: 'Mecánico',    fn: 'Ejecutar reparación y registrar fotos de evidencia' },
      { actor: 'Mecánico',    fn: 'Subdividir trabajo en tareas con estimado de horas' },
      { actor: 'Jefe Taller', fn: 'Control de calidad: aprobar o enviar de vuelta a reparación' },
      { actor: 'Asesor',      fn: 'Cobrar, obtener firma de entrega y finalizar OT' },
      { actor: 'Sistema',     fn: 'Generar factura automáticamente al finalizar' },
    ],
    flujoEstados: [
      'registrada', 'en_diagnostico', 'esperando_aprobacion',
      'en_reparacion', 'control_calidad', 'liberada', 'finalizada'
    ]
  },
  {
    id: 'OE3',
    titulo: 'Control de Inventario con Stock Mínimo y Alertas',
    color: 'bg-amber-600',
    borderColor: 'border-amber-300',
    bgColor: 'bg-amber-50',
    icon: <Package size={18} />,
    actores: ['Administrador', 'Mecánico', 'Sistema (automático)'],
    entidades: ['repuesto', 'proveedor', 'movimiento_kardex', 'repuesto_reservado', 'repuesto_usado', 'notificacion'],
    funciones: [
      { actor: 'Admin',    fn: 'CRUD de repuestos con precio de costo, margen y precio de venta' },
      { actor: 'Admin',    fn: 'CRUD de proveedores asociados a repuestos' },
      { actor: 'Admin',    fn: 'Ingresar stock (genera movimiento kardex tipo "entrada")' },
      { actor: 'Sistema',  fn: 'Reservar repuestos al aprobar cotización' },
      { actor: 'Sistema',  fn: 'Liberar reservas si se rechaza cotización o cancela OT' },
      { actor: 'Sistema',  fn: 'Descontar inventario al completar la reparación' },
      { actor: 'Sistema',  fn: 'Disparar alerta si cantidad <= stock_minimo' },
      { actor: 'Mecánico', fn: 'Consultar disponibilidad de repuesto' },
      { actor: 'Mecánico', fn: 'Solicitar compra de repuesto al admin' },
      { actor: 'Admin',    fn: 'Ver kardex completo (entradas, salidas, reservas)' },
    ],
  },
  {
    id: 'OE4',
    titulo: 'Pasarela de Pagos, Facturas PDF y Reportes',
    color: 'bg-emerald-600',
    borderColor: 'border-emerald-300',
    bgColor: 'bg-emerald-50',
    icon: <DollarSign size={18} />,
    actores: ['Asesor', 'Cliente', 'Administrador'],
    entidades: ['factura', 'cotizacion', 'log_auditoria', 'notificacion'],
    funciones: [
      { actor: 'Asesor',   fn: 'Cobrar presencialmente (efectivo, tarjeta, transferencia)' },
      { actor: 'Cliente',  fn: 'Pagar en línea desde el portal antes de retirar el vehículo' },
      { actor: 'Sistema',  fn: 'Generar factura PDF con IVA 12% al finalizar OT' },
      { actor: 'Asesor',   fn: 'Imprimir o enviar factura por email al cliente' },
      { actor: 'Admin',    fn: 'Reportes de ingresos por período, mecánico, tipo de servicio' },
      { actor: 'Admin',    fn: 'Reportes de productividad (OTs completadas por mecánico)' },
      { actor: 'Admin',    fn: 'Reportes de inventario (rotación, valor en stock, stock bajo)' },
      { actor: 'Admin',    fn: 'Log de auditoría completo de todas las acciones del sistema' },
      { actor: 'Cliente',  fn: 'Ver historial de facturas propias en el portal' },
    ],
  },
];

// ─── AI Tools data ─────────────────────────────────────────────────────────────
const AI_TOOLS = [
  {
    nombre: 'ChatGPT (GPT-4o)',
    uso: 'Diagrama de clases UML',
    prompt: 'Pega el JSON completo de entidades y dile: "Genera el código PlantUML para el diagrama de clases UML de este sistema, con herencia, composición y asociaciones según las relaciones definidas."',
    url: 'https://chat.openai.com',
    color: 'bg-green-100 border-green-300',
    icon: '🤖',
    output: 'PlantUML → renderiza en plantuml.com/plantuml/uml',
  },
  {
    nombre: 'Claude (Anthropic)',
    uso: 'Diagrama de clases + ERD',
    prompt: 'Pega el JSON y pide: "Genera el código Mermaid para el diagrama de clases y el ERD de este sistema." Claude es excelente para entender estructuras complejas.',
    url: 'https://claude.ai',
    color: 'bg-orange-100 border-orange-300',
    icon: '🧠',
    output: 'Mermaid → renderiza en mermaid.live',
  },
  {
    nombre: 'dbdiagram.io',
    uso: 'Diagrama de base de datos (ERD)',
    prompt: 'Pega el SQL DDL directamente en su editor. Genera automáticamente el ERD visual con todas las relaciones FK.',
    url: 'https://dbdiagram.io',
    color: 'bg-blue-100 border-blue-300',
    icon: '🗄️',
    output: 'ERD visual interactivo, exportable a PNG/PDF',
  },
  {
    nombre: 'Azimutt',
    uso: 'ERD desde Supabase en vivo',
    prompt: 'Conecta tu proyecto Supabase directamente. Azimutt lee el schema real de la base de datos y genera el ERD automáticamente.',
    url: 'https://azimutt.app',
    color: 'bg-purple-100 border-purple-300',
    icon: '⚡',
    output: 'ERD desde Supabase real (sin copy-paste)',
  },
  {
    nombre: 'draw.io / diagrams.net',
    uso: 'Diagrama de clases manual/importado',
    prompt: 'Usa la plantilla UML. También puedes importar XML generado por ChatGPT o Claude.',
    url: 'https://app.diagrams.net',
    color: 'bg-yellow-100 border-yellow-300',
    icon: '✏️',
    output: 'Editable manualmente, exportable a PNG/SVG/PDF',
  },
];

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function ModeloDatos() {
  const [activeTab, setActiveTab] = useState<Tab>('firma');

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'firma',        label: '¿Qué es Firma?',   icon: <AlertCircle size={15} /> },
    { id: 'json',         label: 'JSON Schema',        icon: <FileJson size={15} /> },
    { id: 'oe',           label: '4 Objetivos',        icon: <BookOpen size={15} /> },
    { id: 'sql',          label: 'SQL / DDL',          icon: <Database size={15} /> },
    { id: 'herramientas', label: 'IAs Recomendadas',   icon: <Cpu size={15} /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center">
              <Database size={20} className="text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Modelo de Datos Completo</h1>
              <p className="text-sm text-slate-500">JSON Schema · SQL DDL · Objetivos · IAs para diagramas</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs bg-rose-100 text-rose-700 px-2.5 py-1 rounded-full font-semibold">⚠️ historial_vehiculo — entidad NUEVA requerida</span>
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-semibold">~26 tablas PostgreSQL</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-6">
        <div className="max-w-7xl mx-auto flex gap-1 overflow-x-auto py-2">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                activeTab === tab.id ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">

        {/* ── TAB: Firma ─────────────────────────────────────────── */}
        {activeTab === 'firma' && (
          <div className="space-y-5">
            {/* Respuesta directa */}
            <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <AlertCircle size={22} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-900 mb-2">Respuesta directa: Sí, existe Firma en OrdenTrabajo — pero de 2 maneras distintas.</p>
                  <p className="text-amber-800 text-sm">La confusión viene de que "embebida" significa algo diferente en el código TypeScript vs. la base de datos real.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* En TypeScript */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white"><Code2 size={16} /></div>
                  <h3 className="font-bold text-slate-800">En el código TypeScript (actual)</h3>
                </div>
                <div className="bg-slate-900 rounded-xl p-4 text-xs font-mono text-slate-200 mb-4">
                  <div className="text-slate-400">// AppContext.tsx</div>
                  <div className="mt-2">
                    <span className="text-blue-400">interface</span> <span className="text-yellow-300">Firma</span> {'{'}
                    <div className="pl-4">
                      <div><span className="text-cyan-300">dataUrl</span>: string; <span className="text-slate-500">// base64 PNG</span></div>
                      <div><span className="text-cyan-300">fecha</span>: string;</div>
                      <div><span className="text-cyan-300">tipo</span>: <span className="text-green-300">'aprobacion_presupuesto'</span></div>
                      <div className="ml-12">| <span className="text-green-300">'entrega_vehiculo'</span>;</div>
                      <div><span className="text-cyan-300">usuarioId?</span>: string;</div>
                    </div>
                    {'}'}
                  </div>
                  <div className="mt-3">
                    <span className="text-blue-400">interface</span> <span className="text-yellow-300">OrdenTrabajo</span> {'{'}
                    <div className="pl-4">
                      <div className="text-slate-400">// ... otros campos ...</div>
                      <div><span className="text-cyan-300">firmas?</span>: <span className="text-yellow-300">Firma</span>[];<span className="text-emerald-400 ml-2">// ← AQUÍ</span></div>
                    </div>
                    {'}'}
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
                  <p className="font-semibold mb-1">¿Qué significa "embebido"?</p>
                  <p>Que los objetos Firma viven <strong>dentro del objeto OrdenTrabajo</strong> como un array anidado. En el mock data (useState), la orden guarda directamente el array de firmas. No hay colección separada de firmas.</p>
                </div>
              </div>

              {/* En PostgreSQL */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white"><Database size={16} /></div>
                  <h3 className="font-bold text-slate-800">En PostgreSQL / Supabase (real)</h3>
                </div>
                <div className="bg-slate-900 rounded-xl p-4 text-xs font-mono text-slate-200 mb-4">
                  <div className="text-slate-400">-- Tabla SEPARADA en la BD</div>
                  <div className="mt-2">
                    <span className="text-blue-400">CREATE TABLE</span> <span className="text-yellow-300">firma</span> (
                    <div className="pl-4">
                      <div><span className="text-cyan-300">id</span>         UUID <span className="text-purple-400">PRIMARY KEY</span>,</div>
                      <div><span className="text-emerald-400">orden_id</span>  UUID <span className="text-purple-400">NOT NULL</span></div>
                      <div className="ml-14"><span className="text-blue-400">REFERENCES</span> <span className="text-yellow-300">orden_trabajo</span>(id),</div>
                      <div><span className="text-cyan-300">tipo</span>       tipo_firma_enum,</div>
                      <div><span className="text-cyan-300">data_url</span>   TEXT, <span className="text-slate-500">-- base64 o URL</span></div>
                      <div><span className="text-cyan-300">fecha</span>      TIMESTAMPTZ,</div>
                      <div><span className="text-cyan-300">usuario_id</span> UUID <span className="text-blue-400">REFERENCES</span> usuario(id)</div>
                    </div>
                    );
                  </div>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 text-sm text-emerald-800">
                  <p className="font-semibold mb-1">¿Por qué tabla separada?</p>
                  <p>PostgreSQL es relacional. No puede guardar arrays de objetos como columna. Cada Firma se convierte en una <strong>fila de la tabla firma</strong> con <strong>FK orden_id</strong>. La relación es <strong>1 OrdenTrabajo : N Firmas</strong>.</p>
                </div>
              </div>
            </div>

            {/* Los 2 tipos de firma */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Shield size={16} className="text-slate-600" />
                Los 2 tipos de Firma en el sistema
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-amber-200 bg-amber-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs bg-amber-600 text-white px-2 py-0.5 rounded-full font-bold">TIPO 1</span>
                    <p className="font-semibold text-amber-900">aprobacion_presupuesto</p>
                  </div>
                  <p className="text-sm text-amber-800 mb-3">El cliente firma digitalmente para aprobar o rechazar la cotización. Es la prueba legal de que el cliente autorizó la reparación.</p>
                  <div className="text-xs space-y-1 text-amber-700">
                    <div>👤 <strong>Actor:</strong> Cliente</div>
                    <div>⚡ <strong>Cuándo:</strong> Al aprobar/rechazar cotización en el portal</div>
                    <div>📋 <strong>Efecto:</strong> OT pasa de esperando_aprobacion → en_reparacion</div>
                  </div>
                </div>
                <div className="border border-blue-200 bg-blue-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">TIPO 2</span>
                    <p className="font-semibold text-blue-900">entrega_vehiculo</p>
                  </div>
                  <p className="text-sm text-blue-800 mb-3">El cliente firma al retirar su vehículo confirmando que recibió el auto en conformidad y ha pagado. Es el cierre formal de la OT.</p>
                  <div className="text-xs space-y-1 text-blue-700">
                    <div>👤 <strong>Actor:</strong> Cliente</div>
                    <div>⚡ <strong>Cuándo:</strong> Al entregar el vehículo (ventanilla asesor)</div>
                    <div>📋 <strong>Efecto:</strong> OT pasa de liberada → finalizada + genera factura</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Diagrama de relación */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-bold text-slate-800 mb-4">Diagrama de Composición: OrdenTrabajo → Firma</h3>
              <div className="bg-slate-50 rounded-xl p-5 font-mono text-sm overflow-x-auto">
                <div className="flex items-start gap-8">
                  <div className="border-2 border-indigo-300 rounded-xl p-4 bg-white min-w-48">
                    <p className="font-bold text-indigo-800 text-center border-b border-indigo-200 pb-2 mb-2">OrdenTrabajo</p>
                    <div className="text-xs text-slate-600 space-y-0.5">
                      <div>id: UUID</div>
                      <div>numero: string</div>
                      <div>estado: EstadoOrden</div>
                      <div className="text-slate-400">...</div>
                      <div className="text-indigo-600 font-semibold">◆ firmas: Firma[]</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center pt-8">
                    <div className="text-xs text-slate-500 mb-1">1</div>
                    <div className="w-16 border-t-2 border-slate-400 relative">
                      <span className="absolute -left-2 -top-2 text-slate-600">◆</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">0..*</div>
                    <div className="text-xs text-slate-400 mt-1">composición</div>
                  </div>
                  <div className="border-2 border-emerald-300 rounded-xl p-4 bg-white min-w-40">
                    <p className="font-bold text-emerald-800 text-center border-b border-emerald-200 pb-2 mb-2">Firma</p>
                    <div className="text-xs text-slate-600 space-y-0.5">
                      <div>id: UUID</div>
                      <div className="text-emerald-600 font-semibold">orden_id: FK</div>
                      <div>tipo: TipoFirma</div>
                      <div>dataUrl: TEXT</div>
                      <div>fecha: datetime</div>
                      <div>usuarioId: UUID?</div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-xs text-slate-500">
                  ◆ = composición fuerte (Firma no puede existir sin OrdenTrabajo) · En BD: FK orden_id NOT NULL
                </div>
              </div>
            </div>

            {/* Todos los objetos embebidos */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-bold text-slate-800 mb-4">Todos los objetos "embebidos" en OrdenTrabajo → tablas separadas en BD</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-800 text-white">
                    <tr>
                      <th className="text-left px-4 py-2.5">Campo en TypeScript</th>
                      <th className="text-left px-4 py-2.5">Tipo TS</th>
                      <th className="text-left px-4 py-2.5">Tabla en BD</th>
                      <th className="text-left px-4 py-2.5">Relación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      ['recepcion?', 'RecepcionVehiculo', 'recepcion_vehiculo', '1:1'],
                      ['cotizacion?', 'Cotizacion', 'cotizacion', '1:1'],
                      ['cotizacion.lineas', 'LineaCotizacion[]', 'linea_cotizacion', '1:N'],
                      ['repuestosUsados', 'RepuestoUsado[]', 'repuesto_usado', '1:N'],
                      ['repuestosReservados?', 'RepuestoUsado[]', 'repuesto_reservado', '1:N'],
                      ['controlCalidad?', 'ControlCalidad', 'control_calidad', '1:1'],
                      ['tareas?', 'TareaSubdividida[]', 'tarea_subdividida', '1:N'],
                      ['firmas?', 'Firma[]', 'firma ★', '1:N'],
                      ['fotosRecepcion?', 'string[]', 'orden_foto (tipo=recepcion)', '1:N'],
                      ['fotosDiagnostico?', 'string[]', 'orden_foto (tipo=diagnostico)', '1:N'],
                      ['fotosReparacion?', 'string[]', 'orden_foto (tipo=reparacion)', '1:N'],
                      ['mecanicosIds?', 'string[]', 'orden_mecanico', 'N:M'],
                    ].map(([campo, tipo, tabla, rel]) => (
                      <tr key={campo} className={`${tabla === 'firma ★' ? 'bg-amber-50 font-semibold' : ''}`}>
                        <td className="px-4 py-2.5 font-mono text-xs text-slate-700">{campo}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-blue-700">{tipo}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-emerald-700">{tabla}</td>
                        <td className="px-4 py-2.5 text-xs text-slate-600">{rel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: JSON ──────────────────────────────────────────── */}
        {activeTab === 'json' && (
          <div className="space-y-5">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
              <Info size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Cómo usar este JSON para generar diagramas</p>
                <p>Copia el JSON completo y pégalo en ChatGPT o Claude con el prompt: <em>"Genera el diagrama de clases UML en PlantUML y el ERD en DBML basándote en este schema JSON de base de datos."</em></p>
              </div>
            </div>
            <CodeBlock code={SCHEMA_JSON} lang="json — Schema completo del sistema TallerPro" />
          </div>
        )}

        {/* ── TAB: OE ────────────────────────────────────────────── */}
        {activeTab === 'oe' && (
          <div className="space-y-5">
            {OE_DATA.map(oe => (
              <div key={oe.id} className={`bg-white rounded-xl border-2 ${oe.borderColor} overflow-hidden`}>
                <div className={`${oe.color} px-5 py-4 flex items-center gap-3`}>
                  <span className="text-white">{oe.icon}</span>
                  <div>
                    <p className="text-xs font-mono text-white/70">{oe.id}</p>
                    <h3 className="font-bold text-white">{oe.titulo}</h3>
                  </div>
                  <div className="ml-auto flex gap-2 flex-wrap">
                    {oe.actores.map(a => (
                      <span key={a} className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">{a}</span>
                    ))}
                  </div>
                </div>
                <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* Entidades */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Entidades / Tablas</p>
                    <div className="space-y-1">
                      {oe.entidades.map(e => (
                        <div key={e} className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg font-mono ${
                          e.includes('★NUEVA') ? 'bg-rose-100 text-rose-700 font-bold' : `${oe.bgColor} text-slate-700`
                        }`}>
                          <Database size={10} />
                          {e}
                        </div>
                      ))}
                    </div>
                    {oe.entidadNueva && (
                      <div className="mt-3 bg-rose-50 border border-rose-200 rounded-xl p-3">
                        <p className="text-xs font-bold text-rose-800 mb-1">⚠️ Entidad faltante: {oe.entidadNueva.nombre}</p>
                        <p className="text-xs text-rose-700">{oe.entidadNueva.motivo}</p>
                      </div>
                    )}
                  </div>
                  {/* Funciones */}
                  <div className="lg:col-span-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Funciones del Sistema</p>
                    <div className="space-y-1.5">
                      {oe.funciones.map((f, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <span className={`px-1.5 py-0.5 rounded font-semibold flex-shrink-0 ${
                            f.actor === 'Sistema' ? 'bg-slate-100 text-slate-600' :
                            f.actor === 'Cliente' ? 'bg-rose-100 text-rose-700' :
                            f.actor === 'Asesor' ? 'bg-blue-100 text-blue-700' :
                            f.actor === 'Mecánico' ? 'bg-orange-100 text-orange-700' :
                            f.actor === 'Admin' ? 'bg-purple-100 text-purple-700' :
                            f.actor === 'Jefe Taller' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>{f.actor}</span>
                          <span className="text-slate-700 leading-relaxed">{f.fn}</span>
                        </div>
                      ))}
                    </div>
                    {oe.flujoEstados && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Flujo de Estados OT</p>
                        <div className="flex items-center gap-1 flex-wrap">
                          {oe.flujoEstados.map((e, i) => (
                            <React.Fragment key={e}>
                              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-mono">{e}</span>
                              {i < oe.flujoEstados!.length - 1 && <ArrowRight size={10} className="text-slate-400" />}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── TAB: SQL ───────────────────────────────────────────── */}
        {activeTab === 'sql' && (
          <div className="space-y-5">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
              <Info size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-emerald-800">
                <p className="font-semibold mb-1">Cómo usar este SQL en Supabase</p>
                <ol className="list-decimal ml-4 space-y-0.5">
                  <li>Abre tu proyecto en <strong>supabase.com</strong></li>
                  <li>Ve a <strong>SQL Editor → New query</strong></li>
                  <li>Pega el script completo y ejecuta</li>
                  <li>Verifica en <strong>Table Editor</strong> que se crearon todas las tablas</li>
                </ol>
              </div>
            </div>
            <CodeBlock code={SQL_DDL} lang="sql — DDL PostgreSQL para Supabase (26 tablas)" />
          </div>
        )}

        {/* ── TAB: Herramientas ──────────────────────────────────── */}
        {activeTab === 'herramientas' && (
          <div className="space-y-5">
            <div className="bg-slate-800 rounded-xl p-5 text-white">
              <h3 className="font-bold mb-2 flex items-center gap-2"><Cpu size={16} className="text-cyan-400" />Flujo recomendado para generar diagramas</h3>
              <div className="flex items-center gap-3 flex-wrap text-sm">
                {['Copiar JSON/SQL', 'Pegar en Claude o ChatGPT', 'Pedir PlantUML/DBML/Mermaid', 'Renderizar en herramienta', 'Exportar PNG/PDF'].map((step, i) => (
                  <React.Fragment key={step}>
                    <span className="bg-white/10 px-3 py-1.5 rounded-lg">{step}</span>
                    {i < 4 && <ArrowRight size={14} className="text-slate-400" />}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {AI_TOOLS.map(tool => (
                <div key={tool.nombre} className={`rounded-xl border-2 p-5 ${tool.color}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{tool.icon}</span>
                      <div>
                        <p className="font-bold text-slate-800">{tool.nombre}</p>
                        <span className="text-xs bg-white/60 text-slate-700 px-2 py-0.5 rounded-full">{tool.uso}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-700 mb-3 leading-relaxed">{tool.prompt}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 bg-white/60 px-2 py-1 rounded-lg">{tool.output}</span>
                    <a href={tool.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-700 font-semibold hover:underline">
                      Abrir <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Prompts listos para copiar */}
            <Section title="Prompts listos para copiar" icon={<Zap size={16} />} color="bg-amber-500">
              <div className="space-y-4 pt-2">
                {[
                  {
                    titulo: 'Diagrama de Clases UML (PlantUML)',
                    prompt: `Eres un experto en diseño de software. Basándote en este JSON de schema de base de datos, genera el código PlantUML completo para el diagrama de clases UML del sistema TallerPro (un Sistema de Gestión de Taller Automotriz). Incluye:
1. La superclase abstracta Usuario con sus 5 subclases (Administrador, Asesor, Mecanico, JefeTaller, ClienteUsuario)
2. Todas las entidades con sus atributos tipados
3. Relaciones de composición (OrdenTrabajo ◆──> Firma, Cotizacion, RecepcionVehiculo, etc.)
4. Relaciones de asociación con multiplicidad correcta
5. Los métodos principales de cada clase

[PEGAR JSON AQUÍ]`,
                  },
                  {
                    titulo: 'ERD para dbdiagram.io (DBML)',
                    prompt: `Convierte este schema JSON al formato DBML de dbdiagram.io para generar el diagrama entidad-relación del sistema TallerPro. Incluye todas las tablas con sus columnas, tipos de datos PostgreSQL, primary keys, foreign keys y referencias. Usa el patrón "Tabla por Subclase" para la herencia.

[PEGAR JSON O SQL AQUÍ]`,
                  },
                  {
                    titulo: 'Diagrama Mermaid (GitHub/Notion)',
                    prompt: `Genera el diagrama de clases en sintaxis Mermaid para el sistema TallerPro basándote en este schema. Incluye las entidades principales, sus atributos clave y las relaciones entre ellas. Que sea legible y no demasiado denso.

[PEGAR JSON AQUÍ]`,
                  },
                ].map(p => (
                  <div key={p.titulo} className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                      <p className="font-semibold text-slate-800 text-sm">{p.titulo}</p>
                      <CopyBtn text={p.prompt} />
                    </div>
                    <pre className="p-4 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed bg-white">{p.prompt}</pre>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}
