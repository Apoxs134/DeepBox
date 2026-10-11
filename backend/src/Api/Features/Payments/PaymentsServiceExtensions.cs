namespace Api.Features.Payments;

public static class PaymentsServiceExtensions
{
    public static IServiceCollection AddPaymentClients(this IServiceCollection services, IConfiguration configuration)
    {
        var apiKey = configuration["PaymentGateway:ApiKey"]
            ?? throw new InvalidOperationException("Configuration 'PaymentGateway:ApiKey' is missing. Please configure it via User Secrets or environment variables.");

        // Typed Client for PagaFacil with Polly standard resilience handler
        services.AddHttpClient<IPagaFacilClient, PagaFacilClient>(client =>
        {
            client.BaseAddress = new Uri("https://app-paga-chg-aviva.azurewebsites.net");
            client.DefaultRequestHeaders.Add("x-api-key", apiKey);
        })
        .AddStandardResilienceHandler();

        // Typed Client for CazaPagos with Polly standard resilience handler
        services.AddHttpClient<ICazaPagosClient, CazaPagosClient>(client =>
        {
            client.BaseAddress = new Uri("https://app-caza-chg-aviva.azurewebsites.net");
            client.DefaultRequestHeaders.Add("x-api-key", apiKey);
        })
        .AddStandardResilienceHandler();

        return services;
    }
}
