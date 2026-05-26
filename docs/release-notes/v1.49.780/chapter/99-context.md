# v1.49.780 — Context

## What this ship is

v1.49.780 is the first ship in the new "Tier E architecture forward-cadence" series, kicking off after the v1.49.777-779 counter-cadence wave drained the BLOCKER + HIGH queue across Tiers A/B/C/D from the v1.49.777 full-codebase risk-tier sweep.

The REVIEW ledger at `.planning/REVIEW-2026-05-26-FULL-CODEBASE.md` enumerates three Tier E (architecture / structural-debt) HIGHs:

1. **`src/cli.ts` dispatcher extraction** (this ship)
2. Store/Registry/Manager dedup pairs + MemoryStore adapter for the 7 memory backends
3. LoaderContext security chokepoint for 14 scattered disk loaders

Each is intended to ship as its own dedicated forward-cadence pass.

## Predecessor context

- **v1.49.777** (counter-cadence #3) closed 4 BLOCKERs (2 security + 2 correctness) from the full-codebase risk-tier sweep.
- **v1.49.778** (counter-cadence #4) closed 4 security HIGHs + 6 correctness HIGHs (Wave 2).
- **v1.49.779** (counter-cadence #5) closed 2 perf HIGHs + 3 test-quality HIGHs (Wave 3).

All Tier A/B/C/D BLOCKERs + HIGHs now CLOSED. v1.49.780 is the first NON-counter-cadence ship after this three-wave arc.

## Engine state

- NASA degree: 1.177 (UNCHANGED across v777-780)
- MUS / ELC / SPS / TRS: SCAFFOLD-PENDING obs#60+ (UNCHANGED)
- INTERSTELLAR-BOUNDARY axis: obs#1 first INSTANCE (UNCHANGED)
- Counter-cadence cadence: still 5 instances (v585, v776, v777, v778, v779). v780 is forward-cadence, does NOT increment this count.

## Branch state

- `dev` and `main` both at the v780 ship commit
- Zero-commit drift dev ↔ main
- GitHub release published at https://github.com/Tibsfox/gsd-skill-creator/releases/tag/v1.49.780
- `docs/RELEASE-HISTORY.md` regenerated to include v1.49.780 entry

## REVIEW ledger updates

Marked Tier E HIGH #1 as CLOSED at v1.49.780. Added v1.49.780 lineage entry as the first forward-cadence Tier E architecture pass.

## What's next

Two paths viable for v1.49.781+:

- **Path A continuation:** Tier E HIGH #2 (Store/Registry/Manager dedup + MemoryStore adapter) as v1.49.781. Cross-cutting; touches ~10 files.
- **Path A continuation:** Tier E HIGH #3 (LoaderContext security chokepoint) as v1.49.781. Bridges Tier A + Tier E; touches 14 disk-loader files and security-hygiene skill.
- **Path B:** Return to forward-cadence NASA 1.178. INTERSTELLAR-BOUNDARY axis obs#2 candidates (unchanged from v777-779 handoffs).
- **Path C:** Periodic risk-tier re-sweep at v1.49.789+. Refreshes REVIEW ledger; surfaces MEDIUMs + LOWs by current line number.
