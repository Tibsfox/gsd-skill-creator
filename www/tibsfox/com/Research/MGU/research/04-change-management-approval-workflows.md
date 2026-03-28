# Change Management & Approval Workflows

> **Domain:** Software Process Engineering & Operational Governance
> **Module:** 4 -- Promotion Pipelines, Size Contracts, and Document Class Boundaries
> **Through-line:** *The right container for the right content. A research module that knows it is a research module, and a specification that knows it is a specification, will compose more cleanly than either pretending to be the other.* Module 05 at 706 lines was not broken -- it was mishoused. The content was correct; the container was wrong. Change management in a modular system is partly about changing the content and partly about recognizing when the content has outgrown its container. Promotion is not a failure of the original container; it is a success of the content that demands a better home.

---

## Table of Contents

1. [The Promotion Problem](#1-the-promotion-problem)
2. [Document Class Taxonomy](#2-document-class-taxonomy)
3. [Size Contracts as Governance Instruments](#3-size-contracts-as-governance-instruments)
4. [The Promotion Pipeline](#4-the-promotion-pipeline)
5. [Pointer Reference Architecture](#5-pointer-reference-architecture)
6. [Content Integrity During Promotion](#6-content-integrity-during-promotion)
7. [Audit Methodologies for Existing Modules](#7-audit-methodologies-for-existing-modules)
8. [Governance Documents as Living Artifacts](#8-governance-documents-as-living-artifacts)
9. [Case Study: Module 05 Bridge Architecture](#9-case-study-module-05-bridge-architecture)
10. [Cross-References](#10-cross-references)
11. [Sources](#11-sources)

---

## 1. The Promotion Problem

When a module grows beyond the bounds of its container, the system faces a classification decision: should the content be compressed to fit, or should the container be upgraded to match? This is the promotion problem [1].

Compression destroys information. A 706-line research module compressed to 400 lines loses 306 lines of content -- content that someone wrote because it was necessary. The interfaces, the diagrams, the token budget analysis -- these are not padding. They are the substance that makes the module useful to implementing agents.

Promotion preserves information by moving the content to a container designed for its size and complexity. The original container is replaced with a pointer -- a lightweight navigation artifact that tells consumers where the content now lives.

```
THE PROMOTION DECISION TREE
================================================================

  Module exceeds size contract
       |
       +-- Is the excess content necessary?
       |        |
       |        +-- NO  --> Trim (remove padding, redundancy)
       |        |
       |        +-- YES --> Content type assessment
       |                        |
       |                        +-- Survey content?
       |                        |     |
       |                        |     +-- Split into multiple survey modules
       |                        |
       |                        +-- Spec content?
       |                              |
       |                              +-- PROMOTE to standalone spec
       |                              |
       |                              +-- Replace with pointer module
```

The promotion problem is not unique to research modules. It appears in every modular system where content evolves independently of container boundaries:

- **Microservices:** A service that grows too complex is decomposed into multiple services.
- **Database tables:** A table that accumulates too many columns is normalized into related tables.
- **Configuration files:** A config file that grows too large is split into domain-specific files.
- **Documentation:** A README that grows to 2000+ lines is decomposed into a documentation directory.

The pattern is universal: containers have optimal sizes, and content that outgrows its container should be promoted, not compressed [2].

> **Related:** [GSD2](../GSD2/), [PMG](../PMG/), [COK](../COK/)

---

## 2. Document Class Taxonomy

A document class taxonomy defines the types of documents in an ecosystem, their purposes, their size ranges, and their consumers. Without a taxonomy, documents accumulate without structure, and the promotion problem becomes invisible until it causes operational friction [1].

### GSD Document Classes

| Class | Purpose | Size Range | Consumer | Example |
|-------|---------|------------|----------|---------|
| Research module | Survey and orientation | 150-400 lines | Any agent seeking context | Module 01: DSP Algorithms |
| Standalone spec | Construction reference | 200+ lines (unbounded) | Implementing agent | bridge-architecture-spec.pdf |
| Vision document | Strategic direction | 100-300 lines | Planning agent, human stakeholders | Mission pack Stage 1 |
| Pointer module | Navigation artifact | 40-120 lines | Agent following a reference | Module 05 pointer |
| Mission pack | Complete execution plan | 500-1000 lines | Orchestrator agent | SGL mission pack |
| Governance document | Policy and contracts | 100-400 lines | All agents, human reviewers | GOVERNANCE.md |
| Audit report | Compliance assessment | 100-300 lines | Governance reviewer | audit-report.md |

### Class Boundaries as Contracts

Each document class carries a contract with its consumers. A research module consumer expects a survey: "here is what exists, here is the evidence, here is enough context to act." A standalone spec consumer expects a construction reference: "here are the interfaces, here are the contracts, here is the budget" [1].

When a document violates its class contract -- a research module that reads like a spec, or a spec that reads like a survey -- consumers receive the wrong signal about what they are reading. This mismatch costs tokens (agents process content they don't need) and introduces errors (agents treat survey content as authoritative specification) [1].

```
CLASS CONTRACTS -- CONSUMER EXPECTATIONS
================================================================

  Research Module:
    Consumer expects: Evidence, context, orientation
    Consumer does NOT expect: Interfaces, contracts, budgets
    If violated: Agent treats survey as spec → false precision

  Standalone Spec:
    Consumer expects: Interfaces, contracts, budgets
    Consumer does NOT expect: Extended literature review
    If violated: Agent treats spec as survey → missing requirements

  Pointer Module:
    Consumer expects: Path, digest, summary, reference table
    Consumer does NOT expect: Technical content
    If violated: Agent processes content instead of following pointer
```

> **Related:** [GSD2](../GSD2/), [MCF](../MCF/), [ACE](../ACE/)

---

## 3. Size Contracts as Governance Instruments

A size contract is a quantitative boundary on a document class that triggers governance actions when violated. Size contracts serve two purposes [1]:

1. **Cognitive load management:** Research modules are consumed as context by agents with finite context windows. A 400-line module fits within a single context load; a 706-line module forces the agent to either truncate or allocate disproportionate context to a single document.

2. **Classification signal:** Exceeding the size contract is a signal that the content may have crossed a class boundary. The signal triggers an assessment, not an automatic action.

### Contract Definitions

| Document Class | Minimum | Maximum | Violation Response |
|---------------|---------|---------|-------------------|
| Research module | 150 lines | 400 lines | Below: FAIL (too thin). Above: PROMOTE assessment |
| Standalone spec | 200 lines | No limit | Below: WARN (is this really a spec?) |
| Vision document | 100 lines | 300 lines | Below: FAIL. Above: Extract to appendix |
| Pointer module | 40 lines | 120 lines | Below: FAIL (missing fields). Above: TRIM |
| Mission pack | 500 lines | 1000 lines | Above: Split into modules |
| Governance document | 100 lines | 400 lines | Above: Extract appendices |

### Enforcement Modes

Size contracts can be enforced at different levels of strictness:

- **Advisory:** Log the violation but allow publication. Appropriate during early adoption.
- **Gate:** Block publication until the violation is resolved. Appropriate for mature systems.
- **Automatic:** Trigger promotion or split automatically based on contract rules. Appropriate only for well-tested rules with clear promotion targets.

The GSD ecosystem uses the gate mode: violations are detected during the governance gate (CI check), and the orchestrator must resolve them before the module can be published [1].

> **Related:** [GSD2](../GSD2/), [COK](../COK/), [ACE](../ACE/)

---

## 4. The Promotion Pipeline

The promotion pipeline is the process by which content moves from one document class to another. It is a structured transformation, not a copy-paste operation [1, 3].

### Pipeline Stages

```
PROMOTION PIPELINE -- RESEARCH MODULE TO STANDALONE SPEC
================================================================

  Stage 1: DETECTION
    ├── Size contract violation detected (>400 lines)
    ├── OR content marker scan triggered
    └── Governance gate flags module for assessment

  Stage 2: ASSESSMENT
    ├── Human (CRAFT-SPEC) reviews content
    ├── Determines: is this genuinely spec-level content?
    ├── If YES → proceed to Stage 3
    └── If NO  → trim and refactor within research module

  Stage 3: EXTRACTION
    ├── Full content extracted from research module container
    ├── Content integrity verified (line count, section count)
    └── No content modification during extraction

  Stage 4: REFRAMING
    ├── Standalone spec container created
    ├── Purpose statement, scope, version header added
    ├── Document index entry created
    └── GSD spec document structure applied

  Stage 5: POINTER CREATION
    ├── Original module replaced with pointer
    ├── Pointer contains: path, digest, summary, reference table
    ├── Digest computed from compiled spec
    └── Pointer line count verified (40-120 lines)

  Stage 6: VALIDATION
    ├── Content integrity: all original content present in spec
    ├── Pointer integrity: digest matches spec
    ├── Cross-reference integrity: no broken links
    └── HITL approval (CAPCOM)
```

### Promotion Triggers

Six qualitative markers trigger a promotion assessment, independent of line count:

1. **TypeScript or Rust interface/type definitions** -- These are construction artifacts, not survey content.
2. **Token budget tables with per-operation cost modeling** -- Operational data belongs in a spec.
3. **ASCII diagrams spanning more than 15 lines** -- Complex diagrams indicate spec-level architecture.
4. **Integration contracts specifying exact API signatures** -- API contracts are spec content by definition.
5. **Versioning headers or changelog sections** -- Versioning belongs in a standalone document.
6. **More than 3 named subsections with independent technical scope** -- Multiple independent scopes suggest a document carrying multiple concerns.

> **Related:** [GSD2](../GSD2/), [MCF](../MCF/), [PMG](../PMG/)

---

## 5. Pointer Reference Architecture

A pointer module is a navigation artifact that replaces the original content with a structured reference. It tells an agent exactly where to find the promoted content, how to verify it, and when to follow the reference [1].

### Canonical Pointer Structure

```
POINTER MODULE ANATOMY (60-120 lines)
================================================================

  SECTION 1: HEADER (5-10 lines)
    ├── Document title with [POINTER] designation
    ├── Status: Active / Deprecated / Superseded
    └── Creation date and last-verified date

  SECTION 2: DOCUMENT REFERENCE (8-12 lines)
    ├── Title of target document
    ├── Path to target (relative to repo root)
    ├── Version of target
    ├── SHA-256 digest of target content
    └── Origin: where and when the content was promoted

  SECTION 3: COVERAGE SUMMARY (5-10 lines)
    ├── 3-5 sentences describing what the spec covers
    └── Written for agent orientation (not human consumption)

  SECTION 4: WHEN TO FOLLOW (8-12 lines)
    ├── List of conditions under which the pointer should be followed
    └── Each condition maps to a type of agent task

  SECTION 5: REFERENCE MAP (15-25 lines)
    ├── Table mapping spec sections to research concerns
    └── Enables selective reading (agent can jump to relevant section)

  SECTION 6: INTEGRITY CHECK (3-5 lines)
    ├── Digest computation method
    └── Instructions for re-verification
```

### Digest Integrity

The SHA-256 digest in the pointer is computed from the compiled artifact (PDF, HTML, or rendered output), not the source file. This ensures that the pointer describes what consumers will actually receive, including any transformations introduced by the compilation process [1].

If the digest in the pointer does not match the live digest of the target document, one of two things has happened:

1. The target document was updated without updating the pointer -- a governance violation.
2. The target document was corrupted or replaced -- a security concern.

In either case, the mismatch triggers a BLOCK event: execution halts until a human investigates and resolves the discrepancy [1].

> **Related:** [GSD2](../GSD2/), [MCF](../MCF/), [ACE](../ACE/)

---

## 6. Content Integrity During Promotion

The safety-critical test SC-CONTENT specifies: "Bridge spec contains all content from original Module 05; line count >= 706; zero information dropped in promotion." This is a hard constraint -- promotion must be lossless [1].

### Integrity Verification Methods

| Method | What It Checks | Automation Level |
|--------|---------------|-----------------|
| Line count comparison | Promoted doc >= original | Fully automated |
| Section count comparison | All sections present | Fully automated |
| Content diff | No content removal | Semi-automated (diff review) |
| Semantic review | Meaning preserved through reframing | Human (HITL) |
| Digest chain | Source → compiled → pointer consistent | Fully automated |

### The Lossless Promotion Guarantee

```
LOSSLESS PROMOTION VERIFICATION
================================================================

  Original Module 05: 706 lines, 13 sections
       |
       | EXTRACT (no modification)
       v
  Raw Extract: 706+ lines, 13 sections
       |
       | REFRAME (add header, scope, version)
       v
  Standalone Spec: 706+ lines + header additions
       |
       | VERIFY
       v
  SC-CONTENT check:
    ├── spec_lines >= 706?          → PASS / FAIL
    ├── all 13 sections present?    → PASS / FAIL
    ├── no content deleted in diff? → PASS / FAIL
    └── semantic integrity (HITL)?  → PASS / FAIL
```

Content may be added during promotion (headers, scope statements, navigation aids), but content must never be removed. Reframing changes the container, not the content. If the content needs revision, that is a separate change tracked as a separate version -- not conflated with the promotion operation [1].

> **Related:** [GSD2](../GSD2/), [ACE](../ACE/), [COK](../COK/)

---

## 7. Audit Methodologies for Existing Modules

A governance audit examines all existing modules against the established contracts and flags compliance issues. The audit is a point-in-time assessment, not a continuous process -- though the governance gate provides continuous enforcement going forward [1].

### Audit Procedure

```
MODULE AUDIT PROCEDURE
================================================================

  For each module in the mission pack:

  1. MEASURE
     ├── Count lines (wc -l)
     ├── Count sections (grep ^## | wc -l)
     └── Identify content type (survey vs. spec)

  2. CLASSIFY
     ├── Scan for spec-level content markers (6 markers)
     ├── Check line count against size contract
     └── Assign class: COMPLIANT / OVERSIZED / MARKER-FLAGGED

  3. ASSESS
     ├── COMPLIANT: No action required
     ├── OVERSIZED: Determine if content is survey or spec
     │     ├── Survey → Split into multiple modules
     │     └── Spec → Promote to standalone spec
     └── MARKER-FLAGGED: Review markers in context
           ├── False positive → Document exception
           └── True positive → Recommend promotion

  4. REPORT
     ├── Module name, line count, section count
     ├── Classification result
     ├── Flagged markers (if any)
     └── Recommended action
```

### Audit Report Format

| Module | Lines | Sections | Status | Markers | Action |
|--------|-------|----------|--------|---------|--------|
| M01: Example | 350 | 12 | COMPLIANT | None | None |
| M02: Example | 390 | 10 | COMPLIANT | None | None |
| M03: Example | 280 | 8 | COMPLIANT | None | None |
| M04: Example | 340 | 11 | COMPLIANT | None | None |
| M05: Bridge | 706 | 13 | OVERSIZED + MARKERS | TS ifaces, ASCII 15+, token budget | PROMOTE |

The audit establishes a baseline against which future compliance can be measured. Any new module added to the pack is measured against the same contracts, and the governance gate enforces compliance before publication [1].

> **Related:** [GSD2](../GSD2/), [PMG](../PMG/), [COK](../COK/)

---

## 8. Governance Documents as Living Artifacts

A governance document that is never updated is a dead letter. Effective governance evolves with the system it governs [4].

### Versioning Governance Documents

GOVERNANCE.md is committed to the repository and versioned alongside the artifacts it governs. When the size contracts change (for example, increasing the research module maximum from 400 to 450 lines based on operational experience), the change is tracked in the same commit history as any code change.

This makes governance changes auditable: `git log GOVERNANCE.md` shows every change to the governance rules, when it was made, and by whom. The governance document is itself subject to the review process it mandates [1].

### Governance Evolution Patterns

| Pattern | Description | Example |
|---------|-------------|---------|
| Tightening | Reduce allowed range | Max lines 400 → 350 |
| Loosening | Expand allowed range | Max lines 400 → 450 |
| New class | Add document class | Add "executive summary" class |
| Marker addition | Add promotion trigger | Add "benchmark tables" as marker |
| Exception | Document approved exception | Module X exempt from size limit |
| Deprecation | Remove obsolete class | Remove "working draft" class |

### The Feedback Loop

Governance is a feedback loop: governance rules shape how modules are written, module audit results shape how governance rules evolve. The audit report is both an output of governance (compliance assessment) and an input to governance (evidence for rule adjustment) [4].

```
GOVERNANCE FEEDBACK LOOP
================================================================

  GOVERNANCE.md (rules)
       |
       | enforces
       v
  Module Authors (write within rules)
       |
       | produce
       v
  Modules (artifacts)
       |
       | assessed by
       v
  Audit Report (compliance)
       |
       | informs
       v
  GOVERNANCE.md (rules updated)
       |
       | enforces (next cycle)
       v
  ...
```

> **Related:** [GSD2](../GSD2/), [PMG](../PMG/), [ACE](../ACE/)

---

## 9. Case Study: Module 05 Bridge Architecture

Module 05 in the Deep Audio Analyzer mission pack is the canonical example of a research module that exceeded its container. The case study illuminates every aspect of the governance framework [1].

### Timeline

| Date | Event | Impact |
|------|-------|--------|
| Pre-mission | Module 05 scoped as research module | Container: 300-400 lines |
| Mission execution | Module 05 written with full bridge spec content | Result: 706 lines |
| Post-mission | Retrospective identifies overshoot | Governance gap recognized |
| March 2026 | MGU mission designed | Promotion pipeline + governance contracts |

### Why 706 Lines

Module 05 grew to 706 lines because the bridge architecture required:

- TypeScript interface definitions for agent communication contracts
- Multi-level ASCII diagrams showing the bridge topology
- Token budget analysis for bridge operations
- Integration contracts specifying cross-agent handoff sequences
- 13 named sections with independent technical scope

Each of these elements is necessary for implementing agents. None could be removed without losing information needed for execution. The content was correct; the container was undersized [1].

### The Governance Response

The MGU mission defines four responses to the Module 05 overshoot:

1. **Promote** Module 05 to a standalone spec (preserving all content).
2. **Replace** Module 05 with a pointer module (enabling navigation).
3. **Monitor** upstream versions (preventing silent drift).
4. **Govern** all modules with explicit contracts (preventing future overshoot).

This four-part response addresses the root cause (absent governance), not just the symptom (oversized module). The same principle applies in any modular system: when a boundary violation is detected, fix the boundary enforcement, not just the individual violation [1].

### Lessons for Future Missions

- Size contracts should be established before module authoring begins, not discovered in retrospective.
- Promotion triggers (content markers) catch category shifts that line counting alone would miss.
- Pointer modules maintain navigation integrity when content moves between containers.
- Governance documents committed to the repository become enforceable, not just advisory.

> **Related:** [GSD2](../GSD2/), [PMG](../PMG/), [MCF](../MCF/), [COK](../COK/)

---

## 10. Cross-References

| Topic | Appears In | Related Projects |
|-------|-----------|-----------------|
| Promotion pipeline | M4, M1, M3 | GSD2, PMG, MCF |
| Document class taxonomy | M4, M3 | GSD2, MCF, ACE |
| Size contracts | M4, M1, M3 | GSD2, COK, ACE |
| Pointer architecture | M4, M1 | GSD2, MCF, PMG |
| Content integrity | M4, M3 | GSD2, ACE, COK |
| Audit methodology | M4, M3, M5 | GSD2, PMG, COK |
| Living governance | M4, M3 | GSD2, PMG, ACE |
| Module 05 case study | M4, M1, M3 | GSD2, PMG, MCF |
| Governance feedback loop | M4, M3 | GSD2, PMG, COK |

---

## 11. Sources

1. GSD Ecosystem (2026). *Module Governance & Upstream Intelligence Mission Pack*. Internal mission documentation. Primary source for promotion pipeline, size contracts, and governance framework.
2. Parnas, D. L. (1972). "On the Criteria To Be Used in Decomposing Systems into Modules." *Communications of the ACM*, 15(12), 1053-1058. Foundational work on module boundaries and information hiding.
3. Martin, R. C. (2017). *Clean Architecture: A Craftsman's Guide to Software Structure and Design*. Prentice Hall. Module boundary principles applied to software architecture.
4. Bass, L., Clements, P., & Kazman, R. (2012). *Software Architecture in Practice*, 3rd ed. Addison-Wesley. Architecture governance as a continuous process.
5. Fowler, M. (2002). "Patterns of Enterprise Application Architecture." Addison-Wesley. Document classification and pattern languages.
6. Hohpe, G., & Woolf, B. (2003). *Enterprise Integration Patterns*. Addison-Wesley. Message routing and content-based routing (analogous to document promotion).
7. Newman, S. (2015). *Building Microservices*. O'Reilly. Service decomposition patterns (analogous to module promotion).
8. Kleppmann, M. (2017). *Designing Data-Intensive Applications*. O'Reilly. Schema evolution and data migration (analogous to document class migration).
9. Brooks, F. P. (1975). *The Mythical Man-Month*. Addison-Wesley. "Plan to throw one away" -- early recognition of the promotion problem.
10. Ambler, S. W. (2002). *Agile Modeling*. Wiley. Lightweight documentation practices and document class management.
11. Nygard, M. (2007). *Release It!*. Pragmatic Bookshelf. Operational governance in production systems.
12. Kim, G., et al. (2016). *The DevOps Handbook*. IT Revolution. Continuous governance through automated pipelines.
13. Skelton, M., & Pais, M. (2019). *Team Topologies*. IT Revolution. Organizational boundaries that mirror module boundaries.
14. Conway, M. E. (1968). "How Do Committees Invent?" *Datamation*, 14(5), 28-31. Conway's Law: organizational structure shapes system structure.
15. Miner, J., et al. (1985). *Amiga Hardware Reference Manual*. Commodore-Amiga. The Amiga chipset as a model for well-bounded modular architecture.
