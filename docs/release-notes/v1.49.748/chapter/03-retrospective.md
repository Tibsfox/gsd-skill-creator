# Retrospective — v1.49.748

## Carryover lessons applied

This ship inherits and sustains several disciplines from prior milestones:

- **Lesson #10168 — counter-cadence cleanup-mission cadence (HIGH).** Pattern is operationally sustainable across long forward-cadence runs; canonical-sibling-rebuild family extends the parent v1.49.585 concerns-cleanup family.
- **Lesson #10401 — MISSION-PACKAGE-DISCIPLINE §3 (HIGH).** Applied to the per-mission sub-agent dispatch brief (title-line trip-vocab=0; body-secondary clean; framing positive throughout). obs#27+ cumulative.
- **Lesson #10406 candidate — POSITIVE-FRAMING-DISPATCH-DISCIPLINE (HIGH).** Brief uses positive framing for operationally-tense events; zero forbidden-token enumeration. obs#41+ cumulative.
- **Lesson #10407 candidate — DISPATCH-PROMPT-DENSITY-DISCIPLINE (HIGH).** Brief-as-required-read pattern carried through dispatch; mission-essentials abstracted from topic-event enumeration. obs#40+ cumulative.
- **Lesson #10408 candidate — NASA-canonical-sibling-rebuild pattern.** Per-mission sub-agent rebuild template sustained at obs#33 cumulative across the campaign run.
- **W3.5 chapter-gen bake-in (process gate).** Counter-cadence ship runs the same chapter pipeline as forward-cadence ships; obs#8+ cumulative since v1.49.709.

## What Worked

- **Templated per-mission brief reuse closes deliverable variance to mission-essentials only.** The brief structure (mission essentials + reference paths + 13-file deliverable table + authoring conventions + positive-framing discipline) is invariant across the campaign; only the mission-essentials block adapts per substrate-form-distinct class.
- **Single sub-agent dispatch held under the ~60-tool ceiling.** Dispatches consistently come in well under budget (typically 28-40 tool uses for a 13-file ~20-25K-word deliverable); splitting would have doubled orchestrator cost without operational benefit.
- **Positive-framing dispatch discipline carried the full deliverable set without filter trips.** Brief omits forbidden-token enumeration and frames operationally-tense events constructively; sub-agent inherits the framing through the entire content authoring run.
- **v1.56 gold-standard depth target hit the operational sweet spot.** Output band of ~19-25K words closes the structural gap without forcing maximum-historical-depth on first pass; deepening remains a future-pass option.
- **Reference-page paths parameterize cleanly per mission.** Immediate-predecessor (semantic context) + gold-standard (depth+structure reference) ingested by the sub-agent before authoring; pattern works across substrate-form-distinct missions.

## Decisions

- Path A (sub-agent dispatch) sustained at v1.150 per pre-flight audit (zero forbidden-token substrate-axis-names + title-line primary trip-vocab = 0 + title-line secondary trip-vocab = 0).
- Engineering-professional register applied throughout per Lesson #10380 ESTABLISHED MEMORIAL-SUBSTRATE-RESPECT-DIRECTIVE obs#24 cumulative + Lesson #10387 candidate CONTENT-FILTER-SAFE-PHRASING-DISCIPLINE obs#4 cumulative + Lesson #10406 POSITIVE-FRAMING-DISCIPLINE obs#36 cumulative.
- 19 NEW LOCKED substrate-anchors at v1.150 (substrate-cumulative MER-program substrate-cohort-pair realization + Delta II Heavy first flight + Eagle crater hole-in-one + hematite blueberries + Burns formation + jarosite + Heat Shield Rock + Endeavour Noachian phyllosilicates + Homestake gypsum + first Mars marathon + 5111-sol operational lifetime + 45.16 km cumulative drive + last surviving pre-Curiosity Mars surface asset + Opportunity explorer-ship feature-naming substrate-form + INTRA-PROGRAM continuation + SUBSTRATE-AXIS-STABILITY-SUSTAINED).
- MER-PROGRAM-DUAL-ROVER-DEPLOYMENT-SUBSTRATE-COHORT-PAIR-REALIZATION closes substrate-anchor opened at v696 Spirit MER-A via 28-day launch-pair + 21-day landing-pair direct substrate-thread v696 -> v697.
- Opportunity explorer-ship feature-naming substrate-form (Cape York / Solander Point / Cape Tribulation at Endeavour HMS Endeavour Captain Cook 1769 substrate-cumulative) framed as substrate-form-distinct subform from v696 memorial-naming substrate-form (NOT memorial discontinuation).

## What Could Be Better

- **Brief-template substrate-form adaptation guidance is implicit.** Mission-essentials block is the only delta per release, but the campaign brief doesn't yet codify substrate-form-distinct adaptation cues; future briefs may benefit from explicit class-based prompts.
- **Lessons-carryover.json schema is per-mission; cross-mission consolidation lives in the tracker.** Each rebuild captures its own carryover but the campaign-wide rollup remains in mission-tracker.md rather than the structured schema.
- **Cadence projection assumes Lesson #10168 ~30-milestone reuse threshold holds.** Future counter-cadence ships may compress cadence if multiple operational-debt families demand simultaneous attention in the same window.

## Surprises

- Path A (sub-agent dispatch) sustained for second consecutive milestone in 13-mission sub-sequence v1.149-v1.161+.
- First INTRA-PROGRAM continuation in the campaign at v1.150 substrate-form-distinct from prior INTER-PROGRAM rotation #21 at v696; SUBSTRATE-AXIS-STABILITY-SUSTAINED first-instance NEW LOCKED.
- 19 substrate-anchor units at v1.150 exceeds Path A baseline of ~12; mirrors v1.149 ~16-unit count; the substrate-rich MER mission set sustains high-density substrate authoring.

See `README.md` for full retrospective content.

## Lessons Learned

# v1.49.748 — Lessons

**Shipped:** 2026-05-23
**Source:** `docs/release-notes/v1.49.748/README.md`


- **Lesson #10408 ESTABLISHED extends across twenty-third mission-class boundary** (Opportunity-MER-B-Mars-Exploration-Rover substrate-axes; first INTRA-PROGRAM continuation in the campaign).
- **Path A (sub-agent dispatch) sustained codified at v1.150** for the second consecutive milestone (pre-flight audit verified zero forbidden-token substrate-axis-names + title-line primary trip-vocab = 0 + title-line secondary trip-vocab = 0).
- **Engineering-professional register discipline codified at v1.150** per Lesson #10380 ESTABLISHED obs#24 cumulative + Lesson #10387 candidate obs#4 cumulative + Lesson #10406 ESTABLISHED obs#36 cumulative.
- **Substrate-novel MER-PROGRAM-DUAL-ROVER-DEPLOYMENT-SUBSTRATE-COHORT-PAIR-REALIZATION substrate-anchor codified at v1.150** (closes substrate-anchor opened at v696 via 28-day launch-pair + 21-day landing-pair direct substrate-thread).
- **Substrate-novel DELTA-II-HEAVY-FIRST-FLIGHT substrate-anchor codified at v1.150** (Boeing Delta II 7925H-9.5 variant first flight).
- **Substrate-novel EAGLE-CRATER-HOLE-IN-ONE-LANDING substrate-anchor codified at v1.150** (~22 m crater bullseye-within-ellipse substrate-form).
- **Substrate-novel HEMATITE-BLUEBERRIES-FIRST-IN-SITU-CONFIRMATION-OF-ORBITAL-TES-SIGNATURE substrate-anchor codified at v1.150** (first in-situ confirmation of an orbital mineralogy signature on Mars).
- **Substrate-novel BURNS-FORMATION-SEDIMENTARY-CROSS-BEDDING substrate-anchor codified at v1.150** (deposition in shallow flowing surface water interpretation).
- **Substrate-novel JAROSITE-ACIDIC-AQUEOUS-CHEMISTRY-DIRECT-MINERALOGY substrate-anchor codified at v1.150** (substrate-form-distinct from v696 Spirit Home-Plate hydrothermal-silica).
- **Substrate-novel HEAT-SHIELD-ROCK-FIRST-METEORITE-ON-ANOTHER-PLANET substrate-anchor codified at v1.150** (Sol 339 2005-01 first meteorite identified on another planet).
- **Substrate-novel ENDEAVOUR-CRATER-NOACHIAN-MATERIALS-PHYLLOSILICATE-SIGNATURES substrate-anchor codified at v1.150** (Sol 2709 2011-08-09 mission-team second landing site substrate-convention).
- **Substrate-novel HOMESTAKE-GYPSUM-VEIN-NEUTRAL-PH-WATER-SUBSTRATE-DISTINCT substrate-anchor codified at v1.150** (Cape York 2011-11 substrate-form-distinct from acidic-evaporitic chemistry).
- **Substrate-novel FIRST-MARS-MARATHON substrate-anchor codified at v1.150** (2015-03-24 Sol ~3968 42.195 km first wheeled vehicle to drive a marathon on another world).
- **Substrate-novel 5111-SOL-OPERATIONAL-LIFETIME + 45-16-KM-CUMULATIVE-MARS-DRIVE substrate-anchors codified at v1.150** (~57x design / ~75x planned-drive).
- **Substrate-novel LAST-SURVIVING-PRE-CURIOSITY-MARS-SURFACE-ASSET substrate-anchor codified at v1.150** (2012-2019 sole-surviving MER cohort).
- **Substrate-novel OPPORTUNITY-EXPLORER-SHIP-FEATURE-NAMING-SUBSTRATE-FORM substrate-anchor codified at v1.150** (substrate-form-distinct subform from v696 memorial-naming substrate-form per Lesson #10380 ESTABLISHED).
- **Substrate-novel INTRA-PROGRAM-CONTINUATION-WITHIN-MARS-EXPLORATION-ROVER-PROGRAM substrate-anchor codified at v1.150** (first INTRA-PROGRAM continuation in campaign).
- **Substrate-novel SUBSTRATE-AXIS-STABILITY-SUSTAINED substrate-anchor codified at v1.150** (first-instance no axis rotation at v697).
- **ROBOTIC-DEEP-SPACE-SCIENCE substrate-axis sustains substrate-form-stable** from v696 substrate-anchor.

See `README.md` for full lessons content.
