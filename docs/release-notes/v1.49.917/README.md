# v1.49.917 — Counter-Cadence Codify + Audit-Step Semantics

**Shipped:** 2026-05-30
**Type:** Counter-cadence (operational-debt / codification; no NASA degree advance)
**NASA degree:** 1.178 (unchanged — 135 consecutive ships)
**Predecessor:** v1.49.916

## What shipped

Two deliverables, both closing forward-path items the v1.49.916 handoff named:

1. **Audit-step semantics cleanup** (`tools/release-history/refresh.mjs`) — removed an inert dead branch and a misleading "informational" comment around the final `audit` step, and documented the load-bearing invariant: `audit` (which runs the AC checks including the leak-scan) is a fatal, loud verification gate and must remain the last step. Behavior-preserving — `audit` was already de-facto fatal; the change removes the smell and records the decision.
2. **Codified lesson #10462 — describe the pattern, never quote the literal.** The leak-scanner authoring rule plus the allowlist-vs-scrub decision rule, added to the security-hygiene skill, cross-referenced from `docs/failure-mode-contracts.md`, and registered in the discipline manifest. Lessons 148 → 149.

Option 4 (narrowing an operator-private local scan pattern) was deferred by operator decision.

## Engine state

- NASA degree 1.178 (unchanged)
- Counter-cadence count: 18
- Manifest: 24 domains, 149 lessons
- Tools suite: 691 tests (unchanged — existing tests cover both changes)
- KNOWN_UNWIRED Process/Egress/Loader: 0/0/0

## Chapters

- [00-summary](chapter/00-summary.md)
- [03-retrospective](chapter/03-retrospective.md)
- [04-lessons](chapter/04-lessons.md)
- [99-context](chapter/99-context.md)
