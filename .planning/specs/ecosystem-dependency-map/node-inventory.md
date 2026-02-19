# Ecosystem Dependency Map: Node Inventory

**Generated:** 2026-02-19
**Purpose:** Definitive DAG node set for the GSD ecosystem dependency map. Every vision document in `.planning/research/v1.25-input/reference-docs/` is inventoried as a node or explicitly excluded. Every implementation status is backed by evidence from MILESTONES.md, known-issues.md, or source directory inspection.

**Status scheme:** implemented | partial | aspirational | permanently-deferred

---

## Node Inventory Table

| Node ID | Document | Full Name | Layer | Status | Known-Issues Ref | Description |
|---------|----------|-----------|-------|--------|------------------|-------------|
| skill-creator | gsd-skill-creator-analysis.md | GSD Skill Creator | Core | implemented | -- | Observation, pattern detection, skill generation, agent composition, and GSD orchestrator |
| chipset | gsd-chipset-architecture-vision.md | Chipset Architecture | Middleware | partial | #7 | Declarative configuration layer mapping skills, agents, topologies, and budgets into operational chipsets |
| planning-docs | gsd-planning-docs-vision.md | Planning Docs Dashboard | Platform | implemented | -- | Living documentation system mirroring .planning/ into browsable HTML with structured data |
| amiga-leverage | gsd-amiga-vision-architectural-leverage.md | Amiga Architectural Leverage | Core | implemented | -- | Design philosophy defining the progressive capability pipeline (skill to adapter to compiled) |
| amiga-workbench | gsd-amiga-new-workbench-vision.md | Amiga Workbench / Hardware I/O | Platform | partial | #3 | Physical-digital integration layer: audio/MIDI, camera, GPIO, and creative production tools |
| creative-suite | gsd-amiga-creative-suite-vision.md | Amiga Creative Suite | Educational | aspirational | -- | 8-application educational curriculum teaching computing through Amiga-inspired creative tools |
| staging | gsd-staging-layer-vision.md | Staging Layer | Middleware | partial | -- | Work analysis, security scanning, and pre-execution planning between ideation and execution |
| silicon | gsd-silicon-layer-spec.md | Silicon Layer | Middleware | aspirational | #2 | QLoRA adapter training, VRAM management, and local inference from observed patterns |
| gsd-isa | gsd-instruction-set-architecture-vision.md | GSD Instruction Set Architecture | Middleware | aspirational | #1 | RISC-inspired instruction set for token-efficient inter-agent communication and educational ISA bridge |
| gsd-os | gsd-os-desktop-vision.md | GSD-OS Desktop | Platform | partial | -- | Tauri desktop application with WebGL engine, block-based interaction, and educational curriculum |
| bbs-pack | gsd-bbs-educational-pack-vision.md | BBS Educational Pack | Educational | aspirational | #6 | BBS/early internet educational content pack teaching networking through dial-up simulation |
| cloud-ops | gsd-cloud-ops-curriculum-vision.md | Cloud Operations Curriculum | Educational | aspirational | #6 | OpenStack-based cloud operations education from containers to production infrastructure |
| lcp | gsd-local-cloud-provisioning-vision.md | Local Cloud Provisioning | Platform | partial | #5 | GSD-managed local cloud environment with PXE boot, VM provisioning, and configuration templating |
| dashboard-console | gsd-dashboard-console-milestone-ingestion.md | Dashboard Console & Milestone Ingestion | Platform | partial | -- | Bidirectional dashboard control surface for vision upload, configuration, and session interaction |
| info-design | information-design-conversation.md | Information Design System | Core | implemented | -- | Subway map, typography, and highway signage principles applied to dashboard visual language |
| wetty-tmux | wetty-tmux-guide.md | Wetty + tmux Terminal Guide | Platform | permanently-deferred | #4 | Browser-based terminal via Wetty/SSH -- superseded by Tauri native PTY architecture |
| bootstrap | *(external)* | GSD Bootstrap Onboarding | External | implemented | -- | First-run onboarding guide bootstrapping development environment and initial GSD project |
| centos-guide | *(external)* | CentOS Cloud Infrastructure Guide | External | implemented | -- | CentOS Stream 9 infrastructure guide for local cloud VM provisioning |
| minecraft-world | *(external)* | Minecraft Knowledge World | External | implemented | -- | Minecraft Java Edition Knowledge World with spatial learning curriculum on local cloud |
| space-between | *(external)* | The Space Between (reference) | External | implemented | -- | Mathematical/philosophical reference on progressive learning, unit circles, and educational design |

---

## Status Evidence Table

### Implemented Nodes

**skill-creator** -- GSD Skill Creator
- **Milestone evidence:** Core product since v1.0; observation, detection, suggestion, and composition pipelines all functional through v1.24
- **Source directories:** `src/observation/`, `src/detection/`, `src/activation/`, `src/composition/`, `src/agents/`, `src/discovery/`, `src/learning/`, `src/embeddings/`, `src/hooks/`, `src/integration/`
- **Test coverage:** 9,355 tests passing across 482 test files (v1.24 conformance audit verified)
- **Key milestones:** v1.0 foundation, v1.13 session lifecycle, v1.14 promotion pipeline, v1.19 budget display, v1.24 conformance audit

**planning-docs** -- Planning Docs Dashboard
- **Milestone evidence:** v1.12 GSD Planning Docs Dashboard, v1.12.1 Live Metrics Dashboard, v1.18 Information Design System, v1.20 Dashboard Assembly
- **Source directory:** `src/dashboard/` (30+ modules: parser, renderer, generator, structured-data, incremental, refresh, collectors, metrics, terminal-panel, design-system, gantry-panel, topology-renderer, activity-feed, budget-gauge, silicon-panel, entity-shapes, entity-legend, console-page, console-settings, console-activity, upload-zone, config-form, submit-flow, question-card, question-poller, staging-queue-panel)
- **Test coverage:** Tests in v1.12 (239), v1.12.1 (460), v1.18 (515), v1.20 (110)

**amiga-leverage** -- Amiga Architectural Leverage
- **Milestone evidence:** Design philosophy document fully expressed in v1.21 GSD-OS Desktop Foundation and v1.23 Project AMIGA architecture
- **Source evidence:** Architecture influences visible in progressive disclosure patterns, chipset hardware metaphor, AMIGA mission infrastructure (`src/amiga/`)
- **Note:** This is a design philosophy document, not a component with its own codebase. "Implemented" means its principles are realized in downstream components.

**info-design** -- Information Design System
- **Milestone evidence:** v1.18 Information Design System (7 phases, 15 plans, 515 tests)
- **Source directory:** `src/dashboard/design-system.ts`, `src/dashboard/entity-shapes.ts`, `src/dashboard/entity-legend.ts`, `src/dashboard/gantry-panel.ts`, `src/dashboard/topology-renderer.ts`
- **Test coverage:** Design system tests, entity shape rendering tests, topology integration tests

**bootstrap** -- GSD Bootstrap Onboarding *(External)*
- **Evidence:** Referenced in `gsd-local-cloud-provisioning-vision.md` as prerequisite (Steps 1-8). External onboarding guide; not part of this codebase but referenced as a dependency by LCP and cloud-ops.
- **Status rationale:** The bootstrap guide exists as a complete reference document.

**centos-guide** -- CentOS Cloud Infrastructure Guide *(External)*
- **Evidence:** Referenced in `gsd-local-cloud-provisioning-vision.md` and `gsd-cloud-ops-curriculum-vision.md`. External infrastructure reference document.
- **Status rationale:** Complete infrastructure guide for CentOS Stream 9 cloud environment setup.

**minecraft-world** -- Minecraft Knowledge World *(External)*
- **Milestone evidence:** v1.22 Minecraft Knowledge World (30 phases, 37 plans, 108 commits)
- **Source directory:** `infra/` (knowledge-world/, minecraft/, local/, monitoring/, scripts/, templates/)
- **Status rationale:** Fully shipped in v1.22 with spatial learning curriculum, Fabric server, automated deployment.

**space-between** -- The Space Between *(External)*
- **Evidence:** Referenced in `gsd-cloud-ops-curriculum-vision.md` Depends-on header. A mathematical/philosophical PDF on progressive learning and the unit circle analogy.
- **Status rationale:** Reference material; exists as complete document.

### Partial Nodes

**chipset** -- Chipset Architecture
- **What exists:** `src/chipset/` with 6 modules (blitter, copper, exec, index, integration, teams). ASIC/FPGA chipset definition format designed. Team topologies with chipset-aware routing implemented in v1.22.
- **What's missing:** Full ASIC pre-built library, community chipset registry, FPGA conversation-to-chipset synthesis, runtime chipset validation. Dashboard packaging as GSD skill (known-issues #7).
- **Known-issues reference:** #7 -- Dashboard generator is standalone TypeScript module rather than packaged GSD skill with metadata.yaml.
- **Key milestones:** v1.11 Chipset Architecture, v1.22 formalized chipset with 20 skills, 10 agents, 5 teams.

**gsd-os** -- GSD-OS Desktop
- **What exists:** Tauri v2 desktop app (`src-tauri/`, `desktop/`): Rust backend with PTY, file watcher, IPC; Vite webview frontend with WebGL CRT shader engine, 32-color indexed palette, window manager, taskbar, calibration wizard, Amiga boot sequence. 12 frontend modules (engine, terminal, tmux, claude, ipc, wm, shell, dashboard, calibration, boot).
- **What's missing:** Block-based visual interaction model, educational curriculum integration, kit builder projects, level 1-4 progressive depth, blueprint sharing system.
- **Key milestones:** v1.21 GSD-OS Desktop Foundation (11 phases, 34 plans, 83 commits, 636 tests).

**dashboard-console** -- Dashboard Console & Milestone Ingestion
- **What exists:** `src/console/` (29 files) and `src/dashboard/` console pages: upload zone, config form, submit flow, question card, question poller, staging queue panel, console settings, console activity, bridge logger, message handler, milestone config, directory management.
- **What's missing:** Full bidirectional control (dashboard-to-session settings propagation not complete), real-time question interaction during execution.
- **Key milestones:** v1.16 Dashboard Console & Milestone Ingestion (6 phases, 18 plans), v1.20 Dashboard Assembly wired console page.

**staging** -- Staging Layer
- **What exists:** `src/console/` staging queue panel, upload zone, question schema, reader, schema validation. v1.17 shipped 8 phases of staging layer work.
- **What's missing:** Full security scanning pipeline, community chipset quarantine integration, parallel work decomposition, team formation automation.
- **Key milestones:** v1.17 Staging Layer (8 phases, 35 plans, 83 commits, 699 tests).

**lcp** -- Local Cloud Provisioning
- **What exists:** `infra/` directory with PXE boot scripts, VM provisioning templates, configuration management. Shell-based templating with render-pxe-menu.sh.
- **What's missing:** Jinja templating (deferred -- shell substitution chosen instead), VM identity reconfiguration (configure-clone.sh), DNS templates, advanced provisioning features.
- **Known-issues reference:** #5 -- LCP templates use shell substitution instead of Jinja; 12 of 16 checkpoints amended.
- **Key milestones:** v1.22 Minecraft Knowledge World included PXE boot, hypervisor-agnostic VM provisioning.

**amiga-workbench** -- Amiga Workbench / Hardware I/O
- **What exists:** Desktop Workbench UI in `desktop/src/wm/` (window manager, taskbar, pixel-art icons, system menu). Part of v1.21 GSD-OS Desktop Foundation.
- **What's missing:** Audio/MIDI integration, camera feed processing, GPIO control, physical hardware I/O. These require physical hardware peripherals not available in dev environment.
- **Known-issues reference:** #3 -- Hardware workbench features (13 checkpoints) require physical audio/MIDI/camera/GPIO hardware.

### Aspirational Nodes

**silicon** -- Silicon Layer
- **What exists:** `src/dashboard/silicon-panel.ts` for ML adapter status visualization. The dashboard panel renders silicon layer metrics but no actual ML pipeline exists.
- **What's missing:** QLoRA fine-tuning, adapter lifecycle management, hybrid local/cloud routing, training pair generation, silicon.yaml configuration, VRAM budget management, consumer registration, backpressure.
- **Known-issues reference:** #2 -- 13 checkpoints deferred to v3.x (requires GPU infrastructure and model training capabilities).

**gsd-isa** -- GSD Instruction Set Architecture
- **What exists:** AGC ISA (Apollo Guidance Computer educational simulator) in `src/agc/` with 38 instructions, CPU emulation, memory banking, DSKY interface, executive/waitlist, curriculum, assembler, debugger. This is a separate educational ISA, not the GSD workflow ISA.
- **What's missing:** The GSD ISA itself -- custom opcodes (GSD-I encoding), 8 general-purpose registers, filesystem bus protocol, FPGA synthesis pipeline, privilege levels, I/O bridges. Entirely unimplemented.
- **Known-issues reference:** #1 -- 32 checkpoints deferred to v2.x. The AGC ISA serves the educational component; the GSD ISA for workflow orchestration is aspirational v2+ architecture.

**bbs-pack** -- BBS Educational Pack
- **What exists:** Vision document only. No implementation code.
- **What's missing:** Everything -- modem simulator, ANSI art renderer, BBS main menu, door games, MUD/MUCK interface, FidoNet simulation, student/player mode toggle.
- **Known-issues reference:** #6 -- Content-only educational pack, deferred to v3.x.

**creative-suite** -- Amiga Creative Suite
- **What exists:** Vision document only. No implementation code.
- **What's missing:** All 8 applications (system guide, modem simulator, BBS integration, GSD-Paint, GSD-Tracker, GSD-Animate, hard drive module, math engine, AI workshop). Full computing curriculum infrastructure.
- **Known-issues reference:** None directly, but depends on multiple aspirational components (silicon, bbs-pack).

**cloud-ops** -- Cloud Operations Curriculum
- **What exists:** Vision document only defining 6 curriculum modules with 3 entry points (containers, VMs, bare metal), OpenStack architecture mapping, concept transfer tables.
- **What's missing:** All curriculum content, lab environments, assessment tools, OpenStack deployment guides, Podman path implementation.
- **Known-issues reference:** #6 -- Content-only educational curriculum, deferred to v3.x.

### Permanently Deferred Nodes

**wetty-tmux** -- Wetty + tmux Terminal Guide
- **What existed in vision:** Browser-based terminal access via Wetty (Node.js SSH terminal) with tmux session embedding for dashboard integration.
- **Why deferred:** Architectural divergence -- GSD-OS adopted Tauri + portable-pty + xterm.js for native terminal functionality. Native PTY provides better performance, lower latency, and tighter desktop integration than a web-based SSH terminal. Wetty would add an unnecessary network layer for a desktop application.
- **Known-issues reference:** #4 -- 9 of 11 checkpoints amended (wtm-004 and wtm-005 pass as standard tmux features). Permanent and intentional divergence.
- **Source evidence:** Native PTY in `src-tauri/src/pty/`, xterm.js integration in `desktop/src/terminal/`, tmux binding in `desktop/src/tmux/`.

---

## Layer Classification Rationale

| Layer | Nodes | Rationale |
|-------|-------|-----------|
| **Core** | skill-creator, amiga-leverage, info-design | Foundation components that other layers depend on. Skill-creator is the central observation/skill/agent engine. Amiga-leverage and info-design are design philosophy documents whose principles govern the entire ecosystem architecture. These provide upward but require nothing from above. |
| **Middleware** | chipset, staging, silicon, gsd-isa | Integration layers that sit between core capabilities and user-facing platforms. Chipset provides declarative configuration. Staging provides intake and security. Silicon provides local inference acceleration. ISA provides the message bus protocol. These consume Core and are consumed by Platform. |
| **Platform** | gsd-os, planning-docs, dashboard-console, lcp, amiga-workbench, wetty-tmux | User-facing systems that present ecosystem capabilities. GSD-OS is the desktop shell. Planning-docs is the documentation dashboard. Dashboard-console extends it with bidirectional control. LCP provisions infrastructure. Amiga-workbench provides hardware I/O. Wetty-tmux was the original terminal layer (now deferred). |
| **Educational** | bbs-pack, creative-suite, cloud-ops | Teaching content delivered through the platform. These consume Platform and Middleware to provide learning experiences. They are end-user deliverables, not infrastructure. |
| **External** | bootstrap, centos-guide, minecraft-world, space-between | Dependencies that exist outside this codebase. They are referenced by ecosystem nodes but not built as part of gsd-skill-creator. Included for DAG completeness with boundary annotations. |

---

## Excluded Documents

| Document | Reason for Exclusion |
|----------|---------------------|
| ai_agentic_programming_report.md | Industry analysis report on agentic AI trends (dated January 30, 2026). It is a research reference informing skill-creator's design direction, not a vision for an ecosystem component. It has no `Depends on:` header, defines no component, and is authored as "AI Research Analysis" -- an external survey, not an internal architectural document. |
| dashboard-screenshot-description.md | Descriptive reference documenting the visual state of the planning docs dashboard at a point in time (circa v1.14). It describes what already exists in the planning-docs node, not a separate component. It has no `Depends on:` header and defines no new architecture. |

---

## Summary Statistics

**Total nodes:** 20 (16 internal + 4 external)
**Excluded documents:** 2 (from 18 reference-docs files, 16 became nodes, 2 excluded)

### By Status

| Status | Count | Nodes |
|--------|-------|-------|
| Implemented | 8 | skill-creator, planning-docs, amiga-leverage, info-design, bootstrap, centos-guide, minecraft-world, space-between |
| Partial | 6 | chipset, gsd-os, dashboard-console, staging, lcp, amiga-workbench |
| Aspirational | 5 | silicon, gsd-isa, bbs-pack, creative-suite, cloud-ops |
| Permanently Deferred | 1 | wetty-tmux |

### By Layer

| Layer | Count | Nodes |
|-------|-------|-------|
| Core | 3 | skill-creator, amiga-leverage, info-design |
| Middleware | 4 | chipset, staging, silicon, gsd-isa |
| Platform | 6 | gsd-os, planning-docs, dashboard-console, lcp, amiga-workbench, wetty-tmux |
| Educational | 3 | bbs-pack, creative-suite, cloud-ops |
| External | 4 | bootstrap, centos-guide, minecraft-world, space-between |

### Internal Nodes by Status (excluding external)

| Status | Count | Percentage |
|--------|-------|------------|
| Implemented | 4 | 25% |
| Partial | 6 | 37.5% |
| Aspirational | 5 | 31.25% |
| Permanently Deferred | 1 | 6.25% |
