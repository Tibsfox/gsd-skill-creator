# M6: Unified Governance Model

**Module:** M6  
**Title:** Unified Governance Model  
**Type:** Policy / Standard  
**Owner:** Documentation Program Manager  
**Lifecycle State:** Published  
**Review Cadence:** Annual  
**Audience:** Compliance Auditors, Documentation Owners, Senior Engineers, Operations Staff, Product Managers  
**Framework Refs:** NIST SP 800-53 R5 (PM, PL, CA), NIST SP 800-100, ISO/IEC 27001:2022, NIST CSF 2.0  
**Version:** 1.0  
**Last Reviewed:** 2026-04-05  
**Next Review:** 2027-04-05  

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Scope](#2-scope)
3. [Governance Principles](#3-governance-principles)
4. [Ownership Matrix](#4-ownership-matrix)
5. [Review Cadence Table](#5-review-cadence-table)
6. [Lifecycle State Machine](#6-lifecycle-state-machine)
7. [Escalation Paths](#7-escalation-paths)
8. [AI Content Governance](#8-ai-content-governance)
9. [Compliance Integration](#9-compliance-integration)
10. [Quality Gate Enforcement Model](#10-quality-gate-enforcement-model)
11. [Governance Roles and Responsibilities](#11-governance-roles-and-responsibilities)
12. [Implementation and Adoption](#12-implementation-and-adoption)
13. [Related Documents](#13-related-documents)
14. [Revision History](#14-revision-history)

---

## 1. Purpose

This module provides the unified governance model for the organization's documentation program. It synthesizes the document taxonomy and lifecycle from M1, the pipeline automation from M3, the compliance framework mappings from M4, and the AI documentation guardrails from M5 into a single, actionable governance framework.

Documentation governance answers four questions:

1. **Who owns each document?** (Ownership matrix)
2. **When must each document be reviewed?** (Review cadence table)
3. **What are the rules for document state transitions?** (Lifecycle state machine)
4. **What happens when governance is not followed?** (Escalation paths)

Without a unified governance model, these questions are answered inconsistently across teams, leading to orphaned documents, lapsed reviews, unclear ownership, and compliance gaps. This module establishes the authoritative answers.

This module is the governance layer that sits above the operational modules (M1–M5). It does not duplicate their content — it references and integrates them. When a governance decision requires a detailed procedure, this module points to the relevant section of the operational module rather than restating it.

---

## 2. Scope

This module covers:

- Ownership assignment rules for all document types in the taxonomy (M1)
- Review cadence requirements for all document types at all criticality levels
- The complete lifecycle state machine with pipeline-integrated gate criteria
- Escalation paths for governance failures (stale documents, missing owners, disputed content)
- AI content governance rules integrating the guardrails from M5
- Compliance mapping showing how this governance model satisfies NIST 800-53 PM family requirements

This module does not cover:

- Document content standards (see M1 Section 6)
- Authoring system selection (see M2)
- Pipeline implementation details (see M3)
- Framework-specific documentation requirements (see M4)
- AI pattern definitions and guardrails (see M5)

---

## 3. Governance Principles

The governance model is built on five principles derived from the frameworks cited in M1 and M4.

### 3.1 Single Accountability

Every document has exactly one accountable owner. Ownership is assigned to a role, not a person. When a person leaves the role, ownership transfers automatically to the role's new occupant. There is no period where a document has no owner.

**Source:** NIST SP 800-53 R5, Control PM-2 (Information Security Program Leadership Role) establishes the principle that every security function has a designated responsible official. This principle extends to documentation ownership.

### 3.2 Enforceable Review Cadence

Review cadences are not suggestions — they are enforced through automated systems. A document that passes its review date without a completed review triggers automated escalation. The pipeline blocks related changes when documents are stale (M3 Section 8).

**Source:** ISO/IEC 27001:2022, Clause 7.5.3 (Control of documented information) requires that documented information be reviewed and updated as appropriate.

### 3.3 Pipeline-Integrated Gates

Every document state transition is validated by the docs-as-code pipeline. Manual transitions (someone changing a document's state field without going through the pipeline) are not valid. The pipeline is the enforcement mechanism.

**Source:** NIST SP 800-53 R5, Control CM-3 (Configuration Change Control) requires that changes to system configurations — including documentation — follow a controlled change process.

### 3.4 Graduated Scrutiny

Not all documents receive the same level of governance scrutiny. Compliance-sensitive policy documents receive more rigorous review than internal guidelines. AI-generated documents receive additional review gates beyond human-authored documents. The governance model scales scrutiny to risk.

**Source:** NIST SP 800-100, Chapter 4, describes risk-proportionate governance for information security documentation.

### 3.5 Transparent Provenance

Every document's authorship provenance — human-authored, AI-generated, AI-adapted, or hybrid — is recorded in metadata. Governance decisions (ownership changes, review approvals, escalation resolutions) are recorded in the document's version history. The governance trail is auditable.

**Source:** NIST SP 800-53 R5, Control AU-3 (Content of Audit Records) requires that audit records contain sufficient information to establish what events occurred.

---

## 4. Ownership Matrix

### 4.1 Ownership Assignment by Document Type

The ownership matrix defines who owns each document type, who reviews it, and who has final approval authority. Ownership is expressed as a role title (from M1 Section 7.4) to survive personnel changes.

| Document Type | Owner Role | Review Authority | Approval Authority | Ownership Model |
|---|---|---|---|---|
| **Policy — Enterprise** (Information Security Policy, Privacy Policy) | CISO | Compliance Officer + Legal | Governance Body (Board/Committee) | Working Group |
| **Policy — Domain** (Access Control Policy, Incident Response Policy) | Domain Security Lead | Compliance Officer + Domain SME | CISO | Domain Ownership |
| **Standard** (Password Standard, Encryption Standard) | Security Architect | Domain SME + Compliance Officer | CISO + Legal | Domain Ownership |
| **Procedure — Security** (Incident Handling, Evidence Collection) | Security Operations Lead | Security SME + ISSO | Department Head | Single Owner |
| **Procedure — Operational** (Deployment, Backup, Credential Rotation) | Operations Team Lead | Operations SME + Document Owner | Department Head | Single Owner |
| **Procedure — IT** (Account Provisioning, Access Review) | IAM Team Lead | IAM SME + Security Lead | IT Director | Single Owner |
| **SOP** (Standard Operating Procedure for any domain) | Process Owner (role performing the task) | SME + Quality Lead | Operations Manager | Single Owner |
| **Guideline** (Container Security Guideline, Code Review Guideline) | Engineering Lead / Architect | Peer engineers | Team Lead | Single Owner |
| **Control** (MFA Control, Firewall Rule, Encryption Control) | Control Owner (per control framework) | Risk Committee member + ISSO | Risk Committee | Domain Ownership |
| **System Security Plan** | ISSO | Security Assessment Team + System Owner | Authorizing Official (AO) | Single Owner |
| **Plan of Action and Milestones** | ISSO | System Owner + AO | Authorizing Official (AO) | Single Owner |
| **AI-Generated — Reference** (API docs, config docs) | Documentation Engineering Lead | Domain SME (Tier 2) | Document Owner | Single Owner |
| **AI-Generated — SOP Draft** | Process Owner | SME Walkthrough (Tier 2) | Operations Manager | Single Owner |
| **AI-Adapted — Audience Variant** | Original Document Owner | Target Audience Representative | Document Owner | Single Owner |

### 4.2 Ownership Transfer Protocol

When an ownership transfer is required (role change, organizational restructuring, owner departure):

1. **Outgoing owner** notifies the Documentation Program Manager with the list of owned documents
2. **Documentation Program Manager** identifies the incoming owner (the person filling the role, or the role's manager as interim owner)
3. **Incoming owner** receives the document list and has 30 calendar days to review all owned documents
4. **Transfer is recorded** in each document's revision history: "Ownership transferred from [outgoing role occupant] to [incoming role occupant] on [date]"
5. **CODEOWNERS file** is updated in the documentation repository to reflect the new owner

If no incoming owner is identified within 30 days, the document's domain owner (or the Documentation Program Manager for cross-domain documents) becomes the interim owner and the gap is flagged as a finding in the next governance review.

### 4.3 Co-Ownership Prohibition

Documents must not have co-owners. When a document spans multiple domains (example: a procedure that involves both Security and Operations teams), one domain is designated the lead owner. The other domain is assigned as a mandatory reviewer. The lead owner is accountable for the document's lifecycle; the reviewer domain is consulted for accuracy in their area.

**Rationale:** Co-ownership creates diffusion of responsibility. When two teams own a document, neither team feels singularly accountable for its review cadence, and the document lapses.

---

## 5. Review Cadence Table

### 5.1 Standard Review Cadence by Document Type and Criticality

The review cadence table defines how frequently each document type must be reviewed. The cadence varies by the document's criticality classification: Critical, Standard, or Reference.

**Criticality classification:**

- **Critical:** Documents that directly affect security operations, compliance posture, or incident response capability. Incorrect or stale critical documents create immediate operational risk.
- **Standard:** Documents that support day-to-day operations and engineering practices. Stale standard documents create operational friction but not immediate risk.
- **Reference:** Documents that provide lookup information (API references, configuration tables, glossaries). Stale reference documents are caught by drift detection before they cause operational harm.

| Document Type | Criticality | Review Cadence | Review Window | Staleness Threshold | Merge Blocking |
|---|---|---|---|---|---|
| Policy — Enterprise | Critical | Annual | 30-day review window | 395 days (annual + 30-day grace) | Yes |
| Policy — Domain | Critical | Annual | 30-day review window | 395 days | Yes |
| Standard | Critical | Annual (or on technology change) | 30-day review window | 395 days | Yes |
| Procedure — Security | Critical | Bi-annual | 14-day review window | 195 days (bi-annual + 14-day grace) | Yes |
| Procedure — Operational | Standard | Bi-annual | 14-day review window | 195 days | Yes |
| Procedure — IT | Standard | Bi-annual | 14-day review window | 195 days | Yes |
| SOP | Standard | Bi-annual | 14-day review window | 195 days | Yes |
| Guideline | Standard | Annual | 30-day review window | 395 days | No (warning only) |
| Control | Critical | Continuous (per control testing cycle) | Per testing schedule | 90 days since last test | Yes |
| System Security Plan | Critical | Annual (or on system change) | 30-day review window | 395 days | Yes |
| POA&M | Critical | Quarterly | 7-day review window | 97 days | Yes |
| AI-Generated — Reference | Reference | 90 days (tied to drift detection) | 14-day review window | 104 days | Per drift config |
| AI-Generated — SOP Draft | Standard | 180 days (after initial review) | 14-day review window | 194 days | Yes |
| AI-Adapted — Audience Variant | Reference | When canonical source changes | 14-day review window | N/A (triggered by source change) | Yes |

### 5.2 Trigger-Based Review Requirements

In addition to scheduled cadence reviews, the following events trigger an immediate review regardless of the document's next scheduled review date:

| Trigger Event | Documents Affected | Response Time |
|---|---|---|
| Security incident involving a documented process | All procedures and SOPs referenced during incident response | 14 calendar days after incident closure |
| Regulatory framework update (new NIST revision, ISO amendment) | All policies and standards referencing the updated framework | 90 calendar days after framework publication |
| System architecture change (migration, decommission, major upgrade) | All procedures, SOPs, and SSPs referencing the changed system | 30 calendar days after change implementation |
| Failed compliance audit finding | The specific document(s) cited in the finding | 30 calendar days after finding notification |
| AI tool capability change (model update, prompt change) | All AI-generated and AI-adapted documents produced by the changed tool | 60 calendar days after tool change |
| Organizational restructuring (team merge, role elimination) | All documents owned by affected roles | 30 calendar days after restructuring effective date |

### 5.3 Review Cadence Enforcement

Review cadences are enforced through three mechanisms operating together:

1. **Automated reminders:** The pipeline generates review reminders at the following intervals:
   - 30 days before the review due date (for Critical documents)
   - 14 days before the review due date (for Standard and Reference documents)
   - On the review due date
   - Weekly after the review due date until review is completed or escalation occurs

2. **Merge blocking:** After the staleness threshold is exceeded, the drift detection system blocks PRs that modify code referenced by the stale document (M3 Section 8.5).

3. **Dashboard visibility:** Stale documents appear on the quality metrics dashboard (M3 Section 9) in the "Team Documentation Health" panel, visible to team leads and the Documentation Program Manager.

---

## 6. Lifecycle State Machine

### 6.1 Extended State Machine

The lifecycle state machine defined in M1 Section 4 governs individual document transitions. This section extends that state machine with pipeline integration points and AI-specific states, creating the complete governance-level state machine.

```
                              ┌─────────────────────────────────────┐
                              │                                     │
              ┌───────────► Review ──────────────────────┐         │
              │               ▲                           │         │
              │               │ [AI: Tier 1 pass]         │         │
     ┌────────┤               │                           │         │
     │        │         AI-Generated                      │         │
     │     Draft             Draft                        │         │
     │        ▲          (Pattern output)                 │         │
     │        │                                           │         │
     │        │  [Owner submits]                          │         │
     │        │                     [SME + compliance     │         │
     │        │                      sign-off]            │         │
     │        │                          ▼                │         │
     │        │                      Approved             │         │
     │        │                          │                │         │
     │        │       [Publication       │                │         │
     │        │        date set]         ▼                │         │
     │        │                     Published ◄───────────┘         │
     │        │                          │  ▲                       │
     │        │  [Scheduled review       │  │ [Update approved]     │
     │        │   or change event        │  │                       │
     │        │   or trigger event]      ▼  │                       │
     │        │                    Under Review                     │
     │        │                          │                          │
     │        │  [Revision needed]       │                          │
     │        └──────────────────────────┘                          │
     │                                   │                          │
     │                                   │ [Archive with            │
     │                                   │  timestamp]              │
     │                                   ▼                          │
     │                               Retired ───────────────────────┘
     │                                   │
     │        [Reactivation              │ [Successor doc
     │         with new draft]           │  exists]
     └───────────────────────────────────┘
```

### 6.2 State Definitions with Pipeline Integration

| State | Definition | Pipeline Enforcement | AI-Specific Rules |
|---|---|---|---|
| **Draft** | Document is being authored or revised. Not authoritative. | Document exists on a feature branch. No merge to main permitted. | Human-authored documents enter Draft normally. |
| **AI-Generated Draft** | Document has been produced by an AI pattern but has not passed Tier 1 automated validation. | AI generation output exists on `ai-draft/*` branch. Tier 1 checks run automatically. | AI-generated documents start here, not in Draft. Tier 1 must pass before advancing to Review. |
| **Review** | Draft is complete and submitted for stakeholder review. | PR is open. Required reviewers assigned via CODEOWNERS. CI checks passed. | AI-generated documents: [PENDING REVIEW] label must be present. Tier 2 review explicitly required. |
| **Approved** | All required reviewers have signed off. Ready for publication. | All required PR approvals present. No outstanding change requests. | AI-generated documents: [PENDING REVIEW] label removed by reviewer. `ai_provenance.review_status` set to `reviewed`. |
| **Published** | Document is live, authoritative, available to its audience. | PR merged to main. Auto-deploy publishes to documentation portal. | [AI-GENERATED] or [AI-ASSISTED] label remains permanently for provenance. |
| **Under Review** | Published document has entered a review cycle. Current version remains authoritative. | Review reminder generated. If staleness threshold exceeded, merge blocking activates. | AI-adapted variants are also flagged for review when canonical source enters Under Review. |
| **Retired** | No longer authoritative. Archived with timestamp and successor pointer. | Document moved to `docs/archive/` directory. Redirect configured from old URL. Drift detection exemption added. | AI-generated retired documents are excluded from gap analysis (Pattern 6) to avoid false positives. |

### 6.3 Gate Criteria Summary

The following table consolidates all gate criteria across the operational modules (M1, M3, M5) into a single governance reference.

| Transition | Gate Criteria | Enforcement Mechanism | Source Module |
|---|---|---|---|
| Draft → Review | All metadata fields populated. All body sections present. Referenced documents exist and are Published. Safety rules applied (SC-01 through SC-04). Writing standards met. | Pre-PR checklist in PR template. CI lint validation. | M1 Section 4.3 |
| AI-Generated Draft → Review | All Tier 1 automated checks passed (structure, metadata, safety, links, terminology). [PENDING REVIEW] label applied. | CI pipeline (Tier 1 gate). Branch naming convention (`ai-draft/*`). | M5 Section 11.2 |
| Review → Approved | SME sign-off (technical accuracy). Compliance sign-off (framework alignment). For AI-generated: Tier 2 review completed with hallucination check. | Required PR approvals in CODEOWNERS. PR label checks. | M1 Section 4.3, M5 Section 11.2 |
| Approved → Published | Publication date set. Distribution list defined. Previous version queued for retirement. Document indexed in repository. | Merge to main triggers auto-deploy. Version tag applied. | M1 Section 4.3 |
| Published → Under Review | Scheduled cadence elapsed OR trigger event occurred. | Automated staleness monitoring. Trigger event detection. | M1 Section 4.3, this module Section 5.2 |
| Under Review → Published | Revised document passes Draft → Review → Approved sequence. Version incremented. Previous version archived. | Standard PR workflow. | M1 Section 4.3 |
| Published → Retired | Retirement reason documented. Archive timestamp recorded. Successor pointer set. Distribution list notified. | PR to move document to archive directory. Redirect configured. | M1 Section 4.3 |

---

## 7. Escalation Paths

### 7.1 Escalation Framework

Escalation paths define what happens when the governance model is not followed. Each escalation path has defined trigger conditions, response timelines, and resolution authorities.

### 7.2 Stale Document Escalation

**Trigger:** A document's review cadence has elapsed and no review has been initiated.

| Timeline | Action | Responsible Party |
|---|---|---|
| Day 0 | Review due date reached. Automated reminder sent to document owner. | Pipeline automation |
| Day 7 | Second reminder sent. Team lead CC'd. Document appears in yellow status on dashboard. | Pipeline automation |
| Day 14 | Warning deadline. Merge blocking activates for related code changes. Owner and manager notified. | Pipeline automation + Documentation Program Manager |
| Day 21 | Escalation to department head. Documentation Program Manager initiates contact to determine if the owner role is still actively occupied. | Documentation Program Manager |
| Day 30 | Critical violation. [REVIEW REQUIRED] banner published on the live document. Finding entered in the quarterly compliance report. If the document is compliance-sensitive, ISSO is notified. | Documentation Program Manager + Compliance Lead |
| Day 60 | Unresolved stale document treated as a potential governance failure. Documentation Program Manager and Compliance Lead jointly escalate to CISO or equivalent. Document may be moved to Retired state if no owner can be identified. | CISO / Governance Body |

### 7.3 Missing Owner Escalation

**Trigger:** A document's owner role is vacant (person left the organization, role eliminated, or owner field contains "TBD").

| Timeline | Action | Responsible Party |
|---|---|---|
| Day 0 | Ownership vacancy detected (CODEOWNERS change, HR notification, or governance audit). | Documentation Program Manager |
| Day 1 | Domain owner notified. If no domain owner exists, Documentation Program Manager assumes interim ownership. | Documentation Program Manager |
| Day 14 | If permanent owner not identified, escalate to department head with a request to assign ownership. | Documentation Program Manager |
| Day 30 | If still unresolved, all documents owned by the vacant role are flagged as "orphaned" on the dashboard. Merge blocking activates for related changes. | Documentation Program Manager + Compliance Lead |

### 7.4 Disputed Content Escalation

**Trigger:** Reviewers disagree on document content during the Review state, and the disagreement cannot be resolved through normal PR discussion.

| Step | Action | Responsible Party |
|---|---|---|
| 1 | Document owner convenes a synchronous meeting with all disputants. Meeting is scheduled within 5 business days. | Document Owner |
| 2 | If consensus is not reached in the meeting, document owner proposes a written resolution and circulates it for asynchronous review (3 business day deadline). | Document Owner |
| 3 | If asynchronous review does not produce consensus, the dispute escalates to the domain owner or working group chair for a binding decision. | Domain Owner / Working Group Chair |
| 4 | Final authority rests with the role defined in the approval block for the document type: CISO for security policies, Department Head for operational procedures, Governance Body for enterprise policies. The decision is recorded in the document's revision history. | Approval Authority |

### 7.5 AI Content Dispute Escalation

**Trigger:** A reviewer identifies a concern with AI-generated content that cannot be resolved by the standard review process (e.g., reviewer suspects hallucinated content but cannot verify, or reviewer disagrees with the AI authorship decision for this document type).

| Step | Action | Responsible Party |
|---|---|---|
| 1 | Reviewer flags the concern in the PR with the label `ai-content-dispute`. | Reviewer |
| 2 | Documentation Engineering Lead reviews the flag within 3 business days. The review determines: (a) whether the AI-generated content should be replaced with human-authored content, (b) whether the AI pattern is appropriate for this document type per the M5 decision framework. | Documentation Engineering Lead |
| 3 | If the dispute concerns factual accuracy, the SME for the document's domain makes the determination. If the dispute concerns appropriateness of AI authorship for the document type, the Documentation Program Manager makes the determination in consultation with the M5 decision framework. | SME or Documentation Program Manager |
| 4 | Resolution is recorded in the PR. If the resolution changes the AI authorship policy for a document type, M5 is updated through the standard document change process. | Documentation Program Manager |

### 7.6 Emergency Publication

**Trigger:** A critical security policy or procedure must be published without completing the normal review cycle (e.g., zero-day vulnerability requires immediate procedure update).

| Step | Action | Responsible Party |
|---|---|---|
| 1 | Document owner and CISO co-sign an emergency publication authorization. | Document Owner + CISO |
| 2 | Document is published with lifecycle state "Under Review" (not "Published"). The document metadata includes an `emergency_publication` flag with the authorization date and the committed review completion date (not to exceed 30 calendar days). | Document Owner |
| 3 | The document bypasses the merge blocking checks through a pipeline override (requires CISO approval token). The override is logged in the CI pipeline audit trail. | Pipeline automation + CISO |
| 4 | Within 30 calendar days, the document completes the standard review cycle (Draft → Review → Approved → Published). The emergency publication flag is removed. | Document Owner + Reviewers |
| 5 | If the standard review is not completed within 30 days, the escalation path for stale documents (Section 7.2) activates at the Day 14 level. | Documentation Program Manager |

---

## 8. AI Content Governance

### 8.1 AI Authorship Policy

This section codifies the governance rules for AI-generated and AI-adapted documentation, integrating the decision framework from M5 Section 10 and the review gates from M5 Section 11 into the unified governance model.

### 8.2 When AI May Draft

AI may generate first drafts for the following document types, subject to the review gates specified:

| Document Type | AI Pattern Permitted | Required Review Gate | Additional Conditions |
|---|---|---|---|
| API reference documentation | Pattern 2 (Reference Synthesis) | Tier 1 + Tier 2 | Must validate against staging environment |
| Configuration reference documentation | Pattern 2 (Reference Synthesis) | Tier 1 + Tier 2 | Must validate against JSON/YAML schema |
| Inline documentation (docstrings) | Pattern 1 (Inline Generation) | Code author review at commit | No additional gate required |
| SOP first drafts | Pattern 3 (SOP First Draft) | Tier 1 + Tier 2 (SME walkthrough) | SME walkthrough must be documented in PR |
| Audience-adapted variants | Pattern 5 (Audience Adaptation) | Tier 1 + Tier 2 | Canonical source must be in Published state |
| Gap analysis reports | Pattern 6 (Gap Analysis) | Manual verification by Doc Program Manager | Not published as documentation; used as planning input |
| Glossary entries | Pattern 1 variant | Tier 1 + Tier 2 | Must verify against organizational definitions |
| Release notes | Commit history analysis | Tier 1 + Tier 2 | Human reviews for accuracy and tone |

### 8.3 When AI Must NOT Draft

AI must not generate the initial content for the following document types. AI may assist with formatting, template population, and metadata pre-filling only.

| Document Type | Reason AI Must Not Draft | Permitted AI Assistance |
|---|---|---|
| Security policies | Compliance sensitivity; legal language requirements; organizational intent | Template structure generation; metadata pre-fill |
| Architecture decision records | Requires design rationale that AI cannot infer | Formatting only |
| Incident response procedures | High consequence of error; requires operational experience | Template structure generation |
| Risk assessment narratives | Requires judgment and organizational context | Formatting; framework reference lookup |
| Compliance evidence documentation | Must directly reflect actual implementation | Metadata pre-fill from SSP |
| Privacy impact assessments | Legal and regulatory specificity | Template structure generation |
| System Security Plans (narrative sections) | Requires system-specific operational knowledge | Control listing pre-fill from framework |
| Emergency publication documents | Time pressure makes review gates infeasible for AI content | None during emergency |

### 8.4 AI Content Review Requirements Summary

| Review Tier | Scope | Applies To | Enforced By |
|---|---|---|---|
| **Tier 1: Automated** | Structure, metadata, safety rules, links, terminology | All AI-generated documents | CI pipeline (blocks PR) |
| **Tier 2: SME Technical** | Accuracy, completeness, missing context, hallucination check | All AI-generated documents | CODEOWNERS (required reviewer) |
| **Tier 3: Compliance** | Framework alignment, approval blocks, regulatory language | Compliance-sensitive AI-generated documents | Compliance team (required reviewer) |
| **Commit-time review** | Code author verifies docstrings | Inline generation (Pattern 1) only | Pre-commit hook (advisory) |
| **SME Walkthrough** | Step-by-step verification | SOP first drafts (Pattern 3) | PR review documentation requirement |
| **Staging Validation** | Automated testing against live system | Reference synthesis (Pattern 2) | CI pipeline (staging test step) |

### 8.5 AI Provenance Tracking

All AI-generated and AI-adapted documents must include the `ai_provenance` metadata block defined in M5 Section 13.3. The governance model requires:

1. The `ai_provenance` block is populated at generation time and never removed
2. The `review_status` field is updated by the reviewer, not by the document author
3. The `generation_pattern` field must reference one of the six patterns defined in M5
4. AI provenance metadata is included in compliance evidence packages when applicable

---

## 9. Compliance Integration

### 9.1 Governance Model Mapping to NIST 800-53 PM Family

The NIST 800-53 R5 Program Management (PM) control family establishes requirements for security program governance that directly apply to documentation governance. The following table maps governance model components to PM controls.

| PM Control | Control Name | Governance Model Component | How Satisfied |
|---|---|---|---|
| PM-1 | Information Security Program Plan | Unified Governance Model (this document) | This module serves as the documentation governance component of the information security program plan |
| PM-2 | Information Security Program Leadership Role | Governance Roles (Section 11) | Documentation Program Manager role; CISO escalation authority |
| PM-3 | Information Security and Privacy Resources | Review Cadence Enforcement (Section 5.3) | Resource allocation for review cycles; maintenance budgeting for AI-generated documents |
| PM-5 | System Inventory | Gap Analysis (M5 Pattern 6) | AI-powered gap analysis maintains documentation inventory aligned with system inventory |
| PM-9 | Risk Management Strategy | AI Content Governance (Section 8) | AI authorship decision framework accounts for risk by document type |
| PM-10 | Authorization Process | Lifecycle State Machine (Section 6) | Published state requires approval authority sign-off; SSP authorization process in M4 |
| PM-14 | Testing, Training, and Monitoring | Review Cadence (Section 5); Quality Gates (Section 10) | Automated monitoring of documentation health; review cadence enforcement |
| PM-15 | Security and Privacy Groups and Associations | Escalation Paths (Section 7) | Working group ownership model; disputed content escalation |
| PM-28 | Risk Framing | MCR/DSR Framework (M4 Section 4) | Documentation prioritization based on mandatory vs desired requirements |
| PM-31 | Continuous Monitoring Strategy | Drift Detection (M3 Section 8); AI Drift (M5 Pattern 4) | Automated and AI-augmented continuous monitoring of documentation currency |

### 9.2 Governance Model Mapping to ISO 27001:2022

| ISO 27001 Clause | Requirement | Governance Model Component |
|---|---|---|
| 5.2 (Policy) | Top management shall establish an information security policy | Enterprise policy ownership in Ownership Matrix (Section 4); Governance Body approval |
| 5.3 (Organizational Roles) | Top management shall assign roles and responsibilities | Governance Roles (Section 11); Ownership Matrix (Section 4) |
| 7.5.1 (Documented Information — General) | ISMS shall include documented information required by this standard | Gap Analysis (M5 Pattern 6); Framework-to-Artifact Matrix (M4 Section 6) |
| 7.5.2 (Creating and Updating) | Documented information shall be appropriately identified, formatted, reviewed, and approved | Lifecycle State Machine (Section 6); Gate Criteria (Section 6.3) |
| 7.5.3 (Control of Documented Information) | Documented information shall be available, suitable for use, and adequately protected | Pipeline-Integrated Gates (Section 3.3); Auto-deploy (M3); Access controls |
| 9.1 (Monitoring, Measurement, Analysis, Evaluation) | Organization shall evaluate information security performance | Quality Gate Enforcement (Section 10); Dashboard (M3 Section 9) |
| 9.2 (Internal Audit) | Organization shall conduct internal audits at planned intervals | Review Cadence (Section 5); Governance audit quarterly review |
| 10.1 (Continual Improvement) | Organization shall continually improve the ISMS | Escalation resolution tracking; Dashboard trend analysis; AI pattern effectiveness metrics |

### 9.3 Cross-Framework Harmonization Through Governance

The governance model enables cross-framework harmonization by ensuring that a single document can satisfy requirements from multiple frameworks simultaneously (as described in M4 Section 9.4). The governance mechanism is the `framework_refs` metadata field:

- Every document's frontmatter includes `framework_refs` listing all framework controls it satisfies
- The Compliance Lead maintains the framework reference index (M4 source index)
- When an auditor requests evidence for a specific control, they search by `framework_refs` to find the document(s) that satisfy it
- The search returns a single document that satisfies multiple frameworks, rather than duplicate documents for each framework

This harmonization reduces the documentation maintenance burden by eliminating framework-specific document duplication while maintaining full traceability for each framework's audit process.

---

## 10. Quality Gate Enforcement Model

### 10.1 Quality Gate Architecture

The governance model enforces quality through a layered gate architecture. Each gate is implemented as a pipeline check, a review requirement, or a dashboard alert.

```
DOCUMENT QUALITY GATES
══════════════════════════════════════════════════════════

Layer 1: AUTHORING GATES (pre-commit)
─────────────────────────────────────
├── Spell check (cspell)
├── Style lint (Vale)
├── Metadata field validation
└── AI inline docs review (Pattern 1)

Layer 2: SUBMISSION GATES (CI pipeline)
───────────────────────────────────────
├── Structure validation (template compliance)
├── Link validation (lychee)
├── Safety rule compliance (SC-01 through SC-04)
├── AI Tier 1 checks (if AI-generated)
└── Build verification (MkDocs/Hugo)

Layer 3: REVIEW GATES (PR review)
─────────────────────────────────
├── SME technical review (all documents)
├── Compliance review (compliance-sensitive)
├── AI Tier 2 review (AI-generated documents)
├── AI Tier 3 review (compliance-sensitive AI docs)
└── SME walkthrough (SOP drafts)

Layer 4: PUBLICATION GATES (merge)
──────────────────────────────────
├── All required approvals present
├── No outstanding change requests
├── [PENDING REVIEW] labels removed
├── Version number incremented
└── Review date updated in frontmatter

Layer 5: MAINTENANCE GATES (post-publish)
─────────────────────────────────────────
├── Drift detection (standard + AI-augmented)
├── Staleness monitoring
├── Gap analysis (weekly)
└── Dashboard health checks
```

### 10.2 Gate Failure Handling

| Gate | Failure Mode | Consequence | Resolution Path |
|---|---|---|---|
| Layer 1 (Authoring) | Style violation, spelling error | Commit blocked locally | Author fixes locally, re-commits |
| Layer 2 (Submission) | Structure invalid, links broken, safety rule violation | PR CI check fails; PR cannot be reviewed | Author fixes on branch, pushes update |
| Layer 3 (Review) | Reviewer requests changes | PR blocked from merge | Author addresses feedback, re-requests review |
| Layer 4 (Publication) | Missing approval, outstanding change request | PR cannot merge | Author obtains remaining approvals |
| Layer 5 (Maintenance) | Drift detected, staleness threshold exceeded | Merge blocking for related PRs; dashboard alert | Owner reviews and updates document |

---

## 11. Governance Roles and Responsibilities

### 11.1 Consolidated RACI Matrix

The following matrix consolidates the roles and responsibilities from all operational modules (M1, M3, M4, M5) into a single governance-level RACI.

**R** = Responsible (does the work)  
**A** = Accountable (approves/signs off)  
**C** = Consulted (provides input)  
**I** = Informed (receives status)

| Activity | Document Owner | SME | Compliance Officer | Dept Head | Doc Program Manager | CISO | Governance Body | Doc Eng Lead |
|---|---|---|---|---|---|---|---|---|
| Draft document | R | C | C (if compliance) | I | I | I (if policy) | — | C (if AI) |
| Review document | A | R | R (if compliance) | C | I | I (if policy) | — | R (if AI) |
| Approve document | — | — | A (policy/standard) | R (procedure) | — | A (enterprise policy) | A (enterprise policy) | — |
| Publish document | R | — | — | — | I | I | I | — |
| Review cadence enforcement | R (initiates) | — | C | I | A (monitors) | I | — | — |
| Escalation resolution | C | C | C | R (procedures) | A (coordination) | A (policies) | A (enterprise) | — |
| AI generation decision | — | C | C | — | A | — | — | R |
| AI content review (Tier 2) | — | R | — | — | I | — | — | A |
| AI content review (Tier 3) | — | C | R | — | I | — | — | I |
| Ownership transfer | R (outgoing) | — | — | I | A | — | — | — |
| Pipeline maintenance | — | — | — | — | I | — | — | R |
| Dashboard review | C | — | C | I | R (weekly) | I (monthly) | — | C |
| Gap analysis review | C | C | C | — | R | — | — | C |

### 11.2 Documentation Program Manager

The Documentation Program Manager is the central governance role. This role does not own individual documents — it owns the governance system itself. Responsibilities:

- Maintaining this governance model and updating it as organizational needs change
- Monitoring the quality metrics dashboard weekly and escalating red-status metrics
- Coordinating ownership transfers when roles change
- Resolving governance disputes that cannot be resolved at the domain level
- Reporting documentation program health to leadership quarterly
- Managing AI documentation tooling and pattern effectiveness evaluation
- Coordinating with the Compliance Lead on framework applicability changes

### 11.3 Documentation Engineering Lead

The Documentation Engineering Lead owns the pipeline infrastructure and AI documentation tooling. Responsibilities:

- Maintaining CI/CD pipeline configurations (M3 workflow files)
- Configuring and tuning AI documentation tools (M5 patterns)
- Maintaining drift detection configuration and thresholds
- Resolving AI content disputes (Section 7.5)
- Evaluating new AI documentation tools and patterns
- Training document authors on pipeline workflow and AI tool usage

---

## 12. Implementation and Adoption

### 12.1 Adoption Sequence

Organizations adopting this governance model should implement it in phases to avoid overwhelming existing documentation practices.

**Phase 1: Ownership and Lifecycle (Weeks 1–4)**

- Populate the Ownership Matrix for all existing documents
- Update all document frontmatter with ownership, review cadence, and lifecycle state fields
- Configure CODEOWNERS in the documentation repository
- Establish the Documentation Program Manager role (or assign the responsibility to an existing role)

**Phase 2: Review Cadence Enforcement (Weeks 5–8)**

- Configure automated review reminders in the CI/CD pipeline
- Establish staleness thresholds per the Review Cadence Table
- Activate merge blocking for Critical documents that exceed staleness thresholds
- Conduct initial review of all documents with lapsed review dates

**Phase 3: Escalation Paths (Weeks 9–12)**

- Document and communicate the escalation paths to all document owners
- Conduct a tabletop exercise: simulate a stale document escalation from Day 0 through Day 60
- Verify that escalation contacts (managers, department heads, CISO) are aware of their role in the governance model

**Phase 4: AI Governance Integration (Weeks 13–16)**

- Implement AI content labeling standards in the documentation repository
- Configure AI Tier 1 automated checks in the CI pipeline
- Train reviewers on AI-specific review checklist (M5 Section 11.4)
- Conduct pilot: select 3–5 document types for AI generation and measure review pass rates

**Phase 5: Dashboard and Continuous Improvement (Weeks 17–20)**

- Deploy the quality metrics dashboard with governance-specific panels
- Establish the weekly dashboard review cadence
- Conduct first quarterly governance review: assess adoption, identify friction points, update thresholds
- Publish first quarterly compliance report incorporating documentation governance metrics

### 12.2 Measuring Governance Effectiveness

| Metric | Description | Target | Measurement Frequency |
|---|---|---|---|
| Ownership coverage | % of documents with a valid, active owner | 100% | Monthly |
| Review cadence compliance | % of documents reviewed within their cadence | > 95% | Monthly |
| Escalation count | Number of escalations triggered per quarter | < 5 (declining trend) | Quarterly |
| Mean escalation resolution time | Average days from escalation trigger to resolution | < 14 days | Quarterly |
| AI review pass rate (Tier 2) | % of AI-generated documents passing SME review on first submission | > 70% | Monthly |
| Orphaned document count | Documents with no valid owner | 0 | Monthly |
| Merge blocks triggered | PRs blocked by stale documentation per month | < 3 (declining trend) | Monthly |
| Cross-framework coverage | % of applicable framework controls with a mapped document | > 95% | Quarterly |

---

## 13. Related Documents

- M1: Foundations and Taxonomy of Technical Documentation
- M2: Structured Authoring Systems
- M3: Docs-as-Code Pipeline
- M4: Compliance and Regulatory Frameworks
- M5: AI Documentation Pattern Library
- Mission Schema (schema.json)
- SKILL-documentation-generator (GSD skill for document generation)

---

## 14. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-05 | Documentation Program Management | Initial publication — synthesized from M1, M3, M4, M5 |
