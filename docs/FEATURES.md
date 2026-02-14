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
| **41. Planning Docs Dashboard** | Markdown-to-HTML generator parsing `.planning/` artifacts into 5 browsable pages with dark theme, no external dependencies (v1.12) |
| **42. Structured Data & SEO** | JSON-LD (Schema.org), Open Graph meta tags, semantic HTML5 on all dashboard pages (v1.12) |
| **43. Incremental Builds** | SHA-256 content hashing, build manifest, auto-refresh with scroll preservation, visual refresh indicator (v1.12) |
| **44. Live Session Pulse** | Real-time session monitoring with ticking duration, commit feed, heartbeat indicator, message counters at 1-2s sample rate (v1.12.1) |
| **45. Phase Velocity & Planning Quality** | Timeline visualization, per-phase stats, TDD rhythm analysis, accuracy scores, emergent work ratio at 5-10s sample rate (v1.12.1) |
| **46. Historical Trends** | Milestone comparison, commit type distribution, velocity curves, file hotspots with CSS-only visualizations (v1.12.1) |
| **47. Message Stack** | Async command queuing with priority levels (push/pop/poke/drain) and tmux session integration (v1.13) |
| **48. Session Lifecycle** | Managed Claude Code sessions via tmux with start/list/watch/pause/resume/stop/save and heartbeat monitoring (v1.13) |
| **49. Recording & Playback** | Stream capture (terminal, stack events, file changes) with 4 replay modes (analyze, step, run, feed) and 14-metric computation (v1.13) |
| **50. Pipeline List Coprocessor** | Declarative workflow programs with WAIT/MOVE/SKIP instructions synchronized to GSD lifecycle events (v1.13) |
| **51. Offload Engine** | Script promotion from skill metadata for deterministic operations executed outside the context window (v1.13) |
| **52. Team-as-Chip Framework** | Amiga-inspired architecture with 4 specialized chips (Agnus, Denise, Paula, Gary), FIFO message ports, 32-bit signals (v1.13) |
| **53. Exec Kernel** | Prioritized round-robin scheduler with 18 typed message protocols and per-team token budgets with burst mode (v1.13) |
| **54. Pipeline Learning** | Observation-to-list compiler, Jaccard feedback engine, versioned library with best-match retrieval (v1.13) |
| **55. Execution Capture** | Pipeline pairing tool_use/tool_result with SHA-256 content hashes for cross-session comparison (v1.14) |
| **56. Determinism Analysis** | Three-tier classification (deterministic/semi/non) with configurable variance thresholds and cross-session stability (v1.14) |
| **57. Promotion Pipeline** | Weighted composite scoring, script generation with dry-run validation, F1/MCC gatekeeper, drift monitoring with auto-demotion (v1.14) |
| **58. Lineage Tracking** | Bidirectional provenance querying from observation through pattern to promotion to script across all pipeline stages (v1.14) |
| **59. Terminal Integration** | Wetty browser-based terminal with tmux session binding, health checks, dark theme, and config-driven URLs (v1.15) |
| **60. Unified Dev Launcher** | DevEnvironmentManager composing dashboard + terminal with single start/stop/status API (v1.15) |
| **61. Filesystem Message Bus** | Bidirectional `.planning/console/` with Zod-validated JSON envelopes, inbox/outbox routing, and pending→acknowledged lifecycle (v1.16) |
| **62. Upload & Configuration** | Drag-and-drop markdown ingestion, document metadata extraction, and 7-section milestone configuration form (v1.16) |
| **63. Interactive Questions** | 5 question types (binary, choice, multi-select, text, confirmation) with timeout fallback and urgency escalation (v1.16) |
| **64. Console Dashboard** | Live session status, hot-configurable settings, activity timeline, and clipboard fallback mode (v1.16) |
| **65. Staging Pipeline** | 5-state filesystem pipeline (inbox/checking/attention/ready/aside) with structured metadata and trust-aware reporting (v1.17) |
| **66. Hygiene Engine** | 11 built-in patterns detecting embedded instructions, hidden content, YAML config safety, with familiarity tiers and trust decay (v1.17) |
| **67. Smart Intake** | Clarity assessment routing (clear/gaps/confused), resource analysis with skill cross-reference, and derived knowledge checking (v1.17) |
| **68. Staging Queue** | 7-state machine with append-only audit log, cross-queue dependencies, pre-wiring engine, and dashboard queue panel (v1.17) |
| **69. CSS Design System** | 6 domain colors, 4 signal colors, typography tokens (Inter + JetBrains Mono), spacing scale, and 5 status states (v1.18) |
| **70. Gantry & Topology** | Persistent status strip with agent circles/phase fractions/budget bar, and subway-map topology with SVG bezier edges (v1.18) |
| **71. Entity Shapes & Activity** | 6 SVG entity shapes with dual encoding, collapsible legend, activity feed with Unicode indicators and domain colors (v1.18) |
| **72. Domain Identifiers** | Domain-prefixed encoding (F-1, B-1.api, T-1:rcp) with backward compatibility and SKILL.md metadata persistence (v1.18) |
| **73. Budget Inventory Model** | LoadingProjection separating installed total from loadable total with tier-aware selection and profile awareness (v1.19) |
| **74. CLI Status Redesign** | Two-section layout with proportional sizing, loading projection, color-coded budget bar, and JSON output mode (v1.19) |
| **75. Budget Configuration** | Per-profile cumulative budgets in integration config, env var backward compat, dual-dimension history with migration (v1.19) |

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
| **v1.12** | GSD Planning Docs Dashboard: markdown-to-HTML generator for `.planning/` artifacts, 5 dashboard pages with dark theme, JSON-LD structured data, Open Graph meta tags, incremental builds with SHA-256 hashing, auto-refresh with scroll preservation, GSD slash command |
| **v1.12.1** | Live Metrics Dashboard: three-tier sample rate engine (hot/warm/cold), live session pulse, phase velocity analytics, planning quality scores, historical trends, CSS-only visualizations, 460 dashboard tests |
| **v1.13** | Session Lifecycle & Workflow Coprocessor: message stack (push/pop/poke/drain), session management via tmux, recording/playback with 14 metrics, Pipeline List coprocessor (WAIT/MOVE/SKIP), Offload engine for script promotion, Team-as-Chip framework (Agnus/Denise/Paula/Gary), Exec kernel with prioritized scheduling, Pipeline learning from observations, 1057 tests |
| **v1.14** | Promotion Pipeline: execution capture with SHA-256 hashes, three-tier determinism analysis, weighted promotion scoring (determinism 40%/frequency 35%/savings 25%), script generation with dry-run, F1/MCC gatekeeper, drift monitoring with auto-demotion, bidirectional lineage tracking, 3 dashboard collectors |
| **v1.15** | Live Dashboard Terminal: Wetty terminal config with Zod validation, process management with health checks, tmux session binding with auto-detection, themed iframe panel with offline fallback, unified DevEnvironmentManager launcher |
| **v1.16** | Dashboard Console & Milestone Ingestion: filesystem message bus with Zod-validated JSON envelopes, HTTP helper with path traversal prevention, drag-and-drop upload zone, inbox checking at lifecycle boundaries, 5 interactive question types, console dashboard page with hot-configurable settings |
| **v1.17** | Staging Layer: 5-state filesystem pipeline (inbox/checking/attention/ready/aside), 11-pattern hygiene engine, trust-aware reporting with familiarity tiers, smart intake with clarity routing, resource analysis with skill cross-reference, derived knowledge checking with provenance chains, 7-state staging queue with audit log, queue pipelining with pre-wiring |
| **v1.18** | Information Design System: CSS design system (6 domain colors, 4 signal colors, typography tokens), persistent gantry status strip, 6 SVG entity shapes with dual encoding, subway-map topology with bezier edges and click-to-detail, activity feed with Unicode indicators, budget gauge with threshold transitions, domain-prefixed identifiers (F-1, B-1.api, T-1:rcp) |
| **v1.19** | Budget Display Overhaul: LoadingProjection separating installed from loadable with tier-based selection, two-section CLI status with proportional sizing and color-coded budget bar, JSON output mode, dashboard gauge with deferred tooltip and over-budget clamping, per-profile cumulative budgets in config, dual-dimension budget history with migration |
