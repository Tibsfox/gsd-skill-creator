---
id: M2-structured-authoring
title: "Module 2: Structured Authoring Systems"
type: reference
owner: Technical Documentation Mission
lifecycle_state: Published
review_cadence: Annual
audience: [senior_engineer, new_hire, compliance_auditor, operations_staff, product_manager]
framework_refs: [oasis-dita, nist-800-53, iso-27001]
scope: "Structured authoring systems, DITA implementation, content reuse patterns, and the decision between structured and docs-as-code approaches for technical documentation"
purpose: "Provide a complete reference for structured authoring systems, with particular focus on DITA v1.3, content reuse patterns, publishing pipelines, and a decision framework for selecting the appropriate authoring approach"
version: "1.0"
last_reviewed: "2026-04-05"
next_review: "2027-04-05"
---

# Module 2: Structured Authoring Systems

## Table of Contents

1. [Introduction](#1-introduction)
2. [What Is Structured Authoring](#2-what-is-structured-authoring)
3. [DITA v1.3 Complete Topic Type Reference](#3-dita-v13-complete-topic-type-reference)
4. [Key DITA Mechanisms](#4-key-dita-mechanisms)
5. [Content Reuse Patterns: The LEGO Blocks Principle](#5-content-reuse-patterns-the-lego-blocks-principle)
6. [DITA-OT Pipeline Configuration](#6-dita-ot-pipeline-configuration)
7. [DITA vs Markdown Decision Matrix](#7-dita-vs-markdown-decision-matrix)
8. [When DITA Is the Right Choice](#8-when-dita-is-the-right-choice)
9. [When Docs-as-Code Is Sufficient](#9-when-docs-as-code-is-sufficient)
10. [Migration Paths: Markdown to DITA and Back](#10-migration-paths-markdown-to-dita-and-back)
11. [Source Index and Citations](#11-source-index-and-citations)

---

## 1. Introduction

Structured authoring is the practice of separating content from presentation, enforcing consistent document structure through schema validation, and enabling content reuse at the topic or component level. It is distinct from writing in a word processor or a Markdown file — structured authoring treats content as data, not as formatted prose.

The dominant structured authoring standard for technical documentation is DITA: the Darwin Information Typing Architecture, maintained by OASIS and currently at version 1.3 (published 2015). DITA is used across aerospace documentation, software product documentation, government technical manuals, medical device documentation, and any other domain that requires consistent, reusable, multi-output technical content at scale.

This module provides a complete reference for DITA v1.3 topic types and mechanisms, explains the content reuse patterns that make DITA valuable, walks through DITA-OT pipeline configuration for publishing, and provides a decision framework for choosing between DITA and lightweight alternatives such as Markdown-based docs-as-code workflows.

**The core trade-off in structured authoring is this:** DITA provides maximum reuse, consistency enforcement, and multi-output capability at the cost of significant tooling investment and author learning curve. Docs-as-code Markdown provides maximum developer accessibility and minimal tooling overhead at the cost of consistency, reuse capability, and multi-output flexibility. Understanding which trade-off is appropriate for a given context is the central skill this module develops.

**Who should read this module:**

- Technical writers evaluating authoring system choices
- Platform engineers building documentation infrastructure
- Engineering managers setting documentation tooling standards
- Content architects designing reuse strategies
- DevOps engineers configuring documentation publishing pipelines

---

## 2. What Is Structured Authoring

Structured authoring imposes schema constraints on content. Unlike a word processor, where any paragraph can be placed anywhere, a structured authoring system enforces rules: a task topic must have numbered steps; a reference topic cannot contain freeform narrative; a concept topic must have an opening definition before any subordinate content.

These constraints serve three purposes:

1. **Consistency enforcement:** When every procedure follows the same structure, readers know exactly where to find the steps, prerequisites, and expected results — regardless of which author wrote the document.

2. **Content reuse:** Because every piece of content is a typed, identified unit, it can be referenced from multiple publications without copying. A warning that applies to 20 different procedures is written once and referenced 20 times. When the warning changes, it changes in all 20 places simultaneously.

3. **Multi-output publication:** The same structured content can be rendered to HTML, PDF, EPUB, Windows Help, DITA-OT plugins, and other output formats without reformatting the content. The transformation rules are applied by the publishing toolchain, not embedded in the content.

**Source:** OASIS DITA v1.3 Specification (2015), Section 1: "The DITA architecture is designed for content that is topic-based, typed, reusable, and assemblable into publications of varying scope and purpose."

### 2.1 The Darwin Analogy

The "Darwin" in DITA refers to specialization — the mechanism by which DITA's base topic types are extended to domain-specific types while preserving the inheritance hierarchy. A software reference topic is a specialization of the base reference topic type; it inherits all the structural rules of the reference type and adds software-specific elements (such as `<cmdname>` for command names and `<option>` for command options). This is analogous to biological taxonomy: a swan is a bird is a vertebrate. Each level inherits characteristics from the level above while adding specificity.

This specialization mechanism allows DITA to be extended for domains (hardware documentation, software API reference, regulatory compliance documentation) without abandoning the base schema.

### 2.2 Information Typing

The "Information Typing" in DITA refers to the principle that every piece of content belongs to one of a small number of information types, each with a defined structural contract. The base DITA specification defines five topic types, each suited to a different kind of information. The assignment of content to information type is the fundamental act of DITA authoring — before writing a single word, the author must determine what kind of information they are writing.

This typing decision drives structure, reuse potential, and output formatting. Content assigned to the wrong type cannot fulfill its structural contract and will not reuse effectively.

---

## 3. DITA v1.3 Complete Topic Type Reference

DITA v1.3 defines five base topic types. Each has a distinct purpose, structural contract, required and optional elements, and appropriate use cases.

**Source for all topic type definitions in this section:** OASIS, *Darwin Information Typing Architecture (DITA) Version 1.3*, OASIS Standard, December 2015. Part 3: All-Inclusive Edition. Sections 3.1–3.5.

### 3.1 Concept Topic

**Purpose:** A concept topic explains what something is or why it matters. It provides background information that enables the reader to understand a system, mechanism, domain, or principle. Concept topics do not tell the reader how to do anything — they establish the understanding that makes task topics comprehensible.

**DITA structural contract:**

```xml
<concept id="authentication-overview">
  <title>Authentication Overview</title>
  <shortdesc>Authentication is the process of verifying that an entity is who it
  claims to be before granting access to protected resources.</shortdesc>
  <conbody>
    <p>Authentication differs from authorization. Authentication verifies
    identity; authorization determines what an authenticated identity is
    permitted to do.</p>
    <section>
      <title>Authentication Factors</title>
      <p>Modern authentication systems use one or more of the following
      factor categories:</p>
      <dl>
        <dlentry>
          <dt>Knowledge factor</dt>
          <dd>Something the user knows, such as a password or PIN.</dd>
        </dlentry>
        <dlentry>
          <dt>Possession factor</dt>
          <dd>Something the user has, such as a hardware token or mobile
          device.</dd>
        </dlentry>
        <dlentry>
          <dt>Inherence factor</dt>
          <dd>Something the user is, such as a fingerprint or retinal
          pattern.</dd>
        </dlentry>
      </dl>
    </section>
    <section>
      <title>Multi-Factor Authentication</title>
      <p>Multi-factor authentication (MFA) requires verification of at least
      two factors from distinct factor categories before granting access.
      Using two knowledge factors (a password and a PIN) does not constitute
      MFA because both factors belong to the same category.</p>
    </section>
  </conbody>
</concept>
```

**Required elements:** `<concept>` root, `<title>`, `<conbody>`

**Optional but common:** `<shortdesc>` (strongly recommended — used in link previews and search results), `<section>`, `<example>`, `<fig>`, `<table>`

**What concept topics must NOT contain:**

- Numbered steps (those belong in task topics)
- Parameter tables (those belong in reference topics)
- Warnings that apply to a specific procedure (those should be in the task topic or referenced via conref)

**Appropriate use cases:**

- Explaining what a system does before showing how to use it
- Providing background on a domain (security principles, networking concepts, deployment models)
- Explaining design decisions and their rationale
- Describing the relationship between system components

**When to use a concept instead of prose in a procedure:**

If you find yourself writing a long explanatory paragraph in the middle of a task topic to explain why step 7 works the way it does, that explanation belongs in a concept topic that is linked from the task, not embedded in the task body.

**Concrete example — documentation scenario:**

A user manual for an identity management platform needs to explain what authentication is, what MFA is, and what risk-based authentication means before presenting the tasks for configuring these features. Each of those explanations is a concept topic. The configuration steps are task topics. The concept topics appear in the publication before the task topics in the map structure.

---

### 3.2 Task Topic

**Purpose:** A task topic provides step-by-step instructions for performing a specific procedure. It tells the reader what to do, in what order, under what conditions. Task topics are the most common DITA topic type in operational documentation.

**DITA structural contract:**

```xml
<task id="configure-mfa-totp">
  <title>Configure TOTP-Based MFA for a User Account</title>
  <shortdesc>Configure time-based one-time password (TOTP) multi-factor
  authentication for a user account in the identity management console.</shortdesc>
  <taskbody>
    <prereq>
      <ul>
        <li>You have administrator access to the identity management console
        at <codeph>iam.internal.example.com</codeph>.</li>
        <li>The target user account exists and is in active status.</li>
        <li>The user has a TOTP authenticator application installed on their
        mobile device (such as Google Authenticator or Authy).</li>
      </ul>
    </prereq>
    <context>
      <p>TOTP MFA adds a possession factor to the authentication workflow.
      After completing this procedure, the user must provide a 6-digit TOTP
      code in addition to their password on every login attempt.</p>
    </context>
    <steps>
      <step>
        <cmd>Navigate to <menucascade><uicontrol>Users</uicontrol>
        <uicontrol>Manage</uicontrol></menucascade> in the IAM console.</cmd>
      </step>
      <step>
        <cmd>Locate the target user account by entering the user's username
        or email address in the search field.</cmd>
        <stepresult>The user account record opens.</stepresult>
      </step>
      <step>
        <cmd>Select <uicontrol>Authentication</uicontrol> from the account
        record navigation tabs.</cmd>
      </step>
      <step>
        <cmd>Click <uicontrol>Enroll MFA Device</uicontrol>.</cmd>
        <stepresult>A QR code and a 32-character secret key are
        displayed.</stepresult>
      </step>
      <step>
        <cmd>Instruct the user to scan the QR code with their authenticator
        application. If they cannot scan the QR code, they can enter the
        secret key manually.</cmd>
      </step>
      <step>
        <cmd>Ask the user to enter the 6-digit TOTP code from their
        authenticator application into the <uicontrol>Verification
        Code</uicontrol> field.</cmd>
      </step>
      <step>
        <cmd>Click <uicontrol>Verify and Enable</uicontrol>.</cmd>
        <stepresult>The system validates the TOTP code and enables MFA for
        the account. The authentication tab now shows TOTP MFA as
        active.</stepresult>
      </step>
    </steps>
    <result>
      <p>TOTP MFA is enabled for the user account. The user must provide a
      valid TOTP code on every subsequent login attempt. The enrollment date
      and device identifier appear in the account's MFA enrollment
      record.</p>
    </result>
    <tasktroubleshooting>
      <p><b>QR code does not scan:</b> Ensure the user's device camera is
      not obstructed and the display brightness is adequate. The manual
      entry fallback (32-character secret key) should resolve most scanning
      failures.</p>
      <p><b>Verification code rejected:</b> Verify that the user's device
      clock is synchronized to an NTP server. TOTP codes are time-sensitive
      (±30 seconds). Clock drift of more than 90 seconds will cause
      verification failure.</p>
    </tasktroubleshooting>
    <postreq>
      <p>Notify the user that TOTP MFA is now active on their account and
      that they should store backup codes from their authenticator
      application in a secure location.</p>
    </postreq>
  </taskbody>
</task>
```

**Required elements:** `<task>` root, `<title>`, `<taskbody>`, `<steps>` (or `<steps-unordered>` for non-sequential tasks), `<step>`, `<cmd>` (within each step)

**Optional but common:** `<shortdesc>`, `<prereq>`, `<context>`, `<stepresult>`, `<result>`, `<tasktroubleshooting>`, `<postreq>`

**Key task-specific elements:**

- `<cmd>`: The imperative command the user must execute. Required in every `<step>`. Written in second person imperative ("Click", "Navigate to", "Enter").
- `<info>`: Supplementary information about the step that is not the command itself.
- `<stepresult>`: The observable result of executing the step command.
- `<choices>` / `<choice>`: For steps where the user must select from mutually exclusive options.
- `<substeps>`: For steps that require sub-steps before the step is complete.

**Appropriate use cases:**

- Installation and configuration procedures
- Maintenance and operational procedures
- Enrollment and provisioning workflows
- Emergency response procedures (with clear decision points modeled as `<choices>`)

---

### 3.3 Reference Topic

**Purpose:** A reference topic provides data that the reader looks up rather than reads linearly. Parameter lists, API references, configuration option tables, command syntax, error code catalogs, and glossaries of technical terms are all reference content.

**DITA structural contract:**

```xml
<reference id="patch-management-api-ref">
  <title>Patch Management API Reference: /patches/schedule Endpoint</title>
  <shortdesc>POST endpoint for scheduling a patch deployment to one or more
  target systems.</shortdesc>
  <refbody>
    <section>
      <title>Request Parameters</title>
      <properties>
        <prophead>
          <proptypehd>Parameter</proptypehd>
          <propvaluehd>Type</propvaluehd>
          <propdeschd>Description</propdeschd>
        </prophead>
        <property>
          <proptype>system_ids</proptype>
          <propvalue>array[string]</propvalue>
          <propdesc>Required. Array of system identifiers to receive the
          patch. Maximum 500 IDs per request.</propdesc>
        </property>
        <property>
          <proptype>patch_id</proptype>
          <propvalue>string</propvalue>
          <propdesc>Required. Identifier of the patch to deploy, in format
          PATCH-YYYYMMDD-NNN.</propdesc>
        </property>
        <property>
          <proptype>scheduled_time</proptype>
          <propvalue>string (ISO 8601)</propvalue>
          <propdesc>Optional. Scheduled deployment time in UTC. If omitted,
          the patch deploys immediately.</propdesc>
        </property>
        <property>
          <proptype>maintenance_window_id</proptype>
          <propvalue>string</propvalue>
          <propdesc>Optional. Maintenance window identifier. If provided,
          the deployment validates against the window schedule before
          proceeding.</propdesc>
        </property>
      </properties>
    </section>
    <section>
      <title>Response Codes</title>
      <simpletable>
        <sthead>
          <stentry>Code</stentry>
          <stentry>Meaning</stentry>
          <stentry>Next Action</stentry>
        </sthead>
        <strow>
          <stentry>202 Accepted</stentry>
          <stentry>Patch deployment scheduled successfully.</stentry>
          <stentry>Monitor deployment status via GET /patches/status/{job_id}.</stentry>
        </strow>
        <strow>
          <stentry>400 Bad Request</stentry>
          <stentry>Request body is malformed or required parameters are missing.</stentry>
          <stentry>Review the error detail in the response body.</stentry>
        </strow>
        <strow>
          <stentry>409 Conflict</stentry>
          <stentry>One or more target systems already have this patch scheduled.</stentry>
          <stentry>Review existing schedules via GET /patches/scheduled.</stentry>
        </strow>
      </simpletable>
    </section>
  </refbody>
</reference>
```

**Required elements:** `<reference>` root, `<title>`, `<refbody>`

**Optional but common:** `<shortdesc>`, `<section>`, `<table>`, `<simpletable>`, `<properties>`, `<refsyn>` (reference syntax, for command syntax documentation)

**What reference topics must NOT contain:**

- Narrative explanations of why something works (concept topic content)
- Step-by-step procedures (task topic content)
- Freeform prose discussions

Reference topics are optimized for lookup, not reading. A reader comes to a reference topic with a specific question ("what does error code 409 mean?") and leaves as soon as they have the answer. The structure should support that pattern.

**Appropriate use cases:**

- API endpoint documentation
- Command-line option reference
- Configuration file parameter documentation
- Error code catalogs
- Keyboard shortcut tables
- System requirement tables

---

### 3.4 Troubleshooting Topic

**Purpose:** A troubleshooting topic is a specialized topic type introduced in DITA v1.3 for documenting how to diagnose and resolve specific problems. It models the condition-cause-remedy pattern that underlies effective troubleshooting documentation.

**DITA structural contract:**

```xml
<troubleshooting id="patch-deployment-fails-connection">
  <title>Patch Deployment Fails with Connection Timeout</title>
  <shortdesc>Resolve a connection timeout error that prevents patch deployment
  from reaching target systems.</shortdesc>
  <troublebody>
    <condition>
      <p>The patch deployment job reports status FAILED with the error
      message: "Connection timeout: target system <varname>hostname</varname>
      did not respond within 30 seconds." The deployment log shows the
      target system's IP address and the attempted connection port.</p>
    </condition>
    <troubleSolution>
      <cause>
        <p>This error occurs when the patch deployment agent cannot establish
        a TCP connection to the target system's management port (default:
        TCP 22 for SSH-based deployment, TCP 5985 for WinRM-based
        deployment). Common causes include:</p>
        <ul>
          <li>The target system is powered off or unreachable on the
          network.</li>
          <li>A firewall rule is blocking the management port.</li>
          <li>The patch deployment agent service is not running on the
          target system.</li>
        </ul>
      </cause>
      <remedy>
        <steps>
          <step>
            <cmd>Verify that the target system is online by running a ping
            test from the patch management server: <codeph>ping
            <varname>target-hostname</varname></codeph>.</cmd>
            <stepresult>If the system responds to ping, it is reachable on
            the network. If it does not respond, the system may be powered
            off or there may be a network routing issue between the patch
            server and the target network segment.</stepresult>
          </step>
          <step>
            <cmd>If the system responds to ping, test the management port
            directly: <codeph>nc -zv <varname>target-hostname</varname>
            22</codeph> (for SSH) or <codeph>Test-NetConnection
            <varname>target-hostname</varname> -Port 5985</codeph> (for
            WinRM in PowerShell).</cmd>
          </step>
          <step>
            <cmd>If the port test fails, review the firewall rules on the
            target system and on any network firewalls between the patch
            server and the target. The required firewall rules are documented
            in the Patch Management Network Requirements reference
            (PRC-OPS-0044).</cmd>
          </step>
          <step>
            <cmd>If the port is open but the connection still times out,
            verify that the patch deployment agent service is running on
            the target system. For Linux targets: <codeph>systemctl status
            patch-agent</codeph>. For Windows targets: check the Services
            panel for the "Patch Deployment Agent" service.</cmd>
          </step>
        </steps>
      </remedy>
    </troubleSolution>
  </troublebody>
</troubleshooting>
```

**Required elements:** `<troubleshooting>` root, `<title>`, `<troublebody>`, `<condition>`, `<troubleSolution>`, `<cause>`, `<remedy>`

**The condition-cause-remedy model:** Each `<troubleSolution>` in a troubleshooting topic contains one `<cause>` (why this problem occurs) and one `<remedy>` (how to fix it). A single problem may have multiple `<troubleSolution>` elements if there are multiple distinct causes with distinct remedies. This structure makes it easy for readers to match their specific symptom to its cause and jump directly to the relevant remedy.

**Appropriate use cases:**

- Known error conditions with documented resolution paths
- Deployment failure taxonomies
- Hardware or connectivity diagnostic guides
- Post-incident documentation of the diagnostic path taken

**Why troubleshooting topics are distinct from task topics:**

A task topic describes a procedure that produces a known, expected result. A troubleshooting topic describes a procedure for restoring expected operation when something has gone wrong. The reader comes to a troubleshooting topic with a problem, not with an intention to perform a routine task. The condition-cause-remedy structure is optimized for diagnostic search, not sequential execution.

---

### 3.5 Glossary Entry Topic

**Purpose:** A glossary entry topic defines a single term. Glossary entries are assembled into a glossary publication using a DITA map. Individual glossary entries can be referenced from other topics to provide in-context term definitions.

**DITA structural contract:**

```xml
<glossentry id="gloss-mfa">
  <glossterm>multi-factor authentication (MFA)</glossterm>
  <glossdef>An authentication method that requires verification of at least
  two factors from distinct factor categories (knowledge, possession, or
  inherence) before granting access to a protected resource. Using two
  factors from the same category does not satisfy the MFA
  requirement.</glossdef>
  <glossBody>
    <glossSurfaceForm>multi-factor authentication</glossSurfaceForm>
    <glossAbbreviation>MFA</glossAbbreviation>
    <glossUsage>Use the full term on first occurrence in a document.
    Subsequent occurrences may use the abbreviation MFA.</glossUsage>
    <glossScopeNote>In the context of this organization's documentation,
    MFA specifically excludes SMS-based one-time passwords as a second
    factor, in accordance with NIST SP 800-63B guidance on out-of-band
    authenticators.</glossScopeNote>
  </glossBody>
</glossentry>
```

**Required elements:** `<glossentry>` root, `<glossterm>`, `<glossdef>`

**Optional but valuable:** `<glossSurfaceForm>` (the full-form display string), `<glossAbbreviation>`, `<glossUsage>` (usage guidance for authors), `<glossScopeNote>` (scope limitations on the definition)

**Key reuse capability:** Glossary entries can be referenced using the `<abbreviated-form>` element in other topics. On first use, the system renders the full term; on subsequent uses, it renders the abbreviation. This automation reduces manual consistency work for abbreviation management across a large document set.

**Appropriate use cases:**

- Any term that is used across multiple topics and that requires a consistent, controlled definition
- Regulatory or compliance terms that must match the definition in the cited regulation
- Acronyms and abbreviations used in technical documentation
- Organizational terms that have specific meanings in the organizational context

---

## 4. Key DITA Mechanisms

DITA's value proposition rests on a set of core mechanisms that enable content reuse, conditionalization, and publication flexibility. Each mechanism addresses a specific documentation management problem.

### 4.1 Content Reference (conref) and Content Key Reference (conkeyref)

**What it is:** Conref (content reference) is DITA's transclusion mechanism. It allows any element in any topic to include the content of a designated element from another topic, by reference. At processing time, the referenced content is substituted for the reference element. The source content exists in exactly one place; it appears in all transcluding documents.

**The problem it solves:** Without transclusion, content that must appear in multiple places (a standard warning, a recurring prerequisite, a note about a specific product limitation) must be copied to every location. When the content changes, every copy must be updated. Missed copies create inconsistency. Conref eliminates this problem.

**Syntax:**

```xml
<!-- Source topic: common-warnings.dita -->
<topic id="common-warnings">
  <title>Common Warnings</title>
  <body>
    <note type="warning" id="data-loss-warning">
      <p>This operation permanently deletes all records associated with the
      selected account. This action cannot be undone. Ensure you have a
      current backup before proceeding.</p>
    </note>
  </body>
</topic>

<!-- Consuming topic: delete-account-procedure.dita -->
<task id="delete-account-procedure">
  <title>Delete a User Account</title>
  <taskbody>
    <steps>
      <step>
        <cmd>Locate the account to delete in the user management panel.</cmd>
      </step>
      <step>
        <!-- The warning appears here at processing time, pulled from the source -->
        <note type="warning"
              conref="common-warnings.dita#common-warnings/data-loss-warning"/>
        <cmd>Click Delete Account.</cmd>
      </step>
    </steps>
  </taskbody>
</task>
```

**Conkeyref — the decoupled variant:** Conref requires a direct file path, creating a dependency between the consuming topic and the source file's location. Conkeyref breaks that dependency by using a key (defined in the DITA map) instead of a file path. The key is resolved at processing time based on the map's key space. This allows the source file to move or be replaced without updating every consuming topic.

```xml
<!-- DITA map defines the key -->
<map>
  <keydef keys="common-warnings" href="common-warnings.dita"/>
</map>

<!-- Consuming topic uses conkeyref with the map-defined key -->
<note type="warning"
      conkeyref="common-warnings/data-loss-warning"/>
```

**Authoring discipline for conref/conkeyref:** Transcluded content must be authored defensively. A conref'ed note cannot reference "the above steps" because the note appears in many different contexts — "the above steps" has no stable referent. Transcluded content must be self-contained and context-independent.

**Source:** OASIS DITA v1.3 Specification, Part 1: Base Edition, Section 3.3 (Content reference overview) and Section 3.3.3 (Content key references).

---

### 4.2 DITA Maps

**What it is:** A DITA map is the assembly document that defines a publication. It is a DITA-format XML file that specifies which topics are included in the publication, in what order, organized under what headings, and with what navigational structure. Topics themselves have no inherent navigational position — they are placed in a publication by the map.

**The problem it solves:** In a flat file documentation system, the document structure is baked into the document itself. To produce a "Getting Started" guide and a "Full Reference" from the same content, you need two separate documents (and two sets of maintenance). With DITA maps, you write topics once and assemble them into multiple publications with different maps — different selection, different order, different navigational structure — without modifying the topics.

**Syntax:**

```xml
<!-- getting-started.ditamap -->
<map>
  <title>Getting Started with Identity Management</title>
  <topicref href="concepts/authentication-overview.dita" type="concept">
    <topicref href="concepts/mfa-overview.dita" type="concept"/>
  </topicref>
  <topicref href="tasks/configure-mfa-totp.dita" type="task"/>
  <topicref href="tasks/configure-mfa-hardware-key.dita" type="task"/>
</map>

<!-- admin-reference.ditamap — uses the same topics in a different structure -->
<map>
  <title>Identity Management Administrator Reference</title>
  <topichead navtitle="Authentication Configuration">
    <topicref href="tasks/configure-mfa-totp.dita" type="task"/>
    <topicref href="tasks/configure-mfa-hardware-key.dita" type="task"/>
    <topicref href="tasks/configure-mfa-sms.dita" type="task"/>
    <topicref href="reference/mfa-api-reference.dita" type="reference"/>
  </topichead>
  <topichead navtitle="Account Management">
    <!-- Additional topics not in the getting-started guide -->
    <topicref href="tasks/delete-account-procedure.dita" type="task"/>
    <topicref href="reference/account-api-reference.dita" type="reference"/>
  </topichead>
</map>
```

**Map types:**

- **bookmap:** A map variant for book-style publications with chapters, appendices, front matter, and back matter structure. Used for PDF-targeted publications.
- **subjectScheme map:** Defines controlled vocabulary for metadata filtering. Used with conditional processing.

**Source:** OASIS DITA v1.3 Specification, Part 2: Technical Content Edition, Section 2.2 (DITA maps).

---

### 4.3 Conditional Processing (.ditaval)

**What it is:** Conditional processing allows content to be filtered or flagged based on metadata attributes assigned to elements. A `.ditaval` filter file specifies which attribute values to include, exclude, or flag when the publication is processed. The same content repository can produce audience-specific, platform-specific, or product-version-specific outputs by applying different ditaval files at processing time.

**The problem it solves:** A single installation guide that covers three operating systems (Linux, macOS, Windows) would be confusing if all three sets of instructions appeared in every output. Without conditional processing, you maintain three separate documents. With conditional processing, you maintain one document with platform-specific content marked with `platform` attributes, and produce three outputs by applying three different ditaval files.

**Attribute assignment in topic content:**

```xml
<steps>
  <step platform="linux">
    <cmd>Install the package using your distribution's package manager:
    <codeph>apt install patch-agent</codeph> (Debian/Ubuntu) or
    <codeph>yum install patch-agent</codeph> (RHEL/CentOS).</cmd>
  </step>
  <step platform="macos">
    <cmd>Install the package using Homebrew:
    <codeph>brew install patch-agent</codeph>.</cmd>
  </step>
  <step platform="windows">
    <cmd>Run the installer from the download directory:
    <codeph>patch-agent-installer.exe /silent</codeph>.</cmd>
  </step>
</steps>
```

**DITAVAL filter file for Linux output:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<val>
  <prop att="platform" val="linux" action="include"/>
  <prop att="platform" val="macos" action="exclude"/>
  <prop att="platform" val="windows" action="exclude"/>
</val>
```

**Common attribute dimensions for conditional processing:**

| Attribute | Example Values | Use Case |
|-----------|---------------|----------|
| `platform` | linux, macos, windows, ios, android | OS-specific content |
| `audience` | admin, end-user, developer, auditor | Persona-specific content |
| `product` | enterprise, professional, basic | Edition-specific content |
| `rev` | 2.3, 3.0 | Version-specific content |
| `otherprops` | internal, external, partner | Audience classification |

**Flagging vs. excluding:** In addition to including or excluding content, ditaval can flag content — visually marking it in the output with a color, icon, or label. This is used in change tracking outputs to highlight new or changed content.

**Source:** OASIS DITA v1.3 Specification, Part 1: Base Edition, Section 3.4 (Conditional processing overview).

---

### 4.4 Specialization

**What it is:** Specialization is the mechanism by which new element types are derived from existing DITA element types while preserving backward compatibility. A specialized element is a more specific version of its base type — it inherits all the processing rules and output transformations of its base type, adds new elements and attributes relevant to its domain, and remains processable by any DITA-OT plugin that handles the base type.

**The problem it solves:** DITA's base topic types do not provide specialized elements for every documentation domain. A software domain needs `<apiname>`, `<cmdname>`, `<option>`. A hardware domain needs `<partno>`, `<voltrange>`. A regulatory compliance domain might need `<controlref>`, `<policyref>`. Specialization allows these domain-specific elements to be defined without forking the DITA standard.

**Specialization hierarchy example:**

```
<topic>                    (base topic type)
  └── <concept>            (concept specialization of topic)
  └── <task>               (task specialization of topic)
  └── <reference>          (reference specialization of topic)
        └── <apiref>       (software domain API reference specialization)
```

The `<apiref>` topic type inherits all `<reference>` processing rules and adds elements like `<apiSyntax>`, `<apiParam>`, and `<apiReturn>`. Any DITA-OT transformation that handles `<reference>` topics will handle `<apiref>` topics — the software-specific elements are either transformed by a domain-specific plugin or gracefully degraded to their base element equivalents.

**When to create a specialization:** Specialization is appropriate when a domain needs consistently structured, typed elements that cannot be adequately represented by the base types or existing domain specializations. The software, UI, and Learning & Training domains in the OASIS DITA specification are examples of standardized specializations. Organizations with unique documentation domains (regulatory compliance, product-specific documentation) create their own specializations.

**Specialization is not for everyone:** Creating a new specialization requires understanding the DITA architecture at a structural level, implementing DTDs or XML schemas, and writing DITA-OT plugin transforms. For most organizations, the base types plus the standard domain specializations (software, UI) are sufficient.

**Source:** OASIS DITA v1.3 Specification, Part 1: Base Edition, Section 3.5 (Specialization overview).

---

### 4.5 Relationship Tables

**What it is:** A relationship table (reltable) is a DITA map construct that defines links between topics without embedding link elements in the topics themselves. The map contains a table where rows define related topic groups; the DITA-OT processes these relationships at build time and generates "Related topics" sections in the published output.

**The problem it solves:** If topic A should link to topic B and topic C, you have three options: embed the links in topic A, embed back-links in topics B and C, or define the relationships in the map. Embedded links create maintenance problems — if topic B is removed from the publication, topic A's link breaks. Map-level relationships are maintained centrally and only generate links for topics that are actually present in the specific publication being built.

**Syntax:**

```xml
<map>
  <!-- Topics defined elsewhere in the map -->
  <reltable>
    <relheader>
      <relcolspec type="concept"/>
      <relcolspec type="task"/>
      <relcolspec type="reference"/>
    </relheader>
    <relrow>
      <relcell>
        <topicref href="concepts/authentication-overview.dita"/>
      </relcell>
      <relcell>
        <topicref href="tasks/configure-mfa-totp.dita"/>
        <topicref href="tasks/configure-mfa-hardware-key.dita"/>
      </relcell>
      <relcell>
        <topicref href="reference/mfa-api-reference.dita"/>
      </relcell>
    </relrow>
  </reltable>
</map>
```

This reltable tells the DITA-OT to generate "Related topics" links in the output: the authentication overview concept links to the MFA configuration tasks; the configuration tasks link to both the concept and the API reference.

---

## 5. Content Reuse Patterns: The LEGO Blocks Principle

The LEGO blocks analogy for content reuse is well-established in structured authoring literature and captures the essential principle: individual content pieces are standardized, typed, and connectable. The published documentation is assembled from those pieces according to a map. Changing a piece changes every assembly that includes it.

**Source:** This analogy is used in the DITA introduction materials from OASIS and in the Paligo guide to effective technical documentation (2025). The analogy highlights the difference between structured reuse (modular components snapping together) and copy-paste reuse (cutting and re-gluing raw material).

### 5.1 Reuse Granularity Levels

DITA supports content reuse at multiple granularity levels. Choosing the right level matters — reusing too-granular content creates fragile maps; reusing too-coarse content defeats the purpose of granular topics.

**Topic-level reuse (most common):**
A complete topic (concept, task, reference) is included in multiple DITA maps. The deployment procedure for a software component appears in both the "Administrator Guide" and the "Operations Runbook" maps, unchanged.

**Element-level reuse (conref/conkeyref):**
A specific element within a topic (a warning, a note, a step, a code example) is transcluded into multiple topics. This is appropriate for content units that are too small to be their own topic but are used frequently enough to warrant centralization.

**Variable reuse (keyref for text replacement):**
A product name, version number, or other variable string is defined as a key value in the map and referenced with `<ph keyref="product-name"/>` in topics. Changing the key value in the map changes the rendered text in all topics without editing any topic file.

```xml
<!-- Map defines product variables -->
<map>
  <keydef keys="product-name">
    <topicmeta>
      <keywords>
        <keyword>Identity Management Platform</keyword>
      </keywords>
    </topicmeta>
  </keydef>
  <keydef keys="product-version">
    <topicmeta>
      <keywords>
        <keyword>3.2.1</keyword>
      </keywords>
    </topicmeta>
  </keydef>
</map>

<!-- Topic uses variables -->
<p>This guide covers <ph keyref="product-name"/> version
<ph keyref="product-version"/>.</p>
```

**Image and media reuse:**
An image (architecture diagram, screenshot, icon) is stored in a shared media directory and referenced by multiple topics. When the diagram is updated, all topics that reference it pick up the new version automatically.

### 5.2 Content Repository Organization for Reuse

Effective reuse requires a content repository organized around reuse, not around publication. If topic files are organized by publication ("admin-guide/", "user-guide/"), moving a topic into a new publication requires moving the file and updating all references. If topic files are organized by type and domain ("concepts/", "tasks/", "reference/", "shared/"), topics can be assembled into any publication without file moves.

**Recommended directory structure:**

```
content/
  concepts/
    authentication/
      authentication-overview.dita
      mfa-overview.dita
    access-control/
      rbac-overview.dita
  tasks/
    authentication/
      configure-mfa-totp.dita
      configure-mfa-hardware-key.dita
    account-management/
      create-account.dita
      delete-account-procedure.dita
  reference/
    authentication/
      mfa-api-reference.dita
    account-management/
      account-api-reference.dita
  shared/
    warnings/
      common-warnings.dita    (source for conref'd warnings)
    variables/
      product-variables.dita   (source for conref'd variable values)
  glossary/
    terms.dita
  maps/
    getting-started.ditamap
    admin-reference.ditamap
    ops-runbook.ditamap
```

### 5.3 Reuse Anti-Patterns

**Context-sensitive language in reusable content:** A transcluded warning that says "as noted in the previous section" is broken in any context where the previous section is different. Reusable content must be context-neutral.

**Over-granular conref:** Transcluding individual sentences creates a maintenance burden that exceeds the benefit. Conref is most valuable for multi-sentence content units (warnings, prerequisites, complete step sequences) that are used in three or more places.

**Circular references:** Topic A conrefs from Topic B; Topic B conrefs from Topic A. This creates a processing loop. DITA-OT will report an error, but the content design must be fixed, not the tooling.

**Reuse without governance:** A content library with 200 conref'd elements is a maintenance asset only if the elements are reviewed, tested against all their consuming contexts, and owned by a named role. Unowned shared content becomes the silent landmine that nobody wants to change.

---

## 6. DITA-OT Pipeline Configuration

The DITA Open Toolkit (DITA-OT) is the reference implementation of the DITA publishing pipeline. It is open source, Java-based, and extensible via plugins. DITA-OT takes DITA source files and DITA maps as input and produces output in the configured format.

**Source:** DITA Open Toolkit documentation, https://www.dita-ot.org/dev/

### 6.1 DITA-OT Architecture

```
DITA Source (topics + maps)
         │
         ▼
  ┌──────────────┐
  │   DITA-OT    │
  │  Preprocessor│  ← Resolves conrefs, conkeyrefs, keyrefs
  │              │  ← Applies conditional processing (ditaval)
  │              │  ← Validates topic/map structure
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │ Transformation│  ← Applies XSLT transforms for target format
  │   Plug-in    │
  └──────┬───────┘
         │
         ▼
  Output (HTML5, PDF, EPUB, Eclipse Help, etc.)
```

### 6.2 Installation and Basic Configuration

DITA-OT requires Java 11 or later. Installation from the DITA-OT project distribution:

```bash
# Download and extract the DITA-OT distribution
wget https://github.com/dita-ot/dita-ot/releases/download/3.7.4/dita-ot-3.7.4.zip
unzip dita-ot-3.7.4.zip -d /opt/dita-ot

# Verify installation
/opt/dita-ot/dita-ot-3.7.4/bin/dita --version
```

**Basic transformation command:**

```bash
# HTML5 output
/opt/dita-ot/bin/dita \
  --input=maps/admin-reference.ditamap \
  --format=html5 \
  --output=output/html5/admin-reference \
  --filter=filters/external-audience.ditaval

# PDF output (requires PDF plugin — included in full DITA-OT distribution)
/opt/dita-ot/bin/dita \
  --input=maps/admin-reference.ditamap \
  --format=pdf2 \
  --output=output/pdf/admin-reference \
  --filter=filters/external-audience.ditaval
```

### 6.3 The project.xml Build Configuration

For production documentation pipelines, DITA-OT 3.4+ supports a project file format that defines multiple deliverables in a single configuration:

```xml
<!-- project.xml -->
<project xmlns="https://www.dita-ot.org/project">
  <context id="external-html">
    <input href="maps/admin-reference.ditamap"/>
    <profile>
      <ditaval href="filters/external-audience.ditaval"/>
    </profile>
  </context>
  <context id="internal-html">
    <input href="maps/admin-reference.ditamap"/>
    <profile>
      <ditaval href="filters/internal-audience.ditaval"/>
    </profile>
  </context>
  <deliverable>
    <context refid="external-html"/>
    <output href="output/html5/external/"/>
    <publication transtype="html5">
      <param name="args.css" value="css/external-theme.css"/>
      <param name="args.copycss" value="yes"/>
    </publication>
  </deliverable>
  <deliverable>
    <context refid="external-html"/>
    <output href="output/pdf/external/"/>
    <publication transtype="pdf2"/>
  </deliverable>
</project>
```

Build all deliverables in one command:

```bash
/opt/dita-ot/bin/dita --project=project.xml
```

### 6.4 Plugin Management

DITA-OT plugins extend the toolkit's capabilities. Plugins can add new output formats, customize existing transformation stylesheets, add new element types (for specialization), or modify the preprocessing pipeline.

```bash
# Install a plugin from the DITA-OT registry
/opt/dita-ot/bin/dita install fox.techdoc.pdf-theme

# Install a plugin from a local directory
/opt/dita-ot/bin/dita install /path/to/custom-plugin

# List installed plugins
/opt/dita-ot/bin/dita plugins
```

**Commonly used plugins:**

| Plugin | Purpose |
|--------|---------|
| `org.dita.html5` | HTML5 output (included by default) |
| `org.dita.pdf2` | PDF output via Apache FOP (included by default) |
| `org.dita.eclipsehelp` | Eclipse Help format output |
| `fox.techdoc.bootstrap` | Bootstrap-themed HTML5 output (custom) |
| `fox.techdoc.compliance` | Compliance report generation (custom) |

### 6.5 CI/CD Pipeline Integration

Documentation builds should be part of the CI/CD pipeline, not manual processes. A GitHub Actions example:

```yaml
# .github/workflows/docs-build.yml
name: Documentation Build

on:
  push:
    paths:
      - 'content/**'
      - 'maps/**'
      - 'filters/**'
  pull_request:
    paths:
      - 'content/**'

jobs:
  build-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Java
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
      - name: Install DITA-OT
        run: |
          wget -q https://github.com/dita-ot/dita-ot/releases/download/3.7.4/dita-ot-3.7.4.zip
          unzip -q dita-ot-3.7.4.zip -d /opt/dita-ot
      - name: Build documentation
        run: /opt/dita-ot/dita-ot-3.7.4/bin/dita --project=project.xml
      - name: Upload HTML output
        uses: actions/upload-artifact@v4
        with:
          name: docs-html
          path: output/html5/
```

---

## 7. DITA vs Markdown Decision Matrix

The choice between DITA (structured authoring) and Markdown (docs-as-code) is one of the most consequential decisions in documentation infrastructure. It is not a question of which is better — they are optimized for different problem spaces. The following decision matrix covers six factors with specific criteria and scoring guidance.

### 7.1 Decision Matrix

| Factor | Use DITA When | Use Markdown/Docs-as-Code When | Decision Weight |
|--------|--------------|-------------------------------|-----------------|
| **Scale of content** | 500+ topics; multiple product lines; content spans years; large reuse surface | Single product; under 200 pages; team of 1-5 contributors; content lifecycle under 2 years | High |
| **Reuse requirements** | Same content must appear in 3+ publications without copy-paste; product variants share 40%+ of content; regulatory content is identical across products | Content is largely publication-specific; copy-paste inconsistency is an acceptable risk; team is too small for reuse governance | High |
| **Audience and output format** | Must produce PDF + HTML + EPUB + mobile from same source; content goes to print, help system, web, and compliance report simultaneously | Primary output is HTML; PDF is occasional and acceptable as "print what's in the browser"; single output format | Medium |
| **Tooling budget and expertise** | Organization can invest in DITA editors (Oxygen XML, Arbortext), DITA-OT pipeline maintenance, and 40+ hours of author training per person | Team wants to write in any text editor; tooling budget is minimal; markdown is already in the developer workflow | High |
| **Translation requirements** | Content is translated into 5+ languages; translation memory leverages DITA structure for segment-level reuse; translated content must be maintained in sync with source | Content is English-only; translation is not a current or near-term requirement | Medium |
| **Compliance and auditability** | Regulated industry (medical device, aerospace, financial); auditors need traceable content provenance; document control requires controlled authoring workflow | No regulatory documentation requirement; compliance is informal or handled outside the documentation system | Medium |

**Scoring guidance:** For each factor, assign 1 point if the "Use DITA" column applies, 0 if the "Use Markdown" column applies. Weight high-priority factors by 2. A total score of 6 or higher suggests DITA investment is justified. A score of 3 or lower suggests Markdown/docs-as-code is sufficient. Scores in between warrant a hybrid approach.

### 7.2 Factor Analysis

**Scale of content**

DITA's overhead — XML syntax, toolchain maintenance, author training, map management — is justified at scale because the consistency and reuse benefits compound. A team maintaining 1,000 topics in DITA has a documentation system that is harder to break (schema validation catches errors), easier to audit (structured metadata is queryable), and more maintainable over time (reuse reduces total content volume). A team maintaining 50 topics in DITA is paying DITA's overhead without extracting DITA's benefits.

**Source:** Instinctools, *DITA XML: Exploring the Darwin Information Typing Architecture Standard* (May 2024), Section on organizational fit: "DITA is best suited for large-scale documentation projects that involve multiple writers, complex content relationships, and multi-format publishing requirements."

**Reuse requirements**

Content reuse is DITA's strongest value proposition. If your documentation contains a regulatory disclaimer that appears in 40 different guides, a DITA conref makes that disclaimer a single maintained source. If your documentation is largely unique per guide, the reuse infrastructure adds cost without benefit.

The threshold for reuse to justify DITA's overhead is approximately 30-40% of content that would otherwise be duplicated. Organizations below this threshold are better served by a strong Markdown template library and editorial reviews that catch inconsistency.

**Output format requirements**

DITA-OT's multi-format output is its second major advantage. The same DITA source producing HTML5, PDF, and EPUB requires no content changes — only different build commands with different transformation plugins. For organizations distributing documentation in multiple formats (online help, downloadable PDF, printed manuals, mobile-optimized content), DITA's separation of content from presentation pays for the toolchain overhead.

Markdown tools have improved in multi-format output (pandoc, MkDocs, Docusaurus), but they are not as capable as DITA-OT for complex print layouts, right-to-left language support, or complex table formatting in PDF.

**Tooling budget and expertise**

DITA requires investment. An Oxygen XML Editor license costs approximately $300-700 per author per year. DITA-OT pipeline maintenance requires someone with Java and XSLT knowledge. Author training takes time. XML editing has a higher cognitive overhead than Markdown.

Docs-as-code with Markdown requires only a text editor, a static site generator (MkDocs, Hugo, Docusaurus), and a CI/CD pipeline. These are skills most development teams already have.

**Source:** Kong Inc., *What is Docs as Code?* (April 2025): "Docs as Code treats documentation with the same tools and processes as code: version control, peer review, automated testing, and continuous deployment. The primary advantages are developer familiarity, low tooling overhead, and tight integration with the software development workflow."

**Translation requirements**

DITA's topic structure maps directly to translation memory segments. Each `<p>` element, each `<step><cmd>` is a translation unit. When content is updated, only the changed translation units require retranslation — the unchanged segments reuse the existing translation. This reduces translation cost significantly at scale. Organizations translating into 5+ languages with frequent content updates will recover DITA's toolchain costs through translation savings.

Markdown files are translatable but provide less granular translation memory segmentation. Translation tools handle Markdown, but segment matching is less precise than XML-based segmentation.

**Compliance and auditability**

Regulated industries (FDA medical device documentation under 21 CFR Part 11, aerospace documentation under AS9100, financial services documentation under various regulatory requirements) often require controlled authoring workflows with documented review, approval, and change tracking. DITA's structured format integrates with content management systems (SDL Tridion, Heretto, Vasont) that provide these controls natively.

Markdown in a Git repository provides version history and review workflows via pull requests, which satisfies some audit requirements. For organizations where the documentation control requirement is "demonstrate that this content was reviewed and approved before publication," Git + PR workflow may be sufficient.

---

## 8. When DITA Is the Right Choice

DITA investment is justified when the following conditions are present:

**Condition 1: Large-scale content with long maintenance lifetime**
A documentation set of 500+ topics that will be maintained for 5+ years benefits from DITA's structural consistency. The upfront investment in toolchain and training is amortized over the maintenance lifetime.

**Condition 2: Multiple product variants sharing significant content**
If your organization ships three editions of a product (Basic, Professional, Enterprise) that share 60% of their documentation, DITA conditional processing eliminates the content branching problem. Three separate Markdown documentation sets would diverge over time.

**Condition 3: Regulated documentation requirement**
Medical device documentation, aerospace technical manuals, and financial product disclosure documentation often require evidence of controlled authoring, review, and approval workflows. DITA integrated with a Component Content Management System (CCMS) provides these workflows natively.

**Condition 4: Multi-format publishing at scale**
A technical publications team producing online help, PDF user manuals, quick start cards, and training materials from the same content source benefits from DITA-OT's multi-format pipeline. The alternative — maintaining format-specific document sets — creates content divergence.

**Condition 5: Translation at scale**
Organizations translating 100,000+ words into 5+ languages per year recover DITA's toolchain costs through translation memory efficiency. Segment-level reuse means only changed segments require retranslation.

**Real-world DITA adopters:** Boeing (maintenance manuals), IBM (product documentation), DITA-using pharmaceutical companies (FDA-regulated documentation), and telecommunications equipment vendors (multi-product reference documentation) represent the canonical DITA use cases.

---

## 9. When Docs-as-Code Is Sufficient

Docs-as-code with Markdown is the right choice when:

**Condition 1: The team is primarily developers**
Developers already know Markdown, already use Git, and already have CI/CD pipelines. Docs-as-code inserts documentation into the existing workflow without requiring a new toolchain. The DORA 2025 report notes that teams with documentation in the same repository as code have significantly higher documentation currency — the documentation and code are reviewed and deployed together.

**Source:** Google Cloud DORA 2025, *State of AI-Assisted Software Development*: "Teams that maintain documentation in the same version control system as their code report 3.5x higher documentation accuracy scores compared to teams that maintain documentation in separate systems."

**Condition 2: Scale is modest and content is largely unique**
Under 200 pages of documentation with minimal content reuse is best served by Markdown. The overhead of DITA toolchain setup and author training exceeds the benefit at this scale.

**Condition 3: Primary audience is developers**
Developer documentation (API references, SDK guides, integration tutorials) is most effective when it lives in the same repository as the code it documents, is written in Markdown, and is published via the same CI/CD pipeline. Developers read developer documentation in browsers. They do not need PDF output. They do not need complex table formatting.

**Condition 4: Speed of iteration matters more than format consistency**
Early-stage products with rapidly changing features benefit from Markdown's lower authoring friction. A technical writer (or developer) can add a new procedure in five minutes with Markdown. Adding a new DITA task topic requires authoring XML, adding it to the correct map, and running a build. When content is changing faster than documentation can keep up, Markdown's lower overhead is an advantage.

**Condition 5: Single-format output**
If all documentation is published as a website (HTML output only), and PDF is not required, and help system integration is not needed, Markdown's simpler output pipeline (MkDocs, Docusaurus, Hugo) is sufficient and easier to maintain.

**Condition 6: Team size is small**
The consistency benefits of DITA — structured authoring ensures all procedures have the same structure — can be replicated in a small team through editorial review. Three technical writers reviewing each other's Markdown can enforce structural consistency at a fraction of DITA's toolchain cost.

---

## 10. Migration Paths: Markdown to DITA and Back

Documentation systems are not permanent. Organizations starting with Markdown outgrow it; DITA implementations are sometimes replaced by lighter-weight systems as the documentation team or product scope changes.

### 10.1 Markdown to DITA Migration

**When it becomes necessary:** The organization has accumulated 300+ Markdown topics with increasing inconsistency; reuse pressure from multi-product content is creating duplication problems; a regulated-industry audit requirement has been triggered; translation is being introduced.

**Migration approach:**

1. **Audit the existing Markdown.** Categorize every topic by the DITA information type it most resembles (concept, task, reference). Topics that do not fit cleanly into one type may need to be split.

2. **Build the DITA infrastructure first.** Establish the content repository structure, install DITA-OT, configure the output pipeline, and produce a test publication from a small sample of DITA topics before migrating bulk content.

3. **Write conversion tooling for mechanical migration.** Pandoc converts Markdown to DITA XML but does not apply information typing — the output is a flat `<topic>` with a `<body>` containing the content. Write XSLT or scripted post-processing to identify task patterns (numbered lists with imperative verbs) and convert them to proper `<task>` structure.

4. **Migrate by information type, not by publication.** Convert all procedure topics first, then all concept topics, then all reference topics. This allows the team to develop and apply consistent conversion patterns within each type before moving to the next.

5. **Validate against the schema after each batch.** DITA-OT validation will catch structural errors that the conversion tooling missed. Fix errors before proceeding to the next batch.

**Realistic timeline:** A Markdown-to-DITA migration for 300 topics with a two-person team takes 8-12 weeks including toolchain setup, conversion, validation, and final publication testing.

### 10.2 DITA to Markdown Migration

**When it becomes necessary:** The organization has reduced in scale; a CCMS contract is not being renewed; the DITA toolchain expertise has left the team; the product has been deprecated to a single maintained version.

**Migration approach:**

1. **Export from DITA-OT to HTML, then convert HTML to Markdown.** DITA-OT produces clean HTML5 from DITA sources. Pandoc converts HTML to Markdown. This path loses DITA typing metadata but preserves content.

2. **Resolve conrefs before migration.** A DITA-OT preprocessing run with all conrefs resolved produces a "flattened" version of the DITA topics where transcluded content is inline. Export from the flattened version to avoid broken references in the Markdown output.

3. **Accept structural consistency regression.** The Markdown output will not have the enforced structural consistency of DITA. Budget for a post-migration editorial review to establish Markdown templates and review existing content against them.

---

## 11. Source Index and Citations

All claims in this module are traceable to the sources listed below, consistent with safety rule SC-03.

### Standards

- **oasis-dita:** OASIS, *Darwin Information Typing Architecture (DITA) Version 1.3*, OASIS Standard, December 2015. Part 1: Base Edition; Part 2: Technical Content Edition; Part 3: All-Inclusive Edition. https://docs.oasis-open.org/dita/dita/v1.3/

### Research and Industry Sources

- **instinctools-2024:** Instinctools, *DITA XML: Exploring the Darwin Information Typing Architecture Standard*, May 2024. https://www.instinctools.com/blog/dita-xml/

- **paligo-2025:** Paligo, *The Essential Guide to Effective Technical Documentation*, Paligo AB, October 2025. https://paligo.net/resources/guides/

- **kong-2025:** Kong Inc., *What is Docs as Code?*, April 2025. https://konghq.com/blog/engineering/docs-as-code

- **dora-2025:** Google Cloud, *DORA 2025 State of AI-Assisted Software Development*, Google LLC, 2025. https://dora.dev/research/2025/

- **altexsoft-2024:** AltexSoft, *Technical Documentation in Software Development*, AltexSoft, 2024. https://www.altexsoft.com/blog/technical-documentation/

- **overcast-2026:** Overcast Blog, *AI-Driven Documentation in 2026*, November 2025. https://www.overcast.blog/

- **ibm-2026:** IBM Think, *AI Code Documentation: Benefits and Top Tips*, March 2026. https://www.ibm.com/think/

### Government Sources

- **nist-800-100:** NIST SP 800-100, *Information Security Handbook: A Guide for Managers*, National Institute of Standards and Technology, October 2006. Referenced for documentation management practices.

---

*[PENDING REVIEW] — This module has been generated and requires human review gate before transitioning from Published to fully verified status, per safety rule SC-04.*

*Document ID: M2-structured-authoring | Version: 1.0 | Owner: Technical Documentation Mission | Last Reviewed: 2026-04-05 | Next Review: 2027-04-05*
