# v1.49.866 — Lessons

## Tentative observations (below promotion threshold)

### DI-fetch-wrapper as Egress analog of #10441

**Instances: 1 (v866)**

**Observation:** The Process-side DI-executor + tokenized-argv pattern (#10441, codified v847) has an Egress-side analog: a function accepts an injected fetch override + a security ctx; the default fetch wrapper closes over the ctx and calls `ensureEgressAllowed` before fetching. Injected wrappers bypass the check (caller owns security boundary).

```ts
function verifyDeployment(siteUrl, fetchFn?, ctx?: EgressContext) {
  const doFetch = fetchFn ?? ((url) => defaultFetch(url, ctx));
}

async function defaultFetch(url, ctx?: EgressContext) {
  ensureEgressAllowed(ctx, source, 'fetch', url);
  return await fetch(url);
}
```

**Why below threshold:** First instance. The shape is structurally identical to #10441 but lives on the fetch surface.

**Promotion gate:** 2nd instance. Likely classification: sub-pattern of #10441 (cross-surface refinement to Egress). The promotion would extend the Security chokepoints discipline doc to note that the DI pattern generalizes across both Process and Egress chokepoints.

## Forward-test of existing lessons

### #10427 — Failure-mode contracts

**Status:** APPLIED. Default-path denial propagates; injected fetchFn callers own their security boundary.

### #10441 — DI-executor + tokenized-argv (cross-surface candidate)

**Status:** APPLIED ANALOG. The fetch-side shape parallels the Process-side; v866 is the first Egress instance.

### #10443 — Inverse-audit stale-entry detection

**Status:** APPLIED (9th consecutive chip ship).

### #10432 — KNOWN_UNWIRED as migration-debt ledger

**Status:** APPLIED. Egress KNOWN_UNWIRED 8 → 7.

## No promotions this ship

Eligible backlog: 0.
