# Module 5: Compute & Science Platforms

**Domain:** Distributed Computing Infrastructure & Systems Engineering
**Module:** PSG-05
**Through-line:** *"In 2011, we could see how much additional computer processing the LHC was going to need, and equally, we could see that we are in a situation where both staff and budget are going to be flat. This meant that open source was an attractive solution."*

---

## Table of Contents

- [Overview](#overview)
- [CERN Computing Infrastructure](#cern-computing-infrastructure)
- [Worldwide LHC Computing Grid](#worldwide-lhc-computing-grid)
- [CERN OpenStack Deployment](#cern-openstack-deployment)
- [Ceph Distributed Storage](#ceph-distributed-storage)
- [Ceph in Research Context](#ceph-in-research-context)
- [NASA Systems Engineering](#nasa-systems-engineering)
- [Regional Cloud Presence](#regional-cloud-presence)
- [FoxCompute Electric City Thesis](#foxcompute-electric-city-thesis)
- [Open-Source Platform Comparison](#open-source-platform-comparison)
- [Design Reference for FoxCompute](#design-reference-for-foxcompute)
- [Cross-References](#cross-references)
- [Sources](#sources)

---

## Overview

The FoxCompute and FoxData layers described in the Fox Infrastructure Group master business plan require distributed infrastructure at a scale informed by organizations that have actually built it. This module documents three reference architectures: CERN's petabyte-scale OpenStack + Ceph deployment, the Worldwide LHC Computing Grid spanning 170 sites in 42 countries, and NASA's Systems Engineering methodology that the GSD ecosystem already implements. It also maps the regional cloud presence in the Puget Sound corridor and examines the FoxCompute Electric City thesis.

> The purpose is not to replicate CERN. It is to understand what world-class distributed infrastructure actually looks like in production so that FoxCompute design decisions are informed by evidence rather than aspiration.

---

## CERN Computing Infrastructure

### Scale Overview

CERN (the European Organization for Nuclear Research) operates one of the most ambitious computing infrastructures in the world, driven by the data processing needs of the Large Hadron Collider (LHC).

| Metric | Value |
|--------|-------|
| Computing Cores | ~300,000 |
| Annual Storage Growth | ~70 petabytes/year |
| Cloud Platform | OpenStack |
| Storage Backend | Ceph (50+ PB) |
| Data Generated (LHC) | ~1 petabyte/second during collisions |
| Data Retained | Filtered to ~1 GB/second for storage |
| Staff Constraint | Flat budget, flat headcount |
| Open Source Decision | 2011 -- cost-driven, not ideology-driven |

### Why CERN Matters for FoxCompute

CERN's infrastructure is relevant to FoxCompute not because of its scale (FoxCompute will not need 300,000 cores in its first decade) but because of how it was built. CERN faced the same constraint the Pacific Spine corridor faces: growing compute demand with limited budget and staff. Their solution -- open-source infrastructure (OpenStack + Ceph) operated by a small team -- is the design pattern FoxCompute must study.

> CERN's computing infrastructure runs on the same open-source platforms (OpenStack, Ceph) that FoxCompute proposes to use. The difference is scale, not architecture. CERN proves these platforms work at petabyte scale with flat staffing.

---

## Worldwide LHC Computing Grid

### Grid Architecture

The Worldwide LHC Computing Grid (WLCG) is the distributed computing infrastructure that processes data from the Large Hadron Collider. It represents the most successful implementation of federated computing in the world.

| Metric | Value |
|--------|-------|
| Computer Cores | ~1.4 million |
| Total Storage | ~1.5 exabytes |
| Sites | 170+ |
| Countries | 42 |
| Tasks/Day | 2+ million |
| Global Transfer Rate | 260+ GB/s |
| Operating Since | 2002 (production since 2008) |

### Tiered Architecture

The WLCG uses a tiered architecture that distributes compute and storage across levels of capability:

| Tier | Count | Function | Examples |
|------|-------|----------|----------|
| Tier 0 | 1 | Central hub at CERN; initial data reconstruction | CERN Data Centre |
| Tier 1 | 11 | National centers; permanent storage, reprocessing | FNAL (US), GridKA (DE), RAL (UK) |
| Tier 2 | ~140 | University/lab clusters; simulation, analysis | 160+ sites across 42 countries |
| Tier 3 | ~20 | Local workstation clusters; individual analysis | University departments |

### Federation Model

The WLCG federation model is the most important design reference for FoxCompute. It demonstrates that sovereign computing facilities -- each owned and operated by different national institutions -- can be federated into a coherent computational fabric through shared protocols and governance.

Key federation principles:
- **Sovereignty** -- each site owns and operates its own hardware
- **Interoperability** -- common middleware (gLite, ARC, DIRAC) enables cross-site job submission
- **Data locality** -- data is replicated to sites where it will be processed, minimizing transfer during computation
- **Governance** -- WLCG Collaboration Board sets policy; sites retain operational autonomy
- **Monitoring** -- centralized monitoring of distributed resources enables coordinated response

> 170 sites in 42 countries, each sovereign, all federated through shared protocol. This is the model for FoxCompute regional nodes: sovereign facilities connected through shared infrastructure, not a single centralized data center.

---

## CERN OpenStack Deployment

### Architecture

CERN's OpenStack deployment is described as one of the most ambitious open cloud deployments in the world. It manages approximately 300,000 computing cores through a single OpenStack control plane.

| Component | Role | Scale |
|-----------|------|-------|
| OpenStack Nova | Compute scheduling | 300,000 cores |
| OpenStack Cinder | Block storage | Backed by Ceph |
| OpenStack Neutron | Network management | SDN across data center |
| OpenStack Keystone | Identity and access | CERN SSO integrated |
| OpenStack Heat | Orchestration | Automated provisioning |
| OpenStack Ironic | Bare-metal provisioning | HPC workloads |

### Why OpenStack

CERN selected OpenStack in 2011 for a pragmatic reason: cost. The quote from CERN IT leadership is the clearest statement of the rationale:

> "In 2011, we could see how much additional computer processing the LHC was going to need, and equally, we could see that we are in a situation where both staff and budget are going to be flat. This meant that open source was an attractive solution."

This is not ideology. It is arithmetic. When your compute demand is growing at 70 PB/year and your budget is flat, the only viable path is software that does not carry per-core licensing fees.

### Operational Reality

CERN's OpenStack deployment runs in production 24/7, processing physics data that cannot be recreated. The stakes are real: if the computing infrastructure fails during a data-taking run, the data from those collisions is lost permanently. This operational pressure means CERN's deployment practices -- rolling upgrades, canary testing, automated failover -- represent battle-tested patterns for mission-critical OpenStack operations.

---

## Ceph Distributed Storage

### Architecture

Ceph is a distributed storage system that provides object, block, and file storage from a single unified cluster. CERN's Ceph deployment is one of the largest in the world.

| Metric | Value |
|--------|-------|
| Total Capacity | 50+ petabytes |
| Cluster Count | 10+ separate clusters |
| Use Cases | Cloud (OpenStack Cinder), Kubernetes, HPC |
| Backend For | OpenStack block storage, XRootD storage element |
| Hardware Requirement | Commodity servers, no proprietary storage arrays |
| Replication | 3x replication or erasure coding |
| Self-Healing | Automatic rebalancing when nodes fail or are added |

### CRUSH Algorithm

Ceph's placement algorithm (CRUSH -- Controlled Replication Under Scalable Hashing) determines where data is stored without requiring a central lookup table. This means Ceph clusters can scale to thousands of nodes without a metadata bottleneck -- the placement algorithm is computed locally by every client.

### Key Properties

| Property | Description | FoxCompute Relevance |
|----------|-------------|---------------------|
| Hardware-neutral | Runs on commodity x86 servers | No vendor lock-in |
| Fault-tolerant | Automatic recovery from node failure | Disaster resilience |
| Infinitely scalable | No architectural ceiling on cluster size | Growth without redesign |
| Inexpensive | No licensing fees, commodity hardware | Flat-budget compatible |
| Flexible | Object, block, and file interfaces | Multiple workload types |

---

## Ceph in Research Context

### Active Deployments Beyond CERN

Ceph has been adopted by research institutions worldwide for workloads that require scalable, reliable storage without proprietary vendor dependencies.

| Organization | Use Case | Scale | Notes |
|-------------|----------|-------|-------|
| CERN | Particle physics data | 50+ PB | Largest open-source Ceph deployment |
| Immunity Bio | Cancer research (genomics) | 1 TB per genetic test | High-throughput data pipeline |
| Human Brain Project | Neuroscience simulation | Mixed workloads | Next-gen execution platform |
| MeerKAT Radio Telescope | Radio astronomy | 20 PB object storage | South Africa, SKA precursor |

### Characteristics That Drive Adoption

Scientific Computing World characterizes Ceph as: flexible, inexpensive, fault-tolerant, hardware-neutral, and infinitely scalable. These five properties explain why research institutions -- which typically have large data volumes, limited budgets, and long equipment lifecycles -- consistently choose Ceph over proprietary storage.

> Every property that makes Ceph suitable for CERN (flexible, inexpensive, fault-tolerant, hardware-neutral, scalable) also makes it suitable for FoxCompute. The architecture is the same. The scale is different.

---

## NASA Systems Engineering

### The V-Model

NASA's Systems Engineering Handbook established the V-model: requirements flow down the left side of the V, implementation occurs at the bottom, and verification flows up the right side. Each level of requirements has a corresponding level of verification.

```
REQUIREMENTS                              VERIFICATION
     |                                         |
     v                                         ^
  System Requirements  <----------->  System Verification
     |                                         |
     v                                         ^
  Subsystem Requirements  <------->  Subsystem Verification
     |                                         |
     v                                         ^
  Component Requirements  <------->  Component Verification
     |                                         |
     v                                         ^
  IMPLEMENTATION (build, code, integrate)
```

### NASA SE Practices in GSD

The GSD mission control pattern directly implements NASA Systems Engineering practices:

| NASA SE Practice | GSD Implementation |
|-----------------|-------------------|
| Requirements decomposition | Mission package: vision -> research -> milestones |
| V-model verification | Test plan with safety-critical, core, integration, edge categories |
| Configuration management | Git-based state tracking, atomic commits |
| Formal review gates | Wave boundaries with go/no-go decisions |
| 3-level planning | Vision (L1) -> Research (L2) -> Tasks (L3) |
| Risk management | Safety-critical tests block deployment |
| Audit trail | Chronicle agent, commit history, milestone summaries |

### The Quark and the Compiler

The GSD ecosystem's essay "The Quark and the Compiler" documents how NASA's systems engineering methodology migrated from aerospace into software engineering and became the backbone of serious development methodology. This migration path -- aerospace to software -- is the same path the Pacific Spine corridor traces: Boeing's manufacturing discipline informing FoxCompute's infrastructure design.

> NASA's 3-level planning works reliably. The GSD ecosystem uses it for every mission. The Pacific Spine Ground Truth mission itself was planned using this methodology.

---

## Regional Cloud Presence

### Puget Sound Corridor

The Puget Sound region hosts three of the world's largest cloud providers, creating a unique concentration of cloud computing expertise and infrastructure.

| Provider | HQ Distance from Paine Field | Key Facilities |
|----------|------------------------------|----------------|
| Amazon Web Services (AWS) | ~30 miles (Seattle) | Puget Sound offices, US-West-2 region |
| Microsoft Azure | ~30 miles (Redmond) | Global HQ, Azure engineering |
| Google Cloud | ~35 miles (Kirkland) | Engineering offices, cloud services |

### Workforce Implications

The proximity of three hyperscale cloud providers means the Puget Sound region has the highest concentration of cloud infrastructure engineers in the world. This talent pool is both an opportunity (potential hires for FoxCompute) and a competitive challenge (salary expectations set by FAANG compensation).

### Amazon Regional Presence

Amazon's presence in Snohomish County extends beyond AWS. The company operates fulfillment centers in Arlington and other locations, demonstrating that large-scale logistics and computing operations are viable in the county.

---

## FoxCompute Electric City Thesis

### Grand Coulee and Hydroelectric Power

The FoxCompute Electric City thesis proposes leveraging Grand Coulee Dam hydroelectric power for compute operations. Grand Coulee is the largest hydroelectric facility in the United States, with a nameplate capacity of 6,809 MW.

| Metric | Value |
|--------|-------|
| Dam | Grand Coulee |
| Location | Columbia River, Grant County, WA |
| Nameplate Capacity | 6,809 MW |
| Average Annual Generation | ~21 TWh |
| Power Cost | Among lowest in the U.S. |
| Distance to Everett | ~180 miles |

### Colville Tribes Governance

The Grand Coulee Dam sits on the Columbia River at the southern boundary of the Colville Reservation. The Colville Confederated Tribes have sovereign governance over reservation lands. The FoxCompute Electric City thesis proposes that compute facilities near Grand Coulee would operate under Colville Tribes governance, creating economic opportunity within the tribal sovereignty framework.

> Hydroelectric power at the source. Tribal sovereignty governance. Open-source infrastructure (OpenStack + Ceph). The FoxCompute Electric City thesis combines the cheapest clean energy in the region with the governance model that keeps economic benefit local.

### Why Hydroelectric for Compute

| Factor | Hydroelectric Advantage |
|--------|------------------------|
| Cost | $0.02-0.04/kWh vs. $0.10-0.15/kWh grid average |
| Carbon | Zero operational emissions |
| Reliability | 95%+ availability, baseload power |
| Scale | 6,809 MW capacity (enough for any data center) |
| Cooling | Columbia River water available for cooling |

---

## Open-Source Platform Comparison

### Infrastructure Options for FoxCompute

| Platform | Type | License | CERN-Validated | Community |
|----------|------|---------|----------------|-----------|
| OpenStack | Cloud management | Apache 2.0 | Yes (300K cores) | Large, enterprise-backed |
| Ceph | Distributed storage | LGPL 2.1/3.0 | Yes (50+ PB) | Large, Red Hat-backed |
| Kubernetes | Container orchestration | Apache 2.0 | Yes (CERN k8s) | Massive, CNCF-governed |
| Prometheus | Monitoring | Apache 2.0 | Common in research | Large, CNCF-graduated |
| Grafana | Visualization | AGPL 3.0 | Common in research | Large, commercial + OSS |

### Stack Recommendation Pattern

Based on CERN's validated architecture:

```
APPLICATION LAYER
  Kubernetes (container orchestration)
  |
COMPUTE LAYER
  OpenStack Nova (VM scheduling)
  OpenStack Ironic (bare-metal for HPC)
  |
STORAGE LAYER
  Ceph (object, block, file storage)
  |
NETWORK LAYER
  OpenStack Neutron (SDN)
  |
MONITORING LAYER
  Prometheus + Grafana
  |
IDENTITY LAYER
  OpenStack Keystone (authentication)
```

---

## Design Reference for FoxCompute

### Lessons from CERN

1. **Start with OpenStack + Ceph** -- CERN proved these work at scale with flat staffing
2. **Design for federation** -- WLCG shows sovereign nodes can be coordinated through shared protocol
3. **Commodity hardware** -- No proprietary storage arrays or compute blades
4. **Automate everything** -- CERN's small team manages 300K cores through automation, not manual operations
5. **Plan for 10x growth** -- Architecture must scale without redesign
6. **Open source is not free** -- It requires engineering investment in operations, not licensing fees

### FoxCompute Phase 1 Sizing

| Parameter | Minimum Viable | Growth Target |
|-----------|---------------|---------------|
| Compute Cores | 500-1,000 | 5,000-10,000 |
| Storage (Ceph) | 500 TB | 5 PB |
| Network | 25 GbE fabric | 100 GbE fabric |
| Locations | 1 (Electric City pilot) | 3+ corridor nodes |
| Staff | 2-3 engineers | 5-8 engineers |
| Power Source | Grand Coulee hydro | Hydro + solar |

---

## Cross-References

- **OCN (Open Compute)** -- The Open Compute Project's hardware designs documented in OCN provide the server specifications FoxCompute should use; open hardware + open software
- **GSD2 (GSD-2 Architecture)** -- GSD-2's extension system mirrors CERN's modular OpenStack deployment; pluggable components coordinated through shared protocol
- **CMH (Comp Mesh)** -- Mesh networking documented in CMH provides the connectivity layer between FoxCompute nodes; Ceph replication requires reliable inter-site networking
- **HGE (Hydro-Geothermal)** -- Grand Coulee hydroelectric power is the energy foundation for the Electric City thesis; HGE documents the full hydroelectric infrastructure
- **SYS (Systems Admin)** -- Every operations practice documented in SYS (monitoring, alerting, capacity planning) applies to FoxCompute operations
- **THE (Thermal Energy)** -- Data center cooling is the primary operational challenge for compute facilities; thermal management documented in THE applies directly
- **BPS (Bio-Physics)** -- Ceph's use at Immunity Bio for genomic data (1 TB per test) demonstrates the intersection of compute platforms and biological research

---

## Sources

1. CERN IT Department -- Computing infrastructure documentation, core counts, storage capacity
2. DCD (Data Centre Dynamics) -- CERN OpenStack deployment analysis, "one of the most ambitious open cloud deployments"
3. CERN IT interview via DCD -- OpenStack cost rationale quote (2011 decision)
4. CERN Worldwide LHC Computing Grid documentation -- Grid architecture, tier structure, capacity figures
5. NERSC Data Seminars / Dan van der Ster, CERN -- Ceph deployment details (10+ clusters, 50+ PB)
6. Scientific Computing World, 2020 -- Ceph research deployments (Immunity Bio, Human Brain Project, MeerKAT)
7. NASA Systems Engineering Handbook -- V-model methodology, review gates, configuration management
8. GSD ecosystem documentation -- "The Quark and the Compiler" essay, NASA SE implementation
9. Wikipedia / multiple sources -- Grand Coulee Dam capacity (6,809 MW), location
10. Colville Confederated Tribes -- Sovereignty and governance context
11. AWS / Microsoft / Google -- Regional presence, headquarters locations
