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
        ");

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
