namespace Api.Features.Orders;

public static class OrdersEndpoints
{
    public static IEndpointRouteBuilder MapOrdersEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/orders")
            .WithTags("Orders");

        CreateOrder.MapEndpoint(group);
        GetOrders.MapEndpoint(group);
        GetOrderById.MapEndpoint(group);
        CancelOrder.MapEndpoint(group);
        ApproveOrder.MapEndpoint(group);
        RejectOrder.MapEndpoint(group);

        return app;
    }
}
