# v1.49.863 — EgressContext singleton chip: `src/terminal/health.ts`

**Released:** 2026-05-28

## Why this ship

First chip of Track 3 (Egress singleton chips); opens the Egress cluster following the Track 2 close at v862. 73 LOC file with single fetch() call site — smallest remaining Egress KNOWN_UNWIRED entry. Picked first per size-ascending heuristic from Track 2.

## The wire

```ts
export async function checkHealth(url, timeoutMs?, ctx?: EgressContext): Promise<HealthCheckResult> {
  ensureEgressAllowed(ctx, 'terminal/health', 'fetch', url);
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    // ...
  } catch (err) {
    // structured failure result
  }
}
```

Hoist-at-top variant. First Egress chip since v811; structurally identical to v853 git-collector but with fetch instead of execFileAsync.

## Surface delta

- 3 files modified
- +10 source LOC + 40 test LOC
- 0 new test files (2 new cases in `EgressContext wire (v1.49.863)` describe block)
- KNOWN_UNWIRED Egress: 11 → 10

## Engine state

NASA degree at **1.178** (UNCHANGED — 81 consecutive ships at 1.178).

## Stale-audit (v857 tool, 6th application)

`node tools/security/check-stale-known-unwired.mjs` — clean (Process 6, Egress 10, 0 stale).
