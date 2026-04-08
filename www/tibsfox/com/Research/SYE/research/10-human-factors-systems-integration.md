# 10. Human Factors & Systems Integration

**Module:** SYE-10
**Series:** Systems Engineering (SYE)
**Cluster:** Infrastructure
**Sources:** NASA/SP-2015-3709, NASA-STD-3001 Vol. 1 & 2 (Rev C), NASA SE Handbook SP-2016-6105, INCOSE SE Handbook v5, DoD MANPRINT (MIL-HDBK-46855A, AR 602-2), ECSS-E-ST-10-03C, Endsley (1995), Reason (1990), Bainbridge (1983), Wickens Multiple Resource Theory, HFACS (Shappell & Wiegmann 2000), NTSB DCA13MA081 (Asiana 214), NASA OIG report on CST-100 Starliner crew interface.

---

## Abstract

Systems engineering without human factors is a category error. Every aerospace system built to operate autonomously is still designed, built, maintained, flown, monitored, updated, and eventually decommissioned by humans. The moment engineers treat "the human" as an afterthought — a pilot to be trained, an operator to be instructed, a maintainer to be blamed — the integrated system exhibits emergent failures that no subsystem specification predicted. Human-System Integration (HSI) is the discipline that inserts the human into the requirements flow from day one, treating cognitive workload, anthropometric envelopes, procedural maintainability, training load, and habitability as first-class system attributes governed by the same V&V rigor as mass, power, thermal, and data budgets. This module surveys HSI as practiced in NASA (per NASA/SP-2015-3709 and the NASA-STD-3001 family), DoD (per MANPRINT), and ESA (per ECSS-E-ST-10-03C for Assembly, Integration, Test and Verification). It then turns to the complementary challenge of integrating the non-human side: thousands of subsystems from hundreds of contractors across multiple integration facilities, proven against a requirements baseline that no single test environment can fully exercise. The through-line is simple: integration is where systems engineering is either rewarded or punished, and the human integrator — cockpit crew, ground controller, launch engineer, ISS EVA specialist — is the final integration element.

---

## 1. Why Human-System Integration Exists as a Discipline

Early aerospace programs treated humans as point-source components with a fixed transfer function: give the pilot an instrument, the pilot reads it, the pilot pulls a lever. This model collapsed in the transition from mechanical cockpits to electromechanical ones, from electromechanical to fly-by-wire, from fly-by-wire to glass cockpits, and from glass cockpits to highly automated envelope-protected flight management systems. Each transition introduced surprise failure modes that were not in any single subsystem FMEA. The Three Mile Island control room, the Airbus A320 automation surprises of the late 1980s and early 1990s, the Comair 5191 wrong-runway departure, the Korean Air 801 CFIT, Colgan 3407, Air France 447, Asiana 214, and the Boeing 737 MAX MCAS accidents all share a common signature: the human operator was inserted into a loop whose behavior the human had not been trained to anticipate, under conditions of degraded SA, elevated workload, or ambiguous mode indication. None of these were subsystem failures in the classical sense. They were integration failures in which the human was the integrator of last resort and had been given a context insufficient for the task.

NASA codified its institutional response to this pattern in **NASA/SP-2015-3709, Human Systems Integration (HSI) Practitioner's Guide**, which formalizes HSI as a systems engineering discipline, not an afterthought ergonomics pass. NASA-STD-3001 Volume 1 (Crew Health) and Volume 2 (Human Factors, Habitability, and Environmental Health) define the binding technical standard for every human-rated NASA system from ISS increments through Orion/Artemis, Gateway, and commercial crew vehicles under the Commercial Crew Program. The standard carries requirements-level authority: "the vehicle shall accommodate crew from the 1st percentile American female to the 99th percentile American male" is not a guideline, it is a verification item that traces through PDR and CDR gates with the same discipline as a thermal margin or a structural load factor.

On the defense side, **MANPRINT** (Manpower and Personnel Integration) was institutionalized by the U.S. Army in 1984 after analysis of Vietnam-era system fielding showed repeated instances of systems being delivered that could not be manned, operated, or maintained by the soldier population that actually existed. MANPRINT requires programs to address seven — later expanded to eight — integration domains from milestone A onward. The underlying insight is the same as NASA's: waiting until after CDR to discover that the sustainment population cannot physically or cognitively operate the delivered system is a program-killing risk, and the only way to avoid it is to carry human characteristics as requirements throughout the design lifecycle.

ESA's position is articulated through **ECSS-E-ST-10-03C** (Assembly, Integration and Test) and the ECSS-Q-ST-40 safety series, which together cover the integration process from subsystem to flight article and treat crewed-system ergonomics through the Human-Machine Interface (HMI) engineering provisions of the ECSS-E-ST-10 parent standard.

---

## 2. The HSI Domains — NASA and DoD

HSI is not a monolithic activity; it is a structured set of **domains**, each with its own practitioners, requirements, verification methods, and metrics. Treating them as separate domains prevents the common failure mode of reducing HSI to "human factors" (which in practice usually means cockpit layout and nothing else).

### 2.1 NASA HSI Domains (per NASA/SP-2015-3709)

NASA recognizes six HSI domains:

| NASA Domain | Focus | Representative Questions | Verification Artifacts |
|-------------|-------|--------------------------|------------------------|
| **Human Factors Engineering (HFE)** | Design of displays, controls, workstations, procedures to match human capabilities and limitations | Can the crew see the display under solar glare? Can a gloved hand reach every switch? | HFE analysis reports, usability tests, task analyses |
| **Operations Resources** | Ground and flight crew sizing, skill mix, shift patterns, procedural support tools | How many flight controllers are needed per shift? What skill certifications? | Ops concept, manning studies, FCOH revisions |
| **Maintainability** | Design for accessibility, diagnosability, and repair — by EVA crew, on-orbit IVA crew, or ground technicians | Can an orbital replacement unit (ORU) be swapped in a suited EVA? Is the torque within crew limits? | Maintainability demonstrations, ORU trade studies, EVA timelines |
| **Habitability and Environment** | Living conditions: acoustic, lighting, atmosphere, food, waste, privacy, sleep, exercise, radiation | Is the cabin noise below 60 dBA for sleep? Does lighting support circadian entrainment? | Habitability assessments, noise surveys, lighting analyses |
| **Safety** | Crew survivability, hazard identification and mitigation, emergency procedures | What happens on cabin depress? Fire? Ammonia leak? Can the crew reach the safe haven? | Safety data packages, hazard reports, emergency procedure validations |
| **Training** | What the crew must know, how they acquire and maintain proficiency, how training generalizes | How many sim hours to reach proficiency? What is the currency decay curve? | Training Task List, training system requirements, proficiency data |

### 2.2 DoD MANPRINT Domains

MANPRINT, as defined in Army Regulation 602-2 and MIL-HDBK-46855A, recognizes eight domains:

1. **Manpower** — how many people are required to operate, maintain, and support the system across its lifecycle, including the institutional footprint (training command, depot staff, spares logistics personnel).
2. **Personnel** — the aptitudes, skills, and physical characteristics of the people who will actually operate the system, drawn from the recruitable population rather than an idealized operator.
3. **Training** — what initial, unit, and sustainment training is required, and whether the necessary training delivery infrastructure (simulators, ranges, instructors) will exist.
4. **Human Factors Engineering** — classical HFE: anthropometric accommodation, display and control design, workload management, error-tolerant interfaces.
5. **System Safety** — design-induced hazards to operators, maintainers, and bystanders, including crashworthiness and survivability.
6. **Health Hazards** — long-duration exposure risks: noise-induced hearing loss, chemical exposure, vibration, shock, thermal stress, ionizing and non-ionizing radiation.
7. **Soldier Survivability** — the soldier's ability to avoid detection, withstand hits, and recover. Analogous to NASA's safe-haven and abort provisions.
8. **Habitability** — the living and working environment on long-duration deployments — crew quarters, food service, sanitation, climate control.

### 2.3 HSI Domain Matrix — Cross-Mapping

```
              | HFE | OpsRes | Maint | Habit | Safety | Train | Manpower | Personnel | HealthHz | Surviv |
NASA HFE      |  X  |        |       |       |        |       |          |           |          |        |
NASA OpsRes   |     |   X    |       |       |        |       |    X     |     X     |          |        |
NASA Maint    |  X  |        |   X   |       |        |       |    X     |           |          |        |
NASA Habit    |     |        |       |   X   |        |       |          |           |    X     |        |
NASA Safety   |     |        |       |       |   X    |       |          |           |    X     |   X    |
NASA Training |     |        |       |       |        |   X   |          |     X     |          |        |
DoD Manpower  |     |   X    |       |       |        |       |    X     |           |          |        |
DoD Personnel |     |        |       |       |        |       |          |     X     |          |        |
DoD HFE       |  X  |        |       |       |        |       |          |           |          |        |
DoD Safety    |     |        |       |       |   X    |       |          |           |    X     |   X    |
DoD HealthHz  |     |        |       |   X   |        |       |          |           |    X     |        |
DoD Surviv    |     |        |       |       |   X    |       |          |           |          |   X    |
DoD Habit     |     |        |       |   X   |        |       |          |           |    X     |        |
DoD Training  |     |        |       |       |        |   X   |          |     X     |          |        |
```

The matrix reveals the imperfect but deliberate mapping: NASA's six domains cover the same problem space as DoD's eight but carve it differently. NASA does not explicitly carry a "manpower" domain because flight crew size is a fixed program parameter driven by vehicle design, while Army manpower depends on variable force structure. NASA rolls "health hazards" into "habitability and environment" and "safety." DoD splits "soldier survivability" from "safety" because ground combat survivability is a different problem from design-induced hazard control.

---

## 3. Ergonomics and Anthropometrics

Anthropometric accommodation is the most concrete HSI domain because it reduces to measurable geometry. The legacy aerospace standard was to accommodate the 5th percentile American female through the 95th percentile American male — a design range that deliberately excluded roughly 10% of the adult population. NASA-STD-3001 Volume 2 tightened this for the Artemis generation by requiring accommodation from the **1st percentile American female to the 99th percentile American male** for cabin geometry, seat design, reach envelopes, and suit fit, explicitly to expand the pool of eligible astronaut candidates and to address the fact that the historical 5th-to-95th envelope was based on a 1960s-era male-dominated population that no longer reflects the NASA corps.

Anthropometric data in the standard include:

- **Static dimensions:** stature, sitting height, eye height, shoulder breadth, hip breadth, popliteal height.
- **Reach envelopes:** functional reach with and without restraint, with and without pressurized suit gloves. Suit gloves reduce grip envelope by ~30% and add ~20 mm radial offset at the fingertips.
- **Strength limits:** peak push, pull, grip, and torque forces, scaled to the accommodated population and degraded for suited operation.
- **Visual fields:** central and peripheral, constrained by helmet geometry.
- **Microgravity anthropometry:** in 0g, spinal decompression increases stature by 3–5 cm, the neutral body posture shifts to a semi-crouched "astronaut posture," and the center of mass rises. Workstation design for ISS and Orion uses the 0g body envelopes, not 1g, because a 1g-sized crewstation leaves the crewmember floating above the controls.

The **Boeing Starliner CST-100 crew interface issues** identified during NASA OIG review illustrate what happens when these envelopes are interpreted loosely. Reach-to-switch timing for abort initiation, glove-compatible switch spacing, and display readability under cabin lighting variation all required rework after integrated sims because the initial design used anthropometric assumptions drawn from earlier Boeing crew programs rather than from NASA-STD-3001 Rev C directly. None of these were showstoppers, but each was an integration defect — the class of problem HSI is specifically chartered to catch before metal is bent.

---

## 4. Cognitive Workload and Attention

Physical accommodation is necessary but insufficient. The operator must also have enough cognitive bandwidth to execute the task. Modeling cognitive workload draws on three intellectual traditions:

### 4.1 NASA Task Load Index (NASA-TLX)

Developed at NASA Ames in the 1980s and published in its canonical form by Hart and Staveland (1988), **NASA-TLX** is the most widely used multidimensional subjective workload rating scale in aerospace. The instrument asks operators to rate six dimensions on a bipolar 0–100 scale:

1. **Mental Demand** — how much thinking, deciding, remembering, looking, searching?
2. **Physical Demand** — how much pushing, pulling, turning, controlling, activating?
3. **Temporal Demand** — how much time pressure?
4. **Performance** — how successful were you at accomplishing the task?
5. **Effort** — how hard did you have to work?
6. **Frustration** — how insecure, discouraged, irritated, stressed?

A weighted composite produces a single workload score that correlates strongly with external performance measures (error rate, reaction time, heart rate variability) and has been validated across cockpit, control room, UAV ground station, and surgical domains. Its virtue is that it is cheap, repeatable, and comparable across studies. Its limitation is that it is subjective and retrospective; by the time the crew rates the task, the high-workload window has closed.

### 4.2 Multiple Resource Theory (Wickens)

Chris Wickens's **Multiple Resource Theory** (1984, updated 2008) argues that human attention is not a single reservoir but a set of partially independent pools defined by modality (visual vs auditory), processing stage (perception vs cognition vs response), code (spatial vs verbal), and visual channel (focal vs ambient). Two tasks that draw from different pools can be performed concurrently at relatively low cost; two tasks that draw from the same pool interfere. The implication for crewstation design is that auditory warnings do not consume visual scan budget, that spatial and verbal displays can coexist, and that pulling the pilot's gaze off the outside world to check a head-down display incurs a measurable penalty under high-task conditions. Heads-Up Display (HUD) design explicitly trades on this principle.

### 4.3 Cognitive Bottlenecks and Attention Limits

The **psychological refractory period**, **attentional blink**, and **change blindness** are well-documented experimental findings with direct aerospace implications. The cockpit that assumes the crew will notice a quiet amber caution during a missed approach is relying on a visual salience mechanism that has been experimentally shown to fail under load. Design responses include redundant coding (color + shape + position + auditory tone), temporal spacing of high-workload events, automated alerting with priority hierarchies, and "sterile cockpit" procedural rules below 10,000 ft that constrain the task set.

---

## 5. Situational Awareness — Endsley's Three Levels

Mica Endsley's 1995 model remains the canonical definition of **situational awareness (SA)**:

> "The perception of the elements in the environment within a volume of time and space, the comprehension of their meaning, and the projection of their status in the near future."

This maps to three levels:

- **Level 1 — Perception.** Are the relevant cues being picked up at all? (Is the altitude tape visible? Is the traffic target on the scope? Is the warning bell audible?)
- **Level 2 — Comprehension.** Does the operator integrate the cues into an understanding of current state? (Is the aircraft descending through the cleared altitude? Is the approaching traffic a conflict?)
- **Level 3 — Projection.** Does the operator project forward to anticipate future state? (Will we bust the floor in the next 30 seconds? Will closure to the target require an evasive maneuver?)

SA failures typically manifest at Level 2 or Level 3 — the pilot sees the data but does not understand its implication, or understands it but does not project what it means for the next 60 seconds. The Asiana 214 approach to SFO in 2013 was a textbook Level 2/3 SA loss: the crew saw the airspeed decaying, saw the glidepath diverging, saw the approach becoming unstable, but did not integrate these cues into a correct understanding of the autothrottle mode (FLCH speed armed but inactive), and did not project the consequence (impact with the seawall). The NTSB final report (DCA13MA081) explicitly cited automation complexity, mode confusion, and inadequate monitoring skill as contributing factors — a catalogue of HSI failures in an aircraft that was mechanically airworthy throughout.

SA is measured in practice using:

- **SAGAT (Situation Awareness Global Assessment Technique)** — a simulator is frozen, displays blanked, and the operator is queried on relevant state variables at all three levels; scored against ground truth.
- **SPAM (Situation Present Assessment Method)** — real-time probe queries during the task.
- **SART (Situation Awareness Rating Technique)** — self-report on demand, supply, and understanding.

---

## 6. Human Error Taxonomy

### 6.1 Reason's Generic Error Modeling System (GEMS)

James Reason's 1990 framework distinguishes:

- **Slips** — actions performed correctly in intent but incorrectly in execution (hit the wrong switch). Skill-based behavior, automatic execution.
- **Lapses** — failures of memory (forgot to lower the gear). Skill-based, interrupted sequence.
- **Mistakes** — correct execution of the wrong plan (chose the wrong approach procedure). Rule-based (wrong rule applied) or knowledge-based (novel situation, incorrect reasoning).
- **Violations** — deliberate deviations from rules. Routine (cut a corner because everyone does), situational (pressured by weather or schedule), or exceptional (one-off emergency decision).

Reason's layered framework maps these onto Rasmussen's **Skill/Rule/Knowledge (SRK) hierarchy**: skill-based behavior is automatic and produces slips and lapses; rule-based behavior is procedural and produces mistakes when the wrong rule is selected; knowledge-based behavior is novel reasoning and produces mistakes under ambiguity and stress.

### 6.2 HFACS — Human Factors Analysis and Classification System

Scott Shappell and Doug Wiegmann's **HFACS** (2000) extends Reason's "Swiss cheese" model into a four-tier investigation taxonomy used by the U.S. Navy, USAF, FAA, and now adopted internationally:

- **Tier 1 — Unsafe Acts:** errors (decision, skill-based, perceptual) and violations (routine, exceptional).
- **Tier 2 — Preconditions for Unsafe Acts:** environmental factors (physical, technological), condition of operators (adverse mental/physiological state, physical/mental limitation), personnel factors (CRM, personal readiness).
- **Tier 3 — Unsafe Supervision:** inadequate supervision, planned inappropriate operations, failure to correct known problems, supervisory violations.
- **Tier 4 — Organizational Influences:** resource management, organizational climate, organizational process.

HFACS succeeds because it forces investigators past the attractive answer of "pilot error" into the organizational conditions that made the unsafe act possible. Almost every HFACS Tier 1 finding is paired with at least one Tier 3 or Tier 4 finding, which is what converts individual lessons into institutional change.

---

## 7. Human-in-the-Loop Design and Automation Surprises

### 7.1 Bainbridge's Ironies of Automation

Lisanne Bainbridge's 1983 paper **"Ironies of Automation"** remains the most cited short essay in the field. Its core arguments:

1. **The irony of skill degradation.** If you automate the routine tasks, you leave the human with only the non-routine tasks. But the non-routine tasks are precisely the ones that require skill acquired through routine practice. Automation therefore undermines the skill it depends on the human having when the automation fails.
2. **The irony of monitoring.** Humans are demonstrably poor passive monitors over long periods. Yet automation frequently reassigns the human to the passive monitoring role — watching for the rare event when the automation misbehaves.
3. **The irony of the residual task.** The human is left with the tasks the designer could not figure out how to automate, which are by definition the hardest ones. The human gets the garbage while the computer gets the easy wins.
4. **The irony of abstraction.** Automation hides the underlying process behind layers of display. When the automation misbehaves, the human must debug a process they cannot see directly.

Asiana 214 is a Bainbridge textbook case: the autothrottle was assumed to wake up and protect airspeed; when it did not (because the crew had armed FLCH SPD during a visual approach, a non-standard configuration), the crew was the last line of defense but had been passively monitoring an automation they trusted to handle the low-altitude envelope.

### 7.2 Mode Errors

A **mode error** is the class of failure in which the operator issues a command appropriate for one automation mode while the system is actually in a different mode. The Airbus A320 family has historically been studied for mode confusion because its Flight Mode Annunciator (FMA) encodes the active and armed modes of the autopilot, autothrottle, and FMS in a compact form that, under high workload, can be misread. The canonical mode-error accident is Strasbourg 1992 (Air Inter 148), in which a vertical-speed command of -3300 ft/min was entered when the intended mode was a -3.3° flightpath-angle descent; the resulting high descent rate produced CFIT in the Vosges mountains. Post-accident, the Flight Mode Annunciator was redesigned to differentiate the two modes more clearly — a retrofit HSI fix to an HSI design defect.

### 7.3 Human-in-the-Loop Design Principles

Mature HSI design follows a handful of principles that have emerged from 40 years of automation-surprise case studies:

- **Observable automation.** The operator must be able to see what the automation is currently doing, what it is about to do, and why.
- **Directable automation.** The operator must be able to tell the automation what to do, without fighting it or being forced to disengage it entirely.
- **Predictable mode transitions.** The automation must not change modes silently or in ways the operator cannot anticipate.
- **Graceful degradation.** When the automation reaches the edge of its competence, it must hand off to the operator with enough context for the operator to take over, not dump them into the soup.
- **Workload inversion awareness.** The automation should not maximize its contribution during low-workload phases and minimize it during high-workload phases — which, perversely, is what many autopilots did historically.

---

## 8. Systems Integration at Scale

HSI is half the module. The other half is the integration problem on the non-human side: how does a program prove that a system composed of thousands of subsystems, delivered by hundreds of contractors across a decade, meets its requirements as an integrated whole?

### 8.1 The Integration Problem

A modern human-rated launch vehicle has on the order of 10^6 parts, 10^4 requirements, and 10^3 interfaces documented in Interface Control Documents (see SYE-07). No single test environment can exercise the full operating envelope of the integrated system. You cannot launch a Shuttle stack in a wind tunnel. You cannot ignite SLS core-stage engines except on a test stand (the Green Run at Stennis) and then for flight. You cannot expose Orion to the full lunar thermal environment except in flight. Integration proof therefore decomposes into a stack of verification activities:

1. **Component qualification** — parts verified against their individual specs.
2. **Subsystem integration** — components integrated into subsystems, tested against subsystem specs.
3. **Element integration** — subsystems integrated into elements (core stage, upper stage, spacecraft, payload).
4. **Vehicle integration** — elements integrated into the full launch vehicle, typically at the Vehicle Assembly Building (KSC) or equivalent.
5. **End-to-end mission rehearsal** — integrated simulations ("wet dress rehearsal," fueling tests, countdown demonstrations, flight readiness firings).

Each rung has its own verification facility, procedures, and data products. The integration flow is documented in ECSS-E-ST-10-03C on the European side and in NASA's program-specific Integration and Test Plans (the SLS ITP, the Orion ITP, the Artemis Mission ITP).

### 8.2 NASA Integration Facilities

NASA's integration capability is distributed across its field centers by historical capability domain:

- **Marshall Space Flight Center (MSFC), Huntsville AL.** Propulsion systems integration, core stage integration, SLS programmatic integration, structural test stands, the Advanced Propulsion Test Facility.
- **Johnson Space Center (JSC), Houston TX.** Crew systems integration, Mission Control Center, astronaut training facilities (NBL, Space Vehicle Mockup Facility), ISS and Orion crew interface integration, mission simulators.
- **Kennedy Space Center (KSC), Cape Canaveral FL.** Launch processing, Vehicle Assembly Building, Firing Room, Launch Control Center, Crawler-Transporter operations, pad integration. KSC is the point where every element from every contractor finally meets in flight configuration.
- **Stennis Space Center (SSC), MS.** Propulsion test — the only facility in the U.S. that can hot-fire a full SLS core stage (the Green Run).
- **Glenn Research Center (GRC), Cleveland OH.** Propulsion and power systems components; cryogenic fluid management.
- **Langley Research Center (LaRC), Hampton VA.** Aerodynamics, structural dynamics, entry/descent/landing.

The integration facility is not just a building; it is a triad of **facility + tooling + trained workforce**. Rebuilding lost integration capability is notoriously hard — the Saturn V production line was dismantled after Apollo, and the Shuttle tooling was disposed of between 2011 and 2014, leaving SLS to re-establish core-stage tooling at MSFC's Michoud Assembly Facility at substantial schedule cost.

### 8.3 AIT&V — Assembly, Integration, Test, and Verification

ECSS-E-ST-10-03C formalizes the **Assembly, Integration and Test (AIT)** process with its associated verification (ECSS-E-ST-10-02C Verification). The process decomposes into:

- **Model philosophy.** Which test models will be built? Options include the Structural Model (SM), Thermal Model (TM), Engineering Model (EM), Qualification Model (QM), Proto-Flight Model (PFM), and Flight Model (FM). A "proto-flight" approach uses the flight article as its own qualification article, trading test margin for schedule and cost — appropriate for some classes of mission, dangerous for others.
- **Test plans.** Environmental (thermal vacuum, vibration, acoustic, EMC), functional, interface, and end-to-end. Each test has an entry criteria list, a procedure, a success criteria list, and a data package.
- **Anomaly resolution.** Every deviation from expected behavior is logged and dispositioned. The integration team cannot close a test with open anomalies; each must be explained, corrected, or accepted with rationale.
- **Verification control document.** The compliance matrix that tracks every requirement to its verification method, facility, and evidence.

### 8.4 The Integration Process Diagram

```
  Requirements (SYE-01)                               Verified Integrated System
        |                                                      ^
        v                                                      |
  [ Subsystem Specs ]                              [ Flight Readiness Review ]
        |                                                      ^
        v                                                      |
  [ Component Design ]                             [ End-to-End Mission Rehearsal ]
        |                                                      ^
        v                                                      |
  [ Component Manufacture ]                        [ Vehicle Integration at KSC/VAB ]
        |                                                      ^
        v                                                      |
  [ Component Qualification ] ---> [ Subsystem Integration ] ---> [ Element Integration ]
        |                                 |                              |
        v                                 v                              v
  [ Component Test Facilities ]   [ Subsystem Test Stands ]    [ Green Run, Thermal Vac ]
        |                                 |                              |
        +-- EVERY STAGE FEEDS ANOMALIES BACK TO REQUIREMENTS AND DESIGN --+
                                          |
                                          v
                              [ Verification Control Document ]
                              [ Compliance Matrix, Requirements Trace ]
```

The critical insight is that integration is not a phase at the end of the program; it is a continuous flow that begins when the first two components are joined and does not end until the last flight of the system. The verification control document is the backbone that proves, at each review gate (see SYE-09), that the integrated system meets the requirements baseline.

### 8.5 The Integration Test Environment Problem

No single test environment can reproduce the integrated system's full operating envelope. A Shuttle could not be flown in a wind tunnel. SLS cannot be test-launched before its first mission. The program therefore accepts that verification is incomplete until flight test — and structures its readiness reviews to make this explicit. The **Flight Readiness Review (FRR)** is precisely the meeting at which the program decides whether the residual integration risk, after all ground verification, is acceptable for flight. Apollo lost Apollo 1 when ground integration testing (a plugs-out test in a pure oxygen atmosphere) exposed a cabin-fire hazard that had not been identified during design review. Challenger and Columbia exposed integration failures at the O-ring-cold-temperature and foam-strike-thermal-protection interfaces respectively — both had been flagged in sub-program analyses but were not elevated to integrated vehicle risk in a way that the FRR would catch.

---

## 9. Real Examples — HSI in Flight Programs

### 9.1 Apollo Cockpit

The Apollo Command Module instrument panel is a landmark in crew-station design. Designed under intense schedule pressure between 1962 and 1968, it distributed more than 400 switches, circuit breakers, and indicators across panels visible to all three crew positions. Key HSI decisions: redundant critical controls so that any of the three crewmembers could execute an abort; monochrome displays chosen for reliability and to sidestep color-gamut problems under cabin lighting variation; the Display and Keyboard (DSKY) interface for the Apollo Guidance Computer, whose verb-noun command protocol was famously terse but trainable and proved operationally robust across all Apollo missions.

### 9.2 Shuttle Glass Cockpit Upgrade (MEDS)

The Space Shuttle was delivered in 1981 with an electromechanical cockpit that required four CRTs and roughly 32 round gauges. Between 1998 and 2002, NASA replaced the legacy cockpit with the **Multifunction Electronic Display Subsystem (MEDS)** — 11 full-color LCD displays with drastically reduced maintenance load and greatly improved pilot SA. Atlantis was the first Orbiter retrofit in 1998; the program was complete across all remaining Orbiters by 2002. MEDS is a textbook example of mid-life HSI modernization: the underlying aerodynamics, propulsion, and thermal protection did not change, but the crew's comprehension and projection (Endsley Levels 2 and 3) improved enough to justify the retrofit cost during the second half of the Shuttle program.

### 9.3 ISS Crew Procedures

The International Space Station runs on procedures. Every IVA activity, EVA timeline, science experiment, maintenance task, and contingency response is specified in a procedure document developed by the Mission Control procedures team at JSC with direct crew review and simulator validation. ISS procedures are the institutional memory of a crewed spacecraft that has operated continuously since November 2000, with crews rotating at roughly 6-month intervals. The procedure system is itself an HSI artifact: it encodes the workload and training assumptions of the HSI analysis into an operational document that is used in flight.

### 9.4 Orion / Artemis Crew Interface

Orion's crew interface reflects lessons from both Apollo and Shuttle. The switch count is deliberately kept low (roughly 60 physical switches versus Apollo's 400+) and the primary interaction path is through three Aitech glass-cockpit displays derived from commercial avionics practice. The underlying philosophy is **"fly the glass"** — normal operations are conducted through the display, with physical switches reserved for abort, safing, and display-failure backup. Crew training, workload budgets, and procedure authoring are being developed in parallel with the vehicle hardware in the Orion Crew Exploration Vehicle Avionics Integration Laboratory (CAIL) at JSC.

### 9.5 Boeing Starliner Crew Interface Issues

CST-100 Starliner's crew interface has been the subject of multiple NASA independent reviews. The key HSI findings, per public OIG and NASA Advisory Council materials, include timeline mismatches between the Boeing design and NASA-STD-3001 Rev C anthropometric requirements for gloved reach; abort initiation workflow that required iteration after integrated sim exposure; and crew feedback on control layout and display cueing that was addressed through post-CDR change orders. None of these are unusual for a first-of-type human-rated vehicle — the same class of finding appeared on Dragon 2 before Demo-2 — but they reinforce the lesson that human-rating requires integrated sims with the actual flight crew, in the actual suits, at a fidelity that exposes human-system interaction defects.

---

## 10. Synthesis: HSI as the Integration of Integrations

Returning to the opening thesis: HSI is not a separate discipline from systems integration; it is the discipline that acknowledges that the human is the final integration element. The crew in the cockpit integrates the automation, the propulsion, the environmental control, the communications, the procedures, and the training into a mission outcome. The flight controller at the console integrates the telemetry stream, the procedure flow, the ground support equipment, and the team coordination into a real-time decision. The maintainer in the VAB integrates the torque spec, the access panel, the tooling, and the procedure into a flight-worthy subassembly. Each of these humans is the last-meter integrator for their part of the system, and each of them is operating under anthropometric, cognitive, and organizational constraints that must have been engineered into the system upstream.

A mature HSI program produces several tangible artifacts that thread through the rest of the SE discipline (see SYE-01 through SYE-09):

- **HSI Plan.** A top-level plan that defines which HSI domains will be addressed, by whom, with what resources, and against what standards. Typically drafted by the SRR (Systems Requirements Review) gate.
- **Task Analyses.** Structured decompositions of crew and operator tasks that feed requirements for displays, controls, procedures, and training.
- **Workload Budgets.** Per-phase cognitive and physical workload estimates, with margins, treated analogously to mass and power budgets.
- **Anthropometric Accommodation Reports.** Verified reach envelopes, seating accommodation, and suit-fit data.
- **Usability and Human-in-the-Loop Test Reports.** Simulator and mockup test data that feed the verification control document.
- **Training Task List and Training System Requirements.** The training-program analog of the SRS.

When these artifacts exist, are maintained in configuration control (SYE-06), trace to requirements (SYE-01), and are verified through the V&V process (SYE-03), HSI becomes a first-class citizen of the SE lifecycle rather than an end-of-CDR clean-up activity. When they do not exist, the program discovers HSI defects during integrated testing at 10x to 100x the cost of catching them in requirements — which is the same cost multiplier the SE discipline sees for requirements defects generally, because HSI *is* a class of requirements defect when ignored.

---

## Key References

- NASA. *NASA/SP-2015-3709 Human Systems Integration (HSI) Practitioner's Guide.*
- NASA. *NASA-STD-3001, Vol. 1 Crew Health* and *Vol. 2 Human Factors, Habitability, and Environmental Health.* Rev C, 2022/2023.
- NASA. *NASA Systems Engineering Handbook, NASA/SP-2016-6105 Rev 2.*
- INCOSE. *Systems Engineering Handbook, v5.* 2023.
- U.S. Army. *AR 602-2 Human Systems Integration in the System Acquisition Process.*
- DoD. *MIL-HDBK-46855A, Human Engineering Program Process and Procedures.*
- ECSS. *ECSS-E-ST-10-03C Assembly, Integration and Test.*
- Endsley, M. R. (1995). "Toward a theory of situation awareness in dynamic systems." *Human Factors, 37*(1), 32–64.
- Hart, S. G., & Staveland, L. E. (1988). "Development of NASA-TLX." In P.A. Hancock & N. Meshkati (Eds.), *Human mental workload.*
- Wickens, C. D. (2008). "Multiple Resources and Mental Workload." *Human Factors, 50*(3), 449–455.
- Reason, J. (1990). *Human Error.* Cambridge University Press.
- Shappell, S. A., & Wiegmann, D. A. (2000). *The Human Factors Analysis and Classification System–HFACS.* FAA DOT/FAA/AM-00/7.
- Bainbridge, L. (1983). "Ironies of Automation." *Automatica, 19*(6), 775–779.
- NTSB. *DCA13MA081 — Asiana Airlines Flight 214, Boeing 777-200ER, San Francisco, 6 July 2013.*
- NASA OIG. *NASA's Management of the Commercial Crew Program* (various reports 2019–2023).
- Rasmussen, J. (1983). "Skills, rules, and knowledge; signals, signs, and symbols." *IEEE Transactions on Systems, Man, and Cybernetics.*

---

**Module 10 of 10 — Systems Engineering research series (SYE). Rosetta Cluster: Infrastructure. Cross-references: SYE-01 Requirements, SYE-03 V&V, SYE-06 CM, SYE-07 ICDs, SYE-09 Lifecycle; NASA mission series, AMS, SOO, RCA.**
