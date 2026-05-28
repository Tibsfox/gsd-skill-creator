# v1.49.849 — Lessons

## Tentative observations (below promotion threshold)

### `defaultProcessContext(sink)` signature gotcha

**Instances: 1 (v849)**

**Observation:** First-time test-authoring against `defaultProcessContext` may attempt to pass an options object (`{allowList: [...]}`) instead of the actual signature, which takes a `ProcessAuditSink` directly. The internal `allowList: [/.*/]` makes `defaultProcessContext` audit-only — a permissive context for incremental rollout where audit telemetry matters but enforcement does not. Fixed on the first failing-test surface; cost ~30 seconds.

**Why below threshold:** First instance. May not recur if future ships' test-authoring pulls the test pattern from this ship's release-notes-as-template. The trip is small enough that codifying may not be load-bearing.

**Promotion gate:** 2nd instance of the same signature confusion in a future chip ship.

**Likely classification:** Documentation refinement — possibly a JSDoc note on `defaultProcessContext` itself pointing out the audit-only semantics. Below promotion threshold; revisit at 2nd instance.

## No promotions this ship

Eligible backlog remains 0 (cleared at v847). The single new observation is 1-instance and well below the 2-instance threshold for refinements of existing parent disciplines.

## No carried-over below-threshold observations matured

The 12 carried-forward 1-instance observations from v836-v848 remain at 1 instance each at v849 close (this ship's wire-shape didn't accrue new evidence for any of them).
