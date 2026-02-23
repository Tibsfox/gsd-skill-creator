# Systems Administrator's Guide -- GSD OpenStack Cloud Platform (NASA SE Edition)

## 1. Introduction

This guide teaches cloud infrastructure operations through NASA's Systems Engineering (SE) methodology. Rather than presenting OpenStack as a collection of disconnected services to configure, it frames cloud deployment and operations as an engineering lifecycle -- the same disciplined process NASA applies to spacecraft, adapted for cloud infrastructure at lab scale.

The methodology draws from two primary NASA standards:

- **NASA/SP-2016-6105 Rev2** (NASA Systems Engineering Handbook) -- defines the SE Engine's 17 common technical processes organized into System Design, Product Realization, and Technical Management groups
- **NPR 7123.1D** (NASA Systems Engineering Processes and Requirements) -- establishes the lifecycle review gates, compliance requirements, and tailoring guidance that govern how SE processes are applied to projects of varying complexity

By mapping each NASA SE lifecycle phase to a corresponding stage of cloud deployment and operations, this guide produces documentation that is simultaneously educational (teaching SE methodology), operational (providing real procedures for a real cloud), and traceable (every requirement links to a stakeholder need, every test links to a requirement).

The target deployment is a single-node OpenStack cloud running 8 core services (Keystone, Nova, Neutron, Cinder, Glance, Swift, Heat, Horizon) deployed via Kolla-Ansible on CentOS Stream 9. This is classified as a Type C-D project per SP-6105 SS 3.11 -- lab-scale, medium complexity, non-safety-critical infrastructure. All NASA SE processes are tailored accordingly per NPR 7123.1 SS 2.2.

## 2. How to Use This Guide

This guide is organized as 7 chapters, each corresponding to one phase of the NASA SE lifecycle. The chapters are designed to be read in sequence for learning, but each chapter also stands alone as operational documentation for its phase.

**Sequential reading** takes you through the complete lifecycle: from concept studies (why build this cloud?) through technology selection, design, deployment, integration testing, operations, and eventual decommission. This path mirrors how NASA manages a mission from formulation through closeout.

**Reference use** lets you jump directly to the phase relevant to your current activity. If you are configuring Kolla-Ansible, go to Chapter 4 (Phase C -- Final Design and Fabrication). If you are troubleshooting a running cloud, go to Chapter 6 (Phase E -- Operations and Sustainment).

Each chapter contains:

- **Narrative sections** explaining the engineering rationale behind each activity
- **Procedures** following the OPS-{SERVICE}-{NUMBER} format with preconditions, steps, expected results, and rollback instructions
- **NASA SE cross-references** linking activities to specific SP-6105 sections and NPR 7123.1 requirements
- **Phase gate criteria** defining what must be true before proceeding to the next phase

## 3. Chapter Map

The following table maps each chapter to its NASA SE lifecycle phase, key activities, and the review gate that marks the transition to the next phase.

| Chapter | SE Phase | Title | Key Activities | Review Gate |
|---------|----------|-------|----------------|-------------|
| 1 | Pre-Phase A | Concept Studies | Stakeholder identification, feasibility assessment, ConOps, risk classification, MOEs | MCR (Cloud Architecture Review) |
| 2 | Phase A | Concept and Technology Development | Technology trade studies, system-level requirements, architecture definition, SEMP baseline | SRR (Requirements Baseline Review) |
| 3 | Phase B | Preliminary Design and Technology Completion | Service design specifications, interface definitions, network/storage/security design, V&V plan | PDR (Configuration Review) |
| 4 | Phase C | Final Design and Fabrication | Kolla-Ansible configuration, certificate generation, network/storage configuration, build procedures | CDR (Pre-Deployment Review) |
| 5 | Phase D | System Assembly, Integration, and Test | Service deployment, service-by-service verification, integration testing, performance baseline, security audit | SIR (Integration Test Review) |
| 6 | Phase E | Operations and Sustainment | Day-2 operations, monitoring/alerting, backup/recovery, upgrades, capacity planning, incident response | ORR (Operations Handoff Review) |
| 7 | Phase F | Closeout | Instance migration, data archive, service decommission, resource recovery, lessons learned | DR (Cloud Lifecycle Review) |

## 4. NASA SE Cross-References Summary

This guide references the following NASA standards throughout. Each chapter cites specific sections relevant to its phase.

### SP-6105 Rev2 -- NASA Systems Engineering Handbook

| Section | Topic | Chapters Using |
|---------|-------|----------------|
| SS 3.11 | Project Type Classification and Tailoring | 1, 2 |
| SS 4.1 | Stakeholder Expectations Definition | 1 |
| SS 4.2 | Technical Requirements Definition | 2 |
| SS 4.3 | Logical Decomposition | 3 |
| SS 4.4 | Design Solution Definition | 3 |
| SS 5.1 | Product Implementation | 4 |
| SS 5.2 | Product Integration | 5 |
| SS 5.3 | Product Verification (TAID Methods) | 3, 5 |
| SS 5.4 | Product Validation | 6 |
| SS 5.5 | Product Transition | 6 |
| SS 6.1 | Technical Planning | 2, 7 |
| SS 6.2 | Requirements Management | 2 |
| SS 6.3 | Interface Management | 3 |
| SS 6.4 | Technical Risk Management | 1 |
| SS 6.5 | Configuration Management | 4 |

### NPR 7123.1D -- SE Processes and Requirements

| Section | Topic | Chapters Using |
|---------|-------|----------------|
| SS 2.2 | Tailoring Guidance | 1, 2 |
| SS 4.1 | Pre-Phase A Requirements | 1 |
| SS 4.2 | Phase A Requirements | 2 |
| SS 4.3 | Phase B Requirements | 3 |
| SS 5.1 | Phase C Requirements | 4 |
| SS 5.2 | Phase D Requirements | 5 |
| SS 5.4 | Phase E Requirements | 6 |
| SS 6.1 | Phase F Requirements | 7 |
| Appendix G | Life-Cycle Review Criteria | All |
| Appendix H | Compliance Matrix Format | 3, 5 |

## 5. Conventions Used in This Guide

### Procedure Format

All operational procedures follow a standardized format:

```
PROCEDURE ID: OPS-{SERVICE}-{NUMBER}
TITLE: Descriptive title of what the procedure accomplishes
SE PHASE: The NASA SE phase this procedure belongs to
NPR REFERENCE: The NPR 7123.1 section governing this activity
LAST VERIFIED: Date verified against system version
```

Each procedure includes: Purpose, Preconditions, Safety Considerations, numbered Steps with expected results and failure handling, Verification, Rollback, and References sections.

### Requirement ID Format

Requirements use the format `CLOUD-{DOMAIN}-{NNN}` where:

- **DOMAIN** identifies the functional area (COMPUTE, NETWORK, STORAGE, IDENTITY, IMAGE, OBJECT, ORCHESTRATION, DASHBOARD, SYSTEM, SECURITY)
- **NNN** is a sequential three-digit number within each domain

Example: `CLOUD-COMPUTE-001` -- "The compute service shall support launching instances with at least 4 predefined flavors."

### SE Engine Process References

References to NASA SE Engine processes use the SS (subsection) notation from SP-6105:

- **SS 4.x** -- System Design Processes (1-4)
- **SS 5.x** -- Product Realization Processes (5-9)
- **SS 6.x** -- Technical Management Processes (10-17)

### TAID Verification Methods

Per SP-6105 SS 5.3, four verification methods are used throughout this guide:

| Method | Abbreviation | Application |
|--------|-------------|-------------|
| **Test** | T | Execute the system and observe results (API tests, integration tests, load tests) |
| **Analysis** | A | Review models, calculations, or data (log analysis, configuration analysis, capacity projections) |
| **Inspection** | I | Examine artifacts visually or via automation (config file review, certificate validation, RBAC audit) |
| **Demonstration** | D | Show operational capability in realistic scenarios (end-to-end user workflows, failure recovery) |

Requirements specify which TAID method(s) apply. Complex requirements may use multiple methods (e.g., T+I for a security requirement that needs both testing and inspection).

## 6. Prerequisites

### Hardware Requirements

This guide targets a single-node deployment with the following minimum hardware:

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| RAM | 32 GB | 64 GB |
| Disk | 100 GB free | 200 GB+ SSD |
| CPU | 4 cores | 8+ cores |
| Network | 1 NIC | 2+ NICs (management + tenant separation) |

### Software Prerequisites

| Component | Version | Purpose |
|-----------|---------|---------|
| CentOS Stream 9 | Latest | Base operating system |
| Kolla-Ansible | 2024.1 (Caracal) or later | Containerized OpenStack deployment engine |
| Docker / Podman | Latest stable | Container runtime for OpenStack services |
| Python | 3.9+ | Kolla-Ansible and OpenStack CLI |
| Ansible | 2.16+ (via kolla-ansible) | Configuration automation |
| Git | 2.39+ | Configuration version control |

### Network Prerequisites

The deployment requires at least one network interface. For production-like separation:

- **Management network** -- API endpoints, inter-service communication, administrative access
- **Tenant network** -- VM-to-VM traffic (VXLAN or VLAN)
- **External network** -- Floating IP access, external connectivity

A single-NIC deployment is supported using VLAN tagging or bridge-based network separation, though dedicated interfaces are recommended for performance isolation.

---

*This guide is part of the GSD OpenStack Cloud Platform (NASA SE Edition) educational documentation pack. All content traces to NASA/SP-2016-6105 Rev2 and NPR 7123.1D through explicit cross-references. Procedures are designed for verification against the running infrastructure using the doc-verifier framework.*
