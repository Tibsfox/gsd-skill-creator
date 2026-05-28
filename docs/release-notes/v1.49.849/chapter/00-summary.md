# v1.49.849 — ProcessContext singleton chip: `src/retro/changelog-watch.ts`

**Released:** 2026-05-28

## Why this ship

Second ship of the operator-directed v848-v856 nine-ship campaign; first of five ProcessContext singleton chip ships (v849-v853 each take one entry off the 16-entry `KNOWN_UNWIRED` allowlist established at v1.49.806 — the grandfathered list from when the ProcessContext chokepoint was introduced).

The v847 codify ship promoted #10441 (DI-executor + tokenized-argv wire shape) and #10442 (re-throw ProcessContextDenied from CLI swallow-catch). This ship is the first chip ship after that codification — exercising the related #10427 / #10437 hoisted-check pattern for a forensic-accessory surface (`detectVersion()` returns `'unknown'` on any failure; security denials are the only load-bearing failure mode that must propagate).

`changelog-watch` was chosen as the first singleton chip because:
- Single child-process call site (line 71: `execSync('claude --version', ...)`)
- Small file (234 lines)
- Pure-function neighbors (parseChangelog, classifyFeatures) — no spawn surface to thread through
- Existing test file with mock infrastructure already in place
- The hoisted-check pattern matches v839 `stalled.ts` precedent cleanly

## The wire

```ts
export function detectVersion(ctx?: ProcessContext): string {
  ensureProcessAllowed(ctx, 'retro/changelog-watch', 'exec', 'claude', ['--version']);
  try {
    const output = execSync('claude --version', { encoding: 'utf-8', timeout: 5000 });
    // ...parse + return
  } catch {
    return 'unknown'; // forensic-silent
  }
}
```

5 LOC change to `detectVersion()` (import + param + hoisted call); 1 LOC threaded into `runChangelogWatch()` opts.

## Surface delta

- 3 files modified
- +14 source LOC + ~32 test LOC
- 0 new tests files (3 new test cases inside existing `describe('detectVersion')`)
- 0 manifest changes
- 0 new dependencies
- KNOWN_UNWIRED Process: 16 → 15

## Manifest state

| Field | Before | After |
|---|---|---|
| Manifest entries | 23 | 23 |
| Lessons in manifest (unique) | 83 | 83 |
| UNCODIFIED | 39 | 39 |
| Wired calibratable thresholds | 5 of 7 | 5 of 7 |
| KNOWN_UNWIRED Process | 16 | 15 |
| KNOWN_UNWIRED Egress | 11 | 11 |

## Engine state

NASA degree at **1.178** (UNCHANGED — **67 consecutive ships at 1.178**, new widest pressure margin record by 1 over v848's 66).
Counter-cadence count UNCHANGED at 6.
Operational axes UNCHANGED at 4.
