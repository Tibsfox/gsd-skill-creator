# Cohesion and Coupling Analysis

> **Domain:** Structural Analysis & Module Architecture
> **Module:** 3 -- Measuring Internal Relatedness and External Dependencies
> **Through-line:** *Cohesion asks: does every part of this module serve the same question? Coupling asks: how many other modules must change if this one changes?* High cohesion within modules and loose coupling between them is the architectural goal. Module 05 had low cohesion (two analytical frames fused) and tight coupling to two different cluster contexts (music industry and community heritage). The split resolved both problems simultaneously.

---

## Table of Contents

1. [Cohesion and Coupling Defined](#1-cohesion-and-coupling-defined)
2. [Types of Cohesion in Research Modules](#2-types-of-cohesion-in-research-modules)
3. [Measuring Cohesion: The Section-Question Matrix](#3-measuring-cohesion-the-section-question-matrix)
4. [Coupling Types Between Research Modules](#4-coupling-types-between-research-modules)
5. [The Cohesion-Coupling Tradeoff](#5-the-cohesion-coupling-tradeoff)
6. [Module 05 Cohesion Analysis: Before and After](#6-module-05-cohesion-analysis-before-and-after)
7. [Coupling Metrics for the Split](#7-coupling-metrics-for-the-split)
8. [Cluster Alignment](#8-cluster-alignment)
9. [Information Flow Analysis](#9-information-flow-analysis)
10. [The LCOM Metric Adapted for Research](#10-the-lcom-metric-adapted-for-research)
11. [Architectural Smells in Module Design](#11-architectural-smells-in-module-design)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. Cohesion and Coupling Defined

Cohesion and coupling are the foundational metrics for evaluating module architecture. They originated in software engineering (Yourdon and Constantine, 1979) but apply directly to any modular system, including research documentation [1].

**Cohesion** measures how strongly related the elements within a module are to each other and to the module's central purpose. High cohesion means every section of the module serves the same analytical question. Low cohesion means sections serve different questions that happen to share a container [2].

**Coupling** measures the degree of interdependence between modules. Loose coupling means modules can be understood, modified, and validated independently. Tight coupling means changes in one module propagate to others [3].

```
COHESION-COUPLING QUADRANT
================================================================

                    HIGH COHESION
                         |
            IDEAL        |        GOOD
        (loose coupling, |  (tight coupling,
         high cohesion)  |   high cohesion)
                         |
  LOOSE COUPLING --------+-------- TIGHT COUPLING
                         |
          WORST          |        POOR
      (loose coupling,   |  (tight coupling,
       low cohesion)     |   low cohesion)
                         |
                    LOW COHESION

  Module 05 (pre-split):  LOW COHESION + TIGHT COUPLING (worst)
  Module 05a (post-split): HIGH COHESION + LOOSE COUPLING (ideal)
  Module 05b (post-split): HIGH COHESION + LOOSE COUPLING (ideal)
```

The architectural goal is always the upper-left quadrant: high cohesion within each module, loose coupling between modules. Module 05 before the split was in the lower-right quadrant. After the split, both 05a and 05b move to the upper-left [4].

> **Related:** [When and Why to Split](01-when-and-why-to-split.md) for the split motivation, [Module Sizing Principles](02-module-sizing-principles.md) for quantitative sizing

---

## 2. Types of Cohesion in Research Modules

Yourdon and Constantine identified seven types of cohesion, ranked from worst to best. Adapting their taxonomy to research modules [5]:

### Coincidental Cohesion (Worst)

Sections are grouped because they were written at the same time or by the same author, not because they share an analytical frame. Example: a module about "things that happened in Seattle in 1989" -- the Gold Party, the Loma Prieta earthquake response, and the Kingdome renovation.

### Logical Cohesion

Sections share a broad category but perform different analytical operations. Example: "Northwest cultural institutions" covering MOHAI (archival), NastyMix Records (business), and the Pike Place Market (economic geography). Same region, different questions [6].

### Temporal Cohesion

Sections are grouped because they share a time period. Module 05's original design had elements of temporal cohesion: the NastyMix label (1985-1992) and the Central District gentrification arc (1970s-2020) overlapped in time, which created the illusion of analytical unity [7].

### Procedural Cohesion

Sections follow a fixed sequence (step 1, step 2, step 3) that the module is designed to execute in order. Research modules rarely exhibit procedural cohesion because research findings don't follow a fixed execution path [8].

### Communicational Cohesion

Sections operate on the same data but perform different analyses. A module about "Census data for the Central District" where one section maps demographics and another section maps housing values uses the same data source but asks different questions. This is often acceptable but can be a split signal if the questions diverge significantly [9].

### Sequential Cohesion

The output of one section serves as the input to the next. Example: a module where Section 1 establishes the founding of a label, Section 2 analyzes the roster enabled by that founding, and Section 3 traces the business arc resulting from that roster. Module 05a after the split has strong sequential cohesion [10].

### Functional Cohesion (Best)

Every section contributes to a single, well-defined analytical purpose. The module answers one question, every section helps answer it, and removing any section would leave the answer incomplete. Both Module 05a and Module 05b after the split achieve functional cohesion [11].

```
COHESION TYPE LADDER (worst to best)
================================================================

  1. COINCIDENTAL  -- random grouping
  2. LOGICAL       -- broad category match
  3. TEMPORAL      -- same time period          <-- Module 05 pre-split
  4. PROCEDURAL    -- fixed sequence
  5. COMMUNICATIONAL -- same data, different analyses
  6. SEQUENTIAL    -- output feeds next input   <-- Module 05a post-split
  7. FUNCTIONAL    -- single purpose, all parts essential  <-- Target
```

> **Related:** [GSD2](../GSD2/index.html) for architectural cohesion principles, [CDL](../CDL/index.html) for deep linking cohesion

---

## 3. Measuring Cohesion: The Section-Question Matrix

The Section-Question Matrix is a practical tool for measuring cohesion. List all sections as rows and the module's candidate central questions as columns. Mark each cell with the section's relevance to that question [12].

### Module 05 Pre-Split Matrix

| Section | Q1: How did NastyMix work? | Q2: What happened to the CD? |
|---------|---------------------------|------------------------------|
| Label founding | **3** (essential) | 1 (tangential) |
| NW roster | **3** (essential) | 0 (irrelevant) |
| National roster | **3** (essential) | 0 (irrelevant) |
| Business arc | **3** (essential) | 0 (irrelevant) |
| CD spatial mapping | 1 (tangential) | **3** (essential) |
| MOHAI exhibit | 1 (tangential) | **3** (essential) |
| Gentrification arc | 0 (irrelevant) | **3** (essential) |
| **Column sum** | **14** | **10** |

When a module has two strong columns, it is serving two masters. The matrix makes this visible. A well-scoped module has exactly one column that dominates (all cells >= 2) [13].

### The Dominance Test

For each column, compute the dominance score: sum of cells in that column / (3 * number of sections). A dominant column scores > 0.7. Module 05's Q1 dominance: 14/21 = 0.67. Q2 dominance: 10/21 = 0.48. Neither question dominates. This confirms the module serves two masters [14].

### Post-Split Matrices

**Module 05a:**

| Section | Q1: How did NastyMix work? |
|---------|---------------------------|
| Label founding | 3 |
| NW roster | 3 |
| National roster | 3 |
| Business arc | 3 |
| **Dominance** | **12/12 = 1.0** |

**Module 05b:**

| Section | Q2: What happened to the CD? |
|---------|------------------------------|
| CD spatial mapping | 3 |
| MOHAI exhibit | 3 |
| Gentrification arc | 3 |
| **Dominance** | **9/9 = 1.0** |

Both post-split modules achieve perfect dominance: 1.0 on their respective questions [15].

---

## 4. Coupling Types Between Research Modules

Coupling between research modules comes in several forms, ranging from tightest to loosest [16]:

### Content Coupling (Tightest)

Module A depends on the internal structure of Module B -- specific sections, specific data formats, specific numbering. If Module B reorganizes internally, Module A breaks. Research modules should never have content coupling [17].

### Common Coupling

Two modules depend on a shared global resource (a shared dataset, a shared glossary, a shared schema). Changes to the shared resource affect both modules. This is manageable if the shared resource is stable and well-defined [18].

### Control Coupling

Module A's behavior depends on information passed from Module B. In research terms: Module A's analytical frame or methodology depends on findings from Module B. Sequential modules within a wave have control coupling; parallel modules should not [19].

### Stamp Coupling

Modules share a data structure (schema, template, format) but use different parts of it. The cross-reference contract between 05a and 05b is stamp coupling: they share the founding moment schema but use it differently [20].

### Data Coupling (Loosest)

Modules communicate only through simple, well-defined data parameters. In research terms: Module A cites Module B's findings but doesn't depend on Module B's internal structure. This is the target coupling level for parallel modules [21].

```
COUPLING TYPE LADDER (tightest to loosest)
================================================================

  1. CONTENT      -- depends on internal structure
  2. COMMON       -- depends on shared global resource
  3. CONTROL      -- behavior depends on other module's output
  4. STAMP        -- shares data structure, uses different parts
  5. DATA         -- communicates through simple parameters

  Module 05a <-> 05b: STAMP coupling (shared origin point)
  Module 05a <-> Module 03: DATA coupling (citation only)
  Module 05b <-> MOHAI exhibit: DATA coupling (primary source)

  TARGET: Data coupling between parallel modules
          Stamp coupling acceptable for cross-references
```

> **Related:** [Maintaining Coherence After Splitting](04-maintaining-coherence-after-splitting.md) for managing post-split coupling

---

## 5. The Cohesion-Coupling Tradeoff

Splitting a module typically increases cohesion within each resulting module but may increase coupling between them. The tradeoff is acceptable when [22]:

1. The cohesion gain is from temporal/logical to functional (two levels or more)
2. The coupling introduced is stamp or data (loose forms only)
3. The cross-reference contract is simple and stable

### Module 05 Tradeoff Analysis

| Metric | Pre-Split | Post-Split | Change |
|--------|-----------|------------|--------|
| Cohesion type | Temporal (level 3) | Functional (level 7) | +4 levels (major improvement) |
| Internal dominance | 0.67/0.48 (dual) | 1.0/1.0 (single) | Perfect from dual |
| Coupling between halves | N/A (same module) | Stamp (shared origin) | Acceptable |
| Coupling to series | Tight (two clusters) | Loose (one cluster each) | Improved |
| Net assessment | | | **Strong improvement** |

The tradeoff is overwhelmingly positive. The cohesion gain (temporal to functional, +4 levels) far outweighs the minimal stamp coupling introduced by the cross-reference contract [23].

### When the Tradeoff Is Negative

Do NOT split when:

- The resulting coupling would be content or control coupling (too tight)
- The cohesion gain would be only one level (e.g., logical to temporal)
- The cross-reference contract would require 5+ bidirectional references
- The resulting modules would need to be read sequentially (narrative dependency) [24]

---

## 6. Module 05 Cohesion Analysis: Before and After

### Before Split: Cohesion Audit

**Central Question Candidates:**
- Q1: "How did NastyMix Records function as an independent label?"
- Q2: "What happened to the Central District as a cultural place?"
- Q3: "How are NastyMix and the CD related?" (umbrella attempt)

Q3 is an umbrella question that tries to unify Q1 and Q2, but it doesn't succeed because the analytical frames diverge after the founding moment. The umbrella question can be answered in a single paragraph ("they share a founding moment and a zip code, then diverge"). It doesn't need a 613-line module [25].

**Cohesion Score by Section:**

| Section | Lines | Q1 Score | Q2 Score | Q3 Score |
|---------|-------|----------|----------|----------|
| Founding | 1-180 | 3 | 1 | 2 |
| NW Roster | 181-260 | 3 | 0 | 1 |
| National Roster | 261-320 | 3 | 0 | 1 |
| Business Arc | 321-390 | 3 | 0 | 1 |
| CD Spatial | 391-460 | 1 | 3 | 2 |
| MOHAI | 461-530 | 1 | 3 | 2 |
| Gentrification | 531-613 | 0 | 3 | 2 |
| **Totals** | | **14** | **10** | **11** |

No question achieves dominance (>0.7). The module is incoherent regardless of which central question is chosen [26].

### After Split: Cohesion Audit

**Module 05a: Central Question = Q1**

| Section | Q1 Score |
|---------|----------|
| Founding (four co-founders) | 3 |
| NW Roster (Mix, Kid Sensation, etc.) | 3 |
| National Roster (Adrienne, Bob & Mob, etc.) | 3 |
| Business Arc ($900 to closure) | 3 |
| **Dominance: 12/12 = 1.0** | |

**Module 05b: Central Question = Q2**

| Section | Q2 Score |
|---------|----------|
| CD Spatial Mapping (key sites) | 3 |
| MOHAI Legacy Exhibit (primary archive) | 3 |
| Gentrification Arc (65% to under 20%) | 3 |
| Preservation Infrastructure (NAAM, Wa Na Wari) | 3 |
| **Dominance: 12/12 = 1.0** | |

Both post-split modules achieve perfect functional cohesion [27].

---

## 7. Coupling Metrics for the Split

### Pre-Split External Coupling

Before the split, Module 05 was coupled to two different series clusters:

| Connection | Type | Cluster | Coupling Level |
|-----------|------|---------|---------------|
| Module 03 (CD ecosystem) | Extends | Community heritage | Data |
| deepaudioanalyzermission.pdf | Parent | Music industry | Data |
| Emerald Street | Source | Both | Common |
| HistoryLink | Source | Music industry | Data |
| MOHAI | Source | Community heritage | Data |
| UW CRL&HP | Source | Community heritage | Data |

The module had coupling to two clusters, which meant changes in either cluster could affect Module 05. This dual-cluster coupling is a structural smell [28].

### Post-Split External Coupling

**Module 05a:**

| Connection | Type | Cluster | Coupling Level |
|-----------|------|---------|---------------|
| Module 03 | Reference | Community heritage | Data |
| Module 05b | Cross-ref | Community heritage | Stamp |
| Emerald Street | Source | Music industry | Data |
| HistoryLink | Source | Music industry | Data |

**Module 05b:**

| Connection | Type | Cluster | Coupling Level |
|-----------|------|---------|---------------|
| Module 03 | Extends | Community heritage | Data |
| Module 05a | Cross-ref | Music industry | Stamp |
| MOHAI | Source | Community heritage | Data |
| UW CRL&HP | Source | Community heritage | Data |

Each module is now coupled to a single cluster with one stamp-coupling cross-reference to the other. This is clean architecture [29].

---

## 8. Cluster Alignment

Research series organize modules into clusters -- groups of modules that share analytical domain, methodology, and source pool. Well-scoped modules align with exactly one cluster. Poorly scoped modules straddle two or more [30].

### Seattle Hip-Hop Series Clusters

```
CLUSTER MAP
================================================================

  MUSIC INDUSTRY CLUSTER          COMMUNITY HERITAGE CLUSTER
  ────────────────────           ─────────────────────────────
  Module 01 (scene origins)      Module 03 (CD ecosystem)
  Module 02 (radio ecosystem)    Module 05b (CD place memory)
  Module 04 (audio production)   Module 06 (live venues)
  Module 05a (NastyMix label)
                                  ARCHIVAL CLUSTER
                                  ───────────────
                                  MOHAI documentation
                                  Emerald Street references
                                  UW Civil Rights archive

  BEFORE SPLIT:
    Module 05 straddled MUSIC INDUSTRY + COMMUNITY HERITAGE
    [Architectural smell: dual-cluster alignment]

  AFTER SPLIT:
    05a --> Music Industry cluster (clean)
    05b --> Community Heritage cluster (clean)
```

Cluster alignment determines where a module appears in the series navigation, which modules it cross-references most naturally, and which expert reviewers are appropriate. Dual-cluster modules create navigation confusion and reviewer assignment problems [31].

---

## 9. Information Flow Analysis

Information flow analysis traces how data and findings move between modules. In a well-designed series, information flows in one direction through the wave plan (earlier waves feed later waves) with minimal backward references [32].

### Module 05 Information Flow (Pre-Split)

```
INFORMATION FLOW (pre-split) -- PROBLEMATIC
================================================================

  Module 03 (CD ecosystem)
      |
      v
  Module 05 (NastyMix + CD)  <---> deepaudioanalyzermission.pdf
      |          |
      v          v
  Music industry  Community heritage
  cluster         cluster
      |          |
      v          v
  (divergent flow -- module feeds two different downstream paths)
```

The problematic pattern: Module 05 receives input from one module (03) and produces output for two different clusters. This creates a fan-out pattern that signals the module is doing two jobs [33].

### Information Flow (Post-Split)

```
INFORMATION FLOW (post-split) -- CLEAN
================================================================

  Module 03 (CD ecosystem)
      |              |
      v              v
  Module 05a      Module 05b
  (NastyMix)      (CD Place)
      |              |
      v              v
  Music industry  Community heritage
  cluster         cluster
```

After the split, information flows cleanly: Module 03 feeds both 05a and 05b, each of which feeds a single cluster. No fan-out, no dual-cluster routing [34].

> **Related:** [MPC](../MPC/index.html) for data flow architecture, [CMH](../CMH/index.html) for mesh routing patterns

---

## 10. The LCOM Metric Adapted for Research

LCOM (Lack of Cohesion of Methods) is a software engineering metric that measures how many method pairs in a class share no instance variables. Adapted for research modules: LCOM measures how many section pairs share no sources [35].

### Computing Research LCOM

For each pair of sections in a module, check whether they share at least one source. LCOM = (number of pairs sharing no source) - (number of pairs sharing at least one source). If LCOM > 0, the module lacks cohesion [36].

### Module 05 LCOM (Pre-Split)

Section pairs and shared sources:

| Pair | Shared Sources | Score |
|------|---------------|-------|
| Founding -- NW Roster | Emerald Street, HistoryLink | +1 |
| Founding -- National Roster | Seattle Times 1990 | +1 |
| Founding -- Business Arc | HistoryLink, Seattle Times | +1 |
| Founding -- CD Spatial | *None* | -1 |
| Founding -- MOHAI | *None* | -1 |
| Founding -- Gentrification | *None* | -1 |
| NW Roster -- National Roster | Seattle Times 1990 | +1 |
| NW Roster -- Business Arc | HistoryLink | +1 |
| NW Roster -- CD Spatial | *None* | -1 |
| NW Roster -- MOHAI | *None* | -1 |
| NW Roster -- Gentrification | *None* | -1 |
| National Roster -- Business Arc | Seattle Times | +1 |
| National Roster -- CD Spatial | *None* | -1 |
| National Roster -- MOHAI | *None* | -1 |
| National Roster -- Gentrification | *None* | -1 |
| Business Arc -- CD Spatial | *None* | -1 |
| Business Arc -- MOHAI | *None* | -1 |
| Business Arc -- Gentrification | *None* | -1 |
| CD Spatial -- MOHAI | MOHAI data | +1 |
| CD Spatial -- Gentrification | UW CRL&HP | +1 |
| MOHAI -- Gentrification | AASLH | +1 |

**LCOM = 12 pairs sharing no source - 9 pairs sharing source = +3**

LCOM > 0 confirms the module lacks cohesion. The section pairs that share no source form two clean clusters: {Founding, NW Roster, National Roster, Business Arc} and {CD Spatial, MOHAI, Gentrification}. These are the two modules hiding inside Module 05 [37].

### Post-Split LCOM

**Module 05a:** All section pairs share at least one source (Emerald Street, HistoryLink, or Seattle Times). LCOM = 0.

**Module 05b:** All section pairs share at least one source (MOHAI, AASLH, or UW CRL&HP). LCOM = 0.

Both post-split modules achieve minimum LCOM (maximum cohesion) [38].

---

## 11. Architectural Smells in Module Design

Architectural smells are structural patterns that indicate design problems. Adapted from Fowler's code smells for research module architecture [39]:

### Smell 1: The God Module

A module that tries to cover an entire domain rather than a focused question. Symptoms: high line count, multiple analytical frames, dual-cluster alignment. Module 05 exhibited this smell.

**Refactoring:** Split into focused modules, one per analytical frame [40].

### Smell 2: The Shotgun Module

A module whose content is scattered across multiple concerns, so that changes in any one concern require touching the module. Symptoms: high coupling to multiple clusters, frequent revision from multiple directions.

**Refactoring:** Extract each concern into its own module [41].

### Smell 3: The Feature Envy Module

A module that spends more time discussing another module's topic than its own. Symptoms: sections that would score higher on another module's central question than on their own module's question.

**Refactoring:** Move the envious sections to the module they actually serve [42].

### Smell 4: The Middleman Module

A module that exists only to cross-reference two other modules without contributing original analysis. Symptoms: high cross-reference density, low original content.

**Refactoring:** Eliminate the middleman; let the two modules reference each other directly [43].

### Smell 5: The Divergent Change Module

A module that changes for two unrelated reasons. If new label data triggers a revision AND new census data triggers a separate revision, the module has divergent change. This is the clearest indicator of a category error.

**Refactoring:** Split along the change axis. Each reason-for-change becomes its own module [44].

```
ARCHITECTURAL SMELL CHECKLIST
================================================================

  [ ] God Module: >1.8x series median, multiple frames
  [ ] Shotgun: coupled to multiple clusters
  [ ] Feature Envy: sections score higher on other module's question
  [ ] Middleman: high cross-refs, low original content
  [ ] Divergent Change: changes for two unrelated reasons

  Module 05 pre-split: GOD MODULE + SHOTGUN + DIVERGENT CHANGE
  Module 05a post-split: CLEAN
  Module 05b post-split: CLEAN
```

> **Related:** [GSD2](../GSD2/index.html) for architectural smell detection, [COK](../COK/index.html) for knowledge organization smells, [CDL](../CDL/index.html) for linking architecture

---

## 12. Cross-References

| Topic | Appears In | Related Projects |
|-------|-----------|-----------------|
| Cohesion types | M3 | GSD2, COK |
| Coupling types | M3, M4 | GSD2, CMH |
| Section-Question Matrix | M3 | GSD2, ACE |
| LCOM metric adaptation | M3 | GSD2, MPC |
| Cluster alignment | M3, M5 | GSD2, CDL |
| Information flow analysis | M3, M4 | MPC, CMH |
| Architectural smells | M3 | GSD2, COK |
| Cross-reference contracts | M3, M4 | CMH, PMG |
| Divergent change | M1, M3 | GSD2, ACE |
| Functional cohesion | M3, M5 | GSD2, CDL |

---

## 13. Sources

1. Yourdon, E., Constantine, L. L. *Structured Design: Fundamentals of a Discipline of Computer Program and Systems Design.* Prentice Hall, 1979. [Cohesion and coupling foundations]
2. Stevens, W. P., Myers, G. J., Constantine, L. L. "Structured Design." *IBM Systems Journal*, 13(2), 1974, pp. 115-139. [Original cohesion/coupling taxonomy]
3. Pressman, R. S. *Software Engineering: A Practitioner's Approach.* McGraw-Hill, 9th ed., 2019. [Coupling measurement]
4. GSD Ecosystem. "Cohesion-Coupling Quadrant for Research Modules." Internal methodology, 2026.
5. Yourdon, E., Constantine, L. L. *Structured Design.* Chapter 6: Cohesion. [Seven cohesion types]
6. GSD Ecosystem. "Logical Cohesion in Research: The Broad Category Trap." Analysis, 2026.
7. Module 05 Split Analysis. Vision Document. March 2026. [Temporal cohesion diagnosis]
8. Yourdon, E., Constantine, L. L. *Structured Design.* Chapter 6: Procedural Cohesion. [Procedural cohesion definition]
9. GSD Ecosystem. "Communicational Cohesion: When Shared Data Isn't Enough." Analysis, 2026.
10. GSD Ecosystem. "Sequential Cohesion in Research Module Design." Analysis, 2026.
11. Yourdon, E., Constantine, L. L. *Structured Design.* Chapter 6: Functional Cohesion. [Best-case cohesion definition]
12. GSD Ecosystem. "Section-Question Matrix: Practical Cohesion Measurement." Internal methodology, 2026.
13. Module 05 Split Analysis. Problem Statement. March 2026. [Dual-question evidence]
14. GSD Ecosystem. "The Dominance Test for Module Central Questions." Methodology, 2026.
15. Module 05 Split Analysis. Architecture After Split. March 2026. [Post-split perfect dominance]
16. Myers, G. J. *Composite/Structured Design.* Van Nostrand Reinhold, 1978. [Coupling type taxonomy]
17. Pressman, R. S. *Software Engineering.* Chapter 12: Design Concepts. [Content coupling hazards]
18. GSD Ecosystem. "Common Coupling in Research Series: Shared Glossaries and Schemas." 2026.
19. Module 05 Split Analysis. Wave Execution Plan. March 2026. [Control coupling in wave sequences]
20. GSD Ecosystem. "Stamp Coupling via Cross-Reference Contracts." Architecture documentation, 2026.
21. Parnas, D. L. "On the Criteria to Be Used in Decomposing Systems into Modules." *CACM*, 1972. [Data coupling ideal]
22. GSD Ecosystem. "Cohesion-Coupling Tradeoff Analysis for Module Splits." 2026.
23. Module 05 Split Analysis. Chipset Configuration. March 2026. [Tradeoff validation]
24. Martin, R. C. *Clean Architecture.* Prentice Hall, 2017. [When splitting creates worse coupling]
25. Module 05 Split Analysis. Core Concept, "One Zip Code, Two Stories." March 2026.
26. Module 05 Split Analysis. Problem Statement, items 1-5. March 2026. [Pre-split cohesion audit data]
27. Module 05 Split Analysis. Scope Boundaries. March 2026. [Post-split scope definitions]
28. Module 05 Split Analysis. Relationship to Other Documents. March 2026. [External coupling inventory]
29. GSD Ecosystem. "Post-Split Coupling Inventory: Module 05a and 05b." Analysis, 2026.
30. GSD Ecosystem. "Cluster Alignment in Research Series Architecture." Documentation, 2026.
31. Module 05 Split Analysis. Chipset Configuration, integration section. March 2026.
32. Bass, L., Clements, P., Kazman, R. *Software Architecture in Practice.* Addison-Wesley, 4th ed., 2021. [Information flow analysis]
33. GSD Ecosystem. "Fan-Out Pattern as Dual-Responsibility Signal." Analysis, 2026.
34. Module 05 Split Analysis. Architecture Overview. March 2026. [Post-split flow diagram]
35. Chidamber, S. R., Kemerer, C. F. "A Metrics Suite for Object Oriented Design." *IEEE TSE*, 20(6), 1994, pp. 476-493. [LCOM original definition]
36. GSD Ecosystem. "LCOM Adapted for Research Modules: Source-Pair Analysis." Methodology, 2026.
37. Module 05 Split Analysis. Source Bibliography. March 2026. [Source partition data]
38. GSD Ecosystem. "Post-Split LCOM Validation." Analysis, 2026.
39. Fowler, M. *Refactoring: Improving the Design of Existing Code.* Addison-Wesley, 2nd ed., 2018. [Code smell taxonomy]
40. Fowler, M. "God Class" smell. *Refactoring*, 2018. [Adapted as God Module]
41. Fowler, M. "Shotgun Surgery" smell. *Refactoring*, 2018. [Adapted as Shotgun Module]
42. Fowler, M. "Feature Envy" smell. *Refactoring*, 2018. [Adapted for module sections]
43. Fowler, M. "Middle Man" smell. *Refactoring*, 2018. [Adapted for research modules]
44. Fowler, M. "Divergent Change" smell. *Refactoring*, 2018. [Strongest split signal in module design]
