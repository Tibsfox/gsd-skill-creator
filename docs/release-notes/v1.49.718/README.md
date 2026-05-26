# v1.49.718 — NASA Canonical Sibling Files Restoration: v1.120 STS-51-G Discovery Rebuild

**Released:** 2026-05-21
**Type:** counter-cadence campaign continuation (NOT a NASA degree)
**Predecessor:** v1.49.717 — NASA Canonical Sibling Files Restoration: v1.119 STS-51-B Challenger Spacelab-3 Rebuild
**Mission package:** `.planning/missions/v1-49-716-nasa-layout-restoration-campaign/`
**Engine state:** UNCHANGED (NASA degree remains at 1.168)
**Campaign progress:** 3 of ~51 substrate-era missions rebuilt (v1.118 + v1.119 + v1.120)

## Summary

<!-- CARRYOVER-SUMMARY-LIFTED v1 -->

**Counter-cadence campaign milestone at v1.49.718.** Counter-cadence ships exist to close historical content gaps that forward-cadence ships systematically can't address — forward ships always advance the engine; they don't have time-budget for revisiting earlier substrate-era content. This deliberate engine-state quietness is what allows counter-cadence ships to ship cleanly without forcing artificial substrate-anchors or thread state changes.

**Per-mission rebuild #3 in the NASA Canonical Sibling Files Restoration Campaign.** The campaign's brief-template + single-sub-agent-dispatch + v1.56 gold-standard depth pattern (validated at v1.49.716 first-instance) sustains at obs#3 cumulative. Each ship closes one substrate-era mission's structural-vs-semantic gap; campaign horizon spans ~10 hard-bucket rebuilds + ~9 lower-priority deepenings.

**Structural-gate-vs-semantic-content gap is the operational frame.** The v1.49.715 canonical-layout gate passes 169/169 structurally; this campaign closes the residual semantic gap one mission per counter-cadence ship. The two layers compose orthogonally — the gate prevents new drift, the campaign closes historical drift. Conflating them would produce under-served missions.

**Single sub-agent dispatch holds under the ~60-tool ceiling.** Dispatches consistently come in well under budget (typically 28-40 tool uses for a 13-file ~20-25K-word deliverable), comfortably under the per-sub-agent ceiling recorded in `feedback_sub-agent-token-ceiling-iterative-dispatch`. Splitting into multiple dispatches would only become necessary if deliverable counts grew or per-file depth doubled.

**Positive-framing dispatch discipline carried through the deliverable.** Lesson #10406 candidate POSITIVE-FRAMING-DISPATCH-DISCIPLINE sustained obs#11+ cumulative; brief uses positive framing for operationally-tense events and omits forbidden-token enumeration. Sub-agent inherits the framing through the entire content authoring run.

**Brief-template generalizes across substrate-form-distinct missions.** The campaign brief (~1,200 words covering mission essentials + reference paths + 13-file deliverable table + authoring conventions + positive-framing discipline) is invariant across the campaign; only the mission-essentials block adapts per substrate-form-distinct class. Reference-page paths (immediate-predecessor + gold-standard) parameterize cleanly per mission.

**Engine-state UNCHANGED.** NASA / MUS / ELC / SPS / TRS forward-cadence threads remain at the predecessor's close. No new substrate-anchors emitted this ship; no new external citations introduced; no new V-flags surfaced in the citation-debt ledger. Counter-cadence milestones are deliverable-rich and engine-state-quiet by design — the campaign-progress metric is the running ledger, not the engine-cadence advance.

**Mission-package discipline §3 (carryover audit) is the gate that ensures campaign coherence.** Each rebuild's lessons-carryover.json inherits from its immediate predecessor and contributes back to the v(N+1) mission; without this, the campaign would become a sequence of unrelated rebuilds rather than a cumulative substrate-deepening exercise. The schema is per-mission; cross-mission consolidation lives in the campaign tracker.

**Cadence projection target sustains the Lesson #10168 ~30-milestone reuse threshold.** That reuse threshold was registered at v1.49.585 → v1.49.716 (131-milestone gap, comfortably above threshold) and continues to validate across the canonical-sibling-rebuild cadence. Future counter-cadence ships may compress cadence if multiple operational-debt families demand simultaneous attention in the same window, but the cluster sustains so far.

**W3.5 chapter-gen bake-in (process gate) runs identically across cadence types.** Counter-cadence ship runs the same chapter pipeline as forward-cadence ships (`run-with-pg refresh --fast --quiet` followed by `publish --execute --version v<X>`); the bake-in pattern was codified at v1.49.709 first-instance and sustains obs#8+ cumulative through the canonical-sibling campaign era. The two commands together produce the per-version chapter outputs and the cumulative chapter-corpus that feeds RELEASE-HISTORY.md regeneration.

**Templated per-mission brief reuse closes deliverable variance to mission-essentials only.** The campaign brief structure (mission essentials + reference paths + 13-file deliverable table + authoring conventions + positive-framing discipline) is invariant across the campaign; only the mission-essentials block adapts per substrate-form-distinct class. Each future ship inherits the campaign-launch brief template; mission-essentials adaptation per substrate-form-distinct class is the only authoring delta required for future rebuilds.

**Dispatch-prompt density discipline (Lesson #10407 candidate) sustained obs#N+ cumulative through the cluster run.** The campaign's brief-as-required-read pattern means sub-agents ingest the brief plus 2 reference pages (immediate-predecessor + gold-standard) before authoring; mission-essentials are abstracted from topic-event enumeration. The pattern was first-instance at v1.49.713 SOHO under codified discipline; sustains across the canonical-sibling-rebuild cluster without re-derivation per ship.

**Brief authoring time amortizes against deliverable depth.** Each per-mission brief (~1,200 words) is authored in ~10-15 minutes of mission-essentials extraction from the NSSDC + KSC + STS-prefix or equivalent NASA documentation; the resulting 13-file ~20-25K-word deliverable amortizes the brief-authoring cost by ~17-20×. The brief is the load-bearing artifact for both content cleanliness and dispatch determinism.

**Reference-page paths block enforces semantic continuity per substrate-form class.** Immediate-predecessor reference provides per-mission semantic context (what just happened in the campaign's substrate-axis); gold-standard reference provides depth + structure target (v1.117 latest-predecessor or v1.56 first-restoration). The two-reference pattern is what allows sub-agents to author without losing campaign-cumulative cohesion across the cluster.

**Counter-cadence ship #3 in the canonical-sibling-rebuild campaign window.** The campaign's cumulative substrate-deepening manifests as the running ledger of rebuilt missions; each ship adds one row to the tracker.md and one entry to the campaign-progress metric. The next ship inherits the same brief template; mission-essentials adaptation is the only authoring delta.

v1.49.718 ships the **third per-mission canonical sibling files rebuild** in the NASA Canonical Sibling Files Restoration Campaign. **v1.120 STS-51-G Discovery** — international-firsts mission featuring Al-Saud (first Arab + first royalty + first Muslim in space triple-first-instance), Baudry (first French on Shuttle), Brandenstein PILOT-RISES-TO-COMMANDER validation, Lucid 2nd-mother-in-space with 11-year Mir-22 forward-shadow, triple commercial-consortium satellite deploy (Morelos-1 + Arabsat-1B + Telstar-302), and Spartan-1 X-ray free-flyer deploy-and-recover first-instance — receives its 13 canonical sibling files via single sub-agent dispatch.

**13 deliverable files at `www/tibsfox/com/Research/NASA/1.120/`** (~376 KB total). Sub-agent completed in 32 tool uses with zero filter trips. Forest-module NOT_APPLICABLE.md pattern (commercial-satellite + X-ray-science + international-PS mission class lacks biological substrate, matching v1.118 pattern; distinct from v1.119 functional spacelab3-rodent module).

## Cross-track / Engine state

- **No NASA / MUS / ELC / SPS forward-cadence content this milestone.**
- **ELC cross-track explicitly NOT regenerated** — registered at original v662 ship; this rebuild references in `retrospective/lessons-carryover.json` lessons_inherited only. Brief instructed sub-agent to avoid enumerating ELC-1.120 specifics; discipline applied cleanly.
- **No new external citations.**
- **No new V-flags emitted.**
- **Sustained discipline:** Lesson #10401 §3 applied; Lesson #10406 candidate POSITIVE-FRAMING sustained obs#7 cumulative; Lesson #10407 candidate DISPATCH-PROMPT-DENSITY sustained obs#6 cumulative; Lesson #10408 candidate per-mission sub-agent rebuild sustained obs#3 cumulative (Shuttle-payload v1.118 + Shuttle-Spacelab-science v1.119 + Shuttle-international-PS-multi-deploy v1.120 = 3 substrate-form-distinct mission classes); W3.5 chapter-gen bake-in sustained obs#10 cumulative.

## Threads closed / opened / extended

- **EXTENDED:** NASA Canonical Sibling Files Restoration Campaign (3 of ~51 rebuilds complete).
- **EXTENDED:** Lesson #10408 candidate per-mission sub-agent rebuild pattern — obs#3 cumulative. Three substrate-form-distinct mission classes validated. Promotion-to-ESTABLISHED threshold (3-5 observations) now met at lower bound.
- **EXTENDED:** v1.120 STS-51-G Discovery mission directory from 3-file substrate-era state to 16-file canonical state.
- **CARRY-FORWARD:** all v1.49.717 engine-state thread states UNCHANGED.

## Decisions

**ELC-cross-track suppression in rebuild deliverables.** v1.120's ELC at the original v662 ship was a politically-charged contemporary event (mid-1985 diplomatic-substrate cross-track). The brief explicitly instructed the sub-agent to NOT generate new ELC narrative content in HTML or MD deliverables; the ELC entry is referenced only in `retrospective/lessons-carryover.json` lessons_inherited. Rationale: this is a sibling-files rebuild, not a re-ship; the original ELC framing at v662 stands authoritative. Brief discipline applied; sub-agent followed cleanly.

**Lesson #10408 candidate now eligible for promotion review.** Three clean observations across substrate-form-distinct mission classes (Shuttle-payload-deployment v1.118, Shuttle-Spacelab-microgravity-science v1.119, Shuttle-international-PS-multi-deploy-plus-free-flyer v1.120) meet the lower-bound promotion threshold of 3-5 observations. Promotion-to-ESTABLISHED is now possible; recommend two more substrate-form-distinct observations (e.g., v1.165 or v1.166 solar-observatory) before promotion to satisfy higher-bound rigor.

## Surprises

**Brief-discipline transfers cleanly to politically-sensitive cross-tracks.** The ELC-suppression instruction in the brief was a novel discipline-application; sub-agent followed it without ambiguity or scope creep. Pattern validates: brief-author judgment can shape rebuild-deliverable scope based on cross-track sensitivity without per-deliverable enumeration.

**Sub-agent tool-use count stabilizing.** v1.118: 36 tool uses. v1.119: 28. v1.120: 32. Three observations suggest the pattern converges around 30-35 tool uses per rebuild with v1.119 representing a low-water mark (had direct v1.118 template) and v1.118 representing high-water (had no in-campaign template).

## Forward lessons emitted

This ship sustains 4-5 candidate disciplines from prior milestones:

- **Lesson #10408 candidate — NASA-canonical-sibling-rebuild pattern.** Sustained obs#3 cumulative across the campaign run from v1.49.716 first-instance through this ship.
- **Lesson #10168 (ESTABLISHED) — counter-cadence cleanup-mission cadence reuse.** Pattern operationally productive; canonical-sibling-rebuild family inherits cadence from v1.49.585 concerns-cleanup parent.
- **Lesson #10401 (HIGH) — MISSION-PACKAGE-DISCIPLINE §3.** Applied to the sub-agent dispatch brief authored for this rebuild. obs#27+ cumulative.
- **Lesson #10406 candidate — POSITIVE-FRAMING-DISPATCH-DISCIPLINE.** Brief uses positive framing for operationally-tense events. obs#11+ cumulative.
- **Lesson #10407 candidate — DISPATCH-PROMPT-DENSITY-DISCIPLINE.** Brief-as-required-read; mission-essentials abstracted from topic-event enumeration. obs#10+ cumulative.

## Lessons Learned

- **Lesson #10408 candidate now at obs#3 cumulative.** Promotion-to-ESTABLISHED eligible at lower threshold; recommend 2 more observations before promotion.
- **Brief-discipline shapes deliverable scope.** ELC-suppression at v1.120 validates that brief-author can constrain rebuild scope without per-deliverable rules.
- **Tool-use count converges around 30-35.** Sub-agent budget for per-mission rebuild is now well-characterized.

---

**Prev:** [v1.49.717](../v1.49.717/README.md) · **Next:** v1.49.719+

**Mission rebuilt at v718 (1):** v1.120 STS-51-G Discovery.
