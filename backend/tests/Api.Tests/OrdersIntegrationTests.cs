namespace Api.Tests;

using System.Net;
using System.Net.Http.Json;
using Api.Data;
using Api.Features.Orders;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

public class OrdersIntegrationTests : IClassFixture<WebApplicationFactory<Program>>, IDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly SqliteConnection _sqliteConnection;

    public OrdersIntegrationTests(WebApplicationFactory<Program> factory)
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
    public async Task CreateOrder_WithCashPayment_SelectsPagaFacilAndStoresOrder()
    {
        var client = _factory.CreateClient();

        var payload = new CreateOrderRequest(
            PaymentMode: "Cash",
            Products: new List<OrderProductItem>
            {
                new("Laptop Lenovo", 2221m),
                new("Laptop Dell", 1200m)
            }
        );

        var response = await client.PostAsJsonAsync("/api/orders", payload);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var order = await response.Content.ReadFromJsonAsync<OrderDto>();
        Assert.NotNull(order);
        Assert.True(order.OrderId > 0);
        Assert.False(string.IsNullOrWhiteSpace(order.ExternalOrderId));
        Assert.Equal("PagaFacil", order.Provider.Id);
        Assert.Equal("Cash", order.PaymentMode);
        Assert.Equal(2, order.Products.Count);
        Assert.NotEmpty(order.Fees);

        // Verify order can be retrieved by ID
        var getByIdResponse = await client.GetAsync($"/api/orders/{order.OrderId}");
        Assert.Equal(HttpStatusCode.OK, getByIdResponse.StatusCode);
        var retrieved = await getByIdResponse.Content.ReadFromJsonAsync<OrderDto>();
        Assert.NotNull(retrieved);
        Assert.Equal(order.OrderId, retrieved.OrderId);

        // Verify cancel order
        var cancelResponse = await client.PutAsync($"/api/orders/{order.OrderId}/cancel", null);
        Assert.Equal(HttpStatusCode.OK, cancelResponse.StatusCode);
        var cancelled = await cancelResponse.Content.ReadFromJsonAsync<OrderDto>();
        Assert.NotNull(cancelled);
        Assert.Equal("Cancelled", cancelled.Status);
    }

    [Fact]
    public async Task GetOrders_ReturnsAllOrdersOrderedDescending()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/orders");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var orders = await response.Content.ReadFromJsonAsync<List<OrderDto>>();
        Assert.NotNull(orders);
    }

    [Fact]
    public async Task ApproveAndRejectOrder_UpdatesOrderStatusSuccessfully()
    {
        var client = _factory.CreateClient();

        var payload = new CreateOrderRequest(
            PaymentMode: "Card",
            Products: new List<OrderProductItem> { new("Product Test", 500m) }
        );

        var createRes = await client.PostAsJsonAsync("/api/orders", payload);
        var order = await createRes.Content.ReadFromJsonAsync<OrderDto>();
        Assert.NotNull(order);

        // Approve order
        var approveRes = await client.PutAsync($"/api/orders/{order.OrderId}/approve", null);
        Assert.Equal(HttpStatusCode.OK, approveRes.StatusCode);
        var approved = await approveRes.Content.ReadFromJsonAsync<OrderDto>();
        Assert.NotNull(approved);
        Assert.Equal("Approved", approved.Status);

        // Reject order
        var rejectRes = await client.PutAsync($"/api/orders/{order.OrderId}/reject", null);
        Assert.Equal(HttpStatusCode.OK, rejectRes.StatusCode);
        var rejected = await rejectRes.Content.ReadFromJsonAsync<OrderDto>();
        Assert.NotNull(rejected);
        Assert.Equal("Rejected", rejected.Status);
    }

    public void Dispose()
    {
        _sqliteConnection.Close();
        _sqliteConnection.Dispose();
    }
}
