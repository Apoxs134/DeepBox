namespace Api.Features.Payments;

using System.Diagnostics;
using System.Net.Http.Json;

public interface IPagaFacilClient
{
    Task<ProviderHealthResult> CheckHealthAsync(CancellationToken ct = default);
    Task<PaymentResult> CreateOrderAsync(ThirdPartyOrderCreateRequest request, CancellationToken ct = default);
}

public class PagaFacilClient(HttpClient httpClient, ILogger<PagaFacilClient> logger) : IPagaFacilClient
{
    private const string ProviderName = "PagaFacil";

    public async Task<ProviderHealthResult> CheckHealthAsync(CancellationToken ct = default)
    {
        var stopwatch = Stopwatch.StartNew();
        try
        {
            var response = await httpClient.GetAsync("/Order", ct);
            stopwatch.Stop();

            var isSuccess = response.IsSuccessStatusCode;
            return new ProviderHealthResult(
                Provider: ProviderName,
                IsHealthy: isSuccess,
                LatencyMs: stopwatch.ElapsedMilliseconds,
                StatusCode: (int)response.StatusCode,
                ErrorMessage: isSuccess ? null : $"HTTP {(int)response.StatusCode} {response.ReasonPhrase}"
            );
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            logger.LogError(ex, "Health check failed for {Provider}", ProviderName);
            return new ProviderHealthResult(
                Provider: ProviderName,
                IsHealthy: false,
                LatencyMs: stopwatch.ElapsedMilliseconds,
                StatusCode: 0,
                ErrorMessage: ex.Message
            );
        }
    }

    public async Task<PaymentResult> CreateOrderAsync(ThirdPartyOrderCreateRequest request, CancellationToken ct = default)
    {
        logger.LogInformation("Sending order creation request to {Provider} for method {Method}", ProviderName, request.Method);

        HttpResponseMessage response;
        try
        {
            response = await httpClient.PostAsJsonAsync("/Order", request, ct);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to connect to {Provider}", ProviderName);
            throw new HttpRequestException($"Failed to communicate with {ProviderName}: {ex.Message}", ex);
        }

        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync(ct);
            logger.LogWarning("{Provider} returned HTTP {StatusCode}: {ErrorBody}", ProviderName, response.StatusCode, errorBody);
            throw new HttpRequestException(
                $"Payment provider {ProviderName} returned error (HTTP {(int)response.StatusCode}): {errorBody}",
                null,
                response.StatusCode
            );
        }

        var thirdPartyOrder = await response.Content.ReadFromJsonAsync<ThirdPartyOrderResponse>(cancellationToken: ct)
            ?? throw new InvalidOperationException($"Empty or invalid response received from {ProviderName}");

        var mappedFees = (thirdPartyOrder.Fees ?? [])
            .Select(f => new PaymentFeeDto(f.Name ?? "Fee", (decimal)f.Amount))
            .ToList();

        return new PaymentResult(
            ExternalOrderId: thirdPartyOrder.OrderId,
            Provider: ProviderName,
            Method: thirdPartyOrder.Method,
            Amount: (decimal)thirdPartyOrder.Amount,
            Status: thirdPartyOrder.Status,
            Fees: mappedFees,
            CreatedAt: thirdPartyOrder.CreatedDate
        );
    }
}
