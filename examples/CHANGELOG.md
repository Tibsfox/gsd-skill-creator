# Changelog — examples/

*Narrative archaeology of the library's evolution. Each entry records what changed and why, for the benefit of future readers (human or AI) trying to reconstruct the reasoning behind the current state.*

This changelog is not strictly Keep-a-Changelog format. It is deliberately narrative: we are building AI-assisted tooling while also documenting the experience of building it, and the decision process matters as much as the diff.

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
