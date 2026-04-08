# Verification & Validation

*Systems Engineering Research Series — Module 03*

## 1. The Boehm Distinction

Barry Boehm, in his 1981 work *Software Engineering Economics* and reinforced throughout his later career at TRW and USC, gave the discipline a single question-pair that has never been surpassed for clarity:

> **Verification:** Are we building the product right?
> **Validation:** Are we building the right product?

Boehm was not the first to use the two words — they appear in IEEE glossaries from the 1970s — but he was the first to make the asymmetry unforgettable. The two questions sound nearly identical and yet describe entirely different failure modes. A system can pass every verification test and still fail validation. A system can succeed in validation (the user loves it) and still fail verification (it doesn't meet the contract). On a program the size of Apollo or the James Webb Space Telescope, either failure mode will kill the mission, and for different reasons.

The distinction matters because the two activities consume different resources, involve different stakeholders, and produce different artifacts:

| Aspect | Verification | Validation |
|---|---|---|
| **Question answered** | Does the implementation match the requirement? | Does the requirement capture the stakeholder need? |
| **Reference baseline** | The specification | The operational concept and stakeholder expectations |
| **Primary evidence** | Test reports, inspection records, analysis memos | Demonstrations, user acceptance, operational dry runs |
| **Owner** | Engineering (often supplier) | Customer / operator / end user |
| **Failure mode** | "It doesn't meet spec" | "It meets spec but the spec was wrong" |
| **When performed** | Continuously from unit test onward | Primarily at acceptance and operation |
| **Artifact produced** | Verification Cross-Reference Matrix | Concept of Operations walkthrough, operator sign-off |

A useful memory aid: verification is a contract check, validation is a world check. You verify against documents you wrote. You validate against a reality you do not control.

One of the most painful validation failures in aerospace history was the Hubble Space Telescope primary mirror. Every verification activity on that mirror passed. The null corrector used to figure the mirror was itself mis-assembled — a lens was spaced 1.3 mm too far from a reference — and so the mirror was verified against an incorrect standard and polished to exquisite precision at the wrong shape. The mirror met its verification criteria. It failed validation the instant first light arrived from space. The $1.5 billion COSTAR corrective optics mission in 1993 was in effect a validation re-take.

Verification asks whether your execution is faithful to your drawings. Validation asks whether your drawings describe a telescope that will actually see stars.

## 2. Verification Against Requirements

Verification is the systematic demonstration that each requirement in the specification has been met by the as-built item. Everything about it is formal: every requirement gets an ID, every ID gets one or more verification activities, every activity gets a procedure, a witness, and a pass/fail result. The finished set of evidence is traceable end-to-end, and if an auditor arrives six years later asking "how did you show that REQ-THR-014 was met?" you can put a folder in their hand.

Verification inherits its rigor from contract law as much as from engineering. On a cost-plus NASA contract, verification is the mechanism by which the contractor formally discharges each requirement in the Statement of Work. On an internal project with no contract at all, verification is still the mechanism by which the design team formally discharges its promises to itself.

The cardinal rule is **one requirement, one (or more) verification method, no ambiguity**. If a requirement cannot be verified — if you cannot state a procedure that would distinguish a system that meets it from a system that does not — then it is not a requirement. It is a wish, and it must either be rewritten or deleted. The Systems Engineering Handbook (NASA SP-2016-6105 Rev 2) is explicit on this: unverifiable requirements are a disciplinary offense in the requirements review.

Unverifiable language to ban from the requirements corpus:

- "as needed"
- "user-friendly"
- "maximum"
- "when practical"
- "robust"
- "minimize" / "maximize" (without an objective function)
- "sufficient"
- "adequate"

Each must be replaced with a measurable quantity, a reference standard, a pass/fail condition, or deleted.

## 3. Validation Against Stakeholder Needs

Validation, by contrast, is never finished until the stakeholder says it is finished. You can pass every verification activity and still hear the customer say "this isn't what we wanted." That sentence is a validation failure, and no amount of traceability will rescue the program from it.

The baseline for validation is not the specification — the specification is already exhausted by verification — but the Concept of Operations (ConOps), the mission needs statement, the stakeholder expectations document, and the operator's actual job. Validation artifacts therefore look different from verification artifacts. Instead of test reports signed by an independent QA witness, you get operator dry runs, tabletop exercises, simulator sessions with real astronauts, mission rehearsals with the flight controllers who will run the console on launch day, and signed acceptance memos from named individuals whose job it is to speak for the user.

NASA formalizes this in the Stakeholder Expectations Definition Process (SEDP), which lives at the front end of the project lifecycle and is revisited at every major gate. The question "did we capture what they actually need?" is asked at the System Requirements Review, at the Preliminary Design Review, and again at the Critical Design Review. It is the same question each time, and the answer is allowed to change as the stakeholder learns what is possible.

A practical heuristic: **verification fails the hardware, validation fails the requirements document**. When a verification activity fails, you go fix the hardware or soften the requirement. When a validation activity fails, you go rewrite the requirements — and then you re-verify everything downstream. This is why validation failures late in a program are so expensive: they cascade backward through the V-model and force entire verification campaigns to be re-run.

## 4. The Four Verification Methods

NASA Systems Engineering Handbook Section 5.3 and the INCOSE Systems Engineering Handbook (v4 and v5) both codify four — and only four — verification methods. The uniformity across the two references is deliberate. These four methods exhaust the space of evidence one can collect about whether a requirement has been met.

### 4.1 Inspection

**Definition:** Visual or manual examination of the item, its documentation, or its drawings, without operation of the item and without specialized test equipment.

**Use when:** The requirement is about presence, marking, physical form, part count, documentation content, or compliance with drawing. Inspection is the method of choice for requirements like "all fasteners shall be torque-striped" or "the data sheet shall state the operating temperature range" or "the cable harness shall be labeled per drawing 10432-A."

**Strengths:** Cheapest verification method. No test equipment. No analysis expertise. Repeatable by any qualified inspector.

**Weaknesses:** Finds only what is visible. Cannot verify performance, behavior under load, or interaction. A perfect inspection result says nothing about whether the thing works.

**Example from Apollo:** Every Saturn V stage arrived at Kennedy with a Quality Acceptance package that listed thousands of inspection points — weld dye-penetrant results, stenciled part numbers, torque seal on every bolt. The inspection itself did not prove the rocket would fly. It proved the rocket had been built to drawing.

### 4.2 Analysis

**Definition:** Verification by mathematical modeling, simulation, calculation, or extrapolation from test data on similar items. The item itself is not operated.

**Use when:** Testing would be prohibitively expensive, dangerous, or impossible (the item will only be used in conditions that cannot be reproduced on Earth — microgravity, deep-space radiation environment, Mars atmospheric entry). Also used when you want to verify a requirement over a parameter range too large to sweep experimentally.

**Strengths:** Can reach regimes where test cannot. Can verify populations (every serial number) from a physics model rather than one at a time. Produces traceable, reviewable documentation that independent reviewers can re-derive.

**Weaknesses:** The analysis is only as good as its model assumptions. Every analysis verification must be accompanied by model validation — how do we know the model is right? This is where NASA requires model-correlation tests against a subset of hardware, which is why "verified by analysis supported by test" is one of the most common combined methods on flight programs.

**Example from the Space Shuttle:** The re-entry thermal environment of the Orbiter's Thermal Protection System could not be tested at full scale on Earth. NASA's arc-jet facilities at Ames and Johnson could heat a single tile or a small assembly to shuttle re-entry conditions, but not the full vehicle. The full-vehicle thermal verification was performed by computational fluid dynamics analysis, correlated against arc-jet data for individual tiles, and then extrapolated. Columbia's STS-107 failure in 2003 was in part a failure of this analysis-based verification to account for foam strike damage.

### 4.3 Demonstration

**Definition:** Operation of the item to show that it performs as expected, without collecting quantitative data. Pass/fail is determined by qualitative observation.

**Use when:** The requirement is about a capability or function whose success is self-evident. "The payload bay doors shall open and close." "The crew shall be able to egress through the hatch while wearing a pressurized EMU." "The landing gear shall deploy." These are yes-or-no questions with no measurement required.

**Strengths:** Faster and cheaper than a full instrumented test. Provides visible, sometimes dramatic evidence. Good for stakeholder walkthroughs because the result is obvious to non-experts.

**Weaknesses:** Produces weak evidence in a dispute. If someone asks "how well did it work?" you cannot answer. Demonstration proves the capability exists, not that it is robust or repeatable.

**Example from Apollo:** The Lunar Module egress demonstration in Building 9 at the Manned Spacecraft Center, performed by Armstrong and Aldrin in pressure suits before Apollo 11, was a demonstration. Nobody measured the time in hundredths of a second. The question was: can a pressurized astronaut fit through the hatch, turn around, descend the ladder, and not snag on the porch? Qualitative answer: yes. Verification complete.

### 4.4 Test

**Definition:** Operation of the item under controlled conditions while quantitative measurements are collected. Results are compared to numerical pass/fail criteria from the requirement.

**Use when:** The requirement states a numerical limit. "The thruster shall produce 445 N ± 2%." "The battery shall deliver 72 Ah at 28 V after 500 charge-discharge cycles." "The antenna shall have a gain of 38 dBi ± 0.5 dB at 8.4 GHz." Test is the default method for any requirement with a unit attached.

**Strengths:** Produces the strongest evidence. Numerical, reviewable, auditable. Can be repeated by independent testers. Traditionally considered the gold standard, and when programs want to reduce risk they "add more test."

**Weaknesses:** Most expensive method. Can consume hardware (destructive tests). Requires calibrated test equipment whose calibration must itself be traceable. Requires facility time at thermal-vacuum chambers, shaker tables, or acoustic cells whose schedules are booked years in advance.

**Example from JWST:** The end-to-end optical test of the James Webb Space Telescope's primary mirror in the giant Chamber A at Johnson Space Center (the same chamber used for Apollo spacecraft thermal testing) in 2017 produced thousands of interferometric measurements of mirror alignment at cryogenic temperature. This was a test in the strictest sense: controlled conditions, quantitative data, numerical pass/fail. The hurricane that hit Houston during the test (Harvey) is the only reason that test chamber is remembered outside the JWST program.

### 4.5 Method Selection Criteria

| Question | Inspection | Analysis | Demonstration | Test |
|---|---|---|---|---|
| Does the requirement contain a numerical limit? | No | Sometimes | No | **Yes** |
| Can the actual operational environment be reproduced on Earth? | N/A | **No** (use analysis) | Yes | Yes |
| Is the requirement about physical presence, marking, or documentation? | **Yes** | No | No | No |
| Is the requirement a capability that is self-evident when exercised? | No | No | **Yes** | Overkill |
| Is hardware cost prohibitive? | Cheap | **Cheap** | Moderate | Expensive |
| Strength of evidence produced | Low | Medium (model-dependent) | Low | **High** |
| Independent reviewer can re-perform? | Yes | Yes | Yes (if hardware available) | Yes (if hardware available) |

The four methods are not mutually exclusive. A single requirement can be verified by multiple methods — "verified by test at the component level, by analysis at the system level, with inspection of the as-built configuration" — and in practice, safety-critical requirements almost always combine at least two.

## 5. The V-Model

The V-model is the visualization that makes verification and validation legible to a room full of managers. It places the requirements and design activities on the left arm of the V descending from the top, and the corresponding verification and integration activities on the right arm ascending back to the top. Each level of decomposition on the left has a matching level of integration on the right.

```
Stakeholder Needs    ─────────────────────▶   Operational Validation
(ConOps)                                        (Real missions)
         ╲                                     ╱
          ╲                                   ╱
  System Requirements  ────────────▶  System Acceptance Test
           ╲                                 ╱
            ╲                               ╱
    System Architecture  ─────▶  System Integration Test
             ╲                           ╱
              ╲                         ╱
       Subsystem Design  ──▶  Subsystem Integration Test
               ╲                     ╱
                ╲                   ╱
         Component Design  ▶  Component Test
                 ╲               ╱
                  ╲             ╱
               Unit Design ─▶ Unit Test
                    ╲       ╱
                     ╲     ╱
                      CODE
```

The V has three properties worth naming explicitly:

**1. Horizontal symmetry.** Every activity on the left arm has a matching activity on the right arm. Unit design on the left is matched by unit test on the right. System requirements on the left are matched by system acceptance test on the right. If you cannot find a matching right-arm activity for something on the left arm, you have not finished planning your verification.

**2. The validation arrow is at the top.** Validation spans the whole V — it runs from stakeholder needs at the top-left to operational validation at the top-right. Verification, by contrast, runs horizontally at each level of the V. This geometry captures the Boehm distinction visually: verification is local (at each level), validation is global (end to end).

**3. Integration is bottom-up.** You don't test the integrated system before its components. You don't test components before their units. The right arm rises level by level, and each level cannot start until the level below is complete. This is why a delay in unit test propagates all the way up the right arm, and why the V-model is frequently caricatured as a waterfall. It is not — incremental and iterative versions of the V exist, and large programs run multiple V-passes concurrently — but the dependency structure is real.

The V-model was first articulated in 1979 by NASA for the Space Shuttle, elaborated by the German V-Modell XT standard in 1997, and canonized in NASA SP-2016-6105 and the INCOSE Handbook. Most modern programs draw their V somewhere in their Systems Engineering Management Plan and trace activities to it.

## 6. Readiness Reviews: TRR, FRR, ORR

Readiness reviews are the gates through which verification and validation evidence must pass before the program is allowed to take the next irreversible step. On NASA programs, three reviews are particularly closely tied to V&V:

### 6.1 Test Readiness Review (TRR)

The TRR asks: **"Are we ready to start testing this item?"** It is held before any major test campaign — qualification testing, acceptance testing, environmental testing, flight hardware testing. The TRR board examines:

- Is the hardware built to the correct configuration?
- Is the test procedure complete, reviewed, and baselined?
- Is the test equipment calibrated, with calibration traceable to NIST?
- Are the test personnel trained and certified?
- Are the safety hazards identified and controlled?
- Are the pass/fail criteria unambiguous?
- Is the data collection plan adequate to support verification closure?

A TRR that fails does not mean the item has failed. It means the test is not allowed to proceed, because the evidence it would produce would not stand up to later audit. Smart programs treat a TRR failure as a gift — it's cheaper to delay a test than to redo it.

### 6.2 Flight Readiness Review (FRR)

The FRR asks: **"Is this vehicle ready to fly?"** For the Space Shuttle, the FRR was held approximately two weeks before launch and was chaired by the Associate Administrator for Space Flight. Every system had to present verification closure evidence for its open items, certify that every waiver had been adjudicated, and sign off on flight readiness.

The FRR became historically infamous because of the Challenger launch decision. The FRR process had identified concerns about O-ring performance at low temperature; the telecon on the night of January 27, 1986 — where Morton Thiokol engineers initially recommended against launch — was in effect a continuation of the FRR. The decision to launch in the face of that concern is the most-studied governance failure in engineering history, and it changed how NASA runs FRRs. After Challenger, the FRR rules were rewritten to require an explicit "no constraints" poll of every center and every program element, with dissents recorded in the minutes. The dissenting voice at an FRR was given formal protection.

### 6.3 Operational Readiness Review (ORR)

The ORR asks: **"Is the operations team ready to fly this vehicle?"** Distinct from the FRR, which focuses on the hardware, the ORR focuses on the people, procedures, and ground systems. Mission controllers, flight directors, simulation supervisors, and training officers present evidence that:

- Flight rules are baselined
- Mission Control consoles are staffed and certified
- Simulator training has been completed
- Contingency procedures are written, reviewed, and rehearsed
- Ground tracking, communications, and data systems are operational
- The operations plan has been validated in end-to-end simulation

The ORR is the validation gate for the operational segment. On Apollo, the ORR was where the flight controllers proved — through full mission-duration sims — that they could handle the mission including the failure modes Gene Kranz liked to inject. Apollo 11's 1201/1202 computer alarms on descent were handled correctly because a simulation a few weeks earlier had trained the guidance officer to recognize them. That is validation, earned at an ORR.

## 7. Acceptance Criteria

An acceptance criterion is a clause in a requirement (or in the verification procedure derived from it) that allows an independent party to rule unambiguously on pass or fail. Acceptance criteria are how verification avoids becoming an argument.

A good acceptance criterion has four parts:

1. **The measurable quantity** — what is being observed?
2. **The pass/fail threshold** — at what numerical value does the result change from pass to fail?
3. **The measurement method** — what equipment, at what calibration, in what configuration?
4. **The conditions** — at what temperature, voltage, load, or environment is the measurement taken?

Example (poorly written):
> "The system shall be reliable."

Example (well written):
> "The system shall demonstrate a mean time between failures of no less than 10,000 operating hours, as measured during the 500-hour qualification test at nominal voltage (28 ± 0.5 V DC) and ambient temperature (23 ± 3 °C), using failure definitions from the Failure Mode and Effects Analysis document SYE-FMEA-001."

The first is a wish. The second is a verifiable requirement with an acceptance criterion.

## 8. Compliance Matrices and Verification Cross-Reference Matrices

The Verification Cross-Reference Matrix (VCRM), sometimes called the Requirements Verification Matrix (RVM), is the control document of the verification campaign. It is a spreadsheet. Every program has one. Every program relies on it. Every program fights about it.

A minimal VCRM row contains:

| Column | Contents |
|---|---|
| Req ID | Unique requirement identifier (e.g., SYS-THR-014) |
| Requirement Text | Verbatim from specification |
| Parent Req | The higher-level requirement this flows from |
| Verification Method | I / A / D / T (or combinations like A+T) |
| Verification Level | Unit / Component / Subsystem / System |
| Verification Procedure | Document and section reference |
| Verification Event | Test campaign name, date, location |
| Status | Open / In Progress / Closed / Waived |
| Evidence | Test report number, analysis memo, inspection record |
| Closure Date | When the requirement was formally verified |
| Closure Authority | Who signed |

A real program VCRM runs 5,000 to 50,000 rows. It is the single source of truth for verification status and is reviewed at every program management meeting. When the program manager asks "how much verification is left?" the answer is always the count of Open and In Progress rows.

The **compliance matrix** is the customer-facing cousin of the VCRM. Where the VCRM is internal and tracks verification evidence, the compliance matrix maps each customer requirement to a response — "comply," "partial," "non-comply," "exception taken" — and is delivered with the proposal, the design review package, and the final acceptance data package. A non-comply row is a negotiation item. A partial row invites scrutiny. An exception-taken row must point to an approved waiver.

### VCRM Template

```
+---------+------------------+-------+--------+------------+-----------+--------+------------+-------------+
| Req ID  | Requirement      | Level | Method | Procedure  | Event     | Status | Evidence   | Closure     |
+---------+------------------+-------+--------+------------+-----------+--------+------------+-------------+
| SYS-001 | Mass ≤ 1200 kg   | SYS   | I+A    | TP-SYS-001 | FM build  | CLOSED | MR-001     | 2026-02-14  |
| SYS-002 | Power ≤ 350 W    | SYS   | T      | TP-SYS-002 | Acc test  | CLOSED | TR-SYS-002 | 2026-03-02  |
| SYS-003 | MTBF ≥ 10000 hr  | SYS   | A+T    | TP-SYS-003 | Qual test | OPEN   | -          | -           |
| SUB-014 | Thrust 445 ± 9 N | SUB   | T      | TP-PRO-014 | Hot fire  | CLOSED | TR-PRO-014 | 2026-01-28  |
| SUB-015 | Isp ≥ 295 s      | SUB   | T      | TP-PRO-015 | Hot fire  | CLOSED | TR-PRO-015 | 2026-01-28  |
| SUB-016 | TVC ±7°          | SUB   | D      | TP-PRO-016 | Gimbal    | CLOSED | DEM-016    | 2026-02-01  |
+---------+------------------+-------+--------+------------+-----------+--------+------------+-------------+
```

## 9. V&V Planning

A Verification and Validation Plan is the document that tells the whole program which method will be used for which requirement, when, at what facility, with whose budget. It is written early — draft at System Requirements Review, baselined at Preliminary Design Review — and lives or dies by the discipline of its method allocation.

The V&V planner confronts a sequence of decisions for every requirement:

1. **What is the minimum level at which this requirement can be verified?** Testing at the system level is more expensive than testing at the unit level. Where possible, push verification down.
2. **Can it be pushed down safely?** Some emergent properties (interface performance, thermal balance, electromagnetic compatibility) only appear at the system level. Don't falsely push down.
3. **What method yields the strongest evidence at the lowest cost?** Test is strongest, inspection is cheapest. Analysis is cheap but model-dependent.
4. **What is the minimum number of units needed?** Qualification testing may require a dedicated article that will be stressed to destruction. Acceptance testing is performed on every flight article.
5. **Where are the schedule constraints?** Thermal vacuum chambers and acoustic cells are scarce. If the plan requires TVAC at GSFC in July, the slot must be booked in January.

A key heuristic from NASA/GSFC's systems engineering training: **the rule of halves**. Whatever verification budget you allocate, half will be consumed by re-tests, anomaly investigation, and closeout of open items. Plan accordingly.

## 10. Qualification vs Acceptance Testing

Two words that sound similar and mean very different things:

**Qualification testing** is performed *once per design*, on a dedicated article that is representative of flight configuration but is not itself flown. The objective is to prove the design can survive worst-case environments — and by "worst case" we mean qualification levels, which are typically 1.25× to 1.5× the maximum expected flight environment, applied for longer durations. The hardware may be damaged in the process; it is often scrap at the end.

**Acceptance testing** is performed *on every flight unit*, at acceptance levels (nominally equal to maximum expected flight environment, sometimes with a small margin). The objective is to catch workmanship defects — a cold solder joint, a misaligned connector, a cracked component — that are specific to this serial number. The article is expected to survive undamaged and go on to fly.

| | Qualification | Acceptance |
|---|---|---|
| Performed on | One dedicated article | Every flight unit |
| Environmental levels | 1.25×–1.5× max expected | 1.0× max expected |
| Duration | Long (margin) | Short (workmanship) |
| Purpose | Prove the design | Catch unit-specific defects |
| Hardware outcome | Often scrap | Flight |
| Cost per flight | Amortized over program | Per unit |
| Schedule | Early in program | Per delivery |

The distinction drives the testing philosophy of every flight program. Qualification is bought once; acceptance is bought for every serial number.

## 11. Environmental Testing

Spacecraft and aircraft must survive environments that are alien to the room-temperature, sea-level-pressure, vibration-free conditions of the design lab. Environmental testing reproduces these environments on the ground.

**Thermal vacuum (TVAC):** The chamber is pumped to space vacuum (typically better than 10⁻⁵ torr) and the walls are chilled with liquid nitrogen to cryogenic temperatures. The test article sees the vacuum of space and the cold of deep-space radiation. TVAC tests run for days, sometimes weeks, and cycle through hot and cold dwells representative of the spacecraft's on-orbit environment. Every NASA spacecraft goes through TVAC. The chamber at Goddard Space Flight Center (SES — Space Environment Simulator) and Chamber A at Johnson Space Center (the one JWST used) are national assets.

**Vibration:** Launch vehicles shake violently. A shaker table reproduces the sinusoidal sweeps and random vibration spectra the spacecraft will see during ascent. Typical random vibration levels are 10–20 g rms for 60–120 seconds per axis, three axes. The test article is instrumented with accelerometers at mass-critical points and monitored for resonant frequency shifts (which indicate structural damage).

**Acoustic:** A reverberant acoustic cell bombards the article with 140–150 dB of broadband noise, simulating the acoustic loads from the launch vehicle's own engines and shock reflection from the pad. Acoustic tests are particularly harsh on large, lightweight structures — solar arrays, deployable booms, thermal shields.

**Shock:** Pyrotechnic devices (explosive bolts, separation nuts) impart high-frequency mechanical shocks at stage separation and deployment events. Pyroshock tests use either the real pyros on a test rig or a calibrated mechanical hammer to reproduce the spectrum.

**EMI/EMC:** Electromagnetic interference and compatibility testing puts the article in an anechoic chamber and sweeps radiated and conducted emissions and susceptibility over defined frequency bands (per MIL-STD-461 for military, or spacecraft-specific limits). EMI/EMC failures have grounded programs for months — two systems that are each individually compliant can still interfere with each other in integration.

## 12. Hardware-in-the-Loop (HIL) Testing

HIL testing closes a real-time loop around flight-representative hardware using simulated environments. The hardware — typically a flight computer, an inertial measurement unit, or a guidance sensor — sees inputs from a simulator that computes physics in real time, and its outputs drive the simulator forward. From the hardware's perspective, it is flying a mission.

HIL is the standard verification method for guidance, navigation, and control software, for autonomous behaviors, and for fault-tolerant state machines. You cannot verify an autoland algorithm by desk-checking the code. You can verify it by running the flight computer in a HIL rig that simulates the aircraft dynamics, weather, navigation signals, and actuators in real time, with the real flight computer in the loop.

NASA's Langley and Johnson centers maintain HIL labs for crewed vehicles. JPL's ATLO (Assembly, Test, and Launch Operations) phase for every robotic mission includes a HIL campaign where the flight computer drives a simulated Mars environment while the operations team runs mission sequences. The Curiosity rover's Entry-Descent-Landing sequence — "seven minutes of terror" — was rehearsed thousands of times in HIL before the rover was allowed near its launch vehicle.

## 13. Software V&V per NASA-STD-8719.13

Software on safety-critical NASA missions follows a specific standard: NASA-STD-8719.13, *Software Safety Standard*, and its companion NASA-STD-8739.8, *Software Assurance Standard*. The standards classify software by safety criticality (Class A — human life at risk, through Class E — general public tools) and prescribe levels of rigor accordingly.

For Class A software, the standards require:

- Formal requirements baseline with traceability
- Design documentation reviewed by independent parties
- Code inspections with a defined checklist
- Unit test coverage (branch and condition, not just statement)
- Integration test at defined interfaces
- System test with fault injection
- Requirements-based test with coverage metrics
- Regression test baseline maintained across every build
- Configuration control with formal change approval
- Independent software audit before flight certification
- Software Safety Analysis documented and reviewed

Software V&V is often harder to plan than hardware V&V because the "item" is invisible and the failure modes are not intuitive. A common pattern: the team writes a test suite that covers the requirements, passes the suite, and ships — only to have an unanticipated state combination hit in flight. This is why fault injection and boundary testing are mandatory for Class A software, and why model checking (mathematical proof that the code cannot enter a prohibited state) is increasingly used for the most critical subsystems — guidance, autonomous landing, life support.

## 14. Independent Verification and Validation (IV&V)

NASA maintains a standalone IV&V facility in Fairmont, West Virginia — the NASA IV&V Program, established in 1993 in direct response to software problems during the early Space Station and Shuttle era. The facility exists because experience had shown that the development team, however conscientious, cannot be fully independent of its own work. The team's mental model of the system is shared across requirements, design, code, and test — and a shared mental model propagates shared blind spots.

IV&V is "independent" in three specific ways, codified in IEEE 1012 and NASA's IV&V Management Plan:

1. **Technical independence** — the IV&V team does not use the development team's tools, artifacts, or assumptions. They build their own models.
2. **Managerial independence** — the IV&V team reports to a different program manager, with a different budget, and cannot be silenced by the development program.
3. **Financial independence** — IV&V funding is not routed through the development prime. A program manager cannot cut IV&V to save schedule.

The Fairmont facility has supported every major NASA program since its founding — Shuttle, Station, Hubble servicing, Mars Exploration Rovers, Curiosity, JWST, Orion, SLS, Artemis. Its findings are legally protected from being suppressed by the development program: IV&V concerns are raised to the program's senior management with a defined escalation path, and unresolved concerns go to NASA Headquarters. On a Class A mission, IV&V signoff is a prerequisite for flight certification.

IV&V is expensive — typically 3–10% of software development cost — and programs under budget pressure always try to trim it. The counter-argument is that every significant software-related mission failure in NASA history has, in hindsight, been catchable by a properly scoped IV&V activity. The Mars Climate Orbiter units-conversion error, the Mars Polar Lander landing-leg software bug, the Toyota unintended acceleration findings (outside NASA but analyzed by NASA engineers) — all were IV&V-reachable issues.

## 15. Historical Examples

**Apollo:** The Apollo program's verification campaign ran from 1961 to 1975 and consumed roughly 40% of program budget. Every Command Module and Lunar Module serial number went through its own acceptance campaign. Every Saturn stage was static-fired at Mississippi Test Facility (now Stennis) before shipment to Kennedy. The verification documentation — tens of thousands of pages per mission — is archived at the NASA Historical Reference Collection and Johnson Space Center. Apollo 13 survived because the Service Module's oxygen tank failure, though not verified out (the failure mode was latent from ground handling damage months earlier), was recoverable by crew and flight controllers who had trained in simulation for precisely this kind of cascading failure. Validation of the operations team — earned at ORR and reinforced by Gene Kranz's relentless sim program — saved the mission.

**Space Shuttle:** The Shuttle test program qualified the Orbiter through a series of Approach and Landing Tests (ALT, 1977) using Enterprise, followed by orbital flight tests STS-1 through STS-4 (1981–1982) which were themselves verification missions — John Young and Bob Crippen on STS-1 were test pilots, and the mission was declared a flight test. Every subsequent Shuttle mission, through STS-135 in 2011, carried a verification activity somewhere in its mission log. The Main Engine qualification program alone consumed several engines and established cryogenic turbopump reliability limits that the industry still references.

**JWST:** The James Webb Space Telescope's verification campaign ran for over a decade and cost a significant fraction of the $10 billion program. The cryogenic optical test in Chamber A at JSC was the largest cryo-vacuum test in history. The sunshield deployment test was repeated dozens of times with progressively higher fidelity mockups. The OTIS (Optical Telescope Element + Integrated Science Instruments) cryo test produced thousands of measurements that had to close before launch. The 2021 launch was preceded by a final verification review in which every open item was adjudicated by the program. The successful deployment in January 2022 — 344 single-point failures, all nominal — was the payoff of that verification discipline.

## 16. Closing Observation

Verification and validation are not decoration on the engineering process. They are the process. A program that cuts verification to save schedule is trading certainty for hope, and hope is not a management strategy. A program that skips validation is betting that its requirements are correct — and the Hubble mirror is the monument to what happens when that bet fails.

The four verification methods — inspection, analysis, demonstration, test — exhaust the space of evidence. The V-model gives geometric form to the dependency between decomposition and integration. The readiness reviews (TRR, FRR, ORR) are the gates that enforce discipline. The VCRM is the bookkeeping that lets the program manager know, at any moment, how much verification is left. The IV&V facility in Fairmont is the insurance policy against shared blind spots.

And underneath all of it, Boehm's two questions remain the test. Are we building the product right? Are we building the right product? A systems engineer who can answer both — with evidence — has done the job.

---

*Module 03 of the Systems Engineering Research Series. Cross-references: Module 02 (Requirements Engineering), Module 04 (Risk Management), Module 09 (Test & Evaluation).*

*Primary sources: NASA SP-2016-6105 Rev 2 (Systems Engineering Handbook); INCOSE Systems Engineering Handbook v5; NASA-STD-8719.13 (Software Safety); IEEE 1012 (System, Software, and Hardware Verification and Validation); Boehm, B., Software Engineering Economics (1981); NASA IV&V Program documentation, Fairmont WV.*
