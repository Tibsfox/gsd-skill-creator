# Ecosystem Dependency Map: Edge Inventory

**Generated:** 2026-02-19
**Purpose:** Complete set of typed, directed edges between ecosystem DAG nodes, with concrete interfaces and cycle analysis. Combined with the [node inventory](./node-inventory.md), this constitutes the full ecosystem DAG.

**Node set reference:** 20 nodes (16 internal + 4 external) from `node-inventory.md`

---

## Edge Classification Criteria

Three edge types classify the nature of each dependency. The classification test for each is deterministic:

### hard-blocks

**Definition:** Target must exist (at least partially) before source can be built. Removing target would make source non-functional or architecturally incoherent.

**Test:** "If target did not exist at all, could source be built and function?" If NO, the edge is hard-blocks.

**Examples:**
- chipset depends on skill-creator: chipset's entire purpose is to wire together skills -- without skill-creator, there are no skills to configure
- silicon depends on chipset: silicon.yaml extends chipset.yaml -- the configuration format is inherited

### soft-enhances

**Definition:** Source works without target but gains meaningful features or quality from it. Target improves source but is not required for source's core function.

**Test:** "Source functions independently but gains capabilities from target." If YES, the edge is soft-enhances.

**Examples:**
- gsd-os lists wetty-tmux as a dependency, but the desktop app adopted native PTY instead -- the dependency was architectural guidance, not a hard requirement
- staging references silicon for adapter quarantine, but staging's core intake/analysis works without any ML pipeline

### shares-infrastructure

**Definition:** Both nodes consume a common pattern, format, or convention without one blocking the other. Neither can be said to "depend on" the other -- they share an interface.

**Test:** "Neither node blocks the other; they share a convention, format, or pattern." If YES, the edge is shares-infrastructure.

**Examples:**
- bbs-pack and creative-suite both reference gsd-os as a host platform and share the educational pack format
- planning-docs and dashboard-console both produce/consume `.planning/` directory artifacts

---

## Full Edge Table

Every edge extracted from deep reading of vision documents. Each edge has: source (the dependent), target (the dependency), type, at least one concrete interface, and evidence citation.

| # | Source | Target | Type | Concrete Interface(s) | Evidence |
|---|--------|--------|------|-----------------------|----------|
| 1 | chipset | skill-creator | hard-blocks | `.chipset/chipset.yaml` skills section; `token_budget_weight` field per skill; skill-creator's 6-stage pipeline (Score/Resolve/ModelFilter/CacheOrder/Budget/Load) | Chipset vision: "skills.required" and "skills.recommended" arrays reference skill-creator-managed skills; token budget pipeline operates within chipset constraints |
| 2 | chipset | skill-creator | hard-blocks | Agent composition feature (`agents.topology`, `agents.router.routes`); co-activation analysis for chipset refinement | Chipset vision: "skill-creator's agent composition creates new specialist agents that can be added to the chipset's topology" |
| 3 | silicon | chipset | hard-blocks | `silicon.yaml` extends `.chipset/chipset.yaml`; chipset intent classifier selects which LoRA to hot-swap | Silicon spec: "silicon.yaml declares base model, adapters, routing, budgets"; "chipset's intent classifier selects which LoRA to hot-swap" |
| 4 | silicon | skill-creator | hard-blocks | SessionObserver training pair extraction pipeline (`.chipset/training/pairs/*.jsonl`); pattern detection feeding adapter training | Silicon spec: "skill-creator's SessionObserver captures patterns... The Silicon Layer adds a parallel data path: training pairs" |
| 5 | staging | skill-creator | hard-blocks | SessionObserver observation pipeline; bounded learning constraints (3+ repetitions, 7-day cooldown, 20% change cap) | Staging vision: "Depends on: gsd-skill-creator-analysis.md"; staging leverages skill-creator's pattern detection for resource planning |
| 6 | staging | chipset | soft-enhances | `.chipset/chipset.yaml` for available skills, agents, token budgets; chipset refinement recommendations | Staging vision: "resource analysis phase reads the active chipset to understand available skills, agents, and token budgets" |
| 7 | staging | dashboard-console | hard-blocks | `.planning/console/inbox/`, `.planning/console/outbox/` filesystem message bus; `milestone-config.json`; staging queue panel renders in dashboard | Staging vision: "Depends on: gsd-dashboard-console-milestone-ingestion.md"; "upload/configure flow feeds into staging layer's intake" |
| 8 | staging | silicon | soft-enhances | Community adapter quarantine check; pre-quarantine hygiene step before adapter evaluation pipeline | Staging vision: "Community adapters pass through the hygiene check before entering the adapter quarantine pipeline" |
| 9 | creative-suite | amiga-leverage | hard-blocks | Progressive capability pipeline (Level 1-4: BASIC/C/Assembly/Hardware); promotion pipeline architecture (observe/detect/suggest/apply/learn/compose) | Creative suite vision: "Depends on: gsd-amiga-vision-architectural-leverage.md"; curriculum follows the progressive depth principle |
| 10 | creative-suite | gsd-os | hard-blocks | GSD-OS desktop shell as host platform; WebGL rendering engine; block-based interaction model; educational curriculum framework (Levels 1-4) | Creative suite vision: "Depends on: gsd-os-desktop-vision.md"; all 8 applications run within GSD-OS |
| 11 | creative-suite | chipset | soft-enhances | `.chipset/chipset.yaml` for educational chipset definitions; skill loading per application pack | Creative suite vision: "Depends on: gsd-chipset-architecture-vision.md"; chipset provides skill/agent configuration for each pack |
| 12 | creative-suite | silicon | soft-enhances | Silicon layer's LoRA adapters for "The AI Workshop" (Pack 8); local inference demonstration | Creative suite vision: "Depends on: gsd-silicon-layer-spec.md"; the AI Workshop pack teaches neural nets using silicon layer |
| 13 | creative-suite | bbs-pack | hard-blocks | BBS & Internet educational pack (Pack 2: "The Network") as prerequisite curriculum; modem simulator shared component | Creative suite vision: "Depends on: gsd-bbs-educational-pack-vision.md"; BBS pack is Pack 2 in the learning path sequence |
| 14 | gsd-os | amiga-leverage | hard-blocks | Progressive depth principle (Levels 1-4); Amiga Hardware Reference Manual design philosophy; DMA/coprocessor architecture pattern | GSD-OS vision: "Depends on: gsd-amiga-vision-architectural-leverage.md"; entire design philosophy derives from Amiga Principle |
| 15 | gsd-os | chipset | hard-blocks | `.chipset/chipset.yaml` consumed at `new-project`, `plan-phase`, `execute-phase`, `verify-work`; agent topology activation; file-change triggers | GSD-OS vision: "Depends on: gsd-chipset-architecture-vision.md"; chipset governs skill loading, agent routing, triggers throughout GSD-OS |
| 16 | gsd-os | skill-creator | hard-blocks | Skill loading pipeline; `SessionObserver` for pattern capture; agent composition (`/.claude/agents/`); GSD Orchestrator 5-stage classification | GSD-OS vision: "Depends on: gsd-skill-creator-analysis.md"; skill-creator is the learning/evolution layer the desktop app builds on |
| 17 | gsd-os | staging | soft-enhances | `.planning/staging/inbox/` intake pipeline; work analysis before execution; security hygiene for uploaded content | GSD-OS vision: "Depends on: gsd-staging-layer-vision.md"; staging provides pre-execution planning but GSD-OS can function without it |
| 18 | gsd-os | dashboard-console | soft-enhances | `.planning/console/` bidirectional message bus; dashboard renders inside GSD-OS application; chipset status panel | GSD-OS vision: "Depends on: gsd-dashboard-console-milestone-ingestion.md"; console provides cockpit view but desktop functions without it |
| 19 | gsd-os | planning-docs | soft-enhances | `.planning/docs/` HTML output; JSON-LD structured data; auto-refresh mechanism; dashboard embedded in application | GSD-OS vision: "Depends on: gsd-planning-docs-vision.md"; planning docs dashboard provides observability layer |
| 20 | gsd-os | info-design | hard-blocks | Subway map topology visualization; highway numbering convention for agents/skills; typography system (tabular numerals, weight hierarchy); color-as-identity system | GSD-OS vision: "Depends on: information-design-conversation.md"; design system governs all visual presentation |
| 21 | gsd-os | wetty-tmux | soft-enhances | Terminal-in-browser pattern via Wetty/SSH/tmux; architecture subsequently superseded by native Tauri PTY | GSD-OS vision: "Depends on: wetty-tmux-guide.md"; referenced as dependency but native PTY adopted instead (permanently deferred) |
| 22 | lcp | bootstrap | hard-blocks | GSD Bootstrap Steps 1-8 as prerequisite; development environment setup; Git configuration; SSH key generation | LCP vision: "Depends on: gsd-bootstrap-onboarding-vision.md"; "Prerequisite: GSD Bootstrap complete (Step 1-8)" |
| 23 | lcp | centos-guide | hard-blocks | CentOS Stream 9 infrastructure guide; VM configuration patterns; network topology reference; firewalld/SELinux setup | LCP vision: "Depends on: gsd-centos-cloud-infrastructure-guide.md"; LCP implements the infrastructure the guide describes |
| 24 | lcp | minecraft-world | soft-enhances | Minecraft server deployment as proof-of-concept workload; `render-pxe-menu.sh` provisioning pattern; server.properties templating | LCP vision: "Depends on: gsd-minecraft-knowledge-world-vision.md"; Minecraft world is a validation workload, not required for LCP core |
| 25 | lcp | chipset | soft-enhances | `.chipset/chipset.yaml` for infrastructure project archetype; skill loading for provisioning workflows | LCP vision: "Depends on: gsd-chipset-architecture-vision.md"; chipset provides project configuration but LCP functions with raw GSD workflow |
| 26 | bbs-pack | skill-creator | hard-blocks | Educational module format as skill-creator pack; observation/skill/knowledge pipeline as pedagogical framework | BBS vision: "Depends on: gsd-skill-creator-analysis.md"; "ships as a skill-creator educational module" |
| 27 | bbs-pack | chipset | soft-enhances | `.chipset/chipset.yaml` for BBS educational chipset; skill groupings for door games and networking labs | BBS vision: "Depends on: gsd-chipset-architecture-vision.md"; chipset provides configuration but BBS content is standalone |
| 28 | bbs-pack | amiga-leverage | hard-blocks | Amiga Principle (architectural leverage over raw power); progressive capability pipeline; shareware/demo scene community model | BBS vision: "Depends on: gsd-amiga-vision-architectural-leverage.md"; BBS era embodies the Amiga Principle |
| 29 | bbs-pack | gsd-os | hard-blocks | GSD-OS desktop shell as host environment; terminal interface for BBS rendering; xterm-compatible terminal emulation | BBS vision: "Depends on: gsd-os-desktop-vision.md"; "launches the BBS experience from within... the future GSD-OS shell" |
| 30 | cloud-ops | bootstrap | hard-blocks | GSD Bootstrap as prerequisite for environment setup; development tools and configuration | Cloud-ops vision: "Depends on: gsd-bootstrap-onboarding-vision.md"; bootstrap is the starting point for all curriculum paths |
| 31 | cloud-ops | lcp | hard-blocks | Local cloud environment (VMs, networking, storage) as lab infrastructure; PXE boot and provisioning templates | Cloud-ops vision: "Depends on: gsd-local-cloud-provisioning-vision.md"; cloud-ops curriculum requires working local cloud |
| 32 | cloud-ops | centos-guide | hard-blocks | CentOS Stream 9 as base OS for all cloud labs; VM configuration, network setup, service management | Cloud-ops vision: "Depends on: gsd-centos-cloud-infrastructure-guide.md"; curriculum built on CentOS infrastructure |
| 33 | cloud-ops | creative-suite | soft-enhances | Educational curriculum integration; shared progressive learning methodology; math engine for data analysis | Cloud-ops vision: "Depends on: gsd-amiga-creative-suite-vision.md"; creative suite provides complementary educational content |
| 34 | cloud-ops | space-between | soft-enhances | "The Space Between" unit circle analogy for progressive learning; mathematical/philosophical framework for curriculum design | Cloud-ops vision: "Depends on: the-space-between.pdf"; unit circle concept structures the pedagogical approach |
| 35 | dashboard-console | planning-docs | hard-blocks | `.planning/docs/` HTML output as base layer; auto-refresh mechanism; JSON-LD structured data; generator script architecture | Dashboard-console vision: "Depends on: gsd-planning-docs-vision.md"; console extends the read-only dashboard into bidirectional control |
| 36 | dashboard-console | chipset | soft-enhances | `.chipset/chipset.yaml` status display; chipset overview panel in dashboard; agent activity visualization | Dashboard-console vision: "Depends on: gsd-chipset-architecture-vision.md"; dashboard shows chipset status but functions without chipset |
| 37 | dashboard-console | info-design | hard-blocks | Subway map topology; highway gantry metaphor for dispatch center; color-as-identity system; typography hierarchy | Dashboard-console vision: "Depends on: information-design-conversation.md"; "if the dashboard is the overhead highway gantry showing real-time status, the console is the dispatch center" |
| 38 | dashboard-console | wetty-tmux | soft-enhances | Browser-based terminal embedding via iframe; SSH session access pattern | Dashboard-console vision: "Depends on: wetty-tmux-guide.md"; Wetty iframe embedding concept, though native PTY superseded this |
| 39 | amiga-leverage | skill-creator | soft-enhances | SessionObserver pipeline as pattern detection (observation/detect/suggest/apply/learn/compose loop); promotion pipeline concept | Amiga-leverage body: references skill-creator's six-step loop and promotion pipeline; architectural philosophy builds on skill-creator as the learning layer |
| 40 | amiga-workbench | amiga-leverage | hard-blocks | Amiga I/O philosophy (ports as first-class citizens); Hardware Reference Manual transparency principle; progressive depth (Levels 1-4) | Amiga-workbench body: entire document builds on Amiga Principle; "design principles -- lessons from Amiga history" section |
| 41 | amiga-workbench | gsd-os | hard-blocks | GSD-OS Tauri desktop shell as host platform; WebGL rendering engine; window manager (`desktop/src/wm/`); Workbench UI layer | Amiga-workbench body: Workbench is the physical-digital integration layer of GSD-OS; hardware I/O routes through the desktop app |
| 42 | gsd-isa | chipset | hard-blocks | `.chipset/chipset.yaml` schema as configuration layer; agent topology (bus architecture); token budget (bandwidth allocation) | ISA vision body: "The GSD System Bus" directly maps chipset concepts; instruction set formalizes chipset's inter-agent communication |
| 43 | gsd-isa | skill-creator | hard-blocks | `SessionObserver` pipeline as observation pipeline (PUSH/POP opcodes); skill loading (LOAD SK opcode); agent composition | ISA vision body: ISA registers map to skill-creator concepts (SK = active skill register, SP = observation pipeline depth) |
| 44 | gsd-isa | amiga-leverage | hard-blocks | Amiga Hardware Reference Manual as design model; custom chipset (Agnus/Denise/Paula) as architectural template; DMA channel concept | ISA vision body: "The Amiga's custom chipset... was a set of coprocessors"; ISA is explicitly "the Hardware Reference Manual" for GSD |
| 45 | gsd-isa | silicon | soft-enhances | Local inference via LoRA adapters as "custom chips" executing ISA instructions; VRAM budget as "bandwidth allocation" | ISA vision body: ISA references silicon layer as execution target for compiled instructions; silicon makes the hardware metaphor literal |
| 46 | planning-docs | skill-creator | soft-enhances | GSD workflow trigger points (on plan-phase, execute-phase, verify-work, complete-milestone); skill metadata.yaml format | Planning-docs vision: "skill integrates cleanly with GSD's workflow phases"; planning-docs is a GSD skill consuming skill-creator's framework |
| 47 | info-design | planning-docs | soft-enhances | Dashboard as the visual target; `.planning/docs/` HTML pages as the canvas for design principles | Info-design body: entire conversation references planning docs dashboard as the application of design principles |
| 48 | chipset | planning-docs | soft-enhances | `.planning/docs/` dashboard gains chipset overview panel, agent activity panel, skill activation log, budget health display | Chipset vision: "the dashboard gains a chipset view: Chipset Overview panel, Agent Activity panel, Skill Activation log, Budget Health" |

---

## Edges by Source Node

Grouped by source to show: what does each component depend on?

### Core Layer

**skill-creator** (0 outgoing edges)
- Root node. No dependencies on other ecosystem components. Foundational analysis and learning layer.

**amiga-leverage** (1 outgoing edge)
- #39: amiga-leverage -> skill-creator (soft-enhances) -- references promotion pipeline

**info-design** (1 outgoing edge)
- #47: info-design -> planning-docs (soft-enhances) -- dashboard as visual target

### Middleware Layer

**chipset** (3 outgoing edges)
- #1, #2: chipset -> skill-creator (hard-blocks) -- skills section, agent composition
- #48: chipset -> planning-docs (soft-enhances) -- dashboard chipset panel

**staging** (4 outgoing edges)
- #5: staging -> skill-creator (hard-blocks) -- observation pipeline
- #6: staging -> chipset (soft-enhances) -- resource analysis reads chipset
- #7: staging -> dashboard-console (hard-blocks) -- intake from console
- #8: staging -> silicon (soft-enhances) -- adapter quarantine

**silicon** (2 outgoing edges)
- #3: silicon -> chipset (hard-blocks) -- silicon.yaml extends chipset.yaml
- #4: silicon -> skill-creator (hard-blocks) -- training pair extraction

**gsd-isa** (4 outgoing edges)
- #42: gsd-isa -> chipset (hard-blocks) -- bus architecture formalization
- #43: gsd-isa -> skill-creator (hard-blocks) -- observation pipeline opcodes
- #44: gsd-isa -> amiga-leverage (hard-blocks) -- Hardware Reference Manual model
- #45: gsd-isa -> silicon (soft-enhances) -- local inference as execution target

### Platform Layer

**gsd-os** (8 outgoing edges)
- #14: gsd-os -> amiga-leverage (hard-blocks) -- design philosophy
- #15: gsd-os -> chipset (hard-blocks) -- chipset-aware workflow
- #16: gsd-os -> skill-creator (hard-blocks) -- skill loading, orchestrator
- #17: gsd-os -> staging (soft-enhances) -- pre-execution planning
- #18: gsd-os -> dashboard-console (soft-enhances) -- cockpit view
- #19: gsd-os -> planning-docs (soft-enhances) -- observability dashboard
- #20: gsd-os -> info-design (hard-blocks) -- visual design system
- #21: gsd-os -> wetty-tmux (soft-enhances) -- terminal pattern (superseded)

**planning-docs** (1 outgoing edge)
- #46: planning-docs -> skill-creator (soft-enhances) -- GSD workflow integration

**dashboard-console** (4 outgoing edges)
- #35: dashboard-console -> planning-docs (hard-blocks) -- extends read-only dashboard
- #36: dashboard-console -> chipset (soft-enhances) -- chipset status display
- #37: dashboard-console -> info-design (hard-blocks) -- design system
- #38: dashboard-console -> wetty-tmux (soft-enhances) -- terminal embedding (superseded)

**lcp** (4 outgoing edges)
- #22: lcp -> bootstrap (hard-blocks) -- environment prerequisite
- #23: lcp -> centos-guide (hard-blocks) -- infrastructure reference
- #24: lcp -> minecraft-world (soft-enhances) -- validation workload
- #25: lcp -> chipset (soft-enhances) -- project configuration

**amiga-workbench** (2 outgoing edges)
- #40: amiga-workbench -> amiga-leverage (hard-blocks) -- I/O philosophy
- #41: amiga-workbench -> gsd-os (hard-blocks) -- desktop host platform

**wetty-tmux** (0 outgoing edges)
- Leaf node (permanently deferred). No dependencies. Technical reference document.

### Educational Layer

**bbs-pack** (4 outgoing edges)
- #26: bbs-pack -> skill-creator (hard-blocks) -- educational module format
- #27: bbs-pack -> chipset (soft-enhances) -- educational chipset
- #28: bbs-pack -> amiga-leverage (hard-blocks) -- Amiga Principle
- #29: bbs-pack -> gsd-os (hard-blocks) -- host platform

**creative-suite** (5 outgoing edges)
- #9: creative-suite -> amiga-leverage (hard-blocks) -- progressive capability
- #10: creative-suite -> gsd-os (hard-blocks) -- host platform
- #11: creative-suite -> chipset (soft-enhances) -- educational chipset
- #12: creative-suite -> silicon (soft-enhances) -- AI Workshop adapter
- #13: creative-suite -> bbs-pack (hard-blocks) -- curriculum prerequisite

**cloud-ops** (5 outgoing edges)
- #30: cloud-ops -> bootstrap (hard-blocks) -- environment prerequisite
- #31: cloud-ops -> lcp (hard-blocks) -- lab infrastructure
- #32: cloud-ops -> centos-guide (hard-blocks) -- base OS
- #33: cloud-ops -> creative-suite (soft-enhances) -- curriculum integration
- #34: cloud-ops -> space-between (soft-enhances) -- pedagogical framework

### External Layer

**bootstrap** (0 outgoing edges) -- External root node
**centos-guide** (0 outgoing edges) -- External root node
**minecraft-world** (0 outgoing edges) -- External root node
**space-between** (0 outgoing edges) -- External root node

---

## Edges by Target Node

Grouped by target to show: which components depend on each node? This reveals which nodes are most critical.

### skill-creator (9 incoming edges) -- MOST DEPENDED-ON

| # | Source | Type | Interface |
|---|--------|------|-----------|
| 1-2 | chipset | hard-blocks | chipset.yaml skills, agent composition |
| 4 | silicon | hard-blocks | training pair extraction |
| 5 | staging | hard-blocks | observation pipeline |
| 16 | gsd-os | hard-blocks | skill loading, orchestrator |
| 26 | bbs-pack | hard-blocks | educational module format |
| 39 | amiga-leverage | soft-enhances | promotion pipeline reference |
| 43 | gsd-isa | hard-blocks | observation pipeline opcodes |
| 46 | planning-docs | soft-enhances | workflow integration |

### chipset (8 incoming edges) -- SECOND MOST DEPENDED-ON

| # | Source | Type | Interface |
|---|--------|------|-----------|
| 3 | silicon | hard-blocks | silicon.yaml extends chipset.yaml |
| 6 | staging | soft-enhances | resource analysis reads chipset |
| 11 | creative-suite | soft-enhances | educational chipset |
| 15 | gsd-os | hard-blocks | chipset-aware workflow |
| 25 | lcp | soft-enhances | project configuration |
| 27 | bbs-pack | soft-enhances | educational chipset |
| 36 | dashboard-console | soft-enhances | chipset status display |
| 42 | gsd-isa | hard-blocks | bus architecture formalization |

### amiga-leverage (5 incoming edges)

| # | Source | Type | Interface |
|---|--------|------|-----------|
| 9 | creative-suite | hard-blocks | progressive capability pipeline |
| 14 | gsd-os | hard-blocks | design philosophy |
| 28 | bbs-pack | hard-blocks | Amiga Principle |
| 40 | amiga-workbench | hard-blocks | I/O philosophy |
| 44 | gsd-isa | hard-blocks | Hardware Reference Manual model |

### gsd-os (4 incoming edges)

| # | Source | Type | Interface |
|---|--------|------|-----------|
| 10 | creative-suite | hard-blocks | host platform |
| 29 | bbs-pack | hard-blocks | host platform |
| 41 | amiga-workbench | hard-blocks | desktop host platform |

### planning-docs (3 incoming edges)

| # | Source | Type | Interface |
|---|--------|------|-----------|
| 19 | gsd-os | soft-enhances | observability dashboard |
| 35 | dashboard-console | hard-blocks | extends read-only dashboard |
| 47 | info-design | soft-enhances | visual target |

### info-design (2 incoming edges)

| # | Source | Type | Interface |
|---|--------|------|-----------|
| 20 | gsd-os | hard-blocks | visual design system |
| 37 | dashboard-console | hard-blocks | design system |

### silicon (3 incoming edges)

| # | Source | Type | Interface |
|---|--------|------|-----------|
| 8 | staging | soft-enhances | adapter quarantine |
| 12 | creative-suite | soft-enhances | AI Workshop adapter |
| 45 | gsd-isa | soft-enhances | local inference target |

### dashboard-console (2 incoming edges)

| # | Source | Type | Interface |
|---|--------|------|-----------|
| 7 | staging | hard-blocks | filesystem message bus intake |
| 18 | gsd-os | soft-enhances | cockpit view |

### staging (1 incoming edge)

| # | Source | Type | Interface |
|---|--------|------|-----------|
| 17 | gsd-os | soft-enhances | pre-execution planning |

### bbs-pack (1 incoming edge)

| # | Source | Type | Interface |
|---|--------|------|-----------|
| 13 | creative-suite | hard-blocks | curriculum prerequisite |

### wetty-tmux (2 incoming edges)

| # | Source | Type | Interface |
|---|--------|------|-----------|
| 21 | gsd-os | soft-enhances | terminal pattern (superseded) |
| 38 | dashboard-console | soft-enhances | terminal embedding (superseded) |

### bootstrap (2 incoming edges)

| # | Source | Type | Interface |
|---|--------|------|-----------|
| 22 | lcp | hard-blocks | environment prerequisite |
| 30 | cloud-ops | hard-blocks | environment prerequisite |

### centos-guide (2 incoming edges)

| # | Source | Type | Interface |
|---|--------|------|-----------|
| 23 | lcp | hard-blocks | infrastructure reference |
| 32 | cloud-ops | hard-blocks | base OS |

### minecraft-world (1 incoming edge)

| # | Source | Type | Interface |
|---|--------|------|-----------|
| 24 | lcp | soft-enhances | validation workload |

### space-between (1 incoming edge)

| # | Source | Type | Interface |
|---|--------|------|-----------|
| 34 | cloud-ops | soft-enhances | pedagogical framework |

### lcp (1 incoming edge)

| # | Source | Type | Interface |
|---|--------|------|-----------|
| 31 | cloud-ops | hard-blocks | lab infrastructure |

### creative-suite (1 incoming edge)

| # | Source | Type | Interface |
|---|--------|------|-----------|
| 33 | cloud-ops | soft-enhances | curriculum integration |

### amiga-workbench (0 incoming edges) -- LEAF CONSUMER
### cloud-ops (0 incoming edges) -- LEAF CONSUMER

---

## Cycle Analysis

### Potential Cycles Investigated

The research identified potential mutual dependencies. Each was investigated:

**1. GSD-OS <-> BBS Pack**
- gsd-os does NOT depend on bbs-pack (no reference in GSD-OS vision's Depends-on header or body text)
- bbs-pack depends on gsd-os (hard-blocks: host platform)
- **Result:** No cycle. Unidirectional: bbs-pack -> gsd-os.

**2. Chipset <-> Planning-docs**
- chipset -> planning-docs (soft-enhances: dashboard gains chipset panel)
- planning-docs does NOT depend on chipset (planning-docs is a standalone documentation system)
- **Result:** No cycle. Unidirectional: chipset -> planning-docs.

**3. Skill-creator <-> Amiga-leverage**
- amiga-leverage -> skill-creator (soft-enhances: references promotion pipeline)
- skill-creator does NOT depend on amiga-leverage (skill-creator is foundational; amiga-leverage is design philosophy)
- **Result:** No cycle. Unidirectional: amiga-leverage -> skill-creator.

**4. Staging <-> Dashboard-console**
- staging -> dashboard-console (hard-blocks: intake from console)
- dashboard-console does NOT depend on staging (console is a control surface independent of staging layer)
- **Result:** No cycle. Unidirectional: staging -> dashboard-console.

**5. Info-design <-> Planning-docs**
- info-design -> planning-docs (soft-enhances: dashboard as visual target)
- planning-docs does NOT depend on info-design (planning-docs generates HTML without requiring design system)
- **Result:** No cycle. Unidirectional: info-design -> planning-docs.

### Topological Sort Verification

Manual topological sort of all 20 nodes (ordering nodes so every edge points from later to earlier in the order):

**Level 0 (Root providers -- zero outgoing edges, or only external dependencies):**
- skill-creator, planning-docs, info-design, wetty-tmux
- bootstrap, centos-guide, minecraft-world, space-between

**Level 1 (depend only on Level 0):**
- amiga-leverage (-> skill-creator)
- chipset (-> skill-creator, -> planning-docs)

**Level 2 (depend on Level 0-1):**
- silicon (-> chipset, -> skill-creator)
- dashboard-console (-> planning-docs, -> chipset, -> info-design, -> wetty-tmux)
- lcp (-> bootstrap, -> centos-guide, -> minecraft-world, -> chipset)

**Level 3 (depend on Level 0-2):**
- staging (-> skill-creator, -> chipset, -> dashboard-console, -> silicon)
- gsd-os (-> amiga-leverage, -> chipset, -> skill-creator, -> staging, -> dashboard-console, -> planning-docs, -> info-design, -> wetty-tmux)

**Level 4 (depend on Level 0-3):**
- bbs-pack (-> skill-creator, -> chipset, -> amiga-leverage, -> gsd-os)
- amiga-workbench (-> amiga-leverage, -> gsd-os)
- cloud-ops (-> bootstrap, -> lcp, -> centos-guide, -> creative-suite, -> space-between)

**Level 5 (depend on Level 0-4):**
- creative-suite (-> amiga-leverage, -> gsd-os, -> chipset, -> silicon, -> bbs-pack)

**Level 6 (depend on Level 0-5):**
- cloud-ops also depends on creative-suite (soft-enhances), placing it at Level 6 when considering that edge.

**Note:** cloud-ops appears at Level 4 via hard-blocks edges only (bootstrap, lcp, centos-guide are all Level 0-2). The creative-suite dependency (#33) is soft-enhances, meaning cloud-ops CAN be built without creative-suite. If only hard-blocks edges are considered, cloud-ops sits at Level 4.

The topological sort completes without contradiction. **No cycles exist in the graph.** Every node can be placed at a level where all its dependencies are at lower levels.

---

## Summary Statistics

### Totals

| Metric | Value |
|--------|-------|
| Total edges | 48 |
| Hard-blocks edges | 28 (58%) |
| Soft-enhances edges | 19 (40%) |
| Shares-infrastructure edges | 0 (0%) |
| Nodes with zero outgoing edges (root providers) | 6 (skill-creator, wetty-tmux, bootstrap, centos-guide, minecraft-world, space-between) |
| Nodes with zero incoming edges (leaf consumers) | 2 (amiga-workbench, cloud-ops) |
| Maximum incoming edges (most depended-on) | skill-creator (9) |
| Maximum outgoing edges (most dependent) | gsd-os (8) |
| Graph depth (topological sort levels) | 6 |
| Cycles found | 0 |

### Edge Type Distribution

| Type | Count | Percentage | Observation |
|------|-------|------------|-------------|
| hard-blocks | 28 | 58% | Higher than research expected (~minority); many declared dependencies in vision docs are genuinely blocking |
| soft-enhances | 19 | 40% | Represents enhancement/optional dependencies, particularly chipset and silicon references |
| shares-infrastructure | 0 | 0% | No pure shared-infrastructure edges found; all cross-references are directional dependencies |

**Note on hard-blocks proportion:** The research guidance that "most edges should be soft-enhances" assumed document references would often be non-blocking. In practice, the vision documents' explicit `Depends on:` headers declare genuinely blocking dependencies: you cannot build a BBS educational pack without a host platform (gsd-os), cannot build silicon without chipset.yaml, etc. The 58% hard-blocks rate reflects the architectural reality that this ecosystem has deep, genuine dependency chains.

### Most Depended-On Nodes (by incoming edge count)

| Node | Incoming Edges | Hard-Blocks In | Soft-Enhances In |
|------|---------------|----------------|------------------|
| skill-creator | 9 | 7 | 2 |
| chipset | 8 | 2 | 6 |
| amiga-leverage | 5 | 5 | 0 |
| gsd-os | 4 | 3 | 0* |
| planning-docs | 3 | 1 | 2 |
| info-design | 2 | 2 | 0 |
| silicon | 3 | 0 | 3 |
| bootstrap | 2 | 2 | 0 |
| centos-guide | 2 | 2 | 0 |

*gsd-os has 4 incoming edges, but the 4th (amiga-workbench -> gsd-os at #41) is hard-blocks, making all 4 hard-blocks when including amiga-workbench's dependency. Corrected: 3 hard-blocks (creative-suite, bbs-pack, amiga-workbench) + 0 soft-enhances from internal sources. The fourth count is amiga-workbench.

### Nodes with Zero Incoming Edges (Root Providers)

These nodes are depended upon by others but depend on nothing within the ecosystem:

| Node | Layer | Status | Outgoing Edges |
|------|-------|--------|---------------|
| skill-creator | Core | implemented | 0 |
| bootstrap | External | implemented | 0 |
| centos-guide | External | implemented | 0 |
| minecraft-world | External | implemented | 0 |
| space-between | External | implemented | 0 |
| wetty-tmux | Platform | permanently-deferred | 0 |

Note: planning-docs and info-design have zero hard-blocks outgoing edges (only soft-enhances), making them effectively independent for build sequencing purposes.

### Nodes with Zero Outgoing Edges (Leaf Consumers -- depend on others, nobody depends on them)

| Node | Layer | Status | Incoming Edges |
|------|-------|--------|---------------|
| cloud-ops | Educational | aspirational | 0 |
| amiga-workbench | Platform | partial | 0 |
