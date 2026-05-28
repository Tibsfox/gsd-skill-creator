> Following v1.49.865 — _EgressContext singleton chip: `src/aminet/index-freshness.ts`_, v1.49.866 is the **fourth chip of Track 3**. Wires `src/site/deploy.ts` (deployment verifier) through the EgressContext chokepoint via the DI-fetch-wrapper pattern: the ctx is captured by the default-fetch wrapper while injected FetchFn overrides bypass the check. **KNOWN_UNWIRED Egress count: 8 → 7.**

# v1.49.866 — EgressContext singleton chip: `src/site/deploy.ts`

**Shipped:** 2026-05-28

Fourth chip of Track 3. `verifyDeployment(siteUrl, fetchFn?)` accepts an injected FetchFn for testing; the default fetch wrapper (`defaultFetch`) is what wires through the chokepoint. Wire shape: ctx captured by a closure-bound default-fetch wrapper; injected fetchFn callers bypass the check (caller owns their own security boundary).

## What shipped

- **MODIFIED** `src/site/deploy.ts`:
  - Imports `ensureEgressAllowed` + `EgressContext`.
  - `verifyDeployment(siteUrl, fetchFn?, ctx?)` accepts optional `ctx`; default-fetch closure-binds the ctx via arrow.
  - `defaultFetch(url, ctx?)` calls `ensureEgressAllowed(ctx, 'site/deploy', 'fetch', url)` BEFORE the fetch.
- **MODIFIED** `src/security/egress-context-audit.test.ts` — removed entry + v866 wire-shape comment.
- **MODIFIED** `tests/site/deploy.test.ts` — new `describe('EgressContext wire (v1.49.866)')` block with 2 test cases (default-path denial + injected-fetchFn bypass).

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| `tests/site/deploy.test.ts` | +2 | 6 → 8 total |
| `src/security/egress-context-audit.test.ts` | (no count change) | 2052 audit-test cases pass |
| `tools/security/check-stale-known-unwired.mjs` | clean | Process 6 + Egress 7; 0 stale |

## Engine state

NASA degree at **1.178** (UNCHANGED — **84 consecutive ships at 1.178**, new widest pressure margin record).
KNOWN_UNWIRED Process: **6** (UNCHANGED). **Egress: 8 → 7.**

## Wire shape (per Lesson #10427)

DI-fetch-wrapper variant. The injected FetchFn pattern is preserved: callers can override the fetch entirely (and own their own security boundary). The default-fetch path now wires through the chokepoint. The closure binding `((url) => defaultFetch(url, ctx))` carries the ctx into the default wrapper.

```ts
export async function verifyDeployment(
  siteUrl: string,
  fetchFn?: FetchFn,
  ctx?: EgressContext,
): Promise<VerificationResult> {
  const doFetch = fetchFn ?? ((url: string) => defaultFetch(url, ctx));
  // ...uses doFetch
}

async function defaultFetch(url: string, ctx?: EgressContext) {
  ensureEgressAllowed(ctx, 'site/deploy', 'fetch', url);
  const res = await fetch(url);
  return { ok: res.ok, status: res.status };
}
```

This is the **fetch-side analog of the DI-executor pattern (#10441)** — first Egress application. Wire test verifies both the default-path denial AND the injected-fetchFn bypass (caller-owned-security contract).

## Surface delta

- 3 files modified
- +12 source LOC + 35 test LOC
- KNOWN_UNWIRED Egress: 8 → 7
