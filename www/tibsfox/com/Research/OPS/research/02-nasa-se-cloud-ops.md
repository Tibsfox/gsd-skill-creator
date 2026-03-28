# NASA Systems Engineering Applied to Cloud Ops

> **Domain:** Systems Engineering Methodology
> **Module:** 2 -- The SE Engine, Life-Cycle Reviews, and Verification Methods
> **Through-line:** *NASA achieved mission success not through heroic improvisation but through disciplined process. The SE Handbook exists because missions matter. When the same methodology is applied to cloud infrastructure, the result is not bureaucracy -- it is the difference between an operator who knows why each decision was made and one who is following tutorials they do not fully understand.*

---

## Table of Contents

1. [The SE Engine: 17 Processes for Cloud Operations](#1-the-se-engine-17-processes-for-cloud-operations)
2. [System Design Processes (1-4)](#2-system-design-processes-1-4)
3. [Product Realization Processes (5-9)](#3-product-realization-processes-5-9)
4. [Technical Management Processes (10-17)](#4-technical-management-processes-10-17)
5. [Life-Cycle Reviews as Deployment Gates](#5-life-cycle-reviews-as-deployment-gates)
6. [NASA Document Types for Cloud Operations](#6-nasa-document-types-for-cloud-operations)
7. [Verification Methods: TAID](#7-verification-methods-taid)
8. [Requirements Traceability](#8-requirements-traceability)
9. [Tailoring for Lab-Scale Infrastructure](#9-tailoring-for-lab-scale-infrastructure)
10. [The Compliance Matrix](#10-the-compliance-matrix)
11. [Safety and Boundary Conditions](#11-safety-and-boundary-conditions)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. The SE Engine: 17 Processes for Cloud Operations

NASA's Systems Engineering Engine, defined in NPR 7123.1D and elaborated in SP-2016-6105 Rev2, describes 17 common technical processes organized in three groups [1]. These processes are not optional steps in a checklist -- they are the fundamental activities that transform stakeholder needs into a verified, operational system. Every successful NASA mission follows them, whether the mission is a Mars rover, an Earth-observing satellite, or the International Space Station.

The insight that makes this applicable to cloud operations is that deploying and operating a cloud platform is a systems engineering problem. It involves stakeholder expectations (who uses the cloud and what do they need), requirements decomposition (what each service must do), design trade studies (which deployment method, which network backend, which storage architecture), implementation (actual deployment), verification (does it work), validation (does it solve the stakeholder's problem), and transition (handing off to operations). These are the same phases NASA uses, because the problem structure is the same [2].

```
NASA SE ENGINE -- APPLIED TO CLOUD OPERATIONS
================================================================

  SYSTEM DESIGN PROCESSES (Processes 1-4)
  "What are we building and why?"
  +------------------------------------------------------------+
  | 1. Stakeholder Expectations  -->  Who uses this cloud?     |
  | 2. Technical Requirements    -->  What must each service do?|
  | 3. Logical Decomposition     -->  Map reqs to services     |
  | 4. Design Solution           -->  Choose deployment method |
  +------------------------------------------------------------+
              |
              v
  PRODUCT REALIZATION PROCESSES (Processes 5-9)
  "Build it, integrate it, prove it works"
  +------------------------------------------------------------+
  | 5. Product Implementation    -->  Deploy via Kolla-Ansible |
  | 6. Product Integration       -->  Wire services together   |
  | 7. Product Verification      -->  Each service meets spec  |
  | 8. Product Validation        -->  Cloud works for users    |
  | 9. Product Transition        -->  Hand off to operations   |
  +------------------------------------------------------------+
              |
              v
  TECHNICAL MANAGEMENT PROCESSES (Processes 10-17)
  "Keep it under control throughout"
  +------------------------------------------------------------+
  | 10. Technical Planning       -->  Engineering mgmt plan    |
  | 11. Requirements Management  -->  Track changes + scope    |
  | 12. Interface Management     -->  API contracts            |
  | 13. Risk Management          -->  Hardware fail, security  |
  | 14. Configuration Management -->  Git-controlled configs   |
  | 15. Data Management          -->  Documentation standards  |
  | 16. Technical Assessment     -->  Reviews, health checks   |
  | 17. Decision Analysis        -->  Trade study records      |
  +------------------------------------------------------------+
```

> **SAFETY WARNING:** NASA SE methodology is a framework, not a rigid prescription. Applying it without tailoring to the project's risk level and complexity produces overhead without value. Section 9 of this module covers the tailoring process required by NPR 7123.1D Section 2.2. Skipping tailoring is itself a violation of the methodology.

---

## 2. System Design Processes (1-4)

### Process 1: Stakeholder Expectations Definition (SP-6105 Section 4.1)

Before any technical work begins, the SE Engine requires identifying who will use the system and what they need. For a cloud deployment, stakeholders include [3]:

| Stakeholder | Expectations | Measures of Effectiveness |
|---|---|---|
| Developers | On-demand compute and networking for application testing | Instance launch time < 30s, API availability > 99.9% |
| Operators | Manageable infrastructure with documented procedures | Mean time to diagnose < 15 min, all procedures verified |
| Security team | Hardened platform with audit trail | Zero unpatched CVEs > 30 days, complete audit log |
| Management | Cost-effective infrastructure meeting business needs | TCO < equivalent managed cloud, capacity utilization > 40% |
| End users | Reliable applications running on the platform | Application uptime > 99.5%, storage durability > 99.99% |

The stakeholder expectations are captured in the Concept of Operations (ConOps), which describes how the cloud will be used from the user's perspective -- not the system's perspective [4]. The ConOps answers: who are the users, what do they do, what are the operational scenarios (normal and off-nominal), and how do users interact with the system.

### Process 2: Technical Requirements Definition (SP-6105 Section 4.2)

Stakeholder expectations are transformed into formal "shall" statements that are testable and traceable [5]:

```
REQUIREMENT EXAMPLES
================================================================

  CLOUD-IDENTITY-001:
    "The identity service shall authenticate users and issue
     scoped tokens within 500ms at the 95th percentile."
    Source: Developer stakeholder, API responsiveness need
    Verification: Test (measure API latency under load)

  CLOUD-COMPUTE-003:
    "The compute service shall support at least 4 predefined
     flavors ranging from 1 vCPU/512MB to 8 vCPU/16GB."
    Source: Developer stakeholder, workload diversity need
    Verification: Inspection (review flavor list) + Test (launch each)

  CLOUD-NETWORK-005:
    "The networking service shall isolate tenant networks such
     that traffic from Project A cannot reach Project B without
     explicit router configuration."
    Source: Security stakeholder, multi-tenancy isolation need
    Verification: Test (create two isolated projects, verify no cross-traffic)

  CLOUD-STORAGE-002:
    "The block storage service shall support creating, attaching,
     detaching, and deleting volumes without data loss."
    Source: Developer stakeholder, persistent storage need
    Verification: Demonstration (full lifecycle test with data verification)
```

Every requirement must trace to a stakeholder need (upward traceability) and to a verification procedure (downward traceability). Requirements without both traces are orphans that add cost without demonstrated value [6].

### Process 3: Logical Decomposition (SP-6105 Section 4.3)

Requirements are mapped to logical functions, which are then allocated to OpenStack services:

| Logical Function | Allocated Service | Key Requirements |
|---|---|---|
| User authentication and authorization | Keystone | CLOUD-IDENTITY-001 through -008 |
| Virtual machine lifecycle management | Nova | CLOUD-COMPUTE-001 through -012 |
| Virtual network provisioning | Neutron | CLOUD-NETWORK-001 through -010 |
| Block storage management | Cinder | CLOUD-STORAGE-001 through -006 |
| Image management | Glance | CLOUD-IMAGE-001 through -004 |
| Infrastructure orchestration | Heat | CLOUD-ORCH-001 through -005 |
| Web-based management interface | Horizon | CLOUD-UI-001 through -003 |
| Object storage | Swift | CLOUD-OBJECT-001 through -004 |

### Process 4: Design Solution Definition (SP-6105 Section 4.4)

Design decisions require trade studies that document alternatives, evaluation criteria, and rationale. SP-6105 Section 2.5 states: "Trade studies should precede -- rather than follow -- system design decisions" [7].

**Example trade study: Deployment Method**

| Alternative | Pros | Cons | Score (1-5) |
|---|---|---|---|
| Kolla-Ansible | Production-grade, containerized, reproducible, active community | Higher initial complexity, requires Docker knowledge | 4.5 |
| DevStack | Quick setup, good for development | Not production-quality, fragile, manual reconfiguration | 2.0 |
| Manual installation | Maximum control, educational | Extremely time-consuming, dependency conflicts, not reproducible | 1.5 |
| TripleO / Ironic | Full lifecycle management | Massive complexity, designed for large deployments, discontinued | 1.0 |

**Decision:** Kolla-Ansible selected. Rationale documented in git commit with trade study reference.

---

## 3. Product Realization Processes (5-9)

### Process 5: Product Implementation (SP-6105 Section 5.1)

Implementation is the actual deployment of OpenStack services. Using Kolla-Ansible, this maps directly to Ansible playbook execution [8]:

1. **Bootstrap:** Configure host operating system (Docker, Python dependencies, kernel modules)
2. **Prechecks:** Validate all prerequisites (disk space, port availability, network configuration)
3. **Deploy:** Execute service deployment in dependency order
4. **Post-deploy:** Generate credentials, create initial resources, configure monitoring

Each step produces artifacts that are version-controlled:
- Configuration files (`globals.yml`, `inventory`, service-specific overrides)
- Deployment logs (timestamped, per-service)
- Verification results (per-service health checks)

### Process 6: Product Integration (SP-6105 Section 5.2)

Integration verifies that individual services work together. The integration sequence follows the dependency chain from Module 1 [9]:

```
INTEGRATION VERIFICATION SEQUENCE
================================================================

  Step 1: Keystone issues tokens ................ PASS / FAIL
  Step 2: Glance stores and retrieves images .... PASS / FAIL
  Step 3: Nova schedules and launches instance .. PASS / FAIL
  Step 4: Neutron provides networking to instance  PASS / FAIL
  Step 5: Cinder creates and attaches volume .... PASS / FAIL
  Step 6: Heat creates multi-resource stack ..... PASS / FAIL
  Step 7: Horizon displays all resources ........ PASS / FAIL
  Step 8: End-to-end: auth -> network -> instance
          -> volume -> floating IP -> access .... PASS / FAIL

  Gate: All 8 steps PASS required before proceeding to V&V
```

### Process 7: Product Verification (SP-6105 Section 5.3)

Verification answers the question: "Does the product conform to its requirements?" This uses the TAID methods detailed in Section 7 of this module [10].

### Process 8: Product Validation (SP-6105 Section 5.4)

Validation answers the different question: "Does the product meet the stakeholder's actual needs?" Verification can pass while validation fails -- a system that meets every written requirement but does not solve the user's actual problem has passed verification but failed validation [11].

Validation for a cloud deployment means putting real users on the platform under realistic conditions:
- Developers deploy actual applications, not test workloads
- Operators follow the documented procedures without the deployment team present
- The system runs under realistic load patterns for a sustained period

### Process 9: Product Transition (SP-6105 Section 5.5)

Transition hands the operational system from the deployment team to the operations team. This includes [12]:

- Operations documentation verified against the running system
- Runbook library indexed by task and by symptom
- Monitoring dashboards configured and alert thresholds tested
- Operator training completed (hands-on, not classroom)
- Operational Readiness Review (ORR) passed: "Can the ops team run this?"

---

## 4. Technical Management Processes (10-17)

These eight processes run continuously throughout the entire lifecycle. They are not phases -- they are concurrent activities [13].

| Process | SP-6105 Section | Cloud Application |
|---|---|---|
| 10. Technical Planning | 6.1 | Cloud Engineering Management Plan -- how we build and maintain this cloud |
| 11. Requirements Management | 6.2 | Track requirements changes, maintain traceability, manage scope creep |
| 12. Interface Management | 6.3 | Service API contracts, network interfaces, storage interfaces |
| 13. Risk Management | 6.4 | Risk register: hardware failure, network partition, security breach, data loss |
| 14. Configuration Management | 6.5 | Git-controlled configs, change control process, baseline management |
| 15. Data Management | 6.6 | Documentation standards, archive strategy, access control for docs |
| 16. Technical Assessment | 6.7 | Life-cycle reviews, progress tracking, health monitoring |
| 17. Decision Analysis | 6.8 | Formal decision records for every design trade-off |

**Process 14 (Configuration Management)** deserves special attention for cloud operations. Every configuration change must be [14]:

1. **Documented:** What changed and why (git commit message with rationale)
2. **Reviewed:** Peer review or automated policy check before merge
3. **Traceable:** Connected to a requirement or a defect report
4. **Reversible:** Rollback procedure documented and tested
5. **Baselined:** Known-good configurations tagged for recovery

---

## 5. Life-Cycle Reviews as Deployment Gates

NASA's life-cycle reviews (NPR 7123.1D Appendix G) define formal gates where progress is evaluated before proceeding. Each review has entrance criteria (what must exist to hold the review) and success criteria (what must be demonstrated to proceed) [15].

| NASA Review | Cloud Gate | Entrance Criteria | Success Criteria |
|---|---|---|---|
| MCR | Architecture Review | ConOps draft, hardware inventory | Architecture feasible for available hardware |
| SRR | Requirements Baseline | Complete requirements document, SEMP | Requirements complete, consistent, traceable |
| SDR | Design Decision Review | Trade studies complete | Design approach sound, alternatives documented |
| PDR | Configuration Review | Kolla-Ansible configs, V&V plan | Configs correct, interfaces defined, V&V plan ready |
| CDR | Pre-Deployment Review | Final configs, rollback procedures | Everything ready to deploy, rollback tested |
| SIR | Integration Test Review | All services deployed individually | All services work together, cross-service tests pass |
| ORR | Operations Handoff | Ops docs verified, team trained | Ops team can run the system independently |
| FRR | Production Go/No-Go | All prior gates passed | All systems nominal, all docs verified |
| PLAR | Post-Deployment Assessment | System running in production | System healthy, no deployment issues unresolved |

The key principle: **no gate is passed without evidence.** Verbal assurances are not evidence. Passing a gate requires documented artifacts that demonstrate the success criteria have been met [16].

---

## 6. NASA Document Types for Cloud Operations

### ConOps (Concept of Operations)

Source: SP-6105 Section 4.1, Appendix S

Written from the user's perspective, not the system's. The ConOps answers [17]:
- Who are the users? (developers, operators, security team)
- What do they do? (create projects, launch instances, configure networks)
- What are the operational scenarios? (normal ops, peak load, failure, incident, upgrade)
- How do users interact with the system? (Horizon, CLI, API, Heat templates)

### SEMP (Systems Engineering Management Plan)

Source: SP-6105 Section 6.1, Appendix J

Documents the engineering approach [18]:
- Technical approach (how we build and verify)
- Organizational structure (deployment crew, ops crew, doc crew)
- Process tailoring decisions (which SE processes we follow and how we scale them)
- Risk management approach
- Configuration management approach (git workflows, change control)
- Reviews and gates schedule
- Metrics (how we track progress)

### RVM (Requirements Verification Matrix)

Source: SP-6105 Appendix D

Every requirement gets a verification entry [19]:

```
REQUIREMENTS VERIFICATION MATRIX -- EXAMPLE ENTRY
================================================================

  Requirement: CLOUD-COMPUTE-001
    "The compute service shall support launching instances
     with at least 4 predefined flavors."

  Verification Method: Test + Inspection
    Test: Execute 'openstack flavor list' -- confirm >= 4 flavors
    Test: Execute 'openstack server create' with each flavor
    Inspection: Review nova.conf for flavor definitions

  Verification Phase: Phase D (Integration & Test)
  Acceptance Criteria: All 4 flavors create instances successfully
  Status: [PENDING / PASS / FAIL]
  Verified By: [agent role or manual verification]
  Date: [verification date]
```

---

## 7. Verification Methods: TAID

NASA defines four verification methods, collectively called TAID [20]:

### Test

Exercising the system under controlled conditions and comparing results to expected behavior.

| Cloud Application | Example |
|---|---|
| API functional test | `openstack token issue` returns valid token |
| Integration test | Create instance with network and volume, verify connectivity |
| Load test | Launch 20 instances simultaneously, measure scheduling latency |
| Security test | Attempt cross-tenant network access, verify isolation |
| Recovery test | Kill a service container, verify automatic restart |

### Analysis

Evaluating system characteristics through mathematical or statistical methods applied to data.

| Cloud Application | Example |
|---|---|
| Log analysis | Parse Keystone auth logs for failed attempts pattern |
| Performance analysis | Analyze Nova scheduling latency distribution |
| Capacity analysis | Project resource exhaustion timeline from usage trends |
| Security analysis | Review RBAC policies for privilege escalation paths |

### Inspection

Visual or physical examination of the system or its documentation.

| Cloud Application | Example |
|---|---|
| Configuration review | Verify globals.yml settings match design specifications |
| Certificate validation | Check TLS certificate chain, expiration dates, key lengths |
| Policy audit | Review Keystone policy.yaml for overly permissive rules |
| Network inspection | Verify OVS/OVN bridge configuration matches design |

### Demonstration

Operating the system to show it can perform its intended function in a realistic scenario.

| Cloud Application | Example |
|---|---|
| End-to-end scenario | Authenticate, create project, configure network, launch instance, attach storage, access via floating IP |
| Operator walkthrough | Ops team follows documented procedures without deployment team |
| Failover demonstration | Simulate compute node failure, verify instance migration |
| Upgrade demonstration | Perform minor version upgrade, verify zero data loss |

---

## 8. Requirements Traceability

Requirements traceability is the chain that connects stakeholder needs through requirements through design through implementation through verification [21].

```
TRACEABILITY CHAIN
================================================================

  Stakeholder Need: "Developers need on-demand compute resources"
         |
         v
  Requirement: CLOUD-COMPUTE-001
    "The compute service shall support launching instances
     with at least 4 predefined flavors."
         |
         v
  Design Decision: "Use Nova with KVM hypervisor, 4 standard flavors"
    Trade study: Nova KVM vs. Nova VMware vs. bare-metal
    Decision record: commit abc123
         |
         v
  Implementation: nova.conf + flavor definitions
    Git commit: def456 "Configure Nova flavors per CLOUD-COMPUTE-001"
         |
         v
  Verification: Test CF-SK-005
    "openstack flavor list shows 4 flavors"
    "openstack server create with each flavor succeeds"
    Result: PASS / FAIL
         |
         v
  Validation: Developer deploys real application
    "Application runs on m1.medium as expected"
    Result: PASS / FAIL
```

Every link in this chain must be documented and navigable. If a requirement changes, the traceability chain identifies every downstream artifact that needs updating -- design decisions, configurations, test procedures, and documentation [22].

---

## 9. Tailoring for Lab-Scale Infrastructure

NPR 7123.1D Section 2.2 requires that SE processes be tailored to the project's classification. Tailoring is not skipping -- it is deliberately scoping the formality to match the risk level [23].

Per SP-6105 Table 3.11-1, this project classifies as:

| Criterion | Classification | Rationale |
|---|---|---|
| Mission type | Type C-D (Small science/robotic) | Lab/development cloud, not life-critical |
| Priority | Medium | Infrastructure supporting learning and development |
| Acceptable risk | Medium-High | Lab environment, data loss acceptable with documented recovery |
| Complexity | Medium | Single-node deployment, 8 services, standard topology |
| Lifetime | Medium (2-5 years) | Lab cloud evolving through OpenStack releases |
| Cost | Low | Hardware already owned, open-source software only |

### Tailoring Decisions

| NASA Requirement | Tailored Application | Rationale |
|---|---|---|
| Formal independent review boards | GSD VERIFY agent + human-in-the-loop review | Appropriate for lab-scale, non-safety-critical |
| Standalone SEMP document | Integrated into Cloud Engineering Management Plan | SP-6105 Section 3.11.4.2 permits for smaller projects |
| Formal RID/RFA process | GSD issue tracking | Same information, lighter process |
| Hardware qualification testing | Hardware inventory + compatibility check | COTS hardware, no custom fabrication |
| Full ConOps with all appendices | Focused ConOps covering primary operational scenarios | Scoped per NPR 7123.1D Section 2.2 |
| Formal V&V with independent team | VERIFY agent independent from EXEC agents | Separation maintained, formality scaled |

All tailoring decisions are documented in the Compliance Matrix (NPR 7123.1D Appendix H format) [24].

---

## 10. The Compliance Matrix

The Compliance Matrix documents how each NPR 7123.1D requirement is addressed -- either applied as-is, tailored, or not applicable with justification [25].

```
COMPLIANCE MATRIX -- EXCERPT
================================================================

  NPR 7123.1D Section 3.2.1
  Requirement: "The program shall define stakeholder expectations"
  Compliance: APPLIED
  Evidence: ConOps document, stakeholder identification table
  Tailoring: None -- applied as written

  NPR 7123.1D Section 3.2.7
  Requirement: "The program shall verify products meet requirements"
  Compliance: TAILORED
  Evidence: V&V plan with TAID methods, VERIFY agent results
  Tailoring: Independent V&V team replaced by VERIFY agent
             with separation from EXEC agents
  Rationale: Lab-scale project, Type C-D classification

  NPR 7123.1D Section 3.2.14
  Requirement: "The program shall perform configuration management"
  Compliance: APPLIED
  Evidence: Git repository with change control, baseline tags
  Tailoring: None -- git provides superior CM to paper-based systems
```

---

## 11. Safety and Boundary Conditions

### Infrastructure Safety

| Condition | Action | Boundary Type |
|---|---|---|
| Deployment modifies host network configuration | Verify reversibility; document rollback before applying | GATE |
| Security credentials generated during deployment | Store in local-only directory; never in version control | ABSOLUTE |
| Service binds to external network interface | Default internal-only; require explicit human approval | GATE |
| Storage operation could destroy existing data | Require confirmation; verify backup exists first | GATE |
| Monitoring generates alerts | Alerts must have documented response runbooks | ANNOTATE |

### Documentation Safety

| Condition | Action | Boundary Type |
|---|---|---|
| Procedure describes destructive operation | Must include tested rollback section | ABSOLUTE |
| External URL referenced in documentation | Archive via Internet Archive | ANNOTATE |
| Runbook not verified against current system | Mark UNVERIFIED with last-known-good date | ANNOTATE |
| Documentation contradicts running configuration | Block publication; investigate discrepancy | GATE |

> **CAUTION:** The ABSOLUTE boundaries are non-negotiable regardless of project scale or tailoring level. Credentials in version control and destructive procedures without rollback are unacceptable at any classification level.

---

## 12. Cross-References

> **Related:** [OpenStack Architecture](01-openstack-architecture.md) -- the system being engineered with this methodology. [IaaS Self-Hosting & Ceph](03-iaas-self-hosting.md) -- storage design trade studies use Process 4 methodology. [Cloud Comparison & Sovereignty](05-cloud-comparison-sovereignty.md) -- decision analysis framework from Process 17.

**Series cross-references:**
- **GSD2 (GSD Methodology):** GSD's mission management architecture implements the SE Engine's crew structure
- **CMH (Command History):** Configuration management (Process 14) practices applied to infrastructure
- **ACE (Architecture Engineering):** Systems engineering principles at the architectural level
- **K8S (Kubernetes):** Container orchestration follows the same integration verification patterns
- **SYS (Systems Administration):** Operational procedures follow NASA procedure format standards
- **NND (Neural Network Design):** Requirements traceability patterns apply to ML pipeline verification
- **OCN (Ocean Computing):** Distributed systems verification uses TAID methods

---

## 13. Sources

1. NASA. "NASA Systems Engineering Processes and Requirements." NPR 7123.1D, 2020.
2. NASA. "NASA Systems Engineering Handbook." SP-2016-6105 Rev2, 2016.
3. NASA. "SP-6105 Rev2, Section 4.1: Stakeholder Expectations Definition." 2016.
4. NASA. "SP-6105 Rev2, Appendix S: Concept of Operations." 2016.
5. NASA. "SP-6105 Rev2, Section 4.2: Technical Requirements Definition." 2016.
6. NASA. "NPR 7123.1D, Section 3.2.3: Requirements Traceability." 2020.
7. NASA. "SP-6105 Rev2, Section 2.5: Trade Studies." 2016.
8. Kolla-Ansible Documentation. "Deployment Guide." docs.openstack.org/kolla-ansible/latest, 2024.
9. NASA. "SP-6105 Rev2, Section 5.2: Product Integration." 2016.
10. NASA. "SP-6105 Rev2, Section 5.3: Product Verification." 2016.
11. NASA. "SP-6105 Rev2, Section 5.4: Product Validation." 2016.
12. NASA. "SP-6105 Rev2, Section 5.5: Product Transition." 2016.
13. NASA. "SP-6105 Rev2, Chapter 6: Technical Management Processes." 2016.
14. NASA. "SP-6105 Rev2, Section 6.5: Configuration Management." 2016.
15. NASA. "NPR 7123.1D, Appendix G: Life-Cycle Reviews." 2020.
16. NASA. "NPR 7120.5F, Section 3.5: Life-Cycle Review Process." 2021.
17. NASA. "SP-6105 Rev2, Appendix S: Concept of Operations Template." 2016.
18. NASA. "SP-6105 Rev2, Appendix J: Systems Engineering Management Plan." 2016.
19. NASA. "SP-6105 Rev2, Appendix D: Requirements Verification Matrix." 2016.
20. NASA. "SP-6105 Rev2, Section 5.3.2: Verification Methods." 2016.
21. NASA. "NPR 7123.1D, Section 3.2.3: Requirements Traceability Requirements." 2020.
22. NASA. "NASA-HDBK-1009A, Systems Modeling Handbook for Systems Engineering." 2025.
23. NASA. "NPR 7123.1D, Section 2.2: Tailoring." 2020.
24. NASA. "NPR 7123.1D, Appendix H: Compliance Matrix Template." 2020.
25. NASA. "SP-2016-6105-SUPPL, Expanded Guidance for NASA Systems Engineering." 2016.

---

*OpenStack Cloud Platform -- Module 2: NASA SE Applied to Cloud Ops. Disciplined process is not bureaucracy. It is the infrastructure of trust -- the reason an operator can open a runbook at 3 AM and know that the procedure was verified against the system it describes.*
