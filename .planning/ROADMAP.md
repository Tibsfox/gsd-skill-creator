# Roadmap: GSD Skill Creator

## Milestones

- ✅ **v1.0-v1.11** — Foundation through Chipset Architecture (Phases 1-87)
- ✅ **v1.12** — GSD Planning Docs Dashboard (Phases 88-93, shipped 2026-02-09)
- ✅ **v1.12.1** — Live Metrics Dashboard (Phases 94-100, shipped 2026-02-10)
- ✅ **v1.13** — Session Lifecycle & Workflow Coprocessor (Phases 101-114, shipped 2026-02-11)
- ✅ **v1.14** — Promotion Pipeline (Phases 115-122, shipped 2026-02-13)
- ✅ **v1.15** — Live Dashboard Terminal (Phases 123-127, shipped 2026-02-13)
- ✅ **v1.16** — Dashboard Console & Milestone Ingestion (Phases 128-133, shipped 2026-02-13)
- ✅ **v1.17** — Staging Layer (Phases 134-141, shipped 2026-02-13)
- ✅ **v1.18** — Information Design System (Phases 142-148, shipped 2026-02-14)
- ✅ **v1.19** — Budget Display Overhaul (Phases 149-151, shipped 2026-02-14)
- ✅ **v1.20** — Dashboard Assembly (Phases 152-157, shipped 2026-02-14)
- ✅ **v1.21** — GSD-OS Desktop Foundation (Phases 158-168, shipped 2026-02-14)
- ✅ **v1.22** — Minecraft Knowledge World (Phases 169-198, shipped 2026-02-19)
- ✅ **v1.23** — Project AMIGA (Phases 199-222, shipped 2026-02-19)
- ✅ **v1.24** — GSD Conformance Audit & Hardening (Phases 223-230, shipped 2026-02-19)
- ✅ **v1.25** — Ecosystem Integration (Phases 231-235, shipped 2026-02-19)
- ✅ **v1.26** — Aminet Archive Extension Pack (Phases 236-242, shipped 2026-02-19)
- ✅ **v1.27** — Foundational Knowledge Packs (Phases 243-254, shipped 2026-02-20)
- ✅ **v1.28** — GSD Den Operations (Phases 255-261, shipped 2026-02-21)
- ✅ **v1.29** — Electronics Educational Pack (Phases 262-278, shipped 2026-02-21)
- ✅ **v1.30** — Vision-to-Mission Pipeline (Phases 279-292, shipped 2026-02-22)
- 🔧 **v1.31** — GSD-OS MCP Integration (Phases 293-304, gap closure in progress)

## Phases

<details>
<summary>✅ v1.30 Vision-to-Mission Pipeline (Phases 279-292) — SHIPPED 2026-02-22</summary>

- [x] Phase 279: Types & Schemas (2/2 plans) — completed 2026-02-21
- [x] Phase 280: Vision Document Processing (2/2 plans) — completed 2026-02-21
- [x] Phase 281: Research Reference Compilation (2/2 plans) — completed 2026-02-21
- [x] Phase 282: Mission Package Assembly (2/2 plans) — completed 2026-02-21
- [x] Phase 283: Wave Planning (2/2 plans) — completed 2026-02-21
- [x] Phase 284: Model Assignment (2/2 plans) — completed 2026-02-22
- [x] Phase 285: Cache Optimization (2/2 plans) — completed 2026-02-22
- [x] Phase 286: Test Plan Generation (2/2 plans) — completed 2026-02-22
- [x] Phase 287: Template System (2/2 plans) — completed 2026-02-22
- [x] Phase 288: Mission Assembly Integration Wiring (2/2 plans) — completed 2026-02-22
- [x] Phase 289: Pipeline Orchestrator (2/2 plans) — completed 2026-02-22
- [x] Phase 290: Integration & Testing (2/2 plans) — completed 2026-02-22
- [x] Phase 291: Template System Pipeline Integration (1/1 plans) — completed 2026-02-22
- [x] Phase 292: Pipeline Output Enrichment (1/1 plans) — completed 2026-02-22

</details>

### 🔧 v1.31 GSD-OS MCP Integration (Phases 293-304) — Gap Closure

**Milestone Goal:** Make GSD-OS a first-class MCP citizen -- both as a Host (managing MCP server connections from the Tauri backend) and as a Server (exposing GSD-OS to external AI agents via 19+ tools). Includes template skills, agent bridge adapters, staging security gates, dashboard integration, and a 95-test verification suite.

- [x] **Phase 293: Foundation Types** - Shared TypeScript + Rust type definitions for all MCP structures (completed 2026-02-22)
- [x] **Phase 294: Host Manager & Server Registry** - Rust server lifecycle, client pool, tool routing, trace emission, config persistence (completed 2026-02-22)
- [x] **Phase 295: Gateway Server Core** - Streamable HTTP server with authentication and error handling (completed 2026-02-22)
- [x] **Phase 296: Gateway Project & Skill Tools** - project:* and skill:* tool implementations (7 tools) (completed 2026-02-22)
- [x] **Phase 297: Gateway Agent, Workflow & Session Tools** - agent:*, workflow:*, session:* tool implementations (9 tools) (completed 2026-02-22)
- [x] **Phase 298: Gateway Chipset, Resources & Prompts** - chipset:* tools, 4 resource providers, 3 prompt templates (completed 2026-02-22)
- [x] **Phase 299: MCP Templates** - Server, host, and client project scaffold generators (completed 2026-02-22)
- [x] **Phase 300: Agent Bridge** - Agent-Server and Agent-Client adapters with SCOUT, VERIFY, and EXEC wiring (completed 2026-02-22)
- [x] **Phase 301: Security Gates** - Hash verification, trust decay, invocation validation, audit logging (completed 2026-02-22)
- [x] **Phase 302: Presentation** - Blueprint Editor blocks, trace panel, security dashboard, boot sequence, Tauri IPC (completed 2026-02-22)
- [x] **Phase 303: Integration Testing** - End-to-end tests, performance verification, safety-critical tests, coverage validation (completed 2026-02-22)
- [ ] **Phase 304: MCP Integration Wiring** - Gap closure: gateway factory assembly, scope enforcement, staging pipeline wiring

## Phase Details

### Phase 293: Foundation Types
**Goal**: All MCP components share a single source of truth for types -- TypeScript interfaces, Rust FFI counterparts, and staging gate contracts
**Depends on**: Nothing (first phase of v1.31)
**Requirements**: MCPF-01, MCPF-02, MCPF-03
**Success Criteria** (what must be TRUE):
  1. TypeScript code can import Tool, Resource, Prompt, ServerCapability, TransportConfig, McpMessage, and TraceEvent types from a shared module
  2. Rust code compiles with matching FFI types that serialize/deserialize via serde and expose Tauri IPC command shapes
  3. Staging gate interfaces (TrustState enum, SecurityGate trait, HashRecord, ValidationResult) are importable by both TypeScript and Rust consumers
**Plans:** 2/2 plans complete
Plans:
- [ ] 293-01-PLAN.md — TypeScript MCP and staging gate types with Zod schemas
- [ ] 293-02-PLAN.md — Rust FFI types mirroring TypeScript, wired into Tauri

### Phase 294: Host Manager & Server Registry
**Goal**: GSD-OS can manage MCP server processes from its Tauri backend -- spawning, monitoring, restarting, disconnecting, discovering capabilities, routing tool calls, persisting config, and emitting trace events
**Depends on**: Phase 293
**Requirements**: HOST-01, HOST-02, HOST-03, HOST-04, HOST-05, HOST-06, HOST-07, HOST-08
**Success Criteria** (what must be TRUE):
  1. Host Manager spawns a stdio MCP server, completes handshake, and the server appears as connected with discovered capabilities
  2. Three independent servers run concurrently -- crashing one does not affect the others, and the crashed server restarts automatically with backoff
  3. Tool calls route to the correct server by tool name and return results (or timeout errors) to the caller
  4. Server configs persist across Tauri app restarts, and a previously-quarantined server remains quarantined after restart
  5. Every MCP message produces a TraceEvent with timestamp and latency, observable via Tauri event subscription
**Plans**: 3 plans
Plans:
- [ ] 294-01-PLAN.md — Server lifecycle: ServerConnection (spawn, handshake, disconnect) and HostManager (multi-server, crash detection, restart)
- [ ] 294-02-PLAN.md — Tool routing and config persistence: ToolRouter (name-to-server dispatch) and ServerRegistry (JSON file persistence, quarantine state)
- [ ] 294-03-PLAN.md — Trace emission and Tauri IPC: TraceEmitter (ring buffer, event emission) and 5 IPC commands (connect, disconnect, list, call_tool, get_trace)

### Phase 295: Gateway Server Core
**Goal**: External MCP clients can connect to GSD-OS over HTTP, authenticate, and receive proper error responses
**Depends on**: Phase 293
**Requirements**: GATE-01, GATE-02, GATE-03, GATE-25
**Success Criteria** (what must be TRUE):
  1. Gateway server starts on a configurable port and accepts Streamable HTTP MCP connections
  2. Requests with a valid bearer token from ~/.gsd/gateway-token succeed; requests without it receive 401
  3. Role-based scopes restrict tool access -- a read-only token cannot invoke write tools
  4. Concurrent tool calls execute without crashes, and malformed requests produce structured JSON-RPC errors
**Plans**: 2/2 plans complete
Plans:
- [x] 295-01-PLAN.md -- Gateway server with Streamable HTTP transport and authentication
- [x] 295-02-PLAN.md -- Concurrency safety, structured errors, and integration tests

### Phase 296: Gateway Project & Skill Tools
**Goal**: External agents can discover, inspect, and manage GSD projects and skills through MCP tool calls
**Depends on**: Phase 295
**Requirements**: GATE-04, GATE-05, GATE-06, GATE-07, GATE-08, GATE-09, GATE-10
**Success Criteria** (what must be TRUE):
  1. project:list returns all projects with name, status, phase count, and last activity -- and the list updates when a new project is created via project:create
  2. project:get returns full config, phase state, and deliverables for a named project
  3. project:execute-phase triggers phase execution and returns a result indicating success or failure
  4. skill:search returns relevance-scored results for a query, and skill:inspect returns the full SKILL.md content for a named skill
  5. skill:activate loads a skill into the chipset and reports the token budget impact
**Plans:** 2/2 plans complete
Plans:
- [x] 296-01-PLAN.md -- Project tool implementations (project:list, project:get, project:create, project:execute-phase)
- [x] 296-02-PLAN.md -- Skill tool implementations (skill:search, skill:inspect, skill:activate)

### Phase 297: Gateway Agent, Workflow & Session Tools
**Goal**: External agents can spawn and monitor GSD agents, trigger workflow stages, and query cross-project intelligence
**Depends on**: Phase 295
**Requirements**: GATE-11, GATE-12, GATE-13, GATE-14, GATE-15, GATE-16, GATE-17, GATE-18, GATE-19
**Success Criteria** (what must be TRUE):
  1. agent:spawn creates an agent with the specified role and skills, and agent:status returns its current state including token usage
  2. agent:logs returns recent log entries for a running agent
  3. workflow:research, workflow:requirements, workflow:plan, and workflow:execute each trigger their respective GSD pipeline stage and return structured results
  4. session:query returns cross-project intelligence matches for a search query, and session:patterns returns detected patterns for a domain
**Plans:** 3/3 plans complete
Plans:
- [x] 297-01-PLAN.md — Agent tools: spawn, status, logs (24 tests)
- [x] 297-02-PLAN.md — Workflow tools: research, requirements, plan, execute (23 tests)
- [x] 297-03-PLAN.md — Session tools: query, patterns (23 tests)

### Phase 298: Gateway Chipset, Resources & Prompts
**Goal**: External agents can read and modify chipset state, browse GSD resources via URI templates, and use prompt templates for common workflows
**Depends on**: Phase 295
**Requirements**: GATE-20, GATE-21, GATE-22, GATE-23, GATE-24
**Success Criteria** (what must be TRUE):
  1. chipset:get returns the current chipset YAML as a structured object, and chipset:modify updates it and returns a diff
  2. chipset:synthesize produces a valid chipset from a natural language description
  3. Resource providers expose project configs, skill registry, agent telemetry, and chipset state via MCP resource protocol with URI templates
  4. Prompt templates for create-project, diagnose-agent, and optimize-chipset return structured prompts with user-provided arguments filled in
**Plans:** 2/2 plans complete
Plans:
- [x] 298-01-PLAN.md -- Chipset tools (get, modify, synthesize), resource providers, gateway factory (47 tests)
- [x] 298-02-PLAN.md -- Prompt templates (create-project, diagnose-agent, optimize-chipset) and integration tests (30 tests)

### Phase 299: MCP Templates
**Goal**: Users can scaffold complete, working MCP server, host, and client projects from templates -- each generated project builds, type-checks, and passes its own tests
**Depends on**: Phase 293
**Requirements**: TMPL-01, TMPL-02, TMPL-03, TMPL-04, TMPL-05, TMPL-06, TMPL-07, TMPL-08
**Success Criteria** (what must be TRUE):
  1. Generated MCP server project has package.json, tsconfig.json, SDK setup, example tool/resource/prompt, tests, CLAUDE.md, and chipset.yaml -- and builds with zero errors
  2. Generated server completes MCP handshake via MCP Inspector, and the example tool is invocable and returns a result
  3. Custom project name propagates to package.json name, server name, and bin name
  4. MCP Host template generates a valid scaffold with client pool, lifecycle management, and approval gates; MCP Client template generates a valid scaffold with tool discovery and typed responses
  5. Total generation time from command to buildable project is under 120 seconds
**Plans:** 3/3 plans complete
Plans:
- [x] 299-01-PLAN.md -- Server template generator with example tool/resource/prompt (68 tests)
- [x] 299-02-PLAN.md -- Host and client template generators (74 tests)

### Phase 300: Agent Bridge
**Goal**: GSD agents communicate through MCP -- SCOUT and VERIFY are accessible as MCP servers, and EXEC can invoke tools on other agents as an MCP client
**Depends on**: Phase 293
**Requirements**: BRDG-01, BRDG-02, BRDG-03, BRDG-04, BRDG-05, BRDG-06, BRDG-07, BRDG-08
**Success Criteria** (what must be TRUE):
  1. SCOUT is accessible as an MCP server with scout:research, scout:evaluate-dependency, scout:survey-landscape tools and 2 resources
  2. VERIFY is accessible as an MCP server with verify:run-tests, verify:check-types, verify:audit, verify:coverage tools and 2 resources
  3. EXEC can invoke SCOUT tools through MCP and receive structured results (inter-agent round-trip works)
  4. Concurrency limiting enforced -- exceeding maxConcurrency returns a retry error, and handler errors produce structured MCP errors without crashing the process
  5. Context isolation maintained between concurrent invocations on the same agent server
**Plans**: TBD

### Phase 301: Security Gates
**Goal**: All MCP tool invocations pass through staging gates that verify tool definitions, manage trust state, validate invocations, and produce an audit trail -- with no bypass path
**Depends on**: Phase 293
**Requirements**: SECR-01, SECR-02, SECR-03, SECR-04, SECR-05, SECR-06, SECR-07, SECR-08, SECR-09, SECR-10, SECR-11, SECR-12, SECR-13, SECR-14
**Success Criteria** (what must be TRUE):
  1. Connecting to a server computes SHA-256 of its tool definitions; reconnecting with the same definitions produces no alerts, but changing a definition triggers quarantine and invocation pause
  2. New servers start in quarantine with human approval required for every invocation; trust decays to quarantine after 30 days of inactivity and resets immediately on tool definition change
  3. Prompt injection patterns and path traversal attempts in tool parameters are blocked; rate limiting enforced per server and per tool
  4. Every tool invocation is logged with caller, tool, sanitized params (API keys/tokens redacted), response status, and timing
  5. Agent-to-agent MCP calls pass through the same staging gates as external calls, and concurrent security checks are thread-safe
**Plans:** 3/3 plans complete
Plans:
- [x] 301-01-PLAN.md -- Hash gate and trust manager (SECR-01 through SECR-06)
- [x] 301-02-PLAN.md -- Invocation validator and rate limiter (SECR-07 through SECR-09)
- [x] 301-03-PLAN.md -- Audit logger and staging pipeline (SECR-10 through SECR-14)

### Phase 302: Presentation
**Goal**: The GSD-OS desktop displays MCP infrastructure visually -- servers as blueprint blocks, real-time message traces, security status, and boot sequence peripherals -- all driven by Tauri IPC from the Rust host manager
**Depends on**: Phase 294, Phase 301
**Requirements**: PRES-01, PRES-02, PRES-03, PRES-04, PRES-05, PRES-06, PRES-07, PRES-08
**Success Criteria** (what must be TRUE):
  1. Blueprint Editor displays MCP Server, Tool, and Resource block types with ports, status indicators, and parameter previews
  2. Block wiring enforces type-safe connections and shows error messages for invalid wiring attempts
  3. MCP Trace Panel displays real-time JSON-RPC message flow with latency sparklines and server/tool filtering
  4. Security Dashboard shows trust state per server, hash change alerts, and a log of blocked calls
  5. Boot sequence displays MCP servers as peripherals with connection status and tool counts, and Tauri IPC commands (connect, disconnect, invoke_tool, get_trace, get_trust_state) are callable from the frontend
**Plans:** 3/3 plans complete
Plans:
- [x] 302-01-PLAN.md -- Blueprint Editor block types, renderers, and wiring engine (PRES-01 through PRES-04, 43 tests)
- [x] 302-02-PLAN.md -- Trace panel and security dashboard (PRES-05, PRES-06, 50 tests)
- [x] 302-03-PLAN.md -- Boot peripherals, Tauri IPC bridge, mcp_get_trust_state (PRES-07, PRES-08, 32 tests)

### Phase 303: Integration Testing
**Goal**: The complete MCP stack works end-to-end -- from blueprint blocks through Tauri IPC to host manager to servers and back, with security gates enforced at every boundary
**Depends on**: Phase 294, Phase 295, Phase 299, Phase 300, Phase 301, Phase 302
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04, TEST-05, TEST-06, TEST-07, TEST-08
**Success Criteria** (what must be TRUE):
  1. Blueprint Editor block connects through Tauri IPC to Host Manager to a real server, and a tool invocation flows through staging gates to the server and back to the trace panel
  2. An external MCP client connects to the gateway, discovers tools, invokes one, and receives a structured result
  3. A template-generated server builds, registers with the host manager, and handles tool calls end-to-end
  4. SCOUT server communicates with EXEC client via MCP and returns results
  5. All 18 safety-critical security tests pass, MCP overhead adds less than 50ms latency, and test coverage across all MCP components exceeds 85%
**Plans:** 2/2 plans complete
Plans:
- [x] 303-01-PLAN.md -- End-to-end integration tests: presentation+security, gateway, templates, agent bridge (30 tests)
- [x] 303-02-PLAN.md -- Performance benchmarks, 18 safety-critical security tests, coverage validation (27 tests)

### Phase 304: MCP Integration Wiring
**Goal**: Close all integration wiring gaps found by milestone audit -- gateway factory registers all 19 tools, per-tool scope enforcement is active, and staging gates cover the Rust host manager path
**Depends on**: Phase 295, Phase 297, Phase 301
**Requirements**: GATE-03, GATE-11, GATE-12, GATE-13, GATE-14, GATE-15, GATE-16, GATE-17, GATE-18, GATE-19, SECR-12, SECR-13, TEST-03
**Gap Closure**: Closes gaps from v1.31 audit
**Success Criteria** (what must be TRUE):
  1. `createGsdGatewayFactory()` exposes all 19 MCP tools including agent.*, workflow.*, session.* -- verified by E2E test calling at least one tool from each group
  2. `canInvokeTool()` is called before every tool dispatch; a read-only token cannot invoke chipset.modify
  3. Rust `mcp_call_tool` validates tool invocations through staging gates before dispatching to the server
  4. Agent bridge tool calls pass through the staging pipeline with source='agent-to-agent'
  5. Gateway E2E integration test discovers and invokes tools from all 6 groups (chipset, project, skill, agent, workflow, session)
Plans:
- [ ] 304-01-PLAN.md -- Gateway factory assembly + scope enforcement (GATE-03, GATE-11..19, TEST-03)
- [ ] 304-02-PLAN.md -- Staging pipeline wiring for Rust host manager + agent bridge (SECR-12, SECR-13)

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 293. Foundation Types | v1.31 | 2/2 | Complete | 2026-02-22 |
| 294. Host Manager & Server Registry | v1.31 | 3/3 | Complete | 2026-02-22 |
| 295. Gateway Server Core | v1.31 | 2/2 | Complete | 2026-02-22 |
| 296. Gateway Project & Skill Tools | v1.31 | 2/2 | Complete | 2026-02-22 |
| 297. Gateway Agent, Workflow & Session Tools | v1.31 | 3/3 | Complete | 2026-02-22 |
| 298. Gateway Chipset, Resources & Prompts | v1.31 | 2/2 | Complete | 2026-02-22 |
| 299. MCP Templates | v1.31 | 3/3 | Complete | 2026-02-22 |
| 300. Agent Bridge | v1.31 | 1/1 | Complete | 2026-02-22 |
| 301. Security Gates | v1.31 | 3/3 | Complete | 2026-02-22 |
| 302. Presentation | v1.31 | 3/3 | Complete | 2026-02-22 |
| 303. Integration Testing | v1.31 | Complete    | 2026-02-22 | 2026-02-22 |
| 304. MCP Integration Wiring | 1/2 | In Progress|  | — |

---
*34 milestones shipped. 303 phases complete, 1 phase planned. 770 plans completed.*
*v1.31 gap closure in progress*
