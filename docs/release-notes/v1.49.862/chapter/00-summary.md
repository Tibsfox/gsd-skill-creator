# v1.49.862 — ProcessContext singleton chip: `src/scan-arxiv/ranker.ts`

**Released:** 2026-05-28

## Why this ship

Fifth and final chip of Track 2. Closes the Process singleton-chip cluster (target ~5; achieved exactly 5). 560 LOC file with 1 spawn() call site inside a factory-built JudgeFn closure. Introduces the **closure-capture variant** (5th distinct wire shape across the v858-v862 batch).

## The wire

```ts
export function buildCliJudge(
  model: string,
  maxBudgetUsd: number,
  ctx?: ProcessContext,
): JudgeFn {
  return async (paper) => {
    const args = [...];
    ensureProcessAllowed(ctx, 'scan-arxiv/ranker', 'spawn', 'claude', args);
    return await new Promise(...);
  };
}
```

Closure-capture variant. ctx captured at factory time; the check runs each JudgeFn invocation.

## Track 2 closes — 5 chips, 5 wire shapes

| Ship | File | Wire shape |
|---|---|---|
| v858 | drift/cli.ts | Hoist-at-top spawnSync |
| v859 | chipset/blitter/executor.ts | Hoist-outside-Promise + cleanup-on-denial |
| v860 | intelligence/provenance/linker.ts | Internal-helper (#10433) |
| v861 | cli/commands/keystore.ts | Hoist-outside-Promise |
| v862 | scan-arxiv/ranker.ts | Closure-capture |

KNOWN_UNWIRED Process 11 → 6 (-5, -45%). Track 3 (Egress chips) opens at v863.

## Surface delta

- 3 files modified
- +18 source LOC + 50 test LOC
- 0 new test files (2 new cases in `buildCliJudge — ProcessContext wire (v1.49.862)` describe block)
- KNOWN_UNWIRED Process: 7 → 6

## Engine state

NASA degree at **1.178** (UNCHANGED — 80 consecutive ships at 1.178).

## Stale-audit (v857 tool, 5th application — at promotion threshold)

`node tools/security/check-stale-known-unwired.mjs` — clean (Process 6, Egress 11, 0 stale).

5 consecutive clean applications across v858-v862. Promotion-eligible per the typical 5-instance threshold for "discipline-as-code in steady operational use." Worth flagging at next codify ship as a refinement of #10443 (the tool's continuous-verification mode is the load-bearing operational pattern).
