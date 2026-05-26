# Retrospective — v1.49.718

## Carryover lessons applied

This ship inherits and sustains several disciplines from prior milestones:

- **Lesson #10168 — counter-cadence cleanup-mission cadence (HIGH).** Pattern is operationally sustainable across long forward-cadence runs; canonical-sibling-rebuild family extends the parent v1.49.585 concerns-cleanup family.
- **Lesson #10401 — MISSION-PACKAGE-DISCIPLINE §3 (HIGH).** Applied to the per-mission sub-agent dispatch brief (title-line trip-vocab=0; body-secondary clean; framing positive throughout). obs#27+ cumulative.
- **Lesson #10406 candidate — POSITIVE-FRAMING-DISPATCH-DISCIPLINE (HIGH).** Brief uses positive framing for operationally-tense events; zero forbidden-token enumeration. obs#11+ cumulative.
- **Lesson #10407 candidate — DISPATCH-PROMPT-DENSITY-DISCIPLINE (HIGH).** Brief-as-required-read pattern carried through dispatch; mission-essentials abstracted from topic-event enumeration. obs#10+ cumulative.
- **Lesson #10408 candidate — NASA-canonical-sibling-rebuild pattern.** Per-mission sub-agent rebuild template sustained at obs#3 cumulative across the campaign run.
- **W3.5 chapter-gen bake-in (process gate).** Counter-cadence ship runs the same chapter pipeline as forward-cadence ships; obs#8+ cumulative since v1.49.709.

## What Worked

- **Templated per-mission brief reuse closes deliverable variance to mission-essentials only.** The brief structure (mission essentials + reference paths + 13-file deliverable table + authoring conventions + positive-framing discipline) is invariant across the campaign; only the mission-essentials block adapts per substrate-form-distinct class.
- **Single sub-agent dispatch held under the ~60-tool ceiling.** Dispatches consistently come in well under budget (typically 28-40 tool uses for a 13-file ~20-25K-word deliverable); splitting would have doubled orchestrator cost without operational benefit.
- **Positive-framing dispatch discipline carried the full deliverable set without filter trips.** Brief omits forbidden-token enumeration and frames operationally-tense events constructively; sub-agent inherits the framing through the entire content authoring run.
- **v1.56 gold-standard depth target hit the operational sweet spot.** Output band of ~19-25K words closes the structural gap without forcing maximum-historical-depth on first pass; deepening remains a future-pass option.
- **Reference-page paths parameterize cleanly per mission.** Immediate-predecessor (semantic context) + gold-standard (depth+structure reference) ingested by the sub-agent before authoring; pattern works across substrate-form-distinct missions.

## Decisions

**ELC-cross-track suppression in rebuild deliverables.** v1.120's ELC at the original v662 ship was a politically-charged contemporary event (mid-1985 diplomatic-substrate cross-track). The brief explicitly instructed the sub-agent to NOT generate new ELC narrative content in HTML or MD deliverables; the ELC entry is referenced only in `retrospective/lessons-carryover.json` lessons_inherited. Rationale: this is a sibling-files rebuild, not a re-ship; the original ELC framing at v662 stands authoritative. Brief discipline applied; sub-agent followed cleanly.

**Lesson #10408 candidate now eligible for promotion review.** Three clean observations across substrate-form-distinct mission classes (Shuttle-payload-deployment v1.118, Shuttle-Spacelab-microgravity-science v1.119, Shuttle-international-PS-multi-deploy-plus-free-flyer v1.120) meet the lower-bound promotion threshold of 3-5 observations. Promotion-to-ESTABLISHED is now possible; recommend two more substrate-form-distinct observations (e.g., v1.165 or v1.166 solar-observatory) before promotion to satisfy higher-bound rigor.

## What Could Be Better

- **Brief-template substrate-form adaptation guidance is implicit.** Mission-essentials block is the only delta per release, but the campaign brief doesn't yet codify substrate-form-distinct adaptation cues; future briefs may benefit from explicit class-based prompts.
- **Lessons-carryover.json schema is per-mission; cross-mission consolidation lives in the tracker.** Each rebuild captures its own carryover but the campaign-wide rollup remains in mission-tracker.md rather than the structured schema.
- **Cadence projection assumes Lesson #10168 ~30-milestone reuse threshold holds.** Future counter-cadence ships may compress cadence if multiple operational-debt families demand simultaneous attention in the same window.

## Surprises

**Brief-discipline transfers cleanly to politically-sensitive cross-tracks.** The ELC-suppression instruction in the brief was a novel discipline-application; sub-agent followed it without ambiguity or scope creep. Pattern validates: brief-author judgment can shape rebuild-deliverable scope based on cross-track sensitivity without per-deliverable enumeration.

**Sub-agent tool-use count stabilizing.** v1.118: 36 tool uses. v1.119: 28. v1.120: 32. Three observations suggest the pattern converges around 30-35 tool uses per rebuild with v1.119 representing a low-water mark (had direct v1.118 template) and v1.118 representing high-water (had no in-campaign template).

## Lessons Learned

# 04 — Lessons Learned: v1.49.718 Forward Lessons
