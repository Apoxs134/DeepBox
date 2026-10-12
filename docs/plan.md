# DeepBox Project Plan & Engineering Specification

## 1. Project Overview & Objectives
**DeepBox** is a payment gateway orchestrator and fullstack e-commerce catalog application designed to route transactions intelligently across multiple external payment service providers based on dynamic fee rules.

### Key Objectives
1. Provide a modern, responsive catalog where users can select products and place orders.
2. Route transactions to the most cost-effective payment provider dynamically.
3. Allow administrators to configure payment providers and multi-condition fee rules without code changes.
4. Support full order lifecycle management: Creation, Cancellation, Approval, and Rejection.
5. Provide bilingual internationalization (English and Spanish) and role switching (Admin and User).

---

## 2. Feature Specifications

### 2.1 Product Catalog
- Display product inventory with product title, specifications/details, formatted unit price, and availability.
- Allow users to add available products directly into the shopping cart.
- Add New Product form is accessible only according to role configuration.

### 2.2 Shopping Cart & Checkout
- Fixed 90% viewport height modal displaying selected products with quantity modification and removal controls.
- Dynamic total amount calculation.
- Payment method selector supporting **Pago en Efectivo (Cash)**, **Pago en TDC (Credit Card)**, and **Transferencia (Bank Transfer)**.
- Real-time provider recommendation display reflecting the winning provider and estimated commission.
- Order confirmation payload submission to `/api/orders`.

### 2.3 Provider & Rules Engine
- Administrators can register new providers by specifying the provider name.
- Each provider can have multiple fee calculation rules configured:
  - **Applicable Payment Method**: Toggle for TDC (Card), Efectivo (Cash), Transferencia (Transfer).
  - **Threshold Amount**: Currency input with strict formatting (defaults to 0).
  - **Evaluation Condition**: `More than` (`>`), `Equal and more than` (`>=`), `Less than` (`<`), `Equal and less than` (`<=`).
  - **Fee Percentage**: Decimal number.
  - **Save Action**: Strictly enabled only when amount and percentage have valid values.
- Dynamic rule evaluation routes orders to the provider offering the lowest fee for the selected payment method.

### 2.4 Order Management & Approval Workflow
- Historical order registry accessible via navigation header.
- View detailed breakdown of order products, external reference IDs, provider fees, and payment modes.
- User action: Cancel pending orders directly with external providers.
- Admin action: **Approve** or **Reject** pending orders with immediate state reflection across users.

---

## 3. Project Roadmap & Delivery Phases

| Phase | Milestone | Deliverables | Status |
| :--- | :--- | :--- | :--- |
| **Phase 1** | Payment Gateways Integration | Typed HttpClients for *PagaFacil* & *CazaPagos*, Polly retry policies, resilience timeouts, connectivity verification endpoints. | Completed |
| **Phase 2** | Catalog & Database Persistence | EF Core SQLite integration, `Product` entities, auto-seeding, product catalog slice, bilingual UI. | Completed |
| **Phase 3** | Cart & Order Orchestration | Cart modal, real-time total, order submission, payload normalization, external gateway transaction dispatch. | Completed |
| **Phase 4** | Order History & Admin Controls | Order history modal, cancellation workflow, admin **Approve** and **Reject** endpoint slices and UI actions. | Completed |
| **Phase 5** | Provider Rules Engine | Admin Providers modal, RuleDialog with payment method toggle, dynamic rule resolution in backend and frontend. | Completed |
| **Phase 6** | Quality Assurance & Documentation | 100% passing tests (xUnit & Vitest), comprehensive architectural documentation, task logging. | Completed |

---

## 4. Testing & Verification Strategy

### Backend Quality Assurance
- **Integration Tests**: Implemented using `Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory<Program>` with isolated in-memory SQLite instances.
- **Coverage**:
  - `PaymentsIntegrationTests`: Health endpoints, gateway dispatch, credential security.
  - `OrdersIntegrationTests`: Order placement, provider resolution, order cancellation, admin approval, and rejection.
  - `ProvidersIntegrationTests`: Provider registration, rule creation, payment method filtering, rule deletion.

### Frontend Quality Assurance
- **Unit & Component Tests**: Implemented using `vitest` and `@testing-library/react`.
- **Coverage**:
  - `orders.test.tsx`: Order history modal, status badges, details view, cancellation, admin actions.
  - `products.test.tsx`: Product list, availability toggles, cart interactions, settings modals.
  - `providers.test.tsx`: Providers modal, inline provider creation, RuleDialog validation, delete rule callbacks.
