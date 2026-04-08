# Requirements Engineering

**Module:** SYE-01
**Discipline:** Systems Engineering — Requirements
**Primary standards:** INCOSE SE Handbook v5, NASA SE Handbook (NASA/SP-2016-6105 Rev 2), ISO/IEC/IEEE 29148:2018, IEEE 1362 (ConOps)
**Research date:** 2026-04-08

---

## 1. Why Requirements Engineering Is The Work

There is a folk belief among engineers that "requirements are the boring part before the real work starts." The record disagrees with the folk belief. The most expensive failures in aerospace, defense, medical devices, and large-scale software are not failures of invention or execution — they are failures of requirements. A system cannot be *wrong* except relative to what it was supposed to do. If nobody clearly wrote down what it was supposed to do, nobody can say it is wrong; they can only say it is disappointing. Disappointing systems still get built, still get launched, and still fall out of the sky.

Requirements engineering is the discipline of converting stakeholder needs, operational intent, physical constraints, and regulatory obligations into a structured, verifiable, traceable specification that a multidisciplinary team — often numbering in the thousands, spread across decades and across continents — can execute against with confidence. It is not writing a wish list. It is the construction of the contract that the rest of the lifecycle will be judged against.

The INCOSE Systems Engineering Handbook treats requirements as the **foundational artifact** of the V-model: every branch of the V below the requirements baseline is an elaboration of those requirements (design, implementation), and every branch above it is a verification against those requirements (integration, test, acceptance). Break the requirements and you break the V in both directions simultaneously. The NASA SE Handbook frames it the same way in its Project Life Cycle discussion: requirements are the hinge at the top of Phase A/B where "what we want" becomes "what we will build," and errors introduced here propagate, amplify, and become vastly more expensive to correct with each passing phase.

Barry Boehm quantified the amplification in his classic 1981 work *Software Engineering Economics* and re-verified it across multiple industries over the following decades. The **cost-of-defects curve** is roughly logarithmic: a defect caught in requirements costs 1x to fix. Caught in design, 5x. Caught in coding, 10x. Caught in integration testing, 20x. Caught in acceptance testing, 50x. Caught in operations — after launch, after deployment, after the satellite is on orbit — 100x to 200x. The exact multipliers depend on domain, but the shape of the curve is universal and the lesson is unambiguous: an hour spent clarifying a requirement is worth a month spent re-working hardware. Organizations that have internalized this fact spend remarkable amounts of time on requirements. Organizations that have not internalized it keep having the same expensive accident over and over.

---

## 2. Requirements Elicitation

Before you can write a requirement, you have to find out what the stakeholders actually want. This is harder than it sounds, for two reasons. First, stakeholders rarely know what they want in a form that maps cleanly onto engineering vocabulary. Second, stakeholders often *disagree*, sometimes without knowing it, because they have never before been asked to be specific simultaneously. Elicitation is the structured practice of getting the real needs out of the people who have them.

**Stakeholder interviews** are the default technique and the one that most engineers default to. One analyst, one stakeholder, an open-ended conversation with follow-up questions. Interviews are good for depth and for unguarded observations — a stakeholder under no peer pressure will tell you things they would never say in a group. Interviews are weak when the stakeholder is not the real decision-maker, when the stakeholder is reconstructing from memory rather than observing live, and when the interviewer projects their own technical frame onto the answers. A common failure mode: the interviewer writes down "the user wants fast response times" when the user actually said "the screen is confusing." The interviewer has quietly substituted their own diagnosis.

**Requirements workshops** bring multiple stakeholders together and structure a group negotiation. The JAD (Joint Application Design / Joint Application Development) methodology formalizes this, typically with a trained facilitator, a recorder, subject matter experts, end users, management sponsors, and engineers in one room for a multi-day session. The output is a shared document that reflects compromises negotiated in real time, in front of witnesses, so there is no later "I never agreed to that." JAD was developed by IBM in the late 1970s and remains a standard technique in government and enterprise contexts where getting stakeholders in a room together is the rate-limiting step.

**Prototyping** treats the prototype as a requirements-elicitation instrument. Show the stakeholder a rough version of what you think they want. They will immediately tell you three things you would not otherwise have learned: (1) what they meant that they did not articulate, (2) what they thought they wanted but in fact do not, and (3) what they never imagined until they saw it in front of them. The prototype is not meant to be delivered. It is meant to provoke. NASA used prototyping heavily for crew-interface design on Space Shuttle, Space Station, and Orion: flying dummy cockpits in front of astronauts who would then say things like "I cannot see that switch with my helmet on."

**Ethnography** — borrowed from anthropology — puts an analyst physically in the workplace of the users, watching them operate. It is the most time-expensive technique but it catches requirements that no other method catches, because the things that matter most to users are the things they do unconsciously. A nurse interviewed about a hospital information system will talk about the search function. A nurse observed for a week will reveal that they enter data one-handed because they are holding a patient with the other, that they cannot read the screen under fluorescent lights at certain angles, and that they routinely bypass the login screen by leaving a workstation logged in behind a privacy curtain. None of this comes out in an interview. All of it is mission-critical.

**Document analysis** extracts requirements from existing artifacts: operator manuals from legacy systems, regulatory standards, incident reports, prior-generation specifications. This is essential for safety-critical domains where the regulatory environment is the dominant requirement source. For a new commercial aircraft, thousands of requirements come directly from 14 CFR Part 25, before the airline has said a word.

**Surveys** are cheap, scalable, and usually bad. Surveys work for quantifying preferences among known options. They fail catastrophically at surfacing unknown options. Use them as a supplement, never as the primary elicitation technique.

The analyst's job during elicitation is not to write requirements. It is to *capture the raw material* from which requirements will later be written, to identify the stakeholders whose agreement matters, and to notice the places where stakeholders disagree. A good elicitation phase ends with a pile of notes, a stakeholder register, and a list of known conflicts. It does not end with a specification. That comes next.

---

## 3. Requirements Analysis

Raw stakeholder needs are not requirements. They are inputs to requirements. The analysis phase converts them into a coherent, consistent, feasible, prioritized set that can be formally specified. Four activities dominate this phase: conflict resolution, feasibility assessment, negotiation, and prioritization.

**Conflict resolution** catches the contradictions. Operations wants rapid turnaround. Safety wants thorough pre-flight checks. Both are legitimate. Neither can fully win. The analyst surfaces the conflict, invites both stakeholders to the table, and documents the resolution — usually some form of structured compromise ("turnaround in under 4 hours given a specific checklist of deferred items"). Un-surfaced conflicts are the most dangerous kind: they survive all the way into design, produce incompatible design choices in different subsystems, and detonate at integration.

**Feasibility** asks whether what the stakeholders want is physically, technically, economically, and schedule-wise achievable. The analyst is not the authority on feasibility — subject matter experts are — but the analyst is the one responsible for *asking*. A requirement that says "the spacecraft shall achieve an orbital velocity of 12 km/s using chemical propulsion only" will fail feasibility review on contact with a propulsion engineer. Catching this at the requirements stage is cheap. Catching it at Critical Design Review is a cancelled program.

**Negotiation** is the social technology of resolving the remaining disagreements that conflict resolution and feasibility review did not eliminate. The analyst's role is facilitator, not advocate. A good requirements negotiation ends with a document every stakeholder has signed off on, even if each stakeholder silently feels they gave up something.

**Prioritization** is unavoidable. No real project has the budget or schedule to deliver every requirement stakeholders would like. The choice is whether prioritization happens explicitly, during requirements analysis, with all stakeholders at the table, or implicitly, during the last weeks of development, by the engineering lead deciding what gets cut. The first produces traceable, auditable, fair outcomes. The second produces angry stakeholders and post-mortems.

**MoSCoW** is the simplest prioritization scheme: **M**ust have, **S**hould have, **C**ould have, **W**on't have (this release). The wording matters. "Must" means the system has no value if this is absent. "Should" means important but not essential. "Could" means desirable if resources permit. "Won't" means explicitly deferred, not forgotten — a deferred requirement is still tracked. MoSCoW works because it forces stakeholders to identify a small "Must" set. When a stakeholder tries to put everything in "Must," the facilitator says "if everything is Must, then cutting any of this cancels the project — are you sure?" This usually shakes loose a more honest prioritization.

**Kano analysis** is a richer model, developed by Noriaki Kano in the 1980s for Japanese manufacturing. It classifies requirements into five categories based on how satisfaction varies with fulfillment. **Must-be** (threshold) requirements: their absence causes dissatisfaction, but their presence produces no positive reaction — a car has brakes. **One-dimensional** (performance) requirements: satisfaction rises linearly with fulfillment — better fuel economy is always better. **Attractive** (excitement) requirements: absence causes no dissatisfaction (customers did not know to ask for them), but presence produces delight — the first heated seat. **Indifferent** requirements: stakeholders do not care one way or the other, so do not spend effort on them. **Reverse** requirements: some stakeholders want the feature, others actively don't — approach cautiously. Kano is valuable because it surfaces the asymmetry between "features that cause complaints if missing" and "features that cause delight if present," which are different categories of investment. Note that categories *migrate over time*: today's attractive feature is tomorrow's must-be. Anti-lock brakes were attractive in 1985 and are must-be in 2026.

Analysis output is a consolidated, de-conflicted, feasibility-reviewed, prioritized needs list. Now — and not before — it is ready to be specified.

---

## 4. Requirements Specification

Specification is the act of writing down requirements in a form rigorous enough that multiple independent readers will extract the same meaning. This is harder than most engineers realize, because natural language is ambiguous and engineers are trained to assume that other readers will share their context. They won't. Formal specification exists to remove that assumption.

### 4.1 The Document Family

Different classes of requirements belong in different documents:

**Concept of Operations (ConOps)**, governed by **IEEE 1362-1998** (reaffirmed), describes the system from the user's and operator's point of view. It is narrative, scenario-driven, and deliberately not detailed. A ConOps answers: Who uses this system? In what environment? To accomplish what? What are the operational scenarios, nominal and off-nominal? What does a day in the life of the system look like? The ConOps is the first requirements artifact produced and the one that every subsequent document traces back to for operational justification. NASA treats the ConOps as a formal gate deliverable at Mission Concept Review (MCR) and System Requirements Review (SRR).

**System Requirements Specification (SyRS)**, governed by **ISO/IEC/IEEE 29148:2018** (which superseded and merged the older IEEE 830 for software and IEEE 1233 for systems), specifies *what the system shall do at the system level*. It is scoped to the whole system, not to any subsystem, and it contains requirements that will be decomposed and allocated later. The SyRS is the top of the requirements tree.

**Software Requirements Specification (SRS)**, also under 29148 (and historically IEEE 830-1998), specifies the software portion. In NASA and defense, the SRS is a child document of the SyRS — software requirements are derived from and traced to system requirements.

**Hardware Requirements Specification**, **Interface Requirements Specification**, and various **subsystem-level specifications** fan out below these. Each level has the same rules but different scope.

The overarching INCOSE guidance is the **Guide to Writing Requirements (GtWR)**, currently in its fourth edition. INCOSE GtWR is the single most cited document in the discipline and is the source of nearly every "how to write a good requirement" rule engineers know.

### 4.2 The Nine Characteristics of a Good Requirement

INCOSE GtWR and ISO/IEC/IEEE 29148 converge on nine characteristics that every individual requirement must possess. These are not style preferences. They are conditions for a requirement to be usable at all.

1. **Necessary.** The requirement states something the system must do or possess. Remove it and a stakeholder need goes unmet. Requirements that fail "necessary" are decoration.

2. **Appropriate.** The requirement is at the right level of detail for the document it lives in. A system-level SyRS should not contain "the left mouse button shall return HTTP 200." That belongs several decomposition steps later.

3. **Unambiguous.** The requirement has exactly one interpretation. The enemies of unambiguity are vague quantifiers ("fast," "user-friendly," "robust"), undefined pronouns, and passive voice that conceals the agent.

4. **Complete.** The requirement states everything needed to satisfy it without requiring the reader to infer missing pieces. A requirement that says "the system shall display error messages" is incomplete: in what language? to whom? under what conditions? with what content?

5. **Singular.** One requirement per requirement. The word **and** is the tell. "The system shall authenticate the user and log the authentication attempt" is two requirements disguised as one. Split them. The practical reason is traceability and verification: if one half passes and one half fails, you cannot record the result.

6. **Feasible.** Achievable given the state of the art, the budget, and the schedule. Feasibility review during analysis should catch the unfeasible ones, but they sneak in.

7. **Verifiable.** There must exist some method — inspection, analysis, demonstration, or test — that can determine whether the requirement is met. "The system shall be user-friendly" is not verifiable. "The system shall allow a trained operator to complete Task X within Y seconds, measured over 20 trials, with no more than Z errors" is verifiable.

8. **Correct.** The requirement accurately reflects a real stakeholder need. This is the characteristic most often violated by engineers who extrapolate from their own assumptions.

9. **Conforming.** The requirement is written in the format, style, and vocabulary prescribed by the project's requirements standard. Conformance is not cosmetic — it allows tools to parse, filter, and trace requirements automatically.

GtWR supplements these with rules at the *set level*: the collection of requirements as a whole must be **complete** (covers all stakeholder needs), **consistent** (no contradictions), **feasible** (the set as a whole is achievable), **comprehensible** (a qualified reader can understand it), and **able to be validated**.

### 4.3 Good vs Bad Requirements: Worked Examples

Consider a requirement for a spacecraft telemetry system.

**Bad:** *The telemetry system shall be fast and reliable.*

This fails unambiguous (what is fast? what is reliable?), verifiable (no measurable criterion), singular (two properties in one statement), and complete (no scope, no condition, no quantity).

**Better:** *The telemetry system shall transmit housekeeping telemetry to the ground station at a rate of at least 2 kbps, with a bit error rate no greater than 1e-6, when the spacecraft is within line-of-sight of a Deep Space Network antenna and the spacecraft attitude is within 5 degrees of the nominal communication pointing.*

This specifies a quantity (2 kbps), a quality (BER 1e-6), and the conditions under which the requirement applies (LOS to DSN, attitude within tolerance). It is verifiable by test. It is singular — but only just; a strict reading might split it into a rate requirement and a BER requirement, which is typically what real spec review does.

**Bad:** *Users should be able to log in quickly.*

Fails on every count: vague subject (which users?), unverifiable quantifier (quickly), missing condition, and "should" instead of "shall," which in requirements English is imperative.

**Better:** *The system shall authenticate a registered user within 2 seconds of the user submitting valid credentials, under nominal network conditions (defined in Section 3.4), at the 95th percentile measured across 1,000 consecutive login attempts.*

The "95th percentile over 1,000 attempts" is the verification methodology embedded in the requirement, which is unusually explicit but exemplary practice.

---

## 5. EARS — Easy Approach to Requirements Syntax

EARS was developed by Alistair Mavin and colleagues at Rolls-Royce in 2009 to solve a specific problem: natural-language requirements are ambiguous, and formal-language requirements are unreadable. EARS is a controlled subset of natural language — simple enough to read, structured enough to be unambiguous. It has become one of the most adopted requirements-writing techniques in aerospace, automotive, and safety-critical software over the past 15 years, and it is explicitly recommended in the INCOSE GtWR as a preferred pattern.

EARS defines five requirement patterns.

### 5.1 Ubiquitous Requirements

Always active. No trigger.

**Pattern:** *The \<system name\> shall \<system response\>.*

**Example:** *The flight control system shall maintain aircraft attitude within 0.5 degrees of the commanded attitude.*

### 5.2 Event-Driven Requirements

Activated by a specific event.

**Pattern:** *WHEN \<trigger\> the \<system name\> shall \<system response\>.*

**Example:** *WHEN the landing gear lever is moved to the DOWN position, the landing gear system shall extend the landing gear within 10 seconds.*

The **WHEN** keyword is capitalized in formal EARS to make triggers visually scannable.

### 5.3 State-Driven Requirements

Active continuously while the system is in a particular state.

**Pattern:** *WHILE \<state\> the \<system name\> shall \<system response\>.*

**Example:** *WHILE the aircraft is in the LANDING flight phase, the autobrake system shall command maximum braking force upon main gear weight-on-wheels.*

### 5.4 Optional Feature Requirements

Apply only when a specific feature is present.

**Pattern:** *WHERE \<feature is included\> the \<system name\> shall \<system response\>.*

**Example:** *WHERE the autoland feature is installed, the flight management system shall provide Category IIIb minima autoland capability.*

### 5.5 Unwanted Behavior Requirements

Responses to off-nominal or fault conditions. EARS calls this the most important pattern because the majority of safety-critical failures are responses to unwanted behaviors that were specified ambiguously.

**Pattern:** *IF \<unwanted condition\> THEN the \<system name\> shall \<system response\>.*

**Example:** *IF the primary flight computer fails its health check, THEN the flight control system shall transfer control to the secondary flight computer within 50 milliseconds.*

### 5.6 Complex Conditions

EARS patterns combine. For example, event-driven within a state:

*WHILE the aircraft is in the CRUISE flight phase, WHEN a cabin altitude of 10,000 feet is detected, the emergency oxygen system shall deploy passenger oxygen masks within 3 seconds.*

The combination is controlled — the language does not allow arbitrary nesting — but it covers the overwhelming majority of real requirements. Rolls-Royce reported at the 2009 INCOSE International Symposium that retrofitting EARS onto a legacy requirements document caught ambiguities in roughly 50% of the original requirements. Subsequent adoptions have reported similar rates.

EARS does not solve every problem. It does not make requirements *correct*. It does not guarantee *completeness*. But it dramatically reduces ambiguity at essentially zero training cost — engineers can learn the five patterns in half an hour — which is the highest return on investment of any requirements-writing technique in modern practice.

---

## 6. Verification and Validation at the Requirements Level

The two words sound similar and are routinely confused. They are different activities that happen at different times and answer different questions.

**Verification** asks: *Did we build the system right?* Does it satisfy its specified requirements? Verification is against the specification. It happens throughout the lifecycle: you verify design against requirements, code against design, integration against interface specs, and system test against system requirements.

**Validation** asks: *Did we build the right system?* Does it satisfy the stakeholder's real need, regardless of what the specification said? Validation is against the operational purpose. It happens primarily during operational test and acceptance, though validation *of the requirements themselves* happens earlier.

At the requirements level, **verification of requirements** means checking that the requirements document meets its own standards: INCOSE's nine characteristics, the set-level properties, the organization's format rules. Is each requirement singular, unambiguous, verifiable? Is the set consistent? This is typically done by formal peer review: a panel reads the document, marks up defects, and the author revises.

**Validation of requirements** means checking that the requirements, if fully satisfied, would actually meet stakeholder needs. This is done by walking scenarios from the ConOps through the requirements and asking "does the system, as specified, actually do what the stakeholder wanted in this scenario?" If a scenario exists that the requirements do not cover, the requirements are incomplete. If the requirements cover the scenario but the outcome is not what the stakeholder wanted, the requirements are incorrect.

Both activities must be done before the requirements are baselined. Baselining requirements that have not been verified and validated is the single most common root cause of late-program thrash.

---

## 7. Traceability

Traceability is the discipline of being able to answer, for any requirement, the following questions:

- **Upward (to source):** Why does this requirement exist? Which stakeholder need, which higher-level requirement, which regulation does it satisfy?
- **Downward (to implementation):** Which design elements, code modules, hardware components implement this requirement?
- **Lateral (to verification):** Which test case, analysis, inspection, or demonstration proves this requirement is satisfied?
- **Peer (to related requirements):** Which other requirements does this one depend on, constrain, or interact with?

A **requirements traceability matrix (RTM)** records all of these links. In its minimal form, an RTM is a spreadsheet with columns for the requirement ID, the parent requirement or stakeholder need, the design element, the verification method, and the verification result. In mature organizations it is a database with thousands to millions of relationships.

**Bidirectional traceability** is the strict requirement: every downward link must also exist as an upward link. If Design Element D implements Requirement R, then R must list D as one of its implementing elements, and D must list R as one of its source requirements. This symmetry is what allows the two classic traceability queries: "if I change this requirement, what downstream artifacts are affected?" and "if I remove this code, which requirement loses its implementation?"

The RTM is the backbone of impact analysis, change control, and audit. In safety-critical domains — aerospace DO-178C, automotive ISO 26262, medical IEC 62304 — full bidirectional traceability is a certification requirement, not an option. A product without a trace matrix cannot be certified.

The practical challenge is keeping the RTM accurate as the project evolves. A stale RTM is worse than no RTM because it creates false confidence. This is why requirements management tooling exists.

---

## 8. Requirements Management Tools

The standard tools in large-scale requirements management are a small, stable set, each with its own ecosystem and community.

**IBM DOORS (Dynamic Object-Oriented Requirements System)**, originally from Telelogic and acquired by IBM, has been the dominant tool in aerospace and defense for over two decades. DOORS stores each requirement as an object with attributes, supports explicit link objects between requirements, and handles the massive RTMs common to programs like Joint Strike Fighter, 787, and SLS. DOORS is famously powerful, famously difficult to learn, and famously expensive. Its scripting language (DXL) allows automation of almost anything but rewards patience. **IBM Engineering Requirements Management DOORS Next** (originally DOORS NG, now part of **IBM Engineering Lifecycle Management / ELM**, formerly CLM) is the web-based successor and is the current recommendation for new programs, though legacy DOORS Classic installations still dominate the installed base.

**Jama Connect** (from Jama Software) is the modern cloud-first alternative that has taken significant market share from DOORS over the past decade, particularly in medical devices, automotive, and aerospace commercial. Jama emphasizes collaborative review, live trace matrices, and modern web UX. It is easier to learn than DOORS and typically cheaper per seat, though it scales to slightly smaller programs comfortably.

**Polarion** (now Siemens Polarion, originally from Polarion Software) integrates requirements management with test management and change management in a single tool, with strong support for automotive ASPICE and ISO 26262 workflows. Polarion has deep integration with Siemens' other PLM tools and is a natural choice for organizations already in the Siemens ecosystem.

**Siemens Teamcenter**, **PTC Integrity** (now Windchill RV&S), and **Visure Requirements** round out the enterprise tier.

On the lighter end: **Helix RM** (formerly Perforce ALM), **ReqSuite**, **Modern Requirements4DevOps** (an Azure DevOps extension), and open-source options like **Doorstop** (which stores requirements as version-controlled YAML files) serve smaller programs.

The tool matters less than the **discipline around the tool**. A well-run DOORS installation and a well-run Doorstop repository both produce traceable, auditable requirements. A badly run installation of any tool produces a mess. The failure mode is always the same: the tool is adopted, the initial load is meticulous, and then the team stops maintaining the links during the chaos of development. The trace matrix rots. When someone finally tries to use it for impact analysis, it has lost contact with reality.

---

## 9. Requirements Volatility and Change Control

Requirements change. Stakeholders learn things during development that they did not know at the start. Regulations change. Threat environments change. Technology changes. The question is not whether requirements will change — they will — but whether the change is controlled.

**Requirements volatility** is measured as the number of requirement changes per unit time, normalized to the total requirement count. Historical data from defense programs suggests healthy volatility in the 1-3% per month range during active development, dropping below 1% after Critical Design Review. Sustained volatility above 5% per month is a strong predictor of schedule slip and cost overrun: either requirements were not well understood initially, or the environment is changing faster than the program can absorb.

**Change control boards (CCBs)** are the governance mechanism. A proposed requirement change is written up, its impact analyzed (cost, schedule, design, interface, verification), and reviewed by a board composed of engineering, program management, safety, and customer representatives. The board approves, rejects, or defers. Approved changes update the baseline; rejected changes are logged and traced so they do not re-surface later without new justification.

The single most important property of a change control process is that *the requirements baseline is immutable* except through the CCB. Uncontrolled changes — a single engineer quietly updating a requirement in DOORS because they "know what was meant" — are the definition of a broken process. When this happens, the RTM loses meaning, verification results become untrustworthy, and the program has no ground truth.

---

## 10. Case Studies

### 10.1 Ariane 5 Flight 501 — Requirements Reuse Failure (1996)

On 4 June 1996, the Ariane 5 launcher exploded 37 seconds after liftoff on its maiden flight. The official inquiry, led by Jacques-Louis Lions, identified the root cause as a software exception in the inertial reference system (SRI — Système de Référence Inertielle). The exception was a 64-bit floating point to 16-bit signed integer conversion that overflowed when the horizontal velocity exceeded a value that Ariane 4 had never seen but Ariane 5 — with its different trajectory — reached quickly. The software backup unit failed for the same reason, then the primary failed, and the vehicle lost attitude control.

The deeper root cause was **requirements reuse without re-validation**. The SRI software had been inherited from Ariane 4 and had performed flawlessly on 100+ Ariane 4 flights. The operational envelope of Ariane 5 was different: higher acceleration, a different trajectory shape, a different horizontal velocity profile. The requirements for the SRI software did not specify the operational envelope in a form that would have flagged the change. The reused code was certified against Ariane 4 operational assumptions that were *implicit* in the code, never elevated to explicit requirements. When Ariane 5 violated those implicit assumptions, nothing in the requirements document was there to catch it.

The lessons, enumerated in Lions' report and repeated in every requirements-engineering course since:

1. **Implicit assumptions are un-verified requirements.** Everything the code depends on must be elevated to an explicit, testable requirement.
2. **Reuse is not free.** Re-using a component in a new context re-incurs the full requirements verification cost against the new context's operational envelope.
3. **Defensive exception handling is not a substitute for requirements.** The SRI had exception handling; when triggered, it shut down the unit, which is the wrong response for a flight-critical component. The correct response would have been to continue with degraded accuracy. No requirement specified which was correct.

Cost of the failure: approximately US$370 million in launcher and payload losses, plus a multi-year program delay. Cost of having done the requirements review properly: a few engineer-weeks.

### 10.2 Mars Climate Orbiter — Unit Mismatch (1999)

Mars Climate Orbiter was lost on 23 September 1999 during Mars orbit insertion. The spacecraft descended too low into the Martian atmosphere and was either destroyed or left Mars in a heliocentric orbit. The root cause is famous: the ground software that computed trajectory correction maneuver impulse values produced output in **pound-force seconds**; the spacecraft flight software expected input in **newton-seconds**. The factor of 4.45 accumulated over multiple maneuvers until the trajectory was wrong by about 170 km at Mars encounter.

The subtlety that matters for this module: **the requirements were, in a sense, correct**. Both ground and flight software implemented what their respective requirements documents said. The failure was in the **interface requirements** — specifically, the ICD (Interface Control Document) between the ground software and the flight software. The ICD did not explicitly specify the units of the impulse quantity being exchanged, and the two development teams — Lockheed Martin for ground, JPL for flight — made opposite assumptions based on their house conventions.

The lessons:

1. **Interface requirements are requirements.** They deserve the same rigor, review, and traceability as functional requirements. An ICD that does not specify units, ranges, resolution, and update rates for every field is not a specification; it is a vague agreement.
2. **Units must be part of the requirement, always.** The INCOSE rule is now that numeric requirements must state units explicitly in every occurrence, and interface specifications must include unit fields as first-class attributes.
3. **Correctness against a flawed specification is still failure.** The ground software passed its acceptance tests. The flight software passed its acceptance tests. The integrated system failed because the specification at the interface was incomplete. Unit-level verification does not substitute for interface verification.

The failure investigation (Stephenson Board, November 1999) also identified contributing factors: inadequate end-to-end testing of the navigation software chain, insufficient communication between teams during operations, and the loss of key personnel to other programs mid-operation. But the headline root cause — units — is the one that reshaped NASA's interface requirements practice. Every JPL ICD produced after 2000 contains an explicit units column.

Cost: US$327 million, plus the scientific loss of a Mars mission.

### 10.3 NASA SLS — Requirements Management at Scale

The Space Launch System is, as of 2026, the most requirements-heavy active NASA program, with an estimated 40,000+ technical requirements across the vehicle, ground systems, and mission architecture. SLS uses DOORS for primary requirements management with a multi-level hierarchy: Program-level requirements, vehicle-element requirements (core stage, boosters, upper stage, adapter), subsystem requirements, and component requirements, all bidirectionally traced.

Public NASA documentation on the SLS requirements approach highlights several practices worth studying:

1. **Requirements ownership is explicit.** Every requirement has a named owner (an individual, not a team) who is responsible for its correctness, its traceability, and its disposition if a change is proposed. This prevents the diffusion-of-responsibility failure mode where no one notices a requirement has gone stale.

2. **Verification planning is done concurrently with requirements writing, not after.** Each requirement, when written, must have a verification method assigned (inspection, analysis, demonstration, test) and a draft verification procedure identified. This forces the author to answer "how will we prove this?" while writing, which catches unverifiable requirements at authoring time instead of at verification time.

3. **Traceability is tool-enforced.** DOORS configurations reject requirement additions that are not linked to a parent and to a verification artifact. This is an example of **process hardening** — using tool configuration to make the correct behavior easier than the incorrect behavior.

4. **Change control is staged.** Low-impact changes (clarifications, typo fixes) go through a lightweight CCB. Medium-impact changes (functional modifications within an element) go through the element CCB. High-impact changes (cross-element, schedule, or cost-affecting) escalate to the program CCB with formal impact analysis. This tiered structure keeps the program CCB focused on the changes that actually need program-level visibility.

SLS has had its share of program challenges — cost growth, schedule slip, and political pressure — but its requirements-management discipline is widely regarded within NASA as best-in-class and is the template being recommended for Artemis and future exploration programs.

---

## 11. Takeaways For Practice

A pragmatic condensation for the working systems engineer:

- **Spend more time on requirements than feels comfortable.** If your program has not spent 15-20% of total effort on requirements by the end of Phase B, you are under-investing, and the bill will arrive during integration.

- **Use EARS.** The five patterns are free to learn and eliminate most ambiguity.

- **Write verification method into the requirement at authoring time.** Every numeric threshold should be accompanied by the measurement method that will verify it.

- **State units. Every time. No exceptions.** Mars Climate Orbiter is the reason.

- **Elevate implicit assumptions.** Anything the system relies on that is not written down is a future Ariane 5.

- **Trace bidirectionally from day one.** Retrofitting traceability onto a mature program is prohibitively expensive; building it in from the start is nearly free.

- **Run a real CCB.** Uncontrolled requirement changes are the fast path to a broken baseline.

- **Remember the cost curve.** One hour of requirements work is worth a month of integration work. Budget accordingly.

The discipline is old, the lessons are settled, and the standards are mature. The only remaining question is whether the program in front of you will learn them cheaply, from this document, or expensively, from its own accident report.

---

## Sources and Further Reading

**Standards:**
- ISO/IEC/IEEE 29148:2018 — *Systems and software engineering — Life cycle processes — Requirements engineering*
- IEEE 1362-1998 (R2007) — *IEEE Guide for Information Technology — System Definition — Concept of Operations (ConOps) Document*
- IEEE 830-1998 — *Recommended Practice for Software Requirements Specifications* (superseded by 29148, still widely cited)

**Handbooks and Guides:**
- INCOSE Systems Engineering Handbook, 5th Edition (2023)
- INCOSE *Guide to Writing Requirements* (GtWR), 4th Edition
- NASA Systems Engineering Handbook, NASA/SP-2016-6105 Rev 2
- NASA Expanded Guidance for Systems Engineering (NASA/SP-2016-6105 supplements)

**Foundational Papers:**
- Boehm, B. (1981). *Software Engineering Economics*. Prentice-Hall.
- Mavin, A., Wilkinson, P., Harwood, A., Novak, M. (2009). "Easy Approach to Requirements Syntax (EARS)." Proceedings of the 17th IEEE International Requirements Engineering Conference.
- Kano, N. et al. (1984). "Attractive Quality and Must-Be Quality." *Journal of the Japanese Society for Quality Control*.

**Failure Investigation Reports:**
- Lions, J-L., et al. (1996). *ARIANE 5 Flight 501 Failure: Report by the Inquiry Board*. European Space Agency.
- Stephenson, A.G., et al. (1999). *Mars Climate Orbiter Mishap Investigation Board Phase I Report*. NASA.

**Tools:**
- IBM Engineering Lifecycle Management (ELM) / DOORS Next documentation
- Jama Software documentation
- Siemens Polarion documentation
- Doorstop (open source, github.com/doorstop-dev/doorstop)
