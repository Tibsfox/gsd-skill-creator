# v1.49.853 — Lessons

## Tentative observations (below promotion threshold)

### DI-executor + tokenized-argv variant not exercised in chip campaign

**Instances: 1 (v853)**

**Observation:** The v849-v853 5-chip batch exercised 3 wire variants (hoist-at-top × 3, hoist-inside-branch × 1, stale-import-cleanup × 1) but did NOT exercise the DI-executor + tokenized-argv shape codified at v847 as #10441. That shape already exists in `mesh-worktree.ts` + `repo-manager.ts` + `proxy-committer.ts` from earlier ships, but was not the right fit for any of the 5 singleton candidates this campaign picked.

The remaining 11 KNOWN_UNWIRED Process entries skew toward more complex shapes:
- `learning/version-manager.ts`: 5-caller swallow chain → DI-executor + tokenized-argv likely best fit
- `learn/acquirer.ts`: multi-call multi-tool → likely needs DI-executor
- `intelligence/provenance/linker.ts`: spawnSync with deliberate doc-comment → hoisted check at single call site
- `keystore.ts` + `pic2html.ts`: CLI surfaces with #10442 re-throw considerations

**Why below threshold:** First instance of "campaign-batch exercised a subset of codified wire variants." May not recur if future chip ships pick across variants more evenly.

**Promotion gate:** 2nd instance of campaign-shape vs codified-variant coverage gap.

**Likely classification:** Sub-pattern of #10434 (KNOWN_UNWIRED ledger-as-debt) — possibly a note that chip-campaign planning should consider variant-coverage when picking singletons, not just LOC/simplicity.

## Carried-forward codification-ready: stale-entry inverse-audit tool

REINFORCED in spirit at v853 (campaign close adds informational context for the next codify ship). The 2-instance threshold remains met from v834 + v852; v853 doesn't add a new stale-entry instance but does demonstrate that the 5-chip batch maintained both the wired-entry and import-without-use shape distinctions cleanly. Promote in next codify ship.

## No promotions this ship

Eligible backlog: 1 (carried forward from v852, awaiting next codify ship).
