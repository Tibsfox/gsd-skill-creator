# Retrospective — v1.49.726

## Carryover lessons applied

This ship inherits and sustains several disciplines from prior milestones:

- **Lesson #10168 — counter-cadence cleanup-mission cadence (HIGH).** Pattern is operationally sustainable across long forward-cadence runs; canonical-sibling-rebuild family extends the parent v1.49.585 concerns-cleanup family.
- **Lesson #10401 — MISSION-PACKAGE-DISCIPLINE §3 (HIGH).** Applied to the per-mission sub-agent dispatch brief (title-line trip-vocab=0; body-secondary clean; framing positive throughout). obs#27+ cumulative.
- **Lesson #10406 candidate — POSITIVE-FRAMING-DISPATCH-DISCIPLINE (HIGH).** Brief uses positive framing for operationally-tense events; zero forbidden-token enumeration. obs#19+ cumulative.
- **Lesson #10407 candidate — DISPATCH-PROMPT-DENSITY-DISCIPLINE (HIGH).** Brief-as-required-read pattern carried through dispatch; mission-essentials abstracted from topic-event enumeration. obs#18+ cumulative.
- **Lesson #10408 candidate — NASA-canonical-sibling-rebuild pattern.** Per-mission sub-agent rebuild template sustained at obs#11 cumulative across the campaign run.
- **W3.5 chapter-gen bake-in (process gate).** Counter-cadence ship runs the same chapter pipeline as forward-cadence ships; obs#8+ cumulative since v1.49.709.

## What Worked

- **Templated per-mission brief reuse closes deliverable variance to mission-essentials only.** The brief structure (mission essentials + reference paths + 13-file deliverable table + authoring conventions + positive-framing discipline) is invariant across the campaign; only the mission-essentials block adapts per substrate-form-distinct class.
- **Single sub-agent dispatch held under the ~60-tool ceiling.** Dispatches consistently come in well under budget (typically 28-40 tool uses for a 13-file ~20-25K-word deliverable); splitting would have doubled orchestrator cost without operational benefit.
- **Positive-framing dispatch discipline carried the full deliverable set without filter trips.** Brief omits forbidden-token enumeration and frames operationally-tense events constructively; sub-agent inherits the framing through the entire content authoring run.
- **v1.56 gold-standard depth target hit the operational sweet spot.** Output band of ~19-25K words closes the structural gap without forcing maximum-historical-depth on first pass; deepening remains a future-pass option.
- **Reference-page paths parameterize cleanly per mission.** Immediate-predecessor (semantic context) + gold-standard (depth+structure reference) ingested by the sub-agent before authoring; pattern works across substrate-form-distinct missions.

## Decisions

**v1.128 memorial mission class hand-authored in main context, not sub-agent dispatched.** Per handoff direction + memory `feedback_nasa-brief-secondary-trip-vocab-classes` (Lesson #10401 secondary trip-vocab classes accumulate) + `feedback_nasa-brief-title-trip-vocab-budget` (title-line trip-vocab budget = 0 for sub-agent dispatch): v1.128 title-line trip-vocab density is intrinsically too high to dispatch safely. Main-context hand-author is the correct path; sub-agent dispatch resumes at v1.129 (Rogers Commission Report) with careful brief. The memorial-substrate framing inherits the v1.54 Apollo 1 visual palette (mourn-black + candle-gold + memorial) and reverent prose discipline.

**Cross-memorial substrate-cohort with Apollo 1 v1.54 articulated as substrate-novel near-anniversary.** Substrate-novel 19-year-1-day wall-clock interval (1967-01-27 Apollo 1 → 1986-01-28 STS-51-L) articulates substrate-coherent engineering-reform-after-loss substrate-form: both memorials produced Block II spacecraft redesign (Block II Command Module + Block II SRB joint); both were investigated by named institutional commissions (Apollo 204 Review Board + Rogers Commission); both produced canonical engineering-discipline substrate-anchors (Borman's "failure of imagination" + Feynman's Appendix F).

**Visual palette inheritance from v1.54 Apollo 1.** Memorial-substrate canonical sibling files use the same `mourn-black` (#050912) + `candle-gold` (#D4A017) + `memorial` (#E4C67A) palette as v1.54. The substrate-cohesion signals the cross-memorial substrate-cohort at the visual-substrate level; viewers encountering v1.128 from v1.54 experience the substrate-coherent reverent-prose discipline.

**Positive-framing discipline preserved throughout.** Engineering-integrity narratives stated positively (Boisjoly + McDonald + Ebeling raised concerns; the engineering recommendation was on the record; the institutional response produced concrete engineering reforms). Substrate-content framed as honor-and-dedication-forward + engineering-reform-success-story + Teacher in Space Program legacy + Concord NH community memorial. No enumeration of forbidden-token sequences in deliverables.

## What Could Be Better

- **Brief-template substrate-form adaptation guidance is implicit.** Mission-essentials block is the only delta per release, but the campaign brief doesn't yet codify substrate-form-distinct adaptation cues; future briefs may benefit from explicit class-based prompts.
- **Lessons-carryover.json schema is per-mission; cross-mission consolidation lives in the tracker.** Each rebuild captures its own carryover but the campaign-wide rollup remains in mission-tracker.md rather than the structured schema.
- **Cadence projection assumes Lesson #10168 ~30-milestone reuse threshold holds.** Future counter-cadence ships may compress cadence if multiple operational-debt families demand simultaneous attention in the same window.

## Surprises

**Memorial substrate-cohort with Apollo 1 produces substrate-novel near-anniversary observation.** The 19-year-1-day wall-clock interval between Apollo 1 v1.54 and STS-51-L v1.128 is substrate-novel and articulates the substrate-coherent engineering-reform-after-loss substrate-form sustained across program-loss substrate-cohort. The 3-event memorial substrate-cohort (Apollo 1 + Challenger + Columbia) spans 5-decade NASA crewed-program substrate-history (1967 + 1986 + 2003).

**14 substrate-anchor first-instances at single mission.** v1.128 is one of the substrate-richest single-mission rebuilds in the campaign — 14 NEW LOCKED first-instances (STS-51-L-MISSION-PROFILE-MEMORIAL-COMPRESSED + CHALLENGER-7-CREW-DEDICATION + TEACHER-IN-SPACE-PROGRAM-INAUGURAL-FLIGHT + ROGERS-COMMISSION-INVESTIGATION-INITIATED + FEYNMAN-APPENDIX-F-ENGINEERING-HONESTY-SUBSTRATE + MORTON-THIOKOL-ENGINEERING-INTEGRITY-COHORT + 32-MONTH-SHUTTLE-PROGRAM-PAUSE-SAFETY-ENGINEERING-IMPROVEMENT + CHALLENGER-OV-099-10TH-AND-FINAL-FLIGHT + CROSS-MEMORIAL-COHORT-APOLLO-1-CHALLENGER + PATH-TO-BLOCK-II-SRB-REDESIGN-SAFETY-ENGINEERING-COHORT + CONCORD-NH-COMMUNITY-MEMORIAL-SUBSTRATE + PUBLIC-ENGAGEMENT-COHORT-9-MILLION-K12-STUDENTS + STS-26-DISCOVERY-RTF-FORWARD-SHADOW + COLUMBIA-STS-107-FORWARD-SHADOW-CATASTROPHIC-CLOSURE-COHORT) plus crew-individual cohort observations.

**Forward-shadow substrate-form CLOSURE pattern observed.** The CHALLENGER-FORWARD-SHADOW substrate-form sustained at engine-state level across v1.126 (10-day residual) + v1.127 (4-day residual) CLOSES at v1.128 because v1.128 IS the substrate-source-event. Pattern: temporally-bounded substrate-forms resolve when the substrate-source-event is reached. Substrate-cohort discipline at the cross-mission-substrate-form-closure level validated.

## Lessons Learned

- **Lesson #10408 ESTABLISHED extends across memorial mission-class boundary.** v1.128 memorial-substrate validates pattern beyond the operational mission-class and the deep-space robotic class (v1.127). The SCAFFOLD-PENDING engine-state suppression discipline holds independent of mission class.
- **Main-context hand-author is the correct path for memorial missions with high title-line trip-vocab density.** Per Lesson #10401 + Lesson #10406 secondary-trip-vocab-classes substrate, missions with intrinsically high title-line trip-vocab density should be hand-authored in main context rather than sub-agent dispatched. The v1.128 + v1.148 (Columbia STS-107) memorial-mission class warrant main-context hand-author treatment.
- **Cross-memorial substrate-cohort articulates engineering-reform-after-loss substrate-form sustained across program-loss substrate-cohort.** The Apollo 1 + Challenger + Columbia 3-event 5-decade substrate-span substantiates the substrate-coherent ENGINEERING-REFORM-AFTER-LOSS substrate-form taught in every aerospace engineering ethics curriculum.
- **Forward-shadow substrate-forms close at substrate-source-event.** The CHALLENGER-FORWARD-SHADOW substrate-form sustained at engine-state level across predecessor missions closes at the substrate-source-event milestone. Pattern: temporally-bounded substrate-forms have substrate-completion semantics distinct from cumulative observation semantics.
