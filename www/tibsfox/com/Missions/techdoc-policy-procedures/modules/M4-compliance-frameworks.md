# M4: Compliance and Regulatory Frameworks

**Module:** M4  
**Title:** Compliance and Regulatory Frameworks  
**Type:** Policy / Standard  
**Owner:** Information Security Compliance Lead  
**Lifecycle State:** Published  
**Review Cadence:** Annual (or upon framework revision)  
**Audience:** Compliance Auditors, Security Engineers, Documentation Owners, Senior Engineers, Operations Staff  
**Framework Refs:** NIST CSF 2.0, NIST SP 800-53 R5, NIST SP 800-171, CMMC, ISO/IEC 27001:2022, NIST SP 800-100, FISMA  
**Version:** 1.0  
**Last Reviewed:** 2026-04-05  
**Next Review:** 2027-04-05  

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Scope](#2-scope)
3. [Framework Landscape](#3-framework-landscape)
4. [MCR vs DSR: Mandatory vs Desired Requirements](#4-mcr-vs-dsr-mandatory-vs-desired-requirements)
5. [NIST 800-53 Control Family Documentation Cross-Reference](#5-nist-800-53-control-family-documentation-cross-reference)
6. [Required Documentation Artifacts by Framework](#6-required-documentation-artifacts-by-framework)
7. [System Security Plan (SSP) Structure Template](#7-system-security-plan-ssp-structure-template)
8. [Plan of Action and Milestones (POA&M) Structure Template](#8-plan-of-action-and-milestones-poam-structure-template)
9. [Documentation Program Compliance Posture](#9-documentation-program-compliance-posture)
10. [Roles and Responsibilities](#10-roles-and-responsibilities)
11. [Related Documents](#11-related-documents)
12. [Revision History](#12-revision-history)

---

## 1. Purpose

This module defines the organization's compliance and regulatory framework landscape as it applies to documentation requirements. It provides a comprehensive cross-reference of information security control families to required documentation artifacts, establishes the distinction between mandatory compliance requirements and desired security requirements, and supplies template structures for System Security Plans and Plans of Action and Milestones.

This module is the authoritative reference for compliance personnel, documentation owners, and auditors who need to understand what documentation is required, which framework mandates it, and what form it must take.

---

## 2. Scope

This module covers:

- Framework landscape: NIST CSF 2.0, NIST SP 800-53 R5, NIST SP 800-171/CMMC, ISO 27001/27002, NIST SP 800-100, FISMA
- All 20 NIST 800-53 control families mapped to required documentation artifacts
- Documentation artifact requirements per framework at each impact level
- SSP and POA&M structure templates
- Mandatory compliance requirement (MCR) vs desired security requirement (DSR) classification

This module does not cover:

- Implementation guidance for specific security controls
- Risk assessment methodology (see separate Risk Assessment Program documentation)
- Incident response procedures (see separate Incident Response Plan)
- Technical controls implementation (see system-specific security documentation)

---

## 3. Framework Landscape

### 3.1 Overview

The information security compliance landscape presents organizations with multiple overlapping frameworks. Each framework has a distinct purpose, authority, and applicability. Organizations are frequently subject to multiple frameworks simultaneously, with documentation requirements that are complementary but not identical.

The table below provides a structured comparison of the six primary frameworks applicable to U.S. federal agencies, federal contractors, and organizations seeking to adopt information security best practices.

### 3.2 Framework Comparison Table

| Framework | Full Name | Owner | Authority | Scope | Best For | Mandatory? |
|-----------|-----------|-------|-----------|-------|----------|-----------|
| **NIST CSF 2.0** | Cybersecurity Framework Version 2.0 | NIST | Executive Order 13636; NIST IR 8374 | All organizations | Starting point for any organization; voluntary baseline | Voluntary (mandatory for some federal programs) |
| **NIST SP 800-53 R5** | Security and Privacy Controls for Information Systems and Organizations | NIST | OMB Circular A-130; FISMA | Federal information systems | U.S. federal agencies and their contractors; comprehensive control catalog | Mandatory for federal agencies under FISMA |
| **NIST SP 800-171 R2** | Protecting Controlled Unclassified Information in Nonfederal Systems | NIST | DFARS 252.204-7012 | Nonfederal systems handling CUI | Defense contractors; organizations handling CUI for the federal government | Mandatory for DoD contractors via DFARS |
| **CMMC** | Cybersecurity Maturity Model Certification | DoD | DFARS 252.204-7021; 32 CFR Part 170 | Defense Industrial Base contractors | Organizations bidding on DoD contracts requiring CUI handling | Mandatory for DoD contracts at applicable CMMC level |
| **ISO 27001/27002** | Information Security Management Systems | ISO/IEC | Contractual; regulatory (EU, UK, others) | Any organization globally | International organizations; organizations seeking certification; supply chain assurance | Voluntary (mandatory for some sectors/regions) |
| **NIST SP 800-100** | Information Security Handbook: A Guide for Managers | NIST | Guidance only | Federal agency IT managers | Understanding security program management principles; senior leadership briefings | Informational (not directly mandating controls) |
| **FISMA** | Federal Information Security Modernization Act | Congress / OMB / CISA | 44 U.S.C. § 3551 et seq. | Federal agencies and contractors | Federal information system authorization (ATO); ongoing authorization | Mandatory for federal agencies |

### 3.3 Framework Detail

#### NIST Cybersecurity Framework 2.0

The NIST Cybersecurity Framework 2.0 (CSF 2.0), released in February 2024, is the revision of the original 2014 framework. CSF 2.0 expands the original five functions (Identify, Protect, Detect, Respond, Recover) to six by adding Govern. The Govern function addresses cybersecurity risk management strategy, roles, responsibilities, and organizational context — areas previously embedded across the other five functions. [nist-csf-2]

CSF 2.0 is explicitly designed as a starting point for organizations of any size and sector. It is not a compliance checklist but a framework for organizing, assessing, and improving cybersecurity posture. CSF 2.0 maps to NIST 800-53 R5, ISO 27001:2022, and CMMC, enabling organizations to use CSF as a common language across different compliance regimes.

For documentation purposes, CSF 2.0 does not mandate specific documentation artifacts but implies documentation requirements through the Govern and Identify functions: organizations must document their cybersecurity strategy, risk tolerance, and control implementation to demonstrate function implementation.

#### NIST SP 800-53 Revision 5

NIST SP 800-53 R5 is the most comprehensive and widely adopted information security control catalog in the United States. It defines 20 control families containing over 1,000 individual controls and control enhancements, organized by impact level: Low, Moderate, and High. [nist-800-53]

800-53 R5 introduced privacy controls as a native element of the framework (rather than a separate publication), added the Supply Chain Risk Management (SR) family, and reorganized controls for alignment with privacy principles.

For documentation programs, 800-53 R5 is the primary source of documentation artifact requirements. Section 5 of this module provides the complete cross-reference of all 20 control families to their documentation artifacts.

#### NIST SP 800-171 R2 and CMMC

NIST SP 800-171 R2 defines 110 security requirements in 14 families for protecting Controlled Unclassified Information (CUI) in nonfederal information systems. [nist-800-171] It is a subset of NIST 800-53 R5 controls selected for applicability to nonfederal systems.

CMMC (Cybersecurity Maturity Model Certification) builds on 800-171 by adding maturity levels. CMMC Level 1 (Foundational) covers 17 practices. CMMC Level 2 (Advanced) aligns with the 110 requirements of 800-171 R2. CMMC Level 3 (Expert) adds 24 additional practices from NIST 800-172.

The critical documentation distinction for CMMC is the System Security Plan (SSP): organizations must maintain an SSP documenting the implementation of all 110 requirements before a CMMC Level 2 assessment. The SSP is not optional — its absence is a finding in a CMMC assessment.

#### ISO/IEC 27001:2022 and 27002:2022

ISO/IEC 27001:2022 specifies requirements for establishing, implementing, maintaining, and continuously improving an Information Security Management System (ISMS). It is a certifiable standard — organizations can undergo third-party audit to receive ISO 27001 certification. [iso-27001]

ISO 27001:2022 introduced significant structural changes from the 2013 version, reorganizing Annex A controls from 114 controls in 14 domains to 93 controls in 4 themes (Organizational, People, Physical, Technological) and adding 11 new controls.

ISO/IEC 27002:2022 provides implementation guidance for the 93 controls referenced in ISO 27001 Annex A. [iso-27002] While 27001 specifies requirements (the "what"), 27002 provides guidance on how to implement them (the "how").

For documentation programs, ISO 27001 requires documented information (formal policies and procedures) for 34 specific areas identified in the standard's requirements clauses (Clauses 4–10) and Annex A controls. Certification requires demonstrating to an accredited auditor that documented information exists, is current, and is followed.

#### NIST SP 800-100

NIST SP 800-100 is an information security handbook for managers, providing guidance on integrating security into IT management. [nist-800-100] It addresses governance, risk management, planning, and security program management. While not a control catalog, it provides context for understanding documentation program requirements and is frequently cited in security program frameworks.

800-100 is informational rather than prescriptive — it does not mandate specific controls but describes the characteristics of an effective security program, including the role of documentation.

#### FISMA

The Federal Information Security Modernization Act (FISMA) of 2014 requires each federal agency to develop, document, and implement an agency-wide information security program. FISMA's documentation requirements are fulfilled through the NIST Risk Management Framework (RMF), which requires agencies to categorize systems (using FIPS 199), select controls (from NIST 800-53), document implementation in a System Security Plan, and obtain an Authorization to Operate (ATO).

FISMA documentation requirements are enforced through annual OMB reporting and CISA oversight. Agencies without current ATOs for covered systems are in violation of FISMA.

---

## 4. MCR vs DSR: Mandatory vs Desired Requirements

### 4.1 Definitions

**Mandatory Compliance Requirement (MCR):** A control, documentation artifact, or practice that is required by applicable law, regulation, contractual obligation, or certification requirement. Non-compliance with an MCR results in legal, regulatory, or contractual consequences: loss of certification, contract termination, regulatory action, or civil/criminal liability. MCRs are non-negotiable.

**Desired Security Requirement (DSR):** A control, practice, or documentation artifact that is recommended by authoritative guidance, industry best practice, or organizational security policy, but whose absence does not directly trigger legal, regulatory, or contractual consequences. DSRs represent the security posture the organization should target above and beyond mandatory minimums.

The Secure Controls Framework distinguishes between these categories to help organizations prioritize limited security resources: MCRs must be satisfied first; DSRs represent the path to a more mature security posture. [scf]

### 4.2 MCR vs DSR in Practice

The distinction matters for documentation prioritization. A federal contractor handling CUI must have an SSP documenting 110 NIST 800-171 requirements (MCR). The same contractor may choose to document an AI governance policy aligned with NIST AI RMF (DSR) — valuable but not contractually required.

The table below illustrates the MCR/DSR distinction for common documentation artifacts:

| Documentation Artifact | MCR Source | DSR Source | Classification |
|-----------------------|------------|------------|----------------|
| Information Security Policy | NIST 800-53 PL-1; ISO 27001 Clause 5.2 | — | MCR (federal systems, ISO-certified orgs) |
| System Security Plan (SSP) | NIST 800-53 PL-2; FISMA; CMMC | — | MCR (federal systems, DoD contractors) |
| Plan of Action and Milestones | NIST 800-53 CA-5; FISMA | — | MCR (federal systems) |
| Access Control Policy | NIST 800-53 AC-1 | ISO 27002 5.15 | MCR (federal); DSR (private sector) |
| Business Continuity Plan | ISO 27001 A.5.29 | NIST 800-53 CP-2 | MCR (ISO-certified); DSR (others) |
| AI Governance Policy | — | NIST AI RMF; ISO 42001 | DSR |
| Software Bill of Materials | EO 14028 (federal contractors) | CISA guidance | MCR (federal contractors); DSR (others) |
| Vendor Security Assessment | NIST 800-53 SR-3 (federal) | ISO 27002 5.19 | MCR (federal); DSR (others) |
| Incident Response Plan | NIST 800-53 IR-8; ISO 27001 A.5.26 | — | MCR (federal, ISO-certified) |
| Privacy Notice | GDPR Article 13-14 (EU) | ISO 27701 | MCR (EU data subjects); DSR (US-only) |

### 4.3 Applying the MCR/DSR Framework to Documentation Programs

When building or auditing a documentation program, the following process determines MCR applicability:

1. **Identify applicable frameworks.** Which laws, regulations, contracts, and certifications apply to the organization? A SaaS company with no federal contracts and no EU customers has different MCRs than a defense contractor.

2. **Map MCRs to documentation artifacts.** For each applicable framework, use the cross-reference in Section 5 to identify required documentation artifacts.

3. **Assess current documentation inventory.** Which required documentation artifacts exist? Which are current (within review cadence)? Which are missing or expired?

4. **Prioritize MCR gaps.** Address missing or expired MCR artifacts first, in order of regulatory consequence severity.

5. **Layer DSR enhancements.** After MCR gaps are closed, apply DSRs to strengthen the documentation program beyond mandatory minimums.

---

## 5. NIST 800-53 Control Family Documentation Cross-Reference

### 5.1 Overview

NIST SP 800-53 R5 organizes controls into 20 families. Each family requires specific documentation artifacts at each impact level. The following cross-reference maps each family to its required policy, procedure, and supporting documentation artifacts.

Impact level designations:
- **L** = Required at Low impact level
- **M** = Required at Moderate impact level  
- **H** = Required at High impact level
- **(L)** = Low: Moderate and High inherit all Low requirements

### 5.2 Full Cross-Reference Table

The table below maps all 20 control families to their required documentation artifacts. Families are ordered alphabetically by abbreviation as they appear in NIST 800-53 R5. [nist-800-53]

| Family | Abbr | Required Policy Document | Required Procedure Document | Supporting Documentation | Impact Level |
|--------|------|--------------------------|----------------------------|--------------------------|--------------|
| Access Control | AC | Access Control Policy | Account Management Procedures; Access Enforcement Procedures; Remote Access Procedures | Access rights inventory; Account audit logs; Privileged user list | L, M, H |
| Audit and Accountability | AU | Audit and Accountability Policy | Audit Log Review Procedures; Audit Record Retention Procedures | Audit log retention schedule; Log management architecture | L, M, H |
| Awareness and Training | AT | Security Awareness and Training Policy | Security Awareness Training Procedures; Role-Based Training Procedures | Training completion records; Training content catalog | L, M, H |
| Configuration Management | CM | Configuration Management Policy | Baseline Configuration Procedures; Change Control Procedures; Configuration Settings Management Procedures | Configuration baselines; Change control records; Software inventory | L, M, H |
| Contingency Planning | CP | Contingency Planning Policy | Contingency Plan; Business Continuity Procedures; Backup and Recovery Procedures; System Recovery Procedures | Contingency plan test results; Alternate site agreements; Recovery time objectives | L (CP); M (full); H (full + alternate site) |
| Identification and Authentication | IA | Identification and Authentication Policy | Authenticator Management Procedures; Multi-Factor Authentication Procedures | Authenticator types and strengths; MFA exception records | L, M, H |
| Incident Response | IR | Incident Response Policy | Incident Response Plan; Incident Handling Procedures; Incident Reporting Procedures; Incident Response Testing Procedures | Incident response contact list; Incident logs; Lessons learned reports | L (policy + plan); M (+ testing); H (+ automated capabilities) |
| Maintenance | MA | System Maintenance Policy | Controlled Maintenance Procedures; Remote Maintenance Procedures; Maintenance Tool Procedures | Maintenance records; Sanitization procedures | L, M (+ remote MA); H |
| Media Protection | MP | Media Protection Policy | Media Access Control Procedures; Media Sanitization Procedures; Media Transport Procedures | Media inventory; Sanitization records; Chain of custody logs | L (MP-1,2,6); M (+ transport); H (full) |
| Physical and Environmental Protection | PE | Physical and Environmental Protection Policy | Physical Access Control Procedures; Visitor Control Procedures; Power Equipment Procedures | Physical access logs; Visitor logs; Emergency power documentation | L (PE-1,2,3,6,8); M (expanded); H (full) |
| Planning | PL | Security Planning Policy | System Security Plan; Rules of Behavior | System Security Plan (SSP); Privacy Impact Assessment (PIA); Security concept of operations | L, M, H |
| Program Management | PM | Information Security Program Plan | Program Management Procedures | Security program metrics; Reporting calendar; Authorizing official designations | Applies at organizational level; not system-specific impact levels |
| Personnel Security | PS | Personnel Security Policy | Position Risk Designation Procedures; Personnel Screening Procedures; Personnel Termination Procedures; Personnel Transfer Procedures | Position risk designations; Screening records; Termination checklists | L, M, H |
| Risk Assessment | RA | Risk Assessment Policy | Risk Assessment Procedures; Vulnerability Scanning Procedures; Privacy Impact Assessment Procedures | Risk assessment reports; Vulnerability scan results; Privacy threshold analyses | L (RA-1,2,3); M (+ scanning); H (full) |
| System and Services Acquisition | SA | System and Services Acquisition Policy | Acquisition Strategy Procedures; Developer Security Architecture Procedures; Software Usage Restrictions Procedures | System development life cycle documentation; Acquisition contracts; Developer security requirements | L, M, H |
| System and Communications Protection | SC | System and Communications Protection Policy | Network Segmentation Procedures; Transmission Confidentiality Procedures; Cryptographic Key Management Procedures | Network architecture diagrams; Cryptographic standards; Data flow diagrams | L (SC-1,5,7,12,13,20,21,22,39); M (expanded); H (full) |
| System and Information Integrity | SI | System and Information Integrity Policy | Flaw Remediation Procedures; Malicious Code Protection Procedures; Security Alert Procedures; Software and Firmware Integrity Procedures | Patch management records; Anti-malware configuration; Integrity verification logs | L (SI-1,2,3,5); M (+ SI-4,7); H (full) |
| Supply Chain Risk Management | SR | Supply Chain Risk Management Policy | Supply Chain Risk Assessment Procedures; Provenance Procedures; Component Authenticity Procedures | Supply chain risk assessments; Approved supplier list; Component disposition records | L (SR-1); M (SR-2,3,5,8); H (full) |
| PII Processing and Transparency | PT | Privacy Policy | PII Processing Conditions Procedures; Individual Participation Procedures; Privacy Notice Procedures | PII inventory; Privacy threshold analyses; Consent records | Applies when PII is processed; aligns with FISMA privacy overlay |
| Assessment, Authorization, and Monitoring | CA | Security Assessment and Authorization Policy | Security Assessment Procedures; Continuous Monitoring Procedures; System Interconnection Procedures; Plan of Action and Milestones Procedures | Authorization package; POA&M; Security assessment report; Interconnection Security Agreements (ISA) | L, M, H |

### 5.3 CSV-Compatible Full Cross-Reference

The following section provides the cross-reference data in a pipe-delimited format suitable for import into spreadsheets, compliance tracking tools, and GRC platforms.

```
Family|Abbreviation|Policy Document|Procedure Document(s)|Supporting Artifacts|Low|Moderate|High
Access Control|AC|Access Control Policy|Account Management Procedures; Access Enforcement Procedures; Remote Access Procedures; Separation of Duties Procedures|Access rights inventory; Privileged user list; Account review records|Required|Required|Required
Audit and Accountability|AU|Audit and Accountability Policy|Audit Log Review Procedures; Audit Reduction and Report Generation Procedures; Audit Record Retention Procedures|Audit log architecture; Retention schedule; Review frequency|Required|Required|Required
Awareness and Training|AT|Security Awareness and Training Policy|Security Awareness Training Procedures; Role-Based Training Procedures; Insider Threat Awareness Procedures|Training calendar; Completion records; Training effectiveness metrics|Required|Required|Required
Configuration Management|CM|Configuration Management Policy|Baseline Configuration Procedures; Change Control Procedures; Security Impact Analysis Procedures; Configuration Settings Management Procedures|Configuration baseline documents; Change control records; Software/firmware inventory; Unauthorized software policy|Required|Required|Required
Contingency Planning|CP|Contingency Planning Policy|Contingency Plan (BCP/DRP); Backup Procedures; System Recovery Procedures; Contingency Plan Test Procedures|Contingency plan; Test results; Alternate site agreements; Recovery time/point objectives|Required (basic)|Required (full)|Required (+ alternate site)
Identification and Authentication|IA|Identification and Authentication Policy|User Identification and Authentication Procedures; Authenticator Management Procedures; Multi-Factor Authentication Procedures; Non-Organizational User Procedures|Authenticator strength documentation; MFA exceptions register; Device certificate inventory|Required|Required|Required
Incident Response|IR|Incident Response Policy|Incident Response Plan; Incident Handling Procedures; Incident Reporting Procedures; Incident Response Testing Procedures; Incident Response Assistance Procedures|Contact list; Incident log; Lessons learned reports; External reporting obligations|Required (policy + plan)|Required (+ testing)|Required (+ automation)
Maintenance|MA|System Maintenance Policy|Controlled Maintenance Procedures; Maintenance Tools Procedures; Remote Maintenance Procedures; Maintenance Personnel Procedures|Maintenance records; Sanitization documentation; Remote access session logs|Required|Required (+ remote)|Required
Media Protection|MP|Media Protection Policy|Media Access Control Procedures; Media Marking Procedures; Media Storage Procedures; Media Transport Procedures; Media Sanitization Procedures; Media Use Procedures|Media inventory; Sanitization records; Transport chain of custody|Required (basic)|Required (+ transport)|Required (full)
Physical and Environmental Protection|PE|Physical and Environmental Protection Policy|Physical Access Control Procedures; Physical Access Log Review Procedures; Visitor Control Procedures; Emergency Procedures; Power Equipment Procedures|Physical access logs; Visitor logs; Emergency power records; Environmental monitoring logs|Required (basic)|Required (expanded)|Required (full)
Planning|PL|Security Planning Policy|System Security Plan Procedures; Rules of Behavior Procedures; Privacy Impact Assessment Procedures|System Security Plan (SSP); Rules of Behavior; Security CONOPS; Privacy Impact Assessment|Required|Required|Required
Program Management|PM|Information Security Program Plan|Program Management Procedures; Risk Management Procedures; Insider Threat Program Procedures|Program metrics; Authorizing official designations; Security portfolio|Organizational|Organizational|Organizational
Personnel Security|PS|Personnel Security Policy|Position Risk Designation Procedures; Personnel Screening Procedures; Termination Procedures; Transfer Procedures; Access Agreements Procedures|Risk designation records; Screening results; Termination checklists; Access agreements|Required|Required|Required
Risk Assessment|RA|Risk Assessment Policy|Risk Assessment Procedures; Vulnerability Scanning Procedures; Vulnerability Monitoring Procedures; Privacy Impact Assessment Procedures|Risk assessment reports; Vulnerability scan results; Risk register; Privacy threshold analyses|Required (basic)|Required (+ scanning)|Required (full)
System and Services Acquisition|SA|System and Services Acquisition Policy|Acquisition Strategy Procedures; Developer Security Architecture Procedures; Software Usage Restrictions Procedures; Supply Chain Protection Procedures|SDLC documentation; Acquisition contracts with security requirements; Developer testing requirements|Required|Required|Required
System and Communications Protection|SC|System and Communications Protection Policy|Network Segmentation Procedures; Denial of Service Protection Procedures; Boundary Protection Procedures; Cryptographic Key Management Procedures; Transmission Confidentiality Procedures|Network architecture diagrams; Cryptographic standards; Data flow diagrams; Boundary protection documentation|Required (basic)|Required (expanded)|Required (full)
System and Information Integrity|SI|System and Information Integrity Policy|Flaw Remediation Procedures; Malicious Code Protection Procedures; Security Alert Monitoring Procedures; Software Integrity Verification Procedures; Spam Protection Procedures|Patch records; Anti-malware configuration; Alert handling logs; Integrity baselines|Required (basic)|Required (+ monitoring)|Required (full)
Supply Chain Risk Management|SR|Supply Chain Risk Management Policy|Supply Chain Risk Assessment Procedures; Provenance Procedures; Component Authenticity Procedures; Component Acquisition Procedures|Supply chain risk assessments; Approved supplier list; Component provenance records; Disposition records|Required (SR-1)|Required (SR-1,2,3,5,8)|Required (full)
PII Processing and Transparency|PT|Privacy Policy|PII Processing Conditions Procedures; Individual Participation Procedures; Privacy Notice Procedures; Consent Procedures|PII inventory; Privacy threshold analyses; Consent management records; Data subject request log|Required when PII processed|Required when PII processed|Required when PII processed
Assessment Authorization and Monitoring|CA|Security Assessment and Authorization Policy|Security Assessment Procedures; Continuous Monitoring Procedures; System Interconnection Procedures; POA&M Management Procedures|Authorization package; Security assessment report; POA&M; Continuous monitoring strategy; ISAs/MOUs|Required|Required|Required
```

---

## 6. Required Documentation Artifacts by Framework

### 6.1 Framework-to-Artifact Matrix

The table below specifies required documentation artifacts per framework, organized by artifact type. An "R" indicates the artifact is required by that framework; "R-C" indicates required for certification; "R-H" indicates required at High impact only; "C" indicates conditionally required; "—" indicates not directly required.

| Documentation Artifact | NIST 800-53 R5 | NIST 800-171/CMMC L2 | ISO 27001:2022 | FISMA | Notes |
|------------------------|---------------|----------------------|---------------|-------|-------|
| **Policies** | | | | | |
| Information Security Policy | R (PL-1) | R (3.12.4) | R (Cl. 5.2, A.5.1) | R | Top-level policy required by all frameworks |
| Access Control Policy | R (AC-1) | R (3.1.1) | R (A.5.15) | R | |
| Audit and Accountability Policy | R (AU-1) | R (3.3.1) | R (A.8.15) | R | |
| Awareness and Training Policy | R (AT-1) | R (3.2.1) | R (A.6.3) | R | |
| Configuration Management Policy | R (CM-1) | R (3.4.1) | R (A.8.8, A.8.9) | R | |
| Contingency Planning Policy | R (CP-1) | C (3.6.1) | R (A.5.29, A.5.30) | R | |
| Identification and Authentication Policy | R (IA-1) | R (3.5.1) | R (A.5.16, A.5.17) | R | |
| Incident Response Policy | R (IR-1) | R (3.6.1) | R (A.5.24) | R | |
| Maintenance Policy | R (MA-1) | R (3.7.1) | R (A.5.31) | R | |
| Media Protection Policy | R (MP-1) | R (3.8.1) | R (A.7.10, A.8.10) | R | |
| Physical and Environmental Protection Policy | R (PE-1) | R (3.10.1) | R (A.7.1) | R | |
| Personnel Security Policy | R (PS-1) | R (3.9.1) | R (A.6.1) | R | |
| Risk Assessment Policy | R (RA-1) | R (3.11.1) | R (Cl. 6.1) | R | |
| System Acquisition Policy | R (SA-1) | C | R (A.5.19) | R | |
| System Communications Protection Policy | R (SC-1) | R (3.13.1) | R (A.8.21, A.8.22) | R | |
| System Information Integrity Policy | R (SI-1) | R (3.14.1) | R (A.8.7, A.8.8) | R | |
| Supply Chain Risk Management Policy | R (SR-1) | C | R (A.5.19, A.5.21) | R | |
| Privacy Policy | R (PT-1) | — | C (ISO 27701) | R | Required when PII processed |
| **Plans and Programs** | | | | | |
| System Security Plan (SSP) | R (PL-2) | R (3.12.4) | — (ISMS scope covers) | R | Core FISMA artifact; required for ATO |
| Information Security Program Plan | R (PM-1) | — | R (Cl. 6.2) | R | |
| Business Continuity Plan / Contingency Plan | R (CP-2) | C | R (A.5.29, A.5.30) | R | |
| Incident Response Plan | R (IR-8) | R (3.6.1) | R (A.5.26) | R | |
| Security Assessment Report | R (CA-2) | R | — | R | Required for FISMA authorization |
| Continuous Monitoring Strategy | R (CA-7) | C | R (Cl. 9.1) | R | |
| Plan of Action and Milestones (POA&M) | R (CA-5) | R (3.12.2) | C | R | Core FISMA artifact |
| Privacy Impact Assessment (PIA) | R (PT-3) | — | C | R | Required when PII processed |
| Risk Assessment Report | R (RA-3) | R (3.11.1) | R (Cl. 6.1) | R | |
| **Procedures** | | | | | |
| Account Management Procedures | R (AC-2) | R (3.1.1) | R (A.5.15, A.5.18) | R | |
| Configuration Baseline Procedures | R (CM-2) | R (3.4.1) | R (A.8.9) | R | |
| Change Control Procedures | R (CM-3) | R (3.4.3) | R (A.8.32) | R | |
| Vulnerability Scanning Procedures | R (RA-5) | R (3.11.2) | R (A.8.8) | R | |
| Patch Management Procedures | R (SI-2) | R (3.14.1) | R (A.8.8) | R | |
| Backup Procedures | R (CP-9) | C | R (A.8.13) | R | |
| Personnel Screening Procedures | R (PS-3) | C | R (A.6.1) | R | |
| Media Sanitization Procedures | R (MP-6) | R (3.8.3) | R (A.7.10, A.8.10) | R | |
| Access Review Procedures | R (AC-2) | R (3.1.1) | R (A.5.18) | R | |
| **Supporting Artifacts** | | | | | |
| Rules of Behavior | R (PL-4) | — | — | R | |
| Authorization to Operate (ATO) | — | — | — | R | FISMA-specific |
| Interconnection Security Agreements (ISA) | R (CA-3) | — | R (A.5.22) | R | |
| Statement of Applicability (SoA) | — | — | R (Cl. 6.1.3) | — | ISO 27001-specific required artifact |
| ISMS Scope Statement | — | — | R (Cl. 4.3) | — | ISO 27001-specific |
| Asset Inventory | R (CM-8) | R (3.4.1) | R (A.5.9, A.5.10) | R | |
| Software Bill of Materials (SBOM) | R (SA-17, SR-4) | C | C | C | Required for federal contractors (EO 14028) |

### 6.2 Impact Level Scaling

For NIST 800-53 and FISMA, documentation requirements scale with system impact level (as determined by FIPS 199 categorization):

**Low Impact Systems:** Require core policy and procedure documentation for all 20 control families, SSP, and POA&M. Control selection from the Low baseline in NIST 800-53B.

**Moderate Impact Systems:** Require everything at Low plus expanded procedures for AU (audit reduction, report generation), CP (full contingency plan with testing), SC (expanded boundary protection and cryptographic management), and SI (security monitoring). Control selection from the Moderate baseline.

**High Impact Systems:** Require everything at Moderate plus comprehensive documentation for all high-baseline controls including: PE (full environmental controls), CP (alternate processing and storage sites with documented agreements), IR (automated incident handling capabilities), SC (full cryptographic management, denial of service protection), and SI (comprehensive intrusion detection). Control selection from the High baseline.

---

## 7. System Security Plan (SSP) Structure Template

### 7.1 Purpose

The System Security Plan (SSP) is the primary documentation artifact for FISMA compliance and CMMC Level 2 assessment. It documents the security controls implemented for a specific information system, the environment of operation, system boundaries, data flows, and the status of each required control.

The SSP is a living document: it must be kept current as the system evolves, control implementations change, and vulnerabilities are discovered and remediated.

### 7.2 SSP Template

```
═══════════════════════════════════════════════════════════════════
SYSTEM SECURITY PLAN
═══════════════════════════════════════════════════════════════════

DOCUMENT CONTROL
────────────────
System Name:          [Full System Name]
System Identifier:    [Unique system identifier, e.g., SYS-001]
Version:              [X.X]
Classification:       [CUI / Unclassified / SBU as applicable]
Status:               [Draft / Under Review / Approved / Authorized]
Prepared By:          [Name, Title, Organization]
Approved By:          [Authorizing Official Name, Title]
Approval Date:        [YYYY-MM-DD]
Next Review Date:     [YYYY-MM-DD]
Distribution:         [List of authorized recipients]

═══════════════════════════════════════════════════════════════════
PART I: SYSTEM IDENTIFICATION
═══════════════════════════════════════════════════════════════════

1.1 System Name and Identifier
  System Name: [Official system name]
  System Abbreviation: [Abbreviation used internally]
  System Identifier: [Unique identifier assigned by IT governance]
  System Owner: [Name, title, organization, phone, email]
  Authorizing Official: [Name, title, organization]
  Designated Security Representative: [Name, title, organization]
  Information System Security Officer (ISSO): [Name, title, phone, email]
  System Developer/Maintainer: [Organization]

1.2 System Operational Status
  ☐ Operational
  ☐ Under Development
  ☐ Major Modification in Progress

1.3 System Type
  ☐ Major Application
  ☐ General Support System
  ☐ Minor Application (covered by another SSP)

1.4 System Description
  [2–4 paragraph narrative describing the system's purpose, primary
   functions, user population, and operational context. Avoid
   technical implementation details here; address those in Section 2.]

1.5 System Environment
  Physical Location(s): [Data center names, addresses, or geographic
                          regions. Use synthetic identifiers for
                          security-sensitive locations.]
  Hosting Model: [On-premises / Cloud (provider, region) / Hybrid]
  Operating Environment: [Operating systems, virtualization platforms,
                          container orchestration]

1.6 System Interconnections
  [Table of systems that interconnect with this system]

  | Interconnected System | Organization | Data Exchanged | Port/Protocol | ISA Reference |
  |----------------------|--------------|----------------|---------------|---------------|
  | [System Name]        | [Org]        | [Data type]    | [Port/proto]  | [ISA-XXX]    |

1.7 Laws, Regulations, and Policies Applicable to This System
  [List of applicable laws, regulations, executive orders, and
   policies. Example entries:]
  - Federal Information Security Modernization Act (FISMA), 44 U.S.C. § 3551
  - NIST SP 800-53 Revision 5
  - OMB Circular A-130
  - [Agency-specific policies]
  - [Applicable contractual requirements]

═══════════════════════════════════════════════════════════════════
PART II: SYSTEM CATEGORIZATION
═══════════════════════════════════════════════════════════════════

2.1 Information Types Processed
  [Table listing each information type, its NIST SP 800-60 identifier,
   and impact values]

  | Information Type | NIST 800-60 ID | Confidentiality | Integrity | Availability |
  |-----------------|----------------|-----------------|-----------|--------------|
  | [Type name]     | [X.X.X.X]     | Low/Mod/High    | Low/Mod/High | Low/Mod/High |

2.2 System Impact Level (FIPS 199)
  Overall Confidentiality Impact: [Low / Moderate / High]
  Overall Integrity Impact:       [Low / Moderate / High]
  Overall Availability Impact:    [Low / Moderate / High]
  Overall System Impact Level:    [Low / Moderate / High]
  (Overall = high-water mark across all three values)

2.3 Categorization Rationale
  [Narrative explaining the rationale for the assigned impact level,
   particularly for any non-obvious determinations. Reference the
   specific information type(s) that drove the final categorization.]

═══════════════════════════════════════════════════════════════════
PART III: SYSTEM SECURITY CONTROLS
═══════════════════════════════════════════════════════════════════

3.1 Control Selection
  Baseline:         [Low / Moderate / High baseline per NIST 800-53B]
  Overlays Applied: [List any overlays, e.g., Privacy Overlay, CUI Overlay]
  Tailoring Actions: [List control additions or removals with justification]

3.2 Common Controls
  [Controls inherited from organizational or infrastructure providers]

  | Control ID | Control Name | Common Control Provider | Inheritance Type |
  |-----------|-------------|------------------------|------------------|
  | [AC-1]    | [Name]      | [Provider name]        | Fully inherited  |
  | [PE-1]    | [Name]      | [Provider name]        | Partially inherited |

3.3 System-Specific Control Implementation

  [For each control in the selected baseline, provide an implementation
   statement. Structure each entry as shown below.]

  ─────────────────────────────────────────────
  CONTROL: AC-1 — ACCESS CONTROL POLICY AND PROCEDURES
  ─────────────────────────────────────────────
  Control Requirement:
    The organization develops, documents, and disseminates an access
    control policy and procedures to facilitate implementation.

  Implementation Status:
    ☐ Implemented     ☒ Partially Implemented
    ☐ Planned         ☐ Not Applicable     ☐ Inherited

  Implementation Description:
    [Describe how this control is implemented for this system.
     Reference specific documents, configurations, or artifacts
     that provide evidence of implementation.]

  Evidence Artifacts:
    - [Document name, location, version/date]
    - [Configuration setting, system/path]

  Responsible Role: [Role title]
  Implementation Date: [YYYY-MM-DD or "Planned: YYYY-MM-DD"]

  [Repeat for each control in the baseline]

═══════════════════════════════════════════════════════════════════
PART IV: SYSTEM ARCHITECTURE AND DATA FLOWS
═══════════════════════════════════════════════════════════════════

4.1 System Architecture Overview
  [High-level architecture description. Reference attached diagrams.
   Address: network topology, major components, trust boundaries,
   external interfaces, user access paths.]

4.2 Network Diagram Reference
  [Reference to attached network architecture diagram. Do not embed
   security-sensitive network diagrams in this document if it will
   be shared outside the security team. Reference by document ID.]
  Network Diagram: [ARCH-DIAGRAM-XXX, version, date]

4.3 Data Flow Diagram Reference
  [Reference to attached data flow diagram showing how sensitive
   data moves through the system.]
  Data Flow Diagram: [DFD-XXX, version, date]

4.4 Boundary Description
  [Define the authorization boundary: what is inside the boundary,
   what is outside, and how the boundary is enforced.]

═══════════════════════════════════════════════════════════════════
PART V: MINIMUM SECURITY CONTROLS SUMMARY
═══════════════════════════════════════════════════════════════════

5.1 Control Implementation Summary

  | Family | Controls Required | Fully Implemented | Partially Implemented | Planned | N/A | Inherited |
  |--------|------------------|-------------------|-----------------------|---------|-----|-----------|
  | AC     | [N]              | [N]               | [N]                   | [N]     | [N] | [N]       |
  | AU     | [N]              | ...               |                       |         |     |           |
  | [...]  |                  |                   |                       |         |     |           |
  | TOTAL  | [N]              | [N] (%)           | [N] (%)               | [N] (%) | [N] | [N] (%)  |

5.2 Open Vulnerabilities and Weaknesses
  [Summary of known vulnerabilities, weaknesses, or gaps identified
   during assessment. Reference POA&M for remediation details.]

  | Finding ID | Description | Severity | Control Family | POA&M Reference |
  |-----------|-------------|----------|----------------|-----------------|
  | VUL-001   | [Description] | High   | [AC]           | POA&M-2026-001  |

═══════════════════════════════════════════════════════════════════
PART VI: AUTHORIZATION
═══════════════════════════════════════════════════════════════════

6.1 Authorizing Official Signature
  I have reviewed the security controls documented in this System
  Security Plan and the residual risk to organizational operations,
  organizational assets, individuals, and other organizations.

  Based on my review, I hereby [grant / continue / deny] an
  Authorization to Operate for [System Name].

  Authorization Type:        ☐ Full ATO   ☐ Interim ATO   ☐ Denial
  Authorization Period:      [Start Date] to [End Date]
  Conditions/Restrictions:   [Any conditions attached to the authorization]

  Authorizing Official:      _______________________________
  Name:                      [Name]
  Title:                     [Title]
  Organization:              [Organization]
  Date:                      [YYYY-MM-DD]

6.2 System Owner Signature
  I certify that the information in this System Security Plan is
  accurate and that controls are implemented as described.

  System Owner:              _______________________________
  Name:                      [Name]
  Title:                     [Title]
  Date:                      [YYYY-MM-DD]

6.3 ISSO Signature
  I have reviewed this System Security Plan and attest that the
  control implementation descriptions accurately reflect the
  current state of the system.

  ISSO:                      _______________________________
  Name:                      [Name]
  Title:                     [Title]
  Date:                      [YYYY-MM-DD]

═══════════════════════════════════════════════════════════════════
APPENDICES
═══════════════════════════════════════════════════════════════════

Appendix A: Acronyms and Definitions
Appendix B: Referenced Documents
Appendix C: Control Implementation Detail (if not embedded in Part III)
Appendix D: Network Architecture Diagram (RESTRICTED)
Appendix E: Data Flow Diagram (RESTRICTED)
Appendix F: Interconnection Security Agreements (ISAs)
Appendix G: Continuous Monitoring Strategy
```

---

## 8. Plan of Action and Milestones (POA&M) Structure Template

### 8.1 Purpose

The Plan of Action and Milestones (POA&M) is the tracking artifact for identified security control weaknesses and deficiencies. NIST 800-53 control CA-5 requires organizations to develop a POA&M that documents planned remediations, resource requirements, responsible parties, and milestones. FISMA requires agencies to report POA&M status to OMB annually. [nist-800-53]

The POA&M is not a confession — it is evidence of a mature security program. Auditors expect a populated POA&M because it demonstrates that the organization is actively identifying and tracking security gaps rather than asserting perfect compliance.

### 8.2 POA&M Entry Structure

Each POA&M entry documents a single weakness or deficiency. A POA&M with hundreds of entries for a complex system is normal; a POA&M with zero entries for a complex system is suspect.

```
═══════════════════════════════════════════════════════════════════
PLAN OF ACTION AND MILESTONES
═══════════════════════════════════════════════════════════════════

DOCUMENT CONTROL
────────────────
System Name:         [Full System Name]
System Identifier:   [SYS-XXX]
POA&M Version:       [X.X]
Reporting Period:    [YYYY-QN or YYYY-MM-DD through YYYY-MM-DD]
Prepared By:         [Name, Title]
Last Updated:        [YYYY-MM-DD]
POA&M Status:        [Active]

═══════════════════════════════════════════════════════════════════
SECTION 1: SUMMARY METRICS
═══════════════════════════════════════════════════════════════════

| Category               | Count |
|------------------------|-------|
| Total open items       | [N]   |
| High severity          | [N]   |
| Moderate severity      | [N]   |
| Low severity           | [N]   |
| Overdue items          | [N]   |
| Items closed this period| [N]  |
| New items this period  | [N]   |

═══════════════════════════════════════════════════════════════════
SECTION 2: OPEN ITEMS
═══════════════════════════════════════════════════════════════════

ITEM: POA&M-[YEAR]-[SEQ]
─────────────────────────────────────────────────────────────────
Weakness ID:           POA&M-2026-001
System:                [System Name / SYS-XXX]
Date Identified:       [YYYY-MM-DD]
Identified By:         [Source: Security Assessment / Audit / Scan /
                         Incident / Self-Assessment]
Control Family:        [AC / AU / AT / CM / CP / IA / IR / MA / MP /
                         PE / PL / PM / PS / RA / SA / SC / SI / SR /
                         PT / CA]
Control Reference:     [e.g., NIST 800-53 AC-2(1); CMMC 3.1.1]

Weakness Description:
  [Clear, specific description of the weakness. What is missing or
   not functioning correctly? Avoid jargon where possible. A finding
   description should enable a reader unfamiliar with the system to
   understand the gap.]
  Example: "Privileged user accounts are not reviewed on a quarterly
   basis as required by AC-2(1). The last recorded privileged account
   review was conducted 14 months ago."

Point of Contact:      [Name, Title, Email]
Resources Required:    [Personnel hours; tool licenses; infrastructure
                         costs; estimated dollar value if known]

Risk Rating:
  Severity:            ☐ High   ☐ Moderate   ☒ Low
  Likelihood:          ☐ High   ☐ Moderate   ☒ Low
  Overall Risk:        ☐ High   ☐ Moderate   ☒ Low
  Risk Justification:  [Brief rationale for risk rating, especially
                         if rating differs from vulnerability severity]

Milestones:
  | Milestone | Description | Responsible Party | Planned Completion |
  |-----------|-------------|-------------------|-------------------|
  | M1        | [Action]    | [Name/Role]       | YYYY-MM-DD        |
  | M2        | [Action]    | [Name/Role]       | YYYY-MM-DD        |
  | M3        | [Remediation complete; validate and close] | [Name/Role] | YYYY-MM-DD |

Scheduled Completion Date: [YYYY-MM-DD]
Status:                    ☐ On Track   ☐ Delayed   ☐ Completed
Status Narrative:          [Update status each reporting period]

Delay Reason (if applicable):
  [If scheduled completion date has passed, document the reason
   for delay and the revised completion date. Recurring delays
   without justification escalate to the AO.]

─────────────────────────────────────────────────────────────────
[Repeat ITEM block for each open weakness]

═══════════════════════════════════════════════════════════════════
SECTION 3: CLOSED ITEMS (CURRENT PERIOD)
═══════════════════════════════════════════════════════════════════

| POA&M ID | Weakness Description | Closed Date | Closure Method | Validated By |
|---------|---------------------|-------------|----------------|--------------|
| POA&M-2025-008 | [Description] | YYYY-MM-DD | Remediated | [ISSO Name] |
| POA&M-2025-012 | [Description] | YYYY-MM-DD | Risk accepted | [AO Name] |
| POA&M-2025-019 | [Description] | YYYY-MM-DD | Operational requirement | [AO Name] |

Closure Method Definitions:
  Remediated:             Control weakness corrected; evidence collected
  Risk accepted:          AO formally accepts residual risk; documented
  Operational requirement: Control not applicable due to mission need;
                           AO-approved exception in place
  False positive:         Finding determined not applicable upon review;
                          rationale documented

═══════════════════════════════════════════════════════════════════
SECTION 4: RISK ACCEPTANCE REGISTER
═══════════════════════════════════════════════════════════════════

[Items where the Authorizing Official has formally accepted residual
 risk rather than remediating the weakness]

| POA&M ID | Weakness | Risk Level | AO Signature | Acceptance Date | Expiry Date |
|---------|---------|-----------|-------------|----------------|------------|
| POA&M-2025-003 | [Description] | Moderate | [AO Name] | YYYY-MM-DD | YYYY-MM-DD |

═══════════════════════════════════════════════════════════════════
SECTION 5: AUTHORIZATION OFFICIAL REVIEW
═══════════════════════════════════════════════════════════════════

I have reviewed the Plan of Action and Milestones for [System Name]
for the period ending [YYYY-MM-DD].

I acknowledge the open weaknesses documented above and concur with
the planned remediation milestones.

Authorizing Official: _______________________________
Name:                 [Name]
Title:                [Title]
Date:                 [YYYY-MM-DD]
```

### 8.3 POA&M Management Cadence

POA&M management is a continuous activity, not a point-in-time exercise. The following cadence applies:

**Weekly:** ISSO reviews open items for milestone due dates in the coming two weeks. Items approaching deadlines are escalated to responsible parties.

**Monthly:** ISSO updates POA&M status for all open items. New findings from vulnerability scans, audit findings, and continuous monitoring are added. Closed items are moved to Section 3.

**Quarterly:** System owner and ISSO conduct a joint review of all open items. High-severity items open for more than 90 days require documented justification or escalation to the AO. Risk acceptance decisions are reviewed and re-affirmed or remediation is resumed.

**Annually:** POA&M is submitted as part of the annual FISMA report. All items are reviewed for accuracy. The AO reviews and signs Section 5.

---

## 9. Documentation Program Compliance Posture

### 9.1 Documentation as a Compliance Control

Documentation is not merely evidence of compliance — it is itself a compliance control. NIST 800-53 R5 uses the phrase "document and implement" throughout the control catalog: the requirement is not only to have a control in place but to have it documented. Undocumented controls fail compliance review regardless of technical implementation.

This creates a direct accountability relationship between the documentation program (addressed in M1–M3) and compliance posture (addressed in this module). A mature docs-as-code pipeline (M3) that keeps documentation current and traceable directly supports compliance audit readiness. When an auditor requests evidence that the access control policy is current and has been reviewed, the Git log and CI/CD pipeline history provide that evidence automatically.

### 9.2 Documentation Quality as Audit Readiness

The following documentation qualities directly support audit readiness:

**Currency.** Auditors verify that documentation reflects current system state. A policy dated 2021 that references system components decommissioned in 2023 is a finding. The docs-as-code pipeline's drift detection and staleness management (M3) maintain currency automatically.

**Traceability.** Auditors verify that controls are traceable to authoritative sources. The framework references in each document's frontmatter (as defined in the schema) provide this traceability. An access control policy that references NIST 800-53 AC-1 and ISO 27001 A.5.15 enables the auditor to map the document to applicable requirements in seconds.

**Completeness.** Auditors verify that all required documentation artifacts exist. The control family cross-reference in Section 5 provides the definitive list of required artifacts for each framework. Organizations should maintain a documentation inventory that maps each artifact to its location in the documentation system.

**Review evidence.** Auditors verify that documentation is reviewed and approved by appropriate personnel. Approval blocks, review signatures, and version history provide this evidence. The Git history provides an immutable record of who changed what and when.

### 9.3 Framework Selection and Applicability Assessment

Not all frameworks apply to all organizations. The following decision tree guides framework applicability assessment:

```
START: What type of organization are you?

├── Federal agency?
│   └── YES → FISMA required. NIST 800-53 required.
│              CSF 2.0 reference. OMB A-130 applicable.
│
├── Federal contractor?
│   ├── Handle CUI for DoD?
│   │   └── YES → NIST 800-171 required. CMMC level
│   │              determined by contract requirements.
│   └── Handle CUI for civilian agencies?
│       └── YES → NIST 800-171 required per DFARS/FAR.
│
├── Private sector / Commercial?
│   ├── Customers in EU or handle EU personal data?
│   │   └── YES → GDPR applies. ISO 27001 strongly recommended.
│   ├── Handle healthcare data (US)?
│   │   └── YES → HIPAA applies. NIST 800-66 guidance.
│   ├── Handle payment card data?
│   │   └── YES → PCI DSS applies.
│   ├── Seek ISO 27001 certification?
│   │   └── YES → ISO 27001/27002 required.
│   └── General security program improvement?
│       └── YES → CSF 2.0 as voluntary baseline.
│
└── Critical infrastructure operator?
    └── YES → CISA guidance; sector-specific frameworks
               (NERC CIP for energy, TSA SD for pipelines,
               etc.) plus CSF 2.0.
```

### 9.4 Cross-Framework Harmonization

Organizations subject to multiple frameworks can reduce documentation overhead through harmonization: producing documents that satisfy multiple frameworks simultaneously rather than maintaining separate documents for each.

The following harmonization opportunities reduce documentation burden:

| Harmonized Document | Satisfies |
|--------------------|-----------|
| Information Security Policy | NIST 800-53 PL-1; ISO 27001 Cl.5.2; CMMC 3.12.4 |
| Access Control Policy | NIST 800-53 AC-1; ISO 27001 A.5.15; CMMC 3.1.1 |
| Incident Response Plan | NIST 800-53 IR-8; ISO 27001 A.5.26; CMMC 3.6.1 |
| Vulnerability Management Procedures | NIST 800-53 RA-5; ISO 27001 A.8.8; CMMC 3.11.2 |
| Configuration Management Policy | NIST 800-53 CM-1; ISO 27001 A.8.9; CMMC 3.4.1 |
| Business Continuity Plan | NIST 800-53 CP-2; ISO 27001 A.5.29; CMMC 3.6.1 (partial) |

A harmonized document includes control family references from all applicable frameworks in its frontmatter `framework_refs` field (per the schema defined in this mission). This enables auditors working under different frameworks to find the same document through different control reference searches.

---

## 10. Roles and Responsibilities

### 10.1 Authorizing Official (AO)

The Authorizing Official accepts residual security risk on behalf of the organization. For FISMA purposes, the AO is a senior official with the authority to authorize systems to operate. Responsibilities relevant to documentation:

- Signing the SSP authorization section (Section 6 of the SSP template)
- Reviewing and acknowledging the POA&M quarterly
- Formally accepting risk for items that will not be remediated (risk acceptance register)
- Approving exceptions to documentation policies

### 10.2 Information System Security Officer (ISSO)

The ISSO is the primary documentation owner for system-specific security documentation. Responsibilities:

- Maintaining the SSP and POA&M for assigned systems
- Ensuring all required documentation artifacts for applicable frameworks exist and are current
- Coordinating documentation reviews with SMEs and control owners
- Reporting documentation compliance posture to the ISSM

### 10.3 Information System Security Manager (ISSM)

The ISSM oversees the information security program and its documentation requirements. Responsibilities:

- Maintaining the Information Security Program Plan
- Ensuring all system-level SSPs and POA&Ms are current
- Reporting aggregate documentation compliance posture to leadership
- Coordinating with the Compliance Lead on framework applicability assessments

### 10.4 Compliance Lead

The Compliance Lead owns framework applicability determination and cross-framework harmonization. Responsibilities:

- Assessing which frameworks apply to the organization and its systems
- Maintaining this module and the control family cross-reference
- Coordinating external audits and assessments
- Providing documentation requirements guidance to ISSOs and documentation owners

### 10.5 Control Owners

Control owners are the organizational roles responsible for implementing and maintaining specific controls. Each control owner is also responsible for the documentation that evidences their control's implementation. Control ownership is documented in the SSP and in the CODEOWNERS file for documentation maintained in the docs-as-code pipeline.

---

## 11. Related Documents

- M1: Documentation Strategy and Governance
- M2: Document Taxonomy and Classification
- M3: Docs-as-Code Pipeline
- M5: Tooling and Templates Reference
- Information Security Policy
- System Security Plan (per-system)
- Plan of Action and Milestones (per-system)
- Risk Assessment Program documentation
- Incident Response Plan

---

## 12. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-05 | Information Security Compliance | Initial publication |

---

## Sources

[nist-csf-2] NIST, "Cybersecurity Framework 2.0," February 2024. National Institute of Standards and Technology.

[nist-800-53] NIST SP 800-53 Revision 5, "Security and Privacy Controls for Information Systems and Organizations," September 2020. National Institute of Standards and Technology.

[nist-800-100] NIST SP 800-100, "Information Security Handbook: A Guide for Managers," October 2006. National Institute of Standards and Technology.

[nist-800-171] NIST SP 800-171 Revision 2, "Protecting Controlled Unclassified Information in Nonfederal Systems and Organizations," February 2020. National Institute of Standards and Technology.

[iso-27001] ISO/IEC 27001:2022, "Information Security, Cybersecurity and Privacy Protection — Information Security Management Systems — Requirements," October 2022. International Organization for Standardization.

[iso-27002] ISO/IEC 27002:2022, "Information Security, Cybersecurity and Privacy Protection — Information Security Controls," February 2022. International Organization for Standardization.

[scf] Secure Controls Framework Council, "Policy vs Standard vs Procedure," Secure Controls Framework. Available at securecontrolsframework.com.

[secureframe-2025] Secureframe, "NIST 800-53 Required Policies and Procedures," 2025. Secureframe Inc.

[instinctools-2024] Instinctools, "DITA XML: Exploring the Darwin Information Typing Architecture Standard," May 2024.
