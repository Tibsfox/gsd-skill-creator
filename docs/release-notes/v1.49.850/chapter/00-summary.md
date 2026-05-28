# v1.49.850 — ProcessContext singleton chip: `src/orchestrator/extension/extension-detector.ts`

**Released:** 2026-05-28

## Why this ship

Third ship of the operator-directed v848-v856 nine-ship campaign; second of five ProcessContext singleton chip ships. Continues consuming the 16-entry KNOWN_UNWIRED Process allowlist established at v1.49.806.

`extension-detector` was chosen as the second chip because:
- Smallest singleton in the remaining list (120 LOC)
- Single child-process call site (line 70: `execSync('skill-creator --version 2>/dev/null')`)
- Existing test file uses DI overrides pattern (no `vi.mock('child_process')` needed)
- Two-strategy probe pattern requires hoisting INSIDE the no-override branch (variant of v849 pattern; documented)

## The wire

```ts
} else {
  // No override -- try real CLI binary
  ensureProcessAllowed(ctx, 'orchestrator/extension/extension-detector', 'exec', 'skill-creator', ['--version']);
  try {
    const output = execSync('skill-creator --version 2>/dev/null', ...);
    // ...
  } catch {
    // CLI not available -- continue to Strategy 2
  }
}
```

8 LOC change (import + param + hoisted call). Differs from v849 in placement: hoist INSIDE the no-override branch to avoid emitting audit records when an override early-returns.

## Surface delta

- 3 files modified
- +20 source LOC + ~25 test LOC
- 0 new test files (2 new test cases in new `ProcessContext wire (v1.49.850)` describe block)
- 0 manifest changes
- 0 new dependencies
- KNOWN_UNWIRED Process: 15 → 14

## Engine state

NASA degree at **1.178** (UNCHANGED — **68 consecutive ships at 1.178**, new widest pressure margin record by 1 over v849's 67).
Counter-cadence count UNCHANGED at 6.
Operational axes UNCHANGED at 4.
