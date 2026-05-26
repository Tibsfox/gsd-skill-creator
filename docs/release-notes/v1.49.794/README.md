# v1.49.794 — Deterministic Gate for #10424: Adoption-Refresh Overwrite Guard

**Released:** 2026-05-26
**Type:** forward-cadence operational-debt closure ship (NOT a NASA degree advance, NOT counter-cadence, NOT a verdict ship)
**Predecessor:** v1.49.793 — Shelfware Verdicts 5 + 6 (Math Foundations Refresh cluster CLOSED)
**Engine state:** UNCHANGED (NASA degree sustains at 1.178)
**Wedge:** Path E from the v793 handoff — migrate Lesson #10424 from prose-in-handoff candidate to deterministic gate, and simultaneously promote it to ESTABLISHED

## Summary

Closes the only open lesson candidate (#10424) in the v793 backlog by converting the "run adoption-refresh AFTER bump-version" rule from a prose-in-handoff sequencing warning into a deterministic guard inside `tools/adoption-refresh.mjs`. The guard refuses to overwrite an existing `docs/ADOPTION-BASELINE-v${VERSION}.json` whose content would differ, unless `--force`. First-run writes and idempotent re-runs (content matches) are unaffected; `--dry-run` skips the guard entirely (read-only mode is informational).

The trip class — running adoption-refresh before bumping the version, overwriting the predecessor's committed baseline with the successor's content — tripped once at v791 and held clean across v792 + v793 under operator vigilance alone. Per the meta-discipline now codified in `docs/static-analysis-tool-discipline.md`, a prose warning that has tripped once and held 2-3 ships is ripe for migration to a deterministic gate. This ship does both — install the gate AND promote the candidate to ESTABLISHED in the same milestone.

## Deliverables

| Path | Status | Notes |
|---|---|---|
| `tools/adoption-refresh.mjs` | MODIFIED | +30 lines — new `checkOverwriteGuard()` function; `--force` flag; header docstring expanded with overwrite-guard spec |
| `tools/__tests__/adoption-refresh.test.mjs` | MODIFIED | +60 lines — 3 new tests (T9 guard refusal, T10 `--force` override, T11 idempotent re-run); test count 8 → 11 |
| `docs/static-analysis-tool-discipline.md` | MODIFIED | +30 lines — new "Refuse to overwrite version-stamped baseline files (Lesson #10424 — ESTABLISHED, v794)" section; anti-pattern + lesson-reference rows added |
| `tools/render-claude-md/disciplines.json` | MODIFIED | static-analysis-tool-authoring entry: `key_lessons` +1 (#10424); `summary` extended; `codified_at_milestone` extended; manifest lessons 64 → 65 |
| `CLAUDE.md` | REGENERATED | via `npm run render:claude-md` (gitignored — local only). `--check` confirms in-sync. |
| `.planning/PROJECT.md` | MODIFIED | Active milestone + Latest shipped release + Last updated frontmatter advanced |

## What changed (behaviorally)

- `node tools/adoption-refresh.mjs` (no flags) — unchanged for the happy path (first-run or idempotent re-run).
- `node tools/adoption-refresh.mjs` (when target JSON exists with different content) — **NEW: exits 3 with a helpful FATAL message suggesting `bump-version`** instead of silently overwriting.
- `node tools/adoption-refresh.mjs --force` — **NEW: overrides the guard with a WARN** (preserved for legitimate retroactive baseline rewrites).
- `node tools/adoption-refresh.mjs --dry-run` — unchanged; guard skipped (read-only mode).

## What is now closed

- **Lesson #10424 candidate → ESTABLISHED.** Promoted from v791 candidate to formal ID in the static-analysis-tool-discipline.md domain. Manifest `key_lessons` array gains `#10424`; manifest lessons 64 → 65.
- **Operational-debt sequencing trip class.** The v791 ordering-trip cannot recur silently: future operators will get a FATAL with corrective guidance, not a quiet overwrite.
- **Meta-principle codified.** "When a prose-in-handoff sequencing warning trips once and holds 2-3 ships under vigilance, migrate to a deterministic gate the next ship" — now documented in the discipline doc.

## Verification

- `npx vitest run --config vitest.tools.config.mjs tools/__tests__/adoption-refresh.test.mjs` → 11/11 PASS (T1-T8 unchanged + T9-T11 new — guard refusal, `--force` override, idempotent re-run).
- `node tools/render-claude-md.mjs --check` → "CLAUDE.md is up to date."
- `bash tools/pre-tag-gate.sh` → TO-FILL after gate run.

## Engine state

NASA degree sustains at **1.178** (UNCHANGED). Counter-cadence count UNCHANGED at 5. v794 is forward-cadence operational-debt closure.

## Audit roadmap status

| Item | Status |
|---|---|
| T1.4 — PROJECT.md GAP table refresh | Delivered at v785 |
| S5 — PROJECT.md normalizer | Delivered at v785 |
| T1.2 series — adoption telemetry + cluster verdicts (6/6) | Delivered v786-v793 |
| Path A meta — Codification of v785-v789 lesson cluster | Delivered at v790 |
| **Path E — #10424 deterministic gate + ESTABLISHED promotion** | **Delivered at v794 (this ship)** |
| T1.1 — Bounded-learning calibration loop | OPEN — 4-6 ships (NEXT) |
| T1.3 — College of Knowledge consumer engine | OPEN — 3-5 ships |
| S3 — Codify the meta-cadence | OPEN |
| S4 — Public surface separation | OPEN |
| S6 — Self-evidence loop for security disciplines | OPEN |
| S7 — Counter-cadence cadence | OPEN |

## Lesson-backlog state

| Phase | Open candidates |
|---|---|
| v789 close | 7 (drained at v790) |
| v790 close | 0 |
| v791 close | 1 (#10424 emitted) |
| v792 close | 1 (#10424 held clean) |
| v793 close | 1 (#10424 held clean — 3rd) |
| **v794 close** | **0 (#10424 promoted to ESTABLISHED + gate installed)** |

## Next forward candidates

- **Path A — T1.1: Bounded-learning calibration loop** (4-6 ships, most ambitious Tier 1 remaining).
- **Path B — T1.3: College of Knowledge consumer engine** (3-5 ships; natural future promotion site for `coherent-functors` CLI → in-loop wire).
- **Path C — NASA 1.179 forward-cadence** (1 ship; INTERSTELLAR-BOUNDARY axis obs#3 candidates in `to-1.179.md`).
- **Path D — Strengthening Levers** (S3, S4, S6, S7 — batchable 2-3 per ship).
