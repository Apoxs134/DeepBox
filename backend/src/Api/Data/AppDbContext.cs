namespace Api.Data;

using Microsoft.EntityFrameworkCore;
using Api.Features.Items;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Item> Items => Set<Item>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Item>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Details).HasMaxLength(500);
            entity.Property(e => e.UnitPrice).HasPrecision(18, 2);
        });
    }
}
