# Ceph Distributed Storage

> **Domain:** Distributed Storage Systems
> **Module:** 3 -- Ceph Architecture, CRUSH, and Forensic Challenges
> **Through-line:** *Ceph is a self-healing organism. It replicates, rebalances, and recovers without human intervention -- which is exactly the problem for forensics. A system designed to automatically repair itself will, given the opportunity, overwrite the very evidence a forensic examiner needs to preserve. Understanding Ceph's autonomous behavior is the prerequisite for examining it without triggering that behavior.*

---

## Table of Contents

1. [Ceph Architecture Overview](#1-ceph-architecture-overview)
2. [RADOS: Reliable Autonomic Distributed Object Store](#2-rados-reliable-autonomic-distributed-object-store)
3. [The CRUSH Placement Algorithm](#3-the-crush-placement-algorithm)
4. [BlueStore On-Disk Format](#4-bluestore-on-disk-format)
5. [OSD Daemon Architecture](#5-osd-daemon-architecture)
6. [Monitor Daemons and Cluster Maps](#6-monitor-daemons-and-cluster-maps)
7. [Erasure Coding Profiles](#7-erasure-coding-profiles)
8. [Stretch Cluster Architecture](#8-stretch-cluster-architecture)
9. [Forensic Challenges in Distributed Storage](#9-forensic-challenges-in-distributed-storage)
10. [CRUSH Map Reconstruction Procedure](#10-crush-map-reconstruction-procedure)
11. [Forensic Imaging of a Live Ceph Cluster](#11-forensic-imaging-of-a-live-ceph-cluster)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. Ceph Architecture Overview

Ceph is a distributed storage system delivering unified object (RADOS), block (RBD), and file (CephFS) storage. It is highly available and ensures strong data durability through replication, erasure coding, snapshots, and clones. By design it is self-healing and self-managing [1].

```
CEPH ARCHITECTURE -- COMPONENT MAP
================================================================

  CLIENT INTERFACES
  +--------+  +--------+  +--------+  +--------+
  | RBD    |  | CephFS |  | RGW    |  | librados|
  | (block)|  | (file) |  | (S3/   |  | (native)|
  |        |  |        |  | Swift) |  |         |
  +---+----+  +---+----+  +---+----+  +----+---+
      |           |           |            |
      +-----+-----+-----+-----+-----+-----+
            |
            v
  +-------------------------------------------+
  |        RADOS Object Store                 |
  |  (Reliable Autonomic Distributed Object)  |
  +-------------------------------------------+
            |
  +---------+---------+---------+---------+
  |         |         |         |         |
  +----+  +----+  +----+  +----+  +----+
  |OSD |  |OSD |  |OSD |  |MON |  |MDS |
  |  0 |  |  1 |  |  2 |  |    |  |    |
  +----+  +----+  +----+  +----+  +----+
  bluestore bluestore bluestore  cluster  metadata
  on raw    on raw    on raw     maps     for CephFS
  block     block     block
```

At the core, all data lives in RADOS. Higher-level interfaces (RBD, CephFS, RGW) translate client requests into RADOS object operations. Each RADOS object is stored on one or more OSDs (Object Storage Daemons), with placement determined by the CRUSH algorithm [2].

### Ceph Release Timeline (Forensically Relevant)

| Release | Codename | Key Forensic Feature |
|---------|----------|---------------------|
| Luminous (12.x) | 2017 | BlueStore default; OSD no longer requires local filesystem |
| Nautilus (14.x) | 2019 | Messenger v2 protocol encryption; dashboard |
| Pacific (16.x) | 2021 | Stretch cluster support; improved PG autoscaling |
| Quincy (17.x) | 2022 | RBD snapshot mirroring; improved erasure coding |
| Reef (18.x) | 2023 | NVMe/TCP transport; improved BlueStore compression |
| Squid (19.x) | 2024 | Enhanced stretch cluster; crimson OSD (experimental) |

---

## 2. RADOS: Reliable Autonomic Distributed Object Store

### Object Model

RADOS stores data as objects within pools. Each object has:
- **Object ID (OID):** A unique name within its pool (e.g., `rbd_data.12345.0000000000000001`)
- **Data payload:** The object's binary content (default max 4MB per object)
- **Extended attributes (xattrs):** Key-value metadata attached to the object
- **Object map (omap):** A key-value store associated with the object (used by RBD for metadata)

### Placement Groups (PGs)

Objects are not placed directly on OSDs. Instead, objects are mapped to Placement Groups (PGs), and PGs are mapped to OSDs via CRUSH [3]:

```
RADOS PLACEMENT -- OBJECT TO OSD PATH
================================================================

  Object "rbd_data.12345.00000001"
        |
        v
  hash(pool_id + object_name) % num_PGs = PG 3.1a7
        |
        v
  CRUSH(PG 3.1a7, CRUSH map, rule) = [OSD.5, OSD.12, OSD.27]
        |
        v
  Primary OSD.5 (serves reads, coordinates writes)
  Replica OSD.12 (secondary copy)
  Replica OSD.27 (tertiary copy)
```

The two-level indirection (object -> PG -> OSD) allows Ceph to rebalance data by changing PG-to-OSD mappings without rehashing every object. This is critical for forensics: understanding which PGs map to which OSDs is the key to locating data on physical drives [4].

---

## 3. The CRUSH Placement Algorithm

### Algorithm Design

CRUSH (Controlled Replication Under Scalable Hashing) is a pseudo-random placement algorithm that deterministically maps PGs to OSDs without requiring a central lookup table. Given the same inputs (PG ID, CRUSH map, placement rule), CRUSH always produces the same output [5].

CRUSH takes as input:
1. **PG ID:** The placement group identifier
2. **CRUSH map:** A hierarchical description of the storage topology (datacenters, racks, hosts, OSDs)
3. **Placement rule:** Specifies replication count and failure domain (e.g., "3 replicas, each on a different host")

```
CRUSH MAP -- HIERARCHICAL TOPOLOGY
================================================================

  root default
  |
  +-- datacenter dc1
  |   |
  |   +-- rack r1
  |   |   +-- host h1  [osd.0, osd.1, osd.2]
  |   |   +-- host h2  [osd.3, osd.4, osd.5]
  |   |
  |   +-- rack r2
  |       +-- host h3  [osd.6, osd.7, osd.8]
  |       +-- host h4  [osd.9, osd.10, osd.11]
  |
  +-- datacenter dc2
      |
      +-- rack r3
          +-- host h5  [osd.12, osd.13, osd.14]
          +-- host h6  [osd.15, osd.16, osd.17]

  Rule: replicated_rule
    step take root default
    step chooseleaf firstn 3 type host
    step emit

  Result for PG 3.1a7: [osd.5, osd.12, osd.0]
  (one per host, across failure domains)
```

### CRUSH Map Storage

The CRUSH map is stored in the monitor (MON) daemon's persistent store. Each MON maintains a copy of all cluster maps (CRUSH map, OSD map, MON map, PG map). The maps are versioned (epoch numbers); any change increments the epoch [6].

For forensics, the CRUSH map is the single most critical artifact. Without it, the mapping from logical objects to physical OSD locations cannot be reconstructed. If all MON daemons are lost, the CRUSH map must be reconstructed from surviving OSD data (see Section 10).

> **SAFETY WARNING:** Modifying the CRUSH map on a live cluster triggers data migration. Never modify CRUSH on a cluster under forensic examination. Even adding a single OSD to the map will cause RADOS to begin rebalancing, writing new data to existing drives and potentially overwriting evidence [5].

---

## 4. BlueStore On-Disk Format

### Overview

BlueStore (default since Luminous) stores RADOS object data directly on raw block devices, bypassing any local filesystem. This gives Ceph full control over the I/O path and eliminates the double-write penalty of journal-based stores [7].

### On-Disk Components

| Component | Device | Purpose | Forensic Anchor |
|-----------|--------|---------|----------------|
| Block (main) | Primary raw device | Object data as raw extents | Contains actual RADOS objects |
| WAL | Separate fast device (NVMe) | Write-Ahead Log for transactions | May contain un-committed writes |
| DB | Separate fast device (NVMe) | RocksDB metadata store | Object map, collection map, extent allocation |
| Label | First 4KB of primary device | OSD UUID, cluster FSID, BlueStore magic | Primary forensic identifier |

### BlueStore Label Format

The BlueStore label at offset 0 of each OSD device is the primary forensic anchor for Ceph cluster reconstruction [8]:

```
BLUESTORE LABEL -- FIRST 4KB OF OSD DEVICE
================================================================

  Offset 0x0000:  Magic bytes "bluestore block device\n"
  Offset 0x0018:  OSD UUID (16 bytes, UUID v4)
  Offset 0x0028:  Cluster FSID (16 bytes, UUID v4)
  Offset 0x0038:  Whoami (OSD number, uint64)
  Offset 0x0040:  BlueStore version
  Offset 0x0048:  Creation timestamp
  Offset 0x0050:  Device size
  Offset 0x0058:  Label checksum

  The OSD UUID + FSID pair uniquely identifies this OSD
  within this specific Ceph cluster.
```

By reading the BlueStore label from each surviving OSD device, a forensic examiner can:
1. Confirm which Ceph cluster the drive belonged to (FSID match)
2. Determine the OSD number (whoami field)
3. Establish a creation timeline (timestamp)
4. Verify label integrity (checksum)

### RocksDB Metadata

The DB partition contains a RocksDB database with:
- **Object metadata:** Size, modification time, checksums for each RADOS object
- **Collection map:** Maps PGs to their object lists
- **Extent allocator:** Tracks which byte ranges on the main block device are allocated to which objects
- **Deferred writes:** Small writes that were queued for later batching

For forensic analysis, the RocksDB database on the DB partition is the equivalent of a filesystem's inode table. Without it, raw objects on the main block device cannot be identified or bounded [9].

---

## 5. OSD Daemon Architecture

### OSD Lifecycle

Each OSD daemon manages one storage device. The daemon:
1. Registers with the MON cluster and receives the current cluster map
2. Accepts client I/O for the PGs it owns (as determined by CRUSH)
3. Replicates writes to secondary and tertiary OSDs
4. Participates in scrubbing (data integrity verification)
5. Participates in recovery (re-replicating data from failed OSDs)

### OSD State Transitions

| State | Meaning | Forensic Relevance |
|-------|---------|-------------------|
| up + in | Normal operation | OSD is serving data and participating in placement |
| up + out | Daemon running but excluded from CRUSH placement | Data being migrated away; recent removal or weight change |
| down + in | Daemon not running but still in CRUSH placement | Cluster waiting for OSD to return; data not yet migrated |
| down + out | Daemon not running, excluded from placement | Data migration complete; OSD considered permanently lost |

The transition from "down + in" to "down + out" is time-controlled (default: 10 minutes). This timer is critical for forensics: if a cluster is left running after an OSD failure, Ceph will begin migrating data from the failed OSD to surviving OSDs after 10 minutes, overwriting evidence on the surviving drives [10].

> **BLOCK SAFETY:** When performing forensics on a Ceph cluster, the OSD out timer MUST be disabled or the cluster MUST be placed in maintenance mode BEFORE any OSD is taken offline. Failure to do so triggers automatic data migration that modifies surviving drives [10].

---

## 6. Monitor Daemons and Cluster Maps

### MON Consensus

Ceph requires a quorum of MON daemons (typically 3 or 5) to maintain cluster map consensus. MONs use a Paxos-based consensus protocol to agree on map changes. If quorum is lost (majority of MONs unavailable), the cluster becomes read-only and no map changes can be committed [11].

### Cluster Maps

| Map | Contents | Update Frequency | Forensic Value |
|-----|----------|-----------------|----------------|
| MON map | MON addresses and ports | Rare | Identifies MON nodes for data extraction |
| OSD map | OSD states, weights, addresses | Every OSD state change | Associates OSDs with physical hosts |
| CRUSH map | Topology tree + placement rules | Configuration changes | THE critical map for data location |
| PG map | PG states, acting set, up set | Every PG state change | Shows which OSDs own which PGs |
| MDS map | Metadata server states | CephFS changes | CephFS namespace metadata location |

### Extracting Maps from MON Store

If MON daemons are available (even if the cluster is not healthy), maps can be extracted using [12]:

```
# Extract CRUSH map from a running MON
ceph osd getcrushmap -o crushmap.bin
crushtool -d crushmap.bin -o crushmap.txt

# Extract OSD map
ceph osd getmap -o osdmap.bin
osdmaptool --print osdmap.bin

# Extract MON store directly (if daemon is not running)
ceph-monstore-tool /var/lib/ceph/mon/ceph-a/ get crushmap -- -o crushmap.bin
```

---

## 7. Erasure Coding Profiles

### Reed-Solomon Erasure Coding

Ceph supports erasure-coded pools as an alternative to replication. Erasure coding stores data across `k` data chunks and `m` coding chunks, tolerating up to `m` simultaneous OSD failures [13].

| Profile | k | m | Total OSDs | Storage Overhead | Failure Tolerance |
|---------|---|---|-----------|-----------------|------------------|
| default | 2 | 2 | 4 | 2x | 2 OSD failures |
| efficient | 4 | 2 | 6 | 1.5x | 2 OSD failures |
| paranoid | 8 | 4 | 12 | 1.5x | 4 OSD failures |
| cold-storage | 10 | 4 | 14 | 1.4x | 4 OSD failures |

### Forensic Implications

Erasure-coded pools are significantly more complex to reconstruct than replicated pools:
- Each RADOS object is split into `k` data chunks plus `m` coding chunks
- Chunks are distributed across `k + m` different OSDs
- Reconstruction requires at least `k` of the `k + m` chunks
- The Reed-Solomon encoding parameters must be known to decode the chunks

If the erasure coding profile is lost with the MON data, it must be reconstructed from the chunk headers stored on each OSD. Ceph stores the EC profile in the pool metadata, which is part of the OSD map [14].

---

## 8. Stretch Cluster Architecture

### Multi-Datacenter Ceph

Ceph stretch clusters span multiple datacenters, providing geographic fault tolerance. CERN operates a stretch cluster spanning multiple datacenters for high-availability storage [15].

Requirements for stretch clusters:
- **Minimum 4 replicas** (2 per datacenter)
- **Tiebreaker MON** in a third location
- **Preferably flash storage** to reduce recovery time after failure
- **Low-latency inter-datacenter links** (Ceph recommends <10ms RTT)

### Forensic Complexity

Stretch clusters complicate forensic evidence isolation because:
1. A given RADOS object has authoritative copies on drives in two physically separate locations
2. Chain of custody must be maintained across two (or more) physical sites
3. The network path between datacenters is part of the evidence chain if data corruption is suspected
4. Tiebreaker MON location adds a third site to the forensic scope

```
STRETCH CLUSTER -- EVIDENCE TOPOLOGY
================================================================

  Datacenter A                    Datacenter B
  +----------+                    +----------+
  | OSD.0    | <--- Replicas ---> | OSD.6    |
  | OSD.1    |      (cross-DC)    | OSD.7    |
  | OSD.2    |                    | OSD.8    |
  | MON.a    |                    | MON.b    |
  +----------+                    +----------+
        \                           /
         \                         /
          \                       /
           +--- Tiebreaker DC ---+
           |      MON.c          |
           +---------------------+

  Forensic scope: ALL THREE sites must be preserved
  Evidence chain: Cross-DC replication logs are relevant
```

---

## 9. Forensic Challenges in Distributed Storage

### The Self-Healing Problem

Ceph's autonomous recovery behavior is the primary adversary in a forensic investigation. The system is designed to detect failures and repair them automatically, which means [16]:

1. **OSD failure triggers recovery:** Within minutes, Ceph begins re-replicating data from the failed OSD's PGs to other OSDs, writing new data to surviving drives
2. **Scrubbing detects inconsistencies:** Periodic scrubbing compares replica contents and "repairs" any differences by overwriting the minority version
3. **PG splitting/merging:** PG autoscaling can reorganize placement groups, moving data between OSDs

Each of these operations modifies data on surviving drives, destroying forensic evidence.

### No Standard Forensic Methodology

Unlike single-disk forensics (established toolchains, court precedent) or hardware RAID forensics (decade of professional practice), Ceph forensics has no standardized methodology. The Springer 2019 chapter by Zawoad and Hasan identifies this gap: "there is no existing forensic framework that can handle the distributed nature of Ceph's data placement" [17].

### Specific Challenges

| Challenge | Detail | Mitigation |
|-----------|--------|------------|
| Write contamination | Any cluster operation writes to OSD drives | Must isolate cluster before examination |
| Object fragmentation | Large objects split across multiple OSDs | CRUSH map required for reassembly |
| Metadata dependency | RocksDB on separate device from data | Must image both data and DB devices |
| Erasure coding | Objects split into k+m chunks across OSDs | EC profile required; k chunks minimum |
| Temporal ambiguity | Replication lag means replicas may differ | Primary OSD version is authoritative |
| Scale | Production clusters: thousands of OSDs | Manual imaging impractical; automation required |

---

## 10. CRUSH Map Reconstruction Procedure

### When Is Reconstruction Needed?

CRUSH map reconstruction is necessary when:
- All MON daemons are lost (catastrophic failure)
- MON persistent store is corrupted
- MON quorum cannot be restored
- CRUSH map must be verified against actual OSD data

### Reconstruction Steps

1. **Extract BlueStore labels from all surviving OSD devices:**
   - Read first 4KB of each device
   - Extract OSD UUID, FSID, and whoami
   - Build a table: OSD number -> device -> host -> rack

2. **Extract RocksDB metadata from each OSD DB partition:**
   - Identify PG-to-OSD mappings from the collection map
   - Cross-reference with other OSDs to identify the acting set for each PG

3. **Reconstruct the CRUSH hierarchy:**
   - From OSD-to-host mappings, build the host-level tree
   - From host-to-rack mappings (if documented), build the rack-level tree
   - From rack-to-datacenter mappings, build the datacenter-level tree

4. **Reconstruct CRUSH rules:**
   - Infer replication count from the number of OSD copies per PG
   - Infer failure domain from the distribution pattern (all replicas on different hosts = host failure domain)

5. **Validate with monmaptool and crushtool:**

```
# Reconstruct CRUSH map from OSD data
crushtool --build \
  --num-osds 18 \
  --type host \
  --type rack \
  --type datacenter \
  --type root \
  -o reconstructed-crush.bin

# Validate: simulate PG placement and compare to actual OSD data
crushtool -i reconstructed-crush.bin --test \
  --num-rep 3 \
  --rule 0 \
  --show-mappings
```

6. **Compare simulated placement to actual placement** found in OSD RocksDB data. If they match, the reconstruction is valid [18].

---

## 11. Forensic Imaging of a Live Ceph Cluster

### Recommended Procedure (No-Write)

> **BLOCK SAFETY:** This procedure must be executed without triggering any write operations on the cluster. Failure to follow these steps in order may contaminate evidence on surviving OSD drives [17].

1. **Isolate the cluster from client I/O:**
   - Set cluster to `noout` flag: `ceph osd set noout`
   - Set cluster to `norebalance` flag: `ceph osd set norebalance`
   - Set cluster to `noscrub` and `nodeep-scrub` flags
   - Block all client network access to MON and OSD ports

2. **Snapshot all RBD volumes and CephFS filesystems:**
   - `rbd snap create pool/image@forensic-snapshot`
   - `ceph fs snap create /path/to/snap`

3. **Export OSD device images at the block device level:**
   - Use dd/dcfldd at the raw block device level (e.g., `/dev/sda`), NOT through the Ceph layer
   - Image the main data device, WAL device, and DB device for each OSD separately
   - SHA-256 hash each image immediately after creation

4. **Extract BlueStore labels from each OSD image:**
   - Build the cluster topology table (OSD number, UUID, FSID, host)

5. **Reconstruct CRUSH map offline using crushtool:**
   - Never modify the live cluster's CRUSH map

6. **Mount images read-only for analysis:**
   - Use `ceph-objectstore-tool` on OSD images to list and extract objects
   - Cross-reference objects with CRUSH placement to verify completeness

### Evidence Documentation

For each OSD drive imaged, document:
- Physical location (datacenter, rack, host, bay number)
- Device serial number and model
- OSD number (from BlueStore label)
- Cluster FSID (from BlueStore label)
- Acquisition timestamp
- Examiner identity
- SHA-256 hash of the forensic image
- Any deviations from standard procedure

---

## 12. Cross-References

> **Related:** [Storage Array Architecture](02-storage-array-architecture.md) -- JBOD/HBA topology that Ceph OSDs use as backend. [Data Recovery Engineering](04-data-recovery-engineering.md) -- OSD UUID and CRUSH recovery procedures. [Digital Forensics & Legal Chain](05-digital-forensics-legal-chain.md) -- chain of custody for distributed storage evidence. [Storage Silicon Substrate](01-storage-silicon-substrate.md) -- HBA IT-mode that presents drives to Ceph.

**Cross-project links:**
- **K8S** (Kubernetes) -- Ceph CSI driver for persistent volumes
- **OCN** (Networking) -- Ceph messenger protocol and network architecture
- **SYS** (Systems Administration) -- Ceph cluster deployment and monitoring
- **CMH** (Computer Hardware) -- Ceph OSD hardware specifications

---

## 13. Sources

1. Ceph Foundation. "Architecture -- Ceph Documentation." docs.ceph.com/en/reef/architecture. Accessed March 2026.
2. IBM Redbooks. "IBM Storage Ceph Concepts and Architecture Guide." REDP-5721. June 2024.
3. Weil, S.A. et al. "RADOS: A Scalable, Reliable Storage Service for Petabyte-scale Storage Clusters." Proceedings of the 2nd International Workshop on Petascale Data Storage. ACM. 2007.
4. SNIA. "Ceph Q&A." snia.org/blog/2024/ceph-qa. 2024.
5. Weil, S.A. et al. "CRUSH: Controlled, Scalable, Decentralized Placement of Replicated Data." Proceedings of the ACM/IEEE Conference on Supercomputing. 2006.
6. Ceph Foundation. "Monitor Config Reference." docs.ceph.com/en/reef/rados/configuration/mon-config-ref. Accessed March 2026.
7. Ceph Foundation. "BlueStore." docs.ceph.com/en/reef/rados/configuration/bluestore-config-ref. Accessed March 2026.
8. Ceph Foundation. "BlueStore Internals." docs.ceph.com/en/reef/dev/bluestore-internals/. Accessed March 2026.
9. RocksDB. "RocksDB Overview." rocksdb.org. Accessed March 2026.
10. Ceph Foundation. "OSD Config Reference." docs.ceph.com/en/reef/rados/configuration/osd-config-ref. Accessed March 2026.
11. Ceph Foundation. "Monitor Paxos." docs.ceph.com/en/reef/dev/mon-bootstrap/. Accessed March 2026.
12. Ceph Foundation. "ceph-monstore-tool." docs.ceph.com/en/reef/man/8/ceph-monstore-tool/. Accessed March 2026.
13. Ceph Foundation. "Erasure Code." docs.ceph.com/en/reef/rados/operations/erasure-code/. Accessed March 2026.
14. Plank, J.S. "Erasure Codes for Storage Systems: A Brief Primer." USENIX ;login:. 2013.
15. CERN IT Storage Group. "Ceph at CERN in the Multi-Datacentre Era." EPJ Web of Conferences 337, 01331. CHEP 2024.
16. Parast, F.K. and Damghani, S.A. "Efficient security interface for high-performance Ceph storage systems." Future Generation Computer Systems. ScienceDirect. October 2024.
17. Zawoad, S. and Hasan, R. "Distributed Filesystem Forensics: Ceph as a Case Study." Handbook of Big Data and IoT Security. Springer. 2019.
18. Ceph Foundation. "crushtool -- CRUSH Map Manipulation Tool." docs.ceph.com/en/reef/man/8/crushtool/. Accessed March 2026.
