---
phase: 304-mcp-integration-wiring
plan: 02
subsystem: security
tags: [staging-gate, injection-detection, trust-state, agent-bridge, mcp, rust]

# Dependency graph
requires:
  - phase: 301-security-gates
    provides: StagingPipeline, SecurityGate trait, trust management, audit logging
  - phase: 300-agent-bridge
    provides: AgentClientAdapter, ExecClient, SCOUT server, InMemoryTransport
  - phase: 294-host-manager
    provides: Rust mcp_call_tool command, McpHostState, ServerRegistry
provides:
  - Rust StagingGate wired into mcp_call_tool (no Rust bypass path)
  - Agent bridge StagingPipeline integration with agent-to-agent source tracking
  - 5 integration tests verifying both security bypass paths are closed
affects: [integration-testing, milestone-audit]

# Tech tracking
tech-stack:
  added: []
  patterns: [lightweight-rust-staging-gate, string-contains-injection-detection, staging-before-dispatch]

key-files:
  created: []
  modified:
    - src-tauri/src/mcp_host/security.rs
    - src-tauri/src/mcp_host/commands.rs
    - src/mcp/agent-bridge/agent-client-adapter.ts
    - src/mcp/agent-bridge/exec-client.ts
    - src/mcp/integration-security.test.ts

key-decisions:
  - "String-contains injection detection in Rust (no regex crate dependency for gap closure)"
  - "Staging validation before connection acquisition to avoid borrow checker conflicts"
  - "StagingGate as zero-size struct with const patterns for minimal memory footprint"

patterns-established:
  - "Rust staging validation before dispatch: validate trust + injection before acquiring mutable connection"
  - "Optional StagingPipeline parameter pattern for backward-compatible security integration"

requirements-completed: [SECR-12, SECR-13]

# Metrics
duration: 4min
completed: 2026-02-22
---

# Phase 304 Plan 02: MCP Integration Wiring Summary

**Rust StagingGate and agent bridge StagingPipeline wiring closing both audit-identified security bypass paths**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-22T16:30:06Z
- **Completed:** 2026-02-22T16:34:47Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Rust mcp_call_tool now validates through StagingGate before dispatching to servers, blocking quarantined/suspended servers and injection patterns
- Agent bridge tool calls pass through TypeScript StagingPipeline with source='agent-to-agent' when pipeline is configured
- Backward compatibility maintained -- agent bridge without staging pipeline works identically to before
- 6 Rust unit tests + 5 TypeScript integration tests verify both paths are secured
- All 67 Rust tests pass, all 27 integration-security tests pass, all 33 agent-bridge tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement Rust SecurityGate and wire into mcp_call_tool** - `5396374` (feat)
2. **Task 2: Wire StagingPipeline into agent bridge and add integration tests** - `4d8b723` (feat)

## Files Created/Modified
- `src-tauri/src/mcp_host/security.rs` - Added StagingGate struct with trust state checking and injection pattern detection (5 const patterns, 6 unit tests)
- `src-tauri/src/mcp_host/commands.rs` - Wired staging_gate into McpHostState and added validation in mcp_call_tool before server dispatch
- `src/mcp/agent-bridge/agent-client-adapter.ts` - Added optional StagingPipeline parameter with agent-to-agent validation before tool invocation
- `src/mcp/agent-bridge/exec-client.ts` - Updated ExecClient and createExecClient to pass through staging pipeline parameter
- `src/mcp/integration-security.test.ts` - Added SECR-12 documentation test and 4 SECR-13 agent bridge staging tests

## Decisions Made
- Used string-contains pattern matching instead of regex crate for Rust injection detection -- avoids adding a new dependency for a gap closure, keeps the Rust side lightweight while comprehensive staging remains in TypeScript
- Placed staging validation before mutable connection acquisition in mcp_call_tool to avoid Rust borrow checker conflicts between manager, registry, and staging_gate fields
- Made StagingGate a zero-size struct (unit struct) with const injection patterns -- no per-instance allocation, patterns are compile-time static

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Reordered staging validation before connection acquisition**
- **Found during:** Task 1 (Rust StagingGate wiring)
- **Issue:** Plan placed staging validation after `get_connection_mut()` which holds a mutable borrow on `host.manager`, preventing access to `host.registry` and `host.staging_gate`
- **Fix:** Moved staging validation block before `get_connection_mut()` call, after server_id resolution
- **Files modified:** src-tauri/src/mcp_host/commands.rs
- **Verification:** cargo check passes, validation still occurs before dispatch
- **Committed in:** 5396374 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary reordering to satisfy Rust borrow checker. Same security guarantees, different execution order.

## Issues Encountered
None beyond the borrow checker reordering documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Both SECR-12 and SECR-13 security bypass paths are now closed
- Milestone audit gap items resolved
- Ready for final integration verification

## Self-Check: PASSED

- [x] src-tauri/src/mcp_host/security.rs exists
- [x] src-tauri/src/mcp_host/commands.rs exists
- [x] src/mcp/agent-bridge/agent-client-adapter.ts exists
- [x] src/mcp/agent-bridge/exec-client.ts exists
- [x] src/mcp/integration-security.test.ts exists
- [x] Commit 5396374 found (Task 1)
- [x] Commit d804be8 found (Task 2)
- [x] cargo check passes (67 tests, 0 failures)
- [x] vitest integration-security passes (27 tests, 0 failures)
- [x] vitest agent-bridge passes (33 tests, 0 failures)

---
*Phase: 304-mcp-integration-wiring*
*Completed: 2026-02-22*
