namespace Api.Features.Items;

using Api.Data;
using Microsoft.AspNetCore.Http.HttpResults;

public static class CreateItem
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
            return TypedResults.BadRequest("Item name is required.");
        }

        if (request.UnitPrice < 0)
        {
            return TypedResults.BadRequest("Unit price must be non-negative.");
        }

        var item = new Item
        {
            Name = request.Name.Trim(),
            Details = request.Details?.Trim() ?? string.Empty,
            UnitPrice = request.UnitPrice,
            IsAvailable = request.IsAvailable,
            CreatedAt = DateTime.UtcNow
        };

        dbContext.Items.Add(item);
        await dbContext.SaveChangesAsync(ct);

        var response = new Response(
            item.Id,
            item.Name,
            item.Details,
            item.UnitPrice,
            item.IsAvailable,
            item.CreatedAt
        );

        return TypedResults.Created($"/api/items/{item.Id}", response);
    }
}
