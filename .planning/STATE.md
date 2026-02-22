# State: GSD Skill Creator

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-22)

**Core value:** Skills, agents, and teams must match official Claude Code patterns -- and the GSD ecosystem must provide spatial, visual, and operational tools that make complex system design tangible.
**Current focus:** v1.31 GSD-OS MCP Integration -- Phase 298 Gateway Chipset, Resources & Prompts complete.

## Current Position

Phase: 298 (Gateway Chipset, Resources & Prompts) — complete
Plan: 02 of 2 (all complete)
Status: Complete
Last activity: 2026-02-22 — Completed 298-02 (Prompt templates and integration tests, 77 total tests)

Progress: [#############░] 91%

## Accumulated Context

### Decision Log

- Rust for Host Manager only — process lifecycle needs native performance; everything else TypeScript
- stdio for local, Streamable HTTP for gateway — local servers use child process model, gateway uses network transport
- Staging gates mandatory for all MCP traffic — no bypass even for internal agent-to-agent calls
- No MCP sampling — prevents conversation hijacking attacks
- Agent bridge supplements filesystem — MCP is real-time layer, filesystem remains persistence layer
- Templates teach through working examples — generated projects include annotated implementations, not empty stubs
- Zod v4 for all schemas — matches MCP SDK v2.x peer dependency and project convention
- SecurityGate as interface not Zod schema — runtime validation not meaningful for function signatures
- TransportConfig uses Zod discriminatedUnion for exhaustive variant handling
- Internal sub-schemas kept module-private to minimize exported API surface
- RPITIT for SecurityGate async methods -- avoids async-trait crate, leverages Rust 1.91
- serde rename_all camelCase for Rust structs with all-camelCase fields; individual renames for mixed
- tokio::process for async child process management in ServerConnection
- tokio::sync::Mutex for McpHostState (not std::sync::Mutex) to avoid blocking async runtime
- Unsafe split-borrow in rebuild_router for accessing independent struct fields simultaneously
- Exponential backoff: min(2^count, 30) seconds with max 5 retries for server restart
- Atomic JSON writes (temp file + rename) for ServerRegistry config persistence
- Gateway uses Node.js http.createServer + MCP SDK StreamableHTTPServerTransport (not Express)
- Per-session transport isolation -- each MCP client gets its own transport and server instance
- Timing-safe token comparison via crypto.timingSafeEqual to prevent timing attacks
- Token files written with 0o600 mode for security; auto-generated on first use
- Scope hierarchy: admin > write > read; unknown tools default to admin (deny by default)
- GatewayError class with JSON-RPC error codes for structured error propagation
- Template content stored as TypeScript functions (not .md files) -- type-safe variable interpolation, no runtime file loading
- Generated projects include working examples (not empty stubs) per project convention
- Name validation enforces valid npm package names (lowercase, no spaces, regex-checked via Zod)
- Agent bridge uses composition not inheritance -- AgentServerAdapter is a factory function, not a base class
- JSON Schema -> Zod conversion for MCP SDK tool registration (SDK requires Record<string, ZodType>)
- Counting semaphore for concurrency limiting -- immediate rejection, not queuing
- Per-invocation context isolation via fresh InvocationContext objects
- Hash gate uses functional API (stateless), trust manager uses class (stateful lifecycle)
- Tool definitions sorted by name for deterministic SHA-256 hashing
- StagingPipeline implements SecurityGate interface -- single unbypassable entry point
- Per-server promise queues for thread-safe concurrent validation (no global lock)
- Audit redaction uses both key-name matching and value-pattern matching (dual approach)
- Pipeline stages short-circuit on failure: trust -> rate limit -> param validation -> audit
- AgentRegistry uses in-memory ring buffer for logs (max 100, configurable) -- evicts oldest on overflow
- WorkflowEngine as simulation layer -- produces realistic structured output, will delegate to real GSD pipeline later
- SessionStore text-based query: substring (0.5) + keyword (0.3) + tag (0.2) scoring, case-insensitive
- Pattern detection default threshold: minOccurrences=3 per skill-creator convention
- Gateway tool names use colon convention (agent:spawn) matching project pattern despite MCP naming warnings
- Project discovery scans root dir for subdirs with .planning/ROADMAP.md -- filesystem-based, no central registry
- Tool registration pattern: domain modules export registerXxxReadTools/registerXxxWriteTools for scope separation
- Skill search relevance scoring: exact name match (1.0) > name contains (0.7) > description contains (0.3)
- skill:activate token estimation reuses SkillInjector heuristic: ceil(body.length / 4) for consistency
- Chipset tools operate on Den chipset (staff positions, topology, budget) -- runtime state external agents inspect
- Keyword-based chipset synthesis -- pure deterministic, no LLM calls
- ResourceTemplate class for URI template resources -- MCP SDK v1.26+ requires explicit template objects
- Deep clone on chipset get() -- prevents callers from mutating internal state
- Shared ChipsetStateManager across sessions -- single source of truth for chipset state

### Key Constraints

- Must follow existing project patterns: Zod schemas, functional API + class wrapper, TDD
- MCP SDK v2.x with Zod v4 peer dependency
- Rust MCP host manager in src-tauri/mcp_host/
- TypeScript gateway server and templates in src/mcp/
- 18 safety-critical tests are mandatory-pass (block on failure)
- Tool definitions are immutable by default — changes require user acknowledgment
- Phase 302 (Presentation) depends on both Phase 294 (Host Manager) and Phase 301 (Security Gates)
- Phase 303 (Integration Testing) depends on all preceding phases

### Blockers

None.

## Session Continuity

Last session: 2026-02-22
Stopped at: Completed 298-02 (Gateway Chipset, Resources & Prompts, GATE-20 through GATE-24, 77 tests)
Resume file: None
