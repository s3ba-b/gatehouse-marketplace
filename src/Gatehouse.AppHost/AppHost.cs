var builder = DistributedApplication.CreateBuilder(args);

// Ory component versions are pinned deliberately (CHARTER.md) — bump only via a
// reviewed change against the Kratos changelog.
const string kratosImage = "oryd/kratos";
const string kratosImageTag = "v26.2.0";

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

builder
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

// The first .NET service for M0's walking skeleton (CLAUDE.md). No auth of its
// own and no gateway in front of it yet — direct reachability is intentional
// until the Oathkeeper gateway issue lands.
builder.AddProject<Projects.Gatehouse_Catalog>("catalog");

builder.Build().Run();
