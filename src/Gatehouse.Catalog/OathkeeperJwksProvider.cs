using Microsoft.IdentityModel.Tokens;

namespace Gatehouse.Catalog;

// Oathkeeper's id_token mutator signs JWTs but exposes no OpenID Connect discovery
// document (only a bare /.well-known/jwks.json), so JwtBearerOptions.Authority /
// MetadataAddress — which expect an OIDC discovery doc — don't apply here. This
// fetches and caches the JWKS directly instead.
internal sealed class OathkeeperJwksProvider(HttpClient httpClient)
{
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(5);

    private readonly SemaphoreSlim _refreshLock = new(1, 1);
    private IReadOnlyList<SecurityKey> _keys = [];
    private DateTimeOffset _fetchedAt = DateTimeOffset.MinValue;

    public IEnumerable<SecurityKey> GetSigningKeys(string jwksUri)
    {
        if (_keys.Count == 0 || DateTimeOffset.UtcNow - _fetchedAt > CacheDuration)
        {
            RefreshAsync(jwksUri).GetAwaiter().GetResult();
        }

        return _keys;
    }

    private async Task RefreshAsync(string jwksUri)
    {
        await _refreshLock.WaitAsync();
        try
        {
            if (_keys.Count > 0 && DateTimeOffset.UtcNow - _fetchedAt <= CacheDuration)
            {
                return;
            }

            var json = await httpClient.GetStringAsync(jwksUri);
            _keys = [.. new JsonWebKeySet(json).GetSigningKeys()];
            _fetchedAt = DateTimeOffset.UtcNow;
        }
        finally
        {
            _refreshLock.Release();
        }
    }
}
