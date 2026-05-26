# 99 — Context: v1.49.785 PROJECT.md Normalizer

## Predecessor

**v1.49.784** — Codification: 8 v781-v783 lessons → 3 new operative disciplines.
- Tag: `v1.49.784` at SHA `47a6b949a`
- RH refresh: `22fd733cd`
- Closed the 8-lesson candidate backlog accumulated across the v780-v783 Tier E architecture series + v783 deferred-maintenance wedge.
- 3 new canonical docs: `docs/ledger-driven-work-discipline.md`, `docs/architecture-retrofit-patterns.md`, `docs/deferred-maintenance-discipline.md`.

## This milestone's source

`.planning/AUDIT-2026-05-26-core-functions-retrospective.md` — a 297-line synthesis deliverable from a 5-agent parallel audit of ~120 CORE milestones across 5 thematic eras:

- Era A (v1.0–v1.21, Foundation, 24 milestones, score 9/10)
- Era B (v1.22–v1.49, Platform/Desktop/DACP, 22 CORE milestones, score 8/10)
- Era C (v1.49.1–v1.49.155, DACP Micro-Releases, ~28 CORE milestones, score 8/10)
- Era D (v1.49.549–v1.49.580, Substrate Maturation, ~16 milestones, score 7.5/10)
- Era E (v1.49.585–v1.49.784, Operational Hardening, ~32 CORE counter-cadence, score 9/10)

Per-milestone notes at `.planning/audit-2026-05-26/era-{A,B,C,D,E}-*.md`. All audit artifacts are gitignored (`.planning/` policy).

The audit identified Tier 1 (vision-critical, observation-bounded) work:
- T1.1 — Close bounded-learning calibration loop (4-6 ships)
- T1.2 — Wire intrinsic telemetry as adoption surface (2-3 ships)
- T1.3 — Wire College of Knowledge consumer engine (3-5 ships)
- T1.4 — Update PROJECT.md GAP table (fragment)

Plus strengthening lever S5 — treat PROJECT.md as a normalizer-clean artifact via `tools/project-md-normalizer.mjs` analogous to `tools/state-md-normalizer.mjs` (v1.49.783).

v1.49.785 combines T1.4 + S5 as the first shippable Tier 1 unit.

## Successor candidates

Audit §6 recommended ordering:
1. ~~v1.49.785 NASA 1.178 IBEX~~ → replaced by this ship per operator directive ("proceed with Tier 1")
2. ~~v1.49.786 PROJECT.md normalizer + GAP refresh~~ → **delivered as v1.49.785**
3. v1.49.786 NASA 1.178 IBEX (rescheduled; engine-state plateau now at 9 ships, recommend lifting before further Tier 1)
4. v1.49.787 Adoption telemetry weekly report (T1.2 ship 1)
5. v1.49.788 Adoption telemetry observability (T1.2 ship 2-3)
6. v1.49.789+ Bounded-learning calibration loop first threshold change (T1.1)

The audit explicitly noted: "The largest open thread at era-end is 8 consecutive ships at NASA 1.177." This ship makes it 9. Strong recommendation: NASA 1.178 next.

## Branch state pre-ship

- `dev` = `origin/dev` = `origin/main` = `22fd733cd` (0-commit drift)
- Working tree: `dashboard/index.html` modified (auto-regen leave-alone), `.learn-staging/` + `graphify-out/` untracked runtime dirs
- `.planning/STATE.md` clean (normalizer-fixed v1.49.783)
- `.planning/PROJECT.md` working-tree-edited for normalizer-clean state

## Audit deliverable persistence

The audit deliverable + per-era notes live in `.planning/` (gitignored) and are working-tree-only. They are referenced from this milestone's release notes but not committed. Future operators can re-read the audit at `.planning/AUDIT-2026-05-26-core-functions-retrospective.md` or regenerate it from `docs/release-notes/v*/chapter/00-summary.md` if lost.

## Engine state baseline (carried forward)

- NASA degree: **1.177** (unchanged; 9 consecutive ships at this level v777-v785)
- MUS / ELC / SPS / TRS: SCAFFOLD-PENDING continued
- §6.6 register: unchanged (no §6.6 events this ship)
- Counter-cadence count: 5 (unchanged — v585, v776, v777, v778, v779; v785 is audit-driven, not counter-cadence per se)

## Files committed this ship

| Path | Status | Notes |
|---|---|---|
| `tools/project-md-normalizer.mjs` | NEW | 271 lines |
| `tools/__tests__/project-md-normalizer.test.mjs` | NEW | 12 tests |
| `tools/pre-tag-gate.sh` | MODIFIED | Step 17/17 + vocab + exit-code docs |
| `vitest.tools.config.mjs` | MODIFIED | +1 test-file entry |
| `docs/release-notes/v1.49.785/README.md` | NEW | release notes |
| `docs/release-notes/v1.49.785/chapter/00-summary.md` | NEW | |
| `docs/release-notes/v1.49.785/chapter/03-retrospective.md` | NEW | |
| `docs/release-notes/v1.49.785/chapter/04-lessons.md` | NEW | |
| `docs/release-notes/v1.49.785/chapter/99-context.md` | NEW | this file |
| `package.json` + `package-lock.json` + `src-tauri/Cargo.toml` + `src-tauri/tauri.conf.json` | MODIFIED | version bump to 1.49.785 |
| `docs/release-notes/STORY.md` | MODIFIED | v785 entry appended |
| `docs/RELEASE-HISTORY.md` | MODIFIED | v785 row added (post-ship RH refresh) |

Working-tree only (NOT committed; `.planning/` is gitignored):
- `.planning/AUDIT-2026-05-26-core-functions-retrospective.md`
- `.planning/audit-2026-05-26/era-{A,B,C,D,E}-*.md`
- `.planning/PROJECT.md` (refreshed)
- `.planning/STATE.md` (will be hand-authored to v785 state post-ship)
