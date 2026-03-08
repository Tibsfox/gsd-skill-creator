# Building Construction Mastery — Content Templates

> **Foundation document for BCM research (Wave 0, Task 3)**
>
> Defines the document templates for each audience level (L1-L5) and content type used across all 6 research modules. Every Wave 1 executor agent must conform to these templates to ensure consistency, safety, and multi-audience accessibility.
>
> **Organizing principle:** The 5-tier audience system — content adapts in depth, vocabulary, and structure to serve homeowners through licensed engineers, all grounded in PNW building practice and seismic reality.

---

## How to Use This Document

1. **Select your audience level** (L1-L5) based on the target reader.
2. **Select your content type** (Survey, Deep-Dive, Code Reference, Diagnostic, Educational) based on the document's purpose.
3. **Combine** the audience template with the content type template: the audience template governs language/depth, the content type template governs document structure.
4. **Apply all cross-cutting elements** (header block, source attribution, safety callouts, cross-references).
5. **Validate** against the safety callout standards before marking any section complete.

Every factual claim must be tagged with a source ID from `00-source-index.md`. Every code reference must include edition year, effective date, and state applicability (OR, WA, or both).

---

## Table of Contents

- [Part 1: Audience Level Templates](#part-1-audience-level-templates)
  - [L1 — Homeowner](#l1--homeowner-template)
  - [L2 — Skilled DIY](#l2--skilled-diy-template)
  - [L3 — Trade Student](#l3--trade-student-template)
  - [L4 — Journeyman/Contractor](#l4--journeymancontractor-template)
  - [L5 — Engineer/Architect](#l5--engineerarchitect-template)
- [Part 2: Content Type Templates](#part-2-content-type-templates)
  - [Survey/Overview](#1-surveyoverview-template)
  - [Deep-Dive Technical](#2-deep-dive-technical-template)
  - [Code Reference](#3-code-reference-template)
  - [Diagnostic/Troubleshooting](#4-diagnostictroubleshooting-template)
  - [Educational/Curriculum](#5-educationalcurriculum-template)
- [Part 3: Cross-Cutting Elements](#part-3-cross-cutting-elements)
- [Part 4: Safety Callout Standards](#part-4-safety-callout-standards)
- [Part 5: Combining Templates — Worked Examples](#part-5-combining-templates--worked-examples)

---

## Part 1: Audience Level Templates

Each audience level template defines the **language register**, **structural pattern**, **depth expectations**, and **mandatory sections** for content targeting that reader. When writing a document, select one primary audience level. Multi-audience documents should use clearly labeled sections (e.g., `### L1 View` / `### L3 View`) or separate files per level.

---

### L1 — Homeowner Template

**Reader profile:** Homeowner with no construction background. May be evaluating a project, assessing their home's condition, or deciding whether to hire a professional. Wants practical answers, not theory.

**Language rules:**
- Plain English throughout. No jargon unless immediately defined in parentheses at first use.
- Active voice. Short sentences (target 15-20 words average).
- Use analogies to everyday objects when explaining building concepts.
- Measurements in imperial (feet, inches) first, metric in parentheses only if useful.
- Cost figures always presented as ranges with date stamp and location qualifier.

**Structural pattern:**

```markdown
# [Topic Title] — What Every Homeowner Should Know

<!-- HEADER BLOCK (see Cross-Cutting Elements) -->

## What Is [Topic]?

<!-- Plain-language explanation in 2-3 paragraphs. Use an analogy.
     Example: "Your home's foundation is like the feet it stands on —
     if the feet shift, everything above shifts too." -->

## Why It Matters for Your Home

<!-- Connect to property value, safety, comfort, energy costs.
     Be specific to PNW: mention rain, earthquakes, soil conditions. -->

### PNW Regional Note

<!-- Standardized callout box (see Cross-Cutting Elements).
     Address PNW-specific concerns: seismic risk, moisture/rain,
     volcanic soil, marine climate corrosion, etc. -->

## Warning Signs to Watch For

<!-- Bulleted list of observable symptoms. Use sensory language:
     "You might notice...", "Look for...", "Listen for..." -->

- **Visual:** [what you can see]
- **Sound:** [what you might hear]
- **Feel:** [temperature, vibration, drafts]
- **Smell:** [moisture, gas, burning]

## Self-Assessment: Is My Home OK?

<!-- Decision tree or flowchart. Yes/No questions leading to
     action recommendations. Format as a numbered checklist. -->

1. [ ] Question the homeowner can answer by observation
2. [ ] Next diagnostic question
3. [ ] ...
   - If YES to all: Your home is likely in good shape. Monitor annually.
   - If NO to any: See "When to Call a Pro" below.

### Seismic Retrofit Quick Check
<!-- PNW-specific: Is my house bolted to the foundation?
     Simple visual inspection steps. -->

### Moisture Management Quick Check
<!-- PNW-specific: Is my crawlspace properly ventilated?
     Signs of moisture problems. -->

## When to Call a Professional

> **BLOCK:** The following situations require a licensed professional.
> Do not attempt repairs yourself. See [Safety Callout Standards].

<!-- List clear thresholds. Be specific about WHAT KIND of professional:
     licensed electrician, structural engineer, plumber, etc. -->

## What to Expect When You Hire a Pro

### Cost Ranges

<!-- ALWAYS include: date stamp, location qualifier, range not point estimate -->

| Work Item | Typical Range (PNW, 2026) | Timeline | Notes |
|-----------|--------------------------|----------|-------|
| [item]    | $X,XXX - $XX,XXX        | X-X weeks | [permit needed?] |

### The Process
<!-- Step-by-step: what happens from first call to project completion -->

1. Initial consultation / assessment
2. ...

### Questions to Ask Your Contractor
<!-- Empower the homeowner to be an informed consumer -->

## Seasonal Maintenance Checklist

<!-- PNW seasons: emphasize fall prep for rain, spring inspection after winter -->

| Season | Task | Frequency | DIY or Pro? |
|--------|------|-----------|-------------|
| Fall   |      | Annual    |             |
| Winter |      | Monthly   |             |
| Spring |      | Annual    |             |
| Summer |      | Annual    |             |

## Key Terms

<!-- Glossary of any technical terms used, in alphabetical order.
     Keep to 10-15 terms maximum. If you need more, the language
     is too technical for L1. -->

| Term | Definition |
|------|-----------|
|      |           |

## Sources

<!-- Link to 00-source-index.md entries used in this document -->
```

**Mandatory L1 sections:** What Is, Why It Matters, Warning Signs, When to Call a Pro, Cost Ranges, Seasonal Maintenance Checklist.

**Forbidden in L1:** Code section numbers without plain-language explanation, engineering calculations, trade-specific abbreviations without definition, encouragement of unpermitted work.

---

### L2 — Skilled DIY Template

**Reader profile:** Competent homeowner or hobbyist with tools and some construction experience. Comfortable with basic projects (deck repair, fixture replacement, insulation). Wants to know what they CAN do safely and legally, and where the line is.

**Language rules:**
- Technical terms introduced with definitions at first use, used freely afterward.
- Procedural writing style: clear, numbered steps.
- Include tool and material specifications (brand-agnostic).
- Code references by name and number, with plain-language summary of requirements.

**Structural pattern:**

```markdown
# [Topic Title] — DIY Guide

<!-- HEADER BLOCK (see Cross-Cutting Elements) -->

## Overview

<!-- 2-4 paragraphs. What this covers, skill level required,
     estimated time, and an honest assessment of difficulty. -->

**Difficulty:** [Beginner / Intermediate / Advanced DIY]
**Estimated Time:** [X hours/days for typical scope]
**Permit Required:** [Yes / No / Depends — see details below]

## Before You Start

### Permit Requirements

<!-- Be explicit. Reference specific code sections.
     Include links or directions to local building department. -->

- **Oregon:** [specific requirements, code ref]
- **Washington:** [specific requirements, code ref]
- **When a permit is NOT required:** [clear list]

### Tools Needed

| Tool | Purpose | Approximate Cost | Notes |
|------|---------|-----------------|-------|
|      |         |                 | [own/rent/borrow] |

### Materials Needed

| Material | Specification | Quantity (typical) | Cost Range (2026) |
|----------|--------------|-------------------|-------------------|
|          |              |                   |                   |

### Safety Equipment (PPE)

<!-- Non-negotiable. List everything required. -->

> **GATE:** Before proceeding, verify you have ALL listed PPE.
> Do not substitute or skip items.

- [ ] [PPE item] — [why it's needed]
- [ ] ...

## Step-by-Step Procedure

<!-- Numbered steps. Each step should be one discrete action.
     Include photos/diagram references where applicable. -->

### Phase 1: [Preparation]

1. **[Action verb]** [specific instruction]. [Source: XX-XX]
2. ...

> **GATE:** Verify [condition] before proceeding to Phase 2.

### Phase 2: [Execution]

1. ...

### Phase 3: [Finishing / Cleanup]

1. ...

## Common Mistakes and How to Avoid Them

<!-- Table format. Be specific about consequences. -->

| Mistake | Why It Happens | Consequence | Prevention |
|---------|---------------|-------------|------------|
|         |               |             |            |

## Code Awareness

<!-- NOT a deep code analysis — that's L3+. Just enough for the
     DIY person to know what's required and why. -->

| Requirement | Code Reference | Plain-Language Summary |
|-------------|---------------|----------------------|
|             |               |                      |

## When It's Beyond DIY

> **BLOCK:** The following conditions mean this project requires
> a licensed professional. Stopping here is the right call.

<!-- Clear, specific thresholds. No ambiguity. -->

- If you encounter [condition]: **STOP. Call a [specific professional].**
- ...

## Material Selection Guide

<!-- Trade-offs table for the most common choice points -->

| Option | Cost | Durability | Ease of Install | Best For |
|--------|------|-----------|----------------|----------|
|        |      |           |                |          |

## Sources

<!-- Link to 00-source-index.md entries used -->
```

**Mandatory L2 sections:** Permit Requirements, Tools/Materials lists, Step-by-Step Procedure, Common Mistakes, When It's Beyond DIY.

**Forbidden in L2:** Encouraging work that requires a license (electrical panel work, gas line modification, structural alterations), omitting permit requirements, skipping PPE requirements.

---

### L3 — Trade Student Template

**Reader profile:** Student in an apprenticeship program (electrical, plumbing, HVAC, carpentry, etc.) or community college construction technology program. Learning theory and code alongside hands-on skills. Preparing for journeyman exams.

**Language rules:**
- Full technical vocabulary expected and used without apology.
- Code citations with section numbers, edition years, and state amendments.
- Mathematical notation where applicable (basic algebra, geometry, load calculations).
- Reference to apprenticeship program year and competency milestones.

**Structural pattern:**

```markdown
# [Topic Title] — Trade Student Reference

<!-- HEADER BLOCK (see Cross-Cutting Elements) -->

## Theory Foundation

<!-- WHY things work the way they do. Connect physical principles
     to construction practice. This is what separates a tradesperson
     from someone who just follows instructions. -->

### Underlying Principles

<!-- Physics, chemistry, materials science as applicable.
     Keep it practical — theory in service of practice. -->

### Historical Context

<!-- Brief: how current practice evolved. Why codes exist.
     Connect to PNW-specific events (Nisqually earthquake,
     Cascadia Subduction Zone research, etc.) -->

## Code Basis

<!-- Deep dive into relevant code sections. This is the heart
     of L3 content — understanding WHAT the code says and WHY. -->

### Primary Code References

| Code | Edition | Section(s) | Topic | OR Amendments | WA Amendments |
|------|---------|-----------|-------|---------------|---------------|
|      |         |           |       |               |               |

### Section-by-Section Analysis

#### [Code Section Number]: [Title]

**What it says:** [Direct paraphrase, not verbatim quote]

**What it means in practice:** [Practical interpretation]

**Common violations:** [What inspectors flag]

**PNW-specific application:**
<!-- How PNW climate, seismic zone, soil conditions affect
     application of this code section -->

## Practical Application

### Field Procedures

<!-- Step-by-step as in L2, but with code justification for each step
     and quality control checkpoints. -->

1. **[Action]** — Required by [Code Section]. Tolerance: [spec].

### Worked Calculation Examples

<!-- Increasing complexity. Show all work. Reference code tables. -->

#### Example 1: [Basic — 1st/2nd year level]

**Given:** [parameters]
**Find:** [what to calculate]
**Code reference:** [section]
**Solution:**
<!-- Show every step -->

#### Example 2: [Intermediate — 3rd year level]

<!-- More variables, compound calculations -->

#### Example 3: [Advanced — journeyman exam level]

<!-- Multi-system interaction, edge cases -->

## Apprenticeship Curriculum Alignment

<!-- Map content to typical apprenticeship program structure -->

| Program Year | Competency | This Document Covers | Assessment Type |
|-------------|-----------|---------------------|-----------------|
| Year 1      |           |                     |                 |
| Year 2      |           |                     |                 |
| Year 3      |           |                     |                 |
| Year 4      |           |                     |                 |

## Exam Preparation

### Key Concepts to Master

<!-- Bulleted list of testable knowledge -->

### Practice Questions

<!-- Multiple choice and short answer, exam-style -->

1. [Question]
   - a) [option]
   - b) [option]
   - c) [option]
   - d) [option]

   **Answer:** [letter] — [explanation with code reference]

### Self-Assessment Checklist

- [ ] I can explain [concept] without referring to notes
- [ ] I can calculate [quantity] given [inputs]
- [ ] I can identify [number] code violations in a field scenario
- ...

## Field Tips

<!-- Practical wisdom that doesn't appear in textbooks.
     Things an experienced journeyman would tell an apprentice. -->

> **From the field:** [practical tip with context]

## Safety Protocols

<!-- Trade-specific safety. More detailed than L2.
     Include lockout/tagout, confined space, fall protection
     as applicable to the trade. -->

### Lockout/Tagout (LOTO) Procedure
<!-- If applicable to this trade/topic -->

### De-Energize Procedure
<!-- If applicable (electrical, gas) -->

## Sources

<!-- Link to 00-source-index.md entries used -->
```

**Mandatory L3 sections:** Theory Foundation, Code Basis with section analysis, Worked Calculation Examples, Apprenticeship Curriculum Alignment, Practice Questions.

**Forbidden in L3:** Oversimplifying code requirements, omitting state amendments, skipping calculation steps ("it can be shown that..."), presenting rules of thumb without code basis.

---

### L4 — Journeyman/Contractor Template

**Reader profile:** Licensed journeyman tradesperson or general contractor. Runs projects, manages crews, bids work, coordinates inspections. Needs code compliance details, estimating data, and inspection preparation. Business owner or aspiring business owner.

**Language rules:**
- Professional trade terminology used without definition.
- Code references at amendment level — OR and WA differences highlighted.
- Cost data in estimating format (unit costs, labor factors, productivity rates).
- Business language where applicable (liability, bonding, insurance).

**Structural pattern:**

```markdown
# [Topic Title] — Professional Reference

<!-- HEADER BLOCK (see Cross-Cutting Elements) -->

## Code Compliance Checklist

<!-- The primary tool for this audience. Actionable, inspectable items.
     Organized by inspection stage. -->

### Pre-Construction

- [ ] [Permit application item] — [code ref]
- [ ] [Plan review item] — [code ref]
- ...

### Rough-In Inspection

- [ ] [Inspectable item] — [code ref, tolerance]
- [ ] ...

> **GATE:** All rough-in items must pass before covering.
> Document with photos for your records.

### Final Inspection

- [ ] [Inspectable item] — [code ref]
- [ ] ...

### State-Specific Requirements

| Requirement | Oregon | Washington | Code Reference |
|-------------|--------|-----------|----------------|
|             |        |           |                |

## Advanced Techniques

### [Technique Name]

**Application:** [when/why to use this technique]
**Code basis:** [section reference]
**Advantages over standard method:** [specifics]
**Additional cost/time:** [estimate]

<!-- Detailed procedure for techniques beyond journeyman basics -->

### PNW-Specific Techniques

<!-- Seismic detailing, moisture management, energy code compliance
     strategies specific to the Pacific Northwest -->

## Estimating Framework

### Unit Cost Table

<!-- Costs per unit of work. Date-stamped, location-qualified. -->

| Work Item | Unit | Material Cost | Labor Hours | Labor Cost | Total/Unit | Notes |
|-----------|------|--------------|-------------|-----------|-----------|-------|
|           |      |              |             |           |           |       |

**Cost basis:** PNW metro area, union scale, Q1 2026. Adjust for:
- Rural areas: [factor]
- Non-union: [factor]
- High-complexity: [factor]

### Labor Productivity Factors

| Condition | Factor | Example |
|-----------|--------|---------|
| Ideal conditions | 1.00 | New construction, open access |
| Occupied building | [X.XX] | [description] |
| Retrofit/remodel | [X.XX] | [description] |
| Weather exposure | [X.XX] | PNW rain season |
| Height premium | [X.XX] | Above [X] feet |

### Material Waste Allowances

| Material | Standard Waste % | Complex Layout % | Notes |
|----------|-----------------|------------------|-------|
|          |                 |                  |       |

## Project Management

### Sequencing and Coordination

<!-- When does this trade's work happen relative to others?
     What needs to be in place before, what follows after? -->

| Phase | Predecessor Trade | This Trade's Work | Successor Trade | Duration (typical) |
|-------|------------------|-------------------|-----------------|-------------------|
|       |                  |                   |                 |                   |

### Scheduling Considerations

- **PNW weather windows:** [seasonal constraints]
- **Permit processing time:** OR [X days/weeks], WA [X days/weeks]
- **Material lead times:** [current supply chain notes]
- **Inspection scheduling:** [typical wait times, tips]

### Crew Sizing

| Scope | Journeymen | Apprentices | Duration | Notes |
|-------|-----------|-------------|----------|-------|
|       |           |             |          |       |

## Inspection Preparation

### What the Inspector Will Check

<!-- Specific, practical. What to have ready. -->

1. [Item] — Have [document/access/condition] ready
2. ...

### Common Rejection Reasons

| Rejection | Code Basis | Fix | Time Impact |
|-----------|-----------|-----|-------------|
|           |           |     |             |

### Documentation to Have on Site

- [ ] Approved plans (stamped)
- [ ] Permit card (posted)
- [ ] [Material certifications, test reports, etc.]
- ...

## Business Considerations

### Liability and Insurance

<!-- What coverage is needed for this type of work?
     Professional liability, general liability, workers comp. -->

### Bonding Requirements

<!-- OR and WA contractor licensing and bonding requirements
     as they relate to this work type. -->

### Warranty Obligations

| Component | Typical Warranty | Code Minimum | Industry Standard |
|-----------|-----------------|-------------|-------------------|
|           |                 |             |                   |

## Sources

<!-- Link to 00-source-index.md entries used -->
```

**Mandatory L4 sections:** Code Compliance Checklist, Estimating Framework (unit costs + labor factors + waste), Sequencing/Coordination, Inspection Preparation, State-Specific Requirements.

**Forbidden in L4:** Omitting state amendment differences, presenting costs without date stamps, skipping inspection preparation, ignoring business/liability considerations.

---

### L5 — Engineer/Architect Template

**Reader profile:** Licensed PE, SE, or registered architect. Designs systems, stamps drawings, bears professional liability. May also be a graduate student preparing for PE/SE exam or a faculty member developing curriculum. Needs design theory, calculation procedures, and ABET alignment.

**Language rules:**
- Engineering and academic standard. Equations, notation, and terminology per professional convention.
- Full code analysis including commentary, intent, and alternative compliance paths.
- SI and imperial units as appropriate to the discipline.
- Reference to ASCE, ACI, AISC, ASHRAE, and other professional society standards.

**Structural pattern:**

```markdown
# [Topic Title] — Engineering Reference

<!-- HEADER BLOCK (see Cross-Cutting Elements) -->

## Design Theory

### Fundamental Principles

<!-- Engineering fundamentals underlying this topic.
     Equations, derivations, and theoretical framework. -->

### Governing Equations

<!-- Present key equations with variable definitions,
     units, and applicability limits. -->

**Equation [N]:** [Name]

$$
[LaTeX or plaintext equation]
$$

Where:
- [variable] = [definition] ([units])
- ...

**Applicability:** [conditions, limits, assumptions]
**Source:** [standard/code/publication reference]

### Design Philosophy

<!-- LRFD vs. ASD, performance-based vs. prescriptive,
     risk-informed approaches as applicable. -->

## Code Analysis

### Prescriptive Requirements

| Code | Section | Requirement | Design Impact | Commentary |
|------|---------|-------------|---------------|-----------|
|      |         |             |               |           |

### Performance-Based Alternatives

<!-- Alternative compliance paths. When prescriptive
     requirements don't apply or are insufficient. -->

### State Amendments and Local Jurisdiction

| Requirement | Model Code | Oregon Amendment | Washington Amendment | Impact on Design |
|-------------|-----------|-----------------|---------------------|-----------------|
|             |           |                 |                     |                 |

### Code Intent and Commentary

<!-- WHY the code says what it says. Historical context,
     failure modes that prompted specific requirements,
     ongoing code development discussions. -->

## Calculation Procedures

### Procedure [N]: [Name]

**Objective:** [what this calculation determines]
**Inputs required:** [list with units]
**Code basis:** [section reference]

**Step 1:** [description]
<!-- Show calculation with intermediate results -->

**Step 2:** [description]
<!-- Continue... -->

**Result:** [value with units and code check]
**Code check:** [requirement] [comparison] [calculated value] — [PASS/FAIL]

### Design Tables

<!-- Pre-calculated values for common conditions.
     Always show basis assumptions. -->

| [Parameter 1] | [Parameter 2] | [Result] | Code Limit | Utilization |
|---------------|---------------|----------|-----------|-------------|
|               |               |          |           |             |

**Assumptions:** [list all assumptions underlying this table]

## Design Examples

### Example [N]: [Description]

**Project type:** [new construction / retrofit / evaluation]
**Location:** [PNW-specific: seismic zone, wind exposure, climate zone]
**Complexity:** [undergraduate / PE exam / professional practice]

#### Given Information

<!-- All parameters, with sources -->

#### Required

<!-- What must be determined -->

#### Solution

<!-- Complete, step-by-step. Every intermediate value.
     Code references at each decision point. -->

#### Design Summary

| Parameter | Value | Code Limit | Utilization Ratio |
|-----------|-------|-----------|-------------------|
|           |       |           |                   |

#### Discussion

<!-- Engineering judgment points. What-if scenarios.
     Sensitivity to assumptions. -->

## ABET Competency Mapping

<!-- For faculty and curriculum developers -->

### Student Outcomes Alignment

| ABET Student Outcome | This Document Addresses | Assessment Method |
|---------------------|------------------------|-------------------|
| SO 1: Complex problem solving | [specific content] | [exam/project/lab] |
| SO 2: Engineering design | [specific content] | [exam/project/lab] |
| SO 3: Communication | [specific content] | [report/presentation] |
| SO 4: Professional responsibility | [specific content] | [ethics case study] |
| SO 5: Teamwork | [specific content] | [group project] |
| SO 6: Experimentation | [specific content] | [lab/field work] |
| SO 7: Lifelong learning | [specific content] | [continuing ed] |

### Curriculum Integration

| Course Level | Suggested Use | Prerequisite Knowledge |
|-------------|---------------|----------------------|
| Sophomore   |               |                      |
| Junior      |               |                      |
| Senior      |               |                      |
| Graduate    |               |                      |

## PE Exam Preparation

### Exam-Level Practice Problems

#### Problem [N]

**Exam section:** [topic area]
**Difficulty:** [morning session / afternoon depth]
**Time target:** [X minutes]

[Problem statement]

<details>
<summary>Solution</summary>

[Detailed solution with code references]

**Key takeaway:** [what this tests]

</details>

## Professional Responsibility

### Engineering Stamp Requirements

<!-- When is a PE/SE stamp required for this work?
     OR and WA specific requirements. -->

| Work Type | PE Required? | SE Required? | Oregon | Washington |
|-----------|-------------|-------------|--------|-----------|
|           |             |             |        |           |

### Professional Liability Considerations

<!-- Standard of care, emerging issues, professional
     society position statements. -->

## Sources

<!-- Link to 00-source-index.md entries used.
     Include professional society standards. -->
```

**Mandatory L5 sections:** Design Theory with governing equations, Code Analysis with state amendments, Calculation Procedures (full derivations), Design Examples (complete worked problems), ABET Competency Mapping, PE Exam Practice Problems.

**Forbidden in L5:** Skipping derivation steps, presenting equations without variable definitions, omitting units, neglecting professional responsibility context, presenting design without code basis.

---

## Part 2: Content Type Templates

Content type templates define the **document structure** — how information is organized and flows. They combine with audience level templates: the audience template sets the language and depth, the content type template sets the skeleton.

---

### 1. Survey/Overview Template

**Purpose:** Broad coverage of a topic across all dimensions (TD, BS, ST, LP, AD, RS). Establishes landscape, identifies key issues, and points to deeper resources.

**Target length:** 5,000-8,000 words.

```markdown
# [Topic] — Survey

<!-- HEADER BLOCK -->

## Executive Summary

<!-- 200-300 words. Key findings, scope, and significance.
     Adapt language to audience level. -->

## Scope and Methodology

<!-- What this survey covers, what it excludes, and why.
     List dimensions addressed: TD, BS, ST, LP, AD, RS. -->

**Dimensions covered:**
- [ ] TD — Technical Depth
- [ ] BS — Building Science
- [ ] ST — Structural
- [ ] LP — Life-Safety/Protection
- [ ] AD — Administrative/Code
- [ ] RS — Regional/Seismic

## [Dimension 1]: [Title]

### Current State

<!-- What exists now. Describe the landscape. -->

### Key Issues

<!-- Problems, trends, challenges. PNW-specific where applicable. -->

### Regulatory Framework

<!-- Codes, standards, and authorities having jurisdiction. -->

## [Dimension 2]: [Title]

<!-- Repeat pattern for each dimension covered -->

## PNW Regional Context

<!-- Dedicated section for Pacific Northwest considerations.
     Seismic, moisture, energy code, local practice. -->

## Interdependencies

<!-- How dimensions interact. Where changes in one area
     cascade to others. Cross-reference format:
     [MODULE-ID:SECTION] -->

## Knowledge Gaps and Future Directions

<!-- What's missing, what's changing, what to watch for. -->

## Summary Table

| Dimension | Key Finding | Confidence | Further Reading |
|-----------|-------------|-----------|-----------------|
|           |             |           | [MODULE-ID:SECTION] |

## Sources

<!-- All source IDs used -->
```

---

### 2. Deep-Dive Technical Template

**Purpose:** Exhaustive treatment of a single topic. All code references, all calculation methods, all failure modes. The definitive reference document.

**Target length:** 8,000-15,000 words.

```markdown
# [Topic] — Technical Deep-Dive

<!-- HEADER BLOCK -->

## Abstract

<!-- 150-250 words. Technical summary of scope,
     methods, and key findings. -->

## 1. Introduction

### 1.1 Background and Context
### 1.2 Scope and Limitations
### 1.3 Applicable Codes and Standards

| Code/Standard | Edition | Sections | Applicability |
|---------------|---------|----------|--------------|
|               |         |          |              |

## 2. Theoretical Framework

### 2.1 [Principle 1]
### 2.2 [Principle 2]
### 2.3 Failure Modes and Mechanisms

| Failure Mode | Mechanism | Indicators | Consequence | Prevention |
|-------------|-----------|-----------|-------------|-----------|
|             |           |           |             |           |

## 3. Code Requirements

### 3.1 Prescriptive Path
### 3.2 Performance Path
### 3.3 State Amendments (OR/WA)
### 3.4 Historical Code Evolution

<!-- How requirements have changed over time.
     Critical for retrofit/evaluation work. -->

## 4. Materials and Systems

### 4.1 Material Properties

| Material | Property | Value | Standard | Test Method |
|----------|----------|-------|----------|-------------|
|          |          |       |          |             |

### 4.2 System Configurations
### 4.3 Compatibility and Interactions

## 5. Design and Installation

### 5.1 Design Procedures
### 5.2 Installation Methods
### 5.3 Quality Control and Inspection Points

| Inspection Point | Acceptance Criteria | Code Basis | Common Defects |
|-----------------|-------------------|-----------|----------------|
|                 |                   |           |                |

## 6. PNW-Specific Considerations

### 6.1 Seismic Requirements
### 6.2 Moisture and Climate
### 6.3 Energy Code Implications
### 6.4 Local Materials and Practice

## 7. Case Studies

### Case Study [N]: [Title]

**Location:** [PNW city/region]
**Building type:** [residential/commercial]
**Issue:** [what happened]
**Analysis:** [technical analysis]
**Resolution:** [what was done]
**Lessons learned:** [takeaways]

## 8. References and Further Reading

<!-- Categorized: Codes, Standards, Research, Industry Publications -->
```

---

### 3. Code Reference Template

**Purpose:** Section-by-section code mapping with state amendments. Table-heavy, designed for quick lookup during design, installation, and inspection.

**Target length:** Variable (as long as needed for completeness).

```markdown
# [Code Topic] — Code Reference

<!-- HEADER BLOCK -->

## Applicable Codes

| Code | Full Title | Edition | Effective Date (OR) | Effective Date (WA) |
|------|-----------|---------|--------------------|--------------------|
|      |           |         |                    |                    |

## Quick-Reference Summary

<!-- One-page summary of the most critical requirements.
     The "cheat sheet" version. -->

| Requirement | Value/Limit | Code Section | Notes |
|-------------|------------|-------------|-------|
|             |            |             |       |

## Section-by-Section Analysis

### [Section Number]: [Section Title]

**Model code requirement:**
<!-- Paraphrase, not verbatim -->

**Oregon amendment:**
<!-- If different from model code. "No amendment" if identical. -->

**Washington amendment:**
<!-- If different from model code. "No amendment" if identical. -->

**Practical interpretation:**
<!-- What this means for design/installation/inspection -->

**Common violations:**
<!-- What inspectors flag -->

**Related sections:** [cross-references within code]

---

<!-- Repeat for each section -->

## Tables and Figures

### Table [N]: [Title]

<!-- Reproduce or reference key code tables.
     Note: do not reproduce copyrighted tables verbatim.
     Instead, summarize or create derivative tables with
     source attribution. -->

## Amendment Comparison Matrix

| Topic | Model Code | Oregon | Washington | Significance |
|-------|-----------|--------|-----------|-------------|
|       |           |        |           | [minor/moderate/major] |

## Historical Changes

<!-- How this code area has evolved over major code cycles.
     Critical for evaluating existing buildings. -->

| Code Cycle | Key Change | Impact on Existing Buildings |
|-----------|-----------|------------------------------|
|           |           |                              |

## Sources

<!-- Code documents with full citations -->
```

---

### 4. Diagnostic/Troubleshooting Template

**Purpose:** Problem-oriented document. Starts with observed symptoms, works through causes, assessment methods, and solutions. Designed for field use.

**Target length:** 3,000-6,000 words.

```markdown
# [Problem/System] — Diagnostic Guide

<!-- HEADER BLOCK -->

## Symptom Index

<!-- Quick lookup. Reader comes in with a symptom,
     finds the right section immediately. -->

| Symptom | Possible Causes | Severity | Jump To |
|---------|----------------|----------|---------|
|         |                | Low/Med/High/Critical | [Section link] |

## Diagnostic Flowchart

<!-- Decision tree. Start with most common symptom,
     branch to diagnosis through yes/no questions. -->

```
[Symptom observed]
    |
    v
[First diagnostic question?]
   / \
 YES   NO
  |     |
  v     v
 ...   ...
```

## Problem Categories

### [Problem Category 1]

#### Symptoms
<!-- What the observer sees/hears/smells/measures -->

#### Root Causes

| Cause | Likelihood | Risk Level | Investigation Method |
|-------|-----------|-----------|---------------------|
|       | Common/Rare | Low/Med/High |                    |

#### Assessment Procedure

1. **[Visual inspection step]**
2. **[Measurement/testing step]** — Equipment needed: [list]
3. **[Invasive investigation step]** (if non-invasive inconclusive)

> **GATE:** Before invasive investigation, verify:
> - [ ] [condition]
> - [ ] [condition]

#### Solutions

| Solution | Addresses Cause | Complexity | Cost Range (2026 PNW) | Permit Required? |
|----------|----------------|-----------|----------------------|-----------------|
|          |                |           |                      |                 |

#### Prevention

<!-- How to prevent this problem from recurring -->

---

<!-- Repeat for each problem category -->

## Emergency Procedures

> **BLOCK:** If you encounter any of the following, evacuate
> and call 911 immediately:
>
> - [life-safety condition]
> - [life-safety condition]

## When to Escalate

<!-- Clear decision matrix for when to involve higher expertise -->

| Condition | Call This Professional | Why |
|-----------|---------------------|-----|
|           |                     |     |

## Sources

<!-- Source IDs used -->
```

---

### 5. Educational/Curriculum Template

**Purpose:** Course outline format with learning objectives, assessment criteria, and curriculum mapping. For instructors, program developers, and self-directed learners.

**Target length:** 4,000-8,000 words.

```markdown
# [Topic] — Educational Module

<!-- HEADER BLOCK -->

## Module Overview

**Target audience level:** [L1-L5]
**Prerequisites:** [what the learner should already know]
**Duration:** [class hours / self-study hours]
**Assessment type:** [exam / project / portfolio / competency demonstration]

## Learning Objectives

By the end of this module, the learner will be able to:

1. [Measurable objective — use Bloom's taxonomy verbs]
2. [Measurable objective]
3. ...

**Bloom's Taxonomy distribution:**
- Remember/Understand: [N objectives]
- Apply/Analyze: [N objectives]
- Evaluate/Create: [N objectives]

## Curriculum Mapping

### Apprenticeship Alignment (L3)

| Competency Area | Program Year | Hours | Assessment |
|----------------|-------------|-------|-----------|
|                |             |       |           |

### ABET Alignment (L5)

| Student Outcome | Coverage Level | Assessment Method |
|----------------|---------------|-------------------|
|                | Introduce/Reinforce/Master |            |

### Continuing Education (L4)

| Licensing Board | CE Credits | Category | Approval Status |
|----------------|-----------|----------|----------------|
|                |           |          |                |

## Content Outline

### Unit 1: [Title] ([N] hours)

**Objectives addressed:** [1, 2, ...]

#### Lecture/Reading Content

<!-- Key concepts, organized as teaching notes -->

#### Discussion Questions

1. [Open-ended question that tests understanding]
2. ...

#### Hands-On Activity

**Activity:** [description]
**Materials:** [list]
**Duration:** [time]
**Deliverable:** [what student produces]

---

<!-- Repeat for each unit -->

## Assessment Instruments

### Formative Assessment (during instruction)

<!-- Quick checks, discussion questions, practice problems -->

### Summative Assessment (end of module)

#### Written Exam

<!-- Sample questions with rubric -->

| Question Type | Count | Points Each | Total | Objectives Tested |
|--------------|-------|-------------|-------|-------------------|
| Multiple choice | | | | |
| Short answer | | | | |
| Calculation | | | | |
| Essay/analysis | | | | |

#### Practical Demonstration

| Task | Performance Standard | Time Limit | Pass Criteria |
|------|---------------------|-----------|--------------|
|      |                     |           |              |

### Rubric

| Criterion | Excellent (4) | Good (3) | Adequate (2) | Insufficient (1) |
|-----------|--------------|----------|-------------|-------------------|
|           |              |          |             |                   |

## Instructor Resources

### Suggested Teaching Strategies
### Common Student Misconceptions
### Supplementary Materials

## Sources

<!-- Source IDs used -->
```

---

## Part 3: Cross-Cutting Elements

These elements appear in **every** BCM document regardless of audience level or content type. They ensure consistency, traceability, and safety across the entire research collection.

---

### Header Block

Every document begins with this block immediately after the title:

```markdown
---
module: [MODULE-ID]           # e.g., M1-ST, M2-EL, M3-PM, M4-BE, M5-CS, M6-ED
dimensions: [TD, BS, ST, LP, AD, RS]  # which dimensions this doc addresses
audience: [L1|L2|L3|L4|L5]   # primary audience level
content_type: [survey|deep-dive|code-ref|diagnostic|educational]
last_updated: 2026-MM-DD
version: 1.0
status: [draft|review|final]
---
```

**Module IDs:**
- M1-ST: Structural Systems & Materials Science
- M2-EL: Electrical Systems
- M3-PM: Plumbing & Mechanical Systems
- M4-BE: Building Envelope & Weatherproofing
- M5-CS: Codes, Standards & Blueprinting
- M6-ED: Educational Frameworks & Content Generation

**Dimension tags:**
- TD: Technical Depth
- BS: Building Science
- ST: Structural
- LP: Life-Safety/Protection
- AD: Administrative/Code
- RS: Regional/Seismic

---

### Source Attribution

Every factual claim must be tagged with a source ID from `00-source-index.md`.

**Inline format:**

```markdown
The Oregon Residential Specialty Code requires a minimum of 3/4-inch anchor
bolts at 6 feet on center for sill plate attachment [SRC-OR-2023, Section R403.1.6].
```

**Table format (for dense reference material):**

```markdown
| Claim | Source | Confidence |
|-------|--------|-----------|
| [factual claim] | [SOURCE-ID, Section X.X] | [High/Medium/Low] |
```

**Rules:**
- No unsourced factual claims in any document.
- If a source cannot be identified, mark with `[SOURCE-NEEDED]` and flag for verification.
- Confidence levels: **High** = primary source/code text, **Medium** = secondary source/industry guide, **Low** = professional judgment/experience-based.

---

### Code Reference Format

All code references follow this standard format:

```
[Code Abbreviation] [Edition Year] Section [Number] ([State] effective [Date])
```

**Examples:**
- `IRC 2021 Section R602.3 (OR effective 04/01/2023; WA effective 07/01/2023)`
- `NEC 2023 Article 210.8(A) (OR effective 10/01/2024; WA effective 07/01/2024)`
- `OSSC 2022 Section 1613 (OR effective 04/01/2023)`

**Abbreviations used in BCM:**

| Abbreviation | Full Title |
|-------------|-----------|
| IRC | International Residential Code |
| IBC | International Building Code |
| NEC | National Electrical Code (NFPA 70) |
| UPC | Uniform Plumbing Code |
| IMC | International Mechanical Code |
| IECC | International Energy Conservation Code |
| OSSC | Oregon Structural Specialty Code |
| ORSC | Oregon Residential Specialty Code |
| WSEC | Washington State Energy Code |
| ASCE 7 | Minimum Design Loads and Associated Criteria |
| ACI 318 | Building Code Requirements for Structural Concrete |
| AISC 360 | Specification for Structural Steel Buildings |

---

### PNW Regional Note Callout

Standardized callout for PNW-specific information:

```markdown
> **PNW Regional Note:**
> [Content specific to Pacific Northwest building practice, climate,
> seismic conditions, or local amendments. Always include WHY this
> differs from general practice and WHAT the practical impact is.]
>
> *Applies to: [OR | WA | Both]*
```

---

### Cross-Reference Format

Links to related content in other modules:

```markdown
See [M1-ST:Seismic Detailing] for structural connection requirements.
```

**Format:** `[MODULE-ID:Section Name]`

When referencing a specific audience level version:

```markdown
See [M2-EL:L3:Worked Examples] for calculation procedures.
```

**Format:** `[MODULE-ID:LEVEL:Section Name]`

---

## Part 4: Safety Callout Standards

Three tiers of safety callouts, used consistently across all documents. These are non-negotiable elements — every document must use the correct tier for the situation described.

---

### BLOCK (Red) — Work Must Stop

**When to use:** The described activity requires a licensed professional. Proceeding without one creates life-safety risk, legal liability, or both.

```markdown
> **BLOCK — Licensed Professional Required**
>
> [Specific description of what requires professional involvement]
>
> **Required professional:** [Licensed Electrician | Structural Engineer | etc.]
> **Why:** [Life-safety risk, code requirement, or legal basis]
> **Code basis:** [specific code reference if applicable]
```

**Trigger conditions for BLOCK:**
- Structural modifications (load-bearing walls, foundations, framing connections)
- Gas system work (any modification to gas piping, appliances, or venting)
- Electrical work on energized systems or panel/service modifications
- Sewer/water main connections
- Any work requiring a PE or SE stamp
- Asbestos or lead abatement (requires certified abatement contractor)
- Fire suppression system modifications

---

### GATE (Orange) — Verify Before Continuing

**When to use:** The reader should pause and verify a condition before proceeding. Incorrect assumption could lead to safety issues, code violations, or wasted work.

```markdown
> **GATE — Verify Before Proceeding**
>
> Before continuing, confirm:
> - [ ] [Verification item 1]
> - [ ] [Verification item 2]
>
> **If any item cannot be confirmed:** [specific action to take]
```

**Trigger conditions for GATE:**
- Asbestos/lead testing before disturbing materials in pre-1978 buildings
- Permit verification before starting work
- Code currency confirmation (is the referenced code still in effect?)
- Utility locate before digging
- De-energize verification before electrical work
- Structural adequacy verification before adding loads
- Moisture testing before enclosing assemblies

---

### ANNOTATE (Yellow) — Important Context

**When to use:** Information the reader needs to correctly interpret the content. Not a safety stop, but missing this context could lead to errors.

```markdown
> **Note:**
> [Contextual information. Examples: seismic preparedness framing,
> cost estimate currency, regional variation, code cycle timing,
> material availability notes.]
```

**Trigger conditions for ANNOTATE:**
- Cost estimates (always annotate with date, location, and market conditions)
- Seismic preparedness framing (Cascadia Subduction Zone context)
- Regional variation (practices that differ between OR and WA, or between metro and rural)
- Code cycle timing (upcoming code adoption that will change requirements)
- Material substitution notes (when specified materials may be unavailable)

---

### Safety Callout Density Guidelines

- **L1 (Homeowner):** High density. BLOCK callouts at every professional-required threshold. GATEs before any self-assessment activity. ANNOTATEs for all cost figures and regional notes.
- **L2 (Skilled DIY):** Moderate-high density. BLOCK at license boundaries. GATE at each phase transition. ANNOTATE for material selections and code awareness.
- **L3 (Trade Student):** Moderate density. BLOCK for scope-of-license issues. GATE for safety protocols and calculation verification. ANNOTATE for exam tips and field notes.
- **L4 (Journeyman/Contractor):** Moderate-low density. BLOCK for PE/SE stamp requirements. GATE for inspection readiness checks. ANNOTATE for estimating assumptions and code change alerts.
- **L5 (Engineer/Architect):** Low density. BLOCK for professional stamp requirements. GATE for design assumption verification. ANNOTATE for code intent and emerging research.

---

## Part 5: Combining Templates — Worked Examples

This section demonstrates how to combine an audience level template with a content type template to produce a complete document skeleton.

---

### Example A: L1 Homeowner + Diagnostic Template

**Use case:** A homeowner document about diagnosing foundation problems.

```markdown
# Foundation Problems — What Every Homeowner Should Know

---
module: M1-ST
dimensions: [ST, RS, LP]
audience: L1
content_type: diagnostic
last_updated: 2026-03-XX
version: 1.0
status: draft
---

## What Is a Foundation Problem?

<!-- L1 language: plain, analogies, no jargon -->

Your foundation is the base your entire house sits on. When it shifts,
cracks, or settles unevenly, problems travel upward through every part
of your home — from sticking doors to cracked walls.

## Why It Matters for Your Home

<!-- Connect to safety, value, PNW context -->

> **PNW Regional Note:**
> The Pacific Northwest sits on the Cascadia Subduction Zone, capable
> of producing magnitude 9.0+ earthquakes. Homes with compromised
> foundations are significantly more vulnerable to seismic damage.
> Foundation bolting (securing the house frame to the foundation) is
> one of the most effective seismic retrofits available.
>
> *Applies to: Both OR and WA*

## Warning Signs to Watch For

<!-- L1: sensory language, observable symptoms -->

- **Visual:** Cracks in foundation walls wider than 1/4 inch...
- **Visual:** Doors or windows that stick or won't close properly...
- ...

## Symptom Index

<!-- From Diagnostic template -->

| Symptom | Possible Causes | Severity | Jump To |
|---------|----------------|----------|---------|
| Horizontal crack in foundation wall | Lateral soil pressure | High | [Section: Structural Cracking] |
| ...     |                |          |         |

## Self-Assessment: Is My Foundation OK?

<!-- L1 decision tree merged with Diagnostic flowchart -->

## When to Call a Professional

> **BLOCK — Licensed Professional Required**
>
> Foundation structural repairs require a licensed structural engineer
> (SE) for assessment and a licensed contractor for repairs.
>
> **Required professional:** Licensed Structural Engineer (SE)
> **Why:** Incorrect foundation repair can cause building collapse
> **Code basis:** ORSC 2023 Section R401.1

## What to Expect When You Hire a Pro

### Cost Ranges

| Work Item | Typical Range (PNW, 2026) | Timeline | Notes |
|-----------|--------------------------|----------|-------|
| SE assessment | $500 - $1,500 | 1-2 weeks | Includes written report |
| Foundation bolting (seismic retrofit) | $3,000 - $7,000 | 2-5 days | Most common PNW retrofit |
| ...       |                          |          |       |

## Sources

```

---

### Example B: L3 Trade Student + Deep-Dive Template

**Use case:** Electrical trade student reference on residential service calculations.

```markdown
# Residential Service Calculations — Trade Student Reference

---
module: M2-EL
dimensions: [TD, AD, LP]
audience: L3
content_type: deep-dive
last_updated: 2026-03-XX
version: 1.0
status: draft
---

## Theory Foundation

### Underlying Principles

Residential service sizing determines the minimum amperage capacity
of the electrical service entrance equipment. The calculation balances
connected load against demand factors — not every load operates
simultaneously, and the code accounts for this through prescribed
diversity factors.

## Code Basis

### Primary Code References

| Code | Edition | Section(s) | Topic | OR Amendments | WA Amendments |
|------|---------|-----------|-------|---------------|---------------|
| NEC  | 2023    | Article 220 | Branch-Circuit, Feeder, and Service Load Calculations | None | None |
| NEC  | 2023    | Article 230 | Services | OR: 230.67 surge protection | WA: None |

### Section-by-Section Analysis

#### Article 220, Part III: General Lighting and Receptacle Loads

**What it says:** 3 VA per square foot of habitable space...

## Worked Calculation Examples

### Example 1: Basic — 1st/2nd Year Level

**Given:** 1,800 sq ft single-family residence...
**Find:** Minimum service size (amperes)
**Code reference:** NEC 2023 Article 220

**Solution:**

Step 1: General lighting load
1,800 sq ft x 3 VA/sq ft = 5,400 VA [NEC 220.12]

Step 2: Small appliance branch circuits
2 circuits x 1,500 VA = 3,000 VA [NEC 220.52(A)]

...

## Exam Preparation

### Practice Questions

1. A 2,400 sq ft dwelling has an electric range rated at 12 kW,
   a 4.5 kW water heater, a 5 kW clothes dryer, and central
   air conditioning at 6 kVA. Calculate the minimum service size.

   - a) 100A
   - b) 125A
   - c) 150A
   - d) 200A

   **Answer:** d) 200A — [detailed solution with NEC references]

## Sources

```

---

### Example C: L4 Contractor + Code Reference Template

**Use case:** Contractor code reference for window and door installation requirements.

```markdown
# Window & Door Installation — Professional Code Reference

---
module: M4-BE
dimensions: [BS, AD, RS]
audience: L4
content_type: code-ref
last_updated: 2026-03-XX
version: 1.0
status: draft
---

## Applicable Codes

| Code | Full Title | Edition | Effective Date (OR) | Effective Date (WA) |
|------|-----------|---------|--------------------|--------------------|
| IRC  | International Residential Code | 2021 | 04/01/2023 | 07/01/2023 |
| IECC | International Energy Conservation Code | 2021 | 04/01/2023 | 07/01/2023 |
| AAMA 2400 | Standard Practice for Installation of Windows with Flanged Mounting Fins | 2020 | Referenced | Referenced |

## Code Compliance Checklist

### Rough Opening Inspection

- [ ] Rough opening sized per manufacturer specs — [IRC R612.1]
- [ ] Pan flashing installed at sill — [IRC R703.4]
- [ ] ...

> **GATE — Verify Before Proceeding**
>
> Before installing window units, confirm:
> - [ ] Energy code compliance: U-factor and SHGC meet zone requirements
> - [ ] Structural header sized per [IRC Table R602.7(1)]

## Amendment Comparison Matrix

| Topic | Model IRC | Oregon | Washington | Significance |
|-------|----------|--------|-----------|-------------|
| Flashing requirements | R703.4 general | Enhanced — ORSC requires specific flashing membrane overlap dimensions | WAC adds rain screen provisions for marine climate zones | Major — affects installation method |
| ...   |          |        |           |             |

## Estimating Framework

### Unit Cost Table

| Work Item | Unit | Material Cost | Labor Hours | Labor Cost | Total/Unit | Notes |
|-----------|------|--------------|-------------|-----------|-----------|-------|
| Vinyl window, standard replacement | each | $250-450 | 1.5-2.0 | $120-160 | $370-610 | Varies by size |
| ...       |      |              |             |           |           |       |

**Cost basis:** PNW metro area, union scale, Q1 2026.

## Sources

```

---

## Appendix: Template Compliance Checklist

Before submitting any BCM document, verify against this checklist:

### Universal Requirements

- [ ] Header block present with all fields populated
- [ ] Primary audience level identified (L1-L5)
- [ ] Content type identified (Survey/Deep-Dive/Code-Ref/Diagnostic/Educational)
- [ ] All factual claims tagged with source IDs from `00-source-index.md`
- [ ] All code references include edition year, effective date, and state applicability
- [ ] PNW Regional Note callouts present where applicable
- [ ] Cross-references use `[MODULE-ID:Section]` format
- [ ] Safety callouts use correct tier (BLOCK/GATE/ANNOTATE)
- [ ] No `[SOURCE-NEEDED]` tags remaining (or flagged for verification team)

### Audience-Specific Requirements

**L1:**
- [ ] No unexplained jargon
- [ ] Cost ranges with date stamps
- [ ] "When to Call a Pro" section present
- [ ] Seasonal maintenance checklist included
- [ ] No encouragement of unpermitted work

**L2:**
- [ ] Permit requirements section present
- [ ] Tools and materials lists complete
- [ ] Step-by-step procedure included
- [ ] "When It's Beyond DIY" section present
- [ ] PPE requirements listed

**L3:**
- [ ] Code section analysis present
- [ ] Worked calculation examples (multiple difficulty levels)
- [ ] Apprenticeship curriculum alignment table
- [ ] Practice questions with answers
- [ ] State amendments identified

**L4:**
- [ ] Code compliance checklist (inspection-stage organized)
- [ ] Unit cost table with date stamp
- [ ] Labor productivity factors
- [ ] Sequencing/coordination table
- [ ] Inspection preparation section

**L5:**
- [ ] Governing equations with variable definitions
- [ ] Full calculation derivations
- [ ] Design examples with code checks
- [ ] ABET competency mapping
- [ ] PE exam practice problems
- [ ] Professional stamp requirements

### Content-Type-Specific Requirements

**Survey:** Dimensions identified, summary table present
**Deep-Dive:** Numbered sections, failure modes table, case studies
**Code Reference:** Amendment comparison matrix, code abbreviation table
**Diagnostic:** Symptom index, flowchart, escalation matrix
**Educational:** Learning objectives (Bloom's verbs), assessment rubric, curriculum mapping
