# Module 5: GSD-Specific SOP Implementation

**Module:** M5 | **Track:** 2 (Synthesis) | **Role:** FLIGHT  
**Mission:** Engineering the Process --- Standard Operating Procedures  
**Date:** 2026-04-05 | **Status:** Complete  
**Dependencies:** M1, M2, M3, M4  
**Word target:** 9,000--11,000

---

## Abstract

The first four modules of this mission defined what SOPs are (M1), how organizations mature in their use of them (M2), how governance keeps them trustworthy (M3), and how AI agents both consume and produce them (M4). This module closes the circuit. It demonstrates that the gsd-skill-creator ecosystem is not analogous to SOP engineering --- it *is* SOP engineering, expressed in the idiom of agentic software development.

The argument is structural, not metaphorical. Every SOP engineering principle identified in M1 through M4 has a concrete, observable counterpart in the GSD codebase. The SKILL.md file format maps to the canonical 8-section SOP anatomy. Wave plans are CMMI Level 3 defined processes with explicit gates. The bounded learning rule is a change-control mechanism with semantic versioning semantics. The `push.default=nothing` staging discipline is version-control governance. Component specs are DACP bundles. The system, taken as a whole, is a self-documenting SOP library that maintains itself through the same processes it documents.

This module validates every claim against actual skill files in the repository: `vision-to-mission`, `research-engine`, and `done-retirement`. It produces a gap analysis, identifies patterns, and closes with concrete recommendations for tightening the alignment between GSD practice and SOP engineering principles.

---

## Table of Contents

1. [SKILL.md as Bounded SOP](#1-skillmd-as-bounded-sop)
2. [Validation Against Existing Skills](#2-validation-against-existing-skills)
3. [Gap Analysis and Pattern Identification](#3-gap-analysis-and-pattern-identification)
4. [Wave Plan as Sequential SOP with Gates](#4-wave-plan-as-sequential-sop-with-gates)
5. [The 20% Bounded Learning Rule as Change Control](#5-the-20-bounded-learning-rule-as-change-control)
6. [push.default=nothing as Version-Control SOP](#6-pushdefaultnothing-as-version-control-sop)
7. [Component Specs as Machine-Parseable SOP Units](#7-component-specs-as-machine-parseable-sop-units)
8. [GSD as Self-Documenting System](#8-gsd-as-self-documenting-system)
9. [Recommendations](#9-recommendations)
10. [Cross-Module Synthesis](#10-cross-module-synthesis)
11. [References](#11-references)

---

## 1. SKILL.md as Bounded SOP

### 1.1 The Formal Equivalence

A GSD SKILL.md file is a bounded Standard Operating Procedure for an AI agent. This is not a loose analogy. The structural correspondence is element-for-element.

M1 established that every well-formed SOP answers eight questions in sequence: Why does this document exist? Who and what does it apply to? What else must I know? What do these terms mean here? Who does what? How do I do this? How do I know I did it correctly? How do I prove it happened? These questions collapse into the canonical eight sections: Purpose, Scope, References, Definitions, Roles and Responsibilities, Procedure, Quality Checks, and Records / Success Criteria.

A SKILL.md file answers the same eight questions, in the same order, using elements native to the GSD ecosystem:

| # | SOP Section | SKILL.md Element | Structural Role |
|---|------------|-----------------|-----------------|
| 1 | Purpose | `description:` front-matter field | One-paragraph bounded statement of what the skill does and when it activates. The description field is also the primary trigger mechanism --- it determines whether the skill loads. |
| 2 | Scope | "When to Use" / "When NOT to Use" sections, or "Activation Triggers" | Defines the boundary of applicability. Critical for preventing over-triggering (scope creep) and under-triggering (scope gaps). |
| 3 | References | `references/` subdirectory, inline file references | External documents, templates, and upstream/downstream skills needed to execute the procedure. |
| 4 | Definitions | Domain-specific terms in skill body | Terminology that is not universally understood: "bead," "polecat," "convoy," "CAPCOM," "chipset." |
| 5 | Roles & Responsibilities | Chipset configuration; model assignment; role declarations | Who performs, who reviews, who approves --- expressed as model assignments (Opus/Sonnet/Haiku) and role labels (FLIGHT, EXEC, VERIFY). |
| 6 | Procedure | Primary Workflow section (numbered steps or pipeline stages) | Step-by-step instructions in execution order. The core of the skill. |
| 7 | Quality Checks | Quality Checks / Quality Standards / Quality Gates section | Pre-delivery verification: checklists, thresholds, validation criteria. |
| 8 | Records / Success Criteria | Deliverable specification; output file manifest; implicit in pipeline completion | Evidence that the procedure was followed and succeeded. The audit surface. |

This mapping is not approximate. Every element in the left column has a direct counterpart in the right column that serves the identical structural function. The formats differ because the consumers differ --- human operators read prose sections with headings; AI agents parse front-matter fields and structured pipelines --- but the information architecture is the same.

### 1.2 The Trigger as Scope

M1 established that a good Scope section names what is inside the procedure *and* what is explicitly not inside it. In SOP engineering, incomplete scope is one of the top five failure modes because operators in ambiguous situations default to either doing nothing or doing the wrong thing.

In the GSD skill system, scope is operationalized as the trigger mechanism. The `description:` front-matter field is not just documentation --- it is the activation function. Claude Code reads the description to determine whether to load the skill for a given task. A description that is too broad causes over-triggering: the skill loads for tasks it was not designed to handle. A description that is too narrow causes under-triggering: the skill fails to load when it should.

The vision-to-mission skill demonstrates the tight-scope pattern:

> "Transform a user's builder vision into a complete, executable GSD mission package. Use this skill whenever a user has described what they want to BUILD..."

This description explicitly names what triggers the skill (builder vision, requests to structure for GSD, decompose into missions) and distinguishes it from its sibling: "Compare with `research-mission-generator`, which produces a LaTeX research document. Use this skill when the goal is to *build* something."

This is scope with explicit exclusions --- the SOP engineering principle from M1 Section 1.2 expressed as a skill activation rule.

### 1.3 The Self-Containment Test

M1's writing discipline principle that every SOP step must be executable without external interpretation has a direct GSD counterpart. The vision-to-mission skill states it as the **self-containment test**: "delete every other file, hand an agent this one spec --- can they build it? Yes = done. No = copy more context in."

This test is the SOP usability test from M1 Section 2.5 applied to agentic procedures. M1 specified: give the SOP to a qualified operator who did not write it and observe whether they can execute it on the first attempt without assistance. The self-containment test is the same evaluation with "qualified operator" replaced by "agent" and "first attempt without assistance" replaced by "can they build it with only this file."

The consequence is identical in both cases. A procedure that fails the test has implicit dependencies --- knowledge that the author assumes the consumer possesses but the document does not convey. For human SOPs, implicit dependencies produce phone calls, escalations, and incidents. For agent SOPs, implicit dependencies produce hallucination, incorrect outputs, or execution failures. The failure mode differs; the design defect is the same.

---

## 2. Validation Against Existing Skills

To test the SKILL.md-to-SOP mapping, three production skills from the repository were audited against the canonical eight sections. Each skill was read in full and each section was classified as Present (the information exists as a distinct, identifiable element), Implicit (the information can be inferred but is not explicitly structured as a separate element), or Missing (the information is absent).

### 2.1 Vision-to-Mission

**File:** `.claude/skills/vision-to-mission/SKILL.md`  
**Size:** 236 lines, 10 numbered steps, 2 reference files, 5 ecosystem patterns

| # | SOP Section | Status | Evidence |
|---|------------|--------|----------|
| 1 | Purpose | **Present** | `description:` field (long, detailed, 150+ words). Explicitly states what the skill produces and when it activates. Names triggering phrases. |
| 2 | Scope | **Present** | Pipeline Speed Detection table (Full / Fast / Mission-only). "This skill produces builders' output, not researchers' output" --- explicit exclusion. |
| 3 | References | **Present** | `references/` directory containing `vision-archetypes.md` and `mission-templates.md`. Inline references to these files at relevant steps. |
| 4 | Definitions | **Implicit** | Archetype table (Educational Pack, Infrastructure Component, etc.) defines domain vocabulary. Terms like "chipset," "CAPCOM," "wave" used without formal definition section. |
| 5 | Roles & Responsibilities | **Implicit** | Step 6 "Assign Models" defines the 30/60/10 Opus/Sonnet/Haiku split. Activation profiles (Patrol/Squadron/Fleet) define crew composition. But no explicit RACI-equivalent mapping. |
| 6 | Procedure | **Present** | Steps 1 through 10, each with clear inputs, actions, and outputs. Step structure: Harvest, Identify, Draft, Research, Decompose, Assign, Plan, Test, Produce, Deliver. |
| 7 | Quality Checks | **Present** | "Vision doc quality gates" (8-item checklist with checkboxes). "Common Mistakes to Avoid" (8 items). Self-containment test for component specs. |
| 8 | Records / Success Criteria | **Implicit** | File manifest in Step 9 defines the output structure. Delivery summary in Step 10 specifies what is communicated. But no explicit success criteria section --- success is defined by the output file set existing and the quality gates passing. |

**Assessment:** 5 of 8 sections explicitly present. 3 implicit. 0 missing. This skill is the most SOP-complete of the three evaluated. Its primary gaps are the absence of a formal Definitions section and the implicit rather than explicit statement of success criteria.

### 2.2 Research Engine

**File:** `.claude/skills/research-engine/SKILL.md`  
**Size:** 62 lines, 6 pipeline stages, version field present

| # | SOP Section | Status | Evidence |
|---|------------|--------|----------|
| 1 | Purpose | **Present** | `description:` field: "Autonomous research pipeline --- topic to structured documents with HTML/PDF output." Short but specific. Also includes performance evidence: "Proven at HEL (28 docs, 91K words) and OOPS (9 docs, 20K words) scale." |
| 2 | Scope | **Implicit** | Activation sentence: "Activates when user requests deep research, investigation, or analysis of a topic that will produce multiple structured documents." No explicit exclusions. No "When NOT to Use" section. |
| 3 | References | **Implicit** | Build Infrastructure section references `template.tex`, `html-template.html`, `build.sh`. But these are output tooling references, not upstream procedural references. No `references/` directory. |
| 4 | Definitions | **Partial** | Project Codes section (HEL, OOPS, OPEN) defines the naming convention. No broader terminology section. |
| 5 | Roles & Responsibilities | **Missing** | No model assignment. No chipset configuration. No role definitions. The skill assumes a single executor without specifying who or what that executor is. |
| 6 | Procedure | **Present** | 6-stage pipeline: Decompose, Parallel Research, Aggregate, Structure, Build, Publish. Each stage has a description. Stage 2 specifies parallelism ("2-6 in parallel"). |
| 7 | Quality Checks | **Present** | Quality Standards section with 5 explicit criteria: minimum word count, evidence requirements, cross-references, fact-check pass, three output formats. |
| 8 | Records / Success Criteria | **Implicit** | Stage 4 (Structure) defines the output file set. Stage 6 (Publish) defines the distribution actions. But no explicit "the procedure has succeeded when..." statement. |

**Assessment:** 3 of 8 sections explicitly present. 4 implicit or partial. 1 missing. The research-engine skill is operationally effective but structurally lean. Its most significant gap is the absence of Roles and Responsibilities --- a direct consequence of being written for a single-agent execution model rather than a multi-agent chipset. The missing scope exclusions are a triggering accuracy risk: without explicit "When NOT to Use" guidance, the skill may activate for tasks better served by a different research approach.

### 2.3 Done-Retirement

**File:** `.claude/skills/done-retirement/SKILL.md`  
**Size:** 378 lines, 7 pipeline stages with code examples, integration tables

| # | SOP Section | Status | Evidence |
|---|------------|--------|----------|
| 1 | Purpose | **Present** | `description:` field clearly states the function. Body text adds a hardware analogy: "done retirement is the instruction retirement unit --- it takes completed instructions from the execution unit (polecat), writes results to the register file (shared repository), updates the reorder buffer (merge queue), and frees execution resources." |
| 2 | Scope | **Present** | "Activation Triggers" section lists 4 specific conditions. "Boundary: What Done Retirement Does NOT Do" section lists 5 explicit exclusions. This is the most SOP-compliant scope in the evaluated set. |
| 3 | References | **Present** | "Integration with Other Gastown Skills" table (8 skill relationships). "References" section at end with `references/gastown-origin.md`. |
| 4 | Definitions | **Present** | Domain terminology defined through use: "bead" (work item), "polecat" (worker agent), "convoy" (batch dispatch), "hook" (work assignment), "mayor" (coordinator), "witness" (observer), "refinery" (merge processor). Defined implicitly but consistently throughout, and the Communication Protocol table provides a role glossary. |
| 5 | Roles & Responsibilities | **Present** | Communication Protocol table defines which roles send and receive which messages. Integration table maps 8 skill-to-role relationships. The polecat-mayor-witness-refinery responsibility chain is explicit. |
| 6 | Procedure | **Present** | 7-stage pipeline (Validate, Commit, Push, Submit, Notify, Cleanup, Terminate) with TypeScript code examples for each stage. Error handling documented per stage. Irreversibility boundary explicitly marked. |
| 7 | Quality Checks | **Present** | Stage 1 (Validate) is entirely a quality check: acceptance criteria verification before the pipeline proceeds. Convoy progress tracking provides aggregate quality measurement. |
| 8 | Records / Success Criteria | **Implicit** | The "Done Means Gone" principle defines the terminal state. Merge request records, mail notifications, and convoy progress updates constitute the audit trail. But no explicit "success criteria" section. |

**Assessment:** 7 of 8 sections explicitly present. 1 implicit. 0 missing. The done-retirement skill is the most SOP-complete of the three. Its only gap is the absence of an explicit success criteria statement --- though the irreversibility boundary and the "Done Means Gone" principle serve this function implicitly.

---

## 3. Gap Analysis and Pattern Identification

### 3.1 Cross-Skill Gap Summary

| SOP Section | vision-to-mission | research-engine | done-retirement |
|------------|:-----------------:|:---------------:|:---------------:|
| 1. Purpose | Present | Present | Present |
| 2. Scope | Present | Implicit | Present |
| 3. References | Present | Implicit | Present |
| 4. Definitions | Implicit | Partial | Present |
| 5. Roles & Responsibilities | Implicit | **Missing** | Present |
| 6. Procedure | Present | Present | Present |
| 7. Quality Checks | Present | Present | Present |
| 8. Records / Success Criteria | Implicit | Implicit | Implicit |

### 3.2 Identified Patterns

**Pattern 1: Success Criteria are universally implicit.** All three skills define what they produce (output files, state transitions, notifications) but none include an explicit "this procedure has succeeded when..." statement. Success is inferred from the pipeline completing without error. This is a systematic gap across the skill library.

In SOP engineering terms (M1 Section 1.8), this gap means the audit surface is incomplete. An auditor --- or an orchestrating agent --- reviewing the skill's execution cannot determine from the skill document alone whether the execution met its objectives. They must infer success from the absence of error, which is a weaker evidence standard than the presence of verified outcomes.

**Pattern 2: Purpose and Procedure are universally strong.** Every skill has a clear `description:` field and a well-structured workflow section. These are the two sections that have the most direct operational impact --- they determine whether the skill loads and what it does --- so their completeness reflects the evolutionary pressure of daily use. Skills with weak descriptions over-trigger or under-trigger; skills with weak procedures produce incorrect outputs. Both failure modes are immediately visible, so both sections get refined.

**Pattern 3: Definitions are embedded, not structured.** None of the three skills have a formal "Definitions" section. Instead, domain terms are introduced through contextual use. The done-retirement skill defines "bead," "polecat," "convoy," and "refinery" by using them in sentences that make their meaning clear. This is adequate for human readers who process context naturally, but it is a structural weakness for cross-referencing: there is no canonical definition of "bead" that other skills can reference.

**Pattern 4: Scope completeness correlates with skill maturity.** The done-retirement skill --- the most complex and most thoroughly documented of the three --- has both inclusion and exclusion scope. The research-engine skill --- the shortest and least detailed --- has no explicit exclusions. This pattern matches the M1 finding that scope completeness improves with operational experience: teams discover what is *not* in scope through encounters with edge cases.

**Pattern 5: Roles emerge from multi-agent architecture.** The done-retirement skill has explicit roles because it operates in a multi-agent environment (Gastown chipset) where communication between agents requires defined sender-receiver relationships. The research-engine skill has no roles because it was written for single-agent execution. The vision-to-mission skill has implicit roles because it generates output for other agents but does not directly orchestrate them. This suggests that **role specification is driven by integration complexity, not by SOP completeness discipline**. Skills that interact with other skills specify roles; skills that execute alone do not.

### 3.3 Root Cause

The gaps are not random. They follow a pattern that M2's maturity model predicts. The GSD skill library was built incrementally, driven by operational need rather than by a template that enforces structural completeness. Each skill was written to solve a specific problem and refined through use. The sections that have direct operational impact (Purpose, Procedure, Quality Checks) are universally strong because defects in those sections produce visible failures. The sections with indirect impact (Definitions, Success Criteria) are universally weak because their absence does not produce immediate failures --- it produces long-term auditability and cross-referencing debt.

This is the Level 2 to Level 3 transition pattern from M2 Section 1.2: individual practices are effective at the project level but not yet standardized across the organization. Each skill is a good SOP *for its specific use case*, but the skill library as a whole does not enforce a consistent structural standard.

---

## 4. Wave Plan as Sequential SOP with Gates

### 4.1 Wave Structure as Defined Process

M2 established that a CMMI Level 3 organization has a documented, tailored standard process for all major activities. New projects begin from the organizational standard and tailor explicitly. M2 Section 6.3 identified the GSD wave plan as the agentic equivalent of a defined process.

The structural correspondence is precise. A wave plan specifies:

- **The work to be performed** (tasks assigned to modules and tracks)
- **The sequence and parallelism** (waves with explicit dependency declarations)
- **The agent configuration** (model assignment: Opus for synthesis, Sonnet for research, Haiku for scaffolding)
- **The success criteria** (gates between waves)
- **The measurement points** (CAPCOM review checkpoints)

The engineering-sops mission schema (`schema.json`) instantiates this pattern. Wave 0 (Foundation) runs sequentially with Haiku for scaffolding tasks. Waves 1A and 1B run in parallel on separate tracks --- M1 + M2 on Track A, M3 + M4 on Track B --- each gated before the next wave proceeds. Wave 2 (this module) runs sequentially on Opus with all four prior modules as dependencies. Wave 3 (Publication and Verification) runs sequentially on Sonnet.

This is not an ad hoc project plan. It is a parameterized instance of the vision-to-mission skill's standard wave structure, tailored for this specific mission. The tailoring is documented in the schema: the activation profile is "Squadron (12 roles, 5 modules, 2 parallel tracks)," the token budget is "~143K across 2-3 sessions," and the crew manifest assigns specific models to specific roles.

In CMMI terms, this is exactly what Level 3 looks like: a standard process (the vision-to-mission pipeline) instantiated with explicit tailoring (the engineering-sops schema) and traceable back to the organizational standard (the SKILL.md that defines the pipeline).

### 4.2 CAPCOM Gates as SOP Lifecycle Stages

M3 defined the SOP lifecycle: Draft, Review, Approve, Publish, Train, Implement, Revise, Retire, Archive. Each stage has entry criteria, activities, exit criteria, roles, and artifacts. The Approve stage is the critical gate: a binary decision by someone who did not author the document.

The CAPCOM gate in GSD wave execution is the Approve stage. The schema declares `"gate_after": true` for each research track and for the synthesis wave. At each gate, the human operator (CAPCOM) reviews the wave output against the schema's success criteria and makes a go/no-go decision. This maps directly to M3's Approve stage:

| SOP Lifecycle Element | CAPCOM Gate Equivalent |
|----------------------|----------------------|
| Entry criteria | Wave deliverables exist; quality checks passed |
| Activities | CAPCOM reviews output against success criteria |
| Exit criteria | Go decision recorded |
| Roles | CAPCOM (human); no authorship overlap with EXEC agents |
| Artifacts | Gate decision record (implicit in session transcript) |

The independence requirement from M3 is preserved: CAPCOM does not author the modules. The agents (EXEC_A, EXEC_B, CRAFT_PROC, CRAFT_GOV) produce the work; CAPCOM reviews it. This is the same separation of duties that M2 Section 2.4 identified as NASA's IV&V principle: the reviewer who did not write the procedure is more likely to find the assumptions the procedure does not convey.

### 4.3 Wave Dependencies as Reference Chains

M1 Section 1.3 established that the References section catalogs every external document needed to execute the procedure, including upstream SOPs that produce inputs required by this procedure and downstream SOPs that consume its outputs. The engineering-sops schema encodes this as module dependencies:

```json
"M5": {
  "dependencies": ["M1", "M2", "M3", "M4"],
  "deliverables": ["GSD SOP Implementation Guide", "Cross-Module Synthesis"]
}
```

This is a formal reference chain. M5 cannot execute until M1 through M4 have completed, because M5 requires their content as input. The dependency is not advisory --- it is structural. The orchestrator will not dispatch M5 until all four dependencies have passed their gates.

In SOP terms, this is the procedural graph that M1 warned must not contain invisible dependencies. Each module declares its prerequisites explicitly. When an upstream module changes (M2 is revised), the dependency chain identifies which downstream modules require review (M5 depends on M2, therefore M5's synthesis of M2 content must be re-validated).

### 4.4 Parallel Tracks as Independent SOPs

Waves 1A and 1B in the engineering-sops schema run in parallel because their modules have no data dependency between them. M1 and M2 produce Track A content; M3 and M4 produce Track B content. Neither track requires the other's output.

This is the SOP decomposition principle from M1 Section 3.5: procedures that can be independently verified should be independently documented and independently executed. Merging independent procedures into a sequential chain introduces artificial dependencies that slow execution without improving quality. The parallel track structure reflects accurate dependency analysis, not a scheduling optimization.

The constraint is important: parallel tracks must be genuinely independent. If Track B's M4 (AI-Augmented SOPs) required content from Track A's M2 (Process Maturity), the parallelism would be invalid. The schema records this dependency explicitly: M4 depends on M2, so the orchestrator may sequence them despite the track assignment. The wave structure accommodates both parallelism and dependency with a single mechanism.

### 4.5 Commit Messages as Procedural Audit Trail

M3 Section 3 established that version control for procedural documents requires an immutable record of what changed, when, by whom, and why. The GSD commit convention --- `<type>(<scope>): <subject>` --- is this audit trail applied to every artifact in the system, including the skills and wave plans themselves.

Each commit message in the engineering-sops mission records a procedural event:

- `feat(mission): Engineering SOPs --- schema and module stubs` (Wave 0 completion)
- `feat(mission): M1 SOP Anatomy --- complete` (Track 1A, Module 1 delivery)
- `feat(mission): M5 GSD Implementation --- synthesis complete` (Wave 2 delivery)

These messages are not decorative. They are the "Records" section (SOP Section 8) for the mission's execution. An auditor can reconstruct the mission's execution timeline from the commit log: what was produced, in what order, with what wave markers. The wave commit marker format preserves bisect intent even when session boundaries force combining waves:

```
feat(scope): summary of combined work

Wave N: [what wave N delivered]
Wave M: [what wave M delivered]
```

This is an SOP records system. It is versioned (git), immutable (commit history), traceable (conventional commit format), and machine-parseable (type/scope/subject structure).

---

## 5. The 20% Bounded Learning Rule as Change Control

### 5.1 The Rule

The gsd-skill-creator system includes a bounded learning constraint for self-modifying skills: no single update may change more than 20% of a skill's content. This rule is documented in the vision-to-mission skill's reference file (`references/vision-archetypes.md`, line 220):

> "Missing bounded-learning constraints (for self-modifying skills: 20% max change per update, 3-correction minimum before promotion, 7-day cooldown)"

The rule has three components:
1. **20% max change per update** --- quantitative limit on modification scope
2. **3-correction minimum before promotion** --- evidence threshold before a pattern is elevated to a skill
3. **7-day cooldown** --- temporal buffer preventing rapid successive changes

### 5.2 Mapping to SOP Change Control

M3 Section 6 defined change control as an engineering discipline with triggers, assessment, approval, implementation, and verification stages. The bounded learning rule maps to these stages:

**Change scope assessment.** M3 requires that every proposed change be assessed for impact before implementation. The 20% quantitative limit is a machine-enforceable version of this assessment. Rather than requiring a human to judge whether a change is "minor" or "major," the rule establishes a bright line: changes within 20% are minor revisions; changes exceeding 20% require architectural review and a major version increment.

**Semantic versioning alignment.** M3 Section 3 established semantic versioning for procedural documents: patch for corrections that do not change procedure behavior, minor for additions that are backward-compatible, major for changes that alter the procedure's behavior or interface. The 20% rule operationalizes the minor/major boundary:

| Change Scope | Semantic Version | Governance |
|-------------|-----------------|------------|
| Correction of error, no behavior change | Patch (1.0.0 to 1.0.1) | Author + single reviewer |
| Addition or refinement within 20% | Minor (1.0.1 to 1.1.0) | Author + reviewer + approval |
| Structural change exceeding 20% | Major (1.1.0 to 2.0.0) | Architectural review required |

**Configuration management.** M2 Section 2.5 identified NASA NPR 7150.2D's configuration management requirements: identification, change control, status accounting, and audit. The bounded learning rule is the change control component. It prevents the class of failure where a well-intentioned improvement cascades into an incompatible rewrite. In NASA CM terms, the 20% limit is the equivalent of requiring that a change request demonstrate the modification is bounded and does not invalidate the existing baseline.

### 5.3 Why Bounding Matters for Self-Modifying Systems

M4 Section 8.4 identified the connection between bounded learning and auditable agent behavior: "The SOP defines the boundary. The agent can optimize within the boundary... but it cannot deviate from the boundary without explicit human authorization."

For a self-modifying system like gsd-skill-creator, unbounded learning is a process maturity regression. An agent that rewrites its own skills without constraint is a CMMI Level 1 organization: ad hoc, individual-dependent, and unpredictable. The 20% rule, the 3-correction threshold, and the 7-day cooldown collectively ensure that self-modification follows a defined process:

- **The 3-correction minimum** prevents premature generalization. A pattern observed once may be coincidental. A pattern observed three times in separate contexts is evidence. This is the "measurement precedes optimization" principle from M2's central argument.
- **The 7-day cooldown** prevents oscillation. Without a temporal buffer, a skill could be modified, found inadequate, modified again, found inadequate again, and modified a third time --- all within a single sprint. The cooldown forces the modified skill to operate in production for a week before further changes are permitted, providing a measurement window.
- **The 20% cap** prevents breaking changes that slip through as "updates." An update that rewrites half a skill is not an update --- it is a replacement. The cap ensures that the skill's identity (its purpose, scope, and fundamental procedure) persists across versions.

This three-part constraint is a complete change-control mechanism. It has a quantitative scope limit (20%), an evidence threshold (3 corrections), and a stabilization period (7 days). Any one of these alone would be insufficient. Together, they form a change-control SOP for the skill system itself.

---

## 6. push.default=nothing as Version-Control SOP

### 6.1 The Staging Discipline

GSD configures `push.default=nothing` in the git repository. This setting means that `git push` with no arguments does nothing. Every push to a remote requires an explicit branch specification. The test suite verifies this configuration (`test/git/safety.test.ts`, test S-01).

This is not a git preference. It is a version-control SOP.

### 6.2 Procedural Equivalence

M3 Section 1, Stage 3 (Approve) established that no SOP reaches the shared baseline without explicit review and approval. M3's single-source-of-truth principle states that "no document goes anywhere without an explicit, traceable push." The `push.default=nothing` setting is this principle implemented at the tooling level.

In a repository with `push.default=current` or `push.default=matching`, a developer's `git push` silently propagates local changes to the remote. The developer may not intend to publish all local branches. The default behavior bypasses the review step.

With `push.default=nothing`, every publication requires a conscious act: `git push origin branch-name`. The developer must name the branch they intend to publish. This is the procedural equivalent of requiring an explicit approval signature before a document enters the shared baseline.

The mapping to M3's SOP lifecycle is direct:

| SOP Lifecycle Stage | Git Equivalent with push.default=nothing |
|--------------------|------------------------------------------|
| Draft | Local commits on working branch |
| Review | Code review / PR review |
| Approve | Merge approval |
| Publish | Explicit `git push origin branch-name` |

Without `push.default=nothing`, the Draft-to-Publish path has no structural gate. A local commit can reach the remote without passing through Review or Approve. The setting closes this gap by making publication an explicit, named action.

### 6.3 CMMI Level 3 Configuration Management

M2 Section 2.5 identified four CM requirements from NASA NPR 7150.2D: identification, change control, status accounting, and audit. The `push.default=nothing` setting addresses the change control requirement specifically: no change to a controlled item without a documented change request, impact assessment, and approval.

In practice, `push.default=nothing` combined with branch protection rules creates a two-gate system:

1. **Gate 1 (push.default=nothing):** The developer must explicitly choose which branch to push. Accidental publication of work-in-progress branches is structurally prevented.
2. **Gate 2 (branch protection):** The target branch (main) requires review approval before merge. Changes cannot reach the baseline without passing through the review stage.

This two-gate system is the CMMI Level 3 configuration management practice applied to the code repository. It ensures that the shared baseline is a curated, reviewed, approved artifact --- not a collection of whatever happened to be pushed.

---

## 7. Component Specs as Machine-Parseable SOP Units

### 7.1 Structure

A GSD component spec is a self-contained document that describes one unit of work for one agent invocation. The vision-to-mission skill defines the format: each component spec must pass the self-containment test, have clear inputs and outputs, and map to exactly one agent execution.

This structure maps directly to the DACP bundle specification from M4 Section 4.1. Both have the same three-layer architecture:

| DACP Layer | Component Spec Equivalent |
|-----------|--------------------------|
| Human Intent | Component description, purpose statement, through-line connection |
| Structured Data | Inputs, outputs, dependencies, acceptance criteria, model assignment |
| Executable | Step-by-step implementation instructions, code examples, test specifications |

The DACP requirement that all three layers be present, consistent, and maintained together as a unit is the component spec requirement expressed in formal SOP terms. A component spec without a purpose statement (Human Intent) cannot be reviewed for appropriateness. A component spec without structured inputs/outputs (Structured Data) cannot be validated for correctness. A component spec without implementation steps (Executable) cannot be executed.

### 7.2 Single-Responsibility Principle

M1 Section 3.1 established that a linear step list should be 5 to 25 steps, and that procedures requiring more than 25 steps should be evaluated for decomposition. The vision-to-mission skill applies this principle at the component level: "One component = one agent invocation = one verifiable artifact."

Component granularity maps to SOP single-responsibility. A component spec that tries to accomplish two independent objectives is a procedure with scope creep. The self-containment test catches this: if a component cannot be built by a single agent without reference to other components, it either has undeclared dependencies or it is trying to do too much.

The sizing guide in the vision-to-mission skill quantifies this:

| Complexity | Components | SOP Equivalent |
|-----------|-----------|----------------|
| Simple feature | 4--5 | 4--5 task-level SOPs |
| Medium system | 6--8 | 6--8 procedures organized by work breakdown |
| Complex pack | 8--12 | Full procedure library for a subsystem |
| Mega-milestone | 12--20 | Comprehensive process documentation suite |

This is the SOP decomposition discipline applied to agentic work planning. Each component is a procedure. The collection of components is a procedure library. The wave plan that sequences them is the master SOP that references sub-procedures --- M4 Section 4.5's DACP composition pattern.

### 7.3 Composability Through Dependency Chains

DACP composition works through sequential chaining and parallel fan-out. Component specs in a wave plan work through the same mechanisms:

- **Wave 0 components** (shared types, schemas) are prerequisites for all subsequent waves --- the equivalent of DACP preconditions.
- **Wave N components** within a parallel track are independent DACP bundles that can execute concurrently.
- **Integration components** in the final wave verify that the outputs of all preceding components compose correctly --- the equivalent of DACP postcondition verification at the composition level.

The sub-procedure substitution rule from M4 applies: each component's postconditions must satisfy the preconditions of components that depend on it. This constraint is what makes composed procedures reliable. The engineering-sops schema demonstrates this: M5 depends on M1 through M4, meaning M5's precondition (all four research modules complete and gated) is satisfied by the postconditions of Waves 1A and 1B.

### 7.4 The Cache-Aware Sequencing Constraint

The vision-to-mission skill introduces a constraint that has no direct counterpart in traditional SOP engineering but is critical for agentic execution: cache-aware sequencing. "Wave 0 producers start Wave 1 consumers before TTL expires" (5-minute cache window).

This constraint reflects a physical reality of agent execution: context loaded by one agent invocation is available to subsequent invocations only within a time window. If Wave 0 produces a shared schema and Wave 1 agents begin executing after the schema has expired from context, those agents must re-derive or re-read the schema --- introducing error opportunities.

In SOP engineering terms, cache-aware sequencing is a temporal dependency --- a constraint on *when* a step must begin relative to a predecessor, not just *whether* the predecessor has completed. Traditional SOPs handle temporal dependencies in safety-critical contexts: "administer medication within 30 minutes of preparation" is a temporal constraint. The cache TTL is the agentic equivalent: "begin agent execution within 5 minutes of shared context generation."

This constraint has implications for wave plan design. A wave plan that produces shared artifacts in Wave 0 and does not begin consuming them until Wave 2 has a temporal gap that may invalidate the shared context. The wave plan must account for this, either by ensuring consumers begin promptly or by designing the shared artifacts to be durable (written to files rather than held in transient context).

### 7.5 The Mission Control Pattern as SOP Independence

The vision-to-mission skill codifies the Mission Control Pattern: "We are the architects. Claude Code is the astronaut. Each mission doc is a complete flight plan. Every component spec self-contained. No spec may say 'see the other specs.'"

This pattern is the SOP independence principle from M1 Section 1.3 expressed as a design mandate. M1 warned that SOPs with invisible dependencies create procedural graphs where a change to one document silently invalidates another. The Mission Control Pattern prevents this by requiring that each component spec be a complete flight plan --- all context included, no cross-references to sibling components.

The practical consequence is redundancy. Two component specs that share a schema definition will both include that definition. This is deliberate. In SOP engineering, redundancy in self-contained procedures is preferable to coupling between procedures. A coupled procedure set is fragile: changing the shared element requires updating every document that references it, and missing one creates a silent inconsistency. A redundant procedure set is robust: each document is independently correct, and updating the shared element requires updating each document separately --- but each update is self-contained and verifiable.

The trade-off is maintenance cost versus execution reliability. For human-maintained procedure libraries, the maintenance cost of redundancy is high enough that coupling (via references) is the standard practice. For agent-generated procedure libraries where the vision-to-mission pipeline regenerates component specs from a single source, the maintenance cost of redundancy is near zero --- and execution reliability becomes the dominant concern.

---

## 8. GSD as Self-Documenting System

### 8.1 The Self-Documentation Property

A self-documenting system is one where the artifacts that govern the system's behavior are also the documentation of that behavior. GSD achieves this property through the convergence of six mechanisms, each of which corresponds to a distinct SOP engineering function:

| Mechanism | SOP Function | Evidence |
|-----------|-------------|----------|
| Skills (`.claude/skills/`) | Procedure library | Each skill is a bounded SOP for a category of work |
| Wave plans (schema.json, mission specs) | Workflow documentation | Each wave plan documents the sequence, parallelism, gates, and roles for a mission |
| CAPCOM gates | Approval checkpoints | Each gate documents a human review decision point |
| Commit messages (conventional commits) | Audit trail | Each commit records what changed, when, by whom, and why |
| Bounded learning rule | Change control | Constrains how the system modifies its own procedures |
| `push.default=nothing` | Publication control | Ensures no artifact reaches the baseline without explicit action |

In a traditional organization, these six functions are served by six different systems: a procedure management system, a project management tool, an approval workflow, a document management system, a change management process, and a configuration management policy. Each system is maintained independently, creating synchronization overhead and drift risk.

In GSD, these six functions are served by six features of the same system. The skills *are* the procedures. The wave plans *are* the project plans. The CAPCOM gates *are* the approval workflow. The commit messages *are* the document management record. The bounded learning rule *is* the change management process. The push configuration *is* the configuration management policy.

This convergence is not cosmetic. It eliminates the synchronization problem that M3 Section 5 identified as a governance failure mode: when the process documentation and the process execution live in different systems, they drift apart. In GSD, the documentation *is* the execution. A skill that is inaccurate produces incorrect agent behavior --- immediately, visibly, and traceably. The feedback loop between documentation quality and operational quality is direct and rapid.

### 8.2 The Feedback Loop

M2's central argument was that measurement precedes optimization. In a self-documenting system, the measurement is embedded in the execution:

1. **A skill executes.** The agent follows the skill's procedure. The execution produces artifacts, commits, and session transcripts.
2. **The execution is reviewed.** CAPCOM reviews the output. Defects are identified. If the defect traces to a skill instruction (a step that is ambiguous, a quality check that is missing, a scope boundary that is incorrect), the defect is a skill defect.
3. **The skill is updated.** The bounded learning rule governs the update: within 20%, with 3-correction evidence, after 7-day cooldown.
4. **The updated skill executes.** The cycle repeats.

This is the CMMI Level 5 continuous improvement loop: causal analysis of process outcomes feeding back into process updates, with measurement at each stage. The difference from traditional SOP improvement is speed. A traditional SOP revision cycle (M3 Section 1) takes weeks to months: draft, review, approve, publish, train. A skill update cycle takes hours to days: identify defect, propose correction, review commit, merge. The governance stages are the same; the ceremony overhead is lower because the skill file serves as its own draft, review artifact, and published document.

### 8.3 LLIS as Commit History

M2 Section 2.6 described NASA's Lessons Learned Information System (LLIS) as the institutional mechanism for capturing knowledge from operational experience. The LLIS loop has six stages: initiating event, causal analysis, lesson formulation, routing, action, and closure.

The GSD commit history serves the same function:

| LLIS Stage | GSD Equivalent |
|-----------|---------------|
| Initiating event | Bug discovered, test failure, CAPCOM review finding |
| Causal analysis | Developer investigation, root cause identified |
| Lesson formulation | Commit message explaining what changed and why |
| Routing | Commit pushed to shared branch; PR reviewed by team |
| Action | Skill file updated, hook modified, procedure changed |
| Closure | Commit merged; change active in production |

The difference is that in NASA's LLIS, lessons are formalized in a dedicated system. In GSD, lessons are embedded in the commit history. Every fix to a skill is a lesson learned. Every wave plan refinement is a process improvement. The history is the LLIS.

This has a practical consequence for organizational learning. A team onboarding to GSD can read the commit history for any skill and reconstruct the evolution of the procedure: what it originally looked like, what problems were encountered, and how the procedure was refined. The `git log` for a skill file is the skill's improvement history --- the equivalent of an LLIS archive for that specific procedure.

### 8.4 The Policy Hierarchy Embodied in Directory Structure

M3 Section 2 defined a four-layer policy hierarchy: Organization, Program/Product, Project/Team, and Task. M3 established that lower layers inherit from higher layers, may be more restrictive, but may not contradict higher-layer requirements.

The GSD codebase embodies this hierarchy in its directory structure:

| Policy Layer | GSD Directory | Content |
|-------------|--------------|---------|
| Organization | `.claude/skills/` | Skills define the organizational standard processes. They apply to all projects that use gsd-skill-creator. No project may override a skill's safety constraints. |
| Program | `.claude/agents/` | Agent definitions configure how the organizational skills are composed for specific mission types (executor, verifier, planner). |
| Project | `.planning/` | Project-specific state, roadmaps, requirements. Tailored from organizational standards but scoped to one project's lifecycle. |
| Task | Wave plan tasks, component specs | Individual work items assigned to individual agents. The most specific layer. |

The inheritance rules from M3 Section 2.2 are structurally enforced:

- **Rule 1 (Explicit inheritance):** Component specs reference the wave plan that contains them. Wave plans reference the skills they instantiate. The dependency chain is explicit in schema files.
- **Rule 2 (Restriction, not contradiction):** A project's `.planning/` configuration may add constraints (specific test thresholds, additional review gates) but may not disable organizational-level safety mechanisms (the security-hygiene skill, the pre-commit hook).
- **Rule 3 (Gap filling):** Project-level artifacts define procedures for activities not covered by organizational skills. A project-specific deployment checklist fills a gap that the general skill library does not address.
- **Rule 5 (Version pinning):** Skills include a `version:` field. When the organizational skill is updated, projects using the previous version receive the update through the normal dependency resolution --- but the version field provides the mechanism to identify which version a project was using when a specific execution occurred.

The anti-patterns from M3 Section 2.4 have structural prevention in GSD:

- **Org-level detail at task layer** is prevented by the skill/component separation: organizational procedures live in skills, not in component specs.
- **Task-level decisions at org layer** is prevented by the `.planning/` isolation: project-specific decisions live in the planning directory, not in the skill library.
- **Floating documents** are prevented by the directory structure itself: a file in `.claude/skills/` is organizationally scoped; a file in `.planning/` is project-scoped. There is no ambiguous middle ground.

### 8.5 The Ecosystem-Alignment Skill as Staleness Detection

M4 Section 3 described the living document architecture: continuous analysis of operations data produces alerts when documented procedures appear to diverge from actual practice. The review trigger is evidence-based rather than calendar-based.

The GSD ecosystem-alignment skill implements this pattern. It monitors external process environment changes --- new Claude Code features, GSD upstream version bumps, new hook types, changed subagent fields --- and signals when organizational processes need updating. This is the living document staleness detection mechanism from M4 applied to the skill library itself.

When Claude Code introduces a new hook type (PostCompact, FileChanged, PermissionDenied), the ecosystem-alignment skill detects the change and identifies which existing skills may need updating to take advantage of the new capability or to maintain compatibility. This is the event-triggered review from M3 Section 1.2: a specific event (upstream dependency change) that mandates an immediate review of affected procedures.

The distinction from calendar-triggered review is important. A skill that has not changed in six months may be perfectly current if its operational context has not changed. A skill that was updated yesterday may be stale if an upstream dependency changed this morning. Event-triggered review catches the second case; calendar-triggered review catches the first. The ecosystem-alignment skill implements the event-triggered path. The `last_reviewed` field recommended in Section 9.2 implements the calendar path. Both are necessary for complete staleness detection.

---

## 9. Recommendations

The gap analysis in Section 3 and the structural mappings in Sections 4 through 8 identify five concrete improvements to the GSD ecosystem. Each recommendation addresses a specific gap between current practice and SOP engineering principles.

### 9.1 Make Success Criteria Explicit in All SKILL.md Files

**Gap:** All three evaluated skills have implicit success criteria. Success is inferred from pipeline completion rather than stated as verifiable conditions.

**Recommendation:** Add a `## Success Criteria` section to the SKILL.md template. This section must contain 3 to 8 measurable conditions that define "this procedure has succeeded." Each condition must be verifiable by an agent or human reviewer.

**Example for research-engine:**

```markdown
## Success Criteria

1. All investigation tracks produced documents meeting the 1,500-word minimum.
2. Cross-references between documents resolve correctly (no broken links).
3. Fact-check pass completed with zero unresolved claims.
4. All three output formats (markdown, HTML, PDF) build without error.
5. GitHub release created with full release notes body.
```

**Rationale:** M1 Section 1.8 established that records and success criteria are not optional --- they are the evidence that the procedure was followed and succeeded. Making criteria explicit transforms the audit from "did it complete?" to "did it achieve its objectives?" --- a strictly stronger evidence standard.

### 9.2 Add Review Trigger Dates to Skills

**Gap:** No evaluated skill includes a review-due date or review trigger conditions in its front-matter.

**Recommendation:** Add two front-matter fields to the SKILL.md format:

```yaml
last_reviewed: "2026-04-05"
review_triggers:
  - "Claude Code major version update"
  - "GSD version bump"
  - "3+ execution failures traced to skill instructions"
  - "Calendar: 6 months from last_reviewed"
```

**Rationale:** M3 Section 1.2 established that SOPs require both calendar-triggered and event-triggered review. M4's living document architecture replaces the calendar model with a signal model. The review trigger fields implement both: a calendar baseline (6 months) and event conditions specific to the skill's dependencies. Without these fields, skill staleness is detected only when a failure occurs --- a reactive rather than proactive governance model.

### 9.3 Formalize the SKILL.md-to-SOP Mapping as a Template Standard

**Gap:** The 8-section mapping exists in the mission schema (`schema.json`, `skill_md_mapping`) but is not enforced as a structural requirement for new skills.

**Recommendation:** Create a SKILL.md template that includes all 8 sections as structural placeholders. Skills that do not need a section (e.g., a single-agent skill that does not need Roles) must include the section header with an explicit "Not applicable: [reason]" note rather than omitting it.

**Proposed template structure:**

```markdown
---
name: skill-name
description: "..."
version: "1.0.0"
last_reviewed: "YYYY-MM-DD"
review_triggers: [...]
---

# Skill Name

[Purpose paragraph]

## Scope
### When to Use
### When NOT to Use

## References

## Definitions

## Roles & Responsibilities

## Procedure

## Quality Checks

## Success Criteria
```

**Rationale:** M1 Section 1 established that any document missing a section has a structural defect. The current skill library has no mechanism to enforce structural completeness at creation time. A template with all sections present as placeholders prevents the most common gap pattern identified in Section 3: sections that are absent because they were never prompted.

### 9.4 Create a Maturity Self-Assessment Mapped to GSD Patterns

**Gap:** M2 provides a 5-level maturity model with observable behavioral indicators, but there is no self-assessment tool that maps these indicators to GSD ecosystem patterns.

**Recommendation:** Produce a self-assessment checklist where each CMMI level's observable indicators are expressed as GSD-specific artifacts and practices:

| CMMI Level | GSD Observable Indicator |
|-----------|------------------------|
| Level 1 | Tasks tracked informally; no wave plans; ad hoc commits; skills not used |
| Level 2 | Wave plans exist per project; `.planning/STATE.md` maintained; conventional commits enforced; but each project structures differently |
| Level 3 | Skills define standard process for each work category; vision-to-mission pipeline used consistently; CAPCOM gates at wave boundaries; chipset configurations standardize agent composition; SKILL.md template enforced |
| Level 4 | Chain scores tracked across milestones; token budget measured per convoy; CAPCOM gate approval rates trended; defect density at review measured and baselined |
| Level 5 | Bounded learning produces measurable skill improvements; ecosystem-alignment skill triggers process updates from upstream changes; retrospective findings feed directly into skill revisions with evidence trail |

**Rationale:** M2 Section 5 documented that organizations systematically overestimate their own maturity. A self-assessment mapped to concrete, observable GSD artifacts makes the assessment more accurate because it requires evidence rather than opinion. "Do you have wave plans?" is answerable by checking the repository. "Are your processes documented?" is answerable by opinion --- and opinion is unreliable.

### 9.5 Add a Formal Definitions Section to High-Integration Skills

**Gap:** Domain terminology is defined through contextual use rather than structured reference. This works for human readers but creates cross-referencing fragility.

**Recommendation:** Skills that define domain-specific terminology used by other skills should include a formal Definitions section. This section should use a consistent format:

```markdown
## Definitions

| Term | Definition | Used By |
|------|-----------|---------|
| bead | A discrete unit of work assigned to a single agent | done-retirement, sling-dispatch, beads-state |
| polecat | An ephemeral worker agent that executes one bead and terminates | polecat-worker, done-retirement |
| convoy | A batch dispatch of multiple beads to multiple polecats | mayor-coordinator, sling-dispatch |
```

The "Used By" column creates the cross-reference chain that M1 Section 1.3 requires: when a term's definition changes, the downstream skills that depend on that definition can be identified and reviewed.

**Rationale:** Pattern 3 from Section 3.2 identified that definitions are embedded, not structured. As the skill library grows and skills increasingly reference each other's concepts, the absence of canonical definitions will produce terminology drift: two skills using the same word to mean slightly different things. A formal Definitions section prevents this failure mode.

---

## 10. Cross-Module Synthesis

### 10.1 Three Architectural Patterns

Across all five modules, three architectural patterns emerge that unify SOP engineering principles with GSD ecosystem design:

**Pattern A: Boundary as Safety Mechanism.**

M1 defines scope as the boundary of applicability. M2 defines maturity levels as boundaries of organizational capability. M3 defines policy hierarchy as boundaries of authority. M4 defines bounded learning as a constraint boundary for self-modification. In GSD, every structural element has an explicit boundary: skills have activation triggers and exclusion lists; wave plans have dependency gates; the 20% rule caps modification scope; `push.default=nothing` gates publication.

The unifying principle: in safety-critical and self-modifying systems, explicit boundaries are not constraints on productivity --- they are the mechanism by which the system remains trustworthy. An unbounded SOP is an SOP that applies to everything and therefore governs nothing. An unbounded skill is a skill that triggers on every task and therefore specializes none. An unbounded self-modification rule is no rule at all.

**Pattern B: Document Is Execution.**

Traditional SOP engineering separates the document from the execution. The procedure is written in a document management system; it is executed in an operational environment. Drift between the two is the primary governance failure mode identified in M3.

GSD collapses this separation. The skill file is both the document and the execution instruction. The wave plan is both the project plan and the execution script. The commit message is both the change record and the audit evidence. This collapse eliminates an entire class of governance problems: the documentation cannot drift from the execution because they are the same artifact.

This is the DACP principle from M4 applied at the system level. A DACP bundle requires three layers (human intent, structured data, executable) in a single unit so that they cannot diverge. GSD applies this principle to the entire system: the human-readable documentation and the machine-executable instruction are the same file.

**Pattern C: Measurement Through Use.**

M2 argues that measurement precedes optimization. Traditional SOP measurement requires instrumentation: someone must observe executions, record deviations, track outcomes, and analyze trends. This instrumentation is expensive, so it is applied selectively --- only to the most critical procedures.

In GSD, measurement is a byproduct of execution. Every skill execution produces a commit history. Every CAPCOM gate produces a review record. Every chain score produces a quality trend. The measurement infrastructure is the execution infrastructure. This makes Level 4 measurement practices accessible without Level 4 instrumentation overhead.

### 10.2 The Maturity Trajectory

Taken together, the five modules describe a maturity trajectory for agentic systems that parallels the CMMI organizational trajectory:

**Stage 1 (Ad Hoc):** Agents receive free-form prompts. No skills. No wave plans. Outcomes depend on the quality of the individual prompt.

**Stage 2 (Managed):** Wave plans document scope and sequence. `.planning/STATE.md` tracks project status. Conventional commits provide basic CM. Each project has its own process.

**Stage 3 (Defined):** Skills define the organizational standard process. The vision-to-mission pipeline produces consistent mission packages. SKILL.md template enforces structural completeness. CAPCOM gates provide review checkpoints.

**Stage 4 (Quantitatively Managed):** Chain scores provide cross-milestone quality measurement. Token budgets provide resource consumption data. CAPCOM gate patterns provide process calibration data.

**Stage 5 (Optimizing):** Bounded learning drives continuous skill improvement. Ecosystem-alignment monitors external changes. Retrospective findings feed directly into the process asset library (skills).

The GSD ecosystem currently operates at Stage 3 with Stage 4 measurement infrastructure in place and Stage 5 mechanisms active through bounded learning. The primary gap is Stage 3 structural completeness --- specifically the SKILL.md template enforcement and explicit success criteria identified in Section 9.

### 10.3 The Central Claim

The central claim of this module, supported by the evidence in Sections 1 through 9:

**GSD ecosystem patterns are not analogous to SOP engineering. They are SOP engineering.**

The SKILL.md file is a bounded SOP. The wave plan is a defined process. The CAPCOM gate is an approval stage. The bounded learning rule is change control. The push staging discipline is configuration management. The commit convention is the audit trail. The component spec is a DACP bundle. The skill library is a process asset library. The self-containment test is the SOP usability test.

Every term on the left has a formal definition in SOP engineering literature. Every term on the right has a concrete implementation in the GSD codebase. The mapping is not metaphorical. It is structural.

This has a practical implication. Organizations using GSD are practicing SOP engineering whether they know it or not. The quality of their SOP practice is determined by the quality of their skill files, wave plans, and governance mechanisms. The five recommendations in Section 9 are not additions to GSD --- they are completions. They close the gaps between what GSD already does and what the SOP engineering literature identifies as necessary for a mature, auditable, continuously improving procedural system.

---

## 11. References

### Standards and Frameworks (from M1--M4)

- ISO/IEC/IEEE. *ISO/IEC/IEEE 15289:2017 Systems and Software Engineering --- Content of Life-Cycle Information Items.* Geneva: ISO, 2017. (SOP section requirements)
- CMMI Institute / ISACA. *CMMI Version 3.0.* Pittsburgh: CMMI Institute, 2023. (Maturity levels, practice areas)
- NASA. *NPR 7150.2D: NASA Software Engineering Requirements.* Washington, D.C.: NASA, 2022. (Configuration management, IV&V, software classification)
- ISO/IEC/IEEE. *ISO/IEC/IEEE 12207:2017 Systems and Software Engineering --- Software Life Cycle Processes.* Geneva: ISO, 2017. (Process hierarchy, lifecycle stages)

### Research (from M4)

- Ye, Anbang et al. "SOP-Agent: Empower General Purpose AI Agent with Domain-Specific SOPs." arXiv:2501.09316, January 2025. (Agent SOP constraint mechanism, bounded learning)

### GSD Codebase Artifacts (validated in this module)

- `.claude/skills/vision-to-mission/SKILL.md` --- 236 lines, 10-step pipeline, 2 reference files. Validated in Section 2.1.
- `.claude/skills/research-engine/SKILL.md` --- 62 lines, 6-stage pipeline, version field. Validated in Section 2.2.
- `.claude/skills/done-retirement/SKILL.md` --- 378 lines, 7-stage pipeline with code examples. Validated in Section 2.3.
- `.claude/skills/vision-to-mission/references/vision-archetypes.md` --- Bounded learning constraints (line 220). Referenced in Section 5.1.
- `test/git/safety.test.ts` --- push.default=nothing verification (test S-01). Referenced in Section 6.1.
- `www/tibsfox/com/Missions/engineering-sops/modules/schema.json` --- Mission schema with wave structure, SKILL.md mapping, crew manifest. Referenced throughout.

### Cross-Module References

- M1 (SOP Anatomy): Canonical 8 sections, writing discipline, format patterns, failure modes. Sections 1, 2, 3.
- M2 (Process Maturity): CMMI 5-level model, NASA NPR 7150.2D, GSD maturity mapping. Sections 4, 5, 8, 10.
- M3 (Governance): SOP lifecycle, policy hierarchy, version control, change control. Sections 4, 5, 6, 9.
- M4 (AI-Augmented): DACP specification, SOP-Agent research, bounded learning, human review gates. Sections 5, 7, 8, 10.

---

*Module M5 complete. SKILL.md formally characterized as bounded SOP with 8-section mapping validated against 3 production skills. Gap analysis identified: success criteria universally implicit, definitions unstructured, scope completeness correlates with maturity. Wave plans mapped to CMMI Level 3 defined processes. Bounded learning rule mapped to change-control mechanism. push.default=nothing mapped to configuration management practice. Component specs mapped to DACP bundles. Five concrete recommendations produced. Three cross-module architectural patterns identified. Central claim established: GSD ecosystem patterns are SOP engineering, not merely analogous to it.*
