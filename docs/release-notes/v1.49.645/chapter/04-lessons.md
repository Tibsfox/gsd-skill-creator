# v1.49.645 — Forward Lessons

## Emitted lessons (continuing from cluster #11's last lesson #10208)

### Lesson #10209 — W1 fact-check corrections improve W0 brief in-flight (Bob Jones case study)

**Surfaced at:** v1.49.645 W1-ELC dispatch

**Observation:** The W0 brief listed Bob Jones University v. United States as a substrate-viable ELC alternate-candidate at 1983-06-23 authored by Sandra Day O'Connor. The W1-ELC dispatch performed an independent web search against the case record (Wikipedia + Justia + Cornell LII + Oyez) and surfaced corrections to both fields: the case was decided **1983-05-24** (not 1983-06-23) with majority opinion authored by **Chief Justice Warren E. Burger** (not Justice O'Connor; Burger joined by Brennan + White + Marshall + Blackmun + Stevens + O'Connor; Powell concurring in part; Rehnquist sole dissent). The corrected date places the ruling at **−25d OUTSIDE strict ±21d** from STS-7 launch, rejecting the alternate-candidate framing entirely.

**Closure:** in-flight patch to MISSION-BRIEF.md before W2 dispatch. The patched brief became the operational reference for W2 + W3 + W4. The Williamsburg Summit remains the sole viable INSIDE-strict ELC pick.

**Discipline-relevant implication:** W0 brief authoring operates on substrate-framing-decisions; W1 dispatch verifies the substrate-frame against ground-truth citations and corrects in-flight without re-architecting the brief. The patching workflow (W0 brief → W1 corrections → patched brief → W2 build) is the operational sequence that future degree-advance milestones should use.

**Discovery condition:** the gap survived the W0 authoring because W0 indexed substrate-event-mention against substrate-frame-decisions without ground-truth-verification at the field level. W1 dispatch's web-search discipline caught the gap by independent verification against the case record. The risk of similar gaps in W0 briefs for future degrees remains latent but discoverable by W1 ground-truth verification.

### Lesson #10209 status: EMITTED + CLOSED IN-CLUSTER

The fact-check loop's structural value is now documented for future degree-advance milestone authors.

### Lesson #10210 — Sub-agent web research surfaces NEW substrate axes not in W0 brief (BIPOD-RAMP-FOAM-SHEDDING case)

**Surfaced at:** v1.49.645 W1-NASA dispatch

**Observation:** The W0 brief enumerated 15 substrate primary axes anchored at STS-7 mission-event level (first American woman, first five-person crew, first dual-flight commander, first RMS deploy-and-retrieve, etc.). The W1-NASA research dispatch surfaced a 16th axis through web search against post-flight imagery review documentation: ET-7 shed a 50-by-30-centimeter piece of bipod-ramp foam during ascent, documented but not flight-critical, with no design changes implemented until after the 2003 Columbia accident. The substrate-anticipation pattern (observed → normalized as "no-cause-for-concern" → causal-chain root for STS-107 loss-of-vehicle) propagates forward 20 years at a magnitude that dwarfs the 3-to-5-year HAUCK-AS-FUTURE-RTF-COMMANDER forward-shadow.

**Closure:** in-flight patch to MISSION-BRIEF.md adding **BIPOD-RAMP-FOAM-SHEDDING-FORWARD-SHADOW** as a NEW LOCKED candidate (16th substrate primary axis). W2-NASA picked up the patched brief and incorporated the substrate-anticipation pattern into the track narrative.

**Discipline-relevant implication:** W0 brief substrate-axis enumeration is necessarily incomplete relative to W1 ground-truth research. Future degree-advance briefs should anticipate ≥10% W1-surfaced substrate-axis additions (1-2 new axes per 15-axis W0 brief). The W0 brief's role is to scaffold the substrate-architecture; W1's role is to deepen the substrate-event indexing through ground-truth web research.

**Discovery condition:** W0 brief authoring operated on substrate-event-mention indexing (NASA press releases + Wikipedia article structure) rather than post-flight-imagery-review indexing (Spaceflight Now archival foam-shedding feature + Columbia Accident Investigation Board report references + NASA history-office STS-7 retrospective). The new axis required indexing against documents that were not in the W0 author's natural reading path.

### Lesson #10210 status: EMITTED + CLOSED IN-CLUSTER

### Lesson #10211 — Taxonomic-currency requires post-publication-date validation (Arbogast 2017 G. oregonensis split case)

**Surfaced at:** v1.49.645 W1-SPS dispatch

**Observation:** The W0 brief listed Northern Flying Squirrel as *Glaucomys sabrinus* without acknowledging that Arbogast et al. 2017 (*Journal of Mammalogy* 98(4):1027-1041) had split *G. oregonensis* (Humboldt's Flying Squirrel) as a separate species occupying the PNW coastal corridor formerly assigned to *G. sabrinus oregonensis*. The split has been accepted by the American Society of Mammalogists, IUCN, and the National Center for Biotechnology Information taxonomy database — establishing it as the contemporary taxonomic standard. The v645 cohort entry remains valid *G. sabrinus sensu stricto* (continental clade + remaining coastal sympatric populations) but must explicitly acknowledge the cryptic-species-recognition.

**Closure:** in-flight patch to MISSION-BRIEF.md adding **HUMBOLDT-SPECIES-SPLIT-AWARENESS** as NEW LOCKED sub-form. The v645 cohort entry holds *G. sabrinus s.s.* with explicit acknowledgement of the taxonomic update.

**Discipline-relevant implication:** SPS cohort entries dating from pre-2000 taxonomy may have post-publication-date validation requirements where contemporary molecular phylogenetics has split or lumped previously-recognized species. Future SPS picks should screen for: (a) recent species-splits affecting the candidate species; (b) recent species-lumps affecting the candidate species; (c) IUCN status changes affecting conservation-relevant substrate-forms. The screening should occur at W1 dispatch; W0 brief enumeration operates on substrate-framing without ground-truth taxonomic verification.

**Discovery condition:** W0 brief operated on common-name + canonical-Latin-name indexing; W1-SPS dispatch performed an independent taxonomic-currency check against Arbogast et al. 2017 + IUCN Red List + American Society of Mammalogists Mammal Diversity Database. The gap survived the W0 authoring because the canonical-Latin-name (*G. sabrinus*) remains valid at v645; the missing element was the explicit acknowledgement of the 2017 split.

### Lesson #10211 status: EMITTED + CLOSED IN-CLUSTER

### Lesson #10212 — Cohort-counting conventions need explicit footnoting at substrate divergence (ET-7 case)

**Surfaced at:** v1.49.645 W2-NASA dispatch

**Observation:** The v633 cohort-counting convention starts the unpainted-orange-ET sequence at ET-4 (first unpainted), making the v645 ET-7 the fourth-unpainted-orange ET. The Wikipedia ET-article convention starts the unpainted-orange sequence at ET-3 (first unpainted; the first ET to ship in unpainted-orange configuration in the program), making the v645 ET-7 the fifth-unpainted-orange ET. Both conventions are internally self-consistent; the divergence arises from the substrate-decision about which ET counts as the first instance of the substrate.

**Closure:** W2-NASA footnote rather than re-litigation. The v645 cohort-counting convention holds v633's starting-point (ET-4 = first unpainted-orange); the deliverable holds ET-7 = fourth-unpainted-orange; readers consulting Wikipedia independently will reach the alternative count of ET-7 = fifth. The footnote preserves both substrate-continuity (v633 → v645 convention) and citation-anchor integrity (Wikipedia reference acknowledged).

**Discipline-relevant implication:** future degree-advance milestones touching v633-anchored substrate decisions should screen for cohort-counting-convention dependencies at W0. The substrate-disambiguation requirement (which starting-point holds for the cohort-counting series) should be raised in W0 brief if the candidate degree's substrate-track has any cohort-counting-convention precedent in prior degrees.

**Discovery condition:** W0 brief substrate-axis enumeration did not include cohort-counting-convention disambiguation; the divergence surfaced at W2 authoring time when the W2-NASA author cross-referenced the v633 convention against the contemporary Wikipedia ET-article. The footnote pattern handled the disambiguation gracefully but a forward-looking W0 brief should pre-screen for this class of disambiguation.

### Lesson #10212 status: EMITTED + CLOSED IN-CLUSTER

### Lesson #10213 — 7-track-page canonical restoration vs v1.108 consolidated-index degradation

**Surfaced at:** v1.49.645 W2 build pre-flight

**Observation:** v1.108 (STS-6 Challenger; v1.49.633) shipped at depth-audit WARN×2 (NASA 88%/90%; ELC 80%/89%) and under-shipped the 14-artifact canonical target. The pattern: v1.108 consolidated some track content into the index.html rather than emitting the full 7-track-page layout + 14 artifacts. v1.109 restores the canonical 27-file mission deliverable (7 track HTMLs + 14 artifacts + 3 markdown sources + 1 degree-sync.json + 2 JSON data files) and targets A(100) on the depth-audit rubric.

**Closure:** v645 W2 dispatch explicitly authored against the canonical 27-file layout. The W3 stage emits all 14 artifacts per the `.planning/NASA-DEGREE-CANONICAL.md` §7 specification.

**Discipline-relevant implication:** depth-audit WARN-shipped degrees create substrate-disambiguation requirements for downstream substrate-continuity testing. v1.108 → v1.109 is one example; future v1.110+ degrees built on the v1.109 canonical-restoration baseline should not regress to v1.108's consolidated-index pattern. The discipline machinery should validate canonical-layout at W2 dispatch time, not at depth-audit time.

**Forward-relevant question (NOT formally emitted as a lesson):** does v1.108 get a backfill cluster to restore A(100) compliance, or does it remain at its 88%/90% / 80%/89% baseline as the historical ship-state? Decision is operator-routed. Possible paths: (a) backfill v1.108 + similar WARN-shipped predecessors; (b) accept v1.108 as historical baseline and forward-only from v1.109; (c) batched backfill at a future cohort-wide retrospective.

### Lesson #10213 status: EMITTED + CLOSED IN-CLUSTER

## Cross-references to prior lessons load-bearing this milestone

| Lesson | Description | Application at v645 |
|---|---|---|
| #10180 | Skip-guard pattern recognition | (latent; not triggered at v645) |
| #10187 | Mission package T1 commit OMITTED | applied — mission package never committed (gitignored + git-add-blocker) |
| #10191 | Ship-time directives atomic | will apply at v645 T14 |
| #10193 | Sub-agent token ceiling + iterative dispatch | applied — W1 + W2 + W3 dispatches bounded per-component |
| #10196 | Forward-note RECOMMENDATION discipline | applied at W0 operator decision-point framing |
| #10197 | STORY-gate pipeline ordering | will validate 8th consecutive at v645 T14 |
| #10199 | Closure-verification gate (W0 §1.3) | NOT TRIGGERED (v645 is degree-advancing; no CFs to close) |
| #10201 | git-add-blocker false-positive on compound | applied — all commits use split git-add + git-commit |
| #10202 | gh CLI background-task git-discovery | (latent; no background gh in this cluster) |
| #10204 | Self-applying discipline | applied — Lessons #10209-10213 close via apply-to-self at v645 W4 |
| #10207 | §1.4 consistency at 4+ cluster threshold | NOT TRIGGERED (v645 is degree-advancing; no §1.4 re-framing) |
| #10208 | npm-audit probe threshold gap | NOT TRIGGERED (no npm advisories in this milestone) |

## Forward action items emitted at v645

| # | Action | Target |
|---|---|---|
| FA-645-1 | v646 W0 NASA candidate verify — STS-8 Challenger 1983-08-30 = NASA 1.110 (first U.S. night launch + first U.S. night landing + Guion S. Bluford Jr. first African American in space + INSAT-1B deploy + PFTA RMS exercises) | v646 W0 |
| FA-645-2 | v646 W1.TRS pack-32 mode-choice (candidates: differential geometry / topology / linear algebra cluster-completion / number theory) | v646 W0 |
| FA-645-3 | v646 W1 NASA substrate-trio screen — v633 Harold Washington (FIRST-AFRICAN-AMERICAN-BIG-CITY-MAYOR) + v645 Sally Ride (FIRST-AMERICAN-WOMAN-IN-SPACE) + v646 candidate Guion Bluford (FIRST-AFRICAN-AMERICAN-IN-SPACE) form 5-month substrate-trio: 1983-04-12 → 1983-06-18 → 1983-08-30. The substrate-resonance should be anchored explicitly at v646 W0. | v646 W0 |
| FA-645-4 | RMS-RECURRING substrate continuation at v646 (STS-8 PFTA Payload Flight Test Article 8,300 kg RMS handling exercises = obs#6 cumulative post-ESTABLISHED) | v646 W1 |
| FA-645-5 | Track v633-v645 NEW CANDIDATEs passive — Padgham-producer-continuity + AIR-Studios-Montserrat-as-cohort-node + Le-Studio-Morin-Heights-secondary-recording-location + Jungian-synchronicity-as-substrate-concept | varied |
| FA-645-6 | v1.108 backfill question routing — operator decision required: (a) backfill, (b) accept baseline, (c) batched future retrospective | operator |
| FA-645-7 | Phobos centennial STILL PENDING (FA-633-9 continues; 19 milestones since v617) | counter-cadence |
| FA-645-8 | Lean 4 proof-fill DEFERRED (FA-633-10 continues) | deferred |
| FA-645-9 | gsd-code-reviewer agent loop dedicated dispatch (FA-633-11 continues PARTIAL; documentation-only at v645) | v646 W4 |
| FA-645-10 | BIPOD-RAMP-FOAM-SHEDDING-FORWARD-SHADOW substrate continuation at v646 + subsequent Shuttle milestones — substrate-anticipation pattern propagates forward through every Shuttle flight 1983-2003 until STS-107 closes the forward-shadow | continuous |
| FA-645-11 | HAUCK-AS-FUTURE-RTF-COMMANDER substrate continuation — Hauck commands STS-51-A 1984 (FA-645-11a) + STS-26 RTF 1988 (FA-645-11b) | v651 + v667 |
| FA-645-12 | TFNG-COHORT-DEBUT substrate continuation — Group 8 1978 multi-flight tracking through subsequent Shuttle missions (Bluford v646; Sullivan v651; Resnik v656; etc.) | continuous |

## NEW CANDIDATEs at v645 (10+)

- FIRST-AMERICAN-WOMAN-IN-SPACE-AS-DELIVERABLE
- THIRD-WOMAN-IN-SPACE
- FIRST-FIVE-PERSON-SHUTTLE-CREW-AS-NEW-CREW-SIZE-DELIVERABLE
- FIRST-DUAL-SHUTTLE-FLIGHT-COMMANDER-AS-DELIVERABLE
- FIRST-RMS-GRAPPLED-SATELLITE-DEPLOY-AND-RETRIEVE-AS-DELIVERABLE
- FIRST-FREE-FLYING-PHOTOGRAPHY-OF-SHUTTLE-IN-ORBIT-AS-DELIVERABLE
- FIRST-KSC-TARGETED-LANDING-DIVERTED-TO-EDWARDS-AS-DELIVERABLE
- SECOND-CHALLENGER-FLIGHT-AS-OPERATIONAL-CADENCE-CONTINUATION
- HAUCK-AS-FUTURE-RTF-COMMANDER-substrate-anticipation
- POST-EVA-RHYTHM-CADENCE-AS-DELIVERABLE
- THAGARD-AS-FIRST-MD-FLIGHT-CREW
- TFNG-COHORT-DEBUT
- BIPOD-RAMP-FOAM-SHEDDING-FORWARD-SHADOW
- LAUNCH-ANCHOR-MINUS-1-DAY-INSIDE-STRICT
- PADGHAM-PRODUCER-CONTINUITY
- AIR-STUDIOS-MONTSERRAT-AS-COHORT-NODE
- LE-STUDIO-MORIN-HEIGHTS-AS-SECONDARY-RECORDING-LOCATION
- JUNGIAN-SYNCHRONICITY-AS-SUBSTRATE-CONCEPT
- FINAL-POLICE-ALBUM-AS-COHORT-NODE
- #1-US-17-WEEKS-DISPLACING-THRILLER
- G7-AS-FIRST-MULTILATERAL-INF-PRECURSOR-AS-DELIVERABLE
- REAGAN-AS-FIRST-G7-HOST
- FIRST-G7-WITH-NO-FOUNDING-PARTICIPANTS
- ECONOMIC-RECOVERY-COMMUNIQUE-PLUS-SECURITY-STATEMENT
- WILLIAMSBURG-AS-COLONIAL-RESTORATION-VENUE
- CASCADING-DEPENDENCY-AS-DELIVERABLE
- FIRST-MAMMALIA-CLASS-PIVOT-AFTER-SUSTAINED-AVES
- FIRST-SCIURIDAE
- FIRST-RODENTIA
- NOCTURNAL-GLIDING-AS-SPATIAL-DEPLOY-AND-RETRIEVE
- HUMBOLDT-SPECIES-SPLIT-AWARENESS
- TRUFFLE-MYCORRHIZAL-NETWORK-DEPENDENCY
- CONTROL-THEORY-AS-RMS-STATION-KEEPING-FORMAL-LANGUAGE
- SPAS-01-DEPLOY-AND-RETRIEVE-AS-LQR-FRAME
- KSC-TO-EDWARDS-DIVERT-AS-MPC-RECEDING-HORIZON
- KALMAN-FILTER-AS-RMS-NOISE-REJECTION
- HAUCK-AS-FUTURE-RTF-COMMANDER-AS-H-INFINITY-DESIGN
- SALLY-RIDE-OBSERVATIONS-AS-SENSOR-FUSION
