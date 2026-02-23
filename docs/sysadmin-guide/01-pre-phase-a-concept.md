# Chapter 1: Concept Studies -- What Are We Building and Why?

**SE Phase:** Pre-Phase A | **SP-6105 SS 4.1** | **NPR 7123.1 SS 4.1** | **Review Gate:** MCR (Cloud Architecture Review)

---

This chapter maps to NASA's Pre-Phase A: Concept Studies. Before any configuration file is written or any service is deployed, we establish the foundational understanding of what this cloud is, who it serves, whether the available hardware can support it, and what risks we accept. Per SP-6105 SS 4.1, this phase produces the Concept of Operations (ConOps), stakeholder register, feasibility assessment, and risk classification that anchor every subsequent engineering decision.

The parallel to spacecraft development is deliberate: NASA does not begin building hardware until the mission concept is understood, the stakeholders are identified, the feasibility is confirmed, and the risk posture is documented. We apply the same discipline to cloud infrastructure.

## 1. Cloud Architecture Overview (The ConOps)

Per SP-6105 SS 4.1 and Appendix S, the Concept of Operations describes how the system will be used operationally, written from the user's perspective rather than the system's perspective. For this cloud deployment, the ConOps answers: what does this cloud do, and how do people interact with it?

### 1.1 System Purpose

The GSD OpenStack Cloud Platform is a single-node cloud environment providing Infrastructure-as-a-Service (IaaS) capabilities. It delivers compute, networking, block storage, object storage, image management, orchestration, and dashboard services through a unified identity framework. The platform serves as both a functional infrastructure environment and an educational reference implementation.

### 1.2 Core Services

The cloud operates 8 core OpenStack services, each mapping to a fundamental cloud primitive:

| Service | Cloud Primitive | Function |
|---------|----------------|----------|
| **Keystone** | Identity | Authentication, authorization, service catalog, RBAC policy, Fernet token management |
| **Nova** | Compute | Instance lifecycle management, scheduling, flavor definitions, hypervisor management |
| **Neutron** | Networking | Software-defined networking, security groups, floating IPs, DHCP, DNS |
| **Cinder** | Block Storage | Persistent volumes, snapshots, volume types, LVM backend management |
| **Glance** | Image | Image registry, format conversion (qcow2, raw, vmdk), metadata management |
| **Swift** | Object Storage | Object containers, ACL management, ring-based data distribution |
| **Heat** | Orchestration | HOT template processing, stack lifecycle, auto-scaling groups |
| **Horizon** | Dashboard | Web-based management console, project and user administration |

### 1.3 Operational Scenarios

Per SP-6105 SS 4.1, the ConOps must describe operational scenarios. The primary scenarios for this cloud are:

**Normal Operations:**
- User authenticates via Keystone, receives scoped token
- User creates a project, configures networking (subnet, router, security groups)
- User launches instances from Glance images using Nova
- User attaches Cinder volumes for persistent storage
- User accesses instances via floating IPs through Neutron
- User deploys multi-service stacks via Heat templates

**Maintenance Operations:**
- Operator performs scheduled service restarts via Kolla-Ansible
- Operator applies configuration changes through version-controlled globals.yml
- Operator executes backup procedures for databases and volumes
- Operator performs OpenStack version upgrades through Kolla-Ansible reconfigure/upgrade

**Off-Nominal Operations:**
- Service failure: Kolla-Ansible restart of individual containerized service
- Network disruption: OVS/OVN bridge repair, DHCP agent restart
- Storage failure: LVM volume recovery, Cinder service restart
- Authentication failure: Keystone Fernet key rotation, token cache flush

## 2. Stakeholder Identification

Per SP-6105 SS 4.1, stakeholder identification is the first step in the SE Engine's Process 1 (Stakeholder Expectations Definition). NPR 7123.1 SS 4.1 requires that all stakeholders be identified and engaged before requirements are defined.

### 2.1 Stakeholder Register

| Stakeholder | Role | Primary Concerns | Service Level Expectations |
|-------------|------|------------------|---------------------------|
| **Developers** | Deploy applications, manage instances | Instance availability, network connectivity, storage reliability | Instance launch within 30 seconds, API response under 2 seconds, persistent storage across reboots |
| **Operators** | Maintain infrastructure, perform upgrades | Service health, monitoring coverage, documented procedures | 99.9% API availability, clear runbooks, predictable upgrade path |
| **Security Team** | Monitor threats, enforce policy | RBAC enforcement, network isolation, certificate management | No unauthorized access, TLS on all endpoints, audit logging enabled |
| **Management** | Oversight, resource allocation | Capacity utilization, cost efficiency, compliance | Capacity reports, resource accounting, compliance documentation |

### 2.2 Service Level Expectations

Each stakeholder's expectations are captured as Needs, Goals, and Objectives (NGOs) per SP-6105 SS 4.1:

**Developers:**
- Need: Reliable compute and storage for application workloads
- Goal: Self-service provisioning without operator intervention for routine tasks
- Objective: Launch-to-ready time under 30 seconds for standard flavors

**Operators:**
- Need: Observable, maintainable infrastructure with documented procedures
- Goal: Zero-downtime maintenance windows using rolling restarts
- Objective: All operational procedures verified against the running system

**Security Team:**
- Need: Enforced isolation between projects and authenticated access to all services
- Goal: Continuous security posture assessment with automated checks
- Objective: No critical security findings in quarterly audits

**Management:**
- Need: Accountability for resource consumption and compliance with documented standards
- Goal: Traceable requirements from stakeholder needs through implementation to verification
- Objective: Complete requirements verification matrix with all entries in PASS state

## 3. Feasibility Assessment

Per SP-6105 SS 4.1, feasibility assessment determines whether the proposed system concept can be realized with available resources. For cloud infrastructure, this means confirming that the available hardware can support the intended service set.

### 3.1 Hardware Inventory Requirements

The following minimum hardware is required for a single-node deployment running all 8 core services:

| Resource | Minimum Required | Purpose |
|----------|-----------------|---------|
| **RAM** | 32 GB | ~20 GB for OpenStack service containers, ~8 GB for VM instances, ~4 GB for OS and overhead |
| **Disk** | 100 GB free | ~30 GB for container images, ~20 GB for Glance images, ~30 GB for Cinder volumes, ~20 GB for logs/databases |
| **CPU** | 4 cores | Service containers, hypervisor scheduling, network processing |
| **Network** | 1 NIC minimum | Management, tenant, and external traffic (VLAN-separated on single NIC) |

### 3.2 Hardware Inventory Procedure

Before proceeding beyond Pre-Phase A, the following inventory must be completed:

```bash
# Memory check -- verify at least 32 GB
free -g | awk '/^Mem:/{print "Total RAM: "$2" GB"}'

# Disk check -- verify at least 100 GB free
df -h / | awk 'NR==2{print "Root partition free: "$4}'

# CPU check -- verify at least 4 cores
nproc --all | xargs -I{} echo "CPU cores: {}"

# Network check -- list available interfaces
ip -br link show | grep -v lo
```

### 3.3 Network Requirements

The deployment requires network infrastructure supporting three traffic domains:

| Network | CIDR (Example) | Purpose | Isolation Method |
|---------|----------------|---------|-----------------|
| **Management** | 10.0.0.0/24 | API endpoints, inter-service communication, administrative SSH | Physical NIC or VLAN tag |
| **Tenant** | 10.0.1.0/24 | VM-to-VM traffic, VXLAN tunnels, DHCP | VXLAN encapsulation |
| **External** | 192.168.1.0/24 | Floating IP allocation, external connectivity | Bridge to physical network |

For single-NIC deployments, all three networks can share one interface using Linux bridges and VXLAN encapsulation, though this reduces throughput isolation.

### 3.4 Resource Sufficiency Checks

Per the feasibility assessment, the following checks must all pass:

| Check | Command | Pass Criteria |
|-------|---------|---------------|
| RAM sufficiency | `free -g \| awk '/^Mem:/{print $2}'` | Output >= 32 |
| Disk sufficiency | `df --output=avail / \| tail -1` | Output >= 100G (in KB) |
| CPU sufficiency | `nproc --all` | Output >= 4 |
| Virtualization support | `grep -c 'vmx\|svm' /proc/cpuinfo` | Output > 0 |
| Network interface | `ip -br link show \| grep -v lo \| wc -l` | Output >= 1 |

## 4. Risk Classification

Per SP-6105 SS 3.11, Table 3.11-1, every project must be classified by type to determine the appropriate level of SE rigor. This classification drives all tailoring decisions per NPR 7123.1 SS 2.2.

### 4.1 Project Type Classification

| Criterion | NASA Classification | Cloud Equivalent | Rationale |
|-----------|-------------------|------------------|-----------|
| Mission type | Type C-D | Lab/development cloud | Non-safety-critical, no life-critical dependencies |
| Priority | Medium | Infrastructure supporting learning and development | Important but not mission-critical |
| Acceptable risk | Medium-High | Lab environment with documented recovery | Data loss acceptable with recovery procedures |
| Complexity | Medium | Single-node, 8 services, standard topology | Significant service count but well-understood architecture |
| Lifetime | Medium (2-5 years) | Evolves through OpenStack releases | Upgraded rather than replaced |
| Cost | Low | COTS hardware, open-source software | No custom hardware or licensed software |

### 4.2 Tailoring Rationale

Based on the Type C-D classification, the following tailoring decisions are made per NPR 7123.1 SS 2.2 and SP-6105 SS 3.11.4.2:

| NASA Full Requirement | Tailored Approach | Rationale |
|-----------------------|-------------------|-----------|
| Formal independent review boards | GSD VERIFY agent + human-in-the-loop review | Appropriate rigor for lab-scale infrastructure; separation of verification from execution maintained |
| Standalone SEMP document | Integrated Cloud Engineering Management Plan in git | SP-6105 SS 3.11.4.2 permits integration for smaller projects |
| Formal RID/RFA process | GSD issue tracking in .planning/ directory | Same information captured with lighter process weight |
| Hardware qualification testing | Hardware inventory + compatibility verification | COTS hardware requires no custom qualification |
| Full ConOps with all appendices | Focused ConOps covering primary operational scenarios | Tailored scope per NPR 7123.1 SS 2.2 |
| Formal V&V with independent V&V team | VERIFY agent independent from EXEC agents | Agent separation provides independence; formality scaled to risk |

All tailoring decisions are documented in the Compliance Matrix (NPR 7123.1 Appendix H format) maintained alongside this guide.

### 4.3 Risk Register (Initial)

Per SP-6105 SS 6.4 (Technical Risk Management), initial risks are identified during Pre-Phase A:

| Risk ID | Risk | Likelihood | Impact | Mitigation |
|---------|------|-----------|--------|------------|
| R-001 | Hardware insufficient for all 8 services | Low | High | Feasibility assessment with resource sufficiency checks (Section 3.4) |
| R-002 | Network configuration conflicts with host | Medium | Medium | Isolated management network, documented rollback procedures |
| R-003 | Service interdependency failure cascade | Medium | High | Dependency-ordered deployment, per-service health checks |
| R-004 | Storage backend data loss | Low | High | LVM snapshots, documented backup/recovery procedures |
| R-005 | Security misconfiguration exposing services | Medium | High | TLS by default, RBAC enforcement, security audit checklist |

## 5. Measures of Effectiveness

Per SP-6105 SS 4.1, Measures of Effectiveness (MOEs) define what success looks like for this system. MOEs are quantitative where possible and trace directly to stakeholder expectations (Section 2).

### 5.1 Performance MOEs

| MOE ID | Measure | Target | Verification Method | Stakeholder |
|--------|---------|--------|--------------------| ------------|
| MOE-001 | Instance launch time (request to ACTIVE) | < 30 seconds | Test (T): Timed `openstack server create` | Developers |
| MOE-002 | API availability (Keystone token issue) | > 99.9% uptime | Test (T): Periodic health check over 30-day window | Operators |
| MOE-003 | Block storage IOPS (4K random read) | > 1000 IOPS | Test (T): `fio` benchmark on Cinder volume | Developers |
| MOE-004 | API response time (list operations) | < 2 seconds | Test (T): Timed `openstack server list` | Developers |
| MOE-005 | Network throughput (VM-to-VM) | > 1 Gbps | Test (T): `iperf3` between instances | Developers |

### 5.2 Operational MOEs

| MOE ID | Measure | Target | Verification Method | Stakeholder |
|--------|---------|--------|--------------------| ------------|
| MOE-006 | Mean time to restore service | < 5 minutes | Demonstration (D): Simulated service failure and recovery | Operators |
| MOE-007 | Procedure verification coverage | 100% of published procedures | Inspection (I): doc-verifier scan | Operators |
| MOE-008 | Security audit pass rate | Zero critical findings | Inspection (I): Security checklist review | Security Team |
| MOE-009 | Requirements traceability completeness | Every requirement has verification | Inspection (I): Verification matrix review | Management |

## 6. Phase Gate Criteria -- MCR (Cloud Architecture Review)

Per NPR 7123.1 Appendix G, the Mission Concept Review (MCR) evaluates whether the project concept is feasible and whether the project is ready to proceed to technology development. In cloud operations terms, this is the Cloud Architecture Review.

### 6.1 MCR Entrance Criteria

The following must be complete before the MCR can be conducted:

- [ ] Cloud Architecture Overview (ConOps) document produced (Section 1)
- [ ] All stakeholder categories identified with documented expectations (Section 2)
- [ ] Hardware inventory completed with resource sufficiency confirmed (Section 3)
- [ ] Risk classification documented with tailoring rationale (Section 4)
- [ ] Measures of Effectiveness defined with targets and verification methods (Section 5)

### 6.2 MCR Success Criteria

Per SP-6105 SS 4.1 and NPR 7123.1 SS 4.1, the MCR passes when:

1. **All stakeholders identified** -- Every cloud consumer category has documented expectations with quantitative targets where applicable
2. **Hardware inventory complete** -- All resource sufficiency checks pass against target hardware, confirming that the proposed architecture is feasible with available resources
3. **ConOps reviewed** -- The Cloud Architecture Overview describes all operational scenarios (normal, maintenance, off-nominal) and has been validated against stakeholder expectations
4. **Risk classification documented** -- Project type is classified per SP-6105 SS 3.11 with tailoring decisions justified per NPR 7123.1 SS 2.2
5. **MOEs established** -- Measures of Effectiveness have quantitative targets that will be verified during Phase D (Integration and Test)

### 6.3 MCR Decision

Upon successful completion of all criteria:

- **GO:** Proceed to Phase A (Concept and Technology Development) -- Chapter 2
- **NO-GO:** Address deficiencies (incomplete stakeholder register, insufficient hardware, unresolved high-impact risks) before re-evaluation

---

*Chapter 1 maps to NASA SE Pre-Phase A (SP-6105 SS 4.1, NPR 7123.1 SS 4.1). The next chapter -- Phase A: Concept and Technology Development -- addresses technology selection, system-level requirements, and architecture definition. See Chapter 2: "How Will It Work?"*
