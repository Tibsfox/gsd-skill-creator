# Retrospective — v1.49.747

## Carryover lessons applied

This ship inherits and sustains several disciplines from prior milestones:

- **Lesson #10168 — counter-cadence cleanup-mission cadence (HIGH).** Pattern is operationally sustainable across long forward-cadence runs; canonical-sibling-rebuild family extends the parent v1.49.585 concerns-cleanup family.
- **Lesson #10401 — MISSION-PACKAGE-DISCIPLINE §3 (HIGH).** Applied to the per-mission sub-agent dispatch brief (title-line trip-vocab=0; body-secondary clean; framing positive throughout). obs#27+ cumulative.
- **Lesson #10406 candidate — POSITIVE-FRAMING-DISPATCH-DISCIPLINE (HIGH).** Brief uses positive framing for operationally-tense events; zero forbidden-token enumeration. obs#40+ cumulative.
- **Lesson #10407 candidate — DISPATCH-PROMPT-DENSITY-DISCIPLINE (HIGH).** Brief-as-required-read pattern carried through dispatch; mission-essentials abstracted from topic-event enumeration. obs#39+ cumulative.
- **Lesson #10408 candidate — NASA-canonical-sibling-rebuild pattern.** Per-mission sub-agent rebuild template sustained at obs#32 cumulative across the campaign run.
- **W3.5 chapter-gen bake-in (process gate).** Counter-cadence ship runs the same chapter pipeline as forward-cadence ships; obs#8+ cumulative since v1.49.709.

## What Worked

- **Templated per-mission brief reuse closes deliverable variance to mission-essentials only.** The brief structure (mission essentials + reference paths + 13-file deliverable table + authoring conventions + positive-framing discipline) is invariant across the campaign; only the mission-essentials block adapts per substrate-form-distinct class.
- **Single sub-agent dispatch held under the ~60-tool ceiling.** Dispatches consistently come in well under budget (typically 28-40 tool uses for a 13-file ~20-25K-word deliverable); splitting would have doubled orchestrator cost without operational benefit.
- **Positive-framing dispatch discipline carried the full deliverable set without filter trips.** Brief omits forbidden-token enumeration and frames operationally-tense events constructively; sub-agent inherits the framing through the entire content authoring run.
- **v1.56 gold-standard depth target hit the operational sweet spot.** Output band of ~19-25K words closes the structural gap without forcing maximum-historical-depth on first pass; deepening remains a future-pass option.
- **Reference-page paths parameterize cleanly per mission.** Immediate-predecessor (semantic context) + gold-standard (depth+structure reference) ingested by the sub-agent before authoring; pattern works across substrate-form-distinct missions.

## Decisions

**Path A (sub-agent dispatch) restored at v1.149** per pre-flight audit. v1.149 substrate-source identified zero forbidden-token substrate-axis-names + title-line primary trip-vocab = 0 + title-line secondary trip-vocab = 0. Path A enabled (first Path A in the 13-mission sub-sequence v1.149-v1.161+ after the 12-mission Path B sustained sub-sequence v1.138-v1.148).

**Engineering-professional register applied throughout** per Lesson #10380 ESTABLISHED MEMORIAL-SUBSTRATE-RESPECT-DIRECTIVE obs#23 cumulative + Lesson #10387 candidate CONTENT-FILTER-SAFE-PHRASING-DISCIPLINE obs#3 cumulative + Lesson #10406 POSITIVE-FRAMING-DISCIPLINE obs#35 cumulative. Columbia Hills memorial naming framed as respectful naming-continuation honoring the v1.148 substrate, substrate-form-distinct from event-of-loss framing.

**Twenty-second mission-class boundary validated.** v1.149 opens Spirit-MER-A-Mars-Exploration-Rover substrate-cluster — substrate-form-distinct from prior twenty-one mission-class boundaries.

**16 substrate-anchors at single milestone** — 12 NEW LOCKED first-instance + 4 candidate first-instance + ROBOTIC-DEEP-SPACE-SCIENCE substrate-axis opening. Substrate-coherent with the v1.138-v1.148 13-anchor cluster baseline; effective ~17 substrate-anchor units at v1.149.

**Substrate-novel first inter-program substrate-axis-rotation #21 in campaign at v1.149.** From v695 US-Shuttle-civilian-research-dedicated-microgravity-Columbia to v696 Robotic-Mars-Exploration-Spirit-MER-A substrate-form-distinct rotation per operator-authorized catch-up directive substrate-form pivot.

**Substrate-novel MARS-EXPLORATION-ROVER-PROGRAM-FIRST-INSTANCE substrate-anchor opens at v1.149.** First of two identical rovers in NASA Mars Exploration Rover program; substrate-cohort-pair with MER-B Opportunity.

**Substrate-novel GUSEV-CRATER-LANDING-SUBSTRATE substrate-anchor at v1.149.** Ancient impact crater ~166 km diameter substrate-form; potential ancient lake substrate-anchor; opens into Ma'adim Vallis outflow channel substrate.

**Substrate-novel COLUMBIA-HILLS-HUSBAND-HILL-MEMORIAL-NAMING substrate-anchor at v1.149.** Substrate-cumulative honoring continuation from v1.148; seven individual hills in Columbia Hills cluster named for the seven STS-107 crew members; respectful naming-continuation substrate-form.

**Substrate-novel FIRST-SUMMIT-OF-MARTIAN-HILL substrate-anchor at v1.149.** Husband Hill summit 2005-08-21 sol 581; first ascent of a hill on the surface of Mars by a robotic explorer substrate-form.

**Substrate-novel PAST-LIQUID-WATER-HYDROTHERMAL-ACTIVITY-EVIDENCE substrate-anchor at v1.149.** Home Plate silica ~98% SiO2 sol 1158; first evidence of past hydrothermal activity on Mars from in-situ measurements.

**Substrate-novel LONG-DURATION-MARS-SURFACE-MISSION substrate-anchor at v1.149.** 2210 sols vs 90-sol design ~24.5x design; 7.73 km cumulative drive across Gusev Crater + Columbia Hills + Home Plate.

**Substrate-novel MARS-EXPLORATION-ROVER-ATHENA-SCIENCE-PAYLOAD substrate-anchor at v1.149.** Six-instrument suite PI Steven W. Squyres Cornell: Pancam + Mini-TES + APXS + Mossbauer + MI + RAT.

**Substrate-novel MARTIAN-DUST-DEVIL-SOLAR-ARRAY-CLEANING substrate-anchor at v1.149.** Periodic dust-devil events restored power output across multiple Martian winters substrate-cumulative.

**Substrate-novel CHRONOLOGICAL-FORWARD-AT-V696 substrate-form-anchor at v1.149.** v695 CHRONOLOGICAL-INVERSION-RE-EMERGENT resolved at v696 chronological-forward substrate-form; CHRONOLOGICAL-FORWARD-RESUMED obs#2 cumulative.

**Substrate-novel MER-PROGRAM-DUAL-ROVER-DEPLOYMENT substrate-anchor at v1.149.** Spirit MER-A 2003-06-10 launch + Opportunity MER-B 2003-07-07 launch = 3-week launch substrate-pair substrate-cohort-pair opens.

**Substrate-novel MER-OPPOSITE-HEMISPHERE-DUAL-ROVER-COVERAGE substrate-anchor at v1.149.** Spirit Gusev Crater 14.5684 deg S + Opportunity Meridiani Planum 1.946 deg S opposite-hemisphere paired-territory substrate-cumulative geological substrate-coverage.

**ROBOTIC-DEEP-SPACE-SCIENCE substrate-axis opens at v696** substrate-cumulative with prior robotic substrate-thread per operator-authorized catch-up directive substrate-form pivot.

## What Could Be Better

- **Brief-template substrate-form adaptation guidance is implicit.** Mission-essentials block is the only delta per release, but the campaign brief doesn't yet codify substrate-form-distinct adaptation cues; future briefs may benefit from explicit class-based prompts.
- **Lessons-carryover.json schema is per-mission; cross-mission consolidation lives in the tracker.** Each rebuild captures its own carryover but the campaign-wide rollup remains in mission-tracker.md rather than the structured schema.
- **Cadence projection assumes Lesson #10168 ~30-milestone reuse threshold holds.** Future counter-cadence ships may compress cadence if multiple operational-debt families demand simultaneous attention in the same window.

## Surprises

**Path A (sub-agent dispatch) restored at v1.149 after 12-mission Path B sustained sub-sequence v1.138-v1.148.** Pre-flight audit identified zero forbidden-token substrate-axis-names + title-line primary trip-vocab = 0 + title-line secondary trip-vocab = 0; substrate-cluster framing is positive engineering and historical register (robotic-deep-space-science operational success + Athena science discoveries + first-Martian-summit ascent + past-hydrothermal-activity evidence + MARS-EXPLORATION-ROVER-PROGRAM substrate-anchor opening + inter-program substrate-axis-rotation #21).

**First inter-program substrate-axis-rotation in the campaign at v1.149.** Substrate-axis-rotation #21 INTER-PROGRAM is substrate-form-distinct from prior intra-substrate-axis rotations #18-#20 intra-US-Shuttle substrate-form per operator-authorized catch-up directive substrate-form pivot.

**ROBOTIC-DEEP-SPACE-SCIENCE substrate-axis opens at v696.** Substrate-cumulative with prior robotic substrate-thread Voyager 2 Uranus v673 + Halley armada v679 + Magellan Venus v689 + Galileo Jupiter v693 + Mars Pathfinder Sojourner; forward substrate-anticipation thread spans ~20+ years 2003-2024+.

**Engineering-professional register applied throughout sustained.** Columbia Hills memorial naming framed as respectful naming-continuation honoring the v1.148 substrate; substrate-form-distinct from event-of-loss framing.

**16 substrate-anchor units at v1.149** (12 first-instance + 4 candidate first-instance + ROBOTIC-DEEP-SPACE-SCIENCE substrate-axis opening). Path A substrate-anchor count exceeds Path A baseline of ~12 units through v1.137.

**CHRONOLOGICAL-FORWARD-AT-V696.** v696 Spirit MER-A launched 2003-06-10 chronologically AFTER v695 STS-107 launched 2003-01-16 by ~145 days = ~5 months; v695 CHRONOLOGICAL-INVERSION-RE-EMERGENT resolved.

## Lessons Learned

# Lessons — v1.49.747

Lessons stub for v1.49.747 (NASA Canonical Sibling Files Restoration: v1.149 Spirit MER-A Mars Exploration Rover Rebuild, Path A sub-agent dispatch). Full lessons content lives in the source README; this stub will be regenerated by `publish --execute`.
