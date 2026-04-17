# Lessons — v1.31

6 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **MCP templates (server, host, client) accelerate ecosystem adoption.**
   Generating a complete MCP server with package.json, tsconfig, SDK setup, example tool/resource/prompt, tests, and chipset.yaml in under 120 seconds means new MCP integrations start from a working baseline, not a blank file.
   _⚙ Status: `applied` (applied in `v1.45`) · lesson #162_

2. **Per-tool scope enforcement (admin > write > read) with deny-by-default is the right security posture.**
   Unknown tools are denied, not allowed. This means new tools added to a server require explicit scope assignment -- the security model doesn't silently become permissive as tools are added.
   _🤖 Status: `investigate` · lesson #163 · needs review_
   > LLM reasoning: Static site generator is unrelated to MCP per-tool scope enforcement.

3. **SHA-256 tool definition hashing with deterministic sorting enables drift detection.**
   If a server's tool definitions change between invocations, the hash changes and the trust manager resets. This catches both malicious and accidental tool definition changes.
   _🤖 Status: `investigate` · lesson #164 · needs review_
   > LLM reasoning: PyDMD knowledge extraction doesn't address SHA-256 tool definition hashing for MCP drift detection.

4. **Blueprint Editor with wiring engine and deny-by-default rules makes MCP topology visible.**
   The visual layer (SVG sparklines, trust state indicators, blocked call log) turns an abstract protocol into something users can inspect and debug.
---
   _🤖 Status: `investigate` · lesson #165 · needs review_
   > LLM reasoning: Mathematical Foundations Engine snippet doesn't indicate blueprint editor or MCP topology visualization.

5. **Phase 304 (Gap Closure) suggests integration wiring wasn't fully planned in the initial phases.**
   The production gateway factory, per-tool scope enforcement at HTTP level with body buffering, and Rust StagingGate were discovered during integration testing. Earlier end-to-end thinking would have caught these gaps.
   _⚙ Status: `applied` (applied in `v1.42`) · lesson #166_

6. **30-day trust decay with immediate reset on change may be too aggressive.**
   A server that updates legitimately (new version, new tools) gets reset to quarantine immediately. A grace period for known-good servers with minor changes would reduce friction for frequently-updated MCP servers.
   _🤖 Status: `investigate` · lesson #167 · needs review_
   > LLM reasoning: Upstream Intelligence Pack tracks change events but doesn't clearly address trust decay grace periods for MCP servers.
