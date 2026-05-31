# v1.49.925 — Operationalize the #10463 Flip Gate: macOS-Flip Readiness Checker

**Shipped:** 2026-05-31
**Type:** Counter-cadence (operationalization; no NASA degree advance)
**NASA degree:** 1.178 (unchanged — 140 consecutive ships)
**Predecessor:** v1.49.924

## What shipped

Converted the prose-only flip gate that #10463 (codified at v1.49.924) leaves for the operator — "flip the staged macOS matrix leg to load-bearing once N consecutive green macOS pushes accumulate across organic churn" — into a deterministic, checkable tool: `tools/ci/macos-flip-readiness.mjs`. This drains carry-forward #1 from the v1.49.924 handoff **without flipping the leg** — the flip stays correctly deferred; what ships is the instrument that says *when* it's safe.

The gate was easy to misjudge as prose: at v1.49.924 the macOS leg was 9-for-9 green, yet every green was a docs/release/CI-config ship that re-ran an unchanged test surface — zero organic development churn. The checker reads each `ci.yml` run's macOS **job** conclusion (never the masked run-level conclusion), classifies each commit's churn against a tight organic allow-list, and reports the consecutive organic-green streak against N. It is **advisory** (exit `0`=READY / `1`=NOT READY / `2`=indeterminate), never a ship blocker; the flip stays a deliberate operator act that also updates the `ci-matrix-parity.test.ts` drift-guard. Live verdict today: **NOT READY — streak 1/3.**

This is gate-not-vigilance (#10428 sibling) applied to a prose gate, and it extends #10463 rather than adding a new manifest lesson (lessons stay 150).

## Engine state

- NASA degree 1.178 (unchanged)
- Counter-cadence count: 20
- Manifest: 24 domains, 150 lessons (unchanged — #10463 extended, no new lesson)
- Tools suite: 724 tests (+26 — the new checker tests)
- KNOWN_UNWIRED Process/Egress/Loader: 0/0/0

## Chapters

- [00-summary](chapter/00-summary.md)
- [03-retrospective](chapter/03-retrospective.md)
- [04-lessons](chapter/04-lessons.md)
- [99-context](chapter/99-context.md)
