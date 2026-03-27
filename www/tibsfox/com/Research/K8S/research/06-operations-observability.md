# Module 6: Operations & Observability

## Overview

A Kubernetes cluster without observability is a black box that will eventually fail in ways no one can diagnose. A cluster without GitOps is manual infrastructure that drifts from its declared state. A cluster without backup and disaster recovery is a data loss event waiting for a trigger. Operations and observability are not the "boring" part of the Kubernetes ecosystem -- they are the layer that determines whether the system survives its first real incident.

This module covers four operational pillars for the GSD mesh cluster: GitOps (cluster state as code), monitoring (metrics, logs, and traces), backup and disaster recovery (survival), and cost optimization (sustainability). Each pillar maps to concrete tool selections, configuration patterns, and operational procedures. The goal is a cluster that is not just running but *observable*, *recoverable*, and *efficient*.

For a self-funded bare-metal deployment, every watt matters, every disk hour has cost, and every unmonitored failure mode is a weekend debugging session. Operations is where the Amiga Principle meets operational maturity -- specialized tools doing dedicated work, coordinated by a control plane that knows what is happening across the entire system.

---

## GitOps

### What GitOps Provides

GitOps is infrastructure as code taken to its logical conclusion: the Git repository is the single source of truth for cluster state. Every Kubernetes manifest -- Deployments, Services, ConfigMaps, NetworkPolicies, RBAC rules -- lives in a Git repository. A GitOps engine running inside the cluster continuously reconciles the live cluster state with the desired state in Git.

**Core principles:**

1. **Declarative:** All infrastructure is described as Kubernetes manifests in YAML
2. **Versioned:** Git history provides complete audit trail of every change
3. **Automated:** Changes are applied automatically when merged to the main branch
4. **Self-healing:** If someone manually modifies a resource, the GitOps engine detects the drift and reverts to the Git-declared state

### ArgoCD vs. Flux

| Feature | ArgoCD | Flux |
|---------|--------|------|
| Architecture | Application-centric (ArgoCD Application CRD) | Source-centric (GitRepository + Kustomization CRDs) |
| UI | Full web dashboard with application topology visualization | CLI-only (Grafana dashboards available) |
| Helm support | Via Application spec, rendered during sync | Native HelmRelease CRD |
| Kustomize support | Native | Native |
| Multi-cluster | Native (hub-spoke model) | Native (Cluster API integration) |
| Diff visualization | Web UI shows planned changes before sync | CLI diff command |
| SSO integration | OIDC, LDAP, SAML | N/A (no built-in UI to protect) |
| CNCF status | Graduated | Graduated |
| Resource footprint | ~200MB RAM (server + repo-server + app-controller) | ~50MB RAM (source-controller + kustomize-controller) |

**GSD mesh recommendation:** ArgoCD. The web UI provides immediate visual feedback on cluster state, application health, and sync status. For a learning environment where understanding the cluster state is as important as running it, the visual topology view is invaluable. The higher resource footprint (200MB vs. 50MB) is negligible on a 10-node cluster with 16+ GB RAM per node.

### ArgoCD Configuration for GSD Mesh

```yaml
# ArgoCD Application for the GSD system namespace
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: gsd-system
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/Tibsfox/gsd-mesh-cluster
    targetRevision: main
    path: manifests/gsd-system
  destination:
    server: https://kubernetes.default.svc
    namespace: gsd-system
  syncPolicy:
    automated:
      prune: true       # Delete resources removed from Git
      selfHeal: true    # Revert manual changes
    syncOptions:
      - CreateNamespace=true
      - PrunePropagationPolicy=foreground
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
---
# ArgoCD Application for Minecraft
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: minecraft
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/Tibsfox/gsd-mesh-cluster
    targetRevision: main
    path: manifests/minecraft
  destination:
    server: https://kubernetes.default.svc
    namespace: minecraft
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
---
# ArgoCD Application for monitoring stack
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: monitoring
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/Tibsfox/gsd-mesh-cluster
    targetRevision: main
    path: manifests/monitoring
  destination:
    server: https://kubernetes.default.svc
    namespace: monitoring
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

### Repository Structure

```
gsd-mesh-cluster/
  manifests/
    gsd-system/
      deployment.yaml
      service.yaml
      networkpolicy.yaml
      rbac.yaml
    minecraft/
      deployment.yaml
      service.yaml
      networkpolicy.yaml
      configmap.yaml
    monitoring/
      prometheus/
        deployment.yaml
        service.yaml
        configmap.yaml
      grafana/
        deployment.yaml
        service.yaml
      loki/
        deployment.yaml
        service.yaml
    storage/
      longhorn/
        values.yaml
      nfs/
        exports.yaml
    security/
      kyverno/
        policies/
      network-policies/
        default-deny.yaml
```

Every change to the cluster goes through a Git pull request. Code review, approval, merge -- then ArgoCD applies the change automatically. No `kubectl apply` from a laptop. No manual edits to running resources. The Git log IS the change log.

---

## Monitoring Stack

### Architecture

The monitoring stack for the GSD mesh consists of four components, each handling a different signal type:

```
                    Grafana (Visualization)
                   /          |          \
          Prometheus      Loki        OpenTelemetry
          (Metrics)     (Logs)       (Traces)
             |             |              |
        +---------+    +--------+    +---------+
        |Exporters|    |Promtail|    |  OTLP   |
        +---------+    +--------+    | Collector|
        |node     |    |pod log |    +---------+
        |kube-state|   |streams |    |app traces|
        |dcgm-gpu |    +--------+    +---------+
        |longhorn |
        +---------+
```

### Prometheus

Prometheus is the de facto standard for Kubernetes metrics collection. It scrapes metrics endpoints, stores time-series data, and evaluates alerting rules.

**Key exporters for the GSD mesh:**

| Exporter | Metrics | Purpose |
|----------|---------|---------|
| node-exporter | CPU, memory, disk, network per node | Hardware health baseline |
| kube-state-metrics | Pod status, deployment replicas, PVC state | Kubernetes object health |
| DCGM Exporter | GPU utilization, VRAM, temperature, power | GPU workload monitoring |
| Longhorn metrics | Volume health, replication status, IOPS | Storage system health |
| CoreDNS metrics | DNS query rate, latency, errors | Service discovery health |
| Cilium metrics | Network policy hits, flow counts, latency | Network security monitoring |

**Alerting rules:**

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: gsd-mesh-alerts
  namespace: monitoring
spec:
  groups:
    - name: node-health
      rules:
        - alert: NodeHighMemory
          expr: (1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) > 0.9
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "Node {{ $labels.instance }} memory usage above 90%"
        - alert: NodeDiskFull
          expr: (1 - node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) > 0.85
          for: 10m
          labels:
            severity: critical
          annotations:
            summary: "Node {{ $labels.instance }} disk usage above 85%"
    - name: gpu-health
      rules:
        - alert: GPUHighTemperature
          expr: DCGM_FI_DEV_GPU_TEMP > 85
          for: 2m
          labels:
            severity: warning
          annotations:
            summary: "GPU {{ $labels.gpu }} on {{ $labels.instance }} above 85C"
        - alert: GPUMemoryExhausted
          expr: DCGM_FI_DEV_FB_FREE < 1024
          for: 1m
          labels:
            severity: critical
          annotations:
            summary: "GPU {{ $labels.gpu }} on {{ $labels.instance }} has less than 1GB VRAM free"
    - name: storage-health
      rules:
        - alert: LonghornVolumeDegrade
          expr: longhorn_volume_robustness == 2
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "Longhorn volume {{ $labels.volume }} is degraded"
        - alert: LonghornVolumeFaulted
          expr: longhorn_volume_robustness == 3
          for: 1m
          labels:
            severity: critical
          annotations:
            summary: "Longhorn volume {{ $labels.volume }} is faulted -- data at risk"
    - name: kubernetes-health
      rules:
        - alert: PodCrashLooping
          expr: increase(kube_pod_container_status_restarts_total[1h]) > 5
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "Pod {{ $labels.namespace }}/{{ $labels.pod }} is crash-looping"
        - alert: PodNotReady
          expr: kube_pod_status_ready{condition="true"} == 0
          for: 15m
          labels:
            severity: warning
          annotations:
            summary: "Pod {{ $labels.namespace }}/{{ $labels.pod }} not ready for 15 minutes"
```

### Loki (Log Aggregation)

Loki is Grafana's log aggregation system, designed as "Prometheus for logs." Unlike Elasticsearch, Loki does not index log content -- it indexes only labels (namespace, pod, container), making it dramatically more resource-efficient.

**Why Loki over Elasticsearch:**

| Dimension | Loki | Elasticsearch |
|-----------|------|---------------|
| Index strategy | Labels only | Full-text indexing |
| Resource footprint | ~200MB RAM | ~2GB+ RAM |
| Storage efficiency | Compressed chunks | Index + raw data |
| Query language | LogQL (PromQL-like) | Lucene / KQL |
| Integration | Native Grafana | Kibana (separate stack) |
| Operational complexity | Low (single binary mode) | High (JVM tuning, shard management) |

For a 10-node cluster, Elasticsearch's resource overhead is disproportionate. Loki runs in single-binary mode with minimal configuration and integrates directly with Grafana dashboards alongside Prometheus metrics.

**Log collection with Promtail:**

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: promtail
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app: promtail
  template:
    spec:
      containers:
        - name: promtail
          image: grafana/promtail:latest
          args:
            - -config.file=/etc/promtail/config.yaml
          volumeMounts:
            - name: varlog
              mountPath: /var/log
            - name: containers
              mountPath: /var/lib/docker/containers
              readOnly: true
      volumes:
        - name: varlog
          hostPath:
            path: /var/log
        - name: containers
          hostPath:
            path: /var/lib/docker/containers
```

### OpenTelemetry (Distributed Tracing)

OpenTelemetry provides vendor-neutral instrumentation for distributed tracing. When a request flows through multiple services (Gateway API -> GSD API -> worker -> GPU inference), OpenTelemetry traces the entire path with timing data at each hop.

**GSD mesh integration:**

- OpenTelemetry Collector runs as a DaemonSet, receiving traces via OTLP protocol
- Applications instrument with OpenTelemetry SDKs (auto-instrumentation for common frameworks)
- Traces stored in Grafana Tempo (or Jaeger) for visualization
- Correlate traces with metrics (Prometheus) and logs (Loki) in Grafana dashboards

---

## Self-Healing Patterns

### Liveness and Readiness Probes

Probes are the foundation of Kubernetes self-healing. They tell the kubelet when a container is healthy (liveness) and when it is ready to receive traffic (readiness).

```yaml
containers:
  - name: gsd-api
    image: gsd/api:latest
    livenessProbe:
      httpGet:
        path: /healthz
        port: 8080
      initialDelaySeconds: 15
      periodSeconds: 10
      failureThreshold: 3    # Restart after 3 consecutive failures
    readinessProbe:
      httpGet:
        path: /ready
        port: 8080
      initialDelaySeconds: 5
      periodSeconds: 5
      failureThreshold: 2    # Remove from service after 2 failures
    startupProbe:
      httpGet:
        path: /healthz
        port: 8080
      failureThreshold: 30
      periodSeconds: 10      # Allow up to 300s for startup
```

**Probe types:**

| Probe | Failure Action | Use Case |
|-------|---------------|----------|
| Liveness | Container restarted | Process hung, deadlocked, unresponsive |
| Readiness | Removed from Service endpoints | Not ready to serve (loading model, warming cache) |
| Startup | Delays liveness checks | Slow-starting applications (AI model loading) |

### PodDisruptionBudgets

PodDisruptionBudgets (PDBs) prevent cluster operations (node drain, rolling upgrade) from taking down too many instances of a service simultaneously:

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: gsd-api-pdb
  namespace: gsd-system
spec:
  minAvailable: 1     # At least 1 replica must always be running
  selector:
    matchLabels:
      app: gsd-api
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: minecraft-pdb
  namespace: minecraft
spec:
  maxUnavailable: 0   # Never voluntarily disrupt Minecraft (players connected)
  selector:
    matchLabels:
      app: minecraft-server
```

### Node Auto-Repair

K3s can be configured with a Node Problem Detector that watches for hardware issues (disk failures, memory errors, kernel panics) and triggers automatic remediation:

1. Node Problem Detector identifies a condition (e.g., read-only filesystem)
2. NPD adds a condition/taint to the node
3. Pods are evicted to healthy nodes
4. If the node does not recover within a timeout, it is cordoned and drained
5. Alert fires for human investigation

---

## Resource Right-Sizing

### The Over-Provisioning Problem

Kubernetes resource requests and limits define how much CPU and memory each pod gets:

- **Request:** The guaranteed minimum. The scheduler uses requests to place pods on nodes.
- **Limit:** The maximum allowed. The kubelet kills containers that exceed their memory limit.

The common failure mode is over-provisioning: setting requests and limits far higher than actual usage. This wastes cluster capacity and prevents optimal pod placement.

### In-Place Pod Resource Adjustment (GA in v1.35)

Kubernetes v1.35 graduated in-place pod resource adjustment. CPU and memory requests/limits can be changed on running pods without restarting them:

```bash
# Resize a running pod's CPU limit
kubectl patch pod gsd-api-7d4f8b6c9-x2k4m --subresource resize \
  --type merge -p '{"spec":{"containers":[{"name":"api","resources":{"limits":{"cpu":"2"}}}]}}'
```

This eliminates the restart penalty for right-sizing. An inference server that needs more memory during peak hours can be scaled up without losing loaded model state.

### Vertical Pod Autoscaler (VPA)

VPA observes actual resource usage over time and recommends or automatically applies right-sized resource requests:

```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: gsd-api-vpa
  namespace: gsd-system
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: gsd-api
  updatePolicy:
    updateMode: "Auto"     # Automatically apply recommendations
  resourcePolicy:
    containerPolicies:
      - containerName: api
        minAllowed:
          cpu: 100m
          memory: 128Mi
        maxAllowed:
          cpu: "4"
          memory: 8Gi
```

### Resource Quotas per Namespace

Prevent runaway consumption with namespace-level quotas:

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: minecraft-quota
  namespace: minecraft
spec:
  hard:
    requests.cpu: "8"
    requests.memory: 32Gi
    limits.cpu: "16"
    limits.memory: 64Gi
    requests.nvidia.com/gpu: "2"
    persistentvolumeclaims: "10"
    pods: "20"
```

---

## FinOps for Self-Funded Clusters

### Why FinOps Matters for Bare-Metal

FinOps is not just for cloud bills. A self-funded bare-metal cluster has real costs:

| Cost Category | Driver | Measurement |
|--------------|--------|-------------|
| Electricity | GPU power consumption (900W at full load for dual RTX 5090) | kWh per month |
| Disk wear | SSD write endurance (TBW rating) | Bytes written per day |
| Network bandwidth | ISP costs for public-facing services | GB transferred per month |
| Hardware depreciation | Node replacement timeline | Cost per node per year |
| Time | Human hours for maintenance and troubleshooting | Hours per incident |

### Power-Aware Scheduling

GPU nodes consume significant power. Scheduling policies can minimize power waste:

- **Bin packing:** Schedule GPU workloads onto the fewest possible GPU nodes, allowing idle GPU nodes to enter low-power states
- **Time-of-day scheduling:** Batch training jobs during off-peak electricity hours (if time-of-use pricing applies)
- **Idle detection:** If no GPU workloads are running for >30 minutes, alert for potential power savings

### Right-Sizing Dashboard

A Grafana dashboard that shows:

- Actual CPU/memory/GPU usage vs. requested resources (waste ratio)
- Cost per namespace per day (electricity + storage + depreciation)
- Top 5 over-provisioned pods (highest waste ratio)
- Trend line: total cluster utilization over time
- Power consumption per node (via IPMI or DCGM for GPU nodes)

---

## Cluster Lifecycle Management

### Day-0: Initial Deployment

| Step | Tool | Automation |
|------|------|-----------|
| OS installation | PXE boot / cloud-init | Fully automated |
| K3s installation | curl install script | Single command per node |
| CNI (Cilium) | Helm chart via ArgoCD | GitOps-managed |
| Storage (Longhorn) | Helm chart via ArgoCD | GitOps-managed |
| Monitoring stack | Helm charts via ArgoCD | GitOps-managed |
| Security policies | Kyverno policies via ArgoCD | GitOps-managed |
| GPU Operator | Helm chart via ArgoCD | GitOps-managed |

### Day-1: Initial Operations

| Task | Frequency | Tool |
|------|-----------|------|
| Verify node health | Continuous | Prometheus alerts |
| Verify storage replication | Daily | Longhorn dashboard |
| Verify backup success | Daily | Velero status checks |
| Review security policy violations | Weekly | Kyverno audit reports |
| Review network policy denials | Weekly | Hubble flow logs |

### Day-2: Ongoing Maintenance

| Task | Frequency | Tool |
|------|-----------|------|
| K3s version upgrades | Quarterly (or as security patches require) | System Upgrade Controller |
| Certificate rotation | Automatic (K3s manages) | K3s internal CA |
| Longhorn upgrades | Quarterly | Helm upgrade via ArgoCD |
| Security patch assessment | Monthly | Trivy image scanning |
| Capacity planning | Quarterly | Prometheus utilization trends |
| Disaster recovery drill | Quarterly | Velero restore test |
| Performance baseline | Monthly | Compare against historical metrics |

---

## Backup & Disaster Recovery

### Velero Configuration

Velero backs up Kubernetes cluster state to S3-compatible storage. Combined with Longhorn's built-in backup, this provides two-layer protection.

```yaml
# Velero backup schedule
apiVersion: velero.io/v1
kind: Schedule
metadata:
  name: daily-full-backup
  namespace: velero
spec:
  schedule: "0 3 * * *"
  template:
    includedNamespaces:
      - "*"
    excludedNamespaces:
      - velero
    excludedResources:
      - events
      - events.events.k8s.io
    defaultVolumesToFsBackup: true
    ttl: 720h    # Retain for 30 days
    storageLocation: default
```

### Recovery Procedures

| Scenario | Recovery Method | RTO | RPO |
|----------|----------------|-----|-----|
| Pod failure | Kubernetes self-healing (ReplicaSet) | Seconds | Zero |
| Node failure | Pod rescheduling to healthy nodes | Minutes | Zero (replicated storage) |
| Longhorn volume degraded | Automatic replica rebuild | Minutes-Hours | Zero |
| Namespace accidentally deleted | Velero restore | Minutes | Last backup (daily) |
| Full cluster loss | K3s reinstall + Velero restore + Longhorn restore | Hours | Last backup |
| Data corruption | Longhorn snapshot rollback | Minutes | Last snapshot (hourly) |

### Recovery Testing Protocol

Untested backups are not backups. The GSD mesh includes quarterly recovery drills:

1. Create a test namespace with representative workloads (database, stateful app, GPU inference)
2. Populate with test data
3. Take a Velero backup
4. Delete the entire test namespace
5. Restore from Velero backup
6. Verify data integrity, application functionality, GPU workload resume
7. Document restoration time, any issues encountered, procedure updates needed
8. Update runbook with findings

---

## Cross-References

- **SYS (Systems Admin):** OS-level monitoring (systemd, kernel logs), host networking, power management (IPMI, iLO).
- **OCN (Open Compute):** Hardware monitoring, IPMI sensor data, power distribution unit integration.
- **GSD2 (GSD-2 Arch.):** Agent orchestration observability -- extension lifecycle events, dispatch pipeline traces.
- **GRD (Gradient Engine):** GPU workload metrics feeding into FinOps calculations and right-sizing recommendations.
- **CMH (Comp. Mesh):** Network monitoring across mesh nodes, WireGuard tunnel health, cross-site latency.
- **PSG (Pacific Spine):** Backbone health monitoring, bandwidth utilization, failover status.
- **PMG (Pi-Mono + GSD):** Pi agent runtime metrics, GSD context window utilization, session lifecycle observability.

---

## Decision Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| GitOps engine | ArgoCD | Web UI for visibility, multi-app management, CNCF Graduated |
| Metrics | Prometheus | De facto standard, native GPU/Longhorn/Cilium integration |
| Log aggregation | Loki | Lightweight (label-indexed), native Grafana integration |
| Tracing | OpenTelemetry + Tempo | Vendor-neutral, correlates with metrics and logs in Grafana |
| Visualization | Grafana | Unified dashboard for metrics, logs, traces, GPU, storage |
| Backup | Velero + Longhorn snapshots | Two-layer protection: application-level + storage-level |
| Autoscaling | VPA (vertical) | Right-size individual pods; HPA for horizontal when needed |
| Cluster upgrades | System Upgrade Controller | Kubernetes-native rolling upgrades for K3s |

---

## Sources

- ArgoCD Documentation -- argo-cd.readthedocs.io/
- Flux Documentation -- fluxcd.io/docs/
- Prometheus Documentation -- prometheus.io/docs/
- Grafana Loki Documentation -- grafana.com/docs/loki/
- OpenTelemetry Documentation -- opentelemetry.io/docs/
- Grafana Tempo -- grafana.com/docs/tempo/
- Velero Documentation -- velero.io/docs/
- Kubernetes Vertical Pod Autoscaler -- github.com/kubernetes/autoscaler/tree/master/vertical-pod-autoscaler
- Kubernetes Resource Management -- kubernetes.io/docs/concepts/configuration/manage-resources-containers/
- Node Problem Detector -- github.com/kubernetes/node-problem-detector
- Kubernetes PodDisruptionBudget -- kubernetes.io/docs/concepts/workloads/pods/disruptions/
- K3s System Upgrade Controller -- github.com/rancher/system-upgrade-controller
- DCGM Exporter -- github.com/NVIDIA/dcgm-exporter
