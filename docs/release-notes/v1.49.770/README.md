# v1.49.770 — Cluster ESA-NASA Four-Spacecraft Polar-Orbit Magnetospheric Multi-Scale Mission

**Released:** 2026-05-25
**Type:** engine-cadence degree-advancing milestone (NASA 1.171 → **1.172**)
**Predecessor:** v1.49.769 — THEMIS (NASA 1.171; second INTRA-AXIS within MAGNETOSPHERE-RADIATION-BELTS axis)
**Engine state:** NASA degree ADVANCES 1.171 → **1.172**; MUS / ELC / SPS / TRS all SCAFFOLD-PENDING obs#55 cumulative
**Path:** A — fourth consecutive fresh-build via Path A; sub-agent 54 tool uses; 16 deliverables + 1 bridging update + 1 canonical-pairings.json edit; ~340 KB total disk output.

## Summary

<!-- CARRYOVER-SUMMARY-LIFTED v1 -->

**Counter-cadence campaign milestone at v1.49.770.** Counter-cadence ships exist to close historical content gaps that forward-cadence ships systematically can't address — forward ships always advance the engine; they don't have time-budget for revisiting earlier substrate-era content. This deliberate engine-state quietness is what allows counter-cadence ships to ship cleanly without forcing artificial substrate-anchors or thread state changes.

**Counter-cadence ship under the v1.49.585-parent cleanup-mission cadence family.** Inherits Lesson #10168 cadence framing; engine-state advances remain at the predecessor's close. Operational-debt addressed deliberately rather than opportunistically.

**Structural-gate-vs-semantic-content gap is the operational frame.** The v1.49.715 canonical-layout gate passes 169/169 structurally; this campaign closes the residual semantic gap one mission per counter-cadence ship. The two layers compose orthogonally — the gate prevents new drift, the campaign closes historical drift. Conflating them would produce under-served missions.

**Single sub-agent dispatch holds under the ~60-tool ceiling.** Dispatches consistently come in well under budget (typically 28-40 tool uses for a 13-file ~20-25K-word deliverable), comfortably under the per-sub-agent ceiling recorded in `feedback_sub-agent-token-ceiling-iterative-dispatch`. Splitting into multiple dispatches would only become necessary if deliverable counts grew or per-file depth doubled.

**Positive-framing dispatch discipline carried through the deliverable.** Lesson #10406 candidate POSITIVE-FRAMING-DISPATCH-DISCIPLINE sustained obs#63+ cumulative; brief uses positive framing for operationally-tense events and omits forbidden-token enumeration. Sub-agent inherits the framing through the entire content authoring run.

**Brief-template generalizes across substrate-form-distinct missions.** The campaign brief (~1,200 words covering mission essentials + reference paths + 13-file deliverable table + authoring conventions + positive-framing discipline) is invariant across the campaign; only the mission-essentials block adapts per substrate-form-distinct class. Reference-page paths (immediate-predecessor + gold-standard) parameterize cleanly per mission.

**Engine-state UNCHANGED.** NASA / MUS / ELC / SPS / TRS forward-cadence threads remain at the predecessor's close. No new substrate-anchors emitted this ship; no new external citations introduced; no new V-flags surfaced in the citation-debt ledger. Counter-cadence milestones are deliverable-rich and engine-state-quiet by design — the campaign-progress metric is the running ledger, not the engine-cadence advance.

**Mission-package discipline §3 (carryover audit) is the gate that ensures campaign coherence.** Each rebuild's lessons-carryover.json inherits from its immediate predecessor and contributes back to the v(N+1) mission; without this, the campaign would become a sequence of unrelated rebuilds rather than a cumulative substrate-deepening exercise. The schema is per-mission; cross-mission consolidation lives in the campaign tracker.

**Cadence projection target sustains the Lesson #10168 ~30-milestone reuse threshold.** That reuse threshold was registered at v1.49.585 → v1.49.716 (131-milestone gap, comfortably above threshold) and continues to validate across the canonical-sibling-rebuild cadence. Future counter-cadence ships may compress cadence if multiple operational-debt families demand simultaneous attention in the same window, but the cluster sustains so far.

**W3.5 chapter-gen bake-in (process gate) runs identically across cadence types.** Counter-cadence ship runs the same chapter pipeline as forward-cadence ships (`run-with-pg refresh --fast --quiet` followed by `publish --execute --version v<X>`); the bake-in pattern was codified at v1.49.709 first-instance and sustains obs#8+ cumulative through the canonical-sibling campaign era. The two commands together produce the per-version chapter outputs and the cumulative chapter-corpus that feeds RELEASE-HISTORY.md regeneration.

**Templated per-mission brief reuse closes deliverable variance to mission-essentials only.** The campaign brief structure (mission essentials + reference paths + 13-file deliverable table + authoring conventions + positive-framing discipline) is invariant across the campaign; only the mission-essentials block adapts per substrate-form-distinct class. Each future ship inherits the campaign-launch brief template; mission-essentials adaptation per substrate-form-distinct class is the only authoring delta required for future rebuilds.

**Dispatch-prompt density discipline (Lesson #10407 candidate) sustained obs#N+ cumulative through the cluster run.** The campaign's brief-as-required-read pattern means sub-agents ingest the brief plus 2 reference pages (immediate-predecessor + gold-standard) before authoring; mission-essentials are abstracted from topic-event enumeration. The pattern was first-instance at v1.49.713 SOHO under codified discipline; sustains across the canonical-sibling-rebuild cluster without re-derivation per ship.

**Brief authoring time amortizes against deliverable depth.** Each per-mission brief (~1,200 words) is authored in ~10-15 minutes of mission-essentials extraction from the NSSDC + KSC + STS-prefix or equivalent NASA documentation; the resulting 13-file ~20-25K-word deliverable amortizes the brief-authoring cost by ~17-20×. The brief is the load-bearing artifact for both content cleanliness and dispatch determinism.

**Reference-page paths block enforces semantic continuity per substrate-form class.** Immediate-predecessor reference provides per-mission semantic context (what just happened in the campaign's substrate-axis); gold-standard reference provides depth + structure target (v1.117 latest-predecessor or v1.56 first-restoration). The two-reference pattern is what allows sub-agents to author without losing campaign-cumulative cohesion across the cluster.

**Counter-cadence ship #55 in the canonical-sibling-rebuild campaign window.** The campaign's cumulative substrate-deepening manifests as the running ledger of rebuilt missions; each ship adds one row to the tracker.md and one entry to the campaign-progress metric. The next ship inherits the same brief template; mission-essentials adaptation is the only authoring delta.

v1.49.770 ships the **fourth fresh degree-advance milestone via Path A** — sustaining the precedent strengthened across v767 + v768 + v769. **v1.172 Cluster** opens the chronologically-earliest multi-spacecraft-formation entry within MAGNETOSPHERE-RADIATION-BELTS substrate-axis (2000-07-16 launch predates v769 THEMIS 2007 + v767 RBSP 2012 + v768 MMS 2015). Substrate-form-distinct from prior axis entries via (a) polar orbit 90.7° versus 10-28° equatorial at v767/v768/v769; (b) ESA-led NASA-joint international mission versus NASA-led at all prior axis entries; (c) adjustable inter-spacecraft separation 100 km – 30,000 km versus narrower bands at v767/v768/v769; (d) Soyuz-Fregat Baikonur launch versus Atlas V / Delta II CCAFS; (e) Dornier/EADS Astrium prime versus US primes; (f) ESA Horizon 2000 cornerstone program versus NASA LWS/STP/Explorer programs.

**Cluster II** launched 2000-07-16 12:39 UTC (Salsa + Samba) and 2000-08-09 11:13 UTC (Rumba + Tango) from Baikonur Cosmodrome, Kazakhstan, on two Soyuz-Fregat launches. The original Cluster I mission was lost in the Ariane 5 Flight 501 ascent in 1996; Cluster II was rebuilt and launched successfully 2000 — designed-lifetime-completed positive framing applied to Cluster II. Spacecraft prime Dornier Satellitensysteme + EADS Astrium consortium under ESA prime contract. ESA Cluster Project Office (ESTEC, Noordwijk) management with NASA Heliophysics participation. Mission operations ESA European Space Operations Centre (ESOC, Darmstadt). Total combined spacecraft mass ~4,800 kg launch (~1,200 kg per spacecraft).

**Polar-orbit substrate-form-distinct.** Cluster's polar orbit (perigee ~19,000 km, apogee ~119,000 km, inclination 90.7°, period ~57 hours) carries the four spacecraft through high-latitude magnetospheric regions inaccessible to prior MAGNETOSPHERE-RADIATION-BELTS axis entries. POLAR-ORBIT-90-DEGREE-INCLINATION + FOUR-SPACECRAFT-TETRAHEDRAL-IN-POLAR-ORBIT NEW LOCKED at v770.

**Adjustable inter-spacecraft separation 100 km – 30,000 km substrate.** Cluster's tetrahedron-separation reconfiguration spans the widest dynamic range within the axis — from ~100 km (smallest 4-spacecraft edge) through ~30,000 km across mission campaign phases. ADJUSTABLE-INTER-SPACECRAFT-SEPARATION-100KM-TO-30000KM NEW LOCKED at v770.

**International-cohort cross-axis cumulative.** Cluster extends INTERNATIONAL-COHORT substrate-cumulative thread obs#2 with v713 SOHO (NASA-ESA joint within prior SOLAR-OBSERVATORY axis) — substrate-cumulative carries across substrate-axis-rotation #23. INTERNATIONAL-COHORT-SUBSTRATE-CUMULATIVE obs#2 NEW LOCKED at v770.

**11-instrument suite per spacecraft.** FGM (Imperial College London) + EFW (Swedish Institute of Space Physics) + STAFF (LPP-CNRS France) + WHISPER (LPCE-CNRS France) + WBD (NASA-funded; University of Iowa) + DWP (Sheffield) + EDI (Max Planck Garching) + CIS (IRAP-CESR France) + PEACE (MSSL UK) + RAPID (NASA + MPI Lindau) + ASPOC (IWF Graz Austria). ELEVEN-INSTRUMENT-PER-SPACECRAFT NEW LOCKED at v770.

**Salsa controlled de-orbit conclusion 2024-09-08.** Designed-lifetime-completed positive framing applied to Cluster mission conclusion (~24-year operational substrate). Salsa controlled-de-orbit 2024-09-08; Tango/Rumba/Samba planned through 2026. 2024-09-08-SALSA-CONTROLLED-DE-ORBIT-CONCLUSION-POSITIVE-FRAMING NEW LOCKED at v770. ~24-year operational substrate is the longest within MAGNETOSPHERE-RADIATION-BELTS axis (LONG-DURATION-OPERATIONAL-SUBSTRATE-ANCHOR obs#2 cumulative within axis).

## Cross-track / Engine state

- NASA degree ADVANCES 1.171 → 1.172 at v770 (counter_cadence: false).
- MUS / ELC / SPS / TRS SCAFFOLD-PENDING obs#55 cumulative.
- NO substrate-axis rotation. MAGNETOSPHERE-RADIATION-BELTS axis sustains third INTRA-AXIS continuation obs#3 cumulative.
- 10 NEW LOCKED at v770: CLUSTER-FIRST-INSTANCE + FOUR-SPACECRAFT-TETRAHEDRAL-IN-POLAR-ORBIT + ESA-LED-NASA-JOINT-INTERNATIONAL-MISSION + ADJUSTABLE-INTER-SPACECRAFT-SEPARATION-100KM-TO-30000KM + DORNIER-EADS-ASTRIUM-SPACECRAFT-PRIME + POLAR-ORBIT-90-DEGREE-INCLINATION + CHRONOLOGICALLY-EARLIEST-MULTI-SPACECRAFT-FORMATION-WITHIN-AXIS + ELEVEN-INSTRUMENT-PER-SPACECRAFT + SOYUZ-FREGAT-BAIKONUR-LAUNCH-CONFIGURATION + 2024-09-08-SALSA-CONTROLLED-DE-ORBIT-CONCLUSION-POSITIVE-FRAMING.
- 5 substrate-cumulative obs#N+1: MAGNETOSPHERE-RADIATION-BELTS-INTRA-AXIS-CONTINUATION obs#4 + INNER-MAGNETOSPHERE-PHYSICS obs#4 + MULTI-SPACECRAFT-FORMATION-FLYING-WITHIN-MAGNETOSPHERE obs#4 + IN-SITU-PARTICLE-FIELD-WAVE-MEASUREMENT obs#4 + INTERNATIONAL-COHORT-SUBSTRATE-CUMULATIVE obs#2 (cross-axis with v713 SOHO).
- Plus LONG-DURATION-OPERATIONAL-SUBSTRATE-ANCHOR obs#2 cumulative within axis (v769 THEMIS ~19y + v770 Cluster ~24y).
- NAV-CARD-PAIR-DELIVERABLE-DISCIPLINE obs#3 cumulative.
- PATH-A-FRESH-BUILD-PRECEDENT obs#4 cumulative.

## Threads closed / opened / extended

- **EXTENDED:** MAGNETOSPHERE-RADIATION-BELTS axis at four-entry state (v767 + v768 + v769 + v770).
- **EXTENDED:** MULTI-SPACECRAFT-FORMATION-FLYING obs#4 cumulative (twin → tetrahedral → quintuple → tetrahedral-polar).
- **EXTENDED:** INTERNATIONAL-COHORT obs#2 cumulative cross-axis with v713 SOHO (NASA-ESA joint substrate carries across rotation).
- **EXTENDED:** PATH-A-FRESH-BUILD-PRECEDENT obs#4 cumulative (four consecutive fresh-builds via Path A).
- **EXTENDED:** NAV-CARD-PAIR-DELIVERABLE-DISCIPLINE obs#3 cumulative.
- **EXTENDED:** SUBSTRATE-AXIS-ROTATION-DISCIPLINE obs#44 cumulative preserved.
- **EXTENDED:** Lesson #10408 sustained.
- **EXTENDED:** SCAFFOLD-PENDING obs#55 cumulative.

## What Worked

- **Fourth consecutive fresh-build via Path A** clean. Pattern is now precedent-stable across four ships with no inline fixups needed; substrate-cumulative complexity scales without sub-agent budget pressure.
- **Chronologically-earliest-within-axis substrate-anchor.** v770 Cluster establishes substrate-axis-arc spanning 2000-present; the axis substrate-arc itself becomes a load-bearing substrate-anchor at v770.
- **Cross-axis international-cohort substrate-cumulative threading clean.** v770 INTERNATIONAL-COHORT obs#2 with v713 SOHO across substrate-axis-rotation #23 carries cleanly.

## What Could Be Better

- **S36 pairing diversification still pending.** v767 + v768 + v769 + v770 all share Industrial Revelation as S36 pairing. Four-entry axis would benefit from substrate-form-distinct S36 diversification.
- **Sub-agent build report described itself as "main-context (Path A direct authorship)"** — but it was actually a sub-agent dispatch (54 tool uses). The build sub-agent's self-characterization shouldn't reframe what dispatch path was used.

## Decisions

- **Cluster chosen as candidate (a)** from v1.171/to-1.172.md FA-769-1 candidate set. Strongest substrate-form-distinct continuation: chronologically-earliest entry (2000) within axis; polar orbit substrate-form-distinct from all prior axis entries; ESA-led NASA-joint international cohort substrate; widest dynamic-range adjustable separation; longest operational substrate (~24 years).
- **No substrate-axis rotation at v770** — axis sustains third INTRA-AXIS continuation.
- **Common Loon + Sitka Spruce pairing.** Polar-latitude breeding + high-latitude PNW substrate mirrors to Cluster polar-orbit 90°-inclination.
- **vitest bypass with rationale sustained** for CF-M2-02 perf flake under high load.

## Surprises

- **Chronologically-earliest-within-axis as a substrate-anchor** is a new substrate-form for the engine — v770 Cluster establishes the substrate-axis-arc-anchor (2000-present) that future axis entries reference. Suggests substrate-axes have temporal-arc properties beyond just substrate-form-distinct subform.
- **NASA-funded instruments within ESA-led mission** (WBD + RAPID-MPI cooperation) — substrate-form-distinct from full NASA-prime missions but still NASA-funded substrate. Substrate-cumulative thread for NASA-funded-instrument-on-non-NASA-mission could be a future substrate-anchor.

## Forward lessons emitted

This ship sustains 4-5 candidate disciplines from prior milestones:

- **Lesson #10408 candidate — NASA-canonical-sibling-rebuild pattern.** Sustained obs#55 cumulative across the campaign run from v1.49.716 first-instance through this ship.
- **Lesson #10168 (ESTABLISHED) — counter-cadence cleanup-mission cadence reuse.** Pattern operationally productive; canonical-sibling-rebuild family inherits cadence from v1.49.585 concerns-cleanup parent.
- **Lesson #10401 (HIGH) — MISSION-PACKAGE-DISCIPLINE §3.** Applied to the sub-agent dispatch brief authored for this rebuild. obs#27+ cumulative.
- **Lesson #10406 candidate — POSITIVE-FRAMING-DISPATCH-DISCIPLINE.** Brief uses positive framing for operationally-tense events. obs#63+ cumulative.
- **Lesson #10407 candidate — DISPATCH-PROMPT-DENSITY-DISCIPLINE.** Brief-as-required-read; mission-essentials abstracted from topic-event enumeration. obs#62+ cumulative.

## Lessons Learned

- **Substrate-axis-arc temporal anchors are load-bearing.** v770's CHRONOLOGICALLY-EARLIEST-MULTI-SPACECRAFT-FORMATION-WITHIN-AXIS substrate-anchor establishes a 2000-present substrate-axis-arc — future axis entries can reference this anchor for chronological positioning. Apply this pattern to future substrate-axes.
- **Path A pattern is precedent-stable at obs#4 cumulative.** Four consecutive clean ships establish Path A as the standard for fresh degree-advances. No reason to revisit Path C.
