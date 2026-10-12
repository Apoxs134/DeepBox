namespace Api.Features.Orders;

using System.Text.Json;
using Api.Data;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

public static class RejectOrder
{
    public static void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPut("/{id:int}/reject", HandleAsync)
           .WithName("RejectOrderPut")
           .WithSummary("Rejects an order as admin");

        app.MapPost("/{id:int}/reject", HandleAsync)
           .WithName("RejectOrderPost")
           .WithSummary("Rejects an order as admin (POST alias)");
    }

    public static async Task<Results<Ok<OrderDto>, NotFound<string>, BadRequest<string>>> HandleAsync(
        int id,
        AppDbContext db,
        CancellationToken ct)
    {
        var order = await db.Orders.FirstOrDefaultAsync(o => o.Id == id, ct);
        if (order == null)
        {
            return TypedResults.NotFound($"Order with ID {id} was not found.");
        }

        if (string.Equals(order.Status, "Cancelled", StringComparison.OrdinalIgnoreCase))
        {
            return TypedResults.BadRequest("Cannot reject a cancelled order.");
        }

        order.Status = "Rejected";
        order.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);

        return TypedResults.Ok(MapToDto(order));
    }

    private static OrderDto MapToDto(Order order)
    {
        var fees = string.IsNullOrWhiteSpace(order.FeesJson)
            ? []
            : JsonSerializer.Deserialize<List<FeeDto>>(order.FeesJson) ?? [];

        var products = string.IsNullOrWhiteSpace(order.ProductsJson)
            ? []
            : JsonSerializer.Deserialize<List<OrderProductItem>>(order.ProductsJson) ?? [];

        return new OrderDto(
            OrderId: order.Id,
            ExternalOrderId: order.ExternalOrderId,
            Amount: order.Amount,
            Fees: fees,
            Products: products,
            Provider: new ProviderReferenceDto(order.ProviderId),
            Status: order.Status,
            PaymentMode: order.PaymentMode,
            CreatedAt: order.CreatedAt,
            UpdatedAt: order.UpdatedAt
        );
    }
}
