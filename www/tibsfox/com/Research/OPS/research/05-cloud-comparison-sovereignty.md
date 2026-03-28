# Cloud Comparison & Digital Sovereignty

> **Domain:** Strategic Cloud Analysis and Decision Frameworks
> **Module:** 5 -- Primitive Translation, TCO Analysis, Managed vs. Self-Hosted, and the Open Infrastructure Commons
> **Through-line:** *The question is never "AWS or OpenStack?" The question is "What do you need to own, what can you rent, and what happens when the terms change?" Every cloud platform implements the same primitives -- compute, network, storage, identity. OpenStack makes those primitives visible. Managed clouds make them convenient. The choice between visibility and convenience is a sovereignty decision that should be made deliberately, not by default.*

---

## Table of Contents

1. [The Cloud Primitive Translation Table](#1-the-cloud-primitive-translation-table)
2. [Compute Primitives Compared](#2-compute-primitives-compared)
3. [Networking Primitives Compared](#3-networking-primitives-compared)
4. [Storage Primitives Compared](#4-storage-primitives-compared)
5. [Identity and Access Compared](#5-identity-and-access-compared)
6. [Orchestration Compared](#6-orchestration-compared)
7. [When Self-Hosted Makes Sense](#7-when-self-hosted-makes-sense)
8. [When Managed Cloud Makes Sense](#8-when-managed-cloud-makes-sense)
9. [TCO Analysis Framework](#9-tco-analysis-framework)
10. [OpenStack and Kubernetes: Complementary Layers](#10-openstack-and-kubernetes-complementary-layers)
11. [The GSD-OS Cloud Layer](#11-the-gsd-os-cloud-layer)
12. [Digital Sovereignty and the Open Infrastructure Commons](#12-digital-sovereignty-and-the-open-infrastructure-commons)
13. [Cross-References](#13-cross-references)
14. [Sources](#14-sources)

---

## 1. The Cloud Primitive Translation Table

This table is the cloud unit circle -- the evidence that understanding OpenStack means understanding all clouds. Every row represents a fundamental infrastructure primitive. Every column represents a different implementation of the same primitive [1].

| Primitive | OpenStack | AWS | GCP | Azure | Kubernetes |
|---|---|---|---|---|---|
| **Compute** | Nova | EC2 | Compute Engine | Virtual Machines | Pods/Deployments |
| **Network** | Neutron | VPC | VPC | Virtual Network | CNI/Services |
| **Block Storage** | Cinder | EBS | Persistent Disk | Managed Disks | PersistentVolumes |
| **Object Storage** | Swift | S3 | Cloud Storage | Blob Storage | -- (external) |
| **Identity** | Keystone | IAM | IAM | Entra ID | RBAC/ServiceAccounts |
| **Images** | Glance | AMIs | Images | VM Images | Container Images |
| **Orchestration** | Heat | CloudFormation | Deployment Mgr | ARM/Bicep | Helm/Operators |
| **Dashboard** | Horizon | Console | Console | Portal | Dashboard |
| **Load Balancing** | Octavia | ELB/ALB | Cloud LB | Load Balancer | Ingress/Services |
| **DNS** | Designate | Route 53 | Cloud DNS | Azure DNS | CoreDNS/ExternalDNS |
| **Secrets** | Barbican | Secrets Mgr | Secret Mgr | Key Vault | Secrets |
| **Telemetry** | Ceilometer | CloudWatch | Cloud Monitoring | Monitor | Prometheus |
| **Container Orch.** | Magnum/Zun | EKS | GKE | AKS | Native |
| **Bare Metal** | Ironic | Bare Metal | Bare Metal | Bare Metal | -- |
| **Shared Filesystem** | Manila | EFS | Filestore | Azure Files | NFS/CephFS CSI |
| **Message Queue** | Zaqar | SQS | Pub/Sub | Service Bus | -- (external) |

The pattern is unmistakable: every managed cloud service maps to an OpenStack project (or to a well-known open-source tool that OpenStack integrates). When AWS launches a new service, it is implementing a primitive that already has a name in the open infrastructure ecosystem [2].

---

## 2. Compute Primitives Compared

### Instance Types / Flavors

| Platform | Concept | Customizable | GPU Support | Bare Metal |
|---|---|---|---|---|
| OpenStack | Flavors (admin-defined) | Fully (admin creates any combination) | Via PCI passthrough | Via Ironic |
| AWS | Instance types (vendor-defined) | No (choose from menu) | Dedicated GPU types (P/G series) | Dedicated hosts |
| GCP | Machine types + custom | Partial (custom vCPU/RAM) | Dedicated GPU types (A2/N1) | Sole-tenant nodes |
| Azure | VM sizes (vendor-defined) | No (choose from menu) | NC/ND series | Dedicated hosts |

The fundamental difference: OpenStack operators define their own flavors tailored to their workloads. Managed cloud users choose from a vendor-defined menu. This is a trade-off between flexibility and simplicity [3].

### Scheduling and Placement

All platforms solve the same problem: given a request for compute resources, which physical host should run the workload?

| Platform | Scheduler | Placement Controls |
|---|---|---|
| OpenStack Nova | Filter + Weight scheduler | Availability zones, host aggregates, affinity/anti-affinity |
| AWS | Opaque | Availability zones, placement groups, dedicated hosts |
| GCP | Opaque | Zones, sole-tenant nodes, affinity |
| Kubernetes | kube-scheduler | Node selectors, affinity, taints/tolerations |

OpenStack's scheduling is fully transparent and configurable. Administrators can write custom filters and weights. Managed clouds provide placement controls but the underlying scheduler logic is proprietary [4].

---

## 3. Networking Primitives Compared

| Feature | OpenStack Neutron | AWS VPC | GCP VPC | Azure VNet |
|---|---|---|---|---|
| Overlay technology | VXLAN/Geneve/GRE | Proprietary | Andromeda SDN | Proprietary |
| Tenant isolation | VNI-based overlay | VPC boundary | VPC boundary | VNet boundary |
| Security groups | Stateful, port-level | Stateful, instance-level | Firewall rules | NSG (network-level) |
| Floating IPs | 1:1 NAT | Elastic IPs | Static external IPs | Public IPs |
| Load balancing | Octavia (LBaaS) | ELB/ALB/NLB | Cloud LB | Azure LB |
| DNS | Designate | Route 53 | Cloud DNS | Azure DNS |
| VPN | VPNaaS | Site-to-Site VPN | Cloud VPN | VPN Gateway |
| Peering | Router interfaces | VPC Peering | VPC Peering | VNet Peering |

The abstractions are identical because the networking problems are identical. Understanding Neutron's security groups means understanding AWS security groups -- the syntax differs but the semantics (stateful, port-level, default-deny ingress) are the same [5].

---

## 4. Storage Primitives Compared

### Block Storage

| Feature | OpenStack Cinder | AWS EBS | GCP PD | Azure Disks |
|---|---|---|---|---|
| Volume types | Admin-defined | Vendor-defined (gp3, io2, st1) | Standard, SSD, balanced | Standard, Premium, Ultra |
| Snapshots | Native | Native | Native | Native |
| Encryption | dm-crypt + Barbican | AES-256 + KMS | AES-256 + Cloud KMS | AES-256 + Key Vault |
| Multi-attach | Supported (limited) | Multi-attach (io1/io2) | Multi-writer | Shared disks |
| Max size | Backend-dependent | 64 TB | 64 TB | 64 TB |
| Backends | LVM, Ceph, NetApp, etc. | Proprietary | Proprietary | Proprietary |

### Object Storage

| Feature | OpenStack Swift | AWS S3 | GCP Cloud Storage | Azure Blob |
|---|---|---|---|---|
| API | Swift API + S3-compat (via RGW) | S3 | JSON/XML | REST |
| Consistency | Eventually consistent | Strong (since 2020) | Strong | Strong |
| Storage classes | Policies | Standard/IA/Glacier | Standard/Nearline/Coldline/Archive | Hot/Cool/Archive |
| Replication | Configurable (3x default) | Cross-region optional | Multi-region auto | Geo-redundant |
| Max object size | 5 GB (segmented unlimited) | 5 TB | 5 TB | 4.75 TB |

The translation is direct. An engineer who has implemented Cinder volume management understands EBS volume management. The API calls differ; the operational concepts are identical [6].

---

## 5. Identity and Access Compared

| Feature | OpenStack Keystone | AWS IAM | GCP IAM | Azure Entra ID |
|---|---|---|---|---|
| Hierarchy | Domain > Project > User | Account > OU > User | Org > Folder > Project | Tenant > Subscription > Resource Group |
| Authentication | Token-based (Fernet/JWS) | Signature-based (SigV4) | OAuth 2.0 | OAuth 2.0 / SAML |
| Default roles | admin, member, reader | No defaults (build your own) | Owner, Editor, Viewer | Owner, Contributor, Reader |
| Policy language | oslo.policy (YAML) | JSON policy documents | IAM conditions | RBAC + Conditions |
| Federation | SAML 2.0, OIDC | SAML, OIDC, AD | Google Workspace, OIDC | Native AD, SAML, OIDC |
| MFA | Via external IdP | Native TOTP/U2F | Native TOTP/U2F | Native TOTP/FIDO2 |

The fundamental pattern is universal: authenticate, authorize, scope access to resources within organizational boundaries. The three-role hierarchy (admin/member/reader) adopted by OpenStack in the Wallaby release mirrors the pattern every managed cloud converged on independently [7].

---

## 6. Orchestration Compared

| Feature | OpenStack Heat | AWS CloudFormation | Terraform | Kubernetes |
|---|---|---|---|---|
| Format | YAML (HOT) | JSON/YAML | HCL | YAML |
| Paradigm | Declarative | Declarative | Declarative | Declarative |
| State management | Stack stored in Heat DB | Stack stored in AWS | State file (local/remote) | etcd |
| Drift detection | Stack check | Drift detection | Plan + Apply | Reconciliation loop |
| Multi-cloud | OpenStack only | AWS only | Any provider | Container workloads |
| Rollback | Stack update rollback | Rollback on failure | Manual (state manipulation) | Rolling update strategy |

Heat's HOT format was directly inspired by AWS CloudFormation. A person who reads a HOT template can read a CloudFormation template with minimal adaptation. Terraform's HCL is a different syntax for the same declarative concept. Kubernetes manifests are declarative specifications of desired state -- the same pattern at a different abstraction layer [8].

---

## 7. When Self-Hosted Makes Sense

Self-hosted OpenStack is the right choice when [9]:

### Data Sovereignty Requirements

| Scenario | Why Self-Hosted |
|---|---|
| Government/defense data | Data must remain in specific jurisdiction, on controlled hardware |
| Healthcare (HIPAA) | Patient data requires physical control of storage media |
| Financial services | Regulatory requirements for data residency and audit trails |
| Research institutions | Sensitive research data, intellectual property protection |

### Predictable, Long-Running Workloads

A workload that runs 24/7 for years has a fundamentally different cost profile than a workload that scales up for hours and down for days.

**Example:** A 64-core, 256 GB RAM server running continuously:

| Model | Annual Cost (Approximate) |
|---|---|
| AWS EC2 (m6i.16xlarge, on-demand) | $53,000 |
| AWS EC2 (m6i.16xlarge, 3-year reserved) | $22,000 |
| Self-hosted (hardware amortized over 5 years) | $4,000 - $8,000 |

The break-even point for self-hosted compute is typically 18-24 months of continuous operation, depending on electricity costs, cooling requirements, and staff time [10].

### Knowledge Retention

Organizations that run on managed cloud services develop expertise in using those services -- but not in understanding the underlying infrastructure. When the vendor changes pricing, deprecates a service, or experiences an outage, the organization's response options are limited to what the vendor offers.

Self-hosting builds deep infrastructure knowledge:
- Networking: physical switches, VLAN configuration, routing
- Storage: disk management, RAID, replication, backup
- Security: TLS certificates, firewall rules, audit logging
- Troubleshooting: the ability to diagnose problems at any layer

---

## 8. When Managed Cloud Makes Sense

Managed cloud is the right choice when [11]:

### Variable, Unpredictable Workloads

| Scenario | Why Managed |
|---|---|
| Startup with uncertain growth | Scale to demand without hardware commitment |
| Seasonal peaks (retail, tax season) | Pay only during peak periods |
| Development and testing | Spin up/destroy environments rapidly |
| Disaster recovery site | Warm standby without idle hardware |

### Global Distribution

Deploying infrastructure across multiple continents requires data center presence in multiple regions. Managed cloud providers have this infrastructure; building it yourself is impractical for most organizations.

### Managed Service Expertise

Some managed services (ML training clusters, global CDN, managed databases) require operational expertise that most organizations cannot maintain in-house. The cost of the managed service includes the vendor's operational team, monitoring, patching, and availability guarantees.

### Limited Staff

Self-hosted infrastructure requires dedicated operations staff. An organization with two engineers cannot sustainably operate a self-hosted cloud alongside their primary work. The managed cloud's value proposition is paying for the operations team you cannot hire [12].

---

## 9. TCO Analysis Framework

Total Cost of Ownership analysis must include all costs, not just the obvious ones [13]:

### Self-Hosted TCO

| Category | Components | Amortization |
|---|---|---|
| Hardware | Servers, switches, storage, UPS, racks | 5 years |
| Facility | Power, cooling, floor space, physical security | Monthly |
| Software | OpenStack (free), OS licenses (free for CentOS/Ubuntu), monitoring tools | -- |
| Staff | Operations salary, training, on-call compensation | Annual |
| Downtime | Revenue loss during outages, SLA penalties | Per-incident |
| Upgrade | Hardware refresh cycle, migration labor | 3-5 years |

### Managed Cloud TCO

| Category | Components | Billing |
|---|---|---|
| Compute | Instance hours, reserved/spot pricing | Hourly/monthly |
| Storage | Provisioned GB, IOPS, throughput | Monthly |
| Network | Egress bandwidth (ingress typically free) | Per-GB |
| Managed services | Databases, load balancers, monitoring | Monthly |
| Staff | Cloud architects, FinOps, security | Annual |
| Vendor lock-in | Migration cost if switching providers | Exit event |

### Decision Matrix

| Factor | Weight | Self-Hosted Score (1-5) | Managed Score (1-5) |
|---|---|---|---|
| Data sovereignty | (org-specific) | 5 | 2 |
| Cost predictability | (org-specific) | 5 | 2 |
| Scaling speed | (org-specific) | 1 | 5 |
| Global distribution | (org-specific) | 1 | 5 |
| Operational knowledge | (org-specific) | 5 | 2 |
| Staff availability | (org-specific) | 2 | 5 |
| Managed services | (org-specific) | 2 | 5 |

The weights are organization-specific. There is no universal answer. The framework provides the structure; the organization provides the weights [14].

> **SAFETY WARNING:** TCO analyses that only compare compute costs are misleading. Managed cloud costs include egress bandwidth (which can be substantial for data-heavy workloads), managed service premiums, and the hidden cost of vendor lock-in (migration costs when switching). Self-hosted costs include staff time (which is expensive), physical security, and the risk of hardware failure without redundancy. An honest TCO analysis includes all categories.

---

## 10. OpenStack and Kubernetes: Complementary Layers

OpenStack and Kubernetes are not competitors. They operate at different abstraction layers and are frequently deployed together [15].

```
OPENSTACK + KUBERNETES -- COMPLEMENTARY LAYERS
================================================================

  Layer 4: Applications
    Containers, microservices, serverless functions
    Managed by: Kubernetes

  Layer 3: Container Orchestration
    Pod scheduling, service discovery, rolling updates
    Managed by: Kubernetes (running ON OpenStack)

  Layer 2: Infrastructure as a Service
    Virtual machines, networks, block storage
    Managed by: OpenStack

  Layer 1: Physical Infrastructure
    Servers, switches, disks, power
    Managed by: Operators (with OpenStack Ironic for bare-metal)
```

### Integration Patterns

| Pattern | Description |
|---|---|
| Kubernetes on OpenStack VMs | Kubernetes nodes are Nova instances. OpenStack provides IaaS, Kubernetes provides container orchestration. Most common pattern. |
| Kubernetes on bare metal via Ironic | OpenStack Ironic provisions physical servers, Kubernetes runs directly on hardware. Maximum performance, complex operations. |
| Magnum | OpenStack project that deploys and manages Kubernetes clusters as a service. Creates Kubernetes clusters on demand using Heat templates. |
| Cinder CSI driver | Kubernetes uses Cinder volumes as PersistentVolumes. Storage managed by OpenStack, consumed by Kubernetes. |
| Neutron CNI | Kubernetes networking uses Neutron as the CNI backend. Network policies map to Neutron security groups. |

The person who understands both OpenStack and Kubernetes understands the full stack from physical hardware through container workloads. This is the "explain what happens when you type `openstack server create`" competency from the success criteria -- extended to include "and then `kubectl apply`" [16].

---

## 11. The GSD-OS Cloud Layer

GSD-OS integrates with OpenStack as a management and educational platform. The cloud layer provides [17]:

### Mission Dashboard

Real-time visualization of cloud deployment status alongside GSD mission telemetry:
- Service health status (green/yellow/red per service)
- Agent activity (which GSD agents are working on which cloud operations)
- Phase progress (current NASA SE phase, next review gate)
- Resource consumption (token budget, context window utilization)

### Documentation Console

The educational pack rendered as a browsable reference:
- Systems Administrator's Guide (7 chapters, linked to current deployment state)
- Operations Manual (per-service procedures, verification status)
- Runbook Library (task-indexed and symptom-indexed, searchable)
- Reference Library (NASA docs, OpenStack docs, cross-cloud translation)

### Operational Interface

CAPCOM channel for human-in-the-loop decisions:
- Deployment approval gates (external network binding, credential generation)
- Configuration review before apply
- Alert acknowledgment and runbook selection
- Mission status updates and phase transitions

---

## 12. Digital Sovereignty and the Open Infrastructure Commons

### The Sovereignty Spectrum

Digital sovereignty exists on a spectrum, not as a binary [18]:

```
DIGITAL SOVEREIGNTY SPECTRUM
================================================================

  Full Vendor         Hybrid              Full Self-Hosted
  Dependency          Approach             Sovereignty
  |                     |                     |
  v                     v                     v
  +---------+     +-----------+     +-------------+
  | All      |    | Core on   |     | All infra   |
  | managed  |    | self-host,|     | self-hosted, |
  | cloud    |    | burst to  |     | open-source  |
  |          |    | managed   |     | only         |
  +---------+     +-----------+     +-------------+

  Examples:
  - Startup on AWS           - Enterprise with         - Government
  - Small business             private + public cloud    classified systems
  - Dev/test environments    - University research     - Air-gapped networks
                             - Mid-size company        - Critical infrastructure
```

### The Open Infrastructure Commons

OpenStack's significance extends beyond technology. It represents a commitment to the idea that infrastructure knowledge should be public [19].

NASA open-sourced Nebula because the code was created with public funds. The Open Infrastructure Foundation maintains OpenStack as a commons -- a shared resource that no single entity controls. When CERN runs OpenStack to manage physics research computing, the operational knowledge flows back into the community. When Deutsche Telekom runs OpenStack for telecommunications infrastructure, their improvements benefit every other deployer [20].

This is the same principle that produced the NASA Systems Engineering Handbook: knowledge created through collective effort toward shared understanding has a moral character that demands sharing. The SE Handbook is not classified. NPR 7123.1D is not behind a paywall. The LLIS (Lessons Learned Information System) is publicly searchable. OpenStack's source code, documentation, and operational guides follow the same principle [21].

### Vendor Lock-In Economics

The hidden cost of managed cloud is not the monthly bill -- it is the migration cost when the terms change [22]:

| Lock-In Factor | Cost to Migrate |
|---|---|
| Proprietary APIs | Rewrite all automation and integration code |
| Managed databases | Export, transform, import data (downtime) |
| Proprietary ML services | Retrain models on different frameworks |
| Network architecture | Redesign VPCs, security groups, routing |
| Operational knowledge | Retrain operations team on new platform |

OpenStack's open APIs mean that migration between OpenStack clouds is straightforward -- same APIs, same CLI tools, same operational procedures. Migration from OpenStack to a managed cloud (or vice versa) uses well-documented translation patterns because the primitives are the same [23].

---

## 13. Cross-References

> **Related:** [OpenStack Architecture](01-openstack-architecture.md) -- the primitives this module translates across platforms. [NASA SE Applied to Cloud Ops](02-nasa-se-cloud-ops.md) -- the decision analysis framework (Process 17) used for cloud strategy. [IaaS Self-Hosting & Ceph](03-iaas-self-hosting.md) -- the self-hosted storage economics underlying TCO analysis.

**Series cross-references:**
- **K8S (Kubernetes):** Complementary layer analysis, OpenStack + Kubernetes integration patterns
- **SYS (Systems Administration):** Physical infrastructure management for self-hosted deployments
- **GSD2 (GSD Methodology):** GSD-OS cloud layer integration, mission management for cloud operations
- **OCN (Ocean Computing):** Distributed computing sovereignty, data residency patterns
- **NND (Neural Network Design):** GPU compute cost comparison (self-hosted vs. cloud ML instances)
- **ACE (Architecture Engineering):** Strategic architecture decisions, trade study methodology
- **CMH (Command History):** Configuration portability across cloud platforms
- **MCF (Microservices):** Service deployment patterns across OpenStack and managed clouds

---

## 14. Sources

1. Open Infrastructure Foundation. "OpenStack Services and Their Equivalents." openinfra.dev/openstack, 2024.
2. Sefraoui, O., Aissaoui, M., Eleuldj, M. "OpenStack: Toward an Open-Source Solution for Cloud Computing." Int. J. Computer Applications, vol. 55, no. 3, 2012.
3. OpenStack Documentation. "Nova Flavors." docs.openstack.org/nova/latest/admin/flavors.html, 2024.
4. OpenStack Documentation. "Nova Scheduler Configuration." docs.openstack.org/nova/latest/admin/scheduling.html, 2024.
5. OpenStack Security Guide. "Networking Security." docs.openstack.org/security-guide/networking, 2024.
6. OpenStack Documentation. "Cinder Configuration." docs.openstack.org/cinder/latest/configuration, 2024.
7. OpenStack Documentation. "Keystone Default Roles." docs.openstack.org/keystone/latest/admin/service-api-protection.html, 2024.
8. OpenStack Documentation. "Heat Template Guide." docs.openstack.org/heat/latest/template_guide, 2024.
9. O'Reilly, C. and Creese, S. "Digital Sovereignty and Cloud Computing." Oxford Internet Institute, 2023.
10. Andreessen Horowitz. "The Cost of Cloud, a Trillion Dollar Paradox." a16z.com/the-cost-of-cloud, 2021.
11. Gartner. "Cloud Strategy Decision Framework." Gartner Research Report, 2024.
12. Open Infrastructure Foundation. "2024 User Survey -- Deployment Motivations." openinfra.dev/user-survey, 2024.
13. Flexera. "2024 State of the Cloud Report -- Cloud Cost Management." flexera.com, 2024.
14. NASA. "SP-6105 Rev2, Section 6.8: Decision Analysis." 2016.
15. Kubernetes Documentation. "Kubernetes on OpenStack." kubernetes.io/docs/setup/production-environment, 2024.
16. OpenStack Documentation. "Magnum User Guide." docs.openstack.org/magnum/latest/user, 2024.
17. GSD Skill Creator. "GSD-OS Desktop Vision." Internal vision document, 2026.
18. European Commission. "Digital Sovereignty: A Pillar of the EU's Digital Future." Digital Europe Programme, 2024.
19. Open Infrastructure Foundation. "Four Opens." openinfra.dev/four-opens, 2024.
20. CERN IT Department. "CERN Cloud Infrastructure Status Report." CERN-IT, 2023.
21. NASA. "Lessons Learned Information System." llis.nasa.gov, 2024.
22. Coyle, D. and Li, W. "The Economic Costs of Cloud Lock-In." Bennett Institute for Public Policy, Cambridge, 2023.
23. OpenStack Documentation. "OpenStack Migration Guide." docs.openstack.org/ops-guide/ops-customize-environment.html, 2024.

---

*OpenStack Cloud Platform -- Module 5: Cloud Comparison & Digital Sovereignty. The primitives are the same everywhere. The question is who controls them -- you, or a vendor whose interests may not align with yours when it matters most.*
