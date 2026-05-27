# v1.49.819 — Context

## Provenance

- **Source:** v815 handoff "Highest-ROI next ship candidates" list, item #4 (aminet batch chip ProcessContext). v816-822 chain plan.
- **Trigger:** Operator selected the v816-822 chain at session-start; this ship is item #4.
- **Predecessor ship:** v1.49.818 (T2.3 Wedge Close: FlagLookup Discriminated Union Extract); shipped 2026-05-27 ~10:33 UTC.
- **Session boundary:** Chain-mode (same session-retro mission).

## The 5 aminet files

| File | LOC | Spawn pattern | Sync/async | Notes |
|---|---|---|---|---|
| `lzx-extractor.ts` | 93 | `execFileAsync('unlzx', ['-x', absArchive], ...)` | async/await | Single spawn; try/catch with rmSync on failure |
| `lha-extractor.ts` | 177 | `execFileAsync('lha', ['-efq2w=...', archive], ...)` | async/await | Single spawn; try/catch with extract-dir cleanup |
| `tool-validator.ts` | 134 | `execFileAsync('lha', ['--version'])` + `execFileAsync('unlzx', [])` | async/await | TWO separate spawns (checkLha + checkUnlzx) |
| `emulator-launch.ts` | 203 | `execFile(fsUaeBin, [configPath], callback)` | callback wrapped in Promise | Single spawn; variable command name |
| `emulated-scanner.ts` | 269 | `execFile(config.fsUaePath, args, opts, callback)` | callback in Promise | Single spawn; NEVER throws (returns result-shape for all paths) |

Total: 876 lines across 5 files.

## Why these 5 wired together

All 5 are siblings in `src/aminet/`. They share:
- The same Amiga-emulation domain (extraction + scanning + launch)
- The `execFile` family of spawn calls (via promisify or directly)
- The same error-handling shape (try/catch for spawn errors)
- A common audience (the aminet pipeline)

A test-suite or production caller that wants enforcement for the aminet pipeline will likely want it for ALL 5 sites. Wiring them as a batch maps to the natural unit of consumption.

## The wiring pattern (mechanical)

```ts
// 1. Add to imports
import { ensureProcessAllowed, type ProcessContext } from '../security/process-context.js';

// 2. Add near imports
const PROCESS_SOURCE = 'aminet/<file-name>';

// 3. Modify exported function signature
export async function spawnFunc(
  ...existingArgs,
  ctx?: ProcessContext,
): Promise<ResultType> {

// 4. Insert BEFORE the spawn call (outside try/catch per #10427)
ensureProcessAllowed(ctx, PROCESS_SOURCE, 'exec-file', commandName, argv);

// 5. Existing spawn call unchanged
await execFileAsync(commandName, argv, opts);
```

Step 4 has a variant for never-throws contracts (emulated-scanner.ts):

```ts
try {
  ensureProcessAllowed(ctx, PROCESS_SOURCE, 'exec-file', commandName, argv);
} catch (denied) {
  // Convert to result-shape per existing pre-flight failure pattern
  resolve({ ran: false, ..., output: denied instanceof Error ? denied.message : String(denied) });
  return;
}
```

## KNOWN_UNWIRED ledger

Pre-v819 process KNOWN_UNWIRED (37 entries):
- 5× aminet (this batch closes)
- 2× chipset (blitter/executor, harness-integrity)
- 3× cli/commands (keystore, pic2html, terminal)
- 1× dashboard/collectors (git-collector)
- 3× dogfood (extraction/extractor, pydmd install scripts × 2)
- 1× drift/cli
- 6× git (core × 4 + gates/pre-flight + workflows/contribute)
- 3× intelligence (analyzer × 2 + provenance/linker)
- 2× learn (acquirer + version-manager)
- 2× mesh (mesh-worktree + proxy-committer)
- 1× orchestrator/extension/extension-detector
- 1× retro/changelog-watch
- 2× scan-arxiv (bridge + ranker)
- 3× scribe/netlist-renderer (available + netlistsvg-driver + yosys-driver)
- 1× skill/version-backfill
- 2× terminal (launcher + session)

Post-v819 (32 entries): the 5 aminet entries removed. The next obvious family target is git/core (4 entries: branch-manager, repo-manager, state-machine, sync-manager) — v820's target.

## Why batch the 5 aminet in one ship

Per the v811 batch chip pattern + #10416 lightest-wire: the batch IS the lightest wire when the family is structurally homogeneous. Splitting into 5 single-chip ships would multiply wall-clock by 5 (each ship has bump-version + release-notes + tag + push overhead) for the same code delta.

The cost per file is dominated by recon + wiring (~5 min each). The fixed per-ship cost (release notes + T14) is ~10 min. Batching: ~25 min wiring + ~10 min T14 = ~35 min total. Single-chip × 5: ~25 min wiring + ~50 min T14 = ~75 min total. Batch saves ~40 min wall-clock for the same code change.

The trade-off: if one of the 5 files needed a different shape (here: emulated-scanner's never-throws contract), the batch absorbs it inline rather than blocking the chain. Acceptable because the shape difference is a wiring pattern variant, not a different chokepoint.

## Engine state crossover

NASA degree sustains at **1.178** for the 37th consecutive ship. Counter-cadence count UNCHANGED at 6.

The codify ⟂ consume ⟂ calibrate ⟂ observe quadrant:
- **Consume:** this ship is consume-axis (chip the KNOWN_UNWIRED ledger).
- **Codify:** N/A this ship.
- **Calibrate:** N/A this ship.
- **Observe:** the audit-test's allowlist shrink is itself observable; no new instrumentation added.

## Predecessor handoff reference

See `.planning/HANDOFF-2026-05-27-v1.49.815-t2.3-high-01-pmtiles-refcount-shipped.md` for the v816-822 chain plan + pre-existing working-tree noise carried through this chain.

## Forward path post-v819

v820 (next in chain) = First git/core ProcessContext chip. 4 sibling files: branch-manager, repo-manager, state-machine, sync-manager. Per v812 first-chip pattern: wire 1, document the shape, leave the other 3 for a future batch. OR per v819 batch pattern: wire all 4 at once. Operator-bounded decision; v820 will pick.

Then v821-822 (discipline-coverage gate flip × 2) and v823 (ObservationBridge wire) close the chain.

## T14 ship sequence (operator-only authorization)

Per Lesson #10191 + Lesson #10184 + Lesson #10197. Canonical sequence at `docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:
- v819 used the v816-fixed `state-md-set-shipped` tool for STATE.md reset.
- Fourth consecutive post-v816 ship with clean colon-handling.
