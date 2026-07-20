# Privacy

A privacy-by-design working reference for Gatehouse. This is **forward-looking
documentation for a demonstration project, not legal advice** — a real public launch
would need a proper privacy policy, a record of processing activities, and review by
qualified counsel. See the *Legal and security* section of [CHARTER.md](CHARTER.md)
for the constraints this document operationalizes.

## Why this document exists

Gatehouse processes personal data for two populations — retail customers and vendor
staff — and its entire architectural thesis is that identity should be handled as
infrastructure. Getting privacy right is not optional decoration on top of that
thesis; it is the thesis. Concentrating PII in one auditable place (Kratos) is what
makes data-subject rights implementable at all, instead of a cross-service hunt.

## Roles

- **Data controller (demonstration context):** the project maintainer, for any
  instance actually run with real user data. In normal development and demo use, all
  data is synthetic (see below) and no real personal data is processed.
- **Data processor components:** Ory Kratos (identity/PII), the .NET marketplace
  services (business data keyed by a pseudonymous subject id), and any partner
  application granted a scope through Hydra's consent flow.

## Data categories

| Category | Held by | Notes |
|---|---|---|
| Authentication credentials (password hash, MFA secrets, WebAuthn credentials) | Kratos | Never touched by application code; Kratos owns the full lifecycle. |
| Identity profile (name, email, phone — schema differs for customers vs. vendor staff) | Kratos | Configurable identity schema per population, see [GLOSSARY.md](GLOSSARY.md). |
| Subject id (pseudonymous) | Domain services | The only identity reference domain services hold. Not personally identifying on its own. |
| Business data (orders, products, vendor org membership) | Domain services (PostgreSQL) | Linked to a subject id, not to PII directly. |
| OAuth2 consent grants and scopes | Hydra | What a vendor allowed a partner application to access, and for how long. |
| Session and audit data | Kratos / Oathkeeper | Session tokens, login events; supports the isolation and gateway-bypass test suite's evidentiary trail. |

## Retention

- **Development and CI:** all data is seeded and synthetic, recreated per test run;
  no retention concerns apply.
- **Any long-lived instance:** retention periods are to be defined per data category
  before that instance processes real user data — this is explicitly **not yet
  decided** for Gatehouse, since the project has not reached that stage. Flagging it
  here so it isn't silently skipped later.

## GDPR / data-subject rights (design intent)

Because PII is concentrated in Kratos and business services key off a pseudonymous
subject id, fulfilling rights should reduce to two coordinated actions rather than a
per-service investigation:

- **Right of access / portability** — export via Kratos's Identity API.
- **Right to rectification** — update via Kratos's self-service profile flow.
- **Right to erasure** — delete the Kratos identity, cascading to domain records keyed
  by that subject id.
- **Consent and revocation** — a partner's access (Hydra scope grant) is visible to
  the vendor and revocable independently of any password change.

None of the above is implemented yet as of M0; this section states the design intent
that later milestones are expected to satisfy, and each right should become a
verifiable issue with acceptance criteria per [ROADMAP.md](ROADMAP.md)'s mapping of
success measures to issues.

## Demo data

**Demo and seed data is strictly synthetic.** No real personal data appears in seeds,
fixtures, screenshots, or documentation at any point.

## Secrets are not personal data, but are handled with equal care

Hydra signing keys, OAuth2 client secrets, and database credentials are configured via
environment variables and `.env.example`, and via GitHub Secrets in CI — never
committed. See [CONTRIBUTING.md](CONTRIBUTING.md).
