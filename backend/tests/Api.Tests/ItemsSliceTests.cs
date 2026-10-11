namespace Api.Tests;

using System.Net;
using System.Net.Http.Json;
using Api.Data;
using Api.Features.Items;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

public class ItemsSliceTests : IClassFixture<WebApplicationFactory<Program>>, IDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly SqliteConnection _sqliteConnection;

    public ItemsSliceTests(WebApplicationFactory<Program> factory)
    {
        _sqliteConnection = new SqliteConnection("Data Source=:memory:");
        _sqliteConnection.Open();

        _factory = factory.WithWebHostBuilder(builder =>
        {
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
    public async Task GetItems_ReturnsSuccessAndSeedData()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/items");

        // Assert
        response.EnsureSuccessStatusCode();
        var items = await response.Content.ReadFromJsonAsync<List<GetItems.Response>>();
        Assert.NotNull(items);
        Assert.NotEmpty(items);
    }

    [Fact]
    public async Task CreateItem_WithValidData_ReturnsCreatedItem()
    {
        // Arrange
        var client = _factory.CreateClient();
        var request = new CreateItem.Request(
            Name: "New Test Product",
            Details: "Testing slice",
            UnitPrice: 199.99m,
            IsAvailable: true
        );

        // Act
        var response = await client.PostAsJsonAsync("/api/items", request);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<CreateItem.Response>();
        Assert.NotNull(created);
        Assert.Equal("New Test Product", created.Name);
        Assert.Equal(199.99m, created.UnitPrice);
        Assert.True(created.Id > 0);
    }

    [Fact]
    public async Task CreateItem_WithEmptyName_ReturnsBadRequest()
    {
        // Arrange
        var client = _factory.CreateClient();
        var request = new CreateItem.Request(
            Name: "",
            Details: "Empty name test",
            UnitPrice: 50.00m
        );

        // Act
        var response = await client.PostAsJsonAsync("/api/items", request);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    public void Dispose()
    {
        _sqliteConnection.Dispose();
    }
}
