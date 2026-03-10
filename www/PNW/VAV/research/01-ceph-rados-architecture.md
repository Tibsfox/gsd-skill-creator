# M1: Ceph/RADOS Architecture Survey

**Module 1 of the Voxel as Vessel research atlas.**
How do you store a world? Not in a filesystem — in an object store that heals itself, balances itself, and scales to exabytes. RADOS is the foundation. Everything in VAV sits on top of it.

---

## 1. RADOS Fundamentals

### 1.1 The Object Model

RADOS stores **named objects** in a flat namespace within a pool. Each object consists of three parts:

1. **Payload** — an opaque byte sequence up to ~128 MB (configurable). No internal structure imposed by RADOS.
2. **Extended attributes (xattrs)** — small key-value pairs stored in the OSD's metadata store (RocksDB in BlueStore). Fast single-round-trip reads. Size limit ~64 KB per xattr.
3. **Object map (omap)** — a key-value store backed by RocksDB, associated with the object. Supports iteration, prefix filtering, and range queries. Used for metadata too large for xattrs.

This three-part model is critical for VAV: the payload holds the Anvil `.mca` binary data, xattrs hold block palette hashes and coordinate bounds, and omap holds embedding index offsets and chunk manifests.

> "RADOS provides a single, flat object namespace... each object is a named byte sequence with associated metadata."
> — Weil, S. A. (2007). *Ceph: Reliable, Scalable, and High-Performance Distributed Storage*. PhD Thesis, UC Santa Cruz. §3.1.

### 1.2 CAP Theorem Position

RADOS is a **CP system** (Consistency + Partition tolerance, per Brewer's CAP theorem). In the presence of network partitions, RADOS blocks writes rather than accepting divergent state. Specifically:

- **Strong consistency** via primary-copy replication. Writes are acknowledged only after all replicas confirm.
- **Partition tolerance** by design — monitors detect OSD failures and re-map placement groups.
- **Availability** is sacrificed when insufficient OSDs are reachable to satisfy the pool's `min_size` requirement.

For VAV, CP semantics mean a retrieved region file is guaranteed to be the latest committed version. No stale reads, no merge conflicts on concurrent writes.

### 1.3 Cluster Architecture

A Ceph cluster consists of four daemon types:

| Daemon | Role | Quorum | Typical Count |
|--------|------|--------|---------------|
| **MON** | Maintains cluster maps, Paxos consensus | Yes (2n+1) | 3 or 5 |
| **OSD** | Stores objects, handles replication/recovery | No | 10s to 1000s |
| **MGR** | Telemetry, dashboard, module host | Active/Standby | 2 |
| **MDS** | Metadata for CephFS (not used in VAV) | Optional | 0 for VAV |

Clients (including RGW) obtain the cluster map from monitors, then communicate **directly** with OSDs. No central gateway bottleneck for data path operations.

> Source: Ceph Foundation. *Architecture*. https://docs.ceph.com/en/latest/architecture/

---

## 2. Pool Design for VAV

### 2.1 Three-Pool Architecture

VAV defines three RADOS pools, each optimized for its access pattern:

```
┌─────────────────────────────────────────────────────────┐
│                    Ceph Cluster                          │
│                                                         │
│  ┌─────────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │   vav-regions    │  │   vav-meta   │  │  vav-cache │ │
│  │                  │  │              │  │            │ │
│  │  Anvil .mca      │  │  World meta  │  │  Hot embed │ │
│  │  objects          │  │  Index maps  │  │  cache     │ │
│  │                  │  │  CRUSH rules │  │            │ │
│  │  Size: 3 replica │  │  Size: 3 rep │  │  Size: 2   │ │
│  │  PGs: 256        │  │  PGs: 64     │  │  PGs: 128  │ │
│  │  Erasure OK      │  │  Replicated  │  │  Replicated│ │
│  │  (cold tier)     │  │  (critical)  │  │  (short TTL│ │
│  └─────────────────┘  └──────────────┘  └────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2.2 vav-regions Pool

**Purpose:** Stores Anvil `.mca` files as RADOS objects.

- **Object naming:** `r.{x}.{z}.mca` — directly mirrors Minecraft's region file naming convention.
- **Object size:** 1-12 MB typical (Anvil files vary with chunk population density).
- **Replication:** 3-way replication for active worlds; erasure coding (k=4, m=2) for archived corpora.
- **xattrs per object:**
  - `vav.version` — encoding schema version (uint32)
  - `vav.dataversion` — Minecraft DataVersion for DFU compatibility
  - `vav.bounds` — coordinate bounding box (x_min, z_min, x_max, z_max)
  - `vav.palette_hash` — SHA-256 of the merged palette across all sections
  - `vav.chunk_count` — number of populated chunk columns (0-1024)
  - `vav.mtime` — last modification timestamp (Unix epoch, nanoseconds)

### 2.3 vav-meta Pool

**Purpose:** World-level metadata and index structures.

- **Object naming:** `meta/{world_id}/level.dat`, `meta/{world_id}/index/{index_name}`
- **Contents:**
  - `level.dat` — NBT-encoded world metadata (seed, spawn point, game rules, VAV encoding spec version)
  - Index maps — spatial index (which regions contain which document IDs), vocabulary manifest (block state → token mapping), embedding model metadata
- **Replication:** Always 3-way replicated. This is the most critical pool — losing metadata means losing the ability to interpret region data.
- **Access pattern:** Read-heavy, write-rare. Updated only on corpus ingest or reindex.

### 2.4 vav-cache Pool

**Purpose:** Hot embedding vectors for active retrieval workloads.

- **Object naming:** `cache/{query_hash}` or `cache/{region_x}.{region_z}/section_{y}`
- **TTL:** Objects expire after configurable period (default: 1 hour). Implemented via RADOS object expiration or application-level garbage collection.
- **Replication:** 2-way (acceptable to lose cache entries — they're regenerated from `vav-regions`).
- **Access pattern:** Read-heavy, write-on-miss. High throughput, latency-sensitive.

---

## 3. The CRUSH Algorithm

### 3.1 How CRUSH Works

CRUSH is a **pseudo-random, deterministic** placement function. Given an object name and a CRUSH map, any client can independently compute which OSDs store that object — no central directory lookup required.

The algorithm proceeds in three steps:

1. **Hash** the object name to a placement group (PG) number.
2. **Map** the PG to a set of OSDs using the CRUSH hierarchy and placement rules.
3. **Verify** OSD liveness against the OSD map; substitute failed OSDs using CRUSH's backtrack mechanism.

```
Object name: "r.3.7.mca"
    │
    ▼ hash(name) mod pg_num
PG: 5.a3
    │
    ▼ CRUSH(pg, rule, cluster_map)
OSDs: [osd.12, osd.37, osd.54]  ← 3 replicas on 3 different hosts
```

### 3.2 Rack-Aware Distribution

The CRUSH hierarchy encodes physical topology:

```
root default
├── rack rack-01
│   ├── host node-01
│   │   ├── osd.0  (2TB NVMe)
│   │   └── osd.1  (8TB HDD)
│   └── host node-02
│       ├── osd.2
│       └── osd.3
├── rack rack-02
│   ├── host node-03
│   │   ├── osd.4
│   │   └── osd.5
│   └── host node-04
│       ├── osd.6
│       └── osd.7
└── rack rack-03
    └── ...
```

Placement rules specify failure domain isolation. A typical rule for `vav-regions`:

```
rule vav-regions-rule {
    id 0
    type replicated
    min_size 2
    max_size 3
    step take default
    step chooseleaf firstn 0 type rack   ← one replica per rack
    step emit
}
```

This ensures that losing an entire rack (power failure, network switch death) never loses all copies of a region file.

### 3.3 CRUSH Affinity for Spatial Locality

VAV exploits CRUSH's customizability to co-locate adjacent region files. When a player walks across a region boundary, the client needs both the current and adjacent `.mca` files. If they live on the same OSD or same host, retrieval latency drops.

Custom CRUSH rule for spatial affinity:

- Region files whose Morton-coded coordinates share the first N bits are assigned to the same CRUSH subtree.
- This groups spatially adjacent regions on the same rack while still distributing across hosts within that rack.
- Trade-off: slightly reduced failure-domain diversity in exchange for significantly reduced cross-rack reads during spatial traversal.

> Source: Weil, S. A. et al. (2006). *CRUSH: Controlled, Scalable, Decentralized Placement of Replicated Data*. SC '06. ACM.

---

## 4. BlueStore

### 4.1 Architecture

BlueStore (default since Ceph Luminous, v12, 2017) manages raw block devices directly:

```
┌─────────────────────────┐
│      BlueStore OSD       │
│                          │
│  ┌────────┐ ┌──────────┐│
│  │RocksDB │ │ Raw Block ││
│  │(metadata│ │ Device   ││
│  │ + omap) │ │ (data)   ││
│  └────────┘ └──────────┘│
│       │           │      │
│       ▼           ▼      │
│  ┌──────────────────────┐│
│  │   Block Allocator     ││
│  │   (bitmap, 64KB min)  ││
│  └──────────────────────┘│
└─────────────────────────┘
```

### 4.2 Why BlueStore Matters for VAV

The predecessor backend, FileStore, stored RADOS objects as files on XFS/ext4. This caused a **double-write penalty**: data was written first to the journal, then to the filesystem. Every write happened twice.

BlueStore eliminates this:

| Property | FileStore | BlueStore |
|----------|-----------|-----------|
| **Write amplification** | 2x (journal + filesystem) | 1x (direct to block device) |
| **Metadata storage** | Filesystem xattrs (slow, size-limited) | RocksDB (fast, large omap support) |
| **Checksumming** | Optional, filesystem-level | Per-object, crc32c by default |
| **Compression** | Not supported | Inline (snappy, zstd, lz4) |
| **Copy-on-write** | No | Yes (efficient snapshots) |

For VAV, BlueStore's inline compression (zstd) is significant: Anvil `.mca` files are already zlib-compressed internally, but the metadata (xattrs, omap entries with embedding indexes) benefits from transparent compression.

> Source: Red Hat. *BlueStore: A New, Faster Storage Backend for Ceph*. https://www.redhat.com/en/blog/bluestore-new-faster-storage-backend-ceph

---

## 5. RADOS Gateway (RGW)

### 5.1 S3-Compatible Access Layer

RGW presents an S3-compatible HTTP API backed by RADOS. For VAV, this means standard tools work out of the box:

```python
import boto3

s3 = boto3.client('s3',
    endpoint_url='http://ceph-rgw:7480',
    aws_access_key_id='VAV_ACCESS_KEY',
    aws_secret_access_key='VAV_SECRET_KEY'
)

# Store a region file
s3.upload_file('r.3.7.mca', 'vav-regions', 'regions/r.3.7.mca')

# Retrieve a region file
s3.download_file('vav-regions', 'regions/r.3.7.mca', '/tmp/r.3.7.mca')

# List all regions in a coordinate range (prefix scan)
response = s3.list_objects_v2(
    Bucket='vav-regions',
    Prefix='regions/r.3.'  # All regions with x=3
)
```

### 5.2 RGW Architecture

```
Client (boto3/s3fs/curl)
    │
    ▼ HTTPS
┌──────────────┐
│  Load Balancer│  (HAProxy / Nginx)
└──────┬───────┘
       │
  ┌────┴────┐────────┐
  ▼         ▼        ▼
┌─────┐  ┌─────┐  ┌─────┐
│RGW-1│  │RGW-2│  │RGW-3│   ← Stateless, horizontally scalable
└──┬──┘  └──┬──┘  └──┬──┘
   │        │        │
   ▼        ▼        ▼
┌──────────────────────────┐
│        RADOS Cluster      │
│   (OSDs, Monitors, MGRs)  │
└──────────────────────────┘
```

RGW instances are **stateless** — they hold no local data. All state lives in RADOS (bucket index objects, data objects, metadata objects). This means:

- Horizontal scaling: add more RGW instances behind the load balancer.
- Zero-downtime upgrades: roll RGW instances one at a time.
- Geographic distribution: RGW instances can run in different locations, all pointing at the same RADOS cluster.

### 5.3 Boost.Asio Frontend

Since Ceph Nautilus (v14, 2019), the default RGW frontend is **Beast**, built on Boost.Asio:

- Asynchronous I/O via epoll (Linux) or kqueue (BSD).
- Handles thousands of concurrent connections per RGW instance.
- HTTP/1.1 persistent connections reduce connection setup overhead for burst retrieval.
- Configurable thread count (`rgw_thread_pool_size`) tuned for the hardware.

For VAV workloads, the key metric is **concurrent spatial query throughput**: when a user navigates through the voxel corpus, the client pre-fetches adjacent region files in parallel. Beast's async I/O handles these parallel GETs efficiently.

> Source: Ceph Foundation. *RADOS Gateway*. https://docs.ceph.com/en/latest/radosgw/

---

## 6. Operational Considerations

### 6.1 Capacity Planning

Back-of-envelope for a VAV deployment:

| Metric | Value | Notes |
|--------|-------|-------|
| Average .mca file size | 4 MB | Partially populated regions |
| Regions per corpus shard | 256 | 16x16 region grid |
| Corpus shard raw size | 1 GB | 256 × 4 MB |
| With 3x replication | 3 GB | Per corpus shard on disk |
| Embedding vectors per section | 1 | 3072 × 4 bytes = 12 KB |
| Sections per chunk | 20 avg | Of 24 possible |
| Embedding overhead per region | ~7.5 MB | 1024 chunks × 20 sections × 12 KB |

A modest corpus of 1,000 documents (50 region files) requires ~200 MB raw storage, ~600 MB replicated. Well within a small 3-node cluster.

### 6.2 Recovery and Self-Healing

When an OSD fails:

1. Monitors detect the failure via heartbeat timeout (default: 20 seconds to mark `down`, 600 seconds to mark `out`).
2. CRUSH recomputes PG mappings, assigning the failed OSD's PGs to surviving OSDs.
3. Recovery begins: surviving replicas copy data to the new OSD assignments.
4. Recovery is throttled (`osd_recovery_max_active`, `osd_recovery_sleep`) to avoid saturating the cluster.

For VAV, recovery means: if a disk dies, the region files it held are automatically reconstructed on other OSDs from surviving replicas. No operator intervention for data recovery. The world heals itself.

### 6.3 Authentication and Access Control

CephX keyrings scope access per pool:

```
[client.vav-reader]
    key = AQBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx==
    caps mon = "allow r"
    caps osd = "allow r pool=vav-regions, allow r pool=vav-cache"

[client.vav-writer]
    key = AQByyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy==
    caps mon = "allow r"
    caps osd = "allow rw pool=vav-regions, allow rw pool=vav-meta, allow rw pool=vav-cache"

[client.vav-admin]
    key = AQBzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz==
    caps mon = "allow *"
    caps osd = "allow * pool=vav-regions, allow * pool=vav-meta, allow * pool=vav-cache"
```

Principle of least privilege: readers cannot modify region files. Writers cannot modify pool configuration. Only admins can create/delete pools or change CRUSH rules.

> Source: Ceph Foundation. *CephX Authentication*. https://docs.ceph.com/en/latest/rados/configuration/auth-config-ref/

---

## Sources

1. Weil, S. A. (2007). *Ceph: Reliable, Scalable, and High-Performance Distributed Storage*. PhD Thesis, UC Santa Cruz.
2. Weil, S. A. et al. (2006). *CRUSH: Controlled, Scalable, Decentralized Placement of Replicated Data*. SC '06. ACM.
3. Ceph Foundation. *Architecture*. https://docs.ceph.com/en/latest/architecture/
4. Ceph Foundation. *RADOS Gateway*. https://docs.ceph.com/en/latest/radosgw/
5. Ceph Foundation. *CephX Authentication*. https://docs.ceph.com/en/latest/rados/configuration/auth-config-ref/
6. Ceph Foundation. *BlueStore Config Reference*. https://docs.ceph.com/en/latest/rados/configuration/bluestore-config-ref/
7. Red Hat. *BlueStore: A New, Faster Storage Backend for Ceph*. Red Hat Blog.
8. `rados(8)` man page. RADOS object store utility.
