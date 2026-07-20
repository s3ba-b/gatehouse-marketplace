# Project Charter

| Field | Value |
|---|---|
| **Project name** | Gatehouse — Multi-Vendor Marketplace as a Showcase for an Ory OSS Identity & Access Layer |
| **Acronym** | GMAP (Gatehouse Marketplace Access Platform) |
| **Creation date** | 20.07.2026 |
| **Target completion date** | 31.01.2027 (~6 months, solo part-time effort) |
| **Stack** | Angular (front-end) · .NET 10 (back-end) · Ory Kratos / Hydra / Keto / Oathkeeper |

## Project objectives (what we want to achieve)

Build a realistic multi-vendor marketplace (B2C + B2B) in which **the entire identity, authentication, and authorization layer is lifted out of the application code** into Ory Open Source components. The .NET application contains not a single line of login, password reset, MFA, token issuance, or permission-checking code — and still handles scenarios that typically cost months of work in a conventional project.

The project pursues three parallel goals:

1. **Solve a real technical problem.** Teams routinely write their own login systems, role models, and partner integrations. The result is authorization logic scattered across every service, no auditability, and security gaps. Gatehouse demonstrates the alternative architecture: identity as infrastructure, not as an application feature.
2. **Solve a real business problem.** A marketplace has three distinct user populations — retail customers, vendor staff (organizations with roles), and external applications (ERP integrations, analytics tools). Each needs a different access model, and all three must coexist in one system. This is exactly the situation where Ory's components outperform a single off-the-shelf "login box".
3. **Serve as a portfolio / demonstration piece.** Produce a documented repository that runs with one command, with an architecture diagram and a set of reproducible demo scenarios that can be shown live.

### Problems we solve

| Problem | How we address it |
|---|---|
| Authorization logic spread across services — inconsistent and untestable | Central policies in Ory Oathkeeper plus a permission model in Ory Keto; .NET services only enforce decisions, they never make them |
| Home-grown passwords, MFA, and recovery — expensive and error-prone | Ory Kratos as a complete identity system with self-service flows |
| Partner integrations on shared API keys — no scopes, no user consent, no revocation | Ory Hydra as a certified OAuth2/OIDC server with a consent screen and scopes |
| Team permissions (vendor = organization with roles) modelled as a `UserRoles` table | Ory Keto (Google Zanzibar–inspired model) — relationships instead of roles hardcoded in the application |
| Personal data scattered across microservice databases, GDPR rights unimplementable | Kratos as the single source of PII; services operate on a non-identifying subject id |

## Results and scope

### Expected products / services

| Product | Description |
|---|---|
| **Marketplace API (.NET 10)** | Backend services: product catalog, orders, vendor accounts. No auth layer of their own — they trust only the JWT issued by Oathkeeper. |
| **Ory layer** | Kratos (identity), Hydra (OAuth2/OIDC for external integrations), Keto (permissions), Oathkeeper (Identity & Access Proxy in front of the APIs). |
| **Angular SPA — Storefront** | Retail customer shop: registration, login, MFA, profile, orders — built entirely on Kratos self-service flows rendered natively in Angular. |
| **Angular SPA — Vendor Back-office** | Vendor panel: product, team, and role management plus order overview; feature visibility driven by Keto responses. |
| **Angular — Login / Consent UI** | Custom UI for Kratos flows and Hydra's consent screen (Ory ships APIs, not interfaces) — demonstrates full control over branding and UX. |
| **Partner App (demo)** | A minimal external application performing OAuth2 Authorization Code + PKCE against Hydra to read a vendor's orders under the `orders:read` scope — proof that partner integrations work without sharing a password. |
| **Demo scenario suite** | Reproducible, scripted runs (seed data plus e2e tests), each illustrating one architectural benefit. |
| **Documentation** | README, architecture diagram, "run locally" guide, and ADRs justifying every Ory component chosen — including the ones deliberately rejected. |

### Main functionalities and features

**Identity and authentication (Ory Kratos)**
- Registration, login, email verification, account recovery, and password change — self-service flows with the UI living in Angular.
- **Multi-factor authentication:** TOTP and WebAuthn/passkeys; a step-up (AAL2) requirement for sensitive operations such as vendor payouts.
- Social login (OIDC: Google/GitHub) as an alternative method.
- Configurable identity schemas — different profile fields for a retail customer than for vendor staff.

**Authorization and permissions (Ory Keto)**
- Relationship-based model (ReBAC) instead of flat roles: `organization:acme#member@user:kate`, `product:123#owner@organization:acme`.
- Roles within a vendor organization: `owner`, `manager`, `staff`, with permission inheritance.
- Per-resource permissions (access to a specific product or order, not to "all products").
- The same decision engine queried both by the gateway (before a request reaches the API) and by the front-end (for conditional UI rendering) — one source of truth.

**Gateway and access policies (Ory Oathkeeper)**
- Reverse proxy in front of every .NET service: **authenticator** (Kratos session or Hydra token) → **authorizer** (Keto query) → **mutator** (signed JWT minted for the downstream service).
- Access rules as configuration versioned in the repository, not as application code.
- Zero-trust: .NET services reject any traffic that did not pass through the gateway (JWT signature verified against JWKS).

**External integrations (Ory Hydra)**
- OAuth2/OIDC server for partner applications: Authorization Code + PKCE, plus Client Credentials for machine-to-machine integrations.
- Consent screen with granular scopes (`orders:read`, `products:write`) — the vendor knowingly grants a bounded level of access.
- Token revocation, so a partner's access can be cut off without touching any user's password.

**Deliberately rejected / out of scope**
- **Ory Ladon** — a Go library, functionally superseded by Keto; using it in a .NET project would be an anachronism. The decision and its rationale go into an ADR, because "why not Ladon?" is a question that comes up often.
- **Ory Polis (SAML / enterprise SSO)** — an optional extension (M5+), worth adding only once an enterprise vendor with its own IdP enters the picture.

### Technologies and tools beyond Ory

| Layer | Choice | Rationale |
|---|---|---|
| Front-end | Angular 20+, standalone components, signals, Angular Material | Required stack; the SPA consumes the Kratos and Hydra APIs directly |
| Back-end | .NET 10, ASP.NET Core Minimal API, EF Core | Required stack |
| Orchestration | .NET Aspire (dev) plus Docker Compose (reference run) | Aspire provides the dashboard and service discovery; Compose guarantees portability, since the Ory components are container images rather than .NET projects |
| Databases | PostgreSQL — separate databases for Kratos, Hydra, Keto, and the application domain | Ory's recommendation; separates PII from business data |
| Cache / sessions | Redis | Catalog and authorization-decision caching |
| Observability | OpenTelemetry plus the Aspire dashboard (optionally Jaeger) | A trace spanning Oathkeeper → .NET makes the gateway's real overhead visible |
| Testing | xUnit with Testcontainers (backend, including isolation tests), Playwright (e2e for login and consent flows) | Security scenarios must be tested automatically, not clicked through |
| Email (dev) | MailHog / Mailslurper | Kratos sends real verification and recovery mail |
| CI | GitHub Actions: build, tests, and a formatting gate (CSharpier / Prettier + ESLint) | Per the standard bootstrap setup |
| License | AGPL-3.0 | Strong copyleft with the network-use clause; anyone may self-host and study the project, but anyone offering it as a service must publish their source. Compatible with the Ory components (see the licensing note under Legal and security). |

## Success measures

### Quantitative

- **≥ 10 documented use cases** working end-to-end and covered by e2e tests, including: registration with email verification; login with TOTP; password recovery; social login; inviting a staff member to a vendor organization; changing a role and seeing access change immediately; denial of access to another vendor's resource; granting a partner application access through the consent screen; revoking a partner token; enforcing step-up MFA (AAL2) on a sensitive operation.
- **Oathkeeper gateway overhead ≤ 30 ms p95** per request (authentication + Keto query + JWT mutation), measured and documented.
- **Keto authorization decision ≤ 20 ms p95** against a set of ≥ 10,000 relation tuples.
- **Zero lines of authentication/authorization code in the .NET services** — verified by review and by an architecture test (no references to Identity-style packages, no hand-rolled role checks).
- **100% of protected endpoints** covered by an Oathkeeper rule *and* by a negative test proving that a request bypassing the gateway is rejected.
- **At least 2 seeded vendor organizations** with representative data (≥ 20 products, ≥ 10 orders, ≥ 3 users across different roles), used by the isolation tests.
- **Cold start ≤ 10 minutes** on a clean machine with Docker, via a single documented command.

### Qualitative

- **Security:** no home-grown cryptography and no home-grown password handling; passkey support arrives for free; a central, auditable access policy replaces scattered `if` statements.
- **Scalability:** every component is stateless (state lives in PostgreSQL) and therefore horizontally scalable; adding a new .NET service requires an Oathkeeper rule, not an auth implementation.
- **GDPR compliance:** PII is concentrated in Kratos while business services operate on a pseudonymized identifier; fulfilling data-subject rights (access, rectification, erasure, portability) reduces to Kratos's Identity API plus a cascading delete of domain records. Partner access is explicitly consented to and revocable.
- **Maintainability:** changing the permission model means changing relation tuples and a policy file — not refactoring code and redeploying every service.
- **Educational value:** every Ory component has an ADR answering "what problem does it solve and what was the alternative", including the rationale for rejecting Ladon.

## Constraints

### Technical

- **No official Ory SDKs for .NET or Angular at the level of support seen in Go/Node** — integration relies on OpenAPI-generated clients and direct HTTP calls; this must be priced into the effort estimate.
- **Ory components are containers, not libraries** — they cannot run inside a .NET process. The development environment requires Docker and realistically around 8 GB of RAM (4 Ory components + PostgreSQL + Redis + 3 .NET services + the SPA).
- **Ory Oathkeeper evolves more slowly than the other components** — the project must isolate the gateway configuration so that swapping in a different proxy (e.g. Envoy with external authorization against Keto) stays a local change rather than an architectural rewrite. The risk is recorded explicitly in an ADR.
- **Kratos and Hydra ship no UI** — login, registration, recovery, and consent interfaces must be built in full in Angular. That is an advantage (complete control) but also a real front-end cost.
- **Kratos flows are stateful and cookie-based** — the SPA and the API must share a base domain (via subdomains), otherwise SameSite and CORS problems appear. This forces a specific DNS topology both locally and in deployment.
- **Making Kratos sessions and Hydra tokens coexist** in a single gateway is the hardest configuration element — it requires a chain of authenticators, not a single rule.
- **Ory component versions must be pinned** in Compose/Aspire; configuration-format changes have occurred between releases.

### Organizational

- **One developer, part-time**, over roughly a 6-month window — the marketplace domain is deliberately shallow (catalog, orders, vendor accounts). Anything that does not illustrate identity and access is a candidate for cutting.
- **No budget for paid services** — Ory OSS self-hosted only, no Ory Network; deployment must fit within free tiers or run locally.
- **Learning curve** — the Zanzibar model (Keto) and full OAuth2/OIDC (Hydra) take time to absorb; the first milestone is deliberately spent on a spike and on architectural decisions.
- **No domain validation** — the marketplace model is a reasoned simulation, not a reflection of any specific company's processes.

### Legal and security

- **GDPR:** the system processes personal data (customers, vendor staff). The project applies privacy-by-design — data minimization in the services, PII held in Kratos, and erasure/export procedures implemented in code. A real production deployment would require a privacy policy, a record of processing activities, and legal review; within a demonstration project this remains directional documentation (`PRIVACY.md`), not legal advice.
- **Payments out of scope** — no cardholder data is processed, so no PCI-DSS obligations arise. Orders end at a simulated settlement; this is a deliberate scope boundary.
- **Secret management:** Hydra's signing keys, OAuth2 client secrets, and database credentials must never reach the repository — configuration via environment variables and `.env.example`, and via GitHub Secrets in CI. Development defaults must be explicitly marked as unacceptable in production.
- **Licensing — AGPL-3.0, and why it is compatible with Ory.** Kratos, Hydra, Keto, Oathkeeper, and Polis are all Apache-2.0 (verified against the upstream repositories). Two independent reasons make AGPL-3.0 safe here. First, **there is no combined work at all**: the project never links Ory code — the components run as separate container processes reachable over HTTP, i.e. independent programs communicating at arm's length, so this project's copyleft reaches its own code and nothing of Ory's. Second, even if that changed, **Apache-2.0 is one-way compatible with GPLv3/AGPL-3.0**: Apache-licensed code may be incorporated into an AGPL work (the combined result being AGPL), though not the reverse. Forking an Ory component later would leave that fork under Apache-2.0 while this project's own code stays AGPL — still no conflict. The Apache-2.0 attribution and NOTICE obligations continue to apply to any Ory code that is redistributed.
- **Accepted trade-off of AGPL.** A copyleft license is a deliberate choice over the more conventional permissive option for a demonstration project, and it carries a known cost: some organizations apply blanket internal policies against AGPL-licensed code, so a portion of the audience may be unable to reuse — or even clone — the repository. This is accepted knowingly. The mitigation is documentation: the README should state the license and its rationale plainly, so the constraint is visible before anyone invests time.
- **AGPL network clause (§13).** Because the project is a web application, anyone who runs a modified version and lets users interact with it over a network must offer those users the corresponding source. As the rights holder this is a formality for us, but the source offer must genuinely be made if the demo is ever hosted publicly.
- **Trademark:** "Ory" is a brand — we must not imply official endorsement (see the naming note below).
- **Naming:** the project name deliberately excludes the Ory mark. A `<Brand><Thing>` name reads as an official first-party component or integration, which this is not. Ory is named only in descriptive prose ("built on Ory OSS"), never in the project name, repository name, or package identifiers. The README should carry an explicit line stating the project is unaffiliated with Ory.
- **Demo data strictly synthetic** — no real personal data in seeds or screenshots.

## Working methodology

The project follows an **iterative-incremental** approach suited to a solo effort. The opening increment is a **walking skeleton** that establishes the security spine (Oathkeeper + Kratos + one .NET service) *before* any business feature — authorization is a cross-cutting concern, so anything added later is bolted on rather than built in. Every subsequent increment is a vertical slice: Angular → gateway → .NET service → data → tests.

**Core project invariant (release gate):** *no request reaches a .NET service without passing through Oathkeeper, and no vendor can see another vendor's data.* Enforced through three mechanisms: (1) an automated security test suite wired into CI as a blocking gate, (2) a checklist line in the feature issue template, and (3) an explicit rule in the new repository's `CONTRIBUTING.md` and `CLAUDE.md`.

## Milestones

| Milestone | Definition of done |
|---|---|
| **M0 — Walking skeleton** | Compose/Aspire brings up Kratos, Oathkeeper, PostgreSQL, and one .NET service. Angular renders login and registration on Kratos flows. A request to the API traverses the gateway and reaches the service carrying a JWT; the first negative test (hitting the service directly) passes. |
| **M1 — Identity, complete** | Email verification, recovery, password change, TOTP and WebAuthn, social login. Separate identity schemas for customers and vendor staff. Playwright covers the flows. |
| **M2 — Permissions (Keto)** | Relationship model for vendor organizations with owner/manager/staff roles. Oathkeeper queries Keto for decisions. Angular conditions its UI on Keto responses. Cross-vendor isolation tests green for every entity. |
| **M3 — Marketplace domain** | Catalog, orders, and vendor accounts end-to-end, fully governed by policies. Two seeded organizations with representative data. |
| **M4 — External integrations (Hydra)** | Hydra as the OAuth2/OIDC server, consent screen in Angular, a partner application running Authorization Code + PKCE, scopes and token revocation. The gateway accepts Kratos sessions and Hydra tokens side by side. |
| **M5 — Hardening and release** | Full security test suite green in CI as a release gate; gateway and Keto performance measurements documented; architecture diagram, ADRs, and setup guide complete; optionally Ory Polis (SAML) as an extension. |

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| **Gateway bypass / cross-vendor data leak** | Highest — it undermines the project's central thesis | JWT signature verification (JWKS) in every service; a negative test per endpoint; an isolation test per vendor-scoped entity; a failing test blocks release |
| **Ory configuration complexity consumes the time budgeted for the domain** | The project ends up as a pile of YAML with no working demo | M0 deliberately minimal; the domain deliberately shallow; configuration kept in one documented place |
| **Slower Oathkeeper development** | Risk of depending on a component with an uncertain future | Gateway configuration isolated; an ADR documenting the exit path (Envoy + `ext_authz` to Keto); access rules kept as data, not code |
| **SDK gaps for .NET / Angular** | More integration work than anticipated | OpenAPI-generated clients, generated once and versioned; a thin layer of hand-written wrappers |
| **Breaking changes between Ory component versions** | Configuration churn | Pinned image versions, updates in controlled windows, configuration covered by smoke tests in CI |
| **Single-person capacity** | Later milestones may slip | M0–M2 stand on their own as a worthwhile demo; Hydra (M4) is valuable but not load-bearing for the project's point |
