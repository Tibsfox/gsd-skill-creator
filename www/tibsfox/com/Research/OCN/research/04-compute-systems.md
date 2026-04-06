# Compute Systems

> **Domain:** GPU Infrastructure & Systems Architecture
> **Module:** 4 -- Open Compute Node: Compute Payload, Network Architecture, DCIM, and Community Allocation
> **Through-line:** *A single rack can hold the compute equivalent of an entire university's research cluster from a decade ago. The engineering challenge is no longer acquiring capability — it is distributing it. The Open Compute Node exists to solve the distribution problem.*

---

> **PROFESSIONAL ENGINEER REVIEW REQUIRED**
>
> This specification is a conceptual design produced by AI-assisted engineering analysis. It has NOT been reviewed or stamped by a licensed Professional Engineer (PE). Before any construction, fabrication, or installation based on this specification: (1) all structural calculations must be verified by a PE licensed in the jurisdiction of deployment; (2) all electrical designs must comply with local amendments to the National Electrical Code; (3) all high-voltage DC interconnects must be designed, installed, and commissioned by qualified electrical personnel — high-voltage DC power at 48–1500V presents arc-flash and electrocution hazards that differ materially from AC systems and require specialized training and PPE; (4) GPU rack integration must follow NVIDIA's published installation and commissioning procedures. The authors assume no liability for use of this specification without proper professional review.

---

## Table of Contents

1. [NVIDIA GB200 NVL72 Reference Architecture](#1-nvidia-gb200-nvl72-reference-architecture)
2. [Rack Layout and Physical Configuration](#2-rack-layout-and-physical-configuration)
3. [Network Architecture](#3-network-architecture)
4. [Storage Systems](#4-storage-systems)
5. [Data Center Infrastructure Management (DCIM)](#5-data-center-infrastructure-management-dcim)
6. [Community Compute Allocation](#6-community-compute-allocation)
7. [Alternative Compute Configurations](#7-alternative-compute-configurations)
8. [Software Stack](#8-software-stack)
9. [Electrical Safety: High-Voltage DC Systems](#9-electrical-safety-high-voltage-dc-systems)
10. [Cross-References](#10-cross-references)
11. [Sources](#11-sources)

---

## 1. NVIDIA GB200 NVL72 Reference Architecture

### 1.1 Why the GB200 NVL72

The Open Compute Node uses the NVIDIA GB200 NVL72 as its reference case for a specific reason: it represents the current ceiling of AI compute density that can be delivered in a single rack. If the container's structural, power, cooling, and network systems are dimensioned to accommodate 120kW of liquid-cooled GPU compute in a 1,360 kg rack, every alternative configuration — AMD Instinct, Intel Gaudi, CPU-only inference — falls within those bounds. Design for the worst case, deploy anything.

The GB200 NVL72 is not a GPU in the traditional sense. It is a fully integrated AI compute fabric. The "72" refers to 72 Blackwell GPUs, paired with 36 Grace ARM CPUs, all interconnected by NVIDIA's fifth-generation NVLink at a scale that eliminates conventional PCIe bottlenecks entirely. The memory hierarchy is equally radical: 192 GB of HBM3e per Blackwell GPU, yielding 13.8 TB of total GPU memory in a single rack — more memory bandwidth than was available across entire data centers just a few years ago.

### 1.2 Compute Performance Specifications

| Parameter | Value | Notes |
|-----------|-------|-------|
| GPUs per rack | 72 × Blackwell B100 | Paired as 36 GB200 Superchips |
| CPUs per rack | 36 × Grace (ARM Neoverse V2) | Integrated with GPU in Superchip |
| Compute trays | 18 trays | Each tray holds 2 GB200 Superchips |
| FP4 inference throughput | 720 PFLOPS | Per rack, sustained |
| FP8 training throughput | ~4× H100 per GPU at scale | Per NVIDIA benchmarks |
| Memory per Blackwell GPU | 192 GB HBM3e | 8 TB/s memory bandwidth per GPU |
| Total GPU memory per rack | 13.8 TB | Largest memory space of any current rack |
| NVSwitch trays | 9 (NVL72) or 18 (NVL36×2) | All-to-all GPU communication |

### 1.3 The NVLink 5 Fabric

NVLink generation 5 is the feature that makes the GB200 NVL72 architecturally distinctive. In a conventional GPU cluster, inter-GPU communication flows through PCIe lanes to InfiniBand or Ethernet switches and back — introducing microseconds of latency and bandwidth constraints at every hop. The NVL72 eliminates this path for intra-rack communication.

Within the rack, every GPU can communicate with every other GPU at 1.8 TB/s bisection bandwidth. The total NVLink fabric bandwidth across all 72 GPUs reaches 130 TB/s — a number so large it is difficult to contextualize. A single fiber optic cable carries roughly 100 Gbps under typical conditions; the NVL72's internal fabric operates at roughly 10,000 times that rate.

| NVLink 5 Parameter | Value |
|--------------------|-------|
| Per-link bandwidth | 900 GB/s bidirectional |
| GPU-to-GPU bisection bandwidth | 1.8 TB/s |
| Total NVLink fabric throughput | 130 TB/s |
| NVSwitch chips per rack | 72 (distributed across switch trays) |
| Topology | All-to-all (full mesh via NVSwitches) |
| Latency | Sub-microsecond for intra-rack |

The practical consequence: for workloads that fit within a single NVL72 rack — large language model training, multi-modal inference, scientific simulation — there is no cluster interconnect to optimize around. The rack is the cluster. This is why 720 PFLOPS FP4 is achievable: the hardware is not spending bandwidth on coordination overhead.

### 1.4 Memory Architecture: HBM3e

Each Blackwell GPU integrates High Bandwidth Memory 3e (HBM3e) — memory that is physically stacked on the same interposer as the GPU die, connected by thousands of parallel data channels. This is categorically different from GDDR memory, which connects through PCB traces.

| HBM3e Parameter | Per GPU | Full Rack (72 GPUs) |
|-----------------|---------|---------------------|
| Capacity | 192 GB | 13.8 TB |
| Memory bandwidth | 8 TB/s | 576 TB/s aggregate |
| Memory technology | HBM3e (stacked DRAM) | — |

For AI inference, 192 GB per GPU means that large language models — including models with hundreds of billions of parameters — fit entirely within a single GPU's memory space, eliminating model-sharding overhead for inference at this scale. For training, the combined 13.8 TB memory pool, accessible at sub-microsecond latency via NVLink, allows training runs that previously required multi-node clusters to execute on a single rack.

### 1.5 Power and Thermal Envelope

The GB200 NVL72 is a mandatory liquid-cooled system. There is no air-cooled variant — the thermal density precludes it. Each GB200 Superchip (1 Grace CPU + 2 Blackwell GPUs) dissipates up to 2,700W. Across 36 Superchips, the rack TDP approaches 97 kW for compute alone. Adding NVSwitch trays, power conversion losses, and networking, the total rack power draw is approximately 120 kW.

| Power Parameter | Value | Notes |
|----------------|-------|-------|
| Rack TDP | ~120 kW | Full NVL72 configuration |
| GB200 Superchip TDP | 2,700 W | 1 Grace + 2 Blackwell |
| Liquid-cooled load | ~115 kW | Direct-to-chip cold plates |
| Air-cooled load | ~17 kW | Networking, power supplies, misc |
| Input voltage | 48–51V DC | Low-voltage DC bus bar |
| Power supply configuration | 8 shelves × 6 × 5.5 kW PSUs | N+N redundancy |
| Coolant inlet temperature | 15–25°C | ASHRAE W32 class |
| Coolant outlet temperature | 35–45°C | ~10–20°C delta |
| Coolant flow rate | 40–80 GPM per rack | 80–160 GPM for dual-rack config |

**Critical installation note:** The GB200 NVL72's 48–51V DC bus bar connection is a high-current, low-impedance circuit. At 120 kW and 51V, the bus bar carries approximately 2,350 amperes. Arc-flash energy at this current level is lethal. All work on the rack power bus must follow NFPA 70E arc-flash hazard analysis procedures, with appropriate PPE rated for the incident energy level at the point of work. This is not a task for general IT personnel — it requires licensed electricians with DC systems experience.

---

## 2. Rack Layout and Physical Configuration

### 2.1 Physical Dimensions

| GB200 NVL72 Physical Parameter | Value |
|-------------------------------|-------|
| Rack height | 42U effective in standard rack frame |
| Rack width | 600 mm (EIA-310-D standard) |
| Rack depth | 1,200 mm |
| Fully loaded weight | ~1,360 kg (3,000 lbs) |
| Recommended cold aisle width | 1,200 mm minimum |
| Recommended hot aisle width | 900 mm minimum |

The standard 44U EIA-310-D rack is the universal mounting standard for data center equipment, defining the 19-inch mounting rail width and 44.45 mm (1U) height increments. The GB200 NVL72 is engineered to this standard, meaning the rack enclosure itself is compatible with any properly reinforced mounting structure. The weight — 1,360 kg — is the constraint that drives structural requirements rather than the form factor.

### 2.2 Compute Zone Placement

The container's 5-meter compute zone (positions 4,500–9,500 mm from the entry door) accommodates up to four standard 600mm racks with hot/cold aisle containment, using the full 2,352mm internal container width.

```
Container Width: 2,352 mm (internal)

  Cold Aisle (front of racks)
  ┌─────────────────────────────────────────────────────────┐
  │                      1,200 mm                           │  ← Personnel access / cold air
  └─────────────────────────────────────────────────────────┘
  ┌────────────┐  ┌────────────┐
  │ Rack 1     │  │ Rack 2     │  ← 600mm wide each, face toward cold aisle
  │ (GB200     │  │ (GB200     │
  │  NVL72)    │  │  NVL72)    │
  │ 1,200mm    │  │ 1,200mm    │  ← 1,200mm deep
  │ deep       │  │ deep       │
  └────────────┘  └────────────┘
       ← 552 mm →                 ← hot aisle behind racks (252mm, tight — must use rear-facing CDU connections)

```

**Rack count vs. aisle geometry:**

The dual-rack reference design (2 × GB200 NVL72) is the maximum practical configuration given the container's 2,352mm internal width. With two 600mm racks placed side by side facing a single cold aisle, the remaining 1,152mm divides between the cold aisle approach and the rear hot aisle access:

| Layout | Cold Aisle | Racks | Hot Aisle | Fits? |
|--------|-----------|-------|-----------|-------|
| 1 rack | 1,752 mm | 600 mm | — | Yes, excess |
| 2 racks | 1,152 mm | 1,200 mm | — | Yes (single-sided, CDU rear-access) |
| 3 racks | 552 mm | 1,800 mm | — | No — insufficient personnel access |

The recommended configuration is two racks, facing toward the cold aisle (container south wall side), with the CDU and coolant manifold connections made from the rear. Single-rack configurations are valid for lower-power or lower-budget deployments.

### 2.3 Weight Distribution

Each GB200 NVL72 rack distributes its 1,360 kg load through four leveling feet. The container floor reinforcement described in the structural module provides 6mm steel plate overlay across the compute zone. The load path is:

1. Rack foot (150mm × 150mm contact plate) → floor reinforcement plate → steel plate overlay → original container floor framing → container base rails → foundation

With two racks, the combined dead load on the compute zone floor is approximately 2,720 kg over a 1.2m × 2.5m footprint — roughly 907 kg/m², well within the reinforced floor specification. The original container floor is rated for 7,260 kg/m as a line load; the reinforced floor exceeds this rating for the concentrated point loads from rack feet.

**Weight note:** ISO container maximum gross weight of 30,480 kg is not approached. The fully loaded OCN with two GB200 racks, power, cooling, filtration, and all support systems totals approximately 10,620 kg against a limit of 30,480 kg. There is substantial remaining capacity for heavier future compute hardware.

### 2.4 Front-to-Back Airflow Management

Although the GB200 NVL72 is primarily liquid-cooled (direct-to-chip), approximately 17 kW of air-cooled load remains — NVSwitch trays, power supply shelves, and ancillary networking. This residual air cooling requires managed airflow:

- Racks face the cold aisle (container south wall, toward power zone)
- Cold air enters rack fronts; hot air exhausts rack rears into the hot aisle
- Hot aisle containment directs exhaust air to cooling zone CDU air intake or louvered exhaust panel
- Container HVAC maintains cold aisle at 18–24°C (ASHRAE A2 operating class)
- Supply air: 3,000–5,000 CFM depending on ambient conditions

For the residual 17 kW air load with 10°C rise across the rack, airflow requirement is approximately 3,400 CFM. The cooling zone exhaust panel, sized at minimum 0.4 m², provides adequate opening for this flow rate at typical fan velocities.

### 2.5 Liquid Cooling Manifold Connections

Each GB200 NVL72 rack requires two large-bore coolant connections at the rack rear:

| Connection | Specification | Notes |
|-----------|---------------|-------|
| Supply (cold) | 2" NPT or DIN 11851 | 15–25°C, 40–80 GPM per rack |
| Return (warm) | 2" NPT or DIN 11851 | 35–45°C return temperature |
| Isolation valves | Ball valves, full-port | Allow rack swap without CDU shutdown |
| Flexible hose section | Minimum 300mm | Absorbs thermal expansion and vibration |
| Leak detection coupling | Integrated sensor port | Per safety requirement S-05 |

The CDU manifold in the cooling zone distributes supply coolant to both racks in parallel and collects returns through a common return header. Parallel distribution ensures equal supply temperature to both racks; the CDU control system regulates total flow rate to maintain rack inlet temperature within specification.

---

## 3. Network Architecture

### 3.1 External Fiber Intake

The OCN connects to the outside world through single-mode fiber. Single-mode is specified (rather than multi-mode) because it supports transmission over the distances relevant to rail corridor deployments — runs of multiple kilometers to a fiber tap or point of presence — without optical amplification.

| Fiber Specification | Value |
|--------------------|-------|
| Fiber type | OS2 single-mode (ITU-T G.652.D) |
| Connector standard | LC/UPC (primary), MPO-12 (trunk) |
| Conduit entry | 2" rigid conduit, east wall, entry zone |
| Minimum fiber count | 12-strand single-mode (headroom for future capacity) |
| Redundant path | Second conduit entry from opposite direction |
| Splice enclosure | Wall-mounted, entry zone, at 1.5m height |

Redundant fiber paths are a non-negotiable requirement for a node that provides community services. Both paths should arrive from different physical directions — ideally from different carrier facilities — so that a single cable cut does not sever the node's connectivity. Where two independent carrier facilities are not available within a reasonable distance, the two paths should at minimum enter the site from different physical approaches, with the goal of surviving a localized cable damage event (backhoe, vehicle strike, vandalism).

**BGP peering:** The edge router establishes BGP sessions with the upstream provider to advertise the OCN's IP prefix. For nodes in underserved regions, this may be the community's first directly-routed IP space — an important distinction from shared consumer broadband.

### 3.2 Top-of-Rack Switching

Top-of-Rack (ToR) switches sit at the top of each compute rack and aggregate uplinks from servers and GPUs to the wider network. For the GB200 NVL72, the ToR role is distinct from the GPU fabric role — NVLink handles intra-rack GPU communication, while Ethernet handles management, storage, and external traffic.

| ToR Switch Parameter | Specification |
|---------------------|---------------|
| Port speed (downlinks) | 400GbE or 800GbE (toward rack components) |
| Port speed (uplinks) | 400GbE (toward edge router) |
| Port count | 32–64 ports typical |
| Protocol | IEEE 802.3bs (400GbE), 802.3df (800GbE) |
| Form factor | 1U, 600mm depth |
| Power | ~500W per switch |
| Redundancy | Dual switches per rack, active-active ECMP |

The selection between 400GbE and 800GbE depends on the deployment timeline and available optics costs. As of 2026, 400GbE is mature and commodity; 800GbE is available but carries a significant price premium for optics. For a community-serving OCN, 400GbE ToR switches are the practical choice — the external WAN uplink will be the bandwidth bottleneck long before the ToR fabric is saturated.

### 3.3 NVLink Fabric (Intra-Rack)

The NVL72's GPU-to-GPU communication happens entirely within the rack via NVLink 5 and NVSwitches. This fabric is self-contained and does not interact with the Ethernet network. Operators do not configure or manage this fabric through standard networking tools — it is presented to software as a unified memory and compute resource, not as a network.

This distinction matters operationally: the NVLink fabric cannot be segmented via VLANs, monitored via SNMP, or managed through the same tools used for Ethernet. It is managed through NVIDIA's NVSwitch firmware, accessible via the management network through the BMC/HMC interface.

```
NVLink 5 Topology (within NVL72 rack):

  GB200 Superchip 1  ──┐
  GB200 Superchip 2  ──┤
  GB200 Superchip 3  ──┼──→ NVSwitch Tray 1 ──→ NVSwitch Tray 2 ... NVSwitch Tray 9
  ...                  │        (all-to-all fabric)
  GB200 Superchip 36 ──┘

  1.8 TB/s bisection bandwidth
  130 TB/s aggregate fabric throughput
  Sub-microsecond latency
```

### 3.4 VLAN Architecture

The OCN network is segmented into four distinct VLANs. This segmentation is the primary mechanism for isolating community traffic from compute workloads, and for isolating management traffic from everything else.

| VLAN | ID | Purpose | Access |
|------|----|---------|----|
| Compute | 10 | AI workloads, GPU fabric access, storage | Authenticated operators only |
| Management | 20 | IPMI, BMC, DCIM, switches, PDUs | Operators, monitoring systems |
| Community | 30 | Community compute allocation, library/school access | Community users, isolated |
| Monitoring | 40 | Prometheus, logging, alerting | Read-only from ops, alerts out |

**Cross-VLAN routing policy:**
- VLAN 30 (Community) has NO route to VLAN 10 (Compute) — enforced at the edge router with ACLs
- VLAN 30 has outbound internet access only — community users reach the public internet and the community portal, not any internal resource
- VLAN 20 (Management) is not reachable from VLAN 30 or from the public internet
- VLAN 40 (Monitoring) can push alerts to external endpoints but accepts no inbound connections from untrusted sources

### 3.5 Management Network: IPMI, BMC, and DCIM

Every piece of intelligent hardware in the OCN has an out-of-band management interface. This is the network that lets operators restart a crashed server, read power consumption from a PDU, or diagnose a failing fan — without requiring the managed device to be responsive on its primary network.

| Device | Management Interface | Protocol |
|--------|---------------------|----------|
| GB200 NVL72 racks | HMC (Host Management Controller) | IPMI v2, Redfish |
| Network switches | Dedicated management port | SSH, SNMP, web UI |
| PDUs | Per-PDU management card | SNMP, Modbus TCP, web |
| CDU | Serial or Ethernet management | Modbus TCP, proprietary |
| Environmental sensors | 1-Wire or Modbus | DCIM gateway |

All management interfaces reside on VLAN 20 (Management). The DCIM system is the single aggregation point: it polls all devices, stores time-series data, provides a unified dashboard, and routes alerts. No management interface is directly exposed to the public internet — all remote access to management functions goes through a VPN gateway or SSH bastion.

### 3.6 Out-of-Band (OOB) Management

Out-of-band management is the ability to manage infrastructure independent of its primary network and operating system. For a remote OCN deployment — potentially hundreds of miles from the nearest qualified operator — OOB management is the difference between a remote software fix and a site visit.

The OCN OOB architecture uses a dedicated cellular LTE/5G modem as a secondary management path, independent of the primary fiber connection:

```
Primary path:    Internet → fiber → edge router → VPN gateway → VLAN 20 → devices
OOB path:        Internet → LTE/5G → OOB router → VLAN 20 (isolated) → IPMI/BMC
```

OOB capabilities available via either path:
- Server power on/off/reset (IPMI)
- Serial console access (IPMI SOL — Serial over LAN)
- GPU firmware updates (via HMC)
- Switch OS updates (via out-of-band management port)
- Environmental sensor reads
- PDU outlet control

The OOB path is rate-limited and audit-logged. All OOB actions are timestamped and stored in the centralized logging system for compliance and incident investigation.

### 3.7 Latency Considerations

Different workload types have different latency tolerances. Understanding this drives both hardware selection and VLAN priority configuration.

| Workload Type | Latency Tolerance | Bandwidth Need | Primary Path |
|---------------|------------------|----------------|-------------|
| LLM inference (single GPU) | 10–100ms | Low (tokens/sec) | Internal compute |
| LLM training (multi-GPU) | <1μs (NVLink) | Very high | NVLink fabric |
| Storage I/O (NVMe) | 50–500μs | High | PCIe direct |
| Storage I/O (network-attached) | 1–10ms | Medium | Compute VLAN |
| Community portal (JupyterHub) | <500ms interactive | Medium | Community VLAN |
| Management/monitoring | <5s (non-critical) | Very low | Management VLAN |
| External BGP routing | ~100ms convergence | Very low | Edge router |

The most latency-sensitive path — GPU-to-GPU communication during distributed training — operates exclusively over NVLink within the rack and never touches the Ethernet fabric. This means external network quality has no effect on training throughput for workloads that fit within the rack's 13.8 TB memory space.

---

## 4. Storage Systems

### 4.1 Local NVMe Storage

Each GB200 compute tray accommodates local NVMe storage for operating system, swap space, and hot-tier data. The Grace CPUs support PCIe Gen 5 NVMe, enabling sequential read throughput exceeding 12 GB/s per drive.

| NVMe Storage Parameter | Value | Notes |
|----------------------|-------|-------|
| Form factor | U.2 or E1.L NVMe | Enterprise-grade, datacenter endurance |
| Capacity per tray | 4–8 TB (2–4 × 2TB drives) | OS + model weights hot tier |
| Total local NVMe (18 trays) | 72–144 TB | Aggregate per rack |
| Read bandwidth | 12–14 GB/s per drive | PCIe Gen 5 ×4 |
| Endurance rating | 3 DWPD minimum | Datacenter write workload |
| Interface | PCIe Gen 5, NVMe 2.0 | |

Local NVMe is not shared between trays — each tray's storage is visible only to that tray's Grace CPU and Blackwell GPUs. This suits inference deployment patterns, where each compute unit runs an independent model instance from its own local copy.

### 4.2 Network-Attached Storage

For training workloads, shared storage is essential — training datasets too large to fit in local NVMe must be streamed from a shared pool. For a containerized edge deployment, the practical options are:

**NFS (Network File System):** Lowest complexity. The OCN includes a dedicated storage server (1–2U) on the Compute VLAN, exporting training datasets and shared model checkpoints via NFS v4.1. Performance is limited by network bandwidth (400GbE = ~40 GB/s theoretical, 20–30 GB/s practical for NFS). For most training workloads at OCN scale, this is sufficient.

**Lustre:** The parallel distributed filesystem used by HPC clusters. Higher complexity but scales to multiple storage servers and provides higher aggregate throughput for data-parallel training. Appropriate if the OCN is configured as a multi-node cluster rather than a standalone rack. Not recommended for initial deployments.

| Storage Option | Protocol | Throughput | Complexity | Use Case |
|---------------|----------|------------|------------|----------|
| Local NVMe | PCIe direct | 12+ GB/s per tray | Low | OS, hot models, inference |
| NFS server | NFSv4.1 over 400GbE | 20–30 GB/s aggregate | Medium | Training datasets, checkpoints |
| Lustre cluster | Lustre 2.x | 100+ GB/s (multi-server) | High | Large-scale distributed training |

### 4.3 Storage for AI Workloads

The storage hierarchy for AI workloads follows a tiered pattern:

```
Hot tier (local NVMe):     Active model weights, OS, running container images
                           ~72–144 TB per rack, sub-millisecond access

Warm tier (NFS server):    Training datasets, model checkpoints, experiment outputs
                           ~100–400 TB, 1–10ms network access

Cold tier (community-accessible):  Public datasets, cached research data
                                   Object storage or NFS, minutes to hours
```

**Model weights sizing:**
- 70B parameter LLM in FP16: ~140 GB (fits on 1 GPU's 192 GB HBM3e)
- 405B parameter LLM in FP8: ~405 GB (fits on 3 GPUs, ~2% of rack memory)
- Full training run checkpoint: 1–10 TB depending on frequency

**Training data sizing:**
- Common pretraining datasets (The Pile, RedPajama, etc.): 800 GB–3 TB
- Domain-specific fine-tuning datasets: 1–100 GB
- Community-generated research data: variable, typically <10 GB

### 4.4 Data Persistence for Containerized Deployment

The OCN uses containers (Docker/Podman) for workload isolation. Container filesystems are ephemeral by default — a crashed container loses all in-container writes. Persistent data must be explicitly mounted from durable storage:

| Data Type | Persistence Strategy | Storage Location |
|-----------|---------------------|-----------------|
| Container images | Image registry (local or remote) | NVMe or NFS |
| Model weights | Read-only bind mount | NVMe or NFS |
| Experiment outputs | Named volume, bind mount to NFS | NFS warm tier |
| Training checkpoints | Named volume, bind mount to NFS | NFS warm tier |
| OS state | Persistent OS volume | NVMe |
| Community user data | Per-user PVC (Kubernetes) | NFS, encrypted |
| Logs | Forwarded to logging system | Centralized syslog |

Kubernetes Persistent Volume Claims (PVCs) provide the abstraction layer — workloads declare storage needs (size, access mode, storage class), and the cluster scheduler binds them to available volumes without the workload knowing the physical storage location. This supports the goal of modular upgradeability: replacing the NFS server does not require changing workload configurations.

---

## 5. Data Center Infrastructure Management (DCIM)

DCIM is the system that gives operators visibility into and control over the physical infrastructure — power, cooling, network, environmental conditions. For a remotely-operated OCN deployment, DCIM is the difference between a well-managed node and a black box.

### 5.1 Environmental Monitoring

ASHRAE TC 9.9 defines measurement guidelines for data center thermal management. The OCN implements a sensor array that meets the ASHRAE recommended measurement density:

| Sensor Type | Quantity | Location | Threshold |
|-------------|----------|----------|-----------|
| Temperature (ambient) | 8 minimum | Cold aisle (4), hot aisle (2), power zone (1), cooling zone (1) | Alert >27°C cold aisle; Alert >45°C hot aisle |
| Temperature (rack inlet) | 2 (one per rack) | Rack front, bottom of cold aisle | Alert >25°C |
| Temperature (coolant supply) | 2 | CDU supply manifold | Alert >25°C; Emergency >28°C |
| Temperature (coolant return) | 2 | CDU return manifold | Alert >50°C |
| Humidity | 4 | Cold aisle, cooling zone, power zone, entry | Alert <20% or >80% RH |
| Leak detection | Continuous rope sensor | All liquid pipe runs | Immediate alarm + pump shutoff |
| Airflow differential | 4 | Across each rack, hot/cold aisle boundary | Alert if airflow drops >20% |
| Smoke/fire | Per NFPA 75 coverage | All zones | Immediate alarm + fire suppression |

ASHRAE TC 9.9 recommended ambient conditions for server inlets: 18–27°C, 20–80% non-condensing relative humidity. The OCN operates to A2 class (which extends to 35°C inlet, allowing for higher thermal margin under peak ambient conditions in desert deployments).

### 5.2 Power Monitoring

Per-rack and per-PDU power monitoring provides the data for capacity management, efficiency tracking, and anomaly detection.

| Monitoring Point | Measurement | Purpose |
|-----------------|------------|---------|
| Service entrance DC bus | Total kW, kWh | Total facility power consumption |
| Rack 1 PDU | Per-outlet kW, kWh, PF | Per-rack power consumption |
| Rack 2 PDU | Per-outlet kW, kWh, PF | Per-rack power consumption |
| Aux distribution | Total kW by branch | Cooling, networking, monitoring overhead |
| Solar input | kW, kWh, voltage | Renewable generation tracking |
| BESS state | State of charge %, kWh | Battery reserve monitoring |

**Power Usage Effectiveness (PUE):** PUE = Total facility power / IT equipment power. The OCN targets PUE < 1.3 (the DOE/LBNL benchmark for efficient data centers is PUE < 1.4). With direct liquid cooling and minimal overhead systems, actual PUE should be in the 1.15–1.25 range. PUE is calculated continuously from the metered data and reported to the DCIM dashboard.

### 5.3 Remote Management Interfaces

| Interface | Protocol | Access Level | Use Case |
|-----------|----------|-------------|----------|
| Web dashboard | HTTPS | Read-only (all), read-write (operators) | Day-to-day monitoring |
| SSH bastion | SSH v2, key authentication | Full shell access | Operator intervention |
| IPMI console | IPMI v2 / Redfish | Hardware management | Server-level control |
| VPN gateway | WireGuard | Network access to management VLAN | Remote maintenance |
| SNMP | SNMPv3 (auth + priv) | Read-only | Integration with community monitoring |
| Syslog | RFC 5424 over TLS | Outbound only | Centralized log aggregation |

All remote management access is gated by multi-factor authentication. SSH keys are rotated on a schedule. IPMI credentials are unique per device and stored in a secrets manager (HashiCorp Vault or equivalent). Console access sessions are recorded and stored for 90 days minimum.

### 5.4 Alerting Architecture

Alerts flow from sensors through Prometheus alerting rules to notification channels:

```
Sensors / Devices
       │
       ↓
Prometheus (scrapes metrics every 15s)
       │
       ↓
Alertmanager (evaluates rules, deduplicates, routes)
       │
    ┌──┴──────────────────────────────────────┐
    ↓                                          ↓
PagerDuty / SMS (P1: immediate)         Email / Slack (P2/P3: batched)
```

| Alert Priority | Condition | Response Time | Example |
|---------------|-----------|---------------|---------|
| P1 — Critical | Leak detected, fire alarm, power loss | Immediate page | Coolant leak anywhere in liquid path |
| P1 — Critical | GPU temperature >90°C | Immediate page | Thermal runaway, cooling failure |
| P2 — Warning | Cold aisle >27°C | 15 minutes | Cooling degradation, ambient spike |
| P2 — Warning | BESS state of charge <20% | 15 minutes | Extended low-solar period |
| P3 — Informational | PDU outlet power anomaly | 1 hour | Unexpected power draw change |
| P3 — Informational | Network link down | 1 hour | Port failure or misconfiguration |

### 5.5 Centralized Log Aggregation

All system logs converge to a single aggregation stack. The minimum viable stack for an OCN is:

- **Rsyslog** or **Vector** on all nodes — collects logs from OS, services, and hardware
- **Elasticsearch** or **Loki** — log storage and indexing
- **Grafana** — unified visualization for both metrics (Prometheus) and logs (Loki)

Log retention: 90 days on-node, 1 year in compressed cold storage. Security event logs (authentication, access control changes, alert events) are retained for 3 years minimum.

---

## 6. Community Compute Allocation

### 6.1 Policy: Minimum 10% Dedication

The OCN's founding commitment is that a minimum of 10% of total compute capacity is permanently allocated to free community use, with no usage tracking and no data collection on community users. This is not a marketing claim — it is an architectural constraint that must survive any future operator change.

For a dual-rack GB200 NVL72 configuration:
- Total compute: 2 × 720 PFLOPS FP4 = 1,440 PFLOPS FP4
- Community minimum: 144 PFLOPS FP4 (equivalent to approximately 10 fully-loaded H100 GPUs)
- Community allocation: GPU time scheduling, not physical partition

In practice, community compute allocation means:
- 7–8 GPUs (out of 144 total in a dual-rack config) are reserved for community workloads
- Community users can submit jobs through the JupyterHub portal or API
- Jobs run on the reserved GPUs; primary workloads cannot preempt community jobs
- During idle primary periods, community users may burst to additional capacity (configurable)

### 6.2 Network Segmentation

Community users reach the OCN through VLAN 30, which is fully isolated from the compute infrastructure:

```
Community User (library/school terminal)
        │
        ↓
Community Access Point (WiFi or wired)
        │
        ↓
Edge Router — VLAN 30 uplink
        │
        ↓
Community Portal (JupyterHub) — VLAN 30 only
        │
     ┌──┴───────────────────────────────────────────────┐
     ↓                                                   ↓
Community GPU pool (VLAN 10, read via API gateway)   Internet access
(No direct VLAN 10 access — API gateway only)        (filtered)

ACL Rules:
- VLAN 30 → VLAN 10: DENY all (enforced at edge router)
- VLAN 30 → VLAN 20: DENY all (no management access)
- VLAN 30 → Internet: PERMIT (filtered by DNS and application layer)
- VLAN 10 → VLAN 30: DENY all (primary workloads cannot reach community)
```

The API gateway is the single controlled interface between community users and the GPU pool. It accepts job submissions, queues them, dispatches them to the community GPU partition, and returns results. The gateway runs on VLAN 30 and has a controlled one-way connection to the Slurm or Ray scheduler on VLAN 10. No community user has shell access to any compute node.

### 6.3 Access Control

| Access Level | Who | Capabilities | Restrictions |
|-------------|-----|-------------|-------------|
| Anonymous community | Library/school visitor | JupyterHub notebooks, limited CPU | No GPU without registration |
| Registered community | Library card holder | Full community GPU quota, persistent storage | Cannot access primary compute |
| Operator | Site personnel | Full VLAN 10 + 20 access | Audit-logged, MFA required |
| Remote operator | Contractor, developer | VPN → VLAN 20 only | Time-limited tokens, audit-logged |

Registration for community GPU access requires only a library card or school ID — the minimum necessary to prevent abuse while maintaining accessibility. No name, email address, or contact information is collected beyond what the library or school already holds. The OCN operator does not receive or store community user identity information.

### 6.4 Capacity Management: GPU Time vs. CPU Time

The community allocation is primarily GPU time, because that is what makes the OCN valuable for community access. GPU scheduling works as follows:

**GPU time:** Slurm or Ray partitions the community GPU pool. Each job requests a number of GPUs and a wall-clock time limit. The scheduler enforces quotas:

| Community User Type | GPU Allocation | Max Job Duration | Max Queue Depth |
|--------------------|---------------|-----------------|----------------|
| Anonymous | 0 GPUs (CPU only) | 30 minutes | 1 job |
| Registered individual | 1 GPU | 4 hours | 3 jobs |
| Registered institution (library, school) | 4 GPUs | 24 hours | 10 jobs |

**CPU time:** The Grace CPUs in the GB200 Superchips are also available for community CPU-only workloads (data processing, lighter inference, programming exercises). CPU allocation is more generous than GPU allocation because CPU demand from community workloads is unlikely to contend with primary GPU workloads.

**Burst allocation:** During periods when primary workloads are not using their full GPU allocation, unused capacity is made available to community users on a preemptible basis. Community jobs submitted for preemptible execution have higher resource limits but may be interrupted with 30 seconds notice when primary demand resumes.

### 6.5 Community Use Cases

The following use cases are specifically enabled by the community compute allocation:

| Use Case | Resource Need | Who Benefits |
|----------|--------------|-------------|
| Student AI project (high school) | 1 GPU, 4 hours | STEM education |
| Library AI search assistant | 1–2 GPU, continuous inference | All library patrons |
| Local business LLM (invoice processing, etc.) | 1–2 GPU, burst | Small business |
| Research dataset analysis | 4 GPU, 24 hours | Community college, researchers |
| Language learning tools | CPU only | ESL programs, non-English speakers |
| Public health data visualization | CPU + storage | Local health department |
| Agricultural data analysis | CPU + storage | Farming community |

In a small town of 5,000 people, 144 PFLOPS FP4 of dedicated compute — available free, at the library, forever — is transformative. It is not charity; it is infrastructure. The same way the highway system did not charge farmers to truck their produce to market, the OCN does not charge the community for compute access.

---

## 7. Alternative Compute Configurations

The GB200 NVL72 is the reference case, but the container is not built for the GB200. It is built for compute density in general. The structural, power, cooling, and network systems are specified to the GB200's maximums; any alternative hardware that fits within those maximums can be substituted without structural modification.

### 7.1 AMD Instinct MI300X

The AMD Instinct MI300X is the most direct architectural competitor to the NVIDIA B100/B200. It uses a heterogeneous chiplet design with integrated CPU and GPU dies on a single package — similar in concept to the GB200 Superchip.

| MI300X Parameter | Value | vs. GB200 Superchip |
|-----------------|-------|---------------------|
| HBM3 memory per accelerator | 192 GB | Equal |
| Memory bandwidth | 5.3 TB/s | Lower than Blackwell |
| Compute (FP8) | ~1,300 TFLOPS | Lower |
| TDP per accelerator | ~750W | Lower |
| ROCm software stack | Required | Different from CUDA |
| Rack configuration | 8-GPU OAM or PCIe | Different form factor |

An MI300X rack configuration at equivalent GPU count uses the OAM (Open Accelerator Module) form factor, compatible with OCP (Open Compute Project) standards. An 8-GPU server at 8 × 750W = 6 kW per 1U; a comparable 72-GPU rack would draw approximately 54 kW — less than half the GB200's power draw. This is attractive for sites with lower power budgets.

**Software consideration:** AMD ROCm is the software stack for Instinct accelerators. While ROCm supports PyTorch, TensorFlow, and the major AI frameworks, it requires specific toolchain awareness. CUDA-specific code does not run on ROCm without porting. For community users running standard JupyterHub notebooks with PyTorch, this is invisible; for operators deploying specialized inference engines, it matters.

### 7.2 Intel Gaudi 3

Intel's Gaudi 3 (formerly Habana Gaudi) takes a different architectural approach: it uses 24 100GbE ports per card for scale-out networking, rather than a proprietary interconnect like NVLink or AMD's Infinity Fabric.

| Gaudi 3 Parameter | Value | Notes |
|------------------|-------|-------|
| HBM2e memory | 96 GB per card | Lower than MI300X or GB200 |
| Memory bandwidth | 3.7 TB/s | Lower |
| Compute (BF16) | ~2,048 TFLOPS | Competitive for training |
| TDP per card | ~900W | Moderate |
| Scale-out fabric | 24 × 100GbE per card | Uses standard Ethernet |
| Software | Intel Gaudi SW (Habana SynapseAI) | PyTorch support, less ecosystem |

Gaudi 3's use of standard Ethernet for scale-out is architecturally interesting for the OCN: a Gaudi 3 cluster could use the existing Ethernet fabric for inter-GPU communication rather than requiring proprietary interconnect hardware. At current market pricing, Gaudi 3 offers a lower cost-per-TFLOP than Hopper-generation NVIDIA hardware, though the ecosystem and software maturity gap with CUDA remains significant.

An 8-card Gaudi 3 1U server draws approximately 7.2 kW; a 72-card equivalent would consume roughly 65 kW — within the OCN's power budget for a single rack.

### 7.3 CPU-Only Inference Nodes

Not every OCN needs GB200s. For communities where the primary use case is inference serving — running a local LLM for library search, answering questions, generating documents — a CPU-only configuration is dramatically simpler and cheaper to deploy.

Modern server CPUs with large DDR5 memory configurations can run quantized LLMs at useful speeds. AMD EPYC Genoa or Intel Xeon Sapphire Rapids with 1–2 TB of DDR5 can host a 70B parameter INT4 quantized model and serve 5–20 concurrent users at acceptable latency.

| CPU-Only Config | Spec | Notes |
|----------------|------|-------|
| CPU | 2 × AMD EPYC 9654 | 192 cores total |
| Memory | 1.5 TB DDR5 | Holds large quantized models |
| Power per server | ~1.5–2 kW | ~10× less than GB200 tray |
| 1U rack count | 20 servers in 20U | Remaining 24U for switches, storage |
| Total rack power | ~35 kW | Within reduced power budget |
| Cooling | Air-cooled | No liquid cooling required |
| LLM inference speed | 10–30 tokens/sec (INT4 70B) | Usable for interactive applications |

A CPU-only OCN:
- Requires no liquid cooling — dramatically simpler infrastructure
- Powers from a smaller solar array (~300 kW nameplate vs. 600 kW for GB200)
- Carries much lower hardware cost
- Provides inference-class AI services without training capability
- Is the right choice for initial community deployments before the community has GPU-native workloads

### 7.4 Mixed GPU/CPU Configurations

The compute zone's 5-meter footprint accommodates any combination of rack types. A practical mixed configuration for OCN deployments that want both training capability and a lower power budget:

| Rack Position | Configuration | Power | Use |
|--------------|--------------|-------|-----|
| R1 | GB200 NVL36×2 (36 GPUs) | ~66 kW | Primary GPU compute |
| R2 | 2U CPU inference servers (10 nodes) | ~20 kW | Inference serving + community GPU |

This mixed configuration draws approximately 86 kW total compute load, requiring a smaller solar array (~430 kW nameplate) while still providing substantial GPU capability. The CPU nodes handle inference and community workloads continuously; the GPU rack runs training and batch jobs.

### 7.5 Container Accommodation of Different Payloads

The OCN container design accommodates all the above alternatives through the following invariants:

| Parameter | Constraint | Accommodates |
|-----------|-----------|-------------|
| Floor reinforcement | Rated for 1,360 kg per rack | All alternatives (all lighter than GB200) |
| DC power bus | 120 kW per rack position | All alternatives (all lower power than GB200) |
| Coolant manifolds | 80 GPM, 25°C supply | GPU alternatives; CPU-only skips liquid |
| Network topology | 400GbE ToR, VLAN isolation | All alternatives |
| Rack form factor | 44U EIA-310-D, 600mm | All standard alternatives |

The only change required for alternative configurations is the coolant manifold capping procedure when deploying air-cooled hardware: manifold supply/return ports are capped with blind flanges, and the CDU flow path is reconfigured to bypass the rack connections. This is a planned-for operation, not a structural modification.

---

## 8. Software Stack

### 8.1 Operating System

Linux is the only practical operating system for the OCN compute infrastructure. The choice between distributions affects tooling availability, support lifecycle, and community familiarity.

| Distribution | Advantages | Considerations |
|-------------|-----------|---------------|
| Ubuntu Server 24.04 LTS | Wide driver support, large community, 5-year LTS | Default choice for most AI deployments |
| RHEL 9 / Rocky Linux 9 | Enterprise support, Red Hat AI tooling, SELinux | Better for regulated environments |
| Debian 12 | Stability, minimal base, long LTS cycles | Less out-of-box AI tooling |

**Recommendation:** Ubuntu Server 24.04 LTS for the initial OCN deployment. It is the most widely tested platform for NVIDIA CUDA drivers, AMD ROCm, and Kubernetes tooling. The 5-year LTS support horizon aligns with hardware refresh cycles.

### 8.2 Container Runtime

Container isolation is essential for multi-tenant compute environments. The community allocation and primary workload allocation must not interfere with each other at the filesystem or process level.

| Runtime | Notes |
|---------|-------|
| Docker CE | Most familiar, excellent GPU support via nvidia-container-toolkit |
| Podman | Rootless by default, daemonless, OCI-compatible — better security posture for multi-tenant |
| containerd | Lower-level, used directly by Kubernetes |

**Recommendation:** Podman for direct container operations; containerd as the Kubernetes CRI. Podman's rootless mode is important for community users submitting jobs — a misconfigured community container cannot escalate to root on the host.

**GPU passthrough:** The nvidia-container-toolkit (or ROCm equivalent for AMD) provides the mechanism for containers to access GPU hardware. Each container that needs GPU access declares a GPU request; the runtime allocates dedicated GPU access through the NVIDIA Container Runtime hooks.

### 8.3 Kubernetes (k3s)

For container orchestration at OCN scale, k3s (lightweight Kubernetes) is the recommended choice over full upstream Kubernetes. k3s has an identical API to Kubernetes but ships as a single binary with embedded SQLite (or etcd for HA), dramatically reducing operational overhead for edge deployments.

| k3s Parameter | Value | Notes |
|--------------|-------|-------|
| Binary size | ~70 MB | vs. hundreds of MB for full Kubernetes components |
| Resource overhead | ~512 MB RAM | Suitable for edge compute |
| API compatibility | 100% Kubernetes API | All standard kubectl commands work |
| GPU scheduling | Via device-plugin (nvidia/amd) | Same plugin API as full Kubernetes |
| HA configuration | 3-node etcd (optional) | Single-node acceptable for isolated OCN |

The k3s cluster runs on the OCN's management nodes (1–2 dedicated lightweight servers on VLAN 20), with the GB200 compute nodes registered as GPU worker nodes. The community JupyterHub deployment runs on the k3s cluster, providing per-user namespaces, resource quotas, and persistent volume claims.

### 8.4 GPU Drivers and Compute Stacks

| Software Layer | NVIDIA Stack | AMD Stack |
|---------------|-------------|----------|
| Kernel driver | NVIDIA Driver 570+ (open-source kernel module) | AMDGPU (built into mainline kernel) |
| Compute runtime | CUDA 12.x | ROCm 6.x |
| Communication library | NCCL 2.x (NVLink-optimized) | RCCL (ROCm equivalent) |
| Deep learning library | cuDNN 9.x | MIOpen |
| Python interface | PyTorch 2.x (CUDA backend) | PyTorch 2.x (ROCm backend) |

Driver installation is the first operation after OS deployment. On the GB200 NVL72, NVIDIA's open-source kernel module (introduced as the default in Driver 530+) is preferred over the proprietary module — it integrates with the kernel lockdown and secure boot mechanisms that are appropriate for a community-accessible node.

### 8.5 Workload Orchestration

Two workload orchestration systems are appropriate for different OCN use cases:

**Slurm** is the standard HPC scheduler, widely used at national laboratories and universities. It manages job queues, resource allocation, and fairshare scheduling. Slurm integrates with the community quota system through partition definitions — the community partition has a fixed GPU count and cannot preempt primary work.

**Ray** is the Python-native distributed computing framework from Anyscale, now widely adopted for AI/ML workloads. Ray natively understands GPU resources, supports distributed training and inference, and integrates directly with PyTorch. For an OCN primarily running AI workloads, Ray may be more practical than Slurm's HPC-oriented model.

| Feature | Slurm | Ray |
|---------|-------|-----|
| Ecosystem | HPC (academia, national labs) | AI/ML (PyTorch, TensorFlow) |
| Job submission | sbatch scripts | Python API / CLI |
| Community user experience | CLI-centric | Python / JupyterHub native |
| GPU scheduling granularity | Integer GPUs | Fractional GPUs (0.1 GPU) |
| Multi-node training | Standard | Standard |
| Inference serving | Via job submission | Ray Serve (native) |
| Learning curve | High | Moderate |

Fractional GPU scheduling in Ray is particularly valuable for community users: a student running a small notebook experiment can request 0.1 GPU rather than holding an entire GPU idle. This increases effective community throughput without requiring additional hardware.

### 8.6 Monitoring Stack

The monitoring stack is centered on Prometheus for metrics collection and Grafana for visualization. This is the de facto standard for infrastructure monitoring across the cloud-native ecosystem and is well-supported by all hardware vendors through exporters.

| Component | Role | Notes |
|-----------|------|-------|
| Prometheus | Time-series metrics collection | Scrapes all exporters every 15s |
| Alertmanager | Alert routing and deduplication | Routes P1 to pager, P2/P3 to email |
| Grafana | Dashboard and visualization | Unified view of metrics + logs |
| Node Exporter | OS-level metrics (CPU, memory, disk, network) | Runs on all servers |
| DCGM Exporter | GPU metrics (utilization, memory, temperature, power) | NVIDIA-specific, critical for GPU monitoring |
| SNMP Exporter | Network switch and PDU metrics | Translates SNMP to Prometheus |
| Loki | Log aggregation | Works natively with Grafana |
| Vector | Log forwarding agent | Lightweight, handles structured logging |

The DCGM (Data Center GPU Manager) Exporter is particularly important: it exposes per-GPU metrics including utilization percentage, memory used/free, temperature, power draw, and NVLink error counters. These metrics are essential for both operational monitoring and for capacity planning the community allocation.

### 8.7 Community Access Portal

JupyterHub is the recommended community access layer. It provides browser-based Jupyter notebook environments with no client installation required — a library patron with a web browser can access GPU compute.

| JupyterHub Parameter | Configuration |
|---------------------|---------------|
| Deployment | Via k3s, using Zero to JupyterHub Helm chart |
| Authentication | OAuthenticator (library SSO) or NativeAuthenticator (local accounts) |
| Spawner | KubeSpawner (spawns per-user pods on k3s) |
| Default GPU allocation | 0 (CPU only until registered) |
| Registered GPU allocation | 1 GPU per user, configurable |
| Storage per user | 10 GB persistent volume claim |
| Idle timeout | 30 minutes (reclaim GPU resources) |
| Pre-installed kernels | Python 3 + PyTorch, Python 3 + TensorFlow, R |

JupyterHub's idle-timeout is critical for community GPU resource management. Without it, a user who opens a notebook, is allocated a GPU, and walks away from the terminal holds that GPU indefinitely. A 30-minute idle timeout reclaims the GPU after 30 minutes of no kernel activity, returning it to the community pool for the next user.

---

## 9. Electrical Safety: High-Voltage DC Systems

> **WARNING — READ BEFORE WORKING ON OCN ELECTRICAL SYSTEMS**

The OCN compute systems operate from a 48–51V DC bus at extremely high currents. The GB200 NVL72 draws approximately 120 kW at 51V DC — approximately 2,350 amperes. This is a lethal electrical environment that differs in important ways from standard AC power systems.

### 9.1 Why DC Systems Are Different

Standard building wiring operates at AC voltage. Circuit breakers work by allowing the AC sine wave's natural zero-crossing to interrupt the arc. DC power has no zero-crossing. When a DC circuit is broken under load, the arc is continuous and self-sustaining. DC arcs at high current levels burn at temperatures exceeding 35,000°F — hot enough to vaporize copper conductors and cause severe burns, blast injury, and fire.

The OCN DC bus at 2,350 amperes has arc-flash incident energy that exceeds the protection limits of most standard electrical PPE. NFPA 70E requires an arc-flash hazard analysis (per IEEE 1584) for every work task on energized equipment. For the OCN power bus:

- **No work is permitted on the energized 48–51V bus bar.**
- All rack power connections must be made with the bus de-energized and locked out per NFPA 70E LOTO procedures.
- Only personnel with NFPA 70E training, appropriate incident energy-rated PPE, and documented authorization may work on the power distribution system.
- The exterior emergency disconnect must be operated before any personnel enter the container for electrical work.

### 9.2 Lockout/Tagout Procedure (LOTO)

Required steps before any electrical work on OCN power systems:

1. Notify all affected personnel of scheduled de-energization
2. Operate exterior emergency disconnect to remove power from container service entrance
3. Verify zero energy state with calibrated DC voltmeter at service entrance terminals
4. Apply lockout device to exterior disconnect with unique keyed lock
5. Attach danger tag: "DO NOT ENERGIZE — Work in Progress — [Name] [Date]"
6. Test all downstream points to confirm zero energy (including BESS internal bus)
7. Proceed with work
8. After work: remove locks in reverse order, restore power, verify system operation

The BESS (Battery Energy Storage System) in the adjacent battery container has its own LOTO requirements. Even with the exterior solar disconnect open, the BESS remains energized through its internal battery cells. BESS de-energization requires following the BESS manufacturer's specific procedures — typically involving a dedicated battery management system (BMS) shutoff switch and verification procedure.

### 9.3 Commissioning Requirements

First energization of the OCN power bus must be performed by a licensed electrical contractor with documented DC systems experience. The commissioning procedure includes:

- Insulation resistance testing of all conductors before energization
- Polarity verification at all connection points
- Current balance verification across parallel-connected PSUs
- Ground fault detection test
- Emergency disconnect operation test (from exterior, under partial load)
- Arc-flash analysis update based on as-built system documentation

No AI-generated specification substitutes for the site-specific arc-flash analysis that must be performed by a qualified electrical engineer before commissioning.

---

## 10. Cross-References

| Module | Relationship |
|--------|-------------|
| 01-vision-architecture.md | Vision context: the 8-layer architecture that positions compute as Layer 6 |
| 02-engineering-specifications.md | ISO container dimensions, weight budget, wall penetrations for fiber and power |
| 03-deployment-logistics.md | Rail corridor and fiber route context for network architecture section |
| 04-container-power-cooling.md | Power distribution, cooling loop, CDU specifications that feed into rack connections |
| 05-community-integration.md | Community compute allocation policy context and community partnership structures |
| 06-verification-matrix.md | Acceptance criteria for compute systems: power draw, cooling connections, network isolation |

---

## 11. Sources

**Hardware specifications:**
- NVIDIA Corporation — GB200 NVL72 Technical Overview, DGX GB200 User Guide (2025)
- NVIDIA — NVLink 5 Architecture Brief (2024)
- AMD — Instinct MI300X Technical Specification Sheet (2024)
- Intel — Gaudi 3 AI Accelerator Technical Brief (2024)
- SemiAnalysis — "GB200 NVL72: Inside the Architecture" (2024)

**Standards:**
- ASHRAE TC 9.9 — Thermal Guidelines for Data Processing Environments, 5th Edition
- NFPA 70 (NEC 2023) — National Electrical Code
- NFPA 70E — Standard for Electrical Safety in the Workplace (2024)
- NFPA 75 — Standard for the Protection of Information Technology Equipment
- IEEE 1584-2018 — Guide for Performing Arc-Flash Hazard Calculations
- EIA-310-D — Cabinets, Racks, Panels, and Associated Equipment (rack standard)
- ITU-T G.652.D — Characteristics of Single-Mode Optical Fibre (OS2)
- IEEE 802.3bs-2017 — 400 Gigabit Ethernet
- RFC 5424 — The Syslog Protocol

**Software:**
- Kubernetes Documentation — k3s (Rancher) edge deployment
- Prometheus / Grafana — open-source monitoring stack
- NVIDIA DCGM — Data Center GPU Manager documentation
- JupyterHub — Zero to JupyterHub on Kubernetes (Project Jupyter)
- Slurm Workload Manager — SchedMD documentation
- Ray — Anyscale Ray distributed computing framework documentation

**Research and industry:**
- DOE/LBNL — United States Data Center Energy Usage Report (2024)
- Uptime Institute — Data Center Efficiency Benchmarks
- Open Compute Project (OCP) — OAM (Open Accelerator Module) specification
- NREL — Solar resource data and capacity factor analysis

---

*All specifications in this module require review by a licensed Professional Engineer before use in physical installations. High-voltage DC electrical systems present lethal hazards that require qualified personnel for all installation, commissioning, and maintenance operations.*
