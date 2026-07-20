# Roadmap

The delivery plan for Gatehouse, derived from [CHARTER.md](CHARTER.md) — which
remains the authoritative statement of scope, constraints, and rationale. Target
completion: **31 January 2027**, solo part-time effort begun 20 July 2026.

## Working methodology

**Iterative-incremental**, suited to one developer working part-time.

The opening increment is a **walking skeleton** that establishes the security spine
(Oathkeeper + Kratos + one .NET service) *before* any business feature. This ordering
is deliberate and not negotiable: authorization is a cross-cutting concern, so
anything added after the spine exists is bolted on rather than built in.

Every subsequent increment is a **vertical slice**: Angular → gateway → .NET service
→ data → tests. A slice that stops at the gateway is not done.

**Core project invariant (release gate):** *no request reaches a .NET service without
passing through Oathkeeper, and no vendor can see another vendor's data.* Enforced by
(1) an automated security test suite wired into CI as a blocking gate, (2) a checklist
line in the feature issue template, and (3) an explicit rule in
[CONTRIBUTING.md](CONTRIBUTING.md) and [CLAUDE.md](CLAUDE.md).

The marketplace domain is deliberately shallow. **Anything that does not illustrate
identity and access is a candidate for cutting** — that is a planning rule, not a
regrettable compromise.

## Milestones

| Milestone | Definition of done |
|---|---|
| **M0 — Walking skeleton** | Compose/Aspire brings up Kratos, Oathkeeper, PostgreSQL, and one .NET service. Angular renders login and registration on Kratos flows. A request to the API traverses the gateway and reaches the service carrying a JWT; the first negative test (hitting the service directly) passes. |
| **M1 — Identity, complete** | Email verification, recovery, password change, TOTP and WebAuthn, social login. Separate identity schemas for customers and vendor staff. Playwright covers the flows. |
| **M2 — Permissions (Keto)** | Relationship model for vendor organizations with owner/manager/staff roles. Oathkeeper queries Keto for decisions. Angular conditions its UI on Keto responses. Cross-vendor isolation tests green for every entity. |
| **M3 — Marketplace domain** | Catalog, orders, and vendor accounts end-to-end, fully governed by policies. Two seeded organizations with representative data. |
| **M4 — External integrations (Hydra)** | Hydra as the OAuth2/OIDC server, consent screen in Angular, a partner application running Authorization Code + PKCE, scopes and token revocation. The gateway accepts Kratos sessions and Hydra tokens side by side. |
| **M5 — Hardening and release** | Full security test suite green in CI as a release gate; gateway and Keto performance measurements documented; architecture diagram, ADRs, and setup guide complete; optionally Ory Polis (SAML) as an extension. |

**M0–M2 stand on their own** as a worthwhile demonstration. Hydra (M4) is valuable but
not load-bearing for the project's point — if capacity runs short, later milestones
slip rather than the spine being compromised.

## Success measures

These come from the charter and are what "done" ultimately means. Each maps to an
acceptance criterion on an issue in the milestone that delivers it.

**Quantitative**

- **≥ 10 documented use cases** working end-to-end and covered by e2e tests:
  registration with email verification; login with TOTP; password recovery; social
  login; inviting a staff member to a vendor organization; changing a role and seeing
  access change immediately; denial of access to another vendor's resource; granting a
  partner application access through the consent screen; revoking a partner token;
  enforcing step-up MFA (AAL2) on a sensitive operation.
- **Oathkeeper gateway overhead ≤ 30 ms p95** per request (authentication + Keto query
  + JWT mutation), measured and documented.
- **Keto authorization decision ≤ 20 ms p95** against ≥ 10,000 relation tuples.
- **Zero lines of authentication/authorization code in the .NET services** — verified
  by review and by an architecture test.
- **100% of protected endpoints** covered by an Oathkeeper rule *and* a negative test
  proving a gateway-bypassing request is rejected.
- **≥ 2 seeded vendor organizations** with representative data (≥ 20 products,
  ≥ 10 orders, ≥ 3 users across roles), used by the isolation tests.
- **Cold start ≤ 10 minutes** on a clean machine with Docker, via one documented command.

**Qualitative** — no home-grown cryptography or password handling; every component
stateless and horizontally scalable; PII concentrated in Kratos so GDPR rights reduce
to the Kratos Identity API plus a cascading delete; permission changes are tuple and
policy changes, not refactors; and an ADR per Ory component answering "what problem
does it solve and what was the alternative", including why Ladon was rejected.

## How to start the next milestone

Only the **current** milestone carries issues. Later milestones exist as empty GitHub
milestones holding just their definition of done. When the current milestone's issues
are all closed:

1. **Close the milestone** on GitHub and re-read its definition of done — confirm it
   is actually met, not merely that the issues are closed.
2. **Re-read [CHARTER.md](CHARTER.md)** for the next milestone's scope, and the risks
   table for what that milestone is exposed to. Scope may have moved; the charter is a
   living document in this repo and should be updated when it has.
3. **Break the next milestone into issues** using the feature template. Each issue
   gets: a clear title, a short "why" tied to a charter objective or success measure,
   a checklist of measurable acceptance criteria, the core-architectural-rule
   checklist, and a `type:` label plus a MoSCoW `priority:` label.
4. **Order them as single issue → PR → merge units**, foundation work before features.
   A slice should be deliverable without a second slice landing first.
5. **Map the milestone's share of the success measures** onto specific acceptance
   criteria, so no measure is left to be discovered unmet at M5.
6. **Update this file** if the plan changed, and update the landing page under
   `/docs` (if one exists) so the public roadmap reflects reality.

## Labels

- `type:feature`, `type:bug`, `type:chore`, `type:docs`
- `priority:high` (Must), `priority:medium` (Should), `priority:low` (Could) — MoSCoW.
  "Won't (this release)" means defer, so don't file it.
