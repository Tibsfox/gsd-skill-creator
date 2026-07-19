# gsd-skill-creator

Adaptive learning layer and coprocessor architecture for Claude Code. Extends [GSD](https://github.com/open-gsd/get-shit-done-redux) with skill creation, validation, management, teams, chipsets, and the Living Sensoria memory/receptor stack (M1–M8).

Load order: `STANDING-RULES.md` (always, pinned) → `CLAUDE.md` (always, this file) → `MEMORY.md` (scored by survey scorer).

## Tech Stack

- **Languages:** TypeScript (src/), Rust (src-tauri/), GLSL (shaders), Python (coprocessors/benchmarks)
- **Build:** `npm run build`, `make` (Makefile)
- **Test:** `npm test` (Vitest)
- **Lint:** `npm run lint`
- **Key deps:** Tauri v2, xterm.js, Vite v6, Vitest
- **Desktop frontend:** `desktop/` (Vite webview)
- **Coprocessors:** `coprocessors/` (Python math engine)

## Key File Locations

- `STANDING-RULES.md` — always-loaded pinned rules (dev branch, no planning commits, no Claude co-author)
- `.planning/` — GSD project management (ROADMAP.md, STATE.md, REQUIREMENTS.md, config.json) — never committed
- `.claude/skills/` — auto-activating skills (gsd-workflow, skill-integration, session-awareness, security-hygiene)
- `.claude/agents/` — GSD executor, verifier, planner subagents
- `.claude/commands/gsd/` — GSD command definitions
- `.claude/hooks/` — deterministic hooks (commit validation, session state, phase boundary)
- `project-claude/` — source of project-specific Claude config (installed via `node project-claude/install.cjs`)
- `cartridges/` — foundational cartridge definitions
- `config/` — profiles, crews, evaluation configs
- `coprocessors/math/` — Python math coprocessor
- `data/` — cartridges, chipset, schemas, domain index
- `dashboard/` — adoption, atlas, intelligence HTML dashboards
- `desktop/` — Tauri webview frontend
- `docs/` — canonical documentation, memory schema, theoretical foundations
- `contrib/` — upstream/downstream contribution pipelines

## Commit Convention

Follow `STANDING-RULES.md`:
- Conventional Commits: `<type>(<scope>): <subject>` with imperative mood, lowercase, no period, subject <72 chars
- NEVER add `Co-Authored-By: Claude` or similar trailers
- NEVER commit `.planning/` files
- Work on `dev` branch

## Auto-Orchestration & Compression

**Buffy Orchestrator** and **Caveman** are globally installed and auto-wired for this project. They fire based on task shape — no manual invocation needed.

### Buffy Orchestrator
Activates automatically on tasks requiring 3+ steps (features, refactors, multi-file changes, debug chains, complex GSD phases). Runs a 5-phase pipeline:

1. **Context** — `@file-picker` + `@code-searcher` fan out in parallel to find relevant files and patterns
2. **Plan** — Creates TODO list; `@thinker` spawns for complex architectural decisions
3. **Build** — `@editor` implements changes following project conventions (TypeScript/Rust boundaries, no `any` casts)
4. **Validate** — `@code-reviewer` reviews + `@commander` runs `npm test`, `npm run lint`, `npm run build` in parallel
5. **Summarize** — Concise summary with follow-up suggestions

Available subagents (use `@agent-name`): `@file-picker`, `@code-searcher`, `@thinker`, `@editor`, `@code-reviewer`, `@commander`.

### Caveman Compression
Two always-on layers:
- **Caveman encoding skill** — auto-compresses SPEC.md writes to ~75% fewer tokens using fragment syntax and symbols (`→`, `∴`, `∀`, `!`, `?`, `⊥`). Preserves code blocks verbatim. Auto-triggers on `/spec`, `/build`, `/check` commands.
- **Caveman Code CLI** (`caveman` v0.65.2) — 4-layer token compression (caveman mode, tool budgets, read dedup, RTK) when run standalone.

### Integration with Existing Stack
- **RTK hook** (`~/.grok/hooks/rtk.json`) compresses bash tool output at the shell level — stacks with caveman
- **Buffy MCP tools** (`buffy-analyzer`, `buffy-find-patterns`) available for codebase analysis
- **Subagent roles** registered in `~/.grok/roles/` for Grok compatibility

### Important Project-Specific Constraints
- This is a self-modifying system — `STANDING-RULES.md` pinned rules and `CLAUDE.md` override memory-driven suggestions
- `.planning/` is gitignored — never stage, commit, or push it
- Strict boundary: `src/` never imports `desktop/@tauri-apps/api`; `desktop/` never imports Node.js modules
- Skills load automatically based on context from `.claude/skills/`
- The survey scorer in `src/memory/survey-scorer.ts` evaluates MEMORY.md entries — pinned rules bypass it

**Zero manual invocation required.** Buffy fires on complex multi-step tasks. Caveman compresses on every SPEC.md write. RTK compresses bash output. Hooks verify readiness at session start.
