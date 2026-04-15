Perfecto 👨‍💻 — ahora sí vamos a llevar esto a **nivel ingeniería de especificación real (tipo ERS bien hecho)**.

Voy a hacer lo que te falta:
✔ Descripciones **operativas (qué pasa paso a paso)**
✔ Reglas de negocio claras
✔ Qué datos intervienen
✔ Qué valida el sistema
✔ Qué resultado produce

Esto ya te sirve directo para **programar en Bottle + base de datos**.

---

# 📘 ESPECIFICACIÓN DE REQUERIMIENTOS FUNCIONALES (DETALLADA Y PRECISA)

---

## 🔐 RF-01: Gestión Integral de Seguridad y Usuarios

**Actor:** Administrador

**Descripción detallada:**
El sistema debe permitir el acceso mediante autenticación con usuario y contraseña. Cada usuario pertenece a un rol (Cliente, Asesor, Mecánico, Jefe de Taller, Administrador), lo cual determina los permisos sobre el sistema.

El Administrador podrá:

* Crear usuarios ingresando: nombre, CI, rol, correo, contraseña
* Editar datos de usuarios existentes
* Desactivar usuarios (no eliminar físicamente para mantener integridad histórica)

El sistema deberá:

* Validar credenciales al iniciar sesión
* Restringir acceso según rol
* Registrar en un log: usuario, acción realizada, fecha y hora

**Reglas de negocio:**

* No pueden existir usuarios duplicados por CI
* Un usuario inactivo no puede iniciar sesión

**Resultado esperado:**
Control total de acceso y trazabilidad de acciones dentro del sistema.

---

## 👤 RF-02: Gestión Unificada de Clientes y Vehículos

**Actor:** Asesor / Cliente

**Descripción detallada:**
El Asesor registra clientes ingresando:

* CI/NIT
* Nombre completo
* Teléfono
* Correo

Luego registra vehículos asociados:

* Placa
* Marca
* Modelo
* Año
* Color

Un cliente puede tener múltiples vehículos.

El Cliente desde su panel puede:

* Visualizar la lista de sus vehículos
* Seleccionar un vehículo
* Consultar su historial completo (órdenes, fechas, servicios, costos)

**Reglas de negocio:**

* No puede existir una placa duplicada
* Todo vehículo debe estar asociado a un cliente

**Resultado esperado:**
Trazabilidad completa del historial del vehículo.

---

## 📅 RF-03: Gestión de Citas y Admisión

**Actor:** Cliente / Asesor

**Descripción detallada:**
El Cliente puede solicitar una cita seleccionando:

* Vehículo
* Fecha
* Motivo del servicio

El Asesor puede:

* Confirmar la cita
* Reprogramar fecha
* Cancelar cita

Cuando el cliente llega al taller:

* El Asesor selecciona la cita
* Registra observaciones iniciales
* Genera una Orden de Trabajo (OT)

**Reglas de negocio:**

* No se puede generar OT sin cliente y vehículo
* Una cita solo puede convertirse en una OT una vez

**Resultado esperado:**
Control organizado del ingreso de vehículos al taller.

---

## 🧾 RF-04: Gestión de Órdenes de Trabajo (OT)

**Actor:** Asesor / Jefe de Taller

**Descripción detallada:**
La OT se crea con:

* ID único
* Cliente
* Vehículo
* Descripción de fallas

El Jefe de Taller:

* Asigna uno o varios mecánicos
* Puede reasignar si es necesario

El sistema controla estados:

1. REGISTRADA
2. EN DIAGNÓSTICO
3. ESPERA APROBACIÓN
4. EN REPARACIÓN
5. CONTROL DE CALIDAD
6. FINALIZADA

**Reglas de negocio:**

* No se puede avanzar de estado sin cumplir el anterior
* Solo el Jefe puede asignar mecánicos

**Resultado esperado:**
Control total del flujo operativo del servicio.

---

## 🔍 RF-05: Diagnóstico y Presupuesto

**Actor:** Mecánico / Sistema

**Descripción detallada:**
El Mecánico registra:

* Descripción técnica de la falla
* Observaciones
* Repuestos necesarios
* Tiempo estimado

El sistema automáticamente:

* Calcula costo de mano de obra
* Suma costos de repuestos
* Genera total del presupuesto

Luego cambia estado a: **ESPERA APROBACIÓN**

**Reglas de negocio:**

* No se puede generar presupuesto sin diagnóstico
* Todos los costos deben ser numéricos positivos

**Resultado esperado:**
Presupuesto claro, preciso y sin errores manuales.

---

## ⚙️ RF-06: Gestión Automatizada de Repuestos

**Actor:** Sistema / Administrador

**Descripción detallada:**
Cuando el mecánico define repuestos:

El sistema:

1. Consulta stock disponible
2. Verifica si hay cantidad suficiente

Luego:

👉 Si cliente APRUEBA:

* Se reserva el stock
* Se descuenta del inventario

👉 Si cliente RECHAZA:

* No se descuenta nada
* Si hubo reserva previa, se libera automáticamente

El Administrador:

* Registra entradas de stock
* Ajusta cantidades manualmente
* Recibe alertas de stock bajo

**Reglas de negocio:**

* No se puede aprobar reparación sin stock suficiente
* El stock nunca puede ser negativo

**Resultado esperado:**
Consistencia total del inventario sin conflictos.

---

## ✅ RF-07: Aprobación del Cliente

**Actor:** Cliente

**Descripción detallada:**
El Cliente visualiza:

* Diagnóstico
* Lista de repuestos
* Costos detallados

Puede:

* Aprobar → continúa a reparación
* Rechazar → se genera cobro de diagnóstico

**Reglas de negocio:**

* No se puede reparar sin aprobación
* El diagnóstico siempre es cobrable si se rechaza

**Resultado esperado:**
Control legal y operativo del servicio.

---

## 🔧 RF-08: Ejecución de Reparación

**Actor:** Mecánico

**Descripción detallada:**
El Mecánico:

* Ejecuta las tareas asignadas
* Registra avances
* Marca tareas como completadas

El sistema mantiene el estado: **EN REPARACIÓN**

**Reglas de negocio:**

* No se puede cerrar OT sin completar tareas

**Resultado esperado:**
Seguimiento técnico del trabajo realizado.

---

## 🧪 RF-09: Control de Calidad

**Actor:** Jefe de Taller

**Descripción detallada:**
El Jefe de Taller:

* Verifica que todas las tareas estén completas
* Revisa calidad del trabajo

Puede:

* Aprobar → pasa a “LISTO”
* Rechazar → vuelve a reparación

**Reglas de negocio:**

* No se puede liberar vehículo con tareas pendientes

**Resultado esperado:**
Garantía de calidad del servicio.

---

## 💳 RF-10: Facturación y Pagos

**Actor:** Cliente / Sistema

**Descripción detallada:**
El Cliente puede:

* Ver detalle de la deuda
* Realizar pago

El sistema:

* Registra pago
* Genera factura
* Marca OT como pagada

**Reglas de negocio:**

* No se entrega vehículo sin pago
* El monto debe coincidir con el presupuesto aprobado

**Resultado esperado:**
Control financiero completo.

---

## 🔔 RF-11: Notificaciones

**Actor:** Sistema

**Descripción detallada:**
El sistema envía notificaciones cuando:

* Cambia el estado de la OT
* Se requiere aprobación
* El vehículo está listo

**Resultado esperado:**
Comunicación automatizada y eficiente.

---

## 📦 RF-12: Cierre de Orden

**Actor:** Asesor / Sistema

**Descripción detallada:**
El Asesor:

* Entrega el vehículo

El sistema:

* Marca OT como FINALIZADA
* Registra todos los datos en historial

**Reglas de negocio:**

* No se puede cerrar sin pago registrado

**Resultado esperado:**
Cierre formal del servicio.

---

## 📊 RF-13: Reportes

**Actor:** Administrador

**Descripción detallada:**
El sistema genera reportes de:

* Servicios realizados
* Ingresos
* Tiempos de reparación

**Resultado esperado:**
Soporte para toma de decisiones.

---

# 🔥 CONCLUSIÓN (IMPORTANTE)

Ahora sí tienes:

✔ Requerimientos **claros, operativos y programables**
✔ Cada uno con:

* validaciones
* reglas
* flujo
* resultado

✔ Esto ya se puede convertir directamente en:

* Tablas SQL
* Endpoints en Bottle
* Diagramas UML

---

Si quieres el siguiente nivel (esto ya sería PRO total):

👉 Te traduzco esto a **modelo de base de datos completo (normalizado)**
👉 O a **código base en Bottle con rutas reales**

Solo dime: **“haz la base de datos”** 🚀
