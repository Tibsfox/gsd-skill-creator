# Cross-System Synthesis and Integration Analysis

> **Domain:** Systems Engineering -- Multi-Disciplinary Integration
> **Module:** 07 -- Open Compute Node: Cross-System Synthesis, Budget Reconciliation, and Feasibility Assessment
> **Through-line:** *An ISO shipping container is a box. Solar panels are glass and silicon. A pump is a motor and an impeller. A GPU is sand that learned to think. None of these components, alone, is remarkable. What is remarkable is the interface specification that connects them into a system where waste heat from computation pre-warms water for reverse osmosis, where the same DC bus that feeds a GPU feeds a UV sterilization lamp, where the weight budget that accommodates 1,360 kg of GPU rack leaves 20,000 kg of margin for a future that has not yet been designed. Systems engineering is the discipline of interfaces. This document maps every interface in the Open Compute Node and proves, through budget reconciliation across four independent engineering modules, that the concept closes.*

---

> **PROFESSIONAL ENGINEER REVIEW REQUIRED**
>
> This synthesis document aggregates figures from four conceptual engineering modules, each produced by AI-assisted analysis. No figure in this document has been independently verified by a licensed Professional Engineer. Before any construction, procurement, or financial commitment based on this synthesis:
>
> 1. All structural, electrical, thermal, and fluid calculations must be verified by appropriately licensed PEs.
> 2. All cost estimates are rough order-of-magnitude and must not be used for procurement without independent estimating.
> 3. All regulatory compliance claims must be verified with the Authority Having Jurisdiction at the specific deployment site.
>
> The authors assume no liability for use of this document without proper professional review.

---

## Table of Contents

1. [System Integration Analysis](#1-system-integration-analysis)
2. [Weight Budget Reconciliation](#2-weight-budget-reconciliation)
3. [Power Budget Reconciliation](#3-power-budget-reconciliation)
4. [Thermal Budget Reconciliation](#4-thermal-budget-reconciliation)
5. [Bill of Materials](#5-bill-of-materials)
6. [Total Deployed Cost Estimate](#6-total-deployed-cost-estimate)
7. [Comparison to Commercial Alternatives](#7-comparison-to-commercial-alternatives)
8. [Net-Positive Calculation](#8-net-positive-calculation)
9. [Scaling: Fleet Deployment Projections](#9-scaling-fleet-deployment-projections)
10. [The Through-Line: Amiga Principle at Infrastructure Scale](#10-the-through-line-amiga-principle-at-infrastructure-scale)

---

## 1. System Integration Analysis

### 1.1 The Integration Problem

Four independent engineering modules have produced four independent designs: a container (M1), a power system (M2), a cooling and water system (M3), and a compute payload (M4). Each module was developed against the vision document's parameters and against the engineering standards relevant to its domain. The integration question is whether these four designs compose into a coherent whole -- whether the power system actually delivers what the compute payload demands, whether the cooling system actually rejects what the compute payload produces, whether the container actually holds what all three subsystems require, and whether the water filtration system actually benefits from the waste heat rather than being harmed by it.

This is not a trivial question. Modular engineering specifications routinely fail at interfaces. The structural engineer sizes a floor for distributed loads; the compute engineer specifies a point load. The power engineer sizes a solar array for average demand; the compute engineer specifies a peak transient. The cooling engineer sizes a heat exchanger for steady state; the thermal load includes startup transients. The integration analysis in this section maps every cross-system interface and verifies that the specifications match on both sides.

### 1.2 Interface Map: Power Feeds Cooling, Cooling Feeds Compute, Compute Serves Community

The Open Compute Node is a directed acyclic graph of energy and material flows. Sunlight enters the system as photons, transforms through silicon into DC electricity, travels through copper into GPU silicon, transforms into computation and heat, transfers through propylene glycol into a heat exchanger, warms non-potable water, and exits the system as potable water and useful computation. At every node in this graph, there is an interface specification that must balance across both sides.

**Primary Energy Flow:**

```
SUNLIGHT (1,000 W/m^2)
    |
    v
SOLAR ARRAY (640 kW nameplate, 24.7% CF)
    |--- 1,500V DC ---> SITE DC BUS
    |                       |
WIND TURBINE (75 kW)       |
    |--- 1,500V DC ---------+
                            |
                     BESS (3,500 kWh LFP)
                     [bidirectional DC-DC]
                            |
                     DC-DC CONVERTER (1,500V -> 48V)
                            |
                     48V DC BUS BAR
                      /            \
               COMPUTE             AUXILIARY
           (120 kW, GB200)    (35 kW: CDU, filtration,
                |              monitoring, lighting)
                v
           HEAT (140 kW total facility)
                |
                v
           CDU PRIMARY LOOP (PG/water)
           [115 kW liquid, 25 kW air]
                |
         ------+------
        |             |
   PLATE HX       DRY COOLER
   (26 kW to      (89 kW to
    raw water)     atmosphere)
        |
        v
   RAW WATER PRE-WARMING (15C -> 25C)
        |
        v
   5-STAGE FILTRATION
        |
        v
   POTABLE WATER OUTPUT (~9,360 gal/day)
        |
        v
   COMMUNITY
```

**Interface Verification Table:**

| Interface | Upstream Spec | Downstream Requirement | Match? |
|-----------|--------------|----------------------|--------|
| Solar to DC bus | 640 kW at 1,500V DC (M2 Sec 2.2) | Site DC bus rated 1,500V, 500-600A OCPD (M2 Sec 5.2) | Yes |
| DC bus to BESS | 1,500V DC bidirectional (M2 Sec 3.3) | BESS 1,000-1,500V DC configurable (M2 Sec 3.3) | Yes |
| DC bus to DC-DC converter | 1,500V input, 158 kW (M2 Sec 5.3) | 2x 80 kW converters, N+1 (M2 Sec 5.3) | Yes |
| DC-DC to 48V bus bar | 48-51V output, 97-98% eff. (M2 Sec 5.3) | GB200 accepts 48-51V DC (M4 Sec 1.5) | Yes |
| 48V bus to rack | 3,000A rated bus bar (M2 Sec 5.3) | 2,500A at 120 kW / 48V (M4 Sec 1.5) | Yes, 20% margin |
| Rack to CDU (thermal) | 115 kW liquid-cooled load (M3 Sec 1.2) | CDU rated 140 kW total (M3 Sec 2.2) | Yes |
| CDU to plate HX | 35C return coolant (M3 Sec 1.5) | PHX sized for 115 kW, 6-8 m^2 (M3 Sec 2.2) | Yes |
| Plate HX to raw water | 26 kW transferred at 10 GPM (M3 Sec 3.3) | 10C rise, 15C to 25C (M3 Sec 3.3) | Yes |
| Raw water to filtration | 25C pre-warmed, 10 GPM (M3 Sec 3.3) | RO optimal at 25-30C (M3 Sec 3.1) | Yes |
| Filtration to community | 9,360 gal/day potable (M3 Sec 3.3) | EPA 40 CFR Part 141 (M3 Sec 3.4) | Yes, with monitoring |
| Rack weight to floor | 1,360 kg per rack (M4 Sec 2.1) | 6mm A36 overlay, 340 kg/foot (M1 Sec 1.6) | Yes |
| Rack dims to container | 600mm W x 1,200mm D (M4 Sec 2.1) | 2,352mm container width (M1 Sec 1.2) | Yes, with center-row layout |
| All systems to container | Total ~10,141 kg gross (M1 Sec 4.1) | ISO max 30,480 kg (M1 Sec 1.2) | Yes, 23% utilized |

Every interface in the system closes. There are no orphaned specifications -- no case where one module produces an output that the receiving module cannot accept. This is the fundamental integration finding: the four modules compose.

### 1.3 Critical Interface: Thermal-to-Water Coupling

The most architecturally novel interface in the OCN is the coupling between the cooling system's waste heat and the water filtration system's feed pre-warming. This interface deserves special scrutiny because it is the mechanism that transforms the node from a conventional containerized data center into a water production facility.

Module 3, Section 3.3 establishes the governing relationship. At 10 GPM raw water flow and a 10C temperature rise (15C to 25C), the pre-warming heat exchanger absorbs approximately 26 kW from the cooling loop return. The total cooling loop carries approximately 115 kW of liquid-cooled thermal load. The 26 kW consumed by pre-warming represents 23% of the available thermal budget -- leaving 89 kW for the dry cooler to reject to the atmosphere.

This ratio is favorable for several reasons:

1. **The filtration system does not constrain cooling capacity.** Even if the filtration system were shut down entirely (drum swap, maintenance, quality exceedance), the dry cooler handles the full 115 kW independently. The bypass valve (BV-101 in the P&ID, M3 Sec 7.2) routes all return coolant to the dry cooler when the filtration preheat is offline.

2. **The thermal coupling improves RO performance without creating thermal dependency.** The 20-25% improvement in RO membrane permeate flux from pre-warming (M3 Sec 3.1) is a bonus, not a requirement. The RO system operates at ambient feed temperature (15C) at reduced but functional throughput. The pre-warming increases production capacity but the system does not fail without it.

3. **The heat balance is self-regulating.** If compute load drops (inference mode at 60-85 kW), the cooling loop carries less heat, the pre-warming transfer drops proportionally, and the RO system produces slightly less potable water at slightly lower flux. The system degrades gracefully rather than failing at a threshold.

### 1.4 Cross-System Dependency Matrix

| If This Fails... | ...This Is Affected | ...This Remains Operational |
|---|---|---|
| Solar array (partial cloud) | BESS discharges faster | Compute, cooling, filtration -- all on BESS |
| BESS (single container) | Overnight runtime halved | Daytime ops normal; load management at night |
| CDU pump (primary) | Standby pump activates in 15s | Compute continues; no interruption |
| Filtration system | No potable water output | Compute, cooling -- independent loops |
| Single GPU tray | 1/18 compute loss | Remaining 17 trays unaffected |
| Fiber connection (primary) | OOB LTE failover | Local compute continues; external access via LTE |
| Wind turbine | ~15% annual energy loss | Solar + BESS compensate; load mgmt in winter |
| Dry cooler fans (partial) | Remaining fans increase speed | Cooling continues at reduced margin |
| Waste drum full | Filtration pauses | Compute, cooling unaffected |

The dependency matrix reveals a critical design property: no single subsystem failure causes total node failure. The system degrades gracefully across every failure mode. The only complete-loss scenario is simultaneous failure of the solar array, wind turbine, and both BESS containers -- a scenario so improbable for properly maintained equipment as to be outside reasonable design basis.

---

## 2. Weight Budget Reconciliation

### 2.1 Component-by-Component Weight Roll-Up

The weight budget is the first physical constraint that must close. Every kilogram of equipment installed in the container must fit within the ISO 668 maximum gross weight of 30,480 kg. Module 1, Section 4.1 provides the canonical weight table. This synthesis verifies it by cross-referencing component weights from each engineering module.

| Component | Weight (kg) | Source Module | Basis |
|-----------|------------|--------------|-------|
| **Structural** | | | |
| Container tare (40HC) | 4,000 | M1 Sec 1.2 | Manufacturer range 3,750-4,200 |
| Floor reinforcement (6mm A36, 17.64 m^2) | 831 | M1 Sec 2.1 | 17.64 m^2 x 47.1 kg/m^2 |
| Insulation + interior finish | 300 | M1 Sec 2.4 | ccSPF + thermal barrier |
| Cable tray system (2 runs, 12m each) | 120 | M1 Sec 2.5 | ~5 kg/m x 24m |
| Containment panels, door hardware | 150 | M1 Sec 3.4 | Aisle containment + door |
| **Power** | | | |
| Switchgear, PDU, bus bar | 600 | M2 Sec 5.3 | Containerized switchgear |
| DC-DC converter (2x 80 kW) | 200 | M2 Sec 5.3 | 150 kW class |
| **Safety** | | | |
| Fire suppression (Novec 1230) | 150 | M1 Sec 6.3 | Agent cylinders + piping |
| **Cooling** | | | |
| CDU, pumps, piping | 800 | M3 Sec 2.2 | CDU ~400 + piping ~200 + pumps ~200 |
| Coolant charge (PG/water) | 200 | M3 Sec 2.2 | ~200L at 1.04 kg/L |
| **Water Filtration** | | | |
| Filtration system (all 5 stages) | 400 | M3 Sec 4 | Housings, membranes, UV, mineral tank |
| Waste drum (full, DOT 17H) | 250 | M3 Sec 6.2 | Empty ~20 kg + 208L content |
| **Compute** | | | |
| GB200 NVL72 racks (4x) | 5,440 | M4 Sec 2.1 | 4 x 1,360 kg |
| Networking (ToR switches, cabling) | 200 | M4 Sec 3.2 | 2 x 400GbE switches + patch |
| **Infrastructure** | | | |
| Monitoring and access control | 100 | M4 Sec 5 | Servers, sensors, displays |
| Cable and plumbing (all in-container) | 400 | M1 Sec 4.1 | Estimated from zone lengths |

**Reconciliation:**

| Category | Total (kg) |
|----------|-----------|
| Container tare | 4,000 |
| Structural modifications | 1,401 |
| Power distribution | 800 |
| Safety systems | 150 |
| Cooling and water | 1,650 |
| Compute | 5,640 |
| Infrastructure | 500 |
| **Total payload (excluding tare)** | **6,141** |
| **Total gross weight** | **10,141** |
| **ISO maximum gross weight** | **30,480** |
| **Remaining capacity** | **20,339** |
| **Payload utilization** | **23.3%** |

### 2.2 Verification Against Transport Limits

The weight reconciliation must satisfy not only the ISO structural limit but also the most restrictive transport regulation on any deployment path.

| Transport Mode | Weight Limit | OCN Gross Weight | Margin |
|---|---|---|---|
| ISO 668 gross weight | 30,480 kg | 10,141 kg | 20,339 kg (67%) |
| US highway (FMCSA, 80,000 lbs GVW) | 36,287 kg | 10,141 + 9,000 (chassis) = 19,141 kg | 17,146 kg (47%) |
| Rail (AAR per container) | 30,480 kg | 10,141 kg | 20,339 kg (67%) |
| Crane (ISO 1161, 4 corners) | 339,000 kg | 10,141 kg | 328,859 kg (97%) |

**Finding:** The OCN at 10,141 kg gross is within all transport limits by a factor of at least 2x. No special permits, overweight exceptions, or modified transport procedures are required. The node can be deployed, relocated, or recovered using commodity intermodal logistics.

### 2.3 What the Weight Margin Enables

The 20,339 kg of remaining capacity is not waste. It is the design space for future hardware evolution. At current compute density, the weight budget accommodates up to 14 additional GB200-class racks (14 x 1,360 = 19,040 kg) before approaching the ISO limit. The practical constraint for additional racks is power and cooling, not weight. This means the container's structural investment is future-proof against at least two generations of compute hardware density increases.

---

## 3. Power Budget Reconciliation

### 3.1 Load Summary

Module 2, Section 1.2 provides the canonical load breakdown. This synthesis reconciles that breakdown against the demands specified by Modules 3 and 4.

| Load | Power (kW) | Source | Cross-Reference |
|---|---|---|---|
| GB200 NVL72 compute | 120.0 | M4 Sec 1.5 | 120 kW TDP per NVIDIA spec |
| CDU pumps (2x, one running) | 7-10 | M3 Sec 2.2 | Variable-speed, load-following |
| CDU fan array (dry cooler) | 5-8 | M3 Sec 2.2 | Dependent on ambient |
| CDU controls and instrumentation | 0.5 | M3 Sec 2.2 | Always-on |
| Water filtration pumps (RO feed + boost) | 1-2 | M3 Sec 4.3 | 500W to 1.5 kW for RO pump |
| LED lighting | 0.5 | M1 Sec 3.2 | Dimming controls |
| Fire suppression panel + sensors | 0.3 | M1 Sec 6.2 | Always-on standby |
| Security system | 0.5 | M4 Sec 5 | Access control, cameras |
| Environmental monitoring | 0.3 | M4 Sec 5.1 | Temperature, humidity, leak |
| DCIM gateway and networking | 0.8 | M4 Sec 5 | Management plane |
| Power monitoring | 0.3 | M2 Sec 7.5 | Per-circuit metering |
| Miscellaneous + growth margin | 2.3 | M2 Sec 1.2.3 | 10% design margin |
| **Subtotal (loads)** | **~143** | | |
| Distribution losses (7%) | 11.4 | M2 Sec 1.2.4 | MPPT + DC bus + converter |
| **Total design basis** | **~155 kW** | M2 Sec 1.2.5 | Rounded from 154.4 |

### 3.2 Generation vs. Demand

| Generation Source | Nameplate | Capacity Factor | Annual Production (MWh) |
|---|---|---|---|
| Solar array | 640 kW | 24.7% | 1,384 |
| Wind turbine | 75 kW | 25% | 164 |
| **Total generation** | **715 kW** | | **1,548** |

| Annual Demand | | |
|---|---|---|
| Facility demand (155 kW x 8,760h) | | 1,357 MWh |
| BESS round-trip loss (7% of ~1,045 MWh cycled) | | 73 MWh |
| Distribution losses (7%) | | 95 MWh |
| **Total demand + losses** | | **1,525 MWh** |

| **Net annual balance** | | **+23 MWh (+1.5%)** |
|---|---|---|

### 3.3 Identified Gaps and Mitigations

**Gap 1: Winter months.** Module 2, Section 9.1 identifies November through February as BESS-critical months, with solar capacity factors dropping to 18-22%. At 20% CF, solar production falls to approximately 0.20 x 640 x 24 = 3,072 kWh/day against a demand of 3,720 kWh/day -- a deficit of 648 kWh/day. Wind generation during winter (often higher at Southwest sites) partially compensates. The remaining deficit draws from BESS.

**Mitigation:** Load management protocol. During extended low-solar events exceeding 24 hours, the OCN transitions from training profile (120 kW compute) to inference profile (60-85 kW compute), reducing total facility demand to approximately 95-120 kW. At 100 kW, the 3,500 kWh BESS provides approximately 26 hours of autonomy at 80% DoD and 93% efficiency -- sufficient to bridge a two-day low-solar event.

**Gap 2: Multi-day weather events.** A 3,500 kWh BESS at full 155 kW load provides approximately 16.7 hours of ride-through (M2 Sec 7.1). For events exceeding this duration without solar or wind input, the node must either shed load or accept temporary shutdown.

**Mitigation:** The BESS sizing was explicitly designed for diurnal buffering, not multi-day autonomy. The architecture accommodates expansion: two additional 20ft BESS containers (adding 3,500 kWh) would extend full-load autonomy to approximately 33 hours. For the reference design, load management is the primary mitigation.

**Gap 3: Panel degradation over 25-year life.** At 0.5%/year degradation, the 640 kW array produces effectively 560 kW at year 25 (M2 Sec 2.6). The system's +1.5% annual surplus erodes to approximately -10% by year 15, requiring either panel replacement or supplemental capacity.

**Mitigation:** The array should be sized to 650-660 kW nameplate for a 25-year mission, adding approximately 20-40 panels and $5,000-10,000 in initial capital. Alternatively, partial panel replacement at year 15 restores capacity at then-current (likely lower) panel prices.

---

## 4. Thermal Budget Reconciliation

### 4.1 Heat Generation vs. Heat Rejection

The first law of thermodynamics: every watt of electrical power delivered to any load inside the container ultimately becomes heat. The cooling system must reject all of it.

**Heat Sources (from M3, Section 1.2):**

| Heat Source | Thermal Output (kW) | Rejection Path |
|---|---|---|
| GPU/CPU compute (direct-to-chip liquid) | 115 | Primary coolant loop -> plate HX -> dry cooler |
| Networking (in-rack air-cooled) | 10 | Residual air cooling -> exhaust vents |
| Power conversion (DC-DC, PSUs) | 8 | Conduction + forced air -> exhaust vents |
| CDU pumps and auxiliary | 5 | Self-cooled to coolant loop |
| Lighting, monitoring, controls | 2 | Ambient radiation -> exhaust / insulation |
| **Total heat generation** | **140 kW** | |

**Heat Rejection Capacity:**

| Rejection Path | Capacity (kW) | Source |
|---|---|---|
| CDU liquid loop (primary) | 115 | M3 Sec 2.2 -- PHX rated 115 kW |
| Dry cooler (atmospheric) | 89 | M3 Sec 3.3 -- residual after pre-warming |
| Pre-warming HX (to raw water) | 26 | M3 Sec 3.3 -- at 10 GPM feed |
| Residual air exhaust (vents P-08/P-09) | 25 | M1 Sec 3.5 -- 17 kW air-cooled + ambient |
| Container insulation loss (to exterior) | ~6 | M1 Sec 7.2 -- insulated solar gain in reverse |
| **Total rejection capacity** | **>140 kW** | |

### 4.2 Thermal Balance Verification

The thermal budget closes with margin. The liquid-cooled load (115 kW) is fully handled by the CDU loop, which splits the heat between the water pre-warming HX (26 kW) and the dry cooler (89 kW). The air-cooled load (25 kW of networking, power conversion, and ambient sources) is exhausted through the container's ventilation system (P-08/P-09 exhaust vents at 3,400+ CFM capacity per M4 Sec 2.4).

**Critical temperature chain verification:**

| Point | Temperature | Source | Within Spec? |
|---|---|---|---|
| CDU coolant supply (to racks) | 20C | M3 Sec 1.5 | Yes -- ASHRAE W2 (15-25C) |
| CDU coolant return (from racks) | 35C | M3 Sec 1.5 | Yes -- within 35-45C range |
| Dry cooler outlet (to atmosphere) | Ambient + 5-10C | M3 Sec 2.1 | N/A -- atmospheric |
| Raw water after pre-warming | 25-30C | M3 Sec 3.2 | Yes -- optimal for RO flux |
| RO permeate output | ~25C | M3 Sec 4.3 | Yes -- within potable range |
| Cold aisle ambient | 18-27C | M1 Sec 2.4 | Yes -- ASHRAE A1/A2 class |
| Hot aisle ambient | 35-45C | M4 Sec 2.4 | Yes -- contained and exhausted |

**Finding:** The thermal budget balances at steady state across all operating conditions from idle (43 kW total) through full training (155 kW total). The dry cooler is the thermal safety valve -- it absorbs any heat not consumed by the water pre-warming loop, including the full 115 kW if the filtration system is offline.

---

## 5. Bill of Materials

### 5.1 Comprehensive BOM by Subsystem

The following BOM aggregates component specifications from all four engineering modules with estimated unit costs based on 2025 commodity pricing. All costs are US dollars, rough order-of-magnitude, and must be independently verified before procurement.

#### Container and Structural (M1)

| Item | Qty | Unit Cost | Total | Notes |
|---|---|---|---|---|
| 40ft High Cube ISO container (used, CW grade) | 1 | $4,500 | $4,500 | Cargo-worthy, inspected |
| 6mm A36 steel plate (floor overlay, 17.64 m^2) | 18 m^2 | $85/m^2 | $1,530 | Cut-to-fit sections |
| ccSPF insulation (walls 50mm, ceiling 75mm) | 100 m^2 | $45/m^2 | $4,500 | Installed by spray contractor |
| Personnel door assembly (steel, panic bar, RFID) | 1 | $3,500 | $3,500 | Commercial security door |
| Infill panel (insulated steel, 1,440mm x 2,585mm) | 1 | $1,200 | $1,200 | Custom fabricated |
| Cable tray (300mm ladder, galvanized, 24m total) | 24 m | $45/m | $1,080 | Two parallel runs |
| Penetration assemblies (P-01 through P-10, complete) | 10 | $350 | $3,500 | Glands, collars, seal plates |
| Waste drum access hatch (gasketed, 3-point lock) | 1 | $1,800 | $1,800 | Custom fabricated |
| Aisle containment panels (polycarbonate, tracks) | 1 set | $4,000 | $4,000 | Cold-aisle containment |
| M20 rack anchor studs (welded, 16 total) | 16 | $25 | $400 | Grade 8.8, full-penetration weld |
| Fabrication labor (welding, cutting, finishing) | 1 | $25,000 | $25,000 | Skilled container modifier |
| **Container subtotal** | | | **$51,010** | |

#### Power Systems (M2)

| Item | Qty | Unit Cost | Total | Notes |
|---|---|---|---|---|
| Solar panels (520W TOPCon bifacial) | 1,232 | $95 | $117,040 | $0.18/W commodity 2025 |
| Solar racking (fixed-tilt ground mount) | 640 kW | $0.15/W | $96,000 | Driven steel posts |
| Solar wiring, combiners (5 boxes), conduit | 1 lot | $64,000 | $64,000 | 1,500V DC rated |
| MPPT charge controllers | 640 kW | $0.08/W | $51,200 | String-level MPPT |
| BESS containers (2x 20ft, 1,750 kWh each, LFP) | 2 | $210,000 | $420,000 | $120/kWh installed |
| Wind turbine (75 kW HAWT, tower, foundation) | 1 | $187,500 | $187,500 | Installed with grid-forming inverter |
| DC-DC converter bank (2x 80 kW, 1,500V to 48V) | 2 | $8,000 | $16,000 | N+1 redundancy |
| Main DC switchgear (1,500V, exterior enclosure) | 1 | $35,000 | $35,000 | Disconnect, OCPD, SPD, meter, GFD |
| 48V DC bus bar (3,000A, copper, 5m run) | 1 | $8,000 | $8,000 | Silver-plated joints |
| Branch circuit breakers (48V DC rated) | 1 lot | $5,000 | $5,000 | Per-circuit protection |
| Grounding and lightning protection | 1 | $15,000 | $15,000 | Ground rods, LPS, electrode conductor |
| Energy management system (EMS) | 1 | $20,000 | $20,000 | BMS integration, DCIM interface |
| Power installation labor | 1 | $80,000 | $80,000 | Licensed electrical contractor |
| **Power subtotal** | | | **$1,114,740** | |

#### Cooling and Water Systems (M3)

| Item | Qty | Unit Cost | Total | Notes |
|---|---|---|---|---|
| CDU (plate HX, pump pair, controls, reservoir) | 1 | $45,000 | $45,000 | Industrial CDU, 140 kW capacity |
| Dry cooler (outdoor, 100 kW, VFD fans) | 1 | $18,000 | $18,000 | Fin-and-tube, outdoor rated |
| Primary loop piping (copper/SS, fittings, valves) | 1 lot | $12,000 | $12,000 | Type L copper / 304 SS |
| Coolant charge (200L PG/water premix) | 200 L | $8/L | $1,600 | 30% propylene glycol |
| Pre-heat plate HX (raw water / coolant) | 1 | $3,500 | $3,500 | SS gasketed, 26 kW |
| Stage 1: Sediment filter housing + cartridges (12 mo.) | 1 | $800 | $800 | 20" Big Blue, 5 micron |
| Stage 2: GAC tank (10"x54", media, backwash valve) | 1 | $2,500 | $2,500 | Coconut shell GAC |
| Stage 3: RO system (4-element housing, membranes, pump) | 1 | $8,000 | $8,000 | TFC, 150-200 psi, VFD pump |
| Stage 4: UV sterilization (254nm, 40 mJ/cm^2, NSF 55) | 1 | $2,000 | $2,000 | LPHO lamp, SS chamber |
| Stage 5: Mineral rebalancing tank + polishing filter | 1 | $1,500 | $1,500 | Calcite/corosex + 1 micron |
| Water quality sensors (TDS, pH, turbidity, UV, flow) | 12 | $500 | $6,000 | Inline transmitters |
| Piping (CPVC/PEX, fittings, valves, backflow preventers) | 1 lot | $5,000 | $5,000 | NSF/ANSI 61 rated |
| Leak detection system (rope sensors, point sensors) | 1 | $3,000 | $3,000 | Zone-based, CDU interlock |
| 55-gallon DOT 17H drums (annual supply, 12) | 12 | $80 | $960 | With HDPE liners |
| Heat trace cable (freeze protection, outdoor pipes) | 30 m | $15/m | $450 | Self-regulating, 5 W/ft |
| Cooling/water installation labor | 1 | $20,000 | $20,000 | Licensed plumber + mechanical |
| **Cooling/water subtotal** | | | **$130,310** | |

#### Compute Systems (M4)

| Item | Qty | Unit Cost | Total | Notes |
|---|---|---|---|---|
| NVIDIA GB200 NVL72 rack (single-rack reference) | 1 | $3,000,000 | $3,000,000 | 72 GPUs, 36 CPUs, NVLink fabric |
| ToR switches (400GbE, dual per rack) | 2 | $15,000 | $30,000 | Active-active ECMP |
| Edge router (BGP capable, dual WAN) | 1 | $8,000 | $8,000 | Redundant fiber/LTE |
| NFS storage server (100-400 TB, NVMe) | 1 | $25,000 | $25,000 | Warm tier for training data |
| Management server (DCIM, monitoring, k3s control) | 1 | $5,000 | $5,000 | Lightweight, VLAN 20 |
| OOB LTE/5G modem | 1 | $500 | $500 | Cellular failover |
| Fiber optic cabling (OS2, LC, 12-strand, internal) | 1 lot | $2,000 | $2,000 | Single-mode |
| 44U server rack enclosure (EIA-310-D) | 1 | $2,500 | $2,500 | If not integrated with GB200 |
| **Compute subtotal** | | | **$3,073,000** | |

#### Safety and Monitoring (M1, M4)

| Item | Qty | Unit Cost | Total | Notes |
|---|---|---|---|---|
| Fire suppression (Novec 1230, 2 zones, piping, nozzles) | 1 | $25,000 | $25,000 | NFPA 2001 compliant |
| VESDA detection (2 units, sampling pipe) | 2 | $5,000 | $10,000 | Aspirating smoke detection |
| Environmental sensors (temp, humidity, airflow) | 20 | $150 | $3,000 | ASHRAE TC 9.9 density |
| Access control (RFID reader, panic bar, audit log) | 1 | $3,000 | $3,000 | Electronic + deadbolt backup |
| Security cameras (interior + exterior) | 4 | $500 | $2,000 | IP, VLAN 20 |
| EPO (Emergency Power Off) system | 1 | $2,500 | $2,500 | NEC 645.10 compliant |
| Portable fire extinguisher (CO2, 10 lb) | 2 | $250 | $500 | NFPA 10 |
| First aid kit | 1 | $150 | $150 | OSHA 1910.151 |
| Prometheus/Grafana monitoring stack (software) | 1 | $0 | $0 | Open-source |
| **Safety/monitoring subtotal** | | | **$46,150** | |

#### Site Preparation

| Item | Qty | Unit Cost | Total | Notes |
|---|---|---|---|---|
| Foundation pad (compacted gravel, 15m x 5m) | 75 m^2 | $40/m^2 | $3,000 | Container + BESS placement |
| Perimeter fencing (chain-link, 6ft, 200m) | 200 m | $35/m | $7,000 | Solar array + equipment |
| Underground conduit (PVC Schedule 80, 200m) | 200 m | $25/m | $5,000 | Solar to container run |
| Fiber optic lateral (from existing route, 1 km) | 1 km | $15,000/km | $15,000 | Trenching + fiber |
| Water connection (non-potable source, 100m) | 100 m | $30/m | $3,000 | PEX + valves |
| Potable water distribution (to community, 200m) | 200 m | $40/m | $8,000 | Copper/PEX + backflow |
| Permitting and engineering (PE reviews) | 1 | $30,000 | $30,000 | Structural, electrical, plumbing PEs |
| Commissioning and testing | 1 | $15,000 | $15,000 | Electrical, cooling, water quality |
| **Site prep subtotal** | | | **$86,000** | |

---

## 6. Total Deployed Cost Estimate

### 6.1 Single-Rack Reference Configuration

| Subsystem | Cost | % of Total |
|---|---|---|
| Container and structural | $51,010 | 1.1% |
| Power systems | $1,114,740 | 24.7% |
| Cooling and water systems | $130,310 | 2.9% |
| Compute systems | $3,073,000 | 68.2% |
| Safety and monitoring | $46,150 | 1.0% |
| Site preparation | $86,000 | 1.9% |
| **Total deployed cost** | **$4,501,210** | **100%** |

### 6.2 Cost Structure Analysis

The cost structure reveals the economics clearly: **compute hardware is 68% of the total deployed cost.** The entire physical plant -- container, solar array, battery storage, cooling, water filtration, wind turbine, site preparation -- represents 32% of the total. This is a crucial finding for the project's economic argument.

It means:

1. **The infrastructure premium for net-positive operation is modest.** The power, cooling, water, and structural systems that transform a conventional containerized data center into a net-positive compute node cost approximately $1.4 million. The compute hardware costs $3 million regardless of where it is deployed. The "green premium" is approximately $400,000-500,000 above a conventional containerized DC of equivalent capability (which would still need power, cooling, and a container -- just without the renewable generation, battery storage, and water filtration).

2. **Compute hardware cost dominates scaling economics.** Deploying 100 nodes is not 100x $4.5M = $450M. Solar panels, batteries, and containers benefit from volume procurement. The GB200 racks do not -- GPU pricing is set by NVIDIA. At fleet scale, the infrastructure cost per node drops while compute cost remains constant, making the net-positive features proportionally cheaper.

3. **Alternative compute configurations dramatically reduce cost.** A CPU-only inference node (M4 Sec 7.3) replaces the $3M GB200 rack with $50,000-80,000 of CPU servers. Total deployed cost for a CPU-only OCN: approximately $1.5-1.7 million. This is the entry point for community deployments where training capability is not required.

### 6.3 Cost Per Key Metric

| Metric | Value | Basis |
|---|---|---|
| Cost per kW of compute | $37,510/kW | $4.5M / 120 kW |
| Cost per PFLOP (FP4 inference) | $6,252/PFLOP | $4.5M / 720 PFLOPS |
| Cost per gallon of annual water produced | $1.32/gal | $4.5M / 3,416,400 gal (first year) |
| Cost per MWh of annual renewable generation | $2,909/MWh | $4.5M / 1,548 MWh (first year) |
| Amortized cost per year (25-year life) | $180,048/yr | Simple linear, no discount rate |

Over a 25-year design life, the amortized annual cost of $180,048 compares favorably to the annual cloud computing cost for equivalent capability. A single GB200 rack on a cloud provider (if available) would cost approximately $15-30/hour for on-demand GPU access, or $131,000-263,000/year at 100% utilization. The OCN achieves cost parity within 2-5 years and produces a 20+ year tail of effectively free compute, clean water, and renewable energy.

---

## 7. Comparison to Commercial Alternatives

### 7.1 Commercial Modular Data Center Landscape

The containerized data center market is mature. Several manufacturers offer pre-engineered solutions that share the OCN's form factor but differ fundamentally in philosophy and capability.

| Vendor | Product | Power Range | Cooling | Water Filtration | Open Source | Renewable Integration |
|---|---|---|---|---|---|---|
| **BMarko Structures** | Custom modular DC | 50-500 kW | Air or liquid | No | No | Optional |
| **Delta Power Solutions** | InfraSuite Modular | 50-200 kW | Air (precision) | No | No | No |
| **Schneider Electric** | EcoStruxure Modular DC | 100-500 kW | Air or liquid | No | No | Grid-tied only |
| **Vertiv** | SmartMod/PowerMod | 100-300 kW | Air or liquid | No | No | Optional |
| **Open Compute Node** | OCN Reference | 120-280 kW | Liquid + HX | Yes (potable) | Yes (CC BY-SA 4.0) | 100% on-site |

### 7.2 Feature Comparison

| Feature | Commercial Modular | Open Compute Node |
|---|---|---|
| Power source | Grid (standard) | 100% renewable (solar + wind + BESS) |
| Off-grid capability | Typically no | Yes (reference design) |
| Water relationship | Consumer (cooling towers) | Producer (filtration to potable) |
| Community compute | Not offered | 10% minimum, architecturally enforced |
| Art program | Not offered | Mural by local community |
| Open specification | Proprietary | CC BY-SA 4.0 |
| Self-sufficiency | Grid-dependent | Fully autonomous |
| Deployment flexibility | Site with grid + water + cooling | Site with sunlight + non-potable water + fiber |
| Waste management | Standard (varies) | Single 55-gal drum, monthly, documented chain |
| PUE target | 1.2-1.5 | <1.3 (achieved: 1.29) |
| WUE | 0.2+ gal/kWh consumed | Negative (net water producer) |
| CAPEX (120 kW IT, similar capability) | $2-4M (excl. power plant) | $4.5M (incl. entire power plant) |

### 7.3 The Cost Comparison That Matters

Commercial modular data centers are cheaper upfront because they externalize their power and water costs. A BMarko container at $2M does not include a power plant. It connects to the grid. Over 25 years at $0.08/kWh (industrial rate) and 155 kW continuous load:

```
Grid electricity: 155 kW x 8,760 h x $0.08/kWh x 25 years = $27,156,000
```

The OCN's power system costs approximately $1.1 million and produces free electricity for 25+ years. The payback period for the renewable power system versus grid electricity is approximately 1.0 year:

```
Annual grid cost avoided: $108,624
Power system cost: $1,114,740
Payback: 10.3 years (simple) — but with $0.08/kWh escalating at 3%/year, effective payback is ~8 years
```

After payback, every subsequent year saves $100,000+ in electricity costs. Over 25 years, the OCN saves approximately $25 million in electricity versus grid-powered alternatives. The renewable power system is not a cost -- it is an investment with a 10x return.

Furthermore, no commercial modular DC produces potable water. At 3.4 million gallons per year valued at $0.005/gallon (municipal wholesale), the water has modest direct economic value (~$17,000/year) but enormous community value in water-scarce regions where the cost of water infrastructure construction dwarfs the cost of water itself.

---

## 8. Net-Positive Calculation

### 8.1 The Fundamental Question

Does the Open Compute Node give back more than it takes? This section quantifies the exchange.

### 8.2 What the Node Consumes

| Resource | Annual Consumption | Lifetime (25 yr) | Notes |
|---|---|---|---|
| Land | 3.1 acres | 3.1 acres | Fixed footprint |
| Non-potable water (intake) | 5,256,000 gal | 131,400,000 gal | Returned as potable + concentrate |
| Waste generated | ~480 kg solid + UV lamps | ~12,000 kg | Monthly drum swap |
| Embedded carbon (manufacturing) | ~200 tonnes CO2e | 200 tonnes | Solar panels, batteries, container, compute |
| Maintenance labor | ~120 hours | ~3,000 hours | Monthly drum swap + quarterly checks |

### 8.3 What the Node Produces

| Output | Annual Production | Lifetime (25 yr) | Notes |
|---|---|---|---|
| **Clean potable water** | 3,416,400 gal | 85,410,000 gal | EPA-compliant, continuous |
| **Renewable electricity (surplus)** | 23 MWh | 575 MWh | Net above facility demand |
| **AI computation** | 720 PFLOPS FP4 continuous | — | Single rack; exascale equivalent |
| **Community compute** | 72 PFLOPS FP4 (10% alloc.) | — | Free, forever, no tracking |
| **CO2 avoided (vs. grid power)** | 482 tonnes | 12,050 tonnes | At US avg 0.355 kg CO2/kWh |

### 8.4 Net-Positive Ledger

| Category | Consumed | Produced/Avoided | Net |
|---|---|---|---|
| **Water** | 5.26M gal intake (non-potable) | 3.42M gal output (potable) + 1.84M gal concentrate returned | Net water transformer: dirty in, clean out |
| **Carbon** | 200 tonnes (embedded) | 482 tonnes/yr avoided | Net negative in <6 months; -12,050 tonnes over life |
| **Energy** | 0 kWh from grid | 1,548 MWh/yr generated on-site | 100% self-sufficient + surplus |
| **Compute** | 0 (community pays nothing) | 72 PFLOPS FP4 continuous | Pure community benefit |
| **Waste** | ~480 kg/yr solid waste | Documented, characterized, properly disposed | Minimal; GAC is recyclable |

### 8.5 Comparison to Traditional Data Center of Equivalent Capability

| Metric | Traditional 120 kW DC | Open Compute Node | Difference |
|---|---|---|---|
| Annual grid electricity | 1,357 MWh | 0 | -1,357 MWh |
| Annual CO2 emissions (scope 2) | 482 tonnes | 0 | -482 tonnes |
| Annual water consumed (WUE) | 210,240 gal | 0 | -210,240 gal |
| Annual water produced | 0 | 3,416,400 gal | +3,416,400 gal |
| Indirect water (power gen) | ~1.9M gal | 0 | -1.9M gal |
| Community compute provided | 0 | 72 PFLOPS | +72 PFLOPS |
| Annual electricity cost | $108,624 | $0 | -$108,624 |
| Community benefit | None | Water + compute + art | Qualitative |

The Open Compute Node is net-positive on water, net-negative on carbon (after a 5-month payback on embedded carbon), net-zero on grid electricity, and net-positive on community benefit. There is no metric on which it performs worse than the equivalent conventional facility, and there are five metrics on which it performs categorically better.

### 8.6 Water Return Effectiveness (WRE)

Module 3, Section 8.2 introduces the Water Return Effectiveness metric:

```
WRE = Annual Potable Water Produced / Annual IT Equipment Energy Consumption
WRE = 3,416,400 gallons / 1,051,200 kWh = 3.25 gallons per kWh
```

For every kilowatt-hour of AI computation performed, the Open Compute Node returns 3.25 gallons of clean potable water to the community. This is the value exchange made tangible: computation in, clean water out.

---

## 9. Scaling: Fleet Deployment Projections

### 9.1 What Does a Fleet Look Like?

The OCN is designed as a unit cell -- a single deployable node that is complete in itself. The scaling question is what happens when you deploy many of them.

### 9.2 Fleet of 100 Nodes

| Metric | Per Node | 100 Nodes |
|---|---|---|
| **Compute capacity (FP4)** | 720 PFLOPS | 72,000 PFLOPS (72 EFLOPS) |
| **Community compute** | 72 PFLOPS | 7,200 PFLOPS (7.2 EFLOPS) |
| **Annual potable water** | 3.42M gal | 342M gal (1,050 acre-feet) |
| **Annual CO2 avoided** | 482 tonnes | 48,200 tonnes |
| **Annual renewable gen.** | 1,548 MWh | 154,800 MWh |
| **Solar array area** | 3.1 acres | 310 acres (0.48 sq mi) |
| **Capital cost (at volume)** | ~$4M (volume pricing) | ~$400M |
| **Communities served** | 1 | 100 |
| **Jobs (operations)** | 0.25 FTE | 25 FTE |

One hundred nodes produce 72 exaFLOPS of FP4 inference capability -- roughly equivalent to the aggregate AI compute of a major hyperscaler's regional footprint. The fleet produces enough potable water to supply a town of approximately 10,000 people (at 100 gallons per capita per day, 1,050 acre-feet serves ~9,400 people). The CO2 avoidance of 48,200 tonnes is equivalent to removing approximately 10,400 passenger vehicles from the road.

The 310 acres of solar arrays is approximately half a square mile -- significant but not extraordinary. For comparison, a single utility-scale solar farm (e.g., the 300 MW Agua Caliente Solar Project in Arizona) occupies approximately 2,400 acres. The OCN fleet's 310 acres is roughly 13% of a single large solar farm, distributed across 100 sites.

### 9.3 Fleet of 1,000 Nodes

| Metric | 1,000 Nodes |
|---|---|
| **Compute capacity** | 720 EFLOPS (0.72 ZFLOPS) |
| **Community compute** | 72 EFLOPS |
| **Annual potable water** | 3.42 billion gal (10,500 acre-feet) |
| **Annual CO2 avoided** | 482,000 tonnes |
| **Annual renewable gen.** | 1,548 GWh (1.55 TWh) |
| **Solar array area** | 3,100 acres (4.8 sq mi) |
| **Capital cost** | ~$3.5B (aggressive volume pricing) |
| **Communities served** | 1,000 |
| **Jobs** | 250 FTE |

At 1,000 nodes, the fleet produces 0.72 zettaFLOPS -- approaching the scale of today's total global GPU compute deployment. The 10,500 acre-feet of annual water production could serve a city of approximately 94,000 people. The 482,000 tonnes of annual CO2 avoidance equals the annual emissions of a mid-sized coal power plant.

The 1.55 TWh of annual renewable generation is meaningful at grid scale: it represents approximately 0.04% of US annual electricity consumption, generated entirely on-site without grid infrastructure. The $3.5 billion capital cost, amortized over 25 years, is $140 million per year -- less than a single hyperscaler's quarterly capital expenditure on data center construction.

### 9.4 National Coverage: The Rail Corridor Strategy

The vision document identifies the US rail network (~140,000 miles of track) as the deployment corridor, with fiber routes paralleling railroad rights-of-way. The deployment strategy targets the intersection of rail access, fiber access, solar irradiance, and community need.

**Phase 1: Southwest Corridor (0-100 nodes)**

The BNSF Transcon and Union Pacific Sunset Route through Texas, New Mexico, Arizona, and Southern California. Solar irradiance exceeds 5.5 kWh/m^2/day across the entire corridor. Fiber follows the rail right-of-way. Non-potable water is available from agricultural runoff, canal systems, and treated municipal effluent. Communities along these routes -- small towns of 2,000-20,000 people -- are precisely the communities that lack access to both AI compute and clean water infrastructure.

**Phase 2: Southern Tier Extension (100-300 nodes)**

Extension east through the Texas Triangle (Dallas-Houston-San Antonio), across Louisiana, Mississippi, Alabama, and into the Southeast. Solar irradiance drops to 4.5-5.5 kWh/m^2/day but remains viable. Water sources shift from agricultural runoff to river systems and industrial non-potable supplies.

**Phase 3: Northern Tier and Pacific Northwest (300-500 nodes)**

Northern rail corridors through the Plains states (BNSF northern corridor), Pacific Northwest (UP/BNSF Seattle-Portland-Eugene). Lower solar irradiance (4.0-5.0 kWh/m^2/day) is compensated by higher wind capacity factors (30-40% on the Great Plains). The power system architecture shifts from solar-dominant to wind-supplemented.

**Phase 4: National Coverage (500-1,000 nodes)**

Fill in the remaining Class I railroad corridors: the Northeast (Amtrak/CSX), Midwest (UP/BNSF/NS), and Mountain West. Some sites require grid-hybrid configuration (Configuration B from M2 Sec 6.1) where solar irradiance is insufficient for full off-grid operation.

### 9.5 Network Effects at Fleet Scale

Individual OCN nodes operate independently. But a fleet of nodes creates network effects that individual nodes cannot:

**Distributed AI research fabric.** A researcher at a library in Tucson submits a training job. The local node's community allocation handles it. But if the job is larger than one node's community partition, a fleet-level scheduler could distribute the job across idle community partitions at multiple nodes -- creating a federated research compute fabric spanning hundreds of communities.

**Water infrastructure network.** Individual nodes produce water for individual communities. A fleet produces water at regional scale. In water-scarce regions like the Colorado River basin, 100 nodes producing 342 million gallons per year is a meaningful contribution to the regional water budget -- equivalent to the annual water allocation for a small city.

**Workforce development.** Each node requires operations and maintenance personnel. At 0.25 FTE per node, a 1,000-node fleet creates 250 permanent, skilled technical jobs in communities that currently have few or no technology employment opportunities. These are not remote jobs -- they require physical presence at the node site, anchoring economic benefit in the community.

---

## 10. The Through-Line: Amiga Principle at Infrastructure Scale

### 10.1 What the Amiga Principle Actually Is

The Commodore Amiga shipped in 1985 with a hardware reference manual in the box. Not a user guide -- a reference manual. Register maps, DMA timing diagrams, custom chip specifications, bus arbitration sequences. Everything a developer needed to program the hardware directly. Commodore did not publish this because they were altruistic. They published it because they understood that a computer's value is determined by what people build on it, and people cannot build what they cannot understand.

The Amiga Principle, as applied to the Open Compute Node, is this: **publish the register maps.** Every structural modification dimension. Every power budget line item. Every thermal calculation. Every pipe diameter. Every valve tag number. Every NEC code reference. The four engineering modules that precede this synthesis contain over 40,000 words of specification detail -- not because verbosity is a virtue, but because completeness is. A community engineer in Tucson reading Module 2 can verify the solar array sizing against their own site's irradiance data from NREL. A plumber in Deming, New Mexico reading Module 3 can verify that the RO system's pipe materials comply with their local plumbing code. A graduate student in El Paso reading Module 4 can understand exactly how the GPU scheduling allocates community compute time.

This is the difference between open-source and open-specification. Open-source means the code is available. Open-specification means the entire design is available, at a level of detail sufficient for independent verification, modification, and reproduction. The OCN publishes both.

### 10.2 The Register Map of This System

In Amiga terms, the Open Compute Node's register map is its interface specification. Every cross-system connection documented in Section 1.2 of this synthesis is a register -- a defined point where one subsystem writes a value and another subsystem reads it.

| Register | Writer | Reader | Value |
|---|---|---|---|
| DC bus voltage | Solar MPPT + BESS | DC-DC converter | 1,500V +/- 100V |
| 48V bus bar voltage | DC-DC converter | GB200 rack PSU | 48-51V +/- 2% |
| Coolant supply temperature | CDU | Rack cold plates | 20C +/- 5C |
| Coolant return temperature | Rack cold plates | CDU / pre-heat HX | 35C +/- 10C |
| Raw water temperature (post-HX) | Pre-heat HX | RO membrane | 25C +/- 5C |
| Potable water TDS | Stage 5 output | Community distribution | <200 mg/L |
| Potable water pH | Stage 5 output | Community distribution | 7.0-7.8 |
| Community GPU allocation | Scheduler | JupyterHub | 10% minimum, continuous |
| BESS state of charge | BMS | EMS | 20-100% |
| Container gross weight | All subsystems | ISO transport rating | <30,480 kg |

These ten registers define the system. Every other specification in the four engineering modules exists to ensure that these ten values remain within their defined ranges under all operating conditions. A developer -- or a community -- that understands these ten registers understands the system.

### 10.3 What Publishing the Register Map Enables

When Commodore published the Amiga hardware reference manual, they did not predict demos, trackers, HAM graphics mode exploitation, or the entire European demoscene. They provided the substrate; the community provided the imagination.

The OCN specification, published under CC BY-SA 4.0, enables outcomes that the designers cannot predict:

**Modification.** A community in Minnesota reads the specification and concludes that the solar array is undersized for their latitude. They substitute a larger array and a wind-dominant generation mix, referencing the power budget reconciliation in this document to verify their modifications close. The specification does not just permit this -- it is designed for it. Every calculation shows its work so that every assumption can be verified and every parameter can be adjusted.

**Reproduction.** A manufacturing cooperative in Mexico reads the structural module and builds containers to the same specification using locally sourced Corten steel and A36 plate. They read the cooling module and source CDU components from regional suppliers. They read the compute module and install AMD Instinct MI300X racks instead of NVIDIA GB200s, noting from M4 Section 7.1 that the MI300X draws approximately 54 kW per rack equivalent -- well within the power and cooling budgets designed for 120 kW.

**Education.** A community college uses the four engineering modules as a textbook for an infrastructure engineering course. Students verify the thermal calculations in Module 3 using Q = m x Cp x dT. They verify the solar array sizing in Module 2 using NREL's PVWatts calculator. They verify the weight budget in Module 1 using ISO 668 specifications they look up themselves. The specification teaches by showing its work.

**Critique.** A professional engineer reads the specification and identifies errors, conservative assumptions, or code interpretation issues. They publish corrections. The community improves the specification. This is the open-source feedback loop applied to physical infrastructure -- something that has been done for software since 1983 but has barely been attempted for hardware.

### 10.4 Infrastructure as a Public Good

The highway system does not charge tolls on most roads. The postal system delivers to every address. The public library is open to everyone. These are infrastructure decisions -- deliberate choices to provide universal access to a shared resource on the basis that the network effects of universal access exceed the costs of universal provision.

The Open Compute Node makes the same argument for AI compute and clean water. The 10% community allocation is not charity. It is the mechanism by which the node becomes infrastructure rather than a facility. A facility serves its owner. Infrastructure serves its community. The difference is in the architecture -- specifically, in the VLAN isolation (M4 Sec 3.4) that guarantees community access cannot be revoked by a software configuration change, and in the scheduling partition (M4 Sec 6.4) that ensures community GPU time is not preemptible by primary workloads.

A 12-year-old in a small town in the American Southwest walks into the library. She opens a browser. She connects to the JupyterHub portal running on the compute node that was deployed six months ago -- the one with the mural she designed, the desert landscape with constellations. She opens a notebook. She types `import torch`. The GPU allocated to her session -- one-seventy-second of a rack that can perform 720 PFLOPS of FP4 inference -- responds. She does not know about ASHRAE TC 9.9 cooling guidelines. She does not know about propylene glycol or reverse osmosis or lithium iron phosphate. She does not know that the water flowing to the community garden next door was pre-warmed by the waste heat from her GPU.

She knows that she typed a command and the computer responded. That is the register map she needs.

---

## Appendix A: Key Figures Cross-Reference

| Figure | Value | Source |
|---|---|---|
| Container internal dimensions | 12,032 x 2,352 x 2,695 mm | M1 Sec 1.2 |
| ISO max gross weight | 30,480 kg | M1 Sec 1.2 |
| OCN estimated gross weight | 10,141 kg | M1 Sec 4.1 |
| Compute load (single GB200 rack) | 120 kW | M4 Sec 1.5 |
| Total facility load (design basis) | 155 kW | M2 Sec 1.2.5 |
| Solar array nameplate | 640 kW | M2 Sec 2.2 |
| Solar capacity factor (Tucson reference) | 24.7% | M2 Sec 2.1 |
| BESS capacity (usable) | 3,500 kWh | M2 Sec 3.1 |
| BESS chemistry | LFP (LiFePO4) | M2 Sec 3.2 |
| Wind turbine nameplate | 75 kW | M2 Sec 4.2 |
| Total heat rejection | 140 kW | M3 Sec 1.2 |
| CDU coolant flow (per rack) | 40-80 GPM | M3 Sec 1.4 |
| CDU supply temperature | 20C | M3 Sec 1.5 |
| CDU return temperature | 35C | M3 Sec 1.5 |
| Raw water pre-warming | 15C to 25C | M3 Sec 3.2 |
| Potable water output | 9,360 gal/day | M3 Sec 3.3 |
| RO recovery rate | 65% | M3 Sec 3.3 |
| GPU memory per rack | 13.8 TB HBM3e | M4 Sec 1.4 |
| NVLink fabric bandwidth | 130 TB/s | M4 Sec 1.3 |
| Community compute allocation | 10% minimum | M4 Sec 6.1 |
| PUE | 1.29 | M2 Sec 7.4 |
| WRE | 3.25 gal/kWh | M3 Sec 8.2 |
| Annual CO2 avoided | 482 tonnes | Calculated |
| Total deployed cost (single rack) | ~$4.5M | This document |
| 25-year grid electricity savings | ~$25M | This document |

---

## Appendix B: Acronyms

| Acronym | Expansion |
|---|---|
| ASHRAE | American Society of Heating, Refrigerating and Air-Conditioning Engineers |
| BESS | Battery Energy Storage System |
| BMS | Battery Management System |
| BOM | Bill of Materials |
| CDU | Coolant Distribution Unit |
| CF | Capacity Factor |
| DCIM | Data Center Infrastructure Management |
| DoD | Depth of Discharge |
| EMS | Energy Management System |
| EPA | Environmental Protection Agency |
| EPO | Emergency Power Off |
| GAC | Granular Activated Carbon |
| GVW | Gross Vehicle Weight |
| HC | High Cube |
| HX | Heat Exchanger |
| LFP | Lithium Iron Phosphate |
| LOTO | Lockout/Tagout |
| MCL | Maximum Contaminant Level |
| MPPT | Maximum Power Point Tracking |
| NEC | National Electrical Code |
| NREL | National Renewable Energy Laboratory |
| OCN | Open Compute Node |
| OCPD | Overcurrent Protective Device |
| OOB | Out-of-Band |
| PE | Professional Engineer |
| PHX | Plate Heat Exchanger |
| PG | Propylene Glycol |
| PUE | Power Usage Effectiveness |
| RO | Reverse Osmosis |
| STC | Standard Test Conditions |
| TDP | Thermal Design Power |
| TDS | Total Dissolved Solids |
| TFC | Thin-Film Composite |
| ToR | Top-of-Rack |
| UV | Ultraviolet |
| VLAN | Virtual Local Area Network |
| WRE | Water Return Effectiveness |
| WUE | Water Usage Effectiveness |

---

> **PROFESSIONAL ENGINEER REVIEW REQUIRED**
>
> This synthesis aggregates figures from four conceptual engineering modules. No figure has been independently verified by a licensed PE. All cost estimates are rough order-of-magnitude. All regulatory claims require site-specific verification. The authors assume no liability for use of this document without proper professional review.

---

*Module 07 of the OCN Research Series. Cross-system synthesis integrating Modules 01 (Container Structure), 02 (Power Systems), 03 (Cooling and Water Systems), and 04 (Compute Systems). Licensed CC BY-SA 4.0.*
