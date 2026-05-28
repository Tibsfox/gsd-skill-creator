> Following v1.49.864 — _EgressContext singleton chip: `src/alternative-discoverer/equivalent-searcher.ts`_, v1.49.865 is the **third chip of Track 3**. Wires `src/aminet/index-freshness.ts` (Aminet RECENT fetcher) through the EgressContext chokepoint. Hoist-before-fetch variant; strict-fail surface. **KNOWN_UNWIRED Egress count: 9 → 8.**

# v1.49.865 — EgressContext singleton chip: `src/aminet/index-freshness.ts`

**Shipped:** 2026-05-28

Third chip of Track 3. `fetchRecent` downloads the Aminet RECENT file from the configured mirror. Strict-fail surface — HTTP errors throw `new Error(...)` directly. Wire threads `ctx?: EgressContext` through `fetchRecent`; `ensureEgressAllowed` hoisted BEFORE the fetch call.

## What shipped

- **MODIFIED** `src/aminet/index-freshness.ts` — imports + `fetchRecent(config, ctx?)` accepts optional `ctx`; `ensureEgressAllowed(ctx, 'aminet/index-freshness', 'fetch', url)` hoisted BEFORE the fetch.
- **MODIFIED** `src/security/egress-context-audit.test.ts` — removed entry + v865 wire-shape comment.
- **MODIFIED** `src/aminet/index-freshness.test.ts` — new `describe('fetchRecent — EgressContext wire (v1.49.865)')` block with 1 test case (deny).

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| `src/aminet/index-freshness.test.ts` | +1 | added EgressContext wire describe block |
| `src/security/egress-context-audit.test.ts` | (no count change) | 2052 audit-test cases pass |
| `tools/security/check-stale-known-unwired.mjs` | clean | Process 6 + Egress 8; 0 stale |

## Engine state

NASA degree at **1.178** (UNCHANGED — **83 consecutive ships at 1.178**, new widest pressure margin record).
Counter-cadence count UNCHANGED at 6.
Manifest entries: **23** / Lessons: **84** / UNCODIFIED: **39 ≤ 41**.
KNOWN_UNWIRED Process: **6** (UNCHANGED). **Egress: 9 → 8.**
Operational axes: **4** (UNCHANGED).

## Wire shape (per Lesson #10427)

Hoist-before-fetch variant on a strict-fail surface (HTTP errors throw). Cleaner than the fault-tolerant hoist-at-top because there's no try/catch consideration — the audit denial and the HTTP-error throw share the same propagation path.

## Surface delta

- 3 files modified
- +8 source LOC + 25 test LOC
- KNOWN_UNWIRED Egress: 9 → 8
