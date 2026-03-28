# GSD OpenStack Cloud Platform — NASA SE & OpenStack Reference Guide

**Date:** February 21, 2026  
**Status:** Research Compilation / Technical Reference Draft  
**Source Document:** gsd-openstack-nasa-vision.md  
**Purpose:** Professional source material mapping NASA systems engineering methodology to OpenStack cloud operations. Every process mapping, documentation standard, and operational procedure traces to authoritative sources. Mission agents use this document to produce documentation that meets NASA SE rigor applied to cloud infrastructure.

---

## How to Use This Document

Where the vision document says "map each chapter to a NASA SE phase," this document provides the exact mapping — which SE Engine process applies, which NPR 7123.1 requirement is satisfied, what the OpenStack equivalent looks like, and what documentation artifact is produced. Where the vision says "verify runbooks against the running system," this document provides the verification methodology drawn from NASA's Product Verification process (SP-6105 §5.3).

An agent building any component of the educational pack needs only this document and the vision document to produce work that meets the project's quality standard.

**Key source organizations:**

- **NASA Office of the Chief Engineer (OCE)** — Systems engineering policy, handbooks, and standards. The authoritative source for SE methodology.
- **Open Infrastructure Foundation (OIF)** — Governance and development of OpenStack. The authoritative source for OpenStack architecture and operations.
- **NASA NODIS (NASA Online Directives Information System)** — Official repository for NPRs, NPDs, and NASA standards. Source for NPR 7123.1D.
- **NASA Technical Standards System** — Repository for NASA handbooks and standards. Source for NASA-HDBK-1009A.
- **NASA Technical Reports Server (NTRS)** — Archive of NASA technical publications. Source for SP-2016-6105 Rev2.
- **CentOS Project / Red Hat** — CentOS Stream 9 documentation and enterprise Linux standards.

---

## Section 1: The SE Engine Applied to Cloud Operations

NASA's SE Engine (NPR 7123.1, Figure 3-1) defines 17 common technical processes in three groups. Each maps to specific cloud operations activities:

### 1.1 System Design Processes (Processes 1-4)

**Process 1 — Stakeholder Expectations Definition** (SP-6105 §4.1)

| NASA Element | Cloud Operations Equivalent |
|---|---|
| Identify stakeholders | Who uses this cloud? Developers, operators, end users, security team, management |
| Capture expectations as NGOs (Needs, Goals, Objectives) | Service level expectations: uptime, performance, capacity, security posture |
| Define Measures of Effectiveness (MOEs) | Cloud MOEs: instance launch time <30s, API availability >99.9%, storage IOPS >1000 |
| Develop Concept of Operations (ConOps) | Cloud Architecture Overview: how users interact with each service, operational scenarios, failure modes |
| Validate stakeholder expectations | Review ConOps with all stakeholders, confirm MOEs are achievable with available hardware |

**Key NPR 7123.1 requirement:** [SE-01] "The program/project shall identify and engage stakeholders." Applied: document all cloud consumers and their needs before designing the architecture.

**Process 2 — Technical Requirements Definition** (SP-6105 §4.2)

| NASA Element | Cloud Operations Equivalent |
|---|---|
| Transform expectations into "shall" statements | "The compute service shall support launching instances with at least 4 flavors" |
| Define functional requirements | Each OpenStack service's functional capabilities |
| Define performance requirements | API response times, throughput, concurrent users |
| Define constraints | Hardware limitations, network topology, security compliance |
| Define Measures of Performance (MOPs) | Quantitative measures for each requirement |
| Establish requirements traceability | Every requirement traces to a stakeholder need; every test traces to a requirement |

**Key NPR 7123.1 requirement:** [SE-03] "The program/project shall define technical requirements." Applied: formal requirements document for each OpenStack service before configuration begins.

**Process 3 — Logical Decomposition** (SP-6105 §4.3)

| NASA Element | Cloud Operations Equivalent |
|---|---|
| Decompose requirements to logical functions | Map cloud requirements to OpenStack services (compute→Nova, network→Neutron, etc.) |
| Create functional models | Service interaction diagrams, API call flows, authentication sequences |
| Allocate requirements to functions | Which service satisfies which requirement |
| Define system architecture | Single-node vs. multi-node, network topology, storage backend selection |
| Derive lower-level requirements | Service-specific configuration requirements derived from system-level needs |

**Process 4 — Design Solution Definition** (SP-6105 §4.4)

| NASA Element | Cloud Operations Equivalent |
|---|---|
| Generate alternative designs | Kolla-Ansible vs. DevStack vs. manual deployment; OVS vs. OVN; LVM vs. Ceph |
| Conduct trade studies | Document each decision with alternatives considered, criteria evaluated, rationale for selection |
| Select preferred design | Commit to specific deployment method, network backend, storage backend |
| Develop design-to specifications | Kolla-Ansible globals.yml, inventory files, service-specific configs |
| Archive trade study results | Git commits documenting every design decision with rationale |

**Key principle from SP-6105 §2.5:** "Trade studies should precede — rather than follow — system design decisions." Applied: document the alternatives *before* writing the configuration, not after.

### 1.2 Product Realization Processes (Processes 5-9)

**Process 5 — Product Implementation** (SP-6105 §5.1)

| NASA Element | Cloud Operations Equivalent |
|---|---|
| Build, code, or buy | Deploy OpenStack services via Kolla-Ansible |
| Review vendor technical information | Validate Kolla-Ansible defaults against requirements |
| Inspect delivered products | Verify each container is running, correct version, correct configuration |
| Prepare support documentation | Generate service-specific operations procedures |

**Process 6 — Product Integration** (SP-6105 §5.2)

| NASA Element | Cloud Operations Equivalent |
|---|---|
| Assemble lower-level products into higher-level | Wire Keystone→Nova→Neutron→Cinder into a functioning cloud |
| Confirm products ready for integration | Each service passes individual health checks before cross-service testing |
| Prepare integration environment | Management network, API endpoints, service catalog registration |
| Execute integration plan | Sequential service bring-up following dependency order |

Integration dependency order (derived from OpenStack architecture):
```
1. Keystone (identity — everything depends on this)
2. Glance (images — Nova needs images to launch instances)
3. Nova (compute — needs Keystone auth and Glance images)
4. Neutron (networking — needs Keystone auth, Nova needs Neutron for instance networking)
5. Cinder (storage — needs Keystone auth, Nova uses for block storage)
6. Horizon (dashboard — needs all of the above)
7. Heat (orchestration — needs all of the above)
8. Swift (object storage — needs Keystone auth, independent of others)
```

**Process 7 — Product Verification** (SP-6105 §5.3)

| NASA Element | Cloud Operations Equivalent |
|---|---|
| Prove product conforms to requirements | Each service meets its specification |
| Methods: Test, Analysis, Inspection, Demonstration (TAID) | API tests, log analysis, configuration inspection, operational demonstrations |
| Verification procedures | Documented test procedures with expected results |
| Anomaly identification and resolution | Failed tests → root cause → fix → retest |
| Verification report | Formal V&V report mapping test results to requirements |

Verification methods applied to OpenStack:

| Method | Application |
|---|---|
| **Test** | API functional tests (openstack token issue, openstack server create), integration tests, load tests |
| **Analysis** | Log analysis (service startup sequences, error patterns), configuration analysis (security review) |
| **Inspection** | Configuration file review, certificate validation, RBAC policy audit |
| **Demonstration** | End-to-end operational scenarios (create project → configure network → launch instance → attach storage → access via floating IP) |

**Process 8 — Product Validation** (SP-6105 §5.4)

| NASA Element | Cloud Operations Equivalent |
|---|---|
| Confirm product meets stakeholder expectations in intended environment | Cloud works for its intended users under realistic conditions |
| Validation differs from verification | Verification: "does it meet spec?" Validation: "does it actually work for the people who need it?" |
| Realistic conditions | Real workloads, real users, real network conditions — not just API tests |
| User acceptance | Operators can perform their tasks using the documented procedures |

**Process 9 — Product Transition** (SP-6105 §5.5)

| NASA Element | Cloud Operations Equivalent |
|---|---|
| Transition product to operational use | Hand off from deployment crew to operations crew |
| Prepare operations documentation | Ops manual, runbooks, monitoring dashboards — all verified |
| Train operators | Cloud ops curriculum, hands-on exercises on the deployed system |
| Confirm readiness for operations | Operational Readiness Review (ORR) — can the ops team run this? |

### 1.3 Technical Management Processes (Processes 10-17)

These eight processes run continuously across all phases:

| Process | SP-6105 Section | Cloud Operations Application |
|---|---|---|
| 10. Technical Planning | §6.1 | Cloud Engineering Management Plan — how we build and maintain this cloud |
| 11. Requirements Management | §6.2 | Track requirements changes, maintain traceability, manage scope |
| 12. Interface Management | §6.3 | Service API contracts, network interfaces, storage interfaces |
| 13. Technical Risk Management | §6.4 | Identify risks (hardware failure, network partition, security breach), mitigation plans |
| 14. Configuration Management | §6.5 | Git-controlled configs, change control process, baseline management |
| 15. Technical Data Management | §6.6 | Documentation standards, archive strategy, access control |
| 16. Technical Assessment | §6.7 | Life-cycle reviews, progress tracking, health monitoring |
| 17. Decision Analysis | §6.8 | Formal decision records for design trade-offs, alternatives evaluation |

---

## Section 2: Life-Cycle Reviews Mapped to Cloud Deployment

NASA's life-cycle reviews (NPR 7123.1 Appendix G) map to cloud deployment milestones:

| NASA Review | Cloud Deployment Equivalent | What It Evaluates |
|---|---|---|
| **MCR** (Mission Concept Review) | Cloud Architecture Review | Is the proposed architecture feasible for this hardware? Do we understand what we're building? |
| **SRR** (System Requirements Review) | Requirements Baseline Review | Are the requirements complete, consistent, and traceable? Can we meet them? |
| **SDR** (System Definition Review) | Design Decision Review | Are the design trade studies complete? Is the selected approach sound? |
| **PDR** (Preliminary Design Review) | Configuration Review | Are the Kolla-Ansible configs correct? Are interfaces defined? Is the V&V plan ready? |
| **CDR** (Critical Design Review) | Pre-Deployment Review | Is everything ready to deploy? Are configs finalized? Are rollback procedures documented? |
| **SIR** (System Integration Review) | Integration Test Review | Do all services work together? Are cross-service interfaces validated? |
| **ORR** (Operational Readiness Review) | Operations Handoff Review | Can the ops team run this? Are runbooks verified? Is monitoring working? |
| **FRR** (Flight Readiness Review) | Production Go/No-Go | Final check: all systems nominal, all docs verified, all personnel trained? |
| **PLAR** (Post-Launch Assessment) | Post-Deployment Assessment | Is the cloud healthy? Are there issues from deployment? Is the system stable? |
| **DR** (Decommissioning Review) | Cloud Lifecycle Review | When the time comes: data migrated, services drained, resources recovered? |

Entrance and success criteria for each review follow NPR 7123.1 Appendix G format, tailored per §2.2 for cloud infrastructure.

---

## Section 3: NASA Document Types Applied to Cloud Operations

### 3.1 The ConOps (Concept of Operations)

Source: SP-6105 §4.1, Appendix S

The ConOps describes how the cloud will be used operationally. It is written from the user's perspective, not the system's perspective. For the cloud, the ConOps answers:

- Who are the users? (developers deploying applications, operators maintaining infrastructure, security team monitoring threats)
- What do they do? (create projects, launch instances, configure networks, manage storage, respond to incidents)
- What are the operational scenarios? (normal operations, peak load, hardware failure, security incident, upgrade)
- What are the off-nominal scenarios? (compute node failure, network partition, storage backend failure, Keystone outage)
- How do users interact with the system? (Horizon dashboard, CLI, API, Heat templates)

The ConOps is a Phase A deliverable, baselined at SRR (Requirements Baseline Review in cloud terms).

### 3.2 The SEMP (Systems Engineering Management Plan)

Source: SP-6105 §6.1, Appendix J

The Cloud Engineering Management Plan documents:

- Technical approach (how we build and verify the cloud)
- Organizational structure (deployment crew, ops crew, doc crew roles)
- Process tailoring (which NASA SE processes we follow and how we scale them)
- Risk management approach
- Configuration management approach (git workflows, change control)
- Technical reviews and gates
- Metrics and measures (how we track progress)

SEMP is baselined at SRR per NPR 7123.1 Table 5-1.

### 3.3 The Requirements Verification Matrix (RVM)

Source: SP-6105 Appendix D

Every requirement gets a verification entry:

```
Requirement: CLOUD-COMPUTE-001
  "The compute service shall support launching instances 
   with at least 4 predefined flavors."

Verification Method: Test + Inspection
  Test: Execute 'openstack flavor list' — confirm ≥4 flavors
  Test: Execute 'openstack server create' with each flavor — confirm success
  Inspection: Review nova.conf for flavor definitions

Verification Phase: Phase D (Integration & Test)
Acceptance Criteria: All 4 flavors create successfully, match specifications
Status: [PENDING / PASS / FAIL]
```

### 3.4 Operations Procedures Standard Format

Source: NASA-STD-3001 (adapted for cloud ops)

Every operational procedure follows:

```
PROCEDURE ID: OPS-[SERVICE]-[NUMBER]
TITLE: [What this procedure accomplishes]
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 §3.2 Process 9 (Product Transition)
LAST VERIFIED: [Date] against [System Version]
VERIFIED BY: [doc-verifier agent / manual verification]

PURPOSE
  [Why you would perform this procedure]

PRECONDITIONS
  [System state required before starting]

SAFETY CONSIDERATIONS
  [What could go wrong, what to watch for]

PROCEDURE
  Step 1: [Exact command or action]
    Expected result: [What you should see]
    If unexpected: [What to do]
  Step 2: ...

VERIFICATION
  [How to confirm success]

ROLLBACK
  [How to undo if needed]

REFERENCES
  [Related procedures, OpenStack docs, NASA SE sections]
```

---

## Section 4: OpenStack Architecture — Authoritative Sources

### 4.1 Core Services Reference

| Service | Official Documentation | Architecture Guide |
|---|---|---|
| Keystone | docs.openstack.org/keystone/latest | Identity service architecture, token management, federation |
| Nova | docs.openstack.org/nova/latest | Compute architecture, scheduling, instance lifecycle |
| Neutron | docs.openstack.org/neutron/latest | Networking architecture, ML2 plugin, OVN/OVS |
| Cinder | docs.openstack.org/cinder/latest | Block storage architecture, drivers, replication |
| Glance | docs.openstack.org/glance/latest | Image service architecture, backends, metadata |
| Swift | docs.openstack.org/swift/latest | Object storage architecture, rings, replication |
| Heat | docs.openstack.org/heat/latest | Orchestration architecture, HOT template format |
| Horizon | docs.openstack.org/horizon/latest | Dashboard architecture, panels, plugins |

### 4.2 Deployment Reference

| Tool | Documentation | Purpose |
|---|---|---|
| Kolla-Ansible | docs.openstack.org/kolla-ansible/latest | Production-grade containerized deployment |
| Kolla | docs.openstack.org/kolla/latest | Container image builds for OpenStack services |
| CentOS Stream 9 | docs.centos.org/en-US/stream9 | Base operating system documentation |

### 4.3 Operations Reference

| Topic | Source | Purpose |
|---|---|---|
| OpenStack Operations Guide | docs.openstack.org/ops-guide | Community-maintained operations best practices |
| OpenStack Security Guide | docs.openstack.org/security-guide | Security hardening and compliance |
| OpenStack HA Guide | docs.openstack.org/ha-guide | High availability architecture patterns |
| OpenStack Admin Guide | docs.openstack.org/admin | Day-to-day administration procedures |

### 4.4 The OpenStack-to-Everything Translation

This table is the cloud unit circle — the evidence that understanding OpenStack means understanding all clouds:

| Primitive | OpenStack | AWS | GCP | Azure | Kubernetes |
|---|---|---|---|---|---|
| Compute | Nova | EC2 | Compute Engine | Virtual Machines | Pods/Deployments |
| Network | Neutron | VPC | VPC | Virtual Network | CNI/Services |
| Block Storage | Cinder | EBS | Persistent Disk | Managed Disks | PersistentVolumes |
| Object Storage | Swift | S3 | Cloud Storage | Blob Storage | — (external) |
| Identity | Keystone | IAM | IAM | Entra ID | RBAC/ServiceAccounts |
| Images | Glance | AMIs | Images | VM Images | Container Images |
| Orchestration | Heat | CloudFormation | Deployment Mgr | ARM/Bicep | Helm/Operators |
| Dashboard | Horizon | Console | Console | Portal | Dashboard |
| Load Balancing | Octavia | ELB/ALB | Cloud LB | Load Balancer | Ingress/Services |
| DNS | Designate | Route 53 | Cloud DNS | Azure DNS | CoreDNS/ExternalDNS |
| Secrets | Barbican | Secrets Mgr | Secret Mgr | Key Vault | Secrets |
| Telemetry | Ceilometer | CloudWatch | Cloud Monitoring | Monitor | Prometheus |

---

## Section 5: Tailoring NASA SE for Cloud Operations

### 5.1 Project Classification

Per SP-6105 §3.11, Table 3.11-1, this project maps to:

| Criterion | NASA Classification | Cloud Equivalent |
|---|---|---|
| Mission type | Type C-D (Small science/robotic) | Lab/development cloud, not life-critical |
| Priority | Medium | Infrastructure that supports learning and development |
| Acceptable risk | Medium-High | Lab environment, data loss acceptable with documented recovery |
| Complexity | Medium | Single-node deployment, 8 services, standard network topology |
| Lifetime | Medium (2-5 years) | Lab cloud evolving through OpenStack releases |
| Cost | Low | Hardware already owned, open-source software only |

### 5.2 Tailoring Decisions

Following NPR 7123.1 §2.2 and SP-6105 §3.11:

| NASA Requirement | Tailoring Decision | Rationale |
|---|---|---|
| Formal independent review boards | Replaced by GSD's VERIFY agent + HITL review | Appropriate for lab-scale, non-safety-critical infrastructure |
| Standalone SEMP document | Integrated into Cloud Engineering Management Plan within git repo | SP-6105 §3.11.4.2 permits for smaller projects |
| Formal RID/RFA process | GSD issue tracking in .planning/ directory | Same information captured, lighter-weight process |
| Hardware qualification testing | Hardware inventory + compatibility verification | COTS hardware, no custom fabrication |
| Full ConOps with all appendices | Focused ConOps covering primary operational scenarios | Tailored scope per NPR 7123.1 §2.2 for medium-complexity projects |
| Formal V&V with independent V&V team | VERIFY agent independent from EXEC agents | Separation maintained; formality scaled to risk level |

All tailoring documented in the Compliance Matrix (Appendix H of NPR 7123.1) attached to the Cloud Engineering Management Plan.

---

## Section 6: Safety Considerations

### 6.1 Infrastructure Safety

| Condition | Recommendation | Boundary Type |
|---|---|---|
| Deployment modifies host network configuration | Verify changes are reversible; document rollback procedure before applying | GATE — confirm before proceeding |
| Security credentials generated during deployment | Store in local-only directory (never in git); document rotation procedures | ABSOLUTE — credentials never in version control |
| Service configuration enables external network access | Default to internal-only; require explicit HITL approval for external exposure | GATE — human approval required |
| Storage backend configuration could destroy existing data | Require explicit confirmation; verify backup exists before destructive operations | GATE — confirm before proceeding |
| Monitoring generates alerts | Alerts must have documented response procedures; no alert without a runbook | ANNOTATE — flag if runbook missing |

### 6.2 Documentation Safety

| Condition | Recommendation | Boundary Type |
|---|---|---|
| Procedure describes destructive operation | Procedure must include rollback section; verification must confirm reversibility | ABSOLUTE — no destructive procedure without rollback |
| Documentation references external URLs | All external URLs archived via Internet Archive API | ANNOTATE — flag unarchived links |
| Runbook has not been verified against current system | Mark as UNVERIFIED with last-known-good date; prioritize re-verification | ANNOTATE — visible warning |
| Operations manual section contradicts running configuration | Block publication; trigger doc-sync loop investigation | GATE — resolve before publishing |

---

## Source Bibliography

**NASA Systems Engineering:**
- NASA/SP-2016-6105 Rev2, NASA Systems Engineering Handbook (2016)
- NPR 7123.1D, NASA Systems Engineering Processes and Requirements
- NPR 7120.5, NASA Space Flight Program and Project Management Requirements
- NASA-HDBK-1009A, NASA Systems Modeling Handbook for Systems Engineering (2025)
- NASA/SP-2016-6105-SUPPL, Expanded Guidance for NASA Systems Engineering

**OpenStack:**
- OpenStack Official Documentation, docs.openstack.org
- OpenStack Operations Guide, docs.openstack.org/ops-guide
- OpenStack Security Guide, docs.openstack.org/security-guide
- Kolla-Ansible Deployment Guide, docs.openstack.org/kolla-ansible/latest
- Open Infrastructure Foundation, openinfra.dev

**Operating System:**
- CentOS Stream 9 Documentation, docs.centos.org
- Red Hat Enterprise Linux 9 Documentation (upstream reference)

**Monitoring:**
- Prometheus Documentation, prometheus.io/docs
- Grafana Documentation, grafana.com/docs

**Historical:**
- NASA Nebula Cloud Computing Platform (2008-2012), original NASA cloud project
- "OpenStack: The Path to Cloud" — Open Infrastructure Foundation history
