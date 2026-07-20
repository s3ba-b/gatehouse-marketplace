# Contributing to {{PROJECT_NAME}}

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

```bash
# TODO: clone, install dependencies, run tests
```

## Running tests

```bash
# TODO: test command for this stack
```

## Code style

- Follow the conventions of the language/framework in use, and run the project's
  formatter before pushing — CI enforces it as a gate.
- {{CORE_RULE}} <!-- The charter's non-negotiable architectural rule, if any,
  e.g. "Every tenant-scoped entity or endpoint must ship with a cross-tenant
  isolation test." Delete this bullet if the charter defines no such rule. -->
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
