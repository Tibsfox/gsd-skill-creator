---
phase: 50-model-abstraction
plan: "01"
subsystem: chips
tags: [ModelChip, zod, openai-compatible, anthropic, fetch, vitest, tdd]

requires: []

provides:
  - ModelChip interface (behavioral contract for all model backends)
  - OpenAICompatibleChip (Ollama, vLLM, LM Studio, etc.)
  - AnthropicChip (Anthropic Messages API)
  - Zod schemas for ChatMessage, ChatResponse, ChipCapabilities, ChipHealth, ChipConfig, ChatOptions
  - ChipRole type (executor | grader | analyzer) for ChipRegistry (Plan 02)
  - ChipConfig discriminated union schema on type field
  - IMP-03 threshold constants (DEFAULT_TIMEOUT_MS, DEFAULT_MAX_TOKENS, DEFAULT_TEMPERATURE)
  - IMP-05 cross-reference document mapping v1.49.14 deferred items to v1.49.15 phases

affects:
  - 50-02 (ChipRegistry uses ModelChip, ChipConfig, ChipRole from this plan)
  - 50-03 (thresholds.md registry -- constants already defined here)
  - Phase 51 (Multi-Model Evaluation -- all eval chips use ModelChip interface)
  - Phase 52 (MCP Infrastructure -- MCP LLM Wrapper extends chip auth pattern)
  - Phase 53 (Cost routing -- ADVN-03 mapping documented in IMP-05)
  - Phase 54 (Git worktrees -- ADVN-04 mapping documented in IMP-05)

tech-stack:
  added: []
  patterns:
    - "Zod discriminated union on type field for backend-specific config validation"
    - "Native fetch with AbortController for timeout handling (no axios)"
    - "Config-value-then-env-var API key resolution (apiKey ?? process.env.ANTHROPIC_API_KEY)"
    - "Fallback capabilities when endpoint unavailable (never throws in capabilities())"
    - "Health check: 401 = unavailable; any other status = available (Anthropic pattern)"

key-files:
  created:
    - src/chips/types.ts
    - src/chips/types.test.ts
    - src/chips/openai-compatible-chip.ts
    - src/chips/openai-compatible-chip.test.ts
    - src/chips/anthropic-chip.ts
    - src/chips/anthropic-chip.test.ts
    - src/chips/index.ts
    - .planning/phases/50-model-abstraction/IMP-05-CROSS-REFERENCE.md
  modified: []

key-decisions:
  - "Used Zod discriminatedUnion on 'type' field for ChipConfig -- openai-compatible requires baseUrl, anthropic does not"
  - "OpenAI-compatible chip uses native fetch (Node 18+), no axios -- keeps zero new dependencies"
  - "Anthropic capabilities() are hardcoded (no model listing endpoint in Anthropic API) -- no HTTP call needed"
  - "Anthropic health() treats 401 as unavailable, any other status as available -- 400 (bad payload) means auth succeeded"
  - "System messages extracted to top-level Anthropic 'system' param, not in messages array"
  - "IMP-05 cross-reference: ADVN-03 -> MESH-05 (Phase 53), ADVN-04 -> CTXT-03/04 (Phase 54), EREG-01 -> MCP-02 (Phase 52)"

patterns-established:
  - "ModelChip interface pattern: chat()/health()/capabilities() async trio -- all backends implement"
  - "Test pattern: vi.stubGlobal('fetch', mockFetch) + mockFetch.mockReset() in beforeEach for clean mock isolation"
  - "Chip constructor validates type field and throws descriptive error on mismatch"

requirements-completed: [CHIP-01, CHIP-02, CHIP-03, IMP-05]

duration: 7min
completed: "2026-03-03"
---

# Phase 50 Plan 01: ModelChip Abstraction Layer Summary

**ModelChip interface with Zod type system, OpenAI-compatible chip (Ollama/vLLM/LM Studio), and Anthropic chip behind a unified behavioral contract -- 65 tests, zero new dependencies**

## Performance

- **Duration:** ~7 min
- **Started:** 2026-03-03T16:33:32Z
- **Completed:** 2026-03-03T16:40:05Z
- **Tasks:** 2
- **Files created:** 8

## Accomplishments

- Defined the `ModelChip` interface -- the single contract that all model backends implement across v1.49.15
- Built `OpenAICompatibleChip` using native fetch: POST `/v1/chat/completions`, GET `/v1/models` for health and capabilities, falls back gracefully on network failure
- Built `AnthropicChip` with proper Anthropic API format conversion: system message extraction, hardcoded 200K context model list, health check via minimal messages request
- Created `ChipConfigSchema` as a Zod discriminated union on the `type` field -- clean validation that openai-compatible requires `baseUrl` while anthropic does not
- Exported IMP-03 threshold constants (`DEFAULT_TIMEOUT_MS=30000`, `DEFAULT_MAX_TOKENS=4096`, `DEFAULT_TEMPERATURE=0.0`)
- Created IMP-05 cross-reference document linking 3 v1.49.14 deferred items (ADVN-03, ADVN-04, EREG-01) to their v1.49.15 incorporation phases

## Task Commits

Each task was committed atomically:

1. **Task 1: Define ModelChip interface and chip type system** - `e0b45bbb` (feat)
2. **Task 2: Implement OpenAI-compatible and Anthropic chips** - `29121fe0` (feat)

_Note: TDD flow used for both tasks (RED tests written first, then GREEN implementation)_

## Files Created/Modified

- `src/chips/types.ts` - ModelChip interface, all Zod schemas, ChipRole type, IMP-03 constants
- `src/chips/types.test.ts` - 35 schema validation tests (valid/invalid inputs for all schemas)
- `src/chips/openai-compatible-chip.ts` - OpenAICompatibleChip implementing ModelChip via native fetch
- `src/chips/openai-compatible-chip.test.ts` - 15 tests: chat, health, capabilities, error handling
- `src/chips/anthropic-chip.ts` - AnthropicChip with Anthropic Messages API format conversion
- `src/chips/anthropic-chip.test.ts` - 15 tests: system extraction, health states, capabilities
- `src/chips/index.ts` - Barrel re-exporting all types, schemas, constants, and chip classes
- `.planning/phases/50-model-abstraction/IMP-05-CROSS-REFERENCE.md` - v1.49.14 deferred items mapping

## Decisions Made

- **Discriminated union for ChipConfig**: `z.discriminatedUnion('type', [...])` cleanly separates openai-compatible (needs baseUrl) from anthropic (no baseUrl needed). Follows same pattern as `src/den/chipset.ts`.
- **No axios**: Used Node 18+ native fetch with `AbortController` for timeout. Keeps zero new dependencies.
- **Anthropic health check strategy**: Send minimal 1-token request. 401 = invalid key. Any other status (200, 400) = key is valid and endpoint reached. This distinguishes auth failures from bad-payload responses.
- **Hardcoded Claude model list**: Anthropic API has no model listing endpoint. Capabilities return a static list of known models with 200K context. `capabilities()` makes no HTTP call.
- **System message extraction**: Anthropic API separates system prompt from conversation messages. The chip finds the first `role: 'system'` message and moves it to the top-level `system` field.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed mock isolation in chip tests**

- **Found during:** Task 2 (running tests)
- **Issue:** `vi.restoreAllMocks()` in afterEach does not reset `vi.fn()` call history when using `vi.stubGlobal`. Tests reading `mockFetch.mock.calls[0]` were seeing stale calls from prior tests within the same suite.
- **Fix:** Changed to `mockFetch.mockReset()` in `beforeEach` (resets call count and return values) and `vi.unstubAllGlobals()` in `afterEach`. This gives each test a clean slate.
- **Files modified:** `src/chips/openai-compatible-chip.test.ts`, `src/chips/anthropic-chip.test.ts`
- **Verification:** All 30 chip tests pass with correct call assertions
- **Committed in:** `29121fe0` (Task 2 commit)

**2. [Rule 1 - Bug] Fixed TypeScript type assertion in constructor-throws tests**

- **Found during:** Task 2 (`npx tsc --noEmit` check)
- **Issue:** Tests that intentionally pass the wrong `type` to each constructor used `as` casts that TypeScript still rejected because the casted discriminated union variant didn't have the required fields.
- **Fix:** Changed to `as any` with an eslint-disable comment. This is correct for intentional negative-path testing of runtime type guards.
- **Files modified:** `src/chips/openai-compatible-chip.test.ts`, `src/chips/anthropic-chip.test.ts`
- **Verification:** `npx tsc --noEmit` shows no chip-related errors
- **Committed in:** `29121fe0` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 - Bug)
**Impact on plan:** Both fixes were necessary for test correctness and type safety. No scope creep.

## Issues Encountered

- `.planning/` is gitignored in this project. IMP-05-CROSS-REFERENCE.md and SUMMARY.md live in `.planning/` and are not tracked in git. This is expected behavior per the project's `.gitignore` -- planning artifacts are local only.

## Next Phase Readiness

- `src/chips/` module is complete and all exports are ready for Plan 02 (ChipRegistry)
- `ChipRole` type (`executor | grader | analyzer`) is defined and available for registry use
- `ChipConfig` discriminated union handles both backends -- Plan 02 can parse `chipset.json` directly through this schema
- IMP-03 constants exported -- Plan 03 can reference them when building `thresholds.md`
- IMP-05 documented -- cross-reference complete, no further action needed

---

*Phase: 50-model-abstraction*
*Completed: 2026-03-03*
