# v1.49.646 — Forward Lessons

## Emitted lessons (continuing from v1.49.645's last lesson #10213)

### Lesson #10214 — Sub-agent 64K output token cap; split JSON from HTML when bundled output exceeds ~50K tokens

**Surfaced at:** v1.49.646 W2-NASA index.html build

**Observation:** W2-NASA bundled `index.html` and `degree-sync.json` into a single sub-agent output dispatch. The combined output exceeded the sub-agent 64K output token ceiling and the dispatch terminated mid-flight without producing the full bundle. The 64K output ceiling is a structural sub-agent constraint distinct from the ~60-70 tool-use ceiling documented in Lesson #10193; both ceilings can be hit independently. The bundling-as-default-pattern (one component per dispatch) is robust against the tool-use ceiling but vulnerable to the output-token ceiling when the per-component output is itself large.

**Closure:** retry-with-split — the W2-NASA dispatch was re-issued as two separate dispatches: one for `index.html` (the HTML track-page output) and one for `degree-sync.json` (the JSON track manifest). Both dispatches completed cleanly under the per-agent output ceiling. The split-output pattern is the recovery for the 64K output ceiling.

**Discipline-relevant implication:** W2 stage planning should include a per-component size budget check. Bundled outputs above ~50K tokens (HTML + JSON; HTML + Markdown; HTML + Python-orbit-data) should be pre-split into separate W2 dispatches with a ~10K-token safety margin against the 64K hard ceiling. The per-component bound at ~50K tokens is the new W2-stage discipline rule, extending the per-component bound at 30-50 minutes from W3 (Lesson #10193) to W2 index-build.

**Discovery condition:** the W2-NASA author bundled `index.html` and `degree-sync.json` into a single dispatch as the default-pattern from prior degree-advance milestones (v633 + v645 ran the same pattern without hitting the ceiling). The v646 substrate density — 17 NEW LOCKED axes vs v645's 16 — pushed the index.html size above the v645 baseline, and the bundled output crossed the 64K ceiling for the first time at NASA degree-build scale.

### Lesson #10214 status: EMITTED + CLOSED IN-CLUSTER

The 64K output ceiling sub-rule is now documented for future degree-advance milestone authors.

### Lesson #10215 — W1 sub-agent retry-with-priors pattern when agent stalls

**Surfaced at:** v1.49.646 W1-MUS dispatch

**Observation:** W1-MUS initial dispatch ran extensive research on Bay Area recording locations (Fantasy Studios Berkeley + Record Plant Sausalito + The Automatt SF), Chrysalis Records label history, and Huey Lewis and the News pre-1983 discography but stalled mid-flight before confirming the final track-pick selection (album-form vs single-form vs EP-form discipline). The stall produced a partial-discovery dispatch result that contained substantial substrate-content but lacked the operational selection-confirmation that downstream W2-MUS dispatch required.

**Closure:** retry-with-priors — the W1-MUS retry dispatch was issued with the partial-discovery context from the initial dispatch passed as priors. The retry agent completed the selection-confirmation in approximately seven tool uses (web search confirming *Sports* 1983-09-15 worldwide release; cross-check confirming "Heart and Soul" single 1983-08-30 release; cross-check confirming Power Station + Clearmountain v633 reproducibility-test PASS in SECONDARY-MIXING role; cross-check confirming Chrysalis Records first cohort appearance). The retry-with-priors pattern preserved the initial dispatch's substantive substrate-research and only required the final selection-and-confirmation logic in the retry.

**Discipline-relevant implication:** future W1 retries should pass partial-discovery priors to the retry agent to skip duplicate research. The retry pattern's value: bounded recovery from sub-agent stalls without losing prior research investment. The pattern is the W1-stage analog of the W3-stage commit-between-deliverables discipline from Lesson #10193 — both patterns convert sub-agent ceiling-failures into bounded-recovery operations rather than full-dispatch redos.

**Discovery condition:** the W1-MUS initial dispatch substrate-density (Bay Area regional recording-cluster + Chrysalis British-independent label + Power Station + Clearmountain reproducibility-test + HEART-AND-SOUL single 0d-coincidence) pushed the dispatch toward the ~60-70 tool-use ceiling before the final selection-confirmation logic could execute. The stall surfaces the same constraint Lesson #10193 documents but at a different stage (W1 vs W3) and with a different recovery pattern (retry-with-priors vs commit-between-deliverables).

### Lesson #10215 status: EMITTED + CLOSED IN-CLUSTER

The retry-with-priors pattern is now documented for future W1 dispatch stalls.

### Lesson #10216 — 0d substrate-coincidence as second-tightest cohort proximity at single-form level

**Surfaced at:** v1.49.646 W1-MUS dispatch

**Observation:** The Huey Lewis "Heart and Soul" lead single from the forthcoming *Sports* album was released **1983-08-30 — the exact STS-8 launch day**. The 0-day coincidence at the single-form level matches Iron Maiden *The Number of the Beast*'s 0d coincidence at MUS 1.105 (STS-3 launch 1982-03-22 = NOTB release 1982-03-22), but at sub-form level (pre-album single rather than full album). The cohort's tightest launch-anchor proximity observations to date: Iron Maiden NOTB at MUS 1.105 (0d album-form) → Huey Lewis "Heart and Soul" at MUS 1.110 (0d single-form). The v646 0d-coincidence is the cohort's second 0d-anchor-proximity observation and the first sub-form pre-album-single 0d-coincidence.

**Closure:** in-flight patch to MISSION-BRIEF.md adding **HEART-AND-SOUL-SINGLE-LAUNCH-DAY-0D-COINCIDENCE** as NEW LOCKED candidate substrate-primitive. The album *Sports* (1983-09-15) became the MUS 1.110 primary pick on grounds of DUAL-ANCHOR-INSIDE-STRICT (+16d launch / +10d landing) + the 0d single-form coincidence. Reproducibility-test pending at v647+ for the sub-form pre-album-single 0d-coincidence substrate.

**Discipline-relevant implication:** the W0 brief substrate-axis enumeration operated on album-form indexing without sub-form pre-album-single screening. Future MUS-track W0 briefs should screen for lead-single release dates inside the strict ±21d window even when the album release falls inside-strict; the pre-album-single 0d-coincidence is a substrate-class distinct from album-form 0d-coincidence. The reproducibility-test for the sub-form will surface at v647+ when an album-pick has both INSIDE-strict album release and INSIDE-strict pre-album-single release in a tight launch-anchor proximity configuration.

**Discovery condition:** the W0 brief's MUS 1.110 candidate window analysis listed The Police *Synchronicity* chart-continuity, Asia *Alpha* boundary, Genesis *Genesis* boundary, and "W1-MUS to identify INSIDE-strict candidates" — but did not anticipate the discovery that a single from a forthcoming album would post-date the W0 brief's primary album-candidate enumeration. W1-MUS web search against Huey Lewis and the News *Sports* discography surfaced the "Heart and Soul" single release date as the exact STS-8 launch day.

### Lesson #10216 status: EMITTED + CLOSED IN-CLUSTER

The 0d substrate-coincidence sub-form is now documented as second-tightest cohort proximity at single-form level.

### Lesson #10217 — Substrate-monoculture-risk resolution via framing-distinction at obs#2

**Surfaced at:** v1.49.646 W1-ELC dispatch (W0 FA-646-3 routed to W1)

**Observation:** The W0 brief flagged FA-646-3 substrate-monoculture-risk for KAL 007 against NASA night-launch-night-landing safety-window emphasis (both aviation-safety angle). v645's W1-ELC had applied framing-distinction (Pioneer 10 spaceflight-firsts vs G7 Williamsburg international-coalition) to resolve substrate-monoculture-risk for the v645 ELC pick. v646's W1-ELC applies the same pattern — framing-distinction between Cold-War political (KAL 007 substrate) and aviation-safety (NASA night-operations substrate). The two substrates are categorically distinct even though both occur in the aviation domain — KAL 007 substrate is about US-USSR strategic confrontation + Soviet civil-leadership crisis-management failure + Congressional casualty + worldwide public response; NASA night-operations substrate is about Shuttle program timing-of-day envelope.

**Closure:** W1-ELC analysis confirmed KAL 007 framing as Cold-War political. The alternative candidates (Apollo Theater National Historic Landmark designation; Beirut barracks bombing; Stanislav Petrov nuclear false-alarm) were ruled out on strict-window criteria (Apollo Theater NHL designated November 1983 not August; Beirut at +48d landing-anchor OUTSIDE strict; Petrov ineligible by public-record-availability-at-time-of-incident criterion). KAL 007 remained the only viable INSIDE-strict candidate and was selected on framing-distinction grounds.

**Discipline-relevant implication:** the framing-distinction pattern reproduces from v645 to v646 (obs#2). Future degree-advance milestones should expect substrate-monoculture-risk flags at W0 and should anticipate framing-distinction as the primary resolution pattern rather than substrate-pivot to an outside-strict candidate. The pattern (W0 raises substrate-risk; W1 resolves via framing-distinction; W2 ships) is now the cohort's substrate-architecture standard for handling potential cross-track substrate-overlap.

**Discovery condition:** W0 brief substrate-axis enumeration operates at substrate-event-mention indexing; W1 dispatch operates at substrate-frame-analysis depth. The substrate-monoculture-risk flag at W0 anticipates the framing question without committing to a framing-decision; W1 resolves the framing question through substrate-analysis. The pattern's value: substrate-monoculture-risk does not force a substrate-pivot to a less-tight candidate when framing-distinction is available.

### Lesson #10217 status: EMITTED + CLOSED IN-CLUSTER

The substrate-monoculture-risk-resolution via framing-distinction pattern is now confirmed at obs#2 (post-v645 obs#1).

### Lesson #10218 — lb/kg confusion at brief-authoring; W1 numerical-field verification catches conversion errors

**Surfaced at:** v1.49.646 W1-NASA dispatch

**Observation:** The W0 brief stated PFTA mass as 8,300 kg without source citation. The actual mass is 3,855 kg / 8,500 lb. The "8,300 kg" figure was a confused conversion from 8,500 lb — note that 8,500 lb converts to approximately 3,855 kg (using 1 lb ≈ 0.4536 kg), and the W0 brief figure of 8,300 kg appears to have arisen from either (a) carrying the imperial-units number through and replacing the unit-label only, or (b) a partial unit-conversion that did not complete. W1-NASA verification across Wikipedia STS-8 + NASA history articles + AmericaSpace retrospectives + Spaceline fact sheet confirmed the correct figures.

**Closure:** in-flight patch to MISSION-BRIEF.md correcting PFTA mass from 8,300 kg to 3,855 kg / 8,500 lb. The 2.5× SPAS-01 mass scale-up substrate observation (PFTA 3,855 kg vs v645 SPAS-01 ~3,300 kg) propagates through the W2 build at the substrate-correct scale. The substrate-form PFTA-AS-RMS-PAYLOAD-MASS-EXERCISE-AS-DELIVERABLE locks at the corrected scale.

**Discipline-relevant implication:** the W0 brief authoring stage does not perform unit-system verification at the numerical-field level. Future degree-advance W0 briefs should — at minimum — cite the source for each numerical-field that mixes unit systems (kg vs lb; km vs nm; m vs ft; UTC vs local-time). W1 dispatch verifies numerical-fields against primary sources by default; the gap between W0 substrate-framing and W1 ground-truth-verification is the discovery condition for this class of error. The lb/kg confusion is the cohort's first observation of a numerical-conversion error caught by W1 fact-check.

**Discovery condition:** W0 brief authoring operates on substrate-framing decisions at the substrate-event-mention level without ground-truth-verification at the numerical-field level. W1 dispatch's web-search discipline catches the gap by independent verification against primary sources. The discovery condition is structurally identical to v645's Bob Jones case (date + authorship error caught by W1-ELC ground-truth verification) and the BIPOD-RAMP-FOAM-SHEDDING case (substrate-axis surfaced by W1-NASA web research) — all three errors survive the W0 authoring layer because W0 indexes substrate-event-mention against substrate-frame-decisions without numerical/factual ground-truth-verification at the field level.

### Lesson #10218 status: EMITTED + CLOSED IN-CLUSTER

The lb/kg confusion case is now documented as the third class of W1-fact-check-catches-W0-error pattern (after the v645 Bob Jones date+authorship case and the v645 BIPOD-RAMP-FOAM-SHEDDING substrate-axis-surfacing case).

## Cross-references to prior lessons load-bearing this milestone

| Lesson | Description | Application at v646 |
|---|---|---|
| #10180 | Skip-guard pattern recognition | (latent; not triggered at v646) |
| #10187 | Mission package T1 commit OMITTED | applied — mission package never committed (gitignored + git-add-blocker) |
| #10191 | Ship-time directives atomic | will apply at v646 T14 |
| #10193 | Sub-agent token ceiling + iterative dispatch | applied — W1 + W2 + W3 dispatches bounded per-component; #10214 extends the constraint to per-output token ceiling at W2-index scale; #10215 extends to W1 retry-with-priors |
| #10196 | Forward-note RECOMMENDATION discipline | applied at W0 operator decision-point framing |
| #10197 | STORY-gate pipeline ordering | will validate 9th consecutive at v646 T14 |
| #10199 | Closure-verification gate (W0 §1.3) | NOT TRIGGERED (v646 is degree-advancing; no CFs to close) |
| #10201 | git-add-blocker false-positive on compound | applied — all commits use split git-add + git-commit |
| #10202 | gh CLI background-task git-discovery | (latent; no background gh in this cluster) |
| #10204 | Self-applying discipline | applied — Lessons #10214-10218 close via apply-to-self at v646 W4 |
| #10207 | §1.4 consistency at 4+ cluster threshold | NOT TRIGGERED (v646 is degree-advancing; no §1.4 re-framing) |
| #10208 | npm-audit probe threshold gap | NOT TRIGGERED (no npm advisories in this milestone) |
| #10209 | W1 fact-check corrections improve W0 brief in-flight | applied — five W1-surfaced corrections at v646 (PFTA mass + ET designation + Bluford squadron + Brandenstein mission count + HEART-AND-SOUL axis); obs#2 confirms the patching-workflow pattern from v645 |
| #10210 | Sub-agent web research surfaces NEW substrate axes not in W0 brief | applied — HEART-AND-SOUL-SINGLE-LAUNCH-DAY-0D-COINCIDENCE surfaced by W1-MUS as the 16th substrate axis not anticipated in W0 brief; pattern reproduces from v645 BIPOD-RAMP-FOAM-SHEDDING surface |
| #10211 | Taxonomic-currency requires post-publication-date validation | applied — Pacific Marten *Martes caurina* species-rank revival (Dawson + Cook 2012 + Colella et al. 2018) screened at W1-SPS; HUMBOLDT-STYLE-SPECIES-SPLIT-AWARENESS substrate reaffirms v645 G. oregonensis split at obs#2 cumulative |
| #10212 | Cohort-counting conventions need explicit footnoting at substrate divergence | applied — ET-9 LWT-2 fifth unpainted-orange by v633 convention; v646 footnote pattern reproduces from v645 ET-7 footnote |
| #10213 | 7-track-page canonical restoration | applied — v646 maintains canonical 27-file layout per A(100) scorer rubric target |

## Forward action items emitted at v646

| # | Action | Target |
|---|---|---|
| FA-646-1 | v647 W0 NASA candidate verify — STS-9 Columbia Spacelab-1 1983-11-28 = NASA 1.111 (Spacelab-1 maiden flight + first six-person crew + first non-US ESA astronaut Ulf Merbold + John Young sixth flight + Garriott + Lichtenberg + Parker + Shaw) | v647 W0 |
| FA-646-2 | v647 W1.TRS pack-33 mode-choice (candidates: robust + adaptive control as deferred-alternative from v646 / convex optimization / reinforcement learning / topology) | v647 W0 |
| FA-646-3 | v647 W1 NASA crew-size accumulator screen — 6-person Spacelab-1 crew extends from v645+v646 5-person; substrate transitions from 5-person-as-nominal-Shuttle-crew to 6-person-as-Spacelab-extended-crew; cross-track substrate parallels at MUS / ELC tracks pending | v647 W1 |
| FA-646-4 | RMS-RECURRING substrate continuation at v647 (Spacelab pallet RMS handling = obs#7 cumulative post-ESTABLISHED) | v647 W1 |
| FA-646-5 | Track v633-v646 NEW CANDIDATEs passive — HEART-AND-SOUL-SINGLE-LAUNCH-DAY-0D-COINCIDENCE reproducibility-test + POWER-STATION-IN-SECONDARY-MIXING-ROLE reproducibility-test + CLEARMOUNTAIN-AS-COHORT-RECURRING-MIXER obs#3 reproducibility-test | varied |
| FA-646-6 | v1.108 backfill question routing — operator decision required: (a) backfill, (b) accept baseline, (c) batched future retrospective; continues from FA-645-6 | operator |
| FA-646-7 | Phobos centennial STILL PENDING (continues from FA-633-9 + FA-645-7; 20 milestones since v617) | counter-cadence |
| FA-646-8 | Lean 4 proof-fill DEFERRED (continues from FA-633-10 + FA-645-8) | deferred |
| FA-646-9 | gsd-code-reviewer agent loop dedicated dispatch (continues from FA-633-11 + FA-645-9 PARTIAL; documentation-only at v646) | v647 W4 |
| FA-646-10 | BIPOD-RAMP-FOAM-SHEDDING-FORWARD-SHADOW substrate continuation at v647+ — substrate-anticipation pattern propagates forward through every Shuttle flight 1983-2003 until STS-107 closes the forward-shadow | continuous |
| FA-646-11 | HAUCK-AS-FUTURE-RTF-COMMANDER substrate continuation — Hauck commands STS-51-A 1984 (FA-646-11a) + STS-26 RTF 1988 (FA-646-11b) | v651 + v667 |
| FA-646-12 | TFNG-COHORT-CONTINUATION substrate continuation — Group 8 1978 multi-flight tracking through subsequent Shuttle missions (Sullivan v651; Resnik v656; McNair v656; Garriott to fly v647 from Group 4 Skylab pipeline) | continuous |
| FA-646-13 | SUBSTRATE-TRIO-AT-1983 anchoring closes at v646; subsequent demographic-broadening substrate-anchors will appear at STS-41-G (Kathryn Sullivan first American woman EVA 1984-10-11) + STS-51-A (Anna Lee Fisher first mother in space 1984-11-08) + STS-61-A (Spacelab D-1 1985-10-30 first 8-person crew + Furrer + Messerschmid + Ockels) | v651-v661 |
| FA-646-14 | W2-index size discipline — split JSON from HTML when bundled output exceeds ~50K tokens (Lesson #10214); apply at all subsequent degree-advance W2 dispatches | v647+ continuous |
| FA-646-15 | W1 retry-with-priors pattern documentation (Lesson #10215) — apply at W1 dispatch stalls in future milestones | continuous |

## NEW CANDIDATEs at v646 (16+ including HEART-AND-SOUL surfaced)

- FIRST-U.S.-NIGHT-SHUTTLE-LAUNCH-AS-DELIVERABLE
- FIRST-U.S.-NIGHT-SHUTTLE-LANDING-AS-DELIVERABLE
- FIRST-AFRICAN-AMERICAN-IN-SPACE-AS-DELIVERABLE
- SECOND-DUAL-SHUTTLE-FLIGHT-COMMANDER
- THIRD-CHALLENGER-FLIGHT-AS-OPERATIONAL-CADENCE-CONTINUATION
- PFTA-AS-RMS-PAYLOAD-MASS-EXERCISE-AS-DELIVERABLE
- SECOND-PHYSICIAN-ASTRONAUT
- INSAT-INTERNATIONAL-COMMERCIAL-DEPLOY-AS-DELIVERABLE
- FIRST-NON-NORTH-AMERICAN-GOVERNMENT-CUSTOMER-AS-DELIVERABLE
- FIVE-PERSON-CREW-OBSERVATIONAL-CADENCE-CONTINUATION
- TFNG-COHORT-CONTINUATION
- SUBSTRATE-TRIO-AT-1983-ANCHORING
- ANIMAL-BIOMEDICAL-EXPERIMENT-FIRST-AS-DELIVERABLE
- BLUFORD-AS-VIETNAM-COMBAT-VETERAN
- BLUFORD-AS-PHD-AEROSPACE-ENGINEER
- THORNTON-AS-OLDEST-AMERICAN-FLOWN
- BRANDENSTEIN-AS-FUTURE-MULTI-COMMAND
- HEART-AND-SOUL-SINGLE-LAUNCH-DAY-0D-COINCIDENCE (surfaced at W1-MUS)
- LAUNCH-ANCHOR-PLUS-16D-INSIDE-STRICT
- BAY-AREA-RECORDING-AS-NEW-COHORT-REGION
- CHRYSALIS-RECORDS-AS-NEW-LABEL
- POWER-STATION-IN-SECONDARY-MIXING-ROLE
- CLEARMOUNTAIN-AS-COHORT-RECURRING-MIXER
- ARTIST-AS-CO-PRODUCER-WITH-MANAGER
- #1-SLOW-BUILD-CHART-CADENCE
- MULTI-SINGLE-TOP-20-CADENCE
- BAR-BAND-AS-MAINSTREAM-BREAKOUT
- KAL-007-AS-COLD-WAR-CIVIL-AVIATION-INCIDENT-AS-DELIVERABLE
- GPS-AS-PUBLIC-SERVICE-PIVOT
- CONGRESSIONAL-CASUALTY-AS-FIRST-IN-FIVE-YEARS
- CIVILIAN-VICTIMS-AS-COLD-WAR-COLLATERAL
- SISTER-FLIGHT-NEAR-MISS-AS-COLD-WAR-CONGRESSIONAL-NEAR-LOSS
- REAGAN-RHETORIC-ESCALATION-AS-EVIL-EMPIRE-RESONANCE
- SOVIET-RULE-CRISIS-MANAGEMENT-AS-INSTITUTIONAL-FAILURE
- BLACK-BOX-DISCLOSURE-AS-POST-SOVIET-DIVIDEND
- ICAO-AS-MULTILATERAL-INVESTIGATIVE-AUTHORITY
- TROPHIC-LEVEL-PIVOT-AS-DELIVERABLE
- FIRST-CARNIVORA
- FIRST-MUSTELIDAE
- HUMBOLDT-STYLE-SPECIES-SPLIT-AWARENESS (obs#2 reaffirm)
- HUMBOLDT-MARTEN-CRITICAL-ENDANGERMENT
- PREDATOR-OF-V645-SPECIES
- ARBOREAL-MESOCARNIVORE
- CAVITY-USER-PREDATOR-EXTENSION-TO-V633-KEYSTONE-SUBSTRATE
- BIOACOUSTIC-SPARSITY-vs-v645-ULTRASONIC-RICHNESS
- SECOND-CONSECUTIVE-MAMMALIA
- GAME-THEORY-AS-MULTI-AGENT-CREW-COORDINATION-FORMAL-LANGUAGE
- NASH-EQUILIBRIUM-AS-CREW-CONSENSUS
- STACKELBERG-AS-CDR-PLT-HIERARCHY
- DIFFERENTIAL-GAMES-AS-RMS-PFTA-HANDLING
- BAYESIAN-GAMES-AS-NIGHT-LAUNCH-WEATHER-DECISION
- MECHANISM-DESIGN-AS-NASA-GROUP-8-AFFIRMATIVE-ACTION-SELECTION
- SHAPLEY-VALUE-AS-CREW-MISSION-CREDIT-ALLOCATION
- KAL-007-AS-ZERO-SUM-COLD-WAR-GAME (TRS × ELC cross-track substrate-resonance)
- CORRELATED-EQUILIBRIUM-AS-MISSION-CONTROL-SIGNAL
