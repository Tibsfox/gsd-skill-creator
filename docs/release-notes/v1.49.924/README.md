# v1.49.924 — Counter-Cadence Codify: Staged CI-Lane Promotion (#10463)

**Shipped:** 2026-05-31
**Type:** Counter-cadence (codification; no NASA degree advance)
**NASA degree:** 1.178 (unchanged — 139 consecutive ships)
**Predecessor:** v1.49.923

## What shipped

Codified lesson **#10463 — staged CI-lane promotion via a non-blocking matrix leg** into the discipline manifest, draining carry-forward #2 from the v1.49.923 handoff. The candidate recorded in `docs/release-notes/v1.49.923/chapter/04-lessons.md` is promoted to a first-class manifest lesson in the **Static-analysis tool authoring** domain — its natural realizable home, because the lesson's enforcement mechanism is a structural drift-guard (the candidate also named `ci-cd`, which has no canonical doc; creating a new domain for a single lesson was deferred).

The lesson: when promoting an unproven CI lane (a new OS, runtime, or toolchain) into the ship-blocking workflow, fold it in as a matrix leg with `continue-on-error: ${{ matrix.<dim> == '<new>' }}` + `fail-fast: false`. This buys per-push signal immediately while keeping the run-level conclusion the ship gate reads unaffected, so the unproven lane cannot block a ship — the intermediate rung between a decoupled-nightly lane and a load-bearing one. It carries the empirically-established GitHub-Actions fact (a job-level `continue-on-error` leg that fails still yields run-level conclusion `success` unless a `needs:[<job>]` downstream consumes the per-leg success) and the drift-guard pairing (`tests/integration/ci-matrix-parity.test.ts` is the #10461 enforcement layer; the load-bearing flip is a deliberate test-updating act). Sibling of #10428 (meta-cadence — staged rungs over one-shot promotion). Lessons 149 → 150.

## Engine state

- NASA degree 1.178 (unchanged)
- Counter-cadence count: 19
- Manifest: 24 domains, 150 lessons
- Tools suite: 698 tests (unchanged — doc/manifest-only codification, no new tests)
- KNOWN_UNWIRED Process/Egress/Loader: 0/0/0

## Chapters

- [00-summary](chapter/00-summary.md)
- [03-retrospective](chapter/03-retrospective.md)
- [04-lessons](chapter/04-lessons.md)
- [99-context](chapter/99-context.md)
