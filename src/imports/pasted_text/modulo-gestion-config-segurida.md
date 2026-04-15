#### *MÓDULO 1: GESTIÓN DE CONFIGURACIÓN Y SEGURIDAD*
Actor Principal: Administrador

- *CU-01: Gestionar Personal*
    - Descripción: Permite registrar, modificar y desactivar al personal del taller (Asesores, Técnicos, etc.).
    - Relación RF: RF-001
- *CU-02: Gestionar Usuarios y Roles*
    - Descripción: Permite crear cuentas de acceso al sistema y asignar permisos específicos según el rol del usuario (Administrador, Asesor, etc.).
    - Relación RF: RF-002, RF-023
- *CU-03: Gestionar Catálogos Maestros*
    - Descripción: Permite administrar las listas base del sistema: Marcas/Modelos de autos (RF-011), Tipos de Servicio (RF-012), Motivos de Ingreso (RF-030), Métodos de Pago (RF-031), etc.
    - Relación RF: RF-011, RF-012, RF-030, RF-031

#### *MÓDULO 2: GESTIÓN DE CLIENTES Y CITAS*
Actor Principal: Asesor de Servicio

- *CU-04: Gestionar Clientes*
    - Descripción: Permite registrar un nuevo cliente o buscar/actualizar los datos de uno existente.
    - Relación RF: RF-003
- *CU-05: Gestionar Vehículos*
    - Descripción: Permite registrar un nuevo vehículo y asociarlo a un cliente. Permite consultar el historial de un vehículo (CU-24).
    - Relación RF: RF-004, RF-028
- *CU-06: Agendar Cita*
    - Descripción: Permite crear una cita seleccionando cliente, vehículo, servicio y franja horaria, evitando la sobreposición.
    - Relación RF: RF-005
- *CU-07: Reprogramar/Cancelar Cita*
    - Descripción: Permite modificar o anular una cita existente. El sistema debe notificar al cliente el cambio.
    - Relación RF: RF-005
- *CU-08: Enviar Recordatorios de Cita*
    - Descripción: (Automatizado por el sistema) Envía un recordatorio al cliente 24h antes de la cita.
    - Relación RF: RF-006

#### *MÓDULO 3: GESTIÓN DE ORDEN DE SERVICIO Y RECEPCIÓN*
Actor Principal: Asesor de Servicio

- *CU-09: Crear Orden de Servicio (OS)*
    - Descripción: Crea el documento principal del proceso. Puede generarse a partir de una cita confirmada o en "caliente" cuando un cliente llega sin cita.
    - Relación RF: RF-007
- *CU-10: Realizar Recepción Activa*
    - Descripción: Registrar el estado de entrada del vehículo: kilometraje, nivel de combustible, estado de fluidos. Es el momento de la "transferencia de responsabilidad".
    - Relación RF: RF-008
- *CU-11: Documentar Daños Preexistentes*
    - Descripción: Registrar observaciones sobre golpes o rayones y adjuntar fotos como evidencia visual.
    - Relación RF: RF-009, RF-010
- *CU-12: Registrar Inventario del Vehículo*
    - Descripción: Listar los objetos de valor que el cliente deja en el auto (llanta de repuesto, herramientas, etc.).
    - Relación RF: RF-009

#### *MÓDULO 4: GESTIÓN DE DIAGNÓSTICO Y COTIZACIÓN*
Actores Principales: Técnico, Asesor de Servicio

- *CU-13: Asignar Técnico*
    - Descripción: El Jefe de Taller o Asesor asigna un técnico específico a la OS para que realice el diagnóstico.
    - Relación RF: RF-013
- *CU-14: Realizar Diagnóstico*
    - Descripción: El técnico registra el hallazgo detallado para cada falla reportada por el cliente.
    - Relación RF: RF-014
- *CU-15: Reportar Nueva Falla*
    - Descripción: Si durante el diagnóstico se encuentra un problema adicional, el técnico lo registra como una "nueva falla" para su posterior evaluación.
    - Relación RF: RF-015
- *CU-16: Generar Presupuesto*
    - Descripción: El asesor (o técnico) crea un presupuesto detallado. Incluye líneas de repuestos (desde catálogo) y líneas de mano de obra (horas * tarifa).
    - Relación RF: RF-017
- *CU-17: Enviar Presupuesto a Cliente*
    - Descripción: El asesor envía el presupuesto al cliente vía WhatsApp/Email a través del sistema. El sistema genera un enlace seguro.
    - Relación RF: RF-018
- *CU-18: Aprobar/Rechazar Presupuesto*
    - Descripción: (Realizado por el Cliente) El cliente accede al enlace, revisa y aprueba o rechaza el presupuesto. El sistema registra la acción.
    - Relación RF: RF-019
- *CU-19: Registrar Rechazo de Reparación (Constancia Legal)*
    - Descripción: Si el cliente rechaza una reparación crítica, el asesor deja una constancia formal en el sistema, notificando que el cliente fue advertido del riesgo.
    - Relación RF: RF-020

#### *MÓDULO 5: GESTIÓN DE TALLER Y REPARACIÓN*
Actores Principales: Jefe de Taller, Técnico, Encargado de Almacén

- *CU-20: Gestionar Proveedores*
    - Descripción: Permite al administrador o encargado de almacén dar de alta a los proveedores de repuestos.
    - Relación RF: RF-023
- *CU-21: Gestionar Repuestos (Catálogo e Inventario Físico)*
    - Descripción: Permite al encargado de almacén gestionar el catálogo de repuestos y controlar las existencias (Entradas por compra y Salidas por reparación).
    - Relación RF: RF-016, RF-021, RF-022
- *CU-22: Ejecutar Reparación*
    - Descripción: El técnico, una vez aprobado el presupuesto, realiza el trabajo. Puede marcar tareas como "completadas" y registrar el tiempo real invertido (RF-024).
    - Relación RF: RF-024
- *CU-23: Solicitar Repuestos desde la OS*
    - Descripción: El técnico, a través de la OS, puede solicitar los repuestos necesarios, lo que genera una alerta para el almacén.
    - Relación RF: RF-022
- *CU-24: Realizar Control de Calidad*
    - Descripción: El Jefe de Taller verifica que la reparación se haya realizado correctamente y registra la prueba de ruta.
    - Relación RF: RF-025

#### *MÓDULO 6: GESTIÓN DE ENTREGA Y CIERRE*
Actor Principal: Asesor de Servicio

- *CU-25: Generar Orden de Entrega*
    - Descripción: Una vez finalizado el control de calidad, se genera el documento de entrega que resume todo el trabajo realizado.
    - Relación RF: RF-026
- *CU-26: Gestionar Entrega y Firma Digital*
    - Descripción: El asesor presenta el vehículo y la orden de entrega al cliente. El cliente firma digitalmente en un dispositivo móvil/tablet, dando su conformidad final. Esto cierra el ciclo de la OS.
    - Relación RF: RF-027

#### *MÓDULO 7: GESTIÓN DE REPORTES Y AUDITORÍA*
Actor Principal: Administrador

- *CU-27: Visualizar Dashboard de Productividad*
    - Descripción: El administrador puede ver en tiempo real KPIs (métricas) del taller: órdenes abiertas, tiempo de reparación, técnicos más productivos, etc.
    - Relación RF: RF-029
- *CU-28: Auditar Trazabilidad de una OS*
    - Descripción: El administrador puede consultar el historial completo de cambios y acciones realizadas sobre cualquier Orden de Servicio para fines legales o de mejora.
    - Relación RF: RNF-06 (Auditabilidad)