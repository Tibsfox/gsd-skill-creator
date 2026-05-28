# v1.49.870 — Context

## Provenance

Third ship of the operator-directed v868-v882 follow-on campaign and first chip of Track 4 (Process singleton chips ×6). Size-ascending order per the v1.49.868-codified #10444 discipline picks the smallest-LOC entry first: `src/learning/version-manager.ts` at 177 LOC.

The chip ships under the v1.49.869-wired pre-tag-gate step 18/18 (cross-audit tool runs automatically). This is the first chip ship under the deterministic-gate regime; the cross-audit ran clean as part of `bash tools/pre-tag-gate.sh` without explicit operator invocation.

## Predecessor

- **v1.49.869** — Pre-tag-gate Integration: Cross-Audit Tool as Step 18/18 (Deterministic Gate). Wires the v857 cross-audit tool as pre-tag-gate step 18; promotes the v868-codified continuous-verification discipline (#10443 refinement) from operator-invoked to automatic.
- **v1.49.868** — Codification Ship: Promote #10444 + Refine #10443. Doc-only; codifies the size-ascending chip-pick discipline that drives the Track 4 picking order.
- **v1.49.867 and earlier** — see prior release-notes.

## Disciplines this ship applies (no new codifications)

- **#10433 — Internal-helper for ctx? threading** (canonical application; single ensureProcessAllowed at the git() helper protects 7 call sites).
- **#10427 — Failure-mode contracts** (re-throw ProcessContextDenied from 4 swallow-everything catches before falling through to fault-tolerant recovery branches).
- **#10444 — Size-ascending chip-pick** (smallest-LOC of remaining 6 entries picked first; cluster's first ship is the simplest template by LOC, though structurally it's the internal-helper shape thanks to the pre-existing `git()` helper).

## Cross-references to related disciplines

- Architecture-retrofit patterns: Lesson #10414 (parent ctx? pattern), #10433 (internal-helper for ctx? threading), #10444 (size-ascending chip-pick).
- KNOWN_UNWIRED ledger discipline: Lesson #10432 (parent — the ratchet ledger this chip reduces), #10443 (inverse-audit stale-entry detection — automatic at pre-tag-gate step 18 per v869).
- Failure-mode contracts: Lesson #10427 (load-bearing security denials propagate even from result-wrapping catches).
- Security chokepoints discipline: ProcessContext as the chokepoint surface; v806 introduction of the surface + KNOWN_UNWIRED ratchet ledger; this ship chips that ledger by one.

## Forward path

Next ship: **v1.49.871** — Process chip #2 in size-ascending order: `src/git/workflows/contribute.ts` (183 LOC, +6 over v870).

Remaining Track 4 chips:
- v1.49.872 — `src/cli/commands/pic2html.ts` (311 LOC).
- v1.49.873 — `src/git/gates/pre-flight.ts` (363 LOC).
- v1.49.874 — `src/learn/acquirer.ts` (509 LOC).
- v1.49.875 — `src/chipset/harness-integrity.ts` (1440 LOC; largest, Track 4 close).

Then Track 5 (Egress chips ×6, v1.49.876-881) + verify-overdue scan (v1.49.882).
