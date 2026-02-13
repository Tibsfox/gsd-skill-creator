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
src/
├── storage/           # Skill storage (SkillStore, PatternStore, SkillIndex)
├── types/             # TypeScript type definitions
├── workflows/         # CLI workflows (create, list, search)
├── application/       # Skill application + pipeline (v1.8)
│   └── stages/        # Pipeline stages (budget, cache-order, model-filter)
├── observation/       # Session observation
├── detection/         # Pattern detection
├── learning/          # Feedback learning
├── composition/       # Skill extension (dependency graph, resolver)
├── agents/            # Agent composition
├── embeddings/        # Local embedding infrastructure (v1.1)
├── conflicts/         # Conflict detection (v1.1)
├── activation/        # Activation scoring (v1.1)
├── testing/           # Test infrastructure (v1.2)
├── simulation/        # Activation simulation (v1.2)
├── calibration/       # Threshold tuning (v1.2)
├── teams/             # Agent team management (v1.4)
├── discovery/         # Pattern discovery from session logs (v1.5)
├── orchestrator/      # GSD Master Orchestration Agent (v1.7)
│   ├── discovery/     # Filesystem discovery
│   ├── state/         # Project state reading
│   ├── intent/        # Intent classification
│   ├── lifecycle/     # Lifecycle coordination
│   ├── verbosity/     # Output control
│   ├── gates/         # HITL approval gates
│   └── extension/     # gsd-skill-creator detection
├── work-state/        # Persistent work state (v1.7)
├── session-continuity/ # Session snapshots (v1.7)
├── ephemeral-observations/ # Tiered observations (v1.7)
├── workflows/         # Skill workflows (v1.7)
├── roles/             # Skill roles (v1.7)
├── bundles/           # Work bundles (v1.7)
├── events/            # Inter-skill communication (v1.7)
├── capabilities/      # Capability-aware planning (v1.8)
├── validation/        # Spec alignment & validation (v1.9+)
├── safety/            # Security & integrity (v1.10)
├── disclosure/        # Progressive disclosure (v1.9)
├── portability/       # Cross-platform export (v1.9)
├── evaluator/         # Evaluator-optimizer (v1.9)
├── mcp/               # MCP distribution (v1.9)
├── retrieval/         # Agentic RAG (v1.9)
├── hooks/             # Hook safety (v1.10)
├── integration/       # GSD integration layer (v1.11)
│   └── monitoring/    # Passive monitoring
├── cli/               # CLI command modules
├── cli.ts             # CLI entry point
└── index.ts           # Module exports
```
