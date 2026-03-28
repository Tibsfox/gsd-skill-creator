# Network Fabric & CNI

> **Domain:** Multi-Cluster Container Network Interface
> **Module:** 3 -- Cilium ClusterMesh, Submariner, Skupper, and Cross-Cluster Connectivity
> **Through-line:** *The network fabric is the DMA channel of the federated cluster -- the substrate that moves data between specialized execution units without requiring either side to understand the other's internal architecture.* Cilium ClusterMesh provides eBPF-native pod-to-pod connectivity across cluster boundaries. Submariner tunnels through L3. Skupper creates virtual application networks at L7. The choice determines whether cross-cluster communication is fast, secure, and invisible -- or slow, fragile, and manual.

---

## Table of Contents

1. [The Cross-Cluster Networking Problem](#1-the-cross-cluster-networking-problem)
2. [Cilium ClusterMesh Architecture](#2-cilium-clustermesh-architecture)
3. [ClusterMesh Prerequisites](#3-clustermesh-prerequisites)
4. [Global Service Discovery](#4-global-service-discovery)
5. [eBPF-Native Cross-Cluster Load Balancing](#5-ebpf-native-cross-cluster-load-balancing)
6. [Cilium Network Policy Across Clusters](#6-cilium-network-policy-across-clusters)
7. [Hubble: Cross-Cluster Observability](#7-hubble-cross-cluster-observability)
8. [Submariner: L3 Tunnel Approach](#8-submariner-l3-tunnel-approach)
9. [Skupper: L7 Application Network](#9-skupper-l7-application-network)
10. [ICPE 2025 Performance Study](#10-icpe-2025-performance-study)
11. [WireGuard Overlay for Rural Connectivity](#11-wireguard-overlay-for-rural-connectivity)
12. [ClusterMesh Setup Reference](#12-clustermesh-setup-reference)
13. [Cross-References](#13-cross-references)
14. [Sources](#14-sources)

---

## 1. The Cross-Cluster Networking Problem

In a single Kubernetes cluster, the CNI (Container Network Interface) provides a flat network: every pod can reach every other pod by IP address. This is a foundational Kubernetes guarantee. But when you add a second cluster, the guarantee evaporates. Pods in Cluster A have no default route to pods in Cluster B. Their PodCIDR ranges may overlap. Their DNS domains are separate. Their network policies are independent [1].

Cross-cluster networking must solve four problems simultaneously:

```
CROSS-CLUSTER NETWORKING REQUIREMENTS
================================================================

  1. IP REACHABILITY
     Pods in Cluster A must be able to reach pods in Cluster B
     by IP address -- directly or through a gateway.

  2. IP UNIQUENESS
     Pod IPs must be globally unique across all clusters, or
     NAT must translate at cluster boundaries.

  3. SERVICE DISCOVERY
     Services in Cluster B must be discoverable from Cluster A
     by DNS name, not just by IP.

  4. POLICY ENFORCEMENT
     Network policies must extend across cluster boundaries.
     A deny rule in Cluster A must prevent traffic from Cluster B.
```

Three tools take fundamentally different approaches:

| Tool | Layer | Mechanism | IP Uniqueness Required? |
|------|-------|-----------|------------------------|
| Cilium ClusterMesh | L3-L4 (eBPF) | Direct pod-to-pod via shared identity | Yes (non-overlapping CIDRs) |
| Submariner | L3 (tunnel) | Gateway nodes + encrypted tunnels | No (handles NAT) |
| Skupper | L7 (application) | Virtual application network + router pods | No (proxied) |

---

## 2. Cilium ClusterMesh Architecture

ClusterMesh connects multiple Kubernetes clusters at the networking layer using eBPF, enabling pods in different clusters to communicate directly via pod IPs without VPN setup or routing configuration [2].

### How It Works

Each Cilium agent (running on every node in every cluster) maintains a local eBPF map of pod identities and IP addresses. When ClusterMesh is enabled, these maps are shared across clusters through a set of etcd instances (one per cluster, exposed via ClusterMesh apiserver). The result: every Cilium agent in every cluster knows the identity and IP of every pod in every peered cluster.

When a pod in Cluster A sends a packet to a pod in Cluster B:

1. The Cilium eBPF program on the sending node looks up the destination pod's identity in the shared map
2. It applies network policies based on the destination's cryptographic identity (not IP)
3. It encapsulates the packet (VXLAN or Geneve) for cross-cluster transit
4. The Cilium eBPF program on the receiving node decapsulates and delivers to the destination pod

All of this happens in kernel space. No context switches to userspace. No proxy containers. No sidecar overhead.

```
CILIUM CLUSTERMESH -- DATA PATH
================================================================

  Cluster A                              Cluster B
  +---------------------------+         +---------------------------+
  | Node 1                    |         | Node 3                    |
  | +-------+   +---------+  |         | +---------+   +-------+  |
  | | Pod A | ->| eBPF    |  |         | | eBPF    | ->| Pod B |  |
  | +-------+  | program  |  |         | | program  |  +-------+  |
  |            | (kernel) |  |         | | (kernel) |              |
  |            +----+------+  |         | +----+------+             |
  |                 |         |         |      |                    |
  +-----------------|--------+         +------|-------------------+
                    |                          |
                    +---[ VXLAN / Geneve ]-----+
                    |                          |
              +-----+------+           +------+-----+
              | ClusterMesh |           | ClusterMesh |
              | etcd (A)    | <-------> | etcd (B)    |
              +-------------+           +-------------+
```

### Identity-Based Security

The critical distinction: Cilium ClusterMesh enforces policies based on cryptographic workload identity, not IP addresses. This matters because pod IPs are ephemeral -- they change on every restart. An IP-based policy that allows traffic from `10.0.1.5` breaks when the pod restarts and gets `10.0.1.9`. Cilium assigns each pod a numeric identity derived from its Kubernetes labels (namespace, service account, custom labels). This identity is stable across restarts and verifiable across cluster boundaries [2].

---

## 3. ClusterMesh Prerequisites

ClusterMesh has five architectural requirements that must be met before any cluster can join the mesh [2, 3]:

### 1. All Clusters Must Run Cilium as CNI

ClusterMesh is a Cilium-to-Cilium protocol. It cannot peer with clusters running Calico, Flannel, or any other CNI. For FoxCompute, this means all clusters (Valley-Prime, Valley-Secondary, Edge-PNW) must use Cilium.

### 2. Shared Certificate Authority

All clusters must share a common CA certificate for mutual authentication. This is the trust root -- ClusterMesh agents in different clusters verify each other's identity by validating certificates against this shared CA. The CA certificate must be distributed to all clusters before peering is established [2].

```
SHARED CA DISTRIBUTION
================================================================

  [Root CA Certificate]
  (generated once, distributed to all clusters)
       |
       +----> Cluster A: cilium-ca secret
       +----> Cluster B: cilium-ca secret
       +----> Cluster C: cilium-ca secret

  Each cluster generates its own leaf certificates
  signed by this shared root.
```

> **SAFETY WARNING:** The shared CA certificate is the single secret that binds the entire ClusterMesh. If compromised, an attacker can impersonate any workload in any cluster. Mitigations: (1) Generate the CA offline and distribute via sealed-secret or external KMS. (2) Use short-lived intermediate CAs with automated rotation (cronJob pattern). (3) Never store the CA private key in any cluster's etcd.

### 3. Unique Cluster IDs and Names

Each cluster must have a unique numeric cluster ID (1-255) and a unique cluster name. These are set during Cilium installation and cannot be changed without reinstalling. Cluster ID conflicts cause identity collisions that break policy enforcement [2].

### 4. Non-Overlapping PodCIDR Ranges

Pod IP address ranges must not overlap across clusters. If Cluster A uses `10.0.0.0/16` and Cluster B uses `10.0.0.0/16`, ClusterMesh cannot distinguish which pod belongs to which cluster. Planning CIDR allocation before cluster creation is essential.

Recommended allocation for FoxCompute:

| Cluster | PodCIDR | ServiceCIDR | Cluster ID |
|---------|---------|-------------|------------|
| Valley-Prime | 10.1.0.0/16 | 10.101.0.0/16 | 1 |
| Valley-Secondary | 10.2.0.0/16 | 10.102.0.0/16 | 2 |
| Edge-PNW | 10.3.0.0/16 | 10.103.0.0/16 | 3 |
| Future-ElectricCity | 10.4.0.0/16 | 10.104.0.0/16 | 4 |

### 5. IP Connectivity Between Nodes

Nodes across clusters must be able to reach each other via IP. This can be direct (LAN, peered VPCs) or tunneled (WireGuard, IPsec). ClusterMesh does not establish the underlying network path -- it requires it as a prerequisite. For FoxCompute's rural topology, WireGuard tunnels provide the encrypted IP path between sites [2].

---

## 4. Global Service Discovery

ClusterMesh integrates with CoreDNS to provide unified service discovery across clusters [2, 4].

### How Global Services Work

A service annotated with `service.cilium.io/global: "true"` becomes a global service. When any pod in any cluster queries this service by DNS name, Cilium returns endpoints from all clusters that have the service.

```
# Service definition in Cluster B
apiVersion: v1
kind: Service
metadata:
  name: inference-engine
  namespace: ml
  annotations:
    service.cilium.io/global: "true"
    service.cilium.io/shared: "true"
spec:
  selector:
    app: inference-engine
  ports:
    - port: 8080
```

When a pod in Cluster A resolves `inference-engine.ml.svc.cluster.local`, Cilium's eBPF load balancer includes endpoints from both Cluster A (if any) and Cluster B in the response set. The load balancing decision happens in kernel space -- the pod has no awareness that some endpoints are in a different cluster.

### Affinity and Failover

Two annotation patterns control cross-cluster service behavior [2]:

- **`service.cilium.io/affinity: "local"`** -- Prefer local endpoints. Only use remote endpoints if local endpoints are unhealthy. This is the default for latency-sensitive services.
- **`service.cilium.io/shared: "false"`** on one cluster -- Exclude this cluster's endpoints from the global service. Useful for cluster-local services that should not receive cross-cluster traffic (sovereignty enforcement).

### DNS Integration

Cilium's ClusterMesh DNS behavior:

1. Pod queries `inference-engine.ml.svc.cluster.local`
2. CoreDNS resolves to ClusterIP
3. Cilium's eBPF program intercepts the ClusterIP connection
4. eBPF load balancer selects an endpoint (local or remote)
5. If remote: packet is encapsulated and sent to the remote cluster's node
6. Remote Cilium agent delivers to the target pod

The DNS name does not change. The application code does not change. The cross-cluster routing is transparent.

---

## 5. eBPF-Native Cross-Cluster Load Balancing

The load balancing decision in Cilium ClusterMesh happens entirely in eBPF -- compiled kernel programs that execute without context switches to userspace [2, 5].

### Load Balancing Algorithms

Cilium supports multiple algorithms for service load balancing:

- **Random:** Equal probability across all endpoints. Lowest overhead.
- **Maglev:** Consistent hashing. Endpoints that map to the same hash always receive the same traffic. Minimizes disruption when endpoints are added/removed. Named after Google's hardware load balancer design.
- **Weighted:** Custom weights per endpoint based on cluster labels or annotations.

For cross-cluster global services, the Maglev algorithm is recommended. It provides consistent routing (the same client always reaches the same backend) while handling endpoint churn (pods restarting, clusters joining/leaving) gracefully.

### Performance Characteristics

eBPF load balancing eliminates the userspace proxy hop that traditional service meshes require. Performance implications [5, 6]:

- **Latency:** Sub-microsecond load balancing decision (kernel space). Traditional sidecar adds 1-5ms per hop.
- **Throughput:** Line-rate processing. The eBPF program processes packets at the same speed as the NIC driver.
- **CPU overhead:** Minimal. The eBPF program runs as part of the network stack, not as a separate process.
- **Memory:** eBPF maps consume kernel memory proportional to endpoint count. For FoxCompute's scale (hundreds of endpoints), this is negligible.

---

## 6. Cilium Network Policy Across Clusters

CiliumNetworkPolicy (CNP) extends standard Kubernetes NetworkPolicy with identity-based matching and L7 HTTP inspection [2, 7].

### Cross-Cluster Policy Enforcement

Because ClusterMesh shares identity information across clusters, a CNP in Cluster A can reference identities from Cluster B:

```
apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata:
  name: allow-inference-from-gateway
  namespace: ml
spec:
  endpointSelector:
    matchLabels:
      app: inference-engine
  ingress:
    - fromEndpoints:
        - matchLabels:
            app: api-gateway
            io.cilium.k8s.policy.cluster: valley-prime
      toPorts:
        - ports:
            - port: "8080"
              protocol: TCP
          rules:
            http:
              - method: POST
                path: "/v1/infer"
```

This policy allows POST requests to `/v1/infer` on port 8080, but only from pods labeled `app: api-gateway` in the `valley-prime` cluster. The L7 HTTP inspection happens via per-node Envoy (not a sidecar). The L3-L4 filtering happens in eBPF.

### Default Deny Across Clusters

Best practice: deploy a default-deny ingress policy in every namespace of every cluster. Cross-cluster traffic must be explicitly allowed by CNP. This prevents accidental exposure -- even if ClusterMesh connects the clusters, no traffic flows unless a policy permits it [7].

```
apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: ml
spec:
  endpointSelector: {}
  ingress: []
```

---

## 7. Hubble: Cross-Cluster Observability

Hubble is Cilium's built-in observability platform. It provides real-time visibility into network flows by reading eBPF event data directly from the kernel [8].

### Architecture

- **Hubble (per-node):** Reads eBPF events on each node. Provides per-node flow visibility via gRPC API.
- **Hubble Relay:** Aggregates flows from all Hubble instances across all nodes and clusters into a single query endpoint. This is the cross-cluster observability component.
- **Hubble UI:** Browser-based visualization of service-to-service traffic maps.

### Cross-Cluster Flow Visibility

When ClusterMesh is enabled, Hubble Relay aggregates flows from all peered clusters. An operator can query:

- All traffic from Cluster A to Cluster B for a specific namespace
- Latency distribution for cross-cluster service calls
- Policy verdict (allowed/denied) for every flow, including the specific CNP that matched
- DNS queries and responses across cluster boundaries

### Integration with External Observability

Hubble exports flow data in OpenTelemetry format, enabling integration with external observability stacks:

- **Prometheus:** Hubble metrics exported as Prometheus metrics. Cross-cluster dashboards via Grafana.
- **Jaeger / Tempo:** Distributed tracing context propagated through eBPF flow metadata.
- **Elasticsearch / Loki:** Flow logs exported for retention and compliance.

---

## 8. Submariner: L3 Tunnel Approach

Submariner is a CNCF project that provides L3 connectivity between Kubernetes clusters using encrypted tunnels [9, 10].

### Architecture

Submariner runs daemon agents on gateway nodes in each cluster. These agents establish encrypted tunnels (IPsec or WireGuard) between clusters and advertise routes for remote cluster PodCIDR and ServiceCIDR ranges.

```
SUBMARINER ARCHITECTURE
================================================================

  Cluster A                           Cluster B
  +-------------------------+        +-------------------------+
  | [Gateway Node]          |        | [Gateway Node]          |
  | submariner-gateway      |        | submariner-gateway      |
  | submariner-routeagent   |<------>| submariner-routeagent   |
  | submariner-lighthouse   |  IPsec | submariner-lighthouse   |
  +-------------------------+  or WG +-------------------------+
```

Components:
- **Gateway:** Establishes and maintains encrypted tunnels between clusters
- **Route Agent:** Programs routes on each node to forward cross-cluster traffic through the gateway
- **Lighthouse:** Provides cross-cluster service discovery (DNS-based)

### Comparison with ClusterMesh

| Dimension | ClusterMesh | Submariner |
|-----------|-------------|------------|
| Layer | L3-L4 (eBPF) | L3 (tunnels) |
| Requires same CNI | Yes (Cilium) | No (CNI-agnostic) |
| IP overlap handling | No (requires unique CIDRs) | Yes (NAT at gateway) |
| Performance | Kernel-space, minimal overhead | Gateway hop, higher latency |
| Service discovery | eBPF-native global services | Lighthouse DNS |
| Policy enforcement | Cross-cluster CNP | Limited (tunnel-level) |
| Operational complexity | Medium (Cilium required) | Medium (gateway management) |
| Best for | Cilium-native fleets | Heterogeneous CNI fleets |

### When Submariner Makes Sense

Submariner is the correct choice when clusters run different CNIs (one Cilium, one Calico) and cannot be migrated. For FoxCompute, where all clusters will run Cilium, Submariner adds an unnecessary gateway hop. It is included in this module for completeness and as a fallback option if a future FoxCompute partner cluster cannot run Cilium.

---

## 9. Skupper: L7 Application Network

Skupper creates a virtual application network using a dedicated router pod per cluster [11].

### Architecture

Skupper operates at Layer 7, proxying application traffic between clusters without kernel or CNI integration. Each cluster runs a Skupper router pod that communicates with routers in other clusters over AMQP (Advanced Message Queuing Protocol).

### Trade-Offs

- **Advantages:** No shared CNI requirement. No overlapping IP constraint. No kernel module installation. Works on any Kubernetes cluster, including managed offerings (EKS, GKE) where kernel access is restricted.
- **Disadvantages:** Higher latency (userspace routing through AMQP). Higher resource consumption (router pods). Limited policy enforcement (application-level, not network-level).

### FoxCompute Applicability

Skupper is a viable fallback for edge nodes that cannot run Cilium (e.g., constrained embedded systems, managed Kubernetes offerings for partner organizations). For the FoxCompute-owned infrastructure (all bare-metal or k3s), Cilium ClusterMesh is preferred. Skupper's value is as an interoperability bridge for heterogeneous partner environments.

---

## 10. ICPE 2025 Performance Study

The Red Hat Research team presented "Bridging clusters: a comparative look at multicluster networking performance in Kubernetes" at ICPE 2025 in Toronto [10]. This is the most rigorous peer-reviewed multi-cluster networking benchmark available.

### Study Design

- **CODECO project:** EU-funded, 16 research partners
- **Tools compared:** Cilium ClusterMesh, Submariner, Skupper
- **Environment:** Controlled multi-cluster testbed
- **Workloads:** Throughput-intensive, latency-sensitive, and mixed

### Key Findings

The study found meaningful differences across three dimensions:

1. **Throughput:** Cilium ClusterMesh achieved the highest throughput in all tested scenarios, attributed to eBPF kernel-level processing.
2. **Latency:** Cilium had the lowest latency for L3-L4 traffic. Skupper had the highest latency due to L7 AMQP routing. Submariner fell between.
3. **CPU overhead:** Cilium consumed the least CPU per unit of throughput. Skupper consumed the most.

### Implications for FoxCompute

The ICPE 2025 findings confirm Cilium ClusterMesh as the performance leader for FoxCompute's workload profile (GPU inference traffic with high throughput and latency sensitivity). The study also validates Skupper as a viable option when infrastructure constraints prevent Cilium deployment -- the latency and CPU overhead are higher but acceptable for non-latency-critical workloads.

---

## 11. WireGuard Overlay for Rural Connectivity

FoxCompute's PNW topology includes rural edge nodes with intermittent internet connectivity. The networking fabric must handle variable bandwidth, high latency, and periodic disconnection [12].

### WireGuard as the Underlay

WireGuard provides encrypted point-to-point tunnels between cluster sites. It is built into the Linux kernel (since 5.6), uses modern cryptography (Curve25519, ChaCha20, BLAKE2s), and reconnects automatically after network interruptions.

### Integration with ClusterMesh

Cilium supports WireGuard as an encryption layer for pod-to-pod traffic. When enabled, all cross-cluster traffic is encrypted at the kernel level by WireGuard before being sent through the tunnel:

```
# Cilium Helm values for WireGuard encryption
encryption:
  enabled: true
  type: wireguard
  wireguard:
    userspaceFallback: false
```

### Intermittent Connectivity Handling

When a WireGuard tunnel drops (rural internet outage, solar power interruption):

1. Cilium's health checker marks the remote cluster's nodes as unreachable
2. Global service load balancing stops sending traffic to unreachable endpoints
3. When the tunnel re-establishes, WireGuard's automatic reconnection restores the path
4. Cilium's health checker marks nodes as reachable again
5. Global service load balancing resumes including remote endpoints

> **SAFETY WARNING:** During tunnel interruptions, workloads running on the disconnected cluster continue operating independently (Liqo's split-brain resilience). But cross-cluster service calls will fail. Applications must implement circuit breakers and fallback logic for cross-cluster dependencies. The mesh cannot mask network partitions from application-level timeouts.

---

## 12. ClusterMesh Setup Reference

Executable setup for a FoxCompute 2-cluster prototype [2, 3]:

### Step 1: Generate Shared CA

```
# Generate CA key pair (do this offline, not on any cluster)
cilium clustermesh generate-ca

# The output: ca.crt, ca.key
# Distribute ca.crt to all clusters as a Kubernetes secret
kubectl --context valley-prime create secret generic cilium-ca \
  --namespace kube-system \
  --from-file=ca.crt=ca.crt \
  --from-file=ca.key=ca.key

kubectl --context valley-secondary create secret generic cilium-ca \
  --namespace kube-system \
  --from-file=ca.crt=ca.crt \
  --from-file=ca.key=ca.key
```

### Step 2: Install Cilium with ClusterMesh-Ready Configuration

```
# Valley-Prime (Cluster ID: 1)
helm install cilium cilium/cilium --version 1.16.x \
  --namespace kube-system \
  --set cluster.name=valley-prime \
  --set cluster.id=1 \
  --set clustermesh.useAPIServer=true \
  --set clustermesh.apiserver.service.type=LoadBalancer \
  --set encryption.enabled=true \
  --set encryption.type=wireguard \
  --set ipam.operator.clusterPoolIPv4PodCIDRList="10.1.0.0/16"

# Valley-Secondary (Cluster ID: 2)
helm install cilium cilium/cilium --version 1.16.x \
  --namespace kube-system \
  --set cluster.name=valley-secondary \
  --set cluster.id=2 \
  --set clustermesh.useAPIServer=true \
  --set clustermesh.apiserver.service.type=LoadBalancer \
  --set encryption.enabled=true \
  --set encryption.type=wireguard \
  --set ipam.operator.clusterPoolIPv4PodCIDRList="10.2.0.0/16"
```

### Step 3: Establish Peering

```
cilium clustermesh connect \
  --context valley-prime \
  --destination-context valley-secondary
```

### Step 4: Verify

```
cilium clustermesh status --context valley-prime
# Should show: valley-secondary connected, healthy

cilium connectivity test --context valley-prime --multi-cluster
# Runs cross-cluster connectivity validation
```

---

## 13. Cross-References

> **Related:** [Federation Control Planes](01-federation-control-planes.md) -- federation decides placement; network fabric provides the connectivity for placed workloads. [Service Mesh Cross-Cluster](02-service-mesh-cross-cluster.md) -- Cilium ClusterMesh is the L3-L4 foundation; Linkerd sits above for L7. [Day-2 Operations](04-day2-operations-observability.md) -- Hubble Relay provides the observability for ClusterMesh traffic. [FoxCompute Integration](05-foxcompute-integration.md) -- CIDR allocation and cluster peering for the Amiga-principle topology.

**Series cross-references:**
- **K8S (Kubernetes Core):** CNI foundation layer
- **SYS (Systems Administration):** Network monitoring, WireGuard tunnel management
- **NND (Neural Network Design):** GPU inference traffic patterns across the mesh
- **CMH (Cryptographic Methods):** WireGuard cryptography, shared CA management
- **OCN (Ocean Networks):** Distributed networking patterns, resilience under partition
- **BRC (Burning Man):** Mesh networking education, physical playa connectivity
- **GSD2 (GSD CLI):** ClusterMesh status and management commands
- **MCM (Multi-Cloud Management):** Cross-infrastructure network fabric

---

## 14. Sources

1. Kubernetes Project. "Cluster Networking." kubernetes.io/docs/concepts/cluster-administration/networking.
2. Cilium Project. "ClusterMesh -- Multi Cluster Networking." docs.cilium.io/en/stable/network/clustermesh.
3. Nutanix Dev. "How to Enable Cilium Cluster Mesh in Nutanix Kubernetes Platform." September 2025. nutanix.dev.
4. Cilium Project. "Service Mesh -- Global Services." docs.cilium.io/en/stable/network/clustermesh/services.
5. Cilium Project. "eBPF-based Networking, Security, and Observability." cilium.io.
6. reintech.io. "Kubernetes Service Mesh Comparison 2026: Istio vs Linkerd vs Cilium." February 2026.
7. Cilium Project. "CiliumNetworkPolicy." docs.cilium.io/en/stable/security/policy.
8. Cilium Project. "Hubble -- Network Observability." docs.cilium.io/en/stable/observability/hubble.
9. Submariner Project. "Multi-cluster Kubernetes connectivity." submariner.io.
10. Red Hat Research. "Bridging clusters: a comparative look at multicluster networking performance in Kubernetes." ICPE 2025, Toronto. CODECO project, EU-funded, 16 partners.
11. Skupper Project. "Virtual Application Networking for Kubernetes." skupper.io.
12. WireGuard Project. "WireGuard: fast, modern, secure VPN tunnel." wireguard.com.
13. Cilium Project. "WireGuard Transparent Encryption." docs.cilium.io/en/stable/security/network/encryption-wireguard.
14. CNCF Blog. "Simplifying multi-clusters in Kubernetes." Arbezzano, Palesandro. January 2024. cncf.io.
15. Cilium Project. "Maglev Load Balancing." docs.cilium.io/en/stable/network/lb-maglev.
16. LiveWyer. "Service Meshes Decoded: Istio vs Linkerd vs Cilium." May 2024. livewyer.io.

---

*Multi-Cluster Federation -- Module 3: Network Fabric & CNI. The eBPF program processes packets at the speed of the kernel. The tunnel carries them between sites. The policy decides which ones to let through. The fabric is invisible when it works -- and that is the point.*
