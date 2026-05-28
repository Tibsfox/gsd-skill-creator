# v1.49.873 — Context

## Provenance

Sixth ship of the operator-directed v868-v882 follow-on campaign and Track 4 chip #4 (Process singleton chips ×6). Size-ascending order per v868-codified #10444 picks `src/git/gates/pre-flight.ts` (363 LOC) after v872's pic2html (311 LOC). Mid-LOC band continues.

## Predecessor

- **v1.49.872** — ProcessContext singleton chip: src/cli/commands/pic2html.ts (Track 4 chip #3; hoist-at-top variant).
- **v1.49.871** — ProcessContext singleton chip: src/git/workflows/contribute.ts (Track 4 chip #2; closure-capture variant).
- **v1.49.870** — ProcessContext singleton chip: src/learning/version-manager.ts (Track 4 chip #1; class-private-method variant).
- **v1.49.869** — Pre-tag-gate Integration: Cross-Audit Tool as Step 18/18.
- **v1.49.868** — Codification Ship: Promote #10444 + Refine #10443.

## Disciplines this ship applies (no new codifications)

- **#10433 — Internal-helper / module-internal-helper variant** (helper stays at module scope; takes ctx? as 3rd parameter; threaded through 5 functions).
- **#10427 — Failure-mode contracts** (11 swallow-everything catches updated to re-throw ProcessContextDenied — largest single-ship application yet).
- **#10444 — Size-ascending chip-pick** (363 LOC pick after v872's 311 LOC; mid-LOC band continues).

## Cross-references to related disciplines

- Architecture-retrofit patterns: Lesson #10414 (parent ctx? pattern), #10433 (shared-helper hoist variants), #10444 (size-ascending chip-pick + wire-shape catalog).
- KNOWN_UNWIRED ledger discipline: Lesson #10432 (parent), #10443 (inverse-audit — automatic via pre-tag-gate step 18).
- Failure-mode contracts: Lesson #10427 (load-bearing security denials propagate; 20 total re-throws now applied across v870+v871+v873 — codification candidate).

## Forward path

Next ship: **v1.49.874** — Process chip #5 in size-ascending order: `src/learn/acquirer.ts` (509 LOC).

Remaining Track 4 chips:
- v1.49.875 — `src/chipset/harness-integrity.ts` (1440 LOC; largest, Track 4 close).

Then Track 5 (Egress chips ×6, v1.49.876-881) + verify-overdue scan (v1.49.882).
