
# v1.49.842 — ProcessContext Terminal Family Batch Chip

**Released:** 2026-05-27

## Why this ship

Batch chip wiring the 3-file terminal family for ProcessContext per the v840 next-session candidates list. All three files (`src/cli/commands/terminal.ts` + `src/terminal/launcher.ts` + `src/terminal/session.ts`) import `node:child_process` and were grandfathered into `KNOWN_UNWIRED` at v806 when the audit-test was introduced. This ship threads `ctx?: ProcessContext` through each entry point, calls `ensureProcessAllowed` before each spawn/exec call, and removes the 3 allowlist entries.

The terminal subsystem is the only CLI command that spawns external processes via `child_process.spawn` (other CLI commands either don't spawn or are wired). Closing this family removes a coherent 3-entry group from the migration ledger.

## The 3 wires

### `src/terminal/session.ts` — `listTmuxSessions(ctx?)` + hoisted check

Adds optional `ctx?: ProcessContext` param to `listTmuxSessions`. `ensureProcessAllowed(ctx, 'terminal/session', 'exec-sync', 'tmux')` is hoisted OUTSIDE the swallow-everything try/catch. tmux-not-installed still returns `[]` silently; `ProcessContextDenied` propagates per #10427.

### `src/terminal/launcher.ts` — `launchWetty(options)` reads `options.ctx`

Adds optional `ctx?: ProcessContext` field to `LaunchOptions` (in `src/terminal/types.ts`). `launchWetty` destructures it and calls `ensureProcessAllowed(ctx, 'terminal/launcher', 'spawn', 'wetty')` before the spawn. No swallowing try/catch around the spawn — the check is naturally outside any catch by structure.

### `src/cli/commands/terminal.ts` — `handleStart(config, ctx?)` + catch-rethrow

Adds optional `ctx?: ProcessContext` param to `handleStart`. The spawn is inside a try/catch that previously absorbed ALL errors into the CLI's JSON output. New: `ensureProcessAllowed(ctx, 'cli/commands/terminal', 'spawn', cmd)` is called inside the try (cmd value comes from `resolveWetty()` which is also in the try), and the catch re-throws `ProcessContextDenied` so security denials propagate per #10427. Operational errors (resolveWetty missing-binary, spawn failure) remain absorbed.

## Surface delta

- 4 source files modified (3 wires + LaunchOptions type extension)
- 1 audit-test file modified (3 KNOWN_UNWIRED entries removed)
- 0 new tests (audit-test internally counts entries; full suite unchanged)
- 5 release-notes files (this + README + 3 chapters)

## Manifest state

| Field | Before | After |
|---|---|---|
| Manifest entries (discipline domains) | 23 | 23 |
| Lessons in manifest (unique) | 78 | 78 |
| Open lesson candidate backlog | 0 | 0 |
| Tentative observations carried forward | ~12-14 | ~12-14 |

## Engine state

NASA degree at **1.178** (UNCHANGED — **60 consecutive ships at 1.178**; was 59 entering this ship). New widest-pressure-margin record.
Counter-cadence count UNCHANGED at 6.
**KNOWN_UNWIRED Process: 21 → 18 (-3).**
KNOWN_UNWIRED Egress UNCHANGED at 11.
Wired calibratable thresholds: 5 of 7 (UNCHANGED).
UNCODIFIED count: 39 ≤ ceiling 41 (UNCHANGED).
