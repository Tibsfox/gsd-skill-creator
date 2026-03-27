# Module 3: Storage & Persistence

## Overview

Cloud-native storage for small bare-metal clusters is the most under-documented corner of the Kubernetes ecosystem. The major storage solutions -- Longhorn, Rook/Ceph, OpenEBS -- are well-tested at scale in cloud environments, but their documentation assumes cloud provider backing, large node counts, and dedicated storage infrastructure. The GSD mesh cluster has none of these: it runs on 3-10 white-box nodes with mixed SSD/HDD storage, no cloud provider volumes, and every disk already formatted with an operating system.

This module evaluates the Container Storage Interface (CSI) driver ecosystem through the lens of small bare-metal deployments. The decision framework produces a concrete recommendation: which storage system runs on the Paula (storage/I/O) nodes, how replication works across the mesh, and what the backup and disaster recovery architecture looks like when there is no cloud provider snapshot API to fall back on.

The storage layer is where the Amiga Principle meets data durability. Paula handled all I/O -- disk, audio, serial -- through dedicated DMA channels. The GSD mesh storage nodes serve the same function: dedicated I/O handling with replication, snapshots, and backup, coordinated by the control plane but never competing with GPU compute or API server workloads for the same disks.

---

## Container Storage Interface (CSI)

### What CSI Provides

The Container Storage Interface is a standard API between Kubernetes and storage backends. Before CSI, storage drivers were compiled into the kubelet binary -- adding a new storage system required rebuilding Kubernetes. CSI decoupled storage from the orchestrator:

- **CSI Controller:** Runs as a Kubernetes Deployment. Handles volume creation, deletion, snapshots, and expansion. Communicates with the storage backend API.
- **CSI Node:** Runs as a DaemonSet on every node. Handles volume attachment, mounting, and formatting on the local node. Manages the lifecycle of volumes that pods are actively using.
- **CSI Provisioner:** Watches for PersistentVolumeClaim (PVC) objects and triggers volume creation through the CSI Controller.

### PersistentVolume Lifecycle

```
PVC Created (by developer)
    |
    v
CSI Provisioner detects PVC
    |
    v
CSI Controller creates volume on storage backend
    |
    v
PV bound to PVC (Kubernetes binding)
    |
    v
Pod scheduled to node
    |
    v
CSI Node attaches + mounts volume on node
    |
    v
Pod filesystem access via mounted volume
    |
    v
Pod deleted -> CSI Node unmounts
    |
    v
PVC deleted -> CSI Controller deletes volume (if reclaimPolicy: Delete)
```

---

## Longhorn

### Architecture

Longhorn is a CNCF Incubating project providing cloud-native distributed block storage. It runs as microservices within the Kubernetes cluster itself -- a hyper-converged architecture where compute and storage share the same nodes.

**Core components:**

- **Longhorn Manager:** Runs on every node as a DaemonSet. Manages volume lifecycle, replication, scheduling, and communication with the Longhorn UI.
- **Longhorn Engine:** Each volume gets its own dedicated engine process. The engine handles read/write operations and communicates with replicas. This per-volume isolation means a hung or slow volume does not affect other volumes.
- **Replicas:** Each volume maintains a configurable number of replicas (default: 3) spread across different nodes. Replicas are file-based -- they store data as files on the node's existing filesystem.
- **iSCSI target:** Volumes are exposed to pods via iSCSI. The NVMe-over-TCP engine is in development but not yet production-ready as of March 2026.

### Key Advantage for Small Clusters

Longhorn does not require dedicated unformatted disks. This is the critical differentiator for the GSD mesh cluster:

| Requirement | Longhorn | Rook/Ceph |
|------------|----------|-----------|
| Dedicated raw disks | No -- uses existing filesystem paths | Yes -- requires unpartitioned, unformatted disks |
| Minimum nodes for replication | 3 | 3 (OSD nodes with dedicated storage) |
| Can share disks with OS | Yes | No (Ceph takes exclusive ownership) |
| Installation method | Helm chart (5 minutes) | Helm chart + OSD preparation (30+ minutes) |

For a 10-node mesh cluster where every disk already has an OS installed, Longhorn can use a directory path on each node (e.g., `/var/lib/longhorn`) without requiring repartitioning, reformatting, or dedicated storage hardware.

### Configuration for GSD Mesh

```yaml
# Longhorn settings for GSD mesh cluster
apiVersion: longhorn.io/v1beta2
kind: Setting
metadata:
  name: default-replica-count
  namespace: longhorn-system
value: "3"
---
apiVersion: longhorn.io/v1beta2
kind: Setting
metadata:
  name: storage-over-provisioning-percentage
  namespace: longhorn-system
value: "100"
---
apiVersion: longhorn.io/v1beta2
kind: Setting
metadata:
  name: default-data-path
  namespace: longhorn-system
value: "/var/lib/longhorn"
---
apiVersion: longhorn.io/v1beta2
kind: Setting
metadata:
  name: replica-node-level-soft-anti-affinity
  namespace: longhorn-system
value: "true"
```

### Storage Classes

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: longhorn-fast
provisioner: driver.longhorn.io
allowVolumeExpansion: true
reclaimPolicy: Delete
parameters:
  numberOfReplicas: "3"
  staleReplicaTimeout: "2880"
  diskSelector: "ssd"
  nodeSelector: "gsd.mesh/role=paula"
---
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: longhorn-bulk
provisioner: driver.longhorn.io
allowVolumeExpansion: true
reclaimPolicy: Delete
parameters:
  numberOfReplicas: "2"
  staleReplicaTimeout: "2880"
  diskSelector: "hdd"
  nodeSelector: "gsd.mesh/role=paula"
```

### Features

- **Snapshots:** Point-in-time snapshots of volumes. Copy-on-write implementation -- snapshots are fast and space-efficient until modified blocks accumulate.
- **Incremental Backups:** Backup volumes to S3-compatible storage (MinIO, Wasabi, AWS S3) or NFS targets. Only changed blocks are transferred after the initial full backup.
- **Cross-Cluster DR:** Replicate volumes to a standby cluster for disaster recovery. The standby volume is read-only until promoted during failover.
- **Encryption at Rest:** dm-crypt based volume encryption. Keys stored in Kubernetes Secrets (integrate with HashiCorp Vault for production key management).
- **Web UI:** Built-in dashboard for volume management, monitoring, backup status, and node health. No additional monitoring stack required for storage visibility.
- **Volume Expansion:** Online volume expansion -- increase PVC size without unmounting or pod restart. Requires `allowVolumeExpansion: true` in the StorageClass.

### Limitations

- **Block storage only:** No native shared filesystem (CephFS equivalent) or object storage (S3 equivalent). Multi-writer workloads require the ReadWriteMany NFS addon.
- **Network bandwidth:** Replication happens at the volume level -- high-write databases can saturate network links between nodes. For write-intensive workloads, consider single-replica volumes on local NVMe with application-level replication.
- **iSCSI overhead:** The iSCSI protocol adds latency compared to local NVMe access. For latency-sensitive workloads (real-time inference), consider local-path provisioner instead of Longhorn.
- **Scale ceiling:** Generally considered less robust than Ceph for clusters exceeding 50-100 nodes or storing petabytes of data. For the GSD mesh at 10 nodes, this is not a concern.

---

## Rook/Ceph

### Architecture

Rook (CNCF Graduated) is a Kubernetes operator that orchestrates Ceph -- one of the most battle-tested distributed storage systems in existence. Ceph provides three storage protocols through a single deployment:

- **RBD (RADOS Block Device):** Block storage for databases, stateful applications. Equivalent to Longhorn volumes but with Ceph's scale and reliability.
- **CephFS:** POSIX-compliant shared filesystem. Multiple pods can mount the same filesystem simultaneously (ReadWriteMany). Essential for workloads like shared model repositories, log aggregation, and content management.
- **RGW (RADOS Gateway):** S3-compatible object storage. Run your own object store without AWS dependency. Data lakes, backup targets, artifact storage.

### Requirements

**The hard requirement:** Ceph needs dedicated raw devices -- unpartitioned, unformatted disks. Rook can discover raw devices on nodes and claim them for OSD (Object Storage Daemon) deployment. Once Ceph claims a disk, it takes exclusive ownership. The disk is no longer available for the OS or other applications.

**Minimum practical deployment:**

- 3 OSD nodes with at least 1 dedicated storage drive each
- 3 MON (Monitor) pods for consensus (can co-locate with OSDs on same nodes)
- 1 MDS (Metadata Server) pod if using CephFS
- 1 RGW pod if using object storage

### Operational Complexity

| Operation | Longhorn | Rook/Ceph |
|-----------|----------|-----------|
| Initial deployment | Helm install (5 min) | Helm install + OSD discovery + pool creation (30+ min) |
| Adding a node | Label node, Longhorn auto-discovers | Configure OSD on raw device, wait for rebalancing |
| Disk failure | Longhorn rebuilds replica on available nodes | Ceph rebalances across OSDs, CRUSH map update |
| Capacity expansion | Add disk path to existing node | Add raw device, create OSD, rebalance |
| Monitoring | Built-in Web UI | Ceph Dashboard + Prometheus exporters |
| CRUSH map management | N/A | Manual tuning for fault domain hierarchy |
| Version upgrades | Helm upgrade | Helm upgrade + OSD rolling restart + health checks |

### When to Choose Rook/Ceph

- **Multi-protocol requirement:** Need block + shared filesystem + object storage from a single system
- **Scale:** Clusters with 20+ nodes and dedicated storage hardware
- **Enterprise reliability:** Ceph has been battle-tested at exabyte scale by organizations like CERN and Bloomberg
- **Dedicated storage infrastructure:** Nodes with unused raw devices specifically for storage

---

## OpenEBS

### Mayastor (Container Attached Storage)

OpenEBS Mayastor is a Kubernetes-native storage engine built on SPDK (Storage Performance Development Kit) and NVMe-oF (NVMe over Fabrics). It provides the highest performance of any cloud-native storage solution by bypassing the Linux kernel's block layer entirely.

**Key characteristics:**

- NVMe-oF protocol for volume access (lower latency than iSCSI)
- SPDK-based I/O path -- user-space, poll-mode, zero-copy
- Requires NVMe SSDs on storage nodes (HDD not supported)
- Hugepages allocation required (consumes significant memory)

**GSD mesh fit:** Consider for GPU compute nodes where AI training writes checkpoints to persistent storage. The NVMe performance path minimizes I/O wait time during checkpoint operations. However, the memory overhead (hugepages) and NVMe-only requirement limit deployment to specific node types.

### LocalPV

OpenEBS LocalPV provides Kubernetes-managed access to local node storage without network replication. Two modes:

- **LocalPV-Hostpath:** Uses a directory on the node filesystem. No replication, no network overhead. Maximum local performance.
- **LocalPV-ZFS:** Uses ZFS volumes on the node. Provides local snapshots, compression, and data integrity without network replication.

**Use case:** Scratch space for GPU training jobs, temporary model caches, build artifacts. Data that can be recreated from source if the node fails.

---

## NFS for Shared Workloads

### When NFS Makes Sense

NFS provides a shared filesystem accessible from all pods across all nodes. Unlike Longhorn or Ceph block storage, NFS supports ReadWriteMany access mode natively -- multiple pods can read and write to the same filesystem simultaneously.

**GSD mesh use cases:**

- Shared model repository (all inference pods read the same model files)
- Log aggregation directory (all pods write logs, Loki reads them)
- Build artifact cache (all build pods share compiled dependencies)
- Minecraft world data (shared between Minecraft server pods for multi-instance deployments)

### NFS CSI Driver

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: nfs-shared
provisioner: nfs.csi.k8s.io
parameters:
  server: paula-01.mesh.local
  share: /exports/shared
reclaimPolicy: Retain
mountOptions:
  - nfsvers=4.1
  - hard
  - noresvport
```

### NFS Server on Paula Nodes

```bash
# Paula storage node NFS configuration
# /etc/exports
/exports/shared  10.0.0.0/24(rw,sync,no_subtree_check,no_root_squash)
/exports/models  10.0.0.0/24(ro,sync,no_subtree_check)
/exports/logs    10.0.0.0/24(rw,sync,no_subtree_check,no_root_squash)
```

**Limitation:** NFS is a single point of failure unless the NFS server is itself highly available (NFS-Ganesha on top of CephFS, or DRBD-based failover). For the GSD mesh, running NFS on a Paula node with Longhorn-backed storage provides a pragmatic balance: NFS handles the ReadWriteMany access pattern, Longhorn handles replication and backup of the underlying data.

---

## Storage Decision Framework

### Decision Matrix

| Criterion | Longhorn | Rook/Ceph | OpenEBS Mayastor | NFS | Local Path |
|-----------|----------|-----------|-----------------|-----|------------|
| Cluster size sweet spot | 3-20 nodes | 10-100+ nodes | 3-20 nodes (NVMe) | Any | Any |
| Dedicated disks required | No | Yes | Yes (NVMe only) | No (but dedicated NFS server) | No |
| Protocols | Block | Block + File + Object | Block | File (shared) | Block (local) |
| Replication | Yes (configurable) | Yes (CRUSH-managed) | Yes (sync/async) | No (server-level) | No |
| Operational complexity | Low | High | Medium-High | Low | Minimal |
| Performance | Good | Excellent (tuned) | Best (NVMe/SPDK) | Moderate (network-bound) | Best (local) |
| ARM support | Yes | Limited | No | Yes | Yes |
| Snapshots | Yes | Yes | Yes | No (unless ZFS backend) | No |
| Backup to S3 | Yes (built-in) | Yes (Ceph RGW or external) | External only | External only | External only |
| Web UI | Yes | Ceph Dashboard | No | No | No |

### GSD Mesh Storage Architecture

```
+------------------------------------------+
|           K3s Cluster Storage            |
+------------------------------------------+
|                                          |
|  +-- Longhorn (Primary) ---------------+|
|  | longhorn-fast: SSD, 3 replicas      ||
|  | longhorn-bulk: HDD, 2 replicas      ||
|  | Backup target: MinIO S3             ||
|  +-------------------------------------+|
|                                          |
|  +-- NFS (Shared Access) --------------+|
|  | nfs-shared: Model repos, logs       ||
|  | Backed by Longhorn volume           ||
|  +-------------------------------------+|
|                                          |
|  +-- Local Path (Scratch) -------------+|
|  | local-nvme: GPU checkpoint scratch  ||
|  | No replication (ephemeral data)     ||
|  +-------------------------------------+|
|                                          |
+------------------------------------------+
```

### Recommendation by Workload

| Workload | StorageClass | Rationale |
|----------|-------------|-----------|
| Database (PostgreSQL, Redis) | longhorn-fast | SSD-backed, 3 replicas, consistent I/O |
| Minecraft world data | longhorn-fast | Durability critical, moderate write rate |
| AI model storage | nfs-shared (read) | Multiple inference pods read same models |
| AI training checkpoints | local-nvme | Write-intensive, ephemeral, recreatable |
| Monitoring data (Prometheus) | longhorn-bulk | Time-series writes, retention-based deletion |
| Backup targets | longhorn-bulk | HDD-backed, high capacity, lower performance OK |
| Log aggregation | nfs-shared | Multi-writer, moderate throughput |
| Velero cluster backup | External S3 (MinIO) | Off-cluster for disaster recovery |

---

## Backup & Disaster Recovery

### Two-Layer Protection

The GSD mesh implements backup at two independent layers:

**Layer 1 -- Storage-Level (Longhorn):**

- Automated snapshots on configurable schedule (hourly, daily)
- Incremental backup to S3-compatible storage (MinIO running on a Paula node)
- Cross-cluster volume replication for standby recovery

```yaml
apiVersion: longhorn.io/v1beta2
kind: RecurringJob
metadata:
  name: daily-backup
  namespace: longhorn-system
spec:
  cron: "0 2 * * *"
  task: backup
  retain: 7
  concurrency: 2
  labels:
    backup-tier: daily
```

**Layer 2 -- Application-Level (Velero):**

- Backs up Kubernetes resource definitions (Deployments, Services, ConfigMaps, Secrets)
- Snapshots PersistentVolumeClaims via CSI snapshot integration
- Stores everything in S3-compatible storage
- Supports scheduled backups, manual backups, and disaster recovery restore

```yaml
apiVersion: velero.io/v1
kind: Schedule
metadata:
  name: daily-cluster-backup
  namespace: velero
spec:
  schedule: "0 3 * * *"
  template:
    includedNamespaces:
      - "*"
    excludedNamespaces:
      - velero
      - kube-system
    defaultVolumesToFsBackup: true
    ttl: 720h
```

### Recovery Testing

Backup systems that have never been tested in anger are not backup systems. The GSD mesh includes quarterly recovery drills:

1. Create a test namespace with representative workloads
2. Deploy databases, stateful apps, and configuration
3. Take a Velero backup
4. Delete the entire test namespace
5. Restore from backup
6. Verify data integrity and application functionality
7. Document any issues, update procedures

---

## Cross-References

- **OCN (Open Compute):** Hardware disk specifications, RAID configurations, SSD endurance ratings for storage nodes.
- **SYS (Systems Admin):** Filesystem preparation, LVM configuration, NFS server setup on Paula nodes.
- **GRD (Gradient Engine):** GPU training checkpoint storage requirements, model repository size estimates.
- **CMH (Comp. Mesh):** Network bandwidth between nodes affects Longhorn replication performance.
- **PSG (Pacific Spine):** Cross-site replication for disaster recovery depends on backbone bandwidth.

---

## Sources

- Longhorn Documentation -- longhorn.io/docs/
- Longhorn Architecture -- longhorn.io/docs/latest/concepts/
- Rook Documentation -- rook.io/docs/
- Rook/Ceph Quickstart -- rook.io/docs/rook/latest/Getting-Started/quickstart/
- Ceph Documentation -- docs.ceph.com/
- OpenEBS Mayastor -- openebs.io/docs/
- Kubernetes CSI Documentation -- kubernetes-csi.github.io/docs/
- NFS CSI Driver -- github.com/kubernetes-csi/csi-driver-nfs
- Velero Documentation -- velero.io/docs/
- MinIO Documentation -- min.io/docs/
- CNCF Storage Landscape -- landscape.cncf.io/card-mode?category=cloud-native-storage
