# Risk Management

*Systems Engineering Research Module 05*

## Overview

Risk management is the discipline of identifying, analyzing, communicating, and responding to uncertainty — before that uncertainty becomes a headline. In aerospace and other safety-critical domains, risk management is not an optional overlay on systems engineering; it is one of the load-bearing columns. The NASA Systems Engineering Handbook (NASA/SP-2016-6105 Rev 2) and the INCOSE Systems Engineering Handbook both treat risk management as a cross-cutting technical management process that operates from the moment a concept is sketched on a whiteboard to the moment the last piece of hardware is decommissioned.

This module traces the evolution of formal risk management from its roots in nuclear safety through its elaboration into Probabilistic Risk Assessment (PRA) at NASA, examines the principal analytical techniques — FMEA, FMECA, FTA, event trees, Bayesian networks, Monte Carlo simulation — and places them in the policy frameworks that govern how decisions actually get made: NASA's Risk-Informed Decision Making (RIDM) per NASA/SP-2010-576 and Continuous Risk Management (CRM). It closes with hard case studies — Challenger, Columbia, Apollo 13, JWST — because risk management is ultimately a story told in the language of what went wrong, what almost went wrong, and what was saved.

The central premise of this module: **risk is not the same thing as uncertainty, and neither is the same thing as danger**. Risk is structured uncertainty about outcomes that matter, expressed with enough precision that it can be acted on. Good risk management does not eliminate risk — it makes risk visible, comparable, and tradeable against cost, schedule, and capability.

## 1. Foundations: NASA and INCOSE Frameworks

### 1.1 Definitional Core

NASA defines a risk as a triplet: *scenario*, *likelihood*, *consequence*. This formulation, drawn from Kaplan and Garrick's 1981 paper "On the Quantitative Definition of Risk" (Risk Analysis, Vol. 1, No. 1), asks three questions for every risk:

1. **What can go wrong?** (the scenario)
2. **How likely is it?** (the likelihood)
3. **What are the consequences?** (the impact)

INCOSE adopts essentially the same model, with slightly different emphasis on opportunity management — treating beneficial uncertainty as the mirror of risk. The INCOSE Systems Engineering Handbook v4 defines risk management as "an organized, systematic decision-support process that identifies, analyzes, plans, tracks, controls, communicates, and documents risks."

Two frameworks dominate NASA practice:

- **NPR 8000.4** (Agency Risk Management Procedural Requirements) — the top-level policy document that mandates risk management across all NASA programs.
- **NASA/SP-2011-3421** (Probabilistic Risk Assessment Procedures Guide for NASA Managers and Practitioners, Second Edition) — the technical bible for PRA at NASA.
- **NASA/SP-2010-576** (NASA Risk-Informed Decision Making Handbook) — describes how risk information flows into actual decisions.

### 1.2 The Five Performance Measures

NASA's risk-informed framework organizes risk around five performance measures, which together bound what a program cares about:

1. **Safety** — loss of crew, loss of public, loss of environment
2. **Technical** — mission success, capability achievement
3. **Cost** — overrun against budget
4. **Schedule** — slippage against milestones
5. **Programmatic** — workforce, political, institutional, and strategic

These five dimensions correspond to the rows of a typical risk register and allow a single scenario to be scored in multiple ways. A thruster malfunction, for example, may be a moderate safety risk, a high technical risk, a low cost risk, and a severe schedule risk — all at once.

### 1.3 Continuous Risk Management (CRM)

NASA's CRM process is a closed loop with six phases, often drawn as a wheel:

```
         Identify
           |
           v
        Analyze
           |
           v
         Plan
           |
           v
        Track
           |
           v
        Control
           |
           v
      Communicate
           |
           +----> (back to Identify)
```

Each phase feeds the next, and every phase feeds the Communicate node. The loop runs continuously throughout the project lifecycle. CRM is deliberately lightweight — it's the default mode for handling risks that don't require the heavier machinery of PRA or RIDM. Most of the risks a program deals with day-to-day live in CRM.

## 2. Risk Identification Methods

Identification is the front door. Anything you don't identify, you can't manage. Several complementary techniques exist.

### 2.1 Brainstorming

Structured brainstorming with cross-functional participants remains the workhorse. NASA typically runs facilitated "risk workshops" at major milestone reviews (SRR, PDR, CDR), where engineers, managers, safety personnel, and sometimes operations staff are asked to generate risks against a pre-circulated list of topics. The facilitator's job is to encourage breadth and to resist premature evaluation — the instinct to argue a risk down before it is even written on the board.

### 2.2 Checklists

Checklists are derived from historical risks captured across past programs. The NASA Lessons Learned Information System (LLIS, llis.nasa.gov) contains thousands of entries that can be mined for checklists by domain — propulsion, thermal, avionics, software, human factors. The ESA GNC (Guidance, Navigation and Control) risk checklist and the Aerospace Corporation's space vehicle risk taxonomy are other heavily-used sources.

### 2.3 Lessons Learned Databases

Lessons learned go beyond simple checklists by preserving the narrative context of past risks. A well-formed lesson captures: what happened, why it happened, what the consequence was, and what the corrective action or mitigation was. Mining lessons learned is a slow activity but one of the highest-yield identification techniques, especially for recurring failure patterns (software interface mismatches, thermal cycling fatigue, contamination during integration).

### 2.4 HAZOP — Hazard and Operability Study

HAZOP originated in the British chemical industry in the 1960s at Imperial Chemical Industries. It is a structured group technique that walks through a system design node by node and applies guide words to each design parameter:

| Guide Word | Meaning                     |
|------------|-----------------------------|
| NO         | Complete negation           |
| MORE       | Quantitative increase       |
| LESS       | Quantitative decrease       |
| AS WELL AS | Qualitative increase        |
| PART OF    | Qualitative decrease        |
| REVERSE    | Logical opposite            |
| OTHER THAN | Complete substitution       |
| EARLY      | Timing earlier than intended |
| LATE       | Timing later than intended   |
| BEFORE     | Out of sequence             |
| AFTER      | Out of sequence             |

For a propellant line carrying liquid oxygen, applying HAZOP guide words yields: NO flow (valve failure), MORE flow (regulator failure), LESS flow (line restriction), REVERSE flow (check valve failure), OTHER THAN LOX (contamination), EARLY flow (premature valve opening), and so on. HAZOP is expensive — a thorough study on a complex spacecraft subsystem can consume hundreds of engineer-hours — but it is remarkably good at surfacing scenarios that brainstorming misses.

### 2.5 What-If Analysis

What-if is HAZOP's informal cousin. Rather than applying a fixed guide-word grid, the team poses open questions: "What if the solar arrays don't deploy?" "What if the attitude control fails during the burn?" "What if ground comm is lost during entry?" What-if is faster than HAZOP but depends heavily on the imagination and experience of the participants. It is best used as a pre-HAZOP warm-up or as a rapid risk sweep when time is short.

## 3. Risk Taxonomies

A taxonomy is a structured decomposition of the risk space. NASA uses overlapping taxonomies drawn from SEI (Software Engineering Institute), the Aerospace Corporation, and internal sources.

### 3.1 Top-Level Classes

- **Technical risks** — the system will not perform as required. Includes design maturity, integration risks, performance margins, technology readiness, and verification risks.
- **Programmatic risks** — the program will not execute as planned. Includes workforce, funding stability, stakeholder alignment, organizational change, and political risk.
- **Cost risks** — the program will exceed its budget. Includes estimating uncertainty, scope growth, and inflation.
- **Schedule risks** — the program will miss its milestones. Includes task estimating, critical-path fragility, and logistics delays.
- **Safety risks** — personnel, public, or property will be harmed. The highest-priority class; drives most formal PRA work.
- **Security risks** — information, hardware, or operations will be compromised. Cybersecurity has grown into a first-class taxonomic peer of safety in the last fifteen years.

### 3.2 The SEI Software Risk Taxonomy

For software-intensive systems, SEI's 13-class taxonomy is widely cited:

1. Product engineering — requirements, design, code, test
2. Development environment — process, methods, tools, work environment
3. Program constraints — resources, contract, interfaces

Each class decomposes further into attributes and elements. SEI's original 1993 Taxonomy-Based Questionnaire (TBQ, CMU/SEI-93-TR-6) remains the canonical reference.

### 3.3 Emerging Classes

Modern NASA programs increasingly recognize taxonomic classes that did not exist in the Apollo era: supply-chain risk (particularly for microelectronics and rare materials), orbital debris risk, workforce attrition risk for specialized skills, and export control / ITAR risk. JWST famously grappled with single-source suppliers going out of business during its decade-plus development.

## 4. Probabilistic Risk Assessment (PRA)

PRA is the heavyweight technique — quantitative, model-based, and traceable. NASA's PRA Procedures Guide (NASA/SP-2011-3421, Second Edition, December 2011) is the authoritative reference.

### 4.1 Origins and Purpose

PRA was born in the US nuclear power industry with the 1975 Reactor Safety Study (WASH-1400, the "Rasmussen Report"), which pioneered the systematic combination of event trees and fault trees to estimate the probability of reactor core damage. NASA adopted PRA slowly — the agency was notoriously hostile to probabilistic methods during the Apollo and early Shuttle eras, preferring "design it right" deterministic margins. The Challenger disaster in 1986 and the Rogers Commission report's finding that NASA had no credible probabilistic estimate for Shuttle failure pushed the agency toward PRA. By the early 2000s, PRA was required for all human-rated flight systems.

### 4.2 The PRA Workflow

The NASA PRA Procedures Guide defines a workflow with roughly nine steps:

1. **Objectives definition** — what question is the PRA answering?
2. **Familiarization and information assembly** — gather design documents, operating procedures, historical data.
3. **Identification of initiating events** — what upsets the system?
4. **Scenario modeling** — use event trees to trace scenarios from initiators to end states.
5. **Failure modeling** — use fault trees to decompose equipment and human failures.
6. **Data collection and parameter estimation** — gather failure rates and probabilities, often from MIL-HDBK-217, NPRD, or Bayesian updating of generic data.
7. **Quantification** — calculate probabilities and consequences.
8. **Uncertainty analysis** — propagate parameter uncertainty through the model, typically via Monte Carlo simulation.
9. **Sensitivity analysis and presentation** — identify dominant contributors, present results.

### 4.3 Event Trees

An event tree is a left-to-right tree that starts with an **initiating event** and branches at each subsequent **pivotal event** into success (up) and failure (down) paths. The leaf nodes are **end states**, each labeled with a consequence class (OK, degraded, loss of mission, loss of crew, etc.).

```
Initiating Event: Thruster Valve Fails Open
                                         |
                 +-----------------------+
                 |                       |
           Isolation                Isolation
           Valve Closes             Valve Fails
                 |                       |
          +------+                 +-----+
          |                        |
      OK  (no                 Backup Thruster
            prop loss)        System Activates
                                     |
                          +----------+
                          |          |
                   Backup      Backup Fails
                   Succeeds           |
                      |         +----+
                  Degraded      |    |
                  Mission    Vent  Vent
                             Works  Fails
                               |     |
                           Mission  Loss
                           Abort    of Vehicle
```

Each branch has a conditional probability. The probability of an end state is the product of branch probabilities along its path. Summing over all paths that reach a given end state gives the total probability of that end state given the initiator. Multiplying by the initiator frequency gives the absolute frequency.

### 4.4 Fault Trees

A fault tree is a top-down, deductive decomposition of a single undesired event (the "top event") into the combinations of lower-level failures that cause it. Fault trees use Boolean logic gates — AND, OR, XOR, inhibit — standardized in IEC 61025 and NUREG-0492. The standard graphical symbols:

- **Rectangle** — an event that is further decomposed
- **Circle** — a basic (undecomposed) event, typically a component failure
- **House** — a normally-occurring event (condition)
- **Diamond** — an undeveloped event (not decomposed, either by choice or lack of data)
- **AND gate** — output occurs only if all inputs occur
- **OR gate** — output occurs if any input occurs

The fault tree is solved by converting it to its **minimal cut sets** — the smallest combinations of basic events that together cause the top event. A cut set of size 1 is a single-point failure. Minimal cut sets expose the dominant failure modes and are the natural targets for mitigation.

### 4.5 Fault Tree Example: Loss of Attitude Control

```
                    TOP: Loss of Attitude Control
                               |
                              OR
                               |
                +--------------+---------------+
                |              |               |
           Primary IMU      Backup IMU      Software
           Fails           Fails              Halt
                |              |               |
               AND            AND              |
                |              |              OR
         +------+-----+    +---+---+          |
         |            |    |       |     +----+----+
     Mechanical   Power   Sensor  Power  |         |
     Failure      Loss    Drift   Loss  Watchdog   Stack
         |            |    |       |    Timeout  Overflow
       (1E-5/hr)  (shared)(2E-5)(shared)(1E-4/hr)(1E-6/hr)
```

The "Power Loss" event appears under both primary and backup IMU fault trees because they share a common power bus. This is a **common cause failure** (CCF) — one of the most important effects to capture in a PRA. If the analyst missed the shared bus and computed each IMU failure as independent, the joint failure probability would be estimated as P(primary) × P(backup), perhaps 1E-9/hr. The correct calculation treats the shared bus as a single-point failure and yields a much higher probability. **Common cause failure modeling is where real PRA skill lives.**

### 4.6 Bayesian Networks

Bayesian networks generalize fault trees. Where a fault tree is restricted to Boolean logic, a Bayesian network allows any conditional probability table between a node and its parents. This makes Bayesian networks well-suited to graded failures, partial dependencies, and evidence updating. NASA uses Bayesian networks increasingly in operational risk management — for example, to update the probability of on-orbit anomaly recurrence as new telemetry arrives.

### 4.7 Monte Carlo Simulation

The parameters of a PRA model — failure rates, human error probabilities, initiator frequencies — are themselves uncertain. Monte Carlo simulation propagates this uncertainty by sampling each parameter from its distribution (often lognormal for hardware failure rates), running the PRA model many times (10,000 to 1,000,000 trials), and building an empirical distribution of the output. The result is a distribution on the risk metric — say, P(loss of crew) — rather than a point estimate. The 5th and 95th percentiles of this distribution bound a 90% credible interval.

The NASA Shuttle PRA in 2005 (SSP-50808) produced a mean P(LOCV — Loss of Crew and Vehicle) per mission of approximately 1 in 77, with a 90% credible interval roughly from 1 in 45 to 1 in 130. This was a much more honest estimate than the deterministic "approximately 1 in 100,000" number that had circulated inside NASA before Challenger.

## 5. FMEA and FMECA

### 5.1 FMEA

Failure Modes and Effects Analysis is a bottom-up, inductive technique. Start with a component. Enumerate its failure modes. For each mode, trace the effect on the next assembly, the subsystem, and the system. Document causes, detection methods, and compensating provisions. FMEA is typically performed as a structured worksheet:

| Item | Function | Failure Mode | Cause | Local Effect | Subsystem Effect | Mission Effect | Detection | Compensating Provisions | Severity |
|------|----------|--------------|-------|--------------|------------------|----------------|-----------|-------------------------|----------|

FMEA was formalized in the US military as MIL-STD-1629A (1980) — "Procedures for Performing a Failure Mode, Effects and Criticality Analysis." Though MIL-STD-1629A was formally cancelled in 1998, it remains the most-cited FMEA standard in aerospace. The automotive industry uses SAE J1739 — "Potential Failure Mode and Effects Analysis in Design (Design FMEA), Supplier and Subcontractor Process (Process FMEA)" — which introduced the Risk Priority Number (RPN) concept.

### 5.2 FMECA — Adding Criticality

FMECA extends FMEA by adding a quantitative criticality ranking. The criticality number is typically computed as:

```
Cm = β × α × λp × t
```

where β is the probability the failure mode actually causes the effect, α is the mode ratio (fraction of component failures that take this mode), λp is the part failure rate, and t is the operating time. Alternatively, the automotive Risk Priority Number (SAE J1739) computes:

```
RPN = Severity × Occurrence × Detection
```

with each factor on a 1-10 scale, yielding RPNs from 1 to 1000. High RPN items are flagged for mitigation. Critics of the RPN approach (including recent revisions of AIAG-VDA) note that RPN hides information by multiplying dissimilar scales. The AIAG-VDA 2019 revision replaced RPN with an "Action Priority" (AP) lookup table.

### 5.3 FMECA in Practice

A typical spacecraft FMECA runs thousands of line items. The Cassini-Huygens FMECA was widely reported to have exceeded 10,000 entries. The volume is both a strength and a weakness — it forces systematic coverage but also produces a document nobody reads end-to-end. In practice, FMECAs are mined by search and filter: show me all Criticality-1 items (single-point failures with catastrophic consequence), show me all items with no detection, show me all items with manual workarounds.

## 6. Fault Tree Analysis in Standards

FTA is standardized in **IEC 61025** ("Fault tree analysis (FTA)", 2006) and **NUREG-0492** ("Fault Tree Handbook", US NRC, 1981). The two documents are compatible; IEC 61025 is the international successor. Both specify:

- Symbology (AND, OR, inhibit, priority-AND, XOR gates; events as rectangles, circles, diamonds, houses)
- Construction rules (top-down decomposition, single top event, consistent naming)
- Qualitative analysis (minimal cut sets)
- Quantitative analysis (probability of the top event given the probabilities of basic events)
- Common cause failure treatment (beta factor, MGL, alpha factor models)

Modern FTA is computer-assisted. Tools such as Isograph FaultTree+, Itemsoft IQ-FMECA, NASA's SAPHIRE (used by the NRC and NASA), and the open-source OpenFTA handle trees with tens of thousands of basic events.

## 7. Risk Matrices

The risk matrix is the simplest quantitative-ish tool in the risk manager's toolbox — and the most frequently misused.

### 7.1 The 5×5 Matrix

The standard NASA risk matrix has likelihood on one axis (1-5, from "very low" to "very high") and consequence on the other axis (1-5, from "minimal" to "catastrophic"). Cells are colored:

```
              Consequence
              1    2    3    4    5
         +----+----+----+----+----+
       5 | Y  | Y  | R  | R  | R  |
         +----+----+----+----+----+
       4 | G  | Y  | Y  | R  | R  |
         +----+----+----+----+----+
       3 | G  | G  | Y  | Y  | R  |
         +----+----+----+----+----+
       2 | G  | G  | G  | Y  | Y  |
         +----+----+----+----+----+
       1 | G  | G  | G  | G  | Y  |
         +----+----+----+----+----+
Likelihood

G = Green (accept), Y = Yellow (mitigate), R = Red (escalate)
```

Each cell maps to a management response: green risks are accepted with monitoring, yellow risks require documented mitigation plans, red risks must be escalated to the program manager or higher. NASA's specific cell boundaries and escalation rules are program-dependent and captured in the Risk Management Plan (RMP).

### 7.2 Known Pathologies

Tony Cox's 2008 paper "What's Wrong With Risk Matrices?" (Risk Analysis, Vol. 28, No. 2) is required reading. Cox shows that risk matrices can violate basic consistency properties — two risks with genuinely different quantitative scores can map to the same cell, and two risks in the same cell can actually have very different total risk. The matrix is a communication tool, not an analytical one. Treat it as such.

### 7.3 ALARP

ALARP — **As Low As Reasonably Practicable** — is a concept borrowed from UK health and safety law (Health and Safety at Work Act 1974, and the Edwards v. National Coal Board judgment of 1949). A risk is reduced to ALARP when the cost of further reduction is grossly disproportionate to the benefit. ALARP is explicitly part of UK rail, nuclear, and offshore safety regimes, and NASA borrows the concept for residual risk acceptance. The ALARP band is usually drawn between an intolerable region (risks too high to be borne regardless of benefit) and a broadly acceptable region (risks so low that further reduction is not warranted). Most program decisions occur in the ALARP band.

## 8. NASA RIDM — Risk-Informed Decision Making

NASA/SP-2010-576 (NASA Risk-Informed Decision Making Handbook) describes a structured process for making decisions in the presence of uncertainty. RIDM is invoked when a decision has significant consequences and when uncertainty is high enough that deterministic analysis is inadequate.

### 8.1 The Three RIDM Steps

1. **Identification of alternatives** — the decision-maker assembles a set of viable options. The set must include the baseline and must be broad enough to bound the decision space.
2. **Risk analysis of alternatives** — each alternative is analyzed against the five performance measures (safety, technical, cost, schedule, programmatic). Analysis may include PRA, deterministic engineering analysis, expert elicitation, or some combination.
3. **Risk-informed alternative selection** — the decision-maker is presented with a structured comparison and makes a selection, documenting both the choice and the rationale.

RIDM is deliberately *risk-informed*, not *risk-based*. The distinction matters. Risk-based decision-making treats the risk analysis output as the decision. Risk-informed decision-making treats risk analysis as one input among several, preserving the decision-maker's authority and responsibility. This is a deeply intentional choice — NASA learned from the nuclear industry that fully automating decisions on quantitative risk leads to over-reliance on numbers whose uncertainty is poorly communicated.

### 8.2 RIDM and CRM Together

RIDM and CRM are complementary. RIDM handles big, infrequent decisions at decision points (selection of architecture, choice of launch vehicle, go/no-go for major test). CRM handles the continuous flow of routine risks during execution. In practice, a big program runs both concurrently: CRM every week, RIDM when a major decision point arrives.

## 9. Risk Registers, Burn-Down Charts, and Leverage Matrices

### 9.1 The Risk Register

The risk register is the day-to-day working document of CRM. It is a database — row per risk — with columns for risk ID, statement, likelihood, consequence, risk score, owner, mitigation plan, mitigation status, next review date, and closure criteria. NASA's Agency-level risk database is called RIDS (Risk Information Database System) but most programs maintain local registers in spreadsheets or in tools like Active Risk Manager, JIRA (with plugins), or custom Confluence pages.

A well-maintained risk register has three rhythms:
- **New risks added** as they are identified
- **Existing risks updated** as mitigations are executed or conditions change
- **Closed risks archived** with their history preserved

The archive is important. Closed risks are the raw material for future lessons-learned.

### 9.2 Risk Burn-Down Charts

A burn-down chart plots open risks (usually weighted by risk score) against time. A healthy program shows a downward trend — risks are being retired faster than new ones are identified. An unhealthy program shows either a flat or rising trend (risks are not being closed), or a sudden drop (risks are being closed administratively rather than actually mitigated). Burn-down charts are particularly useful at major milestones: PDR should have a certain profile of closed risks, CDR another, system integration yet another.

### 9.3 Risk Leverage Matrix

The risk leverage matrix plots risk reduction (on the y-axis) against cost of mitigation (on the x-axis). High-leverage risks — big reduction for small cost — cluster in the upper-left. Low-leverage risks — small reduction for big cost — cluster in the lower-right. The leverage matrix is used to prioritize mitigation spending, especially when the mitigation budget is constrained. It answers the question: "if I have $1M to spend on risk mitigation, where should I spend it?"

## 10. Residual Risk Acceptance

At some point, every risk stops being "open" — either it is mitigated to closure or it is accepted as residual. Residual risk acceptance is a formal act: the authority to accept a residual risk is defined in the program's Risk Management Plan and is typically a function of the risk level. Green risks may be accepted by line engineers. Yellow risks require Program Manager sign-off. Red risks require Center Director or Mission Directorate sign-off. For human spaceflight programs, Level 1 (Loss of Crew) residual risks typically require the NASA Administrator's concurrence.

Residual risk acceptance is a documented act — the rationale is written down, the authority signs, and the risk moves from the open register to the accepted-residual register. The act creates institutional accountability.

## 11. Case Studies

### 11.1 Challenger — The O-Ring Risk Underestimated

On January 28, 1986, Space Shuttle Challenger broke apart 73 seconds after launch due to failure of an O-ring in the right solid rocket booster's aft field joint. Seven crew members died.

The Rogers Commission found that NASA had known about O-ring erosion since 1977 and had seen O-ring damage on multiple flights, including severe erosion on STS-51C (January 1985), which had launched in cold weather. Engineers at Morton Thiokol, the SRB contractor, had warned in the pre-launch teleconference the night before Challenger's launch that the O-ring could lose resiliency at low temperature. They were overruled.

The Rogers Commission's probabilistic analysis, led by Richard Feynman, found that NASA management was using informal estimates of Shuttle failure probability of around 1 in 100,000 per flight, while working engineers were estimating closer to 1 in 100. Feynman's appendix F to the Rogers Report is one of the most-quoted passages in aerospace risk management:

> "It would appear that, for whatever purpose, be it for internal or external consumption, the management of NASA exaggerates the reliability of its product, to the point of fantasy."

The O-ring failure was a known risk that had not been correctly quantified. Had it been quantified with a real PRA — accounting for temperature sensitivity, erosion history, and the known joint rotation problem — Challenger would not have launched that morning. The post-Challenger NASA rebuilt its risk management on the explicit premise that informal qualitative judgment was not enough for high-consequence decisions.

### 11.2 Columbia — The Foam Debris Risk Dismissed

On February 1, 2003, Space Shuttle Columbia broke apart on reentry over Texas due to a breach in the thermal protection system of the left wing leading edge. Seven crew members died.

The proximate cause was a suitcase-sized piece of foam insulation from the external tank that struck the wing at approximately 545 mph during launch. The Columbia Accident Investigation Board (CAIB) found that foam shedding had been observed on multiple previous Shuttle flights and had been classified as a "maintenance issue" rather than a safety-of-flight issue. When engineers requested imaging of the wing during Columbia's mission to assess possible damage, the request was denied by management.

The CAIB report's Chapter 6 is an anatomy of institutional risk management failure. The foam risk had been:
- **Identified** (foam shedding was known)
- **Categorized** as "not a safety issue" (incorrectly)
- **Not analyzed** with a PRA (the tools existed but were not applied)
- **Not escalated** when engineers raised concerns
- **Normalized** — the phrase "normalization of deviance," coined by sociologist Diane Vaughan in her 1996 book *The Challenger Launch Decision*, was used in the CAIB report to describe how NASA had come to accept foam strikes as routine.

Columbia is the canonical case study for a risk that was identified but was not correctly analyzed or escalated. The lesson is that identification alone is not enough — risks must be analyzed quantitatively, communicated to decision-makers with the appropriate authority, and reopened when new information arrives.

### 11.3 Apollo 13 — Redundancy Saved the Mission

On April 13, 1970, an oxygen tank in the Apollo 13 Service Module exploded 55 hours into the mission. The explosion destroyed one of two oxygen tanks, damaged the other, and crippled the Command/Service Module (CSM). The crew — Jim Lovell, Jack Swigert, and Fred Haise — used the Lunar Module (LM) as a lifeboat and returned safely to Earth.

The Apollo 13 story is usually told as a story of crew heroism and ground-team improvisation, which it was. But it is also a story of risk management done right. The Apollo program had followed a deliberate redundancy philosophy from the beginning:

- **Two independent oxygen tanks** (one was destroyed; the other leaked out)
- **Two independent fuel cells** for power
- **Two independent spacecraft** (CSM and LM) with overlapping capabilities — life support, attitude control, propulsion
- **Multiple return trajectories** computed and available
- **Ground simulators** that could model off-nominal situations in near-real-time

The LM had not been designed to support three crew members for four days, but its life support margin was sufficient — because it had been sized with margin against its own nominal mission. Margin is one of the most effective forms of risk mitigation: you don't know what you'll need the margin for, but when something unexpected happens, margin is the only thing that saves you.

Apollo 13 also illustrates the value of trained, rehearsed procedures under stress. The ground team in Mission Control had rehearsed dozens of off-nominal scenarios. Their ability to compose novel procedures (the LiOH canister adapter, the "square peg in a round hole" CO2 scrubber) came from a culture of simulation and rehearsal. Risk management is not just documents; it is a culture of preparedness.

### 11.4 JWST — Ten Thousand Single-Point Failures

The James Webb Space Telescope was launched on December 25, 2021 after a development that lasted more than 25 years and cost approximately $10 billion. JWST's deployment sequence — executed over the first month after launch — required 344 single-point-failure mechanisms to execute correctly. The telescope's 18-segment primary mirror, five-layer sunshield, and secondary mirror all had to unfold, latch, tension, and align with no possibility of repair.

JWST's risk management was a decades-long exercise in driving down single-point-failure probability. The program used:

- **Exhaustive FMECA** at the component level
- **Fault tree analysis** for every deployment step
- **Ground-based deployment rehearsals** (sunshield deployment was tested on the ground in vacuum and under simulated launch loads)
- **Margin in every budget** (mass, power, data, schedule)
- **Redundancy where possible** (two star trackers, two reaction wheel assemblies, etc.)

The success of JWST's deployment — every one of the 344 SPFs executed correctly — is a testament to risk management at scale. JWST also illustrates that risk management costs money. The cost growth of JWST from its original ~$1B estimate to its final ~$10B was driven in significant part by the risk mitigation work that management eventually, and correctly, decided was necessary.

## 12. A Worked PRA Example

Let us work through a miniature PRA to make the methodology concrete. Consider a spacecraft reaction wheel assembly (RWA) with three wheels in a redundant triad. Attitude control requires at least two operational wheels.

**Step 1. Initiating event.** RWA failure initiator: failure of one wheel during a 5-year mission.

**Step 2. Failure rate data.** Historical wheel failure rate from on-orbit data: λ = 1.5E-5/hr, lognormal with error factor 3.

**Step 3. Event tree.** Initiator: one wheel fails. Pivotal event 1: does the flight software correctly reconfigure? Pivotal event 2: does the remaining two-wheel configuration hold attitude? Pivotal event 3: within the remaining mission duration, does a second wheel fail?

**Step 4. Fault tree.** The top event "loss of attitude control" is reached if (reconfiguration fails) OR (second wheel fails AND crew/ground cannot safe-mode in time). Construct cut sets.

**Step 5. Quantification.** Using the failure rate of 1.5E-5/hr, the probability of at least one wheel failure in 5 years (43,800 hours) is approximately 1 - exp(-3 × 1.5E-5 × 43800) ≈ 0.86. Given one failure, the probability of a second failure in the remaining mean time is roughly 0.30. Probability of reconfiguration failure: 1E-3. Combining: P(loss of attitude control over mission) ≈ 0.26 × 0.001 + 0.86 × 0.30 ≈ 0.26. This result is uncomfortably high and drives a design decision: fly four wheels, not three.

**Step 6. Uncertainty analysis.** Sample the failure rate from its lognormal distribution, run 10,000 Monte Carlo trials, and report the 5th and 95th percentiles: perhaps [0.12, 0.44]. The mean estimate is 0.26, but the upper tail reaches 0.44 — a 44% probability of loss of attitude control over mission. This wide interval tells the decision-maker that the estimate is uncertain and that investing in a tighter data point (or in additional redundancy) has high value.

**Step 7. Present to RIDM.** The PRA result feeds a decision: three wheels vs. four wheels vs. three wheels with enhanced fault recovery. Each alternative is analyzed against safety, technical, cost, schedule, and programmatic axes. The decision-maker selects an option with documented rationale.

This miniature example compresses what a real PRA does over months of work. The process — initiator, event tree, fault tree, data, quantification, uncertainty, decision — is invariant.

## 13. Synthesis

Risk management in complex systems engineering is a discipline of making uncertainty legible. It does not eliminate risk; it makes risk into an object that can be identified, analyzed, communicated, and decided upon. The tools — brainstorming, checklists, HAZOP, FMEA, FMECA, FTA, event trees, Bayesian networks, Monte Carlo, risk matrices, RIDM, CRM — are all in service of that goal.

Four lessons survive every case study:

1. **Identification is necessary but not sufficient.** Columbia's foam risk was identified and ignored. Identification without analysis and escalation is theater.

2. **Quantification beats intuition for high-consequence decisions.** Challenger's O-ring risk had been intuited but not quantified. Feynman's appendix F is the eternal rebuke to management-by-vibes.

3. **Margin and redundancy are the last line of defense.** Apollo 13 was saved by margin that had been built in years before anyone knew what it would be used for. Margin is the systems engineer's gift to the future self.

4. **Risk management is cultural.** JWST's success was the product of a multi-decade culture that took risk management seriously. Challenger's failure was the product of a culture that did not. Tools alone do not save missions; cultures do.

The next module (06 — Reliability and Availability) builds on the probabilistic foundations introduced here and walks into the territory of reliability modeling, availability allocation, and the hardware side of risk reduction. But the analytical machinery starts here, in the place where systems engineering first learned to take uncertainty seriously.

## References

- NASA/SP-2016-6105 Rev 2. *NASA Systems Engineering Handbook*. 2016.
- NASA/SP-2011-3421. *Probabilistic Risk Assessment Procedures Guide for NASA Managers and Practitioners, Second Edition*. December 2011.
- NASA/SP-2010-576. *NASA Risk-Informed Decision Making Handbook*. April 2010.
- NASA NPR 8000.4B. *Agency Risk Management Procedural Requirements*. 2017.
- INCOSE. *Systems Engineering Handbook, Fourth Edition*. John Wiley & Sons, 2015.
- Kaplan, S. and Garrick, B. J. "On the Quantitative Definition of Risk." *Risk Analysis* 1(1), 1981.
- IEC 61025. *Fault Tree Analysis (FTA)*. 2006.
- NUREG-0492. *Fault Tree Handbook*. US Nuclear Regulatory Commission, 1981.
- MIL-STD-1629A. *Procedures for Performing a Failure Mode, Effects and Criticality Analysis*. 1980 (cancelled 1998, still referenced).
- SAE J1739. *Potential Failure Mode and Effects Analysis in Design, Process*. 2021.
- WASH-1400 (NUREG-75/014). *Reactor Safety Study*. US NRC, 1975.
- Report of the Presidential Commission on the Space Shuttle Challenger Accident (Rogers Commission). 1986.
- Columbia Accident Investigation Board Report. Volume I. August 2003.
- Vaughan, D. *The Challenger Launch Decision: Risky Technology, Culture, and Deviance at NASA*. University of Chicago Press, 1996.
- Cox, L. A. "What's Wrong With Risk Matrices?" *Risk Analysis* 28(2), 2008.
- SEI. *Taxonomy-Based Risk Identification*. CMU/SEI-93-TR-6, 1993.
- Shuttle Probabilistic Risk Assessment (SSP-50808). NASA Johnson Space Center, 2005.

---

*Module 05 of the SYE (Systems Engineering) research series. Next: 06 — Reliability and Availability.*
