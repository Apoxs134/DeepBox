namespace Api.Data;

using Microsoft.EntityFrameworkCore;
using Api.Features.Products;
using Api.Features.Orders;
using Api.Features.Providers;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<Provider> Providers => Set<Provider>();
    public DbSet<ProviderRule> ProviderRules => Set<ProviderRule>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Details).HasMaxLength(500);
            entity.Property(e => e.UnitPrice).HasPrecision(18, 2);
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ExternalOrderId).IsRequired().HasMaxLength(100);
            entity.Property(e => e.ProviderId).IsRequired().HasMaxLength(50);
            entity.Property(e => e.PaymentMode).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Amount).HasPrecision(18, 2);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
        });

        modelBuilder.Entity<Provider>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.HasMany(e => e.Rules)
                  .WithOne(e => e.Provider)
                  .HasForeignKey(e => e.ProviderId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ProviderRule>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Condition).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Amount).HasPrecision(18, 2);
            entity.Property(e => e.Percentage).HasPrecision(18, 4);
            entity.Property(e => e.PaymentMethod).IsRequired().HasMaxLength(50).HasDefaultValue("Card");
        });
    }
}



