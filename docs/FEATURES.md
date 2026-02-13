# Features

The Dynamic Skill Creator helps you build a personalized knowledge base for Claude Code through these core capabilities:

| Capability | Description |
|------------|-------------|
| **1. Capturing Patterns** | Observes your Claude Code sessions to detect recurring workflows, commands, and file access patterns |
| **2. Suggesting Skills** | Proposes skill creation when patterns repeat 3+ times with evidence explaining why |
| **3. Managing Skills** | Provides guided workflows for creating, searching, listing, and organizing skills |
| **4. Auto-Loading** | Automatically loads relevant skills based on context while respecting token budgets (2-5% of context) |
| **5. Learning** | Refines skills based on your corrections and feedback with bounded parameters and user confirmation |
| **6. Composing Agents** | Groups frequently co-activated skills into composite agents stored in `.claude/agents/` |
| **7. Quality Validation** | Detects semantic conflicts between skills and scores activation likelihood (v1.1) |
| **8. Testing & Simulation** | Automated test cases, activation simulation, and calibration benchmarks (v1.2) |
| **9. Agent Teams** | Multi-agent team coordination with leader-worker, pipeline, and swarm topologies (v1.4) |
| **10. Pattern Discovery** | Scan session logs to discover recurring workflows and generate draft skills automatically (v1.5) |
| **11. Orchestrator** | Master agent routing user intent to GSD commands via dynamic discovery and intent classification (v1.7) |
| **12. Skill Workflows** | Multi-step skill chains with dependency tracking and crash recovery (v1.7) |
| **13. Skill Roles** | Behavioral constraints and tool scoping for agent personas (v1.7) |
| **14. Work Bundles** | Project-phase skill sets with progress tracking and auto-suggestion (v1.7) |
| **15. Inter-Skill Events** | Event emit/listen system enabling causal activation chains (v1.7) |
| **16. Skill Pipeline** | Composable pipeline architecture with pluggable stages replacing monolithic skill loading (v1.8) |
| **17. Token Budgets** | Per-agent token budget profiles with critical/standard/optional priority tiers (v1.8) |
| **18. Capability Planning** | Auto-generated capability manifests, phase declarations, and skill injection into executors (v1.8) |
| **19. Cache Optimization** | Cache-aware skill ordering with cacheTier metadata for prompt cache efficiency (v1.8) |
| **20. Research Compression** | 10-20x research document reduction with staleness detection (v1.8) |
| **21. Parallelization Advisor** | Wave-based parallel execution recommendations from plan dependency analysis (v1.8) |
| **22. Spec Alignment** | Full Claude Code spec compliance: $ARGUMENTS injection, context:fork, dual-format allowed-tools, shell injection prevention (v1.9) |
| **23. Progressive Disclosure** | Large skills auto-decompose into SKILL.md + references/ + scripts/ with token budget awareness (v1.9) |
| **24. Cross-Platform Portability** | Export skills as portable archives or platform-specific formats (Claude, Cursor, Codex, Copilot, Gemini) (v1.9) |
| **25. Evaluator-Optimizer** | Precision/recall/F1 tracking, A/B evaluation with t-test significance, health dashboard (v1.9) |
| **26. MCP Distribution** | Publish .tar.gz skill packages, install from local/remote, MCP server with 4 tools (v1.9) |
| **27. Enhanced Topologies** | Router and Map-Reduce team patterns, inter-team deadlock detection, cost estimation (v1.9) |
| **28. Session Continuity** | Save/restore/handoff with warm-start context and cross-session ephemeral promotion (v1.9) |
| **29. Agentic RAG** | Adaptive TF-IDF/embedding routing, corrective refinement, cross-project skill discovery (v1.9) |
| **30. Quality of Life** | Description quality scoring, budget dashboard, Mermaid dependency graphs, GSD command injection (v1.9) |
| **31. Security Hardening** | Path traversal prevention, YAML safe deserialization, JSONL integrity with checksums, secret redaction, dangerous command deny list (v1.10) |
| **32. Data Integrity** | SHA-256 checksums on JSONL entries, schema validation, observation rate limiting, anomaly detection, compaction and purge (v1.10) |
| **33. Learning Safety** | Cumulative drift tracking with 60% threshold, contradictory feedback detection, skill audit CLI (v1.10) |
| **34. Access Control** | File integrity monitoring, audit logging, inheritance depth limits, impact analysis, concurrency locks, operation cooldowns (v1.10) |
| **35. Operational Safety** | Hook error boundaries, hook safety validation, orchestrator confirmation gates, classification audit logging (v1.10) |
| **36. GSD Integration Config** | Per-feature toggles, Zod-validated JSON config, CLI validation command, opt-out model with sensible defaults (v1.11) |
| **37. Install & Git Hooks** | Idempotent install script with --uninstall, POSIX shell post-commit hook for zero-cost commit observation to sessions.jsonl (v1.11) |
| **38. Session Commands** | `/sc:start` warm-start briefing, `/sc:status` budget dashboard, `/sc:suggest` interactive review, `/sc:observe` session snapshot, `/sc:digest` learning digest (v1.11) |
| **39. Wrapper Commands** | `/wrap:execute`, `/wrap:verify`, `/wrap:plan` with skill loading, `/wrap:phase` smart lifecycle router (v1.11) |
| **40. Passive Monitoring** | Plan-vs-summary diffing, STATE.md transition detection, ROADMAP.md structural diff, scan-on-demand architecture (v1.11) |

## Version History

| Version | Key Features |
|---------|--------------|
| **v1.0** | Core skill management, pattern observation, learning loop, agent composition |
| **v1.1** | Semantic conflict detection, activation scoring, local embeddings via HuggingFace |
| **v1.2** | Test infrastructure, activation simulation, threshold calibration, benchmarking |
| **v1.3** | Documentation overhaul, official format specification, getting started guide |
| **v1.4** | Agent Teams: team schemas, storage, validation, CLI commands, GSD workflow templates |
| **v1.5** | Pattern Discovery: session log scanning, tool sequence extraction, DBSCAN clustering, draft generation |
| **v1.6** | 34 cross-domain examples (20 skills, 8 agents, 3 teams), local installation, beautiful-commits skill |
| **v1.7** | GSD Master Orchestration Agent: dynamic discovery, intent classification, lifecycle coordination, verbosity/HITL gates, persistent work state, session continuity, skill workflows, roles, bundles, inter-skill events |
| **v1.8** | Capability-Aware Planning + Token Efficiency: skill pipeline architecture, per-agent token budgets, capability manifests, phase capability declarations, skill injection, cache-aware ordering, research compression, model-aware activation, collector agents, parallelization advisor |
| **v1.8.1** | Audit Remediation: test infrastructure fixes, type safety improvements, CLI validation, error handling, dependency validation, security hardening, code refactoring, cache invalidation |
| **v1.9** | Ecosystem Alignment & Advanced Orchestration: spec-aligned skill generation, progressive disclosure, 5-platform portability, evaluator-optimizer with A/B testing, MCP-based distribution, router/map-reduce topologies, session save/restore/handoff, agentic RAG with corrective refinement, quality-of-life CLI improvements |
| **v1.10** | Security Hardening: path traversal prevention, YAML safe deserialization, JSONL integrity (checksums, rate limiting, anomaly detection, compaction), discovery safety (secret redaction, allowlist/blocklist, deny list), learning safety (drift tracking, contradiction detection), team message sanitization, config validation, inheritance chain validation, file integrity monitoring, hook error boundaries, SECURITY.md, CI pipeline |
| **v1.11** | GSD Integration Layer: integration config with per-feature toggles, idempotent install script with --uninstall, POSIX shell post-commit hook, 6 slash commands (/sc:start, status, suggest, observe, digest, wrap), 4 wrapper commands (/wrap:execute, verify, plan, phase with smart routing), passive monitoring (plan-vs-summary diffing, STATE.md transitions, ROADMAP.md structural diff) |
