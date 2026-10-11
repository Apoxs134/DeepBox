namespace Api.Features.Orders;

using System.Text.Json;
using Api.Data;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

public static class GetOrderById
{
    public static void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("/{id:int}", HandleAsync)
           .WithName("GetOrderById")
           .WithSummary("Retrieves detailed information of an order by internal ID");
    }

    public static async Task<Results<Ok<OrderDto>, NotFound<string>>> HandleAsync(
        int id,
        AppDbContext db,
        CancellationToken ct)
    {
        var order = await db.Orders
            .AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == id, ct);

        if (order == null)
        {
            return TypedResults.NotFound($"Order with ID {id} was not found.");
        }

        var fees = string.IsNullOrWhiteSpace(order.FeesJson)
            ? []
            : JsonSerializer.Deserialize<List<FeeDto>>(order.FeesJson) ?? [];

        var products = string.IsNullOrWhiteSpace(order.ProductsJson)
            ? []
            : JsonSerializer.Deserialize<List<OrderProductItem>>(order.ProductsJson) ?? [];

        var dto = new OrderDto(
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

        return TypedResults.Ok(dto);
    }
}
