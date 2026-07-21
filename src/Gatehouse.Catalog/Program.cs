var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

var app = builder.Build();

app.MapDefaultEndpoints();

// Hardcoded placeholder data — EF Core + real persistence lands in M3
// (see CLAUDE.md / issue #6). This endpoint exists only so the M0 gateway
// and JWT-verification work has a real service to protect.
var products = new[]
{
    new Product(1, "Espresso Beans, 1kg", 18.50m),
    new Product(2, "Pour-Over Kettle", 42.00m),
    new Product(3, "Ceramic Mug", 12.75m),
};

app.MapGet("/products", () => products);

app.Run();

internal sealed record Product(int Id, string Name, decimal Price);
