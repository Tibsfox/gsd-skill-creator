# Storage Array Architecture

> **Domain:** Enterprise Storage Infrastructure
> **Module:** 2 -- RAID, JBOD, and HBA Topologies
> **Through-line:** *A RAID array is a distributed contract: multiple drives agree on a geometry, a parity scheme, and a set of rules about who owns which stripe. When the contract breaks -- through controller failure, drive-order mismatch, or metadata divergence -- reconstruction depends on understanding every clause. The architecture IS the recovery plan.*

---

## Table of Contents

1. [The Array Architecture Problem](#1-the-array-architecture-problem)
2. [RAID Level Survey](#2-raid-level-survey)
3. [Stripe Geometry and Parity Distribution](#3-stripe-geometry-and-parity-distribution)
4. [MegaRAID Metadata Format and Locations](#4-megaraid-metadata-format-and-locations)
5. [Disk Data Format (DDF) Standard](#5-disk-data-format-ddf-standard)
6. [JBOD Enclosure Architecture](#6-jbod-enclosure-architecture)
7. [HBA Passthrough vs. RAID Mode](#7-hba-passthrough-vs-raid-mode)
8. [Write-Hole Vulnerability](#8-write-hole-vulnerability)
9. [RAID Reconstruction Without the Original Controller](#9-raid-reconstruction-without-the-original-controller)
10. [SAS Expander Topologies](#10-sas-expander-topologies)
11. [Array-Level Failure Modes](#11-array-level-failure-modes)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. The Array Architecture Problem

Storage arrays combine multiple physical drives into logical volumes that provide capacity aggregation, performance striping, fault tolerance, or combinations of all three. The array architecture defines how data is distributed across member drives and how that distribution can be reconstructed when the array is degraded or the controller is lost [1].

From a forensic perspective, the array layer sits between the silicon layer (individual drive controllers) and the distributed storage layer (Ceph, ZFS). An array failure may involve hardware (controller death, drive failure), metadata (superblock corruption, configuration mismatch), or operational error (wrong drive replaced, firmware mismatch during rebuild).

```
STORAGE ARRAY -- FORENSIC TOPOLOGY MAP
================================================================

  CONTROLLER
  +------------------+
  | MegaRAID 9600    |---> NVRAM (config copy #1)
  | or HBA 9600      |---> Cache (write-back volatile)
  +--------+---------+
           |
    SAS / NVMe / SATA Fabric
           |
  +--------+--------+--------+--------+--------+
  |        |        |        |        |        |
  Drive 0  Drive 1  Drive 2  Drive 3  Drive 4  Hot Spare
  (data)   (data)   (data)   (data)   (parity) (standby)
  [meta]   [meta]   [meta]   [meta]   [meta]   [meta]
  at end   at end   at end   at end   at end   at end

  [meta] = per-drive metadata copy (config copy #2..N)
  If controller NVRAM is lost, reconstruction uses per-drive [meta]
```

---

## 2. RAID Level Survey

### Standard RAID Levels

| Level | Min Drives | Fault Tolerance | Capacity | Recovery Complexity | Forensic Notes |
|-------|-----------|----------------|----------|-------------------|----------------|
| RAID 0 | 2 | None | N drives | Medium | Drive order critical; any single failure = total loss |
| RAID 1 | 2 | 1 drive | N/2 | Low | Mirror; verify both copies match before any action |
| RAID 5 | 3 | 1 drive | N-1 | High | Distributed parity; stripe size + drive order + rotation required |
| RAID 6 | 4 | 2 drives | N-2 | Very High | Dual parity (P+Q); Reed-Solomon based; two parity rotations |
| RAID 10 | 4 | 1 per mirror pair | N/2 | Medium | Mirrored stripes; identify mirror pairs first |
| RAID 50 | 6 | 1 per RAID 5 group | Varies | High | Striped RAID 5; identify group boundaries |
| RAID 60 | 8 | 2 per RAID 6 group | Varies | Very High | Striped RAID 6; highest enterprise resilience |
| RAID 5EE | 4 | 1 drive + hot spare | N-2 | High | Hot spare integrated into parity rotation |
| JBOD | 1+ | None | Sum of drives | Low | No controller metadata; passthrough mode |

### RAID 5: Distributed Parity

RAID 5 distributes parity blocks across all member drives in a rotating pattern. The parity rotation direction and pattern must be known for reconstruction [2].

```
RAID 5 -- LEFT-SYMMETRIC PARITY ROTATION (4 drives)
================================================================

  Stripe 0:  [D0a]  [D0b]  [D0c]  [P0]
  Stripe 1:  [D1a]  [D1b]  [P1]   [D1c]
  Stripe 2:  [D1a]  [P2]   [D2b]  [D2c]
  Stripe 3:  [P3]   [D3a]  [D3b]  [D3c]
  Stripe 4:  [D4a]  [D4b]  [D4c]  [P4]   <-- rotation repeats

  Parity P = XOR of all data blocks in the stripe
  Any one drive can be reconstructed from the remaining drives + parity
```

### RAID 6: Dual Distributed Parity

RAID 6 adds a second parity block (Q) per stripe, computed using a different algorithm (typically Reed-Solomon over GF(2^8)). This allows survival of any two simultaneous drive failures [3].

The dual-parity computation is:
- **P parity:** XOR of all data blocks (same as RAID 5)
- **Q parity:** Reed-Solomon syndrome calculated over all data blocks using generator polynomial coefficients

For reconstruction without the original controller, both the P and Q parity rotation patterns must be identified, doubling the parameter search space compared to RAID 5.

---

## 3. Stripe Geometry and Parity Distribution

### Stripe Size

The stripe size (also called chunk size or strip size) defines how much contiguous data is written to a single drive before the controller moves to the next drive. Common enterprise stripe sizes [4]:

| Stripe Size | Typical Use | Forensic Detection Method |
|------------|-------------|--------------------------|
| 64 KB | Sequential workloads (video, backup) | Entropy analysis at 64KB boundaries |
| 128 KB | General purpose | Most common default for MegaRAID |
| 256 KB | Database (large records) | Entropy analysis + block alignment |
| 512 KB | Streaming media | Large contiguous data blocks |
| 1 MB | High-throughput sequential | Obvious sector patterns |

### Parity Rotation Patterns

Four standard parity rotation patterns exist [2]:

1. **Left-symmetric:** Parity rotates left; data fills remaining positions in order (most common)
2. **Right-symmetric:** Parity rotates right; data fills remaining positions in order
3. **Left-asymmetric:** Parity rotates left; data continues from where previous stripe ended
4. **Right-asymmetric:** Parity rotates right; data continues from where previous stripe ended

The rotation pattern determines which physical sectors on which drives contain which logical blocks. Misidentifying the rotation pattern produces garbled data even if the stripe size and drive order are correct.

### Drive Order Identification

When a controller is lost and drives have been removed from an enclosure, the physical order of the drives in the array must be re-established. Methods [5]:

1. **Drive bay labels:** If the enclosure labels survived and drive positions were documented
2. **Metadata examination:** DDF or proprietary metadata on each drive contains the member sequence number
3. **Entropy analysis:** Compare entropy patterns across drives to identify stripe alignment
4. **Content analysis:** Look for file system structures (superblocks, directory entries) that span predictable stripe boundaries

---

## 4. MegaRAID Metadata Format and Locations

### Primary Metadata: Controller NVRAM

The MegaRAID controller stores its primary configuration in on-board NVRAM or flash memory. This includes:
- Virtual drive definitions (RAID level, stripe size, capacity)
- Physical drive membership and sequence numbers
- Cache policy settings
- BBU (Battery Backup Unit) status
- Patrol read and consistency check schedules

This copy is lost when the controller fails.

### Secondary Metadata: Per-Drive

Each member drive in a MegaRAID array stores a copy of the configuration metadata. The location depends on the configuration mode [6]:

| Mode | Location | Size | Format |
|------|----------|------|--------|
| Native (Broadcom proprietary) | Last 512 bytes of drive | 512 B | Broadcom proprietary |
| DDF mode | Anchor at LBA -1 or -257 | Variable | SNIA DDF 2.0 |
| Auto-detect | Either location | Variable | Check both |

### Metadata Fields

Critical metadata fields for reconstruction:

```
MEGARAID METADATA -- KEY RECONSTRUCTION FIELDS
================================================================

  VIRTUAL DRIVE RECORD:
    VD ID:           0x00
    RAID Level:      RAID 5
    Stripe Size:     128 KB
    Num Drives:      4
    Span Depth:      1
    Parity:          Left-Symmetric
    State:           Optimal / Degraded / Offline

  PHYSICAL DRIVE RECORD (per drive):
    PD ID:           0x00 / 0x01 / 0x02 / 0x03
    Enclosure:       252
    Slot:            0 / 1 / 2 / 3
    Sequence:        0 / 1 / 2 / 3    <-- CRITICAL for drive order
    Drive State:     Online / Rebuild / Failed

  CONFIGURATION RECORD:
    Config Size:     2048 bytes
    Checksum:        CRC-32
    Version:         MegaRAID x.xx
    Creation Date:   UNIX timestamp
```

---

## 5. Disk Data Format (DDF) Standard

The SNIA Disk Data Format (DDF) specification defines a vendor-neutral metadata schema for RAID arrays. DDF allows any DDF-compliant controller to recognize and import an array created by a different DDF-compliant controller [7].

### DDF Structure

| Component | Location | Purpose |
|-----------|----------|---------|
| DDF Anchor | LBA -1 (last sector) | Points to DDF header location |
| DDF Header | Near end of drive | Version, GUID, creation date |
| Controller Data | Following header | Controller-specific configuration |
| Physical Disk Records | Following controller data | Drive serial numbers, states |
| Virtual Disk Records | Following PD records | RAID level, stripe size, member list |
| Configuration Record | Following VD records | Active vs. staged configurations |

### DDF vs. Proprietary Metadata

Many MegaRAID controllers support both DDF and proprietary metadata formats. The format in use depends on controller firmware version and configuration. For forensic reconstruction [8]:

1. Check for DDF anchor at LBA -1 first (standardized location)
2. If no DDF anchor, check last 512 bytes for Broadcom proprietary format
3. If neither found, the drive may have been in IT-mode (no controller metadata)

---

## 6. JBOD Enclosure Architecture

### JBOD Topology

A JBOD (Just a Bunch of Disks) enclosure provides physical housing, power, cooling, and SAS connectivity for multiple drives without imposing any RAID logic. The enclosure management processor communicates via SES-3 (SCSI Enclosure Services) [9].

```
JBOD ENCLOSURE -- TYPICAL 60-BAY ARCHITECTURE
================================================================

  HOST HBA (IT-mode)
       |
       v
  SAS Expander (NXP / Broadcom)
       |
  +----+----+----+----+----+
  | Bay 0   | Bay 1   | Bay 2   | ... | Bay 59  |
  | SAS/NVMe| SAS/NVMe| SAS/NVMe| ... | SAS/NVMe|
  +----+----+----+----+----+----+-----+---------+
       |
       v
  SES-3 Processor
  (temperature, fans, power, LED status)
```

### Bay Addressing

Each drive bay in a JBOD enclosure is identified by:
- **Enclosure logical ID:** SAS WWN (World Wide Name) of the enclosure expander
- **Slot number:** Physical bay position (0-indexed)
- **SAS address:** The drive's own SAS WWN

When drives are removed from an enclosure for forensic imaging, the bay-to-drive mapping must be documented. If the mapping is lost, Ceph OSD UUIDs (stored on each drive's BlueStore label) can be used to reconstruct the topology [10].

---

## 7. HBA Passthrough vs. RAID Mode

### Comparison

| Feature | MegaRAID Mode | IT-Mode (HBA) |
|---------|--------------|---------------|
| RAID logic | Controller-managed | None (OS/software manages) |
| Drive presentation | Virtual drives | Individual physical drives |
| Metadata on drives | Yes (DDF/proprietary) | No controller metadata |
| Write cache | Hardware cache + BBU | OS page cache only |
| Ceph compatibility | Not recommended | Recommended (BlueStore direct) |
| Forensic complexity | Must decode RAID metadata | Simpler imaging, Ceph-layer reconstruction |

### IT-Mode for Ceph OSD Deployments

In IT-mode, the HBA 9600 presents each physical drive directly to the operating system. Ceph's BlueStore then manages data placement entirely in software, writing its own metadata (OSD UUID, FSID, CRUSH weight) directly to the drives [11].

For forensic purposes, IT-mode deployments shift the reconstruction burden from the array layer to the distributed storage layer. There is no RAID metadata to decode, but the Ceph CRUSH map must be reconstructed to understand which RADOS objects live on which physical drives.

> **EVIDENCE NOTE:** When imaging drives from an IT-mode JBOD enclosure, each drive is a complete, independent unit. The BlueStore label at offset 0 of each drive contains the OSD UUID and cluster FSID -- the two identifiers needed to associate the drive with its Ceph cluster [10].

---

## 8. Write-Hole Vulnerability

### The RAID 5/6 Write Hole

The write-hole is a well-known vulnerability in RAID 5 and RAID 6 arrays. During a stripe write, the controller must update both the data block(s) and the corresponding parity block. If power is lost between the data write and the parity write, the parity block becomes inconsistent with the data [12].

```
WRITE-HOLE -- FAILURE SCENARIO
================================================================

  BEFORE WRITE:
    Drive 0: [old data A]    Parity = old A XOR old B XOR old C
    Drive 1: [old data B]
    Drive 2: [old data C]
    Drive 3: [old parity P]

  DURING WRITE (power loss after data, before parity):
    Drive 0: [NEW data A']   Parity = STILL old A XOR old B XOR old C
    Drive 1: [old data B]              (NOT updated!)
    Drive 2: [old data C]
    Drive 3: [old parity P]  <-- INCONSISTENT

  AFTER POWER RESTORE:
    If Drive 1 fails, controller rebuilds from remaining drives + parity:
    Rebuilt Drive 1 = new A' XOR old C XOR old P
                    = WRONG (contains mix of old and new data)
```

### Mitigations

| Mitigation | Mechanism | Forensic Relevance |
|-----------|-----------|-------------------|
| BBU (Battery Backup) | Maintains controller cache during power loss | Cache contents may contain un-flushed writes |
| Journal/WAL | Write-ahead log on separate device | Journal contents are forensic evidence |
| RAID controller cache flush | Controller completes pending writes from cache | May have written partial data |
| ZFS / Ceph copy-on-write | Never overwrites in place; writes new blocks | Eliminates write-hole by design |

---

## 9. RAID Reconstruction Without the Original Controller

### Manual Reconstruction Workflow

When the original RAID controller is unavailable (dead, incompatible replacement, or firmware mismatch), manual reconstruction follows this sequence [13]:

1. **Image all member drives individually** (write-blocked, SHA-256 verified)
2. **Extract metadata** from each drive image (DDF anchor or proprietary region)
3. **Identify RAID parameters:**
   - RAID level
   - Number of member drives
   - Stripe size
   - Parity rotation pattern
   - Drive sequence numbers
   - Starting data offset
4. **Virtual assembly** using software tools (R-Studio, UFS Explorer, DiskInternals RAID Recovery)
5. **Validate** by checking known file structures (file system superblock, partition table, known file headers)
6. **Export** the reconstructed logical volume as a forensic image

### Parameter Identification Without Metadata

If per-drive metadata is missing or corrupted, parameters must be determined through analysis [14]:

- **Stripe size:** Entropy analysis -- plot entropy per sector and look for periodic boundaries
- **Drive order:** Cross-correlate sector content across drives to find stripe alignment
- **Parity location:** Identify which sectors contain XOR results (higher entropy than data blocks)
- **Parity rotation:** Observe how parity position shifts across consecutive stripes
- **Starting offset:** Scan for partition table or file system superblock signatures at stripe-aligned offsets

---

## 10. SAS Expander Topologies

### Single-Domain vs. Multi-Domain

SAS expanders support two topologies [15]:

**Single-domain:** All drives behind one expander form a single SAS domain. The HBA sees all drives through the expander's routing table.

**Multi-domain (cascaded):** Multiple expanders connected in a tree. Each expander maintains its own routing table. A failure in a mid-tier expander isolates all downstream drives.

```
CASCADED SAS EXPANDER TOPOLOGY
================================================================

  HBA 9600
     |
  Expander A (root)
     |
  +--+--+--+--+
  |  |  |  |  |
  D0 D1 D2 D3 |
               |
          Expander B (leaf)
               |
           +---+---+---+
           |   |   |   |
           D4  D5  D6  D7

  If Expander B fails:
    D0-D3 remain accessible
    D4-D7 are isolated (must be physically removed and re-connected)
```

### Zoning

SAS zoning allows an administrator to restrict which initiators (HBAs) can access which targets (drives). Zoning configuration is stored in the expander's NVRAM. If the expander fails and zoning was enabled, the zoning configuration must be reconstructed (or cleared) on the replacement expander to restore drive access [16].

---

## 11. Array-Level Failure Modes

### Failure Mode Table

| Failure Mode | Layer | Severity | Recovery Path |
|-------------|-------|----------|---------------|
| Single drive failure (RAID 5) | Array | Degraded | Replace + rebuild (standard) |
| Double drive failure (RAID 5) | Array | Catastrophic | Image all surviving drives; parity reconstruction partial |
| Controller NVRAM loss | Array | High | Reconstruct from per-drive metadata |
| Drive-order mismatch | Array | High | Entropy analysis + metadata sequence numbers |
| RAID rebuild fault | Array | Very High | Image before rebuild attempt; virtual rebuild |
| Firmware mismatch (replacement controller) | Array | Medium | Match firmware version or use DDF import |
| Write-hole corruption | Array | Medium | Journal recovery if available; parity validation |
| Stripe size mismatch (mis-configuration) | Array | High | Entropy analysis to determine actual stripe size |
| JBOD expander failure | Enclosure | Medium | Remove drives; direct-attach to HBA |
| BBU failure during power loss | Array | High | Cache contents lost; write-hole risk realized |

> **SAFETY WARNING:** Never attempt a RAID rebuild on a forensic target. A rebuild writes new parity data to the surviving drives, destroying the forensic state. Always image all member drives individually before any rebuild attempt [17].

---

## 12. Cross-References

> **Related:** [Storage Silicon Substrate](01-storage-silicon-substrate.md) -- controller families that manage these array architectures. [Ceph Distributed Storage](03-ceph-distributed-storage.md) -- how Ceph uses JBOD/HBA for OSD placement. [Data Recovery Engineering](04-data-recovery-engineering.md) -- RAID superblock reconstruction procedures. [Digital Forensics & Legal Chain](05-digital-forensics-legal-chain.md) -- imaging procedures for array member drives.

**Cross-project links:**
- **SYS** (Systems Administration) -- RAID provisioning and monitoring
- **SAN** (Storage Area Networks) -- SAS fabric and zoning
- **K8S** (Kubernetes) -- persistent volume claims on Ceph-backed RAID
- **OCN** (Networking) -- SAS/NVMe fabric protocols

---

## 13. Sources

1. Broadcom Inc. "RAID Controllers Product Page." broadcom.com/products/storage/raid-controllers. Accessed March 2026.
2. Patterson, D., Gibson, G., and Katz, R. "A Case for Redundant Arrays of Inexpensive Disks (RAID)." ACM SIGMOD. 1988.
3. Plank, J.S. "A Tutorial on Reed-Solomon Coding for Fault-Tolerance in RAID-like Systems." University of Tennessee. 2013.
4. Broadcom Inc. "MegaRAID SAS-4 Configuration Guide." broadcom.com. 2024.
5. DiskInternals. "RAID Recovery: Drive Order Identification." diskinternals.com. 2025.
6. Broadcom Inc. "MegaRAID, 3ware, and HBA Support for Various RAID Levels and JBOD Mode." Knowledge Base Article 1211161496893. November 2025.
7. SNIA. "Disk Data Format (DDF) Specification, Version 2.0." snia.org. 2009.
8. Broadcom Inc. "StorCLI Reference Guide." broadcom.com. 2024.
9. INCITS. "SCSI Enclosure Services - 3 (SES-3)." T10 Technical Committee. 2018.
10. Ceph Foundation. "BlueStore Internals." docs.ceph.com/en/reef/dev/bluestore-internals/. Accessed March 2026.
11. Broadcom Inc. "HBA 9600 Tri-Mode Configuration Guide." broadcom.com. 2024.
12. Keeton, K. and Wilkes, J. "The RAID Write Hole." Hewlett-Packard Laboratories. 2006.
13. R-Studio. "RAID Reconstruction from Individual Drive Images." r-studio.com. 2025.
14. UFS Explorer. "RAID Parameter Detection Guide." ufsexplorer.com. 2025.
15. INCITS. "Serial Attached SCSI - 4 (SAS-4)." T10 Technical Committee. 2017.
16. Broadcom Inc. "SAS Expander Zoning Configuration Guide." broadcom.com. 2023.
17. SWGDE. "Best Practices for Digital Evidence Collection." swgde.org. 2024.
