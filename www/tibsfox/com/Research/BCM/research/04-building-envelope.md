# Building Envelope & Weatherproofing — Technical Deep-Dive

---
module: M4-BE
dimensions: [TD, BS, LP, AD, RS]
audience: L1-L5
content_type: deep-dive
last_updated: 2026-03-08
version: 1.0
status: draft
---

> **Abstract:** The building envelope is the single most critical system for long-term durability in the Pacific Northwest's marine climate. This module provides comprehensive coverage of rain screen wall assemblies, weather-resistive barriers, roofing systems, wall cladding, insulation, window and door installation, energy code compliance, and wildfire-urban interface requirements for Oregon and Washington. Content spans all five audience levels (L1 through L5) and addresses both Climate Zone 4C (western/marine) and 5B (eastern/dry). Every specification references current Oregon and Washington code editions with effective dates, and every cost estimate is date-stamped to Q1 2026 PNW metro pricing.

---

## Table of Contents

1. [Introduction and PNW Context](#1-introduction-and-pnw-context)
2. [Moisture Physics and Building Science](#2-moisture-physics-and-building-science)
3. [Rain Screen Wall Assemblies](#3-rain-screen-wall-assemblies)
4. [Weather-Resistive Barriers (WRB)](#4-weather-resistive-barriers-wrb)
5. [Roofing Systems](#5-roofing-systems)
6. [Wall Cladding Systems](#6-wall-cladding-systems)
7. [Insulation Systems](#7-insulation-systems)
8. [Energy Code Compliance](#8-energy-code-compliance)
9. [Window and Door Installation](#9-window-and-door-installation)
10. [Wildfire-Urban Interface (WUI) Requirements](#10-wildfire-urban-interface-wui-requirements)
11. [Inspection and Quality Control](#11-inspection-and-quality-control)
12. [Estimating and Project Management](#12-estimating-and-project-management)
13. [Diagnostics: Envelope Failure Identification](#13-diagnostics-envelope-failure-identification)
14. [Sources](#14-sources)

---

## 1. Introduction and PNW Context

### 1.1 What Is the Building Envelope?

#### L1 View — What Every Homeowner Should Know

Think of your house as wearing a raincoat. The building envelope is that raincoat — everything that separates inside from outside. It includes your roof, walls, windows, doors, and foundation. When the raincoat has holes or worn spots, water gets in, and water is the number one enemy of houses in the Pacific Northwest.

Portland receives roughly 37 inches of rain per year. Seattle gets about 37 inches as well, but some areas of the western Cascades see 80-120 inches annually. Your home's envelope must handle all of that rain, plus wind, cold, heat, and — in parts of Oregon and Washington — wildfire embers [GOV-01; GOV-02].

#### L3 View — Trade Student Reference

The building envelope is a multi-component environmental separator that manages four transport mechanisms simultaneously: heat, air, moisture (liquid and vapor), and light. In envelope science, these four flows are called the "control layers," and a well-designed envelope addresses each one with a dedicated material or assembly strategy [PRO-05]:

1. **Thermal control layer** — insulation (R-value)
2. **Air control layer** — air barrier (tested per ASTM E2357 or equivalent)
3. **Moisture control layer** — WRB (liquid water) + vapor retarder (water vapor)
4. **Radiation control layer** — glazing (SHGC, U-factor, VT)

Each control layer must be continuous, connected, and compatible with adjacent layers. Gaps, discontinuities, or incompatible materials create failure points — and in the PNW marine climate, failure points become moisture entry points within a single rain season.

#### L5 View — Engineering Reference

The building envelope functions as a hygrothermal boundary condition for the occupied space. Performance analysis requires coupled heat-air-moisture (HAM) transport modeling, typically using tools such as WUFI or DELPHIN. The governing equations couple Fourier's law (heat conduction), Fick's law (vapor diffusion), and Darcy's law (liquid transport through porous media) under transient boundary conditions derived from TMY3 climate data for the specific PNW microclimate zone.

The critical design parameter in the PNW is the moisture balance equation: the rate of moisture entry must never exceed the rate of moisture removal (drainage + evaporation + diffusion drying) at any point in the assembly over the full annual cycle. The BC "leaky condo crisis" of the 1990s demonstrated the catastrophic structural, financial, and health consequences when this balance is violated — estimated at $4 billion CAD in damages across approximately 900 buildings in the Vancouver metro area alone [PRO-05].

> **PNW Regional Note:**
> The Pacific Northwest marine climate (IECC Climate Zone 4C) creates a unique moisture management challenge: mild winters with sustained rainfall (not intense thunderstorms), limited solar drying potential from November through March, and relatively low indoor-outdoor temperature differentials that reduce vapor drive. This combination means assemblies must rely primarily on drainage and ventilation drying rather than diffusion drying — making rain screen design and WRB drainage efficiency the dominant performance factors.
>
> *Applies to: Both OR and WA (western regions)*

### 1.2 Applicable Codes and Standards

| Code/Standard | Edition | Sections | Applicability | Source ID |
|---------------|---------|----------|--------------|-----------|
| IRC 2021 | 2021 | R703 (Wall Covering), R802-R905 (Roof), R402 (Thermal Envelope) | OR (via ORSC 2023), WA (via WAC 51-51) | CODE-01, STD-02, STD-10 |
| OEESC 2025 | 2025 | Envelope provisions, ASHRAE 90.1-2022 base | OR effective Jan 1, 2025; mandatory Jul 1, 2025 | STD-07, STD-21 |
| WSEC-R 2021 | 2021 | Envelope provisions | WA effective Mar 15, 2024 | STD-15 |
| ORSC R327 | 2025 | WUI residential provisions | OR effective Aug 5, 2025 | STD-08 |
| WAC 51-55 (IWUIC) | 2021 | WUI provisions | WA effective Mar 15, 2024 | STD-13 |
| ASTM E2273 | Current | Drainage efficiency test standard | Both OR and WA | STD-18 |
| ASHRAE 90.1-2022 | 2022 | Energy standard (non-residential + OEESC base) | OR base for OEESC | STD-21 |

### 1.3 Scope and Limitations

This module covers residential and light commercial building envelope systems as practiced in the PNW. It addresses:

- **Climate Zones:** 4C (western Oregon and Washington, marine) and 5B (eastern Oregon and Washington, dry)
- **Building Scale:** One- and two-family dwellings (IRC scope), townhouses, and small commercial (IBC Chapter 7)
- **Lifecycle Phases:** New construction, renovation/retrofit, and maintenance
- **Exclusions:** Curtain wall engineering (high-rise commercial), below-grade waterproofing (see [M1-ST:Foundation Systems]), and HVAC system design (see [M3-PM:Mechanical Systems])

---

## 2. Moisture Physics and Building Science

### 2.1 The Five Forces Driving Rain Into Buildings

Water penetration through wall assemblies is driven by five distinct physical mechanisms. A well-designed envelope must address all five [PRO-05]:

| Force | Mechanism | How It Works | Envelope Response |
|-------|-----------|-------------|------------------|
| **Kinetic energy** | Raindrop momentum | Wind-driven rain hits the wall surface at velocity, carrying water into openings | Deflection — exterior cladding as rain screen |
| **Gravity** | Downward water flow | Water runs down surfaces and enters any gap that opens downward | Flashing — direct water outward at every horizontal transition |
| **Capillary action** | Surface tension in narrow gaps | Water wicks through gaps narrower than ~1/4 inch (6 mm) against gravity | Capillary break — maintain air space > 3/8 inch (10 mm) |
| **Surface tension** | Water film adhesion | Water flows along the underside of surfaces and around corners | Drip edges — force water to detach before reaching vulnerable joints |
| **Pressure differential** | Air pressure gradient | Higher pressure outside pushes water through any opening with lower pressure behind it | Pressure equalization — ventilated rain screen cavity |

#### L1 — Why This Matters for Your Home

Imagine water trying every possible trick to get inside your walls. It pushes (wind), drips (gravity), wicks (like a paper towel soaking up a spill), clings (surface tension), and gets sucked in by air pressure differences. A good wall system blocks all five of these at once. A wall that only stops one or two of them will eventually leak.

#### L3 — Theory Foundation

The dominant moisture load in the PNW marine climate is wind-driven rain (WDR). WDR intensity depends on rain rate, wind speed, wind direction, and building geometry. The Rain Exposure Factor (RE) combines these variables. ASHRAE Standard 160 provides WDR calculation methods for hygrothermal analysis. PNW western exposures (facing prevailing southwest winter storms) receive the highest WDR loads — often 3-5x the rainfall measured at a horizontal rain gauge [STD-21].

The critical insight for PNW practice: diffusion drying (relying on vapor pressure differences to move moisture out of the assembly) is extremely slow in the marine climate because the indoor-outdoor temperature differential is small (typically 20-30 degrees F in winter, versus 50-70 degrees F in cold continental climates). This means drainage and ventilation drying must do the heavy lifting. Assemblies that work perfectly well in Minneapolis or Chicago can fail catastrophically in Portland or Vancouver BC — not because of more rain, but because of less drying.

### 2.2 Dew Point Analysis and Condensation Risk

#### L5 — Engineering Reference

Condensation within envelope assemblies occurs when the actual vapor pressure at any point within the assembly exceeds the saturation vapor pressure at that point's temperature. The temperature profile through the assembly is determined by the thermal resistance (R-value) distribution of each layer.

**Governing relationship:**

The saturation vapor pressure as a function of temperature (Magnus-Tetens approximation):

$$
e_s(T) = 6.1078 \times 10^{(7.5T)/(237.3+T)}
$$

Where:
- e_s = saturation vapor pressure (hPa)
- T = temperature (degrees C)

**Design implication for PNW Climate Zone 4C:**

With mild winter exterior temperatures (typical January mean: 40 degrees F / 4.4 degrees C in Portland), the dew point within the assembly often falls within the insulation layer rather than at the exterior sheathing face. This reduces — but does not eliminate — condensation risk. The primary risk occurs during diurnal temperature swings and during spring "inversion" events when cold nights follow warm days, driving inward vapor transport (solar-driven moisture) through cladding into cooler wall cavities.

For Climate Zone 5B (eastern Oregon/Washington), winter conditions are more severe (January mean: 25-30 degrees F / -4 to -1 degrees C), and classical wintertime condensation on cold sheathing is the dominant concern. Exterior continuous insulation shifts the condensation plane outboard of the structural sheathing, which is why energy codes increasingly require exterior ci in this zone [STD-07; STD-15].

### 2.3 Vapor Retarder Strategy

| Climate Zone | Vapor Retarder Class | Typical Material | Code Basis | Rationale |
|-------------|---------------------|-----------------|-----------|-----------|
| 4C (marine) | Class III (latex paint) | Standard latex interior paint (~5 perms) | IRC 2021 Table R702.7.1 [CODE-01] | Assembly dries in both directions; avoid trapping moisture |
| 5B (dry) | Class II or III | Kraft-faced batts (~1 perm) or latex paint | IRC 2021 Table R702.7.1 [CODE-01] | Low exterior moisture load; moderate inward drying needed |

> **GATE — Verify Before Proceeding**
>
> Before specifying a vapor retarder strategy:
> - [ ] Confirm the project climate zone (4C vs. 5B) using IECC Figure R301.1
> - [ ] Verify whether exterior continuous insulation is part of the assembly (changes condensation plane location)
> - [ ] If the assembly includes closed-cell spray foam, the foam itself may serve as the vapor retarder — do not add a separate Class I retarder (polyethylene) on the interior
>
> **If any item cannot be confirmed:** Perform WUFI hygrothermal analysis for the specific assembly [STD-21]

> **PNW Regional Note:**
> Do NOT use polyethylene sheeting (6-mil poly, Class I vapor barrier) on the interior of wall assemblies in Climate Zone 4C. This practice, common in Canadian cold-climate construction, traps moisture in the PNW marine climate and has been directly implicated in numerous envelope failures. The mild PNW winter does not produce enough outward vapor drive to justify a Class I interior vapor barrier — and solar-driven inward vapor transport in spring and summer cannot dry through polyethylene.
>
> *Applies to: Both OR and WA (Climate Zone 4C)*

---

## 3. Rain Screen Wall Assemblies

### 3.1 The BC Leaky Condo Crisis — Why Rain Screens Matter

> **BLOCK — Licensed Professional Required**
>
> If your home was built between 1982 and 1999 with face-sealed stucco or EIFS (Exterior Insulation and Finish System) without a drainage cavity, you may have a building envelope at high risk of concealed moisture damage. Remediation of these assemblies requires a licensed building envelope consultant and contractor.
>
> **Required professional:** Building envelope consultant (licensed engineer or architect with envelope specialization)
> **Why:** Concealed moisture damage may affect structural framing, create health hazards (mold), and require comprehensive re-cladding
> **Code basis:** ORSC 2023 R703.1, IRC 2021 R703.1 [CODE-01; STD-02]

In the late 1990s, British Columbia experienced a building envelope crisis that became known as the "leaky condo crisis." Approximately 900 multi-unit residential buildings in the Vancouver metro area — many built between 1982 and 1999 — suffered catastrophic moisture damage behind face-sealed stucco and EIFS cladding. The damage was estimated at $4 billion CAD and affected tens of thousands of homeowners [PRO-05].

The root cause was simple but devastating: wall assemblies designed for dry climates were used in a marine rain climate without provision for drainage behind the cladding. When the inevitable small leaks occurred at joints, penetrations, and window-wall interfaces, there was no path for water to drain out and no air space to promote drying. Water accumulated behind the cladding, saturated the sheathing, and rotted the wood framing — sometimes within 5-7 years of construction.

The lesson was clear: **in a marine climate, the wall must be designed to manage water that gets past the cladding, not just try to keep all water out.** This is the fundamental principle of rain screen design.

### 3.2 Rain Screen Principles

A rain screen wall assembly separates the cladding (the "screen" that deflects most rain) from the structural wall with a continuous air space that serves three functions:

1. **Drainage plane** — liquid water that penetrates the cladding drains down the air cavity and exits at the base through weep holes or an open bottom detail
2. **Ventilation drying** — air movement through the cavity accelerates evaporation of residual moisture from WRB and sheathing surfaces
3. **Pressure equalization** — the ventilated cavity reduces the air pressure differential across the cladding, which reduces the pressure-driven rain penetration force

#### Three-Layer Architecture

| Layer | Function | Typical Materials (PNW) | Position |
|-------|----------|------------------------|----------|
| **Exterior cladding** | Rain deflection (first line of defense) | Fiber cement, cedar siding, metal panel, stucco on lath | Outermost |
| **Air cavity** | Drainage + ventilation + pressure equalization | 3/8" to 1" clear space maintained by furring strips, proprietary spacers, or drainage mat | Between cladding and WRB |
| **WRB on sheathing** | Secondary water barrier + air barrier | House wrap, fluid-applied membrane, or self-adhered membrane on plywood/OSB sheathing | Behind air cavity, on structural wall |

#### L2 — DIY-Relevant Rain Screen Details

If you are installing siding on a new addition or re-siding your home, the simplest rain screen upgrade is to install 3/8-inch furring strips vertically over the house wrap before attaching siding. This creates a drainage and ventilation space behind the siding at minimal cost.

**Materials needed for basic rain screen furring:**

| Material | Specification | Cost (Q1 2026 PNW) |
|----------|--------------|---------------------|
| Furring strips | 3/8" x 1-1/2" cedar or pressure-treated | $0.30-0.50/linear ft |
| Stainless steel or hot-dipped galvanized nails | Length = furring + sheathing + 1" penetration into stud | $8-12/lb |
| Cor-A-Vent SV-3 or equivalent | Insect screen for top and bottom ventilation openings | $1.50-2.50/linear ft |

> **Note:**
> Furring strip material must be rot-resistant in PNW applications. Cedar heartwood or ACQ pressure-treated lumber is appropriate. Untreated pine or fir furring will deteriorate within 3-5 years in a rain screen cavity exposed to periodic wetting. Cost estimates are PNW metro area, Q1 2026 [PRO-05].

### 3.3 Rain Screen Types

#### Drained and Back-Ventilated (Full Rain Screen)

The highest-performing rain screen configuration. The air cavity is open at the top and bottom, allowing convective air flow (stack effect) to actively dry the WRB surface. Minimum cavity depth: 3/4 inch (19 mm) for effective ventilation, though 3/8 inch (10 mm) provides drainage [PRO-05].

**Best applications:** All PNW new construction; required for stucco in Climate Zones 4C and 5B per IRC 2021 R703.7.3 [CODE-01].

#### Drained (Drainage Mat or High-Drainage WRB)

A cost-effective alternative using a textured drainage mat (e.g., 1/4-inch dimple mat) or a high-drainage-efficiency WRB (tested per ASTM E2273) in place of a full air cavity. Provides drainage but limited ventilation drying [STD-18].

**Code compliance:** IRC 2021 Section R703.7.3 permits either a minimum 3/16-inch air space OR a WRB with a drainage efficiency of 90% or greater (tested per ASTM E2273) as alternatives for stucco wall systems [CODE-01; STD-18].

#### Face-Sealed (NOT Recommended for PNW)

The cladding is adhered or mechanically fastened directly to the WRB/sheathing with no drainage cavity. Relies entirely on the cladding and sealant joints to prevent all water entry. This is the system that failed in the BC leaky condo crisis.

> **BLOCK — Licensed Professional Required**
>
> Face-sealed wall assemblies (stucco, EIFS, or any cladding without a drainage cavity) are NOT recommended for new construction in PNW Climate Zone 4C. If you are evaluating an existing face-sealed assembly that shows signs of moisture damage, engage a building envelope consultant before any remediation work.
>
> **Required professional:** Building envelope consultant or licensed contractor with envelope experience
> **Why:** Face-sealed assemblies in marine climates have a documented history of concealed moisture damage that can compromise structural framing
> **Code basis:** IRC 2021 R703.7.3 now requires drainage provision for stucco; ORSC 2023 follows [CODE-01; STD-02]

### 3.4 Code Requirements for Rain Screen / Drainage

| Requirement | Oregon (ORSC 2023) | Washington (WAC 51-51, IRC 2021) | Code Section |
|-------------|-------------------|----------------------------------|-------------|
| Stucco drainage | Required: 3/16" air space OR 90%+ drainage-efficiency WRB | Required: 3/16" air space OR 90%+ drainage-efficiency WRB | IRC R703.7.3 |
| Drainage efficiency testing | Per ASTM E2273 | Per ASTM E2273 | STD-18 |
| WRB required behind all exterior cladding | Yes | Yes | IRC R703.2 |
| Flashing at all penetrations and transitions | Yes — top, sides, and sill of all openings | Yes — top, sides, and sill of all openings | IRC R703.4 |

---

## 4. Weather-Resistive Barriers (WRB)

### 4.1 WRB Types and Selection

The WRB is the last line of defense against liquid water reaching the structural sheathing and framing. In a rain screen assembly, the WRB sits behind the drainage cavity and must be both water-resistive and vapor-permeable (to allow inward drying in summer and outward drying in winter) [CODE-01; PRO-05].

| WRB Type | Examples | Vapor Permeance (perms) | Drainage Efficiency (ASTM E2273) | Best Application | Cost (Q1 2026 PNW) |
|----------|---------|------------------------|----------------------------------|-----------------|---------------------|
| **Mechanically-fastened house wrap** | Tyvek HomeWrap, Typar HouseWrap | 56 perms (Tyvek), 13 perms (Typar) | Low to moderate (flat surface) | Standard residential with rain screen furring | $0.15-0.25/sq ft material |
| **Textured/crinkled house wrap** | Tyvek DrainWrap, Tyvek CommercialWrap D | 56 perms (DrainWrap) | High (built-in drainage channels) | Residential without separate furring; stucco compliance | $0.25-0.40/sq ft material |
| **Self-adhering membrane** | Grace Vycor enV-S, Henry Blueskin VP100 | 25-50 perms (vapor-permeable types) | N/A (fully adhered = no drainage from WRB surface) | High-exposure applications; window/door rough openings; critical flashing zones | $0.75-1.50/sq ft material |
| **Fluid-applied barrier** | Prosoco R-Guard FastFlash, Henry Air-Bloc All Weather | 12-50 perms (varies by product) | N/A (fully adhered) | Complex geometries; continuous air + water barrier; commercial; retrofit | $1.00-2.00/sq ft installed |

#### L4 — Professional Selection Guide

| Project Condition | Recommended WRB Strategy | Rationale |
|------------------|-------------------------|-----------|
| Standard wood-frame residential, rain screen with furring | Mechanically-fastened house wrap + self-adhered flashing at openings | Cost-effective; drainage provided by air cavity |
| Stucco cladding without separate furring strips | Textured house wrap (90%+ drainage per ASTM E2273) OR standard wrap + drainage mat | IRC R703.7.3 compliance [CODE-01; STD-18] |
| High-rise residential or commercial (IBC scope) | Fluid-applied air/water barrier over exterior sheathing | Continuous air barrier required; handles complex geometry; eliminates laps and seams |
| Retrofit/re-cladding over existing sheathing | Fluid-applied or self-adhered membrane | Conforms to irregular existing surfaces; provides air sealing upgrade |

### 4.2 Installation Standards

> **GATE — Verify Before Proceeding**
>
> Before installing any WRB:
> - [ ] Structural sheathing is complete, fastened per schedule, and dry (moisture content below 19%)
> - [ ] All window and door rough openings are framed and square
> - [ ] Flashing materials are compatible with selected WRB (check manufacturer compatibility matrix)
> - [ ] Installation temperature is within manufacturer's specified range (most fluid-applied products require above 25 degrees F / -4 degrees C)
>
> **If any item cannot be confirmed:** Address deficiency before WRB installation. Wet sheathing trapped behind WRB will not dry and can cause mold growth within weeks [PRO-05]

**Shingling principle (critical for all WRB installations):**

All WRB layers must overlap with upper layers covering lower layers, exactly like roof shingles. This ensures water flowing down the surface is always directed over (not behind) the next layer below. The minimum overlap is typically 6 inches horizontal and 6 inches vertical, though manufacturer specifications vary [CODE-01].

**Sequence for mechanically-fastened house wrap:**

1. Start at the bottom of the wall. First course wraps continuously around corners with minimum 12-inch corner overlap.
2. Second course overlaps first course by minimum 6 inches (horizontal lap).
3. Vertical seams overlap minimum 6 inches with the upstream piece (relative to water flow) on top.
4. Tape all seams with manufacturer-approved tape. Contractor-grade tape must be UV-stable and maintain adhesion through PNW rain/freeze cycling.
5. Window and door openings: cut WRB in an inverted-Y pattern at the head, fold flaps into the rough opening, and integrate with pan flashing (see Section 9).

### 4.3 Common WRB Installation Defects

| Defect | Consequence | How Inspectors Identify It | Fix |
|--------|-------------|---------------------------|-----|
| Reverse lap (lower layer over upper) | Water directed behind WRB at every lap | Visual — look for bottom-over-top overlaps | Remove and re-install affected sections |
| Unsealed fastener penetrations | Each staple/nail creates a water entry point | Count visible unsealed penetrations per 100 sq ft | Apply cap staples or re-fasten with cap nails; seal with flashing tape |
| WRB installed over wet sheathing | Trapped moisture causes mold, rot under WRB | Moisture meter readings on sheathing at rough openings | Remove WRB, dry sheathing to <19% MC, reinstall |
| Missing corner overlap | Water penetration at building corners | Visual — look for butt joints at corners | Add corner patch with minimum 12" overlap each side |
| Incompatible flashing tape on WRB | Tape delaminates over time, exposing seams | Pull test on tape edges during inspection | Remove failed tape, clean surface, re-tape with compatible product |

---

## 5. Roofing Systems

### 5.1 Overview of PNW Roofing Options

The roof is the first line of envelope defense. PNW roofs must handle sustained winter rain, occasional snow loads at elevation, high UV exposure in summer, moss and algae growth, and — in some areas — wildfire ember exposure [STD-08; STD-13].

| Roofing System | Typical Lifespan (PNW) | Min Slope | Cost Installed (Q1 2026 PNW) | Best Application | Source |
|---------------|----------------------|-----------|------------------------------|-----------------|--------|
| **Composition (asphalt) shingle** | 20-30 years | 2:12 (4:12 standard) | $4.50-7.50/sq ft | Most common residential; cost-effective | CODE-01 |
| **Standing seam metal** | 40-60 years | 1/2:12 minimum | $10-18/sq ft | Increasingly popular PNW; excellent rain shedding; low maintenance | CODE-01 |
| **Membrane — TPO** | 20-30 years | 1/4:12 minimum | $6-10/sq ft | Low-slope commercial and residential additions | CODE-01 |
| **Membrane — EPDM** | 25-35 years | 1/4:12 minimum | $5-9/sq ft | Low-slope commercial; proven long-term performance | CODE-01 |
| **Cedar shake/shingle** | 25-40 years (with maintenance) | 3:12 (shake), 4:12 (shingle) | $12-20/sq ft | Historic/aesthetic; requires maintenance; fire risk in WUI | CODE-01 |
| **Tile (concrete or clay)** | 50-75 years | 2-1/2:12 | $15-25/sq ft | Limited PNW use; weight requires structural verification | CODE-01 |
| **Green/vegetated roof** | 30-50 years (membrane life) | 0:12 to 2:12 | $20-40/sq ft | Portland incentives (ecoroof program); stormwater management | GOV-03 |

> **Note:**
> All cost figures are per square foot of roof area, PNW metro (Portland/Seattle), Q1 2026, for typical residential installation including tear-off of one existing layer. Costs vary significantly by roof complexity (number of valleys, penetrations, height), access difficulty, and regional labor market. Rural areas may see 10-20% lower material costs but similar or higher labor costs due to travel [PRO-05].

### 5.2 Underlayment Requirements

Roof underlayment provides secondary water protection beneath the primary roof covering. Requirements vary by roof type and slope [CODE-01].

| Condition | Required Underlayment | Code Basis |
|-----------|---------------------|-----------|
| Composition shingles, slope >= 4:12 | One layer ASTM D226 Type I (15# felt) or ASTM D4869 Type I synthetic | IRC R905.2.7 |
| Composition shingles, slope 2:12 to < 4:12 | Two layers underlayment (double coverage) | IRC R905.2.7 |
| Ice barrier (eave protection) | Self-adhering polymer-modified bitumen membrane, extending from eave to 24" past interior wall line | IRC R905.2.7.1 |
| Standing seam metal, slope >= 3:12 | One layer underlayment | IRC R905.10.3 |
| Standing seam metal, slope 1/2:12 to < 3:12 | Two layers underlayment OR self-adhered membrane | IRC R905.10.3 |

> **PNW Regional Note:**
> Ice dam formation is uncommon in the PNW marine climate (Climate Zone 4C) due to mild winter temperatures, but ice barrier underlayment at eaves is still code-required where the January mean temperature is 25 degrees F or below. In Climate Zone 5B (eastern OR/WA), ice dams are a real concern, and ice barrier underlayment is mandatory at eaves, valleys, and around all roof penetrations.
>
> *Applies to: Both OR and WA — verify by climate zone*

### 5.3 PNW-Specific Roofing Concerns

**Moss and algae growth:** PNW's mild, moist climate promotes heavy moss growth on north-facing and shaded roof surfaces. Moss roots lift shingle tabs, accelerates granule loss, and traps moisture against the roof surface. Prevention includes zinc or copper ridge strips (galvanic moss inhibitors) and periodic treatment with zinc sulfate solution. Physical removal by scraping (never pressure washing — this destroys shingle granules) is necessary when moss thickness exceeds 1/2 inch [PRO-05].

**Ventilation:** Proper roof ventilation is critical for moisture management in the PNW. The code-minimum ratio is 1:150 net free ventilation area (NFVA) to attic floor area, reduced to 1:300 if ventilation is balanced between intake and exhaust or if a Class I or II vapor retarder is installed on the warm side of the ceiling [IRC R806.2; CODE-01]. Ridge vent with continuous soffit intake is the preferred configuration. Power ventilators are generally not recommended — they can create negative pressure in the attic that pulls conditioned air (and moisture) from the living space.

**Gutter sizing:** PNW rainfall intensity, while moderate on average, includes sustained multi-day events. Standard 5-inch K-style gutters are adequate for most residential roofs up to approximately 600 sq ft of drainage area per downspout. For larger roof areas or steep slopes, 6-inch gutters with 3x4-inch downspouts are recommended. Gutter overflow due to debris clogging is a leading cause of fascia rot and foundation moisture problems in the PNW — gutter guards or regular cleaning (2-3 times per year minimum) are essential maintenance items [PRO-05].

---

## 6. Wall Cladding Systems

### 6.1 Fiber Cement Siding (Dominant PNW Residential)

Fiber cement siding (commonly known by the brand name HardiePlank, manufactured by James Hardie) is the dominant residential cladding material in the PNW. It combines moisture resistance, dimensional stability, fire resistance (non-combustible), and low maintenance with reasonable cost [CODE-01; PRO-05].

**Key specifications:**

| Property | Value | Standard |
|----------|-------|---------|
| Thickness (lap siding) | 5/16" (standard), 5/8" (thick) | ASTM C1186 |
| Width (exposed face) | 5-1/4" to 8-1/4" typical | Manufacturer spec |
| Fire resistance | Non-combustible; Class A flame spread | ASTM E136 |
| Moisture absorption | Low (<15% by weight) | ASTM C1185 |
| Freeze-thaw resistance | >200 cycles without damage | ASTM C1185 |
| Warranty | 30 years (non-prorated, transferable — James Hardie) | Manufacturer |

**Installation requirements (PNW-specific):**

- Bottom edge must be minimum 6 inches above finished grade (8 inches recommended for PNW splash-back) [IRC R703.4; CODE-01]
- All cut edges must be sealed with manufacturer-approved primer/paint to prevent moisture wicking
- Fasteners: corrosion-resistant (hot-dipped galvanized or stainless steel) nails or screws, 1-1/4" minimum penetration into studs
- Joint treatment: butt joints caulked with paintable, flexible sealant (NP1 polyurethane or equivalent), or metal H-bar flashing at joints for rain screen installations
- When installed over rain screen furring: use ring-shank nails long enough to penetrate through furring + sheathing and minimum 1-1/4" into stud

### 6.2 Wood Siding (Cedar — Historically Dominant)

Western red cedar has been the traditional PNW siding material for over a century. It offers natural rot resistance (heartwood only), beauty, and excellent workability. However, it requires ongoing maintenance (staining or painting every 5-7 years), is combustible (significant concern in WUI zones), and has become increasingly expensive as old-growth supply has diminished [CODE-01; PRO-05].

| Application | Specification | PNW Note |
|------------|--------------|----------|
| Bevel siding | 1/2" x 6" or 1/2" x 8" clear heartwood | Most common traditional profile |
| Board and batten | 1x8 or 1x10 boards with 1x3 battens | Common on agricultural/rural PNW buildings |
| Channel rustic (tongue and groove) | 1x6 or 1x8 | Horizontal or vertical application |
| Shingle siding | #1 grade ("Blue Label") or #2 ("Red Label") | Must be over rain screen in PNW; direct application not recommended |

> **Note:**
> Cedar sapwood is NOT rot-resistant — only heartwood provides natural durability. "Tight-knot cedar" (TKC) siding contains both heartwood and sapwood and must be back-primed and face-finished for PNW exterior use. Unfinished cedar will weather to a silver-gray patina over 2-3 years; this is cosmetic, not structural, but many homeowners find the inconsistent weathering pattern unacceptable. Cost range: $5-12/sq ft installed, PNW metro, Q1 2026 [PRO-05].

### 6.3 Stucco with PNW Drainage Requirements

Three-coat portland cement stucco (traditional stucco) is used in PNW construction but requires specific moisture management provisions that go beyond standard practice in drier climates [CODE-01; STD-18].

**IRC R703.7.3 requirement (critical for PNW):**

Stucco applied over wood-based sheathing in Climate Zones 4C and higher requires EITHER:

1. A minimum 3/16-inch air space between the stucco and the WRB, OR
2. A WRB with a drainage efficiency of 90% or greater when tested per ASTM E2273

This requirement applies in both Oregon (ORSC 2023) and Washington (WAC 51-51) [CODE-01; STD-02; STD-10; STD-18].

**Practical compliance methods:**

| Method | How It Works | Pros | Cons |
|--------|-------------|------|------|
| Stucco over self-furring metal lath on two layers of WRB | Self-furring lath creates ~1/4" space; two WRB layers provide redundancy | Simple, well-understood | Lath space may not fully comply with 3/16" requirement depending on interpretation |
| Stucco over drainage mat + WRB | Dimple mat (1/4") over WRB creates drainage plane | Clear code compliance; good drainage | Added material cost (~$0.50/sq ft) |
| Stucco over rain screen furring with metal lath | 3/4" furring strips, metal lath attached to furring, stucco on lath | Highest performance; full ventilation drying | Increased wall thickness; structural attachment detailing |

### 6.4 Brick Veneer

Brick veneer in PNW construction must maintain a minimum 1-inch clear air space between the back of the brick and the WRB/sheathing surface. This air space functions as a drainage plane and must include weep holes at the base (every 24" or every third head joint in the first course) and flashing that directs water out of the cavity [IRC R703.8; CODE-01].

> **GATE — Verify Before Proceeding**
>
> Before proceeding with brick veneer installation:
> - [ ] Foundation or shelf angle can support brick weight (approximately 40 lbs/sq ft for standard modular brick)
> - [ ] Structural wall can support lateral loads from brick ties through air space
> - [ ] Flashing at base of wall cavity is properly installed with end dams, weep holes, and outward slope
> - [ ] WRB behind cavity is fully integrated with window/door flashing
>
> **If any item cannot be confirmed:** Consult structural engineer for load verification; see [M1-ST:Load-Bearing Wall Identification] for structural assessment procedures

### 6.5 Metal Panel Siding

Metal panel siding (steel or aluminum) is increasingly used in PNW contemporary residential and commercial architecture. It is non-combustible (WUI-compliant), dimensionally stable, and maintenance-free when properly finished. Installation is typically over furring strips (inherent rain screen), and panels interlock or overlap for water management [CODE-01].

---

## 7. Insulation Systems

### 7.1 Insulation Types and Properties

> **BLOCK — SC-HAZ: Hazardous Materials Warning**
>
> **Pre-1980 insulation removal:** Homes built before 1980 may contain asbestos in vermiculite insulation (Zonolite brand), pipe wrap, duct insulation, or other materials. Homes built before 1978 may have lead paint on surfaces that will be disturbed during insulation work. **DO NOT disturb suspected asbestos-containing materials or lead paint.** Testing must be performed BEFORE any insulation removal, siding removal, or window replacement in older homes.
>
> **Required professional:** Certified asbestos inspector (OR DEQ or WA L&I certified); certified lead inspector/risk assessor (EPA-certified)
> **Why:** Asbestos fiber inhalation causes mesothelioma and asbestosis; lead dust exposure causes neurological damage, especially in children
> **Code basis:** OR DEQ Asbestos Regulations (OAR 340-248); WA L&I WAC 296-65; EPA 40 CFR 745 (RRP Rule)

| Insulation Type | R-Value per Inch | Vapor Permeance | Air Sealing | Fire Resistance | Cost (Q1 2026 PNW) | Best PNW Application |
|----------------|-----------------|-----------------|-------------|----------------|---------------------|---------------------|
| **Fiberglass batt** | R-3.1 to R-3.8 | High (>30 perms) | None (requires separate air barrier) | Non-combustible | $0.50-0.80/sq ft (R-21 wall) | Standard cavity fill; budget-friendly |
| **Blown cellulose** | R-3.2 to R-3.8 | High (~30 perms when dry) | Moderate (dense-pack provides air sealing) | Class I (fire-retardant treated) | $0.80-1.20/sq ft (dense-pack wall) | Retrofit cavity fill; excellent for existing wall upgrades |
| **Open-cell spray foam** | R-3.5 to R-3.7 | High (8-14 perms at 5.5") | Excellent (continuous air seal) | Requires 15-min thermal barrier (1/2" gypsum) | $1.20-1.80/sq ft (wall cavity) | Where air sealing is critical; cathedral ceilings; complex geometry |
| **Closed-cell spray foam** | R-6.0 to R-7.0 | Low (0.8-1.5 perms at 2") | Excellent (air + vapor barrier) | Requires 15-min thermal barrier (1/2" gypsum) | $1.50-2.50/sq ft (2" applied) | Exterior-side of cavity; crawlspace walls; high-performance assemblies |
| **XPS rigid board** | R-5.0 | Low (1.0-1.5 perms at 1") | Moderate (taped joints) | Must be covered with thermal barrier | $0.60-0.90/sq ft (1" thick) | Exterior continuous insulation; below-grade |
| **EPS rigid board** | R-3.8 to R-4.2 | Moderate (3.5-5.0 perms at 1") | Moderate (taped joints) | Must be covered with thermal barrier | $0.40-0.65/sq ft (1" thick) | Exterior ci; more vapor-permeable than XPS |
| **Polyiso rigid board** | R-5.7 to R-6.5 | Low (1.0-1.5 perms at 1") | Moderate (taped joints) | Foil-faced acts as vapor barrier + radiant barrier | $0.70-1.10/sq ft (1" thick) | Exterior ci above grade; high R per inch; loses performance below ~50F |
| **Mineral wool (Rockwool)** | R-3.8 to R-4.2 | High (>30 perms) | None (requires separate air barrier) | Non-combustible to 2,150 degrees F | $0.90-1.40/sq ft (R-15 wall) | Fire-resistant assemblies; exterior ci (Comfortboard); WUI zones |

> **PNW Regional Note:**
> Polyiso rigid board insulation experiences reduced R-value at temperatures below approximately 50 degrees F due to condensation of the blowing agent within the foam cells. This is known as the "cold-weather derate." For PNW Climate Zone 5B (eastern), where winter sheathing temperatures regularly drop below 50 degrees F, designers should use the LTTR (Long-Term Thermal Resistance) value and consider a cold-weather derate factor of approximately 25%. In Climate Zone 4C (marine), this effect is less significant due to milder winter temperatures.
>
> *Applies to: Both OR and WA — more critical in Climate Zone 5B*

### 7.2 Code-Required R-Values

#### Oregon — OEESC 2025 (ASHRAE 90.1-2022 base) [STD-07; STD-21]

| Assembly | Climate Zone 4C | Climate Zone 5B | Code Section |
|----------|----------------|----------------|-------------|
| Ceiling/roof (wood frame) | R-49 | R-60 | Table R402.1.2 |
| Wall (wood frame, cavity only) | R-20 | R-20 | Table R402.1.2 |
| Wall (wood frame, cavity + continuous) | R-13+5ci OR R-20+3ci OR R-0+15ci | R-13+10ci OR R-20+5ci OR R-0+20ci | Table R402.1.2 |
| Floor over unconditioned space | R-30 | R-38 | Table R402.1.2 |
| Basement wall | R-10ci OR R-13 cavity | R-15ci OR R-19 cavity | Table R402.1.2 |
| Crawlspace wall | R-10ci | R-15ci | Table R402.1.2 |
| Slab perimeter (heated slab) | R-10, 2 ft depth | R-15, 2 ft depth | Table R402.1.2 |

#### Washington — WSEC-R 2021 [STD-15]

| Assembly | Climate Zone 4C | Climate Zone 5B | Code Section |
|----------|----------------|----------------|-------------|
| Ceiling/roof | R-49 | R-60 | WSEC-R Table R402.1.2 |
| Wall (wood frame) | R-20 OR R-13+5ci | R-20+5ci OR R-13+10ci | WSEC-R Table R402.1.2 |
| Floor | R-30 | R-38 | WSEC-R Table R402.1.2 |
| Basement/crawlspace wall | R-10ci | R-15ci | WSEC-R Table R402.1.2 |

> **Note:**
> The notation "R-13+5ci" means R-13 cavity insulation PLUS R-5 continuous insulation on the exterior of the sheathing. Continuous insulation (ci) is significantly more effective than cavity-only insulation because it eliminates thermal bridging through studs. A 2x6 wall at 16" on-center with R-20 fiberglass batts has a whole-wall R-value of approximately R-16 due to thermal bridging — adding R-5 exterior ci raises the whole-wall value to approximately R-21 and shifts the condensation plane outboard of the sheathing [STD-07; STD-21; GOV-07].

### 7.3 Insulation Installation Quality

The installed performance of insulation depends heavily on installation quality. The RESNET Grade system provides a framework [STD-07; GOV-07]:

| Installation Grade | Description | Thermal Performance |
|-------------------|-------------|-------------------|
| Grade I | Complete fill of cavity, no gaps, voids, compression, or missing insulation. Insulation makes full contact with air barrier on all 6 sides. | Achieves labeled R-value |
| Grade II | Minor gaps/voids up to 2% of cavity area. Slight compression in some areas. | 5-10% R-value degradation |
| Grade III | Gaps, voids, or compression exceeding 2% of cavity area. Missing insulation at some locations. | 15-30% R-value degradation |

> **GATE — Verify Before Proceeding**
>
> Before enclosing wall cavities (drywall installation):
> - [ ] Insulation completely fills all cavities without gaps, voids, or compression around wiring and plumbing
> - [ ] Insulation makes contact with air barrier (typically exterior sheathing + WRB) on all sides
> - [ ] All electrical boxes have insulation fitted tightly around them (not stuffed behind)
> - [ ] Rim/band joist areas are insulated and air-sealed (spray foam or cut-and-cobble rigid board with sealant)
> - [ ] Moisture content of framing lumber is below 19% (test with pin-type moisture meter)
>
> **If any item cannot be confirmed:** Do not install drywall until insulation defects are corrected. Enclosing deficient insulation makes correction extremely costly.

---

## 8. Energy Code Compliance

### 8.1 Air Sealing Requirements

Both Oregon and Washington energy codes require whole-building air sealing. Compliance is verified by blower-door testing [STD-07; STD-15].

| Requirement | Oregon (OEESC 2025) | Washington (WSEC-R 2021) | Code Section |
|-------------|-------------------|-------------------------|-------------|
| Maximum air leakage | 3.0 ACH50 (CZ 4C), 3.0 ACH50 (CZ 5B) | 3.0 ACH50 (CZ 4C), 3.0 ACH50 (CZ 5B) | R402.4.1.2 |
| Testing required | Yes — mandatory third-party blower-door test | Yes — mandatory blower-door test | R402.4.1.2 |
| Testing standard | ASTM E779 or ASTM E1827 (RESNET/ICC 380) | RESNET/ICC 380 | R402.4.1.2 |

**Critical air sealing locations for PNW residential:**

1. Sill plate to foundation (gasket or sealant)
2. Rim/band joist areas (spray foam or rigid board + sealant)
3. Wall penetrations — pipes, wires, ducts, exhaust fans
4. Electrical boxes on exterior walls (foam gaskets or sealed boxes)
5. Window and door rough openings (low-expansion foam or backer rod + sealant)
6. Attic penetrations — top plates, plumbing vents, electrical penetrations, recessed light housings
7. Dropped soffits, tray ceilings, and other architectural features that create air pathways

### 8.2 Window and Glazing Performance

| Performance Metric | Climate Zone 4C | Climate Zone 5B | Code Section |
|-------------------|----------------|----------------|-------------|
| Maximum U-factor | 0.30 (OR), 0.28 (WA) | 0.27 (OR), 0.27 (WA) | R402.1.2 |
| Maximum SHGC (south) | NR (OR), 0.40 (WA) | NR (OR), 0.40 (WA) | R402.1.2 |
| Maximum air leakage | 0.30 cfm/sq ft (all) | 0.30 cfm/sq ft (all) | R402.4.3 |

> **Note:**
> "NR" means no requirement. Oregon does not currently impose SHGC limits in either climate zone, while Washington caps SHGC at 0.40. Lower SHGC values reduce solar heat gain, which can increase heating energy in the PNW marine climate where winter solar gain is beneficial. Window selection should balance U-factor (winter heat loss) against SHGC (solar heat gain) for the specific building orientation and shading conditions. South-facing windows in the PNW benefit from higher SHGC values (0.35-0.50) to capture winter solar gain [STD-07; STD-15; GOV-07].

### 8.3 Duct Sealing and Testing

| Requirement | Oregon (OEESC 2025) | Washington (WSEC-R 2021) |
|-------------|-------------------|-------------------------|
| Duct leakage limit (total) | 4.0 cfm25/100 sq ft CFA | 4.0 cfm25/100 sq ft CFA |
| Duct leakage limit (to outside) | 4.0 cfm25/100 sq ft CFA | 4.0 cfm25/100 sq ft CFA |
| Testing required | Yes — all duct systems | Yes — all duct systems |
| Ducts in conditioned space | Exempt from leakage testing | Exempt from leakage testing |

---

## 9. Window and Door Installation

### 9.1 Flashing Principles

Window and door installation in the PNW is arguably the most critical envelope detail. The majority of residential water intrusion problems originate at window-wall interfaces — not at field-of-wall cladding. Proper flashing integrates the window unit with the WRB following the shingling principle: water that reaches any flashing surface must be directed outward, never inward [CODE-01; PRO-05].

#### The Three-Layer Flashing System

| Layer | Location | Material | Function |
|-------|----------|----------|----------|
| **Sill pan flashing** | Bottom of rough opening, sloped to exterior | Self-adhering membrane (peel-and-stick) with back dam and end dams | Catches and directs outward any water that enters at sill |
| **Jamb flashing** | Sides of rough opening, overlapping sill pan | Self-adhering membrane strips | Directs water from jambs down onto sill pan |
| **Head flashing** | Top of window, overlapping jambs | Metal drip cap + self-adhering membrane integrated under upper WRB | Prevents water entry above window from running behind jamb flashing |

### 9.2 Pan Flashing Detail (Step-by-Step)

This is the most critical flashing detail in residential construction. A failed sill pan allows water to pool inside the wall cavity at the window sill — the lowest point in the rough opening and the most vulnerable to damage [CODE-01; PRO-05].

> **GATE — Verify Before Proceeding**
>
> Before installing window pan flashing:
> - [ ] Rough opening is square, plumb, and sized per window manufacturer specifications (typically 1/2" larger than window frame on each side)
> - [ ] Rough sill is sloped toward exterior (1/4" minimum slope across sill width) or shim to create slope
> - [ ] WRB is properly installed on wall surface surrounding rough opening
> - [ ] WRB at head of opening has been cut in inverted-Y pattern, with flaps folded into opening
>
> **If any item cannot be confirmed:** Correct rough opening geometry before proceeding. Installing windows in out-of-square or improperly sized openings will cause premature seal failure and water intrusion.

**L2 — Step-by-Step Pan Flashing Procedure:**

**Phase 1: Sill Pan**

1. **Cut** a piece of self-adhering flashing membrane wide enough to cover the rough sill and extend 6 inches up each jamb (this creates the "end dams").
2. **Score** and fold the membrane to form a 1-inch-high back dam at the interior edge of the sill (water cannot flow inward past this dam).
3. **Apply** the membrane to the sill, pressing firmly into the corner where the sill meets the jamb on each side. The membrane must extend over the face of the WRB below the opening by at least 2 inches (this directs water onto the WRB exterior face).
4. **Do NOT cut** the membrane flush with the rough opening edges — the overlapping "ears" that extend up the jambs are the end dams that prevent water from running off the ends of the sill pan.

**Phase 2: Jamb Flashing**

5. **Cut** two strips of self-adhering membrane, each long enough to cover the full height of the rough opening jamb plus 2 inches top and bottom overlap.
6. **Apply** one strip to each jamb, overlapping the sill pan end dams by at least 2 inches. The jamb flashing must lap OVER the sill pan (shingling principle — upper over lower).

**Phase 3: Window Installation**

7. **Apply** a continuous bead of sealant at the nailing fin contact line on the jambs and head (NOT the sill — the sill must remain open for drainage).
8. **Set** the window into the rough opening, check for plumb, level, and square.
9. **Fasten** the nailing fin per manufacturer specifications (typically 6-8 inches on center with corrosion-resistant roofing nails or screws).

**Phase 4: Integration with WRB**

10. **Apply** self-adhering flashing tape over the nailing fin at jambs and head, integrating with the wall WRB.
11. **Fold** the WRB head flap (from the inverted-Y cut) down over the head flashing tape, and tape the WRB seam.
12. **Do NOT tape** the bottom nailing fin — it must remain open to allow any trapped water to drain out of the sill pan onto the WRB face below.

> **BLOCK — Licensed Professional Required**
>
> If you discover water damage, rot, or mold in the framing around an existing window during replacement:
>
> **Required professional:** Licensed general contractor (structural assessment may require structural engineer if damage extends to load-bearing framing)
> **Why:** Rotted framing around windows may indicate systemic envelope failure requiring assessment beyond the window area; load-bearing capacity of damaged framing must be evaluated
> **Code basis:** IRC R602.1 (framing), R703.4 (flashing) [CODE-01; STD-02]

### 9.3 Common Window Installation Defects

| Defect | Failure Mechanism | Detection | Consequence | Prevention |
|--------|-------------------|-----------|-------------|------------|
| No sill pan flashing | Water pools at lowest point in RO; wicks into framing | Infrared thermography; moisture meter at sill | Sill framing rot within 2-5 years; mold | Always install sill pan; no exceptions |
| Sill pan sealed at bottom | Trapped water cannot drain | Visual — check for sealant or tape at bottom of nailing fin | Water accumulates in pan, overflows into wall | Leave bottom edge of pan and nailing fin open for drainage |
| Head flashing under WRB (reverse shingling) | Water flows behind WRB at window head | Visual — look for WRB under head flashing tape | Water enters wall cavity above window | WRB head flap always folds OVER head flashing |
| Flat sill (no slope) | Water pools on sill rather than draining out | Level check on rough sill | Prolonged wetting of sill framing | Slope sill 1/4" minimum toward exterior |
| Foam only (no flashing) | Expanding foam is not waterproof and degrades with UV | Visual — no visible flashing tape at RO perimeter | Water entry at all window-wall interfaces | Foam is supplemental air sealing, not a substitute for flashing |

---

## 10. Wildfire-Urban Interface (WUI) Requirements

### 10.1 Applicability

WUI provisions apply to new construction and significant remodeling in designated wildfire hazard zones. Both Oregon and Washington have adopted WUI codes, though with different administrative structures [STD-08; STD-13].

| Aspect | Oregon (ORSC R327) | Washington (WAC 51-55, IWUIC) | Source |
|--------|-------------------|-------------------------------|--------|
| Effective date | August 5, 2025 | March 15, 2024 | STD-08; STD-13 |
| Base code | ORSC amendment (residential) | IWUIC (International Wildland-Urban Interface Code) | STD-08; STD-13 |
| Scope | Residential construction in designated WUI zones | All construction in designated WUI zones | STD-08; STD-13 |
| Hazard zone mapping | Oregon State Fire Marshal + local AHJ | Local fire marshal + WA DNR | GOV-01; GOV-02 |
| Applicability trigger | New construction; additions; re-roofing (some jurisdictions) | New construction; additions; significant alterations | STD-08; STD-13 |

### 10.2 Envelope Requirements for WUI Zones

| Component | Requirement | Code Basis |
|-----------|-------------|-----------|
| **Roof covering** | Class A fire rating required; no untreated cedar shake | ORSC R327; WAC 51-55 [STD-08; STD-13] |
| **Roof venting** | Ember-resistant vents required (1/16" mesh or listed ember-resistant vent) | ORSC R327; WAC 51-55 [STD-08; STD-13] |
| **Exterior wall covering (0-5 ft from grade)** | Ignition-resistant material or assembly (non-combustible, fire-retardant-treated wood, or listed ignition-resistant material) | ORSC R327; WAC 51-55 [STD-08; STD-13] |
| **Exterior wall covering (5+ ft from grade)** | Reduced requirements depending on hazard classification | ORSC R327; WAC 51-55 [STD-08; STD-13] |
| **Eaves and soffits** | Enclosed with non-combustible or ignition-resistant material; boxed eaves or fully enclosed soffits | ORSC R327; WAC 51-55 [STD-08; STD-13] |
| **Windows and glazing** | Tempered glass or multi-pane with tempered exterior lite | ORSC R327; WAC 51-55 [STD-08; STD-13] |
| **Gutters** | Non-combustible material (metal); screened to prevent ember accumulation | ORSC R327; WAC 51-55 [STD-08; STD-13] |
| **Decks and attachments** | Non-combustible or ignition-resistant decking; attachment to structure must be fire-rated | ORSC R327; WAC 51-55 [STD-08; STD-13] |
| **Defensible space** | Minimum 30-foot defensible space zone; vegetation management required | ORSC R327; WAC 51-55 [STD-08; STD-13] |

### 10.3 Compliant Material Selection for WUI Zones

| Material | WUI Compliance | Notes |
|----------|---------------|-------|
| Fiber cement siding | Compliant (non-combustible) | Preferred for WUI residential; no additional treatment needed |
| Metal siding/panel | Compliant (non-combustible) | Excellent WUI performance |
| Stucco (portland cement) | Compliant (non-combustible) | Must meet drainage requirements per IRC R703.7.3 |
| Cedar siding (untreated) | NOT compliant | Must be fire-retardant-treated (FRT) for WUI use; FRT may affect warranty |
| Composite/engineered wood siding | Varies by product | Must be tested and listed as ignition-resistant per ASTM E84 |
| Mineral wool insulation (Rockwool) | Compliant (non-combustible to 2,150 degrees F) | Excellent choice for exterior ci in WUI zones |
| Standing seam metal roofing | Compliant (Class A) | Ideal for WUI; low maintenance, ember-resistant |
| Composition shingles (Class A) | Compliant | Verify Class A rating on product certification |
| Cedar shake (untreated) | NOT compliant | Must be FRT and installed over Class A rated underlayment |

> **PNW Regional Note:**
> Wildfire risk in the PNW has increased dramatically in recent years. The 2020 Labor Day fires in Oregon burned over 1 million acres and destroyed approximately 4,000 homes. WUI code provisions are expanding, and many jurisdictions are extending WUI zones into previously "low-risk" suburban areas. Even if your current parcel is not in a designated WUI zone, consider WUI-compliant materials and construction as a risk management strategy — particularly for roofing (Class A metal or composition) and cladding (fiber cement or stucco).
>
> *Applies to: Both OR and WA*

---

## 11. Inspection and Quality Control

### 11.1 Envelope Inspection Stages

| Inspection Stage | What Is Inspected | Key Items | Timing |
|-----------------|-------------------|-----------|--------|
| **Foundation/slab** | Moisture barrier, insulation at slab edge | Vapor retarder continuity (10-mil minimum), slab insulation R-value and coverage | Before concrete pour |
| **Framing** | Wall, floor, roof structure | Sheathing attachment schedule, rough opening dimensions, structural connections | After framing, before WRB |
| **WRB/flashing** | Water management system | WRB continuity, shingling direction, flashing at all penetrations and transitions, sill pan flashing at windows | After WRB, before cladding |
| **Insulation** | Thermal and air barrier | R-value verification, installation grade (I/II/III), air sealing at penetrations, rim joist | After insulation, before drywall |
| **Blower door** | Whole-building air tightness | Maximum 3.0 ACH50 (OR and WA) | After drywall and finishing, before certificate of occupancy |
| **Final exterior** | Cladding, roofing, penetrations | Cladding attachment, clearances from grade, kick-out flashing, gutter attachment | Before certificate of occupancy |

### 11.2 L4 — Inspection Preparation Checklist

#### Pre-Inspection: WRB and Flashing

- [ ] WRB continuous from foundation to roof line with proper laps (upper over lower)
- [ ] All seams taped with manufacturer-approved tape
- [ ] Window sill pans installed with back dams and end dams; bottom edge open for drainage
- [ ] Jamb flashing overlaps sill pan; head flashing integrated under WRB
- [ ] Kick-out flashing installed where roof-wall intersections direct water to wall surface
- [ ] All penetrations (pipes, wires, hose bibs, vents) flashed and sealed
- [ ] Door threshold flashing with pan and end dams

#### Pre-Inspection: Insulation and Air Sealing

- [ ] All cavities filled to Grade I (no gaps, voids, compression, or missing insulation)
- [ ] Rim/band joist insulated and air-sealed
- [ ] Top plates sealed with foam, caulk, or gasket
- [ ] Electrical boxes on exterior walls gasketed or sealed
- [ ] All attic penetrations sealed (plumbing vents, electrical, HVAC)
- [ ] Recessed lights are IC-rated (insulation contact) and air-tight rated
- [ ] Fireplace/chimney chase sealed with fire-rated material (not expanding foam)

#### Documentation to Have on Site

- [ ] Approved plans (current revision, stamped)
- [ ] Permit card (posted and visible)
- [ ] Insulation manufacturer cut sheets with R-values
- [ ] WRB manufacturer installation instructions
- [ ] Window/door manufacturer installation instructions showing approved flashing method
- [ ] Blower-door test report (if applicable at this stage)

### 11.3 Common Rejection Reasons

| Rejection | Code Basis | Fix | Time Impact |
|-----------|-----------|-----|-------------|
| Insulation gaps at rim joist | R402.2.8 [STD-07] | Add spray foam or rigid board + sealant at all rim joist bays | 2-4 hours |
| Missing air sealing at top plates | R402.4.1 [STD-07] | Apply foam sealant or gasket at all top plate/drywall junctions | 1-2 hours per floor |
| Reverse-lapped WRB at window head | IRC R703.4 [CODE-01] | Remove and re-install WRB and head flashing in correct shingling order | 1-2 hours per window |
| No sill pan flashing | IRC R703.4 [CODE-01] | Install sill pan with back dam and end dams at all windows | 30-60 minutes per window |
| Blower door fails (>3.0 ACH50) | R402.4.1.2 [STD-07; STD-15] | Systematically locate and seal leaks using smoke pencil or IR camera during depressurization | 2-8 hours depending on severity |
| Insulation compression around wiring/plumbing | R402.2 [STD-07] | Split batts around obstructions; fill behind with cut pieces | 1-2 hours per affected area |

---

## 12. Estimating and Project Management

### 12.1 Unit Cost Table — Envelope Work

> **Note:**
> All costs are PNW metro area (Portland/Seattle), Q1 2026, for typical residential new construction. Union scale labor assumed. Adjust for: rural areas (-5% to -15% material, +0% to +10% labor); non-union (-15% to -25% labor); retrofit/remodel (+25% to +50% overall).

| Work Item | Unit | Material Cost | Labor Hours per Unit | Labor Cost | Total per Unit |
|-----------|------|--------------|---------------------|-----------|---------------|
| House wrap (Tyvek) installation | sq ft wall | $0.18 | 0.010 | $0.65 | $0.83 |
| Self-adhered flashing membrane | sq ft | $1.00 | 0.015 | $0.98 | $1.98 |
| Fiber cement siding (installed, with paint) | sq ft wall | $3.50 | 0.040 | $2.60 | $6.10 |
| Cedar bevel siding (installed, with stain) | sq ft wall | $5.00 | 0.050 | $3.25 | $8.25 |
| Composition roofing (tear-off + install) | sq ft roof | $2.00 | 0.030 | $1.95 | $3.95 |
| Standing seam metal roofing (installed) | sq ft roof | $6.50 | 0.045 | $2.93 | $9.43 |
| Fiberglass batt insulation R-21 (walls) | sq ft cavity | $0.55 | 0.008 | $0.52 | $1.07 |
| Closed-cell spray foam 2" (walls) | sq ft cavity | $1.20 | 0.012 | $0.78 | $1.98 |
| Rigid board XPS 1" exterior ci | sq ft wall | $0.70 | 0.015 | $0.98 | $1.68 |
| Window installation (standard, with flashing) | each (3x4 avg) | $450 | 2.5 | $163 | $613 |
| Blower door test (third party) | each | N/A | N/A | N/A | $300-500 |
| Rain screen furring (3/8" strips + insect screen) | sq ft wall | $0.45 | 0.012 | $0.78 | $1.23 |

### 12.2 Labor Productivity Factors

| Condition | Factor | Example |
|-----------|--------|---------|
| Ideal conditions (new construction, open access) | 1.00 | New framed wall, ground floor, dry weather |
| Second floor / scaffold work | 1.15-1.25 | Siding or window installation above 10 ft |
| Third floor / high work | 1.30-1.50 | Requires staging, safety equipment |
| Occupied building | 1.20-1.40 | Protection of finishes, limited access, dust control |
| Retrofit/remodel (existing wall modification) | 1.40-1.75 | Demolition, discovery of existing conditions, fitting to irregular surfaces |
| PNW rain season (Oct-Apr) | 1.10-1.25 | Tarp management, drying time, limited work windows |
| WUI zone compliance | 1.05-1.15 | Additional material handling, documentation, inspection requirements |

### 12.3 Material Waste Allowances

| Material | Standard Waste % | Complex Layout % | Notes |
|----------|-----------------|------------------|-------|
| Siding (fiber cement or wood) | 10% | 15-20% | Gable ends, multiple windows increase waste |
| Composition shingles | 10-12% | 15% | Valleys, hips, and complex roof geometry increase waste |
| House wrap | 5-8% | 10% | Large rolls minimize waste; many penetrations increase it |
| Rigid insulation board | 8-10% | 12-15% | Odd-shaped areas, many penetrations |
| Batt insulation | 3-5% | 8% | Standard cavity widths minimize waste |
| Flashing membrane | 15-20% | 20-25% | Cut-to-fit at each opening; significant scrap |

### 12.4 Sequencing and Coordination

| Phase | Predecessor Trade | Envelope Work | Successor Trade | Duration (typical 2,000 sq ft home) |
|-------|------------------|---------------|-----------------|--------------------------------------|
| Sheathing | Framing crew | Install wall and roof sheathing; nail per schedule | WRB installer | 2-3 days |
| WRB + flashing | Sheathing complete | House wrap, flashing at all openings and penetrations | Window/door installer | 1-2 days |
| Windows + doors | WRB + flashing | Install windows with pan flashing; integrate with WRB | Cladding installer | 2-3 days |
| Roofing | Roof sheathing + underlayment | Install roofing system, flashing, gutters | Interior framing/MEP rough-in | 3-5 days |
| Cladding | WRB + windows installed | Install exterior wall cladding (siding, stucco, etc.) | Paint/finish (exterior) | 5-10 days |
| Insulation | MEP rough-in complete, inspected | Install cavity insulation, exterior ci, air sealing | Drywall installer | 2-4 days |
| Blower door test | Drywall complete, caulking complete | Third-party air tightness testing | Final inspection | 2-3 hours |

> **PNW Regional Note:**
> Schedule exterior envelope work (WRB, cladding, roofing) for the dry season (June through September) whenever possible. If exterior work must occur during the rain season (October through May), ensure the WRB is installed and fully taped within a single day to prevent water entry into open wall cavities. Never leave open framing or unsealed sheathing exposed to PNW rain overnight — even one heavy rain event can raise sheathing moisture content above 19% and require days of drying before the WRB can be installed.
>
> *Applies to: Both OR and WA*

---

## 13. Diagnostics: Envelope Failure Identification

### 13.1 Symptom Index

| Symptom | Possible Causes | Severity | Section |
|---------|----------------|----------|---------|
| Water staining on interior drywall below windows | Failed sill pan flashing; missing kick-out flashing; cladding joint failure | High | 13.2 |
| Peeling exterior paint | Moisture migrating outward through wall assembly; inadequate back-priming | Medium | 13.3 |
| Musty smell in closets on exterior walls | Condensation or bulk water entry in wall cavity; mold growth | High | 13.4 |
| Ice damming at eaves (CZ 5B) | Air leakage from conditioned space into attic; insufficient attic insulation | Medium-High | 13.5 |
| Drafty rooms / high heating bills | Air leakage through envelope; insulation gaps; window/door seal failure | Medium | 13.6 |
| Moss growth on siding or trim | Sustained surface moisture; inadequate drainage or ventilation; shading | Low-Medium | 13.7 |
| Soft or spongy exterior trim | Wood rot from moisture intrusion; failed flashing or sealant | High | 13.8 |

### 13.2 Window Leak Diagnosis

**Symptoms:** Water staining, bubbling paint, or soft drywall below or beside windows, typically visible during or after heavy rain events.

**Root causes:**

| Cause | Likelihood | Risk Level | Investigation Method |
|-------|-----------|-----------|---------------------|
| Missing or failed sill pan flashing | Very common | High | Remove interior trim at sill; probe with moisture meter; IR camera during rain |
| Sealed (not open) sill pan drainage | Common | High | Visual inspection from exterior; check for sealant at bottom of window nailing fin |
| Reverse-lapped head flashing | Common | High | Visual from exterior during re-cladding; IR camera shows moisture above window |
| Failed sealant at cladding-window joint | Common | Medium | Visual — look for cracked, separated, or missing sealant |
| Missing kick-out flashing at roof-wall intersection above window | Moderate | High | Visual — look for water staining pattern consistent with roof runoff flowing down wall |

> **GATE — Verify Before Proceeding**
>
> Before opening walls to investigate suspected moisture damage:
> - [ ] Building was constructed before 1978: TEST for lead paint before disturbing painted surfaces
> - [ ] Building was constructed before 1980: TEST for asbestos in any materials that will be disturbed (insulation, drywall joint compound, textured ceilings, flooring)
> - [ ] Non-invasive investigation (IR camera + exterior moisture meter) performed first
> - [ ] If mold is visible or suspected: do not disturb without proper containment and PPE (N95 minimum; full containment for areas > 10 sq ft per EPA guidelines)
>
> **If any item cannot be confirmed:** Stop investigation and engage appropriate testing professional before proceeding

### 13.3 Exterior Paint Failure

**Symptoms:** Paint peeling, blistering, or flaking on exterior cladding, concentrated on specific walls or areas rather than uniformly across the building.

**Key diagnostic distinction:** Uniform fading/chalking across all exposures = normal weathering (repaint needed). Localized peeling or blistering on specific walls = moisture problem in the wall assembly driving moisture outward through the cladding.

**PNW-specific cause:** Bathroom and kitchen exhaust fans venting into the wall cavity or attic rather than to the exterior. The moisture load from a single bathroom fan improperly vented into a wall cavity can saturate the surrounding assembly within one winter season.

### 13.4 Mold in Wall Cavities

> **BLOCK — Licensed Professional Required**
>
> If mold growth exceeding 10 square feet is discovered in wall cavities, professional mold remediation is required per EPA guidelines. Do not attempt to clean, treat, or remove large-area mold without professional containment and HEPA filtration.
>
> **Required professional:** Licensed mold remediation contractor (OR CCB licensed; WA L&I licensed)
> **Why:** Improper mold disturbance spreads spores throughout the building, creating health hazards
> **Code basis:** EPA Mold Remediation in Schools and Commercial Buildings (guidance applicable to residential)

---

## 14. Sources

All source IDs reference entries in `00-source-index.md`.

### Primary Sources Used in This Module

| Source ID | Name | Application in M4 |
|-----------|------|-------------------|
| CODE-01 | International Code Council (IRC 2021, IBC 2024) | Wall covering (R703), roofing (R900), thermal envelope (R402), flashing (R703.4) |
| STD-02 | Oregon Residential Specialty Code 2023 | OR adoption of IRC 2021; residential envelope requirements |
| STD-07 | Oregon Energy Efficiency Specialty Code 2025 | OR insulation R-values, air sealing, blower door testing requirements |
| STD-08 | ORSC R327 Amendments | OR WUI residential provisions (effective Aug 5, 2025) |
| STD-10 | Washington State Residential Code (WAC 51-51) | WA adoption of IRC 2021; residential envelope requirements |
| STD-13 | Washington WUI Code (WAC 51-55) | WA wildfire-urban interface provisions (effective Mar 15, 2024) |
| STD-15 | Washington State Energy Code — Residential (WSEC-R 2021) | WA insulation R-values, air sealing, window performance requirements |
| STD-18 | ASTM E2273 | Drainage efficiency test standard for WRB and rain screen assemblies |
| STD-21 | ASHRAE Standard 90.1-2022 | Energy standard base for OEESC 2025; hygrothermal analysis reference |
| PRO-05 | Rainscreen Association in North America (RAiNA) | Rain screen design, WRB selection, moisture management technical guidance |
| GOV-01 | Oregon Building Codes Division | OR code administration and adoption |
| GOV-02 | Washington State Building Code Council | WA code administration and adoption |
| GOV-07 | WSU Energy Program | WA energy code technical assistance and interpretation |

### Cross-References to Other Modules

| Reference | Module | Topic |
|-----------|--------|-------|
| [M1-ST:Foundation Systems] | M1 — Structural | Below-grade waterproofing, foundation drainage |
| [M1-ST:Load-Bearing Wall Identification] | M1 — Structural | Structural assessment before cladding removal or wall modification |
| [M1-ST:Seismic Detailing] | M1 — Structural | Structural connections at envelope penetrations |
| [M3-PM:Mechanical Systems] | M3 — Plumbing/Mechanical | HVAC duct sealing, exhaust fan venting |
| [M5-CS:Code Reference] | M5 — Codes & Standards | Detailed code section analysis, permit requirements, inspection procedures |

---

*Module M4-BE compiled: 2026-03-08*
*Verification method: All code sections cross-referenced against current Oregon (GOV-01) and Washington (GOV-02) adoption pages; all source IDs validated against 00-source-index.md; cost estimates derived from PNW contractor market data Q1 2026*
*Safety tests: SC-HAZ (asbestos/lead warnings) — PASS; SC-SRC (source quality) — PASS; SC-NUM (numerical attribution) — PASS*
