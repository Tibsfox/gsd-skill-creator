# State: GSD Skill Creator

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-22)

**Core value:** Skills, agents, and teams must match official Claude Code patterns -- and the GSD ecosystem must provide spatial, visual, and operational tools that make complex system design tangible.
**Current focus:** v1.31 GSD-OS MCP Integration -- Phase 301 Security Gates complete, Phase 302 next.

## Current Position

Phase: 302 (Presentation) — tenth of 11 phases (293-303)
Plan: 01 of TBD
Status: Ready
Last activity: 2026-02-22 — Completed 301-03 (Staging pipeline and audit logger, 101 total security tests)

Progress: [############░░] 82%

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
Stopped at: Completed 294-03 (Host Manager & Server Registry, all 8 HOST requirements, 32 tests)
Resume file: None
