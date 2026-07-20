# Glossary

Shared vocabulary for Gatehouse — domain terms, Ory concepts, and the identity
jargon the project leans on. Newcomers and AI agents should read this before
touching the code, because several of these words mean something narrower here
than they do in general usage.

## Domain

**Marketplace** — a multi-vendor shop: many independent vendors selling to retail
customers through one storefront. Deliberately shallow in Gatehouse (catalog,
orders, vendor accounts) because the point is the access layer, not commerce.

**Vendor** — an organization selling on the marketplace, with staff who have roles
inside it. The unit of data isolation: *no vendor may see another vendor's data*.

**Vendor staff** — a person belonging to a vendor organization as `owner`,
`manager`, or `staff`. Distinct from a customer, and carries a different identity
schema in Kratos.

**Customer** — a retail buyer. Has an account and orders, belongs to no organization.

**Partner application** — an external program (an ERP, an analytics tool) that
integrates over OAuth2 with a bounded scope, without ever seeing a user's password.

**Storefront / Vendor back-office / Login-consent UI** — the three Angular
applications: the customer-facing shop, the vendor's admin panel, and the UI for
Kratos flows plus Hydra's consent screen.

## Ory components

**Ory Kratos** — the identity server. Owns users, credentials, and *self-service
flows* (registration, login, verification, recovery, settings). Ships APIs, no UI.
In Gatehouse it is the **single source of PII**.

**Ory Hydra** — a certified OAuth2 / OIDC server. Issues tokens to partner
applications. Not an identity store: it delegates the "who is this?" question to
Kratos and the "do they agree?" question to the consent UI.

**Ory Keto** — the permission server, inspired by Google Zanzibar. Stores
*relation tuples* and answers "may subject S do relation R on object O?".

**Ory Oathkeeper** — the Identity & Access Proxy sitting in front of every .NET
service. Per request it runs an **authenticator** (is there a valid Kratos session
or Hydra token?), an **authorizer** (ask Keto), and a **mutator** (mint a signed
JWT for the downstream service).

**Ory Ladon** — a Go authorization *library*, functionally superseded by Keto.
Deliberately rejected here; the ADR explains why, because it is a recurring question.

**Ory Polis** — SAML / enterprise SSO. Out of scope until an enterprise vendor with
its own IdP appears (M5+).

## Identity and access concepts

**Self-service flow** — a Kratos-orchestrated, stateful, cookie-based multi-step
interaction (e.g. registration). The client fetches the flow, renders the fields
Kratos describes, and submits back. Because flows are cookie-based, the SPA and the
API must share a base domain — otherwise SameSite and CORS break the flow.

**AAL — Authenticator Assurance Level** — how strongly the session is authenticated.
`aal1` is password-or-equivalent; `aal2` additionally required a second factor.
**Step-up** is demanding `aal2` at the moment of a sensitive action (a vendor
payout), rather than at login.

**MFA / TOTP / WebAuthn / passkey** — second factors. TOTP is the six-digit
authenticator-app code; WebAuthn is the browser standard behind hardware keys and
passkeys (a passkey being a discoverable, syncable WebAuthn credential).

**ReBAC — Relationship-Based Access Control** — permissions expressed as
relationships between subjects and objects rather than as roles on a user record.
Keto's model, and the reason `UserRoles` tables do not appear in this project.

**Relation tuple** — one Keto fact, written `object#relation@subject`, e.g.
`organization:acme#member@user:kate` or `product:123#owner@organization:acme`.
Permissions are derived by traversing these, so roles can inherit.

**Subject** — whoever a decision is about. In the .NET services this is a
**pseudonymous identifier** (the Kratos identity id), never an email or a name —
that is what keeps PII confined to Kratos.

**OAuth2 Authorization Code + PKCE** — the flow a partner application uses to get a
token on a user's behalf, with PKCE preventing interception of the code by a
malicious app on the same device. **Client Credentials** is the machine-to-machine
variant with no user involved.

**Scope** — the bounded permission a token carries, e.g. `orders:read`,
`products:write`. Granted knowingly by the vendor on the consent screen.

**Consent screen** — the UI where a vendor sees what a partner application is asking
for and agrees or declines. Hydra runs the protocol; Gatehouse builds the screen.

**JWKS — JSON Web Key Set** — the public keys a service uses to verify that a JWT
really was signed by Oathkeeper. The mechanism behind the zero-trust rule.

**Zero-trust (as used here)** — a .NET service trusts nothing about a request except
a JWT whose signature verifies against Oathkeeper's JWKS. A request that reaches the
service without going through the gateway is rejected — and there is a negative test
per endpoint proving it.

**Access rule** — an Oathkeeper configuration entry binding a URL pattern to an
authenticator/authorizer/mutator chain. Versioned configuration, not code.

**Gateway bypass** — reaching a .NET service directly, sidestepping Oathkeeper. One
half of the project's highest-severity risk; **cross-vendor data leak** is the other.

## Stack

**.NET Aspire** — the orchestration and dashboard layer used for development
(`aspire run`). **Docker Compose** is the portable reference run, needed because the
Ory components are container images and cannot run inside a .NET process.

**Testcontainers** — spins up real PostgreSQL and Ory containers inside the xUnit
test run, so isolation and bypass tests exercise the actual gateway rather than a mock.

**Playwright** — drives a real browser for the login and consent e2e flows.

**MailHog / Mailslurper** — a local SMTP sink, so Kratos can send real verification
and recovery mail in development.

**ADR — Architecture Decision Record** — a short document capturing one decision, the
alternatives, and the rationale. Gatehouse keeps one per Ory component, including the
rejected ones.
