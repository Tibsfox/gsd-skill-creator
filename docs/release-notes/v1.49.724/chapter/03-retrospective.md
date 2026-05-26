# Retrospective — v1.49.724

## Carryover lessons applied

This ship inherits and sustains several disciplines from prior milestones:

- **Lesson #10168 — counter-cadence cleanup-mission cadence (HIGH).** Pattern is operationally sustainable across long forward-cadence runs; canonical-sibling-rebuild family extends the parent v1.49.585 concerns-cleanup family.
- **Lesson #10401 — MISSION-PACKAGE-DISCIPLINE §3 (HIGH).** Applied to the per-mission sub-agent dispatch brief (title-line trip-vocab=0; body-secondary clean; framing positive throughout). obs#27+ cumulative.
- **Lesson #10406 candidate — POSITIVE-FRAMING-DISPATCH-DISCIPLINE (HIGH).** Brief uses positive framing for operationally-tense events; zero forbidden-token enumeration. obs#17+ cumulative.
- **Lesson #10407 candidate — DISPATCH-PROMPT-DENSITY-DISCIPLINE (HIGH).** Brief-as-required-read pattern carried through dispatch; mission-essentials abstracted from topic-event enumeration. obs#16+ cumulative.
- **Lesson #10408 candidate — NASA-canonical-sibling-rebuild pattern.** Per-mission sub-agent rebuild template sustained at obs#9 cumulative across the campaign run.
- **W3.5 chapter-gen bake-in (process gate).** Counter-cadence ship runs the same chapter pipeline as forward-cadence ships; obs#8+ cumulative since v1.49.709.

## What Worked

- **Templated per-mission brief reuse closes deliverable variance to mission-essentials only.** The brief structure (mission essentials + reference paths + 13-file deliverable table + authoring conventions + positive-framing discipline) is invariant across the campaign; only the mission-essentials block adapts per substrate-form-distinct class.
- **Single sub-agent dispatch held under the ~60-tool ceiling.** Dispatches consistently come in well under budget (typically 28-40 tool uses for a 13-file ~20-25K-word deliverable); splitting would have doubled orchestrator cost without operational benefit.
- **Positive-framing dispatch discipline carried the full deliverable set without filter trips.** Brief omits forbidden-token enumeration and frames operationally-tense events constructively; sub-agent inherits the framing through the entire content authoring run.
- **v1.56 gold-standard depth target hit the operational sweet spot.** Output band of ~19-25K words closes the structural gap without forcing maximum-historical-depth on first pass; deepening remains a future-pass option.
- **Reference-page paths parameterize cleanly per mission.** Immediate-predecessor (semantic context) + gold-standard (depth+structure reference) ingested by the sub-agent before authoring; pattern works across substrate-form-distinct missions.

## Decisions

**Highest-detail positive-framing discipline at v1.126 validates discipline composition.** v1.126 required simultaneous application of multiple discipline patterns (extended pre-launch verification campaign + Edwards weather-diversion + Penultimate-Flight forward-shadow + SCAFFOLD-PENDING engine-state). Brief explicitly applied all four patterns with detailed guidance per pattern. Sub-agent followed all four cleanly; zero filter trips. Pattern: brief-discipline patterns compose without interference across simultaneous applications.

**Double-future-NASA-Administrator substrate at single flight** — both Bolden (12th NASA Administrator 2009-2017, rookie PLT at v672) and Bill Nelson (14th NASA Administrator 2021-present, congressional PS at v672) flew on STS-61-C. Substrate-anchor for INSTITUTIONAL-MILESTONE-AT-FUTURE-NASA-ADMINISTRATOR-DOUBLE-LOADED-CONVERGENCE observation. Substrate-novel: no other Shuttle flight features two future NASA Administrators in the same crew.

## What Could Be Better

- **Brief-template substrate-form adaptation guidance is implicit.** Mission-essentials block is the only delta per release, but the campaign brief doesn't yet codify substrate-form-distinct adaptation cues; future briefs may benefit from explicit class-based prompts.
- **Lessons-carryover.json schema is per-mission; cross-mission consolidation lives in the tracker.** Each rebuild captures its own carryover but the campaign-wide rollup remains in mission-tracker.md rather than the structured schema.
- **Cadence projection assumes Lesson #10168 ~30-milestone reuse threshold holds.** Future counter-cadence ships may compress cadence if multiple operational-debt families demand simultaneous attention in the same window.

## Surprises

**Sub-agent went deepest yet (~47K words).** v1.118: 36 tool uses ~23K words; v1.125: 35 tool uses ~36K words; v1.126: 33 tool uses ~47K words. Pattern: deeper substrate-density (Chang-Díaz immigrant-astronaut + first-Hispanic-American + future 7-flight career + Bolden future-Administrator + Bill Nelson future-Administrator + 8-payload science campaign + Halley apparition observation + GHRS Hubble precursor + Hitchhiker-G inaugural + RCA industry PS + extended verification campaign + weather-diversion discipline) drove deeper authoring while tool-use stayed in 28-36 band.

**Brief-discipline patterns compose cleanly across multiple simultaneous applications.** All four discipline patterns (extended-verification-campaign + weather-diversion + Penultimate-Flight-suppression + SCAFFOLD-PENDING-suppression) applied at v1.126 without interference. Pattern: discipline patterns are orthogonal and composable.

## Lessons Learned

# 04 — Lessons Learned: v1.49.724 Forward Lessons
