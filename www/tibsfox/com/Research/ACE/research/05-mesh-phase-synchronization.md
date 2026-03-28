# Mesh & Phase Synchronization -- Large-Scale Cluster Computing

> **Domain:** Compute Engine Layer 5
> **Module:** 5 -- The Infrastructure Layer
> **Through-line:** *A 10-node mesh cluster achieves phase coherence the same way a frog chorus does -- each node listens before speaking, phase offsets self-correct through distributed feedback, and the whole system locks into synchrony without a central conductor.* The cluster is not a datacenter. It is a living system that synchronizes like biology, not like clockwork.

---

## Table of Contents

1. [10-Node GSD Cluster Topology](#1-10-node-gsd-cluster-topology)
2. [Node Type Taxonomy](#2-node-type-taxonomy)
3. [Bus Technology Selection](#3-bus-technology-selection)
4. [Network Architecture](#4-network-architecture)
5. [PTP: IEEE 1588 Precision Time Protocol](#5-ptp-ieee-1588-precision-time-protocol)
6. [FLTS Consensus-Based Synchronization](#6-flts-consensus-based-synchronization)
7. [Frog Chorus Phase Coherence Protocol](#7-frog-chorus-phase-coherence-protocol)
8. [MPI Message Passing Patterns](#8-mpi-message-passing-patterns)
9. [Inter-Node DMA](#9-inter-node-dma)
10. [Partial Failure Handling](#10-partial-failure-handling)
11. [Solar Power Budget for Self-Sufficient Operation](#11-solar-power-budget-for-self-sufficient-operation)
12. [PNW Summer Cooling at Scale](#12-pnw-summer-cooling-at-scale)
13. [Cross-References](#13-cross-references)
14. [Sources](#14-sources)

---

## 1. 10-Node GSD Cluster Topology

From the GSD mesh prototype specification and the Amiga node taxonomy [1]:

```
GSD 10-NODE MESH CLUSTER TOPOLOGY
================================================================

  ┌──────────┐     ┌──────────┐
  │ Agnus-0  │────│ Agnus-1  │  Mission control pair
  │ (master) │     │ (standby)│  Token budget, orchestration
  └────┬─────┘     └────┬─────┘
       │                │
  ─────┼────────────────┼─────────── 25GbE Backbone
       │                │
  ┌────┴─────┐    ┌────┴─────┐
  │ Paula-0  │    │ Paula-1  │     I/O gateway pair
  │ (API gw) │    │ (store)  │     External API, storage
  └────┬─────┘    └────┬─────┘
       │                │
  ─────┼────────────────┼─────────── 25GbE / 10GbE Mixed
       │                │
  ┌────┴─────┐    ┌────┴─────┐
  │ Denise-0 │    │ Denise-1 │     GPU compute pair
  │ 2x 5090  │◄──│ 2x 5090  │     NVLink within, 25GbE between
  └────┬─────┘ NV └────┬─────┘
       │   Link        │
  ─────┼────────────────┼─────────── 10GbE Worker Network
       │    │    │      │
  ┌────┴─┐┌─┴──┐┌┴───┐┌┴────┐
  │68K-0 ││68K-1││68K-2││68K-3│    General compute workers
  │      ││     ││     ││     │    Claude API routing
  └──────┘└─────┘└─────┘└─────┘    Compilation, analysis
```

The topology is a hybrid mesh-star: Agnus nodes form the core star with all other nodes connecting to them, while Denise nodes have additional NVLink peer connections for GPU-to-GPU communication.

---

## 2. Node Type Taxonomy

| Node Type | Amiga Role | Count | Function |
|-----------|-----------|-------|----------|
| Agnus-class | DMA + Orchestration | 2 | Mission control; skill-creator primary; token budget master |
| Denise-class | Display + Render | 2 | GPU-heavy inference; shader compilation; WebGL serve [M4] |
| Paula-class | I/O + Audio | 2 | MCP bridge nodes; external API gateway; storage I/O |
| 68000-class | General CPU | 4 | General compute; Claude API routing; compilation workers |

### Hardware Specifications per Node Type

| Node Type | CPU | RAM | GPU | Storage | NIC |
|-----------|-----|-----|-----|---------|-----|
| Agnus | Ryzen 9 7950X | 128 GB DDR5 | None (CPU-only) | 2TB NVMe RAID 1 | 25GbE SFP+ |
| Denise | i7-14700K | 64 GB DDR5 | 2x RTX 5090 (NVLink) | 4TB NVMe | 25GbE SFP+ |
| Paula | Ryzen 7 7700 | 64 GB DDR5 | None | 8TB NVMe + 40TB HDD | 25GbE SFP+ |
| 68000 | i5-14600K | 32 GB DDR5 | RTX 4060 Ti (8GB) | 1TB NVMe | 10GbE |

### Role Justification

**Agnus (2 nodes):** High CPU and RAM for orchestration. No GPU needed -- Agnus routes work, not computes it. RAID 1 storage for state durability. The standby node provides failover for the mission-critical orchestration role.

**Denise (2 nodes):** Dual RTX 5090 per node for GPU-heavy workloads. NVLink bridge within each node for peer-to-peer VRAM. These nodes run LoRA adapter training, shader compilation, and GPU inference [M4].

**Paula (2 nodes):** Massive storage for data lakes, model weights, and artifact archives. The API gateway node handles all external network traffic (Claude API, MCP servers, DoltHub federation). The storage node handles local persistence.

**68000 (4 nodes):** General-purpose workers for compilation, analysis, and Claude API routing. The RTX 4060 Ti provides lightweight GPU capability for local inference without the power draw of the 5090.

---

## 3. Bus Technology Selection

| Technology | Bandwidth | Latency | Cost/Port | GSD Fit |
|-----------|-----------|---------|-----------|---------|
| NVLink NVSwitch | 900 GB/s | <1 us | Included in GPU | GPU-to-GPU only; Denise-to-Denise pairs [M4] |
| InfiniBand HDR | 200 Gb/s | <1 us | $1,200+ | Ideal for Agnus-Agnus; high cost |
| 25GbE SFP+ | 25 Gb/s | <10 us | $150 | Recommended for Agnus/Paula/Denise backbone |
| 10GbE (10GBASE-T) | 10 Gb/s | 10-30 us | $50 | Cost-effective for 68000 workers |

### Recommended Architecture

NVLink bridges within dual-GPU Denise nodes. 25GbE SFP+ for the backbone connecting Agnus, Paula, and Denise nodes. 10GbE for 68000-class workers. Total inter-node switch: managed 24-port with mixed 25GbE/10GbE, jumbo frames enabled (9000 MTU) [2].

```
BUS TECHNOLOGY ASSIGNMENT
================================================================

  Denise-0 ◄── NVLink 900GB/s ──► Denise-0 GPU pair (intra-node)
  Denise-1 ◄── NVLink 900GB/s ──► Denise-1 GPU pair (intra-node)

  Agnus-0  ◄── 25GbE SFP+ ──► Managed Switch
  Agnus-1  ◄── 25GbE SFP+ ──► Managed Switch
  Denise-0 ◄── 25GbE SFP+ ──► Managed Switch
  Denise-1 ◄── 25GbE SFP+ ──► Managed Switch
  Paula-0  ◄── 25GbE SFP+ ──► Managed Switch
  Paula-1  ◄── 25GbE SFP+ ──► Managed Switch

  68000-0  ◄── 10GbE ──► Managed Switch
  68000-1  ◄── 10GbE ──► Managed Switch
  68000-2  ◄── 10GbE ──► Managed Switch
  68000-3  ◄── 10GbE ──► Managed Switch
```

---

## 4. Network Architecture

### VLAN Segmentation

| VLAN | Name | Nodes | Purpose |
|------|------|-------|---------|
| 10 | Control | Agnus-0, Agnus-1 | Orchestration traffic, phase signals |
| 20 | Compute | Denise-0, Denise-1, 68000-* | GPU workload distribution |
| 30 | Storage | Paula-0, Paula-1 | Data lake access, model weights |
| 40 | External | Paula-0 (gateway) | Internet, Claude API, MCP servers |

### Security Boundaries

- **VLAN 40 (External):** Only Paula-0 has internet access. All external API calls route through Paula-0.
- **VLAN 10 (Control):** Isolated from compute and storage. Phase signals and budget updates only.
- **Inter-VLAN routing:** Agnus nodes route between VLANs. No direct compute-to-external traffic.

> **SAFETY WARNING:** All inter-node communication must be authenticated. No unauthenticated DMA across node boundaries. TLS 1.3 minimum for all network traffic. SSH key-based authentication for management access.

---

## 5. PTP: IEEE 1588 Precision Time Protocol

PTP provides sub-microsecond time synchronization across the cluster [3]:

### Architecture

```
PTP SYNCHRONIZATION HIERARCHY
================================================================

  GPS/NTP Reference Clock
       |
       v
  ┌──────────────────┐
  │ Agnus-0          │  PTP Grandmaster
  │ (PTP GM)         │  Hardware timestamping NIC
  └────────┬─────────┘
           |
  ┌────────┼───────────────────────────┐
  │        │                           │
  │  ┌─────┴─────┐              ┌─────┴─────┐
  │  │ Agnus-1   │  PTP Slave   │ Denise-0  │
  │  │ (BC)      │              │ (Slave)   │
  │  └─────┬─────┘              └───────────┘
  │        │
  │  ┌─────┴─────┐
  │  │ 68000-*   │  PTP Slaves
  │  │ (Slaves)  │
  │  └───────────┘
  └────────────────────────────────────────────┘
```

### PTP Timing Accuracy

| Component | Accuracy |
|-----------|----------|
| GPS-disciplined reference | <100 ns |
| PTP with HW timestamps | <1 us |
| PTP with SW timestamps | <10 us |
| NTP (comparison) | 1-10 ms |

For GSD wave synchronization, PTP's sub-microsecond accuracy is overkill -- wave boundaries operate at second-scale granularity. However, PTP provides the foundation for future real-time applications (DMX512 lighting sync [SGL M5], audio sample clock) where microsecond accuracy matters.

---

## 6. FLTS Consensus-Based Synchronization

FLTS (Fast and Low-overhead Time Synchronization) is designed for mesh-star hybrid architectures [4]:

### Two-Layer Approach

**Layer 1 -- Mesh synchronization:** Routing nodes (Agnus, Paula) synchronize via average consensus algorithm. Each node exchanges timestamps with neighbors, and all nodes converge to a common time reference through iterative averaging.

**Layer 2 -- Star broadcast:** Edge routing nodes (Agnus) broadcast synchronized time to leaf nodes (68000 workers) with two consecutive packets. The two-packet method eliminates the need for round-trip delay measurement.

### Convergence Properties

| Property | FLTS | CCTS (cluster-head) | NTP |
|----------|------|---------------------|-----|
| Convergence speed | Fast (O(log N)) | Medium (O(N)) | Slow |
| Communication overhead | Low | Medium | Low |
| Single point of failure | None (consensus) | Yes (cluster head) | Yes (stratum 1) |
| Accuracy | 10-100 us | 1-10 ms | 1-10 ms |

FLTS achieves faster convergence speed than cluster-head-based approaches (CCTS) while reducing communication overhead [4]. For GSD, the key advantage is the elimination of single points of failure -- if Agnus-0 goes down, the consensus algorithm re-converges using Agnus-1 as reference.

---

## 7. Frog Chorus Phase Coherence Protocol

Phase synchronization modeled on frog chorus dynamics [5]:

### Biological Model

In a frog chorus, each frog adjusts its call timing based on what it hears from neighbors. No conductor. No central clock. Each frog follows a simple rule: listen, then speak. The result is emergent synchrony -- hundreds of frogs calling in near-perfect phase.

```
FROG CHORUS PROTOCOL -- GSD IMPLEMENTATION
================================================================

  Phase cycle (wave boundary):

  t=0    Agnus-0 emits PHASE_READY signal
  t+d1   68000-0 hears signal, adjusts its local phase
  t+d2   68000-1 hears signal, adjusts
  t+d3   Denise-0 hears signal, adjusts
  ...
  t+D    All nodes synchronized (D = max propagation delay)

  Adjustment rule (per node):
    phase_correction = alpha * (received_time - expected_time)
    local_phase += phase_correction

  alpha = 0.3 (damping factor, prevents oscillation)
```

### GSD Application

The frog chorus protocol governs wave boundary synchronization: agents in Wave N complete before Wave N+1 begins, with Agnus-class nodes as phase reference [M3].

- **Phase reference:** Agnus-0 emits PHASE_COMPLETE when all Wave N agents report done
- **Phase adjustment:** Each agent adjusts its "expected next phase" based on observed timing
- **Damping:** Alpha=0.3 prevents oscillation from network jitter
- **Convergence:** 3-5 cycles to achieve stable phase lock across all 10 nodes

### Comparison to Rigid Synchronization

| Aspect | Rigid (barrier) | Frog Chorus |
|--------|-----------------|-------------|
| Latency | Worst-case agent | Average + damping |
| Failure handling | Deadlock if one agent hangs | Timeout + phase skip |
| Scalability | Degrades linearly | Near-constant (logarithmic) |
| Biological model | None | Frog chorus, firefly sync |

---

## 8. MPI Message Passing Patterns

Jefferson Lab's Lattice QCD mesh architecture provides the relevant template for GSD inter-node communication [6]:

### Nearest-Neighbor Communication

Each node has defined neighbors in the topology graph. Nearest-neighbor communication dominates -- most data flows between adjacent layers in the GSD architecture (Agnus↔Denise, Denise↔68000, etc.).

| Pattern | Description | GSD Use Case |
|---------|-------------|-------------|
| Point-to-point | Node A sends to Node B | DACP bundle handoff [M3] |
| Broadcast | One node sends to all | Phase signal distribution |
| Reduce | All nodes contribute to one result | Wave completion aggregation |
| All-reduce | All nodes contribute, all receive result | Consensus time synchronization |
| Scatter/Gather | Distribute work, collect results | Wave 1 parallel track distribution |

### Buffer Sizing

From Jefferson Lab: 64KB buffering per link; host overhead per send+receive must be <=2 us for repetitive patterns [6]. For GSD, the relevant metric is DACP bundle size:

| Bundle Type | Typical Size | Buffer Requirement |
|------------|-------------|-------------------|
| Phase signal | <1 KB | Trivial |
| DACP intent | 2-5 KB | Single buffer |
| DACP data | 10-100 KB | Multiple buffers |
| DACP code (artifacts) | 100 KB - 10 MB | DMA transfer |
| Model weights | 1-10 GB | Streaming transfer |

---

## 9. Inter-Node DMA

DMA-style transfers bypass the main message bus for high-bandwidth workloads [1]:

```
INTER-NODE DMA PATHS
================================================================

  Standard path (through Agnus routing):
  Denise-0 ──> Agnus-0 ──> Paula-1 (storage)
  Latency: 3 hops, ~100 us

  DMA path (direct):
  Denise-0 ──────────────> Paula-1 (storage)
  Latency: 1 hop, ~30 us

  DMA use cases:
  - Model weight transfer (Denise ← Paula): GB-scale, latency-tolerant
  - Compiled shader deployment (Denise → Denise): NVLink peer, <1 us
  - Artifact archival (any → Paula): background, non-blocking
```

### DMA Authorization

All DMA transfers require pre-authorization from Agnus [M3]. The DMA request specifies source, destination, size, and priority. Agnus validates the request against the current wave plan and budget allocation before issuing a DMA grant token.

> **SAFETY WARNING:** Unauthenticated DMA across node boundaries is a security risk. Every DMA transfer must carry a signed authorization token from Agnus. Tokens expire after 60 seconds. Replay protection via monotonic sequence numbers.

---

## 10. Partial Failure Handling

The cluster must handle node failures without losing mission state [7]:

### Failure Scenarios

| Scenario | Detection | Response |
|----------|-----------|----------|
| 68000 worker crash | Heartbeat timeout (30s) | Reassign tasks to remaining workers |
| Denise GPU fault | CUDA error callback | Migrate GPU workload to partner Denise node |
| Paula storage failure | Filesystem health check | Failover to partner Paula node (RAID) |
| Agnus-0 failure | PTP clock drift detection | Promote Agnus-1 to primary |
| Network partition | FLTS consensus divergence | Partition-aware scheduling |
| Total power loss | UPS low-battery signal | Graceful shutdown, state checkpoint |

### State Checkpointing

Every wave boundary triggers a state checkpoint [M3]:

1. All active DACP bundles written to Paula-class storage
2. Token budget ledger persisted to both Agnus nodes
3. Phase state written to control bus
4. Git commit on all active worktrees (if applicable)

Recovery from checkpoint: Agnus reads last checkpoint, compares against expected wave state, and resumes from the last completed wave boundary.

---

## 11. Solar Power Budget for Self-Sufficient Operation

For PNW self-sufficient cluster operation [8]:

### Power Draw Analysis

| Component | Count | Per-Unit (W) | Total (W) |
|-----------|-------|-------------|-----------|
| Denise nodes (dual 5090) | 2 | 1,400 | 2,800 |
| Agnus nodes (CPU-only) | 2 | 250 | 500 |
| Paula nodes (storage) | 2 | 200 | 400 |
| 68000 nodes (4060 Ti) | 4 | 350 | 1,400 |
| Network switch | 1 | 50 | 50 |
| Cooling overhead (est.) | -- | -- | 500 |
| **Total cluster draw** | | | **5,650W** |

### Solar Array Sizing

| Parameter | Winter | Summer |
|-----------|--------|--------|
| Peak sun hours/day | 3h | 6h |
| Daily energy need (8h burst) | 45.2 kWh | 45.2 kWh |
| Panel requirement | 15.1 kW | 7.5 kW |
| Panel with 20% margin | 18 kW | 9 kW |
| Battery bank (1x daily) | 50 kWh LFP | 50 kWh LFP |

### Practical Considerations

- **Winter operation:** 18 kW of solar panels is substantial (~45 panels at 400W each). Winter-only burst mode or grid supplementation may be necessary.
- **Summer operation:** 9 kW is feasible for a residential installation (~23 panels). PNW summer provides excellent solar resource with long daylight hours.
- **Battery chemistry:** LFP (Lithium Iron Phosphate) recommended for cycle life and safety. No thermal runaway risk.
- **Grid-tied fallback:** Net metering allows summer solar surplus to offset winter grid consumption.

---

## 12. PNW Summer Cooling at Scale

### Cluster Thermal Load

Total cluster heat dissipation: 5,650W (all energy consumed becomes heat). This is equivalent to two space heaters running continuously.

### Cooling Strategy

| Strategy | Approach | Suitability |
|----------|----------|-------------|
| Dedicated room | Insulated server room with exhaust to exterior | Best for noise and heat management |
| North wall intake | Cool air from shaded exterior wall | Reduces ambient temp by 3-5C |
| Liquid cooling (Denise) | 360mm AIO per GPU (4 total) | Required for RTX 5090 under sustained load |
| Exhaust fan | Industrial 12" exhaust to exterior | Removes hot air from server room |
| Duty cycle management | Limit full-cluster burst to cooler hours | Dawn and dusk compute windows |

### Heat Dome Contingency

PNW heat dome events (2021: 49.6C in Lytton, BC) require special measures:

1. **Reduce cluster load:** Shut down Denise nodes; 68000 workers only (reduce from 5,650W to 1,900W)
2. **Night computing:** Shift burst window to midnight-8am when ambient drops below 25C
3. **Emergency shutdown:** If server room exceeds 35C ambient, automated shutdown to prevent hardware damage

> **SAFETY WARNING:** Electronics operating above rated ambient temperature (typically 35C for consumer, 50C for industrial) degrade rapidly. GPU thermal throttling begins at 83C junction temperature. Sustained operation near thermal limits reduces component lifespan.

---

## 13. Cross-References

> **Related:** [Claude Code -- Agentic Architecture](01-claude-code-agentic-architecture.md) -- Multi-node Claude Code deployments require phase synchronization to maintain coherent wave execution across physical machines.

> **Related:** [GSD Chipset Orchestration](03-gsd-chipset-orchestration.md) -- The Agnus/Denise/Paula/68000 node taxonomy is defined in M3 and physically instantiated in this module.

> **Related:** [CUDA Silicon Layer](04-cuda-silicon-layer.md) -- NVLink topology within Denise nodes, dual RTX 5090 configuration, and cooling strategy scale from single-node (M4) to cluster-wide (this module).

> **Related:** [Fractal Documentation Fidelity](06-fractal-documentation-fidelity.md) -- The cluster architecture requires three-zoom documentation: executive summary (10 nodes, mesh topology), architectural overview (node types, bus selection), implementation detail (IP addresses, VLAN configs, PTP hierarchy).

**Cross-project references:**
- **CMH** (Computational Mesh): Mesh networking theory and topology design
- **SYS** (Systems Administration): Server provisioning, monitoring, and maintenance
- **K8S** (Kubernetes): Container orchestration for cluster workload management
- **SGL** (Signal & Light): Real-time synchronization for DMX512 and audio
- **MPC** (Math Co-Processor): GPU workload distribution across Denise nodes
- **GSD2** (GSD Architecture): The meta-specification for cluster deployment
- **SFC** (Skill Factory): Distributed skill compilation across cluster nodes
- **GPO** (GPU Operations): Multi-GPU programming patterns

---

## 14. Sources

1. Tibsfox. *gsdmeshprototypespec.pdf*. GSD Project Knowledge, 2026.
2. IEEE 802.3bz. *10GBASE-T and 25GBASE-T Ethernet Standards*. IEEE, 2016.
3. IEEE 1588-2019. *Precision Time Protocol (PTP)*. IEEE Standards Association, 2019.
4. PMC/IEEE. "Fast and Low-Overhead Time Synchronization for Industrial Wireless Sensor Networks with Mesh-Star Architecture." IEEE Access, 2023.
5. Strogatz, S.H. "Sync: The Emerging Science of Spontaneous Order." Hyperion, 2003.
6. Jefferson Lab. "High Performance Cluster Computing with Mesh Network." Jefferson Lab Computing, 2022.
7. Lamport, L. "The Part-Time Parliament." ACM Transactions on Computer Systems, 1998.
8. NREL. *National Solar Radiation Database -- PNW Region*. National Renewable Energy Laboratory, 2024.
9. Tibsfox. *gsd-chipset-architecture-vision.md*. GSD Project Knowledge, 2025-2026.
10. NVIDIA. "NVLink and NVSwitch Architecture." NVIDIA Data Center Solutions, 2025.
11. Tang, Z. et al. "DreamDDP: Accelerating Data Parallel Distributed LLM Training with Layer-wise Scheduled Partial Synchronization." arXiv, February 2025.
12. Mellanox/NVIDIA. *InfiniBand HDR Architecture*. NVIDIA Networking, 2023.
13. MPI Forum. *MPI: A Message-Passing Interface Standard, Version 4.0*. 2021.
14. Raspberry Pi Foundation. "Raspberry Pi Compute Module for Edge Cluster Nodes." 2024.
15. Tibsfox. *gsd-silicon-layer-spec.md*. GSD Project Knowledge, February 2026.
