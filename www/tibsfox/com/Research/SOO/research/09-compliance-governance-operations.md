# Compliance & Governance Operations

> **Domain:** Systems Operations -- Regulatory Compliance & Security Governance
> **Module:** 9 -- Compliance & Governance Operations
> **Through-line:** *Compliance is not security. Security is not compliance. But if you can't prove your security posture to an auditor with timestamped evidence, you have neither. The operational discipline of compliance is the machinery that produces that proof -- continuously, not annually.*
> **Rosetta Clusters:** Infrastructure (primary), Business
> **Sources:** AICPA Trust Services Criteria, NIST SP 800-53, PCI SSC, HHS HIPAA Security Rule, GDPR Articles 5/25/32, CISA KEV Catalog, DORA State of DevOps, vendor documentation (Vanta, Drata, Qualys, Tenable, Aqua Security)

---

## Table of Contents

1. [SOC2 Operational Controls](#1-soc2-operational-controls)
2. [Audit Preparation](#2-audit-preparation)
3. [Access Reviews](#3-access-reviews)
4. [Change Evidence](#4-change-evidence)
5. [Log Retention](#5-log-retention)
6. [Vulnerability Management](#6-vulnerability-management)
7. [Patch Management](#7-patch-management)
8. [GRC Tooling](#8-grc-tooling)
9. [Compliance Frameworks Comparison](#9-compliance-frameworks-comparison)
10. [Numbers](#10-numbers)
11. [Study Topics](#11-study-topics)
12. [Cross-Cluster Connections](#12-cross-cluster-connections)
13. [Sources](#13-sources)

---

## 1. SOC2 Operational Controls

SOC 2 (Service Organization Control 2) is an auditing standard developed by the AICPA that evaluates how service providers manage customer data. It is the dominant compliance framework for SaaS companies operating in the United States. International companies dealing with US customers will encounter SOC 2 requirements regularly -- it has become the de facto trust signal for B2B software.

### Trust Service Criteria

The SOC 2 framework evaluates controls against five Trust Service Criteria (TSC), established in 2017 and revised with updated points of focus in 2022 to address evolving technologies and threat landscapes:

| Criterion | Abbreviation | Core Question | Required? |
|-----------|-------------|---------------|-----------|
| **Security** | CC (Common Criteria) | Is the system protected against unauthorized access? | Yes -- always |
| **Availability** | A | Is the system available for operation as committed? | Optional |
| **Processing Integrity** | PI | Is system processing complete, valid, accurate, and timely? | Optional |
| **Confidentiality** | C | Is confidential information protected as committed? | Optional |
| **Privacy** | P | Is personal information collected, used, retained, and disclosed in conformity with commitments? | Optional |

Security (the Common Criteria) is always in scope. The other four are selected based on what the organization commits to its customers. A typical SaaS company pursuing SOC 2 for the first time selects Security plus Availability. Companies handling financial data add Processing Integrity. Those storing PII add Privacy.

### Common Criteria Categories

The Security criterion alone contains 33 criteria organized into 9 categories:

| Category | Code | Focus |
|----------|------|-------|
| Control Environment | CC1.x | Governance, organizational commitment |
| Communication and Information | CC2.x | Internal/external communication of policies |
| Risk Assessment | CC3.x | Identifying and analyzing risks |
| Monitoring Activities | CC4.x | Ongoing evaluation of controls |
| Control Activities | CC5.x | Selection and development of controls |
| Logical and Physical Access | CC6.x | Authentication, authorization, access control |
| System Operations | CC7.x | Detection of anomalies, incident response |
| Change Management | CC8.x | Change authorization, testing, approval |
| Risk Mitigation | CC9.x | Business disruption, vendor management |

### Type I vs Type II Audits

| Dimension | Type I | Type II |
|-----------|--------|---------|
| **What it evaluates** | Control design at a point in time | Control design AND operating effectiveness over time |
| **Observation period** | Single date (snapshot) | 3--12 months (typically 6 or 12) |
| **Auditor work** | Reviews policies, configurations, interviews | All of Type I plus sampling evidence over the period |
| **Cost** | $5,000--$20,000 (auditor fees) | $15,000--$60,000 (auditor fees) |
| **Total cost** | $20,000--$50,000 (including internal labor) | $30,000--$150,000 (including internal labor, tooling, prep) |
| **Timeline** | 2--6 weeks | 3--12 months (observation) + 2--6 weeks (fieldwork) |
| **Customer perception** | "They have policies" | "They follow their policies" |
| **Market expectation** | Acceptable for early-stage startups | Required by enterprise customers |

Type I is a stepping stone. It proves you have designed controls; Type II proves you operate them. Enterprise procurement teams increasingly reject Type I reports and require Type II. The typical progression: achieve Type I to unblock early deals, then begin the observation period for Type II immediately.

### Common Operational Control Failures

These are the failures auditors find most frequently during SOC 2 examinations:

1. **Access not revoked on termination.** Former employees retain active accounts. The gap between HR termination and IT deprovisioning is the single most common finding.
2. **Missing change approvals.** Code deployed to production without pull request review or approval evidence. Self-merged PRs without exception documentation.
3. **Incomplete evidence.** Controls exist but evidence was not collected. "We do quarterly access reviews" with no documented record of the review.
4. **Inconsistent policy enforcement.** Policy states "MFA required for all users" but service accounts bypass MFA.
5. **Vendor management gaps.** No documented risk assessment of critical vendors. No periodic reassessment of vendor security posture.
6. **Monitoring without response.** Alerts configured but no evidence of triage or response. Logs collected but never reviewed.

### The SOC 2 Audit Cycle

The annual SOC 2 cycle follows a predictable rhythm:

```
Month 1-2:  Gap assessment and remediation
Month 3:    Observation period begins (Type II)
Month 3-8:  Continuous evidence collection, control operation
Month 9:    Observation period ends (6-month window)
Month 10:   Auditor fieldwork (2-4 weeks)
Month 11:   Draft report review, management response to exceptions
Month 12:   Final report issued
```

The observation period cannot be shortened. If an auditor finds a control gap at month 5, the observation window may need to restart. This is why continuous compliance monitoring matters -- discovering failures early gives time to remediate within the window rather than restarting it.

### 2026 Updates

The AICPA has intensified emphasis in several areas for current SOC 2 examinations:

- **Vendor risk management:** Controls must now demonstrably cover vendor onboarding, periodic reassessment, contract management, offboarding, and incident response coordination.
- **Data completeness and accuracy:** Organizations must demonstrate the integrity of data used in control monitoring.
- **Zero-trust alignment:** Auditors increasingly expect evidence of modern access controls, network segmentation, MFA, and least-privilege policies.
- **AI governance:** For organizations deploying AI systems, auditors are beginning to evaluate controls around model access, training data protection, and output monitoring.

---

## 2. Audit Preparation

The fundamental choice in audit preparation is between continuous compliance and the annual scramble. Organizations that treat compliance as a project -- something to prepare for -- spend 3--4x more engineering time than those that treat it as an ongoing operational discipline.

### Continuous Compliance vs Annual Scramble

| Dimension | Annual Scramble | Continuous Compliance |
|-----------|----------------|----------------------|
| Engineering hours | 300--500+ concentrated in 6--8 weeks | 50--100 distributed across 12 months |
| Evidence quality | Screenshots, hastily written justifications | Automated exports, timestamped records |
| Audit findings | 5--15 exceptions typical | 0--3 exceptions typical |
| Team morale | "Compliance season" dread | Minimal disruption |
| Cost (internal labor) | $50,000--$75,000 (concentrated) | $25,000--$40,000 (distributed) |
| Risk of failed audit | Moderate | Low |

### Evidence Repositories

Every control needs an evidence artifact. The evidence repository is the single source of truth auditors examine:

**What belongs in an evidence repository:**
- Access review completion records with reviewer sign-off
- Change approval records (PR approvals, CAB minutes)
- Vulnerability scan results with remediation tracking
- Incident response records and postmortem reports
- Security awareness training completion records
- Vendor risk assessment documents
- Business continuity test results
- Encryption configuration evidence

**Storage options:**
- **GRC platform** (Vanta, Drata): Automated collection, auditor portal access
- **Shared drive with strict access control:** Low-tech but functional for small teams
- **Ticketing system** (Jira, Linear): Evidence linked to specific control tickets
- **Git repository:** Version-controlled evidence with commit history

### Control Owner Assignments

Every control must have an owner. A control without an owner is a control that will fail:

| Control Domain | Typical Owner | Backup |
|----------------|--------------|--------|
| Access management | IT/Security lead | Engineering manager |
| Change management | Engineering lead | DevOps lead |
| Incident response | Security lead | On-call rotation lead |
| Vendor management | Security lead | Procurement/legal |
| Availability monitoring | SRE/DevOps lead | Platform team lead |
| Data protection | Security lead | DBA or data team lead |
| HR security | HR lead | Office manager |
| Physical security | Facilities | Office manager |

### Gap Assessment Checklist

Before engaging an auditor, conduct an internal gap assessment:

- [ ] All policies written, approved, and dated within the last 12 months
- [ ] Evidence collection automated for at least 80% of controls
- [ ] Access reviews completed for the current quarter
- [ ] Vulnerability scans run within the last 30 days
- [ ] Incident response plan tested within the last 12 months
- [ ] Vendor risk assessments current for all critical vendors
- [ ] Employee security training completed within the last 12 months
- [ ] Business continuity plan tested within the last 12 months
- [ ] All terminated employees deprovisioned within SLA (typically 24 hours)
- [ ] MFA enforced for all user accounts (including admin and service accounts where possible)

### The Real Cost of Audit

The auditor's invoice is the smallest line item. The real cost breaks down:

| Cost Category | Range | Notes |
|---------------|-------|-------|
| Auditor fees | $15,000--$60,000 | Type II, mid-size company |
| GRC platform | $10,000--$30,000/year | Vanta, Drata, SecureFrame |
| Internal labor | $50,000--$75,000 | Project lead at 50% capacity for 6 months |
| Remediation costs | $10,000--$50,000 | Tooling, configuration, process changes |
| Opportunity cost | Varies | Engineering time diverted from product |
| **Total first year** | **$85,000--$215,000** | Subsequent years: 40--60% of first year |

---

## 3. Access Reviews

Quarterly access reviews are a core SOC 2 requirement under CC6.1 (Logical and Physical Access Controls). Auditors examine whether the organization periodically validates that access privileges remain appropriate.

### What Auditors Actually Check

Auditors do not verify that every permission is correct. They verify that the review process occurred, was documented, and resulted in action where needed:

1. **Evidence of scheduled reviews** -- recurring calendar entries, ticketing system records
2. **Reviewer appropriateness** -- managers reviewing their direct reports, not self-reviews
3. **Timeliness** -- reviews completed within the committed cadence (quarterly)
4. **Remediation** -- evidence that inappropriate access was actually revoked, not just flagged
5. **Coverage** -- all critical systems included, not just a subset

### RBAC Hygiene

Role-Based Access Control (RBAC) is the foundation of access management. Poor RBAC hygiene is the root cause of most access review failures:

**Common RBAC failures:**
- **Role explosion:** 200 roles for 50 people because each access request created a new role
- **Permission creep:** Users accumulate roles through lateral moves without losing old ones
- **God roles:** A "super-admin" role used by 15 people who each need one specific permission
- **Orphaned roles:** Roles tied to decommissioned systems that still grant access elsewhere
- **Default-open:** New users assigned broad roles "to get them started" that never get narrowed

**RBAC hygiene practices:**
- Audit role count quarterly -- target fewer roles than employees
- Enforce role-based provisioning through the identity provider, not individual system grants
- Require justification for any role assignment outside the standard set
- Review role definitions annually -- do the permissions still match the job function?
- Implement role expiration for elevated access (30/60/90 day auto-revocation)

### Principle of Least Privilege in Practice

Least privilege is easy to state and hard to maintain. Every organization starts with good intentions and drifts toward over-provisioning:

**The drift pattern:**
1. New employee gets minimal access
2. Employee cannot do their job, files access request
3. Manager approves broad access to unblock them quickly
4. Employee changes roles, retains all previous access
5. Three years later: user has access to 40 systems, actively uses 6

**Counter-measures:**
- **Quarterly access reviews** catch the drift
- **Access request expiration** (90 days default, renewable) prevents permanent accumulation
- **Role mining** (analyzing actual usage patterns to define appropriate roles)
- **Manager attestation** -- managers must confirm each direct report's access quarterly

### Service Account Management

Service accounts are the blind spot of access management. They don't have managers. Nobody reviews their access. They often have elevated privileges:

| Risk | Mitigation |
|------|------------|
| No owner | Assign every service account to a human owner in the CMDB |
| Shared credentials | Each service gets its own account with unique credentials |
| Never rotated | Enforce credential rotation every 90 days minimum |
| Over-privileged | Apply least privilege; service accounts should have exactly the permissions their workload requires |
| No audit trail | Log all service account authentication and activity |
| Persist after decommission | Include service accounts in system decommission checklists |

### Just-in-Time (JIT) Access

JIT access represents the evolution beyond static RBAC. Instead of granting standing privileges, access is provisioned on demand for a limited duration:

**How JIT works:**
1. User requests elevated access through a portal or CLI
2. System verifies identity (MFA required) and evaluates request against policies
3. Request is auto-approved (low-risk, policy-matching) or routed for manual approval
4. Access is granted for a defined window (1 hour, 4 hours, 1 day)
5. Access automatically revokes when the window expires
6. Every grant and action is logged for audit

**JIT for SOC 2:** JIT creates clean, event-based audit trails. Instead of explaining why a user had standing admin access for a year, auditors see precisely who accessed what, when, and why. This dramatically simplifies quarterly access reviews.

**Automated Access Review Platforms:**

| Platform | Strength | Price Range |
|----------|----------|-------------|
| **Vanta** | Broadest integrations (375+), fast setup | $10,000--$30,000/year |
| **Drata** | Deep customization, developer-friendly | $15,000--$100,000/year |
| **SecureFrame** | Strong compliance-first UX | $10,000--$25,000/year |
| **ConductorOne** | JIT-native, identity governance | $15,000--$40,000/year |

---

## 4. Change Evidence

In a SOC 2 audit, change management evidence demonstrates that modifications to systems are authorized, tested, and traceable. CC8.1 requires that changes to infrastructure, data, software, and procedures are authorized, designed, developed, configured, documented, tested, approved, and implemented.

### Git as the Change Record

Git is the most complete change record most organizations already maintain. Every commit is a timestamped, attributed, content-addressed record of exactly what changed:

**What Git provides as audit evidence:**
- **Who:** Commit author and committer identity
- **What:** Exact diff of every change
- **When:** Commit timestamp (with committer timestamp for rebases)
- **Why:** Commit message linking to ticket/requirement
- **Authorization:** PR approval records (who approved, when)
- **Review:** Code review comments and resolution

**GitHub SOC 2 configuration checklist:**
- Branch protection requiring PR approval before merge to production branches
- Minimum one reviewer for all PRs (two for critical paths)
- CODEOWNERS file for sensitive paths (infrastructure, authentication, billing)
- Signed commits enabled (optional but strengthens non-repudiation)
- Audit log streaming to external storage (GitHub retains only 90 days)
- Organization-wide MFA enforcement
- Dependabot enabled for dependency vulnerability scanning
- Secret scanning with push protection enabled

### Deployment Logs as Evidence

Deployment logs bridge the gap between "code was approved" and "code reached production":

**The complete audit trail chain:**
```
Ticket (Jira/Linear) --> Branch --> PR (with review) --> Merge --> CI/CD Pipeline --> Deployment Log --> Production
    [requirement]        [code]     [authorization]    [approval]    [build/test]      [evidence]      [running]
```

**What deployment logs must capture:**
- Deployment timestamp
- Deployer identity (human or CI/CD service account)
- Artifact version/hash deployed
- Environment target
- Deployment method (automated pipeline, manual)
- Success/failure status
- Rollback records if applicable

### Automated Evidence Collection

The goal is zero manual evidence gathering. Every control should produce its own evidence automatically:

| Evidence Type | Collection Method | Tool |
|---------------|------------------|------|
| Code changes | Git commit history + PR records | GitHub/GitLab API export |
| Deployment records | CI/CD pipeline logs | GitHub Actions, Jenkins, ArgoCD |
| Access changes | Identity provider audit logs | Okta, Azure AD log export |
| Infrastructure changes | IaC commit history + apply logs | Terraform state + plan logs |
| Vulnerability scans | Scheduled scan exports | Trivy, Qualys, Nessus reports |
| Incident records | Ticketing system exports | PagerDuty, Jira, Rootly |

### Linking the Chain

The strongest evidence chains are traceable end-to-end. The convention:

- Commit messages reference ticket IDs: `fix(auth): resolve session timeout [PROJ-1234]`
- PR descriptions link to requirements or change requests
- CI/CD pipelines tag artifacts with the commit SHA and PR number
- Deployment logs reference the artifact version and triggering PR
- Post-deployment verification links back to the original ticket

An auditor should be able to start from any point in the chain and trace forward or backward to every other point. This is the audit trail chain -- and it is the single most persuasive evidence artifact in a SOC 2 examination.

---

## 5. Log Retention

Log retention is where compliance frameworks get specific and where operational costs get real. Different frameworks mandate different retention periods, and the organization must comply with the longest applicable requirement.

### Regulatory Requirements

| Framework | Minimum Retention | Details |
|-----------|------------------|---------|
| **HIPAA** | 6 years | Audit logs for systems handling ePHI. 45 CFR 164.312(b) |
| **PCI-DSS 4.0** | 12 months (3 months hot) | Requirement 10.7: Retain audit trail history for at least 12 months, with at least the most recent 3 months immediately available for analysis |
| **SOC 2** | Not specified | No explicit retention period, but auditors expect 12 months minimum for the observation window. Confidentiality (C1.2) and Privacy criteria have data retention considerations |
| **GDPR** | Not specified | Article 5(1)(e): personal data kept only as long as necessary for processing purpose. Applies to logs containing personal data |
| **SOX** | 7 years | Section 802: audit workpapers and records |
| **NIST 800-53** | 3 years recommended | AU-11: organization-defined time period consistent with records retention policy |
| **SEC Rule 17a-4** | 6 years (first 2 years immediately accessible) | Broker-dealer electronic records |
| **FISMA** | 3 years | Federal information systems |

**The practical rule:** If your organization processes credit cards (PCI-DSS: 12 months), handles healthcare data (HIPAA: 6 years), and is publicly traded (SOX: 7 years), the audit logs touching all three domains require 7-year retention. Apply the longest applicable requirement.

### Tiered Retention Architecture

Storing 7 years of logs in hot storage is financially ruinous. Tiered retention balances cost with accessibility:

| Tier | Storage Class | Access Latency | Cost (per GB/month) | Retention Phase |
|------|--------------|----------------|---------------------|-----------------|
| **Hot** | SSD-backed, indexed, searchable | Milliseconds | $0.10--$0.25 | 0--90 days |
| **Warm** | Object storage, queryable | Seconds--minutes | $0.02--$0.05 | 90 days--1 year |
| **Cold** | Archive storage (Glacier, etc.) | Hours | $0.004--$0.01 | 1--7 years |
| **Deep archive** | Tape-equivalent | 12--48 hours | $0.001--$0.004 | 7+ years (legal hold) |

**Example cost calculation for 1 TB/day log volume:**

| Tier | Volume | Monthly Cost |
|------|--------|-------------|
| Hot (90 days) | 90 TB | $9,000--$22,500 |
| Warm (9 months) | 270 TB | $5,400--$13,500 |
| Cold (6 years) | 2,190 TB | $8,760--$21,900 |
| **Total annual** | | **$277,920--$694,800** |

This is why log volume management is a FinOps concern as much as a compliance concern. Reducing log verbosity, filtering noise at ingestion, and compressing aggressively before cold storage are operational necessities.

### Log Immutability

Immutable logs ensure that log records cannot be modified or deleted after creation. This is both a compliance requirement and a forensic necessity:

**WORM (Write Once Read Many) storage:**
- AWS S3 Object Lock (Compliance mode -- cannot be overridden, even by root)
- Azure Immutable Blob Storage
- Google Cloud Storage retention policies with bucket lock
- On-premises: NetApp SnapLock, Dell EMC Centera

**Tamper-evident logging:**
The practical standard is tamper-evidence rather than tamper-proof. Tamper-evident systems do not prevent modification -- they ensure that any modification leaves undeniable evidence. This is typically achieved through:

- Cryptographic hash chaining (each log entry includes a hash of the previous entry)
- Timestamp authority (external trusted timestamp service)
- Segregation of duties (log writers cannot delete or modify logs)
- Digital signatures on log batches

NIST defines the standard: immutable audit logs maintain integrity through WORM storage, cryptographic verification, timestamp authority, and access control segregation.

### Legal Hold Obligations

A legal hold (litigation hold) overrides normal retention schedules. When litigation is anticipated or in progress, all potentially relevant records must be preserved regardless of retention policy:

- Legal holds are triggered by counsel, not IT
- They override deletion policies -- data scheduled for destruction must be preserved
- They apply to logs, emails, chat messages, documents, backups, and any electronically stored information (ESI)
- Failure to preserve after notice constitutes spoliation, which carries severe legal consequences
- Legal holds must be communicated to all custodians and their compliance tracked

---

## 6. Vulnerability Management

Vulnerability management is the operational discipline of finding, prioritizing, tracking, and remediating security weaknesses across the technology stack. For SOC 2, it maps to CC7.1 (detection of changes that could impact controls) and CC3.1 (identification of threats and vulnerabilities).

### CVSS Scoring and Prioritization

The Common Vulnerability Scoring System (CVSS) provides a standardized severity rating for vulnerabilities. The current version is CVSS v4.0 (released November 2023). CVSS v3.1 remains widely used in tooling:

| Severity | CVSS Range | Characteristics |
|----------|-----------|-----------------|
| **Critical** | 9.0--10.0 | Easily exploitable, severe impact, often network-accessible with no authentication |
| **High** | 7.0--8.9 | Exploitable with moderate complexity or requiring some privileges |
| **Medium** | 4.0--6.9 | Requires specific conditions or produces limited impact |
| **Low** | 0.1--3.9 | Difficult to exploit or minimal impact |
| **None** | 0.0 | Informational |

**Beyond CVSS -- contextual prioritization:**

CVSS alone is insufficient. A Critical vulnerability in an air-gapped test system is less urgent than a High vulnerability in an internet-facing production API. Modern vulnerability management adds context:

- **EPSS** (Exploit Prediction Scoring System): Probability that a vulnerability will be exploited in the wild within 30 days
- **CISA KEV** (Known Exploited Vulnerabilities catalog): Confirmed actively exploited vulnerabilities
- **Asset criticality:** Business impact of the affected system
- **Network exposure:** Internet-facing vs internal vs air-gapped
- **Compensating controls:** WAF rules, network segmentation that reduce exploitability

Using threat intelligence and contextual enrichment can reduce 1,000 scanner-reported "Critical" items to 6--20 truly urgent ones.

### Remediation SLAs

SLAs define the maximum time allowed between vulnerability discovery and remediation:

| Severity | Typical SLA | Aggressive SLA | Rationale |
|----------|------------|----------------|-----------|
| **Critical** | 7--15 days | 24--72 hours | Active exploitation possible; maximum business risk |
| **High** | 30 days | 7 days | Exploitation likely; significant risk |
| **Medium** | 60 days | 30 days | Exploitation requires specific conditions |
| **Low** | 90 days | 60--90 days | Minimal risk; batch with regular maintenance |

**SLA enforcement mechanics:**
- Vulnerability tickets auto-created from scan results
- Severity sets ticket priority and due date
- Escalation rules trigger when SLA is approaching (50% elapsed, 75% elapsed, breached)
- SLA breach metrics reported to security leadership monthly
- Exception process for vulnerabilities that cannot be remediated within SLA

### Vulnerability Exception Process

Not every vulnerability can be remediated within SLA. The exception process must be documented and auditable:

1. **Requestor** documents why remediation cannot meet SLA (dependency constraint, vendor patch unavailable, system criticality prevents change)
2. **Compensating controls** identified and documented (WAF rule, network restriction, monitoring enhancement)
3. **Risk owner** (not the security team -- the business owner of the affected system) approves the exception
4. **Expiration date** set -- exceptions are temporary, not permanent
5. **Periodic review** -- exceptions reviewed monthly until resolved

### Scanning Cadence and Tools

| Tool | Type | Best For | Scan Speed |
|------|------|----------|------------|
| **Qualys VMDR** | Cloud-native, agent-based | Enterprise hybrid environments, continuous monitoring, 100K+ CVE coverage | Continuous |
| **Tenable Nessus** | Network scanner | Internal network audits, on-prem, SMB, 222K+ plugins | Scheduled (weekly/monthly) |
| **Trivy** | Container/IaC scanner | CI/CD pipeline integration, container images, Kubernetes | Per-commit/per-build |
| **Snyk** | Developer-first SCA/SAST | Open source dependency scanning, developer workflow | Per-commit |
| **Grype** | Container scanner | Lightweight alternative to Trivy, SBOM-native | Per-build |

**Recommended cadence:**
- Container images: Every build (CI/CD gate)
- Application dependencies: Daily (automated SCA scan)
- Infrastructure: Weekly (authenticated network scan)
- Cloud configuration: Continuous (CSPM tool)
- Penetration testing: Annually (third-party) plus ad hoc after major changes

**Critical note on Trivy (March 2026):** Aqua Security's Trivy GitHub Action experienced a supply chain compromise on March 19, 2026 -- a multi-phase attack combining credential theft, tag poisoning, and binary tampering. Organizations should verify they are running signed, verified versions of Trivy and should pin to specific commit SHAs rather than mutable tags in CI/CD pipelines.

---

## 7. Patch Management

Patch management is the operational process of identifying, testing, deploying, and verifying software updates across the technology stack. For SOC 2, it supports CC7.1 and CC8.1. For PCI-DSS 4.0, it maps to Requirement 6.3 (security patches installed within one month of release).

### The Patch Tuesday Concept

Microsoft introduced "Patch Tuesday" in October 2003, releasing security updates on the second Tuesday of every month. The origin was practical: Tuesday was chosen to give administrators Monday to handle weekend issues and the rest of the week to test and deploy patches before the weekend. The cadence was a direct response to the chaos of the early 2000s -- the Code Red and Nimda worms of 2001 and the Blaster worm of 2003 exposed the danger of unpredictable patch schedules.

Patch Tuesday became an industry-wide concept. Other vendors adopted similar cadences. The second Tuesday of each month is now a standard planning point for operations teams worldwide. The term "Exploit Wednesday" emerged informally -- attackers reverse-engineer Tuesday's patches to develop exploits targeting organizations that are slow to deploy.

### Patch Cycles and Maintenance Windows

| Patch Type | Cadence | Window | Testing Required |
|------------|---------|--------|-----------------|
| **OS security patches** | Monthly (aligned with Patch Tuesday) | Scheduled maintenance window | Yes -- staging environment |
| **Application patches** | As released, within SLA | Rolling deployment | Yes -- CI/CD pipeline validation |
| **Container base images** | Weekly rebuild | Continuous (immutable infrastructure) | Yes -- automated testing |
| **Emergency patches** | Immediate (zero-day response) | Emergency change process | Abbreviated -- risk vs speed tradeoff |
| **Firmware updates** | Quarterly or as critical | Extended maintenance window | Yes -- hardware vendor testing |

### Emergency Patching (Zero-Days)

Zero-day vulnerabilities require breaking normal patch cycles. The emergency patch process:

1. **Notification:** CISA KEV alert, vendor advisory, or internal discovery
2. **Impact assessment:** Which systems are affected? Are they internet-facing? (2 hours maximum)
3. **Compensating controls:** WAF rules, network blocks, feature disablement (immediate while patch is tested)
4. **Patch testing:** Abbreviated testing in staging -- focus on functionality, not full regression (4--8 hours)
5. **Emergency change approval:** Abbreviated CAB or pre-authorized emergency change (1 hour)
6. **Deployment:** Prioritized by exposure -- internet-facing first, then internal (4--24 hours)
7. **Verification:** Confirm patch applied, compensating controls removed, no regressions (24--48 hours post-deploy)

**Target:** Internet-facing systems patched within 24 hours of vendor patch release for actively exploited zero-days. This is the CISA BOD 22-01 standard.

### Kernel Live Patching

Kernel live patching applies security fixes to a running Linux kernel without rebooting, eliminating downtime for critical kernel vulnerabilities:

| Technology | Provider | Kernel Support | Cost |
|------------|----------|---------------|------|
| **Livepatch** | Canonical (Ubuntu) | Ubuntu kernels | Free for 3 machines, Ubuntu Pro for more |
| **kpatch** | Red Hat | RHEL kernels | Included with RHEL subscription |
| **KernelCare** | TuxCare | Most Linux distributions | $3.95/server/month |
| **AWS Kernel Live Patching** | Amazon | Amazon Linux 2 (kernel 5.10), AL2023 | Included with EC2 |

**How it works:** The live patching system creates a kernel module from the patched code, then uses ftrace (function trace) to redirect calls from the vulnerable function to the patched replacement. No reboot, no service interruption.

**Limitations:**
- Only applicable to security fixes, not feature updates
- Complex kernel changes may not be live-patchable (data structure changes, for example)
- Amazon Linux 2 kernel 4.14 live patching ends October 31, 2025; AL2 kernel 5.10 supported until AL2 end-of-life (June 30, 2026)
- Must still reboot periodically to apply cumulative patches

### Automated Patching Tools

| Tool | Type | Best For |
|------|------|----------|
| **AWS Systems Manager Patch Manager** | Cloud-native | AWS EC2 fleets. Supports patch baselines, maintenance windows, compliance reporting. On-demand patching added in 2026 for immediate scan-and-install without schedule setup |
| **Ansible** | Configuration management | Multi-cloud, on-prem, hybrid. Playbooks for patch testing, deployment, verification, rollback |
| **WSUS / SCCM (MECM)** | Microsoft native | Windows environments. Integrates with Patch Tuesday releases |
| **Puppet / Chef** | Configuration management | Large-scale infrastructure with desired-state enforcement |
| **Renovate / Dependabot** | Dependency automation | Application dependencies. Auto-creates PRs for library updates |

### Patch Testing and Rollback

**Testing tiers:**
1. **Automated:** CI/CD runs full test suite against patched image/configuration
2. **Staging:** Deploy to staging environment, run integration tests, validate core flows
3. **Canary:** Deploy to small production subset (1--5%), monitor for anomalies
4. **Production:** Full rollout with monitoring

**Rollback strategy:**
- Immutable infrastructure: Roll back by deploying the previous image version
- Mutable infrastructure: Maintain pre-patch snapshots/backups; have uninstall procedures documented
- Database patches: Always have a reverse migration ready before applying

---

## 8. GRC Tooling

Governance, Risk, and Compliance (GRC) platforms automate the mechanical work of compliance -- evidence collection, control monitoring, policy management, and audit coordination. The GRC software market was valued at $21 billion in 2025 and is projected to reach $39 billion by 2031.

### Compliance Automation Platforms

These platforms target the SOC 2, ISO 27001, and similar framework market for startups and mid-market companies:

| Platform | Integrations | Framework Coverage | Ideal For | Price Range |
|----------|-------------|-------------------|-----------|-------------|
| **Vanta** | 375+ | SOC 2, ISO 27001, HIPAA, GDPR, PCI-DSS | Fast setup, non-technical operators, common SaaS stacks | $10,000--$30,000/year |
| **Drata** | 100+ (deep) | SOC 2, ISO 27001, HIPAA, GDPR, PCI-DSS, DORA, NIS2, ISO 42001 | Mature engineering teams, complex infrastructure, multi-framework | $15,000--$100,000/year |
| **SecureFrame** | 150+ | SOC 2, ISO 27001, HIPAA, PCI-DSS | Compliance-first UX, guided workflows | $10,000--$25,000/year |
| **Laika** | Moderate | SOC 2, ISO 27001, HIPAA | Small-to-mid-sized, lightweight, flexible | $8,000--$20,000/year |
| **Tugboat Logic** | Moderate | SOC 2, ISO 27001 | Entry-level, acquired by OneTrust | $500--$17,500/year |
| **Sprinto** | 100+ | SOC 2, ISO 27001, HIPAA, GDPR | Cost-effective automation | $8,000--$20,000/year |

**Choosing between Vanta and Drata (the two market leaders):**
- **Vanta** if: speed matters, team is non-technical, using common SaaS stack, need broadest integrations
- **Drata** if: engineering-led, complex/multi-framework needs, want deep customization, need DORA/NIS2/ISO 42001

### Enterprise GRC Platforms

For large enterprises with complex risk management needs beyond audit automation:

| Platform | Market Position | Best For |
|----------|----------------|----------|
| **ServiceNow GRC** | Dominant in ITSM-integrated GRC | Organizations already on ServiceNow |
| **SAP GRC** | ERP-integrated | SAP environments |
| **IBM OpenPages** | AI-enhanced risk analytics | Large financial services |
| **RSA Archer** | Highly configurable | Complex regulatory environments |
| **MetricStream** | Broad GRC coverage | Multi-industry enterprises |

### Policy-as-Code

Policy-as-code encodes compliance rules in machine-readable formats, enabling automated enforcement:

**OPA/Rego (Open Policy Agent):**
- CNCF-graduated project; the standard for policy-as-code in cloud-native environments
- Rego is a declarative query language purpose-built for policy evaluation
- Use cases: Kubernetes admission control (via Gatekeeper), Terraform plan validation, API authorization, CI/CD pipeline gates
- Strength: Sophisticated logic for complex compliance rules, works across the full stack

```rego
# Example: Deny containers running as root
deny[msg] {
    input.kind == "Pod"
    container := input.spec.containers[_]
    not container.securityContext.runAsNonRoot
    msg := sprintf("Container '%s' must not run as root", [container.name])
}
```

**HashiCorp Sentinel:**
- Embedded in Terraform Cloud/Enterprise, Vault, Consul, Nomad
- Policy-as-code for infrastructure provisioning
- Use case: Enforce tagging standards, restrict instance types, require encryption

**Kyverno:**
- Kubernetes-native policy engine using YAML (no new language to learn)
- Lower learning curve than OPA/Rego for teams already fluent in Kubernetes manifests
- Includes mutation capability for automatic remediation

### Compliance-as-Code

Compliance-as-code validates that running systems conform to compliance baselines:

**Chef InSpec:**
```ruby
# Example: Verify SSH configuration
control 'ssh-config' do
  impact 1.0
  title 'SSH must use protocol 2'
  describe sshd_config do
    its('Protocol') { should eq '2' }
  end
end
```

**AWS Config Rules:** Continuously evaluates AWS resource configurations against desired settings. Native rules cover common compliance checks (encryption enabled, public access blocked, MFA enforced).

**Azure Policy:** Native to Azure; enforces organizational standards for Azure resources with deny, audit, and remediate effects.

### Automated Control Monitoring

The goal is continuous compliance posture awareness:

| What to Monitor | Tool/Method | Alert Threshold |
|----------------|-------------|-----------------|
| MFA enforcement | IdP integration (Okta, Azure AD) | Any user without MFA |
| Encryption at rest | Cloud provider API (AWS Config, Azure Policy) | Any unencrypted resource |
| Access reviews | GRC platform | Overdue by 7+ days |
| Vulnerability SLA | Scanner integration | Any breach of remediation timeline |
| Endpoint protection | EDR console (CrowdStrike, SentinelOne) | Any unprotected endpoint |
| Training completion | LMS integration | Any employee overdue by 30+ days |

---

## 9. Compliance Frameworks Comparison

No single framework covers every requirement. Organizations typically comply with multiple frameworks simultaneously, leveraging the 40--85% control overlap between them.

### Framework Overview

| Framework | Governing Body | Scope | Geographic Focus | Mandatory? | Result |
|-----------|---------------|-------|-----------------|------------|--------|
| **SOC 2** | AICPA | Service organization data handling | United States | Contractual (customer-driven) | Attestation report |
| **ISO 27001** | ISO/IEC | Information security management system | Global (strong in EU/Asia) | Voluntary (often contractual) | Certification (3-year validity) |
| **PCI-DSS 4.0** | PCI SSC | Cardholder data protection | Global | Mandatory for card processing | Compliance report/SAQ |
| **HIPAA** | HHS (US) | Protected health information (PHI) | United States | Mandatory for covered entities | No certification -- audit by OCR |
| **GDPR** | European Commission | Personal data of EU residents | EU + any org handling EU data | Mandatory | No certification -- DPA enforcement |

### Which Applies When

| Scenario | Required Frameworks |
|----------|-------------------|
| US SaaS company selling to enterprises | SOC 2 (minimum) |
| US SaaS selling to EU enterprises | SOC 2 + GDPR |
| Global SaaS selling everywhere | SOC 2 + ISO 27001 + GDPR |
| SaaS processing credit cards | SOC 2 + PCI-DSS |
| Healthcare SaaS in the US | SOC 2 + HIPAA |
| Healthcare SaaS processing cards globally | SOC 2 + HIPAA + PCI-DSS + ISO 27001 + GDPR |
| US government contractor | FedRAMP (+ SOC 2 often required additionally) |

### Detailed Comparison

| Dimension | SOC 2 | ISO 27001 | PCI-DSS 4.0 | HIPAA | GDPR |
|-----------|-------|-----------|-------------|-------|------|
| **Cost** | $30K--$150K/year | $20K--$80K (initial), $10K--$30K/year (surveillance) | $20K--$500K+ (depends on SAQ vs ROC) | Internal compliance cost; penalties up to $1.5M/year | DPO + compliance cost; fines up to 4% global revenue |
| **Audit cycle** | Annual (Type II) | 3-year cert + annual surveillance | Annual | HHS OCR audits (random) | DPA investigations (complaint-driven) |
| **Prescriptiveness** | Principles-based (you define controls) | Management system framework (you define scope) | Highly prescriptive (specific technical controls) | Moderate (Administrative, Physical, Technical safeguards) | Principles-based (demonstrate accountability) |
| **Certification vs Report** | Auditor attestation report | Formal certification displayed publicly | Compliance validation (SAQ or ROC) | No formal certification | No formal certification |
| **Time to achieve** | 3--12 months | 6--18 months | 3--12 months (depends on level) | Ongoing (no "achieved" state) | Ongoing (no "achieved" state) |
| **Key technical controls** | Access control, change management, monitoring, encryption | Annex A controls (93 controls in ISO 27001:2022) | 12 requirements, 300+ sub-requirements | Access controls, audit controls, integrity controls, transmission security | Data minimization, encryption, pseudonymization, DPIA |

### The "Compliance Does Not Equal Security" Principle

This is the most important concept in compliance operations. An organization can be compliant with every framework listed above and still suffer a catastrophic breach. Conversely, an organization with excellent security practices may fail an audit on documentation alone.

**Why compliance is not security:**
- Compliance is a point-in-time or periodic assessment; attacks happen continuously
- Compliance checks what you documented; security requires what you actually do
- Compliance frameworks lag behind attacker techniques by 2--5 years
- Compliance creates a minimum bar; security requires exceeding it
- Compliance focuses on controls that can be audited; many critical security practices are difficult to audit

**The practical relationship:**
```
Compliance without security = audit theater
Security without compliance = unprovable posture
Compliance AND security = the goal
```

The operational discipline is to use compliance as a forcing function for security hygiene while never confusing the checkbox with the outcome. Every control should exist because it improves security posture, not because an auditor will check for it. The audit evidence should be a byproduct of good operations, not the purpose of them.

### Control Overlap

Organizations pursuing multiple frameworks can leverage significant overlap:

| Control Area | SOC 2 | ISO 27001 | PCI-DSS | HIPAA | GDPR |
|-------------|-------|-----------|---------|-------|------|
| Access control | CC6.x | A.5.15-A.5.18 | Req 7-8 | 164.312(a) | Art. 32 |
| Encryption | CC6.1 | A.8.24 | Req 3-4 | 164.312(a)(2)(iv) | Art. 32 |
| Logging/monitoring | CC7.x | A.8.15-A.8.16 | Req 10 | 164.312(b) | Art. 30 |
| Change management | CC8.x | A.8.32 | Req 6.5 | 164.312(e) | Art. 25 |
| Incident response | CC7.3-CC7.5 | A.5.24-A.5.28 | Req 12.10 | 164.308(a)(6) | Art. 33-34 |
| Vendor management | CC9.x | A.5.19-A.5.23 | Req 12.8 | 164.308(b)(1) | Art. 28 |
| Risk assessment | CC3.x | Clause 6.1 | Req 12.2 | 164.308(a)(1)(ii)(A) | Art. 35 |

A well-designed control framework maps each control to every applicable requirement across all frameworks. Implement once, evidence once, satisfy many.

---

## 10. Numbers

| Metric | Value | Source |
|--------|-------|--------|
| SOC 2 Type II total cost (mid-market, first year) | $30,000--$150,000 | Multiple auditor sources, 2025 |
| Internal labor for SOC 2 preparation | 100--500+ hours | Industry surveys, 2025 |
| GRC software market value (2025) | $21.04 billion | Mordor Intelligence |
| GRC software market projected (2031) | $39.01 billion | Mordor Intelligence |
| GRC platforms market (2025) | $51.43 billion | Mordor Intelligence |
| CVSS Critical threshold | 9.0--10.0 | FIRST.org |
| PCI-DSS log retention minimum | 12 months (3 months hot) | PCI-DSS 4.0 Req 10.7 |
| HIPAA log retention minimum | 6 years | 45 CFR 164.312(b) |
| SOX records retention | 7 years | SOX Section 802 |
| Vanta integrations | 375+ | Vanta, 2025 |
| Qualys VMDR CVE coverage | 100,000+ CVEs, 190,000+ detections | Qualys, 2025 |
| Nessus plugin count | 222,000+ covering 91,000+ CVEs | Tenable, 2025 |
| ISO 27001:2022 Annex A controls | 93 controls in 4 themes | ISO/IEC |
| SOC 2 Common Criteria count | 33 criteria in 9 categories | AICPA |
| Control overlap between frameworks | 40--85% | Multiple sources |
| Patch Tuesday origin | October 2003 | Microsoft |
| GitHub audit log retention | 90 days (native) | GitHub documentation |
| SOC 2 Type II observation period | 3--12 months (typically 6) | AICPA |

---

## 11. Study Topics

### Foundation
- AICPA Trust Services Criteria (2017 criteria + 2022 revised points of focus)
- NIST Cybersecurity Framework (CSF) 2.0
- NIST SP 800-53 Rev. 5 (Security and Privacy Controls)
- PCI-DSS 4.0 standard (released March 2022, mandatory March 2025)

### Operational
- CVSS v4.0 specification (FIRST.org)
- CISA Known Exploited Vulnerabilities (KEV) catalog and BOD 22-01
- EPSS (Exploit Prediction Scoring System) model documentation
- AWS Well-Architected Framework -- Security Pillar
- Google BeyondCorp (zero-trust reference architecture)

### Tooling
- OPA/Rego documentation and Kubernetes Gatekeeper
- Chef InSpec profiles (CIS benchmarks, STIG profiles)
- Trivy security scanning (with supply chain verification)
- AWS Systems Manager Patch Manager baseline configuration

### Advanced
- GDPR Data Protection Impact Assessments (DPIA)
- ISO 42001 (AI Management System) -- emerging standard for AI governance
- DORA (Digital Operational Resilience Act) -- EU financial sector
- NIS2 Directive -- EU network and information security

---

## 12. Cross-Cluster Connections

| Cluster | Project | Connection |
|---------|---------|------------|
| **Infrastructure** | SYA -- Systems Administration | Access management fundamentals, RBAC implementation, logging infrastructure |
| **Infrastructure** | DRP -- Disaster Recovery | Business continuity testing as SOC 2 evidence, DR plan documentation |
| **Infrastructure** | RCA -- Root Cause Analysis | Post-incident review as compliance evidence, incident response documentation |
| **Infrastructure** | SOO-02 -- Incident Management | Incident response procedures mapped to SOC 2 CC7.3-CC7.5 |
| **Infrastructure** | SOO-03 -- Change Management | Change control procedures mapped to SOC 2 CC8.1 |
| **Infrastructure** | SOO-05 -- FinOps | Log storage costs, GRC platform costs, compliance budget planning |
| **Infrastructure** | SOO-10 -- On-Call Culture | On-call as evidence of operational monitoring for availability criteria |
| **Infrastructure** | K8S -- Kubernetes | OPA/Gatekeeper admission control, container image scanning, RBAC |
| **AI & Computation** | AGT -- Agentic Technologies | AI governance controls, prompt injection as compliance concern |
| **Business** | WSB -- Business Fundamentals | IP strategy, vendor management, contract compliance |

---

## 13. Sources

### Regulatory and Standards Bodies
- AICPA Trust Services Criteria: https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc-2
- NIST SP 800-53 Rev. 5: https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final
- PCI SSC PCI-DSS 4.0: https://www.pcisecuritystandards.org/
- HHS HIPAA Security Rule: 45 CFR Part 164
- GDPR Full Text: https://gdpr.eu/
- FIRST.org CVSS v4.0: https://www.first.org/cvss/v4.0/specification-document

### Vendor Documentation
- Vanta: https://www.vanta.com/
- Drata: https://drata.com/
- SecureFrame: https://secureframe.com/
- OPA: https://www.openpolicyagent.org/
- Trivy: https://trivy.dev/
- Qualys VMDR: https://www.qualys.com/apps/vulnerability-management-detection-response/
- Tenable Nessus: https://www.tenable.com/products/nessus
- AWS Systems Manager Patch Manager: https://docs.aws.amazon.com/systems-manager/latest/userguide/patch-manager.html

### Industry Analysis
- Mordor Intelligence GRC Market Report (2025): https://www.mordorintelligence.com/industry-reports/governance-risk-and-compliance-software-market
- EY AICPA Guidance Update: https://www.ey.com/en_us/technical/accountinglink/to-the-point-aicpa-revises-guidance-on-applying-its-trust-services-criteria-and-soc-2-description-criteria
- Konfirmity SOC 2 2026 Changes: https://www.konfirmity.com/blog/soc-2-what-changed-in-2026
- CrowdStrike Trivy Supply Chain Analysis: https://www.crowdstrike.com/en-us/blog/from-scanner-to-stealer-inside-the-trivy-action-supply-chain-compromise/
- Sprinto SOC 2 2025 Updates: https://sprinto.com/blog/soc-2-updates/
