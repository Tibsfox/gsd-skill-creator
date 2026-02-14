# Milestones: GSD Skill Creator

## Shipped

### v1.20 — Dashboard Assembly (Phases 152-157)
**Goal:** Wire 13 orphaned dashboard components into the generator pipeline with unified CSS and real data pipelines, so the generated dashboard reflects every feature built across v1.12-v1.19
**Shipped:** 2026-02-14
**Requirements:** 23 | **Phases:** 6 | **Plans:** 12 | **Commits:** 23 | **Tests:** 110

**Key accomplishments:**
- Unified CSS pipeline wiring 18 component style modules into generator with design system token compliance (no hardcoded hex colors)
- Topology data collector reading real skill/agent/team files with gray-matter parsing, domain inference, and entity legend rendering
- Activity feed collector transforming git commits and session observations into FeedEntry[] with scope classification and domain inference
- Budget-silicon collector bridging CumulativeBudgetResult and IntegrationConfig to gauge/panel renderers with domain color mapping
- Staging queue collector reading queue-state.json for dashboard panel visualization with 7-state color badges
- Console page assembly with settings panel, activity timeline, question cards, and submit flow as 6th generated page (console.html)

### v1.19 — Budget Display Overhaul (Phases 149-151)
**Goal:** Fix the budget display across CLI and dashboard by separating the installed skill inventory from loading projection, fixing percentages, and making the budget configurable
**Shipped:** 2026-02-14
**Requirements:** 27 | **Phases:** 3 | **Plans:** 7 | **Commits:** 14 | **Tests:** 284

**Key accomplishments:**
- LoadingProjection type with projectLoading() pure function simulating BudgetStage tier-based selection (critical > standard > optional, profile-aware)
- CumulativeBudgetResult extended with installedTotal/loadableTotal separation, full LoadingProjection attachment, dual-view formatBudgetDisplay
- Two-section CLI status layout with "Installed Skills" proportional percentages and "Loading Projection" loaded/deferred breakdown with color-coded budget bar
- JSON output mode (--json) with structured installed array and projection object
- Dashboard budget gauge with deferred skills hover tooltip, over-budget clamped rendering with red outline, and 80%/95% threshold transitions
- Configurable per-profile cumulative budgets in integration config with env var backward compat, dual-dimension budget history with graceful old-snapshot migration

### v1.18 — Information Design System (Phases 142-148)
**Goal:** Translate proven information design principles into the dashboard with a learnable visual language — shape+color encoding, persistent status gantry, topology views, and three-speed information layering
**Shipped:** 2026-02-14
**Requirements:** 53 | **Phases:** 7 | **Plans:** 15 | **Commits:** 35 | **Tests:** 515

**Key accomplishments:**
- CSS design system with 6 domain colors, 4 signal colors, typography (Inter + JetBrains Mono), spacing tokens, and 5 status states
- Persistent gantry status strip with agent circles, phase fractions, budget bar, 8-cell max, wired into all dashboard pages
- Shape/color entity system with 6 SVG shapes (circle, rect, hexagon, chevron, diamond, dot) and collapsible legend
- Subway-map topology view with SVG renderer, bezier edges, 12-node collapse, animated pulses, and click-to-detail panel
- Activity feed with Unicode shape indicators, domain colors, 8-entry newest-first, tab toggle to terminal view
- Budget gauge (stacked bar, threshold transitions) and silicon panel (diamond adapters, VRAM gauge, progressive enhancement)
- Domain-prefixed identifier encoding (F-1, B-1.api, T-1:rcp) with backward compatibility and SKILL.md metadata

### v1.17 — Staging Layer (Phases 134-141)
**Goal:** Introduce a staging layer between human ideation and machine execution — where work is analyzed, scanned, resource-planned, and approved before entering the parallel execution queue
**Shipped:** 2026-02-13
**Requirements:** 38 | **Phases:** 8 | **Plans:** 35 | **Commits:** 83 | **Tests:** 699

**Key accomplishments:**
- Staging foundation with 5-state filesystem pipeline (inbox/checking/attention/ready/aside) and structured metadata
- Hygiene pattern engine detecting embedded instructions, hidden content, and YAML config safety issues (11 built-in patterns)
- Trust-aware reporting with familiarity tiers (Home/Neighborhood/Town/Stranger), trust decay, and critical pattern lockout
- Smart intake flow with clarity assessment routing (clear/gaps/confused), step tracking, and crash recovery
- Resource analysis with vision document analyzer, skill cross-reference matching, topology recommendation, and token budget estimation
- Derived knowledge checking with provenance chain tracking, phantom content detection, scope drift detection, and copying signals
- Staging queue with 7-state machine, append-only audit log, cross-queue dependency detection, and optimization analysis
- Queue pipelining with pre-wiring engine, retroactive hygiene audit recommender, and dashboard staging queue panel

### v1.16 — Dashboard Console & Milestone Ingestion (Phases 128-133)
**Goal:** Transform the read-only dashboard into a bidirectional control surface where users upload vision documents, configure milestone execution settings, answer structured planning questions, and adjust live settings — all via filesystem message bus
**Shipped:** 2026-02-13
**Requirements:** 27 | **Phases:** 6 | **Plans:** 18 | **Commits:** 41 | **Tests:** 275

**Key accomplishments:**
- Filesystem message bus (.planning/console/) with Zod-validated JSON envelopes, directional routing (inbox/outbox), and pending→acknowledged lifecycle
- HTTP helper endpoint for browser→filesystem writes with path traversal prevention, subdirectory allowlist, and JSONL audit logging
- Upload zone with drag-and-drop markdown ingestion, document metadata extraction, and 7-section milestone configuration form
- GSD skill for inbox checking at session-start, phase-boundary, and post-verification with message type dispatch
- Interactive question cards (5 types: binary, choice, multi-select, text, confirmation) with timeout fallback and urgency escalation
- Console dashboard page with live session status, hot-configurable settings panel, activity timeline, and clipboard fallback mode

### v1.15 — Live Dashboard Terminal (Phases 123-127)
**Goal:** Integrate Wetty browser-based terminal into the planning docs dashboard with session binding and unified launcher for a complete dev environment
**Shipped:** 2026-02-13
**Requirements:** 17 | **Phases:** 5 | **Plans:** 11

**Key accomplishments:**
- TerminalConfigSchema with Zod validation for port, base_path, auth_mode, theme, session_name wired into IntegrationConfig
- Wetty process management with spawn lifecycle, HTTP health check via native fetch, and start/stop/status/restart API
- tmux session binding with auto-detection, compound attach-or-create command, and configurable session names
- Live dashboard terminal panel with themed iframe, dark CSS, JavaScript offline fallback, and config-driven URL
- Unified DevEnvironmentManager composing dashboard + terminal via Promise.allSettled with single start/stop/status

### v1.14 — Promotion Pipeline (Phases 115-122)
**Goal:** Connect 5 isolated subsystems (Blitter, Copper Learning, Observation, Calibration, Pattern Detection) into an integrated promotion pipeline — from execution capture through deterministic analysis to automatic script promotion with metrics-driven gatekeeping
**Shipped:** 2026-02-13
**Requirements:** 27 | **Phases:** 8 | **Plans:** 16

**Key accomplishments:**
- ExecutionCapture pipeline pairing tool_use/tool_result with SHA-256 content hashes for cross-session comparison
- DeterminismAnalyzer with three-tier classification and configurable variance thresholds
- PromotionDetector with weighted composite scoring (determinism 40%, frequency 35%, token savings 25%)
- ScriptGenerator with tool-to-bash mapping, dry-run validation, and Blitter OffloadOperation conformance
- PromotionGatekeeper wiring F1/accuracy/MCC calibration metrics with auditable decision trail
- DriftMonitor and FeedbackBridge for post-promotion variance monitoring with automatic demotion
- LineageTracker with bidirectional provenance querying across all pipeline stages
- Three dashboard collectors (pipeline status, determinism scores, lineage views) for pipeline visualization

### v1.13 — Session Lifecycle & Workflow Coprocessor (Phases 101-114)
**Goal:** A dual-track system adding gsd-stack (bash session/recording infrastructure) and chipset (TypeScript Amiga-inspired coprocessor architecture) that converge at integration -- sessions feed learning, lifecycle events drive Copper execution
**Shipped:** 2026-02-12
**Requirements:** 39 | **Phases:** 14 | **Plans:** 35

**Key accomplishments:**
- gsd-stack CLI: message queue (push/peek/pop/clear), priority ordering, drain (headless batch), poke (tmux direct)
- Session lifecycle: start/list/watch/pause/resume/stop with tmux integration, heartbeat monitoring, state machine
- Recording system: stream.jsonl capture (terminal, file changes, stack events), markers, metrics computation, transcript generation
- Playback engine: analyze (timeline), step (interactive), run (benchmark replay), feed (JSONL playbooks)
- Metrics: 14-metric computation engine, display mode, side-by-side comparison with deltas
- Copper List format: WAIT/MOVE/SKIP instructions with Zod schemas, YAML parser, serializer
- Blitter engine: script promotion from skill metadata, child process execution with timeout, completion signals
- Copper executor: lifecycle sync bridge, WAIT blocking/resolution, activation dispatch (sprite/full/blitter/async modes)
- Team-as-Chip framework: Agnus/Denise/Paula/Gary chip definitions, FIFO message ports, 32-bit signal system
- Exec kernel: prioritized round-robin scheduler, typed message protocol (18 types), DMA token budgets with burst mode
- Copper learning: observation-to-list compiler, Jaccard feedback engine, versioned library with best-match retrieval
- Integration layer: StackBridge (recording -> learning), SessionEventBridge (lifecycle -> WAIT targets), PopStackAwareness
- End-to-end: recording events feed Copper learning, session lifecycle drives execution, pop-stack respects pause/heartbeat
- 541 bash tests, 516 chipset TypeScript tests across 25 test files, 12 end-to-end integration tests

### v1.12.1 — Live Metrics Dashboard (Phases 94-100)
**Goal:** Real-time visibility into GSD session activity, phase velocity, planning quality, and historical trends — sampled at rates matching each metric's natural update frequency
**Shipped:** 2026-02-12
**Requirements:** 30 | **Phases:** 7 | **Plans:** 14

**Key accomplishments:**
- Three-tier sample rate engine: hot (1-2s), warm (5-10s), cold (on-change) with per-section JavaScript refresh
- Data collectors for git metrics, session observations, and planning artifacts — typed objects, not HTML
- Live session pulse (hot tier): active session card with ticking duration, commit feed, heartbeat indicator, message counters
- Phase velocity metrics (warm tier): timeline visualization, per-phase stats table, TDD rhythm analysis, progress card
- Planning quality metrics (warm tier): accuracy scores, emergent work ratio, deviation summaries, accuracy trend sparkline
- Historical trends (cold tier): milestone comparison table, commit type distribution, velocity curves, file hotspots
- Graceful degradation for all missing data sources (git, sessions, plans) — empty states, never crashes
- Full pipeline integration: parser -> collector -> renderer with --live flag support
- CSS-only visualizations (no D3/Chart.js) — works from file:// protocol
- 221 new metric tests, 460 total dashboard tests across 37 test files

### v1.12 — GSD Planning Docs Dashboard (Phases 88-93)
**Goal:** A living documentation system that mirrors `.planning/` artifacts into browsable, machine-readable HTML — hot during sessions, static at rest
**Shipped:** 2026-02-12
**Requirements:** 30 | **Phases:** 6 | **Plans:** 7

**Key accomplishments:**
- Markdown-to-HTML generator parsing `.planning/` artifacts (PROJECT, REQUIREMENTS, ROADMAP, STATE, MILESTONES) into 5 dashboard pages
- Dark theme embedded CSS with no external dependencies (works from `file://` protocol)
- Individual artifact pages: Requirements (REQ-ID badges), Roadmap (phase status visualization), Milestones (rich timeline), State (blockers/metrics)
- JSON-LD structured data (Schema.org SoftwareSourceCode, ItemList) and Open Graph meta tags on all pages
- Incremental builds with SHA-256 content hashing and `.dashboard-manifest.json` build manifest
- Auto-refresh with scroll position preservation via sessionStorage and visual refresh indicator
- Watch mode polling `.planning/` for file changes with configurable intervals
- GSD slash command (`/gsd-dashboard`) with generate/watch/clean subcommands
- 239 tests across 11 test files with 81% branch coverage
- Integration test validating full pipeline with fixture data

### v1.11 — GSD Integration Layer (Phases 82-87)
**Goal:** Connect skill-creator's adaptive learning features to GSD's workflow lifecycle through a non-invasive integration layer — wrapper commands, git hooks, passive monitoring, and slash commands — without modifying any GSD commands or agents
**Shipped:** 2026-02-12
**Requirements:** 40 | **Phases:** 6 | **Plans:** 16

**Key accomplishments:**
- Integration config with Zod schema, per-feature toggles, and CLI validation command
- Enhanced install script with idempotent deployment, git hook management, and `--uninstall` support
- POSIX shell post-commit hook for zero-cost commit observation to sessions.jsonl
- 6 slash commands (`/sc:start`, `status`, `suggest`, `observe`, `digest`, `wrap`) for session management and learning
- 4 wrapper commands (`/wrap:execute`, `verify`, `plan`, `phase`) with smart lifecycle routing for GSD phases
- Passive monitoring with plan-vs-summary diffing, STATE.md transition detection, and ROADMAP.md structural diff

### v1.10 — Security Hardening (Phases 71-81)
**Goal:** Address all 16 findings from comprehensive security audit across 6 security domains — input validation, data integrity, information security, learning safety, access control, operational hardening
**Shipped:** 2026-02-12
**Requirements:** 39 | **Phases:** 11 | **Plans:** 24

**Key accomplishments:**
- Path traversal prevention with validateSafeName + assertSafePath wired into SkillStore, AgentGenerator, TeamStore
- YAML safe deserialization rejecting dangerous tags (!!js/function, etc.) with Zod schema validation at all read sites
- JSONL integrity: SHA-256 checksums, schema validation, rate limiting, anomaly detection, compaction, purge CLI
- Discovery safety: secret redaction, allowlist/blocklist, structural-only filtering, dangerous command deny list
- Learning safety: cumulative drift tracking with 60% threshold, contradiction detection, audit CLI
- Team message sanitization against 13 prompt injection patterns with content-length limits
- Config range validation engine with security-aware field registry and validate CLI
- Inheritance chain validation with depth limits, circular dependency detection, impact analysis CLI
- File integrity monitoring, audit logging, file-based concurrency locks, operation cooldowns
- Hook error boundaries, safety validation, orchestrator confirmation gates, classification audit logging
- SECURITY.md with 6-domain threat model and GitHub Actions CI with npm audit

### v1.9 — Ecosystem Alignment & Advanced Orchestration (Phases 62-70)
**Goal:** Spec alignment, progressive disclosure, cross-platform portability, evaluator-optimizer, MCP distribution, enhanced topologies, session continuity, agentic RAG
**Shipped:** 2026-02-12
**Requirements:** 49 | **Phases:** 9 | **Plans:** 37

**Key accomplishments:**
- Spec-aligned skill generation with $ARGUMENTS, !command, context:fork, dual-format allowed-tools, shell injection prevention
- Progressive disclosure: large skills auto-decompose into SKILL.md + references/ + scripts/ with token budget awareness
- 5-platform portability: export as portable agentskills.io or platform-specific (Claude, Cursor, Codex, Copilot, Gemini)
- Evaluator-optimizer: precision/recall/F1, A/B evaluation with t-test significance, health dashboard
- MCP-based distribution: publish .tar.gz packages, install from local/remote, MCP server with 4 tools
- Enhanced topologies: Router and Map-Reduce patterns, inter-team deadlock detection, cost estimation
- Session continuity: save/restore/handoff with warm-start context and cross-session ephemeral promotion
- Agentic RAG: adaptive TF-IDF/embedding routing, corrective refinement, cross-project discovery
- Quality of life: description quality scoring, budget dashboard, Mermaid graphs, GSD command injection

### v1.8.1 — Audit Remediation (patch)
**Goal:** Type safety, test infrastructure fixes, security hardening, code quality improvements
**Shipped:** 2026-02-11

### v1.8 — Capability-Aware Planning + Token Efficiency (Phases 51-61)
**Goal:** Skill pipeline architecture, per-agent token budgets, capability manifests, cache ordering, research compression, parallelization advisor
**Shipped:** 2026-02-08
**Requirements:** 28 | **Phases:** 10 | **Plans:** 28

### v1.7 — GSD Master Orchestration Agent (Phases 35-50)
**Goal:** Dynamic discovery, intent classification, lifecycle coordination, workflows, roles, bundles, events
**Shipped:** 2026-02-08
**Requirements:** 42 | **Phases:** 16 | **Plans:** 38

### v1.6 — Cross-Domain Examples (Phases 30-34)
**Goal:** 34 cross-domain examples (20 skills, 8 agents, 3 teams), local installation, beautiful-commits
**Shipped:** 2026-02-07
**Requirements:** — | **Phases:** 5 | **Plans:** —

### v1.5 — Pattern Discovery (Phases 24-29)
**Goal:** Scan session logs to discover recurring workflows and generate draft skills automatically
**Shipped:** 2026-02-07
**Requirements:** 27 | **Phases:** 6 | **Plans:** 20

### v1.4 — Agent Teams (Phases 18-23)
**Goal:** Multi-agent team coordination with leader-worker, pipeline, and swarm topologies
**Shipped:** 2026-02-05
**Requirements:** 22 | **Phases:** 6 | **Plans:** 18

### v1.3 — Documentation Overhaul (Phases 15-17)
**Goal:** Official format specification, getting started guide, comprehensive docs
**Shipped:** 2026-02-05
**Requirements:** 12 | **Phases:** 3 | **Plans:** 8

### v1.2 — Test Infrastructure (Phases 10-14)
**Goal:** Automated test cases, activation simulation, threshold calibration, and benchmarking
**Shipped:** 2026-02-05
**Requirements:** 18 | **Phases:** 5 | **Plans:** 14

### v1.1 — Semantic Conflict Detection (Phases 6-9)
**Goal:** Add quality assurance with semantic conflict detection, activation scoring, and local embeddings
**Shipped:** 2026-02-04
**Requirements:** 10 | **Phases:** 4 | **Plans:** 12

### v1.0 — Core Skill Management (Phases 1-5)
**Goal:** Build the foundational 6-step loop: observe → detect → suggest → apply → learn → compose
**Shipped:** 2026-01-31
**Requirements:** 43 | **Phases:** 5 | **Plans:** 15

---

**Totals:** 24 milestones (v1.0-v1.20 + v1.8.1 patch) | 157 phases | 449 plans
**Last phase number:** 157



