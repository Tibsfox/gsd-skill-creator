# v1.49.864 — EgressContext singleton chip: `src/alternative-discoverer/equivalent-searcher.ts`

**Released:** 2026-05-28

## Why this ship

Second chip of Track 3. 108 LOC file with single fetch() to npm registry search API. Picked per size-ascending heuristic (after v863's 73 LOC chip).

## The wire

```ts
export async function searchEquivalents(
  dep, registryMeta, ctx?: EgressContext,
): Promise<AlternativeReport[]> {
  if (dep.ecosystem !== 'npm') return [];  // bypass for non-npm
  const url = `${NPM_SEARCH_URL}?text=...`;
  ensureEgressAllowed(ctx, 'alternative-discoverer/equivalent-searcher', 'fetch', url);
  try { const res = await fetch(url, ...); ... }
  catch { return []; }
}
```

Hoist-at-top with early-return bypass — the non-npm path doesn't trip the audit sink. Class wrapper threads ctx through to the function.

## Surface delta

- 3 files modified
- +12 source LOC + 35 test LOC
- KNOWN_UNWIRED Egress: 10 → 9

## Engine state

NASA degree at **1.178** (UNCHANGED — 82 consecutive ships at 1.178).

## Stale-audit (v857 tool, 7th application)

`node tools/security/check-stale-known-unwired.mjs` — clean (Process 6, Egress 9, 0 stale).
