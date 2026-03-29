# Retrospective -- Fleet Feature Refinement

> The constraint that teaches itself. The road built here will be worn smooth by every agent that walks it after.

## Mission Overview

| Field | Value |
|-------|-------|
| Mission ID | FLT |
| Start date | 2026-03-29 |
| Completion date | 2026-03-29 |
| Waves executed | 7 |
| CAPCOM gates | 3 |
| Teams | 4 (Alpha, Bravo, Charlie, Delta) |
| Total modules | 10 |
| Tests declared | 72 |
| Tests passing | 68 |
| Tests deferred | 4 (EC-07, EC-08, EC-11, EC-12) |
| Safety-critical | 8/8 PASS |
| Lines delivered | ~18,000 |
| Cluster | AI & Computation |

## What Worked

### Four Parallel Teams Reduced Integration Surface

The four-team topology (Alpha foundation, Bravo bus+routing, Charlie intake+audit, Delta intelligence) was the correct structural choice. By assigning teams to dependency tiers rather than individual modules, each team's internal dependencies were resolved locally before cross-team integration was required.

Alpha finished M8/M3/M6 as a coherent unit. When Bravo picked up M4 (DACP Event Bus), the event type declarations and chipset YAML schema were already stable. Bravo did not have to wait for Alpha to finish individual modules -- they waited for the tier to be complete. The CAPCOM gate enforced this cleanly.

**Lesson:** Assign teams to dependency tiers, not modules. Teams own a tier; CAPCOM gates verify tier completeness before the next tier begins.

### Opus Synthesis at CAPCOM Gates Found What Module Tests Missed

Gate 1 review (Agnus, Opus) caught a field naming inconsistency between M3 and M6 before Wave 3 began. M3 used `clearance_level` as an integer field. M6 expected `clearance` in its YAML schema. Neither module test caught it because neither test crossed the module boundary.

The inconsistency was caught in the Gate 1 synthesis step when Agnus mapped M3's type definitions to M6's YAML schema and found the mismatch. The fix was trivial (align field names) but the discovery timing was perfect: before any Wave 3 module had been written to depend on either M3 or M6.

**Lesson:** CAPCOM gates are not rubber stamps. They are the moment when independent module work gets compared against each other. Synthesis must actually read across module boundaries. Agnus doing this work in Wave 2 saved Wave 3 from a structural rework.

### Rollout Sequence Discipline Prevented Circular Test Failures

The initial rollout proposal had M4 (DACP Event Bus) scheduled before M3 (Credential Tiering). This was based on a misread of the dependency graph: M4 depends on M3 (events need credential authorization), not the other way around.

The correction was caught during Wave 0 scaffolding when the shared type definitions were written and the dependency edges became explicit. Reordering before any module was implemented had zero cost. Reordering after Wave 1 would have required rework.

**Lesson:** Write the shared type definitions and dependency graph in Wave 0, before any module implementation. The types are the architecture made explicit. Errors in the architecture are cheapest to fix when they are discovered in types, before they are embedded in implementations.

## What Failed

### Field Naming Inconsistency (Caught in Gate 1)

**What happened:** M3 used `clearance_level` as its tier field name. M6 YAML schema used `clearance` in its base chip definition. Both were written by separate Alpha Team tracks without a shared field naming convention.

**Impact:** Zero production impact -- caught at Gate 1 before any Wave 3 module used either field. Fix was two lines (align M6 YAML to use `clearance_level`).

**Root cause:** Wave 0 shared types did not include a field naming convention document. Each track named fields independently.

**Fix applied:** Added a `FIELD_NAMING.md` to Wave 0 scaffolding deliverables. Canonical names for common concepts (clearance levels, operation types, status enums) declared before any module implementation begins.

### Rollout Order Correction (Caught in Wave 0)

**What happened:** First-draft rollout sequence had M4 before M3. Dependency graph review during Wave 0 type definition work caught the error before any module was written.

**Impact:** Zero production impact -- caught before implementation. Correction was updating a planning document.

**Root cause:** Dependency edges were not fully traced from the module specifications before the rollout sequence was written. The sequence was drafted from memory of the dependency descriptions, not from a formal edge list.

**Fix applied:** Rollout sequence now generated from explicit dependency edge list, not from description summaries. Edge list is part of Wave 0 deliverables.

### Four Edge Cases Deferred (EC-07, EC-08, EC-11, EC-12)

**What happened:** Four edge case tests could not be completed within the mission scope:
- EC-07: Deeply nested schema validation (performance not characterized for 10+ level nesting)
- EC-08: Empty audit query time range (minor, returns empty list -- the path works, the test coverage is thin)
- EC-11: Concurrent safety gate invocations (requires concurrent test harness not yet available in Vitest)
- EC-12: Mid-operation credential revocation (requires transaction semantics not yet specified in M3)

**Impact:** Minor. All safety-critical tests pass. None of the deferred cases affect correctness on the happy path. EC-11 and EC-12 represent future hardening work.

**Root cause:** Concurrent testing and transaction semantics are cross-cutting concerns that touch multiple modules. They were not in scope for the module-level work but emerged as integration test requirements.

**Fix applied:** All four deferred cases logged as carry-forward items for the post-v1.50 hardening wave. EC-11 and EC-12 assigned to a dedicated concurrency/transactions workstream.

## Lessons Learned

### Lesson 1 -- Tier-Based Team Assignment
**NASA SE Category:** Process
**Module:** Architecture (all)
**Pattern:** Team boundaries aligned with dependency tiers prevent integration surface explosion. Teams own a tier; CAPCOM gates verify tier completeness.
**Recommended adjustment:** All future multi-team missions should map teams to dependency tiers, not individual modules, unless module count per tier is fewer than two.

### Lesson 2 -- Gate Reviews Must Cross Module Boundaries
**NASA SE Category:** Process
**Module:** M3, M6 (field naming catch)
**Pattern:** CAPCOM gate synthesis must explicitly check shared field names and type compatibility across all modules in the completed tier. Module tests cannot substitute for this -- they do not cross boundaries.
**Recommended adjustment:** Add a "cross-module type compatibility matrix" to CAPCOM gate review deliverables. Agnus generates this matrix, not individual module teams.

### Lesson 3 -- Dependency Edges Before Rollout Sequence
**NASA SE Category:** Technical
**Module:** M3, M4 (rollout order correction)
**Pattern:** Rollout sequence must be derived from a formal edge list, not from verbal dependency descriptions. Verbal descriptions are lossy.
**Recommended adjustment:** Wave 0 deliverables must include an explicit dependency edge list in machine-readable format. Rollout sequence is generated from this list, not authored independently.

### Lesson 4 -- Wave 0 Field Naming Convention
**NASA SE Category:** Technical
**Module:** M3, M6 (field naming)
**Pattern:** Common concept field names (clearance, status, tier, scope) must be canonically declared in Wave 0 before any module implementation begins.
**Recommended adjustment:** Add `FIELD_NAMING.md` to standard Wave 0 scaffolding deliverables. One canonical name per concept. Deviations require explicit notation in the module spec.

### Lesson 5 -- Concurrency and Transaction Testing Require Dedicated Infrastructure
**NASA SE Category:** Technical
**Module:** M8 (EC-11), M3 (EC-12)
**Pattern:** Concurrent and transactional edge cases cannot be tested with standard unit test patterns. They require dedicated test harness infrastructure (concurrent test runner, transaction rollback simulator).
**Recommended adjustment:** The post-v1.50 hardening wave should establish concurrent test infrastructure before the EC-11 and EC-12 test cases are attempted.

## Mission Statistics

| Metric | Value |
|--------|-------|
| Total files created | 22+ |
| Lines of specification | ~18,000 |
| Lines of documentation | ~3,000 |
| Test pass rate | 68/72 (94.4%) |
| Safety-critical pass rate | 8/8 (100%) |
| Waves executed on schedule | 7/7 |
| CAPCOM gates passed | 3/3 |
| Deviations from plan | 2 (field naming catch, rollout order correction) |
| Deviations caught before implementation | 2/2 (100%) |
| Post-mission carry-forward items | 5 lessons, 4 deferred edge cases |

## Carry-Forward Package

The following items are carried forward to the next mission:

**Open lessons (5):**
1. Tier-based team assignment pattern (Process -- recommended for all future multi-team missions)
2. Gate reviews must cross module boundaries (Process -- add to CAPCOM gate checklist)
3. Dependency edges before rollout sequence (Technical -- add to Wave 0 deliverables)
4. Wave 0 field naming convention (Technical -- add `FIELD_NAMING.md` to standard scaffolding)
5. Concurrency/transaction test infrastructure (Technical -- prerequisite for EC-11, EC-12)

**Deferred edge cases (4):**
- EC-07, EC-08, EC-11, EC-12 -- see details above

**Architectural decisions preserved:**
- Rollout order: M8->M3->M6->M4->M1->M7->M2->M5->M9->M10 is correct and proven
- Team topology: Alpha/Bravo/Charlie/Delta maps to Foundation/Bus+Routing/Intake+Audit/Intelligence
- CAPCOM gate 3 (full-cycle integration) must run all 10 modules end-to-end, not just the intelligence tier

> **Related:** [01-vision-guide.md](01-vision-guide.md), [03-milestone-spec.md](03-milestone-spec.md), AAR (retrospective methodology), S36 (carry-forward pattern)
