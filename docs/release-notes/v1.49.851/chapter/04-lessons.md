# v1.49.851 — Lessons

## No new tentative observations this ship

The chip pattern has stabilized at v849-v851. v851's ~13 min wall-clock matches v850's ~12 min — fast enough that the v850 "scaffolding script" observation is plateauing in value rather than accruing toward promotion threshold.

## No promotions this ship

Eligible backlog remains 0 (cleared at v847).

## Carried-forward observations REINFORCED (not promoted)

- **Chip-release-notes scaffolding script** (v850, 1 instance) — v851's ~13 min cost is in the same range as v850's ~12 min. Could arguably be considered a 2nd-instance confirmation of the "release-notes prose is the chip-ship bottleneck" observation. However, the ~13 min cost is fast enough that scaffolding would save only marginal time per chip. The observation REINFORCED but NOT PROMOTED — the load-bearingness threshold is "would saving this time meaningfully change the ship cadence?" and at 13 min/chip the answer is "no."

## Wire-shape pattern coverage so far

Across v849-v851, the three chip ships covered:
- **v849** `changelog-watch`: hoist-at-top, single-call-site, no DI-override (CLI version-check)
- **v850** `extension-detector`: hoist-inside-branch, DI-override early-return (CLI version-check inside two-strategy probe)
- **v851** `version-backfill`: hoist-at-top, single-call-site, no DI-override (git log query)

Two more chip ships planned (v852, v853). The remaining KNOWN_UNWIRED singletons likely include both the hoist-at-top and hoist-inside-branch shapes; cataloging both makes the pattern coverage exhaustive across the planned 5-chip batch.
