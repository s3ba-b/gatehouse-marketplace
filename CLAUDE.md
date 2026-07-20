# CLAUDE.md

## What this repository is

Gatehouse — a multi-vendor marketplace whose entire identity, authentication, and
authorization layer lives outside the application code, in Ory OSS components
(Kratos, Hydra, Keto, Oathkeeper). Full scope, objectives, and rationale live in
[CHARTER.md](CHARTER.md); the delivery plan and current milestone in
[ROADMAP.md](ROADMAP.md); domain/technical vocabulary in [GLOSSARY.md](GLOSSARY.md).

Stack: Angular 20+ (front-end) · .NET 10 / ASP.NET Core Minimal API / EF Core
(back-end) · Ory Kratos/Hydra/Keto/Oathkeeper · .NET Aspire (dev) + Docker Compose
(reference run) · PostgreSQL · Redis · xUnit + Testcontainers · Playwright.

## The core architectural rule — read this before touching anything

**No request reaches a .NET service without passing through Ory Oathkeeper, and no
vendor can ever see another vendor's data.** This is not a guideline; it is the
project's entire reason to exist, and it is a **CI release gate**. Concretely:

- Every protected endpoint needs an **Oathkeeper access rule** and a **negative test**
  proving a request that bypasses the gateway is rejected (JWT signature invalid
  against JWKS).
- Every vendor-scoped entity needs a **cross-vendor isolation test**.
- Authorization decisions live in **Keto relation tuples and Oathkeeper policy** —
  never as a hand-rolled `if` in a .NET service. Services enforce; they do not decide.
- **Zero lines of authentication/authorization code in the .NET services** is a
  literal success measure (see ROADMAP.md), checked by review and an architecture
  test. If you find yourself writing a login check, a password comparison, or a role
  lookup inside a service, stop — that logic belongs in Kratos/Keto/Oathkeeper
  configuration, not in this codebase.

See [CONTRIBUTING.md](CONTRIBUTING.md) for how this is enforced end-to-end (CI gate +
issue template checklist + this file).

## Workflow

Issue → branch → PR → merge. `main` is protected; **never commit directly to it**.
Branch names: `feat/`, `fix/`, `chore/`, `docs/` + short description. Every PR should
map to an issue and close it (`Closes #N`). See [CONTRIBUTING.md](CONTRIBUTING.md)
for the full flow, formatting gates, and secret-handling rules.

Only the **current milestone** has filed issues; later milestones are empty GitHub
milestones with just a definition of done. See ROADMAP.md's "How to start the next
milestone" section before assuming a feature is out of scope or not yet planned —
it may simply not be broken down into issues yet.

## Working with the stack

- **Aspire skills are installed** under `.claude/skills/` (`aspire`,
  `aspire-init`, `aspire-orchestration`, `aspire-monitoring`, `aspire-deployment`) —
  consult them for AppHost setup, running/monitoring the app, and deployment; don't
  reinvent Aspire conventions from scratch.
- **Formatting is CI-enforced and version-pinned.** Run `dotnet tool restore` once,
  then `dotnet csharpier check .` (or `dotnet csharpier .` to fix) before pushing
  .NET changes. Front-end changes go through `npx prettier --check .` and
  `npm run lint`.
- **NuGet restore is pinned to nuget.org only** via `nuget.config` (`<clear />` +
  a single source) so CI and every contributor restore from the same feed regardless
  of what's configured on their machine.
- **Ory components are containers, not libraries** — local dev needs Docker and
  roughly 8 GB RAM. Component image versions are pinned deliberately; bumping them is
  a controlled, deliberate change, not a routine dependency update (Dependabot will
  propose Docker-tag bumps — review the Ory changelog before merging one).
- **Secrets never enter the repo.** Hydra signing keys, OAuth2 client secrets, and DB
  credentials come from environment variables / `.env.example` locally and GitHub
  Secrets in CI. `.gitignore` blocks common secret file patterns, but that is a
  backstop, not a substitute for care.

## Boundaries — don't scope-creep the charter

- The marketplace domain (catalog, orders, vendor accounts) is **deliberately
  shallow**. If a feature doesn't illustrate identity or access, it's a candidate for
  cutting, not an obvious addition.
- Payments are **out of scope** — orders end at a simulated settlement.
- **Ory Ladon is rejected** (superseded by Keto) and **Ory Polis (SAML)** is deferred
  to an M5+ extension — don't reach for either without checking CHARTER.md's rationale
  first.
- **No official Ory SDKs for .NET/Angular at Go/Node parity** — integration goes
  through OpenAPI-generated clients plus a thin hand-written wrapper layer, not a
  from-scratch HTTP client per component.
- **Naming:** never put "Ory" in a package identifier, namespace, or user-facing
  product name — it's used only in descriptive prose. This project is not affiliated
  with, endorsed by, or sponsored by Ory Corp.
- **License is AGPL-3.0**, not the template's default Apache-2.0 — see NOTICE and the
  License section of README.md for why that's compatible with the (Apache-2.0) Ory
  components.
