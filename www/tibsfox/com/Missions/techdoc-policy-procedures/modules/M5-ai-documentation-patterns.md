# M5: AI Documentation Pattern Library

**Module:** M5  
**Title:** AI Documentation Pattern Library  
**Type:** Standard / Reference  
**Owner:** Documentation Engineering Lead  
**Lifecycle State:** Published  
**Review Cadence:** Bi-annual (AI capabilities evolve rapidly)  
**Audience:** Senior Engineers, Documentation Engineers, Compliance Auditors, Operations Staff, Product Managers  
**Framework Refs:** NIST SP 800-53 R5 (SA, SI, PM), ISO/IEC 27001:2022, NIST AI RMF, NIST SP 800-100  
**Version:** 1.0  
**Last Reviewed:** 2026-04-05  
**Next Review:** 2026-10-05  

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Industry Context and Adoption Data](#2-industry-context-and-adoption-data)
3. [Pattern 1: Inline Generation](#3-pattern-1-inline-generation)
4. [Pattern 2: Reference Document Synthesis](#4-pattern-2-reference-document-synthesis)
5. [Pattern 3: SOP First Draft Generation](#5-pattern-3-sop-first-draft-generation)
6. [Pattern 4: Drift Detection Augmentation](#6-pattern-4-drift-detection-augmentation)
7. [Pattern 5: Audience Adaptation](#7-pattern-5-audience-adaptation)
8. [Pattern 6: Gap Analysis](#8-pattern-6-gap-analysis)
9. [Failure Mode Analysis](#9-failure-mode-analysis)
10. [Decision Framework: AI vs Human Authorship](#10-decision-framework-ai-vs-human-authorship)
11. [Review Gate Design](#11-review-gate-design)
12. [Integration with Docs-as-Code Pipeline](#12-integration-with-docs-as-code-pipeline)
13. [AI Content Labeling Standard](#13-ai-content-labeling-standard)
14. [Source Index and Citations](#14-source-index-and-citations)

---

## 1. Introduction

Artificial intelligence is now a participant in the documentation lifecycle. This is not a future trend — it is a present operational reality. Google Cloud's DORA 2025 report found that 64% of software professionals use AI tools in their development workflows, a figure that encompasses documentation generation, code review, and automated testing. [dora-2025] Stack Overflow's 2025 Developer Survey found that 24.8% of developers use AI tools for writing documentation, with an additional 27.3% using AI tools for learning new codebases — an activity directly supported by AI-generated documentation. [stackoverflow-2025] IBM reports that organizations using AI-augmented documentation pipelines achieve 59% reductions in documentation cycle time. [ibm-2026]

These numbers describe a permanent shift. The question for documentation programs is not whether to integrate AI but how to integrate it with appropriate guardrails, review gates, and quality assurance mechanisms. AI-generated documentation that is deployed without human review creates a new category of documentation debt: content that looks authoritative, reads fluently, and is wrong.

This module defines six AI documentation patterns — specific, bounded applications of AI to the documentation lifecycle. Each pattern includes a guardrail specification that defines when human review is mandatory, what the review must verify, and how the pattern integrates with the docs-as-code pipeline defined in M3 and the lifecycle states defined in M1. The module then analyzes five failure modes specific to AI-generated documentation and provides a decision framework for determining when AI should draft, when humans must author, and when the two should collaborate.

**Who should read this module:**

- Documentation engineers integrating AI tools into existing pipelines
- Engineering managers evaluating AI documentation tooling
- Compliance auditors assessing AI-generated documentation risks
- Senior engineers reviewing AI-generated documentation in pull requests
- Platform engineers building AI-augmented CI/CD documentation workflows

**What this module does not cover:**

- AI model selection, fine-tuning, or training (those are platform engineering decisions)
- AI-assisted code generation (a separate domain with different risk profiles)
- General AI governance beyond documentation-specific concerns

**Safety rule reminder:** Per the mission schema safety rule SC-04: "AI-generated sections must be marked [PENDING REVIEW] until human review gate passes." This rule applies to all six patterns defined in this module.

---

## 2. Industry Context and Adoption Data

### 2.1 Current Adoption Rates

The integration of AI into documentation workflows has accelerated sharply between 2024 and 2026. The data below provides the quantitative context for the patterns and guardrails in this module.

**DORA 2025 — State of AI-Assisted Software Development:**

Google Cloud's annual DORA (DevOps Research and Assessment) report found that 64% of software professionals use AI tools in their workflows. This figure spans code generation, testing, documentation, and code review. The report identified documentation generation as one of the highest-value applications of AI in software development, noting that AI-generated first drafts of documentation reduce the "blank page" barrier that causes documentation to be deprioritized. The report also found that teams using AI documentation tools reported higher documentation currency rates — documentation was more likely to be updated when a feature changed because the cost of updating was lower. [dora-2025]

**Stack Overflow 2025 Developer Survey:**

Stack Overflow's 2025 survey of over 65,000 developers found two AI-documentation adoption metrics: 24.8% of developers report using AI tools specifically for writing documentation (including docstrings, README files, API references, and internal guides), and 27.3% of developers use AI tools for learning new codebases. The learning-a-codebase figure is relevant because it indicates demand for AI-generated explanatory documentation — concept topics, architecture overviews, and onboarding guides — that describe existing systems. [stackoverflow-2025]

The survey also found that developer trust in AI-generated documentation varies by document type: developers trust AI-generated API reference documentation more than AI-generated architectural decision records or security policy documents. This trust gradient aligns with the decision framework in Section 10 of this module.

**IBM — AI Code Documentation (2026):**

IBM's research report found that organizations using AI-augmented documentation pipelines achieve a 59% reduction in documentation cycle time: the elapsed time from a code change to published, accurate documentation describing that change. The reduction is attributed to two mechanisms: (1) AI generates first drafts automatically, eliminating the blank-page phase, and (2) AI-generated drafts are more consistent in structure and format, reducing reviewer effort. IBM also found that AI-augmented pipelines produce documentation with 23% fewer structural inconsistencies (missing sections, inconsistent terminology, format violations) compared to manually authored documentation. [ibm-2026]

### 2.2 Implications for Documentation Programs

These adoption figures create two imperatives for documentation programs:

1. **AI documentation is already happening.** Even without a formal AI documentation policy, engineers are using AI tools to generate docstrings, draft README files, and produce internal documentation. Without guardrails, this content enters the documentation corpus unreviewed and unlabeled. The patterns in this module bring this existing practice under governance.

2. **AI documentation quality is bounded by review rigor.** The 59% cycle time reduction reported by IBM assumes human review is preserved. Removing human review from AI-generated documentation would eliminate the cycle time benefit because the resulting documentation debt — corrections, clarifications, accuracy fixes — would compound faster than the drafting time saved.

### 2.3 AI Capabilities and Limitations for Documentation

Current large language models (LLMs) are effective at:

- **Structural generation:** Producing documents that follow a template with correct section ordering, field population, and format consistency
- **Code-to-prose translation:** Generating natural language descriptions of code behavior, API parameters, and function signatures from source code
- **Terminology consistency:** Maintaining consistent use of terms within a generated document (though not necessarily consistent with organizational terminology standards)
- **Multi-format output:** Generating the same content in different formats (Markdown, DITA XML, reStructuredText) from a single prompt

Current LLMs are not reliable at:

- **Architectural intent:** Understanding why a design decision was made, what alternatives were considered, and what constraints drove the choice
- **Organizational context:** Knowing which team owns a system, what the operational history of a component is, or what the current incident landscape looks like
- **Accuracy verification:** Determining whether a generated statement about system behavior is correct — LLMs generate plausible text, not verified text
- **Security sensitivity:** Recognizing when generated documentation might expose security-relevant implementation details that should not be public
- **Audience calibration:** Determining the appropriate level of detail for a specific audience persona without explicit guidance

These capability boundaries define the guardrail requirements for each pattern.

---

## 3. Pattern 1: Inline Generation

### 3.1 Pattern Definition

Inline generation is the use of AI to produce documentation that is embedded directly in source code: docstrings, function-level comments, module headers, and inline annotations. The AI tool operates at commit time or during code authoring, generating documentation for the code being written.

This is the most widely adopted AI documentation pattern. It operates at the smallest granularity (individual functions, classes, and modules) and integrates directly into the developer's editing workflow.

### 3.2 Mechanism

The AI tool receives the source code of a function, class, or module as input and generates:

- **Docstrings:** Function purpose, parameter descriptions, return value descriptions, exception documentation, and usage examples
- **Module headers:** Module-level documentation describing the module's responsibility and its relationships to other modules
- **Inline comments:** Explanatory comments for non-obvious code patterns, algorithm implementations, and workarounds

The generation occurs in the developer's editor (via AI-powered editor extensions) or as a pre-commit hook that generates missing docstrings before the commit is created.

### 3.3 Concrete Example

**Source code (input to AI):**

```python
def provision_emergency_access(
    requestor_id: str,
    ticket_number: str,
    permission_set: str = "emergency-read-only",
    duration_hours: int = 8,
) -> EmergencyAccessResult:
    validate_ticket_format(ticket_number)
    verify_requestor_identity(requestor_id)
    account = create_temporary_account(
        requestor_id=requestor_id,
        ticket=ticket_number,
        permissions=permission_set,
        expiry=datetime.utcnow() + timedelta(hours=duration_hours),
    )
    deliver_credentials(account, method="vault")
    audit_log.record(
        action="emergency_access_provisioned",
        requestor=requestor_id,
        ticket=ticket_number,
        account=account.id,
        expiry=account.expiry,
    )
    return EmergencyAccessResult(account_id=account.id, expiry=account.expiry)
```

**AI-generated docstring (output):**

```python
def provision_emergency_access(
    requestor_id: str,
    ticket_number: str,
    permission_set: str = "emergency-read-only",
    duration_hours: int = 8,
) -> EmergencyAccessResult:
    """Provision temporary emergency access for a verified requestor.

    Creates a time-limited account with the specified permission set,
    delivers credentials via the secure vault, and records the
    provisioning event in the audit log.

    Args:
        requestor_id: Unique identifier of the person requesting access.
        ticket_number: Approved emergency access ticket in EA-YYYYMMDD-NNN
            format. Validated against the ticket format standard.
        permission_set: Permission level for the temporary account.
            Defaults to "emergency-read-only".
        duration_hours: Account validity period in hours from creation.
            Defaults to 8.

    Returns:
        EmergencyAccessResult containing the temporary account ID and
        expiration timestamp.

    Raises:
        TicketFormatError: If ticket_number does not match EA-YYYYMMDD-NNN.
        IdentityVerificationError: If requestor identity cannot be verified.
    """
```

### 3.4 Guardrail: Human Review for Architectural Intent

**Guardrail specification:**

| Aspect | Requirement |
|--------|-------------|
| **Review trigger** | All AI-generated inline documentation must be reviewed by the code author before commit |
| **Review focus** | Architectural intent, security implications, accuracy of exception documentation |
| **Mandatory check** | Does the generated docstring accurately describe WHY the function exists, not just WHAT it does? |
| **Security check** | Does the generated documentation expose internal implementation details that should not be visible in public API documentation? |
| **Override authority** | Code author may accept, modify, or reject AI-generated inline documentation |
| **Labeling requirement** | AI-generated inline documentation does not require a [PENDING REVIEW] label after the code author reviews it during the commit workflow (the commit itself is the review gate) |
| **Pipeline integration** | Pre-commit hook validates that all public functions have docstrings; does not validate that docstrings are AI-generated or human-authored |

**What the guardrail catches:**

AI-generated docstrings are reliable for describing observable behavior: what the function takes as input, what it returns, what exceptions it raises. They are unreliable for describing intent: why the function was designed this way, what alternative approaches were considered, what constraints drove the parameter defaults.

In the example above, the AI correctly documented that `duration_hours` defaults to 8, but it did not explain why 8 hours was chosen (compliance with the emergency access policy's maximum duration). The human reviewer should add that context if it is important for future maintainers.

AI-generated docstrings are also unreliable for security-sensitive documentation. If the `deliver_credentials` function uses a specific vault path or token format, the AI may include that detail in the docstring. The human reviewer must verify that no security-sensitive implementation details are exposed.

### 3.5 When to Use This Pattern

- Generating docstrings for utility functions, data models, and API handlers
- Producing consistent parameter documentation across a large codebase
- Filling docstring gaps in legacy code that was written without documentation
- Generating initial module headers for new code

### 3.6 When NOT to Use This Pattern

- Security-critical code where docstrings might expose attack surface details
- Code with complex design rationale that the AI cannot infer from the implementation
- Public API documentation where inaccurate parameter descriptions could cause user errors

---

## 4. Pattern 2: Reference Document Synthesis

### 4.1 Pattern Definition

Reference document synthesis is the use of AI to generate complete reference documentation from structured source data: OpenAPI/Swagger specifications, database schemas, configuration file schemas, CLI help text, and protocol definitions. The AI transforms structured data into human-readable reference documentation.

This pattern maps directly to the reference topic type defined in M2 (DITA reference topics) and the reference document archetype used in docs-as-code workflows (M3).

### 4.2 Mechanism

The AI tool receives a structured specification (OpenAPI YAML, JSON Schema, Protobuf definition, database DDL) and produces:

- **API reference pages:** Endpoint descriptions, parameter tables, request/response examples, error code catalogs
- **Configuration references:** Parameter descriptions, default values, valid ranges, dependency relationships
- **Database schema documentation:** Table descriptions, column definitions, relationship diagrams, constraint documentation
- **CLI references:** Command descriptions, flag documentation, usage examples

The generation is triggered by CI/CD pipeline when the source specification changes, ensuring the reference documentation is always synchronized with the specification.

### 4.3 Concrete Example

**OpenAPI specification (input):**

```yaml
paths:
  /patches/schedule:
    post:
      summary: Schedule patch deployment
      operationId: schedulePatchDeployment
      parameters: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - system_ids
                - patch_id
              properties:
                system_ids:
                  type: array
                  items:
                    type: string
                  maxItems: 500
                  description: System identifiers to receive the patch
                patch_id:
                  type: string
                  pattern: "^PATCH-\\d{8}-\\d{3}$"
                  description: Patch identifier
                scheduled_time:
                  type: string
                  format: date-time
                  description: Deployment time in UTC (deploys immediately if omitted)
      responses:
        '202':
          description: Patch deployment scheduled
        '400':
          description: Malformed request
        '409':
          description: Patch already scheduled for target systems
```

**AI-generated reference documentation (output):**

The AI produces a Markdown reference page following the procedure template from M1 Section 8.2, with parameter tables, response code explanations, and concrete request/response examples. The output structure matches the reference topic structure defined in M2 Section 3.3.

### 4.4 Guardrail: Accuracy Validation Against Actual Behavior

**Guardrail specification:**

| Aspect | Requirement |
|--------|-------------|
| **Review trigger** | Every AI-generated reference document must be validated against actual system behavior before publication |
| **Validation method** | Automated: CI pipeline sends sample requests to a staging environment and compares actual responses to documented responses. Manual: SME reviews parameter descriptions for accuracy |
| **Mandatory check** | Do documented response codes match actual response codes? Do parameter descriptions match actual behavior? Do examples produce documented results when executed? |
| **Accuracy threshold** | 100% accuracy required for parameter types, required/optional status, and response codes. Prose descriptions may have minor inaccuracies that SME review catches |
| **Labeling requirement** | AI-generated reference documents carry [PENDING REVIEW] label until SME sign-off |
| **Pipeline integration** | Reference documentation generation runs as a CI step triggered by OpenAPI/schema file changes. Output is committed to a PR for human review |

**What the guardrail catches:**

AI models can generate plausible but incorrect parameter descriptions. A common failure: the AI reads `maxItems: 500` in the schema and generates "Up to 500 systems can be patched per request," which is correct — but it might also state "System IDs must be in UUID format" when the schema does not specify UUID format. The validation step catches these additions of constraints that do not exist in the specification.

Another common failure: AI-generated examples may not be executable. A request example with a `scheduled_time` in a non-ISO-8601 format looks plausible but fails at runtime. Automated validation against a staging environment catches this class of error.

### 4.5 When to Use This Pattern

- API documentation for services with OpenAPI specifications
- Configuration reference documentation for systems with JSON Schema or YAML schema
- Database documentation for systems with maintained DDL or ORM model definitions
- CLI documentation for tools with structured help text

### 4.6 When NOT to Use This Pattern

- APIs with undocumented behavioral contracts that are not captured in the specification (the AI only knows what the spec says, not what the system actually does)
- Configuration references where parameter interactions create non-obvious dependencies that the schema does not capture
- Systems where the specification is out of date with the implementation (the AI will generate documentation matching the stale spec, compounding the drift)

---

## 5. Pattern 3: SOP First Draft Generation

### 5.1 Pattern Definition

SOP first draft generation is the use of AI to produce initial drafts of Standard Operating Procedures from process descriptions, interview transcripts, existing informal documentation, or recorded screen sessions. The AI structures unstructured process knowledge into the SOP template format defined in M1 Section 8.2.

This pattern addresses a specific bottleneck in documentation programs: the gap between process knowledge that exists in people's heads and documented procedures. Subject matter experts know how to perform a task but rarely have time to write the procedure document. AI generates the first draft; the SME validates and corrects it.

### 5.2 Mechanism

The AI tool receives one or more of the following inputs:

- **Process description:** A narrative explanation of the task, either written informally or transcribed from a verbal description
- **Existing informal documentation:** Wiki pages, Slack threads, email chains, or README fragments that partially describe the process
- **Screen recording transcripts:** Transcriptions of recorded screen sessions showing the task being performed
- **Related existing SOPs:** Similar procedures in the documentation corpus that provide structural and terminology context

The AI produces a complete SOP draft following the template:

1. Purpose
2. Scope
3. Definitions
4. Responsibilities
5. Procedure Steps (numbered, second person, with expected results)
6. Quality Checks
7. Records
8. Revision History

### 5.3 Concrete Example

**Process description (input — from SME interview transcript):**

> "So when we need to rotate the database credentials, here's what we do. First you need to check that there are no active deployments — look at the deployment dashboard, make sure nothing is in progress. Then you go into the secrets manager — we use HashiCorp Vault — and generate new credentials for the database role. Don't just change the password, you need to generate through the role because it handles the rotation on the DB side too. Then you update the application config — but you have to do it in staging first, run the health checks, and only then do production. Oh and make sure you document the rotation in the change management ticket. We've had issues where people forgot that step and then audit couldn't find evidence of the rotation."

**AI-generated SOP draft (output excerpt):**

```markdown
## 5. Procedure Steps

### 5.1 Pre-Rotation Verification

1. Open the deployment dashboard at [DEPLOYMENT_DASHBOARD_URL].
2. Verify that no deployments are currently in progress. The dashboard
   status for all environments must show "Idle" or "Complete."
   **Expected result:** All deployment pipelines show idle status.
3. If any deployment is in progress, wait for it to complete before
   proceeding. Do not rotate credentials during an active deployment.

### 5.2 Credential Generation

4. Open HashiCorp Vault at [VAULT_URL] using your administrator
   credentials.
5. Navigate to the database secrets engine for the target database.
6. Generate new credentials using the configured database role.
   Do not manually change the database password — the Vault role
   handles credential rotation on the database side automatically.
   **Expected result:** Vault displays newly generated credentials
   with a lease duration matching the configured TTL.

### 5.3 Staging Validation

7. Update the application configuration in the staging environment
   with the new credentials.
   [PENDING REVIEW: Specify exact configuration path and update method]
8. Run the staging health check suite.
   **Expected result:** All health checks pass. Database connectivity
   tests return success.

### 5.4 Production Deployment

9. After staging health checks pass, update the application
   configuration in the production environment with the new credentials.
   [PENDING REVIEW: Specify exact configuration path and update method]
10. Run the production health check suite.
    **Expected result:** All health checks pass. No error rate increase
    in the monitoring dashboard.

### 5.5 Documentation

11. Record the credential rotation in the change management ticket:
    - Rotation timestamp (UTC)
    - Environments rotated (staging, production)
    - Vault lease ID for the new credentials
    - Health check results (pass/fail for each environment)
12. The procedure is complete when the change management ticket
    contains all rotation details and the ticket status is updated
    to "Completed."
```

### 5.4 Guardrail: SME Walkthrough Test

**Guardrail specification:**

| Aspect | Requirement |
|--------|-------------|
| **Review trigger** | Every AI-generated SOP draft must be walked through by the SME who provided the source material |
| **Walkthrough method** | The SME reads each step and either (a) performs the step in a non-production environment or (b) confirms from memory that the step is correct and complete. Each step is marked Verified, Modified, or Rejected |
| **Mandatory check** | Are all steps present? Are steps in the correct order? Are there implicit steps the SME knows but did not mention in the source material? Are the expected results accurate? |
| **Completeness check** | The SME must confirm that the Quality Checks and Records sections are complete. AI-generated SOPs frequently omit quality verification steps and record-keeping requirements that the SME considers "obvious" |
| **Labeling requirement** | AI-generated SOP drafts carry [PENDING REVIEW] labels on every section until SME walkthrough is complete |
| **Pipeline integration** | AI-generated SOP drafts are committed to a branch with [AI-DRAFT] in the branch name. The PR cannot merge until the SME walkthrough is documented in the PR review |

**What the guardrail catches:**

AI-generated SOPs are prone to three specific failures:

1. **Missing implicit steps.** The SME knows to check the monitoring dashboard after step 10 because they've learned from experience that credential rotations sometimes cause a brief spike in error rates. The AI does not know this because it was not in the input. The walkthrough surfaces these implicit steps.

2. **Incorrect sequencing.** The AI may reorder steps for logical flow without understanding that the operational sequence matters. Generating credentials before checking for active deployments might read logically but creates a risk of credential expiration during a blocked deployment.

3. **Fabricated details.** The AI may fill [PENDING REVIEW] placeholders with plausible but incorrect values — a URL that looks like a Vault URL but is not the organization's actual Vault instance. The walkthrough catches these fabrications.

### 5.5 When to Use This Pattern

- Converting tribal knowledge into documented SOPs for the first time
- Documenting processes that exist only in SME memory
- Structuring informal documentation (wiki pages, runbook fragments) into formal SOP format
- Producing first drafts for processes described in incident post-mortems

### 5.6 When NOT to Use This Pattern

- Security-critical procedures (incident response, evidence handling) where missing or incorrect steps have immediate operational consequences — these must be authored by the SME directly
- Procedures involving classified or restricted information where the AI tool's data handling policies are a concern
- Procedures that are already well-documented and need updating rather than initial drafting

---

## 6. Pattern 4: Drift Detection Augmentation

### 6.1 Pattern Definition

Drift detection augmentation uses AI to enhance the automated drift detection capabilities defined in M3 Section 8. Standard drift detection identifies broken code references (renamed functions, moved files, changed API endpoints). AI-augmented drift detection goes further: it identifies semantic drift — documentation that references the correct code but describes outdated behavior.

### 6.2 Mechanism

The AI tool receives two inputs:

1. **The documentation file** being checked
2. **The Git diff** of the referenced code since the documentation was last updated

The AI analyzes the diff and determines whether the code changes affect the accuracy of the documentation. Not all code changes require documentation updates — a refactoring that changes internal variable names but preserves the same behavior does not invalidate the documentation. A change that alters the function's return type, default parameter values, or error conditions does.

### 6.3 Concrete Example

**Documentation being checked:**

> "The `provision_emergency_access` function creates a temporary account valid for 8 hours by default."

**Code diff since documentation was last updated:**

```diff
 def provision_emergency_access(
     requestor_id: str,
     ticket_number: str,
     permission_set: str = "emergency-read-only",
-    duration_hours: int = 8,
+    duration_hours: int = 4,
 ) -> EmergencyAccessResult:
```

**AI drift detection output:**

```
DRIFT DETECTED: docs/procedures/emergency-access.md
  Line 47: "valid for 8 hours by default"
  Code change: duration_hours default changed from 8 to 4
  Impact: Documentation states incorrect default duration
  Recommendation: Update "8 hours" to "4 hours" in line 47
  Confidence: HIGH (direct parameter default change)
```

### 6.4 Guardrail: CI/CD Threshold Configuration

**Guardrail specification:**

| Aspect | Requirement |
|--------|-------------|
| **Detection threshold** | AI drift detection must classify each finding as HIGH, MEDIUM, or LOW confidence. Only HIGH confidence findings block PRs. MEDIUM findings are reported as PR comments. LOW findings are logged but not surfaced |
| **False positive management** | The drift detection configuration (`.drift-config.yaml` from M3) includes an `ai_drift` section with per-file exemption lists for known false positive patterns |
| **Human override** | Engineers can dismiss AI drift findings with a documented reason in the PR review. Dismissals are tracked in the drift detection metrics |
| **Threshold tuning** | The Documentation Program Manager reviews false positive rates monthly and adjusts AI drift confidence thresholds. Target: false positive rate below 15% |
| **Pipeline integration** | AI drift detection runs as an additional step after the standard drift detection in the M3 pipeline. It does not replace standard drift detection — it augments it |
| **Labeling requirement** | AI drift findings are labeled `[AI-DETECTED]` in PR comments to distinguish them from rule-based drift findings |

**What the guardrail catches:**

Standard drift detection catches structural drift: renamed functions, moved files, deleted code. AI drift detection catches semantic drift: changed default values, altered behavior, modified error conditions, updated return types. The combination provides comprehensive drift coverage.

The threshold configuration prevents AI drift detection from becoming a bottleneck. Without thresholds, every code change would generate drift findings — most of them false positives for internal refactoring that does not affect documented behavior. The HIGH/MEDIUM/LOW classification allows the pipeline to be aggressive about catching real drift while being lenient about internal changes.

### 6.5 When to Use This Pattern

- Augmenting the drift detection pipeline defined in M3 Section 8
- Codebases with high change velocity where manual drift review cannot keep pace
- Documentation that references behavioral contracts (defaults, error handling, state machines) rather than just structural code references

### 6.6 When NOT to Use This Pattern

- Codebases where the AI tool does not have access to the full codebase context (partial repository checkouts, monorepo subsets)
- Documentation with no code references (policy documents, organizational guidelines)
- Environments where the AI tool's API calls during CI/CD create latency or cost concerns that outweigh the drift detection value

---

## 7. Pattern 5: Audience Adaptation

### 7.1 Pattern Definition

Audience adaptation uses AI to rewrite existing documentation for a different audience persona. A procedure written for senior engineers is adapted for new hires by expanding acronyms, adding prerequisite explanations, and linking to glossary definitions. A policy document written for compliance auditors is adapted for operations staff by extracting the operational obligations and presenting them as actionable requirements.

This pattern implements the multi-audience content strategy defined in M1 Section 5.2, using AI to reduce the manual effort of producing persona-specific variants.

### 7.2 Mechanism

The AI tool receives:

1. **The source document** (the canonical version)
2. **The target persona definition** (from the schema's `audience_personas`)
3. **Adaptation instructions** (what to expand, simplify, add, or remove)

The AI produces a persona-specific variant of the document. The canonical version remains the version of record; the adapted version is a derived artifact that links back to the canonical source.

### 7.3 Concrete Example

**Source document (senior engineer audience):**

> "The RBAC policy engine evaluates access requests against the intersection of the user's role assignments and the resource's permission boundary. Requests that fall outside the boundary return a 403 with a `policy_denied` error code. The evaluation is memoized per session with a 15-minute TTL."

**AI-adapted version (new hire audience):**

> "When you try to access a resource, the system checks whether your assigned role gives you permission for that specific resource. If your role does not include the required permission, you receive an 'Access Denied' error (HTTP status 403 with the code `policy_denied`). The system caches your permission results for 15 minutes per login session, so if your permissions are updated, you may need to wait up to 15 minutes or log out and back in for the changes to take effect.
>
> **Key terms:**
> - **RBAC (Role-Based Access Control):** A method of restricting access based on the roles assigned to users. See the [Glossary](glossary.md#rbac) for the full definition.
> - **Permission boundary:** The set of permissions that apply to a specific resource. Your role must intersect with this boundary for access to be granted."

### 7.4 Guardrail: Human Review for Tone and Completeness

**Guardrail specification:**

| Aspect | Requirement |
|--------|-------------|
| **Review trigger** | Every AI-adapted document must be reviewed by someone familiar with the target audience |
| **Tone review** | Does the adapted document match the target persona's reading mode? A new-hire document should not assume organizational context. A senior-engineer document should not over-explain fundamentals |
| **Completeness review** | Did the adaptation preserve all critical information from the source document? Simplification must not remove obligations, constraints, or security-relevant details |
| **Accuracy review** | Did the adaptation introduce any inaccuracies? AI sometimes simplifies by making incorrect generalizations ("you may need to wait up to 15 minutes" when the actual behavior is "exactly 15 minutes, no variability") |
| **Canonical link check** | The adapted document must contain a link to the canonical source document and a note indicating it is a derived variant |
| **Labeling requirement** | AI-adapted documents carry [PENDING REVIEW] and [ADAPTED FROM: source-doc-id] labels |
| **Pipeline integration** | Adapted documents are stored in audience-specific directories (`docs/new-hire/`, `docs/ops/`). When the canonical source document changes, the pipeline flags all adapted variants for re-adaptation |

**What the guardrail catches:**

AI audience adaptation has two primary failure modes:

1. **Over-simplification.** The AI removes a security constraint because it seems like a "detail" rather than a "core concept." The review catches missing obligations.

2. **Tone mismatch.** The AI adds condescending explanations ("As you may know...") or fails to match the direct, step-by-step tone expected by operations staff. The review catches tonal failures.

### 7.5 When to Use This Pattern

- Producing new-hire onboarding variants of existing operational documentation
- Creating executive summaries of technical policy documents for product managers
- Adapting audit-focused documentation for operations staff who need actionable obligations
- Generating simplified versions of complex architectural documentation

### 7.6 When NOT to Use This Pattern

- Adapting security policy documents where every word has been legally reviewed — paraphrasing may alter legal meaning
- Creating compliance-facing document variants where the adapted version might be presented to auditors (auditors should see the canonical version)
- Adapting documents where the source material is already outdated (adaptation amplifies existing drift)

---

## 8. Pattern 6: Gap Analysis

### 8.1 Pattern Definition

Gap analysis uses AI to identify undocumented code paths, uncovered API endpoints, missing procedure documents, and documentation blind spots. The AI scans the codebase and the documentation corpus, compares them, and produces a gap report identifying what exists in code but has no corresponding documentation.

### 8.2 Mechanism

The AI tool performs two scans:

1. **Codebase scan:** Identifies all public functions, classes, API endpoints, configuration parameters, CLI commands, database tables, and event handlers
2. **Documentation corpus scan:** Identifies all documented entities (functions, endpoints, parameters, commands, tables) by parsing documentation files

The AI compares the two inventories and produces a gap report listing entities that exist in code but have no documentation, entities documented but no longer in code (reverse drift), and entities with partial documentation (documented but missing required sections per M1 templates).

### 8.3 Concrete Example

**Gap analysis report (output):**

```
DOCUMENTATION GAP ANALYSIS REPORT
Generated: 2026-04-05
Scope: src/ directory + docs/ directory

═══ UNDOCUMENTED PUBLIC API ENDPOINTS ═══
  POST /api/v2/tokens/rotate     — No documentation found
  DELETE /api/v2/sessions/{id}    — No documentation found
  GET /api/v2/audit/export        — No documentation found

═══ UNDOCUMENTED PUBLIC FUNCTIONS ═══
  src/auth/mfa.py:
    verify_backup_code()          — No docstring
    reset_mfa_enrollment()        — No docstring
  src/provisioning/bulk.py:
    bulk_provision_accounts()     — No docstring, no procedure doc

═══ DOCUMENTED BUT REMOVED (REVERSE DRIFT) ═══
  docs/api/v1-tokens.md           — References /api/v1/tokens/*
                                     (v1 API removed in commit abc123)

═══ PARTIAL DOCUMENTATION ═══
  docs/procedures/backup.md       — Missing: Troubleshooting section,
                                     Quality Checks section
  docs/procedures/deploy-prod.md  — Missing: Prerequisites section

═══ SUMMARY ═══
  Undocumented endpoints:   3
  Undocumented functions:   3
  Reverse drift (stale):    1
  Partial documentation:    2
  Total gaps:               9
```

### 8.4 Guardrail: Manual Verification of Identified Gaps

**Guardrail specification:**

| Aspect | Requirement |
|--------|-------------|
| **Review trigger** | Every AI-generated gap report must be reviewed by the Documentation Program Manager or designated representative before gaps are assigned for remediation |
| **Verification method** | Each identified gap is verified manually: (1) confirm the code entity exists and is intended to be public, (2) confirm no documentation exists elsewhere (the AI may miss documentation in non-standard locations), (3) confirm the gap is material (internal utility functions may not require documentation) |
| **False positive handling** | Gaps that are verified as false positives (internal functions, deprecated-but-retained code, documentation in non-standard locations) are added to an exemption list in the gap analysis configuration |
| **Prioritization** | Verified gaps are prioritized using the MCR/DSR framework from M4 Section 4: gaps in compliance-required documentation (MCR) are remediated before gaps in optional documentation (DSR) |
| **Labeling requirement** | Gap reports carry [AI-GENERATED] label. Individual gap entries carry [VERIFIED] or [UNVERIFIED] status after manual review |
| **Pipeline integration** | Gap analysis runs weekly as a scheduled CI job. Reports are published to the documentation quality dashboard defined in M3 Section 9 |

**What the guardrail catches:**

AI gap analysis has a significant false positive rate for two reasons:

1. **Internal vs. public distinction.** The AI may flag internal helper functions as undocumented when they are intentionally undocumented. Not every function requires documentation — only public-facing, externally-consumed, or operationally-significant functions do.

2. **Non-standard documentation locations.** Documentation may exist in architecture decision records, wiki pages, or inline README files that the AI's documentation corpus scan did not cover. The manual verification step catches documentation that exists outside the scanned corpus.

### 8.5 When to Use This Pattern

- Baseline assessment of documentation completeness when establishing a new documentation program
- Periodic documentation health audits (quarterly or after major releases)
- Identifying documentation gaps after a large codebase migration or refactoring
- Producing evidence of documentation coverage for compliance audits

### 8.6 When NOT to Use This Pattern

- As the sole mechanism for identifying documentation needs (gap analysis misses conceptual documentation needs, architectural documentation, and process documentation that has no direct code counterpart)
- In codebases where the public/internal boundary is not well-defined (the false positive rate will be too high to be useful)

---

## 9. Failure Mode Analysis

AI-generated documentation introduces failure modes that do not exist in purely human-authored documentation. Understanding these failure modes is essential for designing effective guardrails and review gates. The five failure modes below are derived from the research cited in Section 2 and from operational experience with AI documentation tools.

### 9.1 Failure Mode 1: "Correct but Useless" Generation

**Description:** The AI produces documentation that is technically accurate but provides no information the reader could not trivially derive from reading the code. A docstring that says "This function takes a string and returns a boolean" for a function named `is_valid_email(email: str) -> bool` is correct but useless — the function signature already communicates that information.

**Root cause:** AI models are trained to produce text that matches the pattern of existing documentation. Much existing documentation is "correct but useless" — function descriptions that restate the function name in prose. The AI reproduces this pattern faithfully.

**Impact:** "Correct but useless" documentation creates an illusion of coverage without providing value. It inflates documentation coverage metrics (100% of functions have docstrings!) while providing zero operational benefit.

**Mitigation:**

- **Prompt engineering:** AI generation prompts should explicitly require descriptions of purpose, constraints, and non-obvious behavior rather than parameter type restatement
- **Review gate:** Reviewers should be trained to reject docstrings that add no information beyond the function signature
- **Quality metric:** Track "information density" — the ratio of non-obvious information in documentation to total documentation volume. Declining information density indicates "correct but useless" generation

### 9.2 Failure Mode 2: Missing Context

**Description:** The AI generates documentation that is accurate about what the code does but misses organizational, operational, or historical context that is essential for the reader. A procedure for rotating database credentials may be technically correct but miss the context that rotations should not be performed during the weekly batch processing window (Tuesday 02:00–06:00 UTC).

**Root cause:** AI models have access to the code and the prompt but not to the organization's operational context, historical incidents, or tribal knowledge. Context that lives in people's heads, Slack channels, or incident post-mortems is invisible to the AI.

**Impact:** Documentation that lacks operational context is dangerous in proportion to its technical accuracy. A reader trusts the documentation because the technical steps are correct, then encounters the missing operational constraint (batch processing window) at runtime.

**Mitigation:**

- **Context injection:** Include operational context in AI generation prompts: "This procedure must not be performed during the batch processing window (Tuesday 02:00–06:00 UTC)"
- **SME review mandate:** All AI-generated operational documentation must be reviewed by an SME who actively performs the task. The SME's review specifically looks for missing context
- **Incident cross-reference:** AI generation prompts should include references to related incident post-mortems so the AI can incorporate lessons learned

### 9.3 Failure Mode 3: Hallucinated Accuracy

**Description:** The AI generates documentation that states specific, detailed facts that are plausible but fabricated. A generated API reference document might state "Rate limit: 100 requests per second per API key" when no rate limit is configured, or "Supported formats: JSON, XML, CSV" when only JSON is supported.

**Root cause:** AI models fill gaps in their input with plausible content. When the source specification does not mention a rate limit, the AI may generate one based on training data from other API documentation. This behavior is indistinguishable from accurate generation to a reader who does not independently verify the claim.

**Impact:** Hallucinated accuracy is the highest-risk failure mode because it is the hardest to detect. A reader who trusts a hallucinated rate limit will design their application to stay under that limit — and the application will work correctly until the actual (unconfigured) system behavior changes.

**Mitigation:**

- **Source validation:** AI-generated reference documentation must be validated against the source specification (Pattern 2 guardrail). Any claim in the documentation that does not have a corresponding element in the source specification is flagged for review
- **Confidence marking:** AI generation should mark statements that are inferred (not directly stated in the source) with [INFERRED] tags. Human reviewers verify or remove inferred statements
- **Automated fact checking:** For API documentation, CI pipeline should include automated tests that compare documented behavior to actual behavior in staging
- **Training and awareness:** Reviewers must be explicitly trained that AI-generated text can contain fabricated specifics. The review mindset should be "verify every specific claim" rather than "scan for obvious errors"

### 9.4 Failure Mode 4: Documentation Debt Acceleration

**Description:** The speed of AI documentation generation creates a new form of technical debt: a large volume of AI-generated documentation that was published with minimal review and is now outdated but still authoritative. The 59% cycle time reduction reported by IBM [ibm-2026] applies to initial generation — but maintenance burden scales with documentation volume, not generation speed.

**Root cause:** AI lowers the cost of creating documentation but does not lower the cost of maintaining it. An organization that uses AI to generate documentation for every function, endpoint, and configuration parameter now has a maintenance obligation for every generated document. When the underlying code changes, every generated document must be updated — and the update cost is the same whether the document was originally written by a human or by AI.

**Impact:** Documentation debt acceleration manifests as declining documentation currency rates over time. The documentation coverage metric looks healthy (everything is documented!) but the drift detection metric deteriorates (an increasing percentage of documentation is stale).

**Mitigation:**

- **Selective generation:** Do not generate documentation for every entity. Use the gap analysis pattern (Pattern 6) to identify high-value documentation targets and generate documentation only for those
- **Maintenance budget:** For every AI-generated document, budget maintenance effort. A rule of thumb: if the underlying code changes monthly, the documentation maintenance cost is approximately 20% of the original authoring cost per change cycle
- **Drift detection integration:** All AI-generated documentation must be registered with the drift detection system (M3 Section 8). If a generated document cannot be tracked for drift, it should not be generated
- **Deprecation pipeline:** Establish a process for retiring AI-generated documentation that has accumulated more maintenance cost than value

### 9.5 Failure Mode 5: Stale AI Confidence

**Description:** Reviewers develop over-confidence in AI-generated documentation over time. Initial reviews are thorough because the technology is new. After six months of AI-generated documentation that is mostly correct, reviewers begin approving AI-generated PRs with less scrutiny. The error rate remains constant — but the catch rate declines.

**Root cause:** Human cognitive bias: automation complacency. The same bias that causes airline pilots to over-trust autopilot systems causes documentation reviewers to over-trust AI generation.

**Impact:** Stale AI confidence results in a gradual degradation of documentation quality that is invisible in short-term metrics. Monthly quality dashboards show stable review pass rates, but the review is becoming less rigorous. Errors that would have been caught in month one pass through in month six.

**Mitigation:**

- **Seeded errors:** Periodically inject known errors into AI-generated documentation and track whether reviewers catch them. A declining catch rate indicates stale AI confidence
- **Review rotation:** Rotate documentation reviewers so that no single reviewer becomes the habitual approver of AI-generated documentation for a given domain
- **Audit sampling:** The Documentation Program Manager randomly samples merged AI-generated documentation quarterly and re-reviews it for accuracy. Errors found in the re-review indicate a review quality problem
- **Explicit review checklists:** Provide reviewers with a checklist specific to AI-generated documentation (distinct from the general documentation review checklist). The checklist forces the reviewer to verify specific claims rather than performing a general scan

---

## 10. Decision Framework: AI vs Human Authorship

### 10.1 The Decision Matrix

Not all document types benefit equally from AI generation. The following matrix defines when AI should generate first drafts, when humans must author from scratch, and when hybrid approaches are appropriate.

**Classification criteria:**

- **Structural regularity:** How predictable is the document's structure? API references are highly regular; architecture decision records are irregular.
- **Factual density:** How many verifiable facts does the document contain? Parameter tables are highly factual; design rationale is interpretive.
- **Organizational context dependency:** How much organizational context is needed? SOPs for organization-specific processes are highly context-dependent; generic API references are not.
- **Compliance sensitivity:** Is the document subject to regulatory review? Security policies are compliance-sensitive; internal READMEs are not.
- **Consequence of error:** What happens if the document is wrong? Incident response procedures have high consequences; glossary entries have low consequences.

### 10.2 Decision Matrix Table

| Document Type | Structural Regularity | Factual Density | Context Dependency | Compliance Sensitivity | Consequence of Error | AI Authorship Recommendation |
|---|---|---|---|---|---|---|
| **API reference** | High | High | Low | Low | Medium | **AI generates.** Human validates against actual behavior. Pattern 2. |
| **Docstrings/inline docs** | High | High | Low | Low | Low | **AI generates.** Code author reviews at commit time. Pattern 1. |
| **Configuration reference** | High | High | Low | Low | Medium | **AI generates.** Validate against schema. Pattern 2. |
| **SOP first draft** | Medium | Medium | High | Medium | Medium | **AI drafts, human completes.** SME walkthrough required. Pattern 3. |
| **Onboarding guides** | Medium | Medium | High | Low | Low | **AI adapts from existing docs.** Pattern 5. Review for completeness. |
| **Gap analysis reports** | High | High | Low | Low | Low | **AI generates.** Human verifies gaps. Pattern 6. |
| **Security policies** | Low | Low | High | High | High | **Human authors.** AI may assist with formatting only. |
| **Architecture decision records** | Low | Low | High | Medium | High | **Human authors.** AI cannot infer design rationale. |
| **Incident response procedures** | Medium | Medium | High | High | High | **Human authors.** AI may generate template structure only. |
| **Compliance evidence documentation** | Medium | High | High | High | High | **Human authors.** AI may pre-populate metadata fields. |
| **Risk assessment narratives** | Low | Medium | High | High | High | **Human authors.** Requires judgment that AI cannot provide. |
| **Meeting notes / decision logs** | Low | Low | High | Low | Low | **AI transcribes and structures.** Human verifies decisions. |
| **Release notes** | Medium | High | Medium | Low | Low | **AI generates from git history.** Human reviews for accuracy and tone. |
| **Glossary entries** | High | High | Medium | Low | Low | **AI generates.** Human verifies definitions match organizational usage. |

### 10.3 Decision Flow

For any documentation task, apply the following decision flow:

```
START: New documentation needed

1. Is the document compliance-sensitive (policies, standards,
   control documentation, compliance evidence)?
   ├── YES → Human authors. AI may assist with formatting/template
   │         population only.
   └── NO → Continue.

2. Is the consequence of error HIGH (incident response,
   security procedures, production runbooks)?
   ├── YES → Human authors. AI may generate first draft for
   │         structural guidance only; SME rewrites entirely.
   └── NO → Continue.

3. Is the document structurally regular AND factually dense
   (API reference, config reference, parameter tables)?
   ├── YES → AI generates. Human validates against source
   │         specification. Pattern 2.
   └── NO → Continue.

4. Does the document require significant organizational context
   (SOPs, operational procedures)?
   ├── YES → AI drafts from provided context. SME completes
   │         and validates. Pattern 3.
   └── NO → Continue.

5. Is the document an adaptation of existing documentation
   for a different audience?
   ├── YES → AI adapts. Human reviews for tone and completeness.
   │         Pattern 5.
   └── NO → Default to human authorship with AI formatting assistance.
```

---

## 11. Review Gate Design

### 11.1 Review Gate Architecture

AI-generated documentation requires a review gate between generation and publication. The review gate is not a single checkpoint — it is a layered system that applies different levels of scrutiny based on document type and risk level.

### 11.2 Three-Tier Review Gate Model

**Tier 1: Automated Validation (all AI-generated documentation)**

Automated checks that run in the CI pipeline immediately after AI generation:

- Structural validation: does the generated document match the required template (M1 Section 8.2)?
- Metadata completeness: are all required frontmatter fields populated?
- Safety rule compliance: SC-01 (no PII), SC-02 (no security-sensitive content), SC-03 (citations present), SC-04 ([PENDING REVIEW] label present)?
- Link validation: do all internal and external links resolve?
- Terminology consistency: does the document use terms consistent with the organizational glossary?
- Drift detection registration: is the document registered for drift tracking?

**Tier 2: SME Technical Review (all AI-generated documentation)**

Human review focused on technical accuracy:

- Factual accuracy: are all stated facts correct?
- Completeness: are all required topics covered?
- Missing context: is there organizational context that the AI could not know?
- Hallucination check: are there specific claims that cannot be verified against source material?

Tier 2 review is performed by a subject matter expert for the document's domain. The reviewer must be someone who could identify an incorrect claim in the document.

**Tier 3: Compliance and Governance Review (compliance-sensitive documents only)**

Additional review for documents that map to compliance framework requirements:

- Framework alignment: does the document satisfy the framework requirements referenced in its frontmatter?
- Approval block: is the approval block properly signed?
- Regulatory language: does the document use correct regulatory terminology (must/shall/should per M1 Section 6)?
- Evidence trail: is the review itself documented as compliance evidence?

### 11.3 Review Gate Enforcement

Review gates are enforced through the docs-as-code pipeline (M3):

- **Branch protection rules** require Tier 1 automated checks to pass before PR can be opened for review
- **CODEOWNERS file** assigns Tier 2 reviewers based on document type and directory
- **PR labels** (`ai-generated`, `compliance-sensitive`) trigger appropriate review requirements
- **Merge requirements** enforce that all required review approvals are present before merge

### 11.4 Review Checklist for AI-Generated Documentation

Reviewers of AI-generated documentation should verify:

- [ ] Every specific claim (numbers, defaults, error codes, URLs) has been verified against the source
- [ ] No organizational context is missing (operational windows, team ownership, escalation contacts)
- [ ] No security-sensitive information has been included that should not be in this document
- [ ] The document does not hallucinate capabilities, limitations, or constraints that do not exist
- [ ] The document adds information beyond what the code or specification already communicates
- [ ] The [PENDING REVIEW] label has been removed only after all checks pass
- [ ] The document has been registered with drift detection

---

## 12. Integration with Docs-as-Code Pipeline

### 12.1 Pipeline Extension for AI Generation

The AI documentation patterns integrate into the docs-as-code pipeline defined in M3 as additional stages. The extended pipeline:

```
AUTHORING PHASE (extended)
──────────────────────────
┌────────────┐     ┌────────────────┐     ┌──────────────┐
│  Code      │────▶│  AI Generation │────▶│  Author      │
│  Change    │     │  (Patterns     │     │  Review +    │
│  (trigger) │     │   1,2,4,6)     │     │  Edit        │
└────────────┘     └────────────────┘     └──────────────┘
                                                │
                                                ▼
                          Standard pipeline continues
                          (lint → spell → link → build →
                           drift → review → deploy)
```

### 12.2 AI Generation Configuration

```yaml
# .ai-docs-config.yaml
version: 1

generation:
  inline:
    enabled: true
    trigger: pre-commit
    scope: "src/**/*.py"
    template: docstring
    require_author_review: true

  reference:
    enabled: true
    trigger: on-spec-change
    specs:
      - path: "api/openapi.yaml"
        output: "docs/api/reference/"
        template: api-reference
      - path: "config/schema.json"
        output: "docs/config/reference/"
        template: config-reference
    require_staging_validation: true

  drift_augmentation:
    enabled: true
    trigger: on-pr
    confidence_threshold: HIGH
    merge_blocking: true

  gap_analysis:
    enabled: true
    trigger: weekly
    scope:
      code: "src/"
      docs: "docs/"
    output: "reports/gap-analysis.json"

labeling:
  pending_review: "[PENDING REVIEW]"
  ai_generated: "[AI-GENERATED]"
  ai_detected: "[AI-DETECTED]"
  adapted_from: "[ADAPTED FROM: {source_id}]"

review_gates:
  tier_1:
    automated: true
    checks:
      - structure_validation
      - metadata_completeness
      - safety_rules
      - link_validation
      - terminology_consistency
  tier_2:
    required_for: all
    reviewer_assignment: codeowners
  tier_3:
    required_for: compliance-sensitive
    reviewer_assignment: compliance-team
```

### 12.3 Metrics Extension

The following metrics are added to the quality metrics dashboard (M3 Section 9) for AI documentation tracking:

| Metric | Description | Target |
|--------|-------------|--------|
| AI-generated document count | Total documents generated by AI patterns | Tracked, no target |
| AI-generated review pass rate | % of AI-generated documents passing Tier 2 review on first submission | > 70% |
| AI drift detection accuracy | % of AI drift findings confirmed as true positives | > 85% |
| AI gap analysis false positive rate | % of gaps identified that are false positives on manual review | < 15% |
| Hallucination detection rate | % of AI-generated documents where reviewers find fabricated claims | < 10% |
| AI-generated documentation currency | % of AI-generated documents current (within review cadence) | > 95% |
| Mean time to review (AI-generated) | Average time from AI generation to Tier 2 review completion | < 3 business days |

---

## 13. AI Content Labeling Standard

### 13.1 Labeling Requirements

All AI-generated or AI-adapted documentation content must be labeled to enable:

1. **Review tracking:** Distinguishing content that has passed human review from content that has not
2. **Audit trail:** Demonstrating to compliance auditors that AI-generated content was reviewed before publication
3. **Maintenance planning:** Identifying AI-generated content that may have higher drift risk
4. **Reader awareness:** Allowing readers to understand the provenance of the documentation they are reading

### 13.2 Label Definitions

| Label | Placement | Meaning | Removal Condition |
|-------|-----------|---------|-------------------|
| `[PENDING REVIEW]` | Document header and each AI-generated section | Content has been generated by AI and has not yet passed human review | Removed by human reviewer after Tier 2 review approval |
| `[AI-GENERATED]` | Document header | The entire document was generated by an AI pattern | Permanent — never removed. Indicates provenance, not review status |
| `[AI-ASSISTED]` | Document header | The document was initially drafted by AI and substantially edited by a human | Applied when human edits exceed 30% of the AI-generated content |
| `[ADAPTED FROM: {id}]` | Document header | The document is an audience-adapted variant of the referenced canonical document | Permanent — maintains link to canonical source |
| `[AI-DETECTED]` | Inline (PR comment) | A drift finding was identified by AI rather than rule-based detection | Removed when the finding is resolved or dismissed |
| `[INFERRED]` | Inline (within document body) | A specific claim was inferred by the AI rather than directly derived from the source | Removed when a human verifies or replaces the inferred claim |

### 13.3 Labeling in Document Frontmatter

```yaml
---
id: PRC-OPS-0112
title: "Database Credential Rotation Procedure"
type: procedure
owner: Database Operations Lead
lifecycle_state: Published
ai_provenance:
  generation_pattern: sop-first-draft
  generation_date: "2026-04-01"
  source_material: "SME interview transcript, existing wiki page"
  review_status: reviewed
  reviewer: "Database Operations SME"
  review_date: "2026-04-03"
---
```

The `ai_provenance` block is an extension to the standard document metadata schema defined in the mission schema. It provides machine-readable provenance information for AI-generated and AI-adapted documents. This block is optional for human-authored documents and required for all AI-generated and AI-adapted documents.

---

## 14. Source Index and Citations

[dora-2025] Google Cloud, "DORA 2025: State of AI-Assisted Software Development," 2025. Google Cloud DevOps Research and Assessment.

[stackoverflow-2025] Stack Overflow, "2025 Developer Survey," 2025. Stack Overflow Inc.

[ibm-2026] IBM Think, "AI Code Documentation: Benefits and Top Tips," March 2026. IBM Corporation.

[nist-800-53] NIST SP 800-53 Revision 5, "Security and Privacy Controls for Information Systems and Organizations," September 2020. National Institute of Standards and Technology.

[nist-800-100] NIST SP 800-100, "Information Security Handbook: A Guide for Managers," October 2006. National Institute of Standards and Technology.

[nist-ai-rmf] NIST, "Artificial Intelligence Risk Management Framework (AI RMF 1.0)," January 2023. National Institute of Standards and Technology.

[iso-27001] ISO/IEC 27001:2022, "Information Security, Cybersecurity and Privacy Protection — Information Security Management Systems — Requirements," October 2022. International Organization for Standardization.

[paligo-2025] Paligo, "The Essential Guide to Effective Technical Documentation," October 2025. Paligo AB.

[overcast-2026] Overcast Blog, "AI-Driven Documentation in 2026," November 2025. Overcast.

[scf] Secure Controls Framework Council, "Policy vs Standard vs Procedure," Secure Controls Framework. Available at securecontrolsframework.com.

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-05 | Documentation Engineering | Initial publication |
