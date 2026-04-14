# Classical RCA Methods — Deep Paper Enrichment Data

*Research compiled for the "Classical RCA Methods" module. Sources: peer-reviewed journals, systematic reviews, and authoritative technical references.*

---

## Paper 1: The Problem with '5 Whys'

**Authors:** Alan J. Card
**Year/Venue:** 2017, *BMJ Quality & Safety*, Vol. 26, No. 8, pp. 671-677. DOI: 10.1136/bmjqs-2016-005849

### Methodology

Analytical critique of the Five Whys technique as applied in healthcare quality improvement and patient safety. Card examines the logical foundations of the method against the requirements of rigorous root cause analysis, drawing on evidence from its adoption by WHO, NHS England, the Institute for Healthcare Improvement (IHI), and the Joint Commission.

### Key Results

Card identifies four fundamental flaws in the Five Whys technique:

1. **Gross oversimplification** — Forces a single linear causal pathway when real-world incidents involve branching, converging, and interacting causal chains.
2. **Single-pathway forcing** — For any given problem, the technique channels the analyst down one chain of "why" questions, systematically excluding parallel causal factors.
3. **Single root cause assumption** — Insists on arriving at *one* root cause, when most incidents arise from the alignment of multiple contributing factors across organizational levels.
4. **Distal-link fallacy** — Assumes the most distant link on the causal chain is inherently the most effective intervention point, which has no empirical basis.

**Inter-rater reliability problem:** Different analysts applying Five Whys to the same incident arrive at different root causes. This is a fundamental repeatability failure — the technique produces non-reproducible results.

**Recommendation:** Card argues the technique "should be abandoned" for patient safety RCA. He recommends fishbone (Ishikawa) diagrams and "lovebug diagrams" as alternatives that can represent multi-causal structures.

### Context: Five Whys Origins and Scope

The technique was developed by Sakichi Toyoda and formalized by Taiichi Ohno within the Toyota Production System (TPS). Ohno described it as "the basis of Toyota's scientific approach," stating that "repeating why five times...the nature of the problem as well as its solution becomes clear" (Ohno, 1988, *Toyota Production System: Beyond Large-Scale Production*).

**Critical historical note:** The Five Whys was originally designed to understand needed *product features*, not to perform root cause analysis of failures. Its migration to RCA represents a repurposing that outstripped the method's structural capacity.

Teruyuki Minoura, former Toyota managing director, himself criticized the method as "too basic" for adequate root cause depth, citing:
- Investigators stopping at symptoms rather than deeper causes
- Inability to identify unknown causes
- Lack of support for answering "why" questions correctly
- Non-repeatable results across different analysts
- Tendency to isolate single causes despite multiple possibilities

### Tables/Data

| Limitation | Description | Impact on RCA |
|------------|-------------|---------------|
| Linear forcing | Single causal chain only | Misses parallel/interacting causes |
| Arbitrary depth | "Fifth why" has no empirical basis as root cause level | May stop too early or too late |
| No repeatability | Different teams reach different conclusions | Cannot be validated or audited |
| Single root cause | Converges on one cause | Ignores systemic multi-factor incidents |
| Confirmation bias | Analyst's prior beliefs shape which "why" path is followed | Subjective, not objective |

### Implications

Five Whys is appropriate only for simple, linear, single-cause problems (e.g., a machine stopped because a fuse blew). For complex sociotechnical systems — healthcare, aviation, software, nuclear — it is structurally inadequate. Any "Classical RCA Methods" module should present Five Whys with clear boundary conditions: useful as a *starting* technique for simple problems, dangerous as the *only* technique for complex ones.

---

## Paper 2: Inquiry into the Use of Five Whys in Industry

**Authors:** Matthew Barsalou, Beata Starzynska
**Year/Venue:** 2023, *Quality Innovation Prosperity*, Vol. 27, No. 1. Poznan University of Technology, Poland.

### Methodology

Survey-based empirical study. 98 Polish organizations contacted; 47 responded; 4 excluded (unfamiliar with Five Whys); **43 valid responses analyzed**. Chi-square goodness-of-fit tests and hypothesis testing of two proportions compared Five Whys usage patterns.

This represents the **first empirical study** of how Five Whys is actually used in industrial organizations.

### Key Results

| Finding | Detail |
|---------|--------|
| Primary use | More respondents use Five Whys for RCA than brainstorming, but difference **not statistically significant** |
| Investigation vs. brainstorming | Practitioners using investigation-based approaches used it for QI and RCA more often than brainstorming users |
| Most common companion tool | **Ishikawa diagram** — "by far the quality tool used the most with Five Whys," far exceeding all other quality tools combined |
| QI vs RCA distinction | No significant difference between RCA usage and brainstorming for quality improvement |

### Tables/Data

**Usage Pattern Distribution:**

| Usage Mode | Description |
|------------|-------------|
| RCA-focused | Used with structured investigation to identify root causes |
| QI-focused | Used for quality improvement brainstorming |
| Combined | Used for both RCA and QI simultaneously |

**Companion Tool Frequency:**

| Tool | Frequency with Five Whys |
|------|-------------------------|
| Ishikawa (Fishbone) diagram | Dominant (far exceeds others) |
| Other quality tools | Minority combined |

### Implications

The empirical finding that Ishikawa diagrams are the dominant companion tool validates a "Five Whys + Fishbone" combined workflow as the de facto industrial standard. The module should present these as a natural pair, not isolated techniques. The lack of statistical significance between RCA and brainstorming usage suggests practitioners are unclear about the method's intended purpose — a training gap worth addressing.

---

## Paper 3: The Swiss Cheese Model — Validation and Application

### Paper 3a: Are There Holes in the Metaphor?

**Authors:** Thomas V. Perneger
**Year/Venue:** 2005, *BMC Health Services Research*, Vol. 5, Article 71. University Hospitals of Geneva.

#### Methodology

Cross-sectional questionnaire study. **23-item instrument** with five response options per question, administered to:
- Attendees at the 20th International Society for Quality in Health Care conference (Amsterdam, October 2004)
- Online respondents via International Journal for Quality in Health Care and society websites (November 2004-January 2005)

**Sample:** 159 usable questionnaires; 85 respondents self-reported "very" or "quite" familiar with the Swiss Cheese model.

**Survey structure:** Five domains, each testing comprehension of a model component:
- Slices of cheese (4 items)
- Holes (5 items)
- Arrow representation (4 items)
- Active error depiction (5 items)
- System improvement strategies (5 items)

Classification: 11 compatible statements, 12 incompatible statements with author's interpretation.

#### Key Results

**Overall comprehension:** Mean correct answers: **15.3 of 23 (66.5%)**, SD 2.3, range 10-21. Significantly better than 11.5 expected by chance (p < 0.001), but far from mastery.

| Model Component | Correct Answers (of N items) | Interpretation |
|-----------------|------------------------------|----------------|
| Cheese slices (barriers) | 2.4 / 4 (60.0%) | Moderate understanding |
| Holes (weaknesses) | 2.7 / 5 (54.0%) | Below adequate |
| Arrow (hazard path) | 2.8 / 4 (70.0%) | Moderate |
| Active error depiction | 3.3 / 5 (66.0%) | Moderate |
| System improvement | 4.1 / 5 (82.0%) | Best understood |

**Specific interpretation accuracy:**

| Statement | % Correct |
|-----------|-----------|
| Cheese slices = barriers protecting patients | 71.8% |
| Holes = defense weaknesses | 63.5% |
| Holes = error opportunities | 62.4% |
| Arrow = path from hazard to patient harm | 48.2% |
| Plugging a hole = system improvement | 89.4% |
| Active errors represented by holes | 30.6% |

**Sample demographics:** Average age 44 (SD 9, range 25-70); 42 women, 42 men; 31 countries across all continents; roles included quality management, healthcare policy, clinical practice, research.

#### Implications

The finding that only **30.6%** correctly understand how active errors are represented is devastating for practical application. The model is "almost too successful in placing emphasis on systemic causes of patient harm, as opposed to an individual's failure." Invoking the Swiss Cheese model "will not necessarily lead to effective communication, even among quality and safety professionals."

### Paper 3b: Understanding the Swiss Cheese Model and Its Application to Patient Safety

**Authors:** Douglas A. Wiegmann, Laura J. Wood, Tara N. Cohen, Scott A. Shappell
**Year/Venue:** 2022, *Journal of Patient Safety*, Vol. 18, No. 2, pp. 119-123. DOI: 10.1097/PTS.0000000000000810

#### Methodology

Theoretical analysis of James Reason's Theory of Active and Latent Failures. Review of foundational concepts with clarification of commonly misunderstood aspects through conceptual discussion and illustrative examples. Incorporates the Human Factors Analysis and Classification System (HFACS).

#### Key Results: Four-Level Failure Taxonomy

| Level | Description | Temporal Behavior | Examples |
|-------|-------------|-------------------|----------|
| 1. Unsafe Acts | Direct errors during care | Open/close rapidly; detected and corrected frequently | Medication errors, wrong-site surgery |
| 2. Preconditions | Environmental, individual, team factors | Persist until addressed | Fatigue, poor communication, inadequate tools |
| 3. Supervisory Factors | Management oversight failures | Dormant for extended periods | Inadequate training, inappropriate scheduling |
| 4. Organizational Influences | Strategic, policy, cultural failures | Most persistent; hardest to detect | Safety culture deficits, resource under-allocation |

**HFACS Detailed Classification:**

| Level | Category | Sub-categories |
|-------|----------|----------------|
| Organizational | Culture | Safety climate, operational process, resource management |
| Supervisory | Oversight | Inadequate supervision, inappropriate assignments, failure to correct known problems, supervisory violations |
| Preconditions | Environment | Tools, physical workspace, task complexity |
| Preconditions | Individual | Mental state, fatigue, fitness for duty |
| Preconditions | Team | Communication, coordination, leadership |
| Unsafe Acts | Errors | Decision errors, skill-based errors, perceptual errors |
| Unsafe Acts | Violations | Routine violations, exceptional violations |

**Critical distinctions from oversimplified interpretations:**
1. Not every hole causes harm — many are caught and corrected (system resilience)
2. Not a linear process — cannot be solved by simple "5 Whys" questioning
3. Requires multilevel investigation — superficial fixes addressing only unsafe acts fail to prevent recurrence

**Failure mapping patterns:**
- One-to-many: Single supervisory failure generates multiple precondition failures
- Many-to-one: Multiple precondition failures converge into one unsafe act

**Hans Brinker analogy (local vs. system fixes):**
- Local fix: Adding retained instrument counting to surgical safety checklist
- System fix: Addressing production pressure culture and communication protocols

### Combined Swiss Cheese Implications

The two papers together reveal a paradox: the Swiss Cheese model is the most widely recognized safety framework in healthcare and aviation, yet its components are poorly understood even by professionals who claim familiarity. Any RCA module must teach the *mechanism* (four levels, dynamic holes, active vs. latent failures) not just the *metaphor* (cheese slices with holes).

---

## Paper 4: Fault Tree Analysis — Bibliometric Review of a Decade of Improvements

**Authors:** Mohammad Yazdi, Javad Mohammadpour, He Li, Hong-Zhong Huang, Esmaeil Zarei, Reza Ghasemi Pirbalouti, Sidum Adumene
**Year/Venue:** 2023, *Quality and Reliability Engineering International*, Vol. 39, No. 5, pp. 1639-1659. DOI: 10.1002/qre.3271

### Methodology

Systematic literature review using Scopus database, covering publications from **2011-2021**. Bibliometric analysis with statistical metadata examination to identify research trends, influential contributors, and improvement categories.

**Scale:** 7,995 publications identified; systematic analysis of improvement categories across the full corpus.

### Key Results

**Four major FTA improvement categories identified:**

| Category | Description | Research Focus |
|----------|-------------|----------------|
| Decision-making | FTA integrated with MCDM methods | Risk prioritization, resource allocation |
| Risk analysis | Enhanced quantitative risk assessment | Probability estimation, consequence modeling |
| Uncertainty analysis | Fuzzy logic, interval analysis | Handling imprecise/incomplete failure data |
| Bayesian Networks | Probabilistic graphical integration | Dynamic updating, common-cause failures |

**Publication trends:**
- Accelerating growth after 2019
- Asia (particularly China) dominates the field
- 40 journals account for approximately one-third of publications
- Leading researchers: Jianxiu Wang, Yan-Feng Li, Yihuan Wang

**Classical FTA deficiencies driving improvements:**

| Deficiency | Description |
|------------|-------------|
| Static structure | Cannot model time-dependent or sequential failures |
| Crisp probability requirement | Real-world failure data is often imprecise or incomplete |
| Binary state assumption | Components are either working or failed (no degradation) |
| Independence assumption | Cannot model common-cause failures or dependencies |
| No updating mechanism | Cannot incorporate new evidence or operational experience |

### FTA Historical Context (from Watson/Bell Labs 1962)

| Year | Milestone |
|------|-----------|
| 1962 | H.A. Watson at Bell Labs develops FTA for Minuteman I ICBM Launch Control System |
| 1963-64 | Boeing and AVCO expand FTA to Minuteman II |
| 1965 | Boeing presents FTA at System Safety Symposium, Seattle |
| 1966 | Boeing applies FTA to civil aircraft design |
| 1970 | FAA mandates FTA via 14 CFR 25.1309 airworthiness regulations |
| 1975 | Nuclear Regulatory Commission incorporates FTA into PRA |
| 1981 | NRC publishes NUREG-0492 Fault Tree Handbook |
| 1992 | OSHA recognizes FTA in Process Safety Management standard |
| 2023 | 60% of world nuclear plants use RiskSpectrum software for FTA |

### FTA Mathematical Foundations

| Gate Type | Probability Formula | Application |
|-----------|-------------------|-------------|
| AND gate | P(top) = P(A) x P(B) for independent events | Requires multiple simultaneous failures |
| OR gate | P(top) ≈ P(A) + P(B) when individual P < 0.1 | Any single failure triggers top event |
| Constant failure rate | P = 1 - e^(-lambda*t), approx. lambda*t when lambda*t < 0.001 | Basic component reliability |

**Minimal cut sets:** The minimum combinations of basic events that cause the top event. Finding all minimal cut sets is the core qualitative analysis step.

### Implications

The classical FTA's five deficiencies (static, crisp, binary, independent, non-updating) are precisely where modern methods diverge. The module should present classical FTA as the foundational technique while noting that fuzzy FTA, dynamic FTA, and Bayesian network integration represent the active research frontier. The 7,995-paper corpus confirms FTA as the most extensively researched classical RCA method.

---

## Paper 5: FMEA in Healthcare — 20-Year Scoping Review

**Authors:** Marco Vecchia, Paolo Sacchi, Lea Nadia Marvulli, Luca Ragazzoni, Alba Muzzi, Lorenzo Polo, Raffaele Bruno, Flavio Salio
**Year/Venue:** 2025, *Healthcare (Basel)*, Vol. 13, No. 1, Article 82. DOI: 10.3390/healthcare13010082

### Methodology

Scoping review per Joanna Briggs Institute methodology. Searched PUBMED and EMBASE through October 31, 2023. Inclusion: FMEA in hospital settings, English/Italian, peer-reviewed journals, 1995-2023. Quality assessed via JBI critical appraisal checklists.

### Key Results

| Metric | Value |
|--------|-------|
| Total studies analyzed | 163 |
| Publication span | 2003-2023 |
| Countries represented | 32 |
| **Total failure modes identified across all studies** | **9,564** |
| **Mean failure modes per study** | **62.51** |
| Studies proposing corrective actions | 122 (74.85%) |

**Geographic distribution:**

| Country | Studies | % of Total |
|---------|---------|------------|
| USA | 55 | 33.7% |
| Italy | 20 | 12.3% |
| Spain | 15 | 9.2% |
| China | 12 | 7.4% |
| Other (28 countries) | 61 | 37.4% |

**Study design breakdown:**

| Design | N | % |
|--------|---|---|
| Prospective analytical | 112 | 68.71% |
| Quality improvement | 33 | 20.25% |
| Systematic reviews | 6 | 3.68% |
| Cross-sectional | 6 | 3.68% |
| Narrative reviews | 3 | 1.84% |
| Retrospective analytical | 3 | 1.84% |
| Randomized trials | 1 | 0.61% |

**Application domains:**

| Domain | N | % |
|--------|---|---|
| Healthcare processes | 129 | 79.14% |
| Hospital management | 20 | 12.27% |
| Medical equipment/production | 6 | 3.68% |
| Hospital informatization | 4 | 2.45% |
| Infectious disease | 13 | 7.98% |

**Specific outcome examples:**
- Catheter-related bloodstream infections reduced from **5.19% to 1.42%** after FMEA-driven interventions
- MDRO control: "significantly lower" infection rates and improved patient satisfaction

**FMEA Risk Priority Number (RPN) formula:**
RPN = Severity (1-10) x Occurrence (1-10) x Detection (1-10)
Range: 1 to 1,000. Recalculated after corrective action to measure effectiveness.

**Case study (Anjalee et al., 2021, Sri Lanka):**
- Two independent pharmacist teams, 2-month analysis
- 90 failure modes identified; 66 prioritized for corrective action
- "Overcrowded dispensing counters" implicated in 57 failure modes
- Led to redesigned dispensing tables and patient counseling units

### Implications

The 163-study corpus with 9,564 identified failure modes represents the strongest evidence base for any classical RCA method in healthcare. The dominance of prospective analytical designs (68.71%) confirms FMEA's unique role as a *proactive* risk identification tool — most other RCA methods are reactive (applied after an incident). However, only one randomized trial exists, highlighting a significant evidence gap for proving causal effectiveness.

---

## Paper 6: Cause-and-Effect (Fishbone) Diagram for Quality Improvement

**Authors:** Augustine Kumah, Chinwe N. Nwogu, Abdul-Razak Issah, Emmanuel Obot, Deborah T. Kanamitie, Jerry S. Sifa, Lawrencia A. Aidoo
**Year/Venue:** 2024, *Global Journal on Quality and Safety in Healthcare*, Vol. 7, No. 2, pp. 85-87. DOI: 10.36401/JQSH-23-42

### Methodology

Educational framework with case study approach. Six-step process for fishbone diagram creation: problem identification, diagramming structure, brainstorming, categorization, root cause analysis, multi-voting for prioritization.

### Key Results

**Stated advantages:**
- Narrows investigation scope to actionable items
- Generates testable causes (not just opinions)
- Provides efficient resource allocation guidance
- Visualizes causal relationships spatially
- Establishes shared team understanding
- Documents verified vs. unverified causes

**Documented limitation:** Fishbone diagrams "could generate both irrelevant and relevant potential root causes," potentially leading to unfocused improvement strategies.

**Case study — Nyaho Medical Centre, Ghana:**
- Needlestick injuries decreased from **11 cases in 2018 to 2 cases in 2021** (81.8% reduction)
- Achieved through fishbone diagram analysis followed by targeted quality improvement initiatives

**Standard category framework (the "6 Ms"):**

| Category | Scope |
|----------|-------|
| Materials | Raw materials, consumables, inputs |
| Methods | Processes, procedures, protocols |
| Machines/Equipment | Tools, technology, infrastructure |
| Manpower/People | Skills, training, staffing |
| Measurement | Data collection, metrics, calibration |
| Mother Nature/Environment | Physical conditions, external factors |

### Implications

The fishbone diagram's spatial layout directly addresses the Five Whys' linear-forcing flaw by allowing multiple causal branches to be explored simultaneously. The 81.8% reduction in needlestick injuries demonstrates real-world effectiveness when the diagram is used as the *starting point* for a structured improvement cycle, not as a standalone deliverable.

---

## Paper 7: Successful Risk Assessment May Not Always Lead to Successful Risk Control

**Authors:** Alan J. Card, James Ward, P. John Clarkson
**Year/Venue:** 2012, *Journal of Healthcare Risk Management*, Vol. 31, No. 3, pp. 6-12. DOI: 10.1002/jhrm.20090. University of Cambridge Engineering Design Centre.

### Methodology

Systematic literature review examining whether root cause analysis — "perhaps the most widely used tool in healthcare risk management" — actually produces effective risk control outcomes.

### Key Results

1. **RCA-to-control gap identified:** Successful root cause identification does not automatically translate to successful risk control. The review found a systematic disconnect between analysis completeness and implementation effectiveness.

2. **Hierarchy of controls underutilized:** Healthcare risk managers do not systematically apply the established hierarchy of risk controls (elimination > substitution > engineering controls > administrative controls > PPE) when designing action plans after RCA.

3. **Tool deficiency:** Existing tools support the *analysis* phase well but provide inadequate support for the *control planning* phase. New tools needed for the risk control process.

### Implications

This paper is critical for any RCA module because it demonstrates that the *entire classical RCA toolkit* shares a common blind spot: they are designed to identify causes, not to ensure effective corrective action. The "hierarchy of risk controls" from safety engineering should be taught alongside every RCA method as the bridge from analysis to action.

---

## Paper 8: Doggett's Framework for RCA Tool Selection

**Authors:** A. Mark Doggett
**Year/Venue:** 2005, *Quality Management Journal*, Vol. 12, No. 4, pp. 34-45. Published by ASQ (American Society for Quality). DOI: 10.1080/10686967.2005.11919269

### Methodology

Comparative framework evaluating three RCA tools against objective performance criteria:
1. Cause-and-Effect (Ishikawa/Fishbone) Diagram
2. Interrelationship Diagram (ID)
3. Current Reality Tree (CRT) — from Theory of Constraints

### Key Results: Performance Characteristics Framework

| Performance Criterion | Description |
|-----------------------|-------------|
| Causal yield | Number and quality of root causes identified |
| Causal interdependencies | Ability to show how causes relate to each other |
| Factor relationships | Mapping between causes and effects |
| Cause categories | Ability to organize causes into meaningful groups |
| Focus promotion | Keeps team oriented on the problem |
| Discussion stimulation | Generates productive team dialogue |
| Readability | Clarity of the completed diagram |
| Finding integrity | Mechanisms for evaluating the validity of conclusions |

**Comparative findings:**
- Each tool has distinct advantages and disadvantages
- No single tool dominates across all criteria
- **Causal yield** and **selected causal factor integrity** vary significantly across tools
- The Ishikawa diagram excels at cause categorization and discussion stimulation
- The Current Reality Tree provides stronger causal chain logic
- The Interrelationship Diagram better captures interdependencies

### Implications

Doggett's framework provides the missing meta-tool: a way to select *which* RCA method to use based on the problem's characteristics. The module should present this selection framework as the entry point to the classical methods, not an afterthought.

---

## Cross-Cutting Synthesis and Enrichment Recommendations

### 1. Method Comparison Matrix

The following matrix synthesizes findings across all papers for direct use in the HTML page:

| Method | Approach | Strengths | Weaknesses | Best For | Evidence Base |
|--------|----------|-----------|------------|----------|---------------|
| Five Whys | Linear, iterative "why?" questioning | Simple, fast, no training needed | Non-repeatable, single-pathway, no multi-causality | Simple, single-cause problems | Weak — no effectiveness studies; criticized by its own creator organization |
| Ishikawa/Fishbone | Spatial, categorical cause mapping | Multi-branch exploration, team alignment, visual | Can generate irrelevant causes, no quantification | Brainstorming phase of complex problems | Moderate — case studies show 81.8% incident reduction when used in QI cycle |
| Fault Tree Analysis | Deductive, top-down Boolean logic | Quantitative probability, minimal cut sets, regulatory mandated | Static, requires precise failure data, binary state only | System-level failure analysis, safety-critical domains | Strong — 7,995 papers (2011-2021), 60+ years of application, regulatory mandated |
| FMEA | Inductive, bottom-up component analysis | Proactive, exhaustive enumeration, RPN scoring | Time-consuming, subjective scoring, poor at multi-failure | Component-level risk identification before deployment | Strong — 163 healthcare studies (2003-2023), 9,564 failure modes cataloged |
| Barrier/Swiss Cheese | Organizational-level defense analysis | Multi-level (4 tiers), addresses latent failures, systemic | Widely misunderstood (only 66.5% comprehension), qualitative | Post-incident investigation of complex sociotechnical failures | Moderate — well-validated conceptually, poor empirical comprehension among practitioners |

### 2. Key Numbers for the HTML Page

These specific, citable numbers should be woven into the module text:

- **66.5%** — Average comprehension score of the Swiss Cheese model among quality professionals who self-report familiarity (Perneger 2005, n=85)
- **30.6%** — Percentage who correctly understand how active errors are represented in the Swiss Cheese model
- **89.4%** — Percentage who correctly understand "plugging a hole" = system improvement
- **9,564** — Total failure modes identified across 163 FMEA healthcare studies over 20 years
- **62.51** — Mean failure modes identified per FMEA study
- **74.85%** — Percentage of FMEA studies that produced specific corrective actions
- **7,995** — Publications on FTA improvements in Scopus (2011-2021)
- **1962** — Year FTA was invented at Bell Labs for the Minuteman I ICBM
- **60%** — World nuclear plants using RiskSpectrum for FTA analysis
- **81.8%** — Needlestick injury reduction achieved using fishbone diagram + QI cycle (11 to 2 cases)
- **5.19% to 1.42%** — Catheter-related bloodstream infection reduction via FMEA interventions

### 3. Recommended Structural Enrichments for the HTML Page

**A. Add a "Method Selection Framework" section** based on Doggett (2005). Present the 8 performance criteria as a decision matrix so readers can select the appropriate method for their problem type.

**B. Add a "Known Limitations" callout box for each method.** The current strongest enrichment data:
- Five Whys: Card (2017) four fundamental flaws + non-repeatability
- Fishbone: Potential for irrelevant cause generation (Kumah 2024)
- FTA: Five classical deficiencies driving modern improvements (Yazdi 2023)
- FMEA: Only 1 randomized trial in 163 studies — evidence gap (Vecchia 2025)
- Swiss Cheese: 66.5% comprehension paradox (Perneger 2005)

**C. Add a "Combined Methods" section.** Barsalou & Starzynska (2023) empirically confirmed that Ishikawa is the dominant companion tool for Five Whys. Card et al. (2012) showed RCA-to-control gap requires pairing any analysis method with the hierarchy of risk controls.

**D. Add the HFACS taxonomy table** from Wiegmann et al. (2022) as a practical tool for Swiss Cheese model application — converts the abstract metaphor into a structured investigation checklist.

**E. Add an "FTA Timeline" visualization** using the milestone data from Bell Labs (1962) through modern adoption (60% of nuclear plants). This grounds the mathematical method in its engineering heritage.

**F. Add quantitative effectiveness evidence** wherever available. The FMEA section has the strongest numbers (9,564 failure modes, infection reduction percentages). FTA has the largest research corpus (7,995 papers). Five Whys has the weakest evidence base — this itself is a finding worth presenting.

### 4. Source Bibliography

1. Card, A.J. (2017). "The problem with '5 whys'." *BMJ Quality & Safety*, 26(8), 671-677.
2. Barsalou, M. & Starzynska, B. (2023). "Inquiry into the Use of Five Whys in Industry." *Quality Innovation Prosperity*, 27(1).
3. Perneger, T.V. (2005). "The Swiss cheese model of safety incidents: are there holes in the metaphor?" *BMC Health Services Research*, 5:71.
4. Wiegmann, D.A., Wood, L.J., Cohen, T.N., & Shappell, S.A. (2022). "Understanding the 'Swiss Cheese Model' and Its Application to Patient Safety." *Journal of Patient Safety*, 18(2), 119-123.
5. Yazdi, M. et al. (2023). "Fault tree analysis improvements: A bibliometric analysis and literature review." *Quality and Reliability Engineering International*, 39(5), 1639-1659.
6. Vecchia, M. et al. (2025). "Healthcare Application of FMEA: Is There Room in the Infectious Disease Setting? A Scoping Review." *Healthcare (Basel)*, 13(1), 82.
7. Kumah, A. et al. (2024). "Cause-and-Effect (Fishbone) Diagram: A Tool for Generating and Organizing Quality Improvement Ideas." *Global Journal on Quality and Safety in Healthcare*, 7(2), 85-87.
8. Card, A.J., Ward, J., & Clarkson, P.J. (2012). "Successful risk assessment may not always lead to successful risk control." *Journal of Healthcare Risk Management*, 31(3), 6-12.
9. Doggett, A.M. (2005). "Root Cause Analysis: A Framework for Tool Selection." *Quality Management Journal*, 12(4), 34-45.
10. Reason, J.T. (1990). *Human Error*. Cambridge University Press.
11. Ohno, T. (1988). *Toyota Production System: Beyond Large-Scale Production*. Productivity Press.
12. Key, B.A. (2019). "Five Whys Root Cause System Effectiveness: A Two Factor Quantitative Review." M.S. Thesis, Western Kentucky University.

## Study Guide — Classical RCA Methods

Methods: 5 Whys, Fishbone (Ishikawa), FTA, FMEA, Swiss
Cheese (Reason).

## DIY — Run 5 Whys on a real incident

Pick a recent bug or outage. Ask "why?" five times.
Note where it stops being useful.

## TRY — Draw a fishbone

Categories: People, Process, Technology, Environment,
Materials, Measurement. Brainstorm one incident.
