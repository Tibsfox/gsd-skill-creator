# Open Compute Node — Engineering Research Reference

**Date:** 2026-02-28
**Status:** Research Compilation
**Source Document:** 00-vision-open-compute-node.md
**Purpose:** Provides verified engineering specifications, dimensional constraints, and professional standards that mission agents use to produce accurate blueprints and specifications.

---

## How to Use This Document

Where the vision says "40ft HC container," this provides the exact ISO 668 dimensions. Where the vision says "120kW liquid cooled," this provides the NVIDIA thermal specifications. Where the vision says "EPA drinking water," this provides 40 CFR Part 141 thresholds. Every number in the mission deliverables must trace back to a source in this document or a cited standard.

**Key Source Organizations:**
- **ISO** — Container dimensional standards (ISO 668, ISO 1496)
- **NVIDIA** — GB200 NVL72 compute and cooling specifications
- **ASHRAE** — Thermal management guidelines (TC 9.9)
- **NEC** — National Electrical Code 2023 (NFPA 70)
- **EPA** — National Primary Drinking Water Regulations (40 CFR 141)
- **DOE/LBNL** — Data center energy efficiency benchmarks
- **NREL** — Solar irradiance data and capacity factors

---

## 1. ISO Container Specifications

### 40ft High Cube (ISO 668 / ISO 1496-1)

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

**Structural Notes:**
- Corner castings rated for stacking (9 high loaded, or crane lift from four corners)
- Floor load rating: 7,260 kg/m (~4,893 lbs/ft) as line load
- Forklift pocket spacing: 2,050 mm center-to-center
- Material: Corten steel (weathering steel), marine plywood floor (28mm)
- Wind & water tight (ISO 1496-1 certification)

**Modifications Required for Compute Node:**
- Floor reinforcement: steel plate overlay for point loads (rack feet)
- Wall penetrations: minimum 6 (2× power, 2× water, 1× fiber, 1× exhaust)
- Door replacement: secure access door with environmental seal
- Insulation: closed-cell spray foam (R-13 minimum walls, R-19 ceiling)
- Interior vapor barrier
- Cable tray mounting points along ceiling

### Weight Budget

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

Weight is well within ISO limits, leaving margin for additional compute or heavier future hardware.

---

## 2. NVIDIA GB200 NVL72 Specifications

### Compute Performance

| Parameter | Value |
|-----------|-------|
| GPUs per rack | 72 × Blackwell |
| CPUs per rack | 36 × Grace (ARM) |
| Compute trays | 18 × 1U (NVL72) or 18 × 2U (NVL36×2) |
| NVSwitch trays | 9 (NVL72) or 18 (NVL36×2) |
| NVLink bandwidth | 1.8 TB/s GPU-to-GPU |
| Total NVLink fabric | 130 TB/s |
| FP4 inference | 720 PFLOPS |
| FP8 training | 4× faster than H100 at scale |
| Memory per GPU | 192 GB HBM3e (Blackwell) |
| Total GPU memory | 13.8 TB per rack |

### Power Requirements

| Parameter | Value |
|-----------|-------|
| **Rack power (NVL72)** | **~120 kW** |
| Rack power (NVL36×2) | ~66 kW per rack (132 kW total) |
| Compute tray TDP | ~6.3 kW each |
| GB200 Superchip TDP | 2,700 W (1 Grace + 2 Blackwell) |
| Power supply | 8 power shelves × 6 × 5.5kW PSUs |
| Input voltage | AC → 50-51V DC bus bar |
| Power redundancy | N+N |

### Cooling Requirements

| Parameter | Value |
|-----------|-------|
| **Cooling type** | **Mandatory liquid cooling (direct-to-chip)** |
| Liquid-cooled portion | ~115 kW |
| Air-cooled portion | ~17 kW (networking, misc) |
| Coolant | Propylene glycol/water mix (typical) |
| Inlet temperature | 15-25°C (ASHRAE W32 class) |
| Outlet temperature | 35-45°C (typical delta 10-20°C) |
| Flow rate | Application-specific, ~40-80 GPM per rack |
| CDU (Coolant Distribution Unit) | Required — rack-side or row-side |

### Physical Dimensions

| Parameter | Value |
|-----------|-------|
| **Rack weight** | **~1,360 kg (3,000 lbs)** |
| Rack height | ~42U effective (in standard rack frame) |
| Rack width | 600 mm standard |
| Rack depth | 1,200 mm (typical for liquid-cooled) |
| Recommended aisle width | 1,200 mm (cold aisle), 900 mm (hot aisle minimum) |

---

## 3. Power System Engineering

### Solar Sizing for 150kW Continuous Load

The total facility load includes compute (120kW) plus cooling pumps, fans, filtration, monitoring, and lighting (~30kW overhead), totaling approximately 150kW continuous.

| Parameter | Value |
|-----------|-------|
| Continuous load | 150 kW |
| Daily energy consumption | 3,600 kWh |
| Annual consumption | 1,314 MWh |
| Solar capacity factor (US Southwest avg) | 24.7% |
| Required nameplate solar | ~607 kW |
| Panel efficiency (2025 commercial) | 22-24% |
| Panel area per kW | ~4.3 m² |
| **Total panel area** | **~2,610 m² (~0.65 acres)** |
| With spacing and access | ~1.5-2.5 acres total site area |

### Battery Energy Storage

| Parameter | Value |
|-----------|-------|
| Overnight bridge (10 hours no sun) | 1,500 kWh |
| Weather buffer (2 cloudy days) | 7,200 kWh |
| Recommended BESS capacity | 2,000-4,000 kWh |
| Technology | LFP (Lithium Iron Phosphate) |
| Cycle life | >6,000 cycles at 80% DoD |
| Round-trip efficiency | 92-95% |
| Weight (containerized BESS) | 10,000-20,000 kg (separate container) |

**Critical Note:** Battery storage at this scale requires a SEPARATE container or ground-mounted system. The compute node container cannot house both the compute racks AND sufficient battery capacity. The site design includes the compute container + adjacent BESS container(s) + solar array.

### Wind Supplementation

| Parameter | Value |
|-----------|-------|
| Purpose | Supplement solar during low-irradiance periods |
| Recommended capacity | 50-100 kW nameplate |
| Technology | Small-medium commercial turbine |
| Hub height | 30-50m |
| Cut-in wind speed | 3-4 m/s |
| Capacity factor (varies by site) | 25-45% |

### Power Distribution Architecture

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

**Design Principle:** Minimize AC-DC conversions. Solar panels output DC, batteries are DC, GPU racks accept DC. By keeping the entire power path as DC (1500V distribution, 48-51V rack bus), we eliminate 2-3 conversion stages, improving efficiency by 5-10%.

---

## 4. Cooling and Water Filtration

### Thermal Budget

| Heat Source | Power (kW) | Cooling Method |
|------------|------------|----------------|
| GPU/CPU compute | 115 | Liquid (direct-to-chip) |
| Networking | 10 | Air (fans) |
| Power conversion | 8 | Air + conduction |
| Pumps/auxiliary | 5 | Self-cooled |
| Lighting/monitoring | 2 | Ambient |
| **Total heat rejection** | **~140 kW** | |

### Water Flow Requirements

| Parameter | Value |
|-----------|-------|
| Cooling loop flow rate | 40-80 GPM (per rack) |
| Total coolant flow | 80-160 GPM |
| Coolant inlet temp | 15-25°C |
| Coolant outlet temp | 35-45°C |
| Heat exchanger efficiency | 85-95% |
| Water filtration throughput | 5-20 GPM (after cooling) |
| Daily potable water output | 7,200-28,800 gallons |

### Filtration System Specifications

| Stage | Media/Technology | Target Removal | Replacement Cycle |
|-------|-----------------|----------------|-------------------|
| 1. Sediment pre-filter | 5-micron pleated | Sand, silt, rust | Monthly |
| 2. Activated carbon | Granular activated carbon | Chlorine, VOCs, taste, odor | 6 months |
| 3. Reverse osmosis | TFC membrane | Dissolved solids, heavy metals (>95%) | 2-3 years |
| 4. UV sterilization | 254nm germicidal UV | Bacteria, viruses, protozoa (99.99%) | Annual lamp replacement |
| 5. Mineral rebalancing | Calcite/corosex blend | Restore pH, add minerals for taste | 6 months |

### Waste Management

| Parameter | Value |
|-----------|-------|
| Container | Standard 55-gallon steel drum (DOT 17H) |
| Expected contents | Sediment, carbon fines, RO concentrate, mineral deposits |
| Fill rate | Dependent on input water quality |
| Estimated swap frequency | Monthly |
| Classification | Non-hazardous solid waste (typical municipal water contaminants) |
| Disposal | Licensed waste hauler, return to regional processing facility |
| Tracking | Manifest system per EPA RCRA (if applicable) |

---

## 5. US Rail Corridor and Fiber Route Data

### Major Fiber-Along-Rail Corridors

Fiber optic cables were extensively laid along railroad rights-of-way during the 1990s-2000s telecommunications buildout. Major carriers (Level 3/Lumen, Zayo, Crown Castle) own significant fiber routes along Class I railroad corridors.

**High-Priority Corridors (Solar + Fiber + Rail):**

| Corridor | Railroad | States | Solar Irradiance |
|----------|----------|--------|-----------------|
| Sunset Route | Union Pacific | TX, NM, AZ, CA | Excellent (6+ kWh/m²/day) |
| Transcon | BNSF | TX, NM, AZ, CA | Excellent |
| I-10 Corridor | UP/BNSF | TX, NM, AZ | Excellent |
| I-40 Corridor | BNSF | TX, NM, AZ | Excellent |
| I-25 Corridor | BNSF | NM, CO | Very Good (5-6 kWh/m²/day) |
| California Central Valley | UP/BNSF | CA | Very Good |
| Great Plains | UP/BNSF | NE, KS, OK | Good (4.5-5.5 kWh/m²/day) |

### Site Selection Scoring Matrix

| Criterion | Weight | Scoring |
|-----------|--------|---------|
| Solar irradiance | 25% | >6 kWh/m²/day = 10, 5-6 = 7, 4-5 = 4 |
| Fiber access (<1 mile) | 20% | Direct = 10, <0.5mi = 7, <1mi = 4 |
| Rail siding access | 15% | Existing siding = 10, within 0.5mi = 5 |
| Water source availability | 15% | Adjacent = 10, <0.5mi = 7, <1mi = 4 |
| Community partner | 10% | Committed = 10, interested = 5 |
| Land availability/cost | 10% | Available <$5K/acre = 10, <$20K = 5 |
| Zoning compatibility | 5% | Pre-zoned = 10, re-zonable = 5 |

---

## 6. Standards and Code References

### Mandatory Standards

| Standard | Application |
|----------|-------------|
| ISO 668:2020 | Container classification, dimensions, ratings |
| ISO 1496-1:2013 | Container specification and testing |
| NFPA 70 (NEC 2023) | Electrical installations |
| NFPA 75 | IT equipment protection |
| NFPA 76 | Telecommunications facilities |
| ASHRAE TC 9.9 | Data center thermal guidelines |
| EPA 40 CFR 141 | National Primary Drinking Water Regulations |
| UPC/IPC | Plumbing code (jurisdiction-dependent) |
| ASCE 7-22 | Structural loads |
| IEEE 1547 | Distributed energy interconnection |

### Safety Disclaimers (Required on ALL Specifications)

Every technical document produced by this mission MUST include:

```
╔═══════════════════════════════════════════════════════════════╗
║ PROFESSIONAL ENGINEER REVIEW REQUIRED                        ║
║                                                              ║
║ This specification is a conceptual design produced by AI-    ║
║ assisted engineering analysis. It has NOT been reviewed or   ║
║ stamped by a licensed Professional Engineer (PE). Before     ║
║ any construction, fabrication, or installation based on      ║
║ this specification:                                          ║
║                                                              ║
║ 1. All structural calculations must be verified by a PE      ║
║    licensed in the jurisdiction of deployment.               ║
║ 2. All electrical designs must comply with local             ║
║    amendments to the National Electrical Code.               ║
║ 3. All plumbing designs must comply with local plumbing      ║
║    code (UPC or IPC as applicable).                          ║
║ 4. All water treatment systems must be certified by the      ║
║    state drinking water program.                             ║
║ 5. Site-specific soil, seismic, and wind load analysis       ║
║    must be performed.                                        ║
║                                                              ║
║ The authors assume no liability for use of this              ║
║ specification without proper professional review.            ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## Source Bibliography

**Standards Organizations:**
- ISO (International Organization for Standardization) — Container standards
- ASHRAE (American Society of Heating, Refrigerating and Air-Conditioning Engineers) — Thermal guidelines
- NFPA (National Fire Protection Association) — Electrical and fire codes
- IEEE (Institute of Electrical and Electronics Engineers) — Power systems
- EPA (Environmental Protection Agency) — Water quality standards

**Hardware Manufacturers:**
- NVIDIA Corporation — GB200 NVL72 specifications, DGX user guide
- HPE (Hewlett Packard Enterprise) — GB200 NVL72 deployment specifications
- Supermicro — GB200 NVL72 integration specifications

**Research Institutions:**
- DOE/LBNL (Lawrence Berkeley National Laboratory) — Data center energy efficiency
- NREL (National Renewable Energy Laboratory) — Solar irradiance, capacity factors
- Stripe/Scale Microgrids/Paces — Off-grid solar microgrid analysis (December 2024)

**Industry Sources:**
- SemiAnalysis — GB200 hardware architecture deep dive
- Introl — Extreme density cooling solutions analysis
- Dgtl Infra — Modular data center market analysis
