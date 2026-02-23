# Chapter 2: Concept and Technology Development -- How Will It Work?

**SE Phase:** Phase A | **SP-6105 SS 4.2** | **NPR 7123.1 SS 4.2** | **Review Gate:** SRR (Requirements Baseline Review)

---

This chapter maps to NASA's Phase A: Concept and Technology Development. With the concept studies complete and the MCR passed (Chapter 1), we now select the deployment technology, define system-level requirements as traceable "shall" statements, establish the architecture baseline, and prepare the Systems Engineering Management Plan (SEMP). Per SP-6105 SS 4.2, this phase transforms stakeholder expectations into formal technical requirements that drive all subsequent design and implementation.

The discipline here is critical: per SP-6105 SS 2.5, trade studies should precede -- rather than follow -- system design decisions. We document the alternatives before writing the configuration, not after.

## 1. Technology Assessment

Per SP-6105 SS 4.4 (Design Solution Definition), technology selection requires evaluating alternatives against defined criteria, conducting trade studies with documented rationale, and selecting the preferred approach. NPR 7123.1 SS 4.2 requires that technology choices support the defined requirements and are feasible within project constraints.

### 1.1 Deployment Method Trade Study

Three deployment methods were evaluated for the single-node OpenStack cloud:

| Criterion | Kolla-Ansible | DevStack | Manual Installation |
|-----------|--------------|----------|-------------------|
| **Production readiness** | High -- designed for production deployments | Low -- development/testing tool only | Medium -- depends on skill |
| **Containerization** | Yes -- all services in Docker/Podman containers | No -- services run on host directly | Optional -- manual container setup |
| **Upgrade path** | Built-in upgrade/reconfigure commands | Destroy and rebuild | Manual version-by-version migration |
| **Reproducibility** | Full -- declarative YAML configuration | Partial -- local.conf with imperative scripts | Low -- depends on documentation |
| **Community support** | Active -- official OpenStack deployment project | Active -- widely used for development | Fragmented -- distro-specific guides |
| **Recovery** | Container restart with preserved configuration | Re-run stack.sh (data may be lost) | Service-by-service manual recovery |
| **Configuration management** | Centralized globals.yml + per-service overrides | local.conf (flat file) | Scattered across /etc directories |
| **Learning value** | High -- exposes all configuration decisions | Medium -- hides complexity behind scripts | Highest -- builds from first principles |

### 1.2 Selection Decision

**Selected: Kolla-Ansible**

**Rationale per SP-6105 SS 4.4 decision analysis:**

1. **Production readiness** -- Kolla-Ansible produces deployments identical in structure to enterprise installations. DevStack is explicitly not for production. This aligns with the stakeholder expectation (Section 2 of Chapter 1) that operators have documented procedures verified against a production-like environment.

2. **Containerization** -- Service isolation through containers provides clear failure boundaries. Per SP-6105 SS 6.4 (Technical Risk Management), containerized services reduce the blast radius of individual service failures (Risk R-003 from Chapter 1).

3. **Upgrade path** -- Kolla-Ansible's built-in `kolla-ansible upgrade` supports rolling upgrades between OpenStack releases. This satisfies the medium lifetime (2-5 years) requirement from the risk classification.

4. **Configuration management** -- Centralized configuration through `globals.yml` enables git-controlled change management per SP-6105 SS 6.5 (Configuration Management). Every decision is documented in version control.

**Trade study archived:** This decision record satisfies the SP-6105 SS 6.8 (Decision Analysis) requirement for formal documentation of alternatives evaluated, criteria applied, and rationale for selection.

### 1.3 Network Backend Trade Study

| Criterion | Open vSwitch (OVS) | OVN |
|-----------|-------------------|-----|
| **Maturity** | Production-proven for 10+ years | Newer but rapidly maturing |
| **Single-node suitability** | Excellent -- simple bridge configuration | Good -- more complex for single node |
| **Debugging tools** | `ovs-vsctl`, `ovs-ofctl`, extensive documentation | `ovn-nbctl`, `ovn-sbctl`, growing documentation |
| **Performance** | Good for lab scale | Better at scale but overhead for single node |
| **Kolla-Ansible support** | Default backend | Supported but requires additional configuration |

**Selected: OVS** -- Mature, well-documented, Kolla-Ansible default, appropriate for single-node lab deployment per NPR 7123.1 SS 4.2 guidance to select proven technology for medium-complexity projects.

## 2. System-Level Requirements

Per SP-6105 SS 4.2 (Technical Requirements Definition), stakeholder expectations from Chapter 1 are now transformed into formal "shall" statements. Each requirement has a traceable ID (CLOUD-{DOMAIN}-{NNN}), traces to a stakeholder need, and will be verified through a specific TAID method in Phase D (Chapter 5).

### 2.1 Functional Requirements

**Identity Service (Keystone)**

| Req ID | Requirement | Traces To | TAID |
|--------|------------|-----------|------|
| CLOUD-IDENTITY-001 | The identity service shall authenticate users and provide scoped authentication tokens | Developers: reliable access | T |
| CLOUD-IDENTITY-002 | The identity service shall maintain a service catalog of all registered OpenStack endpoints | Operators: service discovery | T+I |
| CLOUD-IDENTITY-003 | The identity service shall enforce role-based access control (RBAC) across all services | Security: authorization enforcement | T+I |
| CLOUD-IDENTITY-004 | The identity service shall support Fernet token format for stateless token validation | Operators: scalable token management | I |

**Compute Service (Nova)**

| Req ID | Requirement | Traces To | TAID |
|--------|------------|-----------|------|
| CLOUD-COMPUTE-001 | The compute service shall support launching instances with at least 4 predefined flavors | Developers: workload flexibility | T |
| CLOUD-COMPUTE-002 | The compute service shall transition instances to ACTIVE state within 30 seconds of request | Developers: launch time MOE-001 | T |
| CLOUD-COMPUTE-003 | The compute service shall support instance lifecycle operations: start, stop, reboot, pause, resume, delete | Developers: instance management | T+D |

**Networking Service (Neutron)**

| Req ID | Requirement | Traces To | TAID |
|--------|------------|-----------|------|
| CLOUD-NETWORK-001 | The networking service shall provide software-defined networking with tenant isolation | Security: network segmentation | T+I |
| CLOUD-NETWORK-002 | The networking service shall support floating IP allocation for external instance access | Developers: external connectivity | T+D |
| CLOUD-NETWORK-003 | The networking service shall enforce security group rules on all instance traffic | Security: network policy enforcement | T |

**Block Storage Service (Cinder)**

| Req ID | Requirement | Traces To | TAID |
|--------|------------|-----------|------|
| CLOUD-STORAGE-001 | The block storage service shall provide persistent volumes that survive instance deletion | Developers: data persistence | T |
| CLOUD-STORAGE-002 | The block storage service shall support volume snapshots for point-in-time recovery | Operators: backup capability | T |
| CLOUD-STORAGE-003 | The block storage service shall deliver at least 1000 IOPS for 4K random reads | Developers: storage performance MOE-003 | T |

### 2.2 Performance Requirements

| Req ID | Requirement | Target | Traces To |
|--------|------------|--------|-----------|
| CLOUD-SYSTEM-001 | API endpoints shall respond to list operations within 2 seconds | < 2s | MOE-004 |
| CLOUD-SYSTEM-002 | The system shall maintain API availability of 99.9% measured over 30-day periods | > 99.9% | MOE-002 |
| CLOUD-SYSTEM-003 | VM-to-VM network throughput shall exceed 1 Gbps on the tenant network | > 1 Gbps | MOE-005 |
| CLOUD-SYSTEM-004 | Service recovery from container restart shall complete within 5 minutes | < 5 min | MOE-006 |

### 2.3 Constraints

Per SP-6105 SS 4.2, constraints are requirements imposed by external factors rather than derived from stakeholder needs:

| Constraint ID | Constraint | Source |
|---------------|-----------|--------|
| CLOUD-CONST-001 | The system shall operate on a single physical host with minimum 32 GB RAM and 100 GB disk | Hardware availability |
| CLOUD-CONST-002 | The system shall use CentOS Stream 9 as the base operating system | Kolla-Ansible compatibility |
| CLOUD-CONST-003 | All services shall run as containers managed by Kolla-Ansible | Deployment method selection (Section 1) |
| CLOUD-CONST-004 | Configuration changes shall be version-controlled in git with commit messages documenting rationale | SP-6105 SS 6.5 (Configuration Management) |

## 3. Architecture Definition

Per SP-6105 SS 4.3 (Logical Decomposition), the system architecture maps requirements to OpenStack services and defines how those services interact.

### 3.1 Single-Node Architecture

All services run on a single physical host as containerized processes managed by Kolla-Ansible. This architecture satisfies CLOUD-CONST-001 and CLOUD-CONST-003.

```
Physical Host (CentOS Stream 9)
 |
 +-- Container Runtime (Docker/Podman)
 |    |
 |    +-- Keystone (identity)
 |    +-- Glance (images)
 |    +-- Nova (compute: api, conductor, scheduler, compute)
 |    +-- Neutron (networking: server, OVS agent, DHCP agent, L3 agent)
 |    +-- Cinder (storage: api, scheduler, volume)
 |    +-- Swift (object storage: proxy, account, container, object)
 |    +-- Heat (orchestration: api, engine)
 |    +-- Horizon (dashboard)
 |    +-- MariaDB (database backend)
 |    +-- RabbitMQ (message queue)
 |    +-- Memcached (token caching)
 |    +-- HAProxy (API load balancer -- single instance)
 |
 +-- KVM/QEMU (hypervisor for Nova compute)
 |
 +-- Open vSwitch (SDN for Neutron)
 |
 +-- LVM (storage backend for Cinder)
```

### 3.2 Network Topology

Per NPR 7123.1 SS 4.2, the network architecture must support all defined networking requirements:

- **Management network** -- carries API traffic between all services, inter-service RPC over RabbitMQ, database connections to MariaDB, and administrative SSH access. All API endpoints bind to this network.
- **Tenant network** -- carries VM-to-VM traffic using VXLAN encapsulation over OVS bridges. Provides per-project isolation through Neutron security groups and virtual routers.
- **External network** -- provides floating IP connectivity for instances requiring external access. Bridges to the physical network through Neutron's L3 agent.

### 3.3 Storage Architecture

- **Cinder block storage** -- LVM backend using a dedicated volume group. Provides persistent volumes attached to instances via iSCSI targets. Selected over Ceph per Section 1 trade study rationale (single-node simplicity).
- **Glance image storage** -- Local filesystem backend at `/var/lib/glance/images/`. Sufficient for single-node deployment where distributed storage adds complexity without benefit.
- **Swift object storage** -- Ring-based distribution across local storage devices. Configured with 1 replica (appropriate for single-node; production multi-node would use 3 replicas).

## 4. Requirements Traceability

Per SP-6105 SS 6.2 (Requirements Management) and NPR 7123.1 SS 4.2, every requirement must be traceable in both directions: from stakeholder need through requirement to verification test, and from test back through requirement to stakeholder need.

### 4.1 Traceability Structure

```
Stakeholder Need (Chapter 1, Section 2)
    |
    +---> Requirement (CLOUD-{DOMAIN}-{NNN})
              |
              +---> Design Decision (Chapter 3)
              |
              +---> Implementation (Chapter 4)
              |
              +---> Verification Test (Chapter 5, TAID method)
```

### 4.2 Requirement ID Convention

The `CLOUD-{DOMAIN}-{NNN}` format established in this chapter provides:

- **DOMAIN** groups requirements by functional area for efficient review and assignment
- **NNN** provides sequential numbering within each domain
- Each requirement includes a "Traces To" field linking to the originating stakeholder need or MOE
- Each requirement includes a "TAID" field specifying the verification method(s) to be used in Phase D

### 4.3 Traceability Maintenance

Per SP-6105 SS 6.2, the requirements traceability matrix is maintained throughout the project lifecycle. Changes to requirements follow the change control process defined in the SEMP (Section 5). Every requirement change must:

1. Document the reason for change
2. Assess impact on downstream design and verification
3. Update the traceability matrix
4. Be approved through the configuration management process (git commit with rationale)

## 5. SEMP Baseline

Per SP-6105 SS 6.1 (Technical Planning) and Appendix J, the Systems Engineering Management Plan (SEMP) documents how the engineering of this cloud is managed. For this Type C-D project, the SEMP is integrated into the Cloud Engineering Management Plan per the tailoring decision in Chapter 1, Section 4.2.

### 5.1 Engineering Management Approach

The cloud engineering management plan follows these principles per SP-6105 SS 6.1:

**Configuration Management (SP-6105 SS 6.5):**
- All configurations stored in git with meaningful commit messages
- Every configuration change documents the rationale (what changed, why, what alternatives were considered)
- Baseline configurations tagged at each phase gate
- No configuration change applied without a corresponding git commit

**Change Control:**
- Configuration changes reviewed before application
- Rollback procedures documented for every change
- Change history maintained through git log

**Technical Reviews (NPR 7123.1 Appendix G):**
- Each phase gate corresponds to a NASA lifecycle review (MCR, SRR, PDR, CDR, SIR, ORR, DR)
- Reviews evaluate entrance criteria and success criteria defined in each chapter
- GO/NO-GO decisions documented in the engineering record

### 5.2 Mission Management Integration

The cloud deployment is managed through GSD's mission management architecture:

- **FLIGHT** (orchestrator) coordinates the overall deployment sequence
- **PLAN** decomposes deployment into phases aligned with NASA SE lifecycle
- **EXEC** agents execute deployment tasks per phase
- **VERIFY** validates results against requirements
- **CAPCOM** provides the human-in-the-loop interface for decisions requiring human judgment

This structure satisfies NPR 7123.1 requirements for technical management while providing the automation benefits of agent-based execution.

### 5.3 GSD Crew Roles

The engineering management plan leverages GSD's crew manifest:

| Crew | Phase Alignment | Key Deliverables |
|------|----------------|------------------|
| Deployment Crew (12 roles) | Phases A through D | Deployed and verified cloud infrastructure |
| Operations Crew (8 roles) | Phase E | Operational procedures, monitoring, maintenance |
| Documentation Crew (8 roles) | All phases | Systems administrator's guide, operations manual, runbooks |

## 6. Phase Gate Criteria -- SRR (Requirements Baseline Review)

Per NPR 7123.1 Appendix G, the System Requirements Review (SRR) evaluates whether the requirements are complete, consistent, and traceable. In cloud operations terms, this is the Requirements Baseline Review.

### 6.1 SRR Entrance Criteria

The following must be complete before the SRR can be conducted:

- [ ] Technology assessment completed with documented trade study (Section 1)
- [ ] System-level requirements defined as traceable "shall" statements (Section 2)
- [ ] Architecture definition produced with network and storage topology (Section 3)
- [ ] Requirements traceability structure established (Section 4)
- [ ] SEMP baselined with configuration management and review processes (Section 5)

### 6.2 SRR Success Criteria

Per SP-6105 SS 4.2 and NPR 7123.1 SS 4.2, the SRR passes when:

1. **All requirements captured** -- Every stakeholder need from Chapter 1 traces to at least one formal requirement with a CLOUD-{DOMAIN}-{NNN} identifier
2. **Deployment technology selected** -- Trade study documents alternatives evaluated, criteria applied, and rationale for Kolla-Ansible selection per SP-6105 SS 6.8
3. **SEMP baselined** -- Configuration management, change control, and review processes defined and approved
4. **Requirements traceability initialized** -- Every requirement has a "Traces To" field (stakeholder need) and a "TAID" field (verification method)

### 6.3 SRR Decision

Upon successful completion of all criteria:

- **GO:** Proceed to Phase B (Preliminary Design and Technology Completion) -- Chapter 3
- **NO-GO:** Address deficiencies (missing requirements, incomplete trade studies, unbaselined SEMP) before re-evaluation

---

*Chapter 2 maps to NASA SE Phase A (SP-6105 SS 4.2, NPR 7123.1 SS 4.2). The next chapter -- Phase B: Preliminary Design and Technology Completion -- addresses service-by-service design specifications, interface definitions, and the preliminary V&V plan. See Chapter 3: "The Blueprint."*
