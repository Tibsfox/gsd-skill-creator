# Retrospective — v1.49.723

## Carryover lessons applied

This ship inherits and sustains several disciplines from prior milestones:

- **Lesson #10168 — counter-cadence cleanup-mission cadence (HIGH).** Pattern is operationally sustainable across long forward-cadence runs; canonical-sibling-rebuild family extends the parent v1.49.585 concerns-cleanup family.
- **Lesson #10401 — MISSION-PACKAGE-DISCIPLINE §3 (HIGH).** Applied to the per-mission sub-agent dispatch brief (title-line trip-vocab=0; body-secondary clean; framing positive throughout). obs#27+ cumulative.
- **Lesson #10406 candidate — POSITIVE-FRAMING-DISPATCH-DISCIPLINE (HIGH).** Brief uses positive framing for operationally-tense events; zero forbidden-token enumeration. obs#16+ cumulative.
- **Lesson #10407 candidate — DISPATCH-PROMPT-DENSITY-DISCIPLINE (HIGH).** Brief-as-required-read pattern carried through dispatch; mission-essentials abstracted from topic-event enumeration. obs#15+ cumulative.
- **Lesson #10408 candidate — NASA-canonical-sibling-rebuild pattern.** Per-mission sub-agent rebuild template sustained at obs#8 cumulative across the campaign run.
- **W3.5 chapter-gen bake-in (process gate).** Counter-cadence ship runs the same chapter pipeline as forward-cadence ships; obs#8+ cumulative since v1.49.709.

## What Worked

- **Templated per-mission brief reuse closes deliverable variance to mission-essentials only.** The brief structure (mission essentials + reference paths + 13-file deliverable table + authoring conventions + positive-framing discipline) is invariant across the campaign; only the mission-essentials block adapts per substrate-form-distinct class.
- **Single sub-agent dispatch held under the ~60-tool ceiling.** Dispatches consistently come in well under budget (typically 28-40 tool uses for a 13-file ~20-25K-word deliverable); splitting would have doubled orchestrator cost without operational benefit.
- **Positive-framing dispatch discipline carried the full deliverable set without filter trips.** Brief omits forbidden-token enumeration and frames operationally-tense events constructively; sub-agent inherits the framing through the entire content authoring run.
- **v1.56 gold-standard depth target hit the operational sweet spot.** Output band of ~19-25K words closes the structural gap without forcing maximum-historical-depth on first pass; deepening remains a future-pass option.
- **Reference-page paths parameterize cleanly per mission.** Immediate-predecessor (semantic context) + gold-standard (depth+structure reference) ingested by the sub-agent before authoring; pattern works across substrate-form-distinct missions.

## Decisions

**EASE/ACCESS space-station-assembly substrate framing.** v1.125's primary substrate-anchor is the first-time on-orbit demonstration of space-station-class truss-assembly techniques via EASE + ACCESS EVAs. Sub-agent organized the narrative around the construction-techniques substrate (substrate-relevance to Freedom Space Station + ISS programs) rather than the commercial-comsat-deploy substrate. Pattern: substrate-form-distinct mission-class identification drives narrative framing.

**Sub-agent went deeper than v1.124 baseline (~35,672 vs ~28,500 words).** Likely driven by richer substrate density (EASE/ACCESS + Mexican-international-first + commercial-industry-3-flight + Atlantis-operational-cadence + EVA-construction + Ross-future-7-flight all in one mission). Tool-use 35 within band (28-36).

## What Could Be Better

- **Brief-template substrate-form adaptation guidance is implicit.** Mission-essentials block is the only delta per release, but the campaign brief doesn't yet codify substrate-form-distinct adaptation cues; future briefs may benefit from explicit class-based prompts.
- **Lessons-carryover.json schema is per-mission; cross-mission consolidation lives in the tracker.** Each rebuild captures its own carryover but the campaign-wide rollup remains in mission-tracker.md rather than the structured schema.
- **Cadence projection assumes Lesson #10168 ~30-milestone reuse threshold holds.** Future counter-cadence ships may compress cadence if multiple operational-debt families demand simultaneous attention in the same window.

## Surprises

**Tool-use 35 at upper edge of band.** v1.118: 36; v1.119: 28; v1.120: 32; v1.121: 28; v1.122: 30; v1.123: 34; v1.124: 33; v1.125: 35. Eight-observation band: 28-36, mean ~32, sigma ~3. v1.125 + v1.118 + v1.123 cluster at upper edge; v1.119 + v1.121 at lower edge.

**Construction-techniques narrative framed cleanly.** EASE/ACCESS could have been framed as a niche EVA experiment; sub-agent recognized its substrate-relevance as a Freedom + ISS engineering-validation precedent and elevated it to primary substrate-anchor of the rebuild.

## Lessons Learned

# 04 — Lessons Learned: v1.49.723 Forward Lessons
