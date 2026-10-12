namespace Api.Features.Providers;

public class ProviderRule
{
    public int Id { get; set; }
    public int ProviderId { get; set; }
    public decimal Amount { get; set; }
    public string Condition { get; set; } = "MoreThan"; // "MoreThan", "EqualAndMoreThan", "LessThan", "EqualAndLessThan"
    public decimal Percentage { get; set; }
    public string PaymentMethod { get; set; } = "Card"; // "Card", "Cash", "Transfer"
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Provider? Provider { get; set; }

}
