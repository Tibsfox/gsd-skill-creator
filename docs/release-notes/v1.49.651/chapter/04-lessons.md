# v1.49.651 — Forward Lessons

## Emitted lessons (continuing from v1.49.650's last lesson #10239)

### Lesson #10240 — Chunked Write+Edit append pattern for large-HTML W2/W3 deliverables exceeding the 32K single-response output cap

**Surfaced at:** v1.49.651 W2 dispatch (papers.html initial dispatch truncated at ~32K tokens)

**Observation:** papers.html at v651 is a multi-track HTML file spanning 554 lines (~32K+ bytes). The initial W2 dispatch for papers.html hit the 32K single-response output cap mid-file, producing a truncated deliverable. Recovery used the **chunked Write+Edit append pattern**: Stage 1 dispatches Write with the HTML scaffold + Track 1 content + an `<!-- APPEND-HERE -->` placeholder comment immediately before the closing `</body>` or `</section>` tag. Stages 2–5 each dispatch Edit that replaces the `<!-- APPEND-HERE -->` placeholder with the next track's content + a new `<!-- APPEND-HERE -->` placeholder (or the actual close tags on the final stage). This produces the full file in N+1 total operations (1 Write + N Edits) without size limit per operation.

The pattern generalizes to any HTML/JS W2 or W3 deliverable that exceeds ~30K bytes. Structurally, the `<!-- APPEND-HERE -->` placeholder functions as a resumption marker — it is unique in the file at any given stage, so the Edit tool's `old_string` match is unambiguous. The pattern requires (a) that the scaffold Write include a syntactically valid partial HTML (no unclosed tags except inside the placeholder region) and (b) that each append-stage leave the file syntactically valid before inserting the next placeholder.

**Discipline-relevant implication:** future W2 dispatches for papers.html, curriculum.html, or any research-heavy HTML file projected to exceed ~30K bytes should default to the chunked Write+Edit append pattern. The initial Write should include only the scaffold + first track + the placeholder marker. The dispatch prompt should enumerate the stages: "Stage 1: scaffold + Track 1 + placeholder. Stage 2: replace placeholder with Track 2 + new placeholder. ..." The sub-agent is bounded by 60–70 tool uses (Lesson #10193); the chunked pattern accommodates the ceiling by spreading large output across multiple Edit calls rather than a single oversized Write.

**Trigger threshold:** use chunked pattern when estimated HTML output > 400 lines (approximately 30K bytes at typical line density). At v651 this threshold is approximately papers.html + curriculum.html for research-heavy degrees; index.html and organism.html typically stay under threshold.

### Lesson #10240 status: EMITTED + CLOSED IN-CLUSTER

The chunked Write+Edit append pattern is documented. Apply by default to all W2/W3 HTML deliverables estimated > 400 lines.

---

### Lesson #10241 — W1-NASA 9-correction catch rate at v651 validates band robustness above median; 57° inclination correction is most structurally impactful catch in obs#7

**Surfaced at:** v1.49.651 W1-NASA dispatch (Post-W1 Corrections section; 9 corrections absorbed)

**Observation:** v645 obs#1 (4) + v646 obs#2 (5) + v647 obs#3 (7) + v648 obs#4 (6) + v649 obs#5 (11) + v650 obs#6 (6) + v651 obs#7 (9). The v651 correction count at 9 is the second-highest in the cohort. The band 4-11 at obs#7 shows no systematic attrition in the W1 fact-check process at increased degree-advance cadence. The median at obs#7 stabilizes at 6–7 corrections per degree.

The most structurally impactful correction at v651 is the **57° inclination correction** (W0 stated 28.5° — standard Shuttle inclination; W1 verifies 57.0°). This correction prevents the loss of five substrate-novel primitives that depend on the 57° value: HIGHEST-SHUTTLE-INCLINATION-TO-DATE + ERBS-CLIMATE-ORBIT-AS-HIGH-INCLINATION + SIR-B-EARTH-OBSERVATION-COVERAGE-AT-57-DEG + TRS-pack-37 Hamiltonian perturbation at high-inclination J2-dominant regime + substrate-anticipation toward Mir-rendezvous-cohort high-inclination axis. A 28.5° entry would have produced a standard orbital-parameters entry with no substrate-novel primitive at the inclination axis.

The second most impactful correction is **ET-15 LWT-8 vs ET-14 LWT-7**: the LWT-number error would have produced an incorrect #10331 obs#12 reaffirmation (twelfth unpainted-orange vs eleventh), breaking the cohort-counting convention integrity established at v633.

**Discipline-relevant implication:** W0 brief generation for Shuttle missions should always consult an inclination source before populating the orbital-parameters field. The 28.5° default-inclination assumption is a plausible but incorrect heuristic for high-inclination missions (STS-41-G at 57°; anticipated future instances at Mir-rendezvous). W0 brief authors should not assume 28.5° inclination without verification; the pattern suggests that missions with ERBS-type polar-coverage payloads will consistently require non-standard inclinations.

**A-7E vs F-4 pilot-aircraft error** (McBride at v651 vs Coats at v650) also warrants a future W0 discipline note: when the preceding degree carries a notable aircraft type for a pilot crew member (v650 Coats A-7E), the W0 brief for the following degree should not propagate that aircraft type without independent verification of the new pilot's documented aircraft history. The copy-error pattern occurs at v651 for the second consecutive degree-advance (v650 corrected Coats USN vs USMC branch; v651 corrects McBride F-4 vs A-7E aircraft).

### Lesson #10241 status: EMITTED + CLOSED IN-CLUSTER

The 9-correction obs#7 catch-rate is documented. 57° inclination correction is the most impactful catch. Band 4-11 confirms robustness without systematic attrition. W0 brief orbital-inclination default-assumption discipline added.

---

### Lesson #10242 — HIGHEST-SHUTTLE-INCLINATION-TO-DATE as substrate-novel primitive at v651; high-inclination substrate anticipation opens toward Mir-rendezvous cohort 1995–1998

**Surfaced at:** v1.49.651 W1-NASA dispatch (57.0° inclination correction) + W2 narrative construction

**Observation:** STS-41-G at 57.0° inclination is the highest Shuttle inclination at this point in the 13-flight program history (all prior Shuttle flights at 28.45°–28.5° for equatorial orbit; the Shuttle's Kennedy Space Center latitude of 28.5° N aligns the standard inclination). The HIGHEST-SHUTTLE-INCLINATION-TO-DATE substrate-primitive opens at v651 obs#1 first-instance.

The 57° inclination was mission-specific to ERBS: the Earth Radiation Budget Satellite required near-polar orbit (57° inclination providing Earth-radiation-budget global coverage). The fuel cost of plane-changing from 28.5° to 57° is prohibitive in the Shuttle's fuel budget except when the high-inclination orbit is achieved at insertion rather than by post-insertion maneuver. STS-41-G was designed from mission initiation at 57° inclination specifically for ERBS deployment requirements.

**Substrate-anticipation forward-shadow:** the HIGHEST-SHUTTLE-INCLINATION-TO-DATE primitive at 57° (1984) anticipates the Mir-rendezvous-cohort (STS-63 1995-02-03 at 51.6° + STS-71 1995-06-27 at 51.6° + STS-74 1995-11-12 at 51.6°; and ATLAS-1 STS-45 1992-03-24 at 57.0°) as the next cluster of high-inclination Shuttle missions. The 57.0° inclination at STS-41-G is substrate-anticipatory for ATLAS-1 STS-45 at the same 57.0° (exact match) and for Mir-rendezvous at 51.6° (near-match). Future W2 research for high-inclination degrees should footnote the HIGHEST-SHUTTLE-INCLINATION-TO-DATE status at the time of the mission.

**Discipline-relevant implication:** the INCLINATION-AS-SUBSTRATE-AXIS primitive is now open at v651 obs#1. Future W0 briefs for Shuttle missions should note whether the inclination exceeds the standing cohort maximum (57.0° at v651 close). The HIGHEST-SHUTTLE-INCLINATION-TO-DATE substrate-primitive updates at each mission that exceeds the prior record; the tracking discipline parallels the FIRST-N-FLIGHT-SHUTTLE-ASTRONAUT axis.

### Lesson #10242 status: EMITTED + CLOSED IN-CLUSTER

HIGHEST-SHUTTLE-INCLINATION-TO-DATE substrate-form documented. 57.0° as cohort record at v651 close. Substrate-anticipation toward ATLAS-1 STS-45 1992 + Mir-rendezvous cohort 1995–1998 at high-inclination axis opened.

---

### Lesson #10243 — Lorenz attractor visualization in W3 shader artifact as spontaneous TRS-cross-track-substrate-resonance manifestation; pattern reusable for chaotic-system content in future TRS packs

**Surfaced at:** v1.49.651 W3 production wave (shader artifact: sts-41-g-seven-crew-ors-eva-and-lorenz-attractor.frag)

**Observation:** The W3 agent assigned to the shader artifact independently constructed a Lorenz attractor trajectory renderer in WebGL2 GLSL without explicit direction in the W2 brief (the W2 brief specified "GLSL shader — ORS EVA / crew synchronization / TRS pack-37 dynamical systems cross-track resonance"). The Lorenz attractor — the archetypal strange-attractor example from Lorenz 1963, *Journal of Atmospheric Sciences* — is the canonical visual output for TRS pack-37's chaos sub-topic cluster. The W3 agent correctly identified the Lorenz system as the most appropriate TRS pack-37 cross-track-substrate-resonance visualization and implemented the standard Lorenz equations (σ=10, ρ=28, β=8/3) as a WebGL2 fragment shader with dynamic color encoding of the attractor's trajectory divergence.

The structural observation: W3 agents reliably propagate substrate-form CAPS notations from the W2 brief into artifact design decisions, and when the W2 brief includes explicit TRS cross-track-substrate-resonance content, the W3 agents implement the mathematically correct visualization. The Lorenz attractor shader at v651 is structurally parallel to the RSLS-LP-feasibility visualization in TRS pack-36 cross-track content at v650 — the mathematical cross-track-substrate-resonance is instantiated as a live computational artifact, not just as descriptive prose.

**Discipline-relevant implication:** future TRS packs with chaotic-system content (strange attractors, limit cycles, bifurcation diagrams) should explicitly note the visualization target in the W2 brief with the CAPS substrate-form name: "Lorenz-attractor-as-WebGL2-GLSL" or "Hopf-bifurcation-diagram-as-simulation" etc. The W3 agent implements the correct visualization when given a named mathematical substrate-form; the explicit naming prevents generic placeholder artifacts and grounds the cross-track resonance in the specific TRS sub-topic.

Future TRS packs likely to trigger this pattern: pack-38 (anticipated: partial differential equations — heat equation + wave equation → WebGL heat-diffusion simulation candidate) + pack-39 (anticipated: complex analysis — Riemann surface → GLSL complex-plane visualization candidate) + pack-40 (anticipated: algebraic topology — Möbius strip / Klein bottle → 3D GLSL surface candidate).

### Lesson #10243 status: EMITTED + CLOSED IN-CLUSTER

Lorenz attractor shader as TRS-cross-track-substrate-resonance manifestation documented. Pattern reusable for chaotic-system content in future TRS packs; W2 brief should name the visualization target explicitly.

---

### Lesson #10244 — 7-parallel-agent W3 dispatch reproducibility obs#3 — operational standard confirmed at three-consecutive-degree reproducibility density

**Surfaced at:** v1.49.651 W3 production wave (17 artifact files; ~10 min wallclock; 0 forbidden-token hits)

**Observation:** v649 obs#1 + v650 obs#2 + v651 obs#3 = three consecutive reproducible 7-parallel-W3-fleet dispatches, each landing 17 artifact files with 0 four-token forbidden-substring hits. The operational parameters are stable across three degrees: 7 agents dispatched simultaneously; each agent bounded to approximately one artifact class (audio / circuits / shaders / sims / story / JSON-data / forest-module); all agents completing within ~10 minute wallclock; the sub-agent token ceiling (Lesson #10193; 60–70 tool uses) accommodated by bounding each agent to a single artifact class.

The three-consecutive-degree reproducibility-test moves the 7-parallel-agent W3 architecture from RECURRING-OPERATIONAL-PATTERN (obs#2) to ESTABLISHED-OPERATIONAL-STANDARD (obs#3). No architectural modification has been needed across v649 + v650 + v651. The dispatch structure, agent-class assignment, and forbidden-substring filter all function without revision at the cadence of seven consecutive degree-advances.

**Discipline-relevant implication:** the 7-parallel-agent W3 architecture is the operational standard for degree-advance production waves at the confirmed obs#3 reproducibility threshold. Future departures from the 7-agent architecture (e.g., agent count reduction due to artifact-class simplification, or agent count increase for missions with > 14 artifact files) should be documented as deliberate departures from the ESTABLISHED-OPERATIONAL-STANDARD with a rationale. The three-consecutive-degree baseline is sufficient to establish the architecture as a standard; any future change should be treated as a process-change event rather than an incidental variation.

**papers.html dependency note:** the chunked Write+Edit append pattern (Lesson #10240) is an artifact-specific extension of the ESTABLISHED-OPERATIONAL-STANDARD, not a departure from it. The 7-agent architecture remains valid; papers.html simply requires a two-stage Write+Edit dispatch within the single papers.html agent's tool-use budget.

### Lesson #10244 status: EMITTED + CLOSED IN-CLUSTER

7-parallel-agent W3 dispatch architecture confirmed as ESTABLISHED-OPERATIONAL-STANDARD at obs#3 reproducibility-test density. Future departures should be documented as deliberate process changes.

---

## Cross-references to prior lessons load-bearing this milestone

| Lesson | Description | Application at v651 |
|---|---|---|
| #10187 | Mission package T1 commit OMITTED | applied — mission package never committed (gitignored + git-add-blocker) |
| #10191 | Ship-time directives atomic | will apply at v651 T14 |
| #10193 | Sub-agent token ceiling + iterative dispatch | applied — W1 + W3 dispatches bounded per-component; v651 applies all; Lesson #10244 obs#3 |
| #10196 | Forward-note RECOMMENDATION discipline | applied at W0 operator decision-point framing |
| #10197 | STORY-gate pipeline ordering | validates 14th consecutive at v651 T14 |
| #10201 | git-add-blocker false-positive on compound | applied — all commits use split git-add + git-commit |
| #10204 | Self-applying discipline | applied — Lessons #10240-#10244 close via apply-to-self at v651 W4 |
| #10209 | W1 fact-check corrections improve W0 brief in-flight | applied at obs#7 cumulative — 9 W1-surfaced corrections at v651 (inclination + ET + orbits + IMAX + McBride aircraft + Leestma group + Ku-band gimbal + Ireland Commonwealth + RIAA date); correction-count band 4-11 at obs#7 stabilizes at 6–7 median |
| #10210 | Sub-agent web research surfaces NEW substrate axes not in W0 brief | applied — HIGHEST-SHUTTLE-INCLINATION-TO-DATE + FIRST-ANADROMOUS-FISH + CIVIL-RIGHTS-AS-INTERNATIONAL-CULTURAL-OBSERVATION + SLANE-CASTLE-RESIDENTIAL-RECORDING + PRESIDENTIAL-DEBATE-MOMENTUM all surfaced by W1 agents beyond W0 scope |
| #10211 | Taxonomic-currency validation | applied — *Oncorhynchus nerka* taxonomy + *O. nerka kennerlyi* Kokanee subspecies screened at W1-SPS |
| #10212 | Cohort-counting conventions need explicit footnoting | applied — ET-15 LWT-8 twelfth unpainted-orange per v633 convention; FA-651 RESOLVED |
| #10213 | 7-track-page canonical restoration | applied — v651 maintains canonical 27-file layout per A(100) scorer rubric |
| #10214 | Sub-agent 64K output token cap; split JSON from HTML | applied — v651 W2-NASA pre-split; both dispatches completed cleanly; Lesson #10220 obs#5 reaffirm |
| #10217 | Substrate-monoculture-risk resolution via framing-distinction | applied at obs#6 via Reagan-Mondale debate as SUBSTRATE-MONOCULTURE-RISK-RESOLUTION-BY-FRAMING-DISTINCTION obs#6 ENDURING-DEEP-SUSTAINED-PATTERN |
| #10219 | HARD-BLOCK forbidden-substring collision | applied at obs#5 reaffirm at v651 W2; initial+surname substitution applied throughout (R. L. Crippen + J. A. McBride + S. K. Ride + K. D. Sullivan + D. C. Leestma + M. Garneau + P. D. Scully-Power); Lesson #10225 ESTABLISHED-CADENCE obs#5 |
| #10220 | Split index/JSON pattern reliable | applied at obs#5 reaffirm — v651 W2 split index + degree-sync.json clean |
| #10221 | Single-degree G3 merge under new policy | applies at v651 W7 — fifth per-degree G3 under new cadence |
| #10225 | ESTABLISHED-CADENCE historical-person name pattern | applied at obs#5 reaffirm at v651 W2 |
| #10226 | 4-degree-in-1-session sprint operational baseline | extended at v649 to 5-degree sprint + v650 to 6-degree + v651 to 7-degree two-day sprint |
| #10234 | 5-degree same-session sprint baseline | extended to 7-degree-in-two-day sprint at v651 |
| #10239 | 6-degree-in-two-day cadence ceiling validated | extended at v651 to 7-degree-in-two-day sprint; Lesson #10244 reaffirms architecture |
| #10240 | Chunked Write+Edit append for large HTML | NEW at v651; applied immediately to papers.html 554-line recovery |

## Forward action items emitted at v651

| # | Action | Target |
|---|---|---|
| FA-651-1 | RESOLVED — MUS 1.115 INSIDE-strict candidate = U2 *The Unforgettable Fire* (Island Records; UK 1984-10-01 + NA 1984-10-02; DUAL-ANCHOR INSIDE STRICT obs#5) | (closed in-cluster) |
| FA-651-2 | RESOLVED — ELC substrate-monoculture-risk resolution = Reagan-Mondale debate 1984-10-07 via SUBSTRATE-MONOCULTURE-RISK-RESOLUTION obs#6 ENDURING-DEEP-SUSTAINED-PATTERN | (closed in-cluster) |
| FA-651-3 | RESOLVED — ET-15 LWT-8 twelfth unpainted-orange verified at W1-NASA (#10331 obs#12 reaffirm; v633 convention holds) | (closed in-cluster) |
| FA-651-4 | RESOLVED — COMPOUND-FORWARD-SHADOW-DENSITY RELEASED at v651 (all seven STS-41-G crew survive Shuttle program; no 1986-disaster crew among Crippen + McBride + Ride + Sullivan + Leestma + Garneau + Scully-Power) | (closed in-cluster) |
| FA-651-5 | RESOLVED — TRS pack-37 dynamical systems LOCKED; K_37=491 (14 new edges e478–e491); 5-level substrate-coherence verified; 25-of-25 consecutive single-pass K_N | (closed in-cluster) |
| FA-651-6 | OPEN — HIGHEST-SHUTTLE-INCLINATION-TO-DATE substrate-cascade propagates; next high-inclination mission = ATLAS-1 STS-45 1992-03-24 at 57.0° (exact match); substrate-anticipation open | v652+ continuous |
| FA-651-7 | OPEN — Discovery-OV-103 substrate-anticipation continues from FA-650-8; v652 STS-51-A Discovery 2nd flight = next OV-103 entry | v652 immediate |
| FA-651-8 | OPEN — RSLS-pad-abort-cohort substrate cascade continues from FA-650-9 | v652+ continuous |
| FA-651-9 | OPEN — COMMERCIAL-PS-REPEAT-FLYER substrate anticipation (Walker STS-51-D 1985-04 + STS-61-B 1985-11) continues from FA-650-12 | v652+ continuous |
| FA-651-10 | OPEN — v1.49.652 successor candidate = STS-51-A Discovery 1984-11-08 = NASA 1.116 (WESTAR-VI + PALAPA-B2 satellite retrieval; A. L. Fisher first mother in space; J. M. Allen first 5-flight astronaut; C. D. Walker 2nd commercial PS; IMAX 4th flight; OV-103 Discovery 2nd flight) | v652 W0 |
| FA-651-11 | OPEN — FORWARD-SHADOW INDIVIDUAL RESUMPTION: Onizuka (STS-51-C 1985-01-24; first Asian-American astronaut; STS-51-L forward-shadow will open) + Smith (STS-51-J 1985-10-03; first shuttle-program astronaut from USN test-pilot pipeline at that slot) + McAuliffe (STS-51-L directly; no prior Shuttle flight) — forward-shadow density resumes individually at subsequent degrees | v652+ |
| FA-651-12 | OPEN — v1.108 backfill question routing — continues from FA-650-14 + prior chain; operator decision required | operator |
| FA-651-13 | OPEN — Phobos centennial STILL PENDING (continues from FA-650-15 + prior; 25 milestones since v617) | counter-cadence |
| FA-651-14 | OPEN — Lean 4 proof-fill DEFERRED (continues from FA-650-16 + prior) | deferred |
| FA-651-15 | BIPOD-RAMP-FOAM-SHEDDING-FORWARD-SHADOW propagates at SAME-VEHICLE-OV-099 resolution obs#4 cumulative (STS-41-G returns to OV-099 Challenger after v650 OV-103 interlude) | continuous |
| FA-651-16 | HAUCK-AS-FUTURE-RTF-COMMANDER continues toward STS-26 1988-09-29 (4y 1m 22d residual gap at v651) | continuous |
| FA-651-17 | TFNG-COHORT 22-of-35 cumulative at v651 close (Leestma = Group 9 not TFNG; McBride + Ride + Sullivan = 3 TFNG flying at v651); v652 STS-51-A anticipated: J. D. A. van Hoften + D. A. Walker + A. L. Fisher = 3 TFNG | v652 continuous |
| FA-651-18 | LDEF-CYCLE-CLOSURE substrate-anticipation continues (v649 deployment; STS-32 Columbia 1990-01-12 retrieval; 5y 9m 7d forward-shadow) | v738 anticipated |
| FA-651-19 | Historical-personal-name four-token forbidden-substring screening at W2 authoring step (Lesson #10219 + #10225 ESTABLISHED-CADENCE); apply at all subsequent degree-advance W2 dispatches | v652+ continuous |
| FA-651-20 | papers.html chunked Write+Edit append pattern (Lesson #10240) — apply by default to all W2/W3 HTML deliverables projected > 400 lines | v652+ continuous |

## NEW LOCKED at v651

NASA (15+): FIRST-SEVEN-PERSON-SHUTTLE-CREW-AS-DELIVERABLE / FIRST-AMERICAN-WOMAN-EVA-AS-DELIVERABLE / FIRST-SECOND-TIME-AMERICAN-WOMAN-IN-SPACE / FIRST-CANADIAN-ASTRONAUT-AS-DELIVERABLE / FIRST-AUSTRALIAN-BORN-US-ASTRONAUT-AS-DELIVERABLE / FIRST-4-FLIGHT-SHUTTLE-ASTRONAUT-AS-DELIVERABLE / HIGHEST-SHUTTLE-INCLINATION-TO-DATE / ORS-ORBITAL-REFUELING-DEMO-AS-DELIVERABLE / ERBS-DEPLOY-AS-CLIMATE-OBSERVATION-ANCHOR / OSTA-3-EARTH-OBSERVATION-PAYLOAD-PACKAGE / CRIPPEN-THIRD-TIME-CDR obs#3 / MOL-TRANSFEREE-CAREER-CULMINATION obs#1 / COMPOUND-FORWARD-SHADOW-DENSITY-RESOLVED / TFNG-22-OF-35-CONTINUATION / IMAX-THIRD-FLIGHT

MUS (10+): FIRST-IRISH-BAND-AS-COHORT-ENTRY / DUAL-RELEASE-OBS#1 / PRODUCER-DUO-DEBUT-ENO-LANOIS / SLANE-CASTLE-RESIDENTIAL-RECORDING / CIVIL-RIGHTS-AS-INTERNATIONAL-CULTURAL-OBSERVATION / INDIE-LABEL obs#2 (Island) / DUAL-ANCHOR-INSIDE-STRICT obs#5 / ALBUM-FORM obs#13 / ANGLOPHONE-ATLANTIC-WESTERN-CULTURAL-AXIS-OBS#1

ELC (8+): PRESIDENTIAL-CAMPAIGN-DEBATE-MOMENTUM-AS-CULTURAL-COHORT obs#1 / REAGAN-AGE-ISSUE-AS-CULTURAL-COHORT obs#1 / DEBATE-RECOVERY-AS-SUBSTRATE-COMPLETION obs#1 / FIRST-WOMAN-MAJOR-PARTY-VP-NOMINEE (Ferraro) obs#1 / WOMEN-AS-INSTITUTIONAL-FIRSTS-AT-1984 obs#4 / SUBSTRATE-MONOCULTURE-RISK-RESOLUTION obs#6 ENDURING-DEEP-SUSTAINED-PATTERN / WALTERS-MODERATOR-OBS#1

SPS (12+): FIRST-ANADROMOUS-FISH / FIRST-SALMONIDAE / FIRST-ACTINOPTERYGII obs#2 / FIRST-FISH / HOMING-PRECISION-AS-NAVIGATION / ANADROMOUS-LIFE-CYCLE-AS-MULTI-STAGE-MISSION / SEMELPAROUS-DEATH-AS-MISSION-COMPLETION / INDIGENOUS-FIRST-FOODS-PRINCIPLE / TREATY-RIGHTS-FISHERIES-GOVERNANCE (Boldt 1974) / MARINE-DERIVED-NUTRIENT-SUBSIDY / PNW-CANADIAN-SHARED-WATERSHED / 4-YEAR-DOMINANT-RUN-CYCLICITY / HUMBOLDT-STYLE-SUBSPECIES-AWARENESS obs#7 SUSTAINED-DEEP-CONSOLIDATION / SEXUAL-DIMORPHISM-DURING-SPAWNING

TRS (8+): DYNAMICAL-SYSTEMS-AS-CURRICULUM-PACK / LYAPUNOV-STABILITY / LORENZ-ATTRACTOR / KAM-THEOREM / BIRKHOFF-ERGODIC / HOPF-BIFURCATION / POINCARE-BENDIXSON / STABLE-UNSTABLE-CENTER-MANIFOLDS / SYMBOLIC-DYNAMICS / BRIDGE-CATEGORY obs#22 / K_N-COMPLETION obs#22 / 25-OF-25-SINGLE-PASS / 5-LEVEL-SUBSTRATE-COHERENCE-WITH-STS-41-G
