# Retrospective — v1.49.725

## Carryover lessons applied

This ship inherits and sustains several disciplines from prior milestones:

- **Lesson #10168 — counter-cadence cleanup-mission cadence (HIGH).** Pattern is operationally sustainable across long forward-cadence runs; canonical-sibling-rebuild family extends the parent v1.49.585 concerns-cleanup family.
- **Lesson #10401 — MISSION-PACKAGE-DISCIPLINE §3 (HIGH).** Applied to the per-mission sub-agent dispatch brief (title-line trip-vocab=0; body-secondary clean; framing positive throughout). obs#27+ cumulative.
- **Lesson #10406 candidate — POSITIVE-FRAMING-DISPATCH-DISCIPLINE (HIGH).** Brief uses positive framing for operationally-tense events; zero forbidden-token enumeration. obs#18+ cumulative.
- **Lesson #10407 candidate — DISPATCH-PROMPT-DENSITY-DISCIPLINE (HIGH).** Brief-as-required-read pattern carried through dispatch; mission-essentials abstracted from topic-event enumeration. obs#17+ cumulative.
- **Lesson #10408 candidate — NASA-canonical-sibling-rebuild pattern.** Per-mission sub-agent rebuild template sustained at obs#10 cumulative across the campaign run.
- **W3.5 chapter-gen bake-in (process gate).** Counter-cadence ship runs the same chapter pipeline as forward-cadence ships; obs#8+ cumulative since v1.49.709.

## What Worked

- **Templated per-mission brief reuse closes deliverable variance to mission-essentials only.** The brief structure (mission essentials + reference paths + 13-file deliverable table + authoring conventions + positive-framing discipline) is invariant across the campaign; only the mission-essentials block adapts per substrate-form-distinct class.
- **Single sub-agent dispatch held under the ~60-tool ceiling.** Dispatches consistently come in well under budget (typically 28-40 tool uses for a 13-file ~20-25K-word deliverable); splitting would have doubled orchestrator cost without operational benefit.
- **Positive-framing dispatch discipline carried the full deliverable set without filter trips.** Brief omits forbidden-token enumeration and frames operationally-tense events constructively; sub-agent inherits the framing through the entire content authoring run.
- **v1.56 gold-standard depth target hit the operational sweet spot.** Output band of ~19-25K words closes the structural gap without forcing maximum-historical-depth on first pass; deepening remains a future-pass option.
- **Reference-page paths parameterize cleanly per mission.** Immediate-predecessor (semantic context) + gold-standard (depth+structure reference) ingested by the sub-agent before authoring; pattern works across substrate-form-distinct missions.

## Decisions

**v1.127 deep-space robotic class extends Lesson #10408 ESTABLISHED across new mission-class boundary.** Prior 9 ships were all Shuttle-era (crewed missions with EVA + payloads + commercial-deploys + Spacelab science). v1.127 is robotic deep-space (no crew, no EVA, single-spacecraft outer-planet flyby, 9-of-11 instrument operational at ~19.2 AU). Pattern validates: ESTABLISHED Lesson #10408 brief-template adapts cleanly across substrate-form-distinct mission-class boundaries via mission-essentials-block adaptation. Sub-agent recognized the substrate-form distinctness and adapted narrative framing accordingly.

**8 first-instance NEW LOCKED substrate-anchors at single mission.** v1.127 is one of the substrate-richest single-mission rebuilds in the campaign — 8 NEW LOCKED first-instances plus 5+ additional first-instances plus 4 cumulative observations. Reflects the substrate-novel nature of Voyager 2 Uranus encounter as a first-and-only-ever planetary visit.

## What Could Be Better

- **Brief-template substrate-form adaptation guidance is implicit.** Mission-essentials block is the only delta per release, but the campaign brief doesn't yet codify substrate-form-distinct adaptation cues; future briefs may benefit from explicit class-based prompts.
- **Lessons-carryover.json schema is per-mission; cross-mission consolidation lives in the tracker.** Each rebuild captures its own carryover but the campaign-wide rollup remains in mission-tracker.md rather than the structured schema.
- **Cadence projection assumes Lesson #10168 ~30-milestone reuse threshold holds.** Future counter-cadence ships may compress cadence if multiple operational-debt families demand simultaneous attention in the same window.

## Surprises

**Tool-use 38 just above prior band (28-36).** v1.127 went slightly above the 9-observation band, likely due to additional reference-page reads for prior Voyager mission substrate-context. Word count ~25.6K within band. Pattern: deeper substrate-context-research can push tool-use slightly above band without affecting word-count.

**Mission-class boundary crossed cleanly.** Sub-agent treated the deep-space robotic substrate as substrate-form-distinct from Shuttle-era and adapted forest-module decision (NOT_APPLICABLE.md for robotic mission class), organism scope (SCAFFOLD-PENDING placeholder maintained), and narrative framing (planetary-science success rather than crew-mission success).

## Lessons Learned

# 04 — Lessons Learned: v1.49.725 Forward Lessons
