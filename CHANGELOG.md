# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.32.0] - 2026-02-22

### Added

- **Brainstorm Foundation Types:** 23 Zod schemas (AgentRole, SessionPhase, TechniqueId, PathwayId, HatColor, ScamperLens, OsbornRule, EnergyLevel, SessionStatus + 12 object schemas), session-scoped filesystem bus with monotonic counter filenames, 16 technique defaults, 8 agent phase rules, 10 message priorities
- **Rules Engine:** Osborn's 4 rules enforced architecturally — Critic agent blocked at instantiation during non-Converge phases, two-stage evaluative content detection (hard-block patterns + constructive-context allowlist, <5% false positive rate verified against 50-sentence corpus), Black Hat phase constraint, per-session violation logging
- **Session Manager:** 5-status state machine (created → active → paused → completed/abandoned), append-only JSONL persistence for ideas and questions, timer system with technique-specific defaults and pause/resume, `SessionStateSchema.parse()` on every disk read
- **Phase Controller:** Strict Explore → Diverge → Organize → Converge → Act ordering with rejection of skip attempts, per-phase agent activation matrix, phase transition announcements, technique transitions with mandatory timer reset
- **Technique Engine:** Pluggable engine with lazy factory registry for 16 techniques — 4 individual (freewriting, mind mapping, rapid ideation, question brainstorming), 5 collaborative (brainwriting 6-3-5, round robin, brain-netting, rolestorming, figure storming), 4 analytical (SCAMPER, Six Thinking Hats, starbursting, Five Whys), 3 visual (storyboarding, affinity mapping, lotus blossom)
- **Pathway Router:** 5 pathway definitions (Creative Exploration, Problem-Solving, Product Innovation, Decision-Making, Free-Form) with signal-word situation matching and mid-session adaptive resequencing on low energy, saturation, or user request
- **Artifact Generator:** Session transcript (Markdown with phase headers and timestamps), action plan (ownership, deadlines, priorities), JSON export (complete session state), cluster map (Organize phase output)
- **Facilitator Agent:** Problem assessment with 5-nature classification, pathway recommendation, transition confidence scoring (timer×0.2 + saturation×0.3 + user_signal×0.4 + min_threshold×0.1), energy management with PRESSURE_PHRASES guard, adaptive technique sequencing, non-judgmental Humane Flow voice
- **Technique Agents:** 7 specialized agents — Ideator (5 techniques, never evaluates), Questioner (3 techniques, redirects answers to questions), Analyst (SCAMPER lens cycling, Six Hats coordination with hat-color broadcast), Mapper (4 organizational techniques, quality-evaluation constraint), Persona (constructive figures only, 9 ALLOWED_FIGURES), Critic (Converge-only with 4-dimension evaluation and 3 prioritization methods), Scribe (always-on capture, Zod validation at agent boundary)
- **SessionBus:** 4-loop filesystem message router (session, capture, user, energy) with MESSAGE_ROUTE Record<MessageType, BusLoop> for compile-time exhaustive routing, drain-pattern for atomic concurrent access
- **Integration Testing:** 18 safety-critical tests (SC-01 through SC-18), 3 end-to-end pathway tests (Creative Exploration, Problem-Solving, Free-Form), bus load test (4 concurrent writers, 12 messages, <200ms)
- **Chipset YAML:** 6 skills, 8-agent roster, 4 activation profiles (solo_quick, guided_exploration, full_workshop, analysis_sprint), skill-creator observation hooks for `.brainstorm/sessions/*/`

### Stats

- 7 phases (305-311), 25 plans, 63 commits, 321 tests, 46 requirements, ~16K LOC

---

## [1.31.0] - 2026-02-22

### Added

- **MCP Foundation Types:** Shared TypeScript interfaces and Rust FFI types with Zod schemas for Tool, Resource, Prompt, ServerCapability, TransportConfig, McpMessage, TraceEvent, and staging gate contracts (TrustState, SecurityGate, HashRecord, ValidationResult)
- **Rust MCP Host Manager:** Server lifecycle management with stdio transport, MCP handshake, crash detection with exponential backoff restart, multi-server orchestration, tool routing by name, capability caching, trace emission via Tauri events
- **Server Registry:** JSON file persistence for server configs across Tauri restarts, health status tracking, quarantine state management
- **Gateway MCP Server:** 19 tools across 6 groups (project, skill, agent, workflow, session, chipset), 4 resource providers (project configs, skill registry, agent telemetry, chipset state), 3 prompt templates, Streamable HTTP transport with bearer token auth and per-tool scope enforcement
- **MCP Template Generators:** Server, host, and client project scaffolds producing complete TypeScript projects with package.json, tsconfig.json, SDK setup, example tools/resources/prompts, tests, CLAUDE.md, and chipset.yaml
- **Agent Bridge:** Generic Agent-Server Adapter wrapping agents as MCP servers, SCOUT (3 tools, 2 resources) and VERIFY (4 tools, 2 resources) exposed as MCP servers, Agent-Client Adapter giving EXEC MCP client capability with concurrency limiting and context isolation
- **MCP Security Pipeline:** Tool definition hash gate (SHA-256 with drift detection), trust manager (quarantine/provisional/trusted lifecycle with 30-day decay), invocation validator (injection and traversal blocking), rate limiter (per-server and per-tool), audit logger (with secret redaction), staging pipeline as single unbypassable entry point
- **Blueprint Editor MCP Blocks:** Server, Tool, and Resource block types with port rendering, status indicators, and type-safe wiring engine with deny-by-default rules
- **MCP Trace Panel:** Real-time JSON-RPC message flow display with latency sparklines, server/tool filtering
- **Security Dashboard:** Trust state per server, hash change alerts, blocked call log
- **Boot Sequence MCP Peripherals:** Amiga POST aesthetic display of MCP servers with connection status and tool counts
- **Tauri IPC Bridge:** 5 commands (connect, disconnect, invoke_tool, get_trace, get_trust_state) exposing host manager to frontend
- **Integration Wiring:** All 19 tools registered in production gateway factory, per-tool scope enforcement at HTTP level, Rust StagingGate before mcp_call_tool, agent bridge staging with source tracking

### Stats

- 12 phases (293-304), 28 plans, 37 commits, 838 tests (771 TS + 67 Rust), 80 requirements, ~24K LOC

---

## [1.30.0] - 2026-02-22

### Added

- **VTM Foundation Types:** Zod schemas for all 8 vision-to-mission document structures with inferred TypeScript types, 60/40 principle budget constraints, and programmatic schema iteration
- **Vision Document Parser:** Regex-based section extraction, archetype classifier (Educational/Infrastructure/Organizational/Creative), quality checker, and dependency extractor
- **Research Reference Compiler:** Tiered knowledge chunking (summary/active/reference), source quality checker, safety extractor with boundary classification, and research necessity detector
- **Mission Package Assembler:** Self-contained component specs, milestone spec generator, wave planning integration, model assignment, test plan generation, and file count scaling
- **Wave Planner:** Parallel track detection via graph coloring, dependency graph generator with critical path marking, sequential savings calculator, and risk factor analyzer
- **Model Assignment Engine:** Weighted signal registry (Opus/Sonnet/Haiku), confidence scoring, budget validator enforcing 60/40 principle, and downgrade-only auto-rebalance
- **Cache Optimizer:** Shared load detection, schema reuse analysis, knowledge tier calculation, TTL validation, and token savings estimation
- **Test Plan Generator:** Categorized specs (S/C/I/E IDs), verification matrix builder, safety-critical classifier, and test density checker
- **Template System:** Mustache-style renderer with Zod schema validation, memory-cached loader, and 7-template registry
- **Pipeline Orchestrator:** End-to-end vision → research → mission with configurable stage skipping, template rendering, wave analysis enrichment, budget auto-rebalance, and structured error reporting

### Stats

- 14 phases (279-292), 26 plans, 65 commits, 679 tests, 58 requirements, ~20K LOC

---

## [1.29.0] - 2026-02-21

### Added

- **MNA Circuit Simulator:** DC/AC/transient analysis, Newton-Raphson nonlinear solver, Gaussian elimination with partial pivoting, 7 component models (R/C/L/diode/BJT/MOSFET/op-amp), stamp logging, circuit file format round-trip
- **Digital Logic Simulator:** 8 gate types, CMOS gate internals, truth table generation, ASCII timing diagrams with propagation delay, flip-flops (SR/D/JK/T), 4-bit ripple-carry adder
- **Safety Warden:** 3 operating modes (annotate/gate/redirect), IEC 60449 voltage classification, positive framing (8 prohibited words), professional context detection, per-module safety assessments
- **Learn Mode System:** 3-level depth (practical/reference/mathematical), H&H citation lookup, sidebar UI component, depth markers in all 15 modules
- **15 Educational Modules:** 4 tiers — Tier 1 (circuits/passives/signals), Tier 2 (diodes/transistors/op-amps/power), Tier 3 (logic/sequential/data-conversion/DSP), Tier 4 (MCU/sensors/PLC/off-grid/PCB)
- **5 Specialized Engines:** DSP (FFT/FIR/convolution/quantization), GPIO (UART/SPI/I2C/PWM/ADC/timer), PLC (ladder logic/PID/Modbus/scan cycle), Solar (single-diode/MPPT/battery/inverter), PCB (impedance/DRC/EMI/trace routing/Gerber)
- **77 Interactive Labs:** Hands-on experiments across all 15 modules grounded in *The Art of Electronics*

### Stats

- 17 phases (262-278), 39 plans, 92 commits, 10,707 tests, 95 requirements, ~29K LOC

---

## [1.28.0] - 2026-02-21

### Added

- **Filesystem Message Bus:** 8 priority levels, ISA compact encoding, Dispatcher routing, queue health metrics, dead-letter handling, message pruning
- **10-Position Staff Topology:** Coordinator, Relay, Planner, Configurator, Monitor, Executor, Verifier, Sentinel, Chronicler, Dashboard — organized into 5 operational divisions
- **4 Topology Profiles:** Scout (3 positions), Patrol (5), Squadron (7), Fleet (10) with phase-count-based auto-selection
- **HALT/CLEAR Protocol:** Priority 0 emergency stop via bus message, 9-type recovery decision matrix in Sentinel
- **Chipset YAML Reproducibility:** Deterministic parsing and startup from single config file
- **Independent Verification:** Verifier operates independently of Executor with no context bleed

### Stats

- 7 phases (255-261), 22 plans, 51 commits, 675 tests, 81 requirements, ~18.9K LOC

---

## [1.27.0] - 2026-02-20

### Added

- **35 Foundational Knowledge Packs:** 15 Core Academic, 10 Applied, 10 Specialized — each with vision doc, modules YAML, activities JSON, assessment, and resources
- **Pack Runtime Infrastructure:** Zod schemas for pack types, registry with filtering, dependency resolver with circular detection, content loader, barrel exports
- **GSD-OS Knowledge Pack Dashboard:** Browser panel with tier grouping, full-text search, detail view with prerequisites/grade levels, skill tree visualization, progress tracking, activity suggestion engine
- **Observation Infrastructure:** 6 learner observation types with ObservationEmitter, AMIGA Event Bridge with 6 event types, 4-pattern learning detector, pathway adapter, activity scaffolder, approach promoter

### Stats

- 12 phases (243-254), 79 plans, 144 tests, 81 requirements, ~23.6K LOC

---

## [1.26.0] - 2026-02-19

### Added

- **INDEX Infrastructure:** Aminet INDEX.gz download/decompress/parse for ~84,000 packages, .readme metadata extractor (Short/Author/Uploader/Type/Version/Requires/Architecture), JSON cache with 24h staleness, incremental RECENT updates, AmigaBinaryReader for hunk executables and boot blocks
- **Mirror State & Download Engine:** 7-state per-package tracking, atomic JSON persistence, rate-limited HTTP fetching with configurable concurrency, SHA-256 integrity verification, configurable mirror list with fallback
- **Search, Browse & Collections:** 3-tier relevance-ranked full-text search, hierarchical category tree with package counts, architecture/OS filtering, unified PackageDetail view, YAML collection format with 5 starter sets (31 packages), CRUD collection manager
- **Virus Scanner & Quarantine:** 52 byte-pattern signatures across 3 virus families (boot block, file, link), context-aware signature scanning, 4-rule heuristic hunk analysis, 4-rule boot block analysis, quarantine with atomic file moves and metadata sidecars, 3-layer scan orchestrator with configurable depth policies (fast/standard/thorough), community checksum lookup, emulated scanning via FS-UAE
- **Installation Pipeline:** LhA extraction via lhasa with path traversal prevention, LZX extraction via unlzx with cwd workaround, 11-assign Amiga filesystem mapper (case-insensitive), dependency detector (5 types from .readme Requires), install tracker with JSON manifests and clean uninstall, scan gate enforcement (INS-07/08/09)
- **Emulator Integration:** FS-UAE config generator, 5 hardware profiles (A500/A1200/A1200+030/A4000/WHDLoad), self-contained CRC32 ROM scanner with Cloanto encrypted ROM support, priority-based profile auto-selection, WHDLoad slave detection with per-game hardware overrides, 9-slot state snapshot system
- **GSD-OS Integration:** Chipset YAML (5 agents, 6 skills, pipeline team, 7% token budget), 6 SKILL.md files, 5-stage pipeline orchestrator with scan gate, 4-pane Workbench-style browser panel, 4-color status indicators, mirror statistics dashboard widget, 14-test cross-module integration suite

### Stats

- 7 phases (236-242), 40 plans, 91 commits, 10,032 tests, 81 requirements, ~23,616 LOC

---

## [1.25.0] - 2026-02-19

### Added

- **Ecosystem Dependency DAG:** 20-node dependency map with 48 typed edges, machine-readable YAML, Mermaid diagram, critical path analysis (4-hop chain), and 5-milestone build sequencing recommendation
- **EventDispatcher Specification:** Canonical single-inotify watcher with 6 subscriber profiles, 1,020 watch budget (25% of 4,096 target), AMIGA EventEnvelope as ecosystem standard, migration plan for 2 existing watchers, and inotify-over-fanotify rationale
- **Dependency Philosophy:** 4-tier layering (Core zero deps, Middleware lean npm, Platform native, Educational inherits) with per-layer contracts, numbered decision tree, ESLint 9+ flat config, Rust module visibility strategy, and 4-step exception process
- **Integration Test Strategy:** Zod `.toJSONSchema()` + Vitest contract testing with Pact rejection rationale, 6 priority flows with specific I/O, 8 semantic test cases per boundary, freshness policies with 3-tier staleness thresholds, fixture directory structure, and EventDispatcher compliance audit
- **Partial-Build Compatibility Matrix:** 48-edge compatibility matrix with 3-state degradation tables, 99 known-issues classified (51 aspirational, 26 environment-dependent, 9 permanent, 13 resolved), per-component standalone modes, and 3-tier capability probe protocol

### Stats

- 5 phases (231-235), 14 plans, 18 commits, 9,355 tests, 38 requirements, 17 spec documents (~10,558 lines)

---

## [1.24.0] - 2026-02-19

### Added

- **Conformance Matrix:** 336-checkpoint matrix covering every "In Scope v1" claim across 18 vision documents with 4-tier triage (T0 Foundation, T1 Integration, T2 Behavior, T3 UX/Polish) and dependency graph
- **Foundation Audit (T0):** GSD lifecycle, skill loading pipeline, build health, subagent spawning, message bus all verified end-to-end
- **Integration Audit (T1):** Observation pipeline (302 tests), AMIGA ICDs (1123 tests), dashboard collectors, console-to-staging flow, AGC pack integration verified
- **Behavior Audit (T2):** Token budgets, pattern detection, bounded learning, AGC 38 instructions, staging 11 hygiene patterns, security hardening all verified
- **UX/Polish Audit (T3):** GSD-OS build, CRT shader, window manager, dashboard design system, educational content all verified
- **E2E Verification:** Full proof run with 9,355 tests passing, all 4 conformance gates at 100%
- **Documentation Amendments:** 125 vision document amendments with fix-or-amend protocol, known-issues list with 8 deferral groups

### Stats

- 8 phases (223-230), 31 plans, 55 commits, 9,355 tests, 63 requirements
- Conformance: 211 pass + 125 amended = 336 checkpoints, zero failures

---

## [1.23.0] - 2026-02-19

### Added

- **AMIGA Mission Infrastructure:** MC-1 Control Surface (dashboard, 8-command parser, 3-tier alerts, Go/No-Go gates), ME-1 Mission Environment (provisioner, phase engine, swarm coordinator, archive writer), CE-1 Commons Engine (attribution ledger, weighting engine, dividend calculator), GL-1 Governance Layer (commons charter, rules engine, policy queries) with 4 typed ICDs and end-to-end meta-mission
- **Apollo AGC Block II Simulator:** Complete CPU emulation with 38 instructions, ones' complement ALU, bank-switched memory (EBANK/FBANK/superbank), interrupt system (10 vectors), I/O channels (512), and 2.048 MHz timing model
- **AGC Executive/Waitlist/BAILOUT:** Priority-based cooperative scheduler with 8 core sets, timer-driven task queue (9 entries, centisecond dispatch), restart protection with Apollo 11 1202 alarm reproduction
- **DSKY Interface:** Authentic display model (relay decoding, 6 registers, 11 annunciators), 19-key keyboard, VERB/NOUN command processor, Executive Monitor with real-time scheduling visualization, and learn mode annotations
- **AGC Development Tools:** yaYUL-compatible assembler, step debugger with breakpoints/watchpoints, disassembler, rope loader (Virtual AGC format), 54-test validation suite
- **AGC Curriculum:** 11 chapters from orientation to AGC-to-GSD patterns, 8 hands-on exercises with bare-metal programs culminating in 1202 alarm capstone
- **RFC Reference Skill:** 3-agent system (retriever, analyzer, citation builder), 5 Python scripts, built-in 57-RFC index covering 9 protocol families with obsolescence awareness, multi-format output (Markdown/JSON/BibTeX)

### Stats

- 24 phases (199-222), 74 plans, 146 commits, 2,164 tests, 99 requirements

---

## [1.22.0] - 2026-02-19

### Added

- **Local Cloud Infrastructure:** PXE boot server, kickstart automation, hypervisor-agnostic VM provisioning across KVM/VMware/VirtualBox
- **Minecraft Knowledge World:** Fabric server with Syncmatica mod stack, automated deployment pipeline, themed district layout, spawn area with tutorial path, schematic library (10 templates), educational curriculum
- **Platform Portability:** Hardware discovery, distribution abstraction (dnf/apt/pacman), multi-hypervisor VM operations, container fallback
- **Amiga Emulation:** FS-UAE with AROS ROM, application profiles (Deluxe Paint, OctaMED, ProTracker, PPaint), IFF/ILBM and MOD/MED format converters, legally curated 50-item content collection
- **Chipset Formalization:** 20 SKILL.md files, 10 agent definitions across 5 teams, team topologies (pipeline/map-reduce/swarm/leader-worker), unified chipset configuration with trigger routing
- **Operational Maturity:** Automated RCON-quiesced backups with 24/7/4 rotation, Prometheus monitoring with 9 alert rules, golden image lifecycle (<5min clone, <20min scratch), four operational runbooks

### Stats

- 30 phases (169-198), 37 plans, 108 commits, 73 requirements

---

## [1.21.0] - 2026-02-14

### Added

- **Tauri Desktop Shell:** Native desktop app with Rust backend, Vite webview frontend, and bidirectional IPC (commands, events, channels) with capability ACL security
- **WebGL CRT Engine:** Multi-pass post-processing with scanlines, barrel distortion, phosphor glow, chromatic aberration, vignette, and CSS fallback
- **Indexed Palette System:** 32-color system with 5 retro-computing presets (Amiga 1.3/2.0/3.1, C64, custom), OKLCH generation, and copper list raster effects
- **Native PTY Terminal:** Rust-backed pseudo-terminal with xterm.js emulator, watermark-based flow control, and tmux session binding with detach-on-close
- **Desktop Environment:** Amiga Workbench-inspired window manager with depth cycling, drag/resize, taskbar with process indicators, pixel-art icons, system menu, keyboard shortcuts
- **Boot & Calibration:** Three-screen calibration wizard (color picking, CRT tuning, theme selection), Amiga chipset boot sequence animation, accessibility auto-detection

### Stats

- 11 phases (158-168), 34 plans, 83 commits, 636 tests, 50 requirements

---

## [1.20.0] - 2026-02-14

### Added

- **Unified CSS Pipeline:** 18 component style modules wired into generator with design system token compliance (no hardcoded hex colors)
- **Topology Data Collector:** Reads real skill/agent/team files with gray-matter parsing, domain inference, and entity legend rendering
- **Activity Feed Collector:** Transforms git commits and session observations into FeedEntry[] with scope classification and domain inference
- **Budget-Silicon Collector:** Bridges CumulativeBudgetResult and IntegrationConfig to gauge/panel renderers with domain color mapping
- **Staging Queue Collector:** Reads queue-state.json for dashboard panel visualization with 7-state color badges
- **Console Page Assembly:** Settings panel, activity timeline, question cards, and submit flow as 6th generated page (console.html)

### Stats

- 6 phases (152-157), 12 plans, 23 commits, 110 tests, 23 requirements

---

## [1.19.0] - 2026-02-14

### Added

- **Budget Inventory Model:** LoadingProjection type with `projectLoading()` pure function simulating BudgetStage tier-based selection (critical > standard > optional, profile-aware)
- **Installed vs Loadable:** CumulativeBudgetResult extended with `installedTotal`/`loadableTotal` separation and dual-view `formatBudgetDisplay`
- **CLI Status Redesign:** Two-section layout with "Installed Skills" proportional percentages and "Loading Projection" loaded/deferred breakdown with color-coded budget bar (green/cyan/yellow/red)
- **JSON Output Mode:** `status --json` returns structured installed array and loading projection data
- **Dashboard Gauge Update:** Budget gauge shows loading projection with deferred skills hover tooltip, over-budget clamped rendering with red outline, and 80%/95% threshold transitions
- **Budget Configuration:** Per-profile cumulative budgets in integration config with env var backward compatibility, dual-dimension budget history with graceful old-snapshot migration

### Stats

- 3 phases (149-151), 7 plans, 14 commits, 284 tests, 27 requirements

---

## [1.18.0] - 2026-02-14

### Added

- **CSS Design System:** 6 domain colors, 4 signal colors, typography tokens (Inter + JetBrains Mono), spacing scale, and 5 status states
- **Gantry Status Strip:** Persistent status bar with agent circles, phase fractions, budget bar, 8-cell max, wired into all dashboard pages
- **Entity Shape System:** 6 SVG shapes (circle, rect, hexagon, chevron, diamond, dot) with shape+color encoding and collapsible legend
- **Topology View:** Subway-map SVG renderer with bezier edges, 12-node collapse, animated pulses, and click-to-detail panel
- **Activity Feed:** Unicode shape indicators with domain colors, 8-entry newest-first display, tab toggle to terminal view
- **Budget Gauge & Silicon Panel:** Stacked bar with threshold transitions, diamond adapters, VRAM gauge, progressive enhancement
- **Domain Identifiers:** Domain-prefixed encoding (F-1, B-1.api, T-1:rcp) with backward compatibility and SKILL.md metadata

### Stats

- 7 phases (142-148), 15 plans, 35 commits, 515 tests, 53 requirements

---

## [1.17.0] - 2026-02-13

### Added

- **Staging Foundation:** 5-state filesystem pipeline (inbox/checking/attention/ready/aside) with structured metadata
- **Hygiene Engine:** Pattern detection for embedded instructions, hidden content, and YAML config safety issues (11 built-in patterns)
- **Trust-Aware Reporting:** Familiarity tiers (Home/Neighborhood/Town/Stranger), trust decay, and critical pattern lockout
- **Smart Intake Flow:** Clarity assessment routing (clear/gaps/confused), step tracking, and crash recovery
- **Resource Analysis:** Vision document analyzer, skill cross-reference matching, topology recommendation, and token budget estimation
- **Derived Knowledge Checking:** Provenance chain tracking, phantom content detection, scope drift detection, and copying signals
- **Staging Queue:** 7-state machine with append-only audit log, cross-queue dependency detection, and optimization analysis
- **Queue Pipelining:** Pre-wiring engine, retroactive hygiene audit recommender, and dashboard staging queue panel

### Stats

- 8 phases (134-141), 35 plans, 83 commits, 699 tests, 38 requirements

---

## [1.16.0] - 2026-02-13

### Added

- **Filesystem Message Bus:** `.planning/console/` with Zod-validated JSON envelopes, directional routing (inbox/outbox), and pending→acknowledged lifecycle
- **HTTP Helper Endpoint:** Browser→filesystem writes with path traversal prevention, subdirectory allowlist, and JSONL audit logging
- **Upload Zone:** Drag-and-drop markdown ingestion, document metadata extraction, and 7-section milestone configuration form
- **Inbox Checking:** GSD skill for inbox checking at session-start, phase-boundary, and post-verification with message type dispatch
- **Question Cards:** 5 question types (binary, choice, multi-select, text, confirmation) with timeout fallback and urgency escalation
- **Console Dashboard Page:** Live session status, hot-configurable settings panel, activity timeline, and clipboard fallback mode

### Stats

- 6 phases (128-133), 18 plans, 41 commits, 275 tests, 27 requirements

---

## [1.15.0] - 2026-02-13

### Added

- **Terminal Config:** TerminalConfigSchema with Zod validation for port, base_path, auth_mode, theme, session_name
- **Wetty Process Manager:** Spawn lifecycle, HTTP health check via native fetch, start/stop/status/restart API
- **tmux Session Binding:** Auto-detection, compound attach-or-create command, configurable session names
- **Terminal Dashboard Panel:** Themed iframe, dark CSS, JavaScript offline fallback, and config-driven URL
- **Unified Launcher:** DevEnvironmentManager composing dashboard + terminal via Promise.allSettled

### Stats

- 5 phases (123-127), 11 plans, 22 commits, 211 tests, 17 requirements

---

## [1.14.0] - 2026-02-13

### Added

- **Execution Capture:** Pipeline pairing tool_use/tool_result with SHA-256 content hashes for cross-session comparison
- **Determinism Analyzer:** Three-tier classification with configurable variance thresholds
- **Promotion Detector:** Weighted composite scoring (determinism 40%, frequency 35%, token savings 25%)
- **Script Generator:** Tool-to-bash mapping, dry-run validation, and Blitter OffloadOperation conformance
- **Promotion Gatekeeper:** F1/accuracy/MCC calibration metrics with auditable decision trail
- **Drift Monitor & Feedback Bridge:** Post-promotion variance monitoring with automatic demotion
- **Lineage Tracker:** Bidirectional provenance querying across all pipeline stages
- **Dashboard Collectors:** Pipeline status, determinism scores, and lineage views for visualization

### Stats

- 8 phases (115-122), 16 plans, 32 commits, 27 requirements

---

## [1.13.0] - 2026-02-12

### Added

- **Message Stack:** Async command queuing with push/peek/pop/clear and priority levels (urgent/normal/low)
- **Advanced Stack Ops:** `poke` for tmux direct interaction, `drain` for headless batch processing
- **Session Lifecycle:** Start/list/watch/pause/resume/stop/save with tmux integration and heartbeat monitoring
- **Recording System:** Stream capture (terminal, stack events, file changes) with markers and 14-metric computation
- **Playback Engine:** Four modes — analyze (timeline), step (interactive), run (benchmark), feed (JSONL playbooks)
- **Pipeline List Format:** WAIT/MOVE/SKIP instructions with Zod schemas, YAML parser, lifecycle event synchronization
- **Blitter Engine:** Script promotion from skill metadata, child process execution with timeout, completion signals
- **Pipeline Executor:** Lifecycle sync bridge, WAIT blocking/resolution, activation dispatch (sprite/full/blitter/async)
- **Team-as-Chip Framework:** Agnus/Denise/Paula/Gary chip definitions, FIFO message ports, 32-bit signal system
- **Exec Kernel:** Prioritized round-robin scheduler, 18 typed message protocols, DMA token budgets with burst mode
- **Pipeline Learning:** Observation-to-list compiler, Jaccard feedback engine, versioned library with best-match retrieval
- **Integration Layer:** StackBridge, SessionEventBridge, PopStackAwareness connecting bash and TypeScript tracks

### Stats

- 14 phases (101-114), 35 plans, 71 commits, 1057 tests, 39 requirements

---

## [1.12.1] - 2026-02-12

### Added

- **Three-Tier Sample Rates:** Hot (1-2s), warm (5-10s), cold (on-change) with per-section JavaScript refresh
- **Data Collectors:** Git metrics, session observations, and planning artifact collectors as typed objects
- **Live Session Pulse:** Active session card with ticking duration, commit feed, heartbeat indicator, message counters
- **Phase Velocity:** Timeline visualization, per-phase stats table, TDD rhythm analysis, progress card
- **Planning Quality:** Accuracy scores, emergent work ratio, deviation summaries, accuracy trend sparkline
- **Historical Trends:** Milestone comparison table, commit type distribution, velocity curves, file hotspots
- **Graceful Degradation:** Empty states for all missing data sources, never crashes

### Stats

- 7 phases (94-100), 14 plans, 27 commits, 460 dashboard tests, 30 requirements

---

## [1.12.0] - 2026-02-12

### Added

- **Dashboard Generator:** Markdown-to-HTML parser for `.planning/` artifacts (PROJECT, REQUIREMENTS, ROADMAP, STATE, MILESTONES)
- **Dashboard Pages:** 5 pages with dark theme, embedded CSS, no external dependencies (works from `file://`)
- **Structured Data:** JSON-LD (Schema.org SoftwareSourceCode, ItemList) and Open Graph meta tags
- **Incremental Builds:** SHA-256 content hashing, `.dashboard-manifest.json`, skip-unchanged optimization
- **Auto-Refresh:** Scroll position preservation via sessionStorage, visual refresh indicator, configurable intervals
- **GSD Slash Command:** `/gsd-dashboard` with generate/watch/clean subcommands

### Stats

- 6 phases (88-93), 7 plans, 15 commits, 239 tests, 30 requirements

---

## [1.11.0] - 2026-02-12

### Added

- **Integration Config:** `.planning/skill-creator.json` with per-feature boolean toggles and Zod schema validation
- **Install Script:** Idempotent deployment with `--uninstall`, git hook management, component status reporting
- **Post-Commit Hook:** POSIX shell capturing commit metadata to `sessions.jsonl` (<100ms, zero network calls)
- **Session Commands:** `/sc:start` briefing, `/sc:status` budget dashboard, `/sc:suggest` interactive review, `/sc:observe` snapshot, `/sc:digest` learning digest, `/sc:wrap` command listing
- **Wrapper Commands:** `/wrap:execute`, `/wrap:verify`, `/wrap:plan` with skill loading, `/wrap:phase` smart lifecycle router
- **Passive Monitoring:** Plan-vs-summary diffing, STATE.md transition detection, ROADMAP.md structural diff

### Stats

- 6 phases (82-87), 16 plans, 40 requirements

---

## [1.10.0] - 2026-02-12

### Added

- **Path Traversal Prevention:** `validateSafeName` + `assertSafePath` wired into SkillStore, AgentGenerator, TeamStore
- **YAML Safety:** Safe deserialization rejecting dangerous tags (`!!js/function`, etc.) with Zod schema validation
- **JSONL Integrity:** SHA-256 checksums, schema validation, rate limiting, anomaly detection, compaction, purge CLI
- **Discovery Safety:** Secret redaction, allowlist/blocklist, structural-only filtering, dangerous command deny list
- **Learning Safety:** Cumulative drift tracking with 60% threshold, contradiction detection, audit CLI
- **Team Message Sanitization:** 13 prompt injection pattern detections with content-length limits
- **Config Validation:** Range validation engine with security-aware field registry and validate CLI
- **Inheritance Validation:** Depth limits, circular dependency detection, impact analysis CLI
- **File Integrity:** Monitoring, audit logging, file-based concurrency locks, operation cooldowns
- **Operational Safety:** Hook error boundaries, orchestrator confirmation gates, classification audit logging
- **SECURITY.md:** 6-domain threat model and GitHub Actions CI with npm audit

### Stats

- 11 phases (71-81), 24 plans, 39 requirements

---

## [1.9.0] - 2026-02-12

### Added

- **Spec Alignment:** Full Claude Code spec compliance with $ARGUMENTS injection, context:fork detection, dual-format allowed-tools, !command syntax, and shell injection prevention
- **Progressive Disclosure:** Large skills auto-decompose into SKILL.md + references/ + scripts/ with token budget awareness
- **Cross-Platform Portability:** Export skills as portable .tar.gz archives or platform-specific formats (Claude, Cursor, Codex, Copilot, Gemini)
- **Evaluator-Optimizer:** Precision/recall/F1 tracking, A/B evaluation with t-test significance, skill health scoring, and health dashboard
- **MCP Distribution:** Publish .tar.gz skill packages, install from local/remote, MCP server exposing search/install/list/info tools
- **Enhanced Topologies:** Router and Map-Reduce team patterns, inter-team bridge communication, deadlock detection, and cost estimation
- **Session Continuity:** Session save/restore/handoff with warm-start context injection and cross-session ephemeral promotion
- **Agentic RAG:** Adaptive TF-IDF/embedding routing, corrective refinement loop, cross-project skill discovery, and version drift detection
- **Quality of Life:** Description quality scoring, enhanced status with budget dashboard and trends, Mermaid dependency graphs, GSD command reference injection

### New CLI Commands

- `export` — Export skills to portable or platform-specific formats
- `quality` — Score skill description quality with suggestions
- `status` — Enhanced status with budget breakdown and trend history
- `graph` — Generate Mermaid dependency graphs
- `publish` — Package skills as .tar.gz
- `install` — Install skill packages from local/remote
- `mcp-server` — Start MCP server on stdio
- `session save/restore/handoff` — Session continuity management
- `team estimate` — Team execution cost estimation

### New Dependencies

- `@modelcontextprotocol/sdk` — MCP server protocol support
- `modern-tar` — .tar.gz packaging for skill distribution
- `simple-statistics` — Statistical tests for A/B evaluation

### Stats

- 9 phases (62-70), 37 plans, 49 requirements
- ~20k LOC added across 127 files

---

## [1.8.1] - 2026-02-12

### Fixed - Critical (3)

- **Test Infrastructure:** Fixed mock constructors for TestStore, TestRunner, ResultStore (27/27 tests pass)
- **Team Validator Mocks:** Fixed ConflictDetector mock to work with constructor pattern (47/47 tests pass)
- **Semantic Test Timeout:** Resolved timeout in IntentClassifier tests (34/34 tests pass, 101ms execution)

### Fixed - High Priority (4)

- **Type Safety:** Replaced `any` types in 20+ files with proper TypeScript interfaces (strict mode)
- **CLI Validation:** Added bounds checking for numeric args and path validation
- **Promise Handling:** Wrapped all async operations with proper error handling
- **Dependency Validation:** Added DependencyChecker module with clear error messages

### Fixed - Medium Priority (4)

- **File Path Security:** Hardened with path.resolve() and boundary validation
- **Hard-coded Paths:** Extracted to configurable constants
- **Main() Function:** Refactored from 1500+ lines to ~200 lines
- **Cache Invalidation:** Implemented content-based and TTL-based invalidation

### Verification

- ✅ 5,346 tests passing
- ✅ Strict TypeScript mode (0 errors)
- ✅ 0 npm vulnerabilities
- ✅ All 11 audit findings resolved

---

## [1.8.0] - 2026-02-11

### Added

- Capability-Aware Planning with pluggable skill pipeline
- Token Efficiency with per-agent budgets
- Capability Manifests and skill injection
- Cache-aware skill ordering
- Research compression (10-20x reduction)
- Parallelization advisor

---

## [1.7.0] - 2026-01-15

### Added

- GSD Master Orchestration Agent
- Skill Workflows and Roles
- Work Bundles and Inter-Skill Events
- Session Continuity

---

## [1.6.0] - 2025-11-20

- 34 cross-domain examples
- Local installation support
- Beautiful commits skill

---

## [1.5.0] - 2025-09-15

- Pattern Discovery
- DBSCAN Clustering
- Draft Generation

---

## [1.4.0] - 2025-07-10

- Agent Teams with multiple topologies
- Team schemas and validation

---

## [1.3.0] - 2025-05-05

- Documentation overhaul
- Official format specification

---

## [1.2.0] - 2025-03-01

- Test infrastructure
- Activation simulation
- Benchmarking

---

## [1.1.0] - 2025-01-15

- Semantic conflict detection
- Activation scoring
- Local embeddings

---

## [1.0.0] - 2024-11-01

- Core skill management
- Pattern observation
- Agent composition
- Quality validation
