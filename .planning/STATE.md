# State: GSD Skill Creator

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-22)

**Core value:** Skills, agents, and teams must match official Claude Code patterns -- and the GSD ecosystem must provide spatial, visual, and operational tools that make complex system design tangible.
**Current focus:** v1.32 Brainstorm Session Support -- Phase 308 in progress (Plan 05 of 6 complete)

## Current Position

Phase: 308 (4 of 7 in v1.32) (Technique Engine, Pathway Router & Artifact Generator)
Plan: 5 of 6 complete
Status: In Progress
Last activity: 2026-02-22 -- Completed 308-02 (5 collaborative techniques + Artifact Generator)

Progress: [██████░░░░░░░░░░] 36% (v1.32)

## Accumulated Context

### Decision Log

- Mission package provided as pre-built spec documents (10 files) -- research phase unnecessary
- Amiga Principle applied: specialized agents (coprocessors) for each cognitive mode
- Osborn's rules enforced architecturally, not by policy -- Critic agent not instantiated during Diverge
- Filesystem message bus for inter-agent communication (consistent with Den/AMIGA patterns)
- Functional API + class wrapper pattern continues from existing codebase
- Zero new npm dependencies -- all capabilities from existing stack (Zod, natural, node:fs/promises, node:crypto)
- src/brainstorm/ is a peer module with zero imports from src/den/, src/vtm/, src/knowledge/
- Session-scoped filesystem bus with monotonic counter filenames (not timestamp-only)
- .brainstorm/ at project root, in .gitignore, excluded from EventDispatcher
- SessionConfig.brainstormDir is required (no default) -- prevents accidental production path in tests
- lotus-blossom included as 16th technique in TechniqueId (spec-specified, despite docs saying 15)
- MESSAGE_PRIORITIES has 10 entries (not 9 as originally specced) -- HEARTBEAT added as 10th
- Critic gate checked BEFORE general AGENT_PHASE_RULES lookup -- defense-in-depth ordering
- PHASE_RULE_MAP is module-private (not exported) -- consumers use getActiveRules() API
- PHASE_REMINDERS as module-private constant with pre-composed strings per phase
- Black Hat safety enforced at technique level with both phase_constraint config and runtime skip logic
- SIX_HATS_PHASE_CONSTRAINT exported as standalone constant for Rules Engine/Phase Controller
- TechniqueInstance/TechniqueOutput interfaces defined in engine.ts, imported by all technique modules
- Five Whys seed questions at depth 0 contain problem statement; depth 5 categorized as root-cause
- Visual techniques use natural.TfIdf for affinity mapping clustering with cosine similarity fallback
- Lotus Blossom semantic duplicate detection: redirect prompt when last 3 ideas share first word or under 3 words
- Affinity Mapping returns empty ideas[] and populates visualization field with cluster hierarchy
- ALLOWED_FIGURES: 9 constructive historical figures (deduplicated from plan's 10-entry list)
- Artifact renderers are pure functions (data in, string out) -- Scribe handles filesystem writes
- Cluster map rendered inline in ArtifactGenerator (no separate template) due to simpler structure
- Action plan source_idea_ids tracing: always lookup original idea content (UX pitfall prevention)
- Lazy factory registry: Map<TechniqueId, () => TechniqueInstance> creates fresh instances per loadTechnique() call
- generation_context encoded in config.parameters per Pitfall 5 to prevent fidelity erosion across techniques
- listBySituation uses simple keyword matching (not NLP) -- Pathway Router handles sophisticated signal analysis
- Two-stage evaluative detection: Stage 1 hard-block pattern match, Stage 2 constructive-context allowlist (<5% false positive rate)
- Black Hat timing constraint checked BEFORE evaluative content check -- timing violation takes precedence
- Per-session violation storage via Map<string, RuleViolation[]> -- accumulates, never resets
- system sender resolved to facilitator AgentRole in violation records as fallback

### Key Constraints

- Must follow existing project patterns: Zod schemas, functional API + class wrapper, TDD
- Strict module boundaries: src/ never imports desktop/@tauri-apps/api; desktop/ never imports Node.js modules
- Local-first architecture: no cloud dependencies for core functionality
- Brainstorm source files under src/brainstorm/
- No real personal data in brainstorming examples -- fictional scenarios only
- Humane Flow principle: encouraging, never shaming; "Welcome back" not guilt

### Blockers

- Research flags: Phase 308 (Brainwriting 6-3-5, Six Thinking Hats) and Phase 310 (Hats synchronization handshake) may benefit from `/gsd:research-phase` before planning

## Session Continuity

Last session: 2026-02-22
Stopped at: Completed 306-02-PLAN.md (evaluative detection, Black Hat constraint, violation logging)
Resume file: None
