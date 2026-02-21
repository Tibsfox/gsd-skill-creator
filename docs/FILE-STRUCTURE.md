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
├── integration/            # GSD integration layer (v1.11)
│   └── monitoring/         # Passive monitoring
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
│   └── ipc/                # Tauri IPC commands and events
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
│   └── boot/               # Amiga chipset boot sequence animation
├── index.html              # Webview entry point
├── vite.config.ts          # Vite build configuration
└── package.json            # Frontend dependencies

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
