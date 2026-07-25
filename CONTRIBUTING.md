# Contributing to Gatehouse

Thanks for your interest in contributing! This document describes how work flows
through the project.

## Workflow: issue → branch → PR → merge

1. **Start from an issue.** Every change should map to a GitHub issue. If one
   doesn't exist, open it first using the issue templates. Only the **current**
   milestone is pre-populated with issues — see [ROADMAP.md](ROADMAP.md) for how
   to break down the next milestone once the current one's issues are closed.
2. **Branch off `main`.** Use a descriptive branch name:
   - `feat/<short-description>` for features
   - `fix/<short-description>` for bug fixes
   - `chore/<short-description>` for maintenance
   - `docs/<short-description>` for documentation
3. **Commit in small, logical units.** Write clear commit messages in the
   imperative mood (e.g. "Add tenant resolution middleware").
4. **Open a pull request** against `main`. Fill in the PR template and link the
   issue with `Closes #<n>`.
5. **CI must pass** and the PR must be reviewed before merge.
6. **Merge** — prefer squash merge to keep `main` history clean. Delete the
   branch after merge.

Direct commits to `main` are not allowed; `main` is protected.

## Development setup

Gatehouse needs Docker (the Ory components are container images, not libraries) with
roughly 8 GB of RAM available, the .NET 10 SDK with the Aspire CLI, and Node.js 22+.

```bash
# TODO (M0): clone, restore, bring the stack up
aspire run
```

## Running tests

```bash
# Backend (unit + Aspire/Testcontainers integration tests, incl. the security gate)
dotnet test

# E2E (Playwright) — needs Kratos, Oathkeeper, and the Catalog service already
# running (`aspire run`, or `docker compose up -d` — see README.md "Run locally")
cd src/Storefront
npx playwright install chromium   # once
npm run e2e
```

CI runs the same `npm run e2e` command as a blocking gate against the Docker
Compose reference run (`.github/workflows/ci.yml`, job `e2e-gate`) — a red e2e
run fails the pipeline the same way a red `dotnet test` does.

## The core architectural rule

**No request reaches a .NET service without passing through Ory Oathkeeper, and no
vendor can ever see another vendor's data.** This is the project's central thesis —
if it breaks, Gatehouse demonstrates nothing. It is enforced three ways, and all
three are mandatory:

1. **An automated security test suite wired into CI as a blocking gate.** A failing
   isolation or gateway-bypass test blocks the merge and blocks the release.
2. **A checklist line in the feature issue template**, so every relevant PR has to
   state how it addresses the rule.
3. **This document and [CLAUDE.md](CLAUDE.md)**, so both human and AI contributors
   carry the rule forward.

In practice, for any change that adds or touches a protected endpoint or a
vendor-scoped entity:

- The endpoint must be covered by an **Oathkeeper access rule**, and by a **negative
  test** proving that a request bypassing the gateway is rejected (JWT signature
  verified against JWKS).
- Every vendor-scoped entity must ship with a **cross-vendor isolation test**
  proving vendor A cannot read or mutate vendor B's data.
- Authorization decisions belong in **Keto relation tuples and Oathkeeper policy**,
  never in a hand-rolled `if` inside a service. Services enforce decisions; they do
  not make them.

## Code style

- Follow the conventions of the language/framework in use, and run the project's
  formatter before pushing — CI enforces it as a gate (CSharpier for .NET, Prettier
  and ESLint for Angular).
- **Never commit secrets.** Hydra signing keys, OAuth2 client secrets, and database
  credentials come from environment variables and `.env.example` locally, and from
  GitHub Secrets in CI. Development defaults are unacceptable in production and must
  be marked as such.
- No authentication or authorization code in the .NET services — see the rule above.
- Keep changes focused; avoid unrelated refactors in the same PR.

## Reporting bugs

Open an issue using the **Bug report** template.

## Security

Please do not file security vulnerabilities as public issues. See
[SECURITY.md](SECURITY.md).

## Contributor sign-off (DCO)

Contributions are accepted under the
[Developer Certificate of Origin](https://developercertificate.org/). Sign off
your commits with `git commit -s` to certify you wrote the contribution (or have
the right to submit it) and agree to license it under this project's license.
