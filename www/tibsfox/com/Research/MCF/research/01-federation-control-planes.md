# Federation Control Planes

> **Domain:** Multi-Cluster Kubernetes Federation
> **Module:** 1 -- Control Plane Architecture and Workload Propagation
> **Through-line:** *A single control plane is a single point of failure that does not know the shape of the land it governs.* Federation is the architectural recognition that distributed systems should be distributed -- peers who speak a common protocol, maintain their own sovereignty, and cooperate on terms they negotiate. The KubeFed project tried and failed. Three successors carry the lesson forward.

---

## Table of Contents

1. [The Multi-Cluster Problem](#1-the-multi-cluster-problem)
2. [The KubeFed Lineage](#2-the-kubefed-lineage)
3. [Karmada: Centralized Propagation Model](#3-karmada-centralized-propagation-model)
4. [Liqo: Peer-to-Peer Virtual Kubelet Model](#4-liqo-peer-to-peer-virtual-kubelet-model)
5. [Admiralty: Scheduling-Layer Federation](#5-admiralty-scheduling-layer-federation)
6. [Architectural Comparison Matrix](#6-architectural-comparison-matrix)
7. [Scalability Analysis](#7-scalability-analysis)
8. [Failover Behavior and Split-Brain](#8-failover-behavior-and-split-brain)
9. [Push vs Pull Connection Modes](#9-push-vs-pull-connection-modes)
10. [Federation and the Amiga Principle](#10-federation-and-the-amiga-principle)
11. [PropagationPolicy Deep Dive](#11-propagationpolicy-deep-dive)
12. [Cluster Affinity and Workload Placement](#12-cluster-affinity-and-workload-placement)
13. [FoxCompute Phase-1 Recommendation](#13-foxcompute-phase-1-recommendation)
14. [Cross-References](#14-cross-references)
15. [Sources](#15-sources)

---

## 1. The Multi-Cluster Problem

Kubernetes was designed to orchestrate containers inside a single administrative domain. It does this remarkably well. But the assumption of a single administrative domain breaks down the moment your infrastructure spans geographic boundaries, regulatory jurisdictions, or trust zones. A cluster in the Fraser Valley serving Coast Salish community data has fundamentally different sovereignty requirements than a GPU inference cluster in a downtown colocation facility. Pretending they are one pool is the wrong abstraction [1].

The multi-cluster problem has three dimensions that compound:

- **Workload placement:** Where should this container run? Constraints include hardware affinity (GPU, storage), data residency requirements, network proximity, and power availability.
- **Cross-cluster communication:** Once workloads are distributed, how do services in Cluster A talk to services in Cluster B securely, observably, and with acceptable latency?
- **Operational coherence:** How do you maintain consistent configuration, RBAC, and observability across clusters without creating a single point of failure that defeats the purpose of distribution?

Each dimension has its own tool ecosystem. Federation handles the first. Service mesh handles the second. GitOps and observability handle the third. This module covers the first: the control plane that decides where workloads run.

```
THE MULTI-CLUSTER PROBLEM SPACE
================================================================

  SINGLE CLUSTER (what K8s was designed for):
  +---------------------------------------------+
  | One etcd, one apiserver, one scheduler       |
  | All nodes see the same control plane         |
  | Network is flat, all pods can reach all pods  |
  | RBAC is unified, one admin domain            |
  +---------------------------------------------+

  MULTI-CLUSTER (what FoxCompute needs):
  +----------------+    +----------------+    +----------------+
  | Cluster: Valley |    | Cluster: Edge  |    | Cluster: Coast |
  | Own etcd        |    | Own etcd       |    | Own etcd       |
  | Own apiserver   |    | Own apiserver  |    | Own apiserver  |
  | GPU workloads   |    | Inference only |    | Sovereign data |
  +----------------+    +----------------+    +----------------+
         |                      |                      |
         +------[ Federation Control Plane ]----------+
         +------[ Service Mesh East-West ]------------+
         +------[ GitOps Fleet Management ]-----------+
```

> **SAFETY WARNING:** Multi-cluster architectures introduce failure modes that do not exist in single-cluster deployments. Network partitions between clusters can cause split-brain scenarios where federation control planes make contradictory placement decisions. Any federation strategy must include explicit split-brain handling or the architecture becomes less reliable than the single cluster it replaced.

---

## 2. The KubeFed Lineage

KubeFed (Federation v1 and v2) was the Kubernetes SIG's official answer to multi-cluster management. It was the canonical project from 2016 through 2022. It was archived because it failed at three things simultaneously [2]:

### Why KubeFed Failed

1. **API Surface Burden:** KubeFed introduced federated resource types (FederatedDeployment, FederatedService, FederatedConfigMap) that mirrored but did not match standard Kubernetes resources. Every user migrating from single-cluster had to learn a parallel API. The cognitive overhead was prohibitive for adoption.

2. **Lack of Extensibility:** The federated resource model was rigid. Custom resources required manual template creation. The community couldn't extend it fast enough to keep up with the upstream Kubernetes release cadence. Highly divergent forks emerged (kubefed2, admiralty, etc.), fragmenting the community.

3. **Community Failure:** KubeFed never built a sustainable contributor base. The SIG Multicluster working group identified this explicitly in the archive decision: the project had too few active maintainers and too many competing visions [2].

### The Successor Landscape

Three actively maintained projects emerged from KubeFed's archive, each taking a fundamentally different architectural approach:

| Successor | Model | Key Mechanism | CNCF Status |
|-----------|-------|---------------|-------------|
| Karmada | Centralized control plane | PropagationPolicy + OverridePolicy | Incubating |
| Liqo | P2P virtual kubelet | Namespace-based offloading via VK | Sandbox |
| Admiralty | Scheduling-layer federation | Proxy pods + delegate pods | Independent |

The architectural split is not superficial. It reflects a genuine disagreement about the right abstraction layer for multi-cluster:

- **Karmada** says: "Give me a central control plane with its own etcd, and I will propagate resources to member clusters using policies."
- **Liqo** says: "Let clusters peer with each other like internet ASes, and collapse remote capacity to local virtual nodes."
- **Admiralty** says: "Don't change the control plane at all. Just intercept scheduling decisions and redirect pods to remote clusters."

---

## 3. Karmada: Centralized Propagation Model

Karmada (Kubernetes Armada) is a CNCF Incubating project that provides a centralized multi-cluster management system [3]. Its architecture mirrors a standard Kubernetes cluster: it has its own apiserver, scheduler, controller manager, and etcd. But instead of managing pods and nodes, it manages the propagation of Kubernetes resources to member clusters.

### Architecture

```
KARMADA ARCHITECTURE
================================================================

  +--[ Karmada Control Plane ]--+
  | karmada-apiserver            |
  | karmada-controller-manager   |
  | karmada-scheduler            |
  | karmada-etcd                 |
  | karmada-webhook              |
  +-----------------------------+
       |           |           |
       | Push      | Push      | Pull (agent)
       v           v           v
  [Cluster A]  [Cluster B]  [Cluster C]
  karmada-agent  karmada-agent  karmada-agent
  (optional)     (optional)     (required for Pull)
```

### Key APIs

Karmada introduces three primary custom resources [3, 4]:

- **ResourceTemplate:** A standard Kubernetes resource (Deployment, Service, ConfigMap) submitted to the Karmada apiserver. No modification required -- you submit the same YAML you would submit to a regular cluster.
- **PropagationPolicy:** Defines which clusters should receive the resource, with constraints: cluster affinity labels, replica scheduling (static weight or dynamic division), failover behavior.
- **OverridePolicy:** Modifies resources on a per-cluster basis. For example, different image registries per cluster, different resource limits for GPU vs. CPU clusters, or different environment variables for data residency compliance.

### Connection Modes

Karmada supports two modes for connecting member clusters [3]:

- **Push mode:** The Karmada control plane directly accesses member cluster apiservers. Simpler to operate but requires network connectivity and credential management from the control plane to every member.
- **Pull mode:** A `karmada-agent` runs inside the member cluster and pulls work from the control plane. Works through firewalls and NAT. Suitable for edge clusters with intermittent connectivity -- a critical requirement for FoxCompute's rural PNW nodes.

### Scheduling Model

Karmada's scheduler supports multi-dimensional scheduling decisions [4]:

- **Cluster resources:** Available CPU, memory, GPU capacity per member cluster
- **Fault domains:** Spreading replicas across failure boundaries (geographic, provider, rack)
- **Kubernetes version:** Target clusters meeting minimum API version requirements
- **Add-on availability:** GPU device plugin present, specific CSI driver available
- **Weighted replica division:** Split 6 replicas as 3:2:1 across three clusters based on capacity labels

### Scalability

The Karmada project published a scalability test report in October 2022 demonstrating operation across 100 large-scale member clusters. Key findings [5]:

- API call latency during resource distribution remained within reasonable ranges across all 100-cluster test scenarios
- Control plane resource consumption scales with the number of multi-cluster applications, not with the number of member clusters -- a significant architectural property
- The dedicated etcd isolates Karmada state from member cluster state, preventing cascading write amplification

---

## 4. Liqo: Peer-to-Peer Virtual Kubelet Model

Liqo (short for "liquid computing") is a CNCF Sandbox project that takes a fundamentally different approach from Karmada. Where Karmada centralizes control, Liqo decentralizes it: clusters peer with each other like autonomous systems on the internet, advertising capacity and accepting offloaded workloads [6].

### Architecture

```
LIQO PEERING ARCHITECTURE
================================================================

  [Cluster A: Valley-Prime]           [Cluster B: Valley-Secondary]
  +------------------------+         +---------------------------+
  | Liqo Controller Mgr    |<------->| Liqo Controller Mgr       |
  | Virtual Kubelet (VK)   |         | Virtual Kubelet (VK)       |
  | Network Fabric Module  |         | Network Fabric Module      |
  |                        |         |                            |
  | VK-B (virtual node     |         | VK-A (virtual node         |
  |  representing Cluster B)|         |  representing Cluster A)   |
  +------------------------+         +---------------------------+
         |                                     |
         +----[ mDNS / DNS Discovery ]--------+
         +----[ WireGuard / Network Fabric ]--+
```

### The Virtual Kubelet Mechanism

Liqo's core innovation is the Virtual Kubelet (VK) abstraction. When Cluster A peers with Cluster B, a virtual node appears in Cluster A that represents Cluster B's available resources. The Kubernetes scheduler in Cluster A treats this virtual node like any other node -- it can schedule pods onto it. When a pod is scheduled to the virtual node, Liqo's Virtual Kubelet creates the actual pod in Cluster B [6].

This is architecturally elegant for three reasons:

1. **No K8s API modifications required.** Standard kubectl, standard Deployment specs, standard scheduling. The virtual node is just another node.
2. **Per-namespace policies.** Liqo allows namespace-level offloading policies that select eligible remote clusters by label. This maps naturally to FoxCompute's Amiga-node role differentiation: GPU namespaces can target Denise-class clusters, data pipeline namespaces can target Paula-class clusters.
3. **CNI-agnostic network fabric.** Liqo provides an integrated network fabric that works across heterogeneous CNI implementations. Cluster A running Cilium and Cluster B running Calico can still peer.

### Performance

Liqo's published benchmarks (April 2022) demonstrate [7]:

- Pod offloading overhead of a few milliseconds compared to vanilla Kubernetes, even at 10,000 pods
- Application reliability mechanisms during split-brain conditions (Cluster A continues operating if Cluster B becomes unreachable)
- Head-to-head comparison with Admiralty and tensile-kube showing Liqo maintaining acceptable performance at high pod-offloading volumes where Admiralty's overhead became unbearable

### The Liquid Computing Vision

Liqo's design thesis: a workload should flow to wherever resources are available, constrained only by administrator-defined policies and data-placement requirements. The "liquid" metaphor is not decorative -- it describes a specific architectural property where compute capacity pools and drains across cluster boundaries based on demand, availability, and policy [6].

For FoxCompute, this maps to: solar-intermittent edge nodes advertise capacity when power is available and withdraw it when solar generation drops. Valley clusters absorb the overflow. The liquid computing model handles this gracefully because it was designed for exactly this kind of dynamic resource topology.

---

## 5. Admiralty: Scheduling-Layer Federation

Admiralty operates at the pod scheduling level without introducing a separate control plane [8]. Its mechanism:

1. Annotated pods become "proxy pods" scheduled on a virtual-kubelet node
2. Corresponding "delegate pods" are created in remote clusters
3. A feedback loop synchronizes status between proxy and delegate

### Architecture

Admiralty integrates with standard Kubernetes API resources (Deployments, Jobs) and supports cross-cloud scheduling including EKS, AKS, GKE, k3s, and on-premises clusters. It does not require modifications to Kubernetes APIs or custom resource definitions beyond its own scheduling annotations.

### Performance Concerns

Benchmarks from the Liqo architecture paper (arXiv 2204.05710) show significantly worse performance than Liqo when offloading high numbers of pods simultaneously [7]. The scheduling-layer approach creates a feedback loop with inherent latency: proxy pod creation triggers delegate pod creation triggers status synchronization back to proxy pod. At burst scale (e.g., launching 50 GPU inference pods simultaneously), this loop becomes the bottleneck.

For FoxCompute's burst-heavy GPU workload pattern (training jobs that need to spread across Denise-class nodes quickly), Admiralty's scaling characteristics are a concern. It remains viable for low-volume, steady-state cross-cluster scheduling but is not recommended for the FoxCompute prototype.

---

## 6. Architectural Comparison Matrix

| Dimension | Karmada | Liqo | Admiralty |
|-----------|---------|------|----------|
| CNCF Status | Incubating | Sandbox | Independent |
| Architecture | Centralized control plane | P2P peering | Scheduling-layer |
| Control Plane | Dedicated etcd + apiserver | Each cluster owns its CP | No additional CP |
| Resource Model | ResourceTemplate + PropagationPolicy | Namespace offloading via VK | Proxy/delegate pods |
| Scheduling | Multi-dimensional (resources, fault domains, versions) | Kubernetes-native (VK as node) | Annotation-driven |
| Failover | Automatic traffic redirect | Split-brain resilience | Status sync loop |
| Scalability | 100 clusters tested | 10,000 pods benchmarked | Limited at burst scale |
| Connection | Push or Pull mode | P2P via mDNS/DNS | Direct apiserver |
| Network | External (Cilium, Submariner) | Integrated fabric (CNI-agnostic) | External |
| Best For | Enterprise governance, uniform policy | Dynamic bursting, cloud-edge continuum | Low-volume cross-cloud |

---

## 7. Scalability Analysis

Scalability in federation has a different shape than scalability in a single cluster. The scaling dimension is not "how many pods" but "how many clusters, each with how many applications, with what communication pattern."

### Karmada Scalability

Karmada's centralized architecture means the control plane is the scaling bottleneck. However, the Karmada team's 100-cluster test demonstrated that the bottleneck scales with application count, not cluster count [5]. This is because:

- Each member cluster runs its own scheduler and kubelet -- Karmada does not replace these
- Karmada's etcd stores only propagation state (ResourceTemplates, PropagationPolicies), not pod-level state
- The control plane watches member cluster health, not individual pod health

For FoxCompute's 3-5 cluster prototype, Karmada's scalability is not a concern. For the eventual 10+ cluster topology, the architecture paper's findings suggest it will handle the load.

### Liqo Scalability

Liqo's P2P model means each cluster-to-cluster peering relationship adds a Virtual Kubelet instance. For N clusters in a full-mesh peering topology, each cluster runs N-1 Virtual Kubelets. This O(N^2) relationship is manageable at small scale (5 clusters = 4 VKs per cluster) but worth monitoring.

The published benchmark of 10,000 pods with millisecond-level overhead demonstrates that individual peering connections handle high throughput. The constraint is the number of peering relationships, not the throughput per relationship [7].

### Admiralty Scalability

Admiralty's proxy-delegate feedback loop introduces per-pod overhead that compounds with pod count. The arXiv paper (2204.05710) found that at high offloading volumes, Admiralty's overhead became "unbearable" -- a strong signal against adoption for burst workloads [7].

---

## 8. Failover Behavior and Split-Brain

Network partitions between clusters are not edge cases in the FoxCompute topology -- they are expected operating conditions. Rural PNW connectivity is intermittent. Solar-powered edge nodes have variable availability. The federation layer must handle cluster unreachability gracefully.

### Karmada Failover

Karmada implements automatic failover: when a member cluster becomes unreachable, the control plane reschedules affected workloads to healthy clusters. The mechanism uses cluster health checks (heartbeat-based) and PropagationPolicy failover rules. The operator can define failover priority order and minimum healthy cluster count [3, 4].

The risk: false positives on intermittent connections. A rural WireGuard tunnel that drops for 30 seconds should not trigger a full failover of GPU inference jobs. Karmada's heartbeat interval and failure threshold are configurable, but tuning them for intermittent WAN links requires operational experience.

### Liqo Split-Brain Resilience

Liqo's design explicitly addresses split-brain. When Cluster A loses connectivity to Cluster B [6]:

- Pods already running on Cluster B continue running (they are real pods on real nodes)
- Cluster A's Virtual Kubelet for Cluster B reports the virtual node as NotReady
- New pods are not scheduled to the unavailable cluster
- When connectivity restores, the VK reconciles state

This is the correct behavior for FoxCompute: running workloads survive partitions, new workloads are redirected, and reconnection is automatic. The tensile-kube project (an alternative Virtual Kubelet implementation) does NOT provide this split-brain resilience, which is why Liqo's architecture paper explicitly distinguishes them [7].

---

## 9. Push vs Pull Connection Modes

The connection model between the federation control plane and member clusters has significant implications for FoxCompute's network topology.

### Push Mode (Karmada)

The control plane directly accesses member cluster apiservers. This requires:

- Network path from control plane to every member cluster apiserver
- Credential management (kubeconfig or service account tokens) for every member
- Firewall rules allowing inbound connections to member clusters

For Valley clusters on a reliable LAN, Push mode is simpler and lower-latency.

### Pull Mode (Karmada)

A `karmada-agent` runs inside the member cluster and initiates outbound connections to the control plane. This requires:

- Outbound network access from the member cluster to the control plane (standard HTTPS)
- No inbound firewall rules on the member cluster
- Agent-based registration and heartbeat

For Edge-PNW clusters behind NAT or with intermittent connectivity, Pull mode is the correct choice. The agent initiates the connection, so it works through firewalls and reconnects automatically after outages.

### Liqo Peering

Liqo uses a P2P discovery mechanism (mDNS for local network, DNS for remote) followed by a mutual authentication exchange. Each cluster initiates its own side of the peering relationship. This is architecturally symmetric -- there is no "control plane" and "member" distinction. Both clusters advertise capacity, both can offload workloads [6].

For FoxCompute's eventual architecture (sovereign clusters cooperating as peers), Liqo's model maps more naturally to the long-term vision. For the Phase-1 prototype where operational simplicity matters, Karmada's centralized model with Pull mode for edge clusters is the pragmatic starting point.

---

## 10. Federation and the Amiga Principle

The Amiga Principle states that specialized execution paths, faithfully iterated, produce outcomes that general-purpose brute force cannot. In the Amiga computer, Agnus handled DMA and memory access, Denise handled video output, and Paula handled audio and I/O. The 68000 CPU was freed to think because the custom chips handled everything else [9].

The FoxCompute federated cluster topology maps this directly:

| Amiga Chip | FoxCompute Cluster Role | Workload Class |
|------------|------------------------|----------------|
| Agnus | Control-plane cluster (Valley-Prime) | etcd, apiserver, Karmada control plane, ArgoCD |
| Denise | GPU inference cluster (Valley-Secondary) | Training jobs, inference serving, model pipelines |
| Paula | Data fabric cluster (dedicated storage) | Data pipelines, persistent volumes, backup/restore |
| 68000 | Edge gateway cluster (Edge-PNW) | Lightweight inference, API gateway, sensor ingest |

The federation layer is the chip bus -- the communication substrate that lets each specialized cluster do its work without knowing the internal details of the others. Karmada's PropagationPolicy is the equivalent of Agnus's DMA pointer registers: it directs workloads to the right execution substrate without the workload needing to know which cluster it will land on.

---

## 11. PropagationPolicy Deep Dive

PropagationPolicy is Karmada's primary mechanism for workload placement. It is a custom resource that binds to Kubernetes resources (Deployments, Services, ConfigMaps) and specifies where they should run [3, 4].

### Structure

```
apiVersion: policy.karmada.io/v1alpha1
kind: PropagationPolicy
metadata:
  name: gpu-inference-policy
spec:
  resourceSelectors:
    - apiVersion: apps/v1
      kind: Deployment
      labelSelector:
        matchLabels:
          workload-class: gpu-inference
  placement:
    clusterAffinity:
      clusterNames:
        - valley-secondary
      matchExpressions:
        - key: node-role
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
```

### Workload Classes

For FoxCompute, three workload classes require distinct PropagationPolicies:

1. **GPU-affinity workloads:** Must run on Denise-class clusters with NVIDIA device plugin. Hard affinity constraint -- these cannot fall back to CPU clusters without explicit override.
2. **Storage-locality workloads:** Data pipeline stages that must be co-located with persistent storage. Paula-class clusters with NFS/Ceph/Longhorn backends.
3. **Cluster-local workloads:** Sovereignty-constrained workloads that must never leave their originating cluster. Hard affinity + explicit `spreadConstraints` preventing propagation.

---

## 12. Cluster Affinity and Workload Placement

Cluster affinity in Karmada supports label-based selection, explicit cluster naming, and exclusion lists [4]. For FoxCompute:

### Label Schema

```
# Valley-Prime (Agnus role)
labels:
  foxcompute.io/role: agnus
  foxcompute.io/zone: valley
  foxcompute.io/tier: control-plane
  foxcompute.io/connectivity: reliable
  foxcompute.io/sovereignty: none

# Edge-PNW (68000 role)
labels:
  foxcompute.io/role: 68000
  foxcompute.io/zone: edge
  foxcompute.io/tier: inference
  foxcompute.io/connectivity: intermittent
  foxcompute.io/sovereignty: indigenous-data
```

### Sovereignty Enforcement

The `foxcompute.io/sovereignty` label enables PropagationPolicy constraints that prevent sovereign data from leaving designated clusters. This is not a soft preference -- it is a hard affinity constraint that blocks propagation. See Module 4 (Day-2 Operations) for the full data sovereignty control map.

> **SAFETY WARNING:** Sovereignty constraints must be architecturally enforced, not policy-only. A PropagationPolicy soft preference can be overridden by scheduler pressure. Only hard affinity constraints (`clusterAffinity` with explicit `clusterNames` or `matchExpressions`) provide the guarantee that OCAP-governed data stays within designated cluster boundaries.

---

## 13. FoxCompute Phase-1 Recommendation

Based on the analysis of Karmada, Liqo, and Admiralty:

### Recommendation: Karmada + Liqo Dual Stack

**Phase 1 (2-cluster prototype):** Karmada for centralized workload propagation. Karmada's operational simplicity, tested scalability to 100 clusters, and familiar K8s-like API model make it the correct choice for a small team building a prototype. Push mode for the Valley-Prime to Valley-Secondary connection; Pull mode ready for future Edge-PNW addition.

**Phase 2 (dynamic burst/offload):** Add Liqo peering for dynamic burst capacity. When solar-intermittent edge nodes come online, Liqo's virtual kubelet model allows them to advertise capacity dynamically. Karmada handles the planned, policy-governed placement; Liqo handles the opportunistic, capacity-driven overflow.

**Admiralty:** Not recommended for FoxCompute. The scheduling-layer approach does not scale to burst GPU workloads, and the lack of integrated network fabric creates additional operational burden.

---

## 14. Cross-References

> **Related:** [Service Mesh Cross-Cluster](02-service-mesh-cross-cluster.md) -- how services communicate across the cluster boundaries that federation creates. [Network Fabric & CNI](03-network-fabric-cni.md) -- the eBPF layer that Cilium provides beneath both federation and mesh. [FoxCompute Integration](05-foxcompute-integration.md) -- synthesis of federation and mesh decisions into the Amiga-principle topology.

**Series cross-references:**
- **K8S (Kubernetes Core):** Foundation layer that federation extends to multi-cluster
- **SYS (Systems Administration):** Operational context for cluster management, monitoring, and provisioning
- **GSD2 (GSD CLI):** Multi-cluster commands will consume the federation topology defined here
- **CMH (Cryptographic Methods):** mTLS and certificate management underpinning cross-cluster identity
- **OCN (Ocean Networks):** Distributed system patterns that parallel multi-cluster federation
- **BRC (Burning Man):** Trust and federation models that map to regional burn sovereignty
- **NND (Neural Network Design):** GPU workload scheduling that federation enables across clusters
- **MCM (Multi-Cloud Management):** Broader context of managing workloads across infrastructure boundaries

---

## 15. Sources

1. CNCF Blog. "Simplifying multi-clusters in Kubernetes." Arbezzano, Palesandro. January 2024. cncf.io.
2. CNCF Blog. "Karmada and OCM: two new approaches to multicluster fleet management." Eads, Wang. September 2022. cncf.io.
3. Karmada Project. Official documentation. karmada.io. GitHub: github.com/karmada-io/karmada.
4. Karmada v1.11 Release Blog. Multi-cluster rolling upgrades, blue-green and canary across clusters. karmada.io/blog.
5. Karmada Scalability Test Report. "Testing Karmada with 100 large-scale clusters." October 2022. karmada.io.
6. Liqo Project. Official documentation. liqo.io. GitHub: github.com/liqotech/liqo.
7. Iorio, M. et al. "Computing Without Borders: The Way Towards Liquid Computing." arXiv 2204.05710. Includes head-to-head comparison with Admiralty and tensile-kube.
8. Admiralty Project. Official documentation. admiralty.io. GitHub: github.com/admiraltyio/admiralty.
9. Miner, J. et al. Amiga Hardware Reference Manual. Commodore-Amiga Inc., 1985. Custom chip architecture: Agnus (DMA/memory), Denise (video), Paula (audio/IO).
10. Qovery. "Kubernetes multi-cluster: the day-2 enterprise strategy." March 2026. qovery.com.
11. Virtual Kubelet Project. github.com/virtual-kubelet/virtual-kubelet. Foundation for Liqo's peering mechanism.
12. Introl. "Kubernetes for GPU Orchestration." Including multi-cluster federation patterns. February 2026. introl.com.
13. Karmada Community. PropagationPolicy API Reference. karmada.io/docs/userguide/scheduling.
14. CNCF Landscape. Multi-cluster management category. landscape.cncf.io.
15. Iorio, M. et al. "Benchmarking Liqo: Kubernetes Multi-Cluster Performance." Liqo Blog / Medium. April 2022.
16. Tetrate. "Seamless Cross-Cluster Connectivity for Multicluster Istio Service Mesh Deployments." July 2024. tetrate.io.

---

*Multi-Cluster Federation -- Module 1: Federation Control Planes. The cluster bus speaks. The specialized nodes listen. Complexity emerges from faithfully simple interfaces faithfully honored.*
