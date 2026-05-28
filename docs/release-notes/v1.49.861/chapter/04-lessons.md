# v1.49.861 — Lessons

## Tentative observations (below promotion threshold)

(No new candidates this ship — mechanical chip transfer.)

## Forward-test of existing lessons

### #10427 — Failure-mode contracts

**Status:** APPLIED. The scoping asymmetry of the child.on('error') handler (post-spawn errors only, not security denials) is the structural reason #10442 re-throw isn't needed here. Hoisted check fires BEFORE spawn; post-spawn errors are a different failure mode.

### #10433 — Internal-helper pattern

**Status:** APPLIED. shellOut is the internal helper; ctx? threaded through it + the keystoreCommand entry point. Single chokepoint at shellOut's hoisted check.

### #10443 — Inverse-audit stale-entry detection (codified v857)

**Status:** APPLIED (4th consecutive chip ship). Tool runs clean post-wire.

### #10432 — KNOWN_UNWIRED as migration-debt ledger

**Status:** APPLIED. Process KNOWN_UNWIRED 8 → 7.

## No promotions this ship

Eligible backlog: 0.
