# v1.49.866 — EgressContext singleton chip: `src/site/deploy.ts`

**Released:** 2026-05-28

## Why this ship

Fourth chip of Track 3. 193 LOC file with single fetch() inside a DI-overridable fetch wrapper. First Egress application of the DI-executor pattern (#10441 analog for fetch).

## The wire

```ts
verifyDeployment(siteUrl, fetchFn?, ctx?: EgressContext): VerificationResult
  → doFetch = fetchFn ?? ((url) => defaultFetch(url, ctx))
  → defaultFetch(url, ctx) calls ensureEgressAllowed BEFORE fetch
```

Injected fetchFn bypasses the check (caller owns security). Default path wires through.

## Surface delta

- 3 files modified
- +12 source LOC + 35 test LOC
- KNOWN_UNWIRED Egress: 8 → 7

## Engine state

NASA degree at **1.178** (UNCHANGED — 84 consecutive ships at 1.178).

## Stale-audit (v857 tool, 9th application)

clean (Process 6, Egress 7, 0 stale).
