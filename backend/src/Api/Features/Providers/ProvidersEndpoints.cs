namespace Api.Features.Providers;

using Api.Data;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

public static class ProvidersEndpoints
{
    public static IEndpointRouteBuilder MapProvidersEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/providers")
            .WithTags("Providers");

        group.MapGet("/", GetProvidersAsync)
            .WithName("GetProviders")
            .WithSummary("Retrieves all payment providers and their fee calculation rules");

        group.MapPost("/", CreateProviderAsync)
            .WithName("CreateProvider")
            .WithSummary("Registers a new payment provider");

        group.MapDelete("/{id:int}", DeleteProviderAsync)
            .WithName("DeleteProvider")
            .WithSummary("Removes a payment provider");

        group.MapPost("/{id:int}/rules", AddRuleAsync)
            .WithName("AddProviderRule")
            .WithSummary("Adds a fee calculation rule to a provider");

        group.MapDelete("/{id:int}/rules/{ruleId:int}", DeleteRuleAsync)
            .WithName("DeleteProviderRule")
            .WithSummary("Deletes a fee rule from a provider");

        return app;
    }

    public static async Task<Ok<IReadOnlyList<ProviderDto>>> GetProvidersAsync(
        AppDbContext db,
        CancellationToken ct)
    {
        var providers = await db.Providers
            .AsNoTracking()
            .Include(p => p.Rules)
            .OrderBy(p => p.Id)
            .ToListAsync(ct);

        var dtos = providers.Select(p => new ProviderDto(
            Id: p.Id,
            Name: p.Name,
            CreatedAt: p.CreatedAt,
            Rules: p.Rules.Select(r => new ProviderRuleDto(
                Id: r.Id,
                ProviderId: r.ProviderId,
                Amount: r.Amount,
                Condition: r.Condition,
                Percentage: r.Percentage,
                PaymentMethod: r.PaymentMethod,
                CreatedAt: r.CreatedAt
            )).ToList()
        )).ToList();

        return TypedResults.Ok<IReadOnlyList<ProviderDto>>(dtos);
    }

    public static async Task<Results<Created<ProviderDto>, BadRequest<string>>> CreateProviderAsync(
        CreateProviderRequest request,
        AppDbContext db,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return TypedResults.BadRequest("Provider name is required.");
        }

        var provider = new Provider
        {
            Name = request.Name.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        db.Providers.Add(provider);
        await db.SaveChangesAsync(ct);

        var dto = new ProviderDto(
            Id: provider.Id,
            Name: provider.Name,
            CreatedAt: provider.CreatedAt,
            Rules: []
        );

        return TypedResults.Created($"/api/providers/{provider.Id}", dto);
    }

    public static async Task<Results<NoContent, NotFound<string>>> DeleteProviderAsync(
        int id,
        AppDbContext db,
        CancellationToken ct)
    {
        var provider = await db.Providers.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (provider == null)
        {
            return TypedResults.NotFound($"Provider with ID {id} was not found.");
        }

        db.Providers.Remove(provider);
        await db.SaveChangesAsync(ct);

        return TypedResults.NoContent();
    }

    public static async Task<Results<Created<ProviderRuleDto>, NotFound<string>, BadRequest<string>>> AddRuleAsync(
        int id,
        CreateProviderRuleRequest request,
        AppDbContext db,
        CancellationToken ct)
    {
        var provider = await db.Providers.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (provider == null)
        {
            return TypedResults.NotFound($"Provider with ID {id} was not found.");
        }

        if (request.Amount < 0)
        {
            return TypedResults.BadRequest("Amount must be non-negative.");
        }

        if (request.Percentage < 0)
        {
            return TypedResults.BadRequest("Percentage must be non-negative.");
        }

        var normalizedCondition = NormalizeCondition(request.Condition);
        var normalizedPaymentMethod = NormalizePaymentMethod(request.PaymentMethod);

        var rule = new ProviderRule
        {
            ProviderId = id,
            Amount = request.Amount,
            Condition = normalizedCondition,
            Percentage = request.Percentage,
            PaymentMethod = normalizedPaymentMethod,
            CreatedAt = DateTime.UtcNow
        };

        db.ProviderRules.Add(rule);
        await db.SaveChangesAsync(ct);

        var dto = new ProviderRuleDto(
            Id: rule.Id,
            ProviderId: rule.ProviderId,
            Amount: rule.Amount,
            Condition: rule.Condition,
            Percentage: rule.Percentage,
            PaymentMethod: rule.PaymentMethod,
            CreatedAt: rule.CreatedAt
        );

        return TypedResults.Created($"/api/providers/{id}/rules/{rule.Id}", dto);
    }

    public static async Task<Results<NoContent, NotFound<string>>> DeleteRuleAsync(
        int id,
        int ruleId,
        AppDbContext db,
        CancellationToken ct)
    {
        var rule = await db.ProviderRules.FirstOrDefaultAsync(r => r.Id == ruleId && r.ProviderId == id, ct);
        if (rule == null)
        {
            return TypedResults.NotFound($"Rule with ID {ruleId} for provider {id} was not found.");
        }

        db.ProviderRules.Remove(rule);
        await db.SaveChangesAsync(ct);

        return TypedResults.NoContent();
    }

    private static string NormalizeCondition(string condition)
    {
        return condition.Trim().ToLowerInvariant() switch
        {
            "more than" or "morethan" or ">" => "MoreThan",
            "equal and more than" or "equalandmorethan" or ">=" => "EqualAndMoreThan",
            "less than" or "lessthan" or "<" => "LessThan",
            "equal and less than" or "equalandlessthan" or "<=" => "EqualAndLessThan",
            _ => "MoreThan"
        };
    }

    private static string NormalizePaymentMethod(string? paymentMethod)
    {
        if (string.IsNullOrWhiteSpace(paymentMethod)) return "Card";
        return paymentMethod.Trim().ToLowerInvariant() switch
        {
            "card" or "tdc" or "pago en tdc" or "pago con tdc" or "creditcard" or "tarjeta" => "Card",
            "cash" or "efectivo" or "pago en efectivo" => "Cash",
            "transfer" or "transferencia" => "Transfer",
            _ => "Card"
        };
    }
}

