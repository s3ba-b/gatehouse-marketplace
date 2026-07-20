# BOOTSTRAP.md — turning a charter into a scaffolded OSS repo

A charter-agnostic methodology for going from a **project charter** (or any short
spec: name, objective, features, success measures, constraints, deadline) to a
clean, contribution-ready repository. This is the "engine" behind the files in
this template. It assumes nothing about the stack — read the charter first.

> Meta file: this document and the landing `README.md` are **removed** from a
> bootstrapped project. Everything else here ships (after placeholder fill).

## 0. Read the charter first

Parse it fully and extract: **project name + acronym**, **stack/tech
constraints**, the discrete **feature areas**, the **success measures**, the
**license** (if specified — otherwise Apache-2.0), any **non-negotiable
architectural rule / top risk**, and the **deadline**. These drive every later
step. Respect stated out-of-scope boundaries and constraints — do not scope-creep.

## 1. Instantiate the scaffolding

Create the repo from this template (verbatim copy), then:

1. **Remove meta files:** `README.md`, `BOOTSTRAP.md`.
2. **Rename:** `project-README.template.md` → `README.md`;
   `.github/dependabot.yml.example` → `.github/dependabot.yml`.
3. **Fill every `{{PLACEHOLDER}}`** (list below) from the charter.
4. **Generate the stack-specific files** (section 3).

### Placeholders

| Placeholder | Value |
|---|---|
| `{{PROJECT_NAME}}` | Full project name from the charter. |
| `{{ONE_LINE_PITCH}}` | The charter's one-line objective. |
| `{{OWNER}}` / `{{REPO}}` | GitHub owner and repo name. |
| `{{YEAR}}` | Current year. |
| `{{COPYRIGHT_OWNER}}` | Copyright holder's name. |
| `{{CONTACT_EMAIL}}` | Security / Code-of-Conduct contact email. |
| `{{PARAGRAPH_FROM_CHARTER_OBJECTIVE}}` | One-paragraph pitch (README overview). |
| `{{FEATURE_*}}`, `{{STACK_ITEM_*}}`, `{{PREREQUISITE_*}}` | From the charter (README). |
| `{{CORE_RULE}}` / `{{CORE_RULE_CHECK}}` | The non-negotiable architectural rule (CONTRIBUTING.md) and its PR-checklist line (feature.md). **Delete those lines/sections if the charter defines no such rule.** |
| `{{ECOSYSTEM}}` | Dependabot `package-ecosystem` for the stack (`nuget`, `npm`, `pip`, `gomod`, `cargo`, …). |

## 2. Per-file fill guide

- **`README.md`** (from `project-README.template.md`) — title, one-paragraph pitch,
  feature list, tech stack, "run locally" placeholder, status-badge section. Keep
  architecture/deploy as stubs to fill during delivery. Prefer the stack's
  idiomatic CLI in run/setup instructions (e.g. `aspire run`, not a long raw
  command).
- **`LICENSE` / `NOTICE`** — Apache-2.0 by default; the charter may override (e.g.
  MIT, AGPL). Fill `NOTICE` with name + year.
- **`CONTRIBUTING.md`** — keep the issue → branch → PR → merge flow and DCO line.
  Set `{{CORE_RULE}}` or delete that bullet.
- **`CODE_OF_CONDUCT.md` / `SECURITY.md`** — set `{{CONTACT_EMAIL}}`.
- **`.github/ISSUE_TEMPLATE/feature.md`** — the "Core architectural rule" section
  holds the release-gate checklist line; keep + set `{{CORE_RULE_CHECK}}`, or
  delete the section if there's no such rule.

## 3. Stack-specific files (generate, not templated)

These depend on the charter's stack — add a real, runnable version:

- **`.github/workflows/ci.yml`** — build + test on push/PR. Start minimal but it
  must actually run. Include a **formatting/lint gate** that fails on unformatted
  code (`csharpier check` for .NET, `prettier --check`/a linter elsewhere), and
  **pin dev tooling to a committed version manifest** (for .NET,
  `.config/dotnet-tools.json` restored via `dotnet tool restore`) so CI and
  contributors run the identical formatter version.
- **`.gitignore`** — a known-good template for the language.
- **`GLOSSARY.md`** (recommended) — the charter's domain + technical terms.
- **`PRIVACY.md`** (when the project stores personal data) — a privacy-by-design
  working reference: roles, data categories, retention, GDPR/local-law notes.
  Forward-looking, not legal advice; flag that a real launch needs counsel.
- **Stack agent tooling** — check whether the stack ships its own AI-agent setup
  command and run it (known case: .NET Aspire's
  `aspire agent init --skill-locations claudecode`). Run `<tool> --help` if unsure.

## 4. Enforce the charter's core invariant as a release gate

If the charter names a highest-severity risk or a non-negotiable architectural
rule (e.g. cross-tenant data isolation), don't leave it as prose. Scaffold it as:

1. an **automated test wired into CI as a blocking gate**,
2. a **checklist line in the feature issue template** (`{{CORE_RULE_CHECK}}`) so
   every relevant PR must address it, and
3. an **explicit rule in `CONTRIBUTING.md`** and the project's own `CLAUDE.md`.

## 5. Plan from the charter

- **Milestones** — one per major phase or per the deadline cadence; work back from
  the completion date.
- **Labels** — `type:feature`, `type:bug`, `type:chore`, `type:docs`, plus MoSCoW
  priorities `priority:high` (Must), `priority:medium` (Should), `priority:low`
  (Could) — matching the feature template.
- Map each **feature area** to one or more issues; map each **success measure** to
  a verifiable issue or acceptance criterion.
- Add a **`ROADMAP.md`** with the full milestone table (titles + definitions of
  done) and the working methodology, plus a "how to start the next milestone"
  procedure — so the repo is **self-contained** for any future contributor (human
  or AI) who only has this repo.

## 6. File the first issues

- Create issues for the **current milestone only** — the first slice, not the whole
  backlog. Later milestones stay as empty GitHub milestones with just their
  definition of done. State in `ROADMAP.md` + `CONTRIBUTING.md` that the next
  milestone gets broken into issues once the current one closes.
- Prioritize foundation work (skeleton, infra wiring, core domain) before features.
- Each issue: clear title, a short "why" tied to the charter, a checklist of
  acceptance criteria, and a label + milestone. Order them so each is one
  issue → PR → merge unit.

## 7. Finalize

- Generate the project's own **`CLAUDE.md`** (e.g. via `/init`) so it carries its
  context forward.
- Enable **branch protection** on `main` (require PR + passing CI) once CI exists.
- New repos start **private**; flip to public when presentable.
