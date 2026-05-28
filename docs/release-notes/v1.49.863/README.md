> Following v1.49.862 — _ProcessContext singleton chip: `src/scan-arxiv/ranker.ts`_ (Track 2 close), v1.49.863 is the **first chip of Track 3** in the v857-v867 follow-on campaign — opens the Egress chip cluster. Wires `src/terminal/health.ts` (Wetty health probe) through the EgressContext chokepoint. Hoist-at-top fetch variant; KNOWN_UNWIRED Egress 11 → 10. First Egress chip cluster since v811.

# v1.49.863 — EgressContext singleton chip: `src/terminal/health.ts`

**Shipped:** 2026-05-28

First chip of Track 3 (Egress singleton chips). `checkHealth` performs an HTTP GET against the Wetty URL to determine service health; fault-tolerant accessory (returns structured HealthCheckResult on any failure). Wire threads `ctx?: EgressContext` through the function signature; `ensureEgressAllowed` hoisted OUTSIDE the try/catch so EgressContextDenied propagates while connection-refused / timeout / status-error continue to return structured results silently.

## What shipped

- **MODIFIED** `src/terminal/health.ts` — imports `ensureEgressAllowed` + `EgressContext`; `checkHealth(url, timeoutMs?, ctx?)` accepts optional `ctx` as third positional parameter; `ensureEgressAllowed(ctx, 'terminal/health', 'fetch', url)` hoisted BEFORE the try block.
- **MODIFIED** `src/security/egress-context-audit.test.ts` — removed `'src/terminal/health.ts'` from `KNOWN_UNWIRED` + inline comment documenting the v1.49.863 wire shape.
- **MODIFIED** `src/terminal/health.test.ts` — new `describe('EgressContext wire (v1.49.863)')` block with 2 test cases (deny + allow with mocked fetch).

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| `src/terminal/health.test.ts` | +2 | 12 → 14 total |
| `src/security/egress-context-audit.test.ts` | (no count change) | 2052 audit-test cases pass; file no longer in `KNOWN_UNWIRED` |
| `tools/security/check-stale-known-unwired.mjs` | clean | Process 6 + Egress 10; 0 stale |

## Engine state

NASA degree at **1.178** (UNCHANGED — **81 consecutive ships at 1.178**, new widest pressure margin record).
Counter-cadence count UNCHANGED at 6.
Manifest entries: **23** / Lessons: **84** / UNCODIFIED: **39 ≤ 41**.
KNOWN_UNWIRED Process: **6** (UNCHANGED). **Egress: 11 → 10.**
Operational axes: **4** (UNCHANGED).

## Wire shape (per Lesson #10427)

```ts
export async function checkHealth(
  url: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
  ctx?: EgressContext,
): Promise<HealthCheckResult> {
  const start = Date.now();

  // Security: hoisted check outside the try — EgressContextDenied propagates
  // while connection-refused / timeout / status-error continue to return the
  // structured forensic-accessory result silently.
  ensureEgressAllowed(ctx, 'terminal/health', 'fetch', url);

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    // ...
  } catch (err) {
    // returns structured failure result
  }
}
```

Hoist-at-top variant — mirrors the v853 git-collector pattern but for Egress (fetch instead of execFileAsync). Fault-tolerant accessory contract preserved; security denials propagate.

## Surface delta

- 3 files modified
- +10 source LOC (3 LOC imports; 1 param + 1 LOC ensureEgressAllowed + comment in checkHealth; 6 LOC in audit-test comment)
- +40 test LOC (2 new test cases with mocked fetch)
- 0 new dependencies
- 0 manifest changes
