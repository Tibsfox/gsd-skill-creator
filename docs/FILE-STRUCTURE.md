# File Structure

> Last updated: v1.50 (2026-02-28)

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
├── docs/                Documentation (47+ markdown files)
├── examples/            Example skills, agents, and teams
├── extra/               Linux system integration files
│   ├── completions/     Shell completions (bash, zsh, fish)
│   ├── linux/           .desktop entry, AppStream metadata
│   ├── logo/            Logo assets (placeholder)
│   ├── man/             Man pages in scdoc format
│   └── systemd/         systemd user service unit
├── infra/               Infrastructure configs
│   ├── dashboard/       Generated HTML dashboard (gitignored)
│   ├── minecraft/       Minecraft knowledge world
│   └── ...              17 other infrastructure subdirectories
├── packaging/           Distro packaging definitions
│   ├── debian/          Debian source package (control, rules, etc.)
│   └── rpm/             RPM spec file
├── packs/               Educational pack catalog
├── project-claude/      Claude project config source (install.cjs)
├── projects/            User workspace (gitignored)
├── scripts/             Utility scripts
│   ├── bin/             CLI wrappers (gsd-stack)
│   ├── bootstrap.sh     Project bootstrap script
│   ├── serve-dashboard.mjs
│   └── ...              Check/validation scripts
├── skills/              Installable skill packs (9 packs)
├── src/                 TypeScript library + CLI (72 modules)
│   ├── fs/              Filesystem utilities (config, XDG, scaffold, etc.)
│   └── ...              70+ domain modules
├── src-tauri/           Rust backend (Tauri v2)
│   └── src/             Rust source (api, security, xdg, etc.)
├── test/                Test suites (14 directories)
│   ├── proofs/          Proof verification tests (9 part directories + helpers/)
│   └── fixtures/        Test fixture data
├── tests/               Legacy test directory (integration, chipset, security)
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
- **XDG compliance:** Runtime paths use `src/fs/xdg.ts` (TypeScript) and `src-tauri/src/xdg.rs` (Rust)
- **Alacritty model:** `extra/` contains all Linux integration files following the Alacritty packaging pattern
- **FHS compliance:** `packaging/` definitions install to standard Linux filesystem paths
- **Static data:** All static data files (schemas, chipset definitions, domain data) live under `data/`
