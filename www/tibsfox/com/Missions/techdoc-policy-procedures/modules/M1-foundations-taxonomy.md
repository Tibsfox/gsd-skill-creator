---
id: M1-foundations-taxonomy
title: "Module 1: Foundations and Taxonomy of Technical Documentation"
type: reference
owner: Technical Documentation Mission
lifecycle_state: Published
review_cadence: Annual
audience: [senior_engineer, new_hire, compliance_auditor, operations_staff, product_manager]
framework_refs: [nist-800-53, nist-800-100, iso-27001, iso-27002, scf, usu-ewc, uk-home-office]
scope: "All documentation produced for technical systems, security policies, and operational procedures"
purpose: "Establish a common taxonomy, lifecycle model, governance structure, and writing standards for technical documentation across all document types"
version: "1.0"
last_reviewed: "2026-04-05"
next_review: "2027-04-05"
---

# Module 1: Foundations and Taxonomy of Technical Documentation

## Table of Contents

1. [Introduction](#1-introduction)
2. [The Documentation Hierarchy](#2-the-documentation-hierarchy)
3. [Document Type Definitions and Examples](#3-document-type-definitions-and-examples)
4. [Document Lifecycle State Machine](#4-document-lifecycle-state-machine)
5. [Audience Personas and Content Strategy](#5-audience-personas-and-content-strategy)
6. [Technical Writing Standards](#6-technical-writing-standards)
7. [Governance Structures](#7-governance-structures)
8. [Document Templates and Field Definitions](#8-document-templates-and-field-definitions)
9. [Mapping Documentation Types to Frameworks](#9-mapping-documentation-types-to-frameworks)
10. [Common Anti-Patterns and How to Avoid Them](#10-common-anti-patterns-and-how-to-avoid-them)
11. [Source Index and Citations](#11-source-index-and-citations)

---

## 1. Introduction

Documentation is the institutional memory of an engineering organization. Without it, decisions evaporate, compliance gaps multiply, and onboarding costs compound. Yet most organizations produce documentation in an ad hoc fashion — mixing policy language with procedure steps, omitting ownership fields, and letting documents age past their review dates without a structured lifecycle to catch them.

This module establishes the foundational concepts, vocabulary, and governance models that make documentation a managed asset rather than an afterthought. It is grounded in recognized frameworks: the National Institute of Standards and Technology (NIST) Special Publications 800-53 and 800-100, ISO/IEC 27001:2022 and 27002:2022, and the Secure Controls Framework (SCF). Where those frameworks define requirements, this module provides the implementation patterns.

The taxonomy presented here applies across documentation types — from top-level governance policies that bind entire organizations, down to step-by-step runbooks that guide an on-call engineer through a 3 a.m. incident. The same structural discipline applies at each level.

**Who should read this module:**

- New technical writers establishing a documentation practice
- Engineering managers setting documentation standards for their teams
- Compliance auditors reviewing documentation completeness against a framework
- Platform engineers building automated document management tooling
- Senior engineers evaluating whether existing documentation is structurally sound

**What this module does not cover:**

- Authoring system tool selection (covered in Module 2)
- API reference generation from code annotations
- Real-time runbook execution or incident management tooling

---

## 2. The Documentation Hierarchy

Technical documentation exists in a hierarchy. Documents at higher levels define obligations; documents at lower levels explain how to meet them. This hierarchy is not optional — collapsing it (for example, writing policy-level language directly into a procedure) produces documents that are simultaneously too rigid for operational use and too vague for compliance verification.

The hierarchy has five distinct levels, derived from the governance structures established in NIST SP 800-53 R5 (Control Families PM, PL, SA), NIST SP 800-100 (Chapter 4, Policy and Procedures), ISO/IEC 27001:2022 (Clause 5.2, Policy; Annex A), and the Secure Controls Framework (SCF) policy-standard-procedure layering model.

### 2.1 Complete Documentation Hierarchy Table

| Level | Type | Binding | Voice | Typical Author | Approval Body | Review Cadence | Source Framework |
|-------|------|---------|-------|----------------|---------------|----------------|-----------------|
| 1 | Policy | Yes | Third person | CISO / VP Engineering | Board / Governance Committee | Annual or on material change | NIST 800-53 PM-1, ISO 27001 Clause 5.2 |
| 2 | Standard | Yes | Third person | Security Architect / Engineering Lead | CISO + Legal | Annual or on technology change | NIST 800-53 SA-8, ISO 27002 5.1 |
| 3 | Procedure | Yes | Second person | Operations / Engineering | Department Head + SME | Bi-annual or on process change | NIST 800-100 Chapter 4, ISO 27002 5.37 |
| 4 | Guideline | No | Second person | Engineering Team / Platform | Team Lead or Architect | Annual | ISO 27002 5.1, SCF |
| Cross-cutting | Control | Yes | Third person | Security Engineering | Risk Committee | Continuous (tied to control testing cycle) | NIST 800-53 R5, ISO 27005 |

**Reading the table:** Binding means the document imposes an obligation that must be followed. Voice applies to the body text of the document, not its metadata fields. "Cross-cutting" for controls means they can reference and constrain documents at any level of the hierarchy.

### 2.2 Hierarchy Relationships

Policies delegate specificity downward. A policy says what must be done; a standard says how it must be measured; a procedure says who does what in what order; a guideline offers options when the procedure leaves room for judgment.

The failure mode to avoid is **level collapse**: merging two levels into a single document. Examples of level collapse:

- A "policy" document that contains numbered steps (this is actually a procedure embedded in a policy)
- A "procedure" that says "use industry best practices" without specifying what those are (this is deferring downward without resolving the specification)
- A "standard" that includes a section titled "Recommendations" (recommendations belong in guidelines, not binding standards)

Controls operate differently from the four-level hierarchy. A control is a safeguard or countermeasure — it is the mechanism that implements the requirement stated in a policy or standard. Controls are tested, evidenced, and tracked in a risk register or GRC tool. Their documentation describes what the control does, who owns it, and what evidence demonstrates it is operating effectively. NIST 800-53 R5 catalogs 1,189 controls across 20 control families; each family has a policy and procedures requirement (the "-1" control in each family, e.g., AC-1 for Access Control).

---

## 3. Document Type Definitions and Examples

Each document type has a distinct purpose, structure, and failure mode. The definitions below are sourced from the frameworks cited in Section 2. The examples are concrete — they describe real operational scenarios in information technology and engineering organizations, not generic placeholders.

### 3.1 Policy

**Definition:** A policy is a high-level statement of organizational intent, obligation, and accountability. It defines what must be achieved, not how to achieve it. Policies are mandatory and are approved at the organizational governance level.

**Source:** NIST SP 800-53 R5, Control PM-1 (Information Security Program Plan) states: "The organization develops, documents, and disseminates to [all personnel] an information security policy that: Addresses purpose, scope, roles, responsibilities, management commitment, coordination, and compliance." ISO/IEC 27001:2022, Clause 5.2 requires that top management establish an information security policy that is appropriate to the purpose of the organization.

**Key structural characteristics:**

- Written in third person ("The organization must...", "All systems shall...")
- Avoids procedural steps, numbered sequences, or tool-specific instructions
- Includes explicit scope boundaries (what is in scope, what is excluded)
- References applicable law, regulation, or framework without reproducing their text
- Carries formal approval signatures from the governance body

**Concrete example — Patch Management Policy:**

> "All production information systems operated by [Organization] must receive security patches for critical vulnerabilities (CVSS score 9.0 or higher) within 30 calendar days of the vulnerability's public disclosure date. Systems that cannot be patched within this window must be covered by a documented compensating control approved by the Information Security Officer. Exceptions require written approval from the Chief Information Security Officer and must be reviewed every 90 days."

This statement defines the obligation (30-day patching), the threshold (CVSS 9.0+), the compensating control path, and the exception process. It does not explain how to retrieve patches, how to schedule maintenance windows, or what tool to use — those belong in the standard and procedure.

**What does NOT belong in a policy:**

- Step-by-step instructions ("Go to the vendor portal and download patch KB...")
- Tool-specific configuration ("Set the Windows Update Group Policy to...")
- Optional recommendations ("You might also consider...")
- Detailed technical specifications (key lengths, cipher suites)

**Concrete counter-example (level collapse to avoid):**

> WRONG: "Patch Management Policy: 1. Check the vulnerability scanner dashboard weekly. 2. Download patches from the vendor site. 3. Test in staging before production."

This is a procedure masquerading as a policy. It belongs in a Patch Management Procedure document, not in the policy.

**Common policy failures:**
1. **Vague scope:** "All systems" without defining what "systems" means (endpoints? cloud? OT?)
2. **No exception path:** Policies that allow no exceptions create shadow compliance — teams work around them rather than documenting deviations
3. **Unsigned:** A policy without an approval block is an opinion document, not an enforceable policy

---

### 3.2 Standard

**Definition:** A standard specifies the measurable requirements that implement a policy. If a policy says what must be achieved, the standard defines the criteria for determining whether the policy has been met. Standards are mandatory.

**Source:** NIST SP 800-53 R5, Control SA-8 (Security and Privacy Engineering Principles) and the NIST Cybersecurity Framework 2.0 (Govern function, GV.PO-01) establish the relationship between policy and implementing standards. ISACA COBIT 2019 (Governance Objective APO01.08) explicitly distinguishes policies from standards and procedures. The Secure Controls Framework (SCF) defines standards as "mandatory requirements that implement policy" and distinguishes them from procedures, which describe how to implement the standard.

**Key structural characteristics:**

- Written in third person ("Passwords must be...", "Encryption keys shall...")
- Contains specific, measurable criteria (numbers, algorithms, timelines, thresholds)
- References technology-neutral specifications where possible (e.g., "AES-256" rather than "use AWS KMS")
- Avoids procedural steps — the standard says what the end state must be, not how to achieve it
- Is versioned and includes a change log because technology requirements evolve

**Concrete example — Password Standard:**

> "All user accounts authenticating to production systems must comply with the following minimum password requirements:
> 
> - Minimum length: 14 characters
> - Complexity: must include at least one uppercase letter, one lowercase letter, one numeric digit, and one special character from the set: `! @ # $ % ^ & * ( ) _ + - = [ ] { } | ; : ' " , . < > ? /`
> - Maximum age: 90 days for privileged accounts; passwords for non-privileged accounts must not expire if MFA is enforced on every authentication
> - Prohibition on reuse: the last 12 passwords may not be reused
> - Lockout: accounts must lock after 10 consecutive failed authentication attempts
> 
> Service accounts and API tokens are exempt from password rotation requirements provided they are stored in an approved secrets management system and rotated automatically on a schedule not exceeding 365 days."

This standard is measurable. An auditor can verify compliance by checking system configuration against each line item. It implements the password management obligation stated in an information security policy without explaining how to configure the specific identity provider.

**What does NOT belong in a standard:**

- Steps for configuring a specific tool (that belongs in a procedure)
- Optional guidance ("you might also consider longer passwords") — standards are mandatory
- Policy-level purpose statements (the standard implements the policy; it does not restate it)

**Concrete counter-example (level collapse to avoid):**

> WRONG standard mixing in procedure language: "Passwords must be at least 14 characters. To set this in Active Directory: Open Group Policy Management Console, navigate to Computer Configuration > Windows Settings > Security Settings > Account Policies > Password Policy..."

The AD configuration steps belong in a procedure. The standard should define the requirement; the procedure should define the implementation path for a specific environment.

---

### 3.3 Procedure

**Definition:** A procedure is a documented, mandatory sequence of steps that describes how to perform a specific task. Procedures implement standards and policies. They are operational documents — written for the person performing the task, in the voice of that person.

**Source:** NIST SP 800-100 (Information Security Handbook, 2006), Chapter 4: "Procedures are the detailed steps to be followed by users, system operations personnel, or others to accomplish a particular task." ISO/IEC 27002:2022, Control 5.37 (Documented Operating Procedures) requires that "operating procedures for information processing facilities shall be documented and made available to all users who need them."

**Key structural characteristics:**

- Written in second person ("Open the change management ticket", "Navigate to the dashboard")
- Numbered steps in sequential order
- Prerequisite conditions listed before the steps begin
- Expected result stated for each significant step or at key checkpoints
- Troubleshooting section for the most common failure modes
- Explicit termination condition ("the procedure is complete when the change ticket status is Closed")

**Concrete example — Emergency Access Provisioning Procedure:**

> **Prerequisites:**
> - You have an approved emergency access request ticket number (format: EA-YYYYMMDD-NNN)
> - You are a member of the Identity & Access Management team
> - You have verified the requestor's identity via out-of-band communication (phone call to known number or video call)
>
> **Steps:**
>
> 1. Open the IAM console at `iam.internal.example.com` using your administrator credentials.
> 2. Navigate to **Users** > **Emergency Access** > **Create Emergency Account**.
> 3. Enter the requestor's full name and the approved ticket number in the designated fields. Do not use personal email addresses — use the format `emergency-YYYYMMDD-NNN@corp.example.com`.
> 4. Set the account expiration to 8 hours from the current UTC time. The system displays the expiration timestamp in the **Account Validity** field; confirm it matches your calculation before continuing.
> 5. Select the minimum required permission set from the dropdown list. Use only the set labeled **[Emergency - Read Only]** unless the ticket explicitly authorizes elevated write access, in which case escalate to the on-call IAM Lead before proceeding.
> 6. Click **Create Account**. The system displays a one-time password.
> 7. Deliver the credentials to the requestor via the secure credential sharing tool (`vault.internal.example.com/share`), not via email, chat, or phone.
> 8. Record the following information in the ticket: account name, creation timestamp, expiration timestamp, permission set used, delivery method.
> 9. The procedure is complete when all fields in the ticket are populated and the ticket status is **Active - Emergency**.
>
> **Expected result:** The requestor receives emergency access credentials valid for 8 hours. The IAM console shows the account in the Emergency Access active accounts list.
>
> **Troubleshooting:**
> - If the Create Account button is greyed out, verify that you have the IAM Emergency Provisioner role assigned to your account. Contact the IAM Lead.
> - If the ticket number format is rejected, verify that the ticket was created today and that you are entering the correct date segment.

This procedure is concrete, testable, and usable by someone who has never performed the task before. It does not require the reader to infer steps or look up additional documentation to complete the task.

**What does NOT belong in a procedure:**

- Policy justification ("we do this because of the security policy...") — the procedure can reference the policy but should not reproduce it
- Optional steps mixed with mandatory steps without clear labeling
- Vague success criteria ("verify that everything looks correct")

---

### 3.4 Guideline

**Definition:** A guideline provides recommended practices, patterns, or approaches. Unlike policies, standards, and procedures, guidelines are advisory — they represent the organization's recommended approach when multiple valid options exist. Non-compliance with a guideline is not a violation; it is a deviation that may require explanation.

**Source:** ISO/IEC 27002:2022 is itself structured as a guideline document — it provides implementation guidance for the controls in ISO 27001 Annex A but does not impose binding requirements. ISO 27002:2022, Introduction: "This document provides guidance based on internationally recognized best practices for implementing information security controls." The SCF explicitly characterizes guidelines as non-mandatory.

**Key structural characteristics:**

- Written in second person but with advisory language ("Consider using...", "You should evaluate...")
- Uses "should" rather than "shall" or "must"
- Provides rationale for the recommendation
- Acknowledges valid alternatives and when those alternatives are appropriate
- Does not require formal approval at the governance level (team lead or architect review is sufficient)

**Concrete example — Container Image Security Guideline:**

> **Recommended approach:** Use minimal base images for all container workloads.
>
> Consider using a distroless base image (such as `gcr.io/distroless/static-debian12` for static binaries or `gcr.io/distroless/java21-debian12` for JVM workloads) rather than general-purpose distributions such as `ubuntu:22.04` or `debian:bookworm`. Distroless images omit package managers, shells, and non-runtime utilities, reducing the attack surface by removing software that serves no runtime purpose.
>
> **When this guidance applies:** Any containerized workload running in production or staging environments.
>
> **When you might choose differently:**
> - If your application requires dynamic package installation at runtime (uncommon in production workloads, but present in some ML inference scenarios), a minimal distribution such as `alpine:3.19` may be necessary.
> - If your team lacks familiarity with distroless debugging workflows, start with `alpine` and migrate to distroless as your team builds operational confidence.
>
> **Rationale:** The 2024 Snyk Container Security Report found that removing a package manager from a container image eliminates a median of 14 high-severity CVEs per image. Fewer installed packages mean fewer CVEs to track and fewer patch cycles.
>
> **Related standard:** Container Image Hardening Standard (reference: STD-SEC-0023)

**What does NOT belong in a guideline:**

- Mandatory requirements ("must" language) — that belongs in a standard
- Step-by-step procedures — those belong in a procedure document
- Vague platitudes ("use good security practices") without specific recommendation content

---

### 3.5 Control

**Definition:** A control is a safeguard or countermeasure prescribed to meet a security or compliance requirement. Controls are the operational manifestation of policy requirements — they are the mechanisms (technical, administrative, or physical) that produce the evidence demonstrating policy compliance.

**Source:** NIST SP 800-53 R5, Section 1: "Controls can be implemented by people, processes, and/or technology. When controls are implemented correctly, they help organizations manage risk to an acceptable level and satisfy the requirements in applicable laws, executive orders, directives, regulations, policies, standards, and guidelines." NIST 800-53 R5 catalogs 1,189 controls across 20 families. ISO/IEC 27005:2022, Risk Treatment section establishes controls as risk treatment mechanisms. ISO 27001:2022 Annex A lists 93 controls across 4 themes.

**Key structural characteristics:**

- Written in third person ("The system enforces...", "The control validates...")
- References a specific policy, standard, or regulatory requirement it satisfies
- Includes a testable assertion (how to verify the control is operating effectively)
- Carries an owner (the person responsible for ensuring the control is in place)
- Associated with evidence artifacts (logs, reports, configuration exports, scan results)
- Cross-cutting: a single control may satisfy requirements from multiple frameworks simultaneously

**Concrete example — MFA Control:**

> **Control ID:** CTRL-IAM-0041
> **Control Name:** Multi-Factor Authentication for Privileged Access
> **Type:** Technical (preventive)
>
> **Control Statement:** The identity management system enforces multi-factor authentication for all accounts with administrative, privileged, or elevated access to production systems. Authentication must require a second factor from a distinct category (knowledge, possession, or inherence) from the primary credential.
>
> **Policy reference:** Information Security Policy, Section 4.3 (Authentication Requirements)
> **Standard reference:** Authentication Standard STD-SEC-0007
>
> **Framework mappings:**
> - NIST 800-53 R5: IA-2 (Identification and Authentication), IA-2(1) (MFA for Privileged Accounts)
> - ISO 27001:2022 Annex A: 8.5 (Secure Authentication)
> - SOC 2 Type II: CC6.1 (Logical and Physical Access Controls)
>
> **Control owner:** Identity & Access Management Team Lead
>
> **Evidence artifacts:**
> - Monthly MFA enrollment report (all privileged accounts showing MFA enabled)
> - Authentication log sample showing second-factor authentication events
> - Exception report (any privileged accounts without MFA, with documented compensating controls)
>
> **Test procedure:** Pull the privileged account list from the IAM system. Cross-reference against the MFA enrollment report. Any privileged account not in the MFA enrollment report with an active status is a finding. Review exception list for approved compensating controls with valid approval dates.

**What does NOT belong in a control:**

- Policy rationale (the control exists to implement policy; it references the policy, not reproduce it)
- Optional guidance — controls are mandatory by definition
- Implementation steps — those belong in the procedure that deploys the control

---

## 4. Document Lifecycle State Machine

Every document in a managed documentation system has a lifecycle state. The lifecycle prevents documents from becoming stale authoritative sources — a document that has not been reviewed since the technology landscape changed is more dangerous than no document at all, because it gives false confidence.

The lifecycle states and transitions below are derived from NIST SP 800-100, Chapter 4 (document management practices), ISO/IEC 27001:2022, Clause 7.5 (Documented Information), and the Secure Controls Framework document management controls.

### 4.1 State Definitions

| State | Description | Who Holds the Document in This State |
|-------|-------------|--------------------------------------|
| **Draft** | The document is being authored or revised. It has not been reviewed by stakeholders. It is not authoritative and must not be distributed as policy. | Document owner / author |
| **Review** | The draft is complete and has been submitted for stakeholder and subject matter expert review. Comments are being gathered and resolved. | Reviewers + document owner |
| **Approved** | All required reviewers have signed off. The document meets its content requirements and compliance standards. It is ready for publication but not yet published. | Governance body (holding for scheduled publication) |
| **Published** | The document is live, authoritative, and available to its intended audience. It is the version of record. | Document repository / all intended readers |
| **Under Review** | The published document has entered a review cycle (either scheduled or triggered by a change event). The current published version remains authoritative until a new version is approved. | Document owner + reviewers |
| **Retired** | The document is no longer authoritative. It has been superseded, the need no longer exists, or the scope has changed. It is archived with a timestamp and pointer to its successor. | Archive |

### 4.2 State Transition Diagram

```
                    ┌──────────────────────────────────────────────────────┐
                    │                                                      │
          ┌──────► Review ──────────────────────────────────────┐         │
          │                                                      │         │
          │    [Owner submits]   [SME + compliance sign-off]     │         │
          │                                  ▼                   │         │
       Draft                            Approved                 │         │
          ▲                                  │                   │         │
          │              [Publication        │                   │         │
          │               date set]          ▼                   │         │
          │                             Published ◄──────────────┘         │
          │                                  │  ▲                          │
          │    [Scheduled review or          │  │ [Update approved]        │
          │     change event]                ▼  │                          │
          │                           Under Review                         │
          │                                  │                             │
          │    [Revision needed]             │                             │
          └──────────────────────────────────┘                             │
                                             │ [Archive with timestamp]    │
                                             ▼                             │
                                          Retired ──────────────────────────┘
```

### 4.3 Gate Criteria (Transition Requirements)

Each state transition requires specific criteria to be met. Without gate criteria, lifecycle management degrades into a naming convention rather than a governance mechanism.

**Draft → Review**

The document owner is responsible for this transition. Before submitting for review, the owner must verify:

- All required metadata fields are populated (id, title, type, owner, audience, scope, purpose, framework_refs)
- All body sections required by the document type template are present and non-empty
- All referenced documents (related documents, parent policy) exist and are in Published state
- Safety rules applied: no PII in examples (SC-01), no security-sensitive content in public-facing deliverables (SC-02), all statistics have traceable citations (SC-03)
- The document has been spell-checked and meets the writing standards defined in Section 6

**Review → Approved**

This transition requires sign-off from two categories of reviewers:

1. Subject matter expert (SME) sign-off: at least one person with demonstrated expertise in the document's subject matter has reviewed and approved the technical content
2. Compliance sign-off: a compliance, legal, or risk officer has confirmed the document satisfies applicable regulatory or framework requirements

For policy documents, governance body sign-off replaces (or supplements) the SME requirement.

**Approved → Published**

Approval does not automatically trigger publication. The transition to Published requires:

- A publication date set in the document metadata
- Distribution list defined (who receives notification of publication)
- Previous version (if any) queued for retirement or moved to Under Review state
- The document is loaded into the authoritative document repository and indexed

**Published → Under Review**

This transition is triggered by one of two events:

1. **Scheduled review cycle:** The review cadence defined in the document metadata has elapsed. Annual review cycles generate this trigger automatically.
2. **Change event:** A material change in technology, regulation, or organizational structure makes the document potentially stale. Examples: a new regulatory requirement supersedes a referenced standard; the technology the procedure describes is being replaced; an incident reveals a gap in the documented control.

When a document enters Under Review, the currently published version remains authoritative. The Under Review state is not a withdrawal of the document — it is a signal that a revision is in progress.

**Under Review → Published**

A revised document completes the same gate sequence as a new document: Draft → Review → Approved → Published. The version number is incremented. The previous version is archived.

**Published → Retired**

Retirement requires:

- Documented reason for retirement (superseded, scope eliminated, technology replaced, regulatory change)
- Archive timestamp (ISO 8601 format: YYYY-MM-DDTHH:MM:SSZ)
- Pointer to successor document (if one exists)
- Notification to the document's distribution list

Retired documents are not deleted. They are preserved in an archive for audit purposes. The retention period for retired policy documents is typically 7 years, matching the retention requirements in common audit frameworks (SOC 2, ISO 27001 certification cycles). Operational procedures may have shorter retention periods defined by the organization's record retention policy.

### 4.4 Review Cadence Recommendations

| Document Type | Standard Cadence | Trigger-Based Review |
|--------------|------------------|---------------------|
| Policy | Annual | Regulatory change, material security incident, organizational restructuring |
| Standard | Annual or on technology change | New vulnerability class, deprecation of referenced technology, regulatory update |
| Procedure | Bi-annual | System change, process change, audit finding, incident post-mortem action |
| Guideline | Annual | Technology landscape shift, community best practice update |
| Control | Continuous (tied to control testing) | Failed control test, new threat model, system architecture change |

**Rationale for cadence:** NIST SP 800-53 R5, Control PM-1 requires that security policies be "reviewed and updated [at a frequency defined by the organization]." ISO 27001:2022, Clause 7.5.3 requires that documented information be controlled to ensure it is "available and suitable for use." Annual review is the minimum cadence for compliance-relevant documentation; more frequent review is appropriate for procedures that change with system deployments.

---

## 5. Audience Personas and Content Strategy

The same information presented to a senior engineer and a new hire should look very different. A procedure that assumes familiarity with the deployment pipeline is unusable for onboarding. A policy summary that explains every technical term wastes an auditor's time. Effective documentation targets a specific audience persona and is structured to meet that persona's reading mode and content needs.

The personas below are derived from the audience analysis framework in the schema and expanded with reading mode detail sourced from the Utah State University Engineering Writing Center's technical writing standards and the UK Home Office engineering documentation guidance.

### 5.1 Persona Table

| Persona | Role Context | Goal | Reading Mode | Content Needs | Format Preferences |
|---------|-------------|------|--------------|--------------|-------------------|
| **Senior Engineer** | 5+ years in the domain; deep technical fluency; reads documentation to understand constraints and design rationale, not to learn basics | Understand design rationale, edge cases, constraints | Scan headings; deep read specific sections; reference lookups | Architecture decisions, constraint rationale, exception handling, historical context, trade-off analysis | Dense technical prose acceptable; code examples expected; diagrams for system interactions |
| **New Hire** | Joined in the last 90 days; functional technical skills but no organizational context; needs to become productive without interrupting senior staff | Get operational quickly; learn organizational context | Step-by-step; linear read; needs all terms defined | SOPs, runbooks, setup guides, glossary, explicit prerequisite lists, expected result checkpoints | Numbered steps; screenshots acceptable; explicit "you will need X before starting"; glossary links |
| **Compliance Auditor** | External or internal; framework-fluent; looking for evidence of control operation, not technical detail | Verify controls are documented and operating; map documentation to framework requirements | Search by control ID or policy reference; non-linear; cherry-picks sections | Policy hierarchy with explicit framework mappings, control ownership, evidence artifacts, exception logs, approval blocks | Tables and structured metadata preferred; prose less important than completeness of required fields |
| **Operations Staff** | On-call or shift-based; executing repeatable tasks under time pressure; may not have deep design knowledge | Execute the task correctly; avoid mistakes that cause incidents | Follow procedure without deviation; linear; step-by-step | Numbered procedures, decision trees for branching paths, escalation contacts, explicit success criteria, troubleshooting appendix | Short sentences; numbered steps; no long explanatory paragraphs mid-procedure; visual callouts for warnings |
| **Product Manager** | Non-technical to moderate technical fluency; needs to communicate system capabilities to stakeholders and customers | Understand what the system does and what constraints govern it | Overview first; summary blocks; key points extracted | High-level summaries, capability maps, policy statements in plain English, timeline and deadline information | Executive summary up front; bullet points; avoid jargon without explanation; decision-relevant information prioritized |

### 5.2 Writing for Multiple Audiences in a Single Document

Most documents serve multiple audiences. A procedure document read primarily by operations staff may also be reviewed by a compliance auditor and referenced by a new hire. The document structure should accommodate this:

**Lead with the compliance-relevant metadata.** The document header fields (id, type, owner, framework_refs, approval_block) serve the auditor. Put them first, in a structured format that allows rapid scanning.

**Structure the body for the primary audience.** For a procedure, that is operations staff. Use numbered steps, decision trees, and explicit success criteria. Do not interrupt the step flow with explanatory prose.

**Use appendices for secondary audiences.** Background context for new hires, rationale discussions for senior engineers, and extended framework mapping tables for auditors all belong in appendices — not embedded in the procedure body.

**Use progressive disclosure for complex documents.** Lead with a summary section (for product managers and new hires) followed by detailed content (for senior engineers and operations staff). This is the "inverted pyramid" principle from technical journalism applied to documentation structure.

### 5.3 Persona-Specific Content Anti-Patterns

**For new hires:** Avoid assuming organizational context. A procedure that says "use the standard deployment process" without defining or linking to that process is a gap, not documentation.

**For compliance auditors:** Avoid narrative-heavy policy documents without structured control mappings. An auditor reading 10 pages of prose to find a single control reference will mark the documentation as non-conformant on usability grounds.

**For operations staff:** Avoid embedding warnings, rationale, or exceptions mid-step. A warning buried in paragraph three of step seven will be missed under operational pressure. Use callout boxes or explicit WARNING/NOTE prefixes.

**For senior engineers:** Avoid repeating basic concepts they already know. If the document is primarily for senior engineers, assume fluency with the domain and focus on the non-obvious.

**For product managers:** Avoid leading with implementation detail. A product manager reading a policy document needs the obligation and its business implication, not the technical mechanism by which the obligation is implemented.

---

## 6. Technical Writing Standards

Documentation quality is not a matter of style preference — it directly affects usability, compliance coverage, and operational reliability. These standards are derived from the Utah State University Engineering Writing Center technical writing standards and the UK Home Office engineering documentation guidance, with additions specific to the security and operations domains.

### 6.1 Voice and Person

**Policies and Standards: Third Person**

Policies and standards describe what the organization does, requires, or mandates. They are written about the organization and its systems, not directed at the reader as an individual.

- CORRECT: "The organization must maintain an asset inventory of all production systems."
- INCORRECT: "You must maintain an asset inventory of all production systems." (second person in a policy reads as directing the reader, not stating organizational obligation)

**Procedures and Guidelines: Second Person**

Procedures and guidelines are written for the person performing the task. Second person addresses the reader directly and is unambiguous about who takes each action.

- CORRECT: "Open the change management ticket and enter the system name in the Configuration Item field."
- INCORRECT: "The engineer will open the change management ticket and enter the system name." (third person in a procedure creates ambiguity — which engineer? the one reading this? someone else?)

**Exception: Multi-role procedures.** When a procedure involves actions by multiple distinct roles, use the role name as the subject rather than "you."

- CORRECT (multi-role): "The change requester submits the ticket. The change approver reviews it within 24 hours. The deployment engineer executes the approved change."

### 6.2 Active Voice

Active voice is mandatory in procedures and strongly preferred in all other document types. Active voice makes the subject of the sentence the actor, which is essential for accountability in documentation.

- ACTIVE: "The deployment engineer verifies the rollback procedure before executing the change."
- PASSIVE: "The rollback procedure must be verified before the change is executed." (by whom? when? the passive construction obscures accountability)

**When passive voice is acceptable:** When the actor is genuinely unknown or irrelevant. "The log file is rotated nightly by the system daemon" is acceptable if the rotation mechanism is what matters, not the engineer who configured it. This is rare in procedures.

### 6.3 Plain English Requirements

Technical documentation must be readable by its intended audience without a dictionary. This does not mean avoiding technical terminology — it means using technical terms correctly and defining them the first time they appear.

**Principles:**

1. **One sentence, one idea.** Do not chain multiple obligations into a single sentence with conjunctions. "The engineer must verify the configuration and restart the service and confirm the health check passes" should be three numbered steps.

2. **Define acronyms on first use.** Write out the full term followed by the acronym in parentheses. Subsequent uses may use the acronym alone. Exception: universally understood acronyms in context (IP, URL, SSH in a networking document).

3. **Use consistent terminology.** If you call it a "change ticket" in one section, call it a "change ticket" throughout. Do not alternate between "change request," "CR," "ticket," "work order," and "task" for the same concept.

4. **Prefer specific over vague.** "Within a reasonable time" is not a documentation standard. "Within 4 hours" is. "Adequate logging" is not verifiable. "Logging that captures source IP, timestamp, action, and outcome for each authenticated request" is.

5. **Front-load the key information.** Lead with the action or obligation. Supporting context follows. "Verify the backup completed successfully before marking the ticket resolved" is better than "After completing the deployment procedure, and having confirmed that all systems are operational, the final step requires the engineer to verify the backup completed successfully before the ticket can be marked as resolved."

### 6.4 Single-Topic Entries

Each document should cover one topic. A document titled "Security Policy" that covers password management, incident response, acceptable use, vendor management, and data classification is not one document — it is five documents that have been merged. This violates the single-responsibility principle that makes documentation maintainable.

**Implications of single-topic structure:**

- Each document has one owner who is accountable for its accuracy
- Review cycles are scoped to the document's topic — changing the password standard does not trigger review of the incident response procedure
- Documents can be linked and referenced individually rather than requiring readers to navigate to subsections of large documents
- Version control history is meaningful — a version diff on a single-topic document shows exactly what changed in that topic

**When documents must be larger:** Some reference documents (architecture guides, framework mappings) are inherently multi-topic. For these, use a modular structure with a table of contents and internal cross-references, treat each major section as a pseudo-document, and ensure each section has a defined owner.

### 6.5 Specific Writing Rules for Document Types

**Policy writing rules:**
- Use "must" for mandatory obligations; "shall" is also acceptable (and traditional in legal documents) but pick one and use it consistently
- Never use "should" in a policy — "should" implies advisory, which is the language of guidelines, not policies
- Include an explicit "Purpose" section as the first body section; one paragraph maximum

**Standard writing rules:**
- Every requirement must be testable. If you cannot write a test procedure for a requirement, the requirement is too vague to be a standard
- Number requirements within the standard (STD-SEC-0007.1, STD-SEC-0007.2) so they can be referenced individually from control documentation

**Procedure writing rules:**
- Number every step
- Limit each step to one action
- Include expected result at decision points ("the system displays a confirmation message")
- Separate prerequisites from steps — prerequisites are not step zero
- Provide an explicit termination condition

**Guideline writing rules:**
- Distinguish "you should" (recommended) from "you must" (mandatory — wrong word for a guideline) from "you may" (optional, equally valid alternatives exist)
- Provide rationale for each recommendation
- Acknowledge when a different approach is valid

---

## 7. Governance Structures

Documentation governance determines who owns documents, who reviews them, how decisions about document content are made, and how conflicts are resolved. Without governance, documentation becomes whoever-wrote-it-last wins — a state that produces inconsistencies, orphaned documents, and unverifiable compliance.

### 7.1 Document Ownership Models

**Single Owner Model**

Each document has exactly one named owner. The owner is accountable for the document's accuracy, review cadence, and lifecycle state. Ownership is assigned to a role (not a person's name) to survive personnel changes.

- Strengths: Clear accountability; single point of contact for questions; unambiguous escalation path
- Weaknesses: Bus factor (if the owner's role is eliminated or restructured, ownership may lapse); scope ambiguity if one role owns too many documents

**Domain Ownership Model**

Documents are owned by a functional domain (Security, Platform Engineering, Operations). The domain is represented by its lead or a designated documentation steward.

- Strengths: Scales well for large organizations; domain expertise centralized; related documents owned by the same team stay consistent
- Weaknesses: Inter-domain documents (a procedure that involves both Security and Platform teams) require a designated lead owner to avoid co-ownership ambiguity

**Working Group Model**

Documents with broad cross-organizational scope (such as enterprise security policies) are owned by a working group with defined membership. The working group has a designated chair who holds the document owner role for lifecycle purposes.

- Strengths: Appropriate for documents that no single team can unilaterally modify; ensures buy-in from affected stakeholders
- Weaknesses: Slow review cycles; requires a governance chair to avoid deadlock

**Recommended approach for most engineering organizations:** Single owner for procedures and standards; domain ownership for policies; working group ownership for enterprise-wide policies and controls catalogs.

### 7.2 Review Cadence and Scheduling

A review cadence defined in metadata is only meaningful if it is enforced. Manual tracking of review due dates does not scale. The following mechanisms ensure review cadences are followed:

**Automated review triggers:** Document management systems (Confluence, SharePoint, or purpose-built policy management tools) can be configured to generate review reminders at the defined cadence interval. The trigger should fire 30 days before the review due date to give the owner time to prepare the review without a deadline emergency.

**Calendar integration:** Review due dates should appear on team calendars. In smaller organizations, this can be a recurring calendar event. In larger organizations, this is managed through the document management system.

**Audit gate:** Document reviews should be part of the quarterly or annual security review cycle. Any document that has lapsed past its review due date without a completed review is a finding in the audit, not merely an administrative oversight.

**Batch review windows:** Rather than reviewing documents on rolling individual schedules, organizations with large document sets often define review windows (Q1, Q3) and align review cadences to those windows. This makes resource planning predictable but requires that the review windows be enforced.

### 7.3 Escalation Paths

An escalation path defines what happens when the normal document lifecycle is blocked. Common blockage points and their escalation paths:

**Blocked review (SME unavailable):**
1. Document owner notifies the SME's manager with a deadline
2. If unresolved in 5 business days, escalate to the department head
3. If the review is compliance-critical and the SME is unavailable for an extended period, the CISO or equivalent approves an interim extension with a documented compensating review

**Disputed content (reviewers disagree):**
1. Document owner convenes the disputants in a synchronous review session
2. If consensus cannot be reached, the document owner proposes a resolution and escalates to the domain owner or working group chair
3. Final authority rests with the role defined in the approval block for the document type (CISO for security policies; Department Head for operational procedures)

**Retirement dispute (stakeholder wants to keep a document the owner proposes to retire):**
1. Owner documents the retirement rationale in the document lifecycle record
2. Stakeholder provides written objection with rationale
3. Domain owner or working group chair makes the final determination
4. All decisions are recorded in the document revision history

**Emergency publication (critical security policy must be published without normal review cycle):**
1. Document owner and CISO co-sign an emergency publication memo
2. Document is published with state "Under Review" and a committed review completion date not to exceed 30 days
3. The normal review cycle is completed before the committed date; the document transitions to normal Published state

### 7.4 Roles and Responsibilities Matrix

| Role | Draft | Review | Approve | Publish | Retire | Evidence Collection |
|------|-------|--------|---------|---------|--------|---------------------|
| Document Owner | Responsible | Accountable (resolves comments) | N/A | Responsible | Responsible | N/A |
| Subject Matter Expert | Consulted | Responsible | N/A | N/A | Consulted | Consulted |
| Compliance Officer | Consulted | Responsible | Accountable (for policy/standard) | N/A | Consulted | Accountable |
| Department Head | Informed | Consulted | Responsible (for procedures) | N/A | Informed | N/A |
| Governance Body | N/A | N/A | Accountable (for policies) | Informed | Informed | N/A |
| Document Repository Admin | N/A | N/A | N/A | Responsible | Responsible (archive) | N/A |
| Control Owner | Consulted | Responsible (for controls) | N/A | N/A | Consulted | Responsible |

This matrix uses the RACI model: **R**esponsible (does the work), **A**ccountable (approves/signs off), **C**onsulted (provides input), **I**nformed (receives status).

---

## 8. Document Templates and Field Definitions

Every document in the system carries a set of metadata fields. These fields are not optional decorations — they are the structured data that enables search, lifecycle management, compliance mapping, and ownership tracking.

### 8.1 Required Metadata Fields

| Field | Description | Format | Required For |
|-------|-------------|--------|-------------|
| `id` | Unique document identifier | POL-SEC-NNNN / STD-SEC-NNNN / PRC-OPS-NNNN (type-domain-sequence) | All documents |
| `title` | Human-readable document title | Plain text, title case, under 80 characters | All documents |
| `type` | Document type from the taxonomy | One of: policy, standard, procedure, guideline, control | All documents |
| `owner` | Role accountable for document accuracy | Role name (not personal name): "IAM Team Lead", "CISO", "Platform Engineering Lead" | All documents |
| `lifecycle_state` | Current lifecycle state | One of: Draft, Review, Approved, Published, Under Review, Retired | All documents |
| `review_cadence` | How often the document must be reviewed | Annual / Bi-annual / Quarterly / Continuous | All documents |
| `audience` | Intended reader personas | Array from defined persona set | All documents |
| `framework_refs` | Applicable framework controls or clauses | Array of framework reference IDs from the source index | Policy, Standard, Control |
| `scope` | Explicit scope boundaries | Plain text sentence(s) defining what is in scope | All documents |
| `purpose` | One-sentence statement of document purpose | Plain text, one sentence | All documents |
| `version` | Document version | Semantic: MAJOR.MINOR (e.g., 2.3) | All documents |
| `last_reviewed` | Date of most recent completed review | ISO 8601: YYYY-MM-DD | All documents |
| `next_review` | Scheduled next review date | ISO 8601: YYYY-MM-DD | All documents |
| `approval_block` | Names, roles, and dates of approvers | Structured: [{"role": "CISO", "date": "YYYY-MM-DD", "name": "..."}] | Policy, Standard |

### 8.2 Body Section Templates by Document Type

**Policy Template Sections:**

1. **Purpose** — Why this policy exists. One paragraph. References the organizational value it protects and the regulatory or framework obligation it addresses.
2. **Scope** — What is included and what is explicitly excluded. List format preferred.
3. **Policy Statement** — The mandatory obligations, in numbered form for ease of reference.
4. **Roles and Responsibilities** — Who owns compliance with each obligation.
5. **Compliance** — Consequences of non-compliance and the enforcement mechanism.
6. **Exceptions** — How exceptions are requested, approved, and documented.
7. **Related Documents** — Links to implementing standards, procedures, and controls.
8. **Revision History** — Version, date, author (role), summary of changes.

**Procedure Template Sections:**

1. **Purpose** — What this procedure accomplishes and why it is performed.
2. **Scope** — When this procedure applies and when a different procedure should be used instead.
3. **Prerequisites** — What must be true before starting. Includes access requirements, tool availability, and required knowledge.
4. **Steps** — Numbered, sequential actions. Each step: one action, expected result if the action produces an observable output, decision point handling.
5. **Expected Results** — The state of the system after successful completion.
6. **Troubleshooting** — The three to five most common failure modes and their resolution paths.
7. **Related Documents** — Parent policy or standard, related procedures, tool documentation.
8. **Revision History** — Version, date, author (role), summary of changes.

**SOP Template Sections:**

1. **Purpose** — What operational function this SOP governs.
2. **Scope** — Which systems, environments, or processes this SOP covers.
3. **Definitions** — Terms specific to this SOP that may not be familiar to all readers.
4. **Responsibilities** — Roles involved in this SOP and their specific responsibilities.
5. **Procedure Steps** — Detailed, numbered steps organized by phase (preparation, execution, verification, documentation).
6. **Quality Checks** — Checkpoints where the performer verifies correctness before continuing.
7. **Records** — What records must be created, where they are stored, and how long they are retained.
8. **Revision History** — Version, date, author (role), summary of changes.

---

## 9. Mapping Documentation Types to Frameworks

Compliance-driven organizations must demonstrate that their documentation satisfies framework requirements. The mapping below provides a reference for common framework-to-document-type alignments.

### 9.1 NIST SP 800-53 R5 Documentation Requirements

NIST 800-53 R5 requires a policy and procedures document for each of its 20 control families. The "-1" control in each family (e.g., AC-1, IA-1, SI-1) specifies this requirement. Each family policy-and-procedures control requires:

- An information security policy that addresses purpose, scope, roles, responsibilities, management commitment, coordination among organizational entities, and compliance
- Procedures to facilitate the implementation of the policy and associated controls
- A designated official to manage the implementation of the policy
- Coordination with other organizational entities
- Review and update of the policy at a defined frequency

This means a NIST 800-53-compliant organization requires a minimum of 20 policies (one per control family) plus implementing procedures for each controlled area. NIST explicitly distinguishes the policy (what must be done) from the procedures (how to do it), which maps directly to the Level 1 and Level 3 distinction in this module's taxonomy.

**Source:** Secureframe analysis of NIST 800-53 Required Policies and Procedures (2025) identifies 42 required policy documents when implementing the full 800-53 R5 control catalog.

### 9.2 ISO/IEC 27001:2022 Documentation Requirements

ISO 27001:2022 Clause 7.5 requires that the organization determine what documented information is necessary for the effectiveness of the ISMS. At minimum, the standard requires:

- An information security policy (Clause 5.2)
- A risk assessment methodology (Clause 6.1.2)
- A statement of applicability (Clause 6.1.3)
- A risk treatment plan (Clause 6.1.3)
- Documented security objectives (Clause 6.2)
- Competence evidence (Clause 7.2)
- Operational planning and control records (Clause 8.1)
- Risk assessment results (Clause 8.2)
- Risk treatment results (Clause 8.3)
- Internal audit program and results (Clause 9.2)
- Management review results (Clause 9.3)
- Corrective action records (Clause 10.1)

ISO 27002:2022 provides implementation guidance for the 93 controls in ISO 27001:2022 Annex A. Many of these controls explicitly reference documented procedures (e.g., Annex A 5.37: Documented Operating Procedures).

### 9.3 Cross-Framework Control Mapping Example

The following table shows how a single documentation artifact (a Privileged Access Management policy) satisfies requirements across multiple frameworks simultaneously:

| Framework | Requirement | How the PAM Policy Satisfies It |
|-----------|-------------|--------------------------------|
| NIST 800-53 R5 | AC-1 (Access Control Policy) | Policy documents the organizational access control requirement |
| NIST 800-53 R5 | AC-2(6) (Privileged User Accounts) | Policy section on privileged access scope and obligations |
| ISO 27001:2022 | 5.2 (Policy) | Policy satisfies top-level ISMS policy requirement |
| ISO 27001:2022 | A.8.2 (Privileged Access Rights) | Policy implements the Annex A control requirement |
| SOC 2 Type II | CC6.3 (Logical Access Controls) | Policy is the documented authorization basis for CC6.3 evidence |
| CIS Controls v8 | Control 5 (Account Management) | Policy satisfies the governance requirement for account management controls |

Cross-framework mapping tables in document metadata reduce the compliance evidence burden for organizations subject to multiple frameworks simultaneously.

---

## 10. Common Anti-Patterns and How to Avoid Them

Documentation practices accumulate technical debt in the same way codebases do. The following anti-patterns are the most common failure modes observed in engineering documentation systems.

### 10.1 The Everything Document

**Pattern:** A single document titled "Security Policy" or "Engineering Standards" that covers 20 distinct topics across 50+ pages.

**Problem:** Single ownership means any change to any topic requires the entire document to go through the review and approval cycle. Review is difficult because reviewers must evaluate content outside their expertise. Auditors cannot find specific controls. New hires cannot find relevant procedures.

**Fix:** Apply the single-topic rule (Section 6.4). Decompose large documents into topic-scoped documents. Build a document registry that allows discoverability of the individual documents.

### 10.2 The Phantom Reference

**Pattern:** Document A references Document B ("see the Deployment Standard for requirements"), but Document B does not exist, is retired, or is in Draft state.

**Problem:** Phantom references create compliance gaps (auditors follow references to find evidence; a dead reference is a finding). They also create operational risk (engineers following a procedure cannot find the referenced standard).

**Fix:** Reference validation as part of the Draft → Review gate. Before submitting a document for review, the owner must verify that every referenced document exists and is in Published state. Document management tooling can automate this check.

### 10.3 The Unsigned Policy

**Pattern:** A policy document exists but has no approval block, or the approval block is populated with "TBD" or names without dates.

**Problem:** An unsigned policy is an opinion document. It cannot be cited as a compliance control because it has not been authorized by the governance body. Auditors reject unsigned policies as evidence.

**Fix:** Enforce the approval block as a required field in the document template. The lifecycle state cannot advance past Draft without a completed approval block.

### 10.4 The Expired Review

**Pattern:** A policy or procedure's `next_review` date has passed with no completed review. The document remains in Published state but the content has not been validated against current conditions.

**Problem:** An expired review means the document is potentially stale but still authoritative. Policies that have not been reviewed since a technology platform migration may reference systems that no longer exist. Procedures that have not been reviewed since a process change may describe steps that no longer work.

**Fix:** Automated review reminders 30 days before the `next_review` date. Audit-gate enforcement: any document with a lapsed review date is flagged as a finding in the quarterly audit.

### 10.5 The Ambiguous "Should"

**Pattern:** A policy document uses "should" for mandatory requirements.

**Problem:** "Should" is advisory language. In ISO and IETF standards, "should" explicitly means a recommendation that may be ignored in some circumstances. Using "should" in a policy creates an unintentional loophole — non-compliance can be justified by claiming the requirement was advisory.

**Fix:** Reserve "should" for guideline documents. Use "must" or "shall" in policies and standards. Train document authors on the distinction.

### 10.6 The Ghost Owner

**Pattern:** A document's owner field names a person who has left the organization, changed roles, or has no current knowledge of the document's subject matter.

**Problem:** The owner receives review reminders that go unread. The document lapses past its review date. No one feels responsible for the document's accuracy. Audit findings accumulate.

**Fix:** Assign ownership to roles, not individuals. When the role is filled by a new person, they inherit the document. Include document ownership as an onboarding item for roles with documentation responsibilities. Review the ownership registry annually as part of the access review process.

### 10.7 The Missing Prerequisite

**Pattern:** A procedure document begins with Step 1 without specifying what the performer needs to have, know, or be before starting.

**Problem:** The performer discovers mid-procedure that they lack access to a required system, do not have a required tool installed, or need approval from a stakeholder that the procedure assumes is already obtained. This causes incomplete procedures, inconsistent results, and a need to interrupt the procedure and start over.

**Fix:** Mandatory Prerequisites section before the steps. Review the prerequisite list at each procedure update cycle to verify it remains complete.

---

## 11. Source Index and Citations

All claims in this module are traceable to the sources listed below, consistent with safety rule SC-03.

### Government and Regulatory Sources

- **nist-800-53:** NIST SP 800-53 R5, *Security and Privacy Controls for Information Systems and Organizations*, National Institute of Standards and Technology, September 2020. https://doi.org/10.6028/NIST.SP.800-53r5

- **nist-800-100:** NIST SP 800-100, *Information Security Handbook: A Guide for Managers*, National Institute of Standards and Technology, October 2006. https://doi.org/10.6028/NIST.SP.800-100

- **nist-csf-2:** NIST Cybersecurity Framework 2.0, National Institute of Standards and Technology, February 2024. https://doi.org/10.6028/NIST.CSWP.29

- **uk-home-office:** UK Home Office Digital, Data and Technology, *Engineering Principles*, Government Digital Service, 2024. https://engineering.homeoffice.gov.uk/

- **usu-ewc:** Utah State University Engineering Writing Center, *Technical Writing Standards for Engineering Students*, 2024. https://engineering.usu.edu/students/ewc

### International Standards

- **iso-27001:** ISO/IEC 27001:2022, *Information Security, Cybersecurity and Privacy Protection — Information Security Management Systems — Requirements*, International Organization for Standardization, October 2022.

- **iso-27002:** ISO/IEC 27002:2022, *Information Security, Cybersecurity and Privacy Protection — Information Security Controls*, International Organization for Standardization, February 2022.

- **scf:** Secure Controls Framework, *Policy vs. Standard vs. Procedure: Understanding the Hierarchy*, Secure Controls Framework Council, 2024. https://securecontrolsframework.com

### Research and Industry Sources

- **secureframe-2025:** Secureframe, *NIST 800-53 Required Policies and Procedures*, Secureframe Inc., 2025. https://secureframe.com/hub/nist-800-53

- **altexsoft-2024:** AltexSoft, *Technical Documentation in Software Development*, AltexSoft, 2024. https://www.altexsoft.com/blog/technical-documentation/

- **paligo-2025:** Paligo, *The Essential Guide to Effective Technical Documentation*, Paligo AB, October 2025. https://paligo.net/resources/guides/

---

*[PENDING REVIEW] — This module has been generated and requires human review gate before transitioning from Published to fully verified status, per safety rule SC-04.*

*Document ID: M1-foundations-taxonomy | Version: 1.0 | Owner: Technical Documentation Mission | Last Reviewed: 2026-04-05 | Next Review: 2027-04-05*
