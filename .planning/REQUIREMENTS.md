# Requirements: GSD Skill Creator — v1.25 Ecosystem Integration

**Defined:** 2026-02-19
**Core Value:** Skills, agents, and teams must match official Claude Code patterns — and the GSD ecosystem must provide spatial, visual, and operational tools that make complex system design tangible.

## v1 Requirements

Requirements for v1.25. Each maps to roadmap phases.

### Dependency Map

- [x] **DEPMAP-01**: Ecosystem DAG resolves all cross-document dependencies into a directed acyclic graph with every vision document as a node and every declared dependency as a typed edge (hard-blocks, soft-enhances, shares-infrastructure)
- [x] **DEPMAP-02**: Circular dependency detection identifies and resolves any cycles in the ecosystem dependency graph with documented resolution rationale
- [x] **DEPMAP-03**: Critical path analysis identifies the longest chain that determines minimum ecosystem delivery time
- [x] **DEPMAP-04**: Parallel track identification extracts independent tracks that can proceed simultaneously without blocking each other
- [x] **DEPMAP-05**: Mermaid DAG diagram renders the full dependency graph in GitHub-compatible Markdown without any build tooling
- [x] **DEPMAP-06**: Machine-readable YAML adjacency list (`ecosystem-deps.yaml`) enables future tooling to consume the dependency graph programmatically
- [x] **DEPMAP-07**: Implementation-status annotations on each DAG node distinguish implemented, partial, aspirational, and permanently-deferred components by cross-referencing known-issues.md
- [x] **DEPMAP-08**: Build sequencing recommendation produces a milestone-by-milestone execution order that respects the critical path and maximizes parallel work
- [x] **DEPMAP-09**: Every edge in the DAG specifies at least one concrete interface (file path, schema, event name) — not just a document title reference

### EventDispatcher Specification

- [x] **EVTDSP-01**: Single-watcher design specifies a canonical EventDispatcher using one inotify instance (Rust `notify` 8.2 backend) with subscriber fan-out serving all ecosystem consumers
- [x] **EVTDSP-02**: Subscriber registration protocol defines how each consumer (ChipsetRouter, SessionObserver, DashboardNotifier, SiliconMonitor, ConsoleWatcher, StagingWatcher) registers for events with filtering criteria
- [x] **EVTDSP-03**: inotify watch budget table documents per-consumer handle allocations with total fitting within 50% of minimum system limit (target: GSD components use fewer than 4,096 watches)
- [x] **EVTDSP-04**: Debouncing configuration specifies per-subscriber debounce intervals and deduplication rules with rationale for timing choices
- [x] **EVTDSP-05**: Envelope unification adopts AMIGA EventEnvelope (9 fields) as ecosystem standard with Console MessageEnvelope (5 fields) becoming a constrained subset via a thin adapter
- [x] **EVTDSP-06**: Migration plan documents how the 2 existing independent watchers (dashboard auto-refresh, Tauri `notify`) transition to the shared EventDispatcher
- [x] **EVTDSP-07**: File naming conventions specify timestamps, message types, extensions, and directory structure (inbox/acknowledged/queue) resolving inconsistencies across ISA/console/staging patterns
- [x] **EVTDSP-08**: Polling fallback specification defines behavior when inotify watch limit is exhausted, including interval, log level, and user notification
- [x] **EVTDSP-09**: inotify-over-fanotify decision is explicitly documented with rationale (fanotify requires root/CAP_SYS_ADMIN, inappropriate for developer tools)

### Dependency Philosophy

- [x] **DEPPHL-01**: 4-tier dependency rules define explicit external dependency contracts for Core (zero deps), Middleware (lean npm), Platform (native toolchains), and Educational (match platform) layers using mandatory language
- [x] **DEPPHL-02**: Per-layer contracts specify what each layer provides to layers above and requires from layers below
- [x] **DEPPHL-03**: EventDispatcher placement decision resolves which layer owns the interface (Middleware `src/`) vs the implementation (Platform `src-tauri/`)
- [x] **DEPPHL-04**: Enforcement mechanisms define at minimum ESLint rules for `src/` vs `desktop/` import boundaries and Rust module visibility constraints
- [x] **DEPPHL-05**: Dependency exception process defines how violations are tracked, documented, and resolved with a tracking file format
- [x] **DEPPHL-06**: Philosophy gives a clear yes/no answer for any proposed external dependency at any layer with concrete examples

### Integration Test Strategy

- [x] **INTTEST-01**: Contract test approach selects Zod `.toJSONSchema()` + Vitest as the ecosystem contract testing mechanism with rationale for rejecting Pact and other HTTP-focused alternatives
- [x] **INTTEST-02**: Priority test flows document at least 5 cross-component integration scenarios with specific input/output at each boundary
- [x] **INTTEST-03**: Input/output schema definitions per cross-component boundary are specified using Zod schemas with `.passthrough()` for forward compatibility
- [x] **INTTEST-04**: At least one "structurally valid, semantically invalid" test case is documented per cross-component boundary
- [x] **INTTEST-05**: Freshness policy per boundary assigns an owner, last-verified date, and re-verification trigger for each contract
- [x] **INTTEST-06**: Fixture strategy defines `.planning/fixtures/` structure with per-flow snapshot projects at known pipeline stages
- [x] **INTTEST-07**: Spec compliance audit step is defined for subsequent milestone verification phases to check for EventDispatcher bypass

### Partial-Build Compatibility

- [x] **COMPAT-01**: Component-pair compatibility matrix documents behavior for every pair with at least 3 states (absent, partial, full) and version ranges
- [ ] **COMPAT-02**: Graceful degradation specification per component defines technical behavior AND user-visible signal AND resolution action when a peer is missing
- [x] **COMPAT-03**: Capability probe protocol defines structured readiness signals beyond binary filesystem-presence detection (version + maturity state)
- [x] **COMPAT-04**: Feature flags via filesystem-presence detection pattern is documented as the standard mechanism for progressive component availability
- [x] **COMPAT-05**: Known-issues cross-reference annotates matrix with implementation likelihood, distinguishing "not built yet" from "permanently deferred" (32 ISA items, 13 Silicon/ML, 13 hardware-only)
- [x] **COMPAT-06**: Matrix update trigger declares re-evaluation at every milestone completion with last-updated timestamp
- [ ] **COMPAT-07**: Per-component "standalone mode" spec describes minimum viable behavior without any peers

## Future Requirements

Deferred to subsequent milestones. Tracked but not in current roadmap.

### Implementation

- **IMPL-01**: EventDispatcher reference implementation (Rust + TypeScript)
- **IMPL-02**: Integration test implementation based on strategy from INTTEST
- **IMPL-03**: Dashboard capability probe integration showing component status
- **IMPL-04**: Existing watcher migration (dashboard auto-refresh + Tauri notify)

### Tooling

- **TOOL-01**: CI/CD pipeline integration for contract test enforcement
- **TOOL-02**: DAG visualization in dashboard (interactive, not static Mermaid)
- **TOOL-03**: Automated compatibility matrix generation from component metadata

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| EventDispatcher implementation | This milestone produces the spec; implementation is a dedicated follow-on milestone |
| Writing integration tests | Strategy doc only; tests ship with the components they verify |
| Modifying existing vision documents | This milestone recommends updates; modifications are separate work |
| Performance benchmarks or load testing | Focus is structural correctness at integration boundaries |
| CI/CD pipeline design | Orthogonal concern; noted as future work in the test strategy |
| Stub/shim catalog | Implementation-adjacent; deferred to component milestones |
| Fixture project library | Depends on test strategy being finalized first |
| Any new code implementation | This is an analytical/documentation milestone only |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DEPMAP-01 | Phase 231 | Complete |
| DEPMAP-02 | Phase 231 | Complete |
| DEPMAP-03 | Phase 231 | Complete |
| DEPMAP-04 | Phase 231 | Complete |
| DEPMAP-05 | Phase 231 | Complete |
| DEPMAP-06 | Phase 231 | Complete |
| DEPMAP-07 | Phase 231 | Complete |
| DEPMAP-08 | Phase 231 | Complete |
| DEPMAP-09 | Phase 231 | Complete |
| EVTDSP-01 | Phase 232 | Complete |
| EVTDSP-02 | Phase 232 | Complete |
| EVTDSP-03 | Phase 232 | Complete |
| EVTDSP-04 | Phase 232 | Complete |
| EVTDSP-05 | Phase 232 | Complete |
| EVTDSP-06 | Phase 232 | Complete |
| EVTDSP-07 | Phase 232 | Complete |
| EVTDSP-08 | Phase 232 | Complete |
| EVTDSP-09 | Phase 232 | Complete |
| DEPPHL-01 | Phase 233 | Complete |
| DEPPHL-02 | Phase 233 | Complete |
| DEPPHL-03 | Phase 233 | Complete |
| DEPPHL-04 | Phase 233 | Complete |
| DEPPHL-05 | Phase 233 | Complete |
| DEPPHL-06 | Phase 233 | Complete |
| INTTEST-01 | Phase 234 | Complete |
| INTTEST-02 | Phase 234 | Complete |
| INTTEST-03 | Phase 234 | Complete |
| INTTEST-04 | Phase 234 | Complete |
| INTTEST-05 | Phase 234 | Complete |
| INTTEST-06 | Phase 234 | Complete |
| INTTEST-07 | Phase 234 | Complete |
| COMPAT-01 | Phase 235 | Complete |
| COMPAT-02 | Phase 235 | Pending |
| COMPAT-03 | Phase 235 | Complete |
| COMPAT-04 | Phase 235 | Complete |
| COMPAT-05 | Phase 235 | Complete |
| COMPAT-06 | Phase 235 | Complete |
| COMPAT-07 | Phase 235 | Pending |

**Coverage:**
- v1 requirements: 38 total
- Mapped to phases: 38
- Unmapped: 0

---
*Requirements defined: 2026-02-19*
*Last updated: 2026-02-19 after roadmap creation*
