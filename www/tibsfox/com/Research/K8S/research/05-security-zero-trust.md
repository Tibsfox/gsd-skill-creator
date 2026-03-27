# Module 5: Security & Zero Trust

## Overview

Kubernetes networking is flat by default -- any pod can communicate with any other pod across the entire cluster, without authentication, authorization, or encryption. Reports indicate that 89% of organizations experienced a Kubernetes security incident in the past year, often due to lateral movement after initial pod compromise. For the GSD mesh cluster running public Minecraft servers alongside private orchestration workloads, this default is not just insufficient -- it is actively dangerous.

Zero trust is not a product or a single configuration. It is an architecture built from layered controls: network policies that restrict which pods can communicate, RBAC that limits what those pods can do, mTLS that ensures communication is authenticated and encrypted, admission controllers that prevent misconfigured workloads from deploying, and runtime monitoring that detects anomalous behavior after deployment. Each layer addresses a different attack vector; together they create defense in depth.

This module maps the five defense layers of the GSD mesh security architecture, traces the phased implementation plan from "everything is open" to "zero trust by default," and documents the new v1.35 capabilities -- pod certificates and constrained impersonation -- that make native Kubernetes security viable without external dependencies.

---

## The Flat Network Problem

### Default Kubernetes Networking

When a Kubernetes cluster is created with default settings:

- Every pod gets a unique IP address from the cluster CIDR
- Every pod can reach every other pod by IP, regardless of namespace
- Every pod can reach every Kubernetes service (ClusterIP, NodePort)
- There are no firewalls, no ACLs, no authentication between pods
- DNS resolution works for all services across all namespaces

This means a compromised Minecraft server pod can:

1. Scan the entire cluster network for other services
2. Connect to the Kubernetes API server (if ServiceAccount tokens are auto-mounted)
3. Access monitoring databases (Prometheus, Grafana)
4. Reach internal GSD orchestration services
5. Exfiltrate data to external networks (no egress filtering)
6. Attempt lateral movement to other pods in any namespace

### Attack Surface Assessment

| Attack Vector | Default Exposure | Risk Level |
|--------------|-----------------|------------|
| Pod-to-pod lateral movement | All pods reachable from any pod | Critical |
| Service account token theft | Auto-mounted in every pod | High |
| API server access from pods | Unrestricted (default RBAC) | High |
| Egress to internet | Unrestricted | High |
| Secrets access | Namespace-scoped but not encrypted at rest by default | Medium |
| Container escape to host | Possible with privileged containers | Critical |
| Image supply chain | No default image verification | Medium |

---

## Layer 1: Network Policies

### Default-Deny Architecture

Network policies are the first and most impactful security layer. A default-deny policy blocks all traffic that is not explicitly allowed, reversing the "everything open" default.

**Default-deny ingress and egress per namespace:**

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: minecraft
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
```

This single policy blocks ALL incoming and outgoing traffic for every pod in the `minecraft` namespace. Nothing works until explicit allow rules are added.

**Allow specific traffic patterns:**

```yaml
# Allow Minecraft clients to reach Minecraft server pods
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-minecraft-clients
  namespace: minecraft
spec:
  podSelector:
    matchLabels:
      app: minecraft-server
  policyTypes:
    - Ingress
  ingress:
    - ports:
        - port: 25565
          protocol: TCP
---
# Allow Minecraft pods to reach DNS (required for name resolution)
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-dns
  namespace: minecraft
spec:
  podSelector: {}
  policyTypes:
    - Egress
  egress:
    - to:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: kube-system
          podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - port: 53
          protocol: UDP
        - port: 53
          protocol: TCP
---
# Block Minecraft pods from reaching GSD system namespace
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-minecraft-to-gsd
  namespace: gsd-system
spec:
  podSelector: {}
  policyTypes:
    - Ingress
  ingress:
    - from:
        - namespaceSelector:
            matchExpressions:
              - key: kubernetes.io/metadata.name
                operator: NotIn
                values: ["minecraft"]
```

### CNI Requirement

Network policies are only enforced if the CNI supports them. The three options from Module 2:

| CNI | Network Policy Support | L7 Policy | DNS Policy |
|-----|----------------------|-----------|------------|
| Cilium | Full (L3/L4/L7) | Yes (HTTP path, method, headers) | Yes (restrict by domain name) |
| Calico | Full (L3/L4) | Limited (Global Network Policy) | Yes (Calico extension) |
| Flannel | **None** | No | No |

**This is why Flannel alone is insufficient for the GSD mesh.** Without network policy enforcement, the default-deny architecture has no teeth. Cilium is the recommended CNI specifically because its eBPF-based policy enforcement operates at L3, L4, and L7 without sidecar overhead.

### Cilium L7 Policies

Cilium extends standard Kubernetes NetworkPolicy with L7 (application layer) rules:

```yaml
apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata:
  name: restrict-api-access
  namespace: gsd-system
spec:
  endpointSelector:
    matchLabels:
      app: gsd-api
  ingress:
    - fromEndpoints:
        - matchLabels:
            app: gsd-frontend
      toPorts:
        - ports:
            - port: "8080"
              protocol: TCP
          rules:
            http:
              - method: "GET"
                path: "/api/v1/status"
              - method: "POST"
                path: "/api/v1/jobs"
```

This policy allows the GSD frontend to make GET requests to `/api/v1/status` and POST requests to `/api/v1/jobs`, but blocks all other HTTP methods and paths. L7 policies provide surgical traffic control that L3/L4 rules cannot achieve.

### DNS-Aware Egress Policies

Cilium can restrict outbound traffic by DNS name:

```yaml
apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata:
  name: minecraft-egress
  namespace: minecraft
spec:
  endpointSelector:
    matchLabels:
      app: minecraft-server
  egress:
    - toFQDNs:
        - matchName: "api.mojang.com"
        - matchName: "sessionserver.mojang.com"
      toPorts:
        - ports:
            - port: "443"
              protocol: TCP
```

Minecraft servers need to authenticate player sessions with Mojang's API. This policy allows HTTPS traffic to those specific domains while blocking all other outbound connections. A compromised Minecraft pod cannot exfiltrate data to arbitrary internet hosts.

---

## Layer 2: RBAC (Role-Based Access Control)

### Principles

1. **Per-workload ServiceAccounts:** Never share ServiceAccounts across different applications. Each Deployment gets its own ServiceAccount with the minimum required permissions.
2. **Namespace-scoped Roles:** Prefer Role/RoleBinding (namespace-scoped) over ClusterRole/ClusterRoleBinding (cluster-wide). A workload should only see its own namespace.
3. **Disable auto-mounting:** Set `automountServiceAccountToken: false` on pods that do not need Kubernetes API access. Most application pods (Minecraft, web servers, databases) never call the Kubernetes API.

### Configuration

```yaml
# Per-workload ServiceAccount
apiVersion: v1
kind: ServiceAccount
metadata:
  name: minecraft-server
  namespace: minecraft
automountServiceAccountToken: false  # Minecraft doesn't need K8s API access
---
# Pod spec referencing the ServiceAccount
apiVersion: v1
kind: Pod
metadata:
  name: minecraft
  namespace: minecraft
spec:
  serviceAccountName: minecraft-server
  automountServiceAccountToken: false
  containers:
    - name: minecraft
      image: itzg/minecraft-server:latest
```

### Restricting API Access

For workloads that DO need API access (monitoring, operators, CI/CD):

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: monitoring-reader
  namespace: monitoring
rules:
  - apiGroups: [""]
    resources: ["pods", "services", "endpoints"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["apps"]
    resources: ["deployments", "replicasets"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: prometheus-monitoring
  namespace: monitoring
subjects:
  - kind: ServiceAccount
    name: prometheus
    namespace: monitoring
roleRef:
  kind: Role
  name: monitoring-reader
  apiGroup: rbac.authorization.k8s.io
```

### RBAC Audit

Regular permission audits identify over-privileged ServiceAccounts:

```bash
# Find all ClusterRoleBindings (potential over-privilege)
kubectl get clusterrolebindings -o json | jq '.items[] | {name: .metadata.name, subjects: .subjects, role: .roleRef.name}'

# Find ServiceAccounts with cluster-admin access
kubectl get clusterrolebindings -o json | jq '.items[] | select(.roleRef.name == "cluster-admin") | .subjects'

# Find pods with auto-mounted tokens (candidates for disabling)
kubectl get pods --all-namespaces -o json | jq '.items[] | select(.spec.automountServiceAccountToken != false) | {namespace: .metadata.namespace, name: .metadata.name}'
```

---

## Layer 3: mTLS (Mutual TLS)

### Pod Certificates (KEP-4317, Beta in v1.35)

Kubernetes v1.35 introduces native pod certificates, eliminating the need for external cert-manager or SPIFFE sidecars for basic mutual TLS:

**How it works:**

1. Pod is created with a certificate request annotation
2. Kubelet generates a private key for the pod
3. Kubelet creates a `PodCertificateRequest` to the Kubernetes CA
4. Kubernetes signs the certificate and returns it
5. Kubelet writes the key + certificate bundle to the pod's filesystem (projected volume)
6. The application reads the certificate and uses it for mTLS connections
7. Kubelet handles certificate rotation before expiry

**Configuration:**

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: gsd-api
  namespace: gsd-system
spec:
  containers:
    - name: api
      image: gsd/api:latest
      volumeMounts:
        - name: pod-cert
          mountPath: /var/run/secrets/kubernetes.io/pod-certs
          readOnly: true
      env:
        - name: TLS_CERT_FILE
          value: /var/run/secrets/kubernetes.io/pod-certs/tls.crt
        - name: TLS_KEY_FILE
          value: /var/run/secrets/kubernetes.io/pod-certs/tls.key
        - name: TLS_CA_FILE
          value: /var/run/secrets/kubernetes.io/pod-certs/ca.crt
  volumes:
    - name: pod-cert
      projected:
        sources:
          - clusterTrustBundle:
              name: kubernetes.io/cluster
              path: ca.crt
```

### mTLS Without a Service Mesh

With pod certificates, two pods can establish mTLS connections without Istio, Linkerd, or any sidecar:

```
Pod A (gsd-api)                    Pod B (gsd-worker)
  |                                  |
  |-- TLS ClientHello ------------>  |
  |<-- TLS ServerHello + Cert ----   |
  |-- Client Cert ----------------> |
  |<-- TLS Finished ---------------  |
  |                                  |
  |== Encrypted, mutually authn'd ==>|
```

Both pods present certificates signed by the Kubernetes cluster CA. Each pod verifies the other's certificate against the same CA. No external certificate authority needed.

### When to Use a Service Mesh Instead

Pod certificates provide basic mTLS. A service mesh (Linkerd, Istio) adds:

- Automatic certificate rotation with zero application changes
- Traffic splitting and canary deployments
- Circuit breaking and retry policies
- Distributed tracing with automatic span injection
- Connection pool management

**GSD mesh approach:** Start with pod certificates for mTLS between critical services (GSD API, worker, orchestrator). Evaluate Linkerd if automated traffic management features become needed.

---

## Layer 4: Admission Control

### Purpose

Admission controllers intercept requests to the Kubernetes API *after* authentication and authorization (RBAC) but *before* the object is persisted to etcd. They can validate requests (reject bad configurations) or mutate requests (inject defaults, add labels, modify resources).

### OPA Gatekeeper vs. Kyverno

| Feature | OPA Gatekeeper | Kyverno |
|---------|---------------|---------|
| Policy language | Rego (specialized language) | YAML (Kubernetes-native) |
| Learning curve | High (must learn Rego) | Low (YAML patterns) |
| Policy library | Pre-built constraint templates | Pre-built policies + community library |
| Mutation support | Limited | Full (mutating + validating) |
| Generate resources | No | Yes (auto-create NetworkPolicies, etc.) |
| Audit mode | Yes (report violations without blocking) | Yes (audit + enforce modes) |
| CNCF status | Graduated (OPA) | Incubating |

**GSD mesh recommendation:** Kyverno. Lower barrier to entry (YAML vs. Rego), mutation support for injecting security defaults, and resource generation for auto-creating NetworkPolicies when new namespaces are created.

### Essential Policies

```yaml
# Block privileged containers
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: deny-privileged
spec:
  validationFailureAction: Enforce
  rules:
    - name: deny-privileged-containers
      match:
        any:
          - resources:
              kinds: ["Pod"]
      validate:
        message: "Privileged containers are not allowed"
        pattern:
          spec:
            containers:
              - securityContext:
                  privileged: "!true"
---
# Require resource limits on all containers
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-resource-limits
spec:
  validationFailureAction: Enforce
  rules:
    - name: require-limits
      match:
        any:
          - resources:
              kinds: ["Pod"]
      validate:
        message: "CPU and memory limits are required"
        pattern:
          spec:
            containers:
              - resources:
                  limits:
                    memory: "?*"
                    cpu: "?*"
---
# Block hostPath volume mounts
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: deny-host-path
spec:
  validationFailureAction: Enforce
  rules:
    - name: deny-host-path-volumes
      match:
        any:
          - resources:
              kinds: ["Pod"]
      validate:
        message: "hostPath volumes are not allowed"
        deny:
          conditions:
            any:
              - key: "{{ request.object.spec.volumes[?hostPath] | length(@) }}"
                operator: GreaterThan
                value: 0
---
# Restrict image registries
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: restrict-image-registries
spec:
  validationFailureAction: Enforce
  rules:
    - name: validate-image-registry
      match:
        any:
          - resources:
              kinds: ["Pod"]
      validate:
        message: "Images must come from approved registries"
        pattern:
          spec:
            containers:
              - image: "ghcr.io/* | docker.io/library/* | registry.mesh.local/*"
---
# Auto-generate default-deny NetworkPolicy for new namespaces
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: generate-default-deny
spec:
  rules:
    - name: default-deny-on-namespace-create
      match:
        any:
          - resources:
              kinds: ["Namespace"]
      exclude:
        any:
          - resources:
              namespaces: ["kube-system", "kube-public", "kube-node-lease"]
      generate:
        synchronize: true
        apiVersion: networking.k8s.io/v1
        kind: NetworkPolicy
        name: default-deny-all
        namespace: "{{request.object.metadata.name}}"
        data:
          spec:
            podSelector: {}
            policyTypes:
              - Ingress
              - Egress
```

---

## Layer 5: Runtime Detection

### Falco

Falco monitors system calls at the kernel level to detect anomalous behavior in running containers. It does not prevent attacks -- it detects them after they happen, enabling rapid response.

**Detection rules for the GSD mesh:**

| Rule | Detects | Severity |
|------|---------|----------|
| Shell spawned in container | Interactive shell opened in a production pod (potential compromise) | Critical |
| Unexpected outbound connection | Pod connecting to IP/port not in its network policy allow list | High |
| Sensitive file access | Reading `/etc/shadow`, `/etc/passwd`, or Kubernetes token files | High |
| Process privilege escalation | setuid/setgid calls, capability additions | Critical |
| Package manager execution | `apt`, `yum`, `pip install` in production container | Medium |
| Crypto mining detection | Known mining process names, connections to mining pools | Critical |
| Container escape attempt | Mount namespace manipulation, cgroup escape patterns | Critical |

### eBPF-Based Monitoring

Cilium's Hubble and Tetragon provide eBPF-based runtime monitoring without sidecar overhead:

- **Hubble:** Network flow monitoring -- which pods are talking, what protocols, what was allowed/denied by network policies. Real-time and historical flow data.
- **Tetragon:** Process-level monitoring -- what binaries are executing inside containers, what files they access, what system calls they make. Kernel-level visibility without modifying the container image.

**Configuration:**

```yaml
# Tetragon tracing policy for GSD mesh
apiVersion: cilium.io/v1alpha1
kind: TracingPolicy
metadata:
  name: detect-shell-spawning
spec:
  kprobes:
    - call: "sys_execve"
      syscall: true
      args:
        - index: 0
          type: "string"
      selectors:
        - matchArgs:
            - index: 0
              operator: "Equal"
              values:
                - "/bin/sh"
                - "/bin/bash"
                - "/bin/zsh"
          matchNamespaces:
            - namespace: minecraft
            - namespace: gsd-system
          matchActions:
            - action: Sigkill  # Kill the process immediately
```

---

## Constrained Impersonation (KEP-5284)

### The Problem

In Kubernetes, nodes can impersonate other identities to fetch secrets and configuration for pods they host. Before KEP-5284, a compromised kubelet on Node A could impersonate Node B to the API server and extract secrets for pods running on Node B. This is a critical privilege escalation path in multi-node clusters.

### The Fix (Alpha in v1.35)

Constrained impersonation limits what identities a node can impersonate. A kubelet can only request resources for pods that are actually scheduled on its node. Impersonation requests for pods on other nodes are rejected by the API server.

**Impact for GSD mesh:** This prevents a compromised GPU node (Denise) from extracting secrets belonging to storage nodes (Paula) or control plane nodes (68000). Each node can only access the secrets it legitimately needs for its own pods.

---

## Secrets Management

### Kubernetes Secrets Limitations

Kubernetes Secrets are base64-encoded, not encrypted. By default, they are stored in etcd without encryption at rest. Anyone with API access to the namespace can read secrets in plaintext.

### Encryption at Rest

```yaml
# K3s encryption configuration
# /etc/rancher/k3s/config.yaml
secrets-encryption: true
```

K3s supports automatic encryption of secrets at rest using AES-CBC or AES-GCM. This encrypts secrets in etcd storage but does not prevent access through the Kubernetes API (RBAC still controls that).

### HashiCorp Vault Integration

For production secrets management, integrate HashiCorp Vault with Kubernetes:

- Vault stores secrets externally (not in etcd)
- The Vault Agent Injector sidecar retrieves secrets and writes them to pod filesystems
- Secrets are never stored in Kubernetes -- pods receive them at runtime
- Vault provides audit logging, rotation policies, and dynamic secret generation

**GSD mesh approach:** Start with Kubernetes secrets encryption at rest (K3s built-in). Evaluate Vault integration when the number of secrets exceeds what can be manually managed or when regulatory compliance requires external key management.

---

## Phased Implementation Plan

### Phase 1: Foundation (Week 1-2)

| Task | Component | Impact |
|------|-----------|--------|
| Default-deny NetworkPolicies | All namespaces | Blocks unauthorized pod-to-pod communication |
| Per-workload ServiceAccounts | All deployments | Eliminates shared credentials |
| Disable auto-mount tokens | Non-API pods | Removes unnecessary API access |
| Namespace isolation | Logical separation | Organizes workloads by trust level |

### Phase 2: Enforcement (Week 3-4)

| Task | Component | Impact |
|------|-----------|--------|
| Cilium CNI with L7 policies | Network layer | L7 visibility and DNS-aware egress |
| Kyverno admission controller | API admission | Blocks privileged containers, enforces limits |
| Image registry restriction | Supply chain | Only approved registries allowed |
| Secrets encryption at rest | etcd | Protects stored secrets |

### Phase 3: Zero Trust (Week 5-8)

| Task | Component | Impact |
|------|-----------|--------|
| Pod certificates (mTLS) | v1.35 beta feature | Authenticated, encrypted service-to-service communication |
| Falco runtime monitoring | Detection layer | System call anomaly detection |
| Tetragon process monitoring | eBPF monitoring | Kernel-level container visibility |
| SPIFFE/SPIRE workload identity | Identity framework | Cryptographic workload attestation |

### Why Phased

The common failure mode of security implementation is deploying everything at once. Default-deny network policies break applications that depend on open communication. Admission controllers reject workloads that do not meet new requirements. mTLS breaks services that do not present certificates. A phased rollout ensures each layer is tested and debugged before adding the next.

---

## Cross-References

- **SAN (SANS Institute):** Security frameworks, incident response procedures, hardening standards. NIST SP 800-204A for microservices security.
- **SYS (Systems Admin):** Host-level hardening below Kubernetes -- firewall rules, SSH configuration, OS patching.
- **CMH (Comp. Mesh):** Network-level encryption (WireGuard) that complements pod-level mTLS.
- **GSD2 (GSD-2 Arch.):** Extension system security model -- how agent extensions authenticate and authorize within the cluster.
- **OCN (Open Compute):** Physical security of nodes -- BIOS security, Secure Boot, TPM attestation.

---

## Sources

- NIST SP 800-204A: Security Strategies for Microservices-based Application Systems
- CNCF: Kubernetes Security 2025 Stable Features and 2026 Preview (December 2025)
- Kubernetes Network Policies -- kubernetes.io/docs/concepts/services-networking/network-policies/
- KEP-4317: Pod Certificates -- github.com/kubernetes/enhancements/issues/4317
- KEP-5284: Constrained Impersonation -- github.com/kubernetes/enhancements/issues/5284
- Cilium Network Policies -- docs.cilium.io/en/stable/security/
- Cilium Tetragon -- tetragon.io/docs/
- Kyverno Documentation -- kyverno.io/docs/
- OPA Gatekeeper -- open-policy-agent.github.io/gatekeeper/
- Falco Documentation -- falco.org/docs/
- HashiCorp Vault Kubernetes Integration -- developer.hashicorp.com/vault/docs/platform/k8s
- SPIFFE/SPIRE -- spiffe.io/docs/
- KubeCon EU 2026: Microsoft Cilium Security Integrations for AI Workloads
