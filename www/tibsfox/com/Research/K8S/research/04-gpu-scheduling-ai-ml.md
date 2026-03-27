# Module 4: GPU Scheduling & AI/ML Workloads

## Overview

Kubernetes treats GPUs as indivisible units by default. A pod requesting `nvidia.com/gpu: 1` gets an entire physical GPU, even if it only needs 10% of the compute capacity. Industry surveys show that most organizations see only 5-40% GPU utilization due to this all-or-nothing allocation model. For the GSD mesh cluster with dual RTX 5090s, this means potentially wasting the majority of two accelerators that cost over $2,000 each.

The GPU scheduling landscape in 2026 has evolved significantly. Dynamic Resource Allocation (DRA) reached GA in Kubernetes v1.34, providing a native API for fine-grained resource management. NVIDIA's GPU Operator automates the entire driver and runtime stack. Fractional sharing strategies -- MIG, MPS, and time-slicing -- offer different trade-offs between isolation and utilization. Specialized schedulers like Kueue manage job queues with priority, preemption, and fair-share policies.

This module maps the GPU scheduling ecosystem through the lens of the GSD mesh cluster's specific hardware: dual RTX 5090s (consumer Blackwell architecture) that must serve both AI workloads (training, inference) and gaming workloads (Minecraft server rendering) without either starving the other. The Denise node in the Amiga Principle handles all rendering -- the challenge is making that rendering capacity schedulable, shareable, and observable.

---

## The Default Problem

### How Kubernetes Sees GPUs

By default, Kubernetes knows nothing about GPUs. The kubelet cannot detect, allocate, or manage GPU hardware. GPU support requires three components:

1. **NVIDIA Driver:** Kernel module that provides hardware access. Loaded on the host OS or managed by the GPU Operator.
2. **NVIDIA Container Toolkit:** Allows containers to access GPU hardware by injecting the driver libraries and device nodes into the container runtime.
3. **NVIDIA Device Plugin:** A Kubernetes DaemonSet that discovers GPUs on each node, advertises them as schedulable resources (`nvidia.com/gpu`), and handles allocation when pods request GPU resources.

Without additional configuration, each GPU is an atomic unit. A pod requesting `nvidia.com/gpu: 1` exclusively claims one entire GPU. No other pod can use that GPU until the first pod releases it. For an RTX 5090 with 32GB VRAM and enormous compute capacity, running a single small inference model wastes the vast majority of the hardware.

### The Utilization Gap

| Allocation Model | Typical Utilization | Waste Factor |
|-----------------|-------------------|-------------|
| Whole GPU (default) | 5-40% | 60-95% wasted capacity |
| Time-slicing | 40-70% | 30-60% wasted capacity |
| MPS (software sharing) | 50-80% | 20-50% wasted capacity |
| MIG (hardware partition) | 70-95% | 5-30% wasted capacity |
| DRA (dynamic allocation) | Depends on strategy | Framework for any strategy |

The goal is to move from the default (massive waste) toward intelligent sharing (high utilization with appropriate isolation).

---

## NVIDIA GPU Operator

### What It Automates

The GPU Operator packages the entire GPU software stack as a Kubernetes operator, automating deployment and lifecycle management:

| Component | Without Operator | With Operator |
|-----------|-----------------|---------------|
| NVIDIA Driver | Manual install on every node | Containerized, auto-deployed via DaemonSet |
| Container Toolkit | Manual install + containerd config | Auto-configured by operator |
| Device Plugin | Manual DaemonSet deployment | Auto-deployed, version-managed |
| GPU Feature Discovery (GFD) | Manual or not deployed | Auto-deployed, labels nodes |
| DCGM Exporter | Manual Prometheus integration | Auto-deployed, metrics exported |
| MIG Manager | Manual `nvidia-smi mig` commands | CRD-based declarative configuration |
| Validator | Manual health checks | Continuous validation DaemonSet |

### Installation on K3s

```yaml
# GPU Operator Helm values for K3s
apiVersion: v1
kind: Namespace
metadata:
  name: gpu-operator
---
# Helm installation
# helm install gpu-operator nvidia/gpu-operator \
#   --namespace gpu-operator \
#   --set driver.enabled=true \
#   --set toolkit.enabled=true \
#   --set devicePlugin.enabled=true \
#   --set gfd.enabled=true \
#   --set dcgmExporter.enabled=true \
#   --set migManager.enabled=false  # RTX 5090 does not support MIG
```

### GPU Feature Discovery (GFD)

GFD automatically labels nodes with GPU properties, enabling precise workload placement:

```
nvidia.com/gpu.count=2
nvidia.com/gpu.product=NVIDIA-GeForce-RTX-5090
nvidia.com/gpu.memory=32768
nvidia.com/gpu.compute.major=10
nvidia.com/gpu.compute.minor=0
nvidia.com/cuda.driver.major=570
nvidia.com/cuda.runtime.major=12
nvidia.com/gpu.family=blackwell
```

These labels drive node affinity rules. A training job requiring 32GB VRAM can target RTX 5090 nodes specifically. An inference job requiring only 4GB can be scheduled on a shared GPU with time-slicing.

---

## Dynamic Resource Allocation (DRA)

### Architecture (GA in v1.34)

Dynamic Resource Allocation provides a native Kubernetes API for managing hardware resources that do not fit the traditional "count-based" model (where you request `nvidia.com/gpu: 1` as a simple integer). DRA introduces structured resource claims that describe *what* a workload needs rather than *how many* of a fixed resource type.

**Core concepts:**

- **ResourceClaim:** A pod's request for a resource with specific attributes. "I need a GPU with at least 16GB VRAM and Blackwell architecture."
- **ResourceClaimTemplate:** Generates ResourceClaims automatically when pods are created, enabling dynamic per-pod resource allocation.
- **DeviceClass:** Defines categories of devices available in the cluster. "All NVIDIA GPUs with compute capability 10.0+."
- **ResourceSlice:** Published by the DRA driver to advertise available resources. "Node denise-01 has 2 RTX 5090 GPUs, each with 32GB VRAM."

### How DRA Differs from Device Plugin

| Aspect | Device Plugin (legacy) | DRA (v1.34+ GA) |
|--------|----------------------|------------------|
| Resource model | Integer count (`nvidia.com/gpu: 1`) | Structured attributes (VRAM, compute capability, topology) |
| Allocation timing | At pod scheduling time only | At claim creation or pod scheduling |
| Sharing control | None (whole device or nothing) | Explicit sharing policies via ResourceClaim |
| Topology awareness | Limited (scheduler hints) | Native (topology constraints in claims) |
| Multi-resource coordination | None | Claims can express multi-device requirements |
| Dynamic reconfiguration | Not supported | Supported (re-evaluate allocation at runtime) |

### DRA Configuration for GSD Mesh

```yaml
apiVersion: resource.k8s.io/v1beta1
kind: DeviceClass
metadata:
  name: gpu-blackwell
spec:
  selectors:
    - cel:
        expression: "device.attributes['gpu.nvidia.com'].family == 'blackwell'"
---
apiVersion: resource.k8s.io/v1beta1
kind: ResourceClaimTemplate
metadata:
  name: inference-gpu
  namespace: gsd-ai
spec:
  spec:
    devices:
      requests:
        - name: gpu
          deviceClassName: gpu-blackwell
          count: 1
      constraints:
        - matchAttribute: gpu.nvidia.com/memory
          requests:
            - name: gpu
      config:
        - opaque:
            driver: gpu.nvidia.com
            parameters:
              sharing:
                strategy: TimeSlicing
                timeSlicing:
                  replicas: 4
```

---

## GPU Sharing Strategies

### MIG (Multi-Instance GPU)

**Mechanism:** Hardware-level partitioning. The GPU is physically divided into isolated instances, each with its own memory, cache, and compute units. A single A100 can be split into up to 7 MIG instances.

**Isolation:** Full. Each MIG instance is a completely independent GPU from the software perspective. One instance crashing or overloading has zero impact on others.

**Availability:** Enterprise GPUs only -- A100, H100, H200. **Not available on RTX 5090** (consumer Blackwell). MIG requires dedicated hardware support in the GPU architecture.

**GSD mesh impact:** MIG is not an option for the current hardware profile. If the cluster later includes enterprise GPUs (e.g., for production AI training), MIG becomes the gold standard for GPU sharing.

### Time-Slicing

**Mechanism:** The GPU context-switches between multiple workloads on a configurable time interval. Each workload gets full access to all GPU compute units during its time slice.

**Isolation:** None. All workloads share the same GPU memory space. A workload that allocates excessive VRAM can cause out-of-memory errors for other workloads on the same GPU. There is no hardware-enforced memory partition.

**Availability:** All NVIDIA GPUs. This is the primary sharing mechanism for RTX 5090s.

**Configuration via GPU Operator:**

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: device-plugin-config
  namespace: gpu-operator
data:
  config.yaml: |
    version: v1
    sharing:
      timeSlicing:
        renameByDefault: false
        failRequestsGreaterThanOne: true
        resources:
          - name: nvidia.com/gpu
            replicas: 4
```

With `replicas: 4`, each physical GPU appears as 4 allocatable GPUs in Kubernetes. Four pods can each request `nvidia.com/gpu: 1` and share a single physical GPU via time-slicing.

**Trade-offs for GSD mesh:**

| Workload Combination | Time-Slicing Behavior | Risk |
|---------------------|----------------------|------|
| 4 inference models | Good -- each gets compute slices, models stay in VRAM | VRAM exhaustion if total exceeds 32GB |
| 1 training + 3 inference | Risky -- training job's compute demand starves inference latency | SLA violations on inference |
| Minecraft + inference | Acceptable -- Minecraft rendering is bursty, inference is steady | Frame rate stutters during inference peaks |

### MPS (Multi-Process Service)

**Mechanism:** NVIDIA's Multi-Process Service allows multiple CUDA processes to share a GPU simultaneously through a server process that arbitrates access. Unlike time-slicing, MPS does not context-switch -- multiple kernels from different processes can execute concurrently on the GPU.

**Isolation:** Partial. Memory is shared but processes have separate CUDA contexts. MPS enforces per-client memory limits (compute capability 7.0+) and provides better utilization than time-slicing for concurrent inference workloads.

**Availability:** NVIDIA GPUs with compute capability 3.5+. The RTX 5090 (compute capability 10.0) supports MPS.

**Key advantage over time-slicing:** MPS allows concurrent kernel execution. Two inference workloads can run their CUDA kernels at the same time, using different streaming multiprocessors on the same GPU. Time-slicing forces sequential execution with context-switch overhead between each workload.

**Configuration:**

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: device-plugin-config
  namespace: gpu-operator
data:
  config.yaml: |
    version: v1
    sharing:
      mps:
        renameByDefault: false
        failRequestsGreaterThanOne: true
        resources:
          - name: nvidia.com/gpu
            replicas: 4
            memoryLimit: 8192Mi  # 8GB per client (4 clients x 8GB = 32GB)
```

### Sharing Strategy Comparison

| Strategy | Mechanism | Isolation | Concurrency | VRAM Management | RTX 5090 Support | Best For |
|----------|-----------|-----------|-------------|----------------|-----------------|---------|
| MIG | Hardware partition | Full | Hardware-parallel | Dedicated per instance | No (enterprise only) | Multi-tenant production |
| Time-slicing | Context switch | None | Sequential | Shared (no limits) | Yes | Mixed workloads, simple setup |
| MPS | Software mux | Partial | Concurrent kernels | Configurable limits | Yes | Multiple inference, high throughput |
| DRA | API framework | Strategy-dependent | Strategy-dependent | Claim-based | Yes | Kubernetes-native management |

**GSD mesh recommendation:** MPS as primary sharing strategy for inference workloads (concurrent kernel execution, memory limits). Time-slicing as fallback for mixed training/inference scenarios. DRA as the Kubernetes API layer for both.

---

## Specialized Schedulers

### Kueue: Cloud-Native Job Queueing

Kueue provides a Kubernetes-native job queueing system that manages resource quotas, priorities, and fair-share policies for batch workloads. It is the primary scheduler for AI training jobs.

**Core concepts:**

- **ClusterQueue:** Defines the total resources available for a class of workloads. "The AI training queue has access to 2 GPUs with 64GB total VRAM."
- **LocalQueue:** Namespace-scoped queue that borrows resources from a ClusterQueue. "The inference team's queue can use up to 1 GPU from the AI pool."
- **Workload:** A wrapper around a Kubernetes Job that Kueue manages. Jobs are admitted to a queue, wait for resources, and run when capacity is available.
- **ResourceFlavor:** Defines a type of hardware. "RTX 5090 nodes" vs. "CPU-only nodes." Queues can target specific flavors.

**Configuration for GSD mesh:**

```yaml
apiVersion: kueue.x-k8s.io/v1beta1
kind: ClusterQueue
metadata:
  name: gpu-training
spec:
  namespaceSelector: {}
  resourceGroups:
    - coveredResources: ["cpu", "memory", "nvidia.com/gpu"]
      flavors:
        - name: rtx-5090
          resources:
            - name: "nvidia.com/gpu"
              nominalQuota: 2
            - name: "cpu"
              nominalQuota: 16
            - name: "memory"
              nominalQuota: 64Gi
  preemption:
    withinClusterQueue: LowerPriority
    reclaimWithinCohort: Any
---
apiVersion: kueue.x-k8s.io/v1beta1
kind: LocalQueue
metadata:
  name: training-queue
  namespace: gsd-ai
spec:
  clusterQueue: gpu-training
```

**Preemption policies:** Kueue supports priority-based preemption. A high-priority training job can evict lower-priority inference workloads to claim GPU resources. The evicted workloads are re-queued and resume when resources become available.

### Volcano: Gang Scheduling

Volcano provides gang scheduling for distributed training workloads. Gang scheduling ensures that all pods in a distributed training job start simultaneously -- if a training job needs 4 GPU pods, it waits until all 4 can be scheduled rather than starting 2 and waiting for 2 more (which would waste GPU cycles on the running pods while they wait for peers).

**Key capabilities:**

- **Gang scheduling:** All-or-nothing pod scheduling for distributed jobs
- **Fair-share scheduling:** Multiple queues with weighted resource allocation
- **Backfill scheduling:** Run small jobs in gaps left by large pending jobs
- **TDM (Time Division Multiplexing):** Share GPUs across jobs with time-based allocation

**GSD mesh fit:** Volcano is most valuable for large distributed training (8+ GPUs across multiple nodes). For the GSD mesh with 2 GPUs, Kueue's simpler queueing model is sufficient. Volcano becomes relevant if the cluster scales to include additional GPU nodes.

### YuniKorn (Apache)

YuniKorn is an Apache scheduler that supports queue hierarchies and resource fragmentation handling. It is designed for large-scale multi-tenant environments (think Hadoop/Spark cluster management for Kubernetes).

**GSD mesh fit:** Overkill for a 10-node cluster. YuniKorn shines at 100+ node scale with complex organizational hierarchies. Not recommended for the GSD mesh.

---

## Topology-Aware Scheduling

### Why Topology Matters

For dual GPU nodes, the physical topology of GPUs on the PCIe bus affects performance:

- **GPU-to-GPU communication:** If two GPUs are connected via NVLink or NVSwitch, data transfer between them is 5-10x faster than going through the PCIe bus. For distributed training across GPUs on the same node, NVLink locality is critical.
- **CPU-to-GPU affinity:** Each GPU is physically connected to a specific CPU socket's PCIe lanes. Scheduling a pod on a CPU core with affinity to the GPU's PCIe controller reduces latency.
- **NUMA topology:** Non-Uniform Memory Access -- accessing memory on the same NUMA node as the GPU is faster than cross-NUMA access.

### Kubernetes Topology Manager

The kubelet's Topology Manager coordinates resource allocation across CPU, memory, and device managers to ensure co-located resource assignment:

```yaml
# kubelet configuration for GPU nodes (Denise)
kubelet-arg:
  - "topology-manager-policy=best-effort"
  - "topology-manager-scope=pod"
  - "cpu-manager-policy=static"
  - "memory-manager-policy=Static"
  - "reserved-cpus=0-1"
```

**Policies:**

| Policy | Behavior | GSD Mesh Use Case |
|--------|----------|-------------------|
| `none` | No topology alignment | Development, testing |
| `best-effort` | Try to align, schedule anyway if impossible | Default for GPU nodes |
| `restricted` | Reject pods that cannot be topology-aligned | Latency-sensitive inference |
| `single-numa-node` | All resources must be on same NUMA node | Maximum performance training |

### RTX 5090 Specific Considerations

The RTX 5090 is a consumer Blackwell GPU. Important differences from enterprise GPUs:

| Feature | RTX 5090 (Consumer) | A100/H100 (Enterprise) |
|---------|---------------------|----------------------|
| MIG support | No | Yes (up to 7 instances) |
| NVLink support | NVLink Bridge (2 GPUs) | NVSwitch (8+ GPUs) |
| ECC memory | No (consumer GDDR7) | Yes (HBM3/HBM3e) |
| MPS support | Yes | Yes |
| DRA support | Yes (via Device Plugin) | Yes |
| Secure boot / attestation | Limited | vGPU, confidential computing |
| VRAM | 32GB GDDR7 | 80GB HBM3 (A100) / 80-188GB HBM3e (H100/H200) |
| TDP | ~450W | 300-700W |

**Key implications:**

1. No MIG -- time-slicing and MPS are the only sharing options
2. No ECC -- single-bit errors in VRAM can corrupt training results (not a concern for inference or gaming)
3. NVLink Bridge connects exactly 2 GPUs -- multi-node GPU communication goes through the network, not NVLink
4. Power consumption matters for a self-funded cluster -- 900W for dual GPUs at full load

---

## Workload Scheduling for GSD Mesh

### Workload Priority Matrix

| Workload | Priority | GPU Requirement | Sharing Mode | Preemptible |
|----------|----------|----------------|--------------|-------------|
| AI training (batch) | Medium | 1-2 full GPUs | Exclusive or time-sliced | Yes (by high-priority) |
| AI inference (serving) | High | Fractional (MPS 4-way) | MPS with memory limits | No |
| Minecraft rendering | Medium | Fractional (time-sliced) | Time-slicing 2-way | Yes (by inference) |
| Gradient Engine compute | Low | Opportunistic | Time-slicing or MPS | Yes |
| Monitoring/metrics | Lowest | DCGM exporter only | N/A (monitoring agent) | N/A |

### Pod Resource Specification

```yaml
# AI inference pod with MPS sharing
apiVersion: v1
kind: Pod
metadata:
  name: inference-server
  namespace: gsd-ai
spec:
  nodeSelector:
    gsd.mesh/role: denise
    nvidia.com/gpu.product: NVIDIA-GeForce-RTX-5090
  containers:
    - name: model-server
      image: gsd/inference:latest
      resources:
        limits:
          nvidia.com/gpu: 1  # 1 of 4 MPS replicas (8GB VRAM)
          cpu: "4"
          memory: 16Gi
        requests:
          nvidia.com/gpu: 1
          cpu: "2"
          memory: 8Gi
---
# Minecraft server with time-sliced GPU
apiVersion: v1
kind: Pod
metadata:
  name: minecraft-server
  namespace: minecraft
spec:
  nodeSelector:
    gsd.mesh/role: denise
  containers:
    - name: minecraft
      image: itzg/minecraft-server:latest
      resources:
        limits:
          nvidia.com/gpu: 1  # 1 of 4 time-sliced replicas
          cpu: "4"
          memory: 8Gi
      env:
        - name: EULA
          value: "TRUE"
        - name: TYPE
          value: "PAPER"
```

---

## GPU Monitoring and Observability

### DCGM Exporter

The NVIDIA Data Center GPU Manager (DCGM) exporter runs as a DaemonSet on GPU nodes, collecting metrics and exposing them in Prometheus format:

- `DCGM_FI_DEV_GPU_UTIL` -- GPU compute utilization (%)
- `DCGM_FI_DEV_MEM_COPY_UTIL` -- Memory controller utilization (%)
- `DCGM_FI_DEV_FB_USED` -- Framebuffer (VRAM) used (MB)
- `DCGM_FI_DEV_FB_FREE` -- Framebuffer (VRAM) free (MB)
- `DCGM_FI_DEV_GPU_TEMP` -- GPU temperature (C)
- `DCGM_FI_DEV_POWER_USAGE` -- Power consumption (W)
- `DCGM_FI_DEV_SM_CLOCK` -- Streaming Multiprocessor clock (MHz)

### Grafana Dashboard

The GPU Operator includes a pre-built Grafana dashboard for GPU monitoring. Key panels:

- Per-GPU utilization over time
- VRAM usage per pod (when using MPS with per-client tracking)
- Power consumption vs. workload correlation
- Temperature alerts for thermal throttling detection
- GPU error counts (XID errors indicating hardware issues)

---

## Cross-References

- **GRD (Gradient Engine):** The AI/ML workloads that consume GPU resources. Training job specifications, model sizes, and inference latency requirements drive GPU scheduling decisions.
- **OCN (Open Compute):** Power budget for GPU nodes. Dual RTX 5090 at 900W TDP requires dedicated circuits and cooling.
- **CMH (Comp. Mesh):** Network bandwidth for distributed training across nodes. GPU-to-GPU communication over the mesh uses NCCL/Gloo collectives.
- **SYS (Systems Admin):** NVIDIA driver installation, CUDA toolkit version management, kernel module configuration.
- **PMG (Pi-Mono + GSD):** Pi agent runtime inference workloads running on GPU nodes. LLM serving pods scheduled via Kueue.

---

## Decision Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| GPU software stack | NVIDIA GPU Operator | Automates driver, toolkit, device plugin, monitoring |
| Sharing strategy (inference) | MPS (4-way) | Concurrent kernel execution, memory limits, best utilization |
| Sharing strategy (mixed) | Time-slicing (2-4 way) | Simpler setup, works for bursty workloads (Minecraft) |
| Job scheduling | Kueue | Kubernetes-native queueing, priority preemption, fair-share |
| Resource API | DRA (v1.34 GA) | Structured claims, topology awareness, sharing policies |
| Topology manager | best-effort policy | Align CPU/GPU/memory affinity without blocking scheduling |
| Monitoring | DCGM Exporter + Prometheus + Grafana | Native GPU metrics, power tracking, utilization alerts |

---

## Sources

- NVIDIA GPU Operator Documentation -- docs.nvidia.com/datacenter/cloud-native/gpu-operator/
- NVIDIA Device Plugin -- github.com/NVIDIA/k8s-device-plugin
- Dynamic Resource Allocation -- kubernetes.io/docs/concepts/scheduling-eviction/dynamic-resource-allocation/
- KEP-3063: Dynamic Resource Allocation -- github.com/kubernetes/enhancements/issues/3063
- NVIDIA MPS Documentation -- docs.nvidia.com/deploy/mps/
- NVIDIA Time-Slicing GPUs in Kubernetes -- docs.nvidia.com/datacenter/cloud-native/gpu-operator/gpu-sharing.html
- Kueue Documentation -- kueue.sigs.k8s.io/docs/
- Volcano Documentation -- volcano.sh/docs/
- DCGM Exporter -- github.com/NVIDIA/dcgm-exporter
- Kubernetes Topology Manager -- kubernetes.io/docs/tasks/administer-cluster/topology-manager/
- KubeCon EU 2026: GPU Isolation via Kata Containers (NVIDIA)
- KubeCon EU 2026: Kueue Adoption for AI Inference at Scale
- Spectro Cloud: State of Kubernetes 2025 -- GPU over-provisioning data
