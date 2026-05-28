# v1.49.859 — ProcessContext singleton chip: `src/chipset/blitter/executor.ts`

**Released:** 2026-05-28

## Why this ship

Second chip of Track 2 (Process singleton chips). 220 LOC, single spawn() call site (async streaming, not exec/spawnSync). Picked after v858 to introduce the hoist-outside-Promise variant before tackling the larger DI-executor candidates.

## The wire

```ts
export async function executeOffloadOp(
  operation: OffloadOperation,
  ctx?: ProcessContext,
): Promise<OffloadResult> {
  // ...setup
  try {
    ensureProcessAllowed(ctx, 'chipset/blitter/executor', 'spawn', interpreter, [scriptPath]);
  } catch (denial) {
    await rm(scriptDir, { recursive: true, force: true }).catch(() => {});
    throw denial;
  }
  return new Promise<OffloadResult>((resolve) => { ... });
}
```

Hoist-outside-Promise variant. The interpreter (bash/node/python3 resolved from `operation.scriptType`) + argv `[scriptPath]` are exposed to the audit. Denial path cleans up the temp script dir before re-throwing.

OffloadExecutor.execute(operation, ctx?) also threads the ctx through to the delegated executeOffloadOp.

## Surface delta

- 3 files modified
- +20 source LOC + 65 test LOC
- 0 new test files (3 new cases in `ProcessContext wire (v1.49.859)` describe block)
- KNOWN_UNWIRED Process: 10 → 9

## Engine state

NASA degree at **1.178** (UNCHANGED — 77 consecutive ships at 1.178).

## Stale-audit (v857 tool, 2nd application)

`node tools/security/check-stale-known-unwired.mjs` — clean (Process 9, Egress 11, 0 stale).
