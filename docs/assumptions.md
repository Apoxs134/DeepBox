# Project Assumptions & Design Constraints

This document details the core architectural and business assumptions governing the implementation of **DeepBox**:

---

## 1. Multiple Product Purchasing
- **Assumption**: A user can select and purchase multiple products in a single order, with arbitrary quantities per product.
- **Implementation**: The shopping cart supports multi-item aggregation with individual product quantities, dynamic subtotal calculation, and consolidated order payload submission (`Products: [...]`) to the backend.

---

## 2. Admin Provider Management
- **Assumption**: Administrators have the capability to create and register payment providers dynamically without redeploying the application.
- **Implementation**: The admin interface features a dedicated Providers modal accessible from the top navigation. Admins can click `+` (New) to register and link new payment gateway providers directly into the database.

---

## 3. Order Lifecycle Authority (Approve, Reject, Cancel)
- **Assumption**: Administrators possess complete operational control over order fulfillment, including the ability to approve, reject, and cancel orders.
- **Implementation**: 
  - Standard users can cancel pending orders they have placed.
  - Administrators can **Approve** or **Reject** pending orders via the Admin Order Management panel, with status changes immediately reflected across all user views and database records.

---

## 4. Dynamic Provider Rules Engine
- **Assumption**: Administrators can create and link custom fee calculation rules to providers, specifying threshold amounts, comparison conditions, commission percentages, and applicable payment methods.
- **Implementation**: The admin interface includes a `RuleDialog` enforcing currency validation, condition dropdowns, decimal percentage limits, and a payment method toggle (TDC, Cash, Transfer). Rules only apply to transactions matching the configured payment method.

---

## 5. Role-Based Access Control & Authentication Scope
- **Assumption**: The application differentiates between two primary roles: **Admin** and **User**. A complete authentication/login system (e.g. OAuth, JWT, session stores) is considered out of scope for the current timeline to prioritize domain logic, orchestration, and rule engines.
- **Implementation**: A global Role Switcher is integrated directly into the Settings modal (`Admin` / `User`), allowing immediate toggling of administrative permissions, provider management buttons, and order approval controls.
