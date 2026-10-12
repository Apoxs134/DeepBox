namespace Api.Data;

using Api.Features.Products;
using Microsoft.EntityFrameworkCore;

public static class DbInitializer
{
    public static async Task InitializeAsync(AppDbContext context)
    {
        await context.Database.EnsureCreatedAsync();

        await context.Database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS ""Orders"" (
                ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_Orders"" PRIMARY KEY AUTOINCREMENT,
                ""ExternalOrderId"" TEXT NOT NULL,
                ""ProviderId"" TEXT NOT NULL,
                ""PaymentMode"" TEXT NOT NULL,
                ""Amount"" TEXT NOT NULL,
                ""Status"" TEXT NOT NULL,
                ""FeesJson"" TEXT NOT NULL,
                ""ProductsJson"" TEXT NOT NULL,
                ""CreatedAt"" TEXT NOT NULL,
                ""UpdatedAt"" TEXT NULL
            );

            CREATE TABLE IF NOT EXISTS ""Providers"" (
                ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_Providers"" PRIMARY KEY AUTOINCREMENT,
                ""Name"" TEXT NOT NULL,
                ""CreatedAt"" TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS ""ProviderRules"" (
                ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_ProviderRules"" PRIMARY KEY AUTOINCREMENT,
                ""ProviderId"" INTEGER NOT NULL CONSTRAINT ""FK_ProviderRules_Providers"" REFERENCES ""Providers"" (""Id"") ON DELETE CASCADE,
                ""Amount"" TEXT NOT NULL,
                ""Condition"" TEXT NOT NULL,
                ""Percentage"" TEXT NOT NULL,
                ""PaymentMethod"" TEXT NOT NULL DEFAULT 'Card',
                ""CreatedAt"" TEXT NOT NULL
            );
        ");

        try
        {
            await context.Database.ExecuteSqlRawAsync(@"
                ALTER TABLE ""ProviderRules"" ADD COLUMN ""PaymentMethod"" TEXT NOT NULL DEFAULT 'Card';
            ");
        }
        catch
        {
            // Column already exists
        }

        if (!await context.Providers.AnyAsync())
        {
            var pagaFacil = new Api.Features.Providers.Provider
            {
                Name = "PagaFacil",
                CreatedAt = DateTime.UtcNow,
                Rules =
                [
                    new Api.Features.Providers.ProviderRule
                    {
                        Amount = 0m,
                        Condition = "EqualAndMoreThan",
                        Percentage = 1.0m,
                        PaymentMethod = "Card",
                        CreatedAt = DateTime.UtcNow
                    }
                ]
            };

            var cazaPagos = new Api.Features.Providers.Provider
            {
                Name = "CazaPagos",
                CreatedAt = DateTime.UtcNow,
                Rules =
                [
                    new Api.Features.Providers.ProviderRule
                    {
                        Amount = 1500m,
                        Condition = "EqualAndLessThan",
                        Percentage = 2.0m,
                        PaymentMethod = "Card",
                        CreatedAt = DateTime.UtcNow
                    },
                    new Api.Features.Providers.ProviderRule
                    {
                        Amount = 5000m,
                        Condition = "EqualAndLessThan",
                        Percentage = 1.5m,
                        PaymentMethod = "Card",
                        CreatedAt = DateTime.UtcNow
                    },
                    new Api.Features.Providers.ProviderRule
                    {
                        Amount = 5000m,
                        Condition = "MoreThan",
                        Percentage = 0.5m,
                        PaymentMethod = "Card",
                        CreatedAt = DateTime.UtcNow
                    }
                ]
            };

            context.Providers.AddRange(pagaFacil, cazaPagos);
            await context.SaveChangesAsync();
        }



        if (!await context.Products.AnyAsync())
        {
            context.Products.AddRange(
                new Product
                {
                    Name = "Dell Inspiron 5050",
                    Details = "32Gb / 512 SSD / i7 2.2Ghz",
                    UnitPrice = 2350.00m,
                    IsAvailable = true
                },
                new Product
                {
                    Name = "Lenovo 3450",
                    Details = "16Gb / 512 SSD / i5 1.6Ghz",
                    UnitPrice = 2509.00m,
                    IsAvailable = true
                },
                new Product
                {
                    Name = "Desk Flexible",
                    Details = "4 Positions",
                    UnitPrice = 3578.00m,
                    IsAvailable = true
                },
                new Product
                {
                    Name = "Headset 450p",
                    Details = "Logitech / Active Noise Can",
                    UnitPrice = 459.00m,
                    IsAvailable = false
                }
            );

            await context.SaveChangesAsync();
        }
    }
}
