# v1.49.858 — Lessons

## Tentative observations (below promotion threshold)

### Cross-audit tool in continuous-verification mode

**Instances: 1 (v858)**

**Observation:** The v857 codify ship introduced `tools/security/check-stale-known-unwired.mjs` as both a codification deliverable AND a per-chip post-edit verification tool. v858 is the first chip ship to actually invoke the tool post-edit; the tool runs in <100 ms and reports clean. This adds ~1 sec per chip ship to the wall-clock — sub-noise, but it's the operational manifestation of the v857 codification.

**Why below threshold:** First instance of "discipline codified at v857 actually applied in subsequent ship." The pattern is that codification feeds-forward into operational discipline; v857→v858 is the first feed-forward instance. Wait for ~3 more chip ships (v859-v862) to confirm the per-chip-verify cadence holds.

**Promotion gate:** 3-4th instance of the tool running clean across the Track 2 + Track 3 chip campaign. Likely classification — sub-pattern of #10427 (failure-mode contracts; the tool ENFORCES the silent-vs-loud contract for the stale-entry case).

## Carried-forward codification-ready: 0

The v857 codify ship cleared the eligible backlog. Below-threshold observations from v852-v857 carry forward.

## No promotions this ship

Eligible backlog: 0.

## Forward-test of existing lessons

### #10421 — Static-analysis tool authoring

**Status:** APPLIED. The v857 tool was invoked post-chip via `node tools/security/check-stale-known-unwired.mjs` (no `--json` flag in continuous-verification mode; human-readable output is the operator-friendly default).

### #10427 — Failure-mode contracts

**Status:** APPLIED. The `ensureProcessAllowed` hoisted check OUTSIDE the spawnSync. drift/cli.ts has no swallowing catch around the spawn — ProcessContextDenied propagates naturally, no #10442 re-throw needed.

### #10432 — KNOWN_UNWIRED as migration-debt ledger

**Status:** APPLIED. Per-ship release notes record `Process KNOWN_UNWIRED 11 → 10`. One entry removed.

### #10443 — Inverse-audit stale-entry detection (codified v857)

**Status:** FIRST APPLIED. The cross-audit tool's first run against an actual chip ship's output — clean. The discipline is operational.
