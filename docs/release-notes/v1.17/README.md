# v1.17 — Staging Layer

**Shipped:** 2026-02-13
**Phases:** 134-141 (8 phases) | **Plans:** 35 | **Requirements:** 38

Introduce a staging layer between human ideation and machine execution — where work is analyzed, scanned, resource-planned, and approved before entering the parallel execution queue.

### Key Features

**Staging Foundation (Phase 134):**
- 5-state filesystem pipeline: inbox → checking → attention → ready → aside
- Structured metadata per staged item (source, timestamps, state transitions)
- `.planning/staging/` directory with state-named subdirectories

**Hygiene Engine (Phase 135):**
- 11 built-in patterns detecting embedded instructions, hidden content, and YAML config safety issues
- Pattern categories: injection attempts, obfuscated content, unsafe configurations
- Severity levels with configurable thresholds

**Trust-Aware Reporting (Phase 136):**
- 4 familiarity tiers: Home (your code), Neighborhood (team), Town (org), Stranger (external)
- Trust decay over time for infrequently accessed resources
- Critical pattern lockout preventing untrusted content from reaching execution

**Smart Intake Flow (Phase 137):**
- Three-path clarity routing: clear (fast-track), gaps (questioning), confused (research)
- Step tracking with progress indicators
- Crash recovery with resumable intake state

**Resource Analysis (Phase 138):**
- Vision document analyzer extracting requirements and scope
- Skill cross-reference matching existing capabilities
- Topology recommendation based on work complexity
- Token budget estimation for execution planning

**Derived Knowledge Checking (Phase 139):**
- Provenance chain tracking (where did this knowledge come from?)
- Phantom content detection (claims without supporting evidence)
- Scope drift detection (gradual requirement expansion)
- Copying signal detection (verbatim content from external sources)

**Staging Queue (Phase 140):**
- 7-state machine: pending → analyzing → blocked → ready → executing → done → failed
- Append-only audit log for full traceability
- Cross-queue dependency detection

**Queue Pipelining (Phase 141):**
- Pre-wiring engine connecting queue items to execution plans
- Retroactive hygiene audit recommender
- Dashboard staging queue panel with real-time status

### Test Coverage

- 699 tests across 35 test files

## Retrospective

### What Worked
- **5-state filesystem pipeline is a clean mental model.** inbox → checking → attention → ready → aside maps directly to human decision-making. State-named subdirectories make the pipeline physically visible -- `ls .planning/staging/` tells you everything.
- **Trust-aware reporting with decay.** The 4 familiarity tiers (Home/Neighborhood/Town/Stranger) with trust decay over time is a sophisticated security model that avoids binary trust. Critical pattern lockout for untrusted content is the right hard boundary.
- **Derived knowledge checking catches phantom content.** Provenance chain tracking and phantom content detection (claims without evidence) address a real risk in AI-assisted systems -- generated content that looks authoritative but has no backing.
- **699 tests across 35 files.** More than double the previous release's test count, proportional to the 8-phase scope and the security-critical nature of the hygiene engine.

### What Could Be Better
- **Two state machines in one release.** The staging pipeline (5 states) and the queue (7 states) are both introduced here. The interaction between them -- when does a staged item enter the queue? -- could be clearer in the release notes.
- **11 hygiene patterns is a starting set.** The pattern categories (injection, obfuscation, unsafe config) cover the obvious cases, but the real test is how easily new patterns can be added as novel attack vectors emerge.

## Lessons Learned

1. **Three-path clarity routing reduces decision fatigue.** clear/gaps/confused as intake routing means the system self-selects its processing depth. Clear items fast-track, confused items get research. No single path handles everything.
2. **Append-only audit logs are non-negotiable for staging systems.** The queue's append-only audit log means every state transition is traceable. When something goes wrong in a 7-state machine, you need the full history.
3. **Crash recovery with resumable state is essential for multi-step intake.** The smart intake flow's crash recovery means a browser crash or session timeout doesn't lose partially-completed intake work. This is especially important for the resource analysis step which does real computation.

---
