# v1.49.851 — ProcessContext singleton chip: `src/skill/version-backfill.ts`

**Released:** 2026-05-28

## Why this ship

Fourth ship of the operator-directed v848-v856 nine-ship campaign; third of five ProcessContext singleton chip ships. Continues consuming the 16-entry KNOWN_UNWIRED Process allowlist established at v1.49.806.

`version-backfill` was chosen as the third chip because:
- `gitLastModifiedDate()` is a single-call-site function with same shape as v849 `detectVersion()` (forensic accessory, swallow-everything try/catch)
- 254 LOC file; the touched surface is just one function
- Only one in-file caller (`backfillSkillContent` at line 149); minimal threading required
- Wire pattern is byte-equivalent to v849 (hoist-at-top, no DI-override branch)

## The wire

```ts
export function gitLastModifiedDate(path: string, ctx?: ProcessContext): string | null {
  ensureProcessAllowed(ctx, 'skill/version-backfill', 'exec', 'git', [
    'log', '-1', '--format=%ai', '--', path,
  ]);
  try {
    // ...execSync + parse + return
  } catch {
    return null;
  }
}
```

7 LOC change. Same v849 hoist-at-top shape.

## Surface delta

- 3 files modified (1 NEW test file: `tests/skill/version-backfill.test.ts`)
- +21 source LOC + ~56 test LOC
- 0 new dependencies
- KNOWN_UNWIRED Process: 14 → 13

## Engine state

NASA degree at **1.178** (UNCHANGED — **69 consecutive ships at 1.178**, new widest pressure margin record by 1 over v850's 68).
Counter-cadence count UNCHANGED at 6.
Operational axes UNCHANGED at 4.
