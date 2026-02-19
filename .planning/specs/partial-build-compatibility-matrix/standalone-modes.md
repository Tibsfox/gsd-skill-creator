# Per-Component Standalone Mode Specifications

**Created:** 2026-02-19
**Purpose:** Per-component standalone behavior specifications answering "can this component run alone?" for every node in the DAG. Documents minimum viable behavior at zero peers, what is lost per missing peer, and standalone viability ratings.
**Requirements:** COMPAT-07 (standalone mode documentation with viability ratings)
**Status:** Specification only -- no implementation code

**Source data:**
- Node inventory: `.planning/specs/ecosystem-dependency-map/node-inventory.md` (20 nodes, 16 internal)
- Edge inventory: `.planning/specs/ecosystem-dependency-map/edge-inventory.md` (48 typed edges)
- Dependency rules: `.planning/specs/dependency-philosophy/dependency-rules.md` (per-layer contracts)
- Degradation specs: `./degradation-specs.md` (per-edge degradation detail)
- Capability probe protocol: `./capability-probe-protocol.md` (Tier 1/2/3 detection)

**Standalone viability rating criteria:**
- **HIGH:** Component's core value proposition works without peers. Few or no hard-blocks outgoing edges.
- **MEDIUM:** Component provides useful subset of functionality alone. Some hard-blocks outgoing edges but core features survive.
- **LOW:** Component provides minimal value alone. Most features require peers.
- **NONE:** Component cannot function without at least one peer. All primary features depend on hard-blocks edges.

---

## Table of Contents

1. [Core Layer](#core-layer)
   - [skill-creator](#skill-creator-standalone-mode)
   - [amiga-leverage](#amiga-leverage-standalone-mode)
   - [info-design](#info-design-standalone-mode)
2. [Middleware Layer](#middleware-layer)
   - [chipset](#chipset-standalone-mode)
   - [staging](#staging-standalone-mode)
   - [silicon](#silicon-standalone-mode)
   - [gsd-isa](#gsd-isa-standalone-mode)
3. [Platform Layer](#platform-layer)
   - [gsd-os](#gsd-os-standalone-mode)
   - [planning-docs](#planning-docs-standalone-mode)
   - [dashboard-console](#dashboard-console-standalone-mode)
   - [lcp](#lcp-standalone-mode)
   - [amiga-workbench](#amiga-workbench-standalone-mode)
   - [wetty-tmux](#wetty-tmux-standalone-mode)
4. [Educational Layer](#educational-layer)
   - [bbs-pack](#bbs-pack-standalone-mode)
   - [creative-suite](#creative-suite-standalone-mode)
   - [cloud-ops](#cloud-ops-standalone-mode)
5. [Summary Table](#summary-table)

---

## Core Layer

### skill-creator (Standalone Mode)

**Node ID:** skill-creator
**Layer:** Core
**Current status:** implemented

**Minimum viable behavior (zero peers):**
- Observation pipeline captures session patterns via SessionObserver
- Pattern detection identifies repeating sequences, correction patterns, tool usage
- Skill suggestion engine proposes new skills from detected patterns
- Skill generation creates `.claude/commands/*.md` skill files
- Agent composition creates `.claude/agents/*.md` from co-activation analysis
- GSD Orchestrator provides 5-stage natural language routing to GSD commands
- Bounded learning enforces constraints (3+ repetitions, 7-day cooldown, 20% change cap)
- CLI interface (`skill-creator` command) for status, suggest, create, test operations
- Token budget management via 6-stage pipeline (Score/Resolve/ModelFilter/CacheOrder/Budget/Load)

**What is lost without each peer:**

| Missing Peer | Edge | Lost Capability | Severity |
|-------------|------|-----------------|----------|
| (none) | -- | Nothing -- skill-creator has zero outgoing edges | -- |

**Can function independently:** YES
**Standalone viability:** HIGH

**Notes:** skill-creator is the root node of the entire ecosystem. It has 9 incoming edges (most depended-on node) and zero outgoing edges. Its full value proposition is available standalone. This is the foundational component -- everything else builds on it. Tier 1 probe: `src/` root + `package.json` exports. Tier 2 probe: `.claude/commands/*.md` existence confirms skill generation has produced deliverables.

---

### amiga-leverage (Standalone Mode)

**Node ID:** amiga-leverage
**Layer:** Core
**Current status:** implemented

**Minimum viable behavior (zero peers):**
- Design philosophy document defining the Amiga Principle (architectural leverage over raw power)
- Progressive capability pipeline concept (observe/detect/suggest/apply/learn/compose)
- Progressive depth model (Levels 1-4: BASIC/C/Assembly/Hardware)
- DMA/coprocessor architecture metaphor for multi-agent systems
- Amiga Hardware Reference Manual design patterns as architectural templates
- AMIGA modules (`src/amiga/` types, registry, envelope, ICD, MC1, ME1, CE1, GL1) structurally embody the principles

**What is lost without each peer:**

| Missing Peer | Edge | Lost Capability | Severity |
|-------------|------|-----------------|----------|
| skill-creator | #39 (soft-enhances) | Loses the running exemplar of the progressive capability pipeline; six-step loop exists as theory without a demonstration system | DEGRADED |

**Can function independently:** YES
**Standalone viability:** HIGH

**Notes:** amiga-leverage is a design philosophy. Its value is as an architectural reference document and the principles embodied in `src/amiga/` modules. The only outgoing edge is soft-enhances to skill-creator (for pipeline demonstration), which means the design philosophy stands on its own. Tier 1 probe: `src/amiga/` existence.

---

### info-design (Standalone Mode)

**Node ID:** info-design
**Layer:** Core
**Current status:** implemented

**Minimum viable behavior (zero peers):**
- Design system specification defining visual language principles
- Subway map topology visualization pattern
- Highway gantry metaphor for status display
- Typography hierarchy (tabular numerals, weight system)
- Color-as-identity system (32-color indexed palette semantics)
- Design token definitions in `src/dashboard/design-system.ts`
- Entity shape rendering (`src/dashboard/entity-shapes.ts`)
- Entity legend component (`src/dashboard/entity-legend.ts`)

**What is lost without each peer:**

| Missing Peer | Edge | Lost Capability | Severity |
|-------------|------|-----------------|----------|
| planning-docs | #47 (soft-enhances) | Loses the visual canvas (HTML dashboard) where design principles are rendered; design tokens defined but not applied to output | DEGRADED |

**Can function independently:** YES
**Standalone viability:** HIGH

**Notes:** info-design is a design system specification. Its modules compile and define design tokens independently. The only outgoing edge is soft-enhances to planning-docs (as a rendering target). The design system has intrinsic value as a specification even without a rendering canvas. Tier 1 probe: `src/dashboard/design-system/` existence.

---

## Middleware Layer

### chipset (Standalone Mode)

**Node ID:** chipset
**Layer:** Middleware
**Current status:** partial

**Minimum viable behavior (zero peers):**
- `.chipset/chipset.yaml` configuration format defines skills, agents, teams, topologies, and budgets syntactically
- `src/chipset/blitter.ts`, `copper.ts`, `exec.ts`, `teams.ts`, `integration.ts` modules compile
- YAML schema validates structurally (keys, types, nesting)
- Configuration file can be authored, parsed, and validated for syntax
- Team topology definitions can be read (but not activated without agents)

**What is lost without each peer:**

| Missing Peer | Edge | Lost Capability | Severity |
|-------------|------|-----------------|----------|
| skill-creator | #1 (hard-blocks) | Cannot load, resolve, or configure skills; `skills.required` and `skills.recommended` arrays reference nothing; token budget pipeline has nothing to allocate | BROKEN |
| skill-creator | #2 (hard-blocks) | Cannot compose or route agents; `agents.topology` and `agents.router.routes` reference undefined agent definitions; co-activation analysis unavailable | BROKEN |
| planning-docs | #48 (soft-enhances) | Loses dashboard visualization panels (chipset overview, agent activity, skill activation log, budget health) | DEGRADED |

**Can function independently:** NO
**Standalone viability:** NONE

**Notes:** Chipset's entire purpose is to configure skills, agents, and teams that are managed by skill-creator. Without skill-creator, chipset is a configuration schema with no operational target. Both hard-blocks outgoing edges point to skill-creator, making it a strict dependency. The soft-enhances edge to planning-docs is the only non-critical edge. Tier 1 probe: `src/chipset/`. Tier 2 probe: `.chipset/chipset.yaml`.

---

### staging (Standalone Mode)

**Node ID:** staging
**Layer:** Middleware
**Current status:** partial

**Minimum viable behavior (zero peers):**
- Staging queue panel UI components exist (`src/dashboard/staging-queue-panel/`)
- Upload zone component exists (`src/dashboard/upload-zone/`)
- Question schema validation (`src/console/question-schema.ts`) can validate question formats
- Schema reader (`src/console/reader.ts`) can parse staging files
- Basic file intake (accept files into a directory) works without analysis

**What is lost without each peer:**

| Missing Peer | Edge | Lost Capability | Severity |
|-------------|------|-----------------|----------|
| skill-creator | #5 (hard-blocks) | Cannot analyze work via SessionObserver pattern detection; complexity estimation falls back to defaults; no pattern-informed resource planning | BROKEN |
| chipset | #6 (soft-enhances) | Cannot read chipset configuration for resource-aware analysis; uses default resource assumptions instead of chipset-defined skill/agent inventories | DEGRADED |
| dashboard-console | #7 (hard-blocks) | No intake pipeline -- filesystem message bus (`inbox/outbox/`), upload mechanism, and configuration interface are absent; staging has no content to process | BROKEN |
| silicon | #8 (soft-enhances) | Skips community adapter quarantine; security scanning proceeds without ML-specific hygiene verification | DEGRADED |

**Can function independently:** NO
**Standalone viability:** NONE

**Notes:** Staging has two hard-blocks outgoing edges (skill-creator for analysis, dashboard-console for intake). Without either, staging cannot perform its primary functions: it cannot receive content (no console) and cannot analyze it (no observation pipeline). The minimum viable behavior list above describes what the code modules can do structurally, but operationally staging is inert without its hard-blocks dependencies. Tier 1 probe: `src/dashboard/staging-queue-panel/`. Tier 2 probe: `src/console/question-schema.ts`.

---

### silicon (Standalone Mode)

**Node ID:** silicon
**Layer:** Middleware
**Current status:** aspirational

**Minimum viable behavior (zero peers):**
- `src/dashboard/silicon-panel.ts` exists as a dashboard visualization component for ML adapter status
- The panel renders silicon layer metrics (placeholder data in current implementation)
- No actual ML pipeline exists -- all silicon capabilities are aspirational

**What is lost without each peer:**

| Missing Peer | Edge | Lost Capability | Severity |
|-------------|------|-----------------|----------|
| chipset | #3 (hard-blocks) | No base configuration format (`silicon.yaml` extends `chipset.yaml`); no intent classifier for LoRA routing; no agent topology for adapter placement | BROKEN |
| skill-creator | #4 (hard-blocks) | No SessionObserver training pair extraction; no observation data for QLoRA fine-tuning; training pipeline has zero input | BROKEN |

**Can function independently:** NO
**Standalone viability:** NONE

**Notes:** Silicon is aspirational (ENVDEP, Group 2: deferred to v3.x). Both outgoing edges are hard-blocks. Even when eventually implemented, silicon cannot function without chipset (configuration backbone) and skill-creator (training data source). The existing `src/dashboard/silicon-panel.ts` is a visualization stub, not the ML pipeline itself. Tier 1 probe: `src/dashboard/silicon-panel/`. Tier 2 probe: none (no config expected for visualization stub).

---

### gsd-isa (Standalone Mode)

**Node ID:** gsd-isa
**Layer:** Middleware
**Current status:** aspirational

**Minimum viable behavior (zero peers):**
- Specification document defining RISC-inspired instruction set for inter-agent communication
- Instruction encoding format (GSD-I encoding) can be defined on paper
- Register set (8 general-purpose registers) can be specified
- No implementation exists -- entirely aspirational
- Note: The AGC ISA (`src/agc/`) is a separate educational component with 38 instructions, CPU emulation, and a DSKY interface. It is NOT the GSD workflow ISA.

**What is lost without each peer:**

| Missing Peer | Edge | Lost Capability | Severity |
|-------------|------|-----------------|----------|
| chipset | #42 (hard-blocks) | No bus architecture to formalize; ISA opcodes have no agent topology target; token budget bandwidth concept undefined | BROKEN |
| skill-creator | #43 (hard-blocks) | ISA registers (SK, SP) reference undefined skill-creator concepts; LOAD SK, PUSH/POP opcodes have no operational target | BROKEN |
| amiga-leverage | #44 (hard-blocks) | ISA loses its design foundation -- Amiga Hardware Reference Manual metaphor (Agnus/Denise/Paula mapping, DMA channels) | BROKEN |
| silicon | #45 (soft-enhances) | ISA operates through software pipeline only; cannot route instructions to GPU inference hardware; hardware metaphor remains purely metaphorical | DEGRADED |

**Can function independently:** NO
**Standalone viability:** NONE

**Notes:** GSD ISA is aspirational (ASPIR, Group 1: 32 items deferred to v2.x). It has 3 hard-blocks outgoing edges and 0 incoming edges. Even as a specification, the ISA's coherence depends on chipset (bus architecture), skill-creator (pipeline targets), and amiga-leverage (design philosophy). Without all three, the instruction set is internally inconsistent. Tier 1 probe: no marker (aspirational).

---

## Platform Layer

### gsd-os (Standalone Mode)

**Node ID:** gsd-os
**Layer:** Platform
**Current status:** partial

**Minimum viable behavior (zero peers):**
- Tauri desktop application launches (`src-tauri/tauri.conf.json`)
- Native PTY terminal via portable-pty (`src-tauri/src/pty/`)
- xterm.js terminal rendering (`desktop/src/terminal/`)
- tmux session integration (`desktop/src/tmux/`)
- Claude Code integration shell (`desktop/src/claude/`)
- IPC bridge between Rust backend and Vite webview (`desktop/src/ipc/`)
- Basic window rendering (without design system, uses browser defaults)
- File system operations through Tauri IPC
- Rust file watcher backend (`src-tauri/src/watcher.rs`)

**What is lost without each peer:**

| Missing Peer | Edge | Lost Capability | Severity |
|-------------|------|-----------------|----------|
| amiga-leverage | #14 (hard-blocks) | Loses design philosophy foundation; progressive depth model, DMA metaphor, and desktop architecture rationale are ungrounded | BROKEN |
| chipset | #15 (hard-blocks) | No skill/agent configuration at GSD lifecycle stages; no agent topology; no file-change automation triggers | BROKEN |
| skill-creator | #16 (hard-blocks) | Zero learning capability; no skill loading, no SessionObserver, no agent composition, no GSD Orchestrator routing | BROKEN |
| staging | #17 (soft-enhances) | No pre-execution work analysis or security scanning; work begins immediately without complexity estimation | DEGRADED |
| dashboard-console | #18 (soft-enhances) | No cockpit view; no in-app dashboard for status, session interaction, or chipset monitoring | DEGRADED |
| planning-docs | #19 (soft-enhances) | No embedded planning docs dashboard; no HTML visualization, no structured data overlays | DEGRADED |
| info-design | #20 (hard-blocks) | No design system; no subway map, gantry panels, typography hierarchy, or color-as-identity; UI uses browser defaults | BROKEN |
| wetty-tmux | #21 (soft-enhances) | No impact; native PTY supersedes Wetty; this is the production terminal implementation | MINIMAL-IMPACT |

**Can function independently:** NO
**Standalone viability:** LOW

**Notes:** GSD-OS has 8 outgoing edges (most dependent node in the ecosystem). Four are hard-blocks: amiga-leverage, chipset, skill-creator, and info-design. Without all four, GSD-OS functions only as a basic Tauri desktop application with a terminal emulator -- no adaptive capabilities, no design coherence, no workflow orchestration. The minimum viable behavior list above (terminal, file watcher, IPC) represents the raw desktop shell infrastructure without any of the GSD intelligence layer. The rating is LOW rather than NONE because the Tauri/xterm.js/PTY infrastructure provides a functional (if basic) terminal application. Tier 1 probe: `src-tauri/tauri.conf.json`. Tier 2 probe: `src-tauri/tauri.conf.json` (same file, configured = has window settings and plugin declarations).

---

### planning-docs (Standalone Mode)

**Node ID:** planning-docs
**Layer:** Platform
**Current status:** implemented

**Minimum viable behavior (zero peers):**
- Dashboard generator reads `.planning/` directory structure
- Parser extracts data from ROADMAP.md, STATE.md, PROJECT.md, phase plans, summaries
- Renderer produces HTML pages from parsed data
- Structured data module generates JSON-LD overlays
- Incremental regeneration detects changed files and re-renders affected pages
- Refresh mechanism serves updated HTML
- Collectors gather metrics from milestone history
- Metrics module computes velocity, completion rates, phase statistics
- Full `src/dashboard/` module set (30+ modules) operates as standalone TypeScript

**What is lost without each peer:**

| Missing Peer | Edge | Lost Capability | Severity |
|-------------|------|-----------------|----------|
| skill-creator | #46 (soft-enhances) | Loses GSD workflow integration (event-triggered regeneration on plan-phase, execute-phase, verify-work, complete-milestone); must trigger manually; not discoverable as a GSD skill | DEGRADED |

**Can function independently:** YES
**Standalone viability:** HIGH

**Notes:** Planning-docs has only 1 outgoing edge and it is soft-enhances. The dashboard generator functions as a standalone TypeScript module that reads `.planning/` files and produces HTML. Its core value proposition (visual project observability) is fully available without peers. The only loss is event-triggered automation through skill-creator's workflow hooks. Tier 1 probe: `src/dashboard/`.

---

### dashboard-console (Standalone Mode)

**Node ID:** dashboard-console
**Layer:** Platform
**Current status:** partial

**Minimum viable behavior (zero peers):**
- Console UI component structure exists (`src/dashboard/console-page/`, `src/dashboard/console-settings/`, `src/dashboard/console-activity/`)
- Upload zone component (`src/dashboard/upload-zone/`) can render an upload interface
- Config form (`src/dashboard/config-form/`) can render configuration inputs
- Submit flow (`src/dashboard/submit-flow/`) can render submission UI
- Question card (`src/dashboard/question-card/`) and poller (`src/dashboard/question-poller/`) exist
- Message handling (`src/console/message-handler.ts`) can process console messages
- Bridge logger (`src/console/bridge-logger.ts`) can log events

**What is lost without each peer:**

| Missing Peer | Edge | Lost Capability | Severity |
|-------------|------|-----------------|----------|
| planning-docs | #35 (hard-blocks) | No base HTML dashboard to extend; console UI elements have no rendering target; "Base dashboard not found" | BROKEN |
| chipset | #36 (soft-enhances) | No chipset status display, agent activity visualization, or budget health panels | DEGRADED |
| info-design | #37 (hard-blocks) | No design system; console renders with default/unstyled controls; no gantry metaphor, subway topology, or color-as-identity | BROKEN |
| wetty-tmux | #38 (soft-enhances) | No impact; native PTY integration supersedes Wetty iframe embedding | MINIMAL-IMPACT |

**Can function independently:** NO
**Standalone viability:** NONE

**Notes:** Dashboard-console has 2 hard-blocks outgoing edges (planning-docs and info-design). Without planning-docs, the console has no HTML layer to inject bidirectional controls into. Without info-design, the console has no visual language. The console is an extension layer on top of planning-docs -- it does not stand alone. The minimum viable behavior list describes individual UI components that exist as TypeScript modules but cannot render without the base dashboard. Tier 1 probe: `src/dashboard/console-page/`. Tier 2 probe: `src/console/milestone-config.ts`.

---

### lcp (Standalone Mode)

**Node ID:** lcp
**Layer:** Platform
**Current status:** partial

**Minimum viable behavior (zero peers):**
- `infra/` directory with provisioning scripts
- `render-pxe-menu.sh` generates PXE boot menus via shell substitution
- VM provisioning templates for KVM/libvirt
- Configuration management scripts for basic server setup
- SSH-based remote execution for provisioned VMs
- Network topology scripts for firewalld/bridge configuration

**What is lost without each peer:**

| Missing Peer | Edge | Lost Capability | Severity |
|-------------|------|-----------------|----------|
| bootstrap | #22 (hard-blocks) | LCP scripts fail on missing tools (Git, SSH keys, development tools); provisioning cannot proceed without bootstrapped environment | BROKEN |
| centos-guide | #23 (hard-blocks) | No target infrastructure; VMs, networking, and firewalld/SELinux configuration do not exist; LCP has nothing to provision | BROKEN |
| minecraft-world | #24 (soft-enhances) | No Minecraft server deployment option; LCP provisions other workloads normally | DEGRADED |
| chipset | #25 (soft-enhances) | No chipset-aware infrastructure project archetype; LCP uses default GSD workflow | DEGRADED |

**Can function independently:** NO
**Standalone viability:** LOW

**Notes:** LCP has 2 hard-blocks outgoing edges but both point to external nodes (bootstrap and centos-guide). These are human process prerequisites (environment setup, infrastructure deployment), not software component dependencies. If the developer has completed bootstrap and has CentOS infrastructure running, LCP functions fully with just its `infra/` scripts -- no other internal ecosystem components are required. The rating is LOW rather than NONE because the scripts themselves are self-contained; the dependencies are infrastructure prerequisites that are typically fulfilled once. Tier 1 probe: `infra/`. Tier 2 probe: `infra/scripts/render-pxe-menu.sh`.

---

### amiga-workbench (Standalone Mode)

**Node ID:** amiga-workbench
**Layer:** Platform
**Current status:** partial

**Minimum viable behavior (zero peers):**
- Workbench specification document defines hardware I/O integration patterns
- Vision for audio/MIDI, camera, GPIO, and creative production tools
- No standalone execution -- Workbench is a layer within GSD-OS, not an independent application

**What is lost without each peer:**

| Missing Peer | Edge | Lost Capability | Severity |
|-------------|------|-----------------|----------|
| amiga-leverage | #40 (hard-blocks) | Hardware I/O philosophy (ports as first-class, transparency principle) has no design foundation; Workbench design is ungrounded | BROKEN |
| gsd-os | #41 (hard-blocks) | No host platform; no Tauri application, WebGL engine, or window manager to render within; Workbench cannot launch | BROKEN |

**Can function independently:** NO
**Standalone viability:** NONE

**Notes:** Amiga-workbench is a layer within GSD-OS, not an independent application. Both outgoing edges are hard-blocks. Without gsd-os, there is no host environment. Without amiga-leverage, the design is incoherent. The existing `desktop/src/wm/` code (window manager, taskbar, pixel-art icons) is part of gsd-os's codebase and does not function as a separate component. Amiga-workbench has 0 incoming edges -- it is a leaf consumer. Its partial status does not block any other component. Tier 1 probe: `desktop/src/wm/`.

---

### wetty-tmux (Standalone Mode)

**Node ID:** wetty-tmux
**Layer:** Platform
**Current status:** permanently-deferred

**Minimum viable behavior (zero peers):**
- N/A -- component will not be built
- Architecture superseded by Tauri native PTY (`src-tauri/src/pty/`, `desktop/src/terminal/`)
- Existing as reference document only (historical architectural influence on terminal design)

**What is lost without each peer:**

| Missing Peer | Edge | Lost Capability | Severity |
|-------------|------|-----------------|----------|
| (none) | -- | wetty-tmux has zero outgoing edges | -- |

**Can function independently:** N/A (permanently deferred)
**Standalone viability:** N/A

**Notes:** wetty-tmux is the only permanently deferred node in the ecosystem (PERM, Group 4: 9 items). It will not be built. Its functionality is fully superseded by native PTY. Two incoming soft-enhances edges (#21, #38) exist as historical references only; both source components (gsd-os, dashboard-console) function fully without it.

---

## Educational Layer

### bbs-pack (Standalone Mode)

**Node ID:** bbs-pack
**Layer:** Educational
**Current status:** aspirational

**Minimum viable behavior (zero peers):**
- Vision document defining BBS/early internet educational curriculum
- Curriculum outline: modem simulator, ANSI art renderer, BBS main menu, door games, MUD/MUCK interface, FidoNet simulation, student/player mode toggle
- No implementation exists -- entirely aspirational

**What is lost without each peer:**

| Missing Peer | Edge | Lost Capability | Severity |
|-------------|------|-----------------|----------|
| skill-creator | #26 (hard-blocks) | No educational module format; no skill-creator packaging system to deliver content through | BROKEN |
| chipset | #27 (soft-enhances) | No BBS educational chipset with door game and networking lab skill groupings | DEGRADED |
| amiga-leverage | #28 (hard-blocks) | Educational philosophy (BBS era as exemplar of Amiga Principle) loses design rationale | BROKEN |
| gsd-os | #29 (hard-blocks) | No host platform; no terminal emulator for BBS rendering; no desktop shell | BROKEN |

**Can function independently:** NO
**Standalone viability:** NONE

**Notes:** BBS-pack has 3 hard-blocks outgoing edges. It requires skill-creator (module format), amiga-leverage (educational philosophy), and gsd-os (host platform). Without all three, BBS-pack cannot deliver its content. As an aspirational component with no implementation, it has no standalone capability. Tier 1 probe: no marker (aspirational).

---

### creative-suite (Standalone Mode)

**Node ID:** creative-suite
**Layer:** Educational
**Current status:** aspirational

**Minimum viable behavior (zero peers):**
- Vision document defining 8-application educational curriculum
- Application outlines: System Guide, The Network (BBS), GSD-Paint, GSD-Tracker, GSD-Animate, Hard Drive Module, Math Engine, AI Workshop
- Progressive depth learning path concept (Levels 1-4)
- No implementation exists -- entirely aspirational

**What is lost without each peer:**

| Missing Peer | Edge | Lost Capability | Severity |
|-------------|------|-----------------|----------|
| amiga-leverage | #9 (hard-blocks) | Progressive depth principle (Levels 1-4) has no architectural justification; 8 applications lose coherent learning path | BROKEN |
| gsd-os | #10 (hard-blocks) | No host platform; no WebGL engine, block-based interaction, or curriculum framework; applications cannot launch | BROKEN |
| chipset | #11 (soft-enhances) | No per-application educational chipset definitions; applications use default skill configuration | DEGRADED |
| silicon | #12 (soft-enhances) | AI Workshop (Pack 8) loses hands-on ML component; operates in theory-only mode; other 7 packs unaffected | DEGRADED |
| bbs-pack | #13 (hard-blocks) | Curriculum gap -- Pack 2 ("The Network") missing from learning sequence; modem simulator shared component unavailable | BROKEN |

**Can function independently:** NO
**Standalone viability:** NONE

**Notes:** Creative-suite has 3 hard-blocks outgoing edges (amiga-leverage, gsd-os, bbs-pack) and is at the deepest level in the topological sort (Level 5). It depends on both platform and educational peers. Without gsd-os as a host platform and bbs-pack as Pack 2, the curriculum is structurally incomplete. As an aspirational component, it has no standalone capability. It also has 1 incoming edge (cloud-ops, soft-enhances), so its absence degrades cloud-ops but does not break it. Tier 1 probe: no marker (aspirational).

---

### cloud-ops (Standalone Mode)

**Node ID:** cloud-ops
**Layer:** Educational
**Current status:** aspirational

**Minimum viable behavior (zero peers):**
- Vision document defining 6 curriculum modules (containers, VMs, networking, storage, monitoring, orchestration)
- 3 entry points (containers, VMs, bare metal) with concept transfer tables
- OpenStack architecture mapping
- Podman container path curriculum outline
- No implementation exists -- entirely aspirational

**What is lost without each peer:**

| Missing Peer | Edge | Lost Capability | Severity |
|-------------|------|-----------------|----------|
| bootstrap | #30 (hard-blocks) | Student environment not set up; lab exercises fail on missing tools | BROKEN |
| lcp | #31 (hard-blocks) | No local cloud lab infrastructure; no VMs, PXE boot, or networking exercises; curriculum is theory-only | BROKEN |
| centos-guide | #32 (hard-blocks) | No CentOS infrastructure; labs reference CentOS-specific commands and configurations that do not exist | BROKEN |
| creative-suite | #33 (soft-enhances) | No curriculum integration; math engine for data analysis unavailable; students use CLI tools instead | DEGRADED |
| space-between | #34 (soft-enhances) | No unit-circle-based curriculum progression model; modules follow standard sequential ordering | DEGRADED |

**Can function independently:** NO
**Standalone viability:** NONE

**Notes:** Cloud-ops has 3 hard-blocks outgoing edges, all pointing to infrastructure prerequisites (bootstrap, lcp, centos-guide). Without working infrastructure, the curriculum is documentation-only. Cloud-ops has 0 incoming edges -- it is a leaf consumer. Its absence has zero downstream impact on the ecosystem. As an aspirational component, it has no standalone capability. Tier 1 probe: no marker (aspirational).

---

## Summary Table

| Component | Layer | Status | Outgoing Edges | Hard-blocks Out | Standalone Viability | Can Function Independently |
|-----------|-------|--------|---------------|-----------------|---------------------|---------------------------|
| skill-creator | Core | implemented | 0 | 0 | **HIGH** | YES |
| amiga-leverage | Core | implemented | 1 | 0 | **HIGH** | YES |
| info-design | Core | implemented | 1 | 0 | **HIGH** | YES |
| chipset | Middleware | partial | 3 | 2 | **NONE** | NO |
| staging | Middleware | partial | 4 | 2 | **NONE** | NO |
| silicon | Middleware | aspirational | 2 | 2 | **NONE** | NO |
| gsd-isa | Middleware | aspirational | 4 | 3 | **NONE** | NO |
| gsd-os | Platform | partial | 8 | 4 | **LOW** | NO |
| planning-docs | Platform | implemented | 1 | 0 | **HIGH** | YES |
| dashboard-console | Platform | partial | 4 | 2 | **NONE** | NO |
| lcp | Platform | partial | 4 | 2 | **LOW** | NO |
| amiga-workbench | Platform | partial | 2 | 2 | **NONE** | NO |
| wetty-tmux | Platform | permanently-deferred | 0 | 0 | **N/A** | N/A |
| bbs-pack | Educational | aspirational | 4 | 3 | **NONE** | NO |
| creative-suite | Educational | aspirational | 5 | 3 | **NONE** | NO |
| cloud-ops | Educational | aspirational | 5 | 3 | **NONE** | NO |

### Viability Distribution

| Rating | Count | Components |
|--------|-------|------------|
| **HIGH** | 4 | skill-creator, amiga-leverage, info-design, planning-docs |
| **MEDIUM** | 0 | -- |
| **LOW** | 2 | gsd-os, lcp |
| **NONE** | 9 | chipset, staging, silicon, gsd-isa, dashboard-console, amiga-workbench, bbs-pack, creative-suite, cloud-ops |
| **N/A** | 1 | wetty-tmux (permanently deferred) |

### Key Findings

1. **Core layer is fully standalone.** All 3 Core components (skill-creator, amiga-leverage, info-design) rate HIGH. This is architecturally correct -- the Core layer provides upward and requires nothing from above (per dependency-rules.md section 3.2: "Core requires nothing").

2. **planning-docs is the only non-Core HIGH-viability component.** Its single outgoing edge is soft-enhances, making it effectively independent for build purposes.

3. **No components rate MEDIUM.** The ecosystem has a sharp divide: components are either fully self-sufficient (HIGH) or heavily dependent (LOW/NONE). This reflects the deep dependency chains identified in the edge inventory (58% hard-blocks rate).

4. **gsd-os rates LOW, not NONE.** Despite 4 hard-blocks outgoing edges, gsd-os's Tauri/xterm.js/PTY infrastructure provides a functional terminal application. It is not useful as a GSD tool without its dependencies, but the raw desktop shell works.

5. **lcp rates LOW for an analogous reason.** Its hard-blocks dependencies are external infrastructure prerequisites (human process), not software components. The scripts themselves are self-contained bash.

6. **All aspirational components rate NONE.** This is expected -- they have no implementation, so standalone mode is undefined. When eventually implemented, their viability will depend on how many hard-blocks edges they retain.

7. **Viability correlates with layer depth.** Core (depth 0) = HIGH. Middleware (depth 1-2) = NONE. Platform (depth 2-3) = mixed. Educational (depth 4-5) = NONE. Deeper layers accumulate more dependencies.

### Relationship to Probe Protocol

Standalone mode detection starts with the capability probe protocol's Tier 1 (filesystem-presence detection):

| Standalone Viability | Tier 1 Behavior | Implication |
|---------------------|-----------------|-------------|
| HIGH | Present = fully functional | Tier 1 is sufficient to confirm standalone capability |
| LOW | Present = functional with limitations | Tier 2/3 needed to understand what works |
| NONE | Present does NOT mean functional | Tier 2/3 required to detect peer presence before using the component |
| N/A | Always absent | No detection needed |

For NONE-viability components, Tier 1 filesystem-presence is misleading -- the component's directory exists but the component cannot perform its primary function without peers. Consumers of NONE-viability components MUST check peer presence (via Tier 1 of each peer's marker path) before attempting to use the component.
