# v1.7 — GSD Master Orchestration Agent

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

## Retrospective

### What Worked
- **Dynamic GSD command discovery from the filesystem eliminates hardcoded command lists.** When new commands are added, the orchestrator finds them automatically. This is the right design for a system that's still growing rapidly.
- **5-stage intent classification pipeline with confidence fallback is robust.** Exact match handles the obvious cases fast; Bayesian and semantic catch fuzzy input; confidence scoring knows when to ask the user instead of guessing. The cascade avoids over-engineering any single classification method.
- **Lifecycle-aware routing narrows candidates based on current project phase.** This is context-sensitive command resolution -- a command that's irrelevant during planning doesn't clutter the candidate list during execution.
- **Workflows, Roles, Bundles, and Events as skill extensions are the right abstractions.** Workflows chain skills, Roles constrain them, Bundles group them by phase, Events connect them causally. Each extension adds one dimension of coordination.

### What Could Be Better
- **16 phases, 38 plans, and 42 requirements make this the largest release so far.** The orchestrator is the integration point for everything built in v1.0-v1.6, so the scope is justified, but the surface area is significant.
- **Crash recovery for workflows is mentioned but hard to test.** Multi-step skill chains that fail mid-execution need deterministic recovery, which requires simulating partial failures -- a testing challenge that may not be fully addressed yet.

## Lessons Learned

1. **The orchestrator is the system's spine.** Everything before v1.7 built components; v1.7 connects them. Without an orchestrator, skills/agents/teams are isolated capabilities with no coordination layer.
2. **Verbosity levels and confirmation gates are UX decisions, not afterthoughts.** A system that does things automatically without asking is terrifying; one that asks about everything is annoying. The gates are the dial between those extremes.
3. **Event-based skill activation (emit/listen) enables emergent behavior.** Skills that react to other skills' outputs create chains that weren't explicitly designed -- this is where the system starts behaving adaptively rather than procedurally.

---
