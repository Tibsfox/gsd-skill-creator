# Module 1: Distributions & Architecture

## Overview

Kubernetes in 2026 is not the Kubernetes of 2020. The ecosystem has matured from a single monolithic distribution into a landscape of specialized variants, each optimized for different hardware profiles and operational contexts. This module maps the distribution landscape as it exists today -- not as a generic survey, but through the specific lens of the GSD 10-node mesh cluster architecture. Every distribution choice connects back to a concrete decision: which binary runs on an Amiga Principle node type, what datastore backs the control plane, and how does the upgrade path align with a self-funded bare-metal deployment.

The core question is distribution selection for a heterogeneous cluster -- ARM edge nodes alongside x86 GPU-heavy nodes, constrained memory on some machines and dual RTX 5090s on others, all coordinated by a single control plane that treats specialization as a feature rather than a problem to solve.

---

## Kubernetes v1.35 "Timbernetes"

### Release Profile

Kubernetes v1.35, released December 2025 with the latest patch v1.35.3 (March 19, 2026), delivered 60 enhancements: 17 graduated to stable, 19 reached beta, and 22 entered alpha. The release theme "Timbernetes" reflects the project's maturity -- the timber that supports the entire cloud-native ecosystem.

**Key graduations in v1.35:**

- **In-place pod resource adjustment (GA):** CPU and memory changes on running containers without pod recreation. Modifies cgroup settings directly, requiring cgroups v2 on all nodes. This eliminates the restart tax for right-sizing workloads -- a running inference server can have its memory limit increased without losing loaded model state.
- **IPVS proxy mode deprecated:** The ecosystem is pushing toward nftables-based kube-proxy. IPVS served well for high-service-count clusters but the nftables backend provides better integration with modern Linux networking stacks.
- **cgroups v1 deprecated:** All nodes must run cgroups v2. This is a hard requirement for in-place resource adjustment and aligns with the broader Linux ecosystem migration.

### Beta Features

- **Pod certificates for mTLS (KEP-4317):** The kubelet generates keys, requests certificates via PodCertificateRequest, and writes credential bundles directly to the pod filesystem. This eliminates the need for external cert-manager or SPIFFE sidecars for basic mutual TLS between services. The certificate lifecycle is managed by the kubelet itself -- no sidecar injection, no init container delays.
- **Constrained impersonation (KEP-5284, alpha):** Blocks nodes from impersonating other nodes to extract sensitive pod data. This closes a long-standing privilege escalation vector in multi-tenant clusters where a compromised kubelet on one node could request secrets belonging to pods on other nodes.

### Supported Versions (March 2026)

| Version | Release Date | End of Life | Status |
|---------|-------------|-------------|--------|
| v1.35 | December 2025 | February 2027 | Current stable |
| v1.34 | August 2025 | October 2026 | Supported |
| v1.33 | April 2025 | June 2026 | End-of-life approaching |

The GSD mesh cluster should target v1.35 from the start. Starting on the current stable release avoids accumulating version migration debt and gives immediate access to in-place resource adjustment and pod certificates -- both features that directly impact GPU workload management and zero-trust security.

---

## K3s: Lightweight Kubernetes

### Architecture

K3s packages the entire Kubernetes control plane -- API server, controller manager, scheduler, and optional embedded etcd -- into a single binary under 70MB. Memory footprint starts at approximately 512MB versus 2GB minimum for vanilla Kubernetes. It is a CNCF Incubation-stage project with over 27,000 GitHub stars, maintained by SUSE/Rancher.

**Key architectural choices:**

- **Runtime:** containerd (not Docker). Docker was removed from the Kubernetes dependency tree in v1.24; K3s never included it.
- **Default CNI:** Flannel (VXLAN overlay). Simple, proven, minimal configuration. Replaceable with Cilium or Calico for advanced network policy enforcement.
- **Service discovery:** CoreDNS, same as upstream Kubernetes.
- **Default ingress:** Traefik v2. Configurable -- can be disabled at install time to use Gateway API implementations instead.
- **Datastore options:** SQLite for single-server deployments, embedded etcd for HA clusters with 3+ server nodes, or external MySQL/PostgreSQL via Kine.

### Single-Command Installation

```
curl -sfL https://get.k3s.io | sh -
```

That single command installs the K3s binary, creates a systemd service, starts the control plane, and makes the node ready to schedule workloads. Agent nodes join with a single token-based command. This operational simplicity is not a limitation -- it is the point. K3s provides a fully conformant Kubernetes API surface while eliminating the operational overhead of managing separate etcd, scheduler, and controller-manager processes.

### Hardware Support

K3s supports both x86_64 and ARM64/ARMv7 architectures, running identically on Raspberry Pi hardware and server-class machines. The same binary, the same API surface, the same kubectl commands. This is critical for the GSD mesh cluster, which includes heterogeneous node types ranging from constrained ARM edge devices to x86 machines with dual RTX 5090 GPUs.

### HA Configuration

High availability mode uses embedded etcd with 3 or more server nodes. The etcd cluster is managed internally by K3s -- no separate etcd operator, no manual cluster bootstrapping, no certificate management for etcd peer communication. For the GSD mesh cluster, three dedicated control plane nodes provide fault tolerance without the operational complexity of managing a standalone etcd cluster.

### Upstream Tracking

K3s tracks upstream Kubernetes releases with a target of patch releases within one week and minor version releases within 30 days of upstream availability. This means the GSD mesh cluster can access v1.35 features (in-place resize, pod certificates) through K3s shortly after upstream release.

---

## Distribution Comparison Matrix

### Quantitative Comparison

| Feature | K8s (vanilla) | K3s | MicroK8s | KubeEdge |
|---------|--------------|-----|----------|----------|
| Minimum RAM | 2GB | 512MB | 540MB | 256MB (edge node) |
| Binary packaging | Multi-binary | Single binary (<70MB) | Snap package | Split binary (cloud+edge) |
| Datastore | etcd (required) | SQLite / embedded etcd / Kine | Dqlite | Cloud etcd + edge SQLite |
| Default CNI | None (must install) | Flannel | Calico | EdgeMesh |
| ARM support | Yes (community) | Native (first-class) | Yes | Yes |
| HA mode | External etcd cluster | Embedded etcd (3+ nodes) | Dqlite HA | Cloud-side HA |
| Installation | kubeadm (multi-step) | Single command | `snap install microk8s` | keadm (cloud + edge) |
| CNCF status | Graduated | Incubating | Not CNCF | Incubating |
| Best suited for | Large production clusters | Edge, small/medium clusters, bare-metal | Developer workstations, testing | IoT, cloud-edge split |
| Control plane footprint | ~2GB RAM, multiple processes | ~512MB RAM, single process | ~540MB RAM, snap-contained | Cloud-hosted control plane |
| Upgrade mechanism | kubeadm upgrade | Binary replacement / systemd restart | snap refresh | keadm upgrade |
| GPU support | NVIDIA Device Plugin | NVIDIA Device Plugin (same) | NVIDIA Device Plugin (same) | Limited (edge focus) |

### Operational Complexity Assessment

| Dimension | K8s | K3s | MicroK8s | KubeEdge |
|-----------|-----|-----|----------|----------|
| Day-0 setup | High (multi-tool) | Minimal (one command) | Low (snap) | Medium (two-component) |
| Day-1 networking | Manual CNI install | Pre-configured Flannel | Pre-configured Calico | Auto EdgeMesh |
| Day-2 upgrades | kubeadm plan/apply | Binary swap + restart | snap refresh | keadm upgrade |
| Certificate management | Manual or kubeadm | Automatic (internal CA) | Automatic (snap-managed) | Cloud-managed |
| etcd operations | Manual backup/restore | Embedded (automatic) | Dqlite (automatic) | Cloud-hosted |
| Multi-arch clusters | Possible (complex) | Native (designed for it) | Limited | Designed for heterogeneous |

---

## MicroK8s

MicroK8s, maintained by Canonical, packages Kubernetes inside a snap container. Memory footprint starts at approximately 540MB. Key differentiator: Dqlite as the datastore -- a distributed SQLite implementation that provides HA without etcd. This eliminates a significant operational dependency but introduces a less battle-tested datastore.

**Strengths:** Excellent developer experience, addon system for common extensions (`microk8s enable gpu`, `microk8s enable istio`), tight Ubuntu integration.

**Limitations:** Snap packaging adds a containment layer that can complicate volume mounts and network configuration. Not a CNCF project -- governance and long-term support are Canonical-dependent. The addon system, while convenient, creates a dependency on Canonical-maintained addon manifests rather than upstream CNCF project configurations.

**GSD mesh fit:** Secondary consideration. MicroK8s excels for developer workstations and testing environments but its snap-based architecture adds complexity for bare-metal production deployments where direct filesystem and network access is preferred.

---

## KubeEdge

KubeEdge splits the Kubernetes architecture into cloud-side and edge-side components. The cloud component runs the full Kubernetes control plane; edge nodes run a lightweight agent (EdgeCore) that can operate autonomously during network disconnections. CNCF Incubating project.

**Key capabilities:**

- **Offline autonomy:** Edge nodes continue running workloads even when disconnected from the cloud control plane. Pod state is cached locally, and workloads survive network partitions.
- **EdgeMesh:** Built-in service mesh for edge-to-edge communication without requiring cloud-side routing.
- **Device management:** CRDs for managing IoT devices connected to edge nodes -- temperature sensors, cameras, actuators.
- **Minimum edge footprint:** 256MB RAM for an edge node, making it viable for Raspberry Pi Zero-class hardware.

**Limitations:** The cloud-edge split architecture means the "edge" is not a full Kubernetes node -- it runs a subset of the Kubernetes API. Standard Kubernetes tools (kubectl exec, port-forward) have limitations when targeting edge nodes. The edge node cannot run workloads that depend on full API server access.

**GSD mesh fit:** Tertiary consideration. KubeEdge is designed for scenarios with thousands of edge nodes and intermittent connectivity. The GSD mesh cluster has reliable LAN connectivity between all nodes, making the cloud-edge split architecture unnecessary overhead.

---

## Amiga Principle Node Mapping

The Amiga achieved what mainframes could not -- not by being bigger, but by being *specialized*. Custom chips doing dedicated work, coordinated by a CPU that knew how to delegate. The GSD mesh cluster follows the same principle: each node has a defined role, and the orchestration layer (K3s) coordinates the ensemble.

### Node Type to K3s Role Mapping

| Amiga Chip | GSD Role | K3s Configuration | Hardware Profile | Workload Examples |
|-----------|---------|-------------------|-----------------|-------------------|
| 68000 (CPU) | Control plane | K3s server with embedded etcd | x86, 16GB RAM, SSD | API server, scheduler, controller manager, CoreDNS |
| Agnus (DMA/scheduling) | Scheduling coordinator | K3s server (additional control plane) | x86, 16GB RAM, SSD | etcd cluster member, admission controllers, Kueue scheduler |
| Denise (rendering/GPU) | GPU compute | K3s agent with NVIDIA GPU Operator | x86, 32GB+ RAM, dual RTX 5090, NVMe | AI training, inference, Minecraft rendering, Gradient Engine |
| Paula (audio/storage) | Storage and I/O | K3s agent with Longhorn | x86/ARM, 16GB+ RAM, mixed SSD/HDD | Persistent volumes, backup targets, NFS exports, monitoring data |

### Configuration Specifics

**68000 Control Plane Nodes (3 required for HA):**

```yaml
# /etc/rancher/k3s/config.yaml
cluster-init: true
tls-san:
  - k3s.mesh.local
  - 10.0.0.10
disable:
  - traefik        # Use Gateway API instead
  - servicelb      # Use MetalLB for bare-metal load balancing
node-taint:
  - "node-role.kubernetes.io/control-plane:NoSchedule"
```

**Denise GPU Nodes:**

```yaml
# /etc/rancher/k3s/config.yaml
server: https://k3s.mesh.local:6443
token: <cluster-token>
node-label:
  - "node.kubernetes.io/gpu=true"
  - "nvidia.com/gpu.count=2"
  - "gsd.mesh/role=denise"
kubelet-arg:
  - "topology-manager-policy=best-effort"
  - "topology-manager-scope=pod"
```

**Paula Storage Nodes:**

```yaml
# /etc/rancher/k3s/config.yaml
server: https://k3s.mesh.local:6443
token: <cluster-token>
node-label:
  - "node.kubernetes.io/storage=true"
  - "gsd.mesh/role=paula"
kubelet-arg:
  - "eviction-hard=imagefs.available<5%,nodefs.available<5%"
```

---

## Datastore Selection

### etcd vs. SQLite vs. Kine

For the GSD mesh cluster, the datastore choice is straightforward:

| Criterion | SQLite | Embedded etcd | External etcd | Kine (MySQL/Postgres) |
|-----------|--------|---------------|---------------|----------------------|
| HA support | No (single server only) | Yes (3+ servers) | Yes | Yes (database HA) |
| Operational complexity | None | Low (K3s manages it) | High (separate cluster) | Medium (database admin) |
| Data durability | Filesystem | Raft consensus | Raft consensus | Database-dependent |
| GSD mesh fit | Development only | **Primary recommendation** | Overkill | If database already exists |

**Recommendation:** Embedded etcd with 3 control plane nodes. K3s manages the etcd cluster lifecycle internally -- no separate etcd operator, no manual snapshot/restore procedures, no certificate rotation scripts. The operational simplicity aligns with the self-funded nature of the deployment.

---

## Upgrade Strategy

### K3s Rolling Upgrade Path

K3s upgrades are binary replacements. The system-upgrade-controller (a Kubernetes-native upgrade operator) automates the process:

1. Deploy the system-upgrade-controller to the cluster
2. Create a Plan CRD specifying the target K3s version
3. The controller cordons, drains, upgrades, and uncordons nodes sequentially
4. Control plane nodes upgrade first, then agents

```yaml
apiVersion: upgrade.cattle.io/v1
kind: Plan
metadata:
  name: k3s-server
  namespace: system-upgrade
spec:
  concurrency: 1
  nodeSelector:
    matchExpressions:
      - key: node-role.kubernetes.io/master
        operator: Exists
  serviceAccountName: system-upgrade
  upgrade:
    image: rancher/k3s-upgrade
  version: v1.35.3+k3s1
```

This approach provides zero-downtime upgrades for the control plane (with 3+ HA nodes) and rolling upgrades for agent nodes with proper PodDisruptionBudgets ensuring workload availability.

---

## Kubernetes API Conformance

### Why Conformance Matters

Kubernetes conformance certification guarantees that a distribution implements the standard Kubernetes API surface. Workloads developed against the API specification will work identically across conformant distributions without modification. This matters for the GSD ecosystem because:

1. **Tooling compatibility:** kubectl, Helm, ArgoCD, Kueue, and every CNCF project assume a conformant API. A non-conformant distribution breaks assumptions.
2. **Migration path:** If K3s is ever replaced (e.g., with vanilla K8s for larger scale), workload manifests transfer without modification.
3. **Documentation accuracy:** Official Kubernetes documentation and community guides apply directly to a conformant distribution.

### Conformance by Distribution

| Distribution | CNCF Conformance | API Coverage | Notes |
|-------------|-----------------|-------------|-------|
| K8s (vanilla) | Yes (reference implementation) | 100% | The standard by definition |
| K3s | Yes (certified conformant) | 100% | Same API, different packaging |
| MicroK8s | Yes (certified conformant) | 100% | Snap packaging, same API |
| KubeEdge | Partial | Cloud-side: 100%, Edge-side: subset | Edge nodes run limited API surface |

K3s passes the full CNCF conformance test suite. There is no API compromise for the reduced footprint -- the tradeoffs are purely operational (single binary vs. multi-binary, SQLite option vs. etcd-only).

---

## Control Plane Architecture Comparison

### K8s (Vanilla) Control Plane

```
+------------------+    +------------------+    +------------------+
|  etcd (separate) |    |  kube-apiserver  |    |  kube-scheduler  |
|  Process: etcd   |    |  Process: kube-  |    |  Process: kube-  |
|  Port: 2379/2380 |    |  apiserver       |    |  scheduler       |
+------------------+    |  Port: 6443      |    +------------------+
                        +------------------+
                        +------------------+    +------------------+
                        |  kube-controller |    |  cloud-controller|
                        |  -manager        |    |  -manager        |
                        +------------------+    +------------------+
```

Five separate processes, each with its own binary, configuration, certificate, and failure mode. Managing this requires intimate knowledge of each component's health, upgrade order, and certificate rotation schedule.

### K3s Control Plane

```
+--------------------------------------------------+
|  k3s server (single binary)                      |
|                                                  |
|  [API Server] [Scheduler] [Controller Manager]   |
|  [Embedded etcd or SQLite]                       |
|  [CoreDNS] [Flannel CNI] [Service LB]            |
|                                                  |
|  Port: 6443 (API) + 2379/2380 (etcd, if HA)     |
+--------------------------------------------------+
```

One binary, one process, one systemd unit. The same Kubernetes API, the same scheduling behavior, the same controller logic -- just packaged differently. This is the Amiga Principle: specialized execution paths (the individual components are still logically separated) with a single coordinated runtime (the k3s binary manages the lifecycle of all components together).

---

## Network Architecture for GSD Mesh

### Node Communication Topology

```
                    [Internet]
                        |
                   [Border Router]
                        |
              +---------+---------+
              |    LAN Switch     |
              +-+-+-+-+-+-+-+-+-+-+
                | | | | | | | | |
    +-----------+ | | | | | | | +----------+
    |             | | | | | | |            |
[68000-1]  [68000-2] [68000-3] [Agnus] [Denise-1] [Denise-2] [Paula-1] [Paula-2] [Paula-3]
 Control    Control    Control   Sched   GPU Node   GPU Node   Storage   Storage   Storage
 Server     Server     Server   Agent    Agent      Agent      Agent     Agent     Agent
```

### Port Requirements

| Port | Protocol | Component | Direction |
|------|----------|-----------|-----------|
| 6443 | TCP | K3s API server | Inbound (all nodes to control plane) |
| 2379-2380 | TCP | Embedded etcd | Between control plane nodes only |
| 10250 | TCP | Kubelet API | Control plane to all nodes |
| 8472 | UDP | Flannel VXLAN | Between all nodes (pod-to-pod) |
| 51820 | UDP | WireGuard (if enabled) | Between all nodes (encrypted overlay) |
| 30000-32767 | TCP/UDP | NodePort services | Inbound (if using NodePort) |
| 443/80 | TCP | Gateway API listeners | Inbound (from clients) |

### Firewall Rules

On each node, the host firewall (nftables/iptables) must allow the ports above. K3s does not manage host firewalls -- this is an SYS (Systems Admin) responsibility. The minimum required rules:

```bash
# Control plane nodes (68000)
nft add rule inet filter input tcp dport { 6443, 2379, 2380, 10250 } accept
nft add rule inet filter input udp dport { 8472, 51820 } accept

# Agent nodes (Denise, Paula, Agnus)
nft add rule inet filter input tcp dport { 10250 } accept
nft add rule inet filter input udp dport { 8472, 51820 } accept
nft add rule inet filter input tcp dport { 30000-32767 } accept  # NodePort
```

---

## Cross-References

- **OCN (Open Compute):** Hardware specifications for each node type -- power, cooling, rack density constraints that determine RAM/CPU budgets per node.
- **SYS (Systems Admin):** The OS layer below K3s -- bare-metal provisioning, network interface configuration, filesystem preparation for Longhorn.
- **CMH (Comp. Mesh):** Network topology between nodes. K3s VXLAN overlay runs on top of the mesh network; Flannel/Cilium CNI integrates with the underlying mesh routing.
- **GSD2 (GSD-2 Arch.):** Agent orchestration workloads that run on the cluster. Extension system lifecycle maps to pod deployment patterns.
- **PSG (Pacific Spine):** The backbone network connecting mesh nodes across geographic sites. Multi-site K3s clustering depends on PSG transport layer.

---

## Decision Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Primary distribution | K3s | Single binary, 512MB footprint, native ARM + x86, embedded etcd HA, CNCF Incubating |
| Datastore | Embedded etcd | HA without external dependencies, K3s manages lifecycle |
| Control plane nodes | 3x 68000-type | Minimum for etcd quorum, NoSchedule taint, dedicated to orchestration |
| GPU nodes | Denise-type agents | NVIDIA GPU Operator, topology-aware scheduling, labeled for workload placement |
| Storage nodes | Paula-type agents | Longhorn-designated, relaxed eviction thresholds, mixed SSD/HDD |
| Default CNI | Flannel (upgrade to Cilium) | Start simple, migrate to Cilium when network policy enforcement is needed |
| Ingress | Disabled (Gateway API) | Start native, avoid Ingress migration debt |

---

## Sources

- Kubernetes v1.35 Release Blog -- kubernetes.io/blog/2025/12/17/kubernetes-v1-35-release/
- Kubernetes Releases Page -- kubernetes.io/releases/
- K3s Documentation -- docs.k3s.io/
- K3s GitHub Repository -- github.com/k3s-io/k3s (27,000+ stars)
- K3s Architecture Overview -- docs.k3s.io/architecture
- K3s HA with Embedded etcd -- docs.k3s.io/datastore/ha-embedded
- System Upgrade Controller -- github.com/rancher/system-upgrade-controller
- MicroK8s Documentation -- microk8s.io/docs
- KubeEdge Documentation -- kubeedge.io/docs/
- KEP-4317: Pod Certificates -- github.com/kubernetes/enhancements/issues/4317
- KEP-5284: Constrained Impersonation -- github.com/kubernetes/enhancements/issues/5284
