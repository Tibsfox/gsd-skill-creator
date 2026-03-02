# Cloud Systems

**Domain:** cloud-systems
**Source:** OpenStack Platform (NASA SE Edition) -- 8 core services with Systems Engineering lifecycle
**Status:** Active
**Purpose:** Cloud infrastructure operations and NASA Systems Engineering methodology -- five wings covering identity and networking, compute and storage, orchestration, the NASA SE lifecycle with review gates, and runbook-based operational procedures

## Wings

- Identity & Networking -- Keystone authentication, token management, Neutron networks/subnets/routers, security groups, endpoint catalog
- Compute & Storage -- Nova instance lifecycle, Cinder block volumes, Glance image registry, Swift object storage, flavor management
- Orchestration -- Heat stack templates, HOT syntax, Horizon dashboard, multi-service resource graph coordination
- NASA SE Lifecycle -- Pre-Phase A through Phase F reviews (MCR, SRR, PDR, CDR, ORR), TAID verification methods, requirements tracing
- Runbook Operations -- Runbook structure, ProcedureStep execution, communication loop priority (0=HALT to 7=HEARTBEAT), deployment verification

## Entry Point

cloud-keystone-auth

## Concepts

### Identity & Networking (3 concepts)
- cloud-keystone-auth -- Keystone token issuance, scoped tokens, service catalog endpoints (public/internal/admin), project isolation
- cloud-neutron-networking -- Networks, subnets, routers, floating IPs, VLAN segmentation, provider/tenant network topology
- cloud-security-groups-policies -- Ingress/egress rules, default-deny posture, security group chaining, port security

### Compute & Storage (3 concepts)
- cloud-nova-instances -- Instance lifecycle (BUILD/ACTIVE/SHUTOFF/ERROR), flavors (vCPU/RAM/disk), live migration, hypervisor selection
- cloud-cinder-block-storage -- Volume creation, attachment to instances, snapshot chains, transfer between projects
- cloud-swift-glance-object-image -- Swift object containers, Glance image formats (QCOW2/raw), image metadata, image upload pipeline

### Orchestration (3 concepts)
- cloud-heat-stack-templates -- HOT (Heat Orchestration Template) syntax, resource dependencies, parameter injection, stack outputs
- cloud-horizon-dashboard -- Web-based service management, quota display, network topology visualizer, admin vs project scope
- cloud-multi-service-coordination -- Cross-service resource graphs, eventual consistency between Nova/Neutron/Cinder, dependency ordering

### NASA SE Lifecycle (3 concepts)
- cloud-se-phase-reviews -- Pre-Phase A through Phase F (pre-a, a, b, c, d, e, f), review gate types (MCR/SRR/SDR/PDR/CDR/SIR/ORR/FRR), phase entrance/exit criteria
- cloud-taid-verification -- Four NASA verification methods: test (run-and-observe), analysis (model-based), inspection (checklist), demonstration (show-and-witness)
- cloud-requirements-tracing -- Requirement ID to verification mapping, RequirementStatus (pending/pass/fail), trace matrix structure

### Runbook Operations (3 concepts)
- cloud-runbook-structure -- Runbook as executable procedure: title, version, prerequisites, steps, rollback sequences, expected duration
- cloud-procedure-execution -- ProcedureStep: action description, verification check, expected output, timeout, escalation path
- cloud-communication-loops -- Nine communication loops (command/execution/specialist/user/observation/health/budget/cloud-ops/doc-sync), priority levels 0=HALT to 7=HEARTBEAT

## Calibration Models

None -- cloud operations metrics are operational health indicators, not learner calibration parameters.

## Safety Boundaries

None -- cloud-systems has no physical safety-critical parameters (production safeguards are addressed via runbook gate checks).
