# Roadmap: GSD Skill Creator — v1.25 Ecosystem Integration

## Overview

This milestone makes implicit cross-dependencies between 18 ecosystem vision documents explicit through 5 analytical deliverables: a dependency DAG, a shared EventDispatcher specification, a dependency philosophy by layer, an integration test strategy, and a partial-build compatibility matrix. No new code is implemented — every deliverable is a specification or planning document that governs how future implementation milestones build and integrate. Phases execute sequentially; each deliverable builds on the preceding ones.

## Phases

**Phase Numbering:**
- Integer phases (231, 232, ...): Planned milestone work
- Decimal phases (231.1, 231.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 231: Ecosystem Dependency Map** - Resolve all cross-document dependencies into a DAG with critical path analysis and build sequencing
- [x] **Phase 232: Shared EventDispatcher Specification** - Unify 6 independent file-watching designs into one canonical spec with subscriber protocol and watch budget
- [x] **Phase 233: Dependency Philosophy by Layer** - Define external dependency contracts for Core/Middleware/Platform/Educational tiers with enforcement mechanisms (completed 2026-02-19)
- [x] **Phase 234: Integration Test Strategy** - Establish cross-component contract testing approach with priority test flows and freshness policies (completed 2026-02-19)
- [x] **Phase 235: Partial-Build Compatibility Matrix** - Document component-pair behavior at multiple maturity levels with graceful degradation specs (completed 2026-02-19)

## Phase Details

### Phase 231: Ecosystem Dependency Map
**Goal**: The full ecosystem dependency structure is documented as a navigable, machine-readable DAG that reveals critical paths, parallel tracks, and build sequencing for all future milestones
**Depends on**: Nothing (first phase)
**Requirements**: DEPMAP-01, DEPMAP-02, DEPMAP-03, DEPMAP-04, DEPMAP-05, DEPMAP-06, DEPMAP-07, DEPMAP-08, DEPMAP-09
**Success Criteria** (what must be TRUE):
  1. A reader can trace any cross-document dependency from source to target through the Mermaid diagram, seeing the edge type (hard-blocks, soft-enhances, shares-infrastructure) and the concrete interface (file path, schema, event name) that connects them
  2. A reader can identify which components sit on the critical path and which can be built in parallel by reading the critical path and parallel track sections
  3. A tool can consume `ecosystem-deps.yaml` and reconstruct the full graph programmatically without parsing prose
  4. Every DAG node is annotated with implementation status (implemented, partial, aspirational, permanently-deferred) cross-referenced against known-issues.md, so a reader knows what exists vs. what is planned
  5. A milestone planner can read the build sequencing recommendation and determine which milestone to build next without consulting any other document
**Plans:** 3/3 plans complete

Plans:
- [x] 231-01-PLAN.md — Node inventory with implementation status annotations
- [x] 231-02-PLAN.md — Edge extraction with concrete interfaces and cycle resolution
- [x] 231-03-PLAN.md — Mermaid diagram, YAML adjacency list, critical path, and build sequencing

### Phase 232: Shared EventDispatcher Specification
**Goal**: A single canonical EventDispatcher design exists that all ecosystem consumers reference, replacing 6 independent file-watching designs with one shared specification that includes subscriber protocol, watch budgets, and migration paths for existing watchers
**Depends on**: Phase 231
**Requirements**: EVTDSP-01, EVTDSP-02, EVTDSP-03, EVTDSP-04, EVTDSP-05, EVTDSP-06, EVTDSP-07, EVTDSP-08, EVTDSP-09
**Success Criteria** (what must be TRUE):
  1. An implementer can build the EventDispatcher from the spec alone, knowing the Rust backend architecture (notify 8.2, tokio::broadcast), the TypeScript interface surface, every subscriber's registration protocol, and the debouncing rules — without consulting any vision document
  2. A reader can verify that total GSD inotify watch consumption stays under 4,096 handles by summing the per-consumer allocations in the watch budget table
  3. An implementer knows exactly how to migrate the 2 existing independent watchers (dashboard auto-refresh, Tauri notify) to the shared EventDispatcher by following the migration plan
  4. A developer adding a new file-watching consumer can follow the envelope format (AMIGA EventEnvelope as ecosystem standard), file naming conventions, and directory structure conventions without inventing new patterns
  5. A reader understands what happens when inotify watches are exhausted (polling fallback behavior, interval, log level, user notification) and why inotify was chosen over fanotify
**Plans:** 3/3 plans complete

Plans:
- [x] 232-01-PLAN.md — Core EventDispatcher architecture, subscriber protocol, debouncing, and watch budget table
- [x] 232-02-PLAN.md — Envelope unification (AMIGA EventEnvelope standard, Console adapter) and file naming conventions
- [x] 232-03-PLAN.md — Migration plan for 2 existing watchers, polling fallback, and inotify-over-fanotify rationale

### Phase 233: Dependency Philosophy by Layer
**Goal**: Any developer can get a definitive yes/no answer on whether a proposed external dependency is acceptable at any ecosystem layer, with the EventDispatcher placement question resolved and enforcement mechanisms defined
**Depends on**: Phase 232
**Requirements**: DEPPHL-01, DEPPHL-02, DEPPHL-03, DEPPHL-04, DEPPHL-05, DEPPHL-06
**Success Criteria** (what must be TRUE):
  1. A developer proposing a new dependency at any layer (Core, Middleware, Platform, Educational) can read the 4-tier rules and get a clear yes/no answer with concrete examples of what belongs and what does not
  2. A reader can trace what each layer provides upward and requires downward through the per-layer contract definitions
  3. The EventDispatcher placement is unambiguous: a reader knows which layer owns the interface and which owns the implementation, and why
  4. An enforcement mechanism exists (at minimum ESLint rules and Rust module visibility constraints) that can catch boundary violations before they reach main, plus a documented exception process for tracking justified violations
**Plans:** 2/2 plans complete

Plans:
- [x] 233-01-PLAN.md — 4-tier dependency rules, per-layer contracts, and dependency decision tree
- [x] 233-02-PLAN.md — EventDispatcher placement, enforcement mechanisms (ESLint + Rust), and exception process

### Phase 234: Integration Test Strategy
**Goal**: Cross-component integration boundaries have a defined contract testing approach with priority test flows, schema definitions, semantic test cases, and freshness policies that prevent contract drift
**Depends on**: Phase 233
**Requirements**: INTTEST-01, INTTEST-02, INTTEST-03, INTTEST-04, INTTEST-05, INTTEST-06, INTTEST-07
**Success Criteria** (what must be TRUE):
  1. A test author can implement contract tests for any cross-component boundary using the selected approach (Zod .toJSONSchema() + Vitest) by following the strategy document, with rationale for why Pact and other HTTP-focused alternatives were rejected
  2. At least 5 priority cross-component test flows are documented with specific input/output at each boundary, so a test implementer knows exactly what to verify
  3. Every cross-component boundary has at least one "structurally valid, semantically invalid" test case documented, preventing schema-only contracts that miss runtime failures
  4. Every contract has an assigned owner, last-verified date, and re-verification trigger — so contract staleness is detectable and preventable
  5. The fixture strategy (`.planning/fixtures/` structure) and spec compliance audit step are defined, enabling future milestones to verify EventDispatcher adoption and contract freshness
**Plans:** 3/3 plans complete

Plans:
- [x] 234-01-PLAN.md — Contract testing approach (Zod + Vitest, Pact rejection), 6 priority flows with I/O, boundary schema inventory
- [x] 234-02-PLAN.md — Semantic test cases per boundary and freshness policies with ownership table
- [x] 234-03-PLAN.md — Fixture directory structure and EventDispatcher compliance audit step

### Phase 235: Partial-Build Compatibility Matrix
**Goal**: Any developer building a subset of the ecosystem can look up exactly what works, what degrades gracefully, and what breaks — with user-visible signals and resolution actions for every degradation scenario
**Depends on**: Phase 234
**Requirements**: COMPAT-01, COMPAT-02, COMPAT-03, COMPAT-04, COMPAT-05, COMPAT-06, COMPAT-07
**Success Criteria** (what must be TRUE):
  1. A developer building any component subset can look up the component-pair matrix and see behavior at 3+ maturity states (absent, partial, full) with version ranges — not just binary present/absent
  2. For every degradation scenario, a reader knows three things: the technical behavior, the user-visible signal, and the resolution action to restore full functionality
  3. The capability probe protocol is defined (structured version + maturity response), so components can detect peers beyond binary filesystem-presence checks
  4. The matrix distinguishes "not built yet" from "permanently deferred" by cross-referencing known-issues.md (32 ISA items, 13 Silicon/ML, 13 hardware-only), and declares a re-evaluation trigger at every milestone completion
  5. Every component has a documented "standalone mode" describing minimum viable behavior without any peers
**Plans:** 3/3 plans complete

Plans:
- [x] 235-01-PLAN.md — Known-issues cross-reference and component-pair compatibility matrix with maintenance triggers
- [x] 235-02-PLAN.md — Graceful degradation specifications and per-component standalone modes
- [x] 235-03-PLAN.md — Capability probe protocol with 3-tier detection hierarchy

## Progress

**Execution Order:**
Phases execute in numeric order: 231 → 232 → 233 → 234 → 235

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 231. Ecosystem Dependency Map | 3/3 | Complete    | 2026-02-19 |
| 232. Shared EventDispatcher Specification | 3/3 | Complete    | 2026-02-19 |
| 233. Dependency Philosophy by Layer | 2/2 | Complete    | 2026-02-19 |
| 234. Integration Test Strategy | 3/3 | Complete    | 2026-02-19 |
| 235. Partial-Build Compatibility Matrix | 3/3 | Complete    | 2026-02-19 |

---
*Roadmap created: 2026-02-19*
*Milestone: v1.25 GSD Ecosystem Integration — Critical Path, Standards & Resilience*
