# IaaS Self-Hosting & Ceph Integration

> **Domain:** Cloud Storage and Infrastructure Sovereignty
> **Module:** 3 -- Block Storage, Object Storage, Distributed Systems, and Data Sovereignty
> **Through-line:** *The question is not whether self-hosted infrastructure is harder than managed cloud. The question is whether you own your data, your compute, and your operational knowledge -- or whether you rent all three from a vendor who can change the terms at any time. Self-hosting is not a technical preference. It is a sovereignty decision.*

---

## Table of Contents

1. [The Infrastructure Sovereignty Argument](#1-the-infrastructure-sovereignty-argument)
2. [Cinder: Block Storage Architecture](#2-cinder-block-storage-architecture)
3. [LVM Backend: Local Block Storage](#3-lvm-backend-local-block-storage)
4. [Ceph Integration: Distributed Storage](#4-ceph-integration-distributed-storage)
5. [RADOS: The Foundation Layer](#5-rados-the-foundation-layer)
6. [CRUSH Maps and Data Placement](#6-crush-maps-and-data-placement)
7. [Swift: Object Storage](#7-swift-object-storage)
8. [Backup Strategies and Disaster Recovery](#8-backup-strategies-and-disaster-recovery)
9. [Storage Performance Considerations](#9-storage-performance-considerations)
10. [Encryption at Rest](#10-encryption-at-rest)
11. [Storage Design Trade Studies](#11-storage-design-trade-studies)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. The Infrastructure Sovereignty Argument

The managed cloud value proposition is straightforward: pay per use, no hardware to manage, instant scalability, global availability. For many workloads, this is the correct choice. But the proposition has terms that are rarely examined until they matter [1].

When an organization runs on AWS, it does not own compute capacity -- it rents it. The rental agreement includes pricing that can change with 30 days notice, service deprecation that can strand running workloads, and geographic restrictions that may conflict with data residency requirements. The 2024 Flexera State of the Cloud Report found that 32% of cloud spending is wasted on unused or overprovisioned resources, and 61% of organizations cite managing cloud spend as their top challenge [2].

Self-hosted infrastructure using OpenStack changes the economic model fundamentally:

| Factor | Managed Cloud | Self-Hosted OpenStack |
|---|---|---|
| Capital cost | Zero (OpEx only) | Hardware purchase (CapEx) |
| Operating cost | Per-hour compute, per-GB storage, per-GB egress | Electricity, cooling, human time |
| Cost predictability | Variable, vendor-controlled pricing | Fixed once hardware is purchased |
| Scaling speed | Seconds to minutes | Days to weeks (hardware procurement) |
| Data sovereignty | Vendor's data centers, vendor's terms | Your hardware, your location, your rules |
| Knowledge retention | Vendor abstracts everything | Team learns every layer |
| Vendor lock-in | High (proprietary APIs, services) | Zero (open-source, standard APIs) |
| Operational complexity | Vendor-managed | Self-managed |

The self-hosting decision is not universally correct. It is correct when data sovereignty matters, when cost predictability matters, when operational knowledge matters, and when the organization has the human capacity to manage infrastructure. Module 5 provides the decision framework for when each approach is appropriate [3].

> **SAFETY WARNING:** Self-hosted infrastructure means self-managed security. There is no vendor security team monitoring your deployment. Every CVE patch, every certificate rotation, every RBAC policy review is the operator's responsibility. Module 2 (NASA SE Rigor) Section 11 covers safety boundaries for self-hosted infrastructure.

---

## 2. Cinder: Block Storage Architecture

Cinder provides persistent block storage to Nova instances. In cloud terminology, a Cinder volume is the equivalent of a hard drive that can be attached to, detached from, and moved between virtual machines. The data persists independently of the instance lifecycle -- deleting an instance does not delete its attached volumes [4].

### Architecture Components

```
CINDER BLOCK STORAGE -- ARCHITECTURAL OVERVIEW
================================================================

  cinder-api                cinder-scheduler          cinder-volume
  +---------------+        +----------------+        +---------------+
  | REST API      |        | Selects which  |        | Manages the   |
  | Authentication|------->| volume backend |------->| actual storage|
  | Quota check   |        | handles request|        | backend       |
  | Request queue |        | (capacity,     |        | (LVM, Ceph,   |
  |               |        |  affinity)     |        |  NFS, etc.)   |
  +---------------+        +----------------+        +---------------+
                                                           |
                                                           v
                                                    +---------------+
                                                    | Storage       |
                                                    | Backend       |
                                                    | LVM / Ceph /  |
                                                    | NFS / NetApp  |
                                                    +---------------+
```

- **cinder-api** -- Accepts REST API requests, validates against Keystone, checks project quotas, places requests on the message queue
- **cinder-scheduler** -- Selects which volume backend should handle the request based on available capacity, requested volume type, and affinity rules
- **cinder-volume** -- Interfaces with the actual storage backend to create, delete, snapshot, clone, and migrate volumes

### Volume Lifecycle

```
CREATING --> AVAILABLE --> IN-USE --> AVAILABLE (detach)
                |                       |
                |--> DELETING --> DELETED
                |
                |--> EXTENDING --> AVAILABLE
                |
                |--> SNAPSHOTTING --> AVAILABLE
                      (creates snapshot)
```

A volume can be attached to at most one instance at a time (by default). Multi-attach support exists for specific backends and use cases (clustered filesystems like GFS2) but requires explicit configuration [5].

---

## 3. LVM Backend: Local Block Storage

The LVM (Logical Volume Manager) backend is Cinder's simplest storage option, suitable for single-node deployments and development environments [6].

### How It Works

1. A physical disk or partition is configured as an LVM physical volume (PV)
2. One or more PVs form a volume group (VG), typically named `cinder-volumes`
3. When Cinder creates a volume, it creates a logical volume (LV) within the VG
4. The LV is presented to Nova instances via iSCSI (default) or NVMe over Fabrics

```
LVM STORAGE STACK
================================================================

  Nova Instance
       |
       | iSCSI target (tgt or LIO)
       |
  +----v---------+
  | Logical Vol  |  <-- Cinder creates/manages these
  +----+---------+
       |
  +----v---------+
  | Volume Group |  <-- "cinder-volumes"
  | (VG)         |
  +----+---------+
       |
  +----v---------+
  | Physical Vol |  <-- /dev/sdb (dedicated disk)
  | (PV)         |
  +--------------+
```

### Limitations

- **Single-node only:** LVM volumes live on the host where cinder-volume runs. Instance migration requires volume migration (data copy), which is slow.
- **No redundancy:** A disk failure destroys all volumes on that disk. Backups are the only protection.
- **Limited performance:** iSCSI adds protocol overhead. Direct-attached storage via Ceph RBD eliminates this.
- **No thin provisioning (by default):** Each volume allocates its full size immediately unless thin provisioning is explicitly configured.

LVM is appropriate for lab environments, development, and learning. Production deployments should use Ceph or a commercial storage backend [7].

---

## 4. Ceph Integration: Distributed Storage

Ceph is a distributed storage system that provides block, object, and file storage from a unified cluster. When integrated with OpenStack, Ceph replaces LVM as the Cinder backend, provides native storage for Glance images, and can serve as the backend for Swift-compatible object storage [8].

### Why Ceph for OpenStack

The Ceph-OpenStack integration provides capabilities that are impossible with local storage:

| Capability | LVM | Ceph |
|---|---|---|
| Data redundancy | None (single disk) | 3x replication or erasure coding |
| Instance live migration | Requires volume copy | Instant (shared storage) |
| Image-to-instance launch | Full image copy | Copy-on-write clone (< 2 seconds) |
| Volume snapshots | LVM snapshots (limited) | Instant, unlimited snapshots |
| Scale-out storage | Not possible | Add OSDs to expand |
| Self-healing | No | Automatic rebalancing on failure |

### Integration Architecture

```
CEPH-OPENSTACK INTEGRATION
================================================================

  +----------+    +----------+    +----------+
  | Nova     |    | Cinder   |    | Glance   |
  | (compute)|    | (block)  |    | (images) |
  +----+-----+    +----+-----+    +----+-----+
       |               |               |
       |      librbd   |    librbd     |    librbd
       |               |               |
  +----v---------------v---------------v-----+
  |                                          |
  |              Ceph RADOS Cluster          |
  |                                          |
  |  +--------+  +--------+  +--------+     |
  |  | OSD    |  | OSD    |  | OSD    |     |
  |  | (disk) |  | (disk) |  | (disk) |     |
  |  +--------+  +--------+  +--------+     |
  |                                          |
  |  +--------+  +--------+  +--------+     |
  |  | MON    |  | MON    |  | MON    |     |
  |  +--------+  +--------+  +--------+     |
  +------------------------------------------+
```

Each OpenStack service connects to Ceph through `librbd` (the RADOS Block Device library), which communicates directly with the Ceph cluster. There is no intermediate storage server -- the compute node talks directly to the OSDs [9].

---

## 5. RADOS: The Foundation Layer

RADOS (Reliable Autonomic Distributed Object Store) is Ceph's foundation layer. Everything in Ceph -- block devices (RBD), object storage (RGW), and file storage (CephFS) -- is ultimately stored as objects in RADOS [10].

### Components

- **OSDs (Object Storage Daemons):** Each OSD manages one physical storage device (HDD or SSD). A cluster typically has dozens to thousands of OSDs. Each OSD handles read/write operations, replication, recovery, and rebalancing for the objects it stores.

- **MONs (Monitor Daemons):** Maintain the cluster map -- the authoritative record of which OSDs are active, which placement groups are where, and the current CRUSH map. A production cluster requires at least 3 monitors for quorum (tolerating 1 failure). MONs use Paxos consensus for cluster map updates.

- **MGRs (Manager Daemons):** Provide monitoring, orchestration, and plugin interfaces. Active/standby pair for high availability. The dashboard, Prometheus metrics endpoint, and orchestrator modules run in the manager.

### Data Flow

When a client writes a block to an RBD device:

1. The client library calculates the RADOS object name from the block offset
2. The CRUSH algorithm determines which OSD should store the primary copy
3. The client sends the write directly to the primary OSD
4. The primary OSD writes locally and replicates to secondary OSDs (synchronously for data safety)
5. Once all replicas confirm, the primary OSD acknowledges the write to the client

The critical insight: there is no metadata server in the data path. The client computes the location of every object using the CRUSH algorithm, which means reads and writes scale linearly with the number of OSDs [11].

---

## 6. CRUSH Maps and Data Placement

CRUSH (Controlled Replication Under Scalable Hashing) is the algorithm that determines where data is stored in a Ceph cluster. Unlike traditional storage systems that use lookup tables (which become bottlenecks at scale), CRUSH uses a deterministic hash function that any client can compute independently [12].

### Failure Domain Hierarchy

```
CRUSH MAP -- FAILURE DOMAIN HIERARCHY
================================================================

  root default
  +-- datacenter dc1
  |   +-- rack rack1
  |   |   +-- host node01
  |   |   |   +-- osd.0 (1TB SSD)
  |   |   |   +-- osd.1 (1TB SSD)
  |   |   +-- host node02
  |   |       +-- osd.2 (1TB SSD)
  |   |       +-- osd.3 (1TB SSD)
  |   +-- rack rack2
  |       +-- host node03
  |       |   +-- osd.4 (4TB HDD)
  |       |   +-- osd.5 (4TB HDD)
  |       +-- host node04
  |           +-- osd.6 (4TB HDD)
  |           +-- osd.7 (4TB HDD)
```

CRUSH rules specify the failure domain for replica placement. With a rule that distributes replicas across hosts, a 3x replicated object will have copies on three different hosts. If a host fails, two copies remain available and Ceph automatically re-replicates to restore the third copy on a surviving host [13].

### Replication vs. Erasure Coding

| Strategy | Storage Overhead | Fault Tolerance | Read Performance | Write Performance |
|---|---|---|---|---|
| 3x Replication | 200% | Survives 2 failures | Excellent (read from any replica) | Good (write to 3 OSDs) |
| Erasure 4+2 | 50% | Survives 2 failures | Good (reconstruct from 4 of 6) | Moderate (encode + distribute) |
| Erasure 8+3 | 37.5% | Survives 3 failures | Good | Moderate |

Replication is preferred for hot data (instance boot volumes, active databases). Erasure coding is preferred for cold data (backups, archives, infrequently accessed objects). Ceph supports both simultaneously through different storage pools [14].

---

## 7. Swift: Object Storage

Swift provides an S3-compatible object storage service. Unlike block storage (which presents a disk-like interface), object storage provides an HTTP API for storing and retrieving arbitrary data objects organized in containers [15].

### Architecture: The Ring

Swift distributes data across storage nodes using a ring -- a data structure that maps object names to physical storage locations. The ring uses consistent hashing with virtual nodes (partitions) to ensure even distribution and minimal data movement when nodes are added or removed [16].

```
SWIFT RING ARCHITECTURE
================================================================

  Object: "container/photo.jpg"
       |
       v
  Hash function --> partition 2847
       |
       v
  Ring lookup --> partition 2847 lives on:
    - Zone 1, Node A (primary)
    - Zone 2, Node B (handoff 1)
    - Zone 3, Node C (handoff 2)
```

Swift stores 3 copies by default, distributed across failure zones. The ring ensures that replicas never share a failure zone.

### Containers and Objects

- **Accounts:** Top-level namespace, typically maps to an OpenStack project
- **Containers:** Named collections of objects within an account (equivalent to S3 buckets)
- **Objects:** Binary data blobs with metadata, up to 5 GB per object (larger objects use segmentation)

### Swift vs. Ceph RGW

Both provide S3-compatible object storage, but with different architectures [17]:

| Feature | Swift | Ceph RGW |
|---|---|---|
| Architecture | Dedicated ring-based system | RADOS gateway frontend to Ceph cluster |
| Consistency model | Eventually consistent | Strongly consistent |
| Integration | Native OpenStack service | Ceph add-on, OpenStack-compatible |
| Operational complexity | Separate infrastructure | Unified with block/file storage |
| When to choose | Standalone object store | Already running Ceph for block storage |

---

## 8. Backup Strategies and Disaster Recovery

### Backup Types

| Type | Method | RPO | RTO | Storage Cost |
|---|---|---|---|---|
| Database backup | MariaDB dump + binary logs | Minutes | 30-60 min | Low |
| Volume snapshot | Cinder/Ceph snapshot | Instant | Minutes | Medium (COW) |
| Full volume backup | Cinder backup to Swift/NFS | Hours | Hours | High (full copy) |
| Configuration backup | Git repository | Continuous | Minutes | Minimal |
| Image backup | Glance image export | Hours | Variable | High |

### Disaster Recovery Tiers

Following NASA's approach to mission assurance, disaster recovery is planned at three tiers [18]:

**Tier 1 -- Service Recovery (minutes)**
- Individual service container restart
- Configuration rollback from git
- Automatic via Kolla-Ansible health checks

**Tier 2 -- Node Recovery (hours)**
- Compute node replacement
- Volume migration to surviving storage
- Ceph automatic rebalancing

**Tier 3 -- Full Cluster Recovery (days)**
- Rebuild from configuration backups (git)
- Restore databases from MariaDB dumps
- Restore volumes from backup storage
- Re-register images from backup copies

> **CAUTION:** A backup that has not been tested is not a backup -- it is a hope. NASA's Product Verification process (SP-6105 Section 5.3) requires that backup procedures be verified through actual restore testing. Schedule quarterly restore drills.

---

## 9. Storage Performance Considerations

### IOPS Budget

Different workloads have different IOPS requirements. Understanding the IOPS budget prevents oversubscription [19]:

| Workload | Typical IOPS | Latency Target | Backend Choice |
|---|---|---|---|
| Boot volume | 100-500 | < 10ms | SSD pool |
| Database | 1,000-10,000 | < 5ms | NVMe SSD pool |
| Application server | 200-1,000 | < 20ms | SSD pool |
| File storage | 50-200 | < 50ms | HDD pool |
| Archive/backup | 10-50 | < 500ms | HDD erasure coded |

### Network Bandwidth

Storage network bandwidth is often the bottleneck in cloud deployments [20]:

| Network Type | Bandwidth | Use Case |
|---|---|---|
| 1 GbE | 125 MB/s | Management network, small lab |
| 10 GbE | 1.25 GB/s | Production storage, medium deployments |
| 25 GbE | 3.125 GB/s | High-performance compute + storage |
| 100 GbE | 12.5 GB/s | Large-scale HPC, NVMe-oF |

A dedicated storage network (separate from management and tenant traffic) is strongly recommended for any deployment beyond lab scale. Ceph's replication traffic can saturate shared networks during recovery events [21].

### Ceph Tuning Essentials

Key configuration parameters for OpenStack integration [22]:

```
# ceph.conf -- OpenStack integration tuning

[global]
# Journal/WAL on SSD, data on HDD (if using BlueStore)
bluestore_block_db_size = 67108864    # 64 MB per OSD

[client.cinder]
rbd_cache = true
rbd_cache_size = 67108864             # 64 MB
rbd_cache_max_dirty = 50331648        # 48 MB
rbd_cache_target_dirty = 33554432     # 32 MB

[client.nova]
rbd_cache = true
rbd_cache_size = 67108864
```

---

## 10. Encryption at Rest

Volume encryption protects data at rest on the storage backend. Even if the physical disk is removed from the server, the data is unreadable without the encryption key [23].

### Cinder Volume Encryption

Cinder supports volume-level encryption using dm-crypt (Linux kernel disk encryption):

1. Barbican (OpenStack Key Manager) stores encryption keys
2. When a volume is created with an encrypted volume type, Cinder generates a key and stores it in Barbican
3. When the volume is attached to an instance, Nova retrieves the key from Barbican and sets up dm-crypt on the compute node
4. The hypervisor handles encryption/decryption transparently -- the instance sees a normal block device

### Key Management

| Aspect | Requirement | Implementation |
|---|---|---|
| Key storage | Keys stored separately from data | Barbican with database backend |
| Key rotation | Periodic re-encryption possible | Barbican key rotation API |
| Key access | Only authorized services retrieve keys | Keystone RBAC + Barbican ACLs |
| Key backup | Keys must be included in backup strategy | Barbican database backup |

> **WARNING:** Losing encryption keys means permanent, irrecoverable data loss. Barbican key backup is as critical as data backup. Include Barbican database in every backup procedure.

---

## 11. Storage Design Trade Studies

Following NASA SE Process 4 (Design Solution Definition, SP-6105 Section 4.4), storage architecture decisions require documented trade studies [24].

**Trade Study: Primary Storage Backend**

| Criterion (Weight) | LVM (Score) | Ceph (Score) | NFS (Score) |
|---|---|---|---|
| Data redundancy (25%) | 1 (none) | 5 (replication/EC) | 3 (depends on NAS) |
| Performance (20%) | 4 (local disk) | 4 (distributed) | 2 (network overhead) |
| Scalability (20%) | 1 (single node) | 5 (add OSDs) | 3 (NAS limits) |
| Operational complexity (15%) | 5 (simple) | 2 (distributed system) | 4 (familiar) |
| OpenStack integration (10%) | 4 (native) | 5 (native, COW) | 3 (basic) |
| Cost (10%) | 5 (no additional) | 3 (3+ nodes ideal) | 2 (NAS hardware) |
| **Weighted Total** | **2.85** | **4.15** | **2.75** |

**Decision for lab deployment:** LVM for initial single-node (simplicity), with Ceph migration path documented for scale-out. Rationale: lab-scale risk tolerance permits single-disk operation; learning Ceph operations is a Phase E objective.

**Decision for production:** Ceph with minimum 3 OSD nodes. Rationale: data redundancy is non-negotiable for production workloads; performance characteristics match requirements.

---

## 12. Cross-References

> **Related:** [OpenStack Architecture](01-openstack-architecture.md) -- Cinder and Swift as core services in the architecture. [Neutron Networking & Heat](04-networking-orchestration.md) -- network design for storage traffic isolation. [Cloud Comparison](05-cloud-comparison-sovereignty.md) -- TCO analysis of self-hosted storage vs. managed.

**Series cross-references:**
- **K8S (Kubernetes):** Ceph provides PersistentVolumes for Kubernetes via CSI driver
- **SYS (Systems Administration):** Storage hardware provisioning, disk management, RAID configuration
- **OCN (Ocean Computing):** Distributed storage patterns, data replication strategies
- **NND (Neural Network Design):** High-IOPS storage requirements for training data
- **GSD2 (GSD Methodology):** Configuration management for storage infrastructure
- **MCF (Microservices):** Stateful service storage patterns with Cinder volumes
- **CMH (Command History):** Storage configuration change control

---

## 13. Sources

1. Open Infrastructure Foundation. "OpenStack User Survey 2024 -- Deployment Motivations." openinfra.dev/user-survey, 2024.
2. Flexera. "2024 State of the Cloud Report." flexera.com/blog/cloud/cloud-computing-trends, 2024.
3. O'Reilly, C. and Creese, S. "Digital Sovereignty and Cloud Computing." Oxford Internet Institute, Working Paper, 2023.
4. OpenStack Documentation. "Cinder Architecture." docs.openstack.org/cinder/latest/configuration/block-storage/block-storage-overview.html, 2024.
5. OpenStack Documentation. "Cinder Multi-Attach." docs.openstack.org/cinder/latest/admin/blockstorage-multi-attach.html, 2024.
6. OpenStack Documentation. "Cinder LVM Backend." docs.openstack.org/cinder/latest/configuration/block-storage/drivers/lvm-volume-driver.html, 2024.
7. OpenStack Operations Guide. "Storage Decisions." docs.openstack.org/ops-guide/arch-storage.html, 2024.
8. Ceph Documentation. "Ceph for OpenStack." docs.ceph.com/en/latest/rbd/rbd-openstack, 2024.
9. Ceph Documentation. "Architecture -- How Ceph Clients Stripe Data." docs.ceph.com/en/latest/architecture, 2024.
10. Weil, S.A., Brandt, S.A., Miller, E.L., et al. "RADOS: A Scalable, Reliable Storage Service for Petabyte-Scale Storage Clusters." Proceedings of the 2nd International Workshop on Petascale Data Storage, ACM, 2007.
11. Weil, S.A., Brandt, S.A., Miller, E.L., et al. "Ceph: A Scalable, High-Performance Distributed File System." Proceedings of the 7th USENIX OSDI, 2006.
12. Weil, S.A., Brandt, S.A., Miller, E.L., Maltzahn, C. "CRUSH: Controlled, Scalable, Decentralized Placement of Replicated Data." Proceedings of the ACM/IEEE SC2006 Conference, 2006.
13. Ceph Documentation. "CRUSH Maps." docs.ceph.com/en/latest/rados/operations/crush-map, 2024.
14. Ceph Documentation. "Erasure Code Profiles." docs.ceph.com/en/latest/rados/operations/erasure-code, 2024.
15. OpenStack Documentation. "Swift Architecture." docs.openstack.org/swift/latest/overview_architecture.html, 2024.
16. OpenStack Documentation. "Swift Ring Builder." docs.openstack.org/swift/latest/overview_ring.html, 2024.
17. Ceph Documentation. "Ceph Object Gateway (RGW)." docs.ceph.com/en/latest/radosgw, 2024.
18. NASA. "SP-6105 Rev2, Section 6.4: Technical Risk Management." 2016.
19. Red Hat. "Ceph Storage Performance Benchmarking." Red Hat Technical Report, 2023.
20. Mellanox Technologies. "Network Requirements for Ceph Storage Clusters." Technical White Paper, 2022.
21. Ceph Documentation. "Network Configuration Reference." docs.ceph.com/en/latest/rados/configuration/network-config-ref, 2024.
22. Ceph Documentation. "Block Device and OpenStack -- Configuration." docs.ceph.com/en/latest/rbd/rbd-openstack/#configuring-ceph, 2024.
23. OpenStack Documentation. "Volume Encryption." docs.openstack.org/cinder/latest/configuration/block-storage/volume-encryption.html, 2024.
24. NASA. "SP-6105 Rev2, Section 4.4: Design Solution Definition." 2016.

---

*OpenStack Cloud Platform -- Module 3: IaaS Self-Hosting & Ceph Integration. Sovereignty is not a feature you purchase. It is a capability you build -- one disk, one node, one verified procedure at a time.*
