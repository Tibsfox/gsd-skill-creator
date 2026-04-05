# Module 3: Policy Architecture and Governance

**Mission:** Engineering the Process — Standard Operating Procedures  
**Module:** M3 — Policy Architecture and Governance  
**Track:** 1B (parallel with M4)  
**Produced by:** EXEC_B  
**Date:** 2026-04-05  
**Word target:** 7,000–9,000  

---

## Table of Contents

1. [SOP Lifecycle Stages](#1-sop-lifecycle-stages)
2. [Policy Hierarchy Design](#2-policy-hierarchy-design)
3. [Version Control for Procedural Documents](#3-version-control-for-procedural-documents)
4. [Role-Based Access and Approval Workflows](#4-role-based-access-and-approval-workflows)
5. [Governance Failure Modes](#5-governance-failure-modes)
6. [Change Control as Engineering Discipline](#6-change-control-as-engineering-discipline)
7. [Governance in Practice: Case Studies](#7-governance-in-practice-case-studies)
8. [References](#8-references)

---

## 1. SOP Lifecycle Stages

### 1.1 Overview

An SOP does not exist in a static state. From the moment a need for a new procedure is identified through the point at which the procedure is retired, it passes through a defined sequence of stages, each with its own entry conditions, activities, roles, and exit gates. Treating this lifecycle as informal — letting SOPs drift from draft to "live" without clear gatekeeping — is one of the most common and consequential governance failures in engineering organizations.

The lifecycle defined here draws from ISO/IEC/IEEE 12207:2017 configuration management and process control clauses, NASA SPAN (Software Processes Across NASA) governance requirements, IEEE Std 1028 review process definitions, and practitioner guidance from Tractian (2026) and TechnicalWriterHQ (2026).

```
[DRAFT] → [REVIEW] → [APPROVE] → [PUBLISH] → [TRAIN]
                                                    │
                                                    ▼
[ARCHIVE] ← [RETIRE] ← [REVISE] ← [IMPLEMENT] ←──┘
                          │
                          └──► Back to [REVIEW] if changes needed
```

The loop is intentional. A live SOP is never done — it is either valid, under revision, or retired.

---

### Stage 1: DRAFT

**Entry criteria**

- A gap in current process coverage has been identified, OR
- A review trigger has fired against an existing SOP (see Section 1.2), requiring a new version, OR
- A new tool, technology, or regulatory requirement makes a fresh document necessary.
- An Author has been assigned with appropriate subject-matter expertise.
- The SOP's scope has been defined at least in outline — the document is bounded before drafting begins.

**Activities**

- Author establishes document header: title, unique identifier, version (start at `0.1.0`), owner, target audience, scope statement.
- Research phase: identify source documents, regulatory requirements, and referenced procedures.
- First structural pass: populate all eight canonical sections (Purpose, Scope, References, Definitions, Roles & Responsibilities, Procedure, Quality Checks, Records / Success Criteria).
- Internal self-review by Author against a checklist: Are all steps numbered? Is each step actionable? Are decision points explicit? Are success criteria measurable?
- Placeholder flags inserted for sections requiring subject-matter verification that the author cannot self-certify.

**Exit criteria**

- All eight canonical sections are populated (no blank sections — placeholders with explanatory flags are acceptable).
- Document passes a basic usability test: a teammate unfamiliar with the procedure can read the Procedure section and identify the first three steps without asking questions.
- Author has signed the document header indicating draft completion.

**Roles involved**

- Author (primary)
- Team Lead (scope authorization)

**Artifacts produced**

- Draft SOP document (version `0.x.0`)
- Author sign-off record in document header

---

### Stage 2: REVIEW

**Entry criteria**

- Draft has exited the DRAFT stage per exit criteria above.
- At least one Reviewer has been assigned who did not write the document.
- For high-criticality SOPs (safety, regulatory compliance, security): a second Reviewer is required, at least one of whom is an end-user (operator) of the procedure.

**Activities**

- Technical review: Reviewer verifies factual accuracy of each procedure step. Steps are tested, not just read — if the procedure can be executed in a lab or staging environment, it should be.
- Completeness review: gaps in scope, missing edge-case handling, ambiguous decision points, undefined terms.
- Usability review: Can a new practitioner at the target skill level execute the procedure without interruption? Flag any step requiring knowledge not captured in the document.
- Cross-reference review: Do all referenced documents exist? Are version numbers pinned?
- Regulatory/compliance review (where applicable): Does the procedure satisfy all normative requirements imposed by governing standards?
- Reviewer produces written comments referencing specific section numbers. General impressions are not sufficient — each comment must identify what is wrong and propose or request a fix.
- Author responds to each comment: accepts, revises, or rebuts with justification.

**Exit criteria**

- All Reviewer comments have a documented disposition (accepted / revised / rebutted-with-rationale).
- No open blocking issues remain (issues classified as blocking prevent exit; advisory issues may carry forward with tracking IDs).
- If substantial changes were made during review, a second review pass is required before proceeding.

**Roles involved**

- Reviewer(s) (at least one not equal to Author)
- Author (responds to comments)
- Team Lead (escalation path for disputed items)

**Artifacts produced**

- Reviewed SOP with tracked changes or marked-up diff
- Review disposition log (per-comment record of resolution)
- Version bump: minor increment (e.g., `0.1.0` → `0.2.0`)

---

### Stage 3: APPROVE

**Entry criteria**

- Review stage completed with all blocking issues resolved.
- Review disposition log is complete and attached.
- Approver has not authored or technically reviewed the document (separation of duties).

**Activities**

- Approver reads the final reviewed draft in full.
- Approver verifies: Does this procedure align with organizational policy at the relevant hierarchy layer? (See Section 2.)
- Approver verifies: Is the RACI in section 5 complete and consistent with organizational structure?
- Approver verifies: Are the success criteria in section 8 measurable and auditable?
- Approver makes a binary decision: Approve (document may be published) or Return (with written rationale and specific required changes — the document returns to REVIEW, not DRAFT).

**Exit criteria**

- Approver signature recorded in document header with timestamp.
- Version number incremented to `1.0.0` upon first approval.
- Approved document placed in publication queue.

**Roles involved**

- Approver (Program Manager or above for organizational-layer SOPs; Tech Lead for team-layer SOPs)
- Author (notified; no action required unless Return decision)

**Artifacts produced**

- Approval record (signature, timestamp, version number)
- Final pre-publication document version (`1.0.0`)

---

### Stage 4: PUBLISH

**Entry criteria**

- Approval record exists.
- Target repository or document management system is designated and accessible.
- Distribution list confirmed: who needs to know this procedure exists.

**Activities**

- Document published to single canonical location (see Section 3 for single-source-of-truth requirements).
- Version `1.0.0` tagged as current. Previous drafts archived, not deleted.
- Access controls set: who can read, who can edit, who can approve.
- Notification sent to distribution list with direct link to canonical location — never as attachment.
- Search index updated so the document is discoverable.
- Review-due date set (default: 12 months from publication date, or earlier if a specific regulatory timeline applies).

**Exit criteria**

- Document is accessible to all parties listed in Scope / Roles sections.
- At least one tracking artifact confirms publication: release log entry, email notification with timestamp, or automated system confirmation.
- Review-due date is populated in the document header and in the document tracking system.

**Roles involved**

- Author (publication action)
- Document Manager / Repository Administrator (access control configuration)
- Team Lead (confirmation of distribution)

**Artifacts produced**

- Published SOP at canonical URL
- Publication notification record
- Review-due date entry in tracking system

---

### Stage 5: TRAIN

**Entry criteria**

- Document is in PUBLISH state.
- Affected roles identified: everyone who must execute, supervise, or audit the procedure.

**Activities**

- Training delivery: format depends on criticality and complexity. Options: walkthrough session (synchronous), recorded procedure demo, written self-study with acknowledgment form.
- Competency verification: for safety-critical procedures, training completion is not sufficient — operators must demonstrate competency (e.g., supervised first execution, written quiz, or observed simulation).
- Training records created: who trained, on which version, on what date, with what verification method.
- New employees: onboarding process for existing SOPs must include explicit assignment of which SOPs require training before independent operation.

**Exit criteria**

- All roles listed in Scope / Roles have completed required training.
- Training records exist for each role.
- For safety-critical SOPs: competency verification records exist separately from training completion records.

**Roles involved**

- Team Lead (training assignment)
- Author / Subject-Matter Expert (delivery or support)
- All procedure users (recipients)

**Artifacts produced**

- Training records (individual, dated, version-specific)
- Competency verification records (where applicable)

---

### Stage 6: IMPLEMENT

**Entry criteria**

- Training complete for all affected roles.
- Document in PUBLISH state.

**Activities**

- Operators execute the procedure in production.
- First-execution monitoring: for new procedures, supervisory review of first three to five real-world executions to catch execution gaps not visible in review.
- Deviation tracking: any deviation from the written procedure — intentional or not — is logged with context and outcome.
- Feedback collection: operators report ambiguities, missing steps, and procedural friction through a defined channel.

**Exit criteria**

- Procedure is actively in use.
- No procedure: operators returning to ad hoc methods signals an implementation failure requiring immediate escalation.

**Roles involved**

- Operators (executors)
- Team Lead (monitoring)
- Author (available for questions)

**Artifacts produced**

- Execution records (where required by compliance or audit)
- Deviation log
- Operator feedback queue

---

### Stage 7: REVISE

**Entry criteria**

- A review trigger has fired (see Section 1.2).
- New version initiated with incremented version number (patch, minor, or major depending on change scope — see Section 3).
- The existing published version remains active until the revised version completes APPROVE and is published.

**Activities**

- Author (original or newly assigned) creates new version, incorporating trigger-specific changes.
- Lifecycle re-enters at REVIEW stage.
- The path from REVISE to PUBLISH is identical to the original draft path, but the scope of review can be narrowed to sections affected by the revision (for patch-level changes). Major-version revisions require full re-review.

**Exit criteria**

- Revised version reaches PUBLISH state.
- Previous version archived with clearly marked supersession record.

**Roles involved**

- Author, Reviewer, Approver (same roles as initial lifecycle)

**Artifacts produced**

- New version of SOP
- Supersession record linking old version to new

---

### Stage 8: RETIRE

**Entry criteria**

- The procedure is no longer needed: the activity it governed has been discontinued, or a replacement procedure exists that fully supersedes it.
- Retirement decision made by Approver-equivalent role.

**Activities**

- Document marked RETIRED in header with retirement date and reason.
- Supersession reference added: if a replacement exists, link it.
- Distribution list notified.
- Document moved to archive — not deleted.

**Exit criteria**

- No active training links point to retired version as current.
- Archive contains the complete version history.

**Roles involved**

- Approver (retirement authorization)
- Document Manager (archive action)

**Artifacts produced**

- Retired document in archive
- Retirement record with date, reason, and supersession reference

---

### Stage 9: ARCHIVE

**Entry criteria**

- Document is in RETIRE state, OR older version superseded by a newer published version.

**Activities**

- Document retained in read-only state.
- Retained indefinitely unless a record-retention policy specifies a minimum period after which physical deletion is permissible.
- Access controlled: archive is readable by audit-authorized roles; not editable by anyone.

**Exit criteria**

- No exit from ARCHIVE to active lifecycle without Approver-authorized reinstatement (e.g., rollback scenario — see Section 6.4).

**Roles involved**

- Document Manager (custody)

**Artifacts produced**

- Immutable archived record

---

### 1.2 Review Triggers

Any one of the following conditions, occurring independently, is sufficient to initiate a REVISE cycle regardless of whether the annual review date has been reached.

| Trigger | Rationale |
|---------|-----------|
| Annual scheduled review | Prevents silent drift; ensures baseline currency |
| New tool or technology introduction | Procedure steps referencing replaced tooling become incorrect by definition |
| Regulatory or standards update | Compliance requirements supersede the existing document |
| Reported procedure failure or near-miss | Evidence that the written procedure produces incorrect outcomes; highest priority trigger |
| Organizational restructuring affecting roles | RACI sections reference positions that may no longer map to real people |
| Process performance metric degradation | KPIs tracking procedure outcomes signal that the current approach is producing suboptimal results |
| Operator feedback indicating ambiguity | Multiple operators asking the same question about the same step is a signal the step is underspecified |
| Dependent document change | If a referenced SOP is substantially revised, this document must be reviewed for consistency |

**Trigger escalation:** Procedure failure and near-miss triggers are the only ones with mandatory escalation requirements. These triggers must be logged to a permanent record and routed to the Approver within 48 hours, regardless of review-queue scheduling.

---

## 2. Policy Hierarchy Design

### 2.1 The Layered Architecture

Engineering organizations generate procedural artifacts at multiple levels of abstraction. Without a deliberate hierarchy, conflicts accumulate silently: a team-level runbook contradicts an organization-wide security policy; a project checklist requires a tool that the org-level approved-software list doesn't include; two teams implement the same interface in incompatible ways because there is no governing standard at the program layer.

The solution is a layered policy architecture modeled on the same inheritance principle that governs software layering. Lower layers inherit from higher layers and may be more restrictive, but may not contradict higher-layer requirements. Any lower-layer document that conflicts with a higher-layer requirement is invalid until the conflict is resolved — by changing the lower layer, escalating a change request to the higher layer, or obtaining a documented exception.

| Layer | Owner | Scope | Content |
|-------|-------|-------|---------|
| Organization | CTO / VP Engineering | All engineering teams | Baseline standards; regulatory compliance requirements; version control policy; approved tool lists; security baseline; incident classification |
| Program / Product | Program Manager | One product line or business unit | Product adaptations; release process cadence; review cadence specific to the product; customer-facing compliance requirements |
| Project / Team | Tech Lead | One team or sprint-cycle scope | Team workflows; sprint ceremonies; on-call runbooks; team-specific tooling; escalation paths |
| Task | Individual contributor | One person, one activity | Task checklists; step-by-step execution guides; personal reference material |

This four-layer structure maps directly to the hierarchy described by ISO/IEC/IEEE 12207:2017 in its organizational process management (clause 6.3) and project planning (clause 6.4) process descriptions, which distinguish enterprise-level policies from project instantiations of those policies.

---

### 2.2 Inheritance Rules

**Rule 1: Explicit inheritance declaration.** Every document below the Organization layer must declare its parent document. The header field `Governed by: [parent document ID]` makes the inheritance chain auditable.

**Rule 2: Restriction, not contradiction.** A lower-layer document may require stricter criteria than the layer above. It may not relax requirements established by a higher layer. Example: if Organization policy requires all code to be reviewed before merge, a team-level runbook may require two reviewers (stricter). It may not permit self-merge (contradiction).

**Rule 3: Gap filling.** A lower layer may define procedures for activities not covered by higher layers. This is the primary purpose of the Project/Team layer: filling operational gaps with team-specific procedures that are consistent with organizational guardrails but not explicitly derived from them.

**Rule 4: Conflict resolution.** When a conflict is identified between layers:
1. The conflict is logged as a defect against the lower-layer document.
2. If the lower-layer author believes the higher-layer policy is incorrect or outdated, they submit a change request to the higher-layer owner.
3. The lower-layer document is not valid until the conflict is resolved. A temporary exception may be granted by the higher-layer owner with a time-bounded expiration date.

**Rule 5: Version pinning.** Lower-layer documents reference specific versions of parent documents, not "current version." When a parent document is revised, lower-layer owners are notified and given a defined window (typically 30-90 days depending on criticality) to update their documents.

---

### 2.3 What Belongs at Each Layer

**Organization layer examples:**
- "All production deployments require a change request ticket and at least two approvers."
- "All code repositories must be private unless a documented open-source exception has been granted."
- "Security incidents must be reported to the security team within 4 hours of identification."
- "All procedural documents follow the lifecycle defined in [this document]."
- Approved vendor list; approved authentication methods; data classification taxonomy.

**Program/Product layer examples:**
- "This product's release pipeline follows a two-week sprint cycle with release on Fridays."
- "Customer-facing APIs follow semantic versioning; all breaking changes require a deprecation notice of not less than 60 days."
- "Pre-release security scans use [specific scanner]. Scan results must show zero critical findings before release."
- Integration testing requirements specific to product architecture.

**Project/Team layer examples:**
- "This team's on-call rotation is defined in [runbook URL]. On-call engineer responds to P1 alerts within 15 minutes."
- "Sprint retrospectives are documented in [tracking system] within 24 hours of completion."
- "Pull requests must pass all CI checks and receive one reviewer approval before merge."
- Team-specific branching strategy; local environment setup guide; toolchain version pins.

**Task layer examples:**
- "To set up local development environment: step 1, step 2, step 3..."
- "To deploy a hotfix: [checklist]"
- "To rotate credentials for [service]: [step-by-step]"

---

### 2.4 Anti-Patterns

**Anti-pattern 1: Org-level detail at the task layer.** Writing an organization-wide policy as a 40-step task checklist for individual contributors violates the principle of appropriate abstraction. Org-level documents state intent and requirements; they delegate implementation to lower layers. When org-level detail is buried in a task document, organizational changes require hunting through hundreds of task documents to update a single policy decision. The fix: identify the policy decision, elevate it to the correct layer, and replace the task-level detail with a reference.

**Anti-pattern 2: Task-level decisions at the org layer.** An org-level policy that specifies the exact sprint planning ceremony format, tool, or meeting agenda is over-specified at the wrong layer. Sprint ceremonies are a team-layer concern. Org-level documents that prescribe implementation details become obstacles when teams operate in different contexts (distributed vs. co-located, different product lifecycles, different customer SLAs). The fix: org-level documents specify outcomes and constraints, not implementation.

**Anti-pattern 3: Floating documents.** A procedure document with no explicit parent and no assigned layer cannot be governed. It cannot be identified as conflicting with anything because it has no declared relationship to anything. In practice, floating documents are almost always team-layer or task-layer artifacts that were created informally and never onboarded into the governance system. The fix: any document being onboarded into the canonical repository must declare its layer and parent before it is accepted.

**Anti-pattern 4: Layer bypass.** A project team writes directly to an org-level document to implement a team-specific requirement. This pollutes the org layer with project-specific content and makes the org policy harder to apply across all teams. The fix: changes to org-level documents require org-level approval. Project-specific adaptations belong in the project layer.

**Anti-pattern 5: Version divergence without tracking.** A lower-layer document references a parent that has since been revised. The lower layer is technically out of sync but may not know it. Without a parent-version change notification system, this drift accumulates indefinitely. The fix: explicit version pinning in references, combined with automated notification when referenced documents are revised.

---

### 2.5 Mapping Policy Hierarchy to Software Architecture Layers

The policy hierarchy is structurally isomorphic to layered software architecture. This mapping is not metaphorical — it reflects the same underlying design principle.

| Policy Layer | Software Architecture Equivalent |
|-------------|----------------------------------|
| Organization | Platform / infrastructure layer — rules that all code must respect regardless of application |
| Program / Product | Application framework — conventions specific to a product's architecture |
| Project / Team | Module / service layer — local implementation decisions within framework conventions |
| Task | Function / method level — specific execution logic |

Just as a function should not import directly from the platform layer and bypass the application framework, a task-level checklist should not attempt to implement organizational policy directly — it should execute the team-layer procedure, which is derived from the program layer, which is consistent with the org layer. This layering constrains blast radius: a change at the org layer propagates down in a controlled, testable way, rather than requiring simultaneous updates across thousands of task documents.

---

## 3. Version Control for Procedural Documents

### 3.1 The Core Principle

Procedural documents must be governed by the same rigor applied to source code. This is not a metaphor or an aspiration — it is a concrete requirement whenever the organization must demonstrate that a specific version of a procedure was in effect at a specific point in time (regulatory audits, incident post-mortems, legal discovery). The practices described in this section are the minimum requirements for any SOP in an ISO 12207-aligned or regulated environment.

---

### 3.2 Semantic Versioning for Procedural Documents

Adapt semantic versioning (SemVer) to procedural documents as follows:

**Format:** `MAJOR.MINOR.PATCH`

| Increment | Definition | Triggers |
|-----------|-----------|---------|
| MAJOR | Scope change, restructuring, fundamental approach change | Procedure steps reordered, sections added or removed, scope of applicability changed, roles restructured |
| MINOR | Content additions or significant expansions that do not change existing steps | New optional steps added, examples added, definitions expanded, edge cases documented |
| PATCH | Corrections only | Typo fixes, broken link repairs, formatting corrections, clarifications that do not change meaning |

**Important:** PATCH changes do not require a full REVIEW → APPROVE cycle. They require Author + one Reviewer to confirm the change is a true patch (does not change meaning). MINOR changes require standard REVIEW. MAJOR changes require full REVIEW → APPROVE including Approver sign-off. This distinction allows rapid correction of errors without burdening the approval process, while ensuring substantive changes receive appropriate scrutiny.

**Starting version:** All new documents start at `0.1.0`. Version `1.0.0` is the first approved-for-publication version. Pre-publication versions remain in the draft/review range (`0.x.x`).

**Changelog:** Every version bump — including PATCH — must have a changelog entry with the following fields:
- Version number
- Date
- Author of change
- Reviewer of change (for PATCH) or full disposition log reference (for MINOR/MAJOR)
- Summary of what changed and why

---

### 3.3 Single Source of Truth

The single-source-of-truth principle for procedural documents is the equivalent of `push.default=nothing` for git: no document goes anywhere without an explicit, traceable push. The implementation requirements are:

**One canonical location per document.** Every SOP has exactly one authoritative location. All references to the document use links to that location, never copies or attachments. Email attachments are explicitly prohibited for SOP distribution — if a colleague asks "can you send me the deployment runbook," the correct response is to send the URL.

**No local copies.** Teams must not maintain local copies of documents that are governed at a higher layer. Local reference material must link to the canonical location. When the canonical version changes, all links remain valid; all copies diverge silently.

**Access control.** The canonical repository enforces access control. Not everyone can edit; not everyone can approve. Read access is typically broader than write access. The technical enforcement of these controls is what gives the repository its authority as the single source of truth.

**Discoverability.** A single source of truth that cannot be found is as useless as no single source of truth. Search indexing, cross-reference registries, and directory structures must make documents findable by the people who need them.

---

### 3.4 Immutable Audit Trail

In regulated environments, it is not sufficient that the current version of a procedure is correct. It must be possible to reconstruct: what version was in effect on date X, who approved it, and what the exact text was at that time. This requires:

**No in-place edits.** Every change creates a new version. The system must be technically incapable of overwriting a previous version without creating a new version record. Git's content-addressable storage model is the canonical implementation of this requirement.

**Who/when/why logging.** Every version record includes: who made the change (authenticated identity, not self-reported), when the change was committed (system clock, not self-reported), and why (the change reason field in the changelog, plus the linked approval/review record).

**Non-repudiation.** Approval records must be signed or otherwise tied to an identity that cannot be altered after the fact. If your document system supports digital signatures, use them for approval records. If not, the approval record must be in a system where the audit log cannot be modified by the approver.

**Retention policy.** Define how long archived versions must be retained. Regulatory requirements vary: FDA 21 CFR Part 820 requires retention for the life of the device plus two years; ISO 13485 requires a minimum of two years from the date of release. In non-regulated environments, a three to five year minimum is a reasonable baseline. The retention policy must be documented at the Organization layer.

---

### 3.5 The SOP for SOPs — Version Control Procedure

The following is a concrete procedure for governing version control of procedural documents. This is the meta-SOP: the SOP that governs all other SOPs.

---

**SOP-VC-001: Version Control for Procedural Documents**  
Version: 1.0.0 | Status: PUBLISHED | Owner: Document Manager

**1.0 Purpose**  
Define version control requirements for all procedural documents in the engineering organization's document management system.

**2.0 Scope**  
Applies to all SOPs, runbooks, work instructions, and procedural guides maintained in the canonical document repository. Excludes: personal notes, draft planning documents, and temporary reference material not entering the governance system.

**3.0 References**  
- ISO/IEC/IEEE 12207:2017, Clause 6.3.4 (Configuration management process)
- SOP-LC-001: SOP Lifecycle Management (this document's parent)
- Document repository access control policy (ORG-POL-002)

**4.0 Definitions**  
- *Canonical location:* The single authoritative URL for a document; never a file system path.
- *Version record:* An immutable snapshot of a document at a specific version number and date.
- *Supersession:* The act of publishing a new version that replaces the current published version.

**5.0 Roles and Responsibilities**

| Role | Responsibility |
|------|---------------|
| Author | Initiates version bump; writes changelog entry; submits for review |
| Reviewer | Confirms change classification (PATCH/MINOR/MAJOR); reviews changed content |
| Approver | Signs MINOR and MAJOR versions; not required for PATCH |
| Document Manager | Maintains repository integrity; executes archive actions; manages access control |

**6.0 Procedure**

Step 1: Identify change trigger. Determine whether the change is PATCH, MINOR, or MAJOR per Section 3.2 definitions.

Step 2: Increment version number. Update the version field in the document header. If in doubt, increment MINOR rather than PATCH — over-classification is safer than under-classification.

Step 3: Make changes. All changes are tracked (diff or change-tracking enabled). No changes outside the defined scope of the trigger.

Step 4: Write changelog entry. Complete all required changelog fields (version, date, author, reviewer/approver reference, summary).

Step 5: Submit for review. PATCH: notify one Reviewer and await confirmation. MINOR/MAJOR: enter REVIEW stage per SOP-LC-001.

Step 6: Approve (MINOR/MAJOR only). Follow APPROVE stage per SOP-LC-001.

Step 7: Publish new version. Place new version at canonical location. Tag previous version as superseded with link to new version. Archive previous version.

Step 8: Notify. Send notification to distribution list: new version X.Y.Z published, supersedes X.Y.(Z-1), link to canonical location, summary of changes.

Step 9: Update references. Identify any lower-layer documents that pin this document by version. Notify their owners of the version change and the deadline for their update.

**7.0 Quality Checks**  
- Changelog is complete before version is published.
- Previous version is archived before or simultaneously with new version publication.
- No document references a version of this document that has not been published.

**8.0 Records / Success Criteria**  
- Version history table in document footer shows complete history.
- All previous versions accessible in archive.
- Distribution notifications logged with timestamps.

---

## 4. Role-Based Access and Approval Workflows

### 4.1 The Four Core Roles

SOP governance requires exactly four roles. Any individual may hold more than one role in the organization, but for any specific document, separation-of-duties requirements constrain which roles a single person may hold simultaneously.

**Author**
Creates and revises procedural content. Has full write access to documents they own. Responsible for the technical accuracy and completeness of the document. Responds to Reviewer comments. Does not approve their own documents.

**Reviewer**
Verifies accuracy, completeness, and usability. Must be capable of technically evaluating the procedure's content — a review by someone without domain knowledge is not a valid review. For task-level procedures, at least one Reviewer must be a practitioner who would execute the procedure. For org-level procedures, at least one Reviewer must have cross-organizational scope. Produces written review comments with specific section references. Does not review documents for which they are the Author.

**Approver**
Authorizes the document for publication. Has authority at the appropriate layer (see Section 2). Verifies policy compliance and organizational alignment — not technical accuracy (that is the Reviewer's function). Does not approve documents for which they are the Author or primary Reviewer.

**User**
Executes the procedure in production. Not part of the approval workflow but is the ultimate validation target. User feedback from the IMPLEMENT stage is the primary signal that a procedure needs REVISION. Users for safety-critical procedures must be represented in the REVIEW stage.

---

### 4.2 RACI Matrix for SOP Lifecycle

R = Responsible (does the work), A = Accountable (single point of authority), C = Consulted (provides input), I = Informed (notified of outcome)

| Stage | Author | Reviewer | Approver | Document Manager | Users/Operators | Team Lead |
|-------|--------|----------|----------|------------------|-----------------|-----------|
| DRAFT | R/A | — | — | I | C | C |
| REVIEW | R | R/A | I | — | C (safety-critical) | C |
| APPROVE | C | C | R/A | I | — | I |
| PUBLISH | R | — | A | R | I | I |
| TRAIN | C | — | I | — | R | R/A |
| IMPLEMENT | — | — | — | — | R/A | C |
| REVISE | R/A | C | I | — | C | C |
| RETIRE | C | — | R/A | R | I | I |
| ARCHIVE | — | — | A | R | — | I |

**Reading the matrix:** In REVIEW, the Reviewer is both Responsible (does the review) and Accountable (owns the review outcome). The Author is Responsible for responding to comments but not Accountable for the review outcome. In APPROVE, the Approver is solely Accountable — this is a single-point accountability, which means no approval by committee. Committee input belongs in REVIEW.

---

### 4.3 Separation of Duties Requirements

**Minimum separation (all SOPs):**
- Author ≠ sole Reviewer
- Author ≠ Approver

**Standard separation (all SOPs above task-layer):**
- The primary technical Reviewer must be different from the Author
- The Approver must be different from the primary Reviewer

**Enhanced separation (safety-critical, regulatory, or security SOPs):**
- At least two Reviewers, at least one of whom is an end-user practitioner
- The Approver must be at least one organizational level above the Author
- An independent audit review by a party outside the immediate team is required before publication

**Rationale:** Separation of duties is the document governance equivalent of code review. Its purpose is not bureaucratic friction but error detection. An Author cannot reliably identify errors in their own work — cognitive bias toward their own understanding of the procedure is irreducible. A Reviewer who is also the Author's direct supervisor may not provide independent technical review due to authority dynamics. These requirements are structural mitigations for known human factors.

---

### 4.4 Delegation Rules

**Delegation principle:** Role delegation is temporary and bounded. A delegated role holder has the same authority and responsibilities as the original role holder for the duration of the delegation. Delegation does not reduce accountability — the delegator remains accountable for the outcome.

**Delegation requirements:**
- Delegations must be documented: who is delegating, to whom, for what documents or time period, and for what reason.
- Delegation of the Approver role requires authorization from the Approver's manager.
- No self-delegation: an Author cannot delegate the Reviewer or Approver role to themselves.
- Delegation of review roles for safety-critical documents must be explicitly approved by the Approver.
- Delegations expire: no open-ended delegations. Each delegation has a defined end date.

**Escalation paths:** If a document is blocked in REVIEW or APPROVE because the assigned role-holder is unavailable and no delegation has been established, the Team Lead is the escalation contact. The Team Lead either assigns a qualified alternative or escalates to the Program Manager. No document should be blocked in queue for more than five business days without an escalation record.

---

## 5. Governance Failure Modes

### 5.1 Core Failure Mode Catalog

The following failure modes are documented from operational experience across engineering organizations. Each has observable symptoms, root causes, and concrete remedies.

---

**Failure Mode 1: Outdated SOP in Active Use**

*Symptom:* Operators follow a procedure that was valid 18 months ago but has since been superseded by infrastructure changes, tool version upgrades, or regulatory updates. The procedure produces incorrect results, wasted effort, or safety risk — but operators have no reason to question it, because the document shows no sign of being outdated.

*Consequence:* False confidence is the critical factor here. An operator who knows a procedure is uncertain will apply judgment. An operator who trusts a formally documented procedure will not. The documented procedure becomes a liability rather than an asset.

*Root cause:* No mandatory review-date field in the document header; or the review date exists but no one monitors it; or monitoring exists but no escalation path is defined when the review date passes without action.

*Remedy:*
1. Every SOP header contains a `Review Due` field, populated at publication time.
2. An automated alert is sent to the document owner 30 days before the review due date, and again on the due date if no REVISE cycle has been initiated.
3. Documents past their review date are automatically flagged as "Review Overdue" in the repository — this flag is visible to Users, not just administrators.
4. SOP dashboard shows percentage of documents current vs. overdue; Team Leads are accountable for their team's overdue rate.

---

**Failure Mode 2: Version Confusion**

*Symptom:* Multiple versions of a document exist in circulation with no clear indication of which is authoritative. "Final," "Final_v2," "Final_APPROVED," "Final_APPROVED_revised" coexist in shared folders and email threads.

*Consequence:* Operators following different versions of the same procedure produce inconsistent outcomes. In safety-critical environments, this can produce incidents where the post-mortem cannot determine which procedure was actually followed. Regulatory audits fail when "the current procedure" cannot be definitively identified.

*Root cause:* No single-source-of-truth repository; document distribution by attachment rather than link; no access controls preventing unauthorized copies.

*Remedy:*
1. Single canonical repository with access control. Physical enforcement, not honor system.
2. Distribution by link only. Email policies explicitly prohibit SOP attachments.
3. Repository search shows only published, non-retired versions by default; archive versions are accessible but not surfaced as primary results.
4. Document IDs in procedure execution records: when logging a procedure execution, the record includes the document ID and version number, creating an unambiguous audit trail.

---

**Failure Mode 3: Knowledge Siloing**

*Symptom:* A single expert writes a procedure based on undocumented tribal knowledge. No one reviews the document because no one else has the domain expertise. The document is formally approved but effectively unreviewed — it accurately reflects what the expert does, but may not reflect what should be done, and contains implicit assumptions that are invisible to readers without the expert's background.

*Consequence:* The procedure works when the expert is present to interpret it. When the expert is unavailable or leaves the organization, the procedure fails in subtle ways that are difficult to diagnose. Critical knowledge is not actually documented — it is referenced.

*Root cause:* Informal review culture; no requirement for operator-practitioner involvement in review; no distinction between expert review (technical accuracy) and usability review (can a non-expert follow this?).

*Remedy:*
1. Mandatory operator involvement: at least one Reviewer for task-level procedures must be a practitioner at the target skill level, not an expert.
2. Walk-through testing: for new critical procedures, a structured walkthrough with a new operator following the written steps verbatim — the expert watches and notes every point where the new operator hesitates, improvises, or asks a question.
3. Assumption mapping: the Author explicitly lists assumptions in the draft ("This procedure assumes the operator has completed onboarding module 3"). These become requirements for the Prerequisites section.

---

**Failure Mode 4: Over-formalization**

*Symptom:* SOPs grow to 30-50 pages with extensive regulatory boilerplate, nested appendices, and conditional branches for every conceivable edge case. Operators bypass them in favor of informal channels (asking a colleague, using a personal note) because consulting the formal document takes longer than doing the task.

*Consequence:* The documented procedure is technically valid but practically irrelevant. Compliance audits show the procedure exists; operational reality shows it is not being followed. Operators develop workarounds that are neither documented nor governed.

*Root cause:* Conflating purpose and audience: a regulatory compliance document (which must cover all cases) and an operator execution guide (which must be fast and clear) are written as the same document. Absence of decomposition — everything in one document rather than layered architecture.

*Remedy:*
1. Task-level SOPs: 2-page maximum for the procedure section (sections 6.0 and 7.0). If it does not fit, the scope is wrong — decompose into sub-procedures.
2. Visual aids: flowcharts, decision trees, and checklists for execution guidance; prose for context and compliance.
3. Reference architecture: regulatory compliance content lives in the org-layer document. Team-layer and task-layer documents reference it, not restate it.
4. Readability audit: for every new SOP, have an operator time themselves reading to the point of readiness to execute. Target: under five minutes for a task-level procedure.

---

**Failure Mode 5: No Measurement**

*Symptom:* Procedures are written, approved, published, and trained. No one tracks whether they produce the intended outcomes. Procedure compliance is assumed rather than verified.

*Consequence:* The organization cannot distinguish between effective and ineffective procedures. Process improvement is impossible without baseline measurement. When an incident occurs, there is no data to determine whether following the procedure would have prevented it.

*Root cause:* Success criteria in section 8.0 are absent or unmeasurable ("the task is completed successfully" is not a success criterion). No tracking mechanism for procedure compliance or outcome metrics.

*Remedy:*
1. Mandatory measurable success criteria in section 8.0 for every SOP. Each criterion must be verifiable by an auditor who was not present for the execution.
2. Compliance tracking: for high-risk procedures, a compliance log records when the procedure was followed and when it was deviated from (with deviation reason).
3. Outcome metrics: where the procedure is intended to produce a measurable outcome (deployment success rate, incident response time, code review coverage), those metrics are tracked in the organizational dashboard.
4. Quarterly review of SOP effectiveness metrics by Team Lead, with escalation to Program Manager for persistent negative trends.

---

### 5.2 Additional Failure Modes

**Failure Mode 6: Approval Theater**

*Symptom:* Approvals are rubber-stamped. The Approver signs documents without reading them because the approval queue is too large, the approvals are too frequent, or the organizational culture treats approval as a formality rather than a gate.

*Consequence:* The approval record creates false confidence in review quality. Documents with substantive errors enter production with the organization's formal endorsement. In regulated environments, approval theater is a compliance violation — a signature without a genuine review is a false attestation.

*Root cause:* Approver scope is too broad (one approver for all documents across a large organization); no time allocated for meaningful review; culture normalizes rapid sign-off.

*Remedy:*
1. Approver scope limits: no Approver is responsible for more than 10-15 active documents simultaneously. If the queue exceeds this, additional Approvers are designated or the scope is redistributed.
2. Approval evidence requirement: for MINOR and MAJOR versions, the Approver must provide at least one written observation or question before signing. A zero-comment approval is flagged for audit.
3. Approval time budget: review complexity is estimated at document submission; Approvers are given allocated time to complete the review rather than doing it in stolen minutes.

---

**Failure Mode 7: Cascading Reference Failure**

*Symptom:* A document references another document that references a third document, and a fourth. One of these dependencies is retired, renamed, or substantially revised. The document at the top of the chain becomes partially invalid — but the invalidity is not visible without following the full reference chain.

*Consequence:* Operators following a procedure encounter a reference to a document that no longer exists, or that has changed in a way that affects their task. In the worst case, the referenced document has been revised to recommend the opposite of what it previously recommended, but the referencing document has not been updated.

*Root cause:* No dependency tracking; document retirement does not trigger downstream notification; reference links are not validated.

*Remedy:*
1. Dependency registry: when a document is published with references to other documents, those references are registered in a dependency graph.
2. Retirement cascade: when a document is retired or substantially revised (MAJOR version bump), all documents that reference it are automatically notified.
3. Reference validation: as part of the REVIEW stage, all referenced documents must be confirmed as existing and current (or the referencing document must declare it is referencing a specific pinned version deliberately).
4. Annual broken-link audit: automated scan of all canonical documents for dead references; results escalated to document owners.

---

**Failure Mode 8: Post-Incident Procedure Drift**

*Symptom:* After a significant incident, operators develop informal adaptations to the procedure — workarounds that prevent recurrence. These adaptations are communicated verbally and in slack threads but never formally incorporated into the SOP. Over time, the formal SOP and actual practice diverge. New team members follow the formal SOP and reproduce the conditions for the incident.

*Consequence:* The organization fails to capture its own lessons learned. Post-incident improvements exist as tribal knowledge rather than institutional knowledge. The incident cycle repeats.

*Root cause:* No formal path from incident post-mortem action items to SOP revision; REVISE cycles not triggered by incident findings; ownership of post-mortem action items not connected to document ownership.

*Remedy:*
1. Post-mortem to SOP pipeline: every post-mortem action item that affects a procedure must be linked to a REVISE cycle initiation ticket. The action item is not closed until the revised SOP is published.
2. Incident trigger classification: "procedure failure or near-miss" is a mandatory review trigger (see Section 1.2). Post-incident procedure review is non-optional.
3. Workaround surfacing: in post-mortems and retrospectives, explicitly ask "are there informal workarounds to current procedures that aren't in the documents?" Surface and formalize them.

---

## 6. Change Control as Engineering Discipline

### 6.1 When to Trigger a Review

Change control begins with recognition that a change is needed. The review triggers defined in Section 1.2 cover the full taxonomy. The operational question is: how does the triggering event get converted into a REVISE cycle?

**Trigger intake process:**
1. Anyone — Author, Reviewer, User, Team Lead — may submit a change request to the document owner.
2. The change request includes: document ID and version, trigger type (from Section 1.2 taxonomy), description of the specific issue or requirement, requestor's recommended change (optional but encouraged), and urgency classification.
3. The document owner reviews the change request within 5 business days (standard) or 48 hours (incident trigger).
4. The document owner makes one of three dispositions: Accept (initiates REVISE cycle), Defer with justification (adds to next scheduled review), Reject with rationale (logged; requestor may escalate to Team Lead).
5. The disposition is communicated to the requestor with a date reference.

---

### 6.2 Minor vs. Major Change Boundaries

The MINOR/MAJOR boundary is the most consequential classification decision in change control. Under-classification (calling a MAJOR change MINOR) circumvents Approver review. Over-classification adds process burden without benefit.

**MINOR change examples:**
- Adding a new optional step that does not affect existing steps
- Adding an example or illustration
- Expanding a definition
- Adding a reference to a new relevant tool (that does not replace an existing tool in the procedure)
- Documenting an edge case that was previously unhandled but does not change the primary workflow

**MAJOR change examples:**
- Changing the sequence of existing steps
- Adding or removing a mandatory step
- Changing the scope of the procedure (who it applies to, or what activities it covers)
- Changing the roles or responsibilities section
- Replacing a referenced tool with a different tool
- Any change in response to a regulatory update that affects normative requirements
- Any change in response to a procedure failure or near-miss

**Resolution heuristic for ambiguous cases:** If the change, when executed incorrectly or misunderstood, could produce a materially different outcome than the previous version, it is MAJOR. When in doubt, classify MAJOR.

---

### 6.3 Emergency Change Procedures

Emergency changes are MAJOR changes that cannot wait for the standard review timeline due to an active safety issue, security vulnerability, or compliance violation.

**Emergency change process:**

1. Author or Team Lead declares emergency change with explicit justification.
2. Abbreviated review: one designated emergency Reviewer (pre-identified in the organization's reviewer registry) reviews within 4 hours. Full technical review is replaced by a focused review of the specific emergency change.
3. Emergency Approver (pre-identified, typically Program Manager or above) approves within 2 hours of emergency review completion.
4. Document published with version bump and explicit notation: `[EMERGENCY CHANGE — Full review pending]`.
5. Full standard review must be initiated within 5 business days. The emergency version remains in force but is flagged as pending full review.
6. If the full review produces no changes, the emergency flag is removed and the version is confirmed. If the full review produces changes, a new version is published following standard process.

**Emergency change log:** All emergency changes are logged separately with the emergency justification, timeline, emergency reviewer and approver identities, and outcome of subsequent full review. This log is available for audit.

---

### 6.4 Rollback Procedures for Procedural Changes

When a published procedure produces unexpected negative outcomes — errors, incidents, compliance violations — the organization must be able to revert to the previous version.

**Rollback process:**

1. Rollback decision is made by the Approver who authorized the current version, or their manager.
2. Previous version is retrieved from archive (this is why archive is mandatory and immutable — rollback requires a clean prior state).
3. Previous version is re-published to canonical location as a new version with an increment (e.g., if `1.3.0` is being rolled back, the restored version is published as `1.4.0`, not as `1.2.0` again). This preserves the audit trail — the version history shows the rollback as a deliberate action, not an erasure.
4. Version `1.4.0` header notes: "This version is a rollback to content equivalent to version `1.2.0`. See rollback record [reference] for justification."
5. All users notified immediately of the rollback with explicit statement: "If you followed the procedure in version `1.3.0`, review the rollback notice before your next execution."
6. A REVISE cycle is initiated immediately to address the issue that triggered the rollback. The rolled-back version is not a permanent state — it is a controlled reversion while the problem is corrected.

---

### 6.5 Audit Trail Requirements for Regulated Environments

In regulated environments (FDA, FAA, NRC, SOX, HIPAA, and others), the audit trail is not optional — it is a regulatory artifact with legal standing. The minimum audit trail record for every version of every document includes:

- Document identifier (permanent, not version-specific)
- Version number
- Date of each lifecycle stage transition (DRAFT → REVIEW, REVIEW → APPROVE, APPROVE → PUBLISH)
- Identity of each Author, Reviewer, and Approver, linked to authenticated system accounts
- Change reason documentation
- Training records linking specific personnel to specific document versions
- Deviation records from the IMPLEMENT stage

Audit trail records must be retained for the longer of: (a) the retention period specified in the applicable regulatory framework, or (b) the organization's general records retention policy.

**Tamper evidence:** In systems where audit trail integrity is a regulatory requirement, the audit trail itself must be tamper-evident. Approaches include: write-once storage, cryptographic hash chains (the git commit graph is a native implementation of this), or third-party audit log services.

---

### 6.6 Connection to Git-Based Workflows

Git is not merely analogous to document version control — for organizations with the technical capability, git is the correct implementation of document version control. The connection is direct:

**Direct mappings:**
- Document version → git tag or commit SHA
- DRAFT stage → feature branch
- REVIEW stage → pull request with reviewer-assigned reviews
- APPROVE stage → PR approval + merge (requiring approver's merge rights)
- PUBLISH stage → merge to main branch with tag
- ARCHIVE stage → tagged historical commit
- Changelog → git commit messages (following Conventional Commits format)
- Single source of truth → canonical main branch

**Implementation guidance:**
- Store SOPs as plain text (Markdown preferred — version diffs are human-readable)
- Branch protection rules enforce separation of duties: only Approvers can merge to main
- PR templates provide structured fields for reviewer comments and change classifications
- Tags mark published versions: `sop-vc-001-v1.0.0`
- Retirement commits include `RETIRED` in the commit message and in the document header

**Tooling note:** Organizations that cannot adopt git-based workflows for document management should implement an equivalent system. The functional requirements are: immutable history, authenticated authorship, branched review process, and access-controlled publication. Any document management system that satisfies these requirements is acceptable. Systems that do not satisfy them (shared network drives, email-based distribution, collaborative editing without history) are not acceptable for governed SOPs in any regulated or safety-critical context.

---

## 7. Governance in Practice: Case Studies

### 7.1 NASA LLIS: Formalized Living-Document Governance

NASA's Lessons Learned Information System (LLIS) is the most extensively documented example of institutional procedural governance in engineering. Established in 1991 following the Challenger disaster, LLIS was designed to solve a specific governance failure: lessons identified in one program were not being transmitted to engineers in other programs who faced the same design decisions.

**The governance architecture:**

LLIS operates on a submission-review-publish model structurally identical to the SOP lifecycle described in Section 1. A lesson is submitted by a practitioner (Author), reviewed by subject-matter experts (Reviewers), approved by a Program Office (Approver), and published to a searchable database accessible across NASA centers.

The critical governance innovation in LLIS is the distinction between "lesson identified" and "lesson learned." A lesson is not considered "learned" until it has been incorporated into an updated procedure, standard, or design guideline. This directly addresses the Post-Incident Procedure Drift failure mode from Section 5.2: the lesson is not closed until the relevant procedure has been revised.

**Version control in LLIS:**

LLIS entries are immutable once published. Changes are submitted as new entries that reference the original, rather than as edits to the original. This creates an exact parallel to the rollback procedure described in Section 6.4: prior state is preserved; changes are additive, not destructive.

**Governance outcome:**

As of 2025, LLIS contains over 4,000 published lessons from across NASA programs. NASA SPAN (Software Processes Across NASA) uses LLIS as one of its primary inputs for procedural revision triggers — a direct implementation of the "procedure failure or near-miss" trigger and the "regulatory or standards update" trigger from Section 1.2.

**Applicable takeaway:** The key structural lesson from LLIS for general engineering governance is the closed-loop requirement: a lesson is not complete until the relevant procedures are updated. This prevents the knowledge from being identified but not institutionalized.

---

### 7.2 The Cost of Version Confusion in Safety-Critical Environments

The Vasa warship (1628) is the canonical historical example — a ship sunk due to measurement unit inconsistencies across construction teams — but the modern engineering literature provides more recent and precisely documented cases.

**The Therac-25 case (1985–1987)**

While the Therac-25 radiation therapy machine accidents are primarily studied as software engineering failures, they also contain a procedural governance failure that is directly relevant to this module. When AECL (Atomic Energy of Canada Limited) issued software patches in response to the first reported incidents, the patches were applied inconsistently across installed machines. Some machines received updates; others did not. Hospitals were operating machines running different software versions, with some machines corrected and others still vulnerable. There was no centralized version tracking, no single source of truth for which machines were running which software version, and no notification system to ensure all affected machines were updated.

The version confusion problem was not about documents — it was about deployed software versions. But the governance failure is structurally identical: multiple versions of a procedure (or system) in production simultaneously, with no mechanism to identify which version any individual machine was running.

**Applicable takeaway for document governance:** Version confusion in safety-critical environments creates a zone of ambiguity where incident attribution becomes impossible. When an incident occurs, the post-mortem cannot answer "was the current procedure followed?" because "current" is undefined. The remedies — single source of truth, version tracking per deployment, mandatory version identifiers in execution records — map exactly from software version control to document version control.

**The Boeing 737 MAX and MCAS documentation**

Multiple investigations of the 737 MAX incidents (2018–2019) identified failures in how MCAS system changes were communicated to operators through flight manual documentation. System capabilities were changed between development and production versions without commensurate updates to the Flight Crew Operations Manual. Pilots were operating under procedures written for a different system configuration than the one installed on their aircraft.

This is the "cascading reference failure" and "outdated SOP in active use" failure modes in combination. The root cause investigation identified inadequate configuration management of documentation as a contributing factor — documentation was not updated in parallel with system changes, and the version of the documentation in use by operators did not match the system version they were operating.

**Applicable takeaway:** In any domain where the procedure and the system it governs change independently, version correlation tracking is mandatory. This is a formal requirement in DO-178C (airborne software) and an implied requirement in most safety-critical standards. For general engineering governance, the equivalent is: when a referenced tool, infrastructure component, or dependent system changes, the procedures governing it must be reviewed and updated before the new version goes into production.

---

### 7.3 How Open Source Projects Govern Documentation Changes

Open source projects provide a large-scale natural experiment in document governance under distributed authorship, no centralized authority, and public audit trails. The patterns that have evolved in large, long-lived open source projects are directly applicable to engineering organization governance.

**The Kubernetes documentation governance model**

The Kubernetes project's documentation is governed through the same git-based workflow used for its source code. Pull requests for documentation changes follow the same review-and-approval process as code changes, with specialized documentation approvers (defined in OWNERS files) distinct from code approvers. This implements several governance requirements from this module:
- Separation of duties: documentation approvers are defined per-directory; no self-merge.
- Single source of truth: the kubernetes/website repository is canonical; all sites build from it.
- Audit trail: the full PR history is public and permanent.
- Version correlation: documentation is released on the same version cycle as the software, with explicit version tagging.

The Kubernetes project also maintains a Special Interest Group (SIG Docs) that owns the documentation governance process — an organizational implementation of the Document Manager role at program scale.

**The Rust Reference governance model**

The Rust Reference (the formal language specification) uses a "must have RFC" requirement for significant changes: no new language feature is added to the Reference without a corresponding Request for Comments that has gone through a formal review and acceptance process. This is a direct implementation of the MAJOR change classification requiring full Approver review — the RFC is the MAJOR change review artifact.

Minor corrections and clarifications follow an expedited path (equivalent to PATCH review) where a single reviewer can approve without full RFC process.

**The Python Enhancement Proposal (PEP) system**

Python's PEP process is one of the oldest and most studied examples of open governance for technical documentation. PEPs progress through a state machine (Draft → Accepted → Final → Superseded → Withdrawn) that is structurally identical to the SOP lifecycle in Section 1. The key governance innovations in PEPs:
- Each PEP has a designated Shepherd who is not the Author.
- PEPs in Final state are immutable; updates require a new PEP that supersedes the old one (never in-place edits).
- The PEP index tracks the current status of every PEP, with explicit links between superseded and superseding documents.

**Applicable takeaway for engineering governance:** Open source governance has solved these problems at scale, in public, with billions of dollars of infrastructure depending on the outcomes. The patterns are available for adoption without cost: git-based workflows, OWNERS files for access control, explicit lifecycle states in document headers, version correlation with software releases, and immutable published versions with supersession linking.

The common thread across all three examples: governance is a workflow, not a culture. It works because the process enforces it structurally — a PR cannot merge without an approver's click, a document cannot be published without a version tag, a retired document is not deleted. Good governance design makes the right path the only path.

---

## 8. References

**Standards**

- **ISO/IEC/IEEE 12207:2017** — *Systems and software engineering — Software life cycle processes.* Geneva: ISO/IEC. Clauses 6.3.4 (Configuration management), 6.3.5 (Information management), 6.4.1 (Project planning), and 6.4.2 (Project assessment and control) inform the governance framework throughout this module.

- **ISO/IEC/IEEE 15289:2017** — *Systems and software engineering — Content of life-cycle information items (documentation).* Geneva: ISO/IEC. Defines content requirements for procedural documentation at each lifecycle stage; directly informs the stage-by-stage artifacts in Section 1.

- **IEEE Std 1028** — *IEEE Standard for Software Reviews and Audits.* IEEE: New York. Defines review types, roles, and required outputs; Section 4 RACI matrix is consistent with IEEE 1028 review role definitions.

**NASA Sources**

- **NASA SPAN** — *Software Processes Across NASA.* NASA Software Engineering Division. SPAN governs software process standards across NASA centers and programs; its lesson-identification and lesson-learned distinction (Section 7.1) is a foundational governance pattern.

- **NASA LLIS** — *Lessons Learned Information System.* Available at llis.nasa.gov. Primary source for Section 7.1 case study; governance model analysis based on published LLIS methodology documentation.

- **NASA NPR 7150.2D** — *Software Engineering Requirements.* NASA Procedural Requirements. Section 3 (Software Engineering Reviews and Audits) and Section 4 (Configuration Management) inform the change control requirements in Section 6.

**Practitioner Sources**

- **Tractian** (January 2026) — *Standard Operating Procedure: Full Implementation Guide.* tractian.com. Lifecycle stage definitions and review trigger taxonomy; directly cited in Section 1.

- **TechnicalWriterHQ** (2026) — *Document Lifecycle Management.* technicalwriterhq.com. Version control practices and single-source-of-truth requirements; informs Section 3.

**Case Study Sources**

- **Leveson, N.G.** (1995) — *Safeware: System Safety and Computers.* Addison-Wesley. Therac-25 case analysis; version management failure analysis in safety-critical software.

- **Boeing 737 MAX Joint Authorities Technical Review** (2019) — *Boeing 737 MAX Flight Control System.* FAA Technical Report. Documentation configuration management findings cited in Section 7.2.

- **Kubernetes Documentation** — *kubernetes/website GitHub repository.* github.com/kubernetes/website. OWNERS file governance model; SIG Docs charter.

- **Python Software Foundation** — *PEP Index.* peps.python.org. PEP lifecycle state machine; immutable published document policy.

- **Rust Reference Contributors** — *The Rust Reference.* doc.rust-lang.org/reference. RFC requirement for major specification changes.

---

*Module M3 complete. Word count: approximately 8,200 words. All sections cover entry criteria, activities, exit criteria, roles, and artifacts as specified. RACI matrix complete. Eight failure modes documented (five specified + three additional). Case studies cover NASA LLIS, Therac-25/737 MAX safety-critical version confusion, and three open source governance models.*
