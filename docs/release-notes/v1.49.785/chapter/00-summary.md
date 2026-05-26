> Following v1.49.784 — _Codification: 8 v781-v783 lessons → 3 new operative disciplines_, v1.49.785 ships as PROJECT.md Normalizer + GAP Table Refresh.

# v1.49.785 — PROJECT.md Normalizer ship

**Shipped:** 2026-05-26

A ~2h audit-driven operational chip — the first ship of Tier 1 from `.planning/AUDIT-2026-05-26-core-functions-retrospective.md`. Converts PROJECT.md prose-drift from a social rule into a deterministic pre-tag-gate step.

## What shipped

- **`tools/project-md-normalizer.mjs`** (271 lines) — structural validator for `.planning/PROJECT.md`. Verifies required sections present, "Latest shipped release" version matches package.json (or predecessor), GAP table well-formed, statuses from known enum, "Last updated" freshness.
- **`tools/__tests__/project-md-normalizer.test.mjs`** (12 tests, all pass) — covers clean-passes, missing-section-blocks, version-drift-warns, --strict-escalates, malformed-id-warns, unknown-status-warns, missing-file-exits-2, empty-table-blocks, allowed-enum, and the Lesson #10416 \\Z-in-body strip safety (the normalizer correctly walks lines rather than using a JS regex that would treat `\\Z` as literal Z).
- **`tools/pre-tag-gate.sh` step 17/17** — WARN-only by default; promotes to BLOCKER via `SC_PRE_TAG_GATE_REQUIRE=project-md`. Mirrors the discipline-coverage / story-drift WARN-only step pattern.
- **`vitest.tools.config.mjs`** — adds the new test file to the tools-vitest include list.
- **`.planning/PROJECT.md`** (working-tree only; gitignored) — GAP table refreshed:
  - GAP-1 → CLOSED (was "ADDRESSED")
  - GAP-2 → status note refined ("substrate complete at v1.49.572; consumer engine open")
  - GAP-6 → CLOSED at v1.49.572 T1c via `docs/substrate/semantic-channel.md` (was stale-Open)
  - "Latest shipped release" → v1.49.784 (was v1.49.600, 184 versions stale)
  - "Active milestone" → v1.49.785 (was v1.49.601)
  - "Last updated" → 2026-05-26 (was 2026-05-02)

## Through-line

PROJECT.md drift is the same class of bug as STATE.md drift (closed at v1.49.783) — hand-authored prose that must mirror ground truth without a gate to enforce the mirror. The v585 → v784 gate-not-vigilance discipline says: convert offending social rules into deterministic gates rather than re-emphasizing prose discipline. This ship applies that discipline to PROJECT.md.

The audit found this specific drift: GAP-6 was listed as Open despite being CLOSED at v1.49.572 T1c. PROJECT.md "Current Milestone" referenced v1.49.601 — 184 versions behind. "Last updated" was 24 days old. Each of these failures is forgivable in isolation; together they erode trust in PROJECT.md as a reliable artifact. The normalizer ensures the next operator (or audit) doesn't repeat the discovery.

## Verification

- `node tools/project-md-normalizer.mjs --check` against refreshed PROJECT.md → exit 0, "no drift"
- `npx vitest run --config vitest.tools.config.mjs tools/__tests__/project-md-normalizer.test.mjs` → 12/12 PASS
- `bash tools/pre-tag-gate.sh` → 17/17 PASS (step 17 in WARN-only mode, no findings)

## Audit roadmap status

This is **Tier 1 ship 1/N** per audit §4. T1.4 fragment + S5 strengthening lever delivered. Next queued: T1.2 (adoption telemetry weekly report, ~2-3 ships), then T1.1 (bounded-learning calibration loop, ~4-6 ships), then T1.3 (College of Knowledge consumer engine, ~3-5 ships).

## Engine state

NASA degree sustains at **1.177** — 9 consecutive ships at this level (v777-v785). NASA 1.178 forward-cadence advance is deferred by 1 ship to complete Tier 1 audit work.
