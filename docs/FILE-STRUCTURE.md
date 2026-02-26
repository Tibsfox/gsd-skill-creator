# File Structure

## User Project Layout

```
your-project/
├── .claude/
│   ├── skills/                      # Skill storage
│   │   └── <skill-name>/
│   │       ├── SKILL.md            # Main skill file (frontmatter + content)
│   │       ├── reference.md        # Optional reference material
│   │       └── scripts/            # Optional automation scripts
│   ├── agents/                      # Generated/custom agents
│   │   └── <agent-name>.md         # Composite agent file
│   ├── teams/                       # Agent team configurations
│   │   └── <team-name>.json        # Team config (members, topology)
│   ├── workflows/                   # Skill workflow definitions (v1.7)
│   │   └── <name>.workflow.yaml    # Multi-step skill chains
│   ├── roles/                       # Skill role definitions (v1.7)
│   │   └── <name>.role.yaml        # Behavioral constraints
│   ├── bundles/                     # Work bundle definitions (v1.7)
│   │   └── <name>.bundle.yaml      # Project-phase skill sets
│   └── settings.json               # Claude Code settings (hooks, etc.)
│
├── .planning/
│   ├── patterns/                    # Observation data
│   │   ├── sessions.jsonl          # Session observations (append-only)
│   │   ├── suggestions.json        # Skill suggestion state
│   │   ├── feedback.jsonl          # User corrections/feedback
│   │   ├── agent-suggestions.json  # Agent suggestion state
│   │   ├── workflow-runs.jsonl     # Workflow execution state (v1.7)
│   │   ├── events.jsonl            # Inter-skill events (v1.7)
│   │   └── snapshots.jsonl         # Session snapshots (v1.7)
│   ├── hooks/                       # Work state persistence (v1.7)
│   │   └── current-work.yaml       # Active task/skills/checkpoint
│   ├── PROJECT.md                  # Project context
│   ├── REQUIREMENTS.md             # Requirements specification
│   ├── ROADMAP.md                  # Development roadmap
│   └── STATE.md                    # Session memory
│
└── node_modules/
    └── dynamic-skill-creator/       # If installed as dependency
```

## Source Code Layout

```
src/                        # TypeScript library
├── storage/                # Skill storage (SkillStore, PatternStore, SkillIndex)
├── types/                  # TypeScript type definitions
├── workflows/              # CLI workflows (create, list, search)
├── application/            # Skill application + pipeline (v1.8)
│   └── stages/             # Pipeline stages (budget, cache-order, model-filter)
├── observation/            # Session observation
├── detection/              # Pattern detection
├── learning/               # Feedback learning
├── composition/            # Skill extension (dependency graph, resolver)
├── agents/                 # Agent composition
├── embeddings/             # Local embedding infrastructure (v1.1)
├── conflicts/              # Conflict detection (v1.1)
├── activation/             # Activation scoring (v1.1)
├── testing/                # Test infrastructure (v1.2)
├── simulation/             # Activation simulation (v1.2)
├── calibration/            # Threshold tuning (v1.2)
├── teams/                  # Agent team management (v1.4)
├── discovery/              # Pattern discovery from session logs (v1.5)
├── orchestrator/           # GSD Master Orchestration Agent (v1.7)
│   ├── discovery/          # Filesystem discovery
│   ├── state/              # Project state reading
│   ├── intent/             # Intent classification
│   ├── lifecycle/          # Lifecycle coordination
│   ├── verbosity/          # Output control
│   ├── gates/              # HITL approval gates
│   └── extension/          # gsd-skill-creator detection
├── work-state/             # Persistent work state (v1.7)
├── session-continuity/     # Session snapshots (v1.7)
├── ephemeral-observations/ # Tiered observations (v1.7)
├── workflows/              # Skill workflows (v1.7)
├── roles/                  # Skill roles (v1.7)
├── bundles/                # Work bundles (v1.7)
├── events/                 # Inter-skill communication (v1.7)
├── capabilities/           # Capability-aware planning (v1.8)
├── validation/             # Spec alignment & validation (v1.9+)
├── safety/                 # Security & integrity (v1.10)
├── disclosure/             # Progressive disclosure (v1.9)
├── portability/            # Cross-platform export (v1.9)
├── evaluator/              # Evaluator-optimizer (v1.9)
├── mcp/                    # MCP distribution (v1.9)
├── retrieval/              # Agentic RAG (v1.9)
├── hooks/                  # Hook safety (v1.10)
├── integration/            # GSD integration layer (v1.11) + MFE pipeline (v1.35)
│   ├── monitoring/         # Passive monitoring
│   └── config/             # Configuration reader, schema, terminal config
├── dashboard/              # Planning docs dashboard (v1.12+)
│   ├── parser.ts           # Markdown-to-HTML parser
│   ├── renderer.ts         # HTML page renderer
│   ├── generator.ts        # Multi-page generator pipeline
│   ├── collectors/         # Data collectors (git, topology, activity, budget, staging)
│   ├── metrics/            # Live metrics engine (hot/warm/cold tiers)
│   ├── design-system/      # CSS tokens, entity shapes, gantry strip
│   └── console/            # Console page, question cards, settings
├── identifiers/            # Domain-prefixed identifiers (v1.18)
├── terminal/               # Terminal launcher, health, session (v1.15)
├── launcher/               # Dashboard + terminal dev launcher (v1.15)
├── console/                # Filesystem message bus (v1.16)
├── amiga/                  # AMIGA mission infrastructure (v1.23)
│   ├── mc1/                # MC-1 Control Surface (dashboard, parser, alerts, gates)
│   ├── me1/                # ME-1 Mission Environment (provisioner, phase engine, swarm)
│   ├── ce1/                # CE-1 Commons Engine (attribution, weighting, dividends)
│   ├── gl1/                # GL-1 Governance Layer (charter, rules engine, policy)
│   ├── icd/                # 4 typed Inter-Component Definitions
│   └── integration/        # Full-stack controller and meta-mission harness
├── agc/                    # Apollo AGC Block II simulator (v1.23)
│   ├── cpu/                # 38-instruction CPU, ones' complement ALU
│   ├── memory/             # Bank-switched memory (EBANK/FBANK/superbank)
│   ├── interrupts/         # 10-vector interrupt system, I/O channels
│   ├── timing/             # 2.048 MHz timing model
│   ├── executive/          # Priority-based cooperative scheduler (8 core sets)
│   ├── waitlist/           # Timer-driven task queue (9 entries)
│   ├── bailout/            # Restart protection, 1202 alarm reproduction
│   ├── dsky/               # Display model, keyboard, VERB/NOUN processor
│   ├── monitor/            # Executive Monitor with scheduling visualization
│   ├── tools/              # yaYUL assembler, debugger, disassembler, rope loader
│   └── curriculum/         # 11 chapters, 8 exercises, learn mode
├── engines/                # Mathematical foundations engines (v1.35)
│   ├── dependency-graph    # Prerequisite graph traversal
│   ├── path-finder         # Learning path computation
│   ├── plane-classifier    # Domain classification
│   ├── plane-navigator     # Concept space navigation
│   ├── composition-engine  # Knowledge composition
│   ├── proof-composer      # Proof assembly
│   ├── property-checkers   # Domain property verification
│   └── verification-engine # End-to-end verification
├── learn/                  # sc:learn knowledge ingestion pipeline (v1.35)
│   ├── acquirer            # Source acquisition
│   ├── sanitizer           # Input sanitization
│   ├── hitl-gate           # Human-in-the-loop approval gate
│   ├── analyzer            # Content analysis
│   ├── extractor           # Knowledge extraction
│   ├── dependency-wirer    # Dependency graph wiring
│   ├── dedup-prefilter     # Deduplication pre-filter
│   ├── semantic-comparator # Semantic similarity comparison
│   ├── merge-engine        # Knowledge merge
│   ├── changeset-manager   # Changeset tracking
│   ├── report-generator    # Ingestion report generation
│   ├── generators/         # Skill/agent generators
│   └── heuristics/         # Scoring heuristics
├── citations/              # Citation management and source attribution (v1.36)
│   ├── types/              # Citation type definitions
│   ├── extractor/          # Citation extraction from sources
│   ├── store/              # Citation persistence
│   ├── resolver/           # Cross-reference resolution (CrossRef, OpenAlex, NASA NTRS)
│   ├── generator/          # Format output (BibTeX, APA7, Chicago, MLA, Mustache)
│   ├── learn-integration/  # sc:learn pipeline integration
│   ├── discovery/          # Source discovery
│   ├── dashboard/          # Citation dashboard
│   └── space-between/      # Inter-citation analysis
├── plane/                  # Complex plane learning framework (v1.37)
│   ├── types               # SkillPosition (theta, r), domain types
│   ├── arithmetic          # Complex arithmetic operations
│   ├── activation          # Tangent-line activation functions
│   ├── signal-classification # Signal classification in complex plane
│   ├── position-store      # PositionStorePort, skill position persistence
│   ├── observer-bridge     # Observation pipeline bridge
│   ├── promotion           # Skill promotion logic
│   ├── refinement-wrapper  # Refinement with angular velocity clamping
│   ├── chords              # Chord detection
│   ├── composition         # Euler composition (r1*r2*e^(i(t1+t2)))
│   ├── metrics             # Versine/exsecant metrics
│   ├── dashboard           # Plane visualization dashboard
│   └── migration           # Position data migration
├── retro/                  # Self-improvement lifecycle (v1.39)
│   ├── types               # Retro type definitions
│   ├── template-generator  # Retrospective template generation
│   ├── changelog-watch     # Changelog monitoring
│   ├── calibration-delta   # Calibration drift detection
│   ├── action-generator    # Improvement action generation
│   └── observation-harvester # Session observation harvesting
├── dogfood/                # sc:learn dogfood pipeline (v1.40)
│   ├── extraction/         # PDF extraction: extractor, chapter-detector, math-parser,
│   │                       #   chunk-segmenter, section-parser, diagram-cataloger, manifest
│   ├── harness/            # Ingestion harness: checkpoint-manager, progress-tracker,
│   │                       #   metrics-collector, dashboard-bridge
│   ├── learning/           # Learning pipeline: concept-detector, position-mapper,
│   │                       #   track-runner, cross-referencer, database-merger, ingest-controller
│   ├── verification/       # Verification engine: knowledge-differ, gap-classifier,
│   │                       #   coverage-mapper, consistency-checker, eight-layer-verifier
│   └── refinement/         # Refinement and reporting: patch-generator, ticket-generator,
│                           #   skill-refiner, report-builder, safety-validator
├── cli/                    # CLI command modules
├── cli.ts                  # CLI entry point
└── index.ts                # Module exports

src-tauri/                  # Rust backend (v1.21)
├── src/
│   ├── main.rs             # Tauri application entry point
│   ├── pty/                # Native PTY management (portable-pty)
│   ├── watcher/            # File system watcher (notify crate)
│   ├── tmux/               # tmux session binding
│   ├── claude/             # Claude Code session management
│   ├── ipc/                # Tauri IPC type definitions and events
│   ├── security/           # Agent security (v1.38): sandbox, credential proxy,
│   │                       #   keystore, agent isolation
│   ├── api/                # API client (v1.39): client, streaming, keystore, retry, history
│   ├── magic/              # Magic verbosity system (v1.39): filter, persistence, types
│   ├── services/           # Service launcher (v1.39): launcher, registry, health,
│   │                       #   LED, shutdown
│   ├── staging/            # Staging intake (v1.38/v1.39): intake, hygiene, notify,
│   │                       #   debrief, security scanner, pipeline
│   └── commands/           # Tauri IPC command handlers (v1.39)
├── Cargo.toml              # Rust dependencies
└── tauri.conf.json         # Tauri window/capability configuration

desktop/                    # Vite webview frontend (v1.21)
├── src/
│   ├── engine/             # WebGL2 CRT shader engine, palette, copper lists
│   ├── terminal/           # xterm.js terminal emulator
│   ├── tmux/               # tmux session UI
│   ├── claude/             # Claude session UI
│   ├── ipc/                # Tauri IPC client wrappers
│   ├── wm/                 # Window manager (depth cycling, drag/resize)
│   ├── shell/              # Desktop shell (taskbar, icons, system menu)
│   ├── dashboard/          # Dashboard rendering within GSD-OS windows
│   ├── calibration/        # Three-screen calibration wizard
│   ├── boot/               # Amiga chipset boot sequence animation
│   ├── components/         # Chat UI components (v1.39): CliChat, ChatInput, StreamingText
│   ├── chat/               # Chat pipeline (v1.39): history, sanitizer, LED panel,
│   │                       #   error display, scroll controller
│   ├── magic/              # Magic settings UI (v1.39): filter, persistence, recalibrate panel
│   ├── pipeline/           # Integration pipeline (v1.39): chat-pipeline, led-bridge,
│   │                       #   staging-bridge, bootstrap-flow, error-recovery, persistence-manager
│   └── styles/             # CSS styles (v1.39): main, cli-chat, dashboard-host, boot, recalibrate
├── index.html              # Webview entry point
├── vite.config.ts          # Vite build configuration
└── package.json            # Frontend dependencies

data/                       # Domain data files (v1.35)
├── domains/                # 10 domain JSON files (451 primitives)
│   ├── 01-perception.json through 10-synthesis.json
├── dependencies/           # Dependency graph JSON (foundational, intermediate, advanced)
└── domain-index.json       # Domain index registry

infra/                      # Bash infrastructure scripts (v1.22)
├── scripts/                # Core infrastructure automation
│   ├── pxe/                # PXE boot server setup and kickstart templates
│   ├── vm/                 # Hypervisor-agnostic VM provisioning (KVM/VMware/VBox)
│   ├── minecraft/          # Fabric server deployment, RCON management
│   ├── amiga/              # FS-UAE emulation, AROS ROM, format converters
│   ├── platform/           # Hardware discovery, distribution abstraction
│   ├── backup/             # RCON-quiesced backups with 24/7/4 rotation
│   └── monitoring/         # Prometheus metrics, alert rules
├── skills/                 # 20 formalized SKILL.md definitions
├── agents/                 # 10 agent definitions
├── teams/                  # 5 team configurations with coordination patterns
├── packs/                  # Educational content packs
│   ├── agc/                # AGC study documents and reading paths
│   └── rfc-reference/      # RFC skill with 3 agents and 5 Python scripts
├── templates/              # Kickstart, VM, and configuration templates
├── runbooks/               # 4 operational runbooks
└── inventory/              # Hardware capability profiles

.chipset/                   # Chipset configuration (v1.22)
├── chipset.yaml            # Unified chipset definition
└── agc-educational.yaml    # AGC educational chipset config (v1.23)
```
