# Release History

Comprehensive release notes for GSD Skill Creator across all 23 milestones.

**Totals:** 23 milestones (v1.0-v1.19 + v1.8.1 patch) | 151 phases | 437 plans | ~192k LOC | 548 requirements

---

## v1.19 — Budget Display Overhaul

**Shipped:** 2026-02-14
**Phases:** 149-151 (3 phases) | **Plans:** 7 | **Requirements:** 27

Fix the budget display across CLI and dashboard by separating the installed skill inventory from loading projection, fixing percentages, and making the budget configurable.

### Key Features

**Budget Inventory Model (Phase 149):**
- `LoadingProjection` type with `projectLoading()` pure function simulating BudgetStage tier-based selection
- Tier priority ordering: critical > standard > optional, with profile awareness
- `CumulativeBudgetResult` extended with `installedTotal` and `loadableTotal` separation
- Skills exceeding single-skill limit flagged in projection
- Dual-view `formatBudgetDisplay` showing both dimensions

**CLI Status Redesign (Phase 150):**
- Two-section layout: "Installed Skills" with proportional percentages and "Loading Projection" with loaded/deferred breakdown
- Per-skill percentage uses total installed as denominator (not budget limit)
- Over-budget scenarios show count-based summary ("3 of 14 skills fit") with no negative headroom
- Color-coded budget bar: green (<60%), cyan (60-79%), yellow (80-99%), red (>=100%)
- Mini progress bars per skill, relative to largest skill
- JSON output mode (`--json`) with structured installed array and projection object

**Dashboard Gauge & Budget Configuration (Phase 151):**
- Dashboard gauge shows loading projection with deferred skills hover tooltip
- Over-budget state renders filled bar with red outline (clamped to 100%, no overflow)
- Threshold transitions at 80% warning and 95% critical preserved
- Configurable per-profile cumulative budgets in integration config
- Environment variable `SLASH_COMMAND_TOOL_CHAR_BUDGET` backward compatible as fallback
- Dual-dimension budget history tracking installed total and loaded total separately
- History format migration handles old single-value snapshots gracefully

### Test Coverage

- 284 tests across 7 test files

---

## v1.18 — Information Design System

**Shipped:** 2026-02-14
**Phases:** 142-148 (7 phases) | **Plans:** 15 | **Requirements:** 53

Translate proven information design principles into the dashboard with a learnable visual language — shape+color encoding, persistent status gantry, topology views, and three-speed information layering.

### Key Features

**CSS Design System (Phase 142):**
- 6 domain colors mapped to project facets (skill, agent, team, phase, budget, session)
- 4 signal colors (success, warning, error, info) with accessible contrast ratios
- Typography system: Inter for UI text, JetBrains Mono for code/data
- Spacing tokens on a 4px grid with 5 named sizes
- 5 status states with consistent visual treatment

**Gantry Status Strip (Phase 143):**
- Persistent strip visible on all dashboard pages
- Agent circles showing active/idle state
- Phase progress fraction (e.g., "3/5")
- Budget bar with color-coded fill
- 8-cell maximum with overflow indicator

**Entity Shape System (Phase 144):**
- 6 SVG shapes: circle (skills), rect (agents), hexagon (teams), chevron (phases), diamond (adapters), dot (events)
- Shape+color dual encoding for accessibility
- Collapsible legend panel with all entity types

**Topology View (Phase 145):**
- Subway-map layout with SVG rendering
- Bezier curve edges with directional indicators
- 12-node collapse threshold for large topologies
- Animated pulses showing data flow
- Click-to-detail panel for node inspection

**Activity Feed (Phase 146):**
- Unicode shape indicators matching entity type
- Domain color coding per entry
- 8-entry newest-first display
- Tab toggle between activity feed and terminal view

**Budget Gauge & Silicon Panel (Phase 147):**
- Stacked bar with green/yellow/red threshold transitions
- Diamond adapter shapes for silicon panel
- VRAM gauge for memory-intensive operations
- Progressive enhancement for browsers without SVG support

**Domain Identifiers (Phase 148):**
- Domain-prefixed encoding: F-1 (skill), B-1.api (agent), T-1:rcp (team)
- Backward compatible with existing integer IDs
- SKILL.md metadata encoding for identifier persistence

### Test Coverage

- 515 tests across 15 test files

---

## v1.17 — Staging Layer

**Shipped:** 2026-02-13
**Phases:** 134-141 (8 phases) | **Plans:** 35 | **Requirements:** 38

Introduce a staging layer between human ideation and machine execution — where work is analyzed, scanned, resource-planned, and approved before entering the parallel execution queue.

### Key Features

**Staging Foundation (Phase 134):**
- 5-state filesystem pipeline: inbox → checking → attention → ready → aside
- Structured metadata per staged item (source, timestamps, state transitions)
- `.planning/staging/` directory with state-named subdirectories

**Hygiene Engine (Phase 135):**
- 11 built-in patterns detecting embedded instructions, hidden content, and YAML config safety issues
- Pattern categories: injection attempts, obfuscated content, unsafe configurations
- Severity levels with configurable thresholds

**Trust-Aware Reporting (Phase 136):**
- 4 familiarity tiers: Home (your code), Neighborhood (team), Town (org), Stranger (external)
- Trust decay over time for infrequently accessed resources
- Critical pattern lockout preventing untrusted content from reaching execution

**Smart Intake Flow (Phase 137):**
- Three-path clarity routing: clear (fast-track), gaps (questioning), confused (research)
- Step tracking with progress indicators
- Crash recovery with resumable intake state

**Resource Analysis (Phase 138):**
- Vision document analyzer extracting requirements and scope
- Skill cross-reference matching existing capabilities
- Topology recommendation based on work complexity
- Token budget estimation for execution planning

**Derived Knowledge Checking (Phase 139):**
- Provenance chain tracking (where did this knowledge come from?)
- Phantom content detection (claims without supporting evidence)
- Scope drift detection (gradual requirement expansion)
- Copying signal detection (verbatim content from external sources)

**Staging Queue (Phase 140):**
- 7-state machine: pending → analyzing → blocked → ready → executing → done → failed
- Append-only audit log for full traceability
- Cross-queue dependency detection

**Queue Pipelining (Phase 141):**
- Pre-wiring engine connecting queue items to execution plans
- Retroactive hygiene audit recommender
- Dashboard staging queue panel with real-time status

### Test Coverage

- 699 tests across 35 test files

---

## v1.16 — Dashboard Console & Milestone Ingestion

**Shipped:** 2026-02-13
**Phases:** 128-133 (6 phases) | **Plans:** 18 | **Requirements:** 27

Transform the read-only dashboard into a bidirectional control surface where users upload vision documents, configure milestone execution settings, answer structured planning questions, and adjust live settings — all via filesystem message bus.

### Key Features

**Filesystem Message Bus (Phase 128):**
- `.planning/console/` directory with inbox/outbox structure
- Zod-validated JSON envelopes with message type discrimination
- Directional routing: browser writes to inbox, GSD reads from inbox/writes to outbox
- Message lifecycle: pending → acknowledged with timestamps

**HTTP Helper Endpoint (Phase 129):**
- Browser→filesystem write bridge for dashboard forms
- Path traversal prevention with subdirectory allowlist
- JSONL audit logging of all write operations

**Upload Zone & Configuration (Phase 130):**
- Drag-and-drop markdown document ingestion
- Document metadata extraction (title, sections, word count)
- 7-section milestone configuration form (name, goal, constraints, priorities, etc.)

**Inbox Checking (Phase 131):**
- GSD skill checking inbox at session-start, phase-boundary, and post-verification
- Message type dispatch routing to appropriate handlers

**Question Cards (Phase 132):**
- 5 interactive question types: binary, choice, multi-select, text, confirmation
- Timeout fallback with sensible defaults
- Urgency escalation for time-sensitive decisions

**Console Dashboard Page (Phase 133):**
- Live session status display
- Hot-configurable settings panel (modify settings without restart)
- Activity timeline showing recent operations
- Clipboard fallback mode for environments without HTTP endpoint

### Test Coverage

- 275 tests across 18 test files

---

## v1.15 — Live Dashboard Terminal

**Shipped:** 2026-02-13
**Phases:** 123-127 (5 phases) | **Plans:** 11 | **Requirements:** 17

Integrate Wetty browser-based terminal into the planning docs dashboard with session binding and unified launcher for a complete dev environment.

### Key Features

**Terminal Configuration (Phase 123):**
- TerminalConfigSchema with Zod validation
- Fields: port, base_path, auth_mode, theme, session_name
- Wired into IntegrationConfig alongside dashboard settings

**Process Management (Phase 124):**
- Wetty spawn lifecycle with configurable options
- HTTP health check via native fetch (no axios dependency)
- Start/stop/status/restart API

**tmux Session Binding (Phase 125):**
- Auto-detection of existing tmux sessions
- Compound attach-or-create command
- Configurable session names matching GSD session naming

**Dashboard Terminal Panel (Phase 126):**
- Themed iframe with dark CSS matching dashboard
- JavaScript offline fallback for disconnected state
- Config-driven URL construction

**Unified Launcher (Phase 127):**
- DevEnvironmentManager composing dashboard + terminal
- Promise.allSettled for independent service lifecycle
- Single start/stop/status API for both services

### Test Coverage

- 211 tests across 11 test files

---

## v1.14 — Promotion Pipeline

**Shipped:** 2026-02-13
**Phases:** 115-122 (8 phases) | **Plans:** 16 | **Requirements:** 27

Connect 5 isolated subsystems (Blitter, Pipeline Learning, Observation, Calibration, Pattern Detection) into an integrated promotion pipeline — from execution capture through deterministic analysis to automatic script promotion with metrics-driven gatekeeping.

### Key Features

**Execution Capture (Phase 115):**
- Pipeline pairing tool_use/tool_result events
- SHA-256 content hashes for cross-session comparison
- Structured capture format with timestamps and metadata

**Determinism Analyzer (Phase 116):**
- Three-tier classification: deterministic, semi-deterministic, non-deterministic
- Configurable variance thresholds per tool type
- Cross-session comparison for stability assessment

**Promotion Detector (Phase 117):**
- Weighted composite scoring: determinism (40%), frequency (35%), token savings (25%)
- Promotion candidate ranking with evidence trails

**Script Generator (Phase 118):**
- Tool-to-bash mapping for deterministic operations
- Dry-run validation before script creation
- Blitter OffloadOperation conformance for execution integration

**Promotion Gatekeeper (Phase 119):**
- F1/accuracy/MCC calibration metrics as gate criteria
- Auditable decision trail for all promote/reject decisions

**Drift Monitor & Feedback Bridge (Phase 120):**
- Post-promotion variance monitoring
- Automatic demotion when script behavior diverges from expected
- Feedback bridge connecting user corrections to promotion decisions

**Lineage Tracker (Phase 121):**
- Bidirectional provenance querying
- Full lineage from observation → pattern → promotion → script
- Cross-stage relationship mapping

**Dashboard Collectors (Phase 122):**
- Pipeline status collector showing promotion pipeline state
- Determinism scores visualization
- Lineage views for exploring promotion chains

---

## v1.13 — Session Lifecycle & Workflow Coprocessor

**Shipped:** 2026-02-12
**Phases:** 101-114 (14 phases) | **Plans:** 35 | **Requirements:** 39

A dual-track system adding gsd-stack (bash session/recording infrastructure) and chipset (TypeScript Amiga-inspired coprocessor architecture) that converge at integration -- sessions feed learning, lifecycle events drive Pipeline execution.

### gsd-stack Track (Phases 101-107)

Pure bash infrastructure for session management and recording.

**Stack Core (Phase 101):**
- `gsd-stack` CLI with directory bootstrapping and environment configuration
- History logging to `history.jsonl`, status and log subcommands
- Auto-creates `.claude/stack/` hierarchy (pending/, done/, sessions/, recordings/, saves/)

**Message Stack (Phase 102):**
- `push` — Queue messages with priority (urgent/normal/low), YAML frontmatter, stdin support
- `peek` — Inspect next message without consuming (FIFO/LIFO mode)
- `pop` — Consume and move message from pending/ to done/ (audit-preserving)
- `clear` — Move all pending to done/ with count reported

**Advanced Operations (Phase 103):**
- `poke` — Direct tmux session interaction (send-keys bypass queue)
- `drain` — Headless batch mode, sequential pop-and-execute via `claude -p --continue`

**Session Lifecycle (Phases 104-105):**
- `session` — Start managed Claude Code session in tmux with meta.json, heartbeat process
- `list` — Show all sessions with live state detection (active/stalled/paused/stopped/saved)
- `watch` — Read-only tmux attach for monitoring running sessions
- `pause` — Send Ctrl+C interrupt, update meta to paused, auto-save state
- `resume` — Three-path logic: warm-start paused, recover stalled, seed from saved
- `stop` — Graceful shutdown sequence with final stats
- `save` — Snapshot creation with meta, STATE.md, pending stack, terminal context

**Recording System (Phases 106-107):**
- `record` — Background capture to stream.jsonl (terminal, stack events, file changes)
- `mark` — Insert named markers during recording
- `play` — Four replay modes: analyze (timeline), step (interactive), run (benchmark), feed (playbooks)
- `metrics` — 14-metric computation engine with display and `--compare` for side-by-side diffs

### Chipset Track (Phases 108-113)

TypeScript Amiga-inspired coprocessor architecture for agent coordination.

**Pipeline List Format (Phase 108):**
- WAIT/MOVE/SKIP instruction types with Zod schemas and YAML parser
- WAIT instructions sync to GSD lifecycle events (phase-start, phase-planned, tests-passing, etc.)
- MOVE instructions specify target (skill/script/team) with activation mode (sprite/full/blitter/async)
- Pre-compilation during planning, automatic loading during execution

**Offload Engine (Phase 109):**
- Script promotion from skill metadata for deterministic operations
- Child process execution with timeout management, output capture
- Completion signals propagate for downstream Pipeline synchronization

**Pipeline Executor (Phase 110):**
- Lifecycle sync bridge: GSD lifecycle events resolve WAIT instructions
- Activation dispatch: sprite (~200 tokens), full, blitter (offload), async modes
- SKIP condition evaluation against filesystem state and runtime variables

**Team-as-Chip Framework (Phase 111):**
Four specialized chips modeled after the Amiga chipset:

| Chip | Domain | Analog |
|------|--------|--------|
| **Agnus** | Context management (STATE.md, observations, lifecycle) | Memory controller |
| **Denise** | Output rendering (dashboards, reports, visualizations) | Graphics processor |
| **Paula** | I/O operations (git, file system, external tools) | I/O controller |
| **Gary** | Glue logic (coordination, message routing, signal distribution) | Bus controller |

- FIFO message ports with reply-based ownership semantics
- 32-bit signal system for lightweight wake/sleep coordination
- Budget channel token allocation per team

**Exec Kernel (Phase 112):**
- Prioritized round-robin scheduler (phase-critical 60%, workflow 15%, background 10%, pattern detection 10%)
- 18 typed message protocols for inter-team communication
- Per-team token budgets with guaranteed minimums and burst mode (BLITHOG)

**Pipeline Learning (Phase 113):**
- Observation-to-list compiler with confidence scoring
- Jaccard feedback engine for accuracy tracking and refinement
- Versioned library with best-match retrieval indexed by workflow type

### Integration (Phase 114)

- **StackBridge:** Recording events feed Pipeline learning system
- **SessionEventBridge:** Lifecycle states become Pipeline WAIT targets
- **PopStackAwareness:** Respects pause state, touches heartbeat, logs markers

### Test Coverage

- 541 bash tests (gsd-stack)
- 516 TypeScript tests (chipset)
- 12 end-to-end integration tests across 25 test files

---

## v1.12.1 — Live Metrics Dashboard

**Shipped:** 2026-02-12
**Phases:** 94-100 (7 phases) | **Plans:** 14 | **Requirements:** 30

Real-time visibility into GSD session activity, phase velocity, planning quality, and historical trends -- sampled at rates matching each metric's natural update frequency.

### Key Features

**Three-Tier Sample Rate Engine:**
- Hot tier (1-2s): Live session pulse, active metrics
- Warm tier (5-10s): Phase velocity, planning quality
- Cold tier (on-change): Historical trends, milestone comparisons
- Per-section JavaScript refresh with independent polling rates

**Data Collectors:**
- Git metrics, session observations, and planning artifact collectors
- Typed object architecture (not HTML generation)
- Graceful degradation for all missing data sources

**Live Session Pulse (Hot Tier):**
- Active session card with ticking duration and heartbeat indicator
- Commit feed showing recent commits
- Message queue counters (pending/done)

**Phase Velocity Metrics (Warm Tier):**
- Timeline visualization showing phase progression
- Per-phase stats table (duration, commits, status)
- TDD rhythm analysis (RED/GREEN cycle detection)

**Planning Quality Metrics (Warm Tier):**
- Accuracy scores (plan vs actual), emergent work ratio
- Deviation summaries and accuracy trend sparkline

**Historical Trends (Cold Tier):**
- Milestone comparison table, commit type distribution
- Velocity curves over time, file hotspots

### Technical Details

- CSS-only visualizations (no D3/Chart.js) -- works from `file://` protocol
- Full pipeline integration: parser -> collector -> renderer with `--live` flag
- 221 new metric tests, 460 total dashboard tests across 37 test files

---

## v1.12 — GSD Planning Docs Dashboard

**Shipped:** 2026-02-12
**Phases:** 88-93 (6 phases) | **Plans:** 7 | **Requirements:** 30

A living documentation system that mirrors `.planning/` artifacts into browsable, machine-readable HTML -- hot during sessions, static at rest.

### Key Features

**Generator Core:**
- Markdown parser reads `.planning/` artifacts (PROJECT, REQUIREMENTS, ROADMAP, STATE, MILESTONES)
- HTML renderer with embedded CSS (no external dependencies, works from `file://`)
- Dark theme with consistent layout across all pages

**Dashboard Pages:**
- **Index:** Aggregated project health, milestone progress, build log
- **Requirements:** REQ-ID badges, status indicators, cross-navigation
- **Roadmap:** Phase status visualization (pending/active/complete)
- **Milestones:** Rich timeline with expandable details
- **State:** Current position, blockers, session continuity info

**Structured Data & SEO:**
- JSON-LD (Schema.org SoftwareSourceCode, ItemList) on all pages
- Open Graph meta tags (`og:title`, `og:description`, `og:type`)
- Semantic HTML5 throughout

**Incremental Builds & Live Mode:**
- SHA-256 content hashing with `.dashboard-manifest.json` build manifest
- Auto-refresh with scroll position preservation via sessionStorage
- Visual refresh indicator, configurable interval (default 3s)

**GSD Integration:**
- Slash command (`/gsd-dashboard`) with generate/watch/clean subcommands
- Auto-generates on phase transitions when integration config enables it

### Test Coverage

- 239 tests across 11 test files, 81% branch coverage
- Integration test validates full pipeline with fixture data

---

## v1.11 — GSD Integration Layer

**Shipped:** 2026-02-12
**Phases:** 82-87 (6 phases) | **Plans:** 16 | **Requirements:** 40

Non-invasive integration connecting skill-creator's adaptive learning to GSD's workflow lifecycle -- wrapper commands, git hooks, passive monitoring, and slash commands -- without modifying any GSD commands or agents.

### Key Features

**Integration Config (Phase 82):**
- `.planning/skill-creator.json` with per-feature boolean toggles
- Token budget, observation retention, and suggestion settings
- Zod schema validation with sensible defaults, opt-out model

**Install Script (Phase 83):**
- Deploys slash commands, wrapper commands, git hook, observer agent
- Idempotent -- safe to run multiple times without clobbering user modifications
- `--uninstall` flag cleanly removes integration (preserving observation data)
- Validates installation and reports status of all components

**Post-Commit Git Hook (Phase 84):**
- POSIX shell hook captures commit metadata to `sessions.jsonl`
- Extracts current phase number from STATE.md
- <100ms execution, zero network calls, graceful degradation

**Session Start & Slash Commands (Phase 85):**
- `/sc:start` — GSD position, recent history, pending suggestions, active skills, token budget
- `/sc:status` — Per-skill token consumption breakdown, total budget usage
- `/sc:suggest` — Interactive review of pending suggestions (accept/dismiss/defer)
- `/sc:observe` — Current session observation snapshot
- `/sc:digest` — Learning digest from sessions.jsonl (patterns, activation history, phase trends)
- `/sc:wrap` — Meta-command explaining available wrapper commands

**Wrapper Commands (Phase 86):**
- `/wrap:execute` — Load skills before, record observations after GSD execute-phase
- `/wrap:verify` — Load skills before, record observations after GSD verify-work
- `/wrap:plan` — Load skills before GSD plan-phase
- `/wrap:phase` — Smart router detects phase type and delegates to appropriate wrapper
- Graceful degradation -- if skill loading fails, GSD command runs normally

**Passive Monitoring (Phase 87):**
- Plan-vs-summary diffing for completed phases (scope changes, emergent work)
- STATE.md transition detection (phase completions, blocker changes)
- ROADMAP.md structural diff (phase additions, removals, reordering)
- Scan-on-demand architecture triggered by slash and wrapper commands

### Test Coverage

- 298 tests across 6 phases (72 + 13 + 63 + 83 + 67 tests)

---

## v1.10 — Security Hardening

**Shipped:** 2026-02-12
**Phases:** 71-81 (11 phases) | **Plans:** 24 | **Requirements:** 39

Addressed all 16 findings from a comprehensive security audit across 6 security domains. No new user features -- every change hardens existing code.

### Security Domains

**1. Input Validation (Phases 71-72):**
- Path traversal prevention with `validateSafeName` + `assertSafePath` wired into SkillStore, AgentGenerator, TeamStore
- YAML safe deserialization rejecting dangerous tags (`!!js/function`, etc.) with Zod schema validation at all read sites

**2. Data Integrity (Phase 73):**
- SHA-256 checksums on JSONL entries for tamper detection
- Schema validation, rate limiting, anomaly detection
- Periodic compaction and `skill-creator purge` CLI command

**3. Information Security (Phase 74):**
- Secret redaction (API keys, tokens, passwords)
- Project allowlist/blocklist for cross-project scanning
- Structural-only results (never raw conversation content)
- Dangerous bash command deny list (recursive deletes, sudo, piped downloads)

**4. Learning Safety (Phase 75):**
- Cumulative drift tracking with 60% threshold
- Contradictory feedback detection and flagging
- `skill-creator audit <skill>` shows diff between original and current state

**5. Access Control (Phases 76-79):**
- Team message sanitization against 13 prompt injection patterns
- Config range validation with security-aware field registry
- Inheritance chain validation (depth limits, circular dependency detection)
- File integrity monitoring, audit logging, concurrency locks, operation cooldowns

**6. Operational Safety (Phases 80-81):**
- Hook error boundaries (bugs don't crash Claude Code sessions)
- Orchestrator confirmation gates for destructive operations
- Classification audit logging for auditability
- SECURITY.md with threat model and GitHub Actions CI with `npm audit`

---

## v1.9 — Ecosystem Alignment & Advanced Orchestration

**Shipped:** 2026-02-12
**Phases:** 62-70 (9 phases) | **Plans:** 37 | **Requirements:** 49

Spec alignment, progressive disclosure, cross-platform portability, evaluator-optimizer, MCP distribution, enhanced topologies, session continuity, and agentic RAG.

### Key Features

**Spec Alignment (Phase 62):**
- `$ARGUMENTS` parameterization with argument-hint descriptions
- `!command` preprocessing syntax for live data injection
- `context: fork` auto-detection for research/analysis workflows
- Dual-format `allowed-tools` parsing (array and space-delimited string)
- Shell injection prevention for `$ARGUMENTS` in `!command` context
- License and compatibility fields in YAML frontmatter

**Progressive Disclosure (Phase 63):**
- Auto-decomposition of skills exceeding 2000 words into SKILL.md + references/ + scripts/
- Deterministic operation extraction into executable scripts
- Circular reference detection with visited-set DFS cycle detection
- Disclosure-aware token budget calculation

**Cross-Platform Portability (Phase 64):**
- `skill-creator export --portable` strips extension fields for agentskills.io compliance
- `skill-creator export --platform <target>` generates platform-specific variants
- Supported targets: Claude Code, Cursor, Codex CLI, GitHub Copilot, Gemini CLI

**Evaluator-Optimizer (Phase 65):**
- `skill-creator test` with precision/recall/F1 metrics from activation simulation
- A/B evaluation with t-test statistical significance testing
- Post-activation success tracking (user corrections, overrides, feedback)
- `skill-creator quality` health dashboard with per-skill metrics

**MCP Distribution (Phase 66):**
- `skill-creator mcp-server` exposes skills via MCP stdio transport
- 4 tools: list_skills, search_skills, read_skill, install_skill
- `skill-creator publish` packages skills into .tar.gz with format version envelope
- `skill-creator install` unpacks from local files or remote URLs

**Enhanced Topologies (Phase 67):**
- Router topology: classifies work via routing rules, directs to specialists
- Map-Reduce topology: splits work, fans out to parallel workers, consolidates
- Inter-team communication with deadlock detection (circular wait prevention)
- `skill-creator team estimate <team>` for projected token usage and cost

**Session Continuity (Phase 68):**
- `skill-creator session save/restore/handoff` for cross-session context
- Warm-start context generation from snapshot + STATE.md
- Ephemeral observation promotion: seen 2+ times across sessions becomes persistent

**Agentic RAG (Phase 69):**
- Adaptive routing: simple queries to TF-IDF, complex queries to embeddings
- Corrective RAG with max 3 iterations and diminishing returns check
- `skill-creator search --all` discovers across user, project, and plugin directories

**Quality of Life (Phase 70):**
- Description quality validator enforcing "capability + Use when..." pattern
- Enhanced status with token budget breakdown and trend over time
- `skill-creator graph` outputs Mermaid diagrams of skill relationships
- GSD command reference injection in generated skills

---

## v1.8.1 — Audit Remediation (Patch)

**Shipped:** 2026-02-11

Comprehensive bugfix release addressing all findings from a full adversarial code audit. 11 issues spanning test infrastructure, type safety, CLI validation, error handling, security, and code quality.

### Critical Fixes

- **Test Mock Constructors:** Fixed 20+ failing tests by replacing factory function mocks with proper constructor implementations
- **Team Validator Mock:** Fixed ConflictDetector mock implementation (47/47 tests passing)
- **IntentClassifier Timeout:** Added embeddings mock to prevent 5-second model loading during tests

### High Priority Fixes

- Replaced all `any` types with proper interfaces across 20+ files
- Added CLI argument bounds checking, path validation, and clear error messages
- Wrapped dynamic imports and async handlers with proper error handling
- Created DependencyChecker module for startup validation with clear diagnostics

### Medium Priority Fixes

- Path traversal vulnerability remediation with boundary validation
- Extracted 37 hard-coded path references to configurable constants
- Refactored 1500+ line monolithic `main()` into 14+ separate command files
- Implemented embedding cache with content-based invalidation and TTL cleanup

### Verification

- 5,346 tests passing, 0 failures
- Strict TypeScript mode with 0 errors
- npm audit: 0 vulnerabilities

---

## v1.8 — Capability-Aware Planning + Token Efficiency

**Shipped:** 2026-02-08
**Phases:** 51-61 (10 phases) | **Plans:** 28 | **Requirements:** 28

Skill pipeline architecture with per-agent token budgets, capability manifests, cache ordering, research compression, and parallelization advisor.

### Key Features

**6-Stage Skill Loading Pipeline:**
Score -> Resolve -> ModelFilter -> CacheOrder -> Budget -> Load

- Composable pipeline with pluggable stages replacing monolithic skill loading
- Per-agent token budget profiles with critical/standard/optional priority tiers
- Capability manifests and phase declarations for smart skill filtering
- Cache-aware skill ordering with cacheTier metadata for prompt cache efficiency

**Planning Enhancements:**
- Skill injection into GSD executor agent contexts
- Research compression with 10-20x document reduction and staleness detection
- Model-aware activation filtering based on agent capabilities
- Collector agents for gathering distributed skill data

**Execution Optimization:**
- Parallelization advisor for wave-based execution from plan dependency analysis
- Phase capability declarations for targeted skill loading

---

## v1.7 — GSD Master Orchestration Agent

**Shipped:** 2026-02-08
**Phases:** 35-50 (16 phases) | **Plans:** 38 | **Requirements:** 42

Dynamic discovery, intent classification, lifecycle coordination, workflows, roles, bundles, and inter-skill events.

### Key Features

**Orchestrator Core:**
- Dynamic GSD command discovery from filesystem (no hardcoded command list)
- 5-stage intent classification pipeline: exact match -> lifecycle filter -> Bayesian -> semantic -> confidence
- Lifecycle-aware routing that narrows candidates based on current project phase
- Persistent work state with session continuity and handoff

**Skill Extensions:**
- **Workflows:** Multi-step skill chains with dependency tracking and crash recovery
- **Roles:** Behavioral constraints and tool scoping for agent personas
- **Bundles:** Project-phase skill sets with progress tracking and auto-suggestion
- **Events:** Emit/listen system enabling causal skill activation chains

**User Experience:**
- Verbosity levels and human-in-the-loop confirmation gates
- Classification confidence scores with fallback to user clarification
- GSD command injection into skill contexts

---

## v1.6 — Cross-Domain Examples

**Shipped:** 2026-02-07
**Phases:** 30-34 (5 phases)

34 cross-domain examples demonstrating real-world skill, agent, and team patterns.

### Contents

- 20 skills covering TypeScript, API design, testing, git workflows, code review, and more
- 8 agents composing related skills into purpose-built development assistants
- 3 teams demonstrating leader-worker, pipeline, and swarm topologies
- Local installation via `install.cjs` script
- `beautiful-commits` skill for Conventional Commits formatting

---

## v1.5 — Pattern Discovery

**Shipped:** 2026-02-07
**Phases:** 24-29 (6 phases) | **Plans:** 20 | **Requirements:** 27

Automated scanning of session logs to discover recurring workflows and generate draft skills.

### Key Features

- Session log scanning with incremental watermarks (only processes new entries)
- Tool sequence n-gram extraction (bigrams through 5-grams)
- DBSCAN clustering for grouping similar patterns without predefined cluster count
- File co-occurrence analysis for detecting related file access patterns
- Draft skill generation from discovered patterns with confidence scoring
- CLI commands: `skill-creator scan`, `skill-creator patterns`

---

## v1.4 — Agent Teams

**Shipped:** 2026-02-05
**Phases:** 18-23 (6 phases) | **Plans:** 18 | **Requirements:** 22

Multi-agent team coordination enabling complex workflows across specialized agents.

### Key Features

- Team schema with YAML frontmatter defining topology and member roles
- Three topologies: leader-worker, pipeline, swarm
- Team storage in `.claude/teams/` with validation and CLI management
- Member capability declarations and role assignments
- GSD workflow templates for team-based execution
- `skill-creator team create/list/validate/run` CLI commands

---

## v1.3 — Documentation Overhaul

**Shipped:** 2026-02-05
**Phases:** 15-17 (3 phases) | **Plans:** 8 | **Requirements:** 12

Comprehensive documentation establishing the project's knowledge base.

### Key Deliverables

- Official Claude Code skill format specification
- Getting started guide with installation, quickstart, and tutorials
- Core concepts documentation (skills, scopes, observations, agents)
- CLI reference, API reference, and skill format guides
- Token budget and bounded learning documentation

---

## v1.2 — Test Infrastructure

**Shipped:** 2026-02-05
**Phases:** 10-14 (5 phases) | **Plans:** 14 | **Requirements:** 18

Automated testing framework for validating skill quality and activation accuracy.

### Key Features

- Activation simulation with synthetic sessions for testing skill triggers
- Threshold calibration with F1/MCC optimization for tuning activation sensitivity
- Automated test case generation from observation patterns
- Benchmarking infrastructure for measuring skill loading and activation performance

---

## v1.1 — Semantic Conflict Detection

**Shipped:** 2026-02-04
**Phases:** 6-9 (4 phases) | **Plans:** 12 | **Requirements:** 10

Quality assurance layer preventing contradictory skills from coexisting.

### Key Features

- Semantic conflict detection between skills using embedding similarity
- Activation likelihood scoring with configurable thresholds
- Local embeddings via HuggingFace transformers (all-MiniLM-L6-v2)
- Conflict resolution recommendations (merge, deprecate, scope restriction)

---

## v1.0 — Core Skill Management

**Shipped:** 2026-01-31
**Phases:** 1-5 (5 phases) | **Plans:** 15 | **Requirements:** 43

The foundational 6-step adaptive learning loop.

### The Loop

1. **Observe** — Capture usage patterns at session start/end via hooks
2. **Detect** — Analyze patterns to identify skill candidates when threshold (3+) reached
3. **Suggest** — Propose skill creation with evidence explaining why
4. **Apply** — Load relevant skills based on context within token budget (2-5%)
5. **Learn** — Refine skills from corrections with bounded parameters (minimum 3 corrections, 7-day cooldown, maximum 20% change per refinement)
6. **Compose** — Group frequently co-activated skills (5+ over 7+ days) into composite agents

### Foundation

- Pattern storage in `.planning/patterns/` as append-only JSONL
- Skill storage in `.claude/skills/` as Markdown with YAML frontmatter
- Skill index for fast discovery, creation workflow, search/list CLI
- Token usage tracking, savings estimation, cost-benefit flagging
- Skill inheritance via `extends:` frontmatter with circular dependency prevention
- Agent generation for stable skill clusters in `.claude/agents/`

---

## Timeline

```
2026-01-31  v1.0    Core Skill Management
2026-02-04  v1.1    Semantic Conflict Detection
2026-02-05  v1.2    Test Infrastructure
2026-02-05  v1.3    Documentation Overhaul
2026-02-05  v1.4    Agent Teams
2026-02-07  v1.5    Pattern Discovery
2026-02-07  v1.6    Cross-Domain Examples
2026-02-08  v1.7    GSD Master Orchestration Agent
2026-02-08  v1.8    Capability-Aware Planning + Token Efficiency
2026-02-11  v1.8.1  Audit Remediation (Patch)
2026-02-12  v1.9    Ecosystem Alignment & Advanced Orchestration
2026-02-12  v1.10   Security Hardening
2026-02-12  v1.11   GSD Integration Layer
2026-02-12  v1.12   GSD Planning Docs Dashboard
2026-02-12  v1.12.1 Live Metrics Dashboard
2026-02-12  v1.13   Session Lifecycle & Workflow Coprocessor
2026-02-13  v1.14   Promotion Pipeline
2026-02-13  v1.15   Live Dashboard Terminal
2026-02-13  v1.16   Dashboard Console & Milestone Ingestion
2026-02-13  v1.17   Staging Layer
2026-02-14  v1.18   Information Design System
2026-02-14  v1.19   Budget Display Overhaul
```
