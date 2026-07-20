# oss-project-template

Reusable **Apache-2.0 open-source project scaffolding** plus a charter-agnostic
**bootstrap methodology** for turning a project charter (or any short spec) into
a clean, contribution-ready GitHub repository — identically, every time.

> **This README is meta.** It describes the template itself. When you bootstrap a
> new project from this repo, this file and [`BOOTSTRAP.md`](BOOTSTRAP.md) are
> removed, and [`project-README.template.md`](project-README.template.md) becomes
> the new project's `README.md`.

## What's inside

| File | Becomes (in the new project) | Purpose |
|---|---|---|
| `project-README.template.md` | `README.md` | Project README skeleton (placeholders). |
| `LICENSE` | `LICENSE` | Apache-2.0, verbatim. Default license. |
| `NOTICE` | `NOTICE` | Apache NOTICE (fill name/year). |
| `CONTRIBUTING.md` | `CONTRIBUTING.md` | issue → branch → PR → merge flow, DCO sign-off. |
| `CODE_OF_CONDUCT.md` | `CODE_OF_CONDUCT.md` | Contributor Covenant 2.1. |
| `SECURITY.md` | `SECURITY.md` | Private vulnerability reporting. |
| `.github/ISSUE_TEMPLATE/{feature,bug}.md`, `config.yml` | same | Issue templates + MoSCoW priorities. |
| `.github/PULL_REQUEST_TEMPLATE.md` | same | PR checklist with `Closes #N`. |
| `.github/dependabot.yml.example` | `.github/dependabot.yml` | Dependabot (set the ecosystem). |
| `README.md`, `BOOTSTRAP.md` | _(removed)_ | This landing page + the methodology — meta, not shipped. |

**Not shipped here (generate per stack):** `ci.yml`, `.gitignore`, and optional
`GLOSSARY.md` / `PRIVACY.md`. See [`BOOTSTRAP.md`](BOOTSTRAP.md) for why and how.

## Two ways to use it

### 1. Manually — "Use this template"

Click **Use this template** on GitHub (or `gh repo create <you>/<project>
--template s3ba-b/oss-project-template`). You get a verbatim copy. Then:

1. Delete `README.md` and `BOOTSTRAP.md`.
2. Rename `project-README.template.md` → `README.md`.
3. Rename `.github/dependabot.yml.example` → `.github/dependabot.yml`.
4. Find-and-replace every `{{PLACEHOLDER}}` (see the list in `BOOTSTRAP.md`).
5. Add your stack's `ci.yml` + `.gitignore`.

### 2. AI-driven bootstrap

Point an agent (e.g. Claude Code) at your charter/spec and at
[`BOOTSTRAP.md`](BOOTSTRAP.md). It performs the cleanup + placeholder fill above,
generates the stack-specific files, and plans milestones/labels/issues from the
spec. This is the path the methodology is written for.

## License

The template content is licensed under [Apache-2.0](LICENSE). Projects you create
from it are yours to license as you choose (Apache-2.0 is the built-in default).
