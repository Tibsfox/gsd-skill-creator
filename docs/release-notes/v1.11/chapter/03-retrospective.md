# Retrospective — v1.11

## What Worked

- **Non-invasive integration is the correct architectural choice.** Wrapper commands, git hooks, passive monitoring, and slash commands connect skill-creator to GSD without modifying any GSD commands or agents. If skill-creator breaks, GSD continues working normally.
- **Idempotent install script with `--uninstall` makes integration reversible.** Safe to run multiple times, preserves observation data on removal. This is how optional integrations should work.
- **298 tests across 6 phases demonstrates thorough coverage of the integration surface.** Integration code is the highest-risk code (touching two systems), so testing density here is justified.
- **Post-commit git hook at <100ms with zero network calls shows operational discipline.** Hooks that slow down commits get disabled. The performance constraint ensures the hook stays enabled.

## What Could Be Better

- **6 slash commands and 4 wrapper commands create a wide command surface.** `/sc:start`, `/sc:status`, `/sc:suggest`, `/sc:observe`, `/sc:digest`, `/sc:wrap`, plus `/wrap:execute`, `/wrap:verify`, `/wrap:plan`, `/wrap:phase` -- users need to learn 10 new commands. A single entry point with subcommands would be more discoverable.
- **Plan-vs-summary diffing for scope changes is valuable but requires consistent plan formatting.** If plans and summaries use different structures, the diff will produce false positives.

## Lessons Learned

1. **Graceful degradation is the integration contract.** If skill loading fails, the GSD command runs normally. This means the integration can never make things worse -- only better or neutral.
2. **Scan-on-demand architecture (triggered by slash/wrapper commands) avoids background processing costs.** The system only does work when asked, which means idle sessions consume zero resources.
3. **STATE.md transition detection bridges two systems with a shared artifact.** Both GSD and skill-creator read STATE.md, which makes it a natural integration point without introducing new IPC mechanisms.

---
