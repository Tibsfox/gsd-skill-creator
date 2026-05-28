> Following v1.49.841 — _Quality-drift scorer recalibration: chip release-type + per-type baselines_, v1.49.842 is the **ProcessContext terminal family batch chip**. Wires 3 KNOWN_UNWIRED entries (`src/cli/commands/terminal.ts` + `src/terminal/launcher.ts` + `src/terminal/session.ts`) via the established #10433 internal-helper / threaded-options pattern with hoisted `ensureProcessAllowed` per #10427. KNOWN_UNWIRED Process: **21 → 18** (-3).

# v1.49.842 — ProcessContext Terminal Family Batch Chip

**Shipped:** 2026-05-27

Batch chip wiring the 3-file terminal family for ProcessContext. All three files import `node:child_process` and were grandfathered into `KNOWN_UNWIRED` at v806. This ship threads `ctx?: ProcessContext` through each entry point, calls `ensureProcessAllowed` before each spawn/exec, and removes the 3 allowlist entries. Continues the chip cadence from v812 (first chip) + v819/825/827/828 (4 batch chips) + v834 (stale-entry cleanup) + v839 (singleton chip).

## What shipped

### Wires

- **MODIFIED** `src/terminal/session.ts` — `listTmuxSessions(ctx?: ProcessContext)`. `ensureProcessAllowed(ctx, 'terminal/session', 'exec-sync', 'tmux')` hoisted OUTSIDE the tmux-unavailable try/catch per #10427. tmux-unavailable still returns `[]` silently; `ProcessContextDenied` propagates.
- **MODIFIED** `src/terminal/launcher.ts` — `launchWetty(options)` reads `options.ctx`. `ensureProcessAllowed(ctx, 'terminal/launcher', 'spawn', 'wetty')` called before `spawn('wetty', ...)`. This surface has no swallowing try/catch around the spawn — the check is naturally outside any catch by structure.
- **MODIFIED** `src/terminal/types.ts` — adds optional `ctx?: ProcessContext` field to `LaunchOptions` interface.
- **MODIFIED** `src/cli/commands/terminal.ts` — `handleStart(config, ctx?: ProcessContext)`. `ensureProcessAllowed(ctx, 'cli/commands/terminal', 'spawn', cmd)` called inside the try block (cmd value comes from `resolveWetty()` which is also inside try). The catch re-throws `ProcessContextDenied` per #10427 — operational errors are absorbed into the CLI JSON output; load-bearing security denials propagate.

### KNOWN_UNWIRED allowlist updates

- **MODIFIED** `src/security/process-context-audit.test.ts`:
  - Removed `'src/cli/commands/terminal.ts'` (with inline comment documenting the wire pattern).
  - Removed `'src/terminal/launcher.ts'` (with inline comment).
  - Removed `'src/terminal/session.ts'` (with inline comment).

KNOWN_UNWIRED Process: **21 → 18** (-3 this ship).

## Wire details

### `src/terminal/session.ts` (46 LOC; +6 LOC for wire)

`listTmuxSessions` is the only function importing `node:child_process` (`execSync`). The function has a swallow-everything try/catch that returns `[]` on any failure (forensic surface — tmux-not-installed is expected silent). Per #10427's load-bearing-vs-accessory contract, the security check must propagate even though the forensic listing is silent. Hoisted outside the try/catch.

### `src/terminal/launcher.ts` (172 LOC; +7 LOC for wire)

`launchWetty` has no swallowing try/catch around the `spawn('wetty', ...)` call — the structure is await-and-resolve-promise, with errors signaled via process events. The `ensureProcessAllowed` call is placed at function-top right after destructuring options, before the args build. Threading via `LaunchOptions.ctx` keeps the call signature unchanged for all callers.

### `src/cli/commands/terminal.ts` (407 LOC; +7 LOC for wire)

`handleStart` has a try/catch wrapping the spawn AND `resolveWetty()` (which can throw on missing wetty binary). The `cmd` value is determined inside the try by `resolveWetty()`, so the security check must be inside the try block. The catch was previously a swallow-everything that JSON-encoded the error message. Now it `if (err instanceof ProcessContextDenied) throw err;` — operational errors remain absorbed; security denials propagate.

The CLI dispatch level (`src/cli/dispatch.ts`) does not currently have a context concept, so `terminalCommand` doesn't accept ctx. `handleStart` accepts ctx as an optional parameter for future internal callers; the public CLI path is grandfathered (ctx undefined → permissive legacy behavior, same as every other CLI surface).

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| `src/security/process-context-audit.test.ts` | 2,050 | -3 (3 KNOWN_UNWIRED entries removed; the audit now greps src/ and finds the wires) |
| `src/security/process-context.test.ts` | 21 | UNCHANGED |
| `src/terminal/process-manager.test.ts` | 25 | UNCHANGED (process-manager uses launchWetty; new ctx is optional so existing tests still pass) |

Full suite at ship time: 35,261 PASS / 45 skipped / 7 todo / 0 fail (unchanged from v841; audit-test count adjusts internally — the test counts KNOWN_UNWIRED entries, not source files).

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — **60 consecutive ships at 1.178**; was 59 entering this ship — new widest-pressure-margin record).
Counter-cadence count UNCHANGED at 6.

Manifest entries: **23 → 23** (UNCHANGED — single chip-class ship; no manifest changes).
Lessons in manifest (unique): **78 → 78** (UNCHANGED).
Wired calibratable thresholds: **5 of 7** (UNCHANGED).
**KNOWN_UNWIRED Process: 21 → 18 (-3).** Egress: **11** (UNCHANGED).
UNCODIFIED: **39 ≤ ceiling 41** (UNCHANGED).

## Why this ship

The v840 next-session candidates list named the terminal family batch as one of the highest-value remaining ProcessContext chips (3 entries, well-bounded scope). The terminal subsystem is the only CLI command that spawns external processes via `child_process.spawn` (other CLI commands either don't spawn or are wired); closing this family removes a 3-entry group from the migration ledger.

Pattern continuation: this is the 5th batch chip (after aminet v819, git/core v825, dogfood v827, scribe/netlist-renderer v828). The cadence is well-established. Wire cost per file: 6-10 LOC (matches the median for `internal-helper` / `threaded-options` shapes documented in #10433).

## Tentative observations carried forward

None new this ship — established pattern, no surprises.

Inherited from v840 + v841 (unchanged):

- **#10433 LOC-band-by-callsite-count refinement** — 5 instances now (v825 + v827 + v828 + v839 + **v842**). Sustained ESTABLISHED — no further codification action.
- **Recent-vs-baseline-recent comparison pattern** (v841; 1 instance, below threshold).
- **Drift-check noise as scoring-system feedback loop** (v841; 1 instance).
- **Codify-ship-as-recon-consolidator pattern** (v840; 1 instance).
- **Deferral-by-classification-ambiguity** (v840; 1 instance).
- **Auto-run-on-import as bootstrap-time tax** (v836; 1 instance).
- **Polarity convention for inverted-mechanic thresholds** (v837; 1 instance).
- All other single-instance observations.

Carried forward but DEFERRED at v840:
- **Verification/integration-only ships axis** (2 instances v829 + v832).
- **Bidirectional enforcement completeness** (1-2 instances v838 + v836).

## Pickup

v1.49.842 SHIPPED. Next: ProcessContext mesh family batch chip (v843; 2 entries — `mesh-worktree.ts` + `proxy-committer.ts`).

| Engine pulse | Value |
|---|---|
| NASA degree | 1.178 (60 consecutive ships — record) |
| Counter-cadence | 6 |
| Manifest entries | 23 |
| Unique lessons in manifest | 78 |
| UNCODIFIED | 39 ≤ 41 |
| KNOWN_UNWIRED Process | **18 (-3)** |
| KNOWN_UNWIRED Egress | 11 |
| Wired calib thresholds | 5 / 7 |
| Drift-check alerts | 0 major, 1 informational warning |
