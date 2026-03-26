# Vision and System Architecture

> **Domain:** Infrastructure Vision & System Design
> **Module:** 1 -- Open Compute Node: The Net-Positive Vision and System Architecture
> **Through-line:** *A shipping container arrives by rail, connects two lines, and begins giving back more than it takes — clean water, clean energy, free compute, and a canvas for community art. This is what infrastructure looks like when it serves the community it lives in.*

---

## Table of Contents

1. [The Core Vision: Deploy, Connect, Compute, Return](#1-the-core-vision-deploy-connect-compute-return)
2. [The Problem Statement: Extractive vs. Net-Positive Infrastructure](#2-the-problem-statement-extractive-vs-net-positive-infrastructure)
3. [System Architecture: The 8 Layers](#3-system-architecture-the-8-layers)
4. [Module Dependency Map](#4-module-dependency-map)
5. [The Container as Form Factor](#5-the-container-as-form-factor)
6. [External View: Connections and Community Surface](#6-external-view-connections-and-community-surface)
7. [Internal Layout: Four Zones](#7-internal-layout-four-zones)
8. [The GB200 NVL72 Reference Case](#8-the-gb200-nvl72-reference-case)
9. [Scope Boundaries](#9-scope-boundaries)
10. [Success Criteria Overview](#10-success-criteria-overview)
11. [The Through-Line: Openness as Philosophy](#11-the-through-line-openness-as-philosophy)
12. [Cross-References](#12-cross-references)
13. [Sources](#13-sources)

---

## 1. The Core Vision: Deploy, Connect, Compute, Return

**Deploy → Connect → Compute → Return.**

A fully assembled Open Compute Node arrives at a prepared site via standard intermodal logistics (rail, truck, or ship). External connections are made: renewable power input, non-potable water intake, filtered water output, network fiber. The node self-tests, comes online, allocates its community compute share, and begins operation. Monthly maintenance consists of swapping the waste drum and routine hardware checks.

The node gives back:
- **Clean water** — non-potable input, potable output, continuous and free
- **Free compute** — minimum 10% of capacity to the local library, school, or municipal partner
- **Community art** — the container exterior is a canvas designed by local schoolchildren before deployment
- **Clean energy excess** — surplus solar power during low-compute periods returned to the local grid

---

## 2. The Problem Statement: Extractive vs. Net-Positive Infrastructure

Modern AI infrastructure has a structural problem: it extracts from the communities it occupies.

| Problem | Current Reality | OCN Response |
|---------|----------------|-------------|
| **Extractive power** | Data centers consume GWs from the grid | 100% renewable, on-site generation |
| **Water consumption** | Millions of gallons evaporated annually | Input dirty water, output clean water |
| **Land use** | Acres of asphalt and concrete | Single container + adjacent solar array |
| **Proprietary design** | Sold as products, never shared as blueprints | Open-source, CC BY-SA 4.0 + MIT |
| **Geographic concentration** | AI compute in 5 metro areas | Rail-corridor deployment to underserved regions |
| **Community extraction** | Hires no one local; pays minimal tax | Free compute + clean water + art |

The NVIDIA GB200 NVL72 serves as the reference case not because it's the only option, but because it represents the most demanding current scenario: 120kW continuous draw, mandatory liquid cooling. If the design works for this, it works for anything less demanding.

---

## 3. System Architecture: The 8 Layers

The Open Compute Node is designed as a layered system, where higher layers depend on lower layers being functional:

| Layer | Name | Function |
|-------|------|---------|
| **Layer 7** | Community Services | Library/school compute access, monitoring dashboard |
| **Layer 6** | Compute Payload | GPU racks, networking, storage |
| **Layer 5** | Cooling & Water | CDU, filtration, waste management |
| **Layer 4** | Power Systems | Solar/wind/battery, PDU, inverters |
| **Layer 3** | Environmental Control | HVAC, fire suppression, leak detection |
| **Layer 2** | Structural | Container modifications, rack mounting, cable management |
| **Layer 1** | Site Infrastructure | Foundation, external connections, fiber |
| **Layer 0** | Logistics | Rail corridor mapping, deployment planning |

The architecture maps to the Amiga chipset model: each layer is a specialized component with defined interfaces to adjacent layers. Power (Layer 4) feeds Cooling (Layer 5) feeds Compute (Layer 6) feeds Services (Layer 7). No layer can function without the ones below it.

---

## 4. Module Dependency Map

```
Community Services (L7) ──→ Compute Payload (L6)
         │                          │
         │                   ┌─────┴─────┐
         │                   ↓           ↓
         │              Cooling (L5)   Power (L4)
         │                   │              │
         │                   ↓              ↓
         └──→ Environmental Control (L3) ←──┘
                      │
                      ↓
               Structural Mods (L2)
                      │
                      ↓
              Site Infrastructure (L1)
                      │
                      ↓
                  Logistics (L0)
```

**Critical cross-layer connections:**
- Power → Cooling: CDU pumps draw from power distribution
- Cooling → Compute: Liquid cooling manifolds connect to rack cold plates
- Cooling → Water Filtration: Cooling loop waste heat drives filtration efficiency
- Water Filtration → Community: Clean water output piped to community use
- Compute → Community: Allocated compute capacity via network

---

## 5. The Container as Form Factor

The **40ft High Cube ISO container** (ISO 668) is the foundational form factor. Selection rationale:

- **Global logistics compatibility**: Every rail system, port crane, and flatbed truck in the world handles this container
- **Maximum internal volume**: 40ft High Cube provides the most volume while fitting standard intermodal
- **Extra height**: 30cm additional internal height (2.695m vs 2.39m standard) critical for rack clearance
- **Open standard**: ISO 668 and ISO 1496-1 are public specifications, freely available, widely manufactured

The container becomes the deployment unit: it leaves the factory fully assembled and tested, ships to any site with rail access, connects two lines, and operates.

---

## 6. External View: Connections and Community Surface

```
┌─────────────────────────────────────────────────────────┐
│  ╔══════════════════════════════════════════════════╗    │
│  ║         COMMUNITY MURAL ART SURFACE             ║    │
│  ║     (designed by local community before          ║    │
│  ║      deployment, painted at factory)             ║    │
│  ╚══════════════════════════════════════════════════╝    │
│                                                         │
│  40ft High Cube ISO Container (12.03m × 2.35m × 2.69m) │
│                                                         │
│  [SOLAR IN]  [WATER IN]  [WATER OUT]  [FIBER]  [WASTE]  │
│      ↓            ↓           ↑          ↕        ↑     │
│   Renewable    Non-potable  Potable    Network   55-gal  │
│   Power        Water        Water      Uplink    Drum    │
└─────────────────────────────────────────────────────────┘
```

The container has exactly five external connections:
1. Renewable power input (solar/wind array from adjacent site)
2. Non-potable water intake (agricultural runoff, stream, municipal non-potable)
3. Potable water output (EPA-compliant, piped to community use)
4. Network fiber (connection to internet and local network)
5. Waste drum access (55-gallon drum, monthly swap)

The community mural occupies the long sides of the container — approximately 96m² of canvas designed by local artists before deployment.

---

## 7. Internal Layout: Four Zones

```
┌──────────────────────────────────────────────────────────┐
│ ENTRY │   POWER    │       COMPUTE ZONE        │ COOLING │
│ ZONE  │   ZONE     │    (Standard 44U Racks)   │  ZONE   │
│  2m   │   2.5m     │         5m                │  2.5m   │
│       │            │                           │         │
│ Door  │ PDU/UPS    │  ┌──┐ ┌──┐ ┌──┐ ┌──┐    │ CDU     │
│ Fire  │ Battery    │  │R1│ │R2│ │R3│ │R4│    │ Filters │
│ Supp. │ Inverter   │  │  │ │  │ │  │ │  │    │ Pumps   │
│ Mon.  │ Switchgear │  └──┘ └──┘ └──┘ └──┘    │ Waste   │
│       │            │  Hot Aisle / Cold Aisle   │ Drum    │
└──────────────────────────────────────────────────────────┘
← 2m → ← 2.5m ──→  ← ──── 5m ──────── →  ← 2.5m ──→
```

| Zone | Width | Purpose |
|------|-------|---------|
| **Entry Zone** | 2m | Personnel access, fire suppression equipment, monitoring systems |
| **Power Zone** | 2.5m | PDU, battery buffer, inverter, switchgear, emergency disconnect |
| **Compute Zone** | 5m | Server racks in hot/cold aisle containment |
| **Cooling Zone** | 2.5m | CDU, filtration stages, pumps, waste drum |

The layout is intentional: the cooling zone is at the back because the water connections are on the north wall. The power zone is near the entry because the emergency disconnect must be accessible from outside.

---

## 8. The GB200 NVL72 Reference Case

The NVIDIA GB200 NVL72 represents the most demanding current AI compute configuration:

| Parameter | Value |
|-----------|-------|
| GPUs per rack | 72 × Blackwell |
| CPUs per rack | 36 × Grace (ARM) |
| FP4 inference performance | 720 PFLOPS |
| Rack power consumption | ~120 kW |
| Cooling type | Mandatory liquid cooling (direct-to-chip) |
| Rack weight | ~1,360 kg (3,000 lbs) |
| NVLink GPU bandwidth | 1.8 TB/s |
| Total GPU memory | 13.8 TB per rack |

The OCN reference design uses **2 GB200 NVL72 racks** — 240 kW of compute in a single shipping container. Total facility load including overhead systems: **~300 kW continuous** (requiring separate BESS container and ~1.5–2.5 acres of solar).

**Important:** The design is adaptable to any compute. The GB200 NVL72 is the design constraint, not the only option. Smaller clusters, different GPU generations, or CPU-only workloads fit more easily.

---

## 9. Scope Boundaries

### In Scope (v1.0)
- Complete mechanical specification for 40ft HC container modifications
- Power system design: solar + battery + wind for 150kW continuous
- Liquid cooling system with integrated water filtration
- GB200 NVL72 reference rack layout (adaptable)
- US rail corridor deployment mapping (top candidate sites)
- Community compute allocation architecture
- Mural art program design guidelines
- Bill of Materials with commodity component specifications
- 55-gallon waste management system specification
- Network architecture (fiber connection to rack)

### Out of Scope (Future)
- Manufacturing process engineering (scale production)
- Regulatory compliance per specific jurisdiction
- Specific community partnership agreements (legal/political)
- Grid interconnection engineering (power export)
- Multi-node clustering
- Seismic/hurricane hardening variants
- Maritime or international deployment

---

## 10. Success Criteria Overview

1. **Dimensional fit:** All components fit within ISO 668 internal dimensions with maintenance access
2. **Power self-sufficiency:** Renewable energy provides 150kW at 99.5% uptime (modeled on Tucson NREL TMY3)
3. **Thermal balance:** All compute components within manufacturer specs with 10% safety margin
4. **Water quality:** Output meets EPA 40 CFR Part 141 (National Primary Drinking Water Standards)
5. **Waste containment:** All byproducts in single 55-gallon drum, monthly swap
6. **Weight compliance:** Total within ISO container structural limits
7. **Community compute:** 10% allocation architecture functional and documented
8. **Open specification:** CC BY-SA 4.0 (documents) + MIT (code)
9. **Blueprint completeness:** Technical drawings cover all assemblies with dimensions
10. **Safety compliance:** PE review disclaimer on all specifications; NEC 2023 referenced; UPC/IPC referenced
11. **Logistics viability:** 20+ candidate deployment sites along US rail corridors
12. **Modular upgradeability:** Compute, power, and filtration all independently replaceable

---

## 11. The Through-Line: Openness as Philosophy

The original Amiga shipped with its full hardware reference manual in the box. Commodore published the register maps, the DMA timings, the custom chip specifications — everything needed to push the hardware beyond what its creators imagined.

The Open Compute Node publishes everything: structural modifications, power calculations, cooling loop specifications, water filtration stages, rack layouts. Not because openness is fashionable, but because openness is how you get a 12-year-old in a small town to look at a blueprint and think "I could build that."

The Space Between argues that consciousness emerges from the interaction between physical substrate and mathematical structure. The Open Compute Node is that argument made literal — mathematical computation emerging from physical infrastructure that improves the physical world it inhabits.

---

## 12. Cross-References

| Project | Connection |
|---------|------------|
| [OCN Module 02](02-engineering-specifications.md) | Dimensional and performance data that validate the architecture |
| [OCN Module 03](03-deployment-logistics.md) | Site selection and rail corridor deployment |
| [SYS](../SYS/index.html) | Systems administration of the deployed node infrastructure |
| [THE](../THE/index.html) | Thermal energy management; the cooling loop is a thermal system |
| [HGE](../HGE/index.html) | Hydro-geothermal cooling as an alternative to air/water cooling |
| [EMG](../EMG/index.html) | Generators as backup power systems |
| [NND](../NND/index.html) | New New Deal: rail corridor deployment as economic development infrastructure |
| [BCM](../BCM/index.html) | Container construction and structural modification principles |

---

## 13. Sources

1. ISO 668:2020 — Freight containers: Classification, dimensions and ratings
2. ISO 1496-1:2013 — Series 1 freight containers — Specification and testing
3. NVIDIA Corporation — GB200 NVL72 specifications and DGX user guide
4. DOE/LBNL — Data Center Energy Efficiency (Lawrence Berkeley National Laboratory)
5. NREL — Solar irradiance data and capacity factors (National Renewable Energy Laboratory)
6. ASHRAE TC 9.9 — Data center thermal management guidelines
7. NFPA 70 (NEC 2023) — National Electrical Code
8. EPA 40 CFR Part 141 — National Primary Drinking Water Regulations
9. SemiAnalysis — GB200 hardware architecture deep dive
10. Dgtl Infra — Modular data center market analysis

> **PROFESSIONAL ENGINEER REVIEW REQUIRED**
> This specification is a conceptual design produced by AI-assisted engineering analysis. It has NOT been reviewed or stamped by a licensed Professional Engineer (PE). Before any construction, fabrication, or installation, all structural, electrical, and plumbing designs must be verified by licensed professionals in the jurisdiction of deployment.
