# File Structure

> Last updated: v1.50 (2026-03-02)

## Root Directory Layout

```
gsd-skill-creator/
├── config/              Configuration templates and profiles
│   ├── crews/           Crew deployment configs
│   ├── evaluation/      E2E evaluation configs
│   ├── profiles/        Sandbox profiles (exec, main, scout, verify)
│   └── reserved-names.json
├── contrib/             Contribution workflow (downstream/upstream)
├── data/                Static data files
│   ├── chipset/         Chipset YAML definitions
│   ├── citations/       Citation database, cache, exports
│   ├── dependencies/    Dependency graph data (3 JSON files)
│   ├── domains/         MFE domain data (10 JSON files, 451 primitives)
│   ├── domain-index.json
│   └── schemas/         JSON schemas (DACP, primitive registry)
├── desktop/             Vite webview frontend (Tauri v2)
├── dist/                Build output (gitignored)
├── docs/                Documentation (158+ markdown files)
├── examples/            Example skills, agents, and teams
├── extra/               Linux system integration files
│   ├── completions/     Shell completions (bash, zsh, fish)
│   ├── linux/           .desktop entry, AppStream metadata
│   ├── logo/            Logo assets (placeholder)
│   ├── man/             Man pages in scdoc format
│   └── systemd/         systemd user service unit
├── assets/              Project media assets (Gource videos, diagrams)
├── infra/               Infrastructure operations + game/emulation worlds (infra/worlds/)
│   ├── dashboard/       Generated HTML dashboard (gitignored)
│   ├── worlds/          Game and emulation environments (Minecraft, etc.)
│   └── ...              Other infrastructure subdirectories
├── packaging/           Distro packaging definitions
│   ├── debian/          Debian source package (control, rules, etc.)
│   └── rpm/             RPM spec file
├── packs/               Staging workspace for pack release artifacts (source in src/)
├── project-claude/      Claude project config source (install.cjs)
├── projects/            User workspace for GSD-managed projects (gitignored by default)
├── scripts/             Utility scripts
│   ├── bin/             CLI wrappers (gsd-stack)
│   ├── bootstrap.sh     Project bootstrap script
│   ├── serve-dashboard.mjs
│   └── ...              Check/validation scripts
├── skills/              Published/distributable Claude skill packs (domain knowledge, installable by users)
├── src/                 TypeScript library + CLI (domain-grouped)
│   ├── core/            Core infrastructure
│   │   ├── types/       Type definitions and schemas
│   │   ├── utils/       Shared utilities
│   │   ├── fs/          Filesystem utilities (config, XDG, scaffold)
│   │   ├── events/      Event system
│   │   ├── hooks/       Lifecycle hooks
│   │   ├── storage/     Persistence layer (skill-store, pattern-store)
│   │   ├── validation/  Validation logic
│   │   ├── safety/      Safety constraints
│   │   └── security/    Security boundaries
│   ├── packs/           Educational and domain packs
│   │   ├── agc/         Apollo Guidance Computer simulator
│   │   ├── citations/   Citation management and attribution
│   │   ├── dogfood/     sc:learn dogfood pipeline
│   │   ├── electronics-pack/  Electronics educational pack
│   │   ├── engines/     Mathematical foundations engine
│   │   ├── holomorphic/ Holomorphic dynamics and DMD
│   │   ├── knowledge/   Knowledge modules
│   │   └── plane/       Complex plane learning framework
│   ├── tools/           CLI and developer tools
│   │   ├── catalog/     Script catalog
│   │   ├── cli/         CLI framework
│   │   ├── commands/    CLI command implementations
│   │   ├── git/         Git integration
│   │   ├── interpreter/ Interpreter modules
│   │   ├── learn/       sc:learn pipeline
│   │   ├── mcp/         MCP host integration
│   │   └── vtm/         Vision-to-mission pipeline
│   ├── platform/        Platform services and UI
│   │   ├── calibration/ Threshold calibration
│   │   ├── console/     Console UI
│   │   ├── dashboard/   Live planning dashboard
│   │   ├── observation/ Session observation
│   │   ├── retro/       Retrospective tooling
│   │   ├── staging/     Staging pipeline
│   │   └── terminal/    Terminal integration
│   ├── services/        Agent orchestration and services
│   │   ├── agents/      Agent generation and management
│   │   ├── brainstorm/  Brainstorm session support
│   │   ├── chipset/     AMIGA chipset model
│   │   ├── detection/   Pattern detection (n-gram, DBSCAN)
│   │   ├── discovery/   Skill discovery
│   │   ├── orchestrator/ Multi-agent orchestration
│   │   ├── teams/       Team generation and coordination
│   │   └── workflows/   Skill workflow engine
│   ├── integrations/    External system integrations
│   │   ├── amiga/       AMIGA coprocessor protocol
│   │   ├── aminet/      Aminet package network
│   │   ├── cloud-ops/   Cloud operations (OpenStack)
│   │   ├── dacp/        Deterministic agent communication
│   │   ├── den/         Den modules
│   │   ├── site/        Static site generation
│   │   └── upstream/    Upstream intelligence
│   ├── activation/      Skill activation engine
│   ├── application/     Application lifecycle
│   ├── bundles/         Bundle management
│   ├── capabilities/    Capability declarations
│   ├── components/      Component system
│   ├── composition/     Skill composition
│   ├── conflicts/       Conflict resolution
│   ├── disclosure/      Progressive disclosure
│   ├── embeddings/      Embedding cache and similarity
│   ├── evaluator/       Skill evaluation
│   ├── identifiers/     Name and ID management
│   ├── initialization/  Init and bootstrap
│   ├── integration/     Integration helpers (singular)
│   ├── launcher/        Process launcher
│   ├── learning/        Learning engine
│   ├── portability/     Cross-platform export
│   ├── retrieval/       Skill retrieval
│   ├── roles/           Role definitions
│   ├── simulation/      Activation simulation
│   ├── skill-workflows/ Workflow definitions
│   ├── styles/          Style system
│   ├── test/            Test utilities
│   ├── testing/         Test framework
│   ├── cli.ts           CLI entry point
│   └── index.ts         Library barrel export
├── src-tauri/           Rust backend (Tauri v2)
│   └── src/             Rust source (api, security, xdg, etc.)
├── test/                Test suites (domain-grouped, mirrors src/)
│   ├── core/            Core module tests
│   ├── packs/           Pack module tests
│   ├── tools/           Tool module tests
│   ├── platform/        Platform module tests
│   ├── services/        Service module tests
│   ├── integrations/    Integration module tests
│   ├── proofs/          Proof verification tests (9 part directories + helpers/)
│   └── fixtures/        Test fixture data
└── www/                 Web staging (site, tools)
```

## Hidden Directories

```
.archive/       Deprecated code archive (gitignored)
.claude/        Claude Code runtime configuration
.git/           Git repository
.github/        GitHub configuration
.planning/      GSD project management (gitignored)
```

## Root Files

| File | Purpose |
|------|---------|
| `CHANGELOG.md` | Release changelog |
| `CLAUDE.md` | Claude Code instructions |
| `CONTRIBUTING.md` | Contribution guidelines |
| `INSTALL.md` | Installation guide |
| `LICENSE` | MIT license |
| `Makefile` | Build orchestration (make build/test/lint/verify) |
| `README.md` | Project readme |
| `SECURITY.md` | Security policy |
| `.editorconfig` | Cross-editor formatting |
| `.gitignore` | Git exclusion rules |
| `package.json` | NPM manifest |
| `package-lock.json` | NPM lock file |
| `tsconfig.json` | TypeScript configuration |
| `vitest.config.ts` | Vitest test configuration |

## Key Conventions

- **Strict boundary:** `src/` never imports from `desktop/` or `@tauri-apps/api`; `desktop/` never imports Node.js modules
- **XDG compliance:** Runtime paths use `src/core/fs/xdg.ts` (TypeScript) and `src-tauri/src/xdg.rs` (Rust)
- **Alacritty model:** `extra/` contains all Linux integration files following the Alacritty packaging pattern
- **FHS compliance:** `packaging/` definitions install to standard Linux filesystem paths
- **Static data:** All static data files (schemas, chipset definitions, domain data) live under `data/`
