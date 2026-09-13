# Gatehouse

> A multi-vendor marketplace in which the entire identity, authentication, and authorization layer lives outside the application code — in Ory OSS components.

[![CI](https://github.com/s3ba-b/gatehouse-marketplace/actions/workflows/ci.yml/badge.svg)](https://github.com/s3ba-b/gatehouse-marketplace/actions/workflows/ci.yml)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)

> **Not affiliated with Ory.** Gatehouse is an independent open-source project that
> *uses* the Ory OSS components. It is not endorsed by, sponsored by, or connected
> to Ory Corp. "Ory" is their trademark and appears here only descriptively.

## Overview

Gatehouse is a realistic multi-vendor marketplace (B2C + B2B) built to demonstrate a
single architectural claim: **identity is infrastructure, not an application feature.**
The .NET services contain no login, password-reset, MFA, token-issuance, or
permission-checking code at all — every one of those concerns is handled by Ory
Kratos, Hydra, Keto, and Oathkeeper — and the system still supports three distinct
user populations that usually cost months of bespoke work: retail customers, vendor
organizations with internal roles, and external applications integrating over OAuth2.

The marketplace domain is deliberately shallow (catalog, orders, vendor accounts).
Anything that does not illustrate identity and access is out of scope by design.

New here? The [glossary](GLOSSARY.md) explains the domain and technical terms, and
[PRIVACY.md](PRIVACY.md) documents how personal data is handled. The full scope and
rationale live in [CHARTER.md](CHARTER.md); the delivery plan in [ROADMAP.md](ROADMAP.md).

## Features

- **Identity (Ory Kratos)** — registration, login, email verification, account
  recovery, and password change as self-service flows, with the UI rendered natively
  in Angular. TOTP and WebAuthn/passkeys, with a step-up (AAL2) requirement on
  sensitive operations such as vendor payouts. Social login via OIDC. Separate
  identity schemas for retail customers and vendor staff.
- **Permissions (Ory Keto)** — a relationship-based model (ReBAC) instead of flat
  roles: `organization:acme#member@user:kate`, `product:123#owner@organization:acme`.
  Vendor roles (`owner`, `manager`, `staff`) with inheritance, and per-resource
  permissions. The same decision engine answers both the gateway and the front-end,
  so conditional UI and enforced access share one source of truth.
- **Gateway (Ory Oathkeeper)** — a reverse proxy in front of every .NET service:
  authenticator (Kratos session or Hydra token) → authorizer (Keto query) → mutator
  (a signed JWT minted for the downstream service). Access rules are versioned
  configuration, not application code.
- **External integrations (Ory Hydra)** — a certified OAuth2/OIDC server for partner
  applications: Authorization Code + PKCE and Client Credentials, a consent screen
  with granular scopes (`orders:read`, `products:write`), and token revocation that
  cuts off a partner without touching anyone's password.
- **Zero-trust services** — .NET services reject any traffic that did not pass
  through the gateway, verifying the JWT signature against JWKS.
- **Demo scenario suite** — reproducible, scripted runs (seed data plus e2e tests),
  each illustrating one architectural benefit.

## Tech stack

- **Front-end:** Angular 20+ (standalone components, signals, Angular Material)
- **Back-end:** .NET 10, ASP.NET Core Minimal API, EF Core
- **Identity layer:** Ory Kratos, Hydra, Keto, Oathkeeper (self-hosted OSS, pinned image versions)
- **Orchestration:** .NET Aspire for development, Docker Compose as the portable reference run
- **Data:** PostgreSQL (separate databases for Kratos, Hydra, Keto, and the application domain), Redis for caching
- **Observability:** OpenTelemetry with the Aspire dashboard
- **Testing:** xUnit + Testcontainers (backend and isolation tests), Playwright (e2e for login and consent flows)
- **Mail (dev):** MailHog / Mailslurper, so Kratos sends real verification and recovery mail

## Getting started

### Prerequisites

- Docker (the Ory components are container images, not libraries) with roughly **8 GB of RAM** available
- [.NET 10 SDK](https://dotnet.microsoft.com/download) and the [Aspire CLI](https://learn.microsoft.com/dotnet/aspire/)
- Node.js 22+ and npm, for the Angular applications

### Run locally

Kratos flows are stateful and cookie-based, and the SPA calls Kratos and the gateway
directly from the browser — so they all need to live under one shared base domain
(subdomains), or the session cookie and CORS silently break (CHARTER.md). Add these
entries to your hosts file (`/etc/hosts` on Linux/macOS, `C:\Windows\System32\drivers\etc\hosts`
on Windows) — they all resolve to loopback, no real DNS involved:

```
127.0.0.1 kratos.gatehouse.test
127.0.0.1 gateway.gatehouse.test
127.0.0.1 storefront.gatehouse.test
```

Two ways to bring the stack up, depending on what's installed:

#### Option A — Aspire (for development)

In two terminals:

```bash
# Terminal 1 — Kratos, PostgreSQL, Oathkeeper, and the Catalog service
aspire run

# Terminal 2 — the Storefront (Angular)
cd src/Storefront
npm install
npm start
```

Open `http://storefront.gatehouse.test:4200`. The Playwright happy-path test
(registration → login → an authenticated request through the gateway) needs the same
two things running first:

```bash
cd src/Storefront
npx playwright install chromium   # once
npm run e2e
```

#### Option B — Docker Compose (portable reference run)

Needs only Docker — no .NET/Aspire toolchain, no Node.js. One command, after copying
the dev-only environment file:

```bash
cp .env.example .env
docker compose up -d --build
```

This builds the Catalog service and Storefront images (multi-stage Dockerfiles under
`src/Gatehouse.Catalog/` and `src/Storefront/`) and brings up the same topology as the
Aspire AppHost — Kratos, PostgreSQL, Oathkeeper, Catalog, Storefront — with the same
pinned image versions and bind-mounted Kratos/Oathkeeper config. Open
`http://storefront.gatehouse.test:4200` once every container reports healthy
(`docker compose ps`).

Measured cold start on a clean checkout (`docker compose down -v` plus every image,
including base images, removed first — the worst case a newcomer would actually hit):
**~55 seconds**, well under the ≤ 10 minute success measure (ROADMAP.md). The dominant
cost is pulling the Ory and .NET base images; on a slower connection than the one this
was measured on, budget more time for that step specifically.

Tear down with `docker compose down` (add `-v` to also drop the Postgres volume).

#### Mail (dev)

Kratos's courier is wired to send real SMTP mail to [MailHog](https://github.com/mailhog/MailHog),
a local dev-only sink — no real provider, no credentials. Registration sends a
verification mail automatically (issue #25), and the Storefront's recovery page
(`/recovery`, issue #26) sends a recovery mail on request. Read the delivered message,
including the verification/recovery code, at MailHog's web UI:
**http://localhost:8025**. Same URL under both Aspire and Docker Compose.

#### Account settings

A logged-in customer changes their password and profile traits at `/settings` (issue
#27, linked from the products page), rendered from Kratos's settings flow — one section
per method group, so TOTP/WebAuthn enrollment shows up there once those methods are
enabled. Changing the password more than 15 minutes after logging in
(`privileged_session_max_age` in `kratos.yml`) first asks for the password again, then
returns to the settings page to save.

#### Identity schemas

Kratos registers two identity schemas (issue #23) — `customer`
([customer.schema.json](src/Gatehouse.AppHost/kratos/customer.schema.json), the
`default_schema_id`) and `vendor-staff`
([vendor-staff.schema.json](src/Gatehouse.AppHost/kratos/vendor-staff.schema.json)) —
each with the profile traits its population needs (GLOSSARY.md). The Storefront
registration flow targets the customer schema. There is no Vendor Back-office UI yet
(that's M2, once Keto org membership exists), so a vendor-staff identity is created
directly through Kratos's admin API instead, against the same admin port both
orchestrators expose at `127.0.0.1:4434`:

```bash
curl -s -X POST http://127.0.0.1:4434/admin/identities \
  -H 'Content-Type: application/json' \
  -d '{
    "schema_id": "vendor-staff",
    "traits": { "email": "staff@example.test", "name": { "first": "Jane", "last": "Doe" } }
  }'
```

## Architecture

_TODO: architecture diagram + overview (M5)._ The short version: an Angular SPA talks
to Ory Kratos and Hydra directly for identity flows, and to the .NET services only
through Ory Oathkeeper, which authenticates the caller, asks Keto for an authorization
decision, and mints a short-lived JWT for the downstream service.

Architecture Decision Records justify every Ory component chosen — including the ones
deliberately rejected (Ladon, and Polis until an enterprise IdP appears).

## Deployment

_TODO: deployment instructions._ No paid services: self-hosted Ory OSS only, within
free tiers or run locally.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). This project uses an issue → branch → PR → merge flow.

## License

Licensed under the [GNU Affero General Public License v3.0](LICENSE).

**Why AGPL, and what it costs.** This is strong copyleft with a network-use clause:
anyone may self-host and study Gatehouse, but anyone offering it as a service must
publish their source. The Ory components are Apache-2.0 and there is no conflict —
Gatehouse never links Ory code, it talks to separate container processes over HTTP,
so this project's copyleft reaches its own code and nothing of Ory's.

Be aware of the trade-off before investing time: **some organizations have blanket
internal policies against AGPL-licensed code** and may be unable to reuse — or even
clone — this repository. That cost is accepted knowingly; this is a demonstration
project, and stating the constraint plainly up front is the mitigation.
