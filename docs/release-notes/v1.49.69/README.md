# v1.49.69 — "The Orchestrator"

**Shipped:** 2026-03-26
**Commits:** 1 (`c82e8429`)
**Files:** 14 | **Lines:** +4,501 / -0 (net +4,501)
**Branch:** dev → main
**Tag:** v1.49.69
**Dedicated to:** the Borg — Google's internal container orchestration system that Kubernetes was born from, and to every operator who has been paged at 3am because a pod wouldn't schedule

> "Kubernetes doesn't run your containers. It runs the system that runs your containers. The orchestrator orchestrates the orchestration."

---

## Summary

The 69th Research project and the largest single-project entry in the series by line count. K8S (Kubernetes Ecosystem) maps the complete state of cloud-native container orchestration as of 2026 — from K3s edge deployments to GPU scheduling with NVIDIA's DRA (Dynamic Resource Allocation, GA in v1.34), from Gateway API replacing Ingress-NGINX to zero-trust security with pod certificates (KEP-4317), from Rook/Ceph distributed storage to ArgoCD GitOps pipelines.

Six research modules cover the full stack: distribution landscape (K8s v1.35, K3s, MicroK8s, KubeEdge), networking (Gateway API, Cilium eBPF, service mesh, MetalLB), storage (CSI, Longhorn, Rook/Ceph, OpenEBS Mayastor), GPU scheduling (NVIDIA GPU Operator, MIG/MPS/time-slicing, Kueue/Volcano batch scheduling, topology-aware allocation), security (5 defense layers, network policies, RBAC, Kyverno, Falco/Tetragon runtime), and operations (ArgoCD, Prometheus/Loki/OpenTelemetry, VPA, FinOps, Velero).

K8S connects directly to the FoxCompute vision documented in PSG (Pacific Spine Ground Truth). The same OpenStack/Ceph infrastructure CERN runs at petabyte scale needs Kubernetes for workload orchestration. The GPU scheduling module (Module 04) maps directly to FoxCompute's AI/ML compute requirements with RTX 5090 specifics. The security module connects to SAN (SANS Institute) defensive posture. The GitOps operations connect to GSD2's own orchestration patterns.

Named "The Orchestrator" — because Kubernetes is the system that orchestrates container orchestration. The meta-layer. The thing that runs the things that run the things.

### Key Features

**Location:** `www/tibsfox/com/Research/K8S/`
**Files:** 14 | **Research lines:** 3,003 | **Sources:** 30+ | **Cross-linked projects:** 8
**Theme:** Infrastructure — steel (#263238), electric blue (#1565C0), graphite (#37474F)

| # | Title | Lines | Through-Line |
|---|-------|-------|-------------|
| 01 | Distributions & Architecture | 392 | *K8s v1.35. K3s at the edge. MicroK8s for dev. The Amiga Principle: control plane as Agnus, kubelet as Paula, container runtime as Denise.* |
| 02 | Networking & Traffic Management | 361 | *Gateway API replaces Ingress. Cilium eBPF replaces iptables. The network layer is being rewritten from the kernel up.* |
| 03 | Storage & Persistence | 421 | *CSI standardized the interface. Longhorn made it simple. Rook/Ceph made it planetary. The storage decision framework.* |
| 04 | GPU Scheduling & AI/ML | 506 | *NVIDIA GPU Operator. DRA is GA. MIG slices GPUs into virtual units. Kueue manages the queue. Topology-aware scheduling knows which GPUs share a PCIe switch.* |
| 05 | Security & Zero Trust | 668 | *Five defense layers. Network policies. RBAC. Pod certificates. Kyverno admission control. Falco/Tetragon runtime detection. Phased implementation.* |
| 06 | Operations & Observability | 655 | *ArgoCD GitOps. Three-pillar observability. Self-healing probes. VPA right-sizing. FinOps cost attribution. The complete operational stack.* |

**Module highlights:**
- **04 — GPU Scheduling:** The most FoxCompute-relevant module. NVIDIA GPU Operator installation and configuration. Dynamic Resource Allocation (DRA) GA in v1.34. MIG (Multi-Instance GPU), MPS (Multi-Process Service), and time-slicing compared. Kueue and Volcano batch scheduling. Topology-aware scheduling for multi-GPU workloads. RTX 5090 specifications and scheduling considerations.
- **05 — Security:** The largest module at 668 lines. Five defense layers mapped: cluster hardening → network policies → RBAC → admission control → runtime detection. KEP-4317 pod certificates for zero-trust identity. Kyverno policy examples. Falco and Tetragon runtime security compared. Phased implementation roadmap.
- **06 — Operations:** The second-largest at 655 lines. Complete ArgoCD GitOps setup. Three-pillar observability (Prometheus metrics, Loki logs, OpenTelemetry traces). Self-healing with probes and PodDisruptionBudgets. VPA right-sizing methodology. FinOps cost attribution with Kubecost. Velero backup and disaster recovery.

### Mission Pack

The original mission pack (`mission-pack/`) contains the full LaTeX source (976 lines), compiled PDF, and HTML index.

### Verification

- **36 tests total:** 6 safety-critical (security configurations), 14 core, 10 integration, 6 edge cases
- **35/36 PASS**
- **100% sourced** — Kubernetes documentation, CNCF projects, vendor documentation

### File Inventory

**14 new files, ~4,501 total lines. Research series: 69 complete projects, 561 research modules, ~254,000 lines.**

---

## Retrospective

### What Worked

1. **The six-module structure maps the Kubernetes stack cleanly.** Distributions → Networking → Storage → GPU → Security → Operations follows the actual stack from infrastructure through workload to operational management. Each module is self-contained but connects to adjacent layers.

2. **GPU scheduling documentation fills a critical gap.** Module 04's coverage of DRA, MIG, MPS, topology-aware scheduling, and batch queue systems (Kueue/Volcano) maps territory that most Kubernetes guides skip. For FoxCompute with its RTX 4060 Ti (and future GPU fleet), this is directly actionable infrastructure intelligence.

3. **Security and operations modules earned their length.** At 668 and 655 lines respectively, Modules 05 and 06 are the longest in the series. The length is justified: security requires covering five defense layers with specific configurations, and operations requires the full GitOps + observability + self-healing + FinOps stack. Cutting either would create gaps.

### What Could Be Better

1. **The multi-cluster and federation story is thin.** K8S focuses on single-cluster architecture. Multi-cluster federation (Liqo, Admiralty, Clusternet) and the emerging multi-cluster service mesh patterns would strengthen the FoxCompute distributed deployment model.

### Lessons Learned

1. **Kubernetes is infrastructure for infrastructure.** K8S doesn't run applications — it runs the system that runs applications. This meta-layer pattern is the same one that GSD implements for development workflows: not the work itself, but the system that orchestrates the work. The architectural parallel is structural.

2. **The CNCF ecosystem is the new Linux distribution landscape.** Just as Linux distributions package the kernel with different userland choices, CNCF projects package Kubernetes with different networking (Cilium/Calico), storage (Longhorn/Rook), and observability (Prometheus/OpenTelemetry) choices. The distribution decision is really a CNCF stack decision.

---

> *Kubernetes doesn't run your containers. It runs the system that runs your containers. The orchestrator orchestrates the orchestration. And at 3am, when a pod won't schedule because the GPU topology doesn't match the affinity rules, the operator is the one who actually runs everything.*
>
> *The steel and electric blue of infrastructure. The layer that everything else depends on.*
