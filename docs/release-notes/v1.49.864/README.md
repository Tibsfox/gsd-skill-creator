> Following v1.49.863 — _EgressContext singleton chip: `src/terminal/health.ts`_, v1.49.864 is the **second chip of Track 3**. Wires `src/alternative-discoverer/equivalent-searcher.ts` (npm registry search for functional equivalents) through the EgressContext chokepoint. Hoist-at-top fetch variant with non-npm-ecosystem early-return bypass. **KNOWN_UNWIRED Egress count: 10 → 9.**

# v1.49.864 — EgressContext singleton chip: `src/alternative-discoverer/equivalent-searcher.ts`

**Shipped:** 2026-05-28

Second chip of Track 3. `searchEquivalents` queries the npm registry search API for functional-equivalent packages; fault-tolerant accessory that returns [] on any non-OK response, JSON parse failure, or network error. Wire threads `ctx?: EgressContext` through `searchEquivalents` + `EquivalentSearcher.search`; `ensureEgressAllowed` hoisted OUTSIDE the try/catch.

The early-return for non-npm ecosystems (`if (dep.ecosystem !== 'npm') return []`) sits BEFORE the hoisted check, so the audit-sink does NOT receive a record for cargo/pypi/conda/rubygems deps — only npm-targeted fetches are auditable. This is the right scope: only the npm fetch happens.

## What shipped

- **MODIFIED** `src/alternative-discoverer/equivalent-searcher.ts`:
  - Imports `ensureEgressAllowed` + `EgressContext`.
  - `searchEquivalents(dep, registryMeta, ctx?)` accepts optional `ctx`; `ensureEgressAllowed` hoisted before the try block AFTER the non-npm early-return.
  - `EquivalentSearcher.search(dep, meta, ctx?)` threads ctx to `searchEquivalents`.
- **MODIFIED** `src/security/egress-context-audit.test.ts` — removed entry from `KNOWN_UNWIRED` + v864 wire-shape comment.
- **MODIFIED** `src/alternative-discoverer/equivalent-searcher.test.ts` — new `describe('EgressContext wire (v1.49.864)')` block with 2 test cases (deny on npm dep + bypass for non-npm dep).

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| `src/alternative-discoverer/equivalent-searcher.test.ts` | +2 | 12 → 14 total |
| `src/security/egress-context-audit.test.ts` | (no count change) | 2052 audit-test cases pass |
| `tools/security/check-stale-known-unwired.mjs` | clean | Process 6 + Egress 9; 0 stale |

## Engine state

NASA degree at **1.178** (UNCHANGED — **82 consecutive ships at 1.178**, new widest pressure margin record).
Counter-cadence count UNCHANGED at 6.
Manifest entries: **23** / Lessons: **84** / UNCODIFIED: **39 ≤ 41**.
KNOWN_UNWIRED Process: **6** (UNCHANGED). **Egress: 10 → 9.**
Operational axes: **4** (UNCHANGED).

## Wire shape (per Lesson #10427)

Hoist-at-top with early-return bypass. The non-npm early-return sits BEFORE the hoisted check; this is correct because only npm reaches the fetch.

## Surface delta

- 3 files modified
- +12 source LOC + 35 test LOC
- 0 new test files (2 new cases in EgressContext wire describe block)
- 0 new dependencies
- 0 manifest changes
- KNOWN_UNWIRED Egress: 10 → 9
