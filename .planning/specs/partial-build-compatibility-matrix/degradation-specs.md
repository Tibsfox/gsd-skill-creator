# Graceful Degradation Specifications

**Created:** 2026-02-19
**Purpose:** Per-component degradation scenarios expanding on the compatibility matrix (Plan 01) with implementation-ready detail. For every outgoing edge, documents the technical behavior when the target is absent, the user-visible signal, and the resolution action.
**Requirements:** COMPAT-02 (3-column degradation detail for every edge scenario)
**Status:** Specification only -- no implementation code

**Source data:**
- Compatibility matrix: `./compatibility-matrix.md` (48 edges, 37 actionable)
- Edge inventory: `.planning/specs/ecosystem-dependency-map/edge-inventory.md` (48 typed edges)
- Node inventory: `.planning/specs/ecosystem-dependency-map/node-inventory.md` (20 nodes)
- Known-issues cross-reference: `./known-issues-cross-reference.md` (8 groups, 99 items)
- Capability probe protocol: `./capability-probe-protocol.md` (3-tier detection hierarchy)

**Severity scheme:**
- **BROKEN:** Component cannot perform its primary function. Source of the edge is non-operational when target is absent. Applies to hard-blocks edges.
- **DEGRADED:** Component works but with reduced capability. Source loses enhancement features but core function survives. Applies to soft-enhances edges.
- **MINIMAL-IMPACT:** Absence has negligible effect on the source component. Applies only to documentation-only or superseded edges.

---

## Table of Contents

1. [Core Layer](#core-layer)
   - [skill-creator](#skill-creator-degradation-scenarios)
   - [amiga-leverage](#amiga-leverage-degradation-scenarios)
   - [info-design](#info-design-degradation-scenarios)
2. [Middleware Layer](#middleware-layer)
   - [chipset](#chipset-degradation-scenarios)
   - [staging](#staging-degradation-scenarios)
   - [silicon](#silicon-degradation-scenarios)
   - [gsd-isa](#gsd-isa-degradation-scenarios)
3. [Platform Layer](#platform-layer)
   - [gsd-os](#gsd-os-degradation-scenarios)
   - [planning-docs](#planning-docs-degradation-scenarios)
   - [dashboard-console](#dashboard-console-degradation-scenarios)
   - [lcp](#lcp-degradation-scenarios)
   - [amiga-workbench](#amiga-workbench-degradation-scenarios)
   - [wetty-tmux](#wetty-tmux-degradation-scenarios)
4. [Educational Layer](#educational-layer)
   - [bbs-pack](#bbs-pack-degradation-scenarios)
   - [creative-suite](#creative-suite-degradation-scenarios)
   - [cloud-ops](#cloud-ops-degradation-scenarios)
5. [Summary Table](#summary-table)

---

## Core Layer

### skill-creator Degradation Scenarios

**Node ID:** skill-creator
**Layer:** Core
**Outgoing edges:** 0

skill-creator: No outgoing edges. No degradation scenarios. Fully self-contained root node. It is the most depended-upon component in the ecosystem (9 incoming edges) but depends on nothing within it.

---

### amiga-leverage Degradation Scenarios

**Node ID:** amiga-leverage
**Layer:** Core
**Outgoing edges:** 1 (0 hard-blocks, 1 soft-enhances)

#### When skill-creator is absent (Edge #39, soft-enhances)

**Technical behavior:** The amiga-leverage design philosophy document stands alone as an architectural reference. The SessionObserver pipeline (observe/detect/suggest/apply/learn/compose) that it references as the concrete implementation of the progressive capability concept has no running exemplar. The six-step promotion pipeline loop exists as theory in the document text but cannot be cross-referenced against an operational system. The `src/amiga/` modules (types, registry, envelope, ICD, MC1, ME1, CE1, GL1) that express AMIGA principles structurally still exist, but the skill-creator pipeline they interact with through the SessionObserver is absent.

**User-visible signal:** Design reviews referencing "the six-step loop" or "progressive capability pipeline" cannot point to a working demonstration. The amiga-leverage document's references to skill-creator concepts (observation, detection, suggestion, application, learning, composition) describe a system that does not exist in this build. No error messages -- amiga-leverage is a design philosophy document, not executable code.

**Resolution action:** Install skill-creator (`src/` root + `package.json` exports). Skill-creator provides the concrete implementation that validates the Amiga Principle's progressive capability pipeline. Available since v1.0.

**Severity:** DEGRADED

---

### info-design Degradation Scenarios

**Node ID:** info-design
**Layer:** Core
**Outgoing edges:** 1 (0 hard-blocks, 1 soft-enhances)

#### When planning-docs is absent (Edge #47, soft-enhances)

**Technical behavior:** The information design system (subway map topology, highway gantry metaphor, typography hierarchy with tabular numerals, color-as-identity system) exists as a design specification in `src/dashboard/design-system.ts`, `src/dashboard/entity-shapes.ts`, `src/dashboard/entity-legend.ts`. These TypeScript modules define design tokens, color palettes, and rendering primitives. Without planning-docs (`src/dashboard/` generator, parser, renderer), the design system modules compile but have no HTML canvas to render into. Design tokens are defined but never applied to visual output.

**User-visible signal:** No dashboard exists to view. The design system document references "the dashboard" as its visual target but no `.planning/docs/` HTML output is generated. Design system modules load without error but produce no visual artifacts. A developer inspecting `src/dashboard/design-system.ts` sees the full specification but cannot see it rendered.

**Resolution action:** Install planning-docs by ensuring the full `src/dashboard/` module set is present (parser, renderer, generator, structured-data, incremental, refresh). Planning-docs provides the visual canvas where info-design principles are applied. Available since v1.12.

**Severity:** DEGRADED

---

## Middleware Layer

### chipset Degradation Scenarios

**Node ID:** chipset
**Layer:** Middleware
**Outgoing edges:** 3 (2 hard-blocks, 1 soft-enhances)

#### When skill-creator is absent -- skills section (Edge #1, hard-blocks)

**Technical behavior:** Chipset's `.chipset/chipset.yaml` contains `skills.required` and `skills.recommended` arrays that reference skill-creator-managed skills by name. The 6-stage skill loading pipeline (Score/Resolve/ModelFilter/CacheOrder/Budget/Load) that chipset's `token_budget_weight` field per skill feeds into does not exist. The `src/chipset/blitter.ts`, `src/chipset/copper.ts`, and `src/chipset/exec.ts` modules attempt to load and configure skills that have no backing definitions. The chipset configuration file validates syntactically (it is valid YAML) but every skill reference resolves to nothing.

**User-visible signal:** CLI error when chipset attempts to read skill definitions: "skill-creator not found" or empty skill registry. Chipset configuration loads but produces a zero-capability runtime -- no skills activated, no token budgets allocated, no agent routing configured. Any GSD command that triggers chipset skill loading fails silently or with an empty result set.

**Resolution action:** Install skill-creator first (`src/` root + `package.json` exports). Chipset is architecturally meaningless without the skills it configures. Skill-creator has been available since v1.0. Chipset cannot function without it.

**Severity:** BROKEN

#### When skill-creator is absent -- agent composition (Edge #2, hard-blocks)

**Technical behavior:** Chipset's agent topology section (`agents.topology`, `agents.router.routes`) in `.chipset/chipset.yaml` references agent definitions created by skill-creator's composition engine (`src/composition/`, `src/agents/`). Without skill-creator, the co-activation analysis that drives chipset refinement has no data source. The `src/chipset/teams.ts` module that routes work to agents via the chipset's topology finds an empty dispatch table. Agent composition from co-activation patterns (the process of detecting that skills A and B frequently co-activate and creating a specialist agent combining them) has no observation pipeline to draw from.

**User-visible signal:** Chipset configuration references undefined agents. Agent topology routing produces an empty dispatch table. Any GSD workflow step that involves agent routing (plan-phase, execute-phase) falls back to default single-agent behavior. "Co-activation analysis unavailable" if chipset refinement is attempted.

**Resolution action:** Install skill-creator. Agent composition is a skill-creator feature (`src/composition/`, `src/agents/`) that chipset consumes. Available since v1.14 (promotion pipeline milestone).

**Severity:** BROKEN

#### When planning-docs is absent (Edge #48, soft-enhances)

**Technical behavior:** Chipset loses the dashboard visualization panels (chipset overview panel, agent activity panel, skill activation log, budget health display) that render in the `.planning/docs/` HTML output. The chipset modules (`src/chipset/`) function normally -- skill loading, agent routing, team topologies, and configuration parsing all operate without dashboard visualization. The chipset's runtime behavior is unaffected; only its observability surface is absent.

**User-visible signal:** No chipset-specific panels in the dashboard. Chipset status must be inspected via CLI commands or direct `.chipset/chipset.yaml` file inspection rather than through a visual dashboard. This is the current production behavior for developers who do not generate the dashboard.

**Resolution action:** Install planning-docs (`src/dashboard/` full module set) for visual chipset monitoring. Planning-docs dashboard gains chipset panels when both components are present. Available since v1.12.

**Severity:** DEGRADED

---

### staging Degradation Scenarios

**Node ID:** staging
**Layer:** Middleware
**Outgoing edges:** 4 (2 hard-blocks, 2 soft-enhances)

#### When skill-creator is absent (Edge #5, hard-blocks)

**Technical behavior:** Staging's work analysis phase depends on skill-creator's SessionObserver (`src/observation/`) for pattern detection. The bounded learning constraints (3+ repetitions before suggesting, 7-day cooldown between refinements, 20% maximum change per refinement) are skill-creator features that staging's complexity estimation consumes. Without the observation pipeline, the `src/console/question-schema.ts` and staging queue panel can still accept uploads, but the analytical phase that assesses resource requirements, estimates complexity, and plans pre-execution work decomposition has no pattern data to work with.

**User-visible signal:** Staging intake accepts uploads through the upload zone but cannot analyze them. "Pattern detection unavailable" during the work analysis phase. Resource planning produces default estimates only (no historical pattern data for calibration). The staging queue panel renders but shows uncalibrated complexity scores.

**Resolution action:** Install skill-creator (`src/` root + `package.json` exports). Staging's analytical capabilities depend on skill-creator's observation pipeline for pattern-informed resource planning. Available since v1.0.

**Severity:** BROKEN

#### When chipset is absent (Edge #6, soft-enhances)

**Technical behavior:** Staging's resource analysis phase cannot read `.chipset/chipset.yaml` to discover available skills, agents, and token budgets. The `src/console/` staging components still perform intake (upload zone accepts files), security scanning (basic checks proceed), and work decomposition (using default resource assumptions). Chipset-aware optimization (matching work to available agent topology, respecting token budget constraints) is skipped.

**User-visible signal:** "Chipset configuration not found; using default resource estimates" during the analysis phase. Work decomposition proceeds without chipset-aware optimization. Staging does not offer chipset refinement recommendations. This is functionally similar to running staging in a project that has not configured a chipset.

**Resolution action:** Install chipset (`src/chipset/` + `.chipset/chipset.yaml`) for resource-aware work analysis. Available since v1.11.

**Severity:** DEGRADED

#### When dashboard-console is absent (Edge #7, hard-blocks)

**Technical behavior:** Staging's intake pipeline depends on dashboard-console's upload/configure flow. The filesystem message bus (`.planning/console/inbox/`, `.planning/console/outbox/`) through which content enters the staging pipeline does not exist. The `milestone-config.json` that configures staging behavior is absent. The upload zone (`src/dashboard/upload-zone/`), config form (`src/dashboard/config-form/`), and submit flow (`src/dashboard/submit-flow/`) that provide the user-facing intake interface are not present. Without a console, there is no mechanism for content to enter the staging pipeline.

**User-visible signal:** No staging intake possible. No upload mechanism, no configuration interface. The staging queue panel (`src/dashboard/staging-queue-panel/`) has no content to display. Staging has no content to process -- the entire intake path is console-driven.

**Resolution action:** Install dashboard-console. The console provides the intake flow (upload -> configure -> stage -> analyze) that feeds the staging pipeline. Console source is in `src/dashboard/console-page/` and `src/console/`. Available since v1.16.

**Severity:** BROKEN

#### When silicon is absent (Edge #8, soft-enhances)

**Technical behavior:** Staging skips the community adapter quarantine step. The pre-quarantine hygiene verification (checking community adapters for safety before they enter the adapter evaluation pipeline) is a silicon-layer feature. Staging's core intake, security scanning (basic checks), analysis, and work decomposition function normally. The adapter quarantine is an additive security layer that enhances staging's security scanning, not a required gate.

**User-visible signal:** No adapter quarantine warnings during security scanning. Staging operates without ML-specific security checks. This is the current production behavior -- silicon is aspirational (ENVDEP, Group 2: Silicon/ML, deferred to v3.x).

**Resolution action:** Install silicon layer when GPU infrastructure is available (v3.x). Silicon adds the community adapter quarantine pipeline to staging's security scanning. Requires GPU hardware and model training capabilities.

**Severity:** DEGRADED

---

### silicon Degradation Scenarios

**Node ID:** silicon
**Layer:** Middleware
**Outgoing edges:** 2 (2 hard-blocks, 0 soft-enhances)

**Note:** Silicon is aspirational (ENVDEP, Group 2). The degradation scenarios describe INTENDED behavior when silicon is eventually implemented.

#### When chipset is absent (Edge #3, hard-blocks)

**Technical behavior:** Silicon's configuration format (`silicon.yaml`) is designed to extend `.chipset/chipset.yaml` as a base schema. Without chipset, silicon has no base configuration format, no intent classifier for LoRA routing (the chipset intent classifier selects which LoRA adapter to hot-swap), and no agent topology for adapter placement. The adapter lifecycle management that silicon provides (training, loading, hot-swapping, retiring adapters) has no configuration backbone. `silicon.yaml` references chipset schema fields (`skills`, `agents`, `topology`) that do not exist.

**User-visible signal:** Silicon configuration fails to validate: "chipset.yaml base schema not found." No LoRA routing possible -- the intent classifier that maps user requests to specific adapters has no topology to operate within. Silicon cannot define its adapter lifecycle.

**Resolution action:** Install chipset first (`src/chipset/` + `.chipset/chipset.yaml`). Silicon extends chipset's configuration architecture. Chipset available since v1.11.

**Severity:** BROKEN

#### When skill-creator is absent (Edge #4, hard-blocks)

**Technical behavior:** Silicon's training pair generation depends on skill-creator's SessionObserver capturing interaction patterns. The parallel data path (observation -> training pairs, stored in `.chipset/training/pairs/*.jsonl`) has no source. Without observation data, silicon has no training material for QLoRA fine-tuning -- the adapters cannot be trained because the pipeline that extracts training pairs from user interactions does not exist. Pattern detection that feeds into adapter training quality (co-activation patterns generating diverse training data) is absent.

**User-visible signal:** Silicon training pipeline has zero input data. "No observation pipeline available for training pair extraction." The ML pipeline cannot train any adapters. The `src/dashboard/silicon-panel.ts` visualization panel would show an empty training state.

**Resolution action:** Install skill-creator (`src/` root + `package.json` exports). Silicon requires observation data to generate training pairs. Skill-creator available since v1.0.

**Severity:** BROKEN

---

### gsd-isa Degradation Scenarios

**Node ID:** gsd-isa
**Layer:** Middleware
**Outgoing edges:** 4 (3 hard-blocks, 1 soft-enhances)

**Note:** GSD ISA is aspirational (ASPIR, Group 1: 32 items deferred to v2.x). These scenarios describe INTENDED behavior. The AGC ISA (`src/agc/`) is a separate educational component, not the GSD workflow ISA.

#### When chipset is absent (Edge #42, hard-blocks)

**Technical behavior:** GSD ISA formalizes chipset's inter-agent communication into an instruction set architecture. The "System Bus" concept maps directly to chipset's agent topology. ISA opcodes target chipset-managed agents; token budgets map to "bandwidth allocation." Without chipset, ISA has no bus architecture to formalize, no agent topology for its opcodes to target, and no token budget concept to map to bandwidth allocation. The ISA configuration references `.chipset/chipset.yaml` schema fields that do not exist.

**User-visible signal:** ISA configuration references undefined chipset schema. "System bus undefined" -- opcodes have no target. Any ISA instruction that references an agent (LOAD, STORE, SEND, RECV) produces a no-op or error because the bus topology is absent.

**Resolution action:** Install chipset (`src/chipset/` + `.chipset/chipset.yaml`). GSD ISA is a formalization layer over chipset's bus architecture. Chipset available since v1.11.

**Severity:** BROKEN

#### When skill-creator is absent (Edge #43, hard-blocks)

**Technical behavior:** ISA registers map to skill-creator concepts: SK register = active skill, SP register = observation pipeline depth. ISA opcodes like LOAD SK (load a skill into the active register), PUSH/POP (observation stack operations) target skill-creator's pipeline. Without skill-creator, these registers reference concepts that do not exist and these opcodes have no operational target. The instruction set defines operations on a substrate that is absent.

**User-visible signal:** ISA register definitions reference undefined skill-creator subsystems. Opcodes produce no-ops. "SK register target not found" when attempting LOAD SK. The entire observation-pipeline instruction subset (PUSH, POP, OBSERVE, DETECT) is non-functional.

**Resolution action:** Install skill-creator (`src/` root + `package.json` exports). ISA opcodes target skill-creator's pipeline. Skill-creator available since v1.0.

**Severity:** BROKEN

#### When amiga-leverage is absent (Edge #44, hard-blocks)

**Technical behavior:** GSD ISA is explicitly modeled after the Amiga Hardware Reference Manual. The custom chipset metaphor (Agnus for memory/DMA, Denise for display, Paula for audio/I/O mapped to GSD equivalents), DMA channel concept, and coprocessor architecture pattern that give the ISA its coherence all derive from amiga-leverage. Without this design foundation, the ISA loses its architectural metaphor -- instructions exist but the unifying design philosophy that makes them coherent (hardware register metaphor, DMA channels as token streams, coprocessors as specialized agents) is gone.

**User-visible signal:** ISA design document references an undefined architectural philosophy. The hardware metaphor ("Agnus manages the token bus," "Denise handles rendering," "Paula manages I/O") has no source material. Design reviews cannot validate ISA design choices against the intended reference architecture.

**Resolution action:** Install amiga-leverage (`src/amiga/` modules). ISA's design coherence depends on the Amiga Principle. Available since v1.21.

**Severity:** BROKEN

#### When silicon is absent (Edge #45, soft-enhances)

**Technical behavior:** ISA envisions silicon's local inference LoRA adapters as "custom chips" executing ISA instructions, with VRAM budget as "bandwidth allocation." Without silicon, the ISA's hardware metaphor remains purely metaphorical -- instructions target the TypeScript skill/agent pipeline rather than actual GPU inference. The ISA functions through chipset and skill-creator but loses the execution path where instructions compile to adapter invocations.

**User-visible signal:** ISA operates without a "hardware execution target." Instructions that would route to silicon (adapter invocation, VRAM allocation, training pair generation) fall back to the software pipeline. "Silicon execution target unavailable -- using software pipeline." This is the expected state during v1.x and v2.x.

**Resolution action:** Install silicon layer when GPU infrastructure is available (v3.x). Silicon makes the ISA's hardware metaphor literal by providing actual inference hardware.

**Severity:** DEGRADED

---

## Platform Layer

### gsd-os Degradation Scenarios

**Node ID:** gsd-os
**Layer:** Platform
**Outgoing edges:** 8 (4 hard-blocks, 4 soft-enhances)

#### When amiga-leverage is absent (Edge #14, hard-blocks)

**Technical behavior:** GSD-OS's entire design philosophy derives from the Amiga Principle. The progressive depth model (Levels 1-4), DMA/coprocessor metaphor mapped to agent routing, and the desktop shell architecture pattern are all grounded in amiga-leverage. The `desktop/src/` modules (engine, terminal, tmux, claude, ipc, wm, shell, dashboard, calibration, boot) still compile and render, but their design rationale is lost. The Amiga boot sequence (`desktop/src/boot/`) references a design philosophy that does not exist in this build.

**User-visible signal:** Desktop application lacks design coherence. Progressive depth levels have no architectural justification. UI patterns are arbitrary rather than principled. The boot sequence plays but its thematic connection to Amiga heritage is ungrounded. No error messages -- the application functions but lacks design rationale.

**Resolution action:** Install amiga-leverage (`src/amiga/` modules). GSD-OS is architecturally grounded in this design philosophy document. Available since v1.21.

**Severity:** BROKEN

#### When chipset is absent (Edge #15, hard-blocks)

**Technical behavior:** GSD-OS consumes `.chipset/chipset.yaml` at every GSD lifecycle stage: `new-project` (reads chipset for project archetype), `plan-phase` (reads skill inventory), `execute-phase` (activates agent topology), `verify-work` (reads verification configuration). The `src/chipset/` modules that provide skill loading, agent routing, and file-change triggers are absent. The desktop application has no skill/agent configuration, no topology for routing work, and no automation triggers.

**User-visible signal:** "No chipset configuration found" warnings at each GSD lifecycle stage. GSD commands execute without chipset-aware optimization. Agent routing uses fallback default behavior (single-agent, no topology). File-change triggers for automatic dashboard regeneration or test re-runs do not fire.

**Resolution action:** Install chipset (`src/chipset/` + `.chipset/chipset.yaml`). GSD-OS relies on chipset for workflow orchestration. Available since v1.11.

**Severity:** BROKEN

#### When skill-creator is absent (Edge #16, hard-blocks)

**Technical behavior:** GSD-OS is the desktop shell built on top of skill-creator's learning/evolution layer. Without skill-creator: the skill loading pipeline (`src/activation/`) does not exist, the SessionObserver (`src/observation/`) for pattern capture is absent, agent composition (`src/composition/`, `src/agents/`, `/.claude/agents/`) has no engine, and the GSD Orchestrator's 5-stage classification pipeline (`src/orchestrator/`) cannot route natural language requests. The desktop application becomes a static shell -- it can launch, display the window manager and taskbar, render the terminal via xterm.js/Tauri PTY, but has zero adaptive capabilities.

**User-visible signal:** Desktop application launches but has zero learning capability. No skills loaded, no agents available, no pattern detection. GSD commands fail: "skill-creator not available." Natural language routing falls back to nothing -- the user must use explicit CLI commands. The application is a terminal emulator with a window manager, nothing more.

**Resolution action:** Install skill-creator (`src/` root + `package.json` exports). It is the core engine that GSD-OS presents through its desktop interface. Available since v1.0.

**Severity:** BROKEN

#### When staging is absent (Edge #17, soft-enhances)

**Technical behavior:** GSD-OS skips pre-execution work analysis and security scanning. The `.planning/staging/inbox/` intake pipeline is not available. Users can still create projects, plan phases, execute work, and verify results through standard GSD commands. Staging adds an analysis layer before execution (complexity estimation, resource planning, security review) -- it is not a required gate in the GSD workflow.

**User-visible signal:** No "staging analysis" step before execution. Work begins immediately without complexity estimation or security review. No upload-zone-based content intake. This is the current production behavior for most GSD workflows. No error messages.

**Resolution action:** Install staging for pre-execution analysis and security hygiene. Staging source is in `src/console/` (question-schema, reader, schema validation) and `src/dashboard/staging-queue-panel/`. Available since v1.17.

**Severity:** DEGRADED

#### When dashboard-console is absent (Edge #18, soft-enhances)

**Technical behavior:** GSD-OS operates without a cockpit view. The `.planning/console/` bidirectional message bus does not exist. No in-app dashboard for milestone status, session interaction, or chipset monitoring. The desktop application functions as a terminal/editor environment. The `desktop/src/dashboard/` module that embeds console panels has nothing to display.

**User-visible signal:** No console panels in the desktop application. Project status requires CLI commands (`/gsd:progress`) or direct `.planning/` file inspection. No upload zone, no session interaction panel, no staging queue display. The desktop application's dashboard embedding area is empty.

**Resolution action:** Install dashboard-console for in-app observability and control. Console source is in `src/dashboard/console-page/`, `src/console/`. Available since v1.16.

**Severity:** DEGRADED

#### When planning-docs is absent (Edge #19, soft-enhances)

**Technical behavior:** GSD-OS operates without the embedded planning docs dashboard. No `.planning/docs/` HTML output is generated, no JSON-LD structured data overlays, no auto-refresh of planning artifacts. The `desktop/src/dashboard/` module that would embed the dashboard renders an empty or placeholder view. Users access `.planning/` files directly via editor or terminal.

**User-visible signal:** No dashboard tab in the desktop application. Planning state is viewed through raw markdown files. No visual project observability -- no topology maps, no gantry panels, no activity feeds, no budget gauges. Developers must read `.planning/ROADMAP.md`, `STATE.md`, etc. directly.

**Resolution action:** Install planning-docs (`src/dashboard/` full module set) for visual project observability within GSD-OS. Available since v1.12.

**Severity:** DEGRADED

#### When info-design is absent (Edge #20, hard-blocks)

**Technical behavior:** GSD-OS's visual presentation depends entirely on info-design's design system. Without `src/dashboard/design-system.ts`, `src/dashboard/entity-shapes.ts`, `src/dashboard/entity-legend.ts`: no subway map topology visualization, no highway gantry metaphor, no typography hierarchy (tabular numerals, weight hierarchy), no color-as-identity system (32-color indexed palette semantics). The desktop application renders with default/unstyled UI -- browser/system defaults for fonts, colors, and layout.

**User-visible signal:** Desktop application has inconsistent or unstyled visuals. No topology map, no gantry panels. UI elements use browser/system defaults. The CRT shader engine (`desktop/src/engine/`) may still render but without the design system's color semantics, the palette is meaningless.

**Resolution action:** Install info-design (`src/dashboard/design-system/` module). GSD-OS visual coherence depends on this design system. Available since v1.18.

**Severity:** BROKEN

#### When wetty-tmux is absent (Edge #21, soft-enhances)

**Technical behavior:** GSD-OS originally referenced Wetty for browser-based terminal access. The Tauri desktop architecture made native PTY the correct choice. GSD-OS functions fully with `src-tauri/src/pty/` (Rust portable-pty backend) and `desktop/src/terminal/` (xterm.js frontend). The Wetty/SSH/tmux approach is permanently superseded. This edge represents historical architectural influence only.

**User-visible signal:** None. No degradation occurs. Native PTY is the production terminal implementation and is superior for the desktop use case (lower latency, no SSH overhead, tighter integration). Wetty-tmux is permanently deferred (PERM, Group 4).

**Resolution action:** Not applicable -- architectural decision. Native PTY supersedes Wetty. No action needed.

**Severity:** MINIMAL-IMPACT

---

### planning-docs Degradation Scenarios

**Node ID:** planning-docs
**Layer:** Platform
**Outgoing edges:** 1 (0 hard-blocks, 1 soft-enhances)

#### When skill-creator is absent (Edge #46, soft-enhances)

**Technical behavior:** Planning-docs dashboard operates as a standalone TypeScript module in `src/dashboard/` (parser, renderer, generator, structured-data, incremental, refresh, collectors, metrics). Without skill-creator, the dashboard loses GSD workflow integration -- the trigger points that regenerate the dashboard on `plan-phase`, `execute-phase`, `verify-work`, and `complete-milestone` events are not connected. The skill metadata format (`metadata.yaml`, `SKILL.md`) for packaging the dashboard generator as a GSD skill is unavailable. The SessionObserver observation pipeline does not capture dashboard generation patterns.

**User-visible signal:** Dashboard generates HTML from `.planning/` files normally. No skill-based workflow automation -- dashboard regeneration must be triggered manually or via direct script invocation (`node src/dashboard/generator.ts`) rather than through GSD event hooks. "Dashboard generator not packaged as skill" -- it functions as a standalone module, not discoverable through the skill ecosystem.

**Resolution action:** Install skill-creator (`src/` root + `package.json` exports) for GSD workflow integration and skill-based automation triggers. Available since v1.0. Skill packaging of the dashboard generator is aspirational (ASPIR, Group 7: Dashboard packaging, 3 items, deferred to v2.x).

**Severity:** DEGRADED

---

### dashboard-console Degradation Scenarios

**Node ID:** dashboard-console
**Layer:** Platform
**Outgoing edges:** 4 (2 hard-blocks, 2 soft-enhances)

#### When planning-docs is absent (Edge #35, hard-blocks)

**Technical behavior:** Dashboard-console extends the read-only planning-docs dashboard into bidirectional control. Without planning-docs (`src/dashboard/` base modules -- parser, renderer, generator), there is no HTML layer to extend, no generator script to hook into, no JSON-LD structured data to augment. The console-page module (`src/dashboard/console-page/`) attempts to inject bidirectional controls into a dashboard that does not exist. Console UI elements (upload zone, config form, submit flow, question card, staging queue panel) have no rendering target.

**User-visible signal:** "Base dashboard not found" error. Console UI elements cannot render. The `src/dashboard/console-page/` module loads but has no HTML document to inject controls into. Dashboard-console is inoperable.

**Resolution action:** Install planning-docs first (`src/dashboard/` full module set). Dashboard-console extends, not replaces, the base dashboard. Planning-docs available since v1.12.

**Severity:** BROKEN

#### When chipset is absent (Edge #36, soft-enhances)

**Technical behavior:** Dashboard-console functions without chipset status display. The chipset overview panel, agent activity visualization, skill activation log, and budget health display are all chipset-sourced data panels. All other console features (upload zone, configure form, session interaction, staging queue, console settings, console activity log) work normally. The console simply does not render chipset-specific panels.

**User-visible signal:** Chipset-related panels are empty or hidden. "Chipset not configured" placeholder in the dashboard where chipset panels would appear. Other console panels function normally. No error messages -- chipset panels are optional observability.

**Resolution action:** Install chipset (`src/chipset/` + `.chipset/chipset.yaml`) for dashboard chipset monitoring. Available since v1.11.

**Severity:** DEGRADED

#### When info-design is absent (Edge #37, hard-blocks)

**Technical behavior:** Dashboard-console's visual language depends on info-design. The "dispatch center" metaphor (highway gantry for status display, subway map for topology, color-as-identity for component distinction) requires `src/dashboard/design-system.ts`, `src/dashboard/entity-shapes.ts`, `src/dashboard/entity-legend.ts`, `src/dashboard/gantry-panel.ts`, `src/dashboard/topology-renderer.ts`. Without these modules, console renders with default/unstyled controls. The console's UI structure exists but its visual coherence is absent.

**User-visible signal:** Console UI has inconsistent styling. No gantry metaphor, no subway topology visualization, no color-as-identity differentiation between components. Controls render but lack visual coherence. Buttons, panels, and forms use browser defaults.

**Resolution action:** Install info-design (`src/dashboard/design-system/` module). Console visual language depends on the design system. Available since v1.18.

**Severity:** BROKEN

#### When wetty-tmux is absent (Edge #38, soft-enhances)

**Technical behavior:** Dashboard-console originally envisioned embedding Wetty terminal via iframe for SSH session access. Native PTY through Tauri superseded this approach entirely. Dashboard-console functions fully with the native terminal integration in `desktop/src/terminal/`. This edge represents historical architectural influence. The iframe embedding concept was replaced by direct xterm.js terminal rendering within the Tauri webview.

**User-visible signal:** None. No degradation occurs. Native terminal integration is the production approach. Wetty-tmux is permanently deferred (PERM, Group 4).

**Resolution action:** Not applicable -- architectural decision. Native PTY supersedes Wetty. No action needed.

**Severity:** MINIMAL-IMPACT

---

### lcp Degradation Scenarios

**Node ID:** lcp
**Layer:** Platform
**Outgoing edges:** 4 (2 hard-blocks to external nodes, 1 soft-enhances to external node, 1 soft-enhances to internal node)

#### When bootstrap is absent (Edge #22, hard-blocks)

**Technical behavior:** LCP's `infra/scripts/render-pxe-menu.sh` and provisioning scripts assume a bootstrapped development environment (Git, SSH keys, basic development tools as described in GSD Bootstrap Steps 1-8). "Absent" means the developer has not followed the bootstrap guide, which is a human process issue, not a software dependency. LCP scripts will fail on missing tools (git not installed, SSH keys not configured, development environment not set up) rather than on a missing software component.

**User-visible signal:** LCP provisioning scripts fail with "command not found" errors for Git, SSH, or other bootstrap prerequisites. PXE boot configuration cannot be generated if SSH keys are missing. Error messages are tool-specific (e.g., "git: command not found", "ssh: No such file or directory").

**Resolution action:** Follow the GSD Bootstrap guide Steps 1-8 to set up the development environment. This is a human prerequisite process: install Git, generate SSH keys, configure development tools.

**Severity:** BROKEN

#### When centos-guide is absent (Edge #23, hard-blocks)

**Technical behavior:** LCP provisions VMs according to the CentOS Stream 9 infrastructure guide's patterns (network topology, firewalld/SELinux configuration, VM layout). "Absent" means the CentOS infrastructure described in the guide has not been set up -- no VMs exist, no networking is configured. LCP's provisioning scripts target an infrastructure that does not exist.

**User-visible signal:** LCP provisioning commands fail: VMs cannot be reached, network topology references do not resolve, PXE boot targets are unavailable. Error messages are infrastructure-specific (e.g., "Connection refused", "Host unreachable", "No VMs found in libvirt").

**Resolution action:** Follow the CentOS Cloud Infrastructure Guide to set up the target VM environment. This is an infrastructure prerequisite: create VMs, configure networking, set up firewalld/SELinux.

**Severity:** BROKEN

#### When minecraft-world is absent (Edge #24, soft-enhances)

**Technical behavior:** LCP functions fully without Minecraft. Minecraft-world is one of many potential workloads that validates LCP's provisioning pipeline (`render-pxe-menu.sh`, server.properties templating). LCP's core PXE boot, VM provisioning, and configuration management work for any workload. Minecraft is a proof-of-concept demonstration, not a required component.

**User-visible signal:** No Minecraft server deployment option in the PXE boot menu. LCP provisions other workloads normally. This is expected for environments that do not need Minecraft. No error messages.

**Resolution action:** Install Minecraft-world (`infra/` knowledge-world, minecraft directories) to add Minecraft as a demonstration workload. Shipped in v1.22. Not required for LCP core functionality.

**Severity:** DEGRADED

#### When chipset is absent (Edge #25, soft-enhances)

**Technical behavior:** LCP operates with raw GSD workflow without chipset-aware project configuration. Provisioning scripts, PXE boot, and VM management work without chipset-provided skill loading or infrastructure project archetypes. The `.chipset/chipset.yaml` infrastructure archetype that would configure LCP-specific skills and agent routing is not present.

**User-visible signal:** "No chipset configuration" during project setup. LCP uses the default GSD workflow without infrastructure-specific skill optimization. This is the current production behavior -- LCP was built before chipset integration was designed for infrastructure projects.

**Resolution action:** Install chipset (`src/chipset/` + `.chipset/chipset.yaml`) for infrastructure-aware project configuration. Available since v1.11. LCP chipset archetype is aspirational (ASPIR, Group 5: LCP templates, 12 items).

**Severity:** DEGRADED

---

### amiga-workbench Degradation Scenarios

**Node ID:** amiga-workbench
**Layer:** Platform
**Outgoing edges:** 2 (2 hard-blocks, 0 soft-enhances)

#### When amiga-leverage is absent (Edge #40, hard-blocks)

**Technical behavior:** Amiga-workbench's entire design builds on the Amiga Principle. The hardware I/O philosophy (ports as first-class citizens), Hardware Reference Manual transparency principle, and progressive depth model (Levels 1-4) all derive from amiga-leverage. The `desktop/src/wm/` modules (window manager, taskbar, pixel-art icons, system menu) still render basic UI, but the hardware integration design is ungrounded. The Workbench's design principles section references the Amiga Principle as source material that does not exist in this build.

**User-visible signal:** Workbench UI renders basic windows and taskbar. Hardware I/O design has no philosophical basis. "Design principles" section of the Workbench specification references undefined source material. The UI functions mechanically but the design rationale is absent.

**Resolution action:** Install amiga-leverage (`src/amiga/` modules). Workbench I/O philosophy derives from this design philosophy document. Available since v1.21.

**Severity:** BROKEN

#### When gsd-os is absent (Edge #41, hard-blocks)

**Technical behavior:** Amiga-workbench is the physical-digital integration layer of GSD-OS. Without the desktop shell (`src-tauri/` Rust backend + `desktop/` Vite webview), there is no Tauri application, no WebGL rendering engine (`desktop/src/engine/`), no window manager host (`desktop/src/wm/`). The Workbench UI has no host environment to render within. Hardware I/O (audio/MIDI, camera, GPIO) has no application to route through.

**User-visible signal:** Workbench cannot launch. No desktop shell to render within. No Tauri application window. The Workbench is a layer within GSD-OS, not a standalone application.

**Resolution action:** Install gsd-os (`src-tauri/tauri.conf.json` + `desktop/src/`). Workbench is a layer within the desktop application. Available since v1.21.

**Severity:** BROKEN

---

### wetty-tmux Degradation Scenarios

**Node ID:** wetty-tmux
**Layer:** Platform
**Outgoing edges:** 0

wetty-tmux: No outgoing edges. No degradation scenarios. This component is permanently deferred (PERM, Group 4: Wetty divergence, 9 items). It will not be built. Its functionality is superseded by Tauri native PTY (`src-tauri/src/pty/` + `desktop/src/terminal/`). Two incoming edges (#21 from gsd-os, #38 from dashboard-console) are both soft-enhances and both source components function fully without wetty-tmux.

---

## Educational Layer

### bbs-pack Degradation Scenarios

**Node ID:** bbs-pack
**Layer:** Educational
**Outgoing edges:** 4 (3 hard-blocks, 1 soft-enhances)

**Note:** BBS-pack is aspirational (deferred to v3.x). These scenarios describe INTENDED behavior when implemented.

#### When skill-creator is absent (Edge #26, hard-blocks)

**Technical behavior:** BBS-pack ships as a skill-creator educational module using the module format defined by skill-creator's packaging system (`metadata.yaml`, `SKILL.md`). Without skill-creator, the module format does not exist, the observation/skill/knowledge pipeline that serves as the pedagogical framework (students observe patterns -> detect skills -> suggest approaches -> apply solutions) is unavailable. BBS educational content has no delivery mechanism.

**User-visible signal:** BBS educational content cannot load. "Skill-creator module format not available." The educational pack has no packaging system to deliver its content through.

**Resolution action:** Install skill-creator (`src/` root + `package.json` exports). BBS-pack is packaged as a skill-creator module. Skill-creator available since v1.0.

**Severity:** BROKEN

#### When chipset is absent (Edge #27, soft-enhances)

**Technical behavior:** BBS-pack's educational content is standalone material accessible without chipset. Without `.chipset/chipset.yaml`, BBS-pack lacks chipset-defined skill groupings for door games (educational game simulations) and networking labs (modem simulation, FidoNet protocol exercises). Content itself remains accessible through the skill-creator module format.

**User-visible signal:** BBS educational content loads without chipset-specific skill optimization. Door games and networking labs use default configuration rather than chipset-optimized skill groupings. No error messages.

**Resolution action:** Install chipset (`src/chipset/` + `.chipset/chipset.yaml`) for BBS-specific skill optimization. Chipset available since v1.11.

**Severity:** DEGRADED

#### When amiga-leverage is absent (Edge #28, hard-blocks)

**Technical behavior:** BBS-pack embodies the Amiga Principle -- the BBS era is the primary historical exemplar of "architectural leverage over raw power" (bulletin board systems running on modest hardware achieved community connectivity that mainframes could not). Without amiga-leverage, the pedagogical framework (shareware distribution model, demo scene creativity, community-driven computing model) loses its design rationale. Educational content can exist as isolated lessons but lacks the coherent narrative that ties the BBS era to the progressive capability principle.

**User-visible signal:** BBS curriculum references undefined Amiga Principle. Educational narrative about "leverage vs. power" has no architectural foundation. Lessons teach BBS mechanics (dial-up, ANSI art, door games) without the larger design philosophy context.

**Resolution action:** Install amiga-leverage (`src/amiga/` modules). BBS-pack's educational philosophy is grounded in this design philosophy document. Available since v1.21.

**Severity:** BROKEN

#### When gsd-os is absent (Edge #29, hard-blocks)

**Technical behavior:** BBS-pack launches within GSD-OS's desktop shell. Without the Tauri application (`src-tauri/` + `desktop/`), there is no terminal interface for BBS rendering (xterm.js + portable-pty provide xterm-compatible terminal emulation), no window manager for BBS windows, and no host environment for the BBS experience. The modem simulator, ANSI art renderer, BBS main menu, and door games require a terminal emulator to render.

**User-visible signal:** BBS educational pack cannot launch. No host platform for terminal-based BBS rendering. No xterm-compatible terminal available.

**Resolution action:** Install gsd-os (`src-tauri/tauri.conf.json` + `desktop/src/`). BBS-pack requires the desktop shell as its host platform. Available since v1.21.

**Severity:** BROKEN

---

### creative-suite Degradation Scenarios

**Node ID:** creative-suite
**Layer:** Educational
**Outgoing edges:** 5 (3 hard-blocks, 2 soft-enhances)

**Note:** Creative-suite is aspirational. These scenarios describe INTENDED behavior when all 8 applications are implemented.

#### When amiga-leverage is absent (Edge #9, hard-blocks)

**Technical behavior:** Creative-suite's 8-application curriculum follows the progressive depth principle from amiga-leverage: Level 1 (BASIC -- GSD-OS System Guide), Level 2 (C -- BBS & Internet), Level 3 (Assembly -- creative tools), Level 4 (Hardware -- AI Workshop). Without amiga-leverage, the 4-level learning path has no architectural justification. The progressive capability pipeline (observe/detect/suggest/apply/learn/compose) that structures the educational progression is undefined. Applications exist as disconnected tools rather than a coherent learning path.

**User-visible signal:** Creative-suite curriculum references undefined progressive depth principle. The 8 applications are disconnected rather than forming a learning path. "Level 1-4 progression" has no design basis.

**Resolution action:** Install amiga-leverage (`src/amiga/` modules). Creative-suite's learning path derives from this design philosophy. Available since v1.21.

**Severity:** BROKEN

#### When gsd-os is absent (Edge #10, hard-blocks)

**Technical behavior:** All 8 creative-suite applications run within GSD-OS's desktop shell. Without the Tauri application: no WebGL rendering engine (`desktop/src/engine/`) for GSD-Paint and GSD-Animate, no block-based interaction model for Level 1 applications, no educational curriculum framework for structuring the learning path. All applications have no host environment.

**User-visible signal:** Creative-suite applications cannot launch. No platform to run the 8 educational applications. No WebGL, no window manager, no terminal.

**Resolution action:** Install gsd-os (`src-tauri/tauri.conf.json` + `desktop/src/`). Creative-suite runs within the desktop shell. Available since v1.21.

**Severity:** BROKEN

#### When chipset is absent (Edge #11, soft-enhances)

**Technical behavior:** Creative-suite applications function without chipset-specific configuration. Without `.chipset/chipset.yaml`, per-application educational chipset definitions (skill groupings tailored to each pack -- e.g., pixel art skills for GSD-Paint, audio synthesis skills for GSD-Tracker) are not available. Applications load with default skill configurations.

**User-visible signal:** Applications load with default skill configuration. "No educational chipset found -- using defaults." Per-application skill optimization is absent. No error messages.

**Resolution action:** Install chipset (`src/chipset/` + `.chipset/chipset.yaml`) for per-application skill optimization. Chipset available since v1.11.

**Severity:** DEGRADED

#### When silicon is absent (Edge #12, soft-enhances)

**Technical behavior:** Creative-suite's AI Workshop (Pack 8 -- "The AI Workshop") loses its hands-on ML component. The educational content about neural networks, adapter training, and inference exists but cannot demonstrate local inference through silicon's LoRA adapters. The other 7 packs (System Guide, Network, GSD-Paint, GSD-Tracker, GSD-Animate, Hard Drive Module, Math Engine) function normally -- they do not depend on silicon.

**User-visible signal:** AI Workshop Pack 8 operates in "theory-only" mode. "Silicon layer unavailable -- ML demonstrations use simulated output." Students learn concepts without live ML demonstrations. Other packs unaffected.

**Resolution action:** Install silicon layer when GPU infrastructure is available (v3.x). Silicon adds live ML demonstration capability to Pack 8. Requires GPU hardware.

**Severity:** DEGRADED

#### When bbs-pack is absent (Edge #13, hard-blocks)

**Technical behavior:** Creative-suite's 8-pack learning path requires BBS-pack as Pack 2 ("The Network") in the curriculum sequence: Pack 1 (System Guide) -> Pack 2 (BBS & Internet / The Network) -> Pack 3 (GSD-Paint) -> ... -> Pack 8 (AI Workshop). Without bbs-pack, the curriculum has a gap between Pack 1 and Pack 3. The modem simulator shared component (used by Pack 2 and potentially referenced by other packs for networking concepts) is unavailable.

**User-visible signal:** Creative-suite curriculum shows "Pack 2: The Network -- not available." Learning path has a gap. Modem simulator references from other packs fail. Students must skip from Pack 1 directly to Pack 3, missing networking fundamentals.

**Resolution action:** Install bbs-pack. Pack 2 is a prerequisite in the learning sequence. BBS-pack is aspirational (deferred to v3.x).

**Severity:** BROKEN

---

### cloud-ops Degradation Scenarios

**Node ID:** cloud-ops
**Layer:** Educational
**Outgoing edges:** 5 (3 hard-blocks, 2 soft-enhances)

**Note:** Cloud-ops is aspirational (ASPIR, Group 6: 4 items deferred to v3.x). These scenarios describe INTENDED behavior.

#### When bootstrap is absent (Edge #30, hard-blocks)

**Technical behavior:** Cloud-ops curriculum requires that the student has completed GSD Bootstrap Steps 1-8 (Git, SSH keys, development environment setup). "Absent" means the student has not followed the prerequisite human process. Cloud-ops labs cannot execute in an unbootstrapped environment -- scripts assume Git, SSH, and basic tooling are present.

**User-visible signal:** Lab exercises fail with tool-not-found errors. "Prerequisite check failed: bootstrap steps incomplete." Students cannot begin the curriculum without a properly configured development environment.

**Resolution action:** Follow the GSD Bootstrap guide Steps 1-8. This is a human prerequisite process.

**Severity:** BROKEN

#### When lcp is absent (Edge #31, hard-blocks)

**Technical behavior:** Cloud-ops curriculum requires working local cloud infrastructure (VMs, networking, storage) for hands-on labs. Without LCP (`infra/` scripts, PXE boot, provisioning templates), there are no VMs to provision, no PXE boot environment for bare-metal labs, no networking exercises. The 6 curriculum modules (containers, VMs, networking, storage, monitoring, orchestration) all require lab infrastructure.

**User-visible signal:** "Lab infrastructure unavailable. Cloud-ops operates in documentation-only mode." All hands-on exercises disabled. Students can read curriculum materials but cannot practice. No VMs, no networking labs, no container exercises.

**Resolution action:** Install LCP (`infra/` directory) for local cloud lab infrastructure. LCP partial since v1.22. Core PXE/provisioning works; advanced templates are aspirational (ASPIR, Group 5).

**Severity:** BROKEN

#### When centos-guide is absent (Edge #32, hard-blocks)

**Technical behavior:** Cloud-ops curriculum is built on CentOS Stream 9 as the base OS for all cloud labs. "Absent" means the CentOS infrastructure has not been set up. VM configuration, network setup, service management, firewalld/SELinux -- all curriculum exercises assume CentOS Stream 9 as the target environment.

**User-visible signal:** Lab exercises reference CentOS-specific commands, paths, and configurations that do not exist. "CentOS environment not found." Students cannot complete labs without the target infrastructure.

**Resolution action:** Follow the CentOS Cloud Infrastructure Guide to set up the lab environment. This is an infrastructure prerequisite.

**Severity:** BROKEN

#### When creative-suite is absent (Edge #33, soft-enhances)

**Technical behavior:** Cloud-ops functions as an independent curriculum without creative-suite. The shared progressive learning methodology and math engine integration for data analysis are enhancements, not requirements. Cloud-ops teaches cloud operations through its own 6-module structure (containers, VMs, networking, storage, monitoring, orchestration) independently.

**User-visible signal:** No creative-suite integration in cloud-ops curriculum. Math engine for data analysis exercises is unavailable -- students use command-line tools instead. No cross-curriculum links between cloud-ops and creative-suite modules. No error messages.

**Resolution action:** Install creative-suite for curriculum integration and shared math engine. Creative-suite is aspirational (deferred to v3.x).

**Severity:** DEGRADED

#### When space-between is absent (Edge #34, soft-enhances)

**Technical behavior:** Cloud-ops curriculum design draws on "The Space Between" PDF's unit circle concept for structuring progressive learning (the pedagogical framework uses the unit circle analogy to map curriculum progression). Without this reference, cloud-ops curriculum functions with standard linear lesson ordering rather than the unit-circle-based progression model.

**User-visible signal:** No unit-circle-based curriculum structure. Cloud-ops modules follow standard sequential ordering. The pedagogical framework references are absent from instructor materials. Students experience no difference -- the unit circle model is an instructional design tool, not a student-facing feature.

**Resolution action:** Obtain "The Space Between" reference PDF. This is an external philosophical reference document, not a software dependency. Cloud-ops curriculum functions without it.

**Severity:** DEGRADED

---

## Summary Table

| Component | Layer | Status | Outgoing Edges | Hard-Blocks Out | Soft-Enhances Out | BROKEN Scenarios | DEGRADED Scenarios | MINIMAL-IMPACT Scenarios |
|-----------|-------|--------|---------------|-----------------|-------------------|------------------|--------------------|--------------------------|
| skill-creator | Core | implemented | 0 | 0 | 0 | 0 | 0 | 0 |
| amiga-leverage | Core | implemented | 1 | 0 | 1 | 0 | 1 | 0 |
| info-design | Core | implemented | 1 | 0 | 1 | 0 | 1 | 0 |
| chipset | Middleware | partial | 3 | 2 | 1 | 2 | 1 | 0 |
| staging | Middleware | partial | 4 | 2 | 2 | 2 | 2 | 0 |
| silicon | Middleware | aspirational | 2 | 2 | 0 | 2 | 0 | 0 |
| gsd-isa | Middleware | aspirational | 4 | 3 | 1 | 3 | 1 | 0 |
| gsd-os | Platform | partial | 8 | 4 | 4 | 4 | 2 | 2 |
| planning-docs | Platform | implemented | 1 | 0 | 1 | 0 | 1 | 0 |
| dashboard-console | Platform | partial | 4 | 2 | 2 | 2 | 1 | 1 |
| lcp | Platform | partial | 4 | 2 | 2 | 2 | 2 | 0 |
| amiga-workbench | Platform | partial | 2 | 2 | 0 | 2 | 0 | 0 |
| wetty-tmux | Platform | permanently-deferred | 0 | 0 | 0 | 0 | 0 | 0 |
| bbs-pack | Educational | aspirational | 4 | 3 | 1 | 3 | 1 | 0 |
| creative-suite | Educational | aspirational | 5 | 3 | 2 | 3 | 2 | 0 |
| cloud-ops | Educational | aspirational | 5 | 3 | 2 | 3 | 2 | 0 |
| **Totals** | | | **48** | **28** | **20** | **28** | **17** | **3** |

### Severity Distribution

| Severity | Count | Percentage | Pattern |
|----------|-------|------------|---------|
| BROKEN | 28 | 58.3% | All hard-blocks edges produce BROKEN severity |
| DEGRADED | 17 | 35.4% | All soft-enhances edges produce DEGRADED severity |
| MINIMAL-IMPACT | 3 | 6.3% | Wetty-tmux superseded edges (#21, #38) + wetty-tmux itself (0 outgoing) |

**Key finding:** The severity distribution exactly mirrors the edge type distribution (28 hard-blocks = 28 BROKEN, 20 soft-enhances = 17 DEGRADED + 3 MINIMAL-IMPACT). The 3 MINIMAL-IMPACT entries are the 2 wetty-tmux superseded edges plus wetty-tmux's zero-outgoing-edge entry. Severity is deterministic from edge type -- there are no soft-enhances edges that produce BROKEN severity and no hard-blocks edges that produce DEGRADED severity.
