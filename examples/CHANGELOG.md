# Changelog — examples/

*Narrative archaeology of the library's evolution. Each entry records what changed and why, for the benefit of future readers (human or AI) trying to reconstruct the reasoning behind the current state.*

This changelog is not strictly Keep-a-Changelog format. It is deliberately narrative: we are building AI-assisted tooling while also documenting the experience of building it, and the decision process matters as much as the diff.

---

## 2026-04-10 — Imported 8 artifacts missing from examples/

**What changed:** Added 8 artifacts that existed in `project-claude/` (the source tree that gets installed to `.claude/` via `project-claude/install.cjs`) but had never been imported to `examples/`. The library went from 127 to 135 artifacts.

Imported:

| Artifact | Type | Category | What it is |
|---|---|---|---|
| `gsd-orchestrator` | agent | `gsd/` | Routes user intent to GSD commands via filesystem discovery and lifecycle awareness |
| `observer` | agent | `audit/` | Passive session observer — captures tool sequences, file patterns, corrections for skill-creator's pattern detection pipeline |
| `gsd-workflow` | skill | `gsd/` | Core GSD project management workflow routing and lifecycle management skill |
| `security-hygiene` | skill | `workflow/` | Safety discipline for GSD's self-modifying skill and agent system |
| `session-awareness` | skill | `workflow/` | Project state awareness and session recovery for GSD-managed projects |
| `skill-integration` | skill | `workflow/` | Manages skill-creator integration with GSD workflows (loading, observation, guardrails, patterns) |
| `gsd-debug-team` | team | `ops/` | Team for coordinated GSD debugging |
| `gsd-research-team` | team | `migration/` | Team for coordinated research pipelines |

**Why:** These artifacts were discovered by a diff between `project-claude/` (the install source) and `examples/` (the library), kicked off by a question about `gsd-orchestrator` specifically. The diff revealed that `gsd-orchestrator` had five companions that were also in `project-claude/` but never imported: two agents, four skills, and two teams.

The absence was probably accidental rather than deliberate. The session 009 bulk import (see 2026-04-08 entry) pulled everything from `.claude/` into `examples/`, but `project-claude/` is a parallel source — it is the *source* of `.claude/` — and some artifacts that live only in `project-claude/` (perhaps because they were added after the install script ran, or because the install script doesn't copy them all) slipped through.

Worth noting: `gsd-orchestrator` specifically is installed to `.claude/agents/` on the `v1.50` and `wasteland` branches but NOT on mainline `gsd-skill-creator` or `artemis-ii`. So on mainline it lives as source-only. This is consistent with the theory that it's an earlier routing attempt that got superseded by the `gsd-do` skill, but it's still preserved in `project-claude/` (and now in `examples/`) as reference. The CHANGELOG keeps it for the archaeological record.

A similar diff against the sibling repos (`gsd-skill-creator`, `gsd-skill-creator-nasa`) was done earlier in the session and caught 19 artifacts that exist in upstream `.claude/` but not in artemis-ii's `.claude/` — those are all still available globally in `~/.claude/`, so they remain discoverable at session load time, but they are deliberately not project-installed on this branch. They are not imported into `examples/` by this entry because (a) they are not authored here and (b) importing them without their upstream context would be misleading.

**Validation after import:** 135 checked, 135 clean, 0 errors, 0 warnings. License report: 135 BSL-1.1, 0 BSL-EXEMPT (same as before — all new artifacts default to `origin: tibsfox, modified: false`, same as Stage 2).

The category READMEs were regenerated automatically: skills/gsd grew from 4 to 5, skills/workflow from 4 to 7, agents/gsd from 21 to 22, agents/audit from 9 to 10, teams/ops from 3 to 4, teams/migration from 2 to 3.

---

## 2026-04-10 — Per-category README population

**What changed:** Generated `README.md` files for all 23 category subfolders (10 skill categories + 8 agent categories + 5 team categories, including the empty `deprecated/` stubs). Each category README has a hand-curated one-line description (from `CATEGORY_DESCRIPTIONS` in the generator script) and an auto-generated table of the artifacts in that category with their description, origin, and status.

Introduced `tools/generate-category-readmes.mjs` — an idempotent generator that reads frontmatter from every artifact and regenerates the category READMEs. Safe to run after any classification change.

Added a first-paragraph fallback to the generator: when an artifact's frontmatter `description` is null (which happens on team and chipset sidecars because their backfill couldn't read descriptions from non-YAML sources), the generator extracts the first paragraph from the body after the H1 and uses that instead. This got teams meaningful descriptions without any hand-editing.

**Why:** The per-category READMEs were deferred from Stage 1 because we needed the classification to exist before we could list anything. Now that Stage 2 has classified all 127 artifacts, the category READMEs are a one-shot generation away. The alternative was hand-writing 23 README files, each with a table of between 0 and 21 artifacts — clearly worth automating.

The first-paragraph fallback was a late addition. The team README sidecars created in Stage 2 inherited the substantive team description from their original README body, but the frontmatter `description` field was left null (because parsing the body for a description wasn't part of the backfill's job). The category README generator then showed "—" for teams, which looked broken. The fallback makes the generator smarter without requiring a second backfill pass on the team frontmatter itself.

**Design note — generated vs hand-edited:** The category READMEs are deliberately marked "auto-generated" with instructions to update the frontmatter or the generator's description map rather than hand-editing. The top-level per-type READMEs (`examples/skills/README.md`, `examples/agents/README.md`, etc.) remain hand-written. This two-tier structure keeps the hand-curated orientation at the top and delegates the growing-list problem to the generator.

**Open for future:** When chipsets grow beyond 7, consider generating a chipset README index too. When categories get subcategorized (say, `patterns/backend/` and `patterns/frontend/`), the generator needs to recurse. Neither is a problem yet.

---

## 2026-04-10 — Stage 2: classification, frontmatter back-fill, sidecar READMEs

**What changed:** Moved all 127 existing artifacts from the flat top-level of each type into their category subfolders. Back-filled the 9-field frontmatter on every skill and agent (appending missing fields in place — existing frontmatter preserved verbatim, including multi-line YAML like `tools:` arrays). Wrapped the 7 flat chipset `.yaml` files into `<name>/chipset.yaml + README.md` directories. Created or updated README.md sidecars on teams and chipsets to hold their frontmatter (since `config.json` and `chipset.yaml` aren't the right place for YAML frontmatter).

Introduced `tools/backfill-frontmatter.mjs` — an idempotent script that appends missing frontmatter fields without re-serializing existing YAML (avoiding any risk of corrupting multi-line structures). The script stays committed because it's safe to run again and provides a reproducible way to add the fields to future artifacts.

Fixed the walker logic across all 4 tools (`install.mjs`, `validate.mjs`, `catalog-gen.mjs`, `license-report.mjs`) to treat `README.md` as the metadata source for teams and chipsets (rather than `config.json` / `chipset.yaml`). This is the consequence of the frontmatter-in-sidecar choice: the walker has to look at the sidecar, not the canonical config/yaml.

Also removed `chipset` from the scaffolding-leftover blacklist in the validator — it's a legitimate baseline chipset, not a template leftover.

**Why:** Stage 1 laid the category structure; Stage 2 filled it. The classification map was built in session by matching each artifact name to the category whose definition in `CATEGORIES.md` best fit. Edge cases (where an artifact could plausibly land in two categories) were resolved by picking the category whose daily use would surface it most naturally — e.g., `decision-framework` went to `dev/` rather than `workflow/` because developers reach for it while writing code, not while thinking about workflow orchestration.

The Taches overrides were hardcoded in the backfill script because we had documentation confirming the five adapted skills (`decision-framework`, `context-handoff`, `hook-recipes`, `security-reviewer`, `doc-linter`). Everything else defaulted to `origin: tibsfox, modified: false`, which means it falls under BSL 1.1 by default. The intent is that you will later audit the gsd-* artifacts (skills and agents) and flip the ones that are truly unchanged from the GSD upstream to `origin: gsd, modified: false` — at which point they become BSL-EXEMPT per the LICENSE-POLICY.md rule. The `license-report.mjs` tool makes this audit easy: run it against a fresh state and it'll produce a per-artifact classification CSV at `.planning/license-audit.csv`.

The sidecar README.md approach for teams and chipsets was chosen over augmenting `config.json` (JSON has no place for YAML frontmatter) and over modifying `chipset.yaml` (which is the chipset's own content, not metadata about the library). The sidecar is a clean separation and lets the team/chipset keep its native format untouched.

**Validation results after Stage 2:**
- 127 artifacts checked
- 127 clean (0 errors, 0 warnings)
- Counts: 56 skills, 54 agents, 10 teams, 7 chipsets
- License classification: 127 BSL-1.1, 0 BSL-EXEMPT, 0 errors
  - The 0 BSL-EXEMPT is intentional at this stage — nothing has been marked as upstream-unchanged yet. Expected to change as you audit the gsd-* artifacts.

**Open for future:**
- License audit pass: review gsd-* artifacts and mark upstream-unchanged ones as `origin: gsd, modified: false`
- Per-category README population (these are stubs at the top level only)
- Potential CI wiring to run `validate.mjs` on PRs

---

## 2026-04-10 — Stage 1: category skeleton + tooling + frontmatter convention

**What changed:** Reorganized the previously-flat `examples/` tree into category subfolders across all four types. Introduced a 9-field frontmatter convention. Added `deprecated/` as a first-class subfolder under each type. Introduced `tools/` with an installer (`install.mjs`), validator (`validate.mjs`), catalog generator (`catalog-gen.mjs`), and license reporter (`license-report.mjs`). Added `LICENSE-POLICY.md` documenting the BSL-1.1 exemption rule for unchanged-from-upstream artifacts. Wrote this CHANGELOG.

This was Stage 1 of the reorganization. Stage 2 (classification and frontmatter back-fill) followed in the same session.

**Why:** The library had crossed 125 artifacts and flat browsing was becoming painful. The cross-repo artifact catalog at `.planning/artifact-catalog.csv` (726 rows, spanning this repo, two sibling repos, and the global `~/.claude/`) exposed heavy duplication and surfaced the need for a canonical source of truth. `examples/` was the natural choice: it already holds reference copies, it's already committed, and it's already wired into the project.

The archaeological framing is deliberate. We are developing AI-assisted tooling — skills, agents, chipsets — while simultaneously using AI assistants to help organize and document the work. The decision process behind each change matters because future readers (both human and AI) should be able to reconstruct *why*, not just *what*. This changelog is part of that documentation.

The rationale for this reorganization is preserved in `docs/decisions/examples-library-reorganization.md` (committed, permanent) and in `.planning/examples-reorganization-proposal.md` (private draft, session archive).

**Related:** DMN research series (data mining, 8 docs, 23,666 words, committed 2026-04-10) and HKP research series (housekeeping/data management, 9 docs, 26,383 words, committed 2026-04-10) shipped in the same session and informed the category taxonomy — especially the separation between `orchestration/`, `state/`, and `workflow/`.

---

## 2026-04-08 — Initial bulk import from .claude/ and Grove snapshot

**What changed:** Imported the project-local `.claude/` library into `examples/` via `tools/import-filesystem-skills.ts` — a one-shot script that was deliberately never committed to git. The import brought in 25 skills, 32 agents, and 7 chipsets. In the same session, built `.grove/arena.json` (7.3 MB) as a Grove-format snapshot of a 299-record content-addressed library spanning all four resource kinds.

Commits for this work landed through 2026-04-10. The 299-record count is frozen in `.grove/arena.json`; actual `examples/` entries have diverged as subsequent work added media and research skills.

**Why:** During Arena + Grove development, the `.claude/` library had grown substantially but those newly-authored agents and skills weren't discoverable in `examples/`. The import script pulled everything across in one pass, wrapped in Grove's content-addressed record format. The script was intentionally ephemeral — its job was the one-shot import, not ongoing infrastructure — and so it was never committed.

**What was imported (archaeological detail):**

New skill categories from this import:

| Category | Skills |
|---|---|
| Agent orchestration | `mayor-coordinator`, `sling-dispatch`, `polecat-worker`, `fleet-mission`, `witness-observer`, `gupp-propulsion`, `runtime-hal`, `mail-async`, `nudge-sync`, `hook-persistence` |
| State & lifecycle | `beads-state`, `token-budget`, `done-retirement` |
| Research & mission | `research-engine`, `research-mission-generator`, `vision-to-mission`, `data-fidelity` |
| Media & publishing | `audio-engineering`, `av-studio`, `ffmpeg-media`, `publish-pipeline` |
| Development workflow | `latex-authoring`, `refinery-merge`, `issue-triage-pr-review`, `ecosystem-alignment` |

New agents: audio-engineer, ffmpeg-processor, document-builder, fact-checker, market-researcher, research-fleet-commander, 20+ gsd-* agents (advisor-researcher, assumptions-analyzer, codebase-mapper, debugger, doc-verifier, doc-writer, executor, integration-checker, nyquist-auditor, phase-researcher, plan-checker, planner, project-researcher, research-synthesizer, roadmapper, security-auditor, ui-auditor, ui-checker, ui-researcher, user-profiler, verifier), UC lab agents (brainstorm-engine, perf-analyst, proof-engineer, retro-analyst, skill-forger), v1.50a classroom (student/support/teacher), issue-fixer.

Chipsets imported: `agc-educational`, `aminet-archive`, `chipset` (baseline), `gastown-orchestration`, `math-coprocessor`, `minecraft-knowledge-world`, `unison-translation`.

**Grove codebase snapshot:** `.grove/arena.json` is a 7.3 MB content-addressed record of the full library at import time. Loadable by any Grove-compatible tool. See `docs/GROVE-FORMAT.md` for the spec.

---

## 2026-02-07 — Initial example library, cross-domain expansion, and Taches-CC-Resources attribution

**What changed:** Built out the initial `examples/` library across three commit series on 2026-02-07:

1. `16:55:57` — GSD-complementary skills and agents (first real content, ~20 artifacts)
2. `17:12:12` — Completed remaining GSD-complementary examples
3. `17:21:59` — Added `beautiful-commits` skill for professional git commits
4. `17:46:21` — Added 18 cross-domain examples (10 skills, 5 agents, 3 teams)
5. `20:32:46` — Added 34 DevOps/SRE/Platform examples from the Skills-and-Agents catalog
6. `20:42:31` — Refactored into `skills/`, `agents/`, `teams/` subdirectory structure

Also on this date, imported skills adapted from [glittercowboy/taches-cc-resources](https://github.com/glittercowboy/taches-cc-resources):

| Our skill | Taches source | How we adapted it |
|-----------|---------------|---------------------|
| `decision-framework` | `commands/consider/*` (12 files) | Consolidated into single skill with framework selector |
| `context-handoff` | `commands/whats-next.md` | Task-type-aware capture, structured recovery instructions |
| `hook-recipes` | `skills/create-hooks` | Recipe-focused (copy-paste) vs tutorial-focused |
| `security-reviewer` | `agents/skill-auditor.md` | Auditor pattern applied to app security, not skill structure |
| `doc-linter` | `agents/*-auditor.md` | Auditor pattern applied to documentation quality |

**Why:** taches-cc-resources had strong skill authoring patterns worth learning from. Rather than copy verbatim, each import was modified for our use case — consolidation, scope change, or pattern adaptation. All five derived artifacts will carry `origin: taches-cc-resources, modified: true` in their frontmatter when Stage 2 frontmatter back-fill runs. BSL 1.1 applies to all five because they are modified.

Credit to glittercowboy for the source material.

**First commit of `examples/` directory:** `c4f2c3755` / `f350e4a9f` / `8f36dc6e3` on 2026-02-05 12:36:31 — `feat(23-02): add examples directory structure and git-commit skill`. This is the birth of the library.

---
