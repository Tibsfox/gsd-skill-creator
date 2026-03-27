# Module 2: Networking & Traffic Management

## Overview

Kubernetes networking is undergoing its most significant architectural shift since the platform's creation. The Ingress API, which defined HTTP routing for a decade, is being superseded by Gateway API -- a role-separated, protocol-aware traffic management system. Simultaneously, the Container Network Interface (CNI) landscape has consolidated around eBPF-native solutions that eliminate iptables overhead entirely. And the kube-proxy subsystem itself is migrating from IPVS to nftables, deprecating two generations of packet filtering in a single release cycle.

For the GSD mesh cluster, these are not abstract API changes. They determine how Minecraft players reach game servers, how AI inference requests route to GPU-equipped nodes, how monitoring data flows from Paula storage nodes to Prometheus, and how zero-trust network policies isolate workloads that should never communicate. The networking layer is where the Amiga Principle meets physical reality -- every packet traverses the spaces between pods, and those spaces are where the real architecture lives.

This module maps the Gateway API architecture, evaluates CNI options for bare-metal clusters, traces the Ingress-NGINX retirement timeline, and provides concrete migration guidance for the GSD mesh deployment.

---

## The Ingress-NGINX Retirement

### Timeline

The Kubernetes community formally announced the retirement of the Ingress-NGINX controller in November 2025. The timeline is definitive:

| Date | Event | Impact |
|------|-------|--------|
| November 2025 | Retirement announced | Community notification, migration guidance published |
| March 2026 | Maintenance ends | Project archived. No further security patches, bug fixes, or compatibility updates |
| Ongoing | Ingress API remains | The Ingress *resource type* is still valid; only the NGINX controller implementation is retired |

This retirement is significant because Ingress-NGINX was the de facto standard ingress controller for most Kubernetes deployments. Alternative Ingress controllers -- NGINX Inc./F5 (commercial), Traefik, HAProxy -- remain actively maintained, but the ecosystem direction is clearly toward Gateway API as the primary traffic management abstraction.

### Why It Matters for New Deployments

The GSD mesh cluster has a decisive advantage: it starts fresh. There is no existing Ingress configuration to migrate. Starting with Gateway API natively avoids accumulating migration debt -- every Ingress annotation, every controller-specific configuration, every workaround for Ingress limitations that would eventually need to be replaced.

---

## Gateway API: The Post-Ingress Era

### Architecture

Gateway API provides role-separated, extensible traffic management through three core resources that map to distinct operational personas:

**GatewayClass** -- Infrastructure Provider:

The cloud provider or platform team defines what kinds of gateways are available. A GatewayClass represents a specific load balancer implementation (e.g., Cilium Gateway, Envoy, Contour). This is the infrastructure layer -- the "what hardware/software handles the traffic" question.

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: GatewayClass
metadata:
  name: cilium-gateway
spec:
  controllerName: io.cilium/gateway-controller
```

**Gateway** -- Cluster Operator:

The operations team instantiates a listener on a specific address and port, selecting a GatewayClass. A Gateway is a concrete load balancer deployment -- it has an IP address, listens on ports, and terminates TLS. This is the network topology layer -- the "where does traffic enter the cluster" question.

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: mesh-gateway
  namespace: gsd-system
spec:
  gatewayClassName: cilium-gateway
  listeners:
    - name: http
      port: 80
      protocol: HTTP
    - name: https
      port: 443
      protocol: HTTPS
      tls:
        mode: Terminate
        certificateRefs:
          - name: mesh-tls-cert
```

**HTTPRoute** -- Application Developer:

The developer declares routing rules -- path matching, header-based routing, traffic splitting, request mirroring -- without needing to know which load balancer implementation handles the traffic. This is the application layer -- the "how does my service receive requests" question.

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: minecraft-route
  namespace: minecraft
spec:
  parentRefs:
    - name: mesh-gateway
      namespace: gsd-system
  hostnames:
    - "minecraft.mesh.local"
  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /
      backendRefs:
        - name: minecraft-server
          port: 25565
```

### Advantages Over Ingress

| Capability | Ingress | Gateway API |
|-----------|---------|-------------|
| Protocol support | HTTP/HTTPS only | HTTP, HTTPS, TCP, UDP, gRPC natively |
| Traffic splitting | Annotation-dependent | Native `weight` field on `backendRefs` |
| Header manipulation | Controller-specific annotations | Standard `RequestHeaderModifier` filter |
| Request mirroring | Not supported | Native `RequestMirror` filter |
| Role separation | None (single resource) | GatewayClass / Gateway / Route separation |
| Cross-namespace routing | Limited | Explicit `ReferenceGrant` mechanism |
| TLS passthrough | Annotation-dependent | Native `TLSRoute` with passthrough mode |
| Vendor lock-in | High (annotation-heavy) | Low (standard API, portable) |

### The ingress2gateway Migration Tool

For deployments that have existing Ingress resources, the `ingress2gateway` tool (v1.0 released March 2026) automates conversion. It reads Ingress manifests, detects controller-specific annotations, and generates equivalent Gateway API resources with controller-level integration tests verifying behavioral equivalence.

```bash
# Convert existing Ingress resources to Gateway API
ingress2gateway print --input-file ingress.yaml --output-file gateway.yaml

# Validate behavioral equivalence
ingress2gateway test --ingress ingress.yaml --gateway gateway.yaml
```

The GSD mesh cluster does not need this tool -- we start native. But it documents the migration path for anyone running existing Ingress configurations who wants to transition.

---

## CNI Landscape

### Container Network Interface Overview

The CNI is the plugin that provides pod-to-pod networking. It assigns IP addresses to pods, creates network namespaces, configures routes, and optionally enforces network policies. The CNI choice has profound implications for security (network policy enforcement), performance (iptables vs. eBPF), and observability (L7 visibility).

### Cilium

**Architecture:** eBPF-native. Cilium programs the Linux kernel's eBPF virtual machine directly, bypassing iptables/nftables entirely. Packet filtering, load balancing, and network policy enforcement all happen in-kernel at near-native speed.

**Key capabilities:**

- **L3/L4/L7 network policies:** Filter traffic by IP, port, and protocol (L3/L4) or by HTTP path, method, and headers (L7). DNS-aware policies can restrict which domain names a pod is allowed to resolve.
- **Hubble observability:** Built-in network flow monitoring and visualization without sidecar injection. See which pods are talking to which pods, what protocols they use, and whether any connections are being denied by policies.
- **Service mesh (optional):** Cilium can provide mTLS and traffic management without a separate service mesh installation, using eBPF to intercept and encrypt traffic transparently.
- **Gateway API controller:** Cilium includes a native Gateway API implementation, eliminating the need for a separate ingress controller.
- **Bandwidth Manager:** QoS enforcement using eBPF-based traffic shaping.

**Performance characteristics:**

- Zero iptables rules regardless of cluster size (vanilla Kubernetes generates O(n) iptables rules where n = services * endpoints)
- Kernel-bypass networking for east-west traffic
- Hardware offload support for SmartNICs
- Benchmarks show 2-5x throughput improvement over iptables-based CNIs for high-connection-rate workloads

**GSD mesh fit:** Primary recommendation. The eBPF architecture eliminates iptables overhead, L7 visibility provides security monitoring without sidecars, and the built-in Gateway API controller consolidates the networking stack into a single component.

### Calico

**Architecture:** Historically iptables-based, with an eBPF mode available since v3.13. Calico is the most widely deployed Kubernetes CNI, with extensive documentation and a large community.

**Key capabilities:**

- **L3/L4 network policies:** Standard Kubernetes NetworkPolicy enforcement plus Calico-specific extensions for egress policies, DNS policies, and application-layer rules.
- **BGP peering:** Native BGP support for bare-metal clusters, allowing pods to be directly routable from the physical network without overlay encapsulation.
- **WireGuard encryption:** Built-in pod-to-pod encryption using WireGuard, providing mTLS-like confidentiality without certificate management.
- **Typha scaling:** A caching layer between the Calico datastore and Felix (the per-node agent), enabling clusters of 500+ nodes without datastore contention.

**Limitations for GSD mesh:**

- eBPF mode is available but less mature than Cilium's eBPF implementation
- No built-in L7 visibility (requires integration with external tools)
- Network policy debugging requires dedicated tooling (calicoctl)
- No native Gateway API controller

### Flannel

**Architecture:** VXLAN overlay network. Flannel creates a flat pod network using VXLAN encapsulation, assigning each node a /24 subnet from a larger cluster CIDR.

**Key capabilities:**

- Extremely simple configuration -- K3s includes Flannel by default
- Low resource overhead (single binary, minimal CPU/memory)
- Works everywhere (no kernel version requirements, no eBPF dependency)

**Critical limitation:** Flannel does not enforce network policies. It provides pod-to-pod connectivity only. Any pod can reach any other pod. For a cluster running public Minecraft servers alongside private GSD orchestration workloads, this is unacceptable without additional components.

**Flannel + network policy addon:** Flannel can be paired with Calico's policy-only mode (canal) to add network policy enforcement. This adds complexity without providing the observability benefits of Cilium.

### CNI Comparison Matrix

| Feature | Cilium | Calico | Flannel |
|---------|--------|--------|---------|
| Packet processing | eBPF (kernel) | iptables or eBPF | VXLAN overlay |
| Network policy | L3/L4/L7 + DNS-aware | L3/L4 (standard + extensions) | None (requires addon) |
| L7 visibility | Hubble (built-in) | Requires external tools | None |
| Encryption | WireGuard or IPsec | WireGuard | None |
| Gateway API | Native controller | No | No |
| Service mesh | Built-in (optional) | No (use Istio/Linkerd) | No |
| Resource overhead | Medium | Low-Medium | Low |
| eBPF required | Yes (kernel 4.19+) | Optional | No |
| K3s integration | Replace Flannel at install | Replace Flannel at install | Default |
| GSD mesh recommendation | **Primary** | Fallback | Development only |

---

## Service Mesh Options

### When Is a Service Mesh Needed?

A service mesh adds a data plane proxy (sidecar or kernel-level) to every pod, handling mTLS, traffic management, retries, circuit breaking, and observability. The question is whether this overhead is justified.

**Service mesh IS needed when:**

- Mutual TLS between all services with automated certificate rotation
- Traffic splitting for canary deployments (5% to new version, 95% to stable)
- Circuit breaking and retry policies across service boundaries
- Distributed tracing with automatic span injection

**Service mesh is NOT needed when:**

- Pod certificates (v1.35 beta) provide sufficient mTLS for the deployment
- Traffic management is handled at the Gateway API level (ingress-only)
- The cluster runs a small number of services (<20) where manual configuration is manageable

### Istio vs. Linkerd

| Dimension | Istio | Linkerd |
|-----------|-------|---------|
| Data plane | Envoy proxy (C++) | linkerd2-proxy (Rust) |
| Resource overhead | ~100MB per sidecar | ~10MB per sidecar |
| Feature set | Full (mTLS, traffic management, telemetry, policy) | Core (mTLS, telemetry, traffic splitting) |
| Complexity | High (many CRDs, complex configuration) | Low (opinionated, fewer knobs) |
| Multi-cluster | Native (east-west gateway) | Supported (multi-cluster extension) |
| CNCF status | Graduated | Graduated |

**GSD mesh recommendation:** Start without a service mesh. Use pod certificates (v1.35 beta) for mTLS and Cilium for network policy enforcement. If canary deployments or distributed tracing become requirements, evaluate Linkerd first (lower overhead, Rust data plane, simpler operations).

---

## The nftables Migration

### What Changed

Kubernetes v1.35 deprecated the IPVS kube-proxy mode and is pushing the ecosystem toward nftables-based kube-proxy. The migration path:

| kube-proxy mode | Status in v1.35 | Performance Profile |
|----------------|-----------------|-------------------|
| iptables | Supported (legacy) | O(n) rule count, slow updates for large clusters |
| IPVS | Deprecated | Better than iptables for high-service counts |
| nftables | Default for new clusters | Atomic rule updates, better performance at scale |

**For the GSD mesh:** If using Cilium as the CNI, kube-proxy is replaceable entirely. Cilium can operate in "kube-proxy replacement" mode, handling service load balancing in eBPF without any kube-proxy component. This eliminates the nftables/iptables/IPVS question entirely.

```bash
# K3s installation with Cilium replacing kube-proxy
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--flannel-backend=none --disable-network-policy --disable-kube-proxy" sh -
```

---

## Multi-Cluster Networking

### Mesh Node Connectivity

The GSD mesh cluster spans multiple physical locations connected by the Pacific Spine (PSG) backbone network. K3s supports multi-site deployments through several mechanisms:

- **WireGuard tunnels:** Encrypted point-to-point tunnels between sites, forming the underlay for K3s VXLAN overlay.
- **Cilium Cluster Mesh:** Connects multiple K3s clusters with shared service discovery and cross-cluster network policy enforcement.
- **Submariner:** CNCF project for connecting pod and service networks across Kubernetes clusters, with IPsec or WireGuard encryption.

**Recommended approach:** Start with a single-site K3s cluster. When multi-site deployment becomes necessary, evaluate Cilium Cluster Mesh first -- it integrates with the existing Cilium CNI without additional components.

---

## Gateway API Configuration for GSD Mesh

### Traffic Routing Architecture

```
                    Internet
                       |
                [MetalLB VIP Pool]
                       |
              +--------+--------+
              |   mesh-gateway  |  (Cilium Gateway)
              +-+------+------+-+
                |      |      |
     +----------+  +---+---+  +----------+
     |minecraft |  | gsd   |  | monitor  |
     |HTTPRoute |  |Route  |  | Route    |
     +-----+----+  +---+---+  +-----+----+
           |            |            |
  [minecraft NS]  [gsd-system NS]  [monitoring NS]
```

### MetalLB for Bare-Metal Load Balancing

K3s includes a built-in load balancer (ServiceLB/Klipper) that uses host ports. For production, MetalLB provides proper L2/BGP load balancing:

```yaml
apiVersion: metallb.io/v1beta1
kind: IPAddressPool
metadata:
  name: mesh-pool
  namespace: metallb-system
spec:
  addresses:
    - 10.0.0.200-10.0.0.250
---
apiVersion: metallb.io/v1beta1
kind: L2Advertisement
metadata:
  name: mesh-l2
  namespace: metallb-system
spec:
  ipAddressPools:
    - mesh-pool
```

---

## Cross-References

- **CMH (Comp. Mesh):** The physical mesh network topology that K3s overlay networking runs on top of. CNI VXLAN/Geneve encapsulation traverses mesh routes.
- **PSG (Pacific Spine):** Backbone network for multi-site K3s clustering. WireGuard tunnels for cluster-to-cluster communication.
- **SYS (Systems Admin):** Network interface configuration, VLAN setup, firewall rules on the host OS that affect CNI operation.
- **SAN (SANS Institute):** Network segmentation and monitoring standards that inform network policy design.
- **GSD2 (GSD-2 Arch.):** Agent communication patterns that determine which HTTPRoutes and network policies are needed.

---

## Decision Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Traffic management | Gateway API (native) | Post-Ingress standard, role separation, no migration debt |
| CNI | Cilium | eBPF-native, L7 visibility, built-in Gateway API, network policy enforcement |
| kube-proxy | Replaced by Cilium | eBPF service load balancing, no iptables/nftables/IPVS dependency |
| Load balancer | MetalLB (L2 mode) | Bare-metal VIP pool, no cloud provider dependency |
| Service mesh | Deferred (pod certificates first) | Start simple, evaluate Linkerd if canary/tracing needed |
| Multi-cluster | Cilium Cluster Mesh (when needed) | Integrates with existing CNI, cross-cluster policy enforcement |

---

## Sources

- Ingress-NGINX Retirement Announcement -- kubernetes.io/blog/2025/11/11/ingress-nginx-retirement/
- Gateway API Documentation -- gateway-api.sigs.k8s.io/
- Ingress2Gateway 1.0 Release -- kubernetes.io/blog/2026/03/20/ingress2gateway-1-0-release/
- Cilium Documentation -- docs.cilium.io/
- Cilium Gateway API -- docs.cilium.io/en/stable/network/servicemesh/gateway-api/
- Cilium Cluster Mesh -- docs.cilium.io/en/stable/network/clustermesh/
- Calico Documentation -- docs.tigera.io/calico/latest/
- Flannel Repository -- github.com/flannel-io/flannel
- Linkerd Documentation -- linkerd.io/2/overview/
- Istio Documentation -- istio.io/latest/docs/
- MetalLB Documentation -- metallb.universe.tf/
- KubeCon EU 2026: Cilium Security Integrations for AI Workloads (Microsoft)
- KubeCon EU 2026: nftables kube-proxy migration status
