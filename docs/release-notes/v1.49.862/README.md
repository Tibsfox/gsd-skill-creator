> Following v1.49.861 — _ProcessContext singleton chip: `src/cli/commands/keystore.ts`_, v1.49.862 is the **fifth and final chip of Track 2** in the v857-v867 follow-on campaign. Wires `src/scan-arxiv/ranker.ts` (CLI judge for arxiv-paper ranking) through the ProcessContext chokepoint. Threads `ctx?` through RankerOptions → buildDefaultJudge → buildCliJudge → JudgeFn closure; ensureProcessAllowed hoisted inside the JudgeFn closure BEFORE the Promise constructor. **KNOWN_UNWIRED Process count: 7 → 6.** Cross-audit tool reports clean (5th consecutive application). Track 2 closes; Track 3 (Egress chips) opens at v863.

# v1.49.862 — ProcessContext singleton chip: `src/scan-arxiv/ranker.ts`

**Shipped:** 2026-05-28

Fifth chip of Track 2 — closes the Process singleton-chip cluster (target was ~5 chips; achieved exactly 5). The ranker's CLI judge backend spawns `claude` CLI for paper relevance scoring when no ANTHROPIC_API_KEY is set. Wire threads `ctx?` through 3 layers (RankerOptions → buildDefaultJudge → buildCliJudge) so the JudgeFn closure captures it for use BEFORE the spawn.

## What shipped

- **MODIFIED** `src/scan-arxiv/ranker.ts`:
  - Imports `ensureProcessAllowed` + `ProcessContext`.
  - `buildCliJudge(model, maxBudgetUsd, ctx?)` accepts optional `ctx`; the returned JudgeFn closure captures it and calls `ensureProcessAllowed(ctx, 'scan-arxiv/ranker', 'spawn', 'claude', args)` BEFORE the `new Promise(...)` that wraps `spawn('claude', args)`.
  - `buildDefaultJudge(..., ctx?)` threads ctx to `buildCliJudge`.
  - `RankerOptions.ctx?: ProcessContext` field added; `createRanker` destructures it from opts and passes to `buildDefaultJudge`.
- **MODIFIED** `src/security/process-context-audit.test.ts` — removed `'src/scan-arxiv/ranker.ts'` from `KNOWN_UNWIRED` + inline comment documenting the v1.49.862 closure-capture wire shape.
- **MODIFIED** `src/scan-arxiv/ranker.test.ts` — new `describe('buildCliJudge — ProcessContext wire (v1.49.862)')` block with 2 test cases (deny + argv exposure).

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| `src/scan-arxiv/ranker.test.ts` | +2 | 15 → 17 total |
| `src/security/process-context-audit.test.ts` | (no count change) | 2051 audit-test cases pass |
| `tools/security/check-stale-known-unwired.mjs` | clean | Process 6 + Egress 11; 0 stale |

## Engine state

NASA degree at **1.178** (UNCHANGED — **80 consecutive ships at 1.178**, new widest pressure margin record).
Counter-cadence count UNCHANGED at 6.
Manifest entries: **23** / Lessons: **84** / UNCODIFIED: **39 ≤ 41**.
**KNOWN_UNWIRED Process: 7 → 6.** Egress: **11** (UNCHANGED).
Operational axes: **4** (UNCHANGED).

## Wire shape (per Lesson #10427)

Closure-capture variant. The factory function (`buildCliJudge`) accepts `ctx?`, and the returned JudgeFn closure captures it via lexical scope; the hoisted check runs each time the JudgeFn is invoked.

```ts
export function buildCliJudge(
  model: string,
  maxBudgetUsd: number,
  ctx?: ProcessContext,
): JudgeFn {
  return async (paper: ArxivPaper) => {
    const args = [...];
    ensureProcessAllowed(ctx, 'scan-arxiv/ranker', 'spawn', 'claude', args);
    const { stdout, ... } = await new Promise<...>((resolve, reject) => {
      const child = spawn('claude', args, { ... });
      // ...
    });
    // ...
  };
}
```

The ctx is captured ONCE at factory time and used N times (one per JudgeFn invocation). This is the right shape for factory-built JudgeFns where ctx must be available at each spawn but the factory is called once per ranker construction.

## Track 2 closure summary (v858-v862, 5 chips)

| Ship | File | Wire shape | KNOWN_UNWIRED Process |
|---|---|---|---|
| v858 | `src/drift/cli.ts` | Hoist-at-top spawnSync | 11 → 10 |
| v859 | `src/chipset/blitter/executor.ts` | Hoist-outside-Promise + temp-dir cleanup on denial | 10 → 9 |
| v860 | `src/intelligence/provenance/linker.ts` | Internal-helper (#10433) — git() wraps 4 spawn sites | 9 → 8 |
| v861 | `src/cli/commands/keystore.ts` | Hoist-outside-Promise (no temp-dir setup) | 8 → 7 |
| v862 | `src/scan-arxiv/ranker.ts` | Closure-capture (factory built JudgeFn) | 7 → 6 |

**Net 5-chip Track 2 batch: KNOWN_UNWIRED Process 11 → 6** (-5 entries, -45% of the entering KNOWN_UNWIRED Process list). Pattern coverage: hoist-at-top × 1, hoist-outside-Promise × 2, internal-helper × 1, closure-capture × 1.

## Surface delta

- 3 files modified
- +18 source LOC (3 LOC imports; 1 param × 3 entry points; 1 LOC ensureProcessAllowed; pass-throughs at call sites; 7 LOC in audit-test comment)
- +50 test LOC (2 new test cases)
- 0 new dependencies
- 0 manifest changes
