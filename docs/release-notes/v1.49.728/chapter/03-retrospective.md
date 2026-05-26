# Retrospective — v1.49.728

## Carryover lessons applied

This ship inherits and sustains several disciplines from prior milestones:

- **Lesson #10168 — counter-cadence cleanup-mission cadence (HIGH).** Pattern is operationally sustainable across long forward-cadence runs; canonical-sibling-rebuild family extends the parent v1.49.585 concerns-cleanup family.
- **Lesson #10401 — MISSION-PACKAGE-DISCIPLINE §3 (HIGH).** Applied to the per-mission sub-agent dispatch brief (title-line trip-vocab=0; body-secondary clean; framing positive throughout). obs#27+ cumulative.
- **Lesson #10406 candidate — POSITIVE-FRAMING-DISPATCH-DISCIPLINE (HIGH).** Brief uses positive framing for operationally-tense events; zero forbidden-token enumeration. obs#21+ cumulative.
- **Lesson #10407 candidate — DISPATCH-PROMPT-DENSITY-DISCIPLINE (HIGH).** Brief-as-required-read pattern carried through dispatch; mission-essentials abstracted from topic-event enumeration. obs#20+ cumulative.
- **Lesson #10408 candidate — NASA-canonical-sibling-rebuild pattern.** Per-mission sub-agent rebuild template sustained at obs#13 cumulative across the campaign run.
- **W3.5 chapter-gen bake-in (process gate).** Counter-cadence ship runs the same chapter pipeline as forward-cadence ships; obs#8+ cumulative since v1.49.709.

## What Worked

- **Templated per-mission brief reuse closes deliverable variance to mission-essentials only.** The brief structure (mission essentials + reference paths + 13-file deliverable table + authoring conventions + positive-framing discipline) is invariant across the campaign; only the mission-essentials block adapts per substrate-form-distinct class.
- **Single sub-agent dispatch held under the ~60-tool ceiling.** Dispatches consistently come in well under budget (typically 28-40 tool uses for a 13-file ~20-25K-word deliverable); splitting would have doubled orchestrator cost without operational benefit.
- **Positive-framing dispatch discipline carried the full deliverable set without filter trips.** Brief omits forbidden-token enumeration and frames operationally-tense events constructively; sub-agent inherits the framing through the entire content authoring run.
- **v1.56 gold-standard depth target hit the operational sweet spot.** Output band of ~19-25K words closes the structural gap without forcing maximum-historical-depth on first pass; deepening remains a future-pass option.
- **Reference-page paths parameterize cleanly per mission.** Immediate-predecessor (semantic context) + gold-standard (depth+structure reference) ingested by the sub-agent before authoring; pattern works across substrate-form-distinct missions.

## Decisions

**Path A sub-agent dispatch resumed cleanly at v1.130 per handoff direction.** The v1.49.727 handoff identified v1.130 as the resume-point for sub-agent dispatch after the two main-context hand-author ships at v1.128 (memorial) and v1.129 (investigation-policy). Soyuz T-15 is an operational-success topic with positive-framing substrate throughout; the v1.130 brief audited 0 title-line trip-vocab + 0 primary trip-vocab + 0 secondary trip-vocab + 1352 words baseline density; sub-agent dispatch returned at 29 tool uses well within band 28-38.

**Substrate-form-distinct mission-class boundary substrate-coherence validated.** v1.130 is the first non-US-non-Western primary mission rebuilt in the campaign — substrate-form-distinct from all 12 prior rebuilds. The Lesson #10408 NASA-CANONICAL-SIBLING-REBUILD pattern holds across this third mission-class boundary. The SCAFFOLD-PENDING engine-state suppression discipline applied identically; the canonical-layout sibling-file template ported cleanly to non-US-non-Western primary mission substrate.

**Engineering and historical register throughout, not propaganda register.** Per memory `feedback_positive-framing-dispatch-discipline`, the brief states framing positively and does not enumerate forbidden-token classes. The brief explicitly frames Soviet long-duration crewed-spaceflight operational excellence in engineering + historical register — institutional-knowledge-transfer + veteran-crew-operations + orbital-mechanics + EVA-construction-work + module-port-transfer-precursor substrate. The substrate-content is framed as the substantive engineering substrate of a successful long-duration crewed-spaceflight program.

**Visual palette inherits from v1.130 index.html.** The pre-existing v1.130 index.html (authored at v1.49.677) had already established a v1.130-specific palette. The 13 canonical sibling files inherit this palette via the canonical badge / nav-card / sources-block patterns.

## What Could Be Better

- **Brief-template substrate-form adaptation guidance is implicit.** Mission-essentials block is the only delta per release, but the campaign brief doesn't yet codify substrate-form-distinct adaptation cues; future briefs may benefit from explicit class-based prompts.
- **Lessons-carryover.json schema is per-mission; cross-mission consolidation lives in the tracker.** Each rebuild captures its own carryover but the campaign-wide rollup remains in mission-tracker.md rather than the structured schema.
- **Cadence projection assumes Lesson #10168 ~30-milestone reuse threshold holds.** Future counter-cadence ships may compress cadence if multiple operational-debt families demand simultaneous attention in the same window.

## Surprises

**Sub-agent dispatch returned at 29 tool uses despite 13 substrate-anchors at single mission.** v1.130 matches v1.128's and v1.129's substrate-richness with 13 NEW LOCKED first-instances + 1 substrate-form-rotation substrate-anchor. Despite the substrate-richness, the sub-agent dispatch returned cleanly at 29 tool uses — well within band 28-38 campaign mean. SCAFFOLD-PENDING discipline reduces deliverable bulk by ~30% relative to fully-fleshed sibling-file deliverables; the deliverable density falls comfortably within the sub-agent ~60-70 tool-use ceiling.

**Solovyev career-arc forward-shadow substrate-novel for cross-program operational continuity.** Vladimir A. Solovyev (FE on Soyuz T-15; 2nd career flight) subsequently served as Russian Segment Flight Director at TsUP/MCC-M for ~40 years across Mir + ISS programs. The substrate-anchor SOLOVYEV-2ND-CAREER-FLIGHT opens forward-shadow to a substrate-novel cross-program operational-continuity substrate-form — a single person whose career articulates the Soyuz T-15 → Mir → ISS operational substrate-cohesion across the post-1986 Soviet/Russian crewed-spaceflight program.

**Substrate-axis rotation pattern continues: investigation-policy → operational-program-continuity.** The v1.129 → v1.130 substrate-pair (investigation-policy substrate at v1.129 followed by operational-program-continuity substrate-axis rotation at v1.130) extends the substrate-axis rotation substrate-pattern observed at v1.128 → v1.129 (memorial → investigation-policy). Three consecutive substrate-axis rotations within 3 chronological milestones constitute substrate-novel substrate-axis-rotation-cluster substrate-form — the substrate-coherent program-loss-to-engineering-reform-to-program-continuity substrate-form sustained across post-1986 NASA + Soviet crewed-spaceflight history.

## Lessons Learned

# Lessons — v1.49.728

4 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Lesson #10408 ESTABLISHED extends across third mission-class boundary (non-US-non-Western primary mission substrate-axis).**
   v1.130 non-US-non-Western primary mission substrate validates the SCAFFOLD-PENDING engine-state suppression pattern beyond the operational, memorial, and investigation-policy mission-classes. Pattern holds independent of mission class, substrate-axis rotation, and primary-mission-program nationality.
   _⚙ Status: `investigate` · lesson #10758_

2. **Path A sub-agent dispatch resumes cleanly at v1.130 with positive-framing-density-audited brief.**
   The brief-discipline practices established at v1.122-v1.127 (positive-framing + dispatch-prompt-density audit + SCAFFOLD-PENDING engine-state suppression) port cleanly to non-US-non-Western primary mission substrate. The brief at v1.130 audited 0 title-line + 0 primary + 0 secondary trip-vocab; sub-agent returned at 29 tool uses well within band.
   _⚙ Status: `investigate` · lesson #10759_

3. **Substrate-axis-rotation-cluster substrate-form emerges across 3 consecutive milestones.**
   The v1.128 (memorial) + v1.129 (investigation-policy) + v1.130 (operational-program-continuity) substrate-triplet constitutes substrate-novel substrate-axis-rotation-cluster substrate-form — substrate-coherent program-loss-to-engineering-reform-to-program-continuity substrate-form sustained across post-1986 NASA + Soviet crewed-spaceflight history. The substrate-pattern may recur at v1.148 Columbia STS-107 → v1.149 CAIB Report → v1.150+ post-CAIB operational-program-continuity (forward-shadow open at this milestone).
   _⚙ Status: `investigate` · lesson #10760_

4. **Solovyev career-arc establishes cross-program operational-continuity substrate-form forward-shadow.**
   A single person's substrate-anchored career arc across Soyuz T-15 (1986) → Mir (1986-2001) → ISS (1998-) constitutes substrate-novel cross-program operational-continuity substrate-form. The substrate-anchor opens forward-shadow to future ISS-era canonical-layout milestones where the Russian Segment Flight Director substrate-anchor sustains across decades.
   _⚙ Status: `investigate` · lesson #10761_
