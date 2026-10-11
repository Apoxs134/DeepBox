namespace Api.Features.Items;

using Api.Data;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

public static class GetItems
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
        var items = await dbContext.Items
            .AsNoTracking()
            .OrderBy(i => i.Id)
            .Select(i => new Response(
                i.Id,
                i.Name,
                i.Details,
                i.UnitPrice,
                i.IsAvailable,
                i.CreatedAt
            ))
            .ToListAsync(ct);

        return TypedResults.Ok(items);
    }
}
