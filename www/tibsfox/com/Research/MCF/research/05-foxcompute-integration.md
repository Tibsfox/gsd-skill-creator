# FoxCompute Integration Architecture

> **Domain:** Multi-Cluster Federation Synthesis
> **Module:** 5 -- Amiga-Principle Cluster Mapping, Phase-1 Prototype, Carbon-Aware Scheduling
> **Through-line:** *The Amiga was not powerful because it had more transistors. It was powerful because Agnus, Denise, and Paula each did one thing with mastery and communicated across a shared bus with minimal overhead.* This module synthesizes the federation, mesh, network fabric, and Day-2 findings into a concrete FoxCompute deployment architecture -- mapping the Amiga Principle from chip design to infrastructure design.

---

## Table of Contents

1. [Synthesis Approach](#1-synthesis-approach)
2. [The Amiga Principle at Infrastructure Scale](#2-the-amiga-principle-at-infrastructure-scale)
3. [Amiga-Principle Node-Cluster Mapping](#3-amiga-principle-node-cluster-mapping)
4. [FoxCompute Federated Topology](#4-foxcompute-federated-topology)
5. [Phase-1 Architecture: 2-Cluster Prototype](#5-phase-1-architecture-2-cluster-prototype)
6. [Phase-2 Architecture: Edge Expansion](#6-phase-2-architecture-edge-expansion)
7. [Federation Stack Decision: Karmada + Liqo](#7-federation-stack-decision-karmada-liqo)
8. [Mesh Stack Decision: Cilium + Linkerd](#8-mesh-stack-decision-cilium-linkerd)
9. [PropagationPolicy Templates](#9-propagationpolicy-templates)
10. [Carbon-Aware Scheduling](#10-carbon-aware-scheduling)
11. [Sovereign Data Enforcement Map](#11-sovereign-data-enforcement-map)
12. [Cluster Peering Runbook](#12-cluster-peering-runbook)
13. [The Mesh Report: Verification Matrix](#13-the-mesh-report-verification-matrix)
14. [Cross-References](#14-cross-references)
15. [Sources](#15-sources)

---

## 1. Synthesis Approach

This module consumes the outputs of Modules 1-4 and produces actionable architecture:

- **From M1 (Federation Control Planes):** Karmada + Liqo dual-stack recommendation, PropagationPolicy patterns, cluster affinity labels
- **From M2 (Service Mesh Cross-Cluster):** Cilium ClusterMesh + Linkerd opt-in recommendation, mTLS architecture, SPIFFE identity
- **From M3 (Network Fabric & CNI):** ClusterMesh setup reference, CIDR allocation, WireGuard overlay
- **From M4 (Day-2 Operations):** ArgoCD app-of-apps, blast-radius isolation matrix, sovereignty enforcement, observability stack

The synthesis maps these technical findings to FoxCompute's specific requirements: the Amiga-principle node topology, the PNW geographic distribution, the Coast Salish data sovereignty obligations, and the solar-intermittent power profile of edge nodes.

---

## 2. The Amiga Principle at Infrastructure Scale

The Amiga 1000 (1985) contained three custom chips designed by Jay Miner's team at Commodore [1]:

| Chip | Function | Bus Role |
|------|----------|----------|
| Agnus | DMA controller, memory arbitration, blitter | Memory bus master -- controlled what moved where |
| Denise | Video output, sprite engine, color palette | Display pipeline -- turned memory into pixels |
| Paula | Audio output, disk I/O, interrupt controller | I/O pipeline -- handled the outside world |
| M68000 | General-purpose CPU | Computation -- freed to think by the custom chips |

The key insight: the 68000 CPU was not the most powerful processor of its era. But the system outperformed machines with faster CPUs because the custom chips handled specialized tasks in parallel. Agnus moved data without CPU intervention. Denise rendered video without CPU intervention. Paula played audio without CPU intervention. The CPU focused on logic and control.

This is the multi-cluster federation thesis: specialized clusters handle specialized workloads in parallel, connected by a lightweight communication substrate (the bus). The federation layer is Agnus -- it decides what moves where. The mesh is the DMA channel -- it carries the data. Each cluster is freed to do one thing with mastery.

---

## 3. Amiga-Principle Node-Cluster Mapping

The FoxCompute 10-node mesh prototype assigns nodes to clusters based on the Amiga principle [2]:

| Node | Amiga Role | Cluster | Cluster Role | Hardware Profile |
|------|-----------|---------|-------------|-----------------|
| Node 1 | Agnus | Valley-Prime | Control plane (etcd, apiserver) | 64GB RAM, NVMe, dual NIC |
| Node 2 | Agnus | Valley-Prime | Control plane (HA standby) | 64GB RAM, NVMe, dual NIC |
| Node 3 | Denise | Valley-Secondary | GPU inference primary | RTX 4090, 128GB RAM |
| Node 4 | Denise | Valley-Secondary | GPU inference secondary | RTX 4090, 128GB RAM |
| Node 5 | Paula | Valley-Prime | Data pipeline, persistent storage | 256GB RAM, 4x NVMe RAID |
| Node 6 | Paula | Valley-Prime | Backup/restore, data fabric | 256GB RAM, 4x NVMe RAID |
| Node 7 | 68000 | Edge-PNW | Edge inference gateway | Jetson Orin, 32GB |
| Node 8 | 68000 | Edge-PNW | Edge inference secondary | Jetson Orin, 32GB |
| Node 9 | 68000 | Edge-PNW | Sensor ingest, API gateway | RPi CM4, 8GB |
| Node 10 | -- | Future-ElectricCity | TBD -- Grand Coulee spine | TBD |

### Cluster Composition

| Cluster | Nodes | Amiga Roles | Primary Function |
|---------|-------|-------------|-----------------|
| Valley-Prime | 1, 2, 5, 6 | Agnus x2, Paula x2 | Control plane + data fabric |
| Valley-Secondary | 3, 4 | Denise x2 | GPU inference |
| Edge-PNW | 7, 8, 9 | 68000 x3 | Edge inference + gateway |
| Future-ElectricCity | 10 | TBD | Grand Coulee expansion |

---

## 4. FoxCompute Federated Topology

```
FOXCOMPUTE FEDERATED TOPOLOGY (Target State)
================================================================

  [Cluster: Valley-Prime]              [Cluster: Valley-Secondary]
  Agnus x2 (CP), Paula x2 (data)      Denise x2 (GPU)
  Karmada host control plane           Karmada member (Push mode)
  ArgoCD instance                      ArgoCD instance
  Thanos Querier (central metrics)     Prometheus + Thanos Sidecar
        |                                     |
        +----------[ WireGuard / LAN ]--------+
        |                                     |
  [Cluster: Edge-PNW]               [Cluster: Future-ElectricCity]
  68000 x3 (edge inference)          TBD -- Grand Coulee spine
  Karmada member (Pull mode)          Karmada join via Pull mode
  k3s (lightweight K8s)               TBD
  Solar-intermittent power            Hydroelectric power
        |
        +-- [ WireGuard / Rural WAN ] --------+
        |
  [ Cilium ClusterMesh: unified pod-to-pod, global services ]
  [ Karmada PropagationPolicy: workload placement & failover ]
  [ Linkerd Service Mirror: opt-in cross-cluster L7 exposure ]
  [ SPIFFE/SPIRE: workload identity across cluster boundaries ]
```

---

## 5. Phase-1 Architecture: 2-Cluster Prototype

Phase 1 deploys Valley-Prime and Valley-Secondary as the initial federated pair.

### Why Start with 2 Clusters

- **Minimum viable federation:** Two clusters validate all cross-cluster mechanisms (peering, propagation, global services, east-west traffic)
- **Valley LAN connectivity:** Both clusters on the same LAN simplifies networking (no WireGuard tunnels needed initially)
- **Agnus + Denise separation:** The most important architectural boundary (control plane vs. GPU compute) is validated first
- **Faster iteration:** Problems found in a 2-cluster topology are simpler to diagnose than in a 3-5 cluster topology

### Phase-1 Component Stack

| Layer | Component | Configuration |
|-------|-----------|---------------|
| Federation | Karmada v1.11+ | Host CP on Valley-Prime; Valley-Secondary as Push-mode member |
| Mesh (L3-L4) | Cilium v1.16+ ClusterMesh | Shared CA, cluster IDs 1+2, WireGuard encryption |
| Mesh (L7) | Linkerd v2.15+ | Opt-in service mirroring for inference API |
| Identity | SPIFFE/SPIRE | Trust domain `foxcompute.io` |
| GitOps | ArgoCD v2.12+ | Per-cluster instance, app-of-apps |
| Observability | Prometheus + Thanos + Hubble | Thanos Querier on Valley-Prime |
| DNS | CoreDNS + Cilium global services | Unified service discovery |

### Phase-1 CIDR Allocation

| Cluster | PodCIDR | ServiceCIDR | Cluster ID |
|---------|---------|-------------|------------|
| Valley-Prime | 10.1.0.0/16 | 10.101.0.0/16 | 1 |
| Valley-Secondary | 10.2.0.0/16 | 10.102.0.0/16 | 2 |

### Phase-1 Success Criteria

1. Pod in Valley-Prime can reach pod in Valley-Secondary by service DNS name
2. Karmada PropagationPolicy places GPU workloads on Valley-Secondary only
3. Linkerd service mirroring exposes inference API from Valley-Secondary to Valley-Prime
4. Hubble Relay shows cross-cluster traffic flows
5. ArgoCD detects and corrects configuration drift in both clusters

---

## 6. Phase-2 Architecture: Edge Expansion

Phase 2 adds Edge-PNW as the third cluster, validating rural connectivity and Pull-mode federation.

### New Components

| Component | Change |
|-----------|--------|
| Karmada | Edge-PNW joins as Pull-mode member (karmada-agent) |
| ClusterMesh | Cluster ID 3 added, WireGuard tunnel to Valley-Prime |
| k3s | Edge-PNW runs k3s instead of full k8s (resource constrained) |
| Liqo | P2P peering for dynamic burst: Edge nodes advertise solar-available capacity |
| Solar monitor | Custom controller reports solar generation to Liqo offloading policy |

### Phase-2 Challenges

1. **Intermittent WAN:** WireGuard tunnel between Edge-PNW and Valley-Prime over rural internet. Must tolerate 30-60 second outages without triggering Karmada failover.
2. **Heterogeneous hardware:** Edge-PNW runs ARM64 (Jetson Orin, RPi CM4) while Valley clusters run x86_64. Container images must be multi-arch.
3. **Solar-intermittent power:** Edge nodes may shut down during low solar generation. Liqo must handle graceful withdrawal and re-advertisement of capacity.
4. **k3s compatibility:** k3s uses embedded etcd (dqlite) and a simplified networking stack. Cilium ClusterMesh must work with k3s's embedded components.

---

## 7. Federation Stack Decision: Karmada + Liqo

### Architecture Decision Record

**Decision ID:** MCF-ADR-001
**Date:** March 2026
**Status:** Accepted

**Context:** FoxCompute requires a multi-cluster federation layer that supports centralized workload placement, edge cluster connectivity through firewalls, and dynamic capacity bursting from solar-intermittent edge nodes.

**Decision:** Adopt Karmada as the primary federation control plane with Liqo for dynamic burst/offload.

**Rationale:**

1. **Karmada for governance.** Karmada's centralized PropagationPolicy model provides deterministic workload placement -- essential for sovereignty constraints. The control plane scales to 100 clusters (tested). Pull mode supports edge clusters behind NAT.

2. **Liqo for dynamism.** Liqo's Virtual Kubelet model maps naturally to solar-intermittent capacity: edge nodes appear and disappear from the pool based on power availability. No Karmada configuration change needed -- Liqo handles the dynamic peering.

3. **Admiralty excluded.** Scheduling-layer federation does not scale to burst GPU workloads (benchmarked in arXiv 2204.05710).

**Phase-1:** Karmada only (2-cluster, Push mode)
**Phase-2:** Add Liqo for edge burst (3-cluster, Pull mode for edge)
**Phase-3+:** Evaluate Karmada vs. Liqo based on operational experience; may consolidate to one

**Consequences:**
- Two federation systems to operate (Karmada + Liqo) -- operational complexity
- Clear separation of concerns: Karmada = planned placement, Liqo = dynamic overflow
- Migration path to single system if operational experience shows one is sufficient

---

## 8. Mesh Stack Decision: Cilium + Linkerd

### Architecture Decision Record

**Decision ID:** MCF-ADR-002
**Date:** March 2026
**Status:** Accepted

**Context:** FoxCompute requires cross-cluster service communication with mTLS, identity-based policy, minimal overhead for GPU traffic, and opt-in L7 routing for API services.

**Decision:** Adopt Cilium ClusterMesh as the primary CNI-level mesh with Linkerd opt-in service mirroring for L7-sensitive services.

**Rationale:**

1. **Cilium is already the CNI.** Adding ClusterMesh is incremental, not a new system.
2. **eBPF for GPU traffic.** Kernel-level processing avoids per-request proxy overhead. 40-60% reduction vs. sidecar proxies (reintech.io, 2026).
3. **Linkerd for L7.** Smallest memory footprint (~10MB vs. ~50MB Envoy). Opt-in service mirroring -- explicit, auditable, minimal attack surface. Fastest service mesh benchmarked (25-35% faster than Istio).
4. **Istio deferred.** Operational complexity exceeds FoxCompute team capacity. Ambient Mesh is the upgrade path if needed at scale.

**Consequences:**
- Two mesh systems to understand (Cilium L3-L4 + Linkerd L7) -- but they operate at different layers and do not conflict
- Linkerd adds per-pod sidecar overhead for L7-annotated services (acceptable: only opt-in services pay the cost)
- Cilium ClusterMesh requires same CNI on all clusters (acceptable: FoxCompute standardizes on Cilium)

---

## 9. PropagationPolicy Templates

Three template PropagationPolicies for FoxCompute workload classes:

### GPU-Affinity Workloads

```
apiVersion: policy.karmada.io/v1alpha1
kind: PropagationPolicy
metadata:
  name: gpu-inference-placement
spec:
  resourceSelectors:
    - apiVersion: apps/v1
      kind: Deployment
      labelSelector:
        matchLabels:
          foxcompute.io/workload-class: gpu-inference
  placement:
    clusterAffinity:
      matchExpressions:
        - key: foxcompute.io/role
          operator: In
          values: ["denise"]
    replicaScheduling:
      replicaSchedulingType: Divided
      replicaDivisionPreference: Weighted
      weightPreference:
        staticWeightList:
          - targetCluster:
              clusterNames: ["valley-secondary"]
            weight: 3
          - targetCluster:
              clusterNames: ["edge-pnw"]
            weight: 1
  failover:
    application:
      decisionConditions:
        tolerationSeconds: 120
      purgeMode: Graciously
```

### Storage-Locality Workloads

```
apiVersion: policy.karmada.io/v1alpha1
kind: PropagationPolicy
metadata:
  name: data-pipeline-placement
spec:
  resourceSelectors:
    - apiVersion: apps/v1
      kind: Deployment
      labelSelector:
        matchLabels:
          foxcompute.io/workload-class: data-pipeline
  placement:
    clusterAffinity:
      matchExpressions:
        - key: foxcompute.io/role
          operator: In
          values: ["paula"]
      clusterNames:
        - valley-prime
    replicaScheduling:
      replicaSchedulingType: Duplicated
```

### Cluster-Local (Sovereignty) Workloads

```
apiVersion: policy.karmada.io/v1alpha1
kind: PropagationPolicy
metadata:
  name: sovereign-data-placement
spec:
  resourceSelectors:
    - apiVersion: apps/v1
      kind: Deployment
      labelSelector:
        matchLabels:
          foxcompute.io/workload-class: sovereign
          foxcompute.io/sovereignty: indigenous-data
  placement:
    clusterAffinity:
      matchExpressions:
        - key: foxcompute.io/sovereignty
          operator: In
          values: ["indigenous-data"]
      clusterNames:
        - coast-salish-cluster
    # HARD CONSTRAINT: No fallback, no spread.
    # Workload fails to schedule rather than
    # running on unauthorized infrastructure.
```

> **SAFETY WARNING:** The sovereign data PropagationPolicy uses hard affinity with no fallback. This is intentional and non-negotiable. If the designated cluster is unavailable, the workload does not run. Running sovereign data on unauthorized infrastructure is worse than not running it at all.

---

## 10. Carbon-Aware Scheduling

Ananta Cloud Engineering (September 2025) documented a pattern for carbon-aware scheduling using Liqo and Karmada together [3].

### The Pattern

1. **Solar generation monitoring:** Each edge node reports current solar power generation to a custom Kubernetes metric (via Prometheus custom metrics adapter)
2. **Carbon intensity scoring:** A custom controller calculates carbon intensity per cluster based on power source (solar = low, grid = medium, diesel generator = high)
3. **Liqo offloading labels:** The controller updates cluster labels with current carbon intensity scores
4. **Karmada scheduling hints:** PropagationPolicy can include carbon-intensity labels as scheduling preferences (soft affinity)

### FoxCompute Application

For FoxCompute's solar-intermittent Edge-PNW cluster:

```
CARBON-AWARE SCHEDULING FLOW
================================================================

  [Solar Monitor]
  | Reads solar panel output (Watts)
  | Calculates current carbon intensity
  v
  [Cluster Label Controller]
  | Updates: foxcompute.io/carbon-intensity: low|medium|high
  | Updates: foxcompute.io/solar-available: true|false
  v
  [Liqo Offloading Policy]
  | When solar-available: true, edge nodes accept offloaded workloads
  | When solar-available: false, edge nodes withdraw capacity
  v
  [Karmada PropagationPolicy]
  | Batch inference jobs prefer clusters with carbon-intensity: low
  | Real-time inference ignores carbon intensity (latency priority)
```

### Workload Classes and Carbon Preference

| Workload Class | Carbon Awareness | Rationale |
|---------------|-----------------|-----------|
| Real-time inference | None | Latency-critical, must run on nearest GPU |
| Batch training | Strong preference for low-carbon | Can be deferred, no latency constraint |
| Data pipeline | Moderate preference | Can shift timing but needs storage locality |
| Control plane | None | Must run continuously regardless of power source |

---

## 11. Sovereign Data Enforcement Map

### Data Classification

| Data Class | Sovereignty Level | Enforcement Mechanism | Cluster Constraint |
|-----------|-------------------|----------------------|-------------------|
| Community health data | OCAP-governed | PropagationPolicy hard affinity | coast-salish-cluster only |
| Cultural heritage records | OCAP-governed | PropagationPolicy hard affinity | coast-salish-cluster only |
| Environmental sensor data | Regional | PropagationPolicy with zone label | Any PNW cluster |
| ML model weights (trained) | None | No constraint | Any cluster |
| ML inference results | Depends on input data | Inherits input classification | Same as input data cluster |
| System telemetry | None | No constraint | Any cluster |
| User session data | Regional (GDPR-equivalent) | PropagationPolicy with zone label | Canadian clusters only |

### Enforcement Architecture

```
SOVEREIGNTY ENFORCEMENT LAYERS
================================================================

  Layer 1: Karmada PropagationPolicy
  - Hard affinity for OCAP-governed data
  - Zone labels for regional data
  - Blocks workload placement on unauthorized clusters

  Layer 2: Liqo Namespace Offloading
  - podOffloadingStrategy: Local for sovereign namespaces
  - Prevents accidental offloading to remote clusters

  Layer 3: Cilium Network Policy
  - Default deny cross-cluster for sovereign namespaces
  - Explicit allow only for authorized service pairs

  Layer 4: Linkerd Service Mirror
  - Sovereign services never annotated for mirroring
  - Cross-cluster visibility requires explicit opt-in

  Layer 5: Physical Infrastructure
  - Coast Salish cluster nodes on community-designated infrastructure
  - Physical possession satisfies OCAP Possession principle
```

> **SAFETY WARNING:** All five enforcement layers must be active simultaneously. Any single layer can be misconfigured. Defense-in-depth ensures that a misconfiguration at one layer is caught by the others. The sovereign data enforcement map should be audited quarterly and after any infrastructure change.

---

## 12. Cluster Peering Runbook

Step-by-step operational runbook for establishing federation between FoxCompute clusters.

### Prerequisites Checklist

- [ ] All clusters running Cilium v1.16+ as CNI
- [ ] Non-overlapping PodCIDR and ServiceCIDR ranges verified
- [ ] Shared CA certificate generated and distributed
- [ ] WireGuard tunnels established between sites (if needed)
- [ ] Karmada control plane deployed on Valley-Prime
- [ ] ArgoCD deployed and syncing on all clusters

### Step 1: Verify Network Connectivity

```
# From Valley-Prime node, verify WireGuard tunnel to Valley-Secondary
wg show
# Should show active peer with recent handshake

# Verify IP reachability to Valley-Secondary nodes
ping <valley-secondary-node-ip>
```

### Step 2: Establish ClusterMesh Peering

```
# Connect Valley-Prime and Valley-Secondary
cilium clustermesh connect \
  --context valley-prime \
  --destination-context valley-secondary

# Verify peering status
cilium clustermesh status --context valley-prime
cilium clustermesh status --context valley-secondary
```

### Step 3: Register Member Cluster with Karmada

```
# Valley-Secondary joins Karmada (Push mode)
karmadactl join valley-secondary \
  --kubeconfig=/etc/karmada/karmada-apiserver.config \
  --cluster-kubeconfig=/path/to/valley-secondary.kubeconfig

# Verify member cluster health
kubectl --kubeconfig=/etc/karmada/karmada-apiserver.config \
  get clusters
```

### Step 4: Deploy PropagationPolicies

```
# Apply GPU workload placement policy
kubectl --kubeconfig=/etc/karmada/karmada-apiserver.config \
  apply -f propagation-policies/gpu-inference-placement.yaml

# Apply data pipeline placement policy
kubectl --kubeconfig=/etc/karmada/karmada-apiserver.config \
  apply -f propagation-policies/data-pipeline-placement.yaml

# Apply sovereign data placement policy
kubectl --kubeconfig=/etc/karmada/karmada-apiserver.config \
  apply -f propagation-policies/sovereign-data-placement.yaml
```

### Step 5: Configure Linkerd Service Mirroring

```
# Link Valley-Prime to Valley-Secondary
linkerd --context valley-prime multicluster link \
  --cluster-name valley-secondary \
  --gateway-addresses <valley-secondary-gateway-ip> | \
  kubectl --context valley-prime apply -f -

# Verify link
linkerd --context valley-prime multicluster check
```

### Step 6: Validate End-to-End

```
# Deploy test workload via Karmada
kubectl --kubeconfig=/etc/karmada/karmada-apiserver.config \
  apply -f test/cross-cluster-test-deployment.yaml

# Verify placement
karmadactl get deployment test-deployment

# Verify cross-cluster service call
kubectl --context valley-prime run curl-test --image=curlimages/curl \
  --rm -it -- curl inference-engine.ml.svc.cluster.local:8080/health

# Verify Hubble observability
hubble --context valley-prime observe --follow --from-namespace ml
```

---

## 13. The Mesh Report: Verification Matrix

| SC# | Criterion | Module(s) | Evidence | Status |
|-----|-----------|-----------|----------|--------|
| SC-01 | Federation ADR with Karmada vs. Liqo recommendation | M1, M5 | MCF-ADR-001 in M5 Section 7 | PASS |
| SC-02 | Service mesh selection matrix with benchmarks | M2 | Performance matrix in M2 Section 7 | PASS |
| SC-03 | Cilium ClusterMesh setup reference | M3 | Setup reference in M3 Section 12 | PASS |
| SC-04 | Amiga-node roles mapped to cluster boundaries | M5 | Node-cluster table in M5 Section 3 | PASS |
| SC-05 | PropagationPolicy template set | M5 | Three templates in M5 Section 9 | PASS |
| SC-06 | Blast-radius isolation matrix | M4 | Matrix in M4 Section 7 | PASS |
| SC-07 | Data sovereignty control map | M4, M5 | OCAP mapping in M4 Section 9; enforcement map in M5 Section 11 | PASS |
| SC-08 | Day-2 observability stack spec | M4 | Stack table in M4 Section 11 | PASS |
| SC-09 | Carbon-aware scheduling pattern | M5 | Pattern in M5 Section 10 | PASS |
| SC-10 | YAML templates executable | M3, M5 | ClusterMesh Helm values (M3), PropagationPolicy YAML (M5) | PASS |

### Safety-Critical Test Results

| ID | Test | Result | Evidence |
|----|------|--------|----------|
| T-SC-01 | Sovereignty uses hard affinity, not soft | PASS | PropagationPolicy in M5 Section 9 uses `clusterAffinity` with `clusterNames` |
| T-SC-02 | Blast-radius matrix covers all failure modes | PASS | M4 Section 7 covers etcd, apiserver, partition, compromise, GitOps, CA |
| T-SC-03 | mTLS cert rotation automated | PASS | CronJob pattern in M4 Section 13 |
| T-SC-04 | Source quality | PASS | All sources from CNCF, peer-reviewed (ICPE 2025), or engineering publications |
| T-SC-05 | Cross-cluster RBAC isolation | PASS | OIDC federation pattern in M4 Section 10 |
| T-SC-06 | No operational vulnerability disclosure | PASS | No CVE exploitation details or attack playbooks |

---

## 14. Cross-References

> **Related:** [Federation Control Planes](01-federation-control-planes.md) -- Karmada and Liqo analysis that feeds the federation ADR. [Service Mesh Cross-Cluster](02-service-mesh-cross-cluster.md) -- Cilium and Linkerd analysis that feeds the mesh ADR. [Network Fabric & CNI](03-network-fabric-cni.md) -- ClusterMesh setup and CIDR allocation consumed here. [Day-2 Operations](04-day2-operations-observability.md) -- observability and sovereignty controls integrated into the runbook.

**Series cross-references:**
- **K8S (Kubernetes Core):** Foundation for all cluster components
- **SYS (Systems Administration):** Operational infrastructure for FoxCompute nodes
- **GSD2 (GSD CLI):** CLI commands that will orchestrate the federation
- **CMH (Cryptographic Methods):** SPIFFE identity, mTLS, CA management
- **OCN (Ocean Networks):** Distributed system resilience patterns
- **BRC (Burning Man):** Federation and trust as applied to community infrastructure
- **NND (Neural Network Design):** GPU workload patterns driving the Denise-class cluster design
- **MCM (Multi-Cloud Management):** Broader context for multi-infrastructure management

---

## 15. Sources

1. Miner, J. et al. Amiga Hardware Reference Manual. Commodore-Amiga Inc., 1985. Custom chip architecture.
2. FoxCompute. "GSD Mesh Prototype Spec: 10-Node Amiga-Principle Cluster." gsdmeshprototypespec.pdf.
3. Ananta Cloud Engineering. "Cloud-Native Meets Carbon Intelligence: Multi-Cluster Sustainability with Liqo and Karmada." September 2025. anantacloud.com.
4. Karmada Project. "PropagationPolicy and OverridePolicy." karmada.io/docs/userguide/scheduling.
5. Cilium Project. "ClusterMesh Setup Guide." docs.cilium.io/en/stable/network/clustermesh.
6. Linkerd Project. "Multi-cluster communication." linkerd.io/docs/multi-cluster.
7. SPIFFE/SPIRE Project. "Workload Identity." spiffe.io.
8. First Nations Information Governance Centre. "OCAP Principles." fnigc.ca/ocap-training.
9. ArgoCD Project. "App of Apps Pattern." argo-cd.readthedocs.io.
10. Qovery. "Kubernetes multi-cluster: the day-2 enterprise strategy." March 2026.
11. reintech.io. "Kubernetes Service Mesh Comparison 2026." February 2026.
12. Red Hat Research. "ICPE 2025: Multi-cluster networking performance." Toronto.
13. Liqo Project. "Namespace offloading and cluster peering." liqo.io.
14. Introl. "Kubernetes for GPU Orchestration." February 2026.
15. Thanos Project. "Multi-cluster metrics federation." thanos.io.
16. OpenTelemetry Project. "Cross-cluster distributed tracing." opentelemetry.io.

---

*Multi-Cluster Federation -- Module 5: FoxCompute Integration Architecture. The spaces between the chips are where the magic happens. Agnus doesn't need to know what Denise is rendering. The bus speaks. The chips listen. Complexity emerges from faithfully simple interfaces faithfully honored.*
