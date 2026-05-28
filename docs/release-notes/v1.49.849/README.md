> Following v1.49.848 — _Help text expansion: 20 missing commands surfaced in `printHelp()`_, v1.49.849 is the **second ship of the v848-v856 nine-ship campaign** (operator-directed: help → 5 ProcessContext singleton chips → mesh verify → quality-drift scorer refinement → auto-emit verification). This ship chips one ProcessContext singleton — `src/retro/changelog-watch.ts` — wiring `detectVersion()` through the chokepoint with the hoisted-check + best-effort-silent-catch pattern per Lesson #10427. **KNOWN_UNWIRED Process count: 16 → 15.**

# v1.49.849 — ProcessContext singleton chip: `src/retro/changelog-watch.ts`

**Shipped:** 2026-05-28

Second ship of the nine-ship v848-v856 campaign; first of five chip ships (v849-v853 each consume one ProcessContext singleton). The `changelog-watch` module's `detectVersion()` shells out to `claude --version` to discover the installed CLI version. The function is a forensic accessory (returns `'unknown'` on any failure), but security denials are load-bearing per Lesson #10427 — the wire hoists `ensureProcessAllowed` OUTSIDE the swallow-everything try/catch so `ProcessContextDenied` propagates while CLI-not-installed + timeout + parse-failure continue to return `'unknown'` silently.

## What shipped

- **MODIFIED** `src/retro/changelog-watch.ts` — imports `ensureProcessAllowed` + `ProcessContext` from `../security/process-context.js`; `detectVersion()` accepts optional `ctx?: ProcessContext` parameter; `ensureProcessAllowed(ctx, 'retro/changelog-watch', 'exec', 'claude', ['--version'])` hoisted as first statement (BEFORE the try block) per Lesson #10427; `runChangelogWatch()` opts extended with optional `ctx?: ProcessContext` field, threaded into `detectVersion(opts?.ctx)`.
- **MODIFIED** `src/security/process-context-audit.test.ts` — removed `'src/retro/changelog-watch.ts'` from `KNOWN_UNWIRED`, replaced with inline comment documenting the v1.49.849 singleton-chip wire shape.
- **MODIFIED** `tests/retro/changelog-watch.test.ts` — 4 new test cases under the `detectVersion` describe: (a) propagates `ProcessContextDenied` when `claude` not in allowList, (b) returns version when ctx allows `claude`, (c) defaultProcessContext permissive context with audit-sink records the spawn, (d) sink record assertions.

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| `tests/retro/changelog-watch.test.ts` | +3 | new `detectVersion` describe entries (allow + deny + defaultProcessContext audit) |
| `src/security/process-context-audit.test.ts` | (no count change) | 2051 audit-test cases pass; file no longer in `KNOWN_UNWIRED` allowlist; audit now enforces wire presence at this file |

Pre-existing 4 `detectVersion` tests continue to pass; new tests bring the describe block to 7 cases (4 existing semantics + 3 security wire) — total file 9 tests.

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — **67 consecutive ships at 1.178**, new widest pressure margin record by 1 over v848's 66).
Counter-cadence count UNCHANGED at 6.

Manifest entries: **23** (UNCHANGED).
Lessons in manifest (unique): **83** (UNCHANGED).
UNCODIFIED: **39 ≤ ceiling 41** (UNCHANGED).
Wired calibratable thresholds: **5 of 7** (UNCHANGED).
**KNOWN_UNWIRED Process: 16 → 15.**
KNOWN_UNWIRED Egress: **11** (UNCHANGED).
Operational axes: **4** (UNCHANGED).

## Wire shape (per Lesson #10427)

```ts
export function detectVersion(ctx?: ProcessContext): string {
  // HOISTED before try — security denials propagate even when CLI failures
  // are best-effort silent.
  ensureProcessAllowed(ctx, 'retro/changelog-watch', 'exec', 'claude', ['--version']);
  try {
    const output = execSync('claude --version', { encoding: 'utf-8', timeout: 5000 });
    const match = output.match(/v?(\d+\.\d+\.\d+)/);
    return match ? match[1] : 'unknown';
  } catch {
    return 'unknown'; // CLI absent / timeout / parse failure — forensic silence
  }
}
```

The pattern matches the v839 `stalled.ts` forensic-surface template — hoisted check ahead of a swallow-everything try/catch. This is the canonical shape for accessory surfaces (per Lesson #10427) where security denials are load-bearing but operational errors are absorbed for UX.

## Surface delta

- 3 files modified (`src/retro/changelog-watch.ts`, `src/security/process-context-audit.test.ts`, `tests/retro/changelog-watch.test.ts`)
- +14 source LOC (5 LOC in `changelog-watch.ts` — import + 2 param threads + 1 hoisted call + 1 opts field; 7 LOC + comment in audit-test KNOWN_UNWIRED swap; ~32 LOC in test file for 3 new test cases)
- 0 new dependencies
- 0 manifest changes
