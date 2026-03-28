# Adaptive Learning Paths

> **Domain:** Education Technology & Personalized Learning
> **Module:** 4 -- Dynamic Curriculum Sequencing from Gap Data
> **Through-line:** *Two learners enter the same program. One already knows housing economics but has never seen a seismology table. The other can read a hazard probability matrix in their sleep but has never calculated amortization. Teaching them the same sequence in the same order wastes both their time. Adaptive learning paths use gap data to route each learner through exactly the content they need, in the order that builds understanding most efficiently.*

---

## Table of Contents

1. [The Sequencing Problem](#1-the-sequencing-problem)
2. [Foundations of Adaptive Learning](#2-foundations-of-adaptive-learning)
3. [Knowledge Space Theory](#3-knowledge-space-theory)
4. [Prerequisite Graphs](#4-prerequisite-graphs)
5. [Mastery-Based Progression](#5-mastery-based-progression)
6. [Gap-Informed Path Construction](#6-gap-informed-path-construction)
7. [The FoxEdu Adaptive Architecture](#7-the-foxedu-adaptive-architecture)
8. [Bayesian Knowledge Tracing](#8-bayesian-knowledge-tracing)
9. [Content Sequencing Algorithms](#9-content-sequencing-algorithms)
10. [Implementation Patterns](#10-implementation-patterns)
11. [Evaluation and Effectiveness](#11-evaluation-and-effectiveness)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. The Sequencing Problem

Curriculum sequencing -- determining what content to present and in what order -- is one of the oldest problems in education. Comenius addressed it in *Didactica Magna* (1657). Bruner formalized it as the "spiral curriculum" (1960). Computer-assisted instruction automated it starting with Skinner's teaching machines (1958) and continuing through modern intelligent tutoring systems [1, 2, 3].

The core tension: linear sequences are simple to implement but waste time for learners who already know some of the material. Fully personalized sequences are maximally efficient but require detailed models of each learner's current knowledge state [4].

```
THE SEQUENCING SPECTRUM
================================================================

  LINEAR                     BRANCHING                 FULLY ADAPTIVE
  ──────                     ────────                  ──────────────
  Same path for all          Preset branch points      Unique path per learner
  No assessment needed       Pre-test at branches      Continuous assessment
  Simple to build            Moderate complexity        Complex to build
  Wastes learner time        Better but rigid           Maximally efficient
  Example: textbook          Example: placement test    Example: ITS/KST
```

For the FoxEdu Gap-Fill context, the adaptive learning question is: given a learner who needs to understand FoxEdu campus planning, how does the system determine which of the four gap-fill modules (M06-A, M06-B, M04-A, M04-B) to present first, and how does it know when the learner is ready for the synthesis layer? [5]

---

## 2. Foundations of Adaptive Learning

Adaptive learning has three theoretical foundations, each contributing different capabilities to modern implementations [4, 6].

### 2.1 Behaviorist Foundation (Skinner, 1958)

Programmed instruction breaks content into small frames, presents them in sequence, and requires the learner to respond correctly before advancing. The adaptation is minimal -- it controls pace but not path.

**Contribution to modern systems:** The concept of mastery before progression. A learner who cannot correctly identify hazard return periods should not be asked to perform site selection analysis that depends on those return periods [3].

### 2.2 Cognitive Foundation (Anderson, 1983)

John Anderson's ACT-R theory models learning as the acquisition and strengthening of production rules (if-then knowledge structures). Cognitive tutors based on ACT-R track which production rules the learner has acquired and which they are still developing [7].

**Contribution to modern systems:** Fine-grained knowledge component tracking. Rather than marking "Module M06-A" as learned or not, the system tracks individual knowledge components: "can read probability tables," "understands return periods," "can apply NIMS tier framework" [7, 8].

### 2.3 Constructivist Foundation (Vygotsky, 1978)

Vygotsky's Zone of Proximal Development (ZPD) theory holds that optimal learning occurs when content is just beyond the learner's current independent capability but within reach with guidance. Content that is too easy (already mastered) or too hard (no scaffolding exists) produces minimal learning [9].

**Contribution to modern systems:** The concept of "optimal difficulty." The adaptive path should present content that is challenging but achievable given the learner's current knowledge state. This requires accurate knowledge modeling -- presenting M04-B (Job Corps cost analysis) to a learner who hasn't yet grasped basic amortization concepts from M04-A will produce frustration, not learning.

---

## 3. Knowledge Space Theory

Knowledge Space Theory (KST), developed by Doignon and Falmagne (1985, 1999), provides the mathematical foundation for adaptive learning path construction. KST models a curriculum as a partially ordered set of knowledge states, where each state represents a distinct combination of mastered concepts [10, 11].

### 3.1 Core Concepts

| Term | Definition | FoxEdu Example |
|------|-----------|----------------|
| Knowledge domain | Set of all concepts in the curriculum | {hazard-prob, outage-tiers, network-topology, mesh-comm, milcon-costs, rci-model, modular-housing, jobcorps-data, camp-models, site-selection, foxedu-mapping} |
| Knowledge state | Subset of domain mastered by a learner | {hazard-prob, outage-tiers, milcon-costs} |
| Knowledge space | Set of all feasible knowledge states | All valid combinations respecting prerequisites |
| Learning path | Sequence of states from empty to complete | One valid traversal through the knowledge space |

### 3.2 Feasibility Constraints

Not all subsets of the knowledge domain are valid knowledge states. Prerequisites create feasibility constraints:

```
PREREQUISITE GRAPH (FoxEdu Gap-Fill)
================================================================

  hazard-prob ────────> outage-tiers ────────> site-selection
       |                                            ^
       v                                            |
  network-topology ──> mesh-comm                    |
       |                                            |
       +──────────────> energy-resilience ──────────+
                                                    |
  milcon-costs ───────> rci-model                   |
       |                    |                       |
       v                    v                       |
  modular-housing ────> foxedu-mapping <────────────+
       |                    ^
       v                    |
  jobcorps-data ───────>    |
       |                    |
       v                    |
  camp-models ─────────>    +
```

A learner cannot be in a state where they know `site-selection` without knowing `hazard-prob` -- the former depends on the latter. KST formalizes these constraints into the knowledge space structure [10].

### 3.3 The ALEKS Implementation

ALEKS (Assessment and LEarning in Knowledge Spaces), developed by Falmagne and colleagues, is the most widely deployed KST-based adaptive system. Serving 30+ million students across mathematics, science, and business courses, ALEKS demonstrates that KST-based adaptation produces measurable learning gains compared to non-adaptive alternatives [12].

| ALEKS Metric | Value | Source |
|-------------|-------|--------|
| Students served (cumulative) | 30+ million | McGraw-Hill Education, 2023 |
| Knowledge states per course | 5,000-15,000 | Falmagne et al., 2013 |
| Assessment accuracy (knowledge state) | ~90% | Falmagne et al., 2006 |
| Learning gain vs. traditional instruction | 0.3-0.5 standard deviations | Craig et al., 2013 |
| Assessment items per state estimation | 15-25 | Doignon & Falmagne, 1999 |

---

## 4. Prerequisite Graphs

Prerequisite graphs are the practical tool for implementing adaptive sequencing. They encode which concepts must be mastered before others can be meaningfully presented [4, 10, 13].

### 4.1 Constructing a Prerequisite Graph

For the FoxEdu Gap-Fill curriculum:

| Concept | Prerequisites | Rationale |
|---------|--------------|-----------|
| hazard-prob | None | Entry point: understanding probability tables |
| outage-tiers | hazard-prob | Outage timelines reference specific hazard scenarios |
| network-topology | None | Entry point: Pacific Intertie structure |
| mesh-comm | network-topology | Mesh design references underlying grid structure |
| energy-resilience | network-topology | Grand Coulee anchor role requires grid context |
| milcon-costs | None | Entry point: military cost model data |
| rci-model | milcon-costs | RCI is a variant of standard MILCON |
| modular-housing | milcon-costs | Modular costs compared against standard barracks |
| jobcorps-data | None | Entry point: DOL program statistics |
| camp-models | None | Entry point: industrial camp cost data |
| foxedu-mapping | milcon-costs, jobcorps-data, camp-models | Requires all three housing models |
| site-selection | hazard-prob, energy-resilience, foxedu-mapping | Synthesis of disaster + housing data |

### 4.2 Topological Sort and Valid Paths

The prerequisite graph admits multiple valid learning paths. A topological sort produces any valid linear ordering:

```
VALID LEARNING PATHS (examples)
================================================================

  Path 1 (disaster-first):
    hazard-prob > outage-tiers > network-topology > mesh-comm >
    energy-resilience > milcon-costs > rci-model > modular-housing >
    jobcorps-data > camp-models > foxedu-mapping > site-selection

  Path 2 (housing-first):
    milcon-costs > rci-model > modular-housing > jobcorps-data >
    camp-models > hazard-prob > outage-tiers > network-topology >
    mesh-comm > energy-resilience > foxedu-mapping > site-selection

  Path 3 (interleaved):
    hazard-prob > milcon-costs > network-topology > jobcorps-data >
    outage-tiers > rci-model > camp-models > mesh-comm >
    modular-housing > energy-resilience > foxedu-mapping > site-selection
```

The adaptive system selects among valid paths based on the learner's current knowledge state and learning preferences [10].

### 4.3 Critical Path Analysis

The longest prerequisite chain determines the minimum learning path length:

```
CRITICAL PATH
================================================================

  network-topology > energy-resilience > site-selection
       (3 steps from entry to synthesis)

  milcon-costs > foxedu-mapping > site-selection
       (3 steps from entry to synthesis)

  Minimum path to full mastery: max(all chains) = 4 steps
  (hazard-prob > energy-resilience requires network-topology,
   so the full critical path is 4 concepts long)
```

---

## 5. Mastery-Based Progression

Mastery-based progression gates advancement on demonstrated competence rather than time-in-seat. Bloom's Learning for Mastery model (1968) established that 90-95% of students can achieve mastery given sufficient time and appropriate instruction -- the constraint is not ability but pacing [14, 15].

### 5.1 Mastery Criteria for FoxEdu Modules

| Module | Mastery Evidence | DOK Level Required |
|--------|-----------------|-------------------|
| M06-A concepts | Can read and interpret hazard probability tables; can identify NIMS tier for a given scenario | DOK 2 |
| M06-B concepts | Can describe Pacific Intertie topology; can explain Grand Coulee anchor role | DOK 2 |
| M04-A concepts | Can compare cost models; can calculate per-bed amortization | DOK 3 |
| M04-B concepts | Can evaluate Job Corps as FoxEdu precedent; can apply ANSI standards | DOK 3 |
| Synthesis | Can select housing site based on hazard data; can produce FoxEdu mapping | DOK 4 |

### 5.2 Assessment for Mastery

Mastery assessment uses performance tasks rather than recognition tests. A learner demonstrates mastery of M04-A by calculating a per-bed amortization from provided cost data, not by selecting the correct amortization from multiple choices [15, 16].

```
MASTERY ASSESSMENT EXAMPLE -- M04-A
================================================================

  Given:
    Modular prefab barracks: $75,000 build cost per bed
    Design life: 35 years
    Annual operating cost: $10,000 per bed

  Task:
    1. Calculate annualized capital cost per bed
    2. Calculate total annual cost per bed (capital + operating)
    3. Compare to Job Corps residential cost ($13,000-$18,000/year)
    4. State whether FoxEdu's target of $10,000-$15,000/year is feasible

  Mastery threshold:
    Steps 1-2: Correct calculation (DOK 2)
    Steps 3-4: Valid comparison with reasoning (DOK 3)
```

### 5.3 Mastery vs. Time-Based Progression

| Dimension | Time-Based | Mastery-Based |
|-----------|-----------|---------------|
| Advancement criterion | Complete hours/sessions | Demonstrate competence |
| Pacing | Fixed for all | Varies by learner |
| Gap handling | Gaps persist to next level | Gaps must be closed before advancement |
| Efficiency | Wastes time for fast learners | Efficient for all |
| Measurement | Attendance | Performance tasks |

---

## 6. Gap-Informed Path Construction

The FoxEdu Gap-Fill methodology connects gap analysis (Module 1) and coverage mapping (Module 2) to adaptive path construction. A learner's current knowledge state, assessed through diagnostic testing, determines which modules they need and in what order [4, 10, 17].

### 6.1 Diagnostic Assessment

Before constructing a learning path, the system assesses the learner's current knowledge state across the concept domain:

| Concept | Assessment Method | Time |
|---------|------------------|------|
| hazard-prob | Read probability table, answer interpretation questions | 5 min |
| outage-tiers | Match scenarios to NIMS tiers | 3 min |
| milcon-costs | Identify cost components from data | 5 min |
| amortization | Calculate from given values | 3 min |
| jobcorps-data | Interpret program statistics | 5 min |

Total diagnostic: ~25 minutes for 12 concepts. This is the ALEKS model adapted to the FoxEdu domain [12].

### 6.2 Path Construction Algorithm

```
GAP-INFORMED PATH CONSTRUCTION
================================================================

  Input: learner_knowledge_state (set of mastered concepts)
  Input: target_state (all concepts including synthesis)
  Input: prerequisite_graph

  1. gap = target_state - learner_knowledge_state
  2. Sort gap concepts by prerequisite depth (shallowest first)
  3. For each concept in sorted gap:
       a. Check all prerequisites are in learner_knowledge_state
       b. If yes: add to learning path
       c. If no: recursively add missing prerequisites first
  4. Return ordered learning path

  Example:
    Learner knows: {hazard-prob, milcon-costs, jobcorps-data}
    Target: all 12 concepts
    Gap: {outage-tiers, network-topology, mesh-comm, energy-resilience,
          rci-model, modular-housing, camp-models, foxedu-mapping,
          site-selection}

    Sorted path: outage-tiers > network-topology > mesh-comm >
                 energy-resilience > rci-model > modular-housing >
                 camp-models > foxedu-mapping > site-selection
```

### 6.3 Path Length as Efficiency Metric

```
PATH EFFICIENCY
================================================================

  Full curriculum (no prior knowledge):  12 concepts
  Average assessed learner:              8 concepts (33% reduction)
  Best case (strong background):         4 concepts (67% reduction)
  Worst case (no prior knowledge):       12 concepts (0% reduction)

  The adaptive path saves time proportional to prior knowledge.
```

---

## 7. The FoxEdu Adaptive Architecture

For the FoxEdu residential learning community, the adaptive architecture extends beyond individual module sequencing to whole-program design [5, 18].

### 7.1 Program-Level Adaptation

| Layer | What Adapts | Based On |
|-------|-----------|----------|
| Module selection | Which of the 4 gap-fill modules to include | Diagnostic assessment |
| Module sequencing | Order of selected modules | Prerequisite graph + learner preference |
| Within-module pacing | Speed through sections | Mastery assessment at section boundaries |
| Cross-module synthesis | When to present synthesis layer | Mastery of all prerequisite modules |
| Assessment depth | DOK level of assessment items | Learner's demonstrated DOK capability |

### 7.2 Residential Context Advantages

A residential learning community has advantages for adaptive learning that non-residential programs lack:

| Advantage | Mechanism | Impact on Adaptation |
|-----------|----------|---------------------|
| Continuous availability | Learners on-site 24/7 | Can study during optimal personal hours |
| Peer learning | Co-located learners at similar levels | Natural study groups form around gap clusters |
| Mentor access | On-site instructors/mentors | Immediate help when stuck on prerequisite |
| Immersive environment | No competing time demands | Faster progression through learning paths |
| Community accountability | Visible progress to peers | Social motivation to close gaps |

### 7.3 Integration with Gap-Fill Content

The four FoxEdu gap-fill modules (M06-A, M06-B, M04-A, M04-B) plus the synthesis note form a self-contained adaptive learning unit. The prerequisite graph defines valid paths; diagnostic assessment identifies each learner's starting state; mastery gates control progression; the synthesis layer verifies integration [5].

---

## 8. Bayesian Knowledge Tracing

Bayesian Knowledge Tracing (BKT), introduced by Corbett and Anderson (1994), is the most widely used probabilistic model for tracking student knowledge in adaptive systems [19].

### 8.1 The BKT Model

BKT models each knowledge component as a binary latent variable (known/unknown) with four parameters:

| Parameter | Symbol | Meaning | Typical Range |
|-----------|--------|---------|---------------|
| Prior knowledge | P(L0) | Probability learner already knows the concept | 0.01-0.30 |
| Learn rate | P(T) | Probability of learning on each opportunity | 0.05-0.30 |
| Slip rate | P(S) | Probability of incorrect response despite knowing | 0.01-0.20 |
| Guess rate | P(G) | Probability of correct response despite not knowing | 0.10-0.30 |

### 8.2 Update Rules

After each learner response (correct/incorrect), BKT updates the knowledge probability:

```
BKT UPDATE
================================================================

  If response is correct:
    P(L|correct) = P(L) * (1 - P(S)) / [P(L) * (1 - P(S)) + (1-P(L)) * P(G)]

  If response is incorrect:
    P(L|incorrect) = P(L) * P(S) / [P(L) * P(S) + (1-P(L)) * (1 - P(G))]

  Then apply learning:
    P(L_new) = P(L|evidence) + (1 - P(L|evidence)) * P(T)

  Mastery threshold: P(L) >= 0.95
```

### 8.3 BKT Application to FoxEdu Concepts

| Concept | P(L0) | P(T) | P(S) | P(G) | Rationale |
|---------|-------|------|------|------|-----------|
| hazard-prob | 0.10 | 0.20 | 0.05 | 0.15 | Some prior exposure likely; low slip |
| milcon-costs | 0.05 | 0.15 | 0.10 | 0.20 | Specialized knowledge; moderate guess |
| amortization | 0.15 | 0.25 | 0.05 | 0.10 | Basic math skill; transfers from other domains |
| site-selection | 0.02 | 0.10 | 0.15 | 0.25 | Complex synthesis; high slip and guess rates |

---

## 9. Content Sequencing Algorithms

Beyond prerequisite-based ordering, several algorithms optimize content sequence for learning efficiency [4, 13, 20].

### 9.1 Spaced Repetition

Ebbinghaus's forgetting curve (1885) shows that retention decays exponentially without review. Spaced repetition algorithms (SM-2, SuperMemo, Anki) schedule review at increasing intervals based on demonstrated retention strength [21].

For FoxEdu modules: after a learner masters M04-A cost models, the system schedules review items at 1-day, 3-day, 7-day, and 14-day intervals before the synthesis layer.

### 9.2 Interleaving

Interleaving -- mixing practice across different concepts rather than blocking practice on one concept -- has been shown to improve learning in mathematics and science (Rohrer & Taylor, 2007) [22].

For FoxEdu: rather than completing all M06 content before starting M04, the interleaved path alternates: M06-A concepts, then M04-A concepts, then M06-B concepts, then M04-B concepts. This builds cross-domain connections before the explicit synthesis layer.

### 9.3 Desirable Difficulty

Bjork's desirable difficulty framework (1994) holds that learning conditions that make initial performance harder often produce better long-term retention. Applied to adaptive paths: the system should not always present the easiest next concept, but sometimes present a slightly harder one to promote deeper processing [23].

```
SEQUENCING ALGORITHM COMPARISON
================================================================

  Algorithm          Optimizes For        Risk
  ─────────          ─────────────        ────
  Prerequisite-first Safety (no failures)  May be too easy early on
  Spaced repetition  Long-term retention   Adds review overhead
  Interleaving       Cross-domain transfer May confuse early learners
  Desirable difficulty Deep processing     May frustrate struggling learners

  FoxEdu recommendation: prerequisite-first for foundational concepts,
  interleaving for mid-level concepts, spaced repetition for synthesis.
```

---

## 10. Implementation Patterns

Practical implementation of adaptive learning paths in educational software follows established patterns [4, 17, 24].

### 10.1 Technology Stack Considerations

| Component | Options | FoxEdu Recommendation |
|-----------|---------|----------------------|
| Knowledge model | BKT, KST, Item Response Theory | KST for concept-level; BKT for item-level |
| Content management | LMS, custom CMS, static files | GSD research module format (markdown) |
| Assessment engine | Embedded quizzes, performance tasks | Performance tasks aligned to DOK levels |
| Sequencing engine | Rule-based, ML-based, hybrid | Rule-based prerequisite graph + BKT overlay |
| Data storage | LRS (xAPI), database | xAPI Learning Record Store |

### 10.2 The xAPI Standard

Experience API (xAPI, formerly Tin Can API) provides a standard format for recording learning experiences. Each experience is a statement: Actor-Verb-Object [25].

```
xAPI STATEMENT EXAMPLE
================================================================

  {
    "actor": { "name": "learner-42" },
    "verb": { "id": "mastered", "display": "demonstrated mastery of" },
    "object": { "id": "feg:m04a:amortization", "name": "Amortization calculation" },
    "result": { "score": { "scaled": 0.95 }, "success": true },
    "context": { "extensions": { "dok-level": 3, "attempt": 2 } }
  }
```

### 10.3 Offline-Capable Architecture

FoxEdu's residential context may include limited or intermittent internet connectivity (especially in the Columbia Basin). The adaptive system must function offline:

- Prerequisite graph and content stored locally
- BKT parameters stored locally per learner
- Assessment and scoring run client-side
- Sync to central LRS when connectivity available
- No dependency on cloud services for core learning path

---

## 11. Evaluation and Effectiveness

Adaptive learning systems must be evaluated on learning outcomes, not just engagement metrics [4, 17, 26].

### 11.1 Evaluation Framework

| Metric | Measurement | Target |
|--------|-------------|--------|
| Learning gain | Pre-test vs. post-test on concept mastery | >= 0.4 standard deviations vs. non-adaptive |
| Time efficiency | Hours to mastery vs. linear sequence | >= 25% reduction for median learner |
| Retention | 30-day delayed post-test | >= 80% of post-test score retained |
| Completion rate | Proportion reaching synthesis mastery | >= 85% of enrolled learners |
| Learner satisfaction | Survey on perceived relevance and pacing | >= 4.0/5.0 |

### 11.2 Meta-Analysis Evidence

Kulik and Fletcher's meta-analysis (2016) of 50 intelligent tutoring system studies found a mean effect size of 0.66 standard deviations for adaptive systems compared to conventional instruction. This is a "medium to large" effect in educational research, comparable to the benefit of one-on-one tutoring (Bloom, 1984) [27, 28].

| Study | N | Effect Size | System Type |
|-------|---|-------------|-------------|
| Kulik & Fletcher (2016) | 50 studies | 0.66 | ITS meta-analysis |
| VanLehn (2011) | 20 studies | 0.76 | Step-level tutoring |
| Steenbergen-Hu & Cooper (2013) | 26 studies | 0.37 | ITS in K-12 |
| Craig et al. (2013) | 3 studies | 0.45 | ALEKS (KST-based) |

> **SAFETY NOTE:** Effect sizes from controlled studies may not transfer directly to FoxEdu's residential context, which differs from typical classroom settings. The residential model's 24/7 access and peer learning effects are not captured in existing meta-analyses. Evaluation should include FoxEdu-specific data collection from the first cohort [17].

---

## 12. Cross-References

> **Related:** [Educational Gap Analysis](01-educational-gap-analysis.md) -- gap identification that drives adaptive path construction

> **Related:** [Curriculum Coverage Mapping](02-curriculum-coverage-mapping.md) -- coverage data used to initialize knowledge state assessment

> **Related:** [Remedial Content Generation](03-remedial-content-generation.md) -- content production that fills the gaps paths route through

> **Related:** [Skill Assessment Frameworks](05-skill-assessment-frameworks.md) -- assessment instruments used at mastery gates

> **Related:** [COK](../COK/index.html) -- College of Knowledge department-level learning paths

> **Related:** [OTM](../OTM/index.html) -- Optimization algorithms for path efficiency

> **Related:** [MPC](../MPC/index.html) -- Math co-processor for BKT parameter estimation

> **Related:** [ACE](../ACE/index.html) -- Compute engine for adaptive system deployment

---

## 13. Sources

1. Comenius, J. A. (1657). *Didactica Magna (The Great Didactic).* Translated by M. W. Keatinge (1896).
2. Bruner, J. S. (1960). *The Process of Education.* Harvard University Press.
3. Skinner, B. F. (1958). "Teaching Machines." *Science*, 128(3330), 969-977.
4. Sottilare, R. A., Graesser, A., Hu, X., & Holden, H. (Eds.). (2013). *Design Recommendations for Intelligent Tutoring Systems, Volume 1: Learner Modeling.* U.S. Army Research Laboratory.
5. Fox Infrastructure Group. (2026). *FoxEdu Gap-Fill Research Mission.* GSD Mission Package.
6. National Academies of Sciences, Engineering, and Medicine. (2018). *How People Learn II: Learners, Contexts, and Cultures.* National Academies Press.
7. Anderson, J. R. (1983). *The Architecture of Cognition.* Harvard University Press.
8. Koedinger, K. R., Corbett, A. T., & Perfetti, C. (2012). "The Knowledge-Learning-Instruction Framework." *Cognitive Science*, 36(5), 757-798.
9. Vygotsky, L. S. (1978). *Mind in Society: The Development of Higher Psychological Processes.* Harvard University Press.
10. Doignon, J.-P., & Falmagne, J.-C. (1999). *Knowledge Spaces.* Springer-Verlag.
11. Doignon, J.-P., & Falmagne, J.-C. (1985). "Spaces for the Assessment of Knowledge." *International Journal of Man-Machine Studies*, 23(2), 175-196.
12. Falmagne, J.-C., Cosyn, E., Doignon, J.-P., & Thiery, N. (2006). "The Assessment of Knowledge, in Theory and in Practice." *Formal Concept Analysis*, 61-79. Springer.
13. VanLehn, K. (2006). "The Behavior of Tutoring Systems." *International Journal of Artificial Intelligence in Education*, 16(3), 227-265.
14. Bloom, B. S. (1968). "Learning for Mastery." *Evaluation Comment*, 1(2), 1-12.
15. Bloom, B. S. (1984). "The 2 Sigma Problem: The Search for Methods of Group Instruction as Effective as One-to-One Tutoring." *Educational Researcher*, 13(6), 4-16.
16. Anderson, L. W., & Krathwohl, D. R. (Eds.). (2001). *A Taxonomy for Learning, Teaching, and Assessing.* Longman.
17. U.S. Department of Education. (2010). *Evaluation of Evidence-Based Practices in Online Learning: A Meta-Analysis and Review of Online Learning Studies.* Office of Planning, Evaluation, and Policy Development.
18. Tinto, V. (1993). *Leaving College: Rethinking the Causes and Cures of Student Attrition (2nd Edition).* University of Chicago Press.
19. Corbett, A. T., & Anderson, J. R. (1994). "Knowledge Tracing: Modeling the Acquisition of Procedural Knowledge." *User Modeling and User-Adapted Interaction*, 4(4), 253-278.
20. Desmarais, M. C., & Baker, R. S. J. d. (2012). "A Review of Recent Advances in Learner and Skill Modeling in Intelligent Learning Environments." *User Modeling and User-Adapted Interaction*, 22(1-2), 9-38.
21. Ebbinghaus, H. (1885). *Uber das Gedachtnis (Memory: A Contribution to Experimental Psychology).* Translated by H. A. Ruger & C. E. Bussenius (1913). Teachers College, Columbia University.
22. Rohrer, D., & Taylor, K. (2007). "The Shuffling of Mathematics Problems Improves Learning." *Instructional Science*, 35(6), 481-498.
23. Bjork, R. A. (1994). "Memory and Metamemory Considerations in the Training of Human Beings." In J. Metcalfe & A. Shimamura (Eds.), *Metacognition: Knowing About Knowing* (pp. 185-205). MIT Press.
24. Nkambou, R., Bourdeau, J., & Mizoguchi, R. (Eds.). (2010). *Advances in Intelligent Tutoring Systems.* Springer.
25. Advanced Distributed Learning. (2013). *Experience API (xAPI) Specification, Version 1.0.* ADL Initiative.
26. VanLehn, K. (2011). "The Relative Effectiveness of Human Tutoring, Intelligent Tutoring Systems, and Other Tutoring Systems." *Educational Psychologist*, 46(4), 197-221.
27. Kulik, J. A., & Fletcher, J. D. (2016). "Effectiveness of Intelligent Tutoring Systems: A Meta-Analytic Review." *Review of Educational Research*, 86(1), 42-78.
28. Steenbergen-Hu, S., & Cooper, H. (2013). "A Meta-Analysis of the Effectiveness of Intelligent Tutoring Systems on K-12 Students' Mathematical Learning." *Journal of Educational Psychology*, 105(4), 970-987.
