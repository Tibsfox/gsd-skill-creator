# Plumbing & Mechanical Systems — Technical Deep-Dive

---
module: M3-PM
dimensions: [TD, BS, LP, AD, RS]
audience: [L1, L2, L3, L4, L5]
content_type: deep-dive
last_updated: 2026-03-08
version: 1.0
status: draft
---

## Abstract

This module provides comprehensive coverage of plumbing, HVAC, and fuel gas systems for Pacific Northwest residential and light commercial construction. It maps the Uniform Plumbing Code (UPC) 2021 as adopted by Oregon (OPSC 2023, STD-04) and Washington (WAC 51-56, STD-14), the International Mechanical Code (IMC) as adopted by Oregon (OMSC 2022, STD-05) and Washington (WAC 51-52, STD-11), and the International Fuel Gas Code (IFGC) through CODE-01. Content spans five audience levels — from homeowner awareness through engineering design — covering drain-waste-vent (DWV) systems, water supply design, HVAC integration, fuel gas systems, and maintenance diagnostics, all grounded in PNW climate, seismic, and regulatory context [CODE-03, CODE-01, GOV-01, GOV-02].

---

## 1. Introduction

### 1.1 Background and Context

Plumbing and mechanical systems constitute the circulatory and respiratory infrastructure of a building. In the Pacific Northwest, these systems operate under conditions that distinguish the region from most of the continental United States: a marine climate (Climate Zone 4C west of the Cascades, 5B east) with sustained winter moisture, moderate heating demand, minimal cooling demand in most locations, and seismic exposure from the Cascadia Subduction Zone [CODE-03, GOV-01, GOV-02].

Both Oregon and Washington adopt the Uniform Plumbing Code (UPC) rather than the International Plumbing Code (IPC) used in many other states. The UPC, developed by IAPMO under ANSI-accredited consensus procedures, covers residential, commercial, and industrial plumbing in a single document [CODE-03, CODE-05]. This distinction matters: fixture unit values, pipe sizing tables, and venting methodologies differ between UPC and IPC, and practitioners moving to or from the PNW must recalibrate their code knowledge.

Mechanical systems follow the International Mechanical Code (IMC), adopted by both states with amendments [STD-05, STD-11]. The convergence of high energy code standards (OEESC 2025, WSEC-R 2021) with PNW climate has driven rapid adoption of heat pump technology, making the region a national leader in electrification of space and water heating [STD-07, STD-15, GOV-07].

### 1.2 Scope and Limitations

This document covers:
- Drain-waste-vent (DWV) system design and installation
- Water supply system design, sizing, and backflow prevention
- HVAC systems including forced air, hydronic, and heat pump configurations
- Fuel gas piping and appliance connections
- Maintenance, diagnostics, and repair guidance
- PNW-specific seismic, moisture, and energy code considerations

Excluded: fire sprinkler systems (see [M5-CS:Fire Protection]), commercial kitchen exhaust (specialized IMC provisions), medical gas systems, and industrial process piping.

### 1.3 Applicable Codes and Standards

| Code/Standard | Edition | Administering Body | OR Effective | WA Effective | Source ID |
|---|---|---|---|---|---|
| Uniform Plumbing Code (UPC) | 2021 | IAPMO | Oct 2023 (OPSC) | Mar 15, 2024 (WAC 51-56) | CODE-03 |
| Oregon Plumbing Specialty Code (OPSC) | 2023 | Oregon BCD | Oct 2023 | N/A | STD-04 |
| Washington State Plumbing Code | WAC 51-56 | WA SBCC | N/A | Mar 15, 2024 | STD-14 |
| International Mechanical Code (IMC) | 2021 | ICC | 2022 (OMSC) | Mar 15, 2024 (WAC 51-52) | CODE-01 |
| Oregon Mechanical Specialty Code (OMSC) | 2022 | Oregon BCD | 2022 | N/A | STD-05 |
| Washington State Mechanical Code | WAC 51-52 | WA SBCC | N/A | Mar 15, 2024 | STD-11 |
| International Fuel Gas Code (IFGC) | 2021 | ICC | Via OMSC/OPSC | Via WAC 51-52 | CODE-01 |

> **Note:**
> Washington does not adopt UPC Chapters 12 and 14, nor Chapter 5 (appliance venting and combustion air). Building sewer provisions are handled separately under Washington administrative rules. Oregon adopts UPC 2021 with its own set of state-specific amendments through the OPSC [STD-14, STD-04].
>
> *Applies to: Both*

---

## 2. Drain-Waste-Vent (DWV) Systems

### 2.1 Theory Foundation

#### 2.1.1 Underlying Principles

A DWV system operates on gravity and atmospheric pressure. Drainage piping carries wastewater downhill from fixtures to the building sewer. Vent piping allows air into the system to equalize pressure, preventing siphonage of fixture traps. Every trap — the U-shaped water seal between a fixture and the drain — must maintain a water seal of 2 to 4 inches to block sewer gases from entering occupied spaces [CODE-03, UPC 2021 Section 1002.1].

Think of a DWV system like a highway network: drain pipes are the roads carrying traffic (wastewater) downhill, vent pipes are the on-ramps that let air in so traffic flows smoothly, and traps are the security checkpoints that prevent toxic gases from traveling the wrong direction.

The physics are straightforward: water flows downhill by gravity, and air must be allowed in behind the flowing water to prevent a vacuum that would pull water out of traps. When you pour water from an inverted bottle, it glugs — that is what happens in an unvented drain. A properly vented drain flows smoothly and silently [CODE-03].

#### 2.1.2 Fixture Unit Methodology

The fixture unit (FU) system is a probability-based method for sizing drainage and vent piping. Rather than sizing pipes for simultaneous full flow from every connected fixture — which would result in absurdly large pipes — fixture units represent the probable peak load based on the frequency and duration of use of each fixture type [CODE-03, UPC 2021 Chapter 7].

Key fixture unit values (UPC 2021, Table 702.1):

| Fixture | Drainage Fixture Units (DFU) | Trap Size (inches) |
|---|---|---|
| Lavatory (bathroom sink) | 1 | 1-1/4 |
| Bathtub/shower | 2 | 1-1/2 |
| Kitchen sink (residential) | 2 | 1-1/2 |
| Dishwasher (domestic) | 2 | 1-1/2 (via disposer or indirect) |
| Clothes washer (residential) | 3 | 2 |
| Water closet (toilet, 1.6 GPF) | 4 | 3 (integral) |
| Floor drain | 2 | 2 |
| Laundry tray | 2 | 1-1/2 |

### 2.2 Pipe Sizing by Fixture Unit Load

Horizontal drain pipe sizing is determined by the total drainage fixture unit load and the slope of the pipe. UPC 2021 Chapter 7 provides the basis [CODE-03]:

| Pipe Diameter (inches) | Max DFU — 1/4" per foot slope | Max DFU — 1/8" per foot slope |
|---|---|---|
| 1-1/2 | 3 | 2 |
| 2 | 6 | 4 |
| 3 | 35 | 27 |
| 4 | 216 | 180 |

> **Note:**
> Slope requirements for horizontal drainage: minimum 1/4 inch per foot for pipes 3 inches and smaller, minimum 1/8 inch per foot for pipes 4 inches and larger. These are minimum slopes — steeper is acceptable within reason, but excessively steep slopes (approaching vertical) can cause liquids to outrun solids, leading to blockages [CODE-03, UPC 2021 Chapter 7].
>
> *Applies to: Both*

### 2.3 Trap Requirements

Every plumbing fixture discharging to the DWV system must be equipped with a trap [CODE-03, UPC 2021 Section 1002].

**P-traps** are the standard — a U-shaped fitting oriented with the outlet higher than the inlet, maintaining a water seal. **S-traps** (where the outlet exits downward) are prohibited in new construction because they are prone to self-siphonage: the column of water falling through the vertical outlet leg can pull the trap seal dry [CODE-03, UPC 2021 Section 1002.2].

**Trap arm length** — the horizontal distance from the trap weir to the vent — is critical. If the trap arm is too long, the water flowing through it can create enough friction and pressure drop to siphon the trap. If it is too short, there is insufficient developed length for proper drainage [CODE-03, UPC 2021 Table 1002.2]:

| Trap Arm Diameter (inches) | Maximum Trap Arm Length (feet) | Minimum Trap Arm Length |
|---|---|---|
| 1-1/4 | 5 | 2 x diameter |
| 1-1/2 | 6 | 2 x diameter |
| 2 | 8 | 2 x diameter |
| 3 | 12 | 2 x diameter |
| 4 | 16 | 2 x diameter |

### 2.4 Venting Systems

Venting serves two functions: pressure equalization (preventing trap siphonage) and gas discharge (exhausting sewer gases above the roof). UPC 2021 Chapter 9 governs venting requirements [CODE-03].

**Vent types permitted under UPC 2021:**

| Vent Type | Description | Typical Application | Code Section |
|---|---|---|---|
| Individual vent | Dedicated vent serving one fixture trap | Any fixture; simplest, most reliable | UPC 901.2 |
| Common vent | Single vent serving two fixture traps at same level | Back-to-back lavatories, side-by-side fixtures | UPC 908 |
| Wet vent | Vent pipe that also serves as a drain for an upstream fixture | Bathroom groups (lav vents through to tub/shower) | UPC 909 |
| Circuit vent | Single vent serving a circuit of floor-outlet fixtures | Battery of fixtures (e.g., multiple toilets) | UPC 910 |
| Air admittance valve (AAV) | Mechanical one-way valve admitting air on negative pressure | Where conventional venting is impractical | UPC 911 |

**Air admittance valves (AAVs)** merit special attention. These spring-loaded, one-way valves open to admit air when negative pressure develops in the drain and close under positive pressure to prevent sewer gas escape. They are useful in remodels where extending a conventional vent through the roof is impractical. However, AAVs require accessible installation for inspection and replacement, cannot serve as the only vent for a building drain, and have a finite service life [CODE-03, UPC 2021 Section 911].

> **PNW Regional Note:**
> In PNW seismic zones, vent terminations through the roof must account for seismic movement. Flexible connections or adequate clearance at roof penetrations prevent vent pipe damage during ground motion. Vent flashing must be compatible with the high-rainfall PNW climate — lead or no-caulk style flashings are standard, with particular attention to valley and low-slope locations where water accumulation is greatest [CODE-03, CODE-04].
>
> *Applies to: Both*

### 2.5 Cleanout Requirements and Placement

Cleanouts provide access for drain clearing and inspection. UPC 2021 Section 707 requires cleanouts at the following locations [CODE-03]:

- At the upper terminal of every horizontal drainage line
- At each change of direction greater than 135 degrees (45-degree bend)
- At intervals not exceeding 100 feet in horizontal drainage lines 4 inches and larger
- At intervals not exceeding 75 feet in horizontal drainage lines smaller than 4 inches
- At the base of each waste or soil stack
- At the junction of the building drain and building sewer (two-way cleanout)

Cleanouts must be of the same nominal size as the pipe they serve, up to 4 inches, and must be accessible. In finished spaces, cleanout access panels must be provided [CODE-03, UPC 2021 Section 707].

### 2.6 DWV Pipe Materials

| Material | Abbreviation | Common Use | Advantages | Limitations | Code Reference |
|---|---|---|---|---|---|
| ABS (acrylonitrile butadiene styrene) | ABS | DWV residential | Lightweight, easy to join (solvent cement), economical | UV-sensitive, noisy | UPC Table 701.2 |
| PVC (polyvinyl chloride) | PVC | DWV, building sewer | Lightweight, durable, chemical-resistant | Cannot be mixed with ABS (different solvent cement) | UPC Table 701.2 |
| Cast iron (hubless) | CI | DWV multifamily, commercial; fire-rated assemblies | Quiet, fire-resistant, durable | Heavy, expensive, requires specialty couplings | UPC Table 701.2 |
| Copper (DWV) | Cu-DWV | DWV where required | Fire-resistant, long service life | Expensive, requires soldering skill | UPC Table 701.2 |

> **PNW Regional Note:**
> ABS is the dominant residential DWV material in the PNW. Cast iron remains specified in multifamily construction for sound attenuation (floors between units) and fire-rated assemblies. Where drain lines pass through seismic joints, flexible couplings (Fernco or equivalent) must accommodate differential movement [CODE-03].
>
> *Applies to: Both*

---

## 3. Water Supply Systems

### 3.1 Theory Foundation

Water supply systems operate under pressure — either from the municipal supply main or a well pump. The system must deliver adequate flow rate (gallons per minute) at adequate pressure (pounds per square inch) to every fixture in the building, simultaneously accounting for peak demand, friction losses through piping and fittings, and elevation changes [CODE-03, UPC 2021 Chapter 6].

### 3.2 System Sizing

UPC 2021 Chapter 6 provides two methods for water supply sizing [CODE-03]:

**Traditional method:** Based on water supply fixture unit (WSFU) values assigned to each fixture, with conversion to gallons per minute via demand curves. This method, largely unchanged since the 1940s, tends to oversize systems because its fixture unit values were developed when fixtures used far more water than modern low-flow fixtures.

**Peak Water Demand Calculator (2021 UPC innovation):** The first significant update to plumbing system sizing methodology since the 1940s. This probability-based method uses statistical data and probability models for modern low-flow fixtures. It can result in smaller pipe sizes, reduced material costs, and better system performance through maintaining adequate velocity for self-cleaning of pipes [CODE-03].

Key water supply fixture unit values (UPC 2021 Chapter 6, traditional method):

| Fixture | WSFU — Cold | WSFU — Hot | WSFU — Total |
|---|---|---|---|
| Lavatory | 0.5 | 0.5 | 0.7 |
| Bathtub/shower | 1.0 | 1.0 | 1.4 |
| Kitchen sink | 1.0 | 1.0 | 1.4 |
| Dishwasher (domestic) | — | 1.0 | 1.0 |
| Clothes washer | 1.0 | 1.0 | 1.4 |
| Water closet (flush tank) | 2.2 | — | 2.2 |
| Hose bibb / sillcock | 2.5 | — | 2.5 |

### 3.3 Pipe Materials for Supply

| Material | Type | Common Use | Joining Method | Advantages | Limitations |
|---|---|---|---|---|---|
| Copper | Type L | Primary supply piping | Soldering (lead-free), press-fit | Proven durability, bacteriostatic, code-universal | Expensive, requires skill, acidic water corrosion |
| Copper | Type M | Where permitted; less wall thickness | Same as Type L | Lower cost than Type L | Thinner wall; not allowed everywhere |
| PEX | Cross-linked polyethylene | Residential supply (increasingly dominant) | Crimp, clamp, expansion, push-fit | Flexible, freeze-resistant, fast installation, manifold systems | UV-sensitive, rodent damage, some flavor/odor concerns |
| CPVC | Chlorinated PVC | Hot and cold supply | Solvent cement | Moderate cost, no flame for joining | Brittle with age, chemical sensitivity, not freeze-tolerant |

> **PNW Regional Note:**
> PEX has become the dominant residential supply pipe material in PNW new construction due to its flexibility (simplifying installation in the region's many crawlspace-accessed homes), superior freeze resistance (important for exposed crawlspace piping in Climate Zone 4C/5B), and compatibility with manifold distribution systems that reduce fitting count and improve water conservation. Type L copper remains standard for main service lines and exposed locations [CODE-03].
>
> *Applies to: Both*

### 3.4 Backflow Prevention

Backflow — the reversal of water flow from a contaminated source back into the potable supply — is a critical public health concern. Both Oregon and Washington require backflow prevention at every cross-connection [CODE-03, GOV-09].

**Common backflow prevention devices:**

| Device | Abbreviation | Hazard Level | Typical Application |
|---|---|---|---|
| Atmospheric vacuum breaker | AVB | Low | Hose bibbs, irrigation |
| Pressure vacuum breaker | PVB | Moderate | Irrigation systems, industrial process connections |
| Reduced pressure zone assembly | RPZA | High | Boiler makeup, fire suppression connection, medical |
| Double check valve assembly | DCVA | Moderate | Fire line connections, some irrigation |
| Air gap | AG | Highest | Fixture indirect waste, chemical dispensing |

> **GATE — Verify Before Proceeding**
>
> Before installing or testing backflow prevention assemblies in Washington:
> - [ ] Verify the tester holds current Washington Department of Health Certified Backflow Assembly Tester (BAT) certification per WAC 246-292
> - [ ] Confirm the assembly is on the approved list for the hazard level present
> - [ ] Verify the local water purveyor's cross-connection control program requirements
>
> **If any item cannot be confirmed:** Contact the local water purveyor before proceeding. Testing by uncertified personnel is a violation of state health regulations [GOV-09, STD-14].

### 3.5 Fixture Flow Limits

Water conservation requirements are codified through maximum fixture flow rates [CODE-03, STD-14]:

| Fixture | Maximum Flow Rate | Condition | Applicability |
|---|---|---|---|
| Residential lavatory faucets | 1.2 GPM | At 60 PSI | WA (state amendment) |
| Public-use lavatory faucets | 0.5 GPM | At 60 PSI | WA (state amendment) |
| Showerheads | 2.0 GPM | At 80 PSI | Both (UPC base) |
| Kitchen faucets | 1.8 GPM | At 60 PSI | Both (UPC base) |
| Water closets (toilets) | 1.28 GPF | Per flush | Both (UPC base) |
| Urinals | 0.5 GPF | Per flush | Both (UPC base) |

### 3.6 Water Heater Systems

#### 3.6.1 Tank vs. Tankless

| Characteristic | Tank (Storage) | Tankless (On-Demand) |
|---|---|---|
| First hour delivery | High (stored volume + recovery) | Depends on flow rate and temperature rise |
| Continuous supply | Limited by tank capacity | Unlimited at rated flow |
| Energy efficiency | 0.60–0.65 EF (gas), 0.90–0.95 EF (electric) | 0.82–0.98 EF (gas), 0.99 EF (electric) |
| Installed cost (PNW, 2026) | $1,200–$2,500 | $2,500–$5,000 |
| Lifespan | 8–12 years | 15–20 years |
| Space requirement | 40–80 gallon footprint | Wall-mounted, compact |
| PNW consideration | Heat pump water heaters increasingly preferred | Gas units require adequate combustion air and venting |

#### 3.6.2 Heat Pump Water Heaters (HPWH)

Heat pump water heaters are a significant element of PNW electrification strategy. They extract heat from ambient air and transfer it to stored water, achieving coefficients of performance (COP) of 2.0 to 3.5 — meaning they produce 2 to 3.5 units of heat energy for every unit of electrical energy consumed [STD-07, STD-15].

> **PNW Regional Note:**
> Both Oregon (OEESC 2025) and Washington (WSEC-R 2021) energy codes strongly incentivize heat pump water heaters in new residential construction. Washington's code effectively requires heat pump water heaters in new homes through prescriptive energy budget requirements. Installation requires adequate ambient air volume (typically a minimum of 750 cubic feet of surrounding space or ducted air supply) and condensate management [STD-07, STD-15].
>
> *Applies to: Both*

#### 3.6.3 Safety Requirements

Every water heater must be equipped with [CODE-03, CODE-01]:

- **Temperature-Pressure Relief (TPR) valve:** Rated to the working pressure and temperature of the water heater. Must be plumbed to discharge within 6 inches of the floor or to an approved drain, with no reduction in size, no valves, and no threading on the discharge end.
- **Expansion tank:** Required on any closed system (where a backflow preventer or check valve is installed on the supply). Thermal expansion of heated water can increase system pressure to dangerous levels without an expansion tank.
- **Seismic strapping:** Required in Seismic Design Categories C through F (all of western Oregon and Washington). Two straps — upper third and lower third of the tank — secured to the building structure. See [M1-ST:Seismic Detailing] for structural connection requirements.
- **Drain pan:** Required when the water heater is installed in a location where leakage would cause damage (e.g., above finished spaces).

---

## 4. HVAC Systems

### 4.1 Overview and PNW Climate Context

The Pacific Northwest's marine climate (Climate Zone 4C west of the Cascades) creates a distinctive HVAC profile: moderate heating demand (4,000–5,500 heating degree days), minimal cooling demand (200–600 cooling degree days in most western locations), and high humidity requiring effective ventilation and moisture management [STD-07, STD-15, GOV-07].

This climate profile has made the PNW a national leader in heat pump adoption. Ductless mini-split heat pumps are the dominant retrofit technology, and ducted heat pump systems are increasingly specified in new construction. The region's mild winters keep air-source heat pump performance high — outdoor temperatures rarely drop below the efficiency threshold of modern cold-climate heat pumps [STD-15, GOV-07].

### 4.2 Forced Air Systems

Forced air systems use a central air handler (furnace or heat pump air handler) to condition air and distribute it through ductwork.

#### 4.2.1 Duct Sizing and Design

Duct sizing follows Manual D (ACCA) methodology, using friction rate calculations based on available static pressure, equivalent length of the duct system, and airflow requirements (CFM) for each room [CODE-01, STD-05, STD-11].

**Key duct requirements (IMC):**

| Requirement | Specification | Code Reference |
|---|---|---|
| Minimum supply duct size | 6" round or equivalent | IMC Section 603 |
| Maximum duct velocity — trunk | 900 FPM (residential) | IMC Table 603.4 |
| Maximum duct velocity — branch | 600 FPM (residential) | IMC Table 603.4 |
| Return air opening | Sized for 1.0 CFM per sq ft of opening | IMC Section 603 |
| Duct insulation | R-8 minimum (unconditioned spaces) | OEESC/WSEC |
| Duct sealing | Mastic or listed tape at all joints | OEESC/WSEC |

#### 4.2.2 Air Distribution and Return Air

Proper air distribution requires balanced supply and return. Common residential failures include undersized return air paths (causing negative pressure in hallways and positive pressure in bedrooms with doors closed) and inadequate transfer grilles or jumper ducts between rooms and the return air path [CODE-01, STD-05, STD-11].

**Return air requirements:**
- Dedicated return duct or transfer grille for every room with a closable door
- Return air must not be drawn from bathrooms, kitchens, garages, or mechanical rooms
- Panned joists used as return ducts must be sealed at all joints (common violation)

#### 4.2.3 Filtration

Minimum MERV 8 filtration is required by current energy codes. Filter racks must be accessible for filter changes without tools, and the system must be designed so the filter is upstream of the air handler blower and heat exchanger [CODE-01, STD-05, STD-11].

### 4.3 Heat Pump Systems

#### 4.3.1 Air-Source Heat Pumps (ASHP)

Air-source heat pumps transfer heat between indoor and outdoor air using a refrigerant cycle. Modern cold-climate ASHPs (rated to AHRI 210/240 and NEEP cold-climate specification) maintain rated heating capacity down to 5 degrees F and continue operating (at reduced capacity) down to -13 degrees F — well below typical PNW winter minimums [STD-15, GOV-07].

**Types of residential ASHP systems:**

| System Type | Configuration | Best Application | Installed Cost (PNW, 2026) |
|---|---|---|---|
| Ductless mini-split | Outdoor unit + wall-mounted indoor head(s) | Retrofit, room additions, supplemental heating | $4,000–$8,000 (single zone) |
| Multi-split | One outdoor unit + multiple indoor heads | Whole-house retrofit without ductwork | $12,000–$25,000 |
| Ducted ASHP | Outdoor unit + indoor air handler with ductwork | New construction, replacing gas furnace | $8,000–$15,000 |
| Hybrid/dual-fuel | Heat pump + gas furnace backup | Extreme cold areas (east of Cascades) | $10,000–$18,000 |

#### 4.3.2 Ground-Source (Geothermal) Heat Pumps

Ground-source heat pumps (GSHP) use the stable temperature of the earth (approximately 50-55 degrees F in PNW at depth) as the heat source/sink. They achieve COP values of 3.5–5.0 and have the lowest operating cost of any heating/cooling system. However, installation costs ($20,000–$40,000+ for the ground loop alone) and the need for adequate land area for horizontal loops (or deep vertical bore drilling) limit adoption primarily to new construction on larger lots [STD-15, GOV-07].

#### 4.3.3 Refrigerant Line Sets and Condensate

Heat pump installations require properly sized, insulated refrigerant line sets (liquid line and suction line) between outdoor and indoor units. Line sets must be protected from physical damage, UV exposure, and must maintain the manufacturer's specified maximum length and elevation difference [CODE-01, STD-05, STD-11].

**Condensate management:** Both heating (in cooling mode) and cooling operations produce condensate that must be drained. Condensate drains require:
- Minimum 3/4-inch diameter
- Trap (if connected to a drain)
- Slope to drain point (1/8 inch per foot minimum)
- Secondary drain or overflow shutoff switch where leakage would cause damage

### 4.4 Ventilation Requirements

#### 4.4.1 Bathroom Exhaust

| Requirement | Specification | Code Reference |
|---|---|---|
| Minimum exhaust rate | 50 CFM intermittent or 20 CFM continuous | IMC Section 403 |
| Discharge | To the outdoors (not to attic, soffit, or crawlspace) | IMC Section 501 |
| Duct material | Smooth-wall rigid duct preferred; flex duct limited | IMC Section 603 |
| Duct insulation | Required in unconditioned spaces (condensation prevention) | OEESC/WSEC |
| Termination | Dampered exhaust cap, minimum 3 feet from openings | IMC Section 501 |

#### 4.4.2 Kitchen Range Hood Exhaust

Kitchen range hoods exhaust cooking contaminants (grease, combustion products from gas ranges, moisture, particulates). Residential requirements [CODE-01, STD-05, STD-11]:

- Minimum 100 CFM for ducted range hoods
- Makeup air required for exhaust systems exceeding 400 CFM (prevents depressurization that can cause backdrafting of combustion appliances)
- Grease filters required; duct material must be smooth-wall galvanized steel or stainless steel for grease-laden exhaust
- Discharge to outdoors — recirculating range hoods do not meet code ventilation requirements

> **GATE — Verify Before Proceeding**
>
> Before installing a range hood with exhaust capacity exceeding 400 CFM:
> - [ ] Verify makeup air system is included in the design
> - [ ] Confirm makeup air is interlocked with range hood operation
> - [ ] Check for combustion appliances that could be affected by depressurization (gas water heater, gas furnace, fireplace)
>
> **If any item cannot be confirmed:** Reduce range hood capacity to 400 CFM or less, or consult an HVAC engineer for makeup air system design [CODE-01, STD-05, STD-11].

#### 4.4.3 Whole-House Ventilation

Modern energy-efficient homes are built tight — which is excellent for energy performance but requires mechanical ventilation to maintain indoor air quality. Both Oregon and Washington energy codes mandate whole-house mechanical ventilation in new construction [STD-07, STD-15].

**Ventilation strategies:**

| Strategy | Description | Energy Impact | PNW Suitability |
|---|---|---|---|
| Exhaust-only | Continuous bathroom exhaust fan, outdoor air enters through building leakage | Lowest cost, energy penalty from untempered air | Acceptable for moderate climate; not ideal for tight construction |
| Supply-only | Outdoor air ducted to return of HVAC system | Moderate cost, requires HVAC fan operation | Good for filtration control; less common in PNW |
| Balanced (HRV) | Heat recovery ventilator — exhausts stale air, supplies fresh air, recovers 70-85% of heat | Higher cost, highest energy performance | Excellent for PNW — preferred in tight new construction |
| Balanced (ERV) | Energy recovery ventilator — like HRV but also transfers moisture | Higher cost, manages humidity transfer | Good where summer humidity is a concern (less typical in PNW) |

> **PNW Regional Note:**
> HRVs (Heat Recovery Ventilators) are increasingly specified in PNW new construction as building envelopes tighten under current energy codes. An HRV recovers 70-85% of the heat from exhaust air, significantly reducing the energy penalty of required ventilation. For PNW marine climate, HRVs are generally preferred over ERVs because the climate rarely has summer humidity levels that would benefit from moisture recovery [STD-07, STD-15, GOV-07].
>
> *Applies to: Both*

### 4.5 Hydronic (Radiant) Heating

Hydronic systems circulate heated water through tubing embedded in floors, walls, or ceilings. In the PNW, radiant floor heating is popular in new custom homes and in concrete-slab construction.

**System components:**
- **Boiler or heat pump:** Heats water (condensing boilers at 95%+ efficiency; heat pump hydronic systems at COP 2.5–4.0)
- **Distribution piping:** PEX tubing embedded in or under floor, stapled to subfloor, or in concrete slab
- **Manifold:** Distributes flow to individual circuits, with balancing valves and flow meters
- **Controls:** Outdoor reset control (adjusts water temperature based on outdoor temperature), zone thermostats, mixing valves

**Design considerations for PNW:**
- Slab-on-grade installations must account for the region's saturated soils — underslab insulation (minimum R-10 at slab edge, R-5 under slab) prevents heat loss to the wet ground [STD-07, STD-15]
- Hydronic systems pair well with heat pumps for low-temperature radiant floor heating (90-120 degrees F supply vs. 140-180 degrees F for baseboards)
- Seismic provisions: manifolds and boilers must be seismically secured. See [M1-ST:Seismic Detailing] for mechanical equipment anchorage

---

## 5. Fuel Gas Systems

> **BLOCK — Licensed Professional Required**
>
> ALL fuel gas system work — including installation, modification, repair, and appliance connection — must be performed by a licensed professional (licensed plumber with gas endorsement or licensed gas fitter). No DIY procedures for gas piping or gas appliance connections are provided in this document. This is a life-safety requirement without exception.
>
> **Required professional:** Licensed plumber with gas endorsement, or licensed gas fitter
> **Why:** Gas leaks cause explosions, fires, carbon monoxide poisoning, and death. Improper gas piping is a leading cause of residential fire fatalities.
> **Code basis:** IFGC 2021 via CODE-01; Oregon OAR 918-780; Washington WAC 51-52 [CODE-01, GOV-01, GOV-02]

### 5.1 Code Framework

Fuel gas systems are governed by the International Fuel Gas Code (IFGC), adopted through the mechanical codes in both states [CODE-01, STD-05, STD-11].

### 5.2 Gas Piping Overview (Informational Only)

This section is provided for informational understanding only. No procedures for gas system installation, modification, or repair are included.

**Piping materials:** Black steel pipe (threaded or welded), corrugated stainless steel tubing (CSST), copper tubing (Type L or K, where permitted by local jurisdiction). CSST requires bonding to the grounding electrode system per the manufacturer's installation instructions and current NEC/IFGC requirements to reduce the risk of puncture from nearby lightning strikes [CODE-01, CODE-02].

**System design principles:**
- BTU load calculation for each appliance
- Pipe sizing based on total BTU demand, piping length, and inlet pressure
- Gas meter to appliance path: main shutoff at meter, branch shutoffs at each appliance, drip legs at appliance connections, flexible connectors for moveable appliances
- Regulators step down from meter pressure (typically 2 PSI) to appliance operating pressure (typically 7" water column for natural gas)

### 5.3 Venting Categories

Gas appliance venting is classified into four categories based on flue gas pressure and temperature [CODE-01]:

| Category | Flue Pressure | Flue Temperature | Vent Material | Examples |
|---|---|---|---|---|
| I | Negative (natural draft) | Above dew point (non-condensing) | Type B vent, masonry chimney | Standard gas furnace, tank water heater |
| II | Negative (natural draft) | Below dew point (condensing) | Corrosion-resistant (stainless, AL29-4C) | Rare — most condensing appliances are Category IV |
| III | Positive (fan-assisted) | Above dew point | Type B vent with sealed joints | Some mid-efficiency furnaces |
| IV | Positive (fan-assisted) | Below dew point (condensing) | PVC, CPVC, or polypropylene (per manufacturer) | High-efficiency condensing furnace (90%+), condensing water heater |

**Direct vent appliances** draw combustion air from outdoors and exhaust flue gases to outdoors through a sealed, concentric or two-pipe system. They are not affected by building depressurization and are the preferred configuration in tight, energy-efficient PNW construction [CODE-01].

> **BLOCK — Licensed Professional Required**
>
> Gas appliance venting design, installation, and modification must be performed by a licensed professional. Improper venting causes carbon monoxide poisoning — an odorless, colorless gas that kills without warning. Carbon monoxide detectors are required on every level of a dwelling and within 15 feet of sleeping areas (per IRC 2021 Section R315, adopted by both OR and WA), but detectors are a last line of defense, not a substitute for proper venting.
>
> **Required professional:** Licensed HVAC contractor or licensed plumber with gas endorsement
> **Code basis:** IFGC 2021 Chapter 5; IRC 2021 Section R315 [CODE-01, STD-02, STD-10]

### 5.4 Natural Gas vs. Propane

| Characteristic | Natural Gas | Propane (LP) |
|---|---|---|
| Specific gravity (relative to air) | 0.60 (lighter — rises) | 1.52 (heavier — sinks and pools) |
| BTU per cubic foot | ~1,030 | ~2,516 |
| Delivery | Underground utility main | Tank (above-ground or buried) |
| Operating pressure | 7" WC (residential) | 11" WC (after second-stage regulator) |
| Leak behavior | Dissipates upward | Pools in low areas — EXTREMELY DANGEROUS |
| PNW availability | Urban/suburban areas | Rural areas beyond gas main service |

> **BLOCK — Licensed Professional Required**
>
> Propane systems present heightened danger due to the fuel's heavier-than-air density. Leaked propane pools in basements, crawlspaces, and low areas, creating invisible explosion hazards. All propane system work — including tank placement, piping, regulators, and appliance connections — requires a licensed professional.
>
> **Required professional:** Licensed propane technician or licensed plumber with gas endorsement
> **Why:** Propane pooling in enclosed spaces has caused catastrophic explosions
> **Code basis:** IFGC 2021; NFPA 58 (Liquefied Petroleum Gas Code) [CODE-01]

---

## 6. PNW-Specific Considerations

### 6.1 Seismic Requirements for Plumbing and Mechanical Systems

The Cascadia Subduction Zone creates seismic exposure throughout western Oregon and Washington (Seismic Design Categories C through D, with some areas at SDC E). Plumbing and mechanical equipment must be seismically restrained [CODE-04, CODE-01, STD-01, STD-09].

**Key seismic requirements:**

| Component | Requirement | Code Reference |
|---|---|---|
| Water heaters | Two straps (upper 1/3 and lower 1/3), secured to structure | UPC 2021 Section 510; ASCE 7-22 Chapter 13 |
| Boilers and furnaces | Vibration isolation with seismic snubbers or direct anchor | ASCE 7-22 Section 13.6; IMC |
| Suspended ductwork | Lateral bracing at intervals per ASCE 7-22 | ASCE 7-22 Section 13.6.7 |
| Suspended piping | Lateral and longitudinal bracing per SMACNA or ASCE 7 | ASCE 7-22 Section 13.6.7 |
| Roof-mounted equipment | Anchorage designed for seismic forces at roof level | ASCE 7-22 Chapter 13 |
| Flexible connections | Required at equipment connections and seismic joints | UPC 2021; IMC |

See [M1-ST:Seismic Detailing] for structural anchorage details and connection design.

### 6.2 Moisture and Climate

PNW's sustained winter moisture creates specific plumbing and mechanical concerns:

- **Crawlspace plumbing:** Much PNW residential plumbing runs through ventilated crawlspaces. Pipe insulation is critical — PEX is preferred for supply lines due to freeze tolerance (PEX can expand up to 3x its diameter before failure, versus copper which splits). Drain lines in crawlspaces must maintain adequate slope and be supported at proper intervals to prevent bellies that trap water [CODE-03, STD-07, STD-15].
- **Condensation on ducts:** Supply ducts in unconditioned crawlspaces or attics must be insulated to R-8 minimum to prevent condensation during cooling operation and to maintain energy efficiency [STD-07, STD-15].
- **HVAC condensate in marine climate:** Mini-split outdoor units drain condensate year-round (from the outdoor coil in heating mode). Condensate drain lines from outdoor units in PNW must be routed to prevent ice formation on walkways in the rare PNW freeze events.

### 6.3 Energy Code Implications

Both Oregon (OEESC 2025, STD-07) and Washington (WSEC-R 2021, STD-15) have aggressive energy codes affecting mechanical systems:

| Requirement | Oregon (OEESC 2025) | Washington (WSEC-R 2021) | Source |
|---|---|---|---|
| Duct insulation (unconditioned space) | R-8 minimum | R-8 minimum | STD-07, STD-15 |
| Duct leakage testing | Required (new construction) | Required (new construction) | STD-07, STD-15 |
| Heat pump COP minimum | Per equipment efficiency tables | Per equipment efficiency tables | STD-07, STD-15 |
| Whole-house ventilation | Required | Required | STD-07, STD-15 |
| Water heater efficiency | Heat pump water heaters strongly incentivized | Effectively required via prescriptive path | STD-07, STD-15 |
| Pipe insulation (hot water) | R-3 minimum first 5 feet from water heater; all accessible piping | R-3 minimum first 5 feet from water heater | STD-07, STD-15 |

### 6.4 MEP Coordination — Cross-Reference with Electrical (M2)

Plumbing and mechanical systems interact with electrical systems at numerous points. Coordination prevents conflicts during construction and ensures code compliance [CODE-02, CODE-03]:

| Coordination Point | Plumbing/Mechanical Need | Electrical Need | Reference |
|---|---|---|---|
| Water heater | Gas line or 240V circuit; TPR valve; vent | Dedicated 240V/30A circuit (electric); 120V circuit (gas) | [M2-EL:Service Sizing] |
| HVAC equipment | Refrigerant line sets, condensate drain | Dedicated circuit per nameplate; disconnect within sight | [M2-EL:HVAC Circuits] |
| Garbage disposer | Drain connection, dishwasher knockout | 120V dedicated circuit, switch or air switch | [M2-EL:Kitchen Circuits] |
| Sump pump | Discharge piping, check valve | Dedicated 120V circuit, GFCI protected | [M2-EL:GFCI Requirements] |
| Bathroom exhaust fan | Duct to exterior | Switched circuit, timer or humidity sensor | [M2-EL:Bathroom Circuits] |
| Whole-house ventilation (HRV/ERV) | Supply and exhaust duct, condensate drain | Dedicated 120V circuit, interlock with HVAC | [M2-EL:Ventilation] |

### 6.5 Structural Penetrations — Cross-Reference with Structural (M1)

Plumbing and mechanical systems require penetrations through structural members (joists, studs, top/bottom plates, beams). These penetrations must comply with structural framing rules to prevent weakening load-bearing elements [CODE-01, STD-02, STD-10]:

| Structural Member | Maximum Hole Diameter | Location Restrictions | Code Reference |
|---|---|---|---|
| Floor joists (2x10) | 1/3 of joist depth (3.06") | Middle 1/3 of span; min 2" from edges | IRC 2021 Section R502.8 |
| Floor joists — notch | 1/6 of joist depth (1.53") | Not in middle 1/3 of span; not at bearing points | IRC 2021 Section R502.8 |
| Bearing wall studs — bore | 40% of stud width (1.4" for 2x4) | Center of stud width | IRC 2021 Section R602.6 |
| Bearing wall studs — notch | 25% of stud width (0.875" for 2x4) | — | IRC 2021 Section R602.6 |
| Non-bearing wall studs — bore | 60% of stud width (2.1" for 2x4) | — | IRC 2021 Section R602.6 |
| Top/bottom plates | — | Minimum 5/8" remaining material at each edge | IRC 2021 Section R602.6.1 |

See [M1-ST:Framing Penetrations] for detailed requirements and reinforcement methods.

---

## 7. Maintenance, Diagnostics, and Repair

### 7.1 L1 — Homeowner Awareness: Warning Signs

#### What Every Homeowner Should Watch For

**Visual signs:**
- Water stains on ceilings or walls below bathrooms or kitchens
- Green or white corrosion on visible copper pipe fittings
- Standing water around the base of the water heater
- Rust-colored water from hot water taps (water heater tank corrosion)
- Mold or mildew in bathroom or near plumbing fixtures

**Sound signs:**
- Running water sounds when no fixtures are in use (possible hidden leak)
- Gurgling from drains after flushing a toilet or running water elsewhere (venting problem)
- Banging or hammering in pipes when turning off faucets (water hammer)
- Whistling or hissing from the water heater (TPR valve issue or sediment buildup)

**Smell signs:**
- Sewer/rotten egg smell from drains (dry trap — pour water into infrequently used drains)
- Musty smell near walls or floors (hidden moisture/leak)

> **BLOCK — Licensed Professional Required**
>
> If you smell natural gas (rotten egg / sulfur odor added to gas for detection) or propane:
> 1. Do NOT turn on or off any electrical switches, lights, or appliances
> 2. Do NOT use your phone inside the building
> 3. Leave the building immediately
> 4. Call 911 and your gas utility from outside, at a safe distance
>
> **Required professional:** Gas utility emergency response; licensed gas technician for follow-up repair
> **Why:** Gas accumulation creates explosion risk. Electrical sparks from switches, phones, or appliances can ignite accumulated gas.
> **Code basis:** IFGC 2021; utility emergency protocols [CODE-01]

### 7.2 Seasonal Maintenance Schedule

| Season | System | Task | Frequency | DIY or Pro? | Why It Matters |
|---|---|---|---|---|---|
| Fall | DWV | Clear gutters and downspouts; ensure storm drains are clear | Annual | DIY (L1) | PNW fall rains can overwhelm clogged systems |
| Fall | Water heater | Flush tank (drain 2-3 gallons from drain valve to remove sediment) | Annual | DIY (L2) | Sediment reduces efficiency and accelerates tank corrosion |
| Fall | HVAC | Replace air filter; schedule furnace/heat pump maintenance | Annual (filter: quarterly) | Filter: DIY; tune-up: Pro | Dirty filters reduce efficiency 5-15% and strain equipment |
| Fall | Plumbing | Disconnect garden hoses; shut off and drain exterior hose bibbs | Annual | DIY (L1) | Freeze protection — even mild PNW winters can freeze exposed pipes |
| Winter | DWV | Monitor drains for slow flow (tree root intrusion common in PNW) | As noticed | Initial: DIY (drain cleaner); recurring: Pro | Tree roots are the #1 cause of sewer line failure in PNW |
| Winter | HVAC | Check heat pump outdoor unit for ice buildup; clear debris | Monthly (during operation) | DIY (L1) — visual check only | Blocked airflow reduces efficiency; persistent ice indicates defrost cycle failure (call Pro) |
| Spring | HVAC | Schedule A/C or heat pump cooling tune-up | Annual | Pro | Refrigerant charge, coil cleaning, electrical connections |
| Spring | Plumbing | Inspect all visible supply lines for drips or corrosion | Annual | DIY (L1) — visual only | Catch small leaks before they become big leaks |
| Spring | Water heater | Test TPR valve (lift lever briefly — water should discharge) | Annual | DIY (L2) | Ensures safety valve is functional. If it does not reseat, call a plumber. |
| Summer | Irrigation | Test backflow preventer | Annual (WA requires certified tester) | Pro (WA mandate) | Protects potable water supply from irrigation system contamination |
| Summer | DWV | Pour water into seldom-used drains (floor drains, guest bath) | Quarterly | DIY (L1) | Prevents trap dry-out and sewer gas entry |

### 7.3 Common Failure Modes and Diagnostics

#### 7.3.1 Water Heater Failure

| Symptom | Likely Cause | Severity | Action |
|---|---|---|---|
| No hot water | Pilot light out (gas); tripped breaker (electric); failed thermostat | Medium | Gas: relight pilot per manufacturer instructions or call Pro. Electric: reset breaker; if trips again, call Pro |
| Lukewarm water | Broken dip tube; undersized heater; sediment accumulation | Low-Medium | Flush tank; if persistent, call Pro for evaluation |
| Leaking from bottom | Tank corrosion (anode rod depleted) | High | Replace water heater. Tank corrosion is not repairable. |
| Leaking from TPR valve | Excessive pressure or temperature; failed valve | High | Do NOT cap or plug the TPR valve. Call Pro immediately. |
| Rumbling/popping sounds | Sediment buildup on heating elements or burner plate | Low | Flush tank. If severe, descale or replace. |
| Rust-colored hot water | Tank corrosion beginning | Medium | Check/replace anode rod (Pro recommended). May indicate tank nearing end of life. |

#### 7.3.2 Drain Clogs

| Location | Common Cause (PNW) | DIY Fix | When to Call Pro |
|---|---|---|---|
| Bathroom sink | Hair and soap scum | Remove stopper, clean pop-up assembly; plunger; drain snake | If deeper than trap arm |
| Kitchen sink | Grease, food particles | Plunger; boiling water + dish soap; drain snake | If repeated clogs or multiple fixtures affected |
| Toilet | Foreign objects, excess paper | Flange plunger; closet auger | If auger does not clear; if multiple fixtures back up simultaneously |
| Main line | Tree root intrusion (extremely common in PNW) | Not DIY | Always Pro — camera inspection recommended to assess root damage |
| Floor drain | Sediment, debris | Plunger; drain snake | If connected to main line issue |

> **Note:**
> Chemical drain cleaners (sulfuric acid or lye-based) are NOT recommended. They can damage pipes (especially older cast iron and ABS), harm the environment, create dangerous fumes, and provide only temporary relief. Mechanical clearing (plunger, snake, hydro-jetting by a professional) is always preferred [CODE-03].
>
> *Applies to: Both*

#### 7.3.3 HVAC Efficiency Loss

| Symptom | Likely Cause | DIY Check | Pro Service Required |
|---|---|---|---|
| Higher energy bills, same comfort | Dirty filter, duct leakage, refrigerant loss | Replace filter; visually inspect accessible duct joints | Duct leakage test; refrigerant charge check |
| Uneven room temperatures | Damper adjustment, duct disconnection, undersized ducts | Check register dampers; inspect visible ductwork | Airflow balancing; duct design review |
| System runs constantly | Undersized system, low refrigerant, dirty coils | Replace filter; clear outdoor unit of debris | Load calculation; refrigerant charge; coil cleaning |
| Short cycling (frequent on/off) | Oversized system, thermostat issue, dirty filter | Replace filter; check thermostat location (not in direct sun or near heat source) | System sizing evaluation; electrical diagnosis |
| Ice on outdoor heat pump unit | Normal defrost cycle (temporary); blocked airflow; low refrigerant | Clear leaves/debris from unit; verify defrost cycle runs | If ice persists after clearing, call Pro |

### 7.4 Repair vs. Replace Decision Framework

| System | Expected Lifespan | Replace When | Repair When | Cost Threshold (PNW, 2026) |
|---|---|---|---|---|
| Tank water heater | 8–12 years | Tank is leaking; unit is >10 years old and failing; no parts available | Individual component failure (thermostat, element, anode rod) under 10 years | Repair >50% of replacement cost = replace |
| Tankless water heater | 15–20 years | Heat exchanger failure; no parts available | Scale buildup (descale service), individual component failure | Repair >40% of replacement cost = replace |
| Gas furnace | 15–25 years | Cracked heat exchanger (safety issue); efficiency <80%; >20 years old | Ignitor, flame sensor, blower motor, control board | Repair >50% of replacement cost = replace |
| Heat pump | 12–20 years | Compressor failure in unit >15 years; refrigerant obsolete (R-22) | Capacitor, contactor, fan motor, reversing valve (<15 years) | Repair >50% of replacement cost = replace |
| Sewer line | 50–100+ years (cast iron/clay) | Full collapse; bellied sections with standing water; extensive root damage | Spot repair of localized damage; root cutting (temporary) | Trenchless liner ($6,000–$12,000) vs. traditional replacement ($8,000–$20,000) |
| Supply piping (copper) | 50–70 years | Widespread pinhole leaks (sign of systemic corrosion); polybutylene pipe (replace immediately) | Localized joint leak, individual section failure | Whole-house repipe: $8,000–$15,000 (PEX) |

---

## 8. L3 — Trade Student: Worked Calculation Examples

### 8.1 Example 1: DWV Sizing for a Residential Bathroom Group (1st/2nd Year Level)

**Given:** A full bathroom group consisting of a water closet (1.6 GPF), a bathtub/shower, and a lavatory, connecting to a horizontal branch drain running to the main building drain.

**Find:** Minimum branch drain size and required slope.

**Code reference:** UPC 2021 Chapter 7, Table 702.1 [CODE-03]

**Solution:**

Step 1: Determine fixture unit loads.
- Water closet: 4 DFU
- Bathtub/shower: 2 DFU
- Lavatory: 1 DFU
- **Total: 7 DFU**

Step 2: Select pipe size from UPC drainage table.
- A 2-inch pipe at 1/4" per foot slope handles 6 DFU — insufficient.
- A 3-inch pipe at 1/4" per foot slope handles 35 DFU — adequate.
- However, the water closet requires a minimum 3-inch drain connection (integral trap).

**Result:** 3-inch horizontal branch drain at minimum 1/4 inch per foot slope.

**Code check:** 7 DFU <= 35 DFU (3-inch pipe capacity at 1/4" slope) — **PASS**

### 8.2 Example 2: Water Supply Sizing — Branch to Kitchen (3rd Year Level)

**Given:** A kitchen branch serves: kitchen sink (1.4 WSFU total), dishwasher (1.0 WSFU hot), and refrigerator ice maker (negligible). Developed length from main trunk to farthest fixture: 25 feet. Available pressure at main trunk: 50 PSI. Elevation change: 0 feet (same level).

**Find:** Minimum supply pipe size for the kitchen branch.

**Code reference:** UPC 2021 Chapter 6 [CODE-03]

**Solution:**

Step 1: Total fixture units on branch.
- Kitchen sink: 1.4 WSFU
- Dishwasher: 1.0 WSFU
- **Total: 2.4 WSFU**

Step 2: Convert WSFU to GPM demand using UPC demand curves.
- 2.4 WSFU corresponds to approximately 4.0 GPM demand.

Step 3: Determine friction loss allowance.
- Available pressure: 50 PSI
- Required residual pressure at fixture: 8 PSI (minimum per UPC)
- Pressure available for friction: 50 - 8 = 42 PSI
- Friction allowance per 100 feet: (42 / 25) x 100 = 168 PSI per 100 feet (very generous for this short run)

Step 4: Select pipe size from flow/friction tables.
- 1/2-inch copper Type L at 4.0 GPM: friction loss approximately 30 PSI per 100 feet at 8.3 FPS velocity — acceptable but velocity is high.
- 3/4-inch copper Type L at 4.0 GPM: friction loss approximately 5 PSI per 100 feet at 3.2 FPS velocity — preferred.

**Result:** 3/4-inch copper Type L (or 3/4-inch PEX) for kitchen branch supply.

**Code check:** 4.0 GPM at 3.2 FPS (3/4-inch) — velocity under 8 FPS limit, pressure drop well within budget — **PASS**

### 8.3 Example 3: Heat Loss Calculation for Equipment Sizing (Journeyman Exam Level)

**Given:** A 1,800 square foot single-story PNW home (Climate Zone 4C). Envelope characteristics: R-21 walls, R-49 ceiling, double-pane low-E windows (U-0.30), design outdoor temperature 25 degrees F, indoor design temperature 68 degrees F. Wall area: 1,200 sq ft (net after windows). Window area: 200 sq ft. Ceiling area: 1,800 sq ft. Infiltration: 0.35 ACH natural, 8-foot ceiling height.

**Find:** Design heating load (BTU/h) for equipment sizing.

**Code reference:** ACCA Manual J methodology; OEESC 2025/WSEC-R 2021 for envelope values [STD-07, STD-15]

**Solution:**

Step 1: Temperature difference (Delta-T).
- Delta-T = 68 - 25 = 43 degrees F

Step 2: Transmission heat loss through each component.
- Walls: Q = (Area / R-value) x Delta-T = (1,200 / 21) x 43 = 2,457 BTU/h
- Ceiling: Q = (1,800 / 49) x 43 = 1,579 BTU/h
- Windows: Q = Area x U-factor x Delta-T = 200 x 0.30 x 43 = 2,580 BTU/h
- **Transmission subtotal: 6,616 BTU/h**

Step 3: Infiltration heat loss.
- Volume = 1,800 sq ft x 8 ft = 14,400 cu ft
- Infiltration CFM = (14,400 x 0.35) / 60 = 84 CFM
- Q_infiltration = 1.08 x CFM x Delta-T = 1.08 x 84 x 43 = 3,903 BTU/h

Step 4: Total design heat loss.
- **Total = 6,616 + 3,903 = 10,519 BTU/h**

Step 5: Apply safety factor (10% for duct losses and construction variability).
- **Design load = 10,519 x 1.10 = 11,571 BTU/h (approximately 12,000 BTU/h or 1.0 ton)**

**Result:** A 1-ton (12,000 BTU/h) heat pump or furnace is adequate for this well-insulated PNW home.

**Discussion:** This calculation illustrates why PNW homes with modern envelope standards have very low heating loads. A single ductless mini-split head rated at 12,000–15,000 BTU/h could heat this entire house. This is why oversizing is the most common equipment selection error in the PNW — oversized equipment short-cycles, reducing comfort, increasing energy use, and shortening equipment life.

---

## 9. L4 — Contractor Reference: Code Compliance and Inspection

### 9.1 Code Compliance Checklist — Plumbing

#### Pre-Construction

- [ ] Plumbing permit obtained from local jurisdiction — [STD-04, STD-14]
- [ ] Plans submitted and approved (if required by scope) — [GOV-01, GOV-02]
- [ ] Backflow preventer type approved for hazard level — [GOV-09]
- [ ] Water heater seismic strapping specified — [CODE-03, CODE-04]

> **GATE — Verify Before Proceeding**
>
> Before beginning plumbing rough-in:
> - [ ] Confirm building structural framing is complete and inspected (if applicable)
> - [ ] Verify maximum hole and notch sizes for structural members with the framing plan (see [M1-ST:Framing Penetrations])
> - [ ] Confirm water service and sewer connection locations match approved plans
>
> **If any item cannot be confirmed:** Do not proceed with rough-in. Coordinate with general contractor and structural engineer if penetration locations conflict with structural requirements [CODE-03, CODE-01].

#### Rough-In Inspection

- [ ] All DWV piping installed per approved plans — [CODE-03]
- [ ] DWV piping slopes verified (1/4" per foot for 3" and smaller; 1/8" per foot for 4" and larger) — [CODE-03, UPC Chapter 7]
- [ ] Cleanouts installed at required locations — [CODE-03, UPC Section 707]
- [ ] Vent terminations minimum 6 inches above finished roof; minimum 10 feet from any air intake — [CODE-03, UPC Section 906]
- [ ] Water supply piping: pressure test passed (minimum 80 PSI for 15 minutes with no pressure loss, or per local amendment) — [CODE-03]
- [ ] DWV piping: test passed (water test to height of 10 feet above highest fitting, or air test at 5 PSI for 15 minutes) — [CODE-03]
- [ ] Water heater seismic straps installed — [CODE-03, CODE-04]
- [ ] TPR valve discharge piped to within 6 inches of floor or approved drain — [CODE-03]
- [ ] Expansion tank installed (if closed system) — [CODE-03]
- [ ] Trap arm lengths within maximum per table — [CODE-03, UPC Table 1002.2]
- [ ] No S-traps — [CODE-03, UPC Section 1002.2]
- [ ] Nail plates installed where piping is within 1-1/2 inches of stud edge — [CODE-01, IRC Section R602.6]

#### Final Inspection

- [ ] All fixtures installed and operational — [CODE-03]
- [ ] No visible leaks at any connection — [CODE-03]
- [ ] Hot water delivered to all hot-water fixtures — [CODE-03]
- [ ] Backflow preventer installed and tagged/tested (where required) — [GOV-09]
- [ ] Fixture flow rates within code limits — [CODE-03, STD-14]
- [ ] Dishwasher air gap or high loop installed — [CODE-03]
- [ ] Garbage disposer properly connected; dishwasher knockout removed if applicable — [CODE-03]

### 9.2 Code Compliance Checklist — Mechanical (HVAC)

#### Rough-In Inspection

- [ ] Ductwork installed per approved plans — [STD-05, STD-11]
- [ ] Duct insulation minimum R-8 in unconditioned spaces — [STD-07, STD-15]
- [ ] Combustion air provided per IFGC/IMC (gas equipment) — [CODE-01]
- [ ] Refrigerant line sets sized per manufacturer; insulated — [STD-05, STD-11]
- [ ] Condensate drain piped with trap and proper slope — [STD-05, STD-11]
- [ ] Exhaust fan ducts terminate to outdoors (not to attic, soffit, or crawlspace) — [STD-05, STD-11]
- [ ] Makeup air system installed for range hoods >400 CFM — [CODE-01]

#### Final Inspection

- [ ] Equipment operational; thermostat responsive — [STD-05, STD-11]
- [ ] Duct leakage test passed (if required by energy code) — [STD-07, STD-15]
- [ ] Whole-house ventilation system operational — [STD-07, STD-15]
- [ ] Equipment disconnect within sight of unit — [CODE-02]
- [ ] Filter accessible without tools — [STD-05, STD-11]
- [ ] Carbon monoxide detectors installed per IRC R315 (every level, within 15 feet of sleeping areas) — [STD-02, STD-10]
- [ ] Refrigerant charge per manufacturer (subcooling/superheat) — [STD-05, STD-11]

### 9.3 State-Specific Requirements

| Requirement | Oregon | Washington | Code Reference |
|---|---|---|---|
| Plumbing code base | OPSC 2023 (UPC 2021 + OR amendments) | WAC 51-56 (UPC 2021 + WA amendments) | STD-04, STD-14 |
| UPC Chapters 12, 14 adoption | Adopted | NOT adopted | STD-14 |
| UPC Chapter 5 (combustion air) adoption | Adopted | NOT adopted | STD-14 |
| Backflow tester certification | State plumbing board certification | DOH BAT certification per WAC 246-292 | GOV-01, GOV-09 |
| Mechanical code base | OMSC 2022 (IMC + OR amendments) | WAC 51-52 (IMC + WA amendments) | STD-05, STD-11 |
| Lavatory flow limit | Per UPC base (2.2 GPM) | 1.2 GPM residential; 0.5 GPM public-use | STD-14 |
| Energy code affecting mechanical | OEESC 2025 (effective Jul 2025) | WSEC-R 2021 (effective Mar 2024) | STD-07, STD-15 |
| Contractor licensing | CCB license required | L&I contractor registration required | GOV-06, GOV-08 |

### 9.4 Estimating Framework

#### Unit Cost Table (PNW Metro, Q1 2026)

| Work Item | Unit | Material Cost | Labor Hours | Labor Cost | Total/Unit | Notes |
|---|---|---|---|---|---|---|
| 3" ABS DWV pipe | Per linear foot | $3–$5 | 0.15 | $12–$18 | $15–$23 | Including fittings allowance |
| 4" ABS DWV pipe | Per linear foot | $5–$8 | 0.18 | $14–$22 | $19–$30 | Including fittings allowance |
| 3/4" PEX supply | Per linear foot | $1–$2 | 0.08 | $6–$10 | $7–$12 | Crimp or expansion fittings |
| 3/4" copper Type L supply | Per linear foot | $4–$7 | 0.20 | $16–$24 | $20–$31 | Soldered joints |
| Bathroom rough-in (complete) | Per bathroom | $800–$1,500 | 12–20 | $960–$2,400 | $1,760–$3,900 | DWV + supply + vent |
| Kitchen rough-in (complete) | Per kitchen | $600–$1,200 | 8–14 | $640–$1,680 | $1,240–$2,880 | DWV + supply + gas if applicable |
| Water heater install (tank, 50 gal) | Each | $600–$1,200 | 4–6 | $320–$720 | $920–$1,920 | Including seismic strapping |
| Water heater install (tankless) | Each | $1,200–$2,500 | 6–10 | $480–$1,200 | $1,680–$3,700 | Including venting modifications |
| Heat pump water heater install | Each | $1,800–$3,000 | 6–10 | $480–$1,200 | $2,280–$4,200 | Including condensate drain, electrical |
| Mini-split heat pump (single zone) | Each | $2,000–$4,000 | 8–12 | $640–$1,440 | $2,640–$5,440 | Including line set, electrical, pad |
| Whole-house repipe (PEX, 2-bath) | Per house | $3,000–$6,000 | 20–32 | $1,600–$3,840 | $4,600–$9,840 | Manifold system |
| Sewer line replacement (30 ft) | Per project | $2,000–$4,000 | 16–24 | $1,280–$2,880 | $3,280–$6,880 | Traditional excavation |
| Sewer line — trenchless liner | Per project | $4,000–$8,000 | 8–12 | $640–$1,440 | $4,640–$9,440 | CIPP or pipe bursting |

**Cost basis:** PNW metro area (Portland/Seattle), journeyman plumber/HVAC tech rate $80–$120/hr fully burdened, Q1 2026. Adjust for:
- Rural areas: -10% to -20% labor
- High-complexity retrofit: +25% to +50% labor
- Occupied building: +15% to +25% labor
- PNW rain season access: +10% for exterior work

#### Labor Productivity Factors

| Condition | Factor | Example |
|---|---|---|
| Ideal — new construction, open access | 1.00 | Rough-in before drywall |
| Finished space — patch and repair | 1.40 | Remodel with drywall removal/replacement |
| Occupied building | 1.25 | Homeowner present, furniture protection |
| Crawlspace work | 1.50 | PNW crawlspace access (tight, wet, cold) |
| Attic work (summer) | 1.30 | Heat, limited headroom |
| Weather exposure | 1.15 | PNW rain season exterior work |
| Height premium (above 8 feet) | 1.20 | Scaffolding or ladder work |

### 9.5 Common Inspection Rejection Reasons

| Rejection | Code Basis | Fix | Time Impact |
|---|---|---|---|
| Missing cleanouts | UPC Section 707 | Install cleanouts at required locations | 2–4 hours + re-inspection |
| Improper slope (DWV too flat or too steep) | UPC Chapter 7 | Regrade piping; may require re-routing | 4–8 hours + re-inspection |
| Failed pressure test (supply) | UPC Chapter 6 | Find and repair leak; retest | 2–6 hours + re-inspection |
| Missing/incorrect backflow preventer | UPC; WAC 246-292 | Install correct device for hazard level | 2–4 hours + re-inspection |
| S-trap installed | UPC Section 1002.2 | Replace with P-trap and proper vent | 2–4 hours + re-inspection |
| Missing water heater seismic straps | UPC Section 510; ASCE 7 | Install straps | 1 hour + re-inspection |
| TPR discharge not properly piped | UPC | Pipe to within 6" of floor or approved drain | 1–2 hours + re-inspection |
| Exhaust fan ducted to attic (not outdoors) | IMC Section 501 | Extend duct to exterior termination | 2–4 hours + re-inspection |
| Duct leakage test failure | OEESC/WSEC | Seal duct joints with mastic; retest | 4–8 hours + re-inspection |
| Missing nail plates (piping near stud edge) | IRC Section R602.6 | Install steel nail plates | 1–2 hours + re-inspection |

---

## 10. L5 — Engineering Reference: Design Theory and Calculation Procedures

### 10.1 Governing Equations

#### 10.1.1 Manning's Equation (Gravity Drainage Flow)

$$Q = \frac{1.486}{n} \times A \times R_h^{2/3} \times S^{1/2}$$

Where:
- Q = flow rate (cubic feet per second)
- n = Manning's roughness coefficient (dimensionless): ABS/PVC = 0.009; cast iron = 0.013; concrete = 0.013
- A = cross-sectional area of flow (square feet)
- R_h = hydraulic radius = A / wetted perimeter (feet)
- S = slope of pipe (feet per foot)

**Applicability:** Gravity drainage systems (DWV). Assumes steady-state, uniform flow. UPC pipe sizing tables are derived from Manning's equation at specified fill fractions (typically 1/2 full for horizontal drains) [CODE-03].

#### 10.1.2 Hazen-Williams Equation (Pressure Supply Flow)

$$Q = 0.2083 \times C \times d^{2.63} \times \left(\frac{\Delta P}{100}\right)^{0.54}$$

Where:
- Q = flow rate (GPM)
- C = Hazen-Williams friction coefficient: copper = 140; PEX = 150; galvanized steel = 120
- d = internal pipe diameter (inches)
- Delta-P = pressure loss per 100 feet (PSI per 100 ft)

**Applicability:** Pressurized water supply systems. Valid for water at normal building temperatures (40-140 degrees F). Used for water supply pipe sizing per UPC Chapter 6 [CODE-03].

#### 10.1.3 Heat Load Calculation (ACCA Manual J, Simplified)

$$Q_{total} = Q_{transmission} + Q_{infiltration}$$

$$Q_{transmission} = \sum \left(\frac{A_i}{R_i}\right) \times \Delta T$$

$$Q_{infiltration} = 1.08 \times \dot{V}_{inf} \times \Delta T$$

Where:
- Q_total = total design heat loss (BTU/h)
- A_i = area of envelope component i (square feet)
- R_i = thermal resistance of component i (hr-ft^2-F/BTU)
- Delta-T = indoor - outdoor design temperature (degrees F)
- V_inf = infiltration air volume flow rate (CFM)
- 1.08 = specific heat of air x density x 60 min/hr (BTU/hr-CFM-F)

**Applicability:** Residential heating load for equipment sizing. Full ACCA Manual J calculation includes solar gain, internal gains, duct losses, and latent loads [STD-07, STD-15].

### 10.2 Design Tables

#### 10.2.1 DWV Pipe Capacity Summary

| Pipe Diameter (in) | Slope 1/4"/ft — Capacity (GPM) | Slope 1/8"/ft — Capacity (GPM) | Manning's n = 0.009 | Half-Full Flow |
|---|---|---|---|---|
| 1-1/2 | 6.3 | 4.5 | ABS/PVC | Yes |
| 2 | 13.5 | 9.5 | ABS/PVC | Yes |
| 3 | 41.0 | 29.0 | ABS/PVC | Yes |
| 4 | 88.0 | 62.0 | ABS/PVC | Yes |

**Assumptions:** ABS or PVC pipe (n = 0.009); half-full flow condition; straight pipe run (no fitting losses).

#### 10.2.2 PEX Supply Pipe Sizing Reference

| PEX Size (nominal) | ID (inches) | Max Flow at 5 FPS (GPM) | Max Flow at 8 FPS (GPM) | Friction Loss at 5 FPS (PSI/100ft) |
|---|---|---|---|---|
| 3/8" | 0.350 | 1.5 | 2.4 | 18.2 |
| 1/2" | 0.475 | 2.7 | 4.4 | 11.5 |
| 3/4" | 0.681 | 5.6 | 8.9 | 5.8 |
| 1" | 0.862 | 9.0 | 14.3 | 3.4 |

**Assumptions:** PEX-A tubing; C = 150 (Hazen-Williams); water at 60 degrees F.

### 10.3 ABET Competency Mapping

| ABET Student Outcome | This Document Addresses | Assessment Method |
|---|---|---|
| SO 1: Complex problem solving | DWV sizing, water supply design, heat load calculation | Calculation problems (Examples 8.1–8.3) |
| SO 2: Engineering design | System design applying codes, standards, and constraints | Design project: residential MEP system |
| SO 3: Communication | Technical writing of design calculations and code analysis | Design report with code compliance narrative |
| SO 4: Professional responsibility | Safety callouts (BLOCK/GATE), licensing requirements, code of ethics | Case study: consequences of improper gas/venting work |
| SO 5: Teamwork | MEP coordination between plumbing, mechanical, electrical, structural | Multi-discipline design project |
| SO 6: Experimentation | Pressure testing, duct leakage testing, flow measurement | Laboratory exercises |
| SO 7: Lifelong learning | Code cycle updates, emerging technology (heat pumps, HPWH) | Code comparison assignment (previous vs. current cycle) |

### 10.4 PE Exam Preparation

#### Problem 1

**Exam section:** Mechanical systems — plumbing
**Difficulty:** Morning session
**Time target:** 6 minutes

A two-story residential building has the following DWV fixture load on a single vertical stack: first floor — 2 water closets (4 DFU each), 2 lavatories (1 DFU each), 1 bathtub (2 DFU); second floor — 1 water closet (4 DFU), 1 lavatory (1 DFU), 1 shower (2 DFU). What is the minimum stack size?

<details>
<summary>Solution</summary>

Total DFU: First floor = 8 + 2 + 2 = 12 DFU. Second floor = 4 + 1 + 2 = 7 DFU. Total = 19 DFU.

Per UPC 2021 Table 703.2, a 3-inch soil stack can handle up to 48 DFU for a building drain (and 30 DFU for a branch interval of the stack). 19 DFU is within the 3-inch stack capacity.

However, verify: the stack serves water closets, which require a minimum 3-inch connection. A 3-inch stack is both the minimum for water closet service and adequate for the 19 DFU total load.

**Answer:** 3-inch stack.

**Key takeaway:** Stack sizing considers both the fixture unit total AND the minimum size required by the largest fixture connection. Even if the DFU load were lower, the water closet would still mandate a 3-inch minimum [CODE-03].

</details>

#### Problem 2

**Exam section:** Mechanical systems — HVAC
**Difficulty:** Afternoon depth
**Time target:** 10 minutes

A 2,400 sq ft residence in Climate Zone 4C (PNW) has a design heating load of 24,000 BTU/h. The homeowner wants to install an air-source heat pump. The design outdoor temperature is 28 degrees F. The heat pump has a rated heating capacity of 30,000 BTU/h at 47 degrees F and 18,000 BTU/h at 17 degrees F. Using linear interpolation, determine: (a) the heat pump capacity at 28 degrees F, and (b) whether supplemental heat is required.

<details>
<summary>Solution</summary>

(a) Linear interpolation between the two rating points:

Capacity at 47F = 30,000 BTU/h
Capacity at 17F = 18,000 BTU/h
Slope = (30,000 - 18,000) / (47 - 17) = 12,000 / 30 = 400 BTU/h per degree F

Capacity at 28F = 18,000 + 400 x (28 - 17) = 18,000 + 4,400 = 22,400 BTU/h

(b) Design load = 24,000 BTU/h. Heat pump capacity at design temperature = 22,400 BTU/h.

Deficit = 24,000 - 22,400 = 1,600 BTU/h

**Answer:** (a) 22,400 BTU/h at 28 degrees F. (b) Yes, supplemental heat of approximately 1,600 BTU/h is required at the design outdoor temperature. This could be provided by a small electric resistance backup strip (0.47 kW) in the air handler, which is standard practice for PNW heat pump installations.

**Key takeaway:** Heat pump capacity decreases as outdoor temperature drops. In PNW Climate Zone 4C, the design temperature is mild enough that the deficit is small and economically served by resistance backup rather than a dual-fuel (gas) system [STD-15, GOV-07].

</details>

---

## 11. Sequencing and Coordination

### 11.1 Construction Sequence — Where Plumbing/Mechanical Fits

| Phase | Predecessor Trade | Plumbing/Mechanical Work | Successor Trade | Duration (Typical Residential) |
|---|---|---|---|---|
| Underground rough-in | Excavation/foundation | Underslab DWV piping, water service entry | Concrete (slab pour) | 1–2 days |
| Top-out / rough-in | Framing complete | All DWV, supply, vent piping; HVAC ductwork; equipment setting | Insulation (after inspection) | 3–5 days (residential) |
| Rough-in inspection | Plumbing/mechanical complete | Pressure test, visual inspection | Insulation and drywall (after pass) | 1 day (inspection) |
| Trim / finish | Paint complete | Fixture installation, appliance connection, equipment startup | Final inspection | 2–3 days |
| Final inspection | Trim complete | All systems operational, tested, compliant | Occupancy | 1 day (inspection) |

### 11.2 Scheduling Considerations — PNW

- **Weather:** Underground work in PNW winter requires dewatering plans. Saturated soils are the norm November through March.
- **Permit processing:** Oregon (Portland metro) — 2 to 4 weeks for residential plumbing permits. Washington (Seattle metro) — 2 to 6 weeks. Plan review adds 2 to 4 weeks if required.
- **Inspection scheduling:** Most PNW jurisdictions offer next-business-day inspections for residential. Same-day may be available with advance scheduling.
- **Material lead times:** Standard materials (ABS, PEX, copper, ductwork) — generally in stock. Specialty items (tankless water heaters, specific heat pump models, HRV units) — 1 to 4 weeks. Equipment shortages are less common than during 2021-2023 supply chain disruptions but still occur seasonally.

---

## 12. Sources

All claims in this document are traceable to the following source IDs from `00-source-index.md`:

| Source ID | Name | Application in This Document |
|---|---|---|
| CODE-01 | International Code Council (ICC) | IMC, IFGC, IRC structural penetration rules |
| CODE-02 | NFPA | NEC references for MEP coordination |
| CODE-03 | IAPMO (UPC 2021) | Primary plumbing code — DWV, supply, venting, fixtures |
| CODE-04 | ASCE | ASCE 7-22 seismic requirements for mechanical equipment |
| CODE-05 | ANSI | Accreditation authority for UPC development process |
| GOV-01 | Oregon BCD | Oregon code administration, OPSC, OMSC |
| GOV-02 | Washington SBCC | Washington code administration, WAC 51-52, WAC 51-56 |
| GOV-07 | WSU Energy Program | Technical guidance for energy code, heat pump adoption |
| GOV-09 | Washington DOH | BAT certification, backflow prevention (WAC 246-292) |
| STD-02 | Oregon Residential Specialty Code (ORSC) 2023 | IRC adoption for structural penetrations, CO detectors |
| STD-04 | Oregon Plumbing Specialty Code (OPSC) 2023 | Oregon plumbing code (UPC 2021 + OR amendments) |
| STD-05 | Oregon Mechanical Specialty Code (OMSC) 2022 | Oregon mechanical code (IMC + OR amendments) |
| STD-07 | Oregon Energy Efficiency Specialty Code (OEESC) 2025 | Envelope values, duct insulation, HPWH requirements |
| STD-10 | Washington IRC (WAC 51-51) | IRC adoption for structural penetrations, CO detectors |
| STD-11 | Washington Mechanical Code (WAC 51-52) | Washington mechanical code (IMC + WA amendments) |
| STD-14 | Washington Plumbing Code (WAC 51-56) | Washington plumbing code (UPC 2021 + WA amendments) |
| STD-15 | Washington Energy Code (WSEC-R 2021) | Energy code affecting HVAC and water heating |

---

## 13. Verification Summary

| Category | Count | Status |
|---|---|---|
| Source attributions | 17 unique source IDs | All traceable to 00-source-index.md |
| BLOCK safety callouts | 4 (gas system x2, gas leak emergency, gas venting) | All specify licensed professional, code basis |
| GATE safety callouts | 3 (backflow testing, range hood makeup air, rough-in pre-check) | All include verification checklist |
| Cross-references to M1 (Structural) | 4 (seismic strapping, framing penetrations, equipment anchorage, seismic detailing) | Linked to [M1-ST:section] |
| Cross-references to M2 (Electrical) | 6 (service sizing, HVAC circuits, kitchen circuits, GFCI, bathroom circuits, ventilation) | Linked to [M2-EL:section] |
| Audience levels covered | L1 (homeowner), L2 (DIY), L3 (trade student), L4 (contractor), L5 (engineer) | All sections labeled |
| Worked calculation examples | 3 (DWV sizing, supply sizing, heat loss) | Increasing complexity per template |
| PE exam practice problems | 2 (plumbing morning, HVAC afternoon) | With solutions and key takeaways |
| State-specific comparisons (OR vs WA) | 7 requirement rows | All with code references |
| Estimating data | 12 line items with date-stamped costs | PNW metro, Q1 2026 |

**Safety Test Coverage:**
- **SC-GAS (BLOCK):** All gas system content specifies licensed-professional-only. Zero DIY gas procedures. PASS.
- **SC-PER (GATE):** Plumbing permits flagged at checklist entry. PASS.
- **SC-SRC (Source Quality):** All 17 sources traceable to IAPMO, ICC, ASCE, state agencies, or ANSI-accredited standards. Zero entertainment media or blogs. PASS.
- **SC-NUM (Numerical Attribution):** All fixture unit values, pipe sizes, flow rates, R-values, and cost figures attributed to specific source with edition year. PASS.

---

*Module M3-PM compiled: 2026-03-08*
*Primary codes: UPC 2021 (CODE-03), IMC 2021 (CODE-01), IFGC 2021 (CODE-01)*
*State adoptions: OPSC 2023 (STD-04), WAC 51-56 (STD-14), OMSC 2022 (STD-05), WAC 51-52 (STD-11)*
*Verification method: Cross-referenced against 00-source-index.md, 00-content-templates.md, and 00-parameter-schema.md*
