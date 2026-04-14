# Systems-Theoretic Approaches to RCA — Deep Paper Enrichment

Research compiled 2026-04-08. Sources: academic papers, MIT monographs, FAA technical reports, systematic reviews.

---

## Paper 1: Engineering a Safer World — STAMP Framework

**Authors:** Nancy G. Leveson
**Year/Venue:** 2011, MIT Press (monograph, open access). Also: "A New Accident Model for Engineering Safer Systems" (2004, *Safety Science* 42(4), pp. 237–270)

### Methodology

STAMP (Systems-Theoretic Accident Model and Processes) reframes safety as a **control problem** rather than a **failure problem**. Instead of modeling accidents as chains of failure events (as in fault trees or event trees), STAMP models systems as hierarchical control structures where accidents result from inadequate enforcement of safety constraints. Three foundational concepts:

1. **Safety constraints** — Requirements on system behavior that prevent hazardous states
2. **Hierarchical control structure** — Layers of control from organizational policy down to physical processes
3. **Process models** — Mental/software models that controllers use to make decisions; accidents occur when these models become inconsistent with the actual process state

STAMP generates two practical techniques:
- **STPA** (Systems-Theoretic Process Analysis) — Prospective hazard analysis
- **CAST** (Causal Analysis using System Theory) — Retrospective accident/incident analysis

### Key Results

**Case Studies in the Book:**

| Case Study | Domain | Key STAMP Finding Traditional Methods Missed |
|---|---|---|
| U.S. Blackhawk friendly fire (1994 Iraq) | Military aviation | System-level control flaws in IFF (Identification Friend or Foe) procedures; individual blame on F-15 pilots masked systemic communication and coordination breakdowns across the entire control structure (AWACS, ground control, Army aviation) |
| Walkerton, Ontario water contamination (2000) | Public health infrastructure | 7 deaths, 2,300+ ill. STAMP revealed failures at every level of the control structure: provincial government defunding, inadequate municipal oversight, operator training gaps, monitoring system removal — not just operator error |
| USS Thresher loss / SUBSAFE program (1963–present) | Naval submarine safety | SUBSAFE as exemplary systems-theoretic safety program. **Zero submarine losses in 50+ years** (since SUBSAFE fully implemented). USS Scorpion (1968) was the one exception — SUBSAFE requirements had been **waived** for that vessel |
| Vioxx pharmaceutical recall (2004) | Pharmaceutical safety | Regulatory control structure failures at FDA; organizational pressures overriding safety signals; inadequate post-market surveillance as a control feedback mechanism |

**Core Argument with Implications:**
- Traditional methods (FTA, FMEA, event trees) are based on **reliability theory** — they model component failures and their propagation
- Modern accidents increasingly involve **component interaction accidents** where no single component has failed, but the system enters hazardous states through unexpected interactions
- Software does not "fail" in the reliability sense — it does exactly what it was programmed to do; the hazard is in the **requirements and design**, not component reliability
- Organizational and management factors cannot be modeled as "failures" in a chain — they are **control deficiencies**

### Tables/Data

**STAMP vs. Traditional Models — Conceptual Comparison:**

| Dimension | Traditional (Chain-of-Events) | STAMP (Systems-Theoretic) |
|---|---|---|
| Accident model | Linear chain of failures | Emergent property of control structure |
| Root cause | Component failure or human error | Inadequate control of safety constraints |
| Software | Treated as reliable (binary) | Requirements/design flaws analyzed |
| Human factors | "Human error" as cause | Controller decisions analyzed in context |
| Organizations | Separate management layer | Integral part of control hierarchy |
| Prevention | Add barriers/defenses | Redesign control structure |

### Implications

STAMP shifts the question from "what failed?" to "why did the control structure allow the hazardous state to occur?" This is foundational for any RCA methodology that must handle software-intensive, sociotechnical systems. The Walkerton case demonstrates that STAMP identifies systemic vulnerabilities across 4+ organizational levels that event-chain methods would attribute to proximate "operator error."

---

## Paper 2: STPA Quantitative Comparisons — Controlled Experiments and Case Studies

**Primary Sources:**
- **Abdulkhaleq, A. & Wagner, S.** (2015). "A Controlled Experiment for the Empirical Evaluation of Safety Analysis Techniques for Safety-Critical Software." *EASE 2015*, Nanjing, China. [arXiv:1612.00330]
- **Sulaman, S.M., Beer, A., Felderer, M., & Höst, M.** (2019). "Comparison of the FMEA and STPA safety analysis methods — a case study." *Software Quality Journal* 27, pp. 349–387.
- **STPA Handbook** — Leveson, N.G. & Thomas, J.P. (March 2018). MIT Partnership for Systems Approaches to Safety and Security (PSASS).
- **Patriarca, R., Chatzimichailidou, M.M., Karanikas, N., & Di Gravio, G.** (2022). "The past and present of STAMP and its associated techniques: A scoping review." *Safety Science* 146, 105566.

### Methodology

**Abdulkhaleq & Wagner (2015) Controlled Experiment:**
- 21 participants (16 MSc students, 5 BSc students)
- Applied FTA, FMEA, and STPA to 3 safety-critical systems: train door control, anti-lock braking (ABS), traffic collision avoidance (TCAS)
- Measured: effectiveness (recall, coverage), efficiency (time), applicability, understandability, ease of use
- Between-subjects design with Latin-square assignment

**Sulaman et al. (2019) Case Study:**
- Qualitative comparison of FMEA and STPA on a forward collision avoidance system
- Both methods applied to the same system by the same analysts

### Key Results

**Abdulkhaleq & Wagner (2015) — Quantitative Results:**

| Metric | STPA | FMEA | FTA |
|---|---|---|---|
| **Recall (mean)** | 0.443 | 0.326 | 0.231 |
| **Coverage (mean)** | 0.70 | 0.60 | 0.30 |
| Applicability | No significant difference | No significant difference | No significant difference |
| Understandability | No significant difference | No significant difference | No significant difference |
| Ease of use | No significant difference | No significant difference | No significant difference |
| **Effectiveness** | **Significant difference** (p < 0.05) | — | — |
| **Efficiency** | Requires more time | — | — |

Key finding: STPA recall was **92% higher than FTA** and **36% higher than FMEA**. STPA coverage was **133% higher than FTA** and **17% higher than FMEA**. However, STPA took longer to apply, particularly for novice analysts.

**Cross-Study Synthesis (from STPA Handbook and literature):**

| Study | Finding |
|---|---|
| Sulaman et al. (2019) | STPA found 27% of hazards missed by FMEA; FMEA found 30% of hazards missed by STPA — **methods are complementary** |
| Second unnamed study (cited in STPA Handbook) | STPA found **nearly double** the hazards found by FMEA |
| Abdulkhaleq & Wagner (2015) | STPA better coverage but less efficient for novice analysts |
| ARP 4761 comparison (MIT report) | STPA identified hazards in software/human interaction that ARP 4761 process missed entirely |

**Patriarca et al. (2022) Scoping Review — STAMP Literature Landscape:**

| Metric | Value |
|---|---|
| Total papers reviewed | 321 |
| Primary research | 85% |
| STPA-focused | 78% |
| CAST-focused | 11% |
| STAMP-focused | 11% |
| Conference proceedings | 58% |
| Application papers | ~64% |
| Extension/modification papers | ~22% |
| Comparison papers | ~7% |

### Tables/Data

**STPA vs. Traditional Methods — Capability Matrix:**

| Capability | STPA | FMEA | FTA | HAZOP |
|---|---|---|---|---|
| Component hardware failures | Partial | **Strong** | **Strong** | Strong |
| Software requirements flaws | **Strong** | Weak | Weak | Weak |
| Human-system interaction | **Strong** | Weak | None | Partial |
| Component interaction hazards | **Strong** | None | None | Partial |
| Organizational/management factors | **Strong** | None | None | None |
| Scalability to complex systems | **Strong** | Degrades | Degrades | Moderate |
| Efficiency (analyst time) | Higher | **Lower** | **Lower** | Moderate |
| ISO 26262 / SOTIF alignment | Complementary to HARA | Standard practice | Standard practice | Standard practice |

**Automotive (ISO 26262 / SOTIF) Application:**
STPA has been integrated with ISO 26262 HARA process for autonomous vehicle safety, where traditional FTA/FMEA cannot adequately address hazards from functional insufficiencies (SOTIF scope). STPA enables system-level performance-related hazards to be systematically classified and assigned ASIL levels via HARA mapping.

### Implications

STPA is demonstrably more effective at finding system-level hazards (especially software, human interaction, and emergent behavior), but at the cost of higher analyst effort. The optimal approach for complex systems is **STPA + FMEA combined**, as each catches hazards the other misses (27-30% unique findings each). For ISO 26262 automotive work, STPA fills the gap that traditional HARA leaves for SOTIF-class hazards.

---

## Paper 3: Safety-II, FRAM, and Resilience Engineering — Hollnagel

**Primary Sources:**
- **Hollnagel, E.** (2014). *Safety-I and Safety-II: The Past and Future of Safety Management*. Ashgate/CRC Press.
- **Hollnagel, E.** (2012). *FRAM: The Functional Resonance Analysis Method — Modelling Complex Socio-Technical Systems*. Ashgate.
- **Hollnagel, E., Woods, D.D., & Leveson, N.** (2006). *Resilience Engineering: Concepts and Precepts*. Ashgate.
- **Hollnagel, E.** (2011). "The Four Cornerstones of Resilience Engineering." In *Resilience Engineering Perspectives, Vol. 2*, pp. 117–134.
- **Leveson, N.** (2020). "Safety III: A Systems Approach to Safety and Resilience." MIT Engineering Systems Lab technical paper. [sunnyday.mit.edu/safety-3.pdf]
- **Tian, J. et al.** (2020). "Using the Functional Resonance Analysis Method (FRAM) in Aviation Safety: A Systematic Review." *Journal of Advanced Transportation*, 8898903.

### Methodology

**Safety-I vs. Safety-II Paradigm:**

| Dimension | Safety-I | Safety-II |
|---|---|---|
| Definition of safety | As few adverse outcomes as possible | As many successful outcomes as possible |
| Focus | What goes wrong | What goes right |
| View of humans | Liability (source of error) | Resource (source of adaptation) |
| Performance variability | Problem to eliminate | Source of both success and failure |
| Investigation trigger | Incidents and accidents | Everyday work (successful operations) |
| Work model | Work-as-Imagined (WAI) | Work-as-Done (WAD) |
| Management principle | Reactive (respond to failures) | Proactive (ensure things go right) |

**FRAM (Functional Resonance Analysis Method):**
- Models system as coupled **functions** (not components)
- Each function described by 6 aspects: Input, Output, Precondition, Resource, Control, Time
- Variability in function performance is **normal** — resonance (unexpected coupling of variabilities) explains both success and failure
- Not causal/linear — explicitly models non-linear, emergent behavior
- Primarily qualitative; 21.3% of 108 FRAM papers (2006-2019) used quantitative/semi-quantitative methods (Monte Carlo simulation, modeling)

**Four Cornerstones of Resilience (Resilience Assessment Grid — RAG):**

| Cornerstone | Ability | Description |
|---|---|---|
| **Respond** | Knowing what to do | Ability to adjust functioning to current conditions |
| **Monitor** | Knowing what to look for | Ability to detect changes that require adaptation |
| **Learn** | Knowing what has happened | Ability to extract lessons from experience |
| **Anticipate** | Knowing what to expect | Ability to predict future threats and opportunities |

The RAG operationalizes these as Likert-scale questionnaires producing polar/radar diagrams of organizational resilience profiles.

### Key Results

**FRAM Systematic Review (Tian et al., 2020):**

| Metric | Value |
|---|---|
| Papers reviewed | 108 (2006–2019) |
| Most common domain | Aviation |
| Qualitative methods | 78.7% |
| Quantitative/semi-quantitative | 21.3% |
| Data collection methods | Document analysis, interviews, focus groups, observations |
| Primary use case | Comparing WAI vs. WAD, identifying performance variability |

**Key Quantitative Claim (Safety-II White Paper, NHS England 2015):**
Healthcare adverse events occur in roughly 1 in 10 hospital admissions, yet the existing focus (Safety-I) only examines these failures. Safety-II argues that the **other 9 out of 10 successful outcomes** contain equally vital information about system resilience.

**Safety-III Critique (Leveson, 2020):**
Leveson argues that:
- Hollnagel's characterization of "Safety-I" does not resemble actual safety engineering practice of the past 70 years
- System Safety (as practiced in aerospace/defense since the 1960s) already incorporates most of what Safety-II proposes
- Safety-II focuses too narrowly on human operator adaptability, while system-level redesign is what creates durable safety
- Safety-III = a systems approach that subsumes both Safety-I and Safety-II within control-theoretic framework

### Tables/Data

**FRAM vs. Traditional Accident Analysis:**

| Capability | FRAM | Event Trees | Bow-Tie | RCA (5-Why) |
|---|---|---|---|---|
| Non-linear causality | **Yes** | No | No | No |
| Performance variability | **Central** | Not modeled | Not modeled | Not modeled |
| Everyday work analysis | **Yes** | Accident-only | Accident-only | Accident-only |
| Functional coupling | **Yes** | Sequential only | Sequential only | Sequential only |
| Quantitative output | Emerging (21.3%) | Yes | Yes | No |
| Ease of application | Moderate | Easy | Easy | Easy |

### Implications

Safety-II/FRAM is most valuable for understanding **why things normally go right** and how performance variability creates both safety and risk. The RAG provides an actionable measurement framework. However, the Leveson Safety-III critique is significant: relying solely on human adaptability without redesigning system control structures may be insufficient. The practical synthesis is to use FRAM/Safety-II for **operational learning** and STAMP/STPA for **system design**.

---

## Paper 4: HFACS, Swiss Cheese Model, and HRO Research

**Primary Sources:**
- **Reason, J.** (1990). *Human Error*. Cambridge University Press.
- **Reason, J.** (1997). *Managing the Risks of Organizational Accidents*. Ashgate.
- **Shappell, S.A. & Wiegmann, D.A.** (2000). "The Human Factors Analysis and Classification System — HFACS." DOT/FAA/AM-00/7. FAA Office of Aerospace Medicine.
- **Wiegmann, D.A. & Shappell, S.A.** (2001). "A Human Error Analysis of Commercial Aviation Accidents Using HFACS." DOT/FAA/AM-01/3. FAA CAMI.
- **Shappell, S., Detwiler, C., Holcomb, K., Hackworth, C., Boquet, A., & Wiegmann, D.A.** (2007). "Human Error and Commercial Aviation Accidents: An Analysis Using HFACS." *Human Factors* 49(2), pp. 227–242.
- **Weick, K.E. & Sutcliffe, K.M.** (2001/2007/2015). *Managing the Unexpected: Resilient Performance in an Age of Uncertainty*. Jossey-Bass (3 editions).
- **Roberts, K.H.** (1990). "Some Characteristics of One Type of High Reliability Organization." *Organization Science* 1(2), pp. 160–176.
- **Wiegmann, D.A., Wood, L.J., Cohen, T.N., & Shappell, S.A.** (2022). "Understanding the Swiss Cheese Model and Its Application to Patient Safety." *Journal of Patient Safety* 18(2), pp. 119–123.

### Methodology

**Swiss Cheese Model (Reason, 1990/1997):**
Organizational defenses modeled as multiple slices of Swiss cheese stacked in series. Each slice represents a barrier/defense layer. Holes represent weaknesses (both active and latent). Accidents occur when holes momentarily align across all slices, creating a "trajectory of accident opportunity."

Four levels of failure (as formalized by Reason 1997):
1. **Organizational influences** — Resource allocation, organizational culture, policies
2. **Unsafe supervision** — Inadequate oversight, failure to correct known problems
3. **Preconditions for unsafe acts** — Environmental factors, crew condition, personnel factors
4. **Unsafe acts** — Errors (skill-based, decision, perceptual) and violations (routine, exceptional)

**HFACS Taxonomy (Shappell & Wiegmann, 2000):**
Operationalizes Reason's Swiss Cheese model into 19 causal categories across 4 levels:

| Level | Categories |
|---|---|
| **1. Unsafe Acts** | Skill-based errors, Decision errors, Perceptual errors, Routine violations, Exceptional violations |
| **2. Preconditions for Unsafe Acts** | Physical environment, Technological environment, Adverse mental states, Adverse physiological states, Physical/mental limitations, Crew resource management, Personal readiness |
| **3. Unsafe Supervision** | Inadequate supervision, Planned inappropriate operations, Failure to correct known problems, Supervisory violations |
| **4. Organizational Influences** | Resource management, Organizational climate, Organizational process |

**HRO Five Principles (Weick & Sutcliffe, 2001):**
1. **Preoccupation with failure** — Treat near-misses as systemic symptoms, reward reporting
2. **Reluctance to simplify** — Resist easy explanations; seek complex interpretations
3. **Sensitivity to operations** — Maintain real-time situational awareness at all levels
4. **Commitment to resilience** — Build capability to detect and recover from errors
5. **Deference to expertise** — Let decisions migrate to those with most relevant knowledge

### Key Results

**HFACS Commercial Aviation Study (Shappell et al., 2007):**

| Metric | Value |
|---|---|
| Total accidents analyzed | 1,020 |
| Time span | 13 years |
| Number of raters | 6 pilot-raters |
| Inter-rater classification | Demonstrated reliable accommodation of all human causal factors |

**Unsafe Acts Distribution (Wiegmann & Shappell, 2001; FAA data 1990-1996):**

| Category | Approx. % of Aircrew Accidents |
|---|---|
| Skill-based errors | ~60% (63.6% Part 121, 58.7% Part 135) |
| Decision errors | ~50% (second most prevalent) |
| Violations | ~30% (Navy/Marine Corps led all services) |
| Perceptual errors | ~20% (least prevalent of the four) |

Note: Categories are not mutually exclusive; a single accident can involve multiple categories.

**Navy HFACS Intervention Results:**
- Pre-HFACS: Navy/Marine Corps had highest violation-associated accident rate of all military services
- Finding: Nearly one-third of all Navy aviation accidents associated with routine violations
- Intervention: Targeted violation-reduction programs
- Result: "Remarkable decrease in violations," sustained over time
- Also achieved: "Sharp decrease in skill-based error mishaps" and "marked reduction in decision-making errors"
- Post-intervention: Navy human error accident rates improved significantly (specific percentages not published in open literature)

**Motivating Statistic:** Human error implicated in **70-80% of all civil and military aviation accidents** — the consistent finding that drove HFACS development.

**HRO Quantitative Evidence (Weick & Sutcliffe; Roberts):**

| Metric | Value |
|---|---|
| HRO audit questionnaire | 9 scales, 83 items (binary + 3-point Likert) |
| Citation impact (Weick & Sutcliffe) | 6,991 Google Scholar citations; 361 Web of Science |
| Roberts' HRO test | "How many times could this organization have failed catastrophically that it did not?" — if answer is tens of thousands, it is HRO |
| Nuclear aircraft carriers | Tens of thousands of flight operations per year with near-zero catastrophic failure rate |
| SUBSAFE (HRO exemplar) | Zero submarine losses in 50+ years when requirements enforced |

**Swiss Cheese Model — Healthcare Application (Wiegmann et al., 2022):**
- Adapted HFACS for healthcare (HFACS-Healthcare)
- Failure propagation pattern: "holes in the cheese are more frequent at the Unsafe Acts and Preconditions levels, but become fewer as one progresses upward" through supervisory and organizational tiers
- One-to-many mapping: Single supervisory failure creates multiple precondition failures
- Many-to-one mapping: Multiple precondition factors converge into single unsafe acts

**Accident Analysis Method Reliability Comparison:**
A 2023 study in *Ergonomics* (Salmon et al.) comparing AcciMap, STAMP-CAST, and AcciNet found that **STAMP-CAST had significantly higher inter-rater reliability** than both AcciMap and AcciNet, supporting CAST as the most reproducible systems-theoretic accident analysis method.

### Tables/Data

**Swiss Cheese Layers Mapped to HFACS:**

| Swiss Cheese Layer | HFACS Level | Example |
|---|---|---|
| Organizational defenses | Organizational Influences | Budget cuts removing safety monitoring |
| Supervision defenses | Unsafe Supervision | Approving flight with known maintenance issue |
| Precondition defenses | Preconditions | Fatigued crew, poor weather, CRM failures |
| Last defense (sharp end) | Unsafe Acts | Pilot skill error, wrong decision, violation |

**HRO Principles vs. HFACS Levels:**

| HRO Principle | Corresponding HFACS Focus |
|---|---|
| Preoccupation with failure | Addresses Organizational Influences (reporting culture) |
| Reluctance to simplify | Prevents premature root cause closure at Unsafe Acts level |
| Sensitivity to operations | Addresses Preconditions monitoring |
| Commitment to resilience | Addresses Unsafe Supervision (recovery capability) |
| Deference to expertise | Addresses Organizational Influences (decision authority) |

### Implications

HFACS provides the most structured, empirically validated taxonomy for human factors in accident investigation, with proven inter-rater reliability across 1,020+ commercial aviation accidents. The Navy's targeted intervention success (violations, skill-based errors, decision errors all reduced) demonstrates that structured classification enables targeted prevention. HRO research provides the organizational design principles, while HFACS provides the diagnostic taxonomy.

---

## Cross-Cutting Synthesis

### The Evolution of Safety Thinking

| Generation | Era | Model | Key Insight | Limitation |
|---|---|---|---|---|
| **1st Gen** | 1930s–1970s | Technical failures | Component reliability prevents accidents | Ignores human and organizational factors |
| **2nd Gen** | 1970s–1990s | Human error (Reason) | Swiss Cheese: active + latent failures | Linear causation; "human error" as explanation rather than starting point |
| **3rd Gen** | 1990s–2010s | Sociotechnical systems (STAMP) | Safety as emergent property of control structures | Higher analyst effort; less industry penetration |
| **4th Gen** | 2010s–present | Resilience (Safety-II/FRAM) | Learn from success; performance variability is normal | Limited quantitative tools; Leveson's Safety-III critique |

### Quantitative Evidence Summary

| Method | Empirical Base | Key Strength (Quantified) |
|---|---|---|
| HFACS | 1,020+ commercial aviation accidents; 80% human error baseline | Structured classification enabled targeted interventions reducing Navy violation-related accidents |
| STPA | 321 papers in scoping review; controlled experiment with 21 participants | 92% higher recall than FTA; 36% higher than FMEA for safety requirements |
| STAMP/CAST | Higher inter-rater reliability than AcciMap and AcciNet | Identifies system-level causes (software, organizational) that chain-of-events models miss |
| FRAM | 108 papers (2006-2019); 21.3% using quantitative methods | Unique capability for WAI vs. WAD analysis; emerging quantification via Monte Carlo |
| Swiss Cheese | Foundational model cited in all 4 HFACS levels | Universal conceptual framework; operationalized through HFACS |
| HRO | 6,991 Google Scholar citations; decades of field research | 5 principles empirically associated with ultra-low failure rates in high-hazard organizations |

### Integration Architecture for RCA

The methods are **complementary, not competing**:

```
ORGANIZATIONAL LEVEL
    HRO Principles (Weick & Sutcliffe) ──── Design principles for safety culture
    │
SYSTEM DESIGN LEVEL
    STAMP/STPA (Leveson) ──────────────── Prospective: identify hazardous control actions
    CAST (Leveson) ────────────────────── Retrospective: analyze accidents systemically
    │
OPERATIONAL LEVEL
    FRAM/Safety-II (Hollnagel) ────────── Understand everyday performance variability
    RAG (Hollnagel) ───────────────────── Measure organizational resilience
    │
INCIDENT CLASSIFICATION LEVEL
    Swiss Cheese (Reason) ─────────────── Conceptual framework for defense layers
    HFACS (Shappell & Wiegmann) ───────── Structured human factors taxonomy (19 categories)
    │
TRADITIONAL METHODS (still valuable for component-level)
    FTA / FMEA / HAZOP ────────────────── Hardware reliability and component failures
```

### Key Takeaway

No single method covers the full spectrum. STPA catches 27% of hazards FMEA misses, while FMEA catches 30% STPA misses. HFACS provides the most validated human factors classification. FRAM uniquely analyzes successful operations. HRO principles guide organizational design. The strongest RCA program uses **all layers**: HRO for culture, STAMP/STPA for system design, FRAM for operational learning, HFACS for incident classification, and traditional FTA/FMEA for component reliability.

### Critical Numbers to Remember

- **80%** — Aviation accidents involving human error (motivating statistic for all human factors work)
- **60%** — Commercial aviation accidents involving skill-based errors (HFACS)
- **0.443 vs 0.231** — STPA vs FTA recall in controlled experiment (92% advantage)
- **27% / 30%** — Unique hazards found by STPA vs FMEA respectively (complementary)
- **321** — STAMP/STPA/CAST papers in 2022 scoping review (78% STPA)
- **50+ years** — Zero submarine losses under SUBSAFE (when requirements not waived)
- **1,020** — Commercial aviation accidents classified using HFACS (13-year dataset)
- **9 out of 10** — Hospital admissions that go right (Safety-II's focus area)
- **19** — HFACS causal categories across 4 levels of Reason's Swiss Cheese
- **108** — FRAM research papers (2006-2019), aviation as most common domain

## Study Guide — Systems-Theoretic RCA

Tools: STPA (Leveson), FRAM (Hollnagel), Safety-II,
HFACS, SUBSAFE.

## DIY — Apply STPA to one system

Define system boundary. Identify losses and hazards.
Build safety control structure. Identify unsafe control
actions.

## TRY — Read Leveson's *Engineering a Safer World*

Chapter 1 is the conceptual pivot away from Reason's
Swiss Cheese.
