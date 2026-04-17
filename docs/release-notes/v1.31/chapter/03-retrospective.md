# Retrospective — v1.31

## What Worked

- **Dual MCP role: Host AND Server.** GSD-OS as both MCP Host (Rust backend managing server processes) and MCP Server (19 tools across 6 groups) means it can orchestrate external AI agents while also being orchestrated by them. This bidirectional capability is rare and architecturally significant.
- **Security pipeline as a single unbypassable gate.** Hash gate, trust manager (quarantine → provisional → trusted), invocation validator, rate limiter, and audit logger -- all composed into StagingPipeline as a single SecurityGate implementation. Per-server promise queues for thread-safe validation show the concurrency model is production-grade. 18 mandatory-pass safety-critical tests.
- **Agent bridge with generic adapter factory.** AgentServerAdapter creating MCP servers from config and AgentClientAdapter giving agents MCP client capability means any agent can expose its tools via MCP or consume external MCP tools. SCOUT and VERIFY as concrete examples prove the pattern works.
- **838 tests (771 TS + 67 Rust) across two languages.** The Rust MCP Host Manager with serde round-trip parity and the TypeScript Gateway Server with Zod v4 schemas are tested in their native environments, not through a single test harness that papers over FFI boundaries.

## What Could Be Better

- **Phase 304 (Gap Closure) suggests integration wiring wasn't fully planned in the initial phases.** The production gateway factory, per-tool scope enforcement at HTTP level with body buffering, and Rust StagingGate were discovered during integration testing. Earlier end-to-end thinking would have caught these gaps.
- **30-day trust decay with immediate reset on change may be too aggressive.** A server that updates legitimately (new version, new tools) gets reset to quarantine immediately. A grace period for known-good servers with minor changes would reduce friction for frequently-updated MCP servers.

## Lessons Learned

1. **MCP templates (server, host, client) accelerate ecosystem adoption.** Generating a complete MCP server with package.json, tsconfig, SDK setup, example tool/resource/prompt, tests, and chipset.yaml in under 120 seconds means new MCP integrations start from a working baseline, not a blank file.
2. **Per-tool scope enforcement (admin > write > read) with deny-by-default is the right security posture.** Unknown tools are denied, not allowed. This means new tools added to a server require explicit scope assignment -- the security model doesn't silently become permissive as tools are added.
3. **SHA-256 tool definition hashing with deterministic sorting enables drift detection.** If a server's tool definitions change between invocations, the hash changes and the trust manager resets. This catches both malicious and accidental tool definition changes.
4. **Blueprint Editor with wiring engine and deny-by-default rules makes MCP topology visible.** The visual layer (SVG sparklines, trust state indicators, blocked call log) turns an abstract protocol into something users can inspect and debug.

---
