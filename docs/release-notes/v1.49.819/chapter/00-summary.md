# v1.49.819 — Batch Chip: aminet Family ProcessContext Wiring

**Released:** 2026-05-27
**Type:** Batch chip (ProcessContext family wiring; #10414 + #10432 application)
**Predecessor:** v1.49.818 — T2.3 Wedge Close: FlagLookup Discriminated Union Extract
**Engine state:** UNCHANGED (NASA degree sustains at 1.178; counter-cadence count UNCHANGED at 6)
**Wedge:** 5 aminet family files (emulated-scanner, emulator-launch, lha-extractor, lzx-extractor, tool-validator) carried in the v806 ProcessContext KNOWN_UNWIRED grandfather allowlist. Wire them all in one batch ship per the v811 batch chip pattern.

## Summary

The aminet family is the LARGEST single-family chip target on the process KNOWN_UNWIRED allowlist (5 of 37 entries). Wire them all in one ship, bring the ledger from 37 → 32.

The wiring is the canonical #10414 chokepoint-retrofit pattern:
1. Add `ctx?: ProcessContext` as a new optional parameter on the exported spawn-calling function.
2. Add `import { ensureProcessAllowed, type ProcessContext } from '../security/process-context.js'`.
3. Add `const PROCESS_SOURCE = 'aminet/<file-name>'` near the imports.
4. Insert `ensureProcessAllowed(ctx, PROCESS_SOURCE, 'exec-file', <command>, <argv>)` BEFORE the spawn (outside the try/catch per #10427).
5. Remove the file from the KNOWN_UNWIRED allowlist.

Per the v812 first-chip + v811 batch-chip patterns, the batch shape is the right scope when the family is structurally homogeneous (same-shape spawn + similar surrounding code) — here, all 5 aminet files spawn external tools with `execFile` and follow the same error-handling shape.

## What changed

`src/aminet/lzx-extractor.ts`:
- Add `import { ensureProcessAllowed, type ProcessContext } from '../security/process-context.js';`
- Add `const PROCESS_SOURCE = 'aminet/lzx-extractor';`
- `extractLzx(archivePath: string)` → `extractLzx(archivePath: string, ctx?: ProcessContext)`
- Insert `ensureProcessAllowed(ctx, PROCESS_SOURCE, 'exec-file', 'unlzx', argv)` BEFORE `execFileAsync('unlzx', argv, ...)` — outside the try/catch.

`src/aminet/lha-extractor.ts`:
- Same shape; PROCESS_SOURCE = `'aminet/lha-extractor'`; spawn-command = `'lha'`.

`src/aminet/tool-validator.ts`:
- Thread `ctx?` through `validateExtractionTools`, `checkLha`, `checkUnlzx`.
- Two separate ensure calls (one per checked tool).

`src/aminet/emulator-launch.ts`:
- Thread `ctx?` through `launchEmulator`.
- spawn-command = variable `fsUaeBin` (defaults to `'fs-uae'`).
- ensureProcessAllowed BEFORE the `new Promise((resolve, reject) => execFile(...))` block.

`src/aminet/emulated-scanner.ts`:
- Thread `ctx?` through `runEmulatedScan`.
- DIFFERENT shape: function returns `Promise<EmulatedScanResult>` and NEVER throws (matches contract via `resolve` for all paths including pre-flight failures).
- ProcessContextDenied wrapped in try/catch, converted to `ran: false` + denial message in `output`. Preserves the never-throws contract while surfacing the denial.

`src/security/process-context-audit.test.ts`:
- Remove 5 aminet entries from `KNOWN_UNWIRED`.
- Add 1-line comment naming the v819 batch closure.

`.planning/PROJECT.md`:
- Pre-bump refresh `Latest shipped release` v817 → v818.

## Deliverables

| Path | Change | Notes |
|---|---|---|
| `src/aminet/lzx-extractor.ts` | MODIFIED | +5 LOC (import + const + param + ensure call). |
| `src/aminet/lha-extractor.ts` | MODIFIED | +5 LOC. |
| `src/aminet/tool-validator.ts` | MODIFIED | +7 LOC (3 function signatures touched). |
| `src/aminet/emulator-launch.ts` | MODIFIED | +5 LOC. |
| `src/aminet/emulated-scanner.ts` | MODIFIED | +18 LOC (denial-converted-to-result shape is larger than the bare hoist). |
| `src/security/process-context-audit.test.ts` | MODIFIED | -5 LOC + 3-line comment. |
| `.planning/PROJECT.md` | MODIFIED | Pre-bump refresh. |
| `docs/release-notes/v1.49.819/` | NEW | 5 files: README + 4 chapter files. |

## Lessons applied

| # | Lesson | Application |
|---|---|---|
| #10412 | Recon-first per file | Read all 5 aminet files (876 lines) + `src/intelligence/analyzer/git.ts` as the wiring pattern reference + KNOWN_UNWIRED allowlist + chokepoint definition. ~10 min recon before any code change. |
| #10414 | Optional `ctx?` parameter | THE central application for the wiring side. 5 functions threaded with `ctx?: ProcessContext`; zero call-site churn (existing callers pass undefined; legacy-permissive). |
| #10416 | Tolerant-generator / lightest wire | Resisted: building a `defaultAminetProcessContext()` factory (1 instance); pre-emptively defining a typed `AminetCommand` union (`'lha' | 'unlzx' | 'fs-uae'`) for the ensure-call (no caller asks). Chose: thread `ctx?` per-function, no shared scaffolding. |
| #10422 | Verdict-pattern surface separation | The 5 wired call sites are independent observability surfaces; the chokepoint definition is the shared decision surface. Each PROCESS_SOURCE constant is local to its file. |
| #10427 | Failure-mode contracts | 4 of 5 files use the standard "hoist ensureProcessAllowed outside try/catch" pattern (denial propagates). 1 file (emulated-scanner) has a never-throws contract; denial converted to result-object with `ran: false`. Both shapes are documented per the discipline. |
| #10432 | KNOWN_UNWIRED ledger discipline | THE central application for the ledger side. Allowlist shrinks 37 → 32 (largest single-ship reduction since v806 introduction). Inline 3-line comment in the allowlist marks the v819 batch closure for future readers. |

## What this ship is not

- Not a NASA degree advance.
- Not a behavior change for existing callers (`ctx === undefined` behavior unchanged).
- Not a closure of the entire KNOWN_UNWIRED ledger.
- Not a new chokepoint definition.
- Not a substrate ship (no new types/modules; just wiring existing chokepoint to existing callers).

## Verification

- `npx tsc --noEmit` → clean.
- `npx vitest run src/aminet/ src/security/process-context-audit.test.ts` → 2710 PASS / 0 fail (was 2710; wiring byte-equivalent for default callers).
- Pre-tag-gate (full): expected 17/17 PASS.

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — 37 consecutive ships at 1.178). Counter-cadence count UNCHANGED at 6.

Migration-debt-ledger consume-axis ship; does not tick counter-cadence per #10430.

## Forward path

v820 (next in chain) = First git/core ProcessContext chip (4-entry family). Likely 1-chip first per v812 pattern; future batch can apply the v819 5-chip pattern to the remaining 3. Brings process `KNOWN_UNWIRED` 32 → 31 (or 32 → 28 if batched in v820 itself). Then v821-823 continue.
