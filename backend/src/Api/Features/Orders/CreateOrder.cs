namespace Api.Features.Orders;

using System.Text.Json;
using Api.Data;
using Api.Features.Payments;
using Microsoft.AspNetCore.Http.HttpResults;

public static class CreateOrder
{
    public static void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("/", HandleAsync)
           .WithName("CreateOrder")
           .WithSummary("Creates and registers a new order by selecting the optimal payment provider");
    }

    public static async Task<Results<Created<OrderDto>, BadRequest<string>, StatusCodeHttpResult>> HandleAsync(
        CreateOrderRequest request,
        AppDbContext db,
        IPagaFacilClient pagaFacil,
        ICazaPagosClient cazaPagos,
        CancellationToken ct)
    {
        if (request.Products == null || request.Products.Count == 0)
        {
            return TypedResults.BadRequest("Order must contain at least one product.");
        }

        if (string.IsNullOrWhiteSpace(request.PaymentMode))
        {
            return TypedResults.BadRequest("PaymentMode is required.");
        }

        var normalizedMode = NormalizePaymentMode(request.PaymentMode);
        if (normalizedMode == null)
        {
            return TypedResults.BadRequest($"Unsupported payment mode: '{request.PaymentMode}'. Supported values: Cash, Card, Transfer.");
        }

        var totalAmount = request.Products.Sum(p => p.UnitPrice);
        var optimalProvider = DetermineOptimalProvider(normalizedMode, totalAmount);

        var thirdPartyProducts = request.Products
            .Select(p => new ThirdPartyProduct(p.Name, (double)p.UnitPrice))
            .ToList();

        var thirdPartyRequest = new ThirdPartyOrderCreateRequest(normalizedMode, thirdPartyProducts);

        PaymentResult paymentResult;
        try
        {
            if (optimalProvider == "PagaFacil")
            {
                paymentResult = await pagaFacil.CreateOrderAsync(thirdPartyRequest, ct);
            }
            else
            {
                paymentResult = await cazaPagos.CreateOrderAsync(thirdPartyRequest, ct);
            }
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

        var fees = (paymentResult.Fees ?? [])
            .Select(f => new FeeDto(f.Name, f.Amount))
            .ToList();

        var order = new Order
        {
            ExternalOrderId = paymentResult.ExternalOrderId,
            ProviderId = optimalProvider,
            PaymentMode = normalizedMode,
            Amount = paymentResult.Amount,
            Status = paymentResult.Status,
            FeesJson = JsonSerializer.Serialize(fees),
            ProductsJson = JsonSerializer.Serialize(request.Products),
            CreatedAt = paymentResult.CreatedAt,
            UpdatedAt = null
        };

        db.Orders.Add(order);
        await db.SaveChangesAsync(ct);

        var responseDto = new OrderDto(
            OrderId: order.Id,
            ExternalOrderId: order.ExternalOrderId,
            Amount: order.Amount,
            Fees: fees,
            Products: request.Products,
            Provider: new ProviderReferenceDto(order.ProviderId),
            Status: order.Status,
            PaymentMode: order.PaymentMode,
            CreatedAt: order.CreatedAt,
            UpdatedAt: order.UpdatedAt
        );

        return TypedResults.Created($"/api/orders/{order.Id}", responseDto);
    }

    public static string? NormalizePaymentMode(string mode)
    {
        return mode.Trim().ToLowerInvariant() switch
        {
            "cash" or "efectivo" or "pago en efectivo" => "Cash",
            "card" or "tdc" or "pago con tdc" or "pago en tdc" or "creditcard" or "tarjeta" => "Card",
            "transfer" or "transferencia" => "Transfer",
            _ => null
        };
    }

    public static string DetermineOptimalProvider(string normalizedMode, decimal totalAmount)
    {
        if (normalizedMode == "Cash")
        {
            return "PagaFacil";
        }

        if (normalizedMode == "Transfer")
        {
            return "CazaPagos";
        }

        // Card mode competition:
        // PagaFacil: 1% flat
        var pagaFacilFee = totalAmount * 0.01m;

        // CazaPagos:
        // 0 - 1500: 2%
        // 1500 - 5000: 1.5%
        // > 5000: 0.5%
        decimal cazaPagosFee;
        if (totalAmount <= 1500m) cazaPagosFee = totalAmount * 0.02m;
        else if (totalAmount <= 5000m) cazaPagosFee = totalAmount * 0.015m;
        else cazaPagosFee = totalAmount * 0.005m;

        return cazaPagosFee < pagaFacilFee ? "CazaPagos" : "PagaFacil";
    }
}
