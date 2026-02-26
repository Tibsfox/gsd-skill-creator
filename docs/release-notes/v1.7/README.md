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

---
