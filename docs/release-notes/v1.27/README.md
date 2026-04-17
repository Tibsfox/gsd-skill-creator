# v1.27 — GSD Foundational Knowledge Packs

**Released:** 2026-02-20
**Scope:** content + runtime milestone — 35 educational knowledge packs across 3 tiers, GSD-OS dashboard, and the full skill-creator observation pipeline (observation hooks → AMIGA event bridge → pattern detector → pathway adapter → activity scaffolder → approach promoter)
**Branch:** dev → main
**Predecessor:** v1.26 — Aminet Archive Extension Pack
**Successor:** v1.28 — GSD Den Operations
**Classification:** milestone — the first release to cross content and adaptive runtime in a single ship
**Phases:** 243-254 (12 phases) · **Plans:** 79 · **Requirements:** 81
**Tests:** 10,032 total (144 new across 23 test files)
**LOC delta:** ~23,600 lines shipped
**Verification:** all 10,032 knowledge-module tests green · end-to-end observation-to-adaptation pipeline exercised against every pack · content-validation test suite (35+ tests) over the pack corpus · dependency graph cross-checked against the 35-pack inventory

## Summary

**v1.27 is the release where GSD stopped being a toolchain and started being a curriculum.** Twelve phases, seventy-nine plans, and eighty-one requirements delivered thirty-five complete educational knowledge packs (fifteen Core Academic, ten Applied, ten Specialized) plus a runtime that watches a learner, detects patterns in what they did, and adapts what the system offers them next. The shipment deliberately pairs a content corpus with an observation loop — content without a learning loop stays shelfware, and a learning loop with no content is a demo — and grounds both on top of the v1.25 ecosystem specification layer so that the knowledge pack module inherits the dependency-tier discipline, the Educational tier boundary, and the AMIGA `EventEnvelope` format rather than inventing parallel infrastructure. This is the moment the "adaptive learning layer" claim in the project description starts being measurable against an actual body of learning content.

**The 35-pack corpus is uniform in structure and deliberately broad in subject.** Every pack has the same five-file shape: a vision document stating learning outcomes, a modules YAML decomposing the pack into five sub-topics, an activities JSON with twelve graded exercises, an assessment rubric, and a resources list. The uniformity is load-bearing — the GSD-OS pack browser, the progress tracker, the skill tree visualizer, and the pathway adapter all walk the same structure without pack-specific code — and it is what lets pack #36 land without a tool change. The three tiers cover fifteen Core Academic packs (MATH-101, SCI-101, TECH-101, ENGR-101, PHYS-101, CHEM-101, READ-101, CRIT-101, PROB-101, COMM-101, HIST-101, GEO-101, MFAB-101, BUS-101, STAT-101), ten Applied & Practical packs (CODE-101, DATA-101, LANG-101, PSYCH-101, ENVR-101, NUTR-101, ECON-101, WRIT-101, LOG-101, DIGLIT-101), and ten Specialized & Deepening packs including the meta-pack LEARN-101 that teaches learners how to learn. The scale is real: 175 modules, 408 activities, 35 assessments, 3,000+ resource entries, and 500+ unique learning outcomes — enough to fall over on if the pack structure did not scale, and it did not fall over.

**Phase 243 was the runtime foundation under the whole release.** Before any pack could be authored, the runtime had to define what a pack is in a machine-checkable way. Phase 243 landed the Zod schemas for pack types, the pack registry with lookup / tier filtering / category filtering / tag search, the content loader that reads the five canonical files into typed objects, the dependency resolver with circular-dependency detection built in, and the barrel exports that make the pack API surface one import away for every downstream consumer. Shipping the schema and the dependency-cycle check at the same phase as the registry meant every subsequent pack was cycle-safe by construction — adding PHILO-101 that prereqs CRIT-101 that prereqs READ-101 never had a chance to form a loop because the resolver refused it at registration time. The same pattern that v1.0 used for skill `extends:` inheritance, reapplied at the pack layer: ship the primitive and its safety check together or ship neither.

**Phase 244's chipset and agent definitions give the pack corpus a map-reduce generation topology.** Authoring thirty-five packs of content by hand would have taken months; the KP- agent family instead uses a map-reduce topology that parallelizes pack generation across agents with an 8.0% total token budget (2.0% reserved for content authoring per pack). Each pack maps to an agent, the agents work in parallel with isolated context, and a reducer aggregates results back into the registry. The SKILL.md files defining each agent follow the GSD spec format so they inherit the skill-creator validation pipeline automatically. The 2.0% per-pack content budget is tight — the retrospective calls this out — but it is tight deliberately: the map-reduce pattern only pays off if each map is small enough to fan out, and every pack that fit in the budget proved the topology scales.

**Phases 245-251 are where the thirty-five packs actually land.** The phases are numbered by tier: Core Academic packs (MATH-101 adapted from earlier work, plus the other fourteen) flow through phases 245-247, Applied packs through 248-249, Specialized packs through 250-251, with LEARN-101 as the meta-pack at the end. The decomposition by tier is not cosmetic — each tier has different prerequisite topology (Core is mostly leaves, Applied depends on Core, Specialized layers on Applied), and grouping phases by tier let the dependency resolver catch errors at the tier boundary rather than at integration time. Each pack went through the same five-artifact authoring pipeline: vision doc first to establish learning outcomes, modules YAML to decompose, activities JSON to operationalize, assessment rubric to measure, resources list to ground. The .skillmeta sidecar file carries the metadata that lets the registry find the pack. A pack is not "done" until all six files pass the content-validation test suite.

**Phase 252 added the cross-pack metadata that makes the corpus queryable rather than merely present.** The dependency graph (YAML + Mermaid diagram) maps every prerequisite relationship across the thirty-five packs so a learner starting at a specialized pack can be walked back to the Core prerequisites. Standards alignment metadata (Common Core, NCTM, NGSS) threads the corpus into established curriculum frameworks. Translation stubs sit ready for the moment a non-English locale becomes a priority, and accessibility metadata (WCAG level, keyboard navigation, screen-reader friendliness per activity) is in place from v1.27 rather than retrofitted. The 35+ content-validation tests run the corpus through structural checks (every pack has the five files, every activity has a rubric mapping, every prerequisite edge points at an existing pack) plus content checks (no empty learning outcomes, no orphan resources). The INDEX.md and ALL-PACKS-OVERVIEW.md documents are the human-readable entry points into the same data the dashboard reads programmatically.

**Phase 253 built the GSD-OS dashboard that turns the corpus into a learner-facing product.** The dashboard panel ships a pack browser with tier grouping and category filtering, full-text search with relevance ranking (name-weighted 3x, description 2x, category 1x), a pack detail view showing modules and prerequisites and grade levels, a skill tree visualization that renders the prerequisite DAG as an interactive graph, per-pack completion-state progress tracking, and an activity-suggestion engine that ranks activities by the learner's current progress state. The dashboard is the first place where the pack corpus meets the learner directly, and it is also the source of the observations the skill-creator integration consumes in phase 254. Every click, every activity completion, every assessment result becomes an observation event that the downstream pipeline can act on.

**Phase 254 is the observation-to-adaptation pipeline that makes v1.27 an adaptive release, not just a content release.** The phase ships six components in sequence, each with its own test suite. 254-01 ObservationEmitter (47 tests) publishes activity completion, assessment result, time-spent, and pack-lifecycle events. 254-02 KnowledgeEventBridge (20 tests) converts those events into the AMIGA `EventEnvelope` format with priority escalation for `pack_complete` events so downstream consumers can distinguish a finished pack from an in-progress activity. 254-03 LearningPatternDetector (19 tests) runs four pattern types (sequence, timing, scoring, engagement) against the event stream with confidence scoring and threshold filtering, emitting skill-suggestion candidates when a pattern is durable enough. 254-04 PathwayAdapter (24 tests) rewrites the learner's pack pathway based on detected struggle or excellence, reinforcing with extra scaffolding or accelerating past mastered content. 254-05 ActivityScaffolder (15 tests) generates new activities from pattern signals and inserts them into the activity chain. 254-05 ApproachPromoter (19 tests) promotes sustained patterns into new skills, producing SKILL.md markdown output that the skill-creator registry can ingest. The end-to-end shape is: a learner's behavior becomes an event, the event becomes a pattern, the pattern becomes either an adapted pathway, a scaffolded activity, or a promoted skill. 144 new tests across 23 test files verify each stage independently and the full pipeline end-to-end.

**Confidence-scored pattern detection is the design choice that keeps the adaptation loop sane.** A binary detector would fire on a single noisy observation — one fast completion does not mean the learner has mastered the topic, and one slow completion does not mean they are struggling. The LearningPatternDetector runs each of its four pattern types with a confidence score, and only patterns above a threshold propagate to the adapter. The design explicitly mirrors the bounded learning parameters shipped at v1.0 (minimum three corrections before refinement, seven-day cooldown, maximum 20% change per refinement): conservative adaptation by construction. The same philosophy that kept the v1.0 skill-learning loop from runaway drift now keeps the v1.27 knowledge-pack loop from overreacting to noise.

**The release's architectural position sits on top of v1.25's specification layer and under v1.28's coordination layer.** The Educational dependency tier defined in v1.25's four-tier model is where the knowledge packs live — zero native code, lean npm dependencies, inheriting freely from lower tiers. The AMIGA `EventEnvelope` adopted as ecosystem-wide canonical in v1.25 is what the KnowledgeEventBridge emits, rather than inventing a pack-specific event shape. The partial-build compatibility matrix from v1.25 lets the pack system run standalone or degraded when the dashboard layer is absent. And v1.28's GSD Den Operations, which ships one week later, consumes the AMIGA envelope the knowledge bridge emits for its own ten-position staff coordination. v1.27 is neither first nor last — it is the release where the specification work at v1.25 and the coordination work at v1.28 meet real content and a real learner loop.

## Key Features

| Area | What Shipped |
|------|--------------|
| Pack Runtime Infrastructure (Phase 243) | Zod schemas for pack types, pack registry with tier/category/tag filtering, content loader for the 5-file canonical pack, dependency resolver with circular-dependency detection, barrel exports for the complete API surface |
| Chipset & Agent Definitions (Phase 244) | KP- agent family, map-reduce topology for parallel pack generation, 8.0% total token budget (2.0% reserved per pack for content authoring), SKILL.md files following the GSD spec format |
| Core Academic Tier (Phases 245-247) | 15 packs: MATH-101 (adapted), SCI-101, TECH-101, ENGR-101, PHYS-101, CHEM-101, READ-101, CRIT-101, PROB-101, COMM-101, HIST-101, GEO-101, MFAB-101, BUS-101, STAT-101 |
| Applied & Practical Tier (Phases 248-249) | 10 packs: CODE-101 (adapted), DATA-101, LANG-101, PSYCH-101, ENVR-101, NUTR-101, ECON-101, WRIT-101, LOG-101, DIGLIT-101 |
| Specialized & Deepening Tier (Phases 250-251) | 10 packs: PHILO-101, THEO-101, PE-101, NATURE-101, DOMESTIC-101, ART-101, MUSIC-101, TRADE-101, ASTRO-101, LEARN-101 (meta-pack on how to learn) |
| Canonical 5-file pack format | Vision document, modules YAML, activities JSON, assessment rubric, resources list, `.skillmeta` sidecar — 35 packs conform without exception |
| Pack Metadata & Validation (Phase 252) | Cross-pack dependency graph (YAML + Mermaid), standards alignment (Common Core, NCTM, NGSS), translation stubs, accessibility metadata, content-validation test suite (35+ tests), INDEX.md, ALL-PACKS-OVERVIEW.md |
| GSD-OS Dashboard (Phase 253) | Pack browser with tier grouping + category filtering, full-text search with 3-tier relevance ranking, pack detail view (modules/prereqs/grade levels), skill tree visualization of the prerequisite DAG, per-pack completion-state tracking, progress-aware activity suggestion engine |
| Observation Types & Hooks (Phase 254-01) | ObservationEmitter publishing activity completion, assessment result, time spent, and pack-lifecycle events (47 tests) |
| AMIGA Event Bridge (Phase 254-02) | KnowledgeEventBridge converting pack events to AMIGA `EventEnvelope` with 6 event types and priority escalation for `pack_complete` (20 tests) |
| Learning Pattern Detector (Phase 254-03) | 4-pattern detection (sequence, timing, scoring, engagement) with confidence scoring, threshold filtering, and skill-suggestion emission (19 tests) |
| Pathway Adapter (Phase 254-04) | Personalized pathway rewriting based on learner history, struggle/excel detection, reinforcement-or-acceleration logic (24 tests) |
| Activity Scaffolder (Phase 254-05) | Pattern-to-activity generation, chain insertion, pattern-specific activity types (15 tests) |
| Approach Promoter (Phase 254-05) | Pattern-to-skill promotion with triggers and actions, SKILL.md markdown output that the skill-creator registry can ingest (19 tests) |
| Content scale | 35 packs · 175 modules · 408 activities · 35 assessments · 3,000+ resource entries · 500+ unique learning outcomes |
| Test coverage | 144 new tests across 23 test files; total suite at 10,032 tests passing |

## Retrospective

### What Worked

- **Uniform 5-file pack format across all 35 packs.** Every pack has the same vision doc, modules YAML, activities JSON, assessment rubric, resources list, and `.skillmeta` sidecar. This consistency is what let the pack browser, progress tracker, skill tree visualization, and pathway adapter all work generically without any pack-specific code path. Adding pack #36 is a zero-tool-change operation.
- **skill-creator integration landed as a six-component pipeline, not a monolith.** ObservationEmitter → KnowledgeEventBridge → LearningPatternDetector → PathwayAdapter → ActivityScaffolder → ApproachPromoter is a complete observation-to-adaptation pipeline where each stage has its own tests, its own failure boundary, and its own contract with the next stage. 144 new tests across 23 test files verify both the stages independently and the full end-to-end flow.
- **Confidence-scored pattern detection, not binary triggers.** The LearningPatternDetector uses four pattern types (sequence, timing, scoring, engagement) each with confidence scoring and threshold filtering. A single fast completion does not trigger acceleration; a sustained pattern does. This design choice mirrors the bounded learning parameters shipped at v1.0 and keeps the adaptation loop from overreacting to noise.
- **AMIGA EventEnvelope reuse paid off immediately.** The KnowledgeEventBridge converts pack events into the same AMIGA envelope shape that v1.25 promoted to ecosystem-wide canonical. Priority escalation for `pack_complete` events is specified inside the bridge, and no downstream consumer had to learn a new event format. v1.28's Den Operations consumed these events one week later without a translation layer.
- **Dependency-cycle prevention shipped at phase 243, before any pack landed.** The content-loader's dependency resolver detects circular prerequisites at pack registration, not at first traversal. Every pack registered after phase 243 was cycle-safe by construction. The same primitive that v1.0 applied to skill `extends:` inheritance applies at the pack level — ship the primitive and its safety check in the same phase or ship neither.
- **Scale as a correctness test.** 35 packs, 175 modules, 408 activities, 3,000+ resources, 500+ learning outcomes is enough that a pack format that did not scale would have fallen over. It did not fall over. The corpus itself was the stress test on the runtime.
- **Map-reduce topology for pack authoring made 35-pack parallelism tractable.** The KP- agent family with an 8.0% total token budget and 2.0% per-pack authoring slice turned a months-long content-authoring problem into a map-reduce job that fanned out across parallel agents. Without this topology the release would not have shipped in the phase-243-to-254 window.

### What Could Be Better

- **All 35 packs land at 101-level depth only.** The three-tier structure (Core Academic / Applied / Specialized) provides breadth, but every pack is introductory and the prerequisite chains in the dependency graph are correspondingly shallow. 201-level packs are the test that would tell us whether the architecture handles deeper prerequisite trees; that test is deferred.
- **2.0% per-pack content authoring budget is tight.** The 8.0% total KP-agent budget with only 2.0% reserved for content authoring may be thin for generating high-quality educational content across 35 packs. The map-reduce topology helps with parallelism, but the per-pack budget leaves little headroom for revisions or cross-pack consistency passes.
- **Pattern detection is confidence-scored but the thresholds are unvalidated.** Sequence, timing, scoring, and engagement each have their own confidence threshold, and the thresholds are reasonable first guesses rather than measured values. Without real-learner data the thresholds cannot be calibrated, and v1.27 ships before that data exists.
- **No cross-pack consistency audit yet.** Standards alignment metadata (Common Core, NCTM, NGSS) is in place per-pack but there is no audit that says "these 35 packs, taken together, cover standard X at grade level Y completely." That audit is a v1.28+ deliverable.
- **LEARN-101 meta-pack is one pack, not a program.** Teaching learners how to learn deserves more than a single 101-level pack. LEARN-101 is a placeholder for what should eventually be a meta-tier, and shipping it as a single pack risks signaling that the meta-learning problem is solved.
- **Dashboard progress tracking is per-pack and per-session, not cross-device.** The GSD-OS dashboard tracks completion state locally; a learner moving between devices loses progress unless the state is synced externally. Cross-device sync is not in the v1.27 scope, and the release notes should say so clearly rather than let the dashboard imply durability it does not have.

## Lessons Learned

- **Ship the content and the learning loop together.** A content corpus without an observation loop is a static library, and an observation loop without content is a demo. v1.27 deliberately paired them in a single release so the pipeline had real packs to learn from on day one. Splitting them across two releases would have meant the runtime was untested against real content when it shipped, and the content was unobservable when it shipped.
- **Uniform structure is load-bearing for generic tooling.** Every pack conforms to the same 5-file shape because the browser, progress tracker, skill tree, and pathway adapter all walk that shape. The moment a pack deviates, every downstream tool needs a special case. Enforce uniformity at schema time — the Zod schemas in phase 243 are cheaper than 35 if-statements in every consumer.
- **Ship dependency-cycle detection in the same phase as the dependency mechanism.** Phase 243 landed the pack registry and the dependency resolver with circular-detection built in. Every pack registered afterward was cycle-safe by construction. Retrofitting cycle detection after the first cycle ships is a migration; building it into the primitive is a constant-time check.
- **Confidence-scored patterns beat binary triggers for learning systems.** A binary detector fires on noise; a confidence-scored detector waits for durability. The LearningPatternDetector's four pattern types all filter by threshold, and the design mirrors v1.0's bounded-learning parameters. Any adaptive system should default to confidence scoring for any signal that drives state change.
- **Reuse canonical primitives before inventing new ones.** The KnowledgeEventBridge emits the AMIGA `EventEnvelope` v1.25 promoted to ecosystem-wide canonical, not a pack-specific event shape. v1.28's Den Operations consumed these events without a translation layer one week later. Every parallel envelope avoided is a drift surface avoided.
- **Map-reduce is the right topology for parallelizable authoring.** Thirty-five packs of content would not have fit in a serial phase budget. KP- agents fanning out with a 2.0%-per-pack authoring slice turned the problem into a map-reduce job and let the release ship in twelve phases instead of a quarter. Any multi-artifact content release should check whether the artifacts are map-reduce-shaped before allocating a serial budget.
- **Scale is a structure test.** 35 packs, 175 modules, 408 activities, 3,000+ resources is enough to expose a brittle pack format. Structural flaws in a 3-pack corpus sometimes hide; a 35-pack corpus surfaces them before the user does. Use scale deliberately as a correctness signal when the structure is new.
- **Meta-learning deserves more than one 101-level pack.** LEARN-101 is the meta-pack that teaches learners how to learn, and shipping it as a single entry risks signaling that the problem is solved. Any future meta-learning surface should be a meta-tier, not a single pack, and the release notes should say so when the initial surface is a placeholder.
- **Ship accessibility metadata from the first version.** WCAG level, keyboard navigation, and screen-reader friendliness sit inside the pack metadata at v1.27 rather than being retrofitted later. Adding accessibility data after a corpus is populated is a migration; adding it at schema time is free.
- **Validate content structurally before validating content semantically.** The 35+ content-validation tests check that every pack has the five canonical files, every activity has a rubric mapping, every prerequisite points at a real pack. Structural validation catches the easy errors quickly so the slower semantic review (does the content teach what it claims to teach?) does not waste time on syntax.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.0](../v1.0/) | Core Skill Management — the v1.0 bounded-learning parameters (3 corrections, 7-day cooldown, 20% max change) are the philosophical ancestor of v1.27's confidence-scored pattern detection |
| [v1.1](../v1.1/) | Semantic Conflict Detection — the first extension of the Apply step; v1.27's pattern detector is a later extension of the same Observe→Detect pipeline |
| [v1.5](../v1.5/) | Pattern Discovery — v1.27's LearningPatternDetector inherits the pattern-discovery paradigm and narrows it to learning-specific signals |
| [v1.8](../v1.8/) | Capability-Aware Planning — extends the Compose step; v1.27's ApproachPromoter is the analog for pack-observed patterns |
| [v1.9](../v1.9/) | Ecosystem Alignment & Advanced Orchestration — where the cross-component orchestration patterns v1.27 inherits were first wired in |
| [v1.17](../v1.17/) | Staging Layer — one of the filesystem watchers that the v1.25 EventDispatcher contract now subsumes; v1.27's KnowledgeEventBridge follows the same contract |
| [v1.18](../v1.18/) | Information Design System — the visual vocabulary the GSD-OS pack browser and skill tree visualization reuse |
| [v1.20](../v1.20/) | Dashboard Assembly — the dashboard pipeline v1.27's pack browser panel plugs into |
| [v1.21](../v1.21/) | GSD-OS Desktop Foundation — the Tauri-v2 shell that hosts the v1.27 pack browser dashboard |
| [v1.22](../v1.22/) | Minecraft Knowledge World — an earlier knowledge-pack-shaped surface whose lessons informed the v1.27 pack format |
| [v1.23](../v1.23/) | Project AMIGA — the source of the `EventEnvelope` that v1.27's KnowledgeEventBridge emits |
| [v1.24](../v1.24/) | GSD Conformance Audit — the audit discipline that the v1.27 content-validation test suite inherits |
| [v1.25](../v1.25/) | Ecosystem Integration — the specification layer under v1.27; Educational tier, 4-tier dependency philosophy, AMIGA EventEnvelope canonical form, partial-build compatibility matrix |
| [v1.26](../v1.26/) | Aminet Archive Extension Pack — immediate predecessor; v1.26 and v1.27 both ship content-corpus-plus-runtime in the same mold |
| [v1.28](../v1.28/) | GSD Den Operations — immediate successor; consumes the AMIGA envelope v1.27's KnowledgeEventBridge emits |
| [v1.29](../v1.29/) | Electronics Educational Pack — the next educational pack milestone, layering on the v1.27 pack-format primitives |
| [v1.30](../v1.30/) | Vision-to-Mission Pipeline — inherits the map-reduce topology v1.27 used for pack authoring |
| [v1.33](../v1.33/) | GSD OpenStack Cloud Platform — a later consumer of the dependency-tier discipline the packs inherit |
| [v1.49](../v1.49/) | Mega-release consolidating post-v1.25 implementation work; v1.27 is one of the contracts it conforms to |
| `docs/release-notes/v1.27/chapter/03-retrospective.md` | Retrospective chapter — full What Worked / What Could Be Better detail |
| `docs/release-notes/v1.27/chapter/04-lessons.md` | Extracted lessons (5 with classification + LLM review annotations) |
| `docs/RELEASE-HISTORY.md` | Canonical release table; v1.27 entry at line 585 |
| `docs/FEATURES.md` | Cross-release feature catalog; v1.27 features #98-104 |
| `.planning/MILESTONES.md` | Phase-by-phase detail for phases 243-254 |

## Engine Position

v1.27 is the first release in the project's history to ship a content corpus and an adaptive runtime in the same milestone. v1.0 → v1.24 built the skill-creator learning loop without enough content to observe. v1.25 specified how ecosystem components connect. v1.26 shipped the first content-plus-runtime pairing (Aminet). v1.27 broadens that pairing from a single domain to an educational curriculum: 35 packs across 3 tiers, a dashboard that lets a learner find and track progress through them, and an observation pipeline that turns learner behavior into adapted pathways, scaffolded activities, and promoted skills. Every subsequent content release — v1.28 Den Operations, v1.29 Electronics Educational Pack, v1.30 Vision-to-Mission, v1.32 Brainstorm Session Support, v1.33 GSD OpenStack — inherits the v1.27 pack format, the observation pipeline's envelope shape, and the confidence-scored pattern-detection philosophy. The release sits directly on top of v1.25's specification layer (Educational tier, AMIGA EventEnvelope, partial-build matrix) and directly under v1.28's coordination layer, and it is where the "adaptive learning layer" claim in the project description first becomes measurable against real content.

## Files

- `.claude/skills/` + `src/skills/` — skill-creator substrate the pack registry extends (schema from v1.0)
- `src/knowledge/packs/` — pack runtime: Zod schemas, registry, content loader, dependency resolver, barrel exports (phase 243)
- `src/knowledge/agents/` — KP- agent family, chipset YAML, map-reduce topology definitions (phase 244)
- `content/knowledge-packs/core/` — 15 Core Academic packs: MATH-101, SCI-101, TECH-101, ENGR-101, PHYS-101, CHEM-101, READ-101, CRIT-101, PROB-101, COMM-101, HIST-101, GEO-101, MFAB-101, BUS-101, STAT-101 (phases 245-247)
- `content/knowledge-packs/applied/` — 10 Applied & Practical packs: CODE-101, DATA-101, LANG-101, PSYCH-101, ENVR-101, NUTR-101, ECON-101, WRIT-101, LOG-101, DIGLIT-101 (phases 248-249)
- `content/knowledge-packs/specialized/` — 10 Specialized & Deepening packs: PHILO-101, THEO-101, PE-101, NATURE-101, DOMESTIC-101, ART-101, MUSIC-101, TRADE-101, ASTRO-101, LEARN-101 (phases 250-251)
- `content/knowledge-packs/INDEX.md` + `ALL-PACKS-OVERVIEW.md` — human-readable entry points; dependency-graph YAML + Mermaid diagram alongside (phase 252)
- `src/knowledge/dashboard/` — GSD-OS pack browser panel, full-text search, detail view, skill tree visualization, progress tracker, activity suggestion engine (phase 253)
- `src/knowledge/observation/` — ObservationEmitter (254-01), KnowledgeEventBridge (254-02), LearningPatternDetector (254-03), PathwayAdapter (254-04), ActivityScaffolder + ApproachPromoter (254-05)
- `tests/knowledge/` — 23 test files, 144 new tests covering pack runtime, registry, dependency resolver, dashboard, and the full observation pipeline
- `docs/FEATURES.md` — feature catalog entries #98-104 added for v1.27
- `docs/RELEASE-HISTORY.md` — canonical release table updated with the v1.27 row
- `docs/release-notes/v1.27/chapter/` — chapter files: 00-summary.md, 03-retrospective.md, 04-lessons.md, 99-context.md

---

## Version History (preserved from original release notes)

The table below lists the v1.x line that accumulated through v1.27, retained here for archival continuity.

| Version | Summary |
|---------|---------|
| **v1.27** | Foundational Knowledge Packs — 35 packs across 3 tiers, GSD-OS dashboard, skill-creator observation pipeline (this release) |
| **v1.26** | Aminet Archive Extension Pack — INDEX parser, mirror engine, virus scanner, archive extraction, FS-UAE integration |
| **v1.25** | Ecosystem Integration — 20-node dependency DAG, EventDispatcher spec, 4-tier dependency philosophy, contract testing strategy, partial-build compatibility matrix |
| **v1.24** | GSD Conformance Audit — 336-checkpoint matrix, 4-tier audit, zero-fail conformance, 9,355 tests passing |
| **v1.23** | Project AMIGA — mission infrastructure (MC-1/ME-1/CE-1/GL-1), Apollo AGC simulator, DSKY interface, RFC Reference Skill |
| **v1.22** | Minecraft Knowledge World — local cloud infrastructure, Fabric server, platform portability, Amiga emulation, spatial curriculum |
| **v1.21** | GSD-OS Desktop Foundation — Tauri v2 shell, WebGL CRT engine, PTY terminal, Workbench desktop, calibration wizard |
| **v1.20** | Dashboard Assembly — unified CSS pipeline, four data collectors, console page as 6th generated page |
| **v1.19** | Budget Display Overhaul — `LoadingProjection`, dual-view display, configurable budgets, dashboard gauge |
| **v1.18** | Information Design System — shape + color encoding, status gantry, topology views, three-speed layering |
| **v1.17** | Staging Layer — analysis, scanning, resource planning, 7-state approval queue for parallel execution |
| **v1.16** | Dashboard Console & Milestone Ingestion |
| **v1.15** | Live Dashboard Terminal — Wetty integration, tmux session binding, unified launcher |
| **v1.14** | Promotion Pipeline |
| **v1.13** | Session Lifecycle & Workflow Coprocessor |
| **v1.12.1** | Live Metrics Dashboard |
| **v1.12** | GSD Planning Docs Dashboard |
| **v1.11** | GSD Integration Layer |
| **v1.10** | Security Hardening |
| **v1.9** | Ecosystem Alignment & Advanced Orchestration |
| **v1.8.1** | Audit Remediation (Patch) |
| **v1.8** | Capability-Aware Planning + Token Efficiency |
| **v1.7** | GSD Master Orchestration Agent |
| **v1.6** | Cross-Domain Examples |
| **v1.5** | Pattern Discovery |
| **v1.4** | Agent Teams |
| **v1.3** | Documentation Overhaul |
| **v1.2** | Test Infrastructure |
| **v1.1** | Semantic Conflict Detection |
| **v1.0** | Core Skill Management |
