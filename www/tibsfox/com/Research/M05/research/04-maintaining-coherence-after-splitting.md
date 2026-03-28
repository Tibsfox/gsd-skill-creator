# Maintaining Coherence After Splitting

> **Domain:** Structural Analysis & Module Architecture
> **Module:** 4 -- Cross-Reference Contracts, Series Integration, and Post-Split Validation
> **Through-line:** *A split without a coherence strategy is just two broken halves. The split succeeds when both modules stand alone AND hold together in the series architecture.* The cross-reference contract, the series wave plan, and the cluster alignment work together to maintain the relationship that the original fused module expressed poorly. Separate containers, shared architecture.

---

## Table of Contents

1. [The Coherence Problem](#1-the-coherence-problem)
2. [Cross-Reference Contracts](#2-cross-reference-contracts)
3. [Series Wave Plan Integration](#3-series-wave-plan-integration)
4. [Cluster Navigation Design](#4-cluster-navigation-design)
5. [Shared Origin Documentation](#5-shared-origin-documentation)
6. [Reader Path Analysis](#6-reader-path-analysis)
7. [Post-Split Validation Checklist](#7-post-split-validation-checklist)
8. [The Module 05 Case: Before and After Architecture](#8-the-module-05-case-before-and-after-architecture)
9. [Refactoring Large Modules: Step-by-Step](#9-refactoring-large-modules-step-by-step)
10. [Managing Cross-Module Dependencies](#10-managing-cross-module-dependencies)
11. [Long-Term Maintenance of Split Modules](#11-long-term-maintenance-of-split-modules)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. The Coherence Problem

Splitting a module solves the cohesion problem (each half now has a single analytical frame) but creates a coherence problem: how do the two halves relate to each other and to the larger series? A naive split -- simply cutting the module at the frame boundary -- leaves readers confused about why two modules share a founding moment but tell different stories [1].

The coherence problem has three dimensions:

1. **Local coherence:** Each module must stand alone as a complete research unit
2. **Relational coherence:** The relationship between the split modules must be documented
3. **Series coherence:** Both modules must integrate into the larger series architecture [2]

```
THREE DIMENSIONS OF POST-SPLIT COHERENCE
================================================================

  1. LOCAL COHERENCE (within each module)
     - Complete analytical frame
     - Self-contained argument
     - Full bibliography
     - Reader can understand this module without reading the other

  2. RELATIONAL COHERENCE (between split modules)
     - Cross-reference contract at shared origin
     - Each module acknowledges the other's existence
     - The relationship is documented, not assumed

  3. SERIES COHERENCE (within the larger series)
     - Both modules appear in the series navigation
     - Both modules are assigned to appropriate clusters
     - The wave plan schedules both as parallel tracks
     - The series index reflects the split
```

All three dimensions must be satisfied. Local coherence without relational coherence produces two orphan modules. Relational coherence without series coherence produces a pair that floats outside the series architecture [3].

> **Related:** [When and Why to Split](01-when-and-why-to-split.md) for the split motivation, [Cohesion Analysis](03-cohesion-analysis.md) for measuring the improvement

---

## 2. Cross-Reference Contracts

A cross-reference contract is a formal agreement between two modules about what information they share, how they reference each other, and what each module is responsible for. It is the minimal coupling mechanism that maintains relational coherence [4].

### Contract Components

| Component | Description | Example (Module 05a/05b) |
|-----------|-------------|--------------------------|
| Shared origin | The event, person, or place where both stories begin | Rotary Boys & Girls Club, 1985 |
| Direction reference | Each module cites the other for the complementary story | "For the label story, see 05a" / "For the place story, see 05b" |
| Boundary statement | What each module covers and does NOT cover | 05a: label economics only. 05b: cultural geography only. |
| Shared sources | Sources cited by both modules | Daudi Abe, *Emerald Street* |
| No-overlap guarantee | Topics that will NOT be duplicated | 05a won't cover gentrification; 05b won't cover the roster |

### Contract Template

```
CROSS-REFERENCE CONTRACT: Module 05a <-> Module 05b
================================================================

  SHARED ORIGIN:
    Rotary Boys & Girls Club, Central District, 1985
    Sir Mix-A-Lot meets Nes Rodriguez
    [Both modules cite this event in their opening section]

  DIRECTION REFERENCES:
    05a -> 05b: "The Central District neighborhood story --
                 gentrification, MOHAI documentation, and
                 preservation infrastructure -- is documented
                 in Module 05b: Central District Place Memory."
    05b -> 05a: "The NastyMix Records business story --
                 founding, roster, economics, and collapse --
                 is documented in Module 05a: NastyMix Label
                 Ecosystem."

  BOUNDARY:
    05a covers: Label founding, complete roster, business arc,
                structural analysis, KFOX pipeline
    05b covers: CD spatial mapping, MOHAI exhibit, gentrification
                arc, redlining history, preservation response

  NO-OVERLAP:
    05a will NOT cover: gentrification data, MOHAI exhibit,
                        neighborhood demographics, Wa Na Wari
    05b will NOT cover: roster profiles, business timeline,
                        Ichiban partnership, Gold Party details

  SHARED SOURCES:
    Daudi Abe, Emerald Street (both cite as primary authority)
    Rotary Boys & Girls Club (shared origin point)
```

The contract is stamp coupling: both modules share a schema (the shared origin point and direction references) but use different parts of it [5].

> **Related:** [CMH](../CMH/index.html) for mesh contract patterns, [PMG](../PMG/index.html) for integration protocol design

---

## 3. Series Wave Plan Integration

After a split, the series wave plan must be updated to schedule both modules. The key decision is whether the split modules run in parallel (no inter-dependency) or sequentially (one feeds the other) [6].

### Parallel vs. Sequential Scheduling

| Criterion | Parallel | Sequential |
|-----------|----------|------------|
| Inter-module dependency | None | Output of first feeds second |
| Source pool overlap | Minimal | Significant |
| Success criteria | Independent | Second depends on first |
| Execution efficiency | Higher (2x parallelism) | Lower (serial bottleneck) |

Module 05a and 05b qualify for parallel execution: no inter-dependency, independent source pools, independent success criteria [7].

### Updated Wave Plan

```
WAVE PLAN UPDATE (Module 05 Split)
================================================================

  BEFORE SPLIT:
    Wave 1: Module 01, Module 02, Module 03, Module 04, Module 05, Module 06
    [Module 05 is a serial bottleneck -- takes 2x the time of other modules]

  AFTER SPLIT:
    Wave 0: Shared schemas, cross-reference contracts
    Wave 1: Track A: Module 05a (label ecosystem)
            Track B: Module 05b (place memory)
            [Both run in parallel -- no inter-dependency]
    Wave 2: Synthesis -- cross-module integration, founding moment validation
    Wave 3: Verification, series integration update

  EFFICIENCY GAIN:
    Before: Module 05 takes ~104K tokens as a serial unit
    After: 05a (~50K) and 05b (~46K) run in parallel
    Net: ~50K wall-clock tokens instead of ~104K (50% reduction)
```

The split converts a serial bottleneck into two parallel tracks, cutting the effective execution time roughly in half [8].

### Wave Plan Validation

After updating the wave plan, validate:

1. **No circular dependencies:** 05a does not depend on 05b's output, and vice versa
2. **Resource independence:** Two researchers can work simultaneously without conflicts
3. **Checkpoint alignment:** Both modules complete at the same wave boundary
4. **Synthesis readiness:** Wave 2 has all inputs from both tracks [9]

---

## 4. Cluster Navigation Design

After a split, both modules need to appear in the series navigation and be assigned to their respective clusters. The navigation should make the relationship between split modules visible without requiring the reader to reconstruct it [10].

### Navigation Patterns

**Pattern 1: Adjacent Listing**

List split modules adjacently in the navigation with a visual indicator:

```
  Module 04: Audio Production
  Module 05a: NastyMix Label Ecosystem     } split
  Module 05b: Central District Place Memory } pair
  Module 06: Live Performance
```

**Pattern 2: Cluster Grouping**

List each module in its cluster, with a cross-reference note:

```
  MUSIC INDUSTRY CLUSTER:
    Module 01: Scene Origins
    Module 02: Radio Ecosystem
    Module 04: Audio Production
    Module 05a: NastyMix Label (see also: 05b in Heritage cluster)

  COMMUNITY HERITAGE CLUSTER:
    Module 03: CD Ecosystem
    Module 05b: CD Place Memory (see also: 05a in Industry cluster)
    Module 06: Live Performance
```

**Pattern 3: Numbered Sub-Modules**

Use the parent number with sub-designators (05a, 05b). This preserves the series numbering while indicating the split relationship [11].

### Navigation Design Principles

1. The split should be visible but not dominant (readers shouldn't have to understand the split to use the series)
2. Each module should be reachable from both the cluster view and the sequential view
3. The cross-reference should be one click, not a search operation [12]

---

## 5. Shared Origin Documentation

The shared origin point is the hinge between split modules. It must be documented consistently in both modules so that readers who enter from either side understand the relationship [13].

### Documentation Rules

1. **Same facts, different emphasis.** Both modules cite the shared origin (Rotary Boys & Girls Club, 1985), but 05a emphasizes the label founding implication and 05b emphasizes the neighborhood context.

2. **Explicit direction reference.** Each module states: "For the [other story], see Module [other]." This is not a suggestion -- it is a structural requirement of the cross-reference contract.

3. **No narrative dependency.** The reader should not need to read the other module to understand the shared origin. Each module provides enough context to stand alone [14].

### Example: Shared Origin in Module 05a

```markdown
## The Founding Moment

NastyMix Records was born in 1985 at the Rotary Boys & Girls
Club in Seattle's Central District, where Sir Mix-A-Lot
(Anthony Ray) met radio host Nes Rodriguez. Along with Ed Locke
and Greg Jones, they formed a label that would put Seattle on the
national rap map.

> **Related:** The Central District's broader story -- its
> transformation from a Black cultural hub to a gentrified
> neighborhood -- is documented in Module 05b: Central District
> Place Memory.
```

### Example: Shared Origin in Module 05b

```markdown
## The Central District as Cultural Incubator

The Central District's significance to Seattle hip-hop is rooted
in the 1985 meeting at the Rotary Boys & Girls Club, where the
neighborhood produced NastyMix Records and launched Sir Mix-A-Lot's
career. But the CD's story extends far beyond any single label --
it is a story of a neighborhood that went from over 65% Black
to under 20% Black in a single generation.

> **Related:** The NastyMix Records business story -- founding,
> roster, economics, and collapse -- is documented in Module 05a:
> NastyMix Label Ecosystem.
```

Both passages cover the shared origin. Neither requires the other to make sense. The cross-reference provides a clear path to the complementary story [15].

---

## 6. Reader Path Analysis

After splitting, analyze the paths readers might take through the series and verify that all paths produce a coherent experience [16].

### Path Types

**Path 1: Sequential Reader.** Reads all modules in order (01, 02, 03, 04, 05a, 05b, 06...). This reader encounters 05a and 05b consecutively. The cross-reference contract ensures they understand the relationship.

**Path 2: Cluster Reader.** Reads all modules in one cluster. A music industry reader reads 01, 02, 04, 05a. A community heritage reader reads 03, 05b, 06. The cluster grouping ensures each path is coherent.

**Path 3: Keyword Reader.** Arrives at 05a or 05b from a search or external link. The direction reference in each module guides them to the complementary module if they want the full picture.

**Path 4: Cross-Reference Reader.** Arrives from another module that cites 05a or 05b. The landing module must be self-contained enough to satisfy the reference [17].

### Path Validation

| Path | Enters | Reads | Coherent? | Cross-ref needed? |
|------|--------|-------|-----------|-------------------|
| Sequential | 05a first | 05a then 05b | Yes | Minimal (adjacent) |
| Music cluster | 05a | 05a only | Yes | Direction ref to 05b |
| Heritage cluster | 05b | 05b only | Yes | Direction ref to 05a |
| Keyword: NastyMix | 05a | 05a | Yes | No (self-contained) |
| Keyword: gentrification | 05b | 05b | Yes | No (self-contained) |
| From Module 03 | 05b | 05b | Yes | Data coupling (extends 03) |

All paths produce a coherent experience. No reader is stranded without context [18].

---

## 7. Post-Split Validation Checklist

The post-split validation checklist confirms that the split was executed correctly and that coherence is maintained across all three dimensions [19].

### Local Coherence Checks

| Check | Module 05a | Module 05b |
|-------|-----------|-----------|
| Single analytical frame | Industry economics | Cultural geography |
| Self-contained argument | Label lifecycle complete | Neighborhood arc complete |
| Complete bibliography | 15+ sources, all label-related | 12+ sources, all CD-related |
| Within series size range | 280-320 lines target | 280-320 lines target |
| Cohesion dominance >= 0.9 | 1.0 | 1.0 |
| LCOM = 0 | Confirmed | Confirmed |

### Relational Coherence Checks

| Check | Status |
|-------|--------|
| Cross-reference contract written | Required |
| Shared origin documented in both modules | Required |
| Direction references in both modules | Required |
| No-overlap guarantee validated | Required |
| Shared sources identified | Required |

### Series Coherence Checks

| Check | Status |
|-------|--------|
| Both modules in series navigation | Required |
| Both modules assigned to clusters | Required |
| Wave plan updated for parallel execution | Required |
| Series index reflects the split | Required |
| All reader paths validated | Required |

### Safety Checks (from source material)

| Check | Verifies |
|-------|----------|
| SC-01: No undocumented financial claims | All dollar figures sourced to HistoryLink or Seattle Times |
| SC-02: Nes Rodriguez health note | Preservation urgency, not tragedy narrative |
| SC-03: Gentrification data sourced | All demographics to MOHAI/AASLH |
| SC-04: QTPOC content | Community-curated framing preserved [20] |

---

## 8. The Module 05 Case: Before and After Architecture

### Before: The Fused Architecture

```
BEFORE SPLIT -- ARCHITECTURAL DIAGRAM
================================================================

  SERIES: Seattle Hip-Hop Cultural Study
  |
  +-- Module 01: Scene Origins
  +-- Module 02: Radio Ecosystem
  +-- Module 03: CD Ecosystem
  +-- Module 04: Audio Production
  +-- Module 05: NastyMix + CD (613 lines, 2 frames)
  |     |-- Music industry content (sections 1-4)
  |     |-- Cultural geography content (sections 5-7)
  |     |-- Coupled to: Music Industry cluster + Heritage cluster
  |     |-- LCOM: +3 (lacks cohesion)
  |     |-- Dominance: 0.67/0.48 (dual, neither dominant)
  +-- Module 06: Live Performance

  PROBLEMS:
    - Category error (two frames in one container)
    - Dual-cluster coupling (serves two masters)
    - Serial bottleneck (cannot parallelize)
    - Reader context-switching (3+ frame shifts)
```

### After: The Split Architecture

```
AFTER SPLIT -- ARCHITECTURAL DIAGRAM
================================================================

  SERIES: Seattle Hip-Hop Cultural Study
  |
  +-- Module 01: Scene Origins ........... [Music Industry cluster]
  +-- Module 02: Radio Ecosystem ......... [Music Industry cluster]
  +-- Module 03: CD Ecosystem ............ [Heritage cluster]
  +-- Module 04: Audio Production ........ [Music Industry cluster]
  +-- Module 05a: NastyMix Label ......... [Music Industry cluster]
  |     |-- Single frame: music industry economics
  |     |-- Cross-ref: 05b at shared origin
  |     |-- LCOM: 0 (maximum cohesion)
  |     |-- Dominance: 1.0 (perfect)
  |     |-- Target: 280-320 lines
  |
  +-- Module 05b: CD Place Memory ........ [Heritage cluster]
  |     |-- Single frame: cultural geography
  |     |-- Cross-ref: 05a at shared origin
  |     |-- LCOM: 0 (maximum cohesion)
  |     |-- Dominance: 1.0 (perfect)
  |     |-- Target: 280-320 lines
  |
  +-- Module 06: Live Performance ........ [Heritage cluster]

  IMPROVEMENTS:
    - Category error resolved (one frame per module)
    - Single-cluster alignment (one master each)
    - Parallel execution enabled (Wave 1 Track A + Track B)
    - Zero reader context-switching within modules
```

The transformation is clean: every metric improves, every architectural problem resolves, and the series gains parallelism [21].

---

## 9. Refactoring Large Modules: Step-by-Step

The refactoring process for splitting a large module follows a structured sequence. This is the practical how-to, informed by the Module 05 case [22].

### Step 1: Identify the Split Boundary

Run the frame count diagnostic (Module 1). Mark where the analytical frame changes. In Module 05, the boundary was between the business arc section (line ~390) and the CD spatial mapping section (line ~391) [23].

### Step 2: Partition the Bibliography

Assign each source to one of the resulting modules. Confirm clean partition (no orphans). Flag shared sources for the cross-reference contract [24].

### Step 3: Write the Cross-Reference Contract

Define the shared origin, direction references, boundary statements, and no-overlap guarantee (Section 2 of this module) [25].

### Step 4: Scaffold Both Modules

Create the structural framework for each module using the Standard Research Module Template (Module 2, Section 8). Populate headers, TOCs, and section headings [26].

### Step 5: Migrate Content

Move content from the original module into the appropriate scaffolds. Do not merely copy -- reshape each section to serve its new module's central question. Content that served the umbrella question may need rewriting to serve the focused question [27].

### Step 6: Add Shared Origin Passages

Write the shared origin documentation for each module (Section 5 of this module). Ensure both passages are self-contained and include direction references [28].

### Step 7: Validate

Run the post-split validation checklist (Section 7). Confirm local, relational, and series coherence. Run the LCOM metric on both modules [29].

### Step 8: Update the Series Architecture

Update the wave plan, series navigation, cluster assignments, and any external references to the original Module 05 [30].

```
REFACTORING SEQUENCE
================================================================

  1. Identify split boundary ---- WHERE does the frame change?
  2. Partition bibliography ------ CAN sources separate cleanly?
  3. Write cross-ref contract ---- HOW do the modules relate?
  4. Scaffold both modules ------- WHAT structure does each need?
  5. Migrate content ------------- MOVE content to correct module
  6. Add shared origin ----------- DOCUMENT the hinge point
  7. Validate -------------------- RUN all coherence checks
  8. Update series architecture -- INTEGRATE into the series
```

> **Related:** [The Split Decision Framework](05-split-decision-framework.md) for the decision process that precedes refactoring

---

## 10. Managing Cross-Module Dependencies

After splitting, dependencies between the new modules and the rest of the series must be managed carefully. The goal is data coupling (loose) rather than content or control coupling (tight) [31].

### Dependency Types Post-Split

| Dependency | Type | Management Strategy |
|-----------|------|-------------------|
| 05a cites 05b's shared origin | Stamp | Cross-reference contract |
| 05b extends Module 03 | Data | Citation only; no structural dependency |
| 05a references Emerald Street | Source | Independent bibliography entry |
| 05b references MOHAI exhibit | Source | Independent bibliography entry |
| Series index references both | Navigational | Series architecture update |
| Wave plan schedules both | Operational | Parallel track configuration |

### Dependency Health Indicators

| Indicator | Healthy | Unhealthy |
|-----------|---------|-----------|
| Cross-references between 05a/05b | 1-2 (at shared origin) | 5+ (narrative entanglement) |
| Shared sources | 1-2 (primary authority) | 5+ (source pool not cleanly partitioned) |
| Section-level references | 0 (module-level only) | 3+ (content coupling) |
| Update propagation | None (modules evolve independently) | Frequent (changes in one require changes in other) |

Module 05a and 05b, with 1-2 cross-references at the shared origin and 1-2 shared sources (Emerald Street as primary authority), are in the healthy range on all indicators [32].

---

## 11. Long-Term Maintenance of Split Modules

Split modules require ongoing maintenance to prevent drift -- the gradual erosion of coherence as the series evolves [33].

### Maintenance Tasks

**Quarterly: Cross-Reference Audit.** Verify that the cross-reference contract is still accurate. If either module has been revised, check that the shared origin passages still align [34].

**Per-Revision: No-Overlap Check.** When revising either module, verify that new content doesn't duplicate content in the other module. The no-overlap guarantee must be maintained [35].

**Per-Series-Update: Cluster Alignment Verification.** When the series adds new modules, verify that 05a and 05b are still in the correct clusters and that the cluster definitions haven't shifted [36].

### Drift Prevention Strategies

1. **Immutable shared origin.** The shared origin passage should be treated as a stable interface -- change it only when the underlying facts change, not for stylistic reasons.

2. **Direction reference as mandatory section.** Include the direction reference in the module template so it survives revisions. It should never be optional or "nice to have."

3. **Cross-reference contract as living document.** Store the contract alongside the modules (not just in the mission pack) so that future maintainers can find it [37].

### When Split Modules Should Be Recombined

Rarely, but it happens. Recombine when:

1. The series architecture changes and both modules now belong to the same cluster
2. One module has been thinned below the undershoot threshold and the combined module would be in range
3. New research reveals that the analytical frames were not as independent as initially assessed

Do NOT recombine merely because it seems simpler or because the original Module 05 number feels "more natural." The split resolved real architectural problems; recombination should require equally strong evidence [38].

> **Related:** [GSD2](../GSD2/index.html) for maintenance architecture, [COK](../COK/index.html) for knowledge graph maintenance, [CDL](../CDL/index.html) for link maintenance

---

## 12. Cross-References

| Topic | Appears In | Related Projects |
|-------|-----------|-----------------|
| Cross-reference contracts | M1, M4 | CMH, PMG |
| Wave plan integration | M2, M4 | GSD2, MPC |
| Cluster navigation | M3, M4 | GSD2, CDL |
| Shared origin documentation | M1, M4 | CDS, MIX |
| Reader path analysis | M4 | GSD2, COK |
| Post-split validation | M4, M5 | GSD2, ACE |
| Refactoring process | M4, M5 | GSD2, CDL |
| Dependency management | M3, M4 | CMH, MPC |
| Maintenance strategies | M4 | GSD2, COK |
| Drift prevention | M4 | GSD2, PMG |

---

## 13. Sources

1. GSD Ecosystem. "Post-Split Coherence: Three Dimensions." Internal methodology, 2026.
2. Bass, L., Clements, P., Kazman, R. *Software Architecture in Practice.* Addison-Wesley, 4th ed., 2021. [Architectural coherence framework]
3. GSD Ecosystem. "Local, Relational, and Series Coherence in Module Splits." Analysis, 2026.
4. Parnas, D. L. "On the Criteria to Be Used in Decomposing Systems into Modules." *CACM*, 1972. [Module interface contracts]
5. GSD Ecosystem. "Cross-Reference Contracts: Stamp Coupling for Research Modules." 2026.
6. Module 05 Split Analysis. Wave Execution Plan. March 2026. [Parallel scheduling decision]
7. Module 05 Split Analysis. Deliverables section. March 2026. [Independence criteria]
8. Module 05 Split Analysis. Execution Summary. March 2026. [Efficiency gain calculation]
9. GSD Ecosystem. "Wave Plan Validation Protocol." Internal methodology, 2026.
10. GSD Ecosystem. "Cluster Navigation Design for Split Modules." Documentation, 2026.
11. Module 05 Split Analysis. Series Integration Update deliverable. March 2026.
12. Krug, S. *Don't Make Me Think: A Common Sense Approach to Web Usability.* New Riders, 3rd ed., 2014. [Navigation design principles]
13. Module 05 Split Analysis. Core Concept, "One Zip Code, Two Stories." March 2026.
14. GSD Ecosystem. "Shared Origin Documentation Rules." Internal standard, 2026.
15. Module 05 Split Analysis. Vision Guide, Through-Line section. March 2026.
16. Rosenfeld, L., Morville, P., Arango, J. *Information Architecture.* O'Reilly, 4th ed., 2015. [Reader path analysis]
17. GSD Ecosystem. "Reader Path Types for Research Series." Analysis, 2026.
18. GSD Ecosystem. "Path Validation for Module 05 Split." Analysis, 2026.
19. GSD Ecosystem. "Post-Split Validation Checklist." Internal methodology, 2026.
20. Module 05 Split Analysis. Safety and Sensitivity Considerations. March 2026.
21. Module 05 Split Analysis. Architecture Overview, Wave 0-3. March 2026.
22. Fowler, M. *Refactoring: Improving the Design of Existing Code.* Addison-Wesley, 2nd ed., 2018. [Refactoring methodology]
23. Module 05 Split Analysis. Problem Statement, item 1. March 2026. [Split boundary identification]
24. Module 05 Split Analysis. Source Bibliography, partitioned. March 2026.
25. GSD Ecosystem. "Cross-Reference Contract Template." Standard, 2026.
26. GSD Ecosystem. "Standard Research Module Template." Internal documentation, 2026.
27. Fowler, M. "Move Method" refactoring. *Refactoring*, 2018. [Content migration pattern]
28. GSD Ecosystem. "Shared Origin Passage Template." Standard, 2026.
29. Chidamber, S. R., Kemerer, C. F. "A Metrics Suite for Object Oriented Design." *IEEE TSE*, 1994. [LCOM validation]
30. Module 05 Split Analysis. Milestone Specification. March 2026. [Series architecture update]
31. Myers, G. J. *Composite/Structured Design.* Van Nostrand Reinhold, 1978. [Coupling management]
32. GSD Ecosystem. "Dependency Health Indicators for Split Modules." Analysis, 2026.
33. Lehman, M. M. "Laws of Software Evolution Revisited." *EWSPT*, 1996. [System evolution and maintenance drift]
34. GSD Ecosystem. "Quarterly Cross-Reference Audit Protocol." Maintenance standard, 2026.
35. GSD Ecosystem. "No-Overlap Verification Protocol." Maintenance standard, 2026.
36. GSD Ecosystem. "Cluster Alignment Verification Protocol." Maintenance standard, 2026.
37. GSD Ecosystem. "Cross-Reference Contract as Living Document." Architecture documentation, 2026.
38. GSD Ecosystem. "Recombination Criteria for Split Modules." Decision framework, 2026.
