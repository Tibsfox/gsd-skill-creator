---
phase: 304-mcp-integration-wiring
plan: 01
subsystem: gateway
tags: [mcp, gateway, scope-enforcement, tool-registration, e2e-testing]

# Dependency graph
requires:
  - phase: 300-agent-workflow-session-tools
    provides: "agent-tools, workflow-tools, session-tools registration functions"
  - phase: 298-gateway-server
    provides: "createGsdGatewayFactory, startGateway, StreamableHTTPServerTransport setup"
  - phase: 301-security-gates
    provides: "canInvokeTool, getToolScope, scope enforcement helpers"
provides:
  - "Production gateway factory registering all 19 tools across 6 groups"
  - "Per-tool scope enforcement via canInvokeTool at HTTP level"
  - "E2E integration test covering all 6 tool groups over real HTTP"
affects: [304-02, integration-testing, gateway]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "rawBody property on IncomingMessage for body pre-processing with Hono adapter"
    - "HTTP-level scope enforcement before MCP SDK transport dispatch"

key-files:
  created: []
  modified:
    - src/mcp/gateway/create-gateway-server.ts
    - src/mcp/gateway/server.ts
    - src/mcp/integration.test.ts

key-decisions:
  - "rawBody pattern for body buffering instead of creating new IncomingMessage-compatible Readable streams"
  - "Scope enforcement at HTTP level (server.ts) not at McpServer tool handler level -- auth info available at HTTP layer"

patterns-established:
  - "Body buffering + rawBody for pre-dispatch inspection in gateway server"

requirements-completed: [GATE-03, GATE-11, GATE-12, GATE-13, GATE-14, GATE-15, GATE-16, GATE-17, GATE-18, GATE-19, TEST-03]

# Metrics
duration: 6min
completed: 2026-02-22
---

# Phase 304 Plan 01: MCP Integration Wiring Summary

**All 19 gateway tools wired into production factory with per-tool scope enforcement via canInvokeTool and rawBody buffering pattern**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-22T16:30:02Z
- **Completed:** 2026-02-22T16:36:31Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Wired agent (3), workflow (4), and session (2) tools into createGsdGatewayFactory alongside existing chipset (3), project (4), and skill (3) tools -- 19 total
- Added per-tool scope enforcement via body buffering and canInvokeTool() check before every tools/call request reaches the MCP server
- Added E2E test discovering all 19 tools from 6 groups and invoking one from each group over real HTTP
- Updated scope test to verify read-only token receives PERMISSION_DENIED for chipset.modify

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire all 19 tools into createGsdGatewayFactory and add per-tool scope enforcement** - `4d8b723` (feat)
2. **Task 2: Update gateway E2E integration test to cover all 6 tool groups** - `b519f13` (test)

## Files Created/Modified
- `src/mcp/gateway/create-gateway-server.ts` - Added imports and registration for agent, workflow, session tools; extended GatewayFactoryOptions
- `src/mcp/gateway/server.ts` - Added body buffering, extractToolCallName, canInvokeTool scope check before transport dispatch
- `src/mcp/integration.test.ts` - Added "discovers all 19 tools" and "invokes one from each group" tests; updated scope test

## Decisions Made
- Used rawBody property pattern (recognized by Hono/@hono/node-server adapter) instead of creating synthetic IncomingMessage streams -- avoids stream compatibility issues with the MCP SDK transport layer
- Scope enforcement happens at HTTP level in server.ts (where auth info is available) rather than at the McpServer tool handler level (where auth context is not accessible)
- Shared state instances (AgentRegistry, WorkflowEngine, SessionStore) created outside the factory closure, matching the existing chipsetState pattern

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed body forwarding approach for StreamableHTTPServerTransport**
- **Found during:** Task 1 (scope enforcement implementation)
- **Issue:** Plan suggested creating a buffered IncomingMessage via new Readable(), but the Hono adapter used internally by the MCP SDK requires specific stream properties that a plain Readable does not provide. All POST requests failed with "Cannot read properties of undefined (reading 'length')"
- **Fix:** Used rawBody property pattern instead -- set `req.rawBody = bufferedBody` which the Hono adapter recognizes and uses directly, avoiding stream re-reading
- **Files modified:** src/mcp/gateway/server.ts
- **Verification:** All 248 gateway tests pass, all 32 integration tests pass
- **Committed in:** 4d8b723 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential fix for body forwarding compatibility with MCP SDK internals. No scope creep.

## Issues Encountered
None beyond the deviation documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 19 tools accessible from the production gateway
- Per-tool scope enforcement verified by E2E test
- Ready for 304-02 (remaining integration wiring tasks)
- 771 MCP tests pass with zero regressions

---
*Phase: 304-mcp-integration-wiring*
*Completed: 2026-02-22*
