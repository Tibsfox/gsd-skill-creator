# Service Mesh Cross-Cluster Patterns

> **Domain:** Multi-Cluster Kubernetes Service Communication
> **Module:** 2 -- East-West Traffic, mTLS, and Mesh Architecture
> **Through-line:** *Federation decides where workloads run. The mesh decides how they talk.* Cross-cluster service communication is the unsolved integration problem at the heart of distributed Kubernetes -- not because the protocols are missing, but because three radically different architectural approaches (sidecar proxy, service mirroring, eBPF kernel intercept) each make different trade-offs that compound across cluster boundaries.

---

## Table of Contents

1. [The East-West Communication Problem](#1-the-east-west-communication-problem)
2. [Service Mesh Fundamentals](#2-service-mesh-fundamentals)
3. [Istio Multi-Cluster Architecture](#3-istio-multi-cluster-architecture)
4. [Istio Ambient Mesh](#4-istio-ambient-mesh)
5. [Linkerd Service Mirroring](#5-linkerd-service-mirroring)
6. [Cilium Service Mesh and ClusterMesh](#6-cilium-service-mesh-and-clustermesh)
7. [Performance Comparison Matrix](#7-performance-comparison-matrix)
8. [mTLS and Workload Identity](#8-mtls-and-workload-identity)
9. [SPIFFE and SPIRE](#9-spiffe-and-spire)
10. [Cross-Cluster Load Balancing](#10-cross-cluster-load-balancing)
11. [Mesh Selection for FoxCompute](#11-mesh-selection-for-foxcompute)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. The East-West Communication Problem

In Kubernetes networking, "north-south" traffic flows between external clients and cluster services (ingress/egress). "East-west" traffic flows between services within and across clusters. North-south has a mature solution stack (Ingress controllers, Gateway API, external load balancers). East-west across cluster boundaries does not [1].

The problem is not that services cannot reach each other -- raw network connectivity (VPN, WireGuard, direct peering) can provide IP reachability between any two pods in any two clusters. The problem is that raw reachability is not enough. Production east-west traffic requires:

- **Identity:** Who is this service? Not "what IP address does it have" (IPs are ephemeral in K8s) but "what workload identity has been cryptographically attested?"
- **Encryption:** All cross-cluster traffic must be encrypted in transit. mTLS is the standard.
- **Policy:** Which services are allowed to talk to which? L3/L4 network policies are insufficient -- you need L7 HTTP-aware policies (specific endpoints, methods, headers).
- **Observability:** What traffic is flowing between clusters? Latency, error rates, throughput per service pair.
- **Load balancing:** When a service has instances in multiple clusters, how are requests distributed?

```
EAST-WEST TRAFFIC ACROSS CLUSTER BOUNDARIES
================================================================

  Cluster A (Valley-Prime)              Cluster B (Valley-Secondary)
  +------------------------+           +---------------------------+
  |  [Service: api-gateway] |           |  [Service: inference-engine]|
  |       Pod A1, A2        | ------->  |       Pod B1, B2, B3       |
  |                         |  mTLS     |                            |
  |  [Sidecar / eBPF]       |  L7 policy|  [Sidecar / eBPF]          |
  +------------------------+           +---------------------------+

  The arrow is where the complexity lives:
  - Who issued the TLS certificate?
  - Who enforces the authorization policy?
  - Where does the load balancing decision happen?
  - Where does the observability data go?
  - What happens when Cluster B is unreachable?
```

---

## 2. Service Mesh Fundamentals

A service mesh is a dedicated infrastructure layer that handles service-to-service communication. It decouples communication concerns (encryption, observability, routing, retries) from application code. The mesh has two planes [2]:

### Control Plane

Manages configuration, distributes certificates, and pushes policy to the data plane. In Istio, this is Istiod. In Linkerd, this is the control plane set (destination, identity, proxy-injector). In Cilium, the control plane is the Cilium agent itself running on each node.

### Data Plane

Intercepts and processes traffic. Three architectural approaches:

1. **Sidecar proxy (Istio classic, Linkerd):** An Envoy or linkerd2-proxy container injected alongside each application pod. Every network call passes through the sidecar. Full L7 visibility and control. Overhead: additional container per pod, CPU and memory consumption, latency of proxy hop.

2. **Per-node proxy (Cilium, Istio Ambient):** A single proxy instance per node instead of per pod. Reduces resource overhead proportional to pod density. Cilium uses eBPF programs in the kernel for L3-L4 processing and Envoy per-node for L7. Ambient Mesh uses ztunnel (zero-trust tunnel) per node.

3. **Kernel-level intercept (Cilium eBPF):** eBPF programs attached to network hooks in the Linux kernel process traffic without any userspace proxy. The fastest possible path -- no context switches, no userspace copies. Limited to L3-L4 policy without Envoy augmentation.

---

## 3. Istio Multi-Cluster Architecture

Istio supports two primary multi-cluster deployment models [3]:

### Primary-Remote

One cluster runs the full Istiod control plane ("primary"). Other clusters connect as "remote" -- their sidecar proxies receive configuration from the primary cluster's Istiod. Cross-cluster traffic routes through east-west gateways.

Advantages: Single control plane to manage. Consistent policy across all clusters.
Disadvantages: Primary cluster is a single point of failure for mesh configuration. Remote clusters cannot operate independently during network partitions.

### Multi-Primary

Each cluster runs its own Istiod instance. All Istiod instances share a common root CA certificate for mTLS. Cross-cluster service discovery happens through Istio's remote secret mechanism (each cluster registers its apiserver endpoint with other clusters).

Advantages: Each cluster is independently operational. No single point of failure.
Disadvantages: Configuration must be synchronized across control planes. Namespace sameness is required for cross-cluster load balancing (a service named `inference-engine` in namespace `ml` must be in the same namespace in all clusters).

### East-West Gateways

Cross-cluster traffic in Istio flows through dedicated east-west gateways -- separate from the north-south ingress gateways. These gateways:

- Terminate mTLS from the source cluster
- Re-establish mTLS to the destination cluster
- Perform cross-cluster service discovery
- Apply traffic policies (canary routing, fault injection, circuit breaking) at the cluster boundary

### Traffic Management

Istio's `MeshConfig.serviceSettings.clusterLocal` flag allows marking services as cluster-local -- traffic stays within the originating cluster regardless of cross-cluster service availability. This is the mechanism for sovereignty enforcement at the mesh layer [3].

Subset-based routing can differentiate cluster-specific service variants, but this mixes service-level and topology-level policy, increasing manifest complexity. For FoxCompute's operational model (small team, 3-5 clusters), this complexity is a significant concern.

### 2025 Status

Istio graduated to CNCF in 2025 [4]. Ambient Mesh (sidecar-free) is advancing toward mainstream. The Kiali observability UI supports multi-cluster Istio with Cluster Boxes and Namespace Boxes for cross-cluster traffic visualization (stable since May 2025) [5].

---

## 4. Istio Ambient Mesh

Ambient Mesh represents Istio's architectural response to the sidecar overhead problem. Instead of injecting a sidecar proxy into every pod, Ambient Mesh uses two new components [4, 6]:

### ztunnel (Zero-Trust Tunnel)

A per-node proxy that handles L4 mTLS encryption and basic identity-based authorization. Every node runs one ztunnel instance. All pod traffic is transparently intercepted and encrypted. This provides the security baseline (mTLS everywhere) without per-pod sidecar overhead.

### Waypoint Proxy

An optional per-namespace or per-service Envoy instance that provides full L7 processing (HTTP routing, header-based policies, retry logic, observability). Waypoint proxies are deployed only where L7 functionality is needed -- not everywhere.

### The Two-Layer Model

```
ISTIO AMBIENT MESH ARCHITECTURE
================================================================

  Layer 1: ztunnel (always on, every node)
  - L4 mTLS encryption
  - Identity-based authorization
  - TCP connection metrics
  - Minimal overhead (~0 per pod)

  Layer 2: Waypoint (opt-in, per namespace/service)
  - Full L7 HTTP/gRPC processing
  - Request-level policies
  - Retries, timeouts, circuit breaking
  - Header-based routing
  - Only deployed where needed
```

For FoxCompute, Ambient Mesh is appealing because it separates security (always on) from L7 features (opt-in). Edge clusters running lightweight inference workloads get mTLS without sidecar overhead. Valley clusters running complex API services get full L7 when needed. However, Ambient Mesh multi-cluster support is still maturing -- the east-west gateway story is less proven than classic Istio.

---

## 5. Linkerd Service Mirroring

Linkerd's multi-cluster architecture is built on two components: Service Mirror and Gateway [7].

### Service Mirror

A controller running in the source cluster that watches a target cluster for service updates. When a service in Cluster B is annotated with `mirror.linkerd.io/exported`, the Service Mirror creates a corresponding service in Cluster A. This mirrored service routes traffic through the target cluster's gateway.

### Gateway

A dedicated proxy in the target cluster that receives cross-cluster requests from source clusters. The gateway authenticates incoming requests using the shared trust anchor (root CA certificate) and forwards them to the local service.

### The Opt-In Model

Linkerd's service mirroring is explicitly opt-in. Only services annotated with `mirror.linkerd.io/exported` are exposed across cluster boundaries. This is a significant operational advantage [7]:

- **Explicit:** An operator must deliberately choose to expose each service. There is no "accidentally exposed" state.
- **Auditable:** A simple query for the annotation reveals exactly which services are cross-cluster visible.
- **Minimal attack surface:** Unexposed services are invisible across cluster boundaries, even if network connectivity exists.

For FoxCompute's sovereignty requirements, this opt-in model maps perfectly. Data pipeline services that must remain cluster-local simply never get the annotation. Inference services that need cross-cluster load balancing are explicitly annotated.

### Performance

Linkerd consistently benchmarks as the fastest service mesh [8, 9]:

- 25-35% faster than Istio in latency-sensitive workloads
- Faster than Cilium in most scenarios except high-connection-count internal traffic (where Cilium's eBPF path wins)
- Rust-based linkerd2-proxy (not Envoy) -- purpose-built for the sidecar use case with minimal memory footprint

### Each Cluster Maintains Its Own Control Plane

Linkerd multi-cluster does not share control planes. Each cluster runs its own complete Linkerd installation. This improves fault isolation -- a control plane bug or resource exhaustion in Cluster A does not affect Cluster B. The only shared element is the root CA certificate (trust anchor) [7].

---

## 6. Cilium Service Mesh and ClusterMesh

Cilium operates at a fundamentally different layer than Istio or Linkerd. Instead of userspace proxy injection, Cilium uses eBPF programs compiled into the Linux kernel to intercept, process, and route network traffic [10].

### eBPF-Native L3-L4

At the L3-L4 layer, Cilium replaces kube-proxy entirely. Service discovery, load balancing, and network policy enforcement happen in kernel space. No context switches to userspace. No proxy container. For high-throughput east-west traffic (e.g., GPU inference nodes exchanging model weights), this is the fastest possible path.

### Per-Node Envoy for L7

When L7 processing is needed (HTTP routing, header inspection, gRPC-level load balancing), Cilium deploys Envoy per-node (not per-pod). This is a middle path: richer than pure eBPF, but lighter than per-pod sidecar injection. CiliumNetworkPolicies support L7 HTTP inspection for API-level access control across cluster boundaries [10].

### ClusterMesh

Cilium ClusterMesh is the multi-cluster mechanism. See Module 3 (Network Fabric & CNI) for the deep dive. At the service mesh layer, ClusterMesh enables:

- Pod-to-pod communication across cluster boundaries at native eBPF speed
- Global services that load-balance across clusters at the kernel level
- Unified identity model enforcing policies based on cryptographic workload identity across all clusters

### Performance Data

Financial services and real-time data platforms have reported 40-60% reduction in network overhead compared to traditional sidecar proxies when using Cilium's eBPF mode [11]. The Red Hat Research ICPE 2025 study (Toronto, 16 EU-funded partners) provides controlled benchmarks comparing Cilium, Submariner, and Skupper for multi-cluster networking [12].

---

## 7. Performance Comparison Matrix

| Dimension | Istio | Linkerd | Cilium |
|-----------|-------|---------|--------|
| Latency overhead | 25-35% vs baseline | Best (baseline reference) | 20-40% (eBPF mode best) |
| Multi-cluster model | East-west gateways | Service mirroring | ClusterMesh (eBPF) |
| Sidecar-free option | Ambient Mesh (2025) | No (Rust micro-proxy) | Yes (eBPF native) |
| Operational complexity | High | Low | Medium |
| CNCF status | Graduated (2025) | Graduated | Graduated |
| L7 policy | Full (Envoy) | Limited | Via per-node Envoy |
| mTLS model | Istiod CA or SPIRE | Linkerd identity (per-cluster) | Cilium CA + SPIRE integration |
| Observability | Kiali, Prometheus, Jaeger | Linkerd Viz, Grafana | Hubble, Hubble Relay |
| Memory per pod | ~50MB (Envoy sidecar) | ~10MB (linkerd2-proxy) | 0 (eBPF) / ~30MB (per-node Envoy) |
| High-connection perf | Moderate | Good | Best (kernel-space LB) |
| Best for FoxCompute | Large-scale future | Phase-1 simplicity | CNI + mesh unified |

> **SAFETY WARNING:** Performance benchmarks vary significantly by workload profile. The numbers above represent ranges from multiple independent sources. Always benchmark with representative FoxCompute workloads before making production decisions. A mesh that is fastest for HTTP microservices may not be fastest for gRPC model-serving traffic.

---

## 8. mTLS and Workload Identity

Mutual TLS (mTLS) is the foundation of service mesh security. Both sides of every connection present certificates, proving their identity. In a multi-cluster environment, the trust model for certificate issuance becomes the critical design decision [2, 3, 7].

### Certificate Authority Architecture

Three models:

1. **Shared root CA (Linkerd, Cilium ClusterMesh):** All clusters share a single root CA certificate. Per-cluster intermediate CAs issue leaf certificates. Cross-cluster mTLS works because all leaf certificates chain to the same root. The shared root is the secret that binds the mesh.

2. **Federated CA (Istio + SPIRE):** Each cluster has its own trust domain. SPIFFE federation allows workload identities from different trust domains to verify each other. More complex but supports stronger isolation between clusters.

3. **Mesh-internal CA (Istio, Linkerd):** The mesh control plane acts as the CA, issuing short-lived certificates to each workload. Certificate rotation is automatic. No external PKI required for single-cluster; multi-cluster requires trust anchor distribution.

### Certificate Lifecycle

- **Issuance:** Automatic at pod startup. The mesh control plane issues a certificate based on the pod's Kubernetes service account.
- **Rotation:** Automatic before expiry. Typical rotation period: 24 hours (Istio default), 1 hour (configurable). Short-lived certificates limit the window of exposure if a certificate is compromised.
- **Revocation:** Implicit through short-lived certificates. Instead of maintaining a CRL (Certificate Revocation List), the mesh simply stops issuing certificates for decommissioned workloads.

> **SAFETY WARNING:** Shared CA certificates for ClusterMesh must be managed with extreme care. A compromised root CA certificate allows impersonation of any workload in any cluster. Automated rotation with short-lived certificates (cronJob-based) is the documented mitigation pattern. Manual certificate management is not acceptable for production multi-cluster deployments.

---

## 9. SPIFFE and SPIRE

SPIFFE (Secure Production Identity Framework for Everyone) provides a standard for workload identity that works across heterogeneous platforms -- Kubernetes, VMs, bare metal, multiple clusters, multiple clouds [13].

### SPIFFE IDs

A workload identity expressed as a URI:

```
spiffe://foxcompute.io/cluster/valley-prime/ns/ml/sa/inference-engine
```

Components:
- `foxcompute.io` -- Trust domain (the organizational boundary)
- `cluster/valley-prime` -- Cluster identifier
- `ns/ml` -- Kubernetes namespace
- `sa/inference-engine` -- Kubernetes service account

### SPIRE (SPIFFE Runtime Environment)

SPIRE is the reference implementation of SPIFFE. It consists of:

- **SPIRE Server:** Runs per trust domain (or per cluster). Issues SVIDs (SPIFFE Verifiable Identity Documents) -- X.509 certificates or JWT tokens.
- **SPIRE Agent:** Runs per node. Attests workload identity using kernel-level information (cgroups, namespaces, binary hashes).

### Cross-Cluster Federation

SPIRE supports trust domain federation: two SPIRE servers exchange trust bundles, allowing workloads in Trust Domain A to verify certificates issued by Trust Domain B. This is the mechanism for cross-cluster mTLS without a shared root CA [13].

For FoxCompute, SPIFFE/SPIRE provides the identity layer that sits beneath both the federation layer (Karmada/Liqo) and the mesh layer (Cilium/Linkerd). When a workload in the Edge-PNW cluster calls an inference service in Valley-Secondary, SPIFFE provides the cryptographic proof of "who is calling" that the mesh uses for authorization decisions.

### Integration Points

- **Istio:** SPIRE replaces Istio's built-in certificate authority. Native integration since Istio 1.14 (replacing the deprecated Kubernetes Workload Registrar).
- **Cilium:** Cilium supports SPIFFE-compatible identity for cross-cluster policies.
- **Linkerd:** Linkerd uses its own identity system but can integrate with external CAs via trust anchors.

---

## 10. Cross-Cluster Load Balancing

When a service has instances in multiple clusters, the load balancing decision determines which instance handles each request. Three models [3, 7, 10]:

### Locality-Aware (Istio)

Istio's locality load balancing prefers endpoints in the same zone/region as the caller. Cross-cluster endpoints are used only when local capacity is exhausted or failing. Configuration: `DestinationRule` with `localityLbSetting`.

### Mirror-Based (Linkerd)

Linkerd mirrors remote services as local services with a `-federated` suffix. Traffic to the federated service is distributed across all endpoints (local and remote). The gateway in each cluster handles traffic admission. Load distribution follows Kubernetes service load balancing semantics.

### Kernel-Level (Cilium)

Cilium's global services (annotated with `service.cilium.io/global: "true"`) are load-balanced at the eBPF level in kernel space. The load balancing decision happens before the packet leaves the kernel -- no userspace hop. For high-throughput east-west traffic, this is the lowest-latency option. Cilium supports weighted load balancing across clusters based on custom annotations [10].

### FoxCompute Load Balancing Strategy

The recommended approach: Cilium ClusterMesh for L3-L4 load balancing (kernel-speed, global service discovery) with Linkerd opt-in service mirroring for specific services requiring L7 traffic management (canary routing, request-level metrics). This layered approach avoids the operational complexity of Istio while providing full capability where needed.

### Health-Aware Cross-Cluster Routing

All three mesh implementations support health-checking remote endpoints. The health check mechanism differs:

- **Istio:** Envoy active health checks (HTTP GET or TCP connect) configurable per DestinationRule. Unhealthy endpoints are ejected from the load balancing pool for a configurable outlier detection window [3].
- **Linkerd:** Gateway health checks. If the gateway in a target cluster becomes unreachable, the source cluster's Service Mirror stops routing traffic to mirrored services from that cluster. Recovery is automatic when the gateway returns [7].
- **Cilium:** eBPF-level endpoint health derived from Cilium agent's pod health monitoring. Global services automatically exclude endpoints in unreachable clusters. No additional health check configuration needed -- the kernel-level monitoring detects failures at network speed [10].

For FoxCompute's intermittent-connectivity edge topology, Cilium's passive health detection (no additional health check traffic) is preferred over Istio's active probes (which generate cross-cluster traffic that consumes rural bandwidth).

### Circuit Breaking and Retry Patterns

Cross-cluster service calls are subject to higher latency and failure rates than intra-cluster calls. Circuit breaking prevents cascading failures when a remote cluster is degraded:

```
CIRCUIT BREAKER STATE MACHINE
================================================================

  CLOSED (normal operation)
  |
  |-- failure threshold exceeded -->
  |
  OPEN (all requests fail fast)
  |
  |-- timeout expires -->
  |
  HALF-OPEN (one test request)
  |
  +-- test succeeds --> CLOSED
  +-- test fails --> OPEN
```

Istio provides circuit breaking natively via DestinationRule (maxConnections, maxPendingRequests, maxRetries, outlierDetection). Linkerd provides retry budgets (percentage of original request rate allocated to retries). Cilium delegates L7 circuit breaking to per-node Envoy when enabled.

For FoxCompute, retry budgets are safer than unlimited retries: a 20% retry budget means that for every 100 original requests, a maximum of 20 retries are allowed. This prevents retry storms that can amplify partial failures into total outages.

---

## 11. Mesh Selection for FoxCompute

### Architecture Decision Record: Service Mesh

**Decision:** Cilium ClusterMesh as the primary CNI-level service mesh, with Linkerd opt-in service mirroring for L7-sensitive services.

**Rationale:**

1. **Cilium is already the CNI.** FoxCompute uses Cilium as the Container Network Interface. Adding ClusterMesh is an incremental configuration change, not a new system. One less component to operate, one less failure mode.

2. **eBPF performance for GPU traffic.** GPU inference nodes exchange large model weights and tensor data. The eBPF kernel-level path avoids the per-request overhead of userspace proxies. The 40-60% overhead reduction reported by production users [11] is significant at FoxCompute's data volumes.

3. **Linkerd for opt-in L7.** Where HTTP-level routing, canary deployments, or request-level metrics are needed, Linkerd's service mirroring provides it with minimal operational overhead. Linkerd's Rust-based proxy has the smallest memory footprint of any mesh (~10MB per pod vs. ~50MB for Envoy).

4. **Istio deferred to Phase 3+.** Istio's operational complexity is appropriate for large organizations with dedicated platform teams. FoxCompute's small team cannot absorb the configuration surface. If FoxCompute scales to 10+ clusters with complex L7 policy requirements, Istio Ambient Mesh becomes the natural upgrade path.

---

## 12. Cross-References

> **Related:** [Federation Control Planes](01-federation-control-planes.md) -- the federation layer that determines workload placement before mesh handles communication. [Network Fabric & CNI](03-network-fabric-cni.md) -- Cilium ClusterMesh architecture deep-dive. [Day-2 Operations](04-day2-operations-observability.md) -- observability stack that monitors mesh traffic. [FoxCompute Integration](05-foxcompute-integration.md) -- how federation and mesh compose in the Amiga-principle topology.

**Series cross-references:**
- **K8S (Kubernetes Core):** Foundation networking that mesh extends
- **CMH (Cryptographic Methods):** mTLS, certificate management, SPIFFE identity
- **NND (Neural Network Design):** GPU workload traffic patterns that mesh must optimize for
- **SYS (Systems Administration):** Operational monitoring of mesh health
- **BRC (Burning Man):** Trust models for cross-boundary service communication
- **OCN (Ocean Networks):** Distributed communication patterns
- **GSD2 (GSD CLI):** Mesh configuration commands
- **MCM (Multi-Cloud Management):** Cross-infrastructure service communication

---

## 13. Sources

1. CNCF. "Service Mesh Interface Specification." smi-spec.io. 2024.
2. LiveWyer. "Service Meshes Decoded: Istio vs Linkerd vs Cilium." May 2024. livewyer.io.
3. Istio Project. "Multi-cluster traffic management documentation." istio.io/docs/ops/configuration/traffic-management/multicluster.
4. Cloud Native Now. "Service Mesh at a Crossroads: Istio's Graduation and the Road Ahead." August 2025.
5. Kiali. "Multi-cluster Istio visualization." kiali.io/docs/features/multi-cluster. Updated May 2025.
6. Istio Project. "Ambient Mesh Architecture." istio.io/docs/ambient. 2025.
7. Buoyant. "Linkerd multi-cluster multi-region setup guide." September 2025. buoyant.io.
8. reintech.io. "Kubernetes Service Mesh Comparison 2026: Istio vs Linkerd vs Cilium." February 2026.
9. Linkerd Project. "Linkerd2-proxy: A purpose-built Rust proxy for the service mesh data plane." github.com/linkerd/linkerd2-proxy.
10. Cilium Project. "Cilium Service Mesh." cilium.io/use-cases/service-mesh. docs.cilium.io.
11. reintech.io. "40-60% reduction in network overhead with Cilium eBPF mode." February 2026.
12. Red Hat Research. "Bridging clusters: a comparative look at multicluster networking performance in Kubernetes." ICPE 2025, Toronto. CODECO project, EU-funded, 16 partners.
13. SPIFFE Project. "Secure Production Identity Framework for Everyone." spiffe.io. CNCF Graduated.
14. Tetrate. "Seamless Cross-Cluster Connectivity for Multicluster Istio Service Mesh Deployments." July 2024. tetrate.io.
15. Cilium Project. "ClusterMesh documentation." docs.cilium.io/en/stable/network/clustermesh.
16. Nutanix Dev. "How to Enable Cilium Cluster Mesh in Nutanix Kubernetes Platform." September 2025.

---

*Multi-Cluster Federation -- Module 2: Service Mesh Cross-Cluster Patterns. Federation decides where. The mesh decides how. Identity decides who. The protocol lives in the spaces between.*
