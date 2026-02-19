# Component-Pair Compatibility Matrix

**Generated:** 2026-02-19
**Purpose:** Definitive compatibility matrix for the GSD ecosystem. Documents what happens when a developer builds only a subset of the 20-node ecosystem. Each of the 48 DAG edges has an entry describing behavior at absent, partial, and full maturity states of the target component.

**Source data:**
- Edge inventory: `.planning/specs/ecosystem-dependency-map/edge-inventory.md` (48 edges)
- Node inventory: `.planning/specs/ecosystem-dependency-map/node-inventory.md` (20 nodes)
- Known-issues cross-reference: `./known-issues-cross-reference.md` (8 groups, 99 items)

**Status scheme:** implemented | partial | aspirational | permanently-deferred | absent

---

## Table of Contents

1. [Summary Statistics](#summary-statistics)
2. [How to Read This Matrix](#how-to-read-this-matrix)
3. [Matrix Entries by Source Component](#matrix-entries-by-source-component)
   - [Core Layer](#core-layer)
     - [amiga-leverage](#amiga-leverage-1-outgoing-edge)
     - [info-design](#info-design-1-outgoing-edge)
   - [Middleware Layer](#middleware-layer)
     - [chipset](#chipset-3-outgoing-edges)
     - [staging](#staging-4-outgoing-edges)
     - [silicon](#silicon-2-outgoing-edges)
     - [gsd-isa](#gsd-isa-4-outgoing-edges)
   - [Platform Layer](#platform-layer)
     - [gsd-os](#gsd-os-8-outgoing-edges)
     - [dashboard-console](#dashboard-console-4-outgoing-edges)
     - [lcp](#lcp-4-outgoing-edges)
     - [amiga-workbench](#amiga-workbench-2-outgoing-edges)
   - [Educational Layer](#educational-layer)
     - [bbs-pack](#bbs-pack-4-outgoing-edges)
     - [creative-suite](#creative-suite-5-outgoing-edges)
     - [cloud-ops](#cloud-ops-5-outgoing-edges)
4. [Matrix Maintenance](#matrix-maintenance)

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Total edges in matrix | 48 |
| Actionable entries (full 3-state tables) | 37 |
| Documentation-only entries | 11 |
| Hard-blocks edges | 28 (58%) |
| Soft-enhances edges | 20 (42%) |

### Edges by Target Status

| Target Status | Actionable Edges | Documentation-Only Edges | Total |
|---------------|-----------------|-------------------------|-------|
| Implemented | 19 | 7 | 26 |
| Partial | 15 | 0 | 15 |
| Aspirational | 3 | 2 | 5 |
| Permanently deferred | 0 | 2 | 2 |

### Documentation-Only Entries

Edges involving external nodes (bootstrap, centos-guide, minecraft-world, space-between) or the permanently-deferred node (wetty-tmux) receive abbreviated entries. These targets are either reference documents (always available) or permanently superseded.

| Edge | Source | Target | Reason |
|------|--------|--------|--------|
| #21 | gsd-os | wetty-tmux | Target permanently deferred; native PTY supersedes |
| #22 | lcp | bootstrap | External reference document |
| #23 | lcp | centos-guide | External reference document |
| #24 | lcp | minecraft-world | External reference document |
| #30 | cloud-ops | bootstrap | External reference document |
| #32 | cloud-ops | centos-guide | External reference document |
| #33 | cloud-ops | creative-suite | Both source and target aspirational; no concrete interface yet |
| #34 | cloud-ops | space-between | External reference document |
| #38 | dashboard-console | wetty-tmux | Target permanently deferred; native PTY supersedes |
| #45 | gsd-isa | silicon | Both source and target aspirational; speculative interface |
| #48 | chipset | planning-docs | Soft-enhances; dashboard functions without chipset panel |

---

## How to Read This Matrix

Each **actionable entry** follows this format:

```
### Edge #N: {source} -> {target} ({edge_type})
**Interface:** {concrete interface from edge-inventory}
**Known-issues:** {classification from cross-reference, if applicable}

| Target State | Technical Behavior | User-Visible Signal | Resolution Action |
|---|---|---|---|
| absent | ... | ... | ... |
| partial | ... | ... | ... |
| full | Nominal operation | None | N/A |
```

**Severity heuristic:**
- **hard-blocks** edges: absent target = BROKEN (source cannot function at all)
- **soft-enhances** edges: absent target = DEGRADED (source works with reduced capability)

**Documentation-only entries** use a shortened format with a brief note explaining why full degradation analysis is not applicable.

---

## Matrix Entries by Source Component

### Core Layer

#### amiga-leverage (1 outgoing edge)

##### Edge #39: amiga-leverage -> skill-creator (soft-enhances)

**Interface:** SessionObserver pipeline as pattern detection; promotion pipeline concept (observe/detect/suggest/apply/learn/compose loop)
**Known-issues:** None -- skill-creator is implemented
**Version info:** skill-creator implemented since v1.0; amiga-leverage principles realized since v1.21

| Target State | Technical Behavior | User-Visible Signal | Resolution Action |
|---|---|---|---|
| **absent** | DEGRADED: Amiga-leverage design philosophy document stands alone as architectural reference. Loses the concrete skill-creator pipeline as its proof-of-implementation. The progressive capability pipeline (observe -> compose) exists as theory without a running exemplar. | Amiga-leverage document references "the six-step loop" but no system demonstrates it. Design reviews cannot cross-reference actual pipeline behavior. | Install skill-creator to provide the concrete implementation that validates the Amiga Principle's progressive capability pipeline. |
| **partial** | DEGRADED: Basic skill-creator features (observation, detection) validate core Amiga Principle. Advanced composition and co-activation analysis may not be available for full pipeline demonstration. | References to advanced promotion pipeline features may point to unimplemented capabilities. | Complete skill-creator installation for full pipeline demonstration. |
| **full** | Nominal operation. Skill-creator's 6-stage pipeline is the concrete realization of the Amiga Principle's progressive capability concept. | None -- design philosophy and implementation are fully aligned. | N/A |

---

#### info-design (1 outgoing edge)

##### Edge #47: info-design -> planning-docs (soft-enhances)

**Interface:** Dashboard HTML pages as the canvas for design principles; `.planning/docs/` output
**Known-issues:** Planning-docs has aspirational packaging (ASPIR, Group 7: Dashboard packaging, 3 items). Core functionality implemented.
**Version info:** planning-docs implemented v1.12; info-design system v1.18

| Target State | Technical Behavior | User-Visible Signal | Resolution Action |
|---|---|---|---|
| **absent** | DEGRADED: Info-design principles (subway map topology, highway gantry metaphor, typography hierarchy, color-as-identity) exist as design specification with no visual target to apply them to. Design tokens defined but not rendered. | Design system document references "the dashboard" but no dashboard exists to view. No visual validation of design choices. | Install planning-docs to provide the visual canvas where info-design principles are applied. |
| **partial** | DEGRADED: Basic dashboard renders HTML but may lack the full topology visualization, entity shapes, or gantry panels that fully express the design system. | Dashboard renders with basic styling; some design system features (subway map, gantry panel) may not be visually present. | Complete dashboard module installation (topology-renderer, entity-shapes, gantry-panel). |
| **full** | Nominal operation. Dashboard renders all design system elements: subway map, gantry panels, entity shapes, color-as-identity, typography hierarchy. | None -- design system fully expressed in dashboard. | N/A |

---

### Middleware Layer

#### chipset (3 outgoing edges)

##### Edge #1: chipset -> skill-creator (hard-blocks)

**Interface:** `.chipset/chipset.yaml` skills section; `token_budget_weight` field per skill; skill-creator's 6-stage pipeline (Score/Resolve/ModelFilter/CacheOrder/Budget/Load)
**Known-issues:** None -- skill-creator is implemented
**Version info:** skill-creator since v1.0; chipset since v1.11

| Target State | Technical Behavior | User-Visible Signal | Resolution Action |
|---|---|---|---|
| **absent** | BROKEN: Chipset cannot load, resolve, or configure skills. The `.chipset/chipset.yaml` `skills.required` and `skills.recommended` arrays reference skill-creator-managed skills that do not exist. Token budget pipeline has nothing to allocate. | CLI error when chipset attempts to read skill definitions. "skill-creator not found" or empty skill registry. Chipset configuration validates but produces zero-capability runtime. | Install skill-creator first. Chipset is architecturally meaningless without the skills it configures. |
| **partial** | DEGRADED: Basic skill loading works via skill-creator. Co-activation analysis, advanced composition, and full 6-stage pipeline budget optimization may not function. Chipset can configure skills but cannot optimize their interplay. | Warning: "advanced chipset features unavailable" when attempting co-activation or composition-based routing. Basic skill activation succeeds. | Complete skill-creator to full implementation for co-activation analysis and agent composition. |
| **full** | Nominal operation. Chipset configures all skills, agents, and topologies through skill-creator's complete pipeline. Token budgets respected. Agent composition operational. | None | N/A |

##### Edge #2: chipset -> skill-creator (hard-blocks)

**Interface:** Agent composition feature (`agents.topology`, `agents.router.routes`); co-activation analysis for chipset refinement
**Known-issues:** None -- skill-creator is implemented
**Version info:** Agent composition since v1.14; chipset since v1.11

| Target State | Technical Behavior | User-Visible Signal | Resolution Action |
|---|---|---|---|
| **absent** | BROKEN: Chipset agent topology section (`agents.topology`, `agents.router.routes`) references agent definitions created by skill-creator's composition engine. Without skill-creator, no agents exist to route or compose. | Chipset configuration references undefined agents. Topology routing produces empty dispatch table. | Install skill-creator. Agent composition is a skill-creator feature that chipset consumes. |
| **partial** | DEGRADED: Basic agent definitions exist but co-activation analysis may be unavailable. Chipset can route to known agents but cannot dynamically compose new specialist agents from co-activation patterns. | Agent routing works for pre-defined agents. "Co-activation analysis unavailable" when chipset attempts refinement. | Complete skill-creator for full co-activation and composition pipeline. |
| **full** | Nominal operation. Chipset dynamically incorporates composed agents, refines topology based on co-activation patterns. | None | N/A |

##### Edge #48: chipset -> planning-docs (documentation-only)

**Type:** soft-enhances
**Interface:** `.planning/docs/` dashboard gains chipset overview panel, agent activity panel, skill activation log, budget health display
**Note:** Documentation-only entry. Planning-docs dashboard functions fully without chipset-specific panels. Chipset adds observability panels when both are present, but this is an enhancement, not a requirement. Neither component's core function depends on this edge.

---

#### staging (4 outgoing edges)

##### Edge #5: staging -> skill-creator (hard-blocks)

**Interface:** SessionObserver observation pipeline; bounded learning constraints (3+ repetitions, 7-day cooldown, 20% change cap)
**Known-issues:** None -- skill-creator is implemented
**Version info:** skill-creator since v1.0; staging since v1.17

| Target State | Technical Behavior | User-Visible Signal | Resolution Action |
|---|---|---|---|
| **absent** | BROKEN: Staging's work analysis depends on skill-creator's SessionObserver for pattern detection. Without observation data, staging cannot assess resource requirements, estimate complexity, or plan pre-execution work decomposition. | Staging intake accepts uploads but cannot analyze them. "Pattern detection unavailable" during work analysis phase. Resource planning produces default estimates only. | Install skill-creator. Staging's analytical capabilities depend on skill-creator's observation pipeline. |
| **partial** | DEGRADED: Basic observation works. Advanced pattern detection (co-activation, composition suggestions) may not feed into staging's complexity estimation. | Work analysis provides basic estimates. Warning when advanced pattern metrics are unavailable. | Complete skill-creator for full observation pipeline depth. |
| **full** | Nominal operation. Staging leverages full SessionObserver data for work analysis, resource planning, and complexity estimation. | None | N/A |

##### Edge #6: staging -> chipset (soft-enhances)

**Interface:** `.chipset/chipset.yaml` for available skills, agents, token budgets; chipset refinement recommendations
**Known-issues:** Chipset is partial (some features missing per node-inventory)
**Version info:** chipset since v1.11; staging since v1.17

| Target State | Technical Behavior | User-Visible Signal | Resolution Action |
|---|---|---|---|
| **absent** | DEGRADED: Staging's resource analysis phase cannot read the active chipset to understand available skills, agents, and token budgets. Staging still performs intake, security scanning, and basic work decomposition using default resource assumptions. | "Chipset configuration not found; using default resource estimates" during analysis phase. Work decomposition proceeds without chipset-aware optimization. | Install chipset for resource-aware work analysis. |
| **partial** | DEGRADED: Staging reads chipset configuration but may receive incomplete skill/agent inventories. Token budget estimates may be inaccurate if chipset lacks full ASIC library. | Work analysis reflects partially-configured chipset. Some resource estimates may be approximate. | Complete chipset configuration for accurate resource planning. |
| **full** | Nominal operation. Staging reads full chipset configuration for resource-aware work analysis and chipset refinement recommendations. | None | N/A |

##### Edge #7: staging -> dashboard-console (hard-blocks)

**Interface:** `.planning/console/inbox/`, `.planning/console/outbox/` filesystem message bus; `milestone-config.json`; staging queue panel renders in dashboard
**Known-issues:** Dashboard-console is partial (bidirectional control incomplete per node-inventory)
**Version info:** dashboard-console since v1.16; staging since v1.17

| Target State | Technical Behavior | User-Visible Signal | Resolution Action |
|---|---|---|---|
| **absent** | BROKEN: Staging layer's intake pipeline depends on dashboard-console's upload/configure flow. Without console, there is no filesystem message bus (`inbox/outbox/`), no milestone configuration, and no upload zone for content to enter the staging pipeline. | No staging intake possible. No upload mechanism, no configuration interface. Staging has no content to process. | Install dashboard-console. Staging's intake flow is console-driven. |
| **partial** | DEGRADED: Upload zone and basic message bus work. Bidirectional control (dashboard-to-session settings propagation) may be incomplete. Staging receives content but cannot push status updates back through console in real-time. | Upload and intake succeed. "Real-time status propagation unavailable" -- staging processes silently without console feedback. | Complete dashboard-console bidirectional control for full staging pipeline visibility. |
| **full** | Nominal operation. Full upload -> configure -> stage -> analyze pipeline with bidirectional status flow through console. | None | N/A |

##### Edge #8: staging -> silicon (soft-enhances)

**Interface:** Community adapter quarantine check; pre-quarantine hygiene step before adapter evaluation pipeline
**Known-issues:** Silicon is aspirational (ENVDEP, Group 2: Silicon/ML, 13 items). Deferred to v3.x.
**Version info:** Silicon aspirational; staging since v1.17

| Target State | Technical Behavior | User-Visible Signal | Resolution Action |
|---|---|---|---|
| **absent** | DEGRADED: Staging skips the community adapter quarantine step. Security scanning proceeds without ML adapter hygiene verification. Staging's core intake, analysis, and work decomposition function normally. | No adapter quarantine warnings. Staging operates without ML-specific security checks. This is the current production behavior. | Install silicon layer when GPU infrastructure is available (v3.x). |
| **partial** | DEGRADED: Partial silicon may provide basic adapter verification without full quarantine pipeline (training pair validation, VRAM budget checks). | "Limited adapter quarantine" messages during security scanning. | Complete silicon layer for full adapter quarantine pipeline. |
| **full** | Nominal operation. Community adapters pass through full hygiene check before entering adapter quarantine pipeline. | None | N/A |

---

#### silicon (2 outgoing edges)

##### Edge #3: silicon -> chipset (hard-blocks)

**Interface:** `silicon.yaml` extends `.chipset/chipset.yaml`; chipset intent classifier selects which LoRA to hot-swap
**Known-issues:** Silicon is aspirational (ENVDEP, Group 2). Chipset is partial.
**Version info:** Silicon aspirational (planned v3.x); chipset since v1.11

| Target State | Technical Behavior | User-Visible Signal | Resolution Action |
|---|---|---|---|
| **absent** | BROKEN: Silicon layer's configuration format (`silicon.yaml`) extends chipset's configuration schema. Without chipset, silicon has no base configuration format, no intent classifier for LoRA routing, and no topology for adapter placement. Silicon cannot define its adapter lifecycle. | Silicon configuration fails to validate: "chipset.yaml base schema not found." No LoRA routing possible. | Install chipset first. Silicon extends chipset's configuration architecture. |
| **partial** | DEGRADED: Basic chipset.yaml schema available. Silicon can define adapters and basic configuration but may not access full ASIC library for adapter-to-chipset binding or advanced routing patterns. | Silicon configuration loads with warnings about missing chipset features. Basic adapter definition works. | Complete chipset for full silicon integration (ASIC library, runtime validation). |
| **full** | Nominal operation. Silicon extends full chipset configuration. Intent classifier routes LoRA hot-swaps through chipset topology. | None | N/A |

##### Edge #4: silicon -> skill-creator (hard-blocks)

**Interface:** SessionObserver training pair extraction pipeline (`.chipset/training/pairs/*.jsonl`); pattern detection feeding adapter training
**Known-issues:** Silicon is aspirational (ENVDEP, Group 2). Skill-creator is implemented.
**Version info:** Skill-creator since v1.0; silicon aspirational (planned v3.x)

| Target State | Technical Behavior | User-Visible Signal | Resolution Action |
|---|---|---|---|
| **absent** | BROKEN: Silicon's training pair generation depends on skill-creator's SessionObserver capturing patterns. Without observation data, silicon has no training material for QLoRA fine-tuning. The parallel data path (observation -> training pairs) has no source. | Silicon training pipeline has zero input data. "No observation pipeline available for training pair extraction." | Install skill-creator. Silicon requires observation data to generate training pairs. |
| **partial** | DEGRADED: Basic SessionObserver captures sessions. Training pair extraction may be limited if advanced pattern detection (co-activation, composition) is not available to generate high-quality training pairs. | Training pairs generated from basic observation data. "Advanced pattern extraction unavailable" -- training quality may be reduced. | Complete skill-creator for higher-quality training pair generation. |
| **full** | Nominal operation. Full SessionObserver pipeline feeds training pair extraction. Co-activation patterns generate diverse training data. | None | N/A |

---

#### gsd-isa (4 outgoing edges)

##### Edge #42: gsd-isa -> chipset (hard-blocks)

**Interface:** `.chipset/chipset.yaml` schema as configuration layer; agent topology (bus architecture); token budget (bandwidth allocation)
**Known-issues:** GSD ISA is aspirational (ASPIR, Group 1: GSD ISA, 32 items). Deferred to v2.x.
**Version info:** Chipset since v1.11; gsd-isa aspirational (planned v2.x)

| Target State | Technical Behavior | User-Visible Signal | Resolution Action |
|---|---|---|---|
| **absent** | BROKEN: GSD ISA formalizes chipset's inter-agent communication into an instruction set. Without chipset, ISA has no bus architecture to formalize, no agent topology for its opcodes to target, and no token budget concept to map to bandwidth allocation. | ISA configuration references undefined chipset schema. "System bus undefined" -- opcodes have no target. | Install chipset. GSD ISA is a formalization layer over chipset's bus architecture. |
| **partial** | DEGRADED: Basic chipset agent topology and token budgets available. ISA can formalize core bus operations but may lack access to full ASIC library for advanced opcode definitions. | ISA operates on partial bus topology. Some advanced opcodes may be unbindable. | Complete chipset for full ISA-to-bus binding. |
| **full** | Nominal operation. ISA fully formalizes chipset's bus architecture into instruction set operations. | None | N/A |

##### Edge #43: gsd-isa -> skill-creator (hard-blocks)

**Interface:** SessionObserver pipeline as observation pipeline (PUSH/POP opcodes); skill loading (LOAD SK opcode); agent composition
**Known-issues:** GSD ISA is aspirational (ASPIR, Group 1). Skill-creator is implemented.
**Version info:** Skill-creator since v1.0; gsd-isa aspirational (planned v2.x)

| Target State | Technical Behavior | User-Visible Signal | Resolution Action |
|---|---|---|---|
| **absent** | BROKEN: ISA registers map to skill-creator concepts (SK = active skill register, SP = observation pipeline depth). Without skill-creator, ISA opcodes like LOAD SK, PUSH/POP observation stack have no operational target. The instruction set references concepts that do not exist. | ISA register definitions reference undefined skill-creator subsystems. Opcodes produce no-ops. | Install skill-creator. ISA opcodes target skill-creator's pipeline. |
| **partial** | DEGRADED: Basic skill loading and observation work. ISA can execute LOAD SK and basic PUSH/POP operations but advanced agent composition opcodes may not have full targets. | Basic ISA operations execute. Advanced composition opcodes produce warnings. | Complete skill-creator for full opcode target coverage. |
| **full** | Nominal operation. All ISA opcodes have operational targets in skill-creator's pipeline. | None | N/A |

##### Edge #44: gsd-isa -> amiga-leverage (hard-blocks)

**Interface:** Amiga Hardware Reference Manual as design model; custom chipset (Agnus/Denise/Paula) as architectural template; DMA channel concept
**Known-issues:** GSD ISA is aspirational (ASPIR, Group 1). Amiga-leverage is implemented.
**Version info:** Amiga-leverage since v1.21; gsd-isa aspirational (planned v2.x)

| Target State | Technical Behavior | User-Visible Signal | Resolution Action |
|---|---|---|---|
| **absent** | BROKEN: ISA is explicitly modeled after the Amiga Hardware Reference Manual. Without amiga-leverage's architectural principles, ISA loses its design foundation -- the custom chipset metaphor (Agnus/Denise/Paula mapping), DMA channel concept, and coprocessor architecture pattern that give the ISA its coherence. | ISA design document references an undefined architectural philosophy. Hardware metaphor has no source material. | Install amiga-leverage. ISA's design coherence depends on the Amiga Principle. |
| **partial** | Nominal operation (amiga-leverage is a design philosophy document -- it is either present or absent, not partial). | N/A | N/A |
| **full** | Nominal operation. ISA design is grounded in Amiga Hardware Reference Manual principles. | None | N/A |

##### Edge #45: gsd-isa -> silicon (documentation-only)

**Type:** soft-enhances
**Interface:** Local inference via LoRA adapters as "custom chips" executing ISA instructions; VRAM budget as "bandwidth allocation"
**Note:** Documentation-only entry. Both GSD ISA and silicon are aspirational. This edge represents a speculative interface where ISA instructions would target silicon's inference pipeline. Neither component exists in implementation, so degradation analysis is premature. When both are built, ISA would use silicon as its "hardware execution target," making the hardware metaphor literal. Classified ASPIR (gsd-isa, Group 1) and ENVDEP (silicon, Group 2).

---

### Platform Layer

#### gsd-os (8 outgoing edges)

##### Edge #14: gsd-os -> amiga-leverage (hard-blocks)

**Interface:** Progressive depth principle (Levels 1-4); Amiga Hardware Reference Manual design philosophy; DMA/coprocessor architecture pattern
**Known-issues:** None -- amiga-leverage is implemented
**Version info:** Amiga-leverage principles since v1.21; gsd-os since v1.21

| Target State | Technical Behavior | User-Visible Signal | Resolution Action |
|---|---|---|---|
| **absent** | BROKEN: GSD-OS's entire design philosophy derives from the Amiga Principle. Without amiga-leverage, the progressive depth model (Levels 1-4), DMA/coprocessor metaphor, and desktop shell architecture lose their design foundation. Components can still render but lack coherent design rationale. | Desktop application lacks design coherence. Progressive depth levels have no architectural justification. UI patterns are arbitrary rather than principled. | Install amiga-leverage design philosophy. GSD-OS is architecturally grounded in this document. |
| **partial** | Nominal operation (amiga-leverage is a design philosophy -- present or absent, not partial). | N/A | N/A |
| **full** | Nominal operation. GSD-OS design is coherent with Amiga Principle throughout. | None | N/A |

##### Edge #15: gsd-os -> chipset (hard-blocks)

**Interface:** `.chipset/chipset.yaml` consumed at new-project, plan-phase, execute-phase, verify-work; agent topology activation; file-change triggers
**Known-issues:** Chipset is partial (missing full ASIC library, runtime validation)
**Version info:** Chipset since v1.11; gsd-os since v1.21

| Target State | Technical Behavior | User-Visible Signal | Resolution Action |
|---|---|---|---|
| **absent** | BROKEN: GSD-OS consumes chipset configuration at every GSD lifecycle stage (new-project, plan-phase, execute-phase, verify-work). Without chipset, the desktop application has no skill/agent configuration, no topology for routing work, and no file-change triggers for automation. GSD workflow operates in unconfigured mode. | GSD commands execute without chipset-aware optimization. "No chipset configuration found" warnings at each lifecycle stage. Agent routing uses fallback default behavior. | Install chipset. GSD-OS relies on chipset for workflow orchestration. |
| **partial** | DEGRADED: Basic chipset configuration loads. Core skill/agent routing works. Advanced features (full ASIC library, runtime chipset validation, community chipset registry) unavailable. File-change triggers may be incomplete. | Some GSD lifecycle stages show "partial chipset" warnings. Advanced routing patterns unavailable. Basic workflow functions. | Complete chipset for full lifecycle integration. |
| **full** | Nominal operation. Chipset governs all GSD-OS workflow stages with full topology, triggers, and routing. | None | N/A |

##### Edge #16: gsd-os -> skill-creator (hard-blocks)

**Interface:** Skill loading pipeline; SessionObserver for pattern capture; agent composition (`/.claude/agents/`); GSD Orchestrator 5-stage classification
**Known-issues:** None -- skill-creator is implemented
**Version info:** Skill-creator since v1.0; gsd-os since v1.21

| Target State | Technical Behavior | User-Visible Signal | Resolution Action |
|---|---|---|---|
| **absent** | BROKEN: GSD-OS is the desktop shell built on top of skill-creator's learning/evolution layer. Without skill-creator: no skill loading pipeline, no SessionObserver for pattern capture, no agent composition, no GSD Orchestrator for natural language routing. The desktop application becomes a static shell with no adaptive capabilities. | Desktop application launches but has zero learning capability. No skills loaded, no agents available, no pattern detection. GSD commands fail: "skill-creator not available." | Install skill-creator. It is the core engine that GSD-OS presents through its desktop interface. |
| **partial** | DEGRADED: Basic skill loading and observation work. Agent composition and 5-stage GSD Orchestrator classification may have reduced accuracy or coverage. Pattern capture works for basic patterns. | GSD commands work with basic skill set. "Advanced orchestration features limited" warnings. Some natural language routing may fall back to exact match only. | Complete skill-creator for full adaptive desktop experience. |
| **full** | Nominal operation. Full learning pipeline, agent composition, and orchestrator running within desktop shell. | None | N/A |

##### Edge #17: gsd-os -> staging (soft-enhances)

**Interface:** `.planning/staging/inbox/` intake pipeline; work analysis before execution; security hygiene for uploaded content
**Known-issues:** Staging is partial (missing full security scanning, team formation)
**Version info:** Staging since v1.17; gsd-os since v1.21

| Target State | Technical Behavior | User-Visible Signal | Resolution Action |
|---|---|---|---|
| **absent** | DEGRADED: GSD-OS skips pre-execution work analysis and security scanning. Users can still create projects, plan phases, execute work, and verify results -- staging adds an analysis layer before execution, not a required gate. | No "staging analysis" step before execution. Work begins immediately without complexity estimation or security review. This is the current production behavior for most workflows. | Install staging for pre-execution analysis and security hygiene. |
| **partial** | DEGRADED: Basic intake and analysis work. Full security scanning pipeline and team formation automation unavailable. | Staging analysis runs with basic checks. "Full security scanning unavailable" during intake. | Complete staging for comprehensive pre-execution analysis. |
| **full** | Nominal operation. Full work analysis, security scanning, and team formation before execution. | None | N/A |

##### Edge #18: gsd-os -> dashboard-console (soft-enhances)

**Interface:** `.planning/console/` bidirectional message bus; dashboard renders inside GSD-OS application; chipset status panel
**Known-issues:** Dashboard-console is partial (bidirectional control incomplete)
**Version info:** Dashboard-console since v1.16; gsd-os since v1.21

| Target State | Technical Behavior | User-Visible Signal | Resolution Action |
|---|---|---|---|
| **absent** | DEGRADED: GSD-OS operates without a cockpit view. No in-app dashboard for milestone status, session interaction, or chipset monitoring. Desktop application functions as a terminal/editor environment without observability panels. | No console panels in desktop application. Project status requires CLI commands or direct file inspection. | Install dashboard-console for in-app observability and control. |
| **partial** | DEGRADED: Basic console panels render. Upload zone and session display work. Real-time bidirectional control (dashboard-to-session settings) incomplete. | Console panels visible but some controls non-functional. "Settings propagation unavailable" for real-time configuration. | Complete dashboard-console for full bidirectional control. |
| **full** | Nominal operation. Full cockpit view with bidirectional console, chipset status, session interaction. | None | N/A |

##### Edge #19: gsd-os -> planning-docs (soft-enhances)

**Interface:** `.planning/docs/` HTML output; JSON-LD structured data; auto-refresh mechanism; dashboard embedded in application
**Known-issues:** Planning-docs is implemented; packaging as GSD skill is aspirational (ASPIR, Group 7, 3 items)
**Version info:** Planning-docs since v1.12; gsd-os since v1.21

| Target State | Technical Behavior | User-Visible Signal | Resolution Action |
|---|---|---|---|
| **absent** | DEGRADED: GSD-OS operates without the embedded planning docs dashboard. No HTML visualization of project state, no structured data overlays, no auto-refresh of planning artifacts. Users access `.planning/` files directly via editor/terminal. | No dashboard tab in desktop application. Planning state viewed through raw markdown files. | Install planning-docs for visual project observability within GSD-OS. |
| **partial** | DEGRADED: Basic HTML dashboard renders. Some modules (topology visualization, gantry panels, activity feeds) may be missing. | Dashboard shows basic project structure. Advanced visualizations may be absent. | Complete all planning-docs dashboard modules. |
| **full** | Nominal operation. Full embedded dashboard with auto-refresh, structured data, and all visualization modules. | None | N/A |

##### Edge #20: gsd-os -> info-design (hard-blocks)

**Interface:** Subway map topology visualization; highway numbering convention for agents/skills; typography system (tabular numerals, weight hierarchy); color-as-identity system
**Known-issues:** None -- info-design is implemented
**Version info:** Info-design since v1.18; gsd-os since v1.21

| Target State | Technical Behavior | User-Visible Signal | Resolution Action |
|---|---|---|---|
| **absent** | BROKEN: GSD-OS's visual presentation depends entirely on info-design's design system. Without it: no subway map topology, no highway gantry metaphor, no typography hierarchy, no color-as-identity system. The desktop application renders with default/unstyled UI. | Desktop application has inconsistent or unstyled visuals. No topology map, no gantry panels. UI elements use browser/system defaults. | Install info-design. GSD-OS visual coherence depends on this design system. |
| **partial** | Nominal operation (info-design is a design system specification -- present or absent, not partial in current implementation). | N/A | N/A |
| **full** | Nominal operation. All visual elements follow info-design principles: subway map, gantry, typography, color-as-identity. | None | N/A |

##### Edge #21: gsd-os -> wetty-tmux (documentation-only)

**Type:** soft-enhances
**Interface:** Terminal-in-browser pattern via Wetty/SSH/tmux; architecture subsequently superseded by native Tauri PTY
**Known-issues:** Permanently deferred (PERM, Group 4: Wetty divergence, 9 items). Architectural divergence is permanent and intentional.
**Note:** GSD-OS originally referenced Wetty for browser-based terminal access. The Tauri desktop architecture made native PTY the correct choice. GSD-OS functions fully with `src-tauri/src/pty/` and `desktop/src/terminal/`. This edge represents historical architectural influence only. No degradation occurs because the replacement (native PTY) is superior for the desktop use case.

---

#### planning-docs (1 outgoing edge)

##### Edge #46: planning-docs -> skill-creator (soft-enhances)

**Interface:** GSD workflow trigger points (on plan-phase, execute-phase, verify-work, complete-milestone); skill metadata.yaml format
**Known-issues:** Planning-docs has aspirational packaging (ASPIR, Group 7: Dashboard packaging, 3 items). Skill-creator is implemented.
**Version info:** Planning-docs since v1.12; skill-creator since v1.0

| Target State | Technical Behavior | User-Visible Signal | Resolution Action |
|---|---|---|---|
| **absent** | DEGRADED: Planning-docs dashboard operates as a standalone TypeScript module. Without skill-creator, it loses GSD workflow integration (trigger points on plan-phase, execute-phase, verify-work, complete-milestone). Dashboard still generates HTML from `.planning/` files but does not participate in the skill ecosystem. No observation pipeline captures dashboard generation patterns. | Dashboard generates HTML normally. No skill-based workflow automation. Dashboard regeneration must be triggered manually or via direct script invocation rather than GSD event hooks. | Install skill-creator for GSD workflow integration and skill-based automation triggers. |
| **partial** | DEGRADED: Basic skill-creator provides workflow hooks. Advanced skill packaging (metadata.yaml, SKILL.md) for the dashboard generator may not be available. Dashboard functions but may not be discoverable as a GSD skill. | Dashboard generates HTML with basic GSD workflow hooks. "Dashboard generator not packaged as skill" -- manual invocation still required for advanced scenarios. | Complete skill-creator for full skill packaging support. |
| **full** | Nominal operation. Dashboard generator integrates with GSD workflow as a proper skill with metadata, trigger points, and observation pipeline participation. | None | N/A |

---

#### dashboard-console (4 outgoing edges)

##### Edge #35: dashboard-console -> planning-docs (hard-blocks)

**Interface:** `.planning/docs/` HTML output as base layer; auto-refresh mechanism; JSON-LD structured data; generator script architecture
**Known-issues:** Planning-docs is implemented; packaging as GSD skill is aspirational (ASPIR, Group 7, 3 items)
**Version info:** Planning-docs since v1.12; dashboard-console since v1.16

| Target State | Technical Behavior | User-Visible Signal | Resolution Action |
|---|---|---|---|
| **absent** | BROKEN: Dashboard-console extends the read-only planning-docs dashboard into bidirectional control. Without the base dashboard, there is no HTML layer to extend, no generator script to hook into, no structured data to augment. Console has nothing to add controls to. | Dashboard-console components have no rendering target. "Base dashboard not found" error. Console UI elements cannot render. | Install planning-docs first. Dashboard-console extends, not replaces, the base dashboard. |
| **partial** | DEGRADED: Basic HTML dashboard exists. Console adds bidirectional controls to whatever dashboard modules are available. Some console features may reference dashboard modules that are not yet installed. | Console panels render on available dashboard pages. Some control targets may be missing. "Dashboard module not found" for specific panels. | Complete all planning-docs modules for full console coverage. |
| **full** | Nominal operation. Console extends complete dashboard with full bidirectional control surface. | None | N/A |

##### Edge #36: dashboard-console -> chipset (soft-enhances)

**Interface:** `.chipset/chipset.yaml` status display; chipset overview panel in dashboard; agent activity visualization
**Known-issues:** Chipset is partial (missing full ASIC library, runtime validation)
**Version info:** Chipset since v1.11; dashboard-console since v1.16

| Target State | Technical Behavior | User-Visible Signal | Resolution Action |
|---|---|---|---|
| **absent** | DEGRADED: Dashboard-console functions without chipset status display. No chipset overview panel, no agent activity visualization, no budget health display. All other console features (upload, configure, session, staging queue) work normally. | Chipset-related panels are empty or hidden. "Chipset not configured" placeholder in dashboard. Other console panels function normally. | Install chipset for dashboard chipset monitoring. |
| **partial** | DEGRADED: Chipset overview panel shows partial configuration. Some agent activity data may be incomplete. Budget health display may show approximate values. | Chipset panels render with "partial configuration" indicators. | Complete chipset for full monitoring data. |
| **full** | Nominal operation. Full chipset overview, agent activity, skill activation log, and budget health display. | None | N/A |

##### Edge #37: dashboard-console -> info-design (hard-blocks)

**Interface:** Subway map topology; highway gantry metaphor for dispatch center; color-as-identity system; typography hierarchy
**Known-issues:** None -- info-design is implemented
**Version info:** Info-design since v1.18; dashboard-console since v1.16

| Target State | Technical Behavior | User-Visible Signal | Resolution Action |
|---|---|---|---|
| **absent** | BROKEN: Dashboard-console's visual language depends on info-design. The "dispatch center" metaphor (highway gantry for status, subway map for topology) has no design system to implement. Console renders with default/unstyled controls. | Console UI has inconsistent styling. No gantry metaphor, no subway topology, no color-as-identity. Controls render but lack visual coherence. | Install info-design. Console visual language depends on the design system. |
| **partial** | Nominal operation (info-design is a specification -- present or absent). | N/A | N/A |
| **full** | Nominal operation. Console renders with full design system: gantry dispatch center, subway topology, proper typography and color. | None | N/A |

##### Edge #38: dashboard-console -> wetty-tmux (documentation-only)

**Type:** soft-enhances
**Interface:** Browser-based terminal embedding via iframe; SSH session access pattern
**Known-issues:** Permanently deferred (PERM, Group 4: Wetty divergence, 9 items).
**Note:** Dashboard-console originally envisioned embedding Wetty terminal via iframe. Native PTY through Tauri superseded this approach. Dashboard-console functions fully with the native terminal integration in `desktop/src/terminal/`. No degradation occurs.

---

#### lcp (4 outgoing edges)

##### Edge #22: lcp -> bootstrap (documentation-only)

**Type:** hard-blocks
**Interface:** GSD Bootstrap Steps 1-8 as prerequisite; development environment setup; Git configuration; SSH key generation
**Note:** Documentation-only entry. Bootstrap is an external reference document that is always available. "Absent" means the developer has not followed the bootstrap guide, which is a human process issue, not a software dependency. LCP's `render-pxe-menu.sh` and provisioning scripts assume a bootstrapped environment (Git, SSH keys, basic tools). If bootstrap steps were not followed, LCP scripts will fail on missing tools, not on missing software components.

##### Edge #23: lcp -> centos-guide (documentation-only)

**Type:** hard-blocks
**Interface:** CentOS Stream 9 infrastructure guide; VM configuration patterns; network topology reference; firewalld/SELinux setup
**Note:** Documentation-only entry. The CentOS guide is an external reference document. "Absent" means the infrastructure it describes (CentOS VMs, networking) has not been set up. LCP provisions VMs according to this guide's patterns. Without the infrastructure, LCP has nothing to provision.

##### Edge #24: lcp -> minecraft-world (documentation-only)

**Type:** soft-enhances
**Interface:** Minecraft server deployment as proof-of-concept workload; `render-pxe-menu.sh` provisioning pattern; server.properties templating
**Note:** Documentation-only entry. Minecraft-world is an external workload that validates LCP's provisioning pipeline. LCP functions fully without it -- Minecraft is one of many potential workloads. Shipped in v1.22.

##### Edge #25: lcp -> chipset (soft-enhances)

**Interface:** `.chipset/chipset.yaml` for infrastructure project archetype; skill loading for provisioning workflows
**Known-issues:** Chipset is partial; LCP has aspirational features (ASPIR, Group 5: LCP templates, 12 items)
**Version info:** Chipset since v1.11; LCP partial since v1.22

| Target State | Technical Behavior | User-Visible Signal | Resolution Action |
|---|---|---|---|
| **absent** | DEGRADED: LCP operates with raw GSD workflow without chipset-aware project configuration. Provisioning scripts, PXE boot, and VM management work without chipset-provided skill loading or infrastructure project archetypes. | "No chipset configuration" during project setup. LCP uses default GSD workflow without infrastructure-specific skill optimization. This is the current production behavior. | Install chipset for infrastructure-aware project configuration. |
| **partial** | DEGRADED: Basic chipset configuration available. Infrastructure project archetype may be incomplete. | LCP reads partial chipset config. Some infrastructure-specific skills may be missing. | Complete chipset for full infrastructure project archetype. |
| **full** | Nominal operation. Chipset provides infrastructure project archetype with optimized skill loading for provisioning workflows. | None | N/A |

---

#### amiga-workbench (2 outgoing edges)

##### Edge #40: amiga-workbench -> amiga-leverage (hard-blocks)

**Interface:** Amiga I/O philosophy (ports as first-class citizens); Hardware Reference Manual transparency principle; progressive depth (Levels 1-4)
**Known-issues:** Amiga-workbench has environment-dependent features (ENVDEP, Group 3: Hardware Workbench, 13 items). Amiga-leverage is implemented.
**Version info:** Amiga-leverage since v1.21; amiga-workbench partial since v1.21

| Target State | Technical Behavior | User-Visible Signal | Resolution Action |
|---|---|---|---|
| **absent** | BROKEN: Amiga-workbench's entire document builds on the Amiga Principle. Without amiga-leverage, the hardware I/O philosophy (ports as first-class, transparency principle) has no foundation. The Workbench UI can render windows and icons but the hardware integration design is ungrounded. | Workbench UI renders basic windows/taskbar but hardware I/O design has no philosophical basis. "Design principles" section references undefined source material. | Install amiga-leverage. Workbench I/O philosophy derives from this document. |
| **partial** | Nominal operation (amiga-leverage is a design philosophy -- present or absent). | N/A | N/A |
| **full** | Nominal operation. Workbench I/O design is coherent with Amiga Hardware Reference Manual principles. | None | N/A |

##### Edge #41: amiga-workbench -> gsd-os (hard-blocks)

**Interface:** GSD-OS Tauri desktop shell as host platform; WebGL rendering engine; window manager (`desktop/src/wm/`); Workbench UI layer
**Known-issues:** GSD-OS is partial (missing block-based interaction, educational curriculum integration)
**Version info:** GSD-OS since v1.21; amiga-workbench partial since v1.21

| Target State | Technical Behavior | User-Visible Signal | Resolution Action |
|---|---|---|---|
| **absent** | BROKEN: Amiga-workbench is the physical-digital integration layer of GSD-OS. Without the desktop shell, there is no Tauri application, no WebGL rendering engine, no window manager for Workbench to render within. Hardware I/O has no host environment. | Workbench cannot launch. No desktop shell to render within. | Install gsd-os. Workbench is a layer within the desktop application. |
| **partial** | DEGRADED: Desktop shell exists with basic window manager, taskbar, and rendering engine. Block-based interaction model and educational curriculum framework may be incomplete. Workbench UI renders but advanced interaction patterns may be unavailable. | Workbench windows render in desktop shell. Some interaction patterns limited. | Complete gsd-os for full Workbench integration. |
| **full** | Nominal operation. Workbench renders within complete desktop shell with full WebGL, window manager, and interaction model. | None | N/A |

---

### Educational Layer

#### bbs-pack (4 outgoing edges)

##### Edge #26: bbs-pack -> skill-creator (hard-blocks)

**Interface:** Educational module format as skill-creator pack; observation/skill/knowledge pipeline as pedagogical framework
**Known-issues:** BBS-pack is aspirational. Skill-creator is implemented.
**Version info:** Skill-creator since v1.0; bbs-pack aspirational (planned v3.x)

| Target State | Technical Behavior | User-Visible Signal | Resolution Action |
|---|---|---|---|
| **absent** | BROKEN: BBS-pack ships as a skill-creator educational module. Without skill-creator, the module format does not exist, the observation/skill/knowledge pipeline that serves as the pedagogical framework is unavailable. BBS content has no delivery mechanism. | BBS educational content cannot load. "Skill-creator module format not available." | Install skill-creator. BBS-pack is packaged as a skill-creator module. |
| **partial** | DEGRADED: Basic skill-creator module loading works. Advanced observation and composition features that enrich the pedagogical experience may be limited. | BBS content loads as basic module. Advanced pedagogical features (pattern-based learning path adaptation) unavailable. | Complete skill-creator for adaptive learning experience. |
| **full** | Nominal operation. BBS-pack leverages full skill-creator pipeline for adaptive educational experience. | None | N/A |

##### Edge #27: bbs-pack -> chipset (soft-enhances)

**Interface:** `.chipset/chipset.yaml` for BBS educational chipset; skill groupings for door games and networking labs
**Known-issues:** BBS-pack is aspirational. Chipset is partial.
**Version info:** Chipset since v1.11; bbs-pack aspirational (planned v3.x)

| Target State | Technical Behavior | User-Visible Signal | Resolution Action |
|---|---|---|---|
| **absent** | DEGRADED: BBS content is standalone educational material. Without chipset, BBS-pack lacks chipset-defined skill groupings for door games and networking labs but content itself remains accessible. | BBS educational content loads without chipset-specific skill optimization. Door games and networking labs use default configuration. | Install chipset for BBS-specific skill optimization. |
| **partial** | DEGRADED: Basic chipset config available. BBS educational chipset definition may be incomplete. | BBS-pack reads partial chipset. Some educational skill groupings may be missing. | Complete chipset for full BBS educational chipset. |
| **full** | Nominal operation. Chipset provides optimized BBS educational chipset with door game and networking lab skill groupings. | None | N/A |

##### Edge #28: bbs-pack -> amiga-leverage (hard-blocks)

**Interface:** Amiga Principle (architectural leverage over raw power); progressive capability pipeline; shareware/demo scene community model
**Known-issues:** BBS-pack is aspirational. Amiga-leverage is implemented.
**Version info:** Amiga-leverage since v1.21; bbs-pack aspirational (planned v3.x)

| Target State | Technical Behavior | User-Visible Signal | Resolution Action |
|---|---|---|---|
| **absent** | BROKEN: BBS-pack embodies the Amiga Principle -- the BBS era exemplifies "architectural leverage over raw power." Without amiga-leverage, the pedagogical framework (shareware distribution, demo scene creativity, community model) loses its design rationale. Content can exist but lacks coherent educational philosophy. | BBS curriculum references undefined Amiga Principle. Educational narrative about leverage vs. power has no foundation. | Install amiga-leverage. BBS-pack's educational philosophy is grounded in this document. |
| **partial** | Nominal operation (amiga-leverage is a design philosophy -- present or absent). | N/A | N/A |
| **full** | Nominal operation. BBS educational content is grounded in Amiga Principle. | None | N/A |

##### Edge #29: bbs-pack -> gsd-os (hard-blocks)

**Interface:** GSD-OS desktop shell as host environment; terminal interface for BBS rendering; xterm-compatible terminal emulation
**Known-issues:** BBS-pack is aspirational. GSD-OS is partial.
**Version info:** GSD-OS since v1.21; bbs-pack aspirational (planned v3.x)

| Target State | Technical Behavior | User-Visible Signal | Resolution Action |
|---|---|---|---|
| **absent** | BROKEN: BBS-pack launches within GSD-OS desktop shell. Without the desktop application, there is no terminal interface, no xterm-compatible emulation, no host environment for the BBS experience. | BBS educational pack cannot launch. No host platform for terminal-based BBS rendering. | Install gsd-os. BBS-pack requires the desktop shell as its host platform. |
| **partial** | DEGRADED: Desktop shell exists with terminal (xterm.js) and window manager. BBS rendering works for text-based content. Block-based interaction model and advanced curriculum framework may be incomplete. | BBS terminal interface renders. Some interactive features may be limited by incomplete desktop platform. | Complete gsd-os for full BBS experience. |
| **full** | Nominal operation. BBS launches within fully-featured desktop shell with complete terminal and interaction model. | None | N/A |

---

#### creative-suite (5 outgoing edges)

##### Edge #9: creative-suite -> amiga-leverage (hard-blocks)

**Interface:** Progressive capability pipeline (Level 1-4: BASIC/C/Assembly/Hardware); promotion pipeline architecture (observe/detect/suggest/apply/learn/compose)
**Known-issues:** Creative-suite is aspirational. Amiga-leverage is implemented.
**Version info:** Amiga-leverage since v1.21; creative-suite aspirational

| Target State | Technical Behavior | User-Visible Signal | Resolution Action |
|---|---|---|---|
| **absent** | BROKEN: Creative-suite's curriculum follows the progressive depth principle from amiga-leverage. Without it, the 4-level learning path (BASIC -> C -> Assembly -> Hardware) has no architectural justification. The 8 applications lose their coherent progression model. | Creative-suite curriculum references undefined progressive depth principle. Applications are disconnected rather than forming a learning path. | Install amiga-leverage. Creative-suite's learning path derives from this design philosophy. |
| **partial** | Nominal operation (design philosophy -- present or absent). | N/A | N/A |
| **full** | Nominal operation. Creative-suite curriculum follows coherent progressive depth principle. | None | N/A |

##### Edge #10: creative-suite -> gsd-os (hard-blocks)

**Interface:** GSD-OS desktop shell as host platform; WebGL rendering engine; block-based interaction model; educational curriculum framework (Levels 1-4)
**Known-issues:** Creative-suite is aspirational. GSD-OS is partial.
**Version info:** GSD-OS since v1.21; creative-suite aspirational

| Target State | Technical Behavior | User-Visible Signal | Resolution Action |
|---|---|---|---|
| **absent** | BROKEN: All 8 creative-suite applications run within GSD-OS. Without the desktop shell, there is no WebGL engine, no block-based interaction, no curriculum framework. Applications have no host environment. | Creative-suite applications cannot launch. No platform to run 8 educational applications. | Install gsd-os. Creative-suite runs within the desktop shell. |
| **partial** | DEGRADED: Desktop shell provides basic rendering and terminal. WebGL CRT shader engine works. Block-based interaction model and educational curriculum framework may be incomplete, limiting some creative-suite interactive features. | Applications launch in desktop shell. Some interactive features limited. | Complete gsd-os for full creative-suite experience. |
| **full** | Nominal operation. All 8 applications run within fully-featured desktop shell. | None | N/A |

##### Edge #11: creative-suite -> chipset (soft-enhances)

**Interface:** `.chipset/chipset.yaml` for educational chipset definitions; skill loading per application pack
**Known-issues:** Creative-suite is aspirational. Chipset is partial.
**Version info:** Chipset since v1.11; creative-suite aspirational

| Target State | Technical Behavior | User-Visible Signal | Resolution Action |
|---|---|---|---|
| **absent** | DEGRADED: Creative-suite applications function without chipset-specific configuration. Skill loading uses default patterns instead of per-application chipset definitions. | Applications load with default skill configuration. "No educational chipset found" -- using defaults. | Install chipset for per-application skill optimization. |
| **partial** | DEGRADED: Basic chipset configuration available. Per-application educational chipsets may be incomplete. | Applications read partial chipset. Some application-specific skill groupings missing. | Complete chipset for full educational chipset definitions. |
| **full** | Nominal operation. Each creative-suite application has chipset-defined skill groupings and configurations. | None | N/A |

##### Edge #12: creative-suite -> silicon (soft-enhances)

**Interface:** Silicon layer's LoRA adapters for "The AI Workshop" (Pack 8); local inference demonstration
**Known-issues:** Silicon is aspirational (ENVDEP, Group 2). Creative-suite is aspirational.
**Version info:** Both aspirational

| Target State | Technical Behavior | User-Visible Signal | Resolution Action |
|---|---|---|---|
| **absent** | DEGRADED: Creative-suite's AI Workshop (Pack 8) loses its hands-on ML component. The educational content about neural networks exists but cannot demonstrate local inference. Other 7 packs function normally. | AI Workshop Pack 8 operates in "theory-only" mode. "Silicon layer unavailable -- ML demonstrations use simulated output." Other packs unaffected. | Install silicon layer when GPU infrastructure available (v3.x). |
| **partial** | DEGRADED: Basic ML demonstrations available. Full adapter lifecycle demonstration (training, hot-swap, routing) may be limited. | AI Workshop shows partial ML capabilities. Some demonstrations use simulated output. | Complete silicon for full ML demonstration capability. |
| **full** | Nominal operation. AI Workshop Pack 8 demonstrates live local inference, adapter training, and LoRA hot-swapping. | None | N/A |

##### Edge #13: creative-suite -> bbs-pack (hard-blocks)

**Interface:** BBS & Internet educational pack (Pack 2: "The Network") as prerequisite curriculum; modem simulator shared component
**Known-issues:** Both creative-suite and bbs-pack are aspirational.
**Version info:** Both aspirational (planned v3.x)

| Target State | Technical Behavior | User-Visible Signal | Resolution Action |
|---|---|---|---|
| **absent** | BROKEN: Creative-suite's learning path requires BBS-pack as Pack 2 ("The Network") in the sequence. Without it, the curriculum has a gap between Pack 1 (System Guide) and Pack 3. The modem simulator shared component is unavailable. | Creative-suite curriculum shows "Pack 2: The Network -- not available." Learning path has a gap. Modem simulator references fail. | Install bbs-pack. Pack 2 is a prerequisite in the learning sequence. |
| **partial** | DEGRADED: BBS-pack partially available. Some Pack 2 content accessible. Full modem simulator and networking labs may be incomplete. | Pack 2 partially available. Some lessons skip networking exercises. | Complete bbs-pack for full Pack 2 curriculum. |
| **full** | Nominal operation. Full learning path from Pack 1 through Pack 8 with complete networking curriculum. | None | N/A |

---

#### cloud-ops (5 outgoing edges)

##### Edge #30: cloud-ops -> bootstrap (documentation-only)

**Type:** hard-blocks
**Interface:** GSD Bootstrap as prerequisite for environment setup; development tools and configuration
**Note:** Documentation-only entry. Bootstrap is an external reference document. Cloud-ops curriculum requires that the student has completed bootstrap setup (Git, SSH keys, development tools). This is a prerequisite process, not a software dependency.

##### Edge #31: cloud-ops -> lcp (hard-blocks)

**Interface:** Local cloud environment (VMs, networking, storage) as lab infrastructure; PXE boot and provisioning templates
**Known-issues:** Cloud-ops is aspirational (ASPIR, Group 6, 4 items). LCP is partial (ASPIR, Group 5, 12 items).
**Version info:** LCP partial since v1.22; cloud-ops aspirational (planned v3.x)

| Target State | Technical Behavior | User-Visible Signal | Resolution Action |
|---|---|---|---|
| **absent** | BROKEN: Cloud-ops curriculum requires working local cloud infrastructure for hands-on labs. Without LCP, there are no VMs to provision, no PXE boot environment, no networking exercises. Curriculum is theory-only. | "Lab infrastructure unavailable. Cloud-ops operates in documentation-only mode." All hands-on exercises disabled. | Install LCP for local cloud lab infrastructure. |
| **partial** | DEGRADED: Basic PXE boot and VM provisioning available. Advanced templates (Jinja, VM identity reconfiguration, DNS) may be missing, limiting some advanced labs. Shell-based provisioning works for core exercises. | Core labs function with basic provisioning. "Advanced provisioning features unavailable" for some exercises. | Complete LCP templates for full lab coverage. |
| **full** | Nominal operation. Full local cloud infrastructure supports all curriculum labs. | None | N/A |

##### Edge #32: cloud-ops -> centos-guide (documentation-only)

**Type:** hard-blocks
**Interface:** CentOS Stream 9 as base OS for all cloud labs; VM configuration, network setup, service management
**Note:** Documentation-only entry. The CentOS guide is an external reference document. Cloud-ops curriculum is built on CentOS Stream 9 infrastructure. Without the CentOS environment set up, cloud labs cannot run. This is an infrastructure prerequisite, not a software dependency.

##### Edge #33: cloud-ops -> creative-suite (documentation-only)

**Type:** soft-enhances
**Interface:** Educational curriculum integration; shared progressive learning methodology; math engine for data analysis
**Note:** Documentation-only entry. Both cloud-ops and creative-suite are aspirational with no implementation. This edge represents future curriculum integration -- cloud-ops and creative-suite would share progressive learning methodology and the math engine. Cloud-ops functions as an independent curriculum without creative-suite.

##### Edge #34: cloud-ops -> space-between (documentation-only)

**Type:** soft-enhances
**Interface:** "The Space Between" unit circle analogy for progressive learning; mathematical/philosophical framework for curriculum design
**Note:** Documentation-only entry. Space-between is an external reference PDF. Cloud-ops curriculum design draws on its unit circle concept for structuring progressive learning. This is a pedagogical influence, not a software dependency. Cloud-ops curriculum functions without this philosophical framework.

---

## Matrix Maintenance

**Last updated:** 2026-02-19
**Valid until:** Next milestone completion (end of v1.25 or start of v1.26)

### Re-evaluation Triggers

The compatibility matrix must be reviewed and updated when any of the following events occur:

**1. Milestone completion**
When any milestone ships, review all matrix entries involving components modified by that milestone. New implementations or status changes (aspirational -> partial, partial -> implemented) will change degradation behavior.

**2. Component status change**
When a component's status in node-inventory.md changes (e.g., silicon moves from aspirational to partial upon GPU availability), update all edges where that component is the target. The "absent" row may need refinement based on actual partial behavior observed.

**3. New DAG edge added**
When a new dependency relationship is identified (e.g., a new vision document creates a dependency between two existing nodes), add a new matrix entry following the standard format. Update the summary statistics.

**4. Known-issues item resolved**
When a deferred item from known-issues.md is implemented (e.g., LCP gains Jinja templating), update the known-issues cross-reference classification and the affected matrix entries. An item moving from "aspirational" to "implemented" may change edge behavior descriptions.

### Update Process

1. Identify the trigger event and affected components
2. Read updated node-inventory.md and edge-inventory.md for current status
3. Update affected matrix entries with new degradation behavior, user signals, and resolution actions
4. Update known-issues cross-reference if classifications changed
5. Update summary statistics table
6. Set new "Last updated" timestamp
7. Commit updated matrix with descriptive message referencing the trigger

### Staleness Policy

If the matrix has not been updated for more than one milestone cycle (approximately 2-4 weeks based on v1.25 velocity), it should be reviewed for accuracy even without an explicit trigger event. The `Valid until` field marks the expected review date.
