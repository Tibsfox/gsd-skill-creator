# Curriculum Coverage Mapping

> **Domain:** Education Research & Instructional Design
> **Module:** 2 -- Systematic Coverage Analysis and Alignment Verification
> **Through-line:** *A map that omits a river is not wrong about the mountains. But the traveler who needs to cross water will drown trusting it. Coverage mapping does not judge what is present -- it reveals what is absent. The map is honest. The gaps are what they are.*

---

## Table of Contents

1. [The Coverage Problem](#1-the-coverage-problem)
2. [Porter's Surveys of Enacted Curriculum](#2-porters-surveys-of-enacted-curriculum)
3. [Two-Dimensional Content Mapping](#3-two-dimensional-content-mapping)
4. [Building a Coverage Matrix](#4-building-a-coverage-matrix)
5. [Alignment Indices](#5-alignment-indices)
6. [Topic Coverage vs. Cognitive Demand](#6-topic-coverage-vs-cognitive-demand)
7. [Coverage Mapping for Research Documents](#7-coverage-mapping-for-research-documents)
8. [The FoxEdu Infrastructure Coverage Audit](#8-the-foxedu-infrastructure-coverage-audit)
9. [Automated Coverage Analysis](#9-automated-coverage-analysis)
10. [Coverage Visualization](#10-coverage-visualization)
11. [Limitations and Failure Modes](#11-limitations-and-failure-modes)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. The Coverage Problem

Curriculum coverage mapping answers a question that most institutions avoid: of everything we claim to teach, what do we actually deliver, and at what depth? The distinction between intended and enacted curriculum has been studied since Goodlad's classification in 1979, but systematic measurement tools only matured in the late 1990s with Webb's alignment methodology and Porter's Surveys of Enacted Curriculum [1, 2, 3].

The problem is not merely academic. Misalignment between intended curriculum and actual delivery has measurable consequences:

- Students assessed on content they were never taught (NAEP data shows 15-25% of test items cover content not in the enacted curriculum across states) [4]
- Accreditation reviews that compare syllabi to actual classroom hours and find 20-40% discrepancy [5]
- Professional certification programs where the exam blueprint and the training curriculum diverge on specific competencies [6]

```
COVERAGE MAPPING -- CORE CONCEPT
================================================================

  INTENDED       ENACTED        ASSESSED
  CURRICULUM     CURRICULUM     CURRICULUM
  +---------+   +---------+   +---------+
  |  ████   |   |  ████   |   |  ████   |
  |  ████   |   |  ██     |   |  ████   |  <-- Assessed but not taught
  |  ████   |   |  ████   |   |         |  <-- Taught but not assessed
  |  ████   |   |  ██████ |   |  ████   |  <-- Over-taught, correctly assessed
  |         |   |  ████   |   |         |  <-- Taught but not intended
  +---------+   +---------+   +---------+

  Alignment = overlap / union of all three
```

For the FoxEdu Gap-Fill context, the "intended curriculum" is the mission specification's scope, the "enacted curriculum" is the produced document, and the "assessed curriculum" is the verification matrix. Perfect alignment means every success criterion maps to produced content, and every produced content item maps to a success criterion [7].

---

## 2. Porter's Surveys of Enacted Curriculum

Andrew Porter's framework, developed at the Wisconsin Center for Education Policy Research (1994-2002), provides the most rigorous methodology for measuring what is actually taught versus what is intended [2, 8].

### 2.1 The SEC Framework

The Surveys of Enacted Curriculum (SEC) use a two-dimensional grid:

| Dimension | Standard Application | Research Document Application |
|-----------|---------------------|-------------------------------|
| X-axis: Topics | Mathematics content strands | Module topic domains |
| Y-axis: Cognitive Demand | 5 levels from memorize to analyze | DOK levels 1-4 |
| Cell value | Proportion of instructional time | Proportion of document lines |
| Unit of measurement | Clock hours per topic per level | Lines of sourced content per topic per level |

### 2.2 The Five SEC Cognitive Demand Levels

Porter's original framework uses five levels of cognitive demand, which map onto Webb's DOK as follows:

| SEC Level | Label | Description | Webb DOK Equivalent |
|-----------|-------|-------------|-------------------|
| A | Memorize/Recall | Facts, definitions, formulas | DOK 1 |
| B | Perform Procedures | Apply known algorithms, follow steps | DOK 1-2 |
| C | Demonstrate Understanding | Explain concepts, identify relationships | DOK 2 |
| D | Conjecture/Generalize | Form hypotheses, make connections | DOK 3 |
| E | Solve Non-routine Problems | Novel application, cross-domain synthesis | DOK 3-4 |

For a research document (as opposed to a classroom), levels A-B correspond to data tables and sourced facts, levels C-D correspond to explanatory text and analysis, and level E corresponds to cross-module synthesis and application mapping [2, 8].

### 2.3 Alignment Index Calculation

Porter's alignment index ranges from 0.0 (no alignment) to 1.0 (perfect alignment):

```
Alignment Index = 1 - (sum |p_i - q_i|) / 2

Where:
  p_i = proportion of intended curriculum in cell i
  q_i = proportion of enacted curriculum in cell i
  Sum over all cells in the topic x cognitive demand grid
```

Research across 30+ states shows typical alignment indices of 0.15-0.30 for mathematics and 0.10-0.25 for science, meaning enacted curriculum covers less than 30% of what is intended at the correct cognitive demand level. These numbers are sobering. The gap between aspiration and delivery is structural [2, 9].

---

## 3. Two-Dimensional Content Mapping

The power of coverage mapping lies in its two-dimensional structure. A one-dimensional check (topics only) misses the depth problem. A topic can be "covered" at DOK 1 (mentioned in a list) while the assessment requires DOK 3 (analytical synthesis). The topic is technically present but functionally absent [1, 10].

### 3.1 Constructing the Grid

For the Fox Infrastructure Group document, the coverage grid maps 12 modules against four depth levels:

| Module | DOK 1 (Data) | DOK 2 (Explanation) | DOK 3 (Analysis) | DOK 4 (Synthesis) |
|--------|-------------|-------------------|-----------------|-------------------|
| M01: Energy | Present | Present | Present | Present |
| M02: Water | Present | Present | Present | Partial |
| M03: Communications | Present | Present | Present | Present |
| M04: Housing | Present | **Thin** | **Missing** | **Missing** |
| M05: Food Systems | Present | Present | Present | Partial |
| M06: Disaster Response | Present | Present | **Overloaded** | **Overloaded** |
| M07: Governance | Present | Present | Present | Present |
| M08: Education | Present | Present | Partial | Partial |
| M09: Health | Present | Present | Present | Partial |
| M10: Economy | Present | Present | Partial | Missing |
| M11: Transportation | Present | Present | Present | Partial |
| M12: Integration | Present | Present | Present | Present |

The bold entries are the gaps identified in the retrospective. M04 has data (DOK 1) but lacks the analytical depth (DOK 3-4) that per-unit cost breakdowns and application mapping would provide. M06 has excess content at DOK 3-4 because it carries two modules' worth of analysis in a single container [7, 11].

### 3.2 Heat Map Interpretation

```
COVERAGE HEAT MAP (Fox Infrastructure Group)
================================================================

         DOK1    DOK2    DOK3    DOK4
  M01    [##]    [##]    [##]    [##]     ## = Full coverage
  M02    [##]    [##]    [##]    [#-]     #- = Partial
  M03    [##]    [##]    [##]    [##]     -- = Thin/missing
  M04    [##]    [--]    [  ]    [  ]     [  ] = Absent
  M05    [##]    [##]    [##]    [#-]
  M06    [##]    [##]    [XX]    [XX]     XX = Overloaded
  M07    [##]    [##]    [##]    [##]
  M08    [##]    [##]    [#-]    [#-]
  M09    [##]    [##]    [##]    [#-]
  M10    [##]    [##]    [#-]    [  ]
  M11    [##]    [##]    [##]    [#-]
  M12    [##]    [##]    [##]    [##]

Gap-fill targets: M04 DOK2-4, M06 structural split
```

---

## 4. Building a Coverage Matrix

A coverage matrix is the working tool for gap identification. Construction follows a five-step process adapted from Porter's SEC methodology and Webb's alignment protocol [1, 2].

### 4.1 Step 1: Extract Topic Inventory

List every topic the curriculum claims to cover. For a research document, this comes from the table of contents, section headers, and scope statement.

### 4.2 Step 2: Assign Cognitive Demand Levels

For each topic, determine the target cognitive demand level from the success criteria or assessment requirements.

### 4.3 Step 3: Audit Actual Content

Read each section and classify the actual content by cognitive demand level:

| Content Type | DOK Level | Detection Heuristic |
|-------------|-----------|-------------------|
| Data tables with sources | DOK 1 | Sourced numerical data present |
| Explanatory paragraphs | DOK 2 | "This means..." or "The relationship is..." |
| Analytical comparisons | DOK 3 | Multi-factor analysis, trade-off discussion |
| Cross-domain synthesis | DOK 4 | Content from multiple modules combined into new insight |

### 4.4 Step 4: Compute Coverage Delta

```
Delta(topic, level) = Target(topic, level) - Actual(topic, level)

Where:
  Positive delta = gap (target exceeds actual)
  Zero delta = aligned
  Negative delta = over-coverage (actual exceeds target)
```

### 4.5 Step 5: Classify and Prioritize

Apply the GATE framework (Module 1) to each positive-delta cell:
- GATE: Gap blocks primary use case
- ANNOTATE: Gap reduces utility
- TAG: Gap logged for future work
- EXEMPT: Over-coverage, not a problem

---

## 5. Alignment Indices

Multiple alignment indices exist in the education research literature. Each measures a different aspect of curriculum-assessment coherence [1, 9, 12].

### 5.1 Webb's Four Alignment Criteria

| Criterion | Measures | Acceptable Threshold | FIG Score |
|-----------|---------|---------------------|-----------|
| Categorical Concurrence | Topic overlap between curriculum and assessment | >= 6 items per standard | 10/12 (83%) |
| Depth of Knowledge Consistency | DOK levels match between curriculum and assessment | >= 50% of items at or above curriculum DOK | 8/12 (67%) |
| Range of Knowledge | Breadth of content within each standard assessed | >= 50% of objectives assessed | 9/12 (75%) |
| Balance of Representation | Assessment emphasis proportional to curriculum emphasis | Index >= 0.70 | 0.74 |

### 5.2 Porter's Alignment Index

The Porter alignment index computes a single number from the full two-dimensional content map:

```
Porter Index = 1 - (SUM |p_cell - q_cell|) / 2

FIG Document:
  Intended coverage (mission spec): p vector over 48 cells (12 modules x 4 DOK)
  Enacted coverage (produced doc): q vector over 48 cells
  |p - q| sum = 0.52
  Porter Index = 1 - 0.52/2 = 0.74

Interpretation: 0.74 is above the national average for state mathematics
curricula (0.15-0.30) but below the target for a purpose-built research
document (0.85+)
```

### 5.3 Post-Gap-Fill Target

The gap-fill mission targets a Porter Index improvement from 0.74 to >= 0.85, primarily by:
- Increasing M04 from DOK 1 to DOK 3-4 (cost data + application mapping)
- Splitting M06 to eliminate the overload condition
- Adding cross-module synthesis (M06-A hazard data to M04 housing site selection)

---

## 6. Topic Coverage vs. Cognitive Demand

The most common failure in coverage analysis is checking only topic presence while ignoring cognitive demand. A curriculum that "covers" algebra by listing definitions (DOK 1) has not covered algebra at a level that enables problem-solving (DOK 3) [1, 10, 13].

### 6.1 The Depth Illusion

```
THE DEPTH ILLUSION
================================================================

  TOPIC: "Military Housing Cost Models"

  DOK 1 (Recall):     "Military, Job Corps, and construction camps
                        are three residential models."         CHECK

  DOK 2 (Concept):    "Military barracks cost $180-250K/bed to
                        build and $8-12K/bed/year to operate."  CHECK

  DOK 3 (Analysis):   "At 90 beds, modular prefab at $75K/bed
                        amortizes to $2,100/bed/year capital,
                        making total cost $12-17K/bed/year --
                        competitive with Job Corps."            MISSING

  DOK 4 (Synthesis):  "The RCI funding model (ground lease +
                        student stipend) adapts directly to
                        tribal land + scholarship structure,
                        creating FoxEdu's financial framework."  MISSING
```

The original FIG Module 04 reached DOK 1-2 for housing cost models. The gap-fill targets DOK 3-4 by adding per-unit cost breakdowns, amortization analysis, and the FoxEdu application mapping [7].

### 6.2 The Overload Illusion

Module 06's overload is the inverse problem: content at DOK 3-4 for two distinct topics bundled into a single module. The cognitive demand is correct; the organizational structure is wrong. A module carrying 484 lines of DOK 3-4 content across two domains becomes difficult to navigate even though the content quality is high.

The coverage mapping reveals this as a structural gap, not a content gap. The remediation is organizational (split), not depth-related (add more) [7, 14].

---

## 7. Coverage Mapping for Research Documents

Research documents differ from classroom curricula in several ways that affect coverage mapping methodology.

### 7.1 Differences from Classroom Curriculum

| Dimension | Classroom Curriculum | Research Document |
|-----------|---------------------|-------------------|
| Unit of measurement | Clock hours | Lines of content |
| Depth indicator | Student assessment scores | Source attribution and analysis depth |
| Coverage target | State standards | Mission specification scope |
| Feedback loop | End-of-year tests | Post-production retrospective |
| Remediation cycle | Next school year | Gap-fill mission (weeks, not months) |

### 7.2 Research Document Coverage Metrics

For GSD research documents, coverage is measured in four dimensions:

| Metric | Measurement | Target |
|--------|-------------|--------|
| Topic presence | Section header audit | 100% of claimed scope |
| Source depth | Cited sources per topic | >= 3 per major topic |
| Analytical depth | DOK level per section | >= DOK 3 for 50% of content |
| Integration | Cross-references per module | >= 2 cross-module references |

### 7.3 The Line Count Signal

Module line counts serve as a rough coverage proxy in GSD research documents:

```
MODULE LINE COUNT ANALYSIS (FIG)
================================================================

  Design target: 300-400 lines per module

  M01: 385  [====##====]     Within target
  M02: 342  [====##=== ]     Within target
  M03: 368  [====##====]     Within target
  M04: 278  [====##==  ]     BELOW target (content gap)
  M05: 356  [====##====]     Within target
  M06: 484  [====##========] ABOVE target (structural gap)
  M07: 398  [====##====]     Within target
  ...

  M04 is short because cost data was deferred.
  M06 is long because it carries two topics.
  Both are gap signals.
```

Line count alone is insufficient (a module can be 400 lines of padding), but it is a useful first-pass detection signal. Modules significantly below target warrant depth audit. Modules significantly above target warrant structural review [7].

---

## 8. The FoxEdu Infrastructure Coverage Audit

The full coverage audit for the Fox Infrastructure Group document maps all 12 modules against the mission specification's success criteria, producing the gap inventory that drives the gap-fill mission.

### 8.1 Coverage Summary

| Success Criterion | Module(s) | Pre-Gap-Fill Status | Gap-Fill Deliverable |
|-------------------|-----------|--------------------|--------------------|
| Hazard probability tables with return periods | M06 | DOK 2 (present but embedded) | M06-A: standalone risk tier document |
| Service outage timeline matrix | M06 | DOK 2 (present but embedded) | M06-A: 4-tier outage matrix |
| Pacific network topology | M06 | DOK 3 (present but embedded) | M06-B: standalone network document |
| Military housing per-unit costs | M04 | DOK 1 (models named, costs thin) | M04-A: MILCON + RCI + modular costs |
| Job Corps program statistics | M04 | DOK 1 (mentioned as precedent) | M04-B: 125-center program data |
| Industrial camp cost models | M04 | DOK 1 (referenced as option) | M04-B: 3 deployment models |
| FoxEdu application mapping | M04 | DOK 0 (absent) | M04-B: comparison table |
| Housing-disaster cross-reference | M04+M06 | DOK 0 (absent) | Synthesis Note |
| All numerics attributed | All | 85% | 100% target post-gap-fill |
| Module self-containment | M06 | Fails (interleaved content) | M06-A + M06-B verified standalone |

### 8.2 Pre/Post Comparison Target

```
COVERAGE SCORE PROJECTION
================================================================

  Metric                  Pre-GF    Post-GF    Delta
  ──────────────────────  ────────  ─────────  ──────
  Topics at DOK >= 3      67%       92%        +25%
  Source attribution       85%       100%       +15%
  Porter alignment index   0.74      0.86+      +0.12
  Modules self-contained   10/12     12/12      +2
  Cross-module refs        6         12         +6
```

---

## 9. Automated Coverage Analysis

While manual coverage mapping remains the gold standard for nuanced analysis, automated tools can accelerate the detection of simple coverage gaps [15, 16].

### 9.1 Natural Language Processing Approaches

| Method | What It Detects | Limitations |
|--------|----------------|-------------|
| Topic modeling (LDA) | Latent topics in document corpus | Cannot assess depth, only presence |
| Keyword density analysis | Frequency of key terms per section | Frequency != depth |
| Citation network analysis | Source coverage and clustering | Does not assess how sources are used |
| Section length analysis | Module line counts as coverage proxy | Padding inflates counts |
| Cross-reference extraction | Links between modules | Does not assess link quality |

### 9.2 The GSD Coverage Linter Concept

A hypothetical automated coverage tool for GSD research documents:

```
GSD COVERAGE LINTER (CONCEPTUAL)
================================================================

  Input: research/ directory + mission-spec success criteria

  Pass 1: Section header extraction
    - Map each section to a mission-spec topic
    - Flag topics with no corresponding section

  Pass 2: Source density audit
    - Count citations per section
    - Flag sections with < 3 sources per major topic

  Pass 3: Numerical claim check
    - Extract all numbers with units
    - Verify each has adjacent citation
    - Flag unattributed numerics

  Pass 4: Cross-reference check
    - Extract all internal links
    - Verify bidirectional where expected
    - Flag orphan modules (no incoming links)

  Output: coverage-report.json with gap inventory
```

### 9.3 Practical Tooling

Current GSD practice uses manual retrospective analysis rather than automated tooling. The gap-fill feedback loop (Module 1, Section 11) produces higher-quality gap identification because it includes human judgment about severity and impact. Automated tools may eventually complement but not replace retrospective analysis [15].

---

## 10. Coverage Visualization

Effective visualization of coverage data helps stakeholders understand gaps without requiring them to parse raw data tables.

### 10.1 Heat Map Visualization

The two-dimensional coverage grid renders naturally as a heat map where cell color intensity represents coverage depth:

```
COVERAGE HEAT MAP LEGEND
================================================================

  [    ] = No coverage (DOK 0)    -- White
  [  . ] = Mentioned (DOK 1)      -- Light
  [ .. ] = Explained (DOK 2)      -- Medium
  [... ] = Analyzed (DOK 3)       -- Dark
  [####] = Synthesized (DOK 4)    -- Full
  [XXXX] = Overloaded             -- Red flag
```

### 10.2 Gap Waterfall

A waterfall chart showing how coverage score changes with each gap-fill action:

```
COVERAGE WATERFALL
================================================================

  Starting score:     67% |=================>
  + M06-A (risk)      73% |===================>
  + M06-B (network)   79% |=====================>
  + M04-A (military)  83% |=======================>
  + M04-B (Job Corps) 88% |=========================>
  + Synthesis Note     92% |===========================>
  Target:             90%+ |==========================>

  Each gap-fill action's contribution is independently measurable.
```

### 10.3 Radar Chart (Department Coverage)

For multi-department analysis (College of Knowledge scale), radar charts show each department's coverage profile across DOK levels:

| Department | DOK 1 | DOK 2 | DOK 3 | DOK 4 |
|-----------|-------|-------|-------|-------|
| Mathematics | 95% | 90% | 85% | 70% |
| Infrastructure | 90% | 75% | 60% | 40% |
| Signal Processing | 95% | 90% | 85% | 75% |
| Mind-Body | 85% | 75% | 55% | 30% |
| Culinary Arts | 80% | 70% | 50% | 25% |

---

## 11. Limitations and Failure Modes

Coverage mapping is a powerful tool, but it has known limitations that practitioners must understand to avoid misuse [1, 10, 17].

### 11.1 The Completeness Fallacy

100% coverage at all DOK levels is neither achievable nor desirable. Every curriculum must make scope decisions. The question is whether those decisions are explicit (EXEMPT in the GATE framework) or accidental (GATE-level gaps) [7].

### 11.2 The Measurement Effect

Measuring coverage changes what gets covered. If modules are evaluated by line count, they get longer. If they are evaluated by source count, they accumulate citations without deeper analysis. Goodhart's Law applies: "when a measure becomes a target, it ceases to be a good measure" [18].

The FoxEdu Gap-Fill methodology mitigates this by using DOK level as the primary metric rather than raw counts. A module with 3 deeply analytical sources at DOK 3 is more valuable than one with 15 shallow mentions at DOK 1.

### 11.3 The Context Blind Spot

Coverage mapping measures what is present in the document but not whether the reader has the prerequisite knowledge to understand it. A module at DOK 3 that assumes DOK 2 knowledge not provided elsewhere creates an invisible gap -- the map shows coverage, but the learner cannot access it [13].

### 11.4 The Cross-Domain Problem

Coverage mapping works best within a single domain. Cross-domain gaps (e.g., the connection between disaster risk and housing design) are harder to detect because they span multiple topic axes. The synthesis layer in the gap-fill architecture exists specifically to address this limitation [7].

> **SAFETY WARNING:** Coverage metrics can be gamed. An organization that incentivizes high coverage scores without auditing depth will produce documents that are comprehensively shallow rather than selectively deep. The GATE framework's EXEMPT category exists to make scope limitations explicit rather than hidden [7, 17].

---

## 12. Cross-References

> **Related:** [Educational Gap Analysis](01-educational-gap-analysis.md) -- foundational gap taxonomy and GATE severity framework

> **Related:** [Remedial Content Generation](03-remedial-content-generation.md) -- how coverage gaps become content production tasks

> **Related:** [Skill Assessment Frameworks](05-skill-assessment-frameworks.md) -- assessment alignment with curriculum coverage

> **Related:** [COK](../COK/index.html) -- College of Knowledge multi-department coverage analysis

> **Related:** [SVB](../SVB/index.html) -- FoxEdu infrastructure context for Module 04 coverage

> **Related:** [BNY](../BNY/index.html) -- Science communication depth vs. breadth trade-offs

> **Related:** [OTM](../OTM/index.html) -- Optimization frameworks for gap prioritization

> **Related:** [SGM](../SGM/index.html) -- Institutional governance of curriculum review

---

## 13. Sources

1. Webb, N. L. (1997). *Criteria for Alignment of Expectations and Assessments in Mathematics and Science Education.* Council of Chief State School Officers, Research Monograph No. 6.
2. Porter, A. C. (2002). "Measuring the Content of Instruction: Uses in Research and Practice." *Educational Researcher*, 31(7), 3-14.
3. Goodlad, J. I. (1979). *Curriculum Inquiry: The Study of Curriculum Practice.* McGraw-Hill.
4. National Center for Education Statistics. (2023). *NAEP Report Card: Mathematics and Science.* U.S. Department of Education.
5. Higher Learning Commission. (2020). *Criteria for Accreditation and Core Components.* HLC Policy Manual.
6. National Council of Examiners for Engineering and Surveying. (2022). *FE Exam Specifications.* NCEES.
7. Fox Infrastructure Group. (2026). *FoxEdu Gap-Fill Research Mission -- Module 04 & 06 Expansion.* GSD Mission Package.
8. Porter, A. C., & Smithson, J. L. (2001). "Defining, Developing, and Using Curriculum Indicators." *CPRE Research Report Series.* University of Pennsylvania.
9. Gamoran, A., Porter, A. C., Smithson, J., & White, P. A. (1997). "Upgrading High School Mathematics Instruction." *Educational Evaluation and Policy Analysis*, 19(4), 325-338.
10. Anderson, L. W., & Krathwohl, D. R. (Eds.). (2001). *A Taxonomy for Learning, Teaching, and Assessing: A Revision of Bloom's Taxonomy of Educational Objectives.* Longman.
11. Remillard, J. T. (2005). "Examining Key Concepts in Research on Teachers' Use of Mathematics Curricula." *Review of Educational Research*, 75(2), 211-246.
12. Martone, A., & Sireci, S. G. (2009). "Evaluating Alignment Between Curriculum, Assessment, and Instruction." *Review of Educational Research*, 79(4), 1332-1361.
13. Schwartz, D. L., Tsang, J. M., & Blair, K. P. (2016). *The ABCs of How We Learn.* W. W. Norton.
14. Leithwood, K., & Earl, L. (2000). "Educational Accountability Effects: An International Perspective." *Peabody Journal of Education*, 75(4), 1-18.
15. Sherin, M. G., & Drake, C. (2009). "Curriculum Strategy Framework." *Journal of Curriculum Studies*, 41(4), 467-500.
16. Blei, D. M., Ng, A. Y., & Jordan, M. I. (2003). "Latent Dirichlet Allocation." *Journal of Machine Learning Research*, 3, 993-1022.
17. Fullan, M. (2007). *The New Meaning of Educational Change (4th Edition).* Teachers College Press.
18. Strathern, M. (1997). "'Improving Ratings': Audit in the British University System." *European Review*, 5(3), 305-321.
