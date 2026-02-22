# Requirements: GSD Skill Creator

**Defined:** 2026-02-22
**Core Value:** Skills, agents, and teams must match official Claude Code patterns -- and the GSD ecosystem must provide spatial, visual, and operational tools that make complex system design tangible.

## v1.31 Requirements

Requirements for GSD-OS MCP Integration milestone. Each maps to roadmap phases.

### MCP Foundation Types

- [x] **MCPF-01**: Shared TypeScript interfaces exist for Tool, Resource, Prompt, ServerCapability, TransportConfig, McpMessage, and TraceEvent
- [x] **MCPF-02**: Rust FFI types exist matching TypeScript types with serde serialization and Tauri IPC command shapes
- [x] **MCPF-03**: Staging gate interfaces exist with TrustState enum, SecurityGate trait, HashRecord, and ValidationResult types

### MCP Host Manager

- [x] **HOST-01**: Host Manager can spawn stdio MCP server child processes and complete MCP handshake
- [x] **HOST-02**: Host Manager manages 3+ concurrent server connections independently
- [x] **HOST-03**: Host Manager detects server crashes and restarts with exponential backoff
- [x] **HOST-04**: Host Manager gracefully disconnects servers with cleanup
- [x] **HOST-05**: Host Manager discovers server capabilities via tools/list, resources/list, prompts/list and caches results
- [x] **HOST-06**: Tool Router routes tool calls to the correct server by name and handles timeouts
- [x] **HOST-07**: Server Registry persists config across restarts, tracks health status, and manages quarantine state
- [x] **HOST-08**: Trace Emitter emits structured TraceEvent for every MCP message via Tauri events with timestamps and latency

### Gateway Server

- [x] **GATE-01**: Gateway server starts on configurable port with Streamable HTTP transport
- [x] **GATE-02**: Gateway authenticates requests via pre-shared bearer token from ~/.gsd/gateway-token
- [x] **GATE-03**: Gateway rejects unauthorized requests with 401 and enforces role-based scopes
- [ ] **GATE-04**: project:list returns all projects with name, status, phase count, and last activity
- [ ] **GATE-05**: project:get returns full project config, phase state, and deliverables for a named project
- [ ] **GATE-06**: project:create creates a new project from a vision document
- [ ] **GATE-07**: project:execute-phase triggers execution of a specific phase for a named project
- [ ] **GATE-08**: skill:search returns matching skills with relevance scores for a query
- [ ] **GATE-09**: skill:inspect returns full SKILL.md content plus metadata for a named skill
- [ ] **GATE-10**: skill:activate loads a skill into the current chipset with token budget impact
- [ ] **GATE-11**: agent:spawn creates an agent with role, skills, and optional team assignment
- [ ] **GATE-12**: agent:status returns role, current task, token usage, and last activity for an agent
- [ ] **GATE-13**: agent:logs returns recent log entries for an agent
- [ ] **GATE-14**: workflow:research triggers research phase and returns findings summary
- [ ] **GATE-15**: workflow:requirements generates requirements document for a project
- [ ] **GATE-16**: workflow:plan creates execution plan with wave assignments
- [ ] **GATE-17**: workflow:execute triggers full GSD pipeline for a project
- [ ] **GATE-18**: session:query returns cross-project intelligence matches for a search query
- [ ] **GATE-19**: session:patterns returns detected patterns from skill-creator for an optional domain
- [ ] **GATE-20**: chipset:get returns current chipset YAML as structured object
- [ ] **GATE-21**: chipset:modify updates chipset and returns diff from previous
- [ ] **GATE-22**: chipset:synthesize produces FPGA-synthesized chipset from natural language description
- [ ] **GATE-23**: Resource providers expose project configs, skill registry, agent telemetry, and chipset state via URI templates
- [ ] **GATE-24**: Prompt templates exist for create-project, diagnose-agent, and optimize-chipset workflows
- [x] **GATE-25**: Gateway handles concurrent tool calls correctly and returns structured errors (never crashes)

### MCP Templates

- [x] **TMPL-01**: MCP Server Template generates a complete project with package.json, tsconfig.json, SDK setup, example tool/resource/prompt, tests, CLAUDE.md, and chipset.yaml
- [x] **TMPL-02**: Generated server project installs, builds, and type-checks with zero errors
- [x] **TMPL-03**: Generated server completes MCP handshake via MCP Inspector and example tool is invocable
- [x] **TMPL-04**: Generated test suite passes
- [x] **TMPL-05**: Total generation time from command to buildable project is under 120 seconds
- [x] **TMPL-06**: Custom project name is applied everywhere (package.json, server name, bin name)
- [x] **TMPL-07**: MCP Host Template generates valid host scaffold with client pool, lifecycle management, transport abstraction, and approval gates
- [x] **TMPL-08**: MCP Client Template generates valid client scaffold with tool discovery, resource subscription, and typed responses

### Agent Bridge

- [ ] **BRDG-01**: Generic Agent-Server Adapter creates valid MCP server from any AgentServerConfig
- [ ] **BRDG-02**: SCOUT agent exposed as MCP server with scout:research, scout:evaluate-dependency, and scout:survey-landscape tools plus 2 resources
- [ ] **BRDG-03**: VERIFY agent exposed as MCP server with verify:run-tests, verify:check-types, verify:audit, and verify:coverage tools plus 2 resources
- [ ] **BRDG-04**: Agent-Client Adapter gives agents MCP client capability with connection management and tool invocation helpers
- [ ] **BRDG-05**: EXEC agent can invoke SCOUT tools through MCP and receive results (inter-agent communication)
- [ ] **BRDG-06**: Concurrency limiting enforced per agent server (maxConcurrency exceeded returns retry error)
- [ ] **BRDG-07**: Agent handler errors produce structured MCP errors, never process crashes
- [ ] **BRDG-08**: Agent context isolation maintained between concurrent invocations

### MCP Security

- [x] **SECR-01**: Tool Definition Hash Gate computes SHA-256 of tool definitions on connect and detects changes
- [x] **SECR-02**: Hash Gate ignores benign reconnects (same definitions) without false alarms
- [x] **SECR-03**: Tool definition change triggers quarantine, user alert, and invocation pause
- [x] **SECR-04**: New servers enter quarantine period with all invocations requiring human approval
- [x] **SECR-05**: Trust decays after 30 days of inactivity, reverting to quarantine
- [x] **SECR-06**: Trust resets immediately on tool definition change regardless of established status
- [x] **SECR-07**: Invocation Validator blocks prompt injection patterns in tool parameters
- [x] **SECR-08**: Invocation Validator blocks path traversal attempts in file parameters
- [x] **SECR-09**: Invocation Validator enforces rate limiting per server and per tool
- [x] **SECR-10**: Audit Logger captures all tool invocations with caller, tool, sanitized params, response status, and timing
- [x] **SECR-11**: Audit Logger redacts sensitive parameters (API keys, tokens) in log entries
- [x] **SECR-12**: No staging gate bypass path exists -- all MCP tool invocations pass through staging
- [x] **SECR-13**: Agent-to-agent MCP calls pass through staging gates (same as external calls)
- [x] **SECR-14**: Concurrent security checks are thread-safe (no race conditions under parallel validation)

### MCP Presentation

- [ ] **PRES-01**: MCP Server block type exists in Blueprint Editor with tool/resource port rendering and status indicators
- [ ] **PRES-02**: MCP Tool block type exists with parameter preview and wireable to agent input ports
- [ ] **PRES-03**: MCP Resource block type exists with subscription visualization and wireable to context inputs
- [ ] **PRES-04**: Block wiring rules enforce type-safe connections with error messages for invalid wiring
- [ ] **PRES-05**: MCP Trace Panel displays real-time JSON-RPC message flow with latency sparklines and server/tool filtering
- [ ] **PRES-06**: Security Dashboard panel shows trust state per server, hash change alerts, and blocked call log
- [ ] **PRES-07**: Boot sequence displays MCP servers as peripherals with connection status and tool counts
- [ ] **PRES-08**: Tauri IPC commands expose host manager operations to frontend (connect, disconnect, invoke_tool, get_trace, get_trust_state)

### MCP Integration Testing

- [ ] **TEST-01**: End-to-end: Blueprint Editor block -> Tauri IPC -> Host Manager -> Server connection
- [ ] **TEST-02**: End-to-end: tool invocation -> staging gates -> server -> response -> trace panel
- [ ] **TEST-03**: End-to-end: external MCP client connects to gateway, discovers tools, invokes one, gets result
- [ ] **TEST-04**: End-to-end: template generates server -> build -> register with host -> tool calls work
- [ ] **TEST-05**: End-to-end: SCOUT server -> EXEC client -> result returned via MCP
- [ ] **TEST-06**: MCP overhead (host manager + staging gates) adds less than 50ms latency to tool invocations
- [ ] **TEST-07**: All 18 safety-critical security tests pass
- [ ] **TEST-08**: Test coverage across all MCP components exceeds 85%

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Remote & Advanced MCP

- **RMCP-01**: Remote MCP server hosting via Streamable HTTP client connections
- **RMCP-02**: MCP server marketplace / community registry
- **RMCP-03**: Visual MCP server builder (drag-and-drop tool creation)
- **RMCP-04**: OAuth 2.1 for remote gateway access
- **RMCP-05**: MCP sampling primitive support
- **RMCP-06**: Agent2Agent (A2A) protocol integration
- **RMCP-07**: MCP server hot-reload without restart
- **RMCP-08**: Cross-machine agent MCP topologies
- **RMCP-09**: MCP server performance profiling in Dashboard

## Out of Scope

| Feature | Reason |
|---------|--------|
| Remote server hosting (HTTP host connections) | v1.0 host is stdio-only for local servers; gateway uses HTTP outbound only |
| MCP sampling primitive | Security risk -- prevents conversation hijacking attacks per research |
| OAuth 2.1 remote auth | Local pre-shared token sufficient for v1; remote auth deferred |
| A2A protocol | Separate spec; MCP covers the inter-agent communication need |
| Visual server builder | Block system connects existing servers; building new ones uses templates |
| Server hot-reload | Restart with backoff sufficient for v1; hot-reload adds complexity |
| Cross-machine topologies | Local-first architecture constraint; network agents are future |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| MCPF-01 | Phase 293 | Complete |
| MCPF-02 | Phase 293 | Complete |
| MCPF-03 | Phase 293 | Complete |
| HOST-01 | Phase 294 | Complete |
| HOST-02 | Phase 294 | Complete |
| HOST-03 | Phase 294 | Complete |
| HOST-04 | Phase 294 | Complete |
| HOST-05 | Phase 294 | Complete |
| HOST-06 | Phase 294 | Complete |
| HOST-07 | Phase 294 | Complete |
| HOST-08 | Phase 294 | Complete |
| GATE-01 | Phase 295 | Complete |
| GATE-02 | Phase 295 | Complete |
| GATE-03 | Phase 295 | Complete |
| GATE-04 | Phase 296 | Pending |
| GATE-05 | Phase 296 | Pending |
| GATE-06 | Phase 296 | Pending |
| GATE-07 | Phase 296 | Pending |
| GATE-08 | Phase 296 | Pending |
| GATE-09 | Phase 296 | Pending |
| GATE-10 | Phase 296 | Pending |
| GATE-11 | Phase 297 | Pending |
| GATE-12 | Phase 297 | Pending |
| GATE-13 | Phase 297 | Pending |
| GATE-14 | Phase 297 | Pending |
| GATE-15 | Phase 297 | Pending |
| GATE-16 | Phase 297 | Pending |
| GATE-17 | Phase 297 | Pending |
| GATE-18 | Phase 297 | Pending |
| GATE-19 | Phase 297 | Pending |
| GATE-20 | Phase 298 | Pending |
| GATE-21 | Phase 298 | Pending |
| GATE-22 | Phase 298 | Pending |
| GATE-23 | Phase 298 | Pending |
| GATE-24 | Phase 298 | Pending |
| GATE-25 | Phase 295 | Complete |
| TMPL-01 | Phase 299 | Complete |
| TMPL-02 | Phase 299 | Complete |
| TMPL-03 | Phase 299 | Complete |
| TMPL-04 | Phase 299 | Complete |
| TMPL-05 | Phase 299 | Complete |
| TMPL-06 | Phase 299 | Complete |
| TMPL-07 | Phase 299 | Complete |
| TMPL-08 | Phase 299 | Complete |
| BRDG-01 | Phase 300 | Pending |
| BRDG-02 | Phase 300 | Pending |
| BRDG-03 | Phase 300 | Pending |
| BRDG-04 | Phase 300 | Pending |
| BRDG-05 | Phase 300 | Pending |
| BRDG-06 | Phase 300 | Pending |
| BRDG-07 | Phase 300 | Pending |
| BRDG-08 | Phase 300 | Pending |
| SECR-01 | Phase 301 | Complete |
| SECR-02 | Phase 301 | Complete |
| SECR-03 | Phase 301 | Complete |
| SECR-04 | Phase 301 | Complete |
| SECR-05 | Phase 301 | Complete |
| SECR-06 | Phase 301 | Complete |
| SECR-07 | Phase 301 | Complete |
| SECR-08 | Phase 301 | Complete |
| SECR-09 | Phase 301 | Complete |
| SECR-10 | Phase 301 | Complete |
| SECR-11 | Phase 301 | Complete |
| SECR-12 | Phase 301 | Complete |
| SECR-13 | Phase 301 | Complete |
| SECR-14 | Phase 301 | Complete |
| PRES-01 | Phase 302 | Pending |
| PRES-02 | Phase 302 | Pending |
| PRES-03 | Phase 302 | Pending |
| PRES-04 | Phase 302 | Pending |
| PRES-05 | Phase 302 | Pending |
| PRES-06 | Phase 302 | Pending |
| PRES-07 | Phase 302 | Pending |
| PRES-08 | Phase 302 | Pending |
| TEST-01 | Phase 303 | Pending |
| TEST-02 | Phase 303 | Pending |
| TEST-03 | Phase 303 | Pending |
| TEST-04 | Phase 303 | Pending |
| TEST-05 | Phase 303 | Pending |
| TEST-06 | Phase 303 | Pending |
| TEST-07 | Phase 303 | Pending |
| TEST-08 | Phase 303 | Pending |

**Coverage:**
- v1.31 requirements: 80 total
- Mapped to phases: 80
- Unmapped: 0

---
*Requirements defined: 2026-02-22*
*Last updated: 2026-02-22 after roadmap creation*
