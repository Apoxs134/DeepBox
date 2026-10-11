namespace Api.Data;

using Microsoft.EntityFrameworkCore;
using Api.Features.Products;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Product> Products => Set<Product>();

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
    }
}
