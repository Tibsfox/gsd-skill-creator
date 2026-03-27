# Digital Forensics & Legal Chain

> **Domain:** Digital Forensics Methodology
> **Module:** 5 -- Evidence Standards, Chain of Custody, and Court Admissibility
> **Through-line:** *The difference between recovered data and admissible evidence is documentation. Every bit recovered, every image created, every hash computed must be traceable to a specific examiner, at a specific time, using a specific tool, following a specific procedure. The chain of custody is the forensic engineer's most important product -- without it, the data is just data.*

---

## Table of Contents

1. [The Forensics Methodology Problem](#1-the-forensics-methodology-problem)
2. [The Four-Phase Framework](#2-the-four-phase-framework)
3. [Write-Blocking Hardware and Procedures](#3-write-blocking-hardware-and-procedures)
4. [Forensic Imaging Standards](#4-forensic-imaging-standards)
5. [Hash Verification and Integrity](#5-hash-verification-and-integrity)
6. [Chain of Custody Documentation](#6-chain-of-custody-documentation)
7. [NIST SP 800-86 Compliance](#7-nist-sp-800-86-compliance)
8. [Ceph-Specific Forensic Procedures](#8-ceph-specific-forensic-procedures)
9. [Cloud and Distributed Forensics](#9-cloud-and-distributed-forensics)
10. [Court-Admissible Reporting Standards](#10-court-admissible-reporting-standards)
11. [Anti-Forensics Detection](#11-anti-forensics-detection)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. The Forensics Methodology Problem

Digital forensics transforms raw data into legal evidence. The transformation requires a methodology that satisfies two audiences simultaneously: the technical audience (engineers, system administrators, incident responders) who need accurate data, and the legal audience (attorneys, judges, juries) who need demonstrably trustworthy evidence [1].

The enterprise storage context adds complexity beyond single-disk forensics. A single investigation may span:
- Multiple individual drives (RAID member drives)
- Multiple storage controllers (failed and replacement)
- Multiple hosts in a distributed system (Ceph cluster nodes)
- Multiple physical locations (stretch cluster datacenters)
- Multiple jurisdictions (if datacenters are in different countries)

```
FORENSIC METHODOLOGY -- EVIDENCE LIFECYCLE
================================================================

  INCIDENT
    |
    v
  COLLECTION                              LEGAL REQUIREMENTS
  +-- Identify evidence sources            +-- Preserve original state
  +-- Apply write-blocking                 +-- Document chain of custody
  +-- Create forensic images               +-- Hash verification at each step
  +-- Transport/store securely             +-- Maintain evidence integrity
    |
    v
  EXAMINATION
  +-- Mount images read-only
  +-- Catalog contents (file systems, objects)
  +-- Extract relevant artifacts
  +-- Timeline reconstruction
    |
    v
  ANALYSIS
  +-- Correlate findings across sources
  +-- Reconstruct event sequences
  +-- Identify root cause
  +-- Assess data impact
    |
    v
  REPORTING
  +-- Technical report (detailed findings)
  +-- Executive summary (impact + recommendations)
  +-- Court-admissible report (if litigation)
  +-- Expert witness preparation (if testimony)
```

---

## 2. The Four-Phase Framework

NIST SP 800-86 defines four phases of digital forensics [2]:

### Phase 1: Collection

Collection involves identifying potential sources of evidence and acquiring data while preserving its integrity. For enterprise storage, collection scope includes:

| Evidence Source | Collection Method | Priority |
|----------------|-------------------|----------|
| Individual drives (SATA/SAS/NVMe) | Write-blocked imaging | P1 |
| RAID controller NVRAM | If controller is functional: StorCLI export | P1 |
| RAID metadata (per-drive) | Included in drive images | Auto |
| Ceph MON persistent store | Block-level image of MON data directory | P1 |
| Ceph OSD devices (data + WAL + DB) | Write-blocked imaging of all partitions | P1 |
| Network logs (if distributed) | Log export from switches/routers | P2 |
| SMART/health data | Extracted before imaging via non-write commands | P1 |
| Controller firmware state | PC-3000 diagnostic capture | P2 |
| SES-3 enclosure logs | SES page extraction via sg_ses | P2 |
| Temperature/power logs (BMC/IPMI) | BMC log export | P3 |

### Phase 2: Examination

Examination involves processing the collected data to extract relevant information. Tools and techniques:

- **File system parsing:** Mount forensic images read-only; extract directory structures, file metadata
- **Object enumeration:** For Ceph images, use `ceph-objectstore-tool` to list RADOS objects
- **Deleted file recovery:** File carving for known file signatures (JPEG, PDF, DOCX headers)
- **Metadata extraction:** File system journals, NTFS MFT entries, ext4 journal entries
- **Timeline construction:** Correlate modification timestamps across all evidence sources

### Phase 3: Analysis

Analysis involves correlating findings to answer the investigation's specific questions:

- **Causation:** What caused the storage failure?
- **Timeline:** When did the failure begin, progress, and complete?
- **Impact:** What data was affected, lost, or compromised?
- **Attribution:** Was the failure accidental, negligent, or deliberate?
- **Recovery:** What data can be recovered, and with what confidence?

### Phase 4: Reporting

Reporting documents findings in a format appropriate to the audience. Three report types are standard:

1. **Technical report:** Full methodology, tools, findings, and evidence inventory
2. **Executive summary:** Business impact, recommendations, and timeline
3. **Expert report:** Court-formatted document with examiner qualifications, methodology, and opinions

---

## 3. Write-Blocking Hardware and Procedures

### Write-Blocker Types

Write-blockers prevent any write commands from reaching the evidence drive. They are the single most critical forensic tool [3].

| Write-Blocker | Interface | Mechanism | Court-Tested |
|--------------|-----------|-----------|-------------|
| Tableau T35689iu | SATA/SAS/USB | Hardware interposition | Yes |
| WiebeTech Forensic UltraDock | SATA/SAS | Hardware bridge | Yes |
| Logicube Forensic Falcon NEO | SATA/SAS/NVMe | Hardware + imaging | Yes |
| FRED (Forensic Recovery of Evidence Device) | Multi-interface | Integrated workstation | Yes |
| Linux HDPARM read-only | SATA (software) | ATA command filtering | Limited |
| Custom PCIe interposer | NVMe (hardware) | PCIe lane interposition | Emerging |

### NVMe Write-Blocking Challenge

NVMe drives present a unique write-blocking challenge because the NVMe command set includes commands that are destructive but do not use the traditional write path [4]:

> **BLOCK SAFETY (SC-01):** NVMe write-blockers must intercept ALL of the following commands, not just write I/O:
> - Write commands (NVM Write, Write Uncorrectable, Write Zeroes)
> - Sanitize command (Block Erase, Crypto Erase, Overwrite)
> - Format NVM command (deletes all namespace data)
> - Firmware Commit (may alter controller behavior)
> - Dataset Management (TRIM/Deallocate -- marks blocks as unused)

### Write-Blocker Verification

Before each investigation, verify write-blocker function:
1. Connect a known test drive through the write-blocker
2. Attempt write operations (create file, delete file, format)
3. Verify all write attempts are blocked
4. Hash the test drive before and after -- hashes must match
5. Document verification in the case notes

---

## 4. Forensic Imaging Standards

### Imaging Tools

| Tool | Output Format | Hash Support | Notes |
|------|--------------|-------------|-------|
| FTK Imager | E01, AFF, dd | MD5, SHA-1, SHA-256 | Most widely used; GUI-based |
| Guymager | E01, AFF, dd | MD5, SHA-256, SHA-512 | Linux-native; multi-threaded |
| dc3dd | dd (raw) | MD5, SHA-256, SHA-512 | DoD-developed; command-line |
| ddrescue | dd (raw) | External hash | Optimized for failing drives |
| Tableau Imager | E01, dd | MD5, SHA-256 | Integrated with Tableau hardware |
| Paladin | dd, E01 | MD5, SHA-256 | Boot from USB; Linux-based |

### Imaging Procedure

```
FORENSIC IMAGING -- STANDARD OPERATING PROCEDURE
================================================================

  PRE-IMAGING
  1. Document the evidence item (photographs, serial numbers, condition)
  2. Apply write-blocker
  3. Verify write-blocker function
  4. Record destination media (serial number, capacity, pre-formatted)

  IMAGING
  5. Start imaging tool (e.g., FTK Imager, Guymager)
  6. Select source: write-blocked evidence drive
  7. Select destination: sanitized destination media
  8. Select format: E01 (compressed, segmented) or dd (raw)
  9. Enable hash calculation: SHA-256 minimum; SHA-512 recommended
  10. Start acquisition
  11. Monitor for errors (bad sectors, timeouts)

  POST-IMAGING
  12. Verify hash: compare source hash to image hash
  13. If hashes match: imaging is verified
  14. If hashes do not match: investigate (bad sectors logged?)
  15. Create second copy (backup image)
  16. Hash the backup copy -- must match
  17. Store original evidence and images separately
  18. Update chain of custody documentation
```

### E01 (Expert Witness Format)

The E01 format (EnCase Evidence File) is the most widely used forensic image format in court. Features:
- **Compression:** Reduces image size (lossless)
- **Segmentation:** Splits image into manageable file sizes
- **Embedded hash:** SHA-256 hash stored within the image header
- **Case metadata:** Examiner name, case number, acquisition date embedded
- **Error logging:** Bad sector locations recorded within the image

---

## 5. Hash Verification and Integrity

### Hash Algorithms

> **BLOCK SAFETY (SC-02):** Every forensic image must be verified with SHA-256 at minimum. MD5 alone is insufficient for court-admissible work due to known collision vulnerabilities [5].

| Algorithm | Output Size | Status | Court Acceptance |
|-----------|-----------|--------|-----------------|
| MD5 | 128-bit | Deprecated for forensics | Legacy cases only |
| SHA-1 | 160-bit | Deprecated (collision found 2017) | Limited |
| SHA-256 | 256-bit | Current standard | Widely accepted |
| SHA-512 | 512-bit | Best practice | Preferred |
| SHA-3 | Configurable | Emerging | Accepted where supported |

### Hash Chain

Every forensic action that transforms data must be accompanied by hash verification at both ends:

```
HASH CHAIN -- EVIDENCE INTEGRITY VERIFICATION
================================================================

  Original evidence drive
  +-- SHA-256: a1b2c3d4...  (pre-imaging hash)
      |
      v
  Forensic image (E01)
  +-- SHA-256: a1b2c3d4...  (must match pre-imaging hash)
  +-- Embedded hash verified by imaging tool
      |
      v
  Working copy (mounted read-only)
  +-- SHA-256: a1b2c3d4...  (verified before analysis begins)
      |
      v
  Any extracted artifacts
  +-- SHA-256 of each extracted file/object
  +-- Documented in analysis report

  BREAK IN CHAIN = hash mismatch at any step
  Action: STOP. Document the mismatch. Do not proceed.
  Mismatch is itself evidence (indicates modification).
```

---

## 6. Chain of Custody Documentation

### Purpose

Chain of custody documentation proves that evidence has been handled properly from collection to court presentation. Every transfer of custody, every action performed on the evidence, and every person who accessed it must be recorded [6].

### Chain of Custody Template

```
CHAIN OF CUSTODY -- ENTERPRISE STORAGE EVIDENCE
================================================================

  CASE INFORMATION
  Case Number:     ___________________________________
  Case Title:      ___________________________________
  Investigating Agency: ______________________________

  EVIDENCE ITEM
  Item Number:     ___________________________________
  Description:     ___________________________________
  Make/Model:      ___________________________________
  Serial Number:   ___________________________________
  Capacity:        ___________________________________
  Interface:       [ ] SATA  [ ] SAS  [ ] NVMe  [ ] Other: ____
  Condition:       [ ] Functional  [ ] Damaged  [ ] Unknown

  ACQUISITION
  Date/Time Acquired:  ___________________________________
  Acquired By:         ___________________________________
  Location Acquired:   ___________________________________
  Write-Blocker Used:  ___________________________________
  Imaging Tool:        ___________________________________
  Image Format:        ___________________________________
  Image Hash (SHA-256): __________________________________
  Image Hash (SHA-512): __________________________________
  Hash Verified:       [ ] Yes  [ ] No  [ ] N/A
  Notes:               ___________________________________

  CUSTODY TRANSFERS
  +--------+----------+----------+----------+----------+
  | Date   | Time     | From     | To       | Purpose  |
  +--------+----------+----------+----------+----------+
  |        |          |          |          |          |
  +--------+----------+----------+----------+----------+

  EXAMINER CERTIFICATION
  I certify that the above information is accurate and that
  the evidence was handled in accordance with established
  forensic procedures.

  Examiner Name:     ___________________________________
  Examiner Title:    ___________________________________
  Examiner Signature: __________________________________
  Date:              ___________________________________
```

> **BLOCK SAFETY (SC-06):** The chain of custody template must include cryptographic hash fields (SHA-256 minimum). A template without hash fields is forensically incomplete and must not be used for court-admissible evidence.

---

## 7. NIST SP 800-86 Compliance

### Overview

NIST Special Publication 800-86, "Guide to Integrating Forensic Techniques into Incident Response," provides the authoritative US federal guidance for digital forensics [2].

### Key Requirements

| Section | Requirement | Enterprise Storage Application |
|---------|------------|-------------------------------|
| 3.1 | Forensic readiness | Pre-incident planning for RAID, Ceph forensic procedures |
| 3.2 | Data collection | Write-blocked imaging of all evidence sources |
| 3.3 | Examination | Read-only mounting; no modification to evidence |
| 3.4 | Analysis | Documented correlation across sources |
| 4.1 | Files and operating systems | File system parsing of individual drive images |
| 4.2 | Data file forensics | Artifact extraction from RADOS objects |
| 4.3 | Network forensics | Ceph messenger protocol traffic analysis |
| 5.1 | Tool validation | Write-blocker verification; imaging tool validation |
| 5.2 | Documentation | Full methodology documentation in report |

### Complementary Standards

| Standard | Scope | Relationship to SP 800-86 |
|----------|-------|--------------------------|
| ISO/IEC 27037 | International evidence identification and preservation | Broader scope; compatible with SP 800-86 |
| SWGDE Best Practices | Scientific working group evidence handling | More prescriptive; US law enforcement focus |
| SSAE18 Type II | Annual forensic lab audit | Certifies lab follows documented procedures |
| ISO/IEC 17025 | Forensic lab accreditation | International lab competence standard |

---

## 8. Ceph-Specific Forensic Procedures

### The Distributed Evidence Problem

Ceph forensics differs fundamentally from single-disk or RAID forensics because the data is distributed across many drives with autonomous self-healing behavior. The standard forensic assumption ("preserve the original state") conflicts with Ceph's design ("automatically repair degraded state") [7].

### Cluster Isolation Procedure

Before any forensic examination of a Ceph cluster:

```
CEPH FORENSIC ISOLATION -- MANDATORY STEPS
================================================================

  1. BLOCK CLIENT ACCESS
     - Firewall MON ports (6789, 3300) from all clients
     - Firewall OSD ports (6800-7300) from all clients
     - Do NOT stop the daemons (map state must be preserved)

  2. DISABLE AUTOMATIC OPERATIONS
     ceph osd set noout        # Prevent OSD out-marking
     ceph osd set norebalance  # Prevent PG migration
     ceph osd set noscrub      # Prevent data scrubbing
     ceph osd set nodeep-scrub # Prevent deep scrubbing
     ceph osd set norecover    # Prevent recovery operations
     ceph osd set nobackfill   # Prevent backfill operations

  3. VERIFY ISOLATION
     ceph health detail        # Should show HEALTH_WARN with
                               # flags set, but no active operations
     ceph pg stat              # Verify no PGs in recovery state

  4. DOCUMENT CLUSTER STATE
     ceph status > cluster_status.txt
     ceph osd tree > osd_tree.txt
     ceph osd dump > osd_dump.txt
     ceph osd getcrushmap -o crushmap.bin
     ceph pg dump > pg_dump.txt

  5. NOW proceed with OSD device imaging
```

> **BLOCK SAFETY (SC-05):** Any Ceph forensic procedure that does not specify maintenance mode or equivalent cluster isolation BEFORE accessing OSD data is a BLOCK violation. Accessing OSD data on a live, unprotected cluster may trigger recovery operations that modify evidence on surviving drives [7].

### RADOS Object Enumeration

After imaging OSD devices, enumerate RADOS objects without modifying the cluster:

```
# Mount OSD image read-only
# Use ceph-objectstore-tool to list objects
ceph-objectstore-tool --data-path /mnt/osd-image \
  --type bluestore --op list

# Extract a specific object
ceph-objectstore-tool --data-path /mnt/osd-image \
  --type bluestore --op get --pgid 3.1a7 \
  --oid rbd_data.12345.00000001 \
  --file /output/object_data
```

---

## 9. Cloud and Distributed Forensics

### Cloud Storage Forensics Challenges

When enterprise storage extends to cloud or hybrid environments, additional challenges arise:

| Challenge | Detail | Mitigation |
|-----------|--------|------------|
| No physical access | Cloud provider owns the hardware | Rely on API-level snapshots and exports |
| Multi-tenancy | Evidence may be on shared infrastructure | Cloud provider must isolate tenant data |
| Jurisdiction | Data may be stored in foreign jurisdictions | Legal coordination required pre-incident |
| Ephemeral state | Cloud instances may be destroyed automatically | Preserve snapshots before termination |
| API-only access | Cannot image raw block devices | Use cloud-native snapshot/export tools |

### Hybrid Forensics

For Ceph clusters with cloud-based MON or OSD nodes:
1. Cloud-side evidence must be collected via cloud provider's forensic tooling
2. On-premises evidence follows standard procedures
3. The CRUSH map is the authoritative document linking cloud and on-prem evidence
4. Timestamps must be synchronized (NTP verification) across all locations

---

## 10. Court-Admissible Reporting Standards

### Report Structure

A court-admissible forensic report includes [8]:

1. **Examiner qualifications:** Education, certifications, experience, prior testimony
2. **Case background:** Description of the incident and examination scope
3. **Methodology:** Step-by-step description of every action taken
4. **Tools used:** Name, version, and validation status of each tool
5. **Findings:** Factual observations from the examination
6. **Analysis:** Interpretation of findings (clearly distinguished from observations)
7. **Opinions:** Expert opinions (clearly labeled as opinions, with basis stated)
8. **Evidence inventory:** Complete list of all evidence items handled
9. **Chain of custody:** Full custody documentation for each evidence item
10. **Appendices:** Hash values, tool output logs, screenshots

### Daubert Standard

In US federal courts, expert testimony (including forensic reports) is evaluated under the Daubert standard [9]:

| Factor | Application to Storage Forensics |
|--------|--------------------------------|
| Testable methodology | Imaging + hashing procedure is empirically verifiable |
| Peer review | NIST SP 800-86 and SWGDE are peer-reviewed |
| Known error rate | Hash collision probability is calculable (SHA-256: 1/2^256) |
| General acceptance | Write-blocking + imaging is universally accepted in forensics |

---

## 11. Anti-Forensics Detection

### Indicators of Tampering

Storage forensic examiners must assess whether evidence has been deliberately modified or destroyed [10]:

| Indicator | Detection Method | Significance |
|-----------|-----------------|-------------|
| Recent Sanitize command in NVMe log | NVMe Get Log Page (Error Information) | Deliberate data destruction |
| SMART self-test during incident window | SMART log page 7 | Possible evidence destruction attempt |
| Timestamp anomalies in file metadata | Timeline analysis across drives | Possible clock manipulation |
| Uniform entropy across entire drive | Entropy analysis (H near 0 or near 1) | Secure erase or crypto erase |
| TCG Opal locking range changes | TCG Opal discovery | Possible encryption key rotation |
| Firmware downgrade in update log | Firmware version vs. expected | Possible firmware-level manipulation |
| CRUSH map modification epoch spike | Ceph OSD map epoch analysis | Possible data redistribution |
| Unusual PG migration patterns | PG log analysis | Possible deliberate data movement |

### Forensic Significance of Destruction Evidence

Evidence of deliberate destruction is itself forensically significant:
- In civil litigation, destruction of evidence can trigger adverse inference instructions (the court instructs the jury to presume the destroyed evidence was unfavorable to the party who destroyed it)
- In criminal proceedings, destruction of evidence may constitute obstruction of justice
- Documenting the evidence of destruction (sanitize logs, timestamp anomalies, encryption changes) is as important as recovering the underlying data

---

## 12. Cross-References

> **Related:** [Data Recovery Engineering](04-data-recovery-engineering.md) -- recovery procedures that must be documented for chain of custody. [Storage Array Architecture](02-storage-array-architecture.md) -- RAID metadata locations critical for evidence identification. [Ceph Distributed Storage](03-ceph-distributed-storage.md) -- cluster isolation procedures for Ceph forensics. [Optical Imaging & VLSI Inspection](06-optical-imaging-vlsi-inspection.md) -- physical evidence documentation standards. [Storage Silicon Substrate](01-storage-silicon-substrate.md) -- controller-specific write-blocking requirements.

**Cross-project links:**
- **ACE** (Ace Tools) -- professional forensic tool configurations
- **VAV** (Verification & Validation) -- evidence verification methodology
- **SYS** (Systems Administration) -- incident response integration

---

## 13. Sources

1. SWGDE. "Best Practices for Computer Forensics." Scientific Working Group on Digital Evidence. swgde.org. 2024.
2. NIST. SP 800-86: "Guide to Integrating Forensic Techniques into Incident Response." csrc.nist.gov. 2006 (revised 2014).
3. Carrier, B. "File System Forensic Analysis." Addison-Wesley. 2005.
4. NVM Express. "NVM Express Base Specification, Revision 2.0." nvmexpress.org. 2021.
5. Wang, X. and Yu, H. "How to Break MD5 and Other Hash Functions." Advances in Cryptology -- EUROCRYPT 2005. Springer. 2005.
6. ISO/IEC 27037:2012. "Information technology -- Security techniques -- Guidelines for identification, collection, acquisition and preservation of digital evidence."
7. Zawoad, S. and Hasan, R. "Distributed Filesystem Forensics: Ceph as a Case Study." Handbook of Big Data and IoT Security. Springer. 2019.
8. Casey, E. "Digital Evidence and Computer Crime." Academic Press. 3rd Edition. 2011.
9. Daubert v. Merrell Dow Pharmaceuticals, Inc. 509 U.S. 579. 1993.
10. Garfinkel, S. "Anti-Forensics: Techniques, Detection and Countermeasures." 2nd International Conference on i-Warfare and Security. 2007.
11. NIST. "CFTT (Computer Forensic Tool Testing) Project." cftt.nist.gov. Ongoing.
12. Ceph Foundation. "Operations -- Ceph Documentation." docs.ceph.com/en/reef/rados/operations/. Accessed March 2026.
13. SSAE18. "Statement on Standards for Attestation Engagements No. 18." AICPA. 2017.
14. ISO/IEC 17025:2017. "General requirements for the competence of testing and calibration laboratories."
15. Federal Rules of Evidence. Rule 702 (Expert Testimony). United States Courts.
