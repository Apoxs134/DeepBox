# DeepBox Architecture & Engineering Specification

## 1. Executive Summary
**DeepBox** is a payment order orchestration and product catalog application designed around **Vertical Slice Architecture (VSA)** and **Feature-Sliced Design principles**. It connects front-office e-commerce operations with multiple external payment gateways (e.g., *PagaFacil* and *CazaPagos*), evaluating commission calculation rules dynamically to minimize payment processing costs.

---

## 2. Project Directory Structure

The project is structured as a unified monorepo managed via root `package.json` scripts:

```text
DeepBox/
├── backend/
│   ├── DeepBox.sln
│   ├── src/
│   │   └── Api/
│   │       ├── Api.csproj
│   │       ├── Program.cs                      # Host configuration, endpoint registration, pipeline
│   │       ├── appsettings.json
│   │       ├── Data/
│   │       │   ├── AppDbContext.cs             # EF Core DbContext with SQLite mappings
│   │       │   └── DbInitializer.cs            # Schema creation & initial database seeding
│   │       └── Features/                       # Vertical Slice Architecture root
│   │           ├── Payments/                   # External gateway clients slice
│   │           │   ├── IPagaFacilClient.cs
│   │           │   ├── PagaFacilClient.cs
│   │           │   ├── ICazaPagosClient.cs
│   │           │   ├── CazaPagosClient.cs
│   │           │   ├── PaymentGatewayOptions.cs
│   │           │   ├── PaymentsModels.cs
│   │           │   └── PaymentsEndpoints.cs
│   │           ├── Products/                   # Product catalog slice
│   │           │   ├── Product.cs
│   │           │   ├── ProductsModels.cs
│   │           │   ├── ProductsEndpoints.cs
│   │           │   ├── GetProducts.cs
│   │           │   └── CreateProduct.cs
│   │           ├── Orders/                     # Order lifecycle & orchestration slice
│   │           │   ├── Order.cs
│   │           │   ├── OrdersModels.cs
│   │           │   ├── OrdersEndpoints.cs
│   │           │   ├── CreateOrder.cs          # Dynamic rule engine & provider resolution
│   │           │   ├── GetOrders.cs
│   │           │   ├── CancelOrder.cs
│   │           │   ├── ApproveOrder.cs
│   │           │   └── RejectOrder.cs
│   │           └── Providers/                  # Provider registry & fee rules slice
│   │               ├── Provider.cs
│   │               ├── ProviderRule.cs
│   │               ├── ProvidersModels.cs
│   │               └── ProvidersEndpoints.cs
│   └── tests/
│       └── Api.Tests/                          # Integration & slice tests
│           ├── OrdersIntegrationTests.cs
│           ├── PaymentsIntegrationTests.cs
│           ├── ProductsSliceTests.cs
│           └── ProvidersIntegrationTests.cs
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx                             # Application root & modal coordinator
│   │   ├── index.css                           # Tailwind CSS & design tokens
│   │   └── features/                           # Feature-Sliced frontend modules
│   │       ├── products/                       # Product catalog components, state, API
│   │       ├── cart/                           # Cart state, dynamic fee comparison, order checkout
│   │       ├── orders/                         # Order history, admin approval/rejection, cancellation
│   │       ├── providers/                      # Provider list, detail modal, rule dialog
│   │       ├── settings/                       # Language (EN/ES) & Role (Admin/User) context
│   │       └── toast/                          # Global notifications system
│   └── tests/                                  # Vitest unit & integration test suites
│       ├── orders.test.tsx
│       ├── products.test.tsx
│       └── providers.test.tsx
├── docs/                                       # Project documentation & execution logs
│   ├── ARCHITECTURE.md
│   ├── plan.md
│   ├── assumptions.md
│   ├── AI_USAGE.md
│   └── AI_LOG.md
└── package.json                                # Unified dev, build, and test orchestration
```

---

## 3. Vertical Slice Architecture (VSA)

### 3.1 The Problem with Traditional Layered (N-Tier) Architectures
In traditional 3-tier or N-tier architectures, applications are partitioned horizontally into generic layers:
1. `Controllers`
2. `Services` (or `Business Logic Layer`)
3. `Repositories` (or `Data Access Layer`)
4. `DTOs / ViewModels`

While visually clean, this introduces severe friction:
- **High Coupling**: Changes to a single user requirement (e.g., adding an order approval action) require modifying 4 to 6 separate layers across different folders.
- **Generic Repository Abstraction Leak**: Repositories either become bloated with domain-specific query methods or leak ORM concerns across boundaries.
- **Shotgun Surgery**: A minor change to a feature risks breaking unrelated features sharing the same service or repository.

### 3.2 Vertical Slices in DeepBox
DeepBox organizes the backend and frontend around **business capabilities (slices)** rather than technical concerns:
- **Colocation**: Every slice (e.g. `Features/Orders/ApproveOrder.cs`) contains its endpoint definition, request validation, business logic, and database persistence logic colocated in one cohesive unit.
- **Slice Autonomy**: Slices do not share business services with sibling slices. Slices depend directly on the database context (`AppDbContext`) and external clients via dependency injection.
- **Minimized Abstraction Tax**: Rather than wrapping Entity Framework behind redundant generic repository interfaces, queries use EF Core's native LINQ capabilities directly, maintaining performance and clarity.

---

## 4. Frontend Feature-Sliced Structure

On the frontend, code is structured into dedicated feature directories under `frontend/src/features/`:
- **Strict Boundary Encapsulation**: Each feature slice exposes its public API through its `index.ts`. Sibling features are forbidden from accessing private internal components or utilities directly.
- **Colocated Concerns**:
  - `types.ts`: DTO contracts and domain types.
  - `api/`: Fetch clients communicating with corresponding backend endpoints.
  - `hooks/`: Reactive state, loading indicators, and error boundaries.
  - `components/`: UI components belonging specifically to that feature.

---

## 5. Architectural Decisions (ADRs)

### ADR-01: ASP.NET Core Minimal APIs
- **Context**: DeepBox requires lightweight, high-performance HTTP endpoints.
- **Decision**: Use ASP.NET Core Minimal APIs (`app.MapGroup`, `TypedResults`) rather than MVC Controllers.
- **Consequences**: Zero reflection overhead on startup, reduced boilerplate, clear routing colocation per vertical slice.

### ADR-02: SQLite with Entity Framework Core
- **Context**: Development speed, local self-containment, and zero external infrastructure dependencies.
- **Decision**: Use SQLite (`Microsoft.EntityFrameworkCore.Sqlite`) with code-first schema definitions and self-healing initialization.
- **Consequences**: Fast local startup, portable file-based database, full support for transactions and in-memory test fixtures (`Data Source=:memory:`).

### ADR-03: Typed HttpClients with Polly Resilience
- **Context**: External payment gateways (*PagaFacil* and *CazaPagos*) are remote HTTP services subject to transient failures and network latency.
- **Decision**: Register typed HttpClients via `IHttpClientFactory` configured with Microsoft.Extensions.Http.Resilience (Polly) retry and timeout policies. Credentials (`x-api-key`) are injected securely via configuration without hardcoding.
- **Consequences**: Fault-tolerant external calls with automatic retry for 5xx and 408 errors, request timeouts, and decoupled gateway credentials.

### ADR-04: Dynamic Rule-Based Commission Optimization
- **Context**: Different providers have differing fee structures based on order amounts and payment methods (TDC, Cash, Transfer).
- **Decision**: Store configurable fee rules (`ProviderRule`) linked to providers with conditions (`MoreThan`, `EqualAndMoreThan`, `LessThan`, `EqualAndLessThan`), applicable payment methods, and percentage rates.
- **Consequences**: Both the shopping cart (in real time) and backend order processing evaluate matching rules dynamically to choose the cheapest provider for the customer.

---

## 6. Frameworks & Libraries

### 6.1 Backend (.NET 9)
| Package | Version | Purpose |
| :--- | :--- | :--- |
| `Microsoft.AspNetCore.OpenApi` | `9.0.2` | OpenAPI / Swagger specification generation |
| `Microsoft.EntityFrameworkCore.Sqlite` | `9.0.2` | SQLite database provider for EF Core |
| `Microsoft.EntityFrameworkCore.Design` | `9.0.2` | EF Core tooling and migrations support |
| `Microsoft.Extensions.Http.Resilience` | `9.2.0` | Polly standard resilience handlers for HttpClients |
| `Microsoft.AspNetCore.Mvc.Testing` | `9.0.2` | WebApplicationFactory for end-to-end integration tests |
| `xunit` | `2.9.3` | Test runner and assertion library |

### 6.2 Frontend (React & TypeScript)
| Package | Version | Purpose |
| :--- | :--- | :--- |
| `react` & `react-dom` | `^19.2.8` | Core UI library |
| `vite` | `^8.3.0` | Next-generation frontend build tool and dev server |
| `tailwindcss` | `^4.3.3` | Modern utility-first CSS styling engine |
| `vitest` | `^4.1.11` | Blazing-fast Vite-native unit and component test runner |
| `@testing-library/react` | `^16.3.3` | React component testing utilities |
| `@testing-library/user-event` | `^14.6.7` | User interaction simulation |

### 6.3 Tooling & Orchestration
| Package | Version | Purpose |
| :--- | :--- | :--- |
| `concurrently` | `^9.1.2` | Runs backend (`dotnet watch`) and frontend (`vite`) concurrently |
| `oxlint` | `^1.81.0` | High-performance Rust-based JavaScript/TypeScript linter |
