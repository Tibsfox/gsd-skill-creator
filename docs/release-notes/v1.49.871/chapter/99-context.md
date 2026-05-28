# v1.49.871 — Context

## Provenance

Fourth ship of the operator-directed v868-v882 follow-on campaign and Track 4 chip #2 (Process singleton chips ×6). Size-ascending order per v868-codified #10444 picks `src/git/workflows/contribute.ts` (183 LOC) after v870's version-manager (177 LOC).

The chip ships under v869-wired pre-tag-gate step 18/18 (cross-audit tool runs automatically). Second chip under the deterministic-gate regime; tool reported clean before tag push.

## Predecessor

- **v1.49.870** — ProcessContext singleton chip: `src/learning/version-manager.ts` (Track 4 chip #1; internal-helper #10433). 177 LOC; class private method `git()` wraps 7 git commands.
- **v1.49.869** — Pre-tag-gate Integration: Cross-Audit Tool as Step 18/18. Wires v857 cross-audit tool as deterministic gate.
- **v1.49.868** — Codification Ship: Promote #10444 + Refine #10443. Doc-only.
- **v1.49.867 and earlier** — see prior release-notes.

## Disciplines this ship applies (no new codifications)

- **#10433 — Internal-helper for ctx? threading** (closure-capture variant; helper lives as function-local closure capturing ctx? from outer scope).
- **#10427 — Failure-mode contracts** (re-throw ProcessContextDenied from 4 swallow-everything catches before falling through to fault-tolerant recovery).
- **#10444 — Size-ascending chip-pick** (183 LOC pick after v870's 177 LOC; matches small-to-mid LOC band predicting closure-capture or hoist-outside-Promise shapes).

## Cross-references to related disciplines

- Architecture-retrofit patterns: Lesson #10414 (parent ctx? pattern), #10433 (internal-helper for ctx? threading), #10444 (size-ascending chip-pick).
- KNOWN_UNWIRED ledger discipline: Lesson #10432 (parent ratchet ledger; this chip reduces by 1), #10443 (inverse-audit stale-entry detection — automatic via pre-tag-gate step 18).
- Failure-mode contracts: Lesson #10427 (load-bearing security denials propagate even from result-wrapping catches).

## Forward path

Next ship: **v1.49.872** — Process chip #3 in size-ascending order: `src/cli/commands/pic2html.ts` (311 LOC, +128 over v871).

Remaining Track 4 chips:
- v1.49.873 — `src/git/gates/pre-flight.ts` (363 LOC).
- v1.49.874 — `src/learn/acquirer.ts` (509 LOC).
- v1.49.875 — `src/chipset/harness-integrity.ts` (1440 LOC; largest, Track 4 close).

Then Track 5 (Egress chips ×6, v1.49.876-881) + verify-overdue scan (v1.49.882).
