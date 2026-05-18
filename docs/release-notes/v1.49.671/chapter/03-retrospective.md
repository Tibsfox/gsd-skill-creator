# v1.49.671 — Retrospective

## What went well

- **Lesson #10356 threshold-hit honored at first operational instance.** v670 close emitted the threshold-hit (4/4 same-calendar-day count); v671 is the first cc-cluster response. The discipline's calibration is validated — threshold-hit triggers cc cluster pause, calendar rolls over, NASA work resumes next day.

- **Single-cc-milestone scope sufficient.** Unlike v664-v666 3-cluster or v585 broader cleanup, v671 closes one specific recurrence (STATE.md normalizer drift) with a 20-line shell edit + 60-line meta-test. The cc cluster discipline scales — narrow recurrence → single cc milestone. Lesson #10374 candidate emitted.

- **Deterministic gate replaces vigilance.** STATE.md normalizer drift recurred 2x in 24h (v669 + v670 ship), each costing ~5min vitest re-run. v671 step 0.5 makes the recurrence impossible by design — normalizer auto-runs before vitest sees STATE.md. Gate-not-vigilance discipline at obs#2 cumulative (after v664-v666 first instance).

- **Meta-test self-documents the gate.** tests/integration/v1-49-671-meta-test.test.ts C1 verifies (a) step 0.5 exists in pre-tag-gate.sh, (b) runs normalizer --write, (c) runs before step 1, (d) cleans up backup file. Future readers can understand the gate's behavior from the test alone.

- **Lesson #10371 first operational instance.** v670 emitted #10371 (SAME-CALENDAR-DAY-THRESHOLD-HIT-AS-PREEMPTIVE-CC-CLUSTER-TRIGGER) as soak obs#1; v671 is the immediate operational application = soak obs#1 confirmed. ESTABLISHED candidate at obs#3.

## What was friction

- **gsd-sdk state.milestone-switch is in a separate npm package (get-shit-done-cc) outside this repo.** Could not modify the source of the drift; instead applied a downstream fix in pre-tag-gate.sh. This is acceptable per cc cluster discipline (the fix is where the operational impact is visible) but the upstream package would benefit from emitting normalizer-clean frontmatter at source. Cross-project work deferred.

- **Single-cc-milestone vs multi-milestone trade-off.** v664-v666 cc cluster was 3-milestone because 5 operational-debt categories needed deterministic gates. v671 is single-cc-milestone because only 1 recurrence is closed. The other 2 candidate gates (MUS/ELC card-template length; sub-agent dispatch observability) deferred to future cc cluster. Operational implication: if narrow-scope cc milestones become common, we may want a lighter-weight cc cluster pattern.

## What surprised

- **Lesson #10356 threshold calibration was validated in 24h.** The lesson was set up in earlier cc cluster work; it didn't have an operational instance until v670 close hit 4/4 on 2026-05-17. The lesson's discipline worked exactly as designed — threshold-hit → cc cluster mandated → NASA pauses → calendar rolls over → NASA resumes. Lesson is well-calibrated.

- **STATE.md normalizer drift is purely YAML-format-quote-style.** The actual drift is `gsd_state_version: "1.0"` (string-quoted) vs the normalizer's preferred `gsd_state_version: 1.0` (number or unquoted). Semantically equivalent; the normalizer's strictness is about deterministic representation. The fix is correct but does highlight a soft-spot in cross-tool YAML conventions.

- **Sub-agent dispatch pattern soak obs#2 + #3 both clean.** Lessons #10369 + #10370 were emitted at v669; obs#2 confirmed at v670. v671 doesn't use sub-agent dispatch (small inline cc work). Both lessons remain at obs#2 soak. ESTABLISHED candidate at obs#3 if sub-agent dispatch used again at v672+ NASA degree work.

## Process observations

- **Inline direct-author cadence for cc cluster work is fast.** v671 fully inline-authored in ~10 tool uses (mission brief + pre-tag-gate.sh edit + meta-test + release-notes + ship). Comparable to v667+v668 NASA inline cadence (~30-45min wall) but with smaller surface area.

- **Mission brief authored after gate implementation is fine for cc cluster.** Unlike NASA degree-advance where the brief precedes content authoring, cc cluster milestones can author the brief AFTER the gate implementation since the gate's substrate is short + already known. Substrate-distinct from NASA degree-advance pattern.

- **Template-from-immediate-predecessor authoring** does not apply for cc cluster — v670 STS-61-B and v671 cc-cluster have different artifact shapes. Substrate-distinct.

## Substrate-anticipation for forward milestones

- **NASA degree-advance resumes at v672.** STS-61-C Columbia 7th flight 1986-01-12 candidate (first-Hispanic-astronaut Franklin Chang-Diaz; deferred CHALLENGER-SHADOW). Same-calendar-day count starts fresh at 0/4 (calendar rolled over to 2026-05-18).

- **CHALLENGER-FORWARD-SHADOW** continues 1m 25d residual to STS-51-L 1986-01-28 (substrate-state OPEN-SHADOW continues; v671 does not affect it).

- **CLUSTER-RESUME-FORWARD-CADENCE post-ESTABLISHED** continues as default operational rhythm; v671's cc interruption is recognized as a discipline-driven pause (not substrate-form invalidation). CLUSTER-RESUME-FORWARD-CADENCE-CC-INTERRUPTION obs#1 first-instance NEW LOCKED at v671.

- **Lesson #10373 STATE.md normalizer drift recurrence closure** soak obs#1 at v671. ESTABLISHED candidate at obs#3 (i.e., obs#1 first emit + 2 ships post-v671 with no recurrence).

- **Lesson #10374 single-cc-milestone-for-narrow-threshold-response** soak obs#1 at v671. ESTABLISHED candidate if pattern repeats at future threshold-hits.

- **Operational rhythm at obs#1 for the threshold-response cohort:** v670 close at 4/4 → v671 single-cc-milestone next day → v672 NASA degree-advance resumes. Substrate-anchor for THRESHOLD-RESPONSE-COHORT.

- **Gate 2 (MUS/ELC card-template length proactive warning)** + **Gate 3 (sub-agent dispatch observability)** deferred to future cc cluster. If future cc cluster has broader scope (4+ operational-debt categories like v664-v666), can bundle these.
