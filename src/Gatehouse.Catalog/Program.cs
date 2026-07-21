using Gatehouse.Catalog;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

// Zero-trust boundary (CLAUDE.md / issue #8): the Catalog service verifies the
// Oathkeeper-minted id_token's signature itself, so it stays provably ungated
// even if a request bypasses the gateway entirely. This is signature
// verification only — the authorization decision (who is allowed) lives in
// Keto/Oathkeeper policy, never here.
var oathkeeperIssuer = builder.Configuration["Oathkeeper:IssuerUrl"]!;
var oathkeeperJwksUri = builder.Configuration["Oathkeeper:JwksUri"]!;

builder.Services.AddHttpClient<OathkeeperJwksProvider>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();

builder
    .Services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
    .Configure<OathkeeperJwksProvider>(
        (options, jwks) =>
        {
            options.RequireHttpsMetadata = false; // local dev / CI only — see oathkeeper.yml
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = oathkeeperIssuer,
                ValidateAudience = false,
                ValidateLifetime = true,
                IssuerSigningKeyResolver = (_, _, _, _) => jwks.GetSigningKeys(oathkeeperJwksUri),
            };
        }
    );

builder.Services.AddAuthorization();

var app = builder.Build();

app.MapDefaultEndpoints();

app.UseAuthentication();
app.UseAuthorization();

// Hardcoded placeholder data — EF Core + real persistence lands in M3
// (see CLAUDE.md / issue #6). This endpoint exists only so the M0 gateway
// and JWT-verification work has a real service to protect.
var products = new[]
{
    new Product(1, "Espresso Beans, 1kg", 18.50m),
    new Product(2, "Pour-Over Kettle", 42.00m),
    new Product(3, "Ceramic Mug", 12.75m),
};

app.MapGet("/products", () => products).RequireAuthorization();

app.Run();

internal sealed record Product(int Id, string Name, decimal Price);
