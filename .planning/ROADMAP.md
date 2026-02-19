# Roadmap: GSD Skill Creator

## Milestones

- v1.0-v1.23 + v1.8.1 patch: 27 milestones shipped (Phases 1-222)
- v1.24 — GSD Conformance Audit & Hardening (Phases 223-230)

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 223: Conformance Matrix** - Build the YAML matrix covering every "In Scope v1" claim across 18 vision documents with tier triage and dependency graph (completed 2026-02-19)
- [x] **Phase 224: Foundation Audit (T0)** - Verify core GSD lifecycle, .planning/ structure, skill loading pipeline, state management, and build health (completed 2026-02-19)
- [x] **Phase 225: Integration Audit (T1)** - Verify cross-component wiring: chipset-to-skill-creator, dashboard-to-planning, staging-to-execution, AMIGA ICDs, AGC pack (completed 2026-02-19)
- [x] **Phase 226: Behavior Audit (T2)** - Verify individual component correctness: token budgets, pattern detection, bounded learning, dashboard metrics, AGC simulator, staging hygiene, security hardening (completed 2026-02-19)
- [ ] **Phase 227: UX/Polish Audit (T3)** - Verify user-facing behavior: GSD-OS build/render, window manager, boot sequence, design system compliance, educational content, accessibility
- [ ] **Phase 228: End-to-End Verification** - Full proof run from upload through dashboard with conformance gate percentages met
- [ ] **Phase 229: Documentation & Amendments** - Resolve every vision document divergence (fix code or amend spec) and verify installation docs
- [ ] **Phase 230: Verification Environment (Stretch)** - Provision 4-VM clean-room environment and verify clean install from published docs

## Phase Details

### Phase 223: Conformance Matrix
**Goal**: A single YAML artifact exists that maps every "In Scope v1" claim from all 18 vision documents to a verifiable checkpoint with tier, dependencies, and verification method -- enabling all subsequent audit phases to work from a shared source of truth
**Depends on**: Nothing (first phase of milestone)
**Requirements**: MATRIX-01, MATRIX-02, MATRIX-03, MATRIX-04, MATRIX-05
**Success Criteria** (what must be TRUE):
  1. Running a script or query against the matrix YAML returns every "In Scope v1" claim from all 18 vision documents -- none missing
  2. Every checkpoint in the matrix has a unique ID, source document, section reference, verification method, and status field
  3. Every checkpoint is assigned to exactly one tier (T0/T1/T2/T3) and the tier assignments match the audit flow logic (foundation before integration before behavior before polish)
  4. The dependency graph is queryable -- given any checkpoint, its blockers can be listed
  5. Per-tier effort estimates exist in a companion audit plan document
**Plans:** 6/6 plans complete
Plans:
- [ ] 223-01-PLAN.md -- Extract checkpoints from core architecture docs (skill-creator, chipset, silicon, AMIGA leverage, agentic report)
- [ ] 223-02-PLAN.md -- Extract checkpoints from ISA, staging layer, and planning docs visions
- [ ] 223-03-PLAN.md -- Extract checkpoints from desktop, dashboard/console, info design, and workbench docs
- [ ] 223-04-PLAN.md -- Extract checkpoints from educational packs (BBS, Creative Suite, AGC, RFC)
- [ ] 223-05-PLAN.md -- Extract checkpoints from infrastructure and cloud ops docs
- [ ] 223-06-PLAN.md -- Synthesize all batches into conformance-matrix.yaml + audit-plan.md

### Phase 224: Foundation Audit (T0)
**Goal**: The core GSD lifecycle, file structure, skill loading pipeline, state tracking, subagent spawning, filesystem message bus, and build health are all verified to work correctly -- proving the foundation that everything else depends on
**Depends on**: Phase 223
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, FOUND-06, FOUND-07, FOUND-08
**Success Criteria** (what must be TRUE):
  1. A fresh GSD lifecycle (new-project through complete-milestone) runs to completion on clean context without errors
  2. Every GSD command that writes to `.planning/` produces the correct directory structure and file contents
  3. The 6-stage skill loading pipeline (Score through Load) executes end-to-end and loads the correct skills in the correct order
  4. `npm test` exits 0 on a clean checkout and `tsc --noEmit` reports zero errors
  5. Subagent spawning (executor, planner, verifier) and filesystem message bus (inbox/outbox) both function correctly
**Plans:** 3/3 plans complete
Plans:
- [ ] 224-01-PLAN.md -- Build health: fix TypeScript errors and test failures (FOUND-07, FOUND-08)
- [ ] 224-02-PLAN.md -- Verify skill loading pipeline, pattern detection, orchestrator, bounded learning (FOUND-03)
- [ ] 224-03-PLAN.md -- Verify GSD lifecycle, .planning/ structure, state tracking, subagents, message bus (FOUND-01, FOUND-02, FOUND-04, FOUND-05, FOUND-06)

### Phase 225: Integration Audit (T1)
**Goal**: Cross-component wiring is verified -- GSD triggers skill-creator observations, skill-creator output feeds back into GSD, chipset config affects loading, dashboard reflects real state, console routes through message bus, staging reaches execution, AMIGA ICDs work across components, and AGC integrates with GSD-OS
**Depends on**: Phase 224
**Requirements**: INTEG-01, INTEG-02, INTEG-03, INTEG-04, INTEG-05, INTEG-06, INTEG-07, INTEG-08, INTEG-09, INTEG-10
**Success Criteria** (what must be TRUE):
  1. During a real GSD execute-phase, skill-creator observations fire and the resulting data feeds back into skill loading via wrapper commands
  2. Changing active chipset configuration visibly changes skill loading order and agent topology selection
  3. The planning docs dashboard renders content that matches the actual `.planning/` directory state, and dashboard data collectors (topology, activity, budget, staging) produce correct output from real files
  4. Console upload zone accepts a markdown document and it arrives in the filesystem message bus outbox; staging layer resource manifest reaches the execution queue
  5. AMIGA ICD-based communication works across MC-1/ME-1/CE-1/GL-1 and AGC simulator integrates with its GSD-OS pack (block definitions, chipset config, dashboard widgets)
**Plans:** 6/6 plans complete
Plans:
- [ ] 225-01-PLAN.md -- Verify GSD-to-skill-creator observation wiring, wrapper commands, session hooks (INTEG-01, INTEG-02, INTEG-07)
- [ ] 225-02-PLAN.md -- Verify chipset-to-skill-loading and agent topology integration (INTEG-03)
- [ ] 225-03-PLAN.md -- Verify dashboard and data collectors reflect real .planning/ state (INTEG-04, INTEG-08)
- [ ] 225-04-PLAN.md -- Verify console upload → message bus and staging manifest → execution queue (INTEG-05, INTEG-06)
- [ ] 225-05-PLAN.md -- Verify AMIGA ICD inter-component communication and AGC/RFC pack integration (INTEG-09, INTEG-10)
- [ ] 225-06-PLAN.md -- Verify remaining T1 checkpoints: GSD-OS, ISA, Workbench, LCP, educational packs (all INTEG)

### Phase 226: Behavior Audit (T2)
**Goal**: Individual component behaviors are verified against their specifications -- token budgets enforce limits, pattern detection fires at correct thresholds, bounded learning constraints hold, dashboard metrics calculate correctly, AGC simulator is instruction-accurate, staging hygiene and trust models work, and security hardening prevents known attack vectors
**Depends on**: Phase 225
**Requirements**: BEHAV-01, BEHAV-02, BEHAV-03, BEHAV-04, BEHAV-05, BEHAV-06, BEHAV-07, BEHAV-08, BEHAV-09, BEHAV-10, BEHAV-11, BEHAV-12, BEHAV-13, BEHAV-14
**Success Criteria** (what must be TRUE):
  1. Token budget enforcement stops skill loading when budget is exceeded; pattern detection triggers at exactly 3+ occurrences (not before); bounded learning constraints (20% max change, 3+ corrections, 7-day cooldown) are enforced
  2. Dashboard metric calculations (phase velocity, commit stats, accuracy scores) produce correct values from known test inputs
  3. AGC simulator produces correct results for all 38 instructions, ones' complement ALU handles all boundary conditions, and DSKY display model correctly decodes relay data
  4. Template engine renders all variable substitutions correctly; staging hygiene engine detects all 11 patterns; staging queue 7-state machine transitions correctly with append-only audit log
  5. Security hardening works: path traversal is blocked, YAML uses safe deserialization only, JSONL integrity checks function; trust decay model correctly downgrades tiers; smart intake routes through all 3 clarity paths; RFC skill fetches/parses/formats correctly in all 3 output formats
**Plans:** 7/7 plans complete
Plans:
- [x] 226-01-PLAN.md -- Verify skill-creator core behaviors: token budget, pattern detection, bounded learning (BEHAV-01, BEHAV-02, BEHAV-03)
- [x] 226-02-PLAN.md -- Verify AGC simulator: 38 instructions, ALU boundaries, DSKY display (BEHAV-06, BEHAV-07, BEHAV-08)
- [x] 226-03-PLAN.md -- Verify staging layer: 11 hygiene patterns, trust decay, smart intake, queue state machine (BEHAV-09, BEHAV-10, BEHAV-11, BEHAV-12)
- [ ] 226-04-PLAN.md -- Verify dashboard metrics, planning docs generator, console behaviors (BEHAV-04)
- [ ] 226-05-PLAN.md -- Verify template engine and RFC Reference Skill (BEHAV-05, BEHAV-14)
- [ ] 226-06-PLAN.md -- Verify security hardening and chipset behaviors (BEHAV-13)
- [ ] 226-07-PLAN.md -- T2 sweep: ISA, GSD-OS, workbench, Wetty/tmux, finalize T2 tier (all BEHAV)

### Phase 227: UX/Polish Audit (T3)
**Goal**: User-facing behavior matches the vision specifications -- GSD-OS builds and renders correctly, window manager supports all interaction modes, design system colors and shapes are applied consistently, educational content produces described outcomes, and accessibility modes activate correctly
**Depends on**: Phase 226
**Requirements**: POLISH-01, POLISH-02, POLISH-03, POLISH-04, POLISH-05, POLISH-06, POLISH-07, POLISH-08, POLISH-09
**Success Criteria** (what must be TRUE):
  1. GSD-OS Tauri application builds for Linux without errors and the WebGL CRT shader renders with all specified effects (scanlines, barrel distortion, phosphor glow, vignette)
  2. Window manager supports depth cycling, drag/resize, and keyboard shortcuts; boot sequence animation runs and is skippable
  3. Dashboard color scheme uses the information design spec (6 domain colors, 4 signal colors); topology view renders SVG bezier edges with click-to-detail; entity shapes use dual encoding (shape+color)
  4. AGC curriculum renders correctly and exercises produce the outcomes described in the curriculum documents
  5. Accessibility mode activates on prefers-reduced-motion and prefers-contrast media queries
**Plans:** 3/4 plans executed
Plans:
- [ ] 227-01-PLAN.md -- Audit GSD-OS desktop: Tauri build, CRT shader, window manager, boot sequence, accessibility (POLISH-01, POLISH-02, POLISH-03, POLISH-04, POLISH-09)
- [ ] 227-02-PLAN.md -- Audit dashboard design system: color scheme, topology, entity shapes, gantry, layout (POLISH-05, POLISH-06, POLISH-07)
- [ ] 227-03-PLAN.md -- Audit educational content: AGC curriculum, RFC, BBS, Creative Suite (POLISH-08)
- [ ] 227-04-PLAN.md -- Audit peripheral systems: ISA docs, planning docs, console, cloud-ops, Wetty/tmux; finalize T3 tier (POLISH-05, POLISH-06, POLISH-07, POLISH-08, POLISH-09)

### Phase 228: End-to-End Verification
**Goal**: A full proof run demonstrates the system working end-to-end -- upload through staging through lifecycle through observation through dashboard through metrics -- with all tier conformance gates met and zero undocumented divergences
**Depends on**: Phase 227
**Requirements**: E2E-01, E2E-02, E2E-03, E2E-04, E2E-05, E2E-06, E2E-07
**Success Criteria** (what must be TRUE):
  1. A full proof run completes from upload through dashboard display without manual intervention (other than HITL questions)
  2. 100% of T0 checkpoints pass and 100% of T1 checkpoints pass or are amended with justification
  3. At least 90% of T2 checkpoints pass (remaining documented with deferred justification) and at least 80% of T3 checkpoints pass (remaining documented)
  4. Zero undocumented divergences remain between code and vision documents
  5. The conformance matrix is reproducible -- another person could follow it to independently verify system state
**Plans**: TBD

### Phase 229: Documentation & Amendments
**Goal**: Every divergence between code and vision documents is formally resolved -- either the code is fixed or the vision document is amended with a paper trail -- and installation documentation is verified to work from published instructions
**Depends on**: Phase 228
**Requirements**: AMEND-01, AMEND-02, AMEND-03, AMEND-04
**Success Criteria** (what must be TRUE):
  1. Every vision document divergence identified during audit is resolved: fixed in code OR amended in the vision document
  2. Every vision document amendment follows the protocol: checkpoint ID, original claim, actual state, resolution, updated specification text
  3. Installation documentation is verified to work from published instructions on a system that has never run the project
  4. A known-issues list documents anything deferred with rationale for deferral
**Plans**: TBD

### Phase 230: Verification Environment (Stretch)
**Goal**: A 4-VM clean-room environment is provisioned and used to verify that GSD + skill-creator installs and runs correctly from published documentation on infrastructure that has never seen the project before
**Depends on**: Phase 229
**Requirements**: ENV-01, ENV-02, ENV-03, ENV-04, ENV-05, ENV-06
**Success Criteria** (what must be TRUE):
  1. Four VMs are provisioned (infra-01, gsd-dev-01, web-01, backend-01) with DNS resolution between all VMs and time sync via chronyd
  2. Monitoring stack (Prometheus, Grafana, Loki) is running on backend-01 and collecting metrics from all VMs
  3. A clean GSD + skill-creator install on gsd-dev-01 completes successfully following only the published documentation
  4. Dashboard is rendered and served via nginx on web-01, accessible from the host machine
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 223 → 224 → 225 → 226 → 227 → 228 → 229 → 230

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 223. Conformance Matrix | 6/6 | Complete    | 2026-02-19 |
| 224. Foundation Audit (T0) | 3/3 | Complete    | 2026-02-19 |
| 225. Integration Audit (T1) | 6/6 | Complete    | 2026-02-19 |
| 226. Behavior Audit (T2) | 7/7 | Complete    | 2026-02-19 |
| 227. UX/Polish Audit (T3) | 3/4 | In Progress|  |
| 228. End-to-End Verification | 0/TBD | Not started | - |
| 229. Documentation & Amendments | 0/TBD | Not started | - |
| 230. Verification Environment (Stretch) | 0/TBD | Not started | - |
