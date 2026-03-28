# Module Sizing Principles

> **Domain:** Structural Analysis & Module Architecture
> **Module:** 2 -- Quantitative Foundations for Module Scope
> **Through-line:** *The right size for a module is not a number. It is the amount of space a single analytical frame needs to fully develop its question, consult its sources, apply its methodology, and produce its findings.* Line counts are gauges, not governors. The series median tells you what one analytical frame typically needs. The deviation from the median tells you when something structural is wrong.

---

## Table of Contents

1. [The Sizing Problem](#1-the-sizing-problem)
2. [Series Median as Structural Signal](#2-series-median-as-structural-signal)
3. [Measuring Module Scope](#3-measuring-module-scope)
4. [Cohesion Density](#4-cohesion-density)
5. [The Overshoot Diagnostic](#5-the-overshoot-diagnostic)
6. [Undershoot: When Modules Are Too Thin](#6-undershoot-when-modules-are-too-thin)
7. [Source Density and Citation Load](#7-source-density-and-citation-load)
8. [Structural Templates for Research Modules](#8-structural-templates-for-research-modules)
9. [Wave Plan Integration](#9-wave-plan-integration)
10. [Sizing Across Different Research Domains](#10-sizing-across-different-research-domains)
11. [The Goldilocks Zone](#11-the-goldilocks-zone)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. The Sizing Problem

Module sizing in research architecture has the same fundamental challenge as function sizing in software engineering: there is no universal correct size [1]. A module should be as large as its analytical frame requires and no larger. The difficulty is measuring analytical frame size in advance, before the research is complete.

The software engineering literature offers two competing schools. The "short function" school (Martin, Clean Code) argues for functions under 20 lines, on the grounds that smaller units are easier to test and reason about [2]. The "logical unit" school (McConnell, Code Complete) argues that the function should be as long as its logical task requires, with the caveat that functions over 200 lines should be reviewed for possible decomposition [3].

Research modules face the same tension. Short modules are focused but may lack depth. Long modules can develop complex arguments but risk scope creep. The resolution is not to pick a number but to pick a principle: **one module, one analytical frame, fully developed** [4].

```
SIZING PRINCIPLE HIERARCHY
================================================================

  1. FRAME UNITY (non-negotiable)
     One module = one analytical frame
     This is the primary constraint.
     Length is secondary.

  2. SERIES COHERENCE (strong guideline)
     Modules within a series should be comparable in scope.
     The series median is a structural signal.
     Deviations > 1.5x warrant investigation.

  3. DEVELOPMENT ADEQUACY (quality floor)
     Every claim sourced.
     Every topic developed beyond surface treatment.
     No section thinner than its analytical importance warrants.

  4. LINE COUNT (gauge, not governor)
     Target: series median +/- 20%
     Overshoot 1.8x+: investigate for category error
     Undershoot 0.5x-: investigate for thin treatment
```

> **Related:** [When and Why to Split](01-when-and-why-to-split.md) for the frame unity principle, [Cohesion Analysis](03-cohesion-analysis.md) for measuring internal relatedness

---

## 2. Series Median as Structural Signal

The series median is the most reliable sizing signal available. It represents the empirical answer to "how much space does one analytical frame typically need in this research domain, at this level of depth, for this audience?" [5]

### Computing the Series Median

For the Seattle Hip-Hop Cultural Series (excluding Module 05):

| Module | Lines | Topic |
|--------|-------|-------|
| Module 01 | 295 | Scene origins and founding mythology |
| Module 02 | 310 | Radio ecosystem and airplay infrastructure |
| Module 03 | 305 | Central District cultural ecosystem |
| Module 04 | 285 | Audio production and studio methodology |
| Module 06 | 290 | Live performance and venue culture |
| **Median** | **295** | -- |
| **Mean** | **297** | -- |
| **Std Dev** | **10.2** | -- |
| Module 05 | 613 | NastyMix + CD (fused) |
| **05 deviation** | **+318 (2.08x median)** | **SPLIT SIGNAL** |

The tight clustering (std dev = 10.2) tells us that single-frame modules in this series converge naturally to ~295 lines. Module 05's 613 lines is a 2.08x deviation -- well beyond the 1.8x threshold that signals a category error [6].

### The Median as Calibration Tool

After splitting Module 05:

| Module | Target | Expected |
|--------|--------|----------|
| Module 05a (NastyMix) | 280-320 | ~300 (industry frame) |
| Module 05b (CD Place) | 280-320 | ~300 (geography frame) |

Both targets align with the series median. This is not coincidence -- it is structural confirmation that the split correctly resolved the category error [7].

> **Related:** [GSD2](../GSD2/index.html) for calibration methodology, [CMH](../CMH/index.html) for mesh sizing parallels

---

## 3. Measuring Module Scope

Module scope is the product of three dimensions: breadth (how many subtopics), depth (how thoroughly each subtopic is developed), and source density (how many citations support each claim) [8].

### The Scope Triangle

```
THE SCOPE TRIANGLE
================================================================

                        BREADTH
                       /       \
                      /         \
                     /   MODULE  \
                    /    SCOPE    \
                   /               \
                  /                 \
                 DEPTH ----------- SOURCE DENSITY

  BALANCED: All three dimensions proportional
    --> Module at series median, well-scoped

  BREADTH-HEAVY: Many topics, shallow treatment
    --> Module may be too broad; consider splitting into focused modules

  DEPTH-HEAVY: Few topics, exhaustive treatment
    --> Module may be over-specialized; consider if it serves the series

  SOURCE-HEAVY: Dense citations on narrow ground
    --> Module may be a literature review, not a research module
```

### Practical Measurement

For each section of a module, assign a scope score:

| Dimension | Score 1 | Score 2 | Score 3 |
|-----------|---------|---------|---------|
| Breadth | 1-2 subtopics | 3-5 subtopics | 6+ subtopics |
| Depth | Surface treatment (1-2 paragraphs per topic) | Moderate development (3-5 paragraphs) | Full development (6+ paragraphs with examples) |
| Source density | <1 citation per subtopic | 1-2 citations per subtopic | 3+ citations per subtopic |

A well-scoped module at the series median typically scores 2/2/2 or 2/3/2 -- moderate breadth, moderate-to-full depth, and solid sourcing. Module 05 scored 3/2/2 before the split (too broad, moderate depth) and each post-split module targets 2/3/2 (focused breadth, full depth) [9].

---

## 4. Cohesion Density

Cohesion density measures how tightly related the sections of a module are to each other and to the module's central question. High cohesion density means every section contributes directly to answering the module's core question. Low cohesion density means sections drift into adjacent topics that might be better served in other modules [10].

### Measuring Cohesion Density

For each section, ask: "If I removed this section, would the module's central question still be answered?" Score:

- **3 (essential):** Removing this section would leave the central question unanswered
- **2 (supporting):** This section strengthens the answer but isn't strictly required
- **1 (tangential):** This section addresses a related topic but doesn't answer the central question

The cohesion density is the mean score across all sections. Well-scoped modules score 2.3+. Split candidates score below 2.0 [11].

### Module 05 Cohesion Density (Pre-Split)

| Section | Central Question: "What was NastyMix and how did it relate to the CD?" | Score |
|---------|----------------------------------------------------------------------|-------|
| Label founding | Essential to understanding NastyMix | 3 |
| Complete roster | Essential to understanding the label ecosystem | 3 |
| Business arc | Essential to understanding the label lifecycle | 3 |
| CD spatial mapping | Tangential to label story; essential to neighborhood story | 1 |
| MOHAI documentation | Tangential to label story; essential to preservation story | 1 |
| Gentrification arc | Tangential to label story; essential to neighborhood story | 1 |
| **Mean** | | **2.0** |

The 2.0 score is exactly at the split threshold. The first three sections (label content) score 3/3/3. The last three sections (geography content) score 1/1/1 relative to the label question. This bimodal distribution is the cohesion signature of a fused module [12].

### Post-Split Cohesion Density

Module 05a (central question: "How did NastyMix work as an independent label?"):
- Founding: 3, Roster: 3, Business arc: 3, Collapse: 3 --> **Mean: 3.0**

Module 05b (central question: "What happened to the Central District as a cultural place?"):
- Spatial mapping: 3, MOHAI: 3, Gentrification: 3, Preservation: 3 --> **Mean: 3.0**

Both post-split modules achieve maximum cohesion density [13].

> **Related:** [Cohesion Analysis](03-cohesion-analysis.md) for the complete cohesion measurement framework

---

## 5. The Overshoot Diagnostic

When a module significantly exceeds the series median, the overshoot diagnostic identifies whether the excess is due to a category error (split needed) or legitimate depth (keep as-is) [14].

### Diagnostic Steps

**Step 1: Line Count Ratio.** Compute module length / series median.

| Ratio | Signal |
|-------|--------|
| 0.8-1.2 | Normal range |
| 1.2-1.5 | Watch zone -- review scope for creep |
| 1.5-1.8 | Warning zone -- run frame count diagnostic |
| 1.8+ | Split signal -- likely contains category error |

**Step 2: Frame Count.** If ratio > 1.5, count distinct analytical frames. If frame count > 1, proceed to split decision framework.

**Step 3: Source Pool Check.** If frame count > 1, attempt to partition the bibliography. Clean partition confirms category error.

**Step 4: Section Scoring.** Score each section's cohesion with the module's central question. Bimodal distribution (some sections score 3, others score 1) confirms the fused-module pattern [15].

### Module 05 Overshoot Diagnostic Results

| Step | Result | Signal |
|------|--------|--------|
| Line count ratio | 613/295 = 2.08 | **SPLIT** |
| Frame count | 2 (industry + geography) | **SPLIT** |
| Source pool | Clean partition (HistoryLink vs. UW CRL&HP) | **SPLIT** |
| Section scoring | Bimodal (3,3,3,1,1,1) | **SPLIT** |
| **Verdict** | **4/4 SPLIT signals** | **Confirmed split candidate** |

This is as clean a split signal as the diagnostic can produce. Every indicator points the same direction [16].

---

## 6. Undershoot: When Modules Are Too Thin

The overshoot diagnostic catches modules that are too large. The undershoot diagnostic catches modules that are too small. A module below 0.5x the series median may be:

1. **Under-researched:** The topic exists but hasn't been developed adequately
2. **A section, not a module:** The content belongs as a section within a larger module
3. **A stub:** The module was created as a placeholder and never completed [17]

### Undershoot Thresholds

| Ratio | Interpretation |
|-------|---------------|
| 0.7-1.0 | Normal (slightly below median is fine) |
| 0.5-0.7 | Thin -- review for under-development |
| < 0.5 | Stub -- likely needs absorption into adjacent module or significant expansion |

For the Seattle Hip-Hop series (median 295): modules under 210 lines are in the thin zone. Modules under 148 lines are stubs [18].

### The Absorption Test

If a module is too thin to stand alone, test whether it should be absorbed into an adjacent module. The absorption test asks:

1. Does the thin module share an analytical frame with an adjacent module?
2. Would absorbing it keep the combined module within the series size range?
3. Would the combined module maintain high cohesion density?

If all three answers are yes, absorb. Otherwise, the thin module needs expansion, not absorption [19].

---

## 7. Source Density and Citation Load

Source density is the number of cited sources per 100 lines of module content. It serves as a quality signal: too low suggests unsupported claims, too high suggests the module is a literature review rather than original analysis [20].

### Benchmarks

| Source Density | Interpretation |
|----------------|---------------|
| < 3 per 100 lines | Under-sourced -- claims may be unsupported |
| 3-8 per 100 lines | Healthy range -- claims supported, analysis present |
| 8-12 per 100 lines | Source-heavy -- check if analysis is present or just review |
| > 12 per 100 lines | Literature review territory -- may need rebalancing |

### Module 05 Source Density

Pre-split Module 05 (613 lines): approximately 25 distinct sources = 4.1 per 100 lines. Healthy.

Post-split:
- Module 05a (est. 300 lines): approximately 15 sources = 5.0 per 100 lines. Healthy.
- Module 05b (est. 300 lines): approximately 12 sources = 4.0 per 100 lines. Healthy.

The source density holds through the split because the sources partition cleanly along the analytical frame boundary [21].

### Citation Load Balancing

When splitting a module, sources should partition without orphans:

```
SOURCE PARTITION (Module 05)
================================================================

  MODULE 05a (Label Ecosystem):
    - HistoryLink file 9793 (Gold Party)
    - HistoryLink file 9794 (Fifth Anniversary)
    - Seattle Times, June 1990 ("A Mix Bag")
    - Seattle Times, October 1992 (closure)
    - Daudi Abe, Emerald Street (roster authority)
    - Humanities Washington / Spark (NastyMix context)
    - Blackpast.org (Mix-A-Lot biography)
    - Good Ol'Dayz (Kid Sensation, Criminal Nation)
    - Town Love / Crane City Music (NW artist archives)
    - Seattle Times, November 2024 (Nes Rodriguez health)
    - New Nastymix Records (Maurice Owens revival)

  MODULE 05b (Place Memory):
    - MOHAI exhibit page (Legacy of Seattle Hip-Hop)
    - AASLH case study (exhibit documentation)
    - UW Civil Rights & Labor History Project (redlining)
    - Arte Noir / Emerald Street excerpts (Draze)
    - Seattle Globalist (Draze documentation)
    - TheGrio (gentrification coverage)
    - The Root (7 Black Sites in Seattle)
    - MOHAI digital photograph collection
    - MOHAI "Segregated Seattle" programming

  SHARED (referenced by both):
    - Daudi Abe, Emerald Street (primary authority)
    - Rotary Boys & Girls Club (shared origin point)

  ORPHANED: None. Clean partition.
```

> **Related:** [PMG](../PMG/index.html) for source management patterns, [COK](../COK/index.html) for knowledge organization

---

## 8. Structural Templates for Research Modules

Research modules within a series benefit from structural consistency. A template provides the scaffolding that ensures each module covers the same bases at comparable depth, while allowing the content to vary with the topic [22].

### The Standard Research Module Template

```
STANDARD RESEARCH MODULE TEMPLATE (~300 lines)
================================================================

  1. HEADER (5 lines)
     - Title, domain, module number, through-line quote

  2. TABLE OF CONTENTS (15-20 lines)
     - Numbered sections with anchor links

  3. FOUNDATION SECTION (40-60 lines)
     - Context: why this topic matters in the series
     - Core question: what this module investigates
     - Key terms defined

  4. BODY SECTIONS x3-5 (150-200 lines total)
     - Each section develops one subtopic
     - Each section has its own sourced evidence
     - Tables, diagrams, and code blocks as needed
     - Safety callouts where applicable

  5. INTEGRATION SECTION (30-40 lines)
     - How this module connects to the series
     - Cross-references to related modules and projects
     - Through-line revisited

  6. CROSS-REFERENCE TABLE (10-15 lines)
     - Tabular mapping of topics to modules and projects

  7. SOURCES (20-30 lines)
     - Numbered bibliography
     - Primary sources first, secondary sources after
```

### Applying the Template to Module 05a

| Template Section | Module 05a Content | Estimated Lines |
|-----------------|-------------------|----------------|
| Header | NastyMix Label Ecosystem, through-line | 5 |
| TOC | 10-12 sections | 18 |
| Foundation | NastyMix founding context, four co-founders | 50 |
| Body: Roster (NW) | Mix, Kid Sensation, High Performance, Criminal Nation, Accused | 60 |
| Body: Roster (National) | Adrienne, Whiz Kid, Bob & Mob, Side F-X, Rodney O, Rococo | 40 |
| Body: Business Arc | $900 to platinum to collapse timeline | 50 |
| Body: Structural Analysis | Single-artist vulnerability, failed diversification | 30 |
| Integration | Series connections, through-line | 30 |
| Cross-references | Table | 12 |
| Sources | 15 sources | 25 |
| **Total** | | **~320** |

This confirms the split produces a well-sized module [23].

---

## 9. Wave Plan Integration

Module sizing directly affects wave plan architecture. Well-sized modules can be scheduled as parallel tracks in a wave. Oversized modules create bottlenecks because they consume disproportionate context window space and cannot be parallelized internally [24].

### Parallel Execution Requirements

For two modules to run as parallel tracks in a wave:

1. **No inter-module dependency:** Neither module needs the other's output
2. **Comparable size:** Both modules should be within 30% of each other in estimated tokens
3. **Independent source pools:** Researchers don't compete for the same primary sources
4. **Independent success criteria:** Each module can be validated independently [25]

### Module 05 Wave Integration (Post-Split)

| Criterion | 05a | 05b | Compatible? |
|-----------|-----|-----|-------------|
| Dependencies | Needs Wave 0 schemas | Needs Wave 0 schemas | Yes (no mutual dependency) |
| Estimated tokens | ~50K | ~46K | Yes (within 30%) |
| Source pool | HistoryLink, Seattle Times | MOHAI, UW CRL&HP | Yes (independent) |
| Success criteria | Roster, business arc | MOHAI, gentrification data | Yes (independent) |
| **Parallel execution** | | | **APPROVED** |

The split enables parallel execution in Wave 1, reducing total mission time. The original fused Module 05 had to run sequentially because it contained both analytical frames in a single container [26].

> **Related:** [GSD2](../GSD2/index.html) for wave plan architecture, [MPC](../MPC/index.html) for parallel execution patterns

---

## 10. Sizing Across Different Research Domains

Module size varies by research domain. Technical domains (DSP, protocols, hardware) tend toward longer modules because equations, diagrams, and protocol specifications consume more space. Cultural domains (music history, community memory) tend toward shorter modules because the narrative is more compact [27].

### Domain-Specific Medians

| Domain | Typical Median | Range | Example Series |
|--------|---------------|-------|----------------|
| Signal processing | 470-510 | 440-610 | SGL (Signal & Light) |
| Hardware implementation | 450-490 | 420-550 | T55 (555 Timer), EMG |
| Music industry history | 280-320 | 260-350 | Seattle Hip-Hop Cultural Study |
| Cultural geography | 280-310 | 250-330 | CDS, SAL |
| Community heritage | 290-330 | 270-360 | TIBS, FFA |
| Software architecture | 400-450 | 350-500 | GSD2, CMH |
| Computing infrastructure | 420-470 | 380-530 | ACE, MPC |

These medians are empirical -- derived from the completed PNW Research Series projects. They should not be treated as targets but as calibration data: a music history module at 500 lines warrants investigation, while a DSP module at 500 lines is normal [28].

### Cross-Domain Modules

When a module spans two domains (as Module 05 did with music industry + cultural geography), the median conflict is itself a split signal. The music industry median (300) and the cultural geography median (300) sum to approximately the fused module's length (613). This is not coincidence [29].

---

## 11. The Goldilocks Zone

The Goldilocks Zone for a module is the range where it is long enough to fully develop its analytical frame and short enough to maintain coherent focus. The zone is not defined by absolute numbers but by the relationship between the module's content and its series context [30].

### Computing the Goldilocks Zone

1. Compute the series median (M)
2. Lower bound: M * 0.8 (below this, investigate for thin treatment)
3. Upper bound: M * 1.3 (above this, investigate for scope creep)
4. Split signal: M * 1.8 (above this, likely contains category error)

For the Seattle Hip-Hop series (M = 295):

| Zone | Range | Action |
|------|-------|--------|
| Too thin | < 236 | Expand or absorb |
| Goldilocks | 236-384 | Well-scoped |
| Watch | 384-531 | Review scope |
| Split signal | > 531 | Run split diagnostic |

Module 05 at 613 lines was firmly in the split signal zone [31].

### The Goldilocks Principle

A module in the Goldilocks Zone satisfies all four constraints simultaneously:

1. **Frame unity:** Single analytical frame throughout
2. **Series coherence:** Within 30% of the series median
3. **Development adequacy:** Every claim sourced, every topic developed
4. **Reader tractability:** A reader can hold the entire argument in working memory

The Goldilocks Zone is where these constraints intersect. Outside it, at least one constraint is violated [32].

```
THE GOLDILOCKS ZONE
================================================================

  |<--- Too thin --->|<---- Goldilocks Zone ---->|<-- Watch -->|<- Split ->|
  0        0.5M       0.8M                   1.3M          1.8M        2.0M+
  |---------|---------|-------------------------|------------|-----------|
            |         |        OPTIMAL          |            |           |
            |    expand/absorb     |        review scope    |    split  |
            |         |            |             |           |           |
                      |  Module 05a target: ~300 (1.02x)    |           |
                      |  Module 05b target: ~300 (1.02x)    |           |
                      |                          Module 05 original: 613 (2.08x)
```

> **Related:** [The Split Decision Framework](05-split-decision-framework.md) for the complete diagnostic, [GSD2](../GSD2/index.html) for architectural zone analysis

---

## 12. Cross-References

| Topic | Appears In | Related Projects |
|-------|-----------|-----------------|
| Series median computation | M1, M2 | GSD2, CMH |
| Cohesion density | M2, M3 | GSD2, COK |
| Source density metrics | M2, M3 | PMG, CDL |
| Wave plan integration | M2, M4, M5 | GSD2, MPC |
| Module templates | M2, M4 | GSD2, ACE |
| Domain-specific sizing | M2 | SGL, T55, EMG |
| Goldilocks Zone | M2, M5 | GSD2, CMH |
| Overshoot diagnostic | M1, M2 | GSD2, ACE |
| Parallel execution | M2, M5 | MPC, CMH |
| Category error detection | M1, M2 | GSD2, COK |

---

## 13. Sources

1. Parnas, D. L. "On the Criteria to Be Used in Decomposing Systems into Modules." *Communications of the ACM*, 15(12), 1972, pp. 1053-1058. [Module decomposition criteria]
2. Martin, R. C. *Clean Code: A Handbook of Agile Software Craftsmanship.* Prentice Hall, 2008. [Short function school]
3. McConnell, S. *Code Complete: A Practical Handbook of Software Construction.* Microsoft Press, 2nd ed., 2004. [Logical unit school, 200-line review threshold]
4. GSD Ecosystem. "One Module, One Frame: The Sizing Principle." Internal documentation, 2026.
5. Module 05 Split Analysis. Research Reference section. March 2026. [Series median computation]
6. Seattle Hip-Hop Cultural Series. Module survey data. March 2026. [Empirical line counts]
7. Module 05 Split Analysis. Deliverables section. March 2026. [Post-split target validation]
8. Booth, W. C., Colomb, G. G., Williams, J. M. *The Craft of Research.* University of Chicago Press, 4th ed., 2016. [Research scope framework]
9. GSD Ecosystem. "Scope Triangle: Breadth, Depth, Source Density." Internal methodology, 2026.
10. Yourdon, E., Constantine, L. L. *Structured Design: Fundamentals of a Discipline of Computer Program and Systems Design.* Prentice Hall, 1979. [Cohesion measurement foundations]
11. GSD Ecosystem. "Cohesion Density Scoring for Research Modules." Internal methodology, 2026.
12. Module 05 Split Analysis. Problem Statement, items 1-5. March 2026. [Bimodal cohesion pattern]
13. Module 05 Split Analysis. Architecture After Split diagram. March 2026.
14. McConnell, S. *Code Complete.* Chapter 7: High-Quality Routines. [Overshoot diagnostic inspiration]
15. GSD Ecosystem. "Four-Step Overshoot Diagnostic." Internal methodology, 2026.
16. Module 05 Split Analysis. Vision Guide. March 2026. [Module 05 diagnostic results]
17. Fowler, M. *Refactoring: Improving the Design of Existing Code.* Addison-Wesley, 2nd ed., 2018. [Code smell: Long Method / Long Class]
18. GSD Ecosystem. "Undershoot Thresholds and Absorption Testing." Internal methodology, 2026.
19. GSD Ecosystem. "The Absorption Test: When Thin Modules Should Merge." 2026.
20. Day, R. A. *How to Write and Publish a Scientific Paper.* Greenwood Press, 6th ed., 2006. [Citation density norms]
21. Module 05 Split Analysis. Source Bibliography. March 2026. [Source partition validation]
22. GSD Ecosystem. "Standard Research Module Template." Internal documentation, 2026.
23. Module 05 Split Analysis. Component Breakdown. March 2026. [Template application to 05a]
24. GSD Ecosystem. "Wave Plan Architecture: Module Sizing and Scheduling." 2026.
25. Module 05 Split Analysis. Wave Execution Plan. March 2026. [Parallel execution criteria]
26. Module 05 Split Analysis. Execution Summary. March 2026. [Wave integration validation]
27. Signal & Light project (SGL). Module line count data. 2026. [Technical domain median reference]
28. PNW Research Series. Cross-project module survey. March 2026. [Domain-specific medians]
29. Module 05 Split Analysis. Vision section. March 2026. [Cross-domain sum observation]
30. GSD Ecosystem. "The Goldilocks Zone: Optimal Module Sizing." Internal analysis, 2026.
31. Seattle Hip-Hop Cultural Series. Module 05 sizing analysis. March 2026.
32. Alexander, C. *The Timeless Way of Building.* Oxford University Press, 1979. [Quality Without a Name -- constraint intersection principle]
