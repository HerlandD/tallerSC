# SoftwareTallerSC
Historias de Usuario Faltantes - Diseño SCRUM
Proyecto: SCRUM | Equipo: Josue · Danner · Herland

---

## ÉPICA 1: Gestión de Citas y Registro de Historial (SCRUM-128)
Responsable principal: Josue Sanchez

### NUEVA — HU 1.8: Dashboard de Cliente - Estado de Vehículos y Citas
**Issue:** SCRUM-XXX  
**Título:** Dashboard de Cliente - Estado de Vehículos y Citas  
**Épica:** Épica 1 (Gestión de Citas)  
**Asignado a:** Josue Sanchez  
**Prioridad:** Medium  
**Estado:** POR HACER

#### 📖 Historia de Usuario
Como Cliente, quiero ver un dashboard con mis citas programadas, estado de mis vehículos en reparación, cotizaciones pendientes de aprobación y facturas descargables, para tener visibilidad total sobre mis servicios.

#### 🧩 DISEÑO FUNCIONAL
**Flujo:** Cliente inicia sesión → ve: mis citas próximas, mis vehículos, órdenes en progreso con estado, cotizaciones para aprobar, mis facturas
**Pantallas:** Tarjetas de citas, tarjetas de vehículos con estado de OT, notificaciones de cotizaciones, enlace a mis facturas → [Link Figma]
**Validaciones:** Solo mostrar datos del cliente autenticado

#### ⚙️ DISEÑO TÉCNICO
**API:** GET /dashboard/cliente (retorna datos del cliente)  
**Base de datos:** Consultas sobre appointments, vehicles, work_orders, invoices del cliente_id actual  
**Reglas de negocio:** Mostrar solo citas/vehículos del cliente; acceso a historial de facturas

#### ✅ Criterios de Aceptación
81. Mostrar citas próximas (próximos 7 días) con botón de cancelar.
82. Mostrar vehículos con estado actual de la orden (ej: "En Reparación", "Esperando Aprobación").
83. Botón de aprobación para cotizaciones pendientes con desglose.
84. Enlace a "Mis Facturas" con historial descargable.
85. Notificación si hay cotización nueva o cambio de estado de vehículo.

#### 📌 Subtareas
| Issue | Actividad | Tipo |
|-------|-----------|------|
| NUEVA | Backend: Endpoint GET /dashboard/cliente | Backend |
| NUEVA | Frontend: Tarjetas de citas y vehículos con estado | Frontend |
| NUEVA | Frontend: Acceso a cotizaciones y facturas | Frontend |
| NUEVA | Diseñar en Figma: Dashboard del cliente | Diseño UI |

---

### NUEVA — HU 1.9: Notificaciones por Email/SMS para Clientes
**Issue:** SCRUM-XXX  
**Título:** Notificaciones por Email y SMS para Clientes  
**Épica:** Épica 1 (Gestión de Citas)  
**Asignado a:** Josue Sanchez  
**Prioridad:** Medium  
**Estado:** POR HACER

#### 📖 Historia de Usuario
Como Sistema/Cliente, quiero recibir notificaciones por email o SMS sobre cambios en mi orden (cotización lista, vehículo listo, pago confirmado) para mantenerme informado sin necesidad de revisar el portal.

#### 🧩 DISEÑO FUNCIONAL
**Flujo:** 
1. Cambio de estado en OT → sistema envía email/SMS automático al cliente
2. Cotización genera → email con link a portal para aprobación
3. Vehículo listo → notificación con instrucciones de recogida

**Pantallas:** Panel de configuración de notificaciones (Administrador controla templates) → [Link Figma]
**Validaciones:** Email/teléfono válidos; preferencias de notificación por cliente; máximo 1 email por evento

#### ⚙️ DISEÑO TÉCNICO
**API:** 
- POST /notifications/email
- POST /notifications/sms
- GET /notification-templates

**Integraciones externas:** 
- Email: SendGrid o AWS SES
- SMS: Twilio o similar

**Base de datos:**
- Tabla notification_templates (id, tipo_evento, template_email, template_sms, activo)
- Tabla notification_log (id, cliente_id, tipo, metodo_envio, fecha_envio, estado)

**Reglas de negocio:**
- Trigger al cambiar estado en work_orders → enviar notificación
- Cliente puede desuscribirse desde enlace en email
- Reintentos automáticos si envío falla (máx 3 intentos)

#### ✅ Criterios de Aceptación
86. Al cambiar estado de OT a "Esperando Aprobación", enviar email con cotización.
87. Al cambiar estado a "Liberada", enviar notificación "Vehículo listo para recoger".
88. Al confirmar pago, enviar email con factura y recibo.
89. Cliente puede configurar preferencias (email, SMS, ambos) en su perfil.
90. Administrador puede ver historial de notificaciones enviadas.

#### 📌 Subtareas
| Issue | Actividad | Tipo |
|-------|-----------|------|
| NUEVA | Backend: Integración con SendGrid/SES para emails | Backend |
| NUEVA | Backend: Integración con Twilio para SMS | Backend |
| NUEVA | Backend: Triggers para enviar notificaciones en cambios de estado | Backend |
| NUEVA | Frontend: Panel de configuración de preferencias de notificación | Frontend |
| NUEVA | Diseñar en Figma: Templates de email/SMS visuales | Diseño UI |

---

## ÉPICA 2: Órdenes de Trabajo y Flujo Operativo (SCRUM-131)
Responsable principal: Danner Alejandro Qui...

### NUEVA — HU 2.8: Dashboard de Jefe de Taller - Gestión de Carga Operativa
**Issue:** SCRUM-XXX  
**Título:** Dashboard de Jefe de Taller - Gestión de Carga Operativa  
**Épica:** Épica 2 (Órdenes de Trabajo)  
**Asignado a:** Danner Alejandro  
**Prioridad:** High  
**Estado:** POR HACER

#### 📖 Historia de Usuario
Como Jefe de Taller, quiero visualizar un dashboard que muestre la carga de trabajo actual, órdenes pendientes, mecánicos disponibles y alertas de QC rechazado, para gestionar eficientemente la operación del taller.

#### 🧩 DISEÑO FUNCIONAL
**Flujo:** Jefe de Taller inicia sesión → ve panel con: carga por mecánico, órdenes en QC, órdenes en reparación, mecánicos disponibles
**Pantallas:** Dashboard con tarjetas: Órdenes en Reparación (count), En QC (count), Mecánicos disponibles; tabla de órdenes por mecánico con estado; lista de alertas → [Link Figma]
**Validaciones:** Solo Jefe de Taller; datos en tiempo real

#### ⚙️ DISEÑO TÉCNICO
**API:** GET /dashboard/jefe-taller  
**Base de datos:** Consultas sobre work_orders (por estado/mecánico), staff (disponibilidad)  
**Reglas de negocio:**
- Órdenes en reparación = count donde estado='en_reparacion'
- Órdenes en QC = count donde estado='control_calidad'
- Mecánico disponible = sin órdenes activas asignadas
- Alerta: QC rechazado = trabajo regresa a reparación

#### ✅ Criterios de Aceptación
91. Tarjetas de resumen: Órdenes en Reparación, En QC, Mecánicos Disponibles.
92. Tabla de carga de trabajo: listar cada mecánico con órdenes activas asignadas.
93. Resaltar en rojo órdenes rechazadas en QC con motivo visible.
94. Permitir re-asignar orden directamente desde el dashboard.
95. Mostrar tiempo promedio en cada estado (Reparación, QC).

#### 📌 Subtareas
| Issue | Actividad | Tipo |
|-------|-----------|------|
| NUEVA | Backend: Endpoint GET /dashboard/jefe-taller con datos de carga | Backend |
| NUEVA | Frontend: Tabla de carga de trabajo por mecánico | Frontend |
| NUEVA | Frontend: Tarjetas de órdenes por estado con alertas | Frontend |
| NUEVA | Diseñar en Figma: Dashboard del Jefe de Taller | Diseño UI |

---

### NUEVA — HU 2.9: Dashboard de Mecánico - Mis Órdenes Asignadas
**Issue:** SCRUM-XXX  
**Título:** Dashboard de Mecánico - Mis Órdenes Asignadas  
**Épica:** Épica 2 (Órdenes de Trabajo)  
**Asignado a:** Danner Alejandro  
**Prioridad:** Medium  
**Estado:** POR HACER

#### 📖 Historia de Usuario
Como Mecánico, quiero ver un panel con mis órdenes asignadas, prioridades y acceso rápido a la información del cliente/vehículo, para ejecutar eficientemente mi trabajo diario.

#### 🧩 DISEÑO FUNCIONAL
**Flujo:** Mecánico inicia sesión → ve panel con: mis órdenes en progreso, detalles de cada orden (cliente, vehículo, diagnóstico), botón para marcar completada
**Pantallas:** Lista de órdenes asignadas con estado, tarjeta de orden actual con detalles del vehículo, botón "Marcar como Completada" → [Link Figma]
**Validaciones:** Solo mostrar órdenes asignadas al mecánico actual

#### ⚙️ DISEÑO TÉCNICO
**API:** GET /dashboard/mecanico (retorna órdenes del usuario actual)  
**Base de datos:** Consulta sobre work_orders donde mecanico_id = usuario.id  
**Reglas de negocio:** Mostrar solo órdenes en estado 'en_reparacion' o 'diagnostico'

#### ✅ Criterios de Aceptación
96. Mostrar lista de órdenes asignadas al mecánico en estados 'En Reparación' o 'Diagnóstico'.
97. Cada orden debe mostrar: número OT, cliente, placa vehículo, estado, descripción.
98. Al hacer clic en una orden, abrir vista detallada con cotización, repuestos, diagnóstico.
99. Botón "Marcar como Completada" que cambia estado a 'Control de Calidad'.
100. Contador de órdenes pendientes en la parte superior.

#### 📌 Subtareas
| Issue | Actividad | Tipo |
|-------|-----------|------|
| NUEVA | Backend: Endpoint GET /dashboard/mecanico | Backend |
| NUEVA | Frontend: Lista de órdenes con acciones rápidas | Frontend |
| NUEVA | Diseñar en Figma: Dashboard del mecánico | Diseño UI |

---

### NUEVA — HU 2.10: Gestión de Turnos y Disponibilidad de Mecánicos
**Issue:** SCRUM-XXX  
**Título:** Gestión de Turnos y Disponibilidad de Mecánicos  
**Épica:** Épica 2 (Órdenes de Trabajo)  
**Asignado a:** Danner Alejandro  
**Prioridad:** Medium  
**Estado:** POR HACER

#### 📖 Historia de Usuario
Como Jefe de Taller, quiero definir turnos y disponibilidad de mecánicos (lunes-viernes, horas) para optimizar la asignación de órdenes y evitar sobrecarga.

#### 🧩 DISEÑO FUNCIONAL
**Flujo:** Jefe de Taller accede a Gestión de Turnos → selecciona mecánico → define horario laboral (entrada/salida) → define días libres/vacaciones → guarda cambios
**Pantallas:** Calendario de mecánicos con turnos, formulario de edición de turno, vista de disponibilidad → [Link Figma]
**Validaciones:** Horarios en formato 24h; máximo 10 horas por turno; días de vacaciones no se pueden sobrescribir

#### ⚙️ DISEÑO TÉCNICO
**API:** 
- GET /staff/{mecanico_id}/schedule
- PUT /staff/{mecanico_id}/schedule
- GET /staff/availability?date={fecha}

**Base de datos:** 
- Tabla staff_schedule (id, staff_id, dia_semana, hora_inicio, hora_fin)
- Tabla staff_vacaciones (id, staff_id, fecha_inicio, fecha_fin)

**Reglas de negocio:**
- No asignar órdenes a mecánico fuera de horario
- Vacaciones bloquean completamente la disponibilidad

#### ✅ Criterios de Aceptación
101. Jefe de Taller puede ver calendario con turnos de todos los mecánicos.
102. Puede editar horario laboral (entrada/salida) por día de la semana.
103. Puede marcar días de vacaciones/licencia por rangos de fechas.
104. Sistema no permite asignar órdenes a mecánico en turno no laboral.
105. Dashboard de Jefe de Taller muestra disponibilidad en tiempo real.

#### 📌 Subtareas
| Issue | Actividad | Tipo |
|-------|-----------|------|
| NUEVA | Backend: Tablas de horarios y vacaciones | Backend |
| NUEVA | Backend: Endpoints CRUD de turnos | Backend |
| NUEVA | Frontend: Calendario de turnos con edición | Frontend |
| NUEVA | Frontend: Validación de disponibilidad al asignar órdenes | Frontend |
| NUEVA | Diseñar en Figma: Calendario de turnos y disponibilidad | Diseño UI |

---

## ÉPICA 3: Control de Inventario y Repuestos (SCRUM-129)
Responsable principal: Herland Daza Corona

### NUEVA — HU 3.4: Gestión de Catálogos del Sistema
**Issue:** SCRUM-XXX  
**Título:** Gestión de Catálogos del Sistema (Estados, Tipos de Servicio, Categorías)  
**Épica:** Épica 3 (Control de Inventario)  
**Asignado a:** Herland Daza Corona  
**Prioridad:** High  
**Estado:** POR HACER

#### 📖 Historia de Usuario
Como Administrador, quiero gestionar los catálogos del sistema (estados de orden, tipos de servicio, categorías de repuestos, prioridades), para mantener la configuración consistente sin modificar el código.

#### 🧩 DISEÑO FUNCIONAL
**Flujo:** Administrador accede a módulo Catálogos → selecciona tipo de catálogo → visualiza/edita/agrega items → guarda cambios
**Pantallas:** Página de administración con tabs: Estados de Orden, Tipos de Servicio, Categorías, Prioridades; CRUD para cada uno → [Link Figma]
**Validaciones:** Nombres únicos; no permitir eliminación de items en uso; cambios no afecten datos históricos

#### ⚙️ DISEÑO TÉCNICO
**API:** 
- GET /catalogs/{tipo}
- POST /catalogs/{tipo}
- PUT /catalogs/{tipo}/{id}
- DELETE /catalogs/{tipo}/{id} (soft delete si está en uso)

**Base de datos:** 
- Tabla catalog_tipo (id, nombre, descripcion, activo, fecha_creacion)
- Relaciones en work_orders, appointments, parts respetan integridad referencial

**Reglas de negocio:** 
- Estados predefinidos no se pueden eliminar (registrada, en_diagnostico, etc.)
- Al desactivar un catálogo, mostrar advertencia si hay registros en uso
- Cambios en catálogos no afectan datos históricos

#### ✅ Criterios de Aceptación
106. Administrador puede ver lista de todos los catálogos disponibles.
107. Administrador puede crear, editar y desactivar items de catálogo.
108. El sistema previene eliminación de items en uso (mostrando advertencia).
109. Los catálogos están disponibles en dropdowns de formularios en tiempo real.
110. Historial de cambios en catálogos registrado en auditoría.

#### 📌 Subtareas
| Issue | Actividad | Tipo |
|-------|-----------|------|
| NUEVA | Backend: Endpoints CRUD para catálogos | Backend |
| NUEVA | Frontend: Página de administración de catálogos con tabs | Frontend |
| NUEVA | Backend: Validación de integridad referencial al eliminar | Backend |
| NUEVA | Diseñar en Figma: Página de administración de catálogos | Diseño UI |

---

### NUEVA — HU 3.5: Exportación de Reportes a Excel/CSV
**Issue:** SCRUM-XXX  
**Título:** Exportación de Reportes a Excel y CSV  
**Épica:** Épica 3 (Control de Inventario)  
**Asignado a:** Herland Daza Corona  
**Prioridad:** High  
**Estado:** POR HACER

#### 📖 Historia de Usuario
Como Administrador o Asesor, quiero exportar reportes a Excel o CSV para análisis en herramientas externas y compartir información fácilmente con el equipo.

#### 🧩 DISEÑO FUNCIONAL
**Flujo:** Usuario accede a módulo de Reportes → selecciona rango de fechas → selecciona formato (Excel/CSV) → descarga archivo con nombre estandarizado
**Pantallas:** Botones de exportación en cada reporte (Ingresos, Productividad, Inventario, Citas) → [Link Figma]
**Validaciones:** Rango de fechas obligatorio; máximo 1 año de datos por descarga; nombre de archivo estandarizado

#### ⚙️ DISEÑO TÉCNICO
**API:** GET /reports/{tipo}/export?format=excel&from=fecha&to=fecha  
**Librerías:** xlsx (Excel) o papaparse (CSV)  
**Base de datos:** Consultas existentes sobre work_orders, payments, appointments, parts  
**Reglas de negocio:** 
- Descargas generadas en el cliente (no se guardan en servidor)
- Archivo incluye timestamp de generación
- Nombre: Reporte_TIPO_FECHA_INICIO_FECHA_FIN.xlsx

#### ✅ Criterios de Aceptación
111. Botones de exportación en cada vista de reporte (Ingresos, Productividad, Inventario, Citas).
112. Formato Excel incluye múltiples hojas (sumario, detalle, gráficas como imagen).
113. Formato CSV incluye todas las columnas necesarias para análisis.
114. Archivo descargado con nombre estandarizado y timestamp.
115. Exportación funciona para todos los roles permitidos (Admin, Asesor, Jefe).

#### 📌 Subtareas
| Issue | Actividad | Tipo |
|-------|-----------|------|
| NUEVA | Frontend: Dependencia de librería xlsx para Excel | Frontend |
| NUEVA | Frontend: Botones de exportación en componentes de reportes | Frontend |
| NUEVA | Frontend: Lógica de generación de archivo (Excel/CSV) en cliente | Frontend |
| NUEVA | Diseñar en Figma: Botones y modal de selección de formato | Diseño UI |

---

## ÉPICA 4: Pagos y Reportes Financieros (SCRUM-130)
Responsable principal: Herland Daza Corona

### NUEVA — HU 4.4: Dashboard de Administrador - Análisis Global del Taller
**Issue:** SCRUM-XXX  
**Título:** Dashboard de Administrador - Análisis Global del Taller  
**Épica:** Épica 4 (Pagos y Reportes)  
**Asignado a:** Herland Daza Corona  
**Prioridad:** High  
**Estado:** POR HACER

#### 📖 Historia de Usuario
Como Administrador, quiero visualizar un dashboard con indicadores clave de negocio (ingresos, órdenes finalizadas, repuestos, usuarios activos), para monitorear la salud operativa del taller en tiempo real.

#### 🧩 DISEÑO FUNCIONAL
**Flujo:** Administrador inicia sesión → panel principal muestra dashboard con tarjetas de KPIs, gráficas de ingresos/órdenes, tabla de últimas transacciones
**Pantallas:** Dashboard con secciones: Resumen (KPIs), Gráficas de ingresos (últimos 30 días), Órdenes por estado, Top 5 mecánicos, Alertas críticas → [Link Figma]
**Validaciones:** Solo rol Administrador puede acceder; datos actualizados cada 5 minutos; filtro por rango de fechas

#### ⚙️ DISEÑO TÉCNICO
**API:** GET /dashboard/admin (retorna KPIs agregados)  
**Base de datos:** Vistas/consultas agregadas sobre work_orders, payments, staff, parts  
**Reglas de negocio:** 
- Total ingresos = suma de payments confirmados
- Órdenes finalizadas = count(work_orders) donde estado='finalizada'
- Valor inventario = sum(parts.precio_venta * parts.stock_actual)
- Mecánicos activos = count(staff) donde rol='mecanico' AND activo=true

#### ✅ Criterios de Aceptación
116. El dashboard debe mostrar: Total Ingresos (mes), Órdenes Finalizadas (mes), Valor Inventario, Usuarios Activos.
117. Debe incluir gráficas de línea: Ingresos acumulados últimos 30 días.
118. Debe incluir gráficas de barras: Órdenes por estado en el mes actual.
119. Debe mostrar tabla de últimas 10 transacciones (orden, cliente, monto, fecha).
120. El dashboard debe ser responsivo y actualizarse sin recargar la página.

#### 📌 Subtareas
| Issue | Actividad | Tipo |
|-------|-----------|------|
| NUEVA | Backend: Crear endpoints GET /dashboard/admin con agregaciones | Backend |
| NUEVA | Frontend: Implementar tarjetas de KPI con componentes reutilizables | Frontend |
| NUEVA | Frontend: Integrar Recharts para gráficas de ingresos y órdenes | Frontend |
| NUEVA | Diseñar en Figma: Dashboard de administrador con KPIs y gráficas | Diseño UI |

---

### NUEVA — HU 4.5: Configuración de Datos de la Empresa
**Issue:** SCRUM-XXX  
**Título:** Configuración de Datos de la Empresa y Branding  
**Épica:** Épica 4 (Pagos y Reportes)  
**Asignado a:** Herland Daza Corona  
**Prioridad:** High  
**Estado:** POR HACER

#### 📖 Historia de Usuario
Como Administrador, quiero configurar los datos de la empresa (nombre, logo, dirección, teléfono, email, RUC), para que aparezcan en reportes, facturas, PDF y portal del cliente.

#### 🧩 DISEÑO FUNCIONAL
**Flujo:** Administrador accede a Configuración → Datos de Empresa → edita campos → sube logo → guarda cambios
**Pantallas:** Formulario con campos: Nombre, RUC, Dirección, Teléfono, Email, Logo, Datos Bancarios, Políticas de Cancelación → [Link Figma]
**Validaciones:** Campos obligatorios; Logo en formato JPG/PNG (máx 2MB); RUC formato válido

#### ⚙️ DISEÑO TÉCNICO
**API:** GET/PUT /company-config  
**Base de datos:** Tabla company_settings (id, nombre, ruc, direccion, telefono, email, logo_url, datos_bancarios, politicas_cancelacion)  
**Reglas de negocio:** Una sola fila de configuración; cambios afectan todos los PDFs/facturas generados a futuro

#### ✅ Criterios de Aceptación
121. Administrador puede editar nombre, RUC, dirección, teléfono, email.
122. Puede subir/cambiar logo que aparezca en facturas, reportes y portal.
123. Puede ingresar datos bancarios (banco, cuenta, titular).
124. Puede definir políticas de cancelación/devolución.
125. Los datos aparecen automáticamente en PDFs generados.

#### 📌 Subtareas
| Issue | Actividad | Tipo |
|-------|-----------|------|
| NUEVA | Backend: Tabla y endpoint GET/PUT /company-config | Backend |
| NUEVA | Frontend: Formulario de configuración de empresa | Frontend |
| NUEVA | Frontend: Upload de logo con validación | Frontend |
| NUEVA | Diseñar en Figma: Página de configuración de empresa | Diseño UI |

---

### NUEVA — HU 4.6: Reportes de Auditoría y Logs del Sistema
**Issue:** SCRUM-XXX  
**Título:** Reportes de Auditoría - Historial de Cambios del Sistema  
**Épica:** Épica 4 (Pagos y Reportes)  
**Asignado a:** Herland Daza Corona  
**Prioridad:** Medium  
**Estado:** POR HACER

#### 📖 Historia de Usuario
Como Administrador, quiero visualizar un reporte de auditoría con todos los cambios realizados en el sistema (quién, qué, cuándo), para mantener trazabilidad completa y detectar actividades sospechosas.

#### 🧩 DISEÑO FUNCIONAL
**Flujo:** Administrador accede a Reportes → Auditoría → filtra por usuario/tipo de acción/fecha → visualiza tabla de logs
**Pantallas:** Tabla de auditoría con columnas: Usuario, Acción, Tabla Afectada, Antes/Después, Fecha/Hora, IP → [Link Figma]
**Validaciones:** Solo Administrador; filtros por rango de fechas, usuario, tipo de acción

#### ⚙️ DISEÑO TÉCNICO
**API:** GET /audit-logs?user={user}&action={action}&from={fecha}&to={fecha}  
**Base de datos:** Tabla log_auditoria (id, usuario_id, tabla, accion, datos_antes, datos_despues, ip_address, fecha_hora)  
**Reglas de negocio:** 
- Todos los cambios en work_orders, payments, users se registran automáticamente
- Datos históricos nunca se eliminan
- RLS: solo Administrador puede acceder

#### ✅ Criterios de Aceptación
126. Reporte muestra: usuario, acción (CREATE/UPDATE/DELETE), tabla, timestamp.
127. Botón de detalle para ver "Antes" y "Después" de cada cambio.
128. Filtrable por usuario, rango de fechas, tipo de acción.
129. Exportable a Excel/PDF con toda la información.
130. Búsqueda por ID de registro afectado para trazar un cambio específico.

#### 📌 Subtareas
| Issue | Actividad | Tipo |
|-------|-----------|------|
| NUEVA | Backend: Trigger en cada tabla para registrar cambios automáticamente | Backend |
| NUEVA | Frontend: Página de reportes de auditoría con filtros | Frontend |
| NUEVA | Frontend: Modal de detalle "Antes/Después" | Frontend |
| NUEVA | Diseñar en Figma: Página de auditoría con tabla de logs | Diseño UI |

---

### NUEVA — HU 4.7: Dashboard de Asesor de Servicio
**Issue:** SCRUM-XXX  
**Título:** Dashboard de Asesor - Gestión de Citas y Órdenes  
**Épica:** Épica 4 (Pagos y Reportes)  
**Asignado a:** Herland Daza Corona  
**Prioridad:** Medium  
**Estado:** POR HACER

#### 📖 Historia de Usuario
Como Asesor de Servicio, quiero visualizar mis citas programadas, órdenes pendientes de cotización y clientes con vehículos en reparación, para gestionar mi flujo de trabajo y mantener comunicación efectiva.

#### 🧩 DISEÑO FUNCIONAL
**Flujo:** Asesor inicia sesión → ve: agenda de citas hoy, órdenes esperando aprobación, órdenes listas para cierre
**Pantallas:** Calendario/lista de citas del día, tarjetas de órdenes por estado (Esperando Aprobación, Liberada), contador de pendientes → [Link Figma]
**Validaciones:** Solo mostrar citas/órdenes asignadas al asesor actual

#### ⚙️ DISEÑO TÉCNICO
**API:** GET /dashboard/asesor (retorna citas y órdenes del usuario)  
**Base de datos:** Consultas sobre appointments y work_orders donde asesor_id = usuario.id  
**Reglas de negocio:** Mostrar citas de hoy; órdenes en estado 'esperando_aprobacion' o 'liberada'

#### ✅ Criterios de Aceptación
131. Mostrar agenda de citas para hoy con horarios.
132. Mostrar órdenes en estado "Esperando Aprobación de Cotización" con monto total.
133. Mostrar órdenes en estado "Liberada" listas para confirmación de pago y cierre.
134. Botón de acceso rápido a cada cita/orden.
135. Contador de pendientes en cada sección.

#### 📌 Subtareas
| Issue | Actividad | Tipo |
|-------|-----------|------|
| NUEVA | Backend: Endpoint GET /dashboard/asesor | Backend |
| NUEVA | Frontend: Calendario y lista de citas del día | Frontend |
| NUEVA | Frontend: Tarjetas de órdenes por estado con acciones | Frontend |
| NUEVA | Diseñar en Figma: Dashboard del asesor | Diseño UI |

---

### NUEVA — HU 4.8: Gestión Dinámica de Roles y Permisos
**Issue:** SCRUM-XXX  
**Título:** Gestión Dinámica de Roles y Permisos (sin hardcoding)  
**Épica:** Épica 4 (Pagos y Reportes)  
**Asignado a:** Herland Daza Corona  
**Prioridad:** Medium  
**Estado:** POR HACER

#### 📖 Historia de Usuario
Como Administrador, quiero crear roles personalizados y asignar permisos granulares (ver, crear, editar, eliminar) a cada módulo, sin necesidad de cambiar código.

#### 🧩 DISEÑO FUNCIONAL
**Flujo:** 
1. Administrador accede a Gestión de Roles
2. Crea nuevo rol (ej: "Supervisor de Inventario")
3. Asigna permisos por módulo (Inventario: Ver, Crear, Editar)
4. Asigna usuario a rol
5. Usuario hereda permisos automáticamente

**Pantallas:** Panel de administración de roles, matriz de permisos (módulos x permisos), asignación de usuarios a roles → [Link Figma]
**Validaciones:** No permitir eliminar roles en uso; cambios de permisos aplican inmediatamente

#### ⚙️ DISEÑO TÉCNICO
**API:**
- GET /roles
- POST /roles
- PUT /roles/{id}/permissions
- PUT /users/{id}/role

**Base de datos:**
- Tabla roles (id, nombre, descripcion, activo)
- Tabla role_permissions (role_id, modulo, permiso: ver/crear/editar/eliminar)
- Tabla users (rol_id) - relación con roles

**Reglas de negocio:**
- Permisos almacenados en DB, no hardcodeados
- RLS en Supabase usa rol_id del usuario
- Cambios de permisos aplican inmediatamente (sin relogin necesario)

#### ✅ Criterios de Aceptación
136. Administrador puede crear roles personalizados.
137. Puede asignar permisos granulares (Ver, Crear, Editar, Eliminar) a cada módulo.
138. Usuarios heredan permisos del rol asignado.
139. Cambios de permisos aplican inmediatamente sin relogin.
140. Matriz de permisos clara y visual.

#### 📌 Subtareas
| Issue | Actividad | Tipo |
|-------|-----------|------|
| NUEVA | Backend: Tablas de roles y permisos dinámicos | Backend |
| NUEVA | Backend: RLS policies en Supabase basadas en permisos | Backend |
| NUEVA | Frontend: Página de gestión de roles con matriz de permisos | Frontend |
| NUEVA | Frontend: Validación de permisos en UI (mostrar/ocultar botones) | Frontend |
| NUEVA | Diseñar en Figma: Panel de gestión de roles y permisos | Diseño UI |

---

## Resumen de HU Nuevas por Épica

| Épica | HU Nuevas | Total HU por Épica |
|-------|-----------|------------------|
| **Épica 1** (Citas) | HU 1.8, 1.9 | 9 HU |
| **Épica 2** (Órdenes) | HU 2.8, 2.9, 2.10 | 10 HU |
| **Épica 3** (Inventario) | HU 3.4, 3.5 | 5 HU |
| **Épica 4** (Pagos/Reportes) | HU 4.4, 4.5, 4.6, 4.7, 4.8 | 8 HU |
| **TOTAL NUEVAS** | | **12 HU** |

**Total HU en el proyecto: 20 (originales) + 12 (nuevas) = 32 HU completamente documentadas**
