SoftwareTallerSC
Historias de Usuario con Plantilla de Diseño en Scrum
Proyecto: SCRUM | Equipo: Josue · Danner · Herland
Aplicando guía: 🎨 Diseño en Scrum: cómo manejarlo
 
📋 Indicaciones Generales del Proyecto
Estas indicaciones aplican a TODAS las historias del proyecto.

🔄 Workflow de Estados (agregar en Jira)
To Do	In Design	In Progress	Code Review	QA	Done	
▶	🎨	⚙️	👁️	🧪	✅	← Agregar 'In Design'

✅ Definition of Ready (aplicar antes de cada sprint)
Una historia está lista para entrar al sprint cuando:
•	Tiene diseño UX/UI definido (wireframe o mockup en Figma)
•	Tiene flujo de usuario claro documentado
•	Tiene criterios de aceptación completos
•	No hay dudas funcionales pendientes
•	El diseño técnico (API + BD) está definido

⚠️ Subtareas de Diseño UI (agregar en cada story)
Cada historia debe tener al menos una subtarea de tipo 'Diseño UI' ANTES de las subtareas de desarrollo. Las marcadas como 'NUEVA' en este documento deben crearse en Jira.

 
ÉPICA 1: Gestión de Citas y Registro de Historial (SCRUM-128)
Responsable principal: Josue Sanchez

SCRUM-38 — HU 1.1: Autenticación y Control de Roles
Issue	Título	Épica	Asignado a	Prioridad	Estado
SCRUM-38	HU 1.1: Autenticación y Control de Roles	Épica 1	Josue Sanchez	High	EN CURSO

📖 Historia de Usuario
Como Usuario del sistema, quiero contar con un mecanismo de autenticación seguro que valide mis credenciales y me dirija a la interfaz correspondiente, para garantizar que el acceso a la información del taller esté restringido según mi nivel de responsabilidad (Rol).

🧩 DISEÑO FUNCIONAL
Flujo: Usuario ingresa credenciales (usuario + contraseña) → sistema valida contra BD → redirige al panel correspondiente según rol
Pantallas: Pantalla de Login (campos usuario, contraseña, botón Ingresar, mensaje de error) → [Link Figma]
Validaciones: Campos obligatorios; mensaje de error en credenciales inválidas; bloqueo visual si falla

⚙️ DISEÑO TÉCNICO
API: POST /auth/login → devuelve token JWT + rol del usuario
Base de datos: Tabla users (id, nombre, email, password_hash, rol_id), Tabla roles (id, nombre), Tabla role_permissions (rol_id, permiso)
Reglas de negocio: Validar hash de contraseña, cargar permisos por rol, redirigir automáticamente según rol detectado

✅ Criterios de Aceptación
1.	El sistema debe validar credenciales (Usuario y Contraseña) contra la base de datos centralizada.
2.	Se deben identificar al menos 5 perfiles de acceso: Administrador, Jefe de Taller, Asesor, Mecánico y Cliente.
3.	Una vez autenticado, el sistema debe cargar los permisos del usuario y redirigirlo automáticamente a su panel de control principal.
4.	Ante credenciales erróneas, el sistema debe denegar el acceso y notificar al usuario con un mensaje de error claro.

📌 Subtareas
Issue	Actividad	Tipo
SCRUM-146	Estructura de Datos: Definir tablas de usuarios y roles con sus respectivos permisos	Backend
SCRUM-147	Lógica de Acceso: Desarrollar la validación de credenciales y el redireccionamiento por rol	Backend
SCRUM-148	Interfaz de Usuario: Diseñar y construir la pantalla de inicio de sesión	Frontend/UI
NUEVA	Diseñar wireframe/mockup en Figma para pantalla de login y paneles por rol	Diseño UI


NUEVA (RF-02) — HU 1.0: Gestión de Usuarios del Sistema
Issue	Título	Épica	Asignado a	Prioridad	Estado
NUEVA (RF-02)	HU 1.0: Gestión de Usuarios del Sistema	Épica 1	Josue Sanchez	High	POR HACER

📖 Historia de Usuario
Como Administrador del sistema, quiero crear, editar y desactivar usuarios del taller (personal interno y clientes), para controlar quién tiene acceso al sistema y garantizar la integridad de la información histórica sin eliminar registros físicos.

🧩 DISEÑO FUNCIONAL
Flujo Crear: Administrador accede a módulo Usuarios → pulsa Nuevo Usuario → selecciona rol (Cliente, Asesor, Mecánico, Jefe de Taller, Administrador) → llena datos → guarda en estado Activo
Flujo Editar: Administrador selecciona usuario → modifica datos → guarda cambios
Flujo Desactivar: Administrador selecciona usuario → pulsa Desactivar → confirmación → usuario queda Inactivo (desactivación lógica, NO eliminación física)
Pantallas: Lista de usuarios con filtro por rol y estado (Activo/Inactivo), formulario de creación/edición, modal de confirmación de desactivación → [Link Figma]
Validaciones: Email único en el sistema; usuario inactivo no puede iniciar sesión; no se permite DELETE físico

⚙️ DISEÑO TÉCNICO
API: POST /users, PUT /users/{id}, PUT /users/{id}/toggle-status, GET /users?rol={rol}&activo={bool}
Base de datos: Tabla users (id, nombre, email, password_hash, rol_id, activo: bool, fecha_creacion), Tabla roles (id, nombre)
Reglas de negocio: Desactivación lógica (activo=false) en lugar de DELETE; usuario inactivo bloqueado en login; email no duplicado; acceso exclusivo para rol Administrador

✅ Criterios de Aceptación
5.	El Administrador puede crear usuarios asignándoles un rol específico: Cliente, Asesor, Mecánico, Jefe de Taller o Administrador.
6.	El Administrador puede editar los datos de cualquier usuario del sistema.
7.	No se permitirá la eliminación física de registros; se implementará desactivación lógica para preservar la integridad histórica (RF-02).
8.	Un usuario desactivado no podrá iniciar sesión en el sistema.
9.	La lista de usuarios debe poder filtrarse por rol y por estado (Activo/Inactivo).

📌 Subtareas
Issue	Actividad	Tipo
NUEVA	Backend: Endpoints CRUD de usuarios con desactivación lógica (activo=false)	Backend
NUEVA	Backend: Validación de email único y bloqueo de login para usuarios inactivos	Backend
NUEVA	Frontend Admin: Lista de usuarios con filtros por rol y estado	Frontend
NUEVA	Frontend Admin: Formulario de creación/edición de usuario con selector de rol	Frontend
NUEVA	Diseñar en Figma: vista de gestión de usuarios (lista, formulario, modal de desactivación)	Diseño UI


SCRUM-42 — HU 1.2: Registro de Clientes y Vehículos
Issue	Título	Épica	Asignado a	Prioridad	Estado
SCRUM-42	HU 1.2: Registro de Clientes y Vehículos	Épica 1	Josue Sanchez	Medium	EN CURSO

📖 Historia de Usuario
Como Asesor de Servicio, quiero registrar y centralizar la información de los clientes y sus vehículos en una base de datos única, con el fin de asegurar la trazabilidad de cada unidad y agilizar la apertura de futuras Órdenes de Trabajo.

🧩 DISEÑO FUNCIONAL
Flujo: Asesor accede al módulo Clientes → llena formulario de nuevo cliente → asocia vehículo(s) → guarda registro
Pantallas: Vista listado clientes, formulario nuevo cliente, formulario nuevo vehículo → [Link Figma]
Validaciones: CI único, placa de vehículo única, campos nombre/CI/teléfono/email obligatorios

⚙️ DISEÑO TÉCNICO
API: POST /clients, POST /vehicles, GET /clients/{id}
Base de datos: Tabla clients (id, nombre, CI, telefono, email), Tabla vehicles (id, placa, marca, modelo, anio, client_id)
Reglas de negocio: Un cliente puede tener múltiples vehículos; placa no duplicada en el sistema

✅ Criterios de Aceptación
10.	El formulario de registro debe capturar obligatoriamente: Nombre completo, CI, Teléfono y Correo electrónico.
11.	El sistema debe permitir asociar múltiples vehículos a un solo cliente (Relación Propietario-Activo).
12.	Se debe validar la integridad de los datos, impidiendo el registro de placas de vehículo duplicadas.
13.	El sistema debe permitir la consulta de los datos registrados para su posterior uso en la apertura de Órdenes de Trabajo.

📌 Subtareas
Issue	Actividad	Tipo
SCRUM-150	Modelado Relacional: Diseñar y estructurar la lógica de vinculación entre tablas Cliente y Vehículo	Backend
SCRUM-151	Módulos de Captura: Desarrollar formularios de ingreso con validaciones	Backend/Frontend
SCRUM-152	Interfaz de Gestión: Diseñar la vista administrativa para consulta y listado	Frontend
NUEVA	Diseñar en Figma: formulario de registro de cliente y vehículo, vista de listado	Diseño UI


SCRUM-39 — HU 1.3: Gestión y Programación de Citas de Servicio
Issue	Título	Épica	Asignado a	Prioridad	Estado
SCRUM-39	HU 1.3: Gestión y Programación de Citas de Servicio	Épica 1	Josue Sanchez	Medium	POR HACER

📖 Historia de Usuario
Como Cliente y Asesor de Servicio, quiero gestionar el agendamiento de citas de mantenimiento y reparación, con el fin de organizar la capacidad operativa del taller y reducir los tiempos de espera en la recepción de vehículos.

🧩 DISEÑO FUNCIONAL
Flujo: Cliente solicita cita (selecciona vehículo, tipo servicio, fecha/hora, motivo) → queda en estado Pendiente → Asesor confirma desde panel administrativo
Pantallas: Portal cliente: formulario solicitud cita; Panel asesor: agenda diaria con estados → [Link Figma]
Validaciones: Fecha/hora obligatoria, vehículo registrado obligatorio, no doble reserva en mismo slot

⚙️ DISEÑO TÉCNICO
API: POST /appointments, PUT /appointments/{id}/confirm, GET /appointments?date={fecha}
Base de datos: Tabla appointments (id, vehicle_id, tipo_servicio, fecha_hora, motivo, estado, asesor_id)
Reglas de negocio: Citas de cliente inician en estado Pendiente; Asesor puede confirmar, reprogramar o cancelar

✅ Criterios de Aceptación
14.	El formulario de solicitud de cita debe permitir la selección de: Vehículo registrado, Tipo de servicio, Fecha, Hora y Motivo/Falla reportada.
15.	Las citas solicitadas por el cliente deben ingresar en estado Pendiente hasta que un Asesor las confirme.
16.	El Asesor debe poder visualizar una agenda diaria con todas las citas programadas y sus respectivos estados.
17.	El sistema debe permitir al personal administrativo crear citas de forma interna para clientes que se contacten por canales externos.

📌 Subtareas
Issue	Actividad	Tipo
SCRUM-154	Crear formulario de solicitud de citas (Fecha, Hora y Motivo)	Frontend
SCRUM-155	Implementar funciones para confirmar, reprogramar y cancelar citas según disponibilidad	Backend
NUEVA	Diseñar en Figma: formulario de solicitud de cita (cliente) y agenda diaria (asesor)	Diseño UI
NUEVA	Definir lógica de disponibilidad horaria y control de solapamiento de citas	Backend


SCRUM-43 — HU 1.4: Consulta de Historial de Mantenimiento
Issue	Título	Épica	Asignado a	Prioridad	Estado
SCRUM-43	HU 1.4: Consulta de Historial de Mantenimiento	Épica 1	Josue Sanchez	Medium	POR HACER

📖 Historia de Usuario
Como usuario del sistema (Cliente o Asesor), quiero visualizar el histórico de las Órdenes de Trabajo finalizadas de un vehículo, para tener un registro de las reparaciones pasadas, piezas cambiadas y seguimiento del mantenimiento preventivo.

🧩 DISEÑO FUNCIONAL
Flujo: Usuario accede a historial del vehículo por placa → sistema muestra lista cronológica de OTs finalizadas → usuario selecciona OT para ver detalle
Pantallas: Vista de historial por vehículo (tabla cronológica), vista detalle de OT → [Link Figma]
Validaciones: Solo mostrar OTs con estado Finalizado o Entregado; cliente solo ve sus propios vehículos

⚙️ DISEÑO TÉCNICO
API: GET /vehicles/{placa}/history → lista de OTs; GET /orders/{id} → detalle OT
Base de datos: Tabla work_orders (id, vehicle_id, fecha_servicio, km_entrada, diagnostico, costo_total, estado)
Reglas de negocio: Filtrar por estado Finalizado/Entregado, ordenar descendente por fecha

✅ Criterios de Aceptación
18.	Trazabilidad: Solo se listarán órdenes cuyo estado sea Finalizado o Entregado.
19.	Información Obligatoria: Debe mostrarse el número de OT, fecha de servicio, kilometraje de entrada, diagnóstico técnico y costo total.
20.	Ordenamiento: Los registros deben aparecer en orden cronológico descendente.

📌 Subtareas
Issue	Actividad	Tipo
SCRUM-157	Desarrollar la consulta de trazabilidad de servicios vinculada a la placa del vehículo	Backend
SCRUM-158	Diseñar la vista de historial de mantenimientos realizados para el cliente y el asesor	Frontend
NUEVA	Diseñar en Figma: vista de historial de vehículo y pantalla de detalle de OT	Diseño UI


SCRUM-160 — HU 1.5: Gestión de Estados y Cancelación de Citas
Issue	Título	Épica	Asignado a	Prioridad	Estado
SCRUM-160	HU 1.5: Gestión de Estados y Cancelación de Citas	Épica 1	Josue Sanchez (cambiar de Danner)	Medium	POR HACER

📖 Historia de Usuario
Como Cliente o Asesor de servicio, quiero poder cambiar el estado de una cita u orden de trabajo (Confirmar, Reprogramar, Cancelar o Rechazar), para mantener la agenda del taller actualizada y gestionar correctamente los cierres administrativos por falta de aprobación.

🧩 DISEÑO FUNCIONAL
Flujo Cliente: Entra a Mis Citas → selecciona cita → pulsa Cancelar → ingresa motivo opcional → cita pasa a Cancelada y slot queda libre
Flujo Asesor: Panel administrativo → selecciona cita → edita fecha/hora → cita pasa a Reprogramada
Pantallas: Portal cliente - vista Mis Citas con botón Cancelar; Panel asesor - formulario de edición de cita → [Link Figma]
Validaciones: Estados disponibles: Pendiente, Confirmada, Cancelada, Reprogramada; solicitar motivo al cancelar (opcional)

⚙️ DISEÑO TÉCNICO
API: PUT /appointments/{id}/status (body: { estado, motivo })
Base de datos: Tabla appointments (estado ENUM: Pendiente, Confirmada, Cancelada, Reprogramada, motivo_cancelacion)
Reglas de negocio: Al cancelar cita con OT abierta → cerrar OT automáticamente; horario cancelado vuelve a disponible; RF-11: si cliente rechaza cotización → generar cobro por diagnóstico

✅ Criterios de Aceptación
21.	Estados Disponibles: La cita debe permitir los estados: Pendiente, Confirmada, Cancelada y Reprogramada.
22.	Cancelación (Cliente): El cliente puede cancelar su cita desde el portal con un botón de Cancelar, dejando el horario libre.
23.	Reprogramación (Asesor): El asesor puede cambiar la fecha y hora de una cita existente desde el panel administrativo.
24.	Motivo de Cancelación: El sistema debe solicitar un breve motivo opcional al cancelar.
25.	Gestión de Rechazo (RF-11): Si el cliente rechaza la cotización desde la web, el sistema debe generar automáticamente el cobro por diagnóstico.
26.	Sincronización de Estados: Al cancelar una cita que ya tiene una OT abierta, el sistema debe cerrar la orden automáticamente.

📌 Subtareas
Issue	Actividad	Tipo
SCRUM-161	Backend: Crear la lógica para actualizar el campo estado en la tabla de citas	Backend
SCRUM-162	Frontend Cliente: Añadir botón de cancelación en la vista de Mis Citas	Frontend
SCRUM-163	Frontend Asesor: Implementar el formulario de edición (reprogramación) en el panel administrativo	Frontend
SCRUM-164	Validación: Asegurar que los horarios de citas canceladas vuelvan a aparecer como disponibles	Backend
SCRUM-200	Backend: Implementar la lógica de generación de cobro por diagnóstico al detectar estado Rechazado (RF-11)	Backend
SCRUM-201	Frontend Cliente: Cambiar el texto informativo de Visita recepción por botones de acción (Aprobar/Rechazar) en el portal	Frontend
NUEVA	Diseñar en Figma: vista Mis Citas con acciones, modal de cancelación y formulario de reprogramación	Diseño UI


SCRUM-165 — HU 1.6: Notificaciones de Cambio de Estado
Issue	Título	Épica	Asignado a	Prioridad	Estado
SCRUM-165	HU 1.6: Notificaciones de Cambio de Estado	Épica 1	Josue Sanchez (cambiar de Danner)	Medium	POR HACER

📖 Historia de Usuario
Como Cliente, quiero recibir una alerta visual en el portal cuando mi vehículo cambie de fase (ej. de En Diagnóstico a Finalizado), para saber exactamente en qué momento puedo pasar a recoger mi vehículo sin tener que llamar por teléfono.

🧩 DISEÑO FUNCIONAL
Flujo: Asesor cambia estado de OT en panel → sistema detecta cambio → portal del cliente se actualiza automáticamente mostrando notificación
Pantallas: Dashboard cliente con campana/punto rojo de notificación; bitácora de cambios de estado → [Link Figma]
Validaciones: Actualización en tiempo real; al pasar a Finalizado resaltar botón Ver Historial o Descargar Factura

⚙️ DISEÑO TÉCNICO
API: WebSocket o polling GET /orders/{id}/status-updates
Base de datos: Tabla order_status_log (id, order_id, estado_anterior, estado_nuevo, fecha_hora)
Reglas de negocio: Trigger al cambiar estado en work_orders; notificación visual con punto rojo o campana; historial de cambios visible para el cliente

✅ Criterios de Aceptación
27.	Actualización en Tiempo Real: Cuando el asesor cambie el estado en el Panel Administrativo, el Portal del Cliente debe actualizarse automáticamente.
28.	Indicador Visual: Se debe mostrar una notificación (punto rojo o campana) en el perfil del cliente.
29.	Historial de Cambios: El cliente debe poder ver una pequeña bitácora de fechas.
30.	Disparador Final: Al pasar a estado Finalizado, el sistema debe resaltar el botón de Ver Historial o Descargar Factura.

📌 Subtareas
Issue	Actividad	Tipo
SCRUM-166	Backend: Crear un trigger o disparador que detecte cambios en la tabla de órdenes de trabajo	Backend
SCRUM-167	Frontend Cliente: Implementar el componente de notificaciones (la campana o alertas en el Dashboard)	Frontend
SCRUM-168	Lógica de Notificación: Configurar los mensajes automáticos para hacer saber al cliente el estado de su vehículo	Backend
NUEVA	Diseñar en Figma: componente de campana/notificación y bitácora de estados en el portal del cliente	Diseño UI


SCRUM-169 — HU 1.7: Generación de Reporte de Historial (PDF)
Issue	Título	Épica	Asignado a	Prioridad	Estado
SCRUM-169	HU 1.7: Generación de Reporte de Historial (PDF)	Épica 1	Josue Sanchez (cambiar de Danner)	Medium	POR HACER

📖 Historia de Usuario
Como Cliente o Asesor, quiero generar un documento PDF con el resumen de todos los servicios realizados a un vehículo, para tener un respaldo físico de los mantenimientos o facilitar la venta del vehículo con garantía del taller.

🧩 DISEÑO FUNCIONAL
Flujo: Usuario accede al historial de un vehículo → pulsa Descargar Reporte → sistema genera PDF y lo descarga con nombre estandarizado
Pantallas: Botón Descargar Reporte en la vista de historial de cada vehículo → [Link Figma]
Validaciones: Solo el cliente puede generar PDF de sus propios vehículos; nombre del archivo: Historial_{PLACA}.pdf

⚙️ DISEÑO TÉCNICO
API: GET /vehicles/{placa}/history/pdf → devuelve archivo PDF
Base de datos: Datos de work_orders + vehicles + clients
Reglas de negocio: PDF debe incluir logo del taller, datos del vehículo (Placa, Marca, Modelo, VIN) y tabla cronológica de servicios

✅ Criterios de Aceptación
31.	Botón de Exportación: Debe existir un botón de Descargar Reporte en la vista de historial de cada vehículo.
32.	Contenido del PDF: Logo del taller, datos del vehículo (Placa, Marca, Modelo, VIN), tabla con Fecha, Servicio, Kilometraje y Diagnóstico.
33.	Formato: Archivo descargado con nombre estandarizado (ej: Historial_ABC1234.pdf).
34.	Seguridad: Un cliente solo puede generar el PDF de sus propios vehículos.

📌 Subtareas
Issue	Actividad	Tipo
SCRUM-170	Configurar la generación de documentos con el detalle completo del servicio y costos	Backend
SCRUM-171	Diseño de Plantilla: Crear la estructura visual del reporte (cabecera, tablas y pie de página)	Frontend/Diseño
SCRUM-172	Habilitar la exportación y descarga de reportes en formato PDF	Backend
NUEVA	Diseñar en Figma: plantilla visual del PDF de historial (cabecera, tabla, pie de página)	Diseño UI

 
ÉPICA 2: Órdenes de Trabajo y Flujo Operativo (SCRUM-131)
Responsable principal: Danner Alejandro Qui...

SCRUM-44 — HU 2.1: Apertura y Registro de Orden de Trabajo
Issue	Título	Épica	Asignado a	Prioridad	Estado
SCRUM-44	HU 2.1: Apertura y Registro de Orden de Trabajo	Épica 2	Danner Alejandro	Medium	POR HACER

📖 Historia de Usuario
Como Asesor de Servicio, quiero abrir y registrar una Orden de Trabajo al momento de recibir un vehículo, para documentar formalmente el ingreso, el motivo de la visita y asignar la intervención al área técnica correspondiente.

🧩 DISEÑO FUNCIONAL
Flujo: Asesor recibe vehículo → busca cliente/vehículo en el sistema → llena formulario de OT (km, descripción del problema) → crea OT en estado Registrada
Pantallas: Formulario nueva OT (búsqueda de cliente/placa, km entrada, motivo, tipo servicio) → [Link Figma]
Validaciones: Placa existente en sistema obligatoria, km entrada obligatorio, descripción del problema obligatoria

⚙️ DISEÑO TÉCNICO
API: POST /work-orders
Base de datos: Tabla work_orders (id, vehicle_id, asesor_id, fecha_apertura, km_entrada, descripcion, estado: Registrada)
Reglas de negocio: OT inicia siempre en estado Registrada; número de OT generado automáticamente

✅ Criterios de Aceptación
35.	El formulario debe capturar: vehículo (por placa), kilometraje de entrada, descripción del problema y tipo de servicio.
36.	La OT debe generarse con un número único automático y quedar en estado Registrada.
37.	El sistema debe vincular la OT al historial del vehículo automáticamente.

📌 Subtareas
Issue	Actividad	Tipo
NUEVA	Backend: Crear endpoint POST /work-orders con generación de número único de OT	Backend
NUEVA	Frontend: Desarrollar formulario de apertura de OT con búsqueda de cliente/vehículo	Frontend
NUEVA	Diseñar en Figma: pantalla de formulario de apertura de OT	Diseño UI


SCRUM-183 — HU 2.2: Asignación de Órdenes de Trabajo
Issue	Título	Épica	Asignado a	Prioridad	Estado
SCRUM-183	HU 2.2: Asignación de Órdenes de Trabajo	Épica 2	Danner Alejandro	Medium	POR HACER

📖 Historia de Usuario
Como Jefe de Taller, quiero asignar las órdenes de trabajo generadas a los mecánicos disponibles, para equilibrar la carga laboral y asegurar que cada vehículo sea atendido por un técnico especializado.

🧩 DISEÑO FUNCIONAL
Flujo: Jefe de Taller accede al panel de OTs → visualiza lista de OTs en estado Registrada o Pendiente de Asignación → selecciona mecánico disponible → OT pasa a estado Asignada
Pantallas: Panel de carga de trabajo del Jefe de Taller con lista de OTs y mecánicos disponibles → [Link Figma]
Validaciones: Solo OTs en estado Registrada/Pendiente pueden asignarse; mostrar carga actual de cada mecánico

⚙️ DISEÑO TÉCNICO
API: PUT /work-orders/{id}/assign (body: { mecanico_id })
Base de datos: Tabla work_orders (mecanico_id, estado actualizado a Asignada), Tabla staff (id, nombre, rol: Mecánico, activo)
Reglas de negocio: Al asignar → estado OT cambia a Asignada; mostrar cuántas OTs activas tiene cada mecánico

✅ Criterios de Aceptación
38.	El Jefe de Taller debe visualizar una lista de órdenes en estado Registrada o Pendiente de Asignación.
39.	Se debe poder seleccionar un mecánico específico de la lista de personal activo.
40.	El sistema debe mostrar cuántas órdenes tiene activas cada mecánico antes de asignarle una nueva.

📌 Subtareas
Issue	Actividad	Tipo
SCRUM-184	Diseñar el panel de administración de carga de trabajo para el Jefe de Taller	Frontend/Diseño
SCRUM-185	Implementar la lógica de cambio de estado de la OT a Asignada al elegir un mecánico	Backend
NUEVA	Diseñar en Figma: panel de asignación con lista de OTs y disponibilidad de mecánicos	Diseño UI


SCRUM-45 — HU 2.3: Diagnóstico Técnico y Cotización
Issue	Título	Épica	Asignado a	Prioridad	Estado
SCRUM-45	HU 2.3: Diagnóstico Técnico y Cotización	Épica 2	Danner Alejandro	Medium	POR HACER

📖 Historia de Usuario
Como Mecánico o Asesor, quiero registrar el diagnóstico técnico del vehículo y generar una cotización de los trabajos a realizar, para que el cliente pueda aprobar o rechazar el presupuesto antes de iniciar la reparación.

🧩 DISEÑO FUNCIONAL
Flujo: Mecánico accede a su OT asignada → ingresa diagnóstico → agrega repuestos y mano de obra → genera cotización → Asesor envía cotización al cliente para aprobación
Pantallas: Formulario de diagnóstico y cotización dentro de la OT, vista de cotización para el cliente → [Link Figma]
Validaciones: Diagnóstico obligatorio; cotización debe incluir al menos un ítem; cliente debe aprobar/rechazar

⚙️ DISEÑO TÉCNICO
API: PUT /work-orders/{id}/diagnosis, POST /work-orders/{id}/quotation
Base de datos: Tabla work_order_items (id, order_id, tipo: repuesto/mano_obra, descripcion, cantidad, precio_unitario), campo diagnostico en work_orders
Reglas de negocio: Al generar cotización → OT pasa a En Espera de Aprobación; cálculo automático de subtotal, IVA (12%) y total

✅ Criterios de Aceptación
41.	El mecánico puede registrar el diagnóstico técnico detallado.
42.	La cotización debe incluir ítems de repuestos y mano de obra con cantidades y precios.
43.	El sistema debe calcular automáticamente el subtotal, IVA (12%) y total.
44.	El cliente debe poder aprobar o rechazar la cotización desde el portal.

📌 Subtareas
Issue	Actividad	Tipo
NUEVA	Backend: Crear modelo de cotización con ítems (repuestos + mano de obra) y cálculo automático de IVA	Backend
NUEVA	Frontend Mecánico: Formulario de diagnóstico e ingreso de ítems de cotización	Frontend
NUEVA	Frontend Cliente: Vista de cotización con botones Aprobar/Rechazar en el portal	Frontend
NUEVA	Diseñar en Figma: formulario de diagnóstico/cotización (mecánico) y vista de aprobación (cliente)	Diseño UI


SCRUM-46 — HU 2.4: Ejecución de Reparación y Evidencia
Issue	Título	Épica	Asignado a	Prioridad	Estado
SCRUM-46	HU 2.4: Ejecución de Reparación y Evidencia	Épica 2	Danner Alejandro	Medium	POR HACER

📖 Historia de Usuario
Como Mecánico, quiero registrar el avance de la reparación y adjuntar evidencias fotográficas del trabajo realizado, para documentar el proceso y respaldar la calidad del servicio entregado.

🧩 DISEÑO FUNCIONAL
Flujo: Mecánico inicia reparación → OT pasa a En Reparación → mecánico actualiza avance y puede adjuntar fotos/notas → al terminar → OT pasa a En QC
Pantallas: Vista de OT en reparación con campo de notas de avance y opción de adjuntar imagen → [Link Figma]
Validaciones: Solo mecánico asignado puede actualizar; al finalizar reparación se requiere al menos una nota de cierre

⚙️ DISEÑO TÉCNICO
API: PUT /work-orders/{id}/progress (body: { notas, estado }), POST /work-orders/{id}/attachments
Base de datos: Tabla work_order_notes (id, order_id, autor_id, nota, fecha), Tabla work_order_attachments (id, order_id, url_archivo)
Reglas de negocio: OT pasa a En Reparación al iniciar; solo el mecánico asignado puede editar; al finalizar → pasa a estado QC

✅ Criterios de Aceptación
45.	El mecánico puede registrar notas de avance durante la reparación.
46.	Se pueden adjuntar evidencias fotográficas del trabajo.
47.	Al finalizar la reparación, la OT debe pasar automáticamente al estado de Control de Calidad (QC).

📌 Subtareas
Issue	Actividad	Tipo
NUEVA	Backend: Endpoint para registrar notas de progreso y adjuntar imágenes a la OT	Backend
NUEVA	Frontend Mecánico: Vista de OT activa con campo de notas y carga de fotos	Frontend
NUEVA	Diseñar en Figma: vista de reparación activa con evidencias y notas de avance	Diseño UI


SCRUM-47 — HU 2.5: Control de Calidad y Cierre Técnico
Issue	Título	Épica	Asignado a	Prioridad	Estado
SCRUM-47	HU 2.5: Control de Calidad y Cierre Técnico	Épica 2	Danner Alejandro	Medium	POR HACER

📖 Historia de Usuario
Como Jefe de Taller o Asesor, quiero realizar el control de calidad de los trabajos terminados y aprobar el cierre técnico de la OT, para asegurar que el vehículo cumple con los estándares antes de ser entregado al cliente.

🧩 DISEÑO FUNCIONAL
Flujo: Jefe de Taller accede a OTs en estado QC → revisa el trabajo → aprueba (OT pasa a Liberada) o rechaza (regresa a mecánico con observaciones)
Pantallas: Lista de OTs en QC, vista de revisión de QC con checklist y campo de observaciones → [Link Figma]
Validaciones: Solo Jefe de Taller puede aprobar QC; si rechaza debe ingresar observaciones obligatorias

⚙️ DISEÑO TÉCNICO
API: PUT /work-orders/{id}/qc (body: { aprobado: bool, observaciones })
Base de datos: Tabla work_order_qc (id, order_id, inspector_id, aprobado, observaciones, fecha), estado en work_orders → Liberada o En Reparación
Reglas de negocio: Si aprobado=true → OT pasa a Liberada; si aprobado=false → OT regresa a En Reparación con observaciones visibles al mecánico

✅ Criterios de Aceptación
48.	El Jefe de Taller puede aprobar o rechazar el control de calidad.
49.	Si rechaza, debe ingresar observaciones que el mecánico pueda ver.
50.	Al aprobar QC, la OT pasa automáticamente a estado Liberada.

📌 Subtareas
Issue	Actividad	Tipo
NUEVA	Backend: Lógica de aprobación/rechazo de QC con transición de estados	Backend
NUEVA	Frontend Jefe de Taller: Vista de revisión QC con checklist y campo de observaciones	Frontend
NUEVA	Diseñar en Figma: pantalla de control de calidad con checklist y resultado de aprobación	Diseño UI


SCRUM-202 — HU 2.6: Aprobación o Rechazo de Cotización
Issue	Título	Épica	Asignado a	Prioridad	Estado
SCRUM-202	HU 2.6: Aprobación o Rechazo de Cotización	Épica 2	Danner Alejandro	Medium	POR HACER

📖 Historia de Usuario
Como Cliente, quiero revisar la cotización de los trabajos de mi vehículo desde el portal y decidir si apruebo o rechazo el presupuesto, para tener control sobre los gastos antes de que inicien las reparaciones.

🧩 DISEÑO FUNCIONAL
Flujo: Cliente recibe notificación de cotización lista → accede al portal → visualiza desglose de la cotización → pulsa Aprobar o Rechazar → sistema actualiza estado de la OT
Pantallas: Vista de cotización en portal del cliente con desglose de ítems, botones Aprobar/Rechazar → [Link Figma]
Validaciones: Solo el cliente propietario del vehículo puede aprobar/rechazar; acción irreversible con confirmación

⚙️ DISEÑO TÉCNICO
API: PUT /work-orders/{id}/quotation/approve o /reject
Base de datos: Campo estado_cotizacion en work_orders (Pendiente, Aprobada, Rechazada)
Reglas de negocio: Si aprueba → OT pasa a Asignada/En Reparación; si rechaza → generar cobro por diagnóstico (RF-11)

✅ Criterios de Aceptación
51.	El cliente puede visualizar el desglose completo de la cotización.
52.	El cliente puede aprobar o rechazar con confirmación.
53.	Si rechaza, el sistema genera automáticamente el cobro por diagnóstico.

📌 Subtareas
Issue	Actividad	Tipo
NUEVA	Frontend Cliente: Vista de cotización con desglose y botones de acción en el portal	Frontend
NUEVA	Backend: Lógica de aprobación/rechazo con transición de estado y cobro por diagnóstico	Backend
NUEVA	Diseñar en Figma: pantalla de cotización del cliente con desglose y acciones	Diseño UI


SCRUM-186 — HU 2.7: Seguimiento de Estados y Cierre de Orden
Issue	Título	Épica	Asignado a	Prioridad	Estado
SCRUM-186	HU 2.7: Seguimiento de Estados y Cierre de Orden	Épica 2	Danner Alejandro	Medium	POR HACER

📖 Historia de Usuario
Como Asesor de Servicio, quiero visualizar el estado de las órdenes en tiempo real y realizar el cierre administrativo, para informar al cliente sobre el avance y finalizar el ciclo operativo tras confirmar el pago o gestionar un rechazo.

🧩 DISEÑO FUNCIONAL
Flujo: Asesor accede al panel de OTs → filtra por estado → confirma pago → habilita botón Cerrar Orden → OT pasa a Finalizada
Pantallas: Panel de OTs con filtros de estado, vista de detalle de OT con botón de cierre → [Link Figma]
Validaciones: Botón Cerrar Orden solo activo si pago confirmado (presencial o en línea); cierre registra fecha/hora exacta

⚙️ DISEÑO TÉCNICO
API: GET /work-orders?estado={estado}, PUT /work-orders/{id}/close
Base de datos: Campo fecha_cierre (timestamp) en work_orders, estado: Finalizada
Reglas de negocio: Cierre solo si pago confirmado; registrar timestamp exacto; Escenario A: QC aprobado + pago confirmado → Finalizada; Escenario B: cliente rechazó cotización → Finalizada con cobro diagnóstico

✅ Criterios de Aceptación
54.	Filtros de Estado (RF-19): El sistema debe permitir filtrar órdenes por estado: Registrada, En Diagnóstico, En Reparación, QC, Liberada y Finalizada.
55.	Condiciones de Cierre: La orden solo puede pasar a Finalizada si el control de calidad fue aprobado y el pago fue confirmado (Escenario A), o si el cliente rechazó la cotización (Escenario B).
56.	Trazabilidad: El cierre de la orden debe quedar registrado con fecha y hora exacta.
57.	Seguridad: El botón de Cerrar Orden solo debe habilitarse cuando el sistema detecte el pago confirmado.

📌 Subtareas
Issue	Actividad	Tipo
SCRUM-187	Backend: Implementar la lógica de validación que bloquea el cierre si el pago no está registrado	Backend
SCRUM-188	Base de Datos: Asegurar que el campo fecha_cierre capture el timestamp exacto	Backend
NUEVA	Frontend Asesor: Panel de OTs con filtros de estado y botón de cierre condicionado	Frontend
NUEVA	Diseñar en Figma: panel de seguimiento de OTs con filtros y vista de cierre	Diseño UI

 
ÉPICA 3: Control de Inventario y Repuestos (SCRUM-129)
Responsable principal: Herland Daza Corona

SCRUM-51 — HU 3.1: Gestión del Catálogo de Repuestos y Categorías
Issue	Título	Épica	Asignado a	Prioridad	Estado
SCRUM-51	HU 3.1: Gestión del Catálogo de Repuestos y Categorías	Épica 3	Herland Daza Corona	Medium	POR HACER

📖 Historia de Usuario
Como Administrador, quiero registrar repuestos detallando su categoría, costos, márgenes de ganancia y stock inicial, para mantener un control preciso de los insumos disponibles para el taller.

🧩 DISEÑO FUNCIONAL
Flujo: Administrador accede al módulo Inventario → pulsa Nuevo Repuesto → llena formulario con categoría, costo, margen → sistema calcula precio de venta automáticamente → guarda
Pantallas: Tabla de inventario con filtros por categoría y buscador, formulario de nuevo repuesto → [Link Figma]
Validaciones: Categoría obligatoria (7 predefinidas: Filtros, Frenos, Motor, etc.); costo y margen obligatorios; imagen opcional

⚙️ DISEÑO TÉCNICO
API: POST /inventory/parts, GET /inventory/parts?categoria={cat}
Base de datos: Tabla parts (id, nombre, categoria_id, costo, margen_pct, precio_venta, stock_actual, stock_minimo, imagen_url), Tabla categories (id, nombre)
Reglas de negocio: precio_venta = costo * (1 + margen_pct/100); 7 categorías predefinidas; imagen opcional

✅ Criterios de Aceptación
58.	El formulario debe permitir subir una imagen del repuesto (opcional) y asignar una de las 7 categorías predefinidas.
59.	El sistema debe calcular el Precio de Venta automáticamente basándose en el Costo y el Margen (%) ingresado.
60.	Debe existir una vista de tabla que muestre: Repuesto, Categoría, Stock Disponible, Precio de Costo y Precio de Venta.

📌 Subtareas
Issue	Actividad	Tipo
SCRUM-189	Crear el módulo Nuevo Repuesto con validación de campos obligatorios	Frontend
SCRUM-190	Implementar la lógica de cálculo automático de precio de venta según margen	Backend
SCRUM-191	Desarrollar la tabla de inventario con filtros por categoría y buscador de texto	Frontend
NUEVA	Diseñar en Figma: tabla de inventario, formulario de nuevo repuesto y vista de detalle	Diseño UI


SCRUM-52 — HU 3.2: Gestión de Proveedores y Abastecimiento
Issue	Título	Épica	Asignado a	Prioridad	Estado
SCRUM-52	HU 3.2: Gestión de Proveedores y Abastecimiento	Épica 3	Herland Daza Corona	Medium	POR HACER

📖 Historia de Usuario
Como Administrador, quiero registrar y administrar la información de contacto de los proveedores de repuestos, para agilizar el proceso de compra y reposición de materiales agotados.

🧩 DISEÑO FUNCIONAL
Flujo: Administrador accede a módulo Proveedores → pulsa Nuevo Proveedor → llena datos de empresa y contacto → guarda en estado Activo
Pantallas: Vista de tarjetas (cards) de proveedores con estado Activo/Inactivo, formulario de nuevo proveedor → [Link Figma]
Validaciones: Nombre, teléfono y email obligatorios; desactivación lógica (no borrado físico)

⚙️ DISEÑO TÉCNICO
API: POST /suppliers, GET /suppliers, PUT /suppliers/{id}/toggle-status
Base de datos: Tabla suppliers (id, nombre, contacto, telefono, email, productos_que_provee, activo: bool)
Reglas de negocio: Desactivación lógica para mantener integridad referencial; vista en tarjetas con estado visual

✅ Criterios de Aceptación
61.	Se deben poder registrar datos de la empresa: Nombre, Persona de contacto, Teléfono, Email y Productos que provee.
62.	La vista de proveedores debe mostrar tarjetas informativas con el estado Activo o Inactivo.
63.	El sistema debe permitir la edición y desactivación lógica de proveedores para mantener la integridad.

📌 Subtareas
Issue	Actividad	Tipo
SCRUM-192	Crear el formulario de registro de Nuevo Proveedor	Frontend
SCRUM-193	Diseñar la interfaz de tarjetas (cards) para la visualización de proveedores existentes	Frontend/Diseño
NUEVA	Backend: Endpoints CRUD para proveedores con lógica de activación/desactivación	Backend
NUEVA	Diseñar en Figma: vista de tarjetas de proveedores y formulario de registro	Diseño UI


SCRUM-53 — HU 3.3: Control Automático de Stock y Alertas Críticas (RF-18)
Issue	Título	Épica	Asignado a	Prioridad	Estado
SCRUM-53	HU 3.3: Control Automático de Stock y Alertas Críticas (RF-18)	Épica 3	Herland Daza Corona	Medium	POR HACER

📖 Historia de Usuario
Como Administrador, quiero que el sistema gestione automáticamente el inventario de repuestos reservando piezas al aprobar una cotización, descontándolas al ejecutar la reparación y devolviéndolas al stock si el cliente rechaza, para asegurar la disponibilidad de piezas críticas y evitar paros operativos.

🧩 DISEÑO FUNCIONAL
Flujo 1 — Reserva (RF-18): Cliente aprueba cotización → sistema reserva automáticamente los repuestos incluidos → stock disponible disminuye visualmente (pero no se descuenta aún del físico)
Flujo 2 — Descuento (RF-18): Mecánico finaliza reparación → sistema descuenta definitivamente los repuestos reservados del stock físico
Flujo 3 — Devolución (RF-18): Cliente rechaza cotización → sistema libera los repuestos reservados y los devuelve al stock disponible
Flujo 4 — Alerta: Stock de un ítem llega al mínimo → sistema muestra banner de alerta amarilla en el dashboard de inventario
Pantallas: Dashboard de inventario con banner de alerta, contador 'Stock bajo', indicadores de resumen, estado de reservas activas → [Link Figma]
Validaciones: Alerta cuando stock_actual <= stock_minimo; mostrar stock actual vs stock total (ej: 3/28 disponibles); bloquear cotización si no hay stock suficiente

⚙️ DISEÑO TÉCNICO
API: POST /inventory/reserve (al aprobar cotización), POST /inventory/deduct (al finalizar reparación), POST /inventory/release (al rechazar cotización), GET /inventory/alerts
Base de datos: Tabla parts (stock_actual, stock_reservado, stock_minimo); stock_disponible = stock_actual - stock_reservado
Reglas de negocio: (1) Aprobar cotización → incrementar stock_reservado; (2) Finalizar reparación → decrementar stock_actual y stock_reservado; (3) Rechazar cotización → decrementar stock_reservado (devolver); (4) Alerta si stock_disponible <= stock_minimo

✅ Criterios de Aceptación
64.	Al aprobar una cotización, el sistema debe reservar automáticamente los repuestos incluidos, reduciendo el stock disponible (RF-18).
65.	Al ejecutar la reparación, el sistema debe descontar definitivamente los repuestos del stock físico (RF-18).
66.	Si el cliente rechaza la cotización, el sistema debe devolver automáticamente los repuestos reservados al stock disponible (RF-18).
67.	El dashboard de inventario debe mostrar un banner de alerta amarilla cuando un ítem llegue al stock mínimo definido.
68.	Se debe incluir un contador de 'Stock bajo' en las tarjetas superiores del módulo.
69.	Los ítems deben mostrar el stock actual vs el stock total para diferenciar existencias físicas de disponibles.

📌 Subtareas
Issue	Actividad	Tipo
SCRUM-194	Implementar el banner de alerta de stock bajo/agotado con acceso directo al ítem afectado	Frontend
SCRUM-195	Desarrollar los indicadores de resumen (Total repuestos, Valor inventario, Stock bajo)	Frontend
NUEVA	Backend: Lógica de RESERVA de repuestos al aprobar cotización (incrementar stock_reservado)	Backend
NUEVA	Backend: Lógica de DESCUENTO definitivo al finalizar reparación (decrementar stock_actual)	Backend
NUEVA	Backend: Lógica de DEVOLUCIÓN al rechazar cotización (liberar stock_reservado)	Backend
NUEVA	Diseñar en Figma: dashboard con alertas, indicadores, estado de reservas y banner de stock crítico	Diseño UI

 
ÉPICA 4: Pagos y Reportes Financieros (SCRUM-130)
Responsable principal: Herland Daza Corona

SCRUM-55 — HU 4.1: Gestión de Pagos Multi-modal
Issue	Título	Épica	Asignado a	Prioridad	Estado
SCRUM-55	HU 4.1: Gestión de Pagos Multi-modal	Épica 4	Herland Daza Corona (cambiar de Josue)	Medium	POR HACER

📖 Historia de Usuario
Como Asesor de Servicio, quiero registrar los pagos realizados por los clientes mediante diversos métodos (Efectivo, Tarjeta, QR, Transferencia), para liquidar el saldo de la orden de trabajo y permitir la liberación del vehículo.

🧩 DISEÑO FUNCIONAL
Flujo: Asesor accede a OT en estado Liberada → selecciona método de pago → ingresa datos según método → confirma pago → OT queda lista para cierre
Pantallas: Modal o sección de registro de pago en la OT, con selector de método y campos dinámicos → [Link Figma]
Validaciones: Efectivo: ingresar monto recibido; Tarjeta: referencia POS obligatoria; QR/Digital: referencia/escaneo; Transferencia: datos bancarios del taller; IVA 12% incluido en el total

⚙️ DISEÑO TÉCNICO
API: POST /work-orders/{id}/payment
Base de datos: Tabla payments (id, order_id, metodo: Efectivo/Tarjeta/QR/Transferencia, monto, referencia, fecha, confirmado)
Reglas de negocio: Monto total incluye IVA 12%; si el cliente pagó en línea → mostrar banner verde Pago ya confirmado en línea; número de autorización obligatorio para pagos digitales

✅ Criterios de Aceptación
70.	El sistema debe permitir seleccionar el método de pago: Efectivo, Tarjeta (referencia POS), QR/Digital y Transferencia.
71.	Para pagos digitales y transferencias, debe ser obligatorio ingresar el Número de autorización / referencia.
72.	Si el sistema detecta un pago realizado por el cliente desde el portal, debe mostrar el banner verde: Pago ya confirmado en línea.
73.	El monto total debe incluir el cálculo del IVA (12%).

📌 Subtareas
Issue	Actividad	Tipo
SCRUM-196	Implementar la validación de campos obligatorios (referencia/comprobante)	Backend
SCRUM-197	Desarrollar los modales de pago para cada método	Frontend
NUEVA	Backend: Endpoint POST /payment con lógica de cada método de pago	Backend
NUEVA	Diseñar en Figma: modal de registro de pago con campos dinámicos por método	Diseño UI


SCRUM-56 — HU 4.2: Generación Automática de Factura (PDF)
Issue	Título	Épica	Asignado a	Prioridad	Estado
SCRUM-56	HU 4.2: Generación Automática de Factura (PDF)	Épica 4	Herland Daza Corona (cambiar de Josue)	Medium	POR HACER

📖 Historia de Usuario
Como Sistema / Cliente, quiero generar y descargar el comprobante legal de la transacción en formato PDF, para mantener un registro formal de los gastos y servicios realizados en el vehículo.

🧩 DISEÑO FUNCIONAL
Flujo: Pago confirmado → sistema genera factura PDF automáticamente → cliente puede acceder desde Mis Facturas en el portal
Pantallas: Sección Mis Facturas en el portal del cliente con historial descargable → [Link Figma]
Validaciones: Factura generada solo al confirmar pago; formato profesional con desglose completo

⚙️ DISEÑO TÉCNICO
API: GET /work-orders/{id}/invoice → devuelve PDF
Base de datos: Tabla invoices (id, order_id, payment_id, fecha, total, iva, url_pdf)
Reglas de negocio: Generación automática al confirmar pago; incluir: Repuestos, Mano de Obra, Subtotal, IVA y Total; accesible desde Mis Facturas

✅ Criterios de Aceptación
74.	La factura debe generarse automáticamente al momento de confirmar el pago.
75.	Debe incluir el desglose detallado: Repuestos, Mano de Obra, Subtotal, IVA y Total.
76.	El cliente debe poder acceder a su historial desde el menú lateral Mis Facturas.
77.	El documento debe tener un formato profesional.

📌 Subtareas
Issue	Actividad	Tipo
SCRUM-198	Diseñar la plantilla de factura legal en PDF con los campos requeridos por el RF-15	Frontend/Diseño
SCRUM-199	Habilitar la descarga del archivo desde el portal del cliente y el panel del asesor	Frontend
NUEVA	Backend: Lógica de generación automática de factura PDF al confirmar pago	Backend
NUEVA	Diseñar en Figma: plantilla de factura y sección Mis Facturas en el portal	Diseño UI


SCRUM-57 — HU 4.3: Reportes de Ingresos y Productividad
Issue	Título	Épica	Asignado a	Prioridad	Estado
SCRUM-57	HU 4.3: Reportes de Ingresos y Productividad	Épica 4	Herland Daza Corona (cambiar de Josue)	Medium	POR HACER

📖 Historia de Usuario
Como Administrador, quiero visualizar estadísticas de ingresos y productividad de los mecánicos, para analizar el rendimiento económico del negocio y la eficiencia del personal.

🧩 DISEÑO FUNCIONAL
Flujo: Administrador accede al módulo de Reportes → selecciona rango de fechas → visualiza dashboard con indicadores de ingresos y productividad por mecánico
Pantallas: Dashboard de reportes con gráficas de ingresos, tabla de productividad por mecánico, filtros de fecha → [Link Figma]
Validaciones: Acceso exclusivo para rol Administrador; filtros de fecha obligatorios para consultas

⚙️ DISEÑO TÉCNICO
API: GET /reports/revenue?from={fecha}&to={fecha}, GET /reports/productivity
Base de datos: Consultas agregadas sobre work_orders, payments y staff
Reglas de negocio: Solo rol Administrador puede acceder; mostrar valor total del inventario e ingresos por servicios en rango de fechas; resumen de OTs finalizadas por mecánico

✅ Criterios de Aceptación
78.	El Administrador debe poder ver el Valor total del inventario y los ingresos por servicios en un rango de fechas.
79.	Debe mostrarse un resumen de productividad (ej. cuántas OTs finalizó cada mecánico).
80.	El acceso a este módulo es exclusivo para el rol de Administrador.

📌 Subtareas
Issue	Actividad	Tipo
SCRUM-206	Crear el dashboard de reportes con indicadores clave	Frontend
SCRUM-207	Implementar filtros de fecha para las consultas financieras	Frontend/Backend
NUEVA	Backend: Endpoints de consultas agregadas para ingresos y productividad por mecánico	Backend
NUEVA	Diseñar en Figma: dashboard de reportes con gráficas de ingresos y tabla de productividad	Diseño UI
