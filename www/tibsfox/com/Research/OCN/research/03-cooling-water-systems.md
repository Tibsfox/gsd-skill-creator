# Cooling and Water Systems

> **Domain:** Thermal Engineering, Fluid Systems, and Potable Water Treatment
> **Module:** 3 -- Open Compute Node: Dual-Purpose Liquid Cooling and Community Water Filtration
> **Through-line:** *Waste heat from computation is not a problem to be rejected. It is a resource. The same thermal energy that would otherwise require a dry cooler and a power bill instead pre-warms incoming water, raising it to the optimal temperature range for reverse osmosis membrane performance. Physics that would otherwise be dissipated into the atmosphere becomes infrastructure that the community uses every day.*

---

> **PROFESSIONAL ENGINEER REVIEW REQUIRED**
>
> This specification is a conceptual design produced by AI-assisted engineering analysis. It has NOT been reviewed or stamped by a licensed Professional Engineer (PE). Before any construction, fabrication, or installation based on this specification:
>
> 1. All fluid system calculations must be verified by a PE licensed in the jurisdiction of deployment.
> 2. All plumbing designs must comply with local plumbing code (UPC or IPC as applicable) and be permitted accordingly.
> 3. All water treatment systems producing potable water must be certified by the state drinking water program and comply with EPA 40 CFR Part 141.
> 4. Backflow prevention devices are legally required at every cross-connection point between potable and non-potable systems and must be reviewed by the local water authority.
> 5. Pressure vessels, heat exchangers, and RO membrane housings must carry ASME or equivalent pressure ratings.
> 6. UV disinfection systems must achieve validated dose per NSF/ANSI 55.
>
> The authors assume no liability for use of this specification without proper professional review.

---

## Table of Contents

1. [Thermal Load Analysis](#1-thermal-load-analysis)
2. [Liquid Cooling Loop Design](#2-liquid-cooling-loop-design)
3. [The Dual-Purpose Innovation: Cooling and Water Filtration](#3-the-dual-purpose-innovation-cooling-and-water-filtration)
4. [Five-Stage Filtration System](#4-five-stage-filtration-system)
5. [Water Quality Monitoring](#5-water-quality-monitoring)
6. [Waste Management](#6-waste-management)
7. [Plumbing and Piping](#7-plumbing-and-piping)
8. [Environmental Considerations](#8-environmental-considerations)
9. [Sources](#9-sources)

---

## 1. Thermal Load Analysis

### 1.1 The GB200 NVL72 Thermal Design Power

The NVIDIA GB200 NVL72 is the reference compute payload for the Open Compute Node. Each rack contains 72 Blackwell GPUs and 36 Grace CPUs arranged in 18 NVL72 compute trays. The thermal design power (TDP) for the complete rack assembly is approximately **120 kW**, making it among the most thermally dense single-rack systems commercially available.

Each GB200 Superchip (one Grace CPU + two Blackwell GPUs) carries a combined TDP of approximately 2,700 W. Across 36 Superchips per rack, plus switch trays and power shelves, the total rack thermal output approaches and in sustained AI training workloads routinely reaches the 120 kW nameplate figure.

A critical design principle governs the entire cooling architecture: **nearly all electrical power delivered to the compute racks converts to heat.** The first law of thermodynamics does not offer exceptions. Compute, memory access, network switching, power conversion inefficiencies, and voltage regulator losses all ultimately manifest as thermal energy that the cooling system must reject. There is no mechanism by which a data center "uses" electricity without producing an equivalent quantity of heat.

### 1.2 Facility-Wide Heat Budget

The 120 kW GPU/CPU figure is only part of the thermal story. The complete facility heat budget for the Open Compute Node includes all internal heat-generating systems:

| Heat Source | Thermal Output (kW) | Primary Rejection Method |
|---|---|---|
| GPU/CPU compute (GB200 NVL72) | 115 | Direct-to-chip liquid cooling |
| Networking equipment (in-rack) | 10 | Rack air cooling, fans |
| Power conversion (DC-DC, PSUs) | 8 | Conduction + forced air |
| CDU pumps and auxiliary systems | 5 | Self-cooled to coolant loop |
| Lighting, monitoring, controls | 2 | Ambient radiation |
| **Total facility heat rejection** | **~140 kW** | |

The gap between the 120 kW compute figure and the 140 kW total facility figure is significant for cooling system sizing. Every pump, fan, power converter, and LED fixture contributes thermal load. The cooling system must be designed for the **140 kW total**, not the 120 kW compute headline.

### 1.3 ASHRAE TC 9.9 Liquid Cooling Guidelines

ASHRAE (American Society of Heating, Refrigerating and Air-Conditioning Engineers) Technical Committee 9.9 publishes the definitive thermal guidelines for data center cooling. The current standard defines liquid cooling classes based on inlet water temperature:

| ASHRAE Class | Liquid Supply Temperature | Primary Application |
|---|---|---|
| W1 | 5–17°C | Chilled water, legacy IT equipment |
| W2 | 20–27°C | Direct liquid cooling, moderate density |
| W3 | 30–40°C | High-efficiency systems, waste heat recovery |
| W4 | 40–45°C | Near-ambient liquid cooling, specialized |
| W5 | >45°C | Immersion cooling, extreme density |

The GB200 NVL72 is specified for **ASHRAE W2/W32 class** operation, with a recommended coolant supply temperature of **15–25°C** and an expected outlet temperature of **35–45°C**. This places the system in the regime where free cooling (dry coolers rather than chillers) is achievable for much of the year in temperate and arid climates — a key advantage for the US Southwest deployment target.

The ASHRAE TC 9.9 guidelines further specify that liquid-cooled systems must maintain GPU junction temperatures within manufacturer specifications, which for Blackwell-generation GPUs means maintaining coolant supply temperatures consistently below the inlet spec maximum with adequate margin for coolant flow variations and transient workload spikes.

### 1.4 Heat Transfer Fundamentals: The Q = m × Cp × ΔT Relationship

All cooling system sizing traces back to the fundamental heat transfer equation for sensible heating of a fluid:

```
Q = m × Cp × ΔT
```

Where:
- **Q** = heat transfer rate (watts or kilowatts)
- **m** = mass flow rate of coolant (kg/s)
- **Cp** = specific heat capacity of the coolant at constant pressure (J/kg·K)
- **ΔT** = temperature rise across the heat source (°C or K)

For the primary cooling loop serving the GPU racks, applying this equation:

**Given values:**
- Q = 115,000 W (GPU/CPU liquid-cooled thermal load)
- Cp for 30% propylene glycol / 70% water mixture ≈ 3,800 J/kg·K at 20°C
- Target ΔT = 10°C (inlet 20°C, outlet 30°C) — conservative design point
- Target ΔT = 20°C (inlet 15°C, outlet 35°C) — aggressive design point

**Solving for mass flow rate at ΔT = 10°C:**
```
m = Q / (Cp × ΔT)
m = 115,000 / (3,800 × 10)
m = 115,000 / 38,000
m = 3.03 kg/s
```

Converting to volumetric flow rate (density of 30% PG/water ≈ 1,040 kg/m³):
```
Q_vol = m / ρ = 3.03 / 1,040 = 0.00291 m³/s = 2.91 L/s = 46.3 GPM
```

**Solving for mass flow rate at ΔT = 20°C (full rack range):**
```
m = 115,000 / (3,800 × 20) = 1.51 kg/s = 24.1 GPM
```

**Design recommendation:** Size the primary loop for **40–80 GPM** (per NVIDIA specifications for the NVL72). At 40 GPM, ΔT is approximately 19°C; at 80 GPM, ΔT drops to approximately 9°C. Operating in the 50–60 GPM range provides the best balance of pump power consumption and thermal margin.

For a two-rack installation (2 × GB200 NVL72), total coolant flow through the CDU is **80–160 GPM**, with the 115–120 GPM midpoint recommended for normal operation.

### 1.5 Recommended Inlet and Outlet Temperature Ranges

| Operating Condition | Coolant Supply (Tin) | Coolant Return (Tout) | ΔT |
|---|---|---|---|
| Maximum cooling headroom | 15°C | 25–30°C | 10–15°C |
| Normal operation (recommended) | 20°C | 35°C | 15°C |
| High ambient / free cooling | 25°C | 40°C | 15–20°C |
| ASHRAE maximum (W32) | 27°C | 45°C | 18°C |
| **Design basis for this node** | **20°C** | **35°C** | **15°C** |

The design basis of 20°C supply / 35°C return is intentional: it sits within the ASHRAE W2 class, enables free cooling via a dry cooler without refrigeration in ambient temperatures up to ~10°C, and produces a return water temperature that is optimal for pre-warming the incoming non-potable water feed to the filtration system.

---

## 2. Liquid Cooling Loop Design

### 2.1 System Architecture: Primary and Secondary Loops

The cooling system uses a **two-loop architecture** that separates the clean, closed primary coolant loop from the open-loop non-potable water stream:

```
NON-POTABLE       ┌─────────────────────────────────────────┐
WATER IN ─────────┤  SECONDARY LOOP (open, non-potable)     │
                  │  Raw water → plate HX → pre-warmed feed │
                  │  → 5-stage filtration → potable output  │
                  └──────────────┬──────────────────────────┘
                                 │ heat transfer
                                 ↓
                  ┌─────────────────────────────────────────┐
                  │  PRIMARY LOOP (closed, treated coolant) │
                  │  CDU → rack manifold → cold plates      │
                  │  → return header → CDU plate HX         │
GPU RACKS ────────┤  115 kW absorbed from chips             │
                  │  Propylene glycol / water mix           │
                  └─────────────────────────────────────────┘
                                 │ residual heat
                                 ↓
                  ┌─────────────────────────────────────────┐
                  │  TERTIARY REJECTION (dry cooler)        │
                  │  Residual heat after water pre-warming  │
                  │  Outdoor fin-and-tube or wet tower      │
                  └─────────────────────────────────────────┘
```

### 2.2 Coolant Distribution Unit (CDU)

The CDU is the central component of the primary cooling loop. It houses:

**Plate Heat Exchanger (PHX):**
The PHX is the thermal interface between the primary coolant loop and the secondary (water filtration) side. Stainless steel chevron-pattern plates provide high surface area in a compact form factor. For 115 kW of heat transfer with a 5°C approach temperature (mean temperature difference between the two fluid streams), the required heat transfer area can be estimated:

```
Q = U × A × LMTD
115,000 W = 4,000 W/m²·K × A × 5°C
A = 115,000 / 20,000 = 5.75 m²
```

Using a conservative overall heat transfer coefficient U = 4,000 W/m²·K for a stainless steel gasketed plate heat exchanger with liquid-to-liquid service, the required heat transfer area is approximately **6–8 m²**, achievable in a standard industrial PHX with 50–80 plates.

**Pumps:**
- Primary loop pump duty: sized for 120 GPM (2× GB200 racks) at ~30–50 ft head
- Pump configuration: N+1 redundancy — two identical pumps in parallel, one running, one on automatic standby
- Variable speed drives (VFDs) on both pumps for flow modulation based on GPU thermal demand
- Motor: NEMA premium efficiency, 460V 3-phase or 208V single-phase depending on site power
- Estimated pump power at design flow: ~3–5 kW per pump

**Reservoir and Expansion Tank:**
- Closed expansion tank: sized at 10% of total loop volume
- Primary loop volume estimate: ~200 L (CDU + manifolds + cold plates + headers)
- Expansion tank: 20 L minimum, pressurized to 15–20 psi with nitrogen blanket
- Function: accommodates thermal expansion of coolant (PG/water expands ~6% between 15°C and 50°C), maintains positive system pressure to prevent cavitation

**Coolant Selection:**
Propylene glycol (PG) / water mixture at 30% PG by volume is specified rather than ethylene glycol for a critical safety reason: **propylene glycol is food-grade and non-toxic.** In the event of a primary loop leak within the container, PG poses no hazard to the water filtration system or potable water output. Ethylene glycol is toxic and is explicitly excluded from this design.

| Property | 30% PG / 70% Water | Pure Water |
|---|---|---|
| Freeze point | -13°C (9°F) | 0°C (32°F) |
| Specific heat Cp | 3,800 J/kg·K | 4,182 J/kg·K |
| Density at 20°C | 1,040 kg/m³ | 998 kg/m³ |
| Viscosity at 20°C | ~2.0 mPa·s | 1.0 mPa·s |
| Toxicity | GRAS (FDA) | N/A |
| Corrosion inhibitors | Required (phosphate or molybdate-based) | N/A |

### 2.3 Cold Plate Design — Direct-to-Chip Liquid Cooling

Each GB200 Superchip has an integrated cold plate that accepts direct liquid cooling from the manifold. NVIDIA's NVL72 platform requires this — air cooling is not an option at 2,700 W per Superchip.

**Cold plate specifications:**
- Material: Copper base plate with micro-channel flow passages (copper for maximum thermal conductivity, k ≈ 400 W/m·K)
- Contact area: sized to cover the full die area of both Blackwell GPUs plus the Grace CPU on each Superchip
- Micro-channel geometry: parallel channels 0.3–1.0 mm wide, etched or machined, maximizing surface area while managing pressure drop
- Thermal interface: factory-applied indium solder or high-performance thermal paste to GPU package
- Inlet/outlet connections: quick-connect push-to-connect fittings, 1/4" or 3/8" internal diameter per cold plate
- Pressure drop: typically 5–15 psi across each cold plate at design flow

The GB200 NVL72 ships as an integrated assembly with the cold plates and manifold pre-installed on each compute tray. The rack-level manifold — the header that distributes coolant to all 18 compute trays in series/parallel — is part of the NVL72 rack assembly and connects to the CDU at the rack-level supply/return ports.

### 2.4 Rack-Level Manifold Design

**Supply and Return Headers:**

Each rack has a pair of headers (supply and return) that run the full height of the rack along the rear interior. These headers are typically 1" to 1-1/4" diameter stainless steel or copper tubing with branch connections to each compute tray.

- **Supply header:** distributes cooled coolant (20°C nominal) from the CDU to all 18 compute tray cold plates
- **Return header:** collects warmed coolant (35°C nominal) from all tray cold plates and returns to the CDU
- **Branch connections:** individual 3/8" quick-connect fittings per tray, with self-sealing dry-break couplings that allow tray hot-swap without loop depressurization
- **Parallel vs. series arrangement:** all 18 trays plumbed in parallel to maintain uniform inlet temperature across all chips — series arrangement would cause downstream trays to receive pre-warmed coolant

**Quick-Connect Fittings:**
Colder quick-disconnect couplings (Parker Hannifin, Stäubli, or equivalent) are specified at every removable tray connection. These dry-break fittings maintain a liquid-tight seal when disconnected, preventing coolant spills during tray maintenance. Each coupling must be rated for:
- Working pressure: 100 psi minimum
- Temperature range: 0–80°C
- Compatibility: propylene glycol/water mixture
- Material: stainless steel body, EPDM seals

### 2.5 Redundancy Architecture

| Component | Redundancy Level | Failover Behavior |
|---|---|---|
| CDU pumps | N+1 (2 pumps, 1 running) | Automatic standby activation on pressure drop |
| CDU plate heat exchanger | Single (oversized) | Bypass valve allows direct dry cooler path |
| Rack isolation valves | Per-rack ball valves | Manual isolation for individual rack maintenance |
| Dry cooler fans | N+1 per unit | Fan VFD reduces others to compensate |
| Leak detection | Zone-based rope sensors | Automatic shutdown + alarm on first detection |

**Pump redundancy design:** The two CDU pumps are piped in parallel with check valves on each pump outlet to prevent backflow through the standby pump. A pressure differential transmitter across the pump section monitors the running pump's discharge pressure. On a 10% pressure drop from setpoint (indicating pump failure or impeller wear), the standby pump starts automatically within 15 seconds and an alarm is generated.

**Valve isolation per rack:** Each rack has a pair of manually operated ball valves on the supply and return connections at the CDU manifold. These allow full flow isolation of a single rack for maintenance (cold plate replacement, rack removal) without shutting down the cooling system for the remaining racks.

---

## 3. The Dual-Purpose Innovation: Cooling and Water Filtration

### 3.1 Concept: Waste Heat as Productive Resource

Traditional data center liquid cooling loops do one thing: they move heat from the chips to an external rejection point (a cooling tower, dry cooler, or chiller). The heat is dissipated into the atmosphere as an operational cost. At 120 kW per rack running continuously, this represents approximately **1,051,200 kWh of waste heat per year, per rack** — energy that enters as electricity, does useful computation, and leaves as heat that benefits no one.

The Open Compute Node reframes this thermodynamic reality. The return coolant at 35°C does not go directly to a dry cooler. It first passes through a plate heat exchanger whose other side carries the incoming non-potable water feed. This pre-warms the raw water to approximately 25–30°C before it enters the filtration stages.

This pre-warming step provides two specific engineering benefits:

**1. RO Membrane Efficiency:** Reverse osmosis membrane permeate flux (the rate at which purified water passes through the membrane) is strongly temperature-dependent. The relationship follows the Hagen-Poiseuille model for viscous flow through a semi-permeable membrane:

```
Flux(T) = Flux(25°C) × (μ_25°C / μ_T)
```

Where μ is the dynamic viscosity of water. At 15°C, water viscosity is approximately 1.14 mPa·s versus 0.89 mPa·s at 25°C. The approximately 22% reduction in viscosity when warming from 15°C to 25°C produces a corresponding increase in membrane permeate flux of approximately **20–25%**. This means the same membrane area either produces more potable water per hour, or achieves the same output with a smaller, lower-cost membrane array.

**2. Thermal Distillation Assist:** In water sources with very high total dissolved solids (TDS >2,000 mg/L), the elevated feed temperature can assist a post-RO thermal polishing step, though for the typical agricultural runoff and municipal non-potable water sources anticipated for US Southwest deployments, RO alone is sufficient.

### 3.2 Flow Path: Non-Potable to Potable

The complete flow path from raw water intake to potable output follows this sequence:

```
NON-POTABLE INTAKE
        │
        ▼
[FV-101] Inlet isolation valve (manual ball valve)
        │
        ▼
[FT-101] Influent flow meter (inline turbine or magnetic)
        │
        ▼
[PREHEAT HX] Plate heat exchanger — raw water side
        │  ← Primary cooling loop return (35°C) on other side
        │  Pre-warms raw water from ambient (~15°C) to ~25–30°C
        ▼
[F-101] Stage 1: Sediment Pre-filter (5 micron pleated)
        │
        ▼
[F-102] Stage 2: Activated Carbon (GAC tank)
        │
        ▼
[RO-101] Stage 3: Reverse Osmosis Membrane Array
        │        │
        │        └──→ RO Concentrate → [FV-110] → Waste drum / drain
        ▼
[UV-101] Stage 4: UV Sterilization (254nm, 40 mJ/cm²)
        │
        ▼
[F-103] Stage 5: Mineral Rebalancing (calcite/corosex)
        │
        ▼
[QIT-101] Inline quality monitoring (TDS, pH, turbidity)
        │
        ├── If PASS → [FV-102] Potable output valve → COMMUNITY USE
        │
        └── If FAIL → [FV-103] Reject valve → Non-potable drain / recycle
```

### 3.3 Flow Rate Estimation

The cooling loop itself flows 80–160 GPM through the primary side of the CDU. The water filtration secondary system is a fundamentally different flow rate — it does not need to carry the full thermal load, only extract the portion of waste heat useful for pre-warming the feed water.

**Target pre-warming from 15°C to 25°C (ΔT = 10°C for raw water):**

```
Q_preheat = m_water × Cp_water × ΔT_water
```

If we flow raw water at 10 GPM (0.63 L/s):
```
m_water = 0.63 L/s × 1.0 kg/L = 0.63 kg/s
Q_preheat = 0.63 × 4,182 × 10 = 26,347 W ≈ 26 kW
```

This 26 kW represents approximately 23% of the total heat available in the cooling loop — more than adequate to warm the feed water to the target temperature. The remaining ~89 kW goes to the dry cooler for final atmospheric rejection.

**Practical filtration throughput range:**

| Flow Rate | Daily Output | Pre-warming energy used |
|---|---|---|
| 5 GPM | 7,200 gallons/day (27,276 L/day) | ~13 kW |
| 10 GPM | 14,400 gallons/day (54,552 L/day) | ~26 kW |
| 15 GPM | 21,600 gallons/day (81,828 L/day) | ~39 kW |
| 20 GPM | 28,800 gallons/day (109,104 L/day) | ~52 kW |

Note that reverse osmosis systems typically recover 50–75% of the feed water as permeate (potable output), with the remainder becoming concentrate (reject). At 10 GPM feed flow and 65% recovery, the potable output is approximately **6.5 GPM** and the RO concentrate flow is approximately **3.5 GPM**.

**Potable water output at design point (10 GPM feed, 65% RO recovery):**
- Feed: 14,400 gallons/day
- Potable permeate: ~9,360 gallons/day (~35,440 L/day)
- RO concentrate: ~5,040 gallons/day (routed to waste drum or controlled drain)

### 3.4 Water Quality Standards: EPA 40 CFR Part 141

The potable water output must meet the EPA National Primary Drinking Water Regulations (NPDWR) under 40 CFR Part 141. These are legally enforceable standards for public water systems. Key maximum contaminant levels (MCLs) relevant to the expected input water sources:

| Contaminant Group | Representative Contaminant | MCL | Removed By |
|---|---|---|---|
| Microbiological | Total Coliforms | 0 positive samples | UV + RO |
| Microbiological | E. coli | 0 positive samples | UV + RO |
| Disinfection byproducts | Total Trihalomethanes | 80 µg/L | GAC |
| Disinfection byproducts | Haloacetic Acids | 60 µg/L | GAC + RO |
| Inorganic chemicals | Arsenic | 10 µg/L | RO |
| Inorganic chemicals | Lead | 15 µg/L (action level) | RO |
| Inorganic chemicals | Nitrate | 10 mg/L as N | RO |
| Inorganic chemicals | Fluoride | 4 mg/L | RO |
| Inorganic chemicals | Chromium (total) | 100 µg/L | RO |
| Radionuclides | Uranium | 30 µg/L | RO |
| Physical | Turbidity | 0.3 NTU (filtered systems) | Sediment + RO |
| Physical | pH | 6.5–8.5 | Mineral rebalancing |
| Physical | TDS (secondary standard) | 500 mg/L | RO |

The five-stage filtration system is designed to reduce all of these parameters to below MCL values from the expected input water quality range. Actual performance must be verified by laboratory testing specific to the source water at each deployment site.

---

## 4. Five-Stage Filtration System

### 4.1 Stage 1 — Coarse Sediment Pre-Filter

**Function:** Removes suspended particulates that would prematurely clog the activated carbon bed and RO membrane, and that cause turbidity in the raw water.

**Mechanism:** Mechanical size exclusion through a pleated polyester or spun polypropylene filter element housed in a standard 20-inch filter housing.

| Parameter | Specification |
|---|---|
| Filter media | Pleated polyester or spun polypropylene |
| Nominal pore size | 5 micron |
| Absolute pore size | 20 micron (all particles above this size removed) |
| Housing material | NSF/ANSI 42-certified polypropylene or stainless steel |
| Housing size | 20" × 4.5" Big Blue housing |
| Working pressure | 100 psi maximum |
| Flow rate (rated) | Up to 20 GPM |
| Differential pressure monitoring | Inline differential pressure gauge; replace element at 10–15 psi differential |
| Contaminant targets | Sand, silt, rust, suspended solids, sediment |
| Replacement cycle | Monthly (or at 15 psi ΔP, whichever comes first) |
| Backwash option | No (cartridge replacement) — spent cartridge to waste drum |
| NSF/ANSI certification | NSF/ANSI 42 (aesthetic effects, particulate reduction) |

**Installation notes:** The Stage 1 pre-filter is installed before any other treatment element. For high-turbidity source water (agricultural runoff with visible suspended solids), consider a dual-stage coarse pre-filter: 20 micron nominal → 5 micron nominal in series, which extends the service life of the finer element.

### 4.2 Stage 2 — Activated Carbon Filter

**Function:** Removes chlorine and chloramine (which would degrade the RO membrane), organic compounds, volatile organic compounds (VOCs), taste, and odor compounds.

**Mechanism:** Adsorption — organic molecules adhere to the vast internal surface area of activated carbon (surface area: 500–1,500 m²/g for granular activated carbon). Chlorine is reduced through a chemical reaction with the carbon surface (C + 2Cl₂ + 2H₂O → CO₂ + 4HCl), not just physical adsorption.

| Parameter | Specification |
|---|---|
| Media type | Granular Activated Carbon (GAC), coal-based or coconut shell |
| Iodine number | >1,000 mg/g (indicator of adsorptive capacity) |
| Tank size | 10" × 54" upflow mineral tank |
| Media volume | ~1.5 cubic feet |
| Service flow rate | Up to 12 GPM |
| Backwash flow rate | 5–8 GPM (automated weekly) |
| Empty bed contact time (EBCT) | Minimum 10 minutes at design flow (critical for VOC removal) |
| Chlorine removal | >99% at design EBCT |
| Chloramine removal | >90% with extended EBCT |
| Contaminant targets | Free chlorine, chloramine, THMs, VOCs, taste, odor, hydrogen sulfide |
| Replacement cycle | Every 6 months (or when chlorine breakthrough detected at outlet) |
| Monitoring point | Inline chlorine residual sensor downstream of carbon; alert at >0.1 mg/L |
| NSF/ANSI certification | NSF/ANSI 42, 53 (contaminant reduction) |
| Backwash waste | Backwash water to drain (non-hazardous); exhausted media to waste drum |

**Note on GAC vs. carbon block:** Granular activated carbon (GAC) is specified over carbon block at this flow rate because it allows backwashing (which extends media life) and has lower pressure drop at high flow rates. Carbon block provides higher NSF/ANSI 53 certification performance for lead and cyst reduction, but it is appropriate for point-of-use flows (1–3 GPM), not whole-system flows of 10–20 GPM.

### 4.3 Stage 3 — Reverse Osmosis Membrane

**Function:** Removes dissolved solids, heavy metals, nitrates, fluoride, arsenic, pharmaceutical compounds, and most remaining organic molecules that passed through the carbon filter. This is the primary barrier against inorganic contaminants and the primary mechanism for achieving EPA MCL compliance on inorganic parameters.

**Mechanism:** Semi-permeable membrane that allows water molecules to pass while rejecting dissolved ions and larger molecules. A pressure differential (pump pressure) drives water through the Thin-Film Composite (TFC) polyamide membrane. The TFC membrane is the industry standard for high-rejection RO systems.

| Parameter | Specification |
|---|---|
| Membrane type | Thin-Film Composite (TFC) polyamide spiral-wound |
| Element size | 4" × 40" (standard commercial/light industrial) |
| Elements per housing | 4 (series configuration for higher TDS rejection) |
| Nominal TDS rejection | >95% (NaCl at standard test conditions) |
| Heavy metal rejection | >97–99% for lead, arsenic, chromium, uranium |
| Nitrate rejection | 85–95% |
| Bacteria/virus rejection | >99.99% (physical exclusion at membrane pore size ~0.0001 micron) |
| Operating pressure | 150–200 psi (boosted by RO feed pump) |
| RO feed pump power | ~500 W to 1.5 kW depending on feed TDS and flow rate |
| Feed water temperature | 25–30°C (pre-warmed by cooling loop PHX — improves flux) |
| Recovery rate | 65–75% (65% permeate, 35% concentrate) |
| Maximum feed TDS | 2,000 mg/L (higher TDS requires more pressure or additional pre-treatment) |
| Concentrate (reject) disposal | ~35% of feed volume routed to waste drum or controlled drain |
| Permeate TDS | Typically <50 mg/L from 500 mg/L feed |
| Membrane housing | NSF/ANSI 58-listed, ASME pressure vessel |
| Maximum operating pressure | 300 psi (rated vessel) |
| Replacement cycle | Every 2–3 years under normal conditions |
| Cleaning requirement | CIP (clean-in-place) with citric acid or alkaline cleaner annually, or when normalized permeate flow drops >15% |
| NSF/ANSI certification | NSF/ANSI 58 (reverse osmosis) |

**RO system flow schematic:**

```
Pre-warmed Feed Water (25°C, pre-filtered)
        │
[P-201] RO Feed Pump (150–200 psi)
        │
[FT-201] Feed flow meter
        │
[RO Housing] 4-element TFC membrane array
        ├──→ Permeate (~65% of feed) → Stage 4 UV
        └──→ Concentrate (~35% of feed) → [FCV-201] Concentrate control valve
                                               │
                                      [FT-202] Concentrate flow meter
                                               │
                                   ┌──────────┴──────────┐
                                   │                     │
                              Waste drum             Controlled
                              (partial)               drain
```

### 4.4 Stage 4 — UV Sterilization

**Function:** Inactivates any bacteria, viruses, or protozoa that passed through the RO membrane due to pinhole defects, seal failures, or Cryptosporidium oocysts (which have some RO resistance). UV provides a non-chemical disinfection barrier.

**Mechanism:** UV-C light at 254 nm (the germicidal wavelength, at or near the absorption maximum of DNA and RNA) causes photochemical damage to microbial nucleic acids, preventing replication. Unlike chlorination, UV does not produce disinfection byproducts (THMs, haloacetic acids).

| Parameter | Specification |
|---|---|
| UV wavelength | 254 nm (low-pressure mercury vapor lamp) |
| UV dose (fluence) | ≥40 mJ/cm² (NSF/ANSI 55 Class A minimum for 4-log virus inactivation) |
| Flow rate (rated) | Up to 15 GPM at rated dose |
| Chamber material | 316 stainless steel with PTFE sleeve |
| Lamp type | Low-pressure high-output (LPHO) mercury vapor |
| Lamp power | 40–55 W |
| Lamp life | 9,000–12,000 hours operating hours (~12–16 months at continuous operation) |
| Replacement cycle | Annual lamp replacement (do not wait for visible failure) |
| UV intensity sensor | Continuous monitoring; alarm if UV output <70% of initial |
| Flow interlock | UV chamber outlet valve closes if UV sensor reads below threshold OR if flow stops (dead water in chamber degrades lamp performance) |
| Sleeve cleaning | Quarterly wiping with isopropyl alcohol to remove calcium scale on quartz sleeve |
| Efficacy | >4-log reduction (99.99%) bacteria, >4-log viruses, >3-log Cryptosporidium |
| NSF/ANSI certification | NSF/ANSI 55 Class A |

**Critical safety interlock:** The UV system must have a flow interlock that closes the potable outlet valve if UV output drops below the dose setpoint. Without this interlock, reduced UV output (failing lamp, fouled sleeve) could allow inadequately treated water to pass as potable.

### 4.5 Stage 5 — Mineral Rebalancing / Polishing Filter

**Function:** RO permeate is very pure (TDS <50 mg/L) but has three problems as drinking water: (1) it is slightly acidic (pH 5.5–6.5) due to dissolved CO₂; (2) it is aggressive — low-mineral water dissolves calcium from pipes, creating health concerns and infrastructure corrosion; (3) it tastes flat due to the absence of minerals. The mineral rebalancing stage corrects all three issues.

**Mechanism:** Calcite (calcium carbonate, CaCO₃) and corosex (magnesium oxide, MgO) media in a contact tank slowly dissolve into the permeate, raising pH and adding beneficial minerals.

| Parameter | Specification |
|---|---|
| Media type | Calcite (CaCO₃) primary, corosex (MgO) secondary blend |
| Calcite:corosex ratio | 90:10 by volume (standard blend for pH 6–8 inlet range) |
| Tank size | 10" × 35" mineral tank |
| Media volume | ~1.0 cubic foot |
| Service flow rate | Up to 10 GPM |
| Contact time | Minimum 5 minutes at design flow |
| pH correction | Raises pH to 7.0–8.0 range (target: 7.2–7.5) |
| Calcium addition | ~30–80 mg/L as CaCO₃ |
| Hardness addition | Temporary hardness (carbonate), not permanent |
| Turbidity impact | Final 1-micron polishing pad downstream to capture any media fines |
| Final polishing | 1-micron pleated cartridge filter downstream of mineral tank |
| Media replacement | Every 6 months (calcite slowly consumed; corosex faster) |
| Monitoring | pH sensor downstream; alert if pH <6.5 or >8.5 |
| NSF/ANSI certification | NSF/ANSI 61 (drinking water system components) |

**Summary table — all five stages:**

| Stage | Media / Technology | Mechanism | Primary Targets | Replacement Cycle |
|---|---|---|---|---|
| 1. Sediment | 5-micron pleated cartridge | Size exclusion | Sand, silt, rust, turbidity | Monthly |
| 2. Activated carbon | GAC, 10×54" tank | Adsorption + chemical | Chlorine, VOCs, taste, odor, THMs | 6 months |
| 3. Reverse osmosis | TFC 4-element spiral-wound | Semi-permeable membrane | Dissolved solids, heavy metals, nitrate, pathogens | 2–3 years |
| 4. UV sterilization | 254nm LPHO lamp, 40 mJ/cm² | UV-C photochemical inactivation | Bacteria, viruses, protozoa | Annual lamp |
| 5. Mineral rebalancing | Calcite/corosex + 1µm polish | Dissolution + size exclusion | pH correction, mineral addition, final fines | 6 months |

---

## 5. Water Quality Monitoring

### 5.1 Inline Sensor Suite

Continuous automated monitoring is non-negotiable for a system producing potable water without a licensed operator present at all times. The sensor suite provides real-time quality data to the node's monitoring system and triggers automated shutoffs if any parameter exceeds threshold.

| Sensor Tag | Parameter | Location | Technology | Normal Range | Alert Threshold | Shutdown Threshold |
|---|---|---|---|---|---|---|
| QIT-101 | TDS | Post-Stage 5 | Conductivity electrode | <200 mg/L | >400 mg/L | >500 mg/L |
| QIT-102 | pH | Post-Stage 5 | Glass electrode | 7.0–7.8 | <6.5 or >8.5 | <6.0 or >9.0 |
| QIT-103 | Turbidity | Post-Stage 5 | Nephelometric (LED) | <0.1 NTU | >0.5 NTU | >1.0 NTU |
| QIT-104 | UV Transmittance | Pre-UV stage | UV absorbance | >75% | <70% | <60% |
| QIT-105 | UV Intensity | UV chamber | Photodetector | >40 mJ/cm² | <35 mJ/cm² | <30 mJ/cm² |
| QIT-106 | Chlorine residual | Post-carbon | Colorimetric | <0.1 mg/L | >0.1 mg/L | >0.5 mg/L (RO protection) |
| FT-101 | Influent flow | Pre-filter | Turbine / mag | 5–15 GPM | <3 or >20 GPM | 0 GPM (dead stop) |
| FT-201 | RO permeate flow | Post-RO | Turbine | 3–10 GPM | <2 GPM | <1 GPM |
| PT-201 | RO feed pressure | Pre-RO pump discharge | Bourdon gauge + transmitter | 150–200 psi | <100 or >250 psi | >280 psi |
| ΔPT-101 | Sediment filter ΔP | Across Stage 1 | Differential pressure transmitter | <5 psi | >10 psi | >15 psi |
| TT-101 | Pre-heat temperature | Post-preheat HX | RTD | 23–32°C | <15 or >40°C | >45°C |
| TT-201 | Permeate temperature | Post-RO | RTD | 20–35°C | >40°C | >45°C |

### 5.2 EPA Compliance Thresholds

The EPA National Primary Drinking Water Regulations (40 CFR Part 141) establish maximum contaminant levels that are the legal compliance bar for the potable water output. The inline TDS, pH, and turbidity sensors cannot directly measure all regulated contaminants — they serve as continuous surrogate indicators of treatment performance. Laboratory testing is required to verify MCL compliance for regulated chemicals.

**Critical EPA 40 CFR Part 141 thresholds for the expected contaminant profile:**

| Contaminant | MCL | Analytical Method | Sample Frequency |
|---|---|---|---|
| Total Coliforms | 0 positive samples | Presence/absence culture | Monthly |
| E. coli | 0 positive samples | Culture or qPCR | Monthly |
| Turbidity | ≤0.3 NTU (filtered surface water) | Nephelometric | Continuous (inline) |
| Nitrate | 10 mg/L as N | Ion chromatography | Quarterly |
| Arsenic | 10 µg/L | ICP-MS | Quarterly |
| Lead | 15 µg/L (action level) | ICP-MS | Quarterly |
| Fluoride | 4 mg/L | Ion-selective electrode | Quarterly |
| Chromium | 100 µg/L | ICP-MS | Quarterly |
| Total Trihalomethanes | 80 µg/L | GC/MS | Quarterly |
| Haloacetic Acids | 60 µg/L | GC/MS | Quarterly |
| Uranium | 30 µg/L | ICP-MS | Annually |
| pH (secondary standard) | 6.5–8.5 (secondary) | pH electrode | Continuous (inline) |
| TDS (secondary standard) | 500 mg/L | Conductivity | Continuous (inline) |

**Secondary standards** (non-enforceable) include TDS ≤500 mg/L, pH 6.5–8.5, and turbidity ≤5 NTU. This design targets these secondary standards in the potable output to ensure palatability, not just legal minimum compliance.

### 5.3 Automated Shutoff Logic

The monitoring system implements a three-tier response to quality exceedances:

**Tier 1 — Alert:** Log the event, send notification to operator dashboard. No operational change. Investigate within 24 hours.

**Tier 2 — Warning:** Divert output from potable line to non-potable drain/recycle. Potable output valve closes. Send alert to operator with required investigation timeline (4 hours).

**Tier 3 — Shutdown:** Close both inlet and outlet valves. Stop RO pump. Alert sent to operator with emergency response requirement. System remains locked until manually cleared by trained operator with verification laboratory test.

```
Quality Sensor Reading
        │
   ┌────┴────────────┬──────────────────┐
   │                 │                  │
 Normal           Alert             Warning/Shutdown
   │            threshold           threshold
   │           exceeded             exceeded
   │                │                  │
Log + Continue  Log + Notify      Divert output +
normal ops      operator          lock potable valve +
                                  emergency alert +
                                  await manual clear
```

### 5.4 Sample Ports for Laboratory Testing

Four labeled sample ports are installed in the filtration system for periodic laboratory testing that cannot be accomplished with inline sensors:

| Port ID | Location | Sample Type | Test Purpose |
|---|---|---|---|
| SP-01 | Post-Stage 1 (sediment) | Raw grab sample | Baseline turbidity, TSS characterization |
| SP-02 | Post-Stage 3 (RO) | Grab or composite | RO rejection verification, TDS, metals |
| SP-03 | Post-Stage 4 (UV) | Grab sample for microbio | Coliform, E. coli, pathogen verification |
| SP-04 | Post-Stage 5 (final output) | Grab or composite | Full EPA primary + secondary parameter panel |

Sample ports are 1/4" stainless steel ball valves with barbed 1/4" OD fitting, capped when not in use, labeled with port ID and last sample date.

---

## 6. Waste Management

### 6.1 Waste Streams and Characterization

The filtration system produces three primary waste streams that must be collected, characterized, and properly disposed of:

| Waste Stream | Source | Volume / Period | Expected Contents | Classification |
|---|---|---|---|---|
| Spent sediment cartridge | Stage 1 monthly replacement | 1 cartridge/month | Sand, silt, rust, suspended solids | Non-hazardous solid waste |
| GAC backwash water | Stage 2 weekly backwash | ~50 gallons/week | Carbon fines, adsorbed organics, trace chlorine | Non-hazardous liquid waste |
| Exhausted GAC media | Stage 2 replacement | ~1.5 cu ft every 6 months | Saturated activated carbon | Potentially hazardous if contaminants adsorbed exceed TCLP thresholds |
| RO concentrate | Stage 3 continuous reject | ~3–5 GPM (35% of feed) | Concentrated dissolved solids, heavy metals (if present in feed) | Characterize by source water analysis |
| Spent RO membrane | Stage 3 replacement every 2–3 years | 4 elements | TFC polyamide membrane | Non-hazardous unless feed water was contaminated |
| Spent UV lamp | Stage 4 annual replacement | 1 lamp/year | Mercury vapor lamp (sealed glass) | Universal waste (mercury) — special handling |
| Spent calcite/corosex media | Stage 5 every 6 months | ~1 cu ft | Consumed mineral media, calcium carbonate fines | Non-hazardous |

**Critical classification note:** Spent GAC media may require TCLP (Toxicity Characteristic Leaching Procedure) testing before classification. If the source water contained heavy metals (arsenic, lead, chromium) above certain levels, the GAC may have concentrated these to levels that trigger hazardous waste classification under RCRA (40 CFR Part 261). Site-specific source water characterization determines this.

### 6.2 The 55-Gallon Drum System

A single standard DOT 17H open-head steel drum (55 gallons, UN-certified) is positioned in the cooling zone adjacent to the filtration system. This drum collects the manageable solid waste fractions:

**Primary drum contents:**
- Spent Stage 1 sediment filter cartridges (bagged in clear polyethylene)
- Spent Stage 5 calcite/corosex media (bagged)
- GAC backwash fines (dewatered and bagged)
- Any other solid filtration byproducts

**Drum contents excluded:**
- RO concentrate (liquid, handled separately via controlled drain — see Section 6.3)
- Spent UV lamps (universal waste — handled under separate universal waste program)
- Spent RO membranes (too bulky — boxed separately, not in drum)

**Drum specifications:**

| Parameter | Value |
|---|---|
| Container type | DOT 17H open-head steel drum |
| Capacity | 55 US gallons (208 L) |
| UN rating | UN 1A2/Y / (as applicable to contents) |
| Lid type | Removable with bolt ring closure |
| Liner | 4-mil HDPE liner inside drum |
| Drum weight (empty) | ~20 kg |
| Drum weight (full, estimated) | ~80–100 kg |
| Handling equipment | Hand truck rated 250 kg, with strap |
| Fill level sensor | Ultrasonic level transmitter; alert at 80% full |
| Location | Wall-mounted bracket in cooling zone, accessible from entry |

### 6.3 Fill Rate Estimation

Fill rate varies significantly with source water quality. The primary driver is the suspended solids load in the input water.

**Scenario A — Moderate quality non-potable water (municipal non-potable, 50 mg/L TSS, 500 mg/L TDS):**
- Sediment filter loading: ~50 mg/L × 10 GPM × 1,440 min/day = ~1,008 g/day (~1 kg/day)
- Filter cartridge replacement: monthly (primarily by pressure drop, not mass loading)
- Drum fill rate: ~30–40 kg/month of solid waste
- **Drum swap frequency: monthly** (fills to ~40% capacity)

**Scenario B — Agricultural runoff (higher turbidity, 200 mg/L TSS, 800 mg/L TDS):**
- Sediment filter loading: ~200 mg/L × 10 GPM = ~4 kg/day
- Filter cartridge replacement: weekly or bi-weekly
- Drum fill rate: ~80–120 kg/month
- **Drum swap frequency: every 2–3 weeks** (fills to capacity)

The monthly swap frequency in the vision guide is the standard cadence for moderate-quality input water. Sites with high-turbidity agricultural runoff will require more frequent swaps or a higher-capacity pre-filter system (larger housing, higher-capacity cartridges, or an automatic backwashing screen pre-filter upstream of the Stage 1 cartridge).

### 6.4 RCRA Requirements and Waste Manifesting

The Resource Conservation and Recovery Act (RCRA), implemented by EPA under 40 CFR Parts 260–299, governs the handling, transport, and disposal of solid and hazardous waste.

**Non-hazardous solid waste (typical case):** For typical municipal non-potable or agricultural runoff with no heavy metal contamination, the filtration waste is non-hazardous solid waste. Disposal through a licensed solid waste hauler is sufficient. No EPA manifest form is legally required, though best practice is to maintain an internal waste log.

**Hazardous waste (if triggered by source water):** If source water characterization reveals heavy metals above TCLP thresholds in spent GAC or RO concentrate, the waste becomes RCRA hazardous waste. Requirements include:
- EPA Hazardous Waste Generator ID number for the site
- EPA Uniform Hazardous Waste Manifest (Form 8700-22) for each drum shipped
- Licensed hazardous waste transporter
- Licensed hazardous waste treatment, storage, and disposal facility (TSDF)
- Land disposal restriction (LDR) notification
- Record retention: 3 years

**Universal waste — UV lamps:** Spent mercury vapor UV lamps are managed under the Universal Waste Rule (40 CFR Part 273), a streamlined RCRA program for common hazardous wastes:
- Label as "Universal Waste — Lamps" with accumulation start date
- Accumulate at the facility up to 1 year
- Ship to a universal waste handler or lamp recycler
- No manifest required for universal waste

### 6.5 Monthly Drum Swap Procedure

Step-by-step procedure for the monthly drum swap by trained site maintenance personnel:

1. Confirm that filtration system is in standby/bypass mode (not producing potable water during swap).
2. Verify drum fill level on monitoring dashboard (<100% — do not allow overflow).
3. Don appropriate PPE: nitrile gloves, safety glasses.
4. Remove drum bolt ring; lift HDPE liner out of drum with bag tie. Seal liner bag.
5. Place sealed liner bag inside new HDPE liner in a clean 55-gallon DOT 17H drum.
6. Label full drum: site ID, waste type ("filtration byproducts — non-hazardous / pending characterization"), date sealed, estimated weight.
7. Install new HDPE liner in drum bracket position.
8. Seal full drum with bolt ring. Log drum seal date and estimated weight in maintenance record.
9. Photograph drum label before removal from cooling zone.
10. Move full drum to site staging area using rated hand truck.
11. Schedule pickup with licensed waste hauler (recurring monthly contract).
12. Resume filtration system operation and confirm all inline quality sensors reading within normal range.
13. Complete maintenance log entry (drum number, date, weight, hauler name, pickup date).

### 6.6 Upstream Processing: Waste Disposition Chain

The collected waste follows a documented chain of custody:
- Licensed solid waste or hazardous waste transporter picks up drum at site
- Drum transported to regional materials recovery facility (MRF) or hazardous waste TSDF
- Sediment and mineral waste fractions: landfill disposal or beneficial reuse (construction fill, road base, if composition is appropriate)
- Exhausted GAC: thermal reactivation at specialized reactivation facility — carbon is restored to approximately 90% of original capacity and re-sold into the market, closing the material loop
- RO membranes: manufacturer take-back program (TORAY, DOW/Filmtec, or Hydranautics programs exist) or clean technology recycler

---

## 7. Plumbing and Piping

### 7.1 Pipe Material Selection by Application

Different sections of the water system use different materials matched to the fluid, pressure, temperature, and regulatory requirements:

| Application | Recommended Material | Reason |
|---|---|---|
| Raw (non-potable) water intake, pre-treatment | Schedule 40 PVC or CPVC | Low cost, corrosion resistant, NSF/ANSI 61 listed for potable service, suitable to 60°C (CPVC) |
| Post-RO permeate, potable output | CPVC or Type L copper | NSF/ANSI 61 required; avoid PVC at elevated temps; copper is traditional potable standard |
| Cooling loop (primary, PG/water) | Copper Type L or 304 stainless steel | Compatibility with PG, pressure rating, no zinc (dezincification risk with PG mixtures) |
| CDU internal headers | 304 or 316 stainless steel | Pressure rating, compatibility, cleanability |
| Outdoor-exposed or below-grade | PEX-A (NSF/ANSI 14, 61) | Freeze resistance, flexibility, no corrosion |
| RO membrane housing connections | NSF/ANSI 58 rated fittings | Required for RO systems producing potable water |
| Waste / RO concentrate drain | Schedule 40 PVC | Non-potable drain service, cost-effective |

**PEX note:** PEX-A (cross-linked polyethylene, expansion method) is the preferred material for any outdoor-exposed or below-grade potable water piping because it can withstand freeze-thaw cycles without splitting (expands under freezing rather than fracturing). PEX is also more flexible than rigid copper, reducing the number of fittings and potential leak points.

**No galvanized steel:** Galvanized steel is explicitly excluded from potable water service due to zinc leaching and galvanic corrosion with dissimilar metals.

### 7.2 Piping and Instrumentation Diagram (P&ID) Description

The complete P&ID uses ISA 5.1 symbology and covers three interconnected systems. Key conventions:
- Process lines: solid single-line (main process piping)
- Instrument signal lines: dashed
- Equipment: circles (vessels, tanks), rectangles (exchangers), standard ISA symbols for pumps, valves
- Tag numbers: type + loop number (e.g., FT-101 = Flow Transmitter, loop 101)

**P&ID Layout — Three Zones:**

**Zone A: Raw Water Intake and Pre-Heating**
- FV-101: Manual inlet isolation valve (ball valve, 1")
- FT-101: Turbine flow meter (0–20 GPM)
- TT-101: Raw water temperature transmitter
- E-101: Plate heat exchanger (raw water / cooling loop return side)
- Bypass valve (BV-101) with 3-way valve for pre-heat bypass during startup or cooling loop shutdown

**Zone B: Primary Cooling Loop**
- P-101A/B: CDU circulation pumps (N+1 parallel)
- E-102: CDU plate heat exchanger (primary loop / secondary heat rejection)
- TV-101: Temperature control valve (modulates flow to dry cooler vs. filtration PHX)
- PT-101: Primary loop supply pressure transmitter
- TT-102/103: Supply and return temperature transmitters
- TK-101: Expansion tank
- PRV-101: Primary loop pressure relief valve (set 80 psi)
- XV-101/102: Per-rack isolation ball valves (manual)

**Zone C: Filtration Train**
- F-101: Stage 1 sediment filter housing, with ΔPT-101 across housing
- F-102: Stage 2 GAC tank with automated backwash valve BV-201
- P-201: RO feed pump with VFD
- PT-201: RO feed pressure transmitter
- RO-101: RO membrane housing (4 elements)
- FT-201/202: Permeate and concentrate flow meters
- FCV-201: RO concentrate control valve (ratio control to maintain 65% recovery)
- UV-101: UV sterilization chamber with UV intensity sensor QIT-105
- XV-201: UV flow interlock valve (closes on UV underdose alarm)
- F-103: Stage 5 mineral contact tank + 1µm polishing filter
- QIT-101/102/103: Final quality transmitters (TDS, pH, turbidity)
- FV-102: Potable output valve (motor-operated, closes on quality alarm)
- FV-103: Quality reject divert valve (opens on quality alarm, routes to drain)

### 7.3 Valve Types and Applications

| Valve Function | Valve Type | Size | Notes |
|---|---|---|---|
| Isolation (manual) | Full-bore ball valve | 3/4"–1-1/4" | NSF/ANSI 61 for potable service |
| Isolation (motor-operated) | MOV ball valve | 3/4"–1" | Fail-closed on power loss (potable output, UV interlock) |
| Check (backflow prevention) | Swing check or spring-loaded check | 3/4"–1" | Required at all cross-connection points |
| Pressure relief | Spring-loaded PRV | 1/2" | Primary loop: 80 psi set; RO housing: 250 psi set |
| Flow control (RO recovery) | Globe or needle valve with positioner | 1/2"–3/4" | Concentrate ratio control |
| Backwash control | Motorized ball valve | 3/4"–1" | GAC automatic backwash sequence |
| Three-way divert | 3-way ball valve | 3/4" | Quality pass/fail divert at potable outlet |

**Backflow prevention — mandatory cross-connection control:** At every point where the non-potable water supply connects to the water treatment system, and at the point where treated water connects to community distribution, a backflow preventer is required by plumbing code. The appropriate device type is determined by the degree of hazard:
- Non-potable inlet connection: Reduced Pressure Zone (RPZ) backflow preventer — the highest protection level, required where the source is non-potable and the downstream system is producing potable water
- Potable output connection to community distribution: Double Check Valve Assembly (DCVA) at minimum, RPZ recommended

### 7.4 Leak Detection

Leak detection protects against both cooling loop coolant (propylene glycol) and potable water losses, which in a sealed container can cause both hardware damage and safety issues:

| Detection Method | Location | Response |
|---|---|---|
| Rope-style leak detection cable | Along all piping runs at floor level, especially under CDU and filter bank | Alarm to monitoring system; automatic CDU pump shutdown on confirmed leak |
| Point sensors (float switch) | Low points in cooling zone floor (drain channels) | Backup to rope sensor; triggers on pooling water |
| Flow balance monitoring | Comparison of CDU supply flow meter (FT-301) vs. return flow meter (FT-302) | >2% imbalance triggers leak investigation alarm |
| RO permeate vs. concentrate flow balance | FT-201 (permeate) + FT-202 (concentrate) should sum to ~feed flow | Significant imbalance indicates housing leak or membrane failure |

**Floor design:** The cooling zone floor section under the CDU, filtration system, and drum has a 1% slope toward a central drain channel. The drain channel terminates in a sealed collection sump with a submersible level sensor. Any leaked fluid collects here rather than spreading under racks.

### 7.5 Freeze Protection

The cooling zone occupies the end of the container, which in cold-weather deployments (although the primary reference site is the US Southwest, the design must consider deployment in 4-season climates) can approach freezing temperatures.

**Measures:**
- Container insulation (R-13 walls, R-19 ceiling) reduces heat loss. The self-heating compute racks inside the container make freezing of interior components unlikely unless the node is shut down in winter.
- Any water piping in the entry zone or penetration conduit sections (exposed to outdoor ambient) uses PEX-A, which survives freeze-thaw without cracking.
- Heat trace cable (self-regulating, 5 W/ft) applied to all water piping within 1m of an exterior penetration, thermostatically controlled to energize at +4°C ambient.
- Drain/winterize valves at low points: allow full water drain from filtration system during extended cold-weather shutdown. Cooling loop PG/water mixture provides freeze protection to -13°C without heat trace.
- Outdoor connections (inlet stub, outlet stub): insulated pipe sleeve + heat trace.

---

## 8. Environmental Considerations

### 8.1 Water Consumption vs. Water Production — Net Positive Calculation

Traditional data centers are net water consumers. They consume municipal potable water for cooling tower makeup, for humidification, and for other facility uses. The Open Compute Node inverts this relationship.

**Traditional air-cooled data center water use:**
A 120 kW air-cooled facility uses no direct water for cooling but consumes water indirectly through power grid generation. The EPA estimates US power generation requires approximately 1.8 gallons of water per kWh for thermoelectric generation (cooling towers at power plants).
- Annual power consumption: 120 kW × 8,760 hrs = 1,051,200 kWh
- Indirect water consumption: 1,051,200 × 1.8 = **~1.9 million gallons/year** (indirect, at power plant)

**Traditional liquid-cooled data center Water Usage Effectiveness (WUE):**
The industry WUE metric (gallons of water consumed per kWh of IT load) averages approximately **0.2 gallons/kWh** for modern liquid-cooled facilities with cooling towers.
- WUE for traditional liquid-cooled 120 kW facility: 120 kW × 8,760 hrs × 0.2 = **~210,240 gallons/year** consumed on-site (plus indirect)

**Open Compute Node water balance:**

The node runs on 100% renewable energy, eliminating the thermoelectric indirect water consumption entirely.

For on-site water:
- Intake (non-potable): 10 GPM × 60 min/hr × 8,760 hr/yr = **5,256,000 gallons/year** non-potable water intake
- Potable output (65% RO recovery, continuous): 6.5 GPM × 60 × 8,760 = **3,416,400 gallons/year** clean potable water output
- RO concentrate (controlled drain or waste): 3.5 GPM × 60 × 8,760 = **1,839,600 gallons/year**

The node does not "consume" water in the sense of evaporating it or losing it permanently. The non-potable input water is transformed and returned to the community as potable water. The WUE for the Open Compute Node is **negative** — it produces more usable water than a conventional facility would consume.

| Metric | Traditional Liquid-Cooled DC | Open Compute Node |
|---|---|---|
| WUE (gallons/kWh) | 0.2 | -0.55 (water producer) |
| On-site water consumed | 210,240 gal/yr | 0 gal/yr (water returned) |
| On-site potable water produced | 0 | 3,416,400 gal/yr |
| Renewable energy | No (typical) | Yes (100%) |
| Indirect water (power gen) | ~1.9M gal/yr | 0 (renewable) |

### 8.2 Water Usage Effectiveness (WUE) in Context

The WUE metric, developed by The Green Grid, measures data center water consumption efficiency:

```
WUE = Annual Site Water Consumption (gallons)
      ─────────────────────────────────────────
      Annual IT Equipment Energy Consumption (kWh)
```

Industry average WUE is approximately 0.49 L/kWh (0.13 gal/kWh) for modern facilities; hyperscale leaders approach 0.18 L/kWh. The Open Compute Node's WUE is negative under this definition because it produces rather than consumes water. A modified metric — **Water Return Effectiveness (WRE)** — would be the appropriate measure:

```
WRE = Annual Potable Water Produced (gallons)
      ─────────────────────────────────────────
      Annual IT Equipment Energy Consumption (kWh)

WRE (Open Compute Node) = 3,416,400 / 1,051,200 = 3.25 gallons/kWh
```

This means the node returns 3.25 gallons of clean potable water for every kilowatt-hour of AI computation performed. This is the fundamental value exchange of the dual-purpose design.

### 8.3 Thermal Discharge Limits

The RO concentrate and cooling system blowdown (if a cooling tower were used) are the warm effluent streams. For the dry cooler configuration in the reference design:

- **No direct water discharge from cooling loop:** The primary loop is closed; no thermal discharge to the environment occurs from the cooling loop itself.
- **RO concentrate:** ~3.5 GPM at ambient temperature (not warm — it exits the RO membrane at near-feed-water temperature, approximately 25–30°C). Temperature is not a concern; TDS concentration is. Discharge requires evaluation against local NPDES (National Pollutant Discharge Elimination System) permit requirements if discharged to surface water. For municipal sewer discharge, local sewer authority approval is required.
- **Dry cooler thermal discharge:** The dry cooler rejects residual heat (~89 kW) to the atmosphere via forced-air heat exchange. This is a warm air plume, not a water discharge. It has no regulatory thermal discharge limits under clean water regulations.
- **No cooling tower:** The reference design explicitly avoids cooling towers, which are the primary source of legionella risk and regulated thermal discharge in conventional data centers. The dry cooler eliminates both issues.

### 8.4 Noise from Pumps and Dry Coolers

The liquid cooling system is substantially quieter than an equivalent air-cooled system, but is not silent. Relevant noise sources:

| Source | Typical Sound Power Level | Noise Control Method |
|---|---|---|
| CDU circulation pumps (2×) | 55–65 dBA at 1m | Vibration isolation mounts; acoustic enclosure |
| Dry cooler fans (outdoor) | 65–75 dBA at 1m | Fan speed modulation (VFD); nighttime setback |
| RO feed pump | 50–60 dBA at 1m | Enclosed in filtration bay |
| Container HVAC (residual air cooling) | 55–65 dBA at 1m | Muffled penetrations |
| **Total exterior noise at 10m** | **~50–60 dBA** | Site screening (berms, vegetation) |

For comparison, a quiet residential neighborhood is approximately 40 dBA; normal conversation is ~60 dBA. The node at 10m distance is comparable to a window air conditioner. Local noise ordinances for light industrial sites typically allow 65–75 dBA during daytime and 55–60 dBA at night. Compliance with nighttime limits requires dry cooler fan speed reduction — this is achievable because overnight compute loads are typically lower, reducing cooling demand.

The absence of high-velocity air discharge (a dominant noise source in air-cooled data centers) is the liquid cooling system's greatest noise advantage. Air-cooled facilities at 120 kW would require large CRAC or CRAH units with significant fan noise. The CDU pumps and dry cooler fans are a fundamentally quieter replacement.

---

## 9. Sources

| Standard / Organization | Title / Application | Relevance |
|---|---|---|
| ASHRAE TC 9.9 | *Thermal Guidelines for Data Processing Environments* (4th Ed.) | Liquid cooling classes, inlet/outlet temperature specifications, heat management |
| EPA 40 CFR Part 141 | National Primary Drinking Water Regulations | MCLs for all regulated contaminants in potable water output |
| EPA 40 CFR Parts 260–280 | Resource Conservation and Recovery Act (RCRA) — Solid and Hazardous Waste | Waste classification, manifest requirements, generator requirements |
| EPA 40 CFR Part 122 | NPDES Permit Program — RO concentrate discharge | Permitting requirements for RO concentrate discharge to surface waters |
| NSF/ANSI 42 | *Drinking Water Treatment Units — Aesthetic Effects* | Sediment filter and carbon filter certification |
| NSF/ANSI 53 | *Drinking Water Treatment Units — Health Effects* | Carbon filter and membrane certification for health-effects reduction |
| NSF/ANSI 55 | *Ultraviolet Microbiological Water Treatment Systems* | UV sterilization system certification (Class A = 40 mJ/cm²) |
| NSF/ANSI 58 | *Reverse Osmosis Drinking Water Treatment Systems* | RO system and component certification |
| NSF/ANSI 61 | *Drinking Water System Components — Health Effects* | All wetted components in potable water service |
| ISA 5.1-2022 | *Instrumentation Symbols and Identification* | P&ID symbology standard |
| UPC (Uniform Plumbing Code) | *Plumbing installation requirements* | Cross-connection control, backflow prevention, pipe sizing |
| IPC (International Plumbing Code) | *Alternative to UPC (jurisdiction-dependent)* | Cross-connection control, backflow prevention |
| ASME Section VIII | *Pressure Vessel Design and Fabrication* | RO membrane housings, expansion tanks |
| NVIDIA Corporation | *GB200 NVL72 Product Specifications, DGX User Guide* | Thermal design power, cooling requirements, flow specifications |
| HPE / Supermicro | *GB200 NVL72 Deployment and Integration Specifications* | Cold plate specifications, manifold design |
| DOE / LBNL | *United States Data Center Energy Usage Report* | WUE benchmarks, industry comparison data |
| The Green Grid | *Water Usage Effectiveness (WUE) White Paper* | WUE metric definition and industry context |
| EPA / USGS | *Thermoelectric Power Water Use* | Indirect water consumption calculations for power generation |
| Parker Hannifin / Stäubli | *Quick-Disconnect Coupling Selection Guide* | Dry-break coupling specifications for coolant connections |
| DOT 49 CFR | *Hazardous Materials Regulations — Drum Packaging* | DOT 17H drum rating and labeling for waste transport |
| EPA 40 CFR Part 273 | Universal Waste Rule | Mercury lamp handling and disposal requirements |

---

*Module 3 of 6. Depends on: 02-engineering-specifications.md (thermal budget, dimensional constraints). Used by: 06-verification-matrix.md (water quality acceptance criteria, cooling system sign-off).*
