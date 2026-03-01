# gsd-skill-creator

Adaptive learning layer for Claude Code that creates, validates, and manages skills, agents, teams, and chipsets. Uses GSD for project management, skill-creator as the adaptive learning layer. See `.planning/PROJECT.md` for full project context.

## Tech Stack

- **Languages:** TypeScript (src/), Rust (src-tauri/), GLSL (shaders)
- **Build:** `npm run build` or `make build`
- **Test:** `npm test` or `make test` (Vitest, 19200+ tests)
- **Lint:** `npm run lint` or `make lint`
- **Key deps:** Tauri v2, xterm.js, Vite v6, Vitest
- **Desktop frontend:** `desktop/` (Vite webview)

## Key File Locations

- `.planning/` -- GSD project management (ROADMAP.md, STATE.md, REQUIREMENTS.md, config.json)
- `.claude/skills/` -- auto-activating skills (gsd-workflow, skill-integration, session-awareness, security-hygiene, and others)
- `.claude/agents/` -- GSD executor, verifier, planner subagents
- `.claude/commands/gsd/` -- GSD command definitions
- `.claude/hooks/` -- deterministic hooks (commit validation, session state, phase boundary)
- `project-claude/` -- source of project-specific Claude config (installed via `node project-claude/install.cjs`)
- `src/` -- TypeScript library and CLI
- `src/nlp/` -- Lightweight NLP (TF-IDF, Naive Bayes) — zero-dep replacements for `natural`
- `src/fs/xdg.ts` -- XDG Base Directory utility
- `src-tauri/` -- Rust backend (Tauri)
- `src-tauri/src/xdg.rs` -- Rust XDG utility
- `desktop/` -- Vite webview frontend
- `docs/` -- 158+ markdown files, canonical documentation
- `config/` -- Unified configuration (templates, crews, evaluation, profiles)
- `data/` -- Static data (schemas, chipset definitions, citations, domain data)
- `extra/` -- Linux system integration (man pages, completions, .desktop, systemd)
- `packaging/` -- Distro packaging (debian/, rpm/)
- `scripts/` -- Utility scripts (bootstrap, dashboard server, bin/)

## Commit Convention

- Conventional Commits: `<type>(<scope>): <subject>`
- Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore
- Imperative mood, lowercase, no period, subject <72 chars
- A PreToolUse hook enforces this automatically
- Include `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>` on all commits

## Quick Reference

- Check project state: read `.planning/STATE.md` and `.planning/ROADMAP.md`
- Install project-claude files: `node project-claude/install.cjs`
- Run full verification: `make verify`
- GSD skills and hooks handle workflow guidance automatically
- Strict boundary: `src/` never imports `desktop/@tauri-apps/api`; `desktop/` never imports Node.js modules

## Important Notes

- This is a self-modifying system -- the security-hygiene skill handles safety
- `.planning/patterns/` should be in `.gitignore`
- Skills load automatically based on context -- no explicit invocation needed
