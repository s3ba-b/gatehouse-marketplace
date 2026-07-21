using System.Net;
using System.Text;
using System.Text.Json;

namespace Gatehouse.Catalog.SecurityTests;

// Oathkeeper's cookie_session authenticator (oathkeeper.yml) validates a real
// Kratos browser-flow session cookie against /sessions/whoami — not an API-flow
// session token — so getting a request through the gateway means driving the
// same browser registration flow a front-end would. Kratos also runs a
// two-step registration by default (collect the "profile" trait first, then
// choose a credential method), so this submits the flow twice.
internal static class KratosBrowserSession
{
    public static async Task<string> RegisterAndGetSessionCookieAsync(
        Uri kratosPublicBaseAddress,
        string email,
        string password,
        CancellationToken cancellationToken
    )
    {
        using var handler = new HttpClientHandler { UseCookies = false };
        using var kratos = new HttpClient(handler) { BaseAddress = kratosPublicBaseAddress };
        kratos.DefaultRequestHeaders.Accept.Add(new("application/json"));

        using var initResponse = await kratos.GetAsync(
            "/self-service/registration/browser",
            cancellationToken
        );
        initResponse.EnsureSuccessStatusCode();
        var csrfCookie = ExtractSetCookie(initResponse, "csrf_token_");
        var (flowId, csrfToken) = await ReadFlowAsync(initResponse, cancellationToken);

        using var profileResponse = await SubmitAsync(
            kratos,
            flowId,
            csrfCookie,
            new
            {
                method = "profile",
                csrf_token = csrfToken,
                traits = new { email },
            },
            cancellationToken
        );
        (_, csrfToken) = await ReadFlowAsync(profileResponse, cancellationToken);

        using var passwordResponse = await SubmitAsync(
            kratos,
            flowId,
            csrfCookie,
            new
            {
                method = "password",
                csrf_token = csrfToken,
                password,
                traits = new { email },
            },
            cancellationToken
        );
        passwordResponse.EnsureSuccessStatusCode();

        return ExtractSetCookie(passwordResponse, "ory_kratos_session=");
    }

    private static async Task<HttpResponseMessage> SubmitAsync(
        HttpClient kratos,
        string flowId,
        string csrfCookie,
        object body,
        CancellationToken cancellationToken
    )
    {
        using var request = new HttpRequestMessage(
            HttpMethod.Post,
            $"/self-service/registration?flow={flowId}"
        )
        {
            Content = new StringContent(
                JsonSerializer.Serialize(body),
                Encoding.UTF8,
                "application/json"
            ),
        };
        request.Headers.Add("Cookie", csrfCookie);

        var response = await kratos.SendAsync(request, cancellationToken);

        // Kratos answers an intermediate step of the two-step flow with 400 even
        // though the flow itself is progressing normally, so both are expected.
        if (response.StatusCode is HttpStatusCode.OK or HttpStatusCode.BadRequest)
        {
            return response;
        }

        var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
        throw new InvalidOperationException(
            $"Unexpected Kratos registration response {response.StatusCode}: {errorBody}"
        );
    }

    private static async Task<(string FlowId, string CsrfToken)> ReadFlowAsync(
        HttpResponseMessage response,
        CancellationToken cancellationToken
    )
    {
        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        using var flow = JsonDocument.Parse(json);

        var flowId = flow.RootElement.GetProperty("id").GetString()!;
        var csrfToken = flow
            .RootElement.GetProperty("ui")
            .GetProperty("nodes")
            .EnumerateArray()
            .Select(node => node.GetProperty("attributes"))
            .First(attributes => attributes.GetProperty("name").GetString() == "csrf_token")
            .GetProperty("value")
            .GetString()!;

        return (flowId, csrfToken);
    }

    private static string ExtractSetCookie(HttpResponseMessage response, string namePrefix)
    {
        var setCookie = response
            .Headers.GetValues("Set-Cookie")
            .First(value => value.StartsWith(namePrefix, StringComparison.Ordinal));

        return setCookie[..setCookie.IndexOf(';')];
    }
}
