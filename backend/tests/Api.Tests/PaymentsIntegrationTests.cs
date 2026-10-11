namespace Api.Tests;

using System.Net;
using System.Net.Http.Json;
using Api.Data;
using Api.Features.Payments;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

public class PaymentsIntegrationTests : IClassFixture<WebApplicationFactory<Program>>, IDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly SqliteConnection _sqliteConnection;

    public PaymentsIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _sqliteConnection = new SqliteConnection("Data Source=:memory:");
        _sqliteConnection.Open();

        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureAppConfiguration((_, config) =>
            {
                config.AddUserSecrets<Program>(optional: true);
                config.AddEnvironmentVariables();
            });

            builder.ConfigureServices(services =>
            {
                var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                if (descriptor != null)
                {
                    services.Remove(descriptor);
                }

                services.AddDbContext<AppDbContext>(options =>
                {
                    options.UseSqlite(_sqliteConnection);
                });
            });
        });
    }

    [Fact]
    public async Task GetPaymentsHealth_ConnectsToBothProviders_ReturnsHealthyStatusAndLatency()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/payments/health");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var health = await response.Content.ReadFromJsonAsync<PaymentsHealthResponse>();

        Assert.NotNull(health);
        Assert.True(health.OverallHealthy, "Overall health check should be true when both gateways succeed.");
        Assert.Equal(2, health.Providers.Count);

        var pagaFacil = health.Providers.FirstOrDefault(p => p.Provider == "PagaFacil");
        Assert.NotNull(pagaFacil);
        Assert.True(pagaFacil.IsHealthy, $"PagaFacil failed: {pagaFacil.ErrorMessage}");
        Assert.Equal(200, pagaFacil.StatusCode);
        Assert.True(pagaFacil.LatencyMs >= 0);

        var cazaPagos = health.Providers.FirstOrDefault(p => p.Provider == "CazaPagos");
        Assert.NotNull(cazaPagos);
        Assert.True(cazaPagos.IsHealthy, $"CazaPagos failed: {cazaPagos.ErrorMessage}");
        Assert.Equal(200, cazaPagos.StatusCode);
        Assert.True(cazaPagos.LatencyMs >= 0);
    }

    [Fact]
    public async Task InitiatePayment_WithPagaFacilCash_CreatesOrderAndMapsResult()
    {
        // Arrange
        var client = _factory.CreateClient();
        var request = new InitiatePaymentRequest(
            Provider: "PagaFacil",
            Method: "Cash",
            Products: new List<PaymentProductDto>
            {
                new("Lenovo 3450", 2509.00m)
            }
        );

        // Act
        var response = await client.PostAsJsonAsync("/api/payments/initiate", request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var result = await response.Content.ReadFromJsonAsync<PaymentResult>();

        Assert.NotNull(result);
        Assert.Equal("PagaFacil", result.Provider);
        Assert.Equal("Cash", result.Method);
        Assert.NotEqual(Guid.Empty, result.ExternalOrderId);
        Assert.NotEmpty(result.Fees);
    }

    [Fact]
    public async Task InitiatePayment_WithInvalidProvider_ReturnsBadRequest()
    {
        // Arrange
        var client = _factory.CreateClient();
        var request = new InitiatePaymentRequest(
            Provider: "UnknownProvider",
            Method: "Cash",
            Products: new List<PaymentProductDto>
            {
                new("Test Product", 100.00m)
            }
        );

        // Act
        var response = await client.PostAsJsonAsync("/api/payments/initiate", request);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    public void Dispose()
    {
        _sqliteConnection.Dispose();
    }
}
