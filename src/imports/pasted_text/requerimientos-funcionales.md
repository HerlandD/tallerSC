# 📄 🔷 REQUERIMIENTOS FUNCIONALES MEJORADOS Y EXPANDIDOS

---

## 🔵 MÓDULO: CLIENTES

### RF-01: Registro de Clientes

| Campo       | Descripción                                                                                  |
| ----------- | -------------------------------------------------------------------------------------------- |
| Código      | RF-01                                                                                        |
| Nombre      | Registro de Clientes                                                                         |
| Descripción | El sistema debe permitir registrar clientes con sus datos personales para su identificación. |
| Actor       | Asesor de servicio                                                                           |
| Entradas    | Nombre, CI, Teléfono, Dirección                                                              |
| Salidas     | Cliente registrado                                                                           |

---

### RF-02: Actualización de Clientes

| Campo       | Descripción                                                               |
| ----------- | ------------------------------------------------------------------------- |
| Código      | RF-02                                                                     |
| Nombre      | Actualización de Clientes                                                 |
| Descripción | El sistema debe permitir modificar los datos de los clientes registrados. |
| Actor       | Asesor de servicio                                                        |
| Entradas    | Datos actualizados                                                        |
| Salidas     | Cliente actualizado                                                       |

---

### RF-03: Consulta de Clientes

| Campo       | Descripción                                            |
| ----------- | ------------------------------------------------------ |
| Código      | RF-03                                                  |
| Nombre      | Consulta de Clientes                                   |
| Descripción | Permite consultar información de clientes registrados. |
| Actor       | Asesor de servicio / Administrador                     |
| Entradas    | CI, Nombre                                             |
| Salidas     | Datos del cliente                                      |

---

## 🔵 MÓDULO: VEHÍCULOS

### RF-04: Registro de Vehículos

| Campo       | Descripción                                         |
| ----------- | --------------------------------------------------- |
| Código      | RF-04                                               |
| Nombre      | Registro de Vehículos                               |
| Descripción | Permite registrar vehículos asociados a un cliente. |
| Actor       | Asesor de servicio                                  |
| Entradas    | Placa, Marca, Modelo, Año                           |
| Salidas     | Vehículo registrado                                 |

---

### RF-05: Consulta de Vehículos

| Campo       | Descripción                                 |
| ----------- | ------------------------------------------- |
| Código      | RF-05                                       |
| Nombre      | Consulta de Vehículos                       |
| Descripción | Permite consultar información de vehículos. |
| Actor       | Asesor / Mecánico                           |
| Entradas    | Placa                                       |
| Salidas     | Datos del vehículo                          |

---

## 🔵 MÓDULO: ÓRDENES DE TRABAJO

### RF-06: Creación de Orden de Trabajo

| Campo       | Descripción                                                       |
| ----------- | ----------------------------------------------------------------- |
| Código      | RF-06                                                             |
| Nombre      | Crear Orden de Trabajo                                            |
| Descripción | Permite registrar una orden de trabajo con el problema reportado. |
| Actor       | Asesor de servicio                                                |
| Entradas    | Cliente, Vehículo, Descripción del problema                       |
| Salidas     | Orden creada                                                      |

---

### RF-07: Asignación de Orden

| Campo       | Descripción                              |
| ----------- | ---------------------------------------- |
| Código      | RF-07                                    |
| Nombre      | Asignación de Orden                      |
| Descripción | Permite asignar una orden a un mecánico. |
| Actor       | Administrador / Asesor                   |
| Entradas    | Orden, Mecánico                          |
| Salidas     | Orden asignada                           |

---

### RF-08: Consulta de Órdenes

| Campo       | Descripción                                       |
| ----------- | ------------------------------------------------- |
| Código      | RF-08                                             |
| Nombre      | Consulta de Órdenes                               |
| Descripción | Permite consultar órdenes de trabajo registradas. |
| Actor       | Administrador / Asesor                            |
| Entradas    | Número de orden                                   |
| Salidas     | Información de la orden                           |

---

## 🔵 MÓDULO: DIAGNÓSTICO Y REPARACIÓN

### RF-09: Registro de Diagnóstico

| Campo       | Descripción                                            |
| ----------- | ------------------------------------------------------ |
| Código      | RF-09                                                  |
| Nombre      | Registro de Diagnóstico                                |
| Descripción | Permite registrar el diagnóstico técnico del vehículo. |
| Actor       | Mecánico                                               |
| Entradas    | Descripción del diagnóstico                            |
| Salidas     | Diagnóstico registrado                                 |

---

### RF-10: Registro de Reparación

| Campo       | Descripción                                                 |
| ----------- | ----------------------------------------------------------- |
| Código      | RF-10                                                       |
| Nombre      | Registro de Reparación                                      |
| Descripción | Permite registrar las actividades de reparación realizadas. |
| Actor       | Mecánico                                                    |
| Entradas    | Servicios realizados                                        |
| Salidas     | Reparación registrada                                       |

---

### RF-11: Actualización de Estado

| Campo       | Descripción                                                              |
| ----------- | ------------------------------------------------------------------------ |
| Código      | RF-11                                                                    |
| Nombre      | Actualización de Estado                                                  |
| Descripción | Permite actualizar el estado de la orden (en proceso, finalizado, etc.). |
| Actor       | Mecánico                                                                 |
| Entradas    | Estado                                                                   |
| Salidas     | Estado actualizado                                                       |

---

## 🔵 MÓDULO: CLIENTE (VISIBILIDAD)

### RF-12: Consulta de Estado del Vehículo

| Campo       | Descripción                                             |
| ----------- | ------------------------------------------------------- |
| Código      | RF-12                                                   |
| Nombre      | Consulta de Estado                                      |
| Descripción | Permite al cliente visualizar el estado de su vehículo. |
| Actor       | Cliente                                                 |
| Entradas    | Número de orden                                         |
| Salidas     | Estado del vehículo                                     |

---

### RF-13: Consulta de Historial

| Campo       | Descripción                                                 |
| ----------- | ----------------------------------------------------------- |
| Código      | RF-13                                                       |
| Nombre      | Historial de Servicios                                      |
| Descripción | Permite al cliente consultar el historial de mantenimiento. |
| Actor       | Cliente                                                     |
| Entradas    | Vehículo                                                    |
| Salidas     | Historial                                                   |

---

## 🔵 MÓDULO: INVENTARIO

### RF-14: Registro de Repuestos

| Campo       | Descripción                                   |
| ----------- | --------------------------------------------- |
| Código      | RF-14                                         |
| Nombre      | Registro de Repuestos                         |
| Descripción | Permite registrar repuestos en el inventario. |
| Actor       | Gestor de almacén                             |
| Entradas    | Nombre, Cantidad, Precio                      |
| Salidas     | Repuesto registrado                           |

---

### RF-15: Control de Inventario

| Campo       | Descripción                               |
| ----------- | ----------------------------------------- |
| Código      | RF-15                                     |
| Nombre      | Control de Inventario                     |
| Descripción | Permite actualizar el stock de repuestos. |
| Actor       | Gestor de almacén                         |
| Entradas    | Cantidad                                  |
| Salidas     | Stock actualizado                         |

---

### RF-16: Salida de Repuestos

| Campo       | Descripción                                                      |
| ----------- | ---------------------------------------------------------------- |
| Código      | RF-16                                                            |
| Nombre      | Salida de Repuestos                                              |
| Descripción | Permite registrar la salida de repuestos usados en reparaciones. |
| Actor       | Mecánico / Gestor                                                |
| Entradas    | Repuesto, cantidad                                               |
| Salidas     | Inventario actualizado                                           |

---

## 🔵 MÓDULO: SEGURIDAD

### RF-17: Autenticación de Usuarios

| Campo       | Descripción                                                      |
| ----------- | ---------------------------------------------------------------- |
| Código      | RF-17                                                            |
| Nombre      | Inicio de Sesión                                                 |
| Descripción | Permite a los usuarios acceder al sistema mediante credenciales. |
| Actor       | Todos                                                            |
| Entradas    | Usuario, Contraseña                                              |
| Salidas     | Acceso al sistema                                                |

---

### RF-18: Gestión de Usuarios

| Campo       | Descripción                                   |
| ----------- | --------------------------------------------- |
| Código      | RF-18                                         |
| Nombre      | Gestión de Usuarios                           |
| Descripción | Permite administrar los usuarios del sistema. |
| Actor       | Administrador                                 |
| Entradas    | Datos del usuario                             |
| Salidas     | Usuario creado/modificado                     |

---