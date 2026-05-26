# Retrospective — v1.49.720

## Carryover lessons applied

This ship inherits and sustains several disciplines from prior milestones:

- **Lesson #10168 — counter-cadence cleanup-mission cadence (HIGH).** Pattern is operationally sustainable across long forward-cadence runs; canonical-sibling-rebuild family extends the parent v1.49.585 concerns-cleanup family.
- **Lesson #10401 — MISSION-PACKAGE-DISCIPLINE §3 (HIGH).** Applied to the per-mission sub-agent dispatch brief (title-line trip-vocab=0; body-secondary clean; framing positive throughout). obs#27+ cumulative.
- **Lesson #10406 candidate — POSITIVE-FRAMING-DISPATCH-DISCIPLINE (HIGH).** Brief uses positive framing for operationally-tense events; zero forbidden-token enumeration. obs#13+ cumulative.
- **Lesson #10407 candidate — DISPATCH-PROMPT-DENSITY-DISCIPLINE (HIGH).** Brief-as-required-read pattern carried through dispatch; mission-essentials abstracted from topic-event enumeration. obs#12+ cumulative.
- **Lesson #10408 candidate — NASA-canonical-sibling-rebuild pattern.** Per-mission sub-agent rebuild template sustained at obs#5 cumulative across the campaign run.
- **W3.5 chapter-gen bake-in (process gate).** Counter-cadence ship runs the same chapter pipeline as forward-cadence ships; obs#8+ cumulative since v1.49.709.

## What Worked

- **Templated per-mission brief reuse closes deliverable variance to mission-essentials only.** The brief structure (mission essentials + reference paths + 13-file deliverable table + authoring conventions + positive-framing discipline) is invariant across the campaign; only the mission-essentials block adapts per substrate-form-distinct class.
- **Single sub-agent dispatch held under the ~60-tool ceiling.** Dispatches consistently come in well under budget (typically 28-40 tool uses for a 13-file ~20-25K-word deliverable); splitting would have doubled orchestrator cost without operational benefit.
- **Positive-framing dispatch discipline carried the full deliverable set without filter trips.** Brief omits forbidden-token enumeration and frames operationally-tense events constructively; sub-agent inherits the framing through the entire content authoring run.
- **v1.56 gold-standard depth target hit the operational sweet spot.** Output band of ~19-25K words closes the structural gap without forcing maximum-historical-depth on first pass; deepening remains a future-pass option.
- **Reference-page paths parameterize cleanly per mission.** Immediate-predecessor (semantic context) + gold-standard (depth+structure reference) ingested by the sub-agent before authoring; pattern works across substrate-form-distinct missions.

## Decisions

**Lesson #10408 candidate now meets higher-bound promotion threshold at obs#5.** Five clean observations across substrate-form-distinct mission classes:
1. Shuttle-payload-deployment (v1.118)
2. Shuttle-Spacelab-microgravity-science (v1.119)
3. Shuttle-international-PS-multi-deploy (v1.120)
4. Shuttle-Spacelab-pallet-solar-science (v1.121)
5. Shuttle-multi-deploy-plus-satellite-rescue (v1.122)

Pattern fully validated. Promotion to ESTABLISHED at next ship (v1.49.721) is the natural next milestone-level action.

**SCAFFOLD-PENDING engine-state suppression as second brief-discipline pattern.** v1.122 introduces a discipline pattern for missions whose original ship had MUS/ELC/SPS/TRS engine-state in SCAFFOLD-PENDING status (not yet filled). The brief instructed sub-agent to not regenerate scaffold content; engine-state slots remain SCAFFOLD-PENDING for future operator-directed re-pass. organism.md + organism.html scoped to brief placeholder framing rather than full deep-dive.

## What Could Be Better

- **Brief-template substrate-form adaptation guidance is implicit.** Mission-essentials block is the only delta per release, but the campaign brief doesn't yet codify substrate-form-distinct adaptation cues; future briefs may benefit from explicit class-based prompts.
- **Lessons-carryover.json schema is per-mission; cross-mission consolidation lives in the tracker.** Each rebuild captures its own carryover but the campaign-wide rollup remains in mission-tracker.md rather than the structured schema.
- **Cadence projection assumes Lesson #10168 ~30-milestone reuse threshold holds.** Future counter-cadence ships may compress cadence if multiple operational-debt families demand simultaneous attention in the same window.

## Surprises

**Sub-agent honored organism.md SCAFFOLD-PENDING scope cleanly.** The brief asked for ~500-1000 word placeholder framing instead of the typical 2500-3500 word full paired-species deep-dive. Sub-agent followed without scope creep into other deliverables. Pattern validates: brief-author can scope per-deliverable depth based on engine-state availability.

**Tool-use stable at 30.** v1.118: 36; v1.119: 28; v1.120: 32; v1.121: 28; v1.122: 30. Five-observation band: 28-36, mean ~31, well-characterized.

## Lessons Learned

# 04 — Lessons Learned: v1.49.720 Forward Lessons
