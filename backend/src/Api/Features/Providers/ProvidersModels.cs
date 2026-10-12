namespace Api.Features.Providers;

using System.Text.Json.Serialization;

public sealed record CreateProviderRequest(
    [property: JsonPropertyName("name")] string Name
);

public sealed record CreateProviderRuleRequest(
    [property: JsonPropertyName("amount")] decimal Amount,
    [property: JsonPropertyName("condition")] string Condition,
    [property: JsonPropertyName("percentage")] decimal Percentage,
    [property: JsonPropertyName("paymentMethod")] string? PaymentMethod = "Card"
);

public sealed record ProviderRuleDto(
    [property: JsonPropertyName("id")] int Id,
    [property: JsonPropertyName("providerId")] int ProviderId,
    [property: JsonPropertyName("amount")] decimal Amount,
    [property: JsonPropertyName("condition")] string Condition,
    [property: JsonPropertyName("percentage")] decimal Percentage,
    [property: JsonPropertyName("paymentMethod")] string PaymentMethod,
    [property: JsonPropertyName("createdAt")] DateTime CreatedAt
);


public sealed record ProviderDto(
    [property: JsonPropertyName("id")] int Id,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("createdAt")] DateTime CreatedAt,
    [property: JsonPropertyName("rules")] IReadOnlyList<ProviderRuleDto> Rules
);
