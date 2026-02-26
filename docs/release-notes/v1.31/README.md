# v1.31 — GSD-OS MCP Integration

**Shipped:** 2026-02-22
**Phases:** 293-304 (12 phases) | **Plans:** 28 | **Commits:** 37 | **Requirements:** 80 | **Tests:** 838 (771 TS + 67 Rust) | **LOC:** ~24K

Make GSD-OS a first-class MCP citizen — both as an MCP Host (Rust backend managing server processes) and as an MCP Server (exposing 19 tools to external AI agents). Includes template skills, agent bridge adapters, staging security gates, blueprint editor integration, and comprehensive integration testing.

### Key Features

**Foundation Types (Phase 293):**
- Shared TypeScript + Rust type definitions for all MCP structures
- Zod v4 schemas for runtime validation, serde round-trip parity for Rust FFI
- Staging gate interfaces: TrustState enum, SecurityGate trait, HashRecord, ValidationResult

**Rust MCP Host Manager (Phase 294):**
- ServerConnection: stdio process spawn, MCP handshake, crash detection, exponential backoff restart
- HostManager: multi-server orchestration, concurrent connection management
- ToolRouter: tool-name-to-server dispatch with timeout handling
- ServerRegistry: JSON persistence, health tracking, quarantine state
- TraceEmitter: ring buffer, Tauri event emission for every MCP message
- 5 Tauri IPC commands: connect, disconnect, list, call_tool, get_trace

**Gateway Server (Phases 295-298):**
- Streamable HTTP transport with per-session isolation
- Bearer token auth from ~/.gsd/gateway-token with timing-safe comparison
- 19 tools across 6 groups: project (list/get/create/execute-phase), skill (search/inspect/activate), agent (spawn/status/logs), workflow (research/requirements/plan/execute), session (query/patterns), chipset (get/modify/synthesize)
- 4 resource providers via URI templates (project configs, skill registry, agent telemetry, chipset state)
- 3 prompt templates (create-project, diagnose-agent, optimize-chipset)
- Per-tool scope enforcement: admin > write > read, deny by default for unknown tools

**MCP Templates (Phase 299):**
- Server template: package.json, tsconfig.json, SDK setup, example tool/resource/prompt, tests, CLAUDE.md, chipset.yaml
- Host template: client pool, lifecycle management, transport abstraction, approval gates
- Client template: tool discovery, resource subscription, typed responses
- Custom project name propagation, sub-120s generation time

**Agent Bridge (Phase 300):**
- Generic AgentServerAdapter factory creating MCP servers from config
- SCOUT exposed with scout.research, scout.evaluate-dependency, scout.survey-landscape tools + 2 resources
- VERIFY exposed with verify.run-tests, verify.check-types, verify.audit, verify.coverage tools + 2 resources
- AgentClientAdapter giving EXEC MCP client capability
- Counting semaphore for concurrency limiting, per-invocation context isolation

**Security Pipeline (Phase 301):**
- Hash gate: SHA-256 tool definition hashing with deterministic sorting, drift detection
- Trust manager: quarantine → provisional → trusted lifecycle, 30-day decay, immediate reset on change
- Invocation validator: prompt injection blocking, path traversal prevention
- Rate limiter: per-server and per-tool limits
- Audit logger: full invocation logging with API key/token redaction
- StagingPipeline as single unbypassable SecurityGate implementation
- Per-server promise queues for thread-safe concurrent validation

**Presentation (Phase 302):**
- Blueprint Editor: MCP Server, Tool, Resource block types with port rendering and status indicators
- Wiring engine with type-safe connections and deny-by-default rules
- MCP Trace Panel: real-time JSON-RPC flow with SVG sparklines and server/tool filtering
- Security Dashboard: trust state per server, hash change alerts, blocked call log
- Boot peripherals: Amiga POST aesthetic, green monospace, trust abbreviations [Q/P/T/S]
- Tauri IPC bridge with dynamic import for non-Tauri environment safety

**Integration Testing (Phase 303):**
- 30 end-to-end tests across all MCP subsystems
- 18 safety-critical security tests (mandatory-pass)
- Performance verification: MCP overhead < 50ms
- Coverage validation: 85%+ across all MCP components

**Integration Wiring (Phase 304 — Gap Closure):**
- Production gateway factory registering all 19 tools across 6 groups
- Per-tool scope enforcement via canInvokeTool at HTTP level with body buffering
- Rust StagingGate: zero-size struct, string-contains injection detection, validates before mcp_call_tool
- Agent bridge staging: optional StagingPipeline with source='agent-to-agent'
- E2E test discovering and invoking tools from all 6 groups

---
