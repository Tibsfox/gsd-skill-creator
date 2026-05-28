# v1.49.863 — Lessons

## Tentative observations (below promotion threshold)

(No new candidates this ship — Track 3's first chip uses the established hoist-at-top wire variant.)

## Forward-test of existing lessons

### #10427 — Failure-mode contracts

**Status:** APPLIED. Hoisted ensureEgressAllowed OUTSIDE the try/catch. EgressContextDenied propagates; connection-refused / timeout / status-error continue to return structured HealthCheckResult silently.

### #10416 — Lightest wire

**Status:** APPLIED. Single fetch() call site → single hoisted check + single ctx? param. Smallest possible chip surface.

### #10443 — Inverse-audit stale-entry detection (codified v857)

**Status:** APPLIED (6th consecutive chip ship). Tool runs clean post-wire. PAST promotion threshold for codification of continuous-verification mode.

### #10432 — KNOWN_UNWIRED as migration-debt ledger

**Status:** APPLIED. Egress KNOWN_UNWIRED 11 → 10. First Egress chip since v811.

## No promotions this ship

Eligible backlog: 0. (Cross-audit continuous-verification mode flagged for next codify ship — at 6 instances, past threshold.)
