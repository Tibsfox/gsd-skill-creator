# v1.49.874 — Context

## Provenance

Seventh ship of the operator-directed v868-v882 follow-on campaign and Track 4 chip #5 (Process singleton chips ×6). Size-ascending order per v868-codified #10444 picks `src/learn/acquirer.ts` (509 LOC, 9 spawn sites) after v873's pre-flight.ts (363 LOC). First chip in the upper-mid LOC band.

## Predecessor chain (Track 4 to date)

- **v1.49.873** — Process chip #4: src/git/gates/pre-flight.ts (363 LOC; module-internal-helper variant).
- **v1.49.872** — Process chip #3: src/cli/commands/pic2html.ts (311 LOC; hoist-at-top variant).
- **v1.49.871** — Process chip #2: src/git/workflows/contribute.ts (183 LOC; closure-capture variant).
- **v1.49.870** — Process chip #1: src/learning/version-manager.ts (177 LOC; class-private-method variant).
- **v1.49.869** — Pre-tag-gate Integration: Cross-Audit Tool as Step 18/18.
- **v1.49.868** — Codification Ship: Promote #10444 + Refine #10443.

## Disciplines this ship applies (no new codifications)

- **#10433 — Internal-helper / safeExecFile wrapper variant** (pairs ensureProcessAllowed with execFileSync at a single helper site; protects 9 spawn sites with one hoist).
- **#10427 — Failure-mode contracts** (3 swallow-everything catches updated to re-throw ProcessContextDenied).
- **#10444 — Size-ascending chip-pick** (509 LOC pick after v873's 363 LOC; upper-mid LOC band).

## Cross-references to related disciplines

- Architecture-retrofit patterns: Lesson #10414 (parent ctx? pattern), #10433 (shared-helper hoist variants — now 5 variants observed in this campaign), #10444 (size-ascending chip-pick + wire-shape catalog).
- KNOWN_UNWIRED ledger discipline: Lesson #10432 (parent), #10443 (inverse-audit — automatic via pre-tag-gate step 18).
- Failure-mode contracts: Lesson #10427 (load-bearing security denials propagate; 23 total re-throws now applied across v870+v871+v873+v874).

## Forward path

Next ship: **v1.49.875** — Process chip #6 (Track 4 close): `src/chipset/harness-integrity.ts` (1440 LOC; largest of the campaign).

After Track 4:
- v1.49.876-881 — Egress chips ×6 (Track 5).
- v1.49.882 — Verify-overdue forecast scan tool.
