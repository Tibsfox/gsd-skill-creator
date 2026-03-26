# High-Speed Network Standards

> **Domain:** Network Engineering
> **Module:** 1 -- High-Speed Network Standards
> **Through-line:** *The computational mesh begins at the physical layer -- photons on fiber, voltage levels on copper, PAM4 symbols on SerDes lanes. Every layer above inherits the constraints and capabilities of the layers below.*

---

## Table of Contents

1. [The 800GbE Standard](#1-the-800gbe-standard)
2. [The Road to 1.6 Terabit Ethernet](#2-the-road-to-16-terabit-ethernet)
3. [PAM4 Signaling and Signal Integrity](#3-pam4-signaling-and-signal-integrity)
4. [Coherent Optics](#4-coherent-optics)
5. [The Ultra Ethernet Consortium](#5-the-ultra-ethernet-consortium)
6. [Power and Thermal Considerations](#6-power-and-thermal-considerations)
7. [Linear Pluggable Optics](#7-linear-pluggable-optics)
8. [Cross-References](#8-cross-references)
9. [Sources](#9-sources)

---

## 1. The 800GbE Standard

The IEEE P802.3df Task Force released version 1.0 of the 800GbE specification on February 16, 2024, completing a multi-year standardization effort [1][2].

### 1.1 Architecture

The 800GBASE-R specification defines a MAC operating at 800 Gbps using eight 106.25 Gbps physical lanes, built upon two sets of modified 400GbE PCS (Physical Coding Sublayer) logic with 32 virtual lanes at 25 Gbps each. The design reuses RS(544,514) forward error correction from the 400GbE standard, providing backward compatibility while doubling throughput [1].

### 1.2 Physical Media Dependent Specifications

| PMD | Lanes | Fiber Type | Reach | Lane Rate |
|-----|-------|-----------|-------|-----------|
| 800G-DR8 | 8 parallel | Single-mode | 500 m | 100G per lane |
| 800G-SR8 | 8 parallel | Multimode | 50-100 m | 100G per lane |
| 800G-FR4 | 4 WDM | Single-mode | 2 km | 200G per lane |
| 800G-DR4 | 4 parallel | Single-mode | 500 m | 200G per lane |

---

## 2. The Road to 1.6 Terabit Ethernet

The IEEE P802.3dj Task Force targets 200G-per-lane electrical and optical signaling to enable 1.6 Tbps Ethernet. Completion is projected for July 2026. Industry leaders were trialing 1.6T systems by late 2025 [2][3].

### 2.1 The Bandwidth Timeline

| Year | Standard | Speed | Lanes x Rate |
|------|----------|-------|-------------|
| 2010 | 802.3ba | 40/100 GbE | 4x25G / 10x10G |
| 2017 | 802.3bs | 200/400 GbE | 4x50G / 8x50G |
| 2024 | 802.3df | 800 GbE | 8x100G |
| 2026 | 802.3dj | 1.6 TbE | 8x200G |
| ~2028 | Projected | 3.2 TbE | 8x400G |

The transition from 100G-per-lane to 200G-per-lane represents a fundamental SerDes generation change requiring new signal processing, equalization, and FEC architectures [3].

---

## 3. PAM4 Signaling and Signal Integrity

PAM4 (Pulse Amplitude Modulation, 4-level) doubles the bit rate per baud compared to NRZ (Non-Return-to-Zero) by encoding 2 bits per symbol across four voltage levels [4]:

- A lane running at 26.56 Gbaud delivers approximately 50 Gbps with PAM4 vs. 25 Gbps with NRZ
- At 106+ Gbaud rates needed for 200G-per-lane, signal integrity challenges include crosstalk, insertion loss, and power consumption
- The trade-off: reduced signal-to-noise ratio due to smaller voltage separation between levels, requiring robust FEC and equalization

### 3.1 FEC Requirements

Forward Error Correction is no longer optional at these speeds -- it is architecturally required. RS(544,514) KP4-FEC adds approximately 2.5% overhead but corrects burst errors that would otherwise make PAM4 links unusable at high baud rates [4].

---

## 4. Coherent Optics

For data center interconnect (DCI) distances of 80-120 km, coherent optical technology (400ZR/800ZR) combines amplitude and phase modulation with digital signal processing at the receiver [1]:

- **400ZR:** Standardized by OIF, supports 400 Gbps over 120+ km single-mode fiber
- **800ZR:** Doubles capacity using higher-order modulation (16QAM) or dual-carrier approaches
- **Key advantage:** Long reach without optical amplification for campus and metro DCI

---

## 5. The Ultra Ethernet Consortium

The Ultra Ethernet Consortium (UEC), comprising AMD, Arista, Broadcom, Cisco, HPE, Intel, Meta, and Microsoft, aims to evolve Ethernet specifically for AI and HPC workloads [5]:

### 5.1 Market Position

As of 2025, Ethernet powers approximately 52% of TOP500 systems by count, while InfiniBand accounts for roughly 40% of aggregate performance. The UEC targets closing this performance gap while preserving Ethernet's openness, ecosystem breadth, and cost advantages [5].

### 5.2 UEC Specification 1.0 (2025)

Transport-layer enhancements for collective communication patterns common in distributed AI training:
- Lossless, low-latency, predictable communication
- Optimized for AllReduce, AllGather, and ReduceScatter patterns
- Congestion control adapted to bursty AI traffic profiles

---

## 6. Power and Thermal Considerations

Data center power consumption is projected to double to over 1,000 TWh by 2030, driven substantially by generative AI workloads [6]:

- Every watt used on the network is a watt unavailable for compute workloads
- Networking represents 10-15% of total data center power but constrains thermal envelopes
- The power-per-bit curve must continue declining for sustainable bandwidth scaling

---

## 7. Linear Pluggable Optics

Linear Pluggable Optics (LPO) operate at roughly half the power of retimed optics by eliminating the DSP (Digital Signal Processing) retimer in the optical module. The electrical signal passes through the module with minimal processing [6]:

- **Power savings:** ~50% compared to retimed modules
- **Trade-off:** Reduced reach and signal conditioning capability
- **Application:** Short-reach intra-rack and rack-to-switch connections where signal quality is adequate

---

## 8. Cross-References

| Project | Connection |
|---------|------------|
| [SYS](../SYS/index.html) | Server networking fundamentals; NICs, switches, VLANs as building blocks for HPC interconnects |
| [VAV](../VAV/index.html) | Distributed storage networking; Ceph OSD communication patterns mapped to physical layer |
| [OCN](../OCN/index.html) | Container networking; overlay networks and their physical substrate |
| [BRC](../BRC/index.html) | Federation mesh networking; physical layer for distributed event infrastructure |
| [NND](../NND/index.html) | Corridor networking; last-mile connectivity as the access layer |

---

## 9. Sources

1. [IEEE P802.3df -- 800GbE Standard](https://www.ieee802.org/3/df/)
2. [Ethernet Alliance -- Ethernet Roadmap](https://ethernetalliance.org/)
3. [IEEE P802.3dj -- 1.6TbE Task Force](https://www.ieee802.org/3/dj/)
4. [Ethernet Technology Consortium -- PAM4](https://ethernettechnologyconsortium.org/)
5. [Ultra Ethernet Consortium](https://ultraethernet.org/)
6. [Data Center Power Projections -- IEA / Ethernet Alliance](https://www.iea.org/)
