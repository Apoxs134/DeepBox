namespace Api.Features.Orders;

public class Order
{
    public int Id { get; set; }
    public string ExternalOrderId { get; set; } = string.Empty;
    public string ProviderId { get; set; } = string.Empty;
    public string PaymentMode { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Status { get; set; } = "Created";
    public string FeesJson { get; set; } = "[]";
    public string ProductsJson { get; set; } = "[]";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
