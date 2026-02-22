---
phase: 294-host-manager-server-registry
plan: 01
subsystem: mcp-host
tags: [mcp, rust, tokio, process-management, json-rpc, exponential-backoff]

# Dependency graph
requires:
  - phase: 293-02
    provides: "Rust FFI types (TransportConfig, ServerCapability, Tool, Resource, Prompt) and SecurityGate trait"
provides:
  - "ServerConnection struct managing single MCP server child process: spawn, handshake, IO, disconnect, crash detection, backoff"
  - "HostManager struct orchestrating multiple ServerConnections: connect, disconnect, health check, auto-restart"
  - "ConnectionStatus enum (Connecting, Connected, Disconnected, Failed)"
  - "ServerInfo DTO for IPC responses with camelCase serialization"
affects: [294-02-router-registry, 294-03-trace-commands, 302-presentation, 303-integration-testing]

# Tech tracking
tech-stack:
  added: [uuid]
  patterns: [tokio-process-spawn, newline-delimited-json-rpc, exponential-backoff-with-cap, mcp-initialize-handshake]

key-files:
  created:
    - src-tauri/src/mcp_host/connection.rs
    - src-tauri/src/mcp_host/manager.rs
  modified:
    - src-tauri/src/mcp_host/mod.rs
    - src-tauri/Cargo.toml

key-decisions:
  - "tokio::process for async child process management -- required for non-blocking IO on stdio pipes"
  - "Newline-delimited JSON-RPC over stdio -- matches MCP specification for stdio transport"
  - "30-second timeout on all JSON-RPC requests -- prevents hangs from unresponsive servers"
  - "Exponential backoff: min(2^count, 30) seconds with max 5 retries -- balances recovery speed with stability"
  - "Capability discovery tolerates unsupported methods -- returns empty vec instead of failing handshake"
  - "Added tokio process and io-util features to Cargo.toml for async child process and BufReader support"

patterns-established:
  - "MCP host connection pattern: spawn -> handshake -> discover -> connected (or failed)"
  - "Health check + restart_failed as separate operations for composability"
  - "ServerConnection owns its child process and stdio handles; HostManager owns the connection map"

requirements-completed: [HOST-01, HOST-02, HOST-03, HOST-04]

# Metrics
duration: 6min
completed: 2026-02-22
---

# Phase 294 Plan 01: Server Lifecycle Summary

**ServerConnection for single-server MCP process management and HostManager for multi-server orchestration with crash detection and exponential backoff restart**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-22T15:00:00Z
- **Completed:** 2026-02-22T15:06:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- ServerConnection manages full MCP server lifecycle: spawn stdio child process, JSON-RPC initialize handshake, capability discovery (tools/resources/prompts), send_request with 30s timeout, graceful disconnect with 2s wait then kill
- HostManager orchestrates 3+ concurrent ServerConnections independently in a HashMap -- crashing one does not affect others
- Crash detection via is_alive() using try_wait(), automatic restart with exponential backoff (1s, 2s, 4s, 8s, 16s, 30s cap, max 5 retries)
- 14 unit tests passing across connection.rs, manager.rs, and types.rs

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ServerConnection for single MCP server process management** - `3b28caf` (feat)
2. **Task 2: Create HostManager for multi-server orchestration with crash detection and restart** - `5651986` (feat)

## Files Created/Modified
- `src-tauri/src/mcp_host/connection.rs` - ServerConnection struct with 13 methods: spawn, handshake, discover_list, send_request, write_message, read_message, disconnect, is_alive, backoff_duration, should_restart, record_restart, time_since_restart, restart_count
- `src-tauri/src/mcp_host/manager.rs` - HostManager struct with 11 methods: connect_server, disconnect_server, get_status, list_servers, check_health, restart_failed, server_count, get_connection, get_connection_mut, connections
- `src-tauri/src/mcp_host/mod.rs` - Updated module declarations and re-exports for connection and manager modules
- `src-tauri/Cargo.toml` - Added uuid dependency, tokio process and io-util features

## Decisions Made
- Used tokio::process instead of std::process for non-blocking child process IO
- Capability discovery tolerates unsupported methods (returns empty vec) to handle servers that don't implement all three list methods
- 30s timeout on all requests prevents indefinite hangs; 2s graceful shutdown window before force-kill
- Added uuid crate for generating unique JSON-RPC message IDs

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- ServerConnection and HostManager are available for Plans 02 and 03
- Plan 02 (ToolRouter + ServerRegistry) can import HostManager and ServerConnection
- Plan 03 (TraceEmitter + IPC commands) can import HostManager for Tauri state management
- All types compile and test cleanly with cargo check and cargo test

## Self-Check: PASSED

- FOUND: src-tauri/src/mcp_host/connection.rs
- FOUND: src-tauri/src/mcp_host/manager.rs
- FOUND: 294-01-SUMMARY.md
- FOUND: commit 3b28caf
- FOUND: commit 5651986

---
*Phase: 294-host-manager-server-registry*
*Completed: 2026-02-22*
