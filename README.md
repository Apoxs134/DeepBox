# DeepBox · Sistema de Creación y Administración de Órdenes de Pago

Challenge FullStack / Backend C# para la creación y administración de órdenes de pago conectadas a pasarelas externas con enrutamiento inteligente basado en la menor comisión.

---

## 1. Contexto y Objetivo

El sistema permite crear, consultar y administrar órdenes de pago. El **Web API de Pagos** actúa como orquestador central conectándose a proveedores de servicio de pago subyacentes externos (*PagaFacil* y *CazaPagos*), que son quienes procesan las transacciones.

El sistema soporta múltiples proveedores y selecciona automáticamente el **proveedor óptimo con el menor costo de comisión** según el monto total y el método de pago seleccionado.

---

## 2. Alcance del Proyecto

| Perfil | Entregables |
| :--- | :--- |
| **FullStack** | Aplicación Web (ReactJS) + Web API en C# (.NET Core). |
| **Solo Backend** | Implementación del Web API en C# (.NET Core). |

### Fuera de Alcance
- **Bases de datos relacionales/NoSQL obligatorias**: Se permite el almacenamiento en memoria (`InMemory`, diccionarios, colecciones o `EF Core In-Memory`) para productos, órdenes y datos de control.
- **Mecanismos de autenticación complejos**: No es obligatorio implementar login/JWT para la Web App y API propia, aunque se valora si se incluye.

---

## 3. Catálogo de Productos Inicial

| Producto | Especificaciones / Detalles | Estado | Precio Unitario |
| :--- | :--- | :--- | :--- |
| **Dell Inspiron 5050** | 32Gb / 512 SSD / i7 2.2Ghz | `Available` | $2,350.00 |
| **Lenovo 3450** | 16Gb / 512 SSD / i5 1.6Ghz | `Available` | $2,509.00 |
| **Desk Flexible** | 4 Positions | `Available` | $3,578.00 |
| **Headset 450p** | Logitech / Active Noise Can | `Not Available` | $459.00 |

> **Regla de Negocio UI**: Los productos con estado `Not Available` no deben permitir ser seleccionados para una orden.

---

## 4. Reglas de Negocio: Selección del Proveedor Óptimo

Dado el monto de la orden y la modalidad de pago seleccionada, se calcula la comisión de cada proveedor disponible y se enruta hacia el de menor costo.

| Proveedor | Modalidad de Pago | Regla de Comisión |
| :--- | :--- | :--- |
| **PagaFacil** | Pago en efectivo (`Cash`) | $15.00 MXN por transacción (fijo) |
| **PagaFacil** | Tarjeta de crédito (`CreditCard`) | 1% del monto de la transacción |
| **CazaPagos** | Tarjeta de crédito (`CreditCard`) | • De $0 a $1,500.00 &rarr; **2.0%**<br>• Más de $1,500.00 hasta $5,000.00 &rarr; **1.5%**<br>• Mayor a $5,000.00 &rarr; **0.5%** |
| **CazaPagos** | Transferencia (`Transfer`) | • De $0 a $500.00 &rarr; **$5.00 MXN** fijo<br>• Más de $500.00 hasta $1,000.00 &rarr; **2.5%**<br>• Mayor a $1,000.00 &rarr; **2.0%** |

> **Nota de Cobertura**:
> - **Efectivo** solo es soportado por **PagaFacil**.
> - **Transferencia** solo es soportado por **CazaPagos**.
> - **Tarjeta de Crédito** es soportado por ambos, compitiendo activamente por el menor costo según el monto.

---

## 5. Proveedores de Pago Subyacentes

Las pasarelas son APIs REST externas independientes accesibles mediante HTTP.

* **Autenticación**: Header HTTP `x-api-key: "apikey-1cnmoisyhkif2s"`
* **Endpoints Swagger**:
  * **PagaFacil**: [https://app-paga-chg-aviva.azurewebsites.net/swagger](https://app-paga-chg-aviva.azurewebsites.net/swagger)
  * **CazaPagos**: [https://app-caza-chg-aviva.azurewebsites.net/swagger](https://app-caza-chg-aviva.azurewebsites.net/swagger)
* **Operaciones Soportadas**:
  1. Crear orden
  2. Obtener lista de órdenes
  3. Obtener detalle de una orden
  4. Cancelar orden
  5. Pagar orden (marcar como pagada)

---

## 6. Requerimientos Funcionales

### 6.1 Web API de Pagos (Backend)

| ID | Requerimiento | Descripción |
| :--- | :--- | :--- |
| **RF-01** | **Crear orden** | Calcula comisiones, selecciona el proveedor óptimo, crea la orden en dicho proveedor y almacena la orden localmente con la referencia externa. |
| **RF-02** | **Obtener listado de órdenes** | Retorna órdenes registradas, propagando consulta/estados con los proveedores según corresponda. |
| **RF-03** | **Obtener información de una orden** | Detalle completo de la orden (monto, comisiones aplicadas, productos, proveedor asignado, estado). |
| **RF-04** | **Cancelar una orden** | Cancela la orden localmente y propaga la cancelación al proveedor subyacente. |
| **RF-05** | **Pagar una orden** | Marca la orden como pagada y propaga el evento al proveedor subyacente. |

*Regla general: Todas las operaciones del Web API deben propagarse al proveedor óptimo subyacente correspondiente.*

### 6.2 Aplicación Web (Frontend)

| ID | Requerimiento | Descripción |
| :--- | :--- | :--- |
| **RF-06** | **Catálogo de Productos** | Tabla interactiva de productos con checkboxes para selección múltiple y botón *"Create Order"*. |
| **RF-07** | **Grid de Órdenes Creadas** | Visualización tabular de las órdenes procesadas con sus estados, proveedor seleccionado y totales. |
| **RF-08** | **Cancelar Orden desde Grid** | Acción en la tabla para cancelar órdenes activas. |
| **RF-09** | **Flujo de Confirmación / Creación** | Pantalla de confirmación con detalle de productos seleccionados, selector único de método de pago (*Efectivo*, *Tarjeta*, *Transferencia*) y botón *"Confirmar"*. |
| **RF-10** | **Detalle de Orden desde Grid** | Modal o vista de detalle completo con desglose de ítems, comisiones desglosadas y datos de control. |

---

## 7. Contratos del API (Propuesta de Payloads)

### Request: Crear Orden (`POST /api/orders`)
```json
{
  "paymentMode": "Cash",
  "products": [
    { "name": "Laptop Lenovo", "unitPrice": 2221.00 },
    { "name": "Laptop Dell", "unitPrice": 1200.00 }
  ]
}
```

### Response: Orden Creada (`201 Created`)
```json
{
  "orderId": 12342,
  "externalOrderId": "EXT-98765",
  "provider": "PagaFacil",
  "paymentMode": "Cash",
  "amount": 3421.00,
  "status": "Created",
  "fees": [
    { "name": "Fixed Transaction Fee", "amount": 15.00 }
  ],
  "products": [
    { "name": "Laptop Lenovo", "unitPrice": 2221.00 },
    { "name": "Laptop Dell", "unitPrice": 1200.00 }
  ],
  "createdAt": "2026-04-10T14:30:00Z"
}
```

---

## 8. Arquitectura y Requerimientos No Funcionales

- **Arquitectura Limpia / En Capas**: Separación clara de responsabilidades:
  - `Api` / `Presentation`: Controladores REST, DTOs, filtros y Swagger.
  - `Core` / `Application`: Casos de uso, orquestación, lógica de comisiones, validaciones.
  - `Domain`: Entidades, enumeraciones, interfaces de repositorio y servicios de proveedores.
  - `Infrastructure`: Clientes HTTP de `PagaFacil` y `CazaPagos`, repositorios en memoria.
- **Patrón de Diseño para Proveedores**: Implementación de patrones **Strategy / Adapter / Factory** para desacoplar el consumo de APIs externas. Añadir un nuevo proveedor no debe requerir cambios en el core del dominio.
- **Resiliencia y Manejo de Errores**: Manejo adecuado de caídas o rechazos por parte de los proveedores externos.
- **Pruebas Automatizadas**: Pruebas unitarias para el motor de cálculo de comisiones y pruebas de integración para los flujos clave.

---

## 9. Entregables de Uso de IA

Como parte del proceso de desarrollo, el repositorio incluye los siguientes artefactos documentados:

| Entregable | Archivo / Ubicación | Descripción |
| :--- | :--- | :--- |
| **Uso de IA** | `docs/AI_USAGE.md` | Herramientas y modelos usados, tareas asignadas, propuestas aceptadas o rechazadas. |
| **Plan / Especificación** | `docs/plan.md` o `spec.md` | Plan de trabajo y diseño arquitectónico previo a la generación de código. |
| **Skills e Instrucciones** | `AGENTS.md` / `.agents/rules/` | Reglas del agente, directrices de registro y convenciones. |
| **Historial y Correcciones** | `docs/AI_LOG.md` / `corrections.md` | Registro de prompts, respuestas y correcciones aplicadas durante el desarrollo. |
| **Decisiones de Arquitectura** | `docs/adr/` | ADRs breves sobre capas, estrategias de integración y patrones descartados. |
| **Supuestos y Ambigüedades** | `docs/assumptions.md` | Definición de supuestos sobre tercer proveedor no documentado, monedas y fallback de pasarelas. |

---

## 10. Criterios de Evaluación

1. **Calidad del Código**: Claridad, legibilidad, nomenclatura, uso de principios SOLID y patrones de diseño.
2. **Arquitectura**: Separación de capas, modularidad y desacoplamiento de pasarelas.
3. **Funcionalidad**: Cumplimiento íntegro de los requerimientos RF-01 al RF-10 y cálculo exacto de comisiones.
4. **Pruebas**: Cobertura adecuada de casos límite en comisiones y mocks para servicios externos.
5. **Experiencia de Usuario**: Interfaz intuitiva, responsiva, con estados de carga y retroalimentación clara.
