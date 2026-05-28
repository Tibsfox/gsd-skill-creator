> Following v1.49.858 — _ProcessContext singleton chip: `src/drift/cli.ts`_, v1.49.859 is the **second chip of Track 2** (Process singleton chips) in the v857-v867 follow-on campaign. Wires `src/chipset/blitter/executor.ts` (offload script executor) through the ProcessContext chokepoint. Hoist-outside-Promise variant with synchronous temp-dir cleanup on denial. **KNOWN_UNWIRED Process count: 10 → 9.** Cross-audit tool reports clean.

# v1.49.859 — ProcessContext singleton chip: `src/chipset/blitter/executor.ts`

**Shipped:** 2026-05-28

Second chip of Track 2. The `executeOffloadOp` function spawns interpreter subprocesses (bash/node/python3) for offload scripts written to a temp directory. The wire threads `ctx?: ProcessContext` through both `executeOffloadOp` and the `OffloadExecutor.execute` wrapper class; `ensureProcessAllowed` is hoisted OUTSIDE the `new Promise(...)` constructor with synchronous temp-dir cleanup if the security denial fires.

## What shipped

- **MODIFIED** `src/chipset/blitter/executor.ts` — imports `ensureProcessAllowed` + `ProcessContext`; `executeOffloadOp(operation, ctx?)` + `OffloadExecutor.execute(operation, ctx?)` accept optional `ctx`; `ensureProcessAllowed(ctx, 'chipset/blitter/executor', 'spawn', interpreter, [scriptPath])` hoisted BEFORE the Promise constructor; denial path cleans up the temp script dir synchronously.
- **MODIFIED** `src/security/process-context-audit.test.ts` — removed `'src/chipset/blitter/executor.ts'` from `KNOWN_UNWIRED` + inline comment documenting the v1.49.859 wire shape.
- **MODIFIED** `src/chipset/blitter/executor.test.ts` — new `describe('ProcessContext wire (v1.49.859)')` block with 3 test cases (deny + allow + wrapper-denied).

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| `src/chipset/blitter/executor.test.ts` | +3 | 10 → 13 total |
| `src/security/process-context-audit.test.ts` | (no count change) | 2051 audit-test cases pass; file no longer in `KNOWN_UNWIRED` |
| `tools/security/check-stale-known-unwired.mjs` | clean | Process 9 + Egress 11; 0 stale |

## Engine state

NASA degree at **1.178** (UNCHANGED — **77 consecutive ships at 1.178**, new widest pressure margin record by 1 over v858's 76).
Counter-cadence count UNCHANGED at 6.
Manifest entries: **23** / Lessons: **84** / UNCODIFIED: **39 ≤ 41**.
**KNOWN_UNWIRED Process: 10 → 9.** Egress: **11** (UNCHANGED).
Operational axes: **4** (UNCHANGED).

## Wire shape (per Lesson #10427)

```ts
export async function executeOffloadOp(
  operation: OffloadOperation,
  ctx?: ProcessContext,
): Promise<OffloadResult> {
  // ...setup (mkdtemp + writeFile + interpreter resolution)

  try {
    ensureProcessAllowed(ctx, 'chipset/blitter/executor', 'spawn', interpreter, [scriptPath]);
  } catch (denial) {
    await rm(scriptDir, { recursive: true, force: true }).catch(() => {});
    throw denial;
  }

  return new Promise<OffloadResult>((resolve) => {
    const child = spawn(interpreter, [scriptPath], { ... });
    // ...
  });
}
```

Hoist-outside-Promise variant. The setup phase (mkdtemp + writeFile) already creates a temp directory; if security denies the spawn, the catch cleans up the temp dir before re-throwing so no resource leaks under denial. ProcessContextDenied propagates to the async-function's caller.

## Surface delta

- 3 files modified
- +20 source LOC (3 LOC for imports; 1 param + 4 LOC for hoisted-check + cleanup; 1 param to wrapper; 9 LOC in audit-test KNOWN_UNWIRED swap)
- +65 test LOC (3 new test cases)
- 0 new dependencies
- 0 manifest changes
