namespace Api.Features.Products;

public static class ProductsEndpoints
{
    public static IEndpointRouteBuilder MapProductsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/items")
            .WithTags("Items");

        group.MapGet("/", GetProducts.HandleAsync)
            .WithName("GetItems")
            .WithSummary("Retrieve all items");

        group.MapPost("/", CreateProduct.HandleAsync)
            .WithName("CreateItem")
            .WithSummary("Create a new item");

        return app;
    }
}
