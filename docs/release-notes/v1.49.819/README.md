> Following v1.49.818 — _T2.3 Wedge Close: FlagLookup Discriminated Union Extract_, v1.49.819 closes the 4th item in the v816-822 chain. Wires the aminet family (5 sibling files: emulated-scanner, emulator-launch, lha-extractor, lzx-extractor, tool-validator) through the ProcessContext chokepoint introduced at v806. Brings process `KNOWN_UNWIRED` from 37 → 32, the biggest single-ship migration since the v806 introduction.

# v1.49.819 — Batch Chip: aminet Family ProcessContext Wiring

**Shipped:** 2026-05-27

Fourth ship of the v816-822 chain. Batch-chip migration of the aminet family — all 5 sibling files that spawn external Amiga-emulation tools (`lha`, `unlzx`, `fs-uae`). Applies the v811-codified batch pattern (#10432 KNOWN_UNWIRED ledger discipline + #10427 failure-mode contracts) to the largest single-family chip target on the allowlist.

## What shipped

- **MODIFIED** `src/aminet/lzx-extractor.ts` — thread `ctx?: ProcessContext` through `extractLzx`; add `import { ensureProcessAllowed, type ProcessContext }`; add `const PROCESS_SOURCE = 'aminet/lzx-extractor'`; insert `ensureProcessAllowed(ctx, PROCESS_SOURCE, 'exec-file', 'unlzx', argv)` BEFORE the spawn (outside the try/catch per #10427).
- **MODIFIED** `src/aminet/lha-extractor.ts` — same shape; PROCESS_SOURCE = 'aminet/lha-extractor'; spawn-command = `'lha'`.
- **MODIFIED** `src/aminet/tool-validator.ts` — thread `ctx?: ProcessContext` through `validateExtractionTools`, `checkLha`, `checkUnlzx`. Two separate ensure calls (one per checked tool).
- **MODIFIED** `src/aminet/emulator-launch.ts` — thread `ctx?: ProcessContext` through `launchEmulator`; PROCESS_SOURCE = 'aminet/emulator-launch'; spawn-command = `fsUaeBin` (variable; defaults to `'fs-uae'`).
- **MODIFIED** `src/aminet/emulated-scanner.ts` — thread `ctx?: ProcessContext` through `runEmulatedScan`; PROCESS_SOURCE = 'aminet/emulated-scanner'. Existing function returns Promise<EmulatedScanResult> NEVER throws (returns `ran: false` for pre-flight failures); ProcessContextDenied is converted to the same shape (try/catch around `ensureProcessAllowed`, resolve with `ran: false` + denial message in `output`). Preserves the never-throws contract while still surfacing the denial to callers.
- **MODIFIED** `src/security/process-context-audit.test.ts` — remove the 5 aminet entries from `KNOWN_UNWIRED`; replace with a 1-line comment noting the v819 batch closure.
- **MODIFIED** `.planning/PROJECT.md` — pre-bump refresh `Latest shipped release` from v817 to v818.

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| aminet (all 39 files) | 2710 (unchanged) | All callers pass `ctx = undefined`; behavior byte-equivalent for default callers |
| process-context-audit.test.ts | unchanged | KNOWN_UNWIRED shrunk 37 → 32; audit-test logic unchanged |
| **Total added** | **+0** | Wiring is byte-equivalent for existing callers |

## KNOWN_UNWIRED ledger update

| Pre-v819 | Post-v819 | Delta |
|---|---|---|
| Process: **37** | **32** | -5 (aminet family batch closure) |
| Egress: **11** | **11** | UNCHANGED |
| Loader: pre-existing | unchanged | unchanged |

Pre #10432 (KNOWN_UNWIRED ledger discipline), the chip cadence target is: shrink monotonically to zero. v819 is the LARGEST single-ship reduction since the v806 introduction (5 entries in one ship vs. typical 1-entry chips).

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — 37 consecutive ships at 1.178). Counter-cadence count UNCHANGED at 6.

Manifest entries: **22 → 22** (UNCHANGED — chip migration, not a new discipline).
Open lesson candidate backlog: **0** (UNCHANGED).
Tentative observations carried forward: ~10-12 → ~10-12.

## Lessons applied

| # | Lesson | Application |
|---|---|---|
| #10412 | Recon-first per file | Read all 5 aminet files (876 lines total) + KNOWN_UNWIRED allowlist + an already-wired caller (`src/intelligence/analyzer/git.ts`) as the pattern reference. Recon ~10 min before any code change. |
| #10414 | Optional `ctx?` parameter pattern | THE central application. All 5 files thread `ctx?: ProcessContext` as a new optional parameter; existing callers (which pass nothing) continue to work as legacy-permissive (`ctx === undefined`); future test or production callers can opt in to enforcement by passing a configured context. Zero call-site churn. |
| #10416 | Tolerant-generator / lightest wire | Resisted: defining a `defaultAminetProcessContext()` factory with the union of all 3 commands (`lha`, `unlzx`, `fs-uae`) — no caller asks for it yet; instance count is 1 (this ship). Chose: thread `ctx?` per-function; let callers compose contexts as needed. |
| #10422 | Verdict-pattern surface separation | The chokepoint definition surface (`src/security/process-context.ts`) is decision surface; the per-caller wiring is observability surface (records the call via `audit` callback). Each wired call site is independent. |
| #10427 | Failure-mode contracts | `ensureProcessAllowed` hoisted OUTSIDE existing try/catch in 4 of 5 files — `ProcessContextDenied` propagates to callers. For `emulated-scanner.ts` (existing contract: never throws), wrapped in try/catch and converted to `ran: false` + denial message in `output` — preserves the contract while surfacing the denial. Both shapes documented per #10427 (load-bearing vs. forensic). |
| #10432 | KNOWN_UNWIRED allowlists as migration-debt ledger | THE central application for the ledger side. Allowlist shrinks 37 → 32 in this ship; documented inline with the v819 batch-closure comment. The ledger asymptotes toward zero per the codified discipline. |

## What this ship is not

- Not a NASA degree advance.
- Not a new chokepoint (uses the v806 ProcessContext).
- Not a behavior change for existing callers (all currently pass `ctx = undefined`; same as pre-v819).
- Not a closure of the whole KNOWN_UNWIRED ledger — 32 entries remain post-v819.

## Forward path

v820 (next in chain) = First git/core ProcessContext chip (4-entry family: branch-manager, repo-manager, state-machine, sync-manager). v820 will likely wire 1 first per v812 first-chip pattern; future batch can wire the remaining 3 per the v819 pattern. Brings process `KNOWN_UNWIRED` 32 → 31 (or 32 → 28 if batch). Then v821-823 continue.
