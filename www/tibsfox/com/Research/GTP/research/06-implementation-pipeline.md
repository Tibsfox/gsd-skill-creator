# Spec-to-Implementation Pipeline

> **Domain:** Software Architecture & Build Systems
> **Module:** 6 -- Implementation Pipeline
> **Through-line:** *A blueprint is not a building. The distance between a complete TypeScript specification and a running application is shorter than it looks -- and longer than developers usually estimate.* The GTP specification does the hard intellectual work: it decides what the rooms are, what they contain, how they relate, and what cannot be allowed. The implementation pipeline is the bridge that makes those decisions executable.

---

## Table of Contents

1. [The Spec Fidelity Principle](#1-the-spec-fidelity-principle)
2. [Translation Map: Spec Artifact to Implementation Artifact](#2-translation-map-spec-artifact-to-implementation-artifact)
3. [Component Generation from TypeScript](#3-component-generation-from-typescript)
4. [Safety Warden Runtime Patterns](#4-safety-warden-runtime-patterns)
5. [Cultural Sovereignty Access Architecture](#5-cultural-sovereignty-access-architecture)
6. [Progressive Implementation Sequencing](#6-progressive-implementation-sequencing)
7. [Phase Architecture](#7-phase-architecture)
8. [Wave Execution Plan](#8-wave-execution-plan)
9. [Toolchain and Automation](#9-toolchain-and-automation)
10. [Blueprint Synthesis](#10-blueprint-synthesis)
11. [Test Plan and Verification](#11-test-plan-and-verification)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. The Spec Fidelity Principle

An implementation is correct when every constraint encoded in the specification is structurally enforced -- not just honored by convention. Cultural sovereignty gating is not a style guide; it is an architectural invariant. Safety warden rules are not suggestions; they are compile-time or load-time contracts.

The GTP specification contains 14 rooms, a full TypeScript type system, visualization specs, a safety warden protocol, and a cultural sovereignty framework. No implementation exists. The gap between spec and running application is acknowledged and deliberate -- but it needs a bridge plan that preserves every constraint the spec encodes.

### 1.1 The Opportunity

Because the spec is so complete, implementation can be systematic. Components can be generated from interfaces. Validation can be compiled from the safety warden spec. The visualization specs can become React component skeletons. The heavy thinking is already done.

### 1.2 The Trap

"Implementation is just execution" leads to underestimating the integration surface. Fourteen rooms with 4 tradition domains, 4 sovereignty levels, 6 safety domains, and a cross-room navigation model produce a non-trivial application architecture. The bridge from spec to code requires its own research.

### 1.3 Fidelity Test

Every spec constraint must be **unreachable to violate**, not merely discouraged from violating. This is the bar. If a developer can accidentally render SACRED_CEREMONIAL content by misconfiguring a component, the architecture has failed -- regardless of whether documentation says "don't do that."

---

## 2. Translation Map: Spec Artifact to Implementation Artifact

The specification produces nine categories of artifact. Each maps to a specific implementation artifact with a defined translation strategy.

| Specification Artifact | Implementation Artifact | Translation |
|----------------------|------------------------|-------------|
| TypeScript enum | Runtime constant + type guard | Direct compilation |
| TypeScript interface | React component prop type | ts-morph generation |
| Room definition object | Route + shell component + data loader | Scaffold generation |
| TrySession struct | Interactive session component | Step-by-step builder |
| SafetyAnnotation | Safety warden HOC / hook | Wrapper pattern |
| CulturalSovereigntyLevel | Content access gate (architectural) | Data-layer enforcement |
| VisualizationSpec | Storybook component + CSS module | D3.js + React bridge |
| ValidationRule | Zod schema (runtime enforcement) | ts-to-zod conversion |
| SampleData (Module 03) | Initial fixture + integration test | Direct loading |

The translation fidelity test for each row: can a developer violate the spec constraint without the build system or runtime catching it? If yes, the translation is incomplete.

---

## 3. Component Generation from TypeScript

### 3.1 The Interface-to-Component Mapping Problem

A TypeScript interface is a description of data. A React component is a description of rendered output with behavior. The mapping between them is not mechanical -- a single interface may generate multiple components, or a single component may consume multiple interfaces.

For GTP, the relevant mapping decisions are:

| GTP Interface | React Component(s) | Mapping Notes |
|--------------|-------------------|---------------|
| `SkillModule` | `<RoomShell>` + router | Top-level routing structure; not a single component |
| `TrySession` | `<TrySession>` + steps | Step-by-step interactive component with state |
| `TrySessionStep` | `<Step>` + `<StepSafety>` | Safety annotation rendered inline per step |
| `ContentModule` | `<ContentPanel>` | Reads from content type variant; polymorphic |
| `SafetyAnnotation` | Safety Warden HOC | Applied as wrapper, not as a standalone component |
| `CulturalContext` | `<OntologicalBridge>` | Sidebar component for cross-tradition context |

### 3.2 Code Generation Tooling

**ts-morph** (TypeScript compiler API wrapper) enables programmatic reading of TypeScript interface definitions and generation of scaffolding code. For GTP, a code generation script reading Module 03 could produce:

- Empty room shell components with correct prop types
- Storybook stories with sample data pre-loaded
- Jest test fixtures derived from interface shapes
- Prop documentation extracted from JSDoc comments

This reduces the Phase 2 room rollout from manual scaffolding to a one-command generation step.

**Zod schema generation** from TypeScript interfaces (via `ts-to-zod` or hand-written conversion) provides runtime validation identical to the compile-time types. This is essential for GTP: a room that receives malformed content data should fail loudly at the validation boundary, not silently render incorrect information.

### 3.3 The Generation Pipeline

```
GTP Module 03 TypeScript Interfaces
        |
        v
  ts-morph AST reader
        |
        +-- Room shell components (.tsx)
        +-- Storybook stories (.stories.tsx)
        +-- Zod schemas (validation.ts)
        +-- Test fixtures (*.test.ts)
        +-- Prop documentation (*.props.md)
        |
        v
  Manual enrichment layer
  (visualization logic, interaction handlers,
   content-specific rendering)
```

The generation step produces structure. The enrichment step produces behavior. Keeping these stages separate prevents generated code from being accidentally overwritten during enrichment and ensures the type contract is never weakened.

---

## 4. Safety Warden Runtime Patterns

### 4.1 The Four Safety Levels in UI

The GTP specification defines four safety levels. Each requires a distinct UI behavior and a distinct implementation pattern.

| Safety Level | UI Behavior | Implementation Pattern |
|-------------|------------|----------------------|
| STANDARD | Normal render | No wrapping needed; default path |
| ANNOTATED | Inline note visible | `<SafetyNote>` component injected before content |
| GATED | Modal confirmation | `<SafetyGate>` HOC wraps content; modal on first access |
| REDIRECTED | Hard block | `<SafetyRedirect>` renders alternative; original never loads |

### 4.2 The REDIRECTED Constraint

The key architectural principle: REDIRECTED content must never be in the render tree. A React component that conditionally renders blocked content is **wrong** -- the content payload should not travel to the client at all. REDIRECTED is a data-layer decision, not a UI-layer decision.

This means the data loader for each room must check safety levels before sending content to the component tree. Content at REDIRECTED level is replaced at the data boundary with a redirect payload that contains only the alternative content and a reason code.

### 4.3 Reference Implementations from the Wild

**Archive of Our Own (AO3)** operates the largest content warning system in fan publishing: 11+ million works, 8 content warning categories, with both author-applied and reader-preference filtering. Their "choose not to warn" pattern is relevant to GTP's ANNOTATED level -- some safety notes are informational, not gatekeeping.

**Reddit's NSFW gating**, despite its domain, established the UX pattern that modal-confirm-before-proceeding produces less friction than requiring navigation to a settings page. For GTP's GATED level, the modal-at-first-access pattern is the correct approach.

### 4.4 Safety Warden Architecture

```
Content Request
    |
    v
Data Loader (checks SafetyAnnotation)
    |
    +-- STANDARD --> pass through to component
    |
    +-- ANNOTATED --> attach SafetyNote metadata
    |                 Component renders note inline
    |
    +-- GATED --> attach gate requirement
    |             SafetyGate HOC intercepts render
    |             Modal confirmation required
    |             User choice persisted per session
    |
    +-- REDIRECTED --> replace payload entirely
                      Alternative content only
                      Original content never sent to client
```

---

## 5. Cultural Sovereignty Access Architecture

### 5.1 OCAP Principles in Software

The First Nations Information Governance Centre's OCAP principles (Ownership, Control, Access, Possession) establish that First Nations communities have the right to govern how their information is collected, used, and shared [1]. For GTP, OCAP translates to architectural requirements:

- **Ownership:** Content marked as community-owned is never modified without authorization
- **Control:** `COMMUNITY_RESTRICTED` content requires authenticated community authorization to access
- **Access:** `PUBLICLY_SHARED` content flows normally; `CONTEXTUALLY_SHARED` requires educational context confirmation
- **Possession:** `SACRED_CEREMONIAL` content is not held in the GTP system at all -- it is referenced by name only, never stored

### 5.2 The Sacred/Ceremonial Architectural Pattern

`SACRED_CEREMONIAL` content at sovereignty level 4 must be architecturally unreachable. The correct implementation pattern:

1. Content at this level is never authored into the content model
2. The `CulturalSovereigntyLevel.SACRED_CEREMONIAL` enum value exists as a classification marker only
3. A TypeScript build-time check validates that no room content object ever carries this value with associated content payload
4. At runtime, any data with this level renders a respectful acknowledgment that this knowledge belongs to the community -- not a "you don't have access" error

This follows the digital repatriation protocols established by Te Ara Pounamu (New Zealand Museums) and the Protocols for Native American Archival Materials [2], which distinguish between "access denied" (institutional gatekeeping) and "knowledge that lives with the community" (relational sovereignty).

### 5.3 The Four Sovereignty Levels

| Level | Name | Architecture | User Experience |
|-------|------|-------------|----------------|
| 1 | PUBLICLY_SHARED | No restriction | Normal content rendering |
| 2 | CONTEXTUALLY_SHARED | Context gate | Educational framing required before content appears |
| 3 | COMMUNITY_RESTRICTED | Auth gate | Community authorization verified at data layer |
| 4 | SACRED_CEREMONIAL | No content stored | Respectful acknowledgment; content lives with community |

### 5.4 Build-Time Enforcement

A compile-time validation script runs as part of the build pipeline:

```
For each room content object:
  If sovereignty_level === SACRED_CEREMONIAL:
    Assert content_payload === null
    Assert acknowledgment_text !== null
    FAIL BUILD if content_payload exists
```

This is not a runtime check that could be bypassed. It is a build gate. If someone adds content at level 4, the build breaks before the artifact is produced.

---

## 6. Progressive Implementation Sequencing

### 6.1 The Problem

The GTP spec was designed top-down. Implementation must proceed bottom-up. The order in which rooms, components, and systems should be built is undetermined. Without a sequencing plan, work parallelizes incorrectly and dependencies are discovered mid-build.

### 6.2 Room Dependency Analysis

The 14 GTP rooms are not fully independent. Analysis of the specification reveals priority tiers:

| Room | Domain | Tradition(s) | Implementation Priority |
|------|--------|-------------|----------------------|
| 01 | Building Shelter | Appalachian | Phase 2 pilot (reference implementation) |
| 03 | Animals | First Nations | Phase 2 pilot (sovereignty gating test) |
| 09 | Plants | Cross-Tradition | Phase 2 pilot (shared knowledge test) |
| 02, 04-08 | Various | Various | Phase 3 (follow Room 01 pattern) |
| 10-12 | Community/Seasonal/History | All | Phase 3 (late; cross-tradition complexity) |
| 13, 14 | Northern Watercraft/Arctic | First Nations/Inuit | Phase 3 (highest sovereignty complexity) |

Rooms 13 and 14 carry the highest cultural sovereignty complexity (Inuit-specific content under IQ principles). They should be the last rooms implemented, after sovereignty gating is fully tested and reviewed with Inuit community liaisons.

### 6.3 Feature Flag Strategy

Each room should be deployed behind a feature flag keyed to `RoomNumber`. This allows:

- Rooms 01, 03, 09 to go live for integration testing while rooms 2-14 are still in development
- Community review of rooms 13-14 before public availability
- Rollback of individual rooms without affecting the rest of the application
- A/B testing of room ordering and navigation paths

### 6.4 Integration Test Timing

Integration tests must run after each room pair is completed, not deferred to a final integration phase. Cross-room integration points to test early:

- Navigation between rooms preserves user progress state
- Shared type system renders correctly across room boundaries
- Safety warden state persists across room transitions
- Sovereignty gates do not leak context between rooms

---

## 7. Phase Architecture

The implementation proceeds in six phases. Each phase has a clear entry condition, deliverable, and exit gate.

### Phase 0: Foundation Layer

- `@gsd/gtp-types` package compiled from Module 03
- Zod schema generation from TypeScript interfaces
- Route structure (14 rooms as URL paths)
- Empty room shell component (generated via ts-morph)

**Exit gate:** All types compile, all routes resolve, shell renders.

### Phase 1: Safety + Sovereignty Infrastructure

- SafetyWarden HOC (ANNOTATED / GATED / REDIRECTED behaviors)
- SovereigntyGate component (architectural content blocking)
- Both systems unit-tested BEFORE any content loads
- Build-time SACRED_CEREMONIAL validation script

**Exit gate:** Safety and sovereignty systems pass all unit tests with synthetic content.

### Phase 2: Pilot Rooms (3 rooms, 1 per tradition)

- Room 01 (Building/Appalachian) -- reference implementation
- Room 03 (Animals/First Nations) -- sovereignty gating test
- Room 09 (Plants/Cross-Tradition) -- shared knowledge test

**Exit gate:** Three rooms render, cross-room navigation works, sovereignty gates enforce correctly.

### Phase 3: Room Rollout (rooms 2-14, parallel)

- Each room follows Room 01 reference implementation
- Integration tests run after each room pair
- Rooms 13-14 deferred pending community review

**Exit gate:** All 14 rooms render. All integration tests pass.

### Phase 4: Navigation + Cross-Room Systems

- Skill path navigation (prerequisite chains)
- Progress tracking (per-user state)
- Cross-room prerequisite enforcement

**Exit gate:** Full curriculum path navigable. Progress persists.

### Phase 5: Visualization Layer

- Visualization specs compiled to React + D3.js components
- Responsive layout audit
- Accessibility audit (WCAG 2.2 compliance)

**Exit gate:** All visualizations render. Accessibility audit passes.

---

## 8. Wave Execution Plan

The mission decomposes into four execution waves with explicit parallelism and dependency management.

### 8.1 Wave Summary

| Wave | Name | Mode | Model | Output |
|------|------|------|-------|--------|
| W0 | Foundation | Sequential | Haiku | Scaffolding, ADR template, route structure |
| W1 | Parallel Research | Parallel | Sonnet + Opus | Modules A (components), B (safety), C (cultural), D (sequencing) |
| W2 | Blueprint Synthesis | Sequential | Opus | Module E (complete implementation blueprint) |
| W3 | Publication | Sequential | Sonnet | PDF assembly, verification matrix, commit |

### 8.2 Wave Architecture

```
WAVE 0: Foundation (Sequential, Haiku)
  [Component Schema] --> [Route Scaffold] --> [Cultural ADR Template]

WAVE 1: Parallel Research (Sonnet + Opus)
  TRACK A                         TRACK B
  [Mod-A: Component Gen]          [Mod-C: Cultural Access]  <-- Opus
  [Mod-B: Safety Warden]
  [Mod-D: Sequencing]
        |                               |
        v                               v
WAVE 2: Blueprint Synthesis (Sequential, Opus)
  [Mod-E: GTP Implementation Blueprint]
  [Cultural ADR + Phase 0 Checklist]
        |
        v
WAVE 3: Publication + Verification (Sequential, Sonnet)
  [PDF Assembly] --> [Verification Matrix] --> [Commit]
```

### 8.3 Dependency Graph

Module C (Cultural Access Architecture) is the critical path. It requires Opus-level cultural judgment and includes a CAPCOM gate for human review before Wave 2 can begin. The blueprint synthesis in Wave 2 cannot proceed until Module C is approved.

### 8.4 Cache Optimization

- GTP Module 03 type definitions loaded once in Wave 0; all subsequent agents reference via cache hit
- Module C cultural ADR produced in a single dedicated Opus session to preserve cultural context coherence
- Blueprint synthesis loads all 4 module summaries in a single Opus context within the 5-minute cache window
- CAPCOM hold for human review of Module C output before Wave 2 begins (cultural sensitivity gate)

---

## 9. Toolchain and Automation

### 9.1 Build Pipeline Tools

| Tool | Purpose | Phase |
|------|---------|-------|
| ts-morph | AST reading, component scaffold generation | Phase 0 |
| ts-to-zod | TypeScript-to-Zod schema conversion | Phase 0 |
| Zod | Runtime validation enforcement | Phase 1+ |
| Storybook | Component development and visual testing | Phase 2+ |
| D3.js | Visualization rendering | Phase 5 |
| Vite | Build and dev server | All phases |
| Vitest | Unit and integration testing | All phases |

### 9.2 Workflow Automation

The spec-to-implementation pipeline is designed to be repeatable. If the GTP specification changes (a room is added, a type is modified), the pipeline can be re-run:

1. **Schema regeneration:** ts-morph reads updated interfaces, regenerates shell components
2. **Validation update:** Zod schemas regenerated from new types
3. **Fixture update:** Test fixtures regenerated from new sample data
4. **Delta detection:** Diff between old and new generated code identifies what enrichment logic needs updating

This ensures the implementation stays synchronized with the specification without manual tracking of changes across 14 rooms.

### 9.3 Chipset Configuration

```
chipset:
  mission: gtp-spec-to-implementation
  version: 1.0.0
  profile: squadron
  models:
    opus:    0.30   # Cultural architecture, synthesis, ADR writing
    sonnet:  0.60   # Component surveys, safety pattern research, sequencing
    haiku:   0.10   # Shared schemas, route scaffolding
  modules:
    - id: mod-a
      name: component-generation
      model: sonnet
      parallel: true
    - id: mod-b
      name: safety-warden-runtime
      model: sonnet
      parallel: true
    - id: mod-c
      name: cultural-access-architecture
      model: opus
      parallel: false   # Cultural sensitivity requires Opus
    - id: mod-d
      name: progressive-sequencing
      model: sonnet
      parallel: true
    - id: mod-e
      name: implementation-blueprint
      model: opus
      parallel: false   # Wave 2 synthesis
  waves: 4
  cache_ttl_target: 5min
  cultural_sensitivity: high
```

---

## 10. Blueprint Synthesis

### 10.1 What the Blueprint Contains

Module E synthesizes findings from Modules A-D into a complete GTP Implementation Blueprint: a handoff-ready document that a development team can execute directly.

The blueprint includes:

- **Component hierarchy:** All 14 rooms decomposed into component trees with prop types
- **Phase sequencing:** Dependency-correct ordering from Phase 0 through Phase 5
- **Integration test plan:** Cross-room integration points with test specifications
- **Cultural sovereignty ADR:** Architecture Decision Record documenting all sovereignty decisions and their rationale
- **Phase 0 checklist:** A "can we ship this?" checklist with 10+ items covering type compilation, route resolution, safety enforcement, sovereignty validation, and accessibility baseline

### 10.2 Handoff Readiness

The blueprint must pass the zero-context test: a developer with no prior GTP context can begin Phase 0 from it. This means:

- No implicit knowledge assumptions
- Every acronym defined on first use
- Every tool referenced with installation instructions
- Every cultural constraint explained with its rationale, not just its rule
- The "why" behind sovereignty architecture is as documented as the "how"

### 10.3 The Phase 0 Checklist

1. All GTP Module 03 TypeScript interfaces compile without error
2. Zod schemas generated and validated against sample data
3. All 14 room routes resolve to shell components
4. SafetyWarden HOC renders correctly at all 4 safety levels
5. SovereigntyGate blocks SACRED_CEREMONIAL content at build time
6. Build-time validation script passes with zero SACRED_CEREMONIAL content payloads
7. COMMUNITY_RESTRICTED auth gate returns 403 without valid authorization
8. Feature flag system enables/disables individual rooms
9. Storybook renders all generated components with sample data
10. Integration test harness covers cross-room navigation
11. Accessibility baseline audit passes WCAG 2.2 Level A
12. Cultural sovereignty ADR reviewed and approved by CAPCOM

---

## 11. Test Plan and Verification

### 11.1 Test Categories

| Category | Count | Priority | On Failure | Description |
|----------|-------|----------|-----------|-------------|
| Safety-critical | 5 | Mandatory | BLOCK | Source quality, cultural attribution, sovereignty architecture |
| Core functionality | 16 | Required | BLOCK | Deliverable completeness per success criterion |
| Integration | 6 | Required | BLOCK | Cross-module blueprint coherence |
| Edge cases | 5 | Best-effort | LOG | Contested patterns, data gaps, temporal currency |
| **Total** | **32** | | | |

### 11.2 Safety-Critical Tests

| Test ID | Verifies | Expected Behavior |
|---------|----------|-------------------|
| SC-SRC | Source quality | All citations traceable to official documentation, 1k+ star GitHub repos, W3C standards, or cultural governance organizations |
| SC-IND | Indigenous attribution | Every First Nations or Inuit architectural recommendation names specific nation and framework (OCAP, IQ), never generic "Indigenous" |
| SC-SAC | Sacred/Ceremonial pattern | SACRED_CEREMONIAL architecture must be structurally unreachable, not conditionally rendered. Any solution relying on runtime conditions FAILS |
| SC-MED | Safety redirect accuracy | REDIRECTED safety level content must never appear in render tree -- verified by architecture review |
| SC-ADV | No prescriptive advocacy | Blueprint presents evidence-based implementation options; does not mandate specific frontend frameworks without justification |

### 11.3 Verification Matrix

| Success Criterion | Test ID(s) |
|-------------------|-----------|
| Component generation covers all 6 core interfaces | CF-01, CF-02 |
| Safety warden covers all 4 levels with UI behavior | CF-03, CF-04, CF-05 |
| SACRED_CEREMONIAL is structurally unreachable | SC-SAC, CF-06 |
| OCAP principles reflected in sovereignty gate | SC-IND, CF-07 |
| Implementation phases cover all 14 rooms in order | CF-08, CF-09 |
| Integration test strategy pre-identifies cross-room points | CF-10, IN-01 |
| Feature-flag strategy prevents broken navigation | CF-11, IN-02 |
| Blueprint is handoff-ready (zero-context developer) | IN-03, IN-04 |
| Cultural ADR is complete | CF-12, SC-IND |
| Phase 0 checklist has 8+ items | CF-13 |
| Cultural sources meet professional standard | SC-SRC |
| Safety patterns cite WCAG or equivalent | CF-14, SC-MED |

### 11.4 Crew Manifest

| Role | Agent | Responsibility |
|------|-------|---------------|
| FLIGHT | Orchestrator | Mission direction; go/no-go gates including cultural review gate |
| PLAN | Planner | Wave decomposition; Module C sequencing as critical path |
| SCOUT | Research Agent | Technical source gathering; cultural governance documentation |
| EXEC-1 | Executor A | Modules A, B, D document production |
| EXEC-2 | Executor B | Module C cultural ADR production |
| CRAFT-BUILD | Build Specialist | Component generation + sequencing analysis |
| CRAFT-CULTURAL | Cultural Specialist | OCAP, IQ, digital sovereignty architecture |
| VERIFY | Verification | Source validation; cultural attribution accuracy |
| INTEG | Integration Agent | Blueprint coherence across all modules |
| CAPCOM | HITL Interface | Human approval; mandatory gate after Module C output |
| BUDGET | Resource Manager | Token budget; Opus allocation tracking |
| LOG | Chronicle Agent | Audit trail; cultural decision documentation |

---

## 12. Cross-References

- **[Module 01: Source Material](01-source-material.md)** -- Phase 1 research inventory that feeds the implementation pipeline
- **[Module 02: Research-to-Room Mapping](02-research-to-room-mapping.md)** -- Room decomposition that the pipeline must implement faithfully
- **[Module 03: Data Structure Specification](03-data-structure-specification.md)** -- TypeScript interfaces that are the pipeline's primary input
- **[Module 04: Constellation Map](04-constellation-map-specification.md)** -- D3.js visualization spec that Phase 5 must compile to running code
- **[Module 05: Two-Chart Visualization](05-two-chart-visualization.md)** -- Second visualization spec for Phase 5 implementation
- **[GGT: Geggy Tah Deep Research](../GGT/index.html)** -- Primary source for all Phase 1 research content
- **[DAA: Deep Audio Analysis](../DAA/index.html)** -- Sonic analysis methodology informing audio components
- **[SPA: Spatial Awareness](../SPA/index.html)** -- Room-based spatial metaphor architecture
- **[MCR: Minecraft RAG](../MCR/index.html)** -- Room-building pedagogy patterns

---

## 13. Sources

1. First Nations Information Governance Centre. *OCAP Principles.* [fnigc.ca/ocap-training](https://fnigc.ca/ocap-training/)
2. Protocols for Native American Archival Materials (2006). [nau.edu/libnap-p](https://www2.nau.edu/libnap-p/)
3. United Nations Declaration on the Rights of Indigenous Peoples, Article 31 -- rights to cultural heritage and traditional knowledge. UN General Assembly, 2007.
4. Inuit Tapiriit Kanatami. *Inuit Qaujimajatuqangit Framework.* [itk.ca](https://www.itk.ca/)
5. ts-morph library -- TypeScript AST manipulation. [ts-morph.com](https://ts-morph.com)
6. Zod documentation -- runtime schema enforcement. [zod.dev](https://zod.dev)
7. React documentation: Higher-Order Components and Hooks. [react.dev](https://react.dev)
8. W3C Web Content Accessibility Guidelines (WCAG) 2.2. [w3.org/TR/WCAG22](https://www.w3.org/TR/WCAG22/)
9. ts-to-zod: TypeScript to Zod schema generator. [github.com/fabien0102/ts-to-zod](https://github.com/fabien0102/ts-to-zod)
10. Archive of Our Own content warning system documentation. Organization for Transformative Works, 2023.
11. Nielsen Norman Group. "Warning Messages: Design Guidelines." [nngroup.com](https://www.nngroup.com)
12. Te Ara Pounamu digital repatriation protocols. Museums Aotearoa, New Zealand.
13. Vite documentation. [vitejs.dev](https://vitejs.dev)
14. Vitest documentation. [vitest.dev](https://vitest.dev)

---

> *"The rooms exist on paper with complete data structures. The gap between spec and running code is real and acknowledged. What makes the crossing possible is that the spec already did the hard work -- it decided what the rooms mean. Implementation only needs to decide how to render that meaning faithfully."*
> -- GTP Architectural Review, March 2026
