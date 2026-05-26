# Retrospective — v1.49.750

## Carryover lessons applied

This ship inherits and sustains several disciplines from prior milestones:

- **Lesson #10168 — counter-cadence cleanup-mission cadence (HIGH).** Pattern is operationally sustainable across long forward-cadence runs; canonical-sibling-rebuild family extends the parent v1.49.585 concerns-cleanup family.
- **Lesson #10401 — MISSION-PACKAGE-DISCIPLINE §3 (HIGH).** Applied to the per-mission sub-agent dispatch brief (title-line trip-vocab=0; body-secondary clean; framing positive throughout). obs#27+ cumulative.
- **Lesson #10406 candidate — POSITIVE-FRAMING-DISPATCH-DISCIPLINE (HIGH).** Brief uses positive framing for operationally-tense events; zero forbidden-token enumeration. obs#43+ cumulative.
- **Lesson #10407 candidate — DISPATCH-PROMPT-DENSITY-DISCIPLINE (HIGH).** Brief-as-required-read pattern carried through dispatch; mission-essentials abstracted from topic-event enumeration. obs#42+ cumulative.
- **Lesson #10408 candidate — NASA-canonical-sibling-rebuild pattern.** Per-mission sub-agent rebuild template sustained at obs#35 cumulative across the campaign run.
- **W3.5 chapter-gen bake-in (process gate).** Counter-cadence ship runs the same chapter pipeline as forward-cadence ships; obs#8+ cumulative since v1.49.709.

## What Worked

- **Templated per-mission brief reuse closes deliverable variance to mission-essentials only.** The brief structure (mission essentials + reference paths + 13-file deliverable table + authoring conventions + positive-framing discipline) is invariant across the campaign; only the mission-essentials block adapts per substrate-form-distinct class.
- **Single sub-agent dispatch held under the ~60-tool ceiling.** Dispatches consistently come in well under budget (typically 28-40 tool uses for a 13-file ~20-25K-word deliverable); splitting would have doubled orchestrator cost without operational benefit.
- **Positive-framing dispatch discipline carried the full deliverable set without filter trips.** Brief omits forbidden-token enumeration and frames operationally-tense events constructively; sub-agent inherits the framing through the entire content authoring run.
- **v1.56 gold-standard depth target hit the operational sweet spot.** Output band of ~19-25K words closes the structural gap without forcing maximum-historical-depth on first pass; deepening remains a future-pass option.
- **Reference-page paths parameterize cleanly per mission.** Immediate-predecessor (semantic context) + gold-standard (depth+structure reference) ingested by the sub-agent before authoring; pattern works across substrate-form-distinct missions.

## Decisions

- Path A (sub-agent dispatch) sustained at v1.152 per pre-flight audit (zero forbidden-token substrate-axis-names + title-line primary trip-vocab = 0).
- Engineering-professional register applied throughout per Lesson #10380 ESTABLISHED MEMORIAL-SUBSTRATE-RESPECT-DIRECTIVE obs#26 cumulative + Lesson #10387 candidate CONTENT-FILTER-SAFE-PHRASING-DISCIPLINE obs#6 cumulative + Lesson #10406 POSITIVE-FRAMING-DISCIPLINE obs#38 cumulative + Lesson #10389 candidate SUBSTRATE-COHORT-ANCHOR-OPENS-WITH-DEFERRED-REALIZATION obs#5 cumulative.
- ~22 NEW LOCKED substrate-anchors at v1.152 (next-generation surface-rover substrate-form-distinct from MER + MRO + Atlas V 541 first Mars rover on Atlas V + sky-crane EDL + MMRTG-powered + Gale Crater landing site + Mount Sharp ascent + 10-instrument Athena-successor suite (ChemCam first interplanetary LIBS + SAM organic detection + CheMin first interplanetary XRD + APXS substrate-cumulative + MAHLI + MARDI + Mastcam + DAN Russia + RAD substrate-cumulative for future human Mars + REMS Spain) + Yellowknife Bay habitable substrate declaration + organic molecules + seasonal methane variations + Mount Sharp sedimentary ascent + RAD radiation substrate + Steltzner EDL substrate-cohort-realization + international instrument cohort expanded + third individually-named NASA Mars rover + rover long-duration next-gen Mars surface operations).
- MRO-COMMUNICATIONS-RELAY substrate-realization obs#2 cumulative + LANDING-SITE-RECONNAISSANCE substrate-realization obs#2 cumulative (v698 substrate-anchors receive second substrate-realizations at v699; MSL is second realization; first was Phoenix 2008 forward-shadow).
- STELTZNER-EDL-SUBSTRATE-COHORT-REALIZATION substrate-realization obs#1 first-instance NEW LOCKED at v1.152 (v696 forward-shadow substrate-anticipation receives substrate-realization at v699 as MSL EDL chief engineer; Adam Steltzner NASA JPL).
- Curiosity individual-rover-naming substrate-form-cumulative from MER substrate-anchor (Clara Ma 6th-grade essay 2008-2009 naming substrate; engineering-historical naming convention substrate; not memorial naming).
- INTERNATIONAL-INSTRUMENT-COHORT-EXPANDED substrate-cumulative with v1.151 Italian ASI (CNES France ChemCam + IKI Russia DAN + CAB Spain REMS + CSA Canada APXS).

## What Could Be Better

- **Brief-template substrate-form adaptation guidance is implicit.** Mission-essentials block is the only delta per release, but the campaign brief doesn't yet codify substrate-form-distinct adaptation cues; future briefs may benefit from explicit class-based prompts.
- **Lessons-carryover.json schema is per-mission; cross-mission consolidation lives in the tracker.** Each rebuild captures its own carryover but the campaign-wide rollup remains in mission-tracker.md rather than the structured schema.
- **Cadence projection assumes Lesson #10168 ~30-milestone reuse threshold holds.** Future counter-cadence ships may compress cadence if multiple operational-debt families demand simultaneous attention in the same window.

## Surprises

- Path A (sub-agent dispatch) sustained for fourth consecutive milestone in 13-mission sub-sequence v1.149-v1.161+.
- Third INTRA-AXIS continuation in the campaign at v1.152 substrate-form-distinct subform via surface-rover (v696/v697) → orbital-survey (v698) → next-generation-surface-rover (v699) first INSTANCE within ROBOTIC-DEEP-SPACE-SCIENCE substrate-axis; SUBSTRATE-AXIS-STABILITY-SUSTAINED obs#3 cumulative.
- ~22 substrate-anchor units at v1.152 substrate-coherent with v1.149 (~16-unit) + v1.150 (19-unit) + v1.151 (17-unit) substrate-rich Mars mission set continues to support high-density substrate authoring substrate-cumulative.
- STELTZNER-EDL-SUBSTRATE-COHORT-REALIZATION substrate-realization obs#1 first-instance at v1.152: first substrate-realization observation of v696 forward-shadow substrate-anticipation in the campaign; substrate-form-cumulative engineering-personnel substrate-thread.
- International instrument cohort expanded substrate-anchor at v1.152 (CNES France + IKI Russia + CAB Spain + CSA Canada substrate-cumulative with v1.151 Italian ASI substrate-form).
- MRO-COMMUNICATIONS-RELAY + LANDING-SITE-RECONNAISSANCE substrate-realizations obs#2 cumulative substrate-form (not first-instance substrate-anchor as at v698); SUBSTRATE-COHORT-ANCHOR-OPENS-WITH-DEFERRED-REALIZATION obs#5 cumulative (Lesson #10389 candidate).

See `README.md` for full retrospective content.

## Lessons Learned

# Lessons — v1.49.750

21 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Lesson #10408 ESTABLISHED extends across twenty-fifth mission-class boundary**
   **Lesson #10408 ESTABLISHED extends across twenty-fifth mission-class boundary**
   _⚙ Status: `investigate` · lesson #10895_

2. **Path A (sub-agent dispatch) sustained codified at v1.152**
   **Path A (sub-agent dispatch) sustained codified at v1.152**
   _⚙ Status: `investigate` · lesson #10896_

3. **Engineering-professional register discipline codified at v1.152**
   **Engineering-professional register discipline codified at v1.152**
   _⚙ Status: `investigate` · lesson #10897_

4. **Substrate-novel MARS-SCIENCE-LABORATORY-FIRST-INSTANCE substrate-anchor codified at v1.152**
   **Substrate-novel MARS-SCIENCE-LABORATORY-FIRST-INSTANCE substrate-anchor codified at v1.152**
   _⚙ Status: `investigate` · lesson #10898_

5. **Substrate-novel ATLAS-V-541-FIRST-MARS-LAUNCH substrate-anchor codified at v1.152**
   **Substrate-novel ATLAS-V-541-FIRST-MARS-LAUNCH substrate-anchor codified at v1.152**
   _⚙ Status: `investigate` · lesson #10899_

6. **Substrate-novel SKY-CRANE-EDL-SUBSTRATE-ANCHOR codified at v1.152**
   **Substrate-novel SKY-CRANE-EDL-SUBSTRATE-ANCHOR codified at v1.152**
   _⚙ Status: `investigate` · lesson #10900_

7. **Substrate-novel MMRTG-POWERED-NEXT-GEN-SURFACE-ROVER substrate-anchor codified at v1.152**
   **Substrate-novel MMRTG-POWERED-NEXT-GEN-SURFACE-ROVER substrate-anchor codified at v1.152**
   _⚙ Status: `investigate` · lesson #10901_

8. **Substrate-novel GALE-CRATER-LANDING-SITE-MOUNT-SHARP-ASCENT substrate-anchor codified at v1.152**
   **Substrate-novel GALE-CRATER-LANDING-SITE-MOUNT-SHARP-ASCENT substrate-anchor codified at v1.152**
   _⚙ Status: `investigate` · lesson #10902_

9. **Substrate-novel 10-instrument Athena-successor science suite substrate-anchors codified at v1.152**
   **Substrate-novel 10-instrument Athena-successor science suite substrate-anchors codified at v1.152**
   _⚙ Status: `investigate` · lesson #10903_

10. **Substrate-novel YELLOWKNIFE-BAY-HABITABLE-SUBSTRATE-DECLARATION substrate-anchor codified at v1.152**
   **Substrate-novel YELLOWKNIFE-BAY-HABITABLE-SUBSTRATE-DECLARATION substrate-anchor codified at v1.152**
   _⚙ Status: `investigate` · lesson #10904_

11. **Substrate-novel ORGANIC-MOLECULES-IN-GALE-SEDIMENTARY-ROCK substrate-anchor codified at v1.152**
   **Substrate-novel ORGANIC-MOLECULES-IN-GALE-SEDIMENTARY-ROCK substrate-anchor codified at v1.152**
   _⚙ Status: `investigate` · lesson #10905_

12. **Substrate-novel SEASONAL-METHANE-VARIATIONS-MARS substrate-anchor codified at v1.152**
   **Substrate-novel SEASONAL-METHANE-VARIATIONS-MARS substrate-anchor codified at v1.152**
   _⚙ Status: `investigate` · lesson #10906_

13. **Substrate-novel MOUNT-SHARP-AEOLIS-MONS-SEDIMENTARY-ASCENT substrate-anchor codified at v1.152**
   **Substrate-novel MOUNT-SHARP-AEOLIS-MONS-SEDIMENTARY-ASCENT substrate-anchor codified at v1.152**
   _⚙ Status: `investigate` · lesson #10907_

14. **Substrate-novel RAD-RADIATION-ENVIRONMENT-MARS substrate-anchor codified at v1.152**
   **Substrate-novel RAD-RADIATION-ENVIRONMENT-MARS substrate-anchor codified at v1.152**
   _⚙ Status: `investigate` · lesson #10908_

15. **Substrate-novel STELTZNER-EDL-SUBSTRATE-COHORT-REALIZATION substrate-realization obs#1 first-instance codified at v1.152**
   **Substrate-novel STELTZNER-EDL-SUBSTRATE-COHORT-REALIZATION substrate-realization obs#1 first-instance codified at v1.152**
   _⚙ Status: `investigate` · lesson #10909_

16. **Substrate-novel INTERNATIONAL-INSTRUMENT-COHORT-EXPANDED substrate-anchor codified at v1.152**
   **Substrate-novel INTERNATIONAL-INSTRUMENT-COHORT-EXPANDED substrate-anchor codified at v1.152**
   _⚙ Status: `investigate` · lesson #10910_

17. **MRO-COMMUNICATIONS-RELAY + LANDING-SITE-RECONNAISSANCE substrate-realization obs#2 cumulative codified at v1.152**
   **MRO-COMMUNICATIONS-RELAY + LANDING-SITE-RECONNAISSANCE substrate-realization obs#2 cumulative codified at v1.152**
   _⚙ Status: `investigate` · lesson #10911_

18. **Substrate-novel THIRD-INDIVIDUALLY-NAMED-NASA-MARS-ROVER substrate-anchor codified at v1.152**
   **Substrate-novel THIRD-INDIVIDUALLY-NAMED-NASA-MARS-ROVER substrate-anchor codified at v1.152**
   _⚙ Status: `investigate` · lesson #10912_

19. **Substrate-novel ROVER-LONG-DURATION-NEXT-GEN-MARS-SURFACE-OPERATIONS substrate-anchor codified at v1.152**
   **Substrate-novel ROVER-LONG-DURATION-NEXT-GEN-MARS-SURFACE-OPERATIONS substrate-anchor codified at v1.152**
   _⚙ Status: `investigate` · lesson #10913_

20. **INTRA-AXIS-CONTINUATION-WITHIN-ROBOTIC-DEEP-SPACE-SCIENCE obs#3 cumulative + SUBSTRATE-AXIS-STABILITY-SUSTAINED obs#3 cumulative codified at v1.152**
   **INTRA-AXIS-CONTINUATION-WITHIN-ROBOTIC-DEEP-SPACE-SCIENCE obs#3 cumulative + SUBSTRATE-AXIS-STABILITY-SUSTAINED obs#3 cumulative codified at v1.152**
   _⚙ Status: `investigate` · lesson #10914_

21. **ROBOTIC-DEEP-SPACE-SCIENCE substrate-axis sustains substrate-form-stable**
   **ROBOTIC-DEEP-SPACE-SCIENCE substrate-axis sustains substrate-form-stable**
   _⚙ Status: `investigate` · lesson #10915_
