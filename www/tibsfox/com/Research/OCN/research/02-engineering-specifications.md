# Engineering Specifications

> **Domain:** Structural, Electrical & Mechanical Engineering
> **Module:** 2 -- Open Compute Node: Container, Power, Cooling, and Compute Specifications
> **Through-line:** *Every number traces back to a source. Where the vision says "40ft HC container," this provides 12,032 × 2,352 × 2,695 mm. Where the vision says "EPA drinking water," this provides 40 CFR Part 141. Engineering is the discipline of replacing approximations with verified values.*

---

## Table of Contents

1. [ISO Container Specifications](#1-iso-container-specifications)
2. [Container Weight Budget](#2-container-weight-budget)
3. [NVIDIA GB200 NVL72 Compute Specifications](#3-nvidia-gb200-nvl72-compute-specifications)
4. [Power System Engineering](#4-power-system-engineering)
5. [Cooling and Water Filtration Specifications](#5-cooling-and-water-filtration-specifications)
6. [US Rail Corridor and Site Selection Data](#6-us-rail-corridor-and-site-selection-data)
7. [Standards and Code References](#7-standards-and-code-references)
8. [Key Source Organizations](#8-key-source-organizations)
9. [Safety Requirements](#9-safety-requirements)
10. [Cross-References](#10-cross-references)
11. [Sources](#11-sources)

---

## 1. ISO Container Specifications

### 1.1 40ft High Cube (ISO 668 / ISO 1496-1)

The 40ft High Cube is the foundational form factor. All internal specifications derive from these verified dimensions:

| Parameter | Metric | Imperial |
|-----------|--------|----------|
| **External Length** | 12,192 mm | 40 ft 0 in |
| **External Width** | 2,438 mm | 8 ft 0 in |
| **External Height** | 2,896 mm | 9 ft 6 in |
| **Internal Length** | 12,032 mm | 39 ft 5 in |
| **Internal Width** | 2,352 mm | 7 ft 9 in |
| **Internal Height** | 2,695 mm | 8 ft 10 in |
| **Door Opening Width** | 2,340 mm | 7 ft 8 in |
| **Door Opening Height** | 2,585 mm | 8 ft 5.5 in |
| **Tare Weight** | 3,750–4,200 kg | 8,267–9,259 lbs |
| **Max Gross Weight** | 30,480 kg | 67,197 lbs |
| **Max Payload** | ~26,300 kg | ~57,980 lbs |
| **Internal Volume** | 76.4 m³ | 2,694 cu ft |
| **Internal Floor Area** | 28.3 m² | 305 sq ft |

### 1.2 Structural Properties

- Corner castings rated for stacking (9 high loaded, or crane lift from four corners)
- Floor load rating: 7,260 kg/m (~4,893 lbs/ft) as line load
- Forklift pocket spacing: 2,050 mm center-to-center
- Material: Corten steel (weathering steel), marine plywood floor (28mm)
- Wind and water tight per ISO 1496-1 certification

### 1.3 Required Modifications for Compute Node

| Modification | Purpose |
|-------------|---------|
| Floor reinforcement (steel plate overlay) | Point loads from rack feet |
| 6+ wall penetrations (2× power, 2× water, 1× fiber, 1× exhaust) | External connections |
| Door replacement (secure access with environmental seal) | Security and thermal envelope |
| Closed-cell spray foam insulation (R-13 walls, R-19 ceiling) | Thermal stability |
| Interior vapor barrier | Condensation control |
| Cable tray mounting points (ceiling) | Cable management |

---

## 2. Container Weight Budget

| Component | Estimated Weight (kg) |
|-----------|-----------------------|
| Container (tare) | 4,000 |
| Floor reinforcement | 500 |
| Insulation + interior | 300 |
| Power systems (internal) | 800 |
| Cooling/filtration systems | 1,200 |
| Compute racks (2× GB200) | 2,720 |
| Networking equipment | 200 |
| Fire suppression | 150 |
| Monitoring/access | 100 |
| Cable + plumbing | 400 |
| Waste drum (full) | 250 |
| **Total** | **~10,620 kg** |
| **Remaining payload capacity** | **~15,680 kg** |

Total is well within ISO limits (~40% of maximum payload), leaving significant margin for additional compute or heavier future hardware configurations.

---

## 3. NVIDIA GB200 NVL72 Compute Specifications

The GB200 NVL72 is the reference design constraint — if the system works for this, it works for any less demanding configuration.

### 3.1 Compute Performance

| Parameter | Value |
|-----------|-------|
| GPUs per rack | 72 × Blackwell |
| CPUs per rack | 36 × Grace (ARM) |
| Compute trays | 18 × 1U (NVL72) or 18 × 2U (NVL36×2) |
| NVSwitch trays | 9 (NVL72) or 18 (NVL36×2) |
| NVLink bandwidth | 1.8 TB/s GPU-to-GPU |
| Total NVLink fabric | 130 TB/s |
| FP4 inference | 720 PFLOPS per rack |
| FP8 training performance | 4× faster than H100 at scale |
| Memory per GPU | 192 GB HBM3e (Blackwell) |
| Total GPU memory | 13.8 TB per rack |

### 3.2 Power Requirements

| Parameter | Value |
|-----------|-------|
| **Rack power (NVL72)** | **~120 kW** |
| Rack power (NVL36×2 preferred) | ~66 kW per rack (132 kW total for 2 racks) |
| Compute tray TDP | ~6.3 kW each |
| GB200 Superchip TDP | 2,700 W (1 Grace + 2 Blackwell) |
| Power supply | 8 power shelves × 6 × 5.5kW PSUs |
| Input voltage | AC → 50-51V DC bus bar |
| Power redundancy | N+N |

### 3.3 Cooling Requirements

| Parameter | Value |
|-----------|-------|
| **Cooling type** | **Mandatory liquid cooling (direct-to-chip)** |
| Liquid-cooled portion | ~115 kW per rack |
| Air-cooled portion | ~17 kW (networking, miscellaneous) |
| Coolant | Propylene glycol/water mix (non-toxic) |
| Inlet temperature | 15-25°C (ASHRAE W32 class) |
| Outlet temperature | 35-45°C (typical delta 10-20°C) |
| Flow rate | Application-specific, ~40-80 GPM per rack |
| CDU requirement | Required — rack-side or row-side |

### 3.4 Physical Dimensions

| Parameter | Value |
|-----------|-------|
| **Rack weight** | **~1,360 kg (3,000 lbs) each** |
| Rack height | ~42U effective |
| Rack width | 600 mm standard |
| Rack depth | 1,200 mm (typical for liquid-cooled) |
| Cold aisle recommended width | 1,200 mm minimum |
| Hot aisle minimum width | 900 mm |

---

## 4. Power System Engineering

### 4.1 Load Analysis

The total facility load includes two GB200 NVL72 racks plus auxiliary systems:

| Load Component | Power (kW) |
|---------------|-----------|
| Compute (2× NVL72 racks) | 240 |
| Cooling pumps and fans | 15 |
| Water filtration systems | 5 |
| Environmental monitoring | 3 |
| Lighting and access | 2 |
| Network infrastructure | 5 |
| **Total continuous load** | **~270 kW** |

Note: The reference design uses 2 racks of NVL36×2 configuration (66kW/rack = 132kW total compute) as an alternative to 2× NVL72 — the power system is designed for the higher figure (240kW) to accommodate either configuration.

### 4.2 Solar Array Sizing

| Parameter | Value |
|-----------|-------|
| Continuous load target | 150 kW (single-rack reference case) |
| Daily energy consumption | 3,600 kWh |
| Annual consumption | 1,314 MWh |
| Solar capacity factor (US Southwest average) | 24.7% |
| Required nameplate solar | ~607 kW |
| Panel efficiency (2025 commercial) | 22-24% |
| Panel area per kW | ~4.3 m² |
| **Total panel area** | **~2,610 m² (~0.65 acres)** |
| With spacing and access paths | ~1.5–2.5 acres total site area |

### 4.3 Battery Energy Storage System (BESS)

| Parameter | Value |
|-----------|-------|
| Overnight bridge requirement (10 hours no sun) | 1,500 kWh |
| Weather buffer (2 cloudy days) | 7,200 kWh |
| Recommended BESS capacity | 2,000–4,000 kWh |
| Technology | LFP (Lithium Iron Phosphate) |
| Cycle life | >6,000 cycles at 80% depth of discharge |
| Round-trip efficiency | 92-95% |
| Weight (containerized BESS) | 10,000–20,000 kg |
| **Critical:** Battery storage requires SEPARATE container or ground-mounted system |

### 4.4 Wind Supplementation

| Parameter | Value |
|-----------|-------|
| Purpose | Supplement solar during low-irradiance periods |
| Recommended capacity | 50-100 kW nameplate |
| Hub height | 30-50m |
| Cut-in wind speed | 3-4 m/s |
| Capacity factor (site-dependent) | 25-45% |

### 4.5 Power Distribution Architecture

```
Solar Array (600kW) ──┐
                      ├──→ DC Bus (1500V) ──→ BESS (2-4 MWh)
Wind Turbine (75kW) ──┘         │
                                ↓
                     DC-DC Converter (1500V → 48-51V)
                                │
                                ↓
                     Compute Node Bus Bar (48-51V DC)
                                │
                    ┌───────────┼───────────┐
                    ↓           ↓           ↓
              Rack 1 PSU   Rack 2 PSU   Aux Systems
              (120kW)      (120kW)      (30kW)
```

**Design principle:** Minimize AC-DC conversion stages. Solar panels output DC, batteries are DC, and GPU racks accept DC. By maintaining a DC power path (1500V distribution → 48-51V rack bus), the design eliminates 2-3 conversion stages, improving end-to-end efficiency by 5-10%.

---

## 5. Cooling and Water Filtration Specifications

### 5.1 Thermal Budget

| Heat Source | Power (kW) | Cooling Method |
|------------|------------|----------------|
| GPU/CPU compute | 115 | Liquid (direct-to-chip) |
| Networking | 10 | Air (fans) |
| Power conversion | 8 | Air + conduction |
| Pumps/auxiliary | 5 | Self-cooled |
| Lighting/monitoring | 2 | Ambient dissipation |
| **Total heat rejection** | **~140 kW** | |

### 5.2 Water Flow Requirements

| Parameter | Value |
|-----------|-------|
| Cooling loop flow rate | 40-80 GPM per rack |
| Total coolant flow (2 racks) | 80-160 GPM |
| Coolant inlet temperature | 15-25°C |
| Coolant outlet temperature | 35-45°C |
| Heat exchanger efficiency | 85-95% |
| Water filtration throughput | 5-20 GPM (after cooling loop) |
| Daily potable water output | 7,200–28,800 gallons |

### 5.3 Five-Stage Filtration System

| Stage | Media/Technology | Target Removal | Replacement Cycle |
|-------|-----------------|----------------|-------------------|
| 1. Sediment pre-filter | 5-micron pleated | Sand, silt, rust | Monthly |
| 2. Activated carbon | Granular activated carbon | Chlorine, VOCs, taste, odor | 6 months |
| 3. Reverse osmosis | TFC membrane | Dissolved solids, heavy metals (>95%) | 2-3 years |
| 4. UV sterilization | 254nm germicidal UV | Bacteria, viruses, protozoa (99.99%) | Annual lamp replacement |
| 5. Mineral rebalancing | Calcite/corosex blend | Restore pH and minerals for taste | 6 months |

### 5.4 Waste Management

| Parameter | Value |
|-----------|-------|
| Container | Standard 55-gallon steel drum (DOT 17H) |
| Expected contents | Sediment, carbon fines, RO concentrate, mineral deposits |
| Estimated swap frequency | Monthly |
| Classification | Non-hazardous solid waste (typical municipal water contaminants) |
| Disposal method | Licensed waste hauler, return to regional processing facility |
| Tracking | Manifest system per EPA RCRA guidelines |

---

## 6. US Rail Corridor and Site Selection Data

### 6.1 High-Priority Deployment Corridors

Fiber optic cables were extensively co-located along railroad rights-of-way during the 1990s-2000s telecommunications buildout. Major corridors where solar irradiance, fiber, and rail access converge:

| Corridor | Railroad | States | Solar Irradiance |
|----------|----------|--------|-----------------|
| Sunset Route | Union Pacific | TX, NM, AZ, CA | Excellent (6+ kWh/m²/day) |
| Transcon | BNSF | TX, NM, AZ, CA | Excellent |
| I-10 Corridor | UP/BNSF | TX, NM, AZ | Excellent |
| I-40 Corridor | BNSF | TX, NM, AZ | Excellent |
| I-25 Corridor | BNSF | NM, CO | Very Good (5-6 kWh/m²/day) |
| California Central Valley | UP/BNSF | CA | Very Good |
| Great Plains | UP/BNSF | NE, KS, OK | Good (4.5-5.5 kWh/m²/day) |

### 6.2 Site Selection Scoring Matrix

| Criterion | Weight | Scoring |
|-----------|--------|---------|
| Solar irradiance | 25% | >6 kWh/m²/day = 10 pts; 5-6 = 7 pts; 4-5 = 4 pts |
| Fiber access (<1 mile) | 20% | Direct = 10; <0.5mi = 7; <1mi = 4 |
| Rail siding access | 15% | Existing siding = 10; within 0.5mi = 5 |
| Water source availability | 15% | Adjacent = 10; <0.5mi = 7; <1mi = 4 |
| Community partner | 10% | Committed = 10; interested = 5 |
| Land availability/cost | 10% | Available <$5K/acre = 10; <$20K = 5 |
| Zoning compatibility | 5% | Pre-zoned = 10; re-zonable = 5 |

A site scoring ≥70/100 is considered a strong candidate. Target: ≥20 candidate sites identified, ≥10 scoring ≥70.

---

## 7. Standards and Code References

### 7.1 Mandatory Standards

| Standard | Application |
|----------|-------------|
| ISO 668:2020 | Container classification, dimensions, ratings |
| ISO 1496-1:2013 | Container specification and testing |
| NFPA 70 (NEC 2023) | Electrical installations — all electrical work |
| NFPA 75 | IT equipment protection |
| NFPA 76 | Telecommunications facilities |
| ASHRAE TC 9.9 | Data center thermal management guidelines |
| EPA 40 CFR Part 141 | National Primary Drinking Water Regulations |
| UPC/IPC | Plumbing code (jurisdiction-dependent) |
| ASCE 7-22 | Structural loads (foundation design) |
| IEEE 1547 | Distributed energy resource interconnection |
| ISA 5.1 | Instrumentation symbols (P&ID drawings) |
| ISO 128 | Technical drawing — dimension line standards |

### 7.2 Relevant NEC Articles

| NEC Article | Topic |
|------------|-------|
| Article 250 | Grounding and bonding |
| Article 690 | Solar photovoltaic systems |
| Article 706 | Battery energy storage systems |
| Article 230 | Service entrance and disconnecting means |

---

## 8. Key Source Organizations

| Organization | Domain |
|-------------|--------|
| **ISO** | Container dimensional standards (ISO 668, ISO 1496) |
| **NVIDIA** | GB200 NVL72 compute and cooling specifications |
| **ASHRAE** | Thermal management guidelines (TC 9.9) |
| **NFPA** | Electrical and fire codes (NEC 2023, NFPA 75, 76) |
| **EPA** | National Primary Drinking Water Regulations (40 CFR 141) |
| **DOE/LBNL** | Data center energy efficiency benchmarks |
| **NREL** | Solar irradiance data and capacity factors |
| **IEEE** | Power systems interconnection standards |

---

## 9. Safety Requirements

The following are mandatory-pass criteria. No specification document is complete unless all apply:

| ID | Requirement |
|----|-------------|
| S-01 | Every specification document includes PE review disclaimer |
| S-02 | Electrical designs reference NEC 2023 article numbers |
| S-03 | Water output specification references EPA 40 CFR 141 |
| S-04 | Fire suppression system specified (NFPA 75 compliant) |
| S-05 | Leak detection system specified for all liquid circuits |
| S-06 | Weight budget does not exceed ISO container max payload (~26,300 kg) |
| S-07 | All pressurized systems specify relief valves and ratings |
| S-08 | Electrical system includes overcurrent protection at every level |
| S-09 | Emergency power disconnect accessible from exterior |
| S-10 | Water filtration includes automated shutoff on quality failure |

---

## 10. Cross-References

| Project | Connection |
|---------|------------|
| [OCN Module 01](01-vision-architecture.md) | Architecture context that these specifications quantify |
| [OCN Module 03](03-deployment-logistics.md) | Site selection applies the rail corridor and scoring data from this module |
| [OCN Module 04](04-container-power-cooling.md) | Physical implementation of structural, power, and cooling specs |
| [THE](../THE/index.html) | Thermal energy management; heat rejection analysis and CDU sizing |
| [SYS](../SYS/index.html) | Systems administration; DCIM monitoring integrates with power/cooling sensors |
| [HGE](../HGE/index.html) | Hydro-geothermal as alternative cooling source; affects inlet temperature specs |
| [EMG](../EMG/index.html) | Backup generator specifications; integration with DC bus architecture |
| [BCM](../BCM/index.html) | Container construction and structural modification details |

---

## 11. Sources

1. ISO 668:2020 — Freight containers: Classification, dimensions and ratings
2. ISO 1496-1:2013 — Series 1 freight containers — Specification and testing
3. NVIDIA Corporation — GB200 NVL72 product specifications and DGX user guide
4. HPE (Hewlett Packard Enterprise) — GB200 NVL72 deployment specifications
5. Supermicro — GB200 NVL72 integration specifications
6. ASHRAE TC 9.9 — Data center thermal management guidelines (2021 edition)
7. NFPA 70 (NEC 2023) — National Electrical Code
8. NFPA 75 — Standard for the Fire Protection of Information Technology Equipment
9. EPA 40 CFR Part 141 — National Primary Drinking Water Regulations
10. ASCE 7-22 — Minimum Design Loads and Associated Criteria for Buildings
11. DOE/LBNL — Data Center Energy Efficiency research (Lawrence Berkeley National Laboratory)
12. NREL — Solar irradiance data, NSRDB capacity factors (National Renewable Energy Laboratory)
13. SemiAnalysis — GB200 hardware architecture deep dive
14. Stripe/Scale Microgrids/Paces — Off-grid solar microgrid analysis (December 2024)
15. Dgtl Infra — Modular data center market analysis

> **PROFESSIONAL ENGINEER REVIEW REQUIRED**
> This specification is a conceptual design produced by AI-assisted engineering analysis. It has NOT been reviewed or stamped by a licensed Professional Engineer (PE). Before any construction, fabrication, or installation, all structural, electrical, and plumbing designs must be verified by licensed professionals in the jurisdiction of deployment.
