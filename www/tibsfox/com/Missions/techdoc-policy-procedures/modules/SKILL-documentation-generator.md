# GSD Documentation Generator Skill

## Purpose

This skill enables GSD to generate policy, procedure, and SOP (Standard Operating Procedure) documents that comply with the Technical Documentation for Policy & Procedures mission standards. Generated documents follow the taxonomy, writing standards, and governance requirements defined in Modules M1 through M6.

The skill produces documents that are structurally complete, properly classified, audience-targeted, and compliance-mapped — ready for human review and the standard lifecycle progression defined in the governance model.

## Activation

This skill activates when the user requests generation of a policy, procedure, or SOP document. Common trigger phrases:

- "Generate a policy for [topic]"
- "Create a procedure for [task]"
- "Draft an SOP for [process]"
- "I need a [policy|procedure|SOP] document"

## Prerequisites

Before generating a document, the skill requires the following information from the user (gathered through adaptive questioning if not provided upfront):

1. **Document type:** policy, procedure, or SOP
2. **Title:** Descriptive title in title case, under 80 characters
3. **Domain:** Organizational domain (SEC = Security, OPS = Operations, IT = Information Technology, ENG = Engineering, PLT = Platform)
4. **Owner role:** The role accountable for this document (e.g., "Security Operations Lead", not a person's name)
5. **Scope:** What the document covers and what it explicitly excludes
6. **Purpose:** One-sentence statement of why this document exists
7. **Audience:** One or more target personas from: senior_engineer, new_hire, compliance_auditor, operations_staff, product_manager
8. **Framework references** (optional): Applicable compliance framework controls (e.g., "NIST 800-53 AC-1", "ISO 27001 A.5.15")
9. **Criticality** (optional, defaults to "standard"): critical, standard, or reference

## Document Generation Process

### Step 1: Input Validation

Before generating, the skill validates all inputs:

- Title is title case and under 80 characters
- Owner is a role title, not a personal name
- Scope is a concrete statement, not a vague phrase like "all relevant systems"
- Purpose is a single sentence
- Audience includes at least one valid persona
- Framework references (if provided) are valid identifiers from the mission source index

If validation fails, the skill identifies the specific issue and requests correction from the user.

### Step 2: Document ID Assignment

The skill generates a document ID following the pattern `{TYPE_PREFIX}-{DOMAIN}-{NNNN}`:

| Type | Prefix |
|------|--------|
| Policy | POL |
| Procedure | PRC |
| SOP | SOP |

Example: `POL-SEC-0042` for a Security domain policy document. The sequence number is assigned by incrementing the highest existing number in the target directory for the given type and domain.

### Step 3: Template Selection and Population

The skill selects the appropriate template based on document type and populates all sections.

---

## Policy Document Template

When `document_type` is **policy**, the skill generates a document with the following structure:

### Frontmatter

```yaml
---
id: POL-{DOMAIN}-{NNNN}
title: "{title}"
type: policy
owner: "{owner_role}"
lifecycle_state: Draft
review_cadence: Annual
audience: [{audience list}]
framework_refs: [{framework_refs list}]
scope: "{scope}"
purpose: "{purpose}"
version: "1.0"
last_reviewed: "{today's date}"
next_review: "{today's date + 1 year}"
approval_block: []
---
```

### Required Sections

**1. Purpose**

One paragraph. References the organizational value the policy protects and the regulatory or framework obligation it addresses. Written in third person.

Skill instruction: Generate a purpose statement that connects the policy topic to both organizational risk and applicable framework requirements. Do not use "should" — policies use "must" or "shall."

**2. Scope**

Two components:
- **In scope:** Specific systems, personnel, processes, or environments covered
- **Out of scope:** What is explicitly excluded, with references to alternative documents

Skill instruction: The scope must be specific enough to be testable. "All systems" is not a valid scope unless "systems" is defined in the document. Prefer enumerated scope boundaries.

**3. Policy Statement**

Numbered obligations. Each obligation:
- Uses "must" or "shall" (not "should" — per M1 Section 6.5)
- Is testable (an auditor can verify compliance)
- Has a defined compliance threshold (timeline, measurement, frequency)

Skill instruction: Generate 5–15 policy statements depending on the topic's complexity. Each statement must be independently verifiable. Include exception handling in the Exceptions section, not in the policy statements.

**4. Roles and Responsibilities**

Table format mapping each obligation to a responsible role:

| Obligation | Responsible Role | Accountability |
|---|---|---|
| [Statement reference] | [Role] | [What they must do] |

**5. Compliance**

- Consequences of non-compliance
- Enforcement mechanism (audit, automated monitoring, self-attestation)
- Reporting requirement (how violations are reported and to whom)

**6. Exceptions**

- How exceptions are requested (process, form, approval chain)
- Who approves exceptions (specific role, not "management")
- Exception documentation requirements (written, timestamped, with justification)
- Exception review cadence (how often active exceptions are re-evaluated)

**7. Related Documents**

Links to implementing standards, procedures, and controls. Each reference includes the document ID and title.

**8. Revision History**

| Version | Date | Author (Role) | Changes |
|---------|------|---------------|---------|
| 1.0 | {date} | {owner_role} | Initial draft |

### Policy Writing Rules (enforced by skill)

- Third person voice throughout ("The organization must...", "All systems shall...")
- "Must" or "shall" for obligations — never "should"
- No procedural steps (those belong in implementing procedures)
- No tool-specific instructions
- No optional recommendations (those belong in guidelines)
- Scope must define all ambiguous terms
- Approval block left empty (populated during governance approval)

---

## Procedure Document Template

When `document_type` is **procedure**, the skill generates a document with the following structure:

### Frontmatter

```yaml
---
id: PRC-{DOMAIN}-{NNNN}
title: "{title}"
type: procedure
owner: "{owner_role}"
lifecycle_state: Draft
review_cadence: Bi-annual
audience: [{audience list}]
framework_refs: [{framework_refs list}]
scope: "{scope}"
purpose: "{purpose}"
version: "1.0"
last_reviewed: "{today's date}"
next_review: "{today's date + 6 months}"
---
```

### Required Sections

**1. Purpose**

One paragraph. What this procedure accomplishes and why it is performed. Written in second person where addressing the reader, third person for organizational statements.

**2. Scope**

When this procedure applies and when a different procedure should be used instead. Include environment applicability (production, staging, development).

**3. Prerequisites**

Bulleted list of everything that must be true before starting:
- Access requirements (specific roles, credentials, permissions)
- Tool availability (specific tools, versions, URLs)
- Required knowledge (link to concept documentation if needed)
- Environmental conditions (maintenance window, no active deployments, etc.)

Skill instruction: Prerequisites must be specific and verifiable. "Appropriate access" is not a valid prerequisite. "Administrator role in the IAM console (iam.internal.example.com)" is.

**4. Steps**

Numbered, sequential actions. Each step:
- Contains exactly one action (per M1 Section 6.5)
- Is written in second person imperative ("Open the console", "Navigate to", "Enter")
- Includes expected result at decision points and significant checkpoints
- Includes decision point handling where the procedure branches

Step format:
```
N. [Action in imperative mood].
   **Expected result:** [Observable outcome of this step].
```

For branching steps:
```
N. [Check condition].
   - If [condition A]: proceed to step N+1.
   - If [condition B]: proceed to step M.
   - If [condition C]: escalate to [role] and stop.
```

Skill instruction: Generate 8–20 steps depending on procedure complexity. Every step must advance the procedure toward completion. Do not include explanatory paragraphs mid-step — move context to the Purpose section or a related concept document.

**5. Expected Results**

The state of the system after successful completion. Specific, observable, verifiable.

**6. Troubleshooting**

The 3–5 most common failure modes and their resolution paths:

| Symptom | Cause | Resolution |
|---|---|---|
| [Observable symptom] | [Root cause] | [Steps to resolve] |

Skill instruction: Focus on failures that the person performing the procedure can encounter. Do not include hypothetical failures that have never occurred.

**7. Related Documents**

Parent policy or standard, related procedures, tool documentation. Each reference includes document ID and title.

**8. Revision History**

| Version | Date | Author (Role) | Changes |
|---------|------|---------------|---------|
| 1.0 | {date} | {owner_role} | Initial draft |

### Procedure Writing Rules (enforced by skill)

- Second person imperative for steps ("Open", "Navigate to", "Enter")
- One action per step
- Expected result at every decision point
- Prerequisites are not step zero — they are a separate section
- Explicit termination condition ("The procedure is complete when...")
- No policy justification mid-procedure (reference the policy, don't reproduce it)
- Active voice mandatory (per M1 Section 6.2)

---

## SOP Document Template

When `document_type` is **sop**, the skill generates a document with the following structure:

### Frontmatter

```yaml
---
id: SOP-{DOMAIN}-{NNNN}
title: "{title}"
type: sop
owner: "{owner_role}"
lifecycle_state: Draft
review_cadence: Bi-annual
audience: [{audience list}]
framework_refs: [{framework_refs list}]
scope: "{scope}"
purpose: "{purpose}"
version: "1.0"
last_reviewed: "{today's date}"
next_review: "{today's date + 6 months}"
---
```

### Required Sections

**1. Purpose**

What operational function this SOP governs. One paragraph. Written in second person for operational context.

**2. Scope**

Which systems, environments, or processes this SOP covers. Must be specific enough that the reader knows whether this SOP applies to their situation.

**3. Definitions**

Terms specific to this SOP that may not be familiar to all readers. Table format:

| Term | Definition |
|------|-----------|
| [Term] | [Definition in context of this SOP] |

Skill instruction: Include only terms that are used in this SOP and that a new hire in the target audience might not know. Do not reproduce the entire organizational glossary.

**4. Responsibilities**

Roles involved in this SOP and their specific responsibilities. Table format:

| Role | Responsibility | Authority |
|------|---------------|-----------|
| [Role] | [What they do in this SOP] | [Decisions they can make] |

**5. Procedure Steps**

Detailed, numbered steps organized by phase:

### 5.1 Preparation
Steps for verifying readiness and gathering required resources.

### 5.2 Execution
Core procedure steps. Same format as Procedure template Section 4.

### 5.3 Verification
Steps for confirming successful completion.

### 5.4 Documentation
Steps for recording the activity in the appropriate tracking systems.

Skill instruction: SOPs are more detailed than procedures. Include explicit checkpoints between phases. The Verification phase must be a separate set of steps, not a note at the end of the Execution phase.

**6. Quality Checks**

Checkpoints where the performer verifies correctness before continuing. Table format:

| Checkpoint | Verification Method | Pass Criteria | Action on Failure |
|---|---|---|---|
| [After which step] | [How to check] | [What "pass" looks like] | [What to do if check fails] |

Skill instruction: Quality checks are mandatory in SOPs (per M1 Section 8.2). Generate at least 3 quality checks: one after Preparation, one during Execution, and one during Verification.

**7. Records**

What records must be created, where they are stored, and how long they are retained:

| Record | Storage Location | Retention Period | Responsible Role |
|---|---|---|---|
| [Record name] | [System/path] | [Duration] | [Role] |

Skill instruction: Records are mandatory in SOPs. At minimum, the SOP should record: (1) who performed the procedure, (2) when it was performed, (3) the outcome (pass/fail), and (4) any deviations from the documented steps.

**8. Revision History**

| Version | Date | Author (Role) | Changes |
|---------|------|---------------|---------|
| 1.0 | {date} | {owner_role} | Initial draft |

### SOP Writing Rules (enforced by skill)

- All Procedure writing rules apply
- Quality Checks section is mandatory and must contain at least 3 checkpoints
- Records section is mandatory and must specify retention periods
- Steps must be organized into Preparation / Execution / Verification / Documentation phases
- Definitions section must be populated (even if only 2–3 terms)
- Responsibilities table must include all roles mentioned in the procedure steps

---

## Audience Targeting

The skill adjusts document content based on the specified audience personas:

### For senior_engineer audience
- Omit basic concept explanations
- Include edge cases and constraint rationale
- Use technical terminology without definitions (reference glossary for uncommon terms)
- Include architecture context where relevant

### For new_hire audience
- Define all acronyms on first use
- Link to prerequisite documentation
- Include explicit "you will need X before starting" callouts
- Avoid assuming organizational context

### For compliance_auditor audience
- Lead with framework references in metadata
- Include control mapping tables
- Structure for non-linear reading (search by control ID)
- Emphasize evidence artifacts and approval blocks

### For operations_staff audience
- Minimize explanatory prose
- Maximize step clarity (short sentences, numbered steps)
- Include decision trees for branching paths
- Use visual callouts for warnings (WARNING:, NOTE:, CRITICAL:)

### For product_manager audience
- Lead with executive summary
- Use bullet points for key obligations
- Translate technical requirements into business impact
- Minimize jargon, explain when unavoidable

When multiple audiences are specified, the skill uses the progressive disclosure strategy from M1 Section 5.2: lead with compliance metadata, structure the body for the primary operational audience, and use appendices for secondary audiences.

---

## AI Generation Mode

When `ai_generation` is set to `true`, the skill applies additional requirements per M5:

1. **Labeling:** Every AI-generated section is marked with `[PENDING REVIEW]`
2. **Provenance metadata:** The `ai_provenance` block is added to frontmatter:
   ```yaml
   ai_provenance:
     generation_pattern: "{pattern name}"
     generation_date: "{date}"
     source_material: "{description of inputs}"
     review_status: pending
     reviewer: null
     review_date: null
   ```
3. **Branch naming:** The output branch follows the `ai-draft/{document-id}` convention
4. **Review requirements:** PR template includes the AI-specific review checklist from M5 Section 11.4
5. **Hallucination warning:** Generated documents include a header note: "This document was generated by AI and requires human review before publication. Verify all specific claims against authoritative sources."

---

## Validation Rules

Before outputting the generated document, the skill validates:

1. Document ID follows the `{TYPE}-{DOMAIN}-{NNNN}` pattern
2. All required template sections are present and non-empty
3. Voice matches document type (third person for policy, second person for procedure/SOP)
4. Policy documents do not contain "should" for obligations
5. Procedure steps are numbered with one action per step
6. SOP includes Quality Checks with at least 3 checkpoints
7. SOP includes Records section with retention periods
8. Safety rules are satisfied:
   - SC-01: No PII in examples (uses synthetic data: Alice Smith, 555-0100)
   - SC-02: No security-sensitive content in public-facing outputs
   - SC-03: All statistics have traceable citations
   - SC-04: AI-generated sections marked [PENDING REVIEW] (if ai_generation is true)
9. Review cadence is set correctly per M6 Section 5.1:
   - Policy: Annual
   - Procedure (Critical): Bi-annual
   - Procedure (Standard): Bi-annual
   - SOP: Bi-annual
10. Framework references (if provided) match valid identifiers from the mission source index

---

## Post-Generation Actions

After generating the document, the skill:

1. Reports the document ID, output file path, and lifecycle state (Draft)
2. Lists the next governance steps:
   - Owner review and revision
   - Submit for peer review (Draft → Review transition)
   - SME review
   - Compliance review (if framework_refs present)
   - Approval (per Ownership Matrix in M6 Section 4)
   - Publication
3. If AI generation mode was used, reminds the user that the [PENDING REVIEW] labels must be removed by the human reviewer, not the author

---

## Examples

### Generate a Security Policy

```
User: Generate a policy for patch management

Skill response:
  Document type: policy
  Title: Patch Management Policy
  Domain: SEC
  ID: POL-SEC-0043
  Output: [generated document with all 8 sections]
  Next steps: Owner review → Submit for SME + Compliance review → CISO approval
```

### Generate an Operational Procedure

```
User: Create a procedure for database credential rotation

Skill response:
  Document type: procedure
  Title: Database Credential Rotation Procedure
  Domain: OPS
  ID: PRC-OPS-0112
  Output: [generated document with all 8 sections, 12 numbered steps]
  Next steps: Owner review → Submit for SME review → Department Head approval
```

### Generate an SOP with AI Generation

```
User: Draft an SOP for quarterly access review (AI-generated)

Skill response:
  Document type: sop
  AI generation: true
  Title: Quarterly Access Review SOP
  Domain: IT
  ID: SOP-IT-0028
  Output: [generated document with all 8 sections, [PENDING REVIEW] labels,
           ai_provenance block in frontmatter]
  Next steps: SME walkthrough → Remove [PENDING REVIEW] labels →
              Submit for review → Operations Manager approval
```

---

## Source References

- M1: Foundations and Taxonomy (document templates, writing standards, lifecycle)
- M2: Structured Authoring Systems (DITA topic type alignment)
- M3: Docs-as-Code Pipeline (CI/CD integration, drift detection)
- M4: Compliance and Regulatory Frameworks (framework mappings, MCR/DSR)
- M5: AI Documentation Pattern Library (AI guardrails, review gates, labeling)
- M6: Unified Governance Model (ownership, review cadence, escalation)
- schema.json (mission schema — document types, fields, personas, safety rules)
