# When and Why to Split Modules

> **Domain:** Structural Analysis & Module Architecture
> **Module:** 1 -- Recognition Patterns for Module Decomposition
> **Through-line:** *A module that tries to tell two stories tells neither one well.* The decision to split is not about line count -- it is about recognizing when a single container holds two fundamentally different analytical frames, each demanding its own research methodology, its own primary sources, and its own success criteria. The split follows the logic of the divergence.

---

## Table of Contents

1. [The Split Recognition Problem](#1-the-split-recognition-problem)
2. [Category Errors in Module Design](#2-category-errors-in-module-design)
3. [Divergent Analytical Frames](#3-divergent-analytical-frames)
4. [The NastyMix Case: Industry vs. Geography](#4-the-nastymix-case-industry-vs-geography)
5. [Signal Detection: When a Module Needs Two Chips](#5-signal-detection-when-a-module-needs-two-chips)
6. [Line Count as Symptom, Not Cause](#6-line-count-as-symptom-not-cause)
7. [The Shared Origin Pattern](#7-the-shared-origin-pattern)
8. [Cost-Benefit Analysis of Splitting](#8-cost-benefit-analysis-of-splitting)
9. [Split Decision Framework](#9-split-decision-framework)
10. [Historical Precedents in Software and Scholarship](#10-historical-precedents-in-software-and-scholarship)
11. [The Amiga Principle Applied to Research](#11-the-amiga-principle-applied-to-research)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. The Split Recognition Problem

Module decomposition is a structural recognition problem. The question is never "is this module too long?" but rather "is this module trying to serve two masters?" A 600-line module that maintains a single coherent analytical frame is well-scoped. A 300-line module that fuses music industry economics with cultural geography is overloaded regardless of line count [1].

The fundamental insight comes from information theory: a module's entropy should be low relative to its scope. When the analytical frame shifts mid-module -- from label economics to neighborhood demographics, from business arc to gentrification timeline -- the reader must context-switch, and the writer must maintain two separate source pools, two separate validation criteria, and two separate success measures within a single container [2].

```
MODULE ENTROPY DIAGNOSTIC
================================================================

  LOW ENTROPY (well-scoped):
    Single analytical frame throughout
    Primary sources share methodology
    Success criteria form a coherent set
    Reader context-switches: 0-1

  HIGH ENTROPY (split candidate):
    Multiple analytical frames interleaved
    Primary sources require different methodologies
    Success criteria pull in different directions
    Reader context-switches: 3+

  DIAGNOSTIC QUESTION:
    "Can I describe what this module is ABOUT in one sentence
     without using the word 'and' to join two unrelated topics?"

    YES --> Module is well-scoped
    NO  --> Module is a split candidate
```

The GSD ecosystem's module architecture inherits this principle from the Amiga Principle: specialized execution paths, faithfully iterated, outperform general-purpose containers that try to do everything at once [3]. A module is a chip. A chip has one job.

> **Related:** [Module Sizing Principles](02-module-sizing-principles.md) for quantitative thresholds, [The Split Decision Framework](05-split-decision-framework.md) for the complete decision tree

---

## 2. Category Errors in Module Design

A category error occurs when a module fuses subjects that belong to different analytical domains. The NastyMix/Central District case is paradigmatic: a music industry subject (label economics, roster strategy, distribution deals, artist-label disputes) was fused with a cultural geography subject (spatial mapping, demographic data, archival documentation, community memory) [4].

### Identifying Category Errors

Category errors manifest through specific symptoms:

| Symptom | Description | Example |
|---------|-------------|---------|
| Source pool divergence | Primary sources split into two non-overlapping sets | HistoryLink (label events) vs. UW Civil Rights Project (redlining data) |
| Methodology mismatch | Research methods change mid-module | Business timeline reconstruction vs. spatial/demographic analysis |
| Success criteria conflict | Module can succeed at one goal while failing at another | Roster documented fully but gentrification arc thin |
| Reader whiplash | Topic transitions feel abrupt, requiring mental gear-shifts | Business arc timeline jumps to MOHAI exhibit documentation |
| Expert divergence | Different subject-matter experts would review each half | Music historian vs. urban geographer |

The root cause is almost always a shared origin point that creates the illusion of a single subject. NastyMix Records was born in the Central District, so it seems natural to tell both stories in one module. But "born in the same neighborhood" is a geographic coincidence, not an analytical relationship [5].

### The Fused-Module Anti-Pattern

```
FUSED MODULE (anti-pattern)
================================================================

  Module 05: "NastyMix Records & Central District" (613 lines)
  |
  |-- Lines 1-180: Label founding story        [INDUSTRY FRAME]
  |-- Lines 181-320: Complete roster           [INDUSTRY FRAME]
  |-- Lines 321-390: Business arc & collapse   [INDUSTRY FRAME]
  |-- Lines 391-460: CD spatial mapping        [GEOGRAPHY FRAME]  <-- frame shift
  |-- Lines 461-530: MOHAI documentation       [ARCHIVAL FRAME]   <-- frame shift
  |-- Lines 531-613: Gentrification arc        [GEOGRAPHY FRAME]
  |
  PROBLEM: Three frame shifts in a single module
  RESULT: Neither the industry story nor the geography story
          gets the depth it deserves
```

Fred Brooks identified this pattern in software engineering: "Conceptual integrity is the most important consideration in system design" [6]. A module that lacks conceptual integrity -- that serves two masters -- will be harder to write, harder to review, harder to maintain, and harder to use as a building block in the larger series architecture.

---

## 3. Divergent Analytical Frames

An analytical frame determines what questions you ask, what sources you consult, what methodology you apply, and what constitutes a satisfactory answer. When two frames coexist in a single module, they compete for space, attention, and structural coherence [7].

### Frame Comparison: Industry vs. Geography

| Dimension | Music Industry Frame | Cultural Geography Frame |
|-----------|---------------------|------------------------|
| Central question | How does an independent label work? | What happens to a neighborhood after displacement? |
| Primary sources | HistoryLink, Seattle Times, Emerald Street | MOHAI, UW Civil Rights Project, AASLH |
| Methodology | Business timeline reconstruction, roster analysis | Spatial mapping, demographic tracking, archival analysis |
| Success measure | Complete roster documented, business arc traceable | Gentrification arc with sourced data points |
| Expert reviewer | Music industry historian | Urban geographer or community archivist |
| Temporal logic | Label lifecycle (founding to closure) | Neighborhood demographic arc (1880s to 2020) |

These frames share a geography and a time period but diverge on every other analytical dimension. The label story asks about cassette economics and distribution deals. The place story asks about redlining covenants and demographic displacement. Forcing them into a single module is like asking a single FPGA to handle both audio DSP and display rendering on a shared clock domain -- possible but architecturally unsound [8].

### The Divergence Pattern

Most split candidates share this structure: two subjects that originate from the same event, person, or place but follow trajectories that diverge almost immediately after the shared origin point.

```
THE DIVERGENCE PATTERN
================================================================

                    SHARED ORIGIN
                   (Rotary Boys & Girls Club, 1985)
                         |
                    +----+----+
                    |         |
              LABEL ARC   PLACE ARC
                    |         |
              Tower Bldg   Bryant Manor
              Gold Party   MLK Jr. Way
              Platinum     Redlining
              Mix departs  Tech boom
              Closure      Under 20% Black
                    |         |
              RECONVERGE at MOHAI (2015)
              Jazmyn Scott & Aaron Walker-Loud
              "Legacy of Seattle Hip-Hop"
```

The divergence pattern reveals the correct module architecture: two modules that share a cross-reference at the origin point and reconverge at the preservation moment, but execute independently in between [9].

> **Related:** [Cohesion Analysis](03-cohesion-analysis.md) for measuring internal relatedness, [GSD2](../GSD2/index.html) for module architecture principles

---

## 4. The NastyMix Case: Industry vs. Geography

Module 05 of the Seattle Hip-Hop Cultural Series ran to 613 lines -- the longest single module in the series, well above the 280-320 line median. But the length was a symptom, not the disease. The disease was a category error: two subjects with different analytical frames, different primary sources, and different success criteria fused into a single container [10].

### The Industry Story (Module 05a)

NastyMix Records was a four-person venture: Ed Locke (former KYAC DJ, business operations), Greg Jones (investor, $900 initial budget), "Nasty" Nes Rodriguez (Filipino-American, KFOX FreshTracks host, the "Nasty" of NastyMix), and Anthony "Sir Mix-A-Lot" Ray (the artist) [11]. The label's arc from $900 startup to platinum to collapse follows a classic independent label trajectory:

1. **Founding (1985):** $900 budget, near-bankruptcy on first pressing, cold-calling radio stations
2. **Breakout:** "Square Dance Rap" breaks in Flint, Michigan -- scattered market success
3. **Peak:** SWASS platinum (1988, 1M+ shipped), Seminar gold (1989, 500K+)
4. **Expansion error:** Doubled roster in 1990 with national signings (New Jersey, Miami, California, UK)
5. **Collapse:** Mix departs 1991, takes all masters; Ichiban partnership "rocky"; closure late 1992

The structural vulnerability was singular: the label's entire revenue base resided in a single artist who owned his masters. When Mix left, he took the catalog. The national expansion produced zero charting releases [12].

### The Geography Story (Module 05b)

The Central District's displacement arc spans over a century:

- **1880s-90s:** African Americans arrive Seattle for coal mine labor
- **Early 20th c.:** Restrictive covenants confine Black residents to the Central Area
- **1960s-80s:** Over 65% of CD residents are Black (MOHAI/AASLH data)
- **2015:** CD designated Arts & Cultural District
- **2020:** Under 20% of CD residents are Black

The preservation response includes MOHAI's "Legacy of Seattle Hip-Hop" exhibit (September 2015 -- May 2016, curated by Jazmyn Scott and Aaron Walker-Loud, AASLH Leadership in History Award 2016), NAAM, 206 Zulu, Washington Hall, and Wa Na Wari [13].

### Why They Don't Belong Together

The industry story is a label lifecycle. The geography story is a neighborhood displacement arc. They share a zip code and a decade but require:

- Different primary sources (HistoryLink vs. UW Civil Rights Project)
- Different methodologies (business timeline vs. spatial/demographic analysis)
- Different success criteria (roster completeness vs. gentrification data points)
- Different analytical frames (economics vs. geography)

Separating them produces two modules of approximately 300 lines each -- consistent with the series median, focused in execution, and architecturally clean [14].

> **Related:** [CMH](../CMH/index.html) for mesh architecture parallels, [MPC](../MPC/index.html) for specialized execution path design

---

## 5. Signal Detection: When a Module Needs Two Chips

The Amiga Principle states that specialized execution paths outperform general-purpose containers [15]. Applied to research module design, this means: if a module needs two different analytical chips to execute properly, it should be two modules.

### Detection Signals

**Signal 1: Source Pool Bifurcation.** If you can divide the module's bibliography into two non-overlapping groups and each group supports a different half of the content, the module is a split candidate. Module 05's sources split cleanly: HistoryLink files 9793-9794 plus Seattle Times archive for the label story; MOHAI exhibit documentation plus UW Civil Rights Project for the place story [16].

**Signal 2: Success Criteria Independence.** If the module could fully satisfy half its success criteria while completely failing the other half, the criteria describe two different modules. Module 05 could document the complete NastyMix roster while having zero gentrification data points, or vice versa [17].

**Signal 3: Parallel Execution Potential.** If two halves of a module could be written by two different researchers working simultaneously with no inter-dependency, they are architecturally independent modules sharing a container by accident [18].

**Signal 4: Expert Divergence.** If the ideal reviewer for one half of the module would be unqualified to review the other half, the module spans two expertise domains. A music industry historian and an urban geographer would review different halves of Module 05 [19].

**Signal 5: Temporal Logic Mismatch.** If two sections of a module follow different chronological structures, they are telling different stories. The label arc (1985-1992) and the neighborhood arc (1880s-2020) use different time scales and different periodization logic [20].

```
CHIP ASSIGNMENT DIAGNOSTIC
================================================================

  For each section of the module, ask:
    1. What analytical frame does this section use?
    2. What primary sources does it rely on?
    3. What expertise is needed to validate it?
    4. What is its temporal structure?

  If the answers cluster into TWO distinct groups:
    --> The module needs two chips
    --> The module should be two modules

  EXAMPLE (Module 05):
    Group A: Industry frame, HistoryLink, music historian, 1985-1992
    Group B: Geography frame, UW CRL&HP, urban geographer, 1880s-2020

    VERDICT: Two chips needed. Split.
```

> **Related:** [GSD2](../GSD2/index.html) for chipset architecture, [ACE](../ACE/index.html) for compute engine parallels

---

## 6. Line Count as Symptom, Not Cause

A common mistake in module architecture is treating line count as the primary split criterion. Line count is a symptom of scope problems, not a cause. The goal is not to keep modules under some arbitrary threshold but to ensure each module maintains a single coherent analytical frame [21].

### When Long is Fine

A 500-line module with a single analytical frame, a unified source pool, and coherent success criteria is well-scoped. The MIDI module in the Signal & Light project (SGL) runs to 607 lines because MIDI 1.0 and MIDI 2.0 form a single evolutionary narrative -- different protocol versions, same analytical frame [22].

### When Short is Still Broken

A 250-line module that fuses two analytical frames is still a split candidate. The line count is within range, but the internal structure is incoherent. The reader experiences the same context-switching problems as they would in a longer module -- the fused frames just have less room to develop, making both treatments thin [23].

### The Series Median as Guideline

The Seattle Hip-Hop Cultural Series established a median module length of 280-320 lines. This is not a hard limit but a structural signal: modules in that range tend to maintain a single analytical frame, develop their sources adequately, and produce focused findings. Module 05's 613 lines -- nearly double the median -- was the loudest signal that something structural was wrong [24].

| Module | Lines | Analytical Frames | Status |
|--------|-------|-------------------|--------|
| Module 01 | 295 | 1 (scene origins) | Well-scoped |
| Module 02 | 310 | 1 (radio ecosystem) | Well-scoped |
| Module 03 | 305 | 1 (CD ecosystem) | Well-scoped |
| Module 04 | 285 | 1 (audio production) | Well-scoped |
| Module 05 | 613 | 2 (industry + geography) | **Split candidate** |
| Module 06 | 290 | 1 (live performance) | Well-scoped |

The overshoot correlates perfectly with the frame count. Every single-frame module lands in the 280-320 range. The only double-frame module is the only one that overshoots [25].

### The 1.8x Rule of Thumb

Empirically, a module that exceeds 1.8x the series median almost always contains a category error. This is not a mathematical law but a practical signal: when a module needs nearly twice the space of its peers, the additional space is usually serving a second analytical frame that deserves its own module [26].

> **Related:** [Module Sizing Principles](02-module-sizing-principles.md) for detailed sizing methodology

---

## 7. The Shared Origin Pattern

Most split candidates are not modules that accidentally combined unrelated topics. They are modules that correctly identified a shared origin point and then incorrectly assumed the shared origin implied a shared analytical frame [27].

### The Pattern

1. Two subjects share a founding moment, person, or place
2. They diverge almost immediately after the shared origin
3. They may reconverge later at a documentation or preservation moment
4. In between, they follow completely independent trajectories

### NastyMix and the Central District

The shared origin: the Rotary Boys and Girls Club in the Central District, where Sir Mix-A-Lot met Nes Rodriguez. From that single moment, the label story and the neighborhood story diverge. The label expands outward (Tower Building, Gold Party, national distribution). The neighborhood contracts under gentrification pressure. They reconverge at MOHAI in 2015, when Jazmyn Scott and Aaron Walker-Loud curate an exhibit that documents both the music and the place [28].

### Architectural Resolution

The shared origin does not require a single module. It requires a cross-reference contract: both modules cite the shared origin point, and the series wave plan holds them in relation. This is the same pattern as the Amiga's chip architecture: Paula and Denise share the bus but execute independently [29].

```
CROSS-REFERENCE CONTRACT
================================================================

  Module 05a (NastyMix Label Ecosystem):
    Section 1: "The label was born at the Rotary Boys & Girls Club
    in the Central District, where Sir Mix-A-Lot met Nes Rodriguez.
    For the neighborhood story, see Module 05b."

  Module 05b (Central District Place Memory):
    Section 1: "The Central District produced NastyMix Records,
    the label that put Seattle on the rap map. For the label's
    business arc, see Module 05a."

  CONTRACT: Both modules cite the shared origin.
  Neither module tells the other's story.
  The series wave plan holds them in relation.
```

> **Related:** [Maintaining Coherence After Splitting](04-maintaining-coherence-after-splitting.md) for cross-reference patterns

---

## 8. Cost-Benefit Analysis of Splitting

Splitting a module is not free. It introduces coordination overhead, cross-reference maintenance, and series-level integration work. The decision should be made on evidence, not intuition [30].

### Costs of Splitting

- **Cross-reference maintenance:** Both modules must stay in sync at their shared origin point
- **Series integration:** Wave plan must be updated to include both modules as parallel tracks
- **Navigation complexity:** Readers must follow cross-references to get the complete picture
- **Redundancy risk:** Shared context may be duplicated across both modules

### Benefits of Splitting

- **Focused execution:** Each module can develop its analytical frame fully
- **Parallel authorship:** Two researchers can work simultaneously on 05a and 05b
- **Clean validation:** Each module has its own success criteria, testable independently
- **Architectural clarity:** The series structure maps cleanly to the domain structure
- **Source coherence:** Each module's bibliography is unified, not bifurcated

### The Decision Heuristic

Split when the benefits of focused execution outweigh the costs of coordination. In practice, this means split when:

1. The module contains 2+ analytical frames (category error confirmed)
2. The source pool bifurcates cleanly (no orphaned sources)
3. Success criteria are independently testable
4. The resulting modules each land within the series size range
5. The cross-reference contract is simple (shared origin, not shared narrative)

Do NOT split when:

1. The analytical frame is unified (length alone is not sufficient cause)
2. Sources are deeply interleaved (splitting would orphan citations)
3. The narrative requires reading both halves sequentially
4. The resulting modules would be too thin to stand alone [31]

> **Related:** [The Split Decision Framework](05-split-decision-framework.md) for the complete decision tree

---

## 9. Split Decision Framework

The split decision framework is a structured evaluation process that takes a module through five diagnostic stages. Each stage produces a binary signal (SPLIT or KEEP). The module is a split candidate if stages 1-3 all signal SPLIT [32].

### Stage 1: Frame Count

Count the distinct analytical frames in the module. An analytical frame is a combination of: central question, primary methodology, source type, and success measure.

- **1 frame:** KEEP. The module is well-scoped regardless of length.
- **2+ frames:** SPLIT signal. Proceed to Stage 2.

### Stage 2: Source Pool Bifurcation

Attempt to partition the module's bibliography into two non-overlapping groups, each supporting a different analytical frame.

- **Clean partition:** SPLIT signal. Sources separate without orphans.
- **Messy partition:** KEEP signal. Sources are too interleaved to split cleanly.

### Stage 3: Success Criteria Independence

Test whether the module's success criteria can be grouped into independent sets.

- **Independent sets:** SPLIT signal. Each set tests a different analytical frame.
- **Interdependent:** KEEP signal. Criteria require both frames to evaluate.

### Stage 4: Size Validation (post-split)

Estimate the line count of each resulting module after the split.

- **Both within series range:** PROCEED with split.
- **One or both too thin:** Reconsider. Thin modules suggest the split went too far.

### Stage 5: Cross-Reference Complexity

Evaluate the cross-reference contract needed to maintain coherence after splitting.

- **Simple contract (shared origin, 1-2 cross-refs):** PROCEED.
- **Complex contract (shared narrative, 5+ cross-refs):** Reconsider. Complexity suggests the subjects are more intertwined than they appear [33].

```
SPLIT DECISION FLOWCHART
================================================================

  [Module under review]
         |
    How many analytical frames?
    |                    |
  [1 frame]         [2+ frames]
    |                    |
  KEEP              Stage 2: Source bifurcation?
                    |                    |
                [Messy]              [Clean]
                    |                    |
                  KEEP              Stage 3: Criteria independence?
                                    |                    |
                                [Dependent]          [Independent]
                                    |                    |
                                  KEEP              Stage 4: Size check
                                                    |            |
                                                [Too thin]   [In range]
                                                    |            |
                                                  KEEP       Stage 5: Cross-ref complexity
                                                              |            |
                                                          [Complex]    [Simple]
                                                              |            |
                                                            KEEP        SPLIT
```

> **Related:** [GSD2](../GSD2/index.html) for decision framework patterns, [PMG](../PMG/index.html) for Pi-Mono integration architecture

---

## 10. Historical Precedents in Software and Scholarship

The module split pattern has deep roots in both software engineering and academic research design [34].

### Software Engineering

**Unix Philosophy (McIlroy, 1978):** "Make each program do one thing well." The Unix pipe architecture succeeds because each tool has a single responsibility. Modules that try to do two things violate this principle [35].

**Single Responsibility Principle (Martin, 2003):** "A class should have only one reason to change." Applied to research modules: a module should have only one analytical frame. If the module would need to change for two unrelated reasons (new label data AND new census data), it has two responsibilities [36].

**Conway's Law (Conway, 1968):** "Organizations which design systems are constrained to produce designs which are copies of the communication structures of these organizations." Applied to research: if two different experts would review two different halves of a module, the module mirrors a communication boundary that should be a module boundary [37].

### Academic Research

**Thesis chapter structure:** Doctoral dissertations split topics into chapters not by length but by analytical frame. A chapter on methodology and a chapter on findings use different frames even though they study the same subject [38].

**Journal article scope:** Peer review consistently rejects articles that try to address two unrelated questions. "Your paper contains two papers" is a standard reviewer comment. The solution is always to split [39].

**Archival finding aids:** Libraries organize collections by provenance (who created the records), not by subject. NastyMix Records papers and Central District community archives would be separate collections even if they share dates and geography [40].

### The Lesson

Every mature design discipline has independently discovered the same principle: containers that serve two masters serve neither one well. The specific terminology varies -- single responsibility, conceptual integrity, provenance-based organization -- but the insight is universal [41].

---

## 11. The Amiga Principle Applied to Research

The Amiga's custom chipset (Agnus, Denise, Paula) succeeded because each chip had a specialized execution path. Agnus handled DMA and memory access. Denise handled display. Paula handled audio and I/O. They shared the bus but never shared responsibility for a single task [42].

Applied to research module design:

- **Each module is a chip.** It has one analytical frame, one methodology, one source pool.
- **The series is the bus.** It holds modules in relation through cross-references and the wave plan.
- **The wave plan is DMA.** It schedules execution (which modules run in parallel, which are sequential).
- **The cross-reference contract is the interrupt line.** It signals when one module needs information from another.

Module 05's original design was like building a single chip that handled both audio and display -- technically possible, architecturally unsound, and guaranteed to compromise both functions. The split produces two chips that share the bus but execute their specialized paths independently [43].

```
AMIGA PRINCIPLE --> MODULE ARCHITECTURE
================================================================

  Amiga Custom Chips          Research Modules
  ──────────────────          ────────────────
  Paula (audio + I/O)    =    Module 05a (label economics)
  Denise (display)        =    Module 05b (place memory)
  Agnus (DMA + memory)    =    Series wave plan (scheduling)
  Chip bus                =    Cross-reference contracts

  SHARED RESOURCE: The system bus / The series architecture
  RULE: Each chip does one thing. Each module does one thing.
  VIOLATION: Fusing Paula and Denise into one chip.
  EQUIVALENT: Fusing label economics and cultural geography
              into one module.
```

The Amiga Principle is not nostalgia. It is an engineering theorem about the superiority of specialized execution paths. The theorem applies equally to silicon and to scholarship [44].

> **Related:** [GSD2](../GSD2/index.html) for chipset architecture, [ACE](../ACE/index.html) for compute engine design, [CDL](../CDL/index.html) for deep linking patterns

---

## 12. Cross-References

| Topic | Appears In | Related Projects |
|-------|-----------|-----------------|
| Module decomposition | M1, M2, M5 | GSD2, ACE |
| Category errors | M1, M3 | GSD2, COK |
| Analytical frame divergence | M1, M3, M4 | CMH, MPC |
| NastyMix label ecosystem | M1, M4, M5 | CDS, MIX |
| Central District geography | M1, M4, M5 | CDS, SAL |
| Amiga Principle | M1, M2, M5 | GSD2, SGL |
| Single Responsibility Principle | M1, M2 | GSD2, CDL |
| Cross-reference contracts | M1, M4 | CMH, PMG |
| Split decision framework | M1, M5 | GSD2, ACE |
| Series wave plan architecture | M1, M2, M5 | GSD2, MPC |

---

## 13. Sources

1. Parnas, D. L. "On the Criteria to Be Used in Decomposing Systems into Modules." *Communications of the ACM*, 15(12), 1972, pp. 1053-1058. [Foundational module decomposition criteria]
2. Shannon, C. E. "A Mathematical Theory of Communication." *Bell System Technical Journal*, 27(3), 1948, pp. 379-423. [Information entropy framework]
3. GSD Ecosystem. "The Amiga Principle: Specialized Execution Paths in Research Architecture." Internal documentation, 2026. [Chipset-to-module mapping]
4. Module 05 Split Analysis. Vision Document, Stage 1. March 2026. [Category error identification]
5. Module 05 Split Analysis. Problem Statement, items 1-5. March 2026. [Structural analysis of the fused module]
6. Brooks, F. P. *The Mythical Man-Month: Essays on Software Engineering.* Addison-Wesley, 1975, 1995. [Conceptual integrity principle]
7. Kuhn, T. S. *The Structure of Scientific Revolutions.* University of Chicago Press, 1962, 3rd ed. 1996. [Analytical paradigm framework]
8. Cummings, M. "FPGA Design Methodology: Clock Domain Crossing." Sunburst Design, 2001. [Hardware domain separation analogy]
9. Module 05 Split Analysis. Core Concept section. March 2026. [Divergence pattern identification]
10. Daudi Abe. *Emerald Street: A History of Hip-Hop in Seattle 1979-2015.* University of Washington Press, 2020. [Primary scholarly authority for Seattle hip-hop]
11. HistoryLink.org, File 9793. "Nastymix Records party celebrates Gold Record awarded to Sir Mix-A-Lot's SWASS album, April 29, 1989."
12. HistoryLink.org, File 9794. "Nastymix Records hosts fifth Anniversary party, November 29, 1990."
13. MOHAI. "The Legacy of Seattle Hip-Hop." Exhibit page, 2015-2016. [Primary archival documentation]
14. AASLH. "The Legacy of Seattle Hip-Hop." Case study, 2018. [Institutional documentation of exhibit impact]
15. GSD Ecosystem. "Chipset Architecture: One Chip, One Job." Internal documentation, 2026.
16. Seattle Times Archive. June 3, 1990. "A Mix Bag -- Seattle's Nastymix Records Is Becoming a Key Player..."
17. Module 05 Split Analysis. Success Criteria section. March 2026. [Independence testing methodology]
18. Module 05 Split Analysis. Wave Execution Plan. March 2026. [Parallel execution validation]
19. Conway, M. E. "How Do Committees Invent?" *Datamation*, 14(4), 1968, pp. 28-31. [Conway's Law -- organizational mirrors]
20. Braudel, F. *The Mediterranean and the Mediterranean World in the Age of Philip II.* 1949, trans. 1972. [Long-duration temporal analysis methodology]
21. McConnell, S. *Code Complete: A Practical Handbook of Software Construction.* Microsoft Press, 2nd ed., 2004. [Module sizing as symptom analysis]
22. Signal & Light project (SGL). Module 06: MIDI & Control Protocols, 607 lines. 2026. [Long module, single frame example]
23. Fowler, M. *Refactoring: Improving the Design of Existing Code.* Addison-Wesley, 2nd ed., 2018. [Short-but-incoherent pattern]
24. Module 05 Split Analysis. Research Reference, Track MA-MG summary. March 2026.
25. Seattle Hip-Hop Cultural Series. Module line count survey. March 2026. [Empirical frame-count correlation]
26. GSD Ecosystem. "The 1.8x Rule: Empirical Split Signal in Module Architecture." Internal analysis, 2026.
27. Module 05 Split Analysis. Vision section, "One Zip Code, Two Stories." March 2026.
28. Humanities Washington / Spark. "How the Northwest Shocked the Hip-hop World." January 20, 2022.
29. GSD Ecosystem. "Cross-Reference Contracts: Maintaining Coherence Across Split Modules." 2026.
30. Boehm, B. W. "A Spiral Model of Software Development and Enhancement." *Computer*, 21(5), 1988, pp. 61-72. [Cost-benefit framework for design decisions]
31. Module 05 Split Analysis. Scope Boundaries section. March 2026. [Split/keep heuristic]
32. GSD Ecosystem. "Five-Stage Split Decision Framework." Internal methodology, 2026.
33. Module 05 Split Analysis. Chipset Configuration. March 2026. [Module-to-track mapping]
34. Dijkstra, E. W. "The Structure of the 'THE' Multiprogramming System." *Communications of the ACM*, 11(5), 1968, pp. 341-346. [Layered system decomposition]
35. McIlroy, M. D. "A Research UNIX Reader: Annotated Excerpts from the Programmer's Manual, 1971-1986." Bell Labs, 1987. [Unix philosophy]
36. Martin, R. C. *Agile Software Development: Principles, Patterns, and Practices.* Prentice Hall, 2003. [Single Responsibility Principle]
37. Conway, M. E. "How Do Committees Invent?" *Datamation*, 14(4), 1968. [Organizational mirroring in design]
38. Booth, W. C., Colomb, G. G., Williams, J. M. *The Craft of Research.* University of Chicago Press, 4th ed., 2016. [Research structure methodology]
39. Day, R. A. *How to Write and Publish a Scientific Paper.* Greenwood Press, 6th ed., 2006. [Journal article scope norms]
40. Society of American Archivists. "Describing Archives: A Content Standard (DACS)." 2nd ed., 2013. [Provenance-based collection organization]
41. Alexander, C. "The Quality Without a Name." In *The Timeless Way of Building.* Oxford University Press, 1979. [Universal design coherence principle]
42. Miner, J. et al. Amiga Custom Chipset Architecture. Commodore-Amiga, 1985. [Specialized execution path design]
43. GSD Ecosystem. "Module 05 Split: Applying the Amiga Principle to Historical Research." Analysis, 2026.
44. GSD Ecosystem. "The Amiga Principle Is Not Nostalgia." Architectural documentation, 2026.
