namespace Api.Features.Payments;

using System.Text.Json.Serialization;

// Internal Request/Response contracts
public sealed record InitiatePaymentRequest(
    string Provider,
    string Method,
    IReadOnlyList<PaymentProductDto> Products
);

public sealed record PaymentProductDto(
    string Name,
    decimal UnitPrice
);

public sealed record PaymentFeeDto(
    string Name,
    decimal Amount
);

public sealed record PaymentResult(
    string ExternalOrderId,
    string Provider,
    string Method,
    decimal Amount,
    string Status,
    IReadOnlyList<PaymentFeeDto> Fees,
    DateTime CreatedAt
);

public sealed record ProviderHealthResult(
    string Provider,
    bool IsHealthy,
    long LatencyMs,
    int StatusCode,
    string? ErrorMessage = null
);

public sealed record PaymentsHealthResponse(
    bool OverallHealthy,
    IReadOnlyList<ProviderHealthResult> Providers
);

// Third-party wire models (PagaFacil & CazaPagos)
public sealed record ThirdPartyOrderCreateRequest(
    [property: JsonPropertyName("method")] string Method,
    [property: JsonPropertyName("products")] IReadOnlyList<ThirdPartyProduct> Products
);

public sealed record ThirdPartyProduct(
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("unitPrice")] double UnitPrice
);

public sealed record ThirdPartyOrderResponse(
    [property: JsonPropertyName("orderId")] string OrderId,
    [property: JsonPropertyName("amount")] double Amount,
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("method")] string Method,
    [property: JsonPropertyName("fees")] IReadOnlyList<ThirdPartyFee>? Fees,
    [property: JsonPropertyName("products")] IReadOnlyList<ThirdPartyProduct>? Products,
    [property: JsonPropertyName("createdDate")] DateTime CreatedDate,
    [property: JsonPropertyName("createdBy")] string? CreatedBy
);

public sealed record ThirdPartyFee(
    [property: JsonPropertyName("name")] string? Name,
    [property: JsonPropertyName("title")] string? Title,
    [property: JsonPropertyName("amount")] double Amount
)
{
    public string DisplayName => !string.IsNullOrWhiteSpace(Name) ? Name : (!string.IsNullOrWhiteSpace(Title) ? Title : "Fee");
}
