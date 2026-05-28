# v1.49.865 — EgressContext singleton chip: `src/aminet/index-freshness.ts`

**Released:** 2026-05-28

## Why this ship

Third chip of Track 3. 161 LOC file with single fetch() to Aminet RECENT mirror. Strict-fail surface — clean wire path.

## The wire

```ts
export async function fetchRecent(
  config: AminetMirrorConfig,
  ctx?: EgressContext,
): Promise<AminetPackage[]> {
  const url = `${config.mirrors[0]}/aminet/RECENT`;
  ensureEgressAllowed(ctx, 'aminet/index-freshness', 'fetch', url);
  // ...fetch with AbortController...
}
```

## Surface delta

- 3 files modified
- +8 source LOC + 25 test LOC
- KNOWN_UNWIRED Egress: 9 → 8

## Engine state

NASA degree at **1.178** (UNCHANGED — 83 consecutive ships at 1.178).

## Stale-audit (v857 tool, 8th application)

clean (Process 6, Egress 8, 0 stale).
