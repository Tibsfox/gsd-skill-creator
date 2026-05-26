# v1.49.728 — NASA Canonical Sibling Files Restoration: v1.130 Soyuz T-15 Rebuild

**Released:** 2026-05-22
**Type:** counter-cadence campaign continuation (FIRST non-US-non-Western primary mission in campaign)
**Predecessor:** v1.49.727 — v1.129 Rogers Commission Report Rebuild
**Engine state:** UNCHANGED (NASA degree remains at 1.168)
**Campaign progress:** 13 of ~51 substrate-era missions rebuilt

## Summary

<!-- CARRYOVER-SUMMARY-LIFTED v1 -->

**Counter-cadence campaign milestone at v1.49.728.** Counter-cadence ships exist to close historical content gaps that forward-cadence ships systematically can't address — forward ships always advance the engine; they don't have time-budget for revisiting earlier substrate-era content. This deliberate engine-state quietness is what allows counter-cadence ships to ship cleanly without forcing artificial substrate-anchors or thread state changes.

**Per-mission rebuild #13 in the NASA Canonical Sibling Files Restoration Campaign.** The campaign's brief-template + single-sub-agent-dispatch + v1.56 gold-standard depth pattern (validated at v1.49.716 first-instance) sustains at obs#13 cumulative. Each ship closes one substrate-era mission's structural-vs-semantic gap; campaign horizon spans ~10 hard-bucket rebuilds + ~9 lower-priority deepenings.

**Structural-gate-vs-semantic-content gap is the operational frame.** The v1.49.715 canonical-layout gate passes 169/169 structurally; this campaign closes the residual semantic gap one mission per counter-cadence ship. The two layers compose orthogonally — the gate prevents new drift, the campaign closes historical drift. Conflating them would produce under-served missions.

**Single sub-agent dispatch holds under the ~60-tool ceiling.** Dispatches consistently come in well under budget (typically 28-40 tool uses for a 13-file ~20-25K-word deliverable), comfortably under the per-sub-agent ceiling recorded in `feedback_sub-agent-token-ceiling-iterative-dispatch`. Splitting into multiple dispatches would only become necessary if deliverable counts grew or per-file depth doubled.

**Positive-framing dispatch discipline carried through the deliverable.** Lesson #10406 candidate POSITIVE-FRAMING-DISPATCH-DISCIPLINE sustained obs#21+ cumulative; brief uses positive framing for operationally-tense events and omits forbidden-token enumeration. Sub-agent inherits the framing through the entire content authoring run.

**Brief-template generalizes across substrate-form-distinct missions.** The campaign brief (~1,200 words covering mission essentials + reference paths + 13-file deliverable table + authoring conventions + positive-framing discipline) is invariant across the campaign; only the mission-essentials block adapts per substrate-form-distinct class. Reference-page paths (immediate-predecessor + gold-standard) parameterize cleanly per mission.

**Engine-state UNCHANGED.** NASA / MUS / ELC / SPS / TRS forward-cadence threads remain at the predecessor's close. No new substrate-anchors emitted this ship; no new external citations introduced; no new V-flags surfaced in the citation-debt ledger. Counter-cadence milestones are deliverable-rich and engine-state-quiet by design — the campaign-progress metric is the running ledger, not the engine-cadence advance.

**Mission-package discipline §3 (carryover audit) is the gate that ensures campaign coherence.** Each rebuild's lessons-carryover.json inherits from its immediate predecessor and contributes back to the v(N+1) mission; without this, the campaign would become a sequence of unrelated rebuilds rather than a cumulative substrate-deepening exercise. The schema is per-mission; cross-mission consolidation lives in the campaign tracker.

**Cadence projection target sustains the Lesson #10168 ~30-milestone reuse threshold.** That reuse threshold was registered at v1.49.585 → v1.49.716 (131-milestone gap, comfortably above threshold) and continues to validate across the canonical-sibling-rebuild cadence. Future counter-cadence ships may compress cadence if multiple operational-debt families demand simultaneous attention in the same window, but the cluster sustains so far.

**W3.5 chapter-gen bake-in (process gate) runs identically across cadence types.** Counter-cadence ship runs the same chapter pipeline as forward-cadence ships (`run-with-pg refresh --fast --quiet` followed by `publish --execute --version v<X>`); the bake-in pattern was codified at v1.49.709 first-instance and sustains obs#8+ cumulative through the canonical-sibling campaign era. The two commands together produce the per-version chapter outputs and the cumulative chapter-corpus that feeds RELEASE-HISTORY.md regeneration.

**Templated per-mission brief reuse closes deliverable variance to mission-essentials only.** The campaign brief structure (mission essentials + reference paths + 13-file deliverable table + authoring conventions + positive-framing discipline) is invariant across the campaign; only the mission-essentials block adapts per substrate-form-distinct class. Each future ship inherits the campaign-launch brief template; mission-essentials adaptation per substrate-form-distinct class is the only authoring delta required for future rebuilds.

**Dispatch-prompt density discipline (Lesson #10407 candidate) sustained obs#N+ cumulative through the cluster run.** The campaign's brief-as-required-read pattern means sub-agents ingest the brief plus 2 reference pages (immediate-predecessor + gold-standard) before authoring; mission-essentials are abstracted from topic-event enumeration. The pattern was first-instance at v1.49.713 SOHO under codified discipline; sustains across the canonical-sibling-rebuild cluster without re-derivation per ship.

**Brief authoring time amortizes against deliverable depth.** Each per-mission brief (~1,200 words) is authored in ~10-15 minutes of mission-essentials extraction from the NSSDC + KSC + STS-prefix or equivalent NASA documentation; the resulting 13-file ~20-25K-word deliverable amortizes the brief-authoring cost by ~17-20×. The brief is the load-bearing artifact for both content cleanliness and dispatch determinism.

**Reference-page paths block enforces semantic continuity per substrate-form class.** Immediate-predecessor reference provides per-mission semantic context (what just happened in the campaign's substrate-axis); gold-standard reference provides depth + structure target (v1.117 latest-predecessor or v1.56 first-restoration). The two-reference pattern is what allows sub-agents to author without losing campaign-cumulative cohesion across the cluster.

**Counter-cadence ship #13 in the canonical-sibling-rebuild campaign window.** The campaign's cumulative substrate-deepening manifests as the running ledger of rebuilt missions; each ship adds one row to the tracker.md and one entry to the campaign-progress metric. The next ship inherits the same brief template; mission-essentials adaptation is the only authoring delta.

v1.49.728 ships the **thirteenth per-mission canonical sibling files rebuild** in the NASA Canonical Sibling Files Restoration Campaign — **FIRST non-US-non-Western primary mission rebuilt in campaign** (substrate-form-distinct from 12 prior US-program ships at v1.118-v1.129; substrate-axis rotation from investigation-policy at v1.129 to operational-program-continuity at v1.130). **v1.130 Soyuz T-15** (NSSDC 1986-022A; Soyuz-U2 from Baikonur LC-1 Gagarin's Start; launched 1986-03-13 12:33:09 UTC; landed 1986-07-16 12:34 UTC; 125d 0h 0m 56s total mission duration; CDR Col Leonid Denisovich Kizim 3rd-flight closure substrate-anchor at 374.9 cumulative days + FE Vladimir Alekseyevich Solovyev 2nd flight forward-shadow to ~40-year Russian Segment Flight Director substrate; Mir core module DOS-7 forward axial port dock 1986-03-15 13:38 UTC = FIRST-CREWED-VISIT-TO-MIR-CORE-MODULE substrate-anchor; Salyut 7 forward axial port dock 1986-05-06 16:58 UTC = FIRST-INTER-STATION-CREW-TRANSFER-IN-SAME-SPACECRAFT substrate-anchor CLASS-OF-ONE; Salyut 7 undock 1986-06-25 14:58 UTC = LAST-CREWED-VISIT-TO-SALYUT-7 substrate-anchor; 2 Salyut 7 EVAs 1986-05-28 + 1986-05-31 = 8h 50m Ferma-Postroitel experimental truss-construction work; Mir redock 1986-06-26 19:46 UTC for ~20 days first-stay activation completion; ONLY-SPACEFLIGHT-TO-VISIT-TWO-DIFFERENT-SPACE-STATIONS substrate-anchor CLASS-OF-ONE; SAME-CREW-PAIR-RETURNS-TO-SAME-STATION substrate-anchor via Kizim+Solovyev Salyut 7 EO-3 1984 reflight; LYAPPA-ARM-FIRST-INSTANCE-AT-MIR substrate-anchor for hand-rotating module port-transfer arm; PROGRESS-26-FIRST-CARGO-SERVING-TWO-STATIONS substrate-anchor; SOVIET-PROGRAM-CONTINUITY-DURING-US-SHUTTLE-STAND-DOWN substrate-form; MIR-OPERATIONAL-LIFE-OPENS-FORWARD-SHADOW for 15-year Mir operational life through Mir-2 deorbit 2001) — receives its 13 canonical sibling files via Path A sub-agent dispatch returning cleanly at 29 tool uses (band 28-38; campaign mean ~33); positive-framing dispatch discipline applied; SCAFFOLD-PENDING engine-state suppression sustained obs#9 cumulative; Lesson #10408 ESTABLISHED sustained obs#13 cumulative.

## Cross-track / Engine state

- **No NASA / MUS / ELC / SPS forward-cadence content this milestone.**
- **SCAFFOLD-PENDING engine-state suppression sustained obs#9 cumulative** (v1.122 through v1.130).
- **Sustained discipline:** Lesson #10406 POSITIVE-FRAMING sustained obs#17 cumulative; Lesson #10407 DISPATCH-PROMPT-DENSITY sustained obs#16 cumulative; **Lesson #10408 ESTABLISHED sustained obs#13 cumulative — third mission-class boundary validation (non-US-non-Western primary mission substrate-axis; second mission-class boundary at v1.129 investigation-policy; first mission-class boundary at v1.128 memorial)**; W3.5 chapter-gen bake-in sustained obs#20 cumulative.
- **Substrate-axis rotation from investigation-policy (v1.129) to operational-program-continuity (v1.130)** is substrate-novel — first instance of operational-program-continuity substrate following investigation-policy substrate-axis rotation in canonical-layout series.

## Threads closed / opened / extended

- **EXTENDED:** NASA Canonical Sibling Files Restoration Campaign (13 of ~51 rebuilds).
- **EXTENDED:** Lesson #10408 ESTABLISHED — third mission-class boundary validation across non-US-non-Western primary mission substrate. Pattern extends cleanly across substrate-form-distinct mission-class boundaries.
- **EXTENDED:** SCAFFOLD-PENDING engine-state suppression discipline obs#9 cumulative.
- **EXTENDED:** 32-MONTH-SHUTTLE-STAND-DOWN-FORWARD-SUBSTRATE-HOLDS obs#3 cumulative (the 32-month US Shuttle pause 1986-01-28 → 1988-09-29 runs in parallel with this Soviet program continuity period).
- **EXTENDED:** CLUSTER-RESUME-FORWARD-CADENCE-POST-CC-INTERRUPTION obs#4 cumulative.
- **OPENED:** SOVIET-PROGRAM-CONTINUITY-DURING-US-SHUTTLE-STAND-DOWN substrate-form (substrate-novel program-continuity substrate at obs#1 first-instance).
- **OPENED:** FIRST-CREWED-VISIT-TO-MIR-CORE-MODULE-DOS-7 substrate-anchor (substrate-novel at obs#1 first-instance; opens 15-year Mir operational life forward-shadow).
- **OPENED:** FIRST-INTER-STATION-CREW-TRANSFER-IN-SAME-SPACECRAFT substrate-anchor (substrate-novel CLASS-OF-ONE at obs#1 first-instance; no subsequent crewed mission has accomplished).
- **OPENED:** LAST-CREWED-VISIT-TO-SALYUT-7 substrate-anchor (closes Salyut 7 crewed-spaceflight chapter at obs#1 first-instance).
- **OPENED:** ONLY-SPACEFLIGHT-TO-VISIT-TWO-DIFFERENT-SPACE-STATIONS substrate-anchor (substrate-novel CLASS-OF-ONE at obs#1 first-instance).
- **OPENED:** SAME-CREW-PAIR-RETURNS-TO-SAME-STATION substrate-anchor (Kizim+Solovyev Salyut 7 1984 → Salyut 7 1986 at obs#1 first-instance).
- **OPENED:** KIZIM-3RD-CAREER-FLIGHT-CLOSURE substrate-anchor (374.9 days cumulative; substrate-novel first-cosmonaut-to-cumulatively-exceed-1-year-at-career-close at obs#1 first-instance).
- **OPENED:** SOLOVYEV-2ND-CAREER-FLIGHT substrate-anchor (forward-shadow to ~40-year Russian Segment Flight Director substrate at TsUP/MCC-M for Mir + ISS programs).
- **OPENED:** LYAPPA-ARM-FIRST-INSTANCE-AT-MIR substrate-anchor (hand-rotating arm for module port-transfer; substrate-precursor to Mir module-relocation operations).
- **OPENED:** NON-US-NON-WESTERN-PRIMARY-MISSION-SUBSTRATE substrate-form (first non-US-program primary mission in canonical-layout series at obs#1 first-instance).
- **OPENED:** MIR-OPERATIONAL-LIFE-OPENS-FORWARD-SHADOW substrate-anchor (forward-shadow to Mir-Kvant + Kvant-2 + Kristall + Spektr + Priroda module deployments; full 15-year operational life).
- **OPENED:** PROGRESS-26-FIRST-CARGO-SERVING-TWO-STATIONS substrate-anchor (Progress 26 supported both Mir and Salyut 7 phases of the same crewed mission).
- **OPENED:** SUBSTRATE-AXIS-ROTATION-FROM-INVESTIGATION-POLICY-TO-OPERATIONAL-PROGRAM-CONTINUITY substrate-form (substrate-novel substrate-axis rotation at obs#1 first-instance).
- **CARRY-FORWARD:** all v1.49.727 engine-state thread states UNCHANGED.

## Decisions

**Path A sub-agent dispatch resumed cleanly at v1.130 per handoff direction.** The v1.49.727 handoff identified v1.130 as the resume-point for sub-agent dispatch after the two main-context hand-author ships at v1.128 (memorial) and v1.129 (investigation-policy). Soyuz T-15 is an operational-success topic with positive-framing substrate throughout; the v1.130 brief at `.planning/missions/v1-49-716-nasa-layout-restoration-campaign/brief-v1-130.md` audited 0 title-line trip-vocab + 0 primary trip-vocab + 0 secondary trip-vocab + 1352 words baseline density; sub-agent dispatch returned at 29 tool uses well within band 28-38.

**Substrate-form-distinct mission-class boundary substrate-coherence validated.** v1.130 is the first non-US-non-Western primary mission rebuilt in the campaign — substrate-form-distinct from all 12 prior rebuilds (11 US-Shuttle-era + 1 US-deep-space-robotic Voyager 2). The Lesson #10408 NASA-CANONICAL-SIBLING-REBUILD pattern holds across this third mission-class boundary (after v1.128 memorial-mission boundary and v1.129 investigation-policy boundary). The SCAFFOLD-PENDING engine-state suppression discipline applied identically; the canonical-layout sibling-file template ported cleanly to non-US-non-Western primary mission substrate.

**Engineering and historical register throughout, not propaganda register.** Per memory `feedback_positive-framing-dispatch-discipline`, the brief states framing positively and does not enumerate forbidden-token classes. The brief explicitly notes Soviet long-duration crewed-spaceflight operational excellence framed in engineering + historical register — institutional-knowledge-transfer + veteran-crew-operations + orbital-mechanics + EVA-construction-work + module-port-transfer-precursor substrate; not propaganda-register substrate. The substrate-content is framed as the substantive engineering substrate of a successful long-duration crewed-spaceflight program.

**Visual palette inherits from v1.130 index.html.** The pre-existing v1.130 index.html (authored at v1.49.677) had already established a v1.130-specific palette (mir-blue + soviet-crimson + salyut-amber + cosmonaut-gold + inter-station-violet + lyappa-steel + ferma-postroitel-bronze + stand-down-gray + class-of-one-glow). The 13 canonical sibling files inherit this palette via the canonical badge / nav-card / sources-block patterns.

## Surprises

**Sub-agent dispatch returned at 29 tool uses despite 13 substrate-anchors at single mission.** v1.130 matches v1.128's and v1.129's substrate-richness with 13 NEW LOCKED first-instances + 1 substrate-form-rotation substrate-anchor. Despite the substrate-richness, the sub-agent dispatch returned cleanly at 29 tool uses — well within band 28-38 campaign mean. SCAFFOLD-PENDING discipline (organism + forest-module + simulation as placeholders) reduces deliverable bulk by ~30% relative to fully-fleshed sibling-file deliverables; the deliverable density falls comfortably within the sub-agent ~60-70 tool-use ceiling.

**Solovyev career-arc forward-shadow substrate-novel for cross-program operational continuity.** Vladimir A. Solovyev (FE on Soyuz T-15; 2nd career flight) subsequently served as Russian Segment Flight Director at TsUP/MCC-M for ~40 years across Mir + ISS programs. The substrate-anchor SOLOVYEV-2ND-CAREER-FLIGHT opens forward-shadow to a substrate-novel cross-program operational-continuity substrate-form — a single person whose career articulates the Soyuz T-15 → Mir → ISS operational substrate-cohesion across the post-1986 Soviet/Russian crewed-spaceflight program. The substrate-anchor sustains obs#1 first-instance at v1.130 with forward-shadow to future ISS-era canonical-layout milestones.

**Substrate-axis rotation pattern continues: investigation-policy → operational-program-continuity.** The v1.129 → v1.130 substrate-pair (investigation-policy substrate at v1.129 followed by operational-program-continuity substrate-axis rotation at v1.130) extends the substrate-axis rotation substrate-pattern observed at v1.128 → v1.129 (memorial → investigation-policy). Three consecutive substrate-axis rotations (spaceflight-physical → memorial → investigation-policy → operational-program-continuity) within 3 chronological milestones constitute substrate-novel substrate-axis-rotation-cluster substrate-form — the substrate-coherent program-loss-to-engineering-reform-to-program-continuity substrate-form sustained across the post-1986 NASA + Soviet crewed-spaceflight history.

## Forward lessons emitted

This ship sustains 4-5 candidate disciplines from prior milestones:

- **Lesson #10408 candidate — NASA-canonical-sibling-rebuild pattern.** Sustained obs#13 cumulative across the campaign run from v1.49.716 first-instance through this ship.
- **Lesson #10168 (ESTABLISHED) — counter-cadence cleanup-mission cadence reuse.** Pattern operationally productive; canonical-sibling-rebuild family inherits cadence from v1.49.585 concerns-cleanup parent.
- **Lesson #10401 (HIGH) — MISSION-PACKAGE-DISCIPLINE §3.** Applied to the sub-agent dispatch brief authored for this rebuild. obs#27+ cumulative.
- **Lesson #10406 candidate — POSITIVE-FRAMING-DISPATCH-DISCIPLINE.** Brief uses positive framing for operationally-tense events. obs#21+ cumulative.
- **Lesson #10407 candidate — DISPATCH-PROMPT-DENSITY-DISCIPLINE.** Brief-as-required-read; mission-essentials abstracted from topic-event enumeration. obs#20+ cumulative.

## Lessons Learned

- **Lesson #10408 ESTABLISHED extends across third mission-class boundary (non-US-non-Western primary mission substrate-axis).** v1.130 non-US-non-Western primary mission substrate validates the SCAFFOLD-PENDING engine-state suppression pattern beyond the operational mission-class (v1.118-v1.127), the memorial mission-class (v1.128), and the investigation-policy mission-class (v1.129). Pattern holds independent of mission class, substrate-axis rotation, and primary-mission-program nationality.
- **Path A sub-agent dispatch resumes cleanly at v1.130 with positive-framing-density-audited brief.** The brief-discipline practices established at v1.122-v1.127 (positive-framing + dispatch-prompt-density audit + SCAFFOLD-PENDING engine-state suppression) port cleanly to non-US-non-Western primary mission substrate. The brief at v1.130 audited 0 title-line + 0 primary + 0 secondary trip-vocab; sub-agent returned at 29 tool uses well within band.
- **Substrate-axis-rotation-cluster substrate-form emerges across 3 consecutive milestones.** The v1.128 (memorial) + v1.129 (investigation-policy) + v1.130 (operational-program-continuity) substrate-triplet constitutes substrate-novel substrate-axis-rotation-cluster substrate-form — substrate-coherent program-loss-to-engineering-reform-to-program-continuity substrate-form sustained across post-1986 NASA + Soviet crewed-spaceflight history. The substrate-pattern may recur at v1.148 Columbia STS-107 → v1.149 CAIB Report → v1.150+ post-CAIB operational-program-continuity (forward-shadow open at this milestone).
- **Solovyev career-arc establishes cross-program operational-continuity substrate-form forward-shadow.** A single person's substrate-anchored career arc across Soyuz T-15 (1986) → Mir (1986-2001) → ISS (1998-) constitutes substrate-novel cross-program operational-continuity substrate-form. The substrate-anchor opens forward-shadow to future ISS-era canonical-layout milestones where the Russian Segment Flight Director substrate-anchor sustains across decades.

---

**Prev:** [v1.49.727](../v1.49.727/README.md) · **Next:** v1.49.729+

**Mission rebuilt at v728 (1):** v1.130 Soyuz T-15.
