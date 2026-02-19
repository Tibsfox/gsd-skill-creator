# Requirements: GSD Skill Creator

**Defined:** 2026-02-19
**Core Value:** Verify the codebase matches its specifications — then fix every place where it doesn't.

## v1 Requirements

Requirements for v1.24 — GSD Conformance Audit & Hardening. Each maps to roadmap phases.

### Conformance Matrix

- [x] **MATRIX-01**: Conformance matrix YAML covers every "In Scope v1" claim from all 18 vision documents
- [x] **MATRIX-02**: Each checkpoint has a unique ID, source document reference, section reference, verification method, and status field
- [x] **MATRIX-03**: Checkpoints are triaged into 4 tiers: T0-Foundation, T1-Integration, T2-Behavior, T3-UX/Polish
- [x] **MATRIX-04**: Dependency graph identifies which checkpoints block which other checkpoints
- [x] **MATRIX-05**: Estimated effort per tier documented in audit plan

### Foundation Audit (T0)

- [x] **FOUND-01**: Full GSD lifecycle runs on clean context: new-project → research → requirements → roadmap → plan-phase → execute-phase → verify-work → complete-milestone
- [x] **FOUND-02**: `.planning/` directory structure is created and populated correctly by each GSD command
- [x] **FOUND-03**: 6-stage skill loading pipeline (Score → Resolve → ModelFilter → CacheOrder → Budget → Load) executes correctly
- [x] **FOUND-04**: STATE.md accurately tracks phase position, blockers, and session history
- [x] **FOUND-05**: Subagent spawning works for executor, planner, and verifier agents
- [x] **FOUND-06**: Filesystem message bus (`.planning/console/` inbox/outbox) writes and reads correctly
- [x] **FOUND-07**: All existing unit tests pass on a clean checkout (`npm test` exits 0)
- [x] **FOUND-08**: TypeScript compiles with zero errors in strict mode

### Integration Audit (T1)

- [x] **INTEG-01**: GSD triggers skill-creator observations during execute-phase and verify-work
- [x] **INTEG-02**: Skill-creator's output feeds back into GSD's skill loading via wrapper commands
- [x] **INTEG-03**: Active chipset configuration changes skill loading order and agent topology
- [x] **INTEG-04**: Planning docs dashboard reflects actual `.planning/` state and updates on changes
- [x] **INTEG-05**: Console upload zone accepts markdown documents and routes through filesystem message bus
- [x] **INTEG-06**: Staging layer's resource manifest reaches the execution queue
- [x] **INTEG-07**: Session observation hooks fire during real GSD sessions (post-commit hook captures metadata)
- [x] **INTEG-08**: Dashboard data collectors (topology, activity, budget, staging) produce correct output from real files
- [x] **INTEG-09**: AMIGA ICD-based inter-component communication works across MC-1, ME-1, CE-1, GL-1
- [x] **INTEG-10**: AGC simulator integrates with GSD-OS pack (block definitions, chipset config, dashboard widgets)

### Behavior Audit (T2)

- [ ] **BEHAV-01**: Token budget enforcement stops skill loading when budget is exceeded
- [ ] **BEHAV-02**: Pattern detection triggers at 3+ occurrences and not before
- [ ] **BEHAV-03**: Bounded learning constraints enforced: ≤20% change per refinement, ≥3 corrections required, 7-day cooldown
- [x] **BEHAV-04**: Dashboard metric calculations are correct (phase velocity, commit stats, accuracy scores)
- [ ] **BEHAV-05**: Template engine renders all variable substitutions correctly in infrastructure templates
- [ ] **BEHAV-06**: AGC simulator produces correct results for all 38 instructions
- [ ] **BEHAV-07**: AGC ones' complement ALU handles overflow and sign correctly at all boundary conditions
- [ ] **BEHAV-08**: DSKY display model correctly decodes relay data and renders 6 registers and 11 annunciators
- [ ] **BEHAV-09**: Staging layer hygiene engine detects all 11 built-in patterns
- [ ] **BEHAV-10**: Trust decay model correctly downgrades familiarity tiers over time
- [ ] **BEHAV-11**: Smart intake correctly routes through 3 clarity paths (clear/gaps/confused)
- [ ] **BEHAV-12**: Staging queue 7-state machine transitions correctly with append-only audit log
- [x] **BEHAV-13**: Security hardening: path traversal prevention, YAML safe deserialization, JSONL integrity all function
- [ ] **BEHAV-14**: RFC Reference Skill correctly fetches, parses, and formats RFCs in all 3 output formats

### UX/Polish Audit (T3)

- [ ] **POLISH-01**: GSD-OS Tauri application builds for Linux without errors
- [ ] **POLISH-02**: WebGL CRT shader renders with scanlines, barrel distortion, phosphor glow, and vignette
- [ ] **POLISH-03**: Window manager supports depth cycling, drag/resize, and keyboard shortcuts
- [ ] **POLISH-04**: Boot sequence animation runs and is skippable
- [ ] **POLISH-05**: Dashboard color scheme follows the information design spec (6 domain colors, 4 signal colors)
- [ ] **POLISH-06**: Topology view renders with SVG bezier edges and click-to-detail
- [ ] **POLISH-07**: Entity shapes use dual encoding (shape+color) per the design system
- [ ] **POLISH-08**: Educational content (AGC curriculum) renders correctly and exercises produce described outcomes
- [ ] **POLISH-09**: Accessibility mode activates on prefers-reduced-motion and prefers-contrast

### End-to-End Verification

- [ ] **E2E-01**: Full proof run completes without manual intervention (other than HITL questions)
- [ ] **E2E-02**: All T0 checkpoints pass (100% required)
- [ ] **E2E-03**: All T1 checkpoints pass or are amended with justification (100% required)
- [ ] **E2E-04**: ≥90% of T2 checkpoints pass, remaining documented with deferred justification
- [ ] **E2E-05**: ≥80% of T3 checkpoints pass, remaining items documented
- [ ] **E2E-06**: Zero undocumented divergences remain between code and vision documents
- [ ] **E2E-07**: Conformance matrix is reproducible — another person could follow it to verify system state

### Documentation & Amendments

- [ ] **AMEND-01**: Every vision document divergence is resolved: fixed in code or amended in vision doc
- [ ] **AMEND-02**: Vision doc amendments follow the protocol: checkpoint ID, original claim, actual state, resolution, updated spec
- [ ] **AMEND-03**: Installation documentation is verified to work from published instructions
- [ ] **AMEND-04**: Known issues list documents anything deferred, with rationale

### Verification Environment (Stretch)

- [ ] **ENV-01**: 4-VM environment provisioned: infra-01, gsd-dev-01, web-01, backend-01
- [ ] **ENV-02**: DNS resolution between all VMs via dnsmasq
- [ ] **ENV-03**: Time sync via chronyd on infra-01
- [ ] **ENV-04**: Monitoring stack: Prometheus, Grafana, Loki on backend-01
- [ ] **ENV-05**: Clean GSD + skill-creator install on gsd-dev-01 from published docs
- [ ] **ENV-06**: Dashboard rendered and served via nginx on web-01

## v2 Requirements

Deferred to future milestones. Tracked but not in current roadmap.

### Future Educational Packs

- **EDU-01**: BBS educational pack content delivery and modem simulator
- **EDU-02**: Creative Suite applications (GSD-Paint, GSD-Tracker, GSD-Animate)
- **EDU-03**: Cloud ops curriculum execution (container/VM/OpenStack learning paths)

### Future Features

- **FUT-01**: Silicon layer training pipeline (QLoRA distillation, adapter lifecycle)
- **FUT-02**: ISA bus message encoding (compact format replacing JSON)
- **FUT-03**: Block editor drag-and-drop in GSD-OS

## Out of Scope

| Feature | Reason |
|---------|--------|
| New feature development | This is an audit milestone — fix/verify, not build |
| Full BBS/Creative Suite/Cloud Ops content | Vision docs scope these as future; structure verification only |
| Silicon layer model training | Verify hooks exist; actual distillation is future |
| ISA encoded bus messages | Verify format spec exists; implementation is future |
| Performance benchmarking | Focus on correctness, not speed optimization |
| Multi-platform builds (macOS, Windows) | Linux-first; cross-platform is future |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| MATRIX-01 | Phase 223 | Complete |
| MATRIX-02 | Phase 223 | Complete |
| MATRIX-03 | Phase 223 | Complete |
| MATRIX-04 | Phase 223 | Complete |
| MATRIX-05 | Phase 223 | Complete |
| FOUND-01 | Phase 224 | Complete |
| FOUND-02 | Phase 224 | Complete |
| FOUND-03 | Phase 224 | Complete |
| FOUND-04 | Phase 224 | Complete |
| FOUND-05 | Phase 224 | Complete |
| FOUND-06 | Phase 224 | Complete |
| FOUND-07 | Phase 224 | Complete |
| FOUND-08 | Phase 224 | Complete |
| INTEG-01 | Phase 225 | Complete |
| INTEG-02 | Phase 225 | Complete |
| INTEG-03 | Phase 225 | Complete |
| INTEG-04 | Phase 225 | Complete |
| INTEG-05 | Phase 225 | Complete |
| INTEG-06 | Phase 225 | Complete |
| INTEG-07 | Phase 225 | Complete |
| INTEG-08 | Phase 225 | Complete |
| INTEG-09 | Phase 225 | Complete |
| INTEG-10 | Phase 225 | Complete |
| BEHAV-01 | Phase 226 | Pending |
| BEHAV-02 | Phase 226 | Pending |
| BEHAV-03 | Phase 226 | Pending |
| BEHAV-04 | Phase 226 | Complete |
| BEHAV-05 | Phase 226 | Pending |
| BEHAV-06 | Phase 226 | Pending |
| BEHAV-07 | Phase 226 | Pending |
| BEHAV-08 | Phase 226 | Pending |
| BEHAV-09 | Phase 226 | Pending |
| BEHAV-10 | Phase 226 | Pending |
| BEHAV-11 | Phase 226 | Pending |
| BEHAV-12 | Phase 226 | Pending |
| BEHAV-13 | Phase 226 | Complete |
| BEHAV-14 | Phase 226 | Pending |
| POLISH-01 | Phase 227 | Pending |
| POLISH-02 | Phase 227 | Pending |
| POLISH-03 | Phase 227 | Pending |
| POLISH-04 | Phase 227 | Pending |
| POLISH-05 | Phase 227 | Pending |
| POLISH-06 | Phase 227 | Pending |
| POLISH-07 | Phase 227 | Pending |
| POLISH-08 | Phase 227 | Pending |
| POLISH-09 | Phase 227 | Pending |
| E2E-01 | Phase 228 | Pending |
| E2E-02 | Phase 228 | Pending |
| E2E-03 | Phase 228 | Pending |
| E2E-04 | Phase 228 | Pending |
| E2E-05 | Phase 228 | Pending |
| E2E-06 | Phase 228 | Pending |
| E2E-07 | Phase 228 | Pending |
| AMEND-01 | Phase 229 | Pending |
| AMEND-02 | Phase 229 | Pending |
| AMEND-03 | Phase 229 | Pending |
| AMEND-04 | Phase 229 | Pending |
| ENV-01 | Phase 230 | Pending |
| ENV-02 | Phase 230 | Pending |
| ENV-03 | Phase 230 | Pending |
| ENV-04 | Phase 230 | Pending |
| ENV-05 | Phase 230 | Pending |
| ENV-06 | Phase 230 | Pending |

**Coverage:**
- v1 requirements: 57 core + 6 stretch = 63 total
- Mapped to phases: 63
- Unmapped: 0

---
*Requirements defined: 2026-02-19*
*Last updated: 2026-02-19 -- traceability populated during roadmap creation*
