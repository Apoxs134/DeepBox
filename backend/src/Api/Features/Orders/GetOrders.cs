namespace Api.Features.Orders;

using System.Text.Json;
using Api.Data;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

public static class GetOrders
{
    public static void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapGet("/", HandleAsync)
           .WithName("GetOrders")
           .WithSummary("Retrieves all payment orders ordered by newest first");
    }

    public static async Task<Ok<IReadOnlyList<OrderDto>>> HandleAsync(
        AppDbContext db,
        CancellationToken ct)
    {
        var orders = await db.Orders
            .AsNoTracking()
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync(ct);

        var dtos = orders.Select(order =>
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
        }).ToList();

        return TypedResults.Ok<IReadOnlyList<OrderDto>>(dtos);
    }
}
