---
name: backend-slice-skill
description: >-
  Enforces Vertical Slice Architecture principles for backend development in .NET/C#.
  Mandates colocation of endpoints, DTOs, validation, domain logic, and persistence per feature slice.
  Prohibits cross-slice imports, rejects generic repository abstractions, prioritizes duplication over coupling,
  and guarantees strict contract boundaries.
---

# Backend Vertical Slice Architecture Skill

This skill guides the design, structure, and implementation of backend features following **Vertical Slice Architecture (VSA)** in C# and .NET.

---

## 1. Core Philosophy

Vertical Slice Architecture treats every business capability or user action as a self-contained, independent vertical slice. Instead of organizing code horizontally by technical layers (Controllers &rarr; Services &rarr; Repositories &rarr; Entities), slices cut vertically through the entire stack.

```
Traditional Layered Architecture (Coupled)   Vertical Slice Architecture (Independent)
┌──────────────────────────────────────┐     ┌───────────┐ ┌───────────┐ ┌───────────┐
│              Controllers             │     │   Slice   │ │   Slice   │ │   Slice   │
├──────────────────────────────────────┤     │ GetItems  │ │CreateItem │ │PayOrder   │
│               Services               │     │           │ │           │ │           │
├──────────────────────────────────────┤     │ Endpoint  │ │ Endpoint  │ │ Endpoint  │
│             Repositories             │     │ Contract  │ │ Contract  │ │ Contract  │
├──────────────────────────────────────┤     │ Validation│ │ Validation│ │ Validation│
│              DbContext               │     │ Logic/Data│ │ Logic/Data│ │ Logic/Data│
└──────────────────────────────────────┘     └───────────┘ └───────────┘ └───────────┘
```

---

## 2. Hard Architectural Rules

### Rule 1: Strict Colocation
Every feature slice must encapsulate all components required to satisfy its business request within a single file or a dedicated feature folder:
- **Endpoint definition**: Route registration and HTTP method mapping (Minimal APIs).
- **Contracts**: Request parameters/payload and Response DTOs.
- **Validation**: Input and business validation rules.
- **Domain & Business Logic**: State mutations, calculation rules, orchestration.
- **Persistence**: Direct queries or commands against `DbContext` or underlying data store.

### Rule 2: Zero Cross-Slice Dependencies
- **NEVER** import or reference DTOs, handlers, or internal models from one slice into another.
- Slices do **NOT** call other slices directly in-process. If interaction is necessary, use domain events, messaging, or explicit integration contracts.
- Any change to Slice A must never break or recompile Slice B.

### Rule 3: No Generic Repositories
- **Forbidden**: `IRepository<T>`, `GenericRepository<T>`, or monolithic `IOrderService` interfaces.
- **Mandated**: Slices interact directly with `DbContext`, Dapper, or raw SQL queries tailored specifically for that slice's read/write model.
- Projection optimizations (`AsNoTracking()`, selective `.Select()`) belong inside the query of that specific slice.

### Rule 4: Duplication Over Coupling
- If two slices require similar response fields or query filters, **duplicate the DTO or query logic** inside each slice.
- **NEVER** create a shared `CommonDTOs` or `SharedServices` class to avoid writing a small model twice.
- Shared models create hidden coupling: modifying a shared DTO for Slice A inadvertently breaks Slice B.

### Rule 5: Strict Contract Enforcement
- Always use strongly-typed contracts (`record Request(...)`, `record Response(...)`).
- Validate incoming input before executing domain operations.
- Return explicit HTTP result types (`TypedResults.Ok(...)`, `TypedResults.Created(...)`, `TypedResults.BadRequest(...)`).

---

## 3. Allowed vs Forbidden in Shared Infrastructure

| Scope | Permitted | Strictly Forbidden |
| :--- | :--- | :--- |
| **Shared / Infrastructure** | • Global middleware (Exception handling, Logging)<br>• Authentication / Authorization configuration<br>• EF Core `DbContext` and entity mappings<br>• Database connection setup<br>• External client wrappers / abstractions | • Feature-specific business logic<br>• Shared request/response DTOs<br>• Generic CRUD repositories<br>• Multi-purpose service classes (`ItemService`, `OrderService`) |
| **Feature Slice** | • Endpoints & Route mapping<br>• Request & Response DTOs<br>• Validation logic<br>• Slice-specific queries and data modifications<br>• Slice-specific helper methods | • Importing internal types from other slices<br>• Relying on external slice state |

---

## 4. Canonical Slice Implementation Pattern

Below is the standard, production-ready structure for a slice in C# (.NET 9):

```csharp
namespace Api.Features.Orders;

using Api.Data;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

// 1. Feature Slice Container
public static class CreateOrder
{
    // 2. Input Contract
    public sealed record Request(
        string PaymentMode,
        IReadOnlyList<OrderItemRequest> Products
    );

    public sealed record OrderItemRequest(string Name, decimal UnitPrice);

    // 3. Output Contract
    public sealed record Response(
        int OrderId,
        string Status,
        string Provider,
        decimal TotalAmount,
        decimal FeeAmount,
        DateTime CreatedAt
    );

    // 4. Endpoint Definition (Minimal API)
    public static void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/orders", HandleAsync)
           .WithName("CreateOrder")
           .WithSummary("Creates a new payment order with optimal provider selection")
           .WithTags("Orders");
    }

    // 5. Handler with Colocated Validation, Business Logic & Persistence
    public static async Task<Results<Created<Response>, BadRequest<string>>> HandleAsync(
        Request request,
        AppDbContext db,
        CancellationToken ct)
    {
        // Validation
        if (request.Products == null || request.Products.Count == 0)
        {
            return TypedResults.BadRequest("Order must contain at least one product.");
        }

        // Domain / Business Calculation
        var total = request.Products.Sum(p => p.UnitPrice);
        var (provider, fee) = DetermineOptimalProvider(request.PaymentMode, total);

        // Persistence directly via DbContext
        var order = new Order
        {
            PaymentMode = request.PaymentMode,
            Provider = provider,
            TotalAmount = total,
            FeeAmount = fee,
            Status = "Created",
            CreatedAt = DateTime.UtcNow
        };

        db.Orders.Add(order);
        await db.SaveChangesAsync(ct);

        // Response Contract Mapping
        var response = new Response(
            order.Id,
            order.Status,
            order.Provider,
            order.TotalAmount,
            order.FeeAmount,
            order.CreatedAt
        );

        return TypedResults.Created($"/api/orders/{order.Id}", response);
    }

    // Slice-private domain logic
    private static (string Provider, decimal Fee) DetermineOptimalProvider(string mode, decimal amount)
    {
        // Colocated calculation logic specific to this slice
        return mode.ToLowerInvariant() switch
        {
            "cash" => ("PagaFacil", 15.00m),
            "transfer" => ("CazaPagos", amount > 1000 ? amount * 0.02m : 5.00m),
            _ => ("PagaFacil", amount * 0.01m)
        };
    }
}
```

---

## 5. Grouping and Endpoint Registration

To expose slices cleanly to the application pipeline, each feature group exposes an extension method that registers all endpoints in its folder:

```csharp
namespace Api.Features.Orders;

public static class OrdersEndpoints
{
    public static IEndpointRouteBuilder MapOrdersEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/orders");
        
        CreateOrder.MapEndpoint(group);
        GetOrderById.MapEndpoint(group);
        CancelOrder.MapEndpoint(group);

        return app;
    }
}
```

And in `Program.cs`:
```csharp
app.MapOrdersEndpoints();
```

---

## 6. Testing Strategy for Slices

1. **Integration Tests as First Class**:
   - Test slices from the outside via HTTP using `WebApplicationFactory<Program>`.
   - Treat the slice as a black box: Input HTTP request &rarr; Assert database state & HTTP response.
2. **Isolation**:
   - Each test run should execute against an isolated database or transaction.
   - Slices must be independently testable without initializing unrelated features.
