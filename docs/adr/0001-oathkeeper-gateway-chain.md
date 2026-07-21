# 0001: Oathkeeper authenticator → authorizer → mutator chain for the Catalog gateway

## Status

Accepted (M0). The authorizer described here is a documented placeholder — see
"Placeholder authorizer" below — expected to be superseded in M2 without
revisiting the rest of this decision.

## Context

CHARTER.md's core invariant is that no request reaches a .NET service without
passing through Ory Oathkeeper. M0's definition of done requires that a request
to the API traverse the gateway and reach the Catalog service carrying a JWT
(ROADMAP.md). Oathkeeper reaches an allow/deny decision per request by running a
chain of exactly one authenticator, one authorizer, and a list of mutators,
configured per access rule (GLOSSARY.md: "Access rule"). At M0, only Kratos
exists — Keto (M2) and Hydra/OAuth2 (M4) do not — so the chain has to be chosen
against a stack that is deliberately incomplete.

Access rules must be versioned configuration in the repository, not application
code (CHARTER.md), which also constrains how the Catalog service's upstream
address can be wired in: it is a plain repo file, not something computed by the
AppHost's C#.

## Decision

For the `GET /products` access rule fronting the Catalog service:

- **Authenticator: `cookie_session`.** Validates the incoming Ory Kratos session
  cookie against Kratos's public API (`/sessions/whoami`). This is the only
  authenticator enabled in M0 — Hydra/OAuth2 bearer tokens are M4, so
  `oauth2_introspection` isn't configured yet.
- **Authorizer: `allow`.** Every request that clears authentication is allowed.
  See "Placeholder authorizer" below.
- **Mutator: `id_token`.** Mints a JWT signed with an RS256 key, forwarded to the
  Catalog service in an `Authorization: Bearer` header. The Catalog service (and
  any future service behind the gateway) verifies this signature against
  Oathkeeper's JWKS rather than trusting the request outright — that
  verification is the next issue's negative test, not this one's.

Access rules live in `access-rules.json.tmpl` under
`src/Gatehouse.AppHost/oathkeeper/`, versioned alongside `oathkeeper.yml`. The
Catalog service's upstream URL isn't known until Aspire resolves it (the Catalog
service is a host process reached from the Oathkeeper container through
Aspire's container tunnel, whose address can change from run to run) — see
[Container networking](https://aspire.dev/fundamentals/container-networking/).
Since Oathkeeper's access rule schema has no environment-variable expansion for
`upstream.url` ([ory/oathkeeper#853](https://github.com/ory/oathkeeper/issues/853)
remains open), the container's entrypoint substitutes the resolved address into
the template with `sed` before starting `oathkeeper serve`, writing the result
to `/tmp` rather than the read-only, bind-mounted config directory. The checked-in
template is still the single source of truth for the rule itself; only the one
address is resolved at container start.

The `id_token` mutator's signing key (`id_token.jwks.json`) is a plain, insecure
RSA key committed for local development, the same posture CHARTER.md already
accepts for `kratos.yml`'s cookie/cipher secrets. It must never be reused outside
local development.

## Placeholder authorizer

`allow` is a no-op: it does not consult Keto, because Keto does not exist until
M2 (ROADMAP.md). This means M0 grants any authenticated identity access to
`GET /products` regardless of vendor or role — there is no cross-vendor
isolation at the gateway yet, because there is nothing to isolate against
(catalog data is still hardcoded placeholder data per issue #6). This is
intentional scope for the walking skeleton, not an oversight: M0's goal is
proving the authenticator → authorizer → mutator chain and the zero-trust JWT
boundary exist, not proving the permission model. The authorizer is expected to
change to `keto_engine_acp_ory` (or equivalent) in M2, at which point this ADR
should be superseded rather than amended, since the mutator and authenticator
choices are not expected to change alongside it.

## Consequences

- Every protected endpoint added after this one follows the same chain shape
  (authenticator → authorizer → mutator), so adding a new rule is a config
  change to `access-rules.json.tmpl`, not new C#.
- Because access rules are data, swapping Oathkeeper for a different proxy later
  (CHARTER.md's noted risk: Oathkeeper's slower pace of development) only
  requires re-expressing this same rule set against the new proxy's schema, not
  redesigning the authorization model.
- The `sed`-based template rendering is a stopgap for the one value that must
  vary per run (the Catalog upstream address) under M0's constraints. If more
  such values appear as more services join the gateway, this ADR's rendering
  approach — not the chain — should be revisited.
