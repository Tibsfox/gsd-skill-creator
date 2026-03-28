# Day-2 Operations & Observability

> **Domain:** Multi-Cluster Fleet Management
> **Module:** 4 -- Configuration Drift, GitOps, Blast-Radius Isolation, Data Sovereignty, and Observability
> **Through-line:** *Day-1 is deploying the cluster. Day-2 is keeping it alive, consistent, and honest for the next thousand days.* The operational surface of a multi-cluster fleet grows exponentially with cluster count. Configuration drift, fragmented observability, inconsistent RBAC, and the context-switching tax of managing independent kubeconfig contexts all compound. No single tool solves this without architectural commitment.

---

## Table of Contents

1. [The Day-2 Problem](#1-the-day-2-problem)
2. [Configuration Drift Mechanics](#2-configuration-drift-mechanics)
3. [GitOps Fleet Patterns](#3-gitops-fleet-patterns)
4. [ArgoCD App-of-Apps Multi-Cluster](#4-argocd-app-of-apps-multi-cluster)
5. [Flux Multi-Cluster](#5-flux-multi-cluster)
6. [Blast-Radius Isolation](#6-blast-radius-isolation)
7. [Blast-Radius Isolation Matrix](#7-blast-radius-isolation-matrix)
8. [Data Sovereignty Enforcement](#8-data-sovereignty-enforcement)
9. [OCAP and First Nations Data Governance](#9-ocap-and-first-nations-data-governance)
10. [Cross-Cluster RBAC and Identity Federation](#10-cross-cluster-rbac-and-identity-federation)
11. [Cross-Cluster Observability Stack](#11-cross-cluster-observability-stack)
12. [Alerting Across Clusters](#12-alerting-across-clusters)
13. [Certificate Rotation Automation](#13-certificate-rotation-automation)
14. [Cross-References](#14-cross-references)
15. [Sources](#15-sources)

---

## 1. The Day-2 Problem

The term "Day-2 operations" describes everything that happens after initial deployment: upgrades, scaling, debugging, compliance, drift correction, certificate rotation, backup, disaster recovery. In a single cluster, Day-2 is manageable with standard Kubernetes tooling. In a multi-cluster fleet, every Day-2 task multiplies by cluster count -- and some tasks create new failure modes that only exist in the multi-cluster context [1, 2].

The exponential compounding:

| Cluster Count | Config Points | RBAC Policies | Cert Rotations | Context Switches |
|---------------|---------------|---------------|----------------|-----------------|
| 1 | 1x | 1x | 1x | 0 |
| 3 | 3x | 9x (cross-cluster) | 3x + shared CAs | 2 per task |
| 5 | 5x | 25x | 5x + federation CAs | 4 per task |
| 10 | 10x | 100x | 10x + trust domains | 9 per task |

The RBAC multiplication is the worst: in a 5-cluster fleet, each cluster has its own RBAC model, and cross-cluster service communication creates 5x5 = 25 permission boundaries that must be individually reasoned about. Qovery's 2026 analysis describes this as "the hidden tax of multi-cluster" -- the overhead that enterprise teams discover after deployment, not before [1].

---

## 2. Configuration Drift Mechanics

Configuration drift is the primary Day-2 failure mode in multi-cluster fleets. It occurs when individual clusters deviate from their intended Git-defined state through [1, 2]:

### Manual Interventions

An operator uses `kubectl apply` directly against a cluster to fix an urgent production issue. The fix works. It never gets committed to Git. Three weeks later, a GitOps sync overrides the fix and the issue returns -- or worse, the manual change conflicts with a legitimate Git change and causes a partial failure.

### Partial Upgrades

Cluster A is upgraded to Cilium 1.16. Cluster B remains on 1.15 due to a scheduling conflict. ClusterMesh features that require 1.16 on both sides silently fail. No alert fires because the versions are technically compatible -- just functionally degraded.

### Provider-Specific Defaults

Clusters provisioned at different times may inherit different default configurations. A k3s node provisioned in January gets Traefik v2; one provisioned in March gets Traefik v3. The behavior divergence creates subtle routing bugs that are difficult to diagnose because both clusters "work" -- they just work differently.

### Detection Strategies

```
DRIFT DETECTION PIPELINE
================================================================

  Git Repository (source of truth)
       |
       v
  ArgoCD Application Controller (per cluster)
       |
       +---> Desired State (from Git)
       +---> Live State (from K8s apiserver)
       |
       v
  DIFF ENGINE
       |
       +---> No drift: green status
       +---> Drift detected: alert + optional auto-sync
       |
       v
  Alertmanager --> PagerDuty / Slack / Hubble annotation
```

ArgoCD's drift detection is the industry standard. Each ArgoCD instance watches its cluster and compares live state to Git-declared state. Drift can be:

- **Auto-corrected:** ArgoCD automatically syncs to match Git (aggressive, appropriate for production-critical configs)
- **Alerted only:** Operator is notified, manual decision to sync (conservative, appropriate for configs that may have legitimate temporary overrides)

---

## 3. GitOps Fleet Patterns

GitOps is the operational model where Git is the single source of truth for declarative infrastructure and applications. For multi-cluster fleets, two patterns dominate [3, 4]:

### Pattern 1: ArgoCD Per Cluster (Decentralized)

Each cluster runs its own ArgoCD instance. All instances point to the same Git repository (or repository hierarchy). Each ArgoCD instance manages only its own cluster.

Advantages:
- Blast-radius isolation: an ArgoCD failure in Cluster A does not affect Cluster B
- Independent operation during network partitions
- Per-cluster RBAC for ArgoCD itself

Disadvantages:
- N instances to manage
- Cross-cluster application dependency awareness requires additional tooling

### Pattern 2: Central ArgoCD (Hub-Spoke)

A single ArgoCD instance in a management cluster manages all member clusters. The central ArgoCD holds kubeconfigs (or service account tokens) for all member clusters.

Advantages:
- Single pane of glass
- Simplified management

Disadvantages:
- Management cluster is a single point of failure
- Central ArgoCD has credential access to all clusters (significant security surface)
- Network connectivity from management cluster to all member clusters required

### Recommendation for FoxCompute

**Pattern 1 (ArgoCD per cluster)** with app-of-apps. This preserves blast-radius isolation (a core FoxCompute requirement) while standardizing deployments through Git. The app-of-apps pattern organizes applications hierarchically [3]:

```
ARGOCD APP-OF-APPS STRUCTURE
================================================================

  apps/
  ├── root-app.yaml          (ArgoCD Application pointing to apps/)
  ├── cluster-common/         (shared across all clusters)
  │   ├── cilium.yaml
  │   ├── cert-manager.yaml
  │   └── monitoring.yaml
  ├── valley-prime/           (Agnus-class specific)
  │   ├── karmada-cp.yaml
  │   └── argocd-self.yaml
  ├── valley-secondary/       (Denise-class specific)
  │   ├── gpu-operator.yaml
  │   └── inference-serving.yaml
  └── edge-pnw/              (68000-class specific)
      ├── k3s-system.yaml
      └── edge-gateway.yaml
```

---

## 4. ArgoCD App-of-Apps Multi-Cluster

The app-of-apps pattern uses a root ArgoCD Application that points to a directory of Application manifests. Each sub-Application defines its own source repository, target cluster, and sync policy [3].

### Root Application

```
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: foxcompute-root
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/foxcompute/fleet-config.git
    path: apps/
    targetRevision: main
  destination:
    server: https://kubernetes.default.svc
    namespace: argocd
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

### Cluster-Specific Applications

Each cluster gets Application manifests that target only that cluster. The `destination.server` field selects the cluster. This allows different configurations per cluster (GPU operators only on Denise-class, Karmada control plane only on Agnus-class) while maintaining a single Git source of truth [3].

### Sync Policies

- **Automated sync + self-heal:** For infrastructure components (CNI, monitoring, cert-manager). Drift is automatically corrected.
- **Manual sync:** For application deployments. Operator reviews and approves before rollout.
- **Sync waves:** Components deploy in order. Cilium before ClusterMesh. cert-manager before TLS certificates.

---

## 5. Flux Multi-Cluster

Flux v2 (CNCF Graduated) provides an alternative GitOps engine with native multi-cluster support [5].

### Flux vs ArgoCD

| Dimension | ArgoCD | Flux v2 |
|-----------|--------|---------|
| Architecture | Server + UI | Controller set (no UI) |
| Multi-cluster | External cluster registration | Kustomize overlays + cluster selectors |
| Diff engine | Live vs Git comparison | Kubernetes server-side apply |
| UI | Built-in web UI | Weave GitOps (separate) |
| Helm support | ArgoCD application CRD | HelmRelease CRD |
| Best for | Teams wanting visual management | Teams preferring pure Git + CLI |

For FoxCompute, ArgoCD is recommended because the built-in UI reduces the context-switching tax. A small team managing 3-5 clusters benefits from visual diff and sync status more than a larger team with dedicated platform engineers would.

---

## 6. Blast-Radius Isolation

Multi-cluster architecture's primary security value: if one cluster is compromised or misconfigured, the blast radius is contained to that cluster [2, 6].

### Requirements for Blast-Radius Isolation

1. **Independent control planes:** No shared etcd, no KubeFed-style single API server. Each cluster must be able to operate independently. Karmada's architecture meets this -- member clusters retain their own control planes.

2. **Network-level cluster isolation:** Clusters are connected by explicit peering (ClusterMesh, WireGuard), not by shared network. Removing the peering disconnects the clusters. The default state is isolation, not connectivity.

3. **Independent RBAC models:** Each cluster has its own RBAC configuration. Cross-cluster identity uses OIDC federation (external identity provider) rather than RBAC inheritance (copying roles between clusters). An admin in Cluster A is NOT automatically an admin in Cluster B.

4. **Separate credential stores:** kubeconfig files, service account tokens, and CA certificates are cluster-specific. A credential breach in Cluster A does not give access to Cluster B unless the attacker also has ClusterMesh CA access (which is separately protected).

### What Blast-Radius Isolation Does NOT Prevent

- Cross-cluster attacks via ClusterMesh. If Cluster A is compromised and has ClusterMesh peering with Cluster B, an attacker can potentially exploit the east-west communication channel. Mitigation: CiliumNetworkPolicy default-deny with explicit allow-lists.
- Supply chain attacks through shared Git repository. If the GitOps repository is compromised, all clusters receive the malicious configuration. Mitigation: branch protection, signed commits, ArgoCD sync approval gates.
- Shared CA compromise. See Module 3 (Network Fabric & CNI) for CA security controls.

---

## 7. Blast-Radius Isolation Matrix

| Failure Mode | Contained by Cluster Boundary? | Additional Controls Required |
|-------------|-------------------------------|------------------------------|
| etcd corruption | YES -- per-cluster etcd | Backup/restore per cluster |
| apiserver crash | YES -- per-cluster control plane | Karmada heartbeat detects, reroutes workloads |
| Network partition | YES -- clusters operate independently | Liqo split-brain resilience for running pods |
| Node compromise | YES -- cluster RBAC limits lateral movement | CiliumNetworkPolicy restricts east-west |
| Cluster compromise (full) | PARTIAL -- ClusterMesh channel remains | Revoke peering, rotate shared CA |
| GitOps repo compromise | NO -- all clusters affected | Branch protection, signed commits, approval gates |
| Shared CA compromise | NO -- all clusters affected | Rotate CA immediately, re-peer all clusters |
| DNS poisoning | YES -- per-cluster CoreDNS | DNSSEC where available |
| Certificate expiry | YES -- per-cluster cert-manager | Automated rotation (cronJob), alerting |
| Karmada CP failure | PARTIAL -- member clusters continue running | Workload placement frozen until CP recovers |

> **SAFETY WARNING:** The blast-radius isolation matrix identifies two failure modes that are NOT contained by cluster boundaries: GitOps repository compromise and shared CA compromise. These require defense-in-depth controls (branch protection, signed commits, CA rotation automation, hardware security modules for CA key storage). Cluster boundary isolation alone is insufficient.

---

## 8. Data Sovereignty Enforcement

Regulatory and tribal data sovereignty requirements map directly to cluster boundaries [7, 8].

### The Enforcement Problem

Data sovereignty is not a policy statement. It is an architectural constraint. Saying "data must stay in Canada" in a policy document does nothing if the federation layer can propagate workloads to any cluster. The enforcement must be built into the infrastructure.

### Karmada: PropagationPolicy Hard Affinity

```
apiVersion: policy.karmada.io/v1alpha1
kind: PropagationPolicy
metadata:
  name: sovereign-data-policy
spec:
  resourceSelectors:
    - apiVersion: apps/v1
      kind: Deployment
      labelSelector:
        matchLabels:
          data-class: sovereign
  placement:
    clusterAffinity:
      matchExpressions:
        - key: foxcompute.io/sovereignty
          operator: In
          values: ["indigenous-data"]
      clusterNames:
        - coast-salish-cluster
    # NO fallback. NO spreadConstraints.
    # If coast-salish-cluster is unavailable,
    # the workload does NOT run elsewhere.
```

The critical detail: this policy uses `clusterAffinity` with explicit cluster names and label matching. There is no fallback. If the designated cluster is unavailable, the workload fails to schedule rather than being placed on an unauthorized cluster. This is the correct behavior for sovereignty constraints -- running nowhere is better than running in the wrong place [7].

### Liqo: Namespace Offloading Policy

In Liqo, namespace offloading policies use cluster labels to control which remote clusters can receive workloads from a namespace:

```
apiVersion: offloading.liqo.io/v1alpha1
kind: NamespaceOffloading
metadata:
  name: offloading
  namespace: sovereign-data
spec:
  namespaceMappingStrategy: EnforceSameName
  podOffloadingStrategy: Local
  clusterSelector:
    nodeSelectorTerms:
      - matchExpressions:
          - key: foxcompute.io/sovereignty
            operator: In
            values: ["indigenous-data"]
```

The `podOffloadingStrategy: Local` setting prohibits pods in the `sovereign-data` namespace from being offloaded to any remote cluster. Combined with the cluster selector, this creates a hard boundary: sovereign data workloads run only on approved local infrastructure [8].

---

## 9. OCAP and First Nations Data Governance

OCAP (Ownership, Control, Access, and Possession) is the First Nations data governance framework articulated by the First Nations Information Governance Centre [9]. It establishes four principles:

- **Ownership:** The community owns its collective data
- **Control:** The community controls data collection, use, and disclosure
- **Access:** The community has access to its own data regardless of where it is stored
- **Possession:** The community has physical possession (or delegated possession) of its data

### Mapping OCAP to Cluster Architecture

| OCAP Principle | Cluster Architecture Enforcement |
|---------------|----------------------------------|
| Ownership | Cluster sovereignty label: `foxcompute.io/sovereignty: indigenous-data` |
| Control | PropagationPolicy hard affinity: workloads only on designated cluster |
| Access | Linkerd service mirroring: community members can access data via authenticated mesh |
| Possession | Physical cluster location: nodes are on community-owned or community-designated infrastructure |

### Architectural vs Policy Enforcement

> **SAFETY WARNING:** OCAP compliance requires architectural enforcement. A PropagationPolicy soft preference can be overridden by scheduler pressure. A namespace annotation can be removed by any cluster admin. Only hard affinity constraints at the Karmada level, combined with physical cluster placement on community-designated infrastructure, provide the OCAP guarantee. Policy documents are necessary but not sufficient.

---

## 10. Cross-Cluster RBAC and Identity Federation

Multi-cluster RBAC introduces the problem of identity spanning cluster boundaries without creating privilege escalation paths [6, 10].

### The Anti-Pattern: RBAC Inheritance

Copying RoleBindings between clusters (giving a user the same permissions everywhere) is the common anti-pattern. It violates blast-radius isolation: if an attacker compromises an admin's credentials, they have admin access to all clusters, not just the one where the credentials were used.

### The Pattern: OIDC Federation

Each cluster configures its apiserver to trust an external OIDC provider (Dex, Keycloak, or a managed IdP). Users authenticate against the IdP and receive tokens. Each cluster's RBAC model is independent -- the same user can be admin in Cluster A and viewer in Cluster B.

```
OIDC FEDERATION FOR MULTI-CLUSTER
================================================================

  +--[ Identity Provider (Dex/Keycloak) ]--+
  |  User: foxy@foxcompute.io              |
  |  Groups: [admin, ml-team]              |
  +----------------------------------------+
       |              |              |
       v              v              v
  [Cluster A]    [Cluster B]    [Cluster C]
  RBAC: admin    RBAC: viewer   RBAC: ml-admin
  (independent)  (independent)  (independent)
```

### Service Account Isolation

Cross-cluster service communication uses per-cluster service accounts. A service in Cluster A does not use Cluster B's service account to call services in Cluster B. Instead:

1. Service in Cluster A authenticates with its own service account
2. ClusterMesh or Linkerd gateway validates the SPIFFE identity
3. CiliumNetworkPolicy in Cluster B authorizes based on the identity from Cluster A
4. The service account in Cluster B is never exposed to Cluster A

> **SAFETY WARNING:** Cross-cluster OIDC federation must NOT allow privilege escalation across cluster boundaries. An admin in Cluster A must not automatically become an admin in Cluster B through group membership in the identity provider. Each cluster's RoleBindings must be independently reviewed and maintained.

---

## 11. Cross-Cluster Observability Stack

Observability across multiple clusters requires per-cluster collection with federated querying [11, 12].

### Stack Components

| Layer | Tool | Multi-Cluster Pattern |
|-------|------|-----------------------|
| Network flows | Hubble + Hubble Relay | Relay aggregates from all clusters into single query endpoint |
| Metrics | Prometheus + Thanos | Per-cluster Prometheus; Thanos Querier federates across clusters |
| Distributed traces | OpenTelemetry Collector | Per-cluster collector; OTLP export to central Jaeger or Tempo |
| Service mesh viz | Kiali (if Istio) or Hubble UI | Multi-cluster graph with cluster identification |
| Logs | Loki + promtail | Per-cluster promtail; Loki multi-tenancy with cluster labels |

### Thanos Federation Pattern

```
THANOS MULTI-CLUSTER METRICS
================================================================

  Cluster A                    Cluster B
  +-------------------+       +-------------------+
  | Prometheus         |       | Prometheus         |
  | Thanos Sidecar     |       | Thanos Sidecar     |
  +--------+----------+       +--------+----------+
           |                            |
           v                            v
  +--------+----------------------------+--------+
  |              Thanos Querier                    |
  |  (central, queries all cluster Prometheus)     |
  |              Thanos Store Gateway              |
  |  (long-term storage: S3 / MinIO)               |
  +------------------------------------------------+
           |
           v
  +-------------------+
  | Grafana Dashboard  |
  | (unified view)     |
  +-------------------+
```

Each cluster runs its own Prometheus with a Thanos Sidecar. The Thanos Querier federates queries across all clusters -- a single Grafana dashboard shows metrics from all clusters with cluster labels for filtering. Thanos Store Gateway provides long-term storage (S3-compatible, MinIO for on-prem) [11].

### OpenTelemetry Cross-Cluster Tracing

Each cluster runs an OpenTelemetry Collector that receives traces from local applications and exports them to a central tracing backend (Jaeger or Grafana Tempo). Cross-cluster requests carry trace context headers (W3C Trace Context) through the mesh, producing end-to-end traces that span cluster boundaries [12].

---

## 12. Alerting Across Clusters

Multi-cluster alerting requires deduplication and routing. A Prometheus alert that fires in all three clusters for a global service outage should produce ONE notification, not three [11].

### Alertmanager Federation

Each cluster runs an Alertmanager instance. Alertmanager supports federation (cluster mode) where instances share alert state. When the same alert fires in multiple instances, the cluster deduplicates and sends a single notification.

### Alert Routing for FoxCompute

| Alert Category | Route | Urgency |
|---------------|-------|---------|
| Cluster unreachable | PagerDuty | P1 (immediate) |
| Certificate expiry < 7 days | Slack | P2 (business hours) |
| Configuration drift detected | Slack + ArgoCD annotation | P3 (informational) |
| Cross-cluster latency > threshold | Hubble annotation | P2 |
| Sovereignty policy violation attempt | PagerDuty | P1 (immediate) |
| GitOps sync failure | Slack + ArgoCD UI | P2 |

---

## 13. Certificate Rotation Automation

Shared CA certificates for ClusterMesh must be rotated automatically. Manual rotation is an operational risk that compounds with cluster count [13].

### CronJob-Based Rotation

```
apiVersion: batch/v1
kind: CronJob
metadata:
  name: cilium-ca-rotation
  namespace: kube-system
spec:
  schedule: "0 2 1 */3 *"  # Every 3 months, 2 AM, 1st of month
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: cilium-ca-rotator
          containers:
            - name: ca-rotator
              image: foxcompute/ca-rotator:v1
              command:
                - /bin/sh
                - -c
                - |
                  # Generate new intermediate CA
                  # Update Cilium secret
                  # Trigger Cilium agent restart (rolling)
                  # Verify ClusterMesh connectivity
          restartPolicy: OnFailure
```

The rotation process:
1. Generate new intermediate CA certificate (signed by the root CA)
2. Update the `cilium-ca` secret in each cluster
3. Trigger a rolling restart of Cilium agents to pick up the new certificate
4. Verify ClusterMesh connectivity after rotation
5. Alert if rotation fails

> **SAFETY WARNING:** Certificate rotation must be tested in a non-production environment before deploying to the fleet. A failed rotation can disconnect all clusters simultaneously. The rotation CronJob should include verification steps and automatic rollback on failure.

---

## 14. Cross-References

> **Related:** [Federation Control Planes](01-federation-control-planes.md) -- Karmada's PropagationPolicy is the mechanism for sovereignty enforcement discussed here. [Service Mesh Cross-Cluster](02-service-mesh-cross-cluster.md) -- mTLS certificate management is shared between mesh and Day-2. [Network Fabric & CNI](03-network-fabric-cni.md) -- Hubble Relay provides the network flow observability. [FoxCompute Integration](05-foxcompute-integration.md) -- Day-2 runbook for the specific FoxCompute cluster topology.

**Series cross-references:**
- **SYS (Systems Administration):** Core operational practices -- monitoring, alerting, backup, incident response
- **K8S (Kubernetes Core):** RBAC, service accounts, namespace isolation
- **CMH (Cryptographic Methods):** Certificate lifecycle, CA management, mTLS
- **GSD2 (GSD CLI):** Fleet management commands, drift detection integration
- **BRC (Burning Man):** Trust models, sovereignty principles, Leave No Trace applied to data
- **OCN (Ocean Networks):** Resilience patterns for distributed observation systems
- **NND (Neural Network Design):** GPU cluster monitoring and inference workload observability
- **MCM (Multi-Cloud Management):** Fleet-level operational patterns

---

## 15. Sources

1. Qovery. "Kubernetes multi-cluster: the day-2 enterprise strategy." March 2026. qovery.com.
2. Qovery. "Mastering multi-cluster Kubernetes management." March 2026. qovery.com.
3. ArgoCD Project. "App of Apps Pattern." argo-cd.readthedocs.io/en/stable/operator-manual/cluster-bootstrapping.
4. ArgoCD Project. "Multi-cluster management." argo-cd.readthedocs.io/en/stable/operator-manual/declarative-setup.
5. Flux Project. "Multi-cluster with Flux." fluxcd.io/flux/use-cases/multi-cluster. CNCF Graduated.
6. Kubernetes Project. "RBAC Authorization." kubernetes.io/docs/reference/access-authn-authz/rbac.
7. Karmada Project. "PropagationPolicy API Reference: Cluster Affinity." karmada.io/docs/userguide/scheduling.
8. Liqo Project. "Namespace Offloading." liqo.io/docs/usage/namespace-offloading.
9. First Nations Information Governance Centre. "The First Nations Principles of OCAP." fnigc.ca/ocap-training.
10. SPIFFE/SPIRE Project. "Federation." spiffe.io/docs/latest/microservices/federation.
11. Thanos Project. "Multi-cluster metrics with Thanos." thanos.io. CNCF Incubating.
12. OpenTelemetry Project. "Cross-service and cross-cluster tracing." opentelemetry.io. CNCF Incubating.
13. Cilium Project. "Certificate Management for ClusterMesh." docs.cilium.io/en/stable/network/clustermesh/clustermesh.
14. Ananta Cloud Engineering. "Cloud-Native Meets Carbon Intelligence: Multi-Cluster Sustainability with Liqo and Karmada." September 2025.
15. CNCF Blog. "Karmada and OCM: two new approaches to multicluster fleet management." Eads, Wang. September 2022.
16. Introl. "Kubernetes for GPU Orchestration." Including Day-2 operations patterns. February 2026.

---

*Multi-Cluster Federation -- Module 4: Day-2 Operations & Observability. Day-1 builds the camp. Day-2 keeps it standing, honest, and welcoming for the next thousand visitors.*
