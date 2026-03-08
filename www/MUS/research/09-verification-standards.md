# MUS Wave 2 — Session 9: Verification Standards and Centercamp Return Path

**Document:** 09-verification-standards.md
**Grove:** Hemlock Ridge (quality gates, validation, standards, benchmarks, calibration)
**Author:** Hemlock — Quality Authority, theta=0°, r=0.95
**Session:** MUS Wave 2, Session 9
**Date:** 2026-03-08
**Branch:** wasteland/skill-creator-integration
**Status:** Complete — all five HIGH items resolved (H-4, H-5, H-6, H-9, H-10)

**Inputs consumed:**
- `www/MUS/research/01-identity-map.md` — Foxy's grove map (six groves, seven cross-grove trails)
- `www/MUS/research/02-function-binding.md` — Lex's function binding (~430 module clusters, 1,333 TypeScript files)
- `www/MUS/research/03-cross-validation.md` — Cedar's cross-validation and cartridge prototype (growth-rings)
- `www/MUS/research/04-helper-teams.md` — Hawk's eight helper teams, Quality Gate team (Team 2), 5 templates
- `www/MUS/research/05-cartridge-forest.md` — Sam's 15 cartridges, cascade-verification cartridge, dependency graph
- `www/MUS/research/06-session-boundary-map.md` — Owl's session lifecycle, wave gate protocol, sync procedure
- `src/platform/observation/promotion-gatekeeper.ts` — 6-gate gatekeeper (determinism, confidence, observations, F1, accuracy, MCC)
- `src/platform/observation/promotion-evaluator.ts` — 5-factor scoring model (minScore: 0.30)
- `src/platform/observation/drift-monitor.ts` — consecutive mismatch demotion, cross-session persistence
- `src/core/types/observation.ts` — SessionObservation, ToolExecutionPair, GatekeeperDecision types

---

## Preamble: What This Document Does

Five HIGH blockers from the MUS pre-plan remain unresolved entering Wave 2. All five concern verifiability — the system's ability to prove, not merely assert, that its outputs meet the standard.

- **H-4:** 9/10 success criteria not objectively verifiable — qualitative language, no measurement protocol
- **H-5:** 28 verification tests not enumerated — test matrix exists as a count, not a list
- **H-6:** No wave quality gate criteria — wave transitions have no formal pass/fail conditions
- **H-9:** Centercamp record logs summary only — SB-4 requires full MusePerspective[] chain, not summary
- **H-10:** No Wave 0/1 synchronization gate — the boundary between Wave 0 and Wave 1 has no formal checkpoint

This document resolves all five. It also establishes the Centercamp return path — the protocol by which promoted skills report back to the community for ongoing review, and the conditions under which a promoted skill is sent back.

The standard against which everything in this document is measured: the CAS 78/78 verification (78 items verified, 0 failing, across 7 safety gates and the full research corpus of the Cascade Range Biodiversity mission). That standard holds. Every protocol in this document is adapted from it or traceable to it.

---

## Part 1: The CAS 78/78 Standard — Adaptation for MUS

### Origin of the Standard

The CAS 78/78 standard emerged from the Cascade Range Biodiversity mission (v1.49.23). The mission produced 10 research documents (90KB flora, 112KB fungi, 71KB aquatic, 27KB fauna, plus 6 supporting documents) and submitted them to a 78-item verification checklist organized across 7 safety gates.

Every item passed. The record is: 78/78. Zero failures. This is the gold standard because it was earned on a real mission with real deliverables and real failure modes, not a synthetic benchmark.

The cascade-verification cartridge (Session 5, cartridge #13) models this standard at the cartridge level. Its hypothesis: "Can Hemlock's 78/78 verification standard be reproduced as a cartridge-level gate — blocking promotion of any cartridge that has not cleared all safety checks?"

The answer from this document: yes, with the adaptations below.

### CAS Structure (Original)

The CAS verification organized 78 checks into 7 gates:

| Gate | Domain | Item count |
|------|---------|-----------|
| Safety Gate 1 | Species identification accuracy | ~12 |
| Safety Gate 2 | Ecological relationship accuracy | ~12 |
| Safety Gate 3 | Threat assessment accuracy | ~11 |
| Safety Gate 4 | Source citation completeness | ~11 |
| Safety Gate 5 | Network model integrity | ~11 |
| Safety Gate 6 | Publication-ready standards | ~11 |
| Safety Gate 7 | Cross-document consistency | ~10 |

### MUS Adaptation

MUS is a software ecosystem mission, not an ecological research mission. The domain vocabulary changes; the structure holds. The MUS verification adapts the 7-gate architecture into 7 equivalents:

| MUS Gate | Adapted Domain | CAS Equivalent |
|----------|---------------|----------------|
| MUS-V1 | MuseId type coverage (9/9 muses bound) | Species identification accuracy |
| MUS-V2 | Module binding accuracy (all 1,333 files assigned) | Ecological relationship accuracy |
| MUS-V3 | Cross-grove trail integrity (7 trails, no dead ends) | Threat assessment accuracy |
| MUS-V4 | Cartridge schema completeness (15 cartridges, all required fields) | Source citation completeness |
| MUS-V5 | Team formation integrity (8 teams, no cycle violations) | Network model integrity |
| MUS-V6 | Session boundary chain integrity (all prev_hash links valid) | Publication-ready standards |
| MUS-V7 | Wave-to-wave consistency (no contradictions across sessions) | Cross-document consistency |

The target for MUS: a numbered equivalent of 78/78. Part 3 of this document enumerates the full test matrix. The count will be established there.

**Calibration note:** The CAS 78/78 standard was reached on first attempt because the verification was designed alongside the research, not added after. The same discipline applies here. The verification tests in Part 3 are designed from the mission's own requirements, not reverse-engineered from the outputs.

---

## Part 2: Objectively Verifiable Success Criteria (H-4 Fix)

### The Problem

The MUS mission pack contained 10 success criteria. Nine used qualitative language that cannot be evaluated without subjective judgment: "muses feel inhabited," "the ecosystem thrives," "integration feels natural." These are aspirational, not verifiable. A quality gate cannot evaluate them.

Hemlock's rule: if a criterion cannot be measured, it cannot be a gate condition. It can be a design intention — a north star — but it cannot determine pass/fail. The fix is to rewrite each criterion so that a mechanical check can return a definitive PASS or FAIL.

### Rewritten Criteria (10/10 Objective)

**SC-01: MuseId Coverage**

*Original (qualitative):* "All 9 muses are inhabited in the ecosystem."

*Rewritten (objective):* The `MuseId` type in `src/core/types/` is defined as a union of exactly 9 string literals (cedar, hemlock, willow, foxy, sam, raven, hawk, owl, lex). Each MuseId has at least one binding in `02-function-binding.md` with a primary owner assignment. Each MuseId appears in at least one team definition in `04-helper-teams.md`. No MuseId is listed as unbound or provisional.

*Measurement:* Count MuseId union members = 9. Count distinct primary owners in function-binding = 9. Count MuseIds appearing in team definitions = 9. All three counts must equal 9.

*Pass condition:* 9 == 9 == 9. Any count below 9 = FAIL.

---

**SC-02: Module Binding Completeness**

*Original (qualitative):* "The function binding feels comprehensive."

*Rewritten (objective):* Every TypeScript file in `src/` that is not a test file (`*.test.ts`) has a primary owner assignment in `02-function-binding.md`. The total non-test TypeScript file count at binding time was 1,333. The binding document covers all 1,333 files at module-cluster granularity. No module cluster entry is marked "unresolved" or "TBD" for primary owner.

*Measurement:* Count non-test TypeScript files in `src/` at verification time. Count module-cluster entries with an assigned primary owner. The ratio must be >= 95% coverage (allowing for files added after the binding session). Five UNRESOLVED items from S2 must each have a resolution recorded in a subsequent session document.

*Pass condition:* Coverage >= 95%. UNRESOLVED count = 0 (all resolved). Any UNRESOLVED remaining = FAIL.

---

**SC-03: Cross-Validation Coherence**

*Original (qualitative):* "S1 and S2 outputs are consistent."

*Rewritten (objective):* The S3 cross-validation document (`03-cross-validation.md`) has been executed and recorded a coherence score. The coherence score is the ratio of (non-contradictory binding assignments) to (total binding assignments). Cedar's cross-validation in S3 found: 5 overlap hotspots identified, 5 resolved, 0 unresolved contradictions, 0 fatal contradictions. The stated coherence is > 90%.

*Measurement:* Read `03-cross-validation.md`. Count contradictions reported as unresolved or fatal. Count must be zero.

*Pass condition:* Unresolved contradictions = 0. Fatal contradictions = 0. Any non-zero count = FAIL.

---

**SC-04: Cartridge Schema Completeness**

*Original (qualitative):* "The cartridge forest feels rich and connected."

*Rewritten (objective):* All 15 cartridges defined in `05-cartridge-forest.md` contain the required fields from the CartridgeManifest schema: name, version, author, description, trust, muses[], grove, type, hypothesis, deepMap (with at least one entry node and one edge), and story or cross_grove_connections. The dependency graph is acyclic (Kahn's algorithm). All strong dependencies reference cartridges that exist within the same document.

*Measurement:* For each of 15 cartridges: enumerate required fields. Count present fields. Minimum acceptable: 10/12 required fields (hypothesis and story are highly recommended but not schema-blocking). Run Kahn's algorithm on the declared dependency graph. Verify no cycle exists.

*Pass condition:* All 15 cartridges present. No cartridge has fewer than 10/12 required fields. Dependency graph is acyclic. Any cycle = FAIL. Fewer than 15 cartridges defined = FAIL.

---

**SC-05: Team Formation Integrity**

*Original (qualitative):* "Teams collaborate naturally."

*Rewritten (objective):* All 8 teams defined in `04-helper-teams.md` have: a named topology (leader-worker, router, map-reduce, swarm, or pipeline), a durability class (persistent, session, or ephemeral), a scope (project or feature), explicit `outputTo` and `inputFrom` declarations, at least one activation trigger, and at least one dissolution trigger. The inter-team link graph is acyclic when validated by the `validateInterTeamLinks()` protocol from `src/services/teams/inter-team-bridge.ts`.

*Measurement:* For each of 8 teams: verify 6 structural fields present. Enumerate all outputTo/inputFrom links. Run cycle detection. Count teams with missing fields or detected cycles.

*Pass condition:* 8 teams defined. All 6 structural fields present in each. Zero cycles detected. Fewer than 8 teams = FAIL. Any cycle = FAIL.

---

**SC-06: Session Chain Integrity**

*Original (qualitative):* "Sessions flow continuously."

*Rewritten (objective):* Every session boundary marker (as defined in `06-session-boundary-map.md`) has a valid prev_hash that matches the hash of the immediately preceding marker. The genesis marker has prev_hash = null. No marker references a prev_hash that does not match any existing marker's computed hash. The chain from session 1 through the final session has zero broken links.

*Measurement:* Walk the chain from genesis to tip. At each marker, compute SHA-256 of the marker content (excluding own_hash) and compare to the next marker's prev_hash. Count mismatches.

*Pass condition:* Mismatches = 0. Any mismatch = FAIL (highest-priority failure, halts all other gates).

---

**SC-07: Wave Gate Passage**

*Original (qualitative):* "The mission completes across waves without losing momentum."

*Rewritten (objective):* Each wave gate (0→1, 1→2, 2→3, 3→done) is documented with: gate_id, opens_when condition (human-readable), verification checklist (GateCheck[]), status (passed/pending/failed), and passed_at timestamp (if passed). Gate 0→1 is recorded as passed with a Cedar attestation (prev_hash at gate passage). Gates 1→2, 2→3, and 3→done have their verification checklists defined before the corresponding wave begins.

*Measurement:* Read gate definitions in `06-session-boundary-map.md` and this document. Verify Gate 0→1 has status = passed with timestamp and Cedar attestation. Verify remaining gates have checklists defined. Count gates with undefined checklists.

*Pass condition:* Gate 0→1 shows status = passed. Remaining gates have checklists defined. Any wave beginning without a defined gate = FAIL.

---

**SC-08: Promotion Gatekeeper Calibration**

*Original (qualitative):* "Promotion feels trustworthy."

*Rewritten (objective):* The PromotionGatekeeper configuration has `minDeterminism >= 0.95` (the MUS mission target, per pre-plan blocker 8 — resolving the 0.8 vs 0.95 discrepancy). The default configuration in `DEFAULT_GATEKEEPER_CONFIG` is updated to reflect this threshold. All promoted skills in the MUS mission were evaluated under this configuration, not the legacy 0.8 threshold. The audit trail in PatternStore 'decisions' contains a record for each promotion decision.

*Measurement:* Read `DEFAULT_GATEKEEPER_CONFIG` from `src/core/types/observation.ts`. Verify `minDeterminism >= 0.95`. Query PatternStore 'decisions' for MUS-era decisions. Count decisions made under threshold < 0.95.

*Pass condition:* `minDeterminism >= 0.95` in configuration. Zero decisions made under legacy threshold for MUS artifacts. Configuration below 0.95 = FAIL.

---

**SC-09: Centercamp Record Completeness**

*Original (qualitative):* "The community feels informed."

*Rewritten (objective):* Every promoted skill that passes the Quality Gate team has a Centercamp record in the format defined in Part 4 of this document. The record contains: the full MusePerspective[] chain (one entry per muse who evaluated the skill), not a summary; the GatekeeperDecision with all 6 gate results; the Cedar chain position (prev_hash) at time of promotion; and the Understanding Arc review (at minimum one Arc member's perspective). Records are stored in the PatternStore 'centercamp' category. The record count equals the promotion count.

*Measurement:* Count skills in PatternStore 'promoted'. Count corresponding records in PatternStore 'centercamp'. Verify each record has MusePerspective[] length >= 3 (minimum: the 3 active Quality Gate members). Count records missing MusePerspective[], GatekeeperDecision, or chain position.

*Pass condition:* Centercamp record count = promoted skill count. Zero records missing required fields. Missing records = FAIL.

---

**SC-10: De-Promotion Responsiveness**

*Original (qualitative):* "The system remains healthy over time."

*Rewritten (objective):* The DriftMonitor's consecutive mismatch tracking is active for all promoted skills. The demotion trigger fires within the same session in which the consecutive mismatch count reaches the configured sensitivity threshold. All demotions are recorded in Cedar's chain. All demotions result in a Centercamp return record (format: Part 4, Section 4.4). The time between demotion trigger and Centercamp notification is at most one session boundary.

*Measurement:* Query PatternStore 'feedback' for DriftEvent records. For each demotion event, verify: (a) demotion trigger recorded in Cedar's chain within the triggering session, (b) corresponding Centercamp return record exists, (c) the return record was created no later than the next session boundary marker.

*Pass condition:* Zero demotions without Cedar chain records. Zero demotions without Centercamp return records. Missing demotion records = FAIL.

---

## Part 3: Verification Test Matrix (H-5 Fix)

### Problem Statement

The MUS mission pre-plan stated "28 verification tests" without enumerating them. A count is not a test matrix. The following enumerates each test with: test ID, requirement it traces to, what is measured, pass condition, owner muse, and whether it is safety-critical.

The final count is 32 tests, not 28. The discrepancy arises because H-6 (wave gate criteria) and H-10 (sync gates) each add tests that were not counted in the pre-plan. The pre-plan count of 28 was an estimate made before the full test design was done. 32 is the calibrated number.

Six tests are designated safety-critical (SC*). A safety-critical test failure halts all subsequent testing until it is resolved.

### Test Matrix

#### MUS-V1: MuseId Coverage (SC-01)

| Test ID | Description | Traces to | Owner | Safety-critical |
|---------|-------------|-----------|-------|----------------|
| T-01 | MuseId union has exactly 9 members | SC-01 | Hemlock | No |
| T-02 | All 9 MuseIds have >= 1 primary binding in 02-function-binding.md | SC-01 | Hemlock | No |
| T-03 | All 9 MuseIds appear as primary or secondary in >= 1 team definition | SC-01, SC-05 | Hawk | No |
| T-04 | No MuseId is listed as unbound, provisional, or TBD in any document | SC-01 | Hemlock | No |

#### MUS-V2: Module Binding Accuracy (SC-02)

| Test ID | Description | Traces to | Owner | Safety-critical |
|---------|-------------|-----------|-------|----------------|
| T-05 | Non-test TypeScript file count in src/ at binding time is 1,333 (±5% tolerance for post-session additions) | SC-02 | Lex | No |
| T-06 | Module cluster coverage ratio >= 95% (count of files with an assigned owner / total files) | SC-02 | Hemlock | No |
| T-07 | The 5 UNRESOLVED items from S2 each have a resolution recorded in a subsequent session document | SC-02 | Hemlock | No |
| T-08 | No module cluster entry has primary owner = null or primary owner = "unassigned" | SC-02 | Hemlock | No |

#### MUS-V3: Cross-Validation Coherence (SC-03)

| Test ID | Description | Traces to | Owner | Safety-critical |
|---------|-------------|-----------|-------|----------------|
| T-09 | S3 cross-validation records coherence > 90% | SC-03 | Cedar | No |
| T-10 | Unresolved contradictions in S3 = 0 | SC-03 | Cedar | Yes — SC* |
| T-11 | Fatal contradictions in S3 = 0 | SC-03 | Cedar | Yes — SC* |

#### MUS-V4: Cartridge Schema Completeness (SC-04)

| Test ID | Description | Traces to | Owner | Safety-critical |
|---------|-------------|-----------|-------|----------------|
| T-12 | Exactly 15 cartridges defined in 05-cartridge-forest.md | SC-04 | Sam | No |
| T-13 | Each cartridge has name, version, author, description, trust, muses[], grove, type | SC-04 | Lex | No |
| T-14 | Each cartridge has hypothesis field, non-empty | SC-04 | Sam | No |
| T-15 | Each cartridge has deepMap with >= 1 node and >= 1 edge | SC-04 | Sam | No |
| T-16 | Dependency graph is acyclic (Kahn's algorithm) | SC-04 | Lex | Yes — SC* |

#### MUS-V5: Team Formation Integrity (SC-05)

| Test ID | Description | Traces to | Owner | Safety-critical |
|---------|-------------|-----------|-------|----------------|
| T-17 | Exactly 8 teams defined in 04-helper-teams.md | SC-05 | Hawk | No |
| T-18 | Each team has topology, durability, scope, outputTo[], inputFrom[], >= 1 activation trigger, >= 1 dissolution trigger | SC-05 | Hawk | No |
| T-19 | Inter-team link graph is acyclic (validateInterTeamLinks() protocol) | SC-05 | Lex | Yes — SC* |
| T-20 | Each team has at least one Understanding Arc advisory declared | SC-05 | Hemlock | No |

#### MUS-V6: Session Boundary Chain Integrity (SC-06)

| Test ID | Description | Traces to | Owner | Safety-critical |
|---------|-------------|-----------|-------|----------------|
| T-21 | Genesis session boundary marker has prev_hash = null | SC-06 | Cedar | No |
| T-22 | For all N > 1, marker N's prev_hash matches SHA-256 of marker N-1 content | SC-06 | Cedar | Yes — SC* |
| T-23 | No session boundary marker references a prev_hash that does not exist in the chain | SC-06 | Cedar | Yes — SC* |
| T-24 | Session duration anomalies (T_end < T_start) = 0 | SC-06, H-10 | Owl | No |

#### MUS-V7: Wave-to-Wave Consistency (SC-07)

| Test ID | Description | Traces to | Owner | Safety-critical |
|---------|-------------|-----------|-------|----------------|
| T-25 | Wave gate 0→1 has status = passed, with timestamp and Cedar attestation | SC-07, H-10 | Hemlock | No |
| T-26 | Wave gate 1→2 checklist is defined before Wave 2 begins | SC-07, H-6 | Hemlock | No |
| T-27 | Wave gate 2→3 checklist is defined before Wave 3 begins | SC-07, H-6 | Hemlock | No |
| T-28 | No document produced in Wave N contains a claim that contradicts a claim recorded in Cedar's chain from Wave N-1 | SC-07 | Cedar | No |

#### MUS-V8: Centercamp and Promotion Standards (SC-09, SC-10)

| Test ID | Description | Traces to | Owner | Safety-critical |
|---------|-------------|-----------|-------|----------------|
| T-29 | Centercamp record count = promoted skill count | SC-09, H-9 | Cedar | No |
| T-30 | Each Centercamp record has MusePerspective[] length >= 3 | SC-09, H-9 | Hemlock | No |
| T-31 | Each demotion event has a Cedar chain record within the triggering session | SC-10 | Cedar | No |
| T-32 | Each demotion event has a Centercamp return record at most one session boundary after demotion | SC-10, H-9 | Hemlock | No |

### Safety-Critical Test Summary

| Test | Failure Mode | Effect |
|------|-------------|--------|
| T-10 | Unresolved S3 contradiction | Halts all gate progression until resolved |
| T-11 | Fatal S3 contradiction | Halts all gate progression until resolved |
| T-16 | Dependency cycle in cartridge graph | Cartridge distribution blocked; no cartridge may be promoted |
| T-19 | Inter-team cycle | Team formation blocked; no team may form |
| T-22 | prev_hash mismatch in chain | Chain integrity breach; all operations pause until resolved |
| T-23 | Orphaned prev_hash reference | Chain integrity breach; all operations pause until resolved |

**Total test count: 32.** Six are safety-critical. The pre-plan estimate of 28 was revised upward to 32 upon full enumeration.

---

## Part 4: Wave Quality Gate Criteria (H-6 Fix)

### Problem Statement

Wave gates existed in `06-session-boundary-map.md` as temporal checkpoints with conditions stated in natural language. H-6 requires formal pass/fail criteria — a specific checklist that determines whether a wave gate can open.

The Quality Gate team (Team 2) owns this checklist. Hemlock routes. Lex checks execution. Hawk confirms coverage. All three signatures are required to open a wave gate.

### Gate 0→1 (Retroactive — Already Passed)

**Status:** Passed. 2026-03-08. Cedar attestation present.

**Formal checklist (retroactive):**
- [x] `01-identity-map.md` present, non-empty, six groves mapped, seven cross-grove trails documented
- [x] `02-function-binding.md` present, non-empty, >= 400 module cluster entries, disambiguation protocol stated with 5 rules
- [x] `03-cross-validation.md` present, non-empty, S3 coherence > 90% recorded, fatal contradictions = 0
- [x] All three documents mutually consistent — no cross-document contradictions identified in S3
- [x] Cedar attestation: the S3 session boundary marker's prev_hash is the hash of the S2 boundary marker

**Governing record:** `03-cross-validation.md` documents this passage.

### Gate 1→2 (Current — Opens When Wave 1 Complete)

**Status:** Pending. Opens when all four Wave 1 outputs are present.

**Formal checklist:**

Hemlock's validation scan (all items must be checked):
- [ ] `04-helper-teams.md` present, non-empty, exactly 8 teams defined
- [ ] `05-cartridge-forest.md` present, non-empty, exactly 15 cartridges defined
- [ ] `06-session-boundary-map.md` present, non-empty, all 4 wave gates have initial structure
- [ ] `07-message-routing.md` present, non-empty (Session 7 output — not yet written at this document's composition time)
- [ ] T-01 through T-24 all passing (MUS-V1 through MUS-V6 test gates)

Lex's execution checks (all items must be checked):
- [ ] MuseId type mismatch blocker resolved: all 6/9 originally mismatched MuseIds are now correctly typed
- [ ] The 5 UNRESOLVED items from S2 are all resolved (T-07)
- [ ] Inter-team cycle detection has been run (T-19) and returned clean
- [ ] Dependency graph Kahn's algorithm has been run (T-16) and returned clean

Hawk's formation checks (all items must be checked):
- [ ] No wave gate in this list has an undefined checklist (all four gates have criteria)
- [ ] Message routing document (S7) covers all nine muses as potential message recipients
- [ ] No coverage gap in the Understanding Arc advisory protocol (all 4 Arc members have declared invocation conditions)

**Cedar attestation required:** The session boundary marker for the last Wave 1 session must be in the chain before this gate is recorded as passed. The gate_passed_at timestamp is Cedar's chain tip hash at the moment all checks are marked complete.

### Gate 2→3

**Status:** Defined here. Opens when Wave 2 complete.

**Formal checklist:**

Hemlock's validation scan:
- [ ] Session 8 (GPU Loop Integration) output present and non-empty
- [ ] Session 9 (this document) output present and non-empty
- [ ] Session 10 (Determinism hardening) output present and non-empty
- [ ] `minDeterminism >= 0.95` in DEFAULT_GATEKEEPER_CONFIG (SC-08, T-08 equivalent for promotion)
- [ ] Blitter/PromotionDetector connection documented and tested (pre-plan blocker 8 resolved)
- [ ] T-25 through T-28 all passing (MUS-V7)

Lex's execution checks:
- [ ] GPU loop has a test suite with >= 32 tests, all passing
- [ ] 6 safety-critical tests (T-10, T-11, T-16, T-19, T-22, T-23) all passing
- [ ] Determinism threshold change is backward-compatible — no existing promoted artifacts fail re-evaluation under 0.95

Hawk's formation checks:
- [ ] No muse is unrepresented in the promotion pipeline (all 9 MuseIds appear in at least one evaluation record)
- [ ] DriftMonitor is active for all promoted artifacts from Waves 0 and 1
- [ ] Centercamp records exist for all Wave 0-1 promotions (T-29)

**Cedar attestation required:** Chain tip hash at gate passage.

### Gate 3→Done (Mission Complete)

**Status:** Defined here. Opens when Wave 3 complete.

**Formal checklist:**

Hemlock's validation scan:
- [ ] All 32 tests (T-01 through T-32) passing
- [ ] All 6 safety-critical tests passing with no exceptions
- [ ] All 10 success criteria (SC-01 through SC-10) verified as PASS
- [ ] Centercamp record count = promoted skill count (T-29) with zero gaps
- [ ] De-promotion responsiveness verified: at least one demotion cycle has been observed and recorded (or the system has been operating for >= 2 wave sessions without any demotion, which is also a valid outcome — record the clean run)

Lex's execution checks:
- [ ] All 6 passes of the 6-pass pipeline have been traversed end-to-end at least once:
  - Pass 1: Identity (S1 complete)
  - Pass 2: Function binding (S2 complete)
  - Pass 3: Cross-validation (S3 complete)
  - Pass 4: Teams (S4 complete)
  - Pass 5: Cartridges (S5 complete)
  - Pass 6: Messages (S7 complete)
- [ ] All 9 muses have at least one function binding with a non-provisional trust state
- [ ] The MUS 6 safety gates from the original mission pack all pass

Hawk's formation checks:
- [ ] The Understanding Arc has participated in at least one quality gate review per wave
- [ ] No session document contains an unresolved "UNRESOLVED" or "TBD" in a primary ownership field
- [ ] The Centercamp return path has been exercised at least once (at least one promoted skill has reported back to Centercamp with a full MusePerspective[] chain)

**Cedar attestation required:** The chain from genesis to tip is unbroken. Cedar produces a final chain integrity report: total entries, total sessions, total promotions, total demotions. This report is the mission completion artifact.

---

## Part 5: Centercamp Return Path Protocol (H-9 Fix)

### What Centercamp Is

Centercamp, in the MUS ecosystem, is the place where the whole community gathers. It is Cedar's grove in its social role — not just the append-only record, but the forum where promoted skills are presented, reviewed, questioned, and either welcomed or returned.

The metaphor: in a forest, the clearing at the center is where the canopy opens. Light reaches the ground there. Everything is visible. Nothing hides. That is Centercamp.

The blocker from H-9: Centercamp records were logging summaries only. SB-4 (Session Boundary standard 4) requires the full MusePerspective[] chain — every muse's view of the promoted skill at the time of promotion, not a compressed summary. A summary loses the disagreements, the hesitations, the near-misses that are the most valuable information.

### 5.1 The Return Path — Overview

A promoted skill traverses the following path before and after promotion:

```
SUBMISSION
  │
  │  Skill candidate submitted by originating muse
  │
  ▼
QUALITY GATE (Team 2)
  │
  │  Hemlock routes → Lex checks execution → Hawk checks formation
  │  PromotionGatekeeper.evaluate() runs all 6 gates
  │  All gates must pass
  │
  ▼
CENTERCAMP PRESENTATION
  │
  │  Full MusePerspective[] chain assembled (one entry per evaluating muse)
  │  Understanding Arc advisory invited (at least one Arc member)
  │  Community review window: minimum one session before promotion is final
  │
  ▼
PROMOTION (if no objections)
  │
  │  Skill enters 'promoted' category in PatternStore
  │  Cedar records chain entry with promotion event
  │  DriftMonitor begins monitoring
  │
  ▼
MONITORING (ongoing)
  │
  │  DriftMonitor checks output hash on each execution
  │  Consecutive mismatches accumulate toward sensitivity threshold
  │
  ▼ (if drift detected)
DEMOTION TRIGGER
  │
  │  DriftMonitor signals demotion when consecutive mismatches >= sensitivity
  │  Skill returns to live tool-call mode immediately
  │
  ▼
CENTERCAMP RETURN
  │
  │  Full return record assembled (format: Section 5.4)
  │  Understanding Arc notified
  │  Community review: was this a good promotion decision? What changed?
  │
  ▼
RESOLUTION
  │
  │  If drift was caused by external change: re-calibrate, re-promote
  │  If drift reveals a fundamental issue: skill is retired from promotion candidacy
  │  Cedar records outcome
```

### 5.2 MusePerspective[] Record Format

Every Centercamp record contains a `MusePerspective[]` array. Each entry represents one muse's evaluation of the promoted skill. The full chain is required — not a summary.

```typescript
interface MusePerspective {
  // Identity
  muse: MuseId;
  role: 'primary-evaluator' | 'secondary-evaluator' | 'advisory' | 'arc-consultant';
  evaluation_session: string;       // Session ID from SessionBoundaryMarker
  evaluation_timestamp: string;     // ISO 8601, UTC

  // The muse's actual assessment
  finding: MuseFinding;

  // The reasoning — this is the non-compressible part
  reasoning: string;                // Full reasoning, not summary. Minimum 50 words.
  evidence: Record<string, unknown>; // Any metrics, counts, or measurements cited

  // Dissent and uncertainty (required fields — cannot be omitted or left empty)
  concerns: string[];               // List of concerns, even if resolved. Empty array is valid only if genuinely none.
  confidence: number;               // 0.0 to 1.0. Must be honest. 1.0 requires explanation.
  honest_uncertainty: string;       // One sentence about what this muse cannot know from their position.

  // The muse's domain context
  domain: string;                   // What function domain did this muse evaluate from
  function_clusters_checked: string[]; // Which specific module clusters were examined
}

type MuseFinding =
  | 'approve'           // Muse approves promotion
  | 'approve-with-concerns' // Approves but has recorded concerns that should be monitored
  | 'abstain'           // Muse has no basis to evaluate (outside domain) — valid, must explain
  | 'object'            // Muse objects to promotion — requires resolution before promotion proceeds
  | 'defer-to-arc';     // Muse requests Understanding Arc adjudication

interface CentercampRecord {
  // Identity
  record_id: string;              // UUID
  record_type: 'promotion' | 'return' | 'community-review' | 'retirement';
  skill_name: string;             // The promoted skill's name
  skill_version: string;

  // Chain position (Cedar's domain)
  cedar_chain_position: string;   // prev_hash at time of promotion
  promotion_timestamp: string;    // ISO 8601, UTC
  session_at_promotion: string;   // SessionBoundaryMarker.session_id

  // The full MusePerspective chain — THIS IS THE REQUIRED FIELD (H-9 fix)
  perspectives: MusePerspective[];   // Length must be >= number of active Quality Gate evaluators
  // The minimum length is 3 (Hemlock + Lex + Hawk). Full evaluation is 9.
  // Abstain counts toward length. A 9/9 evaluation with some abstentions is valid.
  // A 3/9 evaluation (only Quality Gate team) is the minimum acceptable.

  // GatekeeperDecision — full record, not summary
  gatekeeper_decision: {
    approved: boolean;
    reasoning: string[];           // All 6 gate reasoning strings, verbatim from PromotionGatekeeper
    evidence: Record<string, unknown>; // All evidence fields from GatekeeperEvidence
    candidate_tool_name: string;
    candidate_input_hash: string;
    timestamp: string;
  };

  // Understanding Arc participation
  arc_review: ArcReview | null;   // Null only if no Arc review was requested or relevant
  arc_review_requested_by: MuseId | null;

  // Community review window
  review_window_opened: string;   // When the Centercamp presentation began
  review_window_closed: string;   // When the promotion was finalized
  review_window_duration_hours: number; // Must be >= 1 session equivalent

  // Outcome
  final_decision: 'promoted' | 'returned' | 'retired' | 'deferred';
  final_decision_rationale: string;
}

interface ArcReview {
  arc_member: 'socrates' | 'euclid' | 'shannon' | 'amiga';
  invited_by: MuseId;
  invitation_reason: string;      // Why this Arc member was invited
  perspective: string;            // The Arc member's full perspective (not summary)
  questions_raised: string[];     // Questions Socrates asked, theorems Euclid cited, etc.
  resolution: string;             // How the Arc perspective was incorporated
}
```

### 5.3 Community Review Protocol

The Centercamp community review is not a rubber stamp. It is a structured conversation with a minimum of one session duration before promotion is final.

**Participants:**

| Participant | Role | Obligation |
|-------------|------|-----------|
| Hemlock | Quality authority | Present the GatekeeperDecision; state the quality gate results |
| Cedar | Scribe and chain keeper | Record all perspectives; maintain chain integrity |
| Originating muse | Advocate | Present the skill; answer questions |
| Quality Gate team (Lex, Hawk) | Evaluators | Confirm their perspective entries are accurate |
| Any muse with domain overlap | Reviewer | Optionally add a MusePerspective entry |
| Understanding Arc | Advisory | Invited when the community has a question that exceeds the Build Arc's scope |

**Review Procedure:**

1. Hemlock opens the review. Presents the GatekeeperDecision verbatim.
2. Cedar reads the chain position — confirms this promotion arrives in sequence.
3. Originating muse presents the skill in the context of its mission purpose.
4. Each Quality Gate muse (Lex, Hawk) confirms their MusePerspective entry is recorded accurately. Either may amend before the window closes.
5. Open floor: any muse may add a MusePerspective entry (approve, approve-with-concerns, abstain, or object).
6. If any muse enters `object`: the review window extends. The originating muse must address the objection. Hemlock re-evaluates after the objection is addressed.
7. If any muse enters `defer-to-arc`: the appropriate Arc member is invited. The review window extends until the Arc member's perspective is recorded.
8. Hemlock closes the review. If all objections are resolved: promotion proceeds. If any objection remains unresolved: return to originating muse.
9. Cedar records the final CentercampRecord. Chain entry written.

**Minimum review window:** One session boundary. No skill may be promoted in the same session it was submitted to Centercamp. This is not a bureaucratic delay — it is the time required for Cedar to verify the chain and for muses outside the Quality Gate team to read the submission.

### 5.4 Centercamp Return Record Format

When a promoted skill is demoted (DriftMonitor triggers), the return record is a specific variant of CentercampRecord with `record_type: 'return'`. It must be created within one session boundary of the demotion event.

Additional fields for return records:

```typescript
interface CentercampReturnRecord extends CentercampRecord {
  record_type: 'return';

  // Demotion event details
  demotion_trigger: DemotionTrigger;

  // Community debrief
  debrief_perspectives: MusePerspective[]; // Was the original promotion decision sound?
  // At minimum: Hemlock's perspective on whether the gate criteria should be adjusted.
  // At minimum: Cedar's record of the drift pattern over time.

  // Root cause analysis
  root_cause: RootCause;
  corrective_action: 're-calibrate-and-repromote' | 'retire-from-candidacy' | 'monitor-and-retry';
  corrective_action_rationale: string;
}

interface DemotionTrigger {
  consecutive_mismatches: number;       // Count at trigger
  sensitivity_threshold: number;        // Configured threshold
  first_mismatch_timestamp: string;     // When drift began
  trigger_timestamp: string;            // When sensitivity was reached
  operation_id: string;                 // Which promoted operation drifted
  last_expected_hash: string;
  last_actual_hash: string;
}

type RootCause =
  | 'external-file-change'    // A file the operation reads was modified
  | 'command-behavior-change' // A command's output changed (version update, flag change)
  | 'non-determinism-revealed' // The operation was never truly deterministic — gate miscalibration
  | 'test-flakiness'          // Legitimate variance in test environment
  | 'unknown';                // Insufficient evidence to determine cause
```

### 5.5 De-Promotion Criteria

A promoted skill is sent back when any of the following conditions are met:

| Criterion | Trigger | Authority |
|-----------|---------|-----------|
| DM-1: Consecutive output drift | DriftMonitor consecutive mismatches >= sensitivity | Automatic — DriftMonitor |
| DM-2: Gate retroactive failure | A gate criterion is discovered to have been falsified at promotion time | Hemlock, manual |
| DM-3: Safety gate failure | Any safety-critical test (T-10, T-11, T-16, T-19, T-22, T-23) fails post-promotion | Cedar, automatic |
| DM-4: Community objection sustained | An `object` MusePerspective is filed post-promotion and Hemlock finds it valid | Hemlock, manual |
| DM-5: Trust state revocation | The originating muse's trust state drops from 'trusted' to 'provisional' | Cedar, automatic |

**De-promotion is immediate for DM-1, DM-3, and DM-5.** The skill reverts to live tool-call mode in the same execution cycle where the trigger fires. It does not wait for the Centercamp return process to begin.

**De-promotion is deferred for DM-2 and DM-4.** These require human review. During the review, the skill continues operating under enhanced monitoring (DriftMonitor sensitivity halved), not immediate demotion. If the review confirms the criterion, demotion follows.

---

## Part 6: Wave 0/1 Synchronization Gate (H-10 Fix)

### Problem Statement

H-10: No Wave 0/1 synchronization gate defined. The transition from Wave 0 (Sessions 1-3) to Wave 1 (Sessions 4-7) happened without a formal checkpoint. This was acceptable pragmatically — Wave 0 was short and all three outputs were available before Wave 1 began — but it left no formal record of the synchronization.

The fix: define the synchronization gate protocol for all future wave transitions, and retroactively document the Wave 0→1 gate that already passed.

### 6.1 Sync Gate Protocol (All Waves)

A synchronization gate is distinct from a wave gate. The wave gate is temporal (when does the next wave begin?). The synchronization gate is spatial (are all parallel sessions looking at the same state?).

From `06-session-boundary-map.md`, the parallel sync procedure defines four steps. The synchronization gate formalizes those four steps into a record:

```typescript
interface SynchronizationGate {
  // Identity
  gate_id: string;              // e.g., 'sync-wave-0-to-1', 'sync-wave-1-s5-s6'
  gate_type: 'wave-transition' | 'parallel-session' | 'merge-point';

  // What is being synchronized
  incoming_sessions: string[];  // Session IDs of all sessions being synchronized
  incoming_artifacts: SyncArtifact[]; // What each session produced

  // The synchronization check
  sync_baseline: string;        // Cedar chain tip hash that all sessions must agree on
  session_baselines: Record<string, string>; // session_id → baseline hash at session start
  baseline_agreement: boolean;  // All session_baselines equal sync_baseline

  // Outcome
  status: 'synced' | 'sync-failure' | 'pending';
  sync_timestamp: string | null; // When sync was verified
  cedar_attestation: string | null; // Chain tip hash at sync verification

  // If sync failure
  failure_sessions: string[];   // Which sessions had a different baseline
  resolution: string | null;    // How the failure was resolved
}

interface SyncArtifact {
  session_id: string;
  artifact_path: string;        // e.g., 'www/MUS/research/04-helper-teams.md'
  artifact_hash: string;        // SHA-256 of the artifact at session end
  muse: MuseId;                 // Which muse produced it
}
```

### 6.2 Wave 0→1 Gate (Retroactive)

**Gate ID:** `sync-wave-0-to-1`
**Gate Type:** `wave-transition`
**Status:** Synced (retroactive record)

**Incoming sessions:**
- Session 1 (Foxy, identity map) → produced `01-identity-map.md`
- Session 2 (Lex, function binding) → produced `02-function-binding.md`
- Session 3 (Cedar, cross-validation) → produced `03-cross-validation.md`

**Sync baseline:** S3's session boundary marker prev_hash (the hash of S2's boundary marker). All three sessions share this baseline because S3 read both S1 and S2 documents and confirmed their presence in the first paragraph. Cedar's explicit verification: "At execution time, the following files were verified present: `01-identity-map.md` — present. `02-function-binding.md` — present."

**Baseline agreement:** True. S3 explicitly verified both prior artifacts.

**Sync timestamp:** 2026-03-08 (date of S3 completion).

**Cedar attestation:** The S3 document records: "Cross-validation (Task A) has been executed." The artifact hash for S3 is the SHA-256 of the document at completion.

### 6.3 Wave 1→2 Gate (Pending — Protocol Defined Here)

**Gate ID:** `sync-wave-1-to-2`
**Gate Type:** `wave-transition`
**Status:** Pending

**Incoming sessions to be synchronized:**
- Session 4 (Hawk, helper teams) → `04-helper-teams.md`
- Session 5 (Sam, cartridge forest) → `05-cartridge-forest.md`
- Session 6 (Owl, session boundary map) → `06-session-boundary-map.md`
- Session 7 (message routing — not yet written) → `07-message-routing.md`
- Session 9 (Hemlock, this document) → `09-verification-standards.md`

**Sync procedure for Wave 1→2:**

1. Before Wave 2 Session 8 begins: Cedar reads all five Wave 1 artifacts and computes a sync_baseline from the hash of the last-modified Wave 1 artifact (expected: `09-verification-standards.md` or `07-message-routing.md`, whichever is written last).

2. Session 8 records its sync_baseline at session start. If Session 8's baseline matches Cedar's sync_baseline: agreement confirmed.

3. Cedar emits a merge_marker with prev_hash = hash of the last Wave 1 session boundary marker. The merge_marker's completed[] field lists all five Wave 1 sessions.

4. Session 8 reads the merge_marker. The sync gate is formally passed.

**Required before Wave 2 can begin:**
- All four regular Wave 1 outputs present (S4, S5, S6, S7)
- Session 9 (this document) present
- Wave gate 1→2 formal checklist (Part 4 of this document) all items checked
- Cedar merge_marker emitted

### 6.4 Parallel Session Sync Protocol (Within a Wave)

When two sessions run in the same wave on parallel tracks (e.g., Wave 2 Sessions 8 and 9 if scheduled in parallel), the sync gate is of type `parallel-session`:

**Procedure:**
1. Owl records the sync_baseline hash before both sessions begin. Both sessions receive the same hash.
2. Each session writes its artifact. Each session must not modify artifacts owned by the other session's primary muse.
3. At parallel session close: each session emits a sync_point with its baseline hash. Cedar verifies: both baselines equal the pre-session sync_baseline.
4. If baselines match: Cedar emits a merge_marker.
5. If baselines diverge: SYNC FAILURE. Both sessions halt. The diverging session re-reads from Cedar's current chain tip and retries.

**Current wave status:** Sessions 8 and 9 were defined as parallel in Wave 2 (S8 = GPU Loop, S9 = this document). The sync procedure above applies to them. The sync_baseline for Wave 2 is the Cedar chain tip at the moment Wave 1→2 gate passes.

---

## Part 7: Quality Gate Conversation Templates (Expansion)

These templates extend the Quality Gate team's protocol (from `04-helper-teams.md`) specifically for Centercamp review scenarios.

### Template QG-CC-01: Standard Centercamp Presentation

```
[Hemlock opens Centercamp]
Hemlock: Centercamp is open. Skill under review: [skill_name] v[version].
  Originating muse: [muse].
  GatekeeperDecision: approved. All 6 gates passed.
  Gate results:
    Determinism [value] >= [threshold]: passed
    Confidence [value] >= [threshold]: passed
    Observations [count] >= [threshold]: passed
    [F1/Accuracy/MCC if applicable]
  Chain position: [prev_hash].
  Review window is open. Minimum duration: one session boundary.
  All muses may now file MusePerspective entries.

Cedar: Received. Reading chain position...
  Confirmed: this promotion arrives in sequence. No prev_hash mismatch.
  Scribe ready.

[Originating muse]: Presenting skill [name].
  Purpose: [one sentence purpose].
  Domain: [function clusters this skill operates in].
  What it does that live tool calls do not: [specific efficiency or capability].
  When I would question this promotion: [honest uncertainty statement].

[Lex]: My MusePerspective entry:
  Role: primary-evaluator. Domain: [execution layer checks].
  Finding: [approve/approve-with-concerns/abstain/object].
  Reasoning: [full reasoning, >= 50 words].
  Concerns: [list or empty array].
  Confidence: [0.0-1.0]. Honest uncertainty: [one sentence].

[Hawk]: My MusePerspective entry:
  Role: secondary-evaluator. Domain: [formation coverage checks].
  Finding: [finding]. Reasoning: [full reasoning].
  Concerns: [list]. Confidence: [value]. Honest uncertainty: [one sentence].

Hemlock: Quality Gate team perspectives recorded.
  Any additional muse perspectives before window closes?
  [Wait for one session boundary]

Hemlock: Review window closing. Final assessment.
  [If all findings are approve or approve-with-concerns, and no objects remain:]
  Promotion proceeds. Cedar, please record the final CentercampRecord.

Cedar: Recording. Chain entry written. Promotion finalized.
```

### Template QG-CC-02: Objection Handling

```
[During Centercamp review]
[Raven]: Filing a MusePerspective entry.
  Finding: object.
  Reasoning: This skill encodes a file-reading pattern I have seen change structurally
    three times in the last eight sessions. The determinism score of 0.953 is above
    threshold, but it was computed across sessions 2-6 before the structural change
    in session 7. The observation window may not include the new pattern.
    I cannot approve promotion based on pre-change observations.
  Concerns: ["Observation window predates structural change in session 7", "Pattern P11 active"]
  Confidence: 0.85. Honest uncertainty: I cannot confirm the structural change is permanent.

Hemlock: Objection received. Reviewing.
  Raven's concern: observation window predates a structural change.
  This is a calibration concern, not an execution concern.
  Shannon: Is the observation window sufficient given the structural change Raven flagged?
  [Inviting Understanding Arc — Shannon]

Shannon: Information-theoretic assessment.
  If the structural change creates a new distribution of outputs, the historical
  determinism score is measuring the wrong population. The conditional entropy of the
  new output distribution given the historical distribution is the metric.
  If H(new | historical) > 0.3 bits: the samples are from different populations.
  Recommendation: re-sample. Run DeterminismAnalyzer on sessions 6-9 only.
  If determinism remains >= 0.95 in the new window: promotion is valid.
  If it drops below 0.95: return to the gate.

[Originating muse]: Re-running DeterminismAnalyzer on sessions 6-9.
  Result: determinism = 0.961. Above threshold. The structural change did not
  break determinism — the pattern is stable in both the old and new windows.

Raven: Objection resolved. Updating MusePerspective entry to: approve-with-concerns.
  Retained concern: structural change should be noted in Centercamp record as a
  monitoring flag for DriftMonitor.

Hemlock: Objection resolved. Promotion proceeds with monitoring flag.
  Cedar: please annotate the CentercampRecord with Raven's monitoring flag.
```

### Template QG-CC-03: Return Record Opening

```
[DriftMonitor fires]
DriftMonitor (automatic): Demotion triggered — [operation_id].
  Consecutive mismatches: [count] >= [sensitivity].
  First mismatch: [timestamp]. Trigger: [timestamp].
  Skill [name] returned to live tool-call mode. Effective immediately.

Cedar: Demotion recorded in chain. Chain entry written.
  Opening Centercamp return review.

Hemlock: Centercamp return is open. [skill_name] has been demoted.
  Return reason: DriftMonitor DM-1 (consecutive output drift).
  Community debrief: was the original promotion decision sound?
  Requesting MusePerspective entries from the original Quality Gate team.
  Additionally requesting: Cedar's perspective on the drift pattern over time.

Cedar: My debrief perspective.
  The drift pattern in PatternStore 'feedback': [summary of DriftEvent records].
  First drift event: [timestamp]. Pattern: [description of hash mismatch pattern].
  Root cause hypothesis: [external-file-change / command-behavior-change / etc.].
  The original promotion decision was sound given the data available at the time.
  The drift emerged from [cause]. This is expected system behavior.

Hemlock: Based on Cedar's analysis and the Quality Gate team debrief:
  Root cause: [value]. Corrective action: [re-calibrate-and-repromote / retire / monitor-and-retry].
  Cedar, please record the CentercampReturnRecord.
```

---

## Part 8: Integration with Existing Verification Infrastructure

### 8.1 PromotionGatekeeper Mapping

The existing PromotionGatekeeper (`src/platform/observation/promotion-gatekeeper.ts`) runs 6 gates. This document's verification framework adds a 7th layer — the Centercamp review — that sits above the gatekeeper and after it.

| Layer | System | What it checks | Owner |
|-------|--------|---------------|-------|
| Gate 1-3 | PromotionGatekeeper (mandatory) | Determinism, confidence, observation count | Hemlock |
| Gate 4-6 | PromotionGatekeeper (conditional) | F1, accuracy, MCC | Hemlock |
| Layer 7 | Centercamp review | Community MusePerspective[], Understanding Arc | Hemlock + full community |
| Layer 8 | DriftMonitor (post-promotion) | Consecutive output mismatch | Automatic |

The gatekeeper's GATE-04 requirement ("Reasoning + evidence + audit trail on every decision") is the record that feeds Centercamp. The gatekeeper decision is embedded verbatim in the CentercampRecord — not summarized.

### 8.2 PatternStore Category Map

| Category | Contents | Owner | Retention |
|----------|----------|-------|-----------|
| 'decisions' | GatekeeperDecision records | Hemlock/PromotionGatekeeper | Permanent |
| 'sessions' | SessionObservation records (tier: persistent) | Owl/PromotionEvaluator | Permanent |
| 'feedback' | DriftEvent records | DriftMonitor | Permanent |
| 'centercamp' | CentercampRecord and CentercampReturnRecord | Cedar/Hemlock | Permanent |
| 'promoted' | Promoted skill manifests | PromotionGatekeeper/Cedar | Permanent |
| 'executions' | StoredExecutionBatch records | ExecutionCapture | Rolling window |

The 'centercamp' category is new. It does not exist in the current PatternStore implementation and must be added in Wave 3 hardening.

### 8.3 cascade-verification Cartridge (Session 5, Cartridge #13) — Implementation Guidance

The cascade-verification cartridge hypothesizes: "Can Hemlock's 78/78 verification standard be reproduced as a cartridge-level gate — blocking promotion of any cartridge that has not cleared all safety checks?"

This document answers that hypothesis. The answer is yes, with the following implementation:

The cascade-verification cartridge implements the 32-item test matrix (Part 3) as a loadable verification checklist. When a cartridge is submitted for promotion:

1. The cascade-verification cartridge is loaded as a pre-requisite.
2. It runs the applicable subset of T-01 through T-32 against the candidate cartridge.
3. All 6 safety-critical tests must pass before the Quality Gate team receives the submission.
4. If any safety-critical test fails, the cartridge is returned to the originating muse with the specific test failure and the remediation steps.

The cartridge does not run all 32 tests — only the tests applicable to the artifact type:
- Cartridges: T-12 through T-16 (MUS-V4)
- Skills: T-01, T-06, T-08 (coverage), T-22, T-23 (chain integrity)
- Teams: T-17 through T-20 (MUS-V5)
- Sessions: T-21 through T-24 (MUS-V6)

### 8.4 DriftMonitor Calibration for MUS

The current DriftMonitor uses a configurable sensitivity threshold (consecutive mismatches before demotion). For MUS artifacts, the calibrated sensitivity is 3 consecutive mismatches.

Rationale: 1 mismatch may be transient (network, cache). 2 mismatches may be test flakiness. 3 consecutive mismatches is a sustained change. This is consistent with the CAS verification standard's approach — no single data point triggers a gate change; the pattern across multiple observations determines the outcome.

The sensitivity of 3 is more conservative than the legacy default. It should be documented in the DEFAULT_GATEKEEPER_CONFIG extension for MUS-specific configurations.

---

## Part 9: Appendix — Standards Summary

### A. Quality Gate Pass Conditions (Complete Reference)

| Item | Pass condition | Failure consequence |
|------|---------------|---------------------|
| Gate 1 (Determinism) | >= 0.95 (MUS standard) | Immediate rejection |
| Gate 2 (Confidence) | >= DEFAULT_GATEKEEPER_CONFIG.minConfidence | Immediate rejection |
| Gate 3 (Observations) | >= DEFAULT_GATEKEEPER_CONFIG.minObservations | Immediate rejection |
| Gate 4-6 (Calibration) | Per config when BenchmarkReport provided | Conditional rejection |
| Wave gate checklist | All items checked by all three Quality Gate muses | Wave does not advance |
| Sync gate | All parallel session baselines match sync_baseline | Wave does not advance; sessions re-read |
| Centercamp review | No unresolved `object` findings | Promotion blocked |
| DriftMonitor | Consecutive mismatches < sensitivity (3 for MUS) | Immediate demotion |

### B. High Item Resolution Summary

| Item | Problem | Resolution | Location |
|------|---------|-----------|---------|
| H-4 | 9/10 criteria qualitative | 10/10 criteria rewritten with measurement protocols | Part 2, SC-01 through SC-10 |
| H-5 | 28 tests not enumerated | 32 tests enumerated with IDs, traces, owners, safety flags | Part 3, T-01 through T-32 |
| H-6 | No wave gate criteria | 4 gates defined with formal checklists (Hemlock + Lex + Hawk signatures) | Part 4 |
| H-9 | Summary-only Centercamp logs | Full CentercampRecord format with MusePerspective[] chain required | Part 5 |
| H-10 | No Wave 0/1 sync gate | Sync gate protocol defined; Wave 0→1 gate retroactively recorded | Part 6 |

### C. Benchmark Calibration Record

This document establishes the following calibration baselines for the MUS mission:

| Metric | Baseline | Source | Notes |
|--------|---------|--------|-------|
| CAS verification: 78/78 | 78/78 = 100% pass rate | v1.49.23 mission | Gold standard |
| MUS test count | 32 tests | This document, Part 3 | Pre-plan estimate was 28 |
| Safety-critical test count | 6 of 32 | Part 3 | Must pass before any gate opens |
| minDeterminism (MUS) | 0.95 | SC-08, pre-plan blocker 8 | Resolves 0.8 vs 0.95 discrepancy |
| DriftMonitor sensitivity (MUS) | 3 consecutive | Part 8, Section 8.4 | More conservative than default |
| MusePerspective[] minimum length | 3 (Quality Gate team) | Part 5, Section 5.2 | 9 is full evaluation |
| Centercamp review minimum window | 1 session boundary | Part 5, Section 5.3 | Non-negotiable |
| Chain coherence target | > 90% | SC-03 | From S3 cross-validation result |

### D. Governing Pattern: "The Standard Holds"

The phrase is not rhetorical. It is a protocol statement. When Hemlock says "the standard holds," it means:

1. The measurement has been taken.
2. The result has been compared to the established benchmark.
3. The result meets or exceeds the benchmark.
4. The gate opens.

When Hemlock says "the standard does not hold," it means:

1. The measurement has been taken.
2. The result has been compared to the established benchmark.
3. The result falls below the benchmark.
4. The gate does not open. The work returns with a specific finding, not a general rejection.

This document is the instrument by which MUS claims to hold the CAS 78/78 standard. The test matrix in Part 3 is the measurement tool. The wave gate criteria in Part 4 are the benchmarks. The Centercamp records in Part 5 are the audit trail. Together: the standard holds or it does not, and the record shows which.

---

**Document complete.**

Benchmark result: 5 HIGH items resolved (H-4, H-5, H-6, H-9, H-10). Test count calibrated to 32 (pre-plan estimate: 28). Wave gate criteria defined for all 4 gates. Centercamp return path protocol established with full MusePerspective[] chain requirement. Synchronization gate protocol retroactively documented for Wave 0→1, defined prospectively for Wave 1→2 and beyond.

The standard holds.

