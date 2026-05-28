# v1.49.872 — Context

## Provenance

Fifth ship of the operator-directed v868-v882 follow-on campaign and Track 4 chip #3 (Process singleton chips ×6). Size-ascending order per v868-codified #10444 picks `src/cli/commands/pic2html.ts` (311 LOC) after v871's contribute.ts (183 LOC).

First chip ship to land in the mid-LOC band (200-400 LOC per #10444 catalog). The catalog predicts hoist-outside-Promise or closure-capture for this band, but pic2html chose hoist-at-top because it has N=1 spawn site. The spawn-site count is a more precise predictor than LOC alone — a refinement candidate for #10444.

The chip ships under v869-wired pre-tag-gate step 18/18 (cross-audit tool runs automatically). Third chip under the deterministic-gate regime; cross-audit reported clean before tag push.

## Predecessor

- **v1.49.871** — ProcessContext singleton chip: `src/git/workflows/contribute.ts` (Track 4 chip #2; closure-capture variant of #10433). Module-level exec() helper refactored into a function-local closure.
- **v1.49.870** — ProcessContext singleton chip: `src/learning/version-manager.ts` (Track 4 chip #1; internal-helper #10433). Class private git() method.
- **v1.49.869** — Pre-tag-gate Integration: Cross-Audit Tool as Step 18/18 (Deterministic Gate).
- **v1.49.868** — Codification Ship: Promote #10444 + Refine #10443. Doc-only.
- **v1.49.867 and earlier** — see prior release-notes.

## Disciplines this ship applies (no new codifications)

- **#10433 — Internal-helper / hoist-at-top** (single ensureProcessAllowed at the spawn site; N=1 site → no helper extraction needed).
- **#10444 — Size-ascending chip-pick** (311 LOC pick after v871's 183 LOC; mid-LOC band).

## Cross-references to related disciplines

- Architecture-retrofit patterns: Lesson #10414 (parent ctx? pattern), #10433 (hoist-at-top for N=1 spawn site), #10444 (size-ascending chip-pick + wire-shape catalog).
- KNOWN_UNWIRED ledger discipline: Lesson #10432 (parent ratchet ledger), #10443 (inverse-audit stale-entry detection — automatic via pre-tag-gate step 18).

## Forward path

Next ship: **v1.49.873** — Process chip #4 in size-ascending order: `src/git/gates/pre-flight.ts` (363 LOC, +52 over v872).

Remaining Track 4 chips:
- v1.49.874 — `src/learn/acquirer.ts` (509 LOC).
- v1.49.875 — `src/chipset/harness-integrity.ts` (1440 LOC; largest, Track 4 close).

Then Track 5 (Egress chips ×6, v1.49.876-881) + verify-overdue scan (v1.49.882).
