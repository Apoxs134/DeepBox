namespace Api.Features.Items;

public static class ItemsEndpoints
{
    public static IEndpointRouteBuilder MapItemsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/items")
            .WithTags("Items");

        group.MapGet("/", GetItems.HandleAsync)
            .WithName("GetItems")
            .WithSummary("Retrieve all items");

        group.MapPost("/", CreateItem.HandleAsync)
            .WithName("CreateItem")
            .WithSummary("Create a new item");

        return app;
    }
}
