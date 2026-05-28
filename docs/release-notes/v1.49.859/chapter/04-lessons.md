# v1.49.859 — Lessons

## Tentative observations (below promotion threshold)

### Pre-allocated-resource cleanup on security denial

**Instances: 1 (v859)**

**Observation:** When a wire's setup phase allocates resources BEFORE the spawn (mkdtemp + writeFile in v859's case), the hoisted `ensureProcessAllowed` check must catch the denial + clean up the pre-allocated resource + re-throw. Naive hoist-at-top without cleanup leaks the resource (orphaned temp dir on denial). The pattern:

```ts
// ...setup allocates resources
try {
  ensureProcessAllowed(ctx, source, op, target, argv);
} catch (denial) {
  await cleanup();
  throw denial;
}
// ...spawn proceeds, cleanup happens on success too
```

**Why below threshold:** First instance of cleanup-on-security-denial pattern. Most prior chips had no setup-phase resource allocation (drift/cli.ts: just computes argv; git-collector: stateless; changelog-watch: stateless).

**Promotion gate:** 2nd instance. Sub-pattern of #10427 (load-bearing-fails-loudly contract); the cleanup ensures the denial is loud AND clean.

## Forward-test of existing lessons

### #10427 — Failure-mode contracts

**Status:** APPLIED + REFINED. The denial-then-cleanup-then-rethrow shape preserves the load-bearing-fails-loudly contract while keeping resource hygiene.

### #10443 — Inverse-audit stale-entry detection (codified v857)

**Status:** APPLIED (2nd consecutive chip ship). Tool runs clean post-wire.

### #10432 — KNOWN_UNWIRED as migration-debt ledger

**Status:** APPLIED. Process KNOWN_UNWIRED 10 → 9.

## No promotions this ship

Eligible backlog: 0.
