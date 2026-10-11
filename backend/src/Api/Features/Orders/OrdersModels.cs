namespace Api.Features.Orders;

using System.Text.Json.Serialization;

public sealed record CreateOrderRequest(
    [property: JsonPropertyName("PaymentMode")] string PaymentMode,
    [property: JsonPropertyName("Products")] IReadOnlyList<OrderProductItem> Products
);

public sealed record OrderProductItem(
    [property: JsonPropertyName("Name")] string Name,
    [property: JsonPropertyName("UnitPrice")] decimal UnitPrice
);

public sealed record ProviderReferenceDto(
    [property: JsonPropertyName("Id")] string Id
);

public sealed record FeeDto(
    [property: JsonPropertyName("Name")] string Name,
    [property: JsonPropertyName("Amount")] decimal Amount
);

public sealed record OrderDto(
    [property: JsonPropertyName("OrderId")] int OrderId,
    [property: JsonPropertyName("ExternalOrderId")] string ExternalOrderId,
    [property: JsonPropertyName("Amount")] decimal Amount,
    [property: JsonPropertyName("Fees")] IReadOnlyList<FeeDto> Fees,
    [property: JsonPropertyName("Products")] IReadOnlyList<OrderProductItem> Products,
    [property: JsonPropertyName("Provider")] ProviderReferenceDto Provider,
    [property: JsonPropertyName("Status")] string Status,
    [property: JsonPropertyName("PaymentMode")] string PaymentMode,
    [property: JsonPropertyName("CreatedAt")] DateTime CreatedAt,
    [property: JsonPropertyName("UpdatedAt")] DateTime? UpdatedAt = null
);
