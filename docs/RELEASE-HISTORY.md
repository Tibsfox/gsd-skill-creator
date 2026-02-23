# Release History

Comprehensive release notes for GSD Skill Creator across all 36 milestones.

**Totals:** 37 milestones (v1.0-v1.33 + v1.8.1 patch) | 325 phases | 852 plans | ~416k LOC | 1,240 requirements

---

## v1.33 — GSD OpenStack Cloud Platform (NASA SE Edition)

**Shipped:** 2026-02-23
**Phases:** 312-325 (14 phases) | **Plans:** 33 | **Commits:** 124 | **Requirements:** 55 | **Tests:** 216 | **LOC:** ~5.9K TypeScript + 113 documentation files

NASA SE-structured OpenStack cloud platform with 19 skills, 3 crew configurations (31 agents), ASIC chipset, comprehensive educational documentation pack, and V&V infrastructure with NASA compliance.

### Key Features

**Foundation Types & NASA SE Methodology (Phase 312):**
- Shared TypeScript interfaces with Zod schemas for OpenStackService, Requirement, Runbook, NASASEPhase, CommunicationLoop
- NASA SE Methodology skill mapping all 7 SE phases (Pre-Phase A through Phase F) to cloud operations equivalents
- 9 communication loop schemas (command, execution, specialist, user, observation, health, budget, cloud-ops, doc-sync) with priority levels
- Filesystem contracts for skills/, docs/, configs/, .chipset/, and .planning/bus/

**Core OpenStack Skills (Phase 313):**
- 8 core service skills (keystone, nova, neutron, cinder, glance, swift, heat, horizon) with deploy/configure/operate/troubleshoot sections
- Kolla-Ansible deployment skill (bootstrap, deploy, reconfigure, upgrade)
- All skills within 8K individual / 30K combined token budget

**Operations Skills (Phase 314):**
- 6 operations skills: monitoring, backup, security, networking-debug, capacity, kolla-ansible-ops
- Integration points documented between related core and ops skills

**Documentation & Methodology Skills (Phase 315):**
- 3 documentation skills: ops-manual-writer, runbook-generator, doc-verifier
- NASA SE methodology with process mapping, phase gate criteria, and document templates

**Deployment & Operations Crews (Phase 316):**
- Deployment crew: 12 roles at Squadron profile with domain-specific skill loadouts
- Operations crew: 8 roles with SURGEON health monitoring
- Scout/Patrol/Squadron activation profiles with role subset hierarchy
- CRAFT agents triggered by domain keywords, CAPCOM as sole human interface
- Crew handoff from deployment to operations

**Documentation Crew & Communication Framework (Phase 317):**
- Documentation crew: 8 roles with CRAFT-techwriter and parallel operation capability
- 9 communication loops: command, execution, specialist, user, observation, health, budget, cloud-ops, doc-sync
- HALT signal propagation to all agents within 1 cycle
- Budget agent with token consumption tracking (warn 90%, block 95%)

**Chipset Definition (Phase 318):**
- Complete ASIC chipset.yaml: 19 skills, 31 agents, 9 communication loops
- Pre-deploy evaluation gates (hardware inventory, network connectivity, resource sufficiency)
- Post-deploy evaluation gates (keystone auth, nova compute, neutron network, doc verification)
- 118/118 validation checks passing

**Systems Administrator's Guide (Phase 319):**
- 7 chapters mapping to NASA SE phases (Pre-Phase A through Phase F)
- Cross-references to SP-6105 and NPR 7123.1 sections
- Phase F decommissioning in exact reverse of Phase D deployment order

**Operations Manual (Phase 320):**
- Per-service procedures for all 8 OpenStack services in NASA procedure format
- 80 total procedures with preconditions, safety considerations, verification, rollback

**Runbook Library & Reference Library (Phase 321):**
- 44 runbooks with dual indexes (task intent + failure symptom)
- Standard format: preconditions, procedure, verification, rollback, references
- 3-tier reference library: summary (~6K always-loaded), active (~20K on-demand), reference (~40K deep dives)
- Cross-cloud translation tables (OpenStack → AWS/GCP/Azure)
- Quick reference card (service names, ports, log locations, CLI commands)

**V&V Plan & Compliance (Phase 322):**
- Requirements verification matrix mapping all 55 requirements to TAID methods
- NPR 7123.1 Appendix H compliance matrix with tailoring rationale
- VERIFY agent independence from EXEC (disjoint skill loadouts)
- 8 drift detection scenarios, 22 safety-critical test procedures

**Dashboard & Integration (Phase 323):**
- Cloud ops dashboard panel with service health rendering and alert summaries
- Documentation console with navigation, content rendering, and barrel exports
- Config staging for OpenStack configurations and community chipset variants
- Deployment observation pipeline with sliding window pattern detection and promotion candidates
- Git commit rationale formatter, 3-tier knowledge loader with performance targets
- 216 tests across all cloud-ops modules

**Integration Verification (Phase 324):**
- E2E deployment verification: 7-stage procedure with pre/post-deploy gates
- E2E user scenario verification: 8-stage authentication through floating IP access
- Executable scripts with --dry-run, --start-stage, graceful skip when OpenStack not deployed

**Lessons Learned (Phase 325):**
- 15 LLIS entries (LL-CLOUD-001 through LL-CLOUD-015) across 4 categories
- 6 "What Worked Well" + 5 "What Could Be Improved" with actionable recommendations
- Mission phase assessment: 14 phases rated (5 Exceeded, 6 Met, 1 Partially Met, 3 Not Yet Executed)

---

## v1.32 — Brainstorm Session Support

**Shipped:** 2026-02-22
**Phases:** 305-311 (7 phases) | **Plans:** 25 | **Commits:** 63 | **Requirements:** 46 | **Tests:** 321 | **LOC:** ~16K

AI-facilitated brainstorming support system with 8 specialized agents in leader-worker topology, 16 brainstorming techniques across 4 categories, 5 educational pathways, Osborn's rules enforcement, and structured session artifacts.

### Key Features

**Foundation Types & Bus (Phase 305):**
- 23 Zod schemas: 11 enums (AgentRole, SessionPhase, TechniqueId, PathwayId, HatColor, ScamperLens, OsbornRule, EnergyLevel, SessionStatus, MessageType) + 12 object schemas
- Session-scoped filesystem bus with monotonic counter filenames preventing concurrent write collision
- Constants: 16 technique defaults, 8 agent phase rules, 10 message priorities
- `.brainstorm/` directory at project root with `.gitignore` entry

**Rules Engine (Phase 306):**
- Osborn's 4 rules enforced architecturally per phase (all active during Diverge, relaxed during Converge)
- Architectural Critic gate: blocked at instantiation during non-Converge phases (defense-in-depth at 3 levels)
- Two-stage evaluative content detection: hard-block patterns + constructive-context allowlist (<5% false positive rate)
- Black Hat phase constraint prevents evaluative content from non-Critic agents during Diverge
- Per-session violation logging with `RuleViolation` records persisting across phase transitions

**Session Manager & Phase Controller (Phase 307):**
- 5-status state machine: created → active → paused → completed/abandoned with JSONL persistence
- Strict Explore → Diverge → Organize → Converge → Act phase ordering
- Per-phase agent activation matrix (Critic only during Converge, Scribe always active)
- Timer system with technique-specific defaults, pause/resume, mandatory reset on technique transition

**Technique Engine (Phase 308):**
- Pluggable engine with lazy factory registry for 16 techniques
- Individual: freewriting (≥3 ideas/min), mind mapping (parent-child tree), rapid ideation (≥10 in 60s), question brainstorming (≥15 questions)
- Collaborative: brainwriting 6-3-5 (6 rounds with parent_id chains), round robin, brain-netting, rolestorming, figure storming (constructive personas only)
- Analytical: SCAMPER (7 lenses), Six Thinking Hats (6 colors with synchronized mode), starbursting (6 W-categories), Five Whys (depth 5 with causal chains)
- Visual: storyboarding (sequential cards), affinity mapping (TfIdf clustering, 2-8 clusters), lotus blossom (8×8=64 ideas)

**Pathway Router (Phase 308):**
- 5 pathway definitions: Creative Exploration, Problem-Solving, Product Innovation, Decision-Making, Free-Form
- Signal-word situation matching from problem statement
- Mid-session adaptive resequencing on low energy, saturation, user request, or unexpected depth

**Artifact Generator (Phase 308):**
- Session transcript in Markdown with phase headers, technique labels, timestamps
- Action plan with ownership, deadlines, priorities for top ideas
- JSON export with complete session state
- Cluster map generated during Organize phase

**Facilitator Agent (Phase 309):**
- Problem assessment with 5-nature classification and pathway recommendation
- Transition confidence scoring: timer×0.2 + saturation×0.3 + user_signal×0.4 + min_threshold×0.1
- Energy management with PRESSURE_PHRASES runtime guard (6 banned phrases)
- Non-judgmental Humane Flow facilitation voice

**Technique Agents (Phase 310):**
- Ideator: 5 techniques, evaluateIdea() throws unconditionally
- Questioner: 3 techniques, W-word redirect, generateAnswer() throws
- Analyst: SCAMPER 7-lens cycling, Six Hats coordination with hat-color broadcast
- Mapper: 4 organizational techniques, 100% affinity placement guarantee
- Persona: 9 constructive historical figures, 6 blocked hostile terms
- Critic: Converge-only gate, composite evaluation formula (F+I+A)-R, 3 prioritization methods
- Scribe: Zod-validated capture at agent boundary, artifact generation delegation

**Integration & System Tests (Phase 311):**
- SessionBus: 4-loop filesystem message router (session, capture, user, energy)
- MESSAGE_ROUTE as Record<MessageType, BusLoop> for compile-time exhaustive routing
- Bus load test: 4 concurrent writers, 12 messages in <200ms, zero loss
- 18 safety-critical tests (SC-01 through SC-18)
- 3 end-to-end pathway tests (Creative Exploration, Problem-Solving, Free-Form)
- Chipset YAML with 4 activation profiles and skill-creator observation hooks
- Barrel export organizing all public types by layer

---

## v1.31 — GSD-OS MCP Integration

**Shipped:** 2026-02-22
**Phases:** 293-304 (12 phases) | **Plans:** 28 | **Commits:** 37 | **Requirements:** 80 | **Tests:** 838 (771 TS + 67 Rust) | **LOC:** ~24K

Make GSD-OS a first-class MCP citizen — both as an MCP Host (Rust backend managing server processes) and as an MCP Server (exposing 19 tools to external AI agents). Includes template skills, agent bridge adapters, staging security gates, blueprint editor integration, and comprehensive integration testing.

### Key Features

**Foundation Types (Phase 293):**
- Shared TypeScript + Rust type definitions for all MCP structures
- Zod v4 schemas for runtime validation, serde round-trip parity for Rust FFI
- Staging gate interfaces: TrustState enum, SecurityGate trait, HashRecord, ValidationResult

**Rust MCP Host Manager (Phase 294):**
- ServerConnection: stdio process spawn, MCP handshake, crash detection, exponential backoff restart
- HostManager: multi-server orchestration, concurrent connection management
- ToolRouter: tool-name-to-server dispatch with timeout handling
- ServerRegistry: JSON persistence, health tracking, quarantine state
- TraceEmitter: ring buffer, Tauri event emission for every MCP message
- 5 Tauri IPC commands: connect, disconnect, list, call_tool, get_trace

**Gateway Server (Phases 295-298):**
- Streamable HTTP transport with per-session isolation
- Bearer token auth from ~/.gsd/gateway-token with timing-safe comparison
- 19 tools across 6 groups: project (list/get/create/execute-phase), skill (search/inspect/activate), agent (spawn/status/logs), workflow (research/requirements/plan/execute), session (query/patterns), chipset (get/modify/synthesize)
- 4 resource providers via URI templates (project configs, skill registry, agent telemetry, chipset state)
- 3 prompt templates (create-project, diagnose-agent, optimize-chipset)
- Per-tool scope enforcement: admin > write > read, deny by default for unknown tools

**MCP Templates (Phase 299):**
- Server template: package.json, tsconfig.json, SDK setup, example tool/resource/prompt, tests, CLAUDE.md, chipset.yaml
- Host template: client pool, lifecycle management, transport abstraction, approval gates
- Client template: tool discovery, resource subscription, typed responses
- Custom project name propagation, sub-120s generation time

**Agent Bridge (Phase 300):**
- Generic AgentServerAdapter factory creating MCP servers from config
- SCOUT exposed with scout.research, scout.evaluate-dependency, scout.survey-landscape tools + 2 resources
- VERIFY exposed with verify.run-tests, verify.check-types, verify.audit, verify.coverage tools + 2 resources
- AgentClientAdapter giving EXEC MCP client capability
- Counting semaphore for concurrency limiting, per-invocation context isolation

**Security Pipeline (Phase 301):**
- Hash gate: SHA-256 tool definition hashing with deterministic sorting, drift detection
- Trust manager: quarantine → provisional → trusted lifecycle, 30-day decay, immediate reset on change
- Invocation validator: prompt injection blocking, path traversal prevention
- Rate limiter: per-server and per-tool limits
- Audit logger: full invocation logging with API key/token redaction
- StagingPipeline as single unbypassable SecurityGate implementation
- Per-server promise queues for thread-safe concurrent validation

**Presentation (Phase 302):**
- Blueprint Editor: MCP Server, Tool, Resource block types with port rendering and status indicators
- Wiring engine with type-safe connections and deny-by-default rules
- MCP Trace Panel: real-time JSON-RPC flow with SVG sparklines and server/tool filtering
- Security Dashboard: trust state per server, hash change alerts, blocked call log
- Boot peripherals: Amiga POST aesthetic, green monospace, trust abbreviations [Q/P/T/S]
- Tauri IPC bridge with dynamic import for non-Tauri environment safety

**Integration Testing (Phase 303):**
- 30 end-to-end tests across all MCP subsystems
- 18 safety-critical security tests (mandatory-pass)
- Performance verification: MCP overhead < 50ms
- Coverage validation: 85%+ across all MCP components

**Integration Wiring (Phase 304 — Gap Closure):**
- Production gateway factory registering all 19 tools across 6 groups
- Per-tool scope enforcement via canInvokeTool at HTTP level with body buffering
- Rust StagingGate: zero-size struct, string-contains injection detection, validates before mcp_call_tool
- Agent bridge staging: optional StagingPipeline with source='agent-to-agent'
- E2E test discovering and invoking tools from all 6 groups

---

## v1.30 — Vision-to-Mission Pipeline

**Shipped:** 2026-02-22
**Phases:** 279-292 (14 phases) | **Plans:** 26 | **Commits:** 65 | **Requirements:** 58 | **Tests:** 679 | **LOC:** ~20K

Complete vision-to-mission transformation pipeline as TypeScript modules — turning vision documents into structured mission packages with wave planning, model assignment, and deployment-ready output.

### Key Features

**Types & Schemas (Phase 279):**
- Zod schemas for all 8 VTM document structures with inferred TypeScript types
- 60/40 principle budget constraints and programmatic schema iteration

**Vision Document Processing (Phase 280):**
- Regex-based section extraction, archetype classifier (Educational/Infrastructure/Organizational/Creative)
- Quality checker with section completeness validation, dependency extractor

**Research Reference Compilation (Phase 281):**
- Tiered knowledge chunking: summary (always loaded), active (when relevant), reference (on demand)
- Source quality checker, safety extractor with boundary classification

**Mission Package Assembly (Phase 282):**
- Self-contained component specs, milestone spec generator
- Wave planning integration, model assignment, test plan generation, file count scaling

**Wave Planning (Phase 283):**
- Parallel track detection via greedy graph coloring
- Dependency graph generator with critical path marking, sequential savings calculator
- Risk factor analyzer (cache TTL, interface mismatch, model capacity)

**Model Assignment (Phase 284):**
- Weighted signal registry for Opus/Sonnet/Haiku assignment
- Confidence scoring, budget validator enforcing 60/40 principle
- Downgrade-only auto-rebalance (Opus→Sonnet→Haiku, never upgrade)

**Cache Optimization (Phase 285):**
- Shared load detection, schema reuse analysis, knowledge tier calculation
- TTL validation, token savings estimation using gpt-tokenizer

**Test Plan Generation (Phase 286):**
- Categorized specs with S/C/I/E IDs, verification matrix builder
- Safety-critical classifier, test density checker

**Template System (Phase 287):**
- Mustache-style {{name}} renderer, Zod schema validation
- Memory-cached loader, 7-template registry

**Pipeline Orchestrator (Phases 288-292):**
- End-to-end vision → research → mission with configurable stage skipping
- Template rendering as additive layer, wave analysis enrichment
- Budget auto-rebalance, structured error reporting with recoverable/unrecoverable classification

---

## v1.29 — Electronics Educational Pack

**Shipped:** 2026-02-21
**Phases:** 262-278 (17 phases) | **Plans:** 39 | **Commits:** 92 | **Requirements:** 95 | **Tests:** 10,707 | **LOC:** ~29K

Comprehensive electronics curriculum from Ohm's law through DSP and PLC, with circuit and logic simulators, safety warden, and 77 interactive labs grounded in *The Art of Electronics*.

### Key Features

**MNA Circuit Simulator (Phases 262-265):**
- DC, AC, and transient analysis with Newton-Raphson nonlinear solver
- Gaussian elimination with partial pivoting
- 7 component models: R, C, L, diode, BJT, MOSFET, op-amp (+ regulator)
- Stamp logging for educational visibility into matrix construction
- Backward Euler companion models for C and L in transient analysis

**Digital Logic Simulator (Phases 266-267):**
- 8 gate types with CMOS internal structure
- Truth table generation, ASCII timing diagrams with propagation delay
- Flip-flops: SR, D, JK, T with clock edge detection
- 4-bit ripple-carry adder with 256 exhaustive combination verification

**Safety Warden (Phase 268):**
- 3 operating modes: annotate, gate, redirect
- IEC 60449 voltage classification for mode escalation
- Positive framing with 8 prohibited words enforced
- Professional context detection, per-module safety assessments

**Learn Mode (Phase 269):**
- 3-level depth: L1 practical, L2 reference, L3 mathematical
- H&H (Art of Electronics) citation lookup with 3-level system
- Sidebar UI component, depth markers in all 15 module content files

**15 Educational Modules (Phases 270-273):**
- Tier 1: Circuits, Passives, Signals
- Tier 2: Diodes, Transistors, Op-Amps, Power
- Tier 3: Logic Gates, Sequential Logic, Data Conversion, DSP
- Tier 4: MCU, Sensors, PLC, Off-Grid Power, PCB Design
- 77 interactive labs with structured LabStep format

**5 Specialized Engines (Phases 274-276):**
- DSP: FFT, FIR filter design, convolution, quantization
- GPIO: UART, SPI, I2C, PWM, ADC, timer simulation
- PLC: Ladder logic, PID control, Modbus, scan cycle
- Solar: Single-diode model, MPPT, battery simulation, inverter
- PCB: Impedance calculation, DRC, EMI analysis, trace routing, Gerber output

**Integration & Testing (Phases 277-278):**
- Cross-module MNA/logic sim validation
- Content quality checks (word counts, H&H citations, LabStep structure)
- Chipset routing verification, safety mode transition testing

---

## v1.28 — GSD Den Operations

**Shipped:** 2026-02-21
**Phases:** 255-261 (7 phases) | **Plans:** 22 | **Commits:** 51 | **Requirements:** 81 | **Tests:** 675 | **LOC:** ~18.9K

Complete multi-agent coordination system with filesystem message bus, 10 core staff positions, hierarchical topology profiles, and end-to-end integration exercise.

### Key Features

**Filesystem Message Bus (Phase 255):**
- 8 priority levels (0=HALT through 7=background)
- ISA compact encoding for efficient message representation
- Dispatcher routing with queue health metrics
- Dead-letter handling, message pruning

**Command Division (Phase 256):**
- Coordinator: go/no-go readiness checks, atomic phase transitions, 4-level escalation
- Relay: question consolidation, priority classification, user-facing reports

**Planning Division (Phase 257):**
- Planner: phase decomposition, resource estimation, trajectory tracking
- Configurator: 4 topology profiles (Scout 3/Patrol 5/Squadron 7/Fleet 10)
- Monitor: token budget tracking with 75%/95%/100% alert thresholds

**Execution Division (Phase 258):**
- Executor: fresh-context plan execution with artifact handoff
- Verifier: 4 independent quality gates (tests-pass, new-coverage, code-review, artifact-integrity)

**Safety & Operations Division (Phase 259):**
- Sentinel: 9-type recovery decision matrix, Priority 0 HALT/CLEAR protocol
- Chronicler: append-only JSONL audit trail, mission briefing generation

**Dashboard & Chipset (Phase 260):**
- Dashboard: 10-position status tracking, staff indicators, health metrics
- Chipset: deterministic YAML parsing with reproducibility proof

**Integration Exercise (Phase 261):**
- Full lifecycle flow with 10-position chipset
- 4 topology profile validation, 7 recovery scenarios
- Overhead verification (<1% of context), end-to-end reproducibility

---

## v1.27 — GSD Foundational Knowledge Packs

**Shipped:** 2026-02-20
**Phases:** 243-254 (12 phases) | **Plans:** 79 | **Commits:** ~8 hours execution | **Requirements:** 81 | **Tests:** 10,032 total (144 new) | **LOC:** ~23.6K

Build the foundational knowledge pack system with 35 complete educational packs across 3 tiers, GSD-OS dashboard for browsing and progress tracking, and complete skill-creator integration with learner observation infrastructure, AMIGA event bridge, multi-pattern learning detection, personalized pathway adaptation, automated activity generation, and approach promotion.

### Key Features

**Pack Runtime Infrastructure (Phase 243):**
- Zod schemas for pack types, registry, loaders, dependency resolver with circular detection
- Pack registry with lookup, filtering by tier/category, tag search
- Content loader reading 5 files per pack into typed objects
- Barrel exports for complete API surface

**Chipset & Agent Definitions (Phase 244):**
- KP- agent definitions with map-reduce topology for parallel pack generation
- 8.0% token budget (2.0% for content authoring)
- SKILL.md files following GSD spec format

**35 Complete Knowledge Packs (Phases 245-251):**
- Core Academic Tier (15): MATH-101 (adapted), SCI-101, TECH-101, ENGR-101, PHYS-101, CHEM-101, READ-101, CRIT-101, PROB-101, COMM-101, HIST-101, GEO-101, MFAB-101, BUS-101, STAT-101
- Applied & Practical Tier (10): CODE-101 (adapted), DATA-101, LANG-101, PSYCH-101, ENVR-101, NUTR-101, ECON-101, WRIT-101, LOG-101, DIGLIT-101
- Specialized & Deepening Tier (10): PHILO-101, THEO-101, PE-101, NATURE-101, DOMESTIC-101, ART-101, MUSIC-101, TRADE-101, ASTRO-101, LEARN-101 (meta-pack)
- Each pack: vision doc, modules YAML, activities JSON, assessment rubric, resources list, .skillmeta

**Pack Metadata & Validation (Phase 252):**
- Cross-pack dependency graph (YAML + Mermaid diagram)
- Standards alignment (Common Core, NCTM, NGSS), translation stubs, accessibility metadata
- Content validation test suite (35+ tests), master INDEX.md, ALL-PACKS-OVERVIEW.md

**GSD-OS Dashboard (Phase 253):**
- Pack browser panel with tier grouping and category filtering
- Full-text search with relevance ranking
- Pack detail view with modules, prerequisites, grade levels
- Skill tree visualization showing prerequisite chains
- Progress tracking per-pack completion state
- Activity suggestion engine with progress-aware ranking

**skill-creator Integration (Phase 254):**
- **Observation Types & Hooks (254-01):** Activity completion, assessment results, time spent, pack lifecycle events with ObservationEmitter (47 tests)
- **AMIGA Event Bridge (254-02):** KnowledgeEventBridge converting to AMIGA EventEnvelope with 6 event types, priority escalation for pack_complete (20 tests)
- **Learning Pattern Detector (254-03):** 4-pattern detection (sequence, timing, scoring, engagement) with confidence scoring, threshold filtering, skill suggestions (19 tests)
- **Pathway Adapter (254-04):** Personalized pathways based on learner history, struggle/excel detection, reinforcement/acceleration logic (24 tests)
- **Activity Scaffolder (254-05):** Pattern-to-activity generation, chain insertion, pattern-specific activity types (15 tests)
- **Approach Promoter (254-05):** Pattern-to-skill promotion with triggers, actions, SKILL.md markdown output (19 tests)

### Test Coverage

- 144 new tests across 23 test files
- All 10,032 knowledge module tests passing
- Complete pipeline integration verified end-to-end

### Statistics

| Metric | Value |
|--------|-------|
| Total knowledge packs | 35 |
| Total activities | 408 (12 per pack) |
| Total assessments | 35 (1 per pack) |
| Core Academic modules | 15 x 5 = 75 |
| Applied modules | 10 x 5 = 50 |
| Specialized modules | 10 x 5 = 50 |
| Resource entries | 3,000+ |
| Unique learning outcomes | 500+ |

---

## v1.26 — Aminet Archive Extension Pack

**Shipped:** 2026-02-19
**Phases:** 236-242 (7 phases) | **Plans:** 40 | **Commits:** 91 | **Requirements:** 81 | **Tests:** 10,032 | **LOC:** ~23,616

Build a complete Aminet archive management system — INDEX parsing for ~84,000 packages, selective mirroring with integrity verification, full-text search and curated collections, pure TypeScript virus scanning, LhA/LZX extraction with Amiga filesystem mapping, FS-UAE emulator integration, and GSD-OS desktop panel with 5-agent pipeline orchestration.

### Key Features

**INDEX Infrastructure & Binary Parsers (Phase 236):**
- Aminet INDEX.gz download, decompression, and fixed-width column parsing for ~84,000 entries
- .readme metadata extractor (Short, Author, Uploader, Type, Version, Requires, Architecture)
- JSON cache with 24-hour staleness detection and RECENT-based incremental updates
- AmigaBinaryReader for big-endian hunk executables (HUNK_HEADER through HUNK_END)
- Boot block parser with trackdisk.device detection patterns

**Mirror State & Download Engine (Phase 237):**
- 7-state per-package lifecycle (not-mirrored → downloading → mirrored → scan-pending → clean/infected → installed)
- Atomic JSON persistence with write-then-rename pattern
- Rate-limited HTTP fetching with configurable concurrency and User-Agent identification
- SHA-256 integrity verification for all downloaded files
- Configurable mirror list with fallback ordering

**Search, Browse & Collections (Phase 238):**
- 3-tier relevance-ranked full-text search (name=3x, description=2x, author=1x)
- Hierarchical category tree with subcategory navigation and package counts
- Architecture and OS version filtering
- Unified PackageDetail view merging INDEX + .readme + mirror state
- YAML collection format with 5 starter sets (31 packages total)
- CRUD collection manager with atomic persistence and bulk operations

**Virus Scanner & Quarantine (Phase 239):**
- 52 byte-pattern signatures across 3 families (14 boot block, 6 file, 32 link virus)
- Context-aware scanning: bootblock sigs scan first 1024 bytes, file/link sigs scan hunk files
- 4-rule heuristic hunk analysis (small first hunk, anomalous ordering, excessive relocations, suspicious entry point)
- 4-rule boot block analysis (virus pattern, suspicious bootcode, resident install, trackdisk without vector)
- Quarantine with atomic file moves and JSON metadata sidecars
- 3-layer scan orchestrator with configurable depth policies (fast/standard/thorough)
- Emulated scanning via FS-UAE and community checksum cross-reference

**Installation & Archive Extraction (Phase 240):**
- LhA extraction via lhasa with path traversal prevention (Zip-Slip)
- LZX extraction via unlzx with cwd workaround (no output directory flag)
- 11-assign Amiga filesystem mapper (case-insensitive C:/LIBS:/DEVS:/S:/L:/FONTS:/T:/LOCALE:/CLASSES:/REXX:/PREFS:)
- Dependency detector classifying 5 types from .readme Requires (package, os_version, hardware, library, unknown)
- Install tracker with per-package JSON manifests and clean uninstall
- Scan gate enforcing security policy (refuse unscanned, refuse infected, user override for suspicious)
- Tool validator with platform-specific install guidance

**Emulator Configuration & Launch (Phase 241):**
- FS-UAE config generator with sorted key-value output and path normalization
- 5 hardware profiles: A500 (OCS/68000/KS1.3), A1200 (AGA/68EC020/KS3.1), A1200+030 (68030/8MB fast), A4000 (68040/8MB fast), WHDLoad (A1200+8MB fast)
- Self-contained CRC32 ROM scanner (IEEE polynomial, no npm dependency)
- Cloanto encrypted ROM support (cyclic XOR decryption)
- Priority-based profile auto-selection from .readme metadata
- WHDLoad slave detection with per-game hardware overrides
- 9-slot state snapshot system with directory hard drive safety detection

**Desktop Panel, Agent Pipeline & Integration (Phase 242):**
- Chipset YAML defining 5 agents (AM-1 through AM-5), 6 skills, pipeline team, 7% token budget
- 6 SKILL.md files following GSD pack format specification
- 5-stage pipeline orchestrator with scan gate enforcement
- 4-pane Workbench-style browser panel (search bar, category tree, results, detail)
- 4-color status indicators (green/yellow/red/gray)
- Mirror statistics dashboard widget
- 14-test cross-module integration suite
- Standalone pack compliance verified (no GSD core modifications)

---

## v1.25 — Ecosystem Integration

**Shipped:** 2026-02-19
**Phases:** 231-235 (5 phases) | **Plans:** 14 | **Requirements:** 38 | **Spec documents:** 17 (~10,558 lines)

Make implicit cross-dependencies between 18 ecosystem vision documents explicit through 5 analytical deliverables — a dependency DAG, a shared EventDispatcher specification, a dependency philosophy by layer, an integration test strategy, and a partial-build compatibility matrix.

### Key Features

**Ecosystem Dependency Map (Phases 231-232):**
- 20-node dependency DAG with 48 typed edges (requires/enhances/extends/conflicts)
- Machine-readable YAML with Mermaid diagram rendering
- Critical path analysis identifying 4-hop longest chain
- 5-milestone build sequencing recommendation (chipset + dashboard-console + lcp as maximum downstream unblocking)
- Node inventory with implementation status and edge classification

**EventDispatcher Specification (Phase 232):**
- Canonical single-inotify watcher design with fan-out to 6 subscriber profiles
- 1,020 watch budget (25% of 4,096 system target) with per-subscriber allocation
- AMIGA EventEnvelope adopted as ecosystem-wide standard
- Migration plan for 2 existing filesystem watchers (dashboard refresh, staging)
- 9-factor inotify-over-fanotify rationale (fanotify requires CAP_SYS_ADMIN)

**Dependency Philosophy (Phase 233):**
- 4-tier layering: Core (zero deps), Middleware (lean npm), Platform (native), Educational (inherits)
- Per-layer provides/requires contracts with numbered decision tree
- Ready-to-paste ESLint 9+ flat config for import boundary enforcement
- Rust module visibility strategy with `pub(crate)` conventions
- 4-step exception process for justified boundary crossings

**Integration Test Strategy (Phase 234):**
- Zod `.toJSONSchema()` + Vitest contract testing (Pact rejected: HTTP-focused, wrong boundary type)
- 6 priority integration flows with specific input/output contracts
- 8 semantic test cases per boundary with pass/fail criteria
- 3-tier freshness policies (contract: CI, semantic: weekly, fixture: monthly)
- Fixture directory structure and EventDispatcher compliance audit

**Partial-Build Compatibility Matrix (Phase 235):**
- 48-edge compatibility matrix with 3-state degradation tables (full/degraded/unavailable)
- 99 known-issues cross-referenced: 51 aspirational, 26 environment-dependent, 9 permanent, 13 resolved
- Per-component standalone mode specifications with graceful degradation behavior
- 3-tier capability probe protocol: filesystem presence (Tier 1), import check (Tier 2), structured probe (Tier 3)

### Spec Documents Produced

| Area | Documents | Lines |
|------|-----------|-------|
| Dependency Map | node-inventory, edge-inventory | ~2,400 |
| EventDispatcher | eventdispatcher-spec | ~1,200 |
| Dependency Philosophy | dependency-rules, enforcement-spec | ~1,100 |
| Integration Tests | contract-testing-approach, semantic-tests-and-freshness, fixture-strategy-and-audit | ~2,400 |
| Compatibility Matrix | compatibility-matrix, degradation-specs, standalone-modes, capability-probe-protocol, known-issues-cross-reference | ~3,500 |

---

## v1.24 — GSD Conformance Audit & Hardening

**Shipped:** 2026-02-19
**Phases:** 223-230 (8 phases) | **Plans:** 31 | **Requirements:** 63

Systematically verify the entire GSD ecosystem codebase against 18 vision documents (~760K of specifications), fix every divergence, and prove the system works end-to-end — achieving zero-fail conformance across all 336 checkpoints.

### Key Features

**Conformance Matrix (Phase 223):**
- 336-checkpoint matrix covering every "In Scope v1" claim across 18 vision documents
- 4-tier triage: T0 Foundation (41), T1 Integration (51), T2 Behavior (180), T3 UX/Polish (64)
- Dependency graph with 15 high-fan-out nodes and 5 critical paths
- Per-tier effort estimates in companion audit plan document

**Foundation Audit — T0 (Phase 224):**
- Full GSD lifecycle verified: new-project through complete-milestone
- 6-stage skill loading pipeline confirmed end-to-end (Score → Resolve → ModelFilter → CacheOrder → Budget → Load)
- Build health: zero TypeScript errors, all tests passing
- Subagent spawning, filesystem message bus, state tracking all verified

**Integration Audit — T1 (Phase 225):**
- GSD-to-skill-creator observation pipeline verified (302 tests)
- AMIGA 4-ICD inter-component communication verified (10 event types, 1123 tests)
- Dashboard data collectors reading real filesystem data confirmed
- Console upload → message bus → staging manifest → execution queue traced end-to-end
- AGC pack integration verified (5 blocks, 6 widgets, chipset YAML)

**Behavior Audit — T2 (Phase 226):**
- Token budget enforcement, pattern detection thresholds, bounded learning constraints all verified
- AGC simulator: all 38 Block II opcodes behaviorally verified, ALU overflow at 0o37777
- Staging: all 11 hygiene patterns, trust decay model, smart intake 3-path routing, 7-state queue machine confirmed
- Security hardening: path traversal prevention, YAML safe deserialization, JSONL integrity checksums
- 180 checkpoints audited: 104 pass, 76 fail (aspirational vision items)

**UX/Polish Audit — T3 (Phase 227):**
- GSD-OS Tauri build verified, CRT shader effects confirmed in GLSL source
- Window manager depth cycling, drag/resize, keyboard shortcuts verified
- Dashboard design system: 6 domain colors, 4 signal colors, entity shape dual encoding
- Educational content: AGC curriculum and RFC reading paths verified
- 64 checkpoints audited: 45 pass, 18 fail, 1 partial

**End-to-End Verification (Phase 228):**
- E2E proof run: 9,355 tests passing, TypeScript clean (tsc --noEmit zero errors)
- All 4 conformance gates passing: T0 100%, T1 100%, T2 95.0%, T3 93.8%
- 112 checkpoint amendments with documented justifications
- Zero undocumented divergences between code and vision documents

**Documentation & Amendments (Phase 229):**
- All 13 remaining failures resolved via vision document amendment
- Fix-or-amend protocol applied: checkpoint ID, original claim, actual state, resolution, updated spec
- Known-issues list categorizing 99 amended checkpoints into 8 deferral groups
- Installation documentation verified accurate and complete

**Verification Environment — Stretch (Phase 230):**
- Environment readiness assessed for 4-VM clean-room verification
- Hardware inventory: Intel i7-6700K VT-x, 60GB RAM, KVM, 27.5TB storage
- IaC gap analysis: ~60% covered, ~4-6h work for multi-VM orchestration
- Deferred to future milestone (core requirements complete)

### Conformance Results

| Tier | Checkpoints | Pass | Amended | Gate |
|------|-------------|------|---------|------|
| T0 Foundation | 41 | 41 | 0 | 100% |
| T1 Integration | 51 | 34 | 17 | 100% |
| T2 Behavior | 180 | 104 | 76 | 95.0% |
| T3 UX/Polish | 64 | 45 | 19 | 93.8% |
| **Total** | **336** | **211** | **125** | **100%** |

### Amendment Categories (99 deferred items)

1. GSD ISA — entirely unimplemented; AGC is the educational ISA (32 checkpoints)
2. Wetty web terminal — superseded by native PTY architecture (9 checkpoints)
3. Hardware workbench — requires physical audio/MIDI/camera/GPIO (13 checkpoints)
4. Silicon layer — hooks exist, training pipeline is future (12 checkpoints)
5. BBS/Creative Suite — vision docs scope as future (11 checkpoints)
6. Cloud ops curriculum — structure exists, content delivery is future (4 checkpoints)
7. Chipset runtime — declarative config, not runtime pipeline (5 checkpoints)
8. Block editor UI — vision exceeds current implementation (4 checkpoints)

### Test Coverage

- 9,355 tests across 31 plans (482 test files)

---

## v1.23 — Project AMIGA

**Shipped:** 2026-02-19
**Phases:** 199-222 (24 phases) | **Plans:** 74 | **Requirements:** 99

Build the complete AMIGA mission infrastructure (Mission Control, Mission Environment, Commons Engine, Governance Layer) with human-in-the-loop gates, the Apollo AGC Educational Pack (documentation archive, architectural study, functioning AGC simulator with DSKY and curriculum), and the RFC Reference Skill — creating the operational backbone and first educational content packs for the GSD-OS platform.

### Key Features

**AMIGA Mission Infrastructure (Phases 199-208):**
- MC-1 Control Surface: dashboard with 8-command parser, 3-tier alert system (info/warning/critical), Go/No-Go gates for phase transitions
- ME-1 Mission Environment: environment provisioner, phase engine, swarm coordinator for parallel agent execution, archive writer for immutable mission records
- CE-1 Commons Engine: attribution ledger tracking contributions, weighting engine with configurable factors, dividend calculator for resource distribution
- GL-1 Governance Layer: commons charter definition, rules engine for policy enforcement, policy query interface
- 4 typed Inter-Component Definitions (ICDs) for structured inter-team communication
- Full-stack controller composing all 4 components, end-to-end meta-mission harness producing skill packages

**Apollo AGC Block II Simulator (Phases 213-214):**
- Complete CPU emulation: 38 instructions covering arithmetic, logic, control flow, I/O, and special operations
- Ones' complement ALU with iterative end-around carry matching real Block II hardware
- Bank-switched memory: EBANK (8 banks × 256 words erasable), FBANK (32 banks × 1024 words fixed), superbank extension
- Interrupt system: 10 vectors with priority resolution and inhibit/enable control
- I/O channels: 512 channels for peripheral communication
- 2.048 MHz timing model with MCT (memory cycle time) accuracy

**AGC Executive/Waitlist/BAILOUT (Phase 216):**
- Executive: priority-based cooperative scheduler with 8 core sets (register save areas)
- Waitlist: timer-driven task queue with 9 entries and centisecond dispatch resolution
- BAILOUT: restart protection with program alarm codes, reproducing the Apollo 11 1202 alarm scenario

**DSKY Interface & Executive Monitor (Phases 217-218):**
- Authentic display model: electroluminescent relay decoding, 6 data registers, 11 annunciator indicators
- 19-key keyboard with PRO, KEY REL, VERB, NOUN, +, -, 0-9, CLR, ENTR
- VERB/NOUN command processor with program-specific routing
- Executive Monitor: real-time visualization of scheduler state, core set allocation, waitlist queue
- Learn mode: annotations mapping AGC concepts to modern computing and GSD patterns

**AGC Development Tools (Phase 219):**
- yaYUL-compatible assembler parsing AGC assembly source into binary
- Step debugger with breakpoints, watchpoints, register inspection, and memory dumps
- Disassembler converting binary back to readable assembly
- Rope loader reading Virtual AGC binary format for loading real Apollo program images
- 54-test validation suite covering all 38 instructions and subsystems

**AGC Curriculum (Phase 221):**
- 11 chapters: orientation, number systems, memory architecture, instruction set, Executive scheduling, Waitlist timing, DSKY interface, interrupt handling, I/O channels, 1202 alarm deep dive, AGC-to-GSD pattern mapping
- 8 hands-on exercises with bare-metal AGC programs
- Capstone exercise reproducing the 1202 alarm scenario

**RFC Reference Skill (Phase 222):**
- 3-agent system: Retriever (HTTP fetching with caching), Analyzer (cross-reference and dependency mapping), Citation Builder (formatted output)
- 5 Python scripts for fetching, parsing, indexing, analyzing, and formatting RFCs
- Built-in 57-RFC index covering 9 protocol families (HTTP, TLS, DNS, TCP/IP, SMTP, etc.) with obsolescence awareness
- Multi-format output: Markdown, JSON, and BibTeX
- RFC Collection Pack scaffold for distributable reference material

### Test Coverage

- 2,164 tests across 74 plans

---

## v1.22 — Minecraft Knowledge World

**Shipped:** 2026-02-19
**Phases:** 169-198 (30 phases) | **Plans:** 37 | **Requirements:** 73

Build a Minecraft Java Edition Knowledge World server on GSD local cloud infrastructure with PXE boot automation, hypervisor-agnostic VM provisioning, platform portability, Amiga emulation, spatial learning curriculum, formalized skill/agent/team chipset, and operational maturity.

### Key Features

**Local Cloud Infrastructure (Phases 169-175):**
- PXE boot server with DHCP/TFTP configuration for network-booted installations
- Kickstart automation for unattended CentOS Stream 9 provisioning
- Hypervisor-agnostic VM provisioning across KVM/libvirt, VMware Workstation, and VirtualBox
- Network bridge configuration with firewalld zone management

**Minecraft Knowledge World (Phases 176-180):**
- Minecraft Java Edition server on Fabric mod loader
- Syncmatica mod stack for real-time Litematica schematic sharing
- Automated deployment pipeline from bare VM to running server
- Themed district layout: Computing History, Networking, Architecture, Creative Workshop
- Spawn area with tutorial path and orientation signage
- Schematic library with 10 templates for educational builds
- Educational curriculum mapping computing concepts to Minecraft mechanics
- Amiga Corner exhibit within the Knowledge World

**Platform Portability (Phases 181-183):**
- Comprehensive hardware discovery (CPU, memory, GPU, storage, NIC, virtualization extensions)
- Distribution abstraction layer supporting dnf (Fedora/CentOS), apt (Debian/Ubuntu), pacman (Arch)
- Multi-hypervisor VM operations (create, start, stop, snapshot, clone, delete) with unified interface
- Container fallback for environments without hardware virtualization

**Amiga Emulation (Phases 184-186):**
- FS-UAE emulator integration with AROS ROM as default (no copyright issues)
- Application profiles: Deluxe Paint (pixel art), OctaMED (music), ProTracker (modules), PPaint (animation)
- IFF/ILBM image format converter and MOD/MED audio format converter
- Legally curated 50-item content collection (public domain, Creative Commons, freeware)

**Chipset Formalization (Phases 191-194):**
- 20 formalized SKILL.md files covering all infrastructure components
- 10 agent definitions across 5 teams
- Team topologies: pipeline (sequential processing), map-reduce (parallel fan-out), swarm (peer coordination), leader-worker (directed delegation)
- Unified chipset configuration YAML with trigger routing matrix
- Inter-team ICD specifications for structured communication

**Operational Maturity (Phases 195-198):**
- Automated RCON-quiesced backups: world save before backup, 24/7/4 rotation (24 hourly, 7 daily, 4 weekly)
- Prometheus monitoring with 9 alert rules covering server health, TPS, player count, disk usage
- Golden image lifecycle: rapid rebuild (<5 min from clone, <20 min from scratch)
- Four operational runbooks: server maintenance, backup/restore, monitoring, incident response

---

## v1.21 — GSD-OS Desktop Foundation

**Shipped:** 2026-02-14
**Phases:** 158-168 (11 phases) | **Plans:** 34 | **Requirements:** 50

Build the Tauri desktop application shell with WebGL 8-bit graphics engine, first-boot calibration, Amiga-inspired desktop environment, and native system bridges (PTY, file watcher, IPC).

### Key Features

**Tauri Desktop Shell (Phases 158-160):**
- Tauri v2 application with Rust backend and Vite webview frontend
- Bidirectional IPC: commands (webview→Rust), events (Rust→webview), channels (streaming)
- Capability ACL security restricting webview access to specific Rust commands
- Frameless window with custom chrome for Amiga Workbench aesthetic

**WebGL CRT Engine (Phase 161):**
- WebGL2 multi-pass post-processing pipeline
- Scanline effect with configurable intensity and gap ratio
- Barrel distortion simulating CRT curvature
- Phosphor glow with bloom radius control
- Chromatic aberration (RGB channel separation)
- Vignette darkening at screen edges
- Per-effect intensity controls with CSS fallback for non-WebGL browsers

**Indexed Palette System (Phase 162):**
- 32-color indexed palette with configurable slots
- 5 retro-computing presets: Amiga Kickstart 1.3, Workbench 2.0, Workbench 3.1, Commodore 64, custom
- OKLCH-based palette generation for perceptually uniform color interpolation
- Copper list raster effects for per-scanline color manipulation (gradient fills, sky effects)

**Native PTY Terminal (Phase 163):**
- Rust-backed pseudo-terminal via portable-pty crate
- xterm.js terminal emulator in webview with full ANSI support
- Watermark-based flow control (pause at high-water, resume at low-water)
- tmux session binding with automatic detach-on-close

**Desktop Environment (Phases 164-165):**
- Amiga Workbench-inspired window manager with depth cycling (click to front/back)
- Window drag/resize with configurable snap-to-edge
- Taskbar with process indicators and minimized window chips
- Pixel-art icon set for file types, applications, and system functions
- System menu with application launcher and preferences
- Keyboard shortcuts: Alt+Tab (window cycling), F10 (system menu), Ctrl+Q (quit)

**Boot & Calibration (Phases 166-168):**
- Three-screen calibration wizard: color picker, CRT effect tuning, theme/palette selection
- Amiga chipset boot sequence animation (Agnus, Denise, Paula, Gary initialization)
- Boot sequence skippable with click or keypress
- Accessibility auto-detection: disables CRT effects on `prefers-reduced-motion`, applies high-contrast palette on `prefers-contrast`

### Test Coverage

- 636 tests across 34 plans

---

## v1.20 — Dashboard Assembly

**Shipped:** 2026-02-14
**Phases:** 152-157 (6 phases) | **Plans:** 12 | **Requirements:** 23

Wire 13 orphaned dashboard components into the generator pipeline with unified CSS and real data pipelines, so the generated dashboard reflects every feature built across v1.12-v1.19.

### Key Features

**Unified CSS Pipeline (Phase 152):**
- 18 component style modules wired into the dashboard generator
- Design system token compliance: all colors reference CSS custom properties (no hardcoded hex values)
- Component styles: gantry strip, entity shapes, topology view, activity feed, budget gauge, silicon panel, staging queue, console page, question cards, upload zone, submit flow, config form

**Data Collectors (Phases 153-155):**
- Topology data collector: reads real skill/agent/team files via gray-matter parsing, infers domain from file content, renders entity legend with shape+color encoding
- Activity feed collector: transforms git commits and session observations into FeedEntry[] with scope classification (skill/agent/team/phase) and domain inference
- Budget-silicon collector: bridges CumulativeBudgetResult and IntegrationConfig to gauge and panel renderers with domain color mapping
- Staging queue collector: reads queue-state.json, maps 7-state items to color-coded badges for dashboard panel

**Console Page Assembly (Phases 156-157):**
- Console assembled as 6th generated dashboard page (console.html)
- Settings panel with hot-configurable integration options
- Activity timeline showing recent session operations
- Question card display with 5 interactive question types
- Submit flow for milestone configuration
- Full CSS integration with design system tokens

### Test Coverage

- 110 tests across 12 plans

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
2026-02-14  v1.20   Dashboard Assembly
2026-02-14  v1.21   GSD-OS Desktop Foundation
2026-02-19  v1.22   Minecraft Knowledge World
2026-02-19  v1.23   Project AMIGA
2026-02-19  v1.24   GSD Conformance Audit & Hardening
2026-02-19  v1.25   Ecosystem Integration
2026-02-19  v1.26   Aminet Archive Extension Pack
2026-02-20  v1.27   GSD Foundational Knowledge Packs
2026-02-21  v1.28   GSD Den Operations
2026-02-21  v1.29   Electronics Educational Pack
2026-02-22  v1.30   Vision-to-Mission Pipeline
2026-02-22  v1.31   GSD-OS MCP Integration
2026-02-22  v1.32   Brainstorm Session Support
2026-02-23  v1.33   GSD OpenStack Cloud Platform (NASA SE Edition)
```
