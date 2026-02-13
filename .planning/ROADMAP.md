# Roadmap: v1.17 Staging Layer

**Milestone:** v1.17 Staging Layer
**Phases:** 8 (134-141)
**Requirements:** 38 mapped
**Depth:** Comprehensive
**Start date:** 2026-02-13

## Overview

The staging layer introduces a five-component pipeline between human ideation and machine execution. Work enters through smart intake, passes security hygiene checks, undergoes resource analysis and derived knowledge validation, then enters a managed queue for parallel execution. Phases are ordered by dependency: foundation types first, then detection machinery, then trust/reporting, then the intake flow that consumes hygiene, then resource analysis and derived knowledge in parallel-capable phases, and finally the queue that ties everything together.

---

## Phase 134: Staging Foundation

**Goal:** Documents submitted through the console land on the filesystem with structured metadata and move through well-defined states

**Dependencies:** None (builds on existing console upload zone from v1.16)

**Requirements:** INTAKE-01, INTAKE-02, INTAKE-05

**Success Criteria:**
1. User uploads a document through the console and it appears in `.planning/staging/inbox/` within one second
2. Every staged document has a companion `.meta.json` file with submitted_at, source, and status fields
3. Documents can be moved between filesystem states (inbox, checking, attention, ready, aside) and the metadata status field updates to match
4. The staging directory structure is created on first use with all six subdirectories

**Plans:** 3 plans

Plans:
- [x] 134-01-PLAN.md — Types, schema, and directory foundation (TDD) -- completed 2026-02-13
- [ ] 134-02-PLAN.md — Document intake: save + metadata creation (TDD)
- [ ] 134-03-PLAN.md — State machine: move documents between states + barrel index (TDD)

---

## Phase 135: Hygiene Pattern Engine

**Goal:** The system can scan content and detect security-relevant patterns across three categories: embedded instructions, hidden content, and configuration safety issues

**Dependencies:** Phase 134 (needs staging types and filesystem structure)

**Requirements:** HYGIENE-02, HYGIENE-03, HYGIENE-04, HYGIENE-09

**Success Criteria:**
1. System detects embedded instruction patterns (ignore previous instructions, role reassignment, chat template delimiters) in uploaded documents
2. System detects hidden content (zero-width characters, RTL overrides, base64 in unexpected positions) in uploaded documents
3. System identifies YAML configuration safety issues (code execution tags, recursive structures, path traversal, env var exposure) in uploaded documents
4. Pattern reference is stored as an updatable data structure organized by category, and new patterns can be added without code changes

**Plans:** 4 plans

Plans:
- [ ] 135-01-PLAN.md — Pattern registry types and built-in patterns (TDD)
- [ ] 135-02-PLAN.md — Embedded instruction + hidden content scanners (TDD)
- [ ] 135-03-PLAN.md — YAML config safety scanner (TDD)
- [ ] 135-04-PLAN.md — Unified scan engine + barrel index (TDD)

---

## Phase 136: Hygiene Trust and Reporting

**Goal:** Hygiene scan results are filtered by trust level, presented as actionable reports, and the user can approve, suppress, or clean up findings

**Dependencies:** Phase 135 (needs pattern detection engine)

**Requirements:** HYGIENE-01, HYGIENE-05, HYGIENE-06, HYGIENE-07, HYGIENE-08, HYGIENE-10, HYGIENE-11

**Success Criteria:**
1. System classifies content into familiarity tiers (Home/Neighborhood/Town/Stranger) and only surfaces findings for Town and Stranger tier content
2. System detects scope/privilege coherence issues (declared purpose vs requested tools/permissions) and includes them in the hygiene report
3. System generates a structured hygiene report with per-finding importance levels and actionable suggestions
4. User can act on each finding: approve, approve+suppress for future, clean up, skip, or observe with enhanced logging
5. Trust decay applies to approved patterns (session, 7-day, 30-day, 90-day auto-approve with instant reset on rejection), but critical patterns (YAML code execution, path traversal, prompt overrides) never auto-approve

**Plans:** 5 plans

Plans:
- [ ] 136-01-PLAN.md — Trust tier types and familiarity classifier (TDD)
- [ ] 136-02-PLAN.md — Scope/privilege coherence checker (TDD)
- [ ] 136-03-PLAN.md — Trust-filtered report generator (TDD)
- [ ] 136-04-PLAN.md — Finding actions and trust decay store (TDD)
- [ ] 136-05-PLAN.md — Barrel index update and integration tests (TDD)

---

## Phase 137: Smart Intake Flow

**Goal:** Uploaded documents go through an intelligent assessment that identifies gaps, asks targeted questions, and only queues work when the user confirms readiness

**Dependencies:** Phase 136 (intake triggers hygiene checks), Phase 134 (filesystem states)

**Requirements:** INTAKE-03, INTAKE-04, INTAKE-06

**Success Criteria:**
1. System assesses document clarity and routes to one of three paths: clear (offers to queue), gaps (asks targeted clarifying questions), confused (asks for clarification before proceeding)
2. System asks "anything else?" before adding work to the execution queue, giving the user a chance to add context
3. System resumes from the last incomplete step after a session crash by reading the metadata state file

**Plans:** 4 plans

Plans:
- [ ] 137-01-PLAN.md -- Clarity routing types and assessor (TDD)
- [ ] 137-02-PLAN.md -- Step tracking types and step tracker (TDD)
- [ ] 137-03-PLAN.md -- Intake flow orchestrator (TDD)
- [ ] 137-04-PLAN.md -- Barrel index and integration tests (TDD)

---

## Phase 138: Resource Analysis

**Goal:** The system analyzes confirmed work to determine what skills, agents, and topology are needed, then generates a complete resource manifest for execution

**Dependencies:** Phase 137 (intake flow confirms work), existing skill/agent/team infrastructure (v1.0-v1.9)

**Requirements:** RESOURCE-01, RESOURCE-02, RESOURCE-03, RESOURCE-04, RESOURCE-05, RESOURCE-06, INTAKE-07

**Success Criteria:**
1. System analyzes a vision document and extracts domain requirements, complexity signals, ambiguity markers, and external dependencies
2. System cross-references extracted requirements against available skills and reports ready, flagged, missing, and recommended skills
3. System recommends an agent/team topology (single, pipeline, map-reduce, router, hybrid) with rationale based on the work shape
4. System generates a complete resource manifest with skills, topology, token budget breakdown, parallel decomposition, HITL predictions, and queue context
5. When user confirms intake, the resource manifest is generated and work is added to the staging queue

**Plans:** 6 plans

Plans:
- [ ] 138-01-PLAN.md -- Resource types and vision document analyzer (TDD)
- [ ] 138-02-PLAN.md -- Skill cross-reference matcher (TDD)
- [ ] 138-03-PLAN.md -- Topology recommender (TDD)
- [ ] 138-04-PLAN.md -- Token budget estimator and work decomposer (TDD)
- [ ] 138-05-PLAN.md -- Resource manifest generator and barrel index (TDD)
- [ ] 138-06-PLAN.md -- Intake bridge and staging barrel update (TDD)

---

## Phase 139: Derived Knowledge Checking

**Goal:** Generated artifacts are checked for provenance integrity, pattern fidelity, scope drift, and copying signals before they enter the execution pipeline

**Dependencies:** Phase 135 (hygiene familiarity tiers used for provenance), existing skill-creator observation infrastructure (v1.0-v1.5)

**Requirements:** DERIVED-01, DERIVED-02, DERIVED-03, DERIVED-04, DERIVED-05

**Success Criteria:**
1. System tracks a provenance chain for derived artifacts and assigns inherited familiarity tier from the most distant source in the chain
2. System flags phantom content in derived skills (content that does not reflect actually observed patterns)
3. System detects scope drift where a skill has been generalized beyond what observations support
4. System checks training pair coherence for adapters using statistical anomaly detection, and flags high textual similarity to external sources as copying signals

**Plans:** 5 plans

Plans:
- [ ] 139-01-PLAN.md — Types and provenance chain tracker (TDD)
- [ ] 139-02-PLAN.md — Pattern fidelity checker / phantom content detection (TDD)
- [ ] 139-03-PLAN.md — Scope drift detector (TDD)
- [ ] 139-04-PLAN.md — Training pair coherence + copying signal detector (TDD)
- [ ] 139-05-PLAN.md — Unified derived checker and barrel index (TDD)

---

## Phase 140: Staging Queue Core

**Goal:** Work items flow through a managed queue with full audit trail, and the system identifies optimization opportunities across queued items

**Dependencies:** Phase 134 (filesystem states), Phase 138 (resource manifests populate queue entries)

**Requirements:** QUEUE-01, QUEUE-02, QUEUE-03, QUEUE-04, QUEUE-05, QUEUE-06

**Success Criteria:**
1. Queue manages items through states: uploaded, checking, needs-attention, ready, queued, executing, plus set-aside, with transitions validated
2. All staging decisions are recorded in an append-only queue.jsonl audit log with timestamps, actor, and rationale
3. System detects cross-queue dependencies between milestones and identifies batching opportunities for related work in the same domain
4. System identifies parallel execution lanes for independent milestones and detects shared setup opportunities (same skills needed, same research to perform)

**Plans:** 4 plans

Plans:
- [ ] 140-01-PLAN.md -- Queue types, state machine, and audit logger (TDD)
- [ ] 140-02-PLAN.md -- Cross-queue dependency detector (TDD)
- [ ] 140-03-PLAN.md -- Optimization analyzer: batching, parallel lanes, shared setup (TDD)
- [ ] 140-04-PLAN.md -- Queue manager facade and barrel index (TDD)

---

## Phase 141: Queue Pipelining and Dashboard

**Goal:** Queued items are pre-wired with execution resources, retroactive audits are triggered on pattern updates, and the staging queue is visible in the dashboard

**Dependencies:** Phase 140 (queue core), Phase 138 (resource manifests for pre-wiring), Phase 136 (pattern reference for retroactive audit)

**Requirements:** QUEUE-07, QUEUE-08, QUEUE-09

**Success Criteria:**
1. System pre-wires skills, agents, and teams into planning docs for queued items based on the resource manifest
2. Dashboard displays a staging queue panel with incoming/attention/ready/aside cards and dependency lines between items
3. When the pattern reference is updated, system recommends retroactive hygiene audit for previously approved items that may be affected

**Plans:** 4 plans

Plans:
- [ ] 141-01-PLAN.md -- Pre-wiring engine: resource manifest to planning doc conversion (TDD)
- [ ] 141-02-PLAN.md -- Retroactive audit recommender: pattern update to audit recommendations (TDD)
- [ ] 141-03-PLAN.md -- Staging queue dashboard panel: cards, columns, dependency lines (TDD)
- [ ] 141-04-PLAN.md -- Barrel index updates and integration tests

---

## Progress

| Phase | Name | Requirements | Status |
|-------|------|--------------|--------|
| 134 | Staging Foundation | INTAKE-01, INTAKE-02, INTAKE-05 | Complete ✓ |
| 135 | Hygiene Pattern Engine | HYGIENE-02, HYGIENE-03, HYGIENE-04, HYGIENE-09 | Complete ✓ |
| 136 | Hygiene Trust and Reporting | HYGIENE-01, HYGIENE-05, HYGIENE-06, HYGIENE-07, HYGIENE-08, HYGIENE-10, HYGIENE-11 | Complete ✓ |
| 137 | Smart Intake Flow | INTAKE-03, INTAKE-04, INTAKE-06 | Complete ✓ |
| 138 | Resource Analysis | RESOURCE-01, RESOURCE-02, RESOURCE-03, RESOURCE-04, RESOURCE-05, RESOURCE-06, INTAKE-07 | Complete ✓ |
| 139 | Derived Knowledge Checking | DERIVED-01, DERIVED-02, DERIVED-03, DERIVED-04, DERIVED-05 | Complete ✓ |
| 140 | Staging Queue Core | QUEUE-01, QUEUE-02, QUEUE-03, QUEUE-04, QUEUE-05, QUEUE-06 | Complete ✓ |
| 141 | Queue Pipelining and Dashboard | QUEUE-07, QUEUE-08, QUEUE-09 | Pending |

**Coverage:** 38/38 requirements mapped

---
*Roadmap created: 2026-02-13*
*Last updated: 2026-02-13 (phases 136, 139 planned)*
