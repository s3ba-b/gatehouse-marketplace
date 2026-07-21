using System.Net.Http.Headers;
using Aspire.Hosting;

namespace Gatehouse.Catalog.SecurityTests;

// The release gate (CLAUDE.md / issue #8): the Catalog service must refuse any
// request that doesn't carry a JWT signed by Oathkeeper, proving the service
// stays zero-trust regardless of whether the gateway is even reachable.
[Trait("Category", "Security")]
public sealed class GatewayBypassTests : IAsyncLifetime
{
    private static readonly TimeSpan DefaultTimeout = TimeSpan.FromMinutes(3);

    private DistributedApplication _app = null!;

    public async Task InitializeAsync()
    {
        var appHost =
            await DistributedApplicationTestingBuilder.CreateAsync<Projects.Gatehouse_AppHost>();
        _app = await appHost.BuildAsync().WaitAsync(DefaultTimeout);
        await _app.StartAsync().WaitAsync(DefaultTimeout);

        var resourcesToWaitFor = new[] { "catalog", "kratos", "oathkeeper" };
        await Task.WhenAll(
                resourcesToWaitFor.Select(resource =>
                    _app.ResourceNotifications.WaitForResourceHealthyAsync(resource)
                )
            )
            .WaitAsync(DefaultTimeout);
    }

    public async Task DisposeAsync() => await _app.DisposeAsync();

    [Fact]
    public async Task DirectRequestWithNoTokenIsRejected()
    {
        using var catalog = _app.CreateHttpClient("catalog");

        using var response = await catalog.GetAsync("/products");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task DirectRequestWithGarbageTokenIsRejected()
    {
        using var catalog = _app.CreateHttpClient("catalog");
        using var request = new HttpRequestMessage(HttpMethod.Get, "/products");
        request.Headers.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            "not-a-real-jwt.signed-by-nobody.garbage"
        );

        using var response = await catalog.SendAsync(request);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task RequestThroughGatewayWithValidSessionSucceeds()
    {
        using var kratosProbe = _app.CreateHttpClient("kratos", "public");
        var sessionCookie = await KratosBrowserSession.RegisterAndGetSessionCookieAsync(
            kratosProbe.BaseAddress!,
            $"{Guid.NewGuid()}@example.test",
            "correct-horse-battery-staple",
            CancellationToken.None
        );

        using var oathkeeper = _app.CreateHttpClient("oathkeeper", "proxy");
        using var request = new HttpRequestMessage(HttpMethod.Get, "/products");
        request.Headers.Add("Cookie", sessionCookie);

        using var response = await oathkeeper.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
