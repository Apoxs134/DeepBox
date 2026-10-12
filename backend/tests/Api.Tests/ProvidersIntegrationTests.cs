namespace Api.Tests;

using System.Net;
using System.Net.Http.Json;
using Api.Data;
using Api.Features.Providers;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

public class ProvidersIntegrationTests : IClassFixture<WebApplicationFactory<Program>>, IDisposable
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly SqliteConnection _sqliteConnection;

    public ProvidersIntegrationTests(WebApplicationFactory<Program> factory)
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
    public async Task GetProviders_ReturnsSeededProviders()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/api/providers");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var providers = await response.Content.ReadFromJsonAsync<List<ProviderDto>>();
        Assert.NotNull(providers);
        Assert.NotEmpty(providers);
    }

    [Fact]
    public async Task CreateProvider_AddRule_And_DeleteRule_Succeeds()
    {
        var client = _factory.CreateClient();

        // 1. Create provider
        var createReq = new CreateProviderRequest("StripeTest");
        var createRes = await client.PostAsJsonAsync("/api/providers", createReq);
        Assert.Equal(HttpStatusCode.Created, createRes.StatusCode);
        var provider = await createRes.Content.ReadFromJsonAsync<ProviderDto>();
        Assert.NotNull(provider);
        Assert.Equal("StripeTest", provider.Name);

        // 2. Add rule
        var ruleReq = new CreateProviderRuleRequest(1000m, "MoreThan", 1.2m, "Card");
        var ruleRes = await client.PostAsJsonAsync($"/api/providers/{provider.Id}/rules", ruleReq);
        Assert.Equal(HttpStatusCode.Created, ruleRes.StatusCode);
        var rule = await ruleRes.Content.ReadFromJsonAsync<ProviderRuleDto>();
        Assert.NotNull(rule);
        Assert.Equal(1000m, rule.Amount);
        Assert.Equal("MoreThan", rule.Condition);
        Assert.Equal(1.2m, rule.Percentage);
        Assert.Equal("Card", rule.PaymentMethod);

        // 3. Delete rule

        var deleteRuleRes = await client.DeleteAsync($"/api/providers/{provider.Id}/rules/{rule.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteRuleRes.StatusCode);

        // 4. Delete provider
        var deleteProviderRes = await client.DeleteAsync($"/api/providers/{provider.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteProviderRes.StatusCode);
    }

    public void Dispose()
    {
        _sqliteConnection.Close();
        _sqliteConnection.Dispose();
    }
}
