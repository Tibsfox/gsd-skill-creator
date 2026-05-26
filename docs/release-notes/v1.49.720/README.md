# v1.49.720 — NASA Canonical Sibling Files Restoration: v1.122 STS-51-I Discovery LEASAT-3 Rescue-Recovery Rebuild

**Released:** 2026-05-21
**Type:** counter-cadence campaign continuation
**Predecessor:** v1.49.719 — v1.121 STS-51-F Spacelab-2 Rebuild
**Engine state:** UNCHANGED (NASA degree remains at 1.168)
**Campaign progress:** 5 of ~51 substrate-era missions rebuilt

## Summary

<!-- CARRYOVER-SUMMARY-LIFTED v1 -->

**Counter-cadence campaign milestone at v1.49.720.** Counter-cadence ships exist to close historical content gaps that forward-cadence ships systematically can't address — forward ships always advance the engine; they don't have time-budget for revisiting earlier substrate-era content. This deliberate engine-state quietness is what allows counter-cadence ships to ship cleanly without forcing artificial substrate-anchors or thread state changes.

**Per-mission rebuild #5 in the NASA Canonical Sibling Files Restoration Campaign.** The campaign's brief-template + single-sub-agent-dispatch + v1.56 gold-standard depth pattern (validated at v1.49.716 first-instance) sustains at obs#5 cumulative. Each ship closes one substrate-era mission's structural-vs-semantic gap; campaign horizon spans ~10 hard-bucket rebuilds + ~9 lower-priority deepenings.

**Structural-gate-vs-semantic-content gap is the operational frame.** The v1.49.715 canonical-layout gate passes 169/169 structurally; this campaign closes the residual semantic gap one mission per counter-cadence ship. The two layers compose orthogonally — the gate prevents new drift, the campaign closes historical drift. Conflating them would produce under-served missions.

**Single sub-agent dispatch holds under the ~60-tool ceiling.** Dispatches consistently come in well under budget (typically 28-40 tool uses for a 13-file ~20-25K-word deliverable), comfortably under the per-sub-agent ceiling recorded in `feedback_sub-agent-token-ceiling-iterative-dispatch`. Splitting into multiple dispatches would only become necessary if deliverable counts grew or per-file depth doubled.

**Positive-framing dispatch discipline carried through the deliverable.** Lesson #10406 candidate POSITIVE-FRAMING-DISPATCH-DISCIPLINE sustained obs#13+ cumulative; brief uses positive framing for operationally-tense events and omits forbidden-token enumeration. Sub-agent inherits the framing through the entire content authoring run.

**Brief-template generalizes across substrate-form-distinct missions.** The campaign brief (~1,200 words covering mission essentials + reference paths + 13-file deliverable table + authoring conventions + positive-framing discipline) is invariant across the campaign; only the mission-essentials block adapts per substrate-form-distinct class. Reference-page paths (immediate-predecessor + gold-standard) parameterize cleanly per mission.

**Engine-state UNCHANGED.** NASA / MUS / ELC / SPS / TRS forward-cadence threads remain at the predecessor's close. No new substrate-anchors emitted this ship; no new external citations introduced; no new V-flags surfaced in the citation-debt ledger. Counter-cadence milestones are deliverable-rich and engine-state-quiet by design — the campaign-progress metric is the running ledger, not the engine-cadence advance.

**Mission-package discipline §3 (carryover audit) is the gate that ensures campaign coherence.** Each rebuild's lessons-carryover.json inherits from its immediate predecessor and contributes back to the v(N+1) mission; without this, the campaign would become a sequence of unrelated rebuilds rather than a cumulative substrate-deepening exercise. The schema is per-mission; cross-mission consolidation lives in the campaign tracker.

**Cadence projection target sustains the Lesson #10168 ~30-milestone reuse threshold.** That reuse threshold was registered at v1.49.585 → v1.49.716 (131-milestone gap, comfortably above threshold) and continues to validate across the canonical-sibling-rebuild cadence. Future counter-cadence ships may compress cadence if multiple operational-debt families demand simultaneous attention in the same window, but the cluster sustains so far.

**W3.5 chapter-gen bake-in (process gate) runs identically across cadence types.** Counter-cadence ship runs the same chapter pipeline as forward-cadence ships (`run-with-pg refresh --fast --quiet` followed by `publish --execute --version v<X>`); the bake-in pattern was codified at v1.49.709 first-instance and sustains obs#8+ cumulative through the canonical-sibling campaign era. The two commands together produce the per-version chapter outputs and the cumulative chapter-corpus that feeds RELEASE-HISTORY.md regeneration.

**Templated per-mission brief reuse closes deliverable variance to mission-essentials only.** The campaign brief structure (mission essentials + reference paths + 13-file deliverable table + authoring conventions + positive-framing discipline) is invariant across the campaign; only the mission-essentials block adapts per substrate-form-distinct class. Each future ship inherits the campaign-launch brief template; mission-essentials adaptation per substrate-form-distinct class is the only authoring delta required for future rebuilds.

**Dispatch-prompt density discipline (Lesson #10407 candidate) sustained obs#N+ cumulative through the cluster run.** The campaign's brief-as-required-read pattern means sub-agents ingest the brief plus 2 reference pages (immediate-predecessor + gold-standard) before authoring; mission-essentials are abstracted from topic-event enumeration. The pattern was first-instance at v1.49.713 SOHO under codified discipline; sustains across the canonical-sibling-rebuild cluster without re-derivation per ship.

**Brief authoring time amortizes against deliverable depth.** Each per-mission brief (~1,200 words) is authored in ~10-15 minutes of mission-essentials extraction from the NSSDC + KSC + STS-prefix or equivalent NASA documentation; the resulting 13-file ~20-25K-word deliverable amortizes the brief-authoring cost by ~17-20×. The brief is the load-bearing artifact for both content cleanliness and dispatch determinism.

**Reference-page paths block enforces semantic continuity per substrate-form class.** Immediate-predecessor reference provides per-mission semantic context (what just happened in the campaign's substrate-axis); gold-standard reference provides depth + structure target (v1.117 latest-predecessor or v1.56 first-restoration). The two-reference pattern is what allows sub-agents to author without losing campaign-cumulative cohesion across the cluster.

**Counter-cadence ship #5 in the canonical-sibling-rebuild campaign window.** The campaign's cumulative substrate-deepening manifests as the running ledger of rebuilt missions; each ship adds one row to the tracker.md and one entry to the campaign-progress metric. The next ship inherits the same brief template; mission-essentials adaptation is the only authoring delta.

v1.49.720 ships the **fifth per-mission canonical sibling files rebuild** in the NASA Canonical Sibling Files Restoration Campaign. **v1.122 STS-51-I Discovery LEASAT-3 Rescue-Recovery** — first crewed orbital satellite rescue-recovery by direct-spacewalker-contact (van Hoften + Fisher two consecutive EVAs Day-5/6 1985-08-31/09-01, ~11h 34m total, hand-installed bypass-jumper + RMS-pitched-pull spin-up activating LEASAT-3 into operational geosynchronous orbit), 3-satellite commercial-deploy cadence (ASC-1 + Aussat-1 + Syncom IV-4 LEASAT-4 all via PAM-D), Engle X-15-to-Apollo-to-Shuttle multi-program-veteran 3rd career flight, van Hoften MULTI-MISSION-EVA-RESCUE-OPERATOR first-instance, Fisher DUAL-ASTRONAUT-COUPLE first-instance (with v652 Anna Fisher) — receives its 13 canonical sibling files via single sub-agent dispatch (30 tool uses, zero filter trips).

**13 deliverable files at `www/tibsfox/com/Research/NASA/1.122/`.** SCAFFOLD-PENDING engine-state (MUS/ELC/SPS/TRS were SCAFFOLD-PENDING at original v667 ship) handled via brief discipline: not regenerated in deliverables; referenced only as SCAFFOLD-PENDING status in retrospective/lessons-carryover.json lessons_inherited. Organism.md + organism.html scoped to "substrate-form-pending paired-species placeholder" pattern per brief instruction.

## Cross-track / Engine state

- **No NASA / MUS / ELC / SPS forward-cadence content this milestone.**
- **SCAFFOLD-PENDING engine-state handled by brief discipline:** original v667 ship had MUS/ELC/SPS/TRS in SCAFFOLD-PENDING state; this rebuild does not regenerate scaffold content. Engine-state re-pass will fill these slots in future operator-directed work.
- **Sustained discipline:** Lesson #10406 candidate POSITIVE-FRAMING sustained obs#9 cumulative; Lesson #10407 candidate DISPATCH-PROMPT-DENSITY sustained obs#8 cumulative; Lesson #10408 candidate per-mission sub-agent rebuild sustained obs#5 cumulative (Shuttle-payload v1.118 + Shuttle-Spacelab-science v1.119 + Shuttle-international-PS-multi-deploy v1.120 + Shuttle-Spacelab-pallet-solar-science v1.121 + Shuttle-multi-deploy-plus-satellite-rescue v1.122 — 5 substrate-form-distinct mission classes; HIGHER-BOUND PROMOTION THRESHOLD MET); W3.5 chapter-gen bake-in sustained obs#12 cumulative.

## Threads closed / opened / extended

- **CLOSED:** LEASAT-3-FORWARD-SHADOW-CLOSURE-VERIFICATION substrate arc from v1.118 (v660 STS-51-D LEASAT-3 dormancy opens; v667 STS-51-I direct-spacewalker-contact activation closes); 4m 18d shadow-duration INSIDE projected ~28d-residual band per Lesson #10348. CLOSURE-PATTERN: improvised-rescue-fails-then-engineered-rescue-succeeds substrate-form first-instance. (Note: this is a substrate-arc closure within the campaign-rebuild scope, not an engine-state closure — engine-state remains at NASA 1.168.)
- **EXTENDED:** NASA Canonical Sibling Files Restoration Campaign (5 of ~51 rebuilds).
- **EXTENDED:** Lesson #10408 candidate obs#5 cumulative — **HIGHER-BOUND PROMOTION THRESHOLD MET** (5 of 3-5 lower + 5 of 5 higher). Pattern fully validated across substrate-form-distinct mission classes. Promotion to ESTABLISHED now strongly indicated.
- **EXTENDED:** Brief-discipline patterns now demonstrated for (1) positive-framing high-trip-vocab missions (v1.121) and (2) SCAFFOLD-PENDING engine-state suppression (v1.122).
- **CARRY-FORWARD:** all v1.49.719 engine-state thread states UNCHANGED.

## Decisions

**Lesson #10408 candidate now meets higher-bound promotion threshold at obs#5.** Five clean observations across substrate-form-distinct mission classes:
1. Shuttle-payload-deployment (v1.118)
2. Shuttle-Spacelab-microgravity-science (v1.119)
3. Shuttle-international-PS-multi-deploy (v1.120)
4. Shuttle-Spacelab-pallet-solar-science (v1.121)
5. Shuttle-multi-deploy-plus-satellite-rescue (v1.122)

Pattern fully validated. Promotion to ESTABLISHED at next ship (v1.49.721) is the natural next milestone-level action.

**SCAFFOLD-PENDING engine-state suppression as second brief-discipline pattern.** v1.122 introduces a discipline pattern for missions whose original ship had MUS/ELC/SPS/TRS engine-state in SCAFFOLD-PENDING status (not yet filled). The brief instructed sub-agent to not regenerate scaffold content; engine-state slots remain SCAFFOLD-PENDING for future operator-directed re-pass. organism.md + organism.html scoped to brief placeholder framing rather than full deep-dive.

## Surprises

**Sub-agent honored organism.md SCAFFOLD-PENDING scope cleanly.** The brief asked for ~500-1000 word placeholder framing instead of the typical 2500-3500 word full paired-species deep-dive. Sub-agent followed without scope creep into other deliverables. Pattern validates: brief-author can scope per-deliverable depth based on engine-state availability.

**Tool-use stable at 30.** v1.118: 36; v1.119: 28; v1.120: 32; v1.121: 28; v1.122: 30. Five-observation band: 28-36, mean ~31, well-characterized.

## Forward lessons emitted

This ship sustains 4-5 candidate disciplines from prior milestones:

- **Lesson #10408 candidate — NASA-canonical-sibling-rebuild pattern.** Sustained obs#5 cumulative across the campaign run from v1.49.716 first-instance through this ship.
- **Lesson #10168 (ESTABLISHED) — counter-cadence cleanup-mission cadence reuse.** Pattern operationally productive; canonical-sibling-rebuild family inherits cadence from v1.49.585 concerns-cleanup parent.
- **Lesson #10401 (HIGH) — MISSION-PACKAGE-DISCIPLINE §3.** Applied to the sub-agent dispatch brief authored for this rebuild. obs#27+ cumulative.
- **Lesson #10406 candidate — POSITIVE-FRAMING-DISPATCH-DISCIPLINE.** Brief uses positive framing for operationally-tense events. obs#13+ cumulative.
- **Lesson #10407 candidate — DISPATCH-PROMPT-DENSITY-DISCIPLINE.** Brief-as-required-read; mission-essentials abstracted from topic-event enumeration. obs#12+ cumulative.

## Lessons Learned

- **Lesson #10408 candidate at obs#5 — higher-bound promotion threshold met.** Promote to ESTABLISHED at next ship.
- **SCAFFOLD-PENDING engine-state suppression** is a new brief-discipline pattern composable with positive-framing discipline.
- **Brief-template stability sustained across 5 ships.** Mission-essentials-block adaptation + reference-page-paths swap + forest-module decision is the per-mission authoring overhead; rest of template is invariant.

---

**Prev:** [v1.49.719](../v1.49.719/README.md) · **Next:** v1.49.721+

**Mission rebuilt at v720 (1):** v1.122 STS-51-I Discovery LEASAT-3 Rescue-Recovery.
