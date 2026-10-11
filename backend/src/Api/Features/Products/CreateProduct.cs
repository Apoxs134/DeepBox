namespace Api.Features.Products;

using Api.Data;
using Microsoft.AspNetCore.Http.HttpResults;

public static class CreateProduct
{
    public record Request(
        string Name,
        string Details,
        decimal UnitPrice,
        bool IsAvailable = true
    );

    public record Response(
        int Id,
        string Name,
        string Details,
        decimal UnitPrice,
        bool IsAvailable,
        DateTime CreatedAt
    );

    public static async Task<Results<Created<Response>, BadRequest<string>>> HandleAsync(
        Request request,
        AppDbContext dbContext,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return TypedResults.BadRequest("Product name is required.");
        }

        if (request.UnitPrice < 0)
        {
            return TypedResults.BadRequest("Unit price must be non-negative.");
        }

        var product = new Product
        {
            Name = request.Name.Trim(),
            Details = request.Details?.Trim() ?? string.Empty,
            UnitPrice = request.UnitPrice,
            IsAvailable = request.IsAvailable,
            CreatedAt = DateTime.UtcNow
        };

        dbContext.Products.Add(product);
        await dbContext.SaveChangesAsync(ct);

        var response = new Response(
            product.Id,
            product.Name,
            product.Details,
            product.UnitPrice,
            product.IsAvailable,
            product.CreatedAt
        );

        return TypedResults.Created($"/api/items/{product.Id}", response);
    }
}
