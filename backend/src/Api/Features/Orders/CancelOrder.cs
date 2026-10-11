namespace Api.Features.Orders;

using System.Text.Json;
using Api.Data;
using Api.Features.Payments;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

public static class CancelOrder
{
    public static void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPut("/{id:int}/cancel", HandleAsync)
           .WithName("CancelOrderPut")
           .WithSummary("Cancels an order and requests cancellation to the external provider");

        app.MapPost("/{id:int}/cancel", HandleAsync)
           .WithName("CancelOrderPost")
           .WithSummary("Cancels an order and requests cancellation to the external provider (POST alias)");
    }

    public static async Task<Results<Ok<OrderDto>, NotFound<string>, BadRequest<string>, StatusCodeHttpResult>> HandleAsync(
        int id,
        AppDbContext db,
        IPagaFacilClient pagaFacil,
        ICazaPagosClient cazaPagos,
        CancellationToken ct)
    {
        var order = await db.Orders.FirstOrDefaultAsync(o => o.Id == id, ct);
        if (order == null)
        {
            return TypedResults.NotFound($"Order with ID {id} was not found.");
        }

        if (string.Equals(order.Status, "Cancelled", StringComparison.OrdinalIgnoreCase))
        {
            return TypedResults.Ok(MapToDto(order));
        }

        // Call underlying provider cancellation
        bool cancelledOnProvider = false;
        try
        {
            if (string.Equals(order.ProviderId, "PagaFacil", StringComparison.OrdinalIgnoreCase))
            {
                cancelledOnProvider = await pagaFacil.CancelOrderAsync(order.ExternalOrderId, ct);
            }
            else if (string.Equals(order.ProviderId, "CazaPagos", StringComparison.OrdinalIgnoreCase))
            {
                cancelledOnProvider = await cazaPagos.CancelOrderAsync(order.ExternalOrderId, ct);
            }
        }
        catch (Exception)
        {
            return TypedResults.StatusCode(StatusCodes.Status502BadGateway);
        }

        // If provider returned failure or not found, we still log and update or return
        order.Status = "Cancelled";
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
