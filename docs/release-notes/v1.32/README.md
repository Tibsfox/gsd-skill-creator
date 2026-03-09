# v1.32 — Brainstorm Session Support

**Shipped:** 2026-02-22
**Phases:** 305-311 (7 phases) | **Plans:** 25 | **Commits:** 63 | **Requirements:** 46 | **Tests:** 321 | **LOC:** ~16K

AI-facilitated brainstorming support system with 8 specialized agents in leader-worker topology, 16 brainstorming techniques across 4 categories, 5 educational pathways, Osborn's rules enforcement, and structured session artifacts.

### Key Features

**Foundation Types & Bus (Phase 305):**
- 23 Zod schemas: 11 enums (AgentRole, SessionPhase, TechniqueId, PathwayId, HatColor, ScamperLens, OsbornRule, EnergyLevel, SessionStatus, MessageType) + 12 object schemas
- Session-scoped filesystem bus with monotonic counter filenames preventing concurrent write collision
- Constants: 16 technique defaults, 8 agent phase rules, 10 message priorities
- `.brainstorm/` directory at project root with `.gitignore` entry

**Rules Engine (Phase 306):**
- Osborn's 4 rules enforced architecturally per phase (all active during Diverge, relaxed during Converge)
- Architectural Critic gate: blocked at instantiation during non-Converge phases (defense-in-depth at 3 levels)
- Two-stage evaluative content detection: hard-block patterns + constructive-context allowlist (<5% false positive rate)
- Black Hat phase constraint prevents evaluative content from non-Critic agents during Diverge
- Per-session violation logging with `RuleViolation` records persisting across phase transitions

**Session Manager & Phase Controller (Phase 307):**
- 5-status state machine: created → active → paused → completed/abandoned with JSONL persistence
- Strict Explore → Diverge → Organize → Converge → Act phase ordering
- Per-phase agent activation matrix (Critic only during Converge, Scribe always active)
- Timer system with technique-specific defaults, pause/resume, mandatory reset on technique transition

**Technique Engine (Phase 308):**
- Pluggable engine with lazy factory registry for 16 techniques
- Individual: freewriting (≥3 ideas/min), mind mapping (parent-child tree), rapid ideation (≥10 in 60s), question brainstorming (≥15 questions)
- Collaborative: brainwriting 6-3-5 (6 rounds with parent_id chains), round robin, brain-netting, rolestorming, figure storming (constructive personas only)
- Analytical: SCAMPER (7 lenses), Six Thinking Hats (6 colors with synchronized mode), starbursting (6 W-categories), Five Whys (depth 5 with causal chains)
- Visual: storyboarding (sequential cards), affinity mapping (TfIdf clustering, 2-8 clusters), lotus blossom (8×8=64 ideas)

**Pathway Router (Phase 308):**
- 5 pathway definitions: Creative Exploration, Problem-Solving, Product Innovation, Decision-Making, Free-Form
- Signal-word situation matching from problem statement
- Mid-session adaptive resequencing on low energy, saturation, user request, or unexpected depth

**Artifact Generator (Phase 308):**
- Session transcript in Markdown with phase headers, technique labels, timestamps
- Action plan with ownership, deadlines, priorities for top ideas
- JSON export with complete session state
- Cluster map generated during Organize phase

**Facilitator Agent (Phase 309):**
- Problem assessment with 5-nature classification and pathway recommendation
- Transition confidence scoring: timer×0.2 + saturation×0.3 + user_signal×0.4 + min_threshold×0.1
- Energy management with PRESSURE_PHRASES runtime guard (6 banned phrases)
- Non-judgmental Humane Flow facilitation voice

**Technique Agents (Phase 310):**
- Ideator: 5 techniques, evaluateIdea() throws unconditionally
- Questioner: 3 techniques, W-word redirect, generateAnswer() throws
- Analyst: SCAMPER 7-lens cycling, Six Hats coordination with hat-color broadcast
- Mapper: 4 organizational techniques, 100% affinity placement guarantee
- Persona: 9 constructive historical figures, 6 blocked hostile terms
- Critic: Converge-only gate, composite evaluation formula (F+I+A)-R, 3 prioritization methods
- Scribe: Zod-validated capture at agent boundary, artifact generation delegation

**Integration & System Tests (Phase 311):**
- SessionBus: 4-loop filesystem message router (session, capture, user, energy)
- MESSAGE_ROUTE as Record<MessageType, BusLoop> for compile-time exhaustive routing
- Bus load test: 4 concurrent writers, 12 messages in <200ms, zero loss
- 18 safety-critical tests (SC-01 through SC-18)
- 3 end-to-end pathway tests (Creative Exploration, Problem-Solving, Free-Form)
- Chipset YAML with 4 activation profiles and skill-creator observation hooks
- Barrel export organizing all public types by layer

## Retrospective

### What Worked
- **Osborn's 4 rules enforced architecturally, not just documented.** The Architectural Critic gate blocks at instantiation during non-Converge phases (defense-in-depth at 3 levels). The two-stage evaluative content detection with hard-block patterns and constructive-context allowlist achieves <5% false positive rate. Rules are structural constraints, not guidelines.
- **16 techniques across 4 categories with lazy factory registry.** Individual (freewriting, mind mapping, rapid ideation, question brainstorming), Collaborative (brainwriting 6-3-5, round robin, brain-netting, rolestorming, figure storming), Analytical (SCAMPER, Six Thinking Hats, starbursting, Five Whys), Visual (storyboarding, affinity mapping, lotus blossom). The pluggable engine means adding technique #17 requires no framework changes.
- **Session-scoped filesystem bus with monotonic counter filenames.** Preventing concurrent write collision via monotonic counters is simpler and more reliable than locking. The 4-loop bus (session, capture, user, energy) with compile-time exhaustive routing via MESSAGE_ROUTE as Record<MessageType, BusLoop> catches routing errors at build time.
- **Bus load test: 4 concurrent writers, 12 messages in <200ms, zero loss.** This is the proof that the filesystem bus architecture works under concurrent pressure. For a brainstorming system where multiple agents generate ideas simultaneously, zero message loss is non-negotiable.

### What Could Be Better
- **8 agents in leader-worker topology is the most complex multi-agent system in the project.** Facilitator, Ideator, Questioner, Analyst, Mapper, Persona, Critic, Scribe -- each with phase-specific activation rules. The interaction matrix (which agents are active in which phases) is correct but dense. A visual activation timeline would help understanding.
- **Figure storming with 9 constructive historical figures and 6 blocked hostile terms.** The blocklist approach (blocking hostile personas) is reactive rather than proactive. An allowlist of constructive-only personas would be a stronger safety guarantee, though it limits creative flexibility.

## Lessons Learned

1. **Phase-based agent activation matrices are essential for multi-agent brainstorming.** The Critic being active only during Converge and blocked during Diverge is Osborn's core insight implemented architecturally. Without this, evaluation kills ideation.
2. **Transition confidence scoring with weighted signals prevents premature phase advancement.** timer (0.2) + saturation (0.3) + user_signal (0.4) + min_threshold (0.1) means user intent is the strongest signal but not the only one. The system won't advance if saturation is low even if the user signals readiness.
3. **Affinity mapping with TfIdf clustering (2-8 clusters) and 100% placement guarantee.** Every idea gets placed in a cluster -- no orphans. This is important because unplaced ideas are invisible ideas, and brainstorming's value comes from seeing all contributions.
4. **PRESSURE_PHRASES runtime guard (6 banned phrases) protects the brainstorming space.** Phrases like "we need to hurry" or "time is running out" undermine psychological safety. Blocking them at the facilitator level keeps the environment non-judgmental by default.

---
