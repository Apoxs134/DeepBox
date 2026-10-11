namespace Api.Features.Products;

using Api.Data;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

public static class GetProducts
{
    public record Response(
        int Id,
        string Name,
        string Details,
        decimal UnitPrice,
        bool IsAvailable,
        DateTime CreatedAt
    );

    public static async Task<Ok<List<Response>>> HandleAsync(AppDbContext dbContext, CancellationToken ct)
    {
        var products = await dbContext.Products
            .AsNoTracking()
            .OrderBy(p => p.Id)
            .Select(p => new Response(
                p.Id,
                p.Name,
                p.Details,
                p.UnitPrice,
                p.IsAvailable,
                p.CreatedAt
            ))
            .ToListAsync(ct);

        return TypedResults.Ok(products);
    }
}
