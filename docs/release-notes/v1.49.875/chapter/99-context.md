# v1.49.875 — Context (Track 4 CLOSE)

## Provenance

Eighth ship of the operator-directed v868-v882 follow-on campaign and Track 4 chip #6 (Track 4 CLOSE). Size-ascending order per v868-codified #10444 picks `src/chipset/harness-integrity.ts` (1440 LOC) as the final Process chip.

**KNOWN_UNWIRED Process: 1 → 0** — the ProcessContext chokepoint introduced at v806 with 16 grandfathered entries is now fully wired across all src/ files that spawn child processes. ~30 chip ships over 8 months drained the ratchet to zero.

## Track 4 ship chain

- **v1.49.870** — chip #1: src/learning/version-manager.ts (177 LOC, class-private-method).
- **v1.49.871** — chip #2: src/git/workflows/contribute.ts (183 LOC, closure-capture).
- **v1.49.872** — chip #3: src/cli/commands/pic2html.ts (311 LOC, hoist-at-top, single spawn).
- **v1.49.873** — chip #4: src/git/gates/pre-flight.ts (363 LOC, module-internal-helper).
- **v1.49.874** — chip #5: src/learn/acquirer.ts (509 LOC, safeExecFile wrapper).
- **v1.49.875** — chip #6 CLOSE: src/chipset/harness-integrity.ts (1440 LOC, hoist-at-top despite LOC).

## Disciplines this ship applies (no new codifications)

- **#10433 — Internal-helper / hoist-at-top variant** (single ensureProcessAllowed before the single execSync; #10444 catalog's canonical N=1 shape applied to a large-LOC file).
- **#10427 — Failure-mode contracts** (1 re-throw on the result-wrapping catch).
- **#10444 — Size-ascending chip-pick** (1440 LOC pick as the final Track 4 chip; the LOC counter-example confirms v872's forward-observation about spawn-site count being the primary predictor).

## Cross-references to related disciplines

- Architecture-retrofit patterns: Lesson #10414 (parent ctx? pattern), #10433 (shared-helper hoist variants — Track 4 exercised 5 distinct variants), #10444 (size-ascending chip-pick — spawn-site count refinement promotion-eligible).
- KNOWN_UNWIRED ledger discipline: Lesson #10432 (parent ratchet ledger now empty for ProcessContext), #10443 (inverse-audit — automatic via pre-tag-gate step 18 across the campaign).
- Failure-mode contracts: Lesson #10427 (24 total re-throws applied across Track 4 — codification-eligible).

## Forward path

**Track 4 CLOSED.** Next ship: **v1.49.876** — First Egress chip (Track 5 open): `src/aminet/package-fetcher.ts` (177 LOC).

Remaining v868-v882 campaign:
- v1.49.876-881 — Egress chips ×6 (Track 5).
- v1.49.882 — Verify-overdue forecast scan tool.

Egress KNOWN_UNWIRED still at 6 entries. Same size-ascending discipline; Track 5 expected to exercise different wire-shape variants (Egress uses fetch() rather than exec/spawn).
