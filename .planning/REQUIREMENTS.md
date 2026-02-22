# Requirements: GSD Skill Creator — v1.32 Brainstorm Session Support

**Defined:** 2026-02-22
**Core Value:** Skills, agents, and teams must match official Claude Code patterns — and the GSD ecosystem must provide spatial, visual, and operational tools that make complex system design tangible.

## v1.32 Requirements

Requirements for Brainstorm Session Support milestone. Each maps to roadmap phases.

### Foundation

- [x] **FOUND-01**: All brainstorm types compile cleanly — AgentRole, SessionPhase, TechniqueId, PathwayId, HatColor, ScamperLens, OsbornRule, EnergyLevel, SessionStatus
- [x] **FOUND-02**: Zod schemas provide runtime validation for all message bus and persistence types
- [x] **FOUND-03**: Session-scoped filesystem bus with monotonic counter filenames prevents concurrent write collision
- [x] **FOUND-04**: `.brainstorm/` directory at project root with `.gitignore` entry and EventDispatcher exclusion
- [x] **FOUND-05**: Constants cover all 15 technique defaults, 8 agent phase rules, 7 message priorities

### Rules Engine

- [x] **RULES-01**: Osborn's 4 rules enforced per phase — all active during Diverge, build-combine primary during Organize, relaxed during Converge
- [x] **RULES-02**: Critic agent architecturally blocked during all non-Converge phases via `canActivateAgent()`
- [x] **RULES-03**: Two-stage evaluative content detection — pattern match then constructive-context check — with <5% false positive rate verified against 50-sentence corpus
- [x] **RULES-04**: Black Hat technique constraint prevents evaluative content from non-Critic agents during Diverge
- [x] **RULES-05**: Violation logging with `RuleViolation` records persisting across phase transitions
- [x] **RULES-06**: Phase-appropriate rule reminders generated for Facilitator display

### Session Management

- [x] **SESS-01**: Session lifecycle state machine: created → active → paused → completed/abandoned
- [x] **SESS-02**: 5-phase controller: Explore → Diverge → Organize → Converge → Act with strict ordering
- [x] **SESS-03**: Agent activation matrix enforced per phase — Critic only during Converge, Scribe always active
- [x] **SESS-04**: Append-only idea/question JSONL streams with session persistence
- [x] **SESS-05**: Timer system with technique-specific defaults, pause/resume, and `TechniqueTransition` type with mandatory timer reset
- [x] **SESS-06**: Phase transition announcements for Facilitator to present to user

### Technique Engine

- [x] **TECH-01**: Pluggable engine with `loadTechnique()`, `getConfig()`, `listByCategory()` interface
- [x] **TECH-02**: 4 individual techniques: freewriting (stream ≥3 ideas/min), mind mapping (parent-child tree), rapid ideation (≥10 in 60s), question brainstorming (≥15 questions)
- [x] **TECH-03**: 5 collaborative techniques: brainwriting 6-3-5 (6 rounds, parent_id chains, progressive building), round robin (rotation pattern), brain-netting (async prompts), rolestorming (perspective field), figure storming (constructive personas only)
- [x] **TECH-04**: 4 analytical techniques: SCAMPER (all 7 lenses, scamper_lens field), Six Thinking Hats (all 6 colors, hat_color field, synchronized mode), starbursting (6 W-categories), Five Whys (depth 5, chain links)
- [x] **TECH-05**: 3 visual techniques: storyboarding (sequential cards), affinity mapping (clusters existing ideas, 2-8 clusters), lotus blossom (8 themes × 8 ideas = 64)
- [x] **TECH-06**: Technique-specific generation context as required TechniqueConfig field — prevents fidelity erosion
- [x] **TECH-07**: Technique completion detection via `isComplete()` for each technique

### Pathways

- [x] **PATH-01**: 5 pathway definitions with complete technique sequences: Creative Exploration, Problem-Solving, Product Innovation, Decision-Making, Free-Form
- [x] **PATH-02**: Situation-to-pathway matching from problem statement signal words
- [x] **PATH-03**: Mid-session resequencing on low energy, user request, saturation, or unexpected depth
- [x] **PATH-04**: Free-form pathway supports any technique on demand

### Agents

- [ ] **AGENT-01**: Facilitator agent — problem assessment, pathway recommendation, energy management, transition confidence scoring, adaptive technique sequencing, non-judgmental facilitation voice
- [ ] **AGENT-02**: Ideator agent — idea generation across individual and collaborative techniques, never evaluates own output
- [ ] **AGENT-03**: Questioner agent — question generation only, redirects answers to questions
- [ ] **AGENT-04**: Analyst agent — SCAMPER lens management, Six Thinking Hats coordination with hat-color broadcast to all agents
- [ ] **AGENT-05**: Mapper agent — mind mapping, affinity mapping, lotus blossom, storyboarding — organizes without evaluating quality
- [ ] **AGENT-06**: Critic agent — Converge-only activation, 4-dimension evaluation (feasibility/impact/alignment/risk), prioritization methods (dot voting, star rating, weighted scoring)
- [ ] **AGENT-07**: Persona agent — rolestorming and figure storming with genuine perspective fidelity, constructive personas only
- [ ] **AGENT-08**: Scribe agent — always-on capture across all phases, generates transcript/action plan/export, never generates ideas

### Artifacts

- [x] **ARTIF-01**: Session transcript in Markdown with phase headers, technique labels, timestamps
- [x] **ARTIF-02**: Action plan with ownership, deadlines, priorities for top ideas
- [x] **ARTIF-03**: JSON export with complete session state
- [x] **ARTIF-04**: Cluster map generated during Organize phase

### Integration

- [ ] **INTEG-01**: Session bus wiring connecting all 8 agents through 4 communication loops (session, capture, user, energy)
- [ ] **INTEG-02**: Bus load test — 4 concurrent writers, 12 messages in 200ms, 0 loss
- [ ] **INTEG-03**: End-to-end session flow for each pathway (Creative Exploration, Problem-Solving, Free-Form at minimum)
- [ ] **INTEG-04**: All 18 safety-critical tests passing (SC-01 through SC-18)
- [ ] **INTEG-05**: Chipset YAML and activation profiles (solo_quick, guided_exploration, full_workshop, analysis_sprint)
- [ ] **INTEG-06**: skill-creator observation hooks registered for `.brainstorm/sessions/*/`

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Multi-User

- **MULTI-01**: Real-time multi-user collaboration with human participants
- **MULTI-02**: Presence signaling and concurrent editing

### Visual

- **VIS-01**: Visual rendering of mind maps and diagrams in GSD-OS
- **VIS-02**: PPTX/DOCX export of visual artifacts
- **VIS-03**: AI-generated sketches for sketching/doodling technique

### Advanced

- **ADV-01**: Custom technique creation by users via skill-creator
- **ADV-02**: Persistent idea libraries across sessions
- **ADV-03**: Integration with project management tools for action plan handoff
- **ADV-04**: Voice input for freewriting sessions

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time multi-user collaboration | Network layer, auth, presence — separate product scope |
| Visual mind map rendering | GSD-OS visual component dependency; VisualizationData stored for later |
| PPTX/DOCX export | Format-specific libraries; Markdown covers 80% of use case |
| Voice input | Audio pipeline, hardware dependencies |
| Custom technique creation | Requires technique DSL and validation system |
| Persistent cross-session idea libraries | Cross-session state complexity, privacy implications |
| Gamification (scores, streaks) | Creates evaluation pressure that violates Osborn's rules |
| Productivity pressure messaging | Violates Humane Flow principle |
| Partial evaluation during Diverge | No-Criticism rule is binary, not graduated |
| GSD-OS Session Canvas panel | Deferred to v2.0; v1.32 is CLI/library only |
| MCP gateway brainstorm tools | Future integration point; not in v1.32 scope |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 305 | Complete |
| FOUND-02 | Phase 305 | Complete |
| FOUND-03 | Phase 305 | Complete |
| FOUND-04 | Phase 305 | Complete |
| FOUND-05 | Phase 305 | Complete |
| RULES-01 | Phase 306 | Complete |
| RULES-02 | Phase 306 | Complete |
| RULES-03 | Phase 306 | Complete |
| RULES-04 | Phase 306 | Complete |
| RULES-05 | Phase 306 | Complete |
| RULES-06 | Phase 306 | Complete |
| SESS-01 | Phase 307 | Complete |
| SESS-02 | Phase 307 | Complete |
| SESS-03 | Phase 307 | Complete |
| SESS-04 | Phase 307 | Complete |
| SESS-05 | Phase 307 | Complete |
| SESS-06 | Phase 307 | Complete |
| TECH-01 | Phase 308 | Complete |
| TECH-02 | Phase 308 | Complete |
| TECH-03 | Phase 308 | Complete |
| TECH-04 | Phase 308 | Complete |
| TECH-05 | Phase 308 | Complete |
| TECH-06 | Phase 308 | Complete |
| TECH-07 | Phase 308 | Complete |
| PATH-01 | Phase 308 | Complete |
| PATH-02 | Phase 308 | Complete |
| PATH-03 | Phase 308 | Complete |
| PATH-04 | Phase 308 | Complete |
| AGENT-01 | Phase 309 | Pending |
| AGENT-02 | Phase 310 | Pending |
| AGENT-03 | Phase 310 | Pending |
| AGENT-04 | Phase 310 | Pending |
| AGENT-05 | Phase 310 | Pending |
| AGENT-06 | Phase 310 | Pending |
| AGENT-07 | Phase 310 | Pending |
| AGENT-08 | Phase 310 | Pending |
| ARTIF-01 | Phase 308 | Complete |
| ARTIF-02 | Phase 308 | Complete |
| ARTIF-03 | Phase 308 | Complete |
| ARTIF-04 | Phase 308 | Complete |
| INTEG-01 | Phase 311 | Pending |
| INTEG-02 | Phase 311 | Pending |
| INTEG-03 | Phase 311 | Pending |
| INTEG-04 | Phase 311 | Pending |
| INTEG-05 | Phase 311 | Pending |
| INTEG-06 | Phase 311 | Pending |

**Coverage:**
- v1.32 requirements: 46 total (FOUND: 5, RULES: 6, SESS: 6, TECH: 7, PATH: 4, AGENT: 8, ARTIF: 4, INTEG: 6)
- Mapped to phases: 46
- Unmapped: 0

---
*Requirements defined: 2026-02-22*
*Last updated: 2026-02-22 after roadmap creation*
