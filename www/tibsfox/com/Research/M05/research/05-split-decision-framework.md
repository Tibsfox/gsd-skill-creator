# The Split Decision Framework

> **Domain:** Structural Analysis & Module Architecture
> **Module:** 5 -- The Complete Decision Tree, Verification Matrix, and the Module 05 Case Study
> **Through-line:** *The framework does not decide for you. It organizes the evidence so the decision makes itself.* Five diagnostic stages, four verification categories, twenty test cases. When all signals point the same direction, the architecture is telling you what it needs. Module 05 said "split me" in every diagnostic. The framework's job was to listen.

---

## Table of Contents

1. [Framework Overview](#1-framework-overview)
2. [Stage 1: Frame Count Diagnostic](#2-stage-1-frame-count-diagnostic)
3. [Stage 2: Source Pool Bifurcation](#3-stage-2-source-pool-bifurcation)
4. [Stage 3: Success Criteria Independence](#4-stage-3-success-criteria-independence)
5. [Stage 4: Size Validation](#5-stage-4-size-validation)
6. [Stage 5: Cross-Reference Complexity](#6-stage-5-cross-reference-complexity)
7. [The Verification Matrix: The Split Report](#7-the-verification-matrix-the-split-report)
8. [The Module 05 Case Study: Complete Walkthrough](#8-the-module-05-case-study-complete-walkthrough)
9. [Applying the Framework to Other Domains](#9-applying-the-framework-to-other-domains)
10. [Edge Cases and Judgment Calls](#10-edge-cases-and-judgment-calls)
11. [Framework Limitations and When to Override](#11-framework-limitations-and-when-to-override)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. Framework Overview

The Split Decision Framework is a five-stage diagnostic that evaluates whether a module should be decomposed into two or more focused modules. It is designed to be run sequentially: each stage narrows the diagnosis, and the process terminates early if any stage signals KEEP [1].

```
SPLIT DECISION FRAMEWORK -- OVERVIEW
================================================================

  STAGE 1: Frame Count
    |-- 1 frame --> KEEP (stop)
    |-- 2+ frames --> proceed
         |
  STAGE 2: Source Pool Bifurcation
    |-- Messy partition --> KEEP (stop)
    |-- Clean partition --> proceed
         |
  STAGE 3: Success Criteria Independence
    |-- Interdependent --> KEEP (stop)
    |-- Independent --> proceed
         |
  STAGE 4: Size Validation (post-split estimate)
    |-- One/both too thin --> KEEP (stop)
    |-- Both in range --> proceed
         |
  STAGE 5: Cross-Reference Complexity
    |-- Complex (5+ refs) --> KEEP (stop)
    |-- Simple (1-2 refs) --> SPLIT

  RESULT: SPLIT only if all 5 stages pass
  CONFIDENCE: Count the number of stages that signal SPLIT
    5/5: Split with high confidence
    4/5: Split with moderate confidence (review the failing stage)
    3/5: Consider carefully (may be a borderline case)
    <3/5: KEEP -- insufficient evidence for split
```

The framework is conservative by design. It requires affirmative evidence at every stage. The null hypothesis is KEEP -- the module stays as-is unless the evidence demonstrates that a split would produce architecturally superior results [2].

> **Related:** [When and Why to Split](01-when-and-why-to-split.md) for the conceptual foundation, [Cohesion Analysis](03-cohesion-analysis.md) for the measurement tools

---

## 2. Stage 1: Frame Count Diagnostic

**Question:** How many distinct analytical frames does this module contain?

An analytical frame is defined by four components:
1. **Central question:** What is this section trying to answer?
2. **Primary methodology:** How does this section investigate its question?
3. **Source type:** What kind of evidence does this section rely on?
4. **Success measure:** How do we know this section succeeded? [3]

### Execution

For each major section of the module, identify the analytical frame:

| Section | Central Question | Methodology | Source Type | Success Measure |
|---------|-----------------|-------------|-------------|----------------|
| (fill in per section) | | | | |

Count the number of distinct frames. A frame is "distinct" if it differs from another frame on two or more of the four components.

### Decision

- **1 frame:** KEEP. The module is well-scoped. Stop.
- **2 frames:** SPLIT signal. Proceed to Stage 2.
- **3+ frames:** Strong SPLIT signal. The module may need three-way decomposition [4].

### Module 05 Stage 1 Results

| Section | Central Question | Methodology | Source Type | Success Measure |
|---------|-----------------|-------------|-------------|----------------|
| Label founding | How was NastyMix founded? | Business timeline | HistoryLink, Seattle Times | Four founders documented |
| NW Roster | Who were the regional artists? | Artist profiling | Emerald Street, Good Ol'Dayz | Profiles with context |
| National Roster | Who were the national signings? | Artist profiling | Seattle Times 1990 | Profiles with context |
| Business Arc | What was the business trajectory? | Timeline reconstruction | HistoryLink, Seattle Times | Dated milestones sourced |
| CD Spatial | Where are the key sites? | Spatial mapping | Emerald Street, Globalist | Sites with addresses |
| MOHAI | What did the exhibit document? | Archival analysis | MOHAI page, AASLH | Exhibit details verified |
| Gentrification | What happened to the neighborhood? | Demographic analysis | MOHAI/AASLH, UW CRL&HP | Data points sourced |

**Frame count: 2** (Industry frame: sections 1-4; Geography frame: sections 5-7)
**Signal: SPLIT. Proceed to Stage 2.** [5]

---

## 3. Stage 2: Source Pool Bifurcation

**Question:** Can the module's bibliography be partitioned into two non-overlapping groups, each supporting a different analytical frame?

### Execution

1. List all sources cited in the module
2. For each source, assign it to the frame it primarily supports
3. Check for orphans (sources that cannot be cleanly assigned)
4. Check for bridge sources (sources cited by both frames) [6]

### Decision

- **Clean partition (0-2 bridge sources, 0 orphans):** SPLIT signal. Proceed.
- **Messy partition (3+ bridge sources or any orphans):** KEEP. The source pool is too interleaved [7].

### Module 05 Stage 2 Results

| Source | Frame Assignment | Type |
|--------|-----------------|------|
| HistoryLink 9793 (Gold Party) | Industry | Clean |
| HistoryLink 9794 (Fifth Anniversary) | Industry | Clean |
| Seattle Times June 1990 | Industry | Clean |
| Seattle Times October 1992 | Industry | Clean |
| Humanities Washington/Spark | Industry | Clean |
| Blackpast.org | Industry | Clean |
| Good Ol'Dayz | Industry | Clean |
| Town Love/Crane City | Industry | Clean |
| Seattle Times Nov 2024 (Nes) | Industry | Clean |
| New Nastymix Records | Industry | Clean |
| MOHAI exhibit page | Geography | Clean |
| AASLH case study | Geography | Clean |
| UW CRL&HP | Geography | Clean |
| Arte Noir/Emerald Street | Geography | Clean |
| Seattle Globalist | Geography | Clean |
| TheGrio | Geography | Clean |
| The Root | Geography | Clean |
| **Daudi Abe, Emerald Street** | **Both** | **Bridge** |
| **Rotary Boys & Girls Club** | **Both** | **Bridge** |

**Bridge sources: 2 (Emerald Street, shared origin)**
**Orphaned sources: 0**
**Signal: SPLIT (clean partition, 2 bridge sources).** Proceed to Stage 3 [8].

---

## 4. Stage 3: Success Criteria Independence

**Question:** Can the module's success criteria be grouped into independent sets, where satisfying one set does not require satisfying the other?

### Execution

1. List all success criteria for the module
2. Assign each criterion to a frame
3. Test independence: could the module fully satisfy one set while failing the other? [9]

### Decision

- **Independent sets (each set testable without the other):** SPLIT signal. Proceed.
- **Interdependent (criteria from different frames require each other):** KEEP [10].

### Module 05 Stage 3 Results

| Criterion | Frame | Independent? |
|-----------|-------|-------------|
| Both modules land 280-320 lines | Both (meta) | N/A |
| Full roster with 2+ sentence profiles | Industry | Yes |
| Business arc traceable as dated timeline | Industry | Yes |
| MOHAI exhibit documented at full detail | Geography | Yes |
| Gentrification arc with 3+ sourced data points | Geography | Yes |
| Founding moment cross-reference in both | Relational | Yes (post-split) |
| All roster claims cross-referenced to Emerald Street | Industry | Yes |
| Nes Rodriguez preservation note handled appropriately | Industry | Yes |

**Independence test:** The module could document the complete roster (industry criteria satisfied) while having zero gentrification data points (geography criteria failed). The criteria are fully independent.

**Signal: SPLIT. Proceed to Stage 4.** [11]

---

## 5. Stage 4: Size Validation

**Question:** After the split, would both resulting modules fall within the series size range?

### Execution

1. Estimate the line count for each resulting module
2. Compare against the series Goldilocks Zone (0.8x to 1.3x of median)
3. Verify neither module would be a stub (<0.5x median) [12]

### Decision

- **Both in Goldilocks Zone:** SPLIT signal. Proceed.
- **One or both below 0.5x median:** KEEP. The split produces stubs.
- **One or both between 0.5x and 0.8x:** Review. Marginal case [13].

### Module 05 Stage 4 Results

Series median: 295 lines. Goldilocks Zone: 236-384 lines.

| Module | Estimated Lines | Zone | Status |
|--------|----------------|------|--------|
| 05a (NastyMix Label) | ~300 | Goldilocks (1.02x) | In range |
| 05b (CD Place Memory) | ~300 | Goldilocks (1.02x) | In range |

Both modules land almost exactly at the series median. This is structural confirmation that the original 613-line module was two ~300-line modules fused.

**Signal: SPLIT. Proceed to Stage 5.** [14]

---

## 6. Stage 5: Cross-Reference Complexity

**Question:** How complex is the cross-reference contract needed to maintain coherence between the split modules?

### Execution

1. Identify the shared origin points (events, persons, places)
2. Count the bidirectional references needed
3. Assess whether the narrative requires sequential reading [15]

### Decision

- **Simple contract (1-2 shared origins, 1-2 bidirectional refs, no sequential requirement):** SPLIT.
- **Moderate contract (3-4 refs):** Review. May be manageable.
- **Complex contract (5+ refs, sequential reading required):** KEEP. The subjects are more intertwined than the frame count suggests [16].

### Module 05 Stage 5 Results

| Element | Count | Assessment |
|---------|-------|-----------|
| Shared origin points | 1 (Rotary Boys & Girls Club, 1985) | Simple |
| Bidirectional references | 2 (direction refs in each module) | Simple |
| Shared sources | 2 (Emerald Street, shared origin) | Simple |
| Sequential reading required | No (each module stands alone) | Simple |

**Cross-reference contract complexity: SIMPLE**
**Signal: SPLIT.** [17]

### Framework Final Result

| Stage | Signal | Confidence |
|-------|--------|-----------|
| 1. Frame count | SPLIT (2 frames) | High |
| 2. Source bifurcation | SPLIT (clean, 2 bridges) | High |
| 3. Criteria independence | SPLIT (fully independent) | High |
| 4. Size validation | SPLIT (both 1.02x median) | High |
| 5. Cross-ref complexity | SPLIT (simple contract) | High |
| **Overall** | **SPLIT (5/5)** | **Very high** |

This is a textbook split candidate. All five stages signal SPLIT with high confidence [18].

---

## 7. The Verification Matrix: The Split Report

The verification matrix -- "The Split Report" -- is the formal record of the split decision and the validation tests that confirm it was executed correctly [19].

### Test Categories

| Category | Count | Priority | Action on Failure |
|----------|-------|----------|-------------------|
| Safety-Critical | 4 | Mandatory | BLOCK: do not deliver |
| Scholarly Authority | 4 | Mandatory | BLOCK: do not deliver |
| Core Functionality | 8 | High | Revise before delivery |
| Integration | 4 | Medium | Note and flag |
| **Total** | **20** | | |

### Safety-Critical Tests (BLOCK)

| ID | Verifies | Expected Result |
|----|----------|----------------|
| SC-01 | No undocumented financial claims | All dollar figures and sales numbers attributed to HistoryLink or Seattle Times or Abe |
| SC-02 | Nes Rodriguez health note | Note included as preservation urgency, not exploited as tragedy narrative |
| SC-03 | Gentrification data sourced | All demographic percentages attributed to MOHAI/AASLH documentation |
| SC-04 | QTPOC Legacy exhibit content | Panel content presented from community-curated framing; not flattened or summarized |

### Scholarly Authority Tests (BLOCK)

| ID | Verifies | Expected Result |
|----|----------|----------------|
| SA-01 | Emerald Street cross-reference | All formation-era roster claims cross-referenced against Abe (2020) |
| SA-02 | HistoryLink primary sourcing | Gold Party (1989) and Fifth Anniversary (1990) sourced to files 9793, 9794 |
| SA-03 | MOHAI exhibit accuracy | Dates, curators, partnerships, awards match MOHAI page and AASLH documentation |
| SA-04 | UW Civil Rights for redlining | Redlining and restrictive covenant claims reference UW CRL&HP bibliography |

### Core Functionality Tests

| ID | Verifies | Expected Result |
|----|----------|----------------|
| CF-01 | Module 05a line count | 280-320 lines, within series Goldilocks Zone |
| CF-02 | Module 05b line count | 280-320 lines, within series Goldilocks Zone |
| CF-03 | Roster completeness | Every NastyMix artist has 2+ sentence contextual profile |
| CF-04 | Business arc traceability | Timeline: founding -> breakout -> peak -> expansion -> collapse, all dated |
| CF-05 | MOHAI exhibit documentation | Curators, duration, partnerships, attendee count, AASLH award year |
| CF-06 | Gentrification data points | At least 3 demographic data points with sources |
| CF-07 | CAPCOM review | Both modules pass human review before commit |
| CF-08 | Cohesion dominance | Both modules >= 0.9 on dominance test |

### Integration Tests

| ID | Verifies | Expected Result |
|----|----------|----------------|
| INT-01 | Founding moment cross-ref | Both modules cite Rotary Boys & Girls Club origin |
| INT-02 | Wave plan updated | 05a and 05b as parallel Wave 1 tracks |
| INT-03 | Cluster alignment | 05a in Music Industry, 05b in Community Heritage |
| INT-04 | Series navigation | Both modules appear in series index and navigation |

### The Split Report Summary

```
THE SPLIT REPORT -- MODULE 05 DECOMPOSITION
================================================================

  Original Module: Module 05 (NastyMix Records & CD Place Memory)
  Original Length: 613 lines (2.08x series median)
  Diagnosis: Category error -- two analytical frames fused
  Decision: SPLIT (5/5 framework stages passed)

  RESULTING MODULES:
    05a: NastyMix Label Ecosystem (Music Industry cluster)
         Target: 280-320 lines
         Frame: Music industry economics
         Sources: HistoryLink, Seattle Times, Emerald Street
         Tracks: MA, MB, MC, MD

    05b: Central District Place Memory (Community Heritage cluster)
         Target: 280-320 lines
         Frame: Cultural geography
         Sources: MOHAI, UW CRL&HP, AASLH
         Tracks: ME, MF, MG

  CROSS-REFERENCE CONTRACT:
    Shared origin: Rotary Boys & Girls Club, 1985
    Bridge sources: Emerald Street (Abe, 2020)
    Direction refs: 2 (one per module)
    Complexity: Simple

  VERIFICATION:
    Total tests: 20
    Safety-critical (BLOCK): 4
    Scholarly authority (BLOCK): 4
    Core functionality: 8
    Integration: 4

  ARCHITECTURAL IMPROVEMENT:
    Cohesion: Temporal (3/7) --> Functional (7/7)
    LCOM: +3 --> 0 (both modules)
    Coupling: Dual-cluster --> Single-cluster each
    Parallelism: Serial bottleneck --> 2 parallel tracks
    Dominance: 0.67/0.48 --> 1.0/1.0
```

> **Related:** [GSD2](../GSD2/index.html) for verification matrix patterns, [ACE](../ACE/index.html) for test category design

---

## 8. The Module 05 Case Study: Complete Walkthrough

This section traces the complete lifecycle of the Module 05 split, from initial detection through verification [20].

### Detection

The "What Could Be Better" review of the Seattle Hip-Hop Cultural Series identified Module 05 as the longest single module (613 lines), nearly double the series median. The length was flagged as a structural concern [21].

### Diagnosis

The five-stage framework was applied:
- Frame count: 2 (industry + geography)
- Source bifurcation: Clean (2 bridge sources)
- Criteria independence: Full (no cross-frame dependencies)
- Size validation: Both modules at 1.02x median
- Cross-ref complexity: Simple (1 shared origin, 2 direction refs) [22]

### Design

The mission package specified:
- Module 05a: NastyMix Label Ecosystem (tracks MA-MD, music industry cluster)
- Module 05b: Central District Place Memory (tracks ME-MG, community heritage cluster)
- Cross-reference contract at the Rotary Boys & Girls Club founding moment
- Parallel execution in Wave 1 [23]

### The Through-Line Connection

The split analysis itself demonstrates the Amiga Principle: specialized analytical frames, faithfully executed in dedicated containers, produce better results than a general-purpose container that tries to serve both. The label story gets the business depth it needs. The place story gets the geographic and archival depth it needs. Neither story compromises the other [24].

### Lessons Learned

1. **Line count is the signal, not the problem.** The 613-line overshoot was the alarm bell. The category error was the fire.
2. **Shared origin does not imply shared container.** The Rotary Boys & Girls Club founding moment connects the stories. It does not require them to cohabitate.
3. **The split enables parallelism.** Two 300-line modules running in parallel execute faster than one 600-line module running serially.
4. **Clean source partition confirms the split.** When the bibliography divides without orphans, the analytical frames are truly independent.
5. **The framework removes subjectivity.** Five diagnostic stages, quantitative metrics at each stage, binary signals. The decision makes itself [25].

---

## 9. Applying the Framework to Other Domains

The Split Decision Framework was developed for the Seattle Hip-Hop Cultural Series but applies to any modular research system [26].

### Software Documentation

A software architecture document that covers both the system's runtime behavior and its deployment architecture may be a split candidate. The runtime story and the deployment story use different diagrams, different tools, and different success criteria [27].

### Technical Research

A DSP research module that covers both the mathematical foundations and the FPGA implementation may be well-scoped (sequential cohesion: math feeds implementation) or may be a split candidate (if the math and the silicon are independent analytical frames). The framework's Stage 1 distinguishes these cases [28].

### Historical Research

A history module that covers both a person's career and the social context of their era is almost always a split candidate. The career story (biographical frame) and the era story (social history frame) use different sources, different methodologies, and different success measures [29].

### The Domain-Invariant Principle

Across all domains, the core insight is the same: **one container, one analytical frame.** The specific diagnostics (frame count, source bifurcation, criteria independence) apply universally. The thresholds (line count ratios, LCOM scores) are domain-specific and should be calibrated to the series context [30].

---

## 10. Edge Cases and Judgment Calls

Not all split decisions are clean 5/5 signals. Some modules fall in gray zones where the framework provides evidence but not a definitive answer [31].

### Edge Case 1: The 4/5 Split

Four stages signal SPLIT but one signals KEEP. Common scenario: cross-reference complexity is moderate (3-4 refs). In this case, proceed with the split but invest extra effort in the cross-reference contract design [32].

### Edge Case 2: The Bridge-Heavy Source Pool

Stage 2 produces 3-4 bridge sources (sources cited by both frames). This may indicate that the frames are more intertwined than the frame count suggests. Run the LCOM metric (Module 3) to check whether the source pairs cluster cleanly [33].

### Edge Case 3: The Thin Half

Stage 4 shows one resulting module in range but the other below the 0.8x threshold. Options:
- Expand the thin module with additional research to bring it into range
- Keep the module fused if expansion would be artificial padding
- Split anyway if the thin module still maintains functional cohesion [34]

### Edge Case 4: The Narrative Dependency

Stage 5 reveals that readers need to read Module A before Module B to understand the argument. This is control coupling, not stamp coupling. The modules may need to be scheduled sequentially rather than in parallel, and the cross-reference contract needs a "read order" specification [35].

### Edge Case 5: The Three-Way Split

Stage 1 identifies three analytical frames. Apply the framework pairwise: can frames 1+2 be separated? Can frames 2+3? The cleanest partition produces the best architecture. Three-way splits are rare but valid when all three frames have independent source pools and success criteria [36].

---

## 11. Framework Limitations and When to Override

The framework is a diagnostic tool, not a decision engine. It organizes evidence; a human makes the decision. Override the framework when [37]:

### Override 1: Political/Organizational Constraints

If the series has a fixed module count (e.g., "12 modules, one per chapter"), splitting module 05 produces 13 modules. The framework says SPLIT; the organizational constraint says KEEP. Resolve by discussing with the series editor whether the constraint is structural or cosmetic [38].

### Override 2: Audience Expectations

If the audience expects a single comprehensive module on "NastyMix and the Central District," splitting may confuse navigation even though it improves architecture. Balance architectural purity against audience usability [39].

### Override 3: Resource Constraints

If the split would produce two modules that each need substantial new research, and resources are limited, it may be pragmatically better to keep the fused module and flag it for future decomposition [40].

### Override 4: Interdisciplinary Value

Sometimes a fused module has value precisely because it juxtaposes two frames that are usually separated. If the juxtaposition produces insights that neither frame alone would generate, the fusion has analytical merit that the framework's cohesion metrics don't capture [41].

### The Override Test

Before overriding, ask: "Am I overriding because the framework is wrong about the architecture, or because external constraints make the correct architecture impractical?" If the former, revisit the diagnostic. If the latter, document the constraint and flag the module for future split when the constraint changes [42].

> **Related:** [GSD2](../GSD2/index.html) for decision framework override protocols, [COK](../COK/index.html) for knowledge architecture constraints

---

## 12. Cross-References

| Topic | Appears In | Related Projects |
|-------|-----------|-----------------|
| Five-stage diagnostic | M1, M5 | GSD2, ACE |
| Frame count diagnostic | M1, M5 | GSD2, COK |
| Source pool bifurcation | M2, M5 | PMG, CDL |
| Success criteria independence | M3, M5 | GSD2, MPC |
| Size validation | M2, M5 | GSD2, CMH |
| Cross-reference complexity | M4, M5 | CMH, PMG |
| Verification matrix | M5 | GSD2, ACE |
| The Split Report | M5 | GSD2, MPC |
| Module 05 case study | M1-M5 | CDS, MIX |
| Domain-invariant principle | M1, M5 | GSD2, COK |
| Edge cases | M5 | GSD2, ACE |
| Framework overrides | M5 | GSD2, COK |

---

## 13. Sources

1. GSD Ecosystem. "Split Decision Framework: Five-Stage Diagnostic." Internal methodology, 2026.
2. GSD Ecosystem. "Conservative Design: The Null Hypothesis Is KEEP." Architecture principle, 2026.
3. GSD Ecosystem. "Analytical Frame Definition: Four Components." Methodology, 2026.
4. Module 05 Split Analysis. Vision Document, Research Modules MA-MG. March 2026.
5. Module 05 Split Analysis. Problem Statement, items 1-5. March 2026. [Frame count evidence]
6. GSD Ecosystem. "Source Pool Bifurcation Protocol." Internal methodology, 2026.
7. Module 05 Split Analysis. Source Bibliography. March 2026. [Partition data]
8. Module 05 Split Analysis. Research Reference section. March 2026. [Detailed source assignments]
9. GSD Ecosystem. "Success Criteria Independence Testing." Methodology, 2026.
10. Module 05 Split Analysis. Success Criteria section. March 2026.
11. Module 05 Split Analysis. Verification Matrix. March 2026. [Independence confirmation]
12. GSD Ecosystem. "Post-Split Size Estimation." Methodology, 2026.
13. Module 05 Split Analysis. Deliverables section. March 2026.
14. Module 05 Split Analysis. Component Breakdown. March 2026. [Size estimates]
15. GSD Ecosystem. "Cross-Reference Complexity Assessment." Methodology, 2026.
16. Module 05 Split Analysis. Integration section. March 2026.
17. Module 05 Split Analysis. Chipset Configuration. March 2026. [Cross-ref inventory]
18. Module 05 Split Analysis. Execution Summary. March 2026. [Framework final results]
19. GSD Ecosystem. "The Split Report: Verification Matrix Template." Standard, 2026.
20. Module 05 Split Analysis. Complete document. March 2026. [Source material for case study]
21. Module 05 Split Analysis. Vision, Problem Statement. March 2026. [Detection narrative]
22. Module 05 Split Analysis. Vision through Mission Package. March 2026. [Full diagnostic results]
23. Module 05 Split Analysis. Milestone Specification. March 2026. [Design decisions]
24. GSD Ecosystem. "The Amiga Principle in Research Architecture." 2026. [Through-line connection]
25. GSD Ecosystem. "Module 05 Split: Lessons Learned." Analysis, 2026.
26. GSD Ecosystem. "Domain-Invariant Split Framework." Generalization, 2026.
27. Bass, L., Clements, P., Kazman, R. *Software Architecture in Practice.* 4th ed., 2021. [Architecture documentation patterns]
28. Signal & Light project (SGL). Module structure analysis. 2026. [Technical module split assessment]
29. Booth, W. C. et al. *The Craft of Research.* 4th ed., 2016. [Historical research chapter structure]
30. Parnas, D. L. "On the Criteria to Be Used in Decomposing Systems into Modules." *CACM*, 1972. [Universal decomposition criteria]
31. GSD Ecosystem. "Edge Cases in the Split Decision Framework." Analysis, 2026.
32. GSD Ecosystem. "The 4/5 Split: Managing Moderate-Confidence Decisions." 2026.
33. Chidamber, S. R., Kemerer, C. F. "A Metrics Suite for Object Oriented Design." *IEEE TSE*, 1994. [LCOM for bridge-heavy pools]
34. GSD Ecosystem. "The Thin Half Problem: Expand, Keep, or Split Anyway." Decision guide, 2026.
35. Myers, G. J. *Composite/Structured Design.* 1978. [Control coupling and read order]
36. GSD Ecosystem. "Three-Way Splits: Pairwise Framework Application." 2026.
37. GSD Ecosystem. "Framework Override Protocol." Decision guide, 2026.
38. Brooks, F. P. *The Mythical Man-Month.* 1975, 1995. [Organizational constraints on architecture]
39. Krug, S. *Don't Make Me Think.* 3rd ed., 2014. [Audience navigation expectations]
40. Boehm, B. W. "A Spiral Model." *Computer*, 1988. [Resource-constrained design decisions]
41. Kuhn, T. S. *The Structure of Scientific Revolutions.* 3rd ed., 1996. [Interdisciplinary frame value]
42. GSD Ecosystem. "The Override Test: Architecture vs. Constraint." Decision protocol, 2026.
