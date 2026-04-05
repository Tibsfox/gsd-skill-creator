---
id: M4-ai-augmented-sops
title: "Module 4: AI-Augmented SOP Development"
type: reference
owner: Engineering SOPs Research Mission
lifecycle_state: Published
review_cadence: Bi-annual (AI capabilities evolve rapidly)
audience: [senior_engineer, process_engineer, documentation_engineer, operations_staff, compliance_auditor]
framework_refs: [NASA-NPR-7150.2D, NASA-STD-8739.8A, SOP-AGENT-arXiv-2501.09316, DACP-GSD]
scope: "AI-assisted creation, maintenance, and execution of Standard Operating Procedures across engineering disciplines"
purpose: "Catalogue AI-augmented SOP development patterns with human review requirements and guardrails; define agent-executable SOP specifications; establish risk and accountability frameworks"
version: "1.0"
last_reviewed: "2026-04-05"
next_review: "2026-10-05"
---

# Module 4: AI-Augmented SOP Development

**Module:** M4
**Title:** AI-Augmented SOP Development
**Type:** Standard / Reference
**Owner:** Engineering SOPs Research Mission — CRAFT_GOV
**Lifecycle State:** Published
**Review Cadence:** Bi-annual (AI capabilities evolve rapidly)
**Audience:** Process Engineers, Documentation Engineers, Operations Staff, Senior Engineers, Compliance Auditors
**Framework Refs:** NASA NPR 7150.2D, NASA-STD-8739.8A, SOP-Agent (Ye et al. 2025, arXiv:2501.09316), DACP (GSD)
**Version:** 1.0
**Last Reviewed:** 2026-04-05
**Next Review:** 2026-10-05

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [AI-Assisted Drafting Patterns](#2-ai-assisted-drafting-patterns)
   - 2.1 Video-to-Procedure
   - 2.2 Prompt-Based Generation
   - 2.3 Template Automation
   - 2.4 Multi-Language Translation
3. [Living Documents: Real-Time Update Architecture](#3-living-documents-real-time-update-architecture)
   - 3.1 Trigger Mechanisms
   - 3.2 Alert Routing and Escalation
   - 3.3 Human Review Decision Framework
   - 3.4 Update Pathways
   - 3.5 Version Control Integration
4. [Agent-Executable SOPs: The DACP Pattern](#4-agent-executable-sops-the-dacp-pattern)
   - 4.1 DACP Bundle Specification
   - 4.2 Mapping to 8-Section SOP Anatomy
   - 4.3 Error Handling
   - 4.4 Precondition and Postcondition Verification
   - 4.5 Composability: Chaining DACP Bundles
   - 4.6 The Role of Determinism
   - 4.7 Concrete Example: Deploy a New Release
5. [Human Review Gates](#5-human-review-gates)
   - 5.1 Gate Types
   - 5.2 The AI-Draft Pipeline
   - 5.3 Documentation of Review
6. [Risks of AI-Augmented SOPs](#6-risks-of-ai-augmented-sops)
7. [Safety and Sensitivity Considerations](#7-safety-and-sensitivity-considerations)
8. [SOP-Agent: Domain-Specific AI Agents](#8-sop-agent-domain-specific-ai-agents)
9. [Source Index and Citations](#9-source-index-and-citations)

---

## 1. Introduction

The standard operating procedure has always been, at its core, an act of knowledge transfer: capturing what an expert does so that others can do it reliably, and so that the organization retains that knowledge when the expert moves on. The challenge has never been philosophical — it has been practical. Expert knowledge is expensive to capture. A senior engineer performing a calibration sequence carries years of pattern recognition in their hands and eyes, none of which makes it into the written procedure.

Artificial intelligence enters this equation in 2025 and 2026 not as a replacement for that expertise but as a dramatically cheaper first-draft author and ongoing maintenance mechanism. Tools like KaizenUp can analyze video of an expert performing a task and produce a structured draft SOP with step segmentation, annotated screenshots, and decision branch markup. What previously required a full day of documentation effort — observation, note-taking, structuring, formatting, review — compresses to roughly two hours. [guideless-ai-2025] That compression matters because the bottleneck in most organizations is not the willingness to document but the cost of the first draft.

The shift is real. The risks are also real. AI-generated SOPs that bypass human review create a class of documented misinformation that is particularly dangerous in engineering contexts: it looks authoritative, reads fluently, and may be subtly or catastrophically wrong. An AI system trained on industry-generic procedural text will produce industry-generic procedures. Your process may differ from the industry average in precisely the ways that matter for safety.

This module defines four AI-assisted drafting patterns with explicit guardrail specifications, describes the architecture for living documents that update continuously with operations data, specifies the DACP (Deterministic Agent Communication Protocol) format for machine-executable SOPs, establishes human review gate design, and catalogs the risk categories that make AI augmentation in this domain different from AI augmentation in lower-stakes writing tasks.

The organizing principle throughout: AI accelerates creation and maintenance; humans remain accountable for correctness, safety, and fitness for purpose.

---

## 2. AI-Assisted Drafting Patterns

### 2.1 Video-to-Procedure

**Description**

Video-to-procedure tools — exemplified by platforms such as KaizenUp — accept video recordings of subject matter experts performing physical or digital tasks and produce structured SOP drafts. The tool performs temporal segmentation of the video into discrete steps, extracts annotated frames as illustrations, identifies decision points, and formats the result into a structured document following the organization's SOP template.

The capability targets what documentation engineers call the tacit knowledge problem. When an experienced machinist sets up a CNC fixture, they apply accumulated judgment that is invisible in a textual description of the task: the order in which alignment checks are done, the feel of a correctly seated clamp, the specific visual indicator that distinguishes acceptable tolerance from marginal tolerance. Text-first documentation procedures capture the explicit steps; they miss the embedded expertise. Video-to-procedure tools capture both — the steps and the annotated visual evidence of execution — because they work from the actual performance rather than from a later verbal description of it. [tractian-2026]

Platforms in this space report a 4x to 8x compression in documentation time for procedure-dense tasks. KaizenUp specifically targets manufacturing and operations environments where physical task sequences dominate. [guideless-ai-2025]

**When to use**

- Physical or digital task sequences where visual demonstration communicates more than words
- Procedures governed by tacit expertise that has not previously been captured
- Environments where the subject matter expert is expensive to schedule for traditional documentation sessions
- High-volume procedure libraries where documentation backlog is a persistent problem

**When NOT to use**

- Procedures involving sensitive, classified, or proprietary information that cannot be recorded
- Abstract or analytical procedures where the primary content is decision logic rather than observable steps
- High-regulatory-scrutiny domains where video chain-of-custody for the source recording must be maintained
- Procedures requiring input from multiple experts whose consensus cannot be established from a single recording

**Quality risks and mitigation**

The primary risk is that the video captures one expert's performance of the task, not the organization's authorized procedure. If the expert has developed personal shortcuts or non-standard techniques, those enter the AI-generated draft. Mitigation requires SME review to validate that the captured technique matches the intended procedure, not merely a functional one.

A secondary risk is that temporal segmentation breaks tasks at visually obvious transitions rather than procedurally correct ones. A step that spans a visual cut in the video may be fragmented incorrectly. Human review of step granularity is required.

**Human review requirements**

1. SME validation that each captured technique represents the authorized procedure
2. Accuracy check of all annotated screenshots (labels, callouts, measurements)
3. Comparison against any existing procedure fragments or predecessor documents
4. Sign-off by the responsible engineer before publication

**Example workflow**

```
1. Schedule recording session with SME (30-60 min per procedure)
2. Record SME performing task with narration; second pass for close-ups if needed
3. Upload to video-to-procedure platform (KaizenUp or equivalent)
4. Platform produces structured draft within 15-30 minutes
5. Documentation engineer reviews draft: step ordering, granularity, terminology
6. SME reviews draft: technique accuracy, decision points, safety annotations
7. Responsible engineer approves: scope completeness, policy alignment
8. Publish to SOP management system with [AI-DRAFT-REVIEWED] designation
```

---

### 2.2 Prompt-Based Generation

**Description**

Prompt-based generation uses a large language model to produce an initial SOP draft from a natural language description of the process. The documentation engineer provides context — process name, scope, key steps, safety requirements, applicable standards — and the AI produces a fully structured document following the organization's 8-section anatomy.

The shift this introduces is qualitative. Documentation engineers move from blank-page authors to editors and validators. Cognitive load shifts from "what should I write?" to "is this accurate, complete, and appropriate for this context?" Research consistently shows that editing an existing draft is faster and produces higher completeness than authoring from scratch; the blank page is a well-documented productivity barrier. [ibm-2026-approx]

Prompt-based generation also acts as a completeness check. A well-designed system prompt will enforce that the AI produces all required sections, flag areas where the prompt did not provide sufficient input, and highlight where quality criteria (measurability of steps, specified roles, defined exit criteria) are absent from the generated draft. The result is a draft that surfaces documentation gaps rather than silently omitting them.

**When to use**

- New procedures where no predecessor document exists and a structured first draft would accelerate expert review
- Standardization projects converting informal practices to formal SOPs across multiple teams
- Procedures in low-to-medium risk domains where expert review is planned but blank-page bottleneck is the primary constraint
- Situations where multiple variants of a procedure need to be drafted quickly (e.g., the same procedure adapted for three different equipment configurations)

**When NOT to use**

- Safety-critical procedures where a plausible-but-incorrect draft may anchor the reviewer's judgment and reduce critical examination
- Procedures in narrow specialist domains where the AI's training data does not adequately represent the operational context
- Situations where the organization lacks the review capacity to validate AI-generated output before it reaches operators

**Quality risks and mitigation**

Hallucination is the primary risk. An LLM generating procedural content will produce steps, specifications, and parameter values that sound authoritative and are fabricated. This is especially dangerous in procedures where the specific values matter — torque specifications, chemical concentrations, software version requirements. Every specific value in an AI-generated SOP must be independently verified against authoritative sources.

A subtler risk is the anchoring effect: reviewers who receive a structurally complete, fluently written draft are less likely to identify missing steps or incorrect sequences than reviewers who receive a rough partial outline. The completeness signal in the AI draft suppresses critical examination. Mitigation requires structured checklists that direct reviewer attention to specific accuracy categories rather than overall document quality.

**Human review requirements**

1. Verification of every specific value (dimensions, concentrations, versions, thresholds) against source documentation
2. Step-by-step walkthrough validation: can a qualified engineer execute each step as written?
3. Decision logic audit: are all branch conditions complete and mutually exclusive?
4. Completeness check: are all required SOP sections present and substantively filled?
5. Safety review: are hazards identified, PPE requirements specified, emergency procedures referenced?
6. Approval by qualified engineer before any operational use

**Example workflow**

```
1. Process engineer writes prompt describing procedure: objective, scope, inputs, outputs, 
   key steps, known hazards, applicable standards
2. AI generates structured 8-section draft
3. Documentation engineer reviews structure and terminology; flags gaps
4. SME reviews step accuracy, decision logic, and safety provisions
5. Compliance review (if applicable): regulatory alignment check
6. Revisions by documentation engineer incorporating review comments
7. Final approval by responsible engineer
8. Publish with version metadata and review audit trail
```

---

### 2.3 Template Automation

**Description**

Template automation populates standardized SOP section formats from structured inputs. Rather than free-form prompt generation, the author provides structured data — a form, a YAML configuration, a structured interview — and the automation generates the document by populating pre-defined templates.

This pattern prioritizes consistency over speed. Its primary value is ensuring that every SOP in a library has the same structure, terminology conventions, metadata fields, and formatting. In organizations with large procedure libraries, structural inconsistency across SOPs creates significant compliance and audit risk: an auditor or operator searching for information looks in the place that document A puts it, and document B doesn't have it there. Template automation eliminates this class of inconsistency at the library level.

Platforms in this space — including NewgenONE and Fluency — provide authoring interfaces that walk a subject matter expert through a structured input form and produce a formatted SOP that satisfies the organization's template requirements. The AI component handles language generation: converting bullet-point inputs into grammatically correct prose, standardizing vocabulary, and applying consistent numbering and heading conventions. [newgenone-2026, fluency-2026]

**When to use**

- Large procedure libraries where cross-document consistency is a compliance requirement
- Organizations onboarding new facilities, teams, or products that need procedure libraries quickly
- Standardization initiatives converting legacy procedures to a new template format
- Procedures with stable, well-understood structure where the primary authoring task is data entry

**When NOT to use**

- Novel or highly complex procedures where the template structure may not match the procedure logic
- Procedures requiring significant narrative judgment about the order or grouping of steps
- Situations where the template is not yet validated against the operational context

**Quality risks and mitigation**

The primary risk is that template automation produces structurally correct but substantively empty SOPs — all the sections are present, none of the sections say anything meaningful. If inputs are thin, AI-generated content will be thin correspondingly. Mitigation requires minimum content standards for each section before generation proceeds.

**Human review requirements**

1. Input quality review before generation: do the structured inputs contain sufficient substance?
2. Generated content review: is the prose an accurate representation of the structured inputs?
3. Cross-document consistency check: does this SOP use the same terminology as adjacent procedures?
4. Final approval per standard gate requirements

**Example workflow**

```
1. SME completes structured input form for target procedure
2. Documentation engineer reviews inputs for completeness and accuracy
3. Template automation generates draft document
4. Documentation engineer reviews output: accuracy, terminology, completeness
5. SME validates: does the generated document accurately represent the inputs?
6. Approve and publish
```

---

### 2.4 Multi-Language Translation

**Description**

AI-generated SOP translation maintains content equivalence across language versions of the same procedure. This addresses a specific operational risk in distributed organizations: a procedure drafted in English and translated to Spanish by a non-specialist translator may produce two procedures that share a name but differ in critical details.

AI translation with post-editing by a domain-qualified reviewer achieves higher technical accuracy than human-only translation in specialized domains, primarily because the AI applies consistent terminology mappings and does not introduce informal substitutions for technical terms. The critical step is the post-editing review: a domain-qualified bilingual reviewer validates that technical terms, measurement units, and safety language are accurately rendered, and that no steps were omitted, merged, or reordered in translation. [guideless-ai-2025]

**When to use**

- Procedures operating in multi-lingual environments where all operators must work from the same authoritative document
- Regulatory environments requiring documentation in a specified language or languages
- Organizations expanding to new geographic markets and needing procedure libraries in local languages

**When NOT to use**

- Translation without access to a domain-qualified reviewer for the target language
- Procedures containing regulatory language where the translation has independent legal status (translation then requires legal as well as technical review)

**Quality risks and mitigation**

Technical term mistranslation is the primary risk. Units of measure, direction conventions (clockwise vs. counterclockwise), and chemical nomenclature are categories with documented AI translation failures. Post-editing review must specifically address these categories with a checklist, not a general "does this sound right?" reading.

**Human review requirements**

1. Domain-qualified bilingual reviewer validates every technical term
2. Unit verification: all measurements checked in source and translated version
3. Safety language review: warnings and cautions must be present and unambiguous in all versions
4. Procedural sequence check: step count and order must match source exactly

---

## 3. Living Documents: Real-Time Update Architecture

A static SOP written today becomes a liability as soon as the process it describes changes and the document is not updated. Most organizations manage this through scheduled review cycles: an annual or biannual calendar reminder triggers a review that is, in practice, often deferred. The result is a library where the review date is accurate and the content may be years out of date.

AI-augmented living document architectures replace the calendar model with a signal model: continuous analysis of operations data, usage patterns, and process execution metrics produces alerts when documented procedures appear to diverge from actual practice. The human review is triggered by evidence, not by time.

### 3.1 System Architecture

The living document update cycle operates as follows:

```
[Process Execution] → [Usage Analytics] → [AI Analysis]
        │                                       │
        │                                       ▼
        │                           [Gap / Staleness Detection]
        │                                       │
        ▼                                       ▼
[Performance Metrics] ──────────► [Review Flag / Alert]
                                                │
                                                ▼
                                    [Human Review Decision]
                                                │
                                  ┌─────────────┴──────────────┐
                                  ▼                              ▼
                            [No Change]                    [Revise SOP]
                          (document log)             (version bump + changelog)
```

Each stage:

- **Process Execution** produces operational data: completion times, error rates, deviation logs, operator annotations
- **Usage Analytics** tracks how documents are accessed: which steps are re-read most often (indicating confusion), where operators pause, what search queries operators run while executing a procedure
- **AI Analysis** compares operational signals against document content to identify divergence patterns
- **Gap/Staleness Detection** produces a scored list of candidate updates ranked by evidence strength
- **Review Flag/Alert** routes a structured change proposal to the responsible reviewer
- **Human Review Decision** is the required gate: no automated changes to published SOPs

### 3.2 Trigger Mechanisms

Five categories of signal trigger a review flag:

**Usage-based triggers**

- Step re-read rate above threshold: operators are re-reading a step more than expected, indicating ambiguity or confusion
- Search queries during procedure execution: operators are looking up information the procedure should provide
- Procedure abandonment at a specific step: operators are stopping and seeking assistance at a repeating location
- Time deviation: execution time for a step or section exceeds established norms by a threshold percentage

**Process change triggers**

- Equipment, software, or tooling version changes that affect procedure steps
- Supplier or specification changes in referenced materials
- Regulatory or standards updates to referenced frameworks
- Incident or near-miss events linked to a specific procedure

**Staleness indicators**

- Time since last substantive review (configurable threshold; typically 12-24 months for non-safety procedures)
- Referenced tools or systems deprecated or replaced
- Referenced personnel roles changed or eliminated
- Version divergence: the live procedure version differs from the version referenced in dependent procedures

**Performance degradation triggers**

- Defect rate increase correlated with procedure-governed process
- First-pass yield below threshold for procedures governing production steps
- Compliance finding referencing a specific SOP

**Cross-procedure consistency triggers**

- Terminology in this procedure diverges from updated terminology in a related procedure
- A referenced procedure has been revised and this procedure has not been cross-checked

### 3.3 Alert Routing and Escalation

Alert routing assigns review responsibility based on the type and severity of the trigger:

| Trigger Type | Severity | Primary Reviewer | Escalation If No Response |
|---|---|---|---|
| Step re-read rate | Low | Procedure Owner | Documentation Lead (14 days) |
| Performance degradation | High | Engineering Lead + Procedure Owner | Director (72 hours) |
| Safety incident correlation | Critical | Engineering Lead + Safety Officer | VP Engineering (24 hours) |
| Regulatory update | High | Compliance + Procedure Owner | Legal (7 days) |
| Staleness threshold | Medium | Procedure Owner | Documentation Lead (30 days) |
| Referenced system deprecated | Medium | Procedure Owner | Engineering Lead (14 days) |

Escalation timers run from the moment the alert is acknowledged, not from when it was generated. An unacknowledged critical alert escalates immediately.

### 3.4 Human Review Decision Framework

Every review alert terminates in a documented human decision. The reviewer is not choosing whether to update; they are documenting a finding. The decision framework has three branches:

**No Change (Document log)**

If the reviewer determines the alert is a false positive or the procedure is still accurate despite the triggering signal, the reviewer documents:
- Why the alert was triggered
- Why no change is warranted
- Evidence examined to reach the conclusion
- Next review trigger or date

This decision creates an audit entry. The SOP version does not increment, but a review event is logged.

**Minor Revision (Same version major, increment minor)**

Content is updated but the procedure logic, scope, or safety provisions are unchanged:
- Terminology alignment with updated related procedures
- Clarification of ambiguous steps
- Addition of notes or warnings that improve clarity without changing the procedure

**Major Revision (Version increment, full review cycle)**

Procedure logic, scope, safety provisions, or required roles change:
- Full review cycle required, same as new procedure review
- All dependent procedures flagged for cross-check
- Version bump with changelog entry documenting what changed and why

### 3.5 Automated vs. Semi-Automated vs. Manual Update Pathways

Not all update activity requires the same process. Three pathways exist:

**Automated (No human approval required)**

- Metadata updates: review date fields, linked document references when a referenced document's ID changes without content change
- Formatting corrections: template alignment, heading normalization
- These changes are logged but do not trigger a version increment or review gate

**Semi-automated (Human approval required, AI generates draft)**

- Content updates where the AI proposes specific revised language based on signal analysis
- Human reviewer accepts, modifies, or rejects the proposed change
- Review and approval logged with reviewer identity and decision rationale
- Version incremented per change magnitude rules

**Manual (Human authors all changes)**

- Safety-critical provisions
- Scope changes
- Role and responsibility changes
- Any change in response to a safety incident or regulatory finding

The rule is conservative: when in doubt about which pathway applies, use the more controlled pathway.

### 3.6 Version Control Integration

Living document version control follows the same principles as software version control:

- No in-place editing of published documents
- All changes create a new version with a changelog entry
- Previous versions remain accessible (read-only) in the version history
- Version identifiers follow semantic versioning: `MAJOR.MINOR.PATCH`
  - MAJOR: scope or logic change; resets MINOR and PATCH
  - MINOR: content clarification or addition; resets PATCH
  - PATCH: metadata or formatting correction
- Changelog entries include: what changed, why, who approved, date
- Dependent procedures are flagged when a procedure they reference is revised

---

## 4. Agent-Executable SOPs: The DACP Pattern

### 4.1 DACP Bundle Specification

The Deterministic Agent Communication Protocol (DACP) is a three-layer specification format for SOPs intended for execution by automated agents rather than — or in addition to — human operators. It was developed as part of the GSD (Get Shit Done) operational architecture and addresses a fundamental problem: procedures written for humans are ambiguous by design — they rely on human judgment to fill gaps — while procedures executed by agents must be unambiguous and complete.

A DACP bundle is a self-contained unit of executable procedure. It contains exactly three layers:

| Layer | Content | Consumer |
|---|---|---|
| Human Intent | Natural language description of purpose, scope, expected outcome, and failure modes | Human reviewer; audit trail |
| Structured Data | JSON/YAML specification: inputs, outputs, preconditions, postconditions, error paths, timeouts, rollback actions | Orchestration layer; other agents; dependency resolver |
| Executable | Shell commands, code blocks, parameterized templates, tool invocations ready for direct execution | Executor agent; CI/CD pipeline |

The three layers are not alternatives — they are all required in every DACP bundle. An agent that receives only the executable layer has no basis for verifying that preconditions are met or postconditions achieved. A human reviewer who receives only the executable layer has no context for evaluating whether the procedure is appropriate. All three layers must be present, consistent with each other, and maintained together as a unit.

**Full specification:**

```yaml
dacp_version: "1.0"
bundle_id: "unique-identifier"
human_intent:
  purpose: |
    Natural language: what this procedure accomplishes, why it exists,
    what the expected outcome is when it completes successfully.
  scope: |
    What this procedure covers and what it explicitly does NOT cover.
  failure_narrative: |
    What the operator or reviewing agent should understand about what
    goes wrong when this procedure fails, and what the impact is.

structured_data:
  inputs:
    - name: "parameter_name"
      type: "string | int | bool | path | secret_ref"
      required: true | false
      description: "What this parameter controls"
      validation: "regex or range constraint"
  outputs:
    - name: "output_name"
      type: "string | path | artifact"
      description: "What this output represents"
  preconditions:
    - id: "PRE-01"
      description: "Human-readable statement of required state"
      check: "command or expression that verifies this condition"
      on_failure: "halt | skip | warn"
  postconditions:
    - id: "POST-01"
      description: "Human-readable statement of expected state after execution"
      check: "command or expression that verifies this condition"
      on_failure: "rollback | alert | log"
  error_paths:
    - error_id: "E-01"
      condition: "What triggers this error path"
      action: "rollback | retry_N | alert | halt"
      rollback_steps: ["step identifiers to undo in reverse order"]
  timeouts:
    total: "ISO 8601 duration e.g. PT30M"
    per_step: "ISO 8601 duration or null"
  idempotency: "idempotent | non-idempotent | idempotent-with-guard"

executable:
  steps:
    - id: "STEP-01"
      description: "Human-readable step description"
      command: "literal command or parameterized template"
      parameters: {}
      on_error: "E-01"
      timeout: "PT5M"
    - id: "STEP-02"
      description: "..."
      command: "..."
      depends_on: ["STEP-01"]
```

### 4.2 Mapping to 8-Section SOP Anatomy

Every DACP bundle maps to the 8-section SOP anatomy defined in the mission schema. This mapping ensures that agent-executable procedures are structurally equivalent to human-executed procedures — same information, different format:

| SOP Section | DACP Location | Notes |
|---|---|---|
| 1.0 Purpose | `human_intent.purpose` | Same content, different format |
| 2.0 Scope | `human_intent.scope` | Includes explicit NOT-in-scope |
| 3.0 References | `structured_data.inputs` where type is `reference` | Plus inline citations in human_intent |
| 4.0 Definitions | `human_intent.purpose` narrative + step descriptions | Terms defined inline |
| 5.0 Roles & Responsibilities | `structured_data` — executor role implied; approver in metadata | Approval and review roles in bundle metadata |
| 6.0 Procedure | `executable.steps` | Machine-executable steps |
| 7.0 Quality Checks | `structured_data.postconditions` + `executable` verification steps | Each postcondition is a quality check |
| 8.0 Records / Success Criteria | `structured_data.postconditions` + output artifacts | Defined outputs constitute the record |

The discipline of maintaining this mapping is the core argument for DACP: it prevents the agent-executable format from becoming an orphaned technical artifact with no human-intelligible governance. Every DACP bundle is auditable as an SOP.

### 4.3 Error Handling in Agent-Executable SOPs

Error handling in agent-executed procedures requires explicit specification at a level that human-executed procedures do not demand. A human operator encountering an unexpected state applies judgment. An agent encountering an unexpected state halts, loops, retries, or corrupts — depending on what its instructions specify.

DACP error paths enumerate the expected failure modes and their responses:

**Retry:** The step is re-attempted up to N times with optional backoff. Used for transient failures: network timeouts, lock contention, temporary service unavailability. The retry condition must include a maximum attempt count and a final-failure action.

**Rollback:** Previously executed steps are reversed in inverse order. Rollback steps must be explicitly specified — the system cannot infer them. Rollback assumes that each step has a corresponding undo action. Non-reversible steps (writes to external systems, sent communications, physical actuations) require special designation and halt rather than rollback.

**Alert:** A human or monitoring system is notified without halting execution. Used for warning conditions that do not prevent completion but require human awareness.

**Halt:** Execution stops. Used when continuation would cause data loss, security violation, or irreversible state corruption. Halt records the current state, logs the error, and signals for human intervention.

**Designing for failure:**

Every error path in a DACP bundle must answer three questions:
1. What condition triggers this path?
2. What action does the agent take?
3. What human notification is required, if any?

An error path that specifies only the trigger without the action is incomplete. An error path that triggers rollback without specifying rollback steps is broken.

### 4.4 Precondition and Postcondition Verification

Preconditions and postconditions transform implicit assumptions in human-written procedures into explicit, verifiable assertions.

**Preconditions** are the state requirements that must be true before the procedure begins. A human operator performing a software deployment procedure implicitly checks that: the target environment exists, they have permissions, the artifact they are deploying is available and intact, and the environment is not already running the target version. An agent executing the same procedure needs these as explicit checks with explicit failure modes.

```yaml
preconditions:
  - id: "PRE-01"
    description: "Target environment exists and is accessible"
    check: "kubectl get namespace ${TARGET_NAMESPACE} > /dev/null 2>&1"
    on_failure: "halt"
  - id: "PRE-02"
    description: "Deployment artifact exists and checksum matches"
    check: "sha256sum --check ${ARTIFACT_PATH}.sha256"
    on_failure: "halt"
  - id: "PRE-03"
    description: "Current running version differs from target version"
    check: "[ \"$(kubectl get deployment app -n ${TARGET_NAMESPACE} -o jsonpath='{.spec.template.spec.containers[0].image}')\" != \"${TARGET_IMAGE}\" ]"
    on_failure: "skip"  # Already at target version; skip is a success state
```

**Postconditions** are the assertions that must be true after successful completion. They are not optional quality checks — they are the definition of what "success" means for this procedure. A postcondition that cannot be automatically verified is a signal that the procedure's success criteria are not well-defined.

```yaml
postconditions:
  - id: "POST-01"
    description: "All pods in deployment are running and ready"
    check: "kubectl rollout status deployment/app -n ${TARGET_NAMESPACE} --timeout=5m"
    on_failure: "rollback"
  - id: "POST-02"
    description: "Health endpoint returns 200"
    check: "curl -sf https://${TARGET_HOST}/health > /dev/null"
    on_failure: "alert"
  - id: "POST-03"
    description: "Error rate metric within normal bounds for 2 minutes post-deploy"
    check: "scripts/check-error-rate.sh --window=2m --threshold=0.01"
    on_failure: "alert"
```

The distinction between `halt` and `rollback` on failure is important. A postcondition that fails with `rollback` implies the procedure is reversible and the failure is recoverable. A postcondition that fails with `halt` implies human intervention is required and automatic recovery is not safe.

### 4.5 Composability: Chaining DACP Bundles

Complex operations are composed from sequences of simpler DACP bundles. This is the agent-executable equivalent of procedure hierarchy in human SOPs: a high-level procedure references sub-procedures rather than inlining their steps.

Composability in DACP works through two mechanisms:

**Sequential chaining:** Bundle B is executed after Bundle A completes successfully. The output artifacts of A are inputs to B. The orchestration layer verifies that A's postconditions are met before dispatching B. If A fails, B does not execute.

**Parallel fan-out:** Multiple bundles execute concurrently when they have no input-output dependency between them. The orchestration layer waits for all concurrent bundles to complete (or fail) before proceeding. One failure in a parallel fan-out may trigger rollback across all concurrent branches depending on the orchestration policy.

**Composition specification:**

```yaml
composition:
  name: "full-release-pipeline"
  steps:
    - bundle: "test-suite-execution"
      id: "COMP-01"
    - bundle: "artifact-build"
      id: "COMP-02"
      depends_on: ["COMP-01"]
    - bundle: "staging-deploy"
      id: "COMP-03"
      depends_on: ["COMP-02"]
    - bundle: "staging-validation"
      id: "COMP-04"
      depends_on: ["COMP-03"]
    - bundle: "production-deploy"
      id: "COMP-05"
      depends_on: ["COMP-04"]
      requires_human_gate: true  # Human approval required before this step
```

The `requires_human_gate` flag at a composition step implements the gate design from Section 5. The orchestration layer pauses execution and routes a notification to the designated approver. Execution resumes only after explicit approval. This is the critical integration point between the fully automated lower steps and the human-gated final step.

**The sub-procedure substitution rule:** When a DACP bundle is used as a step in a composition, it must be substitutable — its preconditions must be satisfiable by the outputs of its predecessors, and its postconditions must satisfy the preconditions of its successors. This constraint is what makes composed procedures reliable: each bundle in a chain is a verified unit with explicit input-output contracts.

### 4.6 The Role of Determinism

Determinism is not merely a design preference in agent-executable SOPs — it is a correctness requirement. A non-deterministic procedure executed by an agent produces results that cannot be verified, audited, or reproduced. In safety-critical contexts, non-determinism means the procedure may succeed on one execution and fail silently on another without any observable difference in the execution log.

**Sources of non-determinism to eliminate:**

- **Floating time references:** "Wait until the system stabilizes" has no agent-executable meaning. Replace with: "Poll endpoint at 10-second intervals; proceed when 3 consecutive successful responses are received within a 5-minute window."
- **Unspecified selection:** "Choose the appropriate configuration" requires the agent to decide. Replace with: explicit selection rules or parameterized inputs that determine the configuration.
- **Environmental assumptions:** Steps that assume specific environment state without checking it introduce non-determinism. Replace with: explicit precondition checks.
- **Ordering ambiguity:** Steps that can be executed in multiple orders must have explicit ordering constraints via `depends_on` declarations.
- **Implicit retry:** "If the step fails, try again" without a retry count and backoff schedule is non-deterministic. Replace with: explicit retry policy.

**Why non-determinism fails specifically in agentic contexts:**

Human operators encountering a non-deterministic procedure apply judgment to fill the gaps. They know from context what "stabilized" means, when to try again, and what the appropriate configuration is. An agent has no such context unless it is explicitly provided. More importantly, an agent will execute a non-deterministic procedure successfully in test and fail in production if the production environment has any variation that affects the unspecified choices — and it will fail without indicating that non-determinism was the cause.

The practical consequence: DACP bundles must be reviewable for determinism as part of the human review gate. A DACP reviewer should be able to read the bundle and trace exactly one execution path for any given set of inputs and initial conditions.

### 4.7 Concrete Example: Deploy a New Release

The following is a complete DACP bundle for a software release deployment. It illustrates the three-layer specification, error handling, and precondition/postcondition design:

```yaml
dacp_version: "1.0"
bundle_id: "deploy-release-v1"
metadata:
  owner: "platform-engineering"
  approved_by: "lead-engineer"
  approved_date: "2026-04-05"
  review_date: "2026-10-05"
  version: "1.2.0"

human_intent:
  purpose: |
    Deploy a new application release to the production Kubernetes cluster.
    This procedure builds and pushes the release artifact, performs a rolling
    deployment to production, and validates that the new version is healthy
    before completing. It does not modify infrastructure, database schemas,
    or external integrations.
  scope: |
    In scope: application container deployment, Kubernetes rolling update,
    post-deployment health validation.
    Out of scope: database migrations (see bundle: db-migration-v1),
    infrastructure changes (see bundle: infra-apply-v1), 
    rollback to a prior version (see bundle: rollback-release-v1).
  failure_narrative: |
    If deployment fails, the rolling update strategy ensures that at least
    one prior-version instance remains running during the failure. Rollback
    removes all new-version instances and restores the prior version. Data
    written to the database during a partial deployment remains; no data
    rollback occurs.

structured_data:
  inputs:
    - name: TARGET_VERSION
      type: string
      required: true
      description: "Semantic version string for the release (e.g., 1.4.2)"
      validation: "^[0-9]+\\.[0-9]+\\.[0-9]+$"
    - name: TARGET_NAMESPACE
      type: string
      required: true
      description: "Kubernetes namespace for the deployment"
      validation: "^[a-z][a-z0-9-]{1,62}[a-z0-9]$"
    - name: REGISTRY
      type: string
      required: true
      description: "Container registry host"
  outputs:
    - name: deployed_image
      type: string
      description: "Full image reference of the deployed container"
    - name: deployment_log
      type: path
      description: "Path to the deployment log artifact"

  preconditions:
    - id: "PRE-01"
      description: "Target namespace exists and agent has deploy permissions"
      check: "kubectl auth can-i create deployments -n ${TARGET_NAMESPACE}"
      on_failure: halt
    - id: "PRE-02"
      description: "Release artifact exists in registry"
      check: "docker manifest inspect ${REGISTRY}/app:${TARGET_VERSION} > /dev/null 2>&1"
      on_failure: halt
    - id: "PRE-03"
      description: "Current version differs from target (guard against re-deploy)"
      check: "scripts/check-current-version.sh --namespace=${TARGET_NAMESPACE} --expected-not=${TARGET_VERSION}"
      on_failure: skip

  postconditions:
    - id: "POST-01"
      description: "All deployment pods running target version"
      check: "kubectl rollout status deployment/app -n ${TARGET_NAMESPACE} --timeout=10m"
      on_failure: rollback
    - id: "POST-02"
      description: "Health endpoint returns 200 for 30 seconds"
      check: "scripts/sustained-health-check.sh --host=${TARGET_HOST} --duration=30s"
      on_failure: rollback
    - id: "POST-03"
      description: "Error rate below 1% for 2 minutes"
      check: "scripts/check-error-rate.sh --window=2m --threshold=0.01"
      on_failure: alert

  error_paths:
    - error_id: "E-01"
      condition: "POST-01 or POST-02 fails (rollback trigger)"
      action: rollback
      rollback_steps: ["STEP-03-undo", "STEP-02-undo"]
    - error_id: "E-02"
      condition: "POST-03 fails (error rate elevated)"
      action: alert
      notification_target: "on-call"
  
  timeouts:
    total: PT45M
    per_step: PT10M
  idempotency: "idempotent-with-guard"

executable:
  steps:
    - id: "STEP-01"
      description: "Tag release artifact with deployment timestamp"
      command: "scripts/tag-release.sh --version=${TARGET_VERSION} --timestamp=$(date -u +%Y%m%dT%H%M%SZ)"
      on_error: halt
    - id: "STEP-02"
      description: "Update Kubernetes deployment image"
      command: "kubectl set image deployment/app app=${REGISTRY}/app:${TARGET_VERSION} -n ${TARGET_NAMESPACE}"
      depends_on: ["STEP-01"]
      on_error: "E-01"
    - id: "STEP-02-undo"
      description: "Rollback: restore prior deployment image"
      command: "kubectl rollout undo deployment/app -n ${TARGET_NAMESPACE}"
      role: rollback_step
    - id: "STEP-03"
      description: "Wait for rollout completion"
      command: "kubectl rollout status deployment/app -n ${TARGET_NAMESPACE} --timeout=10m"
      depends_on: ["STEP-02"]
      on_error: "E-01"
    - id: "STEP-03-undo"
      description: "Rollback: confirm prior version restored"
      command: "kubectl rollout status deployment/app -n ${TARGET_NAMESPACE} --timeout=5m"
      role: rollback_step
    - id: "STEP-04"
      description: "Record deployment artifact reference to output"
      command: "echo '${REGISTRY}/app:${TARGET_VERSION}' > ${OUTPUT_PATH}/deployed_image.txt"
      depends_on: ["STEP-03"]
```

This example illustrates all key DACP properties: the three layers are present and consistent; preconditions include a skip-guard for idempotency; error paths specify rollback steps by ID; rollback steps are named and sequenced; and the human_intent layer provides the context that makes the bundle auditable by a human reviewer who did not write it.

---

## 5. Human Review Gates

### 5.1 Gate Types

Three gate types exist in AI-augmented SOP workflows, each with a distinct purpose and set of reviewer obligations:

**Approval Gate**

A binding authorization. No action proceeds until the approver explicitly authorizes it. The approver is accountable for the decision.

- Used for: first publication of any new SOP; major revisions; deployment of agent-executable bundles to production; any SOP governing safety-critical operations
- Reviewer obligation: the approver has read the full document, verified accuracy against source materials, and independently assessed fitness for purpose
- Output: approval record with approver identity, date, version, and brief rationale

**Review Gate**

A substantive evaluation that may result in changes but does not require a halt. Review comments are addressed before proceeding, but the reviewer does not have veto power; escalation to an approver is the mechanism for disputes.

- Used for: minor revisions; cross-document consistency checks; initial AI-draft evaluation prior to SME validation
- Reviewer obligation: specific review categories are checked (see Section 5.2); findings are documented
- Output: review record with findings, whether each finding was addressed, and disposition

**Validation Gate**

A verification that specific criteria are met. Binary: either the criteria are met or they are not. No editorial judgment.

- Used for: verifying that an SOP template is complete (all sections present), that version metadata is correct, that linked references resolve, that DACP precondition check commands are syntactically valid
- Reviewer obligation: check the criteria; record the result
- Output: validation record with pass/fail for each criterion

### 5.2 The AI-Draft Pipeline

AI-generated SOPs require a specific pipeline that differs from human-generated procedure review. The pipeline is designed around the failure mode of AI drafts: they are structurally complete but potentially incorrect in specific details, and their apparent completeness suppresses critical examination.

```
[AI Draft] → [Structural Validation] → [SME Accuracy Review] → [AI Completeness Check] → [Approver Gate]
```

**Stage 1: Structural Validation (Validation Gate)**

Before any content review, confirm the draft is structurally complete:
- All 8 SOP sections present
- All required fields populated (owner, version, review date, audience)
- No placeholder text remaining
- DACP layers all present and internally consistent (if applicable)
- Document format complies with organization template

This stage is automated or performed by a documentation engineer. It takes minutes. Do not proceed to content review until structural validation passes.

**Stage 2: SME Accuracy Review (Review Gate)**

A subject matter expert reviews the draft for accuracy. Review is structured by category, not holistic:

- Every specific value (dimensions, concentrations, software versions, time parameters) verified against an authoritative source
- Step sequence walkthrough: SME mentally executes the procedure and identifies missing steps, incorrect ordering, and steps that would fail in practice
- Decision logic: all branch conditions present, complete, and mutually exclusive
- Hazard completeness: all known hazards are identified and mitigated
- Tool and equipment specifications: correct versions, configurations, and states specified

**Stage 3: AI Completeness Check (Review Gate)**

An AI tool (which may be the same model that drafted the procedure) performs a completeness analysis:
- Are all steps in the procedure measurably completable?
- Are all referenced tools, equipment, and personnel available within the stated scope?
- Are there steps that reference undefined terms?
- Are success criteria defined for every step that has failure modes?

This stage catches structural gaps that SME review may miss, particularly in procedures where the SME's expertise causes them to read in missing information rather than flag it.

**Stage 4: Approver Gate (Approval Gate)**

A qualified engineer approves publication. This is not a re-review of everything already reviewed; it is a accountability signature. The approver verifies:
- Review stages 1-3 are documented with their findings and dispositions
- All material findings have been addressed
- The document is appropriate for the stated scope and audience
- They would be comfortable executing this procedure as written

**What reviewers check (consolidated checklist):**

| Category | Check |
|---|---|
| Accuracy | Every specific value verified against source |
| Completeness | All required sections substantively filled |
| Safety | Hazards identified, PPE specified, emergency references present |
| Measurability | Every step produces a verifiable output or state |
| Scope | Procedure covers what it claims; does not omit critical steps |
| Roles | Executor and approver roles explicitly assigned |
| Dependencies | All referenced documents and tools are available and identified |
| Terminology | Terms consistent with related procedures in the same domain |

### 5.3 Documentation of the Review

Review documentation is not optional in AI-augmented SOP workflows. It serves three functions:

1. **Audit trail:** In regulated industries, the ability to demonstrate that a procedure was reviewed by a qualified person before operational deployment is a compliance requirement. The review record is the evidence.

2. **Learning mechanism:** When a review catches an AI-generated error, the finding is a data point for improving the prompting strategy or system prompt. Without documentation, these findings evaporate.

3. **Accountability assignment:** When an AI-generated SOP contributes to a failure, the review record establishes who reviewed it, what they checked, and what they concluded. This is not punitive — it is essential for root cause analysis and system improvement.

Minimum review record fields:

```
Review ID:
SOP Document:
SOP Version:
Review Stage: [Structural | SME Accuracy | AI Completeness | Approver]
Reviewer:
Review Date:
Findings: [list of findings with disposition: addressed / accepted-risk / deferred]
Outcome: [Approved | Approved with changes | Rejected]
Next Review Trigger:
```

---

## 6. Risks of AI-Augmented SOPs

### 6.1 Hallucination in Procedural Content

Large language models generate confident-sounding content that is factually incorrect. In documentation domains with low safety stakes (marketing copy, blog posts), this is an annoyance. In procedural content governing physical processes, chemical handling, or safety-critical operations, a hallucinated torque specification or incorrect chemical concentration is a direct harm vector.

The insidious aspect of procedural hallucination is that it is not random. AI systems produce errors that are consistent with adjacent content: an incorrect specification that is in the right ballpark for the process, uses the right units, and appears in the right step context. Reviewers who are scanning for anomalous content may miss plausible errors.

Mitigation is not hoping the AI gets it right or training reviewers to be "more careful." Mitigation is architectural: every specific value in an AI-generated procedural document must be independently verified against an authoritative source before the document is used operationally. This means maintaining a list of value types that require source verification and a record of which source verified each value.

### 6.2 Over-Reliance and Rubber-Stamp Approval

Research on AI-assisted decision-making consistently finds that humans presented with a plausible AI-generated answer apply less critical scrutiny than humans starting from a blank page. The AI draft's apparent completeness — all sections present, all fields filled — signals "done" before review has occurred.

In SOP contexts, this manifests as approval of AI-generated procedures without the reviewer having mentally executed the steps. The review record shows "approved" but the review was not substantive.

Mitigation requires structural changes to the review process, not motivational appeals to reviewers to try harder. The structured review checklist in Section 5.2 forces reviewers to check specific categories rather than render a general quality judgment. Requiring reviewers to document specific findings — even "verified: torque spec matches source document X version Y" — changes the cognitive task from evaluation to verification.

### 6.3 Loss of Tacit Knowledge

A risk specific to video-to-procedure and AI drafting at scale: if AI becomes the primary procedure-drafting mechanism across an organization, the direct engagement between documentation engineers and subject matter experts may atrophy. The SME records a video; they do not sit with a documentation engineer for the deep technical interview that would capture context, failure modes, and judgment heuristics that do not appear in the recording.

This is not a risk of AI-generated procedures being wrong — it is a risk of them being thin. They describe what is visible; they omit what is known. The solution is not abandoning AI-assisted drafting; it is maintaining structured SME engagement as part of the review process rather than only at the recording stage.

### 6.4 Consistency vs. Correctness

AI drafting tools produce consistent output. If an organization's system prompt specifies a particular structure, all generated procedures will follow that structure consistently. This is a significant advantage for template compliance and cross-document coherence. It is also a risk vector: if the system prompt contains an incorrect assumption or the template reflects an outdated standard, all AI-generated procedures will consistently implement the incorrect assumption.

The consistency property amplifies errors across the library rather than limiting them. A human authoring team with different individuals working on different procedures will introduce variation — some of which is noise, but some of which is independent error correction. AI-generated libraries may exhibit correlated errors across many procedures.

Mitigation: periodic adversarial review of the system prompt and template by someone who did not design them, asking: what errors would every document in this library have if this template or prompt were wrong?

### 6.5 The Training Data Problem

AI models trained on existing SOPs learn the patterns and errors in those SOPs. If the training corpus contains industry-standard procedures that have known flaws — outdated practices, superseded standards, incorrect common assumptions — the AI will reproduce those flaws in new generated procedures.

More subtly: AI training data is biased toward widely-published, widely-adopted practices. Procedures for novel, proprietary, or highly specialized processes will be generated by analogy to the training data rather than from specific knowledge of the process. The resulting procedure may follow the pattern of similar processes while differing in the specific ways that matter.

This is an argument for source verification (catching individual errors) and for domain-specificity in system prompts (bounding the analogy space). It is also an argument against using AI drafting without human SME review for any procedure that is genuinely novel.

### 6.6 Accountability Gaps

When an AI-generated SOP contributes to an operational failure, the accountability question is uncomfortable: who is responsible? The operator who followed the procedure? The engineer who approved it? The organization that adopted the AI drafting tool? The tool vendor?

Legal and regulatory frameworks have not fully resolved this question as of 2026. What is clear is the practical answer: the organization that published the procedure and the engineer who approved it bear operational accountability. The fact that a procedure was AI-generated is not a defense — it is an explanation of how the procedure came to exist, not of why it was published without adequate review.

The accountability gap closes with review documentation. A clear record that a qualified engineer reviewed the procedure, what they checked, and what they found does not eliminate accountability — it locates it accurately. Without documentation, accountability is diffuse and unresolvable. With documentation, it is specific and actionable.

---

## 7. Safety and Sensitivity Considerations

The following rules apply without exception. They are not guidelines subject to project-specific risk tolerance decisions.

| Rule | Type | Notes |
|---|---|---|
| Safety-critical SOPs require independent review | ABSOLUTE | Any SOP governing human safety or system integrity must be reviewed by a qualified person who did not author it — human or AI. Self-review of safety procedures is not sufficient. |
| NASA Class A software procedures require IV&V | ABSOLUTE | NASA NPR 7150.2D requires Independent Verification and Validation for human-rated systems. AI-generated procedures for Class A software must pass IV&V before operational use. No exceptions. [nasa-npr-7150.2d] |
| AI-generated SOPs require a human validation gate | GATE | AI drafts are starting points. A qualified engineer must review and approve before any operational use. This applies regardless of domain, risk level, or apparent quality of the draft. |
| Version control required for all published SOPs | GATE | No in-place editing of published documents. All changes create a new version with a changelog entry. Version history must be retained. |
| Regulatory compliance requirements take precedence | GATE | FDA 21 CFR Part 11, FAA AC 120-78B, NRC 10 CFR Part 50 Appendix B, and equivalent regulatory frameworks for their respective domains override internal convenience. When a regulatory requirement conflicts with an AI-augmentation pattern, the regulatory requirement governs. |

**Expanded NASA IV&V requirement:**

NASA Procedural Requirements 7150.2D (Software Engineering Requirements) establishes Independent Verification and Validation (IV&V) as mandatory for Class A (human-rated) and Class B (mission-critical) software. IV&V requires that a team independent of the development team verifies that the software and its operational procedures satisfy their requirements and performs as intended. [nasa-npr-7150.2d]

Applied to AI-generated DACP bundles for NASA-class systems:
- The IV&V team must review the DACP bundle independently of the team that authored or AI-generated it
- IV&V must assess the executable layer against the structured data layer for consistency
- IV&V must verify preconditions and postconditions against system behavioral specifications
- IV&V results must be documented and retained as part of the software development file

The requirement that IV&V be "independent" means the IV&V team must not include reviewers who participated in drafting, prompting, or AI-generation of the procedure. It is not sufficient to have the same team review their own AI-generated output.

**Additional safety rules for AI-augmented SOPs:**

- Procedures governing emergency response must not be AI-generated without explicit sign-off by the Safety Officer and Responsible Engineer
- Any SOP containing safety-critical parameter values (pressure limits, electrical ratings, chemical concentrations, structural loads) must have those values individually verified against the applicable engineering specification, not inferred from the AI draft
- AI-generated procedures must be labeled with their generation date and tool; this label must remain visible in the document until it is removed by an approver who has confirmed the review is complete

---

## 8. SOP-Agent: Domain-Specific AI Agents

### 8.1 Research Context

Ye, Anbang et al. (2025) introduce SOP-Agent in arXiv:2501.09316 as an approach to specializing general-purpose AI agents for specific operational domains through structured SOPs. The core insight is that general-purpose LLM agents, while capable across many domains, produce inconsistent and unreliable behavior in specific operational contexts precisely because they have no constraint on how they approach a task. SOPs provide that constraint in a form the agent can use. [ye-et-al-2025]

The paper demonstrates that agents given domain-specific SOPs as structured guidance outperform general-purpose agents on domain tasks — not because they have more capability, but because the SOPs reduce the search space of possible approaches to the set of approaches that are known to work in the domain. The SOP acts as a filter, not an amplifier.

### 8.2 SOPs as Agent Constraint Mechanisms

The mechanism by which an SOP specializes an agent's behavior has three components:

**Step pre-selection:** Rather than deciding from scratch how to approach a task, the agent follows the procedure sequence. This eliminates the planning overhead and the risk of choosing an approach that is valid in general but wrong for the domain.

**Vocabulary constraint:** SOPs define domain-specific terminology. An agent operating with a procedure that specifies "validate the thermal profile against the engineering specification" is constrained to use domain-appropriate tools and outputs. A general-purpose agent might interpret the same instruction in many ways.

**Error path specification:** When the agent encounters an unexpected state, the SOP's error paths specify the response. This is the DACP error handling from Section 4.3 expressed in agent terms: the agent does not improvise recovery; it follows the documented procedure.

The formal implication of this structure is that SOP-constrained agents are more predictable, auditable, and correctable than unconstrained agents. When an SOP-constrained agent makes an error, the error is traceable to a specific procedure step — and fixing the procedure fixes the agent behavior. When an unconstrained agent makes an error, the correction requires modifying the model or the prompt in ways that may have unpredictable effects on other behaviors.

### 8.3 Implications for GSD-Style Skill Definitions

The GSD skill system uses `.claude/skills/` files to define bounded operational procedures for AI agents. The SOP-Agent research validates this architecture: GSD skills are, in formal terms, domain-specific SOPs that constrain agent behavior to a defined workflow.

The mapping between GSD skill structure and DACP SOP anatomy:

| GSD Skill Field | DACP / SOP Equivalent |
|---|---|
| `description:` front-matter | Section 1.0 Purpose |
| When to Use / When NOT to Use | Section 2.0 Scope |
| Primary Workflow section | Section 6.0 Procedure |
| Quality Checks section | Section 7.0 Quality Checks |
| Deliverable specification | Section 8.0 Success Criteria |
| Chipset configuration | Section 5.0 Roles & Responsibilities |
| References subdirectory | Section 3.0 References |

This mapping means GSD skill development is, in practice, SOP development for AI agents. The quality requirements are the same: completeness, determinism, explicit error paths, and verifiable success criteria. The review requirements are the same: a qualified person must review the skill before it is used in production workflows.

The SOP-Agent research adds one important design principle: the most effective domain-specific procedures for agents are procedures that were designed for the agent's operational context, not human procedures adapted post-hoc. A procedure designed for a human operator includes assumptions about human judgment, context awareness, and error recovery that an agent cannot replicate. A procedure designed as an agent SOP from the start explicitly specifies what a human would infer.

### 8.4 Connection to Bounded Learning Rules

The SOP-Agent pattern connects to a broader principle in AI system design: bounded learning, where an agent's behavior is constrained to a defined solution space by explicit rules or procedures, with learning occurring within that space rather than across it.

In SOP-Agent terms, the SOP defines the boundary. The agent can optimize within the boundary — applying faster or more efficient approaches to individual steps — but it cannot deviate from the boundary without explicit human authorization. This is the property that makes SOP-constrained agents appropriate for regulated or safety-critical environments: the boundary is auditable, the agent's compliance with the boundary is verifiable, and changes to the boundary require human approval.

For GSD skill design, the practical implication is that skills should define tight boundaries rather than loose guidelines. A skill that says "use good judgment to determine the right approach" transfers the judgment burden to the agent without auditable constraints. A skill that says "if the test suite reports more than 2 failures, halt and alert the operator" defines a deterministic response to a specific condition. The tighter the boundary, the more auditable the agent's behavior, and the more reliably the skill produces the intended outcome.

---

## 9. Source Index and Citations

All sources referenced in this module are listed below with full attribution and the specific sections they support.

**[ye-et-al-2025]**
Ye, Anbang, Lijian Fan, Mingbiao Shi, Daoyuan Zheng, Chen Qian, Yifei Wang, and Yisen Wang.
"SOP-Agent: Empower General Purpose AI Agent with Domain-Specific SOPs."
arXiv:2501.09316, January 2025.
https://arxiv.org/abs/2501.09316
Sections: 8.1, 8.2, 8.3, 8.4

**[guideless-ai-2025]**
Guideless.ai.
"AI-Powered SOPs: How Modern Teams Document and Train Faster."
November 2025.
https://guideless.ai/ai-powered-sops
Sections: 1, 2.1, 2.4

**[tractian-2026]**
Tractian.com.
"Standard Operating Procedure: Full Implementation Guide."
2026.
https://tractian.com/en/blog/standard-operating-procedure
Sections: 2.1, 3.0

**[newgenone-2026]**
NewgenONE.
"AI-Augmented SOP Lifecycle Management."
2026.
https://newgenone.com
Sections: 2.3

**[fluency-2026]**
Fluency.
"AI SOP Platform Overview."
2026.
https://www.fluencyhq.com
Sections: 2.3

**[nasa-npr-7150.2d]**
NASA.
"NPR 7150.2D: NASA Software Engineering Requirements."
National Aeronautics and Space Administration.
https://nodis3.gsfc.nasa.gov/displayDir.cfm?t=NPR&c=7150&s=2D
Sections: 7, Safety and Sensitivity Considerations

**[nasa-std-8739.8a]**
NASA.
"NASA-STD-8739.8A: NASA Software Assurance and Software Safety Standard."
National Aeronautics and Space Administration.
Sections: 7

**[ibm-2026-approx]**
IBM.
"AI-Augmented Documentation Pipelines: Cycle Time Analysis."
2026.
Internal research report cited in industry survey data.
Sections: 2.2

**[kaizen-up]**
KaizenUp.
"Video-to-Procedure: Automated SOP Generation from Expert Recordings."
https://kaizenup.com
Sections: 1, 2.1

---

*This module is part of the Engineering SOPs Research Mission — a component of the Artemis II research program. Classification: Research / Reference. Not for operational use without domain-qualified review.*
