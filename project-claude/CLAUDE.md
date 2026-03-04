# gsd-skill-creator

Adaptive learning layer for Claude Code that creates, validates, and manages skills, agents, teams, and chipsets. Uses GSD for project management, skill-creator as the adaptive learning layer. See `.planning/PROJECT.md` for full project context.

## Tech Stack

- **Languages:** TypeScript (src/), Rust (src-tauri/), GLSL (shaders)
- **Build:** `npm run build`
- **Test:** `npm test` or `make test` (Vitest, 23,234+ tests)
- **Lint:** `npm run lint`
- **Key deps:** Tauri v2, xterm.js, Vite v6, Vitest
- **Desktop frontend:** `desktop/` (Vite webview)

## Key File Locations

- `.planning/` -- GSD project management (ROADMAP.md, STATE.md, REQUIREMENTS.md, config.json)
- `.claude/skills/` -- auto-activating skills (gsd-workflow, skill-integration, session-awareness, security-hygiene, and others)
- `.claude/agents/` -- GSD executor, verifier, planner subagents
- `.claude/commands/gsd/` -- GSD command definitions
- `.claude/hooks/` -- deterministic hooks (commit validation, session state, phase boundary, branch guard)
- `project-claude/` -- source of project-specific Claude config (installed via `node project-claude/install.cjs`)
- `src/` -- TypeScript library and CLI (domain-grouped)
- `src/core/` -- Core infrastructure (types, utils, fs, events, hooks, storage, validation, safety, security)
- `src/packs/` -- Educational packs (agc, citations, dogfood, electronics-pack, engines, holomorphic, knowledge, plane)
- `src/tools/` -- CLI and dev tools (catalog, cli, commands, git, interpreter, learn, mcp, vtm)
- `src/platform/` -- Platform services (calibration, console, dashboard, observation, retro, staging, terminal)
- `src/services/` -- Agent orchestration (agents, brainstorm, chipset, detection, discovery, orchestrator, teams, workflows)
- `src/integrations/` -- External integrations (amiga, aminet, cloud-ops, dacp, den, site, upstream)
- `src-tauri/` -- Rust backend (Tauri)
- `desktop/` -- Vite webview frontend
- `.college/` -- College Structure: Rosetta Core, panels, 42 departments, calibration
- `docs/` -- 158+ markdown files, canonical documentation

## Error Correction (DSP 3-Layer System)

Three layers of inline error correction, inspired by digital signal processing:

- **Layer 1: Deterministic hooks** (zero-token) -- `validate-commit.sh` blocks sensitive files in commits; `branch-guard.sh` warns on branch safety violations
- **Layer 2: Checkpoint assertions** -- `.claude/skills/checkpoint-assertions/` auto-activates during GSD phases, provides pre-commit/post-phase/pre-push checklists
- **Layer 3: Quick-scan** -- `.claude/skills/quick-scan/` auto-activates after commits, 5-point CRC checklist (scope/magnitude/intent/tests/forbidden)

See `project-claude/specs/shift-register-format.md` for the chain history format spec.

## Commit Convention

- Conventional Commits: `<type>(<scope>): <subject>`
- Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore
- Imperative mood, lowercase, no period, subject <72 chars
- A PreToolUse hook enforces this automatically
- Include `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>` on all commits

## Quick Reference

- Check project state: read `.planning/STATE.md` and `.planning/ROADMAP.md`
- Install project-claude files: `node project-claude/install.cjs`
- GSD skills and hooks handle workflow guidance automatically
- Strict boundary: `src/` never imports `desktop/@tauri-apps/api`; `desktop/` never imports Node.js modules

## Important Notes

- **NEVER commit or push .planning/ files** -- they are local-only. A PreToolUse hook blocks this, but do not attempt it. Do not `git add .planning/`, do not include .planning paths in commits.
- This is a self-modifying system -- the security-hygiene skill handles safety
- `.planning/` is in `.gitignore` -- respect it
- Skills load automatically based on context -- no explicit invocation needed
