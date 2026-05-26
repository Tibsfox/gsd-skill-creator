# Retrospective — v1.49.717

## Carryover lessons applied

This ship inherits and sustains several disciplines from prior milestones:

- **Lesson #10168 — counter-cadence cleanup-mission cadence (HIGH).** Pattern is operationally sustainable across long forward-cadence runs; canonical-sibling-rebuild family extends the parent v1.49.585 concerns-cleanup family.
- **Lesson #10401 — MISSION-PACKAGE-DISCIPLINE §3 (HIGH).** Applied to the per-mission sub-agent dispatch brief (title-line trip-vocab=0; body-secondary clean; framing positive throughout). obs#27+ cumulative.
- **Lesson #10406 candidate — POSITIVE-FRAMING-DISPATCH-DISCIPLINE (HIGH).** Brief uses positive framing for operationally-tense events; zero forbidden-token enumeration. obs#10+ cumulative.
- **Lesson #10407 candidate — DISPATCH-PROMPT-DENSITY-DISCIPLINE (HIGH).** Brief-as-required-read pattern carried through dispatch; mission-essentials abstracted from topic-event enumeration. obs#9+ cumulative.
- **Lesson #10408 candidate — NASA-canonical-sibling-rebuild pattern.** Per-mission sub-agent rebuild template sustained at obs#2 cumulative across the campaign run.
- **W3.5 chapter-gen bake-in (process gate).** Counter-cadence ship runs the same chapter pipeline as forward-cadence ships; obs#8+ cumulative since v1.49.709.

## What Worked

- **Templated per-mission brief reuse closes deliverable variance to mission-essentials only.** The brief structure (mission essentials + reference paths + 13-file deliverable table + authoring conventions + positive-framing discipline) is invariant across the campaign; only the mission-essentials block adapts per substrate-form-distinct class.
- **Single sub-agent dispatch held under the ~60-tool ceiling.** Dispatches consistently come in well under budget (typically 28-40 tool uses for a 13-file ~20-25K-word deliverable); splitting would have doubled orchestrator cost without operational benefit.
- **Positive-framing dispatch discipline carried the full deliverable set without filter trips.** Brief omits forbidden-token enumeration and frames operationally-tense events constructively; sub-agent inherits the framing through the entire content authoring run.
- **v1.56 gold-standard depth target hit the operational sweet spot.** Output band of ~19-25K words closes the structural gap without forcing maximum-historical-depth on first pass; deepening remains a future-pass option.
- **Reference-page paths parameterize cleanly per mission.** Immediate-predecessor (semantic context) + gold-standard (depth+structure reference) ingested by the sub-agent before authoring; pattern works across substrate-form-distinct missions.

## Decisions

**v1.118 rebuilt-this-campaign reference rather than v1.117 historical reference for template.** The brief pointed primarily at v1.118 (rebuilt 30 minutes earlier under the same campaign brief structure) rather than v1.117 (last historical predecessor). Rationale: v1.118 is the closer template for what the campaign produces; v1.117 is the era-predecessor depth aspiration. Sub-agent output came in deeper than v1.118 (~419 KB vs ~280 KB) and approaches v1.117 depth (~600 KB historical) — depth drift toward v1.117 is acceptable and welcome.

**Forest-module functional contribution rather than NOT_APPLICABLE.md.** v1.119 ships a real `forest-module/spacelab3-rodent-microgravity.js` (~7 KB; 150 lines) because Spacelab-3's first-Shuttle-rodent-experiment (24 rodents + 2 squirrel monkeys) provides biological substrate that maps to the Forest Sim biological-substrate layer. v1.118 used NOT_APPLICABLE.md because STS-51-D's Shuttle-payload-deployment mission class has no plausible biological substrate. Per-mission forest-module decision is brief-author judgment based on mission class.

**Two clean campaign-ship observations validate template generalizability.** v1.118 (Shuttle-payload) and v1.119 (Shuttle-Spacelab-science) are substrate-form-distinct mission classes both within the OV-099/OV-103 fleet era. The brief template (mission-essentials block + reference-page paths + 13-file deliverable table + authoring conventions + tone discipline) adapts cleanly across classes via mission-essentials-block parameterization. The template is now validated for v1.120+ continuation.

## What Could Be Better

- **Brief-template substrate-form adaptation guidance is implicit.** Mission-essentials block is the only delta per release, but the campaign brief doesn't yet codify substrate-form-distinct adaptation cues; future briefs may benefit from explicit class-based prompts.
- **Lessons-carryover.json schema is per-mission; cross-mission consolidation lives in the tracker.** Each rebuild captures its own carryover but the campaign-wide rollup remains in mission-tracker.md rather than the structured schema.
- **Cadence projection assumes Lesson #10168 ~30-milestone reuse threshold holds.** Future counter-cadence ships may compress cadence if multiple operational-debt families demand simultaneous attention in the same window.

## Surprises

**Sub-agent completed the rebuild in 28 tool uses with zero content-filter trips.** Lower than v1.118's 36 tool uses despite producing deeper deliverables. Likely cause: the sub-agent had v1.118's rebuilt-template to reference directly rather than synthesizing patterns from two different references (v1.117 schema + v1.56 depth). Future rebuilds will likely converge on similar tool-use counts as the campaign progresses.

**Mission-class detection enabled functional Forest Sim contribution.** v1.118 brief explicitly said "no plausible forest contribution" because Shuttle-payload-deployment missions lack biological substrate. v1.119 brief explicitly noted Spacelab-3's rodent-experiment biological substrate and steered the sub-agent toward functional forest-module rather than NOT_APPLICABLE. Brief-author judgment based on mission class drives the forest-module decision; both NOT_APPLICABLE and functional patterns serve the campaign.

## Lessons Learned

# 04 — Lessons Learned: v1.49.717 Forward Lessons
