# AI Usage & Pair-Programming Documentation

## 1. Overview
This project was developed through pair-programming between the lead engineer and **Antigravity**, an agentic AI coding assistant developed by Google DeepMind. The AI served as an autonomous implementation partner capable of code generation, architectural validation, terminal execution, refactoring, and test suite verification.

---

## 2. AI Responsibilities & Workflow

### 2.1 Vertical Slice Scaffolding
- Generated cohesive vertical slices across both .NET 9 Minimal APIs and React 19 / TypeScript features.
- Enforced strict slice colocation: endpoints, domain entities, DTOs, and validation logic reside in dedicated feature directories without cross-slice bleeding.

### 2.2 Payment Gateway Integration & Resilience
- Designed typed HttpClients for external payment providers (*PagaFacil* and *CazaPagos*).
- Configured resilience handlers using Polly (standard retry policies, timeouts) and secured credentials via `IConfiguration` to prevent key leakage.

### 2.3 Dynamic Rules Engine
- Formulated the algorithm for dynamic optimal provider calculation.
- Implemented database schemas, entity mappings, and frontend reactive calculation based on order amounts, conditions, and payment methods.

### 2.4 Diagnostic & Troubleshooting Assistance
- Diagnosed runtime issues including SQLite table schema initialization, runtime exit code 134 (socket port collision on port 5000), and React state updates in asynchronous test suites.

### 2.5 Automated Testing & Verification
- Authored integration test suites using `WebApplicationFactory` for backend validation.
- Authored component and user flow tests using Vitest and React Testing Library for frontend verification.

---

## 3. Governance & Quality Guardrails

### 3.1 Automated Task Logging (`AGENTS.md`)
Every task completed by the AI agent is recorded in `docs/AI_LOG.md`:
- **Strict Append-Only**: The log file is never read or loaded into agent context to preserve token bandwidth and privacy.
- **Traceability**: Contains ISO timestamps, verbatim user requests, and synthesized technical summaries.

### 3.2 Security & Credential Isolation
- Gateway API keys (`x-api-key`) are never hardcoded into source files or client bundles.
- Credentials are accessed securely via ASP.NET Core configuration providers (`appsettings.json`, environment variables, or .NET user-secrets).

### 3.3 Architecture & Style Enforcement
- **Backend**: Strict adherence to Vertical Slice Architecture principles; generic repository abstractions are prohibited.
- **Frontend**: Strict adherence to Feature-Sliced Design principles; sibling feature internals remain encapsulated.
