---
phase: 52-mcp-infrastructure
plan: "01"
subsystem: mcp
tags: [mcp, llm, chip-registry, request-queue, connection-pool, zod, vitest]

requires:
  - phase: 50-model-abstraction
    provides: ModelChip interface, ChipRegistry, ChatMessageSchema, ChatOptionsSchema

provides:
  - LlmMcpWrapper class with handleChat, handleHealth, handleCapabilities, handleModels
  - createLlmMcpServer factory (registers 4 MCP tools on McpServer)
  - Per-chip request queue (Map<string, Promise<void>> chain pattern)
  - QueueConfig schema with defaults (maxConcurrentPerChip=1, requestTimeoutMs=60000)
  - IMP-03 constants: DEFAULT_MAX_CONCURRENT_PER_CHIP, DEFAULT_REQUEST_TIMEOUT_MS, LLM_WRAPPER_VERSION

affects: [52-02, 52-03, 52-04, 53-mesh-orchestration, 54-context-integration]

tech-stack:
  added: []
  patterns:
    - "Per-chip request queue: Map<string, Promise<void>> chain ensures FIFO serial execution per chip, parallel across chips"
    - "MCP error response: { content: [{ type: text, text: JSON.stringify({ error }) }], isError: true }"
    - "Timeout: AbortController timer + Promise.race in executeWithTimeout helper"
    - "Connection pool: single ChipRegistry injected at construction, never re-created"

key-files:
  created:
    - src/mcp/llm-types.ts
    - src/mcp/llm-types.test.ts
    - src/mcp/llm-wrapper.ts
    - src/mcp/llm-wrapper.test.ts
  modified: []

key-decisions:
  - "Per-chip queue uses Map<string, Promise<void>> chain -- each new request awaits the previous promise for that chip, ensuring serial FIFO execution without a heavy queue library"
  - "Different-chip requests are fully parallel -- the queue is keyed per chip, so chip-a and chip-b never block each other"
  - "QueuedPromise pattern: result stored on promise object via _result slot to pass data out of the chained .then() without extra closure captures"
  - "Timeout uses AbortController + clearTimeout in finally block -- no timer leak on success, abort fires on delay"
  - "LlmToolRequestSchema chipName is optional (not required) -- omitting it queries all chips via registry bulk methods"
  - "LlmChatRequest requires chipName explicitly -- no implicit role fallback at MCP layer (callers name the chip)"
  - "Pre-existing TypeScript error in corrective-rag.test.ts is out of scope -- no errors in any llm-*.ts file"

patterns-established:
  - "MCP tool error: return isError:true with JSON.stringify({ error: message }) as text content"
  - "LlmMcpWrapper delegates bulk operations to registry (healthCheck/capabilitiesReport) and single operations to chip directly"

requirements-completed: [MCP-01, MCP-02]

duration: 4min
completed: 2026-03-03
---

# Phase 52, Plan 01: LLM MCP Wrapper Summary

**LlmMcpWrapper with 4 MCP tools (llm.chat, llm.health, llm.capabilities, llm.models), per-chip request queue for serial local model access, and connection-pooled ChipRegistry**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-03T17:49:54Z
- **Completed:** 2026-03-03T17:54:25Z
- **Tasks:** 2
- **Files modified:** 4 created

## Accomplishments

- LlmMcpWrapper class with 4 tool handlers, connection pool (shared ChipRegistry), and per-chip request queue (Map<string, Promise<void>> chain)
- createLlmMcpServer factory that registers all 4 tools on McpServer using the existing server.tool() pattern
- Zod schemas for LlmChatRequestSchema, LlmToolRequestSchema, QueueConfigSchema with IMP-03 constants
- 41 tests covering: all 4 tools, unknown chip errors, timeout, serialization (same-chip), parallelism (different-chip), createLlmMcpServer

## Task Commits

Each task was committed atomically (TDD: test then implementation):

1. **Task 1 RED: llm-types failing tests** - `32497a99` (test)
2. **Task 1 GREEN: llm-types implementation** - `03a9fa7c` (feat)
3. **Task 2 RED: llm-wrapper failing tests** - `01b1d855` (test)
4. **Task 2 GREEN: llm-wrapper implementation** - `1d4a24d2` (feat)

**Plan metadata:** (final commit pending)

_Note: TDD tasks have two commits each (test RED → feat GREEN)_

## Files Created/Modified

- `src/mcp/llm-types.ts` - Zod schemas (LlmChatRequestSchema, LlmToolRequestSchema, QueueConfigSchema) and IMP-03 constants
- `src/mcp/llm-types.test.ts` - 24 tests validating schema accept/reject behavior and constant values
- `src/mcp/llm-wrapper.ts` - LlmMcpWrapper class and createLlmMcpServer factory
- `src/mcp/llm-wrapper.test.ts` - 17 tests covering all tools, pool, queue, errors

## Decisions Made

- Per-chip queue uses `Map<string, Promise<void>>` chain -- each new request awaits the previous promise for that chip. FIFO serial execution without heavy queue library.
- Different-chip requests are fully parallel -- queue is keyed per chip, chip-a and chip-b never block each other.
- QueuedPromise pattern: `_result` slot on the promise object passes data out of the .then() chain without extra closure captures.
- Timeout uses AbortController + clearTimeout in finally -- no timer leaks on success, abort fires precisely at requestTimeoutMs.
- LlmToolRequestSchema chipName is optional -- omitting queries all chips via registry bulk methods (healthCheck/capabilitiesReport).
- LlmChatRequest requires chipName explicitly -- no implicit role fallback at MCP layer (callers name the chip).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Pre-existing TypeScript error in `src/retrieval/corrective-rag.test.ts` (sessionId type mismatch) -- out of scope, logged, not fixed. No errors in any `src/mcp/llm-*.ts` file.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- LlmMcpWrapper provides the local LLM bridge ready for 52-02 (Mesh Discovery) and 52-03 (DACP transport)
- Connection pool pattern established: inject ChipRegistry once, share across all tool handlers
- Request queue pattern established: Map<string, Promise<void>> chain can be reused for other per-resource serialization needs in Phase 53

## Self-Check: PASSED

- FOUND: src/mcp/llm-types.ts
- FOUND: src/mcp/llm-types.test.ts
- FOUND: src/mcp/llm-wrapper.ts
- FOUND: src/mcp/llm-wrapper.test.ts
- FOUND: .planning/phases/52-mcp-infrastructure/52-01-SUMMARY.md
- FOUND commit: 32497a99 (test RED: llm-types)
- FOUND commit: 03a9fa7c (feat GREEN: llm-types)
- FOUND commit: 01b1d855 (test RED: llm-wrapper)
- FOUND commit: 1d4a24d2 (feat GREEN: llm-wrapper)

---
*Phase: 52-mcp-infrastructure*
*Completed: 2026-03-03*
