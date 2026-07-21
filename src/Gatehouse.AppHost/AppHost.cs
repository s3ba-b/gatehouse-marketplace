var builder = DistributedApplication.CreateBuilder(args);

// Ory component versions are pinned deliberately (CHARTER.md) — bump only via a
// reviewed change against the Kratos changelog.
const string kratosImage = "oryd/kratos";
const string kratosImageTag = "v26.2.0";

// Same pinning discipline as Kratos — review the Oathkeeper changelog before
// bumping (CHARTER.md).
const string oathkeeperImage = "oryd/oathkeeper";
const string oathkeeperImageTag = "v0.40.9";

var postgres = builder.AddPostgres("postgres").WithImageTag("18.4").WithDataVolume();

// Kratos gets its own database, separate from the future application domain database
// (CHARTER.md data layer: one Postgres database per Ory component).
var kratosDb = postgres.AddDatabase("kratos-db", "kratos");

var kratosDsn = ReferenceExpression.Create(
    $"postgres://{postgres.Resource.UserNameReference}:{postgres.Resource.PasswordParameter}@{postgres.Resource.Host}:{postgres.Resource.Port}/{kratosDb.Resource.DatabaseName}?sslmode=disable&max_conns=20&max_idle_conns=4"
);

var kratosConfigPath = Path.Combine(builder.AppHostDirectory, "kratos");

var kratosMigrate = builder
    .AddContainer("kratos-migrate", kratosImage, kratosImageTag)
    .WithBindMount(kratosConfigPath, "/etc/config/kratos", isReadOnly: true)
    .WithEnvironment("DSN", kratosDsn)
    .WithArgs("migrate", "sql", "-e", "--yes")
    .WaitFor(kratosDb);

var kratos = builder
    .AddContainer("kratos", kratosImage, kratosImageTag)
    .WithBindMount(kratosConfigPath, "/etc/config/kratos", isReadOnly: true)
    .WithEnvironment("DSN", kratosDsn)
    .WithArgs("serve", "--config", "/etc/config/kratos/kratos.yml")
    // Not proxied: Kratos's own base_url (kratos.yml) bakes in these exact ports, and
    // self-service flows redirect to it, so the advertised and bound ports must match.
    .WithHttpEndpoint(port: 4433, targetPort: 4433, name: "public", isProxied: false)
    .WithHttpEndpoint(port: 4434, targetPort: 4434, name: "admin", isProxied: false)
    .WithHttpHealthCheck("/health/ready", endpointName: "public")
    .WaitFor(kratosDb)
    .WaitForCompletion(kratosMigrate);

// The first .NET service for M0's walking skeleton (CLAUDE.md). Oathkeeper below
// is the only intended way in; nothing else in the app model routes to it.
var catalog = builder.AddProject<Projects.Gatehouse_Catalog>("catalog");

var oathkeeperConfigPath = Path.Combine(builder.AppHostDirectory, "oathkeeper");

// Gateway in front of the Catalog service (issue #7 / ADR 0001): Kratos session
// cookie -> placeholder allow-all authorizer (Keto lands in M2) -> signed id_token
// mutator. Access rules are versioned config (access-rules.json.tmpl in this repo),
// not application code — but the `catalog` upstream address is only known once
// Aspire resolves the container tunnel to that (host-process) project, so the
// template is rendered into /tmp at container start rather than baked in.
builder
    .AddContainer("oathkeeper", oathkeeperImage, oathkeeperImageTag)
    .WithBindMount(oathkeeperConfigPath, "/etc/config/oathkeeper", isReadOnly: true)
    .WithReference(catalog)
    .WithEntrypoint("sh")
    .WithArgs(
        "-c",
        "sed \"s#__CATALOG_UPSTREAM_URL__#$services__catalog__http__0#\" "
            + "/etc/config/oathkeeper/access-rules.json.tmpl > /tmp/access-rules.json && "
            + "exec oathkeeper serve --config /etc/config/oathkeeper/oathkeeper.yml"
    )
    .WithHttpEndpoint(port: 4455, targetPort: 4455, name: "proxy", isProxied: false)
    .WithHttpEndpoint(port: 4456, targetPort: 4456, name: "api", isProxied: false)
    .WithHttpHealthCheck("/health/alive", endpointName: "api")
    .WaitFor(kratos)
    .WaitFor(catalog);

builder.Build().Run();
