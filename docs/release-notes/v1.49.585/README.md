# v1.49.585 — Concerns Cleanup / Foundation Shoring

**Released:** 2026-04-29
**Type:** counter-cadence operational-debt milestone (NOT a NASA degree)
**Predecessor:** v1.49.584 (Pioneer 9 / Graceful-Attrition + Form-as-Multiplicity-Coordination triple)
**Mission package:** `.planning/missions/v1-49-585-concerns-cleanup/` (21 files, 4,461 lines)
**Source vision:** `.planning/codebase/CONCERNS.md` (same-day codebase audit)
**Engine state:** UNCHANGED (no NASA / MUS / ELC / SPS forward-cadence content this milestone)

## Summary

v1.49.585 ships the first **counter-cadence cleanup milestone** in the engine: 5 categories of accumulated *social-rule* operational debt converted into **deterministic gates** that the harness or CI executes mechanically. The milestone gates itself at ship time — the very hooks, tests, and templates installed during W1-W3 are exercised against v1.49.585's own release-notes / push / chapters during the W4 ship pipeline. This is the strongest signal that the gate is real: the system enforces its new invariants against itself before the tag lands.

**12 components, 5 phases + integration.** Hooks (`self-mod-guard.js` blocking writes to `.claude/skills|agents|hooks/`; `git-add-blocker.js` blocking adds of `.planning/` / `.claude/` / `.archive/` / `artifacts/`), pipeline robustness (chapter.mjs idempotent-write preserving hand-authored release-notes; pre-push completeness gate against missing 5-file structure), scorer + template hygiene (ELC scorer regex unified with MUS; MUS Phase C concept-registry .ts authored alongside subject-spec.json template), cross-repo + git posture (artemis-ii `.env` location FULLY DEPRECATED in favor of `<repo-root>/.env` with `RH_ENV_FILE` override; `.gitattributes` formalizing line-ending + diff strategy; 13/16 dead branches pruned), agent-source reconciliation (39 ad-hoc agents promoted from `.claude/agents/` runtime mirror to `project-claude/agents/` source-of-truth), CLAUDE.md updated with Operational Gates + Environment Variables tables, citation-debt persistence (`.planning/citation-debt.json` ledger seed + `tools/citation-debt/list.mjs` query CLI). The mission converts five years of accumulated prose-only safety rules into a layer that fires automatically.

## Cross-track / Engine state

- **No NASA / MUS / ELC / SPS forward-cadence content this milestone** — engine remains at degree 66 (v1.49.584 close), MUS Pass-1 COMPLETE, ELC era si-discrete CLOSED, §6.6 register at 10 exemplars across 6 variants.
- **No new external citations** — the four CS25-26 Sweep + four JULIA-PARAMETER anchors at v1.49.575 + v1.49.577 remain as documented.
- **No new V-flags emitted** — the 9 carryforward V-flags from v1.49.584 are now persisted to `.planning/citation-debt.json` and queryable via `tools/citation-debt/list.mjs`. Net debt at v1.49.585 close: same 9 entries, now first-class.
- **First counter-cadence cleanup milestone** — registered as Lesson #10168 (every N forward-cadence milestones, run a concerns-cleanup ship).
- **First milestone where the system gates itself at ship time** — registered as Lesson #10170 (meta-test strategy: the newly-installed gates are exercised against the milestone's own release-notes during the ship pipeline).
- **Mid-mission architectural correction** — `/media/foxy/ai/GSD/dev-tools/artemis-ii/` was framed as a "sibling DEV-TOOLS PROJECT" hosting canonical PG `.env`; verification mid-session showed it's a git worktree of gsd-skill-creator's `artemis-ii` branch. C08 was rewritten from option B (env-var override) to option C (full deprecation) on user direction. Registered as Lessons #10171 + #10172.

## Threads closed / opened / extended

- **OPENED:** counter-cadence cleanup-mission cadence (this milestone is the origin; cadence target ~every 30 forward milestones).
- **OPENED:** deterministic operational-gate layer (5 gates installed; 22 bash hook self-test cases + 5 vitest in-glob tests + 22 forward-ready tests in `tools/**`).
- **EXTENDED:** project-claude/agents source-of-truth (10 → 49 entries; 39 promoted from runtime mirror).
- **CLOSED:** artemis-ii worktree-attached `.env` as canonical PG-credentials source (replaced by `<repo-root>/.env` with backward-compat alias).
- **CARRY-FORWARD:** all v1.49.584 thread states (PCL 2-exemplar, GA 1-exemplar, MUS Pass-1 COMPLETE, ELC si-discrete CLOSED).

## Forward lessons emitted

7 new lessons #10168-#10174 (see `chapter/04-lessons.md`):
- #10168 — counter-cadence cleanup-mission pattern
- #10169 — gate-not-vigilance discipline (a hook fired ≥7× during its OWN milestone's execution)
- #10170 — meta-test strategy at ship time (system gates itself)
- #10171 — architectural correction mid-mission (codebase-mapper outputs are starting points, not source-of-truth)
- #10172 — scope expansion mid-mission produces better outcome than scope-as-specified
- #10173 — hook self-tests must use `env -i` for full sterility
- #10174 — `.claude/settings.json` is correctly gsd-config-guard-protected; new hook registrations route through `project-claude/`

## Thread state

CHAIN-CONVENTIONS stays at v1.4 (no thread promotion this milestone; cleanup-mission cadence is a NEW operational-cadence thread but not a §6.6 process variant).

---
**Prev:** [v1.49.584](../v1.49.584/README.md) · **Next:** v1.49.586+
