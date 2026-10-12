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

## 9. Documentación y Entregables del Proyecto

El repositorio cuenta con documentación exhaustiva en el directorio `docs/`:

| Documento | Enlace | Descripción |
| :--- | :--- | :--- |
| **Arquitectura del Sistema** | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Estructura del proyecto, Vertical Slice Architecture, capas vs slices, ADRs, frameworks y librerías. |
| **Plan y Especificación** | [docs/plan.md](docs/plan.md) | Plan de trabajo, roadmap de fases, estrategia de pruebas y verificación. |
| **Supuestos del Sistema** | [docs/assumptions.md](docs/assumptions.md) | Supuestos de negocio y técnicos (roles, proveedores, gestión de reglas y pasarelas). |
| **Uso de Herramientas IA** | [docs/AI_USAGE.md](docs/AI_USAGE.md) | Herramientas y modelos utilizados, prompts clave y decisiones asistidas por IA. |
| **Bitácora de IA** | [docs/AI_LOG.md](docs/AI_LOG.md) | Registro de interacciones y prompts procesados. |

---

## 10. Cómo Ejecutar el Proyecto (Quick Start)

### Requisitos Previos
- **.NET 9 SDK** (`dotnet --version` >= 9.0)
- **Node.js** (versión 20+ recomendada) y **npm**

### Instalación de Dependencias
```bash
# Instalar dependencias raíz y de frontend
npm install
npm install --prefix frontend
```

### Ejecución en Desarrollo
Para ejecutar tanto el backend C# (.NET 9) como el frontend (React + Vite) de manera concurrente:
```bash
npm run dev
```
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Swagger UI**: [http://localhost:5000/swagger](http://localhost:5000/swagger)

### Ejecutar Pruebas Automatizadas
Ejecuta tanto la suite de integración de C# (.NET) como la suite de componentes de React (Vitest):
```bash
npm test
```

### Compilar Proyecto (Build de Producción)
```bash
npm run build
```

---

## 11. Funcionalidades Destacadas en la Aplicación Web

1. **Gestión de Roles (Admin / User)**:
   - Configurable desde el modal de ajustes (⚙️).
   - **Modo Usuario**: Catálogo con agregar al carrito, modal de carrito de compra (90% alto), selector de método de pago (*Efectivo*, *Tarjeta*, *Transferencia*), cálculo dinámico de proveedor óptimo y comisiones en tiempo real, confirmación de orden e historial de órdenes con cancelación.
   - **Modo Administrador**: Acceso a la gestión de proveedores (🏛️) donde se pueden crear proveedores y configurar reglas dinámicas con toggle de método de pago (`TDC`, `Efectivo`, `Transferencia`). Gestión de órdenes con aprobación (`Approve`) y rechazo (`Reject`).
2. **Soporte Bilingüe**:
   - Alternancia entre Español e Inglés desde el modal de ajustes, con persistencia en `localStorage`.
3. **Enrutamiento Inteligente de Pasarelas**:
   - Evaluación en tiempo de ejecución de las reglas configuradas para el método de pago seleccionado, asignando automáticamente el proveedor con menor comisión o costo fijo.

---

## 12. Criterios de Evaluación

1. **Calidad del Código**: Claridad, legibilidad, nomenclatura, uso de principios SOLID y Vertical Slice Architecture.
2. **Arquitectura**: Desacoplamiento de pasarelas, colocalización de features y slices independientes.
3. **Funcionalidad**: Cumplimiento íntegro de los requerimientos RF-01 al RF-10, reglas dinámicas de comisión y gestión de estados.
4. **Pruebas**: Cobertura exhaustiva de endpoints e interfaces con pruebas automatizadas (.NET xUnit + Vitest).
5. **Experiencia de Usuario**: Interfaz intuitiva, responsiva, moderna y con microinteracciones fluidas.
