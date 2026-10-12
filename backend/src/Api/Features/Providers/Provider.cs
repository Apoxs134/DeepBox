namespace Api.Features.Providers;

public class Provider
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<ProviderRule> Rules { get; set; } = [];
}
