---
phase: 50-model-abstraction
plan: "02"
subsystem: chips
tags: [ChipRegistry, ChipFactory, chipset.json, backward-compatibility, CHIP-06, zod, vitest, tdd]

requires:
  - 50-01 (ModelChip interface, ChipConfig discriminated union, ChipRole type)

provides:
  - ChipRegistry class (discover/get/getByRole/list/healthCheck/capabilitiesReport/register)
  - createChipRegistry() factory function
  - createChip() factory function dispatching on config.type
  - ChipsetFileSchema (Zod schema for chipset.json file format)
  - ChipsetFile TypeScript type
  - CHIPSET_FILE_VERSION = 1 constant (IMP-03)
  - HEALTH_CHECK_PARALLEL_LIMIT = 10 constant (IMP-03)
  - CHIP-06 backward compatibility: missing chipset.json is not an error

affects:
  - 50-03 (CLI integration -- uses createChipRegistry(), resolves --chip arg via registry.get())
  - Phase 51 (Multi-Model Evaluation -- eval pipeline resolves grader chip via registry.getByRole('grader'))
  - Phase 52 (MCP Infrastructure -- mesh nodes registered programmatically via registry.register())

tech-stack:
  added: []
  patterns:
    - "ChipsetFileSchema uses z.literal(1) for version -- explicit version gate for future breaking changes"
    - "roles object uses z.object({...}).partial() not z.record(z.enum(...)) -- Zod v4 record enforces all keys present"
    - "loadFromFile() state committed atomically after all validation passes (newChips/newRoles Maps built first)"
    - "Promise.allSettled for parallel health/capability checks -- one failure never blocks others"
    - "ENOENT silently returns (CHIP-06); other fs errors propagate as-is"

key-files:
  created:
    - src/chips/chip-factory.ts
    - src/chips/chip-factory.test.ts
    - src/chips/chip-registry.ts
    - src/chips/chip-registry.test.ts
  modified:
    - src/chips/index.ts

key-decisions:
  - "ChipsetFileSchema roles uses z.object partial() not z.record(z.enum()) -- Zod v4 enforces all enum keys present in z.record; partial object schema allows any subset of roles"
  - "State committed atomically in loadFromFile() -- build new Maps first, only assign to this.chips/this.roles after all validation passes to prevent partial state"
  - "createChipRegistry() factory separate from new ChipRegistry() -- factory clarifies no file loading happens at construction; caller controls when to call loadFromFile()"
  - "Exhaustiveness guard in createChip() uses void _unreachable pattern -- assigns config to never for compile-time check, throws runtime error with (config as any).type for descriptive message"

patterns-established:
  - "Registry pattern: file-based discovery + programmatic registration in same class -- test code and production code use same API"
  - "CHIP-06 pattern: ENOENT is a valid non-error state; isConfigured() is the clean query for 'do we have chips?'"
  - "Parallel I/O with allSettled: healthCheck() and capabilitiesReport() never throw even if individual chips fail"

requirements-completed: [CHIP-04, CHIP-06]

duration: 4min
completed: "2026-03-03"
---

# Phase 50 Plan 02: ChipRegistry and ChipFactory Summary

**ChipRegistry with file-based discovery (chipset.json), role-to-chip mapping, parallel health/capabilities reporting, and CHIP-06 backward compatibility -- 31 new tests (96 total in chips/), zero new dependencies**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-03T16:43:49Z
- **Completed:** 2026-03-03T16:47:50Z
- **Tasks:** 1 (TDD: RED -> GREEN)
- **Files created:** 4
- **Files modified:** 1

## Accomplishments

- Built `createChip()` factory: pure function dispatching `ChipConfig.type` to `OpenAICompatibleChip` or `AnthropicChip`, with compile-time exhaustiveness guard and descriptive runtime error for unknown types
- Built `ChipRegistry` with full method surface: `loadFromFile()`, `get()`, `getByRole()`, `list()`, `isConfigured()`, `healthCheck()`, `capabilitiesReport()`, `register()`
- Implemented CHIP-06 backward compatibility: when `chipset.json` is absent, `loadFromFile()` returns silently, `isConfigured()` returns false, `get()` returns undefined -- existing users experience zero behavior change
- Created `ChipsetFileSchema` as a strict Zod schema: `version: z.literal(1)` guards against future breaking changes; roles validated post-instantiation so role->chip name mismatches throw a clear error
- Added IMP-03 threshold constants: `CHIPSET_FILE_VERSION=1` and `HEALTH_CHECK_PARALLEL_LIMIT=10` for use in thresholds.md (Plan 03)
- Updated barrel `src/chips/index.ts` with all new public exports

## Task Commits

TDD flow (RED then GREEN):

1. **RED: Failing tests** - `ccbbdf7c` (test)
2. **GREEN: Implementation** - `9751abc8` (feat)

## Files Created/Modified

- `src/chips/chip-factory.ts` - `createChip()` dispatch function, IMP-03 constants `CHIPSET_FILE_VERSION` and `HEALTH_CHECK_PARALLEL_LIMIT`
- `src/chips/chip-factory.test.ts` - 3 tests: openai-compatible dispatch, anthropic dispatch, unknown type throws
- `src/chips/chip-registry.ts` - `ChipRegistry` class, `ChipsetFileSchema`, `createChipRegistry()` factory
- `src/chips/chip-registry.test.ts` - 28 tests: loadFromFile (valid/missing/bad-json/bad-schema/bad-role), get, getByRole, list, isConfigured, healthCheck (parallel), capabilitiesReport, register
- `src/chips/index.ts` - Added exports: `createChip`, `ChipRegistry`, `createChipRegistry`, `ChipsetFileSchema`, `ChipsetFile`, `CHIPSET_FILE_VERSION`, `HEALTH_CHECK_PARALLEL_LIMIT`

## Decisions Made

- **roles uses `z.object({...optional fields})` not `z.record(z.enum(...))`**: Zod v4 changed behavior of `z.record` with enum keys -- it now requires ALL enumerated keys to be present. Using an object with optional fields gives the intended "any subset of roles" semantics while remaining explicit.
- **Atomic state commit in `loadFromFile()`**: New Maps are built completely (all chips instantiated, all roles validated) before assigning to `this.chips` and `this.roles`. Prevents partially-loaded state if validation fails mid-way.
- **ENOENT only**: Only `ENOENT` errors are silently swallowed in `loadFromFile()`. Other errors (permissions, I/O failures) propagate to callers -- only "file doesn't exist" is a normal backward-compat case.
- **`createChipRegistry()` factory with no auto-load**: Construction and file loading are separated. Callers decide when to call `loadFromFile()`. This is critical for CLI where path may come from a flag, and for tests that control the mock setup timing.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed ChipsetFileSchema roles definition for Zod v4**

- **Found during:** GREEN phase (first test run)
- **Issue:** `z.record(z.enum(['executor', 'grader', 'analyzer']), z.string())` in Zod v4 requires ALL enum keys to be present in the input object. The test fixture only had `executor` and `grader`, causing schema validation to fail with "Invalid input: expected string, received undefined" on the `analyzer` key.
- **Fix:** Changed roles to `z.object({ executor: z.string().optional(), grader: z.string().optional(), analyzer: z.string().optional() }).optional()`. Semantically equivalent (any subset of ChipRole -> chip name), but works correctly in Zod v4.
- **Files modified:** `src/chips/chip-registry.ts`
- **Commit:** `9751abc8` (GREEN commit)

**2. [Rule 1 - Bug] Fixed TypeScript exhaustiveness check in createChip()**

- **Found during:** TypeScript check (`npx tsc --noEmit`)
- **Issue:** `const exhaustiveCheck: never = config as any` generates a TS2322 error: "Type 'any' is not assignable to type 'never'". The `as any` cast breaks the never-assignment.
- **Fix:** Changed to `const _unreachable: never = config; void _unreachable;` (works because in the default branch, `config` IS typed as `never` when all union cases are handled) plus `(config as any).type` for the runtime error message.
- **Files modified:** `src/chips/chip-factory.ts`
- **Commit:** `9751abc8` (GREEN commit, same)

---

**Total deviations:** 2 auto-fixed (both Rule 1 - Bug)
**Impact on plan:** Both fixes were necessary for correctness. No scope creep.

## Test Count

| File | Tests |
|------|-------|
| chip-factory.test.ts | 3 |
| chip-registry.test.ts | 28 |
| **Plan 02 total** | **31** |
| Plan 01 carried forward | 65 |
| **chips/ module total** | **96** |

## Next Phase Readiness

- `ChipRegistry` is the single entry point for chip access -- Plan 03 (CLI) can call `createChipRegistry()` then `loadFromFile()` to bootstrap chip access
- `registry.get('chip-name')` resolves `--chip <name>` CLI flag to a live ModelChip
- `registry.getByRole('executor')` used in Phase 51 eval pipeline to get the execution chip
- `registry.healthCheck()` available for `skill-creator chip status` command (Plan 03)
- IMP-03 constants `CHIPSET_FILE_VERSION` and `HEALTH_CHECK_PARALLEL_LIMIT` exported and available for thresholds.md (Plan 03)

---

## Self-Check: PASSED

- FOUND: src/chips/chip-factory.ts
- FOUND: src/chips/chip-registry.ts
- FOUND: src/chips/chip-factory.test.ts
- FOUND: src/chips/chip-registry.test.ts
- FOUND: .planning/phases/50-model-abstraction/50-02-SUMMARY.md
- FOUND: ccbbdf7c (test commit: RED tests)
- FOUND: 9751abc8 (feat commit: GREEN implementation)
- Tests: 96/96 pass (npx vitest run src/chips/)
- TypeScript: no errors in src/chips/ (pre-existing corrective-rag.test.ts error unrelated)

---

*Phase: 50-model-abstraction*
*Completed: 2026-03-03*
