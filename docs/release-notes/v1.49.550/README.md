# v1.49.550 — Platform Alignment Milestone

**Released:** 2026-04-15
**Scope:** twelve platform improvements across memory loading, hook coverage, skill discipline, and lifecycle tracking
**Branch:** dev
**Type:** milestone — platform-alignment mission complete + harness-integrity closure
**Predecessor:** v1.49.549 — Artemis II: The Space Between the Moon and the Earth
**Successor:** v1.49.551 — Cartridge Tarball Fix (ship-blocker patch, already uplifted)
**Commits:** `53aa175c2..e58627523` (~30 commits across 4 waves + harness closure)
**Files changed:** 548 (19,270 insertions / 7,510 deletions)
**Test delta:** ~23,645 → **23,808 passing** (+163 new tests across waves; 23,681 after harness closure)
**New deps:** 0
**Verification:** Wave 0–3 test gates + harness-integrity 43/43 green on tmpdir install + CI green six days before v1.50 ship

## Summary

**Platform Alignment landed twelve improvements sourced from OOPS research with zero new runtime dependencies.** The mission package at `docs/missions/platform-alignment/` enumerated twelve platform gaps — six missing hooks, three oversized Gastown skills, three activation-conflicting skill pairs, relevance-scored memory loading, skill lifecycle frontmatter, and the Wave 0 shared-contracts substrate — and the four waves executed them in order over the run-up to the v1.50 ship date. Wave 0 shipped the shared types (frontmatter schema, activation-equivalence harness, memory tag types, hook-output helper). Wave 1 added six deterministic hooks (PreCompact, PostCompact, FileChanged, PermissionDenied, Notification, WorktreeCreate) plus a worktree-cleanup shell script. Wave 2 split three oversized Gastown skills into SKILL.md + references, merged three skill pairs to end activation conflicts, added relevance-scored memory loading behind a token budget, and backfilled every SKILL.md with `format/version/status/updated` frontmatter. Wave 3 ran the full test surface, repaired two Wave 2B safety-critical regressions and two Wave 2D fixture-drift failures, and tagged the release. Zero new runtime dependencies, consistent with the cartridge-forge precedent from v1.49.549.

**Gastown skill splits cut the 6-skill dispatch token cost by 67.8%.** The three oversized Gastown skills — `sling-dispatch` (2,305 words), `done-retirement` (2,267 words), `gupp-propulsion` (1,961 words) — each carried 1,500+ words of history, examples, and boundary prose in the main SKILL.md. The Wave 2B refactor pulled that content into `references/gastown-origin.md`, `references/boundaries.md`, `references/examples.md`, and left activation-critical prose in SKILL.md at ≤820 words each. Target word counts: sling-dispatch 780, done-retirement 815, gupp-propulsion 807. The full Gastown 6-skill multi-agent dispatch scenario dropped from ~24,271 tokens to ~7,813 tokens — a 67.8% reduction on the load path that users pay every time the dispatch chipset activates. Activation equivalence was proven by `assertActivationEquivalence` from Wave 0: every trigger term from the original skill is verified present in the split skill before the refactor commits.

**Skill merges ended three long-standing activation conflicts.** Three pairs of skills that users routinely triggered together had overlapping descriptions that fired both and caused context bloat: `beautiful-commits + git-commit` → `commit-style`, `gsd-onboard + gsd-explain` → `gsd-guide`, and `uc-lab + sc-dev-team` → `team-control` (parameterized by mode). Each merge preserved every trigger phrase from both sources — the activation-equivalence harness proved it mechanically. The `team-control` merge drove one schema change: the merged description needed 375 characters to cover both source surface areas, which exceeded the original `max(250)` description cap. Wave 2D raised the cap to `max(500)` and updated the assertion test. The lesson there (a merge can legitimately produce outputs that exceed per-source constraints) is captured in the lessons list below.

**Relevance-scored memory loading capped the naive-load path at a 2,000-token budget.** Before Wave 2A, every session restore that touched memory pulled all 154 memory files through `gsd-restore-work-state.js` — roughly 111,465 tokens, most of them irrelevant to the current task. `src/memory/relevance-scorer.ts` scores each memory file by keyword overlap with the task context, section-level boost for matching headers, and a hard-pinned always-load list for standing rules. `src/memory/memory-loader.ts` then fills a 2,000-token budget with the top-scored files and stops. Feature-flagged behind the session restore hook, with a safety net: standing rules (HARD RULE entries, session-log retention policy, memory-budget policy) load unconditionally. Actual task loads use a small fraction of the 2,000-token budget because relevance gates most files out — the budget is a ceiling, not a floor.

**Six new hooks closed gaps in Claude Code's deterministic lifecycle surface.** Wave 1 added: `pre-compact-snapshot.cjs` + `post-compact-recovery.cjs` (paired — snapshot session/git/STATE/journal before compaction, restore as `additionalContext` after, combining the snapshot with live git state at recovery time rather than trusting the snapshot alone); `external-change-tracker.cjs` (5-case dispatcher for SKILL.md, `.planning/`, `settings.json`, `CLAUDE.md`, `src/`/`desktop/`); `permission-recovery.cjs` (detects retry loops and emits tool-specific guidance); `notification-logger.cjs` (Pass 1 discovery logger for Notification events); and `worktree-init.cjs` + `worktree-cleanup.sh` (worktree lifecycle with dirty-tree preservation and 24-hour age check — the shell hook is the first in the repository, which turned out to be load-bearing for harness-integrity's `checkHookScriptsExecutable` coverage). All six hooks ship via `project-claude/manifest.json` and install into user `.claude/hooks/` at install time.

**Skill lifecycle frontmatter backfilled 19 SKILL.md files with `format/version/status/updated` and added a lifecycle loader + inventory CLI.** Wave 2D shipped `src/skill/version-backfill.ts` (one-shot migration with `--write` / dry-run modes), `src/skill/lifecycle-loader.ts` (active / deprecated / retired / draft status handling), and `src/cli/commands/skill-inventory.ts` (reports by status, flags stale skills >90 days old). The 19 backfilled SKILL.md files now carry `format: 2025-10-02`, `version: 1.0.0`, `status: active`, and `updated: <git-date>`. The three merged skills carry version info natively from merge time. The inventory CLI's first run reported 40 active, 0 stale, 0 deprecated — a clean baseline for lifecycle tracking from v1.49.550 forward.

**The milestone surfaced three instructive process failures that Wave 3 caught and repaired.** First, the Wave 2D frontmatter backfill added four lines (~8 words) to every SKILL.md, which pushed `done-retirement` (801 words) and `gupp-propulsion` (805 words) over the Wave 2B word-count gate of ≤800 — a gate-crossing regression caused by a non-adjacent change, repaired by raising the gate to 820 to accommodate frontmatter. Second, the Gastown splits rewrote the 7-stage retirement table and the GUPP restart-limits section, losing the specific uppercase stage tokens (`VALIDATE`, `SUBMIT`, `NOTIFY`, `CLEANUP`, `TERMINATE`) and the literal pipe-table format (`Max restarts per bead | 3`) that safety-critical tests check for — SC-07 and SC-08 failed in Wave 3, repaired by adding an explicit stages line in done-retirement's SKILL.md and reformatting the restart-limits bullets as a pipe-delimited table in gupp-propulsion. Third, a test-pollution hypothesis was raised mid-Wave 3 to explain SC-07/SC-08, but md5sum of both files before and after the full `npm test` suite was identical, and `grep -rn writeFileSync` against `.claude/skills/*` paths returned zero matches — pollution was empirically disproven, the failures were genuine Wave 2B regressions, and the verify-state-empirically lesson got another data point.

**The post-milestone harness-integrity closure hardened the release on the eve of v1.50.** Six days before the v1.50 ship (2026-04-21), v1.49.550 also absorbed six harness-integrity closure commits that moved the harness-integrity tests from "exercise whatever `.claude/` happens to be on disk" to "install `project-claude/` into a tmpdir and exercise the installed harness." That refactor (`93dce5564`, `c4978159d`, `ac2bb432b`) made CI and local reproduce identically for the first time since the artemis-ii merge. Two additional hooks shipped in the closure — `gsd-response-scan.cjs` (a matcher-less PostToolUse hook that scans `tool_response` for invisible Unicode and prompt-injection markers, closing the HI-11 response-DLP gap) and a validate-commit.cjs HEREDOC-before-double-quote reorder that fixed the conventional-commits hook rejecting the documented HEREDOC form. Harness-integrity went from 13 failing on CI to 43/43 passing; the full test suite landed at 23,681 passing with 208 previously-gated hook tests now exercised in the tmpdir install. Zero pre-existing failures remain blocking v1.50.

**Twelve improvements, zero new dependencies, +163 tests from the mission waves plus +35 from the harness closure.** The milestone's arc — platform-alignment mission → Wave 0–3 execution → Wave 3 test cleanup → harness-integrity closure — demonstrates the pattern this project uses for non-degree milestones: spec the work in `docs/missions/<name>/`, execute in waves with shared contracts at Wave 0, gate each wave on equivalence harnesses, run the full surface at Wave 3, and absorb post-wave cleanup into the same tag rather than scattering patches. v1.49.551 (the successor, already uplifted) closes the remaining packaging gap — the npm tarball's `files` array had to be extended to include the four cartridge source directories before `npx skill-creator@latest` could install cleanly.

## Key Features

| Area | What Shipped |
|------|--------------|
| Memory Loading (Wave 2A) | `src/memory/relevance-scorer.ts` — keyword overlap + section boost + always-load rules |
| Memory Loading (Wave 2A) | `src/memory/memory-loader.ts` — budget-gated load (default 2000 tokens) with hard-pinned standing rules |
| Memory Loading (Wave 2A) | Hooked behind feature flag in `gsd-restore-work-state.js` |
| Gastown Skill Splits (Wave 2B) | `sling-dispatch` split: 2,305w → 780w SKILL.md + `references/gastown-origin.md` |
| Gastown Skill Splits (Wave 2B) | `done-retirement` split: 2,267w → 815w SKILL.md + two references |
| Gastown Skill Splits (Wave 2B) | `gupp-propulsion` split: 1,961w → 807w SKILL.md + four references |
| Gastown Skill Splits (Wave 2B) | 67.8% token reduction on the full Gastown 6-skill dispatch scenario (24,271 → 7,813 tok) |
| Skill Merges (Wave 2C) | `beautiful-commits + git-commit → commit-style` (activation-equivalence proved) |
| Skill Merges (Wave 2C) | `gsd-onboard + gsd-explain → gsd-guide` (activation-equivalence proved) |
| Skill Merges (Wave 2C) | `uc-lab + sc-dev-team → team-control` (parameterized mode, 375-char description drove schema cap bump) |
| Skill Lifecycle (Wave 2D) | `src/skill/version-backfill.ts` — one-shot migration tool with `--write` / dry-run modes |
| Skill Lifecycle (Wave 2D) | `src/skill/lifecycle-loader.ts` — active / deprecated / retired / draft status handling |
| Skill Lifecycle (Wave 2D) | `src/cli/commands/skill-inventory.ts` — reports by status, flags stale >90 days |
| Skill Lifecycle (Wave 2D) | 19 SKILL.md files backfilled with `format: 2025-10-02`, `version: 1.0.0`, `status: active`, `updated: <git-date>` |
| Hooks (Wave 1) | `pre-compact-snapshot.cjs` + `post-compact-recovery.cjs` — paired PreCompact/PostCompact recovery |
| Hooks (Wave 1) | `external-change-tracker.cjs` — FileChanged dispatcher for SKILL.md / .planning / settings / CLAUDE.md / src+desktop |
| Hooks (Wave 1) | `permission-recovery.cjs` — PermissionDenied retry-loop detector with tool-specific guidance |
| Hooks (Wave 1) | `notification-logger.cjs` — Pass 1 discovery logger for Notification events |
| Hooks (Wave 1) | `worktree-init.cjs` + `worktree-cleanup.sh` — worktree lifecycle with dirty-tree preservation and 24-hour age check |
| Wave 0 Foundation | frontmatter schema + activation-equivalence harness + memory tag types + hook-output helper |
| Harness Closure | `93dce5564` — tmpdir install refactor for harness-integrity tests (43/43 green) |
| Harness Closure | `gsd-response-scan.cjs` — matcher-less PostToolUse hook for invisible Unicode + prompt-injection (HI-11) |
| Harness Closure | `validate-commit.cjs` — HEREDOC matcher runs before double-quoted `-m` so conventional-commit HEREDOC form is accepted |

## Token Cost Deltas

| Scenario | Before | After | Delta |
|----------|-------:|------:|------:|
| Gastown 6-skill dispatch (SKILL+refs loaded) | ~24,271 tok | ~7,813 tok | **-67.8%** |
| Memory naive-load all (154 memory files) | ~111,465 tok | 2,000 tok budget | **-98.2%** |
| Skill inventory (40 skills) | N/A | 40 active / 0 stale / 0 deprecated | baseline |

Memory loader deltas reflect the budget cap; actual task loads use a small fraction of the 2,000-token budget because relevance-scoring gates most files out.

## Retrospective

### What Worked

- **Wave 0 shared contracts unblocked the rest of the milestone.** Shipping the frontmatter schema, activation-equivalence harness, memory tag types, and hook-output helper before any wave did real work meant every later wave referenced known-good types instead of inventing them. The 12 platform improvements fit together because the substrate was in place first.
- **`assertActivationEquivalence` proved skill merges safe mechanically.** The three merges (Wave 2C) and three splits (Wave 2B) all ran the harness at commit time — every trigger term from the source skills is verified present in the output skill before the refactor lands. No activation regressions shipped. The harness is the durable artifact; the merges are specific uses of it.
- **The tmpdir install refactor made CI and local reproduce identically.** harness-integrity tests used to fail differently on CI than on local dev because they read whatever `.claude/` happened to be on disk. Moving them to `project-claude/install.cjs` into `mkdtempSync` meant both environments see the same tree. 13 CI failures → 4 → 0 across three commits (`93dce5564`, `c4978159d`, `ac2bb432b`).
- **Zero new runtime dependencies held the line from v1.49.549.** The cartridge-forge precedent was explicit: ship platform-sized work without touching `package.json` dependencies. Twelve improvements, 163 new tests, zero new deps.
- **The mission package pattern worked.** `docs/missions/platform-alignment/` — 00 milestone spec, 01–07 per-feature specs, 08 wave execution plan, 09 test plan — let four waves execute in order without per-wave replanning. The pattern is reusable for every future platform-scale milestone.

### What Could Be Better

- **The Wave 2B word-count gate didn't budget for Wave 2D frontmatter.** Adding 8 words of frontmatter to every SKILL.md post-hoc pushed two freshly-split skills back over the 800-word limit. The gate should either have excluded frontmatter from its word count or budgeted 10 words up front for lifecycle metadata. Fixed by bumping the gate to 820, but the sequencing was avoidable.
- **SC-07/SC-08 regressions should have been caught at Wave 2B commit time, not Wave 3.** The Wave 2B commit message claimed "safety boundaries stay in SKILL.md," but the refactor was semantic-equivalent only — the safety-critical tests demand literal token match (uppercase stage names, pipe-table format). Running the safety-critical suite before each wave's commit, not just at Wave 3, would have surfaced the regression while the refactor was fresh.
- **The safety-critical tests check format, not semantics.** `'Max restarts per bead | 3'` and uppercase stage tokens (`VALIDATE`, `SUBMIT`, …) are checked as literal strings. A refactor that preserves meaning but changes format fails. Converting those assertions to content-semantic regexes (e.g., `/max\s*restarts.*3/i`) is deferred to a follow-up issue, not landed in this milestone — still tech debt.
- **The milestone crossed an API 500 crash boundary mid-Wave 2D.** The in-flight 19 backfilled SKILL.md files were recovered by the resumed flight-ops session via the wave-boundary handoff doc, but the crash itself was not avoidable from our end. A more conservative commit cadence (commit per skill, not per wave) would reduce the blast radius of any future mid-wave crash.

## Lessons Learned

- **Backfill-before-limit-check causes false regressions.** The Wave 2D frontmatter backfill added ~8 words to every SKILL.md, pushing two Wave 2B skills over an 800-word gate that didn't budget for it. When a gate targets prose word count, either exclude frontmatter or budget for it up front. Fix: gate raised to 820.
- **Schema caps must accommodate merge outputs.** The `team-control` merge carries a 375-character description (longer than either source) because it covers both surface areas. The original `max(250)` cap rejected it. Merge operations can legitimately produce outputs that exceed per-source constraints — schemas must size for the union, not the max per-input.
- **Claims that a refactor preserves safety invariants must be backed by running the safety-critical suite.** Wave 2B claimed "safety boundaries stay in SKILL.md" but the safety-critical tests are literal-token checks, not semantic checks. The refactor broke them. Lesson: before claiming a refactor is safe, run the tests that enforce the safety property. Don't defer to the next wave.
- **Verify state empirically before acting on hypotheses about inter-test interference.** The SC-07/SC-08 pollution hypothesis was disproven in two commands: md5sum of both files before and after `npm test`, plus `grep -rn writeFileSync` against `.claude/skills/*` paths. Both showed zero evidence of pollution. The failures were real Wave 2B regressions. Lesson reinforces the standing rule — measure, don't speculate.
- **Vitest excludes `.claude/**` by default.** Hook tests at `.claude/hooks/tests/*.test.ts` never ran. Hook tests live at `tests/hooks/` where vitest picks them up. The 08-wave-execution-plan had the wrong path; fixed in Wave 1, but the gotcha is durable: any test outside vitest's include paths is dormant whether you wrote it or not.
- **PostCompact recovery combines snapshot + live state, not snapshot alone.** The PreCompact snapshot captures the pre-compaction world, but by PostCompact recovery time the branch, uncommitted changes, and tip commit may have moved. The recovery hook reads the snapshot but queries live git at recovery time and merges — never trusts the snapshot alone.
- **Shell hooks unlock coverage that pure-JS hooks can't.** `worktree-cleanup.sh` was the first shell hook in the repository, which gave harness-integrity's `checkHookScriptsExecutable` something to validate for the first time. The hook was added for its own sake, but it closed a latent coverage gap as a side effect. Lesson: mixed-language hook support isn't decoration — it exercises paths that monoculture hides.
- **Tmpdir install refactors make CI and local deterministic.** Before: harness-integrity read `.claude/` from disk. After: harness-integrity installs `project-claude/` into `mkdtempSync(tmpdir())` and reads that. CI and local now see the same tree. The principle generalizes — any test that reads "whatever happens to be on disk" will eventually diverge between environments.
- **Mission package + wave execution plan is the pattern for platform-scale milestones.** `docs/missions/platform-alignment/` laid out 12 improvements across 4 waves with a per-wave test plan. Each wave closed cleanly because the scope was bounded before execution started. Pattern reusable for every future platform-scale milestone — write the mission package first, execute in waves, Wave 0 ships contracts.
- **Conventional-commit hooks must parse HEREDOC before double-quoted `-m` matchers.** The validate-commit.cjs regex used to greedy-match the entire `"$(cat <<'EOF'...EOF)"` body as the subject, rejecting the documented HEREDOC commit form. Reorder: HEREDOC matcher first (captures full body lazily), then tightened `-m` matchers with `[^"\n]` / `[^'\n]` so they cannot cross newlines. Durable fix; 8 regression tests added.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.49.549](../v1.49.549/) | Predecessor — Artemis II mission-complete tag; established the zero-new-deps precedent v1.49.550 inherited |
| [v1.49.551](../v1.49.551/) | Successor — Cartridge Tarball Fix, the ship-blocker patch that closed v1.49.550's npm tarball gap |
| [v1.49.548](../v1.49.548/) | Last release before the artemis-ii merge — baseline for the 548-file diff |
| [v1.49.500](../v1.49.500/) | Last npx-published skill-creator — v1.49.550's platform work feeds the next publish |
| [v1.49.3](../v1.49.3/) | Prior ship-blocker (Tauri capabilities) — same packaging-boundary-invisible-to-unit-tests lesson as v1.49.551 |
| [v1.50](../v1.50/) | Target milestone six days after this release (2026-04-21) |
| [v1.0](../v1.0/) | Foundation — `extends:` inheritance and bounded learning parameters that Wave 2D's lifecycle loader builds on |
| `docs/missions/platform-alignment/00-milestone-spec.md` | Milestone spec driving all four waves |
| `docs/missions/platform-alignment/08-wave-execution-plan.md` | Wave-by-wave execution plan |
| `docs/missions/platform-alignment/09-test-plan.md` | Per-wave test plan |
| `docs/missions/platform-alignment/07-skill-lifecycle-spec.md` | Wave 2D lifecycle frontmatter contract |
| `docs/missions/platform-alignment/05-gastown-splits-spec.md` | Wave 2B splits specification |
| `docs/missions/platform-alignment/06-skill-merges-spec.md` | Wave 2C merges specification |
| `docs/missions/platform-alignment/04-memory-relevance-spec.md` | Wave 2A memory-loader specification |
| `docs/missions/platform-alignment/01-compaction-hooks-spec.md` | Wave 1 PreCompact/PostCompact hook pair spec |
| `docs/missions/platform-alignment/02-filechanged-hook-spec.md` | Wave 1 FileChanged hook spec |
| `docs/missions/platform-alignment/03-p3-hooks-spec.md` | Wave 1 PermissionDenied/Notification/Worktree hook spec |
| `.claude/skills/` | Skill directory — Wave 2B splits + Wave 2C merges + Wave 2D frontmatter landed here |
| `project-claude/hooks/` | Hook staging directory — Wave 1 hooks install from here via `manifest.json` |
| `src/memory/` | Memory loader + relevance scorer (Wave 2A) |
| `src/skill/` | Frontmatter types + lifecycle loader + version backfill (Wave 0 + 2D) |
| `src/chipset/harness-integrity.test.ts` | Test harness that the tmpdir refactor re-pointed at `project-claude/install.cjs` |

## Engine Position

v1.49.550 is the last milestone tag before the v1.50 ship (2026-04-21). It consolidates the artemis-ii → dev merge's platform debt, closes every residual harness-integrity failure, and locks in the Wave 0 shared-contract substrate that every future platform milestone will build on. The 67.8% Gastown token reduction, the 2,000-token memory budget, the six new deterministic hooks, and the 19 lifecycle-frontmatter SKILL.md files all become load-bearing at v1.50 — the release slated for Foxy's 50th birthday and the first Moon-mission milestone. v1.49.551 (successor, already uplifted) patches the npm-tarball `files` array so the platform work actually ships to `npx skill-creator@latest` users; v1.49.552 (Degree 48) resumes the Seattle 360 / NASA engine cadence from the mega-milestone. The v1.50 ship-line crosses this release — every alignment and cleanup it absorbed is what makes the 2026-04-21 tag possible.

## Files

- `src/memory/relevance-scorer.ts` — keyword-overlap + section-boost relevance scoring for memory files
- `src/memory/memory-loader.ts` — budget-gated memory load with hard-pinned standing rules
- `src/memory/tag-types.ts` + `src/memory/__tests__/tag-types.test.ts` — Wave 0 shared memory tag type contract
- `src/skill/activation-equivalence.ts` + `src/skill/__tests__/activation-equivalence.test.ts` — Wave 0 equivalence harness
- `src/skill/frontmatter-types.ts` + `src/skill/__tests__/frontmatter-types.test.ts` — Wave 0 frontmatter schema
- `src/skill/version-backfill.ts` + `src/skill/__tests__/version-backfill.test.ts` — Wave 2D backfill migration
- `src/skill/lifecycle-loader.ts` + `src/skill/__tests__/lifecycle-loader.test.ts` — Wave 2D active/deprecated/retired/draft handling
- `src/cli/commands/skill-inventory.ts` + `src/cli/commands/skill-inventory.test.ts` — Wave 2D inventory CLI
- `src/hooks/validate-commit-hook.test.ts` — 8 regression tests for the HEREDOC matcher fix
- `src/chipset/harness-integrity.ts` + `src/chipset/harness-integrity.test.ts` — tmpdir install refactor target
- `project-claude/hooks/pre-compact-snapshot.cjs` + `post-compact-recovery.cjs` — Wave 1 compaction hook pair
- `project-claude/hooks/external-change-tracker.cjs` — Wave 1 FileChanged dispatcher
- `project-claude/hooks/permission-recovery.cjs` — Wave 1 PermissionDenied retry-loop detector
- `project-claude/hooks/notification-logger.cjs` — Wave 1 Notification discovery logger
- `project-claude/hooks/worktree-init.cjs` + `project-claude/hooks/worktree-cleanup.sh` — Wave 1 worktree lifecycle
- `project-claude/hooks/gsd-response-scan.cjs` — harness-closure PostToolUse response-DLP hook (HI-11)
- `project-claude/hooks/validate-commit.cjs` — HEREDOC-before-double-quote matcher reorder
- `project-claude/hooks/lib/hook-output.cjs` — Wave 0 shared hook-output helper
- `project-claude/manifest.json` + `project-claude/install.cjs` — hook + skill install manifest (tmpdir-compatible)
- `project-claude/skills/commit-style/SKILL.md` — Wave 2C merge of beautiful-commits + git-commit
- `project-claude/skills/gsd-guide/SKILL.md` — Wave 2C merge of gsd-onboard + gsd-explain
- `project-claude/skills/team-control/SKILL.md` — Wave 2C merge of uc-lab + sc-dev-team
- `project-claude/skills/sling-dispatch/` — Wave 2B split (SKILL.md + references/)
- `project-claude/skills/done-retirement/` — Wave 2B split (SKILL.md + references/)
- `project-claude/skills/gupp-propulsion/` — Wave 2B split (SKILL.md + references/, plus heartbeat.md)
- `docs/missions/platform-alignment/` — 12 specs (00 milestone, 01–07 features, 08 wave plan, 09 test plan, README)
- `tests/hooks/compaction-hooks.test.ts` — Wave 1 PreCompact/PostCompact tests
- `tests/hooks/external-change-tracker.test.ts` — Wave 1 FileChanged dispatcher tests
- `tests/hooks/p3-hooks.test.ts` — Wave 1 PermissionDenied/Notification/Worktree tests
- `tests/hooks/permission-recovery.test.ts` — Wave 1 retry-loop detector tests
- `tests/hooks/hook-output.test.ts` — Wave 0 hook-output helper tests
- `tests/skills/gastown-splits.test.ts` — Wave 2B split-equivalence tests
- `tests/skills/skill-merges.test.ts` — Wave 2C merge-equivalence tests

## Commits

| Commit | Scope | Wave |
|--------|-------|------|
| `cd14dc662` | wave 0 foundation shared types + hook helper | 0 |
| `23ebd698a` | PreCompact/PostCompact recovery pair | 1A |
| `efd2a5cb2` | FileChanged external-change tracker | 1B |
| `d79ae329f` | PermissionDenied + Notification + Worktree P3 hooks | 1C–1E |
| `a75e81da1` | relevance-scored memory loading with token budget | 2A |
| `045852728` | gastown skill splits (sling/done/gupp) | 2B |
| `3839d4190` | skill merges (commit-style, gsd-guide, team-control) | 2C |
| `cc683883c` | skill versioning + lifecycle loader + inventory CLI | 2D |
| `9fe3edfaa` | fixture alignment with wave 2B/2D changes | 3 |
| `f2cfb4e10` | safety-critical token restoration for SC-07/SC-08 | 3 |
| `fed54b147` | untrack .claude/ in gitignore | closure |
| `ac2bb432b` | resolve gastown fixture skills from examples path | closure |
| `c4978159d` | resolve hook/skill fixtures from project-claude | closure |
| `93dce5564` | install project-claude into tmpdir for integrity tests | closure |
| `9e0629368` | close residual harness-integrity gaps | closure |
| `e58627523` | parse heredoc before double-quoted -m in validate-commit | closure |
