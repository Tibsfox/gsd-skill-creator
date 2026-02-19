# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

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
