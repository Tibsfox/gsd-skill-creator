> Following v1.49.817 — _T2.3 Wedge Close: c12-load-kb-context Flake (retry-bump + structural-cause documentation)_, v1.49.818 closes the third item in the v816-822 chain. Extracts the FlagLookup discriminated union + getFlagValue parser from 4 identical CLI command call sites (koopman-check, coherent-check, hourglass-check, bounded-learning) into a single shared module at `src/cli/lib/flag-lookup.ts`. Second-instance registry extraction per #10426 (here at 4th instance — well past the threshold).

# v1.49.818 — T2.3 Wedge Close: FlagLookup Discriminated Union Extract

**Shipped:** 2026-05-27

Third ship of the v816-822 chain (item #3 of 7). Closes the last audit-retro-surfaced T2.3 candidate (FlagLookup extract, deferred at v796; 30+ ships ago). After this ship the recon-surfaced T2.3 backlog is empty.

The pattern: 4 CLI command modules independently re-declared the same 9-LOC chunk (3-line type + 6-line function). Each call site uses `getFlagValue` identically. Per #10426, registry/abstraction extraction triggers at the 2nd-3rd instance; this case is the 4th instance, well past the threshold.

## What shipped

- **NEW** `src/cli/lib/flag-lookup.ts` — 14-line module exporting `type FlagLookup` (discriminated union of `{ present: false }` | `{ present: true; value: string | null }`) + `function getFlagValue(args, flag): FlagLookup`. Inline docstring documents the three return-shape cases (absent / present-with-value / trailing-with-null) so callers can dispatch via the discriminated union.
- **NEW** `src/cli/lib/flag-lookup.test.ts` — 7 focused unit tests covering: flag absent / flag present with value / trailing flag (null value) / empty-string value / multiple-occurrence (first wins) / flag-after-flag / empty args list.
- **MODIFIED** `src/cli/commands/koopman-check.ts` — remove inline 9-LOC FlagLookup+getFlagValue block; add `import { getFlagValue } from '../lib/flag-lookup.js';`.
- **MODIFIED** `src/cli/commands/coherent-check.ts` — same migration.
- **MODIFIED** `src/cli/commands/hourglass-check.ts` — same migration.
- **MODIFIED** `src/cli/commands/bounded-learning.ts` — same migration.
- **MODIFIED** `.planning/PROJECT.md` — pre-bump refresh of `Latest shipped release` from v816 to v817.

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| `flag-lookup.test.ts` (NEW) | +7 | covers all 7 return-shape branches of getFlagValue |
| Migrated 4 CLI commands | +0 | unchanged; integration via existing tests |
| **Total added** | **+7** | tools-suite + cli-suite unchanged otherwise |

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — 36 consecutive ships at 1.178). Counter-cadence count UNCHANGED at 6.

Manifest entries: **22 → 22** (UNCHANGED — registry extraction is not a new discipline; it's an APPLICATION of #10426).
Open lesson candidate backlog: **0** (UNCHANGED).
Tentative observations carried forward: ~10-12 → ~10-12.

## Audit-retrospective wedge ledger

| Wedge | Status at v817 | Status at v818 |
|---|---|---|
| HIGH-01 PMTiles refcounted close | CLOSED v815 | unchanged |
| c12-load-kb-context flake | CLOSED v817 | unchanged |
| FlagLookup discriminated union extract | OPEN (30+ ships from v796) | **CLOSED v818** (4-call-site → 1-module extract) |
| Math-foundations integration tests | CLOSED (already) | unchanged |
| L-06 Research-CSV schema-stability | DEFERRED | unchanged |
| v671 Gate 2 | CLOSED v676 cc1 | unchanged |
| v671 Gate 3 | DEFERRED | unchanged |
| SCRIBE CAP-024/046/047/041 | OPEN forward-looking | unchanged |

T2.3 recon-surfaced backlog: **EMPTY** post-v818. Future T2.3 closures will use new wedges as they accumulate per #10415.

## What this ship is not

- Not a NASA degree advance.
- Not a chokepoint chip.
- Not a behavior change for any CLI command (extraction is byte-equivalent at runtime).
- Not a closure of all "duplicate code" patterns — only this specific 9-LOC pattern across 4 sites.

## Forward path

v819 (next in chain) = aminet family ProcessContext batch chip (5 files; brings process `KNOWN_UNWIRED` 37 → 32). Then v820 git/core ProcessContext chip + v821-822 discipline-coverage gate flip + v823 ObservationBridge wire.
