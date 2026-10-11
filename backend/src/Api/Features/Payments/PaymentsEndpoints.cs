namespace Api.Features.Payments;

using Microsoft.AspNetCore.Http.HttpResults;

public static class PaymentsEndpoints
{
    public static IEndpointRouteBuilder MapPaymentsEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/payments")
            .WithTags("Payments");

        group.MapGet("/health", GetHealthAsync)
            .WithName("GetPaymentsHealth")
            .WithSummary("Check connectivity, latency, and authorization for all payment providers");

        group.MapPost("/initiate", InitiatePaymentAsync)
            .WithName("InitiatePayment")
            .WithSummary("Initiates a payment order with a designated provider without exposing secrets");

        return app;
    }

    public static async Task<Ok<PaymentsHealthResponse>> GetHealthAsync(
        IPagaFacilClient pagaFacil,
        ICazaPagosClient cazaPagos,
        CancellationToken ct)
    {
        var pagaFacilTask = pagaFacil.CheckHealthAsync(ct);
        var cazaPagosTask = cazaPagos.CheckHealthAsync(ct);

        await Task.WhenAll(pagaFacilTask, cazaPagosTask);

        var results = new List<ProviderHealthResult>
        {
            await pagaFacilTask,
            await cazaPagosTask
        };

        var overallHealthy = results.All(r => r.IsHealthy);

        return TypedResults.Ok(new PaymentsHealthResponse(
            OverallHealthy: overallHealthy,
            Providers: results
        ));
    }

    public static async Task<Results<Ok<PaymentResult>, BadRequest<string>, StatusCodeHttpResult>> InitiatePaymentAsync(
        InitiatePaymentRequest request,
        IPagaFacilClient pagaFacil,
        ICazaPagosClient cazaPagos,
        CancellationToken ct)
    {
        if (request.Products == null || request.Products.Count == 0)
        {
            return TypedResults.BadRequest("Payment request must contain at least one product.");
        }

        if (string.IsNullOrWhiteSpace(request.Method))
        {
            return TypedResults.BadRequest("Payment method is required.");
        }

        // Map method to third-party supported strings: "Cash", "Card", "Transfer"
        var normalizedMethod = NormalizePaymentMethod(request.Method);
        if (normalizedMethod == null)
        {
            return TypedResults.BadRequest($"Unsupported payment method: '{request.Method}'. Supported values: Cash, Card, Transfer.");
        }

        var thirdPartyProducts = request.Products
            .Select(p => new ThirdPartyProduct(p.Name, (double)p.UnitPrice))
            .ToList();

        var thirdPartyRequest = new ThirdPartyOrderCreateRequest(normalizedMethod, thirdPartyProducts);

        try
        {
            PaymentResult result;
            if (string.Equals(request.Provider, "PagaFacil", StringComparison.OrdinalIgnoreCase))
            {
                result = await pagaFacil.CreateOrderAsync(thirdPartyRequest, ct);
            }
            else if (string.Equals(request.Provider, "CazaPagos", StringComparison.OrdinalIgnoreCase))
            {
                result = await cazaPagos.CreateOrderAsync(thirdPartyRequest, ct);
            }
            else
            {
                return TypedResults.BadRequest($"Invalid provider '{request.Provider}'. Supported providers: PagaFacil, CazaPagos.");
            }

            return TypedResults.Ok(result);
        }
        catch (HttpRequestException ex)
        {
            var statusCode = (int?)ex.StatusCode ?? StatusCodes.Status502BadGateway;
            return TypedResults.StatusCode(statusCode);
        }
        catch (Exception)
        {
            return TypedResults.StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    private static string? NormalizePaymentMethod(string method)
    {
        return method.Trim().ToLowerInvariant() switch
        {
            "cash" or "efectivo" => "Cash",
            "card" or "creditcard" or "tarjeta" or "tdc" => "Card",
            "transfer" or "transferencia" => "Transfer",
            _ => null
        };
    }
}
