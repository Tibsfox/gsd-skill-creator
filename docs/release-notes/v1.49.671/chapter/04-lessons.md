# v1.49.671 — Lessons

## Lessons applied (existing)

- **#10168** ~30-milestone cc-cycle observation continues. v671 is a SINGLE-cc-milestone response (not a 3-cluster like v664-v666); substrate-distinct scaling.
- **#10174** Mission package gitignored — applied at Phase 836.
- **#10196** Cluster-resume target as load-bearing decision — v671 is the cc-interruption-of-cluster-resume (substrate-form CLUSTER-RESUME-FORWARD-CADENCE-CC-INTERRUPTION obs#1 first-instance NEW LOCKED).
- **#10250** Partial-resolution discipline — applied to deferred Gate 2 + Gate 3 candidates (acknowledge + defer to future cc cluster).
- **#10356** Four-consecutive-same-calendar-day-degree-advance threshold — v671 is the FIRST OPERATIONAL INSTANCE of the threshold-hit response.
- **#10365** Zero-speculation discipline — engine state explicitly unchanged; no MUS/ELC/SPS/TRS speculation.
- **#10368** Vitest hookTimeout fix from v667 sustains; no new flakes at v671.
- **#10371** soak obs#1 → obs#1 applied at v671 — Same-calendar-day-threshold-hit-as-preemptive-cc-cluster-trigger; first operational instance.

## Lessons emitted at v671

### Lesson #10373 — STATE.md normalizer drift recurrence (CLOSED by v671 Gate 1)

- **Substrate observation:** gsd-sdk state.milestone-switch emits STATE.md frontmatter (`gsd_state_version: "1.0"` quoted) that the C6 normalizer reports as drifted (prefers unquoted/numeric). Recurred at v669 ship + v670 ship (2 occurrences in 24h on 2026-05-17). Each occurrence cost ~5min vitest re-run after manual normalizer --write.
- **Substrate-form CLOSED:** STATE-MD-NORMALIZER-DRIFT-AT-MILESTONE-SWITCH-CLOSED-BY-PRE-TAG-STEP-0-5. New step 0.5/14 in tools/pre-tag-gate.sh runs normalizer --write idempotently before step 1.
- **Soak observation #1.** No recurrence expected at v672+ since the gate auto-fixes. ESTABLISHED candidate at obs#3 (obs#1 first emit + 2 ships post-v671 with no recurrence).

### Lesson #10374 candidate — Single-cc-milestone response for narrow threshold-hit

- **Substrate observation:** v671 is a single-cc-milestone (not a 3-cluster) response to Lesson #10356 threshold-hit. Substrate-distinct from full-cluster cc operations:
  - v585: single-mission but broad 5-category cleanup
  - v664-v666: 3-milestone cluster (cc-1 scaffold + cc-2 content + cc-3 close)
  - v671: single-milestone narrow recurrence closure
- **Substrate-form proposed:** SINGLE-CC-MILESTONE-FOR-NARROW-THRESHOLD-RESPONSE. The cc cluster discipline scales with operational-debt breadth — narrow recurrence → single cc milestone; broader operational-debt → multi-milestone cluster; comprehensive operational sweep → broader cleanup.
- **Soak observation #1.** Applied at v671 first instance. ESTABLISHED candidate if pattern repeats at future narrow threshold-hits.

## Cumulative cohort observations at v671

- SAME-CALENDAR-DAY-THRESHOLD-HIT-RESPONSE obs#1 first-instance NEW LOCKED
- CLUSTER-RESUME-FORWARD-CADENCE-CC-INTERRUPTION obs#1 first-instance NEW LOCKED
- STATE-MD-NORMALIZER-DRIFT-RECURRENCE-CLOSURE obs#1 first-instance NEW LOCKED (Lesson #10373)
- GATE-NOT-VIGILANCE-DISCIPLINE-APPLIED obs#2 cumulative (after v664+v665+v666)
- DETERMINISTIC-GATE-AS-OPERATIONAL-RHYTHM-AT-CC-CLUSTER obs#2 cumulative (after v664+v665+v666 first instance)
- PRE-TAG-GATE-STEP-INJECTION cumulative observation (step 0.5 added at v671; multiple prior step additions across milestones)

## Substrate-form forward-shadows OPEN

- **NASA degree-advance resumes at v672** STS-61-C Columbia 7th flight Chang-Diaz candidate; first-Hispanic-American-astronaut substrate-anchor opens
- **CHALLENGER-FORWARD-SHADOW** 1m 25d residual continues (closes at v676 candidate STS-51-L)
- **Lesson #10373 soak obs#3** target at v672-v673 ships (no recurrence expected)
- **Lesson #10374 soak obs#N** if future narrow-scope threshold-hits occur
- **Gate 2 + Gate 3 candidates** deferred to future cc cluster (when 4+ operational-debt categories warrant broader cleanup)
- **CLUSTER-RESUME-FORWARD-CADENCE post-ESTABLISHED** continues as default operational rhythm; v671's CC-INTERRUPTION is recognized as discipline-driven pause
- **THRESHOLD-RESPONSE-COHORT** opens at v671 with obs#1 — substrate-anticipation toward future threshold-hit instances (next would be a 4-degree-advance same-day burst; not anticipated soon)
- **Sub-agent dispatch pattern** (Lessons #10369 + #10370) both at soak obs#2; ESTABLISHED candidate at obs#3 if used at v672+ NASA degree work
