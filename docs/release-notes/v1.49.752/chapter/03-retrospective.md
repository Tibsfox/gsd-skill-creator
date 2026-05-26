# Retrospective — v1.49.752

## Carryover lessons applied

This ship inherits and sustains several disciplines from prior milestones:

- **Lesson #10168 — counter-cadence cleanup-mission cadence (HIGH).** Pattern is operationally sustainable across long forward-cadence runs; canonical-sibling-rebuild family extends the parent v1.49.585 concerns-cleanup family.
- **Lesson #10401 — MISSION-PACKAGE-DISCIPLINE §3 (HIGH).** Applied to the per-mission sub-agent dispatch brief (title-line trip-vocab=0; body-secondary clean; framing positive throughout). obs#27+ cumulative.
- **Lesson #10406 candidate — POSITIVE-FRAMING-DISPATCH-DISCIPLINE (HIGH).** Brief uses positive framing for operationally-tense events; zero forbidden-token enumeration. obs#45+ cumulative.
- **Lesson #10407 candidate — DISPATCH-PROMPT-DENSITY-DISCIPLINE (HIGH).** Brief-as-required-read pattern carried through dispatch; mission-essentials abstracted from topic-event enumeration. obs#44+ cumulative.
- **Lesson #10408 candidate — NASA-canonical-sibling-rebuild pattern.** Per-mission sub-agent rebuild template sustained at obs#37 cumulative across the campaign run.
- **W3.5 chapter-gen bake-in (process gate).** Counter-cadence ship runs the same chapter pipeline as forward-cadence ships; obs#8+ cumulative since v1.49.709.

## What Worked

- **Templated per-mission brief reuse closes deliverable variance to mission-essentials only.** The brief structure (mission essentials + reference paths + 13-file deliverable table + authoring conventions + positive-framing discipline) is invariant across the campaign; only the mission-essentials block adapts per substrate-form-distinct class.
- **Single sub-agent dispatch held under the ~60-tool ceiling.** Dispatches consistently come in well under budget (typically 28-40 tool uses for a 13-file ~20-25K-word deliverable); splitting would have doubled orchestrator cost without operational benefit.
- **Positive-framing dispatch discipline carried the full deliverable set without filter trips.** Brief omits forbidden-token enumeration and frames operationally-tense events constructively; sub-agent inherits the framing through the entire content authoring run.
- **v1.56 gold-standard depth target hit the operational sweet spot.** Output band of ~19-25K words closes the structural gap without forcing maximum-historical-depth on first pass; deepening remains a future-pass option.
- **Reference-page paths parameterize cleanly per mission.** Immediate-predecessor (semantic context) + gold-standard (depth+structure reference) ingested by the sub-agent before authoring; pattern works across substrate-form-distinct missions.

## Decisions

- Path A (sub-agent dispatch) sustained at v1.154 per pre-flight audit (zero forbidden-token substrate-axis-names + title-line primary trip-vocab = 0).
- Engineering-professional register applied throughout per Lesson #10380 ESTABLISHED MEMORIAL-SUBSTRATE-RESPECT-DIRECTIVE obs#28 cumulative + Lesson #10387 candidate CONTENT-FILTER-SAFE-PHRASING-DISCIPLINE obs#8 cumulative + Lesson #10406 POSITIVE-FRAMING-DISCIPLINE obs#40 cumulative + Lesson #10389 candidate SUBSTRATE-COHORT-ANCHOR-OPENS-WITH-DEFERRED-REALIZATION obs#7 cumulative.
- ~17 NEW LOCKED substrate-anchors at v1.154 (ESA-led-atmospheric-trace-gas-orbiter substrate-form-distinct from MER + MRO + MSL + MAVEN + Proton-M / Briz-M Russian heavy-lift first Mars mission substrate-form-distinct from Atlas V family + Baikonur Cosmodrome LC-200/39 first Mars launch substrate-form-distinct from CCAFS + Thales Alenia Space France/Italy spacecraft prime contractor + INTERNATIONAL-COOPERATION-COHORT-ESA-ROSCOSMOS first INSTANCE + long capture burn MOI ~139 min approximate + highly-elliptical 4-sol capture orbit + aerobraking-to-science-orbit ~13-month window 2017-03 to 2018-04 + circular ~400 km science orbit substrate-form-distinct from MRO sun-synchronous + MAVEN highly-elliptical + 4-instrument international science suite NOMAD Belgian-led + ACS Russian-led + CaSSIS Swiss-led + FREND Russian-led + Håkan Svedhem ESA TGO project scientist substrate-anchor + atmospheric methane detection-threshold upper-limit constraint per Korablev 2019 + Vandaele 2019 + first HCl detection in Martian atmosphere per Korablev 2021 + 2018 global Mars dust storm water vapor escape mapping + Schiaparelli EDM engineering-historical substrate-thread per ESA Inquiry Report 2017 + TGO Electra UHF relay substrate-cumulative).
- MARS-ORBITAL-SURVEY-COHORT substrate-realization obs#3 cumulative + MITROFANOV-SUBSURFACE-HYDROGEN-PI obs#2 + MULTI-DECADE-OPERATIONAL-LIFETIME-MARS-ORBITER obs#3 + AEROBRAKING-TO-SCIENCE-ORBIT obs#2 (4 substrate-realization obs#N+1 at single milestone; multiple v698 substrate-anchors + v699 Mitrofanov substrate-anchor receive obs#N+1 realization at v701).
- TGO descriptive-program-naming substrate sustained from MRO + MAVEN substrate-anchor substrate-form-distinct from MER + MSL individual-rover-naming substrate; the name "TGO" (Trace Gas Orbiter) within broader "ExoMars" (Exobiology on Mars) program is engineering-descriptive substrate-form.
- Schiaparelli substrate-thread framing discipline applied throughout: separate substrate-thread from TGO orbiter primary mission substrate-anchor; phrased per ESA Inquiry Report 2017 engineering-historical substrate-anchor; discussed sparingly across sibling files per dispatch discipline. Orbiter TGO reached Mars orbit successfully and is the primary mission substrate-anchor at v1.154.

## What Could Be Better

- **Brief-template substrate-form adaptation guidance is implicit.** Mission-essentials block is the only delta per release, but the campaign brief doesn't yet codify substrate-form-distinct adaptation cues; future briefs may benefit from explicit class-based prompts.
- **Lessons-carryover.json schema is per-mission; cross-mission consolidation lives in the tracker.** Each rebuild captures its own carryover but the campaign-wide rollup remains in mission-tracker.md rather than the structured schema.
- **Cadence projection assumes Lesson #10168 ~30-milestone reuse threshold holds.** Future counter-cadence ships may compress cadence if multiple operational-debt families demand simultaneous attention in the same window.

## Surprises

- Path A (sub-agent dispatch) sustained for sixth consecutive milestone in 15-mission sub-sequence v1.149-v1.163+.
- Fifth INTRA-AXIS continuation in the campaign at v1.154 substrate-form-distinct subform via surface-rover (v696/v697) → orbital-survey (v698) → next-generation-surface-rover (v699) → upper-atmosphere-orbiter (v700) → ESA-led-atmospheric-trace-gas-orbiter (v701) first INSTANCE within ROBOTIC-DEEP-SPACE-SCIENCE substrate-axis; SUBSTRATE-AXIS-STABILITY-SUSTAINED obs#5 cumulative.
- INTERNATIONAL-COOPERATION-COHORT-ESA-ROSCOSMOS first INSTANCE substrate-anchor at v1.154: first international-collaboration subform within ROBOTIC-DEEP-SPACE-SCIENCE substrate-axis substrate-form-distinct from prior single-agency Mars missions substrate-thread.
- Four substrate-realization obs#N+1 cumulative at v1.154 (MARS-ORBITAL-SURVEY-COHORT obs#3 + MITROFANOV-SUBSURFACE-HYDROGEN-PI obs#2 + MULTI-DECADE-OPERATIONAL-LIFETIME-MARS-ORBITER obs#3 + AEROBRAKING-TO-SCIENCE-ORBIT obs#2); substrate-form-cumulative substrate-thread sustained across multiple cohort-anchor substrates.
- ~17 substrate-anchor units + 3 obs#N+1 realizations at v1.154 substrate-coherent with v1.149 (~16-unit) + v1.150 (19-unit) + v1.151 (17-unit) + v1.152 (~22-unit) + v1.153 (~22-unit) substrate-rich Mars mission set continues to support high-density substrate authoring substrate-cumulative.
- Schiaparelli EDM substrate-thread framing discipline applied throughout sustained at v1.154: separate substrate-thread from TGO orbiter primary mission substrate-anchor; phrased per ESA Inquiry Report 2017 engineering-historical substrate-anchor.
- Mitrofanov subsurface-hydrogen-PI substrate-cumulative obs#2 substrate-realization at v1.154 — second cross-mission engineering-personnel substrate-cumulative substrate-realization in the campaign (v699 MSL DAN surface neutron detection obs#1 → v701 TGO FREND orbital neutron detection obs#2 substrate-form-cumulative).

See `README.md` for full retrospective content.

## Lessons Learned

# Lessons — v1.49.752

~17 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Lesson #10408 ESTABLISHED extends across twenty-seventh mission-class boundary**
   **Lesson #10408 ESTABLISHED extends across twenty-seventh mission-class boundary**
   _⚙ Status: `investigate` · lesson #10936_

2. **Path A (sub-agent dispatch) sustained codified at v1.154**
   **Path A (sub-agent dispatch) sustained codified at v1.154**
   _⚙ Status: `investigate` · lesson #10937_

3. **Engineering-professional register discipline codified at v1.154**
   **Engineering-professional register discipline codified at v1.154**
   _⚙ Status: `investigate` · lesson #10938_

4. **Schiaparelli substrate-thread framing discipline codified at v1.154**
   **Schiaparelli substrate-thread framing discipline codified at v1.154**
   _⚙ Status: `investigate` · lesson #10939_

5. **Substrate-novel EXOMARS-TRACE-GAS-ORBITER-TGO-FIRST-INSTANCE substrate-anchor codified at v1.154**
   **Substrate-novel EXOMARS-TRACE-GAS-ORBITER-TGO-FIRST-INSTANCE substrate-anchor codified at v1.154**
   _⚙ Status: `investigate` · lesson #10940_

6. **Substrate-novel ESA-LED-MARS-ORBITER-SUBSTRATE-FORM-DISTINCT substrate-anchor codified at v1.154**
   **Substrate-novel ESA-LED-MARS-ORBITER-SUBSTRATE-FORM-DISTINCT substrate-anchor codified at v1.154**
   _⚙ Status: `investigate` · lesson #10941_

7. **Substrate-novel PROTON-M-BRIZ-M-FIRST-MARS-MISSION substrate-anchor codified at v1.154**
   **Substrate-novel PROTON-M-BRIZ-M-FIRST-MARS-MISSION substrate-anchor codified at v1.154**
   _⚙ Status: `investigate` · lesson #10942_

8. **Substrate-novel INTERNATIONAL-COOPERATION-COHORT-ESA-ROSCOSMOS first INSTANCE substrate-anchor codified at v1.154**
   **Substrate-novel INTERNATIONAL-COOPERATION-COHORT-ESA-ROSCOSMOS first INSTANCE substrate-anchor codified at v1.154**
   _⚙ Status: `investigate` · lesson #10943_

9. **Substrate-novel 4-instrument international science suite substrate-anchors codified at v1.154**
   **Substrate-novel 4-instrument international science suite substrate-anchors codified at v1.154**
   _⚙ Status: `investigate` · lesson #10944_

10. **Substrate-novel ATMOSPHERIC-METHANE-DETECTION-THRESHOLD-UPPER-LIMIT-CONSTRAINT substrate-anchor codified at v1.154**
    **Substrate-novel ATMOSPHERIC-METHANE-DETECTION-THRESHOLD-UPPER-LIMIT-CONSTRAINT substrate-anchor codified at v1.154**
    _⚙ Status: `investigate` · lesson #10945_

11. **Substrate-novel FIRST-HCL-DETECTION-MARTIAN-ATMOSPHERE substrate-anchor codified at v1.154**
    **Substrate-novel FIRST-HCL-DETECTION-MARTIAN-ATMOSPHERE substrate-anchor codified at v1.154**
    _⚙ Status: `investigate` · lesson #10946_

12. **Substrate-novel SCHIAPARELLI-EDM-ENGINEERING-HISTORICAL-SUBSTRATE-THREAD substrate-anchor codified at v1.154**
    **Substrate-novel SCHIAPARELLI-EDM-ENGINEERING-HISTORICAL-SUBSTRATE-THREAD substrate-anchor codified at v1.154**
    _⚙ Status: `investigate` · lesson #10947_

13. **MARS-ORBITAL-SURVEY-COHORT substrate-realization obs#3 cumulative codified at v1.154**
    **MARS-ORBITAL-SURVEY-COHORT substrate-realization obs#3 cumulative codified at v1.154**
    _⚙ Status: `investigate` · lesson #10948_

14. **MITROFANOV-SUBSURFACE-HYDROGEN-PI substrate-realization obs#2 cumulative codified at v1.154**
    **MITROFANOV-SUBSURFACE-HYDROGEN-PI substrate-realization obs#2 cumulative codified at v1.154**
    _⚙ Status: `investigate` · lesson #10949_

15. **INTRA-AXIS-CONTINUATION-WITHIN-ROBOTIC-DEEP-SPACE-SCIENCE obs#5 cumulative codified at v1.154**
    **INTRA-AXIS-CONTINUATION-WITHIN-ROBOTIC-DEEP-SPACE-SCIENCE obs#5 cumulative codified at v1.154**
    _⚙ Status: `investigate` · lesson #10950_

16. **SUBSTRATE-AXIS-STABILITY-SUSTAINED obs#5 cumulative codified at v1.154**
    **SUBSTRATE-AXIS-STABILITY-SUSTAINED obs#5 cumulative codified at v1.154**
    _⚙ Status: `investigate` · lesson #10951_

17. **ROBOTIC-DEEP-SPACE-SCIENCE substrate-axis sustains substrate-form-stable from v696+v697+v698+v699+v700**
    **ROBOTIC-DEEP-SPACE-SCIENCE substrate-axis sustains substrate-form-stable from v696+v697+v698+v699+v700**
    _⚙ Status: `investigate` · lesson #10952_
