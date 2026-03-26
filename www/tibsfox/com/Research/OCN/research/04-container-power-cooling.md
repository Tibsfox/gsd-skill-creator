# Container, Power, Cooling, and Compute Systems

> **Domain:** Physical Infrastructure & Systems Integration
> **Module:** 4 -- Open Compute Node: Structural Modifications, Power Distribution, Dual-Purpose Cooling, and Rack Integration
> **Through-line:** *The cooling loop does two jobs simultaneously: it keeps the GPUs alive, and it purifies water for the community. The waste heat from computation drives the efficiency of the reverse osmosis process. Physics that would otherwise be a thermal management problem becomes infrastructure that gives back.*

---

## Table of Contents

1. [Container Structural Modifications](#1-container-structural-modifications)
2. [Internal Zone Layout](#2-internal-zone-layout)
3. [Wall Penetrations](#3-wall-penetrations)
4. [Power Distribution System](#4-power-distribution-system)
5. [Liquid Cooling System](#5-liquid-cooling-system)
6. [Dual-Purpose Integration: Cooling and Water Filtration](#6-dual-purpose-integration-cooling-and-water-filtration)
7. [Compute Rack Integration](#7-compute-rack-integration)
8. [Network Architecture](#8-network-architecture)
9. [Environmental Control Systems](#9-environmental-control-systems)
10. [Cross-References](#10-cross-references)
11. [Sources](#11-sources)

---

## 1. Container Structural Modifications

### 1.1 Floor Reinforcement

The GB200 NVL72 rack weighs approximately 1,360 kg (3,000 lbs) — roughly twice the load of a standard server rack. Standard marine plywood ISO container floors are not rated for concentrated point loads from rack feet.

**Specification:**
- 6mm steel plate overlay, full container length, welded to floor framing
- Rack foot contact plates: 150mm × 150mm × 12mm steel plates at each leg position
- Connecting welds: continuous fillet weld around perimeter of contact plates
- Total floor reinforcement weight: ~500 kg
- New floor load rating (point): sufficient for 1,360 kg rack per foot contact area

### 1.2 Thermal Envelope

| Layer | Material | Specification |
|-------|----------|---------------|
| Walls (exterior → interior) | Corten steel + closed-cell spray foam + vapor barrier + interior panel | R-13 minimum |
| Ceiling | Corten steel + closed-cell spray foam + vapor barrier + ceiling panel | R-19 minimum |
| Floor | Steel plate + foam + composite panel | R-10 minimum |

**Spray foam application:** Two-component closed-cell polyurethane, applied in multiple passes to avoid thermal bridging at steel ribs. Vapor barrier is critical in humid deployment regions to prevent condensation on cold steel surfaces.

### 1.3 Rack Mounting System

- Seismic rail mounting: Unistrut or equivalent channel along full compute zone length
- Rack anchor bolts: 4× per rack, M16 minimum, into floor reinforcement plates
- Anti-tip brackets: ceiling-mounted restraint cables for earthquake zones
- Leveling feet: adjustable ±50mm to accommodate any foundation variation

---

## 2. Internal Zone Layout

The four zones are arranged to match external connections with their primary users:

```
┌──────────────────────────────────────────────────────────┐
│ ENTRY │   POWER    │       COMPUTE ZONE        │ COOLING │
│ ZONE  │   ZONE     │    (Standard 44U Racks)   │  ZONE   │
│  2m   │   2.5m     │         5m                │  2.5m   │
│       │            │                           │         │
│ Door  │ PDU/UPS    │  ┌──┐ ┌──┐ ┌──┐ ┌──┐    │ CDU     │
│ Fire  │ Battery    │  │R1│ │R2│ │R3│ │R4│    │ Filters │
│ Supp. │ Inverter   │  │  │ │  │  │  │ │  │    │ Pumps   │
│ Mon.  │ Switchgear │  └──┘ └──┘ └──┘ └──┘    │ Waste   │
│       │            │  Hot Aisle / Cold Aisle   │ Drum    │
└──────────────────────────────────────────────────────────┘
← 2m → ← 2.5m ──→  ← ──── 5m ──────── →  ← 2.5m ──→
```

| Zone | Width | X-Position | Primary Equipment |
|------|-------|-----------|-------------------|
| Entry | 2.0 m | 0–2,000 mm | Personnel access, fire suppression, monitoring panel |
| Power | 2.5 m | 2,000–4,500 mm | PDU, battery buffer, DC-DC converter, switchgear |
| Compute | 5.0 m | 4,500–9,500 mm | GPU racks (hot/cold aisle containment) |
| Cooling | 2.5 m | 9,500–12,032 mm | CDU, filtration stages, pumps, waste drum |

**Zone rationale:**
- Cooling zone is at the north/rear because water connections are on that wall
- Power zone is near the entry because the emergency disconnect must be exterior-accessible
- Entry zone is minimal — personnel access, not storage

---

## 3. Wall Penetrations

All penetrations use weatherproof sealed fittings. Minimum six penetrations required:

| Penetration | Wall | Size | Purpose |
|-------------|------|------|---------|
| DC power input (primary) | South wall, power zone | 2" rigid conduit | Solar/BESS DC bus feed |
| DC power input (redundant) | South wall, power zone | 2" rigid conduit | Second feed path / BESS |
| Water intake | North wall, cooling zone | 2" pipe | Non-potable water input |
| Water output | North wall, cooling zone | 1.5" pipe | Potable water to community |
| Fiber optic | East wall, entry zone | 2" conduit | Network connection |
| Waste drum access | North wall, cooling zone | Hinged panel | 55-gallon drum removal/swap |
| Exhaust (heat management) | Variable | Sealed louvered panel | Air cooling exhaust paths |

**Corner casting clearance:** All penetrations must be located ≥300mm from corner casting centerlines to preserve structural integrity and stacking/lifting capability.

---

## 4. Power Distribution System

### 4.1 DC Power Architecture

The design minimizes AC-DC conversion stages by operating as a native DC system:

```
External DC Bus (1500V) ──→ Container Service Entrance
                                    │
                         Exterior Disconnect Switch
                                    │
                              Surge Protection
                                    │
                         DC-DC Converter (1500V → 48-51V)
                                    │
                              Internal Bus Bar
                                    │
              ┌─────────────────────┼─────────────────────┐
              ↓                     ↓                     ↓
        Rack 1 PDU           Rack 2 PDU           Aux Distribution
        (up to 120kW)        (up to 120kW)        (30kW: cooling,
                                                   filtration, lights,
                                                   monitoring, network)
```

### 4.2 Protection Coordination

| Level | Protection Device | Rating |
|-------|------------------|--------|
| Service entrance | DC disconnect + fused | Per solar/BESS source rating |
| Main DC bus | DC breaker | 600A at 48-51V |
| Rack feed | Current-limited PDU | Per-rack overcurrent protection |
| Outlet level | PDU per-outlet fusing | Per NEC Article requirements |
| Grounding | Equipotential bonding | Per NEC Article 250 |

**NEC compliance references:**
- Article 690: Solar photovoltaic systems (source-side protection)
- Article 706: Battery energy storage systems (BESS protection)
- Article 250: Grounding and bonding
- Article 230: Service equipment and disconnecting means

### 4.3 Emergency Disconnect

Per safety requirement S-09, the emergency power disconnect must be accessible from the exterior of the container without entering. Location: south wall, power zone, within 2m of entry door, labeled in red with "EMERGENCY POWER DISCONNECT" text minimum 25mm height.

---

## 5. Liquid Cooling System

### 5.1 Coolant Distribution Unit (CDU)

The CDU is the heart of the cooling system. It receives heated coolant from the compute racks, rejects heat (to the filtration loop or ambient), and returns conditioned coolant to the racks.

| Parameter | Specification |
|-----------|---------------|
| CDU capacity | ≥140 kW heat rejection |
| Flow rate | 80-160 GPM total (40-80 GPM per rack) |
| Coolant type | Propylene glycol/water mix (non-toxic, food-safe grade) |
| Inlet temperature | 15-25°C (deliver to rack manifolds) |
| Outlet temperature | 35-45°C (return from rack manifolds) |
| Pump configuration | Redundant pumps (N+1 minimum) |
| Location | Cooling zone, wall-mounted or floor-mounted on north wall |

### 5.2 Cooling Loop P&ID (Process Description)

```
[Non-potable water intake]
         │
         ↓
[Coarse pre-screen]
         │
         ↓
[Heat Exchanger] ←───────────────────────────────────┐
         │                                           │
         ↓                                           │
[Pump Primary] ──→ [CDU Manifold]                   │
                         │                           │
            ┌────────────┼────────────┐              │
            ↓            ↓           ↓              │
       [Rack 1      [Rack 2     [Future            │
        Cold Plate]  Cold Plate] Expansion]        │
            │            │           │              │
            └────────────┴────────────┘              │
                         │                           │
                         ↓                           │
               [CDU Return Manifold]                 │
                         │                           │
                         ↓                           │
               [Temperature Sensor] ──────────────────┘
                         │
                         ↓ (heat transfer to filtration loop)
               [to Water Filtration]
```

### 5.3 Leak Detection

Leak detection is mandatory (safety requirement S-05) and covers 100% of liquid-carrying pipe runs:

- Rope-style water detection sensors routed along all coolant pipe runs
- Sensor locations: under CDU, under rack manifold connections, along floor-level pipe routes
- Control action: automatic pump shutoff and alarm on detection
- Monitoring integration: alert to remote monitoring dashboard within 60 seconds of detection

---

## 6. Dual-Purpose Integration: Cooling and Water Filtration

This is the OCN's most distinctive engineering feature. The cooling system and water filtration system share thermal infrastructure — the heat rejected from the GPUs improves filtration efficiency.

### 6.1 How It Works

1. Non-potable water enters through the intake
2. It passes through the heat exchanger, where GPU waste heat warms it
3. Warm water enters the 5-stage filtration system (warm water improves RO membrane efficiency by 8-15%)
4. Filtered potable water exits to the community distribution point
5. RO concentrate (reject water) and filtration waste go to the 55-gallon drum

### 6.2 Filtration Stages (Detail)

| Stage | Component | Operating Parameters | Notes |
|-------|-----------|---------------------|-------|
| 1 — Sediment | 5-micron pleated cartridge filter | Full flow | Protects downstream stages; monthly replacement |
| 2 — Carbon | GAC (granular activated carbon) bed | Full flow | Removes chlorine and VOCs; 6-month replacement |
| 3 — Reverse osmosis | TFC membrane module | ~30% recovery typical | Reduces TDS by >95%; produces concentrate waste |
| 4 — UV sterilization | 254nm germicidal UV lamp, ≥40 mJ/cm² | Post-RO flow | Kills bacteria/viruses/protozoa (99.99%+) |
| 5 — Mineral rebalancing | Calcite/corosex contact bed | Post-UV flow | Restores pH and minerals stripped by RO |

**Quality monitoring:** Online sensors after Stage 5 for:
- TDS (total dissolved solids) — confirms RO performance
- pH — confirms mineral rebalancing
- UV transmittance — confirms UV dose delivery
- Free chlorine (optional, for extended distribution lines)

**Automated shutoff:** If any quality sensor reading falls outside acceptable range, an automated shutoff valve closes the potable water output line and triggers an alert. Manual override requires on-site access (safety requirement S-10).

### 6.3 Waste Management

- 55-gallon steel drum (DOT 17H rated) positioned in cooling zone for easy dolly access
- Receives: RO concentrate, spent carbon fines, sediment filter waste, mineral bed residuals
- Expected fill rate: dependent on input water quality (harder water = faster fill)
- Estimated monthly swap frequency under typical conditions
- Non-hazardous classification under typical municipal water contaminants
- Licensed waste hauler removes drum, provides empty replacement
- EPA RCRA manifest system used if applicable to jurisdiction

---

## 7. Compute Rack Integration

### 7.1 GB200 NVL72 Rack Connections

Each rack requires three connection types: power, cooling, and network.

**Power connection:**
- 48-51V DC bus bar connection at rack base
- Connection rating: 120 kW per rack (NVL72) or 66 kW per rack (NVL36×2)
- PDU inside rack handles per-tray power distribution
- Power redundancy: N+N (two independent bus bar feeds)

**Cooling connection:**
- Quick-connect liquid cooling manifolds at rack rear
- Supply and return hose connections (cam-lock or equivalent)
- Per-rack flow control valve (enables rack isolation without system shutdown)
- Bleed/fill ports for rack-level coolant service

**Network connection:**
- InfiniBand cables from rack to spine switches (GPU fabric)
- 10GbE or 25GbE management network (BMC/HMC)
- Out-of-band management access (iDRAC or equivalent)

### 7.2 Rack Layout in Compute Zone

```
[Cold Aisle — 1,200mm minimum]
         ↑           ↑
     [Rack 1]    [Rack 2]     ←── Front door access (cold aisle)
         ↓           ↓
[Hot Aisle — 900mm minimum]
```

- Cold aisle faces the entry/power zone direction
- Hot aisle faces the cooling zone direction
- Cable trays: ceiling-mounted, routed from power zone through compute zone to cooling zone
- Cooling manifolds: rear of racks, connection to CDU in cooling zone

---

## 8. Network Architecture

### 8.1 Topology

```
External Fiber ──→ Splice Box ──→ Edge Router ──→ Management Switch
                                       │
                                 ┌─────┴─────┐
                                 ↓           ↓
                           Compute VLAN  Community VLAN
                                 │           │
                           InfiniBand    Community
                           Fabric        Access Point
                                 │           │
                           GPU Racks     Library/School
```

### 8.2 VLAN Segmentation

| VLAN | Purpose | Access | Routing |
|------|---------|--------|---------|
| VLAN 10 — Management | BMC/HMC, switches, CDU, sensors | Secure admin only | No external routing |
| VLAN 20 — Compute | GPU job fabric, storage | Internal workloads | Selective external access |
| VLAN 30 — Community | Library, school, municipal partner | Community endpoints | Internet access (rate-limited) |
| VLAN 40 — Monitoring | Environmental sensors, cameras | Read-only monitoring | VPN access to NOC |

**Critical isolation:** Community VLAN (30) has NO routing path to Compute VLAN (20). Physical separation at the edge router; enforced by firewall rules with default-deny between VLANs.

### 8.3 Community Compute Allocation

- 10% of total compute capacity permanently reserved (architecturally enforced, not policy-only)
- Implemented as dedicated vGPU resource pool on isolated segment
- Capacity for reference case: ~72 PFLOPS FP4 inference (10% of 720 PFLOPS)
- No user identification, no individual usage tracking, no PII collection
- Anonymous aggregate usage statistics reported to community advisory board dashboard

---

## 9. Environmental Control Systems

### 9.1 Fire Suppression

- Clean agent system: FM-200 (HFC-227ea) or Novec 1230 (FK-5-1-12)
- NFPA 75 compliant design (Standard for Fire Protection of Information Technology Equipment)
- Coverage zones: all four internal zones with independent zone valving
- Pre-discharge alarm: audible and visual, 30-second delay before agent release
- Emergency abort: pull-station inside and outside container
- System monitoring: integrated with remote monitoring dashboard

### 9.2 Temperature and Humidity Monitoring

Per ASHRAE TC 9.9 guidelines for data center thermal management:

- 8 temperature sensors minimum: 2 per zone (inlet and outlet or floor and ceiling)
- 4 humidity sensors: one per zone
- Monitoring frequency: 60-second intervals
- Alert thresholds: per ASHRAE A1 class (temperature 15-32°C intake; humidity 20-80% RH non-condensing)
- Trend logging: 90-day retention for thermal analysis

### 9.3 Access Control

- Electronic lock on container entry door with audit log
- Emergency panic bar (interior) for personnel egress
- Keypad or RFID entry (offline-capable — no network dependency for entry)
- Access log: all entries/exits with timestamp and credential ID, 12-month retention
- Remote alert on door-open event outside scheduled maintenance windows

---

## 10. Cross-References

| Project | Connection |
|---------|------------|
| [OCN Module 02](02-engineering-specifications.md) | Engineering specifications that underpin all dimensions and ratings in this module |
| [OCN Module 03](03-deployment-logistics.md) | Site preparation spec that receives the external connections defined here |
| [OCN Module 05](05-community-integration.md) | Community systems that depend on the network and water output defined here |
| [THE](../THE/index.html) | Thermal energy management — the dual-purpose cooling/filtration loop is a thermal system |
| [SYS](../SYS/index.html) | Systems administration; DCIM, monitoring, and remote management of this infrastructure |
| [HGE](../HGE/index.html) | Hydro-geothermal as alternative CDU heat sink — different heat rejection path, same loop |
| [BCM](../BCM/index.html) | Container construction techniques; structural modification and welding specifications |
| [EMG](../EMG/index.html) | Generator backup integration with the DC power distribution architecture |

---

## 11. Sources

1. ISO 668:2020 — Freight containers: Classification, dimensions and ratings
2. ISO 1496-1:2013 — Series 1 freight containers — Specification and testing
3. NVIDIA Corporation — GB200 NVL72 thermal and power specifications
4. ASHRAE TC 9.9 — Data Center Thermal Management Guidelines (2021 edition)
5. NFPA 70 (NEC 2023) — National Electrical Code, Articles 230, 250, 690, 706
6. NFPA 75 — Standard for the Fire Protection of Information Technology Equipment
7. EPA 40 CFR Part 141 — National Primary Drinking Water Regulations
8. UPC/IPC — Uniform Plumbing Code / International Plumbing Code (jurisdiction-dependent)
9. ISA 5.1-2009 — Instrumentation Symbols and Identification
10. DOT 49 CFR Part 178.118 — Specifications for 55-gallon steel drums (DOT 17H)

> **PROFESSIONAL ENGINEER REVIEW REQUIRED**
> This specification is a conceptual design produced by AI-assisted engineering analysis. It has NOT been reviewed or stamped by a licensed Professional Engineer (PE). Before any construction, fabrication, or installation, all structural, electrical, mechanical, and plumbing designs must be verified by licensed professionals in the jurisdiction of deployment.
