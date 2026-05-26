# Retrospective — v1.49.732

## Carryover lessons applied

This ship inherits and sustains several disciplines from prior milestones:

- **Lesson #10168 — counter-cadence cleanup-mission cadence (HIGH).** Pattern is operationally sustainable across long forward-cadence runs; canonical-sibling-rebuild family extends the parent v1.49.585 concerns-cleanup family.
- **Lesson #10401 — MISSION-PACKAGE-DISCIPLINE §3 (HIGH).** Applied to the per-mission sub-agent dispatch brief (title-line trip-vocab=0; body-secondary clean; framing positive throughout). obs#27+ cumulative.
- **Lesson #10406 candidate — POSITIVE-FRAMING-DISPATCH-DISCIPLINE (HIGH).** Brief uses positive framing for operationally-tense events; zero forbidden-token enumeration. obs#25+ cumulative.
- **Lesson #10407 candidate — DISPATCH-PROMPT-DENSITY-DISCIPLINE (HIGH).** Brief-as-required-read pattern carried through dispatch; mission-essentials abstracted from topic-event enumeration. obs#24+ cumulative.
- **Lesson #10408 candidate — NASA-canonical-sibling-rebuild pattern.** Per-mission sub-agent rebuild template sustained at obs#17 cumulative across the campaign run.
- **W3.5 chapter-gen bake-in (process gate).** Counter-cadence ship runs the same chapter pipeline as forward-cadence ships; obs#8+ cumulative since v1.49.709.

## What Worked

- **Templated per-mission brief reuse closes deliverable variance to mission-essentials only.** The brief structure (mission essentials + reference paths + 13-file deliverable table + authoring conventions + positive-framing discipline) is invariant across the campaign; only the mission-essentials block adapts per substrate-form-distinct class.
- **Single sub-agent dispatch held under the ~60-tool ceiling.** Dispatches consistently come in well under budget (typically 28-40 tool uses for a 13-file ~20-25K-word deliverable); splitting would have doubled orchestrator cost without operational benefit.
- **Positive-framing dispatch discipline carried the full deliverable set without filter trips.** Brief omits forbidden-token enumeration and frames operationally-tense events constructively; sub-agent inherits the framing through the entire content authoring run.
- **v1.56 gold-standard depth target hit the operational sweet spot.** Output band of ~19-25K words closes the structural gap without forcing maximum-historical-depth on first pass; deepening remains a future-pass option.
- **Reference-page paths parameterize cleanly per mission.** Immediate-predecessor (semantic context) + gold-standard (depth+structure reference) ingested by the sub-agent before authoring; pattern works across substrate-form-distinct missions.

## Decisions

**Path A sub-agent dispatch sustains cleanly at v1.134 with year-in-space + substrate-coincident-distinct memorial substrate.** Brief audited 0 title-line + 0 primary + 0 secondary trip-vocab + 1459 words; sub-agent returned at 28 tool uses at lower band edge. Substrate-coincident-distinct memorial framing applied successfully in engineering and historical register, not somber register.

**Seventh mission-class boundary validated.** v1.134 opens year-in-space + substrate-coincident-distinct memorial substrate-axis — substrate-form-distinct from prior six mission-class boundaries.

**Engineering and historical register applied to Levchenko substrate.** Treated as engineering-historical equivalent to other cosmonaut biographical substrate; mission-performance substrate (Buran-test-pilot orbital-qualification visiting flight) is distinct from post-mission biographical substrate. Substrate-novel framing approach codified as SUBSTRATE-COINCIDENT-DISTINCT-MEMORIAL pattern.

**Mir-program institutional crew-rotation discipline observed at obs#3 cumulative.** EO-3 inherits Mir from EO-1 via multi-flight Soyuz-vehicle swap; sustains v1.131 + v1.133 substrate.

## What Could Be Better

- **Brief-template substrate-form adaptation guidance is implicit.** Mission-essentials block is the only delta per release, but the campaign brief doesn't yet codify substrate-form-distinct adaptation cues; future briefs may benefit from explicit class-based prompts.
- **Lessons-carryover.json schema is per-mission; cross-mission consolidation lives in the tracker.** Each rebuild captures its own carryover but the campaign-wide rollup remains in mission-tracker.md rather than the structured schema.
- **Cadence projection assumes Lesson #10168 ~30-milestone reuse threshold holds.** Future counter-cadence ships may compress cadence if multiple operational-debt families demand simultaneous attention in the same window.

## Surprises

**Sub-agent dispatch returned at 28 tool uses at band lower edge.** 11 NEW LOCKED + 7 cumulative substrate-axes. Substrate-coincident-distinct memorial framing did not increase dispatch tool-uses; engineering register applied cleanly.

**Substrate-coincident-distinct memorial framing substrate-novel.** First instance of articulating that a crew member's mission-performance substrate may be distinct from post-mission biographical substrate.

**Manarov Caucasus-heritage substrate-anchor opens substrate-novel cohort.** First Lak-language-heritage cosmonaut substrate; substrate-precursor for Caucasus-heritage cohort.

## Lessons Learned

# Lessons — v1.49.732

4 lessons extracted. Classification source: rule-based · LLM tiebreaker (needs review) · human.

1. **Lesson #10408 ESTABLISHED extends across seventh mission-class boundary (year-in-space + substrate-coincident-distinct memorial substrate-axis).**
   v1.134 year-in-space substrate validates the SCAFFOLD-PENDING engine-state suppression pattern across the substrate-coincident-distinct memorial framing.
   _Status: investigate · lesson #10774_

2. **Path A sub-agent dispatch sustains cleanly at v1.134 with positive-framing-density-audited brief.**
   Brief 0/0/0 trip-vocab (after 1 "abort" instance removed in edit); sub-agent returned at 28 tool uses at band lower edge.
   _Status: investigate · lesson #10775_

3. **Substrate-coincident-distinct memorial framing substrate-novel.**
   First instance of articulating that a crew member's mission-performance substrate may be distinct from post-mission biographical substrate; substrate-novel framing approach.
   _Status: investigate · lesson #10776_

4. **Mir-program institutional crew-rotation discipline obs#3 cumulative.**
   EO-3 inherits Mir from EO-1 via multi-flight Soyuz-vehicle swap protocol; sustains established Mir-program protocol from v1.131 first-instance + v1.133 second-instance.
   _Status: investigate · lesson #10777_
